import type { StateCreator } from 'zustand'
import { db } from '@/store/db'
import { supabase } from '@/lib/supabase'
import type { PerfilDocente, FilaHorario, NivelEducativo } from '@/types/schemas'

/**
 * PerfilSlice — Arquitectura Híbrida (Modo Tolerancia a Fallos v2)
 * Se ha optimizado para evitar bloqueos por Supabase y asegurar renderizado.
 */

export interface PerfilSlice {
    perfil: PerfilDocente | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null

    login: (dni: string, pin: string) => Promise<boolean>
    register: (dni: string, pin: string) => Promise<boolean>
    
    // Funciones Monetización
    verificarAliasLibre: (alias: string) => Promise<boolean>
    solicitarCuenta: (alias: string, nombres: string, institucion: string, celular: string) => Promise<boolean>
    notificarPago: (alias: string, metodo: string, operacion: string) => Promise<boolean>

    logout: () => void
    checkAuth: () => Promise<void>
    updatePerfil: (updates: Partial<PerfilDocente>) => Promise<void>
    updatePin: (newPin: string) => Promise<boolean>
    updateOnboarding: (
        nombre: string,
        institucion: { gereduDre: string; ugel: string; nombreIE: string; director: string },
        nivel: NivelEducativo,
        cargaHoraria: FilaHorario[],
        tipoIE?: 'JER' | 'JEC' | 'CEBA' | 'EBE' | 'EIB' | 'SFT',
        turno?: 'Mañana' | 'Tarde' | 'Noche'
    ) => Promise<void>
    setLastResource: (resource: { type: 'plan' | 'unidad' | 'sesion'; id: string; title: string; path: string }) => void
    syncScheduleWithPlanes: () => Promise<void>
    resetDatabase: () => Promise<void>
    clearError: () => void
}

export const createPerfilSlice: StateCreator<
    PerfilSlice,
    [['zustand/immer', never]],
    [],
    PerfilSlice
> = (set, get) => ({
    perfil: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (dni: string, pin: string) => {
        set((state) => { state.isLoading = true; state.error = null })
        try {
            const email = `${dni}@tizamagica.edu.pe`
            let authData = null
            try {
                // Timeout de 3 segundos para Supabase
                const { data } = await Promise.race([
                    supabase.auth.signInWithPassword({ email, password: pin }),
                    new Promise((_, reject) => setTimeout(() => reject('timeout'), 3000))
                ]) as any
                authData = data
            } catch (authErr) {
                console.warn('Supabase Login fallback:', authErr)
            }

            let perfil = await db.perfiles.where('dni').equals(dni).first()

            if (!perfil && authData?.user) {
                const { data: remoteProfile } = await supabase
                    .from('perfiles')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single()

                if (remoteProfile) {
                    perfil = remoteProfile as unknown as PerfilDocente
                    await db.perfiles.add(perfil)
                }
            }

            if (perfil) {
                // Check si está activo
                if (perfil.activo === false) {
                    set((state) => {
                        state.error = 'Tu suscripción está inactiva o suspendida por impago. Por favor, contacta con soporte para reactivar tu cuenta.'
                        state.isLoading = false
                    })
                    await supabase.auth.signOut().catch(()=> {}) // Force logout from supabase auth session
                    return false
                }

                set((state) => {
                    state.perfil = perfil!
                    state.isAuthenticated = true
                    state.isLoading = false
                    state.error = null
                })
                // Intentar asegurar que esté en Supabase (sync)
                try {
                    await supabase.from('perfiles').upsert(perfil)
                } catch (e) {
                    console.warn('Sync to Cloud after login failed:', e)
                }
                return true
            }

            set((state) => {
                state.error = 'Este usuario no existe. Por favor, selecciona la pestaña "Registrarse" arriba para crear tu cuenta.'
                state.isLoading = false
            })
            return false
        } catch (e) {
            set((state) => { state.isLoading = false })
            return false
        }
    },

    register: async (dni: string, pin: string) => {
        set((state) => { state.isLoading = true; state.error = null })
        try {
            const email = `${dni}@tizamagica.edu.pe`
            const existing = await db.perfiles.where('dni').equals(dni).first()
            if (existing) {
                // H-013 Fix: NO autenticar automáticamente — redirigir a login
                set((state) => {
                    state.error = 'Este usuario ya existe. Por favor accede con tu PIN en la pestaña "Iniciar Sesión".'
                    state.isLoading = false
                })
                return false
            }

            const localId = crypto.randomUUID()
            const newPerfil: PerfilDocente = {
                id: localId,
                dni,
                nombreCompleto: '',
                gereduDre: '', ugel: '', nombreIE: '', director: '',
                nivel: 'Primaria',
                cargaHoraria: [],
                isOnboarded: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }

            await db.perfiles.add(newPerfil)

            supabase.auth.signUp({ email, password: pin }).then(({ data }) => {
                if (data.user) {
                    const sbId = data.user.id
                    db.perfiles.update(localId, { id: sbId }).then(() => {
                        supabase.from('perfiles').upsert({ ...newPerfil, id: sbId }).then()
                    })
                }
            }).catch(() => { })

            set((state) => {
                state.perfil = newPerfil
                state.isAuthenticated = true
                state.isLoading = false
            })
            return true
        } catch (e) {
            set((state) => { state.isLoading = false })
            return false
        }
    },

    verificarAliasLibre: async (alias: string) => {
        try {
            const { data } = await supabase
                .from('solicitudes_acceso')
                .select('alias')
                .eq('alias', alias)
                .single()
            
            // Si data existe, el alias no está libre. Si da error 406 (No rows found), está libre.
            if (data) return false;
            return true;
        } catch {
            return true;
        }
    },

    solicitarCuenta: async (alias: string, nombres: string, institucion: string, celular: string) => {
        set((state) => { state.isLoading = true; state.error = null })
        try {
            const lib = await get().verificarAliasLibre(alias)
            if (!lib) {
                set((state) => { state.error = 'El Usuario de Acceso ya está reservado o en uso. Intenta con otro (ej.' + alias + '2).'; state.isLoading = false })
                return false
            }

            const { error } = await supabase.from('solicitudes_acceso').insert({
                alias: alias.trim().toLowerCase(),
                nombres,
                institucion,
                celular
            })

            if (error) throw error

            // Notificación silenciosa a Telegram
            import('@/lib/notifications').then(m => {
                m.sendTelegramNotification(nombres, institucion, alias, celular).catch(() => {})
            })

            set((state) => { state.isLoading = false })
            return true
        } catch (e: any) {
            set((state) => { state.error = e.message || 'Error al solicitar cuenta. Intenta nuevamente.'; state.isLoading = false })
            return false
        }
    },

    notificarPago: async (alias: string, metodo: string, operacion: string) => {
        set((state) => { state.isLoading = true; state.error = null })
        try {
            const { error } = await supabase
                .from('solicitudes_acceso')
                .update({ 
                    metodo_pago: metodo,
                    codigo_operacion: operacion,
                    estado: 'EN_REVISION',
                    updated_at: new Date().toISOString()
                })
                .eq('alias', alias.trim().toLowerCase())

            if (error) throw error

            set((state) => { state.isLoading = false })
            return true
        } catch (e: any) {
            set((state) => { state.error = e.message || 'Error al notificar el pago.'; state.isLoading = false })
            return false
        }
    },

    logout: async () => {
        try { await supabase.auth.signOut() } catch (e) { }
        set((state) => {
            state.perfil = null
            state.isAuthenticated = false
            state.isLoading = false
        })
    },

    checkAuth: async () => {
        // Si ya hay perfil en memoria, no bloquear
        if (get().perfil) {
            set((state) => { state.isLoading = false; state.isAuthenticated = true })
            return
        }

        set((state) => { state.isLoading = true })
        try {
            const { data } = await Promise.race([
                supabase.auth.getSession(),
                new Promise((_, reject) => setTimeout(() => reject('timeout'), 2000))
            ]) as any

            if (data?.session?.user) {
                const dni = data.session.user.email?.split('@')[0]
                const userId = data.session.user.id
                
                if (dni) {
                    // 1. Buscar localmente
                    let p = await db.perfiles.where('dni').equals(dni).first()
                    
                    // 2. Si no está local, buscar en Supabase
                    if (!p) {
                        const { data: remoteProfile } = await supabase
                            .from('perfiles')
                            .select('*')
                            .eq('id', userId)
                            .single()
                        
                        if (remoteProfile) {
                            p = remoteProfile as unknown as PerfilDocente
                            await db.perfiles.add(p)
                        }
                    }

                    if (p) {
                        set((state) => {
                            state.perfil = p!
                            state.isAuthenticated = true
                            state.isLoading = false
                        })
                        return
                    }
                }
            }
        } catch (e) { }

        // Finalizar siempre el loading
        const { isAuthenticated, perfil } = get()
        set((state) => {
            state.isLoading = false
            state.isAuthenticated = !!(isAuthenticated && perfil)
        })
    },

    updatePerfil: async (updates: Partial<PerfilDocente>) => {
        const { perfil } = get()
        if (!perfil) return
        const updated = { ...perfil, ...updates, updatedAt: new Date().toISOString() }
        await db.perfiles.put(updated)
        try { await supabase.from('perfiles').upsert(updated) } catch (e) { }
        set((state) => { state.perfil = updated })
    },

    updatePin: async (newPin: string) => {
        set((state) => { state.isLoading = true; state.error = null })
        try {
            const { error } = await supabase.auth.updateUser({ password: newPin })
            if (error) throw error
            
            set((state) => { state.isLoading = false })
            return true
        } catch (e: any) {
            set((state) => { 
                state.error = e.message || 'Error al actualizar el PIN'
                state.isLoading = false 
            })
            return false
        }
    },

    updateOnboarding: async (nombre, institucion, nivel, cargaHoraria, tipoIE, turno) => {
        const { updatePerfil } = get()
        await updatePerfil({
            nombreCompleto: nombre,
            gereduDre: institucion.gereduDre,
            ugel: institucion.ugel,
            nombreIE: institucion.nombreIE,
            director: institucion.director,
            nivel,
            tipoIE,
            turno,
            cargaHoraria,
            isOnboarded: true,
        })

        await get().syncScheduleWithPlanes()
    },

    setLastResource: (resource) => {
        const { perfil, updatePerfil } = get()
        if (!perfil) return

        // Evitar actualizaciones circulares si es el mismo
        if (perfil.lastResource?.id === resource.id && perfil.lastResource?.type === resource.type) return

        updatePerfil({ lastResource: resource })
    },

    syncScheduleWithPlanes: async () => {
        const { perfil } = get()
        if (!perfil) return

        const state = get() as any

        // Cargar planes si no están cargados para evitar duplicados
        if (!state.planesLoaded && state.loadPlanes) {
            await state.loadPlanes(perfil.id)
        }

        try {
            const { generateUniqueProjectsFromSchedule } = await import('@/lib/scheduler-utils')
            const uniqueProjects = generateUniqueProjectsFromSchedule(perfil.cargaHoraria, perfil.nivel)

            for (const project of uniqueProjects) {
                const refreshedState = get() as any
                const exists = refreshedState.planes?.some((p: any) =>
                    p.perfilDocenteId === perfil.id &&
                    p.nivel === project.nivel &&
                    p.grado === project.grado &&
                    p.area === project.area
                )
                if (!exists && state.createPlan) {
                    await state.createPlan(
                        perfil.id,
                        project.nivel,
                        project.grado,
                        project.ciclo,
                        project.area,
                        project.sesionesPorSemana
                    )
                }
            }
        } catch (e) {
            console.error('Schedule sync error:', e)
        }
    },

    resetDatabase: async () => {
        const { resetDatabase: resetDB } = await import('@/store/db')
        await resetDB()
        try { await supabase.auth.signOut() } catch (e) { }
        localStorage.removeItem('planx-storage')
        set((state) => {
            state.perfil = null
            state.isAuthenticated = false
        })
        window.location.reload()
    },

    clearError: () => { set((state) => { state.error = null }) },
})

import type { StateCreator } from 'zustand'
import { db, trackDeletion, isDeleted, trackUnitDeletion, isUnitDeleted } from '@/store/db'
import { supabase } from '@/lib/supabase'
import type { Unidad, Sesion, TipoMedianoPlazo, PlanAnual } from '@/types/schemas'
import { createDefaultUnidad, createDefaultSesion } from '@/types/schemas'

/**
 * UnidadesSlice — CRUD unidades/proyectos/módulos y sesiones
 * Persistencia: IndexedDB (Dexie.js)
 */

export interface UnidadesSlice {
    // State
    unidades: Unidad[]
    sesiones: Sesion[]
    unidadesLoaded: boolean
    isSyncing: boolean

    // Actions — Unidades
    loadUnidades: (planAnualId: string) => Promise<void>
    createUnidad: (
        planAnualId: string,
        numero: number,
        tipo: TipoMedianoPlazo,
        titulo?: string,
        situacion?: string,
        producto?: string,
    ) => Promise<Unidad>
    updateUnidad: (unidadId: string, updates: Partial<Unidad>) => Promise<void>
    deleteUnidad: (unidadId: string) => Promise<void>
    getUnidadesByPlan: (planAnualId: string) => Unidad[]

    // Actions — Sesiones
    loadSesiones: (unidadId: string) => Promise<void>
    upsertSesion: (sesion: Sesion) => Promise<void>
    upsertSesiones: (sesiones: Sesion[]) => Promise<void>
    createSesion: (unidadId: string, orden: number, titulo?: string) => Promise<Sesion>
    deleteSesion: (sesionId: string) => Promise<void>
    deleteAllSesiones: (unidadId: string) => Promise<void>
    getSesionesByUnidad: (unidadId: string) => Sesion[]
    syncSesionesFromUnidad: (unidad: Unidad, planAnual: PlanAnual) => Promise<void>
}

export const createUnidadesSlice: StateCreator<
    UnidadesSlice,
    [['zustand/immer', never]],
    [],
    UnidadesSlice
> = (set, get) => ({
    unidades: [],
    sesiones: [],
    unidadesLoaded: false,
    isSyncing: false,

    loadUnidades: async (planAnualId: string) => {
        // 1. Local Fetch
        let unidades = await db.unidades
            .where('planAnualId')
            .equals(planAnualId)
            .toArray()

        // H-023 Fix: Filtrar unidades eliminadas contra tombstones
        const filteredUnidades: Unidad[] = []
        for (const u of unidades) {
            const eliminada = await isDeleted(u.id)
            const unidadEliminada = await isUnitDeleted(u.id)
            if (!eliminada && !unidadEliminada) {
                filteredUnidades.push(u)
            } else {
                // Limpiar fantasma local
                await db.unidades.delete(u.id)
            }
        }
        unidades = filteredUnidades

        // 2. Cloud Sync
        try {
            const { data: remoteUnidades } = await supabase
                .from('unidades')
                .select('*')
                .eq('planAnualId', planAnualId)
            
            if (remoteUnidades && remoteUnidades.length > 0) {
                for (const u of remoteUnidades) {
                    // H-023: Re-verificar contra tombstones antes de aceptar datos cloud
                    if (await isDeleted(u.id)) continue
                    if (await isUnitDeleted(u.id)) continue

                    const localMatch = unidades.find(lu => lu.id === u.id)
                    if (!localMatch || new Date(u.updatedAt) > new Date(localMatch.updatedAt)) {
                        await db.unidades.put(u as unknown as Unidad)
                        if (localMatch) {
                            Object.assign(localMatch, u)
                        } else {
                            unidades.push(u as unknown as Unidad)
                        }
                    }
                }
            } else if (unidades.length > 0) {
                supabase.from('unidades').upsert(unidades).then(() => {}, (e: unknown) => {
                    if (import.meta.env.DEV) console.warn('Sync upload unidades failed:', e)
                })
            }
        } catch (e) {
            if (import.meta.env.DEV) console.warn('Sync unidades failed:', e)
        }

        // Sort by numero
        unidades.sort((a, b) => a.numero - b.numero)

        set((state) => {
            state.unidades = unidades
            state.unidadesLoaded = true
        })
    },

    createUnidad: async (planAnualId, numero, tipo, titulo = '', situacion = '', producto = '') => {
        const id = crypto.randomUUID()
        const unidad = createDefaultUnidad(id, planAnualId, numero, tipo, titulo, situacion, producto)

        await db.unidades.add(unidad)
        // Cloud Sync
        supabase.from('unidades').upsert(unidad).then()

        set((state) => {
            state.unidades.push(unidad)
            state.unidades.sort((a, b) => a.numero - b.numero)
        })

        return unidad
    },

    updateUnidad: async (unidadId: string, updates: Partial<Unidad>) => {
        const unidad = get().unidades.find((u) => u.id === unidadId)
        if (!unidad) return

        const updated = { ...unidad, ...updates, updatedAt: new Date().toISOString() }
        await db.unidades.put(updated)

        // Cloud Sync
        set((state) => { state.isSyncing = true })
        try { 
            await supabase.from('unidades').upsert(updated) 
        } catch (e) { 
        } finally {
            set((state) => { state.isSyncing = false })
        }

        set((state) => {
            const index = state.unidades.findIndex((u) => u.id === unidadId)
            if (index !== -1) {
                state.unidades[index] = updated
            }
            // Track last resource
            const appState = state as any
            if (appState.setLastResource) {
                appState.setLastResource({
                    type: 'unidad',
                    id: updated.id,
                    title: updated.diagnosticoStep.titulo || `Unidad ${updated.numero}`,
                    path: `/unidades/${updated.id}`
                })
            }
        })
    },

    deleteUnidad: async (unidadId: string) => {
        await db.unidades.delete(unidadId)
        await db.sesiones.where('unidadId').equals(unidadId).delete()

        // Cloud Sync
        try {
            await supabase.from('unidades').delete().eq('id', unidadId)
            await supabase.from('sesiones').delete().eq('unidadId', unidadId)
        } catch (e) {
            console.error('Error in cloud sync deleteUnidad:', e)
        }

        set((state) => {
            state.unidades = state.unidades.filter((u) => u.id !== unidadId)
            state.sesiones = state.sesiones.filter((s) => s.unidadId !== unidadId)
        })
    },

    getUnidadesByPlan: (planAnualId: string) => {
        return (get().unidades || []).filter((u: Unidad) => u.planAnualId === planAnualId)
    },

    // — Sesiones —

    loadSesiones: async (unidadId: string) => {
        // 1. Local Fetch Inicial
        const rawSesiones = await db.sesiones
            .where('unidadId')
            .equals(unidadId)
            .toArray()

        // 2. Filtro Severo contra Lista Negra (El bloqueo de fantasmas)
        const unitDeletedAt = await isUnitDeleted(unidadId)
        const pureSesiones: Sesion[] = []
        const toCleanLocal: string[] = []

        for (const s of rawSesiones) {
            const esEliminada = await isDeleted(s.id)
            const esAnteriorABorradoMasivo = unitDeletedAt && new Date(s.updatedAt) <= new Date(unitDeletedAt)

            if (esEliminada || esAnteriorABorradoMasivo) {
                // Es un fantasma guardado localmente de antes, debe morir
                toCleanLocal.push(s.id)
            } else {
                // Es información real y vigente
                pureSesiones.push(s as unknown as Sesion)
            }
        }

        // Limpieza de IndexedDB local
        if (toCleanLocal.length > 0) {
            await db.sesiones.bulkDelete(toCleanLocal)
        }

        // 3. Cloud Sync
        try {
            const { data: remoteSesiones, error } = await supabase
                .from('sesiones')
                .select('*')
                .eq('unidadId', unidadId)
            
            if (error) console.error('Error fetching remote sesiones:', error);
            
            if (remoteSesiones && remoteSesiones.length > 0) {
                for (const r of remoteSesiones) {
                    // Re-verificación de la nube contra la Lista Negra
                    if (await isDeleted(r.id)) continue;
                    if (unitDeletedAt && new Date(r.updatedAt) <= new Date(unitDeletedAt)) continue;

                    const localMatch = pureSesiones.find(ls => ls.id === r.id)
                    if (!localMatch || new Date(r.updatedAt) > new Date(localMatch.updatedAt)) {
                        await db.sesiones.put(r as unknown as Sesion)
                        
                        // Actualizar o agregar a nuestra lista pura de memoria
                        if (localMatch) {
                            Object.assign(localMatch, r)
                        } else {
                            pureSesiones.push(r as unknown as Sesion)
                        }
                    }
                }
            } else if (pureSesiones.length > 0) {
                await supabase.from('sesiones').upsert(pureSesiones).then()
            }
        } catch (e) { }

        pureSesiones.sort((a, b) => a.orden - b.orden)

        // 4. Inyección a Estado de React (Zustand)
        set((state) => {
            const otrasSesiones = state.sesiones.filter((s) => s.unidadId !== unidadId)
            state.sesiones = [...otrasSesiones, ...pureSesiones].sort((a, b) => a.orden - b.orden)
        })
    },

    upsertSesion: async (sesion: Sesion) => {
        const updated = { ...sesion, updatedAt: new Date().toISOString() }
        await db.sesiones.put(updated)

        // Cloud Sync
        set((state) => { state.isSyncing = true })
        try {
            const { error } = await supabase.from('sesiones').upsert(updated)
            if (error) console.error('Supabase error upsertSesion:', error)
        } catch (e) {
            console.error('Error in cloud sync upsertSesion:', e)
        } finally {
            set((state) => { state.isSyncing = false })
        }

        set((state) => {
            const index = state.sesiones.findIndex((s) => s.id === sesion.id)
            if (index !== -1) {
                state.sesiones[index] = updated
            } else {
                state.sesiones.push(updated)
                state.sesiones.sort((a, b) => a.orden - b.orden)
            }
            // Track last resource
            const appState = state as any
            if (appState.setLastResource) {
                appState.setLastResource({
                    type: 'sesion',
                    id: updated.id,
                    title: updated.titulo || `Sesión ${updated.orden}`,
                    path: `/sesiones/${updated.id}`
                })
            }
        })
    },

    upsertSesiones: async (sesiones: Sesion[]) => {
        const now = new Date().toISOString()
        const updated = sesiones.map((s) => ({ ...s, updatedAt: now }))
        await db.sesiones.bulkPut(updated)

        // Si estamos guardando nuevas, quitamos marca de unidad borrada
        const unidadId = updated[0]?.unidadId
        if (unidadId) {
            await db.table('deleted_units').delete(unidadId).catch(() => {})
            set((state) => { state.isSyncing = true })
            try {
                const { error } = await supabase.from('sesiones').upsert(updated)
                if (error) console.error('Supabase error upsertSesiones:', error)
            } catch (e) {
                console.error('Error in cloud sync upsertSesiones:', e)
            } finally {
                set((state) => { state.isSyncing = false })
            }
        }

        set((state) => {
            if (unidadId) {
                state.sesiones = [
                    ...state.sesiones.filter((s) => s.unidadId !== unidadId),
                    ...updated,
                ].sort((a, b) => a.orden - b.orden)
            }
        })
    },

    createSesion: async (unidadId: string, orden: number, titulo = '') => {
        const id = crypto.randomUUID()
        const sesion = createDefaultSesion(id, unidadId, orden, titulo)

        await db.sesiones.add(sesion)
        await db.table('deleted_units').delete(unidadId).catch(() => {})

        // Cloud Sync
        try {
            const { error } = await supabase.from('sesiones').upsert(sesion)
            if (error) console.error('Supabase error createSesion:', error)
        } catch (e) {
            console.error('Error in cloud sync createSesion:', e)
        }

        set((state) => {
            state.sesiones.push(sesion)
            state.sesiones.sort((a, b) => a.orden - b.orden)
        })

        return sesion
    },

    deleteSesion: async (sesionId: string) => {
        await trackDeletion(sesionId)

        // Optimistic UI update
        set((state) => {
            state.sesiones = state.sesiones.filter((s) => s.id !== sesionId)
        })

        await db.sesiones.delete(sesionId)

        // Cloud Sync
        try {
            const { error } = await supabase.from('sesiones').delete().eq('id', sesionId)
            if (error) console.error('Supabase error deleteSesion:', error)
        } catch (e) { }
    },

    deleteAllSesiones: async (unidadId: string) => {
        await trackUnitDeletion(unidadId)

        const currentSessions = await db.sesiones.where('unidadId').equals(unidadId).toArray()
        for (const s of currentSessions) {
            await trackDeletion(s.id)
        }

        // Optimistic UI update
        set((state) => {
            state.sesiones = state.sesiones.filter((s) => s.unidadId !== unidadId)
        })

        await db.sesiones.where('unidadId').equals(unidadId).delete()

        // Cloud Sync
        try {
            const { error } = await supabase.from('sesiones').delete().eq('unidadId', unidadId)
            if (error) console.error('Supabase error deleteAllSesiones:', error)
        } catch (e) { }
    },

    getSesionesByUnidad: (unidadId: string) => {
        return (get().sesiones || []).filter((s: Sesion) => s.unidadId === unidadId)
    },

    syncSesionesFromUnidad: async (unidad: Unidad, _planAnual: PlanAnual) => {
        const sesiones = get().sesiones.filter(s => s.unidadId === unidad.id);
        if (sesiones.length === 0) return;

        const now = new Date().toISOString();
        const updatedSesiones = sesiones.map(s => {
            // Sincronizar campos informativos que vienen de la unidad
            // El título de la sesión se mantiene si es diferente al de 4.4 Preview (opcional)
            // Pero aquí nos enfocamos en enfoques y criterios actualizados si cambiaron en M03/M04
            return {
                ...s,
                updatedAt: now
            };
        });

        await get().upsertSesiones(updatedSesiones);
    },
})

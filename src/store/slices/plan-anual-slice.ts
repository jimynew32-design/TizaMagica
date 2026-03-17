import type { StateCreator } from 'zustand'
import { db } from '@/store/db'
import { supabase } from '@/lib/supabase'
import type { PlanAnual, NivelEducativo } from '@/types/schemas'
import { createDefaultPlanAnual } from '@/types/schemas'

/**
 * PlanAnualSlice — CRUD planes anuales
 * Persistencia: IndexedDB (Dexie.js)
 */

export interface PlanAnualSlice {
    // State
    planes: PlanAnual[]
    planActivo: PlanAnual | null
    planesLoaded: boolean
    isSyncing: boolean

    // Actions
    loadPlanes: (perfilDocenteId: string) => Promise<void>
    createPlan: (
        perfilDocenteId: string,
        nivel: NivelEducativo,
        grado: string,
        ciclo: string,
        area: string,
        sesionesPorSemana?: number,
    ) => Promise<PlanAnual>
    selectPlan: (planId: string) => void
    updatePlan: (planId: string, updates: Partial<PlanAnual>) => Promise<void>
    deletePlan: (planId: string) => Promise<void>
}

export const createPlanAnualSlice: StateCreator<
    PlanAnualSlice,
    [['zustand/immer', never]],
    [],
    PlanAnualSlice
> = (set, get) => ({
    planes: [],
    planActivo: null,
    planesLoaded: false,
    isSyncing: false,

    loadPlanes: async (perfilDocenteId: string) => {
        // 1. Fetch from local DB
        let planes = await db.planes
            .where('perfilDocenteId')
            .equals(perfilDocenteId)
            .toArray()

        // 2. Fetch from Supabase as well
        try {
            const { data: remotePlanes } = await supabase
                .from('planes')
                .select('*')
                .eq('perfilDocenteId', perfilDocenteId)
            
            if (remotePlanes && remotePlanes.length > 0) {
                // Sync Supabase to Local DB (Upsert)
                for (const p of remotePlanes) {
                    const localMatch = planes.find(lp => lp.id === p.id)
                    if (!localMatch || new Date(p.updatedAt) > new Date(localMatch.updatedAt)) {
                        await db.planes.put(p as unknown as PlanAnual)
                    }
                }
                // Refresh local planes after sync
                planes = await db.planes
                    .where('perfilDocenteId')
                    .equals(perfilDocenteId)
                    .toArray()
            } else if (planes.length > 0) {
                // 3. Optional: Sync Local DB to Supabase if empty (Backup)
                await supabase.from('planes').upsert(planes)
            }
        } catch (e) {
            console.warn('Sync planes with cloud failed:', e)
        }

        set((state) => {
            state.planes = planes
            state.planesLoaded = true
            // Actualizar planActivo si ya existía para reflejar los cambios de la nube
            if (state.planActivo) {
                const updated = planes.find(p => p.id === state.planActivo?.id)
                if (updated) state.planActivo = updated
            } else if (planes.length > 0) {
                // O auto-seleccionar el primero
                state.planActivo = planes[0]
            }
        })
    },

    createPlan: async (perfilDocenteId, nivel, grado, ciclo, area, sesionesPorSemana) => {
        const id = crypto.randomUUID()
        const plan = createDefaultPlanAnual(id, perfilDocenteId, nivel, grado, ciclo, area, sesionesPorSemana)

        await db.planes.add(plan)
        
        // Sync to cloud in background
        supabase.from('planes').upsert(plan).then(() => {}, (e: unknown) => {
            if (import.meta.env.DEV) console.warn('Cloud sync createPlan failed:', e)
        })

        set((state) => {
            state.planes.push(plan)
            if (!state.planActivo) {
                state.planActivo = plan
            }
        })

        return plan
    },

    selectPlan: (planId: string) => {
        const plan = get().planes.find((p) => p.id === planId)
        if (plan) {
            set((state) => { state.planActivo = plan })
            // Track last resource
            const state = get() as any
            if (state.setLastResource) {
                state.setLastResource({
                    type: 'plan',
                    id: plan.id,
                    title: plan.area,
                    path: `/plan-anual/diagnostico`
                })
            }
        }
    },

    updatePlan: async (planId: string, updates: Partial<PlanAnual>) => {
        const plan = get().planes.find((p) => p.id === planId)
        if (!plan) return

        const updated = { ...plan, ...updates, updatedAt: new Date().toISOString() }
        await db.planes.put(updated)

        // Sync to cloud
        set((state) => { state.isSyncing = true })
        try {
            await supabase.from('planes').upsert(updated)
        } catch (e) {
            console.warn('Cloud update for plan failed:', e)
        } finally {
            set((state) => { state.isSyncing = false })
        }

        set((state) => {
            const index = state.planes.findIndex((p) => p.id === planId)
            if (index !== -1) {
                state.planes[index] = updated
            }
            if (state.planActivo?.id === planId) {
                state.planActivo = updated
            }
        })
    },

    deletePlan: async (planId: string) => {
        await db.planes.delete(planId)
        // Sync to cloud
        supabase.from('planes').delete().eq('id', planId).then(() => {}, (e: unknown) => {
            if (import.meta.env.DEV) console.warn('Cloud sync deletePlan failed:', e)
        })

        // Also delete related unidades and sesiones
        const unidades = await db.unidades.where('planAnualId').equals(planId).toArray()
        for (const u of unidades) {
            await db.sesiones.where('unidadId').equals(u.id).delete()
            // Delete from cloud
            supabase.from('sesiones').delete().eq('unidadId', u.id).then(() => {}, (e: unknown) => {
                if (import.meta.env.DEV) console.warn('Cloud sync delete sesiones failed:', e)
            })
        }
        await db.unidades.where('planAnualId').equals(planId).delete()
        // Delete from cloud
        supabase.from('unidades').delete().eq('planAnualId', planId).then(() => {}, (e: unknown) => {
            if (import.meta.env.DEV) console.warn('Cloud sync delete unidades failed:', e)
        })

        set((state) => {
            state.planes = state.planes.filter((p) => p.id !== planId)
            if (state.planActivo?.id === planId) {
                state.planActivo = state.planes[0] || null
            }
        })
    },
})

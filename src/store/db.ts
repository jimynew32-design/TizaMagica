import Dexie, { type EntityTable } from 'dexie'
import type {
    PerfilDocente,
    PlanAnual,
    Unidad,
    Sesion,
    CNEBCompetencia,
    CNEBEnfoque,
} from '@/types/schemas'
import type { HorarioConfig, CeldaHorario } from '../features/horario/types'

/**
 * PlanX System — Base de Datos Local (IndexedDB)
 * Motor: Dexie.js v4
 * Fuente de verdad: SRS §3.1
 */

// Tipos de índice para CNEB
interface CNEBIndexEntry {
    id: string
    nivel: string
    area: string
    competenciaId: string
    data: CNEBCompetencia
}

interface CNEBEnfoqueEntry {
    id?: number          // Auto-incremento
    enfoque: string
    valor: string
    data: CNEBEnfoque
}

class PlanXDatabase extends Dexie {
    perfiles!: EntityTable<PerfilDocente, 'id'>
    planes!: EntityTable<PlanAnual, 'id'>
    unidades!: EntityTable<Unidad, 'id'>
    sesiones!: EntityTable<Sesion, 'id'>
    cneb_index!: EntityTable<CNEBIndexEntry, 'id'>
    cneb_enfoques!: EntityTable<CNEBEnfoqueEntry, 'id'>
    horarios_config!: EntityTable<HorarioConfig, 'id'>
    horarios_celdas!: EntityTable<CeldaHorario, 'id'>

    constructor() {
        super('PlanXDatabase')

        this.version(5).stores({
            perfiles: 'id, dni',
            planes: 'id, perfilDocenteId, nivel, area',
            unidades: 'id, planAnualId, tipo',
            sesiones: 'id, unidadId',
            cneb_index: 'id, nivel, area, competenciaId',
            cneb_enfoques: '++id, enfoque, valor',
            horarios_config: 'id, institucionId, active',
            horarios_celdas: 'id, horarioId, docenteId, aulaId',
            deleted_ids: 'id',
            deleted_units: 'id',
        })
    }
}

/**
 * Registra un ID de unidad cuyas sesiones fueron borradas
 */
export async function trackUnitDeletion(unidadId: string): Promise<void> {
    try {
        await db.table('deleted_units').put({ id: unidadId, deletedAt: new Date().toISOString() })
    } catch (e) {
        console.warn('Error tracking unit deletion:', e)
    }
}

/**
 * Verifica si una unidad fue borrada recientemente
 */
export async function isUnitDeleted(unidadId: string): Promise<string | null> {
    try {
        const entry = await db.table('deleted_units').get(unidadId)
        return entry ? entry.deletedAt : null
    } catch {
        return null
    }
}

/**
 * Registra un ID eliminado para evitar re-sincronización
 */
export async function trackDeletion(id: string): Promise<void> {
    try {
        await db.table('deleted_ids').put({ id, deletedAt: new Date().toISOString() })
    } catch (e) {
        console.warn('Error tracking deletion:', e)
    }
}

/**
 * Verifica si un ID ha sido eliminado previamente
 */
export async function isDeleted(id: string): Promise<boolean> {
    try {
        const entry = await db.table('deleted_ids').get(id)
        return !!entry
    } catch {
        return false
    }
}

/** Singleton instance */
export const db = new PlanXDatabase()

/**
 * Limpia toda la base de datos local.
 * Usado por el botón "Reiniciar Sistema".
 */
export async function resetDatabase(): Promise<void> {
    await db.perfiles.clear()
    await db.planes.clear()
    await db.unidades.clear()
    await db.sesiones.clear()
    await db.cneb_index.clear()
    await db.cneb_enfoques.clear()
    await db.horarios_config.clear()
    await db.horarios_celdas.clear()
    // H-015 Fix: Limpiar tablas de tombstones para evitar conflictos post-reset
    await db.table('deleted_ids').clear()
    await db.table('deleted_units').clear()
}

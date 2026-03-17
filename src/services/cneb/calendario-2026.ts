/**
 * Calendario Escolar 2026 — Fechas predefinidas
 * Basado en el calendario MINEDU para el año escolar 2026.
 */

import type { UnidadResumen, TipoUnidad } from '@/types/schemas'

/** Fechas por unidad para distribución Bimestral (4 periodos × 2 unidades = 8) */
const BIMESTRE_FECHAS: string[] = [
    '2026-03-16|2026-04-17', // U1 (5 sem)
    '2026-04-20|2026-05-15', // U2 (4 sem)
    '2026-05-25|2026-06-26', // U3 (5 sem)
    '2026-06-29|2026-07-24', // U4 (4 sem)
    '2026-08-10|2026-09-11', // U5 (5 sem)
    '2026-09-14|2026-10-09', // U6 (4 sem)
    '2026-10-19|2026-11-20', // U7 (5 sem)
    '2026-11-23|2026-12-18', // U8 (4 sem)
]

/** Fechas por unidad para distribución Trimestral (3 periodos × 3 unidades = 9) */
const TRIMESTRE_FECHAS: string[] = [
    '2026-03-16|2026-04-24', // U1 (6 sem)
    '2026-04-27|2026-06-12', // U2 (6 sem - Pausa mayo)
    '2026-06-15|2026-07-24', // U3 (6 sem)
    '2026-08-10|2026-09-18', // U4 (6 sem)
    '2026-09-21|2026-11-06', // U5 (6 sem - Pausa octubre)
    '2026-11-09|2026-12-18', // U6 (6 sem)
]

/** Unidades por periodo */
export const UNITS_PER_PERIOD = {
    Bimestre: 2,
    Trimestre: 2,
} as const

/** Total de periodos */
export const TOTAL_PERIODS = {
    Bimestre: 4,
    Trimestre: 3,
} as const

/** Total de unidades */
export const TOTAL_UNITS = {
    Bimestre: 8,
    Trimestre: 6,
} as const

/** Nombres de periodos */
const PERIODO_NOMBRES = {
    Bimestre: ['Bimestre I', 'Bimestre II', 'Bimestre III', 'Bimestre IV'],
    Trimestre: ['Trimestre I', 'Trimestre II', 'Trimestre III'],
} as const

/**
 * Genera las unidades con fechas predefinidas según el tipo de periodo.
 */
export function generarUnidadesCalendario(
    periodoTipo: 'Bimestre' | 'Trimestre',
    existingUnidades?: UnidadResumen[],
): UnidadResumen[] {
    const fechas = periodoTipo === 'Bimestre' ? BIMESTRE_FECHAS : TRIMESTRE_FECHAS
    const unitsPerPeriod = UNITS_PER_PERIOD[periodoTipo]

    return fechas.map((fecha, i) => {
        const bimestre = Math.floor(i / unitsPerPeriod) + 1
        const existing = existingUnidades?.[i]

        // Unidad 1: Evaluación Diagnóstica por defecto
        const isDiagnostic = i === 0
        const defaultTitle = isDiagnostic 
            ? 'Evaluación Diagnóstica: Conociendo a nuestros estudiantes' 
            : `Unidad ${i + 1}`
        
        const defaultSituacion = isDiagnostic
            ? 'Al iniciar el año escolar, es fundamental identificar el nivel de desarrollo de las competencias de los estudiantes, sus estilos de aprendizaje, intereses y el contexto socioemocional para planificar una enseñanza pertinente.'
            : ''

        const defaultProducto = isDiagnostic ? 'Portafolio de evidencias diagnósticas' : ''
        const defaultTematica = isDiagnostic ? 'Diagnóstico integral de competencias' : ''

        return {
            id: existing?.id || crypto.randomUUID(),
            titulo: existing?.titulo || defaultTitle,
            tematica: existing?.tematica || defaultTematica,
            tipo: (existing?.tipo || 'Unidad') as TipoUnidad,
            bimestre,
            situacionSignificativa: existing?.situacionSignificativa || defaultSituacion,
            producto: existing?.producto || defaultProducto,
            fecha,
        }
    })
}

/** Obtiene el nombre del periodo para un índice de unidad global */
export function getPeriodoNombre(periodoTipo: 'Bimestre' | 'Trimestre', globalIdx: number): string {
    const unitsPerPeriod = UNITS_PER_PERIOD[periodoTipo]
    const periodIdx = Math.floor(globalIdx / unitsPerPeriod)
    return PERIODO_NOMBRES[periodoTipo][periodIdx] || ''
}

/** Obtiene todos los nombres de periodos */
export function getAllPeriodoNombres(periodoTipo: 'Bimestre' | 'Trimestre'): readonly string[] {
    return PERIODO_NOMBRES[periodoTipo]
}

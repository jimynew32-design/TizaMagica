/**
 * PlanX System — Constantes Globales
 */

export const CONSTANTS = {
    // Niveles Educativos del Perú
    NIVELES: ['Inicial', 'Primaria', 'Secundaria'] as const,

    // Configuración jerárquica por nivel
    NIVEL_CONFIG: {
        Inicial: {
            ciclos: ['I', 'II'],
            areas: [
                'Personal Social',
                'Psicomotriz',
                'Comunicación',
                'Castellano como Segunda Lengua',
                'Descubrimiento del Mundo',
                'Matemática',
                'Ciencia y Tecnología',
            ]
        },
        Primaria: {
            ciclos: ['III', 'IV', 'V'],
            areas: [
                'Personal Social',
                'Educación Física',
                'Comunicación',
                'Castellano como Segunda Lengua',
                'Arte y Cultura',
                'Matemática',
                'Ciencia y Tecnología',
                'Educación Religiosa',
                'Inglés como Lengua Extranjera',
            ]
        },
        Secundaria: {
            ciclos: ['VI', 'VII'],
            areas: [
                'Desarrollo Personal, Ciudadanía y Cívica',
                'Ciencias Sociales',
                'Educación Física',
                'Comunicación',
                'Castellano como Segunda Lengua',
                'Arte y Cultura',
                'Matemática',
                'Ciencia y Tecnología',
                'Educación para el Trabajo',
                'Educación Religiosa',
                'Inglés como Lengua Extranjera',
            ]
        }
    } as const,

    // Mapeo de Grados por Ciclo (Jerarquía Estricta)
    GRADES_BY_CICLO: {
        'I': ['0-2 años'],
        'II': ['3 años', '4 años', '5 años'],
        'III': ['1ero', '2do'],
        'IV': ['3ero', '4to'],
        'V': ['5to', '6to'],
        'VI': ['1ero', '2do'],
        'VII': ['3ero', '4to', '5to'],
    } as Record<string, string[]>,

    // Días de la semana (para carga horaria)
    DIAS: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const,

    // Número máximo de unidades por año
    MAX_UNIDADES: 8,

    // Tipos de planificación de mediano plazo
    TIPOS_MEDIANO_PLAZO: ['unidad', 'proyecto', 'modulo'] as const,

    // Tipos de instrumento de evaluación
    INSTRUMENTOS_EVALUACION: ['Lista de Cotejo', 'Rúbrica', 'Guion de Observación'] as const,

    // Niveles de logro
    NIVELES_LOGRO: ['AD', 'A', 'B', 'C'] as const,

    // Escenarios EIB
    ESCENARIOS_EIB: [
        { value: 1, label: 'Escenario 1 — Lengua materna indígena, aprendizaje de castellano' },
        { value: 2, label: 'Escenario 2 — Bilingüe con dominio de lengua indígena' },
        { value: 3, label: 'Escenario 3 — Bilingüe con dominio del castellano' },
        { value: 4, label: 'Escenario 4 — Castellano hablante en contexto EIB' },
    ] as const,

    // Ámbitos de contexto (Matriz Heatmap)
    AMBITOS_CONTEXTO: ['Familiar', 'Grupal', 'Local', 'Regional', 'Nacional'] as const,

    // Aspectos de contexto (Matriz Heatmap)
    ASPECTOS_CONTEXTO: ['Cultural', 'Económico', 'Ambiental'] as const,

    // Niveles de impacto (Heatmap)
    IMPACTOS: ['positivo', 'neutro', 'negativo'] as const,

    // Dimensiones de características particulares
    DIMENSIONES_CARACTERISTICAS: ['Cognitivo', 'Físico', 'Emocional'] as const,

    // Fechas por defecto
    DEFAULT_START_DATE: import.meta.env.VITE_DEFAULT_START_DATE || '2026-03-02',
    DEFAULT_END_DATE: import.meta.env.VITE_DEFAULT_END_DATE || '2026-04-03',

    // Versión del sistema
    VERSION: '2.0.0',
    ARCHITECTURE_LABEL: 'V2.0 Architecture • Hybrid Persistence (Local + Cloud)',
} as const


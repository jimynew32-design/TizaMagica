/**
 * PlanX System v2.0 — Esquemas TypeScript
 * Fuente de verdad: SRS §13
 */

// ============================================
// ENUMS Y TIPOS AUXILIARES
// ============================================

export type NivelEducativo = 'Inicial' | 'Primaria' | 'Secundaria'

export type TipoMedianoPlazo = 'unidad' | 'proyecto' | 'modulo'

export type Impacto = 'positivo' | 'neutro' | 'negativo'

export type NivelLogro = 'AD' | 'A' | 'B' | 'C'

export type TipoInstrumento = 'Lista de Cotejo' | 'Rúbrica' | 'Guion de Observación'

export type IAProvider = 'vertex' | 'gemini' | 'lmstudio'

export type TipoNEE = 
    | 'Ninguna'
    | 'Discapacidad Intelectual'
    | 'Discapacidad Auditiva'
    | 'Discapacidad Visual'
    | 'Discapacidad Física'
    | 'Trastorno del Espectro Autista (TEA)'
    | 'Sordoceguera'
    | 'Multidiscapacidad'
    | 'Talento y Superdotación'
    | 'Dificultades Específicas de Aprendizaje'

export const CATEGORIAS_NEE: TipoNEE[] = [
    'Ninguna',
    'Discapacidad Intelectual',
    'Discapacidad Auditiva',
    'Discapacidad Visual',
    'Discapacidad Física',
    'Trastorno del Espectro Autista (TEA)',
    'Sordoceguera',
    'Multidiscapacidad',
    'Talento y Superdotación',
    'Dificultades Específicas de Aprendizaje'
]

// ============================================
// PERFIL DEL DOCENTE (RAÍZ)
// ============================================

export interface CeldaHorario {
    ciclo: string
    grado: string
    area: string
}

export interface FilaHorario {
    horaInicio: string   // HH:mm
    horaFin: string      // HH:mm
    lunes?: CeldaHorario
    martes?: CeldaHorario
    miercoles?: CeldaHorario
    jueves?: CeldaHorario
    viernes?: CeldaHorario
}

export interface PerfilDocente {
    id: string
    dni: string
    nombreCompleto: string
    // Datos Institucionales (Onboarding Paso 2)
    gereduDre: string
    ugel: string
    nombreIE: string
    director: string
    logoInstitucionalUrl?: string
    lastResource?: {
        type: 'plan' | 'unidad' | 'sesion'
        id: string
        title: string
        path: string
    }
    // Configuración (Onboarding Paso 3)
    nivel: NivelEducativo
    cargaHoraria: FilaHorario[]
    // Estado
    isOnboarded: boolean
    activo?: boolean
    createdAt: string     // ISO date
    updatedAt: string     // ISO date
}

// ============================================
// DIAGNÓSTICO INTEGRAL (M01)
// ============================================

export interface CeldaContexto {
    texto: string
    impacto: Impacto
}

/** Matriz Heatmap 5x3 — 5 ámbitos × 3 aspectos */
export interface MatrizContexto {
    familiar: { cultural: CeldaContexto; economico: CeldaContexto; ambiental: CeldaContexto }
    grupal: { cultural: CeldaContexto; economico: CeldaContexto; ambiental: CeldaContexto }
    local: { cultural: CeldaContexto; economico: CeldaContexto; ambiental: CeldaContexto }
    regional: { cultural: CeldaContexto; economico: CeldaContexto; ambiental: CeldaContexto }
    nacional: { cultural: CeldaContexto; economico: CeldaContexto; ambiental: CeldaContexto }
}

export interface DimensionCaracteristica {
    nivel: number        // 1-5 (semáforo)
    texto: string        // Párrafo justificativo generado por IA
}

export interface CaracteristicasParticulares {
    cognitivo: DimensionCaracteristica
    fisico: DimensionCaracteristica
    emocional: DimensionCaracteristica
    observacionesGrupo: string   // Texto libre del docente sin filtros
}

export interface EstilosIntereses {
    intereses: string[]
    estrategias: string             // Descripción técnica de estilos
    edadMin: number                 // Rango de edad mínimo del grupo
    edadMax: number                 // Rango de edad máximo del grupo
    idiomas: { etiqueta: string; valor: string }[] // Dinámico: L1, L2, L3, L4...
    escenarioEIB: string            // Escenario lingüístico MINEDU
    diagnosticoSociolinguistico: string  // Párrafo generado por IA o editado manualmente
}

export interface Estudiante {
    id: string
    nombres: string
    apellidos: string
    dni: string
    genero: 'M' | 'F' | ''
    nee?: TipoNEE // Categoría oficial de NEE
    lineaBase?: NivelLogro // Nivel de logro del año anterior
}

export interface DiagnosticoIntegral {
    perfilContexto: string
    ubicacion: string
    contexto: MatrizContexto
    caracteristicas: CaracteristicasParticulares
    estilos: EstilosIntereses
    estudiantes: Estudiante[]
    cantidadEstudiantes: number
}

// ============================================
// IDENTIDAD INSTITUCIONAL (M02)
// ============================================

export interface IdentidadInstitucional {
    descripcionArea: string           // Generado por IA
    enfoquePedagogico: string[]
    lemaAula: string
    // Los datos institucionales vienen del PerfilDocente (solo lectura)
}

// ============================================
// PROPÓSITOS Y ENFOQUES (M03)
// ============================================

export type PeriodoTipo = 'Bimestre' | 'Trimestre'
export type TipoUnidad = 'Unidad' | 'Proyecto' | 'Modulo'

// --- Calendario Comunal Visual ---

export type EventoTipo = 'festividad' | 'hito' | 'actividad' | 'efemeride' | 'campana' | 'otro'
export type DateConfidence = 'alta' | 'media' | 'baja'

export interface CalendarioComunalEvent {
    id: string
    title: string
    type: EventoTipo
    date: string | null               // "YYYY-MM-DD" día único
    startDate: string | null           // Rango inicio
    endDate: string | null             // Rango fin
    recurrence: string | null          // "todos los viernes de abril"
    description: string
    transversalApproaches: string[]    // IDs de enfoques (ej. "intercultural")
    tags: string[]
    generatedByAI: boolean
    dateConfidence: DateConfidence
    needsReview: boolean
    sourceText: string                 // Fragmento del texto original
}

export interface CalendarioComunalData {
    selectedYear: number
    events: CalendarioComunalEvent[]
}

// --- Unidades y Enfoques ---

/**
 * Resumen de unidad didáctica — vive en PlanAnual.unidades[]
 * Generado automáticamente al seleccionar Bimestre/Trimestre.
 */
export interface UnidadResumen {
    id: string
    titulo: string
    tipo: TipoUnidad
    bimestre: number                  // 1-4 (bimestre) o 1-3 (trimestre)
    tematica: string                  // Eje temático central (ej: Pintura, Fracciones, etc.)
    situacionSignificativa: string
    producto: string
    fecha: string                     // "YYYY-MM-DD|YYYY-MM-DD" (inicio|término)
}

/**
 * Selección de enfoque para la distribución anual.
 * Almacena qué valores del enfoque están seleccionados.
 */
export interface EnfoqueAnualSeleccionado {
    enfoqueId: string
    valoresIds: string[]
}

// --- Tipos heredados (usados por Unidad Workflows: Step2Disena, Step4Selecciona) ---

export interface CapacidadSeleccionada {
    capacidadId: string
    seleccionada: boolean
}

export interface CompetenciaSeleccionada {
    competenciaId: string
    seleccionada: boolean
    capacidades: CapacidadSeleccionada[]
}

export interface EnfoqueSeleccionado {
    enfoqueId: string
    nombre: string
    valores: string[]
}

// ============================================
// ORIENTACIONES (M05)
// ============================================

export interface Orientaciones {
    evaluacion: {
        diagnostica: string
        formativa: string
        sumativa: string
    }
    recursos: {
        paraDocente: string
        paraEstudiante: string
    }
    metodologia: string
}

// ============================================
// PLAN ANUAL (TRONCO)
// ============================================

export interface PlanAnual {
    id: string
    perfilDocenteId: string
    nivel: NivelEducativo
    grado: string
    ciclo: string
    area: string
    sesionesPorSemana: number       // Inyectado desde el horario (Onboarding)
    // M01: Diagnóstico
    diagnostico: DiagnosticoIntegral
    // M02: Identidad
    identidad: IdentidadInstitucional
    // M03: Propósitos y Enfoques
    periodoTipo: PeriodoTipo
    calendarioComunal: string
    calendarioComunalData: CalendarioComunalData | null
    matrizCompetencias: Record<string, boolean[]>
    enfoquesTransversales: EnfoqueAnualSeleccionado[]
    unidades: UnidadResumen[]
    ejeArticulador?: string         // Tarea 3.4: Hilo Conductor del Año
    bitacoraPedagogica?: string
    // M05: Orientaciones
    orientaciones: Orientaciones
    // Metadata
    createdAt: string
    updatedAt: string
}

// ============================================
// UNIDAD / PROYECTO / MÓDULO (MEDIANO PLAZO)
// ============================================

export interface LogroFrecuencia {
    ad: number
    a: number
    b: number
    c: number
}

export interface DiagnosticoPrevio {
    totalEstudiantes: number
    logros: Record<string, LogroFrecuencia>  // competenciaId → frecuencias (counts)
    observacion: string
    necesidades: string
}

export interface DesempenoSeleccionado {
    desempenoId: string
    texto: string
    precisado: string                  // Desempeño Precisado creado por el docente
}

export interface CriterioEvaluacion {
    id: string
    descripcion: string
    evidencia: string
    fuente?: string                    // Nombre de la competencia o enfoque de origen
    tipoFuente?: 'competencia' | 'enfoque'
    valor?: string                     // Para enfoques: El nombre del valor
    actitud?: string                   // Para enfoques: La actitud asociada
    evidenciaCurricular?: string       // Para enfoques: El "Se demuestra cuando..." oficial
}

export interface WorkflowDiagnostico {
    titulo: string                     // Heredado de M04
    situacionSignificativa: string     // Editable, heredado de M04
    productoTentativo: string          // Heredado de M04
    diagnosticoPrevio: DiagnosticoPrevio
}

export interface WorkflowDisenaDetermina {
    competencias: CompetenciaSeleccionada[]     // Filtradas por M03
    desempenos: DesempenoSeleccionado[]
    criterios: CriterioEvaluacion[]             // Criterios derivados de desempeños precisados + enfoques
}

export interface DiaCalendario {
    fecha: string              // "YYYY-MM-DD"
    horasPedagogicas: number   // 1-6
    sesionIndex: number        // Grupo de sesión (0-based)
}

export interface WorkflowOrganiza {
    fechaInicio: string
    fechaTermino: string
    diasSeleccionados: DiaCalendario[]
    totalSesiones: number
    criterios: CriterioEvaluacion[]
}

export interface WorkflowSelecciona {
    enfoques: EnfoqueSeleccionado[]
}

export interface SesionGenerada {
    titulo: string
    competenciaId: string
    capacidadId: string
    desempenoId: string
    enfoque: string
    duracionMinutos: number
    orden: number
}

export interface WorkflowPreve {
    sesiones: SesionGenerada[]
}

/** Campos adicionales para Proyecto de Aprendizaje */
export interface WorkflowProyectoExtra {
    preguntaRetadora: string
    queSabemos: string
    queQueremosSaber: string
    comoLoHaremos: string
    productoFinal: string
    fases: { nombre: string; actividades: string; semanas: number }[]
}

export interface Unidad {
    id: string
    planAnualId: string
    numero: number                     // 1-8
    tipo: TipoMedianoPlazo
    // Workflow de 5 pasos
    diagnosticoStep: WorkflowDiagnostico
    disenaStep: WorkflowDisenaDetermina
    organizaStep: WorkflowOrganiza
    seleccionaStep: WorkflowSelecciona
    preveStep: WorkflowPreve
    // Datos extra para Proyecto
    proyectoExtra?: WorkflowProyectoExtra
    // Metadata
    createdAt: string
    updatedAt: string
}

// ============================================
// SESIÓN DE APRENDIZAJE (CORTO PLAZO)
// ============================================

export interface EnfoqueTransversalSesion {
    enfoqueId: string
    nombre: string
    valor: string
    actitud: string
}

export interface MomentoDidactico {
    descripcion: string
    duracionMinutos: number
    estrategiaMetodologica: string
    recursosMateriales: string
}

export interface CriterioEvaluacionSesion {
    id: string
    competencia: string
    criterio: string
    evidencia: string
    instrumento: string
}

export interface SecuenciaDidactica {
    inicio: MomentoDidactico
    desarrollo: MomentoDidactico
    cierre: MomentoDidactico
}

export interface Sesion {
    id: string
    unidadId: string
    // Campos 3.1-3.7 (Refinados)
    titulo: string                     // 3.1 - Heredado de la Unidad
    proposito: string                  // 3.2
    objetivoEspecifico: string          // IV-A
    competenciaId: string              // 3.3 - Heredado
    capacidadId: string
    desempenoPrecisado: string
    
    // V. Enfoques Transversales de Sesión
    enfoquesTransversalesSesion: EnfoqueTransversalSesion[]
    
    evidencia: string                  // 3.4
    instrumento: TipoInstrumento       // 3.5
    instrumentoContenido: string       // Contenido del instrumento generado
    
    // VII. Evaluación más profunda
    criteriosEvaluacionSesion: CriterioEvaluacionSesion[]
    indicadorObservable: string         // VII-A
    criterioLogro: string              // VII-A
    
    secuenciaDidactica: SecuenciaDidactica  // 3.6
    recursos: string[]                 // 3.7
    guionDocente?: string              // 4.4 Guion Docente
    materialesExpress?: string          // 4.5 Materiales Express
    
    // Orden y metadata
    orden: number
    createdAt: string
    updatedAt: string
}

// ============================================
// CNEB (Currículo Nacional de Educación Básica)
// ============================================

export interface CNEBDesempeno {
    grado: string
    capacidad: string
    texto: string
}

export interface CNEBCompetencia {
    nombre: string
    estandares: Record<string, string> // Ciclo VI: "...", Ciclo VII: "..."
    capacidades: string[]
    desempenos: CNEBDesempeno[]
}

export interface CNEBAreaData {
    area: string
    nivel: NivelEducativo
    competencias: CNEBCompetencia[]
}

export interface CNEBEnfoque {
    id: string
    nombre: string
    descripcion: string
    valores: CNEBValor[]
}

export interface CNEBValor {
    id: string
    nombre: string
    actitudes: string[]
}

// ============================================
// CONFIGURACIÓN DE IA
// ============================================

export interface GoogleCloudConfig {
    project_id: string
    client_email: string
    private_key: string
    location: string
}

export interface AIConfig {
    provider: IAProvider
    geminiApiKey: string
    lmstudioUrl: string
    vertexConfig: GoogleCloudConfig
    activeModel: string
    autoRetry: boolean
    enableLogging: boolean
}

// ============================================
// DEFAULTS / FACTORIES
// ============================================

const defaultMomentoDidactico = (): MomentoDidactico => ({
    descripcion: '',
    duracionMinutos: 0,
    estrategiaMetodologica: '',
    recursosMateriales: '',
})

const defaultCeldaContexto = (): CeldaContexto => ({
    texto: '',
    impacto: 'neutro',
})

const defaultAmbitoContexto = () => ({
    cultural: defaultCeldaContexto(),
    economico: defaultCeldaContexto(),
    ambiental: defaultCeldaContexto(),
})

export const createDefaultDiagnostico = (): DiagnosticoIntegral => ({
    perfilContexto: 'Urbano-Marginal',
    ubicacion: '',
    contexto: {
        familiar: defaultAmbitoContexto(),
        grupal: defaultAmbitoContexto(),
        local: defaultAmbitoContexto(),
        regional: defaultAmbitoContexto(),
        nacional: defaultAmbitoContexto(),
    },
    caracteristicas: {
        cognitivo: { nivel: 3, texto: '' },
        fisico: { nivel: 3, texto: '' },
        emocional: { nivel: 3, texto: '' },
        observacionesGrupo: '',
    },
    estilos: {
        intereses: [],
        estrategias: '',
        edadMin: 6,
        edadMax: 11,
        idiomas: [
            { etiqueta: 'L1', valor: 'Castellano' },
            { etiqueta: 'L2', valor: 'No especificada' }
        ],
        escenarioEIB: 'Escenario 1: Monolingüe',
        diagnosticoSociolinguistico: '',
    },
    estudiantes: [],
    cantidadEstudiantes: 0,
})

export const createDefaultPlanAnual = (
    id: string,
    perfilDocenteId: string,
    nivel: NivelEducativo,
    grado: string,
    ciclo: string,
    area: string,
    sesionesPorSemana: number = 2,
): PlanAnual => ({
    id,
    perfilDocenteId,
    nivel,
    grado,
    ciclo,
    area,
    sesionesPorSemana,
    diagnostico: createDefaultDiagnostico(),
    identidad: { descripcionArea: '', enfoquePedagogico: [], lemaAula: '' },
    periodoTipo: 'Bimestre',
    calendarioComunal: '',
    calendarioComunalData: null,
    matrizCompetencias: {},
    enfoquesTransversales: [],
    unidades: [],
    ejeArticulador: '',
    orientaciones: {
        evaluacion: { diagnostica: '', formativa: '', sumativa: '' },
        recursos: { paraDocente: '', paraEstudiante: '' },
        metodologia: '',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
})

export const createDefaultUnidad = (
    id: string,
    planAnualId: string,
    numero: number,
    tipo: TipoMedianoPlazo,
    titulo: string = '',
    situacion: string = '',
    producto: string = '',
): Unidad => ({
    id,
    planAnualId,
    numero,
    tipo,
    diagnosticoStep: {
        titulo,
        situacionSignificativa: situacion,
        productoTentativo: producto,
        diagnosticoPrevio: { totalEstudiantes: 0, logros: {}, observacion: '', necesidades: '' },
    },
    disenaStep: { competencias: [], desempenos: [], criterios: [] },
    organizaStep: { fechaInicio: '', fechaTermino: '', diasSeleccionados: [], totalSesiones: 0, criterios: [] },
    seleccionaStep: { enfoques: [] },
    preveStep: { sesiones: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
})

export const createDefaultSesion = (
    id: string,
    unidadId: string,
    orden: number,
    titulo: string = '',
): Sesion => ({
    id,
    unidadId,
    titulo,
    proposito: '',
    objetivoEspecifico: '',
    competenciaId: '',
    capacidadId: '',
    desempenoPrecisado: '',
    enfoquesTransversalesSesion: [],
    evidencia: '',
    instrumento: 'Lista de Cotejo',
    instrumentoContenido: '',
    criteriosEvaluacionSesion: [],
    indicadorObservable: '',
    criterioLogro: '',
    secuenciaDidactica: {
        inicio: defaultMomentoDidactico(),
        desarrollo: defaultMomentoDidactico(),
        cierre: defaultMomentoDidactico(),
    },
    recursos: [],
    orden,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
})

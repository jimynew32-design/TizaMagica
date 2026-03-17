export type DiaSemana = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

// Hallazgo #4: ID Determinista para evitar duplicidad de configuraciones
export const CURRENT_CONFIG_ID = 'planx_current_config';

export interface HorarioConfig {
    id: string;
    nombreIE: string;
    cicloEscolar: string; // Ej: "2025/2026"
    nivel: 'Inicial' | 'Primaria' | 'Secundaria';
    modalidad: 'JER' | 'JEC';
    inicioJornada: string;
    finJornada: string; // HH:mm (Calculado o manual)
    duracionBloque: number;
    cantidadRecreos: number; // 0, 1, 2, 3...
    distribucionRecreos: number[]; // Array con los minutos de cada recreo [15, 30, 10]
    diasLaborables: DiaSemana[];
    bloquesPorDia: number;
    isMultiSemana?: boolean; // Soporte para Semana A / Semana B
    // Configuración Inteligente (Nuevas)
    dobleTurno?: boolean; // Mañana y Tarde
    evitarHuecosDocentes?: boolean; // Optimización de horas libres
    consistenciaAlumnos?: boolean; // Misma materia misma hora
    active?: boolean;
}

export interface BloqueHorario {
    id: string;
    dia: DiaSemana;
    inicio: string;
    fin: string;
    duracion: number;
    esZonaNula: boolean;
}

export interface CeldaHorario {
    id: string;
    bloqueId: string;
    docenteId?: string;
    aulaId?: string;
    metadata?: {
        actividad?: {
            nombreMateria: string;
            grupoId: string;
            docenteId: string;
            aulaId: string;
        }
    };
    isPinned: boolean;
}

export interface Docente {
    id: string;
    nombre: string;
    apellido?: string;
    abreviatura?: string;
    especialidad?: string;
    genero?: 'H' | 'M' | 'O'; // Hombre, Mujer, Otro
    email?: string;
    telefono?: string;
    titulo?: string;
    contrato?: string;
    cargaHorariaMax: number;
    color?: string;
    aulasPreferidasIds?: string[]; // IDs de aulas donde prefiere dictar
}

export interface Aula {
    id: string;
    nombre: string;
    abreviatura?: string;
    color?: string;
    esAulaFija?: boolean;
    seccionIdFija?: string; // ID de la sección si es aula fija
    esCompartida?: boolean;
    requiereSupervision?: boolean;
}

export interface Seccion {
    id: string;
    grado: string;
    letra: string; // ej: 'A', 'B'
    nivel: string;
    nombre?: string; // Nombre personalizado del grupo/clase
    tutorId?: string; // ID del docente tutor
    color?: string; // Color distintivo de la clase
}

export interface CargaAcademica {
    id: string;
    docenteId: string;
    materiaNombre: string;
    materiaId?: string; // Opcional, para vincular con la entidad Materia
    seccionId: string;
    horasSemanales: number;
    split: number[]; // ej: [2, 2, 1, 1] para 6 horas
    aulaId?: string; // Aula específica asignada
    aulaIds?: string[]; // IDs de las aulas seleccionadas
    aulaRules?: string[]; // ej: ['aula_fija_docente', 'aulas_materia', 'compartidas']
    aulaFija?: boolean;
    aulaCompartida?: boolean;
    periodo?: string; // ej: "Anual", "Semestre 1"
}

export type Restriccion = 
    | { id: string; tipo: 'zona_nula'; dia: DiaSemana; bloqueIndex: number }
    | { id: string; tipo: 'docente_no_disponible'; docenteId: string; dia: DiaSemana; bloqueIndex: number }
    | { id: string; tipo: 'aula_bloqueada'; aulaId: string; dia: DiaSemana; bloqueIndex: number }
    | { id: string; tipo: 'max_horas_seguidas'; valor: number }
    | { id: string; tipo: 'no_doble_materia_dia' }
    | { id: string; tipo: 'prioridad_mañana'; materias: string[] };

export interface Materia {
    id: string;
    nombre: string;
    abreviatura?: string;
    color?: string;
    horasSemanalesBase?: number;
}

export interface HorarioScenario {
    id: string;
    nombre: string;
    fechaCreacion: string;
    config: HorarioConfig;
    recursos: {
        docentes: Docente[];
        aulas: Aula[];
        secciones: Seccion[];
        materias: Materia[];
    };
    cargaAcademica: CargaAcademica[];
    restricciones: Restriccion[];
    bloques: BloqueHorario[];
    celdas: CeldaHorario[];
}

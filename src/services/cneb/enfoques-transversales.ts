/**
 * Enfoques Transversales MINEDU — Datos estáticos oficiales
 * 7 enfoques con sus valores y actitudes.
 * Fuente: CNEB 2016 — Programa Curricular de Educación Básica.
 */

export interface ValorEnfoque {
    id: string
    nombre: string
    actitud: string
    evidencia: string // "Se demuestra cuando..."
}

export interface EnfoqueTransversal {
    id: string
    nombre: string
    valores: ValorEnfoque[]
}

export const ENFOQUES_TRANSVERSALES: EnfoqueTransversal[] = [
    {
        id: 'derechos',
        nombre: 'DE DERECHOS',
        valores: [
            {
                id: 'conciencia_derechos',
                nombre: 'Conciencia de derechos',
                actitud: 'Disposición a conocer, reconocer y valorar los derechos individuales y colectivos.',
                evidencia: 'Los docentes promueven el conocimiento de los derechos humanos y la Convención sobre los Derechos del Niño.',
            },
            {
                id: 'libertad_responsabilidad',
                nombre: 'Libertad y responsabilidad',
                actitud: 'Disposición a elegir de manera voluntaria y responsable la propia forma de actuar.',
                evidencia: 'Los docentes promueven oportunidades para que los estudiantes ejerzan sus derechos en la relación con los demás.',
            },
            {
                id: 'dialogo_concertacion',
                nombre: 'Diálogo y concertación',
                actitud: 'Disposición a conversar con otras personas, intercambiando ideas o afectos de modo alternativo.',
                evidencia: 'Los docentes propician y los estudiantes practican la deliberación para arribar a consensos en la reflexión sobre asuntos públicos.',
            },
        ],
    },
    {
        id: 'atencion_diversidad',
        nombre: 'INCLUSIVO O ATENCIÓN A LA DIVERSIDAD',
        valores: [
            {
                id: 'respeto_diferencias',
                nombre: 'Respeto por las diferencias',
                actitud: 'Reconocimiento al valor inherente de cada persona y de sus derechos, por encima de cualquier diferencia.',
                evidencia: 'Docentes y estudiantes demuestran tolerancia, apertura y respeto a todos y cada uno, evitando cualquier forma de discriminación.',
            },
            {
                id: 'equidad_ensenanza',
                nombre: 'Equidad en la enseñanza',
                actitud: 'Disposición a enseñar ofreciendo a los estudiantes las condiciones y oportunidades que cada uno necesita.',
                evidencia: 'Los docentes programan y enseñan considerando tiempos, espacios y actividades diferenciadas.',
            },
            {
                id: 'confianza_persona',
                nombre: 'Confianza en la persona',
                actitud: 'Disposición a depositar expectativas en una persona, creyendo sinceramente en su capacidad de superación.',
                evidencia: 'Los docentes demuestran altas expectativas sobre todos los estudiantes, incluyendo aquellos que tienen estilos diversos.',
            },
        ],
    },
    {
        id: 'intercultural',
        nombre: 'INTERCULTURAL',
        valores: [
            {
                id: 'respeto_identidad',
                nombre: 'Respeto a la identidad cultural',
                actitud: 'Reconocimiento al valor de las diversas identidades culturales y relaciones de pertenencia de los estudiantes.',
                evidencia: 'Los docentes y estudiantes acogen con respeto a todos, sin menospreciar ni excluir a nadie en razón de su lengua, su manera de hablar, su forma de vestir, sus costumbres o sus creencias.',
            },
            {
                id: 'justicia_intercultural',
                nombre: 'Justicia',
                actitud: 'Disposición a actuar de manera justa, respetando el derecho de todos.',
                evidencia: 'Los docentes previenen y afrontan de manera directa toda forma de discriminación, propiciando una reflexión crítica.',
            },
            {
                id: 'dialogo_intercultural',
                nombre: 'Diálogo intercultural',
                actitud: 'Fomento de una interacción equitativa entre diversas culturas, mediante el diálogo y el respeto mutuo.',
                evidencia: 'Los docentes y estudiantes propician un diálogo continuo entre diversas perspectivas culturales.',
            },
        ],
    },
    {
        id: 'igualdad_genero',
        nombre: 'IGUALDAD DE GÉNERO',
        valores: [
            {
                id: 'igualdad_dignidad',
                nombre: 'Igualdad y Dignidad',
                actitud: 'Reconocimiento al valor inherente de cada persona, por encima de cualquier diferencia de género.',
                evidencia: 'Docentes y estudiantes no hacen distinciones discriminatorias entre varones y mujeres.',
            },
            {
                id: 'justicia_genero',
                nombre: 'Justicia',
                actitud: 'Disposición a actuar de modo que se dé a cada quien lo que le corresponde, sin discriminación por género.',
                evidencia: 'Los docentes fomentan una valoración sana y respetuosa del cuerpo e integridad de las personas.',
            },
            {
                id: 'empatia_genero',
                nombre: 'Empatía',
                actitud: 'Transformar las diferentes situaciones de desigualdad de género, evitando el reforzamiento de estereotipos.',
                evidencia: 'Estudiantes y docentes analizan los prejuicios entre géneros.',
            },
        ],
    },
    {
        id: 'ambiental',
        nombre: 'AMBIENTAL',
        valores: [
            {
                id: 'solidaridad_planetaria',
                nombre: 'Solidaridad planetaria y equidad intergeneracional',
                actitud: 'Disposición para colaborar con el bienestar y la calidad de vida de las generaciones presentes y futuras.',
                evidencia: 'Docentes y estudiantes desarrollan acciones de ciudadanía que demuestren conciencia sobre los eventos climáticos extremos.',
            },
            {
                id: 'justicia_solidaridad',
                nombre: 'Justicia y solidaridad',
                actitud: 'Disposición a evaluar los impactos y costos ambientales de las acciones y actividades cotidianas.',
                evidencia: 'Docentes y estudiantes realizan acciones para identificar los patrones de producción y consumo que son necesarios transformar.',
            },
            {
                id: 'respeto_vida',
                nombre: 'Respeto a toda forma de vida',
                actitud: 'Aprecio, valoración y disposición para el cuidado a toda forma de vida sobre la Tierra.',
                evidencia: 'Docentes y estudiantes promueven estilos de vida en armonía con el ambiente, revalorando los saberes locales.',
            },
        ],
    },
    {
        id: 'bien_comun',
        nombre: 'ORIENTACIÓN AL BIEN COMÚN',
        valores: [
            {
                id: 'equidad_justicia',
                nombre: 'Equidad y justicia',
                actitud: 'Disposición a reconocer que ante situaciones de inicio diferentes, se requieren compensaciones.',
                evidencia: 'Los estudiantes comparten siempre los bienes disponibles para ellos en los espacios educativos con sentido de equidad y justicia.',
            },
            {
                id: 'solidaridad_bien',
                nombre: 'Solidaridad',
                actitud: 'Disposición a trabajar cooperativa y complementariamente, buscando el bienestar común.',
                evidencia: 'Los estudiantes demuestran solidaridad con sus compañeros en toda situación en la que padecen dificultades.',
            },
            {
                id: 'empatia_bien',
                nombre: 'Empatía',
                actitud: 'Identificación afectiva con los sentimientos del otro y disposición para apoyar y comprender sus circunstancias.',
                evidencia: 'Los docentes identifican, valoran y destacan continuamente actos espontáneos de los estudiantes en beneficio de otros.',
            },
            {
                id: 'responsabilidad_bien',
                nombre: 'Responsabilidad',
                actitud: 'Disposición a valorar y proteger los bienes comunes y compartidos de un colectivo.',
                evidencia: 'Los docentes promueven oportunidades para que los estudiantes asuman responsabilidades diversas y los estudiantes las aprovechan.',
            },
        ],
    },
    {
        id: 'excelencia',
        nombre: 'BÚSQUEDA DE LA EXCELENCIA',
        valores: [
            {
                id: 'flexibilidad_apertura',
                nombre: 'Flexibilidad y apertura',
                actitud: 'Disposición para adaptarse a los cambios, modificando la propia conducta para alcanzar determinados objetivos.',
                evidencia: 'Docentes y estudiantes comparan, adquieren y emplean estrategias útiles para aumentar la eficacia de sus esfuerzos.',
            },
            {
                id: 'superacion_personal',
                nombre: 'Superación personal',
                actitud: 'Disposición a adquirir cualidades que mejorarán el propio desempeño y aumentarán el estado de satisfacción.',
                evidencia: 'Docentes y estudiantes utilizan sus cualidades y recursos al máximo posible para cumplir con éxito las metas que se proponen.',
            },
        ],
    },
]

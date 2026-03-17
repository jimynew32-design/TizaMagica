/**
 * PlanX System — Enfoques Transversales (Copia Literal CNEB)
 * Fuente: Datos oficiales de Secundaria (enfoques.json)
 */

export interface EnfoqueValor {
    valor: string;
    actitud: string;
    se_demuestra: string[];
}

export interface EnfoqueTransversal {
    enfoque: string;
    valores: EnfoqueValor[];
}

export const ENFOQUES_CNEB: EnfoqueTransversal[] = [
    {
        enfoque: "DE DERECHOS",
        valores: [
            {
                valor: "Conciencia de derechos",
                actitud: "Disposición a conocer, reconocer y valorar los derechos individuales y colectivos que tenemos las personas en el ámbito privado y público.",
                se_demuestra: [
                    "Los docentes promueven el conocimiento de los Derechos Humanos y la Convención sobre los Derechos del Niño para empoderar a los estudiantes en su ejercicio democrático.",
                    "Los docentes generan espacios de reflexión y crítica sobre el ejercicio de los derechos individuales y colectivos, especialmente en grupos y poblaciones vulnerables.",
                    "Los docentes promueven y enfatizar la práctica de los deberes y derechos de los estudiantes."
                ]
            },
            {
                valor: "Libertad y responsabilidad",
                actitud: "Disposición a elegir de manera voluntaria y responsable la propia forma de actuar dentro de una sociedad.",
                se_demuestra: [
                    "Los docentes promueven oportunidades para que los estudiantes ejerzan sus derechos en la relación con sus pares y adultos.",
                    "Los docentes promueven formas de participación estudiantil que permitan el desarrollo de competencias ciudadanas, articulando acciones con la familia y comunidad en la búsqueda del bien común."
                ]
            },
            {
                valor: "Diálogo y concertación",
                actitud: "Disposición a conversar con otras personas, intercambiando ideas o afectos de modo alternativo para construir juntos una postura común.",
                se_demuestra: [
                    "Los docentes propician y los estudiantes practican la deliberación para arribar a consensos en la reflexión sobre asuntos públicos, la elaboración de normas u otros.",
                    "Los docentes buscan soluciones y propuestas con protocolos y acuerdos con los estudiantes, sobre sus responsabilidades."
                ]
            }
        ]
    },
    {
        enfoque: "INCLUSIVO O ATENCIÓN A LA DIVERSIDAD",
        valores: [
            {
                valor: "Respeto por las diferencias",
                actitud: "Reconocimiento al valor inherente de cada persona y de sus derechos, por encima de cualquier diferencia.",
                se_demuestra: [
                    "Docentes y estudiantes demuestran tolerancia, apertura y respeto a todos y cada uno, evitando cualquier forma de discriminación basada en el prejuicio a cualquier diferencia.",
                    "Ni docentes ni estudiantes estigmatizan a nadie.",
                    "Las familias reciben información continua sobre los esfuerzos, méritos, avances y logros de sus hijos, entendiendo sus dificultades como parte de su desarrollo y aprendizaje."
                ]
            },
            {
                valor: "Equidad en la enseñanza",
                actitud: "Disposición a enseñar ofreciendo a los estudiantes las condiciones y oportunidades que cada uno necesita para lograr los mismos resultados.",
                se_demuestra: [
                    "Los docentes programan y enseñan considerando tiempos, espacios y actividades diferenciadas de acuerdo a las características y demandas de los estudiantes, las que se articulan en situaciones significativas vinculadas a su contexto y realidad."
                ]
            },
            {
                valor: "Confianza en la persona",
                actitud: "Disposición a depositar expectativas en una persona, creyendo sinceramente en su capacidad de superación y crecimiento por sobre cualquier circunstancia.",
                se_demuestra: [
                    "Los docentes demuestran altas expectativas sobre todos los estudiantes, incluyendo aquellos que tienen estilos diversos y ritmos de aprendizaje diferentes o viven en contextos difíciles.",
                    "Los docentes convocan a las familias principalmente a reforzar la autonomía, la autoconfianza y la autoestima de sus hijos, antes que a cuestionarlos o sancionarlos.",
                    "Los estudiantes protegen y fortalecen en toda circunstancia su autonomía, autoconfianza y autoestima."
                ]
            }
        ]
    },
    {
        enfoque: "INTERCULTURAL",
        valores: [
            {
                valor: "Respeto a la identidad cultural",
                actitud: "Reconocimiento al valor de las diversas identidades culturales y relaciones de pertenencia de los estudiantes.",
                se_demuestra: [
                    "Los docentes y estudiantes acogen con respeto a todos, sin menospreciar ni excluir a nadie en razón de su lengua, su manera de hablar, su forma de vestir, sus costumbres o sus conrencias.",
                    "Los docentes hablan la lengua materna de los estudiantes y los acompañan con respeto en su proceso de adquisición del castellano como segunda lengua.",
                    "Los docentes respetan todas las variantes del castellano que se hablan en distintas regiones del país, sin obligar a los estudiantes a que se expresen oralmente solo en castellano estándar."
                ]
            },
            {
                valor: "Justicia",
                actitud: "Disposición a actuar de manera justa, respetando el derecho de todos, exigiendo sus propios derechos y reconociendo derechos a quienes les corresponde.",
                se_demuestra: [
                    "Disposición a actuar de manera justa, respetando el derecho de todos, exigiendo sus propios derechos y reconociendo derechos a quienes les corresponde."
                ]
            },
            {
                valor: "Diálogo intercultural",
                actitud: "Fomento de una interacción equitativa entre diversas culturas, mediante el diálogo y el respeto mutuo.",
                se_demuestra: [
                    "Los docentes y directivos propician un diálogo continuo entre diversas perspectivas culturales, y entre estas con el saber científico, buscando complementariedades en los distintos planos en los que se formulan para el tratamiento de los desafíos comunes."
                ]
            }
        ]
    },
    {
        enfoque: "IGUALDAD DE GÉNERO",
        valores: [
            {
                valor: "Igualdad y Dignidad",
                actitud: "Reconocimiento al valor inherente de cada persona, por encima de cualquier diferencia de género.",
                se_demuestra: [
                    "Docentes y estudiantes no hacen distinciones discriminatorias entre varones y mujeres.",
                    "Estudiantes varones y mujeres tienen las mismas responsabilidades en el cuidado de los espacios educativos que utilizan."
                ]
            },
            {
                valor: "Justicia",
                actitud: "Disposición a actuar de modo que se dé a cada quien lo que le corresponde, en especial a quienes se ven perjudicados por las desigualdades de género.",
                se_demuestra: [
                    "Docentes y directivos fomentan la asistencia de las estudiantes que se encuentran embarazadas o que son madres o padres de familia.",
                    "Docentes y directivos fomentan una valoración sana y respetuosa del cuerpo e integridad de las personas; en especial, se previene y atiende adecuadamente las posibles situaciones de violencia sexual."
                ]
            },
            {
                valor: "Empatía",
                actitud: "Reconoce y valora las emociones y necesidades afectivas de los otros/as y muestra sensibilidad ante ellas al identificar situaciones de desigualdad de género, evidenciando así la capacidad de comprender o acompañar a las personas en dichas emociones o necesidades afectivas.",
                se_demuestra: [
                    "Estudiantes y docentes analizan los prejuicios entre géneros (por ejemplo: que las mujeres limpian mejor, que los hombres no son sensibles, que las mujeres son más débiles, etc.)."
                ]
            }
        ]
    },
    {
        enfoque: "AMBIENTAL",
        valores: [
            {
                valor: "Solidaridad planetaria y equidad intergeneracional",
                actitud: "Disposición para colaborar con el bienestar y la calidad de vida de las generaciones presentes y futuras, así como con la naturaleza asumiendo el cuidado del planeta.",
                se_demuestra: [
                    "Docentes y estudiantes desarrollan acciones de ciudadanía que demuestren conciencia sobre los eventos climáticos extremos ocasionados por el calentamiento global, así como el desarrollo de capacidades de resiliencia para la adaptación al cambio climático.",
                    "Docentes y estudiantes plantean soluciones en relación a la realidad ambiental de su comunidad (contaminación, salud ambiental, etc.)."
                ]
            },
            {
                valor: "Justicia y solidaridad",
                actitud: "Disposición a evaluar los impactos y costos ambientales de las acciones y actividades cotidianas, y a actuar en beneficio de todas las personas, así como de los sistemas, instituciones y medios compartidos de los que todos dependemos.",
                se_demuestra: [
                    "Docentes y estudiantes realizan acciones para identificar los patrones de producción y consumo de aquellos productos utilizados de forma cotidiana.",
                    "Docentes y estudiantes implementan las 3R (reducir, reusar y reciclar), la segregación adecuada de los residuos sólidos y medidas de ecoeficiencia.",
                    "Docentes y estudiantes impulsan acciones que contribuyan al ahorro del agua y el cuidado de las cuencas hidrográficas.",
                    "Docentes y estudiantes promueven la preservación de entornos saludables y hábitos de higiene y alimentación saludables."
                ]
            },
            {
                valor: "Respeto a toda forma de vida",
                actitud: "Aprecio, valoración y disposición para el cuidado a toda forma de vida sobre la Tierra desde una mirada sistémica y global, revalorando los saberes ancestrales.",
                se_demuestra: [
                    "Docentes planifican y desarrollan acciones pedagógicas a favor de la preservación de la flora y fauna local, promoviendo la conservación de la diversidad biológica nacional.",
                    "Docentes y estudiantes promueven estilos de vida en armonía con el ambiente, revalorando los saberes locales y el conocimiento ancestral.",
                    "Docentes y estudiantes impulsan la recuperación y uso de las áreas verdes y las áreas naturales como espacios educativos."
                ]
            }
        ]
    },
    {
        enfoque: "ORIENTACIÓN AL BIEN COMÚN",
        valores: [
            {
                valor: "Equidad y justicia",
                actitud: "Disposición a reconocer a que ante situaciones de inicio diferentes, se requieren compensaciones a aquellos con mayores dificultades.",
                se_demuestra: [
                    "Los estudiantes comparten siempre los bienes disponibles para ellos en los espacios educativos (recursos, materiales, instalaciones, tiempo, actividades, conocimientos) con sentido de equidad y justicia."
                ]
            },
            {
                valor: "Solidaridad",
                actitud: "Disposición a apoyar incondicionalmente a personas en situaciones comprometidas o difíciles.",
                se_demuestra: [
                    "Los estudiantes demuestran solidaridad con sus compañeros en toda situación en la que padecen dificultades que rebasan sus posibilidades de afrontarlas."
                ]
            },
            {
                valor: "Empatía",
                actitud: "Identificación afectiva con los sentimientos del otro y disposición para apoyar y comprender sus circunstancias.",
                se_demuestra: [
                    "Los docentes identifican, valoran y destacan continuamente actos espontáneos de los estudiantes en beneficio de otros, dirigidos a procurar o restaurar su bienestar en situaciones que lo requieran."
                ]
            },
            {
                valor: "Responsabilidad",
                actitud: "Disposición a valorar y proteger los bienes comunes y compartidos de un colectivo.",
                se_demuestra: [
                    "Los docentes promueven oportunidades para que las y los estudiantes asuman responsabilidades diversas y los estudiantes las aprovechan, tomando en cuenta su propio bienestar y el de la colectividad."
                ]
            }
        ]
    },
    {
        enfoque: "BÚSQUEDA DE LA EXCELENCIA",
        valores: [
            {
                valor: "Flexibilidad y apertura",
                actitud: "Disposición para adaptarse a los cambios, modificando si fuera necesario la propia conducta para alcanzar determinados objetivos cuando surgen dificultades, información no conocida o situaciones nuevas.",
                se_demuestra: [
                    "Docentes y estudiantes comparan, adquieren y emplean estrategias útiles para aumentar la eficacia de sus esfuerzos en el logro de los objetivos que se proponen.",
                    "Docentes y estudiantes demuestran flexibilidad para el cambio y la adaptación a circunstancias diversas, orientados a objetivos de mejora personal o grupal."
                ]
            },
            {
                valor: "Superación personal",
                actitud: "Disposición a adquirir cualidades que mejorarán el propio desempeño y aumentarán el estado de satisfacción consigo mismo y con las circunstancias.",
                se_demuestra: [
                    "Docentes y estudiantes utilizan sus cualidades y recursos al máximo posible para cumplir con éxito las metas que se proponen a nivel personal y colectivo.",
                    "Docentes y estudiantes se esfuerzan por superarse, buscando objetivos que representen avances respecto de su actual nivel de posibilidades en determinados ámbitos de desempeño."
                ]
            }
        ]
    }
];

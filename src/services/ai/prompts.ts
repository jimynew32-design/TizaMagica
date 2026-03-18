/**
 * PlanX System — Banco Completo de Prompts Pedagógicos
 * Skill: pedagogia_estilo_personalizado
 * 14 prompts con inyección de contexto docente
 */

import { PerfilDocente, PlanAnual, Unidad } from "@/types/schemas";

// ─── Helpers de Contexto ──────────────────────────────────────────────────────

const getTeacherContext = (perfil: PerfilDocente, plan?: PlanAnual) => `
PERFIL DEL DOCENTE:
- Nombre: ${perfil.nombreCompleto}
- I.E.: ${perfil.nombreIE} | UGEL: ${perfil.ugel} | DRE: ${perfil.gereduDre}
- Nivel: ${perfil.nivel}
${plan ? `- Área: ${plan.area} | Grado: ${plan.grado} | Ciclo: ${plan.ciclo}` : ''}
${plan ? `- Calendario Comunal: ${plan.calendarioComunal || 'No especificado'}` : ''}

REGLA DE ESTILO (Estilo ${perfil.nombreCompleto}):
Redacta como si fuera el propio docente. Tono empático, narrativo, voz activa.
Conecta con la realidad local, usa verbos de acción. Evita lenguaje burocrático.
100-200 palabras por sección. Menciona el contexto del aula y la comunidad.
`;

const getDiagnosticoContext = (plan: PlanAnual) => {
    const ctx = plan.diagnostico;
    return `
CONTEXTO DIAGNÓSTICO DEL AULA:
- Niveles: Cognitivo ${ctx.caracteristicas.cognitivo.nivel}/5, Físico ${ctx.caracteristicas.fisico.nivel}/5, Emocional ${ctx.caracteristicas.emocional.nivel}/5
- Intereses: ${(ctx.estilos?.intereses || []).join(', ')}
- Idiomas/Lenguas: ${(ctx.estilos?.idiomas || []).map(i => `${i.etiqueta}: ${i.valor}`).join(', ')} | Escenario EIB: ${ctx.estilos?.escenarioEIB || '—'}
- Contexto Local: ${ctx.contexto.local.cultural.texto}
`;
};

// ─── Banco de Prompts ─────────────────────────────────────────────────────────

export const PROMPTS = {

    // ─── M01: Diagnóstico ──────────────────────────────────────────────────

    /**
     * T4.5 – Genera texto para la Matriz Heatmap 5x3
     */
    POBLAR_CONTEXTO: (perfil: string, contextoZona: string, mapaImpacto: any) => `
Actúa como un experto geógrafo y antropólogo educativo peruano, especialista en el Currículo Nacional (CNEB) y Educación Intercultural Bilingüe (EIB).

1. Entradas del Sistema (Variables):
- Perfil de Contexto: ${perfil}
- Ubicación Específica: ${contextoZona}
- Mapa de Impacto (Referencia de estados): ${JSON.stringify(mapaImpacto)}

2. Directrices de Redacción por Ámbito (Rigurosas):
IMPORTANTE: No redactes párrafos largos. Toda la información debe estar estructurada en puntos (mínimo 3 por celda), cada uno comenzando con un guion ("- ") seguido de un espacio.

A. FAMILIAR:
- Cultural: Describe lenguas (lengua materna y segunda lengua), costumbres relevantes (fiestas/comidastípicas) y roles familiares.
- Económico: Detalla tipo de trabajo predominante, acceso a servicios básicos y nivel socioeconómico.
- Ambiental: Especifica geografía de las viviendas y clima que afecta la salud/vida diaria.

B. GRUPAL (Aula):
- Cultural: Diversidad cultural interna e interacciones entre estudiantes.
- Económico: Condiciones para el acceso a materiales curriculares y recursos.
- Ambiental: Condiciones físicas del aula (ventilación, luz, espacio).

C. LOCAL (Distrito):
- Cultural: Festividades y patrimonio del distrito. Económico: Actividades principales (turismo, pesca, agro). Ambiental: Riesgos locales.

D. REGIONAL:
- Identidad regional, lenguas originarias reconocidas, grandes sectores productivos y problemas geoclimáticos (heladas, sequías).

E. NACIONAL:
- Diversidad étnica, desigualdades estructurales y riesgos nacionales (INDICI/SENAMHI).

Reglas de Impacto:
- Si es NEGATIVO: Enfócate en problemática o carencia.
- Si es POSITIVO: Resalta potencia o fortaleza.
- Si es NEUTRO: Descripción puramente factual.

3. Formato de Salida (JSON ÚNICAMENTE):
{
  "familiar": { "cultural": "...", "economico": "...", "ambiental": "..." },
  "grupal": { "cultural": "...", "economico": "...", "ambiental": "..." },
  "local": { "cultural": "...", "economico": "...", "ambiental": "..." },
  "regional": { "cultural": "...", "economico": "...", "ambiental": "..." },
  "nacional": { "cultural": "...", "economico": "...", "ambiental": "..." }
}
`,

    /**
     * T4.7 – Estilos de Aprendizaje + Intereses sugeridos
     */
    POBLAR_ESTILOS: (area: string, edadMin: number, edadMax: number, interesesActuales: string[], nivelCognitivo?: number, idiomas?: { etiqueta: string, valor: string }[]) => `
Actúa como un especialista en pedagogía y psicología del aprendizaje.
Tu misión es generar estrategias metodológicas que usen los intereses de los estudiantes como motor principal para el aprendizaje del área de ${area}.

DATOS CLAVE:
- Área: ${area}
- Edades: ${edadMin} - ${edadMax} años
- Intereses Reales del Grupo: ${interesesActuales.join(', ')}
${nivelCognitivo ? `- Nivel de desarrollo cognitivo: ${nivelCognitivo}/5.` : ''}
${idiomas ? `- Realidad lingüística (solo referencia): ${idiomas.map(i => `${i.etiqueta}: ${i.valor}`).join(', ')}.` : ''}

REGLAS CRÍTICAS PARA [ESTRATEGIAS]:
1. Conecta CADA estrategia con un interés de la lista. Si les gusta la "Música urbana", la estrategia debe ser "Usar ritmos urbanos para...".
2. ELIMINA cualquier diagnóstico de lenguas (ej. "el aula es quechuahablante"). Eso ya está en la sección EIB. Aquí solo interesan las acciones pedagógicas.
3. Sé directo, breve y evita la redundancia. Máximo una oración por punto.
4. El lenguaje debe ser motivador y orientado a estudiantes de ${edadMin}-${edadMax} años.

Responde ESTRICTAMENTE con este formato:

[ESTRATEGIAS]
(Lista de 4 a 6 estrategias directas basadas en los intereses, cada una comenzando con un guion "- ").

[INTERESES]
Sugerencia 1|Sugerencia 2|Sugerencia 3|Sugerencia 4
`,

    /**
     * T4.7 – Diagnóstico Sociolingüístico (EIB) — Retorna TEXTO PLANO, no JSON
     */
    POBLAR_LENGUAJE: (idiomas: { etiqueta: string, valor: string }[], escenario: string, contextoMatriz: any) => `
Actúa como un especialista en Educación Intercultural Bilingüe (EIB) del MINEDU Perú.
Redacta el Diagnóstico Sociolingüístico para un aula con los siguientes datos:
- Mapa Lingüístico del Aula: ${idiomas.map(i => `${i.etiqueta}: ${i.valor}`).join(', ')}
- Escenario Lingüístico: ${escenario}
- Contexto del aula (Análisis de Heatmap): ${JSON.stringify(contextoMatriz)}

REGLAS DE REDACCIÓN (ESTRUCTURADA EN PUNTOS):
1. Redacta el diagnóstico en una secuencia de puntos claros y coherentes, cada uno comenzando con un guion ("- ").
2. Integra el análisis de las lenguas L1/L2, el escenario lingüístico y el impacto en el aprendizaje dividiéndolo en al menos 3 o 4 viñetas.
3. Evita los bloques de texto largos; usa viñetas para que la lectura sea ágil pero técnica.
4. Usa un tono técnico, académico y empático.
Responde ÚNICAMENTE con los puntos redactados del diagnóstico.
`,

    /**
     * T4.7 – Características Biopsicosociales (Cognitivo, Físico, Emocional)
     */
    POBLAR_CARACTERISTICAS: (area: string, grado: string, observaciones: string, niveles: { cognitivo: number, fisico: number, emocional: number }) => `
Actúa como un psicólogo educativo especialista en el CNEB y el desarrollo evolutivo del estudiante peruano.
Tu tarea es redactar 3 párrafos técnicos (uno por dimensión) para las dimensiones: Cognitivo, Físico y Emocional.

DATOS DE ENTRADA:
- Área Curricular: ${area}
- Grado: ${grado}
- Observaciones "sin filtro" del Docente: "${observaciones}"
- Niveles de Desarrollo Seleccionados (Escala 1 al 5):
  * Dimensión Cognitiva: Nivel ${niveles.cognitivo}
  * Dimensión Física: Nivel ${niveles.fisico}
  * Dimensión Emocional: Nivel ${niveles.emocional}

REGLAS DE REDACCIÓN ACADÉMICA / PEDAGÓGICA (ESTRICTAS):

1. ENFOQUE ANALÍTICO: El análisis debe abordar de manera sistemática y fundamentada las dimensiones (Cognitiva, Física/Contextual, Emocional/Socioemocional), considerando características individuales y dinámicas del entorno (institucional/familiar).
2. SUSTENTO EN EVIDENCIAS: Basa la interpretación en la observación pedagógica proporcionada ("sin filtro"), transformándola en evidencias cualitativas y cuantitativas (niveles del 1 al 5).
3. IDENTIFICACIÓN CLARA: En cada dimensión, identifica explícitamente: Fortalezas, Necesidades y Áreas de mejora que orienten la toma de decisiones.
4. CALIBRACIÓN POR NIVEL: Ajusta estrictamente el tono y contenido según el nivel (1-5) seleccionado:
   - Niveles 1-2: Prioriza necesidades de intervención, brechas y apoyos requeridos.
   - Nivel 3: Perfil equilibrado (fortalezas y aspectos por consolidar esperados para el grado).
   - Niveles 4-5: Alto potencial, autonomía y consolidación de habilidades.
5. ESTILO PEDAGÓGICO: Preciso, coherente, analítico. Evita generalizaciones innecesarias. Promueve la claridad conceptual y la pertinencia educativa.
6. ESTRUCTURA DE PUNTOS (OBLIGATORIA): Redacta cada dimensión EXCLUSIVAMENTE como una lista de 4 a 5 puntos técnicos, cada uno comenzando con un guion ("- "). NO uses párrafos, bloques de texto ni menciones los números de escala directamente. La respuesta debe ser una secuencia de viñetas claras y profesionales.
7. IMPACTO EN EL APRENDIZAJE: Cada punto debe conectar el hallazgo con una implicancia pedagógica para el área de ${area}.

FORMATO DE SALIDA (JSON):
Responde ÚNICAMENTE con un objeto JSON estrictamente válido con esta estructura:
{
  "cognitivo": "- Punto 1\\n- Punto 2\\n- Punto 3...",
  "fisico": "- Punto 1\\n- Punto 2\\n- Punto 3...",
  "emocional": "- Punto 1\\n- Punto 2\\n- Punto 3..."
}
`,

    // ─── M02: Identidad ────────────────────────────────────────────────────

    REDACTAR_DESCRIPCION_TECNICA: (perfil: PerfilDocente, plan: PlanAnual) => `
Actúa como un especialista en planificación curricular del MINEDU Perú.
Redacta la "DESCRIPCIÓN GENERAL" del Plan Anual para el área de ${plan.area}, grado ${plan.grado}.

FORMATO REQUERIDO:
1. Párrafo 1: Contexto sociocultural y diagnóstico inicial de los estudiantes de ${perfil.nombreIE}.
2. Párrafo 2: Prioridades pedagógicas, enfoque del área según CNEB y mención a la flexibilidad de la planificación.

3. Sección [COMPETENCIAS]:
- Lista de las competencias principales del área a desarrollar este año.

REGLAS DE ESTILO:
- Lenguaje simple, formal y directo.
- SIN redundancias.
- Responde ESTRICTAMENTE con este formato para que el sistema lo procese:

[DESCRIPCION]
(Aquí van los 2 párrafos redactados)

[COMPETENCIAS]
- Competencia 1
- Competencia 2

CONTEXTO:
- IE: ${perfil.nombreIE}
- Ubicación: ${plan.diagnostico.ubicacion}
- Área: ${plan.area}
- Grado: ${plan.grado}
`,

    // ─── M03: Propósitos ───────────────────────────────────────────────────

    /**
     * T4.9 – Sugerir Malla Curricular desde Calendario Comunal
     */
    SUGERIR_PROPOSITOS: (perfil: PerfilDocente, plan: PlanAnual, competenciasDisponibles: string[]) => `
${getTeacherContext(perfil, plan)}
${getDiagnosticoContext(plan)}

Eres un especialista curricular. Basado en el calendario comunal y el contexto, sugiere cuáles competencias
y capacidades del CNEB priorizar para el año escolar.

COMPETENCIAS DISPONIBLES PARA ESTE ÁREA:
${competenciasDisponibles.join('\n')}

REGLAS:
1. Retorna JSON array de CompetenciaSeleccionada[] (solo las recomendadas, con seleccionada:true).
2. Justifica implícitamente la selección según el calendario comunal.
3. Prioriza máximo 3-4 competencias con sus capacidades más relevantes.
`,

    // ─── M04: Estrategia ───────────────────────────────────────────────────

    /**
     * T4.11 – Situación Significativa Contextualizada
     */
    REDACTAR_SITUACION_SIGNIFICATIVA: (perfil: PerfilDocente, plan: PlanAnual, datos: {
        titulo: string;
        producto: string;
        periodo: string;
    }) => `
${getTeacherContext(perfil, plan)}
${getDiagnosticoContext(plan)}

Actúa como el profesor ${perfil.nombreCompleto}. Redacta una Situación Significativa motivadora
para la unidad "${datos.titulo}" del ${datos.periodo}.

PRODUCTO ESPERADO: ${datos.producto}

ESTRUCTURA OBLIGATORIA:
1. CONTEXTO: Describe una problemática o fenómeno real de la comunidad (2-3 oraciones).
2. RETO: Plantea 1-2 preguntas retadoras que el estudiante debe responder (directas, conectadas a su vida).
3. ACCIÓN: Indica qué harán los estudiantes y cuál será el producto final.

ESTILO: Narrativo, empático, primera persona del plural ("nosotros", "nuestros estudiantes").
Retorna JSON: { "situacion": "texto completo bien estructurado" }
`,

    // ─── M05: Orientaciones ────────────────────────────────────────────────

    /**
     * T4.10 – Orientaciones para la Evaluación
     */
    SUGERIR_EVALUACION: (perfil: PerfilDocente, plan: PlanAnual) => `
${getTeacherContext(perfil, plan)}

Como especialista en evaluación formativa para el área de ${plan.area} (${plan.grado}),
genera orientaciones de evaluación para los tres tipos según el CNEB:

REGLAS:
1. Retorna JSON: { "diagnostica": "texto", "formativa": "texto", "sumativa": "texto" }
2. Cada texto: 60-80 palabras, práctico y orientado al área.
3. Menciona instrumentos específicos (portafolio, rúbricas, anecdotario, etc.).
4. Adapta al nivel y los intereses del grupo.
`,

    /**
     * T4.10 – Metodología y Estrategias
     */
    SUGERIR_METODOLOGIA: (plan: PlanAnual) => `
Como especialista pedagógico del MINEDU Perú, sugiere estrategias metodológicas
para el área de ${plan.area}, grado ${plan.grado}.

Contexto del aula: ${getDiagnosticoContext(plan)}

REGLAS:
1. Retorna JSON: { "metodologia": "texto de 100-150 palabras" }
2. Menciona al menos 3 estrategias específicas del área (no genéricas).
3. Relaciona con los intereses detectados en el diagnóstico.
`,

    /**
     * T4.10 – Recursos y Materiales
     */
    SUGERIR_RECURSOS: (plan: PlanAnual) => `
Como especialista en recursos educativos, sugiere materiales para el área de ${plan.area} (${plan.grado}).
Contexto: ${plan.diagnostico.contexto.local.economico.texto}

REGLAS:
1. Retorna JSON: { "paraDocente": "lista de recursos", "paraEstudiante": "lista de recursos" }
2. 3-5 recursos por categoría, específicos y alcanzables en el contexto peruano.
3. Si el contexto es rural, prioriza materiales del entorno (naturales, reciclados).
4. Incluye recursos digitales (si aplica) y tangibles.
`,

    // ─── Mediano Plazo: Unidad ─────────────────────────────────────────────

    /**
     * T4.12 – Contextualizar Situación de la Unidad (Refinado para usar situación base + competencias)
     */
    CONTEXTUALIZAR_SITUACION: (perfil: PerfilDocente, plan: PlanAnual, unidad: Unidad, competenciasNombres: string[]) => {
        const diagnostico = unidad.diagnosticoStep.diagnosticoPrevio;
        
        // Formatear mapa de logros para la IA
        const logrosStr = Object.entries(diagnostico.logros).map(([comp, count]) => 
            `- ${comp}: AD(${count.ad}), A(${count.a}), B(${count.b}), C(${count.c})`
        ).join('\n');

        return `
${getTeacherContext(perfil, plan)}
${getDiagnosticoContext(plan)}

Actúa como el profesor ${perfil.nombreCompleto}. 
Tu misión es REFORZAR y MEJORAR la Situación Significativa heredada del Plan Anual para esta unidad específica.

SITUACIÓN BASE (Diseño Original): 
"${unidad.diagnosticoStep.situacionSignificativa}"

DATOS DEL ANÁLISIS DE SABERES PREVIOS (RECURSO CRÍTICO PARA LA MEJORA):
- Observaciones del Aula: ${diagnostico.observacion || 'No especificadas'}
- Necesidades Detectadas: ${diagnostico.necesidades || 'No especificadas'}
- MAPA DE LOGROS (Estado actual por competencias): 
${logrosStr || 'No se han registrado niveles de logro aún.'}

CONTEXTO DE LA UNIDAD:
- Producto Final: "${unidad.diagnosticoStep.productoTentativo}"
- Competencias Priorizadas: ${competenciasNombres.join(', ') || 'Según CNEB.'}

REQUERIMIENTOS DE MEJORA (PRIORIDADES):
1. PESO DE LA EVIDENCIA (SABERES PREVIOS): La prioridad #1 es que la nueva situación responda DIRECTAMENTE a lo que has observado en el aula. Si hay muchas notas bajas (nivel C/B) en el Mapa de Logros, la situación DEBE mencionar que estamos asumiendo un reto para fortalecer esas habilidades específicas.
2. ENRAIZAMIENTO EN EL CONTEXTO: Usa las "Necesidades Detectadas" y "Observaciones" para que el lenguaje no sea genérico. Si mencionaste falta de materiales, falta de motivación o intereses específicos, intégralos como parte del "Contexto" o el "Reto".
3. PRESERVACIÓN DEL NÚCLEO: Mantén la temática heredada del M03 y el producto tentativo, pero eleva la narrativa usando tu voz docente (empática y activa).
4. ESTRUCTURA: Contexto basado en realidad → Reto pertinente (Preguntas) → Acción hacia el Producto.
5. ESTILO: Narrativo, empático, en primera persona plural.

Retorna JSON ÚNICAMENTE: { "situacion": "texto robusto, pedagógicamente sustentado y profundamente contextualizado en los saberes previos..." }
`;
    },

    /**
     * T4.12.5 – Precisar Desempeños del CNEB (MINEDU Rules + Calibración por Grado)
     */
    PRECISAR_DESEMPENOS: (desempenosOriginales: string[], contextoAula: string, productoFinal: string, grado: string, nivel: string) => `
Actúa como un especialista metodológico del MINEDU Perú experto en diversificación curricular. 
Tu misión es transformar desempeños complejos en enunciados SIMPLES, DIRECTOS y EVALUABLES.

DATOS DEL ESTUDIANTE:
- Grado: ${grado}
- Nivel: ${nivel}

CONTEXTO DE LA UNIDAD/AULA:
${contextoAula}

PRODUCTO O EVIDENCIA FINAL ESPERADA:
${productoFinal}

DESEMPEÑOS ORIGINALES A PRECISAR:
${desempenosOriginales.map((d, i) => `${i + 1}. "${d}"`).join('\n')}

═══════════════════════════════════════════════════════
CALIBRACIÓN OBLIGATORIA POR GRADO Y NIVEL
(Ajusta la complejidad lingüística y cognitiva según el estudiante)
═══════════════════════════════════════════════════════

NIVEL INICIAL (3-5 años):
- Verbos: señala, nombra, dibuja, pinta, muestra, juega, imita, canta.
- Lenguaje: Oraciones muy cortas (máximo 15 palabras). Sin tecnicismos.
- Ejemplo: "Señala los colores que ve en la vestimenta de la danza de su comunidad."

PRIMARIA 1.° y 2.° (Ciclo III):
- Verbos: menciona, identifica, recorta, pega, cuenta, dibuja, reconoce.
- Lenguaje: Oraciones simples (máximo 20 palabras). Vocabulario cotidiano.
- Ejemplo: "Menciona qué instrumentos suenan en la danza de su pueblo, dibujándolos en su cuaderno."

PRIMARIA 3.° y 4.° (Ciclo IV):
- Verbos: describe, compara, ordena, relata, clasifica, elabora.
- Lenguaje: Oraciones compuestas simples (máximo 25 palabras).
- Ejemplo: "Describe las diferencias entre dos danzas de Calca, usando un cuadro comparativo."

PRIMARIA 5.° y 6.° (Ciclo V):
- Verbos: explica, clasifica, organiza, propone, resume, justifica brevemente.
- Lenguaje: Puede incluir términos del área con explicación (máximo 30 palabras).
- Ejemplo: "Explica qué significan los movimientos de la danza para su comunidad, organizando sus ideas en un esquema."

SECUNDARIA 1.° y 2.° (Ciclo VI):
- Verbos: analiza, interpreta, argumenta, relaciona, infiere, fundamenta.
- Lenguaje: Oraciones complejas permitidas. Puede usar vocabulario técnico del área.
- Ejemplo: "Analiza las características estéticas de las danzas de Calca, relacionándolas con el contexto histórico de la provincia."

SECUNDARIA 3.° y 4.° (Ciclo VII-a):
- Verbos: evalúa, fundamenta, contrasta, sustenta, cuestiona, reflexiona críticamente.
- Lenguaje: Redacción académica moderada. Argumentación con evidencias.
- Ejemplo: "Evalúa cómo las danzas tradicionales de Calca han cambiado con el tiempo, sustentando su posición con al menos dos fuentes."

SECUNDARIA 5.° (Ciclo VII-b):
- Verbos: sustenta críticamente, diseña, propone soluciones, evalúa con criterios, debate.
- Lenguaje: Redacción compleja y autónoma. Pensamiento crítico y propositivo.
- Ejemplo: "Sustenta críticamente la importancia de preservar las manifestaciones artísticas de Calca, proponiendo acciones concretas desde su rol como ciudadano."

═══════════════════════════════════════════════════════

REGLAS FINALES:
1. SELECCIONA la banda de calibración que corresponde al grado "${grado}" del nivel "${nivel}" y redacta EXCLUSIVAMENTE con ese nivel de complejidad.
2. OBSERVABILIDAD: El docente debe poder ver o escuchar la acción del estudiante.
3. FÓRMULA: VERBO + QUÉ + CÓMO + CONTEXTO local.
4. NO inventes contenido nuevo; mantén el sentido original del desempeño CNEB.

FORMATO DE SALIDA (ESTRICTO JSON):
{
  "precisados": [
    "Redacción calibrada 1",
    "Redacción calibrada 2"
  ]
}
`,

    /**
     * T4.13 – Generar Criterios de Evaluación
     */
    GENERAR_CRITERIOS: (desempenos: { texto: string; precisado: string }[]) => `
Eres un especialista en evaluación curricular del CNEB Perú.
Genera criterios de evaluación medibles para los siguientes desempeños precisados:

${desempenos.map((d, i) => `${i + 1}. Desempeño: "${d.texto}" → Precisado: "${d.precisado}"`).join('\n')}

REGLAS:
1. Genera 1-2 criterios por desempeño precisado.
2. Cada criterio debe tener una evidencia concreta observable.
3. Retorna JSON: { "criterios": [{ "id": "unique-id", "descripcion": "...", "evidencia": "..." }] }
4. Los criterios deben ser medibles y accionables (con verbos: demuestra, produce, identifica, etc.).
`,

    /**
     * T4.14 – Generar Rúbrica de Evaluación
     */
    GENERAR_RUBRICA: (tituloUnidad: string, criterios: { descripcion: string; evidencia: string }[]) => `
Genera una rúbrica de evaluación holística para la unidad "${tituloUnidad}".

CRITERIOS BASE:
${criterios.map((c, i) => `${i + 1}. ${c.descripcion}`).join('\n')}

REGLAS:
1. Usa 4 niveles: AD (Destacado), A (Logrado), B (En proceso), C (En inicio).
2. Por cada criterio, describe qué hace el estudiante en cada nivel.
3. Retorna JSON: { "rubrica": [{ "criterio": "...", "AD": "...", "A": "...", "B": "...", "C": "..." }] }
`,

    /**
     * T4.15 – Generar Secuencia de Sesiones (Borrador Inicial — Calendario Real)
     */
    GENERAR_SECUENCIA_SESIONES: (datos: {
        tituloUnidad: string;
        situacion: string;
        producto: string;
        competencias: { nombre: string; capacidades: string[] }[];
        desempenos: { texto: string; precisado: string }[];
        criteriosUnidad: { descripcion: string; evidencia: string }[];
        enfoques: { nombre: string; valores: string[] }[];
        sesionesCalendario: { index: number; fechas: { fecha: string; horas: number }[]; totalHoras: number }[];
        eventosM03: { titulo: string; fecha: string; tipo: string }[];
        diagnosticoPrevio: string;
    }) => `
Eres un/a especialista en planificación curricular y diseño instruccional del CNEB Perú, con enfoque en competencias y evaluación formativa.
Tu tarea: generar un BORRADOR INICIAL (simple, directo, editable) de la secuencia de sesiones.

═══════════════════════════════════════
1) INSUMOS DE LA UNIDAD
═══════════════════════════════════════
TÍTULO: "${datos.tituloUnidad}"
SITUACIÓN SIGNIFICATIVA: "${datos.situacion}"
PRODUCTO FINAL: "${datos.producto}"
DIAGNÓSTICO PREVIO: ${datos.diagnosticoPrevio || 'No especificado'}

COMPETENCIAS Y CAPACIDADES PRIORIZADAS:
${datos.competencias.map((c, i) => `${i + 1}. ${c.nombre}\n   Capacidades: ${c.capacidades.join(' | ')}`).join('\n')}

DESEMPEÑOS (con precisados si existen):
${datos.desempenos.map((d, i) => `${i + 1}. Original: "${d.texto}"\n   Precisado: "${d.precisado || '[Por definir por docente]'}"`).join('\n')}

CRITERIOS DE EVALUACIÓN DE LA UNIDAD:
${datos.criteriosUnidad.length > 0 ? datos.criteriosUnidad.map((c, i) => `${i + 1}. ${c.descripcion} → Evidencia: ${c.evidencia}`).join('\n') : '[Por definir por docente]'}

ENFOQUES TRANSVERSALES:
${datos.enfoques.length > 0 ? datos.enfoques.map(e => `- ${e.nombre}: ${e.valores.join(', ')}`).join('\n') : 'No definidos'}

═══════════════════════════════════════
2) CALENDARIO REAL DEL DOCENTE (ORGANIZA)
═══════════════════════════════════════
Total de sesiones: ${datos.sesionesCalendario.length}

${datos.sesionesCalendario.map(s => {
    const fechasStr = s.fechas.map(f => `${f.fecha} (${f.horas}h)`).join(' + ');
    return `SESIÓN ${s.index + 1}: ${fechasStr} — Total: ${s.totalHoras}h pedagógicas`;
}).join('\n')}

EVENTOS / FERIADOS / CALENDARIO COMUNAL (M03) EN ESTE PERÍODO:
${datos.eventosM03.length > 0 ? datos.eventosM03.map(e => `- ${e.fecha}: ${e.titulo} (${e.tipo})`).join('\n') : 'Sin eventos relevantes'}

═══════════════════════════════════════
3) REGLAS PEDAGÓGICAS OBLIGATORIAS
═══════════════════════════════════════
- Genera EXACTAMENTE ${datos.sesionesCalendario.length} sesiones (una por cada agrupación del calendario).
- Distribuye competencias/capacidades/desempeños a lo largo de TODAS las sesiones: NO repitas todo en todas.
- Asegura PROGRESIÓN: activación/diagnóstico → desarrollo → aplicación → cierre/producto final.
- Las actividades deben estar orientadas al PRODUCTO de cada sesión.
- Los criterios deben corresponder a lo que se hace y evidencia en ESA sesión.
- Si falta información, coloca: [Por definir por docente].
- Modo borrador: 3–5 guiones por momento, 2–4 criterios por sesión, lenguaje claro sin tecnicismos.
- Si una sesión cae en feriado/evento M03, genera una ALERTA.

═══════════════════════════════════════
4) FORMATO DE SALIDA (JSON ESTRICTO)
═══════════════════════════════════════
{
  "sesiones": [
    {
      "orden": 1,
      "titulo": "Nombre sugerido con verbo de acción",
      "productoSesion": "Contribución al producto final",
      "competencias": ["Nombre competencia 1"],
      "capacidades": ["Capacidad asignada"],
      "desempenos": ["Texto del desempeño asignado"],
      "desempenosPrecisados": ["Texto precisado o [Por definir por docente]"],
      "criterios": ["Criterio observable 1", "Criterio observable 2"],
      "secuencia": {
        "inicio": "- Activación de saberes previos sobre...\\n- Presentación del propósito...",
        "desarrollo": "- Exploración de...\\n- Trabajo colaborativo...\\n- Elaboración de...",
        "cierre": "- Reflexión metacognitiva...\\n- Presentación de evidencias..."
      },
      "evidenciaRapida": "Producto visible de esta sesión",
      "notaCoherencia": "Cómo esta sesión aporta al propósito y producto de la unidad",
      "alertasM03": "Nota si cae en feriado o evento, o null"
    }
  ],
  "resumenCobertura": {
    "competenciasCubiertas": ["Lista de competencias que se trabajaron"],
    "criteriosPorSesion": "Distribución breve",
    "sesionesProductoFinal": [1, 2],
    "ajustesRecomendados": "Ajustes por feriados/eventos si aplica, o null"
  }
}
`,

};

# 🪄 TizaMágica — Hoja de Ruta de Mejoras Estratégicas

> **Documento de referencia para el equipo de desarrollo.**
> Este archivo consolida el análisis técnico, pedagógico y de experiencia de usuario (UX) de la plataforma TizaMágica. Su propósito es servir como guía maestra para priorizar, planificar e implementar las mejoras identificadas, asegurando que cada decisión esté alineada con las necesidades reales del docente peruano y con los estándares del Currículo Nacional de Educación Básica (CNEB - MINEDU).

---

## 🧠 Análisis de Coherencia y Visión Docente
> "La tecnología debe volverse invisible y dejar que la pedagogía brille."

### 1. Coherencia Estructural Actual (CNEB)
La aplicación sigue fielmente la lógica del Currículo Nacional, lo cual garantiza su validez técnica:
*   **Diagnóstico (M01):** La "foto" de la realidad. Es el cimiento indispensable para cualquier planificación personalizada.
*   **Identidad (M02):** Define el marco institucional.
*   **Propósitos (M03):** El cruce entre realidad y norma. Al priorizar el **Calendario Comunal**, se dota de "corazón" a la matriz de competencias, vinculando el aprendizaje con la vida de la comunidad.
*   **Estrategia (M04):** El producto final donde la IA articula todo lo anterior en Situaciones Significativas de largo plazo.

### 2. Puntos de Optimización Estratégica
Para elevar la experiencia a un nivel **Premium**, se proponen las siguientes sincronizaciones profundas:

*   **A. Sugerencia Inteligente de Competencias:** Que la IA proponga competencias basadas en las fechas del Calendario Comunal (ej: sugerir *Construye su identidad* si es la Fiesta de San Juan).
*   **B. Hilo Conductor Real:** Obligar al prompt de la IA a usar los **Intereses de los Estudiantes** (detectados en M01) dentro de las Situaciones Significativas de M04.
*   **C. Orientaciones Proactivas (M05):** Autogeneración de estrategias basadas en el Escenario EIB y el nivel de desarrollo declarado en el diagnóstico.
*   **D. Visibilidad de Carga Horaria:** Indicador de horas pedagógicas reales anuales para asegurar metas de aprendizaje realistas.

### 3. Conclusión: Hacia la Sincronización Profunda
El objetivo final es que el Diagnóstico (M01) no sea una pestaña estática, sino que **"persiga"** al docente durante todo el proceso de diseño, asegurando un **vínculo emocional** y pedagógico constante.

---

## I. Sistema de Diseño (Design System)

### 1.1 Jerarquía Tipográfica Unificada
> Estandarizar los niveles de texto para que sean consistentes en toda la app y legibles en pantallas pequeñas (laptops 13").

| Nivel | Uso | Clase Tailwind |
| :--- | :--- | :--- |
| H1 — Módulo | Título principal de cada módulo | `text-2xl md:text-3xl font-black uppercase tracking-tight` |
| H2 — Sección | Títulos de secciones internas | `text-sm font-black uppercase tracking-widest text-white` |
| H3 — Label | Etiquetas de campos y sublabels | `text-[10px] font-bold uppercase text-gray-500 tracking-[0.2em]` |
| Body | Texto de lectura y descripciones | `text-sm leading-relaxed text-gray-300` |
| Caption | Notas, tips, metadatos secundarios | `text-[9px] text-gray-600 italic` |

### 1.2 Regla de Visibilidad y Contraste
> Debido a que la app usa un diseño Dark Luxe (oscuridad profunda), los textos secundarios deben tener suficiente contraste para pantallas de laptop con bajo brillo o luz de aula intensa.
- **Acción:** Subir el contraste de textos descriptivos de `text-gray-600` a `text-gray-400`.

### 1.2 Componente `<ModuleHeader>` Reutilizable
> Crear un único componente de header para todos los módulos del Plan Anual (M01–M05) y Unidades. Elimina inconsistencias visuales de raíz.

**Estructura propuesta:**
```tsx
<ModuleHeader
  module="M01"
  title="Diagnóstico Integral"
  subtitle="Análisis del contexto y características del grupo."
  actions={[<AIButton />, <NeonButton icon="description">Exportar</NeonButton>]}
/>
```

### 1.3 Variantes de Tarjetas (Solo 2)
- **Principal:** `bg-surface-card/50 rounded-2xl border border-white/5` — Para contenido editable.
- **Informativa:** `bg-white/[0.02] rounded-2xl border border-white/5` — Para datos heredados / de solo lectura.

### 1.4 Sistema de Botones (Solo 3)
- **Primario (Magenta):** Acciones de IA y envío principal.
- **Secundario (Ghost):** Vista previa, volver, exportar.
- **Peligro (Rojo sutil):** Eliminar, cancelar operaciones.

### 1.5 NavPills Uniformes (`<TabSwitch>`)
> El componente `TabSwitch` ya fue refactorizado con diseño Dark Luxe. Aplicarlo en TODAS las vistas donde aún se usan botones manuales.

**Pendientes de migración:**
- [ ] M03 — Selector de Tipo de Periodo (Bimestre/Semestre)
- [ ] M05 — Orientaciones (si se añaden subsecciones)

### 1.6 Layout "Líquido" y Responsivo
- Contenedores: `max-w-[1600px] w-full` en lugar de `max-w-5xl`.
- Grillas: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- Headers: `flex-col md:flex-row` para que los botones se apilen en pantallas pequeñas.

### 1.7 Empty States y Estados de Carga
- **Skeletons de carga:** Reemplazar `<Spinner>` standalone por esqueletos pulsantes con la forma de las tarjetas que van a aparecer.
- **Empty States:** Mensajes contextuales con icono sutil cuando una sección no tiene datos (ej: "Tu cartel está limpio. Comienza seleccionando competencias.").

### 1.8 Micro-retroalimentación (Feedback Visual)
- Indicador sutil (check/luz verde) en cada campo tras guardar automáticamente.
- Toast notifications unificadas en esquina inferior derecha con estilo glassmorphism.

- Una línea Magenta/Teal de 1–2px en el tope de la página que avance según los módulos completados (M01 → M05).
- Añade gamificación y sensación de avance al docente.

### 1.10 Feedback de Sincronización (Cloud-Sync)
> Aunque la app trabaja en la nube, es vital dar tranquilidad al docente de que sus datos están a salvo.
- **Indicador:** Un punto de estado ultra-sutil en el `ModuleHeader` (Glow verde: Sincronizado / Glow naranja: Sincronizando / Glow rojo: Error de conexión).

### 1.10 El "Botón de Pánico" (AI Help) - Estandarización
> Los botones de IA (`AIButton` / Magenta) suelen estar dispersos. Deben tener una posición estándar fija para reducir la carga cognitiva.
- **En campos de texto:** Siempre alineado a la derecha del label o del área de edición.
- **En Secuencia Didáctica:** Botón flotante o fijo cerca de cada momento (Inicio, Desarrollo, Cierre).
- **Consistencia:** Misma posición en todas las secciones de la app.

### 1.11 La "Navegación de Salida" y Flujo Continuo
- **Botón "Siguiente Sesión →":** Al finalizar la edición de la Sesión 1, incluir un botón directo a la Sesión 2 para permitir una planificación "en cadena".
- **Eliminación de redundancia:** Quitar botones de "Continuar/Atrás" en el pie de página del editor de sesiones, ya que el **Auto-guardado** está activo y el `TabSwitch` (NavPills) permite la navegación libre. Mantener solo botones de acciones críticas (Generar, Descargar).

---

## II. Mejoras Pedagógicas por Módulo

### M01 — Diagnóstico Integral

| # | Mejora | Prioridad |
| :--- | :--- | :--- |
| 1 | **Línea de Base Académica:** Registrar niveles de logro actuales (AD/A/B/C) por competencia del año anterior. | 🔴 Alta |
| 2 | **NEE / Inclusión:** Sección específica para identificar estudiantes con Necesidades Educativas Especiales y adaptaciones DUA. | 🔴 Alta |
| 3 | **Conectividad y Recursos del Hogar:** Campo para registrar si los alumnos tienen acceso a internet o dispositivos. | 🟡 Media |
| 4 | **Involucramiento Familiar:** Indicador del nivel de compromiso de los padres en el proceso de aprendizaje. | 🟡 Media |
| 5 | **Filtro de Matrícula (Estudiantes):** Módulo para registrar la lista de nombres o cantidad de estudiantes, vital para el Registro de Logros. | 🔴 Alta |
| 6 | **Nueva Pestaña "1.4 Situación Académica y Barreras":** Agrupar NEE, línea de base y recursos en una sola pestaña. | 🟢 Futura |

#### 🛠️ Detalle de Mejoras Críticas para M01

1. **El Diagnóstico de Aprendizajes (La Línea de Base)**
   - **Lo que falta:** Un espacio para ingresar (o que la IA analice) cómo terminaron los alumnos el año pasado. ¿Cuántos están en Inicio (C), Proceso (B) o Logro (A/AD) en las competencias clave?
   - **Por qué importa:** Un docente no solo planifica por el "contexto", sino para cerrar las brechas de aprendizaje. Sin esto, el diagnóstico está "cojo".

2. **Necesidades Educativas Especiales (NEE) e Inclusión**
   - **Lo que falta:** Identificar específicamente a estudiantes con discapacidad o dificultades específicas de aprendizaje (el CNEB lo exige).
   - **Por qué importa:** Es una obligación legal y pedagógica. Es vital para automatizar las adaptaciones curriculares en las sesiones (M06) posteriormente.

3. **El Entorno Familiar y Compromiso**
   - **Lo que falta:** Nivel de involucramiento de los padres en el proceso educativo.
   - **Por qué importa:** Define el tipo de estrategias que el docente puede proponer (autónomas vs. apoyadas).

4. **Competencias Digitales (Conectividad)**
   - **Lo que falta:** Acceso real a internet y dispositivos (tabletas/celulares) en casa.
   - **Por qué importa:** Determina la viabilidad de proponer recursos digitales o actividades extraescolares tecnológicas.

5. **El "Filtro de Matrícula" (Estudiantes Reales)**
   - **El Problema:** No hay un lugar para registrar a los estudiantes.
   - **La Mejora:** Un módulo simple de matrícula para ingresar nombres (o al menos la cantidad).
   - **Por qué importa:** Sin nombres no hay **Registro de Logros (Sprint 5)**; la IA no puede personalizar sesiones si no sabe quién es quién (ej. el niño con autismo identificado en NEE).

### M02 — Identidad Institucional y Perfil Pedagógico

| # | Mejora | Prioridad |
| :--- | :--- | :--- |
| 1 | **De Administración a Pedagogía:** Transformar el módulo en el "Perfil Pedagógico del Docente". | 🔴 Alta |
| 2 | **Filosofía de Enseñanza:** Selector de Enfoque Pedagógico (ABP, Gamificación, etc.) que sirva de filtro para la IA. | 🔴 Alta |
| 3 | **Visión Contextualizada:** IA que redacta el compromiso del docente basándose en el Diagnóstico M01. | 🟡 Media |
| 4 | **Lema y Valores:** Espacio para el "Lema del Aula" para generar pertenencia. | 🟢 Futura |

#### 🛠️ Detalle de Mejoras Críticas para M02

1. **Transformación a "Identidad y Enfoque"**
   - **El Cambio:** Dejar de ser una ficha de datos y pasar a ser el "ADN Pedagógico" del plan.
   - **Navegación:** Usar 3 pestañas: *Visión del Área / Sello del Docente / Valores del Año*.
   - **Sello del Docente:** Selector de metodologías favoritas. Esto es **CRÍTICO** porque filtrará los prompts de las Sesiones: si el docente elige "Gamificación", la IA generará sesiones con juegos.

2. **Visión Contextualizada del Área**
   - **La Mejora:** Botón de IA que analice el contexto regional y redacte: *"Mi compromiso este año con este grupo específico es..."*.
   - **Valor:** El plan se siente humano y propio, no un copy-paste del CNEB.

3. **Lema y Valores del Aula**
   - **La Mejora:** Espacio para definir el norte motivacional del grupo.
   - **Valor:** Le da un corazón al documento administrativo.

| # | Mejora | Prioridad |
| :--- | :--- | :--- |
| 1 | **Radar de Cobertura Curricular:** Panel que muestre % de cobertura y señale competencias con 0 unidades asignadas. | 🔴 Alta |
| 2 | **Tooltips con Estándares del Ciclo:** Al pasar el mouse sobre una competencia, mostrar el estándar del Ciclo VI o VII del CNEB. | 🔴 Alta |
| 3 | **Sugerencia IA basada en Calendario:** Si el Calendario Comunal tiene "Día de la Madre", la IA sugiere qué competencias encajan ese mes. | 🟡 Media |
| 4 | **Competencias Transversales Pre-marcadas:** "Se desenvuelve en entornos virtuales" y "Gestiona su aprendizaje" siempre visibles y sugeridas. | 🟡 Media |

#### 🛠️ Detalle de Mejoras Críticas para M03

1. **El "Radar de Cobertura Curricular"**
   - **El Problema:** Al marcar checks en una matriz gigante, es fácil que al docente se le olvide una competencia o capacidad y no la trabaje en todo el año (problema grave en auditorías de la UGEL).
   - **La Mejora:** Panel lateral o barra de progreso que diga: "Cobertura: 85%". Que resalte en rojo las competencias con "0" unidades asignadas.
   - **Valor:** Tranquilidad total de que la planificación cumple al 100% con la norma.

2. **Estándares de Aprendizaje a la Vista (Tooltips)**
   - **El Problema:** El docente conoce la capacidad, pero no siempre recuerda el nivel exacto de exigencia que pide el estándar para su ciclo (VI o VII).
   - **La Mejora:** Al pasar el mouse por el nombre de la competencia, mostrar un Tooltip con el Estándar del Ciclo correspondiente.
   - **Valor:** Evita consultar el PDF del CNEB de 400 páginas; la información está donde se necesita.

3. **Coherencia entre Pestañas (Calendario → Propósitos)**
   - **El Problema:** Actualmente el Calendario (3.1) y el Cartel (3.2) no están integrados funcionalmente.
   - **La Mejora:** Si el docente registra "Día de la Madre" en mayo, la IA muestra un icono de "Bombilla" sugiriendo competencias de Comunicación o Personal Social que encajen con la fecha.
   - **Valor:** Sugerencias pedagógicas pertinentes y automáticas.

4. **Sincronización de Periodos Semestrales**
   - **Nota Técnica:** Asegurar que si el docente elige "Semestre", la Estrategia Anual (M04) se adapte para generar solo dos grandes bloques de unidades, manteniendo la coherencia en toda la cadena de planificación.

### M04 — Estrategia Anual

| # | Mejora | Prioridad |
| :--- | :--- | :--- |
| 1 | **Campo "Eje Articulador / Lema del Año":** Tema transversal que conecte todas las unidades del año. La IA lo usa para dar coherencia a las situaciones. | 🔴 Alta |
| 2 | **Selector de "Nivel de Innovación del Producto":** Filtro para elegir entre Tradicional, Digital o Vivencial. | 🟡 Media |
| 3 | **Badge de "Pertinencia Local":** Indicador que señala qué problema del Diagnóstico (M01) atiende cada situación significativa. | 🟡 Media |
| 4 | **Vista de Línea de Tiempo (Gantt Pedagógico):** Visualización del año escolar con las unidades y los eventos del Calendario Comunal superpuestos. | 🟢 Futura |

#### 🛠️ Detalle de Mejoras Críticas para M04

1. **El "Hilo Conductor" (Storyline)**
   - **El Problema:** Actualmente, las unidades se ven como islas separadas. La Unidad 1 no parece conocer a la Unidad 2.
   - **La Mejora:** Implementar un campo de **"Eje Articulador" o "Lema del Año"**. Si el docente define el "Cuidado del Agua", la IA asegura que todas las situaciones significativas del año tengan coherencia con ese tema.
   - **Valor:** Crea una planificación con propósito y narrativa, no solo tareas sueltas.

2. **El "Selector de Productos Innovadores"**
   - **El Problema:** Por defecto, la IA suele sugerir productos clásicos (carteles, portafolios).
   - **La Mejora:** Un filtro de "Nivel de Innovación" al sugerir ideas:
     - **Tradicional:** Tríptico, Álbum.
     - **Digital:** Podcast, Infografía en Canva, Campaña de TikTok.
     - **Vivencial:** Pasacalle, Feria gastronómica, Entrevista a abuelos.
   - **Valor:** Modernización de la enseñanza sin esfuerzo adicional para el docente.

3. **Conexión Directa con el Diagnóstico (M01)**
   - **El Problema:** Los problemas detectados en M01 a veces se pierden al llegar a M04.
   - **La Mejora:** Añadir un indicador de **"Pertinencia Local"**. Un sello que valide: "Esta situación atiende el problema de 'Contaminación' detectado en tu diagnóstico regional".
   - **Valor:** Justificación pedagógica sólida ante directivos; el plan responde a la realidad local real.

4. **Línea de Tiempo Visual (Gantt Pedagógico)**
   - **El Problema:** El formato de lista no permite visualizar el "ritmo" y la saturación del año.
   - **La Mejora:** Vista de Línea de Tiempo donde se crucen los meses, las unidades y los hitos del **Calendario Comunal (M03)**.
   - **Valor:** Permite ver rápidamente si una unidad se cruza con demasiados feriados o eventos institucionales.

### M05 — Orientaciones

| # | Mejora | Prioridad |
| :--- | :--- | :--- |
| 1 | **Orientaciones "Vivas" desde M01:** La IA redacta la metodología basándose en el diagnóstico (ej: si hay problemas de comprensión, sugiere estrategias específicas). | 🔴 Alta |
| 2 | **Banco de Recursos Sugeridos:** Bibliografía y recursos digitales curados, separados en "Para el Docente" y "Para el Estudiante". | 🟡 Media |
| 3 | **Adaptaciones DUA Automáticas:** Si hay NEE registradas en M01, M05 genera las pautas de atención a la diversidad correspondientes. | 🟡 Media |
| 4 | **Redacción con Norma RVM 094:** Botón de IA que transforma ideas sueltas del docente en párrafos alineados con la norma de evaluación vigente. | 🟢 Futura |
| 5 | **Generación Automática desde M01:** Botón "Generar Orientaciones" que redacta todo M05 en un solo click usando los datos del diagnóstico. | 🟢 Futura |

#### 🛠️ Detalle de Mejoras Críticas para M05

1. **Orientaciones "Vivas" (Metodología Adaptada)**
   - **El Problema:** Redacciones genéricas como "La evaluación será formativa".
   - **La Mejora:** La IA redacta orientaciones basadas en el **M01 (Diagnóstico)**.
   - **Ejemplo:** Si el diagnóstico detecta un grupo con bajo control de impulsos, la IA sugiere: "priorizar dinámicas de autorregulación y aprendizaje cooperativo con roles definidos".
   - **Valor:** El plan se convierte en una guía real de aula, no un trámite administrativo.

2. **Banco de Recursos Inteligente**
   - **El Problema:** Pérdida de tiempo buscando materiales y bibliografía.
   - **La Mejora:** Selector de Bibliografía y Recursos Digitales curados o sugeridos por IA.
   - **Estructura:** Separar en "Recursos para el Docente" (teoría) y "Recursos para el Estudiante" (fichas, videos, Aprendo en Casa).
   - **Valor:** Ahorro masivo de tiempo en búsqueda de contenido.

3. **Glosario y Redacción Técnica (RVM 094)**
   - **El Problema:** Confusión técnica entre evaluación diagnóstica, formativa y sumativa.
   - **La Mejora:** Botón de "Redacción Pedagógica" que alinea las ideas del docente con la **RVM 094 (Norma del MINEDU)**.
   - **Valor:** Profesionalismo y elegancia en la redacción técnica.

4. **Sección de Inclusión y Diversidad (DUA)**
   - **Falta Crítica:** No existe actualmente una sección de Inclusión dedicada.
   - **La Propuesta:** Campo de **"Orientaciones para la Atención a la Diversidad"**. Si en M01 existen alumnos con NEE, la IA sugiere pautas DUA (Diseño Universal para el Aprendizaje) específicas.
   - **Valor:** Cumplimiento pedagógico y legal de la atención a la inclusión.

---

## III. Mejoras en Unidades Didácticas

| # | Mejora | Prioridad |
| :--- | :--- | :--- |
| 1 | **Alineación Pedagógica con IA (Paso 2):** La IA analiza la Situación Significativa y sugiere las competencias que mejor encajan. | 🔴 Alta |
| 2 | **Editor de Desempeños Precisados (Paso 2):** La IA sugiere 3 formas de precisar un desempeño adaptado al tema y grado específico. | 🔴 Alta |
| 3 | **Contador de Sesiones con Horario Real (Paso 3):** Calcular automáticamente las horas disponibles cruzando el horario del docente con el calendario escolar. | 🔴 Alta |
| 4 | **Feriados en el Calendario (Paso 3):** Tachar feriados y eventos comunales e invitar al docente a reubicar sesiones. | 🟡 Media |
| 5 | **Cascada Didáctica de Sesiones (Paso 4):** Generar sesiones que sigan la estructura Inicio→Desarrollo→Cierre con el producto de la unidad como norte. | 🟡 Media |
| 6 | **Renombrado de Pasos:** Cambiar "Diagnóstico / Diseña / Organiza / Prevée" por **SITUACIÓN / PROPÓSITOS / CRONOGRAMA / SESIONES**. | 🔴 Alta |
| 7 | **Navegación "Siguiente Unidad →":** Al final de una Unidad, botón que lleva directamente a la siguiente sin volver al menú. | 🟢 Futura |

#### 🛠️ Detalle de Mejoras Críticas para Unidades

1. **Alineación Pedagógica con IA (Paso 2)**
   - **El Problema:** El docente marca competencias de forma manual sin un vínculo claro con el reto planteado.
   - **La Mejora:** Botón de **"Alineación Pedagógica"**. La IA analiza la Situación Significativa del Paso 1 y sugiere: "Para resolver este reto sobre la basura, las competencias que mejor encajan son *Indaga mediante métodos científicos* y *Gestiona el ambiente*".
   - **Orden Recomendado:** Mantener **Situación Significativa primero**. El reto es el que dicta qué herramientas (competencias) se necesitan. Esto evita saturación visual y mental.
   - **Valor:** Asegura que el plan sea coherente y no una colección de checks al azar.

2. **Editor de Desempeños Precisados (Paso 2)**
   - **El Problema:** Los desempeños del CNEB son genéricos. Precisarlos (adaptarlos al grado/tema) es la tarea que más tiempo quita y donde más errores técnicos hay.
   - **La Mejora:** Interfaz donde la IA sugiere 3 formas de precisar un desempeño basándose en el tema.
   - **Ejemplo:** Si el tema es "La Célula", la IA toma el desempeño estándar y lo redacta automáticamente centrado en la célula.
   - **Valor:** Redacción técnica impecable en segundos; el "superpoder" del docente.

3. **El Calendario "Real" y Contador Horario (Paso 3)**
   - **El Problema:** Seleccionar fechas es tedioso sin ver feriados o el horario real.
   - **La Mejora:** Sincronización automática con el **Horario del Docente** (Perfil) y el **Calendario Comunal**.
   - **Automatización:** Tachar feriados (ej: San Pedro y San Pablo) y preguntar: "¿Quieres reubicar esta sesión o la perdemos?".
   - **Contador:** Mostrar cuántas horas pedagógicas tiene el docente ese mes y sugerir la división: "Tienes 12 horas, ¿quieres 6 sesiones de 2 horas?".
   - **Valor:** Planificación realista y cumplimiento de horas lectivas.

4. **La "Cascada" Didáctica de Sesiones (Paso 4)**
   - **El Problema:** Sesiones que parecen islas sin un hilo conductor lógico hacia un producto.
   - **La Mejora:** Estructura de secuencia lógica obligatoria: **Inicio (Problematización) -> Desarrollo (Construcción) -> Cierre (Evaluación/Producto)**.
   - **Norte Pedagógico:** Incluir un campo de **"Producto de la Unidad"**. Si el producto es una "Infografía", la última sesión generada debe ser la elaboración de la misma.
   - **Valor:** Garantiza que el aprendizaje sea un proceso acumulativo con un resultado concreto.

---

## IV. Mejoras en Sesiones de Aprendizaje

| # | Mejora | Prioridad |
| :--- | :--- | :--- |
| 1 | **Validador de Tiempos:** Alerta automática si la suma de los 3 momentos excede la duración del bloque horario del docente. | 🔴 Alta |
| 2 | **Generador de Rúbrica Completa (AD/A/B/C):** La IA genera la tabla completa de descriptores por nivel de logro desde la evidencia de la sesión. | 🔴 Alta |
| 3 | **Sección "Materiales de Clase":** La IA genera un texto/lectura corta adaptada al tema, 3-5 preguntas de comprensión y un video sugerido. | 🔴 Alta |
| 4 | **Guion de Diálogo para el Docente:** En el Inicio, la IA sugiere frases concretas que el docente puede decir para motivar a los estudiantes. | 🟡 Media |
| 5 | **Adaptación EIB en Sesión:** Si el escenario es EIB, sugerir frases en Quechua/Aimara para el momento del Inicio. | 🟡 Media |
| 6 | **Unificar Pasos de Sesión a 3:** Reducir a "Propósitos → Secuencia → Evaluación" y mover Contexto a panel lateral colapsable. | 🟡 Media |
| 7 | **Navegación "Sesión Siguiente →":** Al terminar una sesión, ir directamente a la siguiente sin volver al listado. | 🟢 Futura |
#### 🛠️ Detalle de Mejoras Críticas para Sesiones

1. **El "Guion para el Docente" (Diálogo directo)**
   - **El Problema:** Secuencias en tercera persona ("El docente explica...") poco útiles en el aula.
   - **La Mejora:** La IA genera un **"Guion de Diálogo"** con frases motivadoras sugeridas.
   - **Valor:** Seguridad para el docente, especialmente novatos o en temas complejos.

2. **Gestión de Tiempos Realista (Validador)**
   - **El Problema:** Secuencias que exceden la duración del bloque horario.
   - **La Mejora:** Alerta automática: "⚠️ Tu secuencia dura 110 min y tu bloque es de 90 min. Ajusta el Desarrollo".
   - **Valor:** Evita el estrés de no terminar la clase.

3. **Generación Automática del Instrumento Completo**
   - **El Problema:** Redacción manual lenta de cada nivel de logro (AD/A/B/C).
   - **La Mejora:** La IA genera la **Tabla de Rúbrica Completa** con descriptores precisos basados en la evidencia de la sesión.
   - **Valor:** Ahorro del 40% del tiempo de planificación.

4. **Pestaña de "Materiales de Clase" (Contenido Listo)**
   - **Falta Crítica:** Falta el material de lectura o el reto del día.
   - **La Mejora:** Nueva sección que incluya: Texto corto adaptado, 3-5 preguntas (literal/inferencial/crítico) y link a video de YouTube.
   - **Valor:** El docente imprime y entra al aula.

5. **Adaptación EIB / Lingüística Directa**
   - **La Mejora:** Sugerir frases en Quechua/Aimara para el Inicio si el escenario es EIB.
   - **Valor:** Pertinencia cultural real en cada sesión.

6. **Optimización de Pasos y Secciones "Heredadas"**
   - **El Problema:** Los pasos 1 (Contexto) y 2 (Identidad) son estáticos y cansan al docente.
   - **La Mejora:** Agrupar en **"Información General"** o panel colapsable. La navegación principal se centra en: **Propósitos → Secuencia → Evaluación**.
   - **Botón Siguiente:** Reemplazar "Continuar" por "Guardar y pasar a Secuencia" o eliminarlo a favor de la navegación libre del `TabSwitch`.

---

## V. Características Globales Faltantes

| # | Característica | Descripción | Prioridad |
| :--- | :--- | :--- | :--- |
| 1 | **Dashboard Operativo** | Pantalla de inicio que muestre la sesión del día, materiales listados y estado del plan. | 🔴 Alta |
| 2 | **Registro Auxiliar de Logros** | Tabla para que el docente registre AD/A/B/C por alumno y competencia al finalizar la unidad. | 🔴 Alta |
| 3 | **Generador de Informes Mensuales** | Botón que genera un informe de actividades del mes basado en las sesiones marcadas como finalizadas. | 🟡 Media |
| 4 | **Validación de Coherencia del Plan** | Botón "Revisar" que usa IA para detectar desequilibrios (demasiadas competencias en una unidad, poca cobertura en otra). | 🟡 Media |
| 5 | **Vínculo Diagnóstico → Sesión** | El diagnóstico (M01) influye activamente en las sugerencias de estrategias de cada sesión generada. | 🟡 Media |
| 6 | **Generador de Instrumentos Completos** | Rúbricas, listas de cotejo y guiones de observación listos para imprimir, generados desde el Plan. | 🟢 Futura |
| 7 | **Módulo de Recursos Inteligentes** | Estructura para almacenar y buscar FAQs, PDFs, Videos y Fichas curadas. | 🔴 Alta |
| 8 | **Multi-Planificación (Secciones)** | Dashboard para duplicar o vincular planes entre diferentes secciones (5to A, B, C) sin repetir trabajo. | 🔴 Alta |

#### 🚀 Visión de Futuro: El Sistema Operativo del Docente

1. **El "Panel del Día" (Dashboard Operativo)**
   - **Lo que falta:** Pantalla de bienvenida contextual: "Hola, hoy es martes 15. Tienes sesión en 5to 'B'. Aquí está tu secuencia y materiales".
   - **Por qué importa:** Convierte la app en un asistente de escritorio de un solo vistazo, eliminando la navegación tediosa diaria.

2. **El Registro de Logros (Cerrar el Círculo)**
   - **Lo que falta:** Un Registro Auxiliar digital donde volcar los niveles de logro (AD, A, B, C).
   - **Por qué importa:** Si ya diseñamos los criterios de evaluación, la app ya sabe qué calificar. Solo falta el espacio para el registro final.
   - **Prioridad:** Es lo que genera retención absoluta del docente en la plataforma.

3. **El "Generador de Informes" para el Director**
   - **Lo que falta:** Botón para generar informes mensuales automáticos.
   - **Por qué importa:** Es el mayor peso administrativo del docente peruano. La IA puede redactarlos en segundos usando los datos de las sesiones ejecutadas.

4. **Multi-Planificación (Gestión de Secciones)**
   - **El Problema:** El esquema actual parece diseñado para una sola sección.
   - **La Mejora:** Un dashboard donde el docente pueda **duplicar** su plan de 5to A para 5to B mágicamente.
   - **Por qué importa:** El docente de secundaria no sobrevive si tiene que planificar 5 veces lo mismo por separado.

#### 🔗 El "Eslabón Perdido": La Reflexión Post-Sesión e Interacción Real
1. **Reflexión Post-Sesión:** Implementar un botón de **"¿Cómo te fue hoy?"** al terminar cada sesión.
   - **Dinámica:** Si el docente indica que no terminó una actividad, la IA propone: "¿Quieres que movamos esta actividad a mañana y ajustemos los tiempos automáticamente?".
   - **Valor:** TizaMágica deja de ser un generador de documentos y se convierte en una inteligencia que aprende del ritmo real del aula.

2. **Modo Aula (Lectura Sin Distracciones):** 
   - **La Idea:** Una interfaz de tarjetas gigantes (tipo slides) para proyectar o leer desde el celular mientras se dicta la clase.
   - **Valor:** El docente no lee un PDF; sigue un guion legible con cronómetro incorporado.

3. **Tickets de Salida Express:**
   - **La Idea:** Botón que genera 2-3 preguntas de evaluación rápida (imagen/PDF) basadas exclusivamente en el propósito del día.
   - **Valor:** Datos frescos para alimentar el Registro de Logros.

#### ⚖️ Priorización Estratégica
1. **Instrumentos (Rúbricas):** Prioridad inmediata porque es el "dolor de cabeza" Nº1.
2. **Registro de Logros:** Prioridad de retención para cerrar el ciclo pedagógico completo.

---

## VI. Hoja de Ruta de Implementación (Versión Maestra 2.0)

Esta secuencia ha sido diseñada para maximizar el impacto visual inmediato y construir la inteligencia pedagógica de forma acumulativa y lógica.

### 🚀 SPRINT 1: "La Cara de la App" (Identidad y UX)
**Meta:** Unificación estética total y eliminación de redundancias.
- [x] **Refactor NavPills:** Estandarización de pestañas con `<TabSwitch>` (Dark Luxe).
- [x] **Componente `<ModuleHeader>`:** Implementación del header responsivo y unificado con badges (M01-M05).
- [ ] **1.1 Arquitectura Líquida:** Migración de contenedores a `max-w-[1600px]` (Ver [Sec 1.6](#16-layout-líquido-y-responsivo)).
- [ ] **1.2 Refuerzo de Contraste:** Barrido de CSS para `text-gray-400` (Ver [Sec 1.2](#12-regla-de-visibilidad-y-contraste)).
- [ ] **1.3 Jerarquía Tipográfica:** Aplicar `font-black` y `tracking-widest` (Ver [Sec 1.1](#11-jerarquía-tipográfica-unificada)).
- [ ] **1.4 Flujo de Sesión Limpio:** Eliminar botones de pie de página (Ver [Sec 1.11](#111-la-navegación-de-salida-y-flujo-continuo)).
- [ ] **1.5 Estandarización AIButton:** Posición fija a la derecha (Ver [Sec 1.10](#110-el-botón-de-pánico-ai-help---estandarización)).
- [ ] **1.6 Sync Glow:** Indicador de estado de guardado en Header (Ver [Sec 1.10](#110-feedback-de-sincronización-cloud-sync)).

### 📚 SPRINT 2: "El Combustible Pedagógico" (M01 y M02)
**Meta:** Recolectar datos críticos para que la IA personalice el resto del año.
- [x] **2.1 Matrícula Base:** Registro de nombres y cantidad de alumnos en M01.
- [ ] **2.2 Inclusión DUA:** Implementar selector de NEE (Ver [Sec II - M01 #2](#m01--diagnóstico-integral)).
- [ ] **2.3 Línea de Base Académica:** Matriz AD/A/B/C del año anterior (Ver [Sec II - M01 #1](#m01--diagnóstico-integral)).
- [ ] **2.4 ADN Pedagógico (M02):** Selector de Enfoques ABP/Gamificación (Ver [Sec II - M02 #1](#m02--identidad-institucional-y-perfil-pedagógico)).
- [ ] **2.5 Lema del Aula:** Campo de visión motivacional (Ver [Sec II - M02 #4](#m02--identidad-institucional-y-perfil-pedagógico)).

### 🗺️ SPRINT 3: "La Inteligencia Curricular" (M03 y M04)
**Meta:** Asegurar que el plan cumpla con la norma y tenga una narrativa coherente.
- [ ] **3.1 Radar de Coberturas:** Barra lateral de % en M03 (Ver [Sec II - M03 #1](#m03--propósitos-y-calendario)).
- [ ] **3.2 Tooltips de Estándares:** Estándares CNEB en hover (Ver [Sec II - M03 #2](#m03--propósitos-y-calendario)).
- [ ] **3.3 Sincronización de Periodos:** Bimestre/Semestre flujo M03 -> M04 (Ver [Sec II - M03 #4](#m03--propósitos-y-calendario)).
- [ ] **3.4 Hilo Conductor (M04):** Campo "Eje Articulador" del año (Ver [Sec II - M04 #1](#m04--estrategia-anual)).
- [ ] **3.5 Renombrado de Unidades:** Actualizar a SITUACIÓN/PROPÓSITOS... (Ver [Sec III #6](#iii-mejoras-en-unidades-didácticas)).

### 🍎 SPRINT 4: "El Superpoder en el Aula" (M05 y Sesiones)
**Meta:** Generar materiales y rúbricas listas para el escritorio del docente.
- [ ] **4.1 Alineación Inteligente:** IA sugiere competencias desde Situación (Ver [Sec III #1](#iii-mejoras-en-unidades-didácticas)).
- [ ] **4.2 Validador de Tiempos:** Alerta de exceso de minutos (Ver [Sec IV #1](#iv-mejoras-en-sesiones-de-aprendizaje)).
- [ ] **4.3 Rúbrica Automática:** Generador de tablas AD/A/B/C (Ver [Sec IV #2](#iv-mejoras-en-sesiones-de-aprendizaje)).
- [ ] **4.4 Guion Docente:** Diálogos y preguntas mediadoras (Ver [Sec IV #4](#iv-mejoras-en-sesiones-de-aprendizaje)).
- [ ] **4.5 Materiales Express:** Pestaña de lecturas y comprensión (Ver [Sec IV #3](#iv-mejoras-en-sesiones-de-aprendizaje)).

### 🔄 SPRINT 5: "El Círculo Completo" (Dashboard y Gestión)
**Meta:** Operatividad diaria y reportes administrativos.
- [ ] **5.1 Dashboard Maestro:** Pantalla inicial operativa (Ver [Sec V #1](#v-características-globales-faltantes)).
- [ ] **5.2 Multi-Sede/Secciones:** Copiar y vincular planes (Ver [Sec V #8](#v-características-globales-faltantes)).
- [ ] **5.3 Registro de Logros:** Tabla de notas conectada a M01 (Ver [Sec V #2](#v-características-globales-faltantes)).
- [ ] **5.4 Informe Mensual:** PDF automático para dirección (Ver [Sec V #3](#v-características-globales-faltantes)).
- [ ] **5.5 IA de Ajuste:** Reflexión para reprogramar sesiones (Ver [Sec V - Visión #1](#🔗-el-eslabón-perdido-la-reflexión-post-sesión-e-interacción-real)).

---

**Criterio de Éxito:** La Versión 2.0 se considerará un éxito cuando el docente pueda transitar desde el Diagnóstico inicial hasta tener una sesión con materiales listos para imprimir en menos de 10 minutos, bajo una interfaz 100% cohesionada.

*Actualizado el 14 de Marzo de 2026 — Antigravity Engine.*

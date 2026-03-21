# Guía Experta de Optimización UX/UI para TizaMágica (PlanX System)

*Este documento es una auditoría y guía de implementación experta, diseñada para elevar la interfaz y la experiencia de usuario (UX/UI) de **TizaMágica (PlanX System)** a un estándar de clase mundial. Creado a partir de los principios de la psicología cognitiva, la ergonomía visual y heurísticas de usabilidad comprobadas.*

---

## Introducción: La Psicología del Docente frente a la Pantalla

Antes de mover un solo píxel, debemos entender el contexto de nuestro usuario principal: **el docente**. Un maestro suele llegar a TizaMágica después o durante un día laboral agotador, con un nivel de energía mental reducido. En este estado, la sobrecarga cognitiva es el enemigo número uno.

**Regla de oro fundacional:** El ojo humano no lee una interfaz, la escanea. Igual que cuando entramos por primera vez a un supermercado y sabemos instintivamente que por lo general los lácteos están al fondo y las cajas al frente; el cerebro del usuario busca desesperadamente patrones conocidos para orientarse y no gastar energía. Si TizaMágica no ofrece esta familiaridad, el docente experimentará fricción, frustración y, finalmente, abandonará la herramienta.

---

## 1. Anatomía de la Familiaridad (Modelos Mentales y Patrones Visuales)

Cuando un educador ingresa a TizaMágica, en fracciones de segundo (específicamente en menos de 3 a 5 segundos), su cerebro realiza tres preguntas vitales:
1. *¿Estoy en el lugar correcto?*
2. *¿Para qué me sirve exactamente esto?*
3. *¿Por dónde empiezo sin equivocarme o romper algo?*

Si la pantalla inicial (Hero Section) no responde de inmediato a estas inquietudes, hemos fracasado en la primera impresión.

### 📍 ¿Dónde aterrizan los ojos primero? El "Foco de Inicio"
Cualquier persona acostumbrada a leer en lenguajes occidentales inicia su recorrido visual en la **esquina superior izquierda**. 
- **La Parte Superior (Header - El GPS del usuario):** El usuario espera encontrar el **logotipo** a la izquierda. Su modelo mental le dicta que: *"Tocar el logo me salva, me saca de donde me perdí y me devuelve al inicio"*. A la derecha, espera encontrar su perfil o la acción principal ("Crear Sesión"). Si el header de TizaMágica es ruidoso o no cumple esto, la navegación completa se quiebra.

### 🧠 Patrones de Lectura Visual (El Mapa del Tesoro para TizaMágica)

#### A. El Patrón en "Z" (Para la pantalla de bienvenida y Landing Pages)
Este patrón ocurre en pantallas limpias donde la acción es primordial.
- **Flujo:** Arriba-Izquierda (Logo) ➡️ Arriba-Derecha (Menú/Login) ↙️ Diagonal hacia el centro (Mensaje Principal de PlanX) ➡️ Abajo-Derecha (Botón de Acción: *"Empezar a planificar"*).
- **Aplicación en TizaMágica:** La página de inicio o el "Dashboard" principal cuando está vacío, debe seguir estrictamente este flujo, colocando el botón principal (CTA) de "Crear Sesión" justo donde el ojo termina su recorrido en Z.

#### B. El Patrón en "F" (Para la lectura del CNEB y listados densos)
Este patrón aparece cuando hay listas, currículos, o resultados. El docente lee completamente la primera línea horizontal, baja, lee solo la mitad de la segunda línea, y luego sus ojos descienden a toda velocidad verticalmente pegados al margen izquierdo.
- **Aplicación en TizaMágica:** Al momento de listar las Competencias, Capacidades y Desempeños del CNEB. **Nunca** pongamos las palabras clave al final de la frase. El ojo solo escaneará la primera o segunda palabra del lado izquierdo. Los menús laterales (Sidebars) de selección de grado y área deben tener íconos y textos extremadamente concisos.

---

## 2. Estructura de Navegación "A Prueba de Tontos" (Fricción Cero)

La navegación es el timón de TizaMágica. Como en el diseño de un aeropuerto bien señalizado, el usuario debe encontrar su sala de embarque sin tener que pedir ayuda al personal.

### La Ley de Miller y la Navegación Basada en Tareas (Job-to-be-Done)
La capacidad de procesamiento a corto plazo del cerebro humano se rige por el número **5 ± 2** (entre 3 y 7 elementos). Más de 7 ítems produce "parálisis por análisis".

**Regla UX: Navegar por tareas, no por módulos.** 
El docente no piensa en "módulos"; piensa en "problemas a resolver". Cada opción del menú debe responder a la pregunta interna: *“¿Qué necesito hacer ahora?”*.

**La estructura recomendada (orientada a la intención):**
1. **Inicio / Mis Clases:** El resumen visual y continuidad.
2. **Crear Sesión de Aprendizaje:** El acceso directo a la tarea reina.
3. **Mis Planificaciones:** Gestión de lo ya avanzado.
4. **Recursos Pedagógicos:** Banco de apoyo (CNEB, ejemplos).
5. *(Derecha)* **Perfil / Centro de Configuración.**

### Herramientas de Rescate y Orientación Mental
- **Migas de Pan (Breadcrumbs):** Imprescindibles en TizaMágica. Cuando el docente está armando una sesión en el paso 3 de un Wizard, la parte superior debe mostrar: `Tablero > Planificador de Unidad > Sesión: Matemáticas`. Esto elimina la ansiedad de "estar perdido".
- **Barra de Búsqueda Visible:** Un educador tiene prisa. Desea buscar "Sesión sobre fracciones" y que aparezca al instante. El buscador no debe estar escondido en un submenú.
- **Menús Desplegables Inteligentes:** Usar con cautela. TizaMágica no debe tener menús que desplieguen sub-categorías que a su vez desplieguen más opciones. Una regla: Un solo nivel de profundidad.

---

## 3. El Viaje del Usuario Docente (User Journey Map)

Debemos orquestar el flujo desde el ingreso hasta el momento de satisfacción profunda ("Aha! moment") cuando el PDF o el material es generado. Implica pensar como un servicio exclusivo.

### Paso 1: Aterrizaje y Onboarding Progresivo (Acompañamiento inicial)
- **Estado mental:** *"No tengo tiempo. Dime rápido si esto de verdad facilita mi planificación."*
- **Diseño Ideal:** Una pantalla limpia con una pregunta directa: **“¿Qué quieres hacer hoy?”**.
- **Onboarding "Just-in-Time":** No enseñar todo al inicio. Implementar tooltips contextuales (pequeños globos) que aparezcan solo cuando el docente pasa por una sección nueva: *“Aquí eliges la competencia”*. Deben desaparecer tras 1 o 2 usos para no ser invasivos.

### Paso 2: El Escritorio y la Continuidad Mental
- **Estado mental:** *"¿Dónde están las cosas que dejé ayer?"*
- **Diseño Ideal:** Una pantalla de **reingreso inteligente**. Al entrar, la app debe saludar y recordar: *"Ayer estabas trabajando en: Sesión 3 – Matemática – Fracciones. ¿Deseas continuar?"*.
- **Opciones de entrada:** Botón destacado de **"Retomar donde lo dejé"** vs **"Empezar algo nuevo"**. Esto elimina la fricción mental de reconstruir el contexto previo.

### Paso 3: La Acción y la Reducción de Ansiedad
- **Estado mental:** *"No quiero equivocarme al vincular las competencias. ¿Cómo se verá esto al imprimir?"*
- **Modo Doble de Trabajo (Rapidez vs. Detalle):** 
  - **Modo Rápido:** Para docentes con prisa, usando selecciones mínimas y plantillas predefinidas.
  - **Modo Detallado:** Personalización total para planificación profunda. 
  *(Esto reduce el abandono al no forzar un único camino).*
- **Vista Previa Viva (Live Preview):** Implementar un panel lateral o flotante que muestre el documento final actualizándose en tiempo real. Ver el resultado reduce la ansiedad de *"¿Esto se verá bien cuando lo descargue?"*.
- **Proceso recomendado:** Wizards progresivos por etapas lógicas:
  - *Paso 1: Configuración (Bimestre, Grado).*
  - *Paso 2: Selección CNEB (Competencias).*
  - *Paso 3: Propósito y Secuencia Didáctica.*
  Cada paso debe guardar automáticamente e incluir una barra de progreso. El cerebro ama y se motiva cuando ve una barra de progreso completándose.

---

## 4. Reglas de Oro, Heurísticas y Sistema de Diseño (Design System)

Para que TizaMágica adquiera la apariencia y sensación de una aplicación verdaderamente experta, premium y confiable, la interfaz debe obedecer a leyes de diseño irrevocables.

### A. Botones y Llamados a la Acción (CTA)
- **Acción = Verbo:** Los botones nunca deben decir "Siguiente" o "Enviar". La regla de oro del UX Writing indica que el botón debe completar la frase *"Yo quiero..."*. Por ende, los botones deben decir: *"Generar Sesión"*, *"Guardar en Mis Documentos"*, *"Añadir Competencia"*.
- **Contraste y Tamaño (Ley de Fitts):** El botón de acción principal ("Crear") debe tener un color vibrante que resalte diametralmente sobre toda la pantalla oscura o neutra. Además, en dispositivos móviles, debe ser fácil de tocar (mínimo de 44x44 píxeles).

### B. Jerarquía Visual y Espacios en Blanco
- **La Jerarquía habla:** Deben haber exactamente 3 a 4 niveles tipográficos inconfundibles. Un Titular (H1) que mande en la pantalla (Ej. *"Secuencia Didáctica"*), Subtitulares (H2) que dividan el contenido, y cuerpo de texto que sea fácilmente legible, nunca menor a 14px-16px.
- **El Espacio en Blanco (White space):** No es un vacío, es el "aire" de la aplicación. Al docente le asfixian las plataformas recargadas del estado peruano (como SIAGIE). TizaMágica debe diferenciarse ofreciendo grandes márgenes, permitiendo que la información respire. Si cada elemento resalta, absolutamente nada resalta.

### C. Consistencia Total
- La inconsistencia genera micro-traumas cognitivos. Si un botón de "Cancelar" o "Retroceder" en TizaMágica va a la izquierda y tiene borde gris, en **todas** las demás vistas del programa (modal, wizard, perfil) debe estar exactamente a la izquierda, y tener el **mismo** estilo visual. 

### D. Tono de Voz y Lenguaje 100% Docente
El diseño no son solo cajas, también son palabras (UX Writing). La app debe sentirse como un copitolo, no como un supervisor.
- **Regla Oro:** Si un docente no usaría esa palabra en la sala de profesores, no debe aparecer en la app.
  - ❌ *"Configurar parámetros"* ➡️ ✅ *"Elige los datos de tu clase"*.
  - ❌ *"Exportar"* ➡️ ✅ *"Descargar mi sesión"*.
- **Validaciones Empáticas:** En vez de errores fríos, usar mensajes que acompañen:
  - ❌ *"Campo obligatorio no completado"* ➡️ ✅ *"Para generar la sesión, solo falta elegir una competencia."*

### E. Micro-recompensas y Motivación Silenciosa
Inyectar dopamina positiva para reducir la fatiga mental del trabajo administrativo.
- **Checks Visuales:** Al completar un paso crítico, mostrar una animación sutil de éxito.
- **Refuerzo Positivo:** Mensajes de logro como *"¡Listo! Tu sesión ya está alineada al CNEB"* o *"¡Excelente! Has ahorrado 30 minutos de trabajo hoy"*.
- **Barra de Progreso Celebratoria:** El final del proceso debe sentirse como un pequeño triunfo.

---

## Resumen Ejecutivo de Implementación Inmediata para TizaMágica

1. **Capas Operativas y Pedagógicas:** No solo mostrar la app, sino acompañar al docente. Implementar un **Onboarding Progresivo** (pregunta inicial: "¿Qué quieres hacer hoy?") y tooltips contextuales que desaparezcan tras el uso.
2. **Navegación por Tareas (JTBD):** Rediseñar el Header y menús para responder a intenciones reales: "Crear sesión", "Descargar planificación", en lugar de nombres de módulos técnicos.
3. **Módulo de Continuidad y Doble Modo:** Asegurar que el docente pueda **"Retomar donde lo dejé"** al reingresar. Ofrecer un **"Modo Rápido"** (plantillas) para ahorro máximo de tiempo y un **"Modo Detallado"** para personalización profunda.
4. **Validaciones y Tono Docente:** Eliminar el lenguaje técnico. Sustituir "Exportar" por "Descargar mi sesión" y usar validaciones empáticas que funcionen como copiloto, no como supervisor.
5. **Vista Previa y Micro-recompensas:** Mantener una **vista previa viva** del documento para reducir ansiedad y celebrar cada paso completado con micro-animaciones (checks) y mensajes de motivación.

---

## 📋 Log de Tareas: Roadmap de Implementación (TizaMágica v3.0)

### 🏗️ Fase 1: Estructura, Navegación y Acompañamiento (Prioridad Alta)
- [ ] **Rediseño del Header por Tareas:** Usar etiquetas Job-to-be-Done (Crear Sesión, Mis Planificaciones).
- [ ] **Onboarding Inicial:** Crear pantalla de bienvenida con la pregunta estratégica "¿Qué quieres hacer hoy?".
- [ ] **Navegación de Rescate:** Implementar Breadcrumbs y Omni-Search para localización inmediata.

### 🧙 Fase 2: El Planificador Inteligente (Prioridad Crítica)
- [ ] **Módulo de Continuidad (Smart Entry):** Lógica de "Retomar donde lo dejé" al cargar el Dashboard.
- [ ] **Doble Modo de Trabajo:** Selector de "Modo Rápido" (Templates) vs "Modo Detallado" (Full Custom).
- [ ] **Vista Previa Viva:** Panel de previsualización en tiempo real del documento PDF/Word.
- [ ] **Refactor de Wizard:** División en 4 pasos con auto-guardado en Supabase por cada transición.

### 🎨 Fase 3: Refinamiento de UX Writing y Motivación (Prioridad Media)
- [ ] **Auditoría de Lenguaje 100% Docente:** Sustituir léxico técnico por palabras usadas en la sala de profesores.
- [ ] **Sistema de Micro-recompensas:** Animaciones de éxito y mensajes de refuerzo positivo al completar pasos.
- [ ] **Validaciones Empáticas:** Redeseño de alertas de error a un tono de "ayuda del copiloto".
- [ ] **Estética Dark Luxe:** Consolidar márgenes de 32px y tipografía Outfit/Inter.

### 🧪 Fase 4: Pruebas de Usuario y Optimización (Prioridad Continua)
- [ ] **Prueba de los "5 Segundos":** Validar si la propuesta de valor es clara para un docente nuevo.
- [ ] **Test de Fricción:** Medir el tiempo de creación en ambos modos de trabajo.
- [ ] **Optimización Táctil:** Garantizar targets de 44px para uso cómodo en smartphones.

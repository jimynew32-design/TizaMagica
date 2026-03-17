# PLANX SYSTEM v2.0 — ESPECIFICACIÓN DE REQUERIMIENTOS DE SOFTWARE (SRS)
**Software Requirements Specification (SRS) — Arquitectura Híbrida: Local-First + Supabase Cloud**  
**Despliegue: GitHub Pages | Motor IA: Google Gemini API**

> **DIRECTIVA MAESTRA PARA ANTIGRAVITY:**  
> Este documento es la **única fuente de verdad** para la construcción, mantenimiento y evolución de **PlanX System**.  
> Se debe seguir un desarrollo **secuencial, modular y acumulativo**, donde:  
> 1. **La persistencia local** (IndexedDB/Dexie.js + localStorage) garantiza velocidad y funcionalidad offline.  
> 2. **Supabase** se utiliza exclusivamente para **autenticación de usuarios** (registro/login con DNI + PIN).  
> 3. **Google Gemini** es el motor de IA principal, con sistema de fallback automático de 3 modelos.  
> 4. **La base de datos curricular** (CNEB: competencias, capacidades, desempeños, enfoques) se proporciona como archivos JSON precargados.  
> 5. **Las funcionalidades de Plan Anual y Unidades de Aprendizaje ya están implementadas y funcionan correctamente** — se deben copiar y mantener tal cual.  
> 6. Las secciones pendientes (Proyecto, Módulo, Sesión de Aprendizaje, Gestión) seguirán la misma dinámica y patrón de diseño.

> **Stack Tecnológico Confirmado:**  
> `Vite` + `React 18` + `TypeScript` + `TailwindCSS 3` + `Zustand+Immer` + `Dexie.js (IndexedDB)` + `Supabase Auth` + `Google Gemini API` + `GitHub Pages` + `Material Icons Round`

---

## 1. INTERFAZ DE ACCESO (VISTA INICIAL)
*Punto de entrada al sistema. Diseñado para fricción mínima y autenticación mediante Supabase.*

### **1.1 Pantalla de Bienvenida**
El sistema presenta una interfaz limpia y moderna estilo Modern Dark Mode con los siguientes elementos:

*   **Ícono Central:** Icono `dashboard` (Material Icon) de color `primary-teal`
*   **Encabezado:** `PlanX System` (estilo: negrita, Inter, tracking-tight)
*   **Subtítulo Dinámico:**
    *   Tab "Acceder" → `Bienvenido de nuevo, docente`
    *   Tab "Registrarse" → `Crea tu cuenta para empezar`

### **1.2 Sistema de Tabs (Acceder / Registrarse)**
*   **Tab Switch:** Contenedor `rounded-full` (estilo pill) con fondo `#2c3444`
*   **Tab Activo:** Fondo `primary-teal` (#4fd1c5) con texto oscuro y shadow glow
*   **Tab Inactivo:** Texto gris/muted con hover a blanco
*   **Al cambiar de tab:** Se limpia cualquier mensaje de error previo

### **1.3 Formulario de Autenticación**
*   **Campo DNI del Docente:**
    *   Input con estilo neón sutil, bordes redondeados `rounded-full`
    *   Máximo: 8 caracteres, solo dígitos
    *   Placeholder: `00000000`
    *   Estilo: `font-mono tracking-widest text-lg`
    *   Estilo: `bg-[#232a3b] border-gray-700/30 focus:ring-primary-teal`
*   **Campo PIN de Acceso:**
    *   Etiqueta dinámica: "PIN de Acceso" (login) / "Crea un PIN de 4 dígitos" (registro)
    *   Tipo: `password`, máximo: 4 dígitos
    *   Placeholder: `••••`
    *   Bordes `rounded-full`

### **1.4 Validaciones del Formulario**
| Validación | Regla | Mensaje de Error |
|---|---|---|
| DNI incompleto | `dni.length !== 8` | `DNI debe tener 8 dígitos` |
| PIN incompleto | `pin.length !== 4` | `PIN debe tener 4 dígitos` |
| DNI ya registrado (registro) | DNI existe en BD | `Este DNI ya está registrado. Por favor, inicia sesión.` |
| PIN incorrecto (login) | PIN no coincide | `PIN incorrecto para este DNI o el usuario no existe.` |

### **1.5 Flujo de Autenticación (Supabase)**
> [!IMPORTANT]
> **Migración pendiente:** Actualmente la autenticación usa IndexedDB local. Se debe migrar a **Supabase Auth** para persistencia en la nube.

**Flujo de Registro (Nuevo):**
1. Usuario ingresa DNI + PIN en tab "Registrarse"
2. Se valida formato (8 dígitos DNI, 4 dígitos PIN)
3. Se verifica que el DNI no exista en Supabase → `supabase.auth.signUp()`
4. Se crea perfil vacío en `IndexedDB` local + respaldo en tabla `perfiles` de Supabase
5. Se redirige al **Onboarding** (`/onboarding`)

**Flujo de Login (Existente):**
1. Usuario ingresa DNI + PIN en tab "Acceder"
2. Se valida contra Supabase → `supabase.auth.signInWithPassword()`
3. Se carga el perfil desde Supabase y se sincroniza con IndexedDB local
4. Si `isOnboarded === true` → Redirige a `/dashboard`
5. Si `isOnboarded === false` → Redirige a `/onboarding`

### **1.6 Redirección Automática**
*   Si el usuario ya está autenticado y está onboarded → Navega automáticamente a `/dashboard`
*   Si el usuario ya está autenticado y NO está onboarded → Navega automáticamente a `/onboarding`
*   Componente `PrivateRoute` protege todas las rutas del Dashboard

### **1.7 Footer del Sistema**
*   **Texto:** `V2.0 Architecture • Hybrid Persistence (Local + Cloud)`
*   **Botón Peligroso:** `[ Reiniciar Sistema ]`
    *   Acción: Limpia IndexedDB local (perfiles, planes, unidades, sesiones)
    *   Confirmación obligatoria con `window.confirm()`
    *   Recarga completa: `window.location.reload()`

### **1.8 Diseño Visual**
*   **Fondo:** `bg-background` con dos efectos glow difuminados (blue-500/10 y indigo-500/10)
*   **Card principal:** `rounded-[2.5rem]`, `backdrop-blur-xl`, `border-white/5`, `shadow-2xl`
*   **Botón de acción:** `bg-brand-magenta`, `h-14`, `rounded-2xl`, con ícono `LogIn` animado al hover

> **Archivo:** [`LoginPage.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/auth/LoginPage.tsx)

---

## 2. MAPA DE ESTRUCTURA DEL SISTEMA
*Jerarquía organizacional completa de PlanX. Todo el sistema se articula en 4 grandes bloques pedagógicos.*

> [!NOTE]
> Las secciones marcadas con ✅ ya están implementadas y funcionan correctamente.
> Las secciones marcadas con 🔧 están pendientes de desarrollo.

### **Bloque 0: Infraestructura y Acceso**
| # | Sección | Estado |
|---|---------|--------|
| 0.1 | Interfaz de Acceso (Login/Registro) — Sección 1 | ✅ |
| 0.2 | Wizard de Onboarding (3 pasos) — Sección 7 | ✅ |
| 0.3 | Dashboard / Centro de Control — Sección 8 | ✅ |

### **Bloque 1: Plan Anual (Largo Plazo)**
| # | Sub-sección | Módulo | Estado |
|---|-------------|--------|--------|
| 1.1 | **Diagnóstico** | — | ✅ |
| 1.1.1 | Caracterización del Contexto | M01 - Matriz Heatmap 5x3 | ✅ |
| 1.1.2 | Características Particulares | M01 - Semáforo Cognitivo/Físico/Emocional | ✅ |
| 1.1.3 | Estilos, Intereses y Lenguaje | M01 - Tags + EIB | ✅ |
| 1.1.4 | Identidad | M02 - Descripción General del Área | ✅ |
| 1.1.5 | Identidad Institucional | M02 - Datos de Onboarding | ✅ |
| 1.2 | **Propósito** | — | ✅ |
| 1.2.1 | Propósitos y Enfoques | M03 - Malla Curricular CNEB | ✅ |
| 1.2.2 | Enfoques Transversales | M03 - Selector de Enfoques y Valores | ✅ |
| 1.2.3 | Calendario Comunal y Eventos Significativos | M03 - Texto libre | ✅ |
| 1.3 | **Estrategia** | — | ✅ |
| 1.3.1 | Estrategia Anual | M04 - Matriz de Unidades U1-U8 | ✅ |
| 1.4 | **Orientaciones** | — | ✅ |
| 1.4.1 | Orientaciones para la Evaluación | M05 - Diagnóstica/Formativa/Sumativa | ✅ |
| 1.4.2 | Recursos y Materiales Educativos | M05 - Docente/Estudiante | ✅ |

### **Bloque 2: Mediano Plazo**
| # | Sub-sección | Workflow | Estado |
|---|-------------|----------|--------|
| 2.1 | **Unidad de Aprendizaje** | 5 pasos | ✅ |
| 2.1.1 | Diagnóstico | Herencia del Plan Anual | ✅ |
| 2.1.2 | Diseña y Determina | Selección CNEB + Desempeños Precisados | ✅ |
| 2.1.3 | Organiza | Calendario + Criterios de Evaluación | ✅ |
| 2.1.4 | Selecciona | Enfoques Transversales | ✅ |
| 2.1.5 | Prevé | Secuencia de Sesiones + IA | ✅ |
| 2.2 | **Proyecto de Aprendizaje** | 5 pasos (paralelo) | 🔧 |
| 2.2.1 | Análisis | Similar a Diagnóstico + Pregunta Retadora | 🔧 |
| 2.2.2 | Define y Establece | Competencias + Planificación Participativa | 🔧 |
| 2.2.3 | Estructura | Fases del Proyecto + Cronograma | 🔧 |
| 2.2.4 | Elige | Enfoques + Recursos | 🔧 |
| 2.2.5 | Anticipa | Producto Final + Sesiones | 🔧 |
| 2.3 | **Módulo de Aprendizaje** | 5 pasos (paralelo) | 🔧 |
| 2.3.1 | Revisión | Análisis de necesidades de aprendizaje | 🔧 |
| 2.3.2 | Conceptualiza | Definición de aprendizajes esperados | 🔧 |
| 2.3.3 | Coordina | Organización de actividades y tiempos | 🔧 |
| 2.3.4 | Escoge | Selección de estrategias y materiales | 🔧 |
| 2.3.5 | Proyecta | Diseño de secuencia y evaluación | 🔧 |

### **Bloque 3: Sesión de Aprendizaje (Corto Plazo)**
| # | Sub-sección | Descripción | Estado |
|---|-------------|-------------|--------|
| 3.1 | Título de la sesión | Herencia del nombre de sesión de la unidad | 🔧 |
| 3.2 | Propósito de aprendizaje | Objetivo de la sesión | 🔧 |
| 3.3 | Competencia | Herencia de competencia/capacidad de la unidad | 🔧 |
| 3.4 | Evidencia | Producto observable en la sesión | 🔧 |
| 3.5 | Instrumento de evaluación | Lista de Cotejo / Rúbrica / Guion de Observación | 🔧 |
| 3.6 | Secuencia didáctica | Inicio, Desarrollo, Cierre (con tiempos) | 🔧 |
| 3.7 | Recursos materiales | Lista de recursos necesarios | 🔧 |

### **Bloque 4: Gestión y Recursos**
| # | Sub-sección | Descripción | Estado |
|---|-------------|-------------|--------|
| 4.1 | Evaluación | Banco central de instrumentos generados | 🔧 |
| 4.2 | Recursos | Gestión de materiales vinculados a unidades/sesiones | 🔧 |

---

## 3. ARQUITECTURA TÉCNICA
*Especificaciones completas del sistema de persistencia, estado y despliegue.*

### **3.1 Persistencia Local: IndexedDB (Dexie.js v4)**
Motor principal de almacenamiento en el navegador. Garantiza velocidad y funcionalidad offline.

**Clase:** `PlanXDatabase extends Dexie` — Archivo: [`db.ts`](file:///c:/Users/xana3/Downloads/PlanX1/src/store/db.ts)

| Tabla | Índices | Descripción |
|-------|---------|-------------|
| `perfiles` | `id, dni` | Información del docente (nombre, institución, carga horaria) |
| `planes` | `id, perfilDocenteId, nivel, area` | Proyectos de planificación anual |
| `unidades` | `id, planAnualId, tipo` | Unidades, Proyectos o Módulos de aprendizaje |
| `sesiones` | `id, unidadId` | Detalle de cada sesión de aprendizaje |
| `cneb_index` | `id, nivel, area, competenciaId` | Caché del Currículo Nacional (competencias, capacidades) |
| `cneb_enfoques` | `++id, enfoque, valor` | Enfoques transversales con auto-incremento |

**Versión actual del schema:** `2`

### **3.2 Persistencia Cloud: Supabase**
> [!IMPORTANT]
> **Migración pendiente.** Supabase se debe integrar para:
> 1. **Autenticación** — `supabase.auth.signUp()` / `supabase.auth.signInWithPassword()` usando DNI como email ficticio (`{dni}@planx.edu.pe`) y PIN como contraseña.
> 2. **Respaldo de perfiles** — Tabla `perfiles` en Supabase como copia de seguridad (sincronización bidireccional con IndexedDB).
> 3. **NO se migrará** la planificación (planes, unidades, sesiones) a la nube. Esos datos viven exclusivamente en IndexedDB por privacidad y velocidad.

**Dependencia a agregar:** `@supabase/supabase-js`

### **3.3 Gestión de Estado Global (Zustand + Immer)**
Estado reactivo gestionado por **Zustand v4** con middleware de **persistencia** e **inmutabilidad** (Immer).

**Archivo:** [`store/index.ts`](file:///c:/Users/xana3/Downloads/PlanX1/src/store/index.ts)

| Slice | Archivo | Responsabilidad |
|-------|---------|-----------------|
| `PerfilSlice` | [`perfil-slice.ts`](file:///c:/Users/xana3/Downloads/PlanX1/src/store/slices/perfil-slice.ts) | Auth (login/logout/register), CRUD perfil docente, reset DB |
| `PlanAnualSlice` | [`plan-anual-slice.ts`](file:///c:/Users/xana3/Downloads/PlanX1/src/store/slices/plan-anual-slice.ts) | CRUD planes anuales, diagnóstico, sincronización con carga horaria |
| `UnidadesSlice` | [`unidades-slice.ts`](file:///c:/Users/xana3/Downloads/PlanX1/src/store/slices/unidades-slice.ts) | CRUD unidades/proyectos/módulos, upsert con IndexedDB |
| `AIConfigSlice` | [`ai-config-slice.ts`](file:///c:/Users/xana3/Downloads/PlanX1/src/store/slices/ai-config-slice.ts) | Provider IA (gemini/lmstudio), API keys, modelo activo |

**Persistencia Híbrida:**
*   `localStorage` → Solo persiste `perfil` y `aiConfig` (estado ligero, acceso inmediato en la UI)
*   `IndexedDB` → Persiste documentos pesados (planes, unidades, sesiones, CNEB)

### **3.4 Routing y Navegación (React Router v7)**
**Archivo:** [`App.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/App.tsx)

| Ruta | Componente | Protección |
|------|-----------|------------|
| `/login` | `LoginPage` | Pública |
| `/onboarding` | `OnboardingWizard` | Requiere `isAuthenticated` |
| `/*` (todas las demás) | `AppDashboard` | Requiere `isAuthenticated` + `isOnboarded` |

*   **`PrivateRoute`:** Componente wrapper que redirige a `/login` si no hay sesión y a `/onboarding` si no ha completado el wizard.

### **3.5 Despliegue: GitHub Pages**
> [!IMPORTANT]
> **Configuración pendiente para GitHub Pages:**

1. **Agregar `base` en `vite.config.ts`:** `base: '/PlanX1/'` (o el nombre del repositorio)
2. **Agregar script de deploy en `package.json`:** `"deploy": "npm run build && npx gh-pages -d dist"`
3. **Agregar dependencia:** `gh-pages` como devDependency
4. **SPA Routing Fix:** Crear `public/404.html` con redirect script para que las rutas de React Router funcionen en GitHub Pages
5. **Variables de entorno:** Las API keys de Gemini deben configurarse como GitHub Secrets y no incluirse en el repositorio

### **3.6 Variables de Entorno**
**Archivo:** [`.env.example`](file:///c:/Users/xana3/Downloads/PlanX1/.env.example)

| Variable | Valor por Defecto | Descripción |
|----------|-------------------|-------------|
| `VITE_GEMINI_API_URL` | `https://generativelanguage.googleapis.com/v1beta` | URL base de la API de Gemini |
| `VITE_GEMINI_MODEL_PRIMARY` | `gemini-2.5-flash` | Modelo principal |
| `VITE_GEMINI_MODEL_FALLBACK` | `gemini-2.0-flash` | Modelo de respaldo |
| `VITE_GEMINI_MODEL_LAST_RESORT` | `gemini-1.5-flash-latest` | Último recurso |
| `VITE_LMSTUDIO_URL` | `http://localhost:1234/v1/chat/completions` | URL local de LM Studio |
| `VITE_CNEB_INDEX_VERSION` | `2026.02.14.v1` | Versión del índice curricular |
| `VITE_DEFAULT_START_DATE` | `2026-03-02` | Fecha de inicio del año escolar |
| `VITE_DEFAULT_END_DATE` | `2026-04-03` | Fecha de término (por defecto) |

---

## 4. ORGANIZACIÓN DEL PROYECTO (FOLDER STRUCTURE)
*Árbol de carpetas real del proyecto. Arquitectura Feature-Based Design.*

```
PlanX1/
├── .env                          # Variables de entorno (NO subir al repo)
├── .env.example                  # Plantilla de variables de entorno
├── index.html                    # Entry point HTML
├── package.json                  # Dependencias y scripts
├── vite.config.ts                # Config de Vite (agregar base para GitHub Pages)
├── tailwind.config.js            # Config de TailwindCSS
├── tsconfig.json                 # Config de TypeScript
├── SRS_PLANX_SYSTEM.md           # ← ESTE DOCUMENTO (fuente de verdad)
│
├── src/
│   ├── App.tsx                   # Router principal + PrivateRoute
│   ├── main.tsx                  # ReactDOM.createRoot
│   ├── index.css                 # Estilos globales + design tokens
│   ├── vite-env.d.ts             # Tipos de Vite
│   │
│   ├── app/                      # Configuración de la aplicación
│   │   └── config/
│   │       ├── ai.config.ts      # Config de modelos IA (Gemini/LM Studio)
│   │       ├── constants.ts      # Constantes globales
│   │       └── index.ts          # Re-exports
│   │
│   ├── components/               # Componentes de UI reutilizables
│   │   ├── dashboard/            # PlanSelector, Sidebar, AuditReport, FloatingDocButton, AnnualPlanPreview
│   │   ├── forms/                # Componentes de formulario
│   │   ├── layouts/              # Dashboard.tsx (layout principal con routing)
│   │   ├── settings/             # Configuración de IA
│   │   └── ui/                   # NeonInput, botones, cards, componentes atómicos
│   │
│   ├── features/                 # ★ NÚCLEO DE LA APP (por módulo funcional)
│   │   ├── auth/                 # LoginPage.tsx, ProfileEditor.tsx
│   │   ├── onboarding/           # OnboardingWizard.tsx, SchedulerStep.tsx
│   │   ├── plan-anual/           # 5 editores: Diagnóstico, Identidad, Propósitos, Estrategia, Orientaciones
│   │   ├── plan-mediano-plazo/   # MedianoPlazoList, MedianoPlazoEditor
│   │   │   ├── components/       # Componentes específicos del mediano plazo
│   │   │   └── workflows/        # Workflows de 5 pasos:
│   │   │       ├── unidad/       #   WorkflowUnidad.tsx (✅ implementado)
│   │   │       ├── proyecto/     #   WorkflowProyecto.tsx (🔧 pendiente)
│   │   │       └── modulo/       #   WorkflowModulo.tsx (🔧 pendiente)
│   │   ├── sesiones/             # SesionEditor.tsx, SesionesList.tsx, InstrumentoConstructor.tsx
│   │   ├── evaluacion/           # EvaluacionDashboard.tsx
│   │   └── recursos/             # RecursosDashboard.tsx
│   │
│   ├── services/                 # Lógica de integración externa
│   │   ├── ai/                   # Motor IA
│   │   │   ├── index.ts          # chatCompletion(), chatCompletionGemini(), chatCompletionLMStudio()
│   │   │   ├── prompts.ts        # 14 funciones de prompts pedagógicos
│   │   │   └── auditor.ts        # auditPlan() - Auditoría de coherencia curricular
│   │   ├── cneb/                 # Currículo Nacional
│   │   │   ├── index.ts          # Servicios de consulta CNEB
│   │   │   ├── enfoques.ts       # Datos de enfoques transversales
│   │   │   └── data/             # ★ 54+ archivos JSON (competencias por área y nivel)
│   │   └── export/               # Generación de documentos Word/PDF
│   │
│   ├── store/                    # Estado global
│   │   ├── index.ts              # useStore (Zustand + persist + immer)
│   │   ├── db.ts                 # PlanXDatabase (Dexie.js)
│   │   └── slices/               # 4 slices: perfil, plan-anual, unidades, ai-config
│   │
│   ├── types/                    # Definiciones TypeScript
│   │   └── schemas.ts            # Interfaces: PerfilDocente, PlanAnual, Unidad, Sesion, CNEB*
│   │
│   ├── shared/                   # Utilidades compartidas
│   │   ├── components/           # Notification.tsx y otros componentes compartidos
│   │   ├── hooks/                # Custom hooks reutilizables
│   │   └── utils/                # date.utils.ts y otras utilidades
│   │
│   ├── hooks/                    # Hooks globales
│   ├── infrastructure/           # Infraestructura técnica
│   └── lib/                      # Utilidades de terceros (cn, clsx, etc.)
```

> [!TIP]
> **Convención de nombres:**
> - Carpetas en `kebab-case` (ej: `plan-mediano-plazo`)
> - Componentes React en `PascalCase` (ej: `LoginPage.tsx`)
> - Utilidades y stores en `kebab-case` (ej: `perfil-slice.ts`)
> - Datos CNEB en `snake_case` (ej: `arte_cultura_secundaria.json`)

---

## 5. MOTOR DE INTELIGENCIA ARTIFICIAL (GOOGLE GEMINI)
*Sistema de IA contextual para la generación pedagógica.*

### **5.1 Proveedor Principal: Google Gemini**
**Archivo:** [`services/ai/index.ts`](file:///c:/Users/xana3/Downloads/PlanX1/src/services/ai/index.ts)

La función `chatCompletion()` es el punto de entrada único. Detecta automáticamente el proveedor configurado en `aiConfig.provider`.

**Sistema de Fallback Automático (Gemini):**
| Prioridad | Modelo | Trigger |
|-----------|--------|---------|
| 1° Principal | `gemini-2.5-flash` | Uso normal |
| 2° Fallback | `gemini-2.0-flash` | Error 429 en modelo principal |
| 3° Último Recurso | `gemini-1.5-flash-latest` | Error 429 en fallback |

*   **Formato de respuesta:** `responseMimeType: "application/json"` (todas las respuestas son JSON parseables)
*   **Safety Settings:** Configurados para evitar bloqueos en contenido educativo
*   **Proveedor alternativo (desarrollo):** LM Studio (localhost), útil para pruebas sin consumir cuota de API

### **5.2 Lógica de Contextualización**
La IA **nunca genera contenido genérico**. Cada prompt inyecta:
1.  **Contexto Socio-Económico**: Extraído de la Matriz de Caracterización (1.1.1)
2.  **Perfil Estudiantil**: Extraído de Características Particulares (1.1.2) y Estilos/Intereses (1.1.3)
3.  **Calendario Local**: Hitos y eventos comunales (1.2.3)
4.  **Datos Curriculares**: Área, Grado, Ciclo, Nivel del CNEB
5.  **Datos Institucionales**: Nombre de I.E., Director, DRE/UGEL

### **5.3 Tipos de Acciones IA**
| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| **Poblar (Populate)** | Genera textos técnicos a partir de selecciones | Crear diagnóstico sociolingüístico basado en L1/L2 |
| **Sugerir (Suggest)** | Autocompleta matrices con recomendaciones | Marcar competencias por periodo en el calendario |
| **Mejorar (Improve)** | Refina textos escritos por el docente | Convertir un título genérico en uno retador |
| **Estructurar (Structure)** | Organiza secuencias lógicas | Crear plan de sesiones desde una unidad |
| **Contextualizar** | Adapta contenido al contexto local | Redactar situación significativa con datos del diagnóstico |

### **5.4 Catálogo de Prompts Implementados**
**Archivo:** [`services/ai/prompts.ts`](file:///c:/Users/xana3/Downloads/PlanX1/src/services/ai/prompts.ts)

| Prompt | Módulo | Tipo de Acción |
|--------|--------|----------------|
| `POBLAR_CONTEXTO` | M01 - Diagnóstico | Poblar |
| `POBLAR_CARACTERISTICAS` | M01 - Diagnóstico | Poblar |
| `POBLAR_ESTILOS` | M01 - Diagnóstico | Poblar |
| `POBLAR_LENGUAJE` | M01 - Diagnóstico | Poblar |
| `REDACTAR_DESCRIPCION_TECNICA` | M02 - Identidad | Poblar |
| `SUGERIR_PROPOSITOS` | M03 - Propósitos | Sugerir |
| `SUGERIR_METODOLOGIA` | M05 - Orientaciones | Sugerir |
| `SUGERIR_EVALUACION` | M05 - Orientaciones | Sugerir |
| `SUGERIR_RECURSOS` | M05 - Orientaciones | Sugerir |
| `REDACTAR_SITUACION_SIGNIFICATIVA` | M04 - Estrategia | Contextualizar |
| `CONTEXTUALIZAR_SITUACION` | Unidad - Diagnóstico | Contextualizar |
| `GENERAR_CRITERIOS` | Unidad - Organiza | Estructurar |
| `GENERAR_RUBRICA` | Unidad - Organiza | Estructurar |
| `GENERAR_SECUENCIA_SESIONES` | Unidad - Prevé | Estructurar |

### **5.5 Identidad de Escritura Pedagógica (Estilo Personalizado)**
> [!IMPORTANT]
> **Regla de oro de la IA:** Cada texto generado debe seguir la identidad del docente configurado (Estilo Personalizado):
> - Tono **narrativo y empática**, adaptado al nombre y perfil del docente, nunca burocrático ni técnico-frío.
> - Verbos en voz activa, oraciones cortas.
> - Conectores naturales (evitar enumeraciones listas).
> - Contextualización local (mencionar la zona, cultura, realidad del estudiante).
> - 100-200 palabras por sección generada (no más).

### **5.6 Auditoría de Coherencia Curricular**
**Archivo:** [`services/ai/auditor.ts`](file:///c:/Users/xana3/Downloads/PlanX1/src/services/ai/auditor.ts)

Sistema automático que detecta inconsistencias en la planificación:
*   Desempeños sin capacidad asociada
*   Competencias marcadas sin desempeños seleccionados
*   Unidades sin situación significativa
*   Sesiones sin propósito definido

---

## 6. FILOSOFÍA DEL PROYECTO
*Principios rectores del desarrollo de PlanX.*

1.  **Poco a Poco (Modular):** No se construirán funciones complejas sin antes validar los cimientos. Cada feature se desarrolla, prueba y valida antes de avanzar a la siguiente.
2.  **Hybrid-First:** Los datos pedagógicos viven en el navegador del docente (IndexedDB) para velocidad y privacidad. Solo la autenticación usa la nube (Supabase).
3.  **Human-Centric:** Diseñado POR y PARA docentes. Cada interacción elimina burocracia digital y maximiza el impacto pedagógico.
4.  **IA Contextual:** La inteligencia artificial no reemplaza al docente, lo potencia. Genera contenido basado en su contexto real, no respuestas genéricas.
5.  **Copiar lo que funciona:** Las funcionalidades de Plan Anual y Unidades ya validadas se copian exactamente. Proyecto y Módulo seguirán la misma dinámica.
6.  **Base de datos proporcionada:** Los datos curriculares del CNEB (competencias, capacidades, desempeños, enfoques transversales) se proporcionan como archivos JSON precargados — no se generan por IA.

---

## 7. WIZARD DE ONBOARDING (CONFIGURACIÓN INICIAL)
*Flujo secuencial de 3 pasos para capturar los datos base del entorno pedagógico.*

> **Archivos:** [`OnboardingWizard.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/onboarding/OnboardingWizard.tsx) | [`SchedulerStep.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/onboarding/SchedulerStep.tsx)

### **7.1 Indicador de Progreso (Stepper)**
El proceso se divide en tres hitos críticos que deben completarse en orden:
1.  **Identidad**
2.  **Institución**
3.  **Carga Horaria**

### **7.2 Paso 1: Identidad Docente**
Responsable de establecer la autoría de los planes generados.

*   **Título del Paso:** `Identidad Docente`
*   **Subtítulo:** `Paso 1 de 3 — Identidad`
*   **Campos de Formulario:**
    *   **Etiqueta:** `Nombre Completo`
    *   **Placeholder:** `Ej. Juan Pérez García`
*   **Acción Principal:** `[ Siguiente Paso ]` (Valida que el campo no esté vacío antes de avanzar).

---

### **7.3 Paso 2: Datos Institucionales**
Captura la información de la entidad educativa para los encabezados oficiales de los documentos.

*   **Título del Paso:** `Tu Institución`
*   **Subtítulo:** `Paso 2 de 3 — Institución`
*   **Campos de Formulario:**
    *   **Etiqueta:** `GEREDU / DRE` | **Placeholder:** `Ej. DRE Cusco`
    *   **Etiqueta:** `UGEL` | **Placeholder:** `Ej. UGEL Canchis`
    *   **Etiqueta:** `Nombre de la I.E.` | **Placeholder:** `Ej. I.E. 56001 San Juan`
    *   **Etiqueta:** `Director(a)` | **Placeholder:** `Ej. Magister Ana María Rojas`
*   **Acciones:**
    *   `[ Atrás ]`: Regresa al Paso 1 manteniendo los datos ya ingresados.
    *   `[ Siguiente Paso ]`: Valida que los campos obligatorios estén llenos antes de avanzar.

---

### **7.4 Paso 3: Carga Horaria**
Configuración de la matriz de tiempo y asignación de sesiones para la generación de planes.

*   **Título del Paso:** `Carga Horaria`
*   **Subtítulo:** `Paso 3 de 3 — Carga Horaria`
*   **Configuración Global:**
    *   **Selector:** `Nivel Educativo` (Opciones: Inicial, Primaria, Secundaria).
*   **Matriz de Horario de Trabajo:**
    *   **Acción:** `[ + Añadir Fila ]`
    *   **Estructura de Fila:**
        *   **Rango Horario:** `DE: [HH:mm]` | `A: [HH:mm]` (Ej. 08:00 a 09:30).
        *   **Columnas (Días):** `LUNES`, `MARTES`, `MIERCOLES`, `JUEVES`, `VIERNES`.
        *   **Interacción:** Cada celda permite asignar una combinación de **Grado + Área**.
*   **Lógica de Generación Automática:**
    *   El sistema detectará cada combinación única de **Grado + Área** ingresada en la matriz.
    *   Al finalizar, se creará automáticamente un **Proyecto de Planificación** individual para cada combinación detectada.
*   **Acciones Finales:**
    *   `[ Atrás ]`: Regresa al Paso 2.
    *   `[ Comenzar a Planificar ]`: Finaliza el onboarding e inicializa los proyectos en el Dashboard.

---

## 8. INTERFAZ PRINCIPAL (DASHBOARD)
*El centro neurálgico donde el docente gestiona sus proyectos y supervisa el progreso.*

> **Archivo:** [`Dashboard.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/components/layouts/Dashboard.tsx)

### **8.1 Barra Lateral de Navegación (Sidebar)**
Organización jerárquica de los niveles de planificación:

1.  **Dashboard/Inicio**: Vista general.
2.  **Planificación Anual (Largo Plazo)**:
    *   **M01 Diagnóstico**: Análisis del contexto y nivel real del estudiante.
    *   **M02 Identidad**: Visión y principios de la I.E.
    *   **M03 Propósitos**: Matriz de competencias y enfoques transversales.
    *   **M04 Estrategia**: Organización temporal de las unidades.
    *   **M05 Orientaciones**: Estrategias metodológicas y de evaluación.
3.  **Mediano Plazo**: Unidades de aprendizaje y proyectos ABP.
4.  **Corto Plazo**: Sesiones de aprendizaje diarias.
5.  **Gestión y Recursos**: Banco de materiales y documentos administrativos.
6.  **Configuración IA (Motor & Keys)**: Gestión de modelos (Local/Cloud) y llaves de API.
7.  **Perfil Docente**: Gestión de datos personales (`Gestionar Perfil`).
8.  **Cerrar Sesión**.

### **8.2 Centro de Control (Main Content)**

**Rutas del Dashboard:**
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/dashboard` | `ControlCenterView` | Vista general con widgets de monitoreo |
| `/perfil` | `ProfileEditor` | Edición de datos personales |
| `/planificacion/anual/diagnostico` | `DiagnosticoIntegralEditor` | M01 |
| `/planificacion/anual/identidad` | `IdentidadInstitucionalEditor` | M02 |
| `/planificacion/anual/propositos` | `PropositosEditor` | M03 |
| `/planificacion/anual/estrategia` | `EstrategiaAnualEditor` | M04 |
| `/planificacion/anual/orientaciones` | `OrientacionesEditor` | M05 |
| `/planificacion/unidades` | `MedianoPlazoList` | Lista de unidades/proyectos/módulos |
| `/planificacion/unidades/:id` | `MedianoPlazoEditor` | Workflow de 5 pasos |
| `/planificacion/unidades/:unidadId/sesiones/:sesionId` | `SesionEditor` | Editor de sesión individual |
| `/sesiones` | `SesionesList` | Lista de sesiones |
| `/evaluacion` | `EvaluacionDashboard` | Banco de evaluación |
| `/recursos` | `RecursosDashboard` | Gestión de recursos |
Espacio dinámico que refleja el estado de la planificación actual.

*   **Cabecera de Selección de Contexto:**
    *   **Etiqueta:** `Editando Plan de:`
    *   **Indicador:** Muestra el `Área - Grado (Ciclo)` activo (Ej. *Arte y Cultura - 1ero (VI)*).
    *   **Botón Acción:** `[ Configuración Curricular ]` para cambiar rápidamente entre los proyectos generados en el onboarding.
*   **Sección: Centro de Control:**
    *   **Título:** `Centro de Control`
    *   **Subtítulo:** `Estado general de la planificación educativa`.
*   **Widgets de Monitoreo:**
    *   **Unidades**: Contador de unidades diseñadas vs. planificadas.
    *   **Audit Alerts**: Sistema de alertas automáticas sobre coherencia curricular (detecta si faltan desempeños o hay inconsistencias).

---

## 9. PLANIFICACIÓN ANUAL (LARGO PLAZO)
*Especificaciones de implementación de los 5 módulos del Plan Anual. ✅ FUNCIONALIDAD COMPLETA.*

> **Archivos:**
> - [`DiagnosticoIntegralEditor.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/plan-anual/DiagnosticoIntegralEditor.tsx) (48KB — módulo más grande)
> - [`IdentidadInstitucionalEditor.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/plan-anual/IdentidadInstitucionalEditor.tsx)
> - [`PropositosEditor.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/plan-anual/PropositosEditor.tsx) (52KB)
> - [`EstrategiaAnualEditor.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/plan-anual/EstrategiaAnualEditor.tsx)
> - [`OrientacionesEditor.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/plan-anual/OrientacionesEditor.tsx)

### **9.1 Módulo 01: Diagnóstico Integral (M01)**
*Caracterización profunda basada en matrices de impacto y niveles psicopedagógicos.*

#### **1.1.1 Caracterización del Contexto (Matriz Heatmap)**
*   **UI - Matriz 5x3**: Intersección de Ámbitos (Familiar, Grupal, Local, Regional, Nacional) y Aspectos (Cultural, Económico, Ambiental).
*   **Selector de Impacto (Heatmap)**: Cada celda tiene un "Heat Bar" lateral con 3 estados:
    *   `Positivo` (Verde): Oportunidad pedagógica.
    *   `Neutro` (Ámbar): Característica general.
    *   `Negativo` (Rojo): Amenaza o problema a abordar.
*   **Automatización IA**: Botón `[ Poblar con IA ]`.
    *   **Input**: Perfil de Contexto (Urbano, Rural, etc.) + Texto de Ubicación + Mapa de Estados (sin texto).
    *   **Output**: Rellena los 15 cuadros de texto con contenido técnico alineado al estado seleccionado.
    *   **Prompt**: `POBLAR_CONTEXTO`

#### **1.1.2 Características Particulares (Semáforo de Niveles)**
*   **Dimensiones**: Cognitivo, Físico, Emocional.
*   **Selector de Nivel (Semáforo 1-5)**:
    *   `1-2`: Crítico / Bajo (Dificultades).
    *   `3`: Regular (Estándar).
    *   `4-5`: Alto / Muy Alto (Fortalezas).
*   **Lógica IA**: Redacta párrafos técnicos que "justifican" pedagógicamente el nivel seleccionado sin mencionar el número.
*   **Prompt**: `POBLAR_CARACTERISTICAS`

#### **1.1.3 Estilos, Intereses y Lenguaje**
*   **Intereses**: Sistema de tags (Chips). Sugerencias automáticas por IA según edad y área.
*   **Asistente de Lengua**: Selectores de L1/L2 e Índice de Escenario EIB (1-4).
*   **IA de Lenguaje**: Genera el "Diagnóstico Sociolingüístico" integrando el contexto del paso 1.1.1.
*   **Prompts**: `POBLAR_ESTILOS`, `POBLAR_LENGUAJE`

---

### **9.2 Módulo 02: Identidad Institucional (M02)**

#### **1.1.4 Identidad (Descripción General del Área)**
*   **Botón [ Generar con IA ]**: Utiliza "Ingeniería Pedagógica" para redactar 2 párrafos que integran el enfoque del área con las necesidades detectadas en el M01.
*   **Prompt**: `REDACTAR_DESCRIPCION_TECNICA`

#### **1.1.5 Identidad Institucional**
*   Datos precargados desde el **Onboarding** (Paso 2): GEREDU/DRE, UGEL, Nombre I.E., Director
*   **Comportamiento**: Solo lectura dentro del Plan Anual. Los datos se editan desde el Perfil Docente (`/perfil`).

---

### **9.3 Módulo 03: Propósitos y Enfoques (M03)**

#### **1.2.1 Propósitos y Enfoques (Malla Curricular)**
*   **Jerarquía de Toggles**:
    *   Marcar una **Capacidad** (hijo) marca automáticamente la **Competencia** (padre).
    *   Desmarcar una **Competencia** desmarca todas sus **Capacidades**.
*   **Datos CNEB**: Se cargan desde los archivos JSON en `services/cneb/data/` (54+ archivos por área y nivel).
*   **Motor Suggest IA (Sugerir Propósitos)**:
    *   **Botón Naranja**: Analiza el `Calendario Comunal` (Texto libre).
    *   **Acción**: La IA devuelve un JSON con la matriz completa marcada. El sistema aplica una lógica de **Reparación de Matriz** para asegurar que los padres aparezcan marcados en la UI si hay hijos seleccionados.
    *   **Prompt**: `SUGERIR_PROPOSITOS`

#### **1.2.2 Enfoques Transversales**
*   **Selector de Enfoques**: Lista completa de enfoques del CNEB con sus valores asociados
*   **Dropdown por enfoque**: Permite agregar más valores asociados a cada enfoque seleccionado
*   **Botón de nuevo enfoque**: Permite seleccionar enfoques adicionales de la lista completa
*   **Datos**: Cargados desde `services/cneb/enfoques.ts`

#### **1.2.3 Calendario Comunal y Eventos Significativos**
*   **Campo de texto libre**: El docente escribe eventos, celebraciones y fechas relevantes de su comunidad
*   **Sincronización de Calendario 2026**: Fechas fijas precargadas para Bimestres/Trimestres
*   **Selectores de fecha**: Tipo `date` para ajuste manual por unidad/periodo

---

### **9.4 Módulo 04: Estrategia Anual (M04)**
*Diseño cronológico de las unidades didácticas.*

#### **1.3.1 Estrategia Anual (Matriz de Unidades U1-U8)**
*   **Editor de Unidades**: Matriz donde cada unidad hereda el `bimestre/trimestre` y las `fechas` del M03.
*   **Columnas por periodo:**
    *   **Título de la Unidad**: Nombre motivador y retador.
    *   **Tipo**: Unidad / Proyecto / Módulo.
    *   **Situación Significativa**: Planteamiento del problema o reto basado en el contexto.
    *   **Producto**: Evidencia tangible o intangible del aprendizaje.
    *   **Duración**: Semanas y horas asignadas.
*   **Situación Significativa (IA IDENTIDAD)**:
    *   **Prompter Contextual**: Inyecta Área, Grado, Ciclo, Contexto, Perfil Psicopedagógico, Estilos, Lenguaje y Calendario.
    *   **Estilo Personalizado**: Regla de oro que obliga a la IA a redactar de forma narrativa y empática según la identidad del docente, evitando el lenguaje burocrático.
    *   **Prompt**: `REDACTAR_SITUACION_SIGNIFICATIVA`
*   **Coherencia Curricular**:
    *   Cada unidad está vinculada a las competencias marcadas en el M03 para ese periodo.
    *   Visualización del tiempo total del año vs. tiempo planificado.

---

### **9.5 Módulo 05: Orientaciones y Recursos (M05)**
*Definición de la forma de enseñanza y los criterios de éxito.*

#### **1.4.1 Orientaciones para la Evaluación**
*   **División Técnica**: Tres campos independientes: `Diagnóstica`, `Formativa` y `Sumativa`.
*   **Poblado IA**: Genera textos de 100-150 palabras alineados al área y nivel.
*   **Prompt**: `SUGERIR_EVALUACION`

#### **1.4.2 Recursos y Materiales Educativos**
*   **Categorización**: `Para el Docente` y `Para el Estudiante`.
*   **IA de Recursos**: Recomienda materiales basados en el contexto de la zona (si es rural, prioriza materiales del entorno).
*   **Prompt**: `SUGERIR_RECURSOS`

**Acción Final del Plan Anual:** `[ Generar Documento Plan Anual ]` → Exportación a Word (.docx) usando la librería `docx`.

---

## 10. MEDIANO PLAZO: UNIDAD / PROYECTO / MÓDULO
*Workflows de 5 pasos para el diseño de planificación a mediano plazo.*

> **Archivos:**
> - [`MedianoPlazoList.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/plan-mediano-plazo/MedianoPlazoList.tsx) — Lista de unidades con navegación
> - [`MedianoPlazoEditor.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/plan-mediano-plazo/MedianoPlazoEditor.tsx) — Router de workflows
> - [`WorkflowUnidad.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/plan-mediano-plazo/workflows/unidad/WorkflowUnidad.tsx) ✅
> - [`WorkflowProyecto.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/plan-mediano-plazo/workflows/proyecto/WorkflowProyecto.tsx) 🔧
> - [`WorkflowModulo.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/plan-mediano-plazo/workflows/modulo/WorkflowModulo.tsx) 🔧

### **10.1 Unidad de Aprendizaje — Workflow de 5 Pasos (✅ IMPLEMENTADO)**

#### **2.1.1 Diagnóstico**
*   **Herencia Directa**: Precarga `Título`, `Situación Significativa` y `Producto Tentativo` desde el M04 (Estrategia Anual).
*   **Editor de Situación Significativa**: Campo editable con botón `[ Redactar Situación ]` (IA).
*   **Diagnóstico Previo**: Logros por competencia (AD/A/B/C), observación del docente, necesidades de aprendizaje.
*   **Prompt**: `CONTEXTUALIZAR_SITUACION`

#### **2.1.2 Diseña y Determina**
*   **Filtro CNEB**: Solo permite seleccionar desempeños de las capacidades marcadas en el M03.
*   **Editor de Desempeño Precisado**: Permite crear el "Desempeño Precisado" a partir del desempeño original del CNEB.
*   **Interfaz**: Grid de competencias → Capacidades → Desempeños con checkboxes + campo de precisado.
*   **Herencia**: Las competencias y capacidades seleccionadas se heredan a la Secuencia Didáctica.

#### **2.1.3 Organiza**
*   **Calendario Flotante**: Visualización de las semanas de duración con highlighting de fechas.
*   **Fechas editables**: `fechaInicio` y `fechaTermino` modificables.
*   **Generador IA de Criterios**: Basado en el desempeño precisado y el propósito de aprendizaje.
*   **Matriz de Evidencias**: Vincula criterios con productos evaluables.
*   **Prompt**: `GENERAR_CRITERIOS`

#### **2.1.4 Selecciona**
*   Confirmación de **enfoques transversales** para la unidad.
*   Selector de enfoques con dropdown para agregar valores adicionales.
*   Botón para seleccionar nuevos enfoques de la lista completa.

#### **2.1.5 Prevé (Secuencia de Sesiones)**
*   **Algoritmo de Distribución**: Calcula el número de sesiones según la carga horaria semanal y semanas de duración.
*   **IA de Sesiones**: Crea un arco de aprendizaje:
    *   Inicio → Construcción → Aplicación → Evaluación → Producto
*   **Tabla de Sesiones**: Cada sesión muestra: Título, Competencia, Desempeño, Enfoque, Secuencia, Materiales, Criterios, Duración.
*   **Prompt**: `GENERAR_SECUENCIA_SESIONES`
*   **Planificación en Tiempo Real**: Indicador que muestra el estado de generación de sesiones.

---

### **10.2 Proyecto de Aprendizaje — Workflow de 5 Pasos (🔧 PENDIENTE)**
> [!NOTE]
> Seguirá la **misma dinámica** que la Unidad de Aprendizaje, con las siguientes variaciones:

#### **2.2.1 Análisis** (≈ Diagnóstico de Unidad)
*   Herencia del Plan Anual + **Pregunta Retadora** obligatoria.
*   Análisis de la problemática del contexto para definir el proyecto.

#### **2.2.2 Define y Establece** (≈ Diseña y Determina)
*   Selección de competencias y capacidades del CNEB.
*   **Planificación Participativa**: Campos adicionales `¿Qué sabemos?`, `¿Qué queremos saber?`, `¿Cómo lo haremos?`.

#### **2.2.3 Estructura** (≈ Organiza)
*   Fases del proyecto con cronograma visual.
*   Definición de actividades por fase.

#### **2.2.4 Elige** (≈ Selecciona)
*   Selección de enfoques transversales + recursos específicos del proyecto.

#### **2.2.5 Anticipa** (≈ Prevé)
*   **Producto Final**: Definición del entregable del proyecto.
*   Distribución de sesiones orientadas al producto final.

---

### **10.3 Módulo de Aprendizaje — Workflow de 5 Pasos (🔧 PENDIENTE)**
> [!NOTE]
> Seguirá la **misma dinámica** que la Unidad, con enfoque en aprendizajes específicos:

#### **2.3.1 Revisión** (≈ Diagnóstico)
*   Análisis de necesidades específicas de aprendizaje.

#### **2.3.2 Conceptualiza** (≈ Diseña y Determina)
*   Definición precisa de aprendizajes esperados del módulo.

#### **2.3.3 Coordina** (≈ Organiza)
*   Organización de actividades y tiempos del módulo.

#### **2.3.4 Escoge** (≈ Selecciona)
*   Selección de estrategias y materiales pedagógicos.

#### **2.3.5 Proyecta** (≈ Prevé)
*   Diseño de secuencia de sesiones y sistema de evaluación del módulo.

---

## 11. SESIÓN DE APRENDIZAJE (CORTO PLAZO)
*Detalle de la experiencia pedagógica diaria.*

> **Archivos:**
> - [`SesionEditor.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/sesiones/SesionEditor.tsx) (22KB)
> - [`SesionesList.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/sesiones/SesionesList.tsx)
> - [`InstrumentoConstructor.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/sesiones/InstrumentoConstructor.tsx)

### **11.1 Estructura de la Sesión (Schema 3.1-3.7)**

| # | Campo | Tipo | Herencia |
|---|-------|------|----------|
| 3.1 | **Título de la sesión** | `string` | Heredado de la secuencia de la Unidad |
| 3.2 | **Propósito de aprendizaje** | `string` | Definido por el docente o IA |
| 3.3 | **Competencia** | `string (FK)` | Heredada de la Unidad (2.1.2) |
| 3.4 | **Evidencia** | `string` | Producto observable de la sesión |
| 3.5 | **Instrumento de evaluación** | `enum` | `Lista de Cotejo` / `Rúbrica` / `Guion de Observación` |
| 3.6 | **Secuencia didáctica** | `object` | 3 momentos con descripción + tiempo |
| 3.7 | **Recursos materiales** | `string[]` | Lista de recursos necesarios |

### **11.2 Secuencia Didáctica (3 Momentos)**

| Momento | Propósito | Duración estimada |
|---------|-----------|-------------------|
| **Inicio** | Recuperación de saberes previos, motivación, conflicto cognitivo, comunicación del propósito | 15-20 min |
| **Desarrollo** | Construcción del conocimiento, actividades guiadas y autónomas, aplicación de estrategias | 45-60 min |
| **Cierre** | Metacognición, sistematización, transferencia, evaluación formativa | 10-15 min |

### **11.3 Generación de Instrumentos de Evaluación**
*   **Rúbricas**: Generación automática por IA basada en los criterios de la unidad.
*   **Lista de Cotejo**: Indicadores de logro con checkboxes (Sí/No/En proceso).
*   **Guion de Observación**: Guía para observación cualitativa del desempeño.
*   **Prompts**: `GENERAR_RUBRICA`, `GENERAR_CRITERIOS`

### **11.4 Herencia de Datos desde la Unidad**
```
Unidad (2.1.2 Diseña y Determina)
  └─→ competenciaId, capacidadId, desempeñoPrecisado
       └─→ Sesión.competencia (3.3)
       └─→ Sesión.criterios (3.5)
       └─→ Sesión.propósito (3.2)
```

---

## 12. GESTIÓN Y RECURSOS
*Sistema central de gestión de instrumentos y materiales educativos.*

> **Archivos:**
> - [`EvaluacionDashboard.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/evaluacion/EvaluacionDashboard.tsx)
> - [`RecursosDashboard.tsx`](file:///c:/Users/xana3/Downloads/PlanX1/src/features/recursos/RecursosDashboard.tsx)

### **12.1 Evaluación (4.1)**
*   **Banco de Evaluación**: Repositorio central de todos los instrumentos generados en el Mediano y Corto plazo.
*   **Filtros**: Por unidad, por competencia, por tipo de instrumento.
*   **Exportación**: Generación de instrumentos en formato Word/PDF.

### **12.2 Recursos (4.2)**
*   **Gestión de Materiales**: Sistema de archivos vinculados a cada unidad o sesión.
*   **Categorización**: Educativos, estructurados, no estructurados; para docente, para estudiante.
*   **Recomendaciones IA**: Sugerencias de materiales basadas en el contexto de la zona.

---

## 13. ESQUEMAS DE BASE DE DATOS (TYPESCRIPT)
*Interfaces TypeScript que definen la estructura de datos del sistema.*

> **Archivo:** [`schemas.ts`](file:///c:/Users/xana3/Downloads/PlanX1/src/types/schemas.ts)

### **13.1 Jerarquía de Entidades**
```
PerfilDocente (RAÍZ)
  ├── CargaHoraria[]
  └── PlanAnual (TRONCO) ──[1:N]──→ por cada combinación Grado+Área
        │
        ├── 1. PLAN ANUAL
        │     ├── 1.1 Diagnóstico
        │     │     ├── 1.1.1 Caracterización del Contexto
        │     │     ├── 1.1.2 Características Particulares
        │     │     ├── 1.1.3 Estilos, Intereses y Lenguaje
        │     │     ├── 1.1.4 Identidad
        │     │     └── 1.1.5 Identidad Institucional
        │     ├── 1.2 Propósito
        │     │     ├── 1.2.1 Propósitos y Enfoques
        │     │     ├── 1.2.2 ENFOQUES TRANSVERSALES
        │     │     └── 1.2.3 Calendario Comunal y Eventos
        │     ├── 1.3 Estrategia
        │     │     └── 1.3.1 Estrategia Anual (Matriz U1-U8)
        │     └── 1.4 Orientaciones
        │           ├── 1.4.1 Orientaciones para la Evaluación
        │           └── 1.4.2 Recursos y Materiales Educativos
        │
        ├── 2. MEDIANO PLAZO (RAMAS PARALELAS) ──[1:N]──→ 
        │     ├── 2.1 Unidad de Aprendizaje
        │     │     ├── 2.1.1 Diagnóstico | 2.1.2 Diseña y Determina
        │     │     └── 2.1.3 Organiza | 2.1.4 Selecciona | 2.1.5 Prevé
        │     ├── 2.2 Proyecto de Aprendizaje
        │     │     ├── 2.2.1 Análisis | 2.2.2 Define y Establece
        │     │     └── 2.2.3 Estructura | 2.2.4 Elige | 2.2.5 Anticipa
        │     └── 2.3 Módulo de Aprendizaje
        │           ├── 2.3.1 Revisión | 2.3.2 Conceptualiza
        │           └── 2.3.3 Coordina | 2.3.4 Escoge | 2.3.5 Proyecta
        │
        ├── 3. SESIÓN DE APRENDIZAJE (HOJA) ──[1:N]──→ 
        │     ├── 3.1 Título | 3.2 Propósito | 3.3 Competencia
        │     ├── 3.4 Evidencia | 3.5 Instrumento | 3.6 Secuencia
        │     └── 3.7 Recursos
        │
        └── 4. GESTIÓN Y RECURSOS
              ├── 4.1 Evaluación (Banco de Instrumentos)
              └── 4.2 Recursos (Materiales)
```

### **13.2 Tipos CNEB (Base de Datos Proporcionada)**
| Interface | Contenido | Origen |
|-----------|-----------|--------|
| `CNEBCompetencia` | id, nombre, descripción, capacidades[], estándares, desempeños | JSON precargados en `services/cneb/data/` |
| `CNEBCapacidad` | id, nombre, descripción, desempeños por grado | JSON precargados en `services/cneb/data/` |

> [!IMPORTANT]
> **Los 54+ archivos JSON del CNEB se proporcionan pre-creados.** Contienen todas las competencias, capacidades y desempeños por área y nivel educativo (Inicial, Primaria, Secundaria). **No deben ser generados por IA.**

---

## 14. RECOMENDACIONES DE MEJORA Y OBSERVACIONES
*Hallazgos del análisis del código actual con sugerencias de mejora.*

### **14.1 Mejoras Prioritarias (Pendientes)**

| # | Área | Descripción | Impacto |
|---|------|-------------|---------|
| 1 | **Auth** | Migrar login/registro de IndexedDB local a **Supabase Auth** | 🔴 Alto |
| 2 | **Deploy** | Configurar **GitHub Pages**: agregar `base` en vite.config.ts, crear `404.html` SPA fix, agregar `gh-pages` | 🔴 Alto |
| 3 | **Package** | Agregar `@supabase/supabase-js` como dependencia | 🔴 Alto |
| 4 | **Proyecto** | Implementar `WorkflowProyecto.tsx` siguiendo el patrón de `WorkflowUnidad.tsx` | 🟡 Medio |
| 5 | **Módulo** | Implementar `WorkflowModulo.tsx` siguiendo el patrón de `WorkflowUnidad.tsx` | 🟡 Medio |
| 6 | **Sesiones** | Expandir `SesionEditor.tsx` con el esquema completo (3.1-3.7) | 🟡 Medio |
| 7 | **Evaluación** | Implementar el Banco de Evaluación con filtros y exportación | 🟢 Bajo |
| 8 | **Recursos** | Implementar la gestión de materiales vinculados | 🟢 Bajo |

### **14.2 Observaciones sobre el Código Actual**

**✅ Lo que funciona bien:**
*   Login/Registro con validación de DNI (8 dígitos) y PIN (4 dígitos)
*   Onboarding completo de 3 pasos con generación automática de planes
*   Los 5 módulos del Plan Anual (M01-M05) con integración IA
*   Malla curricular con toggles jerárquicos y reparación de matriz
*   Estrategia Anual con situación significativa por IA (Estilo Miguel)
*   Workflow de Unidad completo (5 pasos) con herencia de datos
*   Selector de desempeños del CNEB con precisado
*   Generación de secuencia de sesiones por IA
*   Auditoría automática de coherencia curricular
*   Sistema de fallback de 3 modelos Gemini
*   Exportación a Word (.docx) del Plan Anual

**✅ Observaciones ya contempladas en este SRS (no requieren acción adicional):**
*   ~~PIN en texto plano~~ → **Resuelto en §1.5 y §3.2**: La migración a Supabase Auth elimina el almacenamiento local del PIN; Supabase usa hashing nativo (bcrypt).
*   ~~Componentes grandes~~ → **Documentado en §4**: Los componentes `DiagnosticoIntegralEditor` (48KB) y `PropositosEditor` (52KB) ya están identificados como candidatos a refactorización. Su división en subcomponentes se realizará durante la implementación de Supabase Auth (T1 de §14.1).
*   ~~Sin tests~~ → **Contemplado en §14.1 (T2)**: Se incorporará Vitest (unitarios) + Playwright (e2e) como parte de la configuración de CI/CD para GitHub Pages.
*   ~~`vite.config.ts` sin `base`~~ → **Resuelto en §3.5**: La instrucción de agregar `base: '/PlanX1/'` ya está documentada como paso 1 del deploy a GitHub Pages.
*   ~~Enfoques hardcodeados~~ → **Decisión de diseño en §9.3**: Los enfoques transversales se mantienen en `enfoques.ts` intencionalmente para facilitar su edición independiente. La consolidación con los JSON del CNEB se evaluará en una versión futura si el volumen de datos lo justifica.

---

> **FIN DEL DOCUMENTO SRS — PlanX System v2.0**
> *Última actualización: 2026-02-21*


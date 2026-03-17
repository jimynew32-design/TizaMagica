# Especificación Técnica: Motor de Programación de Horarios Académicos (PlanX Timetable Engine)

## 1. Visión General: Generación Institucional y por Docente
### 1.1 Enfoque del Proyecto
El objetivo es generar horarios institucionales completos que garanticen que todas las asignaciones respeten las restricciones duras y optimicen las preferencias suaves para minimizar ventanas y equilibrar cargas, permitiendo a su vez extraer vistas personalizadas por docente, aula y grupo.

### 1.2 Requisitos Funcionales Clave
- **Matriz Completa:** Generación de horarios por día y bloque para todos los grados y secciones de la institución.
- **Vistas Especializadas:** Exportación de calendarios filtrados para Dirección, Docentes y Familias.
- **Validación en Tiempo Real:** Bloqueo de asignaciones imposibles durante la edición manual.
- **Auditoría y Sincronización:** Registro de cambios y coherencia de datos entre múltiples roles.

---

## 2. El Asistente Visual (Wizard): Navegación por Pasos
Siguiendo la línea de diseño de PlanX, el generador utiliza un sistema de **Botones Horizontales (Tabs)** que dividen la carga de trabajo para no saturar al docente. Cada botón representa una fase lógica y solo muestra la información mínima necesaria.

### 2.1 Botón 1: CONTEXTO (El Molde)
**Interfaz:** Un panel limpio con selectores rápidos.
- **Campos:** Turno (Mañana/Tarde), Hora inicio, Duración de bloque (45/60 min).
- **UX:** El sistema dibuja la malla temporal en tiempo real al fondo.

### 2.2 Botón 2: RECURSOS (Los Actores)
**Interfaz:** Listas dinámicas tipo "Chip" o tarjetas simples.
- **Campos:** Nombres de docentes, Aulas disponibles, Grados/Secciones.
- **UX:** Importación rápida desde Excel o pegado de lista simple.

### 2.3 Botón 3: MAPEO (Carga Asistida)
**Interfaz:** Panel de "Matching" inteligente por grado/sección.
- **Campos:** Materia CNEB (Pre-cargada) | Docente Asignado | Horas Totales | Distribución (Split).
- **UX Inteligente:** 
  - **Plantillas CNEB:** El sistema carga automáticamente las materias y horas base según el grado seleccionado; el docente solo "casa" al profesor.
  - **Semáforo de Carga:** Barra visual que indica la carga horaria total del docente seleccionado en tiempo real (ej. 22h/30h).
  - **Regla de Split:** Permite definir si las 6 horas de una materia se dictan en bloques de (2+2+2), (2+2+1+1) o (3+3), optimizando el motor de generación.
  - **Radar CNEB:** Feedback instantáneo sobre el cumplimiento de la malla curricular normativa.

### 2.4 Botón 4: REGLAS (La Lógica Final)
**Interfaz:** El propio horario donde el docente hace clic para bloquear.
- **Campos:** Marcado de Recreos (Zonas Nulas) y bloqueos específicos por docente.
- **UX:** Un clic para "apagar" o "encender" bloques horarios.

---

## 3. Filosofía de Diseño: "Menos es Más"
Para evitar saturar al docente, el motor se rige por:
1. **Ocultamiento Progresivo:** Solo ves el Paso 2 cuando el Paso 1 es válido.
2. **Botones de Identidad:** Uso de botones magenta con iconos claros y numeración (estilo 1.1, 1.2, etc.) para guiar el progreso.
3. **Feedback Visual:** Colores suaves (verde para válido, magenta para atención) en lugar de cuadros de texto largos.

---

## 4. El Flujo de Trabajo Ideal (User Journey Premium)
El secreto de la interfaz PlanX es la **Revelación Progresiva**: pedir solo lo necesario en cada paso para reducir la ansiedad del docente y maximizar la precisión de los datos.

### 4.1 Paso 1: Configuración Base (El Lienzo)
- **Datos:** Nombre de la IE, Nivel (Inicial/Primaria/Secundaria) y Modalidad (JER/JEC).
- **🚀 Toque Experto:** Plantillas preconfiguradas basadas en estándares peruanos. Al elegir "Secundaria JEC", el sistema ya propone el bloque de 9 horas diarias automáticamente.

### 4.2 Paso 2: Importación Masiva (La Magia)
- **Datos:** Docentes, Aulas y Secciones.
- **🚀 Toque Experto:** Extracción inteligente desde Excel o PDF. Cero tipeo manual para listas grandes.

### 4.3 Paso 3: Carga Horaria (El Core)
- **Datos:** Matching de [Docente + Área + Sección + Horas].
- **🚀 Toque Experto:** Malla CNEB precargada en menús desplegables para evitar errores de normativa.

### 4.4 Paso 4: Restricciones Visuales (Las Reglas)
- **Datos:** Días libres y bloqueos pedagógicos.
- **🚀 Toque Experto:** Interfaz de "Clic para Bloquear" en lugar de texto. Rápido e intuitivo.

### 4.5 Paso 5: Motor y Drag & Drop (El Tablero)
- **Procesamiento:** Pantalla de carga con feedback de potencia tecnológica ("Evaluando 15,000 combinaciones...").
- **🚀 Toque Experto:** Drag & Drop inteligente que impide soltar bloques en celdas con conflictos de horario o disponibilidad.

---

## 5. Arquitectura del Motor y Salida
### 5.1 Motor Determinista (CSP)
El sistema opera bajo lógica heurística determinista, garantizando que no existan solapamientos de Docentes, Aulas o Grupos.
- **Hard Constraints:** Inviolables (Unicidad, Disponibilidad, Zonas Nulas).
- **Soft Constraints:** Optimizables (Minimización de ventanas, Equilibrio Pedagógico).

### 5.2 Salud del Horario (KPIs)
- **Cumplimiento CNEB:** Auditado contra la Carga Horaria Mínima exigida.
- **Eficiencia Docente:** Ratio de horas lectivas vs. permanencia (objetivo > 0.9).
- **Salud Estudiantil:** Algoritmo de fatiga cognitiva (Heatmap Estudiantil).

---

## 4. Checklist de Recolección de Datos
- [ ] Confirmar turnos y jornada institucional.
- [ ] Definir duración de bloque y días laborables.
- [ ] Cargar lista de docentes con disponibilidad y preferencias.
- [ ] Registrar aulas y recursos por ubicación/pabellón.
- [ ] Enumerar grados y secciones con tamaños estimados.
- [ ] Mapear materias por grado con sus respectivas horas semanales.
- [ ] Definir zonas nulas (recreos) y reglas de bloques dobles.
- [ ] Validar formato de salida para `horarios_config`, `horarios_celdas` y restricciones.

---
**Documento de referencia para ingeniería - PlanX System v3.0**

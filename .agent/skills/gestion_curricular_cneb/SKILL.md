---
name: gestion_curricular_cneb
description: Manejo de los datos del Currículo Nacional (CNEB) y lógica de mapeo curricular.
---

# Skill: Gestión Curricular CNEB

Esta skill asegura que PlanX cumpla con los estándares del Ministerio de Educación de Perú utilizando los datos proporcionados.

## 1. Estructura de Datos
Los datos curriculares se encuentran en `src/services/cneb/data/` en formato JSON.
- **Áreas y Niveles:** Cada archivo corresponde a una combinación (ej: `arte_cultura_secundaria.json`).
- **Jerarquía:**
  - `Competencia`: Nombre y descripción.
  - `Capacidad`: Vinculada a una competencia.
  - `Desempeño`: Por grado, vinculado a capacidades.

## 2. Lógica de Selección
- **Herencia Vertical:** Al seleccionar una competencia en el Plan Anual (M03), se habilitan sus capacidades y desempeños para las Unidades y Sesiones posteriores.
- **Filtrado:** Solo mostrar desempeños correspondientes al ciclo (VI o VII en secundaria) y grado seleccionado.

## 3. Enfoques Transversales
Los enfoques se gestionan desde `src/services/cneb/enfoques.ts`.
- No son editables en su definición base, pero el docente puede añadir "Valores" específicos en cada unidad.

## 4. Mantenimiento
- Al actualizar la versión del índice curricular (`VITE_CNEB_INDEX_VERSION`), se debe asegurar que los IDs de las competencias no cambien para evitar romper la herencia en planes existentes.
- Los archivos JSON son la **única fuente de verdad** para la currícula; la IA no debe inventar criterios oficiales.

---
name: exportacion_documentos_oficiales
description: Gestión de la generación de documentos Word (.docx) y PDF con formatos oficiales del MINEDU.
---

# Skill: Exportación de Documentos Oficiales

Esta skill define cómo generar los archivos descargables que el docente entregará a su institución.

## 1. Librería `docx`
- Todas las exportaciones a Word deben realizarse usando la librería `docx`.
- Emplear `Section`, `Paragraph`, `Table` y `TextRun` para estructurar el contenido.
- Mantener estilos consistentes (fuente Arial o Times New Roman, tamaños estándar 10-12).

## 2. Plantillas y Encabezados
- Los documentos deben incluir un encabezado oficial con:
  - Logos de la I.E. (si están disponibles).
  - Datos institucionales (DRE, UGEL, Nombre I.E.).
  - Nombre del Docente y Año Escolar.

## 3. Tablas de Planificación
- Las matrices curriculares (Competencias/Capacidades) deben estar bien alineadas y ser legibles.
- Las Situaciones Significativas deben ocupar un lugar destacado y estar redactadas en "Estilo Miguel".

## 4. Generación asíncrona
- Mostrar un estado de "Generando documento..." en la UI mientras se procesa el blob.
- Ofrecer el archivo para descarga inmediata una vez finalizado el ensamblado.

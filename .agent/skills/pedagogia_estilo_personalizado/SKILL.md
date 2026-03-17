---
name: pedagogia_estilo_personalizado
description: Directrices para la generación de contenido pedagógico con IA adaptado a la identidad del docente y su contexto real.
---

# Skill: Pedagogía y Estilo Personalizado

Esta skill define cómo debe redactar la IA para reflejar la identidad de cada docente, alejándose de formatos genéricos y adaptándose a nombres y perfiles variados.

## 1. Identidad de Escritura (Regla de Oro)
Cada texto generado debe sonar como el docente configurado en el sistema, siguiendo estas reglas fundamentales:
- **Tono Narrativo:** La redacción debe ser fluida y empática. No es un informe técnico frío, es la voz del docente planificando para sus estudiantes.
- **Adaptación a Nombres:** La IA debe utilizar el nombre del docente (obtenido del perfil) para firmar o referenciar la autoría cuando sea necesario, o simplemente adoptar el "Estilo de [Nombre del Docente]".
- **Voz Activa:** Verbos de acción, oraciones directas pero cálidas.
- **Contextualización Local:** Es obligatorio inyectar datos de la zona (urbano/rural, EIB, cultura local, calendario comunal).

## 2. Flexibilidad de Estilo
El sistema ya no se limita a un único nombre (como "Miguel"). Ahora varía según el docente:
- **Consistencia:** Si el docente es "Ana Pérez", la IA redactará como una docente con esa identidad.
- **Variedad:** Permite diferentes "matices" pedagógicos según el grado y área, manteniendo siempre el enfoque humano.

## 3. Coherencia Curricular (CNEB)
Independientemente del estilo narrativo, la estructura técnica debe ser impecable:
- [Competencia] -> [Capacidad] -> [Desempeño] -> [Criterio]
- El **Desempeño Precisado** es la clave para unir la narrativa con la currícula oficial.

## 4. Prompts Dinámicos
Los prompts deben inyectar la variable `nombreDocente` para que la IA sepa "quién" está hablando:
- Ejemplo: `"Redacta como [nombreDocente], un docente apasionado por su área..."`
- Solicitar siempre formato JSON para la integración técnica.

## 5. Auditoría de Identidad
Verificar que los textos:
- No repitan frases burocráticas típicas.
- Mencionen elementos del diagnóstico de forma natural.
- Reflejen la realidad socio-emocional del aula.

---
name: interfaz_premium_planx
description: Guía de diseño Dark Luxe (Black & Magenta) inspirada en Poseify para asegurar una experiencia de usuario premium, elegante y sofisticada.
---

# Skill: Interfaz Premium PlanX (Dark Luxe — Black & Magenta)

Esta skill define los estándares visuales basados en la estética **Dark Luxe** con acentos **Hot Pink / Magenta**, inspirada en la plantilla Poseify. Prioriza el contraste dramático, la elegancia tipográfica y una sensación de lujo tecnológico.

## 1. Design Tokens (Paleta de Colores y Tipografía)
- **Fondo y Superficies:**
  - `background`: `#0D0D0D` (Negro profundo, fondo principal).
  - `surface-card`: `#1A1A1A` (Cards y contenedores principales).
  - `surface-header`: `#242424` (Barras de navegación y headers).
  - `surface-active`: `#2E2E2E` (Estados hover e items activos).
- **Acentos y Primarios:**
  - `primary-magenta`: `#E41779` (Color de acción principal, botones CTA y focus).
  - `brand-rose`: `#FF2D8A` (Variante más clara para gradientes y acentos secundarios).
  - `shadow-glow`: `rgba(228, 23, 121, 0.35)` (Glow para elementos destacados).
- **Colores Semánticos (sin cambio):**
  - `heat-positive`: `#4ade80` (Éxito / positivo).
  - `heat-neutral`: `#fbbf24` (Advertencia / neutral).
  - `heat-negative`: `#f87171` (Error / negativo).
- **Texto:**
  - Cuerpo: `#e2e8f0` (Gris claro, máxima legibilidad).
  - Sutil: `#A0A0A0` (Gris medio, labels secundarios).
  - Activo: `#FFFFFF` (Blanco puro para elementos interactivos).
- **Tipografía:**
  - Headings: `Josefin Sans` (weight 300 para subtítulos, 700 para títulos).
  - Cuerpo/UI: `Work Sans` (weight 400 regular, 600 semibold).
  - Iconografía: `Material Icons Round`.

## 2. Estructura de Componentes
- **Botones Pill-Style:** Bordes totalmente redondeados (`rounded-full`), inspirados en Poseify. Botones outline con borde magenta y botones sólidos con fondo magenta.
- **Containers 2XL:** Uso extensivo de `rounded-2xl` y `rounded-xl` para containers y cards.
- **Elevation:** Uso de `shadow-soft` y bordes sutiles `border-white/5` para separar niveles sin saturar. Los fondos deben sentirse profundos y densos.
- **Overlays:** Fondos semi-transparentes `rgba(0, 0, 0, 0.7)` para modales y captions, siguiendo el patrón dramático de Poseify.

## 3. Elementos de Interacción (Control Kit)
- **Botones Dinámicos:**
  - *Primario:* Fondo sólido `#E41779` con texto blanco, `rounded-full`.
  - *Outline:* Borde `#E41779`, fondo transparente, texto magenta. En hover: fondo magenta con texto blanco.
  - *Ghost:* Fondo `#2E2E2E`, texto gris claro. En hover: brillo sutil.
  - *Pressed:* `scale(0.98)` para micro-feedback táctil.
- **Inputs & Search:** Bordes totalmente redondeados (`rounded-full`), fondo `#1A1A1A`, focus con anillo de luz magenta (`ring-primary-magenta/50`).
- **Toggles & Sliders:** Estilo minimalista con carriles oscuros y cursores blancos/magenta.

## 4. Micro-animaciones y Feedback
- **Transiciones:** `duration-300` y `duration-500` en todos los cambios de color y estado.
- **Glow Effects:** Sombras de luz magenta en botones de confirmación y elementos activos: `box-shadow: 0 0 20px rgba(228, 23, 121, 0.3)`.
- **Hover Lift:** `hover:-translate-y-0.5` con `hover:shadow-lg` para efecto de elevación.
- **Pulse Glow:** Animación de pulso en botones de IA con magenta pulsante.

## 5. Implementación con Tailwind
Asegurar que la configuración de Tailwind incluya:
```javascript
colors: {
    'primary-magenta': '#E41779',
    'brand-rose': '#FF2D8A',
    background: '#0D0D0D',
    'surface-card': '#1A1A1A',
    'surface-header': '#242424',
    'surface-active': '#2E2E2E',
},
fontFamily: {
    heading: ['Josefin Sans', 'sans-serif'],
    sans: ['Work Sans', 'system-ui', '-apple-system', 'sans-serif'],
},
boxShadow: {
    'glow-magenta': '0 0 20px rgba(228, 23, 121, 0.3)',
    'glow-rose': '0 0 20px rgba(255, 45, 138, 0.3)',
},
```

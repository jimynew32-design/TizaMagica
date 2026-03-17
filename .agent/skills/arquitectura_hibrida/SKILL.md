---
name: arquitectura_hibrida
description: Gestión de la persistencia local-first con Dexie.js y sincronización selectiva con Supabase.
---

# Skill: Arquitectura Híbrida (Local-First + Cloud Deployment)

Esta skill define cómo PlanX gestiona datos, autenticación y despliegue. La app se **desarrolla localmente** pero **vive y se sirve desde la nube**.

---

## 1. Modelo de Despliegue

### Desarrollo (Local)
- Se trabaja en la PC del desarrollador con `npm run dev` (Vite).
- Las API keys de Gemini se configuran en un archivo `.env` local (nunca se sube al repo).
- LM Studio puede usarse como proveedor IA alternativo durante desarrollo para ahorrar cuota de API.

### Producción (Nube)
- **Hosting:** GitHub Pages (sitio estático generado por `npm run build`).
- **Build:** Vite genera un bundle optimizado en `/dist` que se despliega con `gh-pages`.
- **Dominio:** `https://<usuario>.github.io/<repo>/` (configurable con dominio propio).
- **SPA Routing:** Se necesita un `404.html` con script de redirección para que React Router funcione en GitHub Pages.
- **Variables de entorno en producción:** Las API keys se inyectan como GitHub Secrets y se leen en tiempo de build (`VITE_*`), o bien el usuario las configura desde la propia UI de PlanX (almacenadas en `localStorage`).

> [!IMPORTANT]
> La app es un **SPA estática** que vive en la nube. No tiene backend propio. Toda la lógica de negocio corre en el **navegador del usuario**. Los servicios externos (Supabase Auth, Gemini API) se consumen directamente desde el frontend.

---

## 2. Persistencia de Datos

### IndexedDB (Dexie.js) — Almacenamiento Principal
- **Fuente de verdad para datos pedagógicos:** Planes anuales, unidades, sesiones, datos CNEB.
- **Ventajas:** Velocidad instantánea, funciona offline, privacidad total (los datos del docente no salen de su navegador a menos que él lo decida).
- **Esquema:** Definido en `src/store/db.ts` con tablas indexadas: `perfiles`, `planes`, `unidades`, `sesiones`, `cneb_index`, `cneb_enfoques`.

### localStorage — Estado Ligero
- Solo para datos de acceso rápido por la UI: perfil activo, configuración de IA, preferencias visuales.
- Gestionado automáticamente por Zustand con middleware `persist`.

### Supabase — Servicios en la Nube
- **Autenticación:** `supabase.auth.signUp()` / `supabase.auth.signInWithPassword()` con email ficticio `{dni}@planx.edu.pe`.
- **Respaldo de perfil:** Tabla `perfiles` en Supabase como copia de seguridad del perfil docente (sincronización bidireccional con IndexedDB).
- **NO se sube contenido pedagógico** (planes, unidades, sesiones) a Supabase por defecto. Esos datos viven en el navegador del usuario por privacidad y velocidad.
- **Futuro (opcional):** Si el docente quiere acceder desde otro dispositivo, se podría ofrecer un "Exportar/Importar" o sincronización selectiva bajo consentimiento explícito.

---

## 3. Estado Global (Zustand + Immer)

| Slice | Responsabilidad | Persistencia |
|-------|----------------|--------------|
| `PerfilSlice` | Auth, CRUD perfil, reset DB | `localStorage` + Supabase |
| `PlanAnualSlice` | CRUD planes anuales, diagnóstico | `IndexedDB` |
| `UnidadesSlice` | CRUD unidades/proyectos/módulos | `IndexedDB` |
| `AIConfigSlice` | Proveedor IA, API keys, modelo activo | `localStorage` |

**Middleware:**
- `persist` → Para slices en `localStorage`.
- `immer` → Para actualizaciones inmutables en estructuras complejas (matrices de unidades, árboles CNEB).

---

## 4. Flujo Completo de Datos

```
[Usuario abre la app en el navegador (desde GitHub Pages)]
    │
    ├─→ ¿Tiene sesión en Supabase? 
    │     ├─ SÍ → Carga perfil desde Supabase → Sincroniza con IndexedDB local
    │     └─ NO → Muestra Login/Registro
    │
    ├─→ Carga planes/unidades/sesiones desde IndexedDB (instantáneo)
    │
    ├─→ Operaciones de edición → Guardan en IndexedDB en tiempo real
    │
    ├─→ Generación IA → Llamada directa a Gemini API desde el navegador
    │
    └─→ Exportación → Genera .docx en memoria y lo descarga al PC del usuario
```

---

## 5. Seguridad y Consideraciones Cloud

- **API Keys de Gemini:** El usuario las ingresa desde la UI de PlanX y se almacenan en `localStorage`. Esto es necesario porque no hay backend propio que las guarde.
- **Supabase keys:** Las claves públicas (`anon key`) se pueden incluir en el código porque Supabase las protege con Row Level Security (RLS).
- **CORS:** Tanto Supabase como Gemini API permiten llamadas desde el navegador.
- **Offline:** Si el usuario pierde conexión, puede seguir editando localmente. La IA no estará disponible, pero toda la edición manual funciona sin internet.

---

## 6. Checklist de Despliegue a Producción

1. [ ] Configurar `base` en `vite.config.ts` con el nombre del repo.
2. [ ] Crear `public/404.html` con redirect script para SPA routing.
3. [ ] Agregar script `"deploy": "npm run build && npx gh-pages -d dist"` en `package.json`.
4. [ ] Configurar Supabase project con las tablas necesarias (`perfiles`).
5. [ ] Habilitar RLS en Supabase para proteger datos del perfil.
6. [ ] Verificar que las variables `VITE_*` se resuelven correctamente en build.
7. [ ] Test de flujo completo: Registro → Onboarding → Plan Anual → Unidad → Sesión → Exportar.

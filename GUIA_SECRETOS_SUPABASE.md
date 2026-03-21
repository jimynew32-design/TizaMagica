# 📋 Configuración de Secretos en Supabase

Este documento contiene los valores que debes copiar y pegar en la sección de **Secrets** de tus Edge Functions en el Dashboard de Supabase.

> [!IMPORTANT]
> Ve a: `Project Settings` -> `Edge Functions` -> `Add or Replace Secrets`.
> O usa este enlace: [Supabase Secrets Dashboard](https://supabase.com/dashboard/project/cwylwsnmmvcxdroiquuu/functions/secrets)

---

### 1️⃣ Google Cloud Vertex AI (Gemini)
Copia estos valores tal cual aparecen aquí para que la IA de tu app funcione correctamente con tus créditos.

| Name | Value (Copiar esto) |
| :--- | :--- |
| **GCP_PROJECT_ID** | `(VER_LOCAL_SECRETS_PRIVATE.md)` |
| **GCP_CLIENT_EMAIL** | `(VER_LOCAL_SECRETS_PRIVATE.md)` |
| **GCP_PRIVATE_KEY** | `(VER_LOCAL_SECRETS_PRIVATE.md)` |

---

### 2️⃣ Notificaciones vía Telegram
Estos valores son para que el sistema te abise por Telegram cuando alguien solicite acceso.
Bot: [@TizaMagicaAdminBot](https://t.me/TizaMagicaAdminBot)

| Name | Value |
| :--- | :--- |
| **TELEGRAM_BOT_TOKEN** | `(VER_LOCAL_SECRETS_PRIVATE.md)` |
| **TELEGRAM_ADMIN_CHAT_ID** | `(VER_LOCAL_SECRETS_PRIVATE.md)` |
| **APP_PUBLIC_URL** | `https://cwylwsnmmvcxdroiquuu.supabase.co` |

---

### 3️⃣ Otros (Opcionales / Por defecto)

| Name | Value (Normalmente el valor por defecto es suficiente) |
| :--- | :--- |
| **SUPABASE_URL** | `https://cwylwsnmmvcxdroiquuu.supabase.co` |
| **SUPABASE_SERVICE_ROLE_KEY** | `(Ya debería estar configurado por Supabase)` |

---

**Instrucción de copiado:**
1. Copia el **Name** y pégalo en el campo izquierdo del dashboard.
2. Copia el **Value** (incluyendo las comillas en el caso de la clave privada de GCP si lo haces vía CLI, o el texto directo si lo haces por el dashboard) y pégalo en el campo derecho.
3. Haz clic en **Save**.

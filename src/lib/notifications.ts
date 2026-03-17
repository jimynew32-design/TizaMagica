/**
 * Telegram Notification Service
 * SEGURIDAD (Fase 1): El token y chat_id se movieron a Supabase Secrets.
 * Las notificaciones ahora se disparan vía Database Webhook → Edge Function.
 * 
 * Este archivo se mantiene como stub para no romper imports existentes,
 * pero la función es ahora un no-op intencional.
 */

/**
 * @deprecated Ya no se envía desde el frontend.
 * Las notificaciones se disparan automáticamente vía Database Webhook
 * en Supabase cuando se inserta en `solicitudes_acceso`.
 */
export const sendTelegramNotification = async (
    _nombres: string,
    _institucion: string,
    _alias: string,
    _celular: string
): Promise<void> => {
    // No-op: La notificación se dispara server-side vía Database Webhook
    // → supabase/functions/notify-admin
    if (import.meta.env.DEV) {
        console.log('[Telegram] Notificación delegada a Edge Function (Database Webhook)');
    }
};

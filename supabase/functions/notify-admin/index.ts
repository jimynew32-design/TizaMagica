import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

/**
 * Supabase Edge Function — Notificación segura a Telegram
 * Resuelve: H-005
 *
 * Se activa vía Database Webhook (INSERT en solicitudes_acceso).
 * Las credenciales del bot están en Supabase Secrets.
 */
serve(async (req: Request) => {
  try {
    const payload = await req.json();

    // El Database Webhook envía { type, table, record, ... }
    if (payload.type !== "INSERT" || !payload.record) {
      return new Response(JSON.stringify({ ignored: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const record = payload.record;
    const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
    const appUrl =
      Deno.env.get("APP_PUBLIC_URL") || "https://tizamagica.edu.pe";

    if (!token || !chatId) {
      throw new Error("Credenciales Telegram no configuradas en Secrets.");
    }

    const msg =
      `🔔 *NUEVA SOLICITUD EN TIZAMÁGICA*\n\n` +
      `👤 *Docente:* ${record.nombres}\n` +
      `🏫 *I.E.:* ${record.institucion}\n` +
      `🔑 *Usuario:* \`${record.alias}\`\n` +
      `📱 *Celular:* ${record.celular || "No registrado"}\n\n` +
      `👉 [Ir al Panel Admin](${appUrl}/admin-tizamagica)`;

    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Telegram API error: ${err}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error interno de notificación";
    console.error("[notify-admin]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

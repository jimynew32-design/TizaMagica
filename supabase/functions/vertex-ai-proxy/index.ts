import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * PLANX SYSTEM V3.0 — SECURE VERTEX AI PROXY
 * 
 * Funciones clave:
 * 1. Autenticación de usuario via Supabase JWT.
 * 2. Autenticación GCP via Service Account (JWT RS256).
 * 3. Llamada a Vertex AI (Gemini).
 * 4. Registro de uso y latencia en `ai_usage_logs`.
 */
serve(async (req: Request) => {
  // Manejo de CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  let modelUsed = "gemini-1.5-flash";
  let promptType = "unknown";

  try {
    // 1. Inicializar cliente Supabase interno
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 2. Verificar identidad del usuario
    const authHeader = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!authHeader) throw new Error("No se proporcionó token de autorización.");

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) throw new Error("Sesión inválida o expirada.");
    userId = user.id;

    // 3. Procesar payload del frontend
    const payload = await req.json();
    const { contents, generationConfig, safetySettings, prompt_type } = payload;
    modelUsed = payload.model || "gemini-1.5-flash";
    promptType = prompt_type || "generic";
    const location = payload.location || "us-central1";

    // 4. Obtener Access Token de Google Cloud
    const projectId = Deno.env.get("GCP_PROJECT_ID");
    const clientEmail = Deno.env.get("GCP_CLIENT_EMAIL");
    const privateKeyRaw = Deno.env.get("GCP_PRIVATE_KEY");

    if (!projectId || !clientEmail || !privateKeyRaw) {
      throw new Error("Configuración de Vertex AI incompleta en el servidor.");
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
    const gcpAccessToken = await getGCPAccessToken(clientEmail, privateKey);

    // 5. Llamar a Vertex AI
    const vertexUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelUsed}:generateContent`;

    const vertexRes = await fetch(vertexUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${gcpAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: generationConfig || {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
        safetySettings: safetySettings || [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    });

    const endTime = Date.now();
    const latency = endTime - startTime;

    if (!vertexRes.ok) {
      const errorData = await vertexRes.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || `Vertex Error: ${vertexRes.status}`;
      
      // Registrar error en la DB
      await supabase.from("ai_usage_logs").insert({
        user_id: userId,
        model: modelUsed,
        prompt_type: promptType,
        status: "error",
        error_message: errorMsg,
        latency_ms: latency
      });

      return new Response(JSON.stringify({ error: errorMsg }), {
        status: vertexRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await vertexRes.json();
    const usage = data.usageMetadata || {};

    // 6. Registrar éxito y consumo
    await supabase.from("ai_usage_logs").insert({
      user_id: userId,
      model: modelUsed,
      prompt_type: promptType,
      status: "success",
      prompt_tokens: usage.promptTokenCount || 0,
      completion_tokens: usage.candidatesTokenCount || 0,
      total_tokens: usage.totalTokenCount || 0,
      latency_ms: latency
    });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[Vertex Proxy Error]:", error.message);
    
    return new Response(JSON.stringify({ 
      error: error.message || "Error interno en el servidor de IA",
      type: "PROXY_ERROR"
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * Genera un Access Token para GCP usando el flujo de Service Account (JWT Bearer)
 */
async function getGCPAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = b64url(JSON.stringify(header));
  const encodedPayload = b64url(JSON.stringify(payload));
  const content = `${encodedHeader}.${encodedPayload}`;

  const binaryKey = pemToBinary(privateKey);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(content)
  );

  const jwt = `${content}.${arrayBufferToB64url(signature)}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.json();
    throw new Error(`GCP Auth Failed: ${err.error_description || err.error}`);
  }

  return (await tokenRes.json()).access_token;
}

function b64url(s: string): string {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function arrayBufferToB64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToBinary(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, "")
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const view = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return view.buffer;
}

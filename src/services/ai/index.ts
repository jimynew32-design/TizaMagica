import { withRateLimiter } from './rate-limiter';
import { getFromCache, setInCache } from './cache';
import { supabase } from '@/lib/supabase';
export * from './prompts';

import type { IAProvider } from '@/types/schemas';

interface ChatOptions {
    provider?: IAProvider;
    model?: string;
    apiKey?: string;
    apiKeyResolver?: () => Promise<string>;
    customUrl?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'json' | 'text';
    promptType?: string; // Nuevo: para categorizar logs en ai_usage_logs
}

/**
 * Servicio central de IA para PlanX System v3.0 (Security First)
 * 
 * Todas las llamadas se canalizan a través de Supabase Edge Functions
 * para evitar la exposición de claves privadas en el navegador.
 */
export async function chatCompletion(
    systemPrompt: string,
    userPrompt: string,
    options: ChatOptions = {}
): Promise<any> {
    // 1. Verificar caché antes de llamar a la nube
    const cached = await getFromCache(systemPrompt, userPrompt);
    if (cached) return cached;

    // 2. Ejecutar con Rate Limiter y Circuit Breaker
    const result = await withRateLimiter(
        () => chatCompletionViaEdgeFunction(systemPrompt, userPrompt, options),
        'Vertex AI Proxy'
    );

    // 3. Guardar en caché (30 min TTL)
    await setInCache(systemPrompt, userPrompt, result);
    return result;
}

/**
 * Implementación segura via Supabase Edge Functions.
 * La autenticación se maneja automáticamente via el JWT del usuario en el SDK de Supabase.
 */
async function chatCompletionViaEdgeFunction(
    systemPrompt: string,
    userPrompt: string,
    options: ChatOptions
): Promise<any> {
    const { useStore } = await import('@/store');
    const { aiConfig } = useStore.getState();

    // Determinar modelo
    const model = options.model
        || aiConfig.activeModel
        || import.meta.env.VITE_GEMINI_MODEL_PRIMARY
        || 'gemini-1.5-flash';

    // --- TEMPORAL: SOPORTE LM STUDIO PARA PRUEBAS ---
    if (aiConfig.provider === 'lmstudio') {
        let baseUrl = aiConfig.lmstudioUrl || 'http://localhost:1234/v1';
        // Normalizar URL: asegurar que termine en /v1 si no lo tiene
        if (!baseUrl.endsWith('/v1') && !baseUrl.endsWith('/v1/')) {
            baseUrl = baseUrl.replace(/\/$/, '') + '/v1';
        }
        
        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model || 'local-model',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: options.temperature ?? 0.7,
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Error de conexión con LM Studio');
            }

            // Validar que LM Studio devolvió una respuesta válida procesada
            if (!data.choices || data.choices.length === 0) {
                console.warn('[LM Studio] Respuesta vacía o endpoint incorrecto:', data);
                throw new Error('LM Studio recibió la petición pero no devolvió una respuesta. Verifica que el modelo esté cargado correctamente.');
            }

            const textResponse = data.choices[0].message.content;
            
            if (import.meta.env.DEV && aiConfig.enableLogging) {
                console.log('[LM Studio Response]:', textResponse);
            }

            return extractJSON(textResponse);
        } catch (error: any) {
            console.error('[LM Studio Error]:', error);
            throw new Error(error.message || `LM Studio no disponible. Verifica la URL: ${baseUrl}`);
        }
    }
    // --- FIN TEMPORAL ---

    // Construir el payload según el formato esperado por Vertex AI
    const payload = {
        model,
        prompt_type: options.promptType || 'ui_generic',
        contents: [
            {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
            }
        ],
        generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxTokens ?? 2048,
            ...(options.responseFormat !== 'text' && { responseMimeType: "application/json" })
        }
    };

    if (import.meta.env.DEV) {
        console.log(`[IA Proxy] Llamando a vertex-ai-proxy con modelo: ${model}`);
    }

    // Invocar Edge Function de Supabase
    // El SDK incluye automáticamente el header Authorization con el Access Token del usuario logueado
    const { data, error } = await supabase.functions.invoke('vertex-ai-proxy', {
        body: payload
    });

    if (error) {
        console.error('[IA Proxy Error]:', error);
        
        // Manejo de errores específicos
        if (error.message?.includes('429')) {
            throw new Error('Límite de solicitudes alcanzado. Por favor, intenta de nuevo en unos minutos.');
        }
        
        throw new Error(error.message || 'Error al comunicarse con el servicio de IA protegida.');
    }

    // Procesar respuesta de Gemini (dentro de candidates)
    if (data?.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error('La respuesta fue bloqueada por los filtros de seguridad de Google.');
    }

    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
        throw new Error('La IA no generó una respuesta válida. Inténtalo de nuevo.');
    }

    if (import.meta.env.DEV && aiConfig.enableLogging) {
        console.log('[IA Proxy Raw Response]:', textResponse);
    }

    return extractJSON(textResponse);
}

/**
 * Utilidad experta para extraer JSON de respuestas de IA.
 * Maneja respuestas con markdown, caracteres de control y formatos mixtos.
 */
function extractJSON(text: string): any {
    // 1. Limpiar caracteres de control invisibles
    let cleaned = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, (c: string) =>
        c === '\n' ? '\\n' : c === '\r' ? '\\r' : c === '\t' ? '\\t' : ''
    ).trim();

    // 2. Remover bloques de código markdown
    cleaned = cleaned.replace(/```json\n?|```/g, '').trim();

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        const firstBracket = cleaned.indexOf('[');
        const lastBracket = cleaned.lastIndexOf(']');

        if (firstBrace !== -1 && lastBrace !== -1) {
            try { return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1)); } catch (e2) {}
        }
        if (firstBracket !== -1 && lastBracket !== -1) {
            try { return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1)); } catch (e3) {}
        }

        if (import.meta.env.DEV) {
            console.error('[IA] JSON Parse Error. Raw text:', text);
        }
        throw new Error('La respuesta de la IA no tiene un formato JSON válido.');
    }
}

/**
 * Valida la disponibilidad de la infraestructura de IA.
 */
export async function checkConnection(
    provider: IAProvider,
    _apiKey?: string
): Promise<boolean> {
    try {
        if (provider === 'lmstudio') {
            const { useStore } = await import('@/store');
            const { aiConfig } = useStore.getState();
            const baseUrl = aiConfig.lmstudioUrl || 'http://localhost:1234/v1';
            const response = await fetch(`${baseUrl}/models`, { method: 'GET' });
            return response.ok;
        }

        // En V3.0, solo verificamos que Supabase esté configurado para Vertex
        return !!import.meta.env.VITE_SUPABASE_URL;
    } catch {
        return false;
    }
}

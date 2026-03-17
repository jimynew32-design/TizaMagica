/**
 * PlanX System — Configuración de Modelos de IA
 */
export const AI_CONFIG = {
    gemini: {
        baseUrl: import.meta.env.VITE_GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta',
        models: {
            primary: import.meta.env.VITE_GEMINI_MODEL_PRIMARY || 'gemini-2.0-flash',
            fallback: import.meta.env.VITE_GEMINI_MODEL_FALLBACK || 'gemini-1.5-flash',
            lastResort: import.meta.env.VITE_GEMINI_MODEL_LAST_RESORT || 'gemini-1.5-flash-latest',
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
    },
    lmstudio: {
        baseUrl: import.meta.env.VITE_LMSTUDIO_URL || 'http://localhost:1234/v1/chat/completions',
    },
} as const

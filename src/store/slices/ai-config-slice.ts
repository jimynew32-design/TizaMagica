import type { StateCreator } from 'zustand'
import type { AIConfig } from '@/types/schemas'

/**
 * AIConfigSlice — Configuración del motor IA (modelo activo, opciones)
 * Persistencia: localStorage (vía Zustand persist)
 *
 * SEGURIDAD (Fase 1): Se eliminó toda referencia a google-service-account.
 * Las credenciales GCP viven exclusivamente en Supabase Secrets.
 * Ya no se almacenan API keys encriptadas en el frontend.
 */

export interface AIConfigSlice {
    // State
    aiConfig: AIConfig
    isSettingsOpen: boolean

    // Actions
    setProvider: (provider: 'vertex' | 'gemini' | 'lmstudio') => void
    setGeminiApiKey: (key: string) => void
    setLMStudioUrl: (url: string) => void
    setVertexConfig: (config: Partial<AIConfig['vertexConfig']>) => void
    setActiveModel: (model: string) => void
    setAutoRetry: (enabled: boolean) => void
    setEnableLogging: (enabled: boolean) => void
    toggleSettings: (open?: boolean) => void
    getActiveModel: () => string
    getDecryptedVertexKey: () => Promise<string>
    getDecryptedApiKey: () => Promise<string>
}

export const createAIConfigSlice: StateCreator<
    AIConfigSlice,
    [['zustand/immer', never]],
    [],
    AIConfigSlice
> = (set, get) => ({
    aiConfig: {
        provider: 'vertex',
        geminiApiKey: '',
        lmstudioUrl: '',
        vertexConfig: {
            project_id: '',
            client_email: '',
            private_key: '', // Ya no se almacena — vive en Supabase Secrets
            location: 'us-central1'
        },
        activeModel: 'gemini-1.5-flash',
        autoRetry: true,
        enableLogging: false,
    },
    isSettingsOpen: false,

    setProvider: (provider: 'vertex' | 'gemini' | 'lmstudio') => {
        set((state) => { state.aiConfig.provider = provider });
    },

    setGeminiApiKey: (key: string) => {
        set((state) => { state.aiConfig.geminiApiKey = key });
    },

    setLMStudioUrl: (url: string) => {
        set((state) => { state.aiConfig.lmstudioUrl = url });
    },

    setVertexConfig: (config: Partial<AIConfig['vertexConfig']>) => {
        set((state) => {
            if (!state.aiConfig.vertexConfig) {
                state.aiConfig.vertexConfig = {
                    project_id: '',
                    client_email: '',
                    private_key: '',
                    location: 'us-central1'
                };
            }

            // Ya no encriptamos la private_key en el frontend
            const { private_key: _pk, ...rest } = config;
            Object.assign(state.aiConfig.vertexConfig, rest);
        });
    },

    setActiveModel: (model: string) => {
        set((state) => { state.aiConfig.activeModel = model })
    },

    setAutoRetry: (enabled: boolean) => {
        set((state) => { state.aiConfig.autoRetry = enabled })
    },

    setEnableLogging: (enabled: boolean) => {
        set((state) => { state.aiConfig.enableLogging = enabled })
    },

    toggleSettings: (open?: boolean) => {
        set((state) => {
            state.isSettingsOpen = open !== undefined ? open : !state.isSettingsOpen
        })
    },

    getActiveModel: () => {
        const currentModel = get().aiConfig.activeModel;
        const isExp = currentModel.includes('2.5') || currentModel.includes('2.0-flash-exp');

        if (isExp) {
            const newModel = 'gemini-1.5-flash';
            setTimeout(() => {
                set((state) => { state.aiConfig.activeModel = newModel; });
            }, 0);
            return newModel;
        }
        return currentModel;
    },

    // Estas funciones ya no intentan desencriptar nada — las claves están en el servidor
    getDecryptedVertexKey: async () => {
        return ''; // No-op: clave vive en Supabase Secrets
    },

    getDecryptedApiKey: async () => {
        return ''; // No-op: clave vive en Supabase Secrets
    },
})

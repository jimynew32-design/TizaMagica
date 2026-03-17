/// <reference types="vite/client" />

interface ImportMetaEnv {
    // Gemini
    readonly VITE_GEMINI_API_URL: string
    readonly VITE_GEMINI_API_KEY: string
    readonly VITE_GEMINI_MODEL_PRIMARY: string
    readonly VITE_GEMINI_MODEL_FALLBACK: string
    readonly VITE_GEMINI_MODEL_LAST_RESORT: string
    // LM Studio
    readonly VITE_LMSTUDIO_URL: string
    // Supabase
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    // CNEB
    readonly VITE_CNEB_INDEX_VERSION: string
    // Defaults
    readonly VITE_DEFAULT_START_DATE: string
    readonly VITE_DEFAULT_END_DATE: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

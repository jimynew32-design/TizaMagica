-- Migración: Tabla para registro de uso de IA
-- Propósito: Observabilidad, auditoría de costos y control de cuotas por usuario.

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    prompt_type TEXT,          -- Ej: 'GENERAR_SESION', 'POBLAR_CONTEXTO', 'AUDITORIA'
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    latency_ms INT DEFAULT 0,
    status TEXT NOT NULL,      -- 'success', 'error', 'blocked'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON public.ai_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_status ON public.ai_usage_logs(status);

-- RLS: Los usuarios pueden ver su propio historial, pero no editarlo ni borrarlo.
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propio registro de IA" 
    ON public.ai_usage_logs FOR SELECT 
    USING (auth.uid() = user_id);

-- La Edge Function inserta como service_role, por lo que no necesita política de INSERT si se usa la service_key.
-- Si se usara la anon_key con RLS habilitado, se requeriría una política de INSERT.

COMMENT ON TABLE public.ai_usage_logs IS 'Log de consumo de tokens y actividad de IA Gemini/Vertex.';

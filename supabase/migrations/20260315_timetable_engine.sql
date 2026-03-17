-- Migración: Motor de Horarios (PlanX Timetable Engine)
-- Fecha: 2026-03-15

-- Configuración Institucional del Horario
CREATE TABLE IF NOT EXISTS horarios_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    selected_year INTEGER NOT NULL,
    bloque_duracion_estandar INTEGER DEFAULT 45,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Celdas del Horario (Malla)
CREATE TABLE IF NOT EXISTS horarios_celdas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    horario_id UUID REFERENCES horarios_config(id) ON DELETE CASCADE,
    bloque_id TEXT NOT NULL,
    dia TEXT NOT NULL,
    inicio TIME NOT NULL,
    fin TIME NOT NULL,
    aula_id UUID,
    docente_id UUID,
    materia_id UUID,
    grupo_id UUID,
    is_pinned BOOLEAN DEFAULT false,
    estado TEXT DEFAULT 'free', -- free, assigned, conflict
    metadata JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auditoría de Conflictos y Salud
CREATE TABLE IF NOT EXISTS horarios_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    horario_id UUID REFERENCES horarios_config(id) ON DELETE CASCADE,
    tipo_evento TEXT NOT NULL, -- 'conflict', 'resolution', 'sync'
    descripcion TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para optimización de colisiones
CREATE INDEX idx_horarios_celdas_docente ON horarios_celdas (docente_id, dia, inicio);
CREATE INDEX idx_horarios_celdas_aula ON horarios_celdas (aula_id, dia, inicio);
CREATE INDEX idx_horarios_celdas_grupo ON horarios_celdas (grupo_id, dia, inicio);

-- Habilitar RLS
ALTER TABLE horarios_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_celdas ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_audit ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Propietario puede todo)
CREATE POLICY "Users can manage their own schedules" ON horarios_config
    FOR ALL USING (auth.uid() = institucion_id);

CREATE POLICY "Users can manage cells of their schedules" ON horarios_celdas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM horarios_config 
            WHERE id = horarios_celdas.horario_id AND institucion_id = auth.uid()
        )
    );

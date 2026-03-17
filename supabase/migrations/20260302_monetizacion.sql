CREATE TABLE IF NOT EXISTS solicitudes_acceso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alias VARCHAR(50) UNIQUE NOT NULL,
    nombres VARCHAR(255) NOT NULL,
    institucion VARCHAR(255) NOT NULL,
    celular VARCHAR(20),
    metodo_pago VARCHAR(50),
    codigo_operacion VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'PENDIENTE_PAGO' CHECK (estado IN ('PENDIENTE_PAGO', 'EN_REVISION', 'APROBADA', 'RECHAZADA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE solicitudes_acceso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir insercion anonima" ON solicitudes_acceso FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura para verificar alias" ON solicitudes_acceso FOR SELECT USING (true);
CREATE POLICY "Permitir actualizacion anonima para subir voucher" ON solicitudes_acceso FOR UPDATE USING (true);

ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

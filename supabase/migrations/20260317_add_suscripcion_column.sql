-- Migración para añadir columna de suscripción a solicitudes de acceso
-- Generado por Antigravity a petición del usuario para resolver error de columna inexistente.

ALTER TABLE solicitudes_acceso 
ADD COLUMN IF NOT EXISTS dias_suscripcion INTEGER DEFAULT 30;

-- Asegurar que los registros existentes tengan el valor por defecto
UPDATE solicitudes_acceso 
SET dias_suscripcion = 30 
WHERE dias_suscripcion IS NULL;

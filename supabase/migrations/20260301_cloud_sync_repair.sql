-- ========================================================
-- PlanX Cloud Sync Repair - Adding Missing Columns
-- ========================================================

-- 1. Agregar columnas faltantes a 'planes'
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS "bitacoraPedagogica" TEXT;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS "orientaciones" JSONB;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS "sesionesPorSemana" INTEGER DEFAULT 2;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS "calendarioComunalData" JSONB;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS "matrizCompetencias" JSONB;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS "enfoquesTransversales" JSONB;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS "periodoTipo" TEXT;

-- 2. Asegurar columnas en 'unidades'
ALTER TABLE public.unidades ADD COLUMN IF NOT EXISTS "proyectoExtra" JSONB;
ALTER TABLE public.unidades ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.unidades ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT now();

-- 3. Asegurar columnas en 'sesiones'
ALTER TABLE public.sesiones ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.sesiones ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT now();

-- 4. Limpieza de Politicas de Seguridad
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('perfiles', 'planes', 'unidades', 'sesiones')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 5. Re-aplicar Politicas Seguras vinculadas al Usuario
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones ENABLE ROW LEVEL SECURITY;

-- Politicas PERFILES
CREATE POLICY "Dueno puede ver su perfil" ON perfiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Dueno puede actualizar su perfil" ON perfiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Dueno puede insertar su perfil" ON perfiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Politicas PLANES
CREATE POLICY "Dueno puede gestionar sus planes" ON planes 
    FOR ALL USING (auth.uid() = "perfilDocenteId");

-- Politicas UNIDADES
CREATE POLICY "Dueno puede gestionar unidades" ON unidades 
    FOR ALL USING (EXISTS (SELECT 1 FROM planes WHERE id = unidades."planAnualId" AND "perfilDocenteId" = auth.uid()));

-- Politicas SESIONES
CREATE POLICY "Dueno puede gestionar sesiones" ON sesiones 
    FOR ALL USING (EXISTS (SELECT 1 FROM unidades u JOIN planes p ON u."planAnualId" = p.id WHERE u.id = sesiones."unidadId" AND p."perfilDocenteId" = auth.uid()));

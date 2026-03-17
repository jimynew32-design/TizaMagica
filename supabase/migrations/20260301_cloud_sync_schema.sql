-- ========================================================
-- PlanX Cloud Sync Schema — Pedagogical Data (v2 Cleanup)
-- ========================================================

-- A. LIMPIEZA DE POLÍTICAS PREVIAS (Para evitar conflictos)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('perfiles', 'planes', 'unidades', 'sesiones')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- B. TABLAS PRINCIPALES (Asegurar existencia y columnas correctas)

CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    dni TEXT UNIQUE NOT NULL,
    "nombreCompleto" TEXT,
    "gereduDre" TEXT,
    ugel TEXT,
    "nombreIE" TEXT,
    director TEXT,
    nivel TEXT,
    "cargaHoraria" JSONB DEFAULT '[]'::jsonb,
    "isOnboarded" BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.planes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "perfilDocenteId" UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    nivel TEXT,
    grado TEXT,
    ciclo TEXT,
    area TEXT,
    "sesionesPorSemana" INTEGER DEFAULT 2,
    diagnostico JSONB,
    identidad JSONB,
    "periodoTipo" TEXT,
    "calendarioComunal" TEXT,
    "calendarioComunalData" JSONB,
    "matrizCompetencias" JSONB,
    "enfoquesTransversales" JSONB,
    unidades JSONB DEFAULT '[]'::jsonb,
    "bitacoraPedagogica" TEXT,
    orientaciones JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.unidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "planAnualId" UUID REFERENCES public.planes(id) ON DELETE CASCADE,
    numero INTEGER,
    tipo TEXT,
    "diagnosticoStep" JSONB,
    "disenaStep" JSONB,
    "organizaStep" JSONB,
    "seleccionaStep" JSONB,
    "preveStep" JSONB,
    "proyectoExtra" JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sesiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "unidadId" UUID REFERENCES public.unidades(id) ON DELETE CASCADE,
    titulo TEXT,
    proposito TEXT,
    "competenciaId" TEXT,
    "capacidadId" TEXT,
    "desempenoPrecisado" TEXT,
    evidencia TEXT,
    instrumento TEXT,
    "instrumentoContenido" TEXT,
    "secuenciaDidactica" JSONB,
    recursos JSONB DEFAULT '[]'::jsonb,
    orden INTEGER,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- C. HABILITAR RLS Y APLICAR NUEVAS POLÍTICAS

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones ENABLE ROW LEVEL SECURITY;

-- Políticas para PERFILES
CREATE POLICY "Dueño puede ver su perfil" ON perfiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Dueño puede actualizar su perfil" ON perfiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Dueño puede insertar su perfil" ON perfiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para PLANES
CREATE POLICY "Dueño puede ver sus planes" ON planes FOR SELECT USING (auth.uid() = "perfilDocenteId");
CREATE POLICY "Dueño puede insertar sus planes" ON planes FOR INSERT WITH CHECK (auth.uid() = "perfilDocenteId");
CREATE POLICY "Dueño puede actualizar sus planes" ON planes FOR UPDATE USING (auth.uid() = "perfilDocenteId");
CREATE POLICY "Dueño puede eliminar sus planes" ON planes FOR DELETE USING (auth.uid() = "perfilDocenteId");

-- Políticas para UNIDADES
CREATE POLICY "Dueño puede ver unidades" ON unidades FOR SELECT USING (EXISTS (SELECT 1 FROM planes WHERE id = unidades."planAnualId" AND "perfilDocenteId" = auth.uid()));
CREATE POLICY "Dueño puede insertar unidades" ON unidades FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM planes WHERE id = "planAnualId" AND "perfilDocenteId" = auth.uid()));
CREATE POLICY "Dueño puede actualizar unidades" ON unidades FOR UPDATE USING (EXISTS (SELECT 1 FROM planes WHERE id = unidades."planAnualId" AND "perfilDocenteId" = auth.uid()));
CREATE POLICY "Dueño puede eliminar unidades" ON unidades FOR DELETE USING (EXISTS (SELECT 1 FROM planes WHERE id = unidades."planAnualId" AND "perfilDocenteId" = auth.uid()));

-- Políticas para SESIONES
CREATE POLICY "Dueño puede ver sesiones" ON sesiones FOR SELECT USING (EXISTS (SELECT 1 FROM unidades u JOIN planes p ON u."planAnualId" = p.id WHERE u.id = sesiones."unidadId" AND p."perfilDocenteId" = auth.uid()));
CREATE POLICY "Dueño puede insertar sesiones" ON sesiones FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM unidades u JOIN planes p ON u."planAnualId" = p.id WHERE u.id = "unidadId" AND p."perfilDocenteId" = auth.uid()));
CREATE POLICY "Dueño puede actualizar sesiones" ON sesiones FOR UPDATE USING (EXISTS (SELECT 1 FROM unidades u JOIN planes p ON u."planAnualId" = p.id WHERE u.id = sesiones."unidadId" AND p."perfilDocenteId" = auth.uid()));
CREATE POLICY "Dueño puede eliminar sesiones" ON sesiones FOR DELETE USING (EXISTS (SELECT 1 FROM unidades u JOIN planes p ON u."planAnualId" = p.id WHERE u.id = sesiones."unidadId" AND p."perfilDocenteId" = auth.uid()));

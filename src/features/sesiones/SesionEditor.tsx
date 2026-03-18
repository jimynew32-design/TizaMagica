import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AIButton } from '@/components/ui/AIButton';
import { Spinner } from '@/components/ui/Spinner';
import { TabSwitch } from '@/components/ui/TabSwitch';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { Sesion, TipoInstrumento, MomentoDidactico } from '@/types/schemas';
import { useUnidadesStore, usePlanAnualStore, usePerfilStore } from '@/store';
import { useDebounce } from '@/hooks/ui/useDebounce';
import { chatCompletion } from '@/services/ai';
import { exportarSesion, printSesion } from '@/services/export';
import { cnebService } from '@/services/cneb';
import { cn } from '@/lib/cn';

const INSTRUMENTOS: TipoInstrumento[] = ['Lista de Cotejo', 'Rúbrica', 'Guion de Observación'];

const MOMENTO_LABELS: Record<string, { icon: string; color: string; duracion: string }> = {
    inicio: { icon: 'play_circle', color: 'text-primary-teal', duracion: '15-20 min' },
    desarrollo: { icon: 'build_circle', color: 'text-brand-magenta', duracion: '45-60 min' },
    cierre: { icon: 'check_circle', color: 'text-yellow-400', duracion: '10-15 min' },
};

// ─── Collapsible Section Component ──────────────────────────────────────────

interface SectionProps {
    id: string;
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    isInherited?: boolean;
    badge?: string;
    icon?: string;
}

const Section: React.FC<SectionProps> = ({ title, isOpen, onToggle, children, isInherited, badge, icon }) => (
    <div className={cn(
        "border-b border-white/5 transition-all overflow-hidden",
        isInherited && !isOpen ? "bg-white/[0.01]" : "",
        isOpen ? "bg-white/[0.02] pb-8" : "hover:bg-white/[0.01]"
    )}>
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between p-6 group"
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    isOpen ? "bg-primary-teal/20 text-primary-teal" : "bg-white/5 text-gray-500 group-hover:text-gray-300",
                    isInherited && "bg-transparent border border-white/5 text-gray-700"
                )}>
                    <span className="material-icons-round text-lg">{icon || 'segment'}</span>
                </div>
                <div className="text-left">
                    <h3 className={cn(
                        "text-sm font-black uppercase tracking-widest transition-all",
                        isOpen ? "text-white" : "text-gray-500 group-hover:text-gray-400",
                        isInherited && "text-gray-600"
                    )}>
                        {title}
                    </h3>
                    {badge && (
                        <span className="text-[8px] font-black text-primary-teal/60 uppercase tracking-widest mt-1 block">
                            {badge}
                        </span>
                    )}
                </div>
                {isInherited && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                        <span className="material-icons-round text-[10px] text-gray-600">lock</span>
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest font-mono">HEREDADO</span>
                    </div>
                )}
            </div>
            <span className={cn(
                "material-icons-round text-gray-700 transition-transform duration-300",
                isOpen && "rotate-180 text-primary-teal"
            )}>
                expand_more
            </span>
        </button>
        <div className={cn(
            "px-6 transition-all duration-300",
            isOpen ? "max-h-[2000px] opacity-100 visible" : "max-h-0 opacity-0 invisible"
        )}>
            {children}
        </div>
    </div>
);

// ─── Editor Component ───────────────────────────────────────────────────────

export const SesionEditor: React.FC = () => {
    const { sesionId } = useParams<{ sesionId: string }>();
    const navigate = useNavigate();
    const { sesiones, getUnidadesByPlan, upsertSesion, isSyncing } = useUnidadesStore();
    const { planActivo } = usePlanAnualStore();
    const { perfil } = usePerfilStore();

    const sesion = sesiones.find(s => s.id === sesionId);
    const unidad = planActivo ? getUnidadesByPlan(planActivo.id).find(u => u.id === sesion?.unidadId) : null;

    const [local, setLocal] = useState<Sesion | null>(null);
    const [loadingIA, setLoadingIA] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    
    // --- Navigation Steps ---
    const STEPS = [
        { value: 'contexto', label: 'Contexto', icon: 'info' },
        { value: 'identidad', label: 'Identidad', icon: 'edit_note' },
        { value: 'propositos', label: 'Propósitos', icon: 'track_changes' },
        { value: 'secuencia', label: 'Secuencia', icon: 'reorder' },
        { value: 'evaluacion', label: 'Evaluación', icon: 'fact_check' },
        { value: 'guion', label: 'Guion', icon: 'record_voice_over' },
        { value: 'materiales', label: 'Materiales', icon: 'auto_stories' }
    ];
    const [activeStep, setActiveStep] = useState('contexto');

    // State for collapsible sections
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        datos: false,
        unidad: false,
        titulo: true,
        proposito: true,
        secuencia: true,
        modDiag: false,
        modCrit: false,
        modInd: false,
        modInst: false,
    });

    useEffect(() => {
        if (sesion) setLocal({ ...sesion });
    }, [sesionId]);

    const debouncedLocal = useDebounce(local, 1200);

    useEffect(() => {
        if (debouncedLocal) {
            upsertSesion({ ...debouncedLocal, updatedAt: new Date().toISOString() });
        }
    }, [debouncedLocal]);

    const toggleSection = (id: string) => {
        setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const update = (field: Partial<Sesion>) => setLocal(prev => prev ? { ...prev, ...field } : prev);

    const updateMomento = (momento: 'inicio' | 'desarrollo' | 'cierre', field: keyof MomentoDidactico, value: string | number) => {
        if (!local) return;
        setLocal({ 
            ...local, 
            secuenciaDidactica: { 
                ...local.secuenciaDidactica, 
                [momento]: { 
                    ...local.secuenciaDidactica[momento], 
                    [field]: value 
                } 
            } 
        });
    };

    const handleGenerarSecuencia = async () => {
        if (!local || !planActivo || !perfil) return;
        setLoadingIA('secuencia');
        try {
            const result = await chatCompletion(
                'Eres un diseñador instruccional pedagógico del MINEDU Perú.',
                `Genera los 3 momentos didácticos (Inicio, Desarrollo, Cierre) para la sesión titulada "${local.titulo}". El desempeño es: "${local.desempenoPrecisado}". Retorna JSON: { "inicio": {"descripcion": "...", "duracionMinutos": 20, "estrategiaMetodologica": "...", "recursosMateriales": "..."}, "desarrollo": {"descripcion": "...", "duracionMinutos": 55, "estrategiaMetodologica": "...", "recursosMateriales": "..."}, "cierre": {"descripcion": "...", "duracionMinutos": 15, "estrategiaMetodologica": "...", "recursosMateriales": "..."} }`,
            );
            if (result.inicio) {
                update({ secuenciaDidactica: result });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingIA(null);
        }
    };

    const handleSugerirPropositos = async () => {
        if (!local || !unidad || !planActivo) return;
        setLoadingIA('propositos');
        try {
            // Tarea 4.1: Alineación Inteligente (M05)
            // Obtenemos el catálogo real para que la IA no invente competencias
            const validComps = await cnebService.getCompetenciasByAreaNivel(planActivo.area, planActivo.nivel);
            const compsList = validComps.map(c => `- ${c.nombre}`).join('\n');

            const result = await chatCompletion(
                'Eres un consultor pedagógico experto en el CNEB Perú.',
                `Basándote exclusivamente en este listado de competencias oficiales del área ${planActivo.area}:
                ${compsList}

                Y considerando:
                - SITUACIÓN SIGNIFICATIVA: "${unidad.diagnosticoStep.situacionSignificativa}"
                - TÍTULO DE LA SESIÓN: "${local.titulo}"
                - GRADO: ${planActivo.grado}

                Sugiere la competencia más pertinente, las capacidades relacionadas y redacta un desempeño precisado coherente. 
                Retorna JSON: { "competenciaId": "nombre exacto de la competencia", "capacidadId": "capacidades vinculadas", "desempenoPrecisado": "redacción del desempeño precisado" }`,
            );
            if (result.competenciaId) {
                update(result);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingIA(null);
        }
    };

    const handleGenerarInstrumento = async () => {
        if (!local) return;
        setLoadingIA('instrumento');
        try {
            const isRubrica = local.instrumento === 'Rúbrica';
            
            // Tarea 4.3: Rúbrica Automática (M05)
            // Prompt especializado para niveles de logro CNEB
            const prompt = isRubrica 
                ? `Eres un experto en evaluación formativa del CNEB Perú. 
                   Genera una RÚBRICA ANALÍTICA DETALLADA para evaluar la siguiente sesión:
                   - TÍTULO: "${local.titulo}"
                   - DESEMPEÑO: "${local.desempenoPrecisado}"
                   - EVIDENCIA/PRODUCTO: "${local.evidencia}"
                   
                   REQUISITOS DE LA TABLA:
                   1. Columnas obligatorias: "CRITERIO DE EVALUACIÓN", "AD (LOGRO DESTACADO)", "A (LOGRO ESPERADO)", "B (EN PROCESO)", "C (EN INICIO)".
                   2. Los descriptores deben ser graduales, técnicos y observar el progreso del alumno.
                   3. Formato: Tabla Markdown limpia.
                   
                   Retorna JSON: { "contenido": "Tabla Markdown con la rúbrica completa" }`
                : `Genera una ${local.instrumento} para evaluar la siguiente evidencia: "${local.evidencia}". 
                   El desempeño precisado es: "${local.desempenoPrecisado}". 
                   Contexto de la sesión: "${local.titulo}".
                   Retorna JSON: { "contenido": "Texto formateado con la ${local.instrumento} lista para usar" }`;

            const result = await chatCompletion(
                'Eres un especialista en instrumentos de evaluación para educación básica.',
                prompt,
            );
            if (result.contenido) update({ instrumentoContenido: result.contenido });
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingIA(null);
        }
    };

    const handleGenerarGuion = async () => {
        if (!local) return;
        setLoadingIA('guion');
        try {
            // Tarea 4.4: Guion Docente (M05) - Enfoque en Mediación
            const result = await chatCompletion(
                'Eres un experto en mediación pedagógica y acompañamiento docente del MINEDU.',
                `Genera un GUION ESTRATÉGICO DE MEDIACIÓN para la sesión: "${local.titulo}". 
                
                ESTRUCTURA REQUERIDA (Markdown):
                1. **INICIO (Saberes Previos y Conflicto Cognitivo):** Diálogo para el recojo de saberes y 3 preguntas clave para generar desequilibrio cognitivo.
                2. **DESARROLLO (Gestión y Acompañamiento):** Pautas para el monitoreo, frases de retroalimentación oportuna y preguntas para andamiaje (Vigotsky).
                3. **CIERRE (Metacognición y Transferencia):** Preguntas para que el alumno reflexione sobre SU proceso y cómo aplicarlo en otros contextos.
                
                Contexto Sugerido: ${local.objetivoEspecifico || local.proposito}.
                Secuencia Base: Inicio (${local.secuenciaDidactica?.inicio?.descripcion}), Desarrollo (${local.secuenciaDidactica?.desarrollo?.descripcion}).
                
                Retorna JSON: { "guionDocente": "Contenido detallado con Diálogos, Preguntas Socráticas y Tips de Mediación." }`,
            );
            if (result.guionDocente) update({ guionDocente: result.guionDocente });
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingIA(null);
        }
    };

    const handleGenerarMateriales = async () => {
        if (!local || !planActivo) return;
        setLoadingIA('materiales');
        try {
            // Tarea 4.5: Materiales Express (M05)
            const result = await chatCompletion(
                'Eres un editor de materiales educativos de alto impacto.',
                `Genera una FICHA DE LECTURA Y ACTIVIDADES para estudiantes de ${planActivo.grado} de Educación ${planActivo.nivel}.
                
                TEMA DE LA SESIÓN: "${local.titulo}"
                OBJETIVO: "${local.objetivoEspecifico || local.proposito}"
                
                REQUISITOS DEL CONTENIDO (Markdown):
                1. **TEXTO MOTIVADOR:** Una lectura de 3 a 4 párrafos sobre el tema, con lenguaje adaptado a la edad.
                2. **RETO DE COMPRENSIÓN:** 
                   - 2 Preguntas de nivel LITERAL (información explícita).
                   - 2 Preguntas de nivel INFERENCIAL (deducciones y conclusiones).
                   - 1 Pregunta de nivel CRÍTICO-VALORATIVO (opinión personal).
                3. **MINI-GLOSARIO:** 3 términos clave definidos de forma sencilla.
                
                Retorna JSON: { "materialesExpress": "Contenido completo en Markdown, estéticamente organizado para impresión." }`,
            );
            if (result.materialesExpress) update({ materialesExpress: result.materialesExpress });
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingIA(null);
        }
    };

    const handleExport = async () => {
        if (!local || !unidad || !planActivo || !perfil) return;
        setExporting(true);
        try {
            await exportarSesion(local, unidad, planActivo, perfil);
        } finally {
            setExporting(false);
        }
    };

    const handlePrint = () => {
        if (!local || !unidad || !planActivo || !perfil) return;
        printSesion(local, unidad, planActivo, perfil);
    };

    if (!local) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    const totalMin = (local.secuenciaDidactica?.inicio?.duracionMinutos || 0)
        + (local.secuenciaDidactica?.desarrollo?.duracionMinutos || 0)
        + (local.secuenciaDidactica?.cierre?.duracionMinutos || 0);

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-fade-in pb-48 px-4">
            {/* 1. CABECERA (HEADER) */}
            <ModuleHeader
                module={`S${local.orden}`}
                title={local.titulo || 'Sin título'}
                subtitle={`Sesión de Aprendizaje · ${unidad?.diagnosticoStep.titulo || 'Unidad'}`}
                syncStatus={isSyncing ? 'syncing' : 'synced'}
                className="bg-background py-4 md:py-6 border-b border-white/5 -mx-4 px-4"
                actions={[
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full">
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => navigate(-1)} 
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all shadow-lg"
                            >
                                <span className="material-icons-round text-lg">arrow_back</span>
                                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Volver</span>
                            </button>
                            <button 
                                onClick={() => navigate(`/sesiones/${sesionId}/preview`)}
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg"
                            >
                                <span className="material-icons-round text-sm">visibility</span>
                                <span className="hidden sm:inline">Vista previa</span>
                            </button>
                        </div>
                        
                        <TabSwitch 
                            options={STEPS}
                            value={activeStep}
                            onChange={setActiveStep}
                            variant="teal"
                            className="bg-black/40 border-white/10 flex-1 lg:flex-none"
                        />

                        <div className="flex items-center gap-2 lg:ml-auto">
                             <button 
                                onClick={handlePrint}
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-magenta/10 border border-brand-magenta/20 text-brand-magenta hover:bg-brand-magenta/20 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-magenta/5"
                            >
                                <span className="material-icons-round text-sm">picture_as_pdf</span>
                                <span className="hidden xl:inline">PDF Express</span>
                                <span className="xl:hidden">PDF</span>
                            </button>
                            <button 
                                 onClick={handleExport}
                                 disabled={exporting}
                                 className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary-teal/10 border border-primary-teal/20 text-primary-teal hover:bg-primary-teal/20 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-teal/5"
                            >
                                 {exporting ? <Spinner size="sm" /> : <span className="material-icons-round text-sm">description</span>}
                                 <span className="hidden xl:inline">{exporting ? 'Exportando...' : 'Descargar Word'}</span>
                                 <span className="xl:hidden">{exporting ? '...' : 'Word'}</span>
                            </button>
                        </div>
                    </div>
                ]}
            />

            <div className="space-y-10 min-h-[400px]">
                
                {/* 1. PASO: CONTEXTO */}
                {activeStep === 'contexto' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Section 
                            id="datos" 
                            title="I. Datos Informativos" 
                            icon="lock"
                            isOpen={openSections.datos || true} 
                            onToggle={() => toggleSection('datos')}
                            isInherited
                        >
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-t border-white/5">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Institución Educativa</label>
                                    <p className="text-xs text-gray-400 font-black">{perfil?.nombreIE || '---'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Grado / Área</label>
                                    <p className="text-xs text-gray-400 font-black">{planActivo?.grado} · {planActivo?.area}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Duración</label>
                                    <p className="text-xs text-gray-400 font-black">{totalMin} minutos</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nivel</label>
                                    <p className="text-xs text-gray-400 font-black">{perfil?.nivel || '---'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Docente</label>
                                    <p className="text-xs text-gray-400 font-black">{perfil?.nombreCompleto || '---'}</p>
                                </div>
                            </div>
                        </Section>

                        <Section 
                            id="unidad-info" 
                            title="II. Título de la Unidad" 
                            icon="lock"
                            isOpen={openSections.unidad || true} 
                            onToggle={() => toggleSection('unidad')}
                            isInherited
                        >
                            <div className="py-6 border-t border-white/5">
                                <p className="text-sm text-gray-400 font-black uppercase tracking-widest leading-relaxed">
                                    {unidad?.diagnosticoStep.titulo || 'Sin título de unidad'}
                                </p>
                            </div>
                        </Section>
                    </div>
                )}

                {/* 2. PASO: IDENTIDAD */}
                {activeStep === 'identidad' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* III. TÍTULO DE LA SESIÓN */}
                        <div className="space-y-6">
                            <header className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-teal/20 flex items-center justify-center text-primary-teal">
                                    <span className="material-icons-round text-xl">edit</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">III. Título de la Sesión</h3>
                                    <p className="text-[10px] text-gray-500 font-medium">Define un nombre que capte la curiosidad de tus estudiantes.</p>
                                </div>
                            </header>
                            <div className="relative group">
                                <textarea
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-3xl p-6 md:p-8 text-xl md:text-2xl font-black text-white outline-none focus:border-primary-teal/50 focus:bg-white/[0.05] transition-all placeholder-gray-800 shadow-2xl resize-none h-32 md:h-auto"
                                    value={local.titulo}
                                    onChange={e => update({ titulo: e.target.value })}
                                    placeholder="Escribe el título de la sesión aquí..."
                                />
                                <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <span className="material-icons-round text-primary-teal">auto_awesome</span>
                                </div>
                            </div>

                            <div className="bg-primary-teal/5 border border-primary-teal/10 rounded-2xl p-6 flex gap-4 items-start">
                                <span className="material-icons-round text-primary-teal/60">lightbulb</span>
                                <p className="text-xs text-primary-teal/80 leading-relaxed italic">
                                    <strong className="block mb-1 not-italic text-[10px] font-black uppercase tracking-widest">Tip TizaMágica:</strong>
                                    Un buen título de sesión suele plantear un reto o una pregunta. Ejemplo: "¿Cómo podemos salvar el río de nuestra comunidad?" en lugar de solo "El cuidado del agua".
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. PASO: PROPÓSITOS */}
                {activeStep === 'propositos' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* IV. PROPÓSITOS DE APRENDIZAJE */}
                        <div className="space-y-6">
                            <header className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-icons-round text-primary-teal text-xl">track_changes</span>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">IV. Propósitos de Aprendizaje</h3>
                                </div>
                                <AIButton
                                    variant="magenta"
                                    isLoading={loadingIA === 'propositos'}
                                    onClick={handleSugerirPropositos}
                                    tooltip="Sugerir competencia y desempeños con IA"
                                    size="sm"
                                />
                            </header>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Tarjeta 1 – Competencia */}
                                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-3">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Competencia</p>
                                    <textarea 
                                        className="w-full bg-transparent border-none p-0 text-xs font-black text-white uppercase leading-tight resize-none h-12 focus:ring-0"
                                        value={local.competenciaId}
                                        onChange={e => update({ competenciaId: e.target.value })}
                                        placeholder="Competencia a desarrollar..."
                                    />
                                </div>
                                {/* Tarjeta 2 – Capacidades */}
                                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-3">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Capacidades</p>
                                    <textarea 
                                        className="w-full bg-transparent border-none p-0 text-xs text-gray-300 resize-none h-16 focus:ring-0"
                                        value={local.capacidadId}
                                        onChange={e => update({ capacidadId: e.target.value })}
                                        placeholder="Capacidades vinculadas..."
                                    />
                                </div>
                                {/* Tarjeta 3 – Desempeño precisado */}
                                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-3">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Desempeño Precisado</p>
                                    <textarea 
                                        className="w-full bg-transparent border-none p-0 text-xs text-gray-300 resize-none h-16 focus:ring-0"
                                        value={local.desempenoPrecisado}
                                        onChange={e => update({ desempenoPrecisado: e.target.value })}
                                        placeholder="Detalle del desempeño..."
                                    />
                                </div>
                            </div>

                            {/* IV-A. Objetivo específico */}
                            <div className="bg-primary-teal/5 border border-primary-teal/10 rounded-[2.5rem] p-8 space-y-4">
                                <div>
                                    <h4 className="text-[10px] font-black text-primary-teal uppercase tracking-widest mb-1">IV-A. Objetivo específico (operacional)</h4>
                                    <p className="text-[11px] text-primary-teal/60 font-medium italic">¿Qué producto concreto generarán hoy?</p>
                                </div>
                                <textarea
                                    className="w-full bg-transparent border-none p-0 text-lg font-black text-white outline-none focus:ring-0 placeholder-primary-teal/20"
                                    placeholder="Define el propósito tangible de esta sesión..."
                                    value={local.objetivoEspecifico || local.proposito}
                                    onChange={e => update({ objetivoEspecifico: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Producto / Evidencia</label>
                                    <textarea
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-xs text-gray-300 focus:border-white/20 transition-all outline-none h-24"
                                        value={local.evidencia}
                                        onChange={e => update({ evidencia: e.target.value })}
                                        placeholder="Producto de la sesión..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Instrumento</label>
                                    <select 
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-xs text-white focus:border-white/20 transition-all outline-none"
                                        value={local.instrumento}
                                        onChange={e => update({ instrumento: e.target.value as TipoInstrumento })}
                                    >
                                        {INSTRUMENTOS.map(i => <option key={i} value={i} className="bg-surface-card">{i}</option>)}
                                    </select>
                                    <div className="mt-2 text-[10px] text-gray-600 italic px-2">
                                        Define la herramienta con la que evaluarás el desempeño.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* V. ENFOQUES TRANSVERSALES */}
                        <div className="space-y-6">
                            <header className="flex items-center gap-3">
                                <span className="material-icons-round text-primary-teal text-xl">psychology</span>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">V. Enfoques Transversales</h3>
                            </header>
                            
                            <div className="bg-white/[0.01] border border-white/5 rounded-[2rem] overflow-hidden">
                                {(local.enfoquesTransversalesSesion || []).length === 0 ? (
                                    <div className="p-8 text-center">
                                        <p className="text-xs text-gray-400 italic">No hay enfoques específicos definidos. Se heredan de la Unidad.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {(local.enfoquesTransversalesSesion || []).map((enf, i) => (
                                            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 hover:bg-white/[0.01] transition-colors">
                                                <div>
                                                    <p className="text-[9px] font-black text-primary-teal uppercase tracking-widest mb-1">Enfoque</p>
                                                    <p className="text-xs font-black text-white uppercase">{enf.nombre}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Valor</p>
                                                    <input 
                                                        className="w-full bg-transparent border-none p-0 text-xs text-gray-300 focus:ring-0"
                                                        value={enf.valor} 
                                                        onChange={e => {
                                                            const newEnf = [...local.enfoquesTransversalesSesion];
                                                            newEnf[i].valor = e.target.value;
                                                            update({ enfoquesTransversalesSesion: newEnf });
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Actitud observable</p>
                                                    <textarea 
                                                        className="w-full bg-transparent border-none p-0 text-xs text-gray-400 focus:ring-0 resize-none h-12"
                                                        value={enf.actitud}
                                                        onChange={e => {
                                                            const newEnf = [...local.enfoquesTransversalesSesion];
                                                            newEnf[i].actitud = e.target.value;
                                                            update({ enfoquesTransversalesSesion: newEnf });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. PASO: SECUENCIA */}
                {activeStep === 'secuencia' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-icons-round text-primary-teal text-xl">reorder</span>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">VI. Secuencia Didáctica</h3>
                                </div>
                                <AIButton
                                    variant="magenta"
                                    isLoading={loadingIA === 'secuencia'}
                                    onClick={handleGenerarSecuencia}
                                    tooltip="Regenerar secuencia con IA"
                                    size="sm"
                                />
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className={cn(
                                    "flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-500",
                                    totalMin > 90 
                                        ? "bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse" 
                                        : totalMin === 90
                                            ? "bg-primary-teal/20 border-primary-teal text-primary-teal shadow-[0_0_15px_rgba(45,170,170,0.2)]"
                                            : "bg-brand-magenta/10 border-brand-magenta/20 text-brand-magenta"
                                )}>
                                    <span className="material-icons-round text-sm">
                                        {totalMin > 90 ? 'warning' : totalMin === 90 ? 'check_circle' : 'schedule'}
                                    </span>
                                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                                        {totalMin} / 90 MIN
                                    </span>
                                </div>
                                {totalMin > 90 && (
                                    <span className="text-[8px] font-black text-red-400 uppercase tracking-tighter animate-bounce mr-2">
                                        ⚠️ Exceso de {totalMin - 90} min — Sugerencia: Recortar Desarrollo
                                    </span>
                                )}
                            </div>
                        </header>

                        <div className="space-y-6">
                            <div className="flex justify-end pr-2 hidden">
                                {/* AIButton moved to title */}
                            </div>

                            {(['inicio', 'desarrollo', 'cierre'] as const).map(momento => {
                                const meta = MOMENTO_LABELS[momento];
                                const data = local.secuenciaDidactica?.[momento] || { descripcion: '', duracionMinutos: 0, estrategiaMetodologica: '', recursosMateriales: '' };
                                
                                return (
                                    <div key={momento} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-8 hover:border-white/10 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className={cn("flex items-center gap-3", meta.color)}>
                                                <span className="material-icons-round">{meta.icon}</span>
                                                <h4 className="text-sm font-black uppercase tracking-widest">{momento}</h4>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Duración</label>
                                                <input 
                                                    type="number" 
                                                    className="w-16 bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-center text-xs text-white font-black outline-none focus:border-primary-teal"
                                                    value={data.duracionMinutos} 
                                                    onChange={e => updateMomento(momento, 'duracionMinutos', parseInt(e.target.value) || 0)}
                                                />
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">min</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-10">
                                            <div className="md:col-span-2 lg:col-span-12 space-y-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Descripción Pedagógica</label>
                                                <div className="relative group">
                                                    <textarea
                                                        className="w-full bg-transparent border-b border-white/10 p-2 text-sm text-gray-300 focus:border-primary-teal transition-all outline-none resize-none min-h-[100px]"
                                                        value={data.descripcion}
                                                        onChange={e => updateMomento(momento, 'descripcion', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="md:col-span-1 lg:col-span-6 space-y-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Estrategia Metodológica</label>
                                                <textarea
                                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-xs text-gray-400 focus:border-white/20 transition-all outline-none h-28"
                                                    value={data.estrategiaMetodologica}
                                                    onChange={e => updateMomento(momento, 'estrategiaMetodologica', e.target.value)}
                                                    placeholder="¿Cómo enseñarás en este momento?"
                                                />
                                            </div>
                                            <div className="md:col-span-1 lg:col-span-6 space-y-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Recursos y Materiales</label>
                                                <textarea
                                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-xs text-gray-400 focus:border-white/20 transition-all outline-none h-28"
                                                    value={data.recursosMateriales}
                                                    onChange={e => updateMomento(momento, 'recursosMateriales', e.target.value)}
                                                    placeholder="¿Qué materiales usarás?"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 5. PASO: EVALUACIÓN */}
                {activeStep === 'evaluacion' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-icons-round text-primary-teal text-xl">fact_check</span>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">VII. Evaluación y Criterios</h3>
                                </div>
                                <AIButton
                                    variant="magenta"
                                    isLoading={loadingIA === 'instrumento'}
                                    onClick={handleGenerarInstrumento}
                                    tooltip="Generar rúbrica/instrumento con IA"
                                    size="sm"
                                />
                            </div>
                        </header>

                        <div className="space-y-4">
                            {/* MÓDULO — Diagnóstico Integral */}
                            <Section 
                                id="mod-diag" 
                                title="MÓDULO — Diagnóstico Integral" 
                                icon="diversity_3"
                                isOpen={openSections.modDiag || true} 
                                onToggle={() => toggleSection('modDiag')}
                            >
                                <div className="space-y-8 py-8 border-t border-white/5">
                                    <div className="space-y-4">
                                        <h5 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary-teal"></span>
                                            Contexto del estudiante
                                        </h5>
                                        <p className="text-xs text-gray-400 leading-relaxed pl-4">
                                            {planActivo?.diagnostico?.estilos?.diagnosticoSociolinguistico || 'No definido en M01.'}
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <h5 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary-teal"></span>
                                            Características del grupo
                                        </h5>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Cognitivo</p>
                                                <p className="text-[10px] text-gray-400">{planActivo?.diagnostico?.caracteristicas?.cognitivo?.texto || '---'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Físico</p>
                                                <p className="text-[10px] text-gray-400">{planActivo?.diagnostico?.caracteristicas?.fisico?.texto || '---'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Emocional</p>
                                                <p className="text-[10px] text-gray-400">{planActivo?.diagnostico?.caracteristicas?.emocional?.texto || '---'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h5 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary-teal"></span>
                                            Estilos de aprendizaje / EIB
                                        </h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Estilos predominantes</p>
                                                <p className="text-[10px] text-gray-400">{planActivo?.diagnostico?.estilos?.estrategias || '---'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Variable EIB / Escenario</p>
                                                <p className="text-[10px] text-gray-400">{planActivo?.diagnostico?.estilos?.escenarioEIB || '---'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Section>

                            {/* MÓDULO — Criterios de Evaluación */}
                            <Section 
                                id="mod-crit" 
                                title="MÓDULO — Criterios de Evaluación" 
                                icon="checklist"
                                isOpen={openSections.modCrit || true} 
                                onToggle={() => toggleSection('modCrit')}
                            >
                                <div className="space-y-6 py-8 border-t border-white/5">
                                    <div className="grid grid-cols-1 gap-4">
                                        {(local.criteriosEvaluacionSesion || []).map((crit, i) => (
                                            <div key={crit.id || i} className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-5 h-5 rounded-full bg-primary-teal/10 flex items-center justify-center text-[10px] font-bold text-primary-teal">{i + 1}</span>
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Criterio Técnico</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => update({ criteriosEvaluacionSesion: local.criteriosEvaluacionSesion.filter((_, idx) => idx !== i) })}
                                                        className="text-gray-700 hover:text-red-400 transition-colors"
                                                    >
                                                        <span className="material-icons-round text-lg">close</span>
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Criterio</label>
                                                        <textarea 
                                                            className="w-full bg-transparent border-none p-0 text-xs text-gray-300 focus:ring-0 resize-none h-16"
                                                            value={crit.criterio}
                                                            onChange={e => {
                                                                const n = [...local.criteriosEvaluacionSesion];
                                                                n[i].criterio = e.target.value;
                                                                update({ criteriosEvaluacionSesion: n });
                                                            }}
                                                            placeholder="¿Qué se evaluará?"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Evidencia</label>
                                                        <textarea 
                                                            className="w-full bg-transparent border-none p-0 text-xs text-gray-300 focus:ring-0 resize-none h-16"
                                                            value={crit.evidencia}
                                                            onChange={e => {
                                                                const n = [...local.criteriosEvaluacionSesion];
                                                                n[i].evidencia = e.target.value;
                                                                update({ criteriosEvaluacionSesion: n });
                                                            }}
                                                            placeholder="¿Qué entregará el estudiante?"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        className="w-full py-4 bg-white/5 border border-dashed border-white/10 rounded-2xl text-[10px] font-black text-gray-500 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                                        onClick={() => update({ 
                                            criteriosEvaluacionSesion: [
                                                ...(local.criteriosEvaluacionSesion || []), 
                                                { id: crypto.randomUUID(), competencia: local.competenciaId || '', criterio: '', evidencia: '', instrumento: local.instrumento }
                                            ] 
                                        })}
                                    >
                                        + Añadir nuevo criterio estratégico
                                    </button>
                                </div>
                            </Section>

                            {/* MÓDULO — Indicador y Logro */}
                            <Section 
                                id="mod-ind" 
                                title="MÓDULO — Indicador y Logro" 
                                icon="stars"
                                isOpen={openSections.modInd || true} 
                                onToggle={() => toggleSection('modInd')}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-t border-white/5">
                                    <div className="space-y-3">
                                        <h5 className="text-[10px] font-black text-primary-teal uppercase tracking-widest">Indicador observable</h5>
                                        <textarea 
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-xs text-gray-300 focus:border-primary-teal/30 focus:bg-primary-teal/[0.02] outline-none transition-all h-28"
                                            value={local.indicadorObservable}
                                            onChange={e => update({ indicadorObservable: e.target.value })}
                                            placeholder="¿Qué acción específica verás?"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <h5 className="text-[10px] font-black text-primary-teal uppercase tracking-widest">Criterio de logro</h5>
                                        <textarea 
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-xs text-gray-300 focus:border-primary-teal/30 focus:bg-primary-teal/[0.02] outline-none transition-all h-28"
                                            value={local.criterioLogro}
                                            onChange={e => update({ criterioLogro: e.target.value })}
                                            placeholder="¿Cuándo se considera que logró el objetivo?"
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* MÓDULO — Instrumento Detallado */}
                            <Section 
                                id="mod-inst" 
                                title={`MÓDULO — ${local.instrumento} Detallada`} 
                                icon="description"
                                isOpen={openSections.modInst || !!local.instrumentoContenido} 
                                onToggle={() => toggleSection('modInst')}
                            >
                                <div className="space-y-6 py-8 border-t border-white/5">
                                    <div className="flex items-center justify-between px-2">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Contenido del instrumento</p>
                                        <AIButton
                                            variant="magenta"
                                            isLoading={loadingIA === 'instrumento'}
                                            onClick={handleGenerarInstrumento}
                                            tooltip="Generar/Actualizar instrumento con IA"
                                            size="sm"
                                        />
                                    </div>
                                    <textarea 
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-xs text-gray-300 font-mono focus:border-primary-teal/30 outline-none transition-all h-96"
                                        value={local.instrumentoContenido}
                                        onChange={e => update({ instrumentoContenido: e.target.value })}
                                        placeholder="El contenido del instrumento aparecerá aquí..."
                                    />
                                </div>
                            </Section>
                        </div>
                    </div>
                )}

                {/* 6. PASO: GUION DOCENTE */}
                {activeStep === 'guion' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-brand-magenta/10 flex items-center justify-center border border-brand-magenta/20 text-brand-magenta">
                                    <span className="material-icons-round text-xl">record_voice_over</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Guion Docente y Mediación</h3>
                                    <p className="text-[10px] text-gray-500">Diálogos sugeridos y preguntas clave para potenciar el conflicto cognitivo.</p>
                                </div>
                            </div>
                            <AIButton
                                variant="magenta"
                                isLoading={loadingIA === 'guion'}
                                onClick={handleGenerarGuion}
                                tooltip="Generar guion mediador con IA"
                                size="sm"
                            />
                        </header>

                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
                            <textarea 
                                className="w-full bg-transparent border-none p-10 text-sm text-gray-300 leading-relaxed min-h-[600px] focus:ring-0 outline-none custom-scrollbar"
                                value={local.guionDocente || ''}
                                onChange={e => update({ guionDocente: e.target.value })}
                                placeholder="Presiona el botón de IA para generar un guion con diálogos sugeridos y preguntas mediadoras..."
                            />
                        </div>
                    </div>
                )}

                {/* 7. PASO: MATERIALES EXPRESS */}
                {activeStep === 'materiales' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-primary-teal/10 flex items-center justify-center border border-primary-teal/20 text-primary-teal">
                                    <span className="material-icons-round text-xl">auto_stories</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Materiales Express</h3>
                                    <p className="text-[10px] text-gray-500">Lecturas y comprensión inmediata para el aula.</p>
                                </div>
                            </div>
                            <AIButton
                                variant="magenta"
                                isLoading={loadingIA === 'materiales'}
                                onClick={handleGenerarMateriales}
                                tooltip="Generar lectura y preguntas con IA"
                                size="sm"
                            />
                        </header>

                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
                            <textarea 
                                className="w-full bg-transparent border-none p-10 text-sm text-gray-300 leading-relaxed min-h-[600px] focus:ring-0 outline-none custom-scrollbar"
                                value={local.materialesExpress || ''}
                                onChange={e => update({ materialesExpress: e.target.value })}
                                placeholder="Genera lecturas y actividades de comprensión con un clic..."
                            />
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

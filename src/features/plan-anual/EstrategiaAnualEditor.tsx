import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { usePlanAnualStore, useAIConfigStore, usePerfilStore, useNotificationStore, useUnidadesStore } from '@/store';
import { cn } from '@/lib/cn';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { cnebService } from '@/services/cneb';
import { ENFOQUES_TRANSVERSALES } from '@/services/cneb/enfoques-transversales';
import {
    TOTAL_PERIODS,
    getAllPeriodoNombres,
} from '@/services/cneb/calendario-2026';
import { AIButton } from '@/components/ui/AIButton';
import { Chip } from '@/components/ui/Chip';
import type { UnidadResumen, TipoUnidad, CNEBCompetencia } from '@/types/schemas';
import { chatCompletion } from '@/services/ai';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Genera un slug id para comparar con la matriz (debe coincidir con matrixIdComp de PropositosEditor) */
function slugId(name: string): string {
    return `comp_${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').slice(0, 40)}`;
}

/** Obtiene enfoques seleccionados para una unidad dada */
function getEnfoquesSeleccionadosPorUnidad(
    unitIdx: number,
    matrix: Record<string, boolean[]>,
): { enfoqueId: string; nombre: string }[] {
    const result: { enfoqueId: string; nombre: string }[] = [];

    for (const enfoque of ENFOQUES_TRANSVERSALES) {
        // Check if the enfoque parent is checked for this unit
        const parentChecked = matrix[enfoque.id]?.[unitIdx];

        // Or if any valor of the enfoque is checked
        const anyValorChecked = enfoque.valores.some(
            (v) => matrix[`${enfoque.id}_val_${v.id}`]?.[unitIdx],
        );

        if (parentChecked || anyValorChecked) {
            result.push({ enfoqueId: enfoque.id, nombre: enfoque.nombre });
        }
    }
    return result;
}

/** Obtiene competencias seleccionadas por unidad */
function getCompetenciasSeleccionadasPorUnidad(
    unitIdx: number,
    matrix: Record<string, boolean[]>,
    areaComps: CNEBCompetencia[],
    transComps: CNEBCompetencia[]
): { id: string; nombre: string; esTransversal: boolean }[] {
    const result: { id: string; nombre: string; esTransversal: boolean }[] = [];

    areaComps.forEach(comp => {
        const compSlugId = slugId(comp.nombre);
        if (matrix[compSlugId]?.[unitIdx]) {
            result.push({
                id: compSlugId,
                nombre: comp.nombre,
                esTransversal: false
            });
        }
    });

    transComps.forEach(comp => {
        const compSlugId = slugId(comp.nombre);
        if (matrix[compSlugId]?.[unitIdx]) {
            result.push({
                id: compSlugId,
                nombre: comp.nombre,
                esTransversal: true
            });
        }
    });

    return result;
}

/** Rota tipo de unidad */
function rotateTipo(current: TipoUnidad): TipoUnidad {
    const cycle: TipoUnidad[] = ['Unidad', 'Proyecto', 'Modulo'];
    return cycle[(cycle.indexOf(current) + 1) % 3];
}

// ─── Component ────────────────────────────────────────────────────────────────

export const EstrategiaAnualEditor: React.FC = () => {
    const { planActivo, updatePlan, isSyncing } = usePlanAnualStore();
    const { perfil } = usePerfilStore();
    const { aiConfig, getDecryptedApiKey } = useAIConfigStore();
    const { showNotification } = useNotificationStore();
    const { unidades: fullUnidades, updateUnidad: updateFullUnidad } = useUnidadesStore();

    const [unidades, setUnidades] = useState<UnidadResumen[]>(planActivo?.unidades || []);
    const [ejeArticulador, setEjeArticulador] = useState(planActivo?.ejeArticulador || '');
    const [cnebComps, setCnebComps] = useState<CNEBCompetencia[]>([]);
    const [transComps, setTransComps] = useState<CNEBCompetencia[]>([]);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [activeTab] = useState<'estrategia'>('estrategia');

    const periodoTipo = planActivo?.periodoTipo || 'Bimestre';
    const matrix = planActivo?.matrizCompetencias || {};
    const totalPeriods = TOTAL_PERIODS[periodoTipo];
    const periodNombres = getAllPeriodoNombres(periodoTipo);

    // Sync from plan
    useEffect(() => {
        if (!planActivo) return;
        setUnidades(planActivo.unidades || []);
        setEjeArticulador(planActivo.ejeArticulador || '');
    }, [planActivo?.id, JSON.stringify(planActivo?.unidades)]);

    // Load CNEB
    useEffect(() => {
        const load = async () => {
            if (!planActivo) return;
            const [areaData, transData] = await Promise.all([
                cnebService.getCompetenciasByAreaNivel(planActivo.area, planActivo.nivel),
                cnebService.getCompetenciasByAreaNivel('Competencias Transversales', planActivo.nivel),
            ]);
            setCnebComps(areaData);
            setTransComps(transData);
        };
        load();
    }, [planActivo?.area, planActivo?.nivel]);

    // ─── Auto-save ──────────────────────────────────────────────────────
    const saveTimeout = React.useRef<ReturnType<typeof setTimeout>>();
    const autoSave = useCallback(
        (updated: UnidadResumen[], newEje?: string) => {
            if (!planActivo) return;
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
            saveTimeout.current = setTimeout(() => {
                updatePlan(planActivo.id, { 
                    unidades: updated,
                    ejeArticulador: newEje !== undefined ? newEje : ejeArticulador
                });

                // Sincronización PROFUNDA hacia Unidades (Mediano Plazo)
                updated.forEach((uSummary, idx) => {
                    const numero = idx + 1;
                    const fullUnit = fullUnidades.find(fu => fu.numero === numero);
                    if (fullUnit) {
                        const hasChanges =
                            fullUnit.diagnosticoStep.situacionSignificativa !== uSummary.situacionSignificativa ||
                            fullUnit.diagnosticoStep.titulo !== uSummary.titulo ||
                            fullUnit.diagnosticoStep.productoTentativo !== uSummary.producto;

                        if (hasChanges) {
                            updateFullUnidad(fullUnit.id, {
                                diagnosticoStep: {
                                    ...fullUnit.diagnosticoStep,
                                    titulo: uSummary.titulo,
                                    situacionSignificativa: uSummary.situacionSignificativa,
                                    productoTentativo: uSummary.producto
                                }
                            });
                        }
                    }
                });
            }, 800);
        },
        [planActivo, updatePlan, fullUnidades, updateFullUnidad],
    );

    useEffect(() => {
        if (!planActivo) return;
        setUnidades(planActivo.unidades || []);
    }, [planActivo?.id, planActivo?.unidades]);

    // ─── Unidad CRUD ────────────────────────────────────────────────────
    const updateUnidad = (idx: number, updates: Partial<UnidadResumen>) => {
        const next = [...unidades];
        next[idx] = { ...next[idx], ...updates };
        setUnidades(next);
        autoSave(next);
    };

    const addUnidad = (bimestre: number) => {
        const newUnit: UnidadResumen = {
            id: crypto.randomUUID(),
            titulo: `Nueva unidad`,
            tematica: '',
            tipo: 'Unidad',
            bimestre,
            situacionSignificativa: '',
            producto: '',
            fecha: '2026-03-02|2026-04-03',
        };
        const next = [...unidades, newUnit];
        setUnidades(next);
        autoSave(next);
    };

    const deleteUnidad = (idx: number) => {
        const next = (unidades || []).filter((_, i) => i !== idx);
        setUnidades(next);
        autoSave(next);
    };

    // ─── Date Change ────────────────────────────────────────────────────
    const handleDateChange = (idx: number, which: 'start' | 'end', date: string) => {
        const [start, end] = unidades[idx].fecha.split('|');
        const newFecha = which === 'start' ? `${date}|${end}` : `${start}|${date}`;
        updateUnidad(idx, { fecha: newFecha });
    };

    // ─── AI: Generar TODAS las Situaciones (Maestro) ────────────────────────
    const [loadingTodas, setLoadingTodas] = useState(false);

    const handleGenerarTodasSituaciones = async () => {
        if (!planActivo || !perfil) return;

        // Validar campos obligatorios
        const incompletas = (unidades || []).filter(u => !u.tematica || !u.producto);
        if (incompletas.length > 0) {
            showNotification({
                title: 'Campos Requeridos',
                message: "Para generar las situaciones, primero escribe la 'Temática' y el 'Producto' en cada unidad. ¡Usa la bombilla para inspirarte!",
                type: 'warning'
            });
            return;
        }

        setLoadingTodas(true);
        try {
            // Extracción segura de diagnóstico con fallbacks
            const cognitivo = planActivo.diagnostico?.caracteristicas?.cognitivo;
            const estilos = planActivo.diagnostico?.estilos;
            const identidad = planActivo.identidad?.descripcionArea || 'No definida';

            const contextoDiagnostico = `
DIAGNÓSTICO DEL GRUPO (M01):
- Cognitivo: Nivel ${cognitivo?.nivel || 'No definido'}/5 (${cognitivo?.texto || 'Sin descripción'})
- Estilos/Intereses: ${estilos?.intereses?.join(', ') || 'No definidos'}

IDENTIDAD Y ENFOQUE DEL ÁREA (M02):
${identidad}
`;

            const eventosCalendario = planActivo.calendarioComunalData?.events
                ?.filter(e => !e.needsReview)
                .map(e => `- ${e.title} (${e.date || e.startDate})`)
                .join('\n') || 'Sin eventos específicos.';

            const unidadesData = unidades.map((u, i) => {
                const enfoques = getEnfoquesSeleccionadosPorUnidad(i, matrix);
                const comps = getCompetenciasSeleccionadasPorUnidad(i, matrix, cnebComps, transComps);
                return {
                    id: u.id,
                    orden: i + 1,
                    tituloActual: u.titulo,
                    tematica: u.tematica,
                    producto: u.producto,
                    competencias: comps.map(c => c.nombre),
                    enfoques: enfoques.map(e => e.nombre)
                };
            });

            const prompt = `Actúa como un Especialista en Currículo del MINEDU (Perú).
OBJETIVO: Redactar las Situaciones Significativas de TODAS las unidades del año en una sola ejecución.

CONTEXTO INSTITUCIONAL:
- IE: ${perfil.nombreIE} | Área: ${planActivo.area} | Grado: ${planActivo.grado}
- Calendario Comunal: ${planActivo.calendarioComunal}
- Eventos: ${eventosCalendario}
${contextoDiagnostico}

DATOS DE LAS UNIDADES A PROCESAR:
${JSON.stringify(unidadesData, null, 2)}

INSTRUCCIONES DE REDACCIÓN (ESTILO MINEDU):
1. Estructura Obligatoria: Cada Situación debe tener Contexto/Escenario, Problema/Desafío, Reto (pregunta) y Producto.
2. Formato: Redacta en un SOLO párrafo por unidad, en tercera persona, lenguaje claro y pedagógico.
3. Coherencia: Conecta la temática central con una necesidad real del entorno y las competencias del área.
4. Extensión: Entre 120 y 180 palabras por situación.
5. Título de la Unidad: Redacta en primera persona del plural (nosotros). Usa la estructura "Verbo de acción + propósito/contenido + producto/finalidad" (Ej: "Investigamos problemáticas locales para elaborar una campaña"). Extensión de 10 a 18 palabras. NO uses títulos genéricos.

FORMATO DE SALIDA (JSON ESTRICTO):
{
  "respuestas": [
    {
      "id": "id-de-la-unidad",
      "nuevoTitulo": "...",
      "situacion": "..."
    }
  ]
}`;

            const apiKey = await getDecryptedApiKey();
            const result = await chatCompletion(
                "Eres un experto en el CNEB. Generas situaciones significativas de alta calidad pedagógica. Responde ÚNICAMENTE el JSON.",
                prompt,
                {
                    apiKey,
                    provider: aiConfig.provider,
                    customUrl: aiConfig.lmstudioUrl,
                    model: aiConfig.activeModel,
                    responseFormat: 'json',
                    temperature: 0.2,
                    maxTokens: 8192 // Aumentado para soportar respuestas largas de todo el año
                }
            );

            // Recuperación de JSON robusta
            let data: any = result;
            if (typeof result === 'string') {
                const jsonMatch = result.match(/\{[\s\S]*\}/);
                const cleaned = jsonMatch ? jsonMatch[0] : result;
                try {
                    data = JSON.parse(cleaned);
                } catch (e) {
                    try {
                        // Fallback: Si hay caracteres de control (como saltos de línea reales), 
                        // intentamos parsear una versión minificada.
                        const minified = cleaned.replace(/[\n\r]/g, ' ');
                        data = JSON.parse(minified);
                    } catch (e2) {
                        console.error("Error crítico parseando respuesta de IA:", result);
                        const snippet = result.substring(0, 100).replace(/\n/g, ' ') + '...';
                        throw new Error(`La IA devolvió un texto no válido (${snippet}). Intenta de nuevo.`);
                    }
                }
            }

            if (data?.respuestas && Array.isArray(data.respuestas)) {
                const next = unidades.map(u => {
                    const res = data.respuestas.find((r: any) => r.id === u.id);
                    if (res) {
                        return {
                            ...u,
                            situacionSignificativa: res.situacion || u.situacionSignificativa,
                            titulo: res.nuevoTitulo || u.titulo
                        };
                    }
                    return u;
                });
                setUnidades(next);
                autoSave(next);
                showNotification({
                    title: '¡Generación Exitosa!',
                    message: `Se han redactado ${next.length} situaciones significativas conectadas con tu diagnóstico.`,
                    type: 'success'
                });
            } else {
                throw new Error("La IA no generó el formato esperado de unidades.");
            }
        } catch (err: any) {
            console.error('Error Generador Maestro:', err);
            showNotification({
                title: 'Error de Generación',
                message: err.message || 'La IA tuvo un problema redactando. Intenta de nuevo.',
                type: 'error'
            });
        } finally {
            setLoadingTodas(false);
        }
    };

    // ─── AI: Bombilla de Inspiración ───────────────────────────────
    const [loadingIdeas, setLoadingIdeas] = useState<number | null>(null);
    const [sugerenciasUnit, setSugerenciasUnit] = useState<Record<number, { titulo: string; tematica: string; producto: string }[]>>({});

    const handleSugerirIdeasUnitAI = async (idx: number) => {
        if (!planActivo || !perfil) return;
        setLoadingIdeas(idx);
        try {
            const comps = getCompetenciasSeleccionadasPorUnidad(idx, matrix, cnebComps, transComps);
            const enfoque = getEnfoquesSeleccionadosPorUnidad(idx, matrix)[0]?.nombre || 'General';

            const prompt = `Actúa profesionalmente como experto en ${planActivo.area}.
Sugiere 3 OPCIONES CREATIVAS para la UNIDAD ${idx + 1}.

MIS DATOS:
- Área: ${planActivo.area} | Grado: ${planActivo.grado}
- Competencias: ${comps.map(c => c.nombre).join(', ')}
- Enfoque: ${enfoque}
- Calendario: ${planActivo.calendarioComunal}

REGLAS:
1. Título: En 1ra persona plural (Nosotros), creativo y pedagógico.
2. Temática: Contenido técnico del área para este grado.
3. Producto: Algo tangible y evaluable.

Responde SOLO JSON PURE:
{
  "ideas": [
    { "titulo": "...", "tematica": "...", "producto": "..." }
  ]
}
`;

            const apiKey = await getDecryptedApiKey();
            const result = await chatCompletion(
                "Asistente de diseño pedagógico creativo. Sugerencias pertinentes y directas.",
                prompt,
                {
                    apiKey,
                    provider: aiConfig.provider,
                    customUrl: aiConfig.lmstudioUrl,
                    model: aiConfig.activeModel,
                    responseFormat: 'json',
                    temperature: 0.3,
                    maxTokens: 1000
                }
            );

            let data: any = result;
            if (typeof result === 'string') {
                const cleaned = result.replace(/```json|```/g, '').trim();
                data = JSON.parse(cleaned);
            }

            if (data?.ideas) {
                setSugerenciasUnit(prev => ({ ...prev, [idx]: data.ideas }));
            }
        } catch (err: any) {
            console.error('Error Ideas AI:', err);
        } finally {
            setLoadingIdeas(null);
        }
    };
    // Se eliminó el botón individual para centralizar en el Generador Maestro.

    // ─── Group units by bimestre ──────────────────────────────────────────
    const groupedUnits = useMemo(() => {
        const groups: { periodIdx: number; nombre: string; units: { unit: UnidadResumen; globalIdx: number }[] }[] = [];
        for (let p = 0; p < totalPeriods; p++) {
            groups.push({
                periodIdx: p + 1,
                nombre: periodNombres[p] as string,
                units: [],
            });
        }
        unidades.forEach((unit, globalIdx) => {
            const pIdx = unit.bimestre - 1;
            if (pIdx >= 0 && pIdx < totalPeriods) {
                groups[pIdx].units.push({ unit, globalIdx });
            }
        });
        return groups;
    }, [unidades, totalPeriods, periodNombres]);

    if (!planActivo) {
        return <div className="text-white p-10 font-black">SELECCIONA UN PLAN PRIMERO</div>;
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-fade-in pb-48">
            <ModuleHeader
                module="M04"
                title="Estrategia Anual"
                subtitle={`Organización de unidades y situaciones significativas por ${periodoTipo.toLowerCase()}.`}
                syncStatus={isSyncing ? 'syncing' : 'synced'}
                actions={[
                    <AIButton
                        variant="magenta"
                        isLoading={loadingTodas}
                        onClick={handleGenerarTodasSituaciones}
                        tooltip="Ejecución maestra: Genera todas las unidades en un solo paso ahorrando créditos."
                    />
                ]}
            />

            {/* Hilo Conductor del Año (Tarea 3.4) */}
            <div className="animate-fade-in">
                <div className="bg-surface-card/30 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 select-none pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                        <span className="material-icons-round text-8xl">hub</span>
                    </div>

                    <div className="relative flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-brand-magenta/10 flex items-center justify-center">
                                    <span className="material-icons-round text-brand-magenta">route</span>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-brand-magenta uppercase tracking-[.25em]">Hilo Conductor del Año</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">
                                        Eje Articulador que da sentido a la programación anual
                                    </p>
                                </div>
                            </div>
                            
                            <div className="relative">
                                <textarea
                                    value={ejeArticulador}
                                    onChange={(e) => {
                                        setEjeArticulador(e.target.value);
                                        autoSave(unidades, e.target.value);
                                    }}
                                    placeholder="Define la gran temática o problemática que unirá todas tus unidades (ej: 'Cuidado del planeta', 'Identidad Local', 'Innovación Tecnológica')..."
                                    className="w-full bg-surface-card/50 border border-white/5 rounded-2xl p-6 text-sm text-white placeholder:text-gray-700 min-h-[100px] focus:outline-none focus:border-brand-magenta/30 focus:ring-1 focus:ring-brand-magenta/20 transition-all resize-none italic font-medium leading-relaxed"
                                />
                                <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-brand-magenta/20 text-brand-magenta rounded-full text-[8px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                    Impacto Curricular Global
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-64 flex flex-col items-center gap-4 text-center p-6 bg-white/5 rounded-3xl border border-white/5">
                            <span className="material-icons-round text-brand-magenta text-3xl animate-pulse">psychology</span>
                            <p className="text-[9px] text-gray-400 font-medium leading-relaxed">
                                Este eje orientará la generación de tus <span className="text-white font-bold">Situaciones Significativas</span> para asegurar coherencia pedagógica anual.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simple View Header */}
            <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black text-primary-teal bg-primary-teal/10 px-3 py-1 rounded-full uppercase tracking-wider">
                    4.1 Organización Anual
                </span>
            </div>


            {activeTab === 'estrategia' && (
                <div className="space-y-8 animate-fade-in">
                    {/* Period Groups */}
                    {groupedUnits.map((group) => (
                        <section key={group.periodIdx} className="space-y-4">
                            {/* Period Header */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-primary-teal/10 flex items-center justify-center">
                                        <span className="material-icons-round text-primary-teal text-lg">date_range</span>
                                    </div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-[.25em]">{group.nombre}</h3>
                                </div>
                                <div className="flex-1 h-px bg-gradient-to-r from-primary-teal/20 to-transparent" />
                                <button
                                    onClick={() => addUnidad(group.periodIdx)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 hover:text-primary-teal hover:border-primary-teal/30 transition-all uppercase tracking-wider"
                                >
                                    <span className="material-icons-round text-sm">add</span>
                                    Agregar Unidad
                                </button>
                            </div>

                            {/* Unit Cards */}
                            {group.units.length === 0 ? (
                                <div className="text-center py-8 text-gray-600 text-xs italic">
                                    Sin unidades. Presiona "Agregar Unidad" o configura M03.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {group.units.map(({ unit, globalIdx }) => {
                                        const [startDate, endDate] = unit.fecha.split('|');
                                        const enfoquesUnit = getEnfoquesSeleccionadosPorUnidad(globalIdx, matrix);
                                        const compsUnit = getCompetenciasSeleccionadasPorUnidad(globalIdx, matrix, cnebComps, transComps);
                                        const isHovered = hoveredIdx === globalIdx;

                                        return (
                                            <div
                                                key={unit.id}
                                                className="bg-surface-card/50 rounded-2xl border border-white/5 hover:border-primary-teal/20 transition-all duration-300 relative group"
                                                onMouseEnter={() => setHoveredIdx(globalIdx)}
                                                onMouseLeave={() => setHoveredIdx(null)}
                                            >
                                                {/* Delete button (on hover) */}
                                                {isHovered && (
                                                    <button
                                                        onClick={() => deleteUnidad(globalIdx)}
                                                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg z-10 animate-scale-in"
                                                    >
                                                        <span className="material-icons-round text-[14px]">close</span>
                                                    </button>
                                                )}

                                                <div className="flex gap-6 p-5">
                                                    {/* LEFT Column: Meta */}
                                                    <div className="w-1/4 space-y-3 flex-shrink-0">
                                                        {/* Dates */}
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Inicio</label>
                                                            <input
                                                                type="date"
                                                                value={startDate}
                                                                onChange={(e) => handleDateChange(globalIdx, 'start', e.target.value)}
                                                                className="w-full bg-surface-card border border-white/5 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-teal/30"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Término</label>
                                                            <input
                                                                type="date"
                                                                value={endDate}
                                                                onChange={(e) => handleDateChange(globalIdx, 'end', e.target.value)}
                                                                className="w-full bg-surface-card border border-white/5 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-teal/30"
                                                            />
                                                        </div>

                                                        {/* Type */}
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Tipo</label>
                                                            <button
                                                                onClick={() => updateUnidad(globalIdx, { tipo: rotateTipo(unit.tipo) })}
                                                                className="w-full bg-surface-card border border-white/5 rounded-xl px-3 py-1.5 text-xs text-gray-300 text-left hover:border-primary-teal/30 transition-colors flex items-center justify-between"
                                                            >
                                                                <span>{unit.tipo}</span>
                                                                <span className="material-icons-round text-[14px] text-gray-600">swap_vert</span>
                                                            </button>
                                                        </div>

                                                        {/* Title */}
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Título</label>
                                                            <input
                                                                type="text"
                                                                value={unit.titulo}
                                                                onChange={(e) => updateUnidad(globalIdx, { titulo: e.target.value })}
                                                                className="w-full bg-surface-card border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-teal/30 placeholder:text-gray-600"
                                                                placeholder="Nombre de la unidad..."
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* RIGHT Column: Content */}
                                                    <div className="flex-1 space-y-4">
                                                        {/* Temática de la Unidad */}
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-[9px] font-black text-primary-teal/70 uppercase tracking-widest flex items-center gap-2">
                                                                    <span className="material-icons-round text-[14px]">psychology</span>
                                                                    CONTENIDO / TEMÁTICA
                                                                </label>
                                                                <button
                                                                    onClick={() => handleSugerirIdeasUnitAI(globalIdx)}
                                                                    className={cn(
                                                                        "w-7 h-7 rounded-xl flex items-center justify-center transition-all bg-primary-teal/5 border border-primary-teal/10",
                                                                        loadingIdeas === globalIdx ? "animate-spin text-primary-teal" : "hover:bg-primary-teal/20 text-primary-teal hover:border-primary-teal/30"
                                                                    )}
                                                                    title="¡Bombilla de Inspiración!"
                                                                >
                                                                    <span className="material-icons-round text-[16px]">
                                                                        {loadingIdeas === globalIdx ? 'sync' : 'lightbulb'}
                                                                    </span>
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={unit.tematica || ''}
                                                                onChange={(e) => updateUnidad(globalIdx, { tematica: e.target.value })}
                                                                className="w-full bg-surface-card border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary-teal/30 placeholder:text-gray-600 transition-all border-l-4 border-l-magenta"
                                                                placeholder={
                                                                    planActivo.area.toLowerCase().includes('arte')
                                                                        ? "Ej: Pintura, danza, música, teatro..."
                                                                        : "Ej: Eje temático central de la unidad..."
                                                                }
                                                            />

                                                            {/* Suggested Ideas List */}
                                                            {sugerenciasUnit[globalIdx] && (
                                                                <div className="flex flex-col gap-2 p-3 bg-primary-teal/5 rounded-2xl border border-primary-teal/20 animate-fade-in mt-2 relative">
                                                                    <button
                                                                        onClick={() => setSugerenciasUnit(prev => {
                                                                            const next = { ...prev };
                                                                            delete next[globalIdx];
                                                                            return next;
                                                                        })}
                                                                        className="absolute top-2 right-2 text-gray-600 hover:text-white"
                                                                    >
                                                                        <span className="material-icons-round text-[14px]">close</span>
                                                                    </button>
                                                                    <p className="text-[9px] font-black text-primary-teal/70 uppercase tracking-widest italic mb-1">Inspiración Sugerida:</p>
                                                                    <div className="grid grid-cols-1 gap-2">
                                                                        {sugerenciasUnit[globalIdx].map((idea, i) => (
                                                                            <button
                                                                                key={i}
                                                                                onClick={() => {
                                                                                    updateUnidad(globalIdx, {
                                                                                        titulo: idea.titulo,
                                                                                        tematica: idea.tematica,
                                                                                        producto: idea.producto
                                                                                    });
                                                                                    setSugerenciasUnit(prev => {
                                                                                        const next = { ...prev };
                                                                                        delete next[globalIdx];
                                                                                        return next;
                                                                                    });
                                                                                }}
                                                                                className="text-left p-2.5 rounded-xl bg-surface-card/80 border border-white/5 hover:border-primary-teal/40 transition-all group hover:bg-surface-card"
                                                                            >
                                                                                <p className="text-[10px] font-black text-white group-hover:text-primary-teal leading-tight">{idea.titulo}</p>
                                                                                <div className="flex items-center gap-3 mt-1 text-[9px]">
                                                                                    <p className="text-gray-500"><span className="text-gray-600 font-bold">TEMA:</span> {idea.tematica}</p>
                                                                                    <p className="text-gray-500"><span className="text-gray-600 font-bold">PRODUCTO:</span> {idea.producto}</p>
                                                                                </div>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <p className="text-[8px] text-gray-500 italic mt-1 font-medium">
                                                                * CAMPO OBLIGATORIO: Define el eje central que orientará la IA.
                                                            </p>
                                                        </div>

                                                        {/* Competencias chips */}
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2 block">
                                                                    PROPÓSITOS (ÁREA)
                                                                </label>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {compsUnit.filter(c => !c.esTransversal).length > 0 ? (
                                                                        compsUnit.filter(c => !c.esTransversal).map((c) => (
                                                                            <Chip
                                                                                key={c.id}
                                                                                label={c.nombre}
                                                                                variant="teal"
                                                                                active
                                                                            />
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-[10px] text-gray-600 italic">
                                                                            Sin competencias del área (en M04)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2 block">
                                                                    PROPÓSITOS (TRANSV.)
                                                                </label>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {compsUnit.filter(c => c.esTransversal).length > 0 ? (
                                                                        compsUnit.filter(c => c.esTransversal).map((c) => (
                                                                            <Chip
                                                                                key={c.id}
                                                                                label={c.nombre}
                                                                                variant="gray"
                                                                                active
                                                                            />
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-[10px] text-gray-600 italic">
                                                                            Sin transversales (en M04)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Enfoque chips */}
                                                        <div>
                                                            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2 block">
                                                                Enfoques Transversales
                                                            </label>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {enfoquesUnit.length > 0 ? (
                                                                    enfoquesUnit.map((e) => (
                                                                        <Chip
                                                                            key={e.enfoqueId}
                                                                            label={e.nombre}
                                                                            variant="magenta"
                                                                            active
                                                                        />
                                                                    ))
                                                                ) : (
                                                                    <span className="text-[10px] text-gray-600 italic">
                                                                        Sin enfoques (en M04)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Situación Significativa */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                                                    SITUACIÓN (Contexto y Reto)
                                                                </label>
                                                            </div>
                                                            <textarea
                                                                className="w-full h-24 bg-surface-card border border-white/5 rounded-xl p-3 text-[11px] text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-teal/30 resize-none leading-relaxed custom-scrollbar placeholder:text-gray-600"
                                                                placeholder="Descripción contextualizada del problema o necesidad que aborda esta unidad..."
                                                                value={unit.situacionSignificativa}
                                                                onChange={(e) => updateUnidad(globalIdx, { situacionSignificativa: e.target.value })}
                                                            />
                                                        </div>

                                                        {/* Producto Tentativo */}
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                                                EVALUACIÓN (Evidencia/Producto)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={unit.producto}
                                                                onChange={(e) => updateUnidad(globalIdx, { producto: e.target.value })}
                                                                className="w-full bg-surface-card border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-teal/30 placeholder:text-gray-600 border-l-4 border-l-magenta"
                                                                placeholder="Ej: Mural, maqueta, revista, presentación, campaña..."
                                                            />
                                                            <p className="text-[8px] text-gray-500 italic mt-1 font-medium">
                                                                * CAMPO OBLIGATORIO: Qué elaborarán los estudiantes.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
};

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { AIButton } from '@/components/ui/AIButton';
import { Unidad, Sesion, createDefaultSesion } from '@/types/schemas';
import { useUnidadesStore, usePlanAnualStore, usePerfilStore, useAIConfigStore, useNotificationStore } from '@/store';
import { Spinner } from '@/components/ui/Spinner';
import { chatCompletion } from '@/services/ai';
import { PROMPTS } from '@/services/ai/prompts';
import { ENFOQUES_CNEB } from '@/services/cneb/enfoques';
import { cn } from '@/lib/cn';

interface Step5PreveProps {
    unidad: Unidad;
    onUpdate: (updates: Partial<Unidad>) => void;
}

// ─── Types for AI response ──────────────────────────────────────────────────

interface SesionIA {
    orden: number;
    titulo: string;
    productoSesion: string;
    competencias: string[];
    capacidades: string[];
    desempenos: string[];
    desempenosPrecisados: string[];
    criterios: string[];
    secuencia: {
        inicio: string;
        desarrollo: string;
        cierre: string;
    };
    evidenciaRapida: string;
    notaCoherencia: string;
    alertasM03: string | null;
}

interface ResumenCobertura {
    competenciasCubiertas: string[];
    criteriosPorSesion: string;
    sesionesProductoFinal: number[];
    ajustesRecomendados: string | null;
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function formatDateShort(dateStr: string): string {
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const Step5Preve: React.FC<Step5PreveProps> = ({ unidad, onUpdate }) => {
    const navigate = useNavigate();
    const { sesiones, upsertSesiones, deleteSesion, deleteAllSesiones } = useUnidadesStore();
    const { planActivo } = usePlanAnualStore();
    const { perfil } = usePerfilStore();
    const { getDecryptedApiKey, getActiveModel, aiConfig } = useAIConfigStore();
    const { showNotification } = useNotificationStore();
    const [loading, setLoading] = useState(false);
    const [resumen, setResumen] = useState<ResumenCobertura | null>(null);
    const [sesionesIAData, setSesionesIAData] = useState<SesionIA[]>([]);

    // Filtrar sesiones por unidad
    const sesionesUnidad = sesiones.filter(s => s.unidadId === unidad.id);

    // ─── Build calendar sessions from ORGANIZA ──────────────────────────────

    const sesionesCalendario = useMemo(() => {
        const dias = unidad.organizaStep.diasSeleccionados || [];
        if (dias.length === 0) return [];

        const grouped = new Map<number, { fecha: string; horas: number }[]>();
        dias.forEach(d => {
            const existing = grouped.get(d.sesionIndex) || [];
            existing.push({ fecha: d.fecha, horas: d.horasPedagogicas });
            grouped.set(d.sesionIndex, existing);
        });

        return Array.from(grouped.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([idx, fechas]) => ({
                index: idx,
                fechas: fechas.sort((a, b) => a.fecha.localeCompare(b.fecha)),
                totalHoras: fechas.reduce((sum, f) => sum + f.horas, 0),
            }));
    }, [unidad.organizaStep.diasSeleccionados]);

    // ─── Build M03 events in range ──────────────────────────────────────────

    const eventosM03 = useMemo(() => {
        if (!planActivo?.calendarioComunalData?.events) return [];
        const { fechaInicio, fechaTermino } = unidad.organizaStep;
        if (!fechaInicio || !fechaTermino) return [];

        return planActivo.calendarioComunalData.events
            .filter(ev => {
                const d = ev.date || ev.startDate;
                if (!d) return false;
                return d >= fechaInicio && d <= fechaTermino;
            })
            .map(ev => ({
                titulo: ev.title,
                fecha: ev.date || ev.startDate || '',
                tipo: ev.type,
            }));
    }, [planActivo?.calendarioComunalData?.events, unidad.organizaStep.fechaInicio, unidad.organizaStep.fechaTermino]);

    // ─── Generate ───────────────────────────────────────────────────────────

    const handleGenerateSequence = async () => {
        if (!planActivo || !perfil) return;

        if (sesionesCalendario.length === 0) {
            showNotification({
                title: 'Calendario vacío',
                message: 'Primero marca los días y sesiones en el Paso 3 (Organiza) antes de generar la secuencia.',
                type: 'warning',
            });
            return;
        }

        if (sesionesUnidad.length > 0) {
            const confirmed = window.confirm(
                'Esta unidad ya tiene sesiones generadas.\n\nSi continúas, se reemplazarán todas las sesiones actuales y perderás cualquier modificación que hayas realizado.\n\n¿Estás seguro de generar una nueva secuencia de sesiones?'
            );
            if (!confirmed) return;
        }

        setLoading(true);

        try {
            // Build competencias with capacidades
            const competencias = unidad.disenaStep.competencias
                .filter(c => c.seleccionada)
                .map(c => ({
                    nombre: c.competenciaId,
                    capacidades: c.capacidades.filter(cap => cap.seleccionada).map(cap => cap.capacidadId),
                }));

            // Enfoques transversales heredados del plan anual
            const enfoques = (planActivo?.enfoquesTransversales || []).map(e => ({
                nombre: e.enfoqueId,
                valores: e.valoresIds || [],
            }));

            // Criterios — solo de disenaStep ya que selecciona/organiza fueron simplificados
            const allCriterios = [
                ...(unidad.disenaStep?.criterios || []),
            ];
            const criteriosUnidad = allCriterios.map(c => ({
                descripcion: c.descripcion,
                evidencia: c.evidencia,
            }));

            // Diagnóstico previo text
            const diag = unidad.diagnosticoStep.diagnosticoPrevio;
            const diagnosticoPrevio = [
                diag.observacion,
                diag.necesidades,
            ].filter(Boolean).join('. ') || '';

            const prompt = PROMPTS.GENERAR_SECUENCIA_SESIONES({
                tituloUnidad: unidad.diagnosticoStep.titulo,
                situacion: unidad.diagnosticoStep.situacionSignificativa,
                producto: unidad.diagnosticoStep.productoTentativo,
                competencias,
                desempenos: unidad.disenaStep.desempenos.map(d => ({ texto: d.texto, precisado: d.precisado })),
                criteriosUnidad,
                enfoques,
                sesionesCalendario,
                eventosM03,
                diagnosticoPrevio,
            });

            const apiKey = await getDecryptedApiKey();
            const activeModel = getActiveModel();

            const result = await chatCompletion(
                'Eres un especialista en planificación curricular y diseño instruccional del CNEB Perú.',
                prompt,
                {
                    apiKey,
                    provider: aiConfig.provider,
                    customUrl: aiConfig.lmstudioUrl,
                    model: activeModel,
                    responseFormat: 'json',
                    temperature: 0.2,
                    maxTokens: 8192, // Rich response needs more tokens
                }
            );

            // Parse result — chatCompletion already auto-parses JSON in most cases
            console.log('[Step5 Prevé] Raw AI result type:', typeof result, result);

            let data: any = result;

            // If string (fallback case), try to extract JSON
            if (typeof result === 'string') {
                const cleaned = result.replace(/```json|```/g, '').trim();
                const start = cleaned.indexOf('{');
                const end = cleaned.lastIndexOf('}');
                if (start !== -1 && end !== -1) {
                    try {
                        data = JSON.parse(cleaned.substring(start, end + 1));
                    } catch (e) {
                        console.error('[Step5 Prevé] JSON parse failed:', e);
                    }
                }
            }

            // The AI service's fallback may wrap response in { situacion: ... }
            // Try to find sesiones at any level
            let sesionesArr = data?.sesiones;
            if (!sesionesArr && Array.isArray(data)) {
                // Maybe it returned the array directly
                sesionesArr = data;
            }

            if (!sesionesArr || !Array.isArray(sesionesArr)) {
                console.error('[Step5 Prevé] Invalid response shape:', JSON.stringify(data).slice(0, 500));
                throw new Error('La IA no devolvió sesiones válidas. Intenta de nuevo.');
            }


            const sesionesIA: SesionIA[] = sesionesArr;
            setSesionesIAData(sesionesIA);
            setResumen(data.resumenCobertura || null);

            // Create proper Sesion objects
            const newSesiones: Sesion[] = sesionesIA.map((sg) => {
                const calSes = sesionesCalendario.find(s => s.index === sg.orden - 1);
                const totalMinutos = calSes ? calSes.totalHoras * 45 : 90; // 1 hora pedagógica = 45 min

                const base = createDefaultSesion(
                    crypto.randomUUID(),
                    unidad.id,
                    sg.orden,
                    sg.titulo
                );

                const inicioMin = Math.round(totalMinutos * 0.15);
                const cierreMin = Math.round(totalMinutos * 0.15);
                const desarrolloMin = totalMinutos - inicioMin - cierreMin;

                // Poblar enfoques transversales de sesión (desde M03)
                const enfoquesSesion = (planActivo?.enfoquesTransversales || []).map(e => {
                    const cnebEnfoque = ENFOQUES_CNEB.find(fe => fe.enfoque === e.enfoqueId);
                    return {
                        enfoqueId: e.enfoqueId,
                        nombre: cnebEnfoque?.enfoque || e.enfoqueId,
                        valor: e.valoresIds?.[0] || '', // Tomar el primer valor como default
                        actitud: 'Se demuestra cuando...', // Placeholder oficial
                    };
                });

                // Poblar criterios de evaluación (desde 4.2 Diseña)
                const criteriosSesion = (unidad.disenaStep?.criterios || []).map(c => ({
                    id: c.id || crypto.randomUUID(),
                    competencia: c.fuente || '',
                    criterio: c.descripcion,
                    evidencia: c.evidencia,
                    instrumento: 'Lista de Cotejo',
                }));

                return {
                    ...base,
                    proposito: sg.productoSesion,
                    objetivoEspecifico: sg.productoSesion, // Inicializar con el producto como base
                    competenciaId: sg.competencias?.[0] || '',
                    capacidadId: sg.capacidades?.[0] || '',
                    desempenoPrecisado: sg.desempenosPrecisados?.[0] || sg.desempenos?.[0] || '',
                    enfoquesTransversalesSesion: enfoquesSesion,
                    evidencia: sg.evidenciaRapida || '',
                    criteriosEvaluacionSesion: criteriosSesion,
                    secuenciaDidactica: {
                        inicio: {
                            descripcion: sg.secuencia?.inicio || '',
                            duracionMinutos: inicioMin,
                            estrategiaMetodologica: '',
                            recursosMateriales: '',
                        },
                        desarrollo: {
                            descripcion: sg.secuencia?.desarrollo || '',
                            duracionMinutos: desarrolloMin,
                            estrategiaMetodologica: '',
                            recursosMateriales: '',
                        },
                        cierre: {
                            descripcion: sg.secuencia?.cierre || '',
                            duracionMinutos: cierreMin,
                            estrategiaMetodologica: '',
                            recursosMateriales: '',
                        },
                    },
                };
            });

            if (sesionesUnidad.length > 0) {
                await deleteAllSesiones(unidad.id);
            }
            await upsertSesiones(newSesiones);

            onUpdate({
                preveStep: {
                    sesiones: sesionesIA.map(s => ({
                        titulo: s.titulo,
                        competenciaId: s.competencias?.[0] || '',
                        capacidadId: s.capacidades?.[0] || '',
                        desempenoId: s.desempenosPrecisados?.[0] || '',
                        enfoque: '',
                        duracionMinutos: 90,
                        orden: s.orden,
                    })),
                },
            });

            showNotification({
                title: 'Secuencia generada',
                message: `${sesionesIA.length} sesiones creadas con éxito a partir del calendario.`,
                type: 'success',
            });
        } catch (error: any) {
            console.error('Error generando secuencia:', error);
            const errorMsg = error?.message || error?.toString() || JSON.stringify(error) || 'No se pudo generar la secuencia de sesiones.';
            showNotification({
                title: 'Error',
                message: errorMsg,
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    // ─── Render helpers ─────────────────────────────────────────────────────

    const SESION_COLORS = [
        { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', accent: 'cyan' },
        { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', accent: 'rose' },
        { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', accent: 'amber' },
        { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', accent: 'indigo' },
        { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', accent: 'emerald' },
        { bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20', text: 'text-fuchsia-400', accent: 'fuchsia' },
        { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', accent: 'orange' },
        { bg: 'bg-sky-500/10', border: 'border-sky-500/20', text: 'text-sky-400', accent: 'sky' },
        { bg: 'bg-lime-500/10', border: 'border-lime-500/20', text: 'text-lime-400', accent: 'lime' },
    ];

    const getColor = (idx: number) => SESION_COLORS[idx % SESION_COLORS.length];

    const handleDeleteAll = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!window.confirm('¿Estás seguro de que quieres eliminar TODAS las sesiones de esta unidad? Esta acción no se puede deshacer.')) return;
        
        try {
            await deleteAllSesiones(unidad.id);
            setSesionesIAData([]); // Clear local IA data to reset UI completely
            showNotification({
                title: 'Sesiones eliminadas',
                message: 'Se han eliminado todas las sesiones de la unidad.',
                type: 'success',
            });
        } catch (error) {
            console.error('Error deleting all sessions:', error);
        }
    };

    const handleDeleteSesion = async (e: React.MouseEvent, sesionId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('¿Estás seguro de eliminar esta sesión?')) return;
        
        try {
            await deleteSesion(sesionId);
            showNotification({
                title: 'Sesión eliminada',
                message: 'La sesión ha sido eliminada correctamente.',
                type: 'success',
            });
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    };

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="space-y-10 animate-fade-in group/step">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Secuencia Didáctica</h3>
                    <p className="text-gray-500 text-sm italic">
                        Borrador inicial generado desde el calendario real del Paso 3 (Organiza).
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    {sesionesCalendario.length > 0 && (
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                            {sesionesCalendario.length} sesión{sesionesCalendario.length !== 1 ? 'es' : ''} · {sesionesCalendario.reduce((sum, s) => sum + s.totalHoras, 0)}h
                        </span>
                    )}
                    {sesionesUnidad.length > 0 && (
                        <button
                            type="button"
                            onClick={handleDeleteAll}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors border border-red-500/20"
                            title="Eliminar todas las sesiones"
                        >
                            <span className="material-icons-round text-sm">delete_sweep</span>
                        </button>
                    )}
                    <AIButton
                        variant="magenta"
                        isLoading={loading}
                        onClick={handleGenerateSequence}
                        tooltip={sesionesUnidad.length > 0 ? 'Regenerar secuencia con IA' : 'Generar secuencia con IA'}
                    />
                </div>
            </header>

            {/* Calendar requirement notice */}
            {sesionesCalendario.length === 0 && (
                <Card variant="flat" className="border-dashed border-yellow-500/20 bg-yellow-500/5">
                    <div className="flex gap-4 items-center">
                        <span className="material-icons-round text-yellow-500 text-2xl">event_busy</span>
                        <div>
                            <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Calendario no configurado</p>
                            <p className="text-[10px] text-gray-500 mt-1">
                                Ve al <strong className="text-white">Paso 3 (Organiza)</strong> y marca los días de clase para definir sesiones antes de generar la secuencia.
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="py-24 flex flex-col items-center gap-6 bg-white/2 rounded-[3rem] border border-dashed border-white/5">
                        <Spinner size="lg" />
                        <div className="text-center">
                            <p className="text-white font-black uppercase tracking-widest animate-pulse">Diseñando secuencia pedagógica...</p>
                            <p className="text-xs text-gray-700 mt-2">Analizando calendario, competencias y criterios para crear el borrador óptimo.</p>
                        </div>
                    </div>
                ) : sesionesUnidad.length === 0 ? (
                    <div className="py-24 text-center bg-white/2 rounded-[3rem] border border-dashed border-white/5 space-y-6">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-700">
                            <span className="material-icons-round text-3xl italic">auto_stories</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-gray-500 font-bold uppercase tracking-widest">Secuencia Vacía</p>
                            <p className="text-xs text-gray-700">
                                {sesionesCalendario.length > 0
                                    ? 'Pulsa el botón superior para generar las sesiones a partir de tu calendario.'
                                    : 'Configura el calendario en el Paso 3 primero.'}
                            </p>
                        </div>
                        {sesionesCalendario.length > 0 && (
                            <button
                                onClick={handleGenerateSequence}
                                className="px-8 py-3 bg-primary-teal/10 border border-primary-teal/20 rounded-2xl text-primary-teal font-black text-[10px] uppercase tracking-widest hover:bg-primary-teal/20 transition-all"
                            >
                                Comenzar ahora
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-5">
                            {sesionesUnidad.map((sesion, index) => {
                                const isDiseñada = !!sesion.proposito;
                                const color = getColor(index);
                                const calSes = sesionesCalendario[index];
                                const iaData = sesionesIAData[index];

                                return (
                                    <Card
                                        key={sesion.id}
                                        variant={isDiseñada ? 'strong' : 'flat'}
                                        className={cn(
                                            "group/card hover:border-primary-teal/30 transition-all border-l-4 overflow-hidden",
                                            isDiseñada ? "border-l-primary-teal" : "border-l-gray-800"
                                        )}
                                    >
                                        {/* Session header */}
                                        <div
                                            className="flex items-center gap-4 cursor-pointer"
                                            onClick={() => navigate(`/sesiones/${sesion.id}`)}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex flex-col items-center justify-center border transition-all flex-shrink-0",
                                                color.bg, color.border, color.text,
                                                "group-hover/card:scale-105"
                                            )}>
                                                <span className="text-[8px] font-black leading-none uppercase">Ses</span>
                                                <span className="text-lg font-black leading-none">{index + 1}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-white group-hover/card:text-primary-teal transition-colors uppercase tracking-tight line-clamp-1">
                                                    {sesion.titulo}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                        isDiseñada ? "bg-primary-teal/15 text-primary-teal" : "bg-white/5 text-gray-600"
                                                    )}>
                                                        {isDiseñada ? 'DISEÑADA' : 'PENDIENTE'}
                                                    </span>
                                                    {/* Calendar dates */}
                                                    {calSes && (
                                                        <>
                                                            <span className="w-0.5 h-0.5 bg-gray-800 rounded-full" />
                                                            <span className="text-[9px] font-bold text-gray-500 flex items-center gap-1">
                                                                <span className="material-icons-round text-[10px] text-gray-600">calendar_today</span>
                                                                {calSes.fechas.map(f => formatDateShort(f.fecha)).join(', ')}
                                                            </span>
                                                            <span className="w-0.5 h-0.5 bg-gray-800 rounded-full" />
                                                            <span className={cn("text-[9px] font-black", color.text)}>
                                                                {calSes.totalHoras}h
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteSesion(e, sesion.id)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                                    title="Eliminar sesión"
                                                >
                                                    <span className="material-icons-round text-sm">delete</span>
                                                </button>
                                                <span className="material-icons-round text-gray-700 group-hover/card:text-white transition-colors text-lg">chevron_right</span>
                                            </div>
                                        </div>

                                        {/* Enriched data (from IA) */}
                                        {iaData && (
                                            <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                                                {/* Producto de sesión */}
                                                <div className="flex items-start gap-2">
                                                    <span className="material-icons-round text-xs text-brand-magenta mt-0.5">inventory_2</span>
                                                    <p className="text-[10px] text-gray-400 leading-relaxed">
                                                        <strong className="text-white font-bold uppercase tracking-widest text-[9px]">Producto: </strong>
                                                        {iaData.productoSesion}
                                                    </p>
                                                </div>

                                                {/* Competencias */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    {iaData.competencias?.map((comp, ci) => (
                                                        <span key={ci} className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-primary-teal/10 text-primary-teal/80 border border-primary-teal/10 uppercase tracking-widest line-clamp-1">
                                                            {comp}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Secuencia (collapsed view) */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    {(['inicio', 'desarrollo', 'cierre'] as const).map(momento => {
                                                        const icons = { inicio: 'play_circle', desarrollo: 'build_circle', cierre: 'check_circle' };
                                                        const colors = { inicio: 'text-primary-teal', desarrollo: 'text-brand-magenta', cierre: 'text-yellow-400' };
                                                        const text = (iaData?.secuencia as any)?.[momento] || '';
                                                        return (
                                                            <div key={momento} className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                                    <span className={cn("material-icons-round text-xs", colors[momento])}>{icons[momento]}</span>
                                                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">{momento}</span>
                                                                </div>
                                                                <p className="text-[10px] text-gray-500 leading-relaxed whitespace-pre-line line-clamp-3">
                                                                    {text || 'Pendiente...'}
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Nota de coherencia */}
                                                {iaData.notaCoherencia && (
                                                    <div className="flex items-start gap-2 bg-primary-teal/5 rounded-xl px-3 py-2 border border-primary-teal/10">
                                                        <span className="material-icons-round text-xs text-primary-teal mt-0.5">link</span>
                                                        <p className="text-[10px] text-gray-400 leading-relaxed italic">{iaData.notaCoherencia}</p>
                                                    </div>
                                                )}

                                                {/* Alertas M03 */}
                                                {iaData.alertasM03 && (
                                                    <div className="flex items-start gap-2 bg-yellow-500/5 rounded-xl px-3 py-2 border border-yellow-500/20">
                                                        <span className="material-icons-round text-xs text-yellow-500 mt-0.5">warning</span>
                                                        <p className="text-[10px] text-yellow-400 leading-relaxed">{iaData.alertasM03}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Resumen de Cobertura */}
            {resumen && sesionesUnidad.length > 0 && !loading && (
                <Card variant="glass" className="bg-primary-teal/5 border-primary-teal/10 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="material-icons-round text-primary-teal">assessment</span>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Resumen de Cobertura</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Competencias cubiertas */}
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Competencias Cubiertas</p>
                            <div className="flex flex-wrap gap-1.5">
                                {resumen.competenciasCubiertas?.map((c, i) => (
                                    <span key={i} className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-primary-teal/10 text-primary-teal/80 border border-primary-teal/10">
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Criterios por sesión */}
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Distribución de Criterios</p>
                            <p className="text-[10px] text-gray-400 leading-relaxed">{resumen.criteriosPorSesion}</p>
                        </div>

                        {/* Sesiones que aportan al producto final */}
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Sesiones → Producto Final</p>
                            <p className="text-[10px] text-gray-400">
                                Sesión{resumen.sesionesProductoFinal?.length > 1 ? 'es' : ''}{' '}
                                {resumen.sesionesProductoFinal?.join(', ') || 'Todas'}
                            </p>
                        </div>

                        {/* Ajustes M03 */}
                        {resumen.ajustesRecomendados && (
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Ajustes por Eventos M03</p>
                                <p className="text-[10px] text-yellow-400 leading-relaxed">{resumen.ajustesRecomendados}</p>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {sesionesUnidad.length > 0 && !loading && !resumen && (
                <Card variant="glass" className="bg-primary-teal/5 border-primary-teal/10">
                    <div className="flex items-center gap-4">
                        <span className="material-icons-round text-primary-teal">info</span>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Se han generado <span className="text-white font-bold">{sesionesUnidad.length} sesiones</span>. Haz clic en una sesión para el diseño detallado.
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
};

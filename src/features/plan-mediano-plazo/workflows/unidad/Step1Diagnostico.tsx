import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { AIButton } from '@/components/ui/AIButton';
import { Unidad, LogroFrecuencia, CNEBCompetencia } from '@/types/schemas';
import { useDebounce } from '@/hooks/ui/useDebounce';
import { usePlanAnualStore, usePerfilStore, useAIConfigStore, useNotificationStore, useUnidadesStore } from '@/store';
import { cnebService } from '@/services/cneb';
import { chatCompletion } from '@/services/ai';
import { PROMPTS } from '@/services/ai/prompts';
import { ResumenM03 } from './ResumenM03';

interface Step1DiagnosticoProps {
    unidad: Unidad;
    onUpdate: (updates: Partial<Unidad>) => void;
}

export const Step1Diagnostico: React.FC<Step1DiagnosticoProps> = ({ unidad, onUpdate }) => {
    const { planActivo, updatePlan } = usePlanAnualStore();
    const { perfil } = usePerfilStore();
    const { unidades: todasUnidades } = useUnidadesStore();
    const { aiConfig, getDecryptedApiKey } = useAIConfigStore();
    const { showNotification } = useNotificationStore();
    const [situacion, setSituacion] = useState(unidad.diagnosticoStep.situacionSignificativa);
    const [diagnostico, setDiagnostico] = useState(unidad.diagnosticoStep.diagnosticoPrevio);
    const [areaComps, setAreaComps] = useState<CNEBCompetencia[]>([]);
    const [transComps, setTransComps] = useState<CNEBCompetencia[]>([]);
    const [aiLoading, setAiLoading] = useState(false);

    const handleRecontextualizarIA = async () => {
        if (!perfil || !planActivo || aiLoading) return;
        
        // Buscar unidad anterior
        const prevNum = unidad.numero - 1;
        const prevUnit = todasUnidades.find((u: any) => u.planAnualId === unidad.planAnualId && u.numero === prevNum);
        
        setAiLoading(true);
        try {
            const hypothesis = planActivo.identidad.descripcionArea;
            const prevResults = prevUnit 
                ? `Logros U${prevNum}: ${JSON.stringify(prevUnit.diagnosticoStep.diagnosticoPrevio.logros)}. Observación: ${prevUnit.diagnosticoStep.diagnosticoPrevio.observacion}`
                : "No existe unidad previa. Usa solo el diagnóstico anual.";

            const prompt = `Actúa como un Especialista en Acompañamiento Pedagógico.
OBJETIVO: Ajustar la Situación Significativa de la UNIDAD ${unidad.numero} según resultados previos.

ENTRADAS:
1. Hipótesis Anual: ${hypothesis}
2. Resultados Reales Unidad Anterior: ${prevResults}
3. Situación Significativa Actual: ${situacion}

TAREA:
- Si detectas bajo rendimiento (niveles C o B altos) en la unidad anterior, modifica la situación de la unidad actual para incluir actividades de nivelación o refuerzo sin perder el tema central.
- Ajusta el desafío para que sea más pertinente a la realidad actual del grupo.

RESPONDE SOLO JSON:
{
  "nueva_situacion": "..."
}
`;

            const apiKey = await getDecryptedApiKey();
            const result = await chatCompletion(
                "Especialista en recontextualización curricular basada en datos.",
                prompt,
                {
                    provider: aiConfig.provider,
                    model: aiConfig.activeModel,
                    apiKey,
                    customUrl: aiConfig.lmstudioUrl,
                    responseFormat: 'json',
                    temperature: 0.3
                }
            );

            const finalSituacion = result?.nueva_situacion || result?.situacion;

            if (finalSituacion) {
                setSituacion(finalSituacion);
                showNotification({ 
                    title: 'Personalización Exitosa', 
                    message: 'Se ha ajustado la unidad según los resultados previos de tus estudiantes.', 
                    type: 'success' 
                });
            } else if (typeof result === 'string' && result.length > 50) {
                setSituacion(result);
                showNotification({ title: 'Éxito', message: 'Situación ajustada', type: 'success' });
            }
        } catch (error: any) {
            console.error('Error recontextualizando:', error);
            showNotification({ title: 'Error', message: error.message || 'No se pudo recontextualizar.', type: 'error' });
        } finally {
            setAiLoading(false);
        }
    };

    const debouncedSituacion = useDebounce(situacion, 1000);
    const debouncedDiagnostico = useDebounce(diagnostico, 1000);

    // Sync state: Prioriza datos del Plan Anual si hay discrepancia (M04 -> Unidad)
    useEffect(() => {
        const unitIdx = unidad.numero - 1;
        const uSummary = planActivo?.unidades[unitIdx];
        
        // Si el Plan Anual tiene una situación y la unidad actual tiene otra (o está vacía/default)
        // Actualizamos el estado local para reflejar lo que dice el Plan Anual
        if (uSummary && uSummary.situacionSignificativa !== unidad.diagnosticoStep.situacionSignificativa) {
            setSituacion(uSummary.situacionSignificativa);
        } else {
            setSituacion(unidad.diagnosticoStep.situacionSignificativa);
        }
        
        setDiagnostico(unidad.diagnosticoStep.diagnosticoPrevio);
    }, [unidad.id, planActivo?.unidades]);

    // Load CNEB
    useEffect(() => {
        const load = async () => {
            if (!planActivo) return;
            const [area, trans] = await Promise.all([
                cnebService.getCompetenciasByAreaNivel(planActivo.area, planActivo.nivel),
                cnebService.getCompetenciasByAreaNivel('Competencias Transversales', planActivo.nivel),
            ]);
            setAreaComps(area);
            setTransComps(trans);
        };
        load();
    }, [planActivo?.area, planActivo?.nivel]);

    useEffect(() => {
        const hasChanges = 
            debouncedSituacion !== unidad.diagnosticoStep.situacionSignificativa ||
            debouncedDiagnostico !== unidad.diagnosticoStep.diagnosticoPrevio;

        if (hasChanges) {
            // 1. Actualización local del workflow de unidades
            onUpdate({
                diagnosticoStep: {
                    ...unidad.diagnosticoStep,
                    situacionSignificativa: debouncedSituacion,
                    diagnosticoPrevio: debouncedDiagnostico
                }
            });

            // 2. SINCRONIZACIÓN INVERSA (M04 — Estrategia Anual)
            // Si modificamos la situación o el producto en la unidad, se debe reflejar en el Plan Anual
            if (planActivo && planActivo.unidades) {
                const unitIdx = unidad.numero - 1;
                const nextUnidadesAnuales = [...planActivo.unidades];
                if (nextUnidadesAnuales[unitIdx]) {
                    nextUnidadesAnuales[unitIdx] = {
                        ...nextUnidadesAnuales[unitIdx],
                        situacionSignificativa: debouncedSituacion,
                        // El producto tentativo también se sincroniza si cambió
                        producto: unidad.diagnosticoStep.productoTentativo || nextUnidadesAnuales[unitIdx].producto
                    };
                    updatePlan(planActivo.id, { unidades: nextUnidadesAnuales });
                }
            }
        }
    }, [debouncedSituacion, debouncedDiagnostico]);

    const handleContextualizarIA = async () => {
        if (!perfil || !planActivo || aiLoading) return;
        
        setAiLoading(true);
        try {
            // Determinar competencias activas para esta unidad desde la matriz del plan anual
            const unidadIndex = unidad.numero - 1;
            const activeComps: string[] = [];
            
            [...areaComps, ...transComps].forEach(comp => {
                const matrixRow = planActivo.matrizCompetencias[comp.nombre];
                if (matrixRow && matrixRow[unidadIndex]) {
                    activeComps.push(comp.nombre);
                }
            });

            // Sincronizar diagnóstico actual en la unidad temporal para el prompt
            const unidadConDiagnostico = {
                ...unidad,
                diagnosticoStep: {
                    ...unidad.diagnosticoStep,
                    diagnosticoPrevio: diagnostico,
                    situacionSignificativa: situacion
                }
            };

            const apiKey = await getDecryptedApiKey();
            const result = await chatCompletion(
                "Eres un experto en el CNEB y diseño de Situaciones Significativas.",
                PROMPTS.CONTEXTUALIZAR_SITUACION(perfil, planActivo, unidadConDiagnostico, activeComps),
                {
                    provider: aiConfig.provider,
                    model: aiConfig.activeModel,
                    apiKey,
                    customUrl: aiConfig.lmstudioUrl,
                    responseFormat: 'json',
                }
            );

            // Aceptamos tanto .situacion como .nueva_situacion
            const finalSituacion = result?.situacion || result?.nueva_situacion;

            if (finalSituacion) {
                setSituacion(finalSituacion);
                showNotification({ title: 'Éxito', message: 'Situación contextualizada con IA', type: 'success' });
            } else if (typeof result === 'string' && result.length > 50) {
                // Fallback final: si result es el string plano de la respuesta
                setSituacion(result);
                showNotification({ title: 'Éxito', message: 'Situación recuperada', type: 'success' });
            } else {
                throw new Error('La IA no devolvió la situación significativa esperada.');
            }
        } catch (error: any) {
            console.error('Error contextualizando con IA:', error);
            showNotification({ title: 'Error IA', message: error.message || 'Error desconocido al conectar con la IA', type: 'error' });
        } finally {
            setAiLoading(false);
        }
    };

    const handleLogroChange = (compId: string, level: keyof LogroFrecuencia, val: string) => {
        const num = parseInt(val) || 0;
        const newLogros = { ...diagnostico.logros };
        const current = newLogros[compId] || { ad: 0, a: 0, b: 0, c: 0 };
        newLogros[compId] = { ...current, [level]: num };
        setDiagnostico({ ...diagnostico, logros: newLogros });
    };

    const handleTotalEstudiantesChange = (val: string) => {
        const num = parseInt(val) || 0;
        setDiagnostico({ ...diagnostico, totalEstudiantes: num });
    };

    const renderLogrosRow = (comp: CNEBCompetencia) => {
        const compId = comp.nombre;
        const f = diagnostico.logros[compId] || { ad: 0, a: 0, b: 0, c: 0 };
        const localSum = (f.ad + f.a + f.b + f.c);
        const calcPercent = (val: number) => {
            if (localSum === 0) return 0;
            return Math.round((val / localSum) * 100);
        };

        const isMismatch = diagnostico.totalEstudiantes > 0 && localSum !== diagnostico.totalEstudiantes && localSum > 0;

        return (
            <div key={compId} className={`flex flex-col md:flex-row md:items-center gap-4 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-all group px-2 rounded-xl ${isMismatch ? 'bg-red-500/5' : ''}`}>
                <div className="flex-1">
                    <p className={`text-xs font-bold leading-tight ${isMismatch ? 'text-red-400' : 'text-white'}`}>
                        {comp.nombre}
                    </p>
                    {isMismatch && (
                        <p className="text-[9px] text-red-400/70 font-bold mt-1 animate-pulse">
                        ⚠️ No coincide: {localSum} de {diagnostico.totalEstudiantes} estudiantes
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-5 gap-2 w-full md:w-96">
                    {(['ad', 'a', 'b', 'c'] as (keyof LogroFrecuencia)[]).map((level) => (
                        <div key={level} className="flex flex-col items-center gap-1">
                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{level}</span>
                            <input
                                type="number"
                                min="0"
                                value={f[level] === 0 ? '' : f[level]}
                                onChange={(e) => handleLogroChange(compId, level, e.target.value)}
                                className={`w-full bg-surface-card border rounded-lg py-1 text-center text-xs text-white focus:ring-1 transition-all font-black placeholder:text-gray-700 ${isMismatch ? 'border-red-500/40 focus:ring-red-500' : 'border-white/10 focus:ring-primary-teal group-hover:border-primary-teal/30'}`}
                                placeholder="0"
                            />
                            <span className={`text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity ${isMismatch ? 'text-red-400/60' : 'text-gray-500'}`}>
                                {calcPercent(f[level])}%
                            </span>
                        </div>
                    ))}
                    <div className="flex flex-col items-center gap-1 border-l border-white/5 pl-2">
                        <span className="text-[8px] font-black text-primary-teal uppercase tracking-widest">TOTAL</span>
                        <div className={`w-full h-[26px] flex items-center justify-center rounded-lg font-black text-xs ${isMismatch ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-primary-teal/10 text-primary-teal border border-primary-teal/20'}`}>
                            {localSum}
                        </div>
                        <span className="text-[7px] font-bold text-gray-600 uppercase mt-auto">alumnos</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <ResumenM03 unidad={unidad} />

            {/* 1. ANÁLISIS DE SABERES PREVIOS */}
            <Card variant="strong">
                <CardHeader className="flex-row items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-primary-teal uppercase tracking-widest mb-1">Sección 1/2</span>
                            <CardTitle className="text-xl font-black">Análisis de Saberes Previos</CardTitle>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="bg-surface-card border border-white/10 rounded-2xl p-3 flex gap-4 items-center">
                            <div>
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">TOTAL ESTUDIANTES</p>
                                <input
                                    type="number"
                                    min="0"
                                    value={diagnostico.totalEstudiantes === 0 ? '' : diagnostico.totalEstudiantes}
                                    onChange={(e) => handleTotalEstudiantesChange(e.target.value)}
                                    className="bg-transparent border-b border-primary-teal/30 text-lg font-black text-white w-14 focus:outline-none focus:border-primary-teal text-center"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Observaciones Generales</label>
                            <textarea
                                className="w-full h-32 bg-surface-card border border-white/10 rounded-2xl p-4 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-teal/30 resize-none leading-relaxed transition-all"
                                placeholder="Describe el estado de los estudiantes respecto a las competencias..."
                                value={diagnostico.observacion}
                                onChange={(e) => setDiagnostico({ ...diagnostico, observacion: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Necesidades de Aprendizaje</label>
                            <textarea
                                className="w-full h-32 bg-surface-card border border-white/10 rounded-2xl p-4 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-teal/30 resize-none leading-relaxed transition-all"
                                placeholder="¿Qué conceptos o habilidades necesitan reforzar?"
                                value={diagnostico.necesidades}
                                onChange={(e) => setDiagnostico({ ...diagnostico, necesidades: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-end justify-between border-b border-white/10 pb-2">
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-primary-teal uppercase tracking-widest">MAPA DE LOGROS (Distribución Curricular)</p>
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Registra cuántos niños alcanzaron cada nivel</p>
                            </div>
                            {diagnostico.totalEstudiantes === 0 && (
                                <p className="text-[9px] text-magenta font-bold animate-pulse">⚠️ Primero define el total de estudiantes arriba</p>
                            )}
                        </div>

                        {/* Area competencies */}
                        <div className="space-y-1">
                            <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-teal" />
                                Competencias del Área: {planActivo?.area}
                            </h4>
                            {areaComps.map(renderLogrosRow)}
                        </div>

                        {/* Transversal competencies */}
                        <div className="pt-4">
                            <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-magenta" />
                                Competencias Transversales
                            </h4>
                            {transComps.map(renderLogrosRow)}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. SITUACIÓN SIGNIFICATIVA */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 animate-fade-in">
                <Card variant="strong">
                    <CardHeader className="border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-magenta uppercase tracking-widest mb-1">Sección 2/2</span>
                                <CardTitle className="text-xl font-black">Situación Significativa</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-primary-teal uppercase tracking-[0.2em]">Reto y Contexto (IA)</label>
                            <div className="flex items-center gap-2">
                                <AIButton 
                                    onClick={handleRecontextualizarIA} 
                                    isLoading={aiLoading} 
                                    variant="teal" 
                                    label="Recontextualizar" 
                                    disabled={unidad.numero === 1}
                                    size="sm"
                                    tooltip={unidad.numero === 1 
                                        ? "Este botón se activa a partir de la Unidad 2" 
                                        : "Ajusta basándote en la unidad anterior"
                                    } 
                                />
                                <AIButton 
                                    onClick={handleContextualizarIA} 
                                    isLoading={aiLoading} 
                                    variant="magenta" 
                                    label="Contextualizar" 
                                    size="sm"
                                    tooltip="Enriquece usando diagnóstico y competencias" 
                                />
                            </div>
                        </div>
                        <textarea
                            className="w-full h-80 bg-surface-card border border-white/10 rounded-[2.5rem] p-8 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-magenta/30 leading-relaxed custom-scrollbar shadow-inner"
                            placeholder="Describe el reto, desafío o problema que abordará esta unidad..."
                            value={situacion}
                            onChange={(e) => setSituacion(e.target.value)}
                        />
                        <div className="flex flex-col md:flex-row gap-4 p-5 bg-white/5 rounded-[2rem] border border-white/5 items-center">
                            <div className="flex-1 text-center md:text-left">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">PRODUCTO TENTATIVO</p>
                                <p className="text-white font-black text-lg">{unidad.diagnosticoStep.productoTentativo || 'No definido'}</p>
                            </div>
                            <div className="h-8 w-px bg-white/10 hidden md:block" />
                            <div className="flex-1 text-center md:text-left">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">TIPO DE UNIDAD</p>
                                <p className="text-primary-teal font-black text-lg uppercase">{unidad.tipo}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { AIButton } from '@/components/ui/AIButton';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { usePlanAnualStore, useAIConfigStore, useNotificationStore } from '@/store';
import { useDebounce } from '@/hooks/ui/useDebounce';
import { Orientaciones } from '@/types/schemas';
import { chatCompletion } from '@/services/ai';

export const OrientacionesEditor: React.FC = () => {
    const navigate = useNavigate();
    const { planActivo, updatePlan, isSyncing } = usePlanAnualStore();
    const { aiConfig, getDecryptedApiKey } = useAIConfigStore();
    const { showNotification } = useNotificationStore();
    const [loadingIA, setLoadingIA] = useState(false);

    // Local state for auto-save
    const [orientaciones, setOrientaciones] = useState<Orientaciones>(planActivo?.orientaciones || {
        evaluacion: { diagnostica: '', formativa: '', sumativa: '' },
        recursos: { paraDocente: '', paraEstudiante: '' },
        metodologia: ''
    });

    // BUG-07 fix: Resync local state when plan data arrives from Supabase
    useEffect(() => {
        if (!planActivo) return;
        setOrientaciones(planActivo.orientaciones || {
            evaluacion: { diagnostica: '', formativa: '', sumativa: '' },
            recursos: { paraDocente: '', paraEstudiante: '' },
            metodologia: ''
        });
    }, [planActivo?.id, JSON.stringify(planActivo?.orientaciones)]);

    const debouncedOr = useDebounce(orientaciones, 1000);

    useEffect(() => {
        if (!planActivo) return;
        
        // Solo guardar si hay cambios reales para evitar bucles o sobrescrituras vacías
        if (JSON.stringify(debouncedOr) !== JSON.stringify(planActivo.orientaciones)) {
            updatePlan(planActivo.id, { orientaciones: debouncedOr });
        }
    }, [debouncedOr]);

    if (!planActivo) return <div className="text-white p-10 font-black">SELECCIONA UN PLAN PRIMERO</div>;

    const updateNested = (category: keyof Orientaciones, field: string, value: string) => {
        if (category === 'metodologia') {
            setOrientaciones({ ...orientaciones, metodologia: value });
            return;
        }
        setOrientaciones({
            ...orientaciones,
            [category]: {
                ...(orientaciones[category] as any),
                [field]: value
            }
        });
    };

    const handleSugerirIA = async () => {
        setLoadingIA(true);
        try {
            const compIds = Object.keys(planActivo.matrizCompetencias || {}).filter(k => planActivo.matrizCompetencias[k].some(Boolean));
            const contexto = `
DATOS DEL PLAN:
- Área Curricular: ${planActivo.area}
- Nivel: ${planActivo.nivel}
- Grado: ${planActivo.grado}
- Competencias seleccionadas (cantidad): ${compIds.length}
- Contexto del aula (Cognitivo): Nivel ${planActivo.diagnostico?.caracteristicas?.cognitivo?.nivel || 'N/A'}/5. 
- Intereses del grupo: ${planActivo.diagnostico?.estilos?.intereses?.join(', ') || 'No definidos'}
- Calendario y recursos del entorno: ${planActivo.calendarioComunal || 'Local/Regional'}
`;

            const prompt = `Actúa como especialista en currículo del Ministerio de Educación del Perú (MINEDU). Utiliza lenguaje técnico, claro, coherente y alineado al Currículo Nacional de la Educación Básica (CNEB).
Escribe SIEMPRE en tercera persona, mantén un tono profesional y pedagógico, evita frases genéricas, adapta el contenido al contexto dado y no inventes normativa.

${contexto}

Deberás generar contenido para las siguientes secciones cumpliendo con esta estructura estricta:

1. ORIENTACIONES METODOLÓGICAS (un solo párrafo cohesionado abordando lo siguiente):
- Estrategias metodológicas activas (ABP, indagación, trabajo colaborativo, resolución de problemas, aprendizaje autónomo).
- Enfoque por competencias del CNEB.
- Enfoques transversales pertinentes (interculturalidad, igualdad de género, ambiente, derechos humanos, etc.).
- Atención a la diversidad (ritmos, estilos, necesidades educativas).
- Uso de recursos del entorno y TIC.
- Adaptación al área, grado y contexto proporcionado por el usuario.

2. ORIENTACIONES PARA LA EVALUACIÓN
- Evaluación Diagnóstica: Qué se evaluará al inicio, qué instrumentos se usarán, cómo se usará la información.
- Evaluación Formativa: Cómo se evaluará durante el proceso, qué instrumentos se emplearán (rúbricas, listas de cotejo, portafolios, registros), cómo se brindará retroalimentación descriptiva y oportuna, cómo se promoverá la autorregulación.
- Evaluación Sumativa: Cómo se valorarán los logros al cierre, qué evidencias integradoras se analizarán, cómo se determinará el nivel de desarrollo de las competencias.

3. RECURSOS
- Para el Docente: Currículo Nacional, Programas curriculares, Guías MINEDU, TIC, bibliografía, materiales institucionales, recursos del entorno.
- Para el Estudiante: Cuadernos de trabajo del MINEDU, fichas, materiales del entorno, recursos digitales, kits específicos del área, herramientas prácticas. Generar como lista con viñetas.

Devuelve EXCLUSIVAMENTE un JSON válido con esta estructura:
{
  "metodologia": "Párrafo según punto 1...",
  "evaluacion": {
    "diagnostica": "Explicación según punto 2.1...",
    "formativa": "Explicación según punto 2.2...",
    "sumativa": "Explicación según punto 2.3..."
  },
  "recursos": {
    "paraDocente": "- Currículo Nacional...\\n- ...",
    "paraEstudiante": "- Cuadernos de trabajo...\\n- ..."
  }
}`;

            const apiKey = await getDecryptedApiKey();
            const result = await chatCompletion('Eres un asistente experto que solo devuelve JSON.', prompt, {
                provider: aiConfig.provider,
                model: aiConfig.activeModel,
                apiKey,
                customUrl: aiConfig.lmstudioUrl,
                responseFormat: 'json',
                maxTokens: 4096
            });

            // Recuperación de JSON robusta
            let data: any = result;
            if (typeof result === 'string') {
                const jsonMatch = result.match(/\{[\s\S]*\}/);
                const cleaned = jsonMatch ? jsonMatch[0] : result;
                try {
                    data = JSON.parse(cleaned);
                } catch (e) {
                    try {
                        const minified = cleaned.replace(/[\n\r]/g, ' ');
                        data = JSON.parse(minified);
                    } catch (e2) {
                        throw new Error("Formato inválido devuelto por la IA. Reintenta.");
                    }
                }
            }

            if (data.evaluacion && data.recursos && data.metodologia !== undefined) {
                setOrientaciones((prev) => ({
                    ...prev,
                    metodologia: data.metodologia,
                    evaluacion: data.evaluacion,
                    recursos: data.recursos
                }));
                showNotification({ title: 'Éxito', message: 'Orientaciones y recursos generados', type: 'success' });
            } else {
                throw new Error("La IA no devolvió todos los campos requeridos.");
            }
        } catch (error: any) {
            showNotification({ title: 'Error IA', message: error.message, type: 'error' });
        } finally {
            setLoadingIA(false);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-fade-in pb-48">
            <ModuleHeader 
                module="M05"
                title="Orientaciones y Recursos"
                subtitle="Directrices metodológicas y materiales educativos para el año."
                syncStatus={isSyncing ? 'syncing' : 'synced'}
                actions={[
                    <AIButton onClick={handleSugerirIA} isLoading={loadingIA} variant="magenta" tooltip="Generar TODAS las orientaciones y recursos con IA (Formato MINEDU)" />
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1.5.0 — Orientaciones Metodológicas (NEW) */}
                <Card variant="strong" className="lg:col-span-2">
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle>5.1 Orientaciones Metodológicas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            className="w-full h-32 bg-surface-card border border-white/5 rounded-2xl p-4 text-xs text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-teal/30 custom-scrollbar"
                            placeholder="Ej. Se promoverá el aprendizaje basado en proyectos (ABP), el trabajo colaborativo..."
                            value={orientaciones.metodologia || ''}
                            onChange={(e) => updateNested('metodologia', '', e.target.value)}
                        />
                    </CardContent>
                </Card>

                {/* 1.5.1 — Orientaciones para la Evaluación */}
                <Card variant="strong">
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle>5.2 Orientaciones para la Evaluación</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Evaluación Diagnóstica</label>
                            <textarea
                                className="w-full h-24 bg-surface-card border border-white/5 rounded-2xl p-4 text-xs text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-teal/30 custom-scrollbar"
                                value={orientaciones.evaluacion.diagnostica}
                                onChange={(e) => updateNested('evaluacion', 'diagnostica', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Evaluación Formativa</label>
                            <textarea
                                className="w-full h-24 bg-surface-card border border-white/5 rounded-2xl p-4 text-xs text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-teal/30 custom-scrollbar"
                                value={orientaciones.evaluacion.formativa}
                                onChange={(e) => updateNested('evaluacion', 'formativa', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Evaluación Sumativa</label>
                            <textarea
                                className="w-full h-24 bg-surface-card border border-white/5 rounded-2xl p-4 text-xs text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-teal/30 custom-scrollbar"
                                value={orientaciones.evaluacion.sumativa}
                                onChange={(e) => updateNested('evaluacion', 'sumativa', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 1.4.2 — Recursos y Materiales */}
                <div className="space-y-8">
                    <Card variant="strong">
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle>5.3 Recursos y Materiales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                className="w-full h-32 bg-surface-card border border-white/5 rounded-2xl p-4 text-xs text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-teal/30 custom-scrollbar"
                                placeholder="Ej. Currículo Nacional, Guías de Aprendizaje, Laptop..."
                                value={orientaciones.recursos.paraDocente}
                                onChange={(e) => updateNested('recursos', 'paraDocente', e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    <Card variant="strong">
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle>Recursos para el Estudiante</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                className="w-full h-32 bg-surface-card border border-white/5 rounded-2xl p-4 text-xs text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-teal/30 custom-scrollbar"
                                placeholder="Ej. Cuadernos de trabajo, kit de robótica, materiales del entorno..."
                                value={orientaciones.recursos.paraEstudiante}
                                onChange={(e) => updateNested('recursos', 'paraEstudiante', e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    {/* Final Action */}
                    <Card variant="strong" className="bg-gradient-to-br from-brand-magenta/10 to-transparent border-brand-magenta/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-white mb-1">¡Plan Anual Completado!</p>
                                <p className="text-xs text-gray-500">Ya puedes exportar tu documento oficial.</p>
                            </div>
                            <NeonButton
                                variant="magenta"
                                icon="description"
                                onClick={() => navigate('/plan-anual/preview')}
                            >
                                EXPORTAR WORD
                            </NeonButton>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

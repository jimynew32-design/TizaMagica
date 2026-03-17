import React, { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { AIButton } from '@/components/ui/AIButton';
import { TabSwitch } from '@/components/ui/TabSwitch';
import { cn } from '@/lib/cn';
import { MatrizContexto, Impacto, DiagnosticoIntegral, EstilosIntereses, Estudiante, CATEGORIAS_NEE, TipoNEE, NivelLogro } from '@/types/schemas';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { usePlanAnualStore, useAIConfigStore, useNotificationStore } from '@/store';
import { useDebounce } from '@/hooks/ui/useDebounce';
import { chatCompletion } from '@/services/ai';
import { PROMPTS } from '@/services/ai/prompts';

const AMBITOS = ['familiar', 'grupal', 'local', 'regional', 'nacional'] as const;
const ASPECTOS = ['cultural', 'economico', 'ambiental'] as const;

export const DiagnosticoIntegralEditor: React.FC = () => {
    const { planActivo, updatePlan, isSyncing } = usePlanAnualStore();
    const { aiConfig, getDecryptedApiKey } = useAIConfigStore();
    const { showNotification } = useNotificationStore();
    const [activeTab, setActiveTab] = useState<'contexto' | 'caracteristicas' | 'estilos' | 'estudiantes'>(
        (localStorage.getItem('planx_diagnostico_tab') as any) || 'contexto'
    );
    const [loadingIA, setLoadingIA] = useState(false);
    const [loadingEstilos, setLoadingEstilos] = useState(false);
    const [loadingEIB, setLoadingEIB] = useState(false);

    // Contexto (Heatmap)
    const [perfilContexto, setPerfilContexto] = useState(planActivo?.diagnostico.perfilContexto || 'Urbano-Marginal');
    const [ubicacion, setUbicacion] = useState(planActivo?.diagnostico.ubicacion || '');
    const [matriz, setMatriz] = useState<MatrizContexto>(planActivo?.diagnostico.contexto || {
        familiar: { cultural: { texto: '', impacto: 'neutro' }, economico: { texto: '', impacto: 'neutro' }, ambiental: { texto: '', impacto: 'neutro' } },
        grupal: { cultural: { texto: '', impacto: 'neutro' }, economico: { texto: '', impacto: 'neutro' }, ambiental: { texto: '', impacto: 'neutro' } },
        local: { cultural: { texto: '', impacto: 'neutro' }, economico: { texto: '', impacto: 'neutro' }, ambiental: { texto: '', impacto: 'neutro' } },
        regional: { cultural: { texto: '', impacto: 'neutro' }, economico: { texto: '', impacto: 'neutro' }, ambiental: { texto: '', impacto: 'neutro' } },
        nacional: { cultural: { texto: '', impacto: 'neutro' }, economico: { texto: '', impacto: 'neutro' }, ambiental: { texto: '', impacto: 'neutro' } },
    } as MatrizContexto);

    // Características
    const [caracteristicas, setCaracteristicas] = useState(planActivo?.diagnostico.caracteristicas || {
        cognitivo: { nivel: 3, texto: '' },
        fisico: { nivel: 3, texto: '' },
        emocional: { nivel: 3, texto: '' },
        observacionesGrupo: ''
    });

    const CICLO_EDADES: Record<string, [number, number]> = {
        'Ciclo I': [0, 2], 'Ciclo II': [3, 5], 'Ciclo III': [6, 7],
        'Ciclo IV': [8, 9], 'Ciclo V': [10, 11], 'Ciclo VI': [12, 13], 'Ciclo VII': [14, 16]
    };


    const [estilos, setEstilos] = useState<EstilosIntereses>(() => {
        const base = planActivo?.diagnostico.estilos;
        const ages = CICLO_EDADES[planActivo?.ciclo || ''] || [6, 11];
        if (!base) return {
            intereses: [], estrategias: '',
            edadMin: ages[0], edadMax: ages[1],
            idiomas: [{ etiqueta: 'L1', valor: 'Castellano' }, { etiqueta: 'L2', valor: 'No especificada' }],
            escenarioEIB: 'Escenario 1: Monolingüe', diagnosticoSociolinguistico: '',
        };
        // Migration logic for old fields
        if (!base.idiomas || base.idiomas.length === 0) {
            return {
                ...base,
                idiomas: [
                    { etiqueta: 'L1', valor: (base as any).lenguaMaterna || 'Castellano' },
                    { etiqueta: 'L2', valor: (base as any).segundaLengua || 'No especificada' }
                ]
            } as EstilosIntereses;
        }
        return base as EstilosIntereses;
    });

    const [interesInput, setInteresInput] = useState('');
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>(planActivo?.diagnostico.estudiantes || []);

    const debouncedMatriz = useDebounce(matriz, 1000);
    const debouncedCarac = useDebounce(caracteristicas, 1000);
    const debouncedEstilos = useDebounce(estilos, 1000);
    const debouncedPerfil = useDebounce(perfilContexto, 1000);
    const debouncedUbicacion = useDebounce(ubicacion, 1000);
    const debouncedEstudiantes = useDebounce(estudiantes, 1000);


    // BUG-08 fix: Resync local state when switching plans
    useEffect(() => {
        if (planActivo) {
            setPerfilContexto(planActivo.diagnostico.perfilContexto || 'Urbano-Marginal');
            setUbicacion(planActivo.diagnostico.ubicacion || '');
            setMatriz(planActivo.diagnostico.contexto || {
                familiar: { cultural: { texto: '', impacto: 'neutro' }, economico: { texto: '', impacto: 'neutro' }, ambiental: { texto: '', impacto: 'neutro' } },
                grupal: { cultural: { texto: '', impacto: 'neutro' }, economico: { texto: '', impacto: 'neutro' }, ambiental: { texto: '', impacto: 'neutro' } },
                local: { cultural: { texto: '', impacto: 'neutro' }, economico: { texto: '', impacto: 'neutro' }, ambiental: { texto: '', impacto: 'neutro' } },
                regional: { cultural: { texto: '', impacto: 'neutro' }, economico: { texto: '', impacto: 'neutro' }, ambiental: { texto: '', impacto: 'neutro' } },
                nacional: { cultural: { texto: '', impacto: 'neutro' }, economico: { texto: '', impacto: 'neutro' }, ambiental: { texto: '', impacto: 'neutro' } },
            } as MatrizContexto);
            setCaracteristicas(planActivo.diagnostico.caracteristicas || {
                cognitivo: { nivel: 3, texto: '' },
                fisico: { nivel: 3, texto: '' },
                emocional: { nivel: 3, texto: '' },
                observacionesGrupo: ''
            });

            setEstilos(planActivo.diagnostico.estilos?.idiomas ? planActivo.diagnostico.estilos : {
                ...planActivo.diagnostico.estilos,
                idiomas: [
                    { etiqueta: 'L1', valor: (planActivo.diagnostico.estilos as any).lenguaMaterna || 'Castellano' },
                    { etiqueta: 'L2', valor: (planActivo.diagnostico.estilos as any).segundaLengua || 'No especificada' }
                ]
            } as EstilosIntereses);

            setEstudiantes(planActivo.diagnostico.estudiantes || []);
        }
    }, [planActivo?.id]);

    useEffect(() => {
        if (planActivo) {
            const newDiagnostico: DiagnosticoIntegral = {
                perfilContexto: debouncedPerfil,
                ubicacion: debouncedUbicacion,
                contexto: debouncedMatriz,
                caracteristicas: debouncedCarac,
                estilos: debouncedEstilos,
                estudiantes: debouncedEstudiantes,
                cantidadEstudiantes: debouncedEstudiantes.length // Sincronización automática
            };
            updatePlan(planActivo.id, { diagnostico: newDiagnostico });
        }
    }, [debouncedMatriz, debouncedCarac, debouncedEstilos, debouncedPerfil, debouncedUbicacion, debouncedEstudiantes]);

    const handleImpactChange = (ambito: typeof AMBITOS[number], aspecto: typeof ASPECTOS[number], impacto: Impacto) => {
        setMatriz(prev => ({
            ...prev,
            [ambito]: {
                ...prev[ambito],
                [aspecto]: { ...prev[ambito][aspecto], impacto }
            }
        }));
    };

    const handlePoblarConIA = async () => {
        try {
            if (!ubicacion) {
                showNotification({
                    title: 'Falta Información',
                    message: 'Por favor, ingresa una ubicación específica (ej. Cusco, Calca) para que la IA entienda el contexto.',
                    type: 'warning'
                });
                return;
            }

            showNotification({
                title: 'Sistema Activo',
                message: 'Estamos conectando con la IA experta. Por favor espera unos segundos...',
                type: 'info'
            });
            setLoadingIA(true);

            const mapaImpacto: any = {};
            AMBITOS.forEach(amb => {
                mapaImpacto[amb] = {};
                ASPECTOS.forEach(asp => {
                    mapaImpacto[amb][asp] = matriz[amb][asp].impacto;
                });
            });

            const userPrompt = PROMPTS.POBLAR_CONTEXTO(perfilContexto, ubicacion, mapaImpacto);
            const systemPrompt = "Eres un especialista curricular peruano. Genera un JSON estrictamente válido.";

            const apiKey = await getDecryptedApiKey();
            const result = await chatCompletion(systemPrompt, userPrompt, {
                provider: aiConfig.provider,
                model: aiConfig.activeModel,
                apiKey: apiKey,
                customUrl: aiConfig.lmstudioUrl,
                maxTokens: 4096,
                temperature: 0.2
            });

            if (!result) {
                showNotification({
                    title: 'Error de Conexión',
                    message: 'No se recibió respuesta del servidor de IA. Revisa tu internet o la validez de tu API Key.',
                    type: 'error'
                });
                return;
            }

            let cleanResult = result;
            if (typeof result === 'string') {
                try {
                    const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```|{[\s\S]*}/);
                    if (jsonMatch && jsonMatch[1]) {
                        cleanResult = JSON.parse(jsonMatch[1]);
                    } else if (jsonMatch && jsonMatch[0]) {
                        cleanResult = JSON.parse(jsonMatch[0]);
                    }
                } catch (e) { console.error(e); }
            }

            const findInData = (data: any, key: string) => {
                if (!data) return null;
                const lowerKey = key.toLowerCase();
                const foundKey = Object.keys(data).find(k => k.toLowerCase() === lowerKey);
                return foundKey ? data[foundKey] : null;
            };

            const nextMatriz = JSON.parse(JSON.stringify(matriz));
            AMBITOS.forEach(amb => {
                const ambData = findInData(cleanResult, amb);
                if (!ambData) return;
                ASPECTOS.forEach(asp => {
                    const cellContent = findInData(ambData, asp);
                    if (!cellContent) return;
                    if (typeof cellContent === 'string' && cellContent.trim()) {
                        nextMatriz[amb][asp].texto = cellContent.trim();
                    } else if (typeof cellContent === 'object' && cellContent !== null) {
                        const newText = cellContent.texto || cellContent.descripcion || cellContent.contenido;
                        if (newText && typeof newText === 'string') {
                            nextMatriz[amb][asp].texto = newText.trim();
                        }
                        if (cellContent.impacto && ['positivo', 'neutro', 'negativo'].includes(cellContent.impacto)) {
                            nextMatriz[amb][asp].impacto = cellContent.impacto;
                        }
                    }
                });
            });

            setMatriz(nextMatriz);
            showNotification({
                title: 'Matriz Poblada',
                message: '¡Éxito! La IA ha generado el análisis de contexto correctamente.',
                type: 'success',
                duration: 3000
            });

        } catch (error: any) {
            console.error(error);
            showNotification({ title: 'Error de IA', message: error.message, type: 'error' });
        } finally {
            setLoadingIA(false);
        }
    };

    const handleGenerarCaracteristicasConIA = async () => {
        try {
            if (!caracteristicas.observacionesGrupo.trim()) {
                showNotification({
                    title: 'Observaciones Vacías',
                    message: 'Describe primero algunas observaciones del grupo en el campo de texto para que la IA pueda analizarlas.',
                    type: 'warning'
                });
                return;
            }
            showNotification({ title: 'Analizando Grupo', message: 'Generando perfil técnico...', type: 'info' });
            setLoadingIA(true);

            const niveles = { cognitivo: caracteristicas.cognitivo.nivel, fisico: caracteristicas.fisico.nivel, emocional: caracteristicas.emocional.nivel };
            const systemPrompt = "Eres un psicólogo educativo experto en CNEB. Genera un JSON estrictamente válido.";
            const userPrompt = PROMPTS.POBLAR_CARACTERISTICAS(planActivo?.area || 'General', planActivo?.grado || 'Secundaria', caracteristicas.observacionesGrupo, niveles);

            const apiKey = await getDecryptedApiKey();
            const result = await chatCompletion(systemPrompt, userPrompt, {
                provider: aiConfig.provider,
                model: aiConfig.activeModel,
                apiKey: apiKey,
                customUrl: aiConfig.lmstudioUrl,
                maxTokens: 3000
            });

            if (result?.cognitivo) {
                setCaracteristicas(prev => ({
                    ...prev,
                    cognitivo: { ...prev.cognitivo, texto: result.cognitivo },
                    fisico: { ...prev.fisico, texto: result.fisico },
                    emocional: { ...prev.emocional, texto: result.emocional }
                }));
                showNotification({ title: 'Perfil Generado', message: 'Datos actualizados con lenguaje técnico.', type: 'success', duration: 3000 });
            } else { throw new Error('Formato inválido'); }
        } catch (error: any) {
            showNotification({ title: 'Error de Redacción', message: 'Revisa tu conexión de IA.', type: 'error' });
        } finally { setLoadingIA(false); }
    };

    const handleGenerarEstilosConIA = async (skipLoading = false) => {
        try {
            if (!planActivo?.area) {
                showNotification({ title: 'Falta Área', message: 'No se detectó el área curricular.', type: 'error' });
                return;
            }

            if (!skipLoading) setLoadingIA(true);
            setLoadingEstilos(true);
            const apiKey = await getDecryptedApiKey();


            const systemPrompt = 'Eres un experto en pedagogía. Tu tarea es generar estrategias DIDÁCTICAS basadas en los INTERESES de los estudiantes. NO redactes diagnósticos lingüísticos ni hables de la situación de las lenguas (eso va en la sección EIB). Sé directo y usa los intereses como motor del aprendizaje.';
            const userPrompt = PROMPTS.POBLAR_ESTILOS(
                planActivo.area,
                estilos.edadMin,
                estilos.edadMax,
                estilos.intereses,
                caracteristicas.cognitivo.nivel,
                estilos.idiomas
            );

            const result: string = await chatCompletion(systemPrompt, userPrompt, {
                provider: aiConfig.provider,
                model: aiConfig.activeModel,
                apiKey: apiKey,
                customUrl: aiConfig.lmstudioUrl,
                maxTokens: 4000,
                responseFormat: 'text'
            });

            // Fallback seguro extraído del texto estructurado
            let estrategiasText = '';
            let interesesText = '';

            try {
                // Buscar [ESTRATEGIAS] hasta [INTERESES] o fin de texto
                const estrMatch = result.match(/\[ESTRATEGIAS\]\s*([\s\S]*?)(?:\[INTERESES\]|$)/i);
                if (estrMatch && estrMatch[1]) {
                    estrategiasText = estrMatch[1].trim();
                }

                // Buscar [INTERESES] hasta el final
                const intMatch = result.match(/\[INTERESES\]\s*([\s\S]*?)$/i);
                if (intMatch && intMatch[1]) {
                    interesesText = intMatch[1].trim();
                }
            } catch (e) {
                console.warn('Regex fallback error:', e);
            }

            // Fallback hiper-robusto por si a pesar del prompt, lo mandan en otro formato
            if (!estrategiasText) estrategiasText = result.replace(/\[.*?\]/g, '').trim();
            const interesesArray = interesesText ? interesesText.split('|').map(s => s.trim()).filter(Boolean) : [];

            if (estrategiasText) {
                setEstilos(prev => {
                    const interesesFusion = Array.from(new Set([...prev.intereses, ...interesesArray]));
                    return {
                        ...prev,
                        estrategias: estrategiasText,
                        intereses: interesesFusion
                    };
                });
                if (!skipLoading) showNotification({ title: 'Perfil Listo', message: 'Estrategias e intereses actualizados con un 100% de fiabilidad.', type: 'success', duration: 4000 });
            } else {
                throw new Error('La respuesta de la IA estaba vacía o incomprensible.');
            }
        } catch (error: any) {
            console.error('Error en Generar Estilos:', error);
            showNotification({ title: 'Error en Estilos', message: error.message || 'Error desconocido al generar estrategias.', type: 'error' });
        } finally {
            if (!skipLoading) setLoadingIA(false);
            setLoadingEstilos(false);
        }
    };

    const handleGenerarSociolinguisticoConIA = async (skipLoading = false) => {
        if (estilos.idiomas.length === 0) return;

        try {
            if (!skipLoading) setLoadingIA(true);
            setLoadingEIB(true);
            const apiKey = await getDecryptedApiKey();

            const contextMat = matriz;
            const systemPrompt = 'Redacta el diagnóstico sociolingüístico EIB en un SOLAMENTE un párrafo único, fluido y descriptivo. No uses listas ni viñetas. Sintetiza la realidad lingüística y el reto pedagógico en un solo bloque de texto.';
            const userPrompt = PROMPTS.POBLAR_LENGUAJE(estilos.idiomas, estilos.escenarioEIB, contextMat);

            const textResult: string = await chatCompletion(systemPrompt, userPrompt, {
                provider: aiConfig.provider,
                model: aiConfig.activeModel,
                apiKey: apiKey,
                customUrl: aiConfig.lmstudioUrl,
                maxTokens: 4000,
                responseFormat: 'text'
            });

            if (textResult && textResult.length > 20) {
                setEstilos(prev => ({ ...prev, diagnosticoSociolinguistico: textResult.trim() }));
                if (!skipLoading) showNotification({ title: 'Diagnóstico EIB Listo', message: 'Realidad lingüística actualizada.', type: 'success', duration: 3000 });
            } else {
                throw new Error('La respuesta de la IA fue demasiado corta o inválida.');
            }
        } catch (error: any) {
            console.error('Error en Generar EIB:', error);
            showNotification({ title: 'Error EIB', message: error.message || 'No se pudo generar el diagnóstico sociolingüístico.', type: 'error' });
        } finally {
            if (!skipLoading) setLoadingIA(false);
            setLoadingEIB(false);
        }
    };

    const handleMasterAI = async () => {
        setLoadingIA(true);
        try {
            if (activeTab === 'contexto') {
                await handlePoblarConIA();
            } else if (activeTab === 'caracteristicas') {
                await handleGenerarCaracteristicasConIA();
            } else {
                // Ejecución SECUENCIAL: evita competencia de tokens entre llamadas paralelas
                await handleGenerarEstilosConIA(true);
                await handleGenerarSociolinguisticoConIA(true);
                showNotification({
                    title: 'Sección M01 Lista',
                    message: 'Perfil de aprendizaje y diagnóstico EIB actualizados correctamente.',
                    type: 'success'
                });
            }
        } finally {
            setLoadingIA(false);
        }
    };

    return (
        <div className="space-y-12 animate-fade-in pb-24">
            <ModuleHeader 
                module="M01"
                title="Diagnóstico Integral"
                subtitle="Análisis del contexto, características y matrícula de los estudiantes."
                syncStatus={isSyncing ? 'syncing' : 'synced'}
                className="px-2 md:px-0"
                actions={[
                    <TabSwitch
                        options={[
                            { value: 'contexto', label: '1.1 CONTEXTO', icon: 'location_on' },
                            { value: 'caracteristicas', label: '1.2 CARACTERÍSTICAS', icon: 'person' },
                            { value: 'estilos', label: '1.3 ESTILOS/EIB', icon: 'translate' },
                            { value: 'estudiantes', label: '1.4 MATRÍCULA', icon: 'group' },
                        ]}
                        value={activeTab}
                        onChange={(val) => setActiveTab(val as any)}
                        variant="magenta"
                    />,
                    <AIButton 
                        variant="magenta" 
                        isLoading={loadingIA} 
                        onClick={handleMasterAI} 
                        size="md" 
                        label="INTELIGENCIA" // Añadido label para mejor usabilidad táctil en móviles
                        className="w-full sm:w-auto"
                    />
                ]}
            />

            {/* Renderizado de pestañas */}
            {activeTab === 'contexto' && (
                <div className="grid grid-cols-1 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                    <Card variant="glass">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-4">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-primary-teal uppercase tracking-[0.2em] pl-1">Perfil de Contexto</label>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['Urbano', 'Urbano-Marginal', 'Rural', 'Rural-EIB', 'Frontera'].map(p => (
                                            <button key={p} onClick={() => setPerfilContexto(p)} className={cn("px-4 py-2 rounded-xl text-[10px] font-black transition-all border", perfilContexto === p ? "bg-primary-teal border-primary-teal text-gray-900 shadow-lg shadow-primary-teal/20" : "bg-white/5 border-white/5 text-gray-500 hover:text-white")}>{p}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-primary-teal uppercase tracking-[0.2em] pl-1">Ubicación Específica</label>
                                    </div>
                                    <input type="text" placeholder="Ej. Ayacucho, Huamanga" className="w-full bg-surface-card border border-white/5 rounded-2xl p-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-teal/40" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </Card>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {ASPECTOS.map(asp => (
                            <Card key={asp} variant="strong" className="flex flex-col">
                                <CardTitle className="capitalize">{asp}</CardTitle>
                                <div className="flex-1 space-y-4">
                                    {AMBITOS.map(amb => (
                                        <div key={amb} className="space-y-2">
                                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{amb}</label>
                                            <div className="flex gap-2">
                                                <textarea className="flex-1 bg-surface-card border border-white/5 rounded-xl p-3 text-xs text-gray-300 h-20 resize-none focus:outline-none focus:border-primary-teal/30 transition-colors" value={matriz[amb][asp].texto} onChange={(e) => setMatriz(prev => ({ ...prev, [amb]: { ...prev[amb], [asp]: { ...prev[amb][asp], texto: e.target.value } } }))} />
                                                <div className="flex flex-col gap-1">
                                                    {(['positivo', 'neutro', 'negativo'] as Impacto[]).map(imp => (
                                                        <button key={imp} onClick={() => handleImpactChange(amb, asp, imp)} className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-all", matriz[amb][asp].impacto === imp ? (imp === 'positivo' ? "bg-emerald-500 text-white" : imp === 'negativo' ? "bg-red-500 text-white" : "bg-primary-teal text-gray-900") : "bg-white/5 text-gray-500 hover:text-white")}>
                                                            <span className="material-icons-round text-[14px]">{imp === 'positivo' ? 'add' : imp === 'negativo' ? 'remove' : 'drag_handle'}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'caracteristicas' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <Card variant="glass">
                        <div className="flex flex-col lg:flex-row gap-8">
                            <div className="w-full lg:w-1/3 space-y-8 p-4">
                                {(['cognitivo', 'fisico', 'emocional'] as const).map(dim => (
                                    <div key={dim} className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-primary-teal uppercase tracking-[0.2em]">{dim}</label>
                                            <span className="text-xl font-black text-white">{caracteristicas[dim].nivel}</span>
                                        </div>
                                        <input type="range" min="1" max="5" value={caracteristicas[dim].nivel} onChange={e => setCaracteristicas(prev => ({ ...prev, [dim]: { ...prev[dim], nivel: parseInt(e.target.value) } }))} className="w-full transition-all accent-primary-teal" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-primary-teal uppercase tracking-[0.2em]">Observaciones del Docente</label>
                                    <AIButton 
                                        variant="magenta" 
                                        isLoading={loadingIA} 
                                        onClick={handleGenerarCaracteristicasConIA} 
                                        size="sm"
                                        tooltip="Sugerir análisis técnico"
                                    />
                                </div>
                                <textarea className="w-full h-full bg-surface-card border border-white/5 rounded-2xl p-6 text-sm text-white placeholder:text-gray-700 min-h-[300px]" placeholder="Escribe lo que observas en tu grupo..." value={caracteristicas.observacionesGrupo} onChange={e => setCaracteristicas(prev => ({ ...prev, observacionesGrupo: e.target.value }))} />
                            </div>
                        </div>
                    </Card>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(['cognitivo', 'fisico', 'emocional'] as const).map(dim => (
                            <Card key={dim} variant="strong">
                                <CardTitle className="capitalize">{dim}</CardTitle>
                                <textarea className="w-full h-48 bg-transparent border border-white/5 rounded-2xl p-4 text-xs text-gray-300" value={caracteristicas[dim].texto} onChange={e => setCaracteristicas(prev => ({ ...prev, [dim]: { ...prev[dim], texto: e.target.value } }))} />
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'estilos' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card variant="glass" className="p-8">
                            <CardTitle className="mb-6">Perfil de Aprendizaje</CardTitle>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><label className="text-[10px] uppercase font-black text-gray-500">Edad Mínima</label><input type="number" className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-white" value={estilos.edadMin} onChange={e => setEstilos(prev => ({ ...prev, edadMin: parseInt(e.target.value) }))} /></div>
                                    <div className="space-y-2"><label className="text-[10px] uppercase font-black text-gray-500">Edad Máxima</label><input type="number" className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-white" value={estilos.edadMax} onChange={e => setEstilos(prev => ({ ...prev, edadMax: parseInt(e.target.value) }))} /></div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-primary-teal uppercase tracking-[0.2em]">Sugerencias de Intereses</label>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-white/5 rounded-xl bg-white/5 custom-scrollbar">
                                        {[
                                            'Uso de redes sociales', 'Videojuegos y e-sports', 'Cuidado del medio ambiente',
                                            'Música urbana y danza', 'Emprendimiento escolar', 'Deportes de equipo',
                                            'Robótica y tecnología', 'Gastronomía local', 'Identidad cultural',
                                            'Problemáticas sociales', 'Ciencia y experimentos', 'Lectura de sagas'
                                        ].map(interes => (
                                            <button
                                                key={interes}
                                                onClick={() => {
                                                    if (!estilos.intereses.includes(interes)) {
                                                        setEstilos(prev => ({ ...prev, intereses: [...prev.intereses, interes] }));
                                                    }
                                                }}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                                                    estilos.intereses.includes(interes)
                                                        ? "bg-primary-teal/20 border-primary-teal text-primary-teal"
                                                        : "bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20"
                                                )}
                                            >
                                                + {interes}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-primary-teal uppercase tracking-[0.2em]">Intereses del Grupo</label>
                                    <div className="flex gap-2"><input type="text" className="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 text-xs" placeholder="O escribe uno personalizado..." value={interesInput} onChange={e => setInteresInput(e.target.value)} onKeyPress={e => { if (e.key === 'Enter') { setEstilos(prev => ({ ...prev, intereses: [...prev.intereses, interesInput] })); setInteresInput(''); } }} /><button onClick={() => { if (interesInput.trim()) { setEstilos(prev => ({ ...prev, intereses: [...prev.intereses, interesInput] })); setInteresInput(''); } }} className="px-4 bg-primary-teal text-gray-900 rounded-xl font-black">Añadir</button></div>
                                    <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                        {estilos.intereses.length === 0 ? (
                                            <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No hay intereses añadidos</p>
                                            </div>
                                        ) : (
                                            estilos.intereses.map((i, idx) => (
                                                <div
                                                    key={idx}
                                                    className="group flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-primary-teal/30 transition-all animate-in slide-in-from-left-2 duration-300"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-lg bg-primary-teal/10 flex items-center justify-center text-primary-teal text-[10px] font-black group-hover:bg-primary-teal group-hover:text-gray-900 transition-colors">
                                                            {idx + 1}
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">{i}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setEstilos(prev => ({ ...prev, intereses: prev.intereses.filter((_, x) => x !== idx) }))}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <span className="material-icons-round text-lg">delete_outline</span>
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-primary-teal uppercase tracking-[0.2em]">Estrategias Recomendadas</label>
                                        <AIButton 
                                            variant="magenta" 
                                            isLoading={loadingEstilos} 
                                            onClick={() => handleGenerarEstilosConIA()} 
                                            size="sm"
                                            tooltip="Sugerir estrategias personalizadas"
                                        />
                                    </div>
                                    <div className="relative">
                                        <textarea
                                            className="w-full h-64 bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20 transition-all resize-none"
                                            placeholder="Las estrategias se generarán automáticamente al usar el botón IA..."
                                            value={estilos.estrategias}
                                            onChange={e => setEstilos(prev => ({ ...prev, estrategias: e.target.value }))}
                                        />
                                        {loadingEstilos && (
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center z-20 animate-in fade-in duration-300">
                                                <div className="flex items-center gap-3 px-6 py-3 bg-gray-900/90 rounded-full border border-white/10 shadow-[0_0_30px_rgba(79,209,197,0.2)]">
                                                    <span className="material-icons-round animate-spin text-primary-teal text-xl">psychology</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Generando Perfil</span>
                                                        <span className="text-[8px] text-gray-500 font-bold uppercase mt-1">IA está redactando estrategias...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card variant="glass" className="p-8">
                            <CardTitle className="mb-6">Diagnóstico EIB / Sociolingüístico</CardTitle>
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-primary-teal uppercase tracking-[0.2em]">Escenario EIB</label>
                                    <select className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary-teal transition-all" value={estilos.escenarioEIB} onChange={e => setEstilos(prev => ({ ...prev, escenarioEIB: e.target.value }))}>
                                        {['Escenario 1: Monolingüe', 'Escenario 2: Revitalización', 'Escenario 3: Fortalecimiento'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-primary-teal uppercase tracking-[0.2em]">Idiomas y Lenguas</label>
                                        <button
                                            onClick={() => setEstilos(prev => ({
                                                ...prev,
                                                idiomas: [...prev.idiomas, { etiqueta: `L${prev.idiomas.length + 1}`, valor: 'No especificada' }]
                                            }))}
                                            className="px-3 py-1 bg-primary-teal/10 hover:bg-primary-teal/20 text-primary-teal text-[9px] font-black rounded-lg border border-primary-teal/20 transition-all uppercase tracking-widest"
                                        >
                                            + Añadir Lengua
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {estilos.idiomas.map((idioma, idx) => (
                                            <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3 relative group">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{idioma.etiqueta}</span>
                                                    {idx > 1 && (
                                                        <button
                                                            onClick={() => setEstilos(prev => ({ ...prev, idiomas: prev.idiomas.filter((_, i) => i !== idx) }))}
                                                            className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <span className="material-icons-round text-sm">close</span>
                                                        </button>
                                                    )}
                                                </div>
                                                <select
                                                    className="w-full bg-surface-card border border-white/5 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-teal transition-all custom-select"
                                                    value={idioma.valor}
                                                    onChange={e => {
                                                        const newIdiomas = [...estilos.idiomas];
                                                        newIdiomas[idx] = { ...newIdiomas[idx], valor: e.target.value };
                                                        setEstilos(prev => ({ ...prev, idiomas: newIdiomas }));
                                                    }}
                                                >
                                                    <option value="" disabled>Seleccione idioma</option>
                                                    <option value="No especificada">No especificada</option>
                                                    <option value="Castellano">Castellano</option>
                                                    <optgroup label="Lenguas Originarias (Andinas)">
                                                        <option value="Quechua Collao">Quechua Collao</option>
                                                        <option value="Quechua Chanca">Quechua Chanca</option>
                                                        <option value="Quechua Central">Quechua Central</option>
                                                        <option value="Quechua Wanka">Quechua Wanka</option>
                                                        <option value="Quechua de Cajamarca">Quechua de Cajamarca</option>
                                                        <option value="Quechua de San Martín">Quechua de San Martín</option>
                                                        <option value="Aymara">Aymara</option>
                                                        <option value="Cauqui">Cauqui</option>
                                                        <option value="Jaqaru">Jaqaru</option>
                                                    </optgroup>
                                                    <optgroup label="Lenguas Originarias (Amazónicas)">
                                                        <option value="Achuar">Achuar</option>
                                                        <option value="Amahuaca">Amahuaca</option>
                                                        <option value="Arabela">Arabela</option>
                                                        <option value="Ashaninka">Ashaninka</option>
                                                        <option value="Asheninka">Asheninka</option>
                                                        <option value="Awajún">Awajún</option>
                                                        <option value="Bora">Bora</option>
                                                        <option value="Cashinahua">Cashinahua</option>
                                                        <option value="Chamicuro">Chamicuro</option>
                                                        <option value="Ese Eja">Ese Eja</option>
                                                        <option value="Harakbut">Harakbut</option>
                                                        <option value="Ikitu">Ikitu</option>
                                                        <option value="Isconahua">Isconahua</option>
                                                        <option value="Jaqaru">Jaqaru</option>
                                                        <option value="Jíbaro">Jíbaro</option>
                                                        <option value="Kakataibo">Kakataibo</option>
                                                        <option value="Kakinte">Kakinte</option>
                                                        <option value="Kandozi-Chapra">Kandozi-Chapra</option>
                                                        <option value="Kapanawa">Kapanawa</option>
                                                        <option value="Kawki">Kawki</option>
                                                        <option value="Kichwa">Kichwa</option>
                                                        <option value="Kukama-Kukamiria">Kukama-Kukamiria</option>
                                                        <option value="Madija">Madija</option>
                                                        <option value="Maijki">Maijki</option>
                                                        <option value="Matsigenka">Matsigenka</option>
                                                        <option value="Matsigenka Mañaries">Matsigenka Mañaries</option>
                                                        <option value="Matsés">Matsés</option>
                                                        <option value="Muniche">Muniche</option>
                                                        <option value="Murui-Muinanɨ">Murui-Muinanɨ</option>
                                                        <option value="Nanti">Nanti</option>
                                                        <option value="Nomatsigenga">Nomatsigenga</option>
                                                        <option value="Ocaina">Ocaina</option>
                                                        <option value="Omagua">Omagua</option>
                                                        <option value="Resígaro">Resígaro</option>
                                                        <option value="Secoya">Secoya</option>
                                                        <option value="Sharanahua">Sharanahua</option>
                                                        <option value="Shawi">Shawi</option>
                                                        <option value="Shipibo-Konibo">Shipibo-Konibo</option>
                                                        <option value="Shiwilu">Shiwilu</option>
                                                        <option value="Ticuna">Ticuna</option>
                                                        <option value="Urarina">Urarina</option>
                                                        <option value="Wampis">Wampis</option>
                                                        <option value="Yagua">Yagua</option>
                                                        <option value="Yaminahua">Yaminahua</option>
                                                        <option value="Yanesha">Yanesha</option>
                                                        <option value="Yine">Yine</option>
                                                    </optgroup>
                                                    <optgroup label="Otras / Extranjeras">
                                                        <option value="Inglés">Inglés</option>
                                                        <option value="Francés">Francés</option>
                                                        <option value="Alemán">Alemán</option>
                                                        <option value="Italiano">Italiano</option>
                                                        <option value="Portugués">Portugués</option>
                                                        <option value="Otra variante">Otra variante</option>
                                                    </optgroup>
                                                    <optgroup label="Inclusión">
                                                        <option value="Lengua de Señas Peruana (LSP)">Lengua de Señas Peruana (LSP)</option>
                                                        <option value="Braille (Sistema de lectura)">Braille (Sistema de lectura)</option>
                                                    </optgroup>
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-primary-teal uppercase tracking-[0.2em]">Descripción Diagnóstica</label>
                                    <div className="relative">
                                        <textarea
                                            className="w-full h-64 bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20 transition-all resize-none"
                                            placeholder="El diagnóstico sociolingüístico se redactará aquí..."
                                            value={estilos.diagnosticoSociolinguistico}
                                            onChange={e => setEstilos(prev => ({ ...prev, diagnosticoSociolinguistico: e.target.value }))}
                                        />
                                        {loadingEIB && (
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center z-20 animate-in fade-in duration-300">
                                                <div className="flex items-center gap-3 px-6 py-3 bg-gray-900/90 rounded-full border border-white/10 shadow-[0_0_30px_rgba(79,209,197,0.2)]">
                                                    <span className="material-icons-round animate-spin text-primary-teal text-xl">language</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Analizando EIB</span>
                                                        <span className="text-[8px] text-gray-500 font-bold uppercase mt-1">Procesando realidad lingüística...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
            {activeTab === 'estudiantes' && (
                <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card variant="glass" className="lg:col-span-1">
                            <div className="p-6 space-y-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-icons-round text-primary-teal">numbers</span>
                                    Resumen de Matrícula
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Total de Estudiantes</label>
                                        <div className="text-3xl font-black text-primary-teal">
                                            {estudiantes.length}
                                        </div>
                                        <p className="text-[10px] text-gray-600 font-bold uppercase mt-1">Sincronizado con la lista</p>
                                    </div>
                                    <div className="p-4 bg-primary-teal/5 rounded-2xl border border-primary-teal/10">
                                        <p className="text-[10px] text-primary-teal font-bold uppercase mb-1">Dato Pedagógico</p>
                                        <p className="text-xs text-gray-400 italic leading-relaxed">
                                            La cantidad de estudiantes influye en la organización de tiempos y la cantidad de materiales que la IA generará para tus sesiones.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (window.confirm('¿Estás seguro de que deseas eliminar a todos los estudiantes? Esta acción no se puede deshacer.')) {
                                                setEstudiantes([]);
                                            }
                                        }}
                                        className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase transition-all border border-red-500/10"
                                    >
                                        Limpiar Matrícula
                                    </button>
                                </div>
                            </div>
                        </Card>

                        <Card variant="glass" className="lg:col-span-2">
                            <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-icons-round text-brand-magenta">format_list_bulleted</span>
                                        Lista de Estudiantes (Nombres)
                                    </h3>
                                    <button 
                                        onClick={() => setEstudiantes([...estudiantes, { id: crypto.randomUUID(), nombres: '', apellidos: '', dni: '', genero: '' }])}
                                        className="px-3 py-1.5 bg-brand-magenta/10 text-brand-magenta rounded-xl text-[10px] font-black uppercase hover:bg-brand-magenta/20 transition-all border border-brand-magenta/20 flex items-center gap-2"
                                    >
                                        <span className="material-icons-round text-sm">person_add</span>
                                        Agregar Estudiante
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {estudiantes.length === 0 ? (
                                        <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                            <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Sin estudiantes registrados</p>
                                        </div>
                                    ) : (
                                        estudiantes.map((est, idx) => (
                                            <div key={est.id} className="group flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
                                                <span className="shrink-0 w-8 h-8 flex items-center justify-center bg-black/20 rounded-lg text-[10px] font-black text-gray-500">
                                                    {idx + 1}
                                                </span>
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 w-full">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest pl-1">DNI</label>
                                                        <input 
                                                            type="text"
                                                            maxLength={8}
                                                            value={est.dni}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/\D/g, '');
                                                                const newEsts = [...estudiantes];
                                                                newEsts[idx].dni = val;
                                                                setEstudiantes(newEsts);
                                                            }}
                                                            placeholder="00000000"
                                                            className="w-full bg-surface-card/50 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-primary-teal/40 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest pl-1">Apellidos</label>
                                                        <input 
                                                            type="text"
                                                            value={est.apellidos}
                                                            onChange={(e) => {
                                                                const newEsts = [...estudiantes];
                                                                newEsts[idx].apellidos = e.target.value;
                                                                setEstudiantes(newEsts);
                                                            }}
                                                            placeholder="Apellidos"
                                                            className="w-full bg-surface-card/50 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-primary-teal/40 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest pl-1">Nombres</label>
                                                        <input 
                                                            type="text"
                                                            value={est.nombres}
                                                            onChange={(e) => {
                                                                const newEsts = [...estudiantes];
                                                                newEsts[idx].nombres = e.target.value;
                                                                setEstudiantes(newEsts);
                                                            }}
                                                            placeholder="Nombres"
                                                            className="w-full bg-surface-card/50 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-primary-teal/40 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest pl-1">Género</label>
                                                        <div className="flex gap-1 h-9">
                                                            {['M', 'F'].map(g => (
                                                                <button
                                                                    key={g}
                                                                    onClick={() => {
                                                                        const newEsts = [...estudiantes];
                                                                        newEsts[idx].genero = g as 'M' | 'F';
                                                                        setEstudiantes(newEsts);
                                                                    }}
                                                                    className={cn(
                                                                        "flex-1 rounded-xl text-[10px] font-black transition-all border",
                                                                        est.genero === g 
                                                                            ? "bg-primary-teal border-primary-teal text-gray-900 shadow-lg shadow-primary-teal/10" 
                                                                            : "bg-white/5 border-white/5 text-gray-500 hover:text-white"
                                                                    )}
                                                                >
                                                                    {g}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-brand-magenta uppercase tracking-widest pl-1">Inclusión / NEE</label>
                                                        <select 
                                                            value={est.nee || 'Ninguna'}
                                                            onChange={(e) => {
                                                                const newEsts = [...estudiantes];
                                                                newEsts[idx].nee = e.target.value as TipoNEE;
                                                                setEstudiantes(newEsts);
                                                            }}
                                                            className={cn(
                                                                "w-full bg-brand-magenta/5 border rounded-xl px-3 py-2 text-[9px] font-bold outline-none transition-all h-9 appearance-none cursor-pointer",
                                                                est.nee && est.nee !== 'Ninguna' 
                                                                    ? "border-brand-magenta text-brand-magenta bg-brand-magenta/10" 
                                                                    : "border-white/5 text-gray-500 hover:border-brand-magenta/30"
                                                            )}
                                                        >
                                                            {CATEGORIAS_NEE.map(cat => (
                                                                <option key={cat} value={cat} className="bg-gray-900 text-white text-xs">{cat}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-primary-teal uppercase tracking-widest pl-1">Logro Anterior</label>
                                                        <div className="flex gap-1 h-9">
                                                            {(['AD', 'A', 'B', 'C'] as NivelLogro[]).map(nivel => (
                                                                <button
                                                                    key={nivel}
                                                                    onClick={() => {
                                                                        const newEsts = [...estudiantes];
                                                                        newEsts[idx].lineaBase = nivel;
                                                                        setEstudiantes(newEsts);
                                                                    }}
                                                                    className={cn(
                                                                        "flex-1 rounded-lg text-[9px] font-black transition-all border",
                                                                        est.lineaBase === nivel 
                                                                            ? nivel === 'AD' ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                                                                              : nivel === 'A' ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                                                                              : nivel === 'B' ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                                                                              : "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/10"
                                                                            : "bg-white/5 border-white/5 text-gray-600 hover:text-white"
                                                                    )}
                                                                >
                                                                    {nivel}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 self-end md:self-center">
                                                    <button 
                                                        onClick={() => setEstudiantes(estudiantes.filter(e => e.id !== est.id))}
                                                        className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                                                    >
                                                        <span className="material-icons-round text-sm">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

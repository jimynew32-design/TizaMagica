import React, { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { AIButton } from '@/components/ui/AIButton';
import { TabSwitch } from '@/components/ui/TabSwitch';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { MatrizContexto, Impacto, DiagnosticoIntegral, EstilosIntereses, EstadisticaNEE, ResultadoCompetencia, CATEGORIAS_NEE } from '@/types/schemas';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { usePlanAnualStore, useAIConfigStore, useNotificationStore } from '@/store';
import { useDebounce } from '@/hooks/ui/useDebounce';
import { chatCompletion } from '@/services/ai';
import { PROMPTS } from '@/services/ai/prompts';
import { cnebService } from '@/services/cneb';

const AMBITOS = ['familiar', 'grupal', 'local', 'regional', 'nacional'] as const;
const ASPECTOS = ['cultural', 'economico', 'ambiental'] as const;

// Componente de Selección Premium (Personalizado para evitar estética nativa)
const CustomSelect = ({ value, options, onChange }: { value: string, options: string[], onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative flex-1">
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white hover:border-brand-magenta/50 transition-all outline-none group"
            >
                <span className="truncate pr-2">{value}</span>
                <span className={cn(
                    "material-icons-round text-sm transition-transform duration-300 text-gray-500 group-hover:text-brand-magenta",
                    isOpen ? "rotate-180" : ""
                )}>expand_more</span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute z-[70] left-0 right-0 mt-2 bg-gray-950 border border-white/10 rounded-xl shadow-glow-magenta-sm overflow-hidden min-w-[200px]"
                        >
                            <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                                {options.map(opt => (
                                    <button 
                                        key={opt}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg",
                                            value === opt 
                                                ? "bg-brand-magenta text-white" 
                                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

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

        // Si ya tiene idiomas, retornamos base asegurando intereses
        if (base.idiomas && base.idiomas.length > 0) {
            return {
                ...base,
                intereses: base.intereses || []
            } as EstilosIntereses;
        }

        // Si no tiene idiomas (migración de formato antiguo), los construimos
        return {
            ...base,
            intereses: base.intereses || [],
            idiomas: [
                { etiqueta: 'L1', valor: (base as any).lenguaMaterna || 'Castellano' },
                { etiqueta: 'L2', valor: (base as any).segundaLengua || 'No especificada' }
            ]
        } as EstilosIntereses;
    });

    const [interesInput, setInteresInput] = useState('');
    const [activeDimension, setActiveDimension] = useState<'cognitivo' | 'fisico' | 'emocional'>('cognitivo');
    
    // Matrícula y Estadísticas
    const [gradoAula, setGradoAula] = useState(planActivo?.diagnostico.gradoIdentificado || planActivo?.grado || '');
    const [nombreAula, setNombreAula] = useState(planActivo?.diagnostico.nombreAula || '');
    const [seccion, setSeccion] = useState(planActivo?.diagnostico.seccion || '');
    const [cantidadVarones, setCantidadVarones] = useState(planActivo?.diagnostico.cantidadVarones || 0);
    const [cantidadMujeres, setCantidadMujeres] = useState(planActivo?.diagnostico.cantidadMujeres || 0);
    const [cantidadTotal, setCantidadTotal] = useState(planActivo?.diagnostico.cantidadTotal || 0);
    const [estadisticasNEE, setEstadisticasNEE] = useState<EstadisticaNEE[]>(planActivo?.diagnostico.estadisticasNEE || []);
    
    // Matrícula por Sección
    const [matriculaSecciones, setMatriculaSecciones] = useState<Record<string, { varones: number, mujeres: number, nee: EstadisticaNEE[] }>>(
        planActivo?.diagnostico.matriculaSecciones || {}
    );
    const [activeSectionId, setActiveSectionId] = useState<string>('GLOBAL');

    // Evaluación Diagnóstica
    const [evaluacionCompetencias, setEvaluacionCompetencias] = useState<ResultadoCompetencia[]>(planActivo?.diagnostico.evaluacionCompetencias || []);
    const [loadingCompetencias, setLoadingCompetencias] = useState(false);

    const debouncedMatriz = useDebounce(matriz, 1000);
    const debouncedCarac = useDebounce(caracteristicas, 1000);
    const debouncedEstilos = useDebounce(estilos, 1000);
    const debouncedPerfil = useDebounce(perfilContexto, 1000);
    const debouncedUbicacion = useDebounce(ubicacion, 1000);
    const debouncedGradoAula = useDebounce(gradoAula, 1000);
    const debouncedNombreAula = useDebounce(nombreAula, 1000);
    const debouncedSeccion = useDebounce(seccion, 1000);
    const debouncedCantidadVarones = useDebounce(cantidadVarones, 1000);
    const debouncedCantidadMujeres = useDebounce(cantidadMujeres, 1000);
    const debouncedCantidadTotal = useDebounce(cantidadTotal, 1000);
    const debouncedEstadisticasNEE = useDebounce(estadisticasNEE, 1000);
    const debouncedMatriculaSecciones = useDebounce(matriculaSecciones, 1000);
    const debouncedEvaluacion = useDebounce(evaluacionCompetencias, 1000);


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

            const baseEstilos = planActivo.diagnostico.estilos;
            setEstilos(baseEstilos?.idiomas ? {
                ...baseEstilos,
                intereses: baseEstilos.intereses || []
            } : {
                ...baseEstilos,
                intereses: baseEstilos?.intereses || [],
                idiomas: [
                    { etiqueta: 'L1', valor: (baseEstilos as any)?.lenguaMaterna || 'Castellano' },
                    { etiqueta: 'L2', valor: (baseEstilos as any)?.segundaLengua || 'No especificada' }
                ]
            } as EstilosIntereses);

            setGradoAula(planActivo.diagnostico.gradoIdentificado || planActivo.grado || '');
            setNombreAula(planActivo.diagnostico.nombreAula || '');
            setSeccion(planActivo.diagnostico.seccion || '');
            setCantidadVarones(planActivo.diagnostico.cantidadVarones || 0);
            setCantidadMujeres(planActivo.diagnostico.cantidadMujeres || 0);
            setCantidadTotal(planActivo.diagnostico.cantidadTotal || 0);
            setEstadisticasNEE(planActivo.diagnostico.estadisticasNEE || []);
            setMatriculaSecciones(planActivo.diagnostico.matriculaSecciones || {});
            setEvaluacionCompetencias(planActivo.diagnostico.evaluacionCompetencias || []);
            
            // Cargar competencias si la evaluación está vacía
            if ((planActivo.diagnostico.evaluacionCompetencias || []).length === 0) {
                cargarCompetenciasPlan();
            }
        }
    }, [planActivo?.id]);

    const [showAllLetters, setShowAllLetters] = useState(false);

    const cargarCompetenciasPlan = async () => {
        if (!planActivo) return;
        setLoadingCompetencias(true);
        try {
            // Competencias de área
            const areaComp = await cnebService.getCompetenciasByAreaNivel(planActivo.area, planActivo.nivel);
            // Competencias transversales
            const transComp = await cnebService.getCompetenciasByAreaNivel('Competencias Transversales', planActivo.nivel);
            
            const results: ResultadoCompetencia[] = [...areaComp, ...transComp].map(c => ({
                id: c.nombre, // Usamos nombre como ID para simplicidad si no hay ID único disponible
                nombre: c.nombre,
                logro: { AD: 0, A: 0, B: 0, C: 0 }
            }));
            setEvaluacionCompetencias(results);
        } catch (error) {
            console.error('Error cargando competencias para diagnóstico:', error);
        } finally {
            setLoadingCompetencias(false);
        }
    };

    useEffect(() => {
        if (planActivo) {
            const newDiagnostico: DiagnosticoIntegral = {
                perfilContexto: debouncedPerfil,
                ubicacion: debouncedUbicacion,
                contexto: debouncedMatriz,
                caracteristicas: debouncedCarac,
                estilos: debouncedEstilos,
                cantidadTotal: debouncedCantidadTotal,
                cantidadVarones: debouncedCantidadVarones,
                cantidadMujeres: debouncedCantidadMujeres,
                estadisticasNEE: debouncedEstadisticasNEE,
                matriculaSecciones: debouncedMatriculaSecciones,
                evaluacionCompetencias: debouncedEvaluacion,
                gradoIdentificado: debouncedGradoAula,
                nombreAula: debouncedNombreAula,
                seccion: debouncedSeccion
            };
            updatePlan(planActivo.id, { diagnostico: newDiagnostico });
        }
    }, [
        debouncedMatriz, debouncedCarac, debouncedEstilos, debouncedPerfil, 
        debouncedUbicacion, debouncedGradoAula, debouncedNombreAula, debouncedSeccion,
        debouncedCantidadVarones, debouncedCantidadMujeres, debouncedCantidadTotal, 
        debouncedEstadisticasNEE, debouncedMatriculaSecciones, debouncedEvaluacion
    ]);

    // Recalcular Totales Globales a partir de Secciones si existen
    useEffect(() => {
        const activeSections = seccion.split(',').filter(Boolean);
        if (activeSections.length > 0) {
            let totalM = 0;
            let totalF = 0;
            const globalNEE: Record<string, number> = {};

            activeSections.forEach(s => {
                const data = matriculaSecciones[s];
                if (data) {
                    totalM += data.varones || 0;
                    totalF += data.mujeres || 0;
                    (data.nee || []).forEach(n => {
                        globalNEE[n.tipo] = (globalNEE[n.tipo] || 0) + n.cantidad;
                    });
                }
            });

            setCantidadVarones(totalM);
            setCantidadMujeres(totalF);
            setCantidadTotal(totalM + totalF);
            setEstadisticasNEE(Object.entries(globalNEE).map(([tipo, cantidad]) => ({ tipo, cantidad })));
        } else {
            // Auto-calcular total si no hay secciones usando los campos directos
            setCantidadTotal(cantidadVarones + cantidadMujeres);
        }
    }, [matriculaSecciones, seccion, cantidadVarones, cantidadMujeres]);

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
            const systemPrompt = "Eres un psicólogo educativo altamente especializado. Tu tarea es generar un análisis técnico JSON. IMPORTANTE: Cada descripción ('cognitivo', 'fisico', 'emocional') debe redactarse EXCLUSIVAMENTE como una lista de 4-5 viñetas separadas por saltos de línea (\\n), cada una comenzando con '- '. Prohibido el uso de párrafos sólidos.";
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


            const systemPrompt = 'Eres un experto en pedagogía. Tu tarea es generar estrategias DIDÁCTICAS basadas en los INTERESES de los estudiantes. Estructura la información en una lista de puntos claros con guiones. NO redactes diagnósticos lingüísticos ni hables de la situación de las lenguas (eso va en la sección EIB). Sé directo y usa los intereses como motor del aprendizaje.';
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
            const systemPrompt = 'Redacta el diagnóstico sociolingüístico EIB estructurado en puntos técnicos con guiones. Sintetiza la realidad lingüística y el reto pedagógico en una secuencia de 3 o 4 viñetas descriptivas.';
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
                            {/* Selector de Niveles (Izquierda) */}
                            <div className="w-full lg:w-1/2 space-y-8 p-4">
                                {/* Sub-Tabs para Dimensiones */}
                                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                                    {(['cognitivo', 'fisico', 'emocional'] as const).map(dim => {
                                        const dimIcons: Record<string, string> = { cognitivo: 'psychology', fisico: 'directions_run', emocional: 'favorite' };
                                        return (
                                            <button
                                                key={dim}
                                                onClick={() => setActiveDimension(dim)}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                                                    activeDimension === dim 
                                                        ? "bg-brand-magenta text-white shadow-glow-magenta-sm" 
                                                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                                                )}
                                            >
                                                <span className="material-icons-round text-sm">{dimIcons[dim]}</span>
                                                <span className="hidden sm:inline">{dim}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Selección Activa */}
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-magenta/10 border border-brand-magenta/30 flex items-center justify-center text-brand-magenta shadow-glow-magenta-sm">
                                            <span className="material-icons-round text-2xl">
                                                {activeDimension === 'cognitivo' ? 'psychology' : activeDimension === 'fisico' ? 'directions_run' : 'favorite'}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Perfil Actual</label>
                                            <div className="text-xl font-black text-white tracking-tight uppercase">Dimensión {activeDimension}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {[1, 2, 3, 4, 5].map(v => {
                                            const descriptions: Record<number, string> = {
                                                1: 'Intervención Urgente',
                                                2: 'Necesita Refuerzo',
                                                3: 'Perfil Estándar',
                                                4: 'Avance Consolidado',
                                                5: 'Nivel Destacado'
                                            };
                                            return (
                                                <button
                                                    key={v}
                                                    onClick={() => setCaracteristicas(prev => ({ 
                                                        ...prev, 
                                                        [activeDimension]: { ...prev[activeDimension], nivel: v } 
                                                    }))}
                                                    className={cn(
                                                        "w-full p-4 rounded-xl text-left transition-all duration-400 border flex items-center justify-between group/opt",
                                                        caracteristicas[activeDimension].nivel === v 
                                                            ? "bg-brand-magenta/20 border-brand-magenta text-white shadow-[0_0_20px_rgba(232,18,126,0.15)] scale-[1.02] z-10"
                                                            : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/[0.07] hover:border-white/10 hover:text-gray-300"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all duration-500",
                                                            caracteristicas[activeDimension].nivel === v 
                                                                ? "bg-brand-magenta border-white/30 text-white" 
                                                                : "bg-black/20 border-white/10 text-gray-600 group-hover/opt:border-white/20"
                                                        )}>
                                                            {v}
                                                        </div>
                                                        <span className={cn(
                                                            "text-xs font-bold tracking-tight transition-colors",
                                                            caracteristicas[activeDimension].nivel === v ? "text-white" : "group-hover/opt:text-white"
                                                        )}>
                                                            {descriptions[v]}
                                                        </span>
                                                    </div>
                                                    {caracteristicas[activeDimension].nivel === v && (
                                                        <span className="material-icons-round text-brand-magenta animate-pulse text-lg">check_circle</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Observaciones (Derecha) */}
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
                                <textarea 
                                    className="w-full h-full bg-surface-card border border-white/5 rounded-2xl p-6 text-sm text-white placeholder:text-gray-700 min-h-[300px]" 
                                    placeholder="Escribe lo que observas en tu grupo..." 
                                    value={caracteristicas.observacionesGrupo} 
                                    onChange={e => setCaracteristicas(prev => ({ ...prev, observacionesGrupo: e.target.value }))} 
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Resultados de Redacción */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(['cognitivo', 'fisico', 'emocional'] as const).map(dim => (
                            <Card key={dim} variant="strong">
                                <CardTitle className="capitalize">{dim}</CardTitle>
                                <textarea 
                                    className="w-full h-48 bg-transparent border border-white/5 rounded-2xl p-4 text-xs text-gray-300" 
                                    value={caracteristicas[dim].texto} 
                                    onChange={e => setCaracteristicas(prev => ({ ...prev, [dim]: { ...prev[dim], texto: e.target.value } }))} 
                                />
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
                                                    const currentIntereses = estilos.intereses || [];
                                                    if (!currentIntereses.includes(interes)) {
                                                        setEstilos(prev => ({ ...prev, intereses: [...(prev.intereses || []), interes] }));
                                                    }
                                                }}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                                                    (estilos.intereses || []).includes(interes)
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
                                        {(!estilos.intereses || estilos.intereses.length === 0) ? (
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
                                                        onClick={() => setEstilos(prev => ({ ...prev, intereses: (prev.intereses || []).filter((_, x) => x !== idx) }))}
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
                                                        onClick={() => setEstilos(prev => ({ ...prev, idiomas: (prev.idiomas || []).filter((_, i) => i !== idx) }))}
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
                    <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8 pb-10">
                        {/* SECCIÓN 1: DATOS DEL AULA Y ESTADÍSTICAS */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            <Card variant="glass" className="lg:col-span-1">
                                <div className="p-6 space-y-6">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-icons-round text-primary-teal">school</span>
                                        Datos del Aula
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Grado / Ciclo</label>
                                            <div className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-gray-400 cursor-not-allowed">
                                                {gradoAula || 'Cargando...'}
                                            </div>
                                        </div>

                                            <div className="flex items-center justify-between px-1 mb-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Sección(es)</label>
                                                <button 
                                                    onClick={() => setShowAllLetters(!showAllLetters)}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                                        showAllLetters ? "bg-brand-magenta text-white shadow-glow-magenta-xs" : "bg-white/5 text-brand-magenta hover:bg-white/10"
                                                    )}
                                                >
                                                    <span className="material-icons-round text-sm">{showAllLetters ? 'keyboard_arrow_up' : 'apps'}</span>
                                                    {showAllLetters ? 'Ocultar' : 'Todas A-Z'}
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl min-h-[52px] focus-within:border-brand-magenta/30 transition-all">
                                                <AnimatePresence>
                                                    {seccion.split(',').filter(Boolean).map(s => (
                                                        <motion.span 
                                                            key={s} 
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0.8, opacity: 0 }}
                                                            className="flex items-center gap-2 px-3 py-1 bg-[#2a101d] border border-brand-magenta/30 text-white text-[10px] font-black rounded-lg"
                                                        >
                                                            {s}
                                                            <button onClick={() => setSeccion(seccion.split(',').filter(x => x !== s).join(','))} className="w-4 h-4 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white/40 hover:text-white transition-all">
                                                                <span className="material-icons-round text-[10px]">close</span>
                                                            </button>
                                                        </motion.span>
                                                    ))}
                                                </AnimatePresence>
                                                <input 
                                                    type="text"
                                                    placeholder="Escribe o selecciona..."
                                                    className="flex-1 bg-transparent border-none outline-none text-[11px] font-bold text-white min-w-[120px] placeholder:text-gray-700"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ',') {
                                                            e.preventDefault();
                                                            const val = e.currentTarget.value.trim().toUpperCase();
                                                            if (val && !seccion.split(',').includes(val)) {
                                                                setSeccion(seccion ? `${seccion},${val}` : val);
                                                                e.currentTarget.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                            
                                            {/* Teclado A-Z Condicional */}
                                            <AnimatePresence>
                                                {showAllLetters ? (
                                                    <motion.div 
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 mt-3 grid grid-cols-7 gap-1.5 shadow-inner">
                                                            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Única'].map(s => {
                                                                const isSelected = seccion.split(',').includes(s);
                                                                return (
                                                                    <button 
                                                                        key={s}
                                                                        onClick={() => {
                                                                            const parts = seccion.split(',').filter(Boolean);
                                                                            if (parts.includes(s)) {
                                                                                setSeccion(parts.filter(p => p !== s).join(','));
                                                                            } else {
                                                                                setSeccion(seccion ? `${seccion},${s}` : s);
                                                                            }
                                                                        }}
                                                                        className={cn(
                                                                            "h-8 rounded-lg text-[10px] font-black transition-all flex items-center justify-center border",
                                                                            isSelected
                                                                                ? "bg-brand-magenta border-brand-magenta text-white shadow-glow-magenta-xs"
                                                                                : "bg-white/5 border-white/5 text-gray-600 hover:text-white hover:bg-white/10"
                                                                        )}
                                                                    >
                                                                        {s}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <div className="flex items-center gap-2 mt-3 px-1">
                                                        {['A', 'B', 'C', 'D'].map(s => {
                                                            const isSelected = seccion.split(',').includes(s);
                                                            return (
                                                                <button 
                                                                    key={s}
                                                                    onClick={() => {
                                                                        const parts = seccion.split(',').filter(Boolean);
                                                                        if (parts.includes(s)) {
                                                                            setSeccion(parts.filter(p => p !== s).join(','));
                                                                        } else {
                                                                            setSeccion(seccion ? `${seccion},${s}` : s);
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        "px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all",
                                                                        isSelected
                                                                            ? "bg-brand-magenta/30 border-brand-magenta/60 text-white"
                                                                            : "bg-white/5 border-white/5 text-gray-500 hover:text-white"
                                                                    )}
                                                                >
                                                                    {s}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </AnimatePresence>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Nombre del Aula</label>
                                            <input 
                                                type="text"
                                                value={nombreAula}
                                                onChange={(e) => setNombreAula(e.target.value)}
                                                placeholder="Ej: 'Los Abejitas'"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:border-primary-teal transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card variant="glass" className="lg:col-span-3">
                                <div className="p-6 h-full flex flex-col">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            <span className="material-icons-round text-brand-magenta">analytics</span>
                                            Resumen de Matrícula
                                        </h3>

                                        {/* Selector de Sección Interno */}
                                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 self-stretch sm:self-auto overflow-x-auto max-w-full custom-scrollbar">
                                            {seccion.split(',').filter(Boolean).map(s => (
                                                <button 
                                                    key={s}
                                                    onClick={() => setActiveSectionId(s)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                                        activeSectionId === s ? "bg-primary-teal text-gray-900 shadow-glow-teal-xs" : "text-gray-500 hover:text-white"
                                                    )}
                                                >
                                                    Sección {s}
                                                </button>
                                            ))}
                                            <button 
                                                onClick={() => setActiveSectionId('GLOBAL')}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                                    activeSectionId === 'GLOBAL' ? "bg-brand-magenta text-white shadow-glow-magenta-xs" : "text-gray-500 hover:text-white"
                                                )}
                                            >
                                                Resumen Global
                                            </button>
                                        </div>
                                    </div>

                                    {activeSectionId === 'GLOBAL' ? (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 animate-in fade-in slide-in-from-top-2 duration-400">
                                                {/* Varones Global */}
                                                <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Varones (TOTAL)</label>
                                                        <div className="material-icons-round text-blue-400 text-lg">male</div>
                                                    </div>
                                                    <div className="text-4xl font-black text-blue-400 text-center py-2">{cantidadVarones}</div>
                                                </div>

                                                {/* Mujeres Global */}
                                                <div className="p-4 bg-pink-500/5 rounded-2xl border border-pink-500/10 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Mujeres (TOTAL)</label>
                                                        <div className="material-icons-round text-pink-400 text-lg">female</div>
                                                    </div>
                                                    <div className="text-4xl font-black text-pink-400 text-center py-2">{cantidadMujeres}</div>
                                                </div>

                                                {/* Total Global */}
                                                <div className="p-4 bg-primary-teal/5 rounded-2xl border border-primary-teal/10 space-y-3 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                                                        <span className="material-icons-round text-6xl text-primary-teal">groups</span>
                                                    </div>
                                                    <label className="text-[10px] font-black text-primary-teal uppercase tracking-widest relative z-10">Total Estudiantes</label>
                                                    <div className="text-5xl font-black text-primary-teal relative z-10 py-2">
                                                        {cantidadTotal}
                                                    </div>
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter relative z-10">Calculado de todas las secciones</p>
                                                </div>
                                            </div>

                                            <div className="flex-1 border-t border-white/5 pt-6">
                                                <label className="text-[10px] font-black text-brand-magenta uppercase tracking-widest flex items-center gap-2 mb-4">
                                                    <span className="material-icons-round text-sm">stars</span>
                                                    Consolidado de Inclusión (NEE)
                                                </label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {estadisticasNEE.map((nee, idx) => (
                                                        <div key={idx} className="flex items-center justify-between bg-black/20 border border-white/5 rounded-xl px-4 py-3">
                                                            <span className="text-[10px] font-bold text-gray-300 uppercase">{nee.tipo}</span>
                                                            <span className="text-sm font-black text-brand-magenta">{nee.cantidad}</span>
                                                        </div>
                                                    ))}
                                                    {estadisticasNEE.length === 0 && (
                                                        <div className="col-span-full py-4 text-center border border-dashed border-white/5 rounded-xl">
                                                            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest italic">No hay casos detectados</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="animate-in fade-in slide-in-from-right-2 duration-400">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                                {/* Varones Sección */}
                                                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Varones (Sección {activeSectionId})</label>
                                                        <div className="material-icons-round text-blue-300 text-lg">male</div>
                                                    </div>
                                                    <input 
                                                        type="number" min={0}
                                                        value={matriculaSecciones[activeSectionId]?.varones || 0}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            setMatriculaSecciones(prev => ({
                                                                ...prev,
                                                                [activeSectionId]: { ...(prev[activeSectionId] || { varones: 0, mujeres: 0, nee: [] }), varones: val }
                                                            }));
                                                        }}
                                                        className="w-full bg-black/40 border border-blue-500/30 rounded-xl px-4 py-4 text-3xl font-black text-blue-300 outline-none focus:border-blue-300 transition-all text-center"
                                                    />
                                                </div>

                                                {/* Mujeres Sección */}
                                                <div className="p-4 bg-pink-500/10 rounded-2xl border border-pink-500/20 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black text-pink-300 uppercase tracking-widest">Mujeres (Sección {activeSectionId})</label>
                                                        <div className="material-icons-round text-pink-300 text-lg">female</div>
                                                    </div>
                                                    <input 
                                                        type="number" min={0}
                                                        value={matriculaSecciones[activeSectionId]?.mujeres || 0}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            setMatriculaSecciones(prev => ({
                                                                ...prev,
                                                                [activeSectionId]: { ...(prev[activeSectionId] || { varones: 0, mujeres: 0, nee: [] }), mujeres: val }
                                                            }));
                                                        }}
                                                        className="w-full bg-black/40 border border-pink-500/30 rounded-xl px-4 py-4 text-3xl font-black text-pink-300 outline-none focus:border-pink-300 transition-all text-center"
                                                    />
                                                </div>

                                                {/* Total Sección */}
                                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total S{activeSectionId}</label>
                                                    <div className="text-5xl font-black text-white py-2">
                                                        {(matriculaSecciones[activeSectionId]?.varones || 0) + (matriculaSecciones[activeSectionId]?.mujeres || 0)}
                                                    </div>
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Estudiantes en esta sección</p>
                                                </div>
                                            </div>

                                            {/* Inclusión por Sección */}
                                            <div className="flex-1 border-t border-white/5 pt-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <label className="text-[10px] font-black text-brand-magenta uppercase tracking-widest flex items-center gap-2">
                                                        <span className="material-icons-round text-sm">stars</span>
                                                        Inclusión en Sección {activeSectionId}
                                                    </label>
                                                    <button 
                                                        onClick={() => {
                                                            const current = matriculaSecciones[activeSectionId] || { varones: 0, mujeres: 0, nee: [] };
                                                            setMatriculaSecciones(prev => ({
                                                                ...prev,
                                                                [activeSectionId]: { ...current, nee: [...current.nee, { tipo: 'Discapacidad Intelectual', cantidad: 1 }] }
                                                            }));
                                                        }}
                                                        className="flex items-center gap-1 text-[9px] font-black text-brand-magenta uppercase px-2 py-1 bg-brand-magenta/10 rounded-lg hover:bg-brand-magenta/20"
                                                    >
                                                        <span className="material-icons-round text-xs">add</span>
                                                        Añadir NEE
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {(matriculaSecciones[activeSectionId]?.nee || []).map((nee, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2">
                                                            <CustomSelect 
                                                                value={nee.tipo}
                                                                options={CATEGORIAS_NEE.filter(c => c !== 'Ninguna')}
                                                                onChange={(val) => {
                                                                    const currentNEE = [...(matriculaSecciones[activeSectionId]?.nee || [])];
                                                                    currentNEE[idx].tipo = val;
                                                                    setMatriculaSecciones(prev => ({
                                                                        ...prev,
                                                                        [activeSectionId]: { ...prev[activeSectionId], nee: currentNEE }
                                                                    }));
                                                                }}
                                                            />
                                                            <input 
                                                                type="number" min={1}
                                                                value={nee.cantidad}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value) || 0;
                                                                    const currentNEE = [...(matriculaSecciones[activeSectionId]?.nee || [])];
                                                                    currentNEE[idx].cantidad = val;
                                                                    setMatriculaSecciones(prev => ({
                                                                        ...prev,
                                                                        [activeSectionId]: { ...prev[activeSectionId], nee: currentNEE }
                                                                    }));
                                                                }}
                                                                className="w-10 bg-black/40 border border-white/10 rounded-lg text-xs font-black text-brand-magenta text-center"
                                                            />
                                                            <button 
                                                                onClick={() => {
                                                                    const currentNEE = (matriculaSecciones[activeSectionId]?.nee || []).filter((_, i) => i !== idx);
                                                                    setMatriculaSecciones(prev => ({
                                                                        ...prev,
                                                                        [activeSectionId]: { ...prev[activeSectionId], nee: currentNEE }
                                                                    }));
                                                                }}
                                                                className="text-gray-600 hover:text-red-400"
                                                            >
                                                                <span className="material-icons-round text-sm">close</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {(matriculaSecciones[activeSectionId]?.nee || []).length === 0 && (
                                                        <div className="col-span-full py-4 text-center border border-dashed border-white/5 rounded-xl opacity-50">
                                                            <span className="text-[9px] text-gray-500 font-bold uppercase">Sin casos en esta sección</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* SECCIÓN 2: EVALUACIÓN DIAGNÓSTICA (POR COMPETENCIA) */}
                        <Card variant="glass">
                            <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            <span className="material-icons-round text-primary-teal">assignment_turned_in</span>
                                            Evaluación Diagnóstica: Nivel de Logro
                                        </h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-7">
                                            Resultados por competencias (Área + Transversales)
                                        </p>
                                    </div>
                                    {loadingCompetencias && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-primary-teal/10 rounded-full border border-primary-teal/20 animate-pulse">
                                            <span className="material-icons-round text-xs animate-spin text-primary-teal">sync</span>
                                            <span className="text-[9px] font-black text-primary-teal uppercase">Cargando competencias...</span>
                                        </div>
                                    )}
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                <th className="py-4 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Competencia</th>
                                                <th className="py-4 px-2 w-24 text-center text-[10px] font-black text-brand-magenta uppercase tracking-widest">AD</th>
                                                <th className="py-4 px-2 w-24 text-center text-[10px] font-black text-primary-teal uppercase tracking-widest">A</th>
                                                <th className="py-4 px-2 w-24 text-center text-[10px] font-black text-yellow-500 uppercase tracking-widest">B</th>
                                                <th className="py-4 px-2 w-24 text-center text-[10px] font-black text-red-500 uppercase tracking-widest">C</th>
                                                <th className="py-4 px-2 w-24 text-center text-[10px] font-black text-gray-600 uppercase tracking-widest">Logro %</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {evaluacionCompetencias.map((comp, idx) => {
                                                const totalLogro = comp.logro.AD + comp.logro.A + comp.logro.B + comp.logro.C;
                                                const porcLogro = totalLogro > 0 ? Math.round(((comp.logro.AD + comp.logro.A) / totalLogro) * 100) : 0;
                                                
                                                return (
                                                    <tr key={comp.id} className="group hover:bg-white/5 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-xs font-bold text-white leading-tight">{comp.nombre}</span>
                                                                {idx >= evaluacionCompetencias.length - 2 && (
                                                                    <span className="text-[8px] font-black text-primary-teal/60 uppercase tracking-tighter italic">Transversal</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        {(['AD', 'A', 'B', 'C'] as const).map(nivel => (
                                                            <td key={nivel} className="py-4 px-2">
                                                                <input 
                                                                    type="number"
                                                                    min={0}
                                                                    value={comp.logro[nivel]}
                                                                    onChange={(e) => {
                                                                        const newEval = [...evaluacionCompetencias];
                                                                        newEval[idx].logro[nivel] = parseInt(e.target.value) || 0;
                                                                        setEvaluacionCompetencias(newEval);
                                                                    }}
                                                                    className={cn(
                                                                        "w-full bg-black/40 border border-white/5 rounded-xl px-2 py-3 text-sm font-black text-center outline-none focus:border-white/20 transition-all",
                                                                        nivel === 'AD' && "text-brand-magenta",
                                                                        nivel === 'A' && "text-primary-teal",
                                                                        nivel === 'B' && "text-yellow-500",
                                                                        nivel === 'C' && "text-red-500"
                                                                    )}
                                                                />
                                                            </td>
                                                        ))}
                                                        <td className="py-4 px-2 text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className={cn(
                                                                    "text-xs font-black",
                                                                    porcLogro >= 70 ? "text-primary-teal" : porcLogro >= 40 ? "text-yellow-500" : "text-gray-500"
                                                                )}>
                                                                    {porcLogro}%
                                                                </span>
                                                                <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                                    <div 
                                                                        className={cn(
                                                                            "h-full transition-all duration-500",
                                                                            porcLogro >= 70 ? "bg-primary-teal" : porcLogro >= 40 ? "bg-yellow-500" : "bg-red-500"
                                                                        )}
                                                                        style={{ width: `${porcLogro}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
    );
};

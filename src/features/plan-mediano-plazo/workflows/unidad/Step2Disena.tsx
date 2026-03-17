import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { Toggle } from '@/components/ui/Toggle';
import { Unidad, CompetenciaSeleccionada, DesempenoSeleccionado, CNEBDesempeno, CNEBCompetencia, CriterioEvaluacion } from '@/types/schemas';
import { usePlanAnualStore } from '@/store';
import { cnebService } from '@/services/cneb';
import { cn } from '@/lib/cn';
import { ENFOQUES_TRANSVERSALES } from '@/services/cneb/enfoques-transversales';
import { chatCompletion } from '@/services/ai';
import { PROMPTS } from '@/services/ai/prompts';
import { useAIConfigStore, useNotificationStore } from '@/store';

interface Step2DisenaProps {
    unidad: Unidad;
    onUpdate: (updates: Partial<Unidad>) => void;
}

// Helper functions moved outside component to prevent re-creation
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').slice(0, 40);
const matrixIdComp = (compNombre: string) => `comp_${slug(compNombre)}`;
const matrixIdCap = (compNombre: string, capNombre: string) => `comp_${slug(compNombre)}_cap_${slug(capNombre)}`;
const matrixIdVal = (enfoqueId: string, valorId: string) => `${enfoqueId}_val_${valorId}`;

export const Step2Disena: React.FC<Step2DisenaProps> = ({ unidad, onUpdate }) => {
    const { planActivo } = usePlanAnualStore();
    const { updatePlan } = usePlanAnualStore();
    const { showNotification } = useNotificationStore();

    // CNEB data
    const [cnebCompetencias, setCnebCompetencias] = useState<CNEBCompetencia[]>([]);
    const [availableDesempenos, setAvailableDesempenos] = useState<Record<string, CNEBDesempeno[]>>({});
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [expandedComp, setExpandedComp] = useState<string | null>(null);
    const [isGeneratingCriterios, setIsGeneratingCriterios] = useState(false);

    // Cargar CNEB al inicio
    useEffect(() => {
        const load = async () => {
            if (!planActivo) return;
            const [data, trans] = await Promise.all([
                cnebService.getCompetenciasByAreaNivel(planActivo.area, planActivo.nivel),
                cnebService.getCompetenciasByAreaNivel('Competencias Transversales', planActivo.nivel)
            ]);
            setCnebCompetencias([...data, ...trans]);
        };
        load();
    }, [planActivo?.area, planActivo?.nivel]);

    // Función de búsqueda robusta para capacidades marcadas en el M03
    const isCapMarkedInAnnual = React.useCallback((compName: string, capName: string) => {
        if (!planActivo) return false;
        const unitIdx = unidad.numero - 1;

        // 1. Matching EXACTO
        const exactId = matrixIdCap(compName, capName);
        if (planActivo.matrizCompetencias[exactId]?.[unitIdx]) return true;

        // 2. Fallback: buscar por slug de competencia y asegurar que la capacidad termina en el slug
        const compS = slug(compName).slice(0, 15);
        const capS = slug(capName).slice(0, 30); // Usar más caracteres para evitar colisiones
        return Object.entries(planActivo.matrizCompetencias).some(([key, values]) => {
            if (!values[unitIdx]) return false;
            if (!key.includes('_cap_')) return false;
            
            // Verificar que la llave pertenece a esta competencia y a esta capacidad específica
            const parts = key.split('_cap_');
            if (parts.length < 2) return false;
            
            const keyCompS = parts[0];
            const keyCapS = parts[1];
            
            return keyCompS.includes(compS) && keyCapS.includes(capS.slice(0, 15));
        });
    }, [planActivo?.matrizCompetencias, unidad.numero]);

    // Competencias marcadas en M03 (fuente de verdad) - MEMOIZADO
    const competenciasAnuales = React.useMemo(() => cnebCompetencias.filter(c => {
        const isParentMarked = planActivo?.matrizCompetencias[matrixIdComp(c.nombre)]?.[unidad.numero - 1];
        const hasCapsMarked = c.capacidades.some(cap => isCapMarkedInAnnual(c.nombre, cap));
        return isParentMarked || hasCapsMarked;
    }).map(c => ({
        competenciaId: c.nombre,
        seleccionada: true,
        capacidades: c.capacidades.map(cap => ({
            capacidadId: cap,
            seleccionada: isCapMarkedInAnnual(c.nombre, cap)
        }))
    })), [cnebCompetencias, planActivo?.matrizCompetencias, isCapMarkedInAnnual, unidad.numero]);

    // TODAS las competencias del CNEB - MEMOIZADO
    const todasLasCompetencias: CompetenciaSeleccionada[] = React.useMemo(() => cnebCompetencias.map(c => {
        const fromM03 = competenciasAnuales.find(ca => ca.competenciaId === c.nombre);
        if (fromM03) return fromM03;
        return {
            competenciaId: c.nombre,
            seleccionada: false,
            capacidades: c.capacidades.map(cap => ({
                capacidadId: cap,
                seleccionada: false
            }))
        };
    }), [cnebCompetencias, competenciasAnuales]);

    const enfoquesAnuales = React.useMemo(() => planActivo ? ENFOQUES_TRANSVERSALES.filter(enf => 
        planActivo.matrizCompetencias[enf.id]?.[unidad.numero - 1]
    ).map(enf => ({
        nombre: enf.nombre,
        valores: enf.valores
            .filter(v => planActivo.matrizCompetencias[matrixIdVal(enf.id, v.id)]?.[unidad.numero - 1])
            .map(v => ({
                id: v.id,
                nombre: v.nombre,
                actitud: v.actitud,
                evidencia: v.evidencia
            }))
    })) : [], [planActivo?.matrizCompetencias, unidad.numero]);

    // Estado local para la selección específica de la unidad
    const [competenciasUnidad, setCompetenciasUnidad] = useState<CompetenciaSeleccionada[]>(
        unidad.disenaStep.competencias
    );

    const [desempenosUnidad, setDesempenosUnidad] = useState<DesempenoSeleccionado[]>(
        unidad.disenaStep.desempenos
    );

    // Sincronización Mandatoria Bidireccional (DEEP SYNC): M03 <-> Unidad
    // Dado que cualquier botón presionado aquí actualiza `matrizCompetencias` del planActivo,
    // el M03 ES la fuente de verdad. Garantiza la "herencia invertida" y corrige desincronizaciones previas.
    useEffect(() => {
        if (!planActivo || cnebCompetencias.length === 0 || competenciasAnuales.length === 0) return;

        // Comparamos el estado local actual con la fuente de verdad del M03
        const currentLocalJson = JSON.stringify(competenciasUnidad);
        const nextFromAnnualJson = JSON.stringify(competenciasAnuales);

        if (currentLocalJson !== nextFromAnnualJson) {
            setCompetenciasUnidad(competenciasAnuales);
            
            // Además, si el M03 apagó capacidades, debemos limpiar desempeños huérfanos
            // Creamos un Set de los slugs de las capacidades activas para buscar coincidencias rápidas
            const activeCapSlugs = new Set<string>();
            competenciasAnuales.forEach(c => {
                c.capacidades.forEach(cap => {
                    if (cap.seleccionada) activeCapSlugs.add(slug(cap.capacidadId));
                });
            });

            // Conservar solo desempeños cuya capacidad sigue activa
            const nextDes = desempenosUnidad.filter(d => {
                // El desempenoId tiene la forma "compSlug-capSlug-index"
                const parts = d.desempenoId.split('-');
                if (parts.length >= 2) {
                    return activeCapSlugs.has(parts[1]);
                }
                return true; // Conservar si el ID es legacy / no parseable
            });

            if (nextDes.length !== desempenosUnidad.length) {
                setDesempenosUnidad(nextDes);
            }

            onUpdate({
                disenaStep: { 
                    ...unidad.disenaStep, 
                    competencias: competenciasAnuales,
                    desempenos: nextDes
                }
            });
        }
    }, [competenciasAnuales, planActivo?.matrizCompetencias, cnebCompetencias.length]);

    // Función para sincronizar cambios de la Unidad -> M03 (Invertida)
    const syncToAnnual = (newComps: CompetenciaSeleccionada[]) => {
        if (!planActivo) return;
        
        const nextMatrix = { ...planActivo.matrizCompetencias };
        const unitIdx = unidad.numero - 1;

        // Limpiar marcas actuales de esta unidad para las competencias manejadas aquí
        newComps.forEach(comp => {
            const compId = matrixIdComp(comp.competenciaId);
            if (!nextMatrix[compId]) {
                nextMatrix[compId] = Array(9).fill(false);
            } else {
                nextMatrix[compId] = [...nextMatrix[compId]]; // Clone array to avoid Immer read-only crash
            }
            nextMatrix[compId][unitIdx] = comp.seleccionada;

            comp.capacidades.forEach(cap => {
                const capId = matrixIdCap(comp.competenciaId, cap.capacidadId);
                if (!nextMatrix[capId]) {
                    nextMatrix[capId] = Array(9).fill(false);
                } else {
                    nextMatrix[capId] = [...nextMatrix[capId]]; // Clone array
                }
                nextMatrix[capId][unitIdx] = cap.seleccionada;
            });
        });

        updatePlan(planActivo.id, { matrizCompetencias: nextMatrix });
    };

    const toggleCapacidadSync = (compId: string, capId: string) => {
        const next = competenciasUnidad.map(comp => {
            if (comp.competenciaId === compId) {
                return {
                    ...comp,
                    capacidades: comp.capacidades.map(cap => 
                        cap.capacidadId === capId ? { ...cap, seleccionada: !cap.seleccionada } : cap
                    )
                };
            }
            return comp;
        });
        
        setCompetenciasUnidad(next);
        onUpdate({
            disenaStep: { ...unidad.disenaStep, competencias: next }
        });
        syncToAnnual(next);
    };

    // Cargar desempeños del CNEB para TODAS las competencias (no solo las seleccionadas)
    useEffect(() => {
        const loadDesempenos = async () => {
            if (!planActivo || cnebCompetencias.length === 0) return;
            const newAvailable: Record<string, CNEBDesempeno[]> = {};

            // Cargamos para TODAS las competencias del CNEB
            for (const cnebComp of cnebCompetencias) {
                const filtered = cnebComp.desempenos.filter(d =>
                    d.grado.toLowerCase().includes(planActivo.grado.toLowerCase())
                );
                newAvailable[cnebComp.nombre] = filtered;
            }
            setAvailableDesempenos(newAvailable);
        };
        loadDesempenos();
    }, [planActivo?.area, planActivo?.grado, planActivo?.nivel, cnebCompetencias.length]);

    // Auto-seleccionar desempeños de capacidades marcadas en M03
    useEffect(() => {
        if (!planActivo || cnebCompetencias.length === 0 || competenciasUnidad.length === 0) return;
        if (Object.keys(availableDesempenos).length === 0) return;

        let hasNew = false;
        const currentSelectedText = new Set(desempenosUnidad.map(d => d.texto));
        const nextDesempenos = [...desempenosUnidad];

        competenciasUnidad.forEach(comp => {
            const compDesempenos = availableDesempenos[comp.competenciaId] || [];
            const compNameS = slug(comp.competenciaId);
            
            comp.capacidades.forEach(cap => {
                if (!cap.seleccionada) return; // Solo capacidades marcadas
                
                // Buscar los desempeños de esta capacidad (uso de slug para evitar fallos de matching por texto)
                const capS = slug(cap.capacidadId);
                const desForCap = compDesempenos.filter(d => slug(d.capacidad) === capS);
                
                desForCap.forEach(d => {
                    if (!currentSelectedText.has(d.texto)) {
                        nextDesempenos.push({
                            desempenoId: `${compNameS}-${capS}-${nextDesempenos.length}`,
                            texto: d.texto,
                            precisado: d.texto
                        });
                        currentSelectedText.add(d.texto);
                        hasNew = true;
                    }
                });
            });
        });

        if (hasNew) {
            setDesempenosUnidad(nextDesempenos);
            onUpdate({
                disenaStep: {
                    ...unidad.disenaStep,
                    desempenos: nextDesempenos
                }
            });
        }
    }, [availableDesempenos, competenciasUnidad]);

    const toggleCompetencia = (comp: CompetenciaSeleccionada) => {
        const isSelected = competenciasUnidad.some(c => c.competenciaId === comp.competenciaId);
        let next: CompetenciaSeleccionada[];
        
        if (isSelected) {
            next = competenciasUnidad.filter(c => c.competenciaId !== comp.competenciaId);
            // También remover desempeños asociados (hacerlo basándose en el prefijo de ID para ser exactos)
            const compPrefix = slug(comp.competenciaId);
            const nextDes = desempenosUnidad.filter(d => !d.desempenoId.startsWith(compPrefix));
            setDesempenosUnidad(nextDes);
            
            // Sync False to Matrix (Limpieza profunda para evitar que el fallback la reviva)
            if (planActivo) {
                const nextMatrix = { ...planActivo.matrizCompetencias };
                const unitIdx = unidad.numero - 1;
                
                const compS = slug(comp.competenciaId).slice(0, 15);
                Object.keys(nextMatrix).forEach(key => {
                    if (key.includes(compS)) {
                        nextMatrix[key] = [...nextMatrix[key]]; // Clone array
                        nextMatrix[key][unitIdx] = false;
                    }
                });
                
                updatePlan(planActivo.id, { matrizCompetencias: nextMatrix });
            }

            setCompetenciasUnidad(next);
            onUpdate({
                disenaStep: {
                    ...unidad.disenaStep,
                    competencias: next,
                    desempenos: nextDes
                }
            });
        } else {
            // Activar competencia con TODAS sus capacidades por defecto si es una "Disponible" nueva? 
            // El usuario pidió que si se marca, se auto-marquen los desempeños.
            // Para eso, necesitamos que las capacidades al menos estén marcadas.
            const nextComp = { 
                ...comp, 
                seleccionada: true,
                // Si viene de "Disponible", activamos sus capacidades para que el auto-select de desempeños funcione
                capacidades: comp.capacidades.map(cap => ({ ...cap, seleccionada: true }))
            };
            next = [...competenciasUnidad, nextComp];
            
            // Sync True to Matrix
            if (planActivo) {
                const nextMatrix = { ...planActivo.matrizCompetencias };
                const unitIdx = unidad.numero - 1;
                const compId = matrixIdComp(comp.competenciaId);
                
                if (!nextMatrix[compId]) {
                    nextMatrix[compId] = Array(9).fill(false);
                } else {
                    nextMatrix[compId] = [...nextMatrix[compId]]; // Clone array
                }
                nextMatrix[compId][unitIdx] = true;
                
                // También marcar capacidades en matriz por defecto al activar una nueva
                nextComp.capacidades.forEach(cap => {
                    const capId = matrixIdCap(comp.competenciaId, cap.capacidadId);
                    if (!nextMatrix[capId]) {
                        nextMatrix[capId] = Array(9).fill(false);
                    } else {
                        nextMatrix[capId] = [...nextMatrix[capId]]; // Clone array
                    }
                    nextMatrix[capId][unitIdx] = true;
                });

                updatePlan(planActivo.id, { matrizCompetencias: nextMatrix });
            }

            setCompetenciasUnidad(next);
            onUpdate({
                disenaStep: {
                    ...unidad.disenaStep,
                    competencias: next
                }
            });
        }
    };

    const toggleDesempeno = (compId: string, d: CNEBDesempeno) => {
        const existsIndex = desempenosUnidad.findIndex(du => du.texto === d.texto);
        let next: DesempenoSeleccionado[];
        if (existsIndex >= 0) {
            next = desempenosUnidad.filter((_, i) => i !== existsIndex);
        } else {
            next = [...desempenosUnidad, {
                desempenoId: `${compId}-${d.capacidad}-${desempenosUnidad.length}`,
                texto: d.texto,
                precisado: d.texto // Por defecto igual al original
            }];
        }
        setDesempenosUnidad(next);
        onUpdate({
            disenaStep: {
                ...unidad.disenaStep,
                desempenos: next
            }
        });
    };

    const updatePrecisado = (textoOriginal: string, precisado: string) => {
        const next = desempenosUnidad.map(d =>
            d.texto === textoOriginal ? { ...d, precisado } : d
        );
        setDesempenosUnidad(next);
        onUpdate({
            disenaStep: {
                ...unidad.disenaStep,
                desempenos: next
            }
        });
    };

    const { getDecryptedApiKey, getActiveModel, aiConfig } = useAIConfigStore();

    const [criteriosUnidad, setCriteriosUnidad] = useState<CriterioEvaluacion[]>(
        unidad.disenaStep.criterios || []
    );

    const handlePrecisarIA = async () => {
        if (!planActivo || desempenosUnidad.length === 0) return;
        setIsGeneratingAI(true);
        try {
            const contextoAula = `Grado: ${planActivo.grado}. Área: ${planActivo.area}. Situación: ${unidad.diagnosticoStep.situacionSignificativa || 'No definida'}`;
            const productoFinal = unidad.diagnosticoStep.productoTentativo || 'Evidencia de clase';
            
            const prompt = PROMPTS.PRECISAR_DESEMPENOS(
                desempenosUnidad.map(d => d.texto),
                contextoAula,
                productoFinal,
                planActivo.grado,
                planActivo.nivel
            );

            const apiKey = await getDecryptedApiKey();
            const activeModel = getActiveModel();

            const result = await chatCompletion(
                "Eres un especialista metodológico del MINEDU Perú experto en diversificación curricular y evaluación formativa.", 
                prompt, 
                { 
                    apiKey,
                    provider: aiConfig.provider,
                    customUrl: aiConfig.lmstudioUrl,
                    model: activeModel,
                    responseFormat: 'json',
                    temperature: 0.1
                }
            );
            
            // result is already parsed by chatCompletion
            const data: any = result;

            if (data && data.precisados && data.precisados.length === desempenosUnidad.length) {
                const nextDesempenos = desempenosUnidad.map((d, i) => ({
                    ...d,
                    precisado: data.precisados[i]
                }));
                setDesempenosUnidad(nextDesempenos);
                onUpdate({
                    disenaStep: {
                        ...unidad.disenaStep,
                        desempenos: nextDesempenos
                    }
                });
                showNotification({
                    title: "Éxito",
                    message: "Desempeños precisados correctamente con IA",
                    type: "success"
                });
            } else {
                console.error("Respuesta inesperada de IA (precisados):", data);
                throw new Error("La IA no devolvió los desempeños esperados. Intenta de nuevo.");
            }
        } catch (error: any) {
            console.error("Error al precisar con IA:", error);
            showNotification({
                title: "Error de IA",
                message: error.message || "No se pudo conectar con el motor de IA. Verifica tu API Key.",
                type: "error"
            });
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleGenerarCriterios = async () => {
        if (!planActivo || desempenosUnidad.length === 0) return;
        setIsGeneratingCriterios(true);
        try {
            const promptVisibleEnfoques = enfoquesAnuales.map(e => 
                `ENFOQUE: ${e.nombre}\n` + e.valores.map(v => 
                    `- Valor: ${v.nombre}\n  - Actitud: ${v.actitud}\n  - Se demuestra cuando: ${v.evidencia}`
                ).join('\n')
            ).join('\n\n');

            const prompt = `
Actúa como un especialista en evaluación formativa del MINEDU Perú.
Tu misión es generar criterios de evaluación claros, SIMPLES y EXTREMADAMENTE OBSERVABLES.

GRADO: ${planActivo.grado} | NIVEL: ${planActivo.nivel} | ÁREA: ${planActivo.area}

FUENTES DE DESEMPEÑOS (Competencias):
${desempenosUnidad.map((d, i) => {
    const compNombre = cnebCompetencias.find(c => 
        unidad.disenaStep.competencias.some(sc => sc.competenciaId === c.nombre && (d.desempenoId.startsWith(c.nombre) || c.desempenos.some(cd => cd.texto === d.texto)))
    )?.nombre || planActivo.area;
    return `${i + 1}. [Competencia: ${compNombre}] "${d.precisado || d.texto}"`;
}).join('\n')}

FUENTES DE ENFOQUES TRANSVERSALES (Usa estos datos técnicos):
${promptVisibleEnfoques || 'No definidos'}

REGLAS DE ORO:
1. SIMPLICIDAD: Usa lenguaje que un niño o padre entienda. Evita frases largas y burocráticas.
2. OBLIGATORIO: Genera exactamente 1 criterio por cada Desempeño Precisado Y al menos 1 criterio por cada Enfoque/Valor mencionado arriba.
3. ESTRUCTURA: Los criterios de enfoques deben ser ACTITUDINALES (ej. "Cuida los materiales", "Respeta las ideas de otros").
4. CAMPOS OBLIGATORIOS: Cada objeto del JSON debe tener 'fuente' (Nombre de la competencia o enfoque) y 'tipoFuente' ('competencia' o 'enfoque').
5. DETALLE DE ENFOQUE: Si el tipoFuente es 'enfoque', rellena obligatoriamente 'valor', 'actitud' y 'evidenciaCurricular' con los datos proporcionados arriba.

FORMATO JSON:
{
  "criterios": [
    { 
        "id": "CE-01", 
        "descripcion": "Lenguaje simple...", 
        "evidencia": "Producto visible...", 
        "fuente": "Nombre de la competencia o enfoque",
        "tipoFuente": "competencia" | "enfoque",
        "valor": "Nombre del valor",
        "actitud": "La actitud oficial",
        "evidenciaCurricular": "El se demuestra cuando..."
    }
  ]
}
`;

            const apiKey = await getDecryptedApiKey();
            const activeModel = getActiveModel();
            const result = await chatCompletion(
                "Eres un especialista en evaluación formativa del CNEB.",
                prompt,
                {
                    apiKey,
                    provider: aiConfig.provider,
                    customUrl: aiConfig.lmstudioUrl,
                    model: activeModel,
                    responseFormat: 'json',
                    temperature: 0.1
                }
            );

            // result is already parsed by chatCompletion
            const data: any = result;

            if (data?.criterios && Array.isArray(data.criterios)) {
                setCriteriosUnidad(data.criterios);
                onUpdate({
                    disenaStep: {
                        ...unidad.disenaStep,
                        criterios: data.criterios
                    }
                });
                showNotification({ title: "Éxito", message: `${data.criterios.length} criterios generados correctamente`, type: "success" });
            } else {
                throw new Error("La IA no devolvió criterios válidos.");
            }
        } catch (error: any) {
            console.error("Error generando criterios:", error);
            showNotification({ 
                title: "Error de IA", 
                message: error.message || "No se pudieron generar los criterios. Verifica tu conexión.", 
                type: "error" 
            });
        } finally {
            setIsGeneratingCriterios(false);
        }
    };

    const updateCriterio = (id: string, field: 'descripcion' | 'evidencia', value: string) => {
        const next = criteriosUnidad.map(c => c.id === id ? { ...c, [field]: value } : c);
        setCriteriosUnidad(next);
        onUpdate({ disenaStep: { ...unidad.disenaStep, criterios: next } });
    };

    const removeCriterio = (id: string) => {
        const next = criteriosUnidad.filter(c => c.id !== id);
        setCriteriosUnidad(next);
        onUpdate({ disenaStep: { ...unidad.disenaStep, criterios: next } });
    };

    return (
        <div className="space-y-8 animate-fade-in relative">
            {/* Cabecera de Contexto Compacta */}
            <div className="flex flex-wrap items-center gap-4 bg-white/5 border border-white/10 rounded-3xl p-4 mb-2 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-3 px-4 border-r border-white/10">
                    <span className="material-icons-round text-primary-teal">calendar_today</span>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Periodo Actual</p>
                        <p className="text-sm font-bold text-white uppercase">{planActivo?.periodoTipo || 'Bimestre'} {unidad.numero}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 px-4 border-r border-white/10">
                    <span className="material-icons-round text-brand-magenta">school</span>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Grado y Nivel</p>
                        <p className="text-sm font-bold text-white uppercase">{planActivo?.grado} — {planActivo?.nivel}</p>
                    </div>
                </div>
                {desempenosUnidad.length > 0 && (
                    <div className="flex-1 flex justify-end gap-3 px-2">
                        <NeonButton 
                            variant="magenta" 
                            size="sm"
                            icon="auto_awesome" 
                            className="scale-90"
                            onClick={handlePrecisarIA}
                            isLoading={isGeneratingAI}
                        >
                            PRECISAR TODOS CON IA
                        </NeonButton>
                    </div>
                )}
            </div>

            <header className="px-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-2">Diseña y Determina</h3>
                <p className="text-gray-500 text-sm max-w-2xl">
                    Sincronización automática con el <strong className="text-primary-teal">M03 — Plan Anual</strong>. 
                    Hemos pre-seleccionado las competencias priorizadas para este {planActivo?.periodoTipo.toLowerCase()}.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Panel Izquierdo: Competencias y Desempeños del CNEB */}
                <div className="lg:col-span-7 space-y-6">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Currículo Oficial (CNEB)</h4>

                    {todasLasCompetencias.map((comp) => {
                        const isSelected = competenciasUnidad.some(c => c.competenciaId === comp.competenciaId);
                        const isFromM03 = competenciasAnuales.some(ca => ca.competenciaId === comp.competenciaId);
                        const isExpanded = expandedComp === comp.competenciaId;
                        const compDesempenos = availableDesempenos[comp.competenciaId] || [];
                        const localComp = competenciasUnidad.find(c => c.competenciaId === comp.competenciaId);
                        const capsToShow = localComp?.capacidades || comp.capacidades;

                        return (
                            <Card
                                key={comp.competenciaId}
                                variant={isSelected ? 'strong' : 'flat'}
                                className={cn(
                                    "transition-all duration-300 border-2 overflow-hidden",
                                    isSelected && isFromM03 ? "border-primary-teal/30 bg-primary-teal/5" : 
                                    isSelected && !isFromM03 ? "border-brand-magenta/30 bg-brand-magenta/5" :
                                    "border-transparent opacity-60 hover:opacity-100"
                                )}
                            >
                                <div
                                    className="p-1 flex justify-between items-start gap-4 cursor-pointer"
                                    onClick={() => toggleCompetencia(comp)}
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <p className={cn(
                                                "text-[9px] font-black uppercase tracking-widest leading-none",
                                                isFromM03 ? "text-primary-teal" : "text-gray-500"
                                            )}>COMPETENCIA</p>
                                            {isFromM03 ? (
                                                <span className="px-2 py-0.5 bg-primary-teal/20 text-primary-teal border border-primary-teal/30 rounded text-[8px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(45,212,191,0.2)]">
                                                    PRIORIZADA EN M03
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-white/5 text-gray-500 border border-white/10 rounded text-[8px] font-black uppercase tracking-widest">
                                                    DISPONIBLE
                                                </span>
                                            )}
                                        </div>
                                        <h4 className={cn(
                                            "text-sm font-bold leading-tight",
                                            isSelected ? "text-white" : "text-gray-400"
                                        )}>
                                            {comp.competenciaId}
                                        </h4>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {capsToShow.filter(cap => cap.seleccionada).map((cap, idx) => (
                                                <span key={idx} className={cn(
                                                    "text-[8px] px-1.5 py-0.5 rounded-md border font-black uppercase tracking-widest",
                                                    isFromM03 
                                                        ? "bg-primary-teal/10 text-primary-teal/70 border-primary-teal/10"
                                                        : "bg-brand-magenta/10 text-brand-magenta/70 border-brand-magenta/10"
                                                )}>
                                                    {cap.capacidadId}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="toggle-container" onClick={(e) => e.stopPropagation()}>
                                        <Toggle
                                            checked={isSelected}
                                            onChange={() => toggleCompetencia(comp)}
                                        />
                                    </div>
                                </div>

                                {isSelected && (
                                    <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                                        <div
                                            className="flex items-center justify-between px-1 cursor-pointer group"
                                            onClick={() => setExpandedComp(isExpanded ? null : comp.competenciaId)}
                                        >
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                Desempeños del grado ({compDesempenos.length})
                                            </p>
                                            <span className={cn(
                                                "material-icons-round text-lg transition-transform text-gray-700 group-hover:text-white",
                                                isExpanded ? "rotate-180" : ""
                                            )}>expand_more</span>
                                        </div>

                                        {isExpanded && (
                                            <div className="space-y-6 px-1 pb-2">
                                                {capsToShow.map((capObj, cIdx) => {
                                                    const desForCap = compDesempenos.filter(d => d.capacidad === capObj.capacidadId);
                                                    if (desForCap.length === 0) return null;

                                                    return (
                                                        <div key={cIdx} className="space-y-3">
                                                            <div 
                                                                className="flex flex-wrap items-center gap-2 cursor-pointer group/cap"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleCapacidadSync(comp.competenciaId, capObj.capacidadId);
                                                                }}
                                                            >
                                                                <div className={cn(
                                                                    "w-5 h-5 rounded-md flex items-center justify-center transition-all border",
                                                                    capObj.seleccionada 
                                                                        ? "bg-primary-teal border-primary-teal text-gray-900 shadow-[0_0_10px_rgba(45,212,191,0.3)]" 
                                                                        : "bg-white/5 border-white/10 text-gray-700 group-hover/cap:border-primary-teal/40"
                                                                )}>
                                                                    <span className="material-icons-round text-xs">
                                                                        {capObj.seleccionada ? "check" : "add"}
                                                                    </span>
                                                                </div>
                                                                <p className={cn(
                                                                    "text-[10px] font-black uppercase tracking-widest leading-none transition-colors",
                                                                    capObj.seleccionada ? "text-primary-teal" : "text-gray-500 group-hover/cap:text-gray-400"
                                                                )}>
                                                                    {capObj.capacidadId}
                                                                </p>
                                                                {capObj.seleccionada && isFromM03 && (
                                                                    <span className="px-1.5 py-0.5 bg-primary-teal/20 text-primary-teal rounded text-[8px] font-black uppercase tracking-widest shadow-[0_0_8px_rgba(45,212,191,0.2)]">
                                                                        M03
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="space-y-2 pl-3 border-l-2 border-white/5 ml-1.5">
                                                                {desForCap.map((d, i) => {
                                                                    const isDesSelected = desempenosUnidad.some(du => du.texto === d.texto);
                                                                    return (
                                                                        <div
                                                                            key={i}
                                                                            className={cn(
                                                                                "p-3 rounded-xl border transition-all cursor-pointer flex gap-3",
                                                                                isDesSelected
                                                                                    ? "bg-primary-teal/10 border-primary-teal/30 text-gray-200"
                                                                                    : "bg-surface-card border-white/5 text-gray-500 hover:border-white/10",
                                                                                !capObj.seleccionada && !isDesSelected && "opacity-50 grayscale hover:grayscale-0 hover:opacity-100"
                                                                            )}
                                                                            onClick={() => toggleDesempeno(comp.competenciaId, d)}
                                                                        >
                                                                            <span className={cn(
                                                                                "material-icons-round text-lg mt-0.5 transition-colors",
                                                                                isDesSelected ? "text-primary-teal" : "text-gray-700 hover:text-gray-400"
                                                                            )}>
                                                                                {isDesSelected ? 'check_circle' : 'circle'}
                                                                            </span>
                                                                            <div className="space-y-1">
                                                                                <p className="text-xs leading-relaxed">{d.texto}</p>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {compDesempenos.length === 0 && (
                                                    <p className="text-xs text-gray-600 italic px-2">Cargando o no se encontraron desempeños para este grado...</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}

                    {cnebCompetencias.length === 0 && (
                        <div className="py-20 text-center space-y-4 bg-white/2 rounded-[3rem] border border-dashed border-white/10">
                            <span className="material-icons-round text-5xl text-gray-700">warning_amber</span>
                            <p className="text-gray-500 max-w-sm mx-auto">Sin competencias en el Plan Anual.</p>
                            <NeonButton variant="secondary" onClick={() => (window.location.href = '/plan-anual/propositos')}>IR AL M03</NeonButton>
                        </div>
                    )}
                </div>

                {/* Panel Derecho: Editor de Desempeños Precisados y Contexto */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="sticky top-24 space-y-6">
                        {/* Panel de Enfoques Priorizados (Contexto M03) — con detalle expandible */}
                        {enfoquesAnuales.length > 0 && (
                            <div className="bg-[#5e2fc1]/5 border border-[#5e2fc1]/20 rounded-3xl p-5 space-y-4 shadow-sm animate-fade-in">
                                <header className="flex items-center gap-2 text-[#5e2fc1]">
                                    <span className="material-icons-round text-lg text-purple-400">diversity_3</span>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">Enfoques Priorizados (M03)</p>
                                </header>
                                <div className="space-y-3">
                                    {(enfoquesAnuales as any[]).map((enf: any, i: number) => (
                                        <div key={i} className="bg-purple-500/5 border border-purple-500/10 rounded-2xl overflow-hidden">
                                            <button
                                                className="w-full flex items-center justify-between px-4 py-3 group hover:bg-purple-500/5 transition-colors"
                                                onClick={() => setExpandedComp(expandedComp === `enf-${i}` ? null : `enf-${i}`)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                        <span className="material-icons-round text-purple-400 text-sm">auto_awesome</span>
                                                    </div>
                                                    <p className="text-[11px] text-white font-bold leading-none uppercase tracking-wide">{enf.nombre}</p>
                                                    <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-bold">
                                                        {(enf.valores || []).length} {(enf.valores || []).length === 1 ? 'valor' : 'valores'}
                                                    </span>
                                                </div>
                                                <span className={cn(
                                                    "material-icons-round text-purple-400 text-lg transition-transform",
                                                    expandedComp === `enf-${i}` ? "rotate-180" : ""
                                                )}>expand_more</span>
                                            </button>

                                            {expandedComp === `enf-${i}` && (
                                                <div className="px-4 pb-4 space-y-3 border-t border-purple-500/10 pt-3">
                                                    {(enf.valores || []).map((v: any, j: number) => (
                                                        <div key={j} className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="material-icons-round text-purple-400 text-[14px]">star</span>
                                                                <p className="text-[10px] font-black text-purple-200 uppercase tracking-widest leading-none">
                                                                    {v.nombre}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-1.5 pl-5">
                                                                <div>
                                                                    <p className="text-[8px] font-black text-purple-400/70 uppercase tracking-widest mb-0.5">Actitud</p>
                                                                    <p className="text-[10px] text-purple-200/80 leading-relaxed">{v.actitud}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[8px] font-black text-purple-400/70 uppercase tracking-widest mb-0.5">Se demuestra cuando...</p>
                                                                    <p className="text-[10px] text-purple-300/60 leading-relaxed italic">{v.evidencia}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <header className="flex items-center justify-between px-1 pt-2">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Desempeños Precisados</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-magenta/10 text-brand-magenta rounded-full">
                                {(desempenosUnidad || []).length} SELECCIONADOS
                            </span>
                        </header>

                        {(desempenosUnidad || []).length === 0 ? (
                            <Card variant="flat" className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-50">
                                <span className="material-icons-round text-4xl text-gray-700">edit_note</span>
                                <p className="text-xs text-gray-600 max-w-[200px]">
                                    Selecciona desempeños del currículo para precisarlos aquí.
                                </p>
                            </Card>
                        ) : (
                            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar pb-10">
                                {competenciasUnidad.map((comp) => {
                                    const desempenosOfComp = desempenosUnidad.filter(du => {
                                        const matchedComp = cnebCompetencias.find(c => c.nombre === comp.competenciaId);
                                        if (matchedComp?.desempenos.some(d => d.texto === du.texto)) return true;
                                        if (du.desempenoId.startsWith(comp.competenciaId)) return true;
                                        return false;
                                    });

                                    if (desempenosOfComp.length === 0) return null;

                                    return (
                                        <div key={comp.competenciaId} className="space-y-3 bg-surface-header/20 p-4 rounded-3xl border border-white/5 mx-1">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-primary-teal/10 flex items-center justify-center shrink-0">
                                                    <span className="material-icons-round text-primary-teal text-sm">flag</span>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-primary-teal uppercase tracking-widest leading-none mb-1">Competencia Asociada</p>
                                                    <h5 className="text-[11px] font-bold text-white uppercase leading-tight">
                                                        {comp.competenciaId}
                                                    </h5>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4 pt-3 border-t border-white/5">
                                                {desempenosOfComp.map((du, i) => {
                                                    const matchCneb = cnebCompetencias.find(c => c.nombre === comp.competenciaId)?.desempenos.find(d => d.texto === du.texto);
                                                    const capacidadName = matchCneb ? matchCneb.capacidad : "";

                                                    return (
                                                        <Card key={i} variant="strong" className="space-y-4 border-l-4 border-l-brand-magenta relative overflow-hidden">
                                                            <div>
                                                                <div className="flex items-start gap-2 mb-2">
                                                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">CNEB Original</p>
                                                                    {capacidadName && (
                                                                        <span className="text-[9px] text-primary-teal/80 font-bold uppercase tracking-widest bg-primary-teal/10 px-2 py-0.5 rounded truncate max-w-[200px]" title={capacidadName}>
                                                                            {capacidadName}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 italic line-clamp-3 leading-relaxed">{du.texto}</p>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-black text-brand-magenta uppercase tracking-widest flex items-center gap-1">
                                                                    <span className="material-icons-round text-[12px]">edit</span>
                                                                    DESEMPEÑO PRECISADO
                                                                </label>
                                                                <textarea
                                                                    className="w-full bg-surface-card border border-white/5 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-magenta/50 resize-none h-24 hover:border-white/10 transition-colors"
                                                                    value={du.precisado}
                                                                    onChange={(e) => updatePrecisado(du.texto, e.target.value)}
                                                                    placeholder="Redacta el desempeño precisando el contenido o contexto..."
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => setDesempenosUnidad(prev => prev.filter(p => p.texto !== du.texto))}
                                                                className="text-[9px] font-bold text-gray-500 hover:text-red-400 uppercase tracking-widest flex items-center gap-1 transition-colors group"
                                                            >
                                                                <span className="material-icons-round text-[14px] group-hover:scale-110 transition-transform">delete</span>
                                                                QUITAR SELECCIÓN
                                                            </button>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Fallback para desempeños sin competencia clara */}
                                {desempenosUnidad.filter(du => !competenciasUnidad.some(comp => {
                                    const matchedComp = cnebCompetencias.find(c => c.nombre === comp.competenciaId);
                                    if (matchedComp?.desempenos.some(d => d.texto === du.texto)) return true;
                                    if (du.desempenoId.startsWith(comp.competenciaId)) return true;
                                    return false;
                                })).length > 0 && (
                                    <div className="space-y-3 bg-red-500/5 p-4 rounded-3xl border border-red-500/10 mx-1">
                                        <h5 className="text-[10px] font-black text-red-400 uppercase leading-tight mb-2">
                                            Desempeños por clasificar
                                        </h5>
                                        <div className="space-y-4">
                                            {desempenosUnidad.filter(du => !competenciasUnidad.some(comp => {
                                                const matchedComp = cnebCompetencias.find(c => c.nombre === comp.competenciaId);
                                                if (matchedComp?.desempenos.some(d => d.texto === du.texto)) return true;
                                                if (du.desempenoId.startsWith(comp.competenciaId)) return true;
                                                return false;
                                            })).map((du, i) => (
                                                <Card key={`orphan-${i}`} variant="strong" className="space-y-4 border-l-4 border-l-red-500">
                                                    <div>
                                                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">CNEB Original</p>
                                                        <p className="text-[10px] text-gray-400 italic line-clamp-2">{du.texto}</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-red-400 uppercase tracking-widest">DESEMPEÑO PRECISADO</label>
                                                        <textarea
                                                            className="w-full bg-surface-card border border-white/5 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-400/30 resize-none h-24"
                                                            value={du.precisado}
                                                            onChange={(e) => updatePrecisado(du.texto, e.target.value)}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => setDesempenosUnidad(prev => prev.filter(p => p.texto !== du.texto))}
                                                        className="text-[9px] font-bold text-gray-600 hover:text-red-400 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                                    >
                                                        <span className="material-icons-round text-[14px]">delete</span>
                                                        QUITAR SELECCIÓN
                                                    </button>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* SECCIÓN: CRITERIOS DE EVALUACIÓN                       */}
            {/* ═══════════════════════════════════════════════════════ */}
            {desempenosUnidad.length > 0 && (
                <div className="mt-10 pt-8 border-t border-white/5 space-y-6 animate-fade-in">
                    <header className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                                <span className="material-icons-round text-amber-400 text-lg">checklist_rtl</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">Criterios de Evaluación</h3>
                                <p className="text-[10px] text-gray-500 mt-1">Derivados de los desempeños precisados y enfoques priorizados</p>
                            </div>
                        </div>
                        <NeonButton
                            variant="magenta"
                            size="sm"
                            icon="auto_awesome"
                            onClick={handleGenerarCriterios}
                            isLoading={isGeneratingCriterios}
                        >
                            GENERAR CON IA
                        </NeonButton>
                    </header>

                    {/* Fuentes de los criterios */}
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 bg-brand-magenta/5 border border-brand-magenta/15 rounded-2xl px-4 py-2">
                            <span className="material-icons-round text-brand-magenta text-sm">edit_note</span>
                            <p className="text-[10px] font-bold text-brand-magenta uppercase tracking-widest">{desempenosUnidad.length} Desempeños Precisados</p>
                        </div>
                        {enfoquesAnuales.length > 0 && (
                            <div className="flex items-center gap-2 bg-purple-500/5 border border-purple-500/15 rounded-2xl px-4 py-2">
                                <span className="material-icons-round text-purple-400 text-sm">diversity_3</span>
                                <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">
                                    {(enfoquesAnuales as any[]).map(e => e.nombre).join(', ')}
                                </p>
                            </div>
                        )}
                    </div>

                    {(criteriosUnidad || []).length === 0 ? (
                        <Card variant="flat" className="py-16 flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                            <span className="material-icons-round text-5xl text-gray-700">fact_check</span>
                            <p className="text-xs text-gray-500 max-w-xs">
                                Presiona <strong className="text-brand-magenta">"Generar con IA"</strong> para crear criterios de evaluación basados en tus desempeños precisados y los enfoques transversales priorizados.
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {criteriosUnidad.map((criterio, idx) => (
                                <div
                                    key={criterio.id}
                                    className="group bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-3 hover:border-amber-500/20 transition-colors relative"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-amber-400 text-xs font-black">{idx + 1}</span>
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                {criterio.tipoFuente === 'enfoque' ? (
                                                    <span className="flex items-center gap-1 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-full text-[9px] font-black text-purple-300 uppercase tracking-tight">
                                                        <span className="material-icons-round text-[12px]">diversity_3</span>
                                                        ENFOQUE: {criterio.fuente}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-full text-[9px] font-black text-brand-magenta uppercase tracking-tight">
                                                        <span className="material-icons-round text-[12px]">school</span>
                                                        {criterio.fuente || 'COMPETENCIA'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Detalles técnicos para Enfoques */}
                                            {criterio.tipoFuente === 'enfoque' && (
                                                <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 space-y-2 mt-2">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-0.5">Valor</p>
                                                            <p className="text-[10px] text-purple-200 font-medium">{criterio.valor}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-0.5">Actitud</p>
                                                            <p className="text-[10px] text-purple-300 leading-tight">{criterio.actitud}</p>
                                                        </div>
                                                    </div>
                                                    <div className="pt-2 border-t border-purple-500/10">
                                                        <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-0.5 text-center">Referencia Curricular (Se demuestra cuando...)</p>
                                                        <p className="text-[9px] text-purple-400/60 italic text-center line-clamp-2 px-4">{criterio.evidenciaCurricular}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Criterio</label>
                                                <textarea
                                                    className="w-full bg-transparent border-b border-white/10 text-sm text-white focus:outline-none focus:border-amber-400/50 resize-none pb-1 transition-colors"
                                                    value={criterio.descripcion}
                                                    onChange={e => updateCriterio(criterio.id, 'descripcion', e.target.value)}
                                                    rows={2}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                                    <span className="material-icons-round text-[11px]">visibility</span>
                                                    Evidencia
                                                </label>
                                                <textarea
                                                    className="w-full bg-transparent border-b border-white/5 text-[11px] text-gray-400 focus:outline-none focus:border-amber-400/30 resize-none pb-1 transition-colors"
                                                    value={criterio.evidencia}
                                                    onChange={e => updateCriterio(criterio.id, 'evidencia', e.target.value)}
                                                    rows={1}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeCriterio(criterio.id)}
                                            className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Eliminar criterio"
                                        >
                                            <span className="material-icons-round text-[16px]">close</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

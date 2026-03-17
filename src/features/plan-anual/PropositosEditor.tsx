import React, { useState, useEffect, useCallback } from 'react';
import { usePlanAnualStore, useAIConfigStore, usePerfilStore, useNotificationStore } from '@/store';
import { cnebService } from '@/services/cneb';
import { ENFOQUES_TRANSVERSALES } from '@/services/cneb/enfoques-transversales';
import {
    generarUnidadesCalendario,
    TOTAL_UNITS,
    UNITS_PER_PERIOD,
    getAllPeriodoNombres,
} from '@/services/cneb/calendario-2026';
import { AIButton } from '@/components/ui/AIButton';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { TabSwitch } from '@/components/ui/TabSwitch';
import { cn } from '@/lib/cn';
import type { CNEBCompetencia, PeriodoTipo, TipoUnidad } from '@/types/schemas';
import { chatCompletion } from '@/services/ai';
import { CalendarioComunalVisual } from './CalendarioComunalVisual';
import { CalendarioComunalData } from '@/types/schemas';

// ─── Radar de Cobertura (Internal Component) ──────────────────────────────────
const CoverageRadar: React.FC<{ 
    competencias: CNEBCompetencia[], 
    matrix: Record<string, boolean[]>,
    label: string
}> = ({ competencias, matrix, label }) => {
    if (competencias.length === 0) return null;

    const stats = competencias.map(comp => {
        // Obtenemos solo las capacidades (IDs que terminen en _cap_...)
        const capacities = comp.capacidades;
        const capacitiesMatch = capacities.map(cap => {
            const capId = matrixIdCap(comp.nombre, cap);
            return matrix[capId]?.some(v => v) || false;
        });
        
        const coveredCount = capacitiesMatch.filter(Boolean).length;
        const totalCount = capacities.length;
        const percent = Math.round((coveredCount / totalCount) * 100);
        
        return { nombre: comp.nombre, percent, coveredCount, totalCount };
    });

    const totalPercent = Math.round(
        (stats.reduce((acc, s) => acc + s.coveredCount, 0) / 
         stats.reduce((acc, s) => acc + s.totalCount, 0)) * 100
    );

    return (
        <div className="fixed right-6 top-32 w-64 z-[40] animate-slide-in-right hidden xl:block">
            <div className="bg-surface-card/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl shadow-black/50 overflow-hidden relative group">
                {/* Decorative glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-teal/10 rounded-full blur-[80px]" />
                
                <header className="relative mb-6">
                    <p className="text-[10px] font-black text-primary-teal uppercase tracking-[.2em] mb-1">Radar de Cobertura</p>
                    <h4 className="text-xs font-bold text-white uppercase italic">{label}</h4>
                </header>

                <div className="relative space-y-6">
                    {/* Main Gauge */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="64" cy="64" r="58"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-white/5"
                                />
                                <circle
                                    cx="64" cy="64" r="58"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    strokeDasharray={364}
                                    strokeDashoffset={364 - (364 * totalPercent) / 100}
                                    strokeLinecap="round"
                                    className="text-primary-teal transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-3xl font-black ${totalPercent === 100 ? 'text-brand-magenta' : 'text-white'}`}>
                                    {totalPercent}%
                                </span>
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Global</span>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        {stats.map((s, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between items-end px-1">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase leading-none truncate max-w-[140px]">{s.nombre}</p>
                                    <p className="text-[10px] font-black text-white leading-none">{s.percent}%</p>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className={cn(
                                            "h-full transition-all duration-700 rounded-full",
                                            s.percent > 66 ? "bg-primary-teal" : s.percent > 33 ? "bg-amber-500" : "bg-red-500/50"
                                        )}
                                        style={{ width: `${s.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPercent === 100 && (
                        <div className="p-3 bg-brand-magenta/10 border border-brand-magenta/20 rounded-2xl flex items-center gap-3 animate-pulse">
                            <span className="material-icons-round text-brand-magenta text-lg">verified</span>
                            <p className="text-[9px] font-black text-brand-magenta uppercase leading-tight">Cobertura Total Alcanzada</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Genera un ID de matriz para una capacidad: comp_<slug>_cap_<slug> */
function matrixIdCap(compNombre: string, capNombre: string): string {
    const slug = (s: string) =>
        s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').slice(0, 40);
    return `comp_${slug(compNombre)}_cap_${slug(capNombre)}`;
}

/** Genera un ID de matriz para una competencia padre: comp_<slug> */
function matrixIdComp(compNombre: string): string {
    const slug = (s: string) =>
        s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').slice(0, 40);
    return `comp_${slug(compNombre)}`;
}

/** Genera un ID de matriz para un valor de enfoque */
function matrixIdVal(enfoqueId: string, valorId: string): string {
    return `${enfoqueId}_val_${valorId}`;
}

/** Determina si un ID es una hoja (capacidad o valor) */
function isLeafId(id: string): boolean {
    return id.includes('_cap_') || id.includes('_val_');
}

/** Obtiene el parentId de una hoja */
function getParentId(id: string): string {
    if (id.includes('_cap_')) return id.split('_cap_')[0];
    if (id.includes('_val_')) return id.split('_val_')[0];
    return id;
}

/** Obtiene todos los IDs hijos de un padre en la matriz */
function getChildIds(parentId: string, matrix: Record<string, boolean[]>): string[] {
    const sep = parentId.startsWith('comp_') ? '_cap_' : '_val_';
    return Object.keys(matrix).filter((k) => k.startsWith(parentId + sep));
}

/** Rota el tipo de unidad: Unidad → Proyecto → Modulo → Unidad */
function rotateTipo(current: TipoUnidad): TipoUnidad {
    const cycle: TipoUnidad[] = ['Unidad', 'Proyecto', 'Modulo'];
    return cycle[(cycle.indexOf(current) + 1) % 3];
}

/** Formato corto del tipo */
function tipoAbrev(tipo: TipoUnidad, num: number): string {
    const map: Record<TipoUnidad, string> = { Unidad: 'U', Proyecto: 'P', Modulo: 'M' };
    return `${map[tipo]}${num}`;
}


// ─── Component ────────────────────────────────────────────────────────────────

export const PropositosEditor: React.FC = () => {
    const { planActivo, updatePlan, isSyncing } = usePlanAnualStore();
    const { perfil } = usePerfilStore();
    const { aiConfig, getDecryptedApiKey } = useAIConfigStore();
    const { showNotification } = useNotificationStore();

    // CNEB data
    const [cnebCompetencias, setCnebCompetencias] = useState<CNEBCompetencia[]>([]);
    const [cnebTransversales, setCnebTransversales] = useState<CNEBCompetencia[]>([]);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    // Local state
    const [periodoTipo, setPeriodoTipo] = useState<PeriodoTipo>(planActivo?.periodoTipo || 'Bimestre');
    const [matrix, setMatrix] = useState<Record<string, boolean[]>>(planActivo?.matrizCompetencias || {});
    const [unidades, setUnidades] = useState(planActivo?.unidades || []);
    const [bitacoraPedagogica, setBitacoraPedagogica] = useState(planActivo?.bitacoraPedagogica || '');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [expandedEnfoques, setExpandedEnfoques] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'calendario' | 'competencias' | 'enfoques'>('calendario');

    // Calendar state
    const [calendarioComunal, setCalendarioComunal] = useState(planActivo?.calendarioComunal || '');
    const [calendarioComunalData, setCalendarioComunalData] = useState<CalendarioComunalData | null>(planActivo?.calendarioComunalData || null);

    const periodNombres = getAllPeriodoNombres(periodoTipo);
    const isChecked = (id: string, unitIdx: number) => matrix[id]?.[unitIdx] || false;

    // BUG-09 fix: Resync local state when plan data arrives from cloud
    useEffect(() => {
        if (!planActivo) return;
        setPeriodoTipo(planActivo.periodoTipo || 'Bimestre');
        setMatrix(planActivo.matrizCompetencias || {});
        setUnidades(planActivo.unidades || []);
        if (planActivo.calendarioComunal !== undefined) setCalendarioComunal(planActivo.calendarioComunal);
        if (planActivo.calendarioComunalData !== undefined) setCalendarioComunalData(planActivo.calendarioComunalData);
    }, [planActivo?.id]);

    // Auto-save Calendar
    useEffect(() => {
        if (!planActivo) return;
        if (calendarioComunal !== planActivo.calendarioComunal || JSON.stringify(calendarioComunalData) !== JSON.stringify(planActivo.calendarioComunalData)) {
            const timeout = setTimeout(() => {
                updatePlan(planActivo.id, {
                    calendarioComunal,
                    calendarioComunalData
                });
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [calendarioComunal, calendarioComunalData, planActivo, updatePlan]);

    useEffect(() => {
        if (!planActivo) return;
        setPeriodoTipo(planActivo.periodoTipo || 'Bimestre');
        setMatrix(planActivo.matrizCompetencias || {});
        setUnidades(planActivo.unidades || []);
        setBitacoraPedagogica(planActivo.bitacoraPedagogica || '');
    }, [
        planActivo?.id, 
        // Monitor key data fields to sync when cloud finishes loading
        JSON.stringify(planActivo?.matrizCompetencias), 
        JSON.stringify(planActivo?.unidades)
    ]);

    const totalUnits = TOTAL_UNITS[periodoTipo];
    const unitsPerPeriod = UNITS_PER_PERIOD[periodoTipo];

    // ─── Load CNEB Data ───────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            if (!planActivo) return;
            setLoading(true);
            const [areaData, transData] = await Promise.all([
                cnebService.getCompetenciasByAreaNivel(planActivo.area, planActivo.nivel),
                cnebService.getCompetenciasByAreaNivel('Competencias Transversales', planActivo.nivel),
            ]);
            setCnebCompetencias(areaData);
            setCnebTransversales(transData);
            setLoading(false);
        };
        load();
    }, [planActivo?.area, planActivo?.nivel]);

    // --- Auto-save ---
    const saveTimeout = React.useRef<ReturnType<typeof setTimeout>>();
    const autoSave = useCallback(() => {
        if (!planActivo) return;

        // PREVENT OVERWRITE: Solo guardar si hay cambios reales respecto al planActivo cargado
        const hasChanges = 
            periodoTipo !== planActivo.periodoTipo ||
            JSON.stringify(matrix) !== JSON.stringify(planActivo.matrizCompetencias) ||
            JSON.stringify(unidades) !== JSON.stringify(planActivo.unidades) ||
            bitacoraPedagogica !== planActivo.bitacoraPedagogica;

        if (!hasChanges) return;

        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            updatePlan(planActivo.id, {
                periodoTipo,
                matrizCompetencias: matrix,
                unidades,
                bitacoraPedagogica,
            });
        }, 1200);
    }, [planActivo, periodoTipo, matrix, unidades, bitacoraPedagogica, updatePlan]);

    useEffect(() => { 
        autoSave(); 
    }, [matrix, unidades, periodoTipo, bitacoraPedagogica, autoSave]);

    // ─── Period Toggle ────────────────────────────────────────────────────
    const handlePeriodoChange = (tipo: PeriodoTipo) => {
        if (!planActivo) return;
        
        setPeriodoTipo(tipo);
        const newUnidades = generarUnidadesCalendario(tipo, unidades);
        setUnidades(newUnidades);
        
        // Resize matrix arrays to new totalUnits
        const newTotal = TOTAL_UNITS[tipo];
        const newMatrix = { ...matrix };
        for (const key of Object.keys(newMatrix)) {
            const arr = newMatrix[key];
            if (arr.length < newTotal) {
                newMatrix[key] = [...arr, ...Array(newTotal - arr.length).fill(false)];
            } else if (arr.length > newTotal) {
                newMatrix[key] = arr.slice(0, newTotal);
            }
        }
        setMatrix(newMatrix);

        // Notificación de impacto global (Tarea 3.3)
        showNotification({
            title: 'Calendario Actualizado',
            message: `El plan anual se ha reorganizado en ${tipo}s. Las unidades se han redistribuido automáticamente.`,
            type: 'success'
        });

        // Persistencia inmediata para evitar desfases entre módulos (M03 -> M04)
        updatePlan(planActivo.id, {
            periodoTipo: tipo,
            unidades: newUnidades,
            matrizCompetencias: newMatrix
        });
    };

    // Initialize units on first render if empty
    useEffect(() => {
        if (planActivo && unidades.length === 0) {
            setUnidades(generarUnidadesCalendario(periodoTipo));
        }
    }, []);

    // ─── Matrix Toggle Logic (CORE) ───────────────────────────────────────
    const handleToggleMatrix = useCallback((id: string, unitIdx: number) => {
        setMatrix((prev) => {
            const next = { ...prev };
            const ensureRow = (key: string) => {
                if (!next[key]) next[key] = Array(totalUnits).fill(false);
                else next[key] = [...next[key]];
            };

            if (isLeafId(id)) {
                // Toggle leaf
                ensureRow(id);
                next[id][unitIdx] = !next[id][unitIdx];

                // Update parent
                const parentId = getParentId(id);
                ensureRow(parentId);
                const childIds = getChildIds(parentId, next);
                const anyChildMarked = childIds.some((cid) => next[cid]?.[unitIdx]);
                next[parentId][unitIdx] = anyChildMarked;
            } else {
                // Parent click — only allow uncheck (deselect all children)
                ensureRow(id);
                if (next[id][unitIdx]) {
                    next[id][unitIdx] = false;
                    const childIds = getChildIds(id, next);
                    for (const cid of childIds) {
                        ensureRow(cid);
                        next[cid][unitIdx] = false;
                    }
                }
                // If not checked, block (can't check parent directly)
            }
            return next;
        });
    }, [totalUnits]);

    // ─── Unit Type Toggle ─────────────────────────────────────────────────
    const handleRotateTipo = (idx: number) => {
        const updated = [...unidades];
        updated[idx] = { ...updated[idx], tipo: rotateTipo(updated[idx].tipo) };
        setUnidades(updated);
    };

    // ─── Unit Date Change ─────────────────────────────────────────────────
    const handleDateChange = (idx: number, which: 'start' | 'end', date: string) => {
        const updated = [...unidades];
        const [start, end] = updated[idx].fecha.split('|');
        updated[idx] = {
            ...updated[idx],
            fecha: which === 'start' ? `${date}|${end}` : `${start}|${date}`,
        };
        setUnidades(updated);
    };

    // ─── Unit Title Change ────────────────────────────────────────────────
    const handleTituloChange = (idx: number, titulo: string) => {
        const updated = [...unidades];
        updated[idx] = { ...updated[idx], titulo };
        setUnidades(updated);
    };

    // ─── Info Row Toggle ──────────────────────────────────────────────────
    const toggleExpand = (compNombre: string) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            next.has(compNombre) ? next.delete(compNombre) : next.add(compNombre);
            return next;
        });
    };

    // ─── Enfoque Row Toggle ───────────────────────────────────────────────
    const toggleEnfoque = (enfoqueId: string) => {
        setExpandedEnfoques((prev) => {
            const next = new Set(prev);
            next.has(enfoqueId) ? next.delete(enfoqueId) : next.add(enfoqueId);
            return next;
        });
    };

    const handleSugerirPropositosAI = async () => {
        if (!planActivo || !perfil) return;
        setAiLoading(true);
        try {
            const allComps = [...cnebCompetencias, ...cnebTransversales];

            const competenciasYCapacidades = allComps.map(c =>
                `- Competencia: "${c.nombre}"\n  Capacidades: ${c.capacidades.map(cap => `"${cap}"`).join(', ')}`
            ).join('\n\n');

            const eventosEstructurados = planActivo.calendarioComunalData?.events
                ?.filter(e => !e.needsReview && (e.date || e.startDate))
                .map(e => `- ${e.title} (${e.type}) | Fecha: ${e.date || `${e.startDate} a ${e.endDate}`}`)
                .join('\n') || '';

            const contextoCalendario = eventosEstructurados
                ? `ACTIVIDADES DEL CALENDARIO COMUNAL:\n${eventosEstructurados}\n\nCONTEXTO SOCIOCULTURAL: "${planActivo.calendarioComunal}"`
                : `CONTEXTO SOCIOCULTURAL: "${planActivo.calendarioComunal}"`;

            const listaUnidades = unidades.slice(0, totalUnits).map((u, i) => {
                const [start, end] = u.fecha.split('|');
                return `UNIDAD ${i + 1} (Índice ${i}): ${start} a ${end} — ${u.tipo} — "${u.titulo || 'Sin título'}"`;
            }).join('\n');

            const prompt = `Actúa como un experto en educación y diseño curricular bajo el enfoque del CNEB (Perú).
OBJETIVO: Completar el Cartel de Propósitos distribuyendo las COMPETENCIAS y CAPACIDADES pertinentes a lo largo del año.

DATOS DEL CURSO:
- Área Curricular: ${planActivo.area}
- Nivel Educativo: ${planActivo.nivel}

${contextoCalendario}

UNIDADES DEL AÑO:
${listaUnidades}

COMPETENCIAS Y CAPACIDADES DISPONIBLES (Obligatorio usar SOLO los nombres exactos de esta lista):
${competenciasYCapacidades}

INSTRUCCIONES PEDAGÓGICAS:
1. Actúa como un experto: Considera el desarrollo esperado de los estudiantes para el nivel ${planActivo.nivel} y las necesidades propias del área de ${planActivo.area}.
2. Analiza el Calendario Comunal: Relaciona claramente las fechas, actividades y el contexto sociocultural con las competencias y capacidades que mejor se puedan desarrollar en cada periodo (Unidad).
3. Asegura progresión y coherencia: Selecciona las capacidades más pertinentes por unidad, asegurando que a lo largo del año se trabajen TODAS las competencias del área.
4. Transversales: Incluye siempre capacidades de las competencias transversales (TIC y/o Autonomía) alineadas al contexto de la unidad.
5. Asigna entre 3 a 5 capacidades por unidad (contando área y transversales) para mantener la viabilidad pedagógica.

FORMATO DE SALIDA (SÓLO JSON PURO):
{
  "unidades_distribuidas": [
    {
      "indice": 0,
      "capacidades": ["Percibe manifestaciones artístico-culturales", "Personaliza entornos virtuales"]
    }
  ]
}
NOTA: El "indice" debe ir desde 0 hasta ${totalUnits - 1}. Responde exclusivamente con el JSON sin markdown extra.`;

            const apiKey = await getDecryptedApiKey();
            const result = await chatCompletion(
                "Eres un experto en el CNEB de Perú. Generas planificaciones coherentes y fundamentadas pedagógicamente.",
                prompt,
                {
                    apiKey,
                    provider: aiConfig.provider,
                    customUrl: aiConfig.lmstudioUrl,
                    model: aiConfig.activeModel,
                    responseFormat: 'json',
                    temperature: 0.2, // Un poco de flexibilidad para razonar, pero estricto en el JSON
                    maxTokens: 3000
                }
            );

            let data: any = result;
            if (typeof result === 'string') {
                const cleaned = result.replace(/```json|```/g, '').replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '').trim();
                const start = cleaned.indexOf('{');
                const end = cleaned.lastIndexOf('}');
                if (start !== -1 && end !== -1) {
                    try {
                        data = JSON.parse(cleaned.substring(start, end + 1));
                    } catch (e) {
                        throw new Error("Formato JSON inválido de la IA");
                    }
                }
            }

            if (!data || !data.unidades_distribuidas) throw new Error("La IA no devolvió la estructura 'unidades_distribuidas'");

            setMatrix((prev) => {
                const next = { ...prev };
                // Borrar solo las capacidades marcadas previamente (IDs que empiezan con comp_)
                Object.keys(next).forEach(k => { if (k.startsWith('comp_')) delete next[k]; });

                const getEmptyChecks = () => Array(totalUnits).fill(false);
                const findIdByName = (name: string): string | null => {
                    const clean = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '').trim();
                    const target = clean(name);
                    if (!target) return null;

                    for (const comp of allComps) {
                        for (const cap of comp.capacidades) {
                            const capClean = clean(cap);
                            if (capClean === target || target.includes(capClean) || capClean.includes(target)) {
                                return matrixIdCap(comp.nombre, cap);
                            }
                        }
                    }
                    return null;
                };

                let mappedCount = 0;
                data.unidades_distribuidas.forEach((u: any) => {
                    let idx = -1;
                    if (u.indice !== undefined) {
                        idx = Number(u.indice);
                        if (idx > 0 && idx === totalUnits) idx = totalUnits - 1;
                        else if (idx >= 1 && idx <= totalUnits && data.unidades_distribuidas.every((item: any) => Number(item.indice) > 0)) {
                            idx = idx - 1;
                        }
                    } else if (u.unidad !== undefined) {
                        const uNum = typeof u.unidad === 'string' ? parseInt(u.unidad.replace(/[^0-9]/g, '')) : Number(u.unidad);
                        idx = uNum - 1;
                    }

                    if (idx >= 0 && idx < totalUnits && Array.isArray(u.capacidades)) {
                        u.capacidades.forEach((capName: string) => {
                            const id = findIdByName(capName);
                            if (id) {
                                mappedCount++;
                                if (!next[id]) next[id] = getEmptyChecks();
                                next[id][idx] = true;
                                // Propagar a competencia padre
                                const parentId = getParentId(id);
                                if (!next[parentId]) next[parentId] = getEmptyChecks();
                                next[parentId][idx] = true;
                            }
                        });
                    }
                });

                if (mappedCount === 0) {
                    console.warn('[IA Propósitos] No se pudo mapear ninguna capacidad. Datos:', data);
                }

                return next;
            });

            showNotification({ title: 'Competencias Mapeadas', message: 'Se han distribuido las capacidades y competencias coherentemente.', type: 'success' });
        } catch (err: any) {
            console.error('[IA Propósitos]', err);
            showNotification({ title: 'Error IA', message: err.message || 'No se pudo generar la sugerencia.', type: 'error' });
        } finally {
            setAiLoading(false);
        }
    };

    // ─── AI: Sugerir Enfoques Transversales ───────────────────────────────
    const handleSugerirEnfoquesAI = async () => {
        if (!planActivo || !perfil) return;
        setAiLoading(true);
        try {
            const eventosEstructurados = planActivo.calendarioComunalData?.events
                ?.filter(e => !e.needsReview && (e.date || e.startDate))
                .map(e => `- ${e.title} | Enfoques sugeridos: ${e.transversalApproaches.join(', ')}`)
                .join('\n') || '';

            const contextoCalendario = eventosEstructurados
                ? `EVENTOS:\n${eventosEstructurados}\n\nM03 Descripción: "${planActivo.calendarioComunal}"`
                : `Contexto Comunal: "${planActivo.calendarioComunal}"`;

            const listaUnidades = unidades.slice(0, totalUnits).map((u, i) => `U${i + 1}: ${u.tipo} — ${u.titulo || 'Sin título'}`).join('\n');

            const listaEnfoquesValores = ENFOQUES_TRANSVERSALES.map(e =>
                `- ${e.nombre}: ${e.valores.map(v => v.nombre).join(', ')}`
            ).join('\n');

            const prompt = `Actúa como un experto en el CNEB de Perú.
OBJETIVO: Distribuir los ENFOQUES TRANSVERSALES y sus VALORES en las unidades de tal manera que AL FINAL DEL AÑO SE HAYAN USADO TODOS.

DATOS:
${contextoCalendario}
- Unidades a planificar:
${listaUnidades}

LISTA OFICIAL DE ENFOQUES Y VALORES (REQUISITO: USAR TODOS):
${listaEnfoquesValores}

REGLAS CRÍTICAS:
1. Asigna entre 2 y 3 valores (de diferentes enfoques o del mismo) por cada unidad.
2. AL FINAL DEL AÑO, deben haber aparecido los 7 enfoques y todos sus valores al menos una vez.
3. El "indice" del JSON debe ser 0 para la Unidad 1, 1 para la Unidad 2, etc.

FORMATO DE SALIDA (SÓLO JSON PURO):
{
  "distribucion_anual": [
    {
      "indice": 0,
      "enfoques": [
        { "nombre": "Ambiental", "valores": ["Justicia y solidaridad", "Respeto a toda forma de vida"] }
      ]
    }
  ]
}
NOTA: Responde exclusivamente el JSON.`;

            const apiKey = await getDecryptedApiKey();
            const result = await chatCompletion(
                "Eres un experto en el CNEB de Perú. Tu misión es asegurar la cobertura total de enfoques y valores en el plan anual.",
                prompt,
                {
                    apiKey,
                    provider: aiConfig.provider,
                    customUrl: aiConfig.lmstudioUrl,
                    model: aiConfig.activeModel,
                    responseFormat: 'json',
                    temperature: 0.1,
                    maxTokens: 2500
                }
            );

            let data: any = result;
            if (typeof result === 'string') {
                const cleaned = result.replace(/```json|```/g, '').replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '').trim();
                const start = cleaned.indexOf('{');
                const end = cleaned.lastIndexOf('}');
                if (start !== -1 && end !== -1) {
                    try {
                        data = JSON.parse(cleaned.substring(start, end + 1));
                    } catch (e) {
                        throw new Error("Formato JSON inválido");
                    }
                }
            }

            if (!data || !data.distribucion_anual) {
                data = data.unidades_enfoques ? { distribucion_anual: data.unidades_enfoques } : data;
            }

            if (!data.distribucion_anual) throw new Error("No se recibió la distribución.");

            setMatrix((prev) => {
                const next = { ...prev };
                Object.keys(next).forEach(k => { if (!k.startsWith('comp_')) delete next[k]; });

                const getEmptyChecks = () => Array(9).fill(false);
                const cleanStr = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '').trim();

                data.distribucion_anual.forEach((u: any) => {
                    let idx = -1;
                    if (u.indice !== undefined) idx = Number(u.indice);
                    else if (u.unidad !== undefined) idx = Number(u.unidad) - 1;

                    if (idx >= 0 && idx < totalUnits && Array.isArray(u.enfoques)) {
                        u.enfoques.forEach((enfObj: any) => {
                            const enfNombre = typeof enfObj === 'string' ? enfObj : enfObj.nombre;
                            const enfValores = Array.isArray(enfObj.valores) ? enfObj.valores : [];

                            const targetEnf = cleanStr(enfNombre);
                            const enfoqueEncontrado = ENFOQUES_TRANSVERSALES.find(e =>
                                cleanStr(e.nombre).includes(targetEnf) || targetEnf.includes(cleanStr(e.nombre)) || cleanStr(e.id).includes(targetEnf)
                            );

                            if (enfoqueEncontrado) {
                                if (enfValores.length > 0) {
                                    enfValores.forEach((valName: string) => {
                                        const targetVal = cleanStr(valName);
                                        const valorEncontrado = enfoqueEncontrado.valores.find(v =>
                                            cleanStr(v.nombre).includes(targetVal) || targetVal.includes(cleanStr(v.nombre))
                                        );
                                        if (valorEncontrado) {
                                            const valId = matrixIdVal(enfoqueEncontrado.id, valorEncontrado.id);
                                            if (!next[valId]) next[valId] = getEmptyChecks();
                                            next[valId][idx] = true;

                                            const pId = enfoqueEncontrado.id;
                                            if (!next[pId]) next[pId] = getEmptyChecks();
                                            next[pId][idx] = true;
                                        }
                                    });
                                } else {
                                    const valId = matrixIdVal(enfoqueEncontrado.id, enfoqueEncontrado.valores[0].id);
                                    if (!next[valId]) next[valId] = getEmptyChecks();
                                    next[valId][idx] = true;

                                    const pId = enfoqueEncontrado.id;
                                    if (!next[pId]) next[pId] = getEmptyChecks();
                                    next[pId][idx] = true;
                                }
                            }
                        });
                    }
                });
                return next;
            });

            showNotification({
                title: 'Planificación Completa',
                message: 'Se han distribuido todos los enfoques y valores en el año.',
                type: 'success'
            });
        } catch (err: any) {
            console.error('[IA Enfoques]', err);
            showNotification({ title: 'Error', message: err.message || 'No se pudo procesar.', type: 'error' });
        } finally {
            setAiLoading(false);
        }
    };
    const handleGenerarBorradorSugeridoAI = async () => {
        if (!planActivo || !perfil) return;
        setAiLoading(true);
        try {
            const allComps = [...cnebCompetencias, ...cnebTransversales];
            const competenciasYCapacidades = allComps.map(c =>
                `- "${c.nombre}": ${c.capacidades.map(cap => `"${cap}"`).join(', ')}`
            ).join('\n');

            const listaEnfoquesValores = ENFOQUES_TRANSVERSALES.map(e =>
                `- ${e.nombre}: ${e.valores.map(v => v.nombre).join(', ')}`
            ).join('\n');

            const eventosEstructurados = planActivo.calendarioComunalData?.events
                ?.filter(e => e.date || e.startDate)
                .map(e => `- ${e.title} (${e.type}) | Mes: ${e.date ? e.date.split('-')[1] : e.startDate?.split('-')[1]}`)
                .join('\n') || '';

            const prompt = `Actúa como un experto en el CNEB (Perú).
OBJETIVO: Generar un BORRADOR SUGERIDO de la distribución anual.

DATOS:
- Área: ${planActivo.area} | Grado: ${planActivo.grado}
- Unidades: ${unidades.map((u, i) => `U${i + 1}: ${u.tipo}`).join(', ')}
- Calendario: ${eventosEstructurados}

LISTAS OFICIALES:
1. COMPETENCIAS Y CAPACIDADES:
${competenciasYCapacidades}

2. ENFOQUES Y VALORES:
${listaEnfoquesValores}

REGLAS:
1. Distribuye de 3 a 5 capacidades totales por unidad (Área + Transversales).
2. Asigna 1 enfoque con 1-2 valores por unidad.
3. Redacta una JUSTIFICACIÓN breve (3-4 líneas) del porqué de esta distribución por unidades/bimestres.

FORMATO JSON:
{
  "distribucion": [
    {
      "unidad": 1, 
      "capacidades": ["Texto o fragmento clave de la capacidad"],
      "enfoques": [
        { "nombre": "Nombre Enfoque", "valores": ["Nombre del Valor"] }
      ]
    }
  ],
  "justificacion": "..."
}
Responde SOLO JSON puro. No inventes capacidades, usa las proporcionadas.`;

            const apiKey = await getDecryptedApiKey();
            const result = await chatCompletion(
                "Diseñador curricular CNEB. Coherencia y pertinencia contextual.",
                prompt,
                {
                    apiKey,
                    provider: aiConfig.provider,
                    customUrl: aiConfig.lmstudioUrl,
                    model: aiConfig.activeModel,
                    responseFormat: 'json',
                    temperature: 0.1,
                    maxTokens: 4000
                }
            );

            // Extracción robusta de JSON
            let data: any = result;
            if (typeof result === 'string') {
                const jsonMatch = result.match(/\{[\s\S]*\}/);
                const cleaned = jsonMatch ? jsonMatch[0] : result;
                try {
                    data = JSON.parse(cleaned);
                } catch (e) {
                    console.error("Error parseando JSON de IA:", e, result);
                    throw new Error("La IA devolvió un formato que no pude entender. Por favor reintenta.");
                }
            }

            if (!data || !data.distribucion) throw new Error("La IA no devolvió la distribución esperada.");
            if (allComps.length === 0) throw new Error("Los datos del CNEB aún no han cargado. Reintenta en unos segundos.");

            let matchesCount = 0;

            setMatrix((prev) => {
                const next = { ...prev };
                // Limpiar solo los relacionados a competencias y enfoques para el borrador
                Object.keys(next).forEach(k => {
                    if (k.startsWith('comp_') || ENFOQUES_TRANSVERSALES.some(e => k.startsWith(e.id))) {
                        delete next[k];
                    }
                });
                
                const getEmptyChecks = () => Array(totalUnits).fill(false);
                const clean = (s: string) => {
                    if (!s) return "";
                    return s.toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]/g, '')
                        .trim();
                };

                data.distribucion.forEach((u: any) => {
                    let idx = -1;
                    if (u.indice !== undefined) idx = Number(u.indice);
                    else if (u.unidad !== undefined) idx = Number(u.unidad) - 1;

                    if (idx < 0 || idx >= totalUnits) return;

                    // Mapeo flexible de capacidades
                    u.capacidades?.forEach((targetRaw: string) => {
                        const target = clean(targetRaw);
                        if (!target || target.length < 4) return;

                        allComps.forEach(comp => {
                            // Probar con el nombre de la competencia primero (si la IA la puso en capacidades)
                            if (clean(comp.nombre).includes(target) || target.includes(clean(comp.nombre))) {
                                const pId = matrixIdComp(comp.nombre);
                                if (!next[pId]) next[pId] = getEmptyChecks();
                                next[pId][idx] = true;
                                matchesCount++;
                            }

                            comp.capacidades.forEach(cap => {
                                const capClean = clean(cap);
                                // Coincidencia parcial o cruzada
                                if (capClean.includes(target) || target.includes(capClean)) {
                                    const id = matrixIdCap(comp.nombre, cap);
                                    if (!next[id]) next[id] = getEmptyChecks();
                                    next[id][idx] = true;
                                    
                                    const pId = matrixIdComp(comp.nombre);
                                    if (!next[pId]) next[pId] = getEmptyChecks();
                                    next[pId][idx] = true;
                                    matchesCount++;
                                }
                            });
                        });
                    });

                    // Mapeo flexible de enfoques
                    u.enfoques?.forEach((enfObj: any) => {
                        const targetEnf = clean(enfObj.nombre);
                        if (!targetEnf) return;

                        const enfEncontrado = ENFOQUES_TRANSVERSALES.find(e => {
                            const eName = clean(e.nombre);
                            return eName.includes(targetEnf) || targetEnf.includes(eName);
                        });

                        if (enfEncontrado) {
                            if (!next[enfEncontrado.id]) next[enfEncontrado.id] = getEmptyChecks();
                            next[enfEncontrado.id][idx] = true;
                            matchesCount++;

                            enfObj.valores?.forEach((valName: string) => {
                                const targetVal = clean(valName);
                                const valEncontrado = enfEncontrado.valores.find(v => {
                                    const vName = clean(v.nombre);
                                    return vName.includes(targetVal) || targetVal.includes(vName);
                                });

                                if (valEncontrado) {
                                    const vId = matrixIdVal(enfEncontrado.id, valEncontrado.id);
                                    if (!next[vId]) next[vId] = getEmptyChecks();
                                    next[vId][idx] = true;
                                    matchesCount++;
                                }
                            });
                        }
                    });
                });
                return next;
            });

            if (data.justificacion) setBitacoraPedagogica(data.justificacion);

            if (matchesCount === 0) {
                showNotification({ 
                    title: 'Borrador Vacío', 
                    message: 'La IA respondió pero no logramos mapear las competencias. Reintenta con otro modelo o sé más específico.', 
                    type: 'warning' 
                });
            } else {
                showNotification({ 
                    title: 'Borrador Generado', 
                    message: `Se han mapeado ${matchesCount} elementos en tu cronograma anual.`, 
                    type: 'success' 
                });
            }

        } catch (err: any) {
            console.error('[IA Borrador]', err);
            showNotification({ title: 'Error', message: 'No se pudo generar el borrador completo.', type: 'error' });
        } finally {
            setAiLoading(false);
        }
    };
    
    const renderCompetencyRows = (comps: CNEBCompetencia[], label: string) => (
        <>
            <tr className="bg-white/5 border-b border-white/10">
                <td colSpan={totalUnits + 1} className="px-4 py-2 text-[10px] font-black text-primary-teal uppercase tracking-[.2em] sticky left-0 z-10 bg-surface-card/90">
                    {label}
                </td>
            </tr>
            {comps.map((comp) => {
                const isExpanded = expandedRows.has(comp.nombre);
                const compId = matrixIdComp(comp.nombre);
                return (
                    <React.Fragment key={comp.nombre}>
                        <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td
                                className="px-4 py-2.5 text-xs font-black text-white cursor-pointer group sticky left-0 z-10 bg-surface-card/90 relative"
                                onClick={() => toggleExpand(comp.nombre)}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="material-icons-round text-sm text-gray-500 group-hover:text-primary-teal transition-colors">
                                        {isExpanded ? 'expand_more' : 'chevron_right'}
                                    </span>
                                    <span className="leading-tight">{comp.nombre}</span>
                                </div>

                                {/* Task 3.2: Tooltip de Estándares */}
                                <div className="absolute left-full top-0 ml-2 w-80 p-4 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] scale-95 group-hover:scale-100 pointer-events-none">
                                    <div className="flex items-start gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-primary-teal/20 flex items-center justify-center shrink-0">
                                            <span className="material-icons-round text-primary-teal text-sm">menu_book</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-primary-teal uppercase tracking-widest">Estándar Esperado</p>
                                            <p className="text-[8px] font-bold text-gray-500 uppercase">Ciclo {planActivo?.ciclo}</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-300 leading-relaxed italic">
                                        {(() => {
                                            const ciclo = planActivo?.ciclo;
                                            if (!ciclo) return "Selecciona un ciclo para ver el estándar.";
                                            return comp.estandares?.[ciclo] || comp.estandares?.[`Ciclo ${ciclo}`] || "Estándar no disponible para este ciclo.";
                                        })()}
                                    </p>
                                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[8px] font-black text-gray-600 uppercase">CNEB Oficial</span>
                                        <span className="text-[8px] font-bold text-primary-teal/50">Hover para previsualizar</span>
                                    </div>
                                </div>
                            </td>
                            {Array.from({ length: totalUnits }, (_, ui) => (
                                <td key={ui} className="text-center px-1 py-1.5">
                                    <div
                                        className={cn(
                                            'w-6 h-6 rounded-md border mx-auto transition-all flex items-center justify-center',
                                            isChecked(compId, ui)
                                                ? 'bg-primary-teal/30 border-primary-teal/50'
                                                : 'bg-white/5 border-white/10 opacity-30',
                                        )}
                                    >
                                        {isChecked(compId, ui) && (
                                            <span className="material-icons-round text-primary-teal text-[14px]">check</span>
                                        )}
                                    </div>
                                </td>
                            ))}
                        </tr>

                        {/* Child rows (capacidades) */}
                        {comp.capacidades.map((cap) => {
                            const capId = matrixIdCap(comp.nombre, cap);
                            return (
                                <tr key={capId} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                                    <td className="pl-12 pr-3 py-1.5 text-[11px] text-gray-400 max-w-[320px]">
                                        <span className="leading-tight">{cap}</span>
                                    </td>
                                    {Array.from({ length: totalUnits }, (_, ui) => (
                                        <td key={ui} className="text-center px-1 py-1.5">
                                            <button
                                                onClick={() => handleToggleMatrix(capId, ui)}
                                                className={cn(
                                                    'w-5 h-5 rounded border transition-all duration-200',
                                                    isChecked(capId, ui)
                                                        ? 'bg-primary-teal border-primary-teal text-gray-900'
                                                        : 'bg-white/5 border-white/10 hover:border-primary-teal/40',
                                                )}
                                            >
                                                {isChecked(capId, ui) && (
                                                    <span className="material-icons-round text-[12px]">check</span>
                                                )}
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}

                        {/* Expanded info row: Estándar + Desempeños */}
                        {isExpanded && (
                            <tr>
                                <td colSpan={totalUnits + 1} className="px-6 py-4 bg-surface-card/50 border-b border-white/5">
                                    <div className="space-y-3 max-w-4xl">
                                        <div>
                                            <p className="text-[10px] font-black text-primary-teal uppercase tracking-widest mb-1">
                                                Estándar de Aprendizaje — {planActivo?.ciclo || 'Ciclo no definido'}
                                            </p>
                                            <p className="text-xs text-gray-400 leading-relaxed italic">
                                                {(() => {
                                                    const ciclo = planActivo?.ciclo;
                                                    if (!ciclo) return null;
                                                    const estandar = comp.estandares?.[ciclo] || comp.estandares?.[`Ciclo ${ciclo}`];
                                                    return estandar || (
                                                        <span className="text-red-400/60">
                                                            ⚠️ Estándar no encontrado para "{ciclo}".
                                                            Verifica que el ciclo sea válido (ej. "Ciclo VI" o "VI").
                                                        </span>
                                                    );
                                                })()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                                                Desempeños — {planActivo?.grado || 'Grado no definido'}
                                            </p>
                                            <ul className="space-y-1">
                                                {comp.desempenos
                                                    .filter((d) => {
                                                        const target = planActivo?.grado?.toLowerCase() || '';
                                                        const current = d.grado.toLowerCase();
                                                        return current.includes(target) || target.includes(current.replace(' grado', ''));
                                                    })
                                                    .map((d, di) => (
                                                        <li key={di} className="text-[11px] text-gray-400 leading-relaxed pl-3 border-l-2 border-primary-teal/30">
                                                            <span className="text-primary-teal/80 font-bold">{d.capacidad}</span> — {d.texto}
                                                        </li>
                                                    ))}
                                                {comp.desempenos.filter((d) => {
                                                    const target = planActivo?.grado?.toLowerCase() || '';
                                                    const current = d.grado.toLowerCase();
                                                    return current.includes(target) || target.includes(current.replace(' grado', ''));
                                                }).length === 0 && (
                                                        <li className="text-[11px] text-gray-400 italic">
                                                            No hay desempeños registrados para "{planActivo?.grado || 'este grado'}".
                                                        </li>
                                                    )}
                                            </ul>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                );
            })}
        </>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in">
            <ModuleHeader 
                module="M03"
                title="Propósitos y Enfoques"
                subtitle="Distribución anual de competencias, capacidades y enfoques transversales."
                syncStatus={isSyncing ? 'syncing' : 'synced'}
                actions={[
                    <TabSwitch
                        options={[
                            { value: 'calendario', label: '3.1 CALENDARIO', icon: 'calendar_today' },
                            { value: 'competencias', label: '3.2 CARTEL', icon: 'assignment' },
                            { value: 'enfoques', label: '3.3 ENFOQUES', icon: 'diversity_3' },
                        ]}
                        value={activeTab}
                        onChange={(val) => setActiveTab(val as any)}
                        variant="magenta"
                    />,
                    <TabSwitch
                        options={[
                            { value: 'Bimestre', label: 'BIM' },
                            { value: 'Trimestre', label: 'TRI' },
                            { value: 'Semestre', label: 'SEM' },
                        ]}
                        value={periodoTipo}
                        onChange={(val) => handlePeriodoChange(val as any)}
                        variant="teal"
                        size="sm"
                    />,
                    <AIButton 
                        variant="teal" 
                        isLoading={aiLoading} 
                        onClick={handleGenerarBorradorSugeridoAI} 
                        tooltip="Genera una propuesta base de competencias y enfoques según tu diagnóstico y calendario."
                    />
                ]}
            />

            {/* ══════════════════════ TAB: CALENDARIO ══════════════════════ */}
            {activeTab === 'calendario' && (
                <div className="space-y-6 animate-fade-in">
                    <Card variant="glass">
                        <div className="p-1 space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-primary-teal uppercase tracking-[0.2em] pl-1">
                                    Descripción del Calendario Comunal / Diagnóstico
                                </label>
                                <AIButton 
                                    variant="magenta" 
                                    isLoading={aiLoading} 
                                    onClick={handleGenerarBorradorSugeridoAI} 
                                    size="sm"
                                    tooltip="Sugerir eventos basados en el diagnóstico anual"
                                />
                            </div>
                            <textarea
                                value={calendarioComunal}
                                onChange={(e) => setCalendarioComunal(e.target.value)}
                                placeholder="Describe las festividades, hitos agrícolas, ferias o eventos clave de la comunidad..."
                                className="w-full h-32 bg-surface-card border border-white/5 rounded-2xl p-4 text-xs text-gray-300 focus:outline-none focus:border-primary-teal/30 custom-scrollbar"
                            />
                        </div>
                    </Card>

                    <CalendarioComunalVisual
                        calendarioComunal={calendarioComunal}
                        data={calendarioComunalData}
                        onUpdateData={setCalendarioComunalData}
                    />
                </div>
            )}

            {/* ══════════════════════ TAB: COMPETENCIAS ══════════════════════ */}
            {activeTab === 'competencias' && (
                <div className="animate-fade-in">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <Spinner size="lg" />
                            <p className="text-gray-500 font-bold uppercase tracking-widest animate-pulse">Cargando CNEB...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-white/5 bg-surface-card/30">
                            <table className="w-full border-collapse min-w-[900px]">
                                <thead>
                                    {/* Row 1: Main headers */}
                                    <tr className="border-b border-white/10">
                                        <th
                                            rowSpan={4}
                                            className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-surface-card/80 min-w-[280px] sticky left-0 z-10"
                                        >
                                            Propósito de Aprendizaje
                                            <br />
                                            <span className="text-gray-400 normal-case tracking-normal font-medium">
                                                Competencias y Capacidades
                                            </span>
                                        </th>
                                        <th
                                            colSpan={totalUnits}
                                            className="text-center px-4 py-2 text-[10px] font-black text-primary-teal uppercase tracking-[.3em]"
                                        >
                                            <div className="flex items-center justify-center gap-4">
                                                <span>Unidades Didácticas</span>
                                                <AIButton
                                                    tooltip="Sugerir propósitos con IA"
                                                    onClick={handleSugerirPropositosAI}
                                                    isLoading={aiLoading}
                                                    variant="teal"
                                                    size="sm"
                                                />
                                            </div>
                                        </th>
                                    </tr>

                                    {/* Row 2: Period headers */}
                                    <tr className="border-b border-white/5">
                                        {periodNombres.map((nombre, pi) => (
                                            <th
                                                key={pi}
                                                colSpan={unitsPerPeriod}
                                                className="text-center px-2 py-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest border-l border-white/5 first:border-l-0"
                                            >
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-white/60">{nombre}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>

                                    {/* Row 3: Unit titles and types */}
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        {unidades.slice(0, totalUnits).map((u, ui) => (
                                            <th key={ui} className="text-center px-1 py-2 border-l border-white/5 first:border-l-0">
                                                <div className="flex flex-col gap-2">
                                                    <textarea
                                                        value={u.titulo}
                                                        onChange={(e) => handleTituloChange(ui, e.target.value)}
                                                        placeholder="Título..."
                                                        className="w-full h-12 bg-surface-card border border-white/5 rounded-md p-1.5 text-[9px] text-gray-300 focus:outline-none focus:border-primary-teal/30 resize-none custom-scrollbar"
                                                    />
                                                    <button
                                                        onClick={() => handleRotateTipo(ui)}
                                                        className="text-[9px] font-black text-gray-400 hover:text-primary-teal transition-colors cursor-pointer uppercase"
                                                        title={`Click para cambiar: ${u.tipo}`}
                                                    >
                                                        {tipoAbrev(u.tipo, ui + 1)}
                                                    </button>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>

                                    {/* Row 4: Date pickers */}
                                    <tr className="border-b border-white/10">
                                        {unidades.slice(0, totalUnits).map((u, ui) => {
                                            const [start, end] = u.fecha.split('|');
                                            return (
                                                <th key={ui} className="text-center px-0.5 py-1">
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <input
                                                            type="date"
                                                            value={start}
                                                            onChange={(e) => handleDateChange(ui, 'start', e.target.value)}
                                                            className="bg-transparent text-[8px] text-gray-500 w-[80px] text-center focus:outline-none focus:text-primary-teal cursor-pointer"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={end}
                                                            onChange={(e) => handleDateChange(ui, 'end', e.target.value)}
                                                            className="bg-transparent text-[8px] text-gray-500 w-[80px] text-center focus:outline-none focus:text-primary-teal cursor-pointer"
                                                        />
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>

                                <tbody>
                                    {/* Area competencies */}
                                    {planActivo && renderCompetencyRows(cnebCompetencias, `Área: ${planActivo.area}`)}

                                    {/* Transversal competencies */}
                                    {cnebTransversales.length > 0 &&
                                        renderCompetencyRows(cnebTransversales, 'Competencias Transversales')}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════ TAB: ENFOQUES ══════════════════════ */}
            {activeTab === 'enfoques' && (
                <div className="space-y-3 animate-fade-in">
                    <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-white/5 bg-surface-card/30">
                        <table className="w-full border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[280px] sticky left-0 z-10 bg-surface-card/80">
                                        <div className="flex items-center gap-3">
                                            <span>Enfoques y Valores</span>
                                            <AIButton
                                                tooltip="Sugerir enfoques con IA"
                                                onClick={handleSugerirEnfoquesAI}
                                                isLoading={aiLoading}
                                                variant="magenta"
                                                size="sm"
                                            />
                                        </div>
                                    </th>
                                    {unidades.slice(0, totalUnits).map((u, ui) => (
                                        <th key={ui} className="text-center px-2 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            {tipoAbrev(u.tipo, ui + 1)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {ENFOQUES_TRANSVERSALES.map((enfoque) => {
                                    const isOpen = expandedEnfoques.has(enfoque.id);
                                    return (
                                        <React.Fragment key={enfoque.id}>
                                            {/* Enfoque parent row */}
                                            <tr className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer" onClick={() => toggleEnfoque(enfoque.id)}>
                                                <td className="px-4 py-2.5 text-xs font-black text-white">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-icons-round text-sm text-gray-500">
                                                            {isOpen ? 'expand_more' : 'chevron_right'}
                                                        </span>
                                                        <span>{enfoque.nombre}</span>
                                                    </div>
                                                </td>
                                                {Array.from({ length: totalUnits }, (_, ui) => (
                                                    <td key={ui} className="text-center px-1 py-2">
                                                        <div
                                                            className={cn(
                                                                'w-6 h-6 rounded-md border mx-auto transition-all',
                                                                isChecked(enfoque.id, ui)
                                                                    ? 'bg-primary-teal/30 border-primary-teal/50'
                                                                    : 'bg-white/5 border-white/10 opacity-30',
                                                            )}
                                                        >
                                                            {isChecked(enfoque.id, ui) && (
                                                                <span className="material-icons-round text-primary-teal text-[14px]">check</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>

                                            {/* Valor rows (when expanded) */}
                                            {isOpen &&
                                                enfoque.valores.map((valor) => {
                                                    const valId = matrixIdVal(enfoque.id, valor.id);
                                                    return (
                                                        <React.Fragment key={valId}>
                                                            <tr className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                                                                <td className="pl-12 pr-3 py-1.5">
                                                                    <div>
                                                                        <p className="text-[11px] text-gray-400">{valor.nombre}</p>
                                                                        <p className="text-[9px] text-gray-400 italic mt-0.5">{valor.actitud}</p>
                                                                    </div>
                                                                </td>
                                                                {Array.from({ length: totalUnits }, (_, ui) => (
                                                                    <td key={ui} className="text-center px-1 py-1.5">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleToggleMatrix(valId, ui); }}
                                                                            className={cn(
                                                                                'w-5 h-5 rounded border transition-all duration-200',
                                                                                isChecked(valId, ui)
                                                                                    ? 'bg-primary-teal border-primary-teal text-gray-900'
                                                                                    : 'bg-white/5 border-white/10 hover:border-primary-teal/40',
                                                                            )}
                                                                        >
                                                                            {isChecked(valId, ui) && (
                                                                                <span className="material-icons-round text-[12px]">check</span>
                                                                            )}
                                                                        </button>
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        </React.Fragment>
                                                    );
                                                })}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Bitácora Pedagógica (Web-only) */}
            {(activeTab === 'competencias' || activeTab === 'enfoques') && (
                <div className="mt-8 p-6 bg-primary-teal/5 border border-primary-teal/20 rounded-3xl animate-fade-in">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-teal/10 flex items-center justify-center">
                            <span className="material-icons-round text-primary-teal text-xl">psychology</span>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-primary-teal uppercase tracking-[.2em]">Bitácora Pedagógica</h4>
                            <p className="text-[10px] text-gray-500">Sustento técnico de la distribución anual (No incluido en el documento impreso).</p>
                        </div>
                    </div>
                    <textarea
                        className="w-full bg-transparent text-xs text-gray-400 focus:outline-none border-none resize-none leading-relaxed h-24 custom-scrollbar"
                        placeholder="Aquí aparecerá el sustento técnico de por qué se seleccionaron estas competencias y enfoques para cada unidad..."
                        value={bitacoraPedagogica}
                        onChange={(e) => setBitacoraPedagogica(e.target.value)}
                    />
                </div>
            )}
            {/* Radar de Coberturas (Tarea 3.1) */}
            {activeTab === 'competencias' && planActivo && (
                <CoverageRadar 
                    competencias={cnebCompetencias} 
                    matrix={matrix} 
                    label={planActivo.area}
                />
            )}

            {activeTab === 'enfoques' && (
                <CoverageRadar 
                    competencias={ENFOQUES_TRANSVERSALES.map(e => ({
                        nombre: e.nombre,
                        capacidades: e.valores.map(v => v.nombre),
                        estandares: {},
                        desempenos: []
                    }))} 
                    matrix={matrix} 
                    label="Enfoques Transversales"
                />
            )}
        </div>
    );
};

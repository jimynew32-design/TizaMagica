import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { AIButton } from '@/components/ui/AIButton';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { usePlanAnualStore, usePerfilStore, useAIConfigStore, useNotificationStore } from '@/store';
import { useDebounce } from '@/hooks/ui/useDebounce';
import { cn } from '@/lib/cn';
import { TabSwitch } from '@/components/ui/TabSwitch';
import { chatCompletion, PROMPTS } from '@/services/ai';

export const IdentidadInstitucionalEditor: React.FC = () => {
    const { planActivo, updatePlan, isSyncing } = usePlanAnualStore();
    const { showNotification } = useNotificationStore();
    const { perfil } = usePerfilStore();
    const { aiConfig, getDecryptedApiKey } = useAIConfigStore();
    const [loadingIA, setLoadingIA] = useState(false);

    // Tabs state
    const [activeTab, setActiveTab] = useState('biblioteca');
    const IDENTIDAD_TABS = [
        { value: 'biblioteca', label: 'IE & Aula', icon: 'school' },
        { value: 'adn', label: 'ADN & Lema', icon: 'psychology' },
        { value: 'tecnico', label: 'Caracterización', icon: 'description' }
    ];

    // M02-specific state
    const [descripcionArea, setDescripcionArea] = useState(planActivo?.identidad.descripcionArea || '');
    const [enfoques, setEnfoques] = useState<string[]>(planActivo?.identidad.enfoquePedagogico || []);
    const [lemaAula, setLemaAula] = useState(planActivo?.identidad.lemaAula || '');

    // BUG-06 fix: Resync local state when switching plans
    useEffect(() => {
        setDescripcionArea(planActivo?.identidad.descripcionArea || '');
        setEnfoques(planActivo?.identidad.enfoquePedagogico || []);
        setLemaAula(planActivo?.identidad.lemaAula || '');
    }, [planActivo?.id]);

    const debouncedDesc = useDebounce(descripcionArea, 1000);
    const debouncedEnfoques = useDebounce(enfoques, 1000);
    const debouncedLema = useDebounce(lemaAula, 1000);

    useEffect(() => {
        if (planActivo) {
            updatePlan(planActivo.id, {
                identidad: {
                    ...planActivo.identidad,
                    descripcionArea: debouncedDesc,
                    enfoquePedagogico: debouncedEnfoques,
                    lemaAula: debouncedLema
                }
            });
        }
    }, [debouncedDesc, debouncedEnfoques, debouncedLema]);

    const handleGenerarConIA = async () => {
        if (!perfil || !planActivo) return;

        setLoadingIA(true);
        try {
            const systemPrompt = "Eres un especialista en planificación curricular del MINEDU Perú. Genera la descripción general en formato de texto plano con secciones marcadas.";
            const userPrompt = PROMPTS.REDACTAR_DESCRIPCION_TECNICA(perfil, planActivo);

            const apiKey = await getDecryptedApiKey();
            const result = await chatCompletion(systemPrompt, userPrompt, {
                provider: aiConfig.provider,
                model: aiConfig.activeModel,
                apiKey: apiKey,
                customUrl: aiConfig.lmstudioUrl,
                responseFormat: 'text', // Cambiamos a texto plano para facilitar el formato mixto
                temperature: 0.3,
                maxTokens: 2000
            });

            if (result && typeof result === 'string') {
                // Parseo manual del formato [DESCRIPCION], [COMPETENCIAS], [REQUISITOS]
                const sections = result.split(/\[(DESCRIPCION|COMPETENCIAS|REQUISITOS)\]/i);
                
                let desc = "";
                let comps = "";

                for (let i = 1; i < sections.length; i += 2) {
                    const tag = sections[i].toUpperCase();
                    const content = sections[i + 1]?.trim();
                    if (tag === 'DESCRIPCION') desc = content;
                    if (tag === 'COMPETENCIAS') comps = content;
                }

                // Construir el texto final con el formato solicitado
                const formattedResult = `
${desc}

COMPETENCIAS A DESARROLLAR:
${comps}
                `.trim();

                setDescripcionArea(formattedResult);
            } else {
                throw new Error("La IA no devolvió un formato válido. Por favor, intenta de nuevo.");
            }
        } catch (error: any) {
            console.error('Error generando descripción:', error);
            showNotification({
                title: 'Error de IA',
                message: error.message || 'No se pudo generar la descripción.',
                type: 'error'
            });
        } finally {

            setLoadingIA(false);
        }
    };

    if (!planActivo) return <div className="text-white p-10 font-black">SELECCIONA UN PLAN PRIMERO</div>;

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-fade-in pb-48 px-4">
            <ModuleHeader
                module="M02"
                title="Identidad e Idiosincrasia"
                subtitle="Visión institucional y caracterización técnica del área."
                syncStatus={isSyncing ? 'syncing' : 'synced'}
            />

            <div className="flex justify-center -mt-6">
                <TabSwitch 
                    options={IDENTIDAD_TABS}
                    value={activeTab}
                    onChange={setActiveTab}
                    variant="magenta"
                />
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                {activeTab === 'biblioteca' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 1.2.1 — Datos de la I.E. (Read-only from Perfil/Onboarding) */}
                        <Card variant="strong">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="material-icons-round text-brand-magenta text-sm">school</span>
                                    2.1 Información Institucional
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Institución Educativa</p>
                                        <p className="text-sm font-bold text-white uppercase">{perfil?.nombreIE || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Director(a)</p>
                                        <p className="text-sm font-bold text-white">{perfil?.director || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">UGEL</p>
                                        <p className="text-sm font-bold text-white uppercase">{perfil?.ugel || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">DRE / GEREDU</p>
                                        <p className="text-sm font-bold text-white uppercase">{perfil?.gereduDre || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* HERENCIA DE M01.4 — Información del Aula/Grupo */}
                        <Card variant="glass" className="border-brand-magenta/10 bg-brand-magenta/[0.02]">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <span className="material-icons-round text-brand-magenta text-sm">groups</span>
                                        2.2 Identidad del Aula (Herencia)
                                    </CardTitle>
                                </div>
                                <a 
                                    href="/plan-anual/diagnostico" 
                                    className="bg-brand-magenta/10 hover:bg-brand-magenta/20 text-brand-magenta text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all flex items-center gap-2"
                                >
                                    <span className="material-icons-round text-xs">edit</span>
                                    Sincronizar M01
                                </a>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Grado / Ciclo</p>
                                        <p className="text-sm font-black text-white">{planActivo?.diagnostico.gradoIdentificado || planActivo?.grado || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sección(es)</p>
                                        <p className="text-sm font-black text-white">{planActivo?.diagnostico.seccion || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nombre de Aula</p>
                                        <p className="text-sm font-black text-white italic">{planActivo?.diagnostico.nombreAula || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Matrícula</p>
                                        <p className="text-sm font-black text-brand-magenta">{planActivo?.diagnostico.cantidadTotal || 0} Est.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'adn' && (
                    <div className="space-y-8">
                        <Card variant="glass" className="overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5 select-none pointer-events-none">
                                <span className="material-icons-round text-8xl">format_quote</span>
                            </div>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="material-icons-round text-brand-magenta">auto_awesome</span>
                                    2.3 Lema del Aula (Propósito Motivacional)
                                </CardTitle>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">
                                    La frase que define e inspira a tu grupo de estudiantes
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={lemaAula}
                                        onChange={(e) => setLemaAula(e.target.value)}
                                        placeholder="Escribe aquí el lema de tu aula..."
                                        className="w-full bg-transparent border-b-2 border-white/5 py-4 text-2xl md:text-3xl font-black text-white placeholder:text-white/10 outline-none focus:border-brand-magenta transition-all text-center italic tracking-tight"
                                    />
                                    <div className="flex justify-center mt-4">
                                        <span className="px-3 py-1 bg-brand-magenta/10 text-brand-magenta rounded-full text-[9px] font-black uppercase tracking-tighter shadow-glow-magenta-xs">
                                            Visión Inspiradora
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card variant="glass">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="material-icons-round text-primary-teal">psychology</span>
                                    2.4 ADN Pedagógico (Metodologías Activas)
                                </CardTitle>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">
                                    Selecciona los enfoques que potenciarán tus sesiones
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {[
                                        { id: 'abp', label: 'ABP', full: 'Aprendizaje Basado en Proyectos', icon: 'rocket_launch' },
                                        { id: 'gamificacion', label: 'Gamificación', full: 'Mecánicas de Juego', icon: 'sports_esports' },
                                        { id: 'flipped', label: 'Aula Invertida', full: 'Flipped Classroom', icon: 'history_edu' },
                                        { id: 'design', label: 'Design Thinking', full: 'Pensamiento de Diseño', icon: 'lightbulb' },
                                        { id: 'cooperativo', label: 'Cooperativo', full: 'Aprendizaje Colectivo', icon: 'groups' },
                                        { id: 'indagacion', label: 'Indagación', full: 'Investigación Activa', icon: 'search' }
                                    ].map(enf => {
                                        const isSelected = enfoques.includes(enf.id);
                                        return (
                                            <button
                                                key={enf.id}
                                                onClick={() => {
                                                    setEnfoques(prev => 
                                                        (prev || []).includes(enf.id) 
                                                            ? (prev || []).filter(i => i !== enf.id) 
                                                            : [...(prev || []), enf.id]
                                                    );
                                                }}
                                                className={cn(
                                                    "flex flex-col items-center gap-3 p-4 rounded-[2rem] border transition-all duration-300 group relative overflow-hidden",
                                                    isSelected 
                                                        ? "bg-primary-teal/20 border-primary-teal text-primary-teal shadow-[0_0_20px_rgba(79,209,197,0.1)]" 
                                                        : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:border-white/10"
                                                )}
                                            >
                                                <span className={cn(
                                                    "material-icons-round text-2xl transition-transform duration-500 group-hover:scale-110",
                                                    isSelected ? "text-primary-teal" : "text-gray-600 group-hover:text-gray-400"
                                                )}>
                                                    {enf.icon}
                                                </span>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">{enf.label}</p>
                                                    <p className="text-[8px] font-medium opacity-50 mt-1.5 leading-tight">{enf.full}</p>
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary-teal animate-pulse" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'tecnico' && (
                    <Card variant="strong">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="material-icons-round text-brand-magenta">description</span>
                                2.5 Caracterización del Área
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pl-1">
                                    <label className="text-[10px] font-black text-primary-teal uppercase tracking-[0.2em]">
                                        Descripción Técnica del Área
                                    </label>
                                    <AIButton
                                        variant="magenta"
                                        isLoading={loadingIA}
                                        onClick={handleGenerarConIA}
                                        tooltip="Generar descripción con IA"
                                        size="sm"
                                    />
                                </div>
                                <textarea
                                    className="w-full h-80 bg-surface-card border border-white/5 rounded-2xl p-6 text-xs text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-teal/30 leading-relaxed custom-scrollbar shadow-inner"
                                    placeholder="Describe el enfoque del área y los desafíos pedagógicos para este año..."
                                    value={descripcionArea}
                                    onChange={(e) => setDescripcionArea(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="material-icons-round text-primary-teal">info</span>
                                <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                                    La IA generará este texto basándose en la normativa del CNEB y tus datos institucionales previos.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

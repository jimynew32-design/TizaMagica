import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { StepContexto } from '@/features/horario/components/HorarioWizard/steps/StepContexto';
import { StepConfigInteligente } from '@/features/horario/components/HorarioWizard/steps/StepConfigInteligente';
import { StepRecursos } from '@/features/horario/components/HorarioWizard/steps/StepRecursos';
import { StepMapeo } from '@/features/horario/components/HorarioWizard/steps/StepMapeo';
import { StepReglas } from '@/features/horario/components/HorarioWizard/steps/StepReglas';
import { GenerationLoading } from '@/features/horario/components/GenerationLoading';
import { HorarioCanvas } from '@/features/horario/components/HorarioCanvas/HorarioCanvas';
import { SchedulePreview } from '@/features/horario/components/SchedulePreview';
import { useHorarioStore } from '@/features/horario/store';
import { usePerfilStore } from '@/store';

// Definición de los pasos del Wizard inspirados en el User Journey
const STEPS = [
    { id: 1, label: '1.1 CONTEXTO', icon: 'settings_suggest', description: 'El Lienzo' },
    { id: 2, label: '1.2 CONFIGURACIÓN', icon: 'psychology', description: 'Inteligencia IA' },
    { id: 3, label: '1.3 RECURSOS', icon: 'groups', description: 'Los Actores' },
    { id: 4, label: '1.4 MAPEO', icon: 'account_tree', description: 'Carga Asistida' },
    { id: 5, label: '1.5 REGLAS', icon: 'rule', description: 'Reglas de Oro' },
];

const HorarioInteligentePage: React.FC = () => {
    const { 
        config, 
        recursos, 
        cargaAcademica, 
        restricciones,
        setConfig, 
        setRecursos, 
        setCargaAcademica, 
        setRestricciones,
        saveConfig, 
        loadConfig 
    } = useHorarioStore();
    const { perfil } = usePerfilStore();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationFinished, setGenerationFinished] = useState(false);
    
    // Al cargar la página, intentamos recuperar la configuración previa
    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const formData = config || {
        id: crypto.randomUUID(),
        nombreIE: perfil?.nombreIE || '',
        cicloEscolar: '2025/2026',
        nivel: perfil?.nivel || 'Secundaria',
        modalidad: 'JER',
        inicioJornada: '08:00',
        finJornada: '13:30',
        duracionBloque: 45,
        cantidadRecreos: 1,
        distribucionRecreos: [30],
        diasLaborables: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        bloquesPorDia: 7
    };

    const handleNext = async () => {
        await saveConfig();
        if (currentStep < 5) {
            setCurrentStep((prev: number) => prev + 1);
        } else {
            setIsGenerating(true);
        }
    };

    const handleGenerationComplete = () => {
        setIsGenerating(false);
        setGenerationFinished(true);
    };

    const renderStep = () => {
        if (generationFinished) {
            return <HorarioCanvas />;
        }

        switch (currentStep) {
            case 1:
                return (
                    <StepContexto 
                        data={formData} 
                        onChange={(val) => setConfig({ ...formData, ...val })} 
                    />
                );
            case 2:
                return (
                    <StepConfigInteligente 
                        data={formData} 
                        onChange={(val) => setConfig({ ...formData, ...val })} 
                    />
                );
            case 3:
                return (
                    <StepRecursos 
                        data={recursos}
                        nivelIE={formData.nivel}
                        onChange={(type, items) => setRecursos(type, items)}
                    />
                );
            case 4:
                return (
                    <StepMapeo 
                        recursos={recursos}
                        nivelIE={formData.nivel}
                        carga={cargaAcademica}
                        onChange={(newCarga) => setCargaAcademica(newCarga)}
                    />
                );
            case 5:
                return (
                    <StepReglas 
                        diasLaborables={formData.diasLaborables}
                        bloquesPorDia={formData.bloquesPorDia}
                        docentes={recursos.docentes}
                        restricciones={restricciones}
                        onChange={(newRest) => setRestricciones(newRest)}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 flex flex-col gap-12">
            {isGenerating && <GenerationLoading onComplete={handleGenerationComplete} />}

            {/* Header de Identidad */}
            <header className="flex items-center justify-between max-w-[1600px] mx-auto w-full">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-magenta/10 rounded-2xl border border-brand-magenta/20">
                        <span className="material-icons-round text-brand-magenta text-3xl">auto_awesome</span>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
                            {formData.nombreIE || 'Generador de Horarios'}
                        </h1>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[6px] mt-1">
                            {formData.nombreIE ? 'Generador de Horarios Intelligence v4.0' : 'PlanX Intelligence v4.0'}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white/20">
                        <div className="w-1 h-1 rounded-full bg-green-500 shadow-glow-green" />
                        Sincronizado Localmente
                    </div>
                </div>
            </header>

            {/* Navegación por Pasos Estilo PlanX (Basado en fotos) */}
            {!generationFinished && (
                <nav className="flex items-center justify-center">
                    <div className="bg-[#111] border border-white/5 p-2 rounded-[2rem] flex items-center gap-2 shadow-2xl overflow-x-auto max-w-full no-scrollbar">
                        {STEPS.map((step) => {
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;

                            return (
                                <button
                                    key={step.id}
                                    onClick={() => !isGenerating && setCurrentStep(step.id)}
                                    className={cn(
                                        "relative px-8 py-4 rounded-[1.5rem] flex items-center gap-4 transition-all duration-500 group whitespace-nowrap",
                                        isActive 
                                            ? "bg-brand-magenta text-white shadow-glow-magenta" 
                                            : "hover:bg-white/5 text-white/30 hover:text-white"
                                    )}
                                >
                                    <motion.span 
                                        className={cn(
                                            "material-icons-round text-xl transition-colors duration-500",
                                            isActive ? "text-white" : "text-white/40 group-hover:text-white"
                                        )}
                                        animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                                    >
                                        {isCompleted ? 'check_circle' : step.icon}
                                    </motion.span>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">
                                            {step.label}
                                        </p>
                                        <p className={cn(
                                            "text-[8px] font-bold uppercase tracking-widest mt-1 opacity-40",
                                            isActive ? "text-white" : "text-gray-500"
                                        )}>
                                            {step.description}
                                        </p>
                                    </div>
                                    {isActive && (
                                        <motion.div 
                                            layoutId="step-glow"
                                            className="absolute inset-0 rounded-[1.5rem] bg-brand-magenta/20 blur-xl -z-10"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </nav>
            )}

            {/* Área de Trabajo con Animación de Transición */}
            <main className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col py-8 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={generationFinished ? 'finished' : currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex-1"
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>

                {/* Navegación Footer */}
                {!generationFinished && (
                    <footer className="mt-12 flex justify-between items-center border-t border-white/5 pt-12 relative z-10">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setCurrentStep((prev: number) => Math.max(1, prev - 1))}
                                disabled={currentStep === 1 || isGenerating}
                                className={cn(
                                    "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[4px] border border-white/10 transition-all",
                                    currentStep === 1 ? "opacity-0 invisible" : "text-white/40 hover:text-white hover:bg-white/5"
                                )}
                            >
                                Anterior
                            </button>
                            
                            {/* Botón de Vista Previa en Footer para mayor orden */}
                            <button
                                onClick={() => setShowPreview(true)}
                                className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[4px] border border-brand-magenta/20 bg-brand-magenta/5 text-brand-magenta hover:bg-brand-magenta hover:text-white transition-all flex items-center gap-3 group"
                            >
                                <span className="material-icons-round text-sm group-hover:scale-110 transition-transform">auto_awesome</span>
                                Consultar Estructura
                            </button>
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={isGenerating}
                            className="px-12 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[4px] hover:bg-brand-magenta hover:text-white transition-all shadow-xl hover:shadow-glow-magenta flex items-center gap-3 group disabled:opacity-50"
                        >
                            <span>{currentStep === 5 ? 'Generar Horario' : 'Siguiente Paso'}</span>
                            <span className="material-icons-round text-sm group-hover:translate-x-1 transition-transform">
                                {currentStep === 5 ? 'bolt' : 'arrow_forward'}
                            </span>
                        </button>
                    </footer>
                )}
            </main>

            {/* Modal de Vista Previa Flotante */}
            <AnimatePresence>
                {showPreview && !generationFinished && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-2xl"
                        onClick={() => setShowPreview(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="w-full max-w-[1500px] h-full max-h-[95vh] overflow-y-auto bg-black rounded-[4rem] border border-white/10 p-4 md:p-10 custom-scrollbar shadow-[0_0_120px_rgba(217,70,239,0.2)] relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header del Modal Refinado */}
                            <div className="sticky top-0 z-50 flex justify-between items-center px-10 py-8 bg-black/80 backdrop-blur-2xl rounded-t-[4rem] border-b border-white/5 mb-8 -mx-10 -mt-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[2rem] bg-brand-magenta/10 flex items-center justify-center border border-brand-magenta/30 shadow-glow-magenta-sm">
                                        <span className="material-icons-round text-brand-magenta text-3xl animate-pulse">insights</span>
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Simulación de Jornada</h2>
                                        <p className="text-[11px] text-white/40 font-bold uppercase tracking-[0.4em] mt-2">Visión prospectiva de la estructura escolar</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowPreview(false)}
                                    className="w-14 h-14 rounded-full bg-white/5 hover:bg-brand-magenta/20 hover:text-brand-magenta flex items-center justify-center transition-all group border border-white/10 hover:border-brand-magenta/30"
                                >
                                    <span className="material-icons-round group-hover:rotate-180 transition-transform duration-700 text-2xl">close</span>
                                </button>
                            </div>

                            <div className="pb-12">
                                <SchedulePreview config={formData as any} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Gesto Flotante Estilo Cerebro IA (Bottom-Right FAB) */}
            <AnimatePresence>
                {!generationFinished && !showPreview && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, x: 50 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: 50 }}
                        className="fixed bottom-12 right-12 z-[80] flex items-center"
                    >
                        {/* Texto Descriptivo Premium Flotante */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mr-6 py-3 px-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 hidden md:flex flex-col items-end pointer-events-none shadow-2xl"
                        >
                            <span className="text-[10px] font-black text-brand-magenta uppercase tracking-[4px]">Simulación Activa</span>
                            <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">Ver Proyección Estratégica</span>
                        </motion.div>

                        <button
                            onClick={() => setShowPreview(true)}
                            className="group relative w-24 h-24 bg-black rounded-[2.5rem] flex items-center justify-center border-2 border-brand-magenta/30 shadow-[0_0_50px_rgba(217,70,239,0.3)] hover:scale-110 hover:rotate-6 transition-all duration-500 overflow-hidden"
                        >
                            {/* Efecto de Gradiente Giratorio Interno */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-magenta/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="relative z-10 flex flex-col items-center gap-1">
                                <span className="material-icons-round text-4xl text-brand-magenta drop-shadow-glow-magenta group-hover:scale-110 transition-transform">visibility</span>
                                <span className="text-[8px] font-black text-white/60 uppercase tracking-tighter">PROYECTAR</span>
                            </div>

                            {/* Ping animado más sutil */}
                            <div className="absolute inset-0 rounded-[2.5rem] border-2 border-brand-magenta/50 animate-ping -z-10 opacity-20" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Footer de Créditos */}
            <footer className="max-w-[1600px] mx-auto w-full flex justify-between items-center py-8 border-t border-white/5 text-[10px] font-black uppercase tracking-[4px] text-white/20">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-magenta animate-pulse" />
                    Entorno Seguro: No se recopilan datos personales
                </div>
                <div>PlanX System v4.0 — 2026</div>
            </footer>
        </div>
    );
};

export default HorarioInteligentePage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { StepperProgress } from '@/components/ui/StepperProgress';
import { Unidad } from '@/types/schemas';
import { useUnidadesStore } from '@/store';
import { Step1Diagnostico } from '../unidad/Step1Diagnostico';
import { Step2Disena } from '../unidad/Step2Disena';
import { Step3Organiza } from '../unidad/Step3Organiza';
import { Step4Selecciona } from '../unidad/Step4Selecciona';
import { Step5Preve } from '../unidad/Step5Preve';

interface WorkflowModuloProps {
    unidad: Unidad;
}

const STEPS = [
    { label: 'NECESIDAD', icon: 'psychology' },
    { label: 'CONCEPTUALIZA', icon: 'lightbulb' },
    { label: 'COORDINA', icon: 'event' },
    { label: 'ESCOGE', icon: 'auto_fix_high' },
    { label: 'PROYECTA', icon: 'rocket_launch' },
];

export const WorkflowModulo: React.FC<WorkflowModuloProps> = ({ unidad }) => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const { updateUnidad } = useUnidadesStore();

    const handleUpdate = (updates: Partial<Unidad>) => {
        updateUnidad(unidad.id, updates);
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0: return <Step1Necesidad unidad={unidad} onUpdate={handleUpdate} />;
            case 1: return <Step2Disena unidad={unidad} onUpdate={handleUpdate} />;
            case 2: return <Step3Organiza unidad={unidad} onUpdate={handleUpdate} />;
            case 3: return <Step4Selecciona unidad={unidad} onUpdate={handleUpdate} />;
            case 4: return <Step5Preve unidad={unidad} onUpdate={handleUpdate} />;
            default: return null;
        }
    };

    return (
        <div className="space-y-8 pb-32">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface-header/40 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/unidades')}
                        className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-500 hover:text-white transition-all group"
                    >
                        <span className="material-icons-round text-lg group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-yellow-400/30">MÓDULO</span>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight line-clamp-1">{unidad.diagnosticoStep.titulo || 'Módulo sin título'}</h2>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 uppercase tracking-widest font-bold">Aprendizaje Específico y Refuerzo</p>
                    </div>
                </div>
                <div className="flex bg-surface-card/50 rounded-2xl p-2 border border-white/5">
                    <StepperProgress
                        steps={STEPS.map(s => s.label)}
                        currentStep={currentStep}
                    />
                </div>
            </header>

            <main className="min-h-[50vh]">
                {renderStep()}
            </main>

            <footer className="fixed bottom-0 left-72 right-0 p-4 bg-surface-header/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-between z-50">
                <div className="flex items-center gap-3 opacity-50">
                    <span className="material-icons-round text-sm text-primary-teal">cloud_done</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cambios sincronizados</span>
                </div>

                <div className="flex gap-3">
                    <NeonButton
                        variant="secondary"
                        disabled={currentStep === 0}
                        onClick={() => setCurrentStep(prev => prev - 1)}
                    >
                        ANT.
                    </NeonButton>

                    {currentStep < STEPS.length - 1 ? (
                        <NeonButton
                            variant="primary"
                            icon="arrow_forward"
                            onClick={() => setCurrentStep(prev => prev + 1)}
                            className="px-12"
                        >
                            SIGUIENTE
                        </NeonButton>
                    ) : (
                        <NeonButton
                            variant="magenta"
                            icon="description"
                            onClick={() => {/* TODO: Exportar Word */ }}
                            className="px-12"
                        >
                            FINALIZAR Y EXPORTAR
                        </NeonButton>
                    )}
                </div>
            </footer>
        </div>
    );
};

const Step1Necesidad: React.FC<{ unidad: Unidad, onUpdate: (u: Partial<Unidad>) => void }> = ({ unidad, onUpdate }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <Step1Diagnostico unidad={unidad} onUpdate={onUpdate} />
            <Card variant="strong" className="bg-yellow-400/5 border-yellow-400/20">
                <div className="space-y-4">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <span className="material-icons-round text-yellow-400">psychology</span>
                        Análisis de Necesidades Específicas
                    </h4>
                    <textarea
                        className="w-full bg-surface-card border border-white/5 rounded-2xl p-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-yellow-400/30 resize-none h-24"
                        placeholder="Describe la necesidad de aprendizaje que justifica este módulo (ej: refuerzo en ortografía, profundización en genética...)"
                        value={unidad.diagnosticoStep.diagnosticoPrevio.necesidades || ''}
                        onChange={(e) => onUpdate({
                            diagnosticoStep: {
                                ...unidad.diagnosticoStep,
                                diagnosticoPrevio: {
                                    ...unidad.diagnosticoStep.diagnosticoPrevio,
                                    necesidades: e.target.value
                                }
                            }
                        })}
                    />
                </div>
            </Card>
        </div>
    );
};

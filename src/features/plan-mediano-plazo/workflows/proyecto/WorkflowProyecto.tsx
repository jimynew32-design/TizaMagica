import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { StepperProgress } from '@/components/ui/StepperProgress';
import { Unidad } from '@/types/schemas';
import { useUnidadesStore } from '@/store';
// Reutilizamos algunos pasos comunes o creamos específicos
import { Step1Diagnostico } from '../unidad/Step1Diagnostico';
import { Step2Disena } from '../unidad/Step2Disena';
import { Step3Organiza } from '../unidad/Step3Organiza';
import { Step4Selecciona } from '../unidad/Step4Selecciona';
import { Step5Preve } from '../unidad/Step5Preve';

interface WorkflowProyectoProps {
    unidad: Unidad;
}

const STEPS = [
    { label: 'ANÁLISIS', icon: 'analytics' },
    { label: 'ESTABLECE', icon: 'groups' },
    { label: 'ESTRUCTURA', icon: 'account_tree' },
    { label: 'ORDENA', icon: 'checklist' },
    { label: 'ANTICIPA', icon: 'auto_awesome' },
];

export const WorkflowProyecto: React.FC<WorkflowProyectoProps> = ({ unidad }) => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const { updateUnidad } = useUnidadesStore();

    const handleUpdate = (updates: Partial<Unidad>) => {
        updateUnidad(unidad.id, updates);
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0: return <Step1Analisis unidad={unidad} onUpdate={handleUpdate} />;
            case 1: return <Step2Participativo unidad={unidad} onUpdate={handleUpdate} />;
            case 2: return <Step3Fases unidad={unidad} onUpdate={handleUpdate} />;
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
                            <span className="px-2 py-0.5 bg-brand-magenta/20 text-brand-magenta text-[9px] font-black uppercase tracking-widest rounded-full border border-brand-magenta/30">PROYECTO</span>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight line-clamp-1">{unidad.diagnosticoStep.titulo || 'Proyecto sin título'}</h2>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 uppercase tracking-widest font-bold">Planificación Participativa del Proyecto</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <NeonButton variant="secondary" icon="visibility" onClick={() => navigate(`/unidades/${unidad.id}/preview`)}>PREVISUALIZAR</NeonButton>
                    <div className="flex bg-surface-card/50 rounded-2xl p-2 border border-white/5">
                        <StepperProgress
                            steps={STEPS.map(s => s.label)}
                            currentStep={currentStep}
                        />
                    </div>
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

// ─── Sub-Pasos Específicos para Proyecto ─────────────────────────────────────

const Step1Analisis: React.FC<{ unidad: Unidad, onUpdate: (u: Partial<Unidad>) => void }> = ({ unidad, onUpdate }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <Step1Diagnostico unidad={unidad} onUpdate={onUpdate} />
            <Card variant="strong" className="bg-brand-magenta/5 border-brand-magenta/20">
                <div className="space-y-4">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <span className="material-icons-round text-brand-magenta">help_outline</span>
                        Pregunta Retadora del Proyecto
                    </h4>
                    <textarea
                        className="w-full bg-surface-card border border-white/5 rounded-2xl p-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-magenta/30 resize-none h-24"
                        placeholder="Ej: ¿Cómo podríamos reducir los residuos plásticos en nuestro recreo?"
                        value={unidad.proyectoExtra?.preguntaRetadora || ''}
                        onChange={(e) => onUpdate({
                            proyectoExtra: {
                                ...unidad.proyectoExtra!,
                                preguntaRetadora: e.target.value,
                                queSabemos: unidad.proyectoExtra?.queSabemos || '',
                                queQueremosSaber: unidad.proyectoExtra?.queQueremosSaber || '',
                                comoLoHaremos: unidad.proyectoExtra?.comoLoHaremos || '',
                                productoFinal: unidad.proyectoExtra?.productoFinal || '',
                                fases: unidad.proyectoExtra?.fases || []
                            }
                        })}
                    />
                </div>
            </Card>
        </div>
    );
};

const Step2Participativo: React.FC<{ unidad: Unidad, onUpdate: (u: Partial<Unidad>) => void }> = ({ unidad, onUpdate }) => {
    const updateExtra = (field: string, value: string) => {
        onUpdate({ proyectoExtra: { ...unidad.proyectoExtra!, [field]: value } });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Planificación Participativa</h3>
                    <p className="text-gray-500 text-sm">Responde estas preguntas junto con tus estudiantes para definir el rumbo del proyecto.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card variant="flat" className="space-y-4 border-t-4 border-t-primary-teal">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">¿Qué sabemos?</h4>
                    <textarea
                        className="w-full bg-surface-card border border-white/5 rounded-2xl p-4 text-[11px] text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-teal h-48 resize-none"
                        value={unidad.proyectoExtra?.queSabemos}
                        onChange={(e) => updateExtra('queSabemos', e.target.value)}
                    />
                </Card>
                <Card variant="flat" className="space-y-4 border-t-4 border-t-brand-magenta">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">¿Qué queremos saber?</h4>
                    <textarea
                        className="w-full bg-surface-card border border-white/5 rounded-2xl p-4 text-[11px] text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-magenta h-48 resize-none"
                        value={unidad.proyectoExtra?.queQueremosSaber}
                        onChange={(e) => updateExtra('queQueremosSaber', e.target.value)}
                    />
                </Card>
                <Card variant="flat" className="space-y-4 border-t-4 border-t-yellow-400">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">¿Cómo lo haremos?</h4>
                    <textarea
                        className="w-full bg-surface-card border border-white/5 rounded-2xl p-4 text-[11px] text-gray-300 focus:outline-none focus:ring-1 focus:ring-yellow-400 h-48 resize-none"
                        value={unidad.proyectoExtra?.comoLoHaremos}
                        onChange={(e) => updateExtra('comoLoHaremos', e.target.value)}
                    />
                </Card>
            </div>

            <Step2Disena unidad={unidad} onUpdate={onUpdate} />
        </div>
    );
};

const Step3Fases: React.FC<{ unidad: Unidad, onUpdate: (u: Partial<Unidad>) => void }> = ({ unidad, onUpdate }) => {
    const phases = unidad.proyectoExtra?.fases || [
        { nombre: 'SENSIBILIZACIÓN', actividades: '', semanas: 1 },
        { nombre: 'INVESTIGACIÓN', actividades: '', semanas: 2 },
        { nombre: 'ACCIÓN/PRODUCTO', actividades: '', semanas: 1 }
    ];

    const updatePhases = (newPhases: any[]) => {
        onUpdate({ proyectoExtra: { ...unidad.proyectoExtra!, fases: newPhases } });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Estructura del Proyecto</h3>
                <p className="text-gray-500 text-sm mt-1">Define las grandes fases y actividades que darán forma al cronograma.</p>
            </header>

            <div className="space-y-4">
                {phases.map((phase, i) => (
                    <Card key={i} variant="flat" className="group border-l-4 border-l-brand-magenta">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-64 space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">NOMBRE DE LA FASE</label>
                                <input
                                    className="w-full bg-surface-card border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white uppercase font-bold focus:outline-none focus:ring-1 focus:ring-brand-magenta"
                                    value={phase.nombre}
                                    onChange={(e) => {
                                        const next = [...phases];
                                        next[i].nombre = e.target.value;
                                        updatePhases(next);
                                    }}
                                />
                                <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">SEMANAS:</label>
                                    <input
                                        type="number"
                                        className="w-16 bg-surface-card border border-white/5 rounded-xl px-3 py-1.5 text-xs text-center text-white"
                                        value={phase.semanas}
                                        onChange={(e) => {
                                            const next = [...phases];
                                            next[i].semanas = parseInt(e.target.value) || 1;
                                            updatePhases(next);
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ACTIVIDADES PRINCIPALES</label>
                                <textarea
                                    className="w-full h-24 bg-surface-card border border-white/5 rounded-2xl p-4 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-magenta/30 resize-none"
                                    placeholder="Describe lo que los estudiantes harán en esta fase..."
                                    value={phase.actividades}
                                    onChange={(e) => {
                                        const next = [...phases];
                                        next[i].actividades = e.target.value;
                                        updatePhases(next);
                                    }}
                                />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card variant="glass" className="bg-primary-teal/5 border-primary-teal/10">
                <Step3Organiza unidad={unidad} onUpdate={onUpdate} />
            </Card>
        </div>
    );
}

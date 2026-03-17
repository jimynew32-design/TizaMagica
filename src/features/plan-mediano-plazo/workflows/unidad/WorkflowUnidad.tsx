import React, { useState } from 'react';
import { NeonButton } from '@/components/ui/NeonButton';
import { Unidad } from '@/types/schemas';
import { useUnidadesStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { Step1Diagnostico } from './Step1Diagnostico';
import { Step2Disena } from './Step2Disena';
import { Step3Organiza } from './Step3Organiza';
import { Step5Preve } from './Step5Preve';
import { TabSwitch } from '@/components/ui/TabSwitch';

interface WorkflowUnidadProps {
    unidad: Unidad;
}


export const WorkflowUnidad: React.FC<WorkflowUnidadProps> = ({ unidad }) => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const { updateUnidad } = useUnidadesStore();

    const handleUpdate = (updates: Partial<Unidad>) => {
        updateUnidad(unidad.id, updates);
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0: return <Step1Diagnostico unidad={unidad} onUpdate={handleUpdate} />;
            case 1: return <Step2Disena unidad={unidad} onUpdate={handleUpdate} />;
            case 2: return <Step3Organiza unidad={unidad} onUpdate={handleUpdate} />;
            case 3: return <Step5Preve unidad={unidad} onUpdate={handleUpdate} />;
            default: return null;
        }
    };

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/unidades')}
                        className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-500 hover:text-white transition-all group"
                    >
                        <span className="material-icons-round group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-primary-teal uppercase tracking-[0.2em]">UNIDAD {unidad.numero}</span>
                            <span className="w-1 h-1 bg-gray-600 rounded-full" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{unidad.tipo}</span>
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight line-clamp-1">{unidad.diagnosticoStep.titulo}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <NeonButton variant="secondary" icon="visibility" onClick={() => navigate(`/unidades/${unidad.id}/preview`)}>PREVISUALIZAR</NeonButton>
                    <NeonButton variant="magenta" icon="description">EXPORTAR</NeonButton>
                </div>
            </header>

            {/* Pill Tabs */}
            <TabSwitch
                options={[
                    { value: '0', label: '4.1 DIAGNÓSTICO', icon: 'analytics' },
                    { value: '1', label: '4.2 DISEÑA', icon: 'architecture' },
                    { value: '2', label: '4.3 ORGANIZA', icon: 'grid_view' },
                    { value: '3', label: '4.4 PREVÉ', icon: 'visibility' },
                ]}
                value={currentStep.toString()}
                onChange={(val) => setCurrentStep(parseInt(val))}
                variant="teal"
            />

            {/* Content Area */}
            <div className="mt-8 min-h-[50vh]">
                {renderStep()}
            </div>

        </div>
    );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { NeonInput } from '@/components/ui/NeonInput';
import { NeonButton } from '@/components/ui/NeonButton';
import { StepperProgress } from '@/components/ui/StepperProgress';
import { SchedulerStep } from '@/features/onboarding/SchedulerStep';
import { usePerfilStore } from '@/store';

export const OnboardingWizard: React.FC = () => {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    const { updateOnboarding } = usePerfilStore();
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        nombreCompleto: '',
        gereduDre: '',
        ugel: '',
        nombreIE: '',
        director: '',
        nivel: 'Secundaria' as 'Inicial' | 'Primaria' | 'Secundaria',
        cargaHoraria: []
    });

    const steps = ['Identidad', 'Institución', 'Horario'];

    const handleNext = () => {
        if (step < 2) {
            setStep(step + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            await updateOnboarding(
                formData.nombreCompleto,
                {
                    gereduDre: formData.gereduDre,
                    ugel: formData.ugel,
                    nombreIE: formData.nombreIE,
                    director: formData.director
                },
                formData.nivel,
                formData.cargaHoraria
            );
            navigate('/');
        } catch (err) {
            console.error('Error en onboarding:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-start py-12 px-2">
            <div className="w-full max-w-[1700px] space-y-8">
                {/* Progress */}
                <div className="px-10">
                    <StepperProgress steps={steps} currentStep={step} />
                </div>

                <Card variant="strong" className="mt-8 !p-4 md:!p-8">
                    <CardContent className="pt-6 !p-0">
                        {step === 0 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-white">¿Cómo te llamas?</h3>
                                    <p className="text-gray-300">Queremos personalizar tu experiencia pedagógica</p>
                                </div>
                                <NeonInput
                                    label="Nombre Completo"
                                    icon="person"
                                    placeholder="Ej. Miguel de Cervantes Saavedra"
                                    value={formData.nombreCompleto}
                                    onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                                    autoFocus
                                />
                            </div>
                        )}

                        {step === 1 && (
                            <div className="grid grid-cols-2 gap-6 animate-fade-in">
                                <div className="col-span-2 text-center mb-4">
                                    <h3 className="text-2xl font-bold text-white">Datos Institucionales</h3>
                                    <p className="text-gray-300">Esta información aparecerá en tus documentos oficiales</p>
                                </div>
                                <NeonInput
                                    label="GEREDU / DRE"
                                    icon="account_balance"
                                    placeholder="Ej. Cusco"
                                    value={formData.gereduDre}
                                    onChange={(e) => setFormData({ ...formData, gereduDre: e.target.value })}
                                    autoFocus
                                />
                                <NeonInput
                                    label="UGEL"
                                    icon="apartment"
                                    placeholder="Ej. Quispicanchi"
                                    value={formData.ugel}
                                    onChange={(e) => setFormData({ ...formData, ugel: e.target.value })}
                                />
                                <NeonInput
                                    label="Nombre de la I.E."
                                    icon="school"
                                    placeholder="Ej. Glorioso 50474"
                                    value={formData.nombreIE}
                                    onChange={(e) => setFormData({ ...formData, nombreIE: e.target.value })}
                                />
                                <NeonInput
                                    label="Director(a)"
                                    icon="manager"
                                    placeholder="Nombre de la autoridad"
                                    value={formData.director}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, director: e.target.value })}
                                />
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-fade-in">
                                <SchedulerStep
                                    value={formData.cargaHoraria}
                                    nivel={formData.nivel}
                                    onNivelChange={(n: any) => setFormData({ ...formData, nivel: n })}
                                    onChange={(horario: any) => setFormData({ ...formData, cargaHoraria: horario })}
                                />
                            </div>
                        )}

                        <div className="mt-12 flex justify-between items-center bg-white/5 -mx-6 -mb-6 p-6 rounded-b-[2rem]">
                            <button
                                onClick={() => setStep(step - 1)}
                                disabled={step === 0}
                                className="text-sm font-bold text-gray-400 hover:text-white disabled:opacity-0 transition-all"
                            >
                                VOLVER
                            </button>
                            <NeonButton
                                onClick={handleNext}
                                isLoading={loading}
                                icon={step === 2 ? 'auto_awesome' : 'arrow_forward'}
                                iconPosition="right"
                            >
                                {step === 2 ? 'COMENZAR A PLANIFICAR' : 'CONTINUAR'}
                            </NeonButton>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

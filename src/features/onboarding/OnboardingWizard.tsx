import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { NeonInput } from '@/components/ui/NeonInput';
import { TabSwitch } from '@/components/ui/TabSwitch';
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
        tipoIE: 'JER' as 'JER' | 'JEC' | 'CEBA' | 'EBE' | 'EIB' | 'SFT',
        turno: 'Mañana' as 'Mañana' | 'Tarde' | 'Noche',
        cargaHoraria: []
    });

    const steps = ['Identidad', 'Institución', 'Configuración', 'Horario'];

    const handleNext = () => {
        if (step < 3) {
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
                formData.cargaHoraria,
                formData.tipoIE,
                formData.turno
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in max-w-5xl mx-auto py-10">
                                <div className="col-span-1 md:col-span-3 text-center mb-6">
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Configuración Académica</h3>
                                    <p className="text-gray-400 text-sm mt-2">Define tu entorno de trabajo antes de organizar el horario</p>
                                </div>

                                {/* Nivel */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-magenta flex items-center gap-2 px-2">
                                        <span className="material-icons-round text-sm">school</span>
                                        Nivel Educativo
                                    </label>
                                    <div className="bg-white/5 p-2 rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
                                        <TabSwitch
                                            className="w-full"
                                            options={[
                                                { value: 'Inicial', label: 'INI', icon: 'child_care' },
                                                { value: 'Primaria', label: 'PRI', icon: 'auto_stories' },
                                                { value: 'Secundaria', label: 'SEC', icon: 'history_edu' }
                                            ]}
                                            value={formData.nivel}
                                            onChange={(v) => setFormData({ ...formData, nivel: v as any })}
                                            variant="magenta"
                                        />
                                    </div>
                                </div>

                                {/* Modelo IE */}
                                <div className={`space-y-4 transition-all duration-500 ${formData.nivel !== 'Secundaria' ? 'opacity-20 pointer-events-none' : ''}`}>
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-magenta flex items-center gap-2 px-2">
                                        <span className="material-icons-round text-sm">hub</span>
                                        Modelo de Servicio
                                    </label>
                                    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                                        <select 
                                            value={formData.tipoIE}
                                            onChange={(e) => setFormData({ ...formData, tipoIE: e.target.value as any })}
                                            className="w-full bg-transparent p-4 text-white font-black text-xs uppercase tracking-widest focus:ring-1 focus:ring-brand-magenta outline-none transition-all cursor-pointer"
                                        >
                                            <option value="JER" className="bg-[#111]">JER - Regular</option>
                                            <option value="JEC" className="bg-[#111]">JEC - Completa</option>
                                            <option value="CEBA" className="bg-[#111]">CEBA - Alternativa</option>
                                            <option value="SFT" className="bg-[#111]">SFT - Técnica</option>
                                            <option value="EIB" className="bg-[#111]">EIB - Bilingüe</option>
                                            <option value="EBE" className="bg-[#111]">EBE - Especial</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Turno */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-magenta flex items-center gap-2 px-2">
                                        <span className="material-icons-round text-sm">schedule</span>
                                        Turno de Trabajo
                                    </label>
                                    <div className="bg-white/5 p-2 rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
                                        <TabSwitch
                                            className="w-full"
                                            options={[
                                                { value: 'Mañana', label: 'MAÑ', icon: 'wb_sunny' },
                                                { value: 'Tarde', label: 'TAR', icon: 'wb_twilight' },
                                                { value: 'Noche', label: 'NOC', icon: 'dark_mode' }
                                            ]}
                                            value={formData.turno}
                                            onChange={(v) => setFormData({ ...formData, turno: v as any })}
                                            variant="magenta"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-fade-in">
                                <SchedulerStep
                                    value={formData.cargaHoraria}
                                    nivel={formData.nivel}
                                    tipoIE={formData.tipoIE}
                                    turno={formData.turno}
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
                                icon={step === 3 ? 'auto_awesome' : 'arrow_forward'}
                                iconPosition="right"
                            >
                                {step === 3 ? 'COMENZAR A PLANIFICAR' : 'CONTINUAR'}
                            </NeonButton>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

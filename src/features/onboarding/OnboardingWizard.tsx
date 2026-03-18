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
        duracionHora: 45,
        configuracionRecreos: [20],
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
                formData.turno,
                formData.duracionHora,
                formData.configuracionRecreos
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

                                 {/* Configuración de Tiempo Pro */}
                                 <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-12 mt-4 pt-10 border-t border-white/5 animate-slide-up">
                                    {/* Columna Izquierda: Hora Pedagógica y N° Recreos */}
                                    <div className="space-y-10">
                                        <div className="space-y-4 group">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 group-hover:text-primary-teal transition-colors flex items-center gap-3 px-3">
                                                <span className="material-icons-round text-sm text-brand-magenta">timer</span>
                                                Duración Hora Pedagógica
                                            </label>
                                            <div className="bg-white/[0.03] p-1.5 rounded-[1.5rem] border border-white/5 focus-within:border-primary-teal/30 focus-within:bg-white/[0.05] transition-all flex items-center">
                                                <input 
                                                    type="number" 
                                                    value={formData.duracionHora}
                                                    onChange={(e) => setFormData({ ...formData, duracionHora: parseInt(e.target.value) || 0 })}
                                                    className="bg-transparent text-white font-black text-xl w-full px-6 py-3 focus:outline-none placeholder-gray-800"
                                                    placeholder="45"
                                                />
                                                <span className="text-[10px] font-black text-gray-600 mr-6 uppercase tracking-widest">MIN</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 group">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 group-hover:text-primary-teal transition-colors flex items-center gap-3 px-3">
                                                <span className="material-icons-round text-sm text-brand-magenta">reorder</span>
                                                Cantidad de Recreos
                                            </label>
                                            <div className="bg-white/[0.03] p-1.5 rounded-[1.5rem] border border-white/5 focus-within:border-primary-teal/30 focus-within:bg-white/[0.05] transition-all overflow-hidden relative">
                                                <select 
                                                    value={formData.configuracionRecreos.length}
                                                    onChange={(e) => {
                                                        const n = parseInt(e.target.value);
                                                        const current = formData.configuracionRecreos;
                                                        if (n > current.length) {
                                                            const added = Array(n - current.length).fill(20);
                                                            setFormData({ ...formData, configuracionRecreos: [...current, ...added] });
                                                        } else {
                                                            setFormData({ ...formData, configuracionRecreos: current.slice(0, n) });
                                                        }
                                                    }}
                                                    className="w-full bg-transparent p-4 text-white font-black text-xl appearance-none outline-none cursor-pointer"
                                                >
                                                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                                                        <option key={num} value={num} className="bg-[#111]">{num} {num === 1 ? 'Recreo' : 'Recreos'}</option>
                                                    ))}
                                                </select>
                                                <span className="material-icons-round absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">expand_more</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Columna Derecha: Duraciones de Recreos Individuales */}
                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-3 px-3">
                                            <span className="material-icons-round text-sm text-brand-magenta">hourglass_top</span>
                                            Duración por cada Recreo
                                        </label>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {formData.configuracionRecreos.map((duracion, idx) => (
                                                <div key={idx} className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex flex-col gap-2 group hover:bg-white/[0.04] transition-all">
                                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Recreo {idx + 1}</span>
                                                    <div className="flex items-baseline gap-2">
                                                        <input 
                                                            type="number"
                                                            value={duracion}
                                                            onChange={(e) => {
                                                                const newConf = [...formData.configuracionRecreos];
                                                                newConf[idx] = parseInt(e.target.value) || 0;
                                                                setFormData({ ...formData, configuracionRecreos: newConf });
                                                            }}
                                                            className="bg-transparent text-white font-black text-xl w-full focus:outline-none"
                                                        />
                                                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">min</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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
                                    duracionHora={formData.duracionHora}
                                    configuracionRecreos={formData.configuracionRecreos}
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

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { NeonInput } from '@/components/ui/NeonInput';
import { SaveButton } from '@/components/ui/SaveButton';
import { usePerfilStore } from '@/store';
import { SchedulerStep } from '@/features/onboarding/SchedulerStep';
import { NivelEducativo, FilaHorario } from '@/types/schemas';

export const ProfileEditor: React.FC = () => {
    const { perfil, updatePerfil, updatePin, syncScheduleWithPlanes } = usePerfilStore();
    const [activeSection, setActiveSection] = useState<'info' | 'horario'>('info');
    const [showPinForm, setShowPinForm] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [pinLoading, setPinLoading] = useState(false);
    const [pinSuccess, setPinSuccess] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        nombreCompleto: perfil?.nombreCompleto || '',
        nombreIE: perfil?.nombreIE || '',
        director: perfil?.director || '',
        gereduDre: perfil?.gereduDre || '',
        ugel: perfil?.ugel || '',
        nivel: perfil?.nivel || 'Primaria' as NivelEducativo,
        cargaHoraria: perfil?.cargaHoraria || [] as FilaHorario[]
    });

    const handleSave = async () => {
        await updatePerfil(formData);
        await syncScheduleWithPlanes();
    };

    const handleUpdatePin = async () => {
        if (newPin.length < 6) return alert('El PIN debe tener al menos 6 dígitos');
        setPinLoading(true);
        const success = await updatePin(newPin);
        if (success) {
            setPinSuccess(true);
            setNewPin('');
            setTimeout(() => {
                setShowPinForm(false);
                setPinSuccess(false);
            }, 2000);
        }
        setPinLoading(false);
    };

    if (!perfil) return null;

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header Pro */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-teal to-cyan-500 rounded-[2.5rem] flex items-center justify-center glow-teal shadow-2xl">
                        <span className="material-icons-round text-gray-900 text-4xl">account_circle</span>
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Mi Perfil Profesional</h2>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Gestión Centralizada de Identidad e Ingeniería Pedagógica</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="flex bg-surface-header/50 p-1.5 rounded-3xl border border-white/5 backdrop-blur-md">
                        <button
                            onClick={() => setActiveSection('info')}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === 'info' ? 'bg-primary-teal text-gray-900 shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            Información Gen.
                        </button>
                        <button
                            onClick={() => setActiveSection('horario')}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === 'horario' ? 'bg-primary-teal text-gray-900 shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            Carga Horaria
                        </button>
                    </div>
                </div>
            </header>

            {activeSection === 'info' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Columna Izquierda: Identidad y Seguridad */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card variant="strong" className="overflow-visible relative">
                            <div className="absolute -top-3 -right-3 px-4 py-1 bg-primary-teal text-gray-900 text-[9px] font-black rounded-full shadow-glow-teal z-10 uppercase tracking-widest">
                                Validado
                            </div>
                            <CardHeader>
                                <CardTitle>Seguridad y Cuenta</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <NeonInput
                                    label="NOMBRE COMPLETO"
                                    value={formData.nombreCompleto}
                                    icon="person"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                                />
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-5 bg-white/[0.02] rounded-[1.5rem] border border-white/5 group transition-all hover:bg-white/[0.04]">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Usuario de Acceso</p>
                                            <span className="material-icons-round text-gray-800 text-sm group-hover:text-primary-teal">person</span>
                                        </div>
                                        <p className="text-xl font-black text-white tracking-[0.3em]">{perfil.dni}</p>
                                    </div>
                                    
                                    <div className="p-5 bg-white/[0.02] rounded-[1.5rem] border border-white/5 group transition-all hover:bg-white/[0.04]">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">PIN DE SEGURIDAD</p>
                                            <button 
                                                onClick={() => setShowPinForm(!showPinForm)}
                                                className="w-8 h-8 rounded-lg bg-surface-header flex items-center justify-center text-gray-500 hover:text-primary-teal hover:bg-primary-teal/10 transition-all"
                                            >
                                                <span className="material-symbols-rounded text-sm">{showPinForm ? 'close' : 'edit'}</span>
                                            </button>
                                        </div>
                                        
                                        {!showPinForm ? (
                                            <p className="text-lg font-black text-white tracking-widest italic opacity-40">••••••</p>
                                        ) : (
                                            <div className="mt-4 space-y-4 animate-slide-down">
                                                <NeonInput
                                                    label="NUEVO PIN (6 DÍGITOS)"
                                                    placeholder="Digite 6 números"
                                                    maxLength={6}
                                                    value={newPin}
                                                    icon="lock"
                                                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                                />
                                                <NeonButton 
                                                    className="w-full h-10 text-[10px]" 
                                                    variant={pinSuccess ? 'teal' : 'primary'}
                                                    isLoading={pinLoading}
                                                    onClick={handleUpdatePin}
                                                >
                                                    {pinSuccess ? '✓ ACTUALIZADO' : 'CONFIRMAR CAMBIO'}
                                                </NeonButton>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Columna Derecha: Datos Institucionales */}
                    <div className="lg:col-span-8">
                        <Card variant="strong">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <span className="material-icons-round text-primary-teal">domain</span>
                                    <CardTitle>Información Institucional</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <NeonInput
                                        label="NOMBRE DE LA INSTITUCIÓN"
                                        placeholder="Ej. I.E. Emblemática"
                                        value={formData.nombreIE}
                                        icon="school"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nombreIE: e.target.value })}
                                    />
                                    <NeonInput
                                        label="DIRECTOR(A)"
                                        placeholder="Nombre del directivo"
                                        value={formData.director}
                                        icon="supervisor_account"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, director: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <NeonInput
                                        label="GRE / DRE"
                                        placeholder="Gerencia Regional de Educación"
                                        value={formData.gereduDre}
                                        icon="account_balance"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, gereduDre: e.target.value })}
                                    />
                                    <NeonInput
                                        label="UGEL"
                                        placeholder="Unidad de Gestión Educativa"
                                        value={formData.ugel}
                                        icon="apartment"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ugel: e.target.value })}
                                    />
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
                                            <span className="material-icons-round text-primary-teal text-sm">stairs</span>
                                            Nivel Educativo
                                        </label>
                                        <div className="flex bg-surface-header/30 p-1.5 rounded-2xl border border-white/5">
                                            {(['Inicial', 'Primaria', 'Secundaria'] as NivelEducativo[]).map((n) => (
                                                <button
                                                    key={n}
                                                    onClick={() => setFormData({ ...formData, nivel: n })}
                                                    className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.nivel === n ? 'bg-primary-teal text-gray-900 shadow-lg scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-primary-teal/5 rounded-3xl border border-primary-teal/10 flex items-center gap-6">
                                    <div className="w-12 h-12 bg-primary-teal rounded-2xl flex items-center justify-center text-gray-900">
                                        <span className="material-icons-round">info</span>
                                    </div>
                                    <p className="text-xs text-primary-teal opacity-80 leading-relaxed font-medium">
                                        Esta información se utilizará para el encabezado oficial de todos tus documentos generados (Unidades, Sesiones, Planes Anuales). Asegúrate de que los nombres sean exactos según el MINEDU.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="animate-slide-up">
                    <SchedulerStep
                        value={formData.cargaHoraria}
                        nivel={formData.nivel}
                        onChange={(val) => setFormData({ ...formData, cargaHoraria: val })}
                    />
                </div>
            )}

            {/* SaveButton flotante */}
            <SaveButton
                onSave={handleSave}
                tooltip="Guardar perfil"
                position="floating"
                size="lg"
            />
        </div>
    );
};

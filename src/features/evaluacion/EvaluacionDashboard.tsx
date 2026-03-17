import React from 'react';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { useUnidadesStore } from '@/store';
import { useNavigate } from 'react-router-dom';

export const EvaluacionDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { sesiones } = useUnidadesStore();

    // Sesiones que tienen instrumentos generados
    const sesionesConInstrumento = sesiones.filter(s => s.instrumentoContenido);

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">Banco de Evaluación</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Gestión centralizada de rúbricas, listas de cotejo e instrumentos del currículo.
                    </p>
                </div>
                <NeonButton variant="primary" icon="add">NUEVO INSTRUMENTO</NeonButton>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card variant="strong" className="bg-primary-teal/5 border-primary-teal/10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-primary-teal/20 text-primary-teal rounded-xl flex items-center justify-center">
                            <span className="material-icons-round">analytics</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">{sesionesConInstrumento.length}</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Instrumentos Diseñados</p>
                        </div>
                    </div>
                </Card>
                <Card variant="strong" className="bg-brand-magenta/5 border-brand-magenta/10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-brand-magenta/20 text-brand-magenta rounded-xl flex items-center justify-center">
                            <span className="material-icons-round">spellcheck</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">0</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rúbricas Maestras</p>
                        </div>
                    </div>
                </Card>
                <Card variant="strong" className="bg-surface-card border-white/5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-white/5 text-gray-400 rounded-xl flex items-center justify-center">
                            <span className="material-icons-round">collections_bookmark</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">3</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tipos oficiales CNEB</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="space-y-6">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Instrumentos Recientes</h3>
                {sesionesConInstrumento.length === 0 ? (
                    <div className="py-24 text-center bg-white/2 rounded-[3rem] border border-dashed border-white/5 space-y-4">
                        <span className="material-icons-round text-5xl text-gray-700">assignment_late</span>
                        <p className="text-gray-500 italic text-sm">Aún no has generado instrumentos de evaluación para tus sesiones.</p>
                        <NeonButton variant="secondary" onClick={() => navigate('/sesiones')}>IR A SESIONES</NeonButton>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {sesionesConInstrumento.map(sesion => (
                            <Card key={sesion.id} variant="flat" className="group hover:border-primary-teal/20 transition-all cursor-pointer" onClick={() => navigate(`/sesiones/${sesion.id}`)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-primary-teal group-hover:bg-primary-teal/10 transition-all">
                                            <span className="material-icons-round">description</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white uppercase tracking-widest">{sesion.instrumento}</p>
                                            <p className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">{sesion.titulo}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest hidden md:block">Actualizado: {new Date(sesion.updatedAt).toLocaleDateString()}</span>
                                        <span className="material-icons-round text-gray-800 group-hover:text-primary-teal transition-all">chevron_right</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

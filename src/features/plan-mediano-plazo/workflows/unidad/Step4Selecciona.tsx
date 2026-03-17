import React from 'react';
import { Unidad } from '@/types/schemas';
import { ENFOQUES_TRANSVERSALES } from '@/services/cneb/enfoques-transversales';

interface Step4SeleccionaProps {
    unidad: Unidad;
    onUpdate: (updates: Partial<Unidad>) => void;
}

export const Step4Selecciona: React.FC<Step4SeleccionaProps> = ({ unidad, onUpdate }) => {
    const seleccionados = unidad.seleccionaStep?.enfoques || [];

    const handleToggle = (enfoqueId: string) => {
        const isSelected = seleccionados.some(e => e.enfoqueId === enfoqueId);
        
        let nuevosEnfoques;
        if (isSelected) {
            nuevosEnfoques = seleccionados.filter(e => e.enfoqueId !== enfoqueId);
        } else {
            const data = ENFOQUES_TRANSVERSALES.find(e => e.id === enfoqueId);
            if (!data) return;
            nuevosEnfoques = [
                ...seleccionados,
                {
                    enfoqueId: data.id,
                    nombre: data.nombre,
                    valores: data.valores.map(v => v.nombre),
                }
            ];
        }

        onUpdate({
            seleccionaStep: {
                ...unidad.seleccionaStep,
                enfoques: nuevosEnfoques
            }
        });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Selecciona</h3>
                    <p className="text-gray-500 text-sm">Elige los enfoques transversales a priorizar en esta unidad.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ENFOQUES_TRANSVERSALES.map(enfoque => {
                    const isSelected = seleccionados.some(e => e.enfoqueId === enfoque.id);

                    return (
                        <div
                            key={enfoque.id}
                            onClick={() => handleToggle(enfoque.id)}
                            className={`
                                cursor-pointer rounded-[2rem] p-6 border transition-all duration-300 relative overflow-hidden group
                                ${isSelected 
                                    ? 'bg-brand-magenta/10 border-brand-magenta shadow-[0_0_30px_rgba(255,0,128,0.15)]' 
                                    : 'bg-surface-card border-white/5 hover:border-white/20 hover:bg-white/5'}
                            `}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <h4 className={`text-sm font-black uppercase tracking-widest ${isSelected ? 'text-brand-magenta' : 'text-white group-hover:text-primary-teal'}`}>
                                    {enfoque.nombre}
                                </h4>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                    ${isSelected ? 'border-brand-magenta bg-brand-magenta' : 'border-white/20'}
                                `}>
                                    {isSelected && <span className="material-icons-round text-[14px] text-white">check</span>}
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                                {enfoque.valores.slice(0, 3).map((val, idx) => (
                                    <span key={idx} className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider
                                        ${isSelected ? 'bg-brand-magenta/20 text-brand-magenta' : 'bg-white/5 text-gray-500'}
                                    `}>
                                        {val.nombre}
                                    </span>
                                ))}
                                {enfoque.valores.length > 3 && (
                                    <span className={`px-2 py-1 rounded-md text-[9px] font-bold
                                        ${isSelected ? 'text-brand-magenta' : 'text-gray-500'}
                                    `}>+{enfoque.valores.length - 3}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {seleccionados.length === 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-3">
                    <span className="material-icons-round text-orange-500">warning</span>
                    <p className="text-xs text-orange-200 uppercase tracking-widest font-bold">No has seleccionado ningún enfoque transversal para esta unidad.</p>
                </div>
            )}
        </div>
    );
};

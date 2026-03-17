import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { HorarioConfig } from '../types';

interface SchedulePreviewProps {
    config: HorarioConfig;
}

export const SchedulePreview: React.FC<SchedulePreviewProps> = ({ config }) => {
    const { 
        inicioJornada, 
        bloquesPorDia, 
        duracionBloque, 
        diasLaborables, 
        cantidadRecreos 
    } = config;

    // Función para calcular los intervalos de tiempo integrando bloques y recreos
    const generateTimeSlots = () => {
        const slots = [];
        let [h, m] = inicioJornada.split(':').map(Number);
        
        // Lógica de distribución: un recreo cada 2 o 3 bloques aproximadamente
        const interval = Math.max(2, Math.floor(bloquesPorDia / (cantidadRecreos + 1)));

        let recreoIdx = 0;
        for (let i = 0; i < bloquesPorDia; i++) {
            // Generar Bloque
            const startB = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            let endMB = m + duracionBloque;
            let endHB = h + Math.floor(endMB / 60);
            endMB %= 60;
            const endB = `${endHB.toString().padStart(2, '0')}:${endMB.toString().padStart(2, '0')}`;
            
            slots.push({
                type: 'bloque' as const,
                index: i + 1,
                start: startB,
                end: endB,
                label: `Bloque ${i + 1}`
            });
            
            h = endHB;
            m = endMB;

            // Intercalar Recreo si toca
            if ((i + 1) % interval === 0 && recreoIdx < cantidadRecreos) {
                const duracionR = config.distribucionRecreos?.[recreoIdx] || 15;
                const startR = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                let endMR = m + duracionR;
                let endHR = h + Math.floor(endMR / 60);
                endMR %= 60;
                const endR = `${endHR.toString().padStart(2, '0')}:${endMR.toString().padStart(2, '0')}`;

                slots.push({
                    type: 'recreo' as const,
                    index: recreoIdx + 1,
                    start: startR,
                    end: endR,
                    label: `RECREO ${recreoIdx + 1}`
                });

                h = endHR;
                m = endMR;
                recreoIdx++;
            }
        }
        return slots;
    };

    const slots = generateTimeSlots();

    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[1600px] mx-auto mt-16 space-y-8"
        >
            {/* Cabecera de la Vista Previa */}
            <div className="flex items-center gap-6 px-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-magenta/10 flex items-center justify-center border border-brand-magenta/20 shadow-glow-magenta-xs">
                    <span className="material-icons-round text-xl text-brand-magenta">visibility</span>
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-[6px] text-white">Vista Previa Proyectada</h4>
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1">Estructura dinámica de la jornada escolar</p>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4" />
            </div>

            {/* Calendario Maestro */}
            <div className="bg-[#080808] border border-white/10 rounded-[3rem] p-10 overflow-x-auto shadow-2xl relative group/canvas">
                <div className="absolute inset-0 bg-brand-magenta/[0.01] opacity-0 group-hover/canvas:opacity-100 transition-opacity duration-1000" />
                
                <div className="min-w-[1000px] relative z-10">
                    {/* Header Días - Más impactante */}
                    <div 
                        className="grid gap-8 mb-12"
                        style={{ gridTemplateColumns: `200px repeat(${diasLaborables.length}, 1fr)` }}
                    >
                        <div className="text-[10px] font-black text-white/10 uppercase tracking-[6px] flex items-center justify-end pr-10">
                            Tiempo / Jornada
                        </div>
                        {diasLaborables.map((dia: string) => (
                            <div 
                                key={dia} 
                                className="text-center py-6 bg-white/[0.03] border border-white/10 rounded-[1.5rem] text-sm font-black uppercase tracking-[4px] text-white/80 shadow-2xl backdrop-blur-md"
                            >
                                {dia}
                            </div>
                        ))}
                    </div>

                    {/* Filas de Bloques y Recreos - Espacio Maximizado */}
                    <div className="space-y-8">
                        {slots.map((slot, sIdx) => {
                            const isRecreo = slot.type === 'recreo';
                            
                            return (
                                <div 
                                    key={`${slot.type}-${slot.index}-${sIdx}`}
                                    className={cn(
                                        "grid gap-8 group transition-all duration-500",
                                        isRecreo ? "py-2" : ""
                                    )}
                                    style={{ gridTemplateColumns: `200px repeat(${diasLaborables.length}, 1fr)` }}
                                >
                                    {/* Indicadores de Tiempo Gigantes */}
                                    <div className={cn(
                                        "flex flex-col items-end justify-center pr-10 border-r-4 transition-all duration-500 gap-3",
                                        isRecreo ? "border-brand-magenta/40 scale-105" : "border-white/5 group-hover:border-brand-magenta/20"
                                    )}>
                                        <div className="flex flex-col items-end">
                                            <span className={cn(
                                                "text-3xl font-black tracking-tighter transition-all",
                                                isRecreo ? "text-brand-magenta drop-shadow-glow-magenta" : "text-white group-hover:text-brand-magenta/80"
                                            )}>
                                                {slot.start}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "material-icons-round text-sm transition-colors",
                                                    isRecreo ? "text-brand-magenta/40" : "text-white/10"
                                                )}>arrow_downward</span>
                                                <span className={cn(
                                                    "text-xl font-bold tracking-tighter",
                                                    isRecreo ? "text-brand-magenta/30" : "text-white/30"
                                                )}>
                                                    {slot.end}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Contenido: Bloque vs Recreo */}
                                    {isRecreo ? (
                                        <div 
                                            className="col-span-full ml-[200px] h-20 rounded-[2rem] bg-brand-magenta/10 border-2 border-brand-magenta/30 border-dashed flex items-center justify-center gap-8 relative overflow-hidden group/recreo shadow-glow-magenta-xs"
                                        >
                                            <div className="absolute inset-0 bg-brand-magenta/10 translate-x-[-100%] group-hover/recreo:translate-x-[100%] transition-transform duration-[3000ms] ease-in-out" />
                                            <span className="material-icons-round text-brand-magenta text-3xl animate-bounce">coffee</span>
                                            <span className="text-sm font-black text-brand-magenta uppercase tracking-[12px] drop-shadow-sm">
                                                {slot.label} — DESCANSO PEDAGÓGICO
                                            </span>
                                            <span className="material-icons-round text-brand-magenta text-3xl animate-bounce" style={{ animationDelay: '300ms' }}>sparkles</span>
                                        </div>
                                    ) : (
                                        diasLaborables.map((_dia, idx) => (
                                            <div 
                                                key={idx}
                                                className="h-32 rounded-[2.5rem] bg-white/[0.02] border border-white/10 flex items-center justify-center group-hover:bg-white/[0.06] group-hover:border-brand-magenta/20 transition-all relative overflow-hidden group/cell shadow-2xl"
                                            >
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-12 h-1 bg-white/5 rounded-full group-hover:bg-brand-magenta/40 transition-colors" />
                                                    <span className="text-sm font-black text-white/20 uppercase tracking-[6px] group-hover:text-white transition-all duration-500 scale-90 group-hover:scale-100">
                                                        {slot.label}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-white/5 uppercase tracking-[2px] opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                                        Sesión Sincronizada
                                                    </span>
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-br from-brand-magenta/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Nota Informativa al pie de la tabla */}
                {cantidadRecreos > 0 && (
                    <div className="mt-12 p-6 bg-brand-magenta/5 border border-brand-magenta/20 rounded-3xl flex items-center gap-6 backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-xl bg-brand-magenta/20 flex items-center justify-center shrink-0">
                            <span className="material-icons-round text-brand-magenta">auto_awesome</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[4px] text-brand-magenta/80">Inteligencia de Distribución Activa</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mt-1 leading-relaxed">
                                El sistema ha posicionado {cantidadRecreos} periodos de descanso para optimizar la curva de aprendizaje de los estudiantes.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

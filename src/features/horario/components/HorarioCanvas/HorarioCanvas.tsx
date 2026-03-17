import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import { useHorarioStore } from '../../store';
import { Docente } from '../../types';

export const HorarioCanvas: React.FC = () => {
    const { config, recursos, cargaAcademica, restricciones } = useHorarioStore();
    const [selectedSeccionId, setSelectedSeccionId] = useState(recursos.secciones[0]?.id || '');
    
    if (!config) return null;

    const { diasLaborables, bloquesPorDia } = config;

    // OPTIMIZACIÓN #7: Memoizar mapas de búsqueda para evitar O(N) en el render
    const docentesMap = useMemo(() => {
        const map = new Map<string, Docente>();
        recursos.docentes.forEach(d => map.set(d.id, d));
        return map;
    }, [recursos.docentes]);

    const indexedRestricciones = useMemo(() => {
        const set = new Set<string>();
        restricciones
            .filter(r => r.tipo === 'zona_nula')
            .forEach(r => set.add(`${r.dia}-${r.bloqueIndex}`));
        return set;
    }, [restricciones]);

    // Filtramos la carga para la sección seleccionada
    const cargaSeccion = useMemo(() => 
        cargaAcademica.filter(c => c.seccionId === selectedSeccionId),
    [cargaAcademica, selectedSeccionId]);

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-700">
            {/* Cabecera del Canvas */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[#0a0a0a] p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-white/5 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 md:p-4 bg-brand-magenta/10 rounded-xl md:rounded-2xl">
                        <span className="material-icons-round text-brand-magenta text-2xl md:text-3xl">dashboard</span>
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Tablero Maestro</h3>
                        <p className="text-[8px] md:text-[10px] text-white/40 font-black uppercase tracking-[2px] md:tracking-[4px]">Visualización por Sección</p>
                    </div>
                </div>

                {/* Selector de Sección */}
                <div className="flex bg-black/50 p-1 rounded-2xl border border-white/5 overflow-x-auto max-w-full no-scrollbar">
                    {recursos.secciones.map(sec => (
                        <button
                            key={sec.id}
                            onClick={() => setSelectedSeccionId(sec.id)}
                            className={cn(
                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                selectedSeccionId === sec.id 
                                    ? "bg-brand-magenta text-white shadow-glow-magenta" 
                                    : "text-white/20 hover:text-white"
                            )}
                        >
                            {sec.grado}{sec.letra}
                        </button>
                    ))}
                </div>
            </header>

            {/* La Grilla del Horario */}
            <div className="relative overflow-x-auto bg-[#050505] rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 p-4 md:p-8 custom-scrollbar">
                <div className="min-w-[800px] md:min-w-[1000px] space-y-3 md:space-y-4">
                    {/* Header de Días */}
                    <div className="grid grid-cols-6 gap-2 md:gap-4 mb-4 md:mb-8 sticky top-0 bg-[#050505] z-20">
                        <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[2px] md:tracking-[4px] text-white/10 flex items-center justify-center sticky left-0 bg-[#050505] z-30">
                            Hora
                        </div>
                        {diasLaborables.map(dia => (
                            <div key={dia} className="text-center">
                                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[3px] md:tracking-[6px] text-white/20 mb-1">{dia}</p>
                                <div className="h-0.5 w-6 md:w-8 bg-brand-magenta/20 mx-auto rounded-full" />
                            </div>
                        ))}
                    </div>

                    {/* Filas de la Grilla */}
                    {Array.from({ length: bloquesPorDia }).map((_, bIdx) => {
                        const [hours, minutes] = config.inicioJornada.split(':').map(Number);
                        const blockStart = new Date(0, 0, 0, hours, minutes + (bIdx * config.duracionBloque));
                        const timeStr = `${blockStart.getHours().toString().padStart(2, '0')}:${blockStart.getMinutes().toString().padStart(2, '0')}`;

                        return (
                            <div key={bIdx} className="grid grid-cols-6 gap-2 md:gap-4 group/row">
                                <div className="flex flex-col items-center justify-center p-2 md:p-4 sticky left-0 bg-[#050505] z-10 border-r border-white/5 shadow-[10px_0_15px_-10px_rgba(0,0,0,0.5)]">
                                    <span className="text-sm md:text-lg font-black text-white/60 tracking-tighter leading-none">{timeStr}</span>
                                    <span className="text-[6px] md:text-[8px] font-black text-brand-magenta/40 uppercase tracking-widest mt-1">B{bIdx + 1}</span>
                                </div>

                                {diasLaborables.map(dia => {
                                    const isZonaNula = indexedRestricciones.has(`${dia}-${bIdx}`);
                                    
                                    return (
                                        <div
                                            key={dia}
                                            className={cn(
                                                "h-20 md:h-28 rounded-2xl md:rounded-3xl border-2 transition-all duration-500 relative flex items-center justify-center p-3 md:p-4 group/cell overflow-hidden",
                                                isZonaNula 
                                                    ? "bg-white/[0.02] border-white/5 cursor-not-allowed" 
                                                    : "bg-white/[0.03] border-white/5 hover:border-brand-magenta/30 hover:bg-brand-magenta/[0.02]"
                                            )}
                                        >
                                            {isZonaNula ? (
                                                <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
                                                    <span className="material-icons-round text-sm">block</span>
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Receso</span>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="material-icons-round text-white/5 text-4xl group-hover:scale-110 transition-transform">add_circle_outline</span>
                                                </div>
                                            )}
                                            
                                            {!isZonaNula && (
                                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                                    <span className="material-icons-round text-brand-magenta text-xs">edit</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Panel Lateral de Clases No Asignadas */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black uppercase tracking-[4px] text-white/40">Materias Pendientes</h4>
                        <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest italic font-serif">Malla Curricular CNEB Detectada</p>
                    </div>
                    <span className="text-[8px] font-black text-brand-magenta bg-brand-magenta/10 px-3 py-1 rounded-full uppercase tracking-widest">
                        {cargaSeccion.length} Entradas
                    </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {cargaSeccion.map(item => {
                        const docente = docentesMap.get(item.docenteId);
                        return (
                            <motion.div
                                key={item.id}
                                whileHover={{ scale: 1.02, y: -2 }}
                                className="bg-white/5 border border-white/10 p-5 rounded-2xl cursor-grab active:cursor-grabbing hover:border-brand-magenta/40 transition-colors flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand-magenta/20 flex items-center justify-center shrink-0">
                                        <span className="material-icons-round text-brand-magenta text-lg">school</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-white truncate group-hover:text-brand-magenta transition-colors">{item.materiaNombre}</p>
                                        <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1 truncate">{docente?.nombre || 'Sin asignar'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center pl-4 border-l border-white/5 shrink-0">
                                    <span className="text-xl font-black text-white/20 group-hover:text-brand-magenta/40 leading-none">{item.horasSemanales}</span>
                                    <span className="text-[6px] font-black text-white/10 uppercase tracking-tighter mt-1">Horas</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
            
            {/* Legend / Info UX */}
            <div className="flex justify-center">
                <div className="flex items-center gap-6 px-8 py-3 bg-white/5 rounded-full border border-white/5">
                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white/40">
                        <div className="w-2 h-2 rounded-full border border-brand-magenta" />
                        Espacio Libre
                    </div>
                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white/40">
                        <div className="w-2 h-2 rounded bg-white/5 border border-white/10" />
                        Bloqueo (Receso)
                    </div>
                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white/40">
                        <span className="material-icons-round text-xs">mouse</span>
                        Arrastra para asignar
                    </div>
                </div>
            </div>
        </div>
    );
};

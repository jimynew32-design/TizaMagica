import React, { useEffect, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { HorarioConfig } from '../../../types';

interface StepContextoProps {
    data: HorarioConfig;
    onChange: (data: Partial<HorarioConfig>) => void;
}

export const StepContexto: React.FC<StepContextoProps> = ({ data, onChange }) => {
    const [isAutoCalculating, setIsAutoCalculating] = useState(true);
    const [isRecreoMenuOpen, setIsRecreoMenuOpen] = useState(false);
    const recreoMenuRef = useRef<HTMLDivElement>(null);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (recreoMenuRef.current && !recreoMenuRef.current.contains(event.target as Node)) {
                setIsRecreoMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Motor de Cálculo Inteligente para el Fin de Jornada
    useEffect(() => {
        if (!isAutoCalculating) return;

        const calculateFinJornada = () => {
            const [hours, minutes] = data.inicioJornada.split(':').map(Number);
            const totalMinRecreos = (data.distribucionRecreos || []).reduce((acc, curr) => acc + curr, 0);
            const totalMinutes = (data.bloquesPorDia * data.duracionBloque) + totalMinRecreos;
            
            const date = new Date();
            date.setHours(hours);
            date.setMinutes(minutes + totalMinutes);

            const result = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            if (result !== data.finJornada) {
                onChange({ finJornada: result });
            }
        };

        calculateFinJornada();
    }, [data.inicioJornada, data.bloquesPorDia, data.duracionBloque, data.cantidadRecreos, data.distribucionRecreos, isAutoCalculating, data.finJornada, onChange]);

    // Función pura para obtener la plantilla de configuración
    const getTemplateValues = useCallback((nivel: string, modalidad: string) => {
        if (nivel === 'Secundaria') {
            if (modalidad === 'JEC') {
                return {
                    inicioJornada: '07:30',
                    duracionBloque: 45,
                    bloquesPorDia: 9,
                    cantidadRecreos: 2,
                    distribucionRecreos: [20, 20]
                };
            }
            return {
                inicioJornada: '08:00',
                duracionBloque: 45,
                bloquesPorDia: 7,
                cantidadRecreos: 1,
                distribucionRecreos: [30]
            };
        } else if (nivel === 'Primaria') {
            return {
                inicioJornada: '08:00',
                duracionBloque: 45,
                bloquesPorDia: 6,
                cantidadRecreos: 1,
                distribucionRecreos: [30]
            };
        } else if (nivel === 'Inicial') {
            return {
                inicioJornada: '08:30',
                duracionBloque: 30,
                bloquesPorDia: 5,
                cantidadRecreos: 1,
                distribucionRecreos: [30]
            };
        }
        return {};
    }, []);

    const handleNivelChange = (n: string) => {
        setIsAutoCalculating(true);
        const template = getTemplateValues(n, data.modalidad);
        onChange({ 
            nivel: n as any,
            ...template,
            diasLaborables: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
        });
    };

    const handleModalidadChange = (m: string) => {
        setIsAutoCalculating(true);
        const template = getTemplateValues(data.nivel, m);
        onChange({ 
            modalidad: m as any,
            ...template
        });
    };

    const handleRecreoMinChange = (index: number, minutes: number) => {
        const newDistribucion = [...(data.distribucionRecreos || [])];
        newDistribucion[index] = minutes;
        onChange({ distribucionRecreos: newDistribucion });
    };

    const handleCantidadRecreosChange = (num: number) => {
        const currentDistribucion = data.distribucionRecreos || [];
        let newDistribucion = [...currentDistribucion];
        
        if (num > currentDistribucion.length) {
            // Añadir nuevos recreos con duración por defecto (15 min)
            const diff = num - currentDistribucion.length;
            for (let i = 0; i < diff; i++) {
                newDistribucion.push(15);
            }
        } else {
            // Recortar recreos
            newDistribucion = newDistribucion.slice(0, num);
        }

        onChange({ 
            cantidadRecreos: num,
            distribucionRecreos: newDistribucion 
        });
        setIsRecreoMenuOpen(false);
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <header className="text-center space-y-2">
                <h3 className="text-3xl font-black uppercase tracking-tighter">Configura el Lienzo Escolar</h3>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-[6px]">Define las bases de tu Institución Educativa</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Header Institucional (Nombre y Ciclo) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:col-span-2">
                    <div className="md:col-span-8 space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[4px] text-brand-magenta flex items-center gap-2">
                            <span className="material-icons-round text-sm">school</span>
                            Nombre de la Institución
                        </label>
                        <input 
                            type="text"
                            value={data.nombreIE}
                            onChange={(e) => onChange({ nombreIE: e.target.value })}
                            placeholder="Ej: Colegio Emblemático..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:border-brand-magenta outline-none transition-all font-black text-xl placeholder:text-white/10 shadow-inner"
                        />
                    </div>
                    <div className="md:col-span-4 space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[4px] text-brand-magenta flex items-center gap-2">
                            <span className="material-icons-round text-sm">calendar_today</span>
                            Ciclo Escolar
                        </label>
                        <input 
                            type="text"
                            value={data.cicloEscolar || '2025/2026'}
                            onChange={(e) => onChange({ cicloEscolar: e.target.value })}
                            placeholder="Ej: 2025/2026"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-center focus:border-brand-magenta outline-none transition-all font-black text-xl shadow-inner"
                        />
                    </div>
                </div>

                {/* Niveles, Modalidad y Días Laborables */}
                <div className="space-y-6 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[4px] text-brand-magenta">Nivel Educativo</label>
                        <div className="grid grid-cols-1 gap-2">
                            {['Inicial', 'Primaria', 'Secundaria'].map((n) => (
                                <button
                                    key={n}
                                    onClick={() => handleNivelChange(n)}
                                    className={cn(
                                        "p-4 rounded-xl border font-black uppercase text-[10px] tracking-widest transition-all",
                                        data.nivel === n ? "bg-brand-magenta border-brand-magenta text-white shadow-glow-magenta" : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                                    )}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={cn("space-y-4 transition-all duration-500", data.nivel !== 'Secundaria' && "opacity-20 pointer-events-none grayscale")}>
                        <label className="text-[10px] font-black uppercase tracking-[4px] text-brand-magenta">Modalidad</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['JER', 'JEC'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => handleModalidadChange(m)}
                                    className={cn(
                                        "p-4 rounded-xl border font-black uppercase text-[10px] tracking-widest transition-all",
                                        data.modalidad === m ? "bg-brand-magenta border-brand-magenta text-white shadow-glow-magenta" : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                                    )}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                        {data.nivel === 'Secundaria' && (
                            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-relaxed mt-4">
                                * JEC incluye jornada completa con 9 bloques.
                            </p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[4px] text-brand-magenta flex justify-between items-center">
                            Días Laborables
                            <span className="text-white/20 text-[8px]">{data.diasLaborables.length} Días</span>
                        </label>
                        <div className="grid grid-cols-7 gap-1">
                            {(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const).map((d) => {
                                const isSelected = data.diasLaborables.includes(d);
                                return (
                                    <button
                                        key={d}
                                        onClick={() => {
                                            const newDays = isSelected 
                                                ? data.diasLaborables.filter(item => item !== d)
                                                : [...data.diasLaborables, d];
                                            onChange({ diasLaborables: newDays });
                                        }}
                                        className={cn(
                                            "h-12 rounded-lg border text-[9px] font-black uppercase transition-all flex items-center justify-center",
                                            isSelected 
                                                ? "bg-white text-black border-white shadow-glow-white-xs" 
                                                : "bg-white/5 border-white/5 text-white/20 hover:bg-white/10"
                                        )}
                                        title={d}
                                    >
                                        {d[0]}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-relaxed mt-2">
                             Perfecto para colegios EBA o programas de fin de semana.
                        </p>
                    </div>
                </div>

                {/* Dashboard de Tiempo Maestro - REDISEÑADO PARA MULTIRECREO DURACIONES VARIABLES */}
                <div className="p-10 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] md:col-span-2 grid grid-cols-1 md:grid-cols-12 gap-8 relative group">
                    
                    {/* Inicio (2 cols) */}
                    <div className="md:col-span-2 space-y-3">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[3px] flex items-center gap-2">
                            <span className="material-icons-round text-xs">login</span>
                            Inicio
                        </p>
                        <input 
                            type="time" 
                            value={data.inicioJornada}
                            onChange={(e) => onChange({ inicioJornada: e.target.value })}
                            className="bg-transparent text-3xl font-black text-white outline-none focus:text-brand-magenta transition-colors w-full"
                        />
                    </div>

                    {/* Selector de Cantidad (2 cols) */}
                    <div className="md:col-span-2 space-y-3 relative" ref={recreoMenuRef}>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[3px] flex items-center gap-2">
                            <span className="material-icons-round text-xs">reorder</span>
                            Recreos
                        </p>
                        <div className="relative">
                            <button 
                                onClick={() => setIsRecreoMenuOpen(!isRecreoMenuOpen)}
                                className="flex items-center gap-2 text-3xl font-black text-white hover:text-brand-magenta transition-colors outline-none group/btn"
                            >
                                {data.cantidadRecreos}
                                <motion.span 
                                    animate={{ rotate: isRecreoMenuOpen ? 180 : 0 }}
                                    className="material-icons-round text-xl text-brand-magenta"
                                >
                                    expand_more
                                </motion.span>
                            </button>

                            <AnimatePresence>
                                {isRecreoMenuOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full left-0 mt-4 bg-[#111] border border-brand-magenta/30 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,1)] z-[101] min-w-[100px] backdrop-blur-xl"
                                    >
                                        {[0, 1, 2, 3, 4, 5].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => handleCantidadRecreosChange(num)}
                                                className={cn(
                                                    "w-full px-4 py-3 rounded-xl text-xl font-black transition-all text-left flex items-center justify-between",
                                                    data.cantidadRecreos === num 
                                                        ? "bg-brand-magenta text-white shadow-glow-magenta" 
                                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Distribución de Tiempos (4 cols) */}
                    <div className="md:col-span-4 space-y-3">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[3px] flex items-center gap-2">
                            <span className="material-icons-round text-xs">tune</span>
                            Minutos por Recreo
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {(!data.distribucionRecreos || data.distribucionRecreos.length === 0) ? (
                                <span className="text-white/10 font-black uppercase text-[10px] tracking-widest pt-2">Sin descansos</span>
                            ) : (
                                (data.distribucionRecreos || []).map((min, idx) => (
                                    <div key={idx} className="flex items-center gap-1 group/item">
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                value={min}
                                                onChange={(e) => handleRecreoMinChange(idx, Number(e.target.value))}
                                                className="bg-white/5 border border-white/10 rounded-lg w-14 p-2 text-center font-black text-white focus:border-brand-magenta outline-none transition-all"
                                            />
                                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] font-black text-brand-magenta bg-black px-1 rounded uppercase">R{idx+1}</span>
                                        </div>
                                        {idx < data.cantidadRecreos - 1 && <span className="text-white/10">+</span>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Salida (2 cols) */}
                    <div className="md:col-span-2 space-y-3">
                        <p className="text-[10px] font-black text-brand-magenta uppercase tracking-[3px] flex items-center gap-2">
                            <span className="material-icons-round text-xs">logout</span>
                            Salida
                        </p>
                        <div className="flex flex-col">
                            <input 
                                type="time" 
                                value={data.finJornada}
                                onChange={(e) => {
                                    setIsAutoCalculating(false);
                                    onChange({ finJornada: e.target.value });
                                }}
                                className={cn(
                                    "bg-transparent text-3xl font-black outline-none transition-all w-full",
                                    isAutoCalculating ? "text-brand-magenta shadow-glow-magenta-text" : "text-white"
                                )}
                            />
                            {isAutoCalculating && (
                                <span className="text-[8px] font-black text-brand-magenta/40 uppercase tracking-widest mt-1">IA Sync</span>
                            )}
                        </div>
                    </div>

                    {/* Bloques y Duración (Selector Pro) */}
                    <div className="md:col-span-2 flex flex-col justify-center border-l border-white/5 pl-6 space-y-3">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">Bloques</p>
                            <input 
                                type="number" 
                                value={data.bloquesPorDia}
                                onChange={(e) => onChange({ bloquesPorDia: Number(e.target.value) })}
                                className="bg-transparent text-3xl font-black text-white outline-none w-full focus:text-brand-magenta transition-colors"
                            />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-brand-magenta uppercase tracking-widest leading-none">Minutos</p>
                            <div className="flex items-center gap-2 group/min">
                                <input 
                                    type="number" 
                                    value={data.duracionBloque}
                                    onChange={(e) => onChange({ duracionBloque: Number(e.target.value) })}
                                    className="bg-white/5 border border-white/10 rounded-lg w-16 p-2 text-center font-black text-white focus:border-brand-magenta outline-none transition-all text-xl"
                                />
                                <span className="text-[10px] font-black text-white/20">min</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selector Multi-Semana (Estilo aSc avanzado) */}
            <div 
                onClick={() => onChange({ isMultiSemana: !data.isMultiSemana })}
                className={cn(
                    "p-8 rounded-[2.5rem] border transition-all cursor-pointer flex items-center gap-8 group relative overflow-hidden",
                    data.isMultiSemana 
                        ? "bg-indigo-500/10 border-indigo-500 shadow-glow-indigo-sm" 
                        : "bg-white/[0.02] border-white/5 hover:border-white/10"
                )}
            >
                <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
                    data.isMultiSemana ? "bg-indigo-500 text-white shadow-glow-indigo" : "bg-white/5 text-white/20"
                )}>
                    <span className="material-icons-round text-3xl">event_repeat</span>
                </div>
                <div className="flex-1 space-y-1">
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">Configuración Multi-Semana (Semana A/B)</h4>
                    <p className="text-[10px] text-white/40 font-bold uppercase leading-relaxed max-w-2xl">
                        Activa esta opción si tu institución utiliza horarios rotativos o diferentes para semanas pares/impares. Ideal para optimizar recursos compartidos.
                    </p>
                </div>
                <div className={cn(
                    "w-12 h-6 rounded-full relative transition-colors border",
                    data.isMultiSemana ? "bg-indigo-500 border-indigo-400" : "bg-white/10 border-white/10"
                )}>
                    <motion.div 
                        initial={false}
                        animate={{ x: data.isMultiSemana ? 24 : 4 }}
                        className="w-4 h-4 bg-white rounded-full absolute top-1/2 -translate-y-1/2"
                    />
                </div>
            </div>

            {/* Hint de Inteligencia */}
            <AnimatePresence>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-6 p-8 bg-brand-magenta/5 border border-brand-magenta/20 rounded-[2.5rem] shadow-2xl"
                >
                    <div className="p-3 bg-brand-magenta/20 rounded-2xl shrink-0">
                        <span className="material-icons-round text-brand-magenta text-3xl">auto_awesome</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-brand-magenta uppercase tracking-[4px]">Cálculo Progresivo de Descansos</p>
                        <p className="text-xs font-medium text-white/60 leading-relaxed uppercase tracking-wider">
                            He sumado tus recreos: {data.distribucionRecreos.map((m, i) => <span key={i} className="text-white font-black">{m}m{i < data.distribucionRecreos.length - 1 ? ' + ' : ''}</span>)}. 
                            Totalizando <strong className="text-brand-magenta font-black">{(data.distribucionRecreos || []).reduce((a, b) => a + b, 0)} min</strong> de descanso. 
                            Salida estimada: <strong className="text-white font-black">{data.finJornada}</strong>.
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

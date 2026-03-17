import React from 'react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import { HorarioConfig } from '../../../types';

interface StepConfigInteligenteProps {
    data: HorarioConfig;
    onChange: (val: Partial<HorarioConfig>) => void;
}

export const StepConfigInteligente: React.FC<StepConfigInteligenteProps> = ({ data, onChange }) => {
    const questions = [
        {
            id: 'dobleTurno',
            title: '¿Su institución opera en Doble Turno?',
            description: 'Mañana y Tarde. Active esto si necesita que la IA gestione el cruce de docentes que trabajan en ambas jornadas o si hay aulas compartidas.',
            icon: 'wb_twilight',
            color: 'from-orange-500 to-amber-500'
        },
        {
            id: 'evitarHuecosDocentes',
            title: '¿Desea optimizar y limitar las "Horas Libres"?',
            description: 'La IA intentará compactar el horario de los docentes para evitar huecos innecesarios entre clases, mejorando la satisfacción del docente.',
            icon: 'timer',
            color: 'from-emerald-500 to-teal-500'
        },
        {
            id: 'consistenciaAlumnos',
            title: '¿Priorizar Rutina Fija para Alumnos?',
            description: 'Intenta colocar la misma asignatura en los mismos periodos cada día (ej: Matemática siempre a la 1ra hora). Crea hábitos de estudio.',
            icon: 'auto_stories',
            color: 'from-blue-500 to-indigo-500'
        }
    ];

    return (
        <div className="space-y-12 animate-fade-in max-w-4xl mx-auto py-8">
            <header className="text-center space-y-4">
                <div className="inline-flex p-3 bg-brand-magenta/10 rounded-2xl border border-brand-magenta/20 mb-4">
                    <span className="material-icons-round text-brand-magenta text-3xl">psychology</span>
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter">Asistente de Inteligencia</h2>
                <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] max-w-md mx-auto leading-relaxed">
                    Personalice el comportamiento del algoritmo para que se adapte perfectamente a la cultura de su centro educativo.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {questions.map((q, idx) => {
                    const isSelected = !!(data as any)[q.id];
                    
                    return (
                        <motion.div
                            key={q.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => onChange({ [q.id]: !isSelected })}
                            className={cn(
                                "group relative overflow-hidden p-8 rounded-[2.5rem] border transition-all cursor-pointer flex items-center gap-8",
                                isSelected 
                                    ? "bg-white/[0.03] border-brand-magenta shadow-glow-magenta-xs" 
                                    : "bg-white/[0.01] border-white/5 hover:border-white/10"
                            )}
                        >
                            {/* Icono con Gradiente */}
                             <div className={cn(
                                "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-700 shadow-2xl relative",
                                isSelected ? `bg-black/40 border border-white/10 scale-110` : "bg-white/5 grayscale"
                            )}>
                                {isSelected && (
                                    <div className={cn("absolute inset-0 rounded-3xl bg-gradient-to-br opacity-20 blur-xl", q.color)} />
                                )}
                                <span className={cn(
                                    "material-icons-round text-3xl transition-all duration-500 relative z-10",
                                    isSelected ? "text-white" : "text-white/20"
                                )}>
                                    {q.icon}
                                </span>
                            </div>

                            {/* Contenido */}
                            <div className="flex-1 space-y-2 text-left">
                                <h3 className={cn(
                                    "text-lg font-black uppercase tracking-widest transition-colors",
                                    isSelected ? "text-white" : "text-white/40"
                                )}>
                                    {q.title}
                                </h3>
                                <p className="text-xs text-white/20 font-bold leading-relaxed max-w-xl group-hover:text-white/40 transition-colors">
                                    {q.description}
                                </p>
                            </div>

                            {/* Check Visual Estilo Luxe */}
                            <div className={cn(
                                "w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-700",
                                isSelected 
                                    ? "bg-brand-magenta border-brand-magenta shadow-glow-magenta rotate-0 scale-100" 
                                    : "border-white/10 rotate-90 scale-75 bg-white/5"
                            )}>
                                <span className={cn(
                                    "material-icons-round text-white font-black transition-opacity duration-500",
                                    isSelected ? "opacity-100" : "opacity-0"
                                )}>done</span>
                            </div>

                            {/* Background Ambient Glow */}
                            {isSelected && (
                                <motion.div 
                                    layoutId="ambient-glow"
                                    className={cn("absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br opacity-10 blur-[80px] -z-10", q.color)}
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <div className="p-8 bg-brand-magenta/[0.03] border border-brand-magenta/10 rounded-[2.5rem] flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-brand-magenta/20 flex items-center justify-center shrink-0">
                    <span className="material-icons-round text-brand-magenta">auto_awesome</span>
                </div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                    Basado en sus respuestas, la IA priorizará estos criterios durante la generación del horario para garantizar una <span className="text-brand-magenta">Salud Pedagógica</span> del 100%.
                </p>
            </div>
        </div>
    );
};

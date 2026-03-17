import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import { Restriccion, DiaSemana, Docente } from '../../../types';

interface StepReglasProps {
    diasLaborables: DiaSemana[];
    bloquesPorDia: number;
    docentes: Docente[];
    restricciones: Restriccion[];
    onChange: (restricciones: Restriccion[]) => void;
}

export const StepReglas: React.FC<StepReglasProps> = ({ 
    diasLaborables, 
    bloquesPorDia, 
    docentes, 
    restricciones, 
    onChange 
}) => {
    const [mode, setMode] = useState<'zona_nula' | 'docente_no_disponible' | 'pedagogica'>('zona_nula');
    const [selectedDocenteId, setSelectedDocenteId] = useState<string>(docentes[0]?.id || '');

    // OPTIMIZACIÓN: Indexar restricciones por clave única dia-bloque-tipo-target
    const indexedRestricciones = useMemo(() => {
        const map = new Map<string, string>();
        restricciones.forEach(r => {
            let key = '';
            if (r.tipo === 'zona_nula') {
                key = `zona_nula-${r.dia}-${r.bloqueIndex}`;
            } else if (r.tipo === 'docente_no_disponible') {
                key = `docente-${r.docenteId}-${r.dia}-${r.bloqueIndex}`;
            }
            if (key) map.set(key, r.id);
        });
        return map;
    }, [restricciones]);

    const toggleRestriccion = (dia: DiaSemana, bloqueIndex: number) => {
        const key = mode === 'zona_nula' 
            ? `zona_nula-${dia}-${bloqueIndex}`
            : `docente-${selectedDocenteId}-${dia}-${bloqueIndex}`;
        
        const existingId = indexedRestricciones.get(key);

        if (existingId) {
            onChange(restricciones.filter(r => r.id !== existingId));
        } else {
            const newRestriccion: Restriccion = mode === 'zona_nula' 
                ? { id: crypto.randomUUID(), tipo: 'zona_nula', dia, bloqueIndex }
                : { id: crypto.randomUUID(), tipo: 'docente_no_disponible', docenteId: selectedDocenteId, dia, bloqueIndex };
            
            onChange([...restricciones, newRestriccion]);
        }
    };

    const isRestringido = (dia: DiaSemana, bloqueIndex: number) => {
        const key = mode === 'zona_nula' 
            ? `zona_nula-${dia}-${bloqueIndex}`
            : `docente-${selectedDocenteId}-${dia}-${bloqueIndex}`;
        return indexedRestricciones.has(key);
    };

    const toggleGlobalRule = (tipo: 'no_doble_materia_dia' | 'max_horas_seguidas', value?: any) => {
        const exists = restricciones.find(r => r.tipo === tipo);
        if (exists) {
            onChange(restricciones.filter(r => r.tipo !== tipo));
        } else {
            const newRule: any = { id: crypto.randomUUID(), tipo };
            if (tipo === 'max_horas_seguidas') newRule.valor = value || 3;
            onChange([...restricciones, newRule]);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <header className="text-center space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Reglas del Juego</h3>
                <p className="text-xs text-white/40 uppercase font-bold tracking-widest">Configura las restricciones inteligentes para el generador</p>
            </header>

            {/* Selector de Modo */}
            <div className="flex justify-center gap-4">
                {(['zona_nula', 'docente_no_disponible', 'pedagogica'] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={cn(
                            "px-8 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3",
                            mode === m 
                                ? "bg-white text-black border-white shadow-glow-white-sm" 
                                : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                        )}
                    >
                        <span className="material-icons-round text-sm">
                            {m === 'zona_nula' ? 'block' : m === 'docente_no_disponible' ? 'person_off' : 'psychology'}
                        </span>
                        {m === 'zona_nula' ? 'Recesos' : m === 'docente_no_disponible' ? 'Disponibilidad' : 'Salud Pedagógica'}
                    </button>
                ))}
            </div>

            {/* Sub-controles dinámicos */}
            <div className="min-h-[400px]">
                {mode === 'pedagogica' ? (
                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
                        {/* Regla: Horas Seguidas */}
                        <div className={cn(
                            "p-8 rounded-[2rem] border transition-all cursor-pointer group",
                            restricciones.some(r => r.tipo === 'max_horas_seguidas') 
                                ? "bg-brand-magenta/10 border-brand-magenta" 
                                : "bg-white/5 border-white/5 hover:border-white/20"
                        )} onClick={() => toggleGlobalRule('max_horas_seguidas', 3)}>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-brand-magenta/20 flex items-center justify-center text-brand-magenta">
                                    <span className="material-icons-round">timer</span>
                                </div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-white">Máximo Horas Seguidas</h4>
                            </div>
                            <p className="text-[10px] text-white/40 font-bold uppercase leading-relaxed mb-6">
                                Evita que un docente dicte más de 3 horas seguidas para reducir la fatiga.
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-brand-magenta uppercase">Recomendado: 3H</span>
                                <div className={cn(
                                    "w-10 h-5 rounded-full relative transition-colors",
                                    restricciones.some(r => r.tipo === 'max_horas_seguidas') ? "bg-brand-magenta" : "bg-white/10"
                                )}>
                                    <div className={cn(
                                        "w-3 h-3 bg-white rounded-full absolute top-1 transition-all",
                                        restricciones.some(r => r.tipo === 'max_horas_seguidas') ? "left-6" : "left-1"
                                    )} />
                                </div>
                            </div>
                        </div>

                        {/* Regla: No doble materia */}
                        <div className={cn(
                            "p-8 rounded-[2rem] border transition-all cursor-pointer group",
                            restricciones.some(r => r.tipo === 'no_doble_materia_dia') 
                                ? "bg-indigo-500/10 border-indigo-500/40" 
                                : "bg-white/5 border-white/5 hover:border-white/20"
                        )} onClick={() => toggleGlobalRule('no_doble_materia_dia')}>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <span className="material-icons-round">calendar_view_day</span>
                                </div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-white">Equidad Diaria</h4>
                            </div>
                            <p className="text-[10px] text-white/40 font-bold uppercase leading-relaxed mb-6">
                                Intenta que una misma materia no se repita en turnos distintos el mismo día.
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-400 uppercase">Estilo aSc Pattern</span>
                                <div className={cn(
                                    "w-10 h-5 rounded-full relative transition-colors",
                                    restricciones.some(r => r.tipo === 'no_doble_materia_dia') ? "bg-indigo-500" : "bg-white/10"
                                )}>
                                    <div className={cn(
                                        "w-3 h-3 bg-white rounded-full absolute top-1 transition-all",
                                        restricciones.some(r => r.tipo === 'no_doble_materia_dia') ? "left-6" : "left-1"
                                    )} />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {mode === 'docente_no_disponible' && (
                            <div className="flex justify-center gap-2 overflow-x-auto pb-4 no-scrollbar max-w-4xl mx-auto px-4">
                                {docentes.map(doc => (
                                    <button
                                        key={doc.id}
                                        onClick={() => setSelectedDocenteId(doc.id)}
                                        className={cn(
                                            "px-6 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2",
                                            selectedDocenteId === doc.id 
                                                ? "bg-white text-black border-white shadow-glow-white-sm" 
                                                : "bg-white/5 border-white/5 text-white/20 hover:border-white/20"
                                        )}
                                    >
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: doc.color || '#fff' }} />
                                        {doc.nombre}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 overflow-x-auto shadow-inner">
                            <div className="min-w-[900px] space-y-6">
                                <div className="grid grid-cols-7 gap-6">
                                    <div />
                                    {diasLaborables.map(dia => (
                                        <div key={dia} className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                                            {dia}
                                        </div>
                                    ))}
                                </div>

                                {Array.from({ length: bloquesPorDia }).map((_, bIdx) => (
                                    <div key={bIdx} className="grid grid-cols-7 gap-6 group/row">
                                        <div className="flex items-center justify-end pr-4 text-[10px] font-black text-white/10 uppercase tracking-widest group-hover/row:text-white/40 transition-colors">
                                            Bloque {bIdx + 1}
                                        </div>
                                        {diasLaborables.map(dia => {
                                            const active = isRestringido(dia, bIdx);
                                            const docColor = mode === 'docente_no_disponible' 
                                                ? docentes.find(d => d.id === selectedDocenteId)?.color 
                                                : null;

                                            return (
                                                <button
                                                    key={dia}
                                                    onClick={() => toggleRestriccion(dia, bIdx)}
                                                    className={cn(
                                                        "h-20 rounded-[1.5rem] border-2 transition-all duration-300 flex items-center justify-center relative overflow-hidden group/cell",
                                                        active 
                                                            ? "shadow-2xl z-10 scale-105" 
                                                            : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                                    )}
                                                    style={{ 
                                                        borderColor: active ? (docColor || '#d946ef') : undefined,
                                                        backgroundColor: active ? `${docColor || '#d946ef'}15` : undefined
                                                    }}
                                                >
                                                    {active && (
                                                        <motion.div 
                                                            initial={{ scale: 0, rotate: -20 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            className="flex flex-col items-center"
                                                        >
                                                            <span className="material-icons-round text-2xl" style={{ color: docColor || '#d946ef' }}>
                                                                {mode === 'zona_nula' ? 'block' : 'person_off'}
                                                            </span>
                                                            <span className="text-[7px] font-black uppercase tracking-tighter mt-1" style={{ color: docColor || '#d946ef' }}>
                                                                {mode === 'zona_nula' ? 'RECESO' : 'OCUPADO'}
                                                            </span>
                                                        </motion.div>
                                                    )}
                                                    {!active && (
                                                        <span className="material-icons-round text-white/5 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                                            add_circle
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-[.3em] text-white/10">
                <span className="material-icons-round text-sm">tips_and_updates</span>
                Define las reglas para que la IA genere el horario perfecto sin choques.
            </div>
        </div>
    );
};

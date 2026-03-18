import React, { useState } from 'react';
import { cn } from '@/lib/cn';
import { Docente, Seccion, CargaAcademica, Materia, Aula } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface StepMapeoProps {
    recursos: {
        docentes: Docente[];
        secciones: Seccion[];
        materias: Materia[];
        aulas: Aula[];
    };
    nivelIE: 'Inicial' | 'Primaria' | 'Secundaria';
    carga: CargaAcademica[];
    onChange: (carga: CargaAcademica[]) => void;
}

export const StepMapeo: React.FC<StepMapeoProps> = ({ recursos, carga, onChange }) => {
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
    const [selectedSeccionId, setSelectedSeccionId] = useState<string>((recursos.secciones || [])[0]?.id || '');
    const [selectedDocenteId, setSelectedDocenteId] = useState<string>('');
    const [editingLesson, setEditingLesson] = useState<Partial<CargaAcademica> | null>(null);
    const [showAulaSelector, setShowAulaSelector] = useState(false);

    const handleAddLesson = () => {
        setEditingLesson({
            id: crypto.randomUUID(),
            docenteId: selectedDocenteId || (recursos.docentes[0]?.id || ''),
            seccionId: selectedSeccionId,
            materiaNombre: '',
            horasSemanales: 2,
            split: [2],
            periodo: 'Anual'
        });
    };

    const handleSaveLesson = () => {
        if (!editingLesson?.docenteId || !editingLesson?.materiaNombre || !editingLesson?.seccionId) return;

        const newCarga = [...carga];
        const index = newCarga.findIndex(c => c.id === editingLesson.id);

        if (index >= 0) {
            newCarga[index] = editingLesson as CargaAcademica;
        } else {
            newCarga.push(editingLesson as CargaAcademica);
        }

        onChange(newCarga);
        setEditingLesson(null);
    };

    const handleDeleteLesson = (id: string) => {
        onChange(carga.filter(c => c.id !== id));
    };

    const getHorasDocente = (docenteId: string) => {
        return carga.filter(c => c.docenteId === docenteId).reduce((acc, curr) => acc + curr.horasSemanales, 0);
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Carga Académica</h3>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-[0.3em]">Distribución Estratégica de Horas y Contratos</p>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Selectores de Vista */}
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button 
                            onClick={() => setViewMode('table')}
                            className={cn("px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2", viewMode === 'table' ? "bg-white text-black shadow-glow-white-sm" : "text-white/40 hover:text-white")}
                        >
                            <span className="material-icons-round text-sm">format_list_bulleted</span>
                            Lista
                        </button>
                        <button 
                            onClick={() => setViewMode('cards')}
                            className={cn("px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2", viewMode === 'cards' ? "bg-brand-magenta text-white shadow-glow-magenta-xs" : "text-white/40 hover:text-white")}
                        >
                            <span className="material-icons-round text-sm">grid_view</span>
                            Tarjetas
                        </button>
                    </div>

                    {/* Botón Acción Principal: Nueva Lección */}
                    <button 
                        onClick={handleAddLesson}
                        className="px-8 py-3.5 bg-brand-magenta text-white rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:shadow-glow-magenta active:scale-95 transition-all flex items-center justify-center gap-3 group"
                    >
                        <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
                            <span className="material-icons-round text-base">add</span>
                        </div>
                        Nueva Lección
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[700px]">
                {/* Panel Izquierdo: Selección */}
                <div className="lg:col-span-1 space-y-6 flex flex-col h-full bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6">
                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-magenta px-2">Filtrar por Sección</label>
                        <div className="grid grid-cols-2 gap-2">
                            {recursos.secciones.map(sec => (
                                <button
                                    key={sec.id}
                                    onClick={() => { setSelectedSeccionId(sec.id); setSelectedDocenteId(''); }}
                                    className={cn(
                                        "px-4 py-3 rounded-xl border text-[10px] font-bold uppercase transition-all text-left truncate",
                                        selectedSeccionId === sec.id ? "bg-brand-magenta/10 border-brand-magenta text-brand-magenta" : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                                    )}
                                >
                                    {sec.grado}{sec.letra} {sec.nombre && <span className="opacity-40 text-[8px]">({sec.nombre})</span>}
                                </button>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-white/5" />
                        
                        <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 px-2">Filtrar por Docente</label>
                        <div className="space-y-2">
                            {recursos.docentes.map(doc => (
                                <button
                                    key={doc.id}
                                    onClick={() => { setSelectedDocenteId(doc.id); setSelectedSeccionId(''); }}
                                    className={cn(
                                        "w-full px-4 py-3 rounded-xl border text-[10px] font-bold uppercase transition-all text-left flex items-center gap-3",
                                        selectedDocenteId === doc.id ? "bg-blue-500/10 border-blue-500/40 text-blue-400" : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                                    )}
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: doc.color || '#fff' }} />
                                    <span className="truncate">{doc.apellido} {doc.nombre}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Panel Derecho: Contenido */}
                <div className="lg:col-span-3 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 overflow-y-auto no-scrollbar relative">
                    <AnimatePresence mode="wait">
                        {viewMode === 'table' ? (
                            <motion.div 
                                key="table"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <table className="w-full border-separate border-spacing-y-3">
                                    <thead>
                                        <tr className="text-[9px] font-black uppercase text-white/20 tracking-tighter">
                                            <th className="px-6 text-left">Asignatura</th>
                                            <th className="px-6 text-left">Docente</th>
                                            <th className="px-6 text-left">Sección/Clase</th>
                                            <th className="px-6 text-center">Cant. Horas</th>
                                            <th className="px-6 text-center">Sesiones</th>
                                            <th className="px-6 text-left">Aula</th>
                                            <th className="px-6 text-right w-20">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {carga.filter(c => 
                                            (selectedSeccionId ? c.seccionId === selectedSeccionId : true) &&
                                            (selectedDocenteId ? c.docenteId === selectedDocenteId : true)
                                        ).map(lesson => {
                                            const doc = recursos.docentes.find(d => d.id === lesson.docenteId);
                                            const sec = recursos.secciones.find(s => s.id === lesson.seccionId);
                                            const aula = recursos.aulas.find(a => a.id === lesson.aulaId);
                                            
                                            return (
                                                <tr key={lesson.id} className="group/row bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.06] transition-colors">
                                                    <td className="px-6 py-4 rounded-l-2xl">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-brand-magenta/10 flex items-center justify-center">
                                                                <span className="material-icons-round text-brand-magenta text-sm">school</span>
                                                            </div>
                                                            <span className="text-xs font-black uppercase text-white tracking-widest">{lesson.materiaNombre}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: doc?.color || '#333' }} />
                                                            <span className="text-[10px] font-bold text-white/80 uppercase">{doc?.apellido || 'S/A'} {doc?.nombre}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-black text-white/40 uppercase">{sec?.grado}{sec?.letra} {sec?.nombre ? `(${sec.nombre})` : ''}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-black text-brand-magenta">{lesson.horasSemanales}H</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center gap-1">
                                                            {lesson.split.map((h, i) => (
                                                                <span key={i} className="w-5 h-5 flex items-center justify-center rounded bg-white/5 border border-white/10 text-[8px] font-black text-white/40">{h}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {aula ? (
                                                            <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">{aula.abreviatura || aula.nombre}</span>
                                                        ) : (
                                                            <span className="text-[8px] font-black text-white/10 uppercase italic">Automático</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right rounded-r-2xl">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => setEditingLesson(lesson)}
                                                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
                                                            >
                                                                <span className="material-icons-round text-base">edit</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteLesson(lesson.id)}
                                                                className="w-8 h-8 rounded-full hover:bg-red-500/20 flex items-center justify-center text-white/40 hover:text-red-400 transition-all"
                                                            >
                                                                <span className="material-icons-round text-base">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {carga.filter(c => 
                                            (selectedSeccionId ? c.seccionId === selectedSeccionId : true) &&
                                            (selectedDocenteId ? c.docenteId === selectedDocenteId : true)
                                        ).length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="py-20 text-center">
                                                    <div className="flex flex-col items-center gap-4 opacity-20">
                                                        <span className="material-icons-round text-5xl">inventory_2</span>
                                                        <p className="text-[10px] font-black uppercase tracking-[4px]">Sin contratos definidos para esta vista</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="cards"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {/* Similar logic to cards view if desired, or focus on table for this pro update */}
                                <p className="col-span-2 text-center text-white/20 uppercase text-[10px] font-black tracking-widest pt-20">Seleccione Vista Tabla para gestión avanzada</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modal de Edición Estilo Screenshots */}
            <AnimatePresence>
                {editingLesson && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-[600px] bg-[#111] border border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-8"
                        >
                            <header className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[2rem] bg-brand-magenta/10 flex items-center justify-center border border-brand-magenta/30">
                                    <span className="material-icons-round text-brand-magenta text-3xl">assignment</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-black uppercase tracking-tighter">Detalles de la Lección</h4>
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Contrato Académico v4.0</p>
                                </div>
                                <button onClick={() => setEditingLesson(null)} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-white/20 hover:text-white">
                                    <span className="material-icons-round text-xl">close</span>
                                </button>
                            </header>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Profesor */}
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Docente</label>
                                    <select 
                                        value={editingLesson.docenteId}
                                        onChange={(e) => {
                                            setEditingLesson({ ...editingLesson, docenteId: e.target.value });
                                        }}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-brand-magenta outline-none transition-all"
                                    >
                                        <option value="">-- Seleccionar Docente --</option>
                                        {recursos.docentes.map(d => <option key={d.id} value={d.id}>{d.apellido} {d.nombre}</option>)}
                                    </select>
                                </div>

                                {/* Asignatura (Select or Input) */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Asignatura</label>
                                    <div className="relative">
                                        <input 
                                            value={editingLesson.materiaNombre}
                                            onChange={(e) => setEditingLesson({ ...editingLesson, materiaNombre: e.target.value })}
                                            placeholder="ej: MATEMÁTICA"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-brand-magenta outline-none transition-all pr-12"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                                            {recursos.materias.length > 0 && (
                                                <button className="text-brand-magenta/40 hover:text-brand-magenta transition-colors">
                                                    <span className="material-icons-round text-sm">history_edu</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Clase / Sección */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Sección / Clase</label>
                                    <select 
                                        value={editingLesson.seccionId}
                                        onChange={(e) => setEditingLesson({ ...editingLesson, seccionId: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-brand-magenta outline-none transition-all"
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {recursos.secciones.map(s => <option key={s.id} value={s.id}>{s.grado}{s.letra}</option>)}
                                    </select>
                                </div>

                                {/* Horas y Distribución */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Horas Semanales</label>
                                    <input 
                                        type="number"
                                        value={editingLesson.horasSemanales}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setEditingLesson({ ...editingLesson, horasSemanales: val, split: [Math.floor(val/2), Math.ceil(val/2)].filter(v => v > 0) });
                                        }}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-brand-magenta outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Sesiones/Semana (Split)</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3].map(parts => (
                                            <button 
                                                key={parts}
                                                onClick={() => {
                                                    const h = editingLesson.horasSemanales || 2;
                                                    const newSplit = Array(parts).fill(Math.floor(h/parts));
                                                    for(let i=0; i < h % parts; i++) newSplit[i]++;
                                                    setEditingLesson({ ...editingLesson, split: newSplit });
                                                }}
                                                className={cn(
                                                    "flex-1 py-4 rounded-xl border text-[10px] font-black uppercase transition-all",
                                                    editingLesson.split?.length === parts ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/5 text-white/20 hover:text-white"
                                                )}
                                            >
                                                {parts} Veces
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Aula Específica */}
                                <div className="col-span-2 space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between px-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Aula de la Lección</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input 
                                                    type="checkbox" 
                                                    checked={editingLesson.aulaFija} 
                                                    onChange={(e) => setEditingLesson({ ...editingLesson, aulaFija: e.target.checked })}
                                                    className="w-3 h-3 rounded bg-white/5 border-white/20 checked:bg-brand-magenta transition-all"
                                                />
                                                <span className="text-[8px] font-black uppercase text-white/20 group-hover:text-white transition-colors">Aula Fija</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 min-h-[56px] flex flex-wrap gap-2">
                                                {!editingLesson.aulaId && (!editingLesson.aulaIds || editingLesson.aulaIds.length === 0) && (!editingLesson.aulaRules || editingLesson.aulaRules.length === 0) ? (
                                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest self-center">-- Automático (Sistema elige) --</span>
                                                ) : (
                                                    <>
                                                        {editingLesson.aulaRules?.map(rule => (
                                                            <span key={rule} className="px-2 py-1 rounded bg-brand-magenta/20 border border-brand-magenta/40 text-[8px] font-black text-brand-magenta uppercase">
                                                                {rule === 'aula_fija_docente' ? 'Aula Profesor' : rule === 'aulas_materia' ? 'Aulas Materia' : rule}
                                                            </span>
                                                        ))}
                                                        {editingLesson.aulaIds?.map(aid => {
                                                            const a = recursos.aulas.find(aula => aula.id === aid);
                                                            return (
                                                                <span key={aid} className="px-2 py-1 rounded bg-blue-500/20 border border-blue-500/40 text-[8px] font-black text-blue-400 uppercase">
                                                                    {a?.abreviatura || a?.nombre}
                                                                </span>
                                                            );
                                                        })}
                                                        {editingLesson.aulaId && !editingLesson.aulaIds?.includes(editingLesson.aulaId) && (
                                                            <span className="px-2 py-1 rounded bg-blue-500/20 border border-blue-500/40 text-[8px] font-black text-blue-400 uppercase">
                                                                {recursos.aulas.find(a => a.id === editingLesson.aulaId)?.abreviatura}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => setShowAulaSelector(true)}
                                                className="w-[100px] bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-magenta hover:text-white transition-all shadow-glow-white-sm flex flex-col items-center justify-center gap-1"
                                            >
                                                <span className="material-icons-round text-sm">room</span>
                                                Elección
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button 
                                    onClick={() => setEditingLesson(null)}
                                    className="flex-1 py-4 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-[4px] text-white/40 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSaveLesson}
                                    className="flex-1 py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[4px] hover:bg-brand-magenta hover:text-white transition-all shadow-glow-magenta-sm"
                                >
                                    Guardar Lección
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de Elección de Aulas - Estilo Captura del Usuario */}
            <AnimatePresence>
                {showAulaSelector && editingLesson && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-[800px] bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-3xl"
                        >
                            <header className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand-magenta/20 flex items-center justify-center text-brand-magenta">
                                        <span className="material-icons-round">room</span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-widest text-white">Elección de Aulas</h4>
                                        <p className="text-[9px] font-black text-white/30 uppercase">Asignación Múltiple y Lógica Alternativa</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAulaSelector(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/20">
                                    <span className="material-icons-round text-lg">close</span>
                                </button>
                            </header>

                            <div className="p-8 grid grid-cols-11 gap-4 items-center h-[500px]">
                                {/* Panel Izquierdo: Disponibles */}
                                <div className="col-span-5 flex flex-col h-full space-y-3">
                                    <label className="text-[8px] font-black uppercase text-white/20 tracking-[0.2em] ml-2">Aulas y Reglas Disponibles</label>
                                    <div className="flex-1 bg-black/50 border border-white/5 rounded-2xl overflow-y-auto custom-scrollbar p-2 space-y-1">
                                        {/* Reglas Lógicas */}
                                        <div className="pb-4 mb-4 border-b border-white/5 space-y-1">
                                            {[
                                                { id: 'aula_fija_docente', label: 'Aula fija del profesor', icon: 'person' },
                                                { id: 'aulas_materia', label: 'Aulas de la asignatura', icon: 'auto_stories' },
                                                { id: 'aulas_seccion', label: 'Aula de la sección', icon: 'groups' }
                                            ].map(rule => (
                                                <button
                                                    key={rule.id}
                                                    onClick={() => {
                                                        const current = editingLesson.aulaRules || [];
                                                        if (!current.includes(rule.id)) {
                                                            setEditingLesson({ ...editingLesson, aulaRules: [...current, rule.id] });
                                                        }
                                                    }}
                                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-brand-magenta/10 group transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-icons-round text-sm text-brand-magenta">{rule.icon}</span>
                                                        <span className="text-[10px] font-bold text-white/60 group-hover:text-white">{rule.label}</span>
                                                    </div>
                                                    <span className="material-icons-round text-sm text-white/10 group-hover:translate-x-1 transition-transform">chevron_right</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Listado de Aulas */}
                                        {recursos.aulas.map(aula => (
                                            <button
                                                key={aula.id}
                                                onClick={() => {
                                                    const current = editingLesson.aulaIds || [];
                                                    if (!current.includes(aula.id)) {
                                                        setEditingLesson({ ...editingLesson, aulaIds: [...current, aula.id] });
                                                    }
                                                }}
                                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-500/10 group transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black" style={{ backgroundColor: aula.color + '20', color: aula.color }}>
                                                        {aula.abreviatura?.charAt(0)}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-bold text-white/60 group-hover:text-white leading-none">{aula.nombre}</p>
                                                        <span className="text-[8px] text-white/20 uppercase font-black">{aula.abreviatura}</span>
                                                    </div>
                                                </div>
                                                <span className="material-icons-round text-sm text-white/10 group-hover:translate-x-1 transition-transform">chevron_right</span>
                                            </button>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setEditingLesson({ 
                                                ...editingLesson, 
                                                aulaIds: recursos.aulas.map(a => a.id),
                                                aulaRules: ['aula_fija_docente', 'aulas_materia'] 
                                            });
                                        }}
                                        className="py-2 text-[8px] font-black uppercase text-white/20 hover:text-white transition-colors"
                                    >
                                        Seleccionar Todas
                                    </button>
                                </div>

                                {/* Centro: Flechas decorativas */}
                                <div className="col-span-1 flex flex-col items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                                        <span className="material-icons-round">double_arrow</span>
                                    </div>
                                </div>

                                {/* Panel Derecho: Seleccionados */}
                                <div className="col-span-5 flex flex-col h-full space-y-3">
                                    <label className="text-[8px] font-black uppercase text-brand-magenta tracking-[0.2em] ml-2">Asignación Actual (Elección)</label>
                                    <div className="flex-1 bg-brand-magenta/[0.03] border border-brand-magenta/10 rounded-2xl overflow-y-auto custom-scrollbar p-2 space-y-1">
                                        {editingLesson.aulaRules?.map(rule => (
                                            <div key={rule} className="flex items-center justify-between p-3 rounded-xl bg-brand-magenta/10 border border-brand-magenta/20 group animate-in slide-in-from-right-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-icons-round text-sm text-brand-magenta">check_circle</span>
                                                    <span className="text-[10px] font-black text-white uppercase">{rule.replace(/_/g, ' ')}</span>
                                                </div>
                                                <button 
                                                    onClick={() => setEditingLesson({ ...editingLesson, aulaRules: editingLesson.aulaRules?.filter(r => r !== rule) })}
                                                    className="w-6 h-6 rounded-full hover:bg-black/20 flex items-center justify-center text-red-500/40 hover:text-red-500"
                                                >
                                                    <span className="material-icons-round text-sm">remove_circle</span>
                                                </button>
                                            </div>
                                        ))}
                                        {editingLesson.aulaIds?.map(aid => {
                                            const a = recursos.aulas.find(aula => aula.id === aid);
                                            return (
                                                <div key={aid} className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 group animate-in slide-in-from-right-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-icons-round text-sm text-blue-400">check_circle</span>
                                                        <span className="text-[10px] font-black text-white uppercase">{a?.nombre}</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => setEditingLesson({ ...editingLesson, aulaIds: editingLesson.aulaIds?.filter(id => id !== aid) })}
                                                        className="w-6 h-6 rounded-full hover:bg-black/20 flex items-center justify-center text-red-500/40 hover:text-red-500"
                                                    >
                                                        <span className="material-icons-round text-sm">remove_circle</span>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {(!editingLesson.aulaIds || editingLesson.aulaIds.length === 0) && (!editingLesson.aulaRules || editingLesson.aulaRules.length === 0) && (
                                            <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-2">
                                                <span className="material-icons-round text-4xl">auto_fix_high</span>
                                                <p className="text-[9px] font-black uppercase text-center leading-relaxed">Selección Automática<br/>El algoritmo decidirá</p>
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => setEditingLesson({ ...editingLesson, aulaIds: [], aulaRules: [] })}
                                        className="py-2 text-[8px] font-black uppercase text-red-500/40 hover:text-red-500 transition-colors"
                                    >
                                        Limpiar Todo
                                    </button>
                                </div>
                            </div>

                            <footer className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex justify-end gap-3 font-black">
                                <button 
                                    onClick={() => setShowAulaSelector(false)}
                                    className="px-8 py-3 bg-brand-magenta text-white rounded-xl text-[10px] uppercase tracking-widest hover:shadow-glow-magenta transition-all"
                                >
                                    Confirmar Elección
                                </button>
                            </footer>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {selectedDocenteId && (
                <div className="sticky bottom-0 bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <span className="material-icons-round text-blue-400">fitness_center</span>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/60">Balance de Carga del Docente</h4>
                            <p className="text-xs font-bold text-white uppercase tracking-wider">{recursos.docentes.find(d => d.id === selectedDocenteId)?.apellido}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <p className={cn("text-2xl font-black leading-none", getHorasDocente(selectedDocenteId) > (recursos.docentes.find(d => d.id === selectedDocenteId)?.cargaHorariaMax || 30) ? "text-red-500" : "text-blue-400")}>
                                {getHorasDocente(selectedDocenteId)}
                            </p>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Horas Asignadas</span>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="text-center">
                            <p className="text-2xl font-black text-white/40 leading-none">
                                {recursos.docentes.find(d => d.id === selectedDocenteId)?.cargaHorariaMax || 30}
                            </p>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Capacidad Máx.</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

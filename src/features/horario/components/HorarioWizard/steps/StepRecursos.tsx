import React, { useState } from 'react';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { Docente, Aula, Seccion, Materia } from '../../../types';

interface StepRecursosProps {
    data: {
        docentes: Docente[];
        aulas: Aula[];
        secciones: Seccion[];
        materias: Materia[];
    };
    nivelIE: string;
    onChange: (type: 'docentes' | 'aulas' | 'secciones' | 'materias', items: any[]) => void;
}

const COMMON_SPACES = [
    { nombre: 'Aula Común', icon: 'meeting_room' },
    { nombre: 'Laboratorio de Ciencias', icon: 'science' },
    { nombre: 'Taller de Cómputo', icon: 'computer' },
    { nombre: 'Biblioteca', icon: 'local_library' },
    { nombre: 'Campo Deportivo', icon: 'sports_soccer' },
    { nombre: 'Auditorio', icon: 'theater_comedy' },
    { nombre: 'Sala de Usos Múltiples', icon: 'groups' },
    { nombre: 'Biohuerto', icon: 'psychiatry' },
];

const ESPECIALIDADES = [
    'Matemática', 'Comunicación', 'Inglés', 'Arte y Cultura', 
    'Ciencia y Tecnología', 'Ciencias Sociales', 'Educación Física', 
    'Educación Religiosa', 'Desarrollo Personal', 'EPT'
];

const EBR_AREAS = {
    'Secundaria': [
        { nombre: 'Matemática', abreviatura: 'MAT', horas: 4 },
        { nombre: 'Comunicación', abreviatura: 'COM', horas: 4 },
        { nombre: 'Inglés', abreviatura: 'ING', horas: 3 },
        { nombre: 'Arte y Cultura', abreviatura: 'ARTE', horas: 3 },
        { nombre: 'Ciencia y Tecnología', abreviatura: 'CYT', horas: 4 },
        { nombre: 'Ciencias Sociales', abreviatura: 'CCSS', horas: 3 },
        { nombre: 'Educación Física', abreviatura: 'EF', horas: 3 },
        { nombre: 'Educación Religiosa', abreviatura: 'REL', horas: 2 },
        { nombre: 'Desarrollo Personal, Ciudadanía y Cívica', abreviatura: 'DPCC', horas: 3 },
        { nombre: 'Educación para el Trabajo', abreviatura: 'EPT', horas: 3 },
        { nombre: 'Tutoría', abreviatura: 'TUT', horas: 2 }
    ],
    'Primaria': [
        { nombre: 'Matemática', abreviatura: 'MAT', horas: 5 },
        { nombre: 'Comunicación', abreviatura: 'COM', horas: 5 },
        { nombre: 'Personal Social', abreviatura: 'PS', horas: 4 },
        { nombre: 'Ciencia y Tecnología', abreviatura: 'CYT', horas: 4 },
        { nombre: 'Educación Física', abreviatura: 'EF', horas: 3 },
        { nombre: 'Educación Religiosa', abreviatura: 'REL', horas: 2 },
        { nombre: 'Arte y Cultura', abreviatura: 'ARTE', horas: 3 },
        { nombre: 'Inglés', abreviatura: 'ING', horas: 2 },
        { nombre: 'Tutoría', abreviatura: 'TUT', horas: 2 }
    ],
    'Inicial': [
        { nombre: 'Personal Social', abreviatura: 'PS', horas: 5 },
        { nombre: 'Psicomotriz', abreviatura: 'PSI', horas: 5 },
        { nombre: 'Comunicación', abreviatura: 'COM', horas: 5 },
        { nombre: 'Ciencia y Tecnología', abreviatura: 'CYT', horas: 5 },
        { nombre: 'Matemática', abreviatura: 'MAT', horas: 5 },
        { nombre: 'Religión', abreviatura: 'REL', horas: 1 },
        { nombre: 'Taller de Arte', abreviatura: 'ARTE', horas: 2 },
        { nombre: 'Taller de Música', abreviatura: 'MUS', horas: 2 },
        { nombre: 'Inglés', abreviatura: 'ING', horas: 2 }
    ]
};

const TEACHER_COLORS = [
    { bg: 'bg-[#FF2D8A]/20', text: 'text-[#FF2D8A]', border: 'border-[#FF2D8A]/30', hex: '#FF2D8A' }, // Brand Magenta
    { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', hex: '#3b82f6' },
    { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', hex: '#10b981' },
    { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', hex: '#f59e0b' },
    { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30', hex: '#8b5cf6' },
    { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30', hex: '#d946ef' },
    { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30', hex: '#06b6d4' },
    { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', hex: '#f97316' },
    { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30', hex: '#6366f1' },
    { bg: 'bg-lime-500/20', text: 'text-lime-400', border: 'border-lime-500/30', hex: '#84cc16' },
];

export const StepRecursos: React.FC<StepRecursosProps> = ({ data, nivelIE, onChange }) => {
    type TabKey = 'materias' | 'secciones' | 'aulas' | 'docentes';
    const [activeTab, setActiveTab] = useState<TabKey>('materias');
    const [inputValue, setInputValue] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedGrado, setSelectedGrado] = useState('1');
    const [showAllLetters, setShowAllLetters] = useState(false);

    // Formulario simple para docente/materia individual en modo visual
    const [individualItem, setIndividualItem] = useState({ nombre: '', subtext: '', horas: 4 });

    // Auto-asignación de colores para registros que no tengan uno
    React.useEffect(() => {
        const missingDocenteColors = data.docentes?.some(d => !d.color);
        const missingMateriaColors = data.materias?.some(m => !m.color);
        
        if (missingDocenteColors) {
            const updated = data.docentes.map((d, i) => ({
                ...d,
                color: d.color || TEACHER_COLORS[i % TEACHER_COLORS.length].hex
            }));
            onChange('docentes', updated);
        }
        
        if (missingMateriaColors) {
            const updated = data.materias.map((m, i) => ({
                ...m,
                color: m.color || TEACHER_COLORS[(i + 5) % TEACHER_COLORS.length].hex
            }));
            onChange('materias', updated);
        }
    }, [data.docentes?.length, data.materias?.length]);

    const handleAddItems = () => {
        if (!inputValue.trim()) return;
        const entries = inputValue.split(/,|\n/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        
        if (activeTab === 'materias') {
            const currentCount = (data.materias || []).length;
            const newMaterias: Materia[] = entries.map((entry: string, index: number) => {
                const parts = entry.split(/[:|-]/).map((p: string) => p.trim());
                const colorIndex = (currentCount + index + 5) % TEACHER_COLORS.length;
                return {
                    id: crypto.randomUUID(),
                    nombre: parts[0],
                    abreviatura: parts[1] || parts[0].substring(0, 3).toUpperCase(),
                    horasSemanalesBase: 4, // Por defecto 4h en masivo
                    color: TEACHER_COLORS[colorIndex].hex
                };
            });
            onChange('materias', [...(data.materias || []), ...newMaterias]);
        } else if (activeTab === 'docentes') {
            const currentCount = data.docentes.length;
            const newDocentes: Docente[] = entries.map((entry: string, index: number) => {
                const parts = entry.split(/[:|-]/).map((p: string) => p.trim());
                const colorIndex = (currentCount + index) % TEACHER_COLORS.length;
                return {
                    id: crypto.randomUUID(),
                    nombre: parts[0],
                    abreviatura: parts[0].substring(0, 3).toUpperCase(),
                    especialidad: parts[1] || '',
                    cargaHorariaMax: 30,
                    color: TEACHER_COLORS[colorIndex].hex
                };
            });
            onChange('docentes', [...data.docentes, ...newDocentes]);
        } else if (activeTab === 'aulas') {
            const newAulas: Aula[] = entries.map((entry: string) => {
                const parts = entry.split(/[:|-]/).map((p: string) => p.trim());
                return {
                    id: crypto.randomUUID(),
                    nombre: parts[0],
                    abreviatura: parts[1] || parts[0].substring(0, 3).toUpperCase(),
                    color: TEACHER_COLORS[Math.floor(Math.random() * TEACHER_COLORS.length)].hex
                };
            });
            onChange('aulas', [...data.aulas, ...newAulas]);
        } else if (activeTab === 'secciones') {
            const newSecciones: Seccion[] = entries.map((name: string) => {
                const match = name.match(/(\d+)\s*([a-zA-Z]+)/);
                return {
                    id: crypto.randomUUID(),
                    grado: match ? match[1] : name,
                    letra: match ? match[2].toUpperCase() : '',
                    nivel: nivelIE
                };
            });
            onChange('secciones', [...data.secciones, ...newSecciones]);
        }
        setInputValue('');
    };

    const handleAddIndividual = () => {
        if (!individualItem.nombre.trim()) return;
        
        if (activeTab === 'materias') {
            const colorIndex = ((data.materias || []).length + 5) % TEACHER_COLORS.length;
            const newMateria: Materia = {
                id: crypto.randomUUID(),
                nombre: individualItem.nombre,
                abreviatura: individualItem.subtext || individualItem.nombre.substring(0, 3).toUpperCase(),
                horasSemanalesBase: individualItem.horas,
                color: TEACHER_COLORS[colorIndex].hex
            };
            onChange('materias', [...(data.materias || []), newMateria]);
        } else {
            const colorIndex = data.docentes.length % TEACHER_COLORS.length;
            const newDocente: Docente = {
                id: crypto.randomUUID(),
                nombre: individualItem.nombre,
                abreviatura: individualItem.nombre.substring(0, 3).toUpperCase(),
                especialidad: individualItem.subtext,
                cargaHorariaMax: 30,
                color: TEACHER_COLORS[colorIndex].hex
            };
            onChange('docentes', [...data.docentes, newDocente]);
        }
        setIndividualItem({ nombre: '', subtext: '', horas: 2 });
    };

    const handleLoadEBR = () => {
        const areas = EBR_AREAS[nivelIE as keyof typeof EBR_AREAS] || EBR_AREAS['Secundaria'];
        const currentCount = (data.materias || []).length;
        
        const newMaterias: Materia[] = areas
            .filter(area => !data.materias.some(m => m.nombre.toLowerCase() === area.nombre.toLowerCase()))
            .map((area, index) => ({
                id: crypto.randomUUID(),
                nombre: area.nombre,
                abreviatura: area.abreviatura,
                horasSemanalesBase: area.horas,
                color: TEACHER_COLORS[(currentCount + index + 5) % TEACHER_COLORS.length].hex
            }));
        
        onChange('materias', [...(data.materias || []), ...newMaterias]);
    };

    const toggleMateriaEBR = (area: {nombre: string, abreviatura: string, horas: number}) => {
        const exists = data.materias.find(m => m.nombre === area.nombre);
        if (exists) {
            removeItem('materias', exists.id);
        } else {
            const colorIndex = ((data.materias || []).length + 5) % TEACHER_COLORS.length;
            const newMateria: Materia = {
                id: crypto.randomUUID(),
                nombre: area.nombre,
                abreviatura: area.abreviatura,
                horasSemanalesBase: area.horas,
                color: TEACHER_COLORS[colorIndex].hex
            };
            onChange('materias', [...(data.materias || []), newMateria]);
        }
    };

    const toggleSeccion = (grado: string, letra: string) => {
        const index = (data.secciones || []).findIndex(s => s.grado === grado && s.letra === letra);
        if (index >= 0) {
            onChange('secciones', data.secciones.filter((_, i) => i !== index));
        } else {
            const newSeccion: Seccion = {
                id: crypto.randomUUID(),
                grado,
                letra,
                nivel: nivelIE,
                color: TEACHER_COLORS[(data.secciones.length) % TEACHER_COLORS.length].hex
            };
            onChange('secciones', [...(data.secciones || []), newSeccion]);
        }
    };

    const toggleAula = (nombre: string) => {
        const index = (data.aulas || []).findIndex(a => a.nombre === nombre);
        if (index >= 0) {
            onChange('aulas', data.aulas.filter((_, i) => i !== index));
        } else {
            onChange('aulas', [...(data.aulas || []), { 
                id: crypto.randomUUID(), 
                nombre,
                abreviatura: nombre.substring(0, 3).toUpperCase(),
                color: TEACHER_COLORS[Math.floor(Math.random() * TEACHER_COLORS.length)].hex
            }]);
        }
    };

    const updateItem = (id: string, updates: any) => {
        const newItems = (data[activeTab] || []).map((item: any) => {
            if (item.id === id) {
                const updated = { ...item, ...updates };
                // Generar abreviatura automáticamente para docentes si cambia el nombre o apellido
                if (activeTab === 'docentes' && (updates.nombre !== undefined || updates.apellido !== undefined)) {
                    const n = updated.nombre || '';
                    const a = updated.apellido || '';
                    if (a) {
                        updated.abreviatura = (n[0] + a.substring(0, 2)).toUpperCase();
                    } else {
                        updated.abreviatura = n.substring(0, 3).toUpperCase();
                    }
                }
                return updated;
            }
            return item;
        });
        onChange(activeTab, newItems);
    };

    const removeItem = (type: TabKey, id: string) => {
        onChange(type, (data[type] || []).filter((item: any) => item.id !== id));
    };

    const gradosCount = nivelIE === 'Secundaria' ? 5 : 6;

    return (
        <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <header className="text-center space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Inventario de Recursos</h3>
                <p className="text-xs text-white/40 uppercase font-bold tracking-widest">Configura los elementos base de tu horario</p>
            </header>

            {/* Selector de tipo de recurso - Estilo aSc TimeTables */}
            <div className="flex justify-center gap-2">
                {[
                    { key: 'materias', label: 'Asignaturas', icon: 'auto_stories' },
                    { key: 'secciones', label: 'Clases/Grados', icon: 'groups' },
                    { key: 'aulas', label: 'Aulas', icon: 'home' },
                    { key: 'docentes', label: 'Profesores', icon: 'school' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as TabKey)}
                        className={cn(
                            "px-6 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group min-w-[180px]",
                            activeTab === tab.key 
                                ? "bg-white text-black border-white shadow-glow-white-sm" 
                                : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                        )}
                    >
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <span className={cn(
                                "material-icons-round text-2xl transition-transform group-hover:scale-110",
                                activeTab === tab.key ? "text-brand-magenta" : "text-white/20"
                            )}>
                                {tab.icon}
                            </span>
                            <span className="flex items-center gap-2">
                                {tab.label}
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[8px]",
                                    activeTab === tab.key ? "bg-black/10 text-black font-black" : "bg-brand-magenta/20 text-brand-magenta"
                                )}>
                                    {(data[tab.key as keyof typeof data] || []).length}
                                </span>
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Area de Input Híbrida */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm self-stretch space-y-10">
                {/* Caja de Texto (Modo Avanzado) */}
                <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer list-none ml-4 mb-2">
                        <div className="flex items-center gap-3">
                            <span className="material-icons-round text-brand-magenta text-sm group-open:rotate-90 transition-transform">bolt</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Entrada Inteligente Rápida (Avanzado)</span>
                        </div>
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest group-open:hidden flex items-center gap-1">
                            Haz clic para pegar lista <span className="material-icons-round text-xs">unfold_more</span>
                        </span>
                    </summary>
                    <div className="space-y-4 pt-4 animate-in slide-in-from-top-2 duration-300">
                        <textarea 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={
                                activeTab === 'materias'
                                ? "Escribe o pega nombres de asignaturas...\nEj: Matemática:MAT, Comunicación:COM, Zumba:ZUM"
                                : activeTab === 'docentes' 
                                ? "Escribe o pega nombres de profesores...\nEj: Juan Pérez:MAT, María García:COM" 
                                : activeTab === 'aulas'
                                ? "Escribe o pega nombres de aulas...\nEj: Aula 101, Laboratorio, Biblioteca"
                                : "Escribe o pega clases...\nEj: 1A, 1B, 2A, 2B"
                            }
                            className="w-full bg-black/40 border border-white/10 rounded-[2rem] p-8 text-white focus:border-brand-magenta outline-none transition-all font-medium text-lg placeholder:text-white/5 min-h-[160px] resize-none shadow-2xl"
                        />
                        <div className="flex justify-between items-center px-6">
                            <div className="text-[8px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-icons-round text-xs">info</span>
                                Separa por comas o saltos de línea. Usa ":" para abreviatura/especialidad.
                            </div>
                            <button 
                                onClick={handleAddItems}
                                disabled={!inputValue.trim()}
                                className="px-10 py-4 bg-brand-magenta text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-glow-magenta transition-all disabled:opacity-50 flex items-center gap-3"
                            >
                                <span className="material-icons-round text-sm">add_circle</span>
                                Procesar Masivamente
                            </button>
                        </div>
                    </div>
                </details>

                {/* Selectores Visuales Dinámicos */}
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    {activeTab === 'materias' && (
                        <div className="space-y-8">
                            {/* Selector de Áreas EBR */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons-round text-brand-magenta text-sm">auto_awesome</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Áreas Oficiales (CNEB)</span>
                                    </div>
                                    <button 
                                        onClick={handleLoadEBR}
                                        className="text-[9px] font-black uppercase tracking-widest text-[#FF2D8A] hover:text-white transition-colors bg-[#FF2D8A]/10 px-4 py-2 rounded-full border border-[#FF2D8A]/20"
                                    >
                                        Cargar todas las áreas de {nivelIE}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {(EBR_AREAS[nivelIE as keyof typeof EBR_AREAS] || EBR_AREAS['Secundaria']).map(area => {
                                        const isSelected = data.materias.some(m => m.nombre === area.nombre);
                                        return (
                                            <button
                                                key={area.nombre}
                                                onClick={() => toggleMateriaEBR(area)}
                                                className={cn(
                                                    "px-4 py-8 rounded-3xl border flex flex-col items-center gap-2 transition-all group relative overflow-hidden",
                                                    isSelected 
                                                        ? "bg-brand-magenta border-brand-magenta text-white shadow-glow-magenta-sm" 
                                                        : "bg-white/5 border-white/5 text-white/30 hover:bg-white/10 hover:border-white/20"
                                                )}
                                            >
                                                <span className={cn(
                                                    "material-icons-round text-2xl mb-1",
                                                    isSelected ? "text-white" : "text-white/10"
                                                )}>
                                                    {isSelected ? 'check_circle' : 'add_circle_outline'}
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-tight">{area.nombre}</span>
                                                <span className="text-[8px] opacity-40 font-bold uppercase">{area.abreviatura}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 px-10">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[.4em]">¿No encuentras el área? Créala aquí</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                            </div>
                        </div>
                    )}

                    {(activeTab === 'docentes' || activeTab === 'materias') && (
                        <div className={cn(
                            "grid gap-6 items-end bg-white/5 p-8 rounded-[2rem] border border-white/5",
                            activeTab === 'materias' ? "grid-cols-1 md:grid-cols-4" : "grid-cols-1 md:grid-cols-3"
                        )}>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-4">
                                    Nombre de la {activeTab === 'materias' ? 'Asignatura' : 'Docente'}
                                </label>
                                <input 
                                    value={individualItem.nombre}
                                    onChange={(e) => setIndividualItem({...individualItem, nombre: e.target.value})}
                                    placeholder={activeTab === 'materias' ? "Ej. Arte y Cultura" : "Ej. Ricardo Palma"}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-magenta outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-4">
                                    {activeTab === 'materias' ? 'Abreviatura' : 'Especialidad'}
                                </label>
                                {activeTab === 'docentes' ? (
                                    <select 
                                        value={individualItem.subtext}
                                        onChange={(e) => setIndividualItem({...individualItem, subtext: e.target.value})}
                                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-magenta outline-none transition-all appearance-none"
                                    >
                                        <option value="">Ninguna / Otra</option>
                                        {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                                    </select>
                                ) : (
                                    <input 
                                        value={individualItem.subtext}
                                        onChange={(e) => setIndividualItem({...individualItem, subtext: e.target.value})}
                                        placeholder="Ej. MAT"
                                        maxLength={5}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-magenta outline-none transition-all"
                                    />
                                )}
                            </div>
                            
                            {activeTab === 'materias' && (
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-4">
                                        Horas Sem.
                                    </label>
                                    <input 
                                        type="number"
                                        value={individualItem.horas}
                                        onChange={(e) => setIndividualItem({...individualItem, horas: parseInt(e.target.value) || 0})}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-magenta outline-none transition-all"
                                    />
                                </div>
                            )}

                            <button 
                                onClick={handleAddIndividual}
                                disabled={!individualItem.nombre.trim()}
                                className="h-[58px] bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-magenta hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-round text-sm">add</span>
                                Registrar Individual
                            </button>
                        </div>
                    )}

                    {activeTab === 'aulas' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {COMMON_SPACES.map(space => {
                                const isSelected = data.aulas.some(a => a.nombre === space.nombre);
                                return (
                                    <button
                                        key={space.nombre}
                                        onClick={() => toggleAula(space.nombre)}
                                        className={cn(
                                            "p-8 rounded-[2rem] border flex flex-col items-center gap-4 transition-all group",
                                            isSelected 
                                                ? "bg-brand-magenta border-brand-magenta text-white shadow-glow-magenta-sm" 
                                                : "bg-white/5 border-white/5 text-white/20 hover:border-white/20 hover:bg-white/10"
                                        )}
                                    >
                                        <span className={cn(
                                            "material-icons-round text-4xl transition-transform group-hover:scale-110",
                                            isSelected ? "text-white" : "text-white/10"
                                        )}>
                                            {space.icon}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{space.nombre}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'secciones' && (
                        <div className="space-y-12 pb-10">
                            {/* Selector de Grado (Estilo Poseify) */}
                            <div className="flex flex-wrap justify-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                {Array.from({length: gradosCount}).map((_, i) => {
                                    const grado = (i + 1).toString();
                                    const count = data.secciones.filter(s => s.grado === grado).length;
                                    return (
                                        <button
                                            key={grado}
                                            onClick={() => setSelectedGrado(grado)}
                                            className={cn(
                                                "px-8 py-4 rounded-3xl border text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3",
                                                selectedGrado === grado 
                                                    ? "bg-white text-black border-white shadow-glow-white-sm scale-110 z-10" 
                                                    : "bg-white/5 border-white/5 text-white/30 hover:bg-white/10 hover:border-white/20"
                                            )}
                                        >
                                            {grado}º Grado
                                            {count > 0 && (
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-lg text-[9px] font-black",
                                                    selectedGrado === grado ? "bg-black/10 text-black" : "bg-brand-magenta/20 text-brand-magenta"
                                                )}>
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Widget de Configuración de Secciones (Inspirado en Captura) */}
                            <div className="max-w-2xl mx-auto space-y-10">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-8">
                                        <label className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20">CONFIGURACIÓN DE SECCIÓN(ES)</label>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-brand-magenta animate-pulse shadow-glow-magenta-xs" />
                                            <span className="text-[9px] font-black text-brand-magenta uppercase tracking-widest">Edición en Tiempo Real</span>
                                        </div>
                                    </div>
                                    
                                    {/* Contenedor de Selección (Chip Box) */}
                                    <div className="bg-[#0f0f0f] border border-white/5 rounded-[3rem] p-10 min-h-[200px] flex flex-wrap items-start content-start gap-5 relative group focus-within:border-brand-magenta/20 transition-all shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
                                        <AnimatePresence>
                                            {data.secciones.filter(s => s.grado === selectedGrado).map(sec => (
                                                <motion.div
                                                    key={sec.id}
                                                    initial={{ opacity: 0, scale: 0.8, x: -10 }}
                                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.8, x: 10 }}
                                                    className="bg-[#2a101d] border border-brand-magenta/30 text-white rounded-[1.5rem] pl-6 pr-3 py-4 flex items-center gap-4 group/chip hover:bg-brand-magenta transition-all cursor-default shadow-lg"
                                                >
                                                    <span className="text-2xl font-black tracking-tighter">{sec.letra}</span>
                                                    <button 
                                                        onClick={() => toggleSeccion(selectedGrado, sec.letra)}
                                                        className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/80 flex items-center justify-center text-white/40 hover:text-white transition-all"
                                                    >
                                                        <span className="material-icons-round text-lg">close</span>
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        
                                        <div className="flex-1 min-w-[300px] mt-2 h-14 flex items-center px-2">
                                            <input 
                                                placeholder="Escribe y pulsa Enter"
                                                className="bg-transparent border-none outline-none text-2xl font-black text-white/20 placeholder:text-white/5 w-full focus:text-white transition-colors"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const val = e.currentTarget.value.trim().toUpperCase();
                                                        if (val && val.length < 5) toggleSeccion(selectedGrado, val);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Efecto de borde dinámico */}
                                        <div className="absolute inset-0 rounded-[3rem] border border-brand-magenta/10 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
                                    </div>

                                    {/* Selector de Secciones con Toggle (Inspirado en Petición) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-6">
                                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">SECCIÓN(ES)</label>
                                            <button 
                                                onClick={() => setShowAllLetters(!showAllLetters)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                                    showAllLetters ? "bg-brand-magenta text-white shadow-glow-magenta-xs" : "bg-white/5 text-brand-magenta hover:bg-white/10"
                                                )}
                                            >
                                                <span className="material-icons-round text-sm">{showAllLetters ? 'keyboard_arrow_up' : 'apps'}</span>
                                                {showAllLetters ? 'Ocultar' : 'Ver Todas A-Z'}
                                            </button>
                                        </div>

                                        {/* Contenedor de Selección (Chip Box) */}
                                        <div className="bg-[#0f0f0f] border border-white/5 rounded-[3rem] p-8 min-h-[160px] flex flex-wrap items-start content-start gap-4 transition-all shadow-2xl">
                                            <AnimatePresence>
                                                {data.secciones.filter(s => s.grado === selectedGrado).map(sec => (
                                                    <motion.div
                                                        key={sec.id}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className="bg-[#2a101d] border border-brand-magenta/30 text-white rounded-[1.2rem] pl-5 pr-2 py-3 flex items-center gap-3 transition-all"
                                                    >
                                                        <span className="text-xl font-black">{sec.letra}</span>
                                                        <button 
                                                            onClick={() => toggleSeccion(selectedGrado, sec.letra)}
                                                            className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/80 flex items-center justify-center text-white/40 hover:text-white transition-all"
                                                        >
                                                            <span className="material-icons-round text-base">close</span>
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            
                                            <div className="flex-1 min-w-[200px] h-14 flex items-center px-4">
                                                <input 
                                                    placeholder="Escribe o selecciona..."
                                                    className="bg-transparent border-none outline-none text-xl font-black text-white/20 focus:text-white transition-colors w-full"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const val = e.currentTarget.value.trim().toUpperCase();
                                                            if (val && val.length < 5) toggleSeccion(selectedGrado, val);
                                                            e.currentTarget.value = '';
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Teclado A-Z Expandible */}
                                        <AnimatePresence>
                                            {showAllLetters ? (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 shadow-inner mt-2"
                                                >
                                                    <div className="grid grid-cols-8 gap-2">
                                                        {['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','Única'].map((letter) => {
                                                            const isSelected = data.secciones.some(s => s.grado === selectedGrado && s.letra === letter);
                                                            return (
                                                                <button
                                                                    key={letter}
                                                                    onClick={() => toggleSeccion(selectedGrado, letter)}
                                                                    className={cn(
                                                                        "h-10 rounded-xl border font-black text-xs transition-all flex items-center justify-center",
                                                                        isSelected 
                                                                            ? "bg-brand-magenta border-brand-magenta text-white shadow-glow-magenta-sm" 
                                                                            : "bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10"
                                                                    )}
                                                                >
                                                                    {letter}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <div className="flex flex-wrap justify-center gap-2 pt-2">
                                                    {['A', 'B', 'C', 'D'].map((letra) => {
                                                        const isSelected = data.secciones.some(s => s.grado === selectedGrado && s.letra === letra);
                                                        return (
                                                            <button
                                                                key={letra}
                                                                onClick={() => toggleSeccion(selectedGrado, letra)}
                                                                className={cn(
                                                                    "px-5 py-2.5 rounded-xl border font-black text-[10px] transition-all flex items-center justify-center min-w-[60px]",
                                                                    isSelected 
                                                                        ? "bg-brand-magenta/30 border-brand-magenta/50 text-white" 
                                                                        : "bg-white/5 border-white/5 text-gray-600 hover:text-white"
                                                                )}
                                                            >
                                                                {letra}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="flex justify-center pt-4">
                                        <div className="px-6 py-3 bg-white/5 border border-white/5 rounded-full flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/30">
                                            <span className="material-icons-round text-sm">info</span>
                                            Puedes usar el teclado o escribir directamente arriba
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Visualización de Cards de Recursos */}
            <div className="space-y-6 pt-10">
                <div className="flex items-center justify-between px-10">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                            <span className="material-icons-round text-white/40">
                                {activeTab === 'materias' ? 'auto_stories' : activeTab === 'secciones' ? 'groups' : activeTab === 'aulas' ? 'meeting_room' : 'school'}
                            </span>
                        </div>
                        <div>
                            <h4 className="text-xl font-black uppercase tracking-tighter text-white">Listado de {activeTab === 'materias' ? 'Asignaturas' : activeTab === 'secciones' ? 'Clases' : activeTab === 'aulas' ? 'Espacios' : 'Profesores'}</h4>
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">
                                {(data[activeTab] || []).length} Registros Activos
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-2">
                    <AnimatePresence mode="popLayout">
                        {(data[activeTab] || []).map((item: any) => {
                            const isEditing = editingId === item.id;
                            const itemColor = (activeTab === 'docentes' || activeTab === 'materias')
                                ? TEACHER_COLORS.find(c => c.hex === item.color) || TEACHER_COLORS[0]
                                : null;

                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                    className={cn(
                                        "relative group flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500",
                                        isEditing 
                                            ? "ring-2 ring-brand-magenta bg-[#111] shadow-2xl z-20 border-brand-magenta" 
                                            : "bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.06] hover:-translate-y-1"
                                    )}
                                >
                                    {/* Action Buttons Overlay - Repositioned to prevent overlap */}
                                    <div className="absolute top-4 right-4 flex gap-2 z-30">
                                        <button 
                                            onClick={() => {
                                                if (isEditing) setEditingId(null);
                                                else setEditingId(item.id);
                                            }}
                                            className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center transition-all border",
                                                isEditing 
                                                    ? "bg-brand-magenta text-white border-brand-magenta shadow-glow-magenta-xs" 
                                                    : "bg-white/5 text-white/40 border-white/10 hover:bg-brand-magenta hover:text-white"
                                            )}
                                        >
                                            <span className="material-icons-round text-sm">{isEditing ? 'check' : 'edit'}</span>
                                        </button>
                                        {!isEditing && (
                                            <button 
                                                onClick={() => removeItem(activeTab, item.id)}
                                                className="w-8 h-8 rounded-full bg-white/5 text-white/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-white/10"
                                            >
                                                <span className="material-icons-round text-sm">delete</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Main Content */}
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-5">
                                            {(activeTab === 'docentes' || activeTab === 'materias') && (
                                                <div 
                                                    className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner relative overflow-hidden", itemColor?.bg)}
                                                    style={{ color: itemColor?.hex }}
                                                >
                                                    <span className="material-icons-round text-3xl z-10">
                                                        {activeTab === 'docentes' ? (item.genero === 'M' ? 'face_6' : 'face_3') : 'auto_stories'}
                                                    </span>
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                                                </div>
                                            )}
                                            {activeTab === 'aulas' && (
                                                <div 
                                                    className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-glow-magenta-xs relative overflow-hidden", item.color ? "" : "bg-brand-magenta/10 text-brand-magenta border-brand-magenta/20")}
                                                    style={item.color ? { backgroundColor: `${item.color}20`, borderColor: `${item.color}40`, color: item.color } : {}}
                                                >
                                                    <span className="material-icons-round text-3xl">meeting_room</span>
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                                                </div>
                                            )}
                                            {activeTab === 'secciones' && (
                                                <div 
                                                    className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-glow-indigo-xs relative overflow-hidden", item.color ? "" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20")}
                                                    style={item.color ? { backgroundColor: `${item.color}20`, borderColor: `${item.color}40`, color: item.color } : {}}
                                                >
                                                    <span className="material-icons-round text-3xl">groups</span>
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                                                </div>
                                            )}

                                            <div className="flex-1 pt-1 overflow-hidden">
                                                {isEditing ? (
                                                    <div className="space-y-2">
                                                        <input 
                                                            autoFocus
                                                            value={item.nombre}
                                                            onChange={(e) => updateItem(item.id, { nombre: e.target.value })}
                                                            placeholder="Nombres"
                                                            className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:border-brand-magenta outline-none"
                                                        />
                                                        {activeTab === 'docentes' && (
                                                            <input 
                                                                value={item.apellido || ''}
                                                                onChange={(e) => updateItem(item.id, { apellido: e.target.value })}
                                                                placeholder="Apellidos"
                                                                className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:border-brand-magenta outline-none"
                                                            />
                                                        )}
                                                        {activeTab === 'secciones' && (
                                                            <input 
                                                                value={item.nombre || ''}
                                                                onChange={(e) => updateItem(item.id, { nombre: e.target.value })}
                                                                placeholder="Nombre del Grupo (ej. Delta)"
                                                                className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:border-brand-magenta outline-none"
                                                            />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col overflow-hidden">
                                                        <p className="text-lg font-black tracking-tight text-white leading-tight truncate pr-2">
                                                            {activeTab === 'docentes' ? `${item.nombre}` : (item.nombre || (activeTab === 'secciones' ? `${item.grado}${item.letra}` : item.nombre))}
                                                        </p>
                                                        {activeTab === 'docentes' && (
                                                            <p className="text-xs font-bold text-white/50 truncate pr-2">
                                                                {item.apellido || ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {activeTab === 'docentes' && (
                                                    <div className="mt-4 space-y-4">
                                                        {isEditing ? (
                                                            <div className="space-y-4 pr-1">
                                                                <div className="grid grid-cols-2 gap-3 pt-2">
                                                                    <div className="space-y-1.5 col-span-2">
                                                                        <label className="text-[9px] font-black uppercase text-white/20 tracking-widest ml-1">Capacidad Semanal (Horas)</label>
                                                                        <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
                                                                            <input 
                                                                                type="number"
                                                                                value={item.cargaHorariaMax}
                                                                                onChange={(e) => updateItem(item.id, { cargaHorariaMax: parseInt(e.target.value) || 0 })}
                                                                                className="bg-transparent border-none text-sm font-black text-brand-magenta w-12 outline-none"
                                                                            />
                                                                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                                                <div className="h-full bg-brand-magenta" style={{ width: `${(item.cargaHorariaMax / 40) * 100}%` }} />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="space-y-1.5 col-span-2">
                                                                        <label className="text-[8px] font-black uppercase text-white/20 tracking-widest ml-1">Género</label>
                                                                        <select 
                                                                            value={item.genero || 'H'}
                                                                            onChange={(e) => updateItem(item.id, { genero: e.target.value })}
                                                                            className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-brand-magenta/50"
                                                                        >
                                                                            <option value="H">Hombre</option>
                                                                            <option value="M">Mujer</option>
                                                                        </select>
                                                                    </div>
                                                                    
                                                                    <div className="space-y-1.5 col-span-2">
                                                                        <label className="text-[8px] font-black uppercase text-white/20 tracking-widest ml-1">Especialidad</label>
                                                                        <select 
                                                                            value={item.especialidad}
                                                                            onChange={(e) => updateItem(item.id, { especialidad: e.target.value })}
                                                                            className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-[10px] text-brand-magenta font-black uppercase tracking-widest focus:border-brand-magenta outline-none"
                                                                        >
                                                                            <option value="">Ninguna</option>
                                                                            {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2 pt-3 border-t border-white/5">
                                                                    <label className="text-[8px] font-black uppercase text-white/20 tracking-widest ml-1">Aulas Preferidas</label>
                                                                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-1">
                                                                        {data.aulas.map(aula => {
                                                                            const isSelected = (item.aulasPreferidasIds || []).includes(aula.id);
                                                                            return (
                                                                                <button 
                                                                                    key={aula.id}
                                                                                    onClick={() => {
                                                                                        const current = item.aulasPreferidasIds || [];
                                                                                        const updated = isSelected 
                                                                                            ? current.filter((id: string) => id !== aula.id)
                                                                                            : [...current, aula.id];
                                                                                        updateItem(item.id, { aulasPreferidasIds: updated });
                                                                                    }}
                                                                                    className={cn(
                                                                                        "px-2.5 py-1.5 rounded-lg border text-[8px] font-black uppercase transition-all",
                                                                                        isSelected 
                                                                                            ? "bg-brand-magenta border-brand-magenta text-white" 
                                                                                            : "bg-white/5 border-white/10 text-white/30 hover:bg-white/10"
                                                                                    )}
                                                                                >
                                                                                    {aula.abreviatura || aula.nombre}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                <div className="space-y-1">
                                                                    <div className="flex justify-between items-end mb-1">
                                                                        <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Capacidad Máxima</span>
                                                                        <span className="text-[10px] font-black text-white">{item.cargaHorariaMax}h / semana</span>
                                                                    </div>
                                                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-brand-magenta" style={{ width: `${(item.cargaHorariaMax / 40) * 100}%` }} />
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-brand-magenta">
                                                                        {item.especialidad || 'General'}
                                                                    </span>
                                                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                                                                        {item.abreviatura || item.nombre.substring(0, 3).toUpperCase()}
                                                                    </span>
                                                                </div>

                                                                {(item.aulasPreferidasIds || []).length > 0 && (
                                                                    <div className="pt-3 flex flex-wrap gap-1.5 border-t border-white/5">
                                                                        {item.aulasPreferidasIds.map((aid: string) => {
                                                                            const aula = data.aulas.find(a => a.id === aid);
                                                                            return aula ? (
                                                                                <span key={aid} className="text-[7px] font-black bg-brand-magenta/5 text-brand-magenta/60 px-2 py-1 rounded border border-brand-magenta/10">
                                                                                    {aula.abreviatura || aula.nombre}
                                                                                </span>
                                                                            ) : null;
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {activeTab === 'materias' && (
                                                    <div className="mt-2">
                                                        {isEditing ? (
                                                                <input 
                                                                    value={item.abreviatura}
                                                                    onChange={(e) => updateItem(item.id, { abreviatura: e.target.value.toUpperCase() })}
                                                                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-[10px] text-white/60 font-black uppercase tracking-widest focus:border-brand-magenta outline-none mt-1"
                                                                    maxLength={5}
                                                                />
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-brand-magenta">
                                                                    {item.abreviatura || item.nombre.substring(0, 3).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {activeTab === 'secciones' && (
                                                    <div className="mt-2 space-y-2">
                                                        {isEditing ? (
                                                            <div className="space-y-2">
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[8px] font-black uppercase text-white/30">Tutor de Clase</label>
                                                                    <select 
                                                                        value={item.tutorId || ''}
                                                                        onChange={(e) => updateItem(item.id, { tutorId: e.target.value })}
                                                                        className="w-full bg-black/60 border border-white/20 rounded-xl px-2 py-2 text-[10px] text-brand-magenta font-black uppercase tracking-widest focus:border-brand-magenta outline-none"
                                                                    >
                                                                        <option value="">Sin Tutor</option>
                                                                        {data.docentes.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[8px] font-black uppercase text-white/30">Identidad Color</label>
                                                                    <div className="flex gap-1.5 flex-wrap">
                                                                        {TEACHER_COLORS.map(c => (
                                                                            <button 
                                                                                key={c.hex}
                                                                                onClick={() => updateItem(item.id, { color: c.hex })}
                                                                                className={cn(
                                                                                    "w-4 h-4 rounded-full border border-white/10 transition-transform hover:scale-125",
                                                                                    item.color === c.hex ? "scale-125 ring-2 ring-white/20" : "opacity-40"
                                                                                )}
                                                                                style={{ backgroundColor: c.hex }}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-1.5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest text-indigo-400">
                                                                        {item.grado}{item.letra}
                                                                    </span>
                                                                    {item.tutorId && (
                                                                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                                                                            <span className="material-icons-round text-xs">face</span>
                                                                            {data.docentes.find(d => d.id === item.tutorId)?.nombre.split(' ')[0]}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {activeTab === 'aulas' && (
                                                    <div className="mt-2 space-y-3">
                                                        {isEditing ? (
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="flex flex-col gap-1">
                                                                        <label className="text-[8px] font-black uppercase text-white/30">Abreviatura</label>
                                                                        <input 
                                                                            value={item.abreviatura || ''}
                                                                            onChange={(e) => updateItem(item.id, { abreviatura: e.target.value.toUpperCase() })}
                                                                            className="bg-black/60 border border-white/20 rounded-xl px-2 py-2 text-[10px] text-white font-black outline-none"
                                                                            maxLength={5}
                                                                        />
                                                                    </div>
                                                                    <div className="flex flex-col gap-1">
                                                                        <label className="text-[8px] font-black uppercase text-white/30">Color</label>
                                                                        <div className="flex gap-1 flex-wrap">
                                                                            {TEACHER_COLORS.slice(0, 5).map(c => (
                                                                                <button 
                                                                                    key={c.hex}
                                                                                    onClick={() => updateItem(item.id, { color: c.hex })}
                                                                                    className={cn(
                                                                                        "w-4 h-4 rounded-full border border-white/10 transition-transform",
                                                                                        item.color === c.hex ? "scale-110 ring-1 ring-white/20" : "opacity-40"
                                                                                    )}
                                                                                    style={{ backgroundColor: c.hex }}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2 pt-2 border-t border-white/5">
                                                                    <label className="flex items-center gap-2 cursor-pointer group/check">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={item.esAulaFija}
                                                                            onChange={(e) => updateItem(item.id, { esAulaFija: e.target.checked })}
                                                                            className="w-3 h-3 rounded bg-white/5 border-white/20 checked:bg-brand-magenta transition-all"
                                                                        />
                                                                        <span className="text-[9px] font-bold text-white/40 group-hover/check:text-white transition-colors uppercase">Aula fija para clase</span>
                                                                    </label>
                                                                    
                                                                    {item.esAulaFija && (
                                                                        <select 
                                                                            value={item.seccionIdFija || ''}
                                                                            onChange={(e) => updateItem(item.id, { seccionIdFija: e.target.value })}
                                                                            className="w-full bg-black/60 border border-white/20 rounded-xl px-2 py-2 text-[9px] text-brand-magenta font-black uppercase outline-none"
                                                                        >
                                                                            <option value="">Seleccionar Clase...</option>
                                                                            {data.secciones.map(s => <option key={s.id} value={s.id}>{s.grado}{s.letra} {s.nombre ? `(${s.nombre})` : ''}</option>)}
                                                                        </select>
                                                                    )}

                                                                    <label className="flex items-center gap-2 cursor-pointer group/check">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={item.esCompartida}
                                                                            onChange={(e) => updateItem(item.id, { esCompartida: e.target.checked })}
                                                                            className="w-3 h-3 rounded bg-white/5 border-white/20 checked:bg-blue-500 transition-all"
                                                                        />
                                                                        <span className="text-[9px] font-bold text-white/40 group-hover/check:text-white transition-colors uppercase">Aula compartida</span>
                                                                    </label>

                                                                    <label className="flex items-center gap-2 cursor-pointer group/check">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={item.requiereSupervision}
                                                                            onChange={(e) => updateItem(item.id, { requiereSupervision: e.target.checked })}
                                                                            className="w-3 h-3 rounded bg-white/5 border-white/20 checked:bg-amber-500 transition-all"
                                                                        />
                                                                        <span className="text-[9px] font-bold text-white/40 group-hover/check:text-white transition-colors uppercase">Requiere supervisión</span>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-2">
                                                                <span className="px-2 py-0.5 rounded-lg bg-brand-magenta/10 border border-brand-magenta/20 text-[9px] font-black uppercase tracking-widest text-brand-magenta">
                                                                    {item.abreviatura || item.nombre.substring(0, 3).toUpperCase()}
                                                                </span>
                                                                {item.esAulaFija && (
                                                                    <span className="flex items-center gap-1 text-[8px] font-black text-white/40 uppercase bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                                                                        <span className="material-icons-round text-[10px]">push_pin</span>
                                                                        Fija: {data.secciones.find(s => s.id === item.seccionIdFija)?.grado}{data.secciones.find(s => s.id === item.seccionIdFija)?.letra}
                                                                    </span>
                                                                )}
                                                                {item.esCompartida && <span className="w-2 h-2 rounded-full bg-blue-500 shadow-glow-blue-xs self-center" title="Compartida" />}
                                                                {item.requiereSupervision && <span className="w-2 h-2 rounded-full bg-amber-500 shadow-glow-amber-xs self-center" title="Requiere supervisión" />}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {activeTab === 'docentes' && (
                                            <div className="pt-6 border-t border-white/5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Capacidad Máxima</span>
                                                        <span className="text-sm font-black text-white/50">{item.cargaHorariaMax}h / semana</span>
                                                    </div>
                                                    {isEditing && (
                                                        <input 
                                                            type="number"
                                                            value={item.cargaHorariaMax}
                                                            onChange={(e) => updateItem(item.id, { cargaHorariaMax: parseInt(e.target.value) || 0 })}
                                                            className="w-20 bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white text-right"
                                                        />
                                                    )}
                                                </div>
                                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        className="h-full bg-brand-magenta shadow-glow-magenta-xs"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(item.cargaHorariaMax / 30) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        
                                    </div>
                                </motion.div>
                            );
                        })}
                        {(data[activeTab] || []).length === 0 && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full py-24 flex flex-col items-center justify-center text-white/10 border-2 border-dashed border-white/5 rounded-[4rem] bg-white/[0.01]"
                            >
                                <span className="material-icons-round text-7xl mb-6 opacity-20">
                                    {activeTab === 'materias' ? 'library_add' : activeTab === 'docentes' ? 'person_add' : activeTab === 'aulas' ? 'add_business' : 'group_add'}
                                </span>
                                <p className="text-lg font-black uppercase tracking-[.5em] text-white/20">Inicia el registro</p>
                                <p className="text-[10px] font-black uppercase tracking-[.2em] text-white/10 mt-2">Usa la entrada rápida o individual arriba</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

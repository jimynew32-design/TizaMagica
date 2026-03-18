import React, { useState, useMemo } from 'react';
import { NeonButton } from '@/components/ui/NeonButton';
import { NivelEducativo, FilaHorario, CeldaHorario } from '@/types/schemas';
import { cn } from '@/lib/cn';
import { CONSTANTS } from '@/app/config/constants';
import { generateUniqueProjectsFromSchedule, isTimeRangeValid } from '@/lib/scheduler-utils';

interface SchedulerStepProps {
    value: FilaHorario[];
    nivel: NivelEducativo;
    tipoIE?: 'JER' | 'JEC' | 'CEBA' | 'EBE' | 'EIB' | 'SFT';
    turno?: 'Mañana' | 'Tarde' | 'Noche';
    duracionHora?: number;
    configuracionRecreos?: number[];
    onChange: (value: FilaHorario[]) => void;
}

export const SchedulerStep: React.FC<SchedulerStepProps> = ({
    value,
    nivel,
    tipoIE = 'JER',
    turno = 'Mañana',
    duracionHora = 45,
    configuracionRecreos = [],
    onChange
}) => {
    const [editingCell, setEditingCell] = useState<{ rowIndex: number; day: keyof FilaHorario } | null>(null);
    type DayKey = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';
    const days: DayKey[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

    const getCellTheme = (area: string, grado: string) => {
        if (!area) return { border: 'border-white/5', bg: 'bg-white/[0.01]', accent: 'text-white/40', glow: '' };
        
        let hash = 0;
        for (let i = 0; i < area.length; i++) {
            hash = area.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const officialColors: Record<string, number> = {
            'Matemática': 210, 
            'Comunicación': 340, 
            'Ciencia y Tecnología': 140, 
            'Ciencias Sociales': 30, 
            'Arte y Cultura': 280, 
            'Inglés': 240, 
            'Educación Física': 10,
            'Educación Religiosa': 190,
        };

        const baseHue = officialColors[area] !== undefined ? officialColors[area] : Math.abs(hash % 360);
        
        // Variation based on Grade (to distinguish same area in different grades)
        const gradeValues = ['1ero', '2do', '3ero', '4to', '5to', '6to'];
        const gradeIdx = gradeValues.indexOf(grado);
        // Cada grado añade un desplazamiento de 30 grados para ser claramente distinto del anterior
        const gradeOffset = gradeIdx !== -1 ? (gradeIdx * 30) : 0;
        
        const hue = (baseHue + gradeOffset) % 360;

        return {
            border: `1px solid hsla(${hue}, 80%, 50%, 0.4)`,
            bg: `hsla(${hue}, 80%, 15%, 0.15)`,
            accent: `hsl(${hue}, 90%, 70%)`,
            glow: `0 0 30px hsla(${hue}, 80%, 50%, 0.1)`,
            hue
        };
    };

    const areaStats = useMemo(() => {
        const stats: Record<string, { count: number, hue: number, areaName: string, grado: string }> = {};
        value.forEach(row => {
            days.forEach(day => {
                const cell = row[day] as CeldaHorario | undefined;
                if (cell?.area && cell?.grado) {
                    const key = `${cell.area} (${cell.grado})`;
                    if (!stats[key]) {
                        const theme = getCellTheme(cell.area, cell.grado);
                        stats[key] = { count: 0, hue: theme.hue || 0, areaName: cell.area, grado: cell.grado };
                    }
                    stats[key].count += 1;
                }
            });
        });
        return Object.entries(stats).sort((a, b) => (b[1]?.count || 0) - (a[1]?.count || 0));
    }, [value, days]);

    const uniqueProjects = useMemo(() =>
        generateUniqueProjectsFromSchedule(value, nivel),
        [value, nivel]);

    // Helpers para la lógica jerárquica
    const nivelConfig = CONSTANTS.NIVEL_CONFIG[nivel];
    const unassignedRecesses = useMemo(() => {
        const assigned = value.filter(r => r.tipo === 'recreo').map(r => r.nombre);
        return configuracionRecreos
            .map((dur, i) => ({ dur, name: `Recreo ${i + 1}`, index: i }))
            .filter(r => !assigned.includes(r.name));
    }, [value, configuracionRecreos]);

    const addRow = () => {
        let nextStart = '08:00';
        let nextEnd = '08:45';
        if (value.length > 0) {
            const lastRow = value[value.length - 1];
            if (lastRow.horaFin) {
                nextStart = lastRow.horaFin;
                const [h, m] = nextStart.split(':').map(Number);
                if (!isNaN(h)) {
                    const totalMin = h * 60 + m + duracionHora;
                    const nh = (Math.floor(totalMin / 60)) % 24;
                    const nm = totalMin % 60;
                    nextEnd = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
                }
            }
        }
        onChange([...value, { tipo: 'bloque', horaInicio: nextStart, horaFin: nextEnd }]);
    };

    const insertRecess = (afterIndex: number, recessIndex: number) => {
        const recessDur = configuracionRecreos[recessIndex];
        const prevRow = value[afterIndex];
        
        const [h, m] = (prevRow?.horaFin || '08:00').split(':').map(Number);
        const totalM = h * 60 + m + recessDur;
        const nh = (Math.floor(totalM / 60)) % 24;
        const nm = totalM % 60;
        const recessEnd = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
        
        const newRow: FilaHorario = {
            tipo: 'recreo',
            nombre: `Recreo ${recessIndex + 1}`,
            horaInicio: prevRow?.horaFin || '08:00',
            horaFin: recessEnd
        };
        
        const newValue = [...value];
        newValue.splice(afterIndex + 1, 0, newRow);
        onChange(newValue);
    };

    const removeRow = (index: number) => {
        const newData = [...value];
        newData.splice(index, 1);
        onChange(newData);
    };

    const updateTime = (index: number, field: 'horaInicio' | 'horaFin', val: string) => {
        const newData = [...value];
        newData[index] = { ...newData[index], [field]: val };
        onChange(newData);
    };

    const initCell = (rowIndex: number, day: keyof FilaHorario) => {
        const newData = JSON.parse(JSON.stringify(value)) as FilaHorario[];
        const dayKey = day as 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';

        // Valores por defecto: primer ciclo del nivel, primer grado de ese ciclo, primera área del nivel
        const defaultCiclo = nivelConfig.ciclos[0];
        const defaultGrado = CONSTANTS.GRADES_BY_CICLO[defaultCiclo][0];
        const defaultArea = nivelConfig.areas[0];

        newData[rowIndex][dayKey] = {
            ciclo: defaultCiclo,
            grado: defaultGrado,
            area: defaultArea
        };
        onChange(newData);
        setEditingCell({ rowIndex, day });
    };

    const allGradosForNivel = useMemo(() => {
        const result: string[] = [];
        nivelConfig.ciclos.forEach(c => {
            const grades = CONSTANTS.GRADES_BY_CICLO[c] || [];
            grades.forEach(g => {
                if (!result.includes(g)) result.push(g);
            });
        });
        return result;
    }, [nivelConfig]);

    const updateCellData = (rowIndex: number, day: keyof FilaHorario, updates: Partial<CeldaHorario>) => {
        const newData = JSON.parse(JSON.stringify(value)) as FilaHorario[];
        const dayKey = day as 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';
        const current = newData[rowIndex][dayKey] as CeldaHorario;

        let nextData = { ...current, ...updates };

        // Lógica de Mapeo Automático de Ciclo según Grado
        if (updates.grado && updates.grado !== current.grado) {
            // Buscar a qué ciclo pertenece este grado dentro del nivel actual
            const foundCiclo = nivelConfig.ciclos.find(c => 
                CONSTANTS.GRADES_BY_CICLO[c]?.includes(updates.grado!)
            );
            if (foundCiclo) {
                nextData.ciclo = foundCiclo;
            }
        }

        newData[rowIndex][dayKey] = nextData;
        onChange(newData);
    };

    const clearCell = (rowIndex: number, day: keyof FilaHorario) => {
        const newData = JSON.parse(JSON.stringify(value)) as FilaHorario[];
        const dayKey = day as 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';
        delete newData[rowIndex][dayKey];
        onChange(newData);
        setEditingCell(null);
    };

    // Efecto de Automatización: Generar estructura al cambiar Modelo o Turno
    React.useEffect(() => {
        // Solo sugerir si el horario está vacío para evitar sobreescribir trabajo del usuario
        if (value.length === 0) {
            suggestStructure();
        }
    }, [tipoIE, turno]);

    const suggestStructure = () => {
        // Lógica según normativa MINEDU
        let startTime = '08:00';
        let numBlocks = 7; // JER default
        
        if (turno === 'Tarde') startTime = '13:00';
        if (turno === 'Noche') startTime = '18:00';
        
        if (tipoIE === 'JEC') {
            numBlocks = 9;
            startTime = '07:30';
        } else if (tipoIE === 'CEBA') {
            numBlocks = 5;
        }

        const newRows: FilaHorario[] = [];
        let currentH = parseInt(startTime.split(':')[0]);
        let currentM = parseInt(startTime.split(':')[1]);

        for (let i = 0; i < numBlocks; i++) {
            const blockStart = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;
            
            // Añadir 45 min
            let totalM = currentH * 60 + currentM + 45;
            currentH = Math.floor(totalM / 60) % 24;
            currentM = totalM % 60;
            const blockEnd = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;

            newRows.push({ horaInicio: blockStart, horaFin: blockEnd });

            // Simular un recreo corto de 5 min entre bloques si no es el último
            if (i < numBlocks - 1) {
                totalM += 5;
                currentH = Math.floor(totalM / 60) % 24;
                currentM = totalM % 60;
            }
        }
        onChange(newRows);
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-fade-in pb-20">
            {/* Header Section Maestro y Centrado */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-left space-y-2">
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter">
                        Carga Horaria
                    </h3>
                    <p className="text-brand-magenta/60 text-[10px] uppercase font-black tracking-[0.2em] flex items-center gap-2">
                        <span className="material-icons-round text-sm">event_note</span>
                        {nivel} — {tipoIE} — {turno}
                    </p>
                </div>

                <div className="bg-brand-magenta/20 px-6 py-3 rounded-full border border-brand-magenta/30 flex items-center gap-3 shadow-glow-magenta-xs">
                     <span className="w-3 h-3 rounded-full bg-brand-magenta animate-pulse shadow-glow-magenta-xs" />
                     <span className="text-[12px] font-black text-brand-magenta uppercase tracking-widest">{uniqueProjects.length} Áreas por Semana</span>
                </div>
            </header>

            {/* Matrix Table */}
            <div className="relative rounded-[3rem] border border-white/5 bg-surface-card/20 backdrop-blur-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="w-48 py-8 px-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] text-left">Franja Horaria</th>
                                {days.map(day => (
                                    <th key={day} className="py-8 px-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] text-center">
                                        {day}
                                    </th>
                                ))}
                                <th className="w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {value.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-32 text-center">
                                        <div className="opacity-10 flex flex-col items-center gap-6">
                                            <span className="material-icons-round text-8xl">grid_on</span>
                                            <p className="font-black uppercase tracking-[0.4em] text-sm">Tabula tu horario</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : value.map((row, rowIndex) => {
                                const isRecreo = row.tipo === 'recreo';
                                const blockNum = value.slice(0, rowIndex + 1).filter(r => r.tipo !== 'recreo').length;
                                
                                if (isRecreo) {
                                    return (
                                        <tr key={`recreo-${rowIndex}`} className="bg-brand-magenta/[0.03] border-y border-brand-magenta/5 group/recreo">
                                            <td colSpan={7} className="py-4 px-10">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-10 h-10 rounded-xl bg-brand-magenta/10 flex items-center justify-center border border-brand-magenta/20">
                                                            <span className="material-icons-round text-brand-magenta text-lg">coffee</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-brand-magenta uppercase tracking-[0.2em]">{row.nombre}</span>
                                                            <div className="flex items-center gap-2 text-white/40">
                                                                <span className="text-xs font-bold">{row.horaInicio}</span>
                                                                <span className="text-[10px] opacity-30">—</span>
                                                                <span className="text-xs font-bold">{row.horaFin}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => removeRow(rowIndex)}
                                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-brand-magenta/30 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover/recreo:opacity-100"
                                                    >
                                                        <span className="material-icons-round text-xl">delete_outline</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                const isTimeError = !isTimeRangeValid(row.horaInicio, row.horaFin);
                                return (
                                    <React.Fragment key={`row-${rowIndex}`}>
                                        <tr className="group hover:bg-white/[0.01] transition-all duration-500 relative">
                                            <td className="p-6 align-top">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2 px-1 mb-1">
                                                        <span className="w-5 h-5 rounded-lg bg-brand-magenta/20 flex items-center justify-center text-[10px] font-black text-brand-magenta shadow-glow-magenta-xs">
                                                            {blockNum}
                                                        </span>
                                                        <span className="text-[9px] font-black text-brand-magenta/60 uppercase tracking-[0.2em]">Bloque</span>
                                                    </div>
                                                    <div className={cn(
                                                        "flex flex-col gap-3 p-4 rounded-3xl border transition-all duration-300 shadow-lg relative group/time",
                                                        isTimeError
                                                            ? "bg-red-500/10 border-red-500/30 glow-red-sm"
                                                            : "bg-surface-active/50 border-white/10 group-hover:border-brand-magenta/30"
                                                    )}>
                                                        <div className="relative">
                                                            <input
                                                                type="time"
                                                                value={row.horaInicio}
                                                                onChange={(e) => updateTime(rowIndex, 'horaInicio', e.target.value)}
                                                                className="bg-transparent text-lg font-black text-white focus:outline-none w-full cursor-pointer hover:text-brand-magenta transition-colors appearance-none pr-8"
                                                            />
                                                            <span className="material-icons-round absolute right-0 top-1/2 -translate-y-1/2 text-[14px] text-white/20 pointer-events-none group-hover/time:text-brand-magenta/60 transition-colors">expand_more</span>
                                                        </div>
                                                        <div className="h-px w-8 bg-white/10" />
                                                        <div className="relative">
                                                            <input
                                                                type="time"
                                                                value={row.horaFin}
                                                                onChange={(e) => updateTime(rowIndex, 'horaFin', e.target.value)}
                                                                className="bg-transparent text-sm font-bold text-white/50 focus:outline-none w-full cursor-pointer hover:text-white transition-colors appearance-none pr-8"
                                                            />
                                                            <span className="material-icons-round absolute right-0 top-1/2 -translate-y-1/2 text-[12px] text-white/10 pointer-events-none group-hover/time:text-white/30 transition-colors">expand_more</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {days.map(day => {
                                                const cell = row[day] as CeldaHorario | undefined;
                                                const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.day === day;
                                                const theme = cell ? getCellTheme(cell.area, cell.grado) : null;

                                                return (
                                                    <td key={day} className="p-2">
                                                        <div
                                                            onClick={() => !cell && initCell(rowIndex, day)}
                                                            style={theme ? { 
                                                                border: theme.border, 
                                                                backgroundColor: theme.bg,
                                                                boxShadow: theme.glow 
                                                            } : {}}
                                                            className={cn(
                                                                "h-52 min-w-[240px] rounded-[2.5rem] border transition-all duration-700 relative overflow-hidden group/cell",
                                                                cell || isEditing
                                                                    ? "bg-white/[0.03] border-white/10 p-5 shadow-2xl backdrop-blur-md"
                                                                    : "bg-white/[0.01] border-white/5 border-dashed cursor-pointer hover:bg-brand-magenta/5 hover:border-brand-magenta/30 hover:shadow-glow-magenta-xs"
                                                            )}
                                                        >
                                                            {cell ? (
                                                                <div className="flex flex-col gap-4 h-full animate-in fade-in zoom-in-95 duration-500 relative z-10 text-left">
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div className="relative text-left">
                                                                            <label style={theme ? { color: theme.accent, opacity: 0.6 } : {}} className="text-[7px] font-black uppercase tracking-[0.2em] mb-1.5 block px-1">Ciclo CNEB</label>
                                                                            <div style={theme ? { color: theme.accent, borderColor: `hsla(${theme.hue}, 80%, 50%, 0.2)`, backgroundColor: `hsla(${theme.hue}, 80%, 50%, 0.05)` } : {}} className="bg-brand-magenta/5 text-[10px] font-black px-3 py-2.5 rounded-xl border border-brand-magenta/20 italic flex items-center h-[35px]">Ciclo {cell.ciclo}</div>
                                                                        </div>
                                                                        <div className="relative group/sel text-left">
                                                                            <label style={theme ? { color: theme.accent, opacity: 0.6 } : {}} className="text-[7px] font-black uppercase tracking-[0.2em] mb-1.5 block px-1">Grado</label>
                                                                            <select value={cell.grado} onChange={(e) => updateCellData(rowIndex, day, { grado: e.target.value })} className="appearance-none bg-white/5 text-[10px] font-black text-white px-3 py-2.5 rounded-xl border border-white/10 focus:border-brand-magenta/40 outline-none cursor-pointer hover:bg-white/10 transition-all w-full pr-7">
                                                                                {allGradosForNivel.map(g => <option key={g} value={g} className="bg-black text-white">{g}</option>)}
                                                                            </select>
                                                                            <span className="material-icons-round absolute right-2 bottom-2.5 text-[14px] text-white/20 pointer-events-none group-hover/sel:text-brand-magenta/60 transition-colors">unfold_more</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1.5 flex-1 flex flex-col justify-end text-left">
                                                                        <label style={theme ? { color: theme.accent, opacity: 0.6 } : {}} className="text-[7px] font-black uppercase tracking-[0.2em] block px-1">Asignatura / Área</label>
                                                                        <div className="relative group/area">
                                                                            <div style={theme ? { background: `linear-gradient(to right, hsla(${theme.hue}, 80%, 50%, 0.2), transparent)` } : {}} className="absolute -inset-0.5 bg-gradient-to-r from-brand-magenta/20 to-transparent blur opacity-0 group-hover/area:opacity-100 transition-opacity rounded-2xl" />
                                                                            <select value={cell.area} onChange={(e) => updateCellData(rowIndex, day, { area: e.target.value })} style={theme ? { borderColor: `hsla(${theme.hue}, 80%, 50%, 0.3)`, backgroundColor: `hsla(${theme.hue}, 80%, 50%, 0.1)` } : {}} className="relative appearance-none bg-brand-magenta/10 hover:bg-brand-magenta/20 text-[10px] font-bold text-white px-4 py-3 rounded-2xl border border-brand-magenta/20 focus:border-brand-magenta outline-none cursor-pointer transition-all w-full pr-10 min-h-[50px] leading-tight flex items-center shadow-lg">
                                                                                {nivelConfig.areas.map(a => <option key={a} value={a} className="bg-[#111] text-white whitespace-normal py-2">{a}</option>)}
                                                                            </select>
                                                                            <span style={theme ? { color: theme.accent } : {}} className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-xl text-brand-magenta group-hover:scale-110 transition-transform">expand_more</span>
                                                                        </div>
                                                                    </div>
                                                                    <button onClick={(e) => { e.stopPropagation(); clearCell(rowIndex, day); }} className="absolute -top-2 -right-2 w-8 h-8 bg-[#1a1a1a] text-white/40 rounded-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 hover:bg-red-500 hover:text-white transition-all border border-white/5 shadow-2xl z-20"><span className="material-icons-round text-sm">close</span></button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-20 group-hover/cell:opacity-100 transition-all duration-500 scale-90 group-hover/cell:scale-100">
                                                                    <div className="w-14 h-14 rounded-3xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-brand-magenta group-hover:bg-brand-magenta/10 group-hover:border group-hover:border-brand-magenta/30 transition-all shadow-inner"><span className="material-icons-round text-3xl">add</span></div>
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors">Asignar Área</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}

                                            <td className="p-6">
                                                <button onClick={() => removeRow(rowIndex)} className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-700 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><span className="material-icons-round text-2xl">delete_sweep</span></button>
                                            </td>
                                        </tr>

                                        {/* Línea de Inserción de Recreo (Siempre visible sutilmente) */}
                                        {unassignedRecesses.length > 0 && (
                                            <tr className="border-none group/insert-row">
                                                <td colSpan={7} className="py-2 px-0 relative">
                                                    <div className="absolute inset-x-20 top-1/2 h-px bg-gradient-to-r from-transparent via-brand-magenta/20 to-transparent scale-x-0 group-hover/insert-row:scale-x-100 transition-transform duration-700" />
                                                    
                                                    <div className="relative z-30 flex justify-center translate-y-0 opacity-40 group-hover/insert-row:opacity-100 group-hover/insert-row:-translate-y-1 transition-all">
                                                        <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/5 group-hover/insert-row:border-brand-magenta/30 p-1.5 rounded-full shadow-2xl backdrop-blur-3xl transition-all">
                                                            <div className="flex items-center gap-2 px-3 mr-2 border-r border-white/10">
                                                                <span className="material-icons-round text-brand-magenta text-[14px]">coffee</span>
                                                                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest whitespace-nowrap">Insertar Recreo:</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {unassignedRecesses.map(r => (
                                                                    <button 
                                                                        key={r.index}
                                                                        onClick={() => insertRecess(rowIndex, r.index)}
                                                                        className="px-4 py-1.5 rounded-full bg-white/[0.03] hover:bg-brand-magenta text-[9px] font-black text-white/60 hover:text-white transition-all border border-white/5 hover:border-brand-magenta/50 shadow-lg whitespace-nowrap flex items-center gap-1.5"
                                                                    >
                                                                        <span className="material-icons-round text-[10px]">add</span>
                                                                        {r.name} ({r.dur}m)
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-12 border-t border-white/5 bg-white/[0.01] flex justify-center">
                    <NeonButton
                        variant="ghost"
                        icon="add_alarm"
                        onClick={addRow}
                        className="border-dashed border-white/10 hover:border-brand-magenta/50 hover:bg-brand-magenta/5 px-20 h-16 rounded-[2rem] text-xs font-black uppercase tracking-widest"
                    >
                        {value.length === 0 ? 'COMENZAR TABULACIÓN' : 'AÑADIR NUEVO BLOQUE MANUAL'}
                    </NeonButton>
                </div>
            </div>

            {/* Panel de Resumen de Carga Horaria (Contador de Horas) */}
            {areaStats.length > 0 && (
                <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-3 px-4">
                        <span className="material-icons-round text-brand-magenta text-xl">analytics</span>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Resumen de Carga Académica</h4>
                    </div>
                    
                    <div className="bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 shadow-2xl">
                        <div className="flex flex-wrap gap-4">
                            {areaStats.map(([area, stats]) => (
                                <div 
                                    key={area}
                                    style={{ borderColor: `hsla(${stats.hue}, 80%, 50%, 0.3)`, backgroundColor: `hsla(${stats.hue}, 80%, 20%, 0.2)` }}
                                    className="group relative flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 hover:bg-brand-magenta/10 hover:border-brand-magenta/30 transition-all cursor-default"
                                >
                                    <div 
                                        style={{ backgroundColor: `hsla(${stats.hue}, 80%, 50%, 0.2)` }}
                                        className="absolute -inset-1 blur opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" 
                                    />
                                    <div className="relative flex flex-col">
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <span 
                                                style={{ color: `hsla(${stats.hue}, 90%, 70%, 1)` }}
                                                className="text-[7px] font-black uppercase tracking-widest"
                                            >
                                                {stats.grado}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-white/20" />
                                            <span className="text-[7px] font-black uppercase tracking-widest text-white/40">Asignatura</span>
                                        </div>
                                        <span className="text-xs font-black text-white truncate max-w-[140px] uppercase tracking-tighter">{stats.areaName}</span>
                                    </div>
                                    <div className="h-8 w-px bg-white/10" />
                                    <div className="relative flex flex-col items-center min-w-[40px]">
                                        <span 
                                            style={{ color: `hsla(${stats.hue}, 90%, 70%, 1)` }}
                                            className="text-[14px] font-black drop-shadow-sm"
                                        >
                                            {stats.count}
                                        </span>
                                        <span className="text-[8px] font-black text-white/20 uppercase">Horas</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

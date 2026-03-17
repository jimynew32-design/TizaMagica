import React, { useState, useMemo } from 'react';
import { TabSwitch } from '@/components/ui/TabSwitch';
import { NeonButton } from '@/components/ui/NeonButton';
import { NivelEducativo, FilaHorario, CeldaHorario } from '@/types/schemas';
import { cn } from '@/lib/cn';
import { CONSTANTS } from '@/app/config/constants';
import { generateUniqueProjectsFromSchedule, isTimeRangeValid } from '@/lib/scheduler-utils';

interface SchedulerStepProps {
    value: FilaHorario[];
    nivel: NivelEducativo;
    onNivelChange: (nivel: NivelEducativo) => void;
    onChange: (value: FilaHorario[]) => void;
}

export const SchedulerStep: React.FC<SchedulerStepProps> = ({
    value,
    nivel,
    onNivelChange,
    onChange
}) => {
    const [editingCell, setEditingCell] = useState<{ rowIndex: number; day: keyof FilaHorario } | null>(null);

    const uniqueProjects = useMemo(() =>
        generateUniqueProjectsFromSchedule(value, nivel),
        [value, nivel]);

    // Helpers para la lógica jerárquica
    const nivelConfig = CONSTANTS.NIVEL_CONFIG[nivel];

    const addRow = () => {
        let nextStart = '08:00';
        let nextEnd = '08:45';
        if (value.length > 0) {
            const lastRow = value[value.length - 1];
            if (lastRow.horaFin) {
                nextStart = lastRow.horaFin;
                const [h, m] = nextStart.split(':').map(Number);
                if (!isNaN(h)) {
                    const totalMin = h * 60 + m + 45;
                    const nh = (Math.floor(totalMin / 60)) % 24;
                    const nm = totalMin % 60;
                    nextEnd = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
                }
            }
        }
        onChange([...value, { horaInicio: nextStart, horaFin: nextEnd }]);
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

    const updateCellData = (rowIndex: number, day: keyof FilaHorario, updates: Partial<CeldaHorario>) => {
        const newData = JSON.parse(JSON.stringify(value)) as FilaHorario[];
        const dayKey = day as 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';
        const current = newData[rowIndex][dayKey] as CeldaHorario;

        const nextData = { ...current, ...updates };

        // Lógica de Reseteo Automático (Punto 2.A del SRS)
        if (updates.ciclo && updates.ciclo !== current.ciclo) {
            nextData.grado = CONSTANTS.GRADES_BY_CICLO[updates.ciclo][0];
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

    const days: ('lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes')[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header Section con Contador Mágico */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="flex-1 w-full">
                    <h3 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Plan de Carga Horaria</h3>
                    <p className="text-gray-400 text-sm">El sistema detectará automáticamente tus unidades de planificación.</p>
                </div>

                <div className="bg-primary-teal/10 border border-primary-teal/30 rounded-[2rem] px-8 py-4 flex items-center gap-6 glow-teal-sm animate-bounce-subtle">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary-teal blur-md opacity-20 animate-pulse" />
                        <div className="w-14 h-14 bg-primary-teal rounded-2xl flex items-center justify-center text-gray-900 font-black text-2xl relative z-10 shadow-lg">
                            {uniqueProjects.length}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-black text-primary-teal uppercase tracking-[0.2em] leading-none mb-1">Unidades Detectadas</p>
                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Provisioning en tiempo real</p>
                    </div>
                </div>
            </div>

            {/* Level Selector */}
            <div className="flex justify-center">
                <div className="bg-white/5 p-2 rounded-[2.5rem] border border-white/5 inline-flex">
                    <TabSwitch
                        className="min-w-[400px]"
                        options={[
                            { value: 'Inicial', label: 'Inicial' },
                            { value: 'Primaria', label: 'Primaria' },
                            { value: 'Secundaria', label: 'Secundaria' }
                        ]}
                        value={nivel}
                        onChange={(v) => onNivelChange(v as NivelEducativo)}
                    />
                </div>
            </div>

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
                                const isTimeError = !isTimeRangeValid(row.horaInicio, row.horaFin);
                                return (
                                    <tr key={rowIndex} className="group hover:bg-white/[0.01] transition-all duration-500">
                                        <td className="p-6 align-top">
                                            <div className={cn(
                                                "flex flex-col gap-2 p-4 rounded-3xl border transition-all duration-300 shadow-lg",
                                                isTimeError
                                                    ? "bg-red-500/10 border-red-500/30 glow-red-sm"
                                                    : "bg-surface-active/50 border-white/10 group-hover:border-white/20"
                                            )}>
                                                <input
                                                    type="time"
                                                    value={row.horaInicio}
                                                    onChange={(e) => updateTime(rowIndex, 'horaInicio', e.target.value)}
                                                    className="bg-transparent text-lg font-black text-white focus:outline-none w-full cursor-pointer hover:text-primary-teal transition-colors"
                                                />
                                                <div className="h-px w-8 bg-white/10" />
                                                <input
                                                    type="time"
                                                    value={row.horaFin}
                                                    onChange={(e) => updateTime(rowIndex, 'horaFin', e.target.value)}
                                                    className="bg-transparent text-sm font-bold text-white/50 focus:outline-none w-full cursor-pointer hover:text-white transition-colors"
                                                />
                                            </div>
                                        </td>

                                        {days.map(day => {
                                            const cell = row[day];
                                            const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.day === day;

                                            return (
                                                <td key={day} className="p-3">
                                                    <div
                                                        onClick={() => !cell && initCell(rowIndex, day)}
                                                        className={cn(
                                                            "h-32 min-w-[150px] rounded-[2rem] border transition-all duration-500 relative overflow-hidden group/cell",
                                                            cell || isEditing
                                                                ? "bg-white/[0.03] border-white/10 p-4"
                                                                : "bg-white/[0.01] border-white/5 border-dashed cursor-pointer hover:bg-primary-teal/5 hover:border-primary-teal/30"
                                                        )}
                                                    >
                                                        {cell ? (
                                                            <div className="flex flex-col gap-1.5 h-full animate-fade-in">
                                                                {/* Selector Ciclo */}
                                                                <select
                                                                    value={cell.ciclo}
                                                                    onChange={(e) => updateCellData(rowIndex, day, { ciclo: e.target.value })}
                                                                    className="appearance-none bg-surface-header/80 text-[10px] font-black text-primary-teal p-1.5 rounded-lg border border-white/5 focus:outline-none cursor-pointer hover:bg-surface-active transition-colors w-full"
                                                                >
                                                                    {nivelConfig.ciclos.map(c => <option key={c} value={c}>Ciclo {c}</option>)}
                                                                </select>

                                                                {/* Selector Grado */}
                                                                <select
                                                                    value={cell.grado}
                                                                    onChange={(e) => updateCellData(rowIndex, day, { grado: e.target.value })}
                                                                    className="appearance-none bg-white/5 text-[11px] font-bold text-white p-1.5 rounded-lg border border-white/5 focus:outline-none cursor-pointer hover:bg-white/10 transition-colors w-full"
                                                                >
                                                                    {CONSTANTS.GRADES_BY_CICLO[cell.ciclo].map(g => <option key={g} value={g}>{g}</option>)}
                                                                </select>

                                                                {/* Selector Area */}
                                                                <select
                                                                    value={cell.area}
                                                                    onChange={(e) => updateCellData(rowIndex, day, { area: e.target.value })}
                                                                    className="appearance-none bg-white/10 text-[9px] font-black text-white/90 p-1.5 rounded-lg border border-white/5 focus:outline-none cursor-pointer truncate hover:bg-white/20 transition-all w-full uppercase"
                                                                >
                                                                    {nivelConfig.areas.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                                                                </select>

                                                                {/* Kill Switch */}
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); clearCell(rowIndex, day); }}
                                                                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 hover:bg-red-500 hover:text-white transition-all scale-75 group-hover/cell:scale-100 backdrop-blur-md"
                                                                >
                                                                    <span className="material-icons-round text-sm">close</span>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center h-full gap-2 opacity-10 group-hover/cell:opacity-100 transition-all scale-90 group-hover/cell:scale-100">
                                                                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                                                    <span className="material-icons-round text-white">add</span>
                                                                </div>
                                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Asignar</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}

                                        <td className="p-6">
                                            <button
                                                onClick={() => removeRow(rowIndex)}
                                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-700 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <span className="material-icons-round text-2xl">delete_sweep</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-10 border-t border-white/5 bg-white/[0.02] flex justify-center">
                    <NeonButton
                        variant="ghost"
                        icon="add_alarm"
                        onClick={addRow}
                        className="border-dashed border-white/10 hover:border-primary-teal/50 hover:bg-primary-teal/5 px-16 h-16 rounded-3xl"
                    >
                        {value.length === 0 ? 'COMENZAR TABULACIÓN' : 'INSERTAR NUEVO BLOQUE DE HORA'}
                    </NeonButton>
                </div>
            </div>
        </div>
    );
};

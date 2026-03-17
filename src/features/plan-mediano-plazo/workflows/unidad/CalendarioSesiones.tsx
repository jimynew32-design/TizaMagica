import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import type { DiaCalendario, CalendarioComunalEvent } from '@/types/schemas';

// ─── Constants ──────────────────────────────────────────────────────────────

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const SESION_COLORS = [
    { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400', dot: 'bg-cyan-400', label: 'cyan' },
    { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400', dot: 'bg-rose-400', label: 'rose' },
    { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400', dot: 'bg-amber-400', label: 'amber' },
    { bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', text: 'text-indigo-400', dot: 'bg-indigo-400', label: 'indigo' },
    { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'emerald' },
    { bg: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/50', text: 'text-fuchsia-400', dot: 'bg-fuchsia-400', label: 'fuchsia' },
    { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', dot: 'bg-orange-400', label: 'orange' },
    { bg: 'bg-sky-500/20', border: 'border-sky-500/50', text: 'text-sky-400', dot: 'bg-sky-400', label: 'sky' },
    { bg: 'bg-lime-500/20', border: 'border-lime-500/50', text: 'text-lime-400', dot: 'bg-lime-400', label: 'lime' },
];

const EVENT_TYPE_COLORS: Record<string, { dot: string; text: string }> = {
    festividad: { dot: 'bg-amber-400', text: 'text-amber-400' },
    hito: { dot: 'bg-blue-400', text: 'text-blue-400' },
    actividad: { dot: 'bg-emerald-400', text: 'text-emerald-400' },
    efemeride: { dot: 'bg-purple-400', text: 'text-purple-400' },
    campana: { dot: 'bg-rose-400', text: 'text-rose-400' },
    otro: { dot: 'bg-gray-400', text: 'text-gray-400' },
};

const MONTH_NAMES = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface CalendarioSesionesProps {
    fechaInicio: string;
    fechaTermino: string;
    diasSeleccionados: DiaCalendario[];
    totalSesiones: number;
    comunalEvents: CalendarioComunalEvent[];
    onChange: (dias: DiaCalendario[], totalSesiones: number) => void;
    onChangeRange?: (start: string, end: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

function getStartDayOfWeek(year: number, month: number): number {
    const day = new Date(year, month - 1, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday=0 … Sunday=6
}

function formatDateShort(dateStr: string): string {
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
}

function getMonthsInRange(start: string, end: string): { year: number; month: number }[] {
    if (!start || !end) return [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    const months: { year: number; month: number }[] = [];

    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (current <= endDate) {
        months.push({ year: current.getFullYear(), month: current.getMonth() + 1 });
        current.setMonth(current.getMonth() + 1);
    }
    return months;
}

function isDateInUnitRange(dateStr: string, start: string, end: string): boolean {
    return dateStr >= start && dateStr <= end;
}

function getEventsForDate(events: CalendarioComunalEvent[], dateStr: string): CalendarioComunalEvent[] {
    return events.filter(e => {
        if (e.date === dateStr) return true;
        if (e.startDate && e.endDate) {
            return dateStr >= e.startDate && dateStr <= e.endDate;
        }
        return false;
    });
}

function getSesionColor(sesionIdx: number) {
    return SESION_COLORS[sesionIdx % SESION_COLORS.length];
}

// ─── Component ──────────────────────────────────────────────────────────────

export const CalendarioSesiones: React.FC<CalendarioSesionesProps> = ({
    fechaInicio,
    fechaTermino,
    diasSeleccionados,
    comunalEvents,
    onChange,
    onChangeRange,
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [editingDay, setEditingDay] = useState<string | null>(null);
    const [currentSesionIndex, setCurrentSesionIndex] = useState(0);

    // Build month grid range
    const monthsInRange = useMemo(() => getMonthsInRange(fechaInicio, fechaTermino), [fechaInicio, fechaTermino]);

    // Map of selected days for fast lookup
    const diasMap = useMemo(() => {
        const map = new Map<string, DiaCalendario>();
        diasSeleccionados.forEach(d => map.set(d.fecha, d));
        return map;
    }, [diasSeleccionados]);

    // Computed stats
    const totalHoras = useMemo(() => diasSeleccionados.reduce((sum, d) => sum + d.horasPedagogicas, 0), [diasSeleccionados]);
    const sesionesMap = useMemo(() => {
        const map = new Map<number, DiaCalendario[]>();
        diasSeleccionados.forEach(d => {
            const existing = map.get(d.sesionIndex) || [];
            existing.push(d);
            map.set(d.sesionIndex, existing);
        });
        return map;
    }, [diasSeleccionados]);

    // Compute totalSesiones from unique sesionIndex values
    const computedTotalSesiones = useMemo(() => {
        if (diasSeleccionados.length === 0) return 0;
        return Math.max(...diasSeleccionados.map(d => d.sesionIndex)) + 1;
    }, [diasSeleccionados]);

    // ─── Handlers ───────────────────────────────────────────────────────────

    const handleDayClick = useCallback((dateStr: string) => {
        if (!isDateInUnitRange(dateStr, fechaInicio, fechaTermino)) return;

        const existing = diasMap.get(dateStr);
        if (existing) {
            // If clicking on already selected day, open editor
            setEditingDay(dateStr);
        } else {
            // Select new day with current session and 2 hours default
            const newDia: DiaCalendario = {
                fecha: dateStr,
                horasPedagogicas: 2,
                sesionIndex: currentSesionIndex,
            };
            const updated = [...diasSeleccionados, newDia].sort((a, b) => a.fecha.localeCompare(b.fecha));
            const newTotal = Math.max(...updated.map(d => d.sesionIndex)) + 1;
            onChange(updated, newTotal);
            setEditingDay(dateStr);
        }
    }, [diasMap, diasSeleccionados, currentSesionIndex, fechaInicio, fechaTermino, onChange]);

    const handleRemoveDay = useCallback((dateStr: string) => {
        const updated = diasSeleccionados.filter(d => d.fecha !== dateStr);
        const newTotal = updated.length > 0 ? Math.max(...updated.map(d => d.sesionIndex)) + 1 : 0;
        onChange(updated, newTotal);
        setEditingDay(null);
    }, [diasSeleccionados, onChange]);

    const handleUpdateHours = useCallback((dateStr: string, hours: number) => {
        const clamped = Math.max(1, Math.min(6, hours));
        const updated = diasSeleccionados.map(d =>
            d.fecha === dateStr ? { ...d, horasPedagogicas: clamped } : d
        );
        onChange(updated, computedTotalSesiones);
    }, [diasSeleccionados, computedTotalSesiones, onChange]);

    const handleUpdateSesionIndex = useCallback((dateStr: string, sesionIdx: number) => {
        const updated = diasSeleccionados.map(d =>
            d.fecha === dateStr ? { ...d, sesionIndex: sesionIdx } : d
        );
        const newTotal = updated.length > 0 ? Math.max(...updated.map(d => d.sesionIndex)) + 1 : 0;
        onChange(updated, newTotal);
    }, [diasSeleccionados, onChange]);

    const handleAddNewSesion = useCallback(() => {
        setCurrentSesionIndex(computedTotalSesiones);
    }, [computedTotalSesiones]);

    // ─── Render: Month Grid ─────────────────────────────────────────────────

    const renderMonthGrid = (year: number, monthNum: number) => {
        const daysInMonth = getDaysInMonth(year, monthNum);
        const startDay = getStartDayOfWeek(year, monthNum);
        const cells: React.ReactNode[] = [];

        // Empty cells
        for (let i = 0; i < startDay; i++) {
            cells.push(<div key={`empty-${i}`} className="h-10" />);
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isInRange = isDateInUnitRange(dateStr, fechaInicio, fechaTermino);
            const selected = diasMap.get(dateStr);
            const dayEvents = getEventsForDate(comunalEvents, dateStr);
            const hasEvents = dayEvents.length > 0;
            const isEditing = editingDay === dateStr;
            const sesionColor = selected ? getSesionColor(selected.sesionIndex) : null;

            // Check if it's a weekend (Sat=5, Sun=6)
            const dayOfWeek = (startDay + day - 1) % 7;
            const isWeekend = dayOfWeek >= 5;

            cells.push(
                <div
                    key={day}
                    className="relative"
                >
                    <button
                        onClick={() => isInRange && handleDayClick(dateStr)}
                        disabled={!isInRange}
                        className={cn(
                            'w-full h-10 rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 text-[11px] font-bold',
                            !isInRange && 'opacity-20 cursor-not-allowed',
                            isInRange && !selected && 'bg-white/[0.02] border border-white/5', // Added subtle background for range
                            isInRange && !selected && !isWeekend && 'text-gray-400 hover:bg-primary-teal/10 hover:text-white hover:border-primary-teal/20 cursor-pointer',
                            isInRange && !selected && isWeekend && 'text-gray-600 hover:bg-white/5 cursor-pointer',
                            selected && `${sesionColor!.bg} ${sesionColor!.text} ${sesionColor!.border} border-2 shadow-[0_0_15px_-5px_rgba(0,0,0,0.3)] cursor-pointer hover:scale-105`,
                            isEditing && 'ring-2 ring-white/50 scale-105',
                        )}
                    >
                        <span>{day}</span>
                        {selected && (
                            <div className="flex flex-col items-center leading-none mt-0.5">
                                <span className="text-[7px] font-black opacity-90">{selected.horasPedagogicas}h</span>
                            </div>
                        )}
                    </button>

                    {/* Event indicators */}
                    {hasEvents && (
                        <div className="absolute -top-1 -right-1 flex gap-0.5">
                            {dayEvents.slice(0, 2).map((ev, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'w-2 h-2 rounded-full shadow-lg',
                                        EVENT_TYPE_COLORS[ev.type]?.dot || 'bg-yellow-400'
                                    )}
                                    title={ev.title}
                                />
                            ))}
                        </div>
                    )}

                    {/* Day editor popover */}
                    {isEditing && selected && (
                        <div
                            className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 bg-surface-header border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[200px] animate-fade-in"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                    {formatDateShort(dateStr)}
                                </span>
                                <button
                                    onClick={() => setEditingDay(null)}
                                    className="text-gray-500 hover:text-white transition-colors"
                                >
                                    <span className="material-icons-round text-sm">close</span>
                                </button>
                            </div>

                            {/* Hours control */}
                            <div className="space-y-2 mb-4">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">
                                    Horas Pedagógicas
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleUpdateHours(dateStr, selected.horasPedagogicas - 1)}
                                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                                    >
                                        <span className="material-icons-round text-sm">remove</span>
                                    </button>
                                    <span className={cn(
                                        "text-2xl font-black w-10 text-center",
                                        sesionColor!.text
                                    )}>
                                        {selected.horasPedagogicas}
                                    </span>
                                    <button
                                        onClick={() => handleUpdateHours(dateStr, selected.horasPedagogicas + 1)}
                                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                                    >
                                        <span className="material-icons-round text-sm">add</span>
                                    </button>
                                </div>
                            </div>

                            {/* Session selector */}
                            <div className="space-y-2 mb-4">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">
                                    Asignar a Sesión
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {Array.from({ length: Math.max(computedTotalSesiones, 1) + 1 }, (_, i) => {
                                        const c = getSesionColor(i);
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleUpdateSesionIndex(dateStr, i)}
                                                className={cn(
                                                    'w-8 h-8 rounded-lg text-[10px] font-black transition-all border',
                                                    selected.sesionIndex === i
                                                        ? `${c.bg} ${c.text} ${c.border} scale-110 shadow-lg`
                                                        : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                                                )}
                                            >
                                                S{i + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Event badges for this day */}
                            {dayEvents.length > 0 && (
                                <div className="space-y-1.5 mb-3 pt-3 border-t border-white/5">
                                    <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">
                                        Eventos M03
                                    </span>
                                    {dayEvents.map((ev, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className={cn('w-1.5 h-1.5 rounded-full', EVENT_TYPE_COLORS[ev.type]?.dot || 'bg-yellow-400')} />
                                            <span className="text-[10px] text-gray-300 truncate">{ev.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Remove button */}
                            <button
                                onClick={() => handleRemoveDay(dateStr)}
                                className="w-full py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors"
                            >
                                Quitar Día
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="bg-surface-card/50 rounded-2xl border border-white/5 p-4">
                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">
                    {MONTH_NAMES[monthNum]}
                </h4>
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {DAY_LABELS.map(d => (
                        <div key={d} className="text-center text-[8px] font-bold text-gray-600 uppercase">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">{cells}</div>
            </div>
        );
    };

    // ─── Render: Session Summary ─────────────────────────────────────────────

    const renderSesionSummary = () => {
        if (diasSeleccionados.length === 0) return null;

        const sortedSesiones = Array.from(sesionesMap.entries()).sort((a, b) => a[0] - b[0]);

        return (
            <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <span className="material-icons-round text-sm text-primary-teal">view_timeline</span>
                        Sesiones Planificadas ({computedTotalSesiones})
                    </h4>
                    <button
                        onClick={handleAddNewSesion}
                        className="text-[9px] font-black text-primary-teal uppercase tracking-widest px-3 py-1.5 rounded-lg bg-primary-teal/10 border border-primary-teal/20 hover:bg-primary-teal/20 transition-colors flex items-center gap-1"
                    >
                        <span className="material-icons-round text-xs">add</span>
                        Nueva Sesión
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sortedSesiones.map(([sesIdx, dias]) => {
                        const c = getSesionColor(sesIdx);
                        const totalH = dias.reduce((sum, d) => sum + d.horasPedagogicas, 0);
                        const sortedDias = [...dias].sort((a, b) => a.fecha.localeCompare(b.fecha));

                        return (
                            <div
                                key={sesIdx}
                                className={cn(
                                    'rounded-2xl border p-4 transition-all',
                                    c.bg, c.border,
                                    currentSesionIndex === sesIdx && 'ring-2 ring-white/20 scale-[1.01]'
                                )}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <button
                                        onClick={() => setCurrentSesionIndex(sesIdx)}
                                        className="flex items-center gap-2 group"
                                    >
                                        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center border', c.bg, c.border)}>
                                            <span className={cn('text-[10px] font-black', c.text)}>S{sesIdx + 1}</span>
                                        </div>
                                        <span className="text-xs font-black text-white uppercase tracking-tight group-hover:text-primary-teal transition-colors">
                                            Sesión {sesIdx + 1}
                                        </span>
                                    </button>
                                    <span className={cn('text-sm font-black', c.text)}>{totalH}h</span>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {sortedDias.map(dia => (
                                        <span
                                            key={dia.fecha}
                                            className="text-[9px] font-bold text-gray-300 bg-white/5 px-2 py-1 rounded-lg border border-white/5"
                                        >
                                            {formatDateShort(dia.fecha)} ({dia.horasPedagogicas}h)
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ─── Render: Events List ────────────────────────────────────────────────

    const renderEventsInRange = () => {
        const eventsInRange = comunalEvents.filter(ev => {
            const d = ev.date || ev.startDate;
            if (!d) return false;
            return d >= fechaInicio && d <= fechaTermino;
        });

        if (eventsInRange.length === 0) return null;

        return (
            <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 mb-3">
                    <span className="material-icons-round text-sm text-yellow-500">event_note</span>
                    <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">
                        Calendario Comunal en este período ({eventsInRange.length})
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {eventsInRange.map((ev, i) => {
                        const colors = EVENT_TYPE_COLORS[ev.type] || EVENT_TYPE_COLORS.otro;
                        return (
                            <div
                                key={i}
                                className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-2 hover:border-yellow-500/30 transition-all"
                            >
                                <div className={cn('w-2 h-2 rounded-full', colors.dot)} />
                                <div>
                                    <p className="text-[10px] text-white font-bold leading-tight">{ev.title}</p>
                                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">
                                        {ev.date ? formatDateShort(ev.date) : ev.startDate ? `${formatDateShort(ev.startDate)} — ${formatDateShort(ev.endDate!)}` : 'Variable'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ─── Main Render ────────────────────────────────────────────────────────

    if (!fechaInicio || !fechaTermino) {
        return (
            <Card variant="flat" className="border-dashed border-white/10">
                <div className="py-10 text-center space-y-2">
                    <span className="material-icons-round text-3xl text-gray-700">calendar_month</span>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                        Las fechas se heredan del Plan Anual (M03)
                    </p>
                    <p className="text-[10px] text-gray-600">
                        Configura las fechas de la unidad en el módulo de Propósitos y Enfoques.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card variant="strong" className="overflow-visible">
            {/* Header (always visible) */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between group text-left"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-teal/20 to-brand-magenta/20 flex items-center justify-center border border-white/10 group-hover:border-primary-teal/30 transition-all">
                        <span className="material-icons-round text-primary-teal text-xl">date_range</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-primary-teal transition-colors">
                            Calendario de Sesiones
                        </h3>
                        <div className="flex items-center gap-3 mt-1" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                                <span className="material-icons-round text-[12px] text-gray-500">calendar_today</span>
                                <input
                                    type="date"
                                    value={fechaInicio}
                                    onChange={(e) => onChangeRange?.(e.target.value, fechaTermino)}
                                    className="bg-transparent text-[10px] font-bold text-gray-400 focus:outline-none focus:text-primary-teal cursor-pointer w-[95px]"
                                />
                                <span className="text-[10px] text-gray-600">—</span>
                                <input
                                    type="date"
                                    value={fechaTermino}
                                    onChange={(e) => onChangeRange?.(fechaInicio, e.target.value)}
                                    className="bg-transparent text-[10px] font-bold text-gray-400 focus:outline-none focus:text-primary-teal cursor-pointer w-[95px]"
                                />
                            </div>
                            {diasSeleccionados.length > 0 && (
                                <>
                                    <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                    <span className="text-[10px] font-black text-primary-teal">
                                        {computedTotalSesiones} sesión{computedTotalSesiones !== 1 ? 'es' : ''}
                                    </span>
                                    <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                    <span className="text-[10px] font-bold text-gray-400">
                                        {totalHoras}h pedagógicas
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <span className={cn(
                    "material-icons-round text-gray-500 group-hover:text-primary-teal transition-all duration-300",
                    isExpanded ? "rotate-180" : ""
                )}>
                    expand_more
                </span>
            </button>

            {/* Expanded content */}
            {isExpanded && (
                <div className="mt-6 space-y-4 animate-fade-in" onClick={() => setEditingDay(null)}>
                    {/* Session selector toolbar */}
                    <div className="flex items-center gap-3 p-3 bg-white/2 rounded-2xl border border-white/5">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">
                            Pintando:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {Array.from({ length: Math.max(computedTotalSesiones, 1) + 1 }, (_, i) => {
                                const c = getSesionColor(i);
                                return (
                                    <button
                                        key={i}
                                        onClick={(e) => { e.stopPropagation(); setCurrentSesionIndex(i); }}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border',
                                            currentSesionIndex === i
                                                ? `${c.bg} ${c.text} ${c.border} shadow-lg`
                                                : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                                        )}
                                    >
                                        Sesión {i + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="ml-auto flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[8px] text-primary-teal font-black uppercase tracking-widest bg-primary-teal/10 px-2 py-1 rounded-md border border-primary-teal/20">
                                <div className="w-2 h-2 rounded-full bg-primary-teal/30 border border-primary-teal/50" />
                                Duración Unidad
                            </div>
                            <div className="flex items-center gap-1.5 text-[8px] text-amber-500 font-black uppercase tracking-widest">
                                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                                Festivo / Comunal
                            </div>
                        </div>
                    </div>

                    {/* Month grids */}
                    <div className={cn(
                        "grid gap-4",
                        monthsInRange.length === 1 && "grid-cols-1",
                        monthsInRange.length === 2 && "grid-cols-1 md:grid-cols-2",
                        monthsInRange.length >= 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                    )}>
                        {monthsInRange.map(({ year, month }) => (
                            <div key={`${year}-${month}`} onClick={e => e.stopPropagation()}>
                                {renderMonthGrid(year, month)}
                            </div>
                        ))}
                    </div>

                    {/* Quick guide */}
                    {diasSeleccionados.length === 0 && (
                        <div className="p-4 bg-primary-teal/5 border border-primary-teal/10 rounded-2xl">
                            <div className="flex gap-3">
                                <span className="material-icons-round text-primary-teal">touch_app</span>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">¿Cómo usar?</p>
                                    <ol className="text-[10px] text-gray-400 space-y-1 list-decimal ml-4">
                                        <li>Los días con <strong className="text-primary-teal/80">fondo tenue</strong> indican la duración oficial de la unidad.</li>
                                        <li>Selecciona una <strong className="text-white">Sesión</strong> en la barra superior ("Pintando").</li>
                                        <li>Haz clic en los <strong className="text-white">días</strong> para asignar esa sesión.</li>
                                        <li>Define las <strong className="text-white">horas pedagógicas</strong> en el popup de cada día.</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Session summary */}
                    {renderSesionSummary()}

                    {/* M03 Events in range */}
                    {renderEventsInRange()}
                </div>
            )}
        </Card>
    );
};

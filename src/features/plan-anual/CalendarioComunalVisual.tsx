import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/cn';
import { AIButton } from '@/components/ui/AIButton';
import { Spinner } from '@/components/ui/Spinner';
import { ENFOQUES_TRANSVERSALES } from '@/services/cneb/enfoques-transversales';
import { chatCompletion } from '@/services/ai';
import { useAIConfigStore, useNotificationStore } from '@/store';
import type {
    CalendarioComunalEvent,
    CalendarioComunalData,
    EventoTipo,
    DateConfidence,
} from '@/types/schemas';

// ─── Constants ─────────────────────────────────────────────────────────────────

const MONTHS = [
    { num: 3, name: 'Marzo' },
    { num: 4, name: 'Abril' },
    { num: 5, name: 'Mayo' },
    { num: 6, name: 'Junio' },
    { num: 7, name: 'Julio' },
    { num: 8, name: 'Agosto' },
    { num: 9, name: 'Septiembre' },
    { num: 10, name: 'Octubre' },
    { num: 11, name: 'Noviembre' },
    { num: 12, name: 'Diciembre' },
];

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const EVENT_COLORS: Record<EventoTipo, { bg: string; border: string; dot: string; text: string }> = {
    festividad: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', dot: 'bg-amber-400', text: 'text-amber-400' },
    hito: { bg: 'bg-blue-500/15', border: 'border-blue-500/40', dot: 'bg-blue-400', text: 'text-blue-400' },
    actividad: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', dot: 'bg-emerald-400', text: 'text-emerald-400' },
    efemeride: { bg: 'bg-purple-500/15', border: 'border-purple-500/40', dot: 'bg-purple-400', text: 'text-purple-400' },
    campana: { bg: 'bg-rose-500/15', border: 'border-rose-500/40', dot: 'bg-rose-400', text: 'text-rose-400' },
    otro: { bg: 'bg-gray-500/15', border: 'border-gray-500/40', dot: 'bg-gray-400', text: 'text-gray-400' },
};

const CONFIDENCE_ICONS: Record<DateConfidence, { icon: string; color: string; label: string }> = {
    alta: { icon: 'verified', color: 'text-emerald-400', label: 'Fecha confirmada' },
    media: { icon: 'help_outline', color: 'text-amber-400', label: 'Fecha aproximada' },
    baja: { icon: 'warning_amber', color: 'text-rose-400', label: 'Fecha incierta' },
};

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Props {
    calendarioComunal: string;
    data: CalendarioComunalData | null;
    onUpdateData: (data: CalendarioComunalData) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

/** Monday=0 … Sunday=6 */
function getStartDayOfWeek(year: number, month: number): number {
    const day = new Date(year, month - 1, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

function formatDate(d: string | null): string {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
}

function isDateInRange(dateStr: string, evt: CalendarioComunalEvent): boolean {
    if (evt.date === dateStr) return true;
    if (evt.startDate && evt.endDate) {
        return dateStr >= evt.startDate && dateStr <= evt.endDate;
    }
    return false;
}

function getEventsForDate(events: CalendarioComunalEvent[], dateStr: string): CalendarioComunalEvent[] {
    return events.filter((e) => {
        // No mostrar puntos en el grid para fechas variables/aproximadas (confianza baja) 
        // para no spamear todo el mes. Se mostrarán en la lista debajo del grid.
        if (e.dateConfidence === 'baja') return false;
        return isDateInRange(dateStr, e);
    });
}

function getEventsForMonth(events: CalendarioComunalEvent[], year: number, month: number): CalendarioComunalEvent[] {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return events.filter((e) => {
        if (e.date?.startsWith(prefix)) return true;
        if (e.startDate && e.endDate) {
            const monthStart = `${prefix}-01`;
            const monthEnd = `${prefix}-${getDaysInMonth(year, month)}`;
            return e.startDate <= monthEnd && e.endDate >= monthStart;
        }
        return false;
    });
}

// ─── Component ─────────────────────────────────────────────────────────────────

export const CalendarioComunalVisual: React.FC<Props> = ({
    calendarioComunal,
    data,
    onUpdateData,
}) => {
    const { aiConfig, getDecryptedApiKey } = useAIConfigStore();
    const { showNotification } = useNotificationStore();

    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(data?.selectedYear || currentYear);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [aiLoading, setAiLoading] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarioComunalEvent | null>(null);
    const [hoveredDate, setHoveredDate] = useState<string | null>(null);

    const events = useMemo(() => data?.events || [], [data]);

    // ─── Year change ──────────────────────────────────────────────────────
    const handleYearChange = useCallback((year: number) => {
        setSelectedYear(year);
        onUpdateData({
            selectedYear: year,
            events: events,
        });
    }, [events, onUpdateData]);

    // ─── Delete event ─────────────────────────────────────────────────────
    const handleDeleteEvent = useCallback((eventId: string) => {
        const updated = events.filter((e) => e.id !== eventId);
        onUpdateData({ selectedYear, events: updated });
    }, [events, selectedYear, onUpdateData]);

    // ─── Save edited event ────────────────────────────────────────────────
    const handleSaveEvent = useCallback((evt: CalendarioComunalEvent) => {
        const idx = events.findIndex((e) => e.id === evt.id);
        const updated = [...events];
        if (idx >= 0) {
            updated[idx] = evt;
        } else {
            updated.push(evt);
        }
        onUpdateData({ selectedYear, events: updated });
        setEditingEvent(null);
    }, [events, selectedYear, onUpdateData]);

    // ─── Toggle needsReview ───────────────────────────────────────────────
    const handleToggleReview = useCallback((eventId: string) => {
        const updated = events.map((e) =>
            e.id === eventId ? { ...e, needsReview: !e.needsReview } : e
        );
        onUpdateData({ selectedYear, events: updated });
    }, [events, selectedYear, onUpdateData]);

    // ─── Helper: validar fecha ISO ───────────────────────────────────────
    // ─── Helper: normalizar fecha a YYYY-MM-DD ───────────────────────────
    const normalizeDate = (d: any): string | null => {
        if (!d || typeof d !== 'string') return null;
        let s = d.trim().split('T')[0]; // Remove timestamp if any

        // Formato ISO extendido o directo: YYYY-MM-DD o YYYY/MM/DD
        let match = s.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
        if (match) {
            const y = match[1];
            const m = parseInt(match[2], 10);
            const dayNum = parseInt(match[3], 10);
            if (m >= 1 && m <= 12 && dayNum >= 1 && dayNum <= 31) {
                return `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            }
        }

        // Formato Latino: DD/MM/YYYY o DD-MM-YYYY
        match = s.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
        if (match) {
            const dayNum = parseInt(match[1], 10);
            const m = parseInt(match[2], 10);
            const y = match[3];
            if (m >= 1 && m <= 12 && dayNum >= 1 && dayNum <= 31) {
                return `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            }
        }

        // Formato Corto: MM-DD o DD-MM (asume selectedYear)
        match = s.match(/^(\d{1,2})[/-](\d{1,2})$/);
        if (match) {
            // Intuir si es DD-MM o MM-DD. Usualmente es DD-MM en LATAM.
            let first = parseInt(match[1], 10);
            let second = parseInt(match[2], 10);
            let m, dayNum;

            if (first > 12) {
                dayNum = first; m = second;
            } else if (second > 12) {
                m = first; dayNum = second;
            } else {
                // Ambiguo, en Perú asumimos DD-MM
                dayNum = first; m = second;
            }

            if (m >= 1 && m <= 12 && dayNum >= 1 && dayNum <= 31) {
                return `${selectedYear}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            }
        }

        return null;
    };

    // ─── AI: Poblar con IA ────────────────────────────────────────────────
    const handlePoblarConIA = useCallback(async () => {
        if (!calendarioComunal.trim()) {
            showNotification({
                title: 'Sin texto',
                message: 'Escribe primero una descripción del calendario comunal antes de poblar con IA.',
                type: 'warning',
                duration: 3000,
            });
            return;
        }

        showNotification({
            title: 'Extrayendo Eventos',
            message: 'La IA está analizando tu texto para identificar festividades, hitos y actividades...',
            type: 'info',
            duration: 5000,
        });

        setAiLoading(true);
        try {
            // Limpieza de "ruido" bibliográfico que confunde a la IA (ej: [gob.pe], [unesco.org])
            const textoLimpio = calendarioComunal
                .replace(/\[https?:\/\/[^\]]+\]/g, '') // Elimina [http...]
                .replace(/\[\w+\.\w+(\.\w+)?\]/g, '') // Elimina [gob.pe], [unesco.org], etc.
                .trim();

            const prompt = `Año Lectivo: ${selectedYear} (Perú).
Extrae TODOS los eventos, festividades y efemérides del siguiente texto, desde MARZO hasta DICIEMBRE. 

REGLAS CRÍTICAS:
1. No te detengas en marzo o abril. Lee el texto completo hasta el final.
2. Identifica el mes por los encabezados (MARZO, ABRIL, etc.) o por el contexto de la fecha.
3. Para cada fecha variable (ej: "segundo domingo de mayo" o "variable") marca "needsReview": true.
4. Si solo menciona el mes, pon startDate el primer día y endDate el último día de dicho mes.

Para cada evento devuelve un objeto con:
- "title": Nombre del evento (máximo 40 caracteres).
- "type": festividad, hito, actividad, efemeride, campana, otro.
- "date": "${selectedYear}-MM-DD" para fechas exactas, o null si es rango/variable.
- "startDate": "${selectedYear}-MM-DD" solo si date es null.
- "endDate": "${selectedYear}-MM-DD" solo si date es null.
- "dateConfidence": "alta" (exacta), "media" (mes/rango), "baja" (variable).
- "needsReview": boolean.

TEXTO A PROCESAR:
${textoLimpio}

Responde ÚNICAMENTE con el JSON: {"events": [...]}`;

            const apiKey = await getDecryptedApiKey();
            const result = await chatCompletion(
                'Eres un extractor experto de calendarios escolares peruanos. Tu prioridad es la COBERTURA TOTAL de los 12 meses. Responde SOLO JSON válido.',
                prompt,
                {
                    apiKey,
                    provider: aiConfig.provider,
                    customUrl: aiConfig.lmstudioUrl,
                    model: aiConfig.activeModel,
                    temperature: 0.1,
                    maxTokens: 5000,
                }
            );

            // chatCompletion() ya devuelve un objeto parseado (Gemini usa responseMimeType: "application/json")
            // Solo necesitamos parsear si por alguna razón devuelve un string o si el motor principal falló al parsear y lo devolvió como string
            console.log('[IA Calendario] Tipo:', typeof result, '| Preview:', JSON.stringify(result).substring(0, 400));
            let parsed: any = result;
            if (typeof result === 'string') {
                try {
                    parsed = JSON.parse(result);
                } catch {
                    // Recuperador avanzado de JSON truncado
                    let recoveryStr = result.trim();
                    const lastBrace = recoveryStr.lastIndexOf('}');
                    if (lastBrace > -1) {
                        // Intento 1: Cortar hasta la última llave de objeto completado
                        try {
                            const substr = recoveryStr.substring(0, lastBrace + 1);
                            // Auto-completar arrays/objetos base
                            const openBrackets = (substr.match(/\[/g) || []).length - (substr.match(/\]/g) || []).length;
                            const openBraces = (substr.match(/\{/g) || []).length - (substr.match(/\}/g) || []).length;
                            let patch = substr;
                            if (patch.endsWith(',"')) { patch = patch.slice(0, -2); }
                            else if (patch.endsWith(',')) { patch = patch.slice(0, -1); }

                            for (let i = 0; i < openBrackets; i++) patch += ']';
                            for (let i = 0; i < openBraces; i++) patch += '}';
                            parsed = JSON.parse(patch);
                        } catch (e2) {
                            // Intento 2: Extractor estricto con regex en crudo
                            const jsonMatch = result.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                try {
                                    parsed = JSON.parse(jsonMatch[0]);
                                } catch (e3) {
                                    throw new Error(`Error de redacción en la IA (se cortó a medias). Result: ${e3}`);
                                }
                            } else {
                                throw new Error('La IA se quedó sin palabras y envió un texto incompleto.');
                            }
                        }
                    } else {
                        throw new Error('La respuesta de la IA llegó completamente cortada.');
                    }
                }
            }

            // Soporte para variaciones en el nombre del campo: events / eventos
            const rawEvents = parsed?.events || parsed?.eventos || parsed?.Events;
            if (!rawEvents || !Array.isArray(rawEvents)) {
                console.error('[IA Calendario] Respuesta recibida:', JSON.stringify(parsed).slice(0, 500));
                throw new Error('La respuesta no contiene un array de eventos. Intenta de nuevo.');
            }

            // Tipos válidos para EventoTipo
            const validTypes = new Set(['festividad', 'hito', 'actividad', 'efemeride', 'campana', 'otro']);

            // Normalizar y validar eventos
            const newEvents: CalendarioComunalEvent[] = rawEvents
                .filter((e: any) => e && (e.title || e.titulo || e.nombre))
                .map((e: any) => {
                    const date = e.date || e.fecha || null;
                    const startDate = e.startDate || e.fechaInicio || null;
                    const endDate = e.endDate || e.fechaFin || null;

                    let rawType = String(e.type || e.tipo || 'otro').trim().toLowerCase();
                    // Limpiar acentos y variaciones
                    if (rawType.includes('efem')) rawType = 'efemeride';
                    if (rawType.includes('campa')) rawType = 'campana';
                    if (rawType.includes('festiv')) rawType = 'festividad';
                    if (rawType.includes('activ')) rawType = 'actividad';

                    return {
                        id: `evt-${crypto.randomUUID().slice(0, 8)}`,
                        title: e.title || e.titulo || e.nombre || 'Sin título',
                        type: validTypes.has(rawType) ? rawType : 'otro',
                        date: normalizeDate(date),
                        startDate: normalizeDate(startDate),
                        endDate: normalizeDate(endDate),
                        recurrence: e.recurrence || e.recurrencia || null,
                        description: (e.description || e.descripcion || '').slice(0, 60),
                        transversalApproaches: Array.isArray(e.transversalApproaches || e.enfoques)
                            ? (e.transversalApproaches || e.enfoques)
                            : [],
                        tags: Array.isArray(e.tags || e.etiquetas) ? (e.tags || e.etiquetas) : [],
                        generatedByAI: true,
                        dateConfidence: (['alta', 'media', 'baja'].includes(e.dateConfidence || e.confianza)
                            ? (e.dateConfidence || e.confianza)
                            : 'media') as DateConfidence,
                        needsReview: e.needsReview ?? e.revisar ?? (!date && !startDate),
                        sourceText: (e.sourceText || e.textoFuente || '').slice(0, 60),
                    } as CalendarioComunalEvent;
                });

            if (newEvents.length === 0) {
                showNotification({
                    title: 'Sin Eventos',
                    message: 'La IA no encontró eventos reconocibles en tu texto. Intenta ser más específico describiendo festividades, fechas o actividades.',
                    type: 'warning',
                    duration: 5000,
                });
                return;
            }

            // MODO REEMPLAZO: Eliminar eventos previos generados por IA, conservar los manuales
            const manualEvents = events.filter(e => !e.generatedByAI);
            const finalEvents = [...manualEvents, ...newEvents];

            onUpdateData({ selectedYear, events: finalEvents });

            const reviewCount = newEvents.filter(e => e.needsReview).length;
            showNotification({
                title: '¡Calendario Poblado!',
                message: `Se extrajeron ${newEvents.length} evento(s) del texto.${reviewCount > 0 ? ` ${reviewCount} necesitan revisión (⚠️).` : ' Todo listo.'}`,
                type: 'success',
                duration: 5000,
            });
        } catch (err: any) {
            console.error('[IA Calendario] Error:', err);
            showNotification({
                title: 'Error de IA',
                message: err.message || 'No se pudo poblar el calendario. Revisa tu conexión e intenta de nuevo.',
                type: 'error',
            });
        } finally {
            setAiLoading(false);
        }
    }, [calendarioComunal, selectedYear, events, aiConfig, getDecryptedApiKey, onUpdateData, showNotification]);

    // ─── Render: Month Grid ───────────────────────────────────────────────
    const renderMonthGrid = (monthNum: number, monthName: string) => {
        const daysInMonth = getDaysInMonth(selectedYear, monthNum);
        const startDay = getStartDayOfWeek(selectedYear, monthNum);
        const monthEvents = getEventsForMonth(events, selectedYear, monthNum);
        const cells: React.ReactNode[] = [];

        // Empty cells before first day
        for (let i = 0; i < startDay; i++) {
            cells.push(<div key={`empty-${i}`} className="h-8" />);
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${selectedYear}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = getEventsForDate(monthEvents, dateStr);
            const hasEvents = dayEvents.length > 0;
            const hasReview = dayEvents.some((e) => e.needsReview);
            const isHovered = hoveredDate === dateStr;

            cells.push(
                <div
                    key={day}
                    className={cn(
                        'h-8 rounded-lg flex items-center justify-center relative cursor-pointer transition-all duration-200 text-[11px]',
                        hasEvents
                            ? 'bg-primary-teal/10 text-primary-teal font-bold hover:bg-primary-teal/20'
                            : 'text-gray-500 hover:bg-white/5',
                        isHovered && 'ring-1 ring-primary-teal/50'
                    )}
                    onMouseEnter={() => setHoveredDate(dateStr)}
                    onMouseLeave={() => setHoveredDate(null)}
                    title={dayEvents.map((e) => e.title).join(', ') || undefined}
                >
                    {day}
                    {hasEvents && (
                        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {dayEvents.slice(0, 3).map((e, i) => (
                                <div
                                    key={i}
                                    className={cn('w-1 h-1 rounded-full', EVENT_COLORS[e.type]?.dot || 'bg-primary-teal')}
                                />
                            ))}
                        </div>
                    )}
                    {hasReview && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                </div>
            );
        }

        return (
            <div className="bg-surface-card/50 rounded-2xl border border-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">{monthName}</h4>
                    {monthEvents.length > 0 && (
                        <span className="text-[9px] font-bold text-primary-teal bg-primary-teal/10 px-2 py-0.5 rounded-full">
                            {monthEvents.length} evento{monthEvents.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                {/* Day labels */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {DAY_LABELS.map((d) => (
                        <div key={d} className="text-center text-[8px] font-bold text-gray-600 uppercase">
                            {d}
                        </div>
                    ))}
                </div>
                {/* Day grid */}
                <div className="grid grid-cols-7 gap-1">{cells}</div>

                {/* Variable/Approximate Events List */}
                {monthEvents.filter(e => e.dateConfidence === 'baja').length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5 animate-fade-in">
                        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <span className="material-icons-round text-[10px]">auto_awesome</span>
                            Fechas Variables
                        </div>
                        {monthEvents.filter(e => e.dateConfidence === 'baja').map(evt => (
                            <div
                                key={evt.id}
                                className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 rounded-lg border bg-surface-base border-white/5",
                                    evt.needsReview && "ring-1 ring-amber-400/30"
                                )}
                                title={evt.description || evt.type}
                            >
                                <div className={cn('w-1.5 h-1.5 rounded-full', EVENT_COLORS[evt.type]?.dot || 'bg-primary-teal')} />
                                <span className="text-[10px] text-gray-300 truncate flex-1 font-medium">{evt.title}</span>
                                {evt.needsReview && (
                                    <span className="material-icons-round text-[10px] text-amber-500">warning</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // ─── Render: Event Card (list view) ───────────────────────────────────
    const renderEventCard = (evt: CalendarioComunalEvent) => {
        const colors = EVENT_COLORS[evt.type] || EVENT_COLORS.otro;
        const confidence = CONFIDENCE_ICONS[evt.dateConfidence];
        const enfoqueNames = evt.transversalApproaches
            .map((id) => ENFOQUES_TRANSVERSALES.find((e) => e.id === id)?.nombre)
            .filter(Boolean);

        return (
            <div
                key={evt.id}
                className={cn(
                    'rounded-xl border p-4 transition-all duration-200 hover:scale-[1.01] group',
                    colors.bg,
                    colors.border,
                    evt.needsReview && 'ring-1 ring-amber-400/30'
                )}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn('text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full', colors.bg, colors.text)}>
                                {evt.type}
                            </span>
                            <span className={cn('material-icons-round text-[14px]', confidence.color)} title={confidence.label}>
                                {confidence.icon}
                            </span>
                            {evt.needsReview && (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full animate-pulse">
                                    ⚠️ Revisar
                                </span>
                            )}
                            {evt.generatedByAI && (
                                <span className="material-icons-round text-[12px] text-primary-teal/50" title="Generado por IA">
                                    auto_awesome
                                </span>
                            )}
                        </div>
                        <h5 className="text-sm font-bold text-white leading-tight mb-1">{evt.title}</h5>
                        <p className="text-[10px] text-gray-400 leading-relaxed mb-2">{evt.description}</p>

                        {/* Date */}
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-2">
                            <span className="material-icons-round text-[14px]">calendar_today</span>
                            {evt.date ? formatDate(evt.date) : evt.startDate && evt.endDate ? `${formatDate(evt.startDate)} — ${formatDate(evt.endDate)}` : 'Sin fecha definida'}
                            {evt.recurrence && (
                                <span className="ml-2 text-primary-teal/70">
                                    <span className="material-icons-round text-[12px] align-middle">repeat</span> {evt.recurrence}
                                </span>
                            )}
                        </div>

                        {/* Enfoques */}
                        {enfoqueNames.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {enfoqueNames.map((name, i) => (
                                    <span key={i} className="text-[8px] font-bold text-primary-teal/70 bg-primary-teal/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Tags */}
                        {evt.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {evt.tags.map((tag, i) => (
                                    <span key={i} className="text-[8px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => handleToggleReview(evt.id)}
                            className={cn(
                                'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                                evt.needsReview ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                            )}
                            title={evt.needsReview ? 'Marcar como revisado' : 'Marcar para revisión'}
                        >
                            <span className="material-icons-round text-[14px]">{evt.needsReview ? 'check_circle' : 'flag'}</span>
                        </button>
                        <button
                            onClick={() => setEditingEvent(evt)}
                            className="w-7 h-7 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors"
                            title="Editar"
                        >
                            <span className="material-icons-round text-[14px]">edit</span>
                        </button>
                        <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                            title="Eliminar"
                        >
                            <span className="material-icons-round text-[14px]">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ─── Render: Edit Modal ───────────────────────────────────────────────
    const renderEditModal = () => {
        if (!editingEvent) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setEditingEvent(null)}>
                <div className="bg-surface-card rounded-2xl border border-white/10 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Editar Evento</h3>
                        <button onClick={() => setEditingEvent(null)} className="text-gray-500 hover:text-white transition-colors">
                            <span className="material-icons-round">close</span>
                        </button>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Título</label>
                        <input
                            type="text"
                            value={editingEvent.title}
                            onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                            className="w-full mt-1 bg-surface-card border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-teal/40"
                        />
                    </div>

                    {/* Type + Confidence */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tipo</label>
                            <select
                                value={editingEvent.type}
                                onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value as EventoTipo })}
                                className="w-full mt-1 bg-surface-card border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-teal/40"
                            >
                                {Object.keys(EVENT_COLORS).map((t) => (
                                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Confianza fecha</label>
                            <select
                                value={editingEvent.dateConfidence}
                                onChange={(e) => setEditingEvent({ ...editingEvent, dateConfidence: e.target.value as DateConfidence })}
                                className="w-full mt-1 bg-surface-card border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-teal/40"
                            >
                                <option value="alta">Alta</option>
                                <option value="media">Media</option>
                                <option value="baja">Baja</option>
                            </select>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fecha única</label>
                            <input
                                type="date"
                                value={editingEvent.date || ''}
                                onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value || null, startDate: null, endDate: null })}
                                className="w-full mt-1 bg-surface-card border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-teal/40"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Inicio rango</label>
                            <input
                                type="date"
                                value={editingEvent.startDate || ''}
                                onChange={(e) => setEditingEvent({ ...editingEvent, startDate: e.target.value || null, date: null })}
                                className="w-full mt-1 bg-surface-card border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-teal/40"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fin rango</label>
                            <input
                                type="date"
                                value={editingEvent.endDate || ''}
                                onChange={(e) => setEditingEvent({ ...editingEvent, endDate: e.target.value || null, date: null })}
                                className="w-full mt-1 bg-surface-card border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-teal/40"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Descripción</label>
                        <textarea
                            value={editingEvent.description}
                            onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                            className="w-full mt-1 h-20 bg-surface-card border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-teal/40 resize-none"
                        />
                    </div>

                    {/* Enfoques */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Enfoques Transversales</label>
                        <div className="flex flex-wrap gap-2">
                            {ENFOQUES_TRANSVERSALES.map((enf) => {
                                const isSelected = editingEvent.transversalApproaches.includes(enf.id);
                                return (
                                    <button
                                        key={enf.id}
                                        onClick={() => {
                                            const approaches = isSelected
                                                ? editingEvent.transversalApproaches.filter((id) => id !== enf.id)
                                                : [...editingEvent.transversalApproaches, enf.id];
                                            setEditingEvent({ ...editingEvent, transversalApproaches: approaches });
                                        }}
                                        className={cn(
                                            'text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all uppercase tracking-wider',
                                            isSelected
                                                ? 'bg-primary-teal/20 border-primary-teal/50 text-primary-teal'
                                                : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                                        )}
                                    >
                                        {enf.nombre}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* needsReview */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setEditingEvent({ ...editingEvent, needsReview: !editingEvent.needsReview })}
                            className={cn(
                                'w-5 h-5 rounded border transition-all',
                                editingEvent.needsReview ? 'bg-amber-400 border-amber-400' : 'bg-white/5 border-white/10'
                            )}
                        >
                            {editingEvent.needsReview && <span className="material-icons-round text-[14px] text-gray-900">check</span>}
                        </button>
                        <span className="text-[10px] text-gray-400">Necesita revisión docente</span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setEditingEvent(null)}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => handleSaveEvent(editingEvent)}
                            className="px-5 py-2.5 rounded-xl text-xs font-black text-gray-900 bg-primary-teal hover:shadow-[0_0_20px_rgba(79,209,197,0.3)] transition-all uppercase tracking-wider"
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ─── Main Render ──────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header: Year selector + View toggle + AI button */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    {/* Year Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Año lectivo</span>
                        <div className="flex gap-1 bg-surface-card rounded-xl p-1 border border-white/5">
                            {YEAR_OPTIONS.map((y) => (
                                <button
                                    key={y}
                                    onClick={() => handleYearChange(y)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all',
                                        selectedYear === y
                                            ? 'bg-primary-teal text-gray-900 shadow-[0_0_12px_rgba(79,209,197,0.3)]'
                                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                                    )}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* View toggle */}
                    <div className="flex gap-1 bg-surface-card rounded-xl p-1 border border-white/5">
                        {([
                            { key: 'grid' as const, icon: 'calendar_view_month', label: 'Grid' },
                            { key: 'list' as const, icon: 'view_list', label: 'Lista' },
                        ]).map((v) => (
                            <button
                                key={v.key}
                                onClick={() => setViewMode(v.key)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5',
                                    viewMode === v.key
                                        ? 'bg-primary-teal/20 text-primary-teal'
                                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                                )}
                            >
                                <span className="material-icons-round text-[14px]">{v.icon}</span>
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions: Add Manual + AI Button */}
                <div className="flex items-center gap-3">
                    {events.length > 0 && (
                        <span className="text-[10px] font-bold text-gray-500 hidden sm:inline">
                            {events.length} evento{events.length > 1 ? 's' : ''} •
                            {events.filter((e) => e.needsReview).length} pendiente{events.filter((e) => e.needsReview).length !== 1 ? 's' : ''}
                        </span>
                    )}
                    <button
                        onClick={() => {
                            setEditingEvent({
                                id: `evt-${crypto.randomUUID().slice(0, 8)}`,
                                title: '',
                                type: 'otro',
                                date: null,
                                startDate: null,
                                endDate: null,
                                recurrence: null,
                                description: '',
                                transversalApproaches: [],
                                tags: [],
                                generatedByAI: false,
                                dateConfidence: 'alta',
                                needsReview: false,
                                sourceText: '',
                            });
                        }}
                        className="h-10 px-4 rounded-xl flex items-center gap-2 text-xs font-bold text-gray-400 bg-surface-card border border-white/5 hover:bg-white/5 hover:text-white transition-all uppercase tracking-wider"
                    >
                        <span className="material-icons-round text-[16px]">add</span>
                        Manual
                    </button>
                    <AIButton
                        tooltip="Poblar con IA"
                        onClick={handlePoblarConIA}
                        isLoading={aiLoading}
                        variant="magenta"
                    />
                </div>
            </div>

            {aiLoading && (
                <div className="py-10 flex flex-col items-center gap-3 animate-fade-in">
                    <Spinner size="lg" />
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                        Extrayendo eventos del texto...
                    </p>
                </div>
            )}

            {/* Grid View */}
            {!aiLoading && viewMode === 'grid' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-fade-in">
                    {MONTHS.map((m) => renderMonthGrid(m.num, m.name))}
                </div>
            )}

            {/* List View */}
            {!aiLoading && viewMode === 'list' && (
                <div className="space-y-6 animate-fade-in">
                    {events.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-4 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                                <span className="material-icons-round text-3xl text-gray-600">event_busy</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-400">Sin eventos aún</p>
                                <p className="text-[11px] text-gray-600 mt-1">
                                    Escribe tu calendario comunal en el editor y haz clic en "Poblar con IA"
                                </p>
                            </div>
                        </div>
                    ) : (
                        MONTHS.map((m) => {
                            const monthEvents = getEventsForMonth(events, selectedYear, m.num);
                            if (monthEvents.length === 0) return null;
                            return (
                                <div key={m.num}>
                                    <h4 className="text-xs font-black text-white uppercase tracking-[.2em] mb-3 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-xl bg-primary-teal/10 flex items-center justify-center">
                                            <span className="material-icons-round text-primary-teal text-sm">event</span>
                                        </span>
                                        {m.name} {selectedYear}
                                        <span className="text-[9px] text-gray-500 font-bold">({monthEvents.length})</span>
                                    </h4>
                                    <div className="space-y-3 pl-4 border-l-2 border-primary-teal/10">
                                        {monthEvents.map(renderEventCard)}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Empty state for grid */}
            {!aiLoading && viewMode === 'grid' && events.length === 0 && (
                <div className="text-center py-6">
                    <p className="text-[11px] text-gray-600 italic">
                        Escribe tu contexto comunal arriba y haz clic en <span className="text-primary-teal font-bold">Poblar con IA</span> para visualizar eventos aquí.
                    </p>
                </div>
            )}

            {/* Legend */}
            {events.length > 0 && (
                <div className="flex flex-wrap gap-4 pt-2 border-t border-white/5">
                    {Object.entries(EVENT_COLORS).map(([type, colors]) => (
                        <div key={type} className="flex items-center gap-1.5">
                            <div className={cn('w-2.5 h-2.5 rounded-full', colors.dot)} />
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">{type}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {renderEditModal()}
        </div>
    );
};

import React, { useMemo, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { usePlanAnualStore, useUnidadesStore } from '@/store';
import { AuditorService, AuditAlert } from '@/services/ai/auditor';
import { cn } from '@/lib/cn';
import { useNavigate } from 'react-router-dom';

interface GroupedAlerts {
    category: string;
    icon: string;
    alerts: AuditAlert[];
    sourceId?: string;
}

export const AuditReport: React.FC = () => {
    const navigate = useNavigate();
    const { planActivo } = usePlanAnualStore();
    const { unidades } = useUnidadesStore();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'General': true });

    const groupedAlerts = useMemo(() => {
        if (!planActivo) return [];

        const groups: Record<string, GroupedAlerts> = {
            'General': { category: 'Configuración General', icon: 'settings', alerts: [] }
        };

        // Alertas del Plan
        const planAlerts = AuditorService.auditPlan(planActivo);
        planAlerts.forEach(alert => {
            // Unify unit related alerts from plan audit if any
            if (alert.message.includes('[Unidad')) {
                const unitMatch = alert.message.match(/\[Unidad (\d+)\]/);
                const unitNum = unitMatch ? unitMatch[1] : 'Exp';
                const key = `Unidad ${unitNum}`;
                if (!groups[key]) groups[key] = { category: `Unidad ${unitNum}`, icon: 'folder', alerts: [] };
                groups[key].alerts.push({ ...alert, message: alert.message.replace(/\[Unidad \d+\] /, '') });
            } else {
                groups['General'].alerts.push(alert);
            }
        });

        // Alertas de cada Unidad
        const planUnidades = unidades.filter(u => u.planAnualId === planActivo.id);
        planUnidades.forEach(u => {
            const unitAlerts = AuditorService.auditUnidad(u);
            if (unitAlerts.length > 0) {
                const key = `Unidad ${u.numero}`;
                if (!groups[key]) groups[key] = { category: `Unidad ${u.numero}`, icon: 'folder', alerts: [], sourceId: u.id };
                groups[key].alerts = [...groups[key].alerts, ...unitAlerts];
                groups[key].sourceId = u.id;
            }
        });

        return Object.values(groups).filter(g => g.alerts.length > 0);
    }, [planActivo, unidades]);

    const toggleGroup = (cat: string) => {
        setExpandedGroups(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const handleAction = (alert: AuditAlert, sourceId?: string) => {
        if (!planActivo) return;
        
        // Lógica de "Teletransportación"
        if (alert.module === 'M01') navigate('/plan-anual/diagnostico');
        else if (alert.module === 'M03') navigate('/plan-anual/propositos');
        else if (alert.module === 'M04') navigate('/plan-anual/estrategia');
        else if (sourceId) {
            // Ir a la unidad específica
            navigate(`/unidades/${sourceId}/editor`);
        }
    };

    if (!planActivo) return null;

    const totalAlerts = groupedAlerts.reduce((sum, g) => sum + g.alerts.length, 0);

    return (
        <Card variant="strong" className="h-full flex flex-col bg-surface-card border-white/5 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                        <span className="material-icons-round text-primary-teal text-base">verified_user</span>
                        Checklist de Calidad Pedagógica
                    </CardTitle>
                    {totalAlerts > 0 && (
                        <div className="flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-red-500">{totalAlerts}</span>
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">Validación CNEB en tiempo real</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {groupedAlerts.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-primary-teal/5 flex items-center justify-center mb-4 border border-primary-teal/10 shadow-[0_0_20px_rgba(45,170,170,0.1)]">
                             <span className="material-icons-round text-primary-teal text-3xl">done_all</span>
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-white">¡Excelencia Pedagógica!</p>
                        <p className="text-[10px] text-gray-500 mt-2 max-w-[180px] leading-relaxed">Tu planificación cumple con todos los criterios técnicos del CNEB.</p>
                    </div>
                ) : (
                    groupedAlerts.map((group) => (
                        <div key={group.category} className="space-y-2">
                            <button 
                                onClick={() => toggleGroup(group.category)}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-icons-round text-gray-500 text-sm group-hover:text-primary-teal transition-colors">
                                        {group.icon}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">
                                        {group.category}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-black text-gray-600 px-2 py-0.5 bg-black/20 rounded-md">
                                        {group.alerts.length} alertas
                                    </span>
                                    <span className={cn(
                                        "material-icons-round text-gray-700 text-sm transition-transform duration-300",
                                        expandedGroups[group.category] && "rotate-180 text-primary-teal"
                                    )}>
                                        expand_more
                                    </span>
                                </div>
                            </button>

                            {expandedGroups[group.category] && (
                                <div className="space-y-2 pl-4 border-l-2 border-white/5 ml-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                    {group.alerts.map((alert, i) => (
                                        <div 
                                            key={i}
                                            className={cn(
                                                "p-4 rounded-2xl border flex flex-col gap-3 group transition-all relative overflow-hidden",
                                                alert.type === 'error' ? "bg-red-500/5 border-red-500/10" : "bg-yellow-500/5 border-yellow-500/10"
                                            )}
                                        >
                                            <div className="flex gap-3 relative z-10">
                                                <span className={cn(
                                                    "material-icons-round text-base shrink-0 mt-0.5",
                                                    alert.type === 'error' ? "text-red-500" : "text-yellow-500"
                                                )}>
                                                    {alert.type === 'error' ? 'error_outline' : 'lightbulb'}
                                                </span>
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-bold text-gray-200 leading-snug">
                                                        {alert.message}
                                                    </p>
                                                    <div className="flex items-center gap-2 pt-2">
                                                        <button 
                                                            onClick={() => handleAction(alert, group.sourceId)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-magenta/10 border border-brand-magenta/20 text-brand-magenta text-[9px] font-black uppercase tracking-widest hover:bg-brand-magenta hover:text-white transition-all shadow-lg active:scale-95"
                                                        >
                                                            <span className="material-icons-round text-[10px]">auto_fix_high</span>
                                                            {alert.type === 'error' ? 'Vincular ahora' : 'Corregir con IA'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 bg-black/20 border-t border-white/5">
                <div className="flex items-center gap-3 text-[10px] font-black text-primary-teal/40 uppercase tracking-[0.2em] group">
                    <span className="material-icons-round text-sm animate-pulse">security</span>
                    AUDITORÍA ACTIVA
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-teal blur-[2px]" />
                </div>
            </div>
        </Card>
    );
};


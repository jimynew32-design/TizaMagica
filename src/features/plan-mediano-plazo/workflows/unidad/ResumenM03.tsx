import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Unidad, CNEBCompetencia } from '@/types/schemas';
import { usePlanAnualStore } from '@/store';
import { cnebService } from '@/services/cneb';
import { ENFOQUES_TRANSVERSALES } from '@/services/cneb/enfoques-transversales';
import { cn } from '@/lib/cn';

interface ResumenM03Props {
    unidad: Unidad;
}

// Helpers copiados de PropositosEditor
const slug = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').slice(0, 40);

const matrixIdComp = (compNombre: string) => `comp_${slug(compNombre)}`;
const matrixIdCap = (compNombre: string, capNombre: string) => `comp_${slug(compNombre)}_cap_${slug(capNombre)}`;
const matrixIdVal = (enfoqueId: string, valorId: string) => `${enfoqueId}_val_${valorId}`;

export const ResumenM03: React.FC<ResumenM03Props> = ({ unidad }) => {
    const { planActivo } = usePlanAnualStore();
    const [competencias, setCompetencias] = useState<CNEBCompetencia[]>([]);
    const [transversales, setTransversales] = useState<CNEBCompetencia[]>([]);
    const [showEvents, setShowEvents] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!planActivo) return;
            const [areaData, transData] = await Promise.all([
                cnebService.getCompetenciasByAreaNivel(planActivo.area, planActivo.nivel),
                cnebService.getCompetenciasByAreaNivel('Competencias Transversales', planActivo.nivel),
            ]);
            setCompetencias(areaData);
            setTransversales(transData);
        };
        load();
    }, [planActivo?.area, planActivo?.nivel]);

    if (!planActivo) return null;

    const unitIdx = unidad.numero - 1;

    // Fechas de la unidad
    const [start, end] = planActivo.unidades[unitIdx]?.fecha?.split('|') || ['-', '-'];

    // Determinar Calendario Comunal que cae en estas fechas
    const unitEvents = (planActivo.calendarioComunalData?.events || []).filter(ev => {
        if (!start || start === '-') return false;
        
        // Un filtro basado en el mes
        try {
            const unitStartMonth = new Date(start).getMonth();
            const unitEndMonth = new Date(end).getMonth();
            
            if (ev.date) {
                const evMonth = new Date(ev.date).getMonth();
                return evMonth >= unitStartMonth && evMonth <= unitEndMonth;
            }
            
            if (ev.startDate) {
                const evMonth = new Date(ev.startDate).getMonth();
                return evMonth >= unitStartMonth && evMonth <= unitEndMonth;
            }
        } catch (e) {
            return false;
        }

        return false;
    });

    // Filtrar competencias marcadas
    const getCheckedComps = (allComps: CNEBCompetencia[]) => {
        return allComps.filter(c => planActivo.matrizCompetencias[matrixIdComp(c.nombre)]?.[unitIdx])
            .map(c => ({
                ...c,
                capacidadesMarcadas: c.capacidades.filter(cap => planActivo.matrizCompetencias[matrixIdCap(c.nombre, cap)]?.[unitIdx])
            }));
    };

    const compsMarcadas = getCheckedComps(competencias);
    const transMarcadas = getCheckedComps(transversales);

    // Filtrar enfoques marcados
    const enfoquesMarcados = ENFOQUES_TRANSVERSALES.filter(enf => 
        planActivo.matrizCompetencias[enf.id]?.[unitIdx]
    ).map(enf => ({
        ...enf,
        valoresMarcados: enf.valores.filter(v => planActivo.matrizCompetencias[matrixIdVal(enf.id, v.id)]?.[unitIdx])
    }));

    return (
        <Card variant="flat" className="border-l-4 border-l-primary-teal bg-surface-header/30 mb-8 p-6 animate-fade-in shadow-xl backdrop-blur-md">
             <header className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-teal/20 to-brand-magenta/20 flex items-center justify-center border border-white/10">
                    <span className="material-icons-round text-primary-teal text-3xl">account_tree</span>
                </div>
                <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">Heredado del M03 — Plan Anual</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-black text-gray-500 uppercase tracking-widest">Cartel de Propósitos y Distribución</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* Columna 1: Periodos y Comunal */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-primary-teal">
                            <span className="material-icons-round text-lg">calendar_today</span>
                            <p className="text-[11px] font-black uppercase tracking-widest">Temporalidad</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                            <p className="text-xl font-black text-white">{planActivo.periodoTipo || 'Periodo'} {unidad.numero}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-icons-round text-[14px]">date_range</span>
                                {start} al {end}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={() => setShowEvents(!showEvents)}
                            className="flex items-center justify-between w-full group transition-all text-left"
                        >
                            <div className="flex items-center gap-2 text-yellow-500">
                                <span className="material-icons-round text-lg">event_note</span>
                                <p className="text-[11px] font-black uppercase tracking-widest">Calendario Comunal</p>
                                {unitEvents.length > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 text-[9px] font-black rounded-full border border-yellow-500/20">
                                        {unitEvents.length}
                                    </span>
                                )}
                            </div>
                            <span className={cn(
                                "material-icons-round text-yellow-500/50 group-hover:text-yellow-500 transition-transform duration-300",
                                showEvents ? "rotate-180" : ""
                            )}>
                                expand_more
                            </span>
                        </button>

                        {showEvents && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="grid gap-2">
                                    {unitEvents.length > 0 ? unitEvents.map((ev, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5 group hover:border-yellow-500/30 transition-all">
                                            <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-[11px] text-white font-bold leading-none mb-1 truncate">{ev.title}</p>
                                                {ev.date && <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{ev.date}</p>}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-[10px] text-gray-600 italic">No hay eventos específicos para estas fechas.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna 2: Cartel de propósitos */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-brand-magenta">
                        <span className="material-icons-round text-lg">grid_on</span>
                        <p className="text-[11px] font-black uppercase tracking-widest">Propósitos de Aprendizaje ({compsMarcadas.length + transMarcadas.length})</p>
                    </div>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {[...compsMarcadas, ...transMarcadas].map((c, i) => (
                            <div key={i} className="bg-surface-card/40 border border-white/5 rounded-2xl p-4 hover:border-brand-magenta/30 transition-all">
                                <p className="text-[10px] text-brand-magenta font-black uppercase tracking-wider mb-2 leading-tight">
                                    {c.nombre}
                                </p>
                                <ul className="space-y-1.5 border-t border-white/5 pt-2">
                                    {c.capacidadesMarcadas.map((cap, j) => (
                                        <li key={j} className="text-[10px] text-gray-400 flex items-start gap-2 leading-snug">
                                            <span className="material-icons-round text-[10px] text-brand-magenta mt-0.5">check_circle_outline</span>
                                            {cap}
                                        </li>
                                    ))}
                                    {c.capacidadesMarcadas.length === 0 && (
                                        <li className="text-[10px] text-gray-600 italic ml-4">Competencia general sin desglose</li>
                                    )}
                                </ul>
                            </div>
                        ))}
                        {(compsMarcadas.length + transMarcadas.length) === 0 && (
                            <div className="text-center py-10 opacity-30">
                                <span className="material-icons-round text-3xl mb-2">warning_amber</span>
                                <p className="text-[10px] font-bold uppercase tracking-widest">Sin competencias marcadas</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna 3: Enfoques Transversales */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-purple-400">
                        <span className="material-icons-round text-lg">diversity_3</span>
                        <p className="text-[11px] font-black uppercase tracking-widest">Enfoques Priorizados ({enfoquesMarcados.length})</p>
                    </div>
                    
                    <div className="space-y-3">
                        {enfoquesMarcados.map((enf, i) => (
                            <div key={i} className="bg-gradient-to-r from-purple-500/10 to-transparent rounded-2xl p-4 border border-purple-500/10 group cursor-default">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                         <span className="material-icons-round text-purple-400 text-sm">auto_fix_high</span>
                                    </div>
                                    <p className="text-[11px] text-white font-black uppercase tracking-widest">{enf.nombre}</p>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pl-10">
                                    {enf.valoresMarcados.map((v, j) => (
                                        <span key={j} className="text-[9px] bg-white/5 text-gray-300 px-2 py-0.5 rounded-full border border-white/5 font-bold uppercase tracking-wider">
                                            {v.nombre}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {enfoquesMarcados.length === 0 && (
                            <div className="text-center py-10 opacity-30">
                                <span className="material-icons-round text-3xl mb-2">sensor_occupied</span>
                                <p className="text-[10px] font-bold uppercase tracking-widest">Sin enfoques asignados</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

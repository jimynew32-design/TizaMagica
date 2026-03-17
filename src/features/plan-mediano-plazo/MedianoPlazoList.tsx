import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { Chip } from '@/components/ui/Chip';
import { cn } from '@/lib/cn';
import { usePlanAnualStore, useUnidadesStore } from '@/store';
import type { UnidadResumen } from '@/types/schemas';

/** Calcula semanas aproximadas entre dos fechas YYYY-MM-DD */
function calcWeeks(fechaStr: string): number {
    const [start, end] = fechaStr.split('|');
    if (!start || !end) return 0;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(ms / (7 * 24 * 60 * 60 * 1000)));
}

export const MedianoPlazoList: React.FC = () => {
    const navigate = useNavigate();
    const { planActivo } = usePlanAnualStore();
    const { unidades, loadUnidades, createUnidad } = useUnidadesStore();

    useEffect(() => {
        if (planActivo) {
            loadUnidades(planActivo.id);
        }
    }, [planActivo, loadUnidades]);

    if (!planActivo) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-gray-600">
                    <span className="material-icons-round text-4xl">inventory_2</span>
                </div>
                <h2 className="text-2xl font-black text-white uppercase">No hay plan activo</h2>
                <p className="text-gray-500 max-w-md">Selecciona un Plan Anual en el menú superior para gestionar sus unidades didácticas.</p>
            </div>
        );
    }

    // Unidades definidas en el Plan Anual (M03/M04)
    const unidadesEstrategia: UnidadResumen[] = planActivo.unidades || [];

    const handleStartUnit = async (uE: UnidadResumen, displayNumber: number) => {
        // Match by displayNumber (index+1) since UnidadResumen doesn't have 'numero'
        const existing = unidades.find(u => u.numero === displayNumber);
        if (existing) {
            navigate(`/unidades/${existing.id}`);
        } else {
            // Map TipoUnidad to TipoMedianoPlazo (lowercase)
            const tipoMap: Record<string, 'unidad' | 'proyecto' | 'modulo'> = {
                'Unidad': 'unidad', 'Proyecto': 'proyecto', 'Modulo': 'modulo'
            };
            const newUnidad = await createUnidad(
                planActivo.id,
                displayNumber,
                tipoMap[uE.tipo] || 'unidad',
                uE.titulo,
                uE.situacionSignificativa,
                uE.producto
            );
            navigate(`/unidades/${newUnidad.id}`);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-primary-teal/10 text-primary-teal text-[10px] font-bold rounded uppercase tracking-widest border border-primary-teal/20">
                            {planActivo.area}
                        </span>
                        <span className="text-gray-600 text-[10px] font-bold">•</span>
                        <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                            {planActivo.grado} — {planActivo.ciclo}
                        </span>
                    </div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tight">Planificación a Mediano Plazo</h2>
                    <p className="text-gray-500 font-medium italic">Gestión de Unidades, Proyectos y Módulos de Aprendizaje.</p>
                </div>

                <div className="bg-surface-card border border-white/5 rounded-2xl p-4 flex gap-6 items-center">
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">UNIDADES</p>
                        <p className="text-xl font-black text-white leading-none">{unidadesEstrategia.length}</p>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10" />
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">DISEÑADAS</p>
                        <p className="text-xl font-black text-primary-teal leading-none">{unidades.length}</p>
                    </div>
                </div>
            </header>

            {unidadesEstrategia.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white/2 rounded-[3rem] border border-dashed border-white/5 space-y-4">
                    <span className="material-icons-round text-5xl text-gray-700">playlist_add</span>
                    <p className="text-gray-500">No hay unidades definidas en el Plan Anual. Completa M03 (Propósitos) y M04 (Estrategia) primero.</p>
                    <NeonButton variant="primary" onClick={() => navigate('/plan-anual/estrategia')}>IR A ESTRATEGIA ANUAL</NeonButton>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {unidadesEstrategia.map((uE, index) => {
                        const displayNumber = index + 1;
                        const savedUnidad = unidades.find(u => u.numero === displayNumber);
                        const isDesigned = !!savedUnidad;
                        const weeks = calcWeeks(uE.fecha);

                        return (
                            <Card
                                key={uE.id || index}
                                variant={isDesigned ? 'strong' : 'flat'}
                                className={cn(
                                    "flex flex-col min-h-[320px] transition-all duration-500 group relative overflow-hidden",
                                    isDesigned && "border-primary-teal/20 shadow-[0_0_40px_rgba(45,212,191,0.05)]",
                                    !isDesigned && "opacity-80 hover:opacity-100"
                                )}
                            >
                                {isDesigned && (
                                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-teal/10 blur-[80px] rounded-full group-hover:bg-primary-teal/20 transition-all duration-700" />
                                )}

                                <div className="flex justify-between items-start mb-6">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all duration-500",
                                        isDesigned ? "bg-primary-teal text-gray-900 shadow-[0_0_20px_rgba(45,212,191,0.3)]" : "bg-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-white"
                                    )}>
                                        {displayNumber}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <Chip
                                            label={uE.tipo}
                                            variant={uE.tipo === 'Proyecto' ? 'magenta' : 'teal'}
                                            active={isDesigned}
                                            className="text-[9px] px-2 py-0.5 uppercase mb-1"
                                        />
                                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">
                                            {weeks} SEMANAS
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                    <h3 className="text-lg font-black text-white leading-tight group-hover:text-primary-teal transition-colors duration-300">
                                        {uE.titulo || `Unidad ${displayNumber}`}
                                    </h3>
                                    <p className="text-xs text-gray-400 font-medium line-clamp-4 italic leading-relaxed">
                                        {uE.situacionSignificativa || 'Sin situación significativa definida en el Plan Anual.'}
                                    </p>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className={cn(
                                                    "w-6 h-6 rounded-full border-2 border-surface-card flex items-center justify-center text-[8px] font-black",
                                                    isDesigned ? "bg-gray-800 text-primary-teal" : "bg-gray-900 text-gray-700"
                                                )}>
                                                    {i}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            {isDesigned ? 'CONTINUAR' : 'LISTA PARA DISEÑO'}
                                        </p>
                                    </div>
                                    <NeonButton
                                        variant={isDesigned ? 'primary' : 'secondary'}
                                        className="w-full"
                                        icon={isDesigned ? 'arrow_forward' : 'auto_fix_high'}
                                        onClick={() => handleStartUnit(uE, displayNumber)}
                                    >
                                        {isDesigned ? 'ABRIR WORKFLOW' : 'COMENZAR DISEÑO'}
                                    </NeonButton>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

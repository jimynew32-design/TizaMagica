import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { Spinner } from '@/components/ui/Spinner';
import { useUnidadesStore, usePlanAnualStore, useNotificationStore } from '@/store';

import { cn } from '@/lib/cn';

export const SesionesList: React.FC = () => {
    const navigate = useNavigate();
    const { planActivo } = usePlanAnualStore();
    const { unidades, sesiones, loadSesiones, deleteSesion, deleteAllSesiones } = useUnidadesStore();
    const { showNotification } = useNotificationStore();
    const [loading, setLoading] = useState(false);

    const unidadesDelPlan = planActivo ? unidades.filter(u => u.planAnualId === planActivo.id) : [];

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            for (const u of unidadesDelPlan) {
                await loadSesiones(u.id);
            }
            setLoading(false);
        };
        if (unidadesDelPlan.length > 0) loadAll();
    }, [planActivo?.id]);

    const getSesionesByUnidad = (unidadId: string) =>
        sesiones.filter(s => s.unidadId === unidadId).sort((a, b) => a.orden - b.orden);

    const allSesionesOfPlan = sesiones.filter(s => unidadesDelPlan.some(u => u.id === s.unidadId));
    const sesionesCompletas = allSesionesOfPlan.filter(s => !!(s.proposito || s.secuenciaDidactica?.inicio?.descripcion));
    const plannedTotal = unidadesDelPlan.reduce((sum, u) => sum + (u.organizaStep?.totalSesiones || 0), 0);

    const handleDeleteSesion = async (e: React.MouseEvent, sesionId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('⚠️ Esta acción eliminará la sesión tanto de la sección Sesiones como de 4.4 Preview (Organiza).\n\n¿Estás seguro de que quieres eliminar esta sesión?')) return;
        try {
            await deleteSesion(sesionId);
            showNotification({ title: 'Sesión eliminada', message: 'La sesión ha sido eliminada correctamente en ambos espacios.', type: 'success' });
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    };

    const handleDeleteAllSesiones = async (e: React.MouseEvent, unidadId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('⚠️ Esta acción eliminará TODAS las sesiones de esta unidad tanto de Sesiones como de 4.4 Preview (Organiza).\n\nEsta acción NO se puede deshacer. ¿Deseas continuar?')) return;
        try {
            await deleteAllSesiones(unidadId);
            showNotification({ title: 'Sesiones eliminadas', message: 'Se han eliminado todas las sesiones de la unidad en ambos espacios.', type: 'success' });
        } catch (error) {
            console.error('Error deleting all sessions:', error);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            {/* Header */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Sesiones de Aprendizaje</h2>
                    <p className="text-gray-500 text-xs md:text-sm mt-1">
                        {sesionesCompletas.length}/{plannedTotal} sesiones diseñadas
                    </p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                        <p className="text-[9px] md:text-[10px] font-black text-gray-600 uppercase tracking-widest">Área Activa</p>
                        <p className="text-xs md:text-sm font-bold text-white">{planActivo?.area || '—'} · {planActivo?.grado}</p>
                    </div>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-primary-teal to-brand-magenta rounded-full transition-all duration-500"
                    style={{ width: plannedTotal > 0 ? `${(sesionesCompletas.length / plannedTotal) * 100}%` : '0%' }}
                />
            </div>

            {/* Sesiones por Unidad */}
            {unidadesDelPlan.length === 0 ? (
                <div className="py-24 text-center bg-white/2 rounded-[3rem] border border-dashed border-white/5 space-y-4">
                    <span className="material-icons-round text-5xl text-gray-700">menu_book</span>
                    <p className="text-gray-500">No hay unidades creadas para generar sesiones.</p>
                    <NeonButton variant="primary" onClick={() => navigate('/unidades')}>IR A MEDIANO PLAZO</NeonButton>
                </div>
            ) : (
                <div className="space-y-10">
                    {unidadesDelPlan.map(unidad => {
                        const sesionesDe = getSesionesByUnidad(unidad.id);
                        const completadas = sesionesDe.filter(s => s.proposito).length;
                        return (
                            <div key={unidad.id} className="space-y-4">
                                {/* Unidad Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary-teal/10 border border-primary-teal/30 rounded-xl flex items-center justify-center">
                                            <span className="text-xs font-black text-primary-teal">{unidad.numero}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white uppercase tracking-tight line-clamp-1">
                                                {unidad.diagnosticoStep.titulo || `Unidad ${unidad.numero}`}
                                            </h3>
                                            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">{completadas}/{unidad.organizaStep?.totalSesiones || 0} diseñadas</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {sesionesDe.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteAllSesiones(e, unidad.id)}
                                                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors border border-red-500/20"
                                                title="Eliminar todas las sesiones de esta unidad"
                                            >
                                                <span className="material-icons-round text-sm">delete_sweep</span>
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => navigate(`/unidades/${unidad.id}`)}
                                            className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-primary-teal/10 border border-primary-teal/20 text-primary-teal text-[10px] font-black uppercase tracking-widest hover:bg-primary-teal hover:text-white transition-all shadow-lg active:scale-95"
                                        >
                                            VER UNIDAD
                                        </button>
                                    </div>
                                </div>

                                {/* Sesiones Grid */}
                                {sesionesDe.length === 0 ? (
                                    <div className="py-10 text-center bg-white/2 rounded-2xl border border-dashed border-white/5">
                                        <p className="text-gray-700 text-xs uppercase tracking-widest">Sin sesiones generadas. Ve a la unidad → Paso 5 "Prevé".</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {sesionesDe.map(sesion => {
                                            const isCompleta = !!sesion.proposito;
                                            const totalMin = sesion.secuenciaDidactica.inicio.duracionMinutos
                                                + sesion.secuenciaDidactica.desarrollo.duracionMinutos
                                                + sesion.secuenciaDidactica.cierre.duracionMinutos;
                                            return (
                                                <Card
                                                    key={sesion.id}
                                                    variant="flat"
                                                    className={cn(
                                                        "cursor-pointer group hover:border-primary-teal/20 transition-all",
                                                        isCompleta && "border-primary-teal/10 bg-primary-teal/2"
                                                    )}
                                                    onClick={() => navigate(`/sesiones/${sesion.id}`)}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 transition-all",
                                                            isCompleta
                                                                ? "bg-primary-teal/20 text-primary-teal group-hover:bg-primary-teal group-hover:text-gray-900"
                                                                : "bg-white/5 text-gray-600 group-hover:bg-white/10"
                                                        )}>
                                                            <span className="text-[9px] font-black leading-none">SES</span>
                                                            <span className="text-sm font-black leading-none">{sesion.orden}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={cn(
                                                                "text-xs font-bold uppercase tracking-tight leading-tight line-clamp-2 transition-colors",
                                                                isCompleta ? "text-white" : "text-gray-400 group-hover:text-white"
                                                            )}>
                                                                {sesion.titulo || `Sesión ${sesion.orden}`}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className={cn(
                                                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                                    isCompleta ? "bg-primary-teal/15 text-primary-teal" : "bg-white/5 text-gray-600"
                                                                )}>
                                                                    {isCompleta ? 'DISEÑADA' : 'PENDIENTE'}
                                                                </span>
                                                                {totalMin > 0 && (
                                                                    <span className="text-[9px] text-gray-600 font-bold">{totalMin} min</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleDeleteSesion(e, sesion.id)}
                                                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Eliminar sesión"
                                                            >
                                                                <span className="material-icons-round text-sm">delete</span>
                                                            </button>
                                                            <span className="material-icons-round text-gray-700 group-hover:text-primary-teal transition-colors text-sm">chevron_right</span>
                                                        </div>
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

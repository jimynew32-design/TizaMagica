import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUnidadesStore, usePlanAnualStore } from '@/store';
import { WorkflowUnidad } from './workflows/unidad/WorkflowUnidad';
import { WorkflowProyecto } from './workflows/proyecto/WorkflowProyecto';
import { WorkflowModulo } from './workflows/modulo/WorkflowModulo';
import { Spinner } from '@/components/ui/Spinner';
import { NeonButton } from '@/components/ui/NeonButton';

export const MedianoPlazoEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { unidades, unidadesLoaded, loadUnidades } = useUnidadesStore();
    const { planActivo } = usePlanAnualStore();

    useEffect(() => {
        if (planActivo && !unidadesLoaded) {
            loadUnidades(planActivo.id);
        }
    }, [planActivo, unidadesLoaded, loadUnidades]);

    const unidad = unidades.find(u => u.id === id);

    if (!unidadesLoaded || !planActivo) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Spinner size="lg" />
                <p className="text-gray-500 font-bold uppercase tracking-widest animate-pulse">Cargando Planificación...</p>
            </div>
        );
    }

    if (!unidad) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                    <span className="material-icons-round text-5xl">warning</span>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white uppercase mb-2">Plan no encontrado</h2>
                    <p className="text-gray-500">El elemento que buscas no existe o no pertenece a este plan.</p>
                </div>
                <NeonButton variant="secondary" onClick={() => navigate('/unidades')}>Volver al Listado</NeonButton>
            </div>
        );
    }

    if (unidad.tipo === 'proyecto') {
        return <WorkflowProyecto unidad={unidad} />;
    }

    if (unidad.tipo === 'modulo') {
        return <WorkflowModulo unidad={unidad} />;
    }

    // Por ahora, 'modulo' también usa 'unidad' o podemos especializarlo después
    return <WorkflowUnidad unidad={unidad} />;
};

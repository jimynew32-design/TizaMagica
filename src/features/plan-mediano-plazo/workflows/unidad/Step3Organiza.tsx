import React, { useState, useEffect, useMemo } from 'react';

import { Unidad, DiaCalendario } from '@/types/schemas';
import { useDebounce } from '@/hooks/ui/useDebounce';
import { usePlanAnualStore, useStore } from '@/store';
import { CalendarioSesiones } from './CalendarioSesiones';

interface Step3OrganizaProps {
    unidad: Unidad;
    onUpdate: (updates: Partial<Unidad>) => void;
}

export const Step3Organiza: React.FC<Step3OrganizaProps> = ({ unidad, onUpdate }) => {
    const { planActivo } = usePlanAnualStore();

    const [diasSeleccionados, setDiasSeleccionados] = useState<DiaCalendario[]>(
        unidad.organizaStep.diasSeleccionados || []
    );
    const [totalSesiones, setTotalSesiones] = useState(unidad.organizaStep.totalSesiones || 0);

    // Get date range from the PlanAnual unit entry
    const unitIdx = unidad.numero - 1;
    const unitFechas = planActivo?.unidades?.[unitIdx]?.fecha || '';
    const [fechaInicio, fechaTermino] = unitFechas ? unitFechas.split('|') : ['', ''];

    // Get M03 Calendario Comunal events filtered to this unit's range
    const comunalEvents = useMemo(() => {
        if (!planActivo?.calendarioComunalData?.events || !fechaInicio) return [];
        return (planActivo.calendarioComunalData.events || []).filter(ev => {
            const d = ev.date || ev.startDate;
            if (!d) return false;
            // Include events whose date falls within the unit range (loosely — by month)
            try {
                const unitStartMonth = new Date(fechaInicio).getMonth();
                const unitEndMonth = new Date(fechaTermino).getMonth();
                const evMonth = new Date(d).getMonth();
                return evMonth >= unitStartMonth && evMonth <= unitEndMonth;
            } catch {
                return false;
            }
        });
    }, [planActivo?.calendarioComunalData?.events, fechaInicio, fechaTermino]);

    // Debounced save
    const debouncedOrganiza = useDebounce({
        fechaInicio,
        fechaTermino,
        diasSeleccionados,
        totalSesiones,
    }, 1000);

    useEffect(() => {
        onUpdate({
            organizaStep: {
                ...unidad.organizaStep,
                ...debouncedOrganiza,
            }
        });
    }, [debouncedOrganiza]);

    // Calendar change handler
    const handleCalendarioChange = (dias: DiaCalendario[], total: number) => {
        setDiasSeleccionados(dias);
        setTotalSesiones(total);
    };



    const handleRangeChange = (start: string, end: string) => {
        if (!planActivo) return;
        
        // 1. Update master plan (M03/M04) — Shared Inheritance
        const updatedMasterUnits = [...planActivo.unidades];
        updatedMasterUnits[unitIdx] = {
            ...updatedMasterUnits[unitIdx],
            fecha: `${start}|${end}`
        };
        
        // Update plan active in store immediately (to sync with other views)
        const { updatePlan } = useStore.getState();
        updatePlan(planActivo.id, { unidades: updatedMasterUnits });

        // 2. Update local state and trigger individual unit save
        onUpdate({
            organizaStep: {
                ...unidad.organizaStep,
                fechaInicio: start,
                fechaTermino: end,
                diasSeleccionados,
                totalSesiones
            }
        });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Calendario Interactivo de Sesiones */}
            <CalendarioSesiones
                fechaInicio={fechaInicio}
                fechaTermino={fechaTermino}
                diasSeleccionados={diasSeleccionados}
                totalSesiones={totalSesiones}
                comunalEvents={comunalEvents}
                onChange={handleCalendarioChange}
                onChangeRange={handleRangeChange}
            />




        </div>
    );
};

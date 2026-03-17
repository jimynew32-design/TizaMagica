/**
 * PlanX System — Utilidades Cronológicas Pedagógicas
 * Skill: gestion_curricular_cneb
 */

export const SCHOOL_YEAR_START = new Date('2026-03-02');

export interface SchoolContext {
    semana: number;
    bimestre: number;
    label: string;
}

export function getCurrentSchoolContext(): SchoolContext {
    const today = new Date();
    
    // Si estamos antes de marzo, estamos en planificación previa (Bimestre I, Semana 0)
    if (today < SCHOOL_YEAR_START) {
        return { semana: 0, bimestre: 1, label: 'Planificación Previa' };
    }

    const diffTime = Math.abs(today.getTime() - SCHOOL_YEAR_START.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const semana = Math.ceil(diffDays / 7);

    // Estimación de Bimestres (CNEB Estándar: 9-10 semanas por bimestre)
    let bimestre = 1;
    if (semana > 30) bimestre = 4;
    else if (semana > 20) bimestre = 3;
    else if (semana > 10) bimestre = 2;

    const label = `Semana ${semana} | ${getRoman(bimestre)} Bimestre`;

    return { semana, bimestre, label };
}

function getRoman(n: number): string {
    const romanMap: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
    return romanMap[n] || 'I';
}

/**
 * Determina qué sesión del horario corresponde al momento actual
 */
export function getActiveSessionFromSchedule(cargaHoraria: any[]) {
    const now = new Date();
    const currentDay = todayDayName();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (const fila of cargaHoraria) {
        const [startH, startM] = fila.horaInicio.split(':').map(Number);
        const [endH, endM] = fila.horaFin.split(':').map(Number);
        
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        if (currentTime >= startTotal && currentTime <= endTotal) {
            const celda = fila[currentDay];
            if (celda && celda.area) {
                return {
                    ...celda,
                    horaInicio: fila.horaInicio,
                    horaFin: fila.horaFin
                };
            }
        }
    }
    return null;
}

function todayDayName(): string {
    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    return days[new Date().getDay()];
}

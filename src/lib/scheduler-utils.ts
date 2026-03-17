import { FilaHorario, NivelEducativo } from '@/types/schemas';

export interface UniqueProject {
    nivel: NivelEducativo;
    grado: string;
    area: string;
    ciclo: string;
    sesionesPorSemana: number;
}

/**
 * Algoritmo de Agregación "Unique Discovery"
 * Recorre la matriz de horario y extrae las combinaciones únicas de Grado/Área.
 * 
 * Lógica PlanX: Detecta cuántas veces a la semana se dicta una materia para
 * automatizar la creación de workspaces y cálculo de sesiones por unidad.
 */
export function generateUniqueProjectsFromSchedule(
    schedule: FilaHorario[],
    nivel: NivelEducativo
): UniqueProject[] {
    const uniqueItems = new Map<string, UniqueProject>();

    schedule.forEach(row => {
        const days: (keyof FilaHorario)[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

        days.forEach(day => {
            const cell = row[day];
            if (cell && typeof cell === 'object' && cell.grado && cell.area) {
                const key = `${cell.grado}-${cell.area}`;

                if (uniqueItems.has(key)) {
                    // Si ya existe, incrementamos el contador de sesiones semanales
                    const existing = uniqueItems.get(key)!;
                    existing.sesionesPorSemana += 1;
                } else {
                    // Si es nuevo, lo registramos
                    uniqueItems.set(key, {
                        nivel,
                        grado: cell.grado,
                        area: cell.area,
                        ciclo: cell.ciclo,
                        sesionesPorSemana: 1
                    });
                }
            }
        });
    });

    return Array.from(uniqueItems.values());
}

/**
 * Valida si una hora de inicio es anterior a una hora de fin.
 * Formato esperado: HH:mm
 */
export function isTimeRangeValid(start: string, end: string): boolean {
    if (!start || !end) return true; // No validar si están vacíos
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);

    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return true;

    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;

    return minutes1 < minutes2;
}

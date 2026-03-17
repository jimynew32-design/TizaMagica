import { PlanAnual, Unidad } from '@/types/schemas';
import { chatCompletion } from './index';

export interface AuditAlert {
    type: 'error' | 'warning' | 'info';
    message: string;
    module: string; // 'M01', 'M02', etc.
    field?: string;
}

/**
 * Auditor pedagógico para PlanX System.
 * Detecta inconsistencias en la planificación.
 */
export class AuditorService {
    /**
     * Realiza una auditoría completa de un Plan Anual.
     */
    public static auditPlan(plan: PlanAnual): AuditAlert[] {
        const alerts: AuditAlert[] = [];

        // 1. Auditoría M01 - Diagnóstico
        const listIdiomas = plan.diagnostico.estilos.idiomas || [];
        if (listIdiomas.length === 0 || listIdiomas.some(i => i.etiqueta === 'L1' && i.valor === 'No especificada')) {
            alerts.push({
                type: 'warning',
                message: 'No se ha especificado la lengua materna (L1) de tus estudiantes. Esto es vital para los materiales diferenciados.',
                module: 'M01',
                field: 'estilos.idiomas'
            });
        }

        const nee = plan.diagnostico.estudiantes.filter(e => e.nee && e.nee.length > 0);
        if (nee.length > 0 && (!plan.orientaciones.metodologia || plan.orientaciones.metodologia.length < 20)) {
            alerts.push({
                type: 'warning',
                message: `Tienes ${nee.length} estudiantes con NEE, pero no has detallado adaptaciones metodológicas en el plan anual.`,
                module: 'M01',
                field: 'orientaciones.metodologia'
            });
        }

        // 2. Auditoría M03 - Propósitos
        const hasCompetencias = Object.keys(plan.matrizCompetencias).length > 0;
        if (!hasCompetencias) {
            alerts.push({
                type: 'error',
                message: 'El Cartel de Propósitos está vacío. Debes priorizar las competencias que trabajarás en el año.',
                module: 'M03',
                field: 'matrizCompetencias'
            });
        }

        // 3. Auditoría M04 - Estrategia / Unidades
        if (plan.unidades.length === 0) {
            alerts.push({
                type: 'error',
                message: 'Tu Estrategia Anual no tiene unidades. El sistema no puede generar la ruta de aprendizaje sin ellas.',
                module: 'M04',
                field: 'unidades'
            });
        }

        plan.unidades.forEach((u: any) => {
            const hasSituation = u.situacionSignificativa && u.situacionSignificativa.length >= 50;
            if (!hasSituation) {
                alerts.push({
                    type: 'warning',
                    message: `[Unidad ${u.numero || '?'}] La Situación Significativa es demasiado breve para ser una experiencia de aprendizaje sólida.`,
                    module: 'M04',
                    field: `unidades[${u.numero || ''}].situacionSignificativa`
                });
            }
        });

        return alerts;
    }

    /**
     * Realiza una auditoría de una Unidad específica.
     */
    public static auditUnidad(unidad: Unidad): AuditAlert[] {
        const alerts: AuditAlert[] = [];

        if (!unidad.disenaStep.competencias || unidad.disenaStep.competencias.length === 0) {
            alerts.push({
                type: 'error',
                message: 'No has seleccionado las competencias que se movilizarán en esta unidad.',
                module: 'Mediano Plazo',
                field: 'disenaStep.competencias'
            });
        }

        if (!unidad.disenaStep.desempenos || unidad.disenaStep.desempenos.length === 0) {
            alerts.push({
                type: 'error',
                message: 'No hay desempeños precisados vinculados. ¿Qué evidencias de aprendizaje esperamos?',
                module: 'Mediano Plazo',
                field: 'disenaStep.desempenos'
            });
        }

        if (!unidad.preveStep.sesiones || unidad.preveStep.sesiones.length === 0) {
            alerts.push({
                type: 'warning',
                message: 'La secuencia lógica de sesiones no ha sido generada. El docente no tiene su guion de clase.',
                module: 'Mediano Plazo',
                field: 'preveStep.sesiones'
            });
        }

        const hasReto = unidad.diagnosticoStep?.situacionSignificativa?.includes('?') || 
                        unidad.diagnosticoStep?.situacionSignificativa?.toLowerCase().includes('reto');
        if (!hasReto) {
            alerts.push({
                type: 'warning',
                message: 'La Situación Significativa parece carecer de un reto o pregunta retadora clara.',
                module: 'Mediano Plazo',
                field: 'diagnosticoStep.situacionSignificativa'
            });
        }

        return alerts;
    }

    /**
     * Realiza una auditoría profunda con IA para detectar incoherencias pedagógicas reales.
     */
    public static async auditUnidadCoherenceIA(unidad: Unidad): Promise<AuditAlert[]> {
        // Obtenemos los nombres de las competencias (usando el ID como fallback si no hay mapeo a la mano)
        const competenciasNames = unidad.disenaStep.competencias.map(c => c.competenciaId).join(', ');
        const desempenosTexts = unidad.disenaStep.desempenos.map(d => d.precisado || d.texto).join('; ');

        const prompt = `
            Actúa como un Auditor Pedagógico Senior del MINEDU Perú especializado en el CNEB.
            Analiza la coherencia de la siguiente unidad:
            - Título: ${unidad.diagnosticoStep.titulo}
            - Situación Significativa: ${unidad.diagnosticoStep.situacionSignificativa}
            - Competencias Seleccionadas: ${competenciasNames}
            - Desempeños: ${desempenosTexts}

            Determina si hay incoherencias pedagógicas (ej: el título no tiene relación con la competencia, o la situación no moviliza los desempeños).
            Retorna UN ARRAY DE OBJETOS JSON: [{ "type": "warning" | "error", "message": "...", "module": "Coherencia IA" }]
            IMPORTANTE: Si todo es coherente, retorna un array vacío []. NO agregues texto extra, solo el JSON array.
        `;

        try {
            const result = await chatCompletion(
                "Eres un auditor de calidad educativa. Evalúa la coherencia curricular.",
                prompt
            );
            return Array.isArray(result) ? result : [];
        } catch (e) {
            console.error('Error en auditoría IA:', e);
            return [];
        }
    }
}

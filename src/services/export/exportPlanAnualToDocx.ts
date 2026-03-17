/**
 * Servicio de exportación del Plan Anual a .docx
 * Genera un documento Word formal siguiendo el formato oficial MINEDU.
 * Fuente: Times New Roman 10pt, tablas con bordes, márgenes estándar A4.
 */
import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, BorderStyle, WidthType, PageOrientation,
    convertInchesToTwip,
    ITableCellBorders,
    VerticalMergeType,
} from 'docx';
import type { PlanAnual, PerfilDocente, CNEBCompetencia } from '@/types/schemas';
import { ENFOQUES_TRANSVERSALES } from '@/services/cneb/enfoques-transversales';

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT = 'Times New Roman';
const SIZE_10 = 20; // half-points
const SIZE_12 = 24;

const BORDER_STYLE: ITableCellBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
};

const HEADER_SHADING = { fill: 'D9E2F3', type: 'clear' as const, color: 'auto' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugId(name: string): string {
    return `comp_${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').slice(0, 40)}`;
}

/** Helper para obtener estándar robusto */
function getEstandar(comp: CNEBCompetencia, ciclo: string): string {
    if (!comp.estandares) return '';
    const keys = Object.keys(comp.estandares);
    const match = keys.find(k => k.toUpperCase().includes(ciclo.toUpperCase()));
    return match ? comp.estandares[match] : '';
}

/** Helper para filtrar desempeños robusto */
function filterDesempenos(comp: CNEBCompetencia, grado: string): any[] {
    if (!comp.desempenos) return [];
    const gNum = grado.replace(/[^0-9]/g, '');
    if (!gNum) return comp.desempenos.filter(d => d.grado.toLowerCase().includes(grado.toLowerCase()));
    return comp.desempenos.filter(d => {
        const dNum = d.grado.replace(/[^0-9]/g, '');
        return dNum === gNum || d.grado.toLowerCase().includes(grado.toLowerCase());
    });
}

function bold(text: string, size = SIZE_10): TextRun {
    return new TextRun({ text, bold: true, font: FONT, size });
}

function normal(text: string, size = SIZE_10): TextRun {
    return new TextRun({ text, font: FONT, size });
}

function headerCell(text: string, width?: number): TableCell {
    return new TableCell({
        children: [new Paragraph({
            children: [bold(text)],
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40 },
        })],
        borders: BORDER_STYLE,
        shading: HEADER_SHADING,
        width: width ? { size: width, type: WidthType.DXA } : undefined,
    });
}

function textCell(text: string, opts?: { alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]; width?: number; bold?: boolean, verticalMerge?: (typeof VerticalMergeType)[keyof typeof VerticalMergeType] }): TableCell {
    const paragraphs = text.split('\n').map(line => new Paragraph({
        children: [opts?.bold ? bold(line) : normal(line)],
        alignment: opts?.alignment || AlignmentType.LEFT,
        spacing: { before: 30, after: 30 },
    }));

    return new TableCell({
        children: paragraphs,
        borders: BORDER_STYLE,
        width: opts?.width ? { size: opts.width, type: WidthType.DXA } : undefined,
        verticalMerge: opts?.verticalMerge,
    });
}

function checkCell(checked: boolean, bgColor?: string): TableCell {
    return new TableCell({
        children: [new Paragraph({
            children: [new TextRun({ text: checked ? 'X' : '', font: FONT, size: SIZE_10, color: bgColor ? 'FFFFFF' : '000000', bold: checked })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 30, after: 30 },
        })],
        borders: BORDER_STYLE,
        shading: bgColor ? { fill: bgColor, type: 'clear' as const, color: 'auto' } : undefined,
    });
}

function sectionTitle(text: string, numbering?: string): Paragraph {
    const prefix = numbering ? `${numbering}. ` : '';
    return new Paragraph({
        children: [bold(`${prefix}${text.toUpperCase()}`, SIZE_10)],
        spacing: { before: 300, after: 150 },
    });
}

function emptyParagraph(): Paragraph {
    return new Paragraph({ children: [], spacing: { before: 100, after: 100 } });
}

// ─── Main Export Function ─────────────────────────────────────────────────────

export interface ExportData {
    plan: PlanAnual;
    perfil: PerfilDocente;
    areaComps: CNEBCompetencia[];
    transComps: CNEBCompetencia[];
}

export async function exportPlanAnualToDocx(data: ExportData): Promise<Blob> {
    const { plan, perfil, areaComps, transComps } = data;
    const totalUnits = plan.unidades.length;
    const matrix = plan.matrizCompetencias || {};

    const children: (Paragraph | Table)[] = [];

    // ═══════════════════════════════════════════════════════════════════
    // HEADER
    // ═══════════════════════════════════════════════════════════════════
    children.push(new Paragraph({
        children: [bold('PROGRAMACIÓN ANUAL', SIZE_12)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
    }));

    // ═══════════════════════════════════════════════════════════════════
    // 1. DATOS INFORMATIVOS
    // ═══════════════════════════════════════════════════════════════════
    children.push(sectionTitle('DATOS INFORMATIVOS', '1'));

    const datosRows = [
        ['1.1. GEREDU', perfil.gereduDre || ''],
        ['1.2. UGEL', perfil.ugel || ''],
        ['1.3. INSTITUCIÓN EDUCATIVA', perfil.nombreIE || ''],
        ['1.4. DIRECTOR', perfil.director || ''],
        ['1.5. DOCENTE', perfil.nombreCompleto || ''],
        ['1.6. MODALIDAD/NIVEL', plan.nivel || ''],
        ['1.7. CICLO/GRADO/SECCIÓN', `${plan.ciclo} / ${plan.grado}`],
        ['1.8. ÁREA CURRICULAR', plan.area || ''],
        ['1.9. HORAS PEDAGÓGICAS SEMANALES', `${plan.sesionesPorSemana || 0} horas pedagógicas`],
    ];

    const NO_BORDER: ITableCellBorders = {
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    };

    const infoTableRows = datosRows.map(([label, value]) => {
        return new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph({ children: [bold(label)], spacing: { after: 40 } })],
                    borders: NO_BORDER,
                    width: { size: 4000, type: WidthType.DXA }
                }),
                new TableCell({
                    children: [new Paragraph({ children: [bold(":")], spacing: { after: 40 } })],
                    borders: NO_BORDER,
                    width: { size: 300, type: WidthType.DXA }
                }),
                new TableCell({
                    children: [new Paragraph({ children: [normal(value)], spacing: { after: 40 } })],
                    borders: NO_BORDER,
                    width: { size: 5000, type: WidthType.DXA }
                }),
            ]
        });
    });

    children.push(new Table({
        rows: infoTableRows,
        width: { size: 9000, type: WidthType.DXA },
        margins: { left: convertInchesToTwip(0.3) }
    }));

    // ═══════════════════════════════════════════════════════════════════
    // 2. DESCRIPCIÓN GENERAL
    // ═══════════════════════════════════════════════════════════════════
    children.push(sectionTitle('DESCRIPCIÓN GENERAL', '2'));

    const descText = plan.identidad?.descripcionArea || '';
    descText.split('\n').filter(Boolean).forEach(p => {
        children.push(new Paragraph({
            children: [normal(p.trim())],
            spacing: { before: 60, after: 60 },
            indent: { left: convertInchesToTwip(0.3), firstLine: convertInchesToTwip(0.3) },
            alignment: AlignmentType.JUSTIFIED,
        }));
    });

    // ═══════════════════════════════════════════════════════════════════
    // 3. ORGANIZACIÓN DE UNIDADES Y TÍTULOS DIDÁCTICOS
    // ═══════════════════════════════════════════════════════════════════
    children.push(sectionTitle('LA ORGANIZACIÓN DE LAS UNIDADES Y TÍTULOS DIDÁCTICAS RELACIONADOS AL CONTEXTO SERÁN LAS SIGUIENTES:', '3'));

    if (plan.unidades.length > 0) {
        const unitTableRows: TableRow[] = [];

        // Header row
        unitTableRows.push(new TableRow({
            children: [
                headerCell('Situación significativa de la unidad', 6000),
                headerCell('Unidad', 800),
                headerCell('POSIBLE TÍTULO', 3500),
                headerCell('TIEMPO', 1500),
            ],
            tableHeader: true,
        }));

        plan.unidades.forEach((unit, i) => {
            const [startDate, endDate] = unit.fecha.split('|');
            const tipoLabel = unit.tipo === 'Unidad' ? 'U' : unit.tipo === 'Proyecto' ? 'P' : 'M';

            unitTableRows.push(new TableRow({
                children: [
                    textCell(unit.situacionSignificativa || '', { width: 6000 }),
                    textCell(`${tipoLabel}${i + 1}`, { alignment: AlignmentType.CENTER, width: 800, bold: true }),
                    textCell(unit.titulo || '', { width: 3500 }),
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [bold('Inicio')],
                                alignment: AlignmentType.LEFT,
                                spacing: { before: 30 },
                            }),
                            new Paragraph({
                                children: [normal(`${startDate || ''}`)],
                                alignment: AlignmentType.LEFT,
                                spacing: { after: 100 },
                            }),
                            new Paragraph({
                                children: [bold('Termina')],
                                alignment: AlignmentType.LEFT,
                                spacing: { before: 30 },
                            }),
                            new Paragraph({
                                children: [normal(`${endDate || ''}`)],
                                alignment: AlignmentType.LEFT,
                                spacing: { after: 30 },
                            }),
                        ],
                        borders: BORDER_STYLE,
                        width: { size: 1500, type: WidthType.DXA },
                    }),
                ],
            }));
        });

        children.push(new Table({
            rows: unitTableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
        }));
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. ORGANIZACIÓN DE LOS PROPÓSITOS DE APRENDIZAJE
    // ═══════════════════════════════════════════════════════════════════
    children.push(sectionTitle('ORGANIZACIÓN DE LOS PROPÓSITOS DE APRENDIZAJE', '4'));

    if (totalUnits > 0) {
        const allComps = [...areaComps, ...transComps];
        const propRows: TableRow[] = [];

        // Header
        const propHeaderCells = [
            headerCell('Propósito de aprendizaje\nCompetencias y capacidades del área', 3500),
        ];
        // Unit columns
        for (let u = 0; u < totalUnits; u++) {
            const tipoLabel = plan.unidades[u]?.tipo === 'Unidad' ? 'U' : plan.unidades[u]?.tipo === 'Proyecto' ? 'P' : 'M';
            propHeaderCells.push(headerCell(`${tipoLabel}${u + 1}`, 500));
        }
        propHeaderCells.push(headerCell('Estándares de aprendizaje', 3000));

        propRows.push(new TableRow({ children: propHeaderCells }));

        // Competency rows
        allComps.forEach(comp => {
            const compId = slugId(comp.nombre);

            // Parent row (competencia)
            const compCells = [textCell(comp.nombre, { bold: true, width: 3500 })];
            for (let u = 0; u < totalUnits; u++) {
                compCells.push(checkCell(matrix[compId]?.[u] ?? false));
            }
            // Estándar (RESTART para empezar la unión)
            const estandar = getEstandar(comp, plan.ciclo || '');
            compCells.push(textCell(estandar || '---', { width: 3000, verticalMerge: VerticalMergeType.RESTART, alignment: AlignmentType.JUSTIFIED }));

            propRows.push(new TableRow({ children: compCells }));

            // Capacity rows
            comp.capacidades.forEach(cap => {
                const capSlug = cap.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').slice(0, 40);
                const capId = `${compId}_cap_${capSlug}`;
                const capCells = [textCell(`   ${cap}`, { width: 3500 })];
                for (let u = 0; u < totalUnits; u++) {
                    capCells.push(checkCell(matrix[capId]?.[u] ?? false));
                }
                // Celda del estándar (CONTINUE para seguir la unión)
                capCells.push(textCell('', { width: 3000, verticalMerge: VerticalMergeType.CONTINUE }));
                propRows.push(new TableRow({ children: capCells }));
            });
        });

        children.push(new Table({
            rows: propRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
        }));
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. COMPETENCIAS, CAPACIDADES Y ESTÁNDARES DE APRENDIZAJE
    // ═══════════════════════════════════════════════════════════════════
    children.push(sectionTitle(`COMPETENCIAS, CAPACIDADES Y ESTÁNDARES DE APRENDIZAJE DE ${plan.area.toUpperCase()}`, '5'));

    const compTableRows: TableRow[] = [];

    // Header group
    compTableRows.push(new TableRow({
        children: [
            new TableCell({
                children: [new Paragraph({
                    children: [bold('DESCRIPCION GENERAL')],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 80, after: 80 },
                })],
                columnSpan: 3,
                borders: BORDER_STYLE,
            })
        ]
    }));

    // Header columns
    compTableRows.push(new TableRow({
        children: [
            headerCell('COMPETENCIAS / CAPACIDADES', 3500),
            headerCell(`DESEMPEÑOS DEL CICLO (${plan.ciclo})`, 4500),
            headerCell('ESTANDARES', 3500),
        ],
        tableHeader: true,
    }));

    areaComps.forEach(comp => {
        const estandar = getEstandar(comp, plan.ciclo || '');
        const gradoDesempenos = filterDesempenos(comp, plan.grado || '');

        const compParags = [new Paragraph({ children: [bold(comp.nombre)], spacing: { after: 100 } })];
        comp.capacidades.forEach(cap => {
            compParags.push(new Paragraph({
                children: [normal(`• ${cap}`, 18)], // Un poco más pequeño para que quepa bien
                spacing: { after: 40 },
                indent: { left: 240 }
            }));
        });

        const desParags = gradoDesempenos.map(d => new Paragraph({
            children: [bold(`[${d.capacidad}] `), normal(d.texto)],
            spacing: { after: 120 },
            alignment: AlignmentType.JUSTIFIED,
        }));

        compTableRows.push(new TableRow({
            children: [
                new TableCell({ children: compParags, borders: BORDER_STYLE, width: { size: 3500, type: WidthType.DXA } }),
                new TableCell({ children: desParags, borders: BORDER_STYLE, width: { size: 4500, type: WidthType.DXA } }),
                new TableCell({
                    children: [new Paragraph({ children: [normal(estandar)], alignment: AlignmentType.JUSTIFIED })],
                    borders: BORDER_STYLE,
                    width: { size: 3500, type: WidthType.DXA }
                }),
            ]
        }));
    });

    children.push(new Table({
        rows: compTableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
    }));

    // ═══════════════════════════════════════════════════════════════════
    // 6. ENFOQUES TRANSVERSALES
    // ═══════════════════════════════════════════════════════════════════
    children.push(sectionTitle('ENFOQUES TRANSVERSALES', '6'));

    if (totalUnits > 0) {
        const enfHeaderCells = [headerCell('ENFOQUES TRANSVERSALES', 4000)];
        for (let u = 0; u < totalUnits; u++) {
            const label = u === 0 ? 'u1' : `EdA${u + 1}`;
            enfHeaderCells.push(headerCell(label, 600));
        }

        const enfRows: TableRow[] = [new TableRow({ children: enfHeaderCells, tableHeader: true })];

        // 1. Filas de Enfoques (una por cada enfoque)
        ENFOQUES_TRANSVERSALES.forEach(enfoque => {
            const enfCells = [textCell(enfoque.nombre, { width: 4000 })];
            const isSelected = (uIdx: number) => matrix[enfoque.id]?.[uIdx] || enfoque.valores.some(v => matrix[`${enfoque.id}_val_${v.id}`]?.[uIdx]);

            for (let u = 0; u < totalUnits; u++) {
                const checked = isSelected(u);
                enfCells.push(checkCell(checked, checked ? '00ADEF' : undefined)); // Color azul similar a la foto
            }
            enfRows.push(new TableRow({ children: enfCells }));
        });

        // 2. Fila consolidada de VALORES (al final)
        const valorCells = [new TableCell({
            children: [new Paragraph({ children: [bold('VALORES')], alignment: AlignmentType.CENTER })],
            borders: BORDER_STYLE,
            shading: { fill: 'F2F2F2', type: 'clear' as const, color: 'auto' },
            width: { size: 4000, type: WidthType.DXA }
        })];

        for (let u = 0; u < totalUnits; u++) {
            const unitValues: string[] = [];
            ENFOQUES_TRANSVERSALES.forEach(enf => {
                enf.valores.forEach(v => {
                    if (matrix[`${enf.id}_val_${v.id}`]?.[u]) {
                        unitValues.push(v.nombre);
                    }
                });
            });

            valorCells.push(new TableCell({
                children: [new Paragraph({
                    children: [normal(unitValues.join(', '), 16)], // Letra pequeña para que los valores quepan bien
                    alignment: AlignmentType.LEFT
                })],
                borders: BORDER_STYLE,
                width: { size: 600, type: WidthType.DXA }
            }));
        }
        enfRows.push(new TableRow({ children: valorCells }));

        children.push(new Table({
            rows: enfRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
        }));
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7. CARACTERIZACIÓN DEL CONTEXTO
    // ═══════════════════════════════════════════════════════════════════
    children.push(sectionTitle('CARACTERIZACIÓN DEL CONTEXTO DEL ESTUDIANTE.', '7'));

    const diag = plan.diagnostico;
    const ctx = diag?.contexto;
    if (ctx) {
        const ctxHeader = [
            headerCell('ÁMBITOS / ASPECTOS', 2000),
            headerCell('FAMILIAR', 1800),
            headerCell('GRUPAL/AULA', 1800),
            headerCell('LOCAL', 1800),
            headerCell('REGIONAL', 1800),
            headerCell('NACIONAL', 1800)
        ];
        const ctxRows: TableRow[] = [new TableRow({ children: ctxHeader, tableHeader: true })];

        const aspects: Array<{ label: string; key: 'cultural' | 'economico' | 'ambiental' }> = [
            { label: 'ASPECTO CULTURAL', key: 'cultural' },
            { label: 'ECONOMICO', key: 'economico' },
            { label: 'AMBIENTAL', key: 'ambiental' },
        ];

        aspects.forEach(aspect => {
            const cells = [textCell(aspect.label, { bold: true, width: 2000 })];
            (['familiar', 'grupal', 'local', 'regional', 'nacional'] as const).forEach(ambito => {
                const celda = ctx[ambito]?.[aspect.key];
                cells.push(textCell(celda?.texto || '', { width: 1800 }));
            });
            ctxRows.push(new TableRow({ children: cells }));
        });

        children.push(new Table({
            rows: ctxRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
        }));
    }

    // ═══════════════════════════════════════════════════════════════════
    // 8. CARACTERIZACIÓN DE LOS ESTUDIANTES
    // ═══════════════════════════════════════════════════════════════════
    children.push(sectionTitle(`CARACTERIZACIÓN DE LOS ESTUDIANTES CICLO ${plan.ciclo}`, '8'));

    if (diag) {
        const charTableRows: TableRow[] = [];

        charTableRows.push(new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ children: [bold('¿QUÉ EDADES TIENEN?')], alignment: AlignmentType.CENTER })], borders: BORDER_STYLE, shading: HEADER_SHADING, rowSpan: 2, verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [bold('¿QUÉ CARACTERÍSTICAS PARTICULARES TIENEN?')], alignment: AlignmentType.CENTER })], borders: BORDER_STYLE, shading: HEADER_SHADING, columnSpan: 3 }),
                new TableCell({ children: [new Paragraph({ children: [bold('¿CÓMO LES GUSTA APRENDER? ESTRATEGIAS.')], alignment: AlignmentType.CENTER })], borders: BORDER_STYLE, shading: HEADER_SHADING, rowSpan: 2, verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [bold('¿QUÉ INTERESES, PREOCUPACIONES Y GUSTOS TIENEN?')], alignment: AlignmentType.CENTER })], borders: BORDER_STYLE, shading: HEADER_SHADING, rowSpan: 2, verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [bold('¿QUÉ LENGUAS HABLAN? – DIAGNÓSTICO SOCIOLINGÜÍSTICO Y PSICOLINGÜÍSTICO')], alignment: AlignmentType.CENTER })], borders: BORDER_STYLE, shading: HEADER_SHADING, rowSpan: 2, verticalAlign: AlignmentType.CENTER }),
            ],
        }));

        charTableRows.push(new TableRow({
            children: [
                headerCell('Cognitivos'),
                headerCell('Físicos'),
                headerCell('Emocionales'),
            ],
        }));

        charTableRows.push(new TableRow({
            children: [
                textCell(`${diag.estilos.edadMin} a ${diag.estilos.edadMax} años`, { alignment: AlignmentType.CENTER }),
                textCell(diag.caracteristicas.cognitivo.texto || ''),
                textCell(diag.caracteristicas.fisico.texto || ''),
                textCell(diag.caracteristicas.emocional.texto || ''),
                textCell(diag.estilos.estrategias || '', { alignment: AlignmentType.JUSTIFIED }),
                textCell(diag.estilos.intereses.join(', ') || '', { alignment: AlignmentType.JUSTIFIED }),
                new TableCell({
                    children: [
                        ...diag.estilos.idiomas.map(i => new Paragraph({
                            children: [bold(`${i.etiqueta}: `), normal(i.valor || 'N/A')],
                            spacing: { after: 40 }
                        })),
                        new Paragraph({
                            children: [normal(diag.estilos.diagnosticoSociolinguistico || '')],
                            spacing: { before: 80 }
                        }),
                    ],
                    borders: BORDER_STYLE,
                }),
            ],
        }));

        children.push(new Table({
            rows: charTableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
        }));
    }

    // ═══════════════════════════════════════════════════════════════════
    // 9. EVALUACIÓN (Una sola columna)
    // ═══════════════════════════════════════════════════════════════════
    children.push(sectionTitle('EVALUACIÓN', '9'));
    const evalEntries = [
        ['EVALUACIÓN DIAGNÓSTICA', plan.orientaciones?.evaluacion.diagnostica || ''],
        ['EVALUACIÓN FORMATIVA', plan.orientaciones?.evaluacion.formativa || ''],
        ['EVALUACIÓN SUMATIVA', plan.orientaciones?.evaluacion.sumativa || ''],
    ];

    children.push(new Table({
        rows: [
            new TableRow({ children: [headerCell('ENFOQUE', 3000), headerCell('ORIENTACIONES', 7000)] }),
            ...evalEntries.map(([enf, or]) => new TableRow({
                children: [
                    textCell(enf, { bold: true, width: 3000, alignment: AlignmentType.CENTER }),
                    textCell(or, { width: 7000, alignment: AlignmentType.JUSTIFIED }),
                ],
            })),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
    }));

    children.push(emptyParagraph());

    // ═══════════════════════════════════════════════════════════════════
    // 10. MATERIALES Y RECURSOS (Una sola columna)
    // ═══════════════════════════════════════════════════════════════════
    children.push(sectionTitle('MATERIALES Y RECURSOS', '10'));
    children.push(new Table({
        rows: [
            new TableRow({ children: [headerCell('DOCENTE', 5000), headerCell('ESTUDIANTE', 5000)] }),
            new TableRow({
                children: [
                    textCell(plan.orientaciones?.recursos.paraDocente || '---', { width: 5000 }),
                    textCell(plan.orientaciones?.recursos.paraEstudiante || '---', { width: 5000 }),
                ],
            }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
    }));

    children.push(emptyParagraph());

    // ═══════════════════════════════════════════════════════════════════
    // 11. REFERENCIAS BIBLIOGRÁFICAS
    // ═══════════════════════════════════════════════════════════════════
    children.push(sectionTitle('REFERENCIAS BIBLIOGRAFICAS', '11'));
    children.push(new Paragraph({
        children: [normal('• Currículo Nacional de la Educación Básica (CNEB) — MINEDU.')],
        indent: { left: convertInchesToTwip(0.3) },
        spacing: { before: 40, after: 40 },
    }));
    children.push(new Paragraph({
        children: [normal(`• Programa Curricular de Educación ${plan.nivel} — MINEDU.`)],
        indent: { left: convertInchesToTwip(0.3) },
        spacing: { before: 40, after: 40 },
    }));

    // ═══════════════════════════════════════════════════════════════════
    // 12. FIRMAS
    // ═══════════════════════════════════════════════════════════════════
    children.push(emptyParagraph());
    children.push(emptyParagraph());
    children.push(emptyParagraph());

    children.push(new Table({
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({ children: [normal('________________________________')], alignment: AlignmentType.CENTER, spacing: { before: 800 } }),
                            new Paragraph({ children: [bold(`V°B° del director del CEBA`)], alignment: AlignmentType.CENTER }),
                        ],
                        borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({ children: [normal('________________________________')], alignment: AlignmentType.CENTER, spacing: { before: 800 } }),
                            new Paragraph({ children: [bold(`Firma/sello del docente de área`)], alignment: AlignmentType.CENTER }),
                        ],
                        borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
                    }),
                ],
            }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
    }));

    // ═══════════════════════════════════════════════════════════════════
    // ASSEMBLE DOCUMENT
    // ═══════════════════════════════════════════════════════════════════
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: { orientation: PageOrientation.LANDSCAPE },
                    margin: {
                        top: convertInchesToTwip(0.5),
                        bottom: convertInchesToTwip(0.5),
                        left: convertInchesToTwip(0.5),
                        right: convertInchesToTwip(0.5),
                    },
                },
            },
            children,
        }],
    });

    return await Packer.toBlob(doc);
}

/**
 * Utility: trigger download of a blob
 */
export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

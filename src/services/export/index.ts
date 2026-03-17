/**
 * PlanX System — Exportación de Documentos Word (.docx)
 * Skill: exportacion_documentos_oficiales
 * Usa la librería `docx` para generar archivos con formato oficial MINEDU
 */

import {
    Document, Packer, Paragraph, Table, TableRow, TableCell,
    TextRun, HeadingLevel, AlignmentType, BorderStyle,
    WidthType, ShadingType
} from 'docx';
import { saveAs } from 'file-saver';
import { PlanAnual, Unidad, Sesion, PerfilDocente } from '@/types/schemas';

// ─── Estilos Base ─────────────────────────────────────────────────────────────

const FONT = 'Times New Roman';
const SIZE_NORMAL = 20; // 10pt en half-points
const SIZE_H1 = 28;
const SIZE_H2 = 24;
const COLOR_HEADER = '1A3A5C';   // Azul MINEDU
const COLOR_TEAL = '2D6A6A';
const COLOR_TABLE_HEADER = 'E8F4F4';

const cellBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'C0C0C0' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'C0C0C0' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'C0C0C0' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'C0C0C0' },
};

const makeHeaderCell = (text: string, span = 1) => new TableCell({
    children: [new Paragraph({
        children: [new TextRun({ text, bold: true, size: SIZE_NORMAL, color: COLOR_HEADER, font: FONT })],
        alignment: AlignmentType.CENTER,
    })],
    shading: { type: ShadingType.SOLID, color: COLOR_TABLE_HEADER },
    borders: cellBorder,
    columnSpan: span,
});

const makeCell = (text: string, bold = false) => new TableCell({
    children: [new Paragraph({
        children: [new TextRun({ text, bold, size: SIZE_NORMAL, font: FONT })],
    })],
    borders: cellBorder,
});

const makeParagraph = (text: string, opts?: { bold?: boolean; heading?: typeof HeadingLevel[keyof typeof HeadingLevel]; color?: string; center?: boolean; spacing?: number }) => new Paragraph({
    children: [new TextRun({
        text,
        bold: opts?.bold,
        color: opts?.color,
        size: opts?.heading ? SIZE_H2 : SIZE_NORMAL,
        font: FONT,
    })],
    heading: opts?.heading,
    alignment: opts?.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    spacing: { after: opts?.spacing ?? 120 },
});

const makeTitle = (text: string) => new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SIZE_H1, font: FONT, color: COLOR_HEADER })],
    alignment: AlignmentType.CENTER,
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 240 },
});

const makeSectionHeader = (text: string) => new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SIZE_H2, font: FONT, color: COLOR_TEAL })],
    shading: { type: ShadingType.SOLID, color: 'F0F8F8' },
    spacing: { before: 240, after: 120 },
    border: {
        bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_TEAL },
    }
});

// ─── Encabezado Institucional ─────────────────────────────────────────────────

const buildInstitucionalHeader = (perfil: PerfilDocente, plan: PlanAnual) => [
    new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    makeHeaderCell('DATOS INSTITUCIONALES', 2),
                ]
            }),
            new TableRow({
                children: [
                    makeCell('GEREDU/DRE', true),
                    makeCell(perfil.gereduDre),
                ]
            }),
            new TableRow({
                children: [
                    makeCell('UGEL', true),
                    makeCell(perfil.ugel),
                ]
            }),
            new TableRow({
                children: [
                    makeCell('I.E.', true),
                    makeCell(perfil.nombreIE),
                ]
            }),
            new TableRow({
                children: [
                    makeCell('DIRECTOR(A)', true),
                    makeCell(perfil.director),
                ]
            }),
            new TableRow({
                children: [
                    makeCell('DOCENTE', true),
                    makeCell(perfil.nombreCompleto),
                ]
            }),
            new TableRow({
                children: [
                    makeCell('ÁREA', true),
                    makeCell(plan.area),
                ]
            }),
            new TableRow({
                children: [
                    makeCell('GRADO Y SECCIÓN', true),
                    makeCell(`${plan.grado} — Ciclo ${plan.ciclo}`),
                ]
            }),
            new TableRow({
                children: [
                    makeCell('AÑO LECTIVO', true),
                    makeCell('2026'),
                ]
            }),
        ],
    }),
    new Paragraph({ text: '', spacing: { after: 240 } }),
];

// ─── EXPORTAR PLAN ANUAL ──────────────────────────────────────────────────────

export async function exportarPlanAnual(plan: PlanAnual, perfil: PerfilDocente): Promise<void> {
    const children: any[] = [
        makeTitle(`PLAN ANUAL DE TRABAJO PEDAGÓGICO — ${plan.area.toUpperCase()}`),
        makeParagraph(`${plan.grado} | Ciclo ${plan.ciclo} | I.E. ${perfil.nombreIE}`, { center: true }),
        new Paragraph({ text: '', spacing: { after: 240 } }),
        ...buildInstitucionalHeader(perfil, plan),

        // M01 — Diagnóstico
        makeSectionHeader('I. DIAGNÓSTICO INTEGRAL DEL AULA'),
        makeParagraph('1.1 Caracterización del Contexto', { bold: true }),
        makeParagraph(plan.diagnostico.estilos.diagnosticoSociolinguistico || 'No completado.'),

        makeParagraph('1.2 Características del Grupo', { bold: true }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [makeHeaderCell('DIMENSIÓN'), makeHeaderCell('NIVEL'), makeHeaderCell('DESCRIPCIÓN')] }),
                new TableRow({ children: [makeCell('Cognitivo'), makeCell(`${plan.diagnostico.caracteristicas.cognitivo.nivel}/5`), makeCell(plan.diagnostico.caracteristicas.cognitivo.texto)] }),
                new TableRow({ children: [makeCell('Físico'), makeCell(`${plan.diagnostico.caracteristicas.fisico.nivel}/5`), makeCell(plan.diagnostico.caracteristicas.fisico.texto)] }),
                new TableRow({ children: [makeCell('Emocional'), makeCell(`${plan.diagnostico.caracteristicas.emocional.nivel}/5`), makeCell(plan.diagnostico.caracteristicas.emocional.texto)] }),
            ],
        }),
        new Paragraph({ text: '', spacing: { after: 120 } }),

        // M02 — Identidad
        makeSectionHeader('II. IDENTIDAD INSTITUCIONAL Y DEL ÁREA'),
        makeParagraph(plan.identidad.descripcionArea || 'No completado.'),

        // M03 — Propósitos
        makeSectionHeader('III. PROPÓSITOS DE APRENDIZAJE Y ENFOQUES'),
        makeParagraph('3.1 Calendario Comunal', { bold: true }),
        makeParagraph(plan.calendarioComunal || 'No especificado.'),

        makeParagraph('3.2 Matriz de Competencias', { bold: true }),
        makeParagraph('Las competencias y capacidades seleccionadas están distribuidas en las unidades didácticas según la matriz de la plataforma.'),

        makeParagraph('3.3 Enfoques Transversales', { bold: true }),
        ...plan.enfoquesTransversales.map(ef =>
            makeParagraph(`■ Enfoque: ${ef.enfoqueId} (Valores: ${ef.valoresIds.join(', ')})`)
        ),

        // M04 — Estrategia
        makeSectionHeader('IV. ESTRATEGIA ANUAL — ORGANIZACIÓN DE UNIDADES'),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        makeHeaderCell('N°'),
                        makeHeaderCell('TÍTULO'),
                        makeHeaderCell('TIPO'),
                        makeHeaderCell('SITUACIÓN SIGNIFICATIVA'),
                        makeHeaderCell('PRODUCTO'),
                    ]
                }),
                ...plan.unidades.map((u, index) => new TableRow({
                    children: [
                        makeCell(`${index + 1}`),
                        makeCell(u.titulo),
                        makeCell(u.tipo.toUpperCase()),
                        makeCell(u.situacionSignificativa),
                        makeCell(u.producto),
                    ]
                })),
            ],
        }),
        new Paragraph({ text: '', spacing: { after: 120 } }),

        // M05 — Orientaciones
        makeSectionHeader('V. ORIENTACIONES PARA LA EVALUACIÓN Y RECURSOS'),
        makeParagraph('5.1 Evaluación Diagnóstica', { bold: true }),
        makeParagraph(plan.orientaciones.evaluacion.diagnostica || 'No completado.'),
        makeParagraph('5.2 Evaluación Formativa', { bold: true }),
        makeParagraph(plan.orientaciones.evaluacion.formativa || 'No completado.'),
        makeParagraph('5.3 Evaluación Sumativa', { bold: true }),
        makeParagraph(plan.orientaciones.evaluacion.sumativa || 'No completado.'),
        makeParagraph('5.4 Recursos para el Docente', { bold: true }),
        makeParagraph(plan.orientaciones.recursos.paraDocente || 'No completado.'),
        makeParagraph('5.5 Recursos para el Estudiante', { bold: true }),
        makeParagraph(plan.orientaciones.recursos.paraEstudiante || 'No completado.'),

        makeParagraph(`\n\n_________________________\n${perfil.nombreCompleto}\nDOCENTE DEL ÁREA`, { center: true }),
    ];

    const doc = new Document({
        sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 1440 } } }, children }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Plan_Anual_${plan.area}_${plan.grado}_2026.docx`);
}

// ─── EXPORTAR UNIDAD ──────────────────────────────────────────────────────────

export async function exportarUnidad(unidad: Unidad, plan: PlanAnual, perfil: PerfilDocente, sesiones: Sesion[]): Promise<void> {
    const tipoLabel = unidad.tipo === 'proyecto' ? 'PROYECTO DE APRENDIZAJE' : unidad.tipo === 'modulo' ? 'MÓDULO DE APRENDIZAJE' : 'UNIDAD DE APRENDIZAJE';
    const bimestreNum = Math.ceil(unidad.numero / 2);

    // Helpers locales para coincidir con la lógica de la vista previa
    const fmtDate = (iso: string) => {
        if (!iso) return '---';
        const d = new Date(iso + 'T00:00:00');
        return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const calcDuracion = (inicio: string, termino: string): string => {
        if (!inicio || !termino) return '---';
        const d1 = new Date(inicio);
        const d2 = new Date(termino);
        const diffMs = d2.getTime() - d1.getTime();
        const weeks = Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));
        return `${weeks} semana${weeks !== 1 ? 's' : ''}`;
    };

    const children: any[] = [
        // Título Principal
        new Paragraph({
            children: [new TextRun({ text: `${tipoLabel} N° ${unidad.numero}`, bold: true, size: 24, font: FONT })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        }),

        // 1. DATOS INFORMATIVOS
        makeParagraph('1. DATOS INFORMATIVOS', { bold: true }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                ['1.1. Área', plan.area],
                ['1.2. Docente', perfil.nombreCompleto],
                ['1.3. Grado/sección', plan.grado],
                ['1.4. Bimestre', `${plan.periodoTipo} ${bimestreNum}`],
                ['1.5. Duración', `${fmtDate(unidad.organizaStep.fechaInicio)} al ${fmtDate(unidad.organizaStep.fechaTermino)} (${calcDuracion(unidad.organizaStep.fechaInicio, unidad.organizaStep.fechaTermino)})`],
                ['1.6. N° de horas semanales', `${plan.sesionesPorSemana} horas`],
            ].map(([label, value]) => new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: FONT })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 30, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: ':', bold: true, size: 20, font: FONT })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 5, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: value || '---', size: 20, font: FONT })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 65, type: WidthType.PERCENTAGE } }),
                ]
            }))
        }),
        new Paragraph({ text: '', spacing: { after: 240 } }),

        // 2. TÍTULO
        makeParagraph('2. TÍTULO', { bold: true }),
        makeParagraph(unidad.diagnosticoStep.titulo || '(Sin título)', { bold: true, spacing: 240 }),

        // 3. PROPÓSITO DE APRENDIZAJE
        makeParagraph('3. PROPÓSITO DE APRENDIZAJE', { bold: true }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        makeHeaderCell('COMPETENCIAS Y CAPACIDADES'),
                        makeHeaderCell('DESEMPEÑOS PRECISADOS'),
                        makeHeaderCell('EVIDENCIAS DE APRENDIZAJE'),
                        makeHeaderCell('INSTRUMENTOS DE EVALUACIÓN'),
                    ]
                }),
                ...unidad.disenaStep.competencias.filter(c => c.seleccionada).map(comp => {
                    const desempenos = unidad.disenaStep.desempenos
                        .filter(d => d.desempenoId.toLowerCase().includes(comp.competenciaId.toLowerCase().slice(0, 10)));
                    
                    return new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({ children: [new TextRun({ text: comp.competenciaId, bold: true, size: 18, font: FONT })], spacing: { after: 60 } }),
                                    ...comp.capacidades.filter(cap => cap.seleccionada).map(cap => 
                                        new Paragraph({ children: [new TextRun({ text: `• ${cap.capacidadId}`, size: 18, font: FONT })], spacing: { after: 40 } })
                                    )
                                ],
                                borders: cellBorder
                            }),
                            new TableCell({
                                children: desempenos.map(d => new Paragraph({ 
                                    children: [new TextRun({ text: `• ${d.precisado || d.texto}`, size: 18, font: FONT })],
                                    spacing: { after: 120 }
                                })),
                                borders: cellBorder
                            }),
                            makeCell(unidad.diagnosticoStep.productoTentativo || '---'),
                            makeCell('Lista de Cotejo')
                        ]
                    });
                })
            ]
        }),
        new Paragraph({ text: '', spacing: { after: 240 } }),

        // Enfoques Transversales
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [makeHeaderCell('ENFOQUES TRANSVERSALES'), makeHeaderCell('VALORES/ACTITUDES')] }),
                ...(plan.enfoquesTransversales || []).map(enf => new TableRow({
                    children: [
                        makeCell(enf.enfoqueId, true),
                        makeCell(enf.valoresIds.join(', '))
                    ]
                }))
            ]
        }),
        new Paragraph({ text: '', spacing: { after: 240 } }),

        // 4. SITUACIÓN SIGNIFICATIVA
        makeParagraph('4. SITUACIÓN SIGNIFICATIVA', { bold: true }),
        ...unidad.diagnosticoStep.situacionSignificativa.split('\n').map(p => 
            new Paragraph({
                children: [new TextRun({ text: p.trim(), size: 20, font: FONT })],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 120 },
                indent: { firstLine: 720 } // 1.27cm aprox
            })
        ),
        new Paragraph({ text: '', spacing: { after: 240 } }),

        // 5. SECUENCIA DE SESIONES
        makeParagraph('5. SECUENCIA DE SESIONES', { bold: true }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        makeHeaderCell('Sesión y Descripción'),
                        makeHeaderCell('Planificación Curricular y PRODUCTO'),
                    ]
                }),
                ...sesiones.map((s, i) => new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: `Sesión ${i + 1}: ${s.titulo}`, bold: true, size: 20, font: FONT })],
                                    spacing: { after: 120 }
                                }),
                                new Paragraph({ children: [new TextRun({ text: `• Inicio: ${s.secuenciaDidactica.inicio.descripcion.slice(0, 300)}...`, size: 18, font: FONT })], spacing: { after: 60 } }),
                                new Paragraph({ children: [new TextRun({ text: `• Desarrollo: ${s.secuenciaDidactica.desarrollo.descripcion.slice(0, 400)}...`, size: 18, font: FONT })], spacing: { after: 60 } }),
                                new Paragraph({ children: [new TextRun({ text: `• Cierre: ${s.secuenciaDidactica.cierre.descripcion.slice(0, 200)}...`, size: 18, font: FONT })] })
                            ],
                            borders: cellBorder,
                            width: { size: 50, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({ children: [new TextRun({ text: 'COMPETENCIA: ', bold: true, size: 18, font: FONT }), new TextRun({ text: s.competenciaId || '---', size: 18, font: FONT })], spacing: { after: 120 } }),
                                new Paragraph({ children: [new TextRun({ text: 'DESEMPEÑO: ', bold: true, size: 18, font: FONT }), new TextRun({ text: s.desempenoPrecisado || '---', size: 18, font: FONT })], spacing: { after: 120 } }),
                                new Paragraph({ children: [new TextRun({ text: 'PRODUCTO: ', bold: true, size: 18, font: FONT }), new TextRun({ text: s.evidencia || s.proposito || '---', size: 18, font: FONT })] })
                            ],
                            borders: cellBorder,
                            width: { size: 50, type: WidthType.PERCENTAGE }
                        })
                    ]
                })),
            ],
        }),
        new Paragraph({ text: '', spacing: { after: 240 } }),

        // 6. EVALUACIÓN
        makeParagraph('6. EVALUACIÓN', { bold: true }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [makeHeaderCell('CRITERIO DE EVALUACIÓN'), makeHeaderCell('EVIDENCIA / INSTRUMENTO')] }),
                ...unidad.disenaStep.criterios.map(crit => new TableRow({
                    children: [
                        makeCell(crit.descripcion),
                        makeCell(crit.evidencia || '---')
                    ]
                }))
            ]
        }),
        new Paragraph({ text: '', spacing: { after: 240 } }),

        // 7. RECURSOS Y MATERIALES
        makeParagraph('7. RECURSOS Y MATERIALES', { bold: true }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [makeHeaderCell('PARA LOS ESTUDIANTES'), makeHeaderCell('PARA EL DOCENTE')] }),
                new TableRow({
                    children: [
                        makeCell(plan.orientaciones.recursos.paraEstudiante || '---'),
                        makeCell(plan.orientaciones.recursos.paraDocente || '---')
                    ]
                })
            ]
        }),
        new Paragraph({ text: '', spacing: { after: 240 } }),

        // 8. REFERENCIAS BIBLIOGRÁFICAS
        makeParagraph('8. REFERENCIAS BIBLIOGRÁFICAS', { bold: true }),
        makeParagraph('• Currículo Nacional de la Educación Básica (CNEB) — MINEDU.'),
        makeParagraph('• Programa Curricular de Educación Secundaria — MINEDU.'),
        makeParagraph('• Guía de Planificación Curricular para Educación Secundaria — MINEDU.'),

        // Firmas
        new Paragraph({ text: '', spacing: { before: 800 } }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '_______________________________', size: 20, font: FONT })], alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: 'V°B° del director', bold: true, size: 18, font: FONT })], alignment: AlignmentType.CENTER })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '_______________________________', size: 20, font: FONT })], alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: 'Firma/sello del docente de área', bold: true, size: 18, font: FONT })], alignment: AlignmentType.CENTER })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
                    ]
                })
            ]
        })
    ];

    const doc = new Document({
        sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 1440 } } }, children }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${tipoLabel}_${unidad.numero}_${plan.area}_2026.docx`);
}

// ─── EXPORTAR SESIÓN ──────────────────────────────────────────────────────────

export async function exportarSesion(sesion: Sesion, unidad: Unidad, plan: PlanAnual, perfil: PerfilDocente): Promise<void> {
    const totalMin = (sesion.secuenciaDidactica?.inicio?.duracionMinutos || 0)
        + (sesion.secuenciaDidactica?.desarrollo?.duracionMinutos || 0)
        + (sesion.secuenciaDidactica?.cierre?.duracionMinutos || 0);

    const children: any[] = [
        makeTitle('SESIÓN DE APRENDIZAJE'),
        new Paragraph({ text: '', spacing: { after: 120 } }),

        // Datos Generales
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [makeHeaderCell('DATOS DE LA SESIÓN', 4)] }),
                new TableRow({
                    children: [
                        makeCell('I.E.', true), makeCell(perfil.nombreIE),
                        makeCell('DOCENTE', true), makeCell(perfil.nombreCompleto),
                    ]
                }),
                new TableRow({
                    children: [
                        makeCell('ÁREA', true), makeCell(plan.area),
                        makeCell('GRADO', true), makeCell(plan.grado),
                    ]
                }),
                new TableRow({
                    children: [
                        makeCell('TÍTULO', true), makeCell(sesion.titulo, false),
                        makeCell('DURACIÓN', true), makeCell(`${totalMin} minutos`),
                    ]
                }),
                new TableRow({
                    children: [
                        makeCell('UNIDAD N°', true), makeCell(`${unidad.numero} — ${unidad.diagnosticoStep.titulo}`),
                        makeCell('FECHA', true), makeCell(new Date().toLocaleDateString('es-PE')),
                    ]
                }),
            ],
        }),
        new Paragraph({ text: '', spacing: { after: 240 } }),

        // Propósito y Evaluación
        makeSectionHeader('I. PROPÓSITO DE LA SESIÓN'),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [makeHeaderCell('COMPETENCIA'), makeHeaderCell('CAPACIDAD'), makeHeaderCell('DESEMPEÑO PRECISADO')] }),
                new TableRow({ children: [makeCell(sesion.competenciaId), makeCell(sesion.capacidadId), makeCell(sesion.desempenoPrecisado)] }),
            ],
        }),
        new Paragraph({ text: '', spacing: { after: 120 } }),
        makeParagraph('Propósito General de la Sesión:', { bold: true }),
        makeParagraph(sesion.proposito || 'No definido.'),

        // Evidencia e Instrumento
        makeSectionHeader('II. EVALUACIÓN'),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [makeHeaderCell('EVIDENCIA DE APRENDIZAJE'), makeHeaderCell('INSTRUMENTO DE EVALUACIÓN')] }),
                new TableRow({ children: [makeCell(sesion.evidencia), makeCell(sesion.instrumento)] }),
            ],
        }),
        new Paragraph({ text: '', spacing: { after: 240 } }),

        // Secuencia Didáctica
        makeSectionHeader('III. SECUENCIA DIDÁCTICA (Momentos y Procesos Pedagógicos)'),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ 
                    children: [
                        makeHeaderCell('MOMENTOS', 1), 
                        makeHeaderCell('ESTRATEGIAS Y PROCESOS PEDAGÓGICOS / DIDÁCTICOS', 2), 
                        makeHeaderCell('RECURSOS', 1),
                        makeHeaderCell('T', 1)
                    ] 
                }),
                // MOMENTO: INICIO
                new TableRow({
                    children: [
                        makeCell('INICIO', true),
                        new TableCell({
                            children: [
                                new Paragraph({ 
                                    children: [new TextRun({ text: sesion.secuenciaDidactica?.inicio?.descripcion || 'No definida.', size: 18, font: FONT })],
                                    spacing: { after: 120 }
                                }),
                                ...(sesion.secuenciaDidactica?.inicio?.estrategiaMetodologica ? [
                                    new Paragraph({ 
                                        children: [new TextRun({ text: 'Estrategia: ', bold: true, size: 16, font: FONT, color: COLOR_TEAL }), new TextRun({ text: sesion.secuenciaDidactica.inicio.estrategiaMetodologica, size: 16, font: FONT })] 
                                    })
                                ] : [])
                            ],
                            borders: cellBorder,
                            columnSpan: 2
                        }),
                        makeCell(sesion.secuenciaDidactica?.inicio?.recursosMateriales || 'Plumones, otros.', false),
                        makeCell(`${sesion.secuenciaDidactica?.inicio?.duracionMinutos || 0}'`),
                    ]
                }),
                // MOMENTO: DESARROLLO
                new TableRow({
                    children: [
                        makeCell('DESARROLLO', true),
                        new TableCell({
                            children: [
                                new Paragraph({ 
                                    children: [new TextRun({ text: sesion.secuenciaDidactica?.desarrollo?.descripcion || 'No definida.', size: 18, font: FONT })],
                                    spacing: { after: 120 }
                                }),
                                ...(sesion.secuenciaDidactica?.desarrollo?.estrategiaMetodologica ? [
                                    new Paragraph({ 
                                        children: [new TextRun({ text: 'Estrategia: ', bold: true, size: 16, font: FONT, color: COLOR_TEAL }), new TextRun({ text: sesion.secuenciaDidactica.desarrollo.estrategiaMetodologica, size: 16, font: FONT })] 
                                    })
                                ] : [])
                            ],
                            borders: cellBorder,
                            columnSpan: 2
                        }),
                        makeCell(sesion.secuenciaDidactica?.desarrollo?.recursosMateriales || 'Cuadernos, otros.', false),
                        makeCell(`${sesion.secuenciaDidactica?.desarrollo?.duracionMinutos || 0}'`),
                    ]
                }),
                // MOMENTO: CIERRE
                new TableRow({
                    children: [
                        makeCell('CIERRE', true),
                        new TableCell({
                            children: [
                                new Paragraph({ 
                                    children: [new TextRun({ text: sesion.secuenciaDidactica?.cierre?.descripcion || 'No definida.', size: 18, font: FONT })],
                                    spacing: { after: 120 }
                                }),
                                ...(sesion.secuenciaDidactica?.cierre?.estrategiaMetodologica ? [
                                    new Paragraph({ 
                                        children: [new TextRun({ text: 'Estrategia: ', bold: true, size: 16, font: FONT, color: COLOR_TEAL }), new TextRun({ text: sesion.secuenciaDidactica.cierre.estrategiaMetodologica, size: 16, font: FONT })] 
                                    })
                                ] : [])
                            ],
                            borders: cellBorder,
                            columnSpan: 2
                        }),
                        makeCell(sesion.secuenciaDidactica?.cierre?.recursosMateriales || 'Checklist, otros.', false),
                        makeCell(`${sesion.secuenciaDidactica?.cierre?.duracionMinutos || 0}'`),
                    ]
                }),
            ],
        }),
        new Paragraph({ text: '', spacing: { after: 240 } }),

        // Recursos (General)
        makeSectionHeader('IV. RECURSOS Y MATERIALES'),
        makeParagraph((sesion.recursos || []).length > 0 ? (sesion.recursos || []).join(', ') : 'Pizarra, plumones, cuadernos de trabajo.'),

        // Instrumento de Evaluación
        ...(sesion.instrumentoContenido ? [
            makeSectionHeader('V. INSTRUMENTO DE EVALUACIÓN'),
            makeParagraph(sesion.instrumentoContenido),
        ] : []),

        new Paragraph({ text: '', spacing: { after: 480 } }),
        makeParagraph(`\n_________________________\n${perfil.nombreCompleto}\nDOCENTE DEL ÁREA`, { center: true }),
    ];

    const doc = new Document({
        sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 1440 } } }, children }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Sesion_${sesion.orden}_${sesion.titulo.replace(/\s+/g, '_')}.docx`);
}

// ─── PRINT SESIÓN (PDF EXPRESS) ───────────────────────────────────────────────

/**
 * Genera una vista de impresión optimizada para PDF rápido.
 * Abre una nueva ventana con estilos MINEDU y el contenido de la sesión.
 */
export function printSesion(sesion: Sesion, unidad: Unidad, plan: PlanAnual, perfil: PerfilDocente): void {
    const totalMin = (sesion.secuenciaDidactica?.inicio?.duracionMinutos || 0)
        + (sesion.secuenciaDidactica?.desarrollo?.duracionMinutos || 0)
        + (sesion.secuenciaDidactica?.cierre?.duracionMinutos || 0);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
        <html>
            <head>
                <title>Sesión de Aprendizaje — ${sesion.titulo}</title>
                <style>
                    body { font-family: 'Times New Roman', serif; padding: 40px; color: #1a1a1a; max-width: 900px; margin: 0 auto; line-height: 1.5; }
                    .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1A3A5C; padding-bottom: 15px; margin-bottom: 25px; }
                    .logo-placeholder { width: 140px; height: 60px; background: #f8f8f8; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #999; font-weight: bold; text-align: center; text-transform: uppercase; }
                    .header-text { text-align: right; }
                    .header-text h1 { color: #1A3A5C; margin: 0; font-size: 16px; text-transform: uppercase; font-weight: 900; }
                    .header-text p { margin: 1px 0; font-size: 11px; font-weight: bold; color: #444; }
                    
                    .main-title { text-align: center; font-size: 18px; margin: 25px 0; font-weight: 900; text-transform: uppercase; text-decoration: underline; color: #1A3A5C; }
                    h2 { color: #2D6A6A; border-bottom: 1px solid #2D6A6A; font-size: 13px; padding-bottom: 4px; margin-top: 25px; text-transform: uppercase; font-weight: 900; }
                    
                    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
                    th, td { border: 1px solid #666; padding: 8px; text-align: left; vertical-align: top; }
                    th { background-color: #f2f7f7; color: #1A3A5C; font-weight: 900; text-align: center; text-transform: uppercase; }
                    .momento { font-weight: 900; background-color: #fafafa; color: #1A3A5C; width: 100px; text-align: center; }
                    
                    .footer { margin-top: 70px; display: flex; justify-content: space-around; }
                    .signature { border-top: 1px solid #000; width: 220px; text-align: center; padding-top: 8px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #444; }
                    
                    @media print {
                        body { padding: 0; }
                        @page { margin: 1.5cm; }
                    }
                </style>
            </head>
            <body>
                <div class="header-container">
                    ${perfil.logoInstitucionalUrl 
                        ? `<img src="${perfil.logoInstitucionalUrl}" style="height: 60px;" alt="Logo IE" />`
                        : `<div class="logo-placeholder">MINEDU / ESCUDO<br>INSTITUCIONAL</div>`
                    }
                    <div class="header-text">
                        <h1>Sesión de Aprendizaje</h1>
                        <p>UGEL: ${perfil.ugel || 'PERÚ'} — DRE: ${perfil.gereduDre || 'MINEDU'}</p>
                        <p>I.E.: ${perfil.nombreIE || 'PLANX ACADEMY'}</p>
                        <p>AÑO: 2026</p>
                    </div>
                </div>

                <div class="main-title">PLANIFICACIÓN DE LA SESIÓN DE APRENDIZAJE N° ${sesion.orden}</div>

                <h2>I. DATOS INFORMATIVOS</h2>
                <table>
                    <tr>
                        <th width="150">Área Curricular</th>
                        <td>${plan.area}</td>
                        <th width="150">Grado y Sección</th>
                        <td>${plan.grado} — ${plan.ciclo}</td>
                    </tr>
                    <tr>
                        <th>Título de la Sesión</th>
                        <td colspan="3">${sesion.titulo}</td>
                    </tr>
                    <tr>
                        <th>Unidad Didáctica</th>
                        <td>N° ${unidad.numero} — ${unidad.diagnosticoStep.titulo}</td>
                        <th>Duración</th>
                        <td>${totalMin} Minutos</td>
                    </tr>
                </table>

                <h2>II. PROPÓSITOS DE APRENDIZAJE Y EVALUACIÓN</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Competencia</th>
                            <th>Capacidad</th>
                            <th>Desempeño Precisado</th>
                            <th>Evidencia / Instrumento</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${sesion.competenciaId}</td>
                            <td>${sesion.capacidadId}</td>
                            <td>${sesion.desempenoPrecisado}</td>
                            <td>
                                <b>Evid.:</b> ${sesion.evidencia}<br>
                                <b>Inst.:</b> ${sesion.instrumento}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h2>III. SECUENCIA DIDÁCTICA</h2>
                <table>
                    <thead>
                        <tr>
                            <th width="100">Momento</th>
                            <th>Estrategias y Procesos Pedagógicos</th>
                            <th width="50">T.</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="momento">INICIO</td>
                            <td>
                                <b>Actividades:</b> ${sesion.secuenciaDidactica?.inicio?.descripcion}<br>
                                <i><b>Estrategias/Recursos:</b> ${sesion.secuenciaDidactica?.inicio?.estrategiaMetodologica || ''}</i>
                            </td>
                            <td style="text-align:center">${sesion.secuenciaDidactica?.inicio?.duracionMinutos || 0}'</td>
                        </tr>
                        <tr>
                            <td class="momento">DESARROLLO</td>
                            <td>
                                <b>Actividades:</b> ${sesion.secuenciaDidactica?.desarrollo?.descripcion}<br>
                                <i><b>Estrategias/Recursos:</b> ${sesion.secuenciaDidactica?.desarrollo?.estrategiaMetodologica || ''}</i>
                            </td>
                            <td style="text-align:center">${sesion.secuenciaDidactica?.desarrollo?.duracionMinutos || 0}'</td>
                        </tr>
                        <tr>
                            <td class="momento">CIERRE</td>
                            <td>
                                <b>Actividades:</b> ${sesion.secuenciaDidactica?.cierre?.descripcion}<br>
                                <i><b>Estrategias/Recursos:</b> ${sesion.secuenciaDidactica?.cierre?.estrategiaMetodologica || ''}</i>
                            </td>
                            <td style="text-align:center">${sesion.secuenciaDidactica?.cierre?.duracionMinutos || 0}'</td>
                        </tr>
                    </tbody>
                </table>

                <div class="footer">
                    <div class="signature">Firma del Docente</div>
                    <div class="signature">V°B° del Director</div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        // Opcional: window.close();
                    }
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

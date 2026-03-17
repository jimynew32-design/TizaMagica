/**
 * DocumentPreview.tsx — Vista previa formal del Plan Anual
 * Simula un documento A4 con fondo blanco, Times New Roman 10pt,
 * tablas con bordes y estructura oficial MINEDU.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlanAnualStore, usePerfilStore, useNotificationStore } from '@/store';
import { cnebService } from '@/services/cneb';
import { ENFOQUES_TRANSVERSALES } from '@/services/cneb/enfoques-transversales';
import { exportPlanAnualToDocx, downloadBlob } from '@/services/export/exportPlanAnualToDocx';
import type { CNEBCompetencia } from '@/types/schemas';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugId(name: string): string {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').slice(0, 40);
}

function matrixIdComp(name: string): string {
    return `comp_${slugId(name)}`;
}

function matrixIdCap(compName: string, capName: string): string {
    return `comp_${slugId(compName)}_cap_${slugId(capName)}`;
}

/** Obtiene el estándar buscando coincidencia parcial con el ciclo (ej: "VI" -> "Ciclo VI") */
function getEstandar(comp: CNEBCompetencia, ciclo: string): string {
    if (!comp.estandares) return '';
    const keys = Object.keys(comp.estandares);
    const match = keys.find(k => k.toUpperCase().includes(ciclo.toUpperCase()));
    return match ? comp.estandares[match] : '';
}

/** Filtra desempeños normalizando el grado (ej: "1ero" -> "1er grado") */
function filterDesempenos(comp: CNEBCompetencia, grado: string): any[] {
    if (!comp.desempenos) return [];
    const gNum = grado.replace(/[^0-9]/g, '');
    if (!gNum) return comp.desempenos.filter(d => d.grado.toLowerCase().includes(grado.toLowerCase()));

    return comp.desempenos.filter(d => {
        const dNum = d.grado.replace(/[^0-9]/g, '');
        return dNum === gNum || d.grado.toLowerCase().includes(grado.toLowerCase());
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

export const DocumentPreview: React.FC = () => {
    const navigate = useNavigate();
    const { planActivo } = usePlanAnualStore();
    const { perfil } = usePerfilStore();
    const { showNotification } = useNotificationStore();

    const [areaComps, setAreaComps] = useState<CNEBCompetencia[]>([]);
    const [transComps, setTransComps] = useState<CNEBCompetencia[]>([]);
    const [exporting, setExporting] = useState(false);

    const matrix = planActivo?.matrizCompetencias || {};
    const unidades = planActivo?.unidades || [];

    useEffect(() => {
        const load = async () => {
            if (!planActivo) return;
            const [a, t] = await Promise.all([
                cnebService.getCompetenciasByAreaNivel(planActivo.area, planActivo.nivel),
                cnebService.getCompetenciasByAreaNivel('Competencias Transversales', planActivo.nivel),
            ]);
            setAreaComps(a);
            setTransComps(t);
        };
        load();
    }, [planActivo?.area, planActivo?.nivel]);

    const allComps = useMemo(() => [...areaComps, ...transComps], [areaComps, transComps]);

    const handleExport = async () => {
        if (!planActivo || !perfil) return;
        setExporting(true);
        try {
            const blob = await exportPlanAnualToDocx({ plan: planActivo, perfil, areaComps, transComps });
            const filename = `Plan_Anual_${planActivo.area.replace(/\s+/g, '_')}_${planActivo.grado}_${new Date().getFullYear()}.docx`;
            downloadBlob(blob, filename);
            showNotification({ title: '¡Exportado!', message: `${filename} descargado exitosamente.`, type: 'success', duration: 4000 });
        } catch (err: any) {
            console.error('Error exportando:', err);
            showNotification({ title: 'Error', message: `No se pudo exportar: ${err.message}`, type: 'error' });
        } finally {
            setExporting(false);
        }
    };

    if (!planActivo || !perfil) {
        return <div className="text-white p-10 font-black">SELECCIONA UN PLAN PRIMERO</div>;
    }

    const ctx = planActivo.diagnostico?.contexto;
    const diag = planActivo.diagnostico;

    const isChecked = (id: string, uIdx: number): boolean => matrix[id]?.[uIdx] ?? false;

    // Estilos de página y visor
    const pageSheetStyle: React.CSSProperties = {
        width: '297mm',
        minHeight: '210mm',
        backgroundColor: '#fff',
        margin: '20px auto',
        padding: '12.7mm', // Margen Estrecho (0.5 pulg)
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        boxSizing: 'border-box',
        position: 'relative',
        fontFamily: '"Times New Roman", Times, serif',
        color: '#000',
        fontSize: '10pt',
        lineHeight: '1.3',
    };

    const previewContainerStyle: React.CSSProperties = {
        backgroundColor: '#525659',
        minHeight: '100vh',
        width: '100%',
        paddingBottom: '50px',
        overflowY: 'auto'
    };

    // ─── Render ──────────────────────────────────────────────────────────

    return (
        <div style={previewContainerStyle}>
            {/* Toolbar */}
            <div className="sticky top-0 z-50 bg-[#1e2233] border-b border-white/10 px-6 py-3 flex items-center justify-between shadow-2xl no-print">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <span className="material-icons-round">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-sm font-black text-white uppercase tracking-wider">Vista Previa del Documento</h1>
                        <p className="text-[10px] text-gray-400">{planActivo.area} — {planActivo.grado}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="px-6 py-2.5 rounded-xl bg-teal-500 text-gray-900 font-bold text-xs uppercase hover:bg-teal-400 transition-all disabled:opacity-50 shadow-lg shadow-teal-500/20"
                    >
                        <span className="material-icons-round text-lg">{exporting ? 'sync' : 'file_download'}</span>
                        {exporting ? 'Generando...' : 'Exportar a Word'}
                    </button>
                </div>
            </div>

            {/* HOJA 1: Identidad y Unidades */}
            <div style={pageSheetStyle}>
                <p style={{ textAlign: 'center', fontSize: '12pt', fontWeight: 'bold', marginBottom: '20px', textTransform: 'uppercase' }}>
                    PROGRAMACIÓN ANUAL
                </p>

                <SectionHeader num="1" title="DATOS INFORMATIVOS" />
                <table style={{ border: 'none', borderCollapse: 'collapse', fontSize: '10pt', width: '100%', marginBottom: '15px' }}>
                    <tbody>
                        {[
                            ['1.1. GEREDU', perfil.gereduDre],
                            ['1.2. UGEL', perfil.ugel],
                            ['1.3. INSTITUCIÓN EDUCATIVA', perfil.nombreIE],
                            ['1.4. DIRECTOR', perfil.director],
                            ['1.5. DOCENTE', perfil.nombreCompleto],
                            ['1.6. MODALIDAD/NIVEL', planActivo.nivel],
                            ['1.7. CICLO/GRADO/SECCIÓN', `${planActivo.ciclo} / ${planActivo.grado}`],
                            ['1.8. ÁREA CURRICULAR', planActivo.area],
                            ['1.9. HORAS PEDAGÓGICAS SEMANALES', `${planActivo.sesionesPorSemana} horas`],
                        ].map(([label, value], i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 'bold', width: '220px', padding: '1px' }}>{label}</td>
                                <td style={{ fontWeight: 'bold', width: '20px' }}>:</td>
                                <td style={{ padding: '1px' }}>{value || '---'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <SectionHeader num="2" title="DESCRIPCIÓN GENERAL" />
                <div style={{ textAlign: 'justify', marginBottom: '15px' }}>
                    {(planActivo.identidad?.descripcionArea || '').split('\n').filter(Boolean).map((p, i) => (
                        <p key={i} style={{ textIndent: '1.27cm', marginBottom: '6px' }}>{p.trim()}</p>
                    ))}
                </div>

                <SectionHeader num="3" title="ORGANIZACIÓN DE LAS UNIDADES Y TÍTULOS DIDÁCTICOS RELACIONADOS AL CONTEXTO:" />
                <table style={tblStyle}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: '45%' }}>SITUACIÓN SIGNIFICATIVA</th>
                            <th style={{ ...thStyle, width: '40px' }}>UN</th>
                            <th style={thStyle}>POSIBLE TÍTULO</th>
                            <th style={{ ...thStyle, width: '100px' }}>TIEMPO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {unidades.map((u, i) => {
                            const [s, e] = (u.fecha || '').split('|');
                            const label = u.tipo === 'Unidad' ? 'U' : u.tipo === 'Proyecto' ? 'P' : 'M';
                            return (
                                <tr key={u.id}>
                                    <td style={{ ...tdStyle, fontSize: '9pt', textAlign: 'justify' }}>{u.situacionSignificativa}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>{label}{i + 1}</td>
                                    <td style={{ ...tdStyle, fontSize: '9pt' }}>{u.titulo}</td>
                                    <td style={{ ...tdStyle, fontSize: '8.5pt' }}>
                                        <b>In:</b> {s}<br /><b>T:</b> {e}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* HOJA 2: Matriz de Propósitos */}
            <div style={pageSheetStyle}>
                <SectionHeader num="4" title="ORGANIZACIÓN DE LOS PROPÓSITOS DE APRENDIZAJE" />
                <table style={tblStyle}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: '280px' }}>COMPETENCIAS Y CAPACIDADES</th>
                            {unidades.map((u, i) => {
                                const l = u.tipo === 'Unidad' ? 'U' : u.tipo === 'Proyecto' ? 'P' : 'M';
                                return <th key={i} style={{ ...thStyle, width: '30px', fontSize: '8.5pt' }}>{l}{i + 1}</th>;
                            })}
                            <th style={thStyle}>ESTÁNDARES DE APRENDIZAJE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allComps.map(comp => (
                            <React.Fragment key={comp.nombre}>
                                <tr style={{ backgroundColor: '#f5f7fb' }}>
                                    <td style={{ ...tdStyle, fontWeight: 'bold' }}>{comp.nombre}</td>
                                    {unidades.map((_, ui) => (
                                        <td key={ui} style={checkTdStyle}>{isChecked(matrixIdComp(comp.nombre), ui) ? 'X' : ''}</td>
                                    ))}
                                    <td rowSpan={comp.capacidades.length + 1} style={{ ...tdStyle, fontSize: '8pt', textAlign: 'justify' }}>
                                        {getEstandar(comp, planActivo.ciclo || '')}
                                    </td>
                                </tr>
                                {comp.capacidades.map(cap => (
                                    <tr key={cap}>
                                        <td style={{ ...tdStyle, paddingLeft: '15px', fontSize: '9pt' }}>- {cap}</td>
                                        {unidades.map((_, ui) => (
                                            <td key={ui} style={checkTdStyle}>{isChecked(matrixIdCap(comp.nombre, cap), ui) ? 'X' : ''}</td>
                                        ))}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* HOJA 3: Competencias, Capacidades y Estándares (Detalle 5) */}
            <div style={pageSheetStyle}>
                <SectionHeader num="5" title={`COMPETENCIAS, CAPACIDADES Y ESTÁNDARES DE APRENDIZAJE - ${planActivo.area.toUpperCase()}`} />
                <table style={tblStyle}>
                    <thead>
                        <tr><th colSpan={3} style={{ ...thStyle, backgroundColor: '#eaeff7' }}>DESCRIPCION GENERAL</th></tr>
                        <tr>
                            <th style={{ ...thStyle, width: '25%' }}>COMPETENCIAS / CAPACIDADES</th>
                            <th style={{ ...thStyle, width: '45%' }}>DESEMPEÑOS DEL GRADO ({planActivo.grado})</th>
                            <th style={{ ...thStyle, width: '30%' }}>ESTÁNDARES DE APRENDIZAJE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {areaComps.map(comp => {
                            const gradeDesempenos = filterDesempenos(comp, planActivo.grado || '');
                            return (
                                <tr key={comp.nombre}>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{comp.nombre}</div>
                                        {comp.capacidades.map(cap => <div key={cap} style={{ marginLeft: '10px', fontSize: '9pt', marginBottom: '2px' }}>• {cap}</div>)}
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: '9pt', textAlign: 'justify' }}>
                                        {gradeDesempenos.map((d, di) => <p key={di} style={{ marginBottom: '6px' }}><strong>[{d.capacidad}]</strong> {d.texto}</p>)}
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: '9pt', textAlign: 'justify' }}>
                                        {getEstandar(comp, planActivo.ciclo || '')}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* HOJA 4: Enfoques y Contexto */}
            <div style={pageSheetStyle}>
                <SectionHeader num="6" title="ENFOQUES TRANSVERSALES" />
                <table style={tblStyle}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: '300px' }}>ENFOQUES TRANSVERSALES</th>
                            {unidades.map((u, i) => {
                                const l = u.tipo === 'Unidad' ? 'U' : u.tipo === 'Proyecto' ? 'P' : 'M';
                                return (
                                    <th key={i} style={{ ...thStyle, width: '40px', fontSize: '8pt' }}>
                                        {l}{i + 1}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {ENFOQUES_TRANSVERSALES.map(enf => {
                            const isEnfoqueSelected = (ui: number) => {
                                // Se marca si el enfoque mismo o cualquiera de sus valores está seleccionado
                                return isChecked(enf.id, ui) || enf.valores.some(v => isChecked(`${enf.id}_val_${v.id}`, ui));
                            };

                            return (
                                <tr key={enf.id}>
                                    <td style={{ ...tdStyle, fontSize: '9.5pt' }}>{enf.nombre}</td>
                                    {unidades.map((_, ui) => {
                                        const selected = isEnfoqueSelected(ui);
                                        return (
                                            <td key={ui} style={{
                                                ...checkTdStyle,
                                                backgroundColor: selected ? '#00adef' : 'transparent',
                                                color: selected ? '#fff' : '#000'
                                            }}>
                                                {selected ? 'X' : ''}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                        {/* Fila consolidada de VALORES */}
                        <tr>
                            <td style={{ ...tdStyle, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f9f9f9' }}>VALORES</td>
                            {unidades.map((_, ui) => {
                                const selectedValores: string[] = [];
                                ENFOQUES_TRANSVERSALES.forEach(enf => {
                                    enf.valores.forEach(v => {
                                        if (isChecked(`${enf.id}_val_${v.id}`, ui)) {
                                            selectedValores.push(v.nombre);
                                        }
                                    });
                                });

                                return (
                                    <td key={ui} style={{ ...tdStyle, fontSize: '8pt', verticalAlign: 'middle', textAlign: 'left' }}>
                                        {selectedValores.join(', ')}
                                    </td>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>

                <div style={{ marginTop: '20px' }}>
                    <SectionHeader num="7" title="CARACTERIZACIÓN DEL CONTEXTO DEL ESTUDIANTE." />
                    {ctx && (
                        <table style={tblStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>ÁMBITOS</th>
                                    <th style={thStyle}>FAMILIAR</th>
                                    <th style={thStyle}>GRUPAL/AULA</th>
                                    <th style={thStyle}>LOCAL</th>
                                    <th style={thStyle}>REGIONAL</th>
                                    <th style={thStyle}>NACIONAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { label: 'CULTURAL', key: 'cultural' as const },
                                    { label: 'ECONOMICO', key: 'economico' as const },
                                    { label: 'AMBIENTAL', key: 'ambiental' as const }
                                ].map(aspect => (
                                    <tr key={aspect.label}>
                                        <td style={{ ...tdStyle, fontWeight: 'bold', fontSize: '9pt' }}>ASPECTO {aspect.label}</td>
                                        {(['familiar', 'grupal', 'local', 'regional', 'nacional'] as const).map(ambito => (
                                            <td key={ambito} style={{ ...tdStyle, fontSize: '8.5pt', minHeight: '50px' }}>
                                                {ctx[ambito]?.[aspect.key]?.texto || ''}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* HOJA 5: Caracterización, Evaluación y Firmas */}
            <div style={pageSheetStyle}>
                <SectionHeader num="8" title={`CARACTERIZACIÓN DE LOS ESTUDIANTES CICLO ${planActivo.ciclo}`} />
                {diag && (
                    <table style={tblStyle}>
                        <thead>
                            <tr>
                                <th rowSpan={2} style={{ ...thStyle, width: '10%' }}>EDADES</th>
                                <th colSpan={3} style={thStyle}>CARACTERÍSTICAS</th>
                                <th rowSpan={2} style={thStyle}>ESTRATEGIAS APRENDIZAJE</th>
                                <th rowSpan={2} style={thStyle}>INTERESES / GUSTOS</th>
                                <th rowSpan={2} style={thStyle}>OBSERVACIONES LINGÜÍSTICAS</th>
                            </tr>
                            <tr>
                                <th style={thStyle}>Cognitivas</th>
                                <th style={thStyle}>Físicas</th>
                                <th style={thStyle}>Emocionales</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>{diag.estilos.edadMin}-{diag.estilos.edadMax} años</td>
                                <td style={{ ...tdStyle, fontSize: '8.5pt' }}>{diag.caracteristicas.cognitivo.texto}</td>
                                <td style={{ ...tdStyle, fontSize: '8.5pt' }}>{diag.caracteristicas.fisico.texto}</td>
                                <td style={{ ...tdStyle, fontSize: '8.5pt' }}>{diag.caracteristicas.emocional.texto}</td>
                                <td style={{ ...tdStyle, fontSize: '8.5pt' }}>{diag.estilos.estrategias}</td>
                                <td style={{ ...tdStyle, fontSize: '8.5pt' }}>{diag.estilos.intereses.join(', ')}</td>
                                <td style={{ ...tdStyle, fontSize: '8pt' }}>
                                    {diag.estilos.idiomas.map((idioma, idx) => (
                                        <div key={idx}>
                                            <b>{idioma.etiqueta}:</b> {idioma.valor}
                                        </div>
                                    ))}
                                    <div className="mt-2 pt-2 border-t border-black/10">
                                        {diag.estilos.diagnosticoSociolinguistico}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}

                <div style={{ marginTop: '20px' }}>
                    <SectionHeader num="9" title="EVALUACIÓN" />
                    <table style={tblStyle}>
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, width: '250px' }}>ENFOQUE</th>
                                <th style={thStyle}>ORIENTACIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td style={{ ...tdStyle, fontWeight: 'bold' }}>DIAGNÓSTICA</td><td style={{ ...tdStyle, fontSize: '9pt', whiteSpace: 'pre-wrap' }}>{planActivo.orientaciones?.evaluacion.diagnostica}</td></tr>
                            <tr><td style={{ ...tdStyle, fontWeight: 'bold' }}>FORMATIVA</td><td style={{ ...tdStyle, fontSize: '9pt', whiteSpace: 'pre-wrap' }}>{planActivo.orientaciones?.evaluacion.formativa}</td></tr>
                            <tr><td style={{ ...tdStyle, fontWeight: 'bold' }}>SUMATIVA</td><td style={{ ...tdStyle, fontSize: '9pt', whiteSpace: 'pre-wrap' }}>{planActivo.orientaciones?.evaluacion.sumativa}</td></tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <SectionHeader num="10" title="MATERIALES Y RECURSOS" />
                    <table style={tblStyle}>
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, width: '50%' }}>DOCENTE</th>
                                <th style={{ ...thStyle, width: '50%' }}>ESTUDIANTE</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ ...tdStyle, fontSize: '9pt', whiteSpace: 'pre-wrap' }}>{planActivo.orientaciones?.recursos.paraDocente}</td>
                                <td style={{ ...tdStyle, fontSize: '9pt', whiteSpace: 'pre-wrap' }}>{planActivo.orientaciones?.recursos.paraEstudiante}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <SectionHeader num="11" title="REFERENCIAS BIBLIOGRAFICAS" />
                    <div style={{ marginLeft: '10px', fontSize: '9.5pt', lineHeight: '1.5' }}>
                        <p>• Currículo Nacional de la Educación Básica (CNEB) — MINEDU.</p>
                        <p>• Programa Curricular de Educación {planActivo.nivel} — MINEDU.</p>
                    </div>
                </div>

                <div style={{ marginTop: '50px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end' }}>
                        <div style={{ textAlign: 'center', width: '250px' }}>
                            <p style={{ fontSize: '9pt' }}>________________________________</p>
                            <p style={{ fontSize: '9pt', fontWeight: 'bold', marginTop: '5px' }}>V°B° del director del CEBA</p>
                        </div>
                        <div style={{ textAlign: 'center', width: '250px' }}>
                            <p style={{ fontSize: '9pt' }}>________________________________</p>
                            <p style={{ fontSize: '9pt', fontWeight: 'bold', marginTop: '5px' }}>Firma/sello del docente de área</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ num: string; title: string }> = ({ num, title }) => (
    <h3 style={{
        fontSize: '10pt',
        fontWeight: 'bold',
        margin: '25px 0 10px',
        fontFamily: '"Times New Roman", Times, serif',
        color: '#000',
        textTransform: 'uppercase'
    }}>
        {num}. {title}
    </h3>
);

// ─── Inline Styles ───────────────────────────────────────────────────────────

const tblStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '15px',
    fontSize: '10pt',
    fontFamily: '"Times New Roman", Times, serif',
};

const thStyle: React.CSSProperties = {
    border: '1px solid #000',
    padding: '8px 6px',
    backgroundColor: '#D9E2F3',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: '10pt',
    fontFamily: '"Times New Roman", Times, serif',
};

const tdStyle: React.CSSProperties = {
    border: '1px solid #000',
    padding: '6px 8px',
    verticalAlign: 'top',
    fontSize: '10pt',
    fontFamily: '"Times New Roman", Times, serif',
};

const checkTdStyle: React.CSSProperties = {
    ...tdStyle,
    textAlign: 'center',
    fontWeight: 'bold',
    width: '30px',
};

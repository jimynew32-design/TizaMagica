/**
 * UnidadDocumentPreview.tsx — Vista previa formal del Plan de Mediano Plazo
 * Simula un documento A4 con fondo blanco, Times New Roman 10pt,
 * tablas con bordes y estructura oficial MINEDU.
 *
 * Esquema: PROYECTO DE APRENDIZAJE
 * 1. Datos Informativos
 * 2. Título
 * 3. Propósito de Aprendizaje (tabla comp/desemp/evidencias/instrumentos + enfoques)
 * 4. Situación Significativa
 * 5. Secuencia de Sesiones
 * 6. Evaluación
 * 7. Recursos y Materiales
 * 8. Referencias Bibliográficas
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUnidadesStore, usePlanAnualStore, usePerfilStore } from '@/store';
import { cnebService } from '@/services/cneb';
import type { CNEBCompetencia } from '@/types/schemas';
import { ENFOQUES_TRANSVERSALES } from '@/services/cneb/enfoques-transversales';
import { Spinner } from '@/components/ui/Spinner';
import { exportarUnidad } from '@/services/export';
import { NeonButton } from '@/components/ui/NeonButton';

// ─── Helpers ──────────────────────────────────────────────────────────────────



/** Calcula la duración en semanas entre dos fechas ISO */
function calcDuracion(inicio: string, termino: string): string {
    if (!inicio || !termino) return '---';
    const d1 = new Date(inicio);
    const d2 = new Date(termino);
    const diffMs = d2.getTime() - d1.getTime();
    const weeks = Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));
    if (weeks <= 0) return '---';
    return `${weeks} semana${weeks !== 1 ? 's' : ''}`;
}

/** Formatea fecha ISO a dd/mm/yyyy */
function fmtDate(iso: string): string {
    if (!iso) return '---';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').slice(0, 40);

export const UnidadDocumentPreview: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { unidades, unidadesLoaded, loadUnidades, sesiones, loadSesiones } = useUnidadesStore();
    const { planActivo } = usePlanAnualStore();
    const { perfil } = usePerfilStore();

    const [cnebComps, setCnebComps] = useState<CNEBCompetencia[]>([]);

    const unidad = unidades.find(u => u.id === id);
    const [exporting, setExporting] = useState(false);

    // Load unidades if needed
    useEffect(() => {
        if (planActivo && !unidadesLoaded) {
            loadUnidades(planActivo.id);
        }
    }, [planActivo, unidadesLoaded, loadUnidades]);

    // Load sesiones for this unit
    useEffect(() => {
        if (id) {
            loadSesiones(id);
        }
    }, [id, loadSesiones]);

    // Load CNEB competencies
    useEffect(() => {
        const load = async () => {
            if (!planActivo) return;
            const data = await cnebService.getCompetenciasByAreaNivel(planActivo.area, planActivo.nivel);
            setCnebComps(data);
        };
        load();
    }, [planActivo?.area, planActivo?.nivel]);

    // Sesiones de esta unidad
    const sesionesUnidad = useMemo(
        () => (sesiones || []).filter(s => s.unidadId === id).sort((a, b) => a.orden - b.orden),
        [sesiones, id]
    );

    // Determine bimestre number from the unidad
    const bimestreNum = unidad ? Math.ceil(unidad.numero / 2) : 1;

    // Todos los criterios de evaluación (de desempeños y de enfoques)
    const allCriterios = useMemo(() => {
        if (!unidad) return [];
        return [
            ...unidad.disenaStep.criterios,
            ...unidad.organizaStep.criterios
        ];
    }, [unidad]);

    // Resolve selected competencias → CNEB data
    const competenciasResueltas = useMemo(() => {
        if (!unidad || cnebComps.length === 0) return [];
        return unidad.disenaStep.competencias
            .filter(c => c.seleccionada)
            .map(c => {
                const cneb = cnebComps.find(cc => cc.nombre === c.competenciaId);
                const capsSeleccionadas = c.capacidades.filter(cap => cap.seleccionada).map(cap => cap.capacidadId);
                const compSlug = slug(c.competenciaId);
                const desempenosComp = unidad.disenaStep.desempenos.filter(d =>
                    d.desempenoId.startsWith(compSlug)
                );
                return { nombre: c.competenciaId, cneb, capsSeleccionadas, desempenos: desempenosComp };
            });
    }, [unidad, cnebComps]);

    // Resolve Enfoques from Master Plan (M03) — Since Step 4 Selecciona was removed
    const enfoquesResueltos = useMemo(() => {
        if (!planActivo) return [];
        return (planActivo.enfoquesTransversales || []).map(eff => {
            const definition = ENFOQUES_TRANSVERSALES.find(et => et.id === eff.enfoqueId);
            const valoresNombres = eff.valoresIds.map(vid => {
                const vDef = definition?.valores.find(v => v.id === vid);
                return vDef ? vDef.nombre : vid;
            });
            return {
                nombre: definition?.nombre || eff.enfoqueId,
                valores: valoresNombres
            };
        });
    }, [planActivo]);

    const handleExport = async () => {
        if (!unidad || !planActivo || !perfil) return;
        setExporting(true);
        try {
            await exportarUnidad(unidad, planActivo, perfil, sesionesUnidad);
        } catch (error) {
            console.error('Error exporting unit:', error);
        } finally {
            setExporting(false);
        }
    };

    // Loading / guard states
    if (!unidadesLoaded || !planActivo || !perfil) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4 bg-[#525659]">
                <Spinner size="lg" />
                <p className="text-gray-400 font-bold uppercase tracking-widest animate-pulse">Cargando documento...</p>
            </div>
        );
    }

    if (!unidad) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4 bg-[#525659]">
                <span className="material-icons-round text-5xl text-red-500">warning</span>
                <p className="text-white font-black uppercase">Unidad no encontrada</p>
                <button onClick={() => navigate('/unidades')} className="text-primary-teal underline text-xs">Volver al listado</button>
            </div>
        );
    }

    const tipoLabel = unidad.tipo === 'proyecto' ? 'PROYECTO DE APRENDIZAJE' : unidad.tipo === 'modulo' ? 'MÓDULO DE APRENDIZAJE' : 'UNIDAD DE APRENDIZAJE';
    const tipoNumLabel = unidad.tipo === 'proyecto' ? 'Proyecto' : unidad.tipo === 'modulo' ? 'Módulo' : 'Unidad';

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
                        <h1 className="text-sm font-black text-white uppercase tracking-wider">Vista Previa — {tipoNumLabel} {unidad.numero}</h1>
                        <p className="text-[10px] text-gray-400">{planActivo.area} — {planActivo.grado}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <NeonButton
                        variant="teal"
                        icon="file_download"
                        onClick={handleExport}
                        isLoading={exporting}
                        disabled={exporting}
                    >
                        Exportar a Word
                    </NeonButton>
                </div>
            </div>

            {/* HOJA A4 */}
            <div style={pageSheetStyle}>
                {/* Título del documento */}
                <p style={{ textAlign: 'center', fontSize: '12pt', fontWeight: 'bold', marginBottom: '20px', textTransform: 'uppercase' }}>
                    {tipoLabel} {unidad.numero}
                </p>

                {/* ─── 1. DATOS INFORMATIVOS ─── */}
                <SectionHeader num="1" title="DATOS INFORMATIVOS" />
                <table style={{ border: 'none', borderCollapse: 'collapse', fontSize: '10pt', width: '100%', marginBottom: '15px' }}>
                    <tbody>
                        {[
                            ['1.1. Área', planActivo.area],
                            ['1.2. Docente', perfil.nombreCompleto],
                            ['1.3. Grado/sección', planActivo.grado],
                            ['1.4. Bimestre', `${planActivo.periodoTipo} ${bimestreNum}`],
                            ['1.5. Duración', `${fmtDate(unidad.organizaStep.fechaInicio)} al ${fmtDate(unidad.organizaStep.fechaTermino)} (${calcDuracion(unidad.organizaStep.fechaInicio, unidad.organizaStep.fechaTermino)})`],
                            ['1.6. N° de horas semanales', `${planActivo.sesionesPorSemana} horas`],
                        ].map(([label, value], i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 'bold', width: '220px', padding: '2px 4px' }}>{label}</td>
                                <td style={{ fontWeight: 'bold', width: '20px' }}>:</td>
                                <td style={{ padding: '2px 4px' }}>{value || '---'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* ─── 2. TÍTULO ─── */}
                <SectionHeader num="2" title="TÍTULO" />
                <p style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '15px', marginLeft: '10px' }}>
                    {unidad.diagnosticoStep.titulo || '(Sin título)'}
                </p>

                {/* ─── 3. PROPÓSITO DE APRENDIZAJE ─── */}
                <SectionHeader num="3" title="PROPÓSITO DE APRENDIZAJE" />
                <table style={tblStyle}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: '25%' }}>COMPETENCIAS Y CAPACIDADES</th>
                            <th style={{ ...thStyle, width: '35%' }}>DESEMPEÑOS PRECISADOS</th>
                            <th style={{ ...thStyle, width: '20%' }}>EVIDENCIAS DE APRENDIZAJE</th>
                            <th style={{ ...thStyle, width: '20%' }}>INSTRUMENTOS DE EVALUACIÓN</th>
                        </tr>
                    </thead>
                    <tbody>
                        {competenciasResueltas.length > 0 ? competenciasResueltas.map((comp, ci) => {
                            // Find matching criterios for this competencia
                            const criteriosComp = allCriterios.filter(cr =>
                                cr.descripcion.toLowerCase().includes(comp.nombre.toLowerCase().slice(0, 15)) ||
                                ci === 0 // fallback: show all on first if no match
                            );
                            const evidencias = criteriosComp.map(c => c.evidencia).filter(Boolean);
                            const desempenosTexto = comp.desempenos.map(d => d.precisado || d.texto);

                            return (
                                <tr key={comp.nombre}>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '9.5pt' }}>{comp.nombre}</div>
                                        {comp.capsSeleccionadas.map((cap, i) => (
                                            <div key={i} style={{ marginLeft: '8px', fontSize: '9pt', marginBottom: '2px' }}>• {cap}</div>
                                        ))}
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: '9pt' }}>
                                        <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                            {desempenosTexto.map((t, i) => (
                                                <li key={i} style={{ marginBottom: '4px', textAlign: 'justify' }}>{t}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: '9pt' }}>
                                        {evidencias.length > 0 ? (
                                            <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                                {evidencias.map((e, i) => (
                                                    <li key={i}>{e}</li>
                                                ))}
                                            </ul>
                                        ) : unidad.diagnosticoStep.productoTentativo || '---'}
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: '9pt', textAlign: 'center' }}>
                                        {criteriosComp.length > 0 ? (
                                            <ul style={{ margin: 0, paddingLeft: '18px', textAlign: 'left' }}>
                                                <li>Lista de Cotejo</li>
                                            </ul>
                                        ) : '---'}
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                                    Sin competencias seleccionadas en esta unidad.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* ─── ENFOQUES TRANSVERSALES ─── */}
                <table style={{ ...tblStyle, marginTop: '15px' }}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: '50%' }}>ENFOQUES TRANSVERSALES</th>
                            <th style={{ ...thStyle, width: '50%' }}>VALORES/ACTITUDES OBSERVABLES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {enfoquesResueltos.length > 0 ? (
                            enfoquesResueltos.map(enf => (
                                <tr key={enf.nombre}>
                                    <td style={{ ...tdStyle, fontSize: '9pt', fontWeight: 'bold' }}>{enf.nombre}</td>
                                    <td style={{ ...tdStyle, fontSize: '9pt' }}>
                                        <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                            {enf.valores.map((v, i) => <li key={i}>{v}</li>)}
                                        </ul>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={2} style={{ ...tdStyle, textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                                    No se han priorizado enfoques transversales para este plan anual.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>


                {/* ─── 4. SITUACIÓN SIGNIFICATIVA ─── */}
                <SectionHeader num="4" title="SITUACIÓN SIGNIFICATIVA" />
                <div style={{ textAlign: 'justify', marginBottom: '15px', marginLeft: '10px', fontSize: '10pt', lineHeight: '1.5' }}>
                    {(unidad.diagnosticoStep.situacionSignificativa || '').split('\n').filter(Boolean).map((p, i) => (
                        <p key={i} style={{ textIndent: '1.27cm', marginBottom: '6px' }}>{p.trim()}</p>
                    ))}
                    {!unidad.diagnosticoStep.situacionSignificativa && (
                        <p style={{ color: '#999', fontStyle: 'italic' }}>(Sin situación significativa definida)</p>
                    )}
                </div>

                {/* ─── 5. SECUENCIA DE SESIONES ─── */}
                <SectionHeader num="5" title="SECUENCIA DE SESIONES" />
                {sesionesUnidad.length > 0 ? (
                    <table style={tblStyle}>
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, width: '50%' }}>Sesión y Descripción</th>
                                <th style={{ ...thStyle, width: '50%' }}>Planificación Curricular y PRODUCTO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sesionesUnidad.map((s, i) => (
                                <tr key={s.id}>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '10pt' }}>
                                            Sesión {i + 1}: {s.titulo || `Sesión ${i + 1}`}
                                        </div>
                                        {s.secuenciaDidactica ? (
                                            <div style={{ fontSize: '9pt', paddingLeft: '4px', lineHeight: '1.4' }}>
                                                <div style={{ marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: 'bold' }}>• Inicio:</span> {s.secuenciaDidactica.inicio?.descripcion.slice(0, 300)}{s.secuenciaDidactica.inicio?.descripcion.length > 300 ? '...' : ''}
                                                </div>
                                                <div style={{ marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: 'bold' }}>• Desarrollo:</span> {s.secuenciaDidactica.desarrollo?.descripcion.slice(0, 400)}{s.secuenciaDidactica.desarrollo?.descripcion.length > 400 ? '...' : ''}
                                                </div>
                                                <div style={{ marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: 'bold' }}>• Cierre:</span> {s.secuenciaDidactica.cierre?.descripcion.slice(0, 200)}{s.secuenciaDidactica.cierre?.descripcion.length > 200 ? '...' : ''}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ fontStyle: 'italic', color: '#999', fontSize: '9pt' }}>(Sin secuencia didáctica detallada)</div>
                                        )}
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: '9pt', lineHeight: '1.4' }}>
                                        <div style={{ marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '8.5pt', color: '#444' }}>Competencia:</span><br/>
                                            {s.competenciaId || '---'}
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '8.5pt', color: '#444' }}>Desempeño:</span><br/>
                                            {s.desempenoPrecisado || '---'}
                                        </div>
                                        <div style={{ marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '8.5pt', color: '#444' }}>Producto:</span><br/>
                                            {s.evidencia || s.proposito || '---'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ marginLeft: '10px', color: '#999', fontStyle: 'italic', marginBottom: '15px' }}>
                        (No se han generado sesiones aún. Use el paso "Prevé" para generar la secuencia.)
                    </p>
                )}
                
                {/* ─── 6. EVALUACIÓN ─── */}
                <SectionHeader num="6" title="EVALUACIÓN" />
                {allCriterios.length > 0 ? (
                    <table style={tblStyle}>
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, width: '50%' }}>CRITERIO DE EVALUACIÓN</th>
                                <th style={{ ...thStyle, width: '50%' }}>EVIDENCIA / INSTRUMENTO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allCriterios.map(crit => (
                                <tr key={crit.id}>
                                    <td style={{ ...tdStyle, fontSize: '9pt', textAlign: 'justify' }}>{crit.descripcion}</td>
                                    <td style={{ ...tdStyle, fontSize: '9pt' }}>{crit.evidencia || '---'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ marginLeft: '10px', color: '#999', fontStyle: 'italic', marginBottom: '15px' }}>
                        (No se han definido criterios de evaluación.)
                    </p>
                )}

                {/* ─── 7. RECURSOS Y MATERIALES ─── */}
                <SectionHeader num="7" title="RECURSOS Y MATERIALES" />
                <table style={tblStyle}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: '50%' }}>PARA LOS ESTUDIANTES:</th>
                            <th style={{ ...thStyle, width: '50%' }}>PARA EL DOCENTE:</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ ...tdStyle, fontSize: '9pt', whiteSpace: 'pre-wrap' }}>
                                {planActivo.orientaciones?.recursos?.paraEstudiante ? (
                                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                        {planActivo.orientaciones.recursos.paraEstudiante.split('\n').filter(Boolean).map((line, i) => (
                                            <li key={i}>{line.replace(/^[•\-\*]\s*/, '')}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span>•</span>
                                )}
                            </td>
                            <td style={{ ...tdStyle, fontSize: '9pt', whiteSpace: 'pre-wrap' }}>
                                {planActivo.orientaciones?.recursos?.paraDocente ? (
                                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                        {planActivo.orientaciones.recursos.paraDocente.split('\n').filter(Boolean).map((line, i) => (
                                            <li key={i}>{line.replace(/^[•\-\*]\s*/, '')}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span>•</span>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ─── 8. REFERENCIAS BIBLIOGRÁFICAS ─── */}
                <SectionHeader num="8" title="REFERENCIAS BIBLIOGRÁFICAS" />
                <div style={{ marginLeft: '10px', fontSize: '9.5pt', lineHeight: '1.5', marginBottom: '20px' }}>
                    <p>• Currículo Nacional de la Educación Básica (CNEB) — MINEDU.</p>
                    <p>• Programa Curricular de Educación {planActivo.nivel} — MINEDU.</p>
                    <p>• Guía de Planificación Curricular para Educación {planActivo.nivel} — MINEDU.</p>
                </div>

                {/* Firmas */}
                <div style={{ marginTop: '50px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end' }}>
                        <div style={{ textAlign: 'center', width: '250px' }}>
                            <p style={{ fontSize: '9pt' }}>________________________________</p>
                            <p style={{ fontSize: '9pt', fontWeight: 'bold', marginTop: '5px' }}>V°B° del director</p>
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

const previewContainerStyle: React.CSSProperties = {
    backgroundColor: '#525659',
    minHeight: '100vh',
    width: '100%',
    paddingBottom: '50px',
    overflowY: 'auto'
};

const pageSheetStyle: React.CSSProperties = {
    width: '210mm',
    minHeight: '297mm',
    backgroundColor: '#fff',
    margin: '20px auto',
    padding: '20mm 15mm',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    boxSizing: 'border-box',
    position: 'relative',
    fontFamily: '"Times New Roman", Times, serif',
    color: '#000',
    fontSize: '10pt',
    lineHeight: '1.3',
};

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

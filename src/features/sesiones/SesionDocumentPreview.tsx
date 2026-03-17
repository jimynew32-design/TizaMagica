/**
 * SesionDocumentPreview.tsx — Vista previa formal de la Sesión de Aprendizaje
 * Simula un documento A4 con fondo blanco, Times New Roman,
 * tablas con bordes y estructura oficial MINEDU.
 *
 * Secciones:
 * I. Datos Informativos
 * II. Título de la Unidad de Aprendizaje
 * III. Título de la Sesión de Aprendizaje
 * IV. Propósito de Aprendizaje (tabla)
 * IV-A. Objetivo Específico de la Sesión
 * V. Enfoques Transversales
 * VI. Secuencia Didáctica
 * VII. Criterios de Evaluación
 * VII-A. Indicador Observable y Criterio de Logro
 */
import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUnidadesStore, usePlanAnualStore, usePerfilStore } from '@/store';
import { ENFOQUES_TRANSVERSALES } from '@/services/cneb/enfoques-transversales';
import { Spinner } from '@/components/ui/Spinner';
import { NeonButton } from '@/components/ui/NeonButton';
import { exportarSesion } from '@/services/export';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Component ────────────────────────────────────────────────────────────────

export const SesionDocumentPreview: React.FC = () => {
    const { sesionId } = useParams<{ sesionId: string }>();
    const navigate = useNavigate();
    const { sesiones, unidades } = useUnidadesStore();
    const { planActivo } = usePlanAnualStore();
    const { perfil } = usePerfilStore();
    const [exporting, setExporting] = useState(false);

    const sesion = sesiones.find(s => s.id === sesionId);
    const unidad = unidades.find(u => u.id === sesion?.unidadId);

    const totalMin = sesion?.secuenciaDidactica
        ? (sesion.secuenciaDidactica.inicio?.duracionMinutos || 0)
        + (sesion.secuenciaDidactica.desarrollo?.duracionMinutos || 0)
        + (sesion.secuenciaDidactica.cierre?.duracionMinutos || 0)
        : 0;

    // Resolve enfoques from master plan (M03)
    const enfoquesResueltos = useMemo(() => {
        if (!planActivo) return [];
        return (planActivo.enfoquesTransversales || []).map(eff => {
            const definition = ENFOQUES_TRANSVERSALES.find(et => et.id === eff.enfoqueId);
            const valoresResueltos = eff.valoresIds.map(vid => {
                const vDef = definition?.valores.find(v => v.id === vid);
                return {
                    nombre: vDef?.nombre || vid,
                    actitud: vDef?.actitud || '',
                };
            });
            return {
                nombre: definition?.nombre || eff.enfoqueId,
                valores: valoresResueltos,
            };
        });
    }, [planActivo]);

    // Criterios de evaluación de la unidad
    const allCriterios = useMemo(() => {
        if (!unidad) return [];
        return [
            ...unidad.disenaStep.criterios,
            ...unidad.organizaStep.criterios,
        ];
    }, [unidad]);

    const handleExport = async () => {
        if (!sesion || !unidad || !planActivo || !perfil) return;
        setExporting(true);
        try {
            await exportarSesion(sesion, unidad, planActivo, perfil);
        } catch (error) {
            console.error('Error exporting session:', error);
        } finally {
            setExporting(false);
        }
    };

    // Loading / guard
    if (!planActivo || !perfil) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4 bg-[#525659]">
                <Spinner size="lg" />
                <p className="text-gray-400 font-bold uppercase tracking-widest animate-pulse">Cargando documento...</p>
            </div>
        );
    }

    if (!sesion || !unidad) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4 bg-[#525659]">
                <span className="material-icons-round text-5xl text-red-500">warning</span>
                <p className="text-white font-black uppercase">Sesión no encontrada</p>
                <button onClick={() => navigate(-1)} className="text-primary-teal underline text-xs">Volver</button>
            </div>
        );
    }

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
                        <h1 className="text-sm font-black text-white uppercase tracking-wider">Vista Previa — Sesión {sesion.orden}</h1>
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
                <p style={{ textAlign: 'center', fontSize: '13pt', fontWeight: 'bold', marginBottom: '25px', textTransform: 'uppercase' }}>
                    SESIÓN DE APRENDIZAJE N° {String(sesion.orden).padStart(2, '0')}
                </p>

                {/* ─── I. DATOS INFORMATIVOS ─── */}
                <SectionHeader num="I" title="DATOS INFORMATIVOS" />
                <table style={{ border: 'none', borderCollapse: 'collapse', fontSize: '10pt', width: '100%', marginBottom: '15px' }}>
                    <tbody>
                        <tr>
                            <td style={infoLabelStyle}>Institución Educativa</td>
                            <td style={infoSepStyle}>:</td>
                            <td style={infoValueStyle}>{perfil.nombreIE || '---'}</td>
                            <td style={{ ...infoLabelStyle, width: '150px' }}>Grado y Sección</td>
                            <td style={infoSepStyle}>:</td>
                            <td style={infoValueStyle}>{planActivo.grado || '---'}</td>
                        </tr>
                        <tr>
                            <td style={infoLabelStyle}>Área</td>
                            <td style={infoSepStyle}>:</td>
                            <td style={infoValueStyle}>{planActivo.area || '---'}</td>
                            <td style={infoLabelStyle}>Horas</td>
                            <td style={infoSepStyle}>:</td>
                            <td style={infoValueStyle}>{totalMin > 0 ? `${totalMin} min` : `${planActivo.sesionesPorSemana} horas`}</td>
                        </tr>
                        <tr>
                            <td style={infoLabelStyle}>Nivel</td>
                            <td style={infoSepStyle}>:</td>
                            <td style={infoValueStyle}>{planActivo.nivel || '---'}</td>
                            <td style={infoLabelStyle}>Unidad</td>
                            <td style={infoSepStyle}>:</td>
                            <td style={infoValueStyle}>Unidad {unidad.numero}</td>
                        </tr>
                        <tr>
                            <td style={infoLabelStyle}>Profesora</td>
                            <td style={infoSepStyle}>:</td>
                            <td style={infoValueStyle}>{perfil.nombreCompleto || '---'}</td>
                            <td style={infoLabelStyle}>Fecha</td>
                            <td style={infoSepStyle}>:</td>
                            <td style={infoValueStyle}>{new Date().toLocaleDateString('es-PE')}</td>
                        </tr>
                    </tbody>
                </table>

                {/* ─── II. TÍTULO DE LA UNIDAD ─── */}
                <SectionHeader num="II" title="TÍTULO DE LA UNIDAD DE APRENDIZAJE" />
                <p style={contentParagraph}>
                    {unidad.diagnosticoStep.titulo || '(Sin título de unidad)'}
                </p>

                {/* ─── III. TÍTULO DE LA SESIÓN ─── */}
                <SectionHeader num="III" title="TÍTULO DE LA SESIÓN DE APRENDIZAJE" />
                <p style={contentParagraph}>
                    {sesion.titulo || '(Sin título de sesión)'}
                </p>

                {/* ─── IV. PROPÓSITO DE APRENDIZAJE ─── */}
                <SectionHeader num="IV" title="PROPÓSITO DE APRENDIZAJE" />
                <table style={tblStyle}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: '18%' }}>Competencia</th>
                            <th style={{ ...thStyle, width: '15%' }}>Capacidades</th>
                            <th style={{ ...thStyle, width: '32%' }}>Desempeños (Precisados)</th>
                            <th style={{ ...thStyle, width: '17%' }}>Producto / Evidencia</th>
                            <th style={{ ...thStyle, width: '18%' }}>Instrumento de Evaluación</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ ...tdStyle, fontWeight: 'bold', fontSize: '9pt' }}>
                                {sesion.competenciaId || '---'}
                            </td>
                            <td style={{ ...tdStyle, fontSize: '9pt' }}>
                                {sesion.capacidadId || '---'}
                            </td>
                            <td style={{ ...tdStyle, fontSize: '9pt', textAlign: 'justify' }}>
                                {sesion.desempenoPrecisado || '---'}
                            </td>
                            <td style={{ ...tdStyle, fontSize: '9pt' }}>
                                {sesion.evidencia || '---'}
                            </td>
                            <td style={{ ...tdStyle, fontSize: '9pt', textAlign: 'center' }}>
                                {sesion.instrumento || '---'}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ─── IV-A. OBJETIVO ESPECÍFICO ─── */}
                <SectionHeader num="IV-A" title="OBJETIVO ESPECÍFICO DE LA SESIÓN" />
                <table style={tblStyle}>
                    <thead>
                        <tr>
                            <th style={{ ...thObjStyle }}>Objetivo Operacional Medible</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ ...tdStyle, fontSize: '10pt', textAlign: 'justify', minHeight: '40px' }}>
                                {sesion.proposito || '(Sin propósito definido)'}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ─── V. ENFOQUES TRANSVERSALES ─── */}
                <SectionHeader num="V" title="ENFOQUES TRANSVERSALES" />
                <table style={tblStyle}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: '25%' }}>Enfoque Transversal</th>
                            <th style={{ ...thStyle, width: '25%' }}>Valor</th>
                            <th style={{ ...thStyle, width: '50%' }}>Actitud o acciones observables</th>
                        </tr>
                    </thead>
                    <tbody>
                        {enfoquesResueltos.length > 0 ? (
                            enfoquesResueltos.flatMap(enf =>
                                enf.valores.map((val, vi) => (
                                    <tr key={`${enf.nombre}-${vi}`}>
                                        {vi === 0 ? (
                                            <td style={{ ...tdStyle, fontWeight: 'bold', fontSize: '9pt' }} rowSpan={enf.valores.length}>
                                                {enf.nombre}
                                            </td>
                                        ) : null}
                                        <td style={{ ...tdStyle, fontSize: '9pt' }}>{val.nombre}</td>
                                        <td style={{ ...tdStyle, fontSize: '9pt', textAlign: 'justify' }}>
                                            {val.actitud || '---'}
                                        </td>
                                    </tr>
                                ))
                            )
                        ) : (
                            <tr>
                                <td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                                    No se han priorizado enfoques transversales.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* ─── VI. SECUENCIA DIDÁCTICA ─── */}
                <SectionHeader num="VI" title="SECUENCIA DIDÁCTICA" />
                <table style={tblStyle}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: '12%' }}>Momento</th>
                            <th style={{ ...thStyle, width: '58%' }}>Estrategia metodológica</th>
                            <th style={{ ...thStyle, width: '18%' }}>Recursos, materiales y espacios</th>
                            <th style={{ ...thStyle, width: '12%' }}>Tiempo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(['inicio', 'desarrollo', 'cierre'] as const).map(momento => {
                            const data = sesion.secuenciaDidactica?.[momento];
                            return (
                                <tr key={momento}>
                                    <td style={{ ...tdStyle, fontWeight: 'bold', fontSize: '10pt', textTransform: 'uppercase', textAlign: 'center' }}>
                                        {momento}
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: '9.5pt', textAlign: 'justify', whiteSpace: 'pre-line' }}>
                                        {data?.descripcion || '(Sin descripción)'}
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: '9pt' }}>
                                        {(sesion.recursos || []).length > 0 ? (
                                            <ul style={{ margin: 0, paddingLeft: '16px' }}>
                                                {(sesion.recursos || []).map((r, i) => <li key={i}>{r}</li>)}
                                            </ul>
                                        ) : '---'}
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: '10pt', textAlign: 'center', fontWeight: 'bold' }}>
                                        {(data?.duracionMinutos || 0) > 0 ? `${data?.duracionMinutos} min` : '---'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* ─── VII. CRITERIOS DE EVALUACIÓN ─── */}
                <SectionHeader num="VII" title="CRITERIOS DE EVALUACIÓN" />
                <table style={tblStyle}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: '25%' }}>Competencia/Capacidades</th>
                            <th style={{ ...thStyle, width: '30%' }}>Criterios de evaluación</th>
                            <th style={{ ...thStyle, width: '25%' }}>Evidencia</th>
                            <th style={{ ...thStyle, width: '20%' }}>Instrumento(s) de evaluación</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allCriterios.length > 0 ? (
                            allCriterios.map((crit, i) => (
                                <tr key={crit.id || i}>
                                    <td style={{ ...tdStyle, fontSize: '9pt', fontWeight: 'bold' }}>
                                        {crit.fuente || sesion.competenciaId || '---'}
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: '9pt', textAlign: 'justify' }}>
                                        {crit.descripcion || '---'}
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: '9pt' }}>
                                        {crit.evidencia || sesion.evidencia || '---'}
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: '9pt', textAlign: 'center' }}>
                                        {sesion.instrumento || '---'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td style={{ ...tdStyle, fontWeight: 'bold', fontSize: '9pt' }}>
                                    {sesion.competenciaId || '---'}
                                </td>
                                <td style={{ ...tdStyle, fontSize: '9pt', textAlign: 'justify' }}>
                                    {sesion.desempenoPrecisado || '---'}
                                </td>
                                <td style={{ ...tdStyle, fontSize: '9pt' }}>
                                    {sesion.evidencia || '---'}
                                </td>
                                <td style={{ ...tdStyle, fontSize: '9pt', textAlign: 'center' }}>
                                    {sesion.instrumento || '---'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* ─── VII-A. INDICADOR OBSERVABLE ─── */}
                <SectionHeader num="VII-A" title="INDICADOR OBSERVABLE Y CRITERIO DE LOGRO" />
                <table style={tblStyle}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: '50%' }}>Indicador Observable</th>
                            <th style={{ ...thStyle, width: '50%' }}>Criterio de Logro</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ ...tdStyle, fontSize: '9.5pt', textAlign: 'justify' }}>
                                {sesion.desempenoPrecisado || '---'}
                            </td>
                            <td style={{ ...tdStyle, fontSize: '9.5pt', textAlign: 'justify' }}>
                                {sesion.evidencia || '---'}
                            </td>
                        </tr>
                    </tbody>
                </table>

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
    overflowY: 'auto',
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

const thObjStyle: React.CSSProperties = {
    border: '1px solid #000',
    padding: '8px 6px',
    backgroundColor: '#E2EFDA',
    fontWeight: 'bold',
    textAlign: 'left',
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

const infoLabelStyle: React.CSSProperties = {
    fontWeight: 'bold',
    width: '160px',
    padding: '2px 4px',
    textDecoration: 'underline',
    color: 'red',
};

const infoSepStyle: React.CSSProperties = {
    fontWeight: 'bold',
    width: '15px',
};

const infoValueStyle: React.CSSProperties = {
    padding: '2px 4px',
};

const contentParagraph: React.CSSProperties = {
    fontSize: '11pt',
    fontWeight: 'bold',
    marginBottom: '15px',
    marginLeft: '10px',
    fontFamily: '"Times New Roman", Times, serif',
};

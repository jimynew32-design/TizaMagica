import React from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { usePerfilStore, usePlanAnualStore, useUnidadesStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { AuditReport } from './AuditReport';
import { getCurrentSchoolContext, getActiveSessionFromSchedule } from '@/lib/date-utils';
import { cn } from '@/lib/cn';


export const ControlCenterView: React.FC = () => {
    const navigate = useNavigate();
    const { perfil } = usePerfilStore();
    const { planes, selectPlan } = usePlanAnualStore();
    const { unidades, sesiones } = useUnidadesStore();

    const schoolContext = getCurrentSchoolContext();
    const activeSession = getActiveSessionFromSchedule(perfil?.cargaHoraria || []);
    const lastResource = perfil?.lastResource;

    const totalUnidades = planes.reduce((sum, p) => sum + (p.unidades?.length || 0), 0);
    const unidadesDeseñadas = unidades.length;
    const progressUnidades = totalUnidades > 0 ? (unidadesDeseñadas / totalUnidades) * 100 : 0;
    
    // Stats Reales
    const totalSesiones = sesiones.length;
    const sesionesConIA = sesiones.filter(s => s.secuenciaDidactica?.inicio?.descripcion).length;
    const progressSesiones = totalSesiones > 0 ? Math.round((sesionesConIA / totalSesiones) * 100) : 0;

    const allStudents = planes.flatMap(p => p.diagnostico.estudiantes || []);
    const studentsByLogro = allStudents.reduce((acc, s) => {
        acc[s.lineaBase || 'B'] = (acc[s.lineaBase || 'B'] || 0) + 1;
        return acc;
    }, { 'AD': 0, 'A': 0, 'B': 0, 'C': 0 } as Record<string, number>);

    const planActivo = planes[0]; // Simplificación para el dashboard

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Hero / Welcome */}
            <header className="relative py-12 px-8 overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-teal/20 via-surface-card to-surface-card border border-white/5">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-teal/10 blur-[120px] rounded-full" />
                <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">
                    <div className="space-y-4 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary-teal animate-pulse shadow-[0_0_10px_#2dd4bf]" />
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-primary-teal/10 border border-primary-teal/20 text-[10px] font-black text-primary-teal uppercase tracking-widest">
                                    {schoolContext.label}
                                </span>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
                                    SISTEMA ACTIVO
                                </span>
                            </div>
                        </div>
                        <h2 className="text-5xl font-black text-white uppercase tracking-tight leading-none pt-2">
                            ¡Hola, <span className="text-primary-teal">{perfil?.nombreCompleto?.split(' ')[0] || 'Jimy'}</span>!
                        </h2>
                        <p className="text-gray-300 text-2xl font-medium flex items-center gap-3">
                            Hoy es {new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).replace(',', '')} <span className="text-3xl">🗓️</span>
                        </p>
                        
                        <div className="pt-6 flex flex-wrap gap-4">
                            <button 
                                onClick={() => lastResource ? navigate(lastResource.path) : navigate('/unidades')}
                                className="px-8 py-4 rounded-2xl bg-primary-teal text-white font-black uppercase tracking-widest text-sm hover:shadow-[0_0_30px_rgba(45,170,170,0.4)] transition-all flex items-center gap-3 active:scale-95"
                            >
                                <span className="material-icons-round">edit_note</span>
                                {lastResource ? `CONTINUAR: ${lastResource.title}` : 'COMENZAR PLANIFICACIÓN'}
                            </button>
                            
                            <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-magenta/10 to-brand-magenta/5 border border-brand-magenta/30 text-brand-magenta font-black uppercase tracking-widest text-sm hover:bg-brand-magenta/20 hover:shadow-[0_0_20px_rgba(255,0,255,0.2)] transition-all flex items-center gap-3 group active:scale-95">
                                <span className="material-icons-round group-hover:rotate-12 transition-transform shadow-glow-magenta rounded-full">sparkles</span>
                                ¿QUÉ TAL TU CLASE DE HOY?
                            </button>
                        </div>
                    </div>

                    {/* Ticket de Sesión */}
                    <div className={cn(
                        "w-full xl:w-80 p-6 rounded-[2rem] bg-white/[0.02] border backdrop-blur-md shadow-2xl relative overflow-hidden group transition-all duration-500",
                        activeSession ? "border-primary-teal/30 hover:bg-primary-teal/[0.03]" : "border-white/10 opacity-60"
                    )}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-teal/10 blur-[40px] group-hover:bg-primary-teal/20 transition-colors" />
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <p className="text-[9px] font-black text-primary-teal uppercase tracking-widest bg-primary-teal/10 px-2 py-1 rounded-md">
                                    {activeSession ? 'Tu sesión de hoy' : 'Sin sesión activa'}
                                </p>
                                <span className="material-icons-round text-gray-500 text-sm">{activeSession ? 'schedule' : 'event_busy'}</span>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-2xl font-black text-white uppercase leading-none truncate">
                                    {activeSession?.area || 'Recreo / Libre'}
                                </h4>
                                <p className="text-sm font-bold text-gray-400">
                                    {activeSession ? `${activeSession.horaInicio} — ${activeSession.grado}` : 'Tómate un respiro, Jimy.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Indicadores de Salud Pedagógica */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Avance Curricular */}
                <Card variant="strong" className="p-6 flex items-center gap-6 hover-lift">
                    <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" className="stroke-white/5 fill-none" strokeWidth="8" />
                            <circle 
                                cx="50" cy="50" r="40" 
                                className="stroke-primary-teal fill-none drop-shadow-[0_0_8px_rgba(45,170,170,0.5)] transition-all duration-1000 ease-out" 
                                strokeWidth="8" 
                                strokeDasharray="251.2" 
                                strokeDashoffset={251.2 - (251.2 * progressUnidades) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-black text-white">{Math.round(progressUnidades)}%</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Avance Curricular</p>
                        <p className="text-base font-bold text-gray-200">Unidades: <span className="text-white font-black">{unidadesDeseñadas} de {totalUnidades}</span> listas.</p>
                    </div>
                </Card>

                {/* 2. Logro de Aprendizajes */}
                <Card variant="strong" className="p-6 flex items-center gap-6 hover-lift overflow-hidden relative">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-brand-magenta/5 blur-[40px] rounded-full pointer-events-none" />
                    <div className="w-16 h-16 rounded-2xl bg-brand-magenta/10 border border-brand-magenta/20 flex items-center justify-center text-brand-magenta shrink-0 relative z-10 shadow-[0_0_15px_rgba(255,0,255,0.1)]">
                        <span className="material-icons-round text-3xl">insights</span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Logro de Aprendizajes</p>
                        <p className="text-base font-bold text-gray-200 flex items-baseline gap-2">
                             Evaluadas: <span className="text-2xl font-black text-white">{planActivo ? Object.keys(planActivo.matrizCompetencias || {}).length : 0}</span> Comps.
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                             <div className="flex items-center gap-1">
                                 <div className="w-2 h-2 rounded-full bg-green-500" />
                                 <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">{studentsByLogro.AD} AD</span>
                             </div>
                             <div className="flex items-center gap-1">
                                 <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                                 <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">{studentsByLogro.A} A</span>
                             </div>
                             <div className="flex items-center gap-1">
                                 <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                 <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">{studentsByLogro.B} B</span>
                             </div>
                        </div>
                    </div>
                </Card>

                {/* 3. Cobertura de Sesiones */}
                <Card variant="strong" className="p-6 flex items-center justify-between hover-lift group">
                    <div className="flex items-center gap-6">
                         <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-primary-teal group-hover:border-primary-teal/30 transition-all shrink-0">
                             <span className="material-icons-round text-3xl">Auto_Fix_High</span>
                         </div>
                         <div>
                             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                 Cobertura de Sesiones
                                 <span className="w-1.5 h-1.5 rounded-full bg-primary-teal animate-pulse shadow-[0_0_5px_#2dd4bf]" />
                             </p>
                             <p className="text-base font-bold text-gray-200 truncate pr-2 flex items-baseline gap-1.5">
                                 Materiales IA: <span className="text-primary-teal font-black">{progressSesiones}%</span>
                             </p>
                             <p className="text-[9px] font-black text-gray-600 uppercase">{sesionesConIA}/{totalSesiones || 0} Sesiones listas</p>
                         </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Plans */}
                <Card variant="strong" className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                        <CardTitle>Planes Anuales Recientes</CardTitle>
                        <button className="text-xs font-bold text-primary-teal hover:underline tracking-widest uppercase" onClick={() => navigate('/unidades')}>Ver Todo</button>
                    </div>
                    <div className="space-y-4">
                        {planes.length === 0 ? (
                            <div className="py-12 text-center text-gray-600 bg-white/2 rounded-3xl border border-dashed border-white/5">
                                <span className="material-icons-round text-4xl mb-2 italic">auto_fix_off</span>
                                <p className="text-sm">Aún no has creado ningún plan anual.</p>
                            </div>
                        ) : (
                            planes.slice(0, 3).map(plan => {
                                const compsCount = Object.keys(plan.matrizCompetencias || {}).length;
                                return (
                                    <div key={plan.id} className="p-5 bg-white/[0.02] rounded-3xl border border-white/5 hover:border-primary-teal/30 hover:bg-white/[0.04] transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4" onClick={() => { selectPlan(plan.id); navigate('/plan-anual/diagnostico'); }}>
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center text-primary-teal/50 border border-white/5 group-hover:bg-primary-teal/10 group-hover:text-primary-teal group-hover:border-primary-teal/30 transition-all shrink-0">
                                                <span className="material-icons-round text-xl">folder_special</span>
                                            </div>
                                            <div className="space-y-1 mt-0.5">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-base font-black text-white group-hover:text-primary-teal transition-colors uppercase leading-none">{plan.area}</h4>
                                                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 text-[8px] font-black uppercase tracking-widest">Activo</span>
                                                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 text-[8px] font-black uppercase tracking-widest hidden md:inline-flex">II Bimestre</span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-1 flex items-center gap-2">
                                                    {plan.grado} — {plan.ciclo}
                                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                                    <span className="text-brand-magenta">{compsCount} Competencias Priorizadas</span>
                                                </p>
                                                <div className="flex items-center gap-1.5 text-gray-500 pt-1 group-hover:text-gray-300 transition-colors" title="Multi-sede (Aplica a varias secciones)">
                                                    <span className="material-icons-round text-[10px]">link</span>
                                                    <span className="text-[9px] font-bold uppercase tracking-widest">Aplicado a: 5to A, 5to B, 5to C</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-white/5 md:border-0 justify-end md:justify-center">
                                            <button 
                                                className="px-4 py-2 rounded-xl bg-white/5 text-gray-300 font-black uppercase tracking-widest text-[9px] hover:bg-white/10 hover:text-white transition-all border border-white/5 flex items-center gap-1.5 active:scale-95"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/plan-anual/${plan.id}/registro`); }}
                                            >
                                                <span className="material-icons-round text-xs text-primary-teal">poll</span>
                                                Registro de Notas
                                            </button>
                                            <span className="material-icons-round text-gray-700 group-hover:text-primary-teal transition-transform group-hover:translate-x-1 shrink-0 hidden md:inline-flex">chevron_right</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>

                {/* Audit Alertas */}
                <AuditReport />
            </div>
            {/* 5. El "Cerebro" de IA (Reflexión y Ajuste) */}
            <Card variant="strong" className="p-8 bg-gradient-to-r from-surface-card to-brand-magenta/5 border-brand-magenta/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-magenta/5 blur-[80px] -mr-32 -mt-32 group-hover:bg-brand-magenta/10 transition-all duration-700" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-brand-magenta/10 border border-brand-magenta/20 flex items-center justify-center text-brand-magenta shadow-glow-magenta animate-float">
                            <span className="material-icons-round text-3xl">psychology</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Reflexión de Cierre</h3>
                            <p className="text-sm font-bold text-gray-400">¿Se logró la meta pedagógica de hoy con 5to Grado A?</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all active:scale-95">
                            Sí, totalmente
                        </button>
                        <button 
                            className="px-6 py-3 rounded-xl bg-brand-magenta/10 border border-brand-magenta/30 text-brand-magenta font-black uppercase tracking-widest text-[10px] hover:bg-brand-magenta hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            onClick={() => {
                                // Mock de Re-programación
                                alert("IA: Entendido, Jimy. Ajustaré la secuencia y moveré los materiales para mañana automáticamente.");
                            }}
                        >
                            No, reprogramar
                            <span className="material-icons-round text-xs">auto_fix_high</span>
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

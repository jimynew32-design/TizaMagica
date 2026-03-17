import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { HorarioConfig, HorarioScenario, Docente, Aula, Seccion, Materia, CargaAcademica, Restriccion, CURRENT_CONFIG_ID } from './types';
import { db } from '../../store/db';

interface HorarioState {
    config: HorarioConfig | null;
    recursos: {
        docentes: Docente[];
        aulas: Aula[];
        secciones: Seccion[];
        materias: Materia[];
    };
    cargaAcademica: CargaAcademica[];
    restricciones: Restriccion[];
    scenarios: HorarioScenario[];
    currentScenarioId: string | null;
    
    // Actions
    setConfig: (config: HorarioConfig) => void;
    setRecursos: (type: 'docentes' | 'aulas' | 'secciones' | 'materias', items: any[]) => void;
    setCargaAcademica: (items: CargaAcademica[]) => void;
    setRestricciones: (items: Restriccion[]) => void;
    saveConfig: () => Promise<void>;
    loadConfig: () => Promise<void>;
    resetConfig: () => Promise<void>;
}

export const useHorarioStore = create<HorarioState>()(
    persist(
        immer((set, get) => ({
            config: null,
            recursos: {
                docentes: [],
                aulas: [],
                secciones: [],
                materias: []
            },
            cargaAcademica: [],
            restricciones: [],
            scenarios: [],
            currentScenarioId: null,

            setConfig: (config) => {
                set(state => {
                    state.config = config;
                    // Hallazgo #1: Limpiar restricciones huérfanas si el número de bloques disminuye
                    if (state.restricciones.length > 0) {
                        state.restricciones = state.restricciones.filter(r => {
                            // Solo validamos restricciones que dependen de tiempo/espacio
                            if ('bloqueIndex' in r && 'dia' in r) {
                                return r.bloqueIndex < config.bloquesPorDia && 
                                       config.diasLaborables.includes(r.dia);
                            }
                            return true;
                        });
                    }
                });
            },

            setRecursos: (type, items) => {
                set(state => {
                    state.recursos[type] = items;
                });
            },

            setCargaAcademica: (items) => {
                set(state => {
                    state.cargaAcademica = items;
                });
            },

            setRestricciones: (items) => {
                set(state => {
                    state.restricciones = items;
                });
            },

            saveConfig: async () => {
                const { config, recursos, cargaAcademica, restricciones } = get();
                if (!config) return;

                // Hallazgo #4 y #5: Persistir con ID determinista y campos de esquema
                const payload = { 
                    ...config, 
                    id: CURRENT_CONFIG_ID,
                    active: true,
                    recursos, 
                    cargaAcademica, 
                    restricciones 
                };
                await db.horarios_config.put(payload as any);
            },

            loadConfig: async () => {
                // Hallazgo #4: Carga determinista por ID único
                const data = await db.horarios_config.get(CURRENT_CONFIG_ID) as any;
                if (data) {
                    set(state => {
                        state.config = data;
                        if (data.recursos) {
                            state.recursos = {
                                docentes: data.recursos.docentes || [],
                                aulas: data.recursos.aulas || [],
                                secciones: data.recursos.secciones || [],
                                materias: data.recursos.materias || []
                            };
                        }
                        if (data.cargaAcademica) state.cargaAcademica = data.cargaAcademica;
                        if (data.restricciones) state.restricciones = data.restricciones;
                    });
                }
            },

            resetConfig: async () => {
                await db.horarios_config.clear();
                await db.horarios_celdas.clear();
                set(state => {
                    state.config = null;
                    state.recursos = { docentes: [], aulas: [], secciones: [], materias: [] };
                    state.cargaAcademica = [];
                    state.restricciones = [];
                    state.scenarios = [];
                    state.currentScenarioId = null;
                });
            }
        })),
        {
            name: 'planx-horarios-v4-store',
            partialize: (state) => ({ 
                currentScenarioId: state.currentScenarioId 
            }),
        }
    )
);

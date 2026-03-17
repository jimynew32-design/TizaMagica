import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { NeonInput } from '../ui/NeonInput';
import { NeonButton } from '../ui/NeonButton';
import { Toggle } from '../ui/Toggle';
import { useAIConfigStore } from '@/store';
import { checkConnection } from '@/services/ai';

/**
 * AISettingsPanel — Configuración del motor IA
 * SEGURIDAD (Fase 1): Se eliminó referencia a google-service-account.
 * Las credenciales de GCP ahora viven en Supabase Secrets (server-side).
 */

interface AISettingsPanelProps {
    isModal?: boolean;
    onClose?: () => void;
}

export const AISettingsPanel: React.FC<AISettingsPanelProps> = ({ isModal, onClose }) => {
    const {
        aiConfig,
        setAutoRetry,
        setEnableLogging,
        setProvider,
        setLMStudioUrl,
        setActiveModel
    } = useAIConfigStore();

    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [localModels, setLocalModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    // Cargar modelos de LM Studio si está seleccionado
    React.useEffect(() => {
        if (aiConfig.provider === 'lmstudio') {
            fetchModels();
        }
    }, [aiConfig.provider, aiConfig.lmstudioUrl]);

    const fetchModels = async () => {
        setIsLoadingModels(true);
        try {
            const baseUrl = aiConfig.lmstudioUrl || 'http://localhost:1234/v1';
            const res = await fetch(`${baseUrl}/models`);
            if (res.ok) {
                const data = await res.json();
                const models = data.data.map((m: any) => m.id);
                setLocalModels(models);
                
                // Si no hay modelo seleccionado o es uno de Google, sugerir el primero o Qwen
                const current = aiConfig.activeModel;
                if (!current || current.includes('gemini')) {
                    const qwen = models.find((m: string) => m.toLowerCase().includes('qwen'));
                    if (qwen) {
                        setActiveModel(qwen);
                    } else if (models.length > 0) {
                        setActiveModel(models[0]);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching local models:', error);
            setLocalModels([]);
        } finally {
            setIsLoadingModels(false);
        }
    };

    const handleTestConnection = async () => {
        setTestStatus('testing');
        const ok = await checkConnection(aiConfig.provider);
        setTestStatus(ok ? 'success' : 'error');

        if (ok) {
            alert(`¡Conexión exitosa! El motor ${aiConfig.provider === 'lmstudio' ? 'LM Studio' : 'Vertex AI Proxy'} responde correctamente.`);
        } else {
            alert(`Error de conexión con ${aiConfig.provider === 'lmstudio' ? 'LM Studio' : 'Vertex AI'}. Verifica tu configuración.`);
        }
    };

    return (
        <Card variant="strong" className="max-w-2xl mx-auto animate-fade-in border-magenta/20 max-h-[85vh] flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-magenta rounded-2xl flex items-center justify-center glow-magenta">
                        <span className="material-icons-round text-white">memory</span>
                    </div>
                    <div>
                        <CardTitle>Cerebro IA</CardTitle>
                        <p className="text-sm text-gray-400">Configuración del Motor Neuronal</p>
                    </div>
                </div>

                {isModal && onClose && (
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                )}
            </CardHeader>

            <CardContent className="space-y-8 pt-6 overflow-y-auto scrollbar-thin pr-4">
                {/* Selector de Proveedor (Temporal) */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Seleccionar Motor de IA</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setProvider('vertex')}
                            className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${aiConfig.provider === 'vertex'
                                ? 'bg-primary-teal/10 border-primary-teal text-primary-teal glow-teal-sm'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                }`}
                        >
                            <span className="material-icons-round">cloud</span>
                            <span className="text-xs font-bold">Cloud (Vertex AI)</span>
                        </button>
                        <button
                            onClick={() => setProvider('lmstudio')}
                            className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${aiConfig.provider === 'lmstudio'
                                ? 'bg-magenta/10 border-magenta text-magenta glow-magenta-sm'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                }`}
                        >
                            <span className="material-icons-round">terminal</span>
                            <span className="text-xs font-bold">Local (LM Studio)</span>
                        </button>
                    </div>
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <p className="text-[10px] text-yellow-500 flex items-center gap-2 italic">
                            <span className="material-icons-round text-xs">warning</span>
                            Soporte de LM Studio es temporal para fase de pruebas.
                        </p>
                    </div>
                </div>

                {/* Configuración Vertex */}
                {aiConfig.provider === 'vertex' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                            <p className="text-xs text-emerald-400 leading-relaxed">
                                <span className="font-bold whitespace-nowrap">Vertex AI Proxy:</span> Las llamadas están protegidas en el servidor. Recomendado para producción.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <NeonInput
                                label="Modelo Activo"
                                value={aiConfig.activeModel || 'gemini-1.5-flash'}
                                disabled
                                icon="smart_toy"
                            />
                            <NeonInput
                                label="Región"
                                value={aiConfig.vertexConfig?.location || 'us-central1'}
                                disabled
                                icon="place"
                            />
                        </div>
                    </div>
                )}

                {/* Configuración LM Studio (Nativo) */}
                {aiConfig.provider === 'lmstudio' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-4 bg-magenta/5 border border-magenta/10 rounded-2xl flex items-start gap-3">
                            <span className="material-icons-round text-magenta mt-0.5">info</span>
                            <p className="text-xs text-magenta leading-relaxed">
                                <span className="font-bold">Modo Local Activo:</span> El sistema detectará automáticamente los modelos cargados en tu servidor local. Recomendado: <span className="font-bold underline">qwen3-vl-4b</span>.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <NeonInput
                                label="URL del Servidor"
                                placeholder="http://localhost:1234/v1"
                                value={aiConfig.lmstudioUrl}
                                onChange={(e) => setLMStudioUrl(e.target.value)}
                                icon="link"
                            />

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    Modelo Local
                                    {isLoadingModels && <span className="animate-spin text-[10px]">refresh</span>}
                                </label>
                                <div className="relative group">
                                    <select 
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-10 text-xs font-bold text-white focus:outline-none focus:border-magenta/50 focus:bg-white/[0.08] transition-all appearance-none cursor-pointer"
                                        value={aiConfig.activeModel}
                                        onChange={(e) => setActiveModel(e.target.value)}
                                    >
                                        {localModels.length > 0 ? (
                                            localModels.map(m => (
                                                <option key={m} value={m} className="bg-[#1a1a1a] text-white py-2">{m}</option>
                                            ))
                                        ) : (
                                            <option value="" className="bg-[#1a1a1a] text-gray-500">No se detectaron modelos...</option>
                                        )}
                                    </select>
                                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg group-focus-within:text-magenta transition-colors">psychology</span>
                                    <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-gray-550 text-sm pointer-events-none">expand_more</span>
                                </div>
                                <button 
                                    onClick={fetchModels}
                                    className="text-[9px] text-magenta/60 hover:text-magenta font-black uppercase tracking-tighter ml-1 transition-colors flex items-center gap-1"
                                >
                                    <span className="material-icons-round text-[10px]">sync</span>
                                    Actualizar Lista
                                </button>
                            </div>
                        </div>

                        {/* Si no hay modelos detectados, mostrar el input manual como fallback */}
                        {localModels.length === 0 && (
                            <NeonInput
                                label="Nombre del Modelo (Manual)"
                                placeholder="Ej: qwen3-vl-4b"
                                value={aiConfig.activeModel.includes('gemini') ? '' : aiConfig.activeModel}
                                onChange={(e) => setActiveModel(e.target.value)}
                                icon="edit"
                            />
                        )}
                    </div>
                )}

                {/* Additional Settings */}
                <div className="pt-4 border-t border-white/5 space-y-4">
                    <Toggle
                        label="Fallback automático de modelos (Recomendado)"
                        checked={aiConfig.autoRetry}
                        onChange={setAutoRetry}
                    />
                    <Toggle
                        label="Registro detallado de prompts (Desarrollador)"
                        checked={aiConfig.enableLogging}
                        onChange={setEnableLogging}
                    />
                </div>

                {/* Actions */}
                <div className="pt-6 flex items-center justify-end gap-4">
                    <NeonButton
                        variant="ghost"
                        onClick={handleTestConnection}
                        isLoading={testStatus === 'testing'}
                        icon={testStatus === 'success' ? 'check_circle' : testStatus === 'error' ? 'error' : undefined}
                    >
                        Probar Conexión
                    </NeonButton>
                </div>
            </CardContent>
        </Card>
    );
};

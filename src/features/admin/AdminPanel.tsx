import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { cn } from '@/lib/cn';

/**
 * AdminPanel — Consola Comercial de TizaMágica
 * Versión Luxe: Implementa gestión de activaciones, edición y borrado total.
 */
export const AdminPanel: React.FC = () => {
    const [solicitudes, setSolicitudes] = useState<any[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});

    useEffect(() => {
        fetchSolicitudes();
    }, []);

    const fetchSolicitudes = async () => {
        setSyncStatus('syncing');
        try {
            const { data, error } = await supabase
                .from('solicitudes_acceso')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setSolicitudes(data || []);
            setSyncStatus('synced');
        } catch (error) {
            console.error('Error fetching solicitudes:', error);
            setSyncStatus('error');
        }
    };

    const handleActivarDocente = async (solicitud: any) => {
        setProcessingId(solicitud.id);
        
        try {
            const pinTemporal = String(Math.floor(100000 + Math.random() * 900000));
            const email = `${solicitud.alias}@tizamagica.edu.pe`;
            
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password: pinTemporal,
            });

            if (authError && authError.message !== 'User already registered') {
                throw new Error(`Error Auth: ${authError.message}`);
            }

            const userId = authData?.user?.id || crypto.randomUUID();

            const newPerfil = {
                id: userId,
                dni: solicitud.alias,
                nombreCompleto: solicitud.nombres,
                nombreIE: solicitud.institucion,
                gereduDre: '',
                ugel: '',
                director: '',
                nivel: 'Primaria',
                cargaHoraria: [],
                isOnboarded: false,
                activo: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await supabase.from('perfiles').upsert(newPerfil);

            await supabase
                .from('solicitudes_acceso')
                .update({ estado: 'APROBADA', updated_at: new Date().toISOString(), dias_suscripcion: 30 })
                .eq('id', solicitud.id);

            await fetchSolicitudes();
            sendWhatsApp(solicitud, pinTemporal);
            
        } catch (error: any) {
            console.error('Error de Activación:', error);
            alert(`Hubo un problema: ${error.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeleteSolicitud = async (sol: any) => {
        const confirmacion = window.confirm(`¿Estás seguro de eliminar a ${sol.nombres}? Se borrará la solicitud y su perfil pedagógico. Para permitir que use el mismo DNI de nuevo, recuerda borrar también su usuario en el panel de Supabase Auth.`);
        
        if (!confirmacion) return;
        setProcessingId(sol.id);

        try {
            // 1. Borrar de solicitudes_acceso
            const { error: errorSolicitud } = await supabase
                .from('solicitudes_acceso')
                .delete()
                .eq('id', sol.id);
            
            if (errorSolicitud) throw errorSolicitud;

            // 2. Intentar borrar perfil si existe (DNI es el alias)
            const { error: errorPerfil } = await supabase
                .from('perfiles')
                .delete()
                .eq('dni', sol.alias);

            if (errorPerfil) throw errorPerfil;
            
            await fetchSolicitudes();
        } catch (error: any) {
            console.error('Error al eliminar:', error);
            alert('Error al procesar la eliminación: ' + (error.message || 'Error desconocido de permisos'));
        } finally {
            setProcessingId(null);
        }
    };

    const handleEditClick = (sol: any) => {
        setEditingId(sol.id);
        setEditForm({
            estado: sol.estado || 'PENDIENTE_PAGO',
            metodo_pago: sol.metodo_pago || '',
            codigo_operacion: sol.codigo_operacion || '',
            dias_suscripcion: sol.dias_suscripcion || 0
        });
    };

    const handleSaveEdit = async (id: string) => {
        setProcessingId(id);
        try {
            const { error } = await supabase
                .from('solicitudes_acceso')
                .update({
                    estado: editForm.estado,
                    metodo_pago: editForm.metodo_pago,
                    codigo_operacion: editForm.codigo_operacion,
                    dias_suscripcion: Number(editForm.dias_suscripcion),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);
            
            if (error) throw error;
            setEditingId(null);
            await fetchSolicitudes();
        } catch (error: any) {
            console.error('Error al actualizar:', error);
            alert(`Hubo un problema al guardar: ${error.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const sendWhatsApp = (solicitud: any, pin: string) => {
        let phone = solicitud.celular || '';
        phone = phone.replace(/\D/g, '');
        if (!phone.startsWith('51') && phone.length === 9) phone = '51' + phone;

        const baseUrl = window.location.origin + window.location.pathname.split('/').slice(0, -1).join('/');
        const msg = `¡Hola ${solicitud.nombres}! 🚀 Tu pago ha sido confirmado.\n\nTu cuenta de Ingeniería Pedagógica en TizaMágica está activa.\n\n🌐 *Ingresa en:* ${baseUrl}\n👤 *Usuario:* ${solicitud.alias}\n🔑 *PIN Temporal:* ${pin}\n\n*Recuerda cambiar tu PIN una vez ingreses. ¡Bienvenido!*`;
        const encodedMsg = encodeURIComponent(msg);
        window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodedMsg}`, '_blank');
    };

    const handleSendWhatsApp = (solicitud: any) => {
        let phone = solicitud.celular || '';
        phone = phone.replace(/\D/g, '');
        if (!phone.startsWith('51') && phone.length === 9) phone = '51' + phone;

        const baseUrl = window.location.origin + window.location.pathname.split('/').slice(0, -1).join('/');
        const msg = `¡Hola ${solicitud.nombres}! 🚀 Tu cuenta en TizaMágica ya está activa.\n\n🌐 *Ingresa en:* ${baseUrl}\n👤 *Usuario:* ${solicitud.alias}\n\nSi olvidaste tu PIN, contacta con soporte.`;
        const encodedMsg = encodeURIComponent(msg);
        window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodedMsg}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-[#0D0D0D] p-6 lg:p-12 animate-fade-in">
            <div className="max-w-[1600px] mx-auto space-y-12">
                <ModuleHeader 
                    module="ADMIN"
                    title="Consola Comercial"
                    subtitle="Gestión de Cuentas y Activaciones Pedagógicas"
                    syncStatus={syncStatus}
                    actions={[
                        <NeonButton key="refresh" icon="refresh" variant="ghost" onClick={fetchSolicitudes} className="bg-white/5 border-white/10">
                            Actualizar
                        </NeonButton>
                    ]}
                />

                <Card variant="strong" className="overflow-hidden border-white/5 bg-surface-card/30 backdrop-blur-3xl shadow-2xl">
                    <CardHeader className="bg-white/[0.02] border-b border-white/5 px-8 py-6">
                        <CardTitle className="text-white flex items-center gap-2">
                            <span className="material-icons-round text-brand-magenta">people_alt</span>
                            Solicitudes de Acceso
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-black/20 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 border-b border-white/5">
                                        <th className="p-6">Docente e Institución</th>
                                        <th className="p-6">Identidad / Contacto</th>
                                        <th className="p-6">Transacción</th>
                                        <th className="p-4">Suscripción</th>
                                        <th className="p-6">Estado</th>
                                        <th className="p-6 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {solicitudes.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-gray-400 font-medium italic">
                                                No hay solicitudes pendientes en este momento.
                                            </td>
                                        </tr>
                                    ) : (
                                        solicitudes.map((sol) => (
                                            <tr key={sol.id} className="hover:bg-white/[0.03] transition-all group">
                                                <td className="p-6">
                                                    <div className="flex flex-col gap-1">
                                                        <p className="text-sm font-black text-white group-hover:text-primary-teal transition-colors">{sol.nombres}</p>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase">
                                                            <span className="material-icons-round text-[12px] text-brand-magenta">school</span>
                                                            {sol.institucion}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="inline-flex w-fit px-2 py-0.5 bg-primary-teal/10 text-primary-teal border border-primary-teal/20 rounded text-[11px] font-mono font-bold">
                                                            {sol.alias}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                                            <span className="material-icons-round text-[12px]">phone</span>
                                                            {sol.celular || 'Sin número'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    {editingId === sol.id ? (
                                                        <div className="flex flex-col gap-2">
                                                            <input 
                                                                type="text" 
                                                                value={editForm.metodo_pago}
                                                                onChange={(e) => setEditForm({...editForm, metodo_pago: e.target.value})}
                                                                placeholder="Método"
                                                                className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                            />
                                                            <input 
                                                                type="text" 
                                                                value={editForm.codigo_operacion}
                                                                onChange={(e) => setEditForm({...editForm, codigo_operacion: e.target.value})}
                                                                placeholder="Operación"
                                                                className="bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-gray-300 font-mono"
                                                            />
                                                        </div>
                                                    ) : sol.codigo_operacion ? (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs font-bold text-gray-300">{sol.metodo_pago}</span>
                                                            <span className="text-[10px] text-gray-500 font-mono">OP: {sol.codigo_operacion}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-red-400/60 italic">Pago no reportado</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {editingId === sol.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="number" 
                                                                value={editForm.dias_suscripcion}
                                                                onChange={(e) => setEditForm({...editForm, dias_suscripcion: e.target.value})}
                                                                className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white w-14 text-center"
                                                            />
                                                            <span className="text-[10px] text-gray-600 font-bold uppercase">dias</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-black text-white">{sol.dias_suscripcion || 0}</span>
                                                            <span className="text-[10px] text-gray-600 font-bold uppercase">dias</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-6">
                                                    {editingId === sol.id ? (
                                                        <select 
                                                            value={editForm.estado}
                                                            onChange={(e) => setEditForm({...editForm, estado: e.target.value})}
                                                            className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                        >
                                                            <option value="SOLICITADO">SOLICITADO</option>
                                                            <option value="PENDIENTE_PAGO">PENDIENTE PAGO</option>
                                                            <option value="APROBADA">APROBADA</option>
                                                        </select>
                                                    ) : (
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                            sol.estado === 'APROBADA' && "bg-green-500/10 text-green-400 border-green-500/20",
                                                            sol.estado === 'PENDIENTE_PAGO' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                                            sol.estado === 'SOLICITADO' && "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                        )}>
                                                            {sol.estado.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {editingId === sol.id ? (
                                                            <>
                                                                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-white transition-colors">
                                                                    <span className="material-icons-round text-[18px]">close</span>
                                                                </button>
                                                                <button onClick={() => handleSaveEdit(sol.id)} className="text-green-500 hover:text-green-400 transition-colors">
                                                                    <span className="material-icons-round text-[18px]">check</span>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleDeleteSolicitud(sol)} 
                                                                    disabled={processingId === sol.id}
                                                                    className="text-gray-600 hover:text-red-500 transition-colors"
                                                                >
                                                                    <span className="material-icons-round text-[18px]">delete</span>
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleEditClick(sol)} 
                                                                    disabled={processingId === sol.id}
                                                                    className="text-gray-600 hover:text-brand-magenta transition-colors"
                                                                >
                                                                    <span className="material-icons-round text-[18px]">edit</span>
                                                                </button>
                                                                
                                                                {sol.estado === 'APROBADA' ? (
                                                                    <NeonButton 
                                                                        variant="ghost" 
                                                                        onClick={() => handleSendWhatsApp(sol)}
                                                                        className="bg-white/5 border-white/10 text-white text-[9px] font-black hover:bg-white/10 py-1.5 px-3"
                                                                    >
                                                                        REENVIAR
                                                                    </NeonButton>
                                                                ) : (
                                                                    <NeonButton 
                                                                        variant="magenta" 
                                                                        onClick={() => handleActivarDocente(sol)}
                                                                        isLoading={processingId === sol.id}
                                                                        className="text-[9px] font-black tracking-widest py-1.5 px-3"
                                                                    >
                                                                        ACTIVAR
                                                                    </NeonButton>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

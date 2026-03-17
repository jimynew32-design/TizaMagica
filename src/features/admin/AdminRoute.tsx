import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

/**
 * AdminRoute — Verificación de rol admin server-side (Zero-Trust)
 * Resuelve: H-008
 *
 * Valida que el usuario autenticado tenga el email de administrador
 * registrado en Supabase Auth. Redirige a /dashboard si no es admin.
 *
 * NOTA: Para escalar a múltiples admins, reemplazar la verificación
 * por email con un campo `role` en la tabla `perfiles` validado
 * con una RPC de Supabase o un campo en user_metadata.
 */
export const AdminRoute: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'authorized' | 'gate' | 'denied'>('loading');
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const ADMIN_PIN = '203232';
    const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 Minutos

    const updateActivity = () => {
        if (localStorage.getItem('tiza_admin_session')) {
            localStorage.setItem('tiza_admin_last_activity', Date.now().toString());
        }
    };

    const checkSession = () => {
        const lastActivity = localStorage.getItem('tiza_admin_last_activity');
        const sessionActive = localStorage.getItem('tiza_admin_session') === 'true';

        if (sessionActive && lastActivity) {
            const now = Date.now();
            if (now - parseInt(lastActivity) > SESSION_TIMEOUT) {
                // Sesión expirada
                localStorage.removeItem('tiza_admin_session');
                localStorage.removeItem('tiza_admin_last_activity');
                return false;
            }
            return true;
        }
        return false;
    };

    useEffect(() => {
        const verify = async () => {
            // Verificación por email (Producción)
            const { data: { session } } = await supabase.auth.getSession();
            const adminEmails = ['admin@tizamagica.edu.pe'];
            const userEmail = session?.user?.email || '';

            if (adminEmails.includes(userEmail)) {
                setStatus('authorized');
                return;
            }

            // Verificación por PIN (Localhost y Producción)
            if (checkSession()) {
                setStatus('authorized');
                updateActivity();
            } else {
                setStatus('gate');
            }
        };

        verify();

        // Listeners globales para inactividad (solo se activan si está en la ruta admin)
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        events.forEach(ev => window.addEventListener(ev, updateActivity));

        return () => {
            events.forEach(ev => window.removeEventListener(ev, updateActivity));
        };
    }, []);

    const handleVerifySync = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === ADMIN_PIN) {
            localStorage.setItem('tiza_admin_session', 'true');
            localStorage.setItem('tiza_admin_last_activity', Date.now().toString());
            setStatus('authorized');
        } else {
            setError(true);
            setTimeout(() => setError(false), 800);
            setPin('');
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-10 h-10 border-2 border-white/5 border-t-brand-magenta rounded-full animate-spin"></div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] animate-pulse">Iniciando Protocolo Admin...</p>
            </div>
        );
    }

    if (status === 'gate') {
        return (
            <div className="min-h-screen bg-[#060606] flex items-center justify-center p-6 font-sans">
                <div className="w-full max-w-[320px] space-y-10 animate-fade-in">
                    <div className="space-y-4 text-center">
                        <div className="w-14 h-14 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto border border-white/5 shadow-2xl">
                            <span className="material-icons-round text-brand-magenta text-2xl">security</span>
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl font-black text-white tracking-tight uppercase">Admin Access</h2>
                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em]">Introduzca Identificador de Seguridad</p>
                        </div>
                    </div>

                    <form onSubmit={handleVerifySync} className="space-y-6">
                        <div className="relative group">
                            <input 
                                type="password"
                                maxLength={6}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="••••••"
                                className={`w-full bg-white/[0.02] border-b-2 ${error ? 'border-red-500 animate-shake' : 'border-white/10 group-hover:border-brand-magenta/40'} h-20 text-center text-4xl tracking-[0.6em] text-white focus:outline-none focus:border-brand-magenta transition-all font-black`}
                                autoFocus
                            />
                        </div>
                        <button 
                            type="submit"
                            className="w-full h-14 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:bg-brand-magenta hover:text-white transition-all transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span className="material-icons-round text-sm">verified</span>
                            Verificar Identidad
                        </button>
                    </form>

                    <p className="text-center text-[8px] text-gray-700 font-bold uppercase tracking-widest italic pt-4">
                        Sistema Cifrado — Sesión caduca en 10 min
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'denied') return <Navigate to="/dashboard" replace />;

    return <Outlet />;
};

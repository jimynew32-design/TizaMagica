import React, { useState, useRef, useEffect } from 'react';
import { usePerfilStore, useAIConfigStore } from '@/store';
import { cn } from '@/lib/cn';
import { useNavigate } from 'react-router-dom';

export const UserMenu: React.FC = () => {
    const { perfil, logout } = usePerfilStore();
    const { toggleSettings } = useAIConfigStore();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:bg-white/10 transition-all group active:scale-95",
                    isOpen && "bg-white/10 border-primary-teal/30 shadow-glow-teal"
                )}
            >
                <div className="text-right">
                    <p className="text-xs font-black text-white leading-none mb-1">
                        {perfil?.nombreCompleto || 'Docente'}
                    </p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                        {perfil?.nivel || 'Sin Nivel'}
                    </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-teal to-brand-magenta flex items-center justify-center font-black text-white text-xs shadow-glow-teal transform group-hover:rotate-6 transition-transform">
                    {perfil?.nombreCompleto?.[0] || 'D'}
                </div>
                <span className={cn(
                    "material-icons-round text-gray-500 transition-transform duration-300",
                    isOpen && "rotate-180"
                )}>
                    expand_more
                </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-3xl overflow-hidden animate-entrance z-[60]">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">DNI / Usuario</p>
                        <p className="text-sm font-bold text-white truncate">{perfil?.dni || 'Usuario PlanX'}</p>
                    </div>

                    <div className="p-2">
                        <button 
                            onClick={() => { setIsOpen(false); navigate('/perfil'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all group"
                        >
                            <span className="material-icons-round text-gray-500 group-hover:text-brand-magenta transition-colors">account_circle</span>
                            <span className="text-xs font-bold uppercase tracking-wider">Mi Perfil</span>
                        </button>

                        <button 
                            onClick={() => { setIsOpen(false); toggleSettings(true); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all group"
                        >
                            <span className="material-icons-round text-gray-500 group-hover:text-primary-teal transition-colors">bolt</span>
                            <span className="text-xs font-bold uppercase tracking-wider">Cerebro AI</span>
                        </button>
                    </div>

                    <div className="p-2 border-t border-white/5 bg-white/[0.02]">
                        <button 
                            onClick={() => { setIsOpen(false); logout(); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all group"
                        >
                            <span className="material-icons-round text-gray-500 group-hover:text-red-400 transition-colors">logout</span>
                            <span className="text-xs font-bold uppercase tracking-wider">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

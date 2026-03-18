import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';

interface SidebarItemProps {
    to: string;
    icon: string;
    label: string;
    collapsed?: boolean;
    variant?: 'operative' | 'anual' | 'unidad' | 'sesion' | 'admin';
    subItem?: boolean;
    isAI?: boolean;
    onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, collapsed, variant = 'anual', subItem, isAI, onClick }) => {
    const getColors = () => {
        if (isAI) return "text-primary-teal group-hover:text-primary-teal";
        switch (variant) {
            case 'operative': return "text-white group-hover:text-white";
            case 'anual': return "text-brand-magenta group-hover:text-brand-magenta";
            case 'unidad': return "text-purple-400 group-hover:text-purple-400";
            case 'sesion': return "text-cyan-400 group-hover:text-cyan-400";
            default: return "text-gray-400 group-hover:text-white";
        }
    };

    const getActiveStyles = () => {
        if (isAI) return "bg-primary-teal/10 text-white border-primary-teal/30 shadow-[0_0_20px_rgba(45,212,191,0.2)]";
        switch (variant) {
            case 'anual': return "bg-brand-magenta/10 text-white border-brand-magenta/30 shadow-[0_0_20px_rgba(232,18,126,0.2)]";
            case 'unidad': return "bg-purple-500/10 text-white border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]";
            case 'sesion': return "text-white border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]";
            default: return "bg-white/10 text-white border-white/20";
        }
    };

    return (
        <NavLink
            to={to}
            title={collapsed ? label : undefined}
            onClick={onClick}
            className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-xl transition-all duration-500 ease-premium group border border-transparent relative",
                collapsed ? "px-3 py-3 justify-center" : cn("px-4 py-3", subItem && "ml-4 scale-[0.96]"),
                isActive ? getActiveStyles() : "text-gray-400 hover:text-white hover:bg-white/5",
                isAI && "bg-primary-teal/5 border-primary-teal/10 mt-2"
            )}
        >
            {({ isActive }) => (
                <>
                    {isActive && !collapsed && (
                        <div className={cn(
                            "absolute left-0 w-1 h-6 rounded-r-full",
                            variant === 'anual' ? "bg-brand-magenta shadow-[0_0_10px_#e8127e]" :
                            variant === 'unidad' ? "bg-purple-500 shadow-[0_0_10px_#a855f7]" :
                            variant === 'sesion' ? "bg-cyan-500 shadow-[0_0_10px_#22d3ee]" :
                            "bg-primary-teal shadow-[0_0_10px_#2dd4bf]"
                        )} />
                    )}
                    <span className={cn(
                        "material-icons-round text-[22px] transition-all duration-500",
                        "group-hover:scale-110",
                        isActive ? "rotate-0" : "group-hover:rotate-3",
                        getColors(),
                        "flex-shrink-0"
                    )}>
                        {icon}
                    </span>
                    {!collapsed && (
                        <span className={cn(
                            "text-xs font-bold tracking-[0.05em] uppercase whitespace-nowrap overflow-hidden transition-all duration-500",
                            isActive ? "opacity-100 translate-x-1" : "opacity-80 group-hover:opacity-100"
                        )}>
                            {label}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
};

export interface SidebarProps {
    onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
    const [collapsed, setCollapsed] = useState(true);

    return (
        <nav
            onMouseEnter={() => setCollapsed(false)}
            onMouseLeave={() => setCollapsed(true)}
            className={cn(
                "h-full flex flex-col bg-black/80 backdrop-blur-3xl border-r border-white/5 transition-all duration-500 ease-premium",
                collapsed ? "w-20 p-3" : "w-72 p-6"
            )}
        >
            {/* Logo */}
            <div className={cn("flex items-center gap-4 mb-10", collapsed ? "justify-center" : "pl-2")}>
                <div className="w-11 h-11 bg-gradient-to-br from-primary-teal via-brand-magenta to-purple-600 rounded-2xl flex items-center justify-center shadow-glow-teal flex-shrink-0 transform hover:scale-105 transition-all duration-500 group pointer-events-auto cursor-pointer">
                    <span className="material-icons-round text-white font-bold text-[24px] group-hover:rotate-12 transition-transform">auto_fix_high</span>
                </div>
                {!collapsed && (
                    <div className="animate-fade-in">
                        <h1 className="text-2xl font-black text-white leading-none tracking-tighter">
                            PLAN<span className="text-brand-magenta">X</span>
                        </h1>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">
                            TM v3.0
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation Links */}
            <div className="flex-1 space-y-8 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-1 custom-scrollbar">
                
                {/* 1. NIVEL OPERATIVO: EL HOY */}
                <div className="space-y-1">
                    {!collapsed && <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 pl-4">Centro de Mando</p>}
                    <SidebarItem to="/dashboard" icon="space_dashboard" label="Vista General" variant="operative" collapsed={collapsed} onClick={onNavigate} />
                </div>

                {/* 2. CICLO DE PLANIFICACIÓN: CORAZÓN DEL SIDEBAR */}
                <div className="space-y-6 relative">
                    
                    {/* A. PLAN ANUAL (MACRO) */}
                    <div className="space-y-1 relative">
                        {!collapsed && <p className="text-[9px] font-black text-brand-magenta uppercase tracking-[0.3em] mb-3 pl-4 opacity-80">Plan Anual</p>}
                        {collapsed && <div className="border-t border-brand-magenta/20 my-4" />}
                        
                        {/* Conector Visual */}
                        {!collapsed && <div className="absolute left-[29px] top-10 bottom-2 w-[1px] bg-gradient-to-b from-brand-magenta/40 to-transparent" />}
                        
                        <div className="space-y-1.5">
                            <SidebarItem to="/plan-anual/diagnostico" icon="summarize" label="M01. Diagnóstico" variant="anual" subItem={!collapsed} collapsed={collapsed} onClick={onNavigate} />
                            <SidebarItem to="/plan-anual/identidad" icon="diversity_3" label="M02. Identidad" variant="anual" subItem={!collapsed} collapsed={collapsed} onClick={onNavigate} />
                            <SidebarItem to="/plan-anual/propositos" icon="assignment_turned_in" label="M03. Propósitos" variant="anual" subItem={!collapsed} collapsed={collapsed} onClick={onNavigate} />
                            <SidebarItem to="/plan-anual/estrategia" icon="calendar_month" label="M04. Estrategia" variant="anual" subItem={!collapsed} collapsed={collapsed} onClick={onNavigate} />
                            <SidebarItem to="/plan-anual/orientaciones" icon="explore" label="M05. Orientaciones" variant="anual" subItem={!collapsed} collapsed={collapsed} onClick={onNavigate} />
                        </div>
                    </div>

                    {/* B. UNIDADES (MEDIANO PLAZO) */}
                    <div className="space-y-1">
                        {!collapsed && <p className="text-[9px] font-black text-purple-400/60 uppercase tracking-[0.3em] mb-3 pl-4">Unidades</p>}
                        {collapsed && <div className="border-t border-purple-500/20 my-4" />}
                        <SidebarItem to="/unidades" icon="folder_copy" label="Gestión de Unidades" variant="unidad" collapsed={collapsed} onClick={onNavigate} />
                    </div>

                    {/* C. SESIONES (DÍA A DÍA) */}
                    <div className="space-y-1">
                        {!collapsed && <p className="text-[9px] font-black text-cyan-400/60 uppercase tracking-[0.3em] mb-3 pl-4">Sesiones</p>}
                        {collapsed && <div className="border-t border-cyan-500/20 my-4" />}
                        <SidebarItem to="/sesiones" icon="menu_book" label="Diario de Clase" variant="sesion" collapsed={collapsed} onClick={onNavigate} />
                    </div>

                    {/* D. PLUS: HERRAMIENTAS AVANZADAS */}
                    <div className="space-y-1">
                        {!collapsed && <p className="text-[9px] font-black text-primary-teal uppercase tracking-[0.3em] mb-3 pl-4">Plus</p>}
                        {collapsed && <div className="border-t border-primary-teal/20 my-4" />}
                        <SidebarItem 
                            to="/horario" 
                            icon="auto_awesome_motion" 
                            label="Generador de Horarios" 
                            variant="sesion" 
                            collapsed={collapsed}
                            isAI={true}
                            onClick={onNavigate}
                        />
                    </div>
                </div>
            </div>

            {/* Footer: Gestión y Administrativos */}
            <div className="mt-auto pt-6 border-t border-white/5 space-y-1">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label={collapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-gray-600 hover:text-white transition-all duration-500 group"
                >
                    <span className={cn(
                        "material-icons-round text-[20px] transition-transform duration-500 ease-premium",
                        collapsed && "rotate-180"
                    )}>
                        keyboard_double_arrow_left
                    </span>
                    {!collapsed && <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-50 group-hover:opacity-100">Colapsar</span>}
                </button>
            </div>
        </nav>
    );
};

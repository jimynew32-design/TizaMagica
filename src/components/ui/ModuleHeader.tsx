import React from 'react';
import { cn } from '@/lib/cn';

interface ModuleHeaderProps {
    module?: string;
    title: string;
    subtitle?: string;
    actions?: React.ReactNode[];
    syncStatus?: 'synced' | 'syncing' | 'error';
    className?: string;
}

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({
    module,
    title,
    subtitle,
    actions,
    syncStatus,
    className
}) => {
    return (
        <header className={cn("flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 animate-fade-in", className)}>
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    {module && (
                        <span className="bg-brand-magenta/10 text-brand-magenta px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest border border-brand-magenta/20">
                            {module}
                        </span>
                    )}
                    {syncStatus && (
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-500",
                            syncStatus === 'synced' ? "bg-green-500/10 border-green-500/20" : 
                            syncStatus === 'syncing' ? "bg-brand-magenta/10 border-brand-magenta/20 shadow-[0_0_15px_rgba(255,0,255,0.1)]" : 
                            "bg-red-500/10 border-red-500/20"
                        )}>
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all duration-500",
                                syncStatus === 'synced' && "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
                                syncStatus === 'syncing' && "bg-brand-magenta animate-pulse shadow-[0_0_12px_rgba(255,0,255,0.8)]",
                                syncStatus === 'error' && "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                            )} />
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-[0.15em] transition-colors",
                                syncStatus === 'synced' ? "text-green-500/80" : 
                                syncStatus === 'syncing' ? "text-brand-magenta" : 
                                "text-red-500/80"
                            )}>
                                {syncStatus === 'synced' ? 'Sincronizado' : syncStatus === 'syncing' ? 'Sincronizando' : 'Error Sync'}
                            </span>
                        </div>
                    )}
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm font-medium text-gray-400 italic">
                        {subtitle}
                    </p>
                )}
            </div>

            {actions && actions.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto md:justify-end">
                    {actions.map((action, idx) => (
                        <div key={idx} className="flex hover:scale-105 transition-transform active:scale-95">
                            {action}
                        </div>
                    ))}
                </div>
            )}
        </header>
    );
};

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { PlanSelector } from '@/components/dashboard/PlanSelector';
import { usePerfilStore, usePlanAnualStore, useAIConfigStore } from '@/store';
import { useEffect, useState } from 'react';
import { AISettingsPanel } from '@/components/settings/AISettingsPanel';
import { NotificationModal } from '@/components/ui/NotificationModal';
import { UserMenu } from '@/components/dashboard/UserMenu';
import { useIsMobile } from '@/hooks/ui/useMediaQuery';
import { cn } from '@/lib/cn';

export const DashboardLayout: React.FC = () => {
    const { perfil } = usePerfilStore();
    const { loadPlanes, planesLoaded } = usePlanAnualStore();
    const { isSettingsOpen, toggleSettings } = useAIConfigStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        if (perfil?.id) {
            if (!planesLoaded) loadPlanes(perfil.id);
        }
    }, [perfil?.id, planesLoaded]);

    return (
        <div className="min-h-dvh bg-app relative grid lg:grid-cols-[auto_1fr] grid-rows-[1fr] overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40dvw] h-[40dvh] bg-primary-teal/5 blur-[120px] rounded-full animate-glow-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[35dvw] h-[35dvh] bg-brand-magenta/5 blur-[120px] rounded-full animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
            </div>

            {/* Modal de Config IA */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
                    <div
                        className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in"
                        onClick={() => toggleSettings(false)}
                    />
                    <div className="relative w-full max-w-2xl z-10 animate-entrance">
                        <AISettingsPanel isModal onClose={() => toggleSettings(false)} />
                    </div>
                </div>
            )}

            {/* Navigation Drawer Overlay (Mobile Only) */}
            {isMobile && isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] lg:hidden animate-fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Navigation Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-[70] transition-transform duration-500 lg:relative lg:translate-x-0 lg:z-auto h-dvh",
                isMobile && (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full")
            )}>
                <Sidebar onNavigate={() => isMobile && setIsMobileMenuOpen(false)} />
            </aside>

            {/* Main Content Area */}
            <main className="flex flex-col min-h-dvh w-full overflow-hidden z-10 relative" id="main-content">
                {/* Top Header */}
                <header className="h-20 flex items-center justify-between px-safe sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/5 safe-area-pt">
                    <div className="flex items-center gap-3">
                        {isMobile && (
                            <button 
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 active:scale-95 transition-all"
                                aria-label="Abrir menú de navegación"
                                aria-controls="main-sidebar"
                                aria-expanded={isMobileMenuOpen}
                            >
                                <span className="material-icons-round text-gray-300">menu</span>
                            </button>
                        )}
                        <PlanSelector />
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <button 
                            aria-label="Ver notificaciones"
                            className="relative w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 group active:scale-95"
                        >
                            <span className="material-icons-round text-gray-400 group-hover:text-primary-teal transition-colors text-xl md:text-2xl">notifications</span>
                            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-brand-magenta rounded-full shadow-glow-magenta" />
                        </button>
                        <div className="h-8 w-[1px] bg-white/5 mx-1" />
                        <UserMenu />
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-safe py-4 md:py-6 lg:py-10 animate-entrance safe-area-pb">
                    <div className="max-w-[1600px] mx-auto w-full">
                        <Outlet />
                    </div>
                </div>
            </main>
            
            <NotificationModal />
        </div>
    );
};

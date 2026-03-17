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
    const [sidebarWidth, setSidebarWidth] = useState(288);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        if (perfil?.id) {
            if (!planesLoaded) loadPlanes(perfil.id);
        }
    }, [perfil?.id, planesLoaded]);

    useEffect(() => {
        const sidebar = document.querySelector('aside');
        if (!sidebar || isMobile) {
            setSidebarWidth(0);
            return;
        }
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setSidebarWidth(entry.contentRect.width + (isMobile ? 0 : 24));
            }
        });
        observer.observe(sidebar);
        return () => observer.disconnect();
    }, [isMobile]);

    // Close mobile menu on navigate (simplified by checking location if needed, 
    // but here we can just close it when clicking links inside Sidebar)
    
    return (
        <div className="flex bg-[#0D0D0D] min-h-screen relative overflow-hidden">
            {/*Background Logic */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-teal/5 blur-[120px] rounded-full animate-glow-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[35%] h-[35%] bg-brand-magenta/5 blur-[120px] rounded-full animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
            </div>

            {/* Modal de Config IA */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 group">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-all duration-500 animate-fade-in"
                        onClick={() => toggleSettings(false)}
                    />
                    <div className="relative w-full max-w-2xl z-10 animate-entrance">
                        <AISettingsPanel isModal onClose={() => toggleSettings(false)} />
                    </div>
                </div>
            )}

            {/* Navigation Overlay for Mobile */}
            {isMobile && isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] animate-fade-in lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Navigation Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-[60] transition-transform duration-500 lg:relative lg:translate-x-0 lg:z-auto",
                isMobile && (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full")
            )}>
                <Sidebar onNavigate={() => isMobile && setIsMobileMenuOpen(false)} />
            </div>

            {/* Main Content Area */}
            <main
                className="flex-1 flex flex-col min-h-screen transition-all duration-500 ease-premium w-full"
                style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
            >
                {/* Top Header */}
                <header className="h-20 flex items-center justify-between px-4 md:px-10 sticky top-0 z-40 bg-black/40 backdrop-blur-2xl border-b border-white/5">
                    <div className="flex items-center gap-3 md:gap-6">
                        {isMobile && (
                            <button 
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 active:scale-95"
                            >
                                <span className="material-icons-round text-gray-300">
                                    {isMobileMenuOpen ? 'close' : 'menu'}
                                </span>
                            </button>
                        )}
                        <PlanSelector />
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <button className="relative w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 group active:scale-95">
                            <span className="material-icons-round text-gray-400 group-hover:text-primary-teal transition-colors text-xl md:text-2xl">notifications</span>
                            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-brand-magenta rounded-full shadow-glow-magenta" />
                        </button>
                        <div className="h-8 w-[1px] bg-white/5 mx-1 md:mx-2" />
                        <UserMenu />
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-x-hidden p-4 md:p-10 animate-entrance">
                    <div className="max-w-[1600px] mx-auto w-full">
                        <Outlet />
                    </div>
                </div>
            </main>
            <NotificationModal />
        </div>
    );
};


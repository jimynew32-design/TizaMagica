import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { usePlanAnualStore } from '@/store';

export const PlanSelector: React.FC = () => {
    const { planes, planActivo, selectPlan } = usePlanAnualStore();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // BUG-13 fix: Close dropdown when clicking outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const activeDisplay = planActivo || planes[0];

    if (!activeDisplay && planes.length === 0) {
        // Simple defensive check
    }

    if (!activeDisplay) {
        return (
            <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                <p className="text-[10px] font-bold text-yellow-500">SIN PLANES</p>
            </div>
        );
    }

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Seleccionar plan curricular"
                aria-haspopup="true"
                aria-expanded={isOpen}
                className="flex items-center gap-3 px-4 py-2 bg-surface-card rounded-2xl border border-white/5 hover:border-primary-teal/30 transition-all duration-300 group outline-none focus-visible:ring-2 focus-visible:ring-primary-teal"
            >
                <div className="w-8 h-8 rounded-xl bg-primary-teal/10 flex items-center justify-center text-primary-teal transition-colors group-hover:bg-primary-teal group-hover:text-gray-900 flex-shrink-0">
                    <span className="material-icons-round text-sm">library_books</span>
                </div>
                <div className="text-left overflow-hidden">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1 hidden sm:block">PLAN ACTIVO</p>
                    <p className="text-sm font-bold text-white leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px] xs:max-w-[120px] md:max-w-[150px]">
                        {activeDisplay?.area} — {activeDisplay?.grado}
                    </p>
                </div>
                <span className={cn(
                    "material-icons-round text-gray-500 transition-transform duration-300",
                    isOpen && "rotate-180"
                )} aria-hidden="true">
                    expand_more
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-surface-card border border-white/10 rounded-2xl shadow-2xl p-2 animate-fade-in z-50">
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {planes.map(plan => (
                            <button
                                key={plan.id}
                                onClick={() => {
                                    selectPlan(plan.id);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left transition-colors group outline-none focus-visible:bg-white/5",
                                    planActivo?.id === plan.id && "bg-primary-teal/5 border border-primary-teal/10"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                                    planActivo?.id === plan.id ? "bg-primary-teal text-gray-900" : "bg-gray-700 text-gray-400 group-hover:text-white"
                                )}>
                                    <span className="material-icons-round text-sm">auto_stories</span>
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold text-white truncate">{plan.area}</p>
                                    <p className="text-[10px] text-gray-500">{plan.grado} • {plan.ciclo}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

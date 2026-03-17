import React from 'react';
import { cn } from '@/lib/cn';

interface TabOption {
    value: string;
    label: string;
    icon?: string;
}

interface TabSwitchProps {
    options: TabOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
    variant?: 'teal' | 'magenta';
    size?: 'sm' | 'md';
}

/**
 * TabSwitch - Selector de pestañas accesible y responsivo.
 * En móviles solo muestra el texto de la pestaña activa para ahorrar espacio.
 */
export const TabSwitch: React.FC<TabSwitchProps> = ({
    options,
    value,
    onChange,
    className,
    variant = 'magenta',
    size = 'md'
}) => {
    return (
        <nav 
            role="tablist"
            className={cn(
                "flex p-1 bg-surface-header/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl w-fit max-w-full overflow-x-auto no-scrollbar",
                className
            )}
        >
            {options.map((option) => {
                const isActive = value === option.value;
                return (
                    <button
                        key={option.value}
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`panel-${option.value}`}
                        id={`tab-${option.value}`}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "relative flex items-center justify-center gap-2 transition-all duration-500 ease-premium whitespace-nowrap px-4 sm:px-6 touch-target",
                            size === 'sm' ? "py-1.5 rounded-lg text-[10px]" : "py-2.5 rounded-xl text-[11px]",
                            "font-black uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-brand-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                            isActive
                                ? variant === 'magenta'
                                    ? "bg-brand-magenta text-white shadow-glow-magenta"
                                    : "bg-primary-teal text-gray-900 shadow-glow-teal"
                                : "text-gray-500 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {option.icon && (
                            <span className={cn(
                                "material-icons-round",
                                size === 'sm' ? "text-sm" : "text-base",
                                isActive ? "opacity-100" : "opacity-40"
                            )} aria-hidden="true">
                                {option.icon}
                            </span>
                        )}
                        <span className={cn(
                            "hidden md:block transition-all duration-500",
                            isActive && "block"
                        )}>
                            {option.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};

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

export const TabSwitch: React.FC<TabSwitchProps> = ({
    options,
    value,
    onChange,
    className,
    variant = 'magenta',
    size = 'md'
}) => {
    return (
        <div className={cn(
            "flex p-1 bg-surface-header/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl w-fit",
            className
        )}>
            {options.map((option) => {
                const isActive = value === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "relative flex items-center justify-center gap-2 transition-all duration-500 ease-premium",
                            size === 'sm' ? "py-1.5 px-4 rounded-lg text-[10px]" : "py-2.5 px-6 rounded-xl text-[11px]",
                            "font-black uppercase tracking-widest",
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
                            )}>
                                {option.icon}
                            </span>
                        )}
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};

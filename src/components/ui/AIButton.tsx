import React, { useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * AIButton — Botón estandarizado "Generar con IA"
 * Circular, icon-only, con animación de pulso y tooltip.
 * Uso: <AIButton onClick={handler} isLoading={loading} />
 */

interface AIButtonProps {
    onClick?: () => void;
    isLoading?: boolean;
    tooltip?: string;
    label?: string; // Nuevo: Texto opcional para botones con label
    variant?: 'teal' | 'magenta';
    size?: 'sm' | 'md';
    className?: string;
    disabled?: boolean;
}

export const AIButton: React.FC<AIButtonProps> = ({
    onClick,
    isLoading = false,
    tooltip = 'Generar con IA',
    label,
    variant = 'teal',
    size = 'md',
    className,
    disabled = false,
}) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const sizes = {
        sm: label ? 'px-4 py-2' : 'w-9 h-9',
        md: label ? 'px-6 py-2.5' : 'w-11 h-11',
    };

    const iconSizes = {
        sm: 'text-[18px]',
        md: 'text-[22px]',
    };

    const variants = {
        teal: {
            base: 'bg-primary-teal/10 border-primary-teal/25 text-primary-teal',
            hover: 'hover:bg-primary-teal/20 hover:border-primary-teal/50 hover:shadow-[0_0_20px_rgba(228,23,121,0.3)]',
            pulse: 'hover:animate-ai-pulse-magenta',
        },
        magenta: {
            base: 'bg-brand-magenta/10 border-brand-magenta/25 text-brand-magenta',
            hover: 'hover:bg-brand-magenta/20 hover:border-brand-magenta/50 hover:shadow-[0_0_20px_rgba(224,64,251,0.25)]',
            pulse: 'hover:animate-ai-pulse-magenta',
        },
    };

    const v = variants[variant];

    return (
        <div className="relative inline-flex">
            <button
                onClick={onClick}
                disabled={isLoading || disabled}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                aria-label={label || tooltip}
                className={cn(
                    'relative flex items-center justify-center border transition-all duration-300 gap-2',
                    'active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed',
                    label ? 'rounded-xl' : 'rounded-full',
                    sizes[size],
                    v.base,
                    !isLoading && !disabled && v.hover,
                    !isLoading && !disabled && v.pulse,
                    className
                )}
            >
                {isLoading ? (
                    <span className="material-icons-round animate-spin text-current" style={{ fontSize: 18 }}>
                        sync
                    </span>
                ) : (
                    <span className={cn('material-icons-round', iconSizes[size])}>
                        auto_awesome
                    </span>
                )}
                {label && (
                    <span className="text-xs font-black uppercase tracking-widest">{label}</span>
                )}
            </button>

            {/* Tooltip */}
            {showTooltip && !isLoading && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 border border-white/10 rounded-xl whitespace-nowrap pointer-events-none animate-fade-in z-50">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">{tooltip}</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                </div>
            )}
        </div>
    );
};

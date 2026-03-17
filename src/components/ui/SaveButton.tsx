import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/cn';

/**
 * SaveButton — Botón estandarizado "Guardar"
 * Icon-only con estados animados: idle → saving → saved ✔ → error ❌
 * Uso: <SaveButton onSave={asyncHandler} position="floating" />
 */

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface SaveButtonProps {
    onSave: () => Promise<void>;
    className?: string;
    tooltip?: string;
    position?: 'inline' | 'floating';
    size?: 'sm' | 'md' | 'lg';
}

export const SaveButton: React.FC<SaveButtonProps> = ({
    onSave,
    className,
    tooltip = 'Guardar cambios',
    position = 'inline',
    size = 'md',
}) => {
    const [state, setState] = useState<SaveState>('idle');
    const [showTooltip, setShowTooltip] = useState(false);

    // Auto-reset después de saved/error
    useEffect(() => {
        if (state === 'saved' || state === 'error') {
            const timer = setTimeout(() => setState('idle'), 1800);
            return () => clearTimeout(timer);
        }
    }, [state]);

    const handleClick = useCallback(async () => {
        if (state === 'saving') return;
        setState('saving');
        try {
            await onSave();
            setState('saved');
        } catch (err) {
            console.error('SaveButton error:', err);
            setState('error');
        }
    }, [onSave, state]);

    const sizes = {
        sm: 'w-10 h-10',
        md: 'w-14 h-14',
        lg: 'w-20 h-20',
    };

    const iconSizes = {
        sm: 'text-xl',
        md: 'text-2xl',
        lg: 'text-4xl',
    };

    const stateConfig: Record<SaveState, { icon: string; color: string; animation: string }> = {
        idle: {
            icon: 'save',
            color: 'bg-primary-teal text-white shadow-[0_0_25px_rgba(228,23,121,0.4)]',
            animation: '',
        },
        saving: {
            icon: 'sync',
            color: 'bg-primary-teal/80 text-gray-900',
            animation: '',
        },
        saved: {
            icon: 'check',
            color: 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]',
            animation: 'animate-save-bounce',
        },
        error: {
            icon: 'error_outline',
            color: 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]',
            animation: 'animate-save-shake',
        },
    };

    const cfg = stateConfig[state];

    const positionClasses = position === 'floating'
        ? 'fixed bottom-10 right-10 z-[100]'
        : '';

    return (
        <div className={cn('relative inline-flex', positionClasses)}>
            <button
                onClick={handleClick}
                disabled={state === 'saving'}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                aria-label={tooltip}
                className={cn(
                    'relative flex items-center justify-center rounded-full transition-all duration-300',
                    'hover:scale-110 active:scale-95 disabled:cursor-wait',
                    sizes[size],
                    cfg.color,
                    cfg.animation,
                    className
                )}
            >
                {state === 'saving' ? (
                    <div className={cn(
                        "border-4 border-gray-900/30 border-t-gray-900 rounded-full animate-spin",
                        size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'
                    )} />
                ) : (
                    <span className={cn('material-icons-round', iconSizes[size])}>
                        {cfg.icon}
                    </span>
                )}
            </button>

            {/* Tooltip */}
            {showTooltip && state === 'idle' && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-gray-900 border border-white/10 rounded-xl whitespace-nowrap pointer-events-none animate-fade-in z-50">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">{tooltip}</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                </div>
            )}
        </div>
    );
};

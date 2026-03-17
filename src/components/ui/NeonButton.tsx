import React from 'react';
import { cn } from '@/lib/cn';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'magenta' | 'danger' | 'ghost' | 'teal';
    isLoading?: boolean;
    icon?: string;
    iconPosition?: 'left' | 'right';
    size?: 'sm' | 'md' | 'lg';
}

export const NeonButton: React.FC<NeonButtonProps> = ({
    className,
    children,
    variant = 'primary',
    isLoading,
    icon,
    iconPosition = 'left',
    size = 'md',
    ...props
}) => {
    const sizes = {
        sm: 'px-4 py-2 text-[10px]',
        md: 'px-6 py-3 text-xs',
        lg: 'px-8 py-4 text-sm',
    };
    const variants = {
        primary: 'btn-primary',
        secondary: 'bg-surface-active text-white rounded-2xl hover:bg-surface-active/80',
        magenta: 'btn-magenta',
        danger: 'btn-danger',
        ghost: 'btn-ghost',
        teal: 'bg-primary-teal/10 text-primary-teal border border-primary-teal/30 rounded-2xl hover:bg-primary-teal/20 hover:border-primary-teal/60 font-black uppercase tracking-widest transition-all',
    };

    return (
        <button
            className={cn(
                "relative flex items-center justify-center gap-2 overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant],
                sizes[size],
                isLoading && "text-transparent",
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-icons-round animate-spin text-current">
                        sync
                    </span>
                </div>
            )}

            {icon && iconPosition === 'left' && (
                <span className="material-icons-round text-[20px]">{icon}</span>
            )}

            <span>{children}</span>

            {icon && iconPosition === 'right' && (
                <span className="material-icons-round text-[20px]">{icon}</span>
            )}
        </button>
    );
};

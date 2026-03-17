import React from 'react';
import { cn } from '@/lib/cn';

interface ChipProps {
    label: string;
    onDelete?: () => void;
    onClick?: () => void;
    active?: boolean;
    className?: string;
    variant?: 'teal' | 'magenta' | 'gray';
}

export const Chip: React.FC<ChipProps> = ({
    label,
    onDelete,
    onClick,
    active = false,
    className,
    variant = 'teal'
}) => {
    const variants = {
        teal: active ? 'bg-primary-teal text-gray-900 glow-teal' : 'bg-primary-teal/10 text-primary-teal border-primary-teal/20',
        magenta: active ? 'bg-brand-magenta text-white glow-magenta' : 'bg-brand-magenta/10 text-brand-magenta border-brand-magenta/20',
        gray: active ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 border-gray-700'
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all duration-300",
                onClick && "cursor-pointer active:scale-95",
                variants[variant],
                className
            )}
        >
            <span>{label}</span>
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="hover:text-white transition-colors"
                >
                    <span className="material-icons-round text-[14px]">close</span>
                </button>
            )}
        </div>
    );
};

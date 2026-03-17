import React from 'react';
import { cn } from '@/lib/cn';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
    checked,
    onChange,
    label,
    className
}) => {
    return (
        <label className={cn("flex items-center gap-3 cursor-pointer group", className)}>
            <div className="relative">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                {/* Track */}
                <div className={cn(
                    "w-11 h-6 transition-colors duration-300 rounded-full",
                    checked ? "bg-primary-teal/40" : "bg-gray-700"
                )} />
                {/* Thumb */}
                <div className={cn(
                    "absolute left-1 top-1 w-4 h-4 transition-transform duration-300 rounded-full bg-white shadow-md",
                    checked && "translate-x-5 bg-primary-teal glow-teal"
                )} />
            </div>
            {label && (
                <span className={cn(
                    "text-sm font-medium transition-colors duration-300",
                    checked ? "text-white" : "text-gray-400"
                )}>
                    {label}
                </span>
            )}
        </label>
    );
};

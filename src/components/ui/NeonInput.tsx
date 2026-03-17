import React from 'react';
import { cn } from '@/lib/cn';

interface NeonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: string;
}

export const NeonInput = React.forwardRef<HTMLInputElement, NeonInputProps>(
    ({ className, label, error, icon, ...props }, ref) => {
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label className="text-sm font-medium text-gray-400 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    {icon && (
                        <span className="material-icons-round absolute left-7 top-1/2 -translate-y-1/2 w-8 text-center text-gray-500 group-focus-within:text-primary-teal transition-colors duration-300 pointer-events-none z-10">
                            {icon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            "input-neon",
                            icon ? "!pl-20" : "!px-10",
                            error && "border-red-500/50 focus:ring-red-500/30",
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-xs text-red-400 ml-1 animate-fade-in">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

NeonInput.displayName = 'NeonInput';

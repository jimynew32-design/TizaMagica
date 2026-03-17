import React from 'react';
import { cn } from '@/lib/cn';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    return (
        <div className={cn(
            "relative",
            sizes[size],
            className
        )}>
            <div className="absolute inset-0 border-2 border-primary-teal/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-primary-teal rounded-full border-t-transparent animate-spin" />
            <div className="absolute inset-0 bg-primary-teal/10 rounded-full animate-ping opacity-20" />
        </div>
    );
};

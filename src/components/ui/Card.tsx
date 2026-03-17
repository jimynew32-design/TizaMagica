import React from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'glass' | 'strong' | 'flat';
    hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
    className,
    children,
    variant = 'glass',
    hoverable = false,
    ...props
}) => {
    const variants = {
        glass: 'glass-card',
        strong: 'glass-card-strong',
        flat: 'bg-surface-card border border-white/5 shadow-xl'
    };

    return (
        <div
            className={cn(
                "rounded-[2rem] p-6",
                variants[variant],
                hoverable && "hover-lift",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
    <div className={cn("mb-6 flex items-center justify-between", className)} {...props}>
        {children}
    </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
    <h3 className={cn("text-xl font-black text-white tracking-tight", className)} {...props}>
        {children}
    </h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
    <div className={cn("space-y-4", className)} {...props}>
        {children}
    </div>
);

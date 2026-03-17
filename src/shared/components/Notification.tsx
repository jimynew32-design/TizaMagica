import React from 'react';
import { cn } from '@/lib/cn';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
    type: NotificationType;
    message: string;
    onClose: () => void;
    className?: string;
}

export const Notification: React.FC<NotificationProps> = ({
    type,
    message,
    onClose,
    className
}) => {
    const configs = {
        success: { icon: 'check_circle', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        error: { icon: 'error', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
        info: { icon: 'info', color: 'text-primary-teal', bg: 'bg-primary-teal/10', border: 'border-primary-teal/20' },
        warning: { icon: 'warning', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' }
    };

    const config = configs[type];

    return (
        <div className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl border animate-slide-up",
            config.bg,
            config.border,
            className
        )}>
            <span className={cn("material-icons-round", config.color)}>
                {config.icon}
            </span>
            <p className="text-sm font-medium text-white max-w-[250px]">
                {message}
            </p>
            <button
                onClick={onClose}
                className="ml-2 text-gray-400 hover:text-white transition-colors"
            >
                <span className="material-icons-round text-[18px]">close</span>
            </button>
        </div>
    );
};

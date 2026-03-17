import React, { useEffect } from 'react';
import { useNotificationStore } from '@/store';
import { cn } from '@/lib/cn';

export const NotificationModal: React.FC = () => {
    const { notification, hideNotification } = useNotificationStore();

    useEffect(() => {
        if (notification?.duration && notification.duration > 0) {
            const timer = setTimeout(() => {
                hideNotification();
            }, notification.duration);
            return () => clearTimeout(timer);
        }
    }, [notification, hideNotification]);

    if (!notification) return null;

    const isError = notification.type === 'error';
    const isSuccess = notification.type === 'success';
    const isWarning = notification.type === 'warning';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className={cn(
                    "relative w-full max-w-md overflow-hidden rounded-[2.5rem] border backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-300",
                    isError ? "bg-red-950/20 border-red-500/30 shadow-red-500/10" :
                        isSuccess ? "bg-emerald-950/20 border-emerald-500/30 shadow-emerald-500/10" :
                            isWarning ? "bg-amber-950/20 border-amber-500/30 shadow-amber-500/10" :
                                "bg-slate-900/40 border-white/10 shadow-white/5"
                )}
            >
                {/* Decorative background glow */}
                <div className={cn(
                    "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20",
                    isError ? "bg-red-500" : isSuccess ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-primary-teal"
                )} />

                <div className="relative p-8 flex flex-col items-center text-center">
                    {/* Icon Circle */}
                    <div className={cn(
                        "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-6 shadow-xl border transition-all",
                        isError ? "bg-red-500/10 border-red-500/20 text-red-500" :
                            isSuccess ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                isWarning ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                    "bg-primary-teal/10 border-primary-teal/20 text-primary-teal"
                    )}>
                        <span className="material-icons-round text-3xl sm:text-4xl">
                            {isError ? 'report_problem' : isSuccess ? 'check_circle' : isWarning ? 'warning' : 'info'}
                        </span>
                    </div>

                    <h3 className={cn(
                        "text-xl sm:text-2xl font-black uppercase tracking-tight mb-2",
                        isError ? "text-red-400" : isSuccess ? "text-emerald-400" : isWarning ? "text-amber-400" : "text-white"
                    )}>
                        {notification.title}
                    </h3>

                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-8 font-medium px-2">
                        {notification.message}
                    </p>

                    <button
                        onClick={hideNotification}
                        className={cn(
                            "w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all duration-300 shadow-lg active:scale-95",
                            isError ? "bg-red-500 text-white shadow-red-500/20 hover:bg-red-600" :
                                isSuccess ? "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600" :
                                    isWarning ? "bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600" :
                                        "bg-primary-teal text-gray-900 shadow-primary-teal/20 hover:brightness-110"
                        )}
                    >
                        Entendido
                    </button>
                </div>

                {/* Bottom decorative bar */}
                <div className={cn(
                    "h-1.5 w-full",
                    isError ? "bg-red-500" : isSuccess ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-primary-teal"
                )} />
            </div>
        </div>
    );
};

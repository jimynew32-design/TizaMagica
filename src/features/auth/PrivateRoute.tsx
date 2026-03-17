import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePerfilStore } from '@/store';

export const PrivateRoute: React.FC = () => {
    const { isAuthenticated, perfil, isLoading } = usePerfilStore();
    const location = useLocation();
    const isOnboarded = perfil?.isOnboarded || false;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-primary-teal/20 border-t-primary-teal rounded-full animate-spin"></div>
                <p className="text-gray-500 font-bold uppercase tracking-[0.2em] animate-pulse">Verificando Sesión...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Al usar react-router-dom, location.pathname NO incluye el basename.
    // Esto es mucho más seguro que usar window.location.pathname.
    const isAtOnboarding = location.pathname.includes('/onboarding');

    if (!isOnboarded && !isAtOnboarding) {
        return <Navigate to="/onboarding" replace />;
    }

    return <Outlet />;
};

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = async () => {
        try {
            // Importación dinámica para evitar problemas de dependencia circular si los hubiera
            const { resetDatabase } = await import('@/store/db');
            await resetDatabase();
            localStorage.removeItem('planx-storage');
            window.location.href = '/TizaMagica/';
        } catch (err) {
            console.error('Error durante el reset:', err);
            localStorage.clear();
            window.location.href = '/TizaMagica/';
        }
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mb-8 border border-red-500/30">
                        <span className="material-icons-round text-red-500 text-4xl">warning</span>
                    </div>
                    <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">Vaya, algo ha fallado</h1>
                    <p className="text-gray-400 max-w-md mb-10 leading-relaxed">
                        Parece que hay un error en los datos guardados de tu sesión. No te preocupes, podemos restablecerlo para que vuelvas a entrar.
                    </p>

                    <div className="bg-black/20 p-4 rounded-xl mb-8 border border-white/5 text-left w-full max-w-lg overflow-auto max-h-40">
                        <code className="text-xs text-red-400 font-mono">
                            {this.state.error?.toString()}
                        </code>
                    </div>

                    <button
                        onClick={this.handleReset}
                        className="bg-primary-teal text-gray-900 font-bold px-8 py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(79,209,197,0.4)] transition-all active:scale-95 flex items-center gap-3"
                    >
                        <span className="material-icons-round">refresh</span>
                        REINICIAR SESIÓN Y REINTENTAR
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

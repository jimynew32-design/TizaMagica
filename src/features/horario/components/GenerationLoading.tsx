import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MESSAGES = [
    "Inicializando motor heurístico...",
    "Analizando 15,420 combinaciones posibles...",
    "Validando restricciones de docentes...",
    "Optimizando bloques por especialidad...",
    "Verificando disponibilidad de aulas...",
    "Auditando cumplimiento CNEB...",
    "Eliminando solapamientos de horario...",
    "Balanceando fatiga cognitiva estudiantil...",
    "Generando tablero maestro..."
];

interface GenerationLoadingProps {
    onComplete: () => void;
}

export const GenerationLoading: React.FC<GenerationLoadingProps> = ({ onComplete }) => {
    const [currentMessage, setCurrentMessage] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Intervalo para mensajes
        const msgInterval = setInterval(() => {
            setCurrentMessage(prev => (prev + 1) % MESSAGES.length);
        }, 800);

        // Simulación de progreso
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    clearInterval(msgInterval);
                    setTimeout(onComplete, 500);
                    return 100;
                }
                return prev + 1;
            });
        }, 40); // ~4 segundos total

        return () => {
            clearInterval(msgInterval);
            clearInterval(progressInterval);
        };
    }, [onComplete]);

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full space-y-12 text-center">
                {/* Logo animado */}
                <div className="relative inline-block">
                    <motion.div 
                        animate={{ 
                            rotate: 360,
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                            rotate: { duration: 4, ease: "linear", repeat: Infinity },
                            scale: { duration: 2, repeat: Infinity }
                        }}
                        className="w-24 h-24 rounded-full border-4 border-brand-magenta/10 border-t-brand-magenta flex items-center justify-center shadow-glow-magenta"
                    >
                        <span className="material-icons-round text-brand-magenta text-4xl">auto_awesome</span>
                    </motion.div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-[8px] text-white">Procesando</h2>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={currentMessage}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-[10px] font-black uppercase tracking-[4px] text-brand-magenta h-4"
                        >
                            {MESSAGES[currentMessage]}
                        </motion.p>
                    </AnimatePresence>
                </div>

                {/* Barra de progreso */}
                <div className="space-y-4">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-brand-magenta shadow-glow-magenta"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/20">
                        <span>Motor de IA v4.0</span>
                        <span>{progress}% Completado</span>
                    </div>
                </div>
            </div>

            {/* Fondo decorativo de datos */}
            <div className="absolute inset-0 -z-10 opacity-5 pointer-events-none overflow-hidden select-none">
                <div className="flex flex-wrap gap-4 text-[8px] font-mono leading-none">
                    {Array.from({ length: 1000 }).map((_, i) => (
                        <span key={i}>
                            {Math.random().toString(16).substring(2, 8).toUpperCase()}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

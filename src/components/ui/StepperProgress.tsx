import React from 'react';
import { cn } from '@/lib/cn';

interface StepperProgressProps {
    steps: string[];
    currentStep: number; // 0-indexed
    className?: string;
}

export const StepperProgress: React.FC<StepperProgressProps> = ({
    steps,
    currentStep,
    className
}) => {
    return (
        <div className={cn("w-full flex items-center justify-between", className)}>
            {steps.map((step, index) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                    {/* Circle */}
                    <div className="flex flex-col items-center relative">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                            index < currentStep && "bg-primary-teal border-primary-teal text-gray-900",
                            index === currentStep && "border-primary-teal text-primary-teal glow-teal shadow-[0_0_15px_rgba(79,209,197,0.4)]",
                            index > currentStep && "border-gray-700 text-gray-500 bg-surface-card"
                        )}>
                            {index < currentStep ? (
                                <span className="material-icons-round">check</span>
                            ) : (
                                <span className="text-sm font-bold">{index + 1}</span>
                            )}
                        </div>
                        <span className={cn(
                            "absolute -bottom-7 w-max text-[10px] font-bold tracking-widest uppercase transition-colors duration-300",
                            index <= currentStep ? "text-primary-teal" : "text-gray-500"
                        )}>
                            {step}
                        </span>
                    </div>

                    {/* Connector */}
                    {index < steps.length - 1 && (
                        <div className="flex-1 mx-2 h-[2px] bg-gray-700 relative overflow-hidden">
                            <div
                                className="absolute inset-0 bg-primary-teal transition-all duration-500 ease-in-out"
                                style={{ transform: `scaleX(${index < currentStep ? 1 : 0})`, transformOrigin: 'left' }}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

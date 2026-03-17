import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { NeonInput } from '@/components/ui/NeonInput';
import { NeonButton } from '@/components/ui/NeonButton';
import { TabSwitch } from '@/components/ui/TabSwitch';
import { usePerfilStore } from '@/store';

export const LoginPage: React.FC = () => {
    const [mode, setMode] = useState<'login' | 'solicitar'>('login');
    const [stepSolicitud, setStepSolicitud] = useState<'form' | 'pago' | 'exito'>('form');
    
    // Auth vars
    const [usuario, setUsuario] = useState('');
    const [pin, setPin] = useState('');
    
    // Solicitud vars
    const [nombres, setNombres] = useState('');
    const [institucion, setInstitucion] = useState('');
    const [celular, setCelular] = useState('');
    
    // Pago vars
    const [metodoPago] = useState('Yape');
    const [operacion, setOperacion] = useState('');

    const [loading, setLoading] = useState(false);
    const [validationError, setValidationError] = useState('');
    const { login, solicitarCuenta, notificarPago, error, clearError } = usePerfilStore();
    const navigate = useNavigate();

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setValidationError('');
        
        if (usuario.trim().length < 4) {
            setValidationError('El Usuario debe tener al menos 4 caracteres.');
            return;
        }
        if (pin.length < 6) {
            setValidationError('El PIN de seguridad debe tener al menos 6 dígitos.');
            return;
        }

        setLoading(true);
        const success = await login(usuario.trim().toLowerCase(), pin);
        setLoading(false);

        if (success) {
            navigate('/');
        }
    };

    const handleSolicitudSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setValidationError('');

        if (usuario.trim().length < 4 || !nombres || !institucion) {
            setValidationError('Por favor, completa los campos obligatorios (Usuario, Nombres, Institución).');
            return;
        }

        setLoading(true);
        const success = await solicitarCuenta(usuario, nombres, institucion, celular);
        setLoading(false);

        if (success) {
            setStepSolicitud('pago');
        }
    };

    const handlePagoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setValidationError('');

        setLoading(true);
        const success = await notificarPago(usuario, metodoPago, operacion);
        setLoading(false);

        if (success) {
            setStepSolicitud('exito');
        }
    };

    // Render Formulario de Solicitud
    const renderSolicitudForm = () => (
        <form onSubmit={handleSolicitudSubmit} className="space-y-6 animate-fade-in">
            <div className="p-4 bg-primary-teal/5 border border-primary-teal/10 rounded-2xl mb-4 text-center">
                <p className="text-xs text-primary-teal font-medium">Solicita tu usuario institucional. Usaremos este alias para sincronizar todo tu trabajo.</p>
            </div>
            <NeonInput
                label="Usuario de Acceso (Alias)"
                placeholder="Ej: ana.garcia26"
                icon="person"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value.replace(/\s/g, '').toLowerCase())}
            />
            <NeonInput
                label="Nombres y Apellidos"
                placeholder="Ej: Ana María García"
                icon="badge"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
            />
            <NeonInput
                label="Institución Educativa (Colegio)"
                placeholder="Ej: I.E. 0001 San Juan"
                icon="school"
                value={institucion}
                onChange={(e) => setInstitucion(e.target.value)}
            />
            <NeonInput
                label="WhatsApp / Celular (Opcional)"
                placeholder="Para enviarte las credenciales"
                icon="phone"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
            />
            
            {validationError && (
                <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-center animate-shake">
                    {validationError}
                </p>
            )}
            {error && (
                <p className="text-xs text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center animate-shake">
                    {error}
                </p>
            )}

            <NeonButton className="w-full h-14" type="submit" isLoading={loading}>
                CONTINUAR AL PAGO
            </NeonButton>
        </form>
    );

    // Render Instrucciones de Pago
    const renderPagoForm = () => (
        <form onSubmit={handlePagoSubmit} className="space-y-6 animate-fade-in">
            <div className="p-5 bg-brand-magenta/10 border border-brand-magenta/20 rounded-2xl text-center space-y-2">
                <h3 className="text-white font-black">¡Usuario {usuario} Reservado!</h3>
                <p className="text-xs text-gray-400">Para activar el motor de IA, realiza el pago único a través de Yape:</p>
                <div className="flex justify-center py-2">
                    <span className="px-4 py-2 bg-[#742284] text-white rounded-xl text-sm font-black shadow-lg shadow-purple-500/20">
                        Yape: 930 208 867
                    </span>
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest italic">A nombre de: Jimy Peralta</p>
            </div>

            <div className="space-y-4">
                <div className="p-1 bg-surface-header rounded-xl">
                    <div className="py-2 text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        Confirma tu operación abajo
                    </div>
                </div>

                <NeonInput
                    label="Código de Operación"
                    placeholder="Ej: 002145"
                    icon="receipt"
                    value={operacion}
                    onChange={(e) => setOperacion(e.target.value)}
                />
            </div>

            {error && (
                <p className="text-xs text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center animate-shake">
                    {error}
                </p>
            )}

            <NeonButton className="w-full h-14" type="submit" isLoading={loading}>
                NOTIFICAR PAGO
            </NeonButton>
            
            <button type="button" onClick={() => setStepSolicitud('form')} className="w-full text-xs text-gray-500 hover:text-white uppercase tracking-widest font-bold">
                Volver
            </button>
        </form>
    );

    // Render Éxito
    const renderExito = () => (
        <div className="text-center space-y-6 animate-fade-in py-8">
            <div className="w-20 h-20 bg-primary-teal/20 rounded-full flex items-center justify-center mx-auto text-primary-teal glow-teal">
                <span className="material-icons-round text-5xl">check_circle</span>
            </div>
            <div>
                <h3 className="text-2xl font-black text-white">¡Solicitud Enviada!</h3>
                <p className="text-sm text-gray-400 mt-2 px-4">Estamos revisando tu pago. En breve recibirás tus credenciales de acceso (Usuario y PIN) vía WhatsApp o SMS al número {celular}.</p>
            </div>
            <NeonButton className="w-full h-14" onClick={() => { setMode('login'); setStepSolicitud('form'); setUsuario(''); }}>
                VOLVER AL INICIO
            </NeonButton>
        </div>
    );

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0D0D0D] relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/4 -left-1/4 w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-1/4 w-[50%] h-[50%] bg-primary-teal/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-brand-magenta/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Login Card */}
            <Card variant="strong" className="w-full max-w-md relative z-10 animate-fade-in shadow-2xl shadow-primary-teal/5">
                <CardHeader className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-teal to-blue-500 rounded-2xl flex items-center justify-center glow-teal transform -rotate-6">
                        <span className="material-icons-round text-gray-900 text-3xl">dashboard</span>
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-white tracking-tight">
                            BIENVENIDO A <span className="text-primary-teal">PLANX</span>
                        </h2>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
                            Software de Ingeniería Pedagógica
                        </p>
                    </div>
                </CardHeader>

                <CardContent>
                    {stepSolicitud === 'exito' && mode === 'solicitar' ? (
                        renderExito()
                    ) : (
                        <>
                            <TabSwitch
                                options={[
                                    { value: 'login', label: 'Acceder' },
                                    { value: 'solicitar', label: 'Solicitar Cuenta' }
                                ]}
                                value={mode}
                                onChange={(v) => {
                                    setMode(v as any);
                                    if (v === 'login') setStepSolicitud('form');
                                }}
                                className="mb-8"
                            />

                            {mode === 'login' ? (
                                <form onSubmit={handleLoginSubmit} className="space-y-6 animate-fade-in">
                                    <NeonInput
                                        label="Usuario de Acceso"
                                        placeholder="Ej: ana.garcia26"
                                        icon="person"
                                        value={usuario}
                                        onChange={(e) => setUsuario(e.target.value.replace(/\s/g, ''))}
                                    />

                                    <NeonInput
                                        label="PIN de Seguridad (6 dígitos)"
                                        placeholder="Tu clave secreta de 6 números"
                                        type="password"
                                        icon="lock"
                                        maxLength={6}
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    />

                                    {validationError && (
                                        <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-center animate-shake">
                                            {validationError}
                                        </p>
                                    )}

                                    {error && (
                                        <p className="text-xs text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center animate-shake">
                                            {error}
                                        </p>
                                    )}

                                    <NeonButton className="w-full h-14" type="submit" isLoading={loading}>
                                        INGRESAR AL SISTEMA
                                    </NeonButton>
                                </form>
                            ) : (
                                stepSolicitud === 'form' ? renderSolicitudForm() : renderPagoForm()
                            )}
                        </>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                        <p className="text-[10px] text-gray-700 font-medium">
                            v3.0.Monetization — Powered by Gemini 2.1
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

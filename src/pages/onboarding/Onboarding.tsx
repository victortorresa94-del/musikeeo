import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Speaker, Crown, Check, Loader2 } from 'lucide-react';
// import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import type { UserMode } from '../../types';

const ROLES = [
    {
        id: 'musician',
        title: 'Músico',
        icon: Mic,
        description: 'Busco bolos, bandas o colaboraciones.',
        color: 'text-brand-cyan',
        bg: 'bg-brand-cyan/10'
    },
    {
        id: 'organizer',
        title: 'Creador de Eventos',
        icon: Crown,
        description: 'Organizo bodas, fiestas o gestiono un local.',
        color: 'text-brand-lime',
        bg: 'bg-brand-lime/10'
    },
    {
        id: 'provider',
        title: 'Técnico / Proveedor',
        icon: Speaker,
        description: 'Ofrezco sonido, luces o servicios técnicos.',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10'
    }
];

export const Onboarding = () => {
    const navigate = useNavigate();


    const { user, userProfile, refreshProfile } = useAuth();
    const [step, setStep] = useState(1);
    const [selectedMode, setSelectedMode] = useState<UserMode | null>(null);
    // const [isSubmitting, setIsSubmitting] = useState(false);

    const [error, setError] = useState<string | null>(null);

    // Redirect if already completed (fixes race condition)
    useEffect(() => {
        if (userProfile?.onboardingCompleted) {
            navigateBasedOnRole(userProfile.primaryMode);
        }
    }, [userProfile, navigate]);

    useEffect(() => {
        if (step === 2) {
            handleFinish();
        }
    }, [step]);

    const navigateBasedOnRole = (mode?: UserMode) => {
        if (mode === 'musician') navigate('/panel/perfil');
        else if (mode === 'organizer') navigate('/eventos2'); // Todo panel organization
        else if (mode === 'provider') navigate('/panel/servicios');
        else navigate('/');
    };

    const handleModeSelect = (modeId: string) => {
        setSelectedMode(modeId as UserMode);
        // Small delay for UI animation
        setTimeout(() => setStep(2), 300);
    };

    const handleFinish = async () => {
        if (!user || !selectedMode) return;

        // setIsSubmitting(true);
        setError(null);

        // Safety timeout to prevent infinite loading
        const timeoutPromise = new Promise((_resolve, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 15000)
        );

        try {
            await Promise.race([
                (async () => {
                    // 1. Activate mode
                    await userService.activateMode(user.uid, selectedMode, true);

                    // 2. Mark completed
                    await userService.updateProfile(user.uid, {
                        onboardingCompleted: true
                    });

                    // 3. Refresh context
                    await refreshProfile();
                })(),
                timeoutPromise
            ]);

            // Fallback navigation
            setTimeout(() => {
                navigateBasedOnRole(selectedMode);
            }, 1000);

        } catch (error) {
            console.error("Error finishing onboarding:", error);
            setError("Hubo un error al guardar tu perfil. Por favor, recarga la página.");
            // setIsSubmitting(false); // Stop loop/loader so user sees error
            setStep(1); // Go back to try again
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl text-center mb-12">
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
                        {error}
                    </div>
                )}
                <img src="/logo-musikeeo.png" alt="M" className="h-16 w-auto mx-auto mb-4" />
                <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-4 tracking-tight">
                    ¿Para qué quieres usar Musikeeo?
                </h1>
                <p className="text-xl text-muted-foreground">
                    Selecciona tu perfil principal. Podrás activar otros modos más adelante.
                </p>
            </div>

            <div className="w-full max-w-5xl">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        >
                            {ROLES.map((role) => (
                                <Card
                                    key={role.id}
                                    className={`cursor-pointer hover:-translate-y-2 transition-all duration-300 border-2 bg-surface hover:border-primary/50 group h-full
                                    ${selectedMode === role.id ? 'border-primary ring-2 ring-primary/20 bg-surface-highlight' : 'border-transparent'}`}
                                    onClick={() => handleModeSelect(role.id)}
                                >
                                    <div className="p-8 flex flex-col items-center text-center h-full">
                                        <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-6 bg-surface-highlight group-hover:bg-primary group-hover:text-black transition-colors`}>
                                            <role.icon className="h-10 w-10" />
                                        </div>
                                        <h3 className="font-heading font-bold text-2xl text-white mb-3">{role.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">{role.description}</p>

                                        {selectedMode === role.id && (
                                            <div className="mt-6 text-primary">
                                                <Check className="h-8 w-8 mx-auto" />
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center"
                        >
                            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                            <p className="text-xl text-white font-medium">Configurando tu perfil...</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Onboarding;



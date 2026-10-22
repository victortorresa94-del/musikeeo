import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getArtistByUserId } from '../../services/artistService';
import { X, ArrowRight, Music, Megaphone } from 'lucide-react';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export const OnboardingGuide = () => {
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isVisible, setIsVisible] = useState(false);
    const [step, setStep] = useState<'profile' | 'ad' | 'complete'>('complete');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            // Por defecto, oculto: solo sale para un músico sin ficha pública, una vez cargado su perfil
            setIsVisible(false);
            if (!user || !userProfile) return;

            // Don't show on specific pages (e.g., initial onboarding)
            if (location.pathname === '/onboarding') {
                setIsVisible(false);
                return;
            }

            try {
                // Check Artist Profile Status
                // Only for Musicians for now based on user request context
                if (userProfile.primaryMode === 'musician') {
                    const artist = await getArtistByUserId(user.uid);

                    if (!artist || !artist.isPublic) {
                        setStep('profile');
                        setIsVisible(true);
                    } else {
                        // Profile is published. 
                        // Could check for "First Ad" (Market or Event) but simpler logic for now:
                        // If they are on the "Publish" page, hide this.
                        if (location.pathname.includes('/publicar')) {
                            setIsVisible(false);
                        } else {
                            // Suggest publishing an ad/event? 
                            // User said "publish first ad". 
                            // Let's assume this means "Create Event" or "Create Listing".
                            // For now, let's just mark complete or show "Next Step: Explore"
                            setIsVisible(false);
                        }
                    }
                }
            } catch (error) {
                console.error("Error checking onboarding status", error);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
    }, [user, userProfile, location.pathname]);

    if (!isVisible || loading) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-24 right-6 z-50 w-80 bg-card border border-hairline rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="bg-gradient-to-r from-primary to-primary h-1.5 w-full" />

                    <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-full text-primary-ink">
                                    {step === 'profile' ? <Music className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground text-sm">Siguientes pasos</h4>
                                    <span className="text-xs text-primary-ink font-medium">
                                        {step === 'profile' ? '1 de 2: Tu Identidad' : '2 de 2: Tu Primer Anuncio'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {step === 'profile' && (
                                <div>
                                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                                        Para que te contraten, primero debes publicar tu perfil de músico.
                                    </p>
                                    <Button
                                        onClick={() => navigate('/profile')}
                                        className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary"
                                    >
                                        Ir a mi Perfil <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

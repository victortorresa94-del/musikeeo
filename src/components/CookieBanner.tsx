import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie } from 'lucide-react';
import { useCookieConsent } from '../lib/cookieConsent';

export default function CookieBanner() {
    const { hasDecided, accept, reject } = useCookieConsent();

    return (
        <AnimatePresence>
            {!hasDecided && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                    role="dialog"
                    aria-live="polite"
                    aria-label="Aviso de cookies"
                    className="fixed bottom-3 left-3 right-3 md:bottom-6 md:left-auto md:right-6 md:max-w-md z-[60]"
                >
                    <div className="bg-card border border-border rounded-2xl shadow-2xl p-5 backdrop-blur-md">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Cookie size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-foreground font-bold text-sm leading-snug">Cookies en Musikeeo</p>
                                <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                                    Usamos cookies técnicas necesarias para el funcionamiento del sitio. Con tu permiso,
                                    también usamos cookies de analítica para entender cómo se usa Musikeeo y mejorarlo.
                                    Puedes cambiar tu elección en cualquier momento.{' '}
                                    <Link to="/cookies" className="text-primary hover:underline">Más info</Link>.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={reject}
                                className="flex-1 h-10 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold transition-colors border border-border"
                            >
                                Solo necesarias
                            </button>
                            <button
                                onClick={accept}
                                className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-colors"
                            >
                                Aceptar todas
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

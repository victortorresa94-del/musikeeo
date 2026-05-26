import { useEffect, useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { Mail, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DISMISS_KEY = 'musikeeo-email-banner-dismissed';

export default function EmailVerificationBanner() {
    const { user, loading } = useAuth();
    const [dismissed, setDismissed] = useState(() => {
        try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
    });
    const [resending, setResending] = useState(false);
    const [sent, setSent] = useState(false);

    // Si el usuario verifica desde otra pestaña, ocultamos el banner sin recargar.
    const [verifiedRefresh, setVerifiedRefresh] = useState(0);
    useEffect(() => {
        if (!user) return;
        const id = setInterval(() => user.reload().then(() => setVerifiedRefresh(n => n + 1)).catch(() => {}), 30_000);
        return () => clearInterval(id);
    }, [user]);

    if (loading || !user || user.emailVerified || dismissed) return null;
    // verifiedRefresh sirve solo para forzar re-render tras user.reload()
    void verifiedRefresh;

    const handleResend = async () => {
        if (!user) return;
        setResending(true);
        try {
            await sendEmailVerification(user, { url: `${window.location.origin}/home`, handleCodeInApp: false });
            setSent(true);
            setTimeout(() => setSent(false), 4000);
        } catch (e) {
            console.error('Resend verification failed', e);
        } finally {
            setResending(false);
        }
    };

    const handleDismiss = () => {
        try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
        setDismissed(true);
    };

    return (
        <div className="fixed top-0 inset-x-0 z-[55] bg-primary/10 border-b border-primary/30 backdrop-blur-md">
            <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3 text-sm">
                <Mail size={16} className="text-primary shrink-0" />
                <p className="text-foreground flex-1 leading-snug">
                    {sent ? (
                        <span className="inline-flex items-center gap-1.5 text-primary">
                            <CheckCircle2 size={14} /> Email reenviado. Revisa tu bandeja (y la carpeta de spam).
                        </span>
                    ) : (
                        <>Verifica tu email para acceder a todas las funciones. </>
                    )}
                </p>
                {!sent && (
                    <button
                        onClick={handleResend}
                        disabled={resending}
                        className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-colors disabled:opacity-60"
                    >
                        {resending ? 'Enviando…' : 'Reenviar email'}
                    </button>
                )}
                <button
                    onClick={handleDismiss}
                    aria-label="Cerrar"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

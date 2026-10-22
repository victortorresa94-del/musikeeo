import { useEffect, useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { Mail, X, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DISMISS_KEY = 'musikeeo-email-banner-dismissed';

export default function EmailVerificationBanner() {
    const { user, loading } = useAuth();
    // Cerrado, no vuelve en una semana (antes volvía en cada visita y tapaba las pantallas)
    const [dismissed, setDismissed] = useState(() => {
        try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < 7 * 864e5; } catch { return false; }
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

    // Solo en Mi perfil, que es donde se gestiona la cuenta: en el resto tapaba el contenido
    const { pathname } = useLocation();
    const oculto = pathname !== '/profile';
    if (loading || !user || user.emailVerified || dismissed || oculto) return null;
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
        try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
        setDismissed(true);
    };

    // Tarjeta discreta encima de la barra de pestañas: arriba tapaba la cabecera.
    return (
        <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:inset-x-auto md:right-4 md:top-[4.25rem] md:bottom-auto md:w-[380px] z-[55] rounded-2xl bg-sheet shadow-e2 border border-hairline shadow-e2">
            <div className="pl-4 pr-2 py-2.5 flex items-center gap-3">
                <Mail size={18} className="text-muted-foreground shrink-0" />
                <p className="flex-1 text-[14px] leading-snug text-foreground">
                    {sent ? (
                        <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 size={14} /> Enviado. Mira también en spam.
                        </span>
                    ) : (
                        <>Confirma tu email para proteger tu cuenta.</>
                    )}
                </p>
                {!sent && (
                    <button
                        onClick={handleResend}
                        disabled={resending}
                        className="h-8 px-3 rounded-full bg-foreground text-background text-[13px] font-semibold active:opacity-70 disabled:opacity-60"
                    >
                        {resending ? 'Enviando…' : 'Reenviar'}
                    </button>
                )}
                <button
                    onClick={handleDismiss}
                    aria-label="Cerrar"
                    className="h-8 w-8 flex items-center justify-center text-muted-foreground active:opacity-60"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

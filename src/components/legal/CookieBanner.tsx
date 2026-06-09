import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

const STORAGE_KEY = 'musikeeo-cookies-ack';

export default function CookieBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const ack = window.localStorage.getItem(STORAGE_KEY);
        if (!ack) {
            const t = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(t);
        }
    }, []);

    const dismiss = () => {
        window.localStorage.setItem(STORAGE_KEY, '1');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            role="region"
            aria-label="Aviso de cookies"
            className="fixed bottom-3 left-3 right-3 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-[60] bg-card border border-border rounded-2xl shadow-2xl p-4 text-sm animate-fade-in-up"
        >
            <button
                onClick={dismiss}
                aria-label="Cerrar aviso de cookies"
                className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
                <X size={16} />
            </button>
            <p className="text-foreground font-semibold mb-1">Usamos cookies necesarias</p>
            <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                Solo las imprescindibles para que la app funcione (iniciar sesión). No te trackeamos ni
                vendemos tus datos. <Link to="/cookies" className="text-primary underline">Más info</Link>.
            </p>
            <button
                onClick={dismiss}
                className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-2 hover:brightness-105 transition-colors text-sm"
            >
                Entendido
            </button>
        </div>
    );
}

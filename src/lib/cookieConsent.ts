import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'musikeeo-cookie-consent';
const VERSION = 1; // bump to force re-prompt on policy change

export type ConsentValue = 'granted' | 'denied';

export interface CookieConsent {
    version: number;
    analytics: ConsentValue;
    decidedAt: string; // ISO
}

function read(): CookieConsent | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CookieConsent;
        if (parsed.version !== VERSION) return null;
        return parsed;
    } catch {
        return null;
    }
}

function write(value: CookieConsent) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        // Surface change to any subscriber (e.g. analytics init effect).
        window.dispatchEvent(new CustomEvent('cookie-consent-change', { detail: value }));
    } catch {
        // localStorage unavailable (private mode, quota); silently skip.
    }
}

export function useCookieConsent() {
    const [consent, setConsent] = useState<CookieConsent | null>(() => read());

    useEffect(() => {
        const onChange = () => setConsent(read());
        window.addEventListener('cookie-consent-change', onChange);
        window.addEventListener('storage', onChange);
        return () => {
            window.removeEventListener('cookie-consent-change', onChange);
            window.removeEventListener('storage', onChange);
        };
    }, []);

    const accept = useCallback(() => {
        write({ version: VERSION, analytics: 'granted', decidedAt: new Date().toISOString() });
    }, []);

    const reject = useCallback(() => {
        write({ version: VERSION, analytics: 'denied', decidedAt: new Date().toISOString() });
    }, []);

    const reset = useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch { /* ignore */ }
        setConsent(null);
        window.dispatchEvent(new CustomEvent('cookie-consent-change', { detail: null }));
    }, []);

    return {
        consent,
        hasDecided: consent !== null,
        analyticsGranted: consent?.analytics === 'granted',
        accept,
        reject,
        reset,
    };
}

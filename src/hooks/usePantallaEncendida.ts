import { useEffect } from 'react';

// Que la pantalla no se apague mientras se lee una canción (en el atril, en el bolo)
export function usePantallaEncendida() {
    useEffect(() => {
        let cerrojo: WakeLockSentinel | null = null;
        let vivo = true;
        const pedir = async () => {
            try {
                if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
                const c = await navigator.wakeLock.request('screen');
                if (vivo) cerrojo = c; else void c.release();
            } catch { /* el navegador no deja: no pasa nada */ }
        };
        void pedir();
        const alVolver = () => { if (document.visibilityState === 'visible') void pedir(); };
        document.addEventListener('visibilitychange', alVolver);
        return () => { vivo = false; document.removeEventListener('visibilitychange', alVolver); void cerrojo?.release().catch(() => {}); };
    }, []);
}

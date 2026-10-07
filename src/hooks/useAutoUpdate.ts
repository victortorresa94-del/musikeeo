import { useEffect } from 'react';

// Una PWA en iPhone vuelve de segundo plano sin recargar y se queda con el
// código viejo. Al volver a la app (y cada 5 min) comprobamos si el index.html
// publicado apunta a otro bundle; si es así, recargamos para coger lo último.
export function useAutoUpdate() {
    useEffect(() => {
        if (import.meta.env.DEV) return;
        const current = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]')?.getAttribute('src');
        if (!current) return;

        let checking = false;
        const check = async () => {
            if (checking || document.visibilityState !== 'visible') return;
            checking = true;
            try {
                const res = await fetch(`/index.html?v=${Date.now()}`, { cache: 'no-store' });
                if (res.ok) {
                    const html = await res.text();
                    if (html.includes('/assets/') && !html.includes(current)) window.location.reload();
                }
            } catch { /* sin red: ya lo intentaremos */ }
            checking = false;
        };

        document.addEventListener('visibilitychange', check);
        window.addEventListener('focus', check);
        const t = window.setInterval(check, 5 * 60 * 1000);
        check();
        return () => {
            document.removeEventListener('visibilitychange', check);
            window.removeEventListener('focus', check);
            window.clearInterval(t);
        };
    }, []);
}

import * as Sentry from '@sentry/react';

/**
 * Inicializa Sentry si VITE_SENTRY_DSN está definida.
 * Si no hay DSN, no inicializa nada y la app funciona normal.
 *
 * Para activarlo:
 *   1) Crea un proyecto en https://sentry.io (free tier)
 *   2) Añade VITE_SENTRY_DSN=https://...@sentry.io/... en Vercel env vars
 *   3) Redeploy
 */
export function initSentry() {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (!dsn) return;

    Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        // 10% de transacciones en prod para no inflar la cuota gratuita
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
        // Replays solo en sesiones con error (1) o muestreado bajo
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,
        // No envíes errores de extensiones del navegador ni ResizeObserver chatter
        ignoreErrors: [
            'ResizeObserver loop limit exceeded',
            'ResizeObserver loop completed with undelivered notifications.',
            'Non-Error promise rejection captured',
        ],
        denyUrls: [
            /^chrome-extension:\/\//,
            /^moz-extension:\/\//,
            /^safari-extension:\/\//,
        ],
    });
}

export { Sentry };

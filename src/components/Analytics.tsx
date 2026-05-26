import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { useCookieConsent } from '../lib/cookieConsent';

/**
 * Carga Vercel Analytics solo si el usuario ha aceptado cookies de analítica.
 * Vercel Analytics es cookie-less por diseño, pero gateamos por coherencia
 * con el banner y para máxima seguridad legal.
 */
export default function Analytics() {
    const { analyticsGranted } = useCookieConsent();
    if (!analyticsGranted) return null;
    return <VercelAnalytics />;
}

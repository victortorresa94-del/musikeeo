import LegalPageLayout from './LegalPageLayout';
import { useCookieConsent } from '../../lib/cookieConsent';
import { Button } from '../../components/ui/button';

export default function CookiePolicy() {
    const { reset } = useCookieConsent();

    return (
        <LegalPageLayout title="Política de cookies" updatedAt="2026-05-26">
            <p>
                Este sitio web utiliza cookies y tecnologías similares para garantizar su
                funcionamiento básico y, con tu consentimiento, para analizar el uso del
                servicio y mejorarlo. Esta política te explica qué son las cookies, qué tipos
                usamos y cómo puedes gestionarlas.
            </p>

            <h2>1. ¿Qué son las cookies?</h2>
            <p>
                Una cookie es un pequeño fichero de datos que se descarga en tu dispositivo al
                visitar un sitio web. Permite, entre otras cosas, recordar tus preferencias o
                analizar el uso del sitio. Otras tecnologías similares (almacenamiento local,
                identificadores de dispositivo, etc.) reciben un trato equivalente.
            </p>

            <h2>2. Tipos de cookies que utilizamos</h2>

            <h3>Cookies y almacenamiento técnicos o necesarios</h3>
            <p>
                Imprescindibles para el funcionamiento de la Plataforma. No requieren
                consentimiento. Incluyen, por ejemplo:
            </p>
            <ul>
                <li>Sesión de autenticación de Firebase Auth (mantener tu sesión iniciada).</li>
                <li>Preferencia de tema (modo oscuro).</li>
                <li>Preferencia de consentimiento (esta misma elección).</li>
            </ul>

            <h3>Cookies de analítica (opcionales)</h3>
            <p>
                Nos ayudan a entender cómo se usa la Plataforma de forma agregada y
                anonimizada. Solo se activan si das tu consentimiento. Pueden incluir, si están
                configuradas:
            </p>
            <ul>
                <li>[Vercel Analytics / Google Analytics 4 / Plausible — describe el servicio activo y enlaza a su política].</li>
            </ul>

            <h3>Cookies de terceros</h3>
            <p>
                Algunas funcionalidades pueden cargar recursos de terceros (Firebase, Vercel,
                OpenRouter) que pueden establecer sus propias cookies, conforme a sus
                respectivas políticas.
            </p>

            <h2>3. Gestión del consentimiento</h2>
            <p>
                La primera vez que visitas el Sitio te mostramos un banner para que aceptes,
                rechaces o personalices el uso de cookies opcionales. Puedes cambiar tu
                preferencia en cualquier momento:
            </p>
            <p>
                <Button
                    onClick={reset}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl"
                >
                    Cambiar mis preferencias de cookies
                </Button>
            </p>

            <h2>4. Cómo desactivar cookies en tu navegador</h2>
            <p>
                Además de la gestión desde la Plataforma, puedes configurar tu navegador para
                bloquear o eliminar cookies. Ten en cuenta que algunas funciones podrían dejar
                de operar correctamente.
            </p>
            <ul>
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/es/kb/proteccion-mejorada-contra-rastreo-firefox-escritorio" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
                <li><a href="https://support.microsoft.com/es-es/microsoft-edge" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
            </ul>

            <h2>5. Actualizaciones</h2>
            <p>
                Esta política puede actualizarse para reflejar cambios técnicos o normativos.
                La versión vigente es la publicada en esta página.
            </p>
        </LegalPageLayout>
    );
}

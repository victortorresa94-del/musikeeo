import LegalPageLayout from './LegalPageLayout';

export default function CookiesPolicy() {
    return (
        <LegalPageLayout title="Política de Cookies" lastUpdated="31 de mayo de 2026">
            <p>
                Esta política explica qué cookies y tecnologías similares usa Musikeeo, con qué
                finalidad y qué control tienes sobre ellas. Cumplimos el artículo 22 de la LSSI-CE y el
                RGPD.
            </p>

            <h2>¿Qué es una cookie?</h2>
            <p>
                Una cookie es un pequeño archivo que un sitio web guarda en tu dispositivo para
                recordar información (por ejemplo, que has iniciado sesión).
            </p>

            <h2>Cookies que usamos</h2>
            <p>Solo usamos <strong>cookies técnicas estrictamente necesarias</strong>:</p>
            <ul>
                <li>
                    <strong>Firebase Authentication</strong>: cookies y tokens en almacenamiento local que
                    mantienen tu sesión iniciada. Sin ellas no podrías usar la plataforma. Propietario:
                    Google Ireland Ltd. Duración: hasta que cierres sesión o expire el token.
                </li>
                <li>
                    <strong>Preferencias locales</strong>: almacenamos en tu navegador (localStorage) tu
                    elección de tema (claro/oscuro), aviso de cookies aceptado, y borradores de formularios
                    para no perderlos. No se envían a ningún servidor.
                </li>
            </ul>

            <h2>Cookies que NO usamos</h2>
            <ul>
                <li>Cookies de publicidad o seguimiento publicitario.</li>
                <li>Cookies de redes sociales (los iconos del footer son enlaces, no widgets).</li>
                <li>Cookies de Google Analytics, Facebook Pixel u otras herramientas de tracking.</li>
            </ul>
            <p>
                Si en el futuro incorporamos cookies no necesarias, las activaremos solo con tu
                consentimiento expreso a través de un panel de configuración.
            </p>

            <h2>Métricas anónimas (Vercel Analytics)</h2>
            <p>
                Usamos Vercel Analytics para conocer agregados anónimos sobre el uso de la plataforma
                (páginas más visitadas, dispositivo). <strong>No usa cookies</strong> ni recoge datos
                que permitan identificarte personalmente.
            </p>

            <h2>Cómo gestionar las cookies</h2>
            <p>
                Como solo usamos cookies estrictamente necesarias, no es obligatorio recabar consentimiento
                previo. Si las desactivas en tu navegador, no podrás iniciar sesión ni usar la plataforma.
            </p>
            <p>
                Instrucciones por navegador:
            </p>
            <ul>
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a></li>
                <li><a href="https://support.mozilla.org/es/kb/proteccion-mejorada-rastreo-firefox-ordenador" target="_blank" rel="noopener noreferrer">Firefox</a></li>
                <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
                <li><a href="https://support.microsoft.com/es-es/microsoft-edge" target="_blank" rel="noopener noreferrer">Edge</a></li>
            </ul>

            <h2>Cambios en esta política</h2>
            <p>
                Si modificamos esta política te avisaremos en la app. La fecha de "Última actualización"
                arriba refleja la versión vigente.
            </p>

            <h2>Contacto</h2>
            <p><a href="mailto:legal@musikeeo.com">legal@musikeeo.com</a></p>
        </LegalPageLayout>
    );
}

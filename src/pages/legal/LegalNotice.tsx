import LegalPageLayout from './LegalPageLayout';

export default function LegalNotice() {
    return (
        <LegalPageLayout title="Aviso Legal" lastUpdated="31 de mayo de 2026">
            <p>
                En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la
                Información y de Comercio Electrónico (LSSI-CE), se informa de los siguientes datos
                identificativos del titular de esta web:
            </p>

            <h2>Titular</h2>
            <ul>
                <li><strong>Nombre:</strong> [NOMBRE_COMPLETO]</li>
                <li><strong>NIF:</strong> [NIF]</li>
                <li><strong>Domicilio:</strong> [DOMICILIO]</li>
                <li><strong>Email:</strong> hola@musikeeo.com</li>
                <li><strong>Email legal / privacidad:</strong> legal@musikeeo.com</li>
                <li><strong>Sitio web:</strong> https://musikeeo.com</li>
                <li><strong>Actividad:</strong> Servicios de la sociedad de la información — plataforma online de conexión entre profesionales y aficionados de la música en vivo.</li>
            </ul>

            <h2>Condiciones de uso</h2>
            <p>
                El acceso y uso del sitio implica la aceptación de los <a href="/terminos">Términos y
                Condiciones</a> y de la <a href="/privacidad">Política de Privacidad</a>.
            </p>

            <h2>Propiedad intelectual e industrial</h2>
            <p>
                Todos los contenidos del sitio (textos, fotografías, gráficos, código fuente, diseños,
                marca y nombre comercial "Musikeeo") son propiedad del titular o se utilizan con
                autorización expresa. Queda prohibida su reproducción, distribución o modificación sin
                consentimiento previo y por escrito.
            </p>
            <p>
                Los contenidos publicados por los usuarios (anuncios, fotos, mensajes, eventos) son
                propiedad de los mismos. El titular actúa como prestador de servicios de intermediación.
            </p>

            <h2>Responsabilidad</h2>
            <p>
                El titular no se hace responsable de:
            </p>
            <ul>
                <li>Los contenidos publicados por terceros (usuarios de la plataforma).</li>
                <li>Las transacciones celebradas entre usuarios.</li>
                <li>Interrupciones del servicio por causas ajenas (proveedores de hosting, conectividad, etc.).</li>
                <li>El uso indebido o ilícito que terceros puedan hacer del sitio.</li>
            </ul>

            <h2>Enlaces a terceros</h2>
            <p>
                Esta web puede incluir enlaces a webs de terceros. El titular no se hace responsable de
                sus contenidos ni de sus políticas de privacidad.
            </p>

            <h2>Protección de datos</h2>
            <p>
                El tratamiento de datos personales se rige por nuestra <a href="/privacidad">Política
                de Privacidad</a>, conforme al RGPD y a la LOPDGDD.
            </p>

            <h2>Resolución de litigios en línea (consumidores)</h2>
            <p>
                Conforme al Reglamento (UE) 524/2013, te informamos de que la Comisión Europea dispone
                de una plataforma de resolución de litigios en línea accesible en
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer"> https://ec.europa.eu/consumers/odr</a>.
            </p>

            <h2>Legislación aplicable</h2>
            <p>
                Este aviso legal se rige por la legislación española. Para cualquier controversia derivada
                del uso del sitio web, las partes se someten a los tribunales del domicilio del consumidor
                cuando aplique normativa de consumo; en otro caso, a los tribunales del titular.
            </p>
        </LegalPageLayout>
    );
}

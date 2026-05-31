import LegalPageLayout from './LegalPageLayout';

export default function Terms() {
    return (
        <LegalPageLayout title="Términos y Condiciones de Uso" lastUpdated="31 de mayo de 2026">
            <p>
                Estos Términos rigen el uso de Musikeeo, plataforma disponible en <strong>musikeeo.com</strong>
                que conecta músicos, técnicos de sonido, promotores y tiendas de instrumentos. Al usar la
                plataforma aceptas estos Términos, la <a href="/privacidad">Política de Privacidad</a> y la
                <a href="/cookies"> Política de Cookies</a>.
            </p>

            <h2>1. Quiénes somos</h2>
            <p>
                Titular: [NOMBRE_COMPLETO], NIF [NIF], con domicilio en [DOMICILIO]. Contacto:
                hola@musikeeo.com. Más información en el <a href="/aviso-legal">Aviso Legal</a>.
            </p>

            <h2>2. Quién puede usar Musikeeo</h2>
            <ul>
                <li>Debes tener al menos <strong>14 años</strong>. Si tienes entre 14 y 18, se entiende que tus tutores conocen tu uso.</li>
                <li>Si te registras como empresa, declaras tener capacidad legal para hacerlo.</li>
                <li>No puedes registrarte si has sido suspendido previamente.</li>
            </ul>

            <h2>3. Tu cuenta</h2>
            <ul>
                <li>Usas tu cuenta de Google (Firebase Auth) para iniciar sesión.</li>
                <li>Eres responsable de mantener la confidencialidad de tu cuenta.</li>
                <li>La información que publicas debe ser veraz y actualizada.</li>
                <li>Puedes eliminar tu cuenta en cualquier momento desde Ajustes.</li>
            </ul>

            <h2>4. Contenido publicado por usuarios</h2>
            <p>
                Tú eres el único responsable del contenido que publicas (anuncios, eventos, mensajes,
                multimedia). Al subir contenido nos concedes una licencia limitada, no exclusiva y gratuita
                para mostrarlo dentro de Musikeeo con la finalidad de prestarte el servicio. Conservas la
                titularidad de todos tus derechos.
            </p>
            <h3>Está prohibido publicar:</h3>
            <ul>
                <li>Productos ilegales, falsificados, robados o que infrinjan derechos de terceros.</li>
                <li>Contenido protegido por copyright sin autorización del titular.</li>
                <li>Contenido sexual explícito, violento, ofensivo, discriminatorio o que incite al odio.</li>
                <li>Datos personales de terceros sin su consentimiento.</li>
                <li>Spam, anuncios duplicados, malware, phishing.</li>
                <li>Servicios o productos ajenos a la temática musical/eventos.</li>
            </ul>
            <p>
                Nos reservamos el derecho de revisar y retirar contenido que infrinja estos Términos o la
                legislación aplicable, en un plazo razonable desde su notificación.
            </p>

            <h2>5. Marketplace (compra, alquiler, préstamo)</h2>
            <p>
                Musikeeo facilita el contacto entre usuarios pero <strong>no es parte</strong> de las
                transacciones entre compradores y vendedores. No garantizamos la veracidad, calidad,
                legalidad, ni el resultado de ninguna operación. Te recomendamos:
            </p>
            <ul>
                <li>Verificar la identidad del otro usuario antes de pagar o entregar nada.</li>
                <li>Usar métodos de pago con protección (no pagos por adelantado a desconocidos).</li>
                <li>Revisar el producto en persona cuando sea posible.</li>
            </ul>
            <p>Las disputas se resuelven entre las partes. Si quieres reportar un fraude: legal@musikeeo.com.</p>

            <h2>6. Eventos y bolos</h2>
            <p>
                Los promotores que publican eventos son responsables del pago, condiciones y cumplimiento
                del acuerdo con los músicos. Musikeeo no es agente, intermediario laboral ni asume
                responsabilidades por contratos celebrados entre usuarios.
            </p>

            <h2>7. Rodrigo AI</h2>
            <p>
                Rodrigo es un asistente conversacional basado en IA. Sus respuestas son orientativas y
                pueden contener errores. No tomes decisiones legales, financieras o contractuales
                relevantes basándote únicamente en Rodrigo. Verifica siempre la información importante.
            </p>

            <h2>8. Pagos</h2>
            <p>
                La versión actual (v1) no integra pagos. Toda transacción económica ocurre fuera de la
                plataforma. Cuando habilitemos pagos integrados aplicaremos términos adicionales que serán
                comunicados.
            </p>

            <h2>9. Suspensión y terminación</h2>
            <p>
                Podemos suspender o eliminar tu cuenta si infringes estos Términos, la legislación
                aplicable, o si lo exige una autoridad competente. Te avisaremos siempre que sea posible
                y respetando tus derechos legales.
            </p>

            <h2>10. Limitación de responsabilidad</h2>
            <p>
                Musikeeo se presta "tal cual" y "según disponibilidad". En la máxima medida permitida por
                la ley, no respondemos por: (i) contenido publicado por usuarios; (ii) transacciones entre
                usuarios; (iii) interrupciones del servicio por fallos de proveedores externos (Firebase,
                Vercel, OpenRouter); (iv) decisiones que tomes basándote en información de la plataforma.
            </p>
            <p>Nada en estos Términos limita tus derechos como consumidor según la legislación española y europea aplicable.</p>

            <h2>11. Propiedad intelectual de la plataforma</h2>
            <p>
                La marca, logo, diseño, código y bases de datos de Musikeeo pertenecen al titular. Su uso
                no autorizado fuera del servicio está prohibido.
            </p>

            <h2>12. Modificaciones</h2>
            <p>
                Podemos actualizar estos Términos. Te avisaremos en la app o por email con antelación
                razonable. El uso continuado tras la actualización implica aceptación.
            </p>

            <h2>13. Ley aplicable y jurisdicción</h2>
            <p>
                Estos Términos se rigen por la legislación española. Para cualquier controversia, los
                tribunales competentes serán los del domicilio del consumidor cuando aplique la
                legislación de consumo. En el resto de casos, los del titular.
            </p>

            <h2>14. Reportar contenido</h2>
            <p>
                Si encuentras contenido que infrinja estos Términos, usa el botón "Reportar" en el
                anuncio/perfil/evento o escribe a <a href="mailto:legal@musikeeo.com">legal@musikeeo.com</a>.
                Revisamos todas las denuncias en un plazo razonable.
            </p>
        </LegalPageLayout>
    );
}

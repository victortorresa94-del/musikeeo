import LegalPageLayout from './LegalPageLayout';

export default function TermsOfService() {
    return (
        <LegalPageLayout title="Términos y condiciones de uso" updatedAt="2026-05-26">
            <p>
                Los presentes Términos y condiciones (en adelante, &laquo;los Términos&raquo;)
                regulan el uso de la plataforma Musikeeo, accesible en
                <strong> musikeeo.com</strong> (en adelante, &laquo;la Plataforma&raquo;) y
                propiedad de [TITULAR]. Al registrarte o utilizar la Plataforma aceptas estos
                Términos en su totalidad.
            </p>

            <h2>1. Qué es Musikeeo</h2>
            <p>
                Musikeeo es una plataforma de intermediación que conecta a profesionales del
                sector de la música en vivo: músicos, técnicos de sonido, promotores y salas,
                y tiendas de instrumentos. Permite publicar perfiles, eventos y anuncios de
                compra, alquiler o préstamo de equipo, así como facilitar el contacto entre
                usuarios.
            </p>
            <p>
                <strong>En la versión actual (v1), Musikeeo no procesa pagos ni interviene en
                las transacciones entre usuarios.</strong> Cualquier acuerdo económico se
                produce directamente entre las partes y bajo su responsabilidad.
            </p>

            <h2>2. Registro y cuenta</h2>
            <ul>
                <li>Para usar la mayoría de funciones debes registrarte facilitando un email válido y una contraseña.</li>
                <li>Eres responsable de la veracidad de los datos que aportas y de mantener actualizada tu cuenta.</li>
                <li>Eres responsable de la confidencialidad de tu contraseña. Comunícanos cualquier acceso no autorizado.</li>
                <li>Debes ser mayor de 14 años. Si eres menor de 18, necesitas el consentimiento de tu representante legal.</li>
                <li>No puedes ceder tu cuenta a terceros.</li>
            </ul>

            <h2>3. Uso aceptable</h2>
            <p>Al usar Musikeeo te comprometes a NO:</p>
            <ul>
                <li>Publicar contenido ilícito, ofensivo, discriminatorio, violento o que infrinja derechos de terceros (propiedad intelectual, honor, imagen, datos personales).</li>
                <li>Publicar anuncios fraudulentos, falsos, duplicados o que no se ajusten a la realidad del producto o servicio.</li>
                <li>Usar la Plataforma para enviar spam, estafas o suplantar la identidad de otra persona.</li>
                <li>Realizar ingeniería inversa, scraping masivo o intentar acceder a partes no públicas del sistema.</li>
                <li>Usar bots para automatizar acciones (registros, mensajes, publicaciones) sin autorización.</li>
                <li>Eludir, deshabilitar o interferir con medidas de seguridad o limitaciones del servicio.</li>
            </ul>
            <p>
                Nos reservamos el derecho a moderar, retirar contenidos y suspender o eliminar
                cuentas que incumplan estos Términos, sin perjuicio de las acciones legales que
                puedan corresponder.
            </p>

            <h2>4. Marketplace</h2>
            <p>
                El marketplace permite publicar anuncios de venta, alquiler y préstamo de equipo
                musical. El vendedor/anunciante es el único responsable de la legalidad,
                titularidad, estado y veracidad de la descripción del bien o servicio anunciado.
                Musikeeo no garantiza ni se hace responsable de la calidad de los bienes ni del
                cumplimiento por las partes del acuerdo alcanzado.
            </p>
            <p>
                El contacto entre usuarios se realiza a través de mensajería interna y,
                opcionalmente, WhatsApp si el anunciante lo facilita.
            </p>

            <h2>5. Eventos y solicitudes</h2>
            <p>
                Los organizadores pueden publicar eventos y los profesionales pueden postularse
                a ellos. La aceptación o rechazo de candidaturas y los términos económicos del
                bolo son responsabilidad de las partes.
            </p>

            <h2>6. Asistente IA &laquo;Rodrigo&raquo;</h2>
            <p>
                Rodrigo es un asistente de inteligencia artificial integrado en la Plataforma.
                Sus respuestas se generan automáticamente y pueden contener inexactitudes; no
                deben considerarse asesoramiento profesional, legal, financiero o médico. El
                usuario es responsable de verificar la información recibida antes de actuar.
            </p>

            <h2>7. Propiedad intelectual</h2>
            <p>
                El software, diseño, marcas y contenidos propios de Musikeeo son titularidad
                de [TITULAR] y están protegidos por la legislación vigente. El usuario obtiene
                una licencia limitada, no exclusiva, intransferible y revocable para usar la
                Plataforma conforme a estos Términos.
            </p>
            <p>
                Respecto al contenido subido por el usuario (textos, fotos, vídeos), este
                conserva su titularidad y concede a Musikeeo una licencia gratuita, no
                exclusiva, mundial y por el tiempo necesario para mostrarlo en la Plataforma y
                en sus comunicaciones promocionales relacionadas.
            </p>

            <h2>8. Disponibilidad y modificaciones del servicio</h2>
            <p>
                Trabajamos para que la Plataforma esté disponible 24/7, pero no podemos
                garantizarlo. Podemos suspender, modificar o discontinuar funcionalidades en
                cualquier momento avisando con razonabilidad cuando sea posible.
            </p>

            <h2>9. Limitación de responsabilidad</h2>
            <p>
                En la medida máxima permitida por la ley, [TITULAR] no será responsable de
                daños indirectos, consecuenciales, pérdida de oportunidades, datos o beneficios
                derivados del uso o imposibilidad de uso de la Plataforma, ni de los acuerdos
                alcanzados entre usuarios.
            </p>

            <h2>10. Baja y eliminación de cuenta</h2>
            <p>
                Puedes solicitar la eliminación de tu cuenta en cualquier momento desde la
                configuración de tu perfil o escribiendo a [hola@musikeeo.com]. Conservaremos
                únicamente los datos necesarios para cumplir obligaciones legales.
            </p>

            <h2>11. Modificaciones de los Términos</h2>
            <p>
                Podemos actualizar estos Términos. Te avisaremos con antelación razonable de
                cambios sustanciales. El uso continuado tras la entrada en vigor implica
                aceptación de la nueva versión.
            </p>

            <h2>12. Legislación y jurisdicción</h2>
            <p>
                Estos Términos se rigen por la legislación española. Para cualquier
                controversia, las partes se someten a los Juzgados y Tribunales del domicilio
                del usuario consumidor; en el resto de casos, a los del domicilio del titular.
            </p>
        </LegalPageLayout>
    );
}

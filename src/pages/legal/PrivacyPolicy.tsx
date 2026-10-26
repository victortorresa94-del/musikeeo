import LegalPageLayout from './LegalPageLayout';

export default function PrivacyPolicy() {
    return (
        <LegalPageLayout title="Política de privacidad" updatedAt="2026-10-25">
            <p>
                En Musikeeo nos tomamos en serio tu privacidad. Esta política explica qué
                datos recogemos, con qué finalidad, cuál es la base legal del tratamiento,
                con quién los compartimos y cuáles son tus derechos, conforme al
                Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
            </p>

            <h2>1. Responsable del tratamiento</h2>
            <ul>
                <li><strong>Responsable:</strong> Víctor Torres Arana</li>
                <li><strong>NIF/CIF:</strong> 77124685G</li>
                <li><strong>Domicilio:</strong> Rambla Balmes 27, bajos 4, 08100 Mollet del Vallès (Barcelona), España</li>
                <li><strong>Email de contacto:</strong> hola@musikeeo.com</li>
            </ul>

            <h2>2. Qué datos tratamos</h2>
            <p>Tratamos las siguientes categorías de datos:</p>
            <ul>
                <li><strong>Datos de cuenta:</strong> nombre/usuario, email, contraseña (cifrada por Firebase Auth), rol (músico, técnico, promotor, tienda), ubicación, foto de perfil.</li>
                <li><strong>Datos de perfil profesional:</strong> biografía, géneros, servicios, equipo, disponibilidad, multimedia (fotos y vídeos).</li>
                <li><strong>Contenidos generados por el usuario:</strong> anuncios del marketplace, eventos publicados, mensajes, valoraciones.</li>
                <li><strong>Datos de uso:</strong> registros de actividad, dirección IP, identificadores del dispositivo, páginas visitadas (para seguridad y mejora del servicio).</li>
            </ul>

            <h2>3. Con qué finalidad y base legal</h2>
            <table>
                <thead>
                    <tr><th>Finalidad</th><th>Base legal</th></tr>
                </thead>
                <tbody>
                    <tr><td>Crear y gestionar tu cuenta</td><td>Ejecución del contrato (Art. 6.1.b RGPD)</td></tr>
                    <tr><td>Publicar tu perfil, anuncios o eventos</td><td>Ejecución del contrato</td></tr>
                    <tr><td>Permitir el contacto entre usuarios (mensajes internos)</td><td>Ejecución del contrato</td></tr>
                    <tr><td>Ocultar teléfonos, emails y enlaces de mensajería en el chat hasta que se acepta una propuesta de bolo</td><td>Interés legítimo (Art. 6.1.f): prevenir fraudes y proteger los acuerdos hechos en Musikeeo</td></tr>
                    <tr id="mapa"><td>Mostrarte en el mapa de musikeers cerca, en una zona aproximada (unos 500 m), si lo activas. Solo para mayores de 18 años. «Estoy aquí ahora» caduca solo a las 4 horas; tu posición exacta no sale de tu dispositivo, solo se guarda la zona, y solo la ven quienes tienen cuenta. El fondo del mapa lo sirve CARTO, que ve qué zona del mapa estás mirando</td><td>Consentimiento (Art. 6.1.a RGPD): lo retiras cuando quieras quitándote del mapa, en el propio mapa o en los ajustes</td></tr>
                    <tr><td>Seguridad de la plataforma, prevención de fraude y abusos</td><td>Interés legítimo (Art. 6.1.f)</td></tr>
                    <tr><td>Analítica agregada para mejorar el servicio</td><td>Consentimiento (Art. 6.1.a)</td></tr>
                    <tr><td>Comunicaciones comerciales propias</td><td>Consentimiento</td></tr>
                    <tr><td>Cumplimiento de obligaciones legales</td><td>Obligación legal (Art. 6.1.c)</td></tr>
                </tbody>
            </table>

            <h3 id="chat">Teléfonos y emails en el chat</h3>
            <p>
                En los chats ocultamos teléfonos, emails y enlaces de WhatsApp o Telegram hasta
                que se acepta una propuesta de bolo, para evitar fraudes y que fecha, sitio y
                caché queden por escrito para las dos partes. Lo hace tu propio dispositivo
                antes de enviar el mensaje: lo que se oculta no llega a Musikeeo y no lo
                guardamos. Solo leemos una conversación si uno de los dos la denuncia, y nunca
                la usamos para publicidad ni para entrenar una inteligencia artificial. Puedes
                oponerte a este tratamiento escribiendo a hola@musikeeo.com.
            </p>

            <h2>4. ¿Con quién compartimos tus datos?</h2>
            <p>
                Tus datos pueden compartirse con los siguientes destinatarios o categorías de
                destinatarios (encargados del tratamiento) bajo el correspondiente contrato
                conforme al artículo 28 del RGPD:
            </p>
            <ul>
                <li><strong>Google LLC (Firebase / Google Cloud)</strong> — alojamiento, autenticación, base de datos, almacenamiento de archivos.</li>
                <li><strong>Vercel Inc.</strong> — hosting de la aplicación y funciones serverless.</li>
                <li><strong>Moonshot AI (Kimi)</strong> — proveedor de la inferencia del asistente IA &laquo;Rodrigo&raquo; cuando el usuario lo utiliza.</li>
                <li><strong>Functional Software, Inc. (Sentry)</strong> — registro de errores técnicos de la aplicación, cuando está activado.</li>
            </ul>
            <p>
                Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico
                Europeo. En ese caso, las transferencias internacionales se realizan amparadas
                en Cláusulas Contractuales Tipo aprobadas por la Comisión Europea u otros
                mecanismos de garantía adecuados.
            </p>

            <h2>5. Conservación</h2>
            <p>
                Conservamos tus datos durante el tiempo necesario para prestarte el servicio
                y, una vez te des de baja, durante los plazos legales mínimos exigidos
                (responsabilidades fiscales, prevención de fraude, etc.), tras los cuales se
                eliminarán o anonimizarán.
            </p>

            <h2>6. Tus derechos</h2>
            <p>Puedes ejercer en cualquier momento los siguientes derechos:</p>
            <ul>
                <li>Acceso a tus datos personales.</li>
                <li>Rectificación de datos inexactos o incompletos.</li>
                <li>Supresión (&laquo;derecho al olvido&raquo;).</li>
                <li>Limitación del tratamiento.</li>
                <li>Portabilidad de los datos.</li>
                <li>Oposición al tratamiento.</li>
                <li>Retirar el consentimiento prestado en cualquier momento.</li>
            </ul>
            <p>
                Para ejercerlos, escribe a <strong>hola@musikeeo.com</strong> adjuntando
                copia de un documento que acredite tu identidad. Atenderemos tu solicitud en el
                plazo máximo de un mes.
            </p>
            <p>
                Si consideras que el tratamiento no se ajusta a la normativa, tienes derecho a
                presentar una reclamación ante la <strong>Agencia Española de Protección de
                Datos</strong> (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>).
            </p>

            <h2>7. Menores</h2>
            <p>
                Musikeeo no está dirigido a menores de 14 años. Si eres menor de 18 años,
                necesitarás el consentimiento de tu padre, madre o tutor para usar el servicio.
            </p>

            <h2>8. Seguridad</h2>
            <p>
                Aplicamos medidas técnicas y organizativas apropiadas para proteger tus datos:
                cifrado en tránsito (HTTPS), control de acceso a la base de datos (reglas de
                Firestore y Storage), y revisiones periódicas. Aún así, ningún sistema es
                infalible; si detectas algo extraño, escríbenos a hola@musikeeo.com.
            </p>

            <h2>9. Cambios en esta política</h2>
            <p>
                Podemos actualizar esta política para reflejar cambios legales, técnicos o de
                servicio. La versión vigente es siempre la publicada en esta página, indicando
                la fecha de la última actualización.
            </p>
        </LegalPageLayout>
    );
}

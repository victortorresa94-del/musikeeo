import LegalPageLayout from './LegalPageLayout';

export default function Privacy() {
    return (
        <LegalPageLayout title="Política de Privacidad" lastUpdated="31 de mayo de 2026">
            <p>
                Esta política explica cómo Musikeeo trata tus datos personales cuando usas la plataforma
                disponible en <strong>musikeeo.com</strong>. Cumplimos el Reglamento General de Protección
                de Datos (UE) 2016/679 ("RGPD") y la Ley Orgánica 3/2018 de Protección de Datos y Garantía
                de los Derechos Digitales ("LOPDGDD").
            </p>

            <h2>1. Responsable del tratamiento</h2>
            <ul>
                <li><strong>Titular:</strong> [NOMBRE_COMPLETO]</li>
                <li><strong>NIF:</strong> [NIF]</li>
                <li><strong>Domicilio:</strong> [DOMICILIO]</li>
                <li><strong>Email:</strong> hola@musikeeo.com</li>
                <li><strong>Derechos / privacidad:</strong> legal@musikeeo.com</li>
            </ul>

            <h2>2. Datos que recogemos</h2>
            <ul>
                <li><strong>De registro</strong> (al iniciar sesión con Google): email, nombre, foto de perfil, ID único de Google.</li>
                <li><strong>De perfil</strong> (que tú nos das): ubicación (ciudad), biografía, géneros, instrumento, modo principal, multimedia.</li>
                <li><strong>De uso</strong>: anuncios que publicas, eventos que creas, mensajes que envías, solicitudes a eventos.</li>
                <li><strong>Técnicos</strong>: dirección IP, tipo de navegador, fecha y hora de acceso (vía Vercel para seguridad y métricas agregadas y anónimas).</li>
            </ul>
            <p>No recogemos datos sensibles ni datos de menores de 14 años. Si tienes menos de 14, no uses la plataforma.</p>

            <h2>3. Finalidad y base legal</h2>
            <ul>
                <li><strong>Prestación del servicio</strong> (ejecución del contrato — art. 6.1.b RGPD): autenticación, perfiles públicos, marketplace, mensajería, recomendaciones de Rodrigo AI.</li>
                <li><strong>Seguridad y prevención de fraude</strong> (interés legítimo — art. 6.1.f RGPD): logs, antiabuso.</li>
                <li><strong>Comunicaciones operativas</strong>: avisos sobre tu cuenta, cambios legales.</li>
            </ul>
            <p>No te enviamos publicidad ni mensajes comerciales sin tu consentimiento expreso (que no pedimos en v1).</p>

            <h2>4. Encargados del tratamiento (terceros)</h2>
            <p>Trabajamos con proveedores que tratan datos por nuestra cuenta:</p>
            <ul>
                <li><strong>Google Firebase</strong> (Google Ireland Ltd.): autenticación, base de datos, almacenamiento, hosting de funciones. Servidores en la UE.</li>
                <li><strong>Vercel Inc.</strong>: hosting y métricas agregadas de uso (sin cookies de tracking).</li>
                <li><strong>OpenRouter / Google</strong>: el chatbot Rodrigo envía tus mensajes al modelo de IA. No se almacenan para entrenar modelos.</li>
                <li><strong>Sentry</strong>: captura de errores anonimizados de la aplicación.</li>
            </ul>
            <p>Algunos servicios pueden tratar datos fuera del Espacio Económico Europeo. En tal caso aplicamos las cláusulas tipo de la Comisión Europea (SCC).</p>

            <h2>5. Conservación</h2>
            <p>
                Conservamos tus datos mientras mantengas la cuenta activa. Cuando solicitas el borrado,
                eliminamos tu perfil en menos de 30 días. Algunos datos (mensajes enviados a otros usuarios,
                aplicaciones a eventos) pueden persistir de forma anonimizada por integridad del histórico
                del destinatario o por obligación legal (logs de seguridad: 12 meses).
            </p>

            <h2>6. Tus derechos (ARCO+)</h2>
            <p>Tienes derecho a:</p>
            <ul>
                <li><strong>Acceso</strong>: saber qué datos tenemos y descargarlos (botón "Descargar mis datos" en Ajustes).</li>
                <li><strong>Rectificación</strong>: corregir datos inexactos desde tu perfil.</li>
                <li><strong>Supresión</strong>: borrar tu cuenta (botón "Eliminar cuenta" en Ajustes) o escribiendo a legal@musikeeo.com.</li>
                <li><strong>Oposición y limitación</strong> al tratamiento.</li>
                <li><strong>Portabilidad</strong> de tus datos en formato JSON.</li>
                <li><strong>Reclamar</strong> ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>).</li>
            </ul>

            <h2>7. Cookies</h2>
            <p>
                Usamos exclusivamente cookies estrictamente necesarias para iniciar sesión (Firebase Auth).
                No usamos cookies de seguimiento publicitario ni de terceros. Detalle en la <a href="/cookies">Política de Cookies</a>.
            </p>

            <h2>8. Seguridad</h2>
            <p>
                Aplicamos medidas técnicas y organizativas razonables: cifrado en tránsito (HTTPS), reglas
                de acceso granular en Firestore y Storage, autenticación delegada en Google, monitorización
                de errores. Ningún sistema es 100% seguro: te avisaremos sin demora indebida si detectamos
                una brecha que afecte a tus datos.
            </p>

            <h2>9. Cambios en esta política</h2>
            <p>
                Si modificamos sustancialmente esta política te avisaremos en la app o por email. La fecha
                de "Última actualización" arriba refleja la versión vigente.
            </p>

            <h2>10. Contacto</h2>
            <p>Cualquier duda: <a href="mailto:legal@musikeeo.com">legal@musikeeo.com</a>.</p>
        </LegalPageLayout>
    );
}

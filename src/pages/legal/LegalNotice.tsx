import LegalPageLayout from './LegalPageLayout';

export default function LegalNotice() {
    return (
        <LegalPageLayout title="Aviso legal" updatedAt="2026-05-26">
            <p>
                En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios
                de la Sociedad de la Información y Comercio Electrónico (LSSI-CE), se ponen a
                disposición de los usuarios los siguientes datos del titular del sitio web
                <strong> musikeeo.com</strong> (en adelante, &laquo;el Sitio&raquo;).
            </p>

            <h2>1. Datos del titular</h2>
            <ul>
                <li><strong>Titular:</strong> [TITULAR — nombre y apellidos o razón social]</li>
                <li><strong>NIF/CIF:</strong> [NIF/CIF]</li>
                <li><strong>Domicilio:</strong> [DIRECCIÓN POSTAL COMPLETA, Barcelona, España]</li>
                <li><strong>Correo electrónico:</strong> [hola@musikeeo.com]</li>
                <li><strong>Actividad:</strong> Plataforma de intermediación entre músicos, técnicos de sonido, promotores/salas y tiendas de instrumentos.</li>
            </ul>

            <h2>2. Objeto</h2>
            <p>
                El presente aviso legal regula el acceso, navegación y uso del Sitio. La
                utilización del mismo atribuye la condición de usuario e implica la aceptación
                plena y sin reservas de todas y cada una de las disposiciones aquí incluidas,
                así como de los <a href="/terminos">Términos y condiciones</a> y la
                <a href="/privacidad"> Política de privacidad</a>.
            </p>

            <h2>3. Condiciones de uso</h2>
            <p>
                El usuario se compromete a utilizar el Sitio de conformidad con la ley, el
                presente aviso, los términos y condiciones particulares y demás avisos,
                reglamentos de uso e instrucciones puestos en su conocimiento, así como la
                moral, las buenas costumbres y el orden público.
            </p>
            <p>
                El usuario se obliga a no utilizar el Sitio con fines o efectos ilícitos,
                contrarios a lo establecido en este aviso, lesivos de derechos e intereses
                de terceros, o que de cualquier forma puedan dañar, inutilizar, sobrecargar
                o deteriorar el Sitio o impedir su normal utilización.
            </p>

            <h2>4. Propiedad intelectual e industrial</h2>
            <p>
                Todos los contenidos del Sitio (textos, fotografías, gráficos, imágenes,
                iconos, tecnología, software, así como su diseño gráfico y códigos fuente),
                constituyen una obra cuya propiedad pertenece a [TITULAR], sin que puedan
                entenderse cedidos al usuario ninguno de los derechos de explotación sobre
                los mismos más allá de lo estrictamente necesario para el correcto uso del Sitio.
            </p>
            <p>
                Las marcas, nombres comerciales o signos distintivos son titularidad de
                [TITULAR] o terceros, sin que pueda entenderse que el acceso al Sitio atribuya
                derecho alguno sobre las citadas marcas, nombres comerciales o signos
                distintivos.
            </p>

            <h2>5. Contenido publicado por usuarios</h2>
            <p>
                El Sitio actúa como prestador de servicios de la sociedad de la información de
                conformidad con la LSSI-CE. [TITULAR] no es responsable de los contenidos que los
                usuarios publiquen (anuncios del marketplace, perfiles, mensajes, etc.). El
                usuario es el único responsable de la veracidad, legalidad y respeto de
                derechos de terceros de los contenidos que aporte.
            </p>
            <p>
                Si un usuario detecta contenidos ilícitos o que infrinjan derechos, puede
                comunicarlo al correo <strong>[abuso@musikeeo.com]</strong> y se procederá a su
                revisión y eventual retirada.
            </p>

            <h2>6. Exclusión de responsabilidad</h2>
            <p>
                [TITULAR] no garantiza la disponibilidad y continuidad del funcionamiento del
                Sitio. Cuando ello sea razonablemente posible se advertirá previamente de las
                interrupciones. No se responsabiliza tampoco de los daños y perjuicios de
                cualquier tipo derivados del uso del Sitio por parte del usuario.
            </p>
            <p>
                En la versión actual del servicio (v1), Musikeeo facilita el contacto entre
                usuarios pero <strong>no actúa como pasarela de pago ni interviene en las
                transacciones</strong> que estos puedan acordar. Cualquier acuerdo económico se
                produce directamente entre las partes y bajo su entera responsabilidad.
            </p>

            <h2>7. Legislación aplicable y jurisdicción</h2>
            <p>
                El presente aviso legal se rige por la legislación española. Para la resolución
                de cualquier controversia, las partes se someten a los Juzgados y Tribunales
                del domicilio del titular, salvo que la legislación aplicable disponga otra cosa.
            </p>

            <h2>8. Modificaciones</h2>
            <p>
                [TITULAR] se reserva el derecho a modificar el presente aviso legal en
                cualquier momento. La versión vigente será la publicada en el Sitio.
            </p>
        </LegalPageLayout>
    );
}

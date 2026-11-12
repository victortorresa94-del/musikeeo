import { useState } from 'react';
import LegalPageLayout from './LegalPageLayout';

const CORREO = 'hola@musikeeo.com';

// Canal para avisar de contenido que infringe derechos (art. 16 del Reglamento de Servicios
// Digitales, DSA). Sin servidor: el formulario prepara el correo con todo lo que hace falta
export default function AvisosDerechos() {
    const [d, setD] = useState({ nombre: '', email: '', calidad: '', obra: '', donde: '', motivo: '', buenaFe: false });
    const poner = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setD(x => ({ ...x, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
    const listo = d.nombre.trim() && /\S+@\S+\.\S+/.test(d.email) && d.obra.trim() && d.donde.trim() && d.motivo.trim() && d.buenaFe;
    const cuerpo = [
        'Aviso de contenido que infringe derechos (art. 16 DSA)', '',
        `Nombre: ${d.nombre}`, `Correo: ${d.email}`, `Actúo como: ${d.calidad || '—'}`, '',
        `Obra o derecho afectado: ${d.obra}`, '',
        `Dónde está (enlace exacto o descripción): ${d.donde}`, '',
        `Por qué es ilícito: ${d.motivo}`, '',
        'Declaro de buena fe que la información y las alegaciones de este aviso son exactas y completas.',
    ].join('\n');
    const enlace = `mailto:${CORREO}?subject=${encodeURIComponent('Aviso de derechos · Musikeeo')}&body=${encodeURIComponent(cuerpo)}`;
    const campo = 'w-full rounded-xl bg-fill px-3 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10';

    return (
        <LegalPageLayout title="Avisos de derechos" updatedAt="2026-11-12">
            <p>
                Si crees que algo guardado o compartido en Musikeeo infringe tus derechos (por ejemplo, la letra o el
                cifrado de una canción de la que eres autor, editor o representante) o es ilícito por otro motivo,
                avísanos aquí. No hace falta tener cuenta.
            </p>

            <h2>Qué hacemos con tu aviso</h2>
            <ul>
                <li>Lo revisamos con diligencia y, si el contenido es ilícito, lo <strong>retiramos o bloqueamos</strong> en cuanto lo sepamos (art. 16 de la LSSI y art. 6 del Reglamento (UE) 2022/2065, DSA).</li>
                <li>Te confirmamos que lo hemos recibido y te decimos qué hemos decidido y por qué.</li>
                <li>Si retiramos contenido de una persona usuaria, se lo explicamos de forma motivada y puede reclamar (art. 17 DSA).</li>
                <li>Los cancioneros son privados: Musikeeo no revisa, no publica ni ofrece letras. Las guarda cada persona en su cuenta o en su dispositivo.</li>
            </ul>

            <h2>Envíanos el aviso</h2>
            <p>Rellena los datos y pulsa «Preparar el correo»: se abrirá tu correo con todo listo para enviar a <strong>{CORREO}</strong>. También puedes escribir directamente a esa dirección.</p>
            <form className="not-prose mt-4 space-y-3" onSubmit={e => { e.preventDefault(); if (listo) window.location.href = enlace; }}>
                <input className={campo} placeholder="Tu nombre o el de la entidad" aria-label="Nombre" value={d.nombre} onChange={poner('nombre')} required />
                <input className={campo} placeholder="Tu correo" type="email" aria-label="Correo" value={d.email} onChange={poner('email')} required />
                <select className={campo} aria-label="Actúas como" value={d.calidad} onChange={poner('calidad')}>
                    <option value="">Actúo como… (opcional)</option>
                    <option>Autor o autora</option>
                    <option>Editorial o titular de derechos</option>
                    <option>Representante (entidad de gestión, abogado…)</option>
                    <option>Otra persona</option>
                </select>
                <textarea className={campo} rows={2} placeholder="Qué obra o derecho se infringe (título, autor…)" aria-label="Obra o derecho" value={d.obra} onChange={poner('obra')} required />
                <textarea className={campo} rows={2} placeholder="Dónde está: el enlace exacto (por ejemplo, un enlace /grupo#…) o cómo encontrarlo" aria-label="Dónde está" value={d.donde} onChange={poner('donde')} required />
                <textarea className={campo} rows={3} placeholder="Por qué crees que es ilícito" aria-label="Por qué es ilícito" value={d.motivo} onChange={poner('motivo')} required />
                <label className="flex items-start gap-2 text-[14px] text-foreground">
                    <input type="checkbox" checked={d.buenaFe} onChange={poner('buenaFe')} className="mt-1 h-4 w-4 accent-[hsl(var(--foreground))]" />
                    Declaro de buena fe que la información y las alegaciones de este aviso son exactas y completas.
                </label>
                <button type="submit" disabled={!listo}
                    className="pulsable h-[52px] w-full md:w-auto md:px-8 rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] disabled:opacity-40">
                    Preparar el correo
                </button>
            </form>

            <h2>Punto de contacto</h2>
            <p>
                Para autoridades, personas usuarias y titulares de derechos: <strong>{CORREO}</strong>, en español o en inglés.
                Responsable: Víctor Torres Arana (ver <a href="/aviso-legal">Aviso legal</a>).
            </p>
        </LegalPageLayout>
    );
}

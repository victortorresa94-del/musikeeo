import type { PropuestaBolo } from '../types';
import { taparContacto } from './fuga';

// Textos de una propuesta de bolo del chat (sin React)
export const fechaLarga = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
export const euros = (n: number) => `${n.toLocaleString('es-ES')} €`;

/** «Propuesta de bolo · sáb 31 oct · La Fragua · 600 €»: lo que sale en la lista de chats */
export function resumenPropuesta(p: PropuestaBolo): string {
    return `Propuesta de bolo · ${fechaLarga(p.fecha)} · ${p.sitio} · ${euros(p.cache)}`;
}

/** La propuesta con teléfonos y emails tapados en sitio, duración y notas (antes de aceptarse) */
export function taparPropuesta(p: PropuestaBolo): PropuestaBolo {
    const t = (v: string) => taparContacto(v).texto;
    const out: PropuestaBolo = { ...p, sitio: t(p.sitio) };
    if (p.duracion) out.duracion = t(p.duracion);
    if (p.notas) out.notas = t(p.notas);
    return out;
}

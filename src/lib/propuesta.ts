import type { PropuestaBolo } from '../types';

// Textos de una propuesta de bolo del chat (sin React)
export const fechaLarga = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
export const euros = (n: number) => `${n.toLocaleString('es-ES')} €`;

/** «Propuesta de bolo · sáb 31 oct · La Fragua · 600 €»: lo que sale en la lista de chats */
export function resumenPropuesta(p: PropuestaBolo): string {
    return `Propuesta de bolo · ${fechaLarga(p.fecha)} · ${p.sitio} · ${euros(p.cache)}`;
}

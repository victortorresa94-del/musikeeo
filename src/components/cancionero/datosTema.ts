import { cn } from '../../lib/utils';
import { minutos } from '../../lib/cantar';
import type { TemaCompartido } from '../../lib/compartir';
import { estiloBloque, pastelCanta } from './estilo';

// Las píldoras de un tema del set: tono, capo, quién canta, estilo, tempo y duración
export function datosTema(t: TemaCompartido) {
    const piezas: { texto: string; clase: string }[] = [];
    if (t.p) piezas.push({ texto: t.p, clase: 'bg-fill-strong text-foreground' });
    if (t.c) { const p = pastelCanta(t.c); piezas.push({ texto: `Canta ${t.c}`, clase: cn(p.fondo, p.tinta) }); }
    if (t.e && t.e.toLowerCase() !== t.g?.toLowerCase()) { const p = estiloBloque(t.e).pastel; piezas.push({ texto: t.e, clase: cn(p.fondo, p.tinta) }); }
    if (t.b) piezas.push({ texto: `${t.b} bpm`, clase: 'bg-fill-strong text-foreground' });
    if (t.d) piezas.push({ texto: minutos(t.d), clase: 'bg-fill-strong text-foreground' });
    return piezas;
}

// Con el tono delante (en la lista del grupo y en las fichas)
export function datosTemaConTono(t: TemaCompartido) {
    return [...(t.k ? [{ texto: `Tono ${t.k}`, clase: 'bg-foreground text-background' }] : []), ...datosTema(t)];
}

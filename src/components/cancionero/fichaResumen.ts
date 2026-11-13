// Lo que se ve de cada bloque del formulario de la canción cuando está plegado, y la clase de sus
// campos (sin componentes: lo usan EditorFicha y EditarCancion)
import { nombreEnergia, nombreEstado } from '../../lib/biblioteca';
import { minutos } from '../../lib/cantar';
import type { FichaCancion } from '../../types/cancionero';

export const claseCampo = 'w-full h-11 rounded-xl bg-fill px-3 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10';

export function resumenMusica(f: FichaCancion, bpm?: number, duracion?: number): string {
    return [f.tono && `Tono ${f.tono}${f.tonoAlt ? ` · también ${f.tonoAlt}` : ''}`, f.capo, bpm && `${bpm} bpm`, duracion && minutos(duracion)].filter(Boolean).join(' · ');
}
export function resumenBolo(f: FichaCancion): string {
    return [
        f.canta && `Canta ${f.canta}`, (f.proyectos ?? []).join(', '), f.estilo,
        f.energia ? nombreEnergia(f.energia) : '', f.estado && f.estado !== 'lista' ? nombreEstado(f.estado) : '', (f.etiquetas ?? []).join(', '),
    ].filter(Boolean).join(' · ');
}
export const resumenEnlace = (f: FichaCancion) => {
    try { return f.enlace ? new URL(f.enlace).hostname.replace(/^www\./, '') : ''; } catch { return f.enlace ?? ''; }
};

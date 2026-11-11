// «Acordes rápidos»: escribir la progresión de cada parte sin pegar la canción entera.
// «G F Am C», «g,f,am,c», «G - F - Am - C x2» → «G - F - Am - C x2», que el motor ya lee como
// acordes (se transporta con el tono). Sin React.
import { leerAcorde } from './acordes';

export const PARTES = ['Intro', 'Estrofa', 'Pre-coro', 'Estribillo', 'Puente', 'Solo', 'Final'] as const;

export interface Progresion { linea: string; malos: string[] }

// La línea limpia y los trozos que no son acordes (para avisar antes de añadirla)
export function leerProgresion(entrada: string): Progresion {
    let resto = entrada.trim();
    // «x2», «(x4)», «×3» al final: veces que se repite
    const veces = /\s*\(?\s*[x×]\s*(\d{1,2})\s*\)?\s*$/i.exec(resto);
    if (veces) resto = resto.slice(0, veces.index);
    const trozos = resto.split(/[\s,;|–—-]+/).filter(Boolean);   // la barra no: E7/G#
    const malos: string[] = [];
    const acordes = trozos.map(t => {
        // En el móvil sale en minúscula: «am» → «Am», «f#m» → «F#m»
        const c = t.charAt(0).toUpperCase() + t.slice(1);
        if (!leerAcorde(c)) malos.push(t);
        return c;
    });
    const linea = acordes.join(' - ') + (veces ? ` x${veces[1]}` : '');
    return { linea: acordes.length ? linea : '', malos };
}

// Añade la parte al final del texto de la canción, con su título entre corchetes
export function anadirParte(texto: string, parte: string, linea: string): string {
    const base = texto.replace(/\s+$/, '');
    return `${base ? `${base}\n\n` : ''}[${parte}]\n${linea}\n`;
}

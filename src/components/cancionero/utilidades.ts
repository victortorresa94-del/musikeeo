import { detectarTono, leerCancion, nombreTono, usaBemoles } from '../../lib/acordes';
import type { Cancion } from '../../types/cancionero';

export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// El tono en que suena como la dejaste (con el cambio de tono aplicado)
export function tonoDe(c: Cancion) {
    const leida = leerCancion(c.texto);
    const tono = detectarTono(leida.acordes);
    if (!tono) return null;
    const suena = (leida.meta.cejilla ?? 0) + c.ajustes.semitonos;
    const latino = c.ajustes.notacion === 'latina'
        || (c.ajustes.notacion === 'original' && leida.acordes.filter(a => a.latina).length > leida.acordes.length / 2);
    return nombreTono(tono, suena, latino ? 'latina' : 'americana', usaBemoles(tono, suena, c.ajustes.alteraciones));
}

// Pantalla completa de verdad, si el navegador deja (hay que pedirla al pulsar un botón)
export function pedirPantallaCompleta() {
    document.documentElement.requestFullscreen?.().catch(() => {});
}

// Hoy, en la hora de aquí (AAAA-MM-DD)
export const hoy = () => new Date().toLocaleDateString('sv-SE');

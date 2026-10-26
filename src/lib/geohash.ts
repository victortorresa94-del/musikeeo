// Geohash a mano (sin React ni Firebase): la Tierra partida en celdas con nombre. Con 6 letras
// cada celda mide unos 1,2 × 0,6 km (en Barcelona, ~0,9 × 0,6 km). Es lo único de la posición
// que sale del móvil en el mapa de musikeers. Las celdas que empiezan igual están juntas, así
// que una zona del mapa se pide a Firestore como rangos de texto (guía de Firebase de consultas
// geográficas con geohash).

const ALFABETO = '0123456789bcdefghjkmnpqrstuvwxyz';

/** Letras con las que se guarda la zona en el mapa */
export const PRECISION_MAPA = 6;

export interface Caja { sur: number; oeste: number; norte: number; este: number }

const recorta = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Celda de `precision` letras que contiene el punto */
export function codificar(lat: number, lng: number, precision = PRECISION_MAPA): string {
    let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;
    lat = recorta(lat, -90, 90);
    lng = recorta(lng, -180, 180);
    let hash = '', bit = 0, valor = 0, esLng = true;
    while (hash.length < precision) {
        if (esLng) {
            const medio = (lngMin + lngMax) / 2;
            if (lng >= medio) { valor = valor * 2 + 1; lngMin = medio; } else { valor *= 2; lngMax = medio; }
        } else {
            const medio = (latMin + latMax) / 2;
            if (lat >= medio) { valor = valor * 2 + 1; latMin = medio; } else { valor *= 2; latMax = medio; }
        }
        esLng = !esLng;
        if (++bit === 5) { hash += ALFABETO[valor]; bit = 0; valor = 0; }
    }
    return hash;
}

export const esGeohash = (h: unknown): h is string =>
    typeof h === 'string' && h.length > 0 && h.length <= 12 && [...h].every(c => ALFABETO.includes(c));

/** Los bordes de la celda */
export function caja(hash: string): Caja {
    let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180, esLng = true;
    for (const c of hash) {
        const v = ALFABETO.indexOf(c);
        if (v < 0) throw new Error(`Geohash no válido: ${hash}`);
        for (let b = 4; b >= 0; b--) {
            const uno = (v >> b) & 1;
            if (esLng) {
                const medio = (lngMin + lngMax) / 2;
                if (uno) lngMin = medio; else lngMax = medio;
            } else {
                const medio = (latMin + latMax) / 2;
                if (uno) latMin = medio; else latMax = medio;
            }
            esLng = !esLng;
        }
    }
    return { sur: latMin, oeste: lngMin, norte: latMax, este: lngMax };
}

export function centro(hash: string): { lat: number; lng: number } {
    const c = caja(hash);
    return { lat: (c.sur + c.norte) / 2, lng: (c.oeste + c.este) / 2 };
}

/** Alto y ancho (en grados) de una celda de `precision` letras */
export function tamanoCelda(precision: number): { lat: number; lng: number } {
    const bits = precision * 5;
    return { lat: 180 / 2 ** Math.floor(bits / 2), lng: 360 / 2 ** Math.ceil(bits / 2) };
}

/** Todas las celdas de `precision` letras que tocan la caja */
export function celdasQueCubren(c: Caja, precision: number, maximo = 64): string[] {
    const t = tamanoCelda(precision);
    const sur = recorta(c.sur, -90, 90), norte = recorta(c.norte, -90, 90);
    const oeste = recorta(c.oeste, -180, 180), este = recorta(c.este, -180, 180);
    // Alineado a la cuadrícula: una fila y una columna por celda, sin saltarse ninguna
    const fila0 = Math.floor((sur + 90) / t.lat), fila1 = Math.floor((Math.min(norte, 90 - 1e-9) + 90) / t.lat);
    const col0 = Math.floor((oeste + 180) / t.lng), col1 = Math.floor((Math.min(este, 180 - 1e-9) + 180) / t.lng);
    if ((fila1 - fila0 + 1) * (col1 - col0 + 1) > maximo) return [];
    const fuera: string[] = [];
    for (let f = fila0; f <= fila1; f++) {
        for (let k = col0; k <= col1; k++) {
            fuera.push(codificar(-90 + (f + 0.5) * t.lat, -180 + (k + 0.5) * t.lng, precision));
        }
    }
    return [...new Set(fuera)];
}

/**
 * Prefijos para pedir lo que se ve en el mapa: la precisión más fina (hasta 6) con la que
 * bastan `maximo` consultas. Cada prefijo es un rango [p, p + '~'] sobre el campo geohash.
 */
export function prefijosParaVista(c: Caja, maximo = 8): string[] {
    for (let p = PRECISION_MAPA; p >= 1; p--) {
        const celdas = celdasQueCubren(c, p, maximo);
        if (celdas.length) return celdas.sort();
    }
    return [''];
}

/** Fin del rango de un prefijo: «~» va detrás de todas las letras del geohash */
export const finDeRango = (prefijo: string) => `${prefijo}~`;

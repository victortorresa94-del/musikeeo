// Que la canción suene y la hoja baje con ella (13-nov, Víctor, con una captura de GuitarTuna: «que se
// reproduzcan y vaya con los acordes bajando»). Sin React: de qué vídeo es un enlace de YouTube y en
// qué línea va la canción en cada segundo.
//
// La hoja se reparte en el tiempo entre la intro y el final; cada vez que se toca la línea que está
// sonando se fija un punto (línea, segundo) y entre puntos se reparte igual. Con dos o tres toques
// la canción queda clavada, y se guarda en ella (ajustes.marcas).

export interface Marca { l: number; t: number }   // línea (en el orden de la hoja) y segundo

// El id del vídeo: youtu.be/ID, youtube.com/watch?v=ID, /shorts/ID, /embed/ID, /live/ID,
// music.youtube.com…, o el id suelto (11 caracteres)
export function idDeYouTube(texto: string): string | null {
    const t = texto.trim();
    if (/^[\w-]{11}$/.test(t)) return t;
    try {
        const u = new URL(t.startsWith('http') ? t : `https://${t}`);
        const host = u.hostname.replace(/^(www|m|music)\./, '');
        if (host === 'youtu.be') return /^[\w-]{11}/.exec(u.pathname.slice(1))?.[0] ?? null;
        if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
            const v = u.searchParams.get('v');
            if (v && /^[\w-]{11}$/.test(v)) return v;
            return /^\/(?:shorts|embed|live|v)\/([\w-]{11})/.exec(u.pathname)?.[1] ?? null;
        }
    } catch { /* no es un enlace */ }
    return null;
}

// Los puntos de la canción, en orden y sin contradecirse: línea 0 al acabar la intro, la última unos
// segundos antes del final, y las marcas que se hayan puesto en medio
function puntos(n: number, duracion: number, marcas: Marca[], intro: number): Marca[] {
    const fin = Math.max(intro + 1, duracion - 6);
    const dentro = [...marcas].filter(m => m.l >= 0 && m.l < n && m.t > 0 && m.t < duracion).sort((a, b) => a.t - b.t);
    const lista: Marca[] = [{ l: 0, t: Math.min(intro, fin - 1) }];
    for (const m of dentro) {
        const antes = lista[lista.length - 1];
        if (m.t > antes.t && m.l > antes.l) lista.push(m);
    }
    const ultima = lista[lista.length - 1];
    if (ultima.l < n - 1) lista.push({ l: n - 1, t: Math.max(fin, ultima.t + 1) });
    return lista;
}

// En qué línea va (con decimales: 3,5 = a medio camino entre la 3 y la 4)
export function lineaEnTiempo(t: number, n: number, duracion: number, marcas: Marca[], intro = 0): number {
    if (n <= 1 || !duracion) return 0;
    const p = puntos(n, duracion, marcas, intro);
    if (t <= p[0].t) return 0;
    for (let i = 1; i < p.length; i++) {
        if (t <= p[i].t) {
            const a = p[i - 1], b = p[i];
            return a.l + ((t - a.t) / (b.t - a.t)) * (b.l - a.l);
        }
    }
    return n - 1;
}

// Una marca nueva: quita las que están a menos de 2 s o en la misma línea, y las que ya no casan con
// ella (una línea anterior más tarde, o una posterior antes)
export function conMarca(marcas: Marca[], nueva: Marca): Marca[] {
    const quedan = marcas.filter(m => Math.abs(m.t - nueva.t) >= 2 && m.l !== nueva.l
        && ((m.t < nueva.t && m.l < nueva.l) || (m.t > nueva.t && m.l > nueva.l)));
    return [...quedan, { l: nueva.l, t: Math.round(nueva.t * 10) / 10 }].sort((a, b) => a.t - b.t).slice(-60);
}

export const buscarEnYouTube = (titulo: string, artista: string) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent([titulo, artista].filter(Boolean).join(' '))}`;

export const minSeg = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

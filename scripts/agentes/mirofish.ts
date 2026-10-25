// De los agentes que genera MiroFish (perfiles de OASIS: reddit_profiles.json o
// twitter_profiles.csv, en backend/uploads/simulations/<id>/) a personas del simulador
// del Feed. MiroFish inventa a la gente leyendo la semilla (semilla-musikeeo.md); aquí se
// les pone a mirar el Feed de Musikeeo.

import { readFileSync } from 'node:fs';
import { estilosDe, norm, type Rol } from '../../src/lib/recomendador.ts';
import type { Persona } from './personas.ts';

interface PerfilOasis {
    user_id?: number;
    username?: string;
    name?: string;
    bio?: string;
    persona?: string;
    profession?: string;
    interested_topics?: string[] | string;
    mbti?: string;
    country?: string;
}

const CIUDADES = ['barcelona', 'madrid', 'valencia', 'sevilla', 'girona', 'tarragona', 'bilbao', 'malaga', 'zaragoza', 'palma', 'lleida', 'sabadell', 'badalona'];

// CSV sencillo con comillas (el de Twitter de OASIS)
function leerCsv(texto: string): PerfilOasis[] {
    const filas: string[][] = [];
    let campo = '', fila: string[] = [], dentro = false;
    for (let i = 0; i < texto.length; i++) {
        const c = texto[i];
        if (dentro) {
            if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
            else if (c === '"') dentro = false;
            else campo += c;
        } else if (c === '"') dentro = true;
        else if (c === ',') { fila.push(campo); campo = ''; }
        else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; }
        else if (c !== '\r') campo += c;
    }
    if (campo || fila.length) { fila.push(campo); filas.push(fila); }
    const [cabecera, ...resto] = filas;
    return resto.filter(f => f.length > 1).map(f => Object.fromEntries(cabecera.map((k, i) => [k, f[i]])) as PerfilOasis);
}

function rolDe(texto: string): Rol {
    if (/(tecnic|sonido|ingenier|luthier|tienda|backline|alquiler de equipo|sound engineer|shop|store)/.test(texto)) return 'provider';
    if (/(sala|promot|programad|organiz|wedding|bodas|planner|venue|club|festival|ayuntamiento|hotel|restaurante)/.test(texto)) return 'organizer';
    return 'musician';
}

const TIPOS_POR_ROL: Record<Rol, Persona['tipos']> = {
    musician: { bolo: 1, post: 0.6, anuncio: 0.5, artista: 0.4 },
    organizer: { artista: 1, post: 0.7, bolo: 0.1, anuncio: 0.1 },
    provider: { anuncio: 1, bolo: 0.8, post: 0.3, artista: 0.2 },
};

/** Lee el fichero de perfiles de MiroFish y devuelve las personas que tienen algo de música */
export function personasDeMiroFish(ruta: string): Persona[] {
    const crudo = readFileSync(ruta, 'utf8');
    const perfiles: PerfilOasis[] = ruta.endsWith('.csv') ? leerCsv(crudo) : JSON.parse(crudo);
    const out: Persona[] = [];
    for (const p of perfiles) {
        const temas = Array.isArray(p.interested_topics) ? p.interested_topics.join(' ') : (p.interested_topics || '');
        const texto = norm([p.bio, p.persona, p.profession, temas].filter(Boolean).join(' '));
        const estilos = estilosDe(texto);
        if (!estilos.length) continue;  // sin nada de música, no mira Musikeeo
        const rol = rolDe(texto);
        const extrovertido = (p.mbti || '').toUpperCase().startsWith('E');
        out.push({
            id: `mirofish-${p.user_id ?? out.length}`,
            nombre: p.name || p.username || `Agente ${out.length + 1}`,
            descripcion: (p.bio || p.persona || '').slice(0, 160),
            rol,
            ciudad: CIUDADES.find(c => texto.includes(c)) || 'barcelona',
            declarado: estilos.slice(0, 1),
            gustoReal: Object.fromEntries(estilos.map((e, i) => [e, Math.max(0.4, 1 - i * 0.15)])),
            tipos: TIPOS_POR_ROL[rol],
            local: 0.6,
            generosidad: extrovertido ? 0.7 : 0.5,
            charla: extrovertido ? 0.5 : 0.2,
        });
    }
    return out;
}

// El algoritmo del Feed «Para ti». Sin React ni Firebase: recibe lo que hay y los gustos
// de la persona y devuelve el orden. Así se prueba solo (scripts/simular-feed.ts) con
// personas simuladas, sin tocar datos reales.
//
// Cómo decide, en una frase: cada cosa del feed tiene rasgos (quién la sube, qué estilo,
// qué ciudad, qué tipo, qué formato); cada gesto de la persona (me gusta, comentar, ver un
// vídeo entero, abrir un perfil, saltarse un vídeo) suma o resta a esos rasgos; y al pintar
// el feed se puntúa cada cosa por lo que encaja con esos gustos, lo reciente, lo que gusta
// a la comunidad y un poco de descubrimiento, sin repetir autor ni estilo seguidos.

import type { Artist, Event, Listing, Post } from '../types';

export type TipoItem = 'post' | 'artista' | 'bolo' | 'anuncio';
export type Rol = 'musician' | 'organizer' | 'provider';

/** Lo que el algoritmo sabe de una cosa del feed */
export interface Rasgos {
    clave: string;              // 'post_<id>', 'artista_<id>', 'bolo_<id>', 'anuncio_<id>'
    tipo: TipoItem;
    autor?: string;             // uid de quien lo sube
    estilos: string[];          // estilos, instrumentos y ocasiones, normalizados
    ciudad?: string;            // normalizada
    categoria?: string;         // tipo de bolo o categoría del Mercado
    formato?: 'video' | 'foto' | 'ficha';
    fecha: number;              // ms: cuándo se subió (en un bolo, cuándo es)
    likes: number;
    comentarios: number;
}

/** Los gestos que se apuntan */
export type Senal =
    | 'me_gusta' | 'quitar_me_gusta' | 'comentar'
    | 'abrir'        // abrir un vídeo, un bolo o un anuncio
    | 'ver_entero'   // un vídeo visto al menos un 60 %
    | 'saltar'       // un vídeo dejado antes de 1,5 s
    | 'perfil'       // tocar «Ver perfil»
    | 'impresion';   // la tarjeta estuvo a la vista (no cambia gustos: cuenta como «visto»)

/** Los gustos aprendidos de una persona. Se guardan en el móvil y, con cuenta, en Firestore */
export interface Gustos {
    v: 1;
    /** rasgo → peso. Prefijos: a: autor · e: estilo · c: ciudad · t: tipo · f: formato · k: categoría */
    pesos: Record<string, number>;
    /** clave → [veces vista sin hacer nada, última vez en ms] */
    vistos: Record<string, [number, number]>;
    /** clave → última vez que hizo algo positivo con ella (ms) */
    hechos: Record<string, number>;
    /** última actualización (ms) */
    t: number;
}

/** Lo que la persona dice de sí misma en su perfil */
export interface Declarado {
    uid?: string;
    rol?: Rol;
    estilos?: string[];
    ciudad?: string;
}

export const DIA = 86_400_000;
const VIDA_MEDIA = 21 * DIA;        // a las tres semanas, un gusto pesa la mitad
const TOPE_PESO = 10;
const MAX_PESOS = 300;
const MAX_VISTOS = 400;

const VALOR: Record<Senal, number> = {
    me_gusta: 3, quitar_me_gusta: -3, comentar: 4,
    abrir: 1.5, ver_entero: 2, saltar: -0.7, perfil: 2,
    // Verlo y no hacer nada también dice algo: resta un poco a su estilo y a su autor
    impresion: -0.4,
};

// Cuánto se lleva cada rasgo del gesto
const REPARTO = { a: 1, e: 0.6, c: 0.3, t: 0.4, f: 0.3, k: 0.5 } as const;
type Prefijo = keyof typeof REPARTO;
// Los rasgos genéricos (tipo y formato) casi todo el mundo los toca: con tope bajo, para
// que «es un vídeo» no acabe pesando más que «es rumba» (lo destapó la simulación)
const TOPE: Record<Prefijo, number> = { a: TOPE_PESO, e: TOPE_PESO, c: 6, t: 3, f: 3, k: 6 };
// La impresión sin gesto solo toca lo concreto
const TOCA_IMPRESION = new Set<Prefijo>(['a', 'e']);

// Al puntuar, cada familia de rasgos cuenta por separado y con su propio techo (tanh):
// así ninguna satura la suma y se sigue distinguiendo un estilo de otro
const COEF: Record<Prefijo, number> = { e: 0.5, a: 0.3, c: 0.15, t: 0.2, f: 0.1, k: 0.25 };
const ESCALA: Record<Prefijo, number> = { e: 3, a: 3, c: 2, t: 2, f: 2, k: 3 };

// Lo que suele buscar cada rol antes de haber hecho nada
const POR_ROL: Record<Rol, Partial<Record<TipoItem, number>>> = {
    musician: { bolo: 1.2, anuncio: 0.6, post: 0.3, artista: 0.2 },
    organizer: { artista: 1.2, post: 0.6, anuncio: 0.1, bolo: -0.4 },
    provider: { bolo: 0.9, anuncio: 0.9, post: 0.3, artista: 0.2 },
};

// ─── Normalizar texto en estilos ─────────────────────────────────────────────

export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

// Palabra que aparece → estilo. Por prefijo de palabra («rumbera» casa con «rumba»), salvo las
// marcadas con «=», que tienen que ser la palabra entera («rap» no es «rápido», «pa» no es «para»)
const VOCABULARIO: [string, string][] = [
    ['rumba', 'rumba'], ['flamenc', 'flamenco'], ['sevillan', 'flamenco'], ['buleria', 'flamenco'],
    ['=pop', 'pop'], ['popero', 'pop'], ['rock', 'rock'], ['indie', 'indie'], ['punk', 'punk'], ['heavy', 'metal'],
    ['jazz', 'jazz'], ['swing', 'jazz'], ['bossa', 'bossa'], ['blues', 'blues'], ['soul', 'soul'],
    ['funk', 'funk'], ['gospel', 'gospel'], ['=coro', 'coro'], ['=coros', 'coro'], ['=r&b', 'rnb'], ['=rnb', 'rnb'],
    ['regga', 'reggaeton'], ['perreo', 'reggaeton'], ['=urbano', 'urbano'], ['=urbana', 'urbano'], ['=trap', 'urbano'],
    ['hiphop', 'hiphop'], ['=hip', 'hiphop'], ['=rap', 'hiphop'], ['rapero', 'hiphop'], ['latin', 'latino'],
    ['salsa', 'salsa'], ['bachata', 'bachata'], ['cumbia', 'cumbia'], ['merengue', 'latino'], ['tropical', 'latino'],
    ['electroni', 'electronica'], ['=electro', 'electronica'], ['house', 'electronica'], ['techno', 'electronica'],
    ['=disco', 'disco'], ['discoteca', 'dj'], ['=dj', 'dj'], ['=djs', 'dj'], ['folk', 'folk'], ['cantautor', 'cantautor'],
    ['acust', 'acustico'], ['unplugged', 'acustico'], ['clasica', 'clasica'], ['cuarteto', 'clasica'],
    ['orquesta', 'orquesta'], ['versiones', 'versiones'], ['tributo', 'versiones'], ['catalan', 'catalana'],
    ['habaner', 'habaneras'],
    ['boda', 'bodas'], ['ceremonia', 'bodas'], ['novios', 'bodas'], ['corporativ', 'eventos'],
    ['guitarr', 'guitarra'], ['=bajo', 'bajo'], ['=bajos', 'bajo'], ['bajista', 'bajo'], ['bater', 'bateria'],
    ['cajon', 'percusion'], ['percus', 'percusion'], ['piano', 'teclados'], ['teclad', 'teclados'], ['sintetiz', 'teclados'],
    ['violin', 'violin'], ['cello', 'violin'], ['saxo', 'viento'], ['trompet', 'viento'], ['=viento', 'viento'],
    ['=voz', 'voz'], ['=voces', 'voz'], ['cantante', 'voz'],
    ['tecnico', 'sonido'], ['=sonido', 'sonido'], ['=pa', 'sonido'], ['altavo', 'sonido'], ['microf', 'sonido'],
    ['=luces', 'iluminacion'], ['ilumina', 'iluminacion'], ['grabaci', 'grabacion'],
];

/** Los estilos que se reconocen en un texto (sin repetir) */
export function estilosDe(...textos: (string | undefined | null)[]): string[] {
    const palabras = norm(textos.filter(Boolean).join(' ')).split(/[^a-z0-9ñ&]+/).filter(Boolean);
    const out = new Set<string>();
    for (const w of palabras) {
        for (const [patron, estilo] of VOCABULARIO) {
            const exacta = patron.startsWith('=');
            if (exacta ? w === patron.slice(1) : w.startsWith(patron)) out.add(estilo);
        }
    }
    return [...out];
}

/** «Barcelona, España» → «barcelona» */
export const ciudadDe = (s?: string) => {
    const c = norm((s || '').split(',')[0]);
    return c === 'bcn' ? 'barcelona' : c || undefined;
};

// ─── Gustos: crear, aprender y olvidar ───────────────────────────────────────

export const gustosVacios = (t = 0): Gustos => ({ v: 1, pesos: {}, vistos: {}, hechos: {}, t });

/** Los rasgos de una cosa como claves de peso */
export function rasgosComoClaves(r: Rasgos): [string, number][] {
    const out: [string, number][] = [];
    if (r.autor) out.push([`a:${r.autor}`, REPARTO.a]);
    // Con muchos estilos, cada uno se lleva menos (no vale más por enumerar)
    const porEstilo = r.estilos.length ? REPARTO.e / Math.sqrt(r.estilos.length) : 0;
    for (const e of r.estilos) out.push([`e:${e}`, porEstilo]);
    if (r.ciudad) out.push([`c:${r.ciudad}`, REPARTO.c]);
    out.push([`t:${r.tipo}`, REPARTO.t]);
    if (r.formato) out.push([`f:${r.formato}`, REPARTO.f]);
    if (r.categoria) out.push([`k:${r.categoria}`, REPARTO.k]);
    return out;
}

/** Lo aprendido se va olvidando: a las tres semanas pesa la mitad */
function olvidar(g: Gustos, ahora: number): Gustos {
    if (!g.t || ahora <= g.t) return { ...g, t: g.t || ahora };
    const f = Math.pow(0.5, (ahora - g.t) / VIDA_MEDIA);
    const pesos: Record<string, number> = {};
    for (const [k, w] of Object.entries(g.pesos)) {
        const n = w * f;
        if (Math.abs(n) >= 0.05) pesos[k] = n;
    }
    return { ...g, pesos, t: ahora };
}

function recortar<T>(obj: Record<string, T>, max: number, valor: (x: T) => number): Record<string, T> {
    const e = Object.entries(obj);
    if (e.length <= max) return obj;
    return Object.fromEntries(e.sort((a, b) => valor(b[1]) - valor(a[1])).slice(0, max));
}

/** Apunta un gesto y devuelve los gustos nuevos (no modifica los de entrada) */
export function aprender(g: Gustos, r: Rasgos, senal: Senal, ahora: number): Gustos {
    let n = olvidar(g, ahora);
    // Volver a ver entero o a abrir lo mismo otro día dice poco nuevo: cuenta un tercio.
    // Sin esto, un vídeo popular que sale cada día arrastra todos sus estilos al máximo.
    const antes = n.hechos[r.clave];
    const repetido = senal !== 'impresion' && antes && ahora - antes > 10 * 60_000 ? 0.35 : 1;
    const valor = VALOR[senal] * repetido;
    const pesos = { ...n.pesos };
    for (const [k, parte] of rasgosComoClaves(r)) {
        const p = k[0] as Prefijo;
        if (senal === 'impresion' && !TOCA_IMPRESION.has(p)) continue;
        const w0 = pesos[k] || 0;
        const d = valor * parte;
        // Rendimientos decrecientes: cuanto más cerca del tope, menos sube (bajar cuesta lo mismo)
        const w = d * w0 > 0 ? w0 + d * (1 - Math.abs(w0) / TOPE[p]) : w0 + d;
        pesos[k] = Math.max(-TOPE[p], Math.min(TOPE[p], w));
    }
    n = { ...n, pesos: recortar(pesos, MAX_PESOS, Math.abs) };
    if (senal === 'impresion') {
        const [veces] = n.vistos[r.clave] || [0, 0];
        const vistos = recortar({ ...n.vistos, [r.clave]: [veces + 1, ahora] as [number, number] }, MAX_VISTOS, x => x[1]);
        return { ...n, vistos };
    }
    if (valor > 0) {
        // Hacer algo con ella borra el «vista sin hacer nada»
        const vistos = { ...n.vistos };
        delete vistos[r.clave];
        n = { ...n, vistos, hechos: recortar({ ...n.hechos, [r.clave]: ahora }, MAX_VISTOS, x => x) };
    } else if (senal === 'quitar_me_gusta') {
        const hechos = { ...n.hechos };
        delete hechos[r.clave];
        n = { ...n, hechos };
    }
    return n;
}

/** Junta los gustos del móvil con los de la cuenta: gana cada peso del más reciente */
export function juntar(a: Gustos, b: Gustos): Gustos {
    const [viejo, nuevo] = a.t <= b.t ? [a, b] : [b, a];
    return {
        v: 1,
        pesos: recortar({ ...viejo.pesos, ...nuevo.pesos }, MAX_PESOS, Math.abs),
        vistos: recortar({ ...viejo.vistos, ...nuevo.vistos }, MAX_VISTOS, x => x[1]),
        hechos: recortar({ ...viejo.hechos, ...nuevo.hechos }, MAX_VISTOS, x => x),
        t: nuevo.t,
    };
}

/** Comprueba lo que llega de fuera (localStorage o Firestore) */
export function gustosValidos(x: unknown): Gustos | null {
    const g = x as Gustos;
    if (!g || g.v !== 1 || typeof g.pesos !== 'object' || typeof g.vistos !== 'object' || typeof g.hechos !== 'object') return null;
    return { v: 1, pesos: g.pesos || {}, vistos: g.vistos || {}, hechos: g.hechos || {}, t: Number(g.t) || 0 };
}

// ─── Puntuar ─────────────────────────────────────────────────────────────────

/** Número estable en [0, 1) para una cadena: el «descubrimiento» cambia cada día, no cada recarga */
function azar(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 100000) / 100000;
}

export interface Puntuado {
    rasgos: Rasgos;
    puntos: number;
    /** El rasgo que más ha pesado a favor, para explicar «por qué lo ves» */
    motivo?: string;
}

/** Pesos que pone el perfil declarado (no se guardan: se suman al puntuar) */
function pesosDeclarados(d: Declarado): Record<string, number> {
    const p: Record<string, number> = {};
    for (const e of d.estilos || []) for (const x of estilosDe(e)) p[`e:${x}`] = (p[`e:${x}`] || 0) + 1.5;
    const c = ciudadDe(d.ciudad);
    if (c) p[`c:${c}`] = 1.2;
    for (const [tipo, w] of Object.entries(d.rol ? POR_ROL[d.rol] : {})) p[`t:${tipo}`] = w as number;
    return p;
}

export function puntuar(items: Rasgos[], g: Gustos, d: Declarado, ahora: number): Puntuado[] {
    const decl = pesosDeclarados(d);
    const dia = Math.floor(ahora / DIA);
    // El gusto más fuerte de cada familia, para la escala relativa
    const maximo: Partial<Record<Prefijo, number>> = {};
    for (const k of new Set([...Object.keys(g.pesos), ...Object.keys(decl)])) {
        const p = k[0] as Prefijo;
        maximo[p] = Math.max(maximo[p] || 0, Math.abs((g.pesos[k] || 0) + (decl[k] || 0)));
    }
    return items.map(r => {
        // 1. Afinidad: lo que encaja con sus gustos (aprendidos + declarados), familia a familia
        const peso = (k: string) => (g.pesos[k] || 0) + (decl[k] || 0);
        const porEstilo = r.estilos.map(e => [`e:${e}`, peso(`e:${e}`)] as const);
        const mejorEstilo = porEstilo.reduce<readonly [string, number] | undefined>((m, x) => (!m || x[1] > m[1] ? x : m), undefined);
        const familias: [Prefijo, string | undefined, number][] = [
            // Un estilo que le encanta pesa más que la media (un dúo de rumba y salsa le sirve al rumbero)
            ['e', mejorEstilo?.[0], porEstilo.length ? 0.7 * (mejorEstilo?.[1] || 0) + 0.3 * porEstilo.reduce((a, x) => a + x[1], 0) / porEstilo.length : 0],
            ['a', r.autor && `a:${r.autor}`, r.autor ? peso(`a:${r.autor}`) : 0],
            ['c', r.ciudad && `c:${r.ciudad}`, r.ciudad ? peso(`c:${r.ciudad}`) : 0],
            ['t', `t:${r.tipo}`, peso(`t:${r.tipo}`)],
            ['f', r.formato && `f:${r.formato}`, r.formato ? peso(`f:${r.formato}`) : 0],
            ['k', r.categoria && `k:${r.categoria}`, r.categoria ? peso(`k:${r.categoria}`) : 0],
        ];
        let afinidad = 0;
        let mejor: [string, number] | undefined;
        for (const [p, k, w] of familias) {
            // Escala relativa: si ya hay gustos fuertes, se compara con ellos y no con un número fijo
            const aporte = COEF[p] * Math.tanh(w / Math.max(ESCALA[p], 0.5 * (maximo[p] || 0)));
            afinidad += aporte;
            if (k && aporte > 0.02 && (!mejor || aporte > mejor[1])) mejor = [k, aporte];
        }

        // 2. Frescura: lo nuevo primero; en un bolo, lo que está cerca en el calendario
        const dias = (r.tipo === 'bolo' ? r.fecha - ahora : ahora - r.fecha) / DIA;
        const frescura = r.tipo === 'bolo'
            ? (dias < -1 ? 0 : 1 / (1 + Math.max(0, dias) / 10))
            : Math.pow(0.5, Math.max(0, dias) / 7);

        // 3. Lo que gusta a la comunidad, sin que diez me gusta lo tapen todo
        const interes = r.likes + 2 * r.comentarios;
        const comunidad = interes / (interes + 10);

        // 4. Un poco de descubrimiento, distinto cada día y para cada persona
        const descubrir = azar(`${r.clave}|${d.uid || 'invitado'}|${dia}`) * 0.12;

        // 5. Cansancio: lo que ya ha visto varias veces sin hacer nada baja
        const [veces = 0] = g.vistos[r.clave] || [];
        const cansancio = 0.12 * Math.min(veces, 5);
        const hecho = g.hechos[r.clave];
        const yaHecho = hecho && ahora - hecho < 3 * DIA ? 0.3 : 0;

        // 6. Lo propio, abajo (salvo lo recién subido, que se quiere ver arriba)
        let propio = 0;
        if (d.uid && r.autor === d.uid) propio = r.tipo === 'post' && ahora - r.fecha < 15 * 60_000 ? 3 : -0.8;

        const puntos = afinidad + 0.35 * frescura + 0.25 * comunidad + descubrir - cansancio - yaHecho + propio;
        return { rasgos: r, puntos, motivo: mejor?.[0] };
    });
}

/**
 * Ordena con variedad: de mejor a peor, pero sin el mismo autor dos veces seguidas
 * ni tres cosas del mismo estilo en fila (si hay alternativa razonable).
 */
export function ordenarConVariedad(lista: Puntuado[]): Puntuado[] {
    const quedan = [...lista].sort((a, b) => b.puntos - a.puntos);
    const out: Puntuado[] = [];
    while (quedan.length) {
        let elegido = 0;
        let mejor = -Infinity;
        // Basta mirar los primeros: más allá, el castigo no compensa la diferencia de puntos
        for (let i = 0; i < Math.min(quedan.length, 12); i++) {
            const c = quedan[i].rasgos;
            let p = quedan[i].puntos;
            const ult = out.slice(-3).map(x => x.rasgos);
            if (c.autor && ult.slice(-2).some(u => u.autor === c.autor)) p -= 0.6;
            const estilo = c.estilos[0];
            if (estilo && ult.length >= 2 && ult.slice(-2).every(u => u.estilos[0] === estilo)) p -= 0.2;
            if (p > mejor) { mejor = p; elegido = i; }
        }
        out.push(quedan.splice(elegido, 1)[0]);
    }
    return out;
}

/** Atajo: puntúa y ordena con variedad */
export function recomendar(items: Rasgos[], g: Gustos, d: Declarado, ahora: number): Puntuado[] {
    return ordenarConVariedad(puntuar(items, g, d, ahora));
}

/** «e:rumba» → «Porque te gusta la rumba» (para explicar el orden en pruebas y, algún día, en la app) */
export function explicar(motivo?: string): string {
    if (!motivo) return 'Novedad en Musikeeo';
    const [p, v] = [motivo[0], motivo.slice(2)];
    if (p === 'a') return 'De alguien que sigues de cerca';
    if (p === 'e') return `Porque te va ${v}`;
    if (p === 'c') return `En ${v}`;
    if (p === 't') return ({ bolo: 'Bolos para ti', anuncio: 'Equipo que te puede interesar', artista: 'Artistas para ti', post: 'Vídeos de la escena' } as Record<string, string>)[v] || 'Para ti';
    if (p === 'f') return v === 'video' ? 'Vídeos que ves enteros' : 'Para ti';
    return 'Para ti';
}

// ─── De lo que hay en Firestore a rasgos ─────────────────────────────────────

const ms = (iso?: string) => { const t = new Date(iso || 0).getTime(); return isNaN(t) ? 0 : t; };
const sinRepetir = (xs: string[]) => [...new Set(xs)];
type Cuenta = { likes: number; comentarios: number } | undefined;

/** Una publicación. Si su autor es artista, hereda sus estilos y su ciudad */
export function rasgosDePost(p: Post, cuenta: Cuenta, artistaDelAutor?: Artist): Rasgos {
    return {
        clave: `post_${p.id}`, tipo: 'post', autor: p.authorId,
        estilos: sinRepetir([
            ...estilosDe(p.caption, ...(p.etiquetas || [])),
            ...(artistaDelAutor ? estilosDe(...(artistaDelAutor.genres || []), ...(artistaDelAutor.tags || [])) : []),
        ]),
        ciudad: ciudadDe(p.ciudad || artistaDelAutor?.city),
        formato: p.mediaType === 'video' ? 'video' : 'foto',
        fecha: ms(p.createdAt),
        likes: cuenta?.likes || 0, comentarios: cuenta?.comentarios || 0,
    };
}

export function rasgosDeArtista(a: Artist, cuenta: Cuenta): Rasgos {
    return {
        clave: `artista_${a.id}`, tipo: 'artista', autor: a.userId,
        estilos: estilosDe(...(a.genres || []), ...(a.tags || []), a.ficha?.repertorio, a.ficha?.formacion, ...(a.ficha?.idealPara || [])),
        ciudad: ciudadDe(a.city),
        formato: a.clipUrl ? 'video' : 'ficha',
        fecha: ms(a.updatedAt || a.createdAt),
        likes: cuenta?.likes || 0, comentarios: cuenta?.comentarios || 0,
    };
}

export function rasgosDeBolo(e: Event): Rasgos {
    return {
        clave: `bolo_${e.id}`, tipo: 'bolo', autor: e.organizerId,
        estilos: estilosDe(e.title, e.type, ...(e.tags || []), e.detalles?.formato, e.detalles?.repertorio),
        ciudad: ciudadDe(e.location),
        categoria: norm(e.type || 'otro'),
        formato: 'ficha',
        fecha: ms(e.date),
        likes: 0, comentarios: 0,
    };
}

export function rasgosDeAnuncio(l: Listing): Rasgos {
    return {
        clave: `anuncio_${l.id}`, tipo: 'anuncio', autor: l.userId,
        estilos: estilosDe(l.title, l.category),
        ciudad: ciudadDe(l.userLocation),
        categoria: l.category,
        formato: 'foto',
        fecha: ms(l.createdAt),
        likes: 0, comentarios: 0,
    };
}

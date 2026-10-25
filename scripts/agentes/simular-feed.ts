// Agentes simulados que usan el Feed «Para ti» durante varios días y miden si el algoritmo
// (src/lib/recomendador.ts) les enseña lo que les gusta. No toca Firestore: todo pasa en
// memoria. Opcionalmente lee el catálogo público de producción (solo lectura) y las
// personas que haya generado MiroFish.
//
//   node scripts/agentes/simular-feed.ts                       # personas propias, catálogo sintético
//   node scripts/agentes/simular-feed.ts --produccion          # + artistas, bolos y anuncios reales (lectura)
//   node scripts/agentes/simular-feed.ts --mirofish=perfiles.json   # + agentes de MiroFish
//   node scripts/agentes/simular-feed.ts --dias=21 --informe=docs/SIMULACION-FEED.md
//
// Compara cuatro maneras de ordenar el mismo catálogo: el algoritmo, el algoritmo sin
// aprender (solo perfil, novedad y popularidad), por fecha (como era el Feed) y al azar.

import { writeFileSync } from 'node:fs';
import {
    DIA, aprender, explicar, gustosVacios, rasgosDeAnuncio, rasgosDeArtista, rasgosDeBolo, rasgosDePost, recomendar,
    type Declarado, type Gustos, type Rasgos, type Senal,
} from '../../src/lib/recomendador.ts';
import type { Artist, Event, Listing, Post } from '../../src/types/index.ts';
import { PERSONAS, type Persona } from './personas.ts';
import { personasDeMiroFish } from './mirofish.ts';
import { LE_INTERESA, interesReal, reaccionar, sesion } from './comportamiento.ts';
import { leerColeccion } from './produccion.ts';

// ─── Opciones ────────────────────────────────────────────────────────────────
const arg = (k: string) => process.argv.find(a => a === `--${k}` || a.startsWith(`--${k}=`))?.split('=').slice(1).join('=') ?? (process.argv.includes(`--${k}`) ? '' : undefined);
const DIAS = Number(arg('dias') || 14);
const SEMILLA = Number(arg('semilla') || 7);
const VUELTAS = Number(arg('vueltas') || 5);         // por sesión: 5 × (grande + bolo) y filas del Mercado
const INFORME = arg('informe');
const MIROFISH = arg('mirofish');
const PRODUCCION = arg('produccion') !== undefined;
const INICIO = new Date('2026-10-25T10:00:00Z').getTime();

// Azar con semilla (mulberry32): mismas cifras en cada ejecución
function azar(semilla: number) {
    let a = semilla >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ─── Catálogo sintético (en memoria; nunca se publica) ──────────────────────
// Palabras que el vocabulario del algoritmo reconoce, con cómo se escribirían en la app
const ESTILOS: [string, string][] = [
    ['rumba', 'Rumba'], ['flamenco', 'Flamenco'], ['pop', 'Pop'], ['rock', 'Rock'], ['indie', 'Indie'],
    ['jazz', 'Jazz'], ['bossa', 'Bossa nova'], ['blues', 'Blues'], ['soul', 'Soul'], ['funk', 'Funk'],
    ['reggaeton', 'Reggaetón'], ['salsa', 'Salsa'], ['electronica', 'Electrónica'], ['dj', 'DJ'],
    ['acustico', 'Acústico'], ['clasica', 'Clásica'], ['versiones', 'Versiones'], ['violin', 'Violín'], ['latino', 'Latino'],
];
const CIUDADES = ['Barcelona', 'Barcelona', 'Barcelona', 'Girona', 'Madrid', 'Valencia', 'Sevilla'];
const OCASIONES = ['boda', 'fiesta privada', 'terraza', 'festival', 'sala', 'evento de empresa', 'residencia en bar'];
const ANUNCIOS: { cat: Listing['category']; titulo: string }[] = [
    { cat: 'guitarras', titulo: 'Guitarra española' }, { cat: 'guitarras', titulo: 'Guitarra eléctrica Telecaster' },
    { cat: 'bajos', titulo: 'Bajo de 4 cuerdas' }, { cat: 'pa_sonido', titulo: 'Altavoces activos 12"' },
    { cat: 'pa_sonido', titulo: 'Mesa de sonido de 16 canales' }, { cat: 'iluminacion', titulo: 'Luces LED para escenario' },
    { cat: 'teclados', titulo: 'Piano digital' }, { cat: 'bateria', titulo: 'Batería acústica completa' },
    { cat: 'accesorios', titulo: 'Cejilla y púas' }, { cat: 'recording', titulo: 'Interfaz de grabación' },
    { cat: 'viento', titulo: 'Saxo alto' }, { cat: 'cuerdas', titulo: 'Violín 4/4' },
];

interface Catalogo { artistas: Artist[]; posts: Post[]; bolos: Event[]; anuncios: Listing[]; populares: Map<string, { likes: number; comentarios: number }> }

function catalogoSintetico(r: () => number): Catalogo {
    const elegir = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
    const iso = (t: number) => new Date(t).toISOString();
    const artistas: Artist[] = [];
    for (let i = 0; i < 60; i++) {
        const n = 1 + Math.floor(r() * 3);
        const estilos = [...new Set(Array.from({ length: n }, () => elegir(ESTILOS)[1]))];
        const creado = INICIO - Math.floor(r() * 90) * DIA;
        artistas.push({
            id: `sim_art_${i}`, slug: `sim-${i}`, userId: `sim_u_${i}`, artistName: `Artista simulado ${i}`,
            genres: estilos, tags: r() < 0.3 ? ['bodas'] : [], city: elegir(CIUDADES), country: 'España',
            clipUrl: r() < 0.5 ? 'clip.mp4' : undefined, coverPhoto: 'foto.webp', isVerified: false, bio: '',
            rating: 0, reviewCount: 0, gigsCompleted: 0, packages: [], multimedia: { videos: [], photos: [] },
            availability: [], isPublic: true, profileCompleteness: 80, createdAt: iso(creado), updatedAt: iso(creado),
        } as Artist);
    }
    const posts: Post[] = [];
    for (let i = 0; i < 70; i++) posts.push(postDe(artistas, r, INICIO - Math.floor(r() * 30 * DIA), i));
    const bolos: Event[] = [];
    for (let i = 0; i < 40; i++) bolos.push(boloDe(r, INICIO, i));
    const anuncios: Listing[] = [];
    for (let i = 0; i < 40; i++) anuncios.push(anuncioDe(r, INICIO - Math.floor(r() * 20 * DIA), i));
    // Lo que ya le gusta a la comunidad: pocos muy populares y muchos con poco (cola larga)
    const populares = new Map<string, { likes: number; comentarios: number }>();
    for (const p of posts) populares.set(`post_${p.id}`, { likes: Math.floor(Math.pow(r(), 3) * 60), comentarios: Math.floor(Math.pow(r(), 4) * 15) });
    for (const a of artistas) populares.set(`artista_${a.id}`, { likes: Math.floor(Math.pow(r(), 3) * 40), comentarios: Math.floor(Math.pow(r(), 4) * 8) });
    return { artistas, posts, bolos, anuncios, populares };
}

function postDe(artistas: Artist[], r: () => number, cuando: number, i: number): Post {
    const a = artistas[Math.floor(r() * artistas.length)];
    const estilo = (a.genres || [])[0] || 'Pop';
    return {
        id: `sim_post_${i}`, authorId: a.userId, authorName: a.artistName, mediaType: r() < 0.7 ? 'video' : 'image',
        mediaUrl: 'x', mediaPath: 'x', caption: `Ensayando ${estilo.toLowerCase()} para el finde #${estilo.toLowerCase().replace(/\s+/g, '')}`,
        etiquetas: (a.genres || []).map(g => g.toLowerCase()), ciudad: a.city, createdAt: new Date(cuando).toISOString(),
    };
}
function boloDe(r: () => number, ahora: number, i: number): Event {
    const estilo = ESTILOS[Math.floor(r() * ESTILOS.length)][1];
    const ocasion = OCASIONES[Math.floor(r() * OCASIONES.length)];
    return {
        id: `sim_bolo_${i}`, title: `Se busca ${estilo.toLowerCase()} para ${ocasion}`, organizerId: `sim_org_${i % 12}`,
        organizerName: 'Sala simulada', date: new Date(ahora + Math.floor(2 + r() * 60) * DIA).toISOString(),
        location: CIUDADES[Math.floor(r() * CIUDADES.length)], type: ocasion === 'boda' ? 'Boda / Social' : 'Gig',
        createdAt: new Date(ahora).toISOString(),
    };
}
function anuncioDe(r: () => number, cuando: number, i: number): Listing {
    const x = ANUNCIOS[Math.floor(r() * ANUNCIOS.length)];
    return {
        id: `sim_anuncio_${i}`, userId: `sim_vend_${i % 15}`, userName: 'Vendedor simulado', userLocation: CIUDADES[Math.floor(r() * CIUDADES.length)],
        title: x.titulo, description: '', category: x.cat, condition: 'bueno', type: 'venta', price: 100, urgent: false, available: true,
        images: [], createdAt: new Date(cuando).toISOString(), updatedAt: new Date(cuando).toISOString(),
    };
}

// ─── Catálogo de producción (solo lectura, por la API pública) ──────────────
async function catalogoDeProduccion(): Promise<Partial<Catalogo>> {
    const [artistas, bolos, anuncios] = await Promise.all([
        leerColeccion<Artist>('artists'), leerColeccion<Event>('events'), leerColeccion<Listing>('listings'),
    ]);
    return {
        artistas: artistas.filter(a => a.isPublic && a.artistName && (a.coverPhoto || a.profilePhoto || a.clipUrl)),
        bolos: bolos.filter(e => new Date(e.date).getTime() >= INICIO - DIA),
        anuncios: anuncios.filter(l => l.available),
    };
}

// ─── Maneras de ordenar ──────────────────────────────────────────────────────
type Estrategia = 'algoritmo' | 'sin-aprender' | 'por-fecha' | 'azar' | 'oraculo';
const ESTRATEGIAS: Estrategia[] = ['algoritmo', 'sin-aprender', 'por-fecha', 'azar', 'oraculo'];
const NOMBRE: Record<Estrategia, string> = {
    'algoritmo': 'Algoritmo (aprende)', 'sin-aprender': 'Solo perfil y novedad', 'por-fecha': 'Por fecha (como era)', 'azar': 'Al azar',
    'oraculo': 'Techo (sabe el gusto oculto)',
};

function ordenar(e: Estrategia, items: Rasgos[], g: Gustos, d: Declarado, ahora: number, rnd: () => number, p?: Persona, vistos?: Set<string>): Rasgos[] {
    // El techo: sabe lo que le gusta y no repite lo ya visto (no lo puede tener ninguna app)
    if (e === 'oraculo' && p) return [...items].sort((a, b) =>
        (interesReal(p, b) - (vistos?.has(b.clave) ? 0.5 : 0)) - (interesReal(p, a) - (vistos?.has(a.clave) ? 0.5 : 0)));
    if (e === 'algoritmo') return recomendar(items, g, d, ahora).map(x => x.rasgos);
    if (e === 'sin-aprender') return recomendar(items, gustosVacios(), d, ahora).map(x => x.rasgos);
    if (e === 'azar') return [...items].map(x => [rnd(), x] as const).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    // Por fecha: lo nuevo primero; los bolos, el más cercano; los vídeos de artista, delante de las fichas
    return [...items].sort((a, b) => a.tipo === 'bolo' ? a.fecha - b.fecha
        : a.tipo === 'artista' && b.tipo === 'artista' ? Number(b.formato === 'video') - Number(a.formato === 'video')
            : b.fecha - a.fecha);
}

interface Medida { acierto: number; nuevos: number; gestos: number; variedad: number }

function simularPersona(p: Persona, base: Catalogo, e: Estrategia) {
    const rnd = azar(SEMILLA * 1000 + p.id.length * 31 + ESTRATEGIAS.indexOf(e));
    const rCat = azar(SEMILLA + 99);   // el contenido nuevo de cada día es el mismo para todas las estrategias
    const declarado: Declarado = { uid: `persona_${p.id}`, rol: p.rol, estilos: p.declarado, ciudad: p.ciudad };
    let gustos = gustosVacios(INICIO);
    const posts = [...base.posts], bolos = [...base.bolos], anuncios = [...base.anuncios];
    const misLikes = new Set<string>();
    const porDia: Medida[] = [];
    const primeros: { dia: number; lista: string[] }[] = [];
    const vistos = new Set<string>();
    for (let dia = 0; dia < DIAS; dia++) {
        const ahora = INICIO + dia * DIA;
        // Cada día llega contenido nuevo
        if (dia > 0) {
            for (let k = 0; k < 3; k++) posts.push(postDe(base.artistas, rCat, ahora - Math.floor(rCat() * 8) * 3600_000, 1000 + dia * 10 + k));
            bolos.push(boloDe(rCat, ahora, 1000 + dia));
            anuncios.push(anuncioDe(rCat, ahora, 1000 + dia));
        }
        const cuenta = (c: string) => {
            const x = base.populares.get(c) || { likes: 0, comentarios: 0 };
            return { likes: x.likes + (misLikes.has(c) ? 1 : 0), comentarios: x.comentarios };
        };
        const artistaDe = new Map(base.artistas.map(a => [a.userId, a]));
        const grandes = [
            ...posts.map(x => rasgosDePost(x, cuenta(`post_${x.id}`), artistaDe.get(x.authorId))),
            ...base.artistas.map(x => rasgosDeArtista(x, cuenta(`artista_${x.id}`))),
        ];
        const abiertos = bolos.filter(b => new Date(b.date).getTime() >= ahora - DIA).map(rasgosDeBolo);
        const vista = sesion(
            ordenar(e, grandes, gustos, declarado, ahora, rnd, p, vistos),
            ordenar(e, abiertos, gustos, declarado, ahora, rnd, p, vistos),
            ordenar(e, anuncios.map(rasgosDeAnuncio), gustos, declarado, ahora, rnd, p, vistos),
            VUELTAS,
        );
        if (dia === 0 || dia === DIAS - 1) {
            primeros.push({ dia, lista: recomendar(grandes, e === 'algoritmo' ? gustos : gustosVacios(), declarado, ahora).slice(0, 4).map(x => `${x.rasgos.tipo}: ${x.rasgos.estilos.slice(0, 2).join(', ') || '—'} (${x.rasgos.ciudad || '—'}) · ${explicar(x.motivo)}`) });
        }
        let gestos = 0, interesan = 0, nuevos = 0;
        const autores = new Set<string>();
        let nGrandes = 0;
        for (const r of vista) {
            const leInteresa = interesReal(p, r) >= LE_INTERESA;
            if (leInteresa) interesan++;
            if (leInteresa && !vistos.has(r.clave)) nuevos++;
            vistos.add(r.clave);
            if (r.tipo === 'post' || r.tipo === 'artista') { nGrandes++; if (r.autor) autores.add(r.autor); }
            for (const s of reaccionar(p, r, rnd)) {
                if (s !== 'impresion' && s !== 'saltar') gestos++;
                if (s === 'me_gusta') misLikes.add(r.clave);
                if (e === 'algoritmo') gustos = aprender(gustos, r, s, ahora + gestos * 1000);
            }
        }
        porDia.push({ acierto: vista.length ? interesan / vista.length : 0, nuevos, gestos, variedad: nGrandes ? autores.size / nGrandes : 1 });
    }
    return { porDia, primeros, cobertura: vistos.size, gustos };
}

// ─── Informe ─────────────────────────────────────────────────────────────────
const pct = (x: number) => `${Math.round(x * 100)} %`;
const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

async function main() {
    const r = azar(SEMILLA);
    const catalogo = catalogoSintetico(r);
    let notaProduccion = '';
    if (PRODUCCION) {
        const prod = await catalogoDeProduccion();
        catalogo.artistas.push(...(prod.artistas || []));
        catalogo.bolos.push(...(prod.bolos || []));
        catalogo.anuncios.push(...(prod.anuncios || []));
        notaProduccion = ` + de producción (solo lectura): ${prod.artistas?.length || 0} artistas, ${prod.bolos?.length || 0} bolos abiertos y ${prod.anuncios?.length || 0} anuncios`;
    }
    const personas = [...PERSONAS, ...(MIROFISH ? personasDeMiroFish(MIROFISH) : [])];

    const simular = (ps: Persona[]) => ps.map(p => ({ p, por: Object.fromEntries(ESTRATEGIAS.map(e => [e, simularPersona(p, catalogo, e)])) as Record<Estrategia, ReturnType<typeof simularPersona>> }));
    const resultados = simular(personas);
    // Lo normal en una app: mucha gente no pone sus estilos en el perfil
    const sinPerfil = simular(personas.map(p => ({ ...p, declarado: [] })));
    const tabla = (rs: typeof resultados) => {
        const filas = ['| Orden | Acierto día 1 | Acierto último día | Acierto medio | Descubre (nuevo que le interesa, por sesión) | Gestos por sesión | Variedad |', '|---|---|---|---|---|---|---|'];
        for (const e of ESTRATEGIAS) {
            const d1 = media(rs.map(x => x.por[e].porDia[0].acierto));
            const dn = media(rs.map(x => x.por[e].porDia[DIAS - 1].acierto));
            const am = media(rs.flatMap(x => x.por[e].porDia.map(d => d.acierto)));
            const g = media(rs.flatMap(x => x.por[e].porDia.map(d => d.gestos)));
            const v = media(rs.flatMap(x => x.por[e].porDia.map(d => d.variedad)));
            const nv = media(rs.flatMap(x => x.por[e].porDia.map(d => d.nuevos)));
            filas.push(`| ${NOMBRE[e]} | ${pct(d1)} | ${pct(dn)} | ${pct(am)} | ${nv.toFixed(1)} | ${g.toFixed(1)} | ${pct(v)} |`);
        }
        return filas;
    };

    const L: string[] = [];
    L.push('# Simulación del Feed «Para ti» con agentes');
    L.push('');
    L.push(`Generado con \`node scripts/agentes/simular-feed.ts${process.argv.slice(2).length ? ' ' + process.argv.slice(2).join(' ') : ''}\`. Todo pasa en memoria: ningún agente escribe en Firestore.`);
    L.push('');
    L.push(`- **Agentes:** ${personas.length} (${PERSONAS.length} propios${MIROFISH ? `, ${personas.length - PERSONAS.length} de MiroFish` : ''}).`);
    L.push(`- **Catálogo:** sintético (${catalogo.artistas.length} artistas, ${catalogo.posts.length} publicaciones, ${catalogo.bolos.length} bolos, ${catalogo.anuncios.length} anuncios, y cada día 3 publicaciones, 1 bolo y 1 anuncio nuevos)${notaProduccion}.`);
    L.push(`- **Uso:** una sesión al día durante ${DIAS} días; en cada sesión ve ${VUELTAS} vueltas del Feed (grande + bolo + 3 anuncios de la fila del Mercado).`);
    L.push(`- **Acierto:** de lo que ve, cuánto le interesa de verdad (su gusto oculto ≥ ${LE_INTERESA}). **Descubre:** cosas que le interesan y no había visto antes. **Gestos:** me gusta, comentarios, vídeos vistos enteros, perfiles y bolos o anuncios abiertos por sesión. **Variedad:** autores distintos entre las tarjetas grandes.`);
    L.push('');
    L.push('## Resultado general');
    L.push('');
    L.push('### Con su perfil relleno (pone sus estilos)');
    L.push('');
    L.push(...tabla(resultados));
    L.push('');
    L.push('### Sin estilos en el perfil (solo rol y ciudad)');
    L.push('');
    L.push(...tabla(sinPerfil));
    L.push('');
    L.push('## Por agente (acierto medio de los días)');
    L.push('');
    L.push(`| Agente | Rol | ${ESTRATEGIAS.map(e => NOMBRE[e]).join(' | ')} |`);
    L.push(`|---|---|${ESTRATEGIAS.map(() => '---').join('|')}|`);
    for (const x of resultados) {
        L.push(`| ${x.p.nombre} | ${x.p.rol} | ${ESTRATEGIAS.map(e => pct(media(x.por[e].porDia.map(d => d.acierto)))).join(' | ')} |`);
    }
    L.push('');
    L.push('## Lo que el algoritmo ha aprendido de cada agente');
    L.push('');
    L.push('| Agente | Le gusta de verdad | Estilos que más suben | Estilos que bajan |');
    L.push('|---|---|---|---|');
    for (const x of resultados) {
        const est = Object.entries(x.por.algoritmo.gustos.pesos).filter(([k]) => k.startsWith('e:')).sort((a, b) => b[1] - a[1]);
        const fmt = (xs: [string, number][]) => xs.map(([k, w]) => `${k.slice(2)} ${w > 0 ? '+' : ''}${w.toFixed(1)}`).join(', ') || '—';
        const real = Object.entries(x.p.gustoReal).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k).join(', ');
        L.push(`| ${x.p.nombre} | ${real} | ${fmt(est.filter(e => e[1] > 0).slice(0, 4))} | ${fmt(est.filter(e => e[1] < 0).slice(-3).reverse())} |`);
    }
    L.push('');
    L.push('## Qué ve cada agente arriba del todo (algoritmo), el primer y el último día');
    L.push('');
    for (const x of resultados.slice(0, 12)) {
        L.push(`**${x.p.nombre}** — ${x.p.descripcion}`);
        for (const pr of x.por.algoritmo.primeros) {
            L.push(`- Día ${pr.dia + 1}: ${pr.lista.join(' · ')}`);
        }
        L.push('');
    }
    const texto = L.join('\n');
    console.log(texto);
    if (INFORME) writeFileSync(INFORME, texto + '\n');
}

main().catch(e => { console.error(e); process.exit(1); });

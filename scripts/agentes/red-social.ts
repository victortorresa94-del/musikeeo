// La red social de agentes: personas simuladas con cuenta propia que publican vídeos,
// fotos, bolos y anuncios, miran el Feed ordenado por el algoritmo de la app y dan me gusta
// y comentan. SOLO contra los emuladores de Firebase: este script no sabe conectarse a
// producción (de producción solo LEE el catálogo público para copiarlo al emulador).
//
// Cómo se usa (desde la raíz del repo):
//   1) npx firebase-tools emulators:start --only auth,firestore     (déjalo abierto)
//   2) node scripts/agentes/red-social.ts --sembrar                  (copia el catálogo y crea los agentes)
//   3) node scripts/agentes/red-social.ts --rondas=20 --cada=30      (20 rondas, una cada 30 s)
//   4) VITE_EMULADORES=1 npm run dev  → http://localhost:5173/feed  (la app viendo la red)
// Opciones: --mirofish=perfiles.json (añade los agentes de MiroFish) · --semilla=N
// Comentarios con IA: LLM_API_KEY (+ LLM_BASE_URL, LLM_MODEL); sin clave, plantillas.
// Fotos y vídeos: los de public/seed y los de scripts/agentes/medios.json (generados con IA).

import { existsSync, readFileSync } from 'node:fs';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
    addDoc, collection, connectFirestoreEmulator, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, setDoc, where,
    type Firestore,
} from 'firebase/firestore';
import {
    aprender, gustosValidos, gustosVacios, rasgosDeAnuncio, rasgosDeArtista, rasgosDeBolo, rasgosDePost, recomendar,
    type Declarado, type Gustos, type Rasgos,
} from '../../src/lib/recomendador.ts';
import { crearInteracciones, type Objetivo } from '../../src/services/interaccionesNucleo.ts';
import type { Artist, Event, Listing, Post } from '../../src/types/index.ts';
import { PERSONAS, type Persona } from './personas.ts';
import { personasDeMiroFish } from './mirofish.ts';
import { reaccionar, sesion } from './comportamiento.ts';
import { escribirComentario } from './comentarios.ts';
import { leerCrudo, plano, type DocCrudo, type Valor } from './produccion.ts';

const PROYECTO = 'musikeeo-8e766';   // el mismo id que la app: así el navegador ve estos datos en el emulador
const FIRESTORE = '127.0.0.1:8080';
const AUTH = 'http://127.0.0.1:9099';
const ADMIN = `http://${FIRESTORE}/v1/projects/${PROYECTO}/databases/(default)/documents`;
const CLAVE_AGENTES = 'agente-musikeeo';

const arg = (k: string) => process.argv.find(a => a === `--${k}` || a.startsWith(`--${k}=`))?.split('=').slice(1).join('=') ?? (process.argv.includes(`--${k}`) ? '' : undefined);
const SEMBRAR = arg('sembrar') !== undefined;
const RONDAS = Number(arg('rondas') ?? (SEMBRAR ? 0 : 3));
const CADA = Number(arg('cada') || 0);
const MIROFISH = arg('mirofish');
let semilla = Number(arg('semilla') || Date.now() % 100000);
const rnd = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
const elegir = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
const dormir = (s: number) => new Promise(r => setTimeout(r, s * 1000));

// ─── Seguridad: solo con el emulador encendido ───────────────────────────────
async function comprobarEmulador() {
    try {
        const r = await fetch(`http://${FIRESTORE}/`);
        if (!r.ok) throw new Error();
    } catch {
        console.error(`No encuentro el emulador de Firestore en ${FIRESTORE}. Arráncalo con:\n  npx firebase-tools emulators:start --only auth,firestore`);
        process.exit(1);
    }
}

// ─── Medios: lo que suben los agentes ────────────────────────────────────────
// persona: el agente al que pertenece (su foto de perfil, sus vídeos); asset: su id en Aura Studio
interface Medio { url: string; tipo: 'video' | 'image'; poster?: string; estilos: string[]; texto?: string; para?: 'post' | 'anuncio' | 'avatar'; persona?: string; asset?: string }

function mediosGenerados(): Medio[] {
    const f = new URL('./medios.json', import.meta.url);
    return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) as Medio[] : [];
}

// Las URL de las fotos de demostración apuntan a musikeeo.com/seed: en local, a /seed
const local = (u?: string) => (u || '').replace(/^https:\/\/(www\.)?musikeeo\.com\/seed\//, '/seed/');
function reescribir(v: Valor): Valor {
    if (v.stringValue !== undefined) return { stringValue: local(v.stringValue) };
    if (v.arrayValue) return { arrayValue: { values: (v.arrayValue.values || []).map(reescribir) } };
    if (v.mapValue) return { mapValue: { fields: Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, reescribir(x)])) } };
    return v;
}

async function escribirComoAdmin(ruta: string, fields: Record<string, Valor>) {
    const r = await fetch(`${ADMIN}/${ruta}`, {
        method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
    });
    if (!r.ok) throw new Error(`${ruta}: ${r.status} ${await r.text()}`);
}

// ─── Un agente: su cuenta y su conexión ──────────────────────────────────────
interface Agente { p: Persona; uid: string; db: Firestore; nombre: string; foto?: string }

const apps = new Map<string, FirebaseApp>();
async function conectar(p: Persona, crear: boolean): Promise<Agente> {
    let app = apps.get(p.id);
    if (!app) {
        app = initializeApp({ apiKey: 'demo-agentes', projectId: PROYECTO, authDomain: 'localhost' }, p.id);
        connectAuthEmulator(getAuth(app), AUTH, { disableWarnings: true });
        connectFirestoreEmulator(getFirestore(app), FIRESTORE.split(':')[0], Number(FIRESTORE.split(':')[1]));
        apps.set(p.id, app);
    }
    const auth = getAuth(app);
    const email = `${p.id}@agentes.musikeeo.test`;
    let uid: string;
    try { uid = (await signInWithEmailAndPassword(auth, email, CLAVE_AGENTES)).user.uid; }
    catch {
        if (!crear) throw new Error(`El agente ${p.id} no existe: lanza antes --sembrar`);
        uid = (await createUserWithEmailAndPassword(auth, email, CLAVE_AGENTES)).user.uid;
    }
    return { p, uid, db: getFirestore(app), nombre: p.nombre.split(',')[0] };
}

// Su propia foto (generada para él); si aún no la tiene, una de su estilo
function avatarDe(p: Persona, medios: Medio[]): Medio | undefined {
    return medios.find(m => m.para === 'avatar' && m.persona === p.id)
        || medios.find(m => m.para === 'avatar' && !m.persona && m.estilos.some(e => p.gustoReal[e]))
        || medios.find(m => m.tipo === 'image' && !m.persona);
}

// ─── Sembrar: catálogo público + agentes con perfil ──────────────────────────
async function sembrar(personas: Persona[], medios: Medio[]) {
    console.log('Copiando el catálogo público de producción (solo lectura) al emulador…');
    const colecciones = ['artists', 'events', 'listings', 'publicProfiles', 'providers'];
    for (const c of colecciones) {
        const docs: DocCrudo[] = await leerCrudo(c);
        for (const d of docs) await escribirComoAdmin(`${c}/${d.id}`, Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, reescribir(v)])));
        console.log(`  ${c}: ${docs.length}`);
    }
    console.log('Creando los agentes (con las reglas de verdad)…');
    for (const p of personas) {
        const a = await conectar(p, true);
        const avatar = avatarDe(p, medios);
        const ahora = new Date().toISOString();
        const modos = { musician: p.rol === 'musician', organizer: p.rol === 'organizer', provider: p.rol === 'provider' };
        const estilos = Object.keys(p.gustoReal).slice(0, 3);
        await setDoc(doc(a.db, 'users', a.uid), {
            uid: a.uid, email: `${p.id}@agentes.musikeeo.test`, displayName: a.nombre, primaryMode: p.rol, activeModes: modos,
            onboardingCompleted: true, location: p.ciudad, genres: p.declarado, ...(avatar ? { photoURL: avatar.poster || avatar.url } : {}), createdAt: ahora,
        });
        await setDoc(doc(a.db, 'publicProfiles', a.uid), {
            uid: a.uid, displayName: a.nombre, primaryMode: p.rol, activeModes: modos, location: p.ciudad, bio: p.descripcion,
            genres: p.declarado, ...(avatar ? { photoURL: avatar.poster || avatar.url } : {}), createdAt: ahora,
        });
        if (p.rol === 'musician') {
            const clip = medios.find(m => m.tipo === 'video' && m.persona === p.id)
                || medios.find(m => m.tipo === 'video' && !m.persona && m.estilos.some(e => p.gustoReal[e]));
            await setDoc(doc(a.db, 'artists', `artist_${a.uid}`), {
                id: `artist_${a.uid}`, slug: `agente-${p.id}`, userId: a.uid, artistName: a.nombre, bio: p.descripcion,
                genres: estilos.map(e => e[0].toUpperCase() + e.slice(1)), tags: [], city: p.ciudad, country: 'España',
                ...(avatar ? { profilePhoto: avatar.poster || avatar.url, coverPhoto: avatar.poster || avatar.url } : {}),
                ...(clip ? { clipUrl: clip.url, ...(clip.poster ? { clipPoster: clip.poster } : {}) } : {}),
                isVerified: false, isPublic: true, rating: 0, reviewCount: 0, gigsCompleted: 0, packages: [],
                multimedia: { videos: [], photos: [] }, availability: [], profileCompleteness: 80, createdAt: ahora, updatedAt: ahora,
            });
        }
        console.log(`  ${a.nombre} (${p.rol}, ${p.ciudad})`);
    }
}

// ─── Publicar ────────────────────────────────────────────────────────────────
// Los estilos del algoritmo van sin tildes; al escribir, con ellas
const BONITO: Record<string, string> = {
    clasica: 'clásica', acustico: 'acústico', electronica: 'electrónica', percusion: 'percusión', iluminacion: 'iluminación',
    bateria: 'batería', violin: 'violín', grabacion: 'grabación', reggaeton: 'reggaetón', hiphop: 'hip hop', rnb: 'R&B', dj: 'DJ',
};
const bonito = (e: string) => BONITO[e] || e;
const OCASIONES = ['una boda', 'una fiesta privada', 'la terraza del sábado', 'un evento de empresa', 'la residencia de los jueves'];
const EQUIPO: { cat: Listing['category']; titulo: string; estilos: string[] }[] = [
    { cat: 'pa_sonido', titulo: 'Altavoces activos de 12"', estilos: ['sonido'] },
    { cat: 'pa_sonido', titulo: 'Mesa de mezclas de 12 canales', estilos: ['sonido'] },
    { cat: 'iluminacion', titulo: 'Focos LED para escenario', estilos: ['iluminacion'] },
    { cat: 'guitarras', titulo: 'Guitarra española de estudio', estilos: ['guitarra', 'flamenco', 'rumba'] },
    { cat: 'guitarras', titulo: 'Guitarra eléctrica con funda', estilos: ['guitarra', 'rock'] },
    { cat: 'bajos', titulo: 'Bajo de 4 cuerdas', estilos: ['bajo'] },
    { cat: 'accesorios', titulo: 'Cajón flamenco', estilos: ['percusion', 'flamenco', 'rumba'] },
    { cat: 'recording', titulo: 'Interfaz de audio de 2 canales', estilos: ['grabacion'] },
];

async function publicar(a: Agente, medios: Medio[]) {
    const { p } = a;
    const estilo = elegir(Object.keys(p.gustoReal));
    const ahora = new Date().toISOString();
    if (p.rol === 'musician' && rnd() < 0.45) {
        const suyos = medios.filter(m => (m.para ?? 'post') === 'post' && m.persona === p.id);
        const opciones = suyos.length && rnd() < 0.7 ? suyos : medios.filter(m => (m.para ?? 'post') === 'post' && !m.persona && m.estilos.includes(estilo));
        const m = opciones.length ? elegir(opciones) : elegir(medios.filter(x => (x.para ?? 'post') === 'post'));
        if (!m) return null;
        const caption = m.texto || elegir([
            `Ensayando ${bonito(estilo)} para el finde en ${p.ciudad}. ¿Alguien busca banda? #${estilo}`,
            `Así sonó el último bolo. Si te encaja para tu evento, escríbeme #${estilo}`,
            `Probando repertorio nuevo de ${bonito(estilo)} #${estilo} #${p.ciudad.toLowerCase()}`,
        ]);
        const post: Omit<Post, 'id'> = {
            authorId: a.uid, authorName: a.nombre, mediaType: m.tipo, mediaUrl: m.url, mediaPath: '',
            ...(m.poster ? { posterUrl: m.poster } : {}), caption, etiquetas: p.declarado.length ? p.declarado : [estilo],
            ciudad: p.ciudad, createdAt: ahora,
        };
        await addDoc(collection(a.db, 'posts'), post);
        return `sube ${m.tipo === 'video' ? 'un vídeo' : 'una foto'} (${bonito(estilo)})`;
    }
    if (p.rol === 'organizer' && rnd() < 0.3) {
        const ocasion = elegir(OCASIONES);
        const e: Omit<Event, 'id'> = {
            title: `Busco ${bonito(estilo)} para ${ocasion}`, organizerId: a.uid, organizerName: a.nombre,
            date: new Date(Date.now() + Math.floor(5 + rnd() * 50) * 86_400_000).toISOString().slice(0, 16),
            location: p.ciudad, type: ocasion.includes('boda') ? 'Boda / Social' : 'Gig', price: Math.round(3 + rnd() * 12) * 100,
            description: `Publicado por un agente de prueba (${p.nombre}).`, createdAt: ahora,
        };
        await addDoc(collection(a.db, 'events'), e);
        return `publica un bolo: «${e.title}»`;
    }
    if ((p.rol === 'provider' && rnd() < 0.35) || (p.rol === 'musician' && rnd() < 0.08)) {
        const suyos = EQUIPO.filter(q => q.estilos.some(s => p.gustoReal[s]));
        const x = elegir(suyos.length ? suyos : EQUIPO);
        const foto = medios.find(m => m.para === 'anuncio' && m.estilos.some(s => x.estilos.includes(s)));
        const l: Omit<Listing, 'id'> = {
            userId: a.uid, userName: a.nombre, userLocation: p.ciudad, title: x.titulo, description: 'Anuncio de un agente de prueba.',
            category: x.cat, condition: 'bueno', type: rnd() < 0.3 ? 'alquiler' : 'venta', price: Math.round(20 + rnd() * 400),
            urgent: rnd() < 0.15, available: true, images: foto ? [foto.url] : ['/seed/cables.webp'], views: 0, createdAt: ahora, updatedAt: ahora,
        };
        await addDoc(collection(a.db, 'listings'), l);
        return `pone a la venta «${x.titulo}»`;
    }
    return null;
}

// ─── Mirar el Feed y reaccionar ──────────────────────────────────────────────
async function mirarFeed(a: Agente) {
    const { db, p, uid } = a;
    const nucleo = crearInteracciones(db);
    const leer = async <T,>(q: ReturnType<typeof query>) => (await getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() }) as T);
    const [posts, artistas, bolos, anuncios] = await Promise.all([
        leer<Post>(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(40))),
        leer<Artist>(query(collection(db, 'artists'), where('isPublic', '==', true), limit(80))),
        leer<Event>(query(collection(db, 'events'), limit(60))),
        leer<Listing>(query(collection(db, 'listings'), where('available', '==', true), limit(80))),
    ]);
    const conImagen = artistas.filter(x => x.artistName && x.slug && (x.coverPhoto || x.profilePhoto || x.clipUrl));
    const claves = [...posts.map(x => `post_${x.id}`), ...conImagen.map(x => `artista_${x.id}`)];
    const [cuentas, mios] = await Promise.all([nucleo.contadores(claves), nucleo.misMeGusta(uid, claves)]);
    const gDoc = await getDoc(doc(db, 'users', uid, 'gustos', 'perfil')).catch(() => null);
    let gustos: Gustos = (gDoc?.exists() && gustosValidos(gDoc.data())) || gustosVacios();
    const declarado: Declarado = { uid, rol: p.rol, estilos: p.declarado, ciudad: p.ciudad };
    const ahora = Date.now();
    const artistaDe = new Map(artistas.map(x => [x.userId, x]));
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const abiertos = bolos.filter(e => new Date(e.date).getTime() >= hoy.getTime());

    const objetivo = new Map<string, Objetivo>();
    const texto = new Map<string, string>();
    for (const x of posts) { objetivo.set(`post_${x.id}`, { tipo: 'post', refId: x.id, duenioId: x.authorId }); texto.set(`post_${x.id}`, `${x.authorName}: ${x.caption}`); }
    for (const x of conImagen) { objetivo.set(`artista_${x.id}`, { tipo: 'artista', refId: x.id, duenioId: x.userId }); texto.set(`artista_${x.id}`, `${x.artistName} (${(x.genres || []).join(', ')}, ${x.city})`); }

    const vista = sesion(
        recomendar([
            ...posts.map(x => rasgosDePost(x, cuentas.get(`post_${x.id}`), artistaDe.get(x.authorId))),
            ...conImagen.map(x => rasgosDeArtista(x, cuentas.get(`artista_${x.id}`))),
        ], gustos, declarado, ahora).map(x => x.rasgos),
        recomendar(abiertos.map(rasgosDeBolo), gustos, declarado, ahora).map(x => x.rasgos),
        recomendar(anuncios.map(rasgosDeAnuncio), gustos, declarado, ahora).map(x => x.rasgos),
        4,
    );
    const hecho: string[] = [];
    const yaLeGustaba = new Set(mios);
    let n = 0;
    for (const r of vista as Rasgos[]) {
        if (r.autor === uid) continue;
        for (const s of reaccionar(p, r, rnd)) {
            gustos = aprender(gustos, r, s, ahora + ++n * 1000);
            const o = objetivo.get(r.clave);
            if (!o) continue;
            try {
                if (s === 'me_gusta' && !mios.has(r.clave)) { await nucleo.setMeGusta(o, uid, true); mios.add(r.clave); hecho.push(`♥ ${texto.get(r.clave)?.split(':')[0]}`); }
                // Comenta lo que le acaba de gustar, no lo que ya comentó en otra ronda
                if (s === 'comentar' && !yaLeGustaba.has(r.clave)) {
                    const t = await escribirComentario(p, r, texto.get(r.clave) || '', rnd);
                    await nucleo.comentar(o, { uid, nombre: a.nombre, foto: a.foto }, t);
                    hecho.push(`💬 «${t}»`);
                }
            } catch (e) { hecho.push(`✗ ${s}: ${(e as Error).message.split('\n')[0]}`); }
        }
    }
    await setDoc(doc(db, 'users', uid, 'gustos', 'perfil'), gustos);
    const arriba = Object.entries(gustos.pesos).filter(([k]) => k.startsWith('e:')).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k]) => k.slice(2));
    return { hecho, arriba, visto: vista.length };
}

// ─── Principal ───────────────────────────────────────────────────────────────
async function main() {
    await comprobarEmulador();
    const personas = [...PERSONAS, ...(MIROFISH ? personasDeMiroFish(MIROFISH) : [])];
    // Los medios: los de demostración de public/seed (a partir de los artistas de producción) y los generados
    const artistasProd = (await leerCrudo('artists')).map(d => ({ id: d.id, ...(plano({ mapValue: { fields: d.fields } }) as object) }) as Artist);
    const medios: Medio[] = [
        ...mediosGenerados(),
        ...artistasProd.filter(x => x.clipUrl).map(x => ({ url: local(x.clipUrl), poster: local(x.clipPoster || x.coverPhoto), tipo: 'video' as const, estilos: (x.genres || []).map(g => g.toLowerCase()), para: 'post' as const })),
        ...artistasProd.filter(x => x.coverPhoto).map(x => ({ url: local(x.coverPhoto), tipo: 'image' as const, estilos: (x.genres || []).map(g => g.toLowerCase()), para: 'post' as const })),
    ];
    if (SEMBRAR) await sembrar(personas, medios);

    for (let ronda = 1; ronda <= RONDAS; ronda++) {
        console.log(`\n── Ronda ${ronda}/${RONDAS} · ${new Date().toLocaleTimeString('es-ES')}`);
        for (const p of [...personas].sort(() => rnd() - 0.5)) {
            const a = await conectar(p, false);
            const av = avatarDe(p, medios);
            a.foto = av?.poster || av?.url;
            const subio = await publicar(a, medios);
            const { hecho, arriba } = await mirarFeed(a);
            console.log(`  ${a.nombre}: ${[subio, ...hecho].filter(Boolean).join(' · ') || 'mira y pasa'}${arriba.length ? `  [aprende: ${arriba.join(', ')}]` : ''}`);
        }
        if (CADA && ronda < RONDAS) await dormir(CADA);
    }
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

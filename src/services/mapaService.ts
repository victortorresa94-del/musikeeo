import {
    Timestamp, collection, deleteDoc, doc, endAt, getDoc, getDocs, limit, orderBy, query,
    serverTimestamp, setDoc, startAt, where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { finDeRango } from '../lib/geohash';
import {
    MAX_NOMBRE, etiquetasDe, fotoSegura, leerPunto, papelDe,
    type DatosPerfil, type Papel, type PuntoMapa,
} from '../lib/mapa';
import { getProviderByUserId } from './providerService';
import { getOrganizerByUserId } from './organizerService';
import type { User } from '../types';

// Musikeers cerca: mapa/{uid}, una ficha mínima por persona que se apunta (apagado por defecto).
// Solo la celda del geohash: la posición exacta no sale del móvil. Lo leen quienes tienen cuenta;
// lo escribe y lo borra solo su dueño (firestore.rules valida tipos y tamaños).

const COLECCION = 'mapa';
/** Las reglas no dejan pedir más de golpe */
export const LIMITE_CONSULTA = 300;

export type Ficha = Pick<PuntoMapa, 'nombre' | 'foto' | 'papel' | 'etiquetas'>;
export type Colocacion = Pick<PuntoMapa, 'geohash' | 'zona' | 'ahora' | 'caduca'>;

const docs = (snap: Awaited<ReturnType<typeof getDocs>>) =>
    snap.docs.map(d => leerPunto(d.id, d.data() as Record<string, unknown>)).filter((p): p is PuntoMapa => !!p);

export const mapaService = {
    /** Todos los que tienen la celda dentro de un prefijo de geohash ('' = todo, con el tope) */
    async enZona(prefijo: string): Promise<PuntoMapa[]> {
        const ref = collection(db, COLECCION);
        const q = prefijo
            ? query(ref, orderBy('geohash'), startAt(prefijo), endAt(finDeRango(prefijo)), limit(LIMITE_CONSULTA))
            : query(ref, orderBy('geohash'), limit(LIMITE_CONSULTA));
        return docs(await getDocs(q));
    },

    async mio(uid: string): Promise<PuntoMapa | null> {
        const snap = await getDoc(doc(db, COLECCION, uid));
        return snap.exists() ? leerPunto(uid, snap.data()) : null;
    },

    /** Aparecer o moverse. `caduca` en ms (solo con «ahora») */
    async guardar(uid: string, ficha: Ficha, sitio: Colocacion): Promise<void> {
        await setDoc(doc(db, COLECCION, uid), {
            uid,
            nombre: ficha.nombre.slice(0, MAX_NOMBRE),
            foto: ficha.foto,
            papel: ficha.papel,
            etiquetas: ficha.etiquetas.slice(0, 3),
            zona: sitio.zona,
            geohash: sitio.geohash,
            ahora: sitio.ahora,
            caduca: sitio.ahora && sitio.caduca ? Timestamp.fromMillis(sitio.caduca) : null,
            actualizado: serverTimestamp(),
        });
    },

    async quitar(uid: string): Promise<void> {
        await deleteDoc(doc(db, COLECCION, uid));
    },

    /**
     * Nombre, foto, papel y etiquetas con lo que ya tiene el perfil: la ficha de artista, la de
     * técnico o tienda (providers), la de sala (organizers) y lo del onboarding.
     */
    async fichaDePerfil(uid: string, perfil: User | null, fotoCuenta?: string | null): Promise<Ficha> {
        const [art, prov, org] = await Promise.allSettled([
            // Directo y no getArtistByUserId: ese da un artista de mentira si Firestore tarda
            getDocs(query(collection(db, 'artists'), where('userId', '==', uid), limit(1)))
                .then(s => (s.empty ? null : (s.docs[0].data() as Record<string, unknown>))),
            getProviderByUserId(uid),
            getOrganizerByUserId(uid),
        ]);
        const artista = art.status === 'fulfilled' ? art.value : null;
        // En Firestore el proveedor guarda más de lo que dice su tipo (foto, ciudad…)
        const proveedor = prov.status === 'fulfilled' ? (prov.value as unknown as Record<string, unknown> | null) : null;
        const organizador = org.status === 'fulfilled' ? org.value : null;
        const lista = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

        const datos: DatosPerfil = {
            primaryMode: perfil?.primaryMode,
            tieneArtista: !!artista,
            tieneOrganizador: !!organizador,
            servicios: lista(proveedor?.services),
            equipo: lista(proveedor?.equipmentTypes),
            skills: lista(perfil?.skills),
            generos: [...lista(artista?.genres), ...lista(perfil?.genres)],
            tags: lista(artista?.tags),
        };
        const papel: Papel = papelDe(datos);
        const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
        const nombre = (
            papel === 'musico' ? texto(artista?.artistName)
                : papel === 'tecnico' || papel === 'tienda' ? texto(proveedor?.businessName)
                    : papel === 'sala' ? texto(organizador?.companyName) || texto(organizador?.displayName)
                        : ''
        ) || texto(perfil?.displayName) || 'Musikeer';
        const foto = fotoSegura(artista?.profilePhoto) || fotoSegura(perfil?.photoURL) || fotoSegura(proveedor?.photoURL) || fotoSegura(fotoCuenta);
        return { nombre: nombre.slice(0, MAX_NOMBRE), foto, papel, etiquetas: etiquetasDe(papel, datos) };
    },
};

// ─── En el propio móvil ─────────────────────────────────────────────────────
// La zona fija se recuerda aquí para volver a ella al pulsar «Ya me voy» (o cuando caduca
// «Estoy aquí ahora»). Y si ya confirmó que tiene 18 años, para no preguntárselo en cada bolo.

const CLAVE_ZONA = (uid: string) => `musikeeo-mapa-zona-v1:${uid}`;
const CLAVE_18 = (uid: string) => `musikeeo-mapa-18-v1:${uid}`;

export const mapaLocal = {
    zona(uid: string): { geohash: string; zona: string } | null {
        try {
            const v = JSON.parse(localStorage.getItem(CLAVE_ZONA(uid)) || 'null');
            return v && typeof v.geohash === 'string' && typeof v.zona === 'string' ? v : null;
        } catch { return null; }
    },
    guardarZona(uid: string, z: { geohash: string; zona: string } | null) {
        try {
            if (z) localStorage.setItem(CLAVE_ZONA(uid), JSON.stringify(z));
            else localStorage.removeItem(CLAVE_ZONA(uid));
        } catch { /* sin almacenamiento */ }
    },
    mayorDeEdad(uid: string): boolean {
        try { return localStorage.getItem(CLAVE_18(uid)) === '1'; } catch { return false; }
    },
    confirmarMayorDeEdad(uid: string) {
        try { localStorage.setItem(CLAVE_18(uid), '1'); } catch { /* sin almacenamiento */ }
    },
};

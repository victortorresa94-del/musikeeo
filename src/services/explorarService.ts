import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Artist, Listing, ProviderProfile } from '../types';
import type { Categoria } from '../config/categorias';

// Lo que enseña el marketplace. Se lee una vez por colección y se reparte por categorías
// en el cliente: con cientos de fichas basta; con miles habrá que filtrar en Firestore.

export interface Sala {
    uid: string;
    displayName: string;
    photoURL?: string;
    location?: string;
    bio?: string;
}

export type ProviderConFoto = ProviderProfile & { photoURL?: string; city?: string; bio?: string; priceFrom?: number };

const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 60_000;
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL) return hit.data as T;
    const data = await load();
    cache.set(key, { at: Date.now(), data });
    return data;
}

export const explorarService = {
    artistas: () => cached('artistas', async () => {
        const s = await getDocs(query(collection(db, 'artists'), where('isPublic', '==', true), limit(80)));
        return s.docs.map(d => ({ id: d.id, ...d.data() }) as Artist).filter(a => a.artistName && a.slug);
    }),
    tecnicos: () => cached('tecnicos', async () => {
        const s = await getDocs(query(collection(db, 'providers'), where('isPublic', '==', true), limit(60)));
        return s.docs.map(d => ({ id: d.id, ...d.data() }) as ProviderConFoto).filter(p => p.businessName);
    }),
    salas: () => cached('salas', async () => {
        const s = await getDocs(query(collection(db, 'publicProfiles'), where('primaryMode', '==', 'organizer'), limit(60)));
        return s.docs.map(d => d.data() as Sala).filter(x => x.displayName);
    }),
    anuncios: () => cached('anuncios', async () => {
        // Mismo orden que el Mercado: reutiliza su índice (available + urgent + createdAt)
        const s = await getDocs(query(collection(db, 'listings'), where('available', '==', true),
            orderBy('urgent', 'desc'), orderBy('createdAt', 'desc'), limit(80)));
        return s.docs.map(d => ({ id: d.id, ...d.data() }) as Listing);
    }),
};

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Artistas de una categoría de talento, por etiquetas o géneros */
export function artistasDe(cat: Categoria, artistas: Artist[]): Artist[] {
    const et = (cat.etiquetas || []).map(norm);
    return artistas.filter(a => {
        const bolsa = [...(a.tags || []), ...(a.genres || [])].map(norm);
        return et.some(e => bolsa.some(b => b.includes(e)));
    });
}

/** Anuncios de una categoría de equipo */
export function anunciosDe(cat: Categoria, anuncios: Listing[]): Listing[] {
    return anuncios.filter(l =>
        (cat.mercado ? cat.mercado.includes(l.category) : true) &&
        (cat.tipoAnuncio ? (cat.tipoAnuncio === 'alquiler' ? l.type === 'alquiler' || l.type === 'prestamo' : l.type === cat.tipoAnuncio) : true));
}

export const enCiudad = (lugar: string | undefined, ciudad: string | null) =>
    !ciudad || (lugar ? norm(lugar).includes(norm(ciudad)) : false);

export { norm };

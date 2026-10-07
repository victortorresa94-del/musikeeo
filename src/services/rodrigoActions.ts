// Acciones que Rodrigo propone y el usuario CONFIRMA desde el chat.
// Escriben lo mismo que los formularios (CreateListing, PublishEventPage,
// panel de perfil) con la sesión del usuario: las reglas de Firestore aplican igual.
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from '../lib/firebase';
import { eventService } from './eventService';
import { createArtist, calculateProfileCompleteness } from './artistService';
import type { Artist, Event, ListingCategory, ListingCondition, ListingType, RentalUnit, User } from '../types';
import type { EventDraft, ListingDraft, ProfileDraft } from '../lib/rodrigoEngine';

const CATEGORIES: ListingCategory[] = ['guitarras', 'bajos', 'teclados', 'bateria', 'viento', 'accesorios', 'pa_sonido', 'iluminacion', 'recording', 'partituras', 'otros'];
const CONDITIONS: ListingCondition[] = ['nuevo', 'como_nuevo', 'bueno', 'aceptable'];
const TYPES: ListingType[] = ['venta', 'alquiler', 'prestamo'];

const pick = <T extends string>(value: string, allowed: T[], fallback: T): T => {
    const v = value.toLowerCase().trim().replace(/\s+/g, '_') as T;
    return allowed.includes(v) ? v : fallback;
};

const toNumber = (value: string) => {
    const n = Number(String(value).replace(/[^\d.,]/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
};

/** Publica un anuncio del mercado. Devuelve el id del anuncio. */
export async function publishListingDraft(user: FirebaseUser, profile: User | null, d: ListingDraft): Promise<string> {
    const type = pick(d.tipo, TYPES, 'venta');
    const unit: RentalUnit = d.unidad.toLowerCase().startsWith('sem') ? 'semana' : d.unidad.toLowerCase().startsWith('tot') ? 'total' : 'dia';
    const now = new Date().toISOString();
    const ref = await addDoc(collection(db, 'listings'), {
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'Usuario',
        userAvatar: profile?.photoURL || user.photoURL || null,
        userLocation: d.ciudad || profile?.location || '',
        title: d.titulo.trim().slice(0, 100),
        description: d.descripcion.trim().slice(0, 2000),
        category: pick(d.categoria, CATEGORIES, 'otros'),
        condition: pick(d.estado, CONDITIONS, 'bueno'),
        type,
        price: type === 'prestamo' ? 0 : toNumber(d.precio),
        priceUnit: type === 'alquiler' ? unit : null,
        urgent: /^s[ií]|true|urgente/i.test(d.urgente),
        available: true,
        images: [],
        views: 0,
        createdAt: now,
        updatedAt: now,
        createdWith: 'rodrigo',
    });
    return ref.id;
}

/** Publica un bolo / evento en el tablón. Devuelve el id del evento. */
export async function publishEventDraft(user: FirebaseUser, profile: User | null, d: EventDraft): Promise<string> {
    const date = d.date ? `${d.date}T${d.time || '21:00'}` : new Date().toISOString();
    return eventService.createEvent({
        title: d.title.trim().slice(0, 120),
        description: d.description.trim(),
        date,
        location: d.location,
        type: (['gig', 'jam', 'session', 'festival'].includes(d.type) ? d.type : 'gig') as Event['type'],
        price: toNumber(d.budget) || undefined,
        organizerId: user.uid,
        organizerName: profile?.displayName || user.displayName || 'Organizador',
        tags: d.genres,
        createdAt: new Date().toISOString(),
    });
}

/** Crea (o completa) el perfil de artista del usuario y lo hace público. Devuelve el slug. */
export async function publishProfileDraft(user: FirebaseUser, d: ProfileDraft): Promise<string> {
    const artistId = `artist_${user.uid}`;
    const fields: Partial<Artist> = {
        artistName: d.nombre.trim().slice(0, 100),
        city: d.ciudad.trim(),
        bio: d.bio.trim(),
        genres: d.generos,
        tags: [d.formato, ...d.extras].filter(Boolean),
        priceFrom: toNumber(d.precioDesde) || undefined,
    };

    const snap = await getDoc(doc(db, 'artists', artistId));
    let artist: Artist;
    if (snap.exists()) {
        artist = { ...(snap.data() as Artist), ...fields };
    } else {
        artist = await createArtist(user.uid, fields);
    }
    const clean = Object.fromEntries(Object.entries({
        ...fields,
        isPublic: true,
        profileCompleteness: calculateProfileCompleteness(artist),
        updatedAt: new Date().toISOString(),
    }).filter(([, v]) => v !== undefined));
    await updateDoc(doc(db, 'artists', artistId), clean);
    return artist.slug;
}

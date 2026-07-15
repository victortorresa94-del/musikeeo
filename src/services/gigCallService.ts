import {
    collection, doc, query, where, orderBy, limit, startAfter,
    getDocs, getDoc, addDoc, updateDoc,
    type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { GigCall } from '../types';

const COLLECTION = 'gigCalls';
const PAGE_SIZE = 20;

/** Query estándar: abiertos, urgentes primero, más recientes primero. */
export async function getOpenGigCalls(cursor?: QueryDocumentSnapshot | null) {
    const base = [
        collection(db, COLLECTION),
        where('available', '==', true),
        orderBy('urgent', 'desc'),
        orderBy('createdAt', 'desc'),
    ] as const;
    const q = cursor
        ? query(base[0], base[1], base[2], base[3], startAfter(cursor), limit(PAGE_SIZE))
        : query(base[0], base[1], base[2], base[3], limit(PAGE_SIZE));

    const snap = await getDocs(q);
    return {
        items: snap.docs.map(d => ({ id: d.id, ...d.data() } as GigCall)),
        lastDoc: snap.docs[snap.docs.length - 1] ?? null,
        hasMore: snap.docs.length === PAGE_SIZE,
    };
}

export async function getGigCallById(id: string): Promise<GigCall | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as GigCall) : null;
}

/** Crea la petición. `posterId` debe coincidir con auth.uid (las rules lo validan). */
export async function createGigCall(data: Omit<GigCall, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, COLLECTION), data);
    return ref.id;
}

/** Cierra: available=false, closedAt. Solo el poster (validado por rules). */
export async function closeGigCall(id: string): Promise<void> {
    const now = new Date().toISOString();
    await updateDoc(doc(db, COLLECTION, id), {
        available: false,
        closedAt: now,
        updatedAt: now,
    });
}

/** Lista peticiones creadas por un usuario (para su panel). */
export async function getGigCallsByPoster(posterId: string): Promise<GigCall[]> {
    const q = query(
        collection(db, COLLECTION),
        where('posterId', '==', posterId),
        orderBy('createdAt', 'desc'),
        limit(20),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as GigCall));
}

import {
    collection, doc, query, where, orderBy, getDocs,
    runTransaction, updateDoc, increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { GigCallApplication } from '../types';

const COLLECTION = 'gigCallApplications';
const PARENT = 'gigCalls';

/** True si el usuario ya postuló a este gigCall. */
export async function hasApplied(gigCallId: string, applicantId: string): Promise<boolean> {
    const q = query(
        collection(db, COLLECTION),
        where('gigCallId', '==', gigCallId),
        where('applicantId', '==', applicantId),
    );
    const snap = await getDocs(q);
    return !snap.empty;
}

/**
 * Crea la aplicación e incrementa applicantCount en el gigCall padre,
 * de forma atómica. Las rules validan que applicantId === auth.uid y que
 * el gigCall esté abierto.
 */
export async function applyToGigCall(
    input: Omit<GigCallApplication, 'id' | 'status' | 'createdAt'>,
): Promise<string> {
    const appRef = doc(collection(db, COLLECTION));
    const parentRef = doc(db, PARENT, input.gigCallId);
    const now = new Date().toISOString();

    await runTransaction(db, async (tx) => {
        const parent = await tx.get(parentRef);
        if (!parent.exists()) throw new Error('La petición ya no existe');
        if (parent.data().available === false) throw new Error('La petición está cerrada');

        tx.set(appRef, {
            ...input,
            status: 'pending',
            createdAt: now,
        });
        tx.update(parentRef, {
            applicantCount: increment(1),
            updatedAt: now,
        });
    });

    return appRef.id;
}

/** Aplicaciones de un gigCall (solo el poster puede leerlas, vía rules). */
export async function listApplicationsForGigCall(gigCallId: string): Promise<GigCallApplication[]> {
    const q = query(
        collection(db, COLLECTION),
        where('gigCallId', '==', gigCallId),
        orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as GigCallApplication));
}

/** Aplicaciones que YO he enviado (para "mis postulaciones"). */
export async function listMyApplications(applicantId: string): Promise<GigCallApplication[]> {
    const q = query(
        collection(db, COLLECTION),
        where('applicantId', '==', applicantId),
        orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as GigCallApplication));
}

/** Aceptar / rechazar. Solo el poster del gigCall padre (validado por rules). */
export async function decideApplication(
    applicationId: string,
    decision: 'accepted' | 'rejected',
): Promise<void> {
    await updateDoc(doc(db, COLLECTION, applicationId), {
        status: decision,
        decidedAt: new Date().toISOString(),
    });
}

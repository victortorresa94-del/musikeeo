import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { EventCreatorProfile } from '../types';

const ORGANIZERS_COLLECTION = 'organizers';

/**
 * Get organizer profile by user ID
 */
export async function getOrganizerByUserId(userId: string): Promise<EventCreatorProfile | null> {
    try {
        const organizersRef = collection(db, ORGANIZERS_COLLECTION);
        const q = query(organizersRef, where('userId', '==', userId), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as EventCreatorProfile;
    } catch (error) {
        console.error('Error fetching organizer by userId:', error);
        return null;
    }
}

/**
 * Create a new organizer profile
 */
export async function createOrganizer(userId: string, data: Partial<EventCreatorProfile>): Promise<EventCreatorProfile> {
    const organizerId = `org_${userId}`;

    const organizer: EventCreatorProfile = {
        id: organizerId,
        userId,
        displayName: data.displayName || 'Nuevo Organizador',
        companyName: data.companyName,
        isPublic: true,
        createdAt: new Date().toISOString(),
        ...data
    };

    await setDoc(doc(db, ORGANIZERS_COLLECTION, organizerId), organizer);
    return organizer;
}

/**
 * Update organizer profile
 */
export async function updateOrganizer(organizerId: string, data: Partial<EventCreatorProfile>): Promise<void> {
    try {
        const organizerRef = doc(db, ORGANIZERS_COLLECTION, organizerId);
        await updateDoc(organizerRef, {
            ...data
        });
    } catch (error) {
        console.error('Error updating organizer:', error);
        throw error;
    }
}

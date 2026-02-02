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
import type { ProviderProfile } from '../types';

const PROVIDERS_COLLECTION = 'providers';

/**
 * Get all public providers
 */
export async function getPublicProviders(): Promise<ProviderProfile[]> {
    try {
        const providersRef = collection(db, PROVIDERS_COLLECTION);
        const q = query(providersRef, where('isPublic', '==', true));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProviderProfile));
    } catch (error) {
        console.error('Error fetching public providers:', error);
        return [];
    }
}

/**
 * Get provider profile by user ID
 */
export async function getProviderByUserId(userId: string): Promise<ProviderProfile | null> {
    try {
        const providersRef = collection(db, PROVIDERS_COLLECTION);
        const q = query(providersRef, where('userId', '==', userId), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as ProviderProfile;
    } catch (error) {
        console.error('Error fetching provider by userId:', error);
        return null;
    }
}

/**
 * Create a new provider profile
 */
export async function createProvider(userId: string, data: Partial<ProviderProfile>): Promise<ProviderProfile> {
    const providerId = `prov_${userId}`;

    const provider: ProviderProfile = {
        id: providerId,
        userId,
        businessName: data.businessName || 'Nuevo Proveedor',
        providerType: data.providerType || 'freelance',
        services: data.services || [],
        equipmentTypes: data.equipmentTypes || [],
        coverageAreas: data.coverageAreas || [],
        isPublic: true,
        createdAt: new Date().toISOString(),
        ...data
    };

    await setDoc(doc(db, PROVIDERS_COLLECTION, providerId), provider);
    return provider;
}

/**
 * Update provider profile
 */
export async function updateProvider(providerId: string, data: Partial<ProviderProfile>): Promise<void> {
    try {
        const providerRef = doc(db, PROVIDERS_COLLECTION, providerId);
        await updateDoc(providerRef, {
            ...data
        });
    } catch (error) {
        console.error('Error updating provider:', error);
        throw error;
    }
}

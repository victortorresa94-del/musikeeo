import { type User, type UserMode } from '../types';
import { firestoreService } from './firestoreService';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Campos de `users/{uid}` que se pueden enseñar a otros usuarios.
// `users` (con email) solo lo lee su dueño; lo público vive en `publicProfiles/{uid}`.
// verified/stats NO se copian: solo un admin puede escribirlos en publicProfiles.
const PUBLIC_FIELDS = [
    'uid', 'displayName', 'photoURL', 'primaryMode', 'activeModes',
    'location', 'bio', 'skills', 'genres', 'tags', 'createdAt',
] as const;

export type PublicUserProfile = Pick<User, 'uid' | 'displayName' | 'primaryMode'> &
    Partial<Pick<User, 'photoURL' | 'activeModes' | 'location' | 'bio' | 'skills' | 'genres' | 'tags' | 'createdAt' | 'stats' | 'verified'>>;

const pickPublic = (data: Partial<User>) => {
    const out: Record<string, unknown> = {};
    for (const k of PUBLIC_FIELDS) {
        const v = (data as Record<string, unknown>)[k];
        if (v !== undefined) out[k] = v;
    }
    return out;
};

export const userService = {
    /**
     * Copia los campos públicos del usuario a publicProfiles/{uid}.
     * No bloquea: si falla (offline, reglas sin desplegar) solo se registra.
     */
    syncPublicProfile: async (uid: string, data: Partial<User>) => {
        if (uid === 'dev-user-id') return;
        const fields = pickPublic(data);
        if (Object.keys(fields).length === 0) return;
        try {
            await setDoc(doc(db, 'publicProfiles', uid), { ...fields, uid }, { merge: true });
        } catch (error) {
            console.warn('No se pudo sincronizar el perfil público:', error);
        }
    },

    /**
     * Perfil de OTRO usuario (sin email). Usar esto en vez de getUserProfile
     * para perfiles públicos, chats, candidatos, etc.
     */
    getPublicProfile: async (uid: string): Promise<PublicUserProfile | null> => {
        try {
            const snap = await getDoc(doc(db, 'publicProfiles', uid));
            if (snap.exists()) return snap.data() as PublicUserProfile;
        } catch (error) {
            console.warn('publicProfiles no disponible:', error);
        }
        // Transición: perfiles aún sin copia pública. Con las reglas nuevas esta
        // lectura se deniega (users es privado) y simplemente devolvemos null.
        try {
            const snap = await getDoc(doc(db, 'users', uid));
            if (!snap.exists()) return null;
            const { email: _email, ...rest } = snap.data() as User;
            return rest as PublicUserProfile;
        } catch {
            return null;
        }
    },

    /**
     * Creates or updates a user profile in Firestore.
     * Used during registration or first login.
     */
    createUserProfile: async (uid: string, data: Partial<User>) => {
        // DEV BYPASS
        if (uid === 'dev-user-id') {
            return {
                uid,
                email: 'dev@musikeeo.local',
                displayName: 'Usuario Dev',
                createdAt: new Date().toISOString(),
                onboardingCompleted: true, // Auto-complete for dev
                primaryMode: 'musician',
                activeModes: { musician: true, organizer: false, provider: false },
                ...data
            } as User;
        }

        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                const newUser: User = {
                    uid,
                    email: data.email || '',
                    displayName: data.displayName || 'Usuario',
                    photoURL: data.photoURL || '',
                    primaryMode: 'musician', // Default, will change in onboarding
                    activeModes: {
                        musician: false,
                        organizer: false,
                        provider: false
                    },
                    onboardingCompleted: false,
                    createdAt: new Date().toISOString(),
                    ...data
                };
                await setDoc(userRef, newUser);
                await userService.syncPublicProfile(uid, newUser);
                return newUser;
            } else {
                return userSnap.data() as User;
            }
        } catch (error) {
            console.error("Error creating user profile:", error);
            throw error;
        }
    },

    getUserProfile: async (uid: string): Promise<User | null> => {
        if (uid === 'dev-user-id') {
            return {
                uid,
                displayName: 'Usuario Dev',
                email: 'dev@musikeeo.local',
                createdAt: new Date().toISOString(),
                onboardingCompleted: true,
                primaryMode: 'musician',
                activeModes: { musician: true, organizer: false, provider: false }
            } as User;
        }
        try {
            const userSnap = await getDoc(doc(db, 'users', uid));
            if (userSnap.exists()) {
                return userSnap.data() as User;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            throw error;
        }
    },

    updateProfile: async (uid: string, data: Partial<User>) => {
        if (uid === 'dev-user-id') return true;
        try {
            await firestoreService.update('users', uid, data);
            await userService.syncPublicProfile(uid, data);
            return true;
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    },

    /**
     * Activates a specific mode for a user and sets it as primary if requested.
     */
    activateMode: async (uid: string, mode: UserMode, setAsPrimary: boolean = false) => {
        if (uid === 'dev-user-id') return true;
        try {
            const userRef = doc(db, 'users', uid);
            const updates: any = {
                [`activeModes.${mode}`]: true
            };
            if (setAsPrimary) {
                updates.primaryMode = mode;
            }
            await updateDoc(userRef, updates);
            const fresh = await getDoc(userRef);
            if (fresh.exists()) await userService.syncPublicProfile(uid, fresh.data() as User);
            return true;
        } catch (error) {
            console.error("Error activating mode:", error);
            throw error;
        }
    },

    /**
     * Switch primary mode (only if the mode is active)
     */
    switchPrimaryMode: async (uid: string, mode: UserMode) => {
        if (uid === 'dev-user-id') return true;
        try {
            const userRef = doc(db, 'users', uid);
            // Verify if mode is active first could be done here or in UI
            await updateDoc(userRef, {
                primaryMode: mode
            });
            await userService.syncPublicProfile(uid, { primaryMode: mode });
            return true;
        } catch (error) {
            console.error("Error switching mode:", error);
            throw error;
        }
    },

    getNearbyUsers: async (): Promise<(User & { distance: string })[]> => {
        // Mock implementation for feed
        return [];
    }
};

import { type User, type UserMode } from '../types';
import { firestoreService } from './firestoreService';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const userService = {
    /**
     * Creates or updates a user profile in Firestore.
     * Used during registration or first login.
     */
    createUserProfile: async (uid: string, data: Partial<User>) => {
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
        try {
            await firestoreService.update('users', uid, data);
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
        try {
            const userRef = doc(db, 'users', uid);
            const updates: any = {
                [`activeModes.${mode}`]: true
            };
            if (setAsPrimary) {
                updates.primaryMode = mode;
            }
            await updateDoc(userRef, updates);
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
        try {
            const userRef = doc(db, 'users', uid);
            // Verify if mode is active first could be done here or in UI
            await updateDoc(userRef, {
                primaryMode: mode
            });
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

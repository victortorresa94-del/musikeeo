import { MOCK_USERS } from './mockData';
import { type User } from '../types';
import { firestoreService } from './firestoreService';

export const userService = {
    getNearbyUsers: async (): Promise<(User & { distance: string })[]> => {
        try {
            // Attempt to fetch real users from Firestore
            const realUsers = await firestoreService.getAll<User>('users');
            if (realUsers && realUsers.length > 0) {
                return realUsers.map(user => ({
                    ...user,
                    distance: '1.5km' // Placeholder distance logic for now
                }));
            }
            throw new Error("No users found in DB, using mock.");
        } catch (error) {
            console.warn("Using Mock Data for Users:", error);
            // Fallback to mock data
            await new Promise(resolve => setTimeout(resolve, 500));
            return MOCK_USERS.map(user => ({
                ...user,
                distance: user.uid === 'user_1' ? '0.5km' : '1.2km'
            }));
        }
    },

    getUserProfile: async (uid: string): Promise<User | null> => {
        try {
            const user = await firestoreService.getById<User>('users', uid);
            if (!user) {
                // Fallback to mock if not found (or return null in prod)
                console.warn("User not found in Firestore, returning mock for dev.");
                return {
                    uid,
                    email: 'mock@musikeeo.com',
                    displayName: 'Mock User',
                    role: 'musician',
                    stats: { gigs: 0, rating: 0, reviews: 0 }
                } as User;
            }
            return user;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            throw error;
        }
    },

    getCurrentUser: async (): Promise<User> => {
        // Deprecated: prefer getUserProfile with auth.uid
        console.warn("Using deprecated getCurrentUser mock.");
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
            uid: 'current_user',
            email: 'juan@musikeeo.com',
            displayName: 'Juan Pérez',
            role: 'musician',
            location: 'Barcelona',
            photoURL: 'https://i.pravatar.cc/150?u=0',
            stats: { gigs: 10, rating: 5.0, reviews: 3 }
        };
    },

    updateProfile: async (uid: string, data: Partial<User>) => {
        try {
            await firestoreService.update('users', uid, data);
            return true;
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    }
};

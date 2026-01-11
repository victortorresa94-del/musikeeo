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

    getCurrentUser: async (): Promise<User> => {
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
    }
};

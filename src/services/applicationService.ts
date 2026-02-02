import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Application {
    id?: string;
    eventId: string;
    applicantId: string; // User ID
    status: 'pending' | 'accepted' | 'rejected';
    message?: string;
    createdAt: any;
}

export const applicationService = {
    // Check if user has already applied to an event
    hasApplied: async (eventId: string, userId: string): Promise<boolean> => {
        try {
            const q = query(
                collection(db, 'applications'),
                where('eventId', '==', eventId),
                where('applicantId', '==', userId)
            );
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (error) {
            console.error("Error checking application status:", error);
            return false;
        }
    },

    // Apply to an event
    apply: async (eventId: string, userId: string, message: string = ''): Promise<string> => {
        try {
            // Optional: Check again if already applied to prevent duplicates
            const already = await applicationService.hasApplied(eventId, userId);
            if (already) throw new Error("Already applied");

            const docRef = await addDoc(collection(db, 'applications'), {
                eventId,
                applicantId: userId,
                status: 'pending',
                message,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error applying to event:", error);
            throw error;
        }
    },

    // Get applications for an event (for Organizer) - Future implementation
    // getApplicationsForEvent: async (eventId: string) => {
    //    console.log(eventId); 
    //    return [];
    // }
};

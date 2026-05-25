import {
    collection, query, where, getDocs, getDoc, doc, addDoc,
    updateDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Application {
    id?: string;
    eventId: string;
    applicantId: string;
    organizerId: string;
    status: 'pending' | 'accepted' | 'rejected';
    message?: string;
    createdAt: any;
}

export interface ApplicationWithApplicant extends Application {
    applicant?: {
        uid: string;
        displayName?: string;
        photoURL?: string;
        primaryMode?: string;
    };
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

    // Apply to an event (organizerId required so the organizer's read rule is cheap)
    apply: async (
        eventId: string,
        applicantId: string,
        organizerId: string,
        message: string = ''
    ): Promise<string> => {
        const already = await applicationService.hasApplied(eventId, applicantId);
        if (already) throw new Error("Already applied");

        const docRef = await addDoc(collection(db, 'applications'), {
            eventId,
            applicantId,
            organizerId,
            status: 'pending',
            message,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    // Organizer reads all applications for one of their events,
    // joined client-side with the applicant's user profile.
    getApplicationsForEvent: async (eventId: string): Promise<ApplicationWithApplicant[]> => {
        const q = query(
            collection(db, 'applications'),
            where('eventId', '==', eventId)
        );
        const snap = await getDocs(q);
        const apps = snap.docs.map(d => ({ id: d.id, ...d.data() } as Application));

        const enriched = await Promise.all(apps.map(async (a) => {
            try {
                const userSnap = await getDoc(doc(db, 'users', a.applicantId));
                if (userSnap.exists()) {
                    const u = userSnap.data();
                    return {
                        ...a,
                        applicant: {
                            uid: a.applicantId,
                            displayName: u.displayName,
                            photoURL: u.photoURL,
                            primaryMode: u.primaryMode
                        }
                    } as ApplicationWithApplicant;
                }
            } catch (err) {
                console.error("Error loading applicant", a.applicantId, err);
            }
            return a as ApplicationWithApplicant;
        }));

        return enriched;
    },

    // Organizer updates application status
    updateStatus: async (applicationId: string, status: 'accepted' | 'rejected'): Promise<void> => {
        await updateDoc(doc(db, 'applications', applicationId), { status });
    }
};

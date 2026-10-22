import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { type Event } from '../types';
import { db } from '../lib/firebase';
import { firestoreService } from './firestoreService';

export const eventService = {
    getUpcomingEvents: async (): Promise<Event[]> => {
        try {
            const realEvents = await firestoreService.getAll<Event>('events', 20);
            return realEvents || [];
        } catch (error) {
            console.error("Error fetching events:", error);
            return [];
        }
    },

    createEvent: async (eventData: Omit<Event, 'id'>): Promise<string> => {
        try {
            const id = await firestoreService.add('events', eventData);
            return id;
        } catch (error) {
            console.error("Error creating event:", error);
            throw error;
        }
    },

    getEventById: async (id: string): Promise<Event | null> => {
        try {
            const event = await firestoreService.getById<Event>('events', id);
            return event;
        } catch (error) {
            console.error("Error fetching event:", error);
            return null;
        }
    },

    getEventsByOrganizer: async (organizerId: string): Promise<Event[]> => {
        try {
            // This assumes firestoreService has a method for where queries or we add one
            // If not, we might need raw firestore query here
            const events = await firestoreService.getWhere<Event>('events', 'organizerId', '==', organizerId);
            return events;
        } catch (error) {
            console.error("Error fetching organizer events:", error);
            return [];
        }
    },

    /** Cuántos bolos ha publicado alguien: una consulta de recuento, sin traer los documentos.
     *  Si falla, lanza: quien lo pinte no enseña el dato */
    contarBolosDe: async (organizerId: string): Promise<number> => {
        const snap = await getCountFromServer(query(collection(db, 'events'), where('organizerId', '==', organizerId)));
        return snap.data().count;
    }
};

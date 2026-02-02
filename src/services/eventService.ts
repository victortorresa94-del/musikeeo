import { type Event } from '../types';
import { firestoreService } from './firestoreService';

export const eventService = {
    getUpcomingEvents: async (): Promise<Event[]> => {
        try {
            const realEvents = await firestoreService.getAll<Event>('events');
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
    }
};

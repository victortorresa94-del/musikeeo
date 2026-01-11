import { MOCK_EVENTS } from './mockData';
import { type Event } from '../types';
import { firestoreService } from './firestoreService';

export const eventService = {
    getUpcomingEvents: async (): Promise<Event[]> => {
        try {
            const realEvents = await firestoreService.getAll<Event>('events');
            if (realEvents && realEvents.length > 0) {
                return realEvents;
            }
            throw new Error("No events in DB");
        } catch (error) {
            console.warn("Using Mock Events:", error);
            await new Promise(resolve => setTimeout(resolve, 600)); // Simulate net lag
            return MOCK_EVENTS;
        }
    },

    createEvent: async (eventData: Omit<Event, 'id'>): Promise<string> => {
        try {
            const id = await firestoreService.add('events', eventData);
            return id;
        } catch (error) {
            console.warn("Mock Create Event:", error);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return 'mock_event_id_' + Date.now();
        }
    }
};

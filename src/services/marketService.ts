import { type MarketItem } from '../types';
import { firestoreService } from './firestoreService';

export const marketService = {
    getItems: async (category?: string): Promise<MarketItem[]> => {
        try {
            const realItems = await firestoreService.getAll<MarketItem>('market_items');
            if (realItems && realItems.length > 0) {
                return category && category !== 'all'
                    ? realItems.filter(i => i.category === category)
                    : realItems;
            }
            return [];
        } catch (error) {
            console.error("Error fetching market items:", error);
            return [];
        }
    },

    getItemById: async (id: string): Promise<MarketItem | null> => {
        try {
            const item = await firestoreService.getById<MarketItem>('market_items', id);
            return item;
        } catch (error) {
            console.error("Error fetching market item:", error);
            return null;
        }
    },

    createItem: async (item: Omit<MarketItem, 'id'>): Promise<string> => {
        try {
            const id = await firestoreService.add('market_items', item);
            return id;
        } catch (error) {
            console.error("Error creating market item", error);
            throw error;
        }
    }
};

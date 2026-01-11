import { MOCK_MARKET_ITEMS } from './mockData';
import { type MarketItem } from '../types';
import { firestoreService } from './firestoreService';

export const marketService = {
    getItems: async (category?: string): Promise<MarketItem[]> => {
        try {
            // In a real app we would query by category here
            const realItems = await firestoreService.getAll<MarketItem>('market_items');
            if (realItems && realItems.length > 0) {
                return category && category !== 'all'
                    ? realItems.filter(i => i.category === category)
                    : realItems;
            }
            throw new Error("No market items in DB");
        } catch (error) {
            console.warn("Using Mock Market Items:", error);
            await new Promise(resolve => setTimeout(resolve, 400));

            let items = MOCK_MARKET_ITEMS;
            if (category && category !== 'all') {
                // Approximate mapping for mock data categories
                // Categories in mock: 'instrument', 'service', 'space', 'other'
                // Categories in UI: 'instruments', 'recording', 'services', 'venues'
                const map: Record<string, string> = {
                    'instruments': 'instrument',
                    'services': 'service',
                    'recording': 'service', // Mock simplification
                    'venues': 'space'
                };
                const mockCat = map[category];
                if (mockCat) {
                    items = items.filter(i => i.category === mockCat);
                }
            }
            return items;
        }
    }
};

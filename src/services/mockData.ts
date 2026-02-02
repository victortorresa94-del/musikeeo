import { type Event, type MarketItem, type FeedPost } from '../types';

export const MOCK_EVENTS: Event[] = [];

export const MOCK_MARKET_ITEMS: MarketItem[] = [];

export const MOCK_FEED_POSTS: FeedPost[] = [];

// Helper function to get more feed posts (simulating infinite scroll)
export const getMoreFeedPosts = (_page: number): FeedPost[] => {
    return [];
};

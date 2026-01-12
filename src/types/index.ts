export type UserRole = 'musician' | 'technician' | 'promoter' | 'venue' | 'fan';

export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
    location?: string;
    bio?: string;
    skills?: string[];
    genres?: string[];
    tags?: string[];
    stats?: {
        gigs: number;
        rating: number;
        reviews: number;
    };
    verified?: boolean;
}

export interface Event {
    id: string;
    title: string;
    organizerId: string;
    organizerName: string;
    date: string; // ISO string
    location: string;
    description?: string;
    type: 'gig' | 'jam' | 'session' | 'festival';
    imageUrl?: string;
    tags?: string[];
    price?: number;
}

export interface MarketItem {
    id: string;
    sellerId: string;
    title: string;
    price: number;
    category: 'instrument' | 'service' | 'space' | 'other';
    image: string;
    location: string;
    description?: string;
    seller?: string;
    rating?: number;
    reviews?: number;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
    isSystem?: boolean;
    read?: boolean;
}

export type FeedPostType = 'post' | 'event_highlight' | 'market_highlight' | 'milestone' | 'announcement';

export interface FeedPost {
    id: string;
    type: FeedPostType;
    authorId: string;
    authorName: string;
    authorPhoto: string;
    authorRole: UserRole;
    authorVerified?: boolean;
    content: string;
    images?: string[];
    videoUrl?: string;
    timestamp: number;
    likes: number;
    comments: number;
    shares: number;
    isLiked?: boolean;
    // For event highlights
    eventId?: string;
    eventData?: Partial<Event>;
    // For market highlights
    marketItemId?: string;
    marketData?: Partial<MarketItem>;
    // For milestones
    milestoneType?: 'gig_completed' | 'new_collab' | 'achievement';
    tags?: string[];
}

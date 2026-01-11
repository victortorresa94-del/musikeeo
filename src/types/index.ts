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
    rating?: number;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
    isSystem?: boolean;
}

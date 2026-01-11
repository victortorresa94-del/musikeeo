import { type User, type Event, type MarketItem } from '../types';

export const MOCK_USERS: User[] = [
    {
        uid: 'user_1',
        email: 'lucas@example.com',
        displayName: 'Lucas Guitar',
        role: 'musician',
        location: 'Gràcia, BCN',
        photoURL: 'https://i.pravatar.cc/150?u=1',
        tags: ['Guitarra', 'Jazz'],
        stats: { gigs: 45, rating: 4.8, reviews: 12 },
        verified: true
    },
    {
        uid: 'user_2',
        email: 'ana@example.com',
        displayName: 'Ana Vocals',
        role: 'musician',
        location: 'Poble Sec, BCN',
        photoURL: 'https://i.pravatar.cc/150?u=2',
        tags: ['Voz', 'Soul'],
        stats: { gigs: 30, rating: 4.9, reviews: 8 }
    }
];

export const MOCK_EVENTS: Event[] = [
    {
        id: 'evt_1',
        title: "Buscamos Bajista para Tour",
        organizerId: 'org_1',
        organizerName: "La Radio Band",
        location: "Madrid, ES",
        date: "2026-06-15T20:00:00Z",
        type: 'gig',
        imageUrl: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&q=80",
        tags: ["Gira", "Remunerado"]
    },
    {
        id: 'evt_2',
        title: "Sesión de Grabación (Trumpet)",
        organizerId: 'org_2',
        organizerName: "Sonic Studios",
        location: "Barcelona, Gràcia",
        date: "2026-03-12T10:00:00Z",
        type: 'session',
        imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80",
        tags: ["Session", "Jazz"]
    }
];

export const MOCK_MARKET_ITEMS: MarketItem[] = [
    {
        id: 'mkt_1',
        sellerId: 'user_5',
        title: "Marshall JCM800 Original",
        price: 50,
        category: 'instrument',
        location: '2.5 km',
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1560243563-062bfc001d68?w=800&q=80"
    },
    {
        id: 'mkt_2',
        sellerId: 'user_6',
        title: "Fender Strat - Custom Shop",
        price: 35,
        category: 'instrument',
        location: '500m',
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1550291652-6ea9114a47b1?w=800&q=80"
    }
];

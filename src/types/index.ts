export type UserMode = 'musician' | 'organizer' | 'provider';

export interface DiscoverMusician {
    id: string;
    name: string;
    role: string;
    instrument?: string;
    genres: string[];
    location: string;
    city: string;
    photoURL: string;
    rating: number;
    verified: boolean;
    available: boolean;
    experience: 'junior' | 'mid' | 'senior';
    priceRange: 'low' | 'medium' | 'high';
}

export interface DiscoverBand {
    id: string;
    name: string;
    genre: string;
    genres: string[];
    members: number;
    location: string;
    city: string;
    coverImage: string;
    rating: number;
    verified: boolean;
    available: boolean;
    forHire: boolean;
}

export interface DiscoverTechnician {
    id: string;
    name: string;
    role: string;
    specialties: string[];
    location: string;
    city: string;
    photoURL: string;
    rating: number;
    verified: boolean;
    available: boolean;
    experience: 'junior' | 'mid' | 'senior';
}

export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;

    // Identity & Modes
    primaryMode: UserMode;
    activeModes: {
        musician: boolean;
        organizer: boolean;
        provider: boolean;
    };
    onboardingCompleted: boolean;

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
    createdAt?: string;
    eventCreatorProfileId?: string;
}

export type UserProfile = User;

export type MusicianProfile = Artist; // Alias for existing Artist interface

export interface EventCreatorProfile {
    id: string;
    userId: string;
    displayName: string;
    companyName?: string;
    isPublic: boolean;
    createdAt: string;
}

export interface ProviderProfile {
    id: string;
    userId: string;
    businessName: string;
    providerType: 'empresa' | 'freelance';
    services: string[];
    equipmentTypes: string[];
    coverageAreas: string[];
    isPublic: boolean;
    createdAt: string;
}

export interface Event {
    id: string;
    title: string;
    organizerId: string;
    organizerName: string;
    date: string; // ISO string
    location: string;
    description?: string;
    type: 'gig' | 'jam' | 'session' | 'festival' | 'Gig' | 'Jam' | 'Session' | 'Festival' | 'Boda / Social' | 'Evento Privado' | 'Residencia / Bar' | 'Otro';
    imageUrl?: string;
    tags?: string[];
    price?: number;
    createdAt?: string;
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
    authorRole: UserMode;
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

// ==========================================
// ARTIST / MUSICIAN TYPES
// ==========================================

export type AvailabilityState = 'available' | 'occupied' | 'blocked' | 'none';

export interface DayAvailability {
    date: string; // ISO date string (YYYY-MM-DD)
    status: AvailabilityState;
    eventName?: string; // For 'occupied' days
    eventId?: string;
}

export interface ServicePackage {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    duration: number; // hours
    extraHourPrice?: number;
    includesEquipment?: boolean;
    includesTravel?: boolean;
    travelRadius?: number; // km
    includes?: string[]; // List of what's included
    imageUrl?: string;
    isActive: boolean;
}

export interface ArtistMultimedia {
    spotifyUri?: string;
    spotifyVisible?: boolean;
    videos: {
        id: string;
        url: string;
        title: string;
        platform: 'youtube' | 'vimeo';
        thumbnailUrl?: string;
        duration?: string;
    }[];
    photos: {
        id: string;
        url: string;
        caption?: string;
        isCover?: boolean;
        order: number;
    }[];
}

export interface Artist {
    id: string;
    slug: string; // URL-friendly identifier
    userId: string; // Reference to auth user

    // Identity
    artistName: string;
    profilePhoto?: string;
    coverPhoto?: string;
    isVerified: boolean;

    // Location
    city: string;
    region?: string;
    country: string;
    coordinates?: { lat: number; lng: number };

    // Profile
    bio: string;
    genres: string[];
    tags: string[]; // e.g., "Equipo propio", "Viaja", "Idiomas: EN/ES"

    // Stats
    rating: number;
    reviewCount: number;
    gigsCompleted: number;

    // Services
    packages: ServicePackage[];
    priceFrom?: number; // Calculated min price

    // Multimedia
    multimedia: ArtistMultimedia;

    // Availability
    availability: DayAvailability[];
    calendarSyncEnabled?: boolean;

    // Settings
    isPublic: boolean;
    profileCompleteness: number; // 0-100

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

// Booking / Contact Request
export interface BookingRequest {
    id: string;
    artistId: string;
    organizerId: string;

    eventDate: string;
    eventType: string;
    eventLocation: string;
    eventDescription?: string;

    packageId?: string;
    estimatedBudget?: number;

    status: 'pending' | 'accepted' | 'declined' | 'negotiating';

    createdAt: string;
    messages?: {
        senderId: string;
        text: string;
        timestamp: string;
    }[];
}

// Search Filters
export interface ArtistSearchFilters {
    query?: string;
    genres?: string[];
    city?: string;
    date?: string; // Single date
    dateRange?: { start: string; end: string };
    priceMin?: number;
    priceMax?: number;
    format?: string; // solo, duo, band, dj
    hasAvailability?: boolean;
    isVerified?: boolean;
    sortBy?: 'relevance' | 'rating' | 'price' | 'distance';
}

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

export interface DetallesBolo {
    formato?: string;      // 'Banda de 3 a 5 músicos'
    duracion?: string;     // '2 pases de 45 min'
    repertorio?: string;   // 'Versiones conocidas y algún tema propio'
    llegada?: string;      // '19:30' (llegada / prueba de sonido)
    sonido?: 'incluido' | 'sin_tecnico' | 'lo_trae_la_banda';
    escenario?: string;    // 'Sí, 6 × 4 m'
    parking?: string;      // 'Carga y descarga en la puerta'
    comida?: string;       // 'Cena para la banda'
    pago?: string;         // 'Transferencia, 7 días después'
    desplazamiento?: 'incluido' | 'aparte' | 'no_aplica';
    lugar?: string;        // 'Masía Can Ribes'
    invitados?: number;    // invitados o aforo
    espacio?: 'interior' | 'exterior';
    cierra?: string;       // 'YYYY-MM-DD', último día para postularse
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
    detalles?: DetallesBolo; // lo opcional del paso 3 de Publicar; solo las claves rellenas
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
    // Propuesta de bolo dentro del chat: se cierra el trato aquí y no por WhatsApp
    tipo?: 'texto' | 'propuesta' | 'respuesta';
    propuesta?: PropuestaBolo;
    propuestaId?: string;      // en una respuesta: a qué propuesta contesta
    aceptada?: boolean;        // en una respuesta
}

// Lo que se acuerda de un bolo en el chat. Sin pago todavía: queda por escrito para los dos
export interface PropuestaBolo {
    fecha: string;             // AAAA-MM-DD
    hora?: string;             // HH:MM
    sitio: string;
    cache: number;             // euros
    duracion?: string;         // «2 h», «3 pases de 45 min»…
    notas?: string;
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

/** Enlaces de un artista: solo URL https completas */
export interface RedesArtista {
    web?: string;
    instagram?: string;
    youtube?: string;
    spotify?: string;
    soundcloud?: string;
    bandcamp?: string;
    tiktok?: string;
    facebook?: string;
}

export interface Artist {
    id: string;
    slug: string; // URL-friendly identifier
    userId: string; // Reference to auth user

    // Identity
    artistName: string;
    profilePhoto?: string;
    coverPhoto?: string;
    clipUrl?: string;
    clipPoster?: string;
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
    ficha?: {
        formacion?: string;     // 'Dos guitarras, cajón y voz'
        musicos?: number;       // 4
        duracion?: string;      // '2 h de show'
        repertorio?: string;    // 'Rumba catalana, pop, versiones'
        equipo?: string;        // 'Llevan sonido para 150 personas'
        viaja?: string;         // 'Cataluña y alrededores'
        idiomas?: string;       // 'Castellano, catalán'
        idealPara?: string[];   // ['Bodas','Fiestas','Salas','Terrazas']
    };
    // Su web y sus redes (las rellena «Rellénalo con tu web o tu Instagram» o la persona).
    // La ficha pública no las enseña: el contacto va por Musikeeo (como en el chat)
    redes?: RedesArtista;

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


export type ListingCategory =
    | 'guitarras' | 'bajos' | 'teclados' | 'bateria' | 'viento'
    | 'accesorios' | 'pa_sonido' | 'iluminacion' | 'recording'
    | 'partituras' | 'cuerdas' | 'otros';

export type ListingType = 'venta' | 'alquiler' | 'prestamo';

export type ListingCondition = 'nuevo' | 'como_nuevo' | 'bueno' | 'aceptable';

export type RentalUnit = 'total' | 'dia' | 'semana';

export interface Listing {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    userLocation: string;
    userWhatsApp?: string;

    title: string;        // max 60
    description: string;  // max 300
    category: ListingCategory;
    condition: ListingCondition;

    type: ListingType;
    price: number;            // 0 si type === 'prestamo'
    priceUnit?: RentalUnit;   // solo si type === 'alquiler'

    urgent: boolean;
    available: boolean;

    images: string[];
    views?: number;

    createdAt: string;
    updatedAt: string;
}

// Publicación propia en el Feed (foto o vídeo)
export interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorPhoto?: string;
    authorRole?: UserMode;
    mediaType: 'image' | 'video';
    mediaUrl: string;
    mediaPath: string;       // ruta en Storage, para borrarla
    posterUrl?: string;      // miniatura del vídeo
    posterPath?: string;
    caption: string;
    etiquetas?: string[];    // estilos del autor y #etiquetas del texto, para el algoritmo del Feed
    ciudad?: string;         // ciudad del autor al publicar
    createdAt: string;       // ISO
    // Los me gusta y comentarios van en interacciones/post_{id} (services/interaccionService)
}

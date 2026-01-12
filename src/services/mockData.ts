import { type User, type Event, type MarketItem, type FeedPost } from '../types';

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
    // === INSTRUMENTOS (4 items) ===
    {
        id: 'mkt_1',
        sellerId: 'user_5',
        title: "Fender Stratocaster '62 Sunburst",
        description: "Guitarra eléctrica Fender Stratocaster Custom Shop, réplica del 62. Mástil de arce, pastillas originales. Incluye estuche rígido Fender. Muy buen estado, solo marcas de uso normal.",
        price: 1850,
        category: 'instrument',
        location: 'Gràcia, Barcelona',
        rating: 4.9,
        seller: 'Lucas Guitar',
        reviews: 12,
        image: "/images/market/fender_stratocaster_1768143437660.png"
    },
    {
        id: 'mkt_2',
        sellerId: 'user_6',
        title: "Martin D-28 Acoustic Guitar",
        description: "Guitarra acústica Martin D-28, madera maciza de sitka y palisandro. Sonido potente y cálido, perfecta para fingerpicking y strumming. Incluye humidificador y estuche.",
        price: 2200,
        category: 'instrument',
        location: 'Eixample, Barcelona',
        rating: 5.0,
        seller: 'Ana Vocals',
        reviews: 8,
        image: "/images/market/acoustic_guitar_1768143458560.png"
    },
    {
        id: 'mkt_3',
        sellerId: 'user_7',
        title: "DW Collector's Drum Kit",
        description: "Batería DW Collector's Series completa: bombo 22, toms 10/12/16, caja 14x5.5. Acabado Black Pearl. Incluye herrajes DW 9000 y platos Zildjian K. Estado impecable.",
        price: 4500,
        category: 'instrument',
        location: 'Poble Nou, Barcelona',
        rating: 4.8,
        seller: 'Pau Drummer',
        reviews: 6,
        image: "/images/market/drum_kit_1768143481232.png"
    },
    {
        id: 'mkt_4',
        sellerId: 'user_8',
        title: "Fender Jazz Bass - Black",
        description: "Bajo eléctrico Fender Jazz Bass American Professional II, acabado negro con pickguard tortoise. Electrónica activa, sonido versátil. Como nuevo.",
        price: 1650,
        category: 'instrument',
        location: 'Sant Andreu, Barcelona',
        rating: 4.7,
        seller: 'Marc Bass',
        reviews: 5,
        image: "/images/market/bass_guitar_1768143506123.png"
    },

    // === ESTUDIO / GRABACIÓN (3 items) ===
    {
        id: 'mkt_5',
        sellerId: 'studio_1',
        title: "Sesión de Grabación - 8h",
        description: "Pack de grabación profesional: 8 horas de estudio con ingeniero incluido. Sala tratada acústicamente, mesa SSL, micrófonos Neumann y AKG. Mezcla básica incluida.",
        price: 400,
        category: 'service',
        location: 'Poblenou, Barcelona',
        rating: 4.9,
        seller: 'Sonic Studios',
        reviews: 45,
        image: "/images/market/recording_studio_1768143540955.png"
    },
    {
        id: 'mkt_6',
        sellerId: 'user_9',
        title: "Neumann U87 AI - Como Nuevo",
        description: "Micrófono de condensador Neumann U87 AI con suspensión elástica y pop filter original. Menos de 100 horas de uso, incluye caja original y certificado.",
        price: 2800,
        category: 'service',
        location: 'Les Corts, Barcelona',
        rating: 5.0,
        seller: 'Marc Sound Tech',
        reviews: 3,
        image: "/images/market/microphone_pro_1768143562847.png"
    },
    {
        id: 'mkt_7',
        sellerId: 'user_10',
        title: "Universal Audio Apollo x8p",
        description: "Interfaz de audio Apollo x8p con 8 preamps Unison y DSP para plugins UAD. Conectividad Thunderbolt 3. En perfecto estado, actualizado a último firmware.",
        price: 3200,
        category: 'service',
        location: 'Hospitalet, Barcelona',
        rating: 4.8,
        seller: 'Studio Pro',
        reviews: 7,
        image: "/images/market/audio_interface_1768143585622.png"
    },

    // === SALAS / ESPACIOS (3 items) ===
    {
        id: 'mkt_8',
        sellerId: 'venue_1',
        title: "Sala Concerts - Aforo 200",
        description: "Sala de conciertos íntima con escenario profesional, sistema de sonido L-Acoustics y iluminación LED programable. Disponible para alquiler por día o evento.",
        price: 800,
        category: 'space',
        location: 'Raval, Barcelona',
        rating: 4.6,
        seller: 'The Music Hall',
        reviews: 23,
        image: "/images/market/concert_venue_1768143610025.png"
    },
    {
        id: 'mkt_9',
        sellerId: 'venue_2',
        title: "Sala de Ensayo Equipada",
        description: "Local de ensayo completamente equipado: batería, amplificadores de guitarra y bajo, PA básico y microfonía. Climatizado, disponible 24h con llave propia.",
        price: 15,
        category: 'space',
        location: 'Gràcia, Barcelona',
        rating: 4.5,
        seller: 'Rehearsal BCN',
        reviews: 67,
        image: "/images/market/rehearsal_space_1768143644276.png"
    },

    // === SERVICIOS (2 items) ===
    {
        id: 'mkt_10',
        sellerId: 'user_11',
        title: "Técnico de Sonido Directo",
        description: "Servicio profesional de técnico de sonido para eventos en directo. +10 años de experiencia en festivales y salas. Incluye mesa digital, microfonía y PA portátil.",
        price: 350,
        category: 'service',
        location: 'Barcelona (toda la zona)',
        rating: 4.9,
        seller: 'Carlos FOH',
        reviews: 34,
        image: "/images/market/sound_engineer_1768143670792.png"
    },

    // === MÁS INSTRUMENTOS (2 items adicionales) ===
    {
        id: 'mkt_11',
        sellerId: 'user_12',
        title: "Moog Sub 37 Synthesizer",
        description: "Sintetizador analógico Moog Sub 37 Tribute Edition. 2 osciladores, filtro Moog clásico, secuenciador y arpeggiador. Estado impecable, siempre en estudio.",
        price: 1400,
        category: 'instrument',
        location: 'Sarrià, Barcelona',
        rating: 4.8,
        seller: 'DJ Electra',
        reviews: 4,
        image: "/images/market/keyboard_synth_1768143696161.png"
    },
    {
        id: 'mkt_12',
        sellerId: 'user_13',
        title: "Marshall JCM800 Stack",
        description: "Amplificador Marshall JCM800 2203 cabezal + pantalla 4x12 1960A. Válvulas originales, sonido legendario del rock. Alguna marca estética pero funciona perfecto.",
        price: 2500,
        category: 'instrument',
        location: 'Sants, Barcelona',
        rating: 4.7,
        seller: 'Rock Vintage',
        reviews: 9,
        image: "/images/market/guitar_amplifier_1768143723681.png"
    }
];

export const MOCK_FEED_POSTS: FeedPost[] = [
    // REEL 1 - A video post
    {
        id: 'reel_1',
        type: 'post',
        authorId: 'user_1',
        authorName: 'Lucas Guitar',
        authorPhoto: 'https://i.pravatar.cc/150?u=1',
        authorRole: 'musician',
        authorVerified: true,
        content: '🎸 "Mi Estrella Blanca" - Nueva canción que estamos trabajando. ¿Qué os parece? #guitar #original #music',
        videoUrl: 'https://play.gumlet.io/embed/6963c2166a1e75f7abe3dc25',
        images: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80'],
        timestamp: Date.now() - 1000 * 60 * 60 * 2,
        likes: 2340,
        comments: 156,
        shares: 89,
        tags: ['guitar', 'original', 'music', 'rock']
    },
    {
        id: 'post_1',
        type: 'post',
        authorId: 'user_1',
        authorName: 'Lucas Guitar',
        authorPhoto: 'https://i.pravatar.cc/150?u=1',
        authorRole: 'musician',
        authorVerified: true,
        content: '🎸 Acabo de terminar una sesión increíble en Sonic Studios. El nuevo material suena brutal, pronto más noticias... #NewMusic #Recording',
        images: ['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80'],
        timestamp: Date.now() - 1000 * 60 * 30, // 30 min ago
        likes: 127,
        comments: 23,
        shares: 8,
        tags: ['Recording', 'Jazz']
    },
    // REEL 2
    {
        id: 'reel_2',
        type: 'post',
        authorId: 'user_2',
        authorName: 'Ana Vocals',
        authorPhoto: 'https://i.pravatar.cc/150?u=2',
        authorRole: 'musician',
        authorVerified: true,
        content: '✨ Sesión de estudio grabando nuevas voces! El productor está flipando 🎤 #vocals #recording #studio',
        videoUrl: 'https://play.gumlet.io/embed/6963c1ccb25141dfa475aa17',
        images: ['https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&q=80'],
        timestamp: Date.now() - 1000 * 60 * 60 * 5,
        likes: 5620,
        comments: 342,
        shares: 178,
        tags: ['vocals', 'recording', 'studio', 'music']
    },
    {
        id: 'post_2',
        type: 'event_highlight',
        authorId: 'org_1',
        authorName: 'La Radio Band',
        authorPhoto: 'https://i.pravatar.cc/150?u=band1',
        authorRole: 'musician',
        content: '🔥 ¡SOLD OUT! El concierto de mañana en Razzmatazz está completo. Gracias a todos los que venis, va a ser una noche memorable.',
        images: ['https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80'],
        timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2h ago
        likes: 342,
        comments: 67,
        shares: 45,
        eventId: 'evt_1',
        eventData: {
            title: 'La Radio Band en Razzmatazz',
            date: '2026-01-15T21:00:00Z',
            location: 'Razzmatazz, Barcelona'
        }
    },
    {
        id: 'post_3',
        type: 'milestone',
        authorId: 'user_2',
        authorName: 'Ana Vocals',
        authorPhoto: 'https://i.pravatar.cc/150?u=2',
        authorRole: 'musician',
        content: '🎉 ¡50 bolos completados en Musikeeo! Gracias a todos los que habéis confiado en mi voz. Esto es solo el principio. 💫',
        timestamp: Date.now() - 1000 * 60 * 60 * 4, // 4h ago
        likes: 89,
        comments: 34,
        shares: 12,
        milestoneType: 'gig_completed'
    },
    // REEL 3
    {
        id: 'reel_3',
        type: 'post',
        authorId: 'user_3',
        authorName: 'DJ Electronic',
        authorPhoto: 'https://i.pravatar.cc/150?u=3',
        authorRole: 'musician',
        authorVerified: false,
        content: '🔥 Preview del set de anoche en Razzmatazz! La gente estaba increíble 🎉 #dj #electronic #barcelona',
        videoUrl: 'https://play.gumlet.io/embed/6963c186b25141dfa475a66b',
        images: ['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80'],
        timestamp: Date.now() - 1000 * 60 * 60 * 8,
        likes: 8920,
        comments: 567,
        shares: 423,
        tags: ['dj', 'electronic', 'barcelona', 'party']
    },
    {
        id: 'post_4',
        type: 'post',
        authorId: 'user_3',
        authorName: 'DJ Electra',
        authorPhoto: 'https://i.pravatar.cc/150?u=3',
        authorRole: 'musician',
        authorVerified: true,
        content: 'El set de anoche en Apolo fue una locura 🔊 4 horas non-stop de house progresivo. Gracias Barcelona por la energía! Video del closing:',
        videoUrl: 'https://example.com/video',
        images: ['https://images.unsplash.com/photo-1571266028434-18f17f0da1b8?w=800&q=80', 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=800&q=80'],
        timestamp: Date.now() - 1000 * 60 * 60 * 8, // 8h ago
        likes: 521,
        comments: 89,
        shares: 156,
        tags: ['House', 'DJ', 'Apolo']
    },
    {
        id: 'post_5',
        type: 'market_highlight',
        authorId: 'user_5',
        authorName: 'Marc Sound Tech',
        authorPhoto: 'https://i.pravatar.cc/150?u=5',
        authorRole: 'technician',
        content: '📢 Acabo de poner en venta mi Marshall JCM800 original del 84. Está en perfecto estado, solo para entendidos. DM para más info.',
        images: ['https://images.unsplash.com/photo-1560243563-062bfc001d68?w=800&q=80'],
        timestamp: Date.now() - 1000 * 60 * 60 * 12, // 12h ago
        likes: 67,
        comments: 23,
        shares: 5,
        marketItemId: 'mkt_1',
        marketData: {
            title: 'Marshall JCM800 Original',
            price: 2500
        }
    },
    {
        id: 'post_6',
        type: 'post',
        authorId: 'user_6',
        authorName: 'Carmen Keys',
        authorPhoto: 'https://i.pravatar.cc/150?u=6',
        authorRole: 'musician',
        content: 'Buscando tecladista para proyecto de neo-soul en Barcelona. Ensayamos 2 veces por semana en Gràcia. Si te mola el groove y tienes buen oído, escríbeme! 🎹✨',
        timestamp: Date.now() - 1000 * 60 * 60 * 16, // 16h ago
        likes: 45,
        comments: 67,
        shares: 23,
        tags: ['NeoSoul', 'Keyboard', 'Barcelona']
    },
    {
        id: 'post_7',
        type: 'announcement',
        authorId: 'admin',
        authorName: 'Musikeeo',
        authorPhoto: '/logo-musikeeo.png',
        authorRole: 'promoter',
        authorVerified: true,
        content: '🚀 ¡Nueva función! Ahora puedes crear eventos colaborativos y buscar artistas directamente desde el feed. Explora las nuevas herramientas en tu perfil.',
        images: ['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80'],
        timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        likes: 234,
        comments: 45,
        shares: 89
    },
    {
        id: 'post_8',
        type: 'post',
        authorId: 'user_7',
        authorName: 'Pau Drummer',
        authorPhoto: 'https://i.pravatar.cc/150?u=7',
        authorRole: 'musician',
        content: 'Primera vez tocando con click en directo... ¡y no me perdí! 🥁 Se puede, solo hay que practicar. Gracias @BandaX por la oportunidad.',
        images: ['https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800&q=80'],
        timestamp: Date.now() - 1000 * 60 * 60 * 28, // 28h ago
        likes: 78,
        comments: 12,
        shares: 3,
        tags: ['Drums', 'LiveMusic']
    },
    {
        id: 'post_9',
        type: 'event_highlight',
        authorId: 'venue_1',
        authorName: 'Jamboree Jazz Club',
        authorPhoto: 'https://i.pravatar.cc/150?u=jamboree',
        authorRole: 'venue',
        authorVerified: true,
        content: '🎺 Esta semana: Jam Session abierta todos los miércoles a las 22h. Trae tu instrumento y únete. ¡El jazz sigue vivo en Barcelona!',
        images: ['https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80'],
        timestamp: Date.now() - 1000 * 60 * 60 * 36, // 36h ago
        likes: 189,
        comments: 34,
        shares: 67,
        eventData: {
            title: 'Jam Session Abierta',
            date: '2026-01-15T22:00:00Z',
            location: 'Jamboree Jazz Club'
        }
    },
    {
        id: 'post_10',
        type: 'milestone',
        authorId: 'user_8',
        authorName: 'Sonic Studios',
        authorPhoto: 'https://i.pravatar.cc/150?u=sonic',
        authorRole: 'technician',
        authorVerified: true,
        content: '🏆 ¡100 proyectos grabados este año! Gracias a todos los artistas que han pasado por el estudio. 2026 viene cargado de buena música.',
        images: ['https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=800&q=80'],
        timestamp: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
        likes: 312,
        comments: 56,
        shares: 23,
        milestoneType: 'achievement'
    }
];

// Helper function to get more feed posts (simulating infinite scroll)
export const getMoreFeedPosts = (page: number): FeedPost[] => {
    const basePosts = [...MOCK_FEED_POSTS];
    return basePosts.map((post, index) => ({
        ...post,
        id: `${post.id}_page_${page}_${index}`,
        timestamp: post.timestamp - (page * 1000 * 60 * 60 * 72), // Older by 3 days per page
        likes: Math.floor(post.likes * (0.5 + Math.random())),
        comments: Math.floor(post.comments * (0.5 + Math.random())),
    }));
};

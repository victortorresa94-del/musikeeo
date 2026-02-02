import { type Reel, type ReelComment } from '../types/reels';

// Videos de Gumlet - IDs de los videos proporcionados
const GUMLET_VIDEO_IDS = [
    '6963c2166a1e75f7abe3dc25', // Mi estrella blanca
    '6963c1ccb25141dfa475aa17',
    '6963c186b25141dfa475a66b',
    '6963c128b25141dfa475a19c',
    '6963c0e26a1e75f7abe3cc3b',
    '6963c0a2b25141dfa47599fd',
];

// Función para generar la URL del player embed de Gumlet
const getGumletPlayerUrl = (videoId: string) => `https://play.gumlet.io/embed/${videoId}`;

// Thumbnails musicales de alta calidad para cada video
const MUSIC_THUMBNAILS = [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80', // Concierto
    'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&q=80', // Estudio
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80', // DJ
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400&q=80', // Batería
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&q=80', // Guitarra
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80', // Festival
    'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=400&q=80', // Piano
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', // Fiesta
];

export const MOCK_REELS: Reel[] = [
    {
        id: 'reel_1',
        videoUrl: getGumletPlayerUrl(GUMLET_VIDEO_IDS[0]),
        thumbnailUrl: MUSIC_THUMBNAILS[0],
        authorId: 'user_1',
        authorName: 'Lucas Guitar',
        authorPhoto: 'https://i.pravatar.cc/150?u=1',
        authorRole: 'musician',
        authorVerified: true,
        description: '🎸 "Mi Estrella Blanca" - Nueva canción que estamos trabajando. ¿Qué os parece? #guitar #original #music',
        songTitle: 'Mi Estrella Blanca',
        songArtist: 'Lucas Guitar',
        likes: 2340,
        comments: 156,
        shares: 89,
        views: 45600,
        timestamp: Date.now() - 1000 * 60 * 60 * 2,
        tags: ['guitar', 'original', 'music', 'rock'],
        duration: 45,
        gumletId: GUMLET_VIDEO_IDS[0]
    },
    {
        id: 'reel_2',
        videoUrl: getGumletPlayerUrl(GUMLET_VIDEO_IDS[1]),
        thumbnailUrl: MUSIC_THUMBNAILS[1],
        authorId: 'user_2',
        authorName: 'Ana Vocals',
        authorPhoto: 'https://i.pravatar.cc/150?u=2',
        authorRole: 'musician',
        authorVerified: true,
        description: '✨ Sesión de estudio grabando nuevas voces! El productor está flipando 🎤 #vocals #recording #studio',
        songTitle: 'Studio Session',
        songArtist: 'Ana Vocals',
        likes: 5620,
        comments: 342,
        shares: 178,
        views: 89000,
        timestamp: Date.now() - 1000 * 60 * 60 * 5,
        tags: ['vocals', 'recording', 'studio', 'music'],
        duration: 60,
        gumletId: GUMLET_VIDEO_IDS[1]
    },
    {
        id: 'reel_3',
        videoUrl: getGumletPlayerUrl(GUMLET_VIDEO_IDS[2]),
        thumbnailUrl: MUSIC_THUMBNAILS[2],
        authorId: 'user_3',
        authorName: 'DJ Electronic',
        authorPhoto: 'https://i.pravatar.cc/150?u=3',
        authorRole: 'musician',
        authorVerified: false,
        description: '🔥 Preview del set de anoche en Razzmatazz! La gente estaba increíble 🎉 #dj #electronic #barcelona',
        songTitle: 'Live Set Preview',
        songArtist: 'DJ Electronic',
        likes: 8920,
        comments: 567,
        shares: 423,
        views: 156000,
        timestamp: Date.now() - 1000 * 60 * 60 * 8,
        tags: ['dj', 'electronic', 'barcelona', 'party'],
        duration: 55,
        gumletId: GUMLET_VIDEO_IDS[2]
    },
    {
        id: 'reel_4',
        videoUrl: getGumletPlayerUrl(GUMLET_VIDEO_IDS[3]),
        thumbnailUrl: MUSIC_THUMBNAILS[3],
        authorId: 'user_4',
        authorName: 'Drums Master',
        authorPhoto: 'https://i.pravatar.cc/150?u=4',
        authorRole: 'musician',
        authorVerified: true,
        description: '🥁 Grabando las pistas de batería para el nuevo álbum! Este ritmo va a pegar fuerte 💥 #drums #recording',
        songTitle: 'Drum Recording',
        likes: 3450,
        comments: 234,
        shares: 156,
        views: 67800,
        timestamp: Date.now() - 1000 * 60 * 60 * 12,
        tags: ['drums', 'recording', 'album', 'rock'],
        duration: 40,
        gumletId: GUMLET_VIDEO_IDS[3]
    },
    {
        id: 'reel_5',
        videoUrl: getGumletPlayerUrl(GUMLET_VIDEO_IDS[4]),
        thumbnailUrl: MUSIC_THUMBNAILS[4],
        authorId: 'user_1',
        authorName: 'Lucas Guitar',
        authorPhoto: 'https://i.pravatar.cc/150?u=1',
        authorRole: 'musician',
        authorVerified: true,
        description: '🌙 Late night vibes en el estudio. Trabajando en algo especial... 🎸✨ #guitar #studio #newmusic',
        songTitle: 'Studio Vibes',
        likes: 1890,
        comments: 98,
        shares: 45,
        views: 34500,
        timestamp: Date.now() - 1000 * 60 * 60 * 18,
        tags: ['guitar', 'studio', 'newmusic', 'vibes'],
        duration: 50,
        gumletId: GUMLET_VIDEO_IDS[4]
    },
    {
        id: 'reel_6',
        videoUrl: getGumletPlayerUrl(GUMLET_VIDEO_IDS[5]),
        thumbnailUrl: MUSIC_THUMBNAILS[5],
        authorId: 'user_5',
        authorName: 'Marc Sound Tech',
        authorPhoto: 'https://i.pravatar.cc/150?u=5',
        authorRole: 'provider',
        authorVerified: true,
        description: '🎚️ Preparando el sonido para el festival de este finde! Todo listo para que suene brutal 🔊 #soundtech #festival',
        songTitle: 'Festival Setup',
        likes: 4560,
        comments: 289,
        shares: 167,
        views: 78900,
        timestamp: Date.now() - 1000 * 60 * 60 * 24,
        tags: ['soundtech', 'festival', 'live', 'audio'],
        duration: 35,
        gumletId: GUMLET_VIDEO_IDS[5]
    },
    {
        id: 'reel_7',
        videoUrl: getGumletPlayerUrl(GUMLET_VIDEO_IDS[0]),
        thumbnailUrl: MUSIC_THUMBNAILS[6],
        authorId: 'user_2',
        authorName: 'Ana Vocals',
        authorPhoto: 'https://i.pravatar.cc/150?u=2',
        authorRole: 'musician',
        authorVerified: true,
        description: '🎵 Ensayando para el concierto de mañana! Los nervios a tope pero con muchas ganas 🎤💪 #rehearsal #concert',
        songTitle: 'Rehearsal Time',
        songArtist: 'Ana Vocals',
        likes: 7230,
        comments: 456,
        shares: 234,
        views: 123000,
        timestamp: Date.now() - 1000 * 60 * 60 * 36,
        tags: ['rehearsal', 'concert', 'vocals', 'music'],
        duration: 45,
        gumletId: GUMLET_VIDEO_IDS[0]
    },
    {
        id: 'reel_8',
        videoUrl: getGumletPlayerUrl(GUMLET_VIDEO_IDS[1]),
        thumbnailUrl: MUSIC_THUMBNAILS[7],
        authorId: 'user_3',
        authorName: 'DJ Electronic',
        authorPhoto: 'https://i.pravatar.cc/150?u=3',
        authorRole: 'musician',
        authorVerified: false,
        description: '🎉 Anoche en Apolo fue INCREÍBLE! Gracias a todos los que vinisteis 🔥 #dj #party #barcelona #apolo',
        songTitle: 'Apolo Highlights',
        songArtist: 'DJ Electronic',
        likes: 12400,
        comments: 890,
        shares: 567,
        views: 234000,
        timestamp: Date.now() - 1000 * 60 * 60 * 48,
        tags: ['dj', 'party', 'barcelona', 'apolo'],
        duration: 60,
        gumletId: GUMLET_VIDEO_IDS[1]
    }
];

export const MOCK_REEL_COMMENTS: Record<string, ReelComment[]> = {
    'reel_1': [
        {
            id: 'comment_1',
            authorId: 'user_2',
            authorName: 'Ana Vocals',
            authorPhoto: 'https://i.pravatar.cc/150?u=2',
            content: '¡Este tema está increíble! 🔥 La melodía es preciosa',
            timestamp: Date.now() - 1000 * 60 * 30,
            likes: 45,
            isLiked: false
        },
        {
            id: 'comment_2',
            authorId: 'user_3',
            authorName: 'DJ Electronic',
            authorPhoto: 'https://i.pravatar.cc/150?u=3',
            content: 'Me encantaría hacer un remix de esto 👀🎧',
            timestamp: Date.now() - 1000 * 60 * 45,
            likes: 23,
            isLiked: false
        },
        {
            id: 'comment_3',
            authorId: 'user_4',
            authorName: 'Drums Master',
            authorPhoto: 'https://i.pravatar.cc/150?u=4',
            content: '¡Colaboramos pronto! Quedaría genial con batería 🥁🎸',
            timestamp: Date.now() - 1000 * 60 * 60,
            likes: 67,
            isLiked: true
        }
    ],
    'reel_2': [
        {
            id: 'comment_4',
            authorId: 'user_1',
            authorName: 'Lucas Guitar',
            authorPhoto: 'https://i.pravatar.cc/150?u=1',
            content: '¡Esa voz! Siempre impresionante 👏 El productor tiene razón en flipar',
            timestamp: Date.now() - 1000 * 60 * 120,
            likes: 89,
            isLiked: false
        },
        {
            id: 'comment_5',
            authorId: 'user_5',
            authorName: 'Marc Sound Tech',
            authorPhoto: 'https://i.pravatar.cc/150?u=5',
            content: 'El sonido del estudio se nota de calidad! Si necesitas mezcla, cuenta conmigo 🎚️',
            timestamp: Date.now() - 1000 * 60 * 180,
            likes: 34,
            isLiked: false
        }
    ],
    'reel_3': [
        {
            id: 'comment_6',
            authorId: 'user_2',
            authorName: 'Ana Vocals',
            authorPhoto: 'https://i.pravatar.cc/150?u=2',
            content: '¡Qué energía! Me arrepiento de no haber ido 😭',
            timestamp: Date.now() - 1000 * 60 * 60 * 3,
            likes: 56,
            isLiked: false
        }
    ],
    'reel_4': [
        {
            id: 'comment_7',
            authorId: 'user_1',
            authorName: 'Lucas Guitar',
            authorPhoto: 'https://i.pravatar.cc/150?u=1',
            content: 'Ese groove es una locura! 🔥 Necesito esos drums en mi próximo track',
            timestamp: Date.now() - 1000 * 60 * 60 * 5,
            likes: 78,
            isLiked: true
        }
    ]
};

// Función para obtener reels de un usuario específico
export const getReelsByUser = (userId: string): Reel[] => {
    return MOCK_REELS.filter(reel => reel.authorId === userId);
};

// Función para obtener reels del feed (algoritmo simulado)
export const getFeedReels = (startIndex: number = 0, count: number = 5): Reel[] => {
    // Simular algoritmo: mezclar y ordenar por engagement
    const shuffled = [...MOCK_REELS].sort((a, b) => {
        const scoreA = a.likes + a.comments * 2 + a.shares * 3;
        const scoreB = b.likes + b.comments * 2 + b.shares * 3;
        return scoreB - scoreA;
    });
    return shuffled.slice(startIndex, startIndex + count);
};

// Función para obtener reels trending
export const getTrendingReels = (): Reel[] => {
    return [...MOCK_REELS]
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);
};

// Función para obtener comentarios de un reel
export const getReelComments = (reelId: string): ReelComment[] => {
    return MOCK_REEL_COMMENTS[reelId] || [];
};

// Función para obtener un reel por ID
export const getReelById = (reelId: string): Reel | undefined => {
    return MOCK_REELS.find(reel => reel.id === reelId);
};

// Función para obtener más reels (infinite scroll)
export const getMoreReels = (excludeIds: string[], count: number = 3): Reel[] => {
    const available = MOCK_REELS.filter(reel => !excludeIds.includes(reel.id));
    // Reciclar si no hay suficientes
    if (available.length < count) {
        return [...available, ...MOCK_REELS.slice(0, count - available.length)];
    }
    return available.slice(0, count);
};

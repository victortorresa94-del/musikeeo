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
// Miniaturas propias (Aura Studio, /public): sin depender de Unsplash
const MUSIC_THUMBNAILS = [
    '/images/home/boda.webp',
    '/images/home/role-musico.webp',
    '/images/home/role-dj.webp',
    '/images/home/2am.webp',
    '/images/home/role-sala.webp',
    '/images/home/role-tienda.webp',
    '/images/home/role-tecnico.webp',
    '/images/home/ecosistema.webp',
];

// Reels de muestra con vídeo propio (Aura Studio, /public/reels): se reproducen
// solos en el feed y en el visor a pantalla completa. Marcados como demo en la UI.
const H = 1000 * 60 * 60;
export const LOCAL_REELS: Reel[] = [
    {
        id: 'demo_boda', videoUrl: '/reels/boda-rumba.mp4', thumbnailUrl: '/reels/boda-rumba.webp',
        authorId: 'demo', authorName: 'Rumba Sur', authorPhoto: '', authorRole: 'musician', authorVerified: true,
        description: 'Así acabó la boda en Sitges 💃 ¿Rumba hasta las 3? Siempre. #rumba #bodas #directo',
        songTitle: 'Sarandonga (versión)', songArtist: 'Rumba Sur',
        likes: 3120, comments: 214, shares: 98, views: 61200, timestamp: Date.now() - 3 * H,
        tags: ['rumba', 'bodas', 'directo'], duration: 5,
    },
    {
        id: 'demo_flamenco', videoUrl: '/reels/flamenco.mp4', thumbnailUrl: '/reels/flamenco.webp',
        authorId: 'demo', authorName: 'Toni del Sur', authorPhoto: '', authorRole: 'musician', authorVerified: false,
        description: 'Rasgueo de bulería en el tablao de los jueves. Busco cantaor para gira de verano 🎸 #flamenco #guitarra',
        songTitle: 'Bulería del jueves', songArtist: 'Toni del Sur',
        likes: 1840, comments: 97, shares: 41, views: 28400, timestamp: Date.now() - 7 * H,
        tags: ['flamenco', 'guitarra'], duration: 5,
    },
    {
        id: 'demo_dj', videoUrl: '/reels/dj-azotea.mp4', thumbnailUrl: '/reels/dj-azotea.webp',
        authorId: 'demo', authorName: 'DJ Marta Vidal', authorPhoto: '', authorRole: 'musician', authorVerified: true,
        description: 'Sunset set en una azotea de Barcelona 🌅 Libre para eventos privados en noviembre. #dj #sunset #barcelona',
        songTitle: 'Sunset set', songArtist: 'Marta Vidal',
        likes: 5230, comments: 311, shares: 160, views: 98700, timestamp: Date.now() - 20 * H,
        tags: ['dj', 'sunset', 'barcelona'], duration: 5,
    },
    {
        id: 'demo_monigotes', videoUrl: '/reels/banda-monigotes.mp4', thumbnailUrl: '/reels/banda-monigotes.webp',
        authorId: 'demo', authorName: 'Musikeeo', authorPhoto: '/logo-musikeeo.png', authorRole: 'organizer', authorVerified: true,
        description: 'Pide una banda como pides sushi 🍣🎸 Esto es Musikeeo. #musikeeo #musicaendirecto',
        songTitle: 'Conecta. Crea. Suena.', songArtist: 'Musikeeo',
        likes: 980, comments: 45, shares: 77, views: 12900, timestamp: Date.now() - 30 * H,
        tags: ['musikeeo'], duration: 5,
    },
];

// Posts de foto de muestra (imágenes propias de Aura Studio)
export interface FeedPost {
    id: string;
    authorName: string;
    authorRole: string;
    authorVerified?: boolean;
    image: string;
    caption: string;
    likes: number;
    comments: number;
    timestamp: number;
}

export const MOCK_POSTS: FeedPost[] = [
    { id: 'post_2am', authorName: 'Lucía Sound', authorRole: 'Técnica de sonido', authorVerified: true, image: '/images/home/2am.webp', caption: 'Las 2:00, recogiendo después del bolo. El cable que salvó la noche lo trajo un compañero de Musikeeo en 10 minutos 🙌', likes: 742, comments: 38, timestamp: Date.now() - 5 * H },
    { id: 'post_sala', authorName: 'Sala Luna', authorRole: 'Sala de conciertos', authorVerified: true, image: '/images/home/role-sala.webp', caption: 'Escenario listo para el ciclo de otoño. Tenemos jueves libres en noviembre: escribidnos por aquí 🎤', likes: 512, comments: 64, timestamp: Date.now() - 12 * H },
    { id: 'post_ampli', authorName: 'Backline BCN', authorRole: 'Tienda y alquiler', authorVerified: false, image: '/images/home/role-tienda.webp', caption: 'Nuevo en el almacén para alquilar por días. Precio especial para bandas de Musikeeo ⚡', likes: 288, comments: 19, timestamp: Date.now() - 26 * H },
];

export const MOCK_REELS: Reel[] = [
    ...LOCAL_REELS,
    {
        id: 'reel_1',
        videoUrl: getGumletPlayerUrl(GUMLET_VIDEO_IDS[0]),
        thumbnailUrl: MUSIC_THUMBNAILS[0],
        authorId: 'user_1',
        authorName: 'Lucas Guitar',
        authorPhoto: '',
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
        authorPhoto: '',
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
        authorPhoto: '',
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
        authorPhoto: '',
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
        authorPhoto: '',
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
        authorPhoto: '',
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
        authorPhoto: '',
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
        authorPhoto: '',
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
            authorPhoto: '',
            content: '¡Este tema está increíble! 🔥 La melodía es preciosa',
            timestamp: Date.now() - 1000 * 60 * 30,
            likes: 45,
            isLiked: false
        },
        {
            id: 'comment_2',
            authorId: 'user_3',
            authorName: 'DJ Electronic',
            authorPhoto: '',
            content: 'Me encantaría hacer un remix de esto 👀🎧',
            timestamp: Date.now() - 1000 * 60 * 45,
            likes: 23,
            isLiked: false
        },
        {
            id: 'comment_3',
            authorId: 'user_4',
            authorName: 'Drums Master',
            authorPhoto: '',
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
            authorPhoto: '',
            content: '¡Esa voz! Siempre impresionante 👏 El productor tiene razón en flipar',
            timestamp: Date.now() - 1000 * 60 * 120,
            likes: 89,
            isLiked: false
        },
        {
            id: 'comment_5',
            authorId: 'user_5',
            authorName: 'Marc Sound Tech',
            authorPhoto: '',
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
            authorPhoto: '',
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
            authorPhoto: '',
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

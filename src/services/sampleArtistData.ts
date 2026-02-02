// Sample Artist Data for Development
// Use this to seed Firestore or for local testing

import type { Artist } from '../types';

export const SAMPLE_ARTISTS: Artist[] = [
    {
        id: 'artist_sample_1',
        slug: 'the-midnight-echo',
        userId: 'dev-user-id',
        artistName: 'The Midnight Echo',
        profilePhoto: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
        coverPhoto: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200',
        isVerified: true,
        city: 'Madrid',
        region: 'Comunidad de Madrid',
        country: 'España',
        bio: 'Banda de indie-rock formada en Madrid. Nuestro sonido mezcla guitarras atmosféricas con ritmos bailables. Disponibles para bodas, eventos corporativos y festivales privados.',
        genres: ['Indie Rock', 'Alternative', 'Pop Rock'],
        tags: ['Equipo propio', 'Viaja hasta 100km', 'Bilingüe EN/ES'],
        rating: 4.9,
        reviewCount: 23,
        gigsCompleted: 47,
        packages: [
            {
                id: 'pkg_1',
                name: 'Solo Acústico - 2h',
                description: 'Ideal para ceremonias y cócteles. Repertorio pop/rock íntimo.',
                price: 250,
                currency: 'EUR',
                duration: 2,
                extraHourPrice: 80,
                includesEquipment: true,
                includesTravel: true,
                travelRadius: 30,
                includes: ['Sonido propio', 'Repertorio personalizable', '2 pases de 45 min'],
                isActive: true
            },
            {
                id: 'pkg_2',
                name: 'Banda Completa',
                description: 'Show de 4 horas con sonido completo. Ideal para fiestas.',
                price: 800,
                currency: 'EUR',
                duration: 4,
                extraHourPrice: 150,
                includesEquipment: true,
                includesTravel: false,
                includes: ['5 músicos', 'PA system', 'Iluminación básica', 'DJ entre pases'],
                isActive: true
            }
        ],
        priceFrom: 250,
        multimedia: {
            spotifyUri: 'spotify:artist:example',
            spotifyVisible: true,
            videos: [
                {
                    id: 'vid_1',
                    url: 'https://youtube.com/watch?v=example1',
                    title: 'Live at Summer Festival 2023',
                    platform: 'youtube',
                    thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
                    duration: '3:45'
                },
                {
                    id: 'vid_2',
                    url: 'https://vimeo.com/example2',
                    title: 'Acoustic Sessions - Vol 1',
                    platform: 'vimeo',
                    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
                    duration: '12:02'
                }
            ],
            photos: [
                {
                    id: 'photo_1',
                    url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
                    caption: 'En concierto',
                    isCover: true,
                    order: 0
                },
                {
                    id: 'photo_2',
                    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
                    caption: 'Festival de verano',
                    order: 1
                }
            ]
        },
        availability: [
            { date: '2026-02-05', status: 'occupied', eventName: 'Boda Privada' },
            { date: '2026-02-09', status: 'available' },
            { date: '2026-02-13', status: 'occupied', eventName: 'Boda' },
            { date: '2026-02-15', status: 'available' },
            { date: '2026-02-21', status: 'available' },
            { date: '2026-02-25', status: 'available' },
            { date: '2026-03-01', status: 'available' },
            { date: '2026-03-08', status: 'available' },
        ],
        isPublic: true,
        profileCompleteness: 85,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2026-01-27T18:30:00Z'
    },
    {
        id: 'artist_sample_2',
        slug: 'jazz-quartet-bcn',
        userId: 'user_jazz_1',
        artistName: 'Barcelona Jazz Quartet',
        profilePhoto: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400',
        coverPhoto: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200',
        isVerified: true,
        city: 'Barcelona',
        region: 'Cataluña',
        country: 'España',
        bio: 'Cuarteto de jazz profesional con más de 10 años de experiencia en eventos de alto nivel. Especialistas en jazz clásico, bossa nova y swing.',
        genres: ['Jazz', 'Bossa Nova', 'Swing'],
        tags: ['Equipo propio', 'Repertorio clásico', 'Eventos corporativos'],
        rating: 4.8,
        reviewCount: 56,
        gigsCompleted: 120,
        packages: [
            {
                id: 'pkg_jazz_1',
                name: 'Dúo Piano + Voz',
                description: 'Formato íntimo perfecto para cenas y cócteles.',
                price: 400,
                currency: 'EUR',
                duration: 2,
                extraHourPrice: 120,
                includesEquipment: true,
                includes: ['2 músicos', 'Sonido ambiente'],
                isActive: true
            },
            {
                id: 'pkg_jazz_2',
                name: 'Cuarteto Completo',
                description: 'Piano, contrabajo, batería y saxo. El clásico formato jazz.',
                price: 1200,
                currency: 'EUR',
                duration: 3,
                extraHourPrice: 300,
                includesEquipment: true,
                includes: ['4 músicos', 'PA system', 'Repertorio de 100+ temas'],
                isActive: true
            }
        ],
        priceFrom: 400,
        multimedia: {
            spotifyVisible: false,
            videos: [
                {
                    id: 'vid_jazz_1',
                    url: 'https://youtube.com/watch?v=jazzvid1',
                    title: 'Live at Hotel Arts Barcelona',
                    platform: 'youtube',
                    duration: '8:30'
                }
            ],
            photos: [
                {
                    id: 'photo_jazz_1',
                    url: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800',
                    isCover: true,
                    order: 0
                }
            ]
        },
        availability: [
            { date: '2026-02-01', status: 'available' },
            { date: '2026-02-08', status: 'available' },
            { date: '2026-02-14', status: 'occupied', eventName: 'San Valentín - Hotel W' },
            { date: '2026-02-15', status: 'available' },
            { date: '2026-02-22', status: 'available' },
        ],
        isPublic: true,
        profileCompleteness: 78,
        createdAt: '2023-06-10T14:00:00Z',
        updatedAt: '2026-01-20T09:00:00Z'
    },
    {
        id: 'artist_sample_3',
        slug: 'dj-nova-madrid',
        userId: 'user_dj_1',
        artistName: 'DJ Nova',
        profilePhoto: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400',
        coverPhoto: 'https://images.unsplash.com/photo-1571397159434-c50b84ba16f4?w=1200',
        isVerified: false,
        city: 'Madrid',
        region: 'Comunidad de Madrid',
        country: 'España',
        bio: 'DJ residente en Madrid especializado en house, techno y sesiones comerciales. Más de 200 eventos realizados.',
        genres: ['House', 'Techno', 'Commercial'],
        tags: ['Equipo propio', 'Luces LED', 'Bodas'],
        rating: 4.6,
        reviewCount: 34,
        gigsCompleted: 215,
        packages: [
            {
                id: 'pkg_dj_1',
                name: 'Sesión 4h',
                description: 'Sesión de 4 horas con equipo básico.',
                price: 300,
                currency: 'EUR',
                duration: 4,
                extraHourPrice: 60,
                includesEquipment: true,
                includes: ['Controladora Pioneer', 'PA 1000W', 'Micro inalámbrico'],
                isActive: true
            },
            {
                id: 'pkg_dj_2',
                name: 'Pack Boda Completo',
                description: 'Ceremonia + cóctel + fiesta. Todo el día cubierto.',
                price: 600,
                currency: 'EUR',
                duration: 8,
                includesEquipment: true,
                includes: ['Música ceremonia', 'Hilo musical cóctel', 'Sesión baile', 'Luces LED'],
                isActive: true
            }
        ],
        priceFrom: 300,
        multimedia: {
            videos: [],
            photos: [
                {
                    id: 'photo_dj_1',
                    url: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800',
                    isCover: true,
                    order: 0
                }
            ]
        },
        availability: [
            { date: '2026-02-01', status: 'available' },
            { date: '2026-02-07', status: 'available' },
            { date: '2026-02-08', status: 'occupied', eventName: 'Boda' },
            { date: '2026-02-14', status: 'available' },
            { date: '2026-02-15', status: 'available' },
            { date: '2026-02-21', status: 'blocked' },
            { date: '2026-02-22', status: 'available' },
        ],
        isPublic: true,
        profileCompleteness: 65,
        createdAt: '2024-03-01T11:00:00Z',
        updatedAt: '2026-01-25T16:00:00Z'
    }
];

/**
 * Seed sample artists to Firestore
 */
export async function seedSampleArtists(): Promise<void> {
    const { setDoc, doc } = await import('firebase/firestore');
    const { db } = await import('../lib/firebase');

    for (const artist of SAMPLE_ARTISTS) {
        await setDoc(doc(db, 'artists', artist.id), artist);
        console.log(`Seeded artist: ${artist.artistName}`);
    }
    console.log('All sample artists seeded!');
}

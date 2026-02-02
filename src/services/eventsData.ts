
export interface MusikeeoEvent {
    id: string;
    title: string;
    description: string;
    type: 'Festival' | 'Boda / Social' | 'Evento Privado' | 'Residencia / Bar' | 'Otro' | 'Gig' | 'Jam' | 'Session';
    artistType: string[]; // e.g., ['Banda', 'DJ']
    date: string; // ISO String
    time: string;
    location: string;
    city: string;
    budget: number;
    currency: 'MXN' | 'EUR' | 'USD';
    tags: string[]; // ['Urgente', 'Premium', 'Nuevo', 'Recurrente']
    imageUrl: string;
    organizerName: string;
    organizerId: string;
    verified: boolean;
    visibilityScore: number;
    createdAt: string;
}

export const MOCK_EVENTS: MusikeeoEvent[] = [
    {
        id: 'evt_1',
        title: 'Buscamos Trío de Jazz para Apertura',
        description: 'Estamos buscando un trío de jazz con experiencia para tocar durante el cóctel de apertura de nuestro festival anual.',
        type: 'Festival',
        artistType: ['Banda', 'Jazz Trio'],
        date: '2024-06-15',
        time: '20:00',
        location: 'Parque México, CDMX',
        city: 'CDMX',
        budget: 8000,
        currency: 'MXN',
        tags: ['Urgente', 'Premium'],
        imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80',
        organizerName: 'Jazz Fest MX',
        organizerId: 'org_1',
        verified: true,
        visibilityScore: 95,
        createdAt: '2024-05-01T10:00:00Z'
    },
    {
        id: 'evt_2',
        title: 'Violinista Solista para Ceremonia',
        description: 'Ceremonia religiosa y cóctel. Requerimos repertorio clásico y algunas versiones modernas.',
        type: 'Boda / Social',
        artistType: ['Solista'],
        date: '2024-07-02',
        time: '12:00',
        location: 'Hacienda Los Morales, CDMX',
        city: 'CDMX',
        budget: 5500,
        currency: 'MXN',
        tags: ['Nuevo', 'Premium'],
        imageUrl: 'https://images.unsplash.com/photo-1465847899078-b29391f150b7?w=800&q=80',
        organizerName: 'Wedding Planner Pro',
        organizerId: 'org_2',
        verified: true,
        visibilityScore: 88,
        createdAt: '2024-05-10T14:30:00Z'
    },
    {
        id: 'evt_3',
        title: 'Banda de Rock Covers 80s & 90s',
        description: 'Evento corporativo de fin de año. Buscamos energía y clásicos para bailar.',
        type: 'Evento Privado',
        artistType: ['Banda'],
        date: '2024-12-20',
        time: '19:00',
        location: 'Hotel Reforma, CDMX',
        city: 'CDMX',
        budget: 15000,
        currency: 'MXN',
        tags: [],
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
        organizerName: 'Tech Corp',
        organizerId: 'org_3',
        verified: false,
        visibilityScore: 75,
        createdAt: '2024-05-11T09:00:00Z'
    },
    {
        id: 'evt_4',
        title: 'DJ Residente para Fines de Semana',
        description: 'Buscamos DJ con estilo House / Disco para residencia de Viernes y Sábados.',
        type: 'Residencia / Bar',
        artistType: ['DJ'],
        date: '2024-06-01',
        time: '22:00',
        location: 'Roma Sur, CDMX',
        city: 'CDMX',
        budget: 4000, // Por noche
        currency: 'MXN',
        tags: ['Recurrente'],
        imageUrl: 'https://images.unsplash.com/photo-1571266028434-18f17f0da1b8?w=800&q=80',
        organizerName: 'Club 55',
        organizerId: 'org_4',
        verified: true,
        visibilityScore: 82,
        createdAt: '2024-05-05T16:00:00Z'
    },
    {
        id: 'evt_5',
        title: 'Mariachi Completo (10 Elementos)',
        description: 'Fiesta privada de cumpleaños, serenata y 1 hora de música.',
        type: 'Evento Privado',
        artistType: ['Mariachi'],
        date: '2024-05-25',
        time: '22:00',
        location: 'Jardines del Pedregal, CDMX',
        city: 'CDMX',
        budget: 7000,
        currency: 'MXN',
        tags: ['Nuevo'],
        imageUrl: 'https://images.unsplash.com/photo-1532452119098-a3650b3c46d3?w=800&q=80',
        organizerName: 'Juan Pérez',
        organizerId: 'org_5',
        verified: false,
        visibilityScore: 70,
        createdAt: '2024-05-12T11:20:00Z'
    },
    {
        id: 'evt_6',
        title: 'Cantante Acústico para Cena',
        description: 'Ambiente relajado para restaurante de lujo en Polanco. Voz y Guitarra.',
        type: 'Residencia / Bar',
        artistType: ['Solista'],
        date: '2024-06-10',
        time: '20:30',
        location: 'Polanco, CDMX',
        city: 'CDMX',
        budget: 3000,
        currency: 'MXN',
        tags: [],
        imageUrl: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=800&q=80',
        organizerName: 'Bistro M',
        organizerId: 'org_6',
        verified: true,
        visibilityScore: 65,
        createdAt: '2024-05-08T18:00:00Z'
    }
];

export const EVENT_TYPES = ['Festival', 'Boda / Social', 'Evento Privado', 'Residencia / Bar', 'Otro'];


// Comprehensive mock data for Discover page - 80+ entries

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

// Cities for filtering
export const CITIES = ['Barcelona', 'Madrid', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 'Zaragoza'];

// Genres for filtering  
export const GENRES = ['Rock', 'Jazz', 'Blues', 'Pop', 'Electrónica', 'Funk', 'Soul', 'R&B', 'Hip-Hop', 'Reggae', 'Metal', 'Classical', 'Folk', 'Flamenco', 'Indie', 'Latin'];

// Instruments/Roles for filtering
export const ROLES = ['Guitarrista', 'Bajista', 'Batería', 'Vocalista', 'Teclista', 'DJ', 'Productor', 'Saxofonista', 'Trompetista', 'Violinista', 'Percusionista'];

// Technician roles
export const TECH_ROLES = ['Ingeniero de Sonido', 'Técnico de Directo', 'Iluminador', 'Backline', 'Stage Manager', 'Productor Musical', 'Técnico de Monitores'];

// Generate 40 musicians
export const DISCOVER_MUSICIANS: DiscoverMusician[] = [
    // Barcelona musicians (15)
    { id: 'mus_1', name: 'Lucas García', role: 'Guitarrista', instrument: 'Guitarra Eléctrica', genres: ['Jazz', 'Blues'], location: 'Gràcia, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=m1', rating: 4.8, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_2', name: 'Ana Martínez', role: 'Vocalista', genres: ['Soul', 'R&B'], location: 'Poble Sec, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=m2', rating: 4.9, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_3', name: 'Pau Fernández', role: 'Batería', genres: ['Rock', 'Funk'], location: 'Sants, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=m3', rating: 4.7, verified: false, available: false, experience: 'mid', priceRange: 'medium' },
    { id: 'mus_4', name: 'Carmen López', role: 'Teclista', genres: ['Neo-Soul', 'Jazz'], location: 'Eixample, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=m4', rating: 4.6, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_5', name: 'Marc Puig', role: 'Bajista', genres: ['Funk', 'Jazz'], location: 'Les Corts, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=m5', rating: 4.5, verified: false, available: true, experience: 'mid', priceRange: 'medium' },
    { id: 'mus_6', name: 'Elena Vidal', role: 'DJ', genres: ['House', 'Techno'], location: 'Poblenou, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=m6', rating: 4.9, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_7', name: 'David Soler', role: 'Saxofonista', genres: ['Jazz', 'Funk'], location: 'Born, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=m7', rating: 4.8, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_8', name: 'Laura Roca', role: 'Vocalista', genres: ['Pop', 'Indie'], location: 'Gràcia, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=m8', rating: 4.4, verified: false, available: true, experience: 'junior', priceRange: 'low' },
    { id: 'mus_9', name: 'Jordi Mas', role: 'Guitarrista', genres: ['Rock', 'Metal'], location: 'Clot, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=m9', rating: 4.7, verified: true, available: false, experience: 'senior', priceRange: 'medium' },
    { id: 'mus_10', name: 'Marta Pons', role: 'Violinista', genres: ['Classical', 'Folk'], location: 'Sant Gervasi, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=m10', rating: 4.9, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_11', name: 'Sergi Vila', role: 'Productor', genres: ['Electrónica', 'Hip-Hop'], location: 'Raval, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=m11', rating: 4.6, verified: true, available: true, experience: 'mid', priceRange: 'medium' },
    { id: 'mus_12', name: 'Clara Font', role: 'Teclista', genres: ['Jazz', 'Blues'], location: 'Sarrià, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=m12', rating: 4.5, verified: false, available: true, experience: 'mid', priceRange: 'medium' },
    { id: 'mus_13', name: 'Àlex Ferrer', role: 'Batería', genres: ['Jazz', 'Funk'], location: 'Poble Nou, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=m13', rating: 4.8, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_14', name: 'Núria Costa', role: 'Vocalista', genres: ['Flamenco', 'Latin'], location: 'Barceloneta, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=m14', rating: 4.7, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_15', name: 'Roger Blanc', role: 'Bajista', genres: ['Rock', 'Indie'], location: 'Sant Andreu, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=m15', rating: 4.3, verified: false, available: true, experience: 'junior', priceRange: 'low' },

    // Madrid musicians (12)
    { id: 'mus_16', name: 'Pablo Ruiz', role: 'Guitarrista', genres: ['Flamenco', 'Latin'], location: 'Malasaña, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=m16', rating: 4.9, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_17', name: 'Isabel Torres', role: 'Vocalista', genres: ['Pop', 'R&B'], location: 'Chamberí, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=m17', rating: 4.8, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_18', name: 'Miguel Sanz', role: 'Batería', genres: ['Rock', 'Metal'], location: 'Vallecas, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=m18', rating: 4.6, verified: false, available: true, experience: 'mid', priceRange: 'medium' },
    { id: 'mus_19', name: 'Sara Moreno', role: 'Teclista', genres: ['Electrónica', 'Pop'], location: 'Lavapiés, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=m19', rating: 4.7, verified: true, available: false, experience: 'senior', priceRange: 'high' },
    { id: 'mus_20', name: 'Carlos Díaz', role: 'Bajista', genres: ['Funk', 'Soul'], location: 'Chueca, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=m20', rating: 4.5, verified: false, available: true, experience: 'mid', priceRange: 'medium' },
    { id: 'mus_21', name: 'Lucía Herrera', role: 'DJ', genres: ['Techno', 'House'], location: 'Tetuán, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=m21', rating: 4.8, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_22', name: 'Javier Ortega', role: 'Trompetista', genres: ['Jazz', 'Latin'], location: 'Sol, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=m22', rating: 4.9, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_23', name: 'Andrea Castro', role: 'Vocalista', genres: ['Jazz', 'Soul'], location: 'Retiro, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=m23', rating: 4.6, verified: true, available: true, experience: 'mid', priceRange: 'medium' },
    { id: 'mus_24', name: 'Raúl Jiménez', role: 'Guitarrista', genres: ['Blues', 'Rock'], location: 'Argüelles, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=m24', rating: 4.7, verified: false, available: true, experience: 'senior', priceRange: 'medium' },
    { id: 'mus_25', name: 'Marina Gil', role: 'Percusionista', genres: ['Latin', 'Reggae'], location: 'Latina, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=m25', rating: 4.4, verified: false, available: true, experience: 'mid', priceRange: 'low' },
    { id: 'mus_26', name: 'Diego Romero', role: 'Productor', genres: ['Hip-Hop', 'R&B'], location: 'Usera, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=m26', rating: 4.8, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_27', name: 'Eva Navarro', role: 'Violinista', genres: ['Classical', 'Pop'], location: 'Salamanca, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=m27', rating: 4.9, verified: true, available: false, experience: 'senior', priceRange: 'high' },

    // Valencia musicians (6)
    { id: 'mus_28', name: 'Víctor Álvarez', role: 'Guitarrista', genres: ['Folk', 'Indie'], location: 'Ruzafa, VAL', city: 'Valencia', photoURL: 'https://i.pravatar.cc/150?u=m28', rating: 4.6, verified: true, available: true, experience: 'mid', priceRange: 'medium' },
    { id: 'mus_29', name: 'Patricia Gómez', role: 'Vocalista', genres: ['Pop', 'Latin'], location: 'Benimaclet, VAL', city: 'Valencia', photoURL: 'https://i.pravatar.cc/150?u=m29', rating: 4.7, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_30', name: 'Alberto Sánchez', role: 'Batería', genres: ['Funk', 'Jazz'], location: 'Carmen, VAL', city: 'Valencia', photoURL: 'https://i.pravatar.cc/150?u=m30', rating: 4.5, verified: false, available: true, experience: 'mid', priceRange: 'medium' },
    { id: 'mus_31', name: 'Cristina Pérez', role: 'Bajista', genres: ['Rock', 'Funk'], location: 'Cabañal, VAL', city: 'Valencia', photoURL: 'https://i.pravatar.cc/150?u=m31', rating: 4.4, verified: false, available: true, experience: 'junior', priceRange: 'low' },
    { id: 'mus_32', name: 'Fernando Martín', role: 'DJ', genres: ['Electrónica', 'Techno'], location: 'Extramurs, VAL', city: 'Valencia', photoURL: 'https://i.pravatar.cc/150?u=m32', rating: 4.8, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_33', name: 'Rosa Ibáñez', role: 'Teclista', genres: ['Jazz', 'Neo-Soul'], location: 'Eixample, VAL', city: 'Valencia', photoURL: 'https://i.pravatar.cc/150?u=m33', rating: 4.6, verified: true, available: false, experience: 'mid', priceRange: 'medium' },

    // Sevilla musicians (4)
    { id: 'mus_34', name: 'Antonio Reyes', role: 'Guitarrista', genres: ['Flamenco'], location: 'Triana, SEV', city: 'Sevilla', photoURL: 'https://i.pravatar.cc/150?u=m34', rating: 4.9, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_35', name: 'Rocío Vega', role: 'Vocalista', genres: ['Flamenco', 'Latin'], location: 'Macarena, SEV', city: 'Sevilla', photoURL: 'https://i.pravatar.cc/150?u=m35', rating: 4.8, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_36', name: 'Manuel Campos', role: 'Percusionista', genres: ['Flamenco', 'Latin'], location: 'Centro, SEV', city: 'Sevilla', photoURL: 'https://i.pravatar.cc/150?u=m36', rating: 4.7, verified: true, available: true, experience: 'senior', priceRange: 'medium' },
    { id: 'mus_37', name: 'Carmen Ruiz', role: 'Bajista', genres: ['Funk', 'Soul'], location: 'Nervión, SEV', city: 'Sevilla', photoURL: 'https://i.pravatar.cc/150?u=m37', rating: 4.5, verified: false, available: true, experience: 'mid', priceRange: 'medium' },

    // Bilbao musicians (3)
    { id: 'mus_38', name: 'Iker Etxebarria', role: 'Guitarrista', genres: ['Rock', 'Metal'], location: 'Casco Viejo, BIL', city: 'Bilbao', photoURL: 'https://i.pravatar.cc/150?u=m38', rating: 4.7, verified: true, available: true, experience: 'senior', priceRange: 'medium' },
    { id: 'mus_39', name: 'Amaia Zubieta', role: 'Vocalista', genres: ['Indie', 'Folk'], location: 'Deusto, BIL', city: 'Bilbao', photoURL: 'https://i.pravatar.cc/150?u=m39', rating: 4.8, verified: true, available: true, experience: 'senior', priceRange: 'high' },
    { id: 'mus_40', name: 'Gorka Aguirre', role: 'Batería', genres: ['Rock', 'Punk'], location: 'Santutxu, BIL', city: 'Bilbao', photoURL: 'https://i.pravatar.cc/150?u=m40', rating: 4.5, verified: false, available: true, experience: 'mid', priceRange: 'medium' },
];

// Generate 20 bands
export const DISCOVER_BANDS: DiscoverBand[] = [
    // Barcelona bands (8)
    { id: 'band_1', name: 'La Radio Band', genre: 'Indie Rock', genres: ['Indie', 'Rock'], members: 5, location: 'Gràcia, BCN', city: 'Barcelona', coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80', rating: 4.8, verified: true, available: true, forHire: true },
    { id: 'band_2', name: 'Sonic Wave', genre: 'Electrónica', genres: ['Electrónica', 'Techno'], members: 3, location: 'Poblenou, BCN', city: 'Barcelona', coverImage: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=800&q=80', rating: 4.7, verified: true, available: true, forHire: true },
    { id: 'band_3', name: 'The Groove Collective', genre: 'Funk / Soul', genres: ['Funk', 'Soul'], members: 7, location: 'Born, BCN', city: 'Barcelona', coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80', rating: 4.9, verified: false, available: true, forHire: true },
    { id: 'band_4', name: 'Jazz Noir Quartet', genre: 'Jazz', genres: ['Jazz'], members: 4, location: 'Eixample, BCN', city: 'Barcelona', coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80', rating: 4.6, verified: true, available: false, forHire: false },
    { id: 'band_5', name: 'Los Satélites', genre: 'Rock Psicodélico', genres: ['Rock', 'Indie'], members: 4, location: 'Raval, BCN', city: 'Barcelona', coverImage: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&q=80', rating: 4.5, verified: false, available: true, forHire: true },
    { id: 'band_6', name: 'Neon Dreams', genre: 'Synthwave', genres: ['Electrónica', 'Pop'], members: 2, location: 'Sant Martí, BCN', city: 'Barcelona', coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80', rating: 4.7, verified: true, available: true, forHire: true },
    { id: 'band_7', name: 'Brass Street Band', genre: 'Brass / Funk', genres: ['Funk', 'Jazz'], members: 8, location: 'Poble Sec, BCN', city: 'Barcelona', coverImage: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=80', rating: 4.8, verified: true, available: true, forHire: true },
    { id: 'band_8', name: 'Acoustic Souls', genre: 'Folk / Acoustic', genres: ['Folk', 'Indie'], members: 3, location: 'Gràcia, BCN', city: 'Barcelona', coverImage: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80', rating: 4.4, verified: false, available: true, forHire: true },

    // Madrid bands (6)
    { id: 'band_9', name: 'Midnight Express', genre: 'Rock', genres: ['Rock', 'Blues'], members: 5, location: 'Malasaña, MAD', city: 'Madrid', coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80', rating: 4.7, verified: true, available: true, forHire: true },
    { id: 'band_10', name: 'Flamenco Fusion', genre: 'Flamenco Fusión', genres: ['Flamenco', 'Jazz'], members: 6, location: 'Lavapiés, MAD', city: 'Madrid', coverImage: 'https://images.unsplash.com/photo-1504704911898-68304a7d2807?w=800&q=80', rating: 4.9, verified: true, available: true, forHire: true },
    { id: 'band_11', name: 'Urban Beats', genre: 'Hip-Hop / R&B', genres: ['Hip-Hop', 'R&B'], members: 4, location: 'Usera, MAD', city: 'Madrid', coverImage: 'https://images.unsplash.com/photo-1561489413-985b06da5bee?w=800&q=80', rating: 4.6, verified: false, available: true, forHire: true },
    { id: 'band_12', name: 'The Madrid Collective', genre: 'Indie Pop', genres: ['Indie', 'Pop'], members: 5, location: 'Chamberí, MAD', city: 'Madrid', coverImage: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80', rating: 4.5, verified: true, available: true, forHire: true },
    { id: 'band_13', name: 'Electro Mafia', genre: 'Electrónica', genres: ['Electrónica', 'Techno'], members: 3, location: 'Tetuán, MAD', city: 'Madrid', coverImage: 'https://images.unsplash.com/photo-1571266028434-18f17f0da1b8?w=800&q=80', rating: 4.8, verified: true, available: false, forHire: false },
    { id: 'band_14', name: 'Soul Kitchen', genre: 'Soul / Funk', genres: ['Soul', 'Funk'], members: 7, location: 'Chueca, MAD', city: 'Madrid', coverImage: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&q=80', rating: 4.7, verified: true, available: true, forHire: true },

    // Valencia bands (3)
    { id: 'band_15', name: 'Mediterranean Sound', genre: 'Latin / Pop', genres: ['Latin', 'Pop'], members: 5, location: 'Ruzafa, VAL', city: 'Valencia', coverImage: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80', rating: 4.6, verified: true, available: true, forHire: true },
    { id: 'band_16', name: 'Valencia Jazz Ensemble', genre: 'Jazz', genres: ['Jazz'], members: 6, location: 'Carmen, VAL', city: 'Valencia', coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80', rating: 4.8, verified: true, available: true, forHire: true },
    { id: 'band_17', name: 'Electric Church', genre: 'Rock Alternativo', genres: ['Rock', 'Indie'], members: 4, location: 'Benimaclet, VAL', city: 'Valencia', coverImage: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&q=80', rating: 4.5, verified: false, available: true, forHire: true },

    // Sevilla bands (2)
    { id: 'band_18', name: 'Triana Flamenca', genre: 'Flamenco', genres: ['Flamenco'], members: 5, location: 'Triana, SEV', city: 'Sevilla', coverImage: 'https://images.unsplash.com/photo-1504704911898-68304a7d2807?w=800&q=80', rating: 4.9, verified: true, available: true, forHire: true },
    { id: 'band_19', name: 'Sevilla Groove', genre: 'Funk / Latin', genres: ['Funk', 'Latin'], members: 6, location: 'Centro, SEV', city: 'Sevilla', coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80', rating: 4.7, verified: true, available: true, forHire: true },

    // Bilbao band (1)
    { id: 'band_20', name: 'Basque Rockers', genre: 'Rock', genres: ['Rock', 'Metal'], members: 4, location: 'Casco Viejo, BIL', city: 'Bilbao', coverImage: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&q=80', rating: 4.6, verified: true, available: true, forHire: true },
];

// Generate 20 technicians
export const DISCOVER_TECHNICIANS: DiscoverTechnician[] = [
    // Barcelona technicians (10)
    { id: 'tech_1', name: 'Marc Puig', role: 'Ingeniero de Sonido', specialties: ['Live', 'Estudio', 'Mezcla'], location: 'Poblenou, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=t1', rating: 4.9, verified: true, available: true, experience: 'senior' },
    { id: 'tech_2', name: 'Laura Roca', role: 'Iluminador', specialties: ['Conciertos', 'Teatro', 'Festivales'], location: 'Gràcia, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=t2', rating: 4.7, verified: true, available: true, experience: 'senior' },
    { id: 'tech_3', name: 'Joan Ferrer', role: 'Técnico de Directo', specialties: ['Festivales', 'Salas', 'FOH'], location: 'Sant Martí, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=t3', rating: 4.8, verified: true, available: true, experience: 'senior' },
    { id: 'tech_4', name: 'Anna Costa', role: 'Productor Musical', specialties: ['Pop', 'Electrónica', 'Mezcla'], location: 'Eixample, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=t4', rating: 4.6, verified: true, available: false, experience: 'senior' },
    { id: 'tech_5', name: 'Sergi Mas', role: 'Backline', specialties: ['Guitarras', 'Bajos', 'Amplificadores'], location: 'Sants, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=t5', rating: 4.5, verified: false, available: true, experience: 'mid' },
    { id: 'tech_6', name: 'Clara Vidal', role: 'Stage Manager', specialties: ['Festivales', 'Giras', 'Logística'], location: 'Born, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=t6', rating: 4.8, verified: true, available: true, experience: 'senior' },
    { id: 'tech_7', name: 'Oriol Blanc', role: 'Técnico de Monitores', specialties: ['In-Ear', 'Wedges', 'FOH'], location: 'Poble Sec, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=t7', rating: 4.7, verified: true, available: true, experience: 'senior' },
    { id: 'tech_8', name: 'Marta Font', role: 'Ingeniero de Sonido', specialties: ['Estudio', 'Mastering'], location: 'Les Corts, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=t8', rating: 4.9, verified: true, available: true, experience: 'senior' },
    { id: 'tech_9', name: 'Àlex Soler', role: 'Iluminador', specialties: ['Moving Heads', 'LED', 'Programación'], location: 'Raval, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=t9', rating: 4.4, verified: false, available: true, experience: 'mid' },
    { id: 'tech_10', name: 'Núria Pons', role: 'Productor Musical', specialties: ['Jazz', 'Soul', 'Grabación'], location: 'Gràcia, BCN', city: 'Barcelona', photoURL: 'https://i.pravatar.cc/150?u=t10', rating: 4.6, verified: true, available: true, experience: 'mid' },

    // Madrid technicians (6)
    { id: 'tech_11', name: 'Carlos FOH', role: 'Técnico de Directo', specialties: ['Festivales', 'Salas', 'Touring'], location: 'Malasaña, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=t11', rating: 4.8, verified: true, available: true, experience: 'senior' },
    { id: 'tech_12', name: 'Isabel Martín', role: 'Ingeniero de Sonido', specialties: ['Estudio', 'Mezcla', 'Mastering'], location: 'Chamberí, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=t12', rating: 4.9, verified: true, available: true, experience: 'senior' },
    { id: 'tech_13', name: 'Raúl Sánchez', role: 'Iluminador', specialties: ['Conciertos', 'TV', 'Eventos'], location: 'Tetuán, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=t13', rating: 4.7, verified: true, available: false, experience: 'senior' },
    { id: 'tech_14', name: 'Eva Gómez', role: 'Stage Manager', specialties: ['Giras', 'Corporate', 'Festivales'], location: 'Retiro, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=t14', rating: 4.8, verified: true, available: true, experience: 'senior' },
    { id: 'tech_15', name: 'Diego Torres', role: 'Backline', specialties: ['Teclados', 'Drum Tech'], location: 'Lavapiés, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=t15', rating: 4.5, verified: false, available: true, experience: 'mid' },
    { id: 'tech_16', name: 'Marina Ruiz', role: 'Productor Musical', specialties: ['Hip-Hop', 'R&B', 'Pop'], location: 'Usera, MAD', city: 'Madrid', photoURL: 'https://i.pravatar.cc/150?u=t16', rating: 4.7, verified: true, available: true, experience: 'senior' },

    // Valencia technicians (2)
    { id: 'tech_17', name: 'Víctor Castro', role: 'Técnico de Directo', specialties: ['Salas', 'Festivales'], location: 'Ruzafa, VAL', city: 'Valencia', photoURL: 'https://i.pravatar.cc/150?u=t17', rating: 4.6, verified: true, available: true, experience: 'mid' },
    { id: 'tech_18', name: 'Patricia Ibáñez', role: 'Ingeniero de Sonido', specialties: ['Estudio', 'Podcast'], location: 'Carmen, VAL', city: 'Valencia', photoURL: 'https://i.pravatar.cc/150?u=t18', rating: 4.5, verified: false, available: true, experience: 'mid' },

    // Sevilla technician (1)  
    { id: 'tech_19', name: 'Antonio Fernández', role: 'Técnico de Directo', specialties: ['Flamenco', 'Acústico'], location: 'Triana, SEV', city: 'Sevilla', photoURL: 'https://i.pravatar.cc/150?u=t19', rating: 4.8, verified: true, available: true, experience: 'senior' },

    // Bilbao technician (1)
    { id: 'tech_20', name: 'Ane Etxebarria', role: 'Iluminador', specialties: ['Rock', 'Metal', 'Clubes'], location: 'Casco Viejo, BIL', city: 'Bilbao', photoURL: 'https://i.pravatar.cc/150?u=t20', rating: 4.6, verified: true, available: true, experience: 'mid' },
];

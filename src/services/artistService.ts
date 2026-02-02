// Artist Service - Firestore Integration
// Handles artist profiles, search, and availability management

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
    Artist,
    DayAvailability,
    ServicePackage,
    ArtistSearchFilters,
    AvailabilityState
} from '../types';

const ARTISTS_COLLECTION = 'artists';

// ===========================================
// ARTIST CRUD OPERATIONS
// ===========================================

/**
 * Get all artists with optional filters
 */
export async function getArtists(filters?: ArtistSearchFilters): Promise<Artist[]> {
    try {
        const artistsRef = collection(db, ARTISTS_COLLECTION);
        let q = query(artistsRef, where('isPublic', '==', true));

        const snapshot = await getDocs(q);
        let artists: Artist[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Artist));

        // Apply client-side filters
        if (filters) {
            artists = filterArtists(artists, filters);
        }

        return artists;
    } catch (error) {
        console.error('Error fetching artists:', error);
        return [];
    }
}

/**
 * Get a single artist by slug
 */
export async function getArtistBySlug(slug: string): Promise<Artist | null> {
    try {
        const artistsRef = collection(db, ARTISTS_COLLECTION);
        const q = query(artistsRef, where('slug', '==', slug), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Artist;
    } catch (error) {
        console.error('Error fetching artist by slug:', error);
        return null;
    }
}

/**
 * Get artist by user ID (for panel)
 */
// ===========================================
// MOCK DATA & FALLBACKS
// ===========================================

const MOCK_ARTIST: Artist = {
    id: 'mock-artist-id',
    slug: 'artista-demo',
    userId: 'dev-user-id',
    artistName: 'Artista Demo',
    profilePhoto: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop',
    coverPhoto: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=1200&h=400&fit=crop',
    isVerified: true,
    city: 'Madrid, España',
    region: 'Madrid',
    country: 'España',
    bio: 'Este es un perfil de demostración generado porque no se pudo conectar con la base de datos. Puedes editarlo libremente y los cambios se guardarán localmente.',
    genres: ['Pop', 'Indie'],
    tags: [],
    rating: 4.8,
    reviewCount: 12,
    gigsCompleted: 5,
    packages: [],
    multimedia: { videos: [], photos: [] },
    availability: [],
    isPublic: true,
    profileCompleteness: 85,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

// Helper: Try to get from LocalStorage
const getLocalArtist = (userId: string): Artist | null => {
    try {
        const local = localStorage.getItem(`artist_${userId}`);
        return local ? JSON.parse(local) : null;
    } catch (e) {
        return null;
    }
};

// Helper: Save to LocalStorage
const saveLocalArtist = (artist: Artist) => {
    try {
        localStorage.setItem(`artist_${artist.userId}`, JSON.stringify(artist));
    } catch (e) {
        console.error("Local save failed", e);
    }
};

/**
 * Get artist by user ID (for panel)
 * IMPLEMENTS: Dev Mode bypass & Offline Fallback
 */
export async function getArtistByUserId(userId: string): Promise<Artist | null> {
    // 1. Dev Mode Bypass
    if (userId === 'dev-user-id') {
        const localDev = getLocalArtist(userId);
        return localDev || { ...MOCK_ARTIST, userId };
    }

    // 2. Try Firestore with timeout
    try {
        // Create a timeout promise
        const timeout = new Promise((_resolve, reject) => setTimeout(() => reject(new Error("Timeout")), 3000));

        const fetchPromise = (async () => {
            const artistsRef = collection(db, ARTISTS_COLLECTION);
            const q = query(artistsRef, where('userId', '==', userId), limit(1));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;
            return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Artist;
        })();

        // Race: DB vs 3s Timeout
        const result = await Promise.race([fetchPromise, timeout]) as Artist | null;

        // If we got a result, update local cache
        if (result) saveLocalArtist(result);
        return result;

    } catch (error) {
        console.warn('Firestore failed/timed out, falling back to local data:', error);

        // 3. Fallback to Local Storage
        const local = getLocalArtist(userId);
        if (local) return local;

        // 4. Last resort: Return null (let createArtist handle it) OR return a temporary session placeholder
        // If it's a real user but offline, returning null will trigger 'createArtist'
        // which will also fail if offline. So we should return a "Session Artist".
        return {
            ...MOCK_ARTIST,
            id: `temp_${userId}`,
            userId: userId,
            artistName: 'Modo Sin Conexión',
            bio: 'No se pudo conectar con el servidor. Estás en modo sin conexión.'
        };
    }
}

/**
 * Create a new artist profile
 */
export async function createArtist(userId: string, data: Partial<Artist>): Promise<Artist> {
    const artistId = `artist_${userId}`;
    const slug = generateSlug(data.artistName || 'artist');

    const artist: Artist = {
        id: artistId,
        slug,
        userId,
        artistName: data.artistName || 'Nuevo Artista',
        profilePhoto: data.profilePhoto || undefined,
        coverPhoto: data.coverPhoto || undefined,
        isVerified: false,
        city: data.city || '',
        region: data.region || undefined,
        country: data.country || 'España',
        bio: data.bio || '',
        genres: data.genres || [],
        tags: data.tags || [],
        rating: 0,
        reviewCount: 0,
        gigsCompleted: 0,
        packages: [],
        multimedia: {
            videos: [],
            photos: []
        },
        availability: [],
        isPublic: false,
        profileCompleteness: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    // Try to save to Firestore
    try {
        if (userId !== 'dev-user-id') {
            await setDoc(doc(db, ARTISTS_COLLECTION, artistId), artist);
        }
    } catch (e) {
        console.warn("Could not save to Firestore (Offline?), saving locally.");
    }

    // Always save locally
    saveLocalArtist(artist);

    return artist;
}

/**
 * Update artist profile
 */
export async function updateArtist(artistId: string, data: Partial<Artist>): Promise<void> {
    // 1. Try Firestore
    try {
        if (!artistId.startsWith('mock') && !artistId.startsWith('temp')) {
            const artistRef = doc(db, ARTISTS_COLLECTION, artistId);
            await updateDoc(artistRef, {
                ...data,
                updatedAt: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error updating artist in cloud:', error);
    }

    // 2. Update Local Storage (Re-read -> Merge -> Save)
    // We need the userId to save to the correct key. 
    // This is a bit tricky since we only have artistId. 
    // Assumption: we are editing the CURRENT user's artist.
    // Ideally we pass the full object or userId, but for now let's try to find it.
    // For simplicity in this patch, we rely on the state update in the UI to keep session fresh,
    // but to persist across reloads we'd need to read the cache.
    // Let's iterate local keys (inefficient but works for 1 user) or just skip if we can't find it.

    const currentUserKey = Object.keys(localStorage).find(k => {
        try {
            const item = JSON.parse(localStorage.getItem(k) || '{}');
            return item.id === artistId;
        } catch { return false; }
    });

    if (currentUserKey) {
        const current = JSON.parse(localStorage.getItem(currentUserKey)!);
        const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
        localStorage.setItem(currentUserKey, JSON.stringify(updated));
    }
}

// ===========================================
// AVAILABILITY MANAGEMENT
// ===========================================

/**
 * Check if artist is available on a specific date
 */
export function isArtistAvailableOnDate(artist: Artist, date: string): boolean {
    const dayEntry = artist.availability.find(d => d.date === date);
    return dayEntry?.status === 'available';
}

/**
 * Check if artist is available for entire date range
 */
export function isArtistAvailableForRange(artist: Artist, startDate: string, endDate: string): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (!isArtistAvailableOnDate(artist, dateStr)) {
            return false;
        }
    }
    return true;
}

/**
 * Set availability status for a single day
 */
export async function setDayAvailability(
    artistId: string,
    date: string,
    status: AvailabilityState,
    eventName?: string
): Promise<void> {
    const artistRef = doc(db, ARTISTS_COLLECTION, artistId);
    const artistSnap = await getDoc(artistRef);

    if (!artistSnap.exists()) throw new Error('Artist not found');

    const artist = artistSnap.data() as Artist;
    const availability = [...artist.availability];

    // Find or create entry for this date
    const existingIndex = availability.findIndex(d => d.date === date);
    const newEntry: DayAvailability = { date, status, eventName };

    if (existingIndex >= 0) {
        availability[existingIndex] = newEntry;
    } else {
        availability.push(newEntry);
    }

    // Sort by date
    availability.sort((a, b) => a.date.localeCompare(b.date));

    await updateDoc(artistRef, { availability, updatedAt: new Date().toISOString() });
}

/**
 * Get availability for a month
 */
export function getMonthAvailability(artist: Artist, year: number, month: number): DayAvailability[] {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    return artist.availability.filter(d => d.date >= startDate && d.date <= endDate);
}

// ===========================================
// SERVICE PACKAGES
// ===========================================

/**
 * Add or update a service package
 */
export async function saveServicePackage(artistId: string, pkg: ServicePackage): Promise<void> {
    const artistRef = doc(db, ARTISTS_COLLECTION, artistId);
    const artistSnap = await getDoc(artistRef);

    if (!artistSnap.exists()) throw new Error('Artist not found');

    const artist = artistSnap.data() as Artist;
    const packages = [...artist.packages];

    const existingIndex = packages.findIndex(p => p.id === pkg.id);
    if (existingIndex >= 0) {
        packages[existingIndex] = pkg;
    } else {
        packages.push(pkg);
    }

    // Calculate priceFrom
    const priceFrom = Math.min(...packages.filter(p => p.isActive).map(p => p.price));

    await updateDoc(artistRef, {
        packages,
        priceFrom: priceFrom === Infinity ? undefined : priceFrom,
        updatedAt: new Date().toISOString()
    });
}

/**
 * Delete a service package
 */
export async function deleteServicePackage(artistId: string, packageId: string): Promise<void> {
    const artistRef = doc(db, ARTISTS_COLLECTION, artistId);
    const artistSnap = await getDoc(artistRef);

    if (!artistSnap.exists()) throw new Error('Artist not found');

    const artist = artistSnap.data() as Artist;
    const packages = artist.packages.filter(p => p.id !== packageId);

    const priceFrom = packages.length > 0
        ? Math.min(...packages.filter(p => p.isActive).map(p => p.price))
        : undefined;

    await updateDoc(artistRef, { packages, priceFrom, updatedAt: new Date().toISOString() });
}

// ===========================================
// SEARCH & FILTERING
// ===========================================

/**
 * Filter artists based on search criteria
 */
function filterArtists(artists: Artist[], filters: ArtistSearchFilters): Artist[] {
    let result = [...artists];

    // Filter by genre
    if (filters.genres && filters.genres.length > 0) {
        result = result.filter(a =>
            filters.genres!.some(g => a.genres.includes(g))
        );
    }

    // Filter by city
    if (filters.city) {
        const cityLower = filters.city.toLowerCase();
        result = result.filter(a =>
            a.city.toLowerCase().includes(cityLower) ||
            a.region?.toLowerCase().includes(cityLower)
        );
    }

    // Filter by single date availability
    if (filters.date) {
        result = result.filter(a => isArtistAvailableOnDate(a, filters.date!));
    }

    // Filter by date range availability
    if (filters.dateRange) {
        result = result.filter(a =>
            isArtistAvailableForRange(a, filters.dateRange!.start, filters.dateRange!.end)
        );
    }

    // Filter by price range
    if (filters.priceMin !== undefined) {
        result = result.filter(a => (a.priceFrom || 0) >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
        result = result.filter(a => (a.priceFrom || Infinity) <= filters.priceMax!);
    }

    // Filter by verified
    if (filters.isVerified) {
        result = result.filter(a => a.isVerified);
    }

    // Sorting
    switch (filters.sortBy) {
        case 'rating':
            result.sort((a, b) => b.rating - a.rating);
            break;
        case 'price':
            result.sort((a, b) => (a.priceFrom || 0) - (b.priceFrom || 0));
            break;
        case 'relevance':
        default:
            // Sort by: has availability on date > rating > profile completeness
            result.sort((a, b) => {
                // Priority to those available on search date
                if (filters.date) {
                    const aAvail = isArtistAvailableOnDate(a, filters.date!) ? 1 : 0;
                    const bAvail = isArtistAvailableOnDate(b, filters.date!) ? 1 : 0;
                    if (aAvail !== bAvail) return bAvail - aAvail;
                }
                // Then by rating
                if (a.rating !== b.rating) return b.rating - a.rating;
                // Then by completeness
                return b.profileCompleteness - a.profileCompleteness;
            });
    }

    return result;
}

// ===========================================
// UTILITIES
// ===========================================

/**
 * Generate URL-friendly slug from artist name
 */
function generateSlug(name: string): string {
    const base = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    // Add random suffix for uniqueness
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${base}-${suffix}`;
}

/**
 * Calculate profile completeness percentage
 */
export function calculateProfileCompleteness(artist: Partial<Artist>): number {
    let score = 0;
    const weights = {
        artistName: 10,
        profilePhoto: 15,
        coverPhoto: 5,
        bio: 15,
        genres: 10,
        city: 10,
        packages: 15,
        multimedia: 10,
        availability: 10,
    };

    if (artist.artistName && artist.artistName.length > 2) score += weights.artistName;
    if (artist.profilePhoto) score += weights.profilePhoto;
    if (artist.coverPhoto) score += weights.coverPhoto;
    if (artist.bio && artist.bio.length > 50) score += weights.bio;
    if (artist.genres && artist.genres.length > 0) score += weights.genres;
    if (artist.city) score += weights.city;
    if (artist.packages && artist.packages.length > 0) score += weights.packages;
    if (artist.multimedia?.videos?.length || artist.multimedia?.photos?.length) score += weights.multimedia;
    if (artist.availability && artist.availability.length > 0) score += weights.availability;

    return score;
}

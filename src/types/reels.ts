import { type UserMode } from './index';

export interface Reel {
    id: string;
    /** De dónde sale: una publicación de vídeo («posts») o el clip de un artista */
    origen?: 'post' | 'artista';
    /** Destino de «Ver perfil» (/artist/{slug} o /profile/{uid}) */
    perfilUrl?: string;
    /** Enlace que se comparte */
    shareUrl?: string;
    videoUrl: string;
    thumbnailUrl: string;
    description: string;

    authorId: string;
    authorName: string;
    authorPhoto: string;
    authorRole: UserMode;
    authorVerified?: boolean;

    songTitle?: string;
    songArtist?: string;

    likes: number;
    comments: number;
    shares: number;
    views: number;

    isLiked?: boolean;
    isSaved?: boolean;

    timestamp: number;
    tags?: string[];
    duration: number; // in seconds
    gumletId?: string; // ID del video en Gumlet
}

export interface ReelComment {
    id: string;
    authorId: string;
    authorName: string;
    authorPhoto: string;
    content: string;
    timestamp: number;
    likes: number;
    isLiked?: boolean;
    replies?: ReelComment[];
}

export type ReelSource = 'profile' | 'feed' | 'discover' | 'trending';

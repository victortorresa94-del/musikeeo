import { type UserMode } from './index';

export interface Reel {
    id: string;
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

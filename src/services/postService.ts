import {
    addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, limit, orderBy, query,
    updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import type { Post, UserMode } from '../types';

export const POST_LIMITS = {
    imageMB: 10,
    videoMB: 100,
    videoSeconds: 90,
    caption: 500,
};

export const isVideoFile = (f: File) => f.type.startsWith('video/');

// Fotograma del segundo ~0,5 como miniatura del vídeo (jpg, máx. 720 px de ancho)
export async function videoPoster(file: File): Promise<{ blob: Blob | null; duration: number }> {
    return new Promise(resolve => {
        const url = URL.createObjectURL(file);
        const v = document.createElement('video');
        v.preload = 'metadata'; v.muted = true; v.playsInline = true; v.src = url;
        const done = (blob: Blob | null) => { URL.revokeObjectURL(url); resolve({ blob, duration: v.duration || 0 }); };
        const timer = setTimeout(() => done(null), 6000);
        v.onloadedmetadata = () => { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); };
        v.onseeked = () => {
            try {
                const w = Math.min(720, v.videoWidth || 720);
                const h = Math.round(w * ((v.videoHeight || 1280) / (v.videoWidth || 720)));
                const c = document.createElement('canvas'); c.width = w; c.height = h;
                c.getContext('2d')?.drawImage(v, 0, 0, w, h);
                c.toBlob(b => { clearTimeout(timer); done(b); }, 'image/jpeg', 0.82);
            } catch { clearTimeout(timer); done(null); }
        };
        v.onerror = () => { clearTimeout(timer); done(null); };
    });
}

const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60);

function upload(path: string, data: Blob, contentType: string, onProgress?: (p: number) => void) {
    return new Promise<string>((resolve, reject) => {
        const task = uploadBytesResumable(ref(storage, path), data, { contentType });
        task.on('state_changed',
            s => onProgress?.(s.totalBytes ? s.bytesTransferred / s.totalBytes : 0),
            reject,
            () => getDownloadURL(task.snapshot.ref).then(resolve, reject));
    });
}

export const postService = {
    async create(params: {
        file: File;
        caption: string;
        author: { uid: string; name: string; photo?: string; role?: UserMode };
        onProgress?: (p: number) => void;
    }): Promise<Post> {
        const { file, caption, author, onProgress } = params;
        const video = isVideoFile(file);
        const stamp = Date.now();
        const base = `posts/${author.uid}/${stamp}`;
        const mediaPath = `${base}_${safeName(file.name || (video ? 'video.mp4' : 'foto.jpg'))}`;

        let posterUrl: string | undefined, posterPath: string | undefined;
        if (video) {
            const { blob } = await videoPoster(file);
            if (blob) {
                posterPath = `${base}_poster.jpg`;
                posterUrl = await upload(posterPath, blob, 'image/jpeg');
            }
        }
        const mediaUrl = await upload(mediaPath, file, file.type || (video ? 'video/mp4' : 'image/jpeg'), onProgress);

        const data: Omit<Post, 'id'> = {
            authorId: author.uid,
            authorName: author.name,
            ...(author.photo ? { authorPhoto: author.photo } : {}),
            ...(author.role ? { authorRole: author.role } : {}),
            mediaType: video ? 'video' : 'image',
            mediaUrl, mediaPath,
            ...(posterUrl ? { posterUrl, posterPath } : {}),
            caption: caption.trim().slice(0, POST_LIMITS.caption),
            likeCount: 0,
            createdAt: new Date().toISOString(),
        };
        const created = await addDoc(collection(db, 'posts'), data);
        return { id: created.id, ...data };
    },

    async recent(max = 20): Promise<Post[]> {
        const s = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(max)));
        return s.docs.map(d => ({ id: d.id, ...d.data() }) as Post);
    },

    async byAuthor(uid: string, max = 30): Promise<Post[]> {
        const s = await getDocs(query(collection(db, 'posts'), where('authorId', '==', uid), limit(max)));
        return s.docs.map(d => ({ id: d.id, ...d.data() }) as Post).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    // Qué posts de la lista ha marcado ya este usuario
    async likedBy(uid: string, postIds: string[]): Promise<Set<string>> {
        const checks = await Promise.all(postIds.map(id =>
            getDoc(doc(db, 'posts', id, 'likes', uid)).then(s => (s.exists() ? id : null)).catch(() => null)));
        return new Set(checks.filter((x): x is string => !!x));
    },

    async setLike(postId: string, uid: string, liked: boolean) {
        const b = writeBatch(db);
        const likeRef = doc(db, 'posts', postId, 'likes', uid);
        if (liked) b.set(likeRef, { uid, createdAt: new Date().toISOString() });
        else b.delete(likeRef);
        b.update(doc(db, 'posts', postId), { likeCount: increment(liked ? 1 : -1) });
        await b.commit();
    },

    async remove(post: Post) {
        await deleteDoc(doc(db, 'posts', post.id));
        await Promise.allSettled([
            deleteObject(ref(storage, post.mediaPath)),
            post.posterPath ? deleteObject(ref(storage, post.posterPath)) : Promise.resolve(),
        ]);
    },

    async updateCaption(postId: string, caption: string) {
        await updateDoc(doc(db, 'posts', postId), { caption: caption.trim().slice(0, POST_LIMITS.caption) });
    },

    async report(postId: string, reporterId: string, reason: string) {
        await addDoc(collection(db, 'reports'), {
            reporterId, targetType: 'post', targetId: postId, reason, createdAt: new Date().toISOString(),
        });
    },
};


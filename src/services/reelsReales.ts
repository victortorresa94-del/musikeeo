import type { Artist, Post } from '../types';
import type { Reel } from '../types/reels';
import { postService } from './postService';
import { explorarService } from './explorarService';
import { claveDe, type Objetivo } from './interaccionService';
import { estilosDe, type Rasgos } from '../lib/recomendador';

// La única fuente de reels: los vídeos que de verdad hay en Musikeeo.
//  · publicaciones de vídeo de la comunidad (colección «posts»)
//  · clips de artista (campo clipUrl de «artists»: mp4 vertical de 4 s, sin audio)
// Nada de contadores inventados: salen de interacciones/{clave} (services/interaccionService).

const CLIP_SEGUNDOS = 4;

/** Id del reel de un artista (no choca con los ids de «posts») */
export const idReelArtista = (a: Pick<Artist, 'id'>) => `artista-${a.id}`;

/** A qué se le da el me gusta o se comenta: la publicación o el artista del vídeo */
export const objetivoDeReel = (r: Reel): Objetivo => r.origen === 'artista'
    ? { tipo: 'artista', refId: r.id.replace(/^artista-/, ''), duenioId: r.authorId }
    : { tipo: 'post', refId: r.id, duenioId: r.authorId };

/** Su clave en interacciones: «post_<id>» o «artista_<id>» */
export const claveDeReel = (r: Reel) => claveDe(objetivoDeReel(r));

export function reelDePost(p: Post): Reel {
    return {
        id: p.id,
        origen: 'post',
        videoUrl: p.mediaUrl,
        thumbnailUrl: p.posterUrl || '',
        description: p.caption || '',
        authorId: p.authorId,
        authorName: p.authorName,
        authorPhoto: p.authorPhoto || '',
        authorRole: p.authorRole || 'musician',
        perfilUrl: `/profile/${p.authorId}`,
        shareUrl: `/reels/${p.id}`,
        // Los contadores de verdad están en interacciones/post_{id}: los pone quien los carga
        likes: 0, comments: 0, shares: 0, views: 0,
        timestamp: new Date(p.createdAt).getTime() || 0,
        duration: 0,
    };
}

/** «House y disco · Barcelona» */
function lineaArtista(a: Artist): string {
    const generos = (a.genres || []).slice(0, 2).map((g, i) => (i ? g.toLowerCase() : g)).join(' y ');
    const ciudad = (a.city || '').split(',')[0].trim();
    return [generos, ciudad].filter(Boolean).join(' · ');
}

export function reelDeArtista(a: Artist): Reel {
    const segundos = Number((a as Artist & { clipDuration?: number }).clipDuration);
    return {
        id: idReelArtista(a),
        origen: 'artista',
        videoUrl: a.clipUrl || '',
        thumbnailUrl: a.clipPoster || a.coverPhoto || a.profilePhoto || '',
        description: lineaArtista(a),
        authorId: a.userId,
        authorName: a.artistName,
        authorPhoto: a.profilePhoto || a.coverPhoto || '',
        authorRole: 'musician',
        authorVerified: !!a.isVerified,
        perfilUrl: `/artist/${a.slug}`,
        shareUrl: `/artist/${a.slug}`,
        likes: 0, comments: 0, shares: 0, views: 0,
        timestamp: new Date(a.updatedAt || a.createdAt || 0).getTime() || 0,
        duration: segundos > 0 ? segundos : CLIP_SEGUNDOS,
    };
}

/** Junta lo que ya se tiene cargado: primero las publicaciones de vídeo, luego los clips de artista */
export function reelsDe(posts: Post[], artistas: Artist[]): Reel[] {
    return [
        ...posts.filter(p => p.mediaType === 'video' && p.mediaUrl).map(reelDePost),
        ...artistas.filter(a => a.clipUrl && a.slug).map(reelDeArtista),
    ];
}

/** Carga todos los reels reales. Si «posts» no se puede leer (reglas sin desplegar), solo los clips */
export async function cargarReels(): Promise<Reel[]> {
    const [posts, artistas] = await Promise.all([
        postService.recent(20).catch(() => [] as Post[]),
        explorarService.artistas().catch(() => [] as Artist[]),
    ]);
    return reelsDe(posts, artistas);
}

/** Rasgos de un vídeo para el algoritmo, con lo que trae el propio reel (página /reels) */
export function rasgosDeReel(r: Reel): Rasgos {
    return {
        clave: claveDeReel(r),
        tipo: r.origen === 'artista' ? 'artista' : 'post',
        autor: r.authorId,
        estilos: estilosDe(r.description),
        formato: 'video',
        fecha: r.timestamp,
        likes: r.likes, comentarios: r.comments,
    };
}

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Search, Bell, MessageCircle, Play, Heart, MessageCircle as CommentIcon,
    Share2, BadgeCheck, ShoppingBag, Calendar, ArrowRight, Image as ImageIcon,
    Zap, Plus, Film
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { MOCK_REELS } from '../../services/reelsData';
import type { UserProfile } from '../../types';
import { cn } from '../../lib/utils';

// ─── Reels / Stories row ──────────────────────────────────────────────────────
const ReelsRow = ({ onOpen }: { onOpen: (id: string) => void }) => (
    <section className="mb-5">
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Film className="h-4 w-4 text-primary" /> Reels
            </h2>
            <button
                onClick={() => onOpen(MOCK_REELS[0].id)}
                className="text-xs text-primary font-medium hover:underline"
            >
                Ver todos
            </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4">
            {MOCK_REELS.slice(0, 8).map((reel) => (
                <button
                    key={reel.id}
                    onClick={() => onOpen(reel.id)}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
                >
                    {/* Thumbnail with play overlay */}
                    <div className="relative w-16 h-16">
                        <div className="w-16 h-16 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background overflow-hidden">
                            <img
                                src={reel.thumbnailUrl}
                                alt={reel.authorName}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/40 rounded-full p-1 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="h-3 w-3 text-white fill-white" />
                            </div>
                        </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[64px] text-center leading-tight">
                        {reel.authorName.split(' ')[0]}
                    </span>
                </button>
            ))}
        </div>
    </section>
);

// ─── Create post ──────────────────────────────────────────────────────────────
const CreatePostCard = ({ user }: { user: any }) => {
    const initials = user?.displayName
        ? user.displayName.slice(0, 2).toUpperCase()
        : 'TU';
    return (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/70 to-primary/40 flex items-center justify-center flex-shrink-0">
                    {user?.photoURL
                        ? <img src={user.photoURL} className="h-9 w-9 rounded-full object-cover" alt="" />
                        : <span className="text-xs font-bold text-primary-foreground">{initials}</span>
                    }
                </div>
                <div className="flex-1 bg-muted border border-border rounded-full px-4 py-2 text-sm text-muted-foreground cursor-pointer hover:border-primary/30 transition-colors">
                    ¿Qué estás creando hoy?
                </div>
            </div>
            <div className="flex items-center gap-1 pt-2 border-t border-border -mx-1">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-primary transition-colors text-xs font-medium">
                    <ImageIcon className="h-4 w-4" /> Foto/Video
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-primary transition-colors text-xs font-medium">
                    <Calendar className="h-4 w-4" /> Evento
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-primary transition-colors text-xs font-medium">
                    <ShoppingBag className="h-4 w-4" /> Vender
                </button>
            </div>
        </div>
    );
};

// ─── Nearby user chip ─────────────────────────────────────────────────────────
const NearbyChip = ({ user: u, onClick }: { user: UserProfile & { distance?: string }; onClick: () => void }) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={onClick}
        className="flex flex-col items-center gap-1 flex-shrink-0"
    >
        <div className="relative">
            <div className="h-14 w-14 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background overflow-hidden bg-muted">
                <img
                    src={u.photoURL || `https://i.pravatar.cc/56?u=${u.uid}`}
                    alt={u.displayName}
                    className="w-full h-full object-cover"
                />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-primary rounded-full border-2 border-background" />
        </div>
        <span className="text-[10px] text-muted-foreground truncate max-w-[60px] text-center">
            {u.displayName?.split(' ')[0] || 'Usuario'}
        </span>
    </motion.button>
);

// ─── Empty feed CTA ───────────────────────────────────────────────────────────
const EmptyFeed = ({ onExplore }: { onExplore: () => void }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 border border-dashed border-border rounded-2xl bg-card"
    >
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Film className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">Tu feed está vacío</h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-5">
            Sigue a músicos, técnicos y organizadores para ver su contenido aquí
        </p>
        <button
            onClick={onExplore}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-xl hover:brightness-105 transition-all text-sm"
        >
            <Zap className="h-4 w-4" /> Explorar artistas
        </button>
    </motion.div>
);

// ─── Reel preview card (for showing reels inline in feed) ─────────────────────
const ReelFeedCard = ({ reel, onPlay }: { reel: typeof MOCK_REELS[0]; onPlay: () => void }) => {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(reel.likes);

    const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
                <img
                    src={reel.authorPhoto}
                    alt={reel.authorName}
                    className="h-10 w-10 rounded-full object-cover border-2 border-border"
                />
                <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-foreground">{reel.authorName}</span>
                        {reel.authorVerified && (
                            <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{reel.authorRole}</span>
                </div>
                <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    🎬 Reel
                </span>
            </div>

            {/* Video thumbnail */}
            <div
                className="relative cursor-pointer group"
                onClick={onPlay}
            >
                <img
                    src={reel.thumbnailUrl}
                    alt={reel.description}
                    className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30 group-hover:scale-110 transition-transform">
                        <Play className="h-8 w-8 text-white fill-white" />
                    </div>
                </div>
                {reel.songTitle && (
                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2">
                        <div className="h-7 w-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm">🎵</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-white text-xs font-medium truncate">{reel.songTitle}</p>
                            <p className="text-white/60 text-[10px] truncate">{reel.songArtist}</p>
                        </div>
                        <span className="text-white/60 text-xs flex-shrink-0">{fmt(reel.views)} views</span>
                    </div>
                )}
            </div>

            {/* Description */}
            <div className="px-4 pt-3 pb-1">
                <p className="text-sm text-foreground line-clamp-2">{reel.description}</p>
                {reel.tags && reel.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {reel.tags.slice(0, 4).map(tag => (
                            <span key={tag} className="text-primary text-xs">#{tag}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-4 py-3 flex items-center gap-1 border-t border-border mt-2">
                <button
                    onClick={() => { setLiked(v => !v); setLikeCount(v => liked ? v - 1 : v + 1); }}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors hover:bg-muted', liked ? 'text-red-500' : 'text-muted-foreground')}
                >
                    <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
                    {fmt(likeCount)}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
                    <CommentIcon className="h-4 w-4" /> {fmt(reel.comments)}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
                    <Share2 className="h-4 w-4" /> {fmt(reel.shares)}
                </button>
            </div>
        </motion.article>
    );
};

// ─── Main Feed ────────────────────────────────────────────────────────────────
export default function Feed() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [nearbyUsers, setNearbyUsers] = useState<(UserProfile & { distance?: string })[]>([]);

    useEffect(() => {
        userService.getNearbyUsers().then(setNearbyUsers).catch(() => {});
    }, []);

    const openReel = (id: string) => {
        navigate(`/reels/${id}`, { state: { source: 'feed', from: '/feed' } });
    };

    return (
        <div className="max-w-2xl mx-auto pb-24">

            {/* ── Mobile header ── */}
            <div className="md:hidden sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 py-2.5 flex items-center justify-between -mx-4 mb-4">
                <div className="flex items-center gap-2">
                    <img src="/logo-musikeeo.png" alt="Musikeeo" className="h-7 w-7 rounded-lg object-contain" />
                    <span className="font-heading font-bold text-base tracking-wide text-foreground">
                        MUSIK<span className="text-primary">EEO</span>
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => navigate('/discover')}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <Search className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => navigate('/messages')}
                        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <MessageCircle className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary border border-background" />
                    </button>
                    <button className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border border-background" />
                    </button>
                </div>
            </div>

            <div className="px-4 md:px-0 pt-4 md:pt-6 space-y-4">

                {/* ── Reels row ── */}
                <ReelsRow onOpen={openReel} />

                {/* ── Talento cercano ── */}
                {nearbyUsers.length > 0 && (
                    <section className="mb-2">
                        <h2 className="text-sm font-bold text-foreground mb-3">Talento cerca de ti</h2>
                        <div className="flex gap-4 overflow-x-auto pb-1 hide-scrollbar">
                            {/* Add your story */}
                            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                <div className="relative h-14 w-14 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors">
                                    <Plus className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <span className="text-[10px] text-muted-foreground">Tu historia</span>
                            </div>
                            {nearbyUsers.slice(0, 8).map(u => (
                                <NearbyChip
                                    key={u.uid}
                                    user={u}
                                    onClick={() => navigate(`/profile/${u.uid}`)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Quick banners ── */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => navigate('/market')}
                        className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3 hover:border-primary/30 transition-colors text-left group"
                    >
                        <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="h-5 w-5 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-foreground leading-tight">Mercado</p>
                            <p className="text-[10px] text-muted-foreground">Compra y alquila</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors flex-shrink-0" />
                    </button>
                    <button
                        onClick={() => navigate('/eventos')}
                        className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3 hover:border-primary/30 transition-colors text-left group"
                    >
                        <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-foreground leading-tight">Eventos</p>
                            <p className="text-[10px] text-muted-foreground">Bolos y sesiones</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors flex-shrink-0" />
                    </button>
                </div>

                {/* ── Create post ── */}
                <CreatePostCard user={user} />

                {/* ── Feed: reels inline ── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-foreground">Para ti</h2>
                        <button
                            onClick={() => navigate('/discover')}
                            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                        >
                            Explorar <ArrowRight className="h-3 w-3" />
                        </button>
                    </div>

                    {/* Show first 3 reels as feed cards */}
                    {MOCK_REELS.slice(0, 3).map(reel => (
                        <ReelFeedCard
                            key={reel.id}
                            reel={reel}
                            onPlay={() => openReel(reel.id)}
                        />
                    ))}

                    {/* Empty feed CTA after reels */}
                    <EmptyFeed onExplore={() => navigate('/discover')} />
                </div>
            </div>
        </div>
    );
}

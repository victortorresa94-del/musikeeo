import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, MapPin, Calendar, ArrowRight, Heart, MessageCircle,
    Share2, MoreHorizontal, Play, Award, ShoppingBag, Zap,
    BadgeCheck, Image as ImageIcon, Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { userService } from '../../services/userService';
import { MOCK_EVENTS, MOCK_FEED_POSTS, getMoreFeedPosts } from '../../services/mockData';
import { type User, type Event, type FeedPost } from '../../types';
import { useNavigate, useLocation } from 'react-router-dom';

// Componente para mostrar tiempo relativo
const TimeAgo = ({ timestamp }: { timestamp: number }) => {
    const getTimeAgo = (ts: number) => {
        const seconds = Math.floor((Date.now() - ts) / 1000);
        if (seconds < 60) return 'Ahora';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d`;
        return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };
    return <span className="text-muted-foreground text-sm">{getTimeAgo(timestamp)}</span>;
};

// Componente para el badge del tipo de post
const PostTypeBadge = ({ type, milestoneType }: { type: FeedPost['type']; milestoneType?: string }) => {
    const badges = {
        event_highlight: { icon: Calendar, label: 'Evento', color: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20' },
        market_highlight: { icon: ShoppingBag, label: 'En venta', color: 'text-brand-lime bg-brand-lime/10 border-brand-lime/20' },
        milestone: { icon: Award, label: milestoneType === 'achievement' ? 'Logro' : 'Hito', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
        announcement: { icon: Zap, label: 'Anuncio', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
        post: null
    };

    const badge = badges[type];
    if (!badge) return null;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badge.color}`}>
            <badge.icon className="h-3 w-3" />
            {badge.label}
        </span>
    );
};

// Componente para una publicación del feed
const FeedPostCard = ({ post, onNavigate, onOpenReel }: {
    post: FeedPost;
    onNavigate: (path: string) => void;
    onOpenReel?: (postId: string) => void;
}) => {
    const [isLiked, setIsLiked] = useState(post.isLiked || false);
    const [likes, setLikes] = useState(post.likes);

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikes(prev => isLiked ? prev - 1 : prev + 1);
    };

    const formatNumber = (num: number) => {
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all"
        >
            {/* Post Header */}
            <div className="p-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="relative cursor-pointer"
                        onClick={() => onNavigate(`/profile/${post.authorId}`)}
                    >
                        <img
                            src={post.authorPhoto}
                            alt={post.authorName}
                            className="h-11 w-11 rounded-full object-cover border-2 border-transparent hover:border-brand-cyan transition-colors"
                        />
                        {post.authorVerified && (
                            <div className="absolute -bottom-0.5 -right-0.5 bg-brand-cyan rounded-full p-0.5">
                                <BadgeCheck className="h-3 w-3 text-black" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span
                                className="font-bold text-white hover:text-brand-cyan cursor-pointer transition-colors"
                                onClick={() => onNavigate(`/profile/${post.authorId}`)}
                            >
                                {post.authorName}
                            </span>
                            <PostTypeBadge type={post.type} milestoneType={post.milestoneType} />
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground capitalize">{post.authorRole}</span>
                            <span className="text-muted-foreground">·</span>
                            <TimeAgo timestamp={post.timestamp} />
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>

            {/* Post Content */}
            <div className="px-4 pb-3">
                <p className="text-white whitespace-pre-wrap leading-relaxed">{post.content}</p>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {post.tags.map(tag => (
                            <span key={tag} className="text-brand-cyan text-sm hover:underline cursor-pointer">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Event Data Card */}
            {post.eventData && (
                <div
                    className="mx-4 mb-3 p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => post.eventId && onNavigate(`/events/${post.eventId}`)}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-cyan/20 rounded-lg">
                            <Calendar className="h-5 w-5 text-brand-cyan" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm">{post.eventData.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {post.eventData.date && (
                                    <span>{new Date(post.eventData.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                )}
                                {post.eventData.location && (
                                    <>
                                        <span>·</span>
                                        <span>{post.eventData.location}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Market Data Card */}
            {post.marketData && (
                <div
                    className="mx-4 mb-3 p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => post.marketItemId && onNavigate(`/market/${post.marketItemId}`)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-lime/20 rounded-lg">
                                <ShoppingBag className="h-5 w-5 text-brand-lime" />
                            </div>
                            <p className="font-bold text-white text-sm">{post.marketData.title}</p>
                        </div>
                        {post.marketData.price && (
                            <span className="text-brand-lime font-bold">{post.marketData.price}€</span>
                        )}
                    </div>
                </div>
            )}

            {/* Images */}
            {post.images && post.images.length > 0 && (
                <div className={`grid gap-0.5 ${post.images.length === 1 ? 'grid-cols-1' :
                    post.images.length === 2 ? 'grid-cols-2' :
                        'grid-cols-2'
                    }`}>
                    {post.images.slice(0, 4).map((img, idx) => (
                        <div
                            key={idx}
                            className={`relative overflow-hidden ${post.images!.length === 1 ? 'aspect-video' :
                                post.images!.length === 3 && idx === 0 ? 'row-span-2 aspect-square' :
                                    'aspect-square'
                                }`}
                        >
                            <img
                                src={img}
                                alt=""
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                            {post.videoUrl && idx === 0 && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenReel?.(post.id);
                                    }}
                                >
                                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 hover:scale-110 transition-all">
                                        <Play className="h-8 w-8 text-white fill-white" />
                                    </div>
                                </div>
                            )}
                            {post.images!.length > 4 && idx === 3 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                    <span className="text-2xl font-bold text-white">+{post.images!.length - 4}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="p-4 flex items-center justify-between border-t border-white/5">
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                        onClick={handleLike}
                    >
                        <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="text-sm">{formatNumber(likes)}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-brand-cyan">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm">{formatNumber(post.comments)}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-brand-lime">
                        <Share2 className="h-5 w-5" />
                        <span className="text-sm">{formatNumber(post.shares)}</span>
                    </Button>
                </div>
            </div>
        </motion.article>
    );
};

// Componente para crear un nuevo post
const CreatePostCard = () => {
    return (
        <Card className="bg-card border-white/5 overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-petrol to-brand-cyan p-[1px]">
                        <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                            <span className="font-heading font-bold text-xs">TU</span>
                        </div>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-full px-4 py-2.5 text-muted-foreground text-sm cursor-pointer hover:bg-white/10 transition-colors">
                        ¿Qué estás creando hoy?
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                    <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground hover:text-brand-cyan gap-2">
                        <ImageIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Foto/Video</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground hover:text-brand-lime gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="hidden sm:inline">Evento</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground hover:text-purple-400 gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        <span className="hidden sm:inline">Vender</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default function Feed() {
    const navigate = useNavigate();
    const location = useLocation();
    const [nearbyUsers, setNearbyUsers] = useState<(User & { distance: string })[]>([]);
    const [opportunities, setOpportunities] = useState<Event[]>([]);
    const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const users = await userService.getNearbyUsers();
                setNearbyUsers(users);
                setOpportunities(MOCK_EVENTS);
                setFeedPosts(MOCK_FEED_POSTS);
            } catch (error) {
                console.error("Failed to load feed data", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Infinite scroll
    const loadMorePosts = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        // Optimized loading: Removed artificial delay
        // await new Promise(resolve => setTimeout(resolve, 800));

        const newPage = page + 1;
        const newPosts = getMoreFeedPosts(newPage);

        if (newPage >= 3) {
            setHasMore(false);
        }

        setFeedPosts(prev => [...prev, ...newPosts]);
        setPage(newPage);
        setLoadingMore(false);
    }, [page, loadingMore, hasMore]);

    useEffect(() => {
        if (loading) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    loadMorePosts();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [loading, hasMore, loadingMore, loadMorePosts]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-cyan mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando tu feed...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
            {/* Mobile Header - Only visible on mobile */}
            <div className="md:hidden flex items-center justify-between -mx-4 -mt-4 px-4 py-3 bg-background/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <img src="/logo-musikeeo.png" alt="Musikeeo" className="h-8 w-auto rounded-lg" />
                    <span className="text-xl font-heading font-bold text-white">Musikeeo</span>
                </div>
                <button
                    onClick={() => navigate('/messages')}
                    className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <MessageCircle className="h-6 w-6 text-white" />
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-brand-cyan shadow-[0_0_8px_#37B7F6]" />
                </button>
            </div>

            {/* AI Welcome Section - Compact */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-petrol/40 to-black border border-brand-cyan/20 p-5 md:p-6"
            >
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 bg-brand-cyan/20 blur-3xl rounded-full pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-brand-lime/10 rounded-full border border-brand-lime/20">
                            <Sparkles className="h-5 w-5 text-brand-lime animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-heading font-bold text-white">
                                Buen día. Hay {opportunities.length} oportunidades cerca.
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                <MapPin className="inline h-3 w-3 mr-1" />
                                Madrid, ES
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button className="bg-white text-black hover:bg-white/90 font-bold rounded-xl" size="sm" onClick={() => navigate('/events')}>
                            Ver Oportunidades
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Eventos Top - Horizontal Scroll */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                        <Zap className="h-5 w-5 text-brand-lime" />
                        Eventos Top
                    </h2>
                    <Button variant="link" className="text-brand-cyan hover:text-brand-cyan/80 p-0" onClick={() => navigate('/events')}>
                        Ver todo <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar -mx-4 px-4">
                    {opportunities.map((item) => (
                        <Card
                            key={item.id}
                            className="min-w-[240px] md:min-w-[280px] bg-card border-white/5 overflow-hidden group hover:border-brand-cyan/30 transition-all snap-start cursor-pointer shrink-0"
                            onClick={() => navigate(`/events/${item.id}`)}
                        >
                            <div className="h-28 w-full overflow-hidden relative">
                                <img src={item.imageUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500&q=80"} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute bottom-2 left-2 right-2">
                                    <h3 className="font-heading font-bold text-sm text-white truncate">{item.title}</h3>
                                    <p className="text-[11px] text-brand-cyan">{item.organizerName}</p>
                                </div>
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] uppercase font-bold text-white border border-white/10">
                                    {item.type === 'gig' ? 'Bolo' : 'Colab'}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Talento Cercano - Compact */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-heading font-bold text-white">Talento cerca de ti</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4">
                    {nearbyUsers.map((user) => (
                        <motion.div
                            key={user.uid}
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center shrink-0 cursor-pointer"
                            onClick={() => navigate(`/profile/${user.uid}`)}
                        >
                            <div className="relative mb-1">
                                <div className="h-16 w-16 rounded-full p-[2px] bg-gradient-to-br from-brand-lime to-brand-cyan">
                                    <img src={user.photoURL} alt={user.displayName} className="h-full w-full rounded-full object-cover border-2 border-background" />
                                </div>
                                <div className="absolute bottom-0 right-0 h-4 w-4 bg-brand-lime rounded-full border-2 border-background" />
                            </div>
                            <span className="text-xs font-medium text-white truncate max-w-[70px] text-center">{user.displayName.split(' ')[0]}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Create Post Card */}
            <CreatePostCard />

            {/* Feed Posts - Infinite Scroll */}
            <section className="space-y-4">
                <h2 className="text-lg font-heading font-bold text-white">Tu Feed</h2>

                <AnimatePresence>
                    {feedPosts.map((post) => (
                        <FeedPostCard
                            key={post.id}
                            post={post}
                            onNavigate={navigate}
                            onOpenReel={(postId) => {
                                navigate(`/reels/${postId}`, {
                                    state: {
                                        source: 'feed',
                                        from: location.pathname
                                    }
                                });
                            }}
                        />
                    ))}
                </AnimatePresence>

                {/* Load More Trigger */}
                <div ref={loadMoreRef} className="py-8 flex justify-center">
                    {loadingMore && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Cargando más publicaciones...</span>
                        </div>
                    )}
                    {!hasMore && (
                        <p className="text-muted-foreground text-sm">Has llegado al final del feed 🎉</p>
                    )}
                </div>
            </section>
        </div>
    );
}

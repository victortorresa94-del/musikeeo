import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    X, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
    BadgeCheck, Music2, ChevronUp, ChevronDown, Send, Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { type Reel, type ReelComment } from '../../types/reels';
import { getReelComments } from '../../services/reelsData';

interface ReelsViewerProps {
    reels: Reel[];
    initialIndex?: number;
    onClose: () => void;
    onLoadMore?: () => void;
    source?: 'profile' | 'feed' | 'discover' | 'trending';
}

// Componente individual de un Reel con Gumlet Player
const ReelItem = ({
    reel,
    isActive,
    onNavigateProfile
}: {
    reel: Reel;
    isActive: boolean;
    onNavigateProfile: (userId: string) => void;
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLiked, setIsLiked] = useState(reel.isLiked || false);
    const [isSaved, setIsSaved] = useState(reel.isSaved || false);
    const [likes, setLikes] = useState(reel.likes);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<ReelComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (showComments) {
            const loadedComments = getReelComments(reel.id);
            setComments(loadedComments);
        }
    }, [showComments, reel.id]);

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikes(prev => isLiked ? prev - 1 : prev + 1);
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const comment: ReelComment = {
            id: `comment_new_${Date.now()}`,
            authorId: 'current_user',
            authorName: 'Tú',
            authorPhoto: 'https://i.pravatar.cc/150?u=current',
            content: newComment,
            timestamp: Date.now(),
            likes: 0,
            isLiked: false
        };

        setComments(prev => [comment, ...prev]);
        setNewComment('');
    };

    // Construir la URL del embed de Gumlet con autoplay cuando está activo
    const getGumletEmbedUrl = () => {
        if (reel.gumletId) {
            const params = new URLSearchParams({
                autoplay: isActive ? 'true' : 'false',
                loop: 'true',
                muted: 'true', // Necesario para autoplay en la mayoría de navegadores
                preload: 'true',
                controls: 'false' // Mantenemos sin controles nativos para usar nuestra UI
            });
            return `https://play.gumlet.io/embed/${reel.gumletId}?${params.toString()}`;
        }
        return reel.videoUrl;
    };

    return (
        <div className="relative h-full w-full bg-black snap-start snap-always">
            {/* Video Player - Gumlet Embed */}
            <div className="absolute inset-0">
                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                        <Loader2 className="h-12 w-12 text-brand-cyan animate-spin" />
                    </div>
                )}

                {/* Thumbnail como fallback/placeholder */}
                <img
                    src={reel.thumbnailUrl}
                    alt=""
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${isActive && !isLoading ? 'opacity-0' : 'opacity-100'}`}
                />

                {/* Gumlet iframe player */}
                {isActive && (
                    <iframe
                        ref={iframeRef}
                        src={getGumletEmbedUrl()}
                        className="absolute inset-0 h-full w-full"
                        style={{ border: 'none' }}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        onLoad={() => setIsLoading(false)}
                    />
                )}
            </div>

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70 pointer-events-none" />

            {/* Touch area for interactions - doesn't block video */}
            <div className="absolute inset-0 z-5" />

            {/* Right side actions */}
            <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-10">
                {/* Profile Picture */}
                <div className="relative">
                    <button
                        onClick={() => onNavigateProfile(reel.authorId)}
                        className="block"
                    >
                        <img
                            src={reel.authorPhoto}
                            alt={reel.authorName}
                            className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-lg"
                        />
                    </button>
                    {reel.authorVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-brand-cyan rounded-full p-0.5">
                            <BadgeCheck className="h-3 w-3 text-black" />
                        </div>
                    )}
                </div>

                {/* Like */}
                <button
                    onClick={handleLike}
                    className="flex flex-col items-center gap-1"
                >
                    <motion.div
                        whileTap={{ scale: 1.3 }}
                        className={`p-3 rounded-full ${isLiked ? 'text-red-500' : 'text-white'} bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors`}
                    >
                        <Heart className={`h-7 w-7 ${isLiked ? 'fill-current' : ''}`} />
                    </motion.div>
                    <span className="text-white text-xs font-bold drop-shadow-lg">{formatNumber(likes)}</span>
                </button>

                {/* Comments */}
                <button
                    onClick={() => setShowComments(true)}
                    className="flex flex-col items-center gap-1"
                >
                    <div className="p-3 rounded-full text-white bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors">
                        <MessageCircle className="h-7 w-7" />
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow-lg">{formatNumber(reel.comments)}</span>
                </button>

                {/* Share */}
                <button className="flex flex-col items-center gap-1">
                    <div className="p-3 rounded-full text-white bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors">
                        <Share2 className="h-7 w-7" />
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow-lg">{formatNumber(reel.shares)}</span>
                </button>

                {/* Save */}
                <button
                    onClick={() => setIsSaved(!isSaved)}
                    className="flex flex-col items-center gap-1"
                >
                    <motion.div
                        whileTap={{ scale: 1.2 }}
                        className={`p-3 rounded-full ${isSaved ? 'text-yellow-400' : 'text-white'} bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors`}
                    >
                        <Bookmark className={`h-7 w-7 ${isSaved ? 'fill-current' : ''}`} />
                    </motion.div>
                </button>

                {/* More */}
                <button className="p-3 rounded-full text-white bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors">
                    <MoreHorizontal className="h-6 w-6" />
                </button>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-4 left-4 right-20 z-10">
                {/* Author info */}
                <button
                    onClick={() => onNavigateProfile(reel.authorId)}
                    className="flex items-center gap-2 mb-3"
                >
                    <span className="font-bold text-white text-lg drop-shadow-lg">{reel.authorName}</span>
                    {reel.authorVerified && (
                        <BadgeCheck className="h-5 w-5 text-brand-cyan" />
                    )}
                    <span className="text-white/70 text-sm capitalize drop-shadow-lg">· {reel.authorRole}</span>
                </button>

                {/* Description */}
                <p className="text-white text-sm leading-relaxed mb-3 line-clamp-2 drop-shadow-lg">
                    {reel.description}
                </p>

                {/* Song info */}
                {reel.songTitle && (
                    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit">
                        <Music2 className="h-4 w-4 text-white animate-spin" style={{ animationDuration: '3s' }} />
                        <span className="text-white text-xs font-medium truncate max-w-[200px]">
                            {reel.songArtist ? `${reel.songArtist} - ${reel.songTitle}` : reel.songTitle}
                        </span>
                    </div>
                )}
            </div>

            {/* Comments Panel */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute inset-0 bg-black/95 backdrop-blur-xl z-20 flex flex-col"
                    >
                        {/* Comments Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h3 className="text-white font-bold text-lg">
                                {comments.length} Comentarios
                            </h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowComments(false)}
                                className="text-white hover:bg-white/10"
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {comments.length === 0 ? (
                                <div className="text-center text-white/50 py-8">
                                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>Sé el primero en comentar</p>
                                </div>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="flex gap-3">
                                        <img
                                            src={comment.authorPhoto}
                                            alt={comment.authorName}
                                            className="h-10 w-10 rounded-full object-cover shrink-0"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-sm">
                                                    {comment.authorName}
                                                </span>
                                                <span className="text-white/40 text-xs">
                                                    {Math.floor((Date.now() - comment.timestamp) / (1000 * 60))}m
                                                </span>
                                            </div>
                                            <p className="text-white/80 text-sm mt-1">{comment.content}</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <button className="text-white/50 text-xs hover:text-white transition-colors">
                                                    {comment.likes} Me gusta
                                                </button>
                                                <button className="text-white/50 text-xs hover:text-white transition-colors">
                                                    Responder
                                                </button>
                                            </div>
                                        </div>
                                        <button className={`p-2 ${comment.isLiked ? 'text-red-500' : 'text-white/50'} hover:text-red-500 transition-colors`}>
                                            <Heart className={`h-4 w-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Comment Input */}
                        <form
                            onSubmit={handleSubmitComment}
                            className="p-4 border-t border-white/10 flex items-center gap-3"
                        >
                            <img
                                src="https://i.pravatar.cc/150?u=current"
                                alt="Tu foto"
                                className="h-10 w-10 rounded-full object-cover"
                            />
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Añade un comentario..."
                                className="flex-1 bg-white/10 border border-white/10 rounded-full px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-brand-cyan"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!newComment.trim()}
                                className="bg-brand-cyan text-black hover:bg-brand-cyan/90 disabled:opacity-50"
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function ReelsViewer({
    reels,
    initialIndex = 0,
    onClose,
    onLoadMore
}: ReelsViewerProps) {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [loadingMore, setLoadingMore] = useState(false);

    // Handle scroll snap
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const itemHeight = container.clientHeight;
            const newIndex = Math.round(scrollTop / itemHeight);

            if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
                setCurrentIndex(newIndex);
            }

            // Load more when near the end
            if (newIndex >= reels.length - 2 && onLoadMore && !loadingMore) {
                setLoadingMore(true);
                onLoadMore();
                setTimeout(() => setLoadingMore(false), 1000);
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [currentIndex, reels.length, onLoadMore, loadingMore]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowUp' && currentIndex > 0) {
                scrollToIndex(currentIndex - 1);
            } else if (e.key === 'ArrowDown' && currentIndex < reels.length - 1) {
                scrollToIndex(currentIndex + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, reels.length, onClose]);

    const scrollToIndex = (index: number) => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: index * containerRef.current.clientHeight,
                behavior: 'smooth'
            });
        }
    };

    const handleNavigateProfile = (userId: string) => {
        onClose();
        navigate(`/profile/${userId}`);
    };

    // Scroll to initial index on mount
    useEffect(() => {
        if (containerRef.current && initialIndex > 0) {
            containerRef.current.scrollTop = initialIndex * containerRef.current.clientHeight;
        }
    }, [initialIndex]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
        >
            {/* Close button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 left-4 z-30 text-white hover:bg-white/10 h-10 w-10"
            >
                <X className="h-6 w-6" />
            </Button>

            {/* Navigation hints */}
            <div className="absolute left-1/2 -translate-x-1/2 top-16 z-30 flex flex-col items-center gap-1 opacity-50 pointer-events-none">
                {currentIndex > 0 && (
                    <ChevronUp className="h-6 w-6 text-white animate-bounce" />
                )}
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-20 z-30 flex flex-col items-center gap-1 opacity-50 pointer-events-none">
                {currentIndex < reels.length - 1 && (
                    <ChevronDown className="h-6 w-6 text-white animate-bounce" />
                )}
            </div>

            {/* Reels container with snap scroll */}
            <div
                ref={containerRef}
                className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                style={{ scrollSnapType: 'y mandatory' }}
            >
                {reels.map((reel, index) => (
                    <div
                        key={reel.id}
                        className="h-full w-full snap-start snap-always"
                    >
                        <ReelItem
                            reel={reel}
                            isActive={index === currentIndex}
                            onNavigateProfile={handleNavigateProfile}
                        />
                    </div>
                ))}

                {/* Loading more indicator */}
                {loadingMore && (
                    <div className="h-20 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-brand-cyan animate-spin" />
                    </div>
                )}
            </div>

            {/* Desktop sidebar with reel counter */}
            <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-2">
                <span className="text-white/60 text-sm font-medium">
                    {currentIndex + 1} / {reels.length}
                </span>
            </div>
        </motion.div>
    );
}

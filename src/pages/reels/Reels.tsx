import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ReelsViewer from './ReelsViewer';
import { type Reel } from '../../types/reels';
import {
    MOCK_REELS,
    getReelsByUser,
    getFeedReels,
    getTrendingReels,
    getMoreReels,
    getReelById
} from '../../services/reelsData';
import { Loader2 } from 'lucide-react';

export default function Reels() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [reels, setReels] = useState<Reel[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialIndex, setInitialIndex] = useState(0);

    // Get source and userId from location state
    const source = location.state?.source || 'feed';
    const userId = location.state?.userId;

    useEffect(() => {
        const loadReels = async () => {
            setLoading(true);

            let loadedReels: Reel[] = [];
            let startIndex = 0;

            if (source === 'profile' && userId) {
                // Load reels from a specific user profile
                loadedReels = getReelsByUser(userId);

                // If we have a specific reel ID, find its index
                if (id) {
                    const index = loadedReels.findIndex(r => r.id === id);
                    if (index !== -1) startIndex = index;
                }
            } else if (source === 'trending') {
                loadedReels = getTrendingReels();
            } else {
                // Feed reels - algorithm based
                loadedReels = getFeedReels(0, 10);

                // If we have a specific reel ID, put it first
                if (id) {
                    const targetReel = getReelById(id);
                    if (targetReel) {
                        loadedReels = [targetReel, ...loadedReels.filter(r => r.id !== id)];
                    }
                }
            }

            // Fallback to all reels if none loaded
            if (loadedReels.length === 0) {
                loadedReels = MOCK_REELS;
            }

            setReels(loadedReels);
            setInitialIndex(startIndex);
            setLoading(false);
        };

        loadReels();
    }, [id, source, userId]);

    const handleClose = () => {
        // Go back or to home if no history
        if (location.state?.from) {
            navigate(location.state.from);
        } else {
            navigate(-1);
        }
    };

    const handleLoadMore = useCallback(() => {
        const excludeIds = reels.map(r => r.id);
        const moreReels = getMoreReels(excludeIds, 3);

        // Add new reels, avoiding duplicates
        setReels(prev => {
            const newReels = moreReels.filter(r => !prev.find(p => p.id === r.id));
            return [...prev, ...newReels];
        });
    }, [reels]);

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-brand-cyan animate-spin" />
            </div>
        );
    }

    if (reels.length === 0) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-4">
                <p className="text-white text-lg">No hay videos disponibles</p>
                <button
                    onClick={handleClose}
                    className="px-6 py-2 bg-brand-cyan text-black font-bold rounded-full hover:bg-brand-cyan/90 transition-colors"
                >
                    Volver
                </button>
            </div>
        );
    }

    return (
        <AnimatePresence>
            <ReelsViewer
                reels={reels}
                initialIndex={initialIndex}
                onClose={handleClose}
                onLoadMore={handleLoadMore}
            />
        </AnimatePresence>
    );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { ArrowLeft, MessageSquare, MapPin, Music, Play, Grid3X3, Film, BadgeCheck } from 'lucide-react';
import { userService } from '../../services/userService';
import { type User } from '../../types';
import { type Reel } from '../../types/reels';
import { getReelsByUser, MOCK_REELS } from '../../services/reelsData';
import { Loader2 } from 'lucide-react';

export default function PublicProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'portfolio' | 'videos'>('videos');
    const [userReels, setUserReels] = useState<Reel[]>([]);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!id) return;
            try {
                const data = await userService.getUserProfile(id);
                setProfile(data);

                // Cargar reels del usuario
                let reels = getReelsByUser(id);
                // Si no hay reels específicos, usar algunos mock
                if (reels.length === 0) {
                    reels = MOCK_REELS.slice(0, 4);
                }
                setUserReels(reels);
            } catch (error) {
                console.error("Error loading profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    const handleOpenReel = (reel: Reel, index: number) => {
        navigate(`/reels/${reel.id}`, {
            state: {
                source: 'profile',
                userId: id,
                from: location.pathname
            }
        });
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    if (loading) {
        return (
            <div className="h-[50vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-20 animate-fade-in-up">
                <h2 className="text-2xl font-bold text-white mb-4">Usuario no encontrado</h2>
                <Button onClick={() => navigate('/')}>Volver al Inicio</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-muted-foreground hover:text-white">
                <ArrowLeft className="w-4 h-4" /> Volver
            </Button>

            {/* Profile Header */}
            <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden bg-zinc-900 border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-brand-petrol/20 to-black/80 z-10" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1000&q=80')] bg-cover bg-center opacity-40 grayscale" />

                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col md:flex-row items-end gap-6">
                    <div className="h-32 w-32 rounded-full border-4 border-black shadow-2xl relative">
                        <img
                            src={profile.photoURL || "https://github.com/shadcn.png"}
                            alt={profile.displayName}
                            className="h-full w-full rounded-full object-cover bg-zinc-800"
                        />
                        {/* Online Status Dot */}
                        <div className="absolute bottom-1 right-2 w-5 h-5 bg-brand-lime border-4 border-black rounded-full"></div>
                    </div>

                    <div className="flex-1 mb-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-heading font-bold text-white shadow-black drop-shadow-lg">{profile.displayName}</h1>
                            {profile.verified && (
                                <span className="bg-brand-cyan text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <BadgeCheck className="h-3 w-3" />
                                    PRO
                                </span>
                            )}
                        </div>
                        <p className="text-brand-cyan font-medium text-lg flex items-center gap-2 mt-1">
                            {profile.role.toUpperCase()}
                            <span className="text-white/30 text-sm">•</span>
                            <span className="text-sm text-gray-300 flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {profile.location || "Ubicación desconocida"}
                            </span>
                        </p>
                    </div>

                    <div className="flex gap-3 mb-2">
                        <Button className="bg-brand-lime text-black hover:bg-brand-lime/90 font-bold px-6" onClick={() => navigate('/messages')}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Contactar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-center gap-8 py-4 border-y border-white/10">
                <div className="text-center">
                    <span className="block text-2xl font-bold text-white">{userReels.length}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Videos</span>
                </div>
                {profile.stats && (
                    <>
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-white">{profile.stats.gigs}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Bolos</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-brand-lime">{profile.stats.rating}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Rating</span>
                        </div>
                    </>
                )}
                <div className="text-center">
                    <span className="block text-2xl font-bold text-white">1.2K</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Seguidores</span>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: About & Skills */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                        <h3 className="font-heading font-bold text-white mb-4">Sobre mí</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {profile.bio || "Este usuario aún no ha escrito su biografía."}
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                        <h3 className="font-heading font-bold text-white mb-4">Habilidades</h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills?.map(skill => (
                                <span key={skill} className="bg-white/10 text-white text-xs px-3 py-1 rounded-full border border-white/10">
                                    {skill}
                                </span>
                            )) || <span className="text-muted-foreground text-xs">Sin habilidades listadas</span>}
                        </div>
                    </div>

                    {profile.genres && profile.genres.length > 0 && (
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                            <h3 className="font-heading font-bold text-white mb-4">Géneros</h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.genres.map(genre => (
                                    <span key={genre} className="bg-brand-cyan/10 text-brand-cyan text-xs px-3 py-1 rounded-full border border-brand-cyan/20">
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Videos / Portfolio */}
                <div className="md:col-span-2 space-y-4">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('videos')}
                            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative
                                ${activeTab === 'videos'
                                    ? 'text-white'
                                    : 'text-muted-foreground hover:text-white'
                                }`}
                        >
                            <Film className="h-4 w-4" />
                            Videos
                            {activeTab === 'videos' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('portfolio')}
                            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative
                                ${activeTab === 'portfolio'
                                    ? 'text-white'
                                    : 'text-muted-foreground hover:text-white'
                                }`}
                        >
                            <Grid3X3 className="h-4 w-4" />
                            Portfolio
                            {activeTab === 'portfolio' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan" />
                            )}
                        </button>
                    </div>

                    {/* Videos Grid - Estilo Instagram/TikTok */}
                    {activeTab === 'videos' && (
                        <div className="grid grid-cols-3 gap-1">
                            {userReels.map((reel, index) => (
                                <button
                                    key={reel.id}
                                    onClick={() => handleOpenReel(reel, index)}
                                    className="aspect-[9/16] bg-zinc-900 rounded-lg overflow-hidden relative group"
                                >
                                    <img
                                        src={reel.thumbnailUrl}
                                        alt={reel.description}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />

                                    {/* Play icon */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                                            <Play className="h-6 w-6 text-white fill-white" />
                                        </div>
                                    </div>

                                    {/* Views count */}
                                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-medium">
                                        <Play className="h-3 w-3 fill-white" />
                                        {formatNumber(reel.views)}
                                    </div>

                                    {/* Duration */}
                                    <div className="absolute bottom-2 right-2 text-white text-xs font-medium bg-black/50 px-1.5 py-0.5 rounded">
                                        0:{reel.duration < 10 ? `0${reel.duration}` : reel.duration}
                                    </div>
                                </button>
                            ))}

                            {/* Empty state */}
                            {userReels.length === 0 && (
                                <div className="col-span-3 py-16 text-center">
                                    <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">Este usuario aún no ha subido videos</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Portfolio Grid */}
                    {activeTab === 'portfolio' && (
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-video bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-center relative group overflow-hidden">
                                    <div className="absolute inset-0 bg-black/50 group-hover:bg-transparent transition-all" />
                                    <Music className="h-8 w-8 text-white/20 group-hover:text-white/50 transition-colors" />
                                    <span className="absolute bottom-2 left-2 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">Demo Track {i}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Play, Share2, ArrowLeft, Music, ShieldCheck, Camera, Plus, X, Edit3, Save } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../context/AuthContext';
import { getArtistByUserId, createArtist, updateArtist } from '../../services/artistService';
import { type Artist } from '../../types';

import { useNavigate } from 'react-router-dom';
import { type Reel } from '../../types/reels';
import { getReelsByUser } from '../../services/reelsData';

export default function Profile() {
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();

    // State for interactive uploads & Edit Mode
    const [isEditing, setIsEditing] = useState(false);
    const [avatar, setAvatar] = useState<string>(user?.photoURL || "/avatar.png");
    const [cover, setCover] = useState<string>("/cover.png");
    const [isLoading, setIsLoading] = useState(false);
    const [artistId, setArtistId] = useState<string | null>(null);


    // Profile Data State
    const [profile, setProfile] = useState({
        name: user?.displayName || "Tu Nombre",
        role: "Músico",
        location: "Madrid, Spain",
        about: "Cuéntanos sobre ti...",
        stats: {
            gigs: 0,
            rating: 0,
            reviews: 0
        },
        trustScore: 80,
        skills: [] as string[],
        genres: [] as string[],
        isPublic: false
    });

    useEffect(() => {
        const loadProfile = async () => {
            if (user?.uid) {
                setIsLoading(true);
                try {
                    const artistData = await getArtistByUserId(user.uid);

                    if (artistData) {
                        setArtistId(artistData.id);
                        setProfile(prev => ({
                            ...prev,
                            name: artistData.artistName || user.displayName || prev.name,
                            role: "Músico", // Fixed for now
                            location: artistData.city || prev.location,
                            about: artistData.bio || prev.about,
                            skills: artistData.tags || prev.skills,
                            genres: artistData.genres || prev.genres,
                            stats: {
                                gigs: artistData.gigsCompleted,
                                rating: artistData.rating,
                                reviews: artistData.reviewCount
                            }
                        }));
                        if (artistData.profilePhoto) setAvatar(artistData.profilePhoto);
                        if (artistData.coverPhoto) setCover(artistData.coverPhoto);
                        setProfile(prev => ({ ...prev, isPublic: artistData.isPublic }));
                    } else {
                        // Initialize empty state if no profile yet
                        if (userProfile) {
                            setProfile(prev => ({
                                ...prev,
                                name: userProfile.displayName || prev.name
                            }));
                        }
                    }
                } catch (error) {
                    console.error("Failed to load profile", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadProfile();
    }, [user, userProfile]);

    const [userReels, setUserReels] = useState<Reel[]>([]);

    useEffect(() => {
        // Cargar reels del usuario (usando 'user_1' como fallback para demo si el usuario es 'lucas@example.com' o similar)
        // En un caso real usariamos user.uid
        const userIdToLoad = user?.uid || 'user_1';
        // Para la demo, forzamos cargar los reels de 'user_1' (Lucas) si somos nosotros, para ver el ejemplo
        // O mejor: si el usuario tiene reels en mock data, cargarlos.
        const reels = getReelsByUser(userIdToLoad);
        if (reels.length > 0) {
            setUserReels(reels);
        } else {
            // Fallback to Lucas Guitar reels for demo purposes if current user has none
            setUserReels(getReelsByUser('user_1'));
        }
    }, [user]);

    // Refs for file inputs
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // Mock Data for Gigs (Read-only for now)
    const gigs = [
        { id: 1, title: "Jazz Night at Café Central", role: "Solo Guitarist", date: "Hace 2 semanas", rating: 5.0 },
        { id: 2, title: "Wedding Ceremony", role: "Accompanist", date: "Hace 1 mes", rating: 5.0 },
        { id: 3, title: "Corporate Event", role: "Background Music", date: "Hace 1.5 meses", rating: 4.8 }
    ];

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover' | 'gallery') => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                if (type === 'avatar') setAvatar(result);
                if (type === 'cover') setCover(result);
                // Gallery upload disabled temporarily as we moved to Reels
                // if (type === 'gallery') ...
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleEditMode = async () => {
        if (isEditing && user?.uid) {
            // Saving...
            setIsLoading(true);
            try {
                const artistData: Partial<Artist> = {
                    artistName: profile.name,
                    city: profile.location,
                    bio: profile.about,
                    tags: profile.skills,
                    genres: profile.genres,
                    profilePhoto: avatar,
                    coverPhoto: cover,
                    isPublic: profile.isPublic
                };

                if (artistId) {
                    await updateArtist(artistId, artistData);
                } else {
                    const newArtist = await createArtist(user.uid, artistData);
                    setArtistId(newArtist.id);
                }
            } catch (error) {
                console.error("Failed to save profile", error);
            } finally {
                setIsLoading(false);
            }
        }
        setIsEditing(!isEditing);
    };

    const handleClipClick = (reelId: string) => {
        navigate(`/reels/${reelId}`, {
            state: {
                source: 'profile',
                userId: user?.uid || 'user_1', // Para que el viewer sepa qué lista cargar
                from: '/profile'
            }
        });
    };

    // Video navigation functions removed as we use Reels viewer now

    // Loading State
    if (isLoading && !isEditing) { // Don't show full screen loader if just saving
        return (
            <div className="flex items-center justify-center min-h-screen bg-brand-black/90">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-yellow"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-black text-brand-white pb-32 font-sans overflow-x-hidden selection:bg-brand-yellow/30">
            {/* Hidden File Inputs */}
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
            <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} />
            <input type="file" ref={galleryInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => handleFileChange(e, 'gallery')} />

            {/* 1. Header / Cover Section */}
            <header className="relative w-full h-[320px]">
                {/* Background Image - REMOVED BLUR per request */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                    style={{ backgroundImage: `url("${cover}")` }}
                >
                    <div className="absolute inset-0 bg-brand-black/20 bg-gradient-to-t from-brand-black via-transparent to-transparent"></div>
                </div>

                {/* Edit Cover Button (Visible in Edit Mode) */}
                {isEditing && (
                    <button
                        onClick={() => coverInputRef.current?.click()}
                        className="absolute top-20 right-4 z-30 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md transition-colors border border-white/20 shadow-lg"
                    >
                        <Camera className="w-5 h-5" />
                    </button>
                )}

                {/* Top Nav Actions */}
                <div className="absolute top-4 left-0 right-0 px-4 flex justify-between items-center z-20">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full bg-black/20 backdrop-blur-md">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full bg-black/20 backdrop-blur-md">
                            <Share2 className="h-6 w-6" />
                        </Button>
                    </div>
                </div>

                {/* Avatar Layer - Overlapping Bottom Left */}
                <div className="absolute -bottom-16 left-6 z-20">
                    <div className="relative group">
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={avatar}
                            alt={profile.name}
                            className={`w-36 h-36 rounded-full border-4 border-brand-black shadow-2xl object-cover bg-brand-charcoal ${isEditing ? 'brightness-75' : ''}`}
                        />
                        {/* Edit Avatar Overlay */}
                        {isEditing && (
                            <div
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute inset-0 rounded-full flex items-center justify-center cursor-pointer bg-black/30 hover:bg-black/50 transition-colors border-4 border-transparent"
                            >
                                <Camera className="w-10 h-10 text-white drop-shadow-md" />
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Container */}
            <main className="px-6 pt-20 max-w-5xl mx-auto space-y-8">

                {/* Identity Section */}
                <div className="flex flex-col items-start gap-2">
                    <div className="flex flex-col w-full gap-1">
                        {isEditing ? (
                            <Input
                                value={profile.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, name: e.target.value })}
                                className="text-3xl font-bold bg-brand-charcoal border-white/10 text-white h-12"
                                placeholder="Nombre Artístico"
                            />
                        ) : (
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight text-white">{profile.name}</h1>
                                <Badge className="bg-brand-charcoal text-brand-yellow border border-brand-yellow/30 px-2 py-0.5 text-[10px] h-5 gap-1">
                                    <ShieldCheck className="w-3 h-3" /> TrustScore {profile.trustScore}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <Input
                            value={profile.role}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, role: e.target.value })}
                            className="bg-brand-charcoal border-white/10 text-gray-300"
                            placeholder="Rol Principal"
                        />
                    ) : (
                        <h2 className="text-base text-gray-300 font-medium">{profile.role}</h2>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4 text-brand-yellow" />
                        {isEditing ? (
                            <Input
                                value={profile.location}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, location: e.target.value })}
                                className="bg-brand-charcoal border-white/10 text-gray-400 h-8 text-sm"
                                placeholder="Ubicación"
                            />
                        ) : (
                            profile.location
                        )}
                    </div>

                    {isEditing ? (
                        <Textarea
                            value={profile.about}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile({ ...profile, about: e.target.value })}
                            className="bg-brand-charcoal border-white/10 text-white mt-4 min-h-[100px]"
                            placeholder="Sobre mí..."
                        />
                    ) : (
                        <p className="text-gray-400 leading-relaxed text-sm mt-4 max-w-2xl">
                            {profile.about}
                        </p>
                    )}
                </div>

                {/* 2. Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-brand-charcoal border-none shadow-md rounded-2xl overflow-hidden">
                        <CardContent className="p-6 flex flex-col items-start justify-center h-32 relative">
                            <Music className="absolute -right-4 -bottom-4 w-24 h-24 text-brand-yellow/10 rotate-12" />
                            <div className="flex items-center gap-2 mb-2">
                                <Music className="w-5 h-5 text-brand-yellow" />
                                <span className="text-xs uppercase tracking-wider text-brand-yellow font-bold">Bolos</span>
                            </div>
                            <span className="text-4xl font-bold text-white">{profile.stats.gigs}</span>
                            <span className="text-xs text-gray-400 mt-1">Realizados</span>
                        </CardContent>
                    </Card>
                    <Card className="bg-brand-charcoal border-none shadow-md rounded-2xl overflow-hidden">
                        <CardContent className="p-6 flex flex-col items-start justify-center h-32 relative">
                            <Star className="absolute -right-4 -bottom-4 w-24 h-24 text-brand-warm/10 rotate-12" />
                            <div className="flex items-center gap-2 mb-2">
                                <Star className="w-5 h-5 text-brand-yellow" />
                                <span className="text-xs uppercase tracking-wider text-brand-yellow font-bold">Reseñas</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-4xl font-bold text-white">{profile.stats.rating} <span className="text-lg text-gray-500 font-normal">/5</span></span>
                                <span className="text-xs text-gray-400 mt-0.5">{profile.stats.reviews} reviews</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. Skills (Habilidades) */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">Habilidades</h3>
                        {isEditing && <Button variant="ghost" size="sm" className="text-brand-yellow h-8"><Plus className="w-4 h-4 mr-1" /> Añadir</Button>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, i) => (
                            <Badge key={i} className="bg-brand-charcoal hover:bg-brand-charcoal/80 text-white border border-white/10 px-4 py-1.5 rounded-full text-sm font-normal relative group">
                                {skill}
                                {isEditing && <X className="w-3 h-3 ml-2 cursor-pointer text-red-400 hover:text-red-300" />}
                            </Badge>
                        ))}
                    </div>
                </section>

                {/* 4. Genres (Géneros) - SEPARATED */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">Géneros</h3>
                        {isEditing && <Button variant="ghost" size="sm" className="text-brand-yellow h-8"><Plus className="w-4 h-4 mr-1" /> Añadir</Button>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {profile.genres.map((genre, i) => (
                            <Badge key={i} className="bg-brand-black hover:bg-brand-black/80 text-gray-300 border border-white/10 px-4 py-1.5 rounded-full text-sm font-normal relative">
                                {genre}
                                {isEditing && <X className="w-3 h-3 ml-2 cursor-pointer text-red-400 hover:text-red-300" />}
                            </Badge>
                        ))}
                    </div>
                </section>

                {/* 5. Media Gallery */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Clips destacados</h3>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-brand-yellow hover:bg-brand-yellow/10 px-2 h-8"
                                onClick={() => galleryInputRef.current?.click()}
                            >
                                <Plus className="w-4 h-4 mr-1" /> Añadir
                            </Button>
                            <Button variant="link" className="text-brand-yellow text-sm h-auto p-0 hover:text-brand-yellow/80">Ver todo</Button>
                        </div>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {userReels.map((reel) => (
                            <div
                                key={reel.id}
                                onClick={() => handleClipClick(reel.id)}
                                className="relative aspect-[9/16] h-[280px] min-w-[160px] rounded-xl overflow-hidden group cursor-pointer snap-start border border-white/5 bg-brand-charcoal"
                            >
                                <img
                                    src={reel.thumbnailUrl}
                                    alt={reel.description}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                                        <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                                    </div>
                                </div>

                                <div className="absolute bottom-3 left-3 right-3">
                                    <p className="text-white text-xs font-medium line-clamp-2 drop-shadow-md">
                                        {reel.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-white/80">
                                        <span className="flex items-center gap-1"><Play className="w-2 h-2 fill-current" /> {reel.views}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {userReels.length === 0 && (
                            <div className="flex items-center justify-center w-full h-32 bg-brand-charcoal/50 rounded-xl border border-white/5 text-gray-500 text-sm">
                                No tienes clips aún
                            </div>
                        )}
                    </div>
                </section>

                {/* 6. TrustScore */}
                <section className="bg-brand-charcoal rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-brand-yellow" />
                            <h3 className="font-bold text-white">TrustScore Pro</h3>
                        </div>
                        <span className="text-2xl font-bold text-brand-warm">{profile.trustScore}<span className="text-sm text-gray-500 font-normal">/100</span></span>
                    </div>
                    <div className="w-full bg-black/40 h-2 rounded-full mb-2 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: '98%' }}
                            viewport={{ once: true }}
                            className="bg-gradient-to-r from-brand-yellow to-brand-warm h-full rounded-full"
                        />
                    </div>
                    <p className="text-xs text-gray-400">Basado en 24 bolos verificados, tiempo de respuesta y valoraciones de clientes.</p>
                </section>

                {/* 7. Gig History */}
                <section className="space-y-4 pb-24">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Historial reciente</h3>
                        <Button variant="link" className="text-brand-yellow text-sm h-auto p-0 hover:text-brand-yellow/80">Ver completo</Button>
                    </div>

                    <div className="space-y-3">
                        {gigs.map((gig) => (
                            <div key={gig.id} className="bg-brand-charcoal p-3 rounded-xl flex items-center justify-between hover:bg-brand-charcoal/80 transition-colors cursor-default border border-white/5">
                                <div className="flex items-center gap-3">
                                    <img
                                        src="/avatar.png"
                                        alt="Gig"
                                        className="w-12 h-12 rounded-lg object-cover bg-zinc-800"
                                    />
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{gig.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{gig.role}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] text-gray-400">{gig.date}</span>
                                    <div className="flex items-center gap-1 text-brand-warm text-xs font-bold">
                                        <Star className="w-3 h-3 fill-current" /> {gig.rating}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Video Player Modal is removed as we navigate to dedicated Reels page */}

            {/* Fixed CTA (Hidden in Edit Mode) */}
            {/* Fixed CTA for Owner */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-40">
                <Button
                    onClick={async () => {
                        if (!profile.isPublic) {
                            // Publish First Time
                            setIsLoading(true);
                            try {
                                if (artistId) {
                                    await updateArtist(artistId, { isPublic: true });
                                    setProfile(prev => ({ ...prev, isPublic: true }));
                                    // Could show success toast here
                                }
                            } finally {
                                setIsLoading(false);
                            }
                        } else {
                            // Update (Toggle Edit Mode)
                            toggleEditMode();
                        }
                    }}
                    className={`w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ring-1 ring-white/10 active:scale-[0.98]
                        ${isEditing
                            ? "bg-green-500 hover:bg-green-600 text-white shadow-[0_4px_20px_rgba(34,197,94,0.5)]"
                            : !profile.isPublic
                                ? "bg-brand-yellow hover:bg-brand-warm text-brand-black shadow-[0_4px_20px_rgba(255,216,77,0.5)]"
                                : "bg-brand-charcoal border border-white/20 text-white hover:bg-white/10"
                        }
                    `}
                >
                    {isEditing ? (
                        <>
                            <Save className="w-5 h-5" />
                            Guardar Cambios
                        </>
                    ) : !profile.isPublic ? (
                        <>
                            <Play className="w-5 h-5 fill-current" />
                            Publicar mi perfil
                        </>
                    ) : (
                        <>
                            <Edit3 className="w-5 h-5" />
                            Actualizar mi perfil
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    MapPin, Star, CheckCircle, Play, Calendar as CalendarIcon,
    Clock, Music, ChevronLeft, ChevronRight, MessageCircle, Share2, Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '../../components/home/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';
import { getArtistBySlug } from '../../services/artistService';
import { chatService } from '../../services/chatService';
import type { Artist, ServicePackage } from '../../types';

import { ProfileHeaderSkeleton } from '../../components/ui/Skeletons';

const MONTHS_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function ArtistProfilePage() {
    const { slug } = useParams<{ slug: string }>();
    const { user } = useAuth();
    const [artist, setArtist] = useState<Artist | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
    const [calendarDate, setCalendarDate] = useState(new Date());

    useEffect(() => {
        loadArtist();
    }, [slug]);

    const loadArtist = async () => {
        if (!slug) return;
        try {
            const data = await getArtistBySlug(slug);
            setArtist(data);
            if (data?.packages.length) {
                setSelectedPackage(data.packages[0]);
            }
        } catch (error) {
            console.error('Error loading artist:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDateStatus = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return artist?.availability.find(d => d.date === dateStr);
    };

    const isToday = (date: Date): boolean => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const navigate = useNavigate();

    const handleContact = async () => {
        if (!user) {
            toast.error("Debes iniciar sesión para contactar");
            navigate('/login');
            return;
        }
        if (!artist) return;

        try {
            toast.info(`Iniciando conversación con ${artist.artistName}...`);
            const chatId = await chatService.createChat(user.uid, artist.userId);
            navigate('/messages', { state: { selectedChatId: chatId } });
        } catch (error) {
            console.error("Error creating chat:", error);
            toast.error("Error al iniciar chat");
        }
    };

    const handleBooking = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        // Stub for booking
        toast.success(`Solicitud de presupuesto enviada a ${artist?.artistName}`);
    };

    // Calendar days generator
    const generateCalendarDays = () => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;

        const days: { date: Date; inMonth: boolean }[] = [];

        // Previous month
        const prevLastDay = new Date(year, month, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({ date: new Date(year, month - 1, prevLastDay - i), inMonth: false });
        }

        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ date: new Date(year, month, i), inMonth: true });
        }

        // Next month
        const remaining = 35 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ date: new Date(year, month + 1, i), inMonth: false });
        }

        return days;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <ProfileHeaderSkeleton />
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="min-h-screen bg-background text-white">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                    <h1 className="text-3xl font-bold">Artista no encontrado</h1>
                    <p className="text-gray-500">El perfil que buscas no existe o no está disponible</p>
                    <Link to="/artistas" className="text-primary hover:underline">
                        Ver todos los artistas
                    </Link>
                </div>
            </div>
        );
    }

    const isOwner = user?.uid === artist.userId;
    if (!artist.isPublic && !isOwner) {
        return (
            <div className="min-h-screen bg-background text-white">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                    <div className="bg-white/10 p-4 rounded-full">
                        <Share2 size={40} className="text-gray-400" />
                    </div>
                    <h1 className="text-3xl font-bold">Perfil Privado</h1>
                    <p className="text-gray-500">Este perfil es privado y solo visible por su dueño.</p>
                    <Link to="/artistas" className="text-primary hover:underline">
                        Volver a descubrir
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-white">
            <Navbar />

            {/* Cover Section */}
            <section className="relative pt-20">
                {/* Cover Image */}
                <div className="h-64 md:h-80 lg:h-96 w-full relative">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: artist.coverPhoto
                                ? `url(${artist.coverPhoto})`
                                : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                </div>

                {/* Profile Info Overlay */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-32 relative z-10">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                        {/* Avatar */}
                        <div
                            className="size-36 md:size-44 rounded-2xl border-4 border-background bg-surface bg-cover bg-center shadow-2xl flex-shrink-0"
                            style={{ backgroundImage: `url(${artist.profilePhoto})` }}
                        />

                        {/* Info */}
                        <div className="flex-1 pb-2">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight">{artist.artistName}</h1>
                                {artist.isVerified && (
                                    <span className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                                        <CheckCircle size={14} /> Verificado
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm">
                                <span className="flex items-center gap-1">
                                    <MapPin size={16} /> {artist.city}, {artist.country}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Star size={16} className="text-primary" /> {artist.rating} ({artist.reviewCount} reseñas)
                                </span>
                                <span className="flex items-center gap-1">
                                    <Music size={16} /> {artist.gigsCompleted} actuaciones
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                                <Heart size={20} />
                            </button>
                            <button className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                                <Share2 size={20} />
                            </button>
                            <button
                                onClick={handleContact}
                                className="h-12 px-6 rounded-xl bg-primary hover:bg-primary-hover text-black font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,216,77,0.3)] transition-all"
                            >
                                <MessageCircle size={18} />
                                Contactar
                            </button>
                        </div>
                    </div>
                </div>
            </section>


            < main className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8" >
                {/* Left Column: About */}
                < div className="lg:col-span-2 flex flex-col gap-10" >
                    {/* Bio */}
                    < section >
                        <h2 className="text-xl font-bold mb-4">Sobre {artist.artistName}</h2>
                        <p className="text-gray-400 leading-relaxed">{artist.bio}</p>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            {artist.genres.map((genre) => (
                                <span key={genre} className="px-3 py-1 rounded-full bg-white/10 text-sm text-gray-300">
                                    {genre}
                                </span>
                            ))}
                        </div>

                        {/* Tags */}
                        {
                            artist.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {artist.tags.map((tag) => (
                                        <span key={tag} className="px-3 py-1 rounded-full border border-primary/30 text-xs text-primary font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )
                        }
                    </section >

                    {/* Services */}
                    < section >
                        <h2 className="text-xl font-bold mb-4">Servicios y Paquetes</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {artist.packages.filter(p => p.isActive).map((pkg) => (
                                <div
                                    key={pkg.id}
                                    className={`relative p-5 rounded-xl bg-surface border transition-all cursor-pointer ${selectedPackage?.id === pkg.id
                                        ? 'border-primary shadow-[0_0_20px_rgba(255,216,77,0.15)]'
                                        : 'border-white/10 hover:border-white/20'
                                        }`}
                                    onClick={() => setSelectedPackage(pkg)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-white font-bold">{pkg.name}</h3>
                                            <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                                                <Clock size={12} /> {pkg.duration}h
                                            </p>
                                        </div>
                                        <span className="text-primary text-2xl font-black">{pkg.price}€</span>
                                    </div>
                                    <p className="text-gray-400 text-sm line-clamp-2">{pkg.description}</p>

                                    {pkg.includes && pkg.includes.length > 0 && (
                                        <ul className="mt-3 flex flex-wrap gap-2">
                                            {pkg.includes.slice(0, 3).map((item, idx) => (
                                                <li key={idx} className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section >

                    {/* Multimedia */}
                    {
                        (artist.multimedia.videos.length > 0 || artist.multimedia.spotifyUri) && (
                            <section>
                                <h2 className="text-xl font-bold mb-4">Música y Vídeos</h2>

                                {/* Videos */}
                                {artist.multimedia.videos.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        {artist.multimedia.videos.map((video) => (
                                            <a
                                                key={video.id}
                                                href={video.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative aspect-video rounded-xl overflow-hidden bg-surface border border-white/10 hover:border-primary/50 transition-colors"
                                            >
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center"
                                                    style={{ backgroundImage: video.thumbnailUrl ? `url(${video.thumbnailUrl})` : undefined }}
                                                />
                                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-14 h-14 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Play size={24} className="text-primary ml-1" fill="currentColor" />
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                                    <p className="text-white text-sm font-medium">{video.title}</p>
                                                    {video.duration && (
                                                        <span className="text-xs text-gray-400">{video.duration}</span>
                                                    )}
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* Spotify */}
                                {artist.multimedia.spotifyVisible && artist.multimedia.spotifyUri && (
                                    <div className="bg-[#121212] rounded-xl p-4 border border-white/10">
                                        <div className="flex items-center gap-3 mb-3">
                                            <svg className="w-6 h-6 text-[#1DB954]" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                                            </svg>
                                            <span className="text-[#1DB954] text-sm font-bold">Escuchar en Spotify</span>
                                        </div>
                                        <p className="text-gray-500 text-sm">Conecta para ver las canciones más populares</p>
                                    </div>
                                )}
                            </section>
                        )
                    }

                    {/* Photos */}
                    {
                        artist.multimedia.photos.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold mb-4">Galería</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {artist.multimedia.photos.map((photo) => (
                                        <div
                                            key={photo.id}
                                            className="aspect-square rounded-xl overflow-hidden bg-surface border border-white/10 hover:border-primary/50 transition-colors cursor-pointer"
                                        >
                                            <div
                                                className="w-full h-full bg-cover bg-center hover:scale-105 transition-transform duration-500"
                                                style={{ backgroundImage: `url(${photo.url})` }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )
                    }
                </div >

                {/* Right Column: Booking */}
                < aside className="lg:col-span-1" >
                    <div className="sticky top-24 flex flex-col gap-6">
                        {/* Booking Card */}
                        <div className="bg-surface rounded-2xl p-6 border border-white/10 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-500 text-sm">Desde</span>
                                <span className="text-white text-3xl font-black">{artist.priceFrom || artist.packages[0]?.price || 0}€</span>
                            </div>

                            {selectedPackage && (
                                <div className="bg-background p-4 rounded-xl mb-4">
                                    <p className="text-white font-bold text-sm">{selectedPackage.name}</p>
                                    <p className="text-gray-500 text-xs mt-1">{selectedPackage.duration}h • {selectedPackage.price}€</p>
                                </div>
                            )}

                            <button
                                onClick={handleBooking}
                                className="w-full h-12 bg-primary hover:bg-primary-hover text-black font-bold rounded-xl shadow-[0_0_20px_rgba(255,216,77,0.3)] transition-all flex items-center justify-center gap-2"
                            >
                                <CalendarIcon size={18} />
                                Solicitar Presupuesto
                            </button>

                            <p className="text-center text-gray-500 text-xs mt-3">Respuesta media: &lt; 2 horas</p>
                        </div>

                        {/* Mini Calendar */}
                        <div className="bg-surface rounded-2xl p-5 border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-bold">Disponibilidad</h3>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                                        className="p-1 text-gray-500 hover:text-white"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                                        className="p-1 text-gray-500 hover:text-white"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-gray-400 mb-3">
                                {MONTHS_FULL[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                            </p>

                            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                                    <span key={d} className="text-gray-600 py-1">{d}</span>
                                ))}

                                {generateCalendarDays().map(({ date, inMonth }, idx) => {
                                    const status = getDateStatus(date);
                                    const today = isToday(date);

                                    return (
                                        <div
                                            key={idx}
                                            className={`aspect-square flex items-center justify-center rounded-md text-xs ${!inMonth ? 'text-gray-700' :
                                                status?.status === 'available' ? 'bg-primary/20 text-primary font-bold' :
                                                    status?.status === 'occupied' || status?.status === 'blocked' ? 'bg-red-500/10 text-red-400' :
                                                        'text-gray-400'
                                                } ${today ? 'ring-1 ring-primary' : ''}`}
                                        >
                                            {date.getDate()}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10 text-xs">
                                <div className="flex items-center gap-1">
                                    <div className="size-2 rounded-full bg-primary" />
                                    <span className="text-gray-500">Disponible</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="size-2 rounded-full bg-red-500" />
                                    <span className="text-gray-500">Ocupado</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside >
            </main >

            <Footer />
        </div >
    );
}

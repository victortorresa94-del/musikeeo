import { useState, useEffect, useRef } from 'react';
import { Save, X, Camera, MapPin, Plus, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getArtistByUserId, updateArtist, createArtist, calculateProfileCompleteness } from '../../services/artistService';
import { storageService } from '../../services/storageService';
import type { Artist } from '../../types';
import { toast } from 'sonner';

const GENRE_OPTIONS = [
    'Pop', 'Rock', 'Indie', 'Jazz', 'Blues', 'Flamenco', 'Clásica',
    'Electrónica', 'House', 'Techno', 'Reggaeton', 'Hip Hop', 'R&B',
    'Folk', 'Country', 'Latin', 'Salsa', 'Swing', 'Soul', 'Funk'
];

export default function PanelProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const [artist, setArtist] = useState<Artist | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Refs for file inputs
    const profileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [artistName, setArtistName] = useState('');
    const [city, setCity] = useState('');
    const [bio, setBio] = useState('');
    const [genres, setGenres] = useState<string[]>([]);
    const [isPublic, setIsPublic] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (user) {
                loadArtistProfile();
            } else {
                setLoading(false); // No user, stop loading (although should be protected route)
            }
        }
    }, [user, authLoading]);

    const loadArtistProfile = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        // Safety timeout
        const timeoutId = setTimeout(() => {
            setLoading(false);
            if (!artist) setError("La conexión está tardando demasiado. Por favor, reintenta.");
        }, 10000);

        try {
            let artistData = await getArtistByUserId(user.uid);

            // If no artist profile exists, create one
            if (!artistData) {
                artistData = await createArtist(user.uid, {
                    artistName: user.displayName || 'Nuevo Artista',
                    profilePhoto: user.photoURL || undefined,
                });
            }

            clearTimeout(timeoutId);
            setArtist(artistData);
            setArtistName(artistData.artistName);
            setCity(artistData.city);
            setBio(artistData.bio);
            setGenres(artistData.genres);
            setIsPublic(artistData.isPublic);
        } catch (error) {
            console.error('Error loading artist profile:', error);
            setError("No se pudo cargar el perfil. Comprueba tu conexión.");
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!artist) return;

        setSaving(true);
        try {
            const updates: Partial<Artist> = {
                artistName,
                city,
                bio,
                genres,
                isPublic,
                profileCompleteness: calculateProfileCompleteness({
                    ...artist,
                    artistName,
                    city,
                    bio,
                    genres,
                })
            };

            await updateArtist(artist.id, updates);
            setArtist({ ...artist, ...updates });
            setHasChanges(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        if (artist) {
            setArtistName(artist.artistName);
            setCity(artist.city);
            setBio(artist.bio);
            setGenres(artist.genres);
            setIsPublic(artist.isPublic);
            setHasChanges(false);
        }
    };

    const addGenre = (genre: string) => {
        if (!genres.includes(genre)) {
            setGenres([...genres, genre]);
            setHasChanges(true);
        }
    };

    const removeGenre = (genre: string) => {
        setGenres(genres.filter(g => g !== genre));
        setHasChanges(true);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
        const file = event.target.files?.[0];
        if (!file || !artist || !user) return;

        // Optimistic UI update or loader could go here
        const originalArtist = { ...artist };

        try {
            setSaving(true);
            toast.info(`Subiendo ${type === 'profile' ? 'foto de perfil' : 'portada'}...`);

            let downloadURL: string;

            if (type === 'profile') {
                downloadURL = await storageService.uploadArtistPhoto(user.uid, file);
                setArtist(prev => prev ? { ...prev, profilePhoto: downloadURL } : null);
            } else {
                downloadURL = await storageService.uploadArtistCover(user.uid, file);
                setArtist(prev => prev ? { ...prev, coverPhoto: downloadURL } : null);
            }

            // Update in Firestore immediately
            await updateArtist(artist.id, type === 'profile' ? { profilePhoto: downloadURL } : { coverPhoto: downloadURL });
            toast.success('Imagen actualizada correctamente');
        } catch (error) {
            console.error(error);
            toast.error('Error al subir la imagen');
            setArtist(originalArtist); // Revert on error
        } finally {
            setSaving(false);
            // Reset input
            if (event.target) event.target.value = '';
        }
    };

    const handlePreview = () => {
        if (!artist?.slug) return;
        window.open(`/artist/${artist.slug}`, '_blank');
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-red-500/10 border border-red-500 rounded-full p-4 mb-4">
                    <X className="text-red-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Hubo un problema</h3>
                <p className="text-gray-400 mb-6">{error}</p>
                <button
                    onClick={loadArtistProfile}
                    className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary-hover transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-white/10 px-6 py-4 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Gestionar mi Perfil</h2>
                    <p className="text-gray-500 text-sm mt-1">Configura tu identidad artística y presencia en Musikeeo.</p>
                </div>

                {/* Public View Toggle */}
                <div className="flex items-center gap-4 bg-surface border border-white/10 rounded-full px-4 py-2">
                    <div className="flex flex-col items-end mr-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Vista Pública</span>
                        <span className="text-[10px] text-gray-500">Haz visible tu perfil</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer mr-3">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => { setIsPublic(e.target.checked); setHasChanges(true); }}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <button
                        onClick={handlePreview}
                        className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
                        title="Ver cómo queda mi perfil"
                    >
                        <ExternalLink size={20} />
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 pb-24">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Cover & Profile Photo */}
                    <section className="relative">
                        {/* Cover Image */}
                        <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden bg-surface border border-white/10">
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{
                                    backgroundImage: artist?.coverPhoto
                                        ? `url(${artist.coverPhoto})`
                                        : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                                }}
                            />
                            <button
                                onClick={() => coverInputRef.current?.click()}
                                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all border border-white/10"
                            >
                                <Camera size={14} />
                                Cambiar Portada
                            </button>
                            <input
                                type="file"
                                ref={coverInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'cover')}
                            />
                        </div>

                        {/* Profile Photo */}
                        <div className="px-4 md:px-8 -mt-16 relative z-10 flex items-end gap-6">
                            <div className="relative shrink-0">
                                <div
                                    className="size-32 md:size-40 rounded-full border-4 border-background bg-surface bg-cover bg-center shadow-2xl"
                                    style={{
                                        backgroundImage: artist?.profilePhoto
                                            ? `url(${artist.profilePhoto})`
                                            : `url(${user?.photoURL || ''})`
                                    }}
                                />
                                <button
                                    onClick={() => profileInputRef.current?.click()}
                                    className="absolute bottom-1 right-1 bg-primary text-black p-2 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center border-2 border-background"
                                >
                                    <Camera size={18} />
                                </button>
                                <input
                                    type="file"
                                    ref={profileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'profile')}
                                />
                            </div>

                            {/* Badges */}
                            <div className="hidden md:flex gap-2 mb-4">
                                {artist?.isVerified && (
                                    <span className="px-3 py-1 rounded-full bg-surface border border-white/10 text-xs font-medium text-gray-400 flex items-center gap-1">
                                        <span className="text-green-500">✓</span> Verificado
                                    </span>
                                )}
                                <span className="px-3 py-1 rounded-full bg-surface border border-white/10 text-xs font-medium text-gray-400 flex items-center gap-1">
                                    <span className="text-primary">★</span> {artist?.rating || 0} Rating
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Form Grid */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Basic Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-surface rounded-xl p-6 border border-white/10 shadow-sm">
                                <h3 className="text-white text-lg font-bold mb-1 flex items-center gap-2">
                                    📋 Información Básica
                                </h3>
                                <p className="text-gray-500 text-sm mb-6">Esta información aparecerá en la cabecera de tu perfil público.</p>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <label className="flex flex-col gap-2">
                                            <span className="text-white text-sm font-medium">Nombre Artístico</span>
                                            <input
                                                type="text"
                                                value={artistName}
                                                onChange={(e) => { setArtistName(e.target.value); setHasChanges(true); }}
                                                className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-gray-600"
                                                placeholder="Ej. The Midnight Echo"
                                            />
                                        </label>

                                        <label className="flex flex-col gap-2">
                                            <span className="text-white text-sm font-medium">Ubicación</span>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                                <input
                                                    type="text"
                                                    value={city}
                                                    onChange={(e) => { setCity(e.target.value); setHasChanges(true); }}
                                                    className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-gray-600"
                                                    placeholder="Madrid, España"
                                                />
                                            </div>
                                        </label>
                                    </div>

                                    <label className="flex flex-col gap-2">
                                        <div className="flex justify-between">
                                            <span className="text-white text-sm font-medium">Biografía</span>
                                            <span className="text-gray-500 text-xs">{bio.length}/500 caracteres</span>
                                        </div>
                                        <textarea
                                            value={bio}
                                            onChange={(e) => { setBio(e.target.value.slice(0, 500)); setHasChanges(true); }}
                                            rows={4}
                                            className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-gray-600 resize-none"
                                            placeholder="Describe tu proyecto musical, tu estilo y qué te hace único..."
                                        />
                                    </label>

                                    {/* Genres */}
                                    <div className="pt-2">
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <span className="text-sm font-medium text-white mr-2 py-1">Géneros:</span>
                                            {genres.map((genre) => (
                                                <span
                                                    key={genre}
                                                    className="px-3 py-1 rounded-full bg-white/10 text-xs text-white border border-white/10 flex items-center gap-1 group cursor-pointer hover:border-primary/50 transition-colors"
                                                    onClick={() => removeGenre(genre)}
                                                >
                                                    {genre} <X size={12} className="opacity-0 group-hover:opacity-100" />
                                                </span>
                                            ))}

                                            {/* Add Genre Dropdown */}
                                            <div className="relative group">
                                                <button className="px-3 py-1 rounded-full border border-dashed border-gray-500 text-xs text-gray-500 hover:text-white hover:border-white transition-colors flex items-center gap-1">
                                                    <Plus size={14} /> Añadir
                                                </button>
                                                <div className="absolute left-0 top-full mt-2 w-48 bg-surface border border-white/10 rounded-lg shadow-2xl py-2 hidden group-hover:block z-10 max-h-48 overflow-y-auto">
                                                    {GENRE_OPTIONS.filter(g => !genres.includes(g)).map((genre) => (
                                                        <button
                                                            key={genre}
                                                            onClick={() => addGenre(genre)}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                                        >
                                                            {genre}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Integrations */}
                        <div className="lg:col-span-1 space-y-6">
                            <h3 className="text-white text-lg font-bold flex items-center gap-2">
                                🔗 Integraciones
                            </h3>

                            {/* Spotify */}
                            <div className="bg-surface rounded-xl p-5 border border-white/10 flex flex-col gap-4 shadow-sm hover:border-[#1DB954]/50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="bg-[#1DB954]/10 p-3 rounded-lg">
                                        <svg className="w-6 h-6 text-[#1DB954]" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                                        </svg>
                                    </div>
                                    <span className="bg-[#1DB954]/20 text-[#1DB954] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                        {artist?.multimedia?.spotifyUri ? 'Conectado' : 'No conectado'}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-base">Spotify</h4>
                                    <p className="text-gray-500 text-xs mt-1">Muestra tus canciones más populares.</p>
                                </div>
                                <button className="w-full mt-2 py-2 px-4 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                                    Configurar
                                </button>
                            </div>

                            {/* Instagram */}
                            <div className="bg-surface rounded-xl p-5 border border-white/10 flex flex-col gap-4 shadow-sm hover:border-pink-500/50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px] rounded-lg">
                                        <div className="bg-background p-2 rounded-[6px]">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-base">Instagram</h4>
                                    <p className="text-gray-500 text-xs mt-1">Sincroniza tus fotos y videos recientes.</p>
                                </div>
                                <button className="w-full mt-2 py-2 px-4 rounded-lg bg-white text-black text-sm font-bold hover:bg-gray-200 transition-colors">
                                    Conectar
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div >

            {/* Floating Action Bar */}
            {
                hasChanges && (
                    <div className="fixed bottom-0 left-0 md:left-[280px] right-0 p-4 bg-background border-t border-white/10 flex justify-between items-center z-30">
                        <p className="text-gray-500 text-sm hidden sm:block">Tienes cambios sin guardar</p>
                        <div className="flex items-center gap-3 ml-auto">
                            <button
                                onClick={handleDiscard}
                                className="px-6 py-2.5 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-surface transition-colors"
                            >
                                Descartar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(255,216,77,0.3)] transition-all flex items-center gap-2 disabled:opacity-50 ${showSuccess
                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                    : 'bg-primary text-black hover:bg-primary-hover'
                                    }`}
                            >
                                {showSuccess ? <Check size={16} /> : <Save size={16} />}
                                {saving ? 'Guardando...' : showSuccess ? '¡Guardado!' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

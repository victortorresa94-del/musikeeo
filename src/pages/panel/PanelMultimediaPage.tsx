import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Link as LinkIcon, Music, Image, Play, GripVertical, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getArtistByUserId, updateArtist } from '../../services/artistService';
import { storageService } from '../../services/storageService';
import type { Artist, ArtistMultimedia } from '../../types';

export default function PanelMultimediaPage() {
    const { user } = useAuth();
    const [artist, setArtist] = useState<Artist | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [spotifyUri, setSpotifyUri] = useState('');
    const [spotifyVisible, setSpotifyVisible] = useState(true);
    const [newVideoUrl, setNewVideoUrl] = useState('');

    useEffect(() => {
        loadArtist();
    }, [user]);

    const loadArtist = async () => {
        if (!user) return;
        try {
            const data = await getArtistByUserId(user.uid);
            setArtist(data);
            if (data?.multimedia) {
                setSpotifyUri(data.multimedia.spotifyUri || '');
                setSpotifyVisible(data.multimedia.spotifyVisible ?? true);
            }
        } catch (error) {
            console.error('Error loading artist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!artist) return;

        setSaving(true);
        try {
            const updates: Partial<Artist> = {
                multimedia: {
                    ...artist.multimedia,
                    spotifyUri,
                    spotifyVisible,
                }
            };

            await updateArtist(artist.id, updates);
            setArtist({ ...artist, multimedia: updates.multimedia as ArtistMultimedia });
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setSaving(false);
        }
    };

    const addVideo = async () => {
        if (!artist || !newVideoUrl) return;

        // Detect platform
        const isYoutube = newVideoUrl.includes('youtube') || newVideoUrl.includes('youtu.be');
        const isVimeo = newVideoUrl.includes('vimeo');

        if (!isYoutube && !isVimeo) {
            alert('Solo se admiten enlaces de YouTube o Vimeo');
            return;
        }

        const newVideo = {
            id: `vid_${Date.now()}`,
            url: newVideoUrl,
            title: 'Nuevo vídeo',
            platform: isYoutube ? 'youtube' : 'vimeo' as 'youtube' | 'vimeo',
            duration: ''
        };

        const updatedMultimedia: ArtistMultimedia = {
            ...artist.multimedia,
            videos: [...artist.multimedia.videos, newVideo]
        };

        try {
            await updateArtist(artist.id, { multimedia: updatedMultimedia });
            setArtist({ ...artist, multimedia: updatedMultimedia });
            setNewVideoUrl('');
        } catch (error) {
            console.error('Error adding video:', error);
        }
    };

    const removeVideo = async (videoId: string) => {
        if (!artist) return;

        const updatedMultimedia: ArtistMultimedia = {
            ...artist.multimedia,
            videos: artist.multimedia.videos.filter(v => v.id !== videoId)
        };

        try {
            await updateArtist(artist.id, { multimedia: updatedMultimedia });
            setArtist({ ...artist, multimedia: updatedMultimedia });
        } catch (error) {
            console.error('Error removing video:', error);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!artist || !user || !e.target.files?.length) return;
        setUploadingPhoto(true);
        try {
            const files = Array.from(e.target.files).slice(0, 6 - (artist.multimedia?.photos.length || 0));
            const urls = await Promise.all(files.map(f => storageService.uploadArtistPhoto(user.uid, f)));
            const newPhotos = urls.map((url, i) => ({
                id: `photo_${Date.now()}_${i}`,
                url,
                order: (artist.multimedia?.photos.length || 0) + i,
                isCover: artist.multimedia?.photos.length === 0 && i === 0,
            }));
            const updatedMultimedia: ArtistMultimedia = {
                ...artist.multimedia,
                photos: [...(artist.multimedia?.photos || []), ...newPhotos],
            };
            await updateArtist(artist.id, { multimedia: updatedMultimedia });
            setArtist({ ...artist, multimedia: updatedMultimedia });
        } catch (err) {
            console.error('Error uploading photos:', err);
        } finally {
            setUploadingPhoto(false);
            if (photoInputRef.current) photoInputRef.current.value = '';
        }
    };

    const handleSetCover = async (photoId: string) => {
        if (!artist) return;
        const updatedMultimedia: ArtistMultimedia = {
            ...artist.multimedia,
            photos: artist.multimedia.photos.map(p => ({ ...p, isCover: p.id === photoId })),
        };
        await updateArtist(artist.id, { multimedia: updatedMultimedia });
        setArtist({ ...artist, multimedia: updatedMultimedia });
    };

    const handleDeletePhoto = async (photoId: string) => {
        if (!artist) return;
        const remaining = artist.multimedia.photos.filter(p => p.id !== photoId);
        // If deleted photo was cover, make first remaining photo cover
        if (remaining.length > 0 && !remaining.some(p => p.isCover)) {
            remaining[0].isCover = true;
        }
        const updatedMultimedia: ArtistMultimedia = { ...artist.multimedia, photos: remaining };
        await updateArtist(artist.id, { multimedia: updatedMultimedia });
        setArtist({ ...artist, multimedia: updatedMultimedia });
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-5 md:px-10">
                <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-foreground text-2xl md:text-3xl font-black tracking-tight">Mi Música y Vídeos</h1>
                        <p className="text-muted-foreground text-sm md:text-base font-medium">Gestiona cómo te ven y te escuchan tus clientes.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center justify-center h-10 px-4 rounded-xl border border-border bg-transparent text-foreground text-sm font-bold hover:bg-muted transition-colors">
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center justify-center h-10 px-6 rounded-xl bg-primary text-black text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-20">
                <div className="max-w-5xl mx-auto flex flex-col gap-10">

                    {/* Spotify Section */}
                    <section className="flex flex-col gap-5">
                        <div className="flex items-center gap-3">
                            <Music className="text-[#1DB954]" size={28} />
                            <h2 className="text-foreground text-xl font-bold">Integración Spotify</h2>
                        </div>

                        <div className="bg-card rounded-2xl p-6 md:p-8 border border-border flex flex-col lg:flex-row gap-8">
                            {/* Controls */}
                            <div className="flex-1 flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-foreground text-sm font-bold">Enlace de Spotify URI</label>
                                    <p className="text-muted-foreground text-xs mb-1">Copia el enlace de tu artista, álbum o playlist pública.</p>
                                    <div className="relative flex items-center">
                                        <LinkIcon className="absolute left-4 text-muted-foreground" size={18} />
                                        <input
                                            type="text"
                                            value={spotifyUri}
                                            onChange={(e) => setSpotifyUri(e.target.value)}
                                            placeholder="spotify:artist:..."
                                            className="w-full h-12 rounded-xl bg-background border border-border text-foreground pl-12 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-background p-4 rounded-xl border border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[#1DB954]/20 p-2 rounded-lg text-[#1DB954]">
                                            <Play size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-foreground text-sm font-bold">Mostrar en perfil público</span>
                                            <span className="text-muted-foreground text-xs">Los usuarios podrán reproducir tus pistas.</span>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={spotifyVisible}
                                            onChange={(e) => setSpotifyVisible(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="w-full lg:w-[380px] shrink-0">
                                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-3">Vista Previa</p>
                                <div className="bg-[#121212] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                                    <div className="bg-gradient-to-b from-[#404040] to-[#121212] p-4">
                                        <div className="flex gap-4 items-end mb-4">
                                            <div className="w-20 h-20 shadow-lg rounded-md bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                                                <Music className="text-primary" size={32} />
                                            </div>
                                            <div className="flex flex-col pb-1">
                                                <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Artista</span>
                                                <h3 className="text-foreground font-bold text-lg leading-tight mb-1">{artist?.artistName || 'Tu Nombre'}</h3>
                                                <p className="text-muted-foreground text-xs font-medium">Spotify Preview</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button className="w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center hover:scale-105 transition-transform">
                                                <Play size={24} fill="black" />
                                            </button>
                                            <span className="text-muted-foreground text-sm">Conecta tu Spotify para ver la preview</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Video Gallery */}
                    <section className="flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Play className="text-foreground" size={28} />
                                <h2 className="text-foreground text-xl font-bold">Galería de Vídeo</h2>
                            </div>
                            <span className="text-muted-foreground text-sm">{artist?.multimedia?.videos.length || 0}/6 vídeos</span>
                        </div>

                        <div className="bg-card rounded-2xl p-6 md:p-8 border border-border">
                            {/* Add Video Input */}
                            <div className="flex flex-col md:flex-row gap-4 mb-8 items-end">
                                <div className="flex-1 w-full">
                                    <label className="text-foreground text-sm font-bold block mb-2">Añadir vídeo nuevo</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-4 top-3 text-muted-foreground" size={18} />
                                        <input
                                            type="text"
                                            value={newVideoUrl}
                                            onChange={(e) => setNewVideoUrl(e.target.value)}
                                            placeholder="https://youtube.com/watch?v=..."
                                            className="w-full h-12 rounded-xl bg-background border border-border text-foreground pl-12 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={addVideo}
                                    disabled={!newVideoUrl}
                                    className="h-12 px-6 bg-muted hover:bg-muted text-foreground rounded-xl font-bold text-sm shrink-0 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <Plus className="text-primary" size={18} />
                                    Añadir Enlace
                                </button>
                            </div>

                            {/* Video Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {artist?.multimedia?.videos.map((video) => (
                                    <div key={video.id} className="group relative flex flex-col gap-3">
                                        <div className="relative aspect-video rounded-xl bg-black overflow-hidden border border-border group-hover:border-primary/50 transition-colors">
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full text-foreground hover:bg-white/30 cursor-pointer">
                                                    <Play size={24} />
                                                </div>
                                            </div>
                                            <span className="absolute bottom-2 right-2 bg-black/80 text-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                {video.duration || '0:00'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex flex-col">
                                                <p className="text-foreground text-sm font-bold line-clamp-1">{video.title}</p>
                                                <p className="text-muted-foreground text-xs">{video.platform === 'youtube' ? 'YouTube' : 'Vimeo'}</p>
                                            </div>
                                            <button
                                                onClick={() => removeVideo(video.id)}
                                                className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {(artist?.multimedia?.videos.length || 0) < 6 && (
                                    <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group">
                                        <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-primary group-hover:text-black text-muted-foreground flex items-center justify-center transition-colors">
                                            <Plus size={24} />
                                        </div>
                                        <p className="text-muted-foreground text-xs font-bold group-hover:text-foreground transition-colors">Añadir Vídeo</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Photo Gallery */}
                    <section className="flex flex-col gap-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Image className="text-foreground" size={28} />
                                <div>
                                    <h2 className="text-foreground text-xl font-bold">Galería de Fotos</h2>
                                    <p className="text-muted-foreground text-xs mt-1">Arrastra para reordenar. La primera foto será tu portada.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => photoInputRef.current?.click()}
                                disabled={uploadingPhoto}
                                className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-muted hover:bg-muted text-foreground text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                {uploadingPhoto ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                {uploadingPhoto ? 'Subiendo...' : 'Subir Fotos'}
                            </button>
                            <input
                                ref={photoInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handlePhotoUpload}
                            />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {artist?.multimedia?.photos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className={`group relative aspect-[4/5] rounded-xl overflow-hidden cursor-move ${photo.isCover ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border border-border hover:border-gray-500'
                                        }`}
                                >
                                    {photo.isCover && (
                                        <div className="absolute top-2 left-2 z-10 bg-primary text-black text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                            ★ Portada
                                        </div>
                                    )}
                                    <div
                                        className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                        style={{ backgroundImage: `url(${photo.url})` }}
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                        {!photo.isCover && (
                                            <button
                                                onClick={() => handleSetCover(photo.id)}
                                                className="bg-muted hover:bg-muted text-foreground px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                Hacer Portada
                                            </button>
                                        )}
                                        <div className="flex gap-3">
                                            <GripVertical size={20} className="text-foreground/40" />
                                            <button
                                                onClick={() => handleDeletePhoto(photo.id)}
                                                className="text-foreground hover:text-red-400"
                                            ><Trash2 size={20} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Upload Placeholder */}
                            <div
                                onClick={() => photoInputRef.current?.click()}
                                className="relative aspect-[4/5] rounded-xl overflow-hidden border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group"
                            >
                                <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-primary group-hover:text-black text-muted-foreground flex items-center justify-center transition-colors">
                                    <Plus size={24} />
                                </div>
                                <p className="text-muted-foreground text-xs font-bold group-hover:text-foreground transition-colors">Añadir Foto</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

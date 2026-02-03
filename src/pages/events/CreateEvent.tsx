import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Upload, Sparkles, Mic, Send, Music, Target, Image as ImageIcon, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { eventService } from '../../services/eventService';
import { getOrganizerByUserId } from '../../services/organizerService'; // Import this
import { useAuth } from '../../context/AuthContext';
import type { Event } from '../../types';

export default function CreateEvent() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, userProfile } = useAuth(); // Use userProfile

    const [isLoading, setIsLoading] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Organizer State
    const [organizerName, setOrganizerName] = useState('');
    // const [organizerId, setOrganizerId] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '',
        location: '',
        description: '',
        type: 'gig' as Event['type'],
        genres: [] as string[],
        budget: '',
        imageUrl: ''
    });

    // Load from LocalStorage or Location State
    useEffect(() => {
        // 1. Try Location State (Draft passed from another page)
        if (location.state?.eventDraft) {
            const draft = location.state.eventDraft;
            setFormData(prev => ({
                ...prev,
                title: draft.title || '',
                date: draft.date || '',
                time: draft.time || '',
                location: draft.location || '',
                description: draft.description || '',
                type: (draft.type as Event['type']) || 'gig',
                genres: draft.genres || [],
                budget: draft.budget || '',
            }));
            return;
        }

        // 2. Try LocalStorage (Restoring work in progress)
        const savedDraft = localStorage.getItem('createEventDraft');
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setFormData(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to parse saved draft", e);
            }
        }
    }, [location.state]);

    // Save to LocalStorage on change
    useEffect(() => {
        const timeout = setTimeout(() => {
            localStorage.setItem('createEventDraft', JSON.stringify(formData));
        }, 1000); // Debounce save
        return () => clearTimeout(timeout);
    }, [formData]);

    useEffect(() => {
        const loadOrganizerInfo = async () => {
            // ... existing logic ...
            if (user?.uid) {
                // If user has an organizer profile linked
                if (userProfile?.eventCreatorProfileId) {
                    try {
                        const orgFn = await getOrganizerByUserId(user.uid);
                        if (orgFn) {
                            setOrganizerName(orgFn.companyName || orgFn.displayName || user.displayName || 'Organizador');
                            return;
                        }
                    } catch (e) {
                        console.warn("Failed to load organizer info", e);
                    }
                }
                setOrganizerName(user.displayName || 'Usuario');
            }
        };
        loadOrganizerInfo();
    }, [user, userProfile]);




    // AI Assitant State
    const [aiPrompt, setAiPrompt] = useState('');
    const [showAi, setShowAi] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;

        setIsAiLoading(true);
        // Simulate AI Processing
        setTimeout(() => {
            setFormData(prev => ({
                ...prev,
                title: "Noche de Jazz & Fusion",
                description: aiPrompt, // Use prompt as base description
                location: "Café Central, Madrid",
                date: "2024-05-20",
                time: "21:00",
                type: 'gig',
                genres: ['Jazz', 'Fusion', 'Bossa Nova'],
                budget: '250',
                imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80"
            }));
            setIsAiLoading(false);
            setShowAi(false);
        }, 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            alert("Debes iniciar sesión para crear un evento");
            return;
        }

        setIsLoading(true);
        try {
            // Determine final organizer ID - prefer the EventCreatorProfile ID if available, else User UID?
            // The type Event.organizerId usually refers to the User ID or Profile ID?
            // In typical systems, it refers to the Entity creating it. 
            // Let's use user.uid since 'organizerId' in Event interface is likely the generic owner.
            // BUT strict role separation might prefer the Profile ID.
            // Let's stick to user.uid for ownership, but verify they have the role.

            await eventService.createEvent({
                title: formData.title,
                organizerId: user.uid, // Owner
                organizerName: organizerName, // Display Name from Profile
                date: `${formData.date}T${formData.time}`,
                location: formData.location,
                description: formData.description,
                type: formData.type,
                imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
                price: formData.budget ? parseFloat(formData.budget) : 0, // Mapping budget to price/budget
                tags: formData.genres
            });
            navigate('/events');
        } catch (error) {
            console.error("Error creating event:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleGenre = (genre: string) => {
        setFormData(prev => {
            if (prev.genres.includes(genre)) {
                return { ...prev, genres: prev.genres.filter(g => g !== genre) };
            }
            return { ...prev, genres: [...prev.genres, genre] };
        });
    };

    const popularGenres = ["Jazz", "Rock", "Pop", "Indie", "Flamenco", "Techno"];

    return (
        <div className="min-h-screen bg-brand-black text-white pb-32">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-brand-black/90 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-white/10">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-heading font-bold">Crear Evento</h1>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-brand-yellow gap-2 hover:bg-brand-yellow/10"
                    onClick={() => setShowAi(!showAi)}
                >
                    <Sparkles className="h-4 w-4" />
                    {showAi ? "Ocultar IA" : "Usar IA"}
                </Button>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">

                {/* AI Assistant Section */}
                {showAi && (
                    <div className="bg-gradient-to-r from-brand-petrol/20 to-brand-cyan/20 border border-brand-cyan/30 rounded-2xl p-6 animate-in slide-in-from-top-4 fade-in duration-300">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full border border-brand-yellow/30 overflow-hidden shrink-0">
                                <img src="/rodrigo-persona.png" alt="Rodrigo" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white">Rodrigo</h3>
                                <p className="text-sm text-gray-400">Describe tu evento y rellenaré los detalles por ti.</p>
                            </div>
                        </div>

                        <div className="relative">
                            <Textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Ej: Busco una banda de jazz para tocar en mi bar este viernes a las 21h. Presupuesto 200€."
                                className="bg-black/40 border-brand-cyan/20 text-white min-h-[100px] pr-12 resize-none focus:border-brand-cyan/50"
                            />
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white">
                                    <Mic className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    onClick={handleAiGenerate}
                                    disabled={!aiPrompt.trim() || isAiLoading}
                                    className="h-8 w-8 bg-brand-cyan text-brand-black hover:bg-brand-cyan/90 rounded-full"
                                >
                                    {isAiLoading ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Image Upload */}
                    <section>
                        <label className="block text-sm font-medium text-gray-400 mb-3">Portada del Evento</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-full aspect-video rounded-2xl bg-white/5 border-2 border-dashed border-white/10 hover:border-brand-yellow/50 transition-colors cursor-pointer overflow-hidden group flex flex-col items-center justify-center gap-3"
                        >
                            {formData.imageUrl ? (
                                <>
                                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <span className="text-white font-medium flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Cambiar imagen</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Upload className="h-8 w-8 text-gray-500 group-hover:text-brand-yellow" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-medium">Sube una imagen</p>
                                        <p className="text-sm text-gray-500">JPG o PNG hasta 5MB</p>
                                    </div>
                                </>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </div>
                    </section>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-400">Título del Evento</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ej: Concierto Acústico"
                                className="bg-white/5 border-white/10 h-12 text-lg"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-400">Ubicación</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Buscar sitio o dirección"
                                    className="bg-white/5 border-white/10 h-12 pl-10"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-400">Fecha</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="bg-white/5 border-white/10 h-12 pl-10 [color-scheme:dark]"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-400">Hora</label>
                            <Input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="bg-white/5 border-white/10 h-12 [color-scheme:dark]"
                                required
                            />
                        </div>
                    </div>

                    {/* Classification */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-400">Tipo de Oportunidad</label>
                        <div className="flex gap-3">
                            {['gig', 'jam', 'session'].map(type => (
                                <div
                                    key={type}
                                    onClick={() => setFormData({ ...formData, type: type as Event['type'] })}
                                    className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all ${formData.type === type
                                        ? 'bg-brand-yellow text-brand-black border-brand-yellow font-bold'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        {type === 'gig' && <Target className="h-6 w-6" />}
                                        {type === 'jam' && <Music className="h-6 w-6" />}
                                        {type === 'session' && <Users className="h-6 w-6 text-brand-cyan" />}
                                        <span className="capitalize">{type === 'session' ? 'Colab' : type}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Genres */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-400">Géneros Musicales</label>
                        <div className="flex flex-wrap gap-2">
                            {popularGenres.map(genre => (
                                <Badge
                                    key={genre}
                                    onClick={() => toggleGenre(genre)}
                                    className={`cursor-pointer px-4 py-2 rounded-full text-sm border ${formData.genres.includes(genre)
                                        ? 'bg-white text-black border-white'
                                        : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'
                                        }`}
                                >
                                    {genre}
                                </Badge>
                            ))}
                            <Button variant="ghost" size="sm" className="text-brand-yellow h-9 rounded-full px-3 text-xs border border-dashed border-brand-yellow/30 hover:bg-brand-yellow/10">
                                + Otro
                            </Button>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400">Descripción & Detalles</label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalla lo que buscas, requisitos, equipo disponible..."
                            className="bg-white/5 border-white/10 min-h-[150px] text-base"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full h-14 text-lg font-bold bg-brand-yellow text-brand-black hover:bg-brand-warm rounded-xl shadow-[0_4px_20px_rgba(255,216,77,0.3)]"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                                    Publicando...
                                </div>
                            ) : "Publicar Evento"}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}

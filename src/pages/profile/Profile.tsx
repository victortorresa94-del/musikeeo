import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Play, Share2, ArrowLeft, Heart, Calendar, Music, ShieldCheck, Camera, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';

export default function Profile() {
    // State for interactive uploads
    const [avatar, setAvatar] = useState<string>("/avatar.png");
    const [cover, setCover] = useState<string>("/cover.png");
    const [gallery, setGallery] = useState<string[]>([
        "https://images.unsplash.com/photo-1510915362650-a5feeba918c5?w=800&q=80",
        "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&q=80",
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80",
        "https://images.unsplash.com/photo-1550291652-6ea9114a47b1?w=800&q=80"
    ]);

    // Refs for file inputs
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // Premium Mock Data
    const musician = {
        name: "Alex Guitarra",
        role: "Professional Classical & Jazz Guitarist",
        location: "Madrid, Spain",
        about: "Versatile guitarist with over 10 years of experience performing at weddings, corporate events, and jazz festivals. Berklee College of Music alumni specializing in Spanish Guitar and Bossa Nova.",
        stats: {
            gigs: 124,
            rating: 4.9,
            reviews: 58
        },
        trustScore: 98,
        skills: ["Spanish Guitar", "Jazz Improvisation", "Sight Reading", "Acoustic", "Loop Station", "Bossa Nova", "Flamenco Fusion"],
        gigs: [
            { id: 1, title: "Jazz Night at Café Central", role: "Solo Guitarist", date: "Hace 2 semanas", rating: 5.0 },
            { id: 2, title: "Wedding Ceremony", role: "Accompanist", date: "Hace 1 mes", rating: 5.0 },
            { id: 3, title: "Corporate Event", role: "Background Music", date: "Hace 1.5 meses", rating: 4.8 }
        ]
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover' | 'gallery') => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                if (type === 'avatar') setAvatar(result);
                if (type === 'cover') setCover(result);
                if (type === 'gallery') setGallery([result, ...gallery]);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1c23] text-white pb-32 font-sans overflow-x-hidden selection:bg-[#37B7F6]/30">
            {/* Hidden File Inputs */}
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
            <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} />
            <input type="file" ref={galleryInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => handleFileChange(e, 'gallery')} />

            {/* 1. Header / Cover Section */}
            <header className="relative w-full h-[320px]">
                {/* Background Image with Blur Overlay */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                    style={{ backgroundImage: `url("${cover}")` }}
                >
                    <div className="absolute inset-0 bg-[#0f1c23]/40 backdrop-blur-[2px] bg-gradient-to-t from-[#0f1c23] via-[#0f1c23]/10 to-transparent"></div>
                </div>

                {/* Edit Cover Button */}
                <button
                    onClick={() => coverInputRef.current?.click()}
                    className="absolute top-20 right-4 z-30 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition-colors border border-white/10"
                >
                    <Camera className="w-5 h-5" />
                </button>

                {/* Top Nav Actions */}
                <div className="absolute top-4 left-0 right-0 px-4 flex justify-between items-center z-20">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full bg-black/20 backdrop-blur-md">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full bg-black/20 backdrop-blur-md">
                            <Heart className="h-6 w-6" />
                        </Button>
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
                            alt={musician.name}
                            className="w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-[#0f1c23] shadow-2xl object-cover bg-[#1a262e]"
                        />
                        {/* Edit Avatar Overlay */}
                        <div
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity border-4 border-transparent"
                        >
                            <Camera className="w-8 h-8 text-white opacity-80" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Container */}
            <main className="px-6 pt-20 max-w-5xl mx-auto space-y-8">

                {/* Identity Section (Left Aligned) */}
                <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl md:text-3xl font-bold tracking-tight text-white">{musician.name}</h1>
                        <Badge className="bg-[#1a262e] text-[#37B7F6] border border-[#37B7F6]/30 hover:bg-[#1a262e] px-2 py-0.5 text-[10px] h-5 gap-1">
                            <ShieldCheck className="w-3 h-3" /> TrustScore {musician.trustScore}
                        </Badge>
                    </div>

                    <h2 className="text-base text-gray-300 font-medium">{musician.role}</h2>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <MapPin className="w-4 h-4 text-[#37B7F6]" />
                        {musician.location}
                    </div>

                    <p className="text-gray-400 leading-relaxed text-sm mt-4 max-w-2xl">
                        {musician.about}
                    </p>
                </div>

                {/* 2. Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-[#1a262e] border-none shadow-md rounded-2xl group hover:scale-[1.02] transition-transform duration-300">
                        <CardContent className="p-6 flex flex-col items-start justify-center h-32 relative overflow-hidden">
                            {/* Icon Background Element */}
                            <Music className="absolute -right-4 -bottom-4 w-24 h-24 text-[#005C8A]/10 rotate-12" />

                            <div className="flex items-center gap-2 mb-2">
                                <Music className="w-5 h-5 text-[#37B7F6]" />
                                <span className="text-xs uppercase tracking-wider text-[#37B7F6] font-bold">Bolos</span>
                            </div>
                            <span className="text-4xl font-bold text-white">{musician.stats.gigs}</span>
                            <span className="text-xs text-gray-400 mt-1">Realizados</span>
                        </CardContent>
                    </Card>
                    <Card className="bg-[#1a262e] border-none shadow-md rounded-2xl group hover:scale-[1.02] transition-transform duration-300">
                        <CardContent className="p-6 flex flex-col items-start justify-center h-32 relative overflow-hidden">
                            {/* Icon Background Element */}
                            <Star className="absolute -right-4 -bottom-4 w-24 h-24 text-[#82FF1F]/10 rotate-12" />

                            <div className="flex items-center gap-2 mb-2">
                                <Star className="w-5 h-5 text-[#37B7F6]" />
                                <span className="text-xs uppercase tracking-wider text-[#37B7F6] font-bold">Reseñas</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">{musician.stats.rating}</span>
                                <span className="text-lg text-gray-500">/5</span>
                            </div>
                            <span className="text-xs text-gray-400 mt-1">Based on {musician.stats.reviews} reviews</span>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. Skills / Habilidades (Restored & Enhanced) */}
                <section>
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        Habilidades & Géneros
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {musician.skills.map((skill, i) => (
                            <Badge key={i} className="bg-[#1a262e] hover:bg-[#1a262e]/80 text-white border border-white/10 px-4 py-1.5 rounded-full text-sm font-normal">
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </section>

                {/* 4. Media Gallery (Scrollable Row with Hidden Scrollbar) */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Clips destacados</h3>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#37B7F6] hover:bg-[#37B7F6]/10 px-2 h-8"
                                onClick={() => galleryInputRef.current?.click()}
                            >
                                <Plus className="w-4 h-4 mr-1" /> Añadir
                            </Button>
                            <Button variant="link" className="text-[#37B7F6] text-sm h-auto p-0 hover:text-[#37B7F6]/80">Ver todo</Button>
                        </div>
                    </div>
                    {/* Added classes to hide scrollbar: [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] */}
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {gallery.map((img, i) => (
                            <div key={i} className="relative aspect-video min-w-[160px] md:min-w-[200px] rounded-xl overflow-hidden group cursor-pointer snap-start border border-white/5">
                                <img src={img} alt="Demo" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                                        <Play className="w-3 h-3 text-white fill-current ml-0.5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. TrustScore Advanced Detail (Restored) */}
                <section className="bg-[#1a262e] rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#005C8A]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-[#37B7F6]" />
                            <h3 className="font-bold text-white">TrustScore Pro</h3>
                        </div>
                        <span className="text-2xl font-bold text-[#82FF1F]">{musician.trustScore}<span className="text-sm text-gray-500 font-normal">/100</span></span>
                    </div>
                    <div className="w-full bg-black/40 h-2 rounded-full mb-2 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: '98%' }}
                            viewport={{ once: true }}
                            className="bg-gradient-to-r from-[#005C8A] to-[#82FF1F] h-full rounded-full"
                        />
                    </div>
                    <p className="text-xs text-gray-400">Basado en 24 bolos verificados, tiempo de respuesta y valoraciones de clientes.</p>
                </section>

                {/* 6. Gig Historial */}
                <section className="space-y-4 pb-24">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Historial reciente</h3>
                        <Button variant="link" className="text-[#37B7F6] text-sm h-auto p-0 hover:text-[#37B7F6]/80">Ver completo</Button>
                    </div>

                    <div className="space-y-3">
                        {musician.gigs.map((gig, index) => (
                            <div key={gig.id} className="bg-[#1a262e] p-3 rounded-xl flex items-center justify-between hover:bg-[#1a262e]/80 transition-colors cursor-default border border-white/5">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={gallery[index % gallery.length]}
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
                                    <div className="flex items-center gap-1 text-[#82FF1F] text-xs font-bold">
                                        <Star className="w-3 h-3 fill-current" /> {gig.rating}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Fixed CTA */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-50">
                <Button className="w-full h-14 rounded-2xl bg-[#005C8A] hover:bg-[#086da3] text-white font-bold text-lg shadow-[0_4px_20px_rgba(0,92,138,0.5)] flex items-center justify-between px-6 transition-all ring-1 ring-white/10 active:scale-[0.98]">
                    <span className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Contratar
                    </span>
                    <span className="text-base font-medium opacity-90">desde $150/h</span>
                </Button>
            </div>
        </div>
    );
}

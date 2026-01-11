import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { MapPin, Link as LinkIcon, Star, Music, Award, ShieldCheck, Play, Globe, Instagram, Twitter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
    return (
        <div className="space-y-8">
            {/* Header / Hero Section */}
            <div className="relative rounded-3xl overflow-hidden border border-white/5 bg-card">
                {/* Cover Image */}
                <div className="h-48 md:h-64 w-full bg-gradient-to-r from-brand-petrol to-purple-900 relative">
                    <div className="absolute inset-0 bg-black/20" />
                    {/* Edit Cover Trigger could go here */}
                </div>

                <div className="px-6 pb-6 md:px-10 md:pb-10 relative flex flex-col md:flex-row gap-6 items-end -mt-16 md:-mt-20">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-card bg-zinc-800 overflow-hidden shadow-2xl">
                            <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=800&q=80" alt="Avatar" className="h-full w-full object-cover" />
                        </div>
                        <div className="absolute bottom-2 right-2 h-8 w-8 bg-brand-cyan rounded-full border-4 border-card flex items-center justify-center text-black" title="Verified">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left pt-2 md:pt-0">
                        <h1 className="text-3xl font-heading font-bold text-white mb-1">Alex "Bass" Miller</h1>
                        <p className="text-brand-cyan font-medium mb-3 flex items-center justify-center md:justify-start gap-2">
                            <Music className="h-4 w-4" /> Bajista Profesional • Session Musician
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-y-2 gap-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Barcelona, ES</span>
                            <span className="flex items-center gap-1"><LinkIcon className="h-3 w-3" /> alexbass.com</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button className="flex-1 bg-brand-lime text-black hover:bg-brand-lime/90 font-bold">
                            Contratar
                        </Button>
                        <Button variant="outline" className="flex-1">
                            Mensaje
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Stats & Trust */}
                <div className="space-y-6">
                    {/* Trust Score Card */}
                    <Card className="border-brand-lime/20 bg-brand-lime/5 overflow-hidden relative">
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 bg-brand-lime/20 blur-2xl rounded-full"></div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <ShieldCheck className="h-5 w-5 text-brand-lime" /> Trust Score
                            </CardTitle>
                            <CardDescription>Nivel de confiabilidad en la comunidad.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-4xl font-heading font-bold text-brand-lime">98</span>
                                <span className="text-sm text-muted-foreground mb-1">/ 100</span>
                            </div>
                            <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '98%' }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="h-full bg-brand-lime shadow-[0_0_10px_#82FF1F]"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                Basado en 24 bolos completados y 15 reviews verificadas.
                            </p>
                        </CardContent>
                    </Card>

                    {/* About */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Sobre Mí</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-4">
                            <p>
                                Bajista con más de 10 años de experiencia. Especializado en Jazz, Funk y Soul.
                                He tocado en festivales como Cruïlla y Primavera Sound. Equipo propio profesional (Fender Precision '72, Ampeg SVT).
                            </p>
                            <div className="flex gap-2">
                                <Button size="icon" variant="ghost" className="h-8 w-8"><Globe className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8"><Instagram className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8"><Twitter className="h-4 w-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skills/Tags */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Habilidades</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {['Lectura a primera vista', 'Improvisación', 'Slap Bass', 'In-Ear Monitors', 'Transporte Propio'].map(skill => (
                                    <span key={skill} className="bg-white/5 border border-white/10 px-2 py-1 rounded text-xs text-secondary-foreground">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Media & Activity */}
                <div className="md:col-span-2 space-y-6">
                    {/* Media Gallery */}
                    <div>
                        <h2 className="text-xl font-heading font-bold text-white mb-4">Media Gallery</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="group relative aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-white/5 hover:border-brand-cyan/50 transition-all cursor-pointer">
                                    <img
                                        src={`https://images.unsplash.com/photo-${1510000000000 + i}?w=800&q=80`}
                                        alt="Media"
                                        className="h-full w-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-10 w-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Play className="h-5 w-5 text-white fill-white" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="aspect-video bg-white/5 rounded-xl border border-white/5 border-dashed flex items-center justify-center text-muted-foreground flex-col gap-2 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
                                <Music className="h-6 w-6" />
                                <span className="text-xs font-bold">+ Añadir Demo</span>
                            </div>
                        </div>
                    </div>

                    {/* Latest Gigs / Experience */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Historial de Gigs</span>
                                <Button variant="link" size="sm" className="text-brand-cyan">Ver todo</Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors">
                                    <div className="h-10 w-10 bg-brand-petrol/20 rounded-lg flex items-center justify-center text-brand-cyan">
                                        <Award className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white text-sm">Jazz Night @ Jamboree</h4>
                                        <p className="text-xs text-muted-foreground">Hace 2 semanas • Bajista Sustituto</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-brand-lime text-xs font-bold">
                                        <Star className="h-3 w-3 fill-current" /> 5.0
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

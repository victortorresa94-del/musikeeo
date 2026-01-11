import { motion } from 'framer-motion';
import { Sparkles, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

const MOCK_OPPORTUNITIES = [
    {
        id: 1,
        title: "Buscamos Bajista para Tour",
        author: "La Radio Band",
        location: "Madrid, ES",
        date: "Verano 2026",
        image: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&q=80",
        tag: "Gira"
    },
    {
        id: 2,
        title: "Sesión de Grabación (Trumpet)",
        author: "Sonic Studios",
        location: "Barcelona, Gràcia",
        date: "12 Mar, 10:00",
        image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80",
        tag: "Session"
    },
    {
        id: 3,
        title: "Técnico de Monitores",
        author: "Sala Apolo",
        location: "Barcelona, Poble Sec",
        date: "Fines de Semana",
        image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
        tag: "Work"
    }
];

const MOCK_NEARBY = [
    { id: 1, name: "Lucas Guitar", role: "Guitarrista", dist: "0.5km", img: "https://i.pravatar.cc/150?u=1" },
    { id: 2, name: "Ana Vocals", role: "Cantante", dist: "1.2km", img: "https://i.pravatar.cc/150?u=2" },
    { id: 3, name: "David Drums", role: "Batería", dist: "2.0km", img: "https://i.pravatar.cc/150?u=3" },
    { id: 4, name: "Studio 54", role: "Local Ensayo", dist: "2.1km", img: "https://i.pravatar.cc/150?u=4" },
];

export default function Feed() {
    return (
        <div className="space-y-8 pb-20 md:pb-0">
            {/* AI Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-petrol/40 to-black border border-brand-cyan/20 p-6 md:p-10"
            >
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 bg-brand-cyan/20 blur-3xl rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-brand-lime/10 rounded-full border border-brand-lime/20">
                            <Sparkles className="h-5 w-5 text-brand-lime animate-pulse" />
                        </div>
                        <span className="font-heading font-bold text-brand-lime tracking-wide text-sm uppercase">Daily Briefing</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4 leading-tight">
                        Buen día, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-white">Juan</span>.
                        <br />
                        Hay 3 nuevas oportunidades cerca.
                    </h1>

                    <div className="flex flex-wrap gap-4 mt-6">
                        <Button className="bg-white text-black hover:bg-white/90 font-bold rounded-xl" variant="default">
                            Ver Oportunidades
                        </Button>
                        <Button variant="outline" className="text-white border-white/20 hover:bg-white/10 rounded-xl">
                            Mi Agenda (2)
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Section 1: Oportunidades Destacadas (Horizontal Scroll) */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-heading font-bold text-white">Destacado para ti</h2>
                    <Button variant="link" className="text-brand-cyan hover:text-brand-cyan/80">Ver todo <ArrowRight className="h-4 w-4 ml-1" /></Button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                    {MOCK_OPPORTUNITIES.map((item) => (
                        <Card key={item.id} className="min-w-[280px] md:min-w-[320px] bg-card border-white/5 overflow-hidden group hover:border-brand-cyan/30 transition-all snap-start">
                            <div className="h-32 w-full overflow-hidden relative">
                                <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] uppercase font-bold text-white border border-white/10">
                                    {item.tag}
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-heading font-bold text-lg text-white mb-1 truncate">{item.title}</h3>
                                <p className="text-sm text-brand-cyan mb-3">{item.author}</p>

                                <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3 w-3" /> {item.location}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3" /> {item.date}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Section 2: Conecta en tu zona (Avatars) */}
            <section>
                <h2 className="text-xl font-heading font-bold text-white mb-4">Talento cerca de Gràcia</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {MOCK_NEARBY.map((user) => (
                        <motion.div
                            key={user.id}
                            whileHover={{ y: -5 }}
                            className="flex flex-col items-center bg-white/5 p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 hover:border-brand-lime/30 transition-all"
                        >
                            <div className="relative mb-3">
                                <img src={user.img} alt={user.name} className="h-16 w-16 rounded-full object-cover border-2 border-transparent group-hover:border-brand-lime" />
                                <div className="absolute bottom-0 right-0 h-4 w-4 bg-brand-lime rounded-full border-2 border-black" title="Online"></div>
                            </div>
                            <h4 className="font-bold text-white text-sm truncate w-full text-center">{user.name}</h4>
                            <p className="text-xs text-muted-foreground mb-1">{user.role}</p>
                            <span className="text-[10px] text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded-full">{user.dist}</span>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
}

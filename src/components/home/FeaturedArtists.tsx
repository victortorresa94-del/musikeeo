import { Star, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const artists = [
    {
        id: 1,
        name: "The Midnight Trio",
        genre: "Jazz / Blues",
        location: "CDMX",
        price: 300,
        rating: 4.9,
        image: "/artists/midnight-trio.png"
    },
    {
        id: 2,
        name: "DJ Alex Beat",
        genre: "Electrónica",
        location: "Guadalajara",
        price: 150,
        rating: 5.0,
        image: "/artists/dj-alex-beat.png"
    },
    {
        id: 3,
        name: "Mariachi Sol de Oro",
        genre: "Tradicional",
        location: "Monterrey",
        price: 400,
        rating: 4.8,
        image: "/artists/mariachi-sol.png"
    },
    {
        id: 4,
        name: "Nova Rock Band",
        genre: "Rock / Covers",
        location: "Puebla",
        price: 250,
        rating: 4.7,
        image: "/artists/nova-rock.png"
    }
];

export const FeaturedArtists = () => {
    return (
        <section className="py-10 px-4 md:px-10 bg-gradient-to-b from-transparent to-surface/30 relative z-10">
            <div className="max-w-[1200px] mx-auto">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white font-heading">Músicos destacados</h2>
                        <p className="text-muted-foreground mt-2">Talento verificado listo para tu próximo evento</p>
                    </div>
                    <Link to="/artistas" className="hidden sm:flex items-center gap-1 text-primary hover:text-white font-medium transition-colors">
                        Ver todos
                        <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {artists.map((artist) => (
                        <Link key={artist.id} to={`/perfil/${artist.id}`} className="group bg-surface rounded-xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 cursor-pointer">
                            <div className="relative aspect-square overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity"></div>
                                <div
                                    className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                    style={{ backgroundImage: `url('${artist.image}')` }}
                                ></div>

                                <div className="absolute top-3 right-3 z-20 bg-black/50 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 border border-white/10">
                                    <Star className="text-primary fill-primary" size={14} />
                                    <span className="text-white text-xs font-bold">{artist.rating.toFixed(1)}</span>
                                </div>

                                <div className="absolute bottom-3 left-3 z-20">
                                    <span className="px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm text-xs text-white border border-white/10">
                                        {artist.genre}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors truncate">{artist.name}</h3>

                                <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-3">
                                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                        <MapPin size={14} />
                                        {artist.location}
                                    </div>
                                    <div className="text-white font-bold text-sm">
                                        Desde <span className="text-primary text-base">${artist.price}</span>/hr
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-8 text-center sm:hidden">
                    <Link to="/artistas" className="inline-flex items-center gap-2 text-primary font-bold border border-primary/20 bg-primary/5 px-6 py-3 rounded-full">
                        Ver todos los artistas <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </section>
    );
};

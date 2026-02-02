import { MapPin, Star, Heart, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import type { DiscoverMusician, DiscoverBand, DiscoverTechnician } from '../../types';

interface ArtistGridCardProps {
    artist: DiscoverMusician | DiscoverBand | DiscoverTechnician;
    type: 'musician' | 'band' | 'technician';
}

export const ArtistGridCard = ({ artist, type }: ArtistGridCardProps) => {
    // Navigate to correct profile type
    const profileLink = `/profile/${artist.id}`;
    const [isFavorite, setIsFavorite] = useState(false);

    // Normalize data access
    let image = '';
    let roleOrGenre = '';

    if (type === 'musician') {
        const m = artist as DiscoverMusician;
        image = m.photoURL;
        roleOrGenre = m.role;
    } else if (type === 'band') {
        const b = artist as DiscoverBand;
        image = b.coverImage;
        roleOrGenre = b.genre;
    } else {
        const t = artist as DiscoverTechnician;
        image = t.photoURL;
        roleOrGenre = t.role;
    }

    // Mock price for display (randomize slightly based on id hash for demo consistency if needed)
    // For now we use the priceRange or fixed values
    const getPriceDisplay = () => {
        if (type === 'musician') {
            const m = artist as DiscoverMusician;
            if (m.priceRange === 'high') return '$4,500';
            if (m.priceRange === 'medium') return '$2,500';
            return '$1,200';
        }
        if (type === 'technician') {
            return '$3,000'; // Default for techs
        }
        return '$8,000'; // Bands are pricier
    };

    return (
        <Link to={profileLink} className="group relative flex flex-col rounded-xl bg-card border border-white/5 shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden hover:border-primary/50 cursor-pointer">
            {/* Image Container */}
            <div className="aspect-[4/3] w-full bg-zinc-900 relative overflow-hidden">
                {/* Heart Button */}
                <button
                    className={cn(
                        "absolute top-3 right-3 z-10 rounded-full p-2 transition-colors",
                        isFavorite
                            ? "bg-primary text-black hover:bg-primary-hover"
                            : "bg-black/60 backdrop-blur-sm text-white hover:bg-primary hover:text-black"
                    )}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsFavorite(!isFavorite);
                    }}
                >
                    <Heart size={18} className={cn("stroke-current", isFavorite && "fill-current")} />
                </button>

                {/* Badges */}
                {artist.verified && (
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-black backdrop-blur-md shadow-sm">
                        <CheckCircle2 size={12} />
                        <span>Verificado</span>
                    </div>
                )}

                {/* Image */}
                <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url('${image}')` }}
                />

                {/* Gradient Overlay (optional, for text readability if we had text over image) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">
                        {artist.name}
                    </h3>
                    <div className="flex items-center gap-1 text-primary text-sm font-bold">
                        <Star size={14} className="fill-current" />
                        <span>{artist.rating}</span>
                    </div>
                </div>

                <div className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin size={14} />
                    <span className="truncate">{artist.city}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center rounded bg-white/5 border border-white/5 px-2 py-1 text-xs font-medium text-gray-300">
                        {roleOrGenre}
                    </span>
                    {/* Safely access genres/specialties */}
                    {(artist as any).genres?.slice(0, 2).map((g: string) => (
                        <span key={g} className="inline-flex items-center rounded bg-white/5 border border-white/5 px-2 py-1 text-xs font-medium text-gray-300">
                            {g}
                        </span>
                    ))}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3 text-sm">
                    <p className="text-muted-foreground text-xs">
                        Desde <span className="text-sm font-bold text-white">{getPriceDisplay()}</span> <span className="text-[10px]">/hora</span>
                    </p>
                    <div className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        VER PERFIL
                    </div>
                </div>
            </div>
        </Link>
    );
};

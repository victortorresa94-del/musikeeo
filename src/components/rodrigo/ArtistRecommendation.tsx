import { Music, MapPin, Calendar, Euro, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ArtistRecommendation, BoloOpportunity } from '../../lib/rodrigoEngine';

interface ArtistCardProps {
    artist: ArtistRecommendation;
}

export function ArtistCard({ artist }: ArtistCardProps) {
    return (
        <div className="bg-card border border-hairline rounded-xl p-4 hover:border-[#FFD84D]/30 transition-colors">
            <div className="flex items-start gap-3">
                {/* Avatar placeholder */}
                <div className="size-12 rounded-full bg-gradient-to-br from-[#FFD84D]/20 to-[#FFD84D]/5 flex items-center justify-center shrink-0">
                    <Music size={20} className="text-[#FFD84D]" />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Name & Format */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-foreground truncate">{artist.nombre}</h4>
                        {artist.formato && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-[#FFD84D] font-medium">
                                {artist.formato}
                            </span>
                        )}
                    </div>

                    {/* Style */}
                    {artist.estilo && (
                        <p className="text-xs text-muted-foreground mt-0.5">{artist.estilo}</p>
                    )}

                    {/* Why they match */}
                    {artist.porQueEncaja && (
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            {artist.porQueEncaja}
                        </p>
                    )}

                    {/* Price & Link */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-hairline">
                        {artist.precio && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Euro size={14} className="text-[#FFD84D]" />
                                <span>{artist.precio}</span>
                            </div>
                        )}

                        <Link
                            to={artist.link || '/discover'}
                            className="flex items-center gap-1.5 text-sm text-[#FFD84D] hover:text-[#ffe066] font-medium transition-colors"
                        >
                            Ver perfil
                            <ExternalLink size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface BoloCardProps {
    bolo: BoloOpportunity;
}

export function BoloCard({ bolo }: BoloCardProps) {
    return (
        <div className="bg-card border border-hairline rounded-xl p-4 hover:border-[#FFD84D]/30 transition-colors">
            <div className="space-y-3">
                {/* Title */}
                <h4 className="font-bold text-foreground">{bolo.titulo}</h4>

                {/* Details */}
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {bolo.fecha && (
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-[#FFD84D]" />
                            <span>{bolo.fecha}</span>
                        </div>
                    )}

                    {bolo.ubicacion && (
                        <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-[#FFD84D]" />
                            <span>{bolo.ubicacion}</span>
                        </div>
                    )}
                </div>

                {/* Format & Cache */}
                <div className="flex items-center justify-between pt-3 border-t border-hairline">
                    {bolo.formatoBuscado && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-fill text-muted-foreground">
                            Buscan: {bolo.formatoBuscado}
                        </span>
                    )}

                    {bolo.cache && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Euro size={14} className="text-[#FFD84D]" />
                            <span>{bolo.cache}</span>
                        </div>
                    )}
                </div>

                {/* Action */}
                <Link
                    to={bolo.link || '/eventos'}
                    className="block w-full text-center py-2 mt-2 rounded-lg bg-primary/10 text-[#FFD84D] hover:bg-primary/20 font-medium text-sm transition-colors"
                >
                    Ver detalles y postular
                </Link>
            </div>
        </div>
    );
}

interface ArtistRecommendationsProps {
    artists: ArtistRecommendation[];
}

export function ArtistRecommendations({ artists }: ArtistRecommendationsProps) {
    if (artists.length === 0) return null;

    return (
        <div className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Artistas recomendados
            </p>
            <div className="space-y-2">
                {artists.map((artist, index) => (
                    <ArtistCard key={index} artist={artist} />
                ))}
            </div>
        </div>
    );
}

interface BoloRecommendationsProps {
    bolos: BoloOpportunity[];
}

export function BoloRecommendations({ bolos }: BoloRecommendationsProps) {
    if (bolos.length === 0) return null;

    return (
        <div className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Oportunidades que encajan contigo
            </p>
            <div className="space-y-2">
                {bolos.map((bolo, index) => (
                    <BoloCard key={index} bolo={bolo} />
                ))}
            </div>
        </div>
    );
}

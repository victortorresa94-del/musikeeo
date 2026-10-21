import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Music2, Speaker, Store, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Artist, Listing } from '../../types';
import type { ProviderConFoto, Sala } from '../../services/explorarService';

// Foto con respaldo: si no carga, un hueco con icono (nunca una cara inventada)
export function Foto({ src, className, icon: Icon = ImageIcon }: { src?: string; className?: string; icon?: React.ElementType }) {
    const [roto, setRoto] = useState(!src);
    if (roto) return <span className={cn('flex items-center justify-center bg-fill', className)}><Icon className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} /></span>;
    return <img src={src} alt="" loading="lazy" decoding="async" onError={() => setRoto(true)} className={cn('object-cover', className)} />;
}

const ciudad = (s?: string) => (s || '').split(',')[0];

export function TarjetaArtista({ a, ancho }: { a: Artist; ancho?: boolean }) {
    const genero = a.genres?.slice(0, 2).join(' · ');
    return (
        <Link to={`/artist/${a.slug}`} className={cn('pulsable group block rounded-2xl overflow-hidden bg-card shadow-e1 border border-hairline', ancho && 'w-[200px] shrink-0')}>
            <div className="relative aspect-[4/5]">
                <Foto src={a.profilePhoto || a.coverPhoto} className="absolute inset-0 h-full w-full" icon={Music2} />
                {a.priceFrom ? (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-white text-[12px] font-semibold">desde {a.priceFrom} €</span>
                ) : null}
            </div>
            <div className="p-3">
                <p className="text-[15px] font-semibold text-foreground line-clamp-1">{a.artistName}</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground line-clamp-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />{[ciudad(a.city), genero].filter(Boolean).join(' · ')}
                </p>
                {a.reviewCount > 0
                    ? <p className="mt-1 text-[12px] text-foreground">★ {a.rating} <span className="text-muted-foreground">({a.reviewCount})</span></p>
                    : <p className="mt-1 text-[12px] font-semibold text-primary-ink">Nuevo</p>}
            </div>
        </Link>
    );
}

export function TarjetaTecnico({ p }: { p: ProviderConFoto }) {
    return (
        <Link to={`/profile/${p.userId}`} className="pulsable flex gap-3 p-3 rounded-2xl bg-card shadow-e1 border border-hairline">
            <Foto src={p.photoURL} className="h-[72px] w-[72px] shrink-0 rounded-xl" icon={Speaker} />
            <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-foreground line-clamp-1">{p.businessName}</span>
                <span className="block text-[13px] text-muted-foreground line-clamp-1">{p.services?.slice(0, 3).join(' · ')}</span>
                <span className="mt-1 flex items-center gap-1 text-[12px] text-muted-foreground line-clamp-1">
                    <MapPin className="h-3 w-3 shrink-0" />{p.city || p.coverageAreas?.slice(0, 2).join(', ')}
                </span>
                {p.priceFrom ? <span className="block mt-0.5 text-[12px] font-semibold text-foreground">desde {p.priceFrom} €</span> : null}
            </span>
        </Link>
    );
}

export function TarjetaSala({ s }: { s: Sala }) {
    return (
        <Link to={`/profile/${s.uid}`} className="pulsable block rounded-2xl overflow-hidden bg-card shadow-e1 border border-hairline">
            <Foto src={s.photoURL} className="w-full aspect-[4/3]" icon={Store} />
            <div className="p-3">
                <p className="text-[15px] font-semibold text-foreground line-clamp-1">{s.displayName}</p>
                {s.location && <p className="mt-0.5 text-[13px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{ciudad(s.location)}</p>}
            </div>
        </Link>
    );
}

const precio = (l: Listing) => l.type === 'prestamo' ? 'Préstamo' : `${l.price} €${l.type === 'alquiler' && l.priceUnit ? `/${l.priceUnit}` : ''}`;
const TIPO: Record<string, string> = { venta: 'Venta', alquiler: 'Alquiler', prestamo: 'Préstamo' };

export function TarjetaAnuncio({ l, ancho }: { l: Listing; ancho?: boolean }) {
    return (
        <Link to={`/market/${l.id}`} className={cn('pulsable block rounded-2xl overflow-hidden bg-card shadow-e1 border border-hairline', ancho && 'w-[168px] shrink-0')}>
            <div className="relative aspect-square">
                <Foto src={l.images?.[0]} className="absolute inset-0 h-full w-full" />
                <span className="absolute top-2 left-2 flex gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-white text-[11px] font-semibold">{TIPO[l.type] || 'Venta'}</span>
                    {l.urgent && <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[11px] font-semibold">Urgente</span>}
                </span>
            </div>
            <div className="p-2.5">
                <p className="text-[14px] font-semibold text-foreground line-clamp-1">{l.title}</p>
                <p className="text-[14px] font-bold text-foreground">{precio(l)}</p>
                {l.userLocation && <p className="text-[12px] text-muted-foreground line-clamp-1">{ciudad(l.userLocation)}</p>}
            </div>
        </Link>
    );
}

// Fila con título y «Ver todo», que se desliza de lado en el móvil
export function Fila({ titulo, verTodo, children }: { titulo: string; verTodo?: string; children: React.ReactNode }) {
    return (
        <section className="mt-8">
            <div className="flex items-baseline justify-between px-4 md:px-0">
                <h2 className="font-heading text-[20px] font-bold text-foreground">{titulo}</h2>
                {verTodo && <Link to={verTodo} className="text-[14px] font-semibold text-muted-foreground active:opacity-60">Ver todo</Link>}
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto hide-scrollbar px-4 md:px-0 pb-2 snap-x">{children}</div>
        </section>
    );
}

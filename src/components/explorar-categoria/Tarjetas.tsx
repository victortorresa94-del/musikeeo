// Las fichas de la vista de categoría: en lista (concepto A: foto, estilos · músicos, chips,
// precio y corazón) y en rejilla. Solo datos que existen: sin reseñas ni contadores inventados.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Music2, Speaker, Store } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Foto } from '../explorar/Tarjetas';
import type { Artist, Listing } from '../../types';
import type { ProviderConFoto, Sala } from '../../services/explorarService';
import { diasDeFecha, euros, formacionDe, libreEn, llevaSonido, proximaLibre, type Filtros } from './filtros';

const ciudad = (s?: string) => (s || '').split(',')[0].trim();

// «Me gusta»: el mismo recuerdo que la ficha del artista (en este dispositivo; aún no hay favoritos en Firestore)
const CLAVE_GUSTA = 'musikeeo-artistas-gustan';
const leerGustan = (): string[] => {
    try { const v = JSON.parse(localStorage.getItem(CLAVE_GUSTA) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
};

function Corazon({ slug, nombre, className }: { slug: string; nombre: string; className?: string }) {
    const [gusta, setGusta] = useState(() => leerGustan().includes(slug));
    const cambiar = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        const otra = !gusta;
        setGusta(otra);
        try {
            const l = leerGustan().filter(s => s !== slug);
            localStorage.setItem(CLAVE_GUSTA, JSON.stringify(otra ? [...l, slug] : l));
        } catch { /* sin almacenamiento: solo dura en esta visita */ }
    };
    return (
        <button type="button" onClick={cambiar} aria-pressed={gusta} aria-label={gusta ? `Quitar ${nombre} de los que te gustan` : `Me gusta ${nombre}`}
            className={cn('pulsable h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-foreground', className)}>
            <Heart className="h-[20px] w-[20px]" strokeWidth={2} fill={gusta ? 'currentColor' : 'none'} />
        </button>
    );
}

const Chip = ({ children }: { children: React.ReactNode }) => (
    <span className="h-6 px-2 rounded-md bg-fill text-[12px] font-medium text-foreground flex items-center whitespace-nowrap">{children}</span>
);

const NOMBRE_DIA: Record<string, string> = { sabado: 'el sábado', finde: 'el finde' };

/** Las chips de una ficha de artista: sonido propio y cuándo está libre */
function chipsArtista(a: Artist, f: Filtros): string[] {
    const c: string[] = [];
    if (llevaSonido(a)) c.push('Sonido propio');
    if (f.fecha) {
        if (libreEn(a, diasDeFecha(f.fecha))) c.push(`Libre ${NOMBRE_DIA[f.fecha] ?? 'ese día'}`);
    } else {
        const d = proximaLibre(a);
        if (d) {
            const [y, m, dd] = d.split('-').map(Number);
            c.push(`Libre el ${new Date(y, m - 1, dd).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}`);
        }
    }
    return c;
}

function lineaArtista(a: Artist): string {
    const musicos = a.ficha?.musicos;
    const fm = formacionDe(a);
    return [
        a.genres?.slice(0, 2).map((g, i) => (i ? g.toLowerCase() : g)).join(', '),
        musicos && musicos > 1 ? `${musicos} músicos` : fm === 'solista' ? 'Solista' : null,
    ].filter(Boolean).join(' · ');
}

export function FilaArtista({ a, f }: { a: Artist; f: Filtros }) {
    const chips = chipsArtista(a, f);
    return (
        <Link to={`/artist/${a.slug}`} className="pulsable flex gap-3 p-2 pr-1 rounded-[18px] bg-card border border-hairline shadow-e1">
            <Foto src={a.coverPhoto || a.profilePhoto} className="w-[42%] max-w-[168px] aspect-[4/3] shrink-0 rounded-[12px]" icon={Music2} />
            <span className="min-w-0 flex-1 flex flex-col py-1">
                <span className="flex items-start gap-1">
                    <span className="min-w-0 flex-1">
                        <span className="text-[16px] font-bold leading-tight text-foreground line-clamp-2">{a.artistName}</span>
                        <span className="mt-0.5 text-[13px] text-muted-foreground line-clamp-2">{lineaArtista(a) || ciudad(a.city)}</span>
                    </span>
                    <Corazon slug={a.slug} nombre={a.artistName} className="-mt-1.5" />
                </span>
                {chips.length > 0 && <span className="mt-2 flex flex-wrap gap-1">{chips.map(c => <Chip key={c}>{c}</Chip>)}</span>}
                <span className="mt-auto pt-2 text-[14px] text-foreground">
                    {a.priceFrom ? <>desde <b className="font-bold">{euros(a.priceFrom)}</b></> : <span className="text-muted-foreground">Precio a consultar</span>}
                </span>
            </span>
        </Link>
    );
}

export function CeldaArtista({ a, f }: { a: Artist; f: Filtros }) {
    const chips = chipsArtista(a, f);
    return (
        <Link to={`/artist/${a.slug}`} className="pulsable block rounded-[18px] overflow-hidden bg-card border border-hairline shadow-e1">
            <span className="relative block aspect-[4/3]">
                <Foto src={a.coverPhoto || a.profilePhoto} className="absolute inset-0 h-full w-full" icon={Music2} />
            </span>
            <span className="block p-3">
                <span className="flex items-start gap-1">
                    <span className="min-w-0 flex-1">
                        <span className="text-[15px] font-bold leading-tight text-foreground line-clamp-1">{a.artistName}</span>
                        <span className="mt-0.5 text-[13px] text-muted-foreground line-clamp-2">{lineaArtista(a) || ciudad(a.city)}</span>
                    </span>
                    <Corazon slug={a.slug} nombre={a.artistName} className="-mt-1.5 -mr-1.5" />
                </span>
                {chips.length > 0 && <span className="mt-2 flex flex-wrap gap-1">{chips.map(c => <Chip key={c}>{c}</Chip>)}</span>}
                <span className="mt-2 block text-[14px] text-foreground">
                    {a.priceFrom ? <>desde <b className="font-bold">{euros(a.priceFrom)}</b></> : <span className="text-muted-foreground">Precio a consultar</span>}
                </span>
            </span>
        </Link>
    );
}

const UNIDAD: Record<string, string> = { dia: '/día', semana: '/semana', total: '' };
const TIPO: Record<string, string> = { venta: 'Venta', alquiler: 'Alquiler', prestamo: 'Préstamo' };
const ESTADO: Record<string, string> = { nuevo: 'Nuevo', como_nuevo: 'Como nuevo', bueno: 'Buen estado', aceptable: 'Aceptable' };
const precioAnuncio = (l: Listing) => l.type === 'prestamo' ? 'Préstamo'
    : `${euros(l.price)}${l.type === 'alquiler' && l.priceUnit ? (UNIDAD[l.priceUnit] ?? `/${l.priceUnit}`) : ''}`;

export function FilaAnuncio({ l }: { l: Listing }) {
    return (
        <Link to={`/market/${l.id}`} className="pulsable flex gap-3 p-2 rounded-[18px] bg-card border border-hairline shadow-e1">
            <Foto src={l.images?.[0]} className="h-[104px] w-[104px] shrink-0 rounded-[12px]" />
            <span className="min-w-0 flex-1 flex flex-col py-1 pr-1">
                <span className="text-[15px] font-bold leading-tight text-foreground line-clamp-2">{l.title}</span>
                <span className="mt-0.5 text-[13px] text-muted-foreground line-clamp-1">{[ciudad(l.userLocation), l.userName].filter(Boolean).join(' · ')}</span>
                <span className="mt-1.5 flex flex-wrap gap-1">
                    <Chip>{TIPO[l.type] || 'Venta'}</Chip>
                    {ESTADO[l.condition] && <Chip>{ESTADO[l.condition]}</Chip>}
                    {l.urgent && <Chip>Urgente</Chip>}
                </span>
                <span className="mt-auto pt-1.5 text-[15px] font-bold text-foreground">{precioAnuncio(l)}</span>
            </span>
        </Link>
    );
}

export function FilaTecnico({ p }: { p: ProviderConFoto }) {
    const zonas = [...new Set([ciudad(p.city), ...(p.coverageAreas || [])].filter(Boolean))];
    return (
        <Link to={`/profile/${p.userId}`} className="pulsable flex gap-3 p-2 rounded-[18px] bg-card border border-hairline shadow-e1">
            <Foto src={p.photoURL} className="h-[104px] w-[104px] shrink-0 rounded-[12px]" icon={Speaker} />
            <span className="min-w-0 flex-1 flex flex-col py-1 pr-1">
                <span className="text-[15px] font-bold leading-tight text-foreground line-clamp-1">{p.businessName}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[13px] text-muted-foreground min-w-0">
                    <MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{zonas.slice(0, 3).join(', ')}</span>
                </span>
                {p.services?.length ? (
                    <span className="mt-1.5 flex flex-wrap gap-1">{p.services.slice(0, 3).map(s => <Chip key={s}>{s}</Chip>)}</span>
                ) : null}
                <span className="mt-auto pt-1.5 text-[14px] text-foreground">
                    {p.priceFrom ? <>desde <b className="font-bold">{euros(p.priceFrom)}</b></> : <span className="text-muted-foreground">Precio a consultar</span>}
                </span>
            </span>
        </Link>
    );
}

export function FilaSala({ s }: { s: Sala }) {
    return (
        <Link to={`/profile/${s.uid}`} className="pulsable flex gap-3 p-2 rounded-[18px] bg-card border border-hairline shadow-e1">
            <Foto src={s.photoURL} className="h-[88px] w-[104px] shrink-0 rounded-[12px]" icon={Store} />
            <span className="min-w-0 flex-1 py-1 pr-1">
                <span className="text-[15px] font-bold leading-tight text-foreground line-clamp-1">{s.displayName}</span>
                {s.location && <span className="mt-0.5 flex items-center gap-1 text-[13px] text-muted-foreground"><MapPin className="h-3 w-3" />{ciudad(s.location)}</span>}
                {s.bio && <span className="mt-1 text-[13px] leading-snug text-muted-foreground line-clamp-2">{s.bio}</span>}
            </span>
        </Link>
    );
}

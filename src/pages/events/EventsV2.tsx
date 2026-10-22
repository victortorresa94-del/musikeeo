import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, SlidersHorizontal, X, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { eventService } from '../../services/eventService';
import type { Event } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { OBJETO_3D } from '../../config/objetos3d';
import { TarjetaBolo, TarjetaBoloEsqueleto } from '../../components/bolos/TarjetaBolo';
import { FiltrosBolos } from '../../components/bolos/FiltrosBolos';
import {
    CHIPS_BOLO, TIPOS_ENCARGO, bolsaDe, casaChip, diaSemana, fechaDe, mesCorto, nombreTipo, norm,
    type ChipBolo, type FechaBolo, type TipoEncargo,
} from '../../components/bolos/tablon';

// ─── Mock data for when Firestore is empty ────────────────────────────────────
const MOCK_EVENTS: Event[] = [
    {
        id: 'mock_1',
        title: 'Guitarrista eléctrico para gira de verano',
        description: 'Banda de rock busca guitarrista solista para gira de 15 fechas por España.',
        type: 'gig',
        location: 'Madrid, España',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
        price: 800,
        organizerId: 'org_1',
        organizerName: 'Banda Los Sónicos',
        imageUrl: '/images/market/concert_venue_1768143610025.png',
        tags: ['Urgente'],
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock_2',
        title: 'Técnico FOH para festival de jazz',
        description: 'Buscamos técnico de sonido con experiencia en mezcla en vivo para festival.',
        type: 'session',
        location: 'Barcelona, España',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
        price: 1200,
        organizerId: 'org_2',
        organizerName: 'JazzFest BCN',
        imageUrl: '/images/market/sound_engineer_1768143670792.png',
        tags: ['Premium'],
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock_3',
        title: 'DJ para boda en finca privada',
        description: 'Matrimonio busca DJ profesional para celebración con 200 invitados.',
        type: 'gig',
        location: 'Valencia, España',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(),
        price: 600,
        organizerId: 'org_3',
        organizerName: 'Eventos Solís',
        imageUrl: '/images/market/rehearsal_space_1768143644276.png',
        tags: ['Nuevo'],
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock_4',
        title: 'Músicos para sesión de grabación',
        description: 'Productor busca batería y bajo para grabar EP de 5 temas en estudio.',
        type: 'session',
        location: 'Sevilla, España',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8).toISOString(),
        price: 350,
        organizerId: 'org_4',
        organizerName: 'Estudio Sur Records',
        imageUrl: '/images/market/recording_studio_1768143540955.png',
        tags: [],
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock_5',
        title: 'Banda telonera — Festival Rock en Río',
        description: 'Festival necesita banda telonera para apertura del escenario principal.',
        type: 'gig',
        location: 'Madrid, España',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        price: 2500,
        organizerId: 'org_5',
        organizerName: 'Rock en Río ES',
        imageUrl: '/images/market/concert_venue_1768143610025.png',
        tags: ['Premium'],
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock_6',
        title: 'Cantante para residencia mensual en bar',
        description: 'Bar de jazz en el centro busca cantante para actuaciones de jueves a sábado.',
        type: 'gig',
        location: 'Barcelona, España',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
        price: 400,
        organizerId: 'org_6',
        organizerName: 'Jazz Club Plata',
        imageUrl: '/images/market/microphone_pro_1768143562847.png',
        tags: ['Urgente'],
        createdAt: new Date().toISOString(),
    },
];

interface Fila {
    e: Event;
    f: FechaBolo | null;
    pasado: boolean;
    bolsa: Set<string>;
    texto: string;
}

// «Sala La Fragua, Barcelona» → «Barcelona»: lo último es la ciudad (o la provincia)
const ciudadDe = (loc?: string) => (loc || '').split(',').pop()!.trim();

// Lo que encuentra el buscador: título, sitio, etiquetas, quién lo publica, el tipo y la fecha
// escrita («sábado 25 octubre», «25/10»), para que «noviembre» o «sábado» también busquen
function textoDe(e: Event, f: FechaBolo | null) {
    const fecha = f ? [
        f.d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
        diaSemana(f.d), mesCorto(f.d), `${f.d.getDate()}/${f.d.getMonth() + 1}`,
    ] : [];
    return norm([e.title, e.location, ...(e.tags || []), e.organizerName, nombreTipo(e.type), ...fecha].filter(Boolean).join(' · '));
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function EventsV2() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [usingMocks, setUsingMocks] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [chip, setChip] = useState<ChipBolo>('todos');
    const [tipo, setTipo] = useState<TipoEncargo>('todos');
    const [cityFilter, setCityFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [verPasados, setVerPasados] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const allEvents = await eventService.getUpcomingEvents();
                if (allEvents.length > 0) {
                    setEvents(allEvents);
                    setUsingMocks(false);
                } else {
                    setEvents(MOCK_EVENTS);
                    setUsingMocks(true);
                }
            } catch {
                setEvents(MOCK_EVENTS);
                setUsingMocks(true);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [user]);

    // Cada bolo con su fecha, si ya pasó (antes de hoy) y lo que se busca en él
    const filas = useMemo<Fila[]>(() => {
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        return events.map(e => {
            const f = fechaDe(e.date);
            return { e, f, pasado: !!f && f.d < hoy, bolsa: bolsaDe(e), texto: textoDe(e, f) };
        });
    }, [events]);

    const abiertosTotal = useMemo(() => filas.filter(x => !x.pasado).length, [filas]);

    // Ciudades para la hoja de filtros: las de los bolos que hay
    const ciudades = useMemo(() => {
        const vistas = new Map<string, string>();
        for (const x of filas) {
            const c = ciudadDe(x.e.location);
            if (c && !vistas.has(norm(c))) vistas.set(norm(c), c);
        }
        return [...vistas.values()].slice(0, 8);
    }, [filas]);

    // Buscador, chip y hoja de filtros a la vez (la hoja dice cuántos quedan)
    const filtrados = useMemo(() => {
        const palabrasQ = norm(searchQuery).split(/\s+/).filter(Boolean);
        const tipos: readonly string[] = TIPOS_ENCARGO.find(t => t.id === tipo)?.tipos ?? [];
        const c = norm(cityFilter.trim());
        return filas.filter(x => {
            if (palabrasQ.length && !palabrasQ.every(p => x.texto.includes(p))) return false;
            if (tipos.length && !tipos.includes((x.e.type || '').toLowerCase())) return false;
            if (c && !norm(x.e.location || '').includes(c)) return false;
            return casaChip(x.bolsa, chip);
        });
    }, [filas, searchQuery, tipo, cityFilter, chip]);

    // Los abiertos, del más cercano al más lejano (los sin fecha, al final);
    // los que ya pasaron, del más reciente al más antiguo
    const abiertos = useMemo(() => filtrados.filter(x => !x.pasado)
        .sort((a, b) => (a.f?.d.getTime() ?? Infinity) - (b.f?.d.getTime() ?? Infinity)), [filtrados]);
    const pasados = useMemo(() => filtrados.filter(x => x.pasado)
        .sort((a, b) => b.f!.d.getTime() - a.f!.d.getTime()), [filtrados]);

    const nFiltros = (tipo !== 'todos' ? 1 : 0) + (cityFilter.trim() ? 1 : 0);
    const hayFiltros = !!searchQuery.trim() || chip !== 'todos' || nFiltros > 0;
    const limpiar = () => { setSearchQuery(''); setChip('todos'); setTipo('todos'); setCityFilter(''); };
    const cerrarFiltros = useCallback(() => setShowFilters(false), []);

    const subtitulo = loading ? 'Cargando bolos…'
        : usingMocks ? 'Bolos de ejemplo'
        : abiertosTotal === 0 ? 'Ahora mismo no hay bolos abiertos'
        : `${abiertosTotal} ${abiertosTotal === 1 ? 'bolo abierto' : 'bolos abiertos'}`;

    const chipActivo = CHIPS_BOLO.find(c => c.id === chip)!;
    const tituloVacio = searchQuery.trim()
        ? `Nada con «${searchQuery.trim()}»${chip !== 'todos' ? ` en ${chipActivo.nombre.toLowerCase()}` : ''} por ahora`
        : chip !== 'todos' ? (nFiltros > 0 ? `Ningún bolo ${chipActivo.vacio} con estos filtros` : `Ahora no hay bolos ${chipActivo.vacio}`)
        : nFiltros > 0 ? 'Ningún bolo con estos filtros'
        : 'No hay bolos abiertos ahora mismo';

    return (
        <div className="min-h-full bg-background">
            <div className="max-w-[1072px] mx-auto px-4 md:px-6 pt-3 md:pt-6 pb-16">

                {/* ── Cabecera ── */}
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="font-heading text-[28px] leading-tight font-bold text-foreground">Bolos</h1>
                        <p className="mt-0.5 text-[15px] text-muted-foreground">{subtitulo}</p>
                    </div>
                    <button
                        onClick={() => navigate('/publicar')}
                        className="pulsable mt-0.5 shrink-0 h-9 pl-3 pr-4 rounded-full bg-primary text-primary-foreground text-[15px] font-bold flex items-center gap-1.5"
                    >
                        <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} />
                        <span>Publicar<span className="hidden md:inline"> un bolo</span></span>
                    </button>
                </div>

                {/* ── Buscador (con los filtros de siempre a la derecha) ── */}
                <div className="relative mt-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Busca por ciudad, estilo o fecha"
                        aria-label="Buscar bolos"
                        className={cn(
                            'w-full h-12 rounded-2xl bg-fill pl-12 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 [&::-webkit-search-cancel-button]:hidden',
                            searchQuery ? 'pr-[88px]' : 'pr-14',
                        )}
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} aria-label="Borrar búsqueda" className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <button
                            onClick={() => setShowFilters(true)}
                            aria-label={nFiltros ? `Filtros (${nFiltros} activos)` : 'Filtros'}
                            className={cn(
                                'pulsable relative h-9 w-9 rounded-full flex items-center justify-center',
                                nFiltros ? 'bg-foreground text-background' : 'text-foreground',
                            )}
                        >
                            <SlidersHorizontal className="h-[18px] w-[18px]" />
                            {nFiltros > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-background text-foreground border border-hairline-strong text-[10px] font-bold leading-[14px] text-center">
                                    {nFiltros}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── Chips por momento ── */}
                <div className="mt-3 -mx-4 px-4 md:mx-0 md:px-0 flex gap-2 overflow-x-auto hide-scrollbar">
                    {CHIPS_BOLO.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setChip(c.id)}
                            aria-pressed={chip === c.id}
                            className={cn(
                                'pulsable shrink-0 h-9 px-4 rounded-full text-[14px] font-semibold',
                                chip === c.id ? 'bg-foreground text-background' : 'bg-fill text-foreground',
                            )}
                        >
                            {c.nombre}
                        </button>
                    ))}
                </div>

                {/* ── Aviso de ejemplo ── */}
                {usingMocks && !loading && (
                    <div className="mt-4 rounded-2xl bg-fill px-4 py-3 flex items-start gap-3">
                        <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="text-[14px]">
                            <p className="font-semibold text-foreground">Estos bolos son de ejemplo</p>
                            <p className="mt-0.5 text-muted-foreground">
                                Todavía no hay bolos reales publicados. Sé el primero en{' '}
                                <Link to="/publicar" className="underline font-semibold text-foreground">publicar uno</Link>.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── El tablón ── */}
                <div className="mt-4">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[0, 1, 2, 3].map(i => <TarjetaBoloEsqueleto key={i} />)}
                        </div>
                    ) : abiertos.length > 0 ? (
                        <Rejilla filas={abiertos} />
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <img src={OBJETO_3D.calendario} alt="" loading="lazy" className="mx-auto h-24 w-24 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]" />
                            <p className="mt-3 text-[17px] font-bold text-foreground">{tituloVacio}</p>
                            <p className="mt-1 text-[14px] text-muted-foreground">¿Organizas uno? Publícalo y te escribirán los músicos.</p>
                            <div className="mt-5 flex justify-center gap-2">
                                <Link to="/publicar" className="pulsable h-9 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold flex items-center gap-1.5">
                                    <Plus className="h-4 w-4" strokeWidth={2.5} /> Publicar un bolo
                                </Link>
                                {hayFiltros && (
                                    <button onClick={limpiar} className="pulsable h-9 px-4 rounded-full bg-fill text-foreground text-[14px] font-semibold">
                                        Ver todos
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Los que ya pasaron: no son «abiertos», pero no se pierden */}
                    {!loading && pasados.length > 0 && (
                        <div className="mt-8">
                            {verPasados && (
                                <>
                                    <h2 className="font-heading text-[20px] font-bold text-foreground">Ya pasaron</h2>
                                    <div className="mt-3"><Rejilla filas={pasados} pasado /></div>
                                </>
                            )}
                            <div className={cn('flex justify-center', verPasados && 'mt-4')}>
                                <button onClick={() => setVerPasados(v => !v)} className="pulsable h-9 px-4 rounded-full bg-fill text-foreground text-[14px] font-semibold">
                                    {verPasados ? 'Ocultar los que ya pasaron'
                                        : pasados.length === 1 ? 'Ver el que ya pasó' : `Ver los ${pasados.length} que ya pasaron`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <FiltrosBolos
                open={showFilters}
                onClose={cerrarFiltros}
                tipo={tipo}
                onTipo={setTipo}
                ciudad={cityFilter}
                onCiudad={setCityFilter}
                ciudades={ciudades}
                resultados={abiertos.length}
            />
        </div>
    );
}

function Rejilla({ filas, pasado }: { filas: Fila[]; pasado?: boolean }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filas.map((x, i) => (
                <motion.div
                    key={x.e.id}
                    className="h-full"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.03 }}
                >
                    <TarjetaBolo e={x.e} pasado={pasado} />
                </motion.div>
            ))}
        </div>
    );
}

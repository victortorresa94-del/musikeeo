import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X, MapPin, ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIAS, MOMENTOS, iconoCategoria, type Categoria } from '../../config/categorias';
import { explorarService, enCiudad, norm, type ProviderConFoto, type Sala } from '../../services/explorarService';
import { Fila, TarjetaAnuncio, TarjetaArtista, TarjetaSala, TarjetaTecnico } from '../../components/explorar/Tarjetas';
import type { Artist, Listing } from '../../types';

const CIUDADES = ['Barcelona', 'Madrid', 'Valencia', 'Sevilla', 'Girona'];
const CLAVE_CIUDAD = 'musikeeo-ciudad';

// El marketplace: todo lo que se contrata, se compra o se alquila en la música (concepto A + C del sueño)
export default function Explorar() {
    const { userProfile } = useAuth();
    const [params, setParams] = useSearchParams();
    const q = params.get('q') || '';
    const [texto, setTexto] = useState(q);
    const [ciudad, setCiudad] = useState<string | null>(() => {
        try { const g = localStorage.getItem(CLAVE_CIUDAD); if (g !== null) return g || null; } catch { /* */ }
        return null;
    });
    const [menuCiudad, setMenuCiudad] = useState(false);
    const [artistas, setArtistas] = useState<Artist[]>([]);
    const [tecnicos, setTecnicos] = useState<ProviderConFoto[]>([]);
    const [salas, setSalas] = useState<Sala[]>([]);
    const [anuncios, setAnuncios] = useState<Listing[]>([]);

    useEffect(() => {
        explorarService.artistas().then(setArtistas).catch(() => {});
        explorarService.tecnicos().then(setTecnicos).catch(() => {});
        explorarService.salas().then(setSalas).catch(() => {});
        explorarService.anuncios().then(setAnuncios).catch(() => {});
    }, []);

    // La ciudad del perfil, si la persona no ha elegido otra
    useEffect(() => {
        if (ciudad !== null) return;
        const suya = CIUDADES.find(c => enCiudad(userProfile?.location, c));
        if (suya) setCiudad(suya);
    }, [userProfile, ciudad]);

    useEffect(() => { setTexto(q); }, [q]);
    useEffect(() => {
        const t = setTimeout(() => {
            const next = new URLSearchParams(params);
            if (texto.trim()) next.set('q', texto.trim()); else next.delete('q');
            if (next.toString() !== params.toString()) setParams(next, { replace: true });
        }, 250);
        return () => clearTimeout(t);
    }, [texto]); // eslint-disable-line react-hooks/exhaustive-deps

    const elegirCiudad = (c: string | null) => {
        setCiudad(c); setMenuCiudad(false);
        try { localStorage.setItem(CLAVE_CIUDAD, c || ''); } catch { /* */ }
    };

    const cerca = useMemo(() => {
        const a = artistas.filter(x => enCiudad(x.city, ciudad));
        return a.length ? a : artistas;
    }, [artistas, ciudad]);
    const recientes = useMemo(() => {
        const l = anuncios.filter(x => enCiudad(x.userLocation, ciudad));
        return l.length ? l : anuncios;
    }, [anuncios, ciudad]);

    // Buscador de todo el marketplace: categorías, artistas, técnicos, salas y equipo
    const resultados = useMemo(() => {
        const t = norm(q.trim());
        if (!t) return null;
        const hay = (...xs: (string | undefined)[]) => xs.some(x => x && norm(x).includes(t));
        return {
            categorias: CATEGORIAS.filter(c => hay(c.nombre, c.bajada, ...(c.sinonimos || []))),
            artistas: artistas.filter(a => hay(a.artistName, a.city, a.bio, ...(a.genres || []), ...(a.tags || []))),
            tecnicos: tecnicos.filter(p => hay(p.businessName, p.city, ...(p.services || []), ...(p.coverageAreas || []))),
            salas: salas.filter(s => hay(s.displayName, s.location, s.bio)),
            anuncios: anuncios.filter(l => hay(l.title, l.description, l.category, l.userLocation)),
        };
    }, [q, artistas, tecnicos, salas, anuncios]);
    const total = resultados ? Object.values(resultados).reduce((n, r) => n + r.length, 0) : 0;

    return (
        <div className="max-w-5xl mx-auto pt-3 md:pt-6 pb-16">
            {/* Cabecera */}
            <div className="px-4 md:px-0">
                <div className="flex items-center justify-between">
                    <h1 className="font-heading text-[28px] font-bold leading-tight text-foreground">Explorar</h1>
                    <div className="relative">
                        <button onClick={() => setMenuCiudad(v => !v)} className="pulsable h-9 pl-3 pr-2.5 rounded-full bg-fill flex items-center gap-1.5 text-[14px] font-semibold text-foreground">
                            <MapPin className="h-4 w-4" /> {ciudad || 'Toda España'} <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {menuCiudad && (
                            <div className="absolute right-0 top-11 z-30 w-48 rounded-2xl bg-sheet border border-hairline shadow-e3 overflow-hidden">
                                {[null, ...CIUDADES].map(c => (
                                    <button key={c || 'todas'} onClick={() => elegirCiudad(c)}
                                        className={cn('w-full h-11 px-4 text-left text-[15px] active:bg-fill', (c || null) === ciudad ? 'font-semibold text-foreground' : 'text-foreground/80')}>
                                        {c || 'Toda España'}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <label className="relative mt-3 block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                        value={texto}
                        onChange={e => setTexto(e.target.value)}
                        placeholder="¿Qué necesitas? Bandas, técnicos, guitarras…"
                        aria-label="Buscar en Musikeeo"
                        className="w-full h-12 rounded-2xl bg-fill pl-12 pr-11 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                    />
                    {texto && (
                        <button onClick={() => setTexto('')} aria-label="Borrar" className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </label>
            </div>

            {resultados ? (
                <Resultados q={q} r={resultados} total={total} />
            ) : (
                <>
                    {/* Por momento */}
                    {/* El objeto 3D no cabe en su tarjeta a propósito: los altos asoman por arriba.
                        El pt-7 deja sitio a lo que asoma, que el carrusel recortaría */}
                    <div className="mt-0 pt-7 pb-2 flex gap-4 overflow-x-auto hide-scrollbar px-4 md:px-0 snap-x scroll-pl-4 md:scroll-pl-0">
                        {MOMENTOS.map(m => (
                            <Link key={m.slug} to={m.destino}
                                className={cn('pulsable snap-start', m.fondo, 'shrink-0 w-[300px] h-[128px] rounded-[22px] relative flex shadow-e1')}>
                                <span className="relative z-10 flex flex-col justify-center pl-4 pr-1 w-[54%]">
                                    <span className="font-heading text-[18px] font-bold leading-[1.15] text-[#141414]">{m.titulo}</span>
                                    <span className="mt-1 text-[12.5px] leading-snug text-[#141414]/70">{m.bajada}</span>
                                </span>
                                <img src={m.imagen} alt="" loading="lazy" decoding="async"
                                    className="pointer-events-none absolute bottom-2 right-1 h-[150px] w-[52%] object-contain object-bottom drop-shadow-[0_10px_12px_rgba(0,0,0,0.18)]" />
                            </Link>
                        ))}
                    </div>

                    {/* Categorías */}
                    {/* Una sola rejilla, en el orden del sueño: primero lo que se contrata, luego el equipo */}
                    <Grupo titulo="Todo en Musikeeo" cats={CATEGORIAS} />

                    {/* Banner: la acción que más importa */}
                    <div className="px-4 md:px-0 mt-8">
                        <Link to="/rodrigo" className="pulsable relative flex h-[132px] rounded-[22px] overflow-hidden bg-[#F9D74F] shadow-e1">
                            <span className="relative z-10 flex flex-col justify-center pl-5 pr-1 w-[52%]">
                                <span className="font-heading text-[20px] font-bold leading-[1.15] text-[#141414]">Tu banda para la boda, en 2 minutos</span>
                                <span className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold text-[#141414]/75"><Sparkles className="h-3.5 w-3.5" /> Pregúntale a Rodrigo</span>
                            </span>
                            <img src="/images/categorias/banner-boda.webp" alt="" className="funde-izq absolute right-0 top-0 h-full w-[54%] object-cover object-center" />
                        </Link>
                    </div>

                    {cerca.length > 0 && (
                        <Fila titulo={ciudad ? `Artistas en ${ciudad}` : 'Artistas'} verTodo="/explorar/bandas">
                            {cerca.slice(0, 10).map(a => <div key={a.id} className="snap-start"><TarjetaArtista a={a} ancho /></div>)}
                        </Fila>
                    )}
                    {recientes.length > 0 && (
                        <Fila titulo="Recién llegado al Mercado" verTodo="/explorar/segunda-mano">
                            {recientes.slice(0, 10).map(l => <div key={l.id} className="snap-start"><TarjetaAnuncio l={l} ancho /></div>)}
                        </Fila>
                    )}
                </>
            )}
        </div>
    );
}

function Grupo({ titulo, cats }: { titulo: string; cats: Categoria[] }) {
    return (
        <section className="mt-7 px-4 md:px-0">
            <h2 className="font-heading text-[20px] font-bold text-foreground">{titulo}</h2>
            <div className="mt-3 grid grid-cols-4 md:grid-cols-6 gap-x-3 gap-y-4">
                {cats.map(c => (
                    <Link key={c.slug} to={`/explorar/${c.slug}`} className="pulsable flex flex-col items-center gap-1.5">
                        <img src={iconoCategoria(c)} alt="" className="w-full aspect-[8/7] rounded-[18px] object-cover shadow-e1" />
                        <span className="text-[13px] font-semibold text-foreground text-center leading-tight">{c.nombre}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}

function Resultados({ q, r, total }: { q: string; total: number; r: { categorias: Categoria[]; artistas: Artist[]; tecnicos: ProviderConFoto[]; salas: Sala[]; anuncios: Listing[] } }) {
    if (total === 0) {
        return (
            <div className="px-6 py-16 text-center">
                <p className="font-semibold text-foreground">Nada con «{q}» todavía</p>
                <p className="mt-1 text-[14px] text-muted-foreground">Publica lo que buscas y te escriben, o pregúntale a Rodrigo.</p>
                <div className="mt-5 flex justify-center gap-2">
                    <Link to="/publicar" className="h-9 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold flex items-center">Publicar bolo</Link>
                    <Link to="/rodrigo" className="h-9 px-4 rounded-full bg-fill text-foreground text-[14px] font-semibold flex items-center">Rodrigo</Link>
                </div>
            </div>
        );
    }
    return (
        <div className="mt-2">
            {r.categorias.length > 0 && (
                <div className="px-4 md:px-0 mt-4 flex flex-wrap gap-2">
                    {r.categorias.map(c => (
                        <Link key={c.slug} to={`/explorar/${c.slug}`} className="pulsable h-10 pl-1 pr-3.5 rounded-full bg-fill flex items-center gap-2 text-[14px] font-semibold text-foreground">
                            <img src={iconoCategoria(c)} alt="" className="h-8 w-8 rounded-full object-cover" /> {c.nombre}
                        </Link>
                    ))}
                </div>
            )}
            {r.artistas.length > 0 && <Fila titulo={`Artistas · ${r.artistas.length}`}>{r.artistas.map(a => <div key={a.id}><TarjetaArtista a={a} ancho /></div>)}</Fila>}
            {r.tecnicos.length > 0 && (
                <section className="mt-8 px-4 md:px-0">
                    <h2 className="font-heading text-[20px] font-bold text-foreground">Técnicos · {r.tecnicos.length}</h2>
                    <div className="mt-3 grid md:grid-cols-2 gap-2">{r.tecnicos.map(p => <TarjetaTecnico key={p.id} p={p} />)}</div>
                </section>
            )}
            {r.salas.length > 0 && <Fila titulo={`Salas · ${r.salas.length}`}>{r.salas.map(s => <div key={s.uid} className="w-[200px] shrink-0"><TarjetaSala s={s} /></div>)}</Fila>}
            {r.anuncios.length > 0 && <Fila titulo={`Equipo · ${r.anuncios.length}`}>{r.anuncios.map(l => <div key={l.id}><TarjetaAnuncio l={l} ancho /></div>)}</Fila>}
        </div>
    );
}

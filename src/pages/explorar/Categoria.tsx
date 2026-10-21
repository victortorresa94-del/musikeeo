import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Search, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { categoriaPorSlug, iconoCategoria, CATEGORIAS } from '../../config/categorias';
import { anunciosDe, artistasDe, enCiudad, explorarService, norm, type ProviderConFoto, type Sala } from '../../services/explorarService';
import { TarjetaAnuncio, TarjetaArtista, TarjetaSala, TarjetaTecnico } from '../../components/explorar/Tarjetas';
import type { Artist, Listing } from '../../types';

const CIUDADES = ['Barcelona', 'Madrid', 'Valencia', 'Sevilla', 'Girona'];
type Orden = 'relevancia' | 'precio-asc' | 'precio-desc';

// La vista de una categoría del marketplace: su icono, su menú de filtros y sus fichas
export default function Categoria() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const cat = categoriaPorSlug(slug);
    const [artistas, setArtistas] = useState<Artist[] | null>(null);
    const [tecnicos, setTecnicos] = useState<ProviderConFoto[] | null>(null);
    const [salas, setSalas] = useState<Sala[] | null>(null);
    const [anuncios, setAnuncios] = useState<Listing[] | null>(null);
    const [texto, setTexto] = useState('');
    const [ciudad, setCiudad] = useState<string | null>(() => { try { return localStorage.getItem('musikeeo-ciudad') || null; } catch { return null; } });
    const [genero, setGenero] = useState<string | null>(null);
    const [tipo, setTipo] = useState<'todo' | 'venta' | 'alquiler' | 'prestamo'>('todo');
    const [orden, setOrden] = useState<Orden>('relevancia');

    useEffect(() => {
        if (!cat) return;
        setTexto(''); setGenero(null); setTipo('todo');
        if (cat.tipo === 'artistas') explorarService.artistas().then(setArtistas).catch(() => setArtistas([]));
        if (cat.tipo === 'tecnicos') explorarService.tecnicos().then(setTecnicos).catch(() => setTecnicos([]));
        if (cat.tipo === 'salas') explorarService.salas().then(setSalas).catch(() => setSalas([]));
        if (cat.tipo === 'equipo') explorarService.anuncios().then(setAnuncios).catch(() => setAnuncios([]));
    }, [cat]);

    const t = norm(texto.trim());
    const hay = (...xs: (string | undefined)[]) => !t || xs.some(x => x && norm(x).includes(t));

    const listaArtistas = useMemo(() => {
        if (!cat || !artistas) return null;
        let l = artistasDe(cat, artistas).filter(a => enCiudad(a.city, ciudad) && hay(a.artistName, a.bio, ...(a.genres || [])));
        if (genero) l = l.filter(a => a.genres?.includes(genero));
        if (orden !== 'relevancia') l = [...l].sort((x, y) => ((x.priceFrom || 0) - (y.priceFrom || 0)) * (orden === 'precio-asc' ? 1 : -1));
        return l;
    }, [cat, artistas, ciudad, genero, orden, t]); // eslint-disable-line react-hooks/exhaustive-deps
    const generos = useMemo(() => {
        if (!cat || !artistas) return [];
        const c = new Map<string, number>();
        artistasDe(cat, artistas).forEach(a => a.genres?.forEach(g => c.set(g, (c.get(g) || 0) + 1)));
        return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([g]) => g);
    }, [cat, artistas]);
    const listaTecnicos = useMemo(() => tecnicos?.filter(p => enCiudad([p.city, ...(p.coverageAreas || [])].join(' '), ciudad) && hay(p.businessName, ...(p.services || []))) ?? null,
        [tecnicos, ciudad, t]); // eslint-disable-line react-hooks/exhaustive-deps
    const listaSalas = useMemo(() => salas?.filter(s => enCiudad(s.location, ciudad) && hay(s.displayName, s.bio)) ?? null,
        [salas, ciudad, t]); // eslint-disable-line react-hooks/exhaustive-deps
    const listaAnuncios = useMemo(() => {
        if (!cat || !anuncios) return null;
        let l = anunciosDe(cat, anuncios).filter(x => enCiudad(x.userLocation, ciudad) && hay(x.title, x.description));
        if (tipo !== 'todo') l = l.filter(x => x.type === tipo);
        if (orden !== 'relevancia') l = [...l].sort((x, y) => (x.price - y.price) * (orden === 'precio-asc' ? 1 : -1));
        return l;
    }, [cat, anuncios, ciudad, tipo, orden, t]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!cat) return <Navigate to="/explorar" replace />;

    const lista = listaArtistas ?? listaTecnicos ?? listaSalas ?? listaAnuncios;
    const cargando = lista === null;
    const n = lista?.length ?? 0;

    const back = () => {
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
        if (idx > 0) navigate(-1); else navigate('/explorar');
    };

    const vacio = {
        artistas: { texto: `Aún no hay ${cat.nombre.toLowerCase()} aquí${ciudad ? ` en ${ciudad}` : ''}.`, cta: 'Crear mi perfil de artista', to: '/panel/perfil' },
        tecnicos: { texto: `Aún no hay técnicos${ciudad ? ` en ${ciudad}` : ''}.`, cta: 'Crear mi ficha de técnico', to: '/panel/perfil-tecnico' },
        salas: { texto: `Aún no hay salas${ciudad ? ` en ${ciudad}` : ''}.`, cta: 'Publicar un bolo', to: '/publicar' },
        equipo: { texto: `Aún no hay anuncios de ${cat.nombre.toLowerCase()}${ciudad ? ` en ${ciudad}` : ''}.`, cta: 'Publicar anuncio', to: '/market/create' },
    }[cat.tipo];

    const Chip = ({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) => (
        <button onClick={onClick} className={cn('pulsable shrink-0 h-9 px-3.5 rounded-full text-[14px] font-semibold', activo ? 'bg-foreground text-background' : 'bg-fill text-foreground')}>{children}</button>
    );

    return (
        <div className="max-w-5xl mx-auto pt-2 md:pt-4 pb-16">
            <div className="px-4 md:px-0">
                <button onClick={back} className="h-10 -ml-2 pr-3 flex items-center text-[15px] text-foreground active:opacity-60">
                    <ChevronLeft className="h-6 w-6" /> Explorar
                </button>
                <div className="mt-1 flex items-center gap-4">
                    <img src={iconoCategoria(cat)} alt="" className="h-[72px] w-[82px] rounded-[18px] object-cover shadow-e1" />
                    <div className="min-w-0">
                        <h1 className="font-heading text-[30px] font-bold leading-tight text-foreground">{cat.nombre}</h1>
                        <p className="text-[14px] text-muted-foreground">{cat.bajada}</p>
                    </div>
                </div>

                <label className="relative mt-4 block">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input value={texto} onChange={e => setTexto(e.target.value)} placeholder={`Buscar en ${cat.nombre.toLowerCase()}`}
                        className="w-full h-11 rounded-xl bg-fill pl-10 pr-3 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </label>
            </div>

            {/* El menú de la categoría */}
            <div className="mt-3 flex gap-2 overflow-x-auto hide-scrollbar px-4 md:px-0">
                <Chip activo={!ciudad} onClick={() => setCiudad(null)}>Toda España</Chip>
                {CIUDADES.map(c => <Chip key={c} activo={ciudad === c} onClick={() => setCiudad(c)}>{c}</Chip>)}
            </div>
            {cat.tipo === 'artistas' && generos.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto hide-scrollbar px-4 md:px-0">
                    <Chip activo={!genero} onClick={() => setGenero(null)}>Todos los estilos</Chip>
                    {generos.map(g => <Chip key={g} activo={genero === g} onClick={() => setGenero(g)}>{g}</Chip>)}
                </div>
            )}
            {cat.tipo === 'equipo' && !cat.tipoAnuncio && (
                <div className="mt-2 flex gap-2 overflow-x-auto hide-scrollbar px-4 md:px-0">
                    {([['todo', 'Todo'], ['venta', 'Venta'], ['alquiler', 'Alquiler'], ['prestamo', 'Préstamo']] as const).map(([k, l]) =>
                        <Chip key={k} activo={tipo === k} onClick={() => setTipo(k)}>{l}</Chip>)}
                </div>
            )}

            <div className="mt-4 px-4 md:px-0 flex items-center justify-between">
                <p className="text-[14px] text-muted-foreground">{cargando ? 'Cargando…' : `${n} ${n === 1 ? 'resultado' : 'resultados'}`}</p>
                {(cat.tipo === 'artistas' || cat.tipo === 'equipo') && (
                    <select value={orden} onChange={e => setOrden(e.target.value as Orden)} aria-label="Ordenar"
                        className="h-9 rounded-full bg-fill px-3 text-[14px] font-semibold text-foreground focus:outline-none">
                        <option value="relevancia">Relevancia</option>
                        <option value="precio-asc">Precio: de menos a más</option>
                        <option value="precio-desc">Precio: de más a menos</option>
                    </select>
                )}
            </div>

            <div className="mt-3 px-4 md:px-0">
                {cargando && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[0, 1, 2, 3].map(i => <div key={i} className="aspect-[4/5] rounded-2xl bg-fill animate-pulse" />)}
                    </div>
                )}
                {!cargando && n === 0 && (
                    <div className="py-12 text-center">
                        <img src={iconoCategoria(cat)} alt="" className="h-16 w-[72px] mx-auto rounded-2xl object-cover opacity-90" />
                        <p className="mt-3 text-[15px] text-foreground font-semibold">{vacio.texto}</p>
                        <p className="mt-1 text-[14px] text-muted-foreground">Sé el primero: lo verán todos los que busquen aquí.</p>
                        <Link to={vacio.to} className="mt-5 inline-flex h-9 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold items-center">{vacio.cta}</Link>
                    </div>
                )}
                {!cargando && n > 0 && (
                    cat.tipo === 'tecnicos'
                        ? <div className="grid md:grid-cols-2 gap-2">{listaTecnicos!.map(p => <TarjetaTecnico key={p.id} p={p} />)}</div>
                        : <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {listaArtistas?.map(a => <TarjetaArtista key={a.id} a={a} />)}
                            {listaSalas?.map(s => <TarjetaSala key={s.uid} s={s} />)}
                            {listaAnuncios?.map(l => <TarjetaAnuncio key={l.id} l={l} />)}
                        </div>
                )}
            </div>

            {/* Otras categorías del mismo grupo */}
            <div className="mt-10 px-4 md:px-0">
                <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">{cat.grupo}</p>
                <div className="mt-2 flex gap-3 overflow-x-auto hide-scrollbar">
                    {CATEGORIAS.filter(c => c.grupo === cat.grupo && c.slug !== cat.slug).map(c => (
                        <Link key={c.slug} to={`/explorar/${c.slug}`} className="pulsable shrink-0 w-[76px] flex flex-col items-center gap-1">
                            <img src={iconoCategoria(c)} alt="" className="w-full aspect-[8/7] rounded-2xl object-cover" />
                            <span className="text-[12px] font-semibold text-foreground text-center leading-tight">{c.nombre}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Portal: el contenedor de la página lleva transform y descolocaría el fixed */}
            {cat.tipo === 'equipo' && createPortal(
                <Link to="/market/create" className="pulsable fixed md:hidden left-1/2 -translate-x-1/2 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 h-12 pl-4 pr-5 rounded-full bg-primary text-primary-foreground font-semibold shadow-e2 flex items-center gap-1.5">
                    <Plus className="h-5 w-5" /> Vender o alquilar
                </Link>,
                document.body,
            )}
        </div>
    );
}

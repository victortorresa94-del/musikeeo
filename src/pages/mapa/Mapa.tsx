import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../components/mapa/mapa.css';
import { LocateFixed, MapPin, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useMiPuntoMapa } from '../../hooks/useMiPuntoMapa';
import { codificar, prefijosParaVista, type Caja } from '../../lib/geohash';
import {
    CENTRO_POR_DEFECTO, agrupar, centroDeCiudad, contar, filtrar, horaCorta, posicionEnMapa,
    textoRecuento, visible, zonaDe, type FiltroPapel, type PuntoMapa,
} from '../../lib/mapa';
import { pedirUbicacion, type Posicion } from '../../lib/ubicacion';
import { mapaLocal, mapaService } from '../../services/mapaService';
import { burbujaDOM, grupoDOM, PUNTO_AHORA, yoDOM } from '../../components/mapa/estilo';
import { Burbuja } from '../../components/mapa/Burbuja';
import { HojaMusikeer } from '../../components/mapa/HojaMusikeer';
import { HojaAparecer } from '../../components/mapa/HojaAparecer';

// Musikeers cerca (/mapa): quién hay por tu zona —músicos, técnicos, salas y tiendas— para
// escribirles en vez de buscar «cables». Cada uno sale en su celda (~1 km), nunca en su calle.
// Leaflet va solo en esta página (trozo diferido) y no entra en el precache del service worker.

const ZOOM_MIN = 5, ZOOM_MAX = 16, ZOOM_CERCA = 14;
const FRESCO_MS = 60_000; // lo ya pedido de una zona vale un minuto

// CARTO pide una clave gratuita (sin ella salen las teselas con marca de agua): VITE_CARTO_KEY
const CLAVE_CARTO = import.meta.env.VITE_CARTO_KEY as string | undefined;
const teselas = (oscuro: boolean) =>
    `https://{s}.basemaps.cartocdn.com/${oscuro ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png${CLAVE_CARTO ? `?key=${encodeURIComponent(CLAVE_CARTO)}` : ''}`;
const ATRIBUCION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>';

const esOscuro = () => document.documentElement.classList.contains('dark');
const cajaDe = (b: L.LatLngBounds): Caja => ({ sur: b.getSouth(), oeste: b.getWest(), norte: b.getNorth(), este: b.getEast() });
const dentro = (c: Caja, p: { lat: number; lng: number }) => p.lat >= c.sur && p.lat <= c.norte && p.lng >= c.oeste && p.lng <= c.este;

const FILTROS: [FiltroPapel, string][] = [['todos', 'Todos'], ['musico', 'Músicos'], ['tecnico', 'Técnicos'], ['sala', 'Salas'], ['tienda', 'Tiendas']];

interface Vista { caja: Caja; zoom: number; centro: Posicion }

export default function Mapa() {
    const { userProfile } = useAuth();
    const mio = useMiPuntoMapa();
    const uid = mio.uid;
    const [params, setParams] = useSearchParams();

    const elMapa = useRef<HTMLDivElement>(null);
    const mapaRef = useRef<L.Map | null>(null);
    const capaRef = useRef<L.LayerGroup | null>(null);
    const movido = useRef(false);           // si la persona ya movió el mapa, no la llevamos a su sitio
    const pedido = useRef(new Map<string, number>()); // prefijo → cuándo se pidió
    const enVuelo = useRef(0);

    const [vista, setVista] = useState<Vista | null>(null);
    const [cache, setCache] = useState<Map<string, PuntoMapa>>(() => new Map());
    const [cargando, setCargando] = useState(false);
    const [fallo, setFallo] = useState('');
    const [papel, setPapel] = useState<FiltroPapel>('todos');
    const [soloAhora, setSoloAhora] = useState(false);
    const [elegidos, setElegidos] = useState<string[]>([]);
    const [hojaAparecer, setHojaAparecer] = useState(false);
    // «Elegir en el mapa» desde los ajustes llega como /mapa?elegir=zona
    const [eligiendo, setEligiendo] = useState(() => params.get('elegir') === 'zona');
    const [mayorPick, setMayorPick] = useState(() => !!uid && mapaLocal.mayorDeEdad(uid));
    const [yo, setYo] = useState<Posicion | null>(null); // solo en esta pantalla, nunca se envía
    const [reloj, setReloj] = useState(() => Date.now());

    // ─── Pedir lo que se ve (cada vez que el mapa se para) ───────────────────
    const pedirLoQueSeVe = useCallback((caja: Caja) => {
        const ahora = Date.now();
        const fresco = (p: string) => [...pedido.current].some(([k, t]) => p.startsWith(k) && ahora - t < FRESCO_MS);
        const faltan = prefijosParaVista(caja, 8).filter(p => !fresco(p));
        if (!faltan.length) return;
        faltan.forEach(p => pedido.current.set(p, ahora)); // que dos movimientos seguidos no pidan lo mismo
        enVuelo.current++;
        setCargando(true);
        Promise.all(faltan.map(p => mapaService.enZona(p))).then(listas => {
            setCache(prev => {
                const m = new Map(prev);
                // Quien ya no está en esas zonas (se quitó o se movió) sale de la caché
                for (const [k, p] of m) if (faltan.some(f => p.geohash.startsWith(f))) m.delete(k);
                for (const lista of listas) for (const p of lista) m.set(p.uid, p);
                return m;
            });
            setFallo('');
        }).catch(() => {
            faltan.forEach(p => pedido.current.delete(p)); // se vuelve a intentar al mover
            setFallo('No se ha podido cargar quién hay por aquí. Revisa la conexión.');
        }).finally(() => {
            if (--enVuelo.current === 0) setCargando(false);
        });
    }, []);

    // ─── El mapa (una vez) ───────────────────────────────────────────────────
    useEffect(() => {
        const el = elMapa.current;
        if (!el) return;
        const inicio = centroDeCiudad(userProfile?.location) || CENTRO_POR_DEFECTO;
        const map = L.map(el, { zoomControl: false, minZoom: ZOOM_MIN, maxZoom: ZOOM_MAX, attributionControl: true })
            .setView([inicio.lat, inicio.lng], eligiendo ? ZOOM_CERCA : 13);
        map.attributionControl.setPrefix(false);
        const capaTeselas = L.tileLayer(teselas(esOscuro()), { subdomains: 'abcd', maxZoom: 20, attribution: ATRIBUCION }).addTo(map);
        capaRef.current = L.layerGroup().addTo(map);
        mapaRef.current = map;

        const alParar = () => {
            const c = map.getCenter(), caja = cajaDe(map.getBounds());
            setVista({ caja, zoom: map.getZoom(), centro: { lat: c.lat, lng: c.lng } });
            pedirLoQueSeVe(caja);
        };
        map.on('moveend', alParar);
        map.on('dragstart', () => { movido.current = true; });
        map.whenReady(alParar);

        // Tema claro u oscuro: las teselas cambian con él
        const tema = new MutationObserver(() => capaTeselas.setUrl(teselas(esOscuro())));
        tema.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        // El hueco cambia (chips, teclado, girar el móvil): Leaflet tiene que saberlo
        const tamano = new ResizeObserver(() => map.invalidateSize());
        tamano.observe(el);

        // Tu posición, si das permiso: solo para centrar el mapa en tu pantalla
        pedirUbicacion({ espera: 8000, vieja: 300000 }).then(p => {
            if (mapaRef.current !== map) return;
            setYo(p);
            if (!movido.current) map.setView([p.lat, p.lng], ZOOM_CERCA);
        }).catch(() => { /* sin permiso: la ciudad del perfil o Barcelona */ });

        return () => {
            tema.disconnect();
            tamano.disconnect();
            map.remove();
            mapaRef.current = null;
            capaRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Los «ahora» caducan mientras miras
    useEffect(() => {
        const t = setInterval(() => setReloj(Date.now()), 30_000);
        return () => clearInterval(t);
    }, []);

    // Lo mío manda (acabo de aparecer, moverme o quitarme)
    const todos = useMemo(() => {
        const m = new Map(cache);
        if (uid && !mio.cargando) {
            if (mio.punto) m.set(uid, mio.punto); else m.delete(uid);
        }
        return [...m.values()];
    }, [cache, mio.punto, mio.cargando, uid]);
    const porUid = useMemo(() => new Map(todos.map(p => [p.uid, p])), [todos]);

    // Recuento: los que caen en lo que se ve (con «Ahora mismo», solo esos)
    const enVista = useMemo(() => (vista ? todos.filter(p => visible(p, reloj) && (!soloAhora || p.ahora) && dentro(vista.caja, posicionEnMapa(p))) : []), [todos, vista, reloj, soloAhora]);
    const recuento = useMemo(() => contar(enVista), [enVista]);
    const mostrados = useMemo(() => filtrar(todos, papel, soloAhora, reloj), [todos, papel, soloAhora, reloj]);

    // ─── Pintar puntos y grupos ──────────────────────────────────────────────
    useEffect(() => {
        const map = mapaRef.current, capa = capaRef.current;
        if (!map || !capa || !vista) return;
        capa.clearLayers();
        const z = vista.zoom;
        const items = mostrados.map(p => {
            const ll = posicionEnMapa(p);
            const pt = map.project([ll.lat, ll.lng], z);
            return { id: p.uid, x: pt.x, y: pt.y, ll };
        });
        const porId = new Map(items.map(i => [i.id, i]));
        // Yo siempre suelto (no me pierdo dentro de un grupo); los demás, agrupados si se tocan
        const grupos = agrupar(items.filter(i => i.id !== uid), 46);
        if (uid && porId.has(uid)) grupos.push({ ...porId.get(uid)!, ids: [uid] });
        for (const g of grupos) {
            if (g.ids.length === 1) {
                const p = porUid.get(g.ids[0]), it = porId.get(g.ids[0]);
                if (!p || !it) continue;
                const icono = L.divIcon({ html: burbujaDOM(p, { yo: p.uid === uid, elegida: elegidos.length === 1 && elegidos[0] === p.uid }), className: 'mk-icono', iconSize: [44, 44], iconAnchor: [22, 22] });
                L.marker([it.ll.lat, it.ll.lng], { icon: icono, title: p.nombre, alt: p.nombre, riseOnHover: true, zIndexOffset: p.uid === uid ? 2000 : 0 })
                    .on('click', () => setElegidos([p.uid]))
                    .addTo(capa);
            } else {
                const lado = g.ids.length < 10 ? 44 : g.ids.length < 100 ? 48 : 56;
                const icono = L.divIcon({ html: grupoDOM(g.ids.length), className: 'mk-icono', iconSize: [lado, lado], iconAnchor: [lado / 2, lado / 2] });
                L.marker(map.unproject([g.x, g.y], z), { icon: icono, title: `${g.ids.length} musikeers juntos`, alt: `${g.ids.length} musikeers`, zIndexOffset: 1000 })
                    .on('click', () => {
                        const b = L.latLngBounds(g.ids.flatMap(id => {
                            const it = porId.get(id);
                            return it ? [[it.ll.lat, it.ll.lng] as [number, number]] : [];
                        }));
                        // Si acercando se separan, se acerca; si no (mismo sitio), la lista
                        if (Math.min(ZOOM_MAX, map.getBoundsZoom(b, false, L.point(140, 140))) > map.getZoom()) {
                            map.flyToBounds(b, { padding: [70, 70], maxZoom: ZOOM_MAX, duration: 0.45 });
                        } else setElegidos([...g.ids]);
                    })
                    .addTo(capa);
            }
        }
        if (yo) {
            L.marker([yo.lat, yo.lng], { icon: L.divIcon({ html: yoDOM(), className: 'mk-icono', iconSize: [16, 16], iconAnchor: [8, 8] }), interactive: false, keyboard: false, zIndexOffset: -500 })
                .addTo(capa);
        }
    }, [mostrados, porUid, vista, yo, uid, elegidos]);

    // ─── Acciones ────────────────────────────────────────────────────────────
    const centrarEnMi = async () => {
        try {
            const p = await pedirUbicacion({ vieja: 30000 });
            setYo(p);
            mapaRef.current?.flyTo([p.lat, p.lng], Math.max(ZOOM_CERCA, mapaRef.current.getZoom()), { duration: 0.6 });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'No hemos podido saber dónde estás.');
        }
    };

    const empezarAElegir = useCallback(() => {
        setElegidos([]);
        setEligiendo(true);
        setMayorPick(uid ? mapaLocal.mayorDeEdad(uid) : false);
        const map = mapaRef.current;
        if (map && map.getZoom() < 13) map.setZoom(ZOOM_CERCA);
    }, [uid]);

    // Ya en modo elegir: la dirección vuelve a /mapa (recargar no lo repite)
    useEffect(() => {
        if (!params.has('elegir')) return;
        const sin = new URLSearchParams(params);
        sin.delete('elegir');
        setParams(sin, { replace: true });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const confirmarZona = async () => {
        const map = mapaRef.current;
        if (!map || !uid) return;
        if (!mio.punto && !mayorPick) { toast.error('Para aparecer en el mapa tienes que tener 18 años o más.'); return; }
        mapaLocal.confirmarMayorDeEdad(uid);
        const c = map.getCenter();
        try {
            const p = await mio.aparecer({ modo: 'zona', geohash: codificar(c.lat, c.lng) });
            toast.success(`Sales en el mapa${p.zona ? `: ${p.zona}` : ''}`);
            setEligiendo(false);
        } catch {
            toast.error('No se ha podido guardar. Revisa la conexión e inténtalo otra vez.');
        }
    };

    const verme = useCallback((p: PuntoMapa | null) => {
        const map = mapaRef.current;
        if (!map || !p) return;
        const ll = posicionEnMapa(p);
        movido.current = true;
        map.flyTo([ll.lat, ll.lng], Math.max(ZOOM_CERCA, map.getZoom()), { duration: 0.6 });
    }, []);

    const yaMeVoy = async () => {
        try {
            const p = await mio.yaMeVoy();
            verme(p);
            toast.success(p ? `Vuelves a tu zona: ${p.zona}` : 'Ya no sales en el mapa');
        } catch { toast.error('No se ha podido guardar. Revisa la conexión.'); }
    };

    const personasHoja = useMemo(() => elegidos.map(id => porUid.get(id)).filter((p): p is PuntoMapa => !!p && visible(p, reloj)), [elegidos, porUid, reloj]);
    const cerrarHoja = useCallback(() => setElegidos([]), []);
    const cerrarAparecer = useCallback(() => setHojaAparecer(false), []);
    const zonaCentro = vista && eligiendo ? zonaDe(codificar(vista.centro.lat, vista.centro.lng), userProfile?.location) : '';
    const texto = textoRecuento(recuento, soloAhora);
    const [cabeza, ...resto] = texto.split(' · ');
    const mioAhora = !!mio.punto?.ahora && !!mio.punto.caduca;

    return (
        <div className="relative flex flex-col h-[calc(100dvh-env(safe-area-inset-top)-3.5rem-52px-env(safe-area-inset-bottom))] -mb-24 md:h-[calc(100dvh-3.5rem)] md:-mb-6">
            {/* Cabecera compacta: recuento y filtros */}
            <header className="shrink-0 z-10 px-4 pt-3 pb-2.5 bg-background border-b border-hairline">
                <h1 className="font-heading text-[22px] font-bold leading-tight text-foreground">Musikeers cerca</h1>
                <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground" aria-live="polite" data-testid="recuento" data-texto={texto}>
                    {cargando && !todos.length ? 'Buscando musikeers…' : <>
                        <b className="font-semibold text-foreground">{cabeza}</b>
                        {resto.map(x => <Fragment key={x}>{' '}<span className="whitespace-nowrap">· {x}</span></Fragment>)}
                    </>}
                </p>
                <div className="mt-2.5 -mx-4 px-4 flex gap-1.5 overflow-x-auto hide-scrollbar" role="toolbar" aria-label="Filtros del mapa">
                    {FILTROS.map(([k, t]) => (
                        <button key={k} onClick={() => setPapel(k)} aria-pressed={papel === k}
                            className={cn('pulsable shrink-0 h-9 px-3.5 rounded-full text-[14px] font-semibold', papel === k ? 'bg-foreground text-background' : 'bg-fill text-foreground')}>
                            {t}
                        </button>
                    ))}
                    <span className="shrink-0 w-px my-2 bg-hairline-strong" aria-hidden />
                    <button onClick={() => setSoloAhora(v => !v)} aria-pressed={soloAhora}
                        className={cn('pulsable shrink-0 h-9 pl-3 pr-3.5 rounded-full text-[14px] font-semibold flex items-center gap-1.5', soloAhora ? 'bg-foreground text-background' : 'bg-fill text-foreground')}>
                        <span className={cn('h-2 w-2 rounded-full', PUNTO_AHORA)} /> Ahora mismo
                    </button>
                </div>
            </header>

            {/* Ojo: la clase va aquí y no en el div del mapa (React pisaría las de Leaflet) */}
            <div className={cn('relative flex-1 min-h-0', eligiendo && 'mapa-eligiendo')}>
                <div ref={elMapa} className="mapa-musikeeo absolute inset-0 z-0" aria-label="Mapa de musikeers cerca" role="region" />

                {/* Acercar, alejar (en el ordenador) y centrar en mí */}
                <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                    <button onClick={() => mapaRef.current?.zoomIn()} aria-label="Acercar" className="pulsable hidden md:flex h-9 w-9 rounded-full bg-sheet border border-hairline shadow-e2 items-center justify-center text-foreground"><Plus className="h-5 w-5" /></button>
                    <button onClick={() => mapaRef.current?.zoomOut()} aria-label="Alejar" className="pulsable hidden md:flex h-9 w-9 rounded-full bg-sheet border border-hairline shadow-e2 items-center justify-center text-foreground"><Minus className="h-5 w-5" /></button>
                    <button onClick={centrarEnMi} aria-label="Centrar en mí" className="pulsable h-9 w-9 rounded-full bg-sheet border border-hairline shadow-e2 flex items-center justify-center text-foreground"><LocateFixed className="h-[18px] w-[18px]" /></button>
                </div>

                {fallo && (
                    <p role="alert" className="absolute top-3 left-3 right-14 z-10 rounded-[14px] bg-sheet border border-hairline shadow-e2 px-3.5 py-2.5 text-[13px] text-foreground">{fallo}</p>
                )}
                {!fallo && !cargando && !eligiendo && vista && recuento.total === 0 && (
                    <p className="absolute top-3 left-3 right-14 z-10 rounded-[14px] bg-sheet border border-hairline shadow-e2 px-3.5 py-2.5 text-[13px] text-foreground" data-testid="vacio">
                        {soloAhora ? 'Nadie ha dicho «Estoy aquí ahora» por esta zona.' : 'Aún no hay nadie por aquí. Aleja el mapa o sé el primero en aparecer.'}
                    </p>
                )}

                {/* Elegir mi zona moviendo el mapa */}
                {eligiendo && (
                    <>
                        {/* La chincheta: su punta es el centro del mapa (la celda que se guardará) */}
                        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-[calc(100%+7px)]" aria-hidden>
                            <span className="h-9 w-9 rotate-45 rounded-full rounded-br-none bg-foreground border-[3px] border-background shadow-e2 flex items-center justify-center">
                                <span className="h-2.5 w-2.5 rounded-full bg-background" />
                            </span>
                        </div>
                        <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground border border-background" aria-hidden />
                        <div className="absolute inset-x-3 bottom-6 z-10 mx-auto max-w-md rounded-[20px] bg-sheet border border-hairline shadow-e3 p-4" data-testid="elegir-zona">
                            <p className="text-[16px] font-bold text-foreground">Mueve el mapa hasta tu barrio</p>
                            <p className="mt-0.5 text-[14px] text-muted-foreground">Saldrás en <b className="font-semibold text-foreground">{zonaCentro || 'esta zona'}</b>, en una zona aproximada (unos 500 m), nunca en tu calle.</p>
                            {!mio.punto && (
                                <label className="mt-3 flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" checked={mayorPick} onChange={e => setMayorPick(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-foreground" />
                                    <span className="text-[14px] text-foreground"><b className="font-semibold">Tengo 18 años o más.</b> <span className="text-muted-foreground">Solo para mayores de 18 años.</span></span>
                                </label>
                            )}
                            <div className="mt-3 flex gap-2">
                                <button onClick={() => setEligiendo(false)} className="pulsable h-[52px] px-5 rounded-[14px] bg-fill-strong text-foreground text-[16px] font-semibold">Cancelar</button>
                                <button onClick={confirmarZona} disabled={mio.guardando || (!mio.punto && !mayorPick)}
                                    className={cn('pulsable flex-1 h-[52px] rounded-[14px] text-[16px] font-bold disabled:opacity-40', mio.punto ? 'bg-foreground text-background' : 'bg-primary text-primary-foreground')}>
                                    {mio.guardando ? 'Guardando…' : mio.punto ? 'Cambiar a esta zona' : 'Aparecer en esta zona'}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Aparecer en el mapa (apagado) o cómo salgo (encendido) */}
                {!eligiendo && !mio.cargando && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-7 z-10 flex justify-center px-4">
                        {!mio.punto ? (
                            <button onClick={() => setHojaAparecer(true)} data-testid="aparecer"
                                className="pointer-events-auto pulsable h-[52px] px-6 rounded-[14px] bg-primary text-primary-foreground text-[16px] font-bold shadow-e2 flex items-center gap-2">
                                <MapPin className="h-5 w-5" /> Aparecer en el mapa
                            </button>
                        ) : (
                            <div className="pointer-events-auto w-full max-w-sm flex items-center gap-3 pl-2.5 pr-2 py-2 rounded-[18px] bg-sheet border border-hairline shadow-e2" data-testid="mi-estado">
                                <Burbuja key={mio.punto.foto} p={mio.punto} tamano="sm" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[14px] font-bold text-foreground truncate">{mioAhora ? 'Estás aquí ahora' : `Sales en ${mio.punto.zona || 'tu zona'}`}</p>
                                    <p className="text-[12px] text-muted-foreground truncate">{mioAhora && mio.punto.caduca ? `Hasta las ${horaCorta(mio.punto.caduca)}` : 'Zona aproximada'}</p>
                                </div>
                                {mioAhora ? (
                                    <button onClick={yaMeVoy} disabled={mio.guardando} className="pulsable h-9 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold disabled:opacity-40">Ya me voy</button>
                                ) : (
                                    <button onClick={() => setHojaAparecer(true)} className="pulsable h-9 px-4 rounded-full bg-fill-strong text-foreground text-[14px] font-semibold">Cambiar</button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <HojaMusikeer personas={personasHoja} uidPropio={uid} onCerrar={cerrarHoja} onElegir={id => setElegidos([id])}
                onGestionarMio={() => { setElegidos([]); setHojaAparecer(true); }} />
            <HojaAparecer abierta={hojaAparecer} onCerrar={cerrarAparecer} mio={mio} onElegirEnMapa={empezarAElegir} onHecho={verme} />
        </div>
    );
}

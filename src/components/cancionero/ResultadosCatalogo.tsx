import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ExternalLink, Loader2, Plus, WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    buscarCanciones, claveTitulo, duracionTexto, enlaceLetra, enlacesAcordes, esCancelada, mismaCancion, motivoDe, tituloLimpio,
    type CancionCatalogo, type MotivoFallo,
} from '../../lib/buscarCanciones';
import { useCancionero } from '../../hooks/useCancionero';
import { muestraSonando, pararMuestra } from '../../hooks/useMuestra';
import { PortadaMuestra } from './Portada';
import type { Cancion } from '../../types/cancionero';

// ¿Hay red? (en el bolo, muchas veces no)
const suscribirRed = (f: () => void) => {
    window.addEventListener('online', f);
    window.addEventListener('offline', f);
    return () => { window.removeEventListener('online', f); window.removeEventListener('offline', f); };
};
const hayRed = () => navigator.onLine;

interface Busqueda { termino: string; resultados: CancionCatalogo[]; fallo?: MotivoFallo; otraVez?: boolean }

const ESPERA_OTRA_VEZ = 8000;   // si Apple pide una pausa, se vuelve a probar sola una vez

// Debajo de tus canciones, las del catálogo de Apple: portada, título, artista y duración, la
// muestra de 30 s, «Añadir» y dónde buscar los acordes. Sin cobertura se queda en tus canciones
export function ResultadosCatalogo({ q }: { q: string }) {
    const navigate = useNavigate();
    const { canciones, nuevaCancion, guardar } = useCancionero();
    const termino = q.trim().replace(/\s+/g, ' ');
    const enLinea = useSyncExternalStore(suscribirRed, hayRed);
    const [busqueda, setBusqueda] = useState<Busqueda | null>(null);
    const [buscando, setBuscando] = useState(false);
    const [reintento, setReintento] = useState(0);

    // Se espera a que pare de escribir (300 ms) y lo que ya no vale se cancela. Si Apple pide
    // una pausa, se vuelve a probar sola una vez al rato
    useEffect(() => {
        if (termino.length < 2 || !enLinea) return;
        const control = new AbortController();
        let reloj: ReturnType<typeof setTimeout>;
        const buscar = (intento: number) => {
            setBuscando(true);
            buscarCanciones(termino, { signal: control.signal })
                .then(resultados => { if (!control.signal.aborted) setBusqueda({ termino, resultados }); })
                .catch(e => {
                    if (control.signal.aborted || esCancelada(e)) return;
                    const fallo = motivoDe(e);
                    const otraVez = fallo === 'ocupado' && intento === 0;
                    setBusqueda({ termino, resultados: [], fallo, otraVez });
                    if (otraVez) reloj = setTimeout(() => buscar(1), ESPERA_OTRA_VEZ);
                })
                .finally(() => { if (!control.signal.aborted) setBuscando(false); });
        };
        reloj = setTimeout(() => buscar(0), 300);
        return () => { clearTimeout(reloj); control.abort(); };
    }, [termino, enLinea, reintento]);

    // ¿Ya está en tu cancionero? La misma (título y artista) o una ficha del setlist con ese
    // título y sin artista, que se completa. Se calcula una vez por búsqueda, no a cada letra
    const porTitulo = useMemo(() => {
        const m = new Map<string, Cancion[]>();
        for (const x of canciones) {
            const k = claveTitulo(x.titulo);
            if (k) m.set(k, [...(m.get(k) ?? []), x]);
        }
        return m;
    }, [canciones]);
    const enTuCancionero = useMemo(() => new Map((busqueda?.resultados ?? []).map(c => {
        const mismas = porTitulo.get(claveTitulo(c.titulo)) ?? [];
        const igual = mismas.find(x => mismaCancion(x, c));
        return [c.id, igual ? { cancion: igual, ficha: false } : mismas.filter(x => !x.artista.trim()).map(x => ({ cancion: x, ficha: true }))[0]];
    })), [busqueda, porTitulo]);

    // La muestra se calla al irse (o al borrar la búsqueda), salvo la de la canción que se abre
    const seguirSonando = useRef<string | null>(null);
    useEffect(() => () => { if (muestraSonando() !== seguirSonando.current) pararMuestra(); }, []);
    // Y si la que suena ya no está en la lista (otra búsqueda), también: no se podría parar
    useEffect(() => {
        const url = muestraSonando();
        if (url && busqueda && !busqueda.resultados.some(c => c.muestra === url)) pararMuestra();
    }, [busqueda]);

    // Entra sin letra: al abrirla, «Falta la letra» dice dónde buscarla y dónde pegarla.
    // Si ya la tenías, se abre esa (y se le pone la portada si le faltaba); una ficha sin
    // artista se queda con el de la grabación
    const anadir = (c: CancionCatalogo) => {
        const ya = enTuCancionero.get(c.id);
        const grabacion = { portada: c.portada || undefined, duracion: c.duracion, muestra: c.muestra };
        let destino: Cancion;
        if (!ya) {
            destino = guardar({ ...nuevaCancion({ titulo: tituloLimpio(c.titulo), artista: c.artista, texto: '' }), ...grabacion });
        } else if (ya.ficha) {
            const x = ya.cancion;
            destino = guardar({ ...x, artista: c.artista, portada: x.portada ?? grabacion.portada, duracion: x.duracion ?? c.duracion, muestra: x.muestra ?? c.muestra });
            toast(`«${x.titulo}» ya estaba en tu cancionero: ahora con artista y portada.`);
        } else {
            const x = ya.cancion;
            destino = x.portada ? x : guardar({ ...x, ...grabacion, duracion: x.duracion ?? c.duracion, muestra: x.muestra ?? c.muestra });
        }
        seguirSonando.current = destino.muestra ?? null;
        navigate(`/cancionero/${destino.id}`);
    };

    if (termino.length < 2) return null;

    const cabecera = (
        <div className="mt-6 mb-1.5 px-1 flex items-center gap-2">
            <p className="text-[13px] font-semibold text-muted-foreground">En el catálogo</p>
            {buscando && enLinea && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-label="Buscando" />}
        </div>
    );

    if (!enLinea) {
        return (
            <>
                {cabecera}
                <p className="px-1 flex items-center gap-2 text-[14px] text-muted-foreground">
                    <WifiOff className="h-4 w-4 shrink-0" /> Sin cobertura: aquí salen solo tus canciones.
                </p>
            </>
        );
    }

    // Mientras llega lo nuevo se ve lo anterior, más apagado (para que la lista no salte a cada letra)
    if (!busqueda) {
        return (
            <>
                {cabecera}
                <div className="rounded-2xl bg-fill divide-y divide-hairline overflow-hidden" aria-hidden>
                    {[0, 1, 2].map(i => (
                        <div key={i} className="flex items-center gap-3 px-4 min-h-[64px]">
                            <span className="h-11 w-11 rounded-[10px] bg-fill-strong animate-pulse" />
                            <span className="flex-1 space-y-2">
                                <span className="block h-3.5 w-2/3 rounded-full bg-fill-strong animate-pulse" />
                                <span className="block h-3 w-1/3 rounded-full bg-fill-strong animate-pulse" />
                            </span>
                        </div>
                    ))}
                </div>
            </>
        );
    }

    if (busqueda.fallo) {
        return (
            <>
                {cabecera}
                <div className="rounded-2xl bg-fill px-4 py-3 flex items-center gap-3">
                    <p className="flex-1 text-[14px] text-muted-foreground">
                        {busqueda.fallo === 'ocupado'
                            ? (busqueda.otraVez ? 'El catálogo de Apple pide una pausa. Probando otra vez en unos segundos…' : 'El catálogo de Apple pide una pausa. Prueba en un minuto.')
                            : busqueda.fallo === 'sin-conexion' ? 'No llega la conexión: aquí salen solo tus canciones.'
                                : 'No se ha podido buscar en el catálogo.'}
                    </p>
                    <button onClick={() => setReintento(n => n + 1)} className="pulsable h-9 px-3.5 shrink-0 rounded-full bg-foreground text-background text-[14px] font-semibold">
                        Reintentar
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            {cabecera}
            {busqueda.resultados.length === 0 ? (
                <p className="px-1 text-[14px] text-muted-foreground">Nada en el catálogo con «{busqueda.termino}».</p>
            ) : (
                <>
                    <div className={cn('rounded-2xl bg-fill divide-y divide-hairline overflow-hidden transition-opacity', busqueda.termino !== termino && 'opacity-60')}>
                        {busqueda.resultados.map(c => (
                            <FilaCatalogo key={c.id} cancion={c} ya={enTuCancionero.get(c.id)?.ficha === false} onAnadir={() => anadir(c)} />
                        ))}
                    </div>
                    <p className="mt-2 px-1 text-[13px] text-muted-foreground">
                        Toca una canción para ver dónde buscar sus acordes. Portadas y muestras de Apple Music.
                    </p>
                </>
            )}
        </>
    );
}

function FilaCatalogo({ cancion, ya, onAnadir }: { cancion: CancionCatalogo; ya: boolean; onAnadir: () => void }) {
    const [abierta, setAbierta] = useState(false);
    // Se busca sin «(Remastered 2011)» ni «(feat. …)», que en las webs de acordes no salen
    const titulo = tituloLimpio(cancion.titulo);
    const enlaces = [...enlacesAcordes(titulo, cancion.artista), enlaceLetra(titulo, cancion.artista)];
    return (
        <div>
            <div className="flex items-center gap-3 pl-4 pr-3 min-h-[64px] py-2.5">
                <PortadaMuestra src={cancion.portada} titulo={cancion.titulo} muestra={cancion.muestra} />
                <button type="button" onClick={() => setAbierta(a => !a)} aria-expanded={abierta}
                    aria-label={`${cancion.titulo}, ${cancion.artista}: dónde buscar los acordes`}
                    className="flex-1 min-w-0 self-stretch flex flex-col justify-center text-left active:opacity-60">
                    <span className="block w-full truncate text-[16px] font-semibold text-foreground">{cancion.titulo}</span>
                    <span className="w-full flex items-center text-[14px] text-muted-foreground">
                        <span className="truncate">{cancion.artista}</span>
                        {!!cancion.duracion && <span className="shrink-0 whitespace-pre tabular-nums">{` · ${duracionTexto(cancion.duracion)}`}</span>}
                        <ChevronDown className={cn('ml-1 h-3.5 w-3.5 shrink-0 transition-transform', abierta && 'rotate-180')} />
                    </span>
                </button>
                <button type="button" onClick={onAnadir} aria-label={ya ? `Abrir ${cancion.titulo}, ya está en tu cancionero` : `Añadir ${cancion.titulo} al cancionero`}
                    className="pulsable h-9 pl-2.5 pr-3.5 shrink-0 rounded-full bg-fill-strong text-[14px] font-semibold text-foreground flex items-center gap-1">
                    {ya ? <><Check className="h-4 w-4" /> Abrir</> : <><Plus className="h-4 w-4" /> Añadir</>}
                </button>
            </div>
            <AnimatePresence initial={false}>
                {abierta && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }} className="overflow-hidden">
                        <div className="pl-[72px] pr-3 pb-3">
                            <p className="text-[13px] text-muted-foreground">Buscar los acordes y la letra</p>
                            <div className="mt-1.5 flex flex-wrap gap-2">
                                {enlaces.map(e => (
                                    <a key={e.nombre} href={e.url} target="_blank" rel="noopener noreferrer"
                                        className="pulsable h-9 px-3.5 rounded-full bg-sheet shadow-e1 text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                                        {e.nombre} <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

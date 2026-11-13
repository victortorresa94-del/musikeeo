import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Copy, List, Minus, Pencil, Plus, RefreshCw } from 'lucide-react';
import { escucharCompartido } from '../../services/compartidosService';
import { cn } from '../../lib/utils';
import { codificar, descodificar, type Compartido, type TemaCompartido } from '../../lib/compartir';
import { detectarTono, leerCancion, usaBemoles, type OpcionesNombre } from '../../lib/acordes';
import { textoDuracion } from '../../lib/biblioteca';
import { notasVacias } from '../../lib/notas';
import { HojaCancion } from '../../components/cancionero/HojaCancion';
import { NotasRicas } from '../../components/notas/NotasRicas';
import { Pildora } from '../../components/cancionero/Baldosas';
import { ICONO, estiloBloque, sinLoDeLasPildoras } from '../../components/cancionero/estilo';
import { datosTemaConTono } from '../../components/cancionero/datosTema';
import { SelectorVista, type Vista } from '../../components/cancionero/SelectorVista';
import { HojaSet, SuenaFormas } from '../../components/cancionero/VistaCifrado';
import { useFormas } from '../../hooks/useFormas';
import { usePantallaEncendida } from '../../hooks/usePantallaEncendida';

// La página del músico: el repertorio que le ha pasado su compañero, sin cuenta y sin la app
// alrededor. Oscura, letra grande y de una canción a la siguiente deslizando (o con el pedal).
// El set viene en el enlace (tras «#») y, con id (/grupo/{id}), lo último de la nube
// (compartidos/{id}), en directo: siempre la última versión de quien lo comparte. Se guarda una
// copia en el móvil, así que una vez abierta funciona sin cobertura.
// Cada músico puede hacerse SU versión de una canción (sus apuntes, su forma de verla): vive en
// su móvil, no toca el original y avisa si el original cambia después.

const CLAVE_TAMANO = 'musikeeo-grupo-tamano';
const DURACION_MEDIA = 210;

function leerTamano(conLetra: boolean) {
    try {
        const t = Number(localStorage.getItem(`${CLAVE_TAMANO}${conLetra ? '-letra' : ''}`));
        if (t >= 12 && t <= 48) return t;
    } catch { /* sin almacenamiento */ }
    return conLetra ? 18 : 20;
}

// La copia del móvil del último set visto de este enlace (para abrirlo sin cobertura)
const CLAVE_COPIA = 'musikeeo-grupo-copia:';
function leerCopia(id: string | undefined): Compartido | null {
    if (!id) return null;
    try { const t = localStorage.getItem(CLAVE_COPIA + id); return t ? descodificar(t) : null; } catch { return null; }
}
const masNuevo = (a: Compartido | null, b: Compartido | null) => (!a ? b : !b ? a : (b.u ?? '') > (a.u ?? '') ? b : a);

export default function Grupo() {
    const { id } = useParams<{ id?: string }>();
    const [datos, setDatos] = useState<Compartido | null>(() => masNuevo(descodificar(window.location.hash), leerCopia(id)));
    const [abierta, setAbierta] = useState<number | null>(null);
    const [aviso, setAviso] = useState<string | null>(null);
    // El enlace corto (solo el id) no trae nada: se espera a la nube antes de decir que no se abre
    const [esperando, setEsperando] = useState(() => !!id);
    const datosRef = useRef(datos);
    useEffect(() => { datosRef.current = datos; }, [datos]);

    useEffect(() => {
        const f = () => { setDatos(masNuevo(descodificar(window.location.hash), leerCopia(id))); setAbierta(null); };
        window.addEventListener('hashchange', f);
        return () => window.removeEventListener('hashchange', f);
    }, [id]);

    // Lo último de la nube, en directo. Si cambia con la canción abierta, se sigue en la misma
    useEffect(() => {
        if (!id) return;
        return escucharCompartido(id, p => {
            setEsperando(false);
            const antes = datosRef.current;
            if (antes && (antes.u ?? '') >= (p.u ?? '') && antes.u) return;
            try { localStorage.setItem(CLAVE_COPIA + id, codificar(p)); } catch { /* sin almacenamiento */ }
            setDatos(p);
            if (antes && antes.u !== p.u) {
                setAbierta(a => {
                    if (a === null) return a;
                    const titulo = antes.c[a]?.t;
                    const j = p.c.findIndex(t => t.t === titulo);
                    return j >= 0 ? j : Math.min(a, Math.max(0, p.c.length - 1));
                });
                setAviso('Actualizado con los últimos cambios');
                setTimeout(() => setAviso(null), 4000);
            }
        }, () => setEsperando(false));
    }, [id]);

    // Sin respuesta de la nube en 12 s (sin cobertura), se deja de esperar
    useEffect(() => {
        if (!esperando) return;
        const t = setTimeout(() => setEsperando(false), 12000);
        return () => clearTimeout(t);
    }, [esperando]);

    // Siempre oscura (en el escenario no deslumbra); al salir, vuelve la de la persona
    useEffect(() => {
        const root = document.documentElement;
        const antes = root.classList.contains('dark');
        root.classList.add('dark');
        const meta = document.querySelector('meta[name="theme-color"]');
        const color = meta?.getAttribute('content');
        meta?.setAttribute('content', '#0A0A0A');
        document.title = datos ? `${datos.n} · Musikeeo` : 'Repertorio · Musikeeo';
        // Que los buscadores no lo indexen: es un enlace privado para un grupo
        const robots = document.createElement('meta');
        robots.name = 'robots';
        robots.content = 'noindex, nofollow';
        document.head.appendChild(robots);
        return () => {
            root.classList.toggle('dark', antes);
            robots.remove();
            if (color) meta?.setAttribute('content', color);
        };
    }, [datos]);

    if (!datos && esperando) {
        return (
            <main className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center px-6 text-center" aria-busy="true">
                <img src={ICONO.repertorios} alt="" aria-hidden className="h-24 w-24 object-contain animate-pulse" />
                <p className="mt-4 text-[15px] text-muted-foreground">Abriendo…</p>
            </main>
        );
    }
    if (!datos) {
        return (
            <main className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center px-6 text-center">
                <img src={ICONO.repertorios} alt="" aria-hidden className="h-24 w-24 object-contain" />
                <h1 className="mt-4 font-heading text-[24px] font-bold">Este enlace no se puede abrir</h1>
                <p className="mt-2 max-w-sm text-[15px] text-muted-foreground">Puede que se haya cortado al copiarlo. Pide a quien te lo mandó que te lo vuelva a enviar.</p>
            </main>
        );
    }
    const setKey = id ?? `n:${datos.n}`;
    return (
        <>
            {abierta === null
                ? <ListaSet datos={datos} setKey={setKey} onAbrir={setAbierta} />
                : <Escenario key={datos.u ?? 'h'} datos={datos} setKey={setKey} inicio={abierta} onLista={() => setAbierta(null)} />}
            {aviso && (
                <div role="status" className="fixed left-1/2 -translate-x-1/2 top-[calc(env(safe-area-inset-top)+60px)] z-30 h-9 px-3.5 rounded-full bg-sheet border border-hairline shadow-e3 text-[13.5px] font-semibold flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4" /> {aviso}
                </div>
            )}
        </>
    );
}

// Un set dentro de otra página (el bolo): su lista y su escenario, con «‹ Volver» arriba
export function VistaSet({ datos, setKey, onVolver, volver }: { datos: Compartido; setKey: string; onVolver: () => void; volver: string }) {
    const [abierta, setAbierta] = useState<number | null>(null);
    useEffect(() => { window.scrollTo(0, 0); }, [abierta]);
    return abierta === null
        ? <ListaSet datos={datos} setKey={setKey} onAbrir={setAbierta} onVolver={onVolver} volver={volver} />
        : <Escenario key={datos.u ?? 'h'} datos={datos} setKey={setKey} inicio={abierta} onLista={() => setAbierta(null)} />;
}

// ---- La versión de cada músico: en su móvil, por enlace y por canción ----
interface Mia { x: string; base: string; usar: boolean; cuando: string }
const claveTema = (t: TemaCompartido) => `${t.t}|${t.v ?? ''}`;
function leerMias(setKey: string): Record<string, Mia> {
    try { const t = localStorage.getItem(`musikeeo-grupo-mias:${setKey}`); const o = t ? JSON.parse(t) : {}; return o && typeof o === 'object' ? o : {}; } catch { return {}; }
}
function useMias(setKey: string) {
    const [mias, setMias] = useState<Record<string, Mia>>(() => leerMias(setKey));
    useEffect(() => {
        // Otra pestaña (lista y escenario a la vez) o vuelta a la página
        const f = (e: StorageEvent) => { if (e.key === `musikeeo-grupo-mias:${setKey}`) setMias(leerMias(setKey)); };
        window.addEventListener('storage', f);
        return () => window.removeEventListener('storage', f);
    }, [setKey]);
    const poner = useCallback((t: TemaCompartido, mia: Mia | null) => {
        setMias(m => {
            const n = { ...m };
            if (mia) n[claveTema(t)] = mia; else delete n[claveTema(t)];
            try { localStorage.setItem(`musikeeo-grupo-mias:${setKey}`, JSON.stringify(n)); } catch { /* */ }
            return n;
        });
    }, [setKey]);
    // Lo que se ve de cada tema: el original o la suya, si la tiene puesta
    const ver = useCallback((t: TemaCompartido) => { const m = mias[claveTema(t)]; return m?.usar ? { ...t, x: m.x } : t; }, [mias]);
    return { mias, poner, ver, de: (t: TemaCompartido) => mias[claveTema(t)] };
}

function ListaSet({ datos, setKey, onAbrir, onVolver, volver }: { datos: Compartido; setKey: string; onAbrir: (i: number) => void; onVolver?: () => void; volver?: string }) {
    const { ver, de } = useMias(setKey);
    // Cifrado: el set entero seguido (con letra, solo si viene); se recuerda en el móvil
    const [vista, setVista] = useState<Vista>(() => { try { return localStorage.getItem('musikeeo-grupo-vista') === 'cifrado' ? 'cifrado' : 'lista'; } catch { return 'lista'; } });
    const [tamano] = useState(() => leerTamano(false));
    const [formas, setFormas] = useFormas();
    const cambiarVista = (v: Vista) => { setVista(v); try { localStorage.setItem('musikeeo-grupo-vista', v); } catch { /* */ } };
    const conocida = datos.c.reduce((s, t) => s + (t.d ?? 0), 0);
    const faltan = datos.c.filter(t => !t.d).length;
    const total = conocida + faltan * DURACION_MEDIA;
    const fecha = datos.f ? new Date(`${datos.f}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
    return (
        <main className="min-h-[100dvh] bg-background text-foreground">
            <div className="max-w-2xl mx-auto px-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+32px)]">
                {onVolver && (
                    <button onClick={onVolver} className="-ml-1 mb-3 h-9 pr-3 flex items-center gap-0.5 text-[15px] font-semibold text-muted-foreground active:opacity-60">
                        <ChevronLeft className="h-5 w-5" /> {volver}
                    </button>
                )}
                <p className="text-[13px] font-semibold text-muted-foreground">Repertorio · {datos.l ? 'con letra' : 'cifrado'}</p>
                <h1 className="mt-1 font-heading text-[28px] font-bold leading-tight">{datos.n}</h1>
                <p className="mt-1 text-[15px] text-muted-foreground first-letter:uppercase">
                    {[fecha, `${datos.c.length} ${datos.c.length === 1 ? 'tema' : 'temas'}`, datos.c.length ? `${faltan ? '≈ ' : ''}${textoDuracion(total)}` : ''].filter(Boolean).join(' · ')}
                </p>

                <button onClick={() => onAbrir(0)} disabled={!datos.c.length}
                    className="pulsable mt-5 w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] disabled:opacity-40">
                    Empezar
                </button>

                {!notasVacias(datos.h) && (
                    <section className="mt-5 rounded-2xl bg-fill px-4 py-3" aria-label="Hoja del bolo">
                        <p className="mb-1 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Hoja del bolo</p>
                        <NotasRicas json={datos.h} className="text-[16px]" />
                    </section>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                    <SelectorVista valor={vista} onCambio={cambiarVista} opciones={['lista', 'cifrado']} />
                    {vista === 'cifrado' && datos.c.some(t => t.m) && <SuenaFormas formas={formas} onCambio={setFormas} />}
                </div>
                {vista === 'cifrado' && <HojaSet className="mt-2" temas={datos.c.map(ver)} tamano={Math.min(tamano, 22)} formas={formas} onAbrir={onAbrir} />}
                <ol className={cn('mt-3', vista === 'cifrado' && 'hidden')}>
                    {datos.c.map((t, i) => {
                        const nuevoBloque = t.g && (i === 0 || t.g !== datos.c[i - 1].g) ? t.g : null;
                        const estilo = nuevoBloque ? estiloBloque(nuevoBloque) : null;
                        return (
                            <li key={i}>
                                {nuevoBloque && estilo && (
                                    <div className={cn('relative mt-4 mb-1 h-[60px] rounded-[18px] overflow-hidden flex items-center pl-4 pr-[90px]', estilo.pastel.fondo)}>
                                        <span className="font-heading text-[18px] font-bold leading-tight text-foreground line-clamp-2">{nuevoBloque}</span>
                                        <img src={estilo.icono} alt="" aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-[56px] w-[76px] object-contain" />
                                    </div>
                                )}
                                <button onClick={() => onAbrir(i)} className="w-full text-left py-3 border-b border-hairline flex items-start gap-3 active:opacity-60">
                                    <span className="w-6 shrink-0 pt-0.5 text-[14px] font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-[17px] font-semibold leading-snug">{t.t}</span>
                                        {(t.v || t.a) && <span className="block truncate text-[13px] text-muted-foreground">{[t.v && `Versión ${t.v}`, t.a].filter(Boolean).join(' · ')}</span>}
                                        <span className="mt-1.5 flex flex-wrap gap-1">
                                            {de(t)?.usar && <span className="h-6 px-2 rounded-full text-[12px] font-semibold flex items-center bg-pastel-lavanda text-pastel-lavanda-ink">La mía{de(t)!.base !== t.x ? ' · el original cambió' : ''}</span>}
                                            {datosTemaConTono(t).map(p => <span key={p.texto} className={cn('h-6 px-2 rounded-full text-[12px] font-semibold flex items-center', p.clase)}>{p.texto}</span>)}
                                        </span>
                                    </span>
                                    <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                                </button>
                            </li>
                        );
                    })}
                </ol>
                <p className="mt-8 text-center text-[13px] text-muted-foreground">
                    Hecho con <a href="/cancionero" className="font-semibold text-foreground">el Cancionero de Musikeeo</a>. No hace falta cuenta.
                </p>
            </div>
        </main>
    );
}

function Escenario({ datos, setKey, inicio, onLista }: { datos: Compartido; setKey: string; inicio: number; onLista: () => void }) {
    const conLetra = !!datos.l;
    const { ver, de, poner } = useMias(setKey);
    const [editando, setEditando] = useState<TemaCompartido | null>(null);
    const [tamano, setTamano] = useState(() => leerTamano(conLetra));
    const [soloAcordes, setSoloAcordes] = useState(false);
    const [formas, setFormas] = useFormas();
    const conCejilla = datos.c.some(t => t.m);
    const [tonos, setTonos] = useState<number[]>(() => datos.c.map(() => 0));
    const [actual, setActual] = useState(inicio);
    const carruselRef = useRef<HTMLDivElement>(null);
    const actualRef = useRef(inicio);
    useEffect(() => { actualRef.current = actual; }, [actual]);
    usePantallaEncendida();

    const cambiarTamano = (d: number) => setTamano(t => {
        const n = Math.max(12, Math.min(48, t + d));
        try { localStorage.setItem(`${CLAVE_TAMANO}${conLetra ? '-letra' : ''}`, String(n)); } catch { /* */ }
        return n;
    });

    useEffect(() => {
        const el = carruselRef.current;
        if (el) el.scrollLeft = inicio * el.clientWidth;
    }, [inicio]);
    useEffect(() => {
        const f = () => { const el = carruselRef.current; if (el) el.scrollLeft = actualRef.current * el.clientWidth; };
        window.addEventListener('resize', f);
        return () => window.removeEventListener('resize', f);
    }, []);

    const ir = useCallback((i: number) => {
        const el = carruselRef.current;
        if (!el) return;
        const j = Math.max(0, Math.min(datos.c.length - 1, i));
        el.scrollTo({ left: j * el.clientWidth, behavior: 'smooth' });
    }, [datos.c.length]);

    const alDesplazar = () => {
        const el = carruselRef.current;
        if (!el) return;
        const i = Math.round(el.scrollLeft / el.clientWidth);
        if (i !== actualRef.current) {
            setActual(i);
            const d = el.querySelector<HTMLElement>(`[data-diapositiva="${i}"]`);
            if (d) d.scrollTop = 0;
        }
    };

    // Teclado y pedal: baja la hoja y, al final, pasa a la siguiente
    useEffect(() => {
        const f = (e: KeyboardEvent) => {
            // Escribiendo su versión: las teclas (el espacio, las flechas) son del texto, no del pedal
            if ((e.target as HTMLElement | null)?.closest?.('textarea, input, [contenteditable="true"], [role="dialog"]')) return;
            const adelante = ['PageDown', 'ArrowRight', 'ArrowDown', ' '].includes(e.key);
            const atras = ['PageUp', 'ArrowLeft', 'ArrowUp'].includes(e.key);
            if (!adelante && !atras) return;
            e.preventDefault();
            const el = carruselRef.current?.querySelector<HTMLElement>(`[data-diapositiva="${actualRef.current}"]`);
            if (adelante) {
                if (el && el.scrollTop + el.clientHeight < el.scrollHeight - 4) el.scrollBy({ top: el.clientHeight * 0.8, behavior: 'smooth' });
                else ir(actualRef.current + 1);
            } else if (el && el.scrollTop > 4) el.scrollBy({ top: -el.clientHeight * 0.8, behavior: 'smooth' });
            else ir(actualRef.current - 1);
        };
        window.addEventListener('keydown', f);
        return () => window.removeEventListener('keydown', f);
    }, [ir]);

    const tema = datos.c[actual];
    const cambiarTono = (d: number) => setTonos(t => t.map((x, i) => (i === actual ? (Math.abs(x + d) >= 12 ? 0 : x + d) : x)));

    const boton = 'pulsable h-10 min-w-10 px-2 rounded-full flex items-center justify-center text-foreground active:bg-fill-strong disabled:opacity-30';
    return (
        <main className="fixed inset-0 bg-background text-foreground">
            <div ref={carruselRef} onScroll={alDesplazar}
                className="h-full w-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar overscroll-x-contain">
                {datos.c.map((t, i) => (
                    <div key={i} data-diapositiva={i} className="relative h-full w-full shrink-0 snap-start snap-always overflow-y-auto overscroll-contain">
                        {Math.abs(i - actual) <= 1
                            ? <Diapositiva tema={ver(t)} n={i + 1} total={datos.c.length} tamano={tamano} delta={tonos[i]} formas={formas} soloAcordes={soloAcordes} siguiente={datos.c[i + 1]} onSiguiente={() => ir(i + 1)}
                                mia={<MiVersion original={t} mia={de(t)} onUsar={usar => { const m = de(t); if (m) poner(t, { ...m, usar }); }} onEditar={() => setEditando(t)} />} />
                            : <div className="h-full" />}
                    </div>
                ))}
            </div>

            {/* Arriba: volver a la lista */}
            <div className="fixed left-3 right-3 top-[calc(env(safe-area-inset-top)+8px)] flex items-center gap-2 pointer-events-none">
                <button onClick={onLista} className="pointer-events-auto pulsable h-10 pl-2.5 pr-3.5 rounded-full bg-sheet border border-hairline shadow-e2 text-[14px] font-semibold flex items-center gap-1.5">
                    <List className="h-4 w-4" /> Lista
                </button>
                <span className="ml-auto pointer-events-auto h-10 px-3.5 rounded-full bg-sheet border border-hairline shadow-e2 text-[14px] font-semibold tabular-nums flex items-center">
                    {actual + 1} / {datos.c.length}
                </span>
            </div>

            {/* Abajo: tono, tamaño y pasar de tema */}
            <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+14px)] max-w-[calc(100vw-20px)] flex items-center gap-0.5 p-1 rounded-full bg-sheet border border-hairline shadow-e3 overflow-x-auto hide-scrollbar">
                <button onClick={() => ir(actual - 1)} disabled={actual === 0} aria-label="Tema anterior" className={boton}><ChevronLeft className="h-5 w-5" /></button>
                <span className="mx-0.5 h-6 w-px shrink-0 bg-hairline-strong" aria-hidden />
                <button onClick={() => cambiarTono(-1)} aria-label="Bajar medio tono" className={boton}><Minus className="h-4 w-4" /></button>
                <span className="min-w-[46px] text-center text-[13px] font-semibold leading-tight">
                    Tono{tonos[actual] !== 0 && <span className="block text-[11px] text-muted-foreground">{tonos[actual] > 0 ? '+' : ''}{tonos[actual]}</span>}
                </span>
                <button onClick={() => cambiarTono(1)} aria-label="Subir medio tono" className={boton}><Plus className="h-4 w-4" /></button>
                <span className="mx-0.5 h-6 w-px shrink-0 bg-hairline-strong" aria-hidden />
                <button onClick={() => cambiarTamano(-2)} aria-label="Letra más pequeña" className={cn(boton, 'text-[13px] font-bold')}>A</button>
                <button onClick={() => cambiarTamano(2)} aria-label="Letra más grande" className={cn(boton, 'text-[19px] font-bold')}>A</button>
                {conCejilla && (
                    <button onClick={() => setFormas(!formas)} aria-pressed={formas}
                        className={cn('pulsable h-10 px-3 rounded-full text-[13px] font-semibold shrink-0', formas ? 'bg-foreground text-background' : 'text-foreground')}>
                        Formas
                    </button>
                )}
                {conLetra && (
                    <button onClick={() => setSoloAcordes(s => !s)} aria-pressed={soloAcordes}
                        className={cn('pulsable h-10 px-3 rounded-full text-[13px] font-semibold shrink-0', soloAcordes ? 'bg-foreground text-background' : 'text-foreground')}>
                        Solo acordes
                    </button>
                )}
                <span className="mx-0.5 h-6 w-px shrink-0 bg-hairline-strong" aria-hidden />
                <button onClick={() => ir(actual + 1)} disabled={actual >= datos.c.length - 1} aria-label="Tema siguiente" className={boton}><ChevronRight className="h-5 w-5" /></button>
            </div>
            <span className="sr-only" aria-live="polite">{tema ? `${actual + 1} de ${datos.c.length}: ${tema.t}` : ''}</span>
            {editando && (
                <EditorMia original={editando} mia={de(editando)}
                    onGuardar={x => { poner(editando, { x, base: editando.x, usar: true, cuando: new Date().toISOString() }); setEditando(null); }}
                    onBorrar={() => { poner(editando, null); setEditando(null); }}
                    onCerrar={() => setEditando(null)} />
            )}
        </main>
    );
}

// Debajo de las píldoras: «Hacer mi versión», o «Original · La mía» si ya la tiene
function MiVersion({ original, mia, onUsar, onEditar }: { original: TemaCompartido; mia?: Mia; onUsar: (usar: boolean) => void; onEditar: () => void }) {
    if (!mia) {
        return (
            <button onClick={onEditar} className="pulsable mt-3 h-9 px-3.5 rounded-full border border-hairline-strong text-[14px] font-semibold flex items-center gap-1.5">
                <Copy className="h-4 w-4" /> Hacer mi versión
            </button>
        );
    }
    const cambio = mia.base !== original.x;
    return (
        <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex p-1 rounded-full bg-fill gap-0.5" role="radiogroup" aria-label="Qué versión ver">
                {([[false, 'Original'], [true, 'La mía']] as const).map(([v, nombre]) => (
                    <button key={nombre} role="radio" aria-checked={mia.usar === v} onClick={() => onUsar(v)}
                        className={cn('h-8 px-3 rounded-full text-[13.5px] font-semibold', mia.usar === v ? 'bg-foreground text-background' : 'text-foreground')}>{nombre}</button>
                ))}
            </div>
            <button onClick={onEditar} aria-label="Editar mi versión" className="pulsable h-9 w-9 rounded-full bg-fill flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
            {cambio && (
                <span className="h-8 px-3 rounded-full text-[13px] font-semibold flex items-center bg-pastel-mantequilla text-pastel-mantequilla-ink">
                    El original ha cambiado desde tu versión
                </span>
            )}
        </div>
    );
}

// Su versión: el texto tal cual (acordes, partes y formato), en su móvil
function EditorMia({ original, mia, onGuardar, onBorrar, onCerrar }: { original: TemaCompartido; mia?: Mia; onGuardar: (x: string) => void; onBorrar: () => void; onCerrar: () => void }) {
    const [texto, setTexto] = useState(mia?.x ?? original.x);
    const cambio = mia && mia.base !== original.x;
    return (
        <div className="fixed inset-0 z-40 bg-background flex flex-col" role="dialog" aria-label={`Mi versión de ${original.t}`}>
            <div className="shrink-0 pt-[calc(env(safe-area-inset-top)+8px)] px-3 pb-2 border-b border-hairline flex items-center gap-2">
                <button onClick={onCerrar} className="pulsable h-9 px-3 rounded-full text-[15px] text-muted-foreground">Cancelar</button>
                <span className="flex-1 min-w-0 truncate text-center text-[15px] font-semibold">Mi versión · {original.t}</span>
                <button onClick={() => onGuardar(texto)} className="pulsable h-9 px-4 rounded-full bg-primary text-primary-foreground text-[15px] font-semibold">Listo</button>
            </div>
            {cambio && (
                <div className="shrink-0 mx-3 mt-2 rounded-xl bg-pastel-mantequilla text-pastel-mantequilla-ink px-3 py-2 text-[13.5px] font-semibold flex items-center gap-2">
                    <span className="flex-1">El original ha cambiado desde que hiciste la tuya.</span>
                    <button onClick={() => setTexto(original.x)} className="underline">Empezar del nuevo</button>
                </div>
            )}
            <textarea value={texto} onChange={e => setTexto(e.target.value)} aria-label="Texto de mi versión"
                wrap="off" spellCheck={false} autoCapitalize="off" autoCorrect="off"
                className="flex-1 min-h-0 m-3 p-3 rounded-xl bg-fill font-mono text-[16px] leading-relaxed outline-none resize-none" />
            <p className="shrink-0 px-4 text-[13px] text-muted-foreground">
                Solo la ves tú, en este móvil. El original no cambia y sigue al día. Para un apunte, empieza la línea con «&gt; ».
            </p>
            <div className="shrink-0 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+12px)]">
                {mia && <button onClick={onBorrar} className="pulsable h-11 w-full rounded-[14px] text-[15px] font-semibold text-destructive">Borrar mi versión</button>}
            </div>
        </div>
    );
}

function Diapositiva({ tema, n, total, tamano, delta, formas, soloAcordes, siguiente, onSiguiente, mia }: {
    tema: TemaCompartido; n: number; total: number; tamano: number; delta: number; formas: boolean; soloAcordes: boolean; siguiente?: TemaCompartido; onSiguiente: () => void; mia?: React.ReactNode;
}) {
    const leida = useMemo(() => leerCancion(tema.x), [tema.x]);
    const lineas = useMemo(() => sinLoDeLasPildoras(leida.lineas, tema.g ?? null), [leida.lineas, tema.g]);
    const opciones: OpcionesNombre = useMemo(() => {
        // «Formas»: con la cejilla de la ficha, los acordes que se tocan
        const semitonos = (tema.s ?? 0) + delta - (formas ? tema.m ?? 0 : 0);
        const tono = detectarTono(leida.acordes);
        return { semitonos, notacion: 'original', bemoles: semitonos === 0 ? null : usaBemoles(tono, semitonos, 'auto') };
    }, [tema.s, tema.m, formas, delta, leida.acordes]);
    const estiloG = tema.g ? estiloBloque(tema.g) : null;
    return (
        <div className="min-h-full px-5 md:px-10 pt-[calc(env(safe-area-inset-top)+64px)] pb-[calc(env(safe-area-inset-bottom)+120px)] max-w-4xl mx-auto">
            <h2 className="font-heading text-[28px] font-bold leading-tight">
                <span className="sr-only">{n} de {total}: </span>{tema.t}
            </h2>
            {(tema.v || tema.a) && <p className="text-[14px] text-muted-foreground">{[tema.v && `Versión ${tema.v}`, tema.a].filter(Boolean).join(' · ')}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
                {tema.g && estiloG && <Pildora texto={tema.g} pastel={estiloG.pastel} icono={estiloG.icono} />}
                {datosTemaConTono(tema).map(p => <span key={p.texto} className={cn('h-8 px-3 rounded-full text-[13px] font-semibold flex items-center', p.clase)}>{p.texto}</span>)}
                {formas && !!tema.m && <span className="h-8 px-3 rounded-full text-[13px] font-semibold flex items-center bg-pastel-mantequilla text-pastel-mantequilla-ink">Formas · cejilla {tema.m}</span>}
                {delta !== 0 && <span className="h-8 px-3 rounded-full text-[13px] font-semibold flex items-center bg-pastel-mantequilla text-pastel-mantequilla-ink">Transportado {delta > 0 ? '+' : ''}{delta}</span>}
            </div>
            {mia}
            {!notasVacias(tema.o) && <NotasRicas json={tema.o} className="mt-3 text-[16px]" />}
            <div className="mt-4">
                {lineas.length
                    ? <HojaCancion lineas={lineas} opciones={opciones} vista={soloAcordes ? 'acordes' : 'completa'} tamano={tamano} columnas={1} />
                    : <p className="text-[15px] text-muted-foreground">Sin acordes apuntados todavía.</p>}
            </div>
            {siguiente && (
                <button onClick={onSiguiente} className="pulsable mt-6 w-full rounded-2xl bg-fill px-4 py-3 text-left flex items-center gap-3">
                    <span className="flex-1 min-w-0">
                        <span className="block text-[12px] font-semibold text-muted-foreground">Siguiente</span>
                        <span className="block truncate text-[16px] font-semibold">{siguiente.t}{siguiente.k && <span className="text-muted-foreground"> · {siguiente.k}</span>}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
            )}
        </div>
    );
}

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Minus, Pause, Play, Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { detectarTono, leerCancion, usaBemoles, type OpcionesNombre } from '../../lib/acordes';
import { notasVacias } from '../../lib/notas';
import type { TemaCompartido } from '../../lib/compartir';
import { usePantallaEncendida } from '../../hooks/usePantallaEncendida';
import { NotasRicas } from '../notas/NotasRicas';
import { HojaCancion } from './HojaCancion';
import { datosTema } from './datosTema';
import { estiloBloque, sinLoDeLasPildoras } from './estilo';

// «Cifrado»: el set entero seguido en una sola hoja, cada tema con su tono grande, su ficha y
// debajo sus acordes por partes y sus avisos (sin letra). Para tocar en directo sin entrar en
// cada canción. La misma hoja sale en el repertorio, en la biblioteca y en el enlace del grupo

export const TemaCifrado = memo(function Tema({ tema, n, tamano, onAbrir, sinBorde, sinCabecera }: { tema: TemaCompartido; n: number; tamano: number; onAbrir?: () => void; sinBorde?: boolean; sinCabecera?: boolean }) {
    const leida = useMemo(() => leerCancion(tema.x), [tema.x]);
    const lineas = useMemo(() => sinLoDeLasPildoras(leida.lineas, tema.g ?? null), [leida.lineas, tema.g]);
    const opciones: OpcionesNombre = useMemo(() => {
        const semitonos = tema.s ?? 0;
        return { semitonos, notacion: 'original', bemoles: semitonos === 0 ? null : usaBemoles(detectarTono(leida.acordes), semitonos, 'auto') };
    }, [tema.s, leida.acordes]);
    const titulo = (
        <>
            <span className="text-muted-foreground tabular-nums mr-2 text-[0.8em]">{n}</span>
            {tema.t}
        </>
    );
    return (
        <article className={cn('break-inside-avoid', sinBorde ? '' : 'py-4 border-b border-hairline')} aria-label={`${n}. ${tema.t}`}>
            {!sinCabecera && <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                    {onAbrir
                        ? <button onClick={onAbrir} className="text-left font-heading text-[1.25em] font-bold leading-tight text-foreground active:opacity-60">{titulo}</button>
                        : <h3 className="font-heading text-[1.25em] font-bold leading-tight text-foreground">{titulo}</h3>}
                    {(tema.v || tema.a) && <p className="text-[0.75em] text-muted-foreground truncate">{[tema.v && `Versión ${tema.v}`, tema.a].filter(Boolean).join(' · ')}</p>}
                </div>
                {tema.k && <span className="shrink-0 min-w-[2.6em] h-[1.9em] px-[0.6em] rounded-full bg-foreground text-background text-[1.05em] font-bold flex items-center justify-center">{tema.k}</span>}
            </div>}
            {!sinCabecera && datosTema(tema).length > 0 && (
                <div className="mt-[0.4em] flex flex-wrap gap-1">
                    {datosTema(tema).map(p => <span key={p.texto} className={cn('h-[1.6em] px-[0.6em] rounded-full text-[0.7em] font-semibold flex items-center', p.clase)}>{p.texto}</span>)}
                </div>
            )}
            {!notasVacias(tema.o) && <NotasRicas json={tema.o} className="mt-[0.5em] text-[0.8em]" />}
            {lineas.length > 0 && (
                <div className="mt-[0.5em]">
                    <HojaCancion lineas={lineas} opciones={opciones} vista="completa" tamano={tamano} columnas={1} />
                </div>
            )}
        </article>
    );
});

export function HojaSet({ temas, tamano = 17, onAbrir, className }: {
    temas: TemaCompartido[]; tamano?: number; onAbrir?: (i: number) => void; className?: string;
}) {
    return (
        <div className={cn('text-foreground', className)} style={{ fontSize: tamano }}>
            {temas.map((t, i) => {
                const nuevoBloque = t.g && (i === 0 || t.g !== temas[i - 1].g) ? t.g : null;
                const estilo = nuevoBloque ? estiloBloque(nuevoBloque) : null;
                return (
                    <div key={i}>
                        {nuevoBloque && estilo && (
                            <div className={cn('relative mt-4 h-[56px] rounded-[18px] overflow-hidden flex items-center pl-4 pr-[90px] text-[16px]', estilo.pastel.fondo)}>
                                <span className="font-heading text-[18px] font-bold leading-tight text-foreground line-clamp-2">{nuevoBloque}</span>
                                <img src={estilo.icono} alt="" aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-[52px] w-[72px] object-contain" />
                            </div>
                        )}
                        <TemaCifrado tema={t} n={i + 1} tamano={tamano} onAbrir={onAbrir ? () => onAbrir(i) : undefined} />
                    </div>
                );
            })}
            {!temas.length && <p className="py-10 text-center text-[15px] text-muted-foreground">No hay canciones.</p>}
        </div>
    );
}

const CLAVE = 'musikeeo-cifrado-directo';
function leerPrefs(): { tamano: number; velocidad: number; oscuro: boolean } {
    try {
        const p = JSON.parse(localStorage.getItem(CLAVE) || '{}');
        return { tamano: p.tamano >= 12 && p.tamano <= 40 ? p.tamano : 20, velocidad: p.velocidad >= 5 && p.velocidad <= 120 ? p.velocidad : 22, oscuro: p.oscuro !== false };
    } catch { return { tamano: 20, velocidad: 22, oscuro: true }; }
}

// En directo: la hoja del set a pantalla completa, oscura, sin barras. Baja sola (Auto) o con
// el pedal (AvPág/flechas); la pantalla no se apaga. Tocar un título abre la canción entera
export function CifradoEnDirecto({ abierta, onCerrar, titulo, temas, onAbrir, scrollInicial, onScroll }: {
    abierta: boolean; onCerrar: () => void; titulo: string; temas: TemaCompartido[];
    onAbrir?: (i: number) => void; scrollInicial?: number; onScroll?: (y: number) => void;
}) {
    if (!abierta) return null;
    return createPortal(<Directo onCerrar={onCerrar} titulo={titulo} temas={temas} onAbrir={onAbrir} scrollInicial={scrollInicial} onScroll={onScroll} />, document.body);
}

function Directo({ onCerrar, titulo, temas, onAbrir, scrollInicial, onScroll }: {
    onCerrar: () => void; titulo: string; temas: TemaCompartido[]; onAbrir?: (i: number) => void; scrollInicial?: number; onScroll?: (y: number) => void;
}) {
    const [prefs, setPrefs] = useState(leerPrefs);
    const [rodando, setRodando] = useState(false);
    const [controles, setControles] = useState(true);
    const zonaRef = useRef<HTMLDivElement>(null);
    usePantallaEncendida();

    const cambiar = (c: Partial<typeof prefs>) => setPrefs(p => {
        const n = { ...p, ...c };
        try { localStorage.setItem(CLAVE, JSON.stringify(n)); } catch { /* */ }
        return n;
    });

    useEffect(() => {
        if (scrollInicial && zonaRef.current) zonaRef.current.scrollTop = scrollInicial;
    }, [scrollInicial]);

    // Baja sola
    useEffect(() => {
        if (!rodando) return;
        let raf = 0, ultimo = performance.now(), resto = 0;
        const paso = (t: number) => {
            const el = zonaRef.current;
            if (!el) return;
            resto += (prefs.velocidad * Math.min(100, t - ultimo)) / 1000;
            ultimo = t;
            const px = Math.floor(resto);
            if (px >= 1) { resto -= px; el.scrollTop += px; }
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) { setRodando(false); return; }
            raf = requestAnimationFrame(paso);
        };
        raf = requestAnimationFrame(paso);
        return () => cancelAnimationFrame(raf);
    }, [rodando, prefs.velocidad]);

    // Mientras baja, los controles se apartan
    useEffect(() => {
        if (!rodando || !controles) return;
        const t = setTimeout(() => setControles(false), 3000);
        return () => clearTimeout(t);
    }, [rodando, controles]);

    const salir = useCallback(() => { setRodando(false); onCerrar(); }, [onCerrar]);

    // Pedal y teclado
    useEffect(() => {
        const f = (e: KeyboardEvent) => {
            const el = zonaRef.current;
            if (!el) return;
            if (['PageDown', 'ArrowRight', 'ArrowDown'].includes(e.key)) { e.preventDefault(); el.scrollBy({ top: el.clientHeight * 0.8, behavior: 'smooth' }); }
            else if (['PageUp', 'ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); el.scrollBy({ top: -el.clientHeight * 0.8, behavior: 'smooth' }); }
            else if (e.key === ' ') { e.preventDefault(); setRodando(r => !r); }
            else if (e.key === 'Escape') salir();
        };
        window.addEventListener('keydown', f);
        return () => window.removeEventListener('keydown', f);
    }, [salir]);

    const boton = 'pulsable h-10 min-w-10 px-2 rounded-full flex items-center justify-center text-foreground active:bg-fill-strong';
    return (
        <div className={cn('fixed inset-0 z-[90] bg-background text-foreground', prefs.oscuro && 'dark')} role="dialog" aria-modal="true" aria-label={`${titulo}, cifrado en directo`}>
            <div className="h-full bg-background">
                <div ref={zonaRef} onClick={() => setControles(c => !c)} onScroll={e => onScroll?.((e.target as HTMLElement).scrollTop)}
                    className="h-full overflow-y-auto overscroll-contain px-4 md:px-10 pt-[calc(env(safe-area-inset-top)+56px)] pb-[calc(env(safe-area-inset-bottom)+120px)]">
                    <div className="max-w-3xl mx-auto">
                        <p className="text-[13px] font-semibold text-muted-foreground truncate">{titulo} · {temas.length} temas</p>
                        <HojaSet temas={temas} tamano={prefs.tamano} onAbrir={onAbrir ? i => { onScroll?.(zonaRef.current?.scrollTop ?? 0); onAbrir(i); } : undefined} />
                    </div>
                </div>
                <button onClick={salir} aria-label="Salir del cifrado en directo"
                    className={cn('pulsable fixed right-3 top-[calc(env(safe-area-inset-top)+8px)] h-10 w-10 rounded-full bg-sheet border border-hairline shadow-e2 flex items-center justify-center text-foreground transition-opacity',
                        controles ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
                    <X className="h-5 w-5" />
                </button>
                <div className={cn('fixed left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+14px)] max-w-[calc(100vw-20px)] flex items-center gap-0.5 p-1 rounded-full bg-sheet border border-hairline shadow-e3 overflow-x-auto hide-scrollbar transition-all duration-200',
                    controles ? 'opacity-100' : 'opacity-0 translate-y-4 pointer-events-none')}>
                    <button onClick={() => setRodando(r => !r)} aria-label={rodando ? 'Parar' : 'Que baje sola'}
                        className={cn('pulsable h-10 px-3.5 rounded-full text-[14px] font-semibold flex items-center gap-1.5', rodando ? 'bg-foreground text-background' : 'text-foreground')}>
                        {rodando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} Auto
                    </button>
                    <button onClick={() => cambiar({ velocidad: Math.max(5, prefs.velocidad - 4) })} aria-label="Más despacio" className={boton}><Minus className="h-4 w-4" /></button>
                    <span className="min-w-[34px] text-center text-[12px] font-semibold text-muted-foreground tabular-nums">{prefs.velocidad}</span>
                    <button onClick={() => cambiar({ velocidad: Math.min(120, prefs.velocidad + 4) })} aria-label="Más rápido" className={boton}><Plus className="h-4 w-4" /></button>
                    <span className="mx-0.5 h-6 w-px shrink-0 bg-hairline-strong" aria-hidden />
                    <button onClick={() => cambiar({ tamano: Math.max(12, prefs.tamano - 2) })} aria-label="Letra más pequeña" className={cn(boton, 'text-[13px] font-bold')}>A</button>
                    <button onClick={() => cambiar({ tamano: Math.min(40, prefs.tamano + 2) })} aria-label="Letra más grande" className={cn(boton, 'text-[19px] font-bold')}>A</button>
                    <span className="mx-0.5 h-6 w-px shrink-0 bg-hairline-strong" aria-hidden />
                    <button onClick={() => cambiar({ oscuro: !prefs.oscuro })} aria-pressed={prefs.oscuro}
                        className={cn('pulsable h-10 px-3 rounded-full text-[13px] font-semibold', prefs.oscuro ? 'bg-foreground text-background' : 'text-foreground')}>
                        Oscuro
                    </button>
                </div>
            </div>
        </div>
    );
}

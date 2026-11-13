import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, Pencil, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { ENERGIAS, ESTADOS, opcionesDe } from '../../lib/biblioteca';
import { estiloBloque, pastelCanta, pastelDe } from './estilo';
import type { AjustesCancion, Cancion, EstadoCancion, FichaCancion } from '../../types/cancionero';

// La ficha a la vista (tono, capo, quién canta, grupo, estilo…). Tocar una píldora abre un
// desplegable pequeño junto a ella y se guarda al elegir, con Deshacer. El lápiz lleva a la ficha entera
type Campo = 'tono' | 'capo' | 'canta' | 'proyectos' | 'estilo' | 'energia' | 'estado';

const NOTAS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const INDICE: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const partirTono = (t?: string) => {
    const m = /^\s*([A-G])([#b])?(m(?!aj))?/.exec(t ?? '');
    return m ? { raiz: m[1] + (m[2] ?? ''), menor: !!m[3] } : null;
};
// Las formas con cejilla: el tono bajado tantos trastes como la cejilla («Gm, cejilla 3 → Em»)
function formasDe(tono: string | undefined, traste: number): string | null {
    const t = partirTono(tono);
    if (!t || INDICE[t.raiz] === undefined) return null;
    const i = (((INDICE[t.raiz] - traste) % 12) + 12) % 12;
    const raiz = t.menor ? ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'][i] : NOTAS[i];
    return raiz + (t.menor ? 'm' : '');
}
const trasteDe = (capo?: string) => +(/(\d{1,2})/.exec(capo ?? '')?.[1] ?? 0);

// onTono: con acordes escritos, cuánto hay que transportar para que suene en el tono elegido
export function FichaEnSitio({ cancion, onTono }: { cancion: Cancion; onTono?: (tono: string) => Partial<AjustesCancion> | null }) {
    const { guardar, canciones } = useCancionero();
    const [abierto, setAbierto] = useState<{ campo: Campo; ancla: HTMLElement } | null>(null);
    const f = cancion.ficha ?? {};
    const aFicha = `/cancionero/${cancion.id}/editar#ficha`;

    const poner = (cambio: Partial<FichaCancion>, aviso: string, ajustes?: Partial<AjustesCancion> | null) => {
        const antes = cancion;
        const ficha: FichaCancion = { ...f, ...cambio };
        for (const k of Object.keys(ficha) as (keyof FichaCancion)[]) {
            const v = ficha[k];
            if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) delete ficha[k];
        }
        guardar({ ...cancion, ficha, ...(ajustes ? { ajustes: { ...cancion.ajustes, ...ajustes } } : {}) });
        toast.success(aviso, { action: { label: 'Deshacer', onClick: () => guardar(antes) } });
    };

    const pildora = (campo: Campo, texto: string, clase: string) => (
        <button key={`${campo}:${texto}`} onClick={e => { const ancla = e.currentTarget; setAbierto(a => (a?.ancla === ancla ? null : { campo, ancla })); }}
            aria-haspopup="dialog" aria-expanded={abierto?.campo === campo}
            className={cn('h-7 shrink-0 whitespace-nowrap px-2.5 rounded-full text-[13px] font-semibold flex items-center active:opacity-60', clase)}>
            {texto}
        </button>
    );

    const piezas: ReactNode[] = [];
    if (f.tono) piezas.push(pildora('tono', `Tono ${f.tono}${f.tonoAlt ? ` · también ${f.tonoAlt}` : ''}`, 'bg-foreground text-background'));
    if (f.capo) piezas.push(pildora('capo', f.capo, 'bg-fill-strong text-foreground'));
    if (f.canta) { const p = pastelCanta(f.canta); piezas.push(pildora('canta', `Canta ${f.canta}`, cn(p.fondo, p.tinta))); }
    for (const g of f.proyectos ?? []) piezas.push(pildora('proyectos', g, 'bg-fill-strong text-foreground'));
    if (f.estilo) { const p = estiloBloque(f.estilo).pastel; piezas.push(pildora('estilo', f.estilo, cn(p.fondo, p.tinta))); }
    if (f.energia) piezas.push(pildora('energia', ENERGIAS[f.energia], 'bg-fill-strong text-foreground'));
    for (const e of f.etiquetas ?? []) {
        const p = pastelDe(`etiqueta:${e.toLowerCase()}`);
        piezas.push(<Link key={`e:${e}`} to={aFicha} className={cn('h-7 shrink-0 whitespace-nowrap px-2.5 rounded-full text-[13px] font-semibold flex items-center active:opacity-60', p.fondo, p.tinta)}>{e}</Link>);
    }
    if (f.estado && f.estado !== 'lista') piezas.push(pildora('estado', ESTADOS[f.estado], 'bg-pastel-mantequilla text-pastel-mantequilla-ink'));
    // Lo que falta, para ponerlo con un toque (solo lo que más se usa)
    const faltan: [Campo, string][] = ([['tono', 'Tono'], ['canta', 'Canta'], ['proyectos', 'Grupo'], ['estilo', 'Estilo']] as [Campo, string][])
        .filter(([c]) => (c === 'proyectos' ? !(f.proyectos ?? []).length : !f[c as keyof FichaCancion]));

    const opciones = (campo: 'canta' | 'estilos' | 'proyectos') => opcionesDe(canciones, campo, () => null).map(o => o.valor);

    let contenido: ReactNode = null;
    if (abierto) {
        const cerrar = () => setAbierto(null);
        switch (abierto.campo) {
            case 'tono':
                contenido = <ElegirTono actual={f.tono} onElegir={t => { cerrar(); if (t !== f.tono) poner({ tono: t || undefined }, t ? `Tono ${t}` : 'Tono quitado', t ? onTono?.(t) : null); }} />;
                break;
            case 'capo':
                contenido = <ElegirCapo tono={f.tono} actual={f.capo} onElegir={c => { cerrar(); if (c !== f.capo) poner({ capo: c || undefined }, c || 'Sin cejilla'); }} />;
                break;
            case 'canta':
                contenido = <ElegirUno titulo="Canta" opciones={[...new Set(['Víctor', 'Mafe', 'Ambos', ...opciones('canta')])]} actual={f.canta}
                    onElegir={v => { cerrar(); if (v !== f.canta) poner({ canta: v || undefined }, v ? `Canta ${v}` : 'Sin cantante'); }} />;
                break;
            case 'estilo':
                contenido = <ElegirUno titulo="Estilo" opciones={opciones('estilos')} actual={f.estilo}
                    onElegir={v => { cerrar(); if (v !== f.estilo) poner({ estilo: v || undefined }, v || 'Sin estilo'); }} />;
                break;
            case 'estado':
                contenido = <ElegirUno titulo="Estado" fijas opciones={Object.values(ESTADOS)} actual={f.estado ? ESTADOS[f.estado] : ESTADOS.lista}
                    onElegir={v => { cerrar(); const k = (Object.keys(ESTADOS) as EstadoCancion[]).find(e => ESTADOS[e] === v); if (k && k !== f.estado) poner({ estado: k }, v); }} />;
                break;
            case 'energia':
                contenido = <ElegirUno titulo="Energía" fijas opciones={Object.values(ENERGIAS)} actual={f.energia ? ENERGIAS[f.energia] : undefined}
                    onElegir={v => { cerrar(); const k = (Object.keys(ENERGIAS).map(Number) as (1 | 2 | 3 | 4)[]).find(e => ENERGIAS[e] === v); if (k !== f.energia) poner({ energia: k }, v || 'Sin energía'); }} />;
                break;
            case 'proyectos':
                contenido = <ElegirGrupos opciones={opciones('proyectos')} actuales={f.proyectos ?? []}
                    onCambiar={g => poner({ proyectos: g }, g.length ? `Grupo: ${g.join(', ')}` : 'Sin grupo')} />;
                break;
        }
    }

    return (
        <>
            <div className="mt-2.5 -mx-4 px-4 md:mx-0 md:px-0 flex flex-nowrap md:flex-wrap items-center gap-1.5 overflow-x-auto hide-scrollbar">
                <Link to={aFicha} aria-label="Editar la ficha entera"
                    className="h-7 shrink-0 px-2 rounded-full border border-hairline-strong text-[13px] font-semibold text-foreground flex items-center gap-1 active:opacity-60">
                    <Pencil className="h-3.5 w-3.5" />{!piezas.length && ' Ficha'}
                </Link>
                {piezas}
                {f.enlace && /^https?:\/\//i.test(f.enlace) && (
                    <a href={f.enlace} target="_blank" rel="noopener noreferrer" className="h-7 shrink-0 whitespace-nowrap px-2.5 rounded-full bg-fill-strong text-[13px] font-semibold text-foreground flex items-center active:opacity-60">Sus acordes ↗</a>
                )}
                {faltan.map(([c, nombre]) => (
                    <button key={`+${c}`} onClick={e => { const ancla = e.currentTarget; setAbierto(a => (a?.ancla === ancla ? null : { campo: c, ancla })); }}
                        className="h-7 shrink-0 whitespace-nowrap pl-1.5 pr-2.5 rounded-full border border-dashed border-hairline-strong text-[13px] font-semibold text-muted-foreground flex items-center gap-0.5 active:opacity-60">
                        <Plus className="h-3.5 w-3.5" />{nombre}
                    </button>
                ))}
            </div>
            {abierto && <Desplegable ancla={abierto.ancla} onCerrar={() => setAbierto(null)}>{contenido}</Desplegable>}
        </>
    );
}

// Una cajita pegada a la píldora (por encima de todo, para que no la recorte la fila que se desliza)
function Desplegable({ ancla, onCerrar, children }: { ancla: HTMLElement; onCerrar: () => void; children: ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

    useLayoutEffect(() => {
        const colocar = () => {
            const r = ancla.getBoundingClientRect();
            const ancho = Math.min(300, window.innerWidth - 24);
            const alto = ref.current?.offsetHeight ?? 0;
            const left = Math.max(12, Math.min(r.left, window.innerWidth - ancho - 12));
            const vv = window.visualViewport;
            const bajoVisible = (vv ? vv.offsetTop + vv.height : window.innerHeight) - 12;
            const top = r.bottom + 6 + alto > bajoVisible && r.top - 6 - alto > 12 ? r.top - 6 - alto : r.bottom + 6;
            setPos({ left, top });
        };
        colocar();
        const raf = requestAnimationFrame(colocar);
        window.addEventListener('scroll', colocar, true);
        window.addEventListener('resize', colocar);
        window.visualViewport?.addEventListener('resize', colocar);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', colocar, true);
            window.removeEventListener('resize', colocar);
            window.visualViewport?.removeEventListener('resize', colocar);
        };
    }, [ancla]);

    useEffect(() => {
        const fuera = (e: PointerEvent) => {
            const t = e.target as Node;
            if (!ref.current?.contains(t) && !ancla.contains(t)) onCerrar();
        };
        const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onCerrar(); } };
        document.addEventListener('pointerdown', fuera, true);
        document.addEventListener('keydown', esc, true);
        return () => { document.removeEventListener('pointerdown', fuera, true); document.removeEventListener('keydown', esc, true); };
    }, [ancla, onCerrar]);

    return createPortal(
        <div ref={ref} role="dialog" style={pos ? { left: pos.left, top: pos.top } : { left: -9999, top: 0 }}
            className="fixed z-[95] w-[min(300px,calc(100vw-24px))] max-h-[60dvh] overflow-y-auto overscroll-contain rounded-2xl bg-sheet border border-hairline shadow-e3 p-2">
            {children}
        </div>,
        document.body,
    );
}

const chip = (activo: boolean) => cn('pulsable h-9 px-3 rounded-full text-[14px] font-semibold', activo ? 'bg-foreground text-background' : 'bg-fill text-foreground');

function ElegirTono({ actual, onElegir }: { actual?: string; onElegir: (t: string) => void }) {
    const a = partirTono(actual);
    const [menor, setMenor] = useState(a?.menor ?? false);
    return (
        <div>
            <div className="p-1 rounded-full bg-fill grid grid-cols-2 gap-1" role="radiogroup" aria-label="Mayor o menor">
                {([[false, 'Mayor'], [true, 'Menor']] as const).map(([v, n]) => (
                    <button key={n} role="radio" aria-checked={menor === v} onClick={() => setMenor(v)}
                        className={cn('h-8 rounded-full text-[14px] font-semibold', menor === v ? 'bg-foreground text-background' : 'text-foreground')}>{n}</button>
                ))}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
                {NOTAS.map(n => {
                    const t = n + (menor ? 'm' : '');
                    const es = !!a && INDICE[a.raiz] === INDICE[n] && a.menor === menor;
                    return <button key={n} onClick={() => onElegir(t)} className={cn(chip(es), 'px-0')}>{t}</button>;
                })}
            </div>
            {actual && <button onClick={() => onElegir('')} className="mt-2 w-full h-9 rounded-full text-[14px] text-muted-foreground">Quitar el tono</button>}
        </div>
    );
}

function ElegirCapo({ tono, actual, onElegir }: { tono?: string; actual?: string; onElegir: (c: string) => void }) {
    const ahora = trasteDe(actual);
    const texto = (n: number) => { const fo = formasDe(tono, n); return n ? `Capo ${n}${fo ? ` · formas de ${fo}` : ''}` : ''; };
    return (
        <div>
            <p className="px-1 pb-1.5 text-[13px] font-semibold text-muted-foreground">Cejilla{tono ? ` (suena en ${tono})` : ''}</p>
            <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 10 }, (_, n) => (
                    <button key={n} onClick={() => onElegir(texto(n))} className={cn(chip(n === ahora), 'px-0')}>{n || 'No'}</button>
                ))}
            </div>
            {ahora > 0 && formasDe(tono, ahora) && <p className="px-1 pt-2 text-[13px] text-muted-foreground">Ahora: formas de {formasDe(tono, ahora)}</p>}
        </div>
    );
}

function ElegirUno({ titulo, opciones, actual, fijas, onElegir }: {
    titulo: string; opciones: string[]; actual?: string; fijas?: boolean; onElegir: (v: string) => void;
}) {
    const [otro, setOtro] = useState<string | null>(null);
    return (
        <div>
            <p className="px-1 pb-1.5 text-[13px] font-semibold text-muted-foreground">{titulo}</p>
            <div className="flex flex-wrap gap-1.5">
                {opciones.map(o => <button key={o} onClick={() => onElegir(o)} className={chip(o === actual)}>{o}</button>)}
                {!fijas && otro === null && (
                    <button onClick={() => setOtro('')} className="pulsable h-9 pl-2 pr-3 rounded-full border border-dashed border-hairline-strong text-[14px] font-semibold text-muted-foreground flex items-center gap-0.5">
                        <Plus className="h-4 w-4" /> Otro
                    </button>
                )}
            </div>
            {otro !== null && (
                <form className="mt-2 flex gap-1.5" onSubmit={e => { e.preventDefault(); if (otro.trim()) onElegir(otro.trim().slice(0, 40)); }}>
                    <input autoFocus value={otro} onChange={e => setOtro(e.target.value)} placeholder={titulo}
                        className="flex-1 min-w-0 h-9 px-3 rounded-full bg-fill text-[15px] text-foreground outline-none" />
                    <button type="submit" aria-label="Poner" className="pulsable h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center"><Check className="h-4 w-4" /></button>
                </form>
            )}
            {actual && !fijas && <button onClick={() => onElegir('')} className="mt-2 w-full h-9 rounded-full text-[14px] text-muted-foreground">Quitar</button>}
        </div>
    );
}

// Varios a la vez: cada toque pone o quita ese grupo y se guarda en el momento
function ElegirGrupos({ opciones, actuales, onCambiar }: { opciones: string[]; actuales: string[]; onCambiar: (g: string[]) => void }) {
    const [elegidos, setElegidos] = useState(actuales);
    const [nuevo, setNuevo] = useState<string | null>(null);
    const todos = [...new Set([...opciones, ...elegidos])];
    const cambiar = (g: string[]) => { setElegidos(g); onCambiar(g); };
    return (
        <div>
            <p className="px-1 pb-1.5 text-[13px] font-semibold text-muted-foreground">Grupo</p>
            <div className="flex flex-col">
                {todos.map(g => {
                    const si = elegidos.includes(g);
                    return (
                        <button key={g} role="checkbox" aria-checked={si} onClick={() => cambiar(si ? elegidos.filter(x => x !== g) : [...elegidos, g])}
                            className="h-10 px-2 rounded-xl flex items-center gap-2.5 text-left text-[15px] text-foreground active:bg-fill">
                            <span className={cn('h-5 w-5 rounded-md border flex items-center justify-center shrink-0', si ? 'bg-foreground border-foreground text-background' : 'border-hairline-strong')}>
                                {si && <Check className="h-3.5 w-3.5" />}
                            </span>
                            {g}
                        </button>
                    );
                })}
            </div>
            {nuevo === null ? (
                <button onClick={() => setNuevo('')} className="mt-1 h-10 px-2 rounded-xl flex items-center gap-2 text-[15px] font-semibold text-muted-foreground">
                    <Plus className="h-4 w-4" /> Nuevo
                </button>
            ) : (
                <form className="mt-2 flex gap-1.5" onSubmit={e => { e.preventDefault(); const g = nuevo.trim().slice(0, 40); if (g && !elegidos.includes(g)) cambiar([...elegidos, g]); setNuevo(null); }}>
                    <input autoFocus value={nuevo} onChange={e => setNuevo(e.target.value)} placeholder="Nombre del grupo"
                        className="flex-1 min-w-0 h-9 px-3 rounded-full bg-fill text-[15px] text-foreground outline-none" />
                    <button type="submit" aria-label="Añadir" className="pulsable h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center"><Check className="h-4 w-4" /></button>
                </form>
            )}
        </div>
    );
}

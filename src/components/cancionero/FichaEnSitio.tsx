import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, ExternalLink, Palette, Pencil, Plus, Tag } from 'lucide-react';
import { ICONO_CAMPO } from './iconosFicha';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { ESTADOS, energiaDeNombre, estadoDeNombre, fichaSegura, nombreEnergia, nombreEstado } from '../../lib/biblioteca';
import { estiloBloque, pastelCanta, pastelDe, pastelGrupo } from './estilo';
import { EditarAspecto, IconoValor, PildoraValor } from './Aspecto';
import { GestionarCatalogo } from './Catalogo';
import { ICONO_TIPO, pastelDeValor, valoresDeTipo, type PestanaCatalogo } from './catalogoVista';
import { conExtra, etiquetasExtra, leerExtra, opcionesExtra, textoExtra, valorExtra } from '../../lib/camposPropios';
import type { CampoPropio, TipoValor } from '../../services/catalogoService';
import type { AjustesCancion, Cancion, FichaCancion } from '../../types/cancionero';

// La ficha a la vista (tono, capo, quién canta, grupo, estilo…). Tocar una píldora abre un
// desplegable pequeño junto a ella y se guarda al elegir, con Deshacer. El lápiz lleva a la ficha entera
type CampoFijo = 'tono' | 'capo' | 'canta' | 'proyectos' | 'estilo' | 'energia' | 'estado';
type Campo = CampoFijo | 'etiquetas' | 'mas' | `x:${string}`;

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
    const { guardar, canciones, catalogo } = useCancionero();
    const [abierto, setAbierto] = useState<{ campo: Campo; ancla: HTMLElement } | null>(null);
    // Colores e iconos: la hoja de un valor o la de todos (fuera del desplegable, que se cierra al tocar fuera)
    const [aspecto, setAspecto] = useState<{ tipo: TipoValor; valor: string } | null>(null);
    const [gestionar, setGestionar] = useState<PestanaCatalogo | null>(null);
    const colores = (t: PestanaCatalogo) => { setAbierto(null); setGestionar(t); };
    const colorDe = (tipo: TipoValor, valor: string) => { setAbierto(null); setAspecto({ tipo, valor }); };
    // Con cada dato en su tipo: una ficha rara (un grupo como texto suelto…) no tumba la canción
    const f = fichaSegura(cancion.ficha);
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

    const abrir = (campo: Campo) => (e: React.MouseEvent<HTMLElement>) => { const ancla = e.currentTarget; setAbierto(a => (a?.ancla === ancla ? null : { campo, ancla })); };
    const pildora = (campo: Campo, texto: string, clase: string, icono?: ReactNode) => { const Icono = (ICONO_CAMPO as Record<string, typeof Tag>)[campo] ?? Tag; return (
        <button key={`${campo}:${texto}`} onClick={abrir(campo)}
            aria-haspopup="dialog" aria-expanded={abierto?.campo === campo}
            className={cn('h-7 shrink-0 whitespace-nowrap px-2.5 rounded-full text-[13px] font-semibold flex items-center active:opacity-60', clase)}>
            {icono ?? <Icono className="h-3.5 w-3.5 mr-1 shrink-0" aria-hidden />}{texto}
        </button>
    ); };
    // Cambiar una columna propia (y la casilla, con un toque)
    const ponerExtra = (cp: CampoPropio, v: Parameters<typeof conExtra>[2], aviso: string) => {
        const antes = cancion;
        guardar(conExtra(cancion, cp.id, v));
        toast.success(aviso, { action: { label: 'Deshacer', onClick: () => guardar(antes) } });
    };

    const piezas: ReactNode[] = [];
    if (f.tono) piezas.push(pildora('tono', `Tono ${f.tono}${f.tonoAlt ? ` · también ${f.tonoAlt}` : ''}`, 'bg-foreground text-background'));
    if (f.capo) piezas.push(pildora('capo', f.capo, 'bg-fill-strong text-foreground'));
    if (f.canta) { const p = pastelCanta(f.canta); piezas.push(pildora('canta', `Canta ${f.canta}`, cn(p.fondo, p.tinta))); }
    for (const g of f.proyectos ?? []) { const p = pastelGrupo(g); piezas.push(pildora('proyectos', g, cn(p.fondo, p.tinta), <IconoValor tipo="grupo" valor={g} className="mr-1" />)); }
    if (f.estilo) { const p = estiloBloque(f.estilo).pastel; piezas.push(pildora('estilo', f.estilo, cn(p.fondo, p.tinta))); }
    if (f.energia) { const n = nombreEnergia(f.energia); const p = pastelDeValor('energia', n); piezas.push(pildora('energia', n, cn(p.fondo, p.tinta))); }
    for (const e of f.etiquetas ?? []) {
        const p = pastelDe(`etiqueta:${e.toLowerCase()}`);
        piezas.push(pildora('etiquetas', e, cn(p.fondo, p.tinta), <Tag className="h-3.5 w-3.5 mr-1 shrink-0" aria-hidden />));
    }
    if (f.estado && f.estado !== 'lista') { const n = nombreEstado(f.estado); const p = pastelDeValor('estado', n); piezas.push(pildora('estado', n, cn(p.fondo, p.tinta))); }
    // Las columnas propias que tienen algo
    for (const cp of catalogo.campos) {
        const v = valorExtra(cancion, cp);
        if (v === undefined) continue;
        const Icono = ICONO_TIPO[cp.tipo];
        const icono = <Icono className="h-3.5 w-3.5 mr-1 shrink-0" aria-hidden />;
        if (cp.tipo === 'casilla') piezas.push(
            <button key={`x:${cp.id}`} onClick={() => ponerExtra(cp, undefined, `«${cp.nombre}» quitado`)} aria-label={`Quitar «${cp.nombre}»`}
                className="h-7 shrink-0 whitespace-nowrap px-2.5 rounded-full text-[13px] font-semibold flex items-center active:opacity-60 bg-fill-strong text-foreground">
                <Check className="h-3.5 w-3.5 mr-1 shrink-0" aria-hidden />{cp.nombre}
            </button>,
        );
        else if (cp.tipo === 'etiqueta') for (const e of etiquetasExtra(cancion, cp)) { const p = pastelDe(`x:${cp.id}:${e.trim().toLowerCase()}`); piezas.push(pildora(`x:${cp.id}`, e, cn(p.fondo, p.tinta), icono)); }
        else piezas.push(pildora(`x:${cp.id}`, `${cp.nombre}: ${textoExtra(cancion, cp)}`, 'bg-fill-strong text-foreground max-w-[260px] overflow-hidden text-ellipsis', icono));
    }
    // Lo que falta, para ponerlo con un toque (solo lo que más se usa)
    const faltan: [CampoFijo, string][] = ([['tono', 'Tono'], ['canta', 'Canta'], ['proyectos', 'Grupo'], ['estilo', 'Estilo']] as [CampoFijo, string][])
        .filter(([c]) => (c === 'proyectos' ? !(f.proyectos ?? []).length : !f[c as keyof FichaCancion]));

    // Los que ya usas y los creados en «Grupos y colores»
    const opciones = (tipo: TipoValor) => valoresDeTipo(canciones, tipo).map(o => o.valor);

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
                contenido = <ElegirUno titulo="Canta" tipo="canta" onColores={() => colores('canta')} opciones={[...new Set(['Víctor', 'Mafe', 'Ambos', ...opciones('canta')])]} actual={f.canta}
                    onElegir={v => { cerrar(); if (v !== f.canta) poner({ canta: v || undefined }, v ? `Canta ${v}` : 'Sin cantante'); }} />;
                break;
            case 'estilo':
                contenido = <ElegirUno titulo="Estilo" tipo="estilo" onColores={() => colores('estilo')} opciones={opciones('estilo')} actual={f.estilo}
                    onElegir={v => { cerrar(); if (v !== f.estilo) poner({ estilo: v || undefined }, v || 'Sin estilo'); }} />;
                break;
            case 'estado':
                // Como Estilo: con su color, «+ Otro» y «Colores, renombrar o quitar» (13-nov)
                contenido = <ElegirUno titulo="Estado" tipo="estado" onColores={() => colores('estado')} opciones={opciones('estado')} actual={nombreEstado(f.estado) || ESTADOS.lista}
                    onElegir={v => { cerrar(); const k = estadoDeNombre(v); if (k !== f.estado) poner({ estado: k }, v || 'Sin estado'); }} />;
                break;
            case 'energia':
                contenido = <ElegirUno titulo="Energía" tipo="energia" onColores={() => colores('energia')} opciones={opciones('energia')} actual={nombreEnergia(f.energia) || undefined}
                    onElegir={v => { cerrar(); const k = energiaDeNombre(v); if (k !== f.energia) poner({ energia: k }, v || 'Sin energía'); }} />;
                break;
            case 'proyectos':
                contenido = <ElegirGrupos titulo="Grupo" tipo="grupo" opciones={opciones('grupo')} actuales={f.proyectos ?? []} onColor={v => colorDe('grupo', v)} onColores={() => colores('grupo')}
                    onCambiar={g => poner({ proyectos: g }, g.length ? `Grupo: ${g.join(', ')}` : 'Sin grupo')} />;
                break;
            case 'etiquetas':
                contenido = <ElegirGrupos titulo="Etiquetas" tipo="etiqueta" opciones={opciones('etiqueta')} actuales={f.etiquetas ?? []} onColor={v => colorDe('etiqueta', v)} onColores={() => colores('etiqueta')}
                    onCambiar={g => poner({ etiquetas: g }, g.length ? `Etiquetas: ${g.join(', ')}` : 'Sin etiquetas')} />;
                break;
            default: {
                const cp = catalogo.campos.find(x => `x:${x.id}` === abierto.campo);
                if (!cp) break;
                if (cp.tipo === 'etiqueta') contenido = <ElegirGrupos titulo={cp.nombre} opciones={opcionesExtra(canciones, cp)} actuales={etiquetasExtra(cancion, cp)} onColores={() => colores('columnas')}
                    onCambiar={g => ponerExtra(cp, g, g.length ? `${cp.nombre}: ${g.join(', ')}` : `Sin ${cp.nombre.toLowerCase()}`)} />;
                else if (cp.tipo !== 'casilla') contenido = <EscribirExtra campo={cp} actual={textoExtra(cancion, cp)}
                    onPoner={t => { cerrar(); ponerExtra(cp, leerExtra(t, cp.tipo), t.trim() ? `${cp.nombre}: ${t.trim()}` : `${cp.nombre} quitado`); }} />;
            }
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
                    <a href={f.enlace} target="_blank" rel="noopener noreferrer" className="h-7 shrink-0 whitespace-nowrap px-2.5 rounded-full bg-fill-strong text-[13px] font-semibold text-foreground flex items-center active:opacity-60"><ExternalLink className="h-3.5 w-3.5 mr-1 shrink-0" aria-hidden />Sus acordes</a>
                )}
                {faltan.map(([c, nombre]) => (
                    <button key={`+${c}`} onClick={abrir(c)}
                        className="h-7 shrink-0 whitespace-nowrap pl-1.5 pr-2.5 rounded-full border border-dashed border-hairline-strong text-[13px] font-semibold text-muted-foreground flex items-center gap-0.5 active:opacity-60">
                        {(() => { const I = ICONO_CAMPO[c]; return <I className="h-3.5 w-3.5 mr-0.5" aria-hidden />; })()}{nombre}
                    </button>
                ))}
                {/* Lo que no está a la vista: etiquetas y columnas propias, en un desplegable */}
                <button onClick={abrir('mas')} aria-label="Más datos de la ficha"
                    className="h-7 shrink-0 px-2 rounded-full border border-dashed border-hairline-strong text-[13px] font-semibold text-muted-foreground flex items-center gap-0.5 active:opacity-60">
                    <Plus className="h-3.5 w-3.5" />
                </button>
            </div>
            {abierto && <Desplegable key={abierto.campo} ancla={abierto.ancla} onCerrar={() => setAbierto(null)}>{abierto.campo === 'mas'
                ? <MasDatos campos={catalogo.campos} tieneEtiquetas={!!f.etiquetas?.length} valor={cp => textoExtra(cancion, cp)}
                    onElegir={campo => {
                        const cp = catalogo.campos.find(x => `x:${x.id}` === campo);
                        if (cp?.tipo === 'casilla') { setAbierto(null); ponerExtra(cp, valorExtra(cancion, cp) === true ? undefined : true, valorExtra(cancion, cp) === true ? `«${cp.nombre}» quitado` : `«${cp.nombre}» marcado`); return; }
                        // Se abre en el mismo sitio (pegado al «+»)
                        setAbierto(a => (a ? { campo, ancla: a.ancla } : null));
                    }} onGestionar={() => colores('columnas')} />
                : contenido}</Desplegable>}
            {aspecto && <EditarAspecto tipo={aspecto.tipo} valor={aspecto.valor} onCerrar={() => setAspecto(null)} />}
            {gestionar && <GestionarCatalogo abierta inicio={gestionar} onCerrar={() => setGestionar(null)} />}
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

// El pie de un desplegable: cambiar colores (e iconos, en los grupos), renombrar o quitar
function PieColores({ onColores, texto = 'Colores, renombrar o quitar' }: { onColores?: () => void; texto?: string }) {
    if (!onColores) return null;
    return (
        <button onClick={onColores} className="mt-2 w-full h-9 rounded-full flex items-center justify-center gap-1.5 text-[13.5px] font-semibold text-muted-foreground active:bg-fill">
            <Palette className="h-4 w-4" /> {texto}
        </button>
    );
}

function ElegirUno({ titulo, opciones, actual, fijas, tipo, onElegir, onColores }: {
    titulo: string; opciones: string[]; actual?: string; fijas?: boolean; tipo?: TipoValor; onElegir: (v: string) => void; onColores?: () => void;
}) {
    const [otro, setOtro] = useState<string | null>(null);
    return (
        <div>
            <p className="px-1 pb-1.5 text-[13px] font-semibold text-muted-foreground">{titulo}</p>
            <div className="flex flex-wrap gap-1.5">
                {opciones.map(o => tipo
                    // Con su color: el elegido con un aro
                    ? <button key={o} onClick={() => onElegir(o)} aria-pressed={o === actual} className={cn('pulsable rounded-full', o === actual ? 'ring-2 ring-foreground ring-offset-1 ring-offset-sheet' : '')}>
                        <PildoraValor tipo={tipo} valor={o} className="h-9 px-3 text-[14px]" />
                    </button>
                    : <button key={o} onClick={() => onElegir(o)} className={chip(o === actual)}>{o}</button>)}
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
            <PieColores onColores={onColores} />
        </div>
    );
}

// Varios a la vez (grupos, etiquetas o una columna de etiquetas): cada toque pone o quita y se guarda
// en el momento. Cada fila lleva su color e icono, y la paleta para cambiarlos
function ElegirGrupos({ titulo, tipo, opciones, actuales, onCambiar, onColor, onColores }: {
    titulo: string; tipo?: TipoValor; opciones: string[]; actuales: string[]; onCambiar: (g: string[]) => void; onColor?: (v: string) => void; onColores?: () => void;
}) {
    const [elegidos, setElegidos] = useState(actuales);
    const [nuevo, setNuevo] = useState<string | null>(null);
    const todos = [...new Set([...opciones, ...elegidos])];
    const cambiar = (g: string[]) => { setElegidos(g); onCambiar(g); };
    return (
        <div>
            <p className="px-1 pb-1.5 text-[13px] font-semibold text-muted-foreground">{titulo}</p>
            <div className="flex flex-col">
                {todos.map(g => {
                    const si = elegidos.includes(g);
                    return (
                        <div key={g} className="flex items-center">
                            <button role="checkbox" aria-checked={si} onClick={() => cambiar(si ? elegidos.filter(x => x !== g) : [...elegidos, g])}
                                className="flex-1 min-w-0 h-10 px-2 rounded-xl flex items-center gap-2.5 text-left text-[15px] text-foreground active:bg-fill">
                                <span className={cn('h-5 w-5 rounded-md border flex items-center justify-center shrink-0', si ? 'bg-foreground border-foreground text-background' : 'border-hairline-strong')}>
                                    {si && <Check className="h-3.5 w-3.5" />}
                                </span>
                                {tipo ? <PildoraValor tipo={tipo} valor={g} className="h-7 px-2.5 text-[13.5px] min-w-0 overflow-hidden" /> : <span className="truncate">{g}</span>}
                            </button>
                            {onColor && (
                                <button onClick={() => onColor(g)} aria-label={`Color${tipo === 'grupo' ? ' e icono' : ''} de ${g}`}
                                    className="pulsable h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-muted-foreground active:bg-fill"><Palette className="h-4 w-4" /></button>
                            )}
                        </div>
                    );
                })}
            </div>
            {nuevo === null ? (
                <button onClick={() => setNuevo('')} className="mt-1 h-10 px-2 rounded-xl flex items-center gap-2 text-[15px] font-semibold text-muted-foreground">
                    <Plus className="h-4 w-4" /> Nuevo
                </button>
            ) : (
                <form className="mt-2 flex gap-1.5" onSubmit={e => { e.preventDefault(); const g = nuevo.trim().slice(0, 40); if (g && !elegidos.includes(g)) cambiar([...elegidos, g]); setNuevo(null); }}>
                    <input autoFocus value={nuevo} onChange={e => setNuevo(e.target.value)} placeholder={tipo === 'grupo' ? 'Nombre del grupo' : 'Nueva'}
                        className="flex-1 min-w-0 h-9 px-3 rounded-full bg-fill text-[15px] text-foreground outline-none" />
                    <button type="submit" aria-label="Añadir" className="pulsable h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center"><Check className="h-4 w-4" /></button>
                </form>
            )}
            <PieColores onColores={onColores} texto={tipo ? undefined : 'Renombrar o borrar la columna'} />
        </div>
    );
}

// Un número o un texto de una columna propia
function EscribirExtra({ campo, actual, onPoner }: { campo: CampoPropio; actual: string; onPoner: (t: string) => void }) {
    const [t, setT] = useState(actual);
    return (
        <form onSubmit={e => { e.preventDefault(); onPoner(t); }}>
            <p className="px-1 pb-1.5 text-[13px] font-semibold text-muted-foreground">{campo.nombre}</p>
            <div className="flex gap-1.5">
                <input autoFocus value={t} onChange={e => setT(e.target.value)} inputMode={campo.tipo === 'numero' ? 'decimal' : undefined} aria-label={campo.nombre}
                    className="flex-1 min-w-0 h-9 px-3 rounded-full bg-fill text-[16px] text-foreground outline-none" />
                <button type="submit" aria-label="Poner" className="pulsable h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center"><Check className="h-4 w-4" /></button>
            </div>
            {actual && <button type="button" onClick={() => onPoner('')} className="mt-2 w-full h-9 rounded-full text-[14px] text-muted-foreground">Quitar</button>}
        </form>
    );
}

// El «+» de la ficha: lo que no está a la vista (etiquetas y tus columnas)
function MasDatos({ campos, tieneEtiquetas, valor, onElegir, onGestionar }: {
    campos: CampoPropio[]; tieneEtiquetas: boolean; valor: (c: CampoPropio) => string; onElegir: (campo: `x:${string}` | 'etiquetas') => void; onGestionar: () => void;
}) {
    const fila = (key: string, icono: ReactNode, texto: string, onClick: () => void, ahora?: string) => (
        <button key={key} onClick={onClick} className="w-full h-10 px-2 rounded-xl flex items-center gap-2.5 text-left text-[15px] text-foreground active:bg-fill">
            <span className="h-7 w-7 shrink-0 rounded-lg bg-fill flex items-center justify-center text-foreground">{icono}</span>
            <span className="flex-1 min-w-0 truncate">{texto}</span>
            {ahora === 'Sí' ? <Check className="h-4 w-4 shrink-0 text-foreground" aria-label="marcada" /> : ahora && <span className="max-w-[45%] truncate text-[13px] text-muted-foreground">{ahora}</span>}
        </button>
    );
    return (
        <div>
            <p className="px-1 pb-1.5 text-[13px] font-semibold text-muted-foreground">Añadir a la ficha</p>
            {!tieneEtiquetas && fila('etiquetas', <Tag className="h-4 w-4" />, 'Etiquetas', () => onElegir('etiquetas'))}
            {campos.map(c => { const I = ICONO_TIPO[c.tipo]; return fila(c.id, <I className="h-4 w-4" />, c.nombre, () => onElegir(`x:${c.id}`), valor(c)); })}
            <button onClick={onGestionar} className="mt-1 w-full h-10 px-2 rounded-xl flex items-center gap-2.5 text-left text-[15px] font-semibold text-muted-foreground active:bg-fill">
                <span className="h-7 w-7 shrink-0 rounded-lg border border-dashed border-hairline-strong flex items-center justify-center"><Plus className="h-4 w-4" /></span>Nueva columna, colores…
            </button>
        </div>
    );
}

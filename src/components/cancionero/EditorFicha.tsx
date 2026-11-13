import { useId, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ExternalLink, Plus, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ESTADOS, nombreEnergia, nombreEstado, opcionesDe } from '../../lib/biblioteca';
import { leerDuracion, minutos } from '../../lib/cantar';
import type { Cancion, EstadoCancion, FichaCancion } from '../../types/cancionero';
import type { Pastel } from './estilo';
import { claseCampo } from './fichaResumen';

// Las piezas del formulario de la canción (13-nov, Víctor: «sale un menú gigante, no sé qué puedo
// editar aquí… falta estructura de la información»). Cada cosa en su bloque con título, lo que más
// se usa a la vista y lo opcional plegado; etiqueta → campo → ayuda, siempre en ese orden.

const chip = (activo: boolean) => cn('pulsable h-9 shrink-0 rounded-full px-3.5 text-[14px] font-semibold flex items-center gap-1 whitespace-nowrap',
    activo ? 'bg-foreground text-background' : 'bg-fill text-foreground');


// Un bloque del formulario: icono, título y, debajo, lo que lleva (plegado) o para qué sirve (abierto)
export function Bloque({ id, titulo, ayuda, resumen, icono: Icono, pastel, abierto, onAlternar, children }: {
    id: string; titulo: string; ayuda: string; resumen?: string; icono: LucideIcon; pastel: Pastel;
    abierto: boolean; onAlternar: () => void; children: ReactNode;
}) {
    return (
        <section id={`bloque-${id}`} aria-labelledby={`bloque-${id}-titulo`}
            className="scroll-mt-[calc(env(safe-area-inset-top)+7.5rem)] md:scroll-mt-32 rounded-[22px] border border-hairline bg-sheet">
            <h2 className="m-0">
                <button type="button" onClick={onAlternar} aria-expanded={abierto} aria-controls={`bloque-${id}-cuerpo`}
                    className="pulsable w-full flex items-center gap-3 rounded-[22px] p-3.5 md:p-4 text-left">
                    <span className={cn('h-10 w-10 shrink-0 rounded-[12px] flex items-center justify-center', pastel.fondo, pastel.tinta)} aria-hidden>
                        <Icono className="h-5 w-5" />
                    </span>
                    <span className="flex-1 min-w-0">
                        <span id={`bloque-${id}-titulo`} className="block text-[17px] font-bold leading-tight text-foreground">{titulo}</span>
                        <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">{abierto || !resumen ? ayuda : resumen}</span>
                    </span>
                    <ChevronDown className={cn('h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200', abierto && 'rotate-180')} aria-hidden />
                </button>
            </h2>
            {abierto && <div id={`bloque-${id}-cuerpo`} className="px-3.5 md:px-4 pb-4 space-y-4">{children}</div>}
        </section>
    );
}

// Etiqueta → campo → ayuda. Con `para`, la etiqueta es un <label> de ese campo; sin él, un grupo
export function Campo({ etiqueta, para, ayuda, children, className }: {
    etiqueta: string; para?: string; ayuda?: ReactNode; children: ReactNode; className?: string;
}) {
    const id = useId();
    return (
        <div className={className} role={para ? undefined : 'group'} aria-labelledby={para ? undefined : id}>
            {para
                ? <label htmlFor={para} className="mb-1.5 block text-[14px] font-semibold text-foreground">{etiqueta}</label>
                : <p id={id} className="mb-1.5 text-[14px] font-semibold text-foreground">{etiqueta}</p>}
            {children}
            {ayuda && <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{ayuda}</p>}
        </div>
    );
}

// Lo opcional de un bloque: una línea que se abre (abierta de entrada si ya tiene algo)
export function Plegado({ etiqueta, inicial, children }: { etiqueta: string; inicial: boolean; children: ReactNode }) {
    const [abierto, setAbierto] = useState(inicial);
    const id = useId();
    return (
        <div className="border-t border-hairline pt-3">
            <button type="button" onClick={() => setAbierto(a => !a)} aria-expanded={abierto} aria-controls={id}
                className="pulsable -mx-1 h-9 px-1 flex items-center gap-1.5 rounded-full text-[14px] font-semibold text-muted-foreground">
                <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', !abierto && '-rotate-90')} aria-hidden />
                {etiqueta}
            </button>
            {abierto && <div id={id} className="mt-2 space-y-4">{children}</div>}
        </div>
    );
}

// Elegir entre lo que ya usas (quién canta, grupos, estilos) o escribir uno nuevo
function Elegir({ valores, elegidos, onAlternar, nuevo, multiple }: {
    valores: string[]; elegidos: string[]; onAlternar: (v: string) => void; nuevo: string; multiple?: boolean;
}) {
    const [escribiendo, setEscribiendo] = useState(false);
    const [texto, setTexto] = useState('');
    const todos = [...new Set([...valores, ...elegidos])];
    const meter = () => {
        const v = texto.trim().slice(0, 40);
        if (v && !elegidos.includes(v)) onAlternar(v);
        setTexto('');
        setEscribiendo(false);
    };
    return (
        <div className="flex flex-wrap gap-2">
            {todos.map(v => (
                <button key={v} type="button" onClick={() => onAlternar(v)} aria-pressed={elegidos.includes(v)} className={chip(elegidos.includes(v))}>{v}</button>
            ))}
            {escribiendo ? (
                <input autoFocus value={texto} onChange={e => setTexto(e.target.value)} onBlur={meter} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); meter(); } }}
                    placeholder={nuevo} aria-label={nuevo} className="h-9 w-40 rounded-full bg-fill px-3.5 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            ) : (
                <button type="button" onClick={() => setEscribiendo(true)} aria-label={nuevo} className={cn(chip(false), 'border border-dashed border-hairline-strong bg-transparent text-muted-foreground')}>
                    <Plus className="h-4 w-4" /> {multiple || !todos.length ? nuevo : 'Otro'}
                </button>
            )}
        </div>
    );
}

// Uno entre los de siempre; si la ficha trae uno propio (energía o estado con su nombre), sale también
function UnoDeLista<T extends string | number>({ opciones, actual, nombre, onElegir, columnas }: {
    opciones: readonly T[]; actual: T | string | undefined; nombre: (v: T | string) => string; onElegir: (v: T | string | undefined) => void; columnas: string;
}) {
    const propio = actual !== undefined && actual !== '' && !opciones.some(o => o === actual) ? actual : undefined;
    return (
        <div className={cn('grid gap-1.5', columnas)}>
            {opciones.map(o => (
                <button key={String(o)} type="button" onClick={() => onElegir(actual === o ? undefined : o)} aria-pressed={actual === o}
                    className={cn(chip(actual === o), 'justify-center px-2 text-[13px]')}>{nombre(o)}</button>
            ))}
            {propio !== undefined && (
                <button type="button" onClick={() => onElegir(undefined)} aria-pressed className={cn(chip(true), 'justify-center px-2 text-[13px]')}>{nombre(propio)}</button>
            )}
        </div>
    );
}

// ---- La música: tono, cejilla, tempo y duración ----
export function FichaMusica({ ficha, onCambio, tonoDetectado, bpm, onBpm, duracion, onDuracion }: {
    ficha: FichaCancion;
    onCambio: (f: FichaCancion) => void;
    tonoDetectado?: string | null;
    bpm?: number;
    onBpm: (n: number | undefined) => void;
    duracion?: number;
    onDuracion: (s: number | undefined) => void;
}) {
    const id = useId();
    const poner = (cambio: Partial<FichaCancion>) => onCambio({ ...ficha, ...cambio });
    // El tempo se escribe a gusto y se da por bueno al salir (si no, «1» de «120» lo borraba)
    const [tempo, setTempo] = useState(bpm ? String(bpm) : '');
    const fijarTempo = () => { const n = parseInt(tempo, 10); onBpm(n >= 30 && n <= 260 ? n : undefined); if (!(n >= 30 && n <= 260)) setTempo(''); };
    // La duración de TU versión, en minutos:segundos («3:42»)
    const [dura, setDura] = useState(duracion ? minutos(duracion) : '');
    const fijarDura = () => { const s = leerDuracion(dura); onDuracion(s ?? undefined); setDura(s ? minutos(s) : ''); };

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Campo etiqueta="Tono" para={`${id}-tono`}>
                    <input id={`${id}-tono`} value={ficha.tono ?? ''} onChange={e => poner({ tono: e.target.value.replace(/\s+/g, '').slice(0, 12) || undefined })}
                        placeholder={tonoDetectado ?? 'Bm'} autoCapitalize="characters" className={cn(claseCampo, 'font-bold placeholder:font-medium')} />
                </Campo>
                <Campo etiqueta="Cejilla y formas" para={`${id}-capo`}>
                    <input id={`${id}-capo`} value={ficha.capo ?? ''} onChange={e => poner({ capo: e.target.value.slice(0, 60) || undefined })}
                        placeholder="Capo 2 · formas de Am" className={claseCampo} />
                </Campo>
                <Campo etiqueta="Tempo (bpm)" para={`${id}-bpm`}>
                    <input id={`${id}-bpm`} value={tempo} inputMode="numeric" onChange={e => setTempo(e.target.value.replace(/\D/g, '').slice(0, 3))} onBlur={fijarTempo}
                        placeholder="120" className={claseCampo} />
                </Campo>
                <Campo etiqueta="Duración" para={`${id}-dura`}>
                    <input id={`${id}-dura`} value={dura} inputMode="decimal" onChange={e => setDura(e.target.value.slice(0, 6))} onBlur={fijarDura}
                        placeholder="3:42" aria-describedby={`${id}-dura-ayuda`} className={claseCampo} />
                </Campo>
            </div>
            {tonoDetectado && !ficha.tono && (
                <button type="button" onClick={() => poner({ tono: tonoDetectado })} className="pulsable -mt-1 h-9 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground">
                    Por los acordes suena en {tonoDetectado}: usarlo
                </button>
            )}
            <p id={`${id}-dura-ayuda`} className="-mt-1 text-[13px] leading-snug text-muted-foreground">
                El tono es el que suena, aunque toques con cejilla. El tempo marca la claqueta y el modo auto; la duración, la de tu versión, cuenta en lo que dura el repertorio.
            </p>
            <Plegado etiqueta="Otro tono en que también la tocáis" inicial={!!ficha.tonoAlt}>
                <Campo etiqueta="También en" para={`${id}-alt`} ayuda="Sale en la ficha como «Tono G · también A».">
                    <input id={`${id}-alt`} value={ficha.tonoAlt ?? ''} onChange={e => poner({ tonoAlt: e.target.value.replace(/\s+/g, '').slice(0, 12) || undefined })}
                        placeholder="A" autoCapitalize="characters" className={cn(claseCampo, 'md:max-w-[200px] font-bold placeholder:font-medium')} />
                </Campo>
            </Plegado>
        </>
    );
}

// ---- Para el bolo: quién canta, con qué grupo, estilo, energía, estado y etiquetas ----
export function FichaBolo({ ficha, onCambio, canciones }: { ficha: FichaCancion; onCambio: (f: FichaCancion) => void; canciones: Cancion[] }) {
    const valores = useMemo(() => ({
        canta: opcionesDe(canciones, 'canta', () => null).map(o => o.valor),
        proyectos: opcionesDe(canciones, 'proyectos', () => null).map(o => o.valor),
        estilos: opcionesDe(canciones, 'estilos', () => null).map(o => o.valor),
        etiquetas: opcionesDe(canciones, 'etiquetas', () => null).map(o => o.valor),
    }), [canciones]);
    const poner = (cambio: Partial<FichaCancion>) => onCambio({ ...ficha, ...cambio });
    const unico = (actual: string | undefined, v: string) => (actual === v ? undefined : v);
    const alternar = (l: string[] | undefined, v: string) => { const sin = (l ?? []).filter(x => x !== v); return (l ?? []).includes(v) ? (sin.length ? sin : undefined) : [...(l ?? []), v].slice(0, 30); };

    return (
        <>
            <Campo etiqueta="Canta">
                <Elegir valores={valores.canta} elegidos={ficha.canta ? [ficha.canta] : []} nuevo="Quién canta" onAlternar={v => poner({ canta: unico(ficha.canta, v) })} />
            </Campo>
            <Campo etiqueta="Grupo" ayuda="Puede ir en varios.">
                <Elegir valores={valores.proyectos} elegidos={ficha.proyectos ?? []} nuevo="Grupo o formación" multiple onAlternar={v => poner({ proyectos: alternar(ficha.proyectos, v) })} />
            </Campo>
            <Campo etiqueta="Estilo">
                <Elegir valores={valores.estilos} elegidos={ficha.estilo ? [ficha.estilo] : []} nuevo="Estilo" onAlternar={v => poner({ estilo: unico(ficha.estilo, v) })} />
            </Campo>
            <Plegado etiqueta="Energía, estado y etiquetas" inicial={!!ficha.energia || !!ficha.estado || !!ficha.etiquetas?.length}>
                <Campo etiqueta="Energía" ayuda="Para ordenar el bolo de menos a más.">
                    <UnoDeLista opciones={[1, 2, 3, 4] as const} actual={ficha.energia} nombre={v => nombreEnergia(v) || String(v)} columnas="grid-cols-2 md:grid-cols-4 md:max-w-xl"
                        onElegir={v => poner({ energia: v })} />
                </Campo>
                <Campo etiqueta="Estado">
                    <UnoDeLista opciones={Object.keys(ESTADOS) as EstadoCancion[]} actual={ficha.estado} nombre={v => nombreEstado(String(v))} columnas="grid-cols-3 md:max-w-xl"
                        onElegir={v => poner({ estado: v === undefined ? undefined : String(v) })} />
                </Campo>
                <Campo etiqueta="Etiquetas" ayuda="Las tuyas, para buscarla: «Bodas», «Tardeo», «Flamencas»…">
                    <Elegir valores={valores.etiquetas} elegidos={ficha.etiquetas ?? []} nuevo="Nueva etiqueta" multiple onAlternar={v => poner({ etiquetas: alternar(ficha.etiquetas, v) })} />
                </Campo>
            </Plegado>
        </>
    );
}

// ---- Enlaces: la web con sus acordes ----
export function FichaEnlace({ ficha, onCambio }: { ficha: FichaCancion; onCambio: (f: FichaCancion) => void }) {
    const id = useId();
    const valido = !!ficha.enlace && /^https?:\/\//i.test(ficha.enlace);
    return (
        <Campo etiqueta="Página de sus acordes" para={`${id}-enlace`} ayuda="Sale en la ficha como «Sus acordes» y se abre con un toque.">
            <div className="flex items-center gap-2">
                <input id={`${id}-enlace`} value={ficha.enlace ?? ''} onChange={e => onCambio({ ...ficha, enlace: e.target.value.trim().slice(0, 500) || undefined })}
                    placeholder="https://acordes.lacuerda.net/…" inputMode="url" autoCapitalize="none" className={cn(claseCampo, 'flex-1 min-w-0')} />
                {valido && (
                    <a href={ficha.enlace} target="_blank" rel="noopener noreferrer" aria-label="Abrir la página de sus acordes"
                        className="pulsable h-11 w-11 shrink-0 rounded-xl bg-fill flex items-center justify-center text-foreground"><ExternalLink className="h-4 w-4" /></a>
                )}
            </div>
        </Campo>
    );
}

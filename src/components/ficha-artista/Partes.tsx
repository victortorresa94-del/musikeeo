// Piezas de la ficha pública de artista (concepto B): la tarjeta de vídeo, las tarjetas con
// objeto 3D, las pestañas, la tira de dos semanas y el calendario del mes.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Clock, Pause, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { OBJETO_3D } from '../../config/objetos3d';
import { claveDia, euros, hoy, masDias, type Paquete, type Tarjeta } from './datos';

export const SOMBRA_3D = 'object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]';

/** Arriba: el clip en bucle y sin sonido (con su póster y un botón de play/pausa); sin clip, la
 *  foto de portada; sin foto, la guitarra 3D. Si el usuario pide menos movimiento, no arranca solo */
export function Portada({ clipUrl, poster, foto, nombre, children }: {
    clipUrl?: string; poster?: string; foto?: string; nombre: string; children?: ReactNode;
}) {
    const reduceMotion = useReducedMotion();
    const ref = useRef<HTMLVideoElement>(null);
    const [sonando, setSonando] = useState(false);
    const [clipRoto, setClipRoto] = useState(false);
    const [fotoRota, setFotoRota] = useState(false);
    const conClip = !!clipUrl && !clipRoto;

    useEffect(() => {
        const v = ref.current;
        if (!v || !conClip) return;
        v.muted = true;  // React no siempre pone el atributo: sin él, el navegador no deja arrancar solo
        if (!reduceMotion) v.play().catch(() => setSonando(false));
    }, [conClip, reduceMotion]);

    const alternar = () => {
        const v = ref.current;
        if (!v) return;
        if (v.paused) v.play().catch(() => undefined); else v.pause();
    };

    const imagen = !fotoRota ? (foto || poster) : undefined;

    return (
        <div className="relative aspect-[16/10] md:aspect-[16/9] overflow-hidden rounded-[24px] md:rounded-[28px] bg-fill">
            {conClip ? (
                <video
                    ref={ref}
                    src={clipUrl}
                    poster={poster || foto}
                    muted
                    loop
                    playsInline
                    autoPlay={!reduceMotion}
                    preload="metadata"
                    onPlay={() => setSonando(true)}
                    onPause={() => setSonando(false)}
                    onError={() => setClipRoto(true)}
                    aria-label={`Clip de ${nombre}`}
                    className="h-full w-full object-cover"
                />
            ) : imagen ? (
                <img src={imagen} alt={nombre} onError={() => setFotoRota(true)} className="h-full w-full object-cover" />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <img src={OBJETO_3D.guitarra} alt="" loading="lazy" className={cn('h-[62%] w-[62%]', SOMBRA_3D)} />
                </div>
            )}

            {conClip && (
                sonando ? (
                    <button
                        type="button"
                        onClick={alternar}
                        aria-label="Pausar el clip"
                        className="pulsable absolute bottom-3 left-3 h-10 w-10 rounded-full bg-sheet text-foreground shadow-e2 flex items-center justify-center"
                    >
                        <Pause className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={0} />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={alternar}
                        aria-label="Reproducir el clip"
                        className="pulsable absolute inset-0 m-auto h-16 w-16 rounded-full bg-sheet text-foreground shadow-e2 flex items-center justify-center"
                    >
                        <Play className="h-7 w-7 ml-1" fill="currentColor" strokeWidth={0} />
                    </button>
                )
            )}
            {children}
        </div>
    );
}

/** El avatar redondo que pisa el borde de la tarjeta de vídeo */
export function Avatar({ foto, nombre }: { foto?: string; nombre: string }) {
    const [roto, setRoto] = useState(false);
    return (
        <span className="relative z-10 mx-auto -mt-12 md:-mt-14 h-24 w-24 md:h-28 md:w-28 rounded-full p-1 bg-background shadow-e2 flex">
            <span className="h-full w-full rounded-full overflow-hidden bg-fill-strong flex items-center justify-center text-[34px] font-bold text-foreground">
                {foto && !roto
                    ? <img src={foto} alt="" onError={() => setRoto(true)} className="h-full w-full object-cover" />
                    : nombre.slice(0, 1).toUpperCase()}
            </span>
        </span>
    );
}

/** Una fila de hasta cuatro tarjetas, cada una con su objeto 3D, que asoma por arriba */
export function TarjetasArtista({ tarjetas }: { tarjetas: Tarjeta[] }) {
    const reduceMotion = useReducedMotion();
    if (!tarjetas.length) return null;
    return (
        <div className="mt-5 pt-4 flex justify-center gap-2 md:gap-3">
            {tarjetas.map((t, i) => (
                <div
                    key={t.id}
                    className="relative basis-1/4 min-w-0 rounded-[18px] bg-card border border-hairline shadow-e1 px-1.5 pt-[54px] pb-3 md:pt-[92px] md:pb-4 text-center"
                >
                    <motion.img
                        src={t.objeto}
                        alt=""
                        loading="lazy"
                        initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.05 + i * 0.06 }}
                        className={cn('pointer-events-none absolute inset-x-0 mx-auto -top-4 h-[66px] w-[66px] md:-top-3 md:h-[96px] md:w-[96px]', SOMBRA_3D)}
                    />
                    <p className="text-[13px] md:text-[15px] font-semibold leading-tight text-foreground text-balance break-words">{t.texto}</p>
                </div>
            ))}
        </div>
    );
}

/** Control segmentado: gris, el elegido en negro (blanco en oscuro) */
export function Pestanas<T extends string>({ opciones, valor, onCambio }: {
    opciones: { id: T; nombre: string }[]; valor: T; onCambio: (id: T) => void;
}) {
    const reduceMotion = useReducedMotion();
    return (
        <div role="tablist" aria-label="Secciones de la ficha" className="mt-5 flex rounded-full bg-fill p-1">
            {opciones.map(o => {
                const activa = o.id === valor;
                return (
                    <button
                        key={o.id}
                        type="button"
                        role="tab"
                        id={`pestana-${o.id}`}
                        aria-selected={activa}
                        aria-controls={`panel-${o.id}`}
                        onClick={() => onCambio(o.id)}
                        className={cn(
                            'relative flex-1 h-9 rounded-full text-[15px] font-semibold',
                            activa ? 'text-background' : 'text-muted-foreground',
                        )}
                    >
                        {activa && (
                            <motion.span
                                layoutId="pestana-artista"
                                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
                                className="absolute inset-0 rounded-full bg-foreground"
                            />
                        )}
                        <span className="relative">{o.nombre}</span>
                    </button>
                );
            })}
        </div>
    );
}

const diaCorto = (d: Date) => {
    const s = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
    return s.charAt(0).toUpperCase() + s.slice(1, 3);
};

/** Las próximas dos semanas, con un punto en los días libres */
export function TiraDias({ estados }: { estados: Map<string, string> }) {
    const inicio = hoy();
    const dias = Array.from({ length: 14 }, (_, i) => masDias(inicio, i));
    const libres = dias.filter(d => estados.get(claveDia(d)) === 'available').length;
    return (
        <div>
            <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto hide-scrollbar">
                <ol className="flex gap-1.5 min-w-max md:min-w-0 md:grid md:grid-cols-[repeat(14,minmax(0,1fr))]">
                    {dias.map(d => {
                        const libre = estados.get(claveDia(d)) === 'available';
                        return (
                            <li
                                key={claveDia(d)}
                                aria-label={`${d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}${libre ? ', libre' : ''}`}
                                className="w-[46px] md:w-auto h-[64px] rounded-[12px] bg-card border border-hairline flex flex-col items-center justify-center"
                            >
                                <span className="text-[11px] leading-none text-muted-foreground">{diaCorto(d)}</span>
                                <span className={cn('mt-1 text-[16px] leading-none font-semibold', libre ? 'text-foreground' : 'text-muted-foreground')}>{d.getDate()}</span>
                                <span className={cn('mt-1.5 h-1.5 w-1.5 rounded-full', libre ? 'bg-foreground' : 'bg-transparent')} />
                            </li>
                        );
                    })}
                </ol>
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground">
                {libres > 0
                    ? <>El punto marca los días libres. Si tu fecha no sale, pregunta igualmente.</>
                    : <>No ha marcado días libres en estas dos semanas. Pregunta por tu fecha igualmente.</>}
            </p>
        </div>
    );
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** El calendario del mes (el que ya tenía la ficha), con los días libres y los ocupados */
export function CalendarioMes({ estados }: { estados: Map<string, string> }) {
    const [mes, setMes] = useState(() => { const d = hoy(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const year = mes.getFullYear();
    const month = mes.getMonth();
    const primero = new Date(year, month, 1).getDay();
    const hueco = primero === 0 ? 6 : primero - 1;
    const diasMes = new Date(year, month + 1, 0).getDate();
    const celdas: (Date | null)[] = [
        ...Array.from({ length: hueco }, () => null),
        ...Array.from({ length: diasMes }, (_, i) => new Date(year, month, i + 1)),
    ];
    const hoyClave = claveDia(hoy());

    return (
        <div className="rounded-[18px] bg-card border border-hairline shadow-e1 p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[17px] font-bold text-foreground">{MESES[month].charAt(0).toUpperCase() + MESES[month].slice(1)} de {year}</h3>
                <div className="flex gap-1">
                    <button type="button" onClick={() => setMes(new Date(year, month - 1, 1))} aria-label="Mes anterior"
                        className="pulsable h-9 w-9 rounded-full bg-fill text-foreground flex items-center justify-center">
                        <ChevronLeft className="h-[18px] w-[18px]" />
                    </button>
                    <button type="button" onClick={() => setMes(new Date(year, month + 1, 1))} aria-label="Mes siguiente"
                        className="pulsable h-9 w-9 rounded-full bg-fill text-foreground flex items-center justify-center">
                        <ChevronRight className="h-[18px] w-[18px]" />
                    </button>
                </div>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <span key={d} className="py-1 text-[12px] text-muted-foreground">{d}</span>
                ))}
                {celdas.map((d, i) => {
                    if (!d) return <span key={`h${i}`} />;
                    const clave = claveDia(d);
                    const estado = estados.get(clave);
                    const libre = estado === 'available';
                    const ocupado = estado === 'occupied' || estado === 'blocked';
                    return (
                        <span
                            key={clave}
                            className={cn(
                                'aspect-square rounded-[10px] flex flex-col items-center justify-center text-[14px]',
                                libre ? 'bg-fill text-foreground font-semibold' : ocupado ? 'text-muted-foreground line-through' : 'text-muted-foreground',
                                clave === hoyClave && 'ring-1 ring-foreground',
                            )}
                        >
                            {d.getDate()}
                            <span className={cn('h-1 w-1 rounded-full', libre ? 'bg-foreground' : 'bg-transparent')} />
                        </span>
                    );
                })}
            </div>
            <div className="mt-3 pt-3 border-t border-hairline flex items-center gap-4 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-foreground" /> Libre</span>
                {[...estados.values()].some(e => e === 'occupied' || e === 'blocked') && <span>Tachado, ocupado</span>}
            </div>
        </div>
    );
}

/** Un paquete: nombre, precio, duración y lo que incluye */
export function TarjetaPaquete({ p, onPedir }: { p: Paquete; onPedir?: () => void }) {
    return (
        <div className="rounded-[18px] bg-card border border-hairline shadow-e1 p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-[17px] font-bold leading-tight text-foreground break-words">{p.nombre}</h3>
                    {p.duracion && (
                        <p className="mt-1 flex items-center gap-1 text-[14px] text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" /> {p.duracion}
                        </p>
                    )}
                </div>
                {p.precio !== null && <p className="shrink-0 text-[20px] font-bold leading-tight text-foreground">{euros(p.precio)}</p>}
            </div>
            {p.descripcion && <p className="mt-2 text-[15px] leading-snug text-muted-foreground break-words">{p.descripcion}</p>}
            {p.incluye.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                    {p.incluye.map(x => (
                        <li key={x} className="flex items-start gap-2 text-[15px] leading-snug text-foreground">
                            <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} /> <span className="min-w-0 break-words">{x}</span>
                        </li>
                    ))}
                </ul>
            )}
            {onPedir && (
                <button type="button" onClick={onPedir}
                    className="pulsable mt-4 h-9 px-4 rounded-full bg-fill text-foreground text-[14px] font-semibold">
                    Pedir este paquete
                </button>
            )}
        </div>
    );
}

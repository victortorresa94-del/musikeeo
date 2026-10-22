import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ClipboardList, MapPin, Navigation, Truck, Wallet, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Fila, Seccion, Sitio, Tarjeta } from './ficha';

const SOMBRA_3D = 'object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]';

/** Arriba (concepto B): una rejilla 2×2 de tarjetas, cada una con su objeto 3D y dos o tres líneas.
 *  En el PC, el objeto a la izquierda y el texto al lado, como en el sueño. En el móvil no cabe el
 *  texto al lado: el objeto asoma por encima de la tarjeta (como «Por momento» en Explorar), el
 *  título va junto a él y las líneas debajo, a lo ancho. Si quedan impares, la última ocupa la fila */
export function TarjetasResumen({ tarjetas }: { tarjetas: Tarjeta[] }) {
    const reduceMotion = useReducedMotion();
    if (!tarjetas.length) return null;
    return (
        <div className="mt-3 pt-4 md:mt-4 md:pt-0 grid grid-cols-2 gap-x-2.5 gap-y-6 md:gap-3">
            {tarjetas.map((t, i) => {
                // La que se queda sola ocupa la fila: con sitio de sobra, también en el móvil va como en el sueño
                const ancha = tarjetas.length % 2 === 1 && i === tarjetas.length - 1;
                return (
                    <div
                        key={t.id}
                        className={cn(
                            'relative rounded-[18px] bg-card border border-hairline shadow-e1 md:p-4 md:min-h-[120px] md:flex md:items-center md:gap-3.5',
                            ancha ? 'col-span-2 flex items-center gap-3 p-3' : 'px-3 pt-2 pb-3',
                        )}
                    >
                        <motion.img
                            src={t.objeto}
                            alt=""
                            loading="lazy"
                            initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.05 + i * 0.06 }}
                            className={cn(
                                'pointer-events-none md:static md:h-[84px] md:w-[84px] md:shrink-0',
                                ancha ? 'h-[64px] w-[64px] shrink-0' : 'absolute -top-5 left-1.5 h-[60px] w-[52px]',
                                SOMBRA_3D,
                            )}
                        />
                        <div className={cn('min-w-0 md:flex-1', ancha && 'flex-1')}>
                            <p className={cn(
                                'text-[15px] md:text-[17px] font-bold leading-tight text-foreground',
                                !ancha && 'pl-[54px] md:pl-0 min-h-[34px] md:min-h-0 flex items-center md:block',
                            )}>
                                {t.titulo}
                            </p>
                            {t.lineas.map((l, j) => (
                                <p key={j} className="mt-1 text-[13px] md:text-[14px] leading-[1.3] text-muted-foreground break-words line-clamp-3">{l}</p>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/** Una sección de abajo (concepto A): su icono en un círculo, el título y lo que lleve.
 *  En el PC el icono hace de columna a la izquierda; en el móvil va junto al título y las filas
 *  aprovechan todo el ancho */
function Bloque({ id, icono: Icono, titulo, children }: { id: string; icono: LucideIcon; titulo: string; children: ReactNode }) {
    return (
        <section id={id} className="grid grid-cols-[40px_minmax(0,1fr)] md:grid-cols-[44px_minmax(0,1fr)] gap-x-3 md:gap-x-4 py-5 border-t border-hairline scroll-mt-20">
            <span className="md:row-span-2 h-10 w-10 md:h-11 md:w-11 rounded-full bg-fill text-foreground flex items-center justify-center">
                <Icono className="h-[19px] w-[19px] md:h-5 md:w-5" strokeWidth={2} />
            </span>
            <h2 className="self-center text-[19px] font-bold leading-7 text-foreground">{titulo}</h2>
            <div className="col-span-2 md:col-span-1 md:col-start-2 min-w-0">{children}</div>
        </section>
    );
}

/** Filas de etiqueta gris → valor negro */
function Filas({ filas }: { filas: Fila[] }) {
    if (!filas.length) return null;
    return (
        <dl className="mt-3 md:mt-2 space-y-2">
            {filas.map(f => (
                <div key={f.etiqueta} className="grid grid-cols-[132px_minmax(0,1fr)] md:grid-cols-[160px_minmax(0,1fr)] gap-x-3">
                    <dt className="text-[15px] leading-snug text-muted-foreground">{f.etiqueta}</dt>
                    <dd className="text-[15px] leading-snug text-foreground break-words">{f.valor}</dd>
                </div>
            ))}
        </dl>
    );
}

const ICONO: Record<Seccion['id'], LucideIcon> = { buscan: ClipboardList, logistica: Truck, dinero: Wallet };

export function SeccionesBolo({ secciones, sitio }: { secciones: Seccion[]; sitio: Sitio | null }) {
    if (!secciones.length && !sitio) return null;
    return (
        <div className="mt-6">
            {secciones.map(s => (
                <Bloque key={s.id} id={s.id} icono={ICONO[s.id]} titulo={s.titulo}>
                    <Filas filas={s.filas} />
                    {s.parrafo && (
                        <p className={cn('text-[15px] leading-relaxed text-foreground/80 whitespace-pre-wrap break-words', s.filas.length ? 'mt-3' : 'mt-3 md:mt-1.5')}>
                            {s.parrafo}
                        </p>
                    )}
                </Bloque>
            ))}

            {/* El sitio: sin mapa pintado; «Cómo llegar» abre Google Maps */}
            {sitio && (
                <Bloque id="sitio" icono={MapPin} titulo="El sitio">
                    <p className="mt-3 md:mt-1.5 text-[16px] font-semibold leading-snug text-foreground break-words">{sitio.principal}</p>
                    {sitio.lineas.map(l => (
                        <p key={l} className="mt-0.5 text-[15px] leading-snug text-muted-foreground break-words">{l}</p>
                    ))}
                    <a
                        href={sitio.mapa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pulsable mt-3 inline-flex h-9 px-4 rounded-full bg-fill text-foreground text-[14px] font-semibold items-center gap-1.5"
                    >
                        <Navigation className="h-4 w-4" /> Cómo llegar
                    </a>
                </Bloque>
            )}
        </div>
    );
}

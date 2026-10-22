// La hoja de filtros (concepto B): Dónde, Cuándo, Precio, Estilo, Formación, Extras…
// según el tipo de categoría y solo con lo que hay en los datos. En el móvil va en una
// hoja inferior (con un borrador y «Ver N bandas»); en el PC, en la columna izquierda.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import * as Slider from '@radix-ui/react-slider';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Categoria } from '../../config/categorias';
import {
    ESTADOS, EXTRAS, FORMACIONES, TIPOS, cuantos, sinFiltros, euros, isoDia, nombreFecha, nombrePrecio,
    type Facetas, type Filtros,
} from './filtros';

export type Seccion = 'donde' | 'cuando' | 'precio' | 'estilo' | 'formacion' | 'ideal' | 'extras' | 'servicios' | 'equipo' | 'tipo' | 'estado';

export const Chip = ({ activo, onClick, children, className }: { activo: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => (
    <button type="button" onClick={onClick} aria-pressed={activo}
        className={cn('pulsable shrink-0 h-9 px-3.5 rounded-full text-[14px] font-semibold', activo ? 'bg-foreground text-background' : 'bg-fill text-foreground', className)}>
        {children}
    </button>
);

export function Interruptor({ activo, onChange, etiqueta }: { activo: boolean; onChange: (v: boolean) => void; etiqueta: string }) {
    return (
        <button type="button" role="switch" aria-checked={activo} onClick={() => onChange(!activo)}
            className="pulsable w-full min-h-[48px] flex items-center justify-between gap-3 text-left">
            <span className="text-[15px] text-foreground">{etiqueta}</span>
            <span className={cn('relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors', activo ? 'bg-foreground' : 'bg-fill-strong')}>
                <span className={cn('absolute top-[2px] left-[2px] h-[26px] w-[26px] rounded-full bg-background shadow-e1 transition-transform', activo ? 'translate-x-5' : 'dark:bg-foreground')} />
            </span>
        </button>
    );
}

const alternar = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter(y => y !== x) : [...xs, x]);

function Bloque({ id, titulo, children }: { id: Seccion; titulo: string; children: React.ReactNode }) {
    return (
        <section id={`filtro-${id}`} className="py-4 border-b border-hairline last:border-b-0 scroll-mt-4">
            <h3 className="text-[18px] font-bold text-foreground">{titulo}</h3>
            <div className="mt-2.5">{children}</div>
        </section>
    );
}

// Alturas del histograma en clases (sin estilos en línea): la primera es una barra vacía
const ALTOS = ['h-[6%]', 'h-[24%]', 'h-[36%]', 'h-[48%]', 'h-[60%]', 'h-[72%]', 'h-[86%]', 'h-full'];

/** El rango doble de precio, con el histograma de los precios que hay */
function Precio({ precios, f, onChange }: { precios: number[]; f: Filtros; onChange: (f: Filtros) => void }) {
    const paso = Math.max(...precios) > 1000 ? 50 : 10;
    const lo = Math.floor(Math.min(...precios) / paso) * paso;
    const hi = Math.ceil(Math.max(...precios) / paso) * paso;
    const v: [number, number] = [Math.max(lo, Math.min(f.min ?? lo, hi)), Math.min(hi, Math.max(f.max ?? hi, lo))];
    const BARRAS = 16;
    const barras = useMemo(() => {
        const c = Array(BARRAS).fill(0) as number[];
        precios.forEach(p => { c[Math.min(BARRAS - 1, Math.floor(((p - lo) / (hi - lo || 1)) * BARRAS))]++; });
        const m = Math.max(...c, 1);
        return c.map(n => n / m);
    }, [precios, lo, hi]);
    return (
        <div className="px-1">
            <div className="h-10 flex items-end gap-[3px]" aria-hidden>
                {barras.map((h, i) => {
                    const desde = lo + ((hi - lo) * i) / BARRAS, hasta = lo + ((hi - lo) * (i + 1)) / BARRAS;
                    const dentro = hasta >= v[0] && desde <= v[1];
                    const alto = h ? ALTOS[Math.min(ALTOS.length - 1, 1 + Math.round(h * (ALTOS.length - 2)))] : ALTOS[0];
                    return <span key={i} className={cn('flex-1 rounded-[2px]', alto, dentro ? 'bg-muted-foreground/45' : 'bg-fill-strong')} />;
                })}
            </div>
            <Slider.Root className="relative mt-1 flex h-7 touch-none select-none items-center" min={lo} max={hi} step={paso} value={v} minStepsBetweenThumbs={1}
                onValueChange={([a, b]) => onChange({ ...f, min: a > lo ? a : null, max: b < hi ? b : null })} aria-label="Precio">
                <Slider.Track className="relative h-1 grow rounded-full bg-fill-strong">
                    <Slider.Range className="absolute h-full rounded-full bg-foreground" />
                </Slider.Track>
                <Slider.Thumb aria-label="Precio mínimo" className="block h-7 w-7 rounded-full bg-background dark:bg-foreground border border-hairline-strong shadow-e2 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30" />
                <Slider.Thumb aria-label="Precio máximo" className="block h-7 w-7 rounded-full bg-background dark:bg-foreground border border-hairline-strong shadow-e2 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30" />
            </Slider.Root>
            <p className="mt-1 text-center text-[15px] font-semibold text-foreground">
                {f.min === null && f.max === null ? `${euros(lo)} – ${euros(hi)}` : nombrePrecio(f.min !== null ? v[0] : lo, f.max !== null ? v[1] : hi)}
            </p>
        </div>
    );
}

function Cuando({ f, onChange }: { f: Filtros; onChange: (f: Filtros) => void }) {
    const propia = !!f.fecha && f.fecha !== 'sabado' && f.fecha !== 'finde';
    const [abierta, setAbierta] = useState(propia);
    const poner = (fecha: string | null) => onChange({ ...f, fecha });
    return (
        <>
            <div className="flex flex-wrap gap-2">
                <Chip activo={f.fecha === 'sabado'} onClick={() => { setAbierta(false); poner(f.fecha === 'sabado' ? null : 'sabado'); }}>Este sábado</Chip>
                <Chip activo={f.fecha === 'finde'} onClick={() => { setAbierta(false); poner(f.fecha === 'finde' ? null : 'finde'); }}>Este finde</Chip>
                <Chip activo={propia} onClick={() => { if (propia) { poner(null); setAbierta(false); } else setAbierta(!abierta); }}>
                    {propia ? nombreFecha(f.fecha!) : 'Elegir fecha'}
                </Chip>
            </div>
            {abierta && (
                <input type="date" min={isoDia(new Date())} value={propia ? f.fecha! : ''} aria-label="Elegir fecha"
                    onChange={e => poner(e.target.value || null)}
                    className="mt-2.5 w-full h-11 rounded-xl bg-fill px-3 text-[16px] text-foreground focus:outline-none" />
            )}
            <p className="mt-2 text-[13px] text-muted-foreground">Según el calendario que tiene cada uno en su ficha.</p>
        </>
    );
}

/** El cuerpo de los filtros: lo usan la hoja del móvil y la columna del PC */
export function PanelFiltros({ cat, fac, f, onChange }: { cat: Categoria; fac: Facetas; f: Filtros; onChange: (f: Filtros) => void }) {
    const precios = fac.precios.length >= 2 && Math.min(...fac.precios) !== Math.max(...fac.precios);
    // Lo elegido que no está en los datos (p. ej. lo pidió Rodrigo) también se ve, para poder quitarlo
    const con = (opciones: string[], elegidos: string[]) => [...opciones, ...elegidos.filter(e => !opciones.includes(e))];
    const ciudades = con(fac.ciudades, f.ciudad ? [f.ciudad] : []);
    return (
        <div>
            {ciudades.length > 0 && (
                <Bloque id="donde" titulo={cat.tipo === 'tecnicos' ? 'Dónde trabajan' : 'Dónde'}>
                    <div className="flex flex-wrap gap-2">
                        <Chip activo={!f.ciudad} onClick={() => onChange({ ...f, ciudad: null })}>Toda España</Chip>
                        {ciudades.map(c => <Chip key={c} activo={f.ciudad === c} onClick={() => onChange({ ...f, ciudad: f.ciudad === c ? null : c })}>{c}</Chip>)}
                    </div>
                </Bloque>
            )}
            {cat.tipo === 'equipo' && fac.tipos.length > 1 && (
                <Bloque id="tipo" titulo="Qué buscas">
                    <div className="flex flex-wrap gap-2">
                        {TIPOS.filter(t => fac.tipos.includes(t.id)).map(t =>
                            <Chip key={t.id} activo={f.tipo === t.id} onClick={() => onChange({ ...f, tipo: f.tipo === t.id ? null : t.id })}>{t.nombre}</Chip>)}
                    </div>
                </Bloque>
            )}
            {fac.fechas && <Bloque id="cuando" titulo="Cuándo"><Cuando f={f} onChange={onChange} /></Bloque>}
            {precios && <Bloque id="precio" titulo="Precio"><Precio precios={fac.precios} f={f} onChange={onChange} /></Bloque>}
            {fac.estilos.length > 0 && (
                <Bloque id="estilo" titulo="Estilo">
                    <div className="flex flex-wrap gap-2">
                        {con(fac.estilos, f.estilos).map(e => <Chip key={e} activo={f.estilos.includes(e)} onClick={() => onChange({ ...f, estilos: alternar(f.estilos, e) })}>{e}</Chip>)}
                    </div>
                </Bloque>
            )}
            {fac.formaciones.length > 0 && (
                <Bloque id="formacion" titulo="Formación">
                    <div className="flex rounded-[12px] bg-fill p-[3px]">
                        {FORMACIONES.filter(x => fac.formaciones.includes(x.id) || f.musicos === x.id).map(x => (
                            <button key={x.id} type="button" aria-pressed={f.musicos === x.id} onClick={() => onChange({ ...f, musicos: f.musicos === x.id ? null : x.id })}
                                className={cn('pulsable flex-1 h-9 rounded-[9px] text-[14px] font-semibold', f.musicos === x.id ? 'bg-foreground text-background' : 'text-foreground')}>
                                {x.nombre}
                            </button>
                        ))}
                    </div>
                </Bloque>
            )}
            {fac.ideal.length > 0 && (
                <Bloque id="ideal" titulo="Ideal para">
                    <div className="flex flex-wrap gap-2">
                        {con(fac.ideal, f.ideal).map(i => <Chip key={i} activo={f.ideal.includes(i)} onClick={() => onChange({ ...f, ideal: alternar(f.ideal, i) })}>{i}</Chip>)}
                    </div>
                </Bloque>
            )}
            {fac.servicios.length > 0 && (
                <Bloque id="servicios" titulo="Servicios">
                    <div className="flex flex-wrap gap-2">
                        {con(fac.servicios, f.servicios).map(s => <Chip key={s} activo={f.servicios.includes(s)} onClick={() => onChange({ ...f, servicios: alternar(f.servicios, s) })}>{s}</Chip>)}
                    </div>
                </Bloque>
            )}
            {fac.equipo.length > 0 && (
                <Bloque id="equipo" titulo="Equipo">
                    <div className="flex flex-wrap gap-2">
                        {con(fac.equipo, f.equipo).map(s => <Chip key={s} activo={f.equipo.includes(s)} onClick={() => onChange({ ...f, equipo: alternar(f.equipo, s) })}>{s}</Chip>)}
                    </div>
                </Bloque>
            )}
            {fac.estados.length > 0 && (
                <Bloque id="estado" titulo="Estado">
                    <div className="flex flex-wrap gap-2">
                        {ESTADOS.filter(e => fac.estados.includes(e.id)).map(e =>
                            <Chip key={e.id} activo={f.estado.includes(e.id)} onClick={() => onChange({ ...f, estado: alternar(f.estado, e.id) })}>{e.nombre}</Chip>)}
                    </div>
                </Bloque>
            )}
            {(fac.extras.length > 0 || fac.urgente) && (
                <Bloque id="extras" titulo="Extras">
                    <div className="divide-y divide-hairline">
                        {EXTRAS.filter(e => fac.extras.includes(e.id)).map(e =>
                            <Interruptor key={e.id} etiqueta={e.nombre} activo={f.extras.includes(e.id)} onChange={() => onChange({ ...f, extras: alternar(f.extras, e.id) })} />)}
                        {fac.urgente && <Interruptor etiqueta="Solo lo urgente" activo={f.urgente} onChange={v => onChange({ ...f, urgente: v })} />}
                    </div>
                </Bloque>
            )}
        </div>
    );
}

type PropsHoja = {
    seccion: Seccion | null; cat: Categoria; fac: Facetas; f: Filtros;
    contar: (f: Filtros) => number; onAplicar: (f: Filtros) => void; onCerrar: () => void;
};

/** La hoja inferior del móvil: trabaja sobre un borrador y aplica con «Ver N…» */
export function HojaFiltros({ abierta, ...props }: PropsHoja & { abierta: boolean }) {
    // Portal: el contenedor de la página lleva transform y descolocaría el fixed
    return createPortal(<AnimatePresence>{abierta && <Hoja {...props} />}</AnimatePresence>, document.body);
}

// Se monta al abrir: el borrador empieza siempre en los filtros puestos
function Hoja({ seccion, cat, fac, f, contar, onAplicar, onCerrar }: PropsHoja) {
    const [borrador, setBorrador] = useState(f);
    const cuerpo = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
        window.addEventListener('keydown', k);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        // Abre por la sección de la pastilla que se ha tocado
        const t = seccion ? setTimeout(() => cuerpo.current?.querySelector(`#filtro-${seccion}`)?.scrollIntoView({ block: 'start' }), 60) : undefined;
        return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; if (t) clearTimeout(t); };
    }, [seccion, onCerrar]);
    const n = contar(borrador);

    return (
        <motion.div className="fixed inset-0 z-[80] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button aria-label="Cerrar filtros" className="absolute inset-0 bg-black/40" onClick={onCerrar} />
            <motion.div role="dialog" aria-modal="true" aria-label={`Filtros de ${cat.nombre.toLowerCase()}`}
                initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} transition={{ type: 'spring', damping: 32, stiffness: 340 }}
                className="relative w-full max-w-lg max-h-[90dvh] flex flex-col bg-sheet rounded-t-[22px] border border-hairline shadow-e3">
                <div className="shrink-0 px-4 pt-2">
                    <div className="mx-auto h-1 w-9 rounded-full bg-fill-strong" />
                    <div className="mt-2 flex items-center justify-between pb-2 border-b border-hairline">
                        <h2 className="text-[24px] font-bold text-foreground">Filtros</h2>
                        <button onClick={onCerrar} aria-label="Cerrar" className="pulsable h-9 w-9 rounded-full bg-fill flex items-center justify-center text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <div ref={cuerpo} className="flex-1 overflow-y-auto overscroll-contain px-4">
                    <PanelFiltros cat={cat} fac={fac} f={borrador} onChange={setBorrador} />
                </div>
                <div className="shrink-0 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-hairline flex items-center gap-3">
                    <button type="button" onClick={() => setBorrador(sinFiltros(borrador))}
                        className="pulsable h-[52px] px-4 text-[16px] font-semibold text-muted-foreground">
                        Borrar todo
                    </button>
                    <button type="button" onClick={() => onAplicar(borrador)}
                        className="pulsable flex-1 h-[52px] rounded-[14px] bg-primary text-primary-foreground text-[17px] font-semibold">
                        Ver {cuantos(cat, n)}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

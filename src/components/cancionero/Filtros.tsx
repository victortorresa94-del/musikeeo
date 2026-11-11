import { useMemo, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    NOMBRE_AGRUPAR, NOMBRE_CAMPO, SIN_FILTROS, etiquetaValor, hayFiltros, opcionesDe,
    type Agrupar, type CampoFiltro, type Filtros,
} from '../../lib/biblioteca';
import type { Cancion } from '../../types/cancionero';
import { BotonHoja, Hoja } from './Hoja';

// Los campos que se ofrecen como desplegable (los grupos van como botones sueltos delante)
const CAMPOS: CampoFiltro[] = ['canta', 'tonos', 'estilos', 'energias', 'estados'];

const chip = (activo: boolean) => cn('pulsable h-9 shrink-0 rounded-full px-3.5 text-[14px] font-semibold flex items-center gap-1 whitespace-nowrap',
    activo ? 'bg-foreground text-background' : 'bg-fill text-foreground');

// Filtrar el cancionero por la ficha: los grupos (Lady Jarana, Cataleya…) de un toque, y
// quién canta, tono, estilo, energía y estado en su hoja. Solo sale lo que existe
export function BarraFiltros({ canciones, tonoDe, filtros, onCambio, agrupar, onAgrupar, className }: {
    canciones: Cancion[];
    tonoDe: (c: Cancion) => string | null;
    filtros: Filtros;
    onCambio: (f: Filtros) => void;
    agrupar?: Agrupar;
    onAgrupar?: (a: Agrupar) => void;
    className?: string;
}) {
    const [abierto, setAbierto] = useState<CampoFiltro | 'agrupar' | null>(null);
    const proyectos = useMemo(() => opcionesDe(canciones, 'proyectos', tonoDe), [canciones, tonoDe]);
    const conOpciones = useMemo(() => CAMPOS.filter(k => opcionesDe(canciones, k, tonoDe).length > 0), [canciones, tonoDe]);
    if (!proyectos.length && !conOpciones.length && !onAgrupar) return null;

    const alternar = (campo: CampoFiltro, valor: string) => {
        const ya = filtros[campo].includes(valor);
        onCambio({ ...filtros, [campo]: ya ? filtros[campo].filter(v => v !== valor) : [...filtros[campo], valor] });
    };
    const resumen = (campo: CampoFiltro) => {
        const v = filtros[campo];
        if (!v.length) return NOMBRE_CAMPO[campo];
        return v.length === 1 ? etiquetaValor(campo, v[0]) : `${NOMBRE_CAMPO[campo]} · ${v.length}`;
    };

    return (
        <>
            <div className={cn('-mx-4 px-4 flex items-center gap-2 overflow-x-auto hide-scrollbar', className)}>
                {hayFiltros(filtros) && (
                    <button onClick={() => onCambio(SIN_FILTROS)} aria-label="Quitar los filtros" className="pulsable h-9 w-9 shrink-0 rounded-full bg-fill text-foreground flex items-center justify-center">
                        <X className="h-4 w-4" />
                    </button>
                )}
                {proyectos.map(p => (
                    <button key={p.valor} onClick={() => alternar('proyectos', p.valor)} aria-pressed={filtros.proyectos.includes(p.valor)}
                        className={chip(filtros.proyectos.includes(p.valor))}>{p.valor}</button>
                ))}
                {conOpciones.map(k => (
                    <button key={k} onClick={() => setAbierto(k)} className={chip(filtros[k].length > 0)}>
                        {resumen(k)} <ChevronDown className="h-4 w-4 opacity-60" />
                    </button>
                ))}
                {onAgrupar && agrupar && (
                    <button onClick={() => setAbierto('agrupar')} className={chip(agrupar !== 'nada')}>
                        {agrupar === 'nada' ? 'Agrupar' : NOMBRE_AGRUPAR[agrupar]} <ChevronDown className="h-4 w-4 opacity-60" />
                    </button>
                )}
            </div>

            {CAMPOS.map(k => (
                <Hoja key={k} abierta={abierto === k} onCerrar={() => setAbierto(null)} titulo={NOMBRE_CAMPO[k]} encima
                    izquierda={filtros[k].length ? <BotonHoja onClick={() => onCambio({ ...filtros, [k]: [] })}>Borrar</BotonHoja> : null}
                    derecha={<BotonHoja fuerte onClick={() => setAbierto(null)}>Listo</BotonHoja>}>
                    <ul className="divide-y divide-hairline border-t border-hairline">
                        {opcionesDe(canciones, k, tonoDe).map(o => {
                            const dentro = filtros[k].includes(o.valor);
                            return (
                                <li key={o.valor}>
                                    <button onClick={() => alternar(k, o.valor)} aria-pressed={dentro} className="w-full min-h-[52px] px-4 flex items-center gap-3 text-left active:bg-fill">
                                        <span className="flex-1 text-[16px] font-semibold text-foreground">{etiquetaValor(k, o.valor)}</span>
                                        <span className="text-[14px] text-muted-foreground tabular-nums">{o.n}</span>
                                        <span className={cn('h-6 w-6 rounded-full flex items-center justify-center', dentro ? 'bg-foreground text-background' : 'border border-hairline-strong')}>
                                            {dentro && <Check className="h-3.5 w-3.5" />}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </Hoja>
            ))}

            {onAgrupar && (
                <Hoja abierta={abierto === 'agrupar'} onCerrar={() => setAbierto(null)} titulo="Agrupar" encima
                    derecha={<BotonHoja fuerte onClick={() => setAbierto(null)}>Listo</BotonHoja>}>
                    <ul className="divide-y divide-hairline border-t border-hairline">
                        {(Object.keys(NOMBRE_AGRUPAR) as Agrupar[]).map(a => (
                            <li key={a}>
                                <button onClick={() => { onAgrupar(a); setAbierto(null); }} className="w-full min-h-[52px] px-4 flex items-center gap-3 text-left active:bg-fill">
                                    <span className="flex-1 text-[16px] font-semibold text-foreground">{NOMBRE_AGRUPAR[a]}</span>
                                    {agrupar === a && <Check className="h-5 w-5 text-foreground" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                </Hoja>
            )}
        </>
    );
}

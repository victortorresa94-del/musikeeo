import { forwardRef, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { enEstrofas, enPalabras, nombreMarca, type Linea, type Marca, type OpcionesNombre, type Trozo } from '../../lib/acordes';
import type { AjustesCancion } from '../../types/cancionero';
import { estiloSeccion, type EstiloSeccion } from './estilo';

type Vista = AjustesCancion['vista'];

// Solo letra (para quien canta) o solo acordes (para quien se sabe la letra)
function segunVista(lineas: Linea[], vista: Vista): Linea[] {
    if (vista === 'completa') return lineas;
    const salida: Linea[] = [];
    for (const l of lineas) {
        if (vista === 'letra') {
            if (l.tipo === 'acordes' || l.tipo === 'tab') continue;
            if (l.tipo === 'mixta') salida.push({ tipo: 'letra', texto: l.trozos.map(t => t.texto).join('').trimEnd() });
            else salida.push(l);
        } else {
            if (l.tipo === 'letra') continue;
            if (l.tipo === 'mixta') salida.push({ tipo: 'acordes', marcas: l.trozos.flatMap(t => (t.marca ? [t.marca] : [])) });
            else salida.push(l);
        }
    }
    return salida;
}

interface Props {
    lineas: Linea[];
    opciones: OpcionesNombre;
    vista: Vista;
    tamano: number;
    columnas: number;
    className?: string;
}

// La canción pintada: el acorde siempre encima de su sílaba, también cuando la línea
// no cabe y se parte (en el móvil, lo que en las webs de acordes se descoloca).
export const HojaCancion = forwardRef<HTMLDivElement, Props>(({ lineas, opciones, vista, tamano, columnas, className }, ref) => {
    const estrofas = useMemo(() => enEstrofas(segunVista(lineas, vista)), [lineas, vista]);
    // Lo de dentro solo cambia con la letra, la vista o el nombre de los acordes: el zoom con dos
    // dedos, el tamaño y «que quepa» solo tocan el estilo de fuera (una canción larga son miles de nodos)
    const contenido = useMemo(() => estrofas.map((estrofa, i) => {
        // La estrofa toma el color de su sección (el estribillo, en su baldosa)
        const estilo = estrofa[0]?.tipo === 'seccion' ? estiloSeccion(estrofa[0].texto) : null;
        return (
            <div key={i} className={cn('break-inside-avoid', estilo?.bloque
                ? cn('mb-[0.9em] rounded-[0.8em] px-[0.75em] pt-[0.6em] pb-[0.35em]', estilo.bloque)
                : 'pb-[0.9em]')}>
                {estrofa.map((l, j) => <LineaCancion key={j} linea={l} opciones={opciones} estilo={j === 0 ? estilo : null} />)}
            </div>
        );
    }), [estrofas, opciones]);
    return (
        <div ref={ref} className={cn('text-foreground gap-x-10', className)} style={{ fontSize: tamano, columnCount: columnas }}>
            {contenido}
        </div>
    );
});
HojaCancion.displayName = 'HojaCancion';

function LineaCancion({ linea: l, opciones, estilo }: { linea: Linea; opciones: OpcionesNombre; estilo?: EstiloSeccion | null }) {
    switch (l.tipo) {
        case 'seccion':
            if (estilo?.bloque) {
                return (
                    <p className={cn('flex items-center justify-between gap-2 pb-[0.3em] text-[0.72em] font-bold uppercase tracking-[0.08em]', estilo.etiqueta)}>
                        {l.texto}
                        {/* Medida fija: «que quepa» mide antes de que llegue la imagen */}
                        {estilo.icono && <img src={estilo.icono} alt="" aria-hidden draggable={false} className="h-[2.2em] w-[2.2em] -my-[0.6em] shrink-0 object-contain" />}
                    </p>
                );
            }
            if (estilo) {
                return (
                    <p className="pb-[0.35em]">
                        <span className={cn('inline-block px-[0.65em] py-[0.3em] rounded-[0.9em] text-[0.66em] font-bold uppercase leading-tight tracking-[0.08em]', estilo.etiqueta)}>{l.texto}</span>
                    </p>
                );
            }
            return <p className="pb-[0.3em] text-[0.7em] font-bold uppercase tracking-[0.08em] text-muted-foreground">{l.texto}</p>;
        case 'nota':
            return <p className="pb-[0.2em] text-[0.85em] italic text-muted-foreground">{l.texto}</p>;
        case 'letra':
            return <p className="whitespace-pre-wrap leading-[1.4]">{l.texto.trimStart()}</p>;
        case 'tab':
            return <pre className="font-mono text-[0.78em] leading-[1.3] overflow-x-auto hide-scrollbar">{l.texto}</pre>;
        case 'acordes':
            return (
                <p className="flex flex-wrap items-baseline gap-x-[0.9em] pb-[0.15em] leading-[1.4]">
                    {l.etiqueta && <span className="text-[0.8em] font-semibold text-muted-foreground">{l.etiqueta}</span>}
                    {l.marcas.map((m, k) => <NombreMarca key={k} marca={m} opciones={opciones} />)}
                </p>
            );
        case 'mixta':
            // Una palabra de una sola sílaba va sin envoltorio: se pinta igual con la mitad de nodos
            return (
                <div className="flex flex-wrap items-end pb-[0.25em]">
                    {enPalabras(l.trozos).map((palabra, k) => (palabra.length === 1
                        ? silaba(palabra[0], opciones, k)
                        : (
                            <span key={k} className="inline-flex items-end">
                                {palabra.map((t, n) => silaba(t, opciones, n))}
                            </span>
                        )))}
                </div>
            );
        default:
            return null;
    }
}

const claseMarca = (marca: Marca) => (marca.acorde ? 'font-bold' : 'font-medium text-muted-foreground');

function NombreMarca({ marca, opciones }: { marca: Marca; opciones: OpcionesNombre }) {
    return <span className={claseMarca(marca)}>{nombreMarca(marca, opciones)}</span>;
}

// Sin acorde no hay renglón de acorde: si una línea partida queda sin acordes, no deja hueco.
// Sin acorde, la sílaba es solo su texto; con acorde, el nombre va en el mismo renglón que lo
// coloca (antes, un nodo más por acorde). Es una función y no un componente: una canción larga
// tiene más de mil sílabas y cada componente es trabajo de más para React al montarla
function silaba(trozo: Trozo, opciones: OpcionesNombre, key: number) {
    if (!trozo.marca) return <span key={key} className="whitespace-pre leading-[1.35]">{trozo.texto || '\u00a0'}</span>;
    return (
        <span key={key} className="inline-flex flex-col">
            <span className={`whitespace-pre pr-[0.4em] text-[0.92em] leading-[1.25] ${claseMarca(trozo.marca)}`}>
                {nombreMarca(trozo.marca, opciones)}
            </span>
            <span className="whitespace-pre leading-[1.35]">{trozo.texto || '\u00a0'}</span>
        </span>
    );
}

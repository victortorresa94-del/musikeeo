import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { etiquetasTema } from './estilo';
import { Portada } from './Portada';
import { ICONO_CAMPO } from './iconosFicha';
import { minutos } from '../../lib/cantar';
import type { Cancion } from '../../types/cancionero';

// Una canción en una lista: portada, título, artista y grupos, sus píldoras (quién canta,
// estilo, si falta ensayarla) y el tono a la derecha. Con «elegida» es una casilla
export function FilaCancion({ cancion, tono, elegida, onElegir, href, derecha, compacta }: {
    cancion: Cancion;
    tono: string | null;
    elegida?: boolean;               // modo elegir: casilla en vez de flecha
    onElegir?: () => void;
    href?: string;
    derecha?: ReactNode;
    compacta?: boolean;
}) {
    const etiquetas = etiquetasTema(cancion);
    const grupos = cancion.ficha?.proyectos?.join(' · ');
    const sub = [cancion.version && `Versión ${cancion.version}`, cancion.artista, grupos].filter(Boolean).join(' · ');
    const contenido = (
        <>
            <Portada src={cancion.portada} titulo={cancion.titulo} tamano={compacta ? 'fila' : undefined} />
            <span className="flex-1 min-w-0">
                <span className="block truncate text-[16px] font-semibold text-foreground">{cancion.titulo}</span>
                {sub && <span className="block truncate text-[13.5px] text-muted-foreground">{sub}</span>}
                {etiquetas.length > 0 && (
                    <span className="mt-1 flex gap-1 overflow-hidden">
                        {etiquetas.slice(0, 3).map(e => {
                            const Icono = e.tipo ? ICONO_CAMPO[e.tipo] : null;
                            return (
                                <span key={e.texto} className={cn('h-5 px-2 shrink-0 rounded-full text-[11.5px] font-semibold flex items-center',
                                    e.pastel ? cn(e.pastel.fondo, e.pastel.tinta) : 'bg-fill-strong text-muted-foreground')}>
                                    {Icono && <Icono className="h-3 w-3 mr-0.5 shrink-0" aria-hidden />}{e.texto}
                                </span>
                            );
                        })}
                    </span>
                )}
            </span>
            {cancion.duracion ? (
                <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums" aria-label={`Dura ${minutos(cancion.duracion)}`}>{minutos(cancion.duracion)}</span>
            ) : null}
            {tono && (
                <span className="shrink-0 min-w-[36px] h-7 px-2.5 rounded-full bg-fill-strong text-[13px] font-bold text-foreground flex items-center justify-center">{tono}</span>
            )}
            {derecha ?? (onElegir ? (
                <span className={cn('h-7 w-7 shrink-0 rounded-full flex items-center justify-center', elegida ? 'bg-foreground text-background' : 'border border-hairline-strong')}>
                    {elegida && <Check className="h-4 w-4" />}
                </span>
            ) : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />)}
        </>
    );
    const clase = cn('w-full flex items-center gap-3 px-4 py-2 text-left active:bg-fill', compacta ? 'min-h-[60px]' : 'min-h-[68px]');
    if (onElegir) return <button type="button" onClick={onElegir} aria-pressed={elegida} className={clase}>{contenido}</button>;
    return <Link to={href ?? `/cancionero/${cancion.id}`} className={clase}>{contenido}</Link>;
}

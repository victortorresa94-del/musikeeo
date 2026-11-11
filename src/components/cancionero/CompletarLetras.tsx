import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { leerCancion, lineasDeLetra } from '../../lib/acordes';
import { useCancionero } from '../../hooks/useCancionero';
import { AnadirLetra } from './AnadirLetra';
import { BotonHoja, Hoja } from './Hoja';
import { Portada } from './Portada';
import type { AjustesCancion, Cancion } from '../../types/cancionero';

// Sin letra: una ficha del setlist o una chuleta de acordes (menos de 8 líneas de letra)
const sinLetra = (c: Cancion) => lineasDeLetra(leerCancion(c.texto)) < 8;

// Completar las letras de golpe: una canción detrás de otra (primero las del bolo que viene),
// con las webs de acordes a un toque, «Pegar aquí» y a la siguiente. La letra la copia la persona
export function CompletarLetras({ abierta, onCerrar, repertorioId }: { abierta: boolean; onCerrar: () => void; repertorioId?: string }) {
    const { canciones, repertorios, guardar } = useCancionero();
    // La lista se fija al abrir: al completar una no se mueve el orden
    const [lista, setLista] = useState<string[]>([]);
    const [i, setI] = useState(0);
    const [hechas, setHechas] = useState(0);
    const [abiertaAntes, setAbiertaAntes] = useState(false);
    if (abierta !== abiertaAntes) {
        setAbiertaAntes(abierta);
        if (abierta) {
            const hoy = new Date().toLocaleDateString('sv-SE');
            const bolos = repertorioId
                ? repertorios.filter(r => r.id === repertorioId)
                : repertorios.filter(r => r.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
            const primero = bolos.flatMap(r => r.canciones);
            const faltan = canciones.filter(c => sinLetra(c));
            const orden = [...new Set([...primero.filter(id => faltan.some(c => c.id === id)), ...faltan.map(c => c.id)])];
            setLista(orden);
            setI(0);
            setHechas(0);
        }
    }
    const cancion = useMemo(() => canciones.find(c => c.id === lista[i]), [canciones, lista, i]);
    const siguiente = () => {
        if (i + 1 < lista.length) setI(i + 1);
        else { toast.success(hechas ? `${hechas} ${hechas === 1 ? 'letra completada' : 'letras completadas'}` : 'Ya no quedan'); onCerrar(); }
    };
    const pegar = (texto: string, cambio: Partial<AjustesCancion>) => {
        if (!cancion) return;
        guardar({ ...cancion, texto, ajustes: { ...cancion.ajustes, ...cambio } });
        setHechas(h => h + 1);
        toast.success(`«${cancion.titulo}» completada`);
        siguiente();
    };

    return (
        <Hoja abierta={abierta} onCerrar={onCerrar} titulo="Completar letras" alta
            izquierda={<BotonHoja onClick={onCerrar}>Cerrar</BotonHoja>}
            derecha={lista.length ? <span className="text-[14px] text-muted-foreground tabular-nums">{Math.min(i + 1, lista.length)} de {lista.length}</span> : null}>
            <div className="px-4 pb-6">
                {!cancion ? (
                    <p className="rounded-2xl bg-fill px-4 py-6 text-center text-[15px] text-muted-foreground">Todas tus canciones tienen letra.</p>
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <Portada src={cancion.portada} titulo={cancion.titulo} />
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-[19px] font-bold text-foreground">{cancion.titulo}</p>
                                <p className="truncate text-[14px] text-muted-foreground">
                                    {[cancion.version && `Versión ${cancion.version}`, cancion.artista, cancion.ficha?.tono && `Tono ${cancion.ficha.tono}`].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <AnadirLetra key={cancion.id} cancion={cancion} ajustes={cancion.ajustes} onPegar={pegar} />
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} aria-label="Anterior"
                                className="pulsable h-11 w-11 shrink-0 rounded-full bg-fill flex items-center justify-center text-foreground disabled:opacity-30">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button type="button" onClick={siguiente}
                                className="pulsable flex-1 h-11 rounded-full bg-fill text-[15px] font-semibold text-foreground flex items-center justify-center gap-1">
                                Saltar esta <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="mt-3 text-[13px] text-muted-foreground">
                            Busca la canción en la web, cópiala entera y vuelve: «Pegar aquí» la deja en el tono de su ficha y pasa a la siguiente.
                        </p>
                    </>
                )}
            </div>
        </Hoja>
    );
}

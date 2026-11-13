import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';
import { enlacesAcordes } from '../../lib/buscarCanciones';
import type { Cancion } from '../../types/cancionero';

// «En webs» (13-nov, Víctor: «desde la canción dentro de un repertorio debería poder ir a ver los
// acordes a cualquiera de las webs»): sus acordes en LaCuerda, Ultimate Guitar, Cifra Club, Google
// y Chordify, y su página si la tiene en la ficha. Siempre, tenga letra o no. Se abre aparte
export function BotonWebs({ cancion, className }: { cancion: Cancion; className?: string }) {
    const [abierto, setAbierto] = useState(false);
    const caja = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!abierto) return;
        const fuera = (e: PointerEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierto(false); };
        const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false); };
        document.addEventListener('pointerdown', fuera);
        document.addEventListener('keydown', tecla);
        return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', tecla); };
    }, [abierto]);
    const suya = cancion.ficha?.enlace;
    const piezas = piezasDe(cancion.titulo);
    const artista = cancion.artista || '';
    return (
        <div ref={caja} className={cn('relative', className)}>
            <button onClick={() => setAbierto(a => !a)} aria-expanded={abierto} aria-haspopup="menu"
                className="pulsable h-9 pl-3 pr-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="h-4 w-4" /> En webs
            </button>
            {abierto && (
                <div role="menu" className="absolute left-0 top-11 z-30 w-[270px] max-h-[60vh] overflow-y-auto rounded-2xl bg-sheet border border-hairline shadow-e3 p-1.5">
                    {suya && <Enlace nombre="Su página" url={suya} onElegido={() => setAbierto(false)} />}
                    {piezas.map(pieza => (
                        <div key={pieza}>
                            <p className="px-2.5 pt-1.5 pb-1 text-[12px] font-semibold text-muted-foreground truncate">{piezas.length > 1 ? `«${pieza}» en…` : 'Sus acordes en…'}</p>
                            {enlacesAcordes(pieza, mismaPalabra(pieza, artista) ? '' : artista).map(e => (
                                <Enlace key={e.nombre} nombre={e.nombre} url={e.url} logo={e.logo} onElegido={() => setAbierto(false)} />
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Enlace({ nombre, url, logo, onElegido }: { nombre: string; url: string; logo?: string; onElegido: () => void }) {
    return (
        <a role="menuitem" href={url} target="_blank" rel="noopener noreferrer" onClick={onElegido}
            className="h-11 px-2.5 rounded-xl flex items-center gap-2.5 text-[15px] font-semibold text-foreground hover:bg-fill active:bg-fill">
            {logo
                ? <img src={logo} alt="" aria-hidden className="h-6 w-6 rounded-md object-contain" />
                : <span className="h-6 w-6 rounded-md bg-fill-strong flex items-center justify-center" aria-hidden><Globe className="h-3.5 w-3.5" /></span>}
            <span className="flex-1">{nombre}</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </a>
    );
}

// Qué se busca: un mix («MIX Bad Bunny (Baile Inolvidable × Nuevayol)», «Mix: A + B») son varias
// canciones; si no, el título sin lo que va entre paréntesis («(Remastered)», «(versión Víctor)»)
function piezasDe(titulo: string): string[] {
    const t = titulo.trim();
    const esMix = /^mix\b/i.test(t) || /[×+]/.test(t);
    if (esMix) {
        const dentro = t.match(/[([]([^)\]]+)[)\]]/)?.[1] ?? t.replace(/^mix\b:?\s*/i, '');
        const partes = dentro.split(/\s*(?:×|\+|\/|,|\sx\s)\s*/i).map(x => x.trim()).filter(Boolean);
        if (partes.length > 1) return partes.slice(0, 5);
    }
    return [t.replace(/^mix\b:?\s*/i, '').replace(/\s*[([].*?[)\]]\s*/g, ' ').trim() || t];
}

const sinAcentos = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// «Bad Bunny» ya va en el título: no se repite en la búsqueda
const mismaPalabra = (titulo: string, artista: string) => !!artista && sinAcentos(titulo).includes(sinAcentos(artista));

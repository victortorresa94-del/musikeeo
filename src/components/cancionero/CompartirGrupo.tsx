import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Copy, Eye, Send } from 'lucide-react';
import { cn } from '../../lib/utils';
import { enlaceGrupo, paquete } from '../../lib/compartir';
import type { Cancion, Repertorio } from '../../types/cancionero';
import { BotonHoja, Hoja } from './Hoja';

// «Compartir con el grupo»: un enlace que se abre sin cuenta, solo para leer. Cifrado (sin
// letra) por defecto. Todo va dentro del enlace: si cambias orden o tonos, se manda otro
export function CompartirGrupo({ abierta, onCerrar, repertorio, canciones }: {
    abierta: boolean; onCerrar: () => void; repertorio: Repertorio; canciones: Cancion[];
}) {
    const [conLetra, setConLetra] = useState(false);
    const enlace = useMemo(
        () => (abierta ? enlaceGrupo(paquete(repertorio, canciones, conLetra)) : ''),
        [abierta, repertorio, canciones, conLetra],
    );
    const largo = enlace.length;
    // WhatsApp corta los mensajes de más de ~65 000 caracteres
    const demasiado = largo > 60000;
    const mensaje = `${repertorio.nombre} · el repertorio${conLetra ? ' con letra' : ' (cifrado)'}: ${enlace}`;

    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(enlace);
            toast.success('Enlace copiado. Pégalo en el grupo.');
        } catch {
            toast('No se pudo copiar. Mantén pulsado el enlace de abajo.');
        }
    };
    const enviar = async () => {
        if (navigator.share) {
            try { await navigator.share({ title: repertorio.nombre, text: `${repertorio.nombre} · el repertorio`, url: enlace }); return; } catch { /* cancelado */ }
            return;
        }
        window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener');
    };

    return (
        <Hoja abierta={abierta} onCerrar={onCerrar} titulo="Compartir con el grupo" derecha={<BotonHoja fuerte onClick={onCerrar}>Listo</BotonHoja>}>
            <div className="px-4 pb-5">
                <p className="text-[15px] text-muted-foreground">
                    Tus músicos lo abren sin cuenta: el set en orden con tono, capo, quién canta, tempo, duración, los acordes por partes y tus notas. Solo pueden mirarlo.
                </p>

                <div className="mt-4 rounded-2xl bg-fill p-1 grid grid-cols-2 gap-1" role="radiogroup" aria-label="Qué se comparte">
                    {([[false, 'Cifrado', 'Sin letra'], [true, 'Con letra', 'Letra y acordes']] as const).map(([valor, titulo, sub]) => (
                        <button key={titulo} role="radio" aria-checked={conLetra === valor} onClick={() => setConLetra(valor)}
                            className={cn('rounded-xl py-2 text-center', conLetra === valor ? 'bg-foreground text-background' : 'text-foreground')}>
                            <span className="block text-[15px] font-semibold">{titulo}</span>
                            <span className={cn('block text-[12px]', conLetra === valor ? 'text-background/70' : 'text-muted-foreground')}>{sub}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => void enviar()} disabled={demasiado}
                        className="pulsable h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] flex items-center justify-center gap-2 disabled:opacity-40">
                        <Send className="h-5 w-5" /> Enviar
                    </button>
                    <button onClick={() => void copiar()} disabled={demasiado}
                        className="pulsable h-[52px] rounded-[14px] bg-fill text-foreground font-semibold text-[16px] flex items-center justify-center gap-2 disabled:opacity-40">
                        <Copy className="h-5 w-5" /> Copiar enlace
                    </button>
                </div>
                <a href={enlace} target="_blank" rel="noopener noreferrer"
                    className="pulsable mt-2 h-11 rounded-[14px] border border-hairline text-[15px] font-semibold text-foreground flex items-center justify-center gap-2">
                    <Eye className="h-4 w-4" /> Ver cómo lo ven
                </a>

                <p className={cn('mt-3 text-[13px]', demasiado ? 'text-destructive' : 'text-muted-foreground')}>
                    {demasiado
                        ? 'Con letra es demasiado largo para WhatsApp. Compártelo cifrado o quita algún tema.'
                        : 'Si cambias el orden o los tonos, vuelve aquí y manda el enlace otra vez: el que ya tienen no se actualiza solo.'}
                </p>
            </div>
        </Hoja>
    );
}

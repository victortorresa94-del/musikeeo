import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { Copy, Eye, QrCode, Send } from 'lucide-react';
import { CodigoQR } from './CodigoQR';
import { cn } from '../../lib/utils';
import { enlaceGrupo, idCompartido, paquete } from '../../lib/compartir';
import { enlaceBolo, paqueteBolo } from '../../lib/compartirBolo';
import { compartidosService, type EstadoPublicar } from '../../services/compartidosService';
import { useCancionero } from '../../hooks/useCancionero';
import type { Bolo, Cancion, Repertorio } from '../../types/cancionero';
import { BotonHoja, Hoja } from './Hoja';

// «Compartir con el grupo»: un enlace que se abre sin cuenta. Cifrado (sin letra) por defecto.
// Lleva el set dentro (tras «#») y un id: con cuenta y las reglas desplegadas, la app sube sola
// cada cambio (services/compartidosService) y el mismo enlace enseña siempre lo último
const AVISO: Record<EstadoPublicar, string> = {
    'al-dia': 'Se actualiza solo: si cambias algo, tus músicos lo ven con el mismo enlace. Cada uno puede hacerse su versión de una canción sin perder la tuya.',
    'subiendo': 'Subiendo tus cambios…',
    'sin-cuenta': 'Para que se actualice solo, entra con tu cuenta. Mientras, el enlace lleva todo tal como está ahora.',
    'sin-permiso': 'Aún no se actualiza solo: falta desplegar las reglas de Firestore (está en tus pendientes). Mientras, el enlace lleva todo tal como está ahora.',
    'sin-red': 'Sin conexión: tus cambios se suben cuando vuelva la cobertura. El enlace lleva lo de ahora.',
};

export function CompartirGrupo({ abierta, onCerrar, repertorio, canciones }: {
    abierta: boolean; onCerrar: () => void; repertorio: Repertorio; canciones: Cancion[];
}) {
    const { guardarRepertorio } = useCancionero();
    return (
        <HojaCompartir abierta={abierta} onCerrar={onCerrar} titulo="Compartir con el grupo" nombre={repertorio.nombre} que="el repertorio"
            explicacion="Tus músicos lo abren sin cuenta: el set en orden con tono, capo, quién canta, tempo, duración, los acordes por partes y tus notas. Tu versión no la pueden tocar."
            idDe={m => repertorio.compartido?.[m]}
            crearId={m => guardarRepertorio({ ...repertorio, compartido: { ...repertorio.compartido, [m]: idCompartido() } })}
            // Con la hora: si la nube se quedase atrás, un enlace nuevo manda sobre ella
            enlaceDe={(conLetra, id) => enlaceGrupo({ ...paquete(repertorio, canciones, conLetra), u: new Date().toISOString() }, id)}
            deps={[repertorio, canciones]} />
    );
}

// «Compartir el bolo»: el mismo enlace que se actualiza solo, con el horario, el lugar y los sets
export function CompartirBolo({ abierta, onCerrar, bolo }: { abierta: boolean; onCerrar: () => void; bolo: Bolo }) {
    const { guardarBolo, repertorios, canciones } = useCancionero();
    return (
        <HojaCompartir abierta={abierta} onCerrar={onCerrar} titulo="Compartir el bolo" nombre={bolo.titulo} que="el bolo"
            explicacion="Tus músicos lo abren sin cuenta: cuándo y dónde, el horario, cómo llegar, a quién llamar, tus notas y cada set para tocarlo. Tu versión no la pueden tocar."
            idDe={m => bolo.compartido?.[m]}
            crearId={m => guardarBolo({ ...bolo, compartido: { ...bolo.compartido, [m]: idCompartido() } })}
            enlaceDe={(conLetra, id) => enlaceBolo({ ...paqueteBolo(bolo, repertorios, canciones, conLetra), u: new Date().toISOString() }, id)}
            deps={[bolo, repertorios, canciones]} />
    );
}

type Modo = 'cifrado' | 'letra';
function HojaCompartir({ abierta, onCerrar, titulo, nombre, que, explicacion, idDe, crearId, enlaceDe, deps }: {
    abierta: boolean; onCerrar: () => void; titulo: string; nombre: string; que: string; explicacion: string;
    idDe: (m: Modo) => string | undefined; crearId: (m: Modo) => void; enlaceDe: (conLetra: boolean, id?: string) => string; deps: unknown[];
}) {
    const [conLetra, setConLetra] = useState(false);
    const [qr, setQr] = useState(false);
    const modo: Modo = conLetra ? 'letra' : 'cifrado';
    const id = idDe(modo);
    // La primera vez que se comparte (cifrado o con letra), su id; y se sube ya
    useEffect(() => {
        if (!abierta) return;
        if (!id) crearId(modo);
        compartidosService.ahora();
    }, [abierta, id, modo]); // eslint-disable-line react-hooks/exhaustive-deps
    const estado = useSyncExternalStore(compartidosService.suscribir, () => compartidosService.estado(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const enlace = useMemo(() => (abierta ? enlaceDe(conLetra, id) : ''), [abierta, conLetra, id, ...deps]);
    const largo = enlace.length;
    // WhatsApp corta los mensajes de más de ~65 000 caracteres
    const demasiado = largo > 60000;
    const mensaje = `${nombre} · ${que}${conLetra ? ' con letra' : ' (cifrado)'}: ${enlace}`;
    const alDia = estado === 'al-dia';

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
            try { await navigator.share({ title: nombre, text: `${nombre} · ${que}`, url: enlace }); return; } catch { /* cancelado */ }
            return;
        }
        window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener');
    };

    return (
        <Hoja abierta={abierta} onCerrar={onCerrar} titulo={titulo} derecha={<BotonHoja fuerte onClick={onCerrar}>Listo</BotonHoja>}>
            <div className="px-4 pb-5">
                <p className="text-[15px] text-muted-foreground">{explicacion}</p>
                <p className={cn('mt-3 rounded-xl px-3 py-2 text-[13.5px] font-semibold', alDia ? 'bg-pastel-menta text-pastel-menta-ink' : 'bg-fill text-muted-foreground')} aria-live="polite">
                    {estado ? AVISO[estado] : 'Preparando el enlace…'}
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

                {conLetra && (
                    <p className="mt-2 rounded-xl bg-pastel-mantequilla px-3 py-2 text-[13.5px] font-semibold text-pastel-mantequilla-ink">
                        Solo para tu grupo; no lo publiques.
                    </p>
                )}
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
                <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => setQr(q => !q)} aria-expanded={qr}
                    className="pulsable h-11 rounded-[14px] border border-hairline text-[15px] font-semibold text-foreground flex items-center justify-center gap-2">
                    <QrCode className="h-4 w-4" /> {qr ? 'Ocultar QR' : 'Código QR'}
                </button>
                <a href={enlace} target="_blank" rel="noopener noreferrer"
                    className="pulsable h-11 rounded-[14px] border border-hairline text-[15px] font-semibold text-foreground flex items-center justify-center gap-2">
                    <Eye className="h-4 w-4" /> Ver cómo lo ven
                </a>
                </div>
                {qr && (
                    <div className="mt-3 flex flex-col items-center gap-2">
                        <CodigoQR texto={enlace} tamano={240} />
                        <p className="text-[13px] text-muted-foreground text-center">Para el ensayo: que lo escaneen con la cámara.</p>
                    </div>
                )}

                <p className={cn('mt-3 text-[13px]', demasiado ? 'text-destructive' : 'text-muted-foreground')}>
                    {demasiado
                        ? 'Con letra es demasiado largo para WhatsApp. Compártelo cifrado o quita algún tema.'
                        : alDia
                            ? `El enlace no cambia: mándalo una vez. (${largo.toLocaleString('es-ES')} caracteres)`
                            : `Mientras no se actualice solo, si cambias algo manda el enlace otra vez. (${largo.toLocaleString('es-ES')} caracteres)`}
                </p>
            </div>
        </Hoja>
    );
}

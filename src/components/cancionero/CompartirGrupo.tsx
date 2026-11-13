import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Copy, Eye, QrCode, Send } from 'lucide-react';
import { CodigoQR } from './CodigoQR';
import { cn } from '../../lib/utils';
import { enlaceGrupo, idCompartido, paquete, paqueteSuelto, temaDe } from '../../lib/compartir';
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
    'sin-cuenta': 'Para que se actualice solo, entra con tu cuenta. Mientras, el enlace es largo: lleva todo tal como está ahora.',
    'sin-permiso': 'Aún no se actualiza solo: falta desplegar las reglas de Firestore (está en tus pendientes). Mientras, el enlace es largo: lleva todo tal como está ahora.',
    'sin-red': 'Sin conexión: tus cambios se suben cuando vuelva la cobertura. Mientras, el enlace es largo: lleva lo de ahora.',
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

// ---- Enviar rápido, sin bolo ni repertorio (14-nov) ----
// Víctor: «Quiero poder enviar también un repertorio o una canción, aunque no sea bolo con toda
// la info… otra para enviar solo una canción a alguien con quien vas a cantar, así en plan rápido».
// El mismo enlace del grupo (lib/compartir: paqueteSuelto) y la misma página del músico. No se crea
// nada en su cancionero: se sube una foto de lo de ahora (compartidosService.publicar) y, si se
// vuelve a enviar lo mismo, va con el MISMO id, así el enlace que ya mandó enseña lo nuevo
const AVISO_FIJO: Record<EstadoPublicar, string> = {
    'al-dia': 'Enlace corto listo. Va como lo tienes ahora: si cambias algo, vuelve a enviarlo.',
    'subiendo': 'Preparando el enlace corto…',
    'sin-cuenta': 'Sin cuenta el enlace es largo, pero funciona igual: lleva todo dentro.',
    'sin-permiso': 'El enlace es largo (faltan las reglas de Firestore), pero funciona igual: lleva todo dentro.',
    'sin-red': 'Sin conexión: el enlace es largo, pero funciona igual: lleva todo dentro.',
};
const CLAVE_ENVIOS = 'musikeeo-envios-v1';
const leerEnvios = (): Record<string, string> => {
    try { const o = JSON.parse(localStorage.getItem(CLAVE_ENVIOS) || '{}'); return o && typeof o === 'object' ? o : {}; } catch { return {}; }
};
const idDeEnvio = (clave: string): string | undefined => leerEnvios()[clave];
function crearIdDeEnvio(clave: string) {
    const mapa = leerEnvios();
    if (mapa[clave]) return;
    const quedan = Object.entries(mapa).slice(-199);
    try { localStorage.setItem(CLAVE_ENVIOS, JSON.stringify(Object.fromEntries([...quedan, [clave, idCompartido()]]))); } catch { /* sin almacenamiento: va el enlace largo */ }
}
// Qué canciones van, en su orden, como clave corta (la misma selección reutiliza el enlace)
function claveDe(ids: string[]): string {
    let h = 5381;
    const s = ids.join(',');
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return `${ids.length}:${h.toString(36)}`;
}
// Los ids de un envío viven en el móvil: un contador para volver a pintar al crearlos
function useIdsDeEnvio(base: string) {
    const [, setVersion] = useState(0);
    return {
        idDe: (m: Modo) => idDeEnvio(`${base}:${m}`),
        crearId: (m: Modo) => { crearIdDeEnvio(`${base}:${m}`); setVersion(v => v + 1); },
    };
}

// Varias canciones (las elegidas en Canciones), en el orden en que se eligieron
export function EnviarCanciones({ abierta, onCerrar, canciones }: { abierta: boolean; onCerrar: () => void; canciones: Cancion[] }) {
    const [nombre, setNombre] = useState('');
    const porDefecto = `${canciones.length} ${canciones.length === 1 ? 'canción' : 'canciones'}`;
    const titulo = nombre.trim() || porDefecto;
    const ids = useIdsDeEnvio(`v:${claveDe(canciones.map(c => c.id))}`);
    return (
        <HojaCompartir abierta={abierta} onCerrar={onCerrar} titulo="Enviar canciones" nombre={titulo} que={porDefecto} fijo
            explicacion="Las abren sin cuenta, en este orden: tono, capo, quién canta, tempo y los acordes por partes. No se crea ningún repertorio."
            encima={(
                <label className="mt-4 block">
                    <span className="block px-1 text-[13px] font-semibold text-muted-foreground">Título</span>
                    <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder={porDefecto} maxLength={120}
                        className="mt-1 w-full h-11 px-3 rounded-xl bg-fill text-[16px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-hairline-strong" />
                </label>
            )}
            idDe={ids.idDe} crearId={ids.crearId}
            publicar={(conLetra, id) => compartidosService.publicar(id, paqueteSuelto(titulo, canciones, conLetra))}
            enlaceDe={(conLetra, id) => enlaceGrupo({ ...paqueteSuelto(titulo, canciones, conLetra), u: new Date().toISOString() }, id)}
            deps={[titulo, canciones]} />
    );
}

// Una canción, a quien vas a cantar con ella: con letra o solo acordes, en el tono en que la
// tienes ahora (ajustes.semitonos, como en el set), y un botón grande. Su enlace la abre directa
const CLAVE_ENVIAR_LETRA = 'musikeeo-enviar-letra';
export function EnviarCancion({ abierta, onCerrar, cancion }: { abierta: boolean; onCerrar: () => void; cancion: Cancion }) {
    const [conLetra, setConLetraEstado] = useState(() => { try { return localStorage.getItem(CLAVE_ENVIAR_LETRA) !== '0'; } catch { return true; } });
    const setConLetra = (v: boolean) => { setConLetraEstado(v); try { localStorage.setItem(CLAVE_ENVIAR_LETRA, v ? '1' : '0'); } catch { /* */ } };
    const modo: Modo = conLetra ? 'letra' : 'cifrado';
    const { idDe, crearId } = useIdsDeEnvio(`c:${cancion.id}`);
    const id = idDe(modo);
    const tema = useMemo(() => (abierta ? temaDe(cancion, conLetra) : null), [abierta, cancion, conLetra]);
    useEffect(() => { if (abierta && !id) crearId(modo); }, [abierta, id, modo]); // eslint-disable-line react-hooks/exhaustive-deps
    // Se sube al abrir (y al cambiar letra/acordes o la canción): al pulsar «Enviar» ya está
    useEffect(() => {
        if (!abierta || !id) return;
        compartidosService.publicar(id, paqueteSuelto(cancion.titulo, [cancion], conLetra));
    }, [abierta, id, cancion, conLetra]);
    const estado = useSyncExternalStore(compartidosService.suscribir, () => compartidosService.estado(id));
    const enlace = useMemo(() => {
        if (!abierta) return '';
        const largo = enlaceGrupo({ ...paqueteSuelto(cancion.titulo, [cancion], conLetra), u: new Date().toISOString() }, id);
        return estado === 'al-dia' && id ? largo.slice(0, largo.indexOf('#')) : largo;
    }, [abierta, cancion, conLetra, id, estado]);

    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(enlace);
            toast.success('Enlace copiado. Pégalo en WhatsApp.');
        } catch {
            toast('No se pudo copiar. Mantén pulsado «Ver cómo la ve» y copia el enlace.');
        }
    };
    const enviar = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: cancion.titulo, text: `${cancion.titulo}${tema?.k ? ` · en ${tema.k}` : ''}${conLetra ? '' : ' (acordes)'}`, url: enlace });
                return;
            } catch (e) {
                if ((e as Error)?.name === 'AbortError') return;   // cancelado
            }
        }
        await copiar();
    };

    return (
        <Hoja abierta={abierta} onCerrar={onCerrar} titulo="Enviar la canción" derecha={<BotonHoja fuerte onClick={onCerrar}>Listo</BotonHoja>}>
            <div className="px-4 pb-5">
                <p className="text-[17px] font-bold text-foreground leading-snug">{cancion.titulo}</p>
                {cancion.artista && <p className="text-[14px] text-muted-foreground">{cancion.artista}</p>}

                <div className="mt-4 rounded-2xl bg-fill p-1 grid grid-cols-2 gap-1" role="radiogroup" aria-label="Qué se envía">
                    {([[true, 'Con letra'], [false, 'Solo acordes']] as const).map(([valor, t]) => (
                        <button key={t} role="radio" aria-checked={conLetra === valor} onClick={() => setConLetra(valor)}
                            className={cn('h-11 rounded-xl text-[15px] font-semibold', conLetra === valor ? 'bg-foreground text-background' : 'text-foreground')}>
                            {t}
                        </button>
                    ))}
                </div>

                <div className="mt-3 rounded-2xl bg-fill px-4 py-3 flex items-center gap-3">
                    <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold text-muted-foreground">Va en el tono</span>
                        <span className="block text-[13px] text-muted-foreground">Como la tienes ahora. Para otro, cambia el tono de la canción.</span>
                    </span>
                    <span className="shrink-0 font-heading text-[26px] font-bold text-foreground">{tema?.k ?? '—'}</span>
                </div>
                {tema?.p && <p className="mt-2 px-1 text-[13.5px] text-muted-foreground">Con {tema.p}</p>}

                {conLetra && (
                    <p className="mt-3 rounded-xl bg-pastel-mantequilla px-3 py-2 text-[13.5px] font-semibold text-pastel-mantequilla-ink">
                        Solo para tu grupo; no lo publiques.
                    </p>
                )}

                <button onClick={() => void enviar()} disabled={!enlace}
                    className="pulsable mt-4 w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[17px] flex items-center justify-center gap-2 disabled:opacity-40">
                    <Send className="h-5 w-5" /> Enviar
                </button>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    <button onClick={() => void copiar()} disabled={!enlace}
                        className="pulsable h-11 rounded-[14px] border border-hairline text-[15px] font-semibold text-foreground flex items-center justify-center gap-2 disabled:opacity-40">
                        <Copy className="h-4 w-4" /> Copiar enlace
                    </button>
                    <a href={enlace} target="_blank" rel="noopener noreferrer"
                        className="pulsable h-11 rounded-[14px] border border-hairline text-[15px] font-semibold text-foreground flex items-center justify-center gap-2">
                        <Eye className="h-4 w-4" /> Ver cómo la ve
                    </a>
                </div>
                <p className="mt-3 text-[13px] text-muted-foreground" aria-live="polite">
                    {estado ? AVISO_FIJO[estado] : 'La abre sin cuenta, directa en la canción, con tono y tamaño a su gusto.'}
                </p>
            </div>
        </Hoja>
    );
}

type Modo = 'cifrado' | 'letra';
function HojaCompartir({ abierta, onCerrar, titulo, nombre, que, explicacion, idDe, crearId, enlaceDe, deps, publicar, fijo, encima }: {
    abierta: boolean; onCerrar: () => void; titulo: string; nombre: string; que: string; explicacion: string;
    idDe: (m: Modo) => string | undefined; crearId: (m: Modo) => void; enlaceDe: (conLetra: boolean, id?: string) => string; deps: unknown[];
    // Un envío rápido: se sube una vez con lo de ahora (no se vigila después) y los textos lo dicen
    publicar?: (conLetra: boolean, id: string) => void; fijo?: boolean; encima?: ReactNode;
}) {
    const [conLetra, setConLetra] = useState(false);
    const [qr, setQr] = useState(false);
    const modo: Modo = conLetra ? 'letra' : 'cifrado';
    const id = idDe(modo);
    // La primera vez que se comparte (cifrado o con letra), su id; y se sube ya
    useEffect(() => {
        if (!abierta) return;
        if (!id) crearId(modo);
        if (!publicar) compartidosService.ahora();
    }, [abierta, id, modo]); // eslint-disable-line react-hooks/exhaustive-deps
    // El envío rápido: se sube al abrir y al cambiar el título o lo elegido (un poco después de escribir)
    useEffect(() => {
        if (!abierta || !id || !publicar) return;
        const t = setTimeout(() => publicar(conLetra, id), 400);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abierta, id, conLetra, ...deps]);
    const estado = useSyncExternalStore(compartidosService.suscribir, () => compartidosService.estado(id));
    const alDia = estado === 'al-dia';
    // Con la nube al día basta el id (13-nov, Víctor: «el enlace de compartir es gigante»): la
    // página lo lee de compartidos/{id}. Si no (sin cuenta, sin reglas, sin red), todo tras «#»
    const enlace = useMemo(() => {
        if (!abierta) return '';
        const largo = enlaceDe(conLetra, id);
        return alDia && id ? largo.slice(0, largo.indexOf('#')) : largo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abierta, conLetra, id, alDia, ...deps]);
    const largo = enlace.length;
    // WhatsApp corta los mensajes de más de ~65 000 caracteres
    const demasiado = largo > 60000;
    const mensaje = `${nombre} · ${que}${conLetra ? ' con letra' : ' (cifrado)'}: ${enlace}`;

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
                {encima}
                <p className={cn('mt-3 rounded-xl px-3 py-2 text-[13.5px] font-semibold', alDia ? 'bg-pastel-menta text-pastel-menta-ink' : 'bg-fill text-muted-foreground')} aria-live="polite">
                    {estado ? (fijo ? AVISO_FIJO : AVISO)[estado] : 'Preparando el enlace…'}
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
                        : fijo
                            ? `Si cambias algo, vuelve a enviarlo. (${largo.toLocaleString('es-ES')} caracteres)`
                            : alDia
                                ? `El enlace no cambia: mándalo una vez. (${largo.toLocaleString('es-ES')} caracteres)`
                                : `Mientras no se actualice solo, si cambias algo manda el enlace otra vez. (${largo.toLocaleString('es-ES')} caracteres)`}
                </p>
            </div>
        </Hoja>
    );
}

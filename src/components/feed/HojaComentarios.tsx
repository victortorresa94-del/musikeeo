import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Loader2, MessageCircle, Trash2, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import {
    MAX_COMENTARIO, claveDe, interaccionService, type Comentario, type Objetivo,
} from '../../services/interaccionService';
import { Avatar } from './TarjetasFeed';

// Hoja de comentarios de una publicación o del vídeo de un artista. Leer es público;
// escribir pide cuenta. Se ve en directo: lo que escriben otros aparece solo.

export interface DestinoComentarios {
    objetivo: Objetivo;
    /** «Rumba Sur» → «Comentarios · Rumba Sur» */
    titulo: string;
}

/** «ahora», «5 min», «3 h», «2 d» o «20 oct» */
function cuando(iso: string) {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'ahora';
    if (m < 60) return `${m} min`;
    if (m < 1440) return `${Math.floor(m / 60)} h`;
    if (m < 7 * 1440) return `${Math.floor(m / 1440)} d`;
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function HojaComentarios({ destino, onCerrar, onComentado, onBorrado }: {
    destino: DestinoComentarios | null;
    onCerrar: () => void;
    /** Para subir el contador de la tarjeta y apuntar el gesto */
    onComentado?: (d: DestinoComentarios) => void;
    onBorrado?: (d: DestinoComentarios) => void;
}) {
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [lista, setLista] = useState<Comentario[] | null>(null);
    const [fallo, setFallo] = useState(false);
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const finRef = useRef<HTMLDivElement>(null);
    const campoRef = useRef<HTMLTextAreaElement>(null);
    const clave = destino ? claveDe(destino.objetivo) : '';

    // Escuchar los comentarios mientras está abierta
    useEffect(() => {
        if (!clave) return;
        setLista(null); setFallo(false);
        const parar = interaccionService.escucharComentarios(clave,
            c => setLista(c),
            () => { setFallo(true); setLista([]); });
        return parar;
    }, [clave]);

    // Bajar al último al llegar uno nuevo
    useEffect(() => { finRef.current?.scrollIntoView({ block: 'end' }); }, [lista?.length]);

    // Móvil: bloquear lo de detrás y seguir al teclado de iOS
    useEffect(() => {
        if (!destino) return;
        const root = document.documentElement;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const vv = window.visualViewport;
        const sync = () => {
            if (!vv) return;
            root.style.setProperty('--hc-h', `${vv.height}px`);
            root.style.setProperty('--hc-top', `${vv.offsetTop}px`);
        };
        sync();
        vv?.addEventListener('resize', sync);
        vv?.addEventListener('scroll', sync);
        const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
        window.addEventListener('keydown', esc);
        return () => {
            document.body.style.overflow = prev;
            vv?.removeEventListener('resize', sync);
            vv?.removeEventListener('scroll', sync);
            window.removeEventListener('keydown', esc);
            root.style.removeProperty('--hc-h');
            root.style.removeProperty('--hc-top');
        };
    }, [destino, onCerrar]);

    const entrar = () => navigate('/login', { state: { from: location.pathname + location.search } });

    const enviar = async () => {
        if (!destino || !user || enviando) return;
        const limpio = texto.trim();
        if (!limpio) return;
        setEnviando(true);
        try {
            await interaccionService.comentar(destino.objetivo, {
                uid: user.uid,
                nombre: userProfile?.displayName || user.displayName || 'Usuario de Musikeeo',
                foto: userProfile?.photoURL || user.photoURL || undefined,
            }, limpio);
            setTexto('');
            onComentado?.(destino);
        } catch {
            toast.error('No se ha podido publicar el comentario. Inténtalo otra vez.');
        } finally {
            setEnviando(false);
            campoRef.current?.focus();
        }
    };

    const borrar = async (c: Comentario) => {
        if (!destino || !window.confirm('¿Eliminar este comentario?')) return;
        try { await interaccionService.borrarComentario(clave, c.id); onBorrado?.(destino); }
        catch { toast.error('No se pudo eliminar'); }
    };

    const puedeBorrar = (c: Comentario) => !!user && (c.autorId === user.uid || destino?.objetivo.duenioId === user.uid);

    return createPortal(
        <AnimatePresence>
            {destino && (
                <motion.div
                    key="comentarios"
                    className="fixed inset-x-0 top-[var(--hc-top,0px)] h-[var(--hc-h,100dvh)] z-[85] flex items-end md:items-center justify-center"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                    <button aria-label="Cerrar comentarios" className="absolute inset-0 bg-black/60" onClick={onCerrar} />
                    <motion.div
                        role="dialog" aria-modal="true" aria-label={`Comentarios de ${destino.titulo}`}
                        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                        className="relative w-full md:max-w-md h-[min(78%,640px)] md:h-[min(80%,640px)] flex flex-col bg-sheet text-foreground rounded-t-[22px] md:rounded-[22px] border border-hairline shadow-e3"
                    >
                        <header className="shrink-0 px-4 pt-2 pb-3 border-b border-hairline">
                            <div className="mx-auto h-1 w-9 rounded-full bg-fill-strong md:hidden" />
                            <div className="mt-2 flex items-center justify-between gap-3">
                                <span className="w-9" />
                                <h2 className="min-w-0 truncate text-center text-[16px] font-bold">Comentarios</h2>
                                <button onClick={onCerrar} aria-label="Cerrar" className="h-9 w-9 rounded-full bg-fill flex items-center justify-center active:opacity-70">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </header>

                        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3">
                            {lista === null ? (
                                <div className="h-full flex items-center justify-center" aria-busy="true" aria-label="Cargando comentarios">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : lista.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                    <span className="h-12 w-12 rounded-full bg-fill flex items-center justify-center">
                                        <MessageCircle className="h-6 w-6" />
                                    </span>
                                    <p className="mt-3 text-[17px] font-bold">{fallo ? 'Ahora no se pueden ver los comentarios' : 'Aún no hay comentarios'}</p>
                                    <p className="mt-1 text-[15px] text-muted-foreground">
                                        {fallo ? 'Prueba otra vez en un rato.' : `Di algo a ${destino.titulo}: un bolo, una colaboración o qué te ha parecido.`}
                                    </p>
                                </div>
                            ) : (
                                <ul className="space-y-4">
                                    {lista.map(c => (
                                        <li key={c.id} className="flex items-start gap-3">
                                            <Avatar src={c.autorFoto} name={c.autorNombre} className="h-9 w-9 shrink-0 text-[14px]" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[14px] leading-tight">
                                                    <span className="font-bold">{c.autorNombre}</span>
                                                    <span className="ml-2 text-muted-foreground">{cuando(c.creadoEn)}</span>
                                                </p>
                                                <p className="mt-0.5 text-[15px] leading-snug whitespace-pre-line break-words">{c.texto}</p>
                                            </div>
                                            {puedeBorrar(c) && (
                                                <button onClick={() => borrar(c)} aria-label="Eliminar comentario"
                                                    className="shrink-0 h-8 w-8 -mr-1 rounded-full flex items-center justify-center text-muted-foreground active:bg-fill">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div ref={finRef} />
                        </div>

                        <footer className="shrink-0 border-t border-hairline px-3 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                            {user ? (
                                <div className="flex items-end gap-2">
                                    <Avatar src={userProfile?.photoURL || user.photoURL || undefined} name={userProfile?.displayName || user.displayName || 'Tú'} className="h-9 w-9 shrink-0 text-[14px]" />
                                    <textarea
                                        ref={campoRef}
                                        value={texto}
                                        onChange={e => setTexto(e.target.value.slice(0, MAX_COMENTARIO))}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void enviar(); } }}
                                        placeholder="Añade un comentario…"
                                        rows={1}
                                        aria-label="Escribe un comentario"
                                        className="flex-1 min-w-0 max-h-28 resize-none rounded-[18px] bg-fill border border-hairline px-3.5 py-2 text-[16px] leading-snug placeholder:text-muted-foreground focus:outline-none focus:border-hairline-strong"
                                    />
                                    <button onClick={() => void enviar()} disabled={!texto.trim() || enviando} aria-label="Publicar comentario"
                                        className={cn('pulsable shrink-0 h-9 w-9 rounded-full flex items-center justify-center bg-primary text-primary-foreground disabled:opacity-40')}>
                                        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5" strokeWidth={2.5} />}
                                    </button>
                                </div>
                            ) : (
                                <button onClick={entrar} className="w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground text-[16px] font-bold">
                                    Entra para comentar
                                </button>
                            )}
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}

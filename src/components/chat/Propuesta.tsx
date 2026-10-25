import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarCheck, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ChatMessage, PropuestaBolo } from '../../types';

// Propuesta de bolo dentro del chat: fecha, sitio y caché por escrito, y el otro la acepta con
// un toque. Es lo que hace que el trato se cierre en Musikeeo y no por WhatsApp (sin pago
// todavía: la Reserva protegida llegará encima de esto).

const MAX_SITIO = 120, MAX_DURACION = 60, MAX_NOTAS = 300, MAX_CACHE = 100000;

import { euros, fechaLarga } from '../../lib/propuesta';

const hoy = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ─── Aviso cuando se escribe un teléfono, un email o «WhatsApp» ─────────────
// Hasta que se acepta una propuesta, el teléfono y el email salen tapados al enviar
export function AvisoContacto({ onProponer }: { onProponer: () => void }) {
    return (
        <div role="note" className="mx-3 mb-1.5 flex items-center gap-3 rounded-[14px] bg-pastel-mantequilla px-3.5 py-2.5 text-pastel-mantequilla-ink">
            <p className="flex-1 text-[13px] leading-snug">
                <b className="font-bold">El teléfono y el email se ocultan</b> hasta que aceptéis una propuesta de bolo. Así fecha, sitio y caché quedan por escrito para los dos.
            </p>
            <button type="button" onClick={onProponer} className="pulsable shrink-0 h-8 px-3 rounded-full bg-foreground text-background text-[13px] font-semibold">
                Hacer propuesta
            </button>
        </div>
    );
}

// ─── Tarjeta de la propuesta en el chat ─────────────────────────────────────
export function TarjetaPropuesta({ msg, mia, respuesta, onResponder }: {
    msg: ChatMessage;
    mia: boolean;
    respuesta?: ChatMessage;
    onResponder: (aceptada: boolean) => void;
}) {
    const p = msg.propuesta;
    const [enviando, setEnviando] = useState(false);
    if (!p) return null;
    const responder = async (aceptada: boolean) => {
        if (enviando) return;
        setEnviando(true);
        try { await onResponder(aceptada); } finally { setEnviando(false); }
    };
    return (
        <div className={cn('w-[min(320px,86%)] rounded-[20px] border border-hairline bg-sheet shadow-e1 overflow-hidden', mia ? 'ml-auto' : 'mr-auto')}>
            <div className="flex items-center gap-2 px-4 pt-3 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
                <CalendarCheck className="h-4 w-4" /> Propuesta de bolo
            </div>
            <div className="px-4 pt-2 pb-3">
                <p className="text-[17px] font-bold text-foreground first-letter:uppercase">{fechaLarga(p.fecha)}{p.hora ? ` · ${p.hora}` : ''}</p>
                <p className="mt-0.5 text-[15px] text-foreground break-words">{p.sitio}</p>
                <p className="mt-2 text-[24px] font-bold leading-none text-foreground">{euros(p.cache)}</p>
                {p.duracion && <p className="mt-2 text-[14px] text-muted-foreground">{p.duracion}</p>}
                {p.notas && <p className="mt-1 text-[14px] text-muted-foreground whitespace-pre-wrap break-words">{p.notas}</p>}
            </div>
            <div className="border-t border-hairline px-4 py-2.5">
                {respuesta ? (
                    respuesta.aceptada ? (
                        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-pastel-menta text-pastel-menta-ink text-[13px] font-semibold">
                            <Check className="h-4 w-4" strokeWidth={2.5} /> Aceptada
                        </span>
                    ) : (
                        <span className="text-[13px] font-medium text-muted-foreground">No aceptada</span>
                    )
                ) : mia ? (
                    <span className="text-[13px] font-medium text-muted-foreground">Esperando respuesta</span>
                ) : (
                    <div className="flex gap-2">
                        <button type="button" disabled={enviando} onClick={() => responder(true)}
                            className="pulsable flex-1 h-9 rounded-full bg-primary text-primary-foreground text-[14px] font-bold disabled:opacity-50">
                            Aceptar
                        </button>
                        <button type="button" disabled={enviando} onClick={() => responder(false)}
                            className="pulsable h-9 px-4 rounded-full bg-fill-strong text-foreground text-[14px] font-semibold disabled:opacity-50">
                            No, gracias
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Hoja para escribir la propuesta ────────────────────────────────────────
export function HojaPropuesta({ abierta, onCerrar, onEnviar }: {
    abierta: boolean;
    onCerrar: () => void;
    onEnviar: (p: PropuestaBolo) => Promise<void>;
}) {
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [sitio, setSitio] = useState('');
    const [cache, setCache] = useState('');
    const [duracion, setDuracion] = useState('');
    const [notas, setNotas] = useState('');
    const [fallo, setFallo] = useState('');
    const [enviando, setEnviando] = useState(false);

    // Móvil: bloquear lo de detrás y seguir al teclado de iOS
    useEffect(() => {
        if (!abierta) return;
        const root = document.documentElement;
        const vv = window.visualViewport;
        const sync = () => {
            if (!vv) return;
            root.style.setProperty('--hp-h', `${vv.height}px`);
            root.style.setProperty('--hp-top', `${vv.offsetTop}px`);
        };
        sync();
        vv?.addEventListener('resize', sync);
        vv?.addEventListener('scroll', sync);
        const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
        window.addEventListener('keydown', esc);
        return () => {
            vv?.removeEventListener('resize', sync);
            vv?.removeEventListener('scroll', sync);
            window.removeEventListener('keydown', esc);
            root.style.removeProperty('--hp-h');
            root.style.removeProperty('--hp-top');
        };
    }, [abierta, onCerrar]);

    const importe = Number(cache.replace(/\./g, '').replace(',', '.'));

    const enviar = async () => {
        if (enviando) return;
        if (!fecha || fecha < hoy()) return setFallo('Elige una fecha de hoy en adelante.');
        if (sitio.trim().length < 2) return setFallo('Pon dónde es el bolo.');
        if (!Number.isFinite(importe) || importe <= 0 || importe > MAX_CACHE) return setFallo('Pon el caché en euros.');
        setFallo('');
        // Solo los campos que tienen algo: Firestore no admite valores vacíos (undefined)
        const p: PropuestaBolo = { fecha, sitio: sitio.trim().slice(0, MAX_SITIO), cache: Math.round(importe * 100) / 100 };
        if (hora) p.hora = hora;
        if (duracion.trim()) p.duracion = duracion.trim().slice(0, MAX_DURACION);
        if (notas.trim()) p.notas = notas.trim().slice(0, MAX_NOTAS);
        setEnviando(true);
        try {
            await onEnviar(p);
            setFecha(''); setHora(''); setSitio(''); setCache(''); setDuracion(''); setNotas('');
            onCerrar();
        } catch {
            setFallo('No se ha enviado. Revisa la conexión e inténtalo otra vez.');
        } finally {
            setEnviando(false);
        }
    };

    const campo = 'w-full h-11 rounded-[12px] bg-fill border border-hairline px-3.5 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hairline-strong';
    const etiqueta = 'block text-[13px] font-semibold text-muted-foreground mb-1.5';

    return createPortal(
        <AnimatePresence>
            {abierta && (
                <motion.div key="propuesta" className="fixed inset-x-0 top-[var(--hp-top,0px)] h-[var(--hp-h,100dvh)] z-[85] flex items-end md:items-center justify-center"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <button aria-label="Cerrar propuesta" className="absolute inset-0 bg-black/60" onClick={onCerrar} />
                    <motion.div role="dialog" aria-modal="true" aria-label="Proponer un bolo"
                        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                        className="relative w-full md:max-w-md max-h-[92%] flex flex-col bg-sheet text-foreground rounded-t-[22px] md:rounded-[22px] border border-hairline shadow-e3">
                        <header className="shrink-0 px-4 pt-2 pb-3 border-b border-hairline">
                            <div className="mx-auto h-1 w-9 rounded-full bg-fill-strong md:hidden" />
                            <div className="mt-2 flex items-center justify-between gap-3">
                                <span className="w-9" />
                                <h2 className="text-[16px] font-bold">Proponer un bolo</h2>
                                <button onClick={onCerrar} aria-label="Cerrar" className="h-9 w-9 rounded-full bg-fill flex items-center justify-center active:opacity-70">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </header>
                        <form onSubmit={e => { e.preventDefault(); void enviar(); }} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3.5">
                            <p className="text-[14px] text-muted-foreground">Queda por escrito en el chat y la otra persona la acepta con un toque.</p>
                            <div className="grid grid-cols-[1fr_auto] gap-3">
                                <label><span className={etiqueta}>Fecha</span>
                                    <input type="date" required min={hoy()} value={fecha} onChange={e => setFecha(e.target.value)} className={campo} /></label>
                                <label><span className={etiqueta}>Hora</span>
                                    <input type="time" value={hora} onChange={e => setHora(e.target.value)} className={cn(campo, 'w-[7.5rem]')} /></label>
                            </div>
                            <label className="block"><span className={etiqueta}>Dónde</span>
                                <input value={sitio} onChange={e => setSitio(e.target.value.slice(0, MAX_SITIO))} placeholder="Sala, masía, bar… y ciudad" className={campo} /></label>
                            <div className="grid grid-cols-2 gap-3">
                                <label><span className={etiqueta}>Caché (€)</span>
                                    <input inputMode="decimal" value={cache} onChange={e => setCache(e.target.value.replace(/[^\d.,]/g, '').slice(0, 9))} placeholder="600" className={campo} /></label>
                                <label><span className={etiqueta}>Duración</span>
                                    <input value={duracion} onChange={e => setDuracion(e.target.value.slice(0, MAX_DURACION))} placeholder="2 h" className={campo} /></label>
                            </div>
                            <label className="block"><span className={etiqueta}>Notas (opcional)</span>
                                <textarea rows={2} value={notas} onChange={e => setNotas(e.target.value.slice(0, MAX_NOTAS))} placeholder="Sonido incluido, pruebas a las 19:00…"
                                    className={cn(campo, 'h-auto py-2.5 resize-none leading-snug')} /></label>
                            {fallo && <p role="alert" className="text-[13px] text-red-500">{fallo}</p>}
                            <button type="submit" disabled={enviando} className="pulsable w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground text-[16px] font-bold disabled:opacity-50">
                                {enviando ? 'Enviando…' : 'Enviar propuesta'}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}

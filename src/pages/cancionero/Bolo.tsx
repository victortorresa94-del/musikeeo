import { useMemo, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, Clock, Eye, ListMusic, MapPin, MinusCircle, MoreHorizontal, Plus, Send, StickyNote, Trash2, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { ConMenu } from '../../components/cancionero/ConMenu';
import { BotonHoja, Hoja } from '../../components/cancionero/Hoja';
import { CompartirBolo } from '../../components/cancionero/CompartirGrupo';
import { iconoRepertorio, pastelDe } from '../../components/cancionero/estilo';
import { textoDuracion } from '../../lib/biblioteca';
import { DURACION_MEDIA, enlaceBolo, enlacesMapa, esHora, minutosDe, paqueteBolo } from '../../lib/compartirBolo';
import type { Bolo as TipoBolo, HoraBolo, Repertorio } from '../../types/cancionero';

// El bolo (13-nov): lo que hay que pasar a los músicos de una actuación, aparte del repertorio.
// Víctor: «crear un bolo y compartir bolo… el repertorio, el horario de cada cosa, la ubicación…
// un panel donde puedan ver todo, el título, la duración del concierto». Se guarda al escribir
// (en el móvil al momento y en la cuenta cuando paras) y el enlace se pone al día solo.

const MOMENTOS = ['Llegada', 'Montaje', 'Prueba de sonido', 'Comida', 'Descanso', 'Recogida'];

function fechaLarga(f: string): string {
    const [a, m, d] = (f || '').split('-').map(Number);
    if (!a) return '';
    const t = new Date(a, m - 1, d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function Bolo() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { bolos, repertorios, canciones, listo, guardarBolo, borrarBolo } = useCancionero();
    const bolo = bolos.find(b => b.id === id);
    const [compartir, setCompartir] = useState(false);
    const [eligiendoSet, setEligiendoSet] = useState(false);
    const [menu, setMenu] = useState(false);

    // Lo que dura cada set (las que no tienen duración, 3:30)
    const duracionDe = useMemo(() => {
        const porId = new Map(canciones.map(c => [c.id, c]));
        return (r: Repertorio) => {
            const temas = r.canciones.map(c => porId.get(c)).filter(Boolean);
            const faltan = temas.filter(c => !c!.duracion).length;
            return { segundos: temas.reduce((s, c) => s + (c!.duracion ?? 0), 0) + faltan * DURACION_MEDIA, aprox: faltan > 0, temas: temas.length };
        };
    }, [canciones]);

    if (!bolo) return listo ? <Navigate to="/cancionero?ver=bolos" replace /> : null;

    const cambiar = (cambio: Partial<TipoBolo>) => guardarBolo({ ...bolo, ...cambio }, { esperar: true });
    const porId = new Map(repertorios.map(r => [r.id, r]));
    const sets = bolo.sets.map(s => ({ s, r: porId.get(s.repertorioId) })).filter((x): x is { s: typeof x.s; r: Repertorio } => !!x.r);
    const musica = sets.reduce((t, { r }) => t + duracionDe(r).segundos, 0);
    const aprox = sets.some(({ r }) => duracionDe(r).aprox);
    const ponerHorario = (horario: HoraBolo[]) => cambiar({ horario });
    // Por hora al acabar de escribirla (lo que no tiene hora, al final)
    const ordenarHorario = () => {
        const orden = [...bolo.horario].map((h, i) => ({ h, i })).sort((a, b) =>
            (esHora(a.h.hora) ? minutosDe(a.h.hora) : Infinity) - (esHora(b.h.hora) ? minutosDe(b.h.hora) : Infinity) || a.i - b.i).map(x => x.h);
        if (orden.some((h, i) => h !== bolo.horario[i])) ponerHorario(orden);
    };
    const borrar = () => {
        void borrarBolo(bolo.id);
        toast('Bolo borrado', { action: { label: 'Deshacer', onClick: () => guardarBolo(bolo) } });
        navigate('/cancionero?ver=bolos', { replace: true });
    };
    const verComoLoVen = () => {
        const url = enlaceBolo({ ...paqueteBolo(bolo, repertorios, canciones, false), u: new Date().toISOString() }, bolo.compartido?.cifrado);
        window.open(url, '_blank', 'noopener');
    };

    const campo = 'w-full min-w-0 h-11 rounded-xl bg-transparent px-1 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none';
    // Ancha para «12:30» en el iPhone y «07:00 PM» en un ordenador en inglés
    const horaCampo = 'w-[124px] shrink-0 h-10 rounded-xl bg-fill-strong px-2 text-[16px] font-semibold text-foreground tabular-nums focus:outline-none';
    const fila = 'flex items-center gap-3 px-4 min-h-[52px] border-b border-hairline last:border-b-0';
    const libres = repertorios.filter(r => !bolo.sets.some(s => s.repertorioId === r.id))
        .sort((a, b) => Number(b.fecha === bolo.fecha) - Number(a.fecha === bolo.fecha) || (b.fecha || '').localeCompare(a.fecha || ''));

    return (
        <ConMenu activo={{ ver: 'bolos' }}>
            <div className="max-w-3xl mx-auto lg:max-w-none lg:mx-0 px-4 md:px-0 pt-3 md:pt-6 pb-16">
                <div className="flex items-center justify-between gap-2">
                    <Link to="/cancionero?ver=bolos" className="inline-flex items-center -ml-1.5 text-[15px] text-muted-foreground active:opacity-60">
                        <ChevronLeft className="h-5 w-5" /> Bolos
                    </Link>
                    <button onClick={() => setMenu(true)} aria-label="Más opciones del bolo" className="pulsable h-9 w-9 rounded-full bg-fill flex items-center justify-center text-foreground">
                        <MoreHorizontal className="h-5 w-5" />
                    </button>
                </div>
                <p className="mt-2 text-[13px] font-semibold text-muted-foreground">Bolo</p>
                <input value={bolo.titulo} onChange={e => cambiar({ titulo: e.target.value.slice(0, 120) })} aria-label="Nombre del bolo" placeholder="Nombre del bolo"
                    className="w-full bg-transparent font-heading !text-[28px] font-bold leading-tight text-foreground placeholder:text-muted-foreground focus:outline-none" />
                <p className="mt-1 text-[15px] text-muted-foreground">
                    {[fechaLarga(bolo.fecha) || 'Sin fecha', sets.length ? `${aprox ? '≈ ' : ''}${textoDuracion(musica)} de música` : ''].filter(Boolean).join(' · ')}
                </p>

                {/* Lo principal: mandárselo a los músicos */}
                <button onClick={() => setCompartir(true)}
                    className="pulsable mt-4 w-full h-[60px] rounded-[18px] bg-primary text-primary-foreground font-bold text-[18px] flex items-center justify-center gap-2">
                    <Send className="h-5 w-5" /> Compartir el bolo
                </button>

                {/* Cuándo y dónde */}
                <Seccion titulo="Cuándo y dónde" icono={<MapPin className="h-4 w-4" />}>
                    <label className={fila}>
                        <span className="w-24 shrink-0 text-[15px] font-semibold text-foreground">Fecha</span>
                        <input type="date" value={bolo.fecha} onChange={e => cambiar({ fecha: e.target.value })} aria-label="Fecha del bolo" className={cn(campo, 'text-right')} />
                    </label>
                    <label className={fila}>
                        <span className="w-24 shrink-0 text-[15px] font-semibold text-foreground">Lugar</span>
                        <input value={bolo.lugar ?? ''} onChange={e => cambiar({ lugar: e.target.value.slice(0, 200) || undefined })} placeholder="Sala, fiesta, restaurante…" aria-label="Lugar" className={campo} />
                    </label>
                    <label className={fila}>
                        <span className="w-24 shrink-0 text-[15px] font-semibold text-foreground">Dirección</span>
                        <input value={bolo.direccion ?? ''} onChange={e => cambiar({ direccion: e.target.value.slice(0, 300) || undefined })} placeholder="Calle, número y pueblo" aria-label="Dirección" className={campo} />
                    </label>
                    {(bolo.direccion || bolo.lugar) && (
                        <div className="px-4 py-2.5">
                            <a href={enlacesMapa(bolo.direccion || bolo.lugar!).google} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold text-primary-ink underline underline-offset-2">Comprobar en el mapa</a>
                        </div>
                    )}
                </Seccion>

                {/* Los sets: los repertorios, cada uno con su hora */}
                <Seccion titulo={sets.length > 1 ? `Sets · ${aprox ? '≈ ' : ''}${textoDuracion(musica)}` : 'Repertorio'} icono={<ListMusic className="h-4 w-4" />}>
                    {sets.map(({ s, r }) => {
                        const d = duracionDe(r);
                        return (
                            <div key={r.id} className="px-4 py-3 border-b border-hairline last:border-b-0">
                                <div className="flex items-start gap-3">
                                    <Link to={`/cancionero/repertorio/${r.id}`} className="flex-1 min-w-0 flex items-start gap-3 active:opacity-60">
                                        <span className={cn('h-10 w-10 shrink-0 rounded-[11px] flex items-center justify-center', pastelDe(r.id).fondo)}>
                                            <img src={iconoRepertorio(r.nombre)} alt="" className="h-8 w-8 object-contain" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-[15.5px] font-semibold leading-snug text-foreground">{r.nombre}</span>
                                            <span className="block text-[13.5px] text-muted-foreground">{d.temas} {d.temas === 1 ? 'tema' : 'temas'} · {d.aprox ? '≈ ' : ''}{textoDuracion(d.segundos)}</span>
                                        </span>
                                    </Link>
                                    <button onClick={() => cambiar({ sets: bolo.sets.filter(x => x !== s) })} aria-label={`Quitar ${r.nombre} del bolo`}
                                        className="-mr-1.5 h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-muted-foreground active:bg-fill-strong"><MinusCircle className="h-5 w-5" /></button>
                                </div>
                                <label className="mt-2 ml-[52px] flex items-center gap-2 text-[14px] font-semibold text-muted-foreground">
                                    Empieza a las
                                    <input type="time" value={s.hora ?? ''} aria-label={`Hora de ${r.nombre}`}
                                        onChange={e => cambiar({ sets: bolo.sets.map(x => (x === s ? { ...x, hora: e.target.value || undefined } : x)) })}
                                        className={horaCampo} />
                                </label>
                            </div>
                        );
                    })}
                    <button onClick={() => setEligiendoSet(true)} disabled={!libres.length}
                        className="w-full flex items-center gap-2 px-4 min-h-[52px] text-[15px] font-semibold text-foreground active:bg-fill-strong disabled:opacity-40">
                        <Plus className="h-5 w-5" /> {sets.length ? 'Añadir otro set' : 'Añadir el repertorio'}
                    </button>
                </Seccion>

                {/* El horario de cada cosa (los sets salen solos, con su hora) */}
                <Seccion titulo="Horario" icono={<Clock className="h-4 w-4" />}>
                    {bolo.horario.map((h, i) => (
                        <div key={i} className={fila}>
                            <input type="time" value={h.hora} aria-label={`Hora de ${h.que || 'este momento'}`}
                                onChange={e => ponerHorario(bolo.horario.map((x, j) => (j === i ? { ...x, hora: e.target.value } : x)))} onBlur={ordenarHorario}
                                className={horaCampo} />
                            <input value={h.que} onChange={e => ponerHorario(bolo.horario.map((x, j) => (j === i ? { ...x, que: e.target.value.slice(0, 200) } : x)))}
                                placeholder="Qué pasa a esa hora" aria-label="Qué pasa a esa hora" className={campo} />
                            <button onClick={() => ponerHorario(bolo.horario.filter((_, j) => j !== i))} aria-label={`Quitar ${h.que || 'esta hora'}`}
                                className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-muted-foreground active:bg-fill-strong"><MinusCircle className="h-5 w-5" /></button>
                        </div>
                    ))}
                    <div className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                            {MOMENTOS.filter(m => !bolo.horario.some(h => h.que === m)).map(m => (
                                <button key={m} onClick={() => ponerHorario([...bolo.horario, { hora: '', que: m }])}
                                    className="pulsable h-9 pl-2 pr-3 rounded-full bg-fill-strong text-[14px] font-semibold text-foreground flex items-center gap-1">
                                    <Plus className="h-4 w-4" /> {m}
                                </button>
                            ))}
                            <button onClick={() => ponerHorario([...bolo.horario, { hora: '', que: '' }])}
                                className="pulsable h-9 pl-2 pr-3 rounded-full border border-dashed border-hairline-strong text-[14px] font-semibold text-muted-foreground flex items-center gap-1">
                                <Plus className="h-4 w-4" /> Otra cosa
                            </button>
                        </div>
                        {sets.some(({ s }) => s.hora) && <p className="mt-2 text-[13px] text-muted-foreground">Los sets salen solos en el horario, con su hora de empezar y de acabar.</p>}
                    </div>
                </Seccion>

                {/* A quién llamar */}
                <Seccion titulo="Contacto" icono={<User className="h-4 w-4" />}>
                    <label className={fila}>
                        <span className="w-24 shrink-0 text-[15px] font-semibold text-foreground">Nombre</span>
                        <input value={bolo.contacto ?? ''} onChange={e => cambiar({ contacto: e.target.value.slice(0, 120) || undefined })} placeholder="Quién os recibe" aria-label="Contacto" className={campo} />
                    </label>
                    <label className={fila}>
                        <span className="w-24 shrink-0 text-[15px] font-semibold text-foreground">Teléfono</span>
                        <input type="tel" inputMode="tel" value={bolo.telefono ?? ''} onChange={e => cambiar({ telefono: e.target.value.slice(0, 40) || undefined })} placeholder="600 000 000" aria-label="Teléfono" className={campo} />
                    </label>
                </Seccion>

                {/* Lo demás */}
                <Seccion titulo="Notas" icono={<StickyNote className="h-4 w-4" />}>
                    <textarea value={bolo.notas ?? ''} onChange={e => cambiar({ notas: e.target.value.slice(0, 5000) || undefined })} rows={5}
                        placeholder="Dónde aparcar, por dónde se entra, la ropa, la comida, el pago…" aria-label="Notas del bolo"
                        className="block w-full resize-y bg-transparent px-4 py-3 text-[16px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </Seccion>
            </div>

            <CompartirBolo abierta={compartir} onCerrar={() => setCompartir(false)} bolo={bolo} />

            <Hoja abierta={eligiendoSet} onCerrar={() => setEligiendoSet(false)} titulo="Añadir un set" derecha={<BotonHoja onClick={() => setEligiendoSet(false)}>Cerrar</BotonHoja>} alta={libres.length > 6}>
                <div className="px-4 pb-5">
                    <div className="rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                        {libres.map(r => (
                            <button key={r.id} onClick={() => { setEligiendoSet(false); cambiar({ sets: [...bolo.sets, { repertorioId: r.id }] }); }}
                                className="w-full flex items-center gap-3 px-4 min-h-[60px] py-2 text-left active:bg-fill-strong">
                                <span className={cn('h-10 w-10 shrink-0 rounded-[11px] flex items-center justify-center', pastelDe(r.id).fondo)}>
                                    <img src={iconoRepertorio(r.nombre)} alt="" className="h-8 w-8 object-contain" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-[15.5px] font-semibold text-foreground">{r.nombre}</span>
                                    <span className="block text-[13.5px] text-muted-foreground">{fechaLarga(r.fecha) || 'Sin fecha'} · {r.canciones.length} {r.canciones.length === 1 ? 'tema' : 'temas'}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </Hoja>

            <Hoja abierta={menu} onCerrar={() => setMenu(false)} titulo={bolo.titulo || 'Bolo'} derecha={<BotonHoja fuerte onClick={() => setMenu(false)}>Listo</BotonHoja>}>
                <div className="px-4 pb-5">
                    <div className="rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                        <button onClick={() => { setMenu(false); verComoLoVen(); }} className="w-full h-12 px-4 flex items-center gap-3 text-[15px] text-foreground active:bg-fill-strong">
                            <Eye className="h-[18px] w-[18px]" /> Ver cómo lo ven
                        </button>
                        <button onClick={() => { setMenu(false); borrar(); }} className="w-full h-12 px-4 flex items-center gap-3 text-[15px] text-destructive active:bg-fill-strong">
                            <Trash2 className="h-[18px] w-[18px]" /> Borrar el bolo
                        </button>
                    </div>
                    <p className="mt-3 text-[13px] text-muted-foreground">Borrar el bolo no borra sus repertorios.</p>
                </div>
            </Hoja>
        </ConMenu>
    );
}

function Seccion({ titulo, icono, children }: { titulo: string; icono: ReactNode; children: ReactNode }) {
    return (
        <section className="mt-6">
            <h2 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{icono}{titulo}</h2>
            <div className="rounded-2xl bg-fill overflow-hidden">{children}</div>
        </section>
    );
}

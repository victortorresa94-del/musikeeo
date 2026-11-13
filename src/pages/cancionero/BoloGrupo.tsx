import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, ChevronRight, Clock, ListMusic, MapPin, MessageCircle, Phone, RefreshCw, StickyNote, Timer, User } from 'lucide-react';
import { escucharCompartido } from '../../services/compartidosService';
import { cn } from '../../lib/utils';
import { codificar } from '../../lib/compartir';
import { cuandoSeToca, descodificarBolo, esConcierto, duracionSet, enlacesMapa, horarioCompleto, nombreEnBolo, telefonoLimpio, type BoloCompartido } from '../../lib/compartirBolo';
import { textoDuracion } from '../../lib/biblioteca';
import { ICONO, iconoRepertorio, pastelDe } from '../../components/cancionero/estilo';
import { VistaSet } from './Grupo';

// La página del bolo para los músicos (13-nov): sin cuenta y sin la app alrededor. Víctor: «un
// link donde puedan acceder al repertorio, al horario de cada cosa y a la ubicación… como un
// panel donde puedan ver todo, el título, la duración del concierto».
// Como el enlace del repertorio: el bolo viene tras «#» y, con id (/bolo/{id}), lo último de la
// nube en directo; se guarda una copia en el móvil para abrirlo sin cobertura. Cada set se abre
// con la misma lista y el mismo escenario que el enlace del repertorio (y la versión propia).

const CLAVE_COPIA = 'musikeeo-bolo-copia:';
function leerCopia(id: string | undefined): BoloCompartido | null {
    if (!id) return null;
    try { const t = localStorage.getItem(CLAVE_COPIA + id); return t ? descodificarBolo(t) : null; } catch { return null; }
}
const masNuevo = (a: BoloCompartido | null, b: BoloCompartido | null) => (!a ? b : !b ? a : (b.u ?? '') > (a.u ?? '') ? b : a);

export default function BoloGrupo() {
    const { id } = useParams<{ id?: string }>();
    const [datos, setDatos] = useState<BoloCompartido | null>(() => masNuevo(descodificarBolo(window.location.hash), leerCopia(id)));
    const [setAbierto, setSetAbierto] = useState<number | null>(null);
    const [aviso, setAviso] = useState<string | null>(null);
    // El enlace corto (solo el id) no trae nada: se espera a la nube antes de decir que no se abre
    const [esperando, setEsperando] = useState(() => !!id);
    const datosRef = useRef(datos);
    useEffect(() => { datosRef.current = datos; }, [datos]);

    // Lo último de la nube, en directo
    useEffect(() => {
        if (!id) return;
        return escucharCompartido<BoloCompartido>(id, p => {
            setEsperando(false);
            const antes = datosRef.current;
            if (antes && antes.u && (antes.u ?? '') >= (p.u ?? '')) return;
            try { localStorage.setItem(CLAVE_COPIA + id, codificar(p)); } catch { /* sin almacenamiento */ }
            setDatos(p);
            if (antes && antes.u !== p.u) {
                // Con un set abierto, se sigue en el mismo (por su nombre)
                setSetAbierto(s => {
                    if (s === null) return s;
                    const j = p.s.findIndex(x => x.n === antes.s[s]?.n);
                    return j >= 0 ? j : null;
                });
                setAviso('Actualizado con los últimos cambios');
                setTimeout(() => setAviso(null), 4000);
            }
        }, () => setEsperando(false), descodificarBolo);
    }, [id]);

    // Sin respuesta de la nube en 12 s (sin cobertura), se deja de esperar
    useEffect(() => {
        if (!esperando) return;
        const t = setTimeout(() => setEsperando(false), 12000);
        return () => clearTimeout(t);
    }, [esperando]);

    // Blanca (13-nov, Víctor: «la página de compartir el bolo al músico, que sea blanca»), aunque
    // el móvil tenga el oscuro elegido; al salir, vuelve el de la persona. Y sin indexar
    useEffect(() => {
        const root = document.documentElement;
        const antes = root.classList.contains('dark');
        root.classList.remove('dark');
        const meta = document.querySelector('meta[name="theme-color"]');
        const color = meta?.getAttribute('content');
        meta?.setAttribute('content', '#FFFFFF');
        document.title = datos ? `${datos.n} · Bolo · Musikeeo` : 'Bolo · Musikeeo';
        const robots = document.createElement('meta');
        robots.name = 'robots';
        robots.content = 'noindex, nofollow';
        document.head.appendChild(robots);
        return () => {
            root.classList.toggle('dark', antes);
            robots.remove();
            if (color) meta?.setAttribute('content', color);
        };
    }, [datos]);

    useEffect(() => { if (setAbierto === null) window.scrollTo(0, 0); }, [setAbierto]);

    if (!datos && esperando) {
        return (
            <main className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center px-6 text-center" aria-busy="true">
                <img src={ICONO.repertorios} alt="" aria-hidden className="h-24 w-24 object-contain animate-pulse" />
                <p className="mt-4 text-[15px] text-muted-foreground">Abriendo…</p>
            </main>
        );
    }
    if (!datos) {
        return (
            <main className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center px-6 text-center">
                <img src={ICONO.repertorios} alt="" aria-hidden className="h-24 w-24 object-contain" />
                <h1 className="mt-4 font-heading text-[24px] font-bold">Este enlace no se puede abrir</h1>
                <p className="mt-2 max-w-sm text-[15px] text-muted-foreground">Puede que se haya cortado al copiarlo. Pide a quien te lo mandó que te lo vuelva a enviar.</p>
            </main>
        );
    }

    const toast = aviso && (
        <div role="status" className="fixed left-1/2 -translate-x-1/2 top-[calc(env(safe-area-inset-top)+60px)] z-30 h-9 px-3.5 rounded-full bg-sheet border border-hairline shadow-e3 text-[13.5px] font-semibold flex items-center gap-1.5">
            <RefreshCw className="h-4 w-4" /> {aviso}
        </div>
    );
    const set = setAbierto !== null ? datos.s[setAbierto] : null;
    if (set) {
        return (
            <>
                <VistaSet datos={set} setKey={`b:${id ?? datos.n}:${set.n}`} onVolver={() => setSetAbierto(null)} volver="El bolo" />
                {toast}
            </>
        );
    }
    return <><PanelBolo datos={datos} onAbrirSet={setSetAbierto} />{toast}</>;
}

function PanelBolo({ datos, onAbrirSet }: { datos: BoloCompartido; onAbrirSet: (i: number) => void }) {
    const fecha = datos.f ? new Date(`${datos.f}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
    // El «Concierto» que empieza a la vez que un set no se repite en el horario (ya sale el set)
    const momentos = horarioCompleto(datos).filter((m, _i, todos) =>
        !(m.set === undefined && esConcierto(m.que) && todos.some(x => x.set !== undefined && x.hora === m.hora)));
    const duraciones = datos.s.map(duracionSet);
    const musica = duraciones.reduce((s, d) => s + d.segundos, 0);
    const aprox = duraciones.some(d => d.aprox);
    const primerSet = momentos.find(m => m.set !== undefined);
    // Cuándo se toca, en grande (13-nov, Víctor: «debería destacar mucho más el horario del bolo…
    // que ponga más grande de 12:30 a 13:30»)
    const conciertos = cuandoSeToca(datos);
    const dondeIr = datos.di || datos.lu;
    const mapas = dondeIr ? enlacesMapa(dondeIr) : null;
    const tel = datos.te ? telefonoLimpio(datos.te) : null;

    return (
        <main className="min-h-[100dvh] bg-background text-foreground">
            <div className="max-w-2xl mx-auto px-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+32px)]">
                <p className="text-[13px] font-semibold text-muted-foreground">Bolo{datos.l ? ' · con letra' : ''}</p>
                <h1 className="mt-1 font-heading text-[28px] font-bold leading-tight">{datos.n}</h1>
                {(fecha || datos.lu) && <p className="mt-1 text-[15px] text-muted-foreground first-letter:uppercase">{[fecha, datos.lu].filter(Boolean).join(' · ')}</p>}

                {/* Cuándo se toca: lo primero que se busca, en grande */}
                {conciertos.length > 0 && (
                    <section className="mt-5 rounded-[22px] bg-foreground text-background px-5 py-4" aria-label="Cuándo se toca">
                        <p className="flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-[0.08em] opacity-70">
                            <Clock className="h-4 w-4" /> {conciertos.length > 1 ? 'Cuándo tocamos' : 'Concierto'}
                        </p>
                        <div className="mt-1.5 space-y-3">
                            {conciertos.map((c, i) => {
                                const nombre = c.set !== undefined ? c.que : conciertos.length > 1 || !/^concierto$/i.test((c.que ?? '').trim()) ? c.que : undefined;
                                const contenido = (
                                    <>
                                        <span className="block font-heading text-[44px] leading-[1.05] font-bold tabular-nums tracking-[-0.02em]"
                                            aria-label={c.hasta ? `De ${c.desde} a ${c.hasta}` : `A las ${c.desde}`}>
                                            {c.desde}{c.hasta && <span className="opacity-60"> – </span>}{c.hasta}
                                        </span>
                                        {(nombre || c.aprox) && (
                                            <span className="mt-0.5 block text-[15px] font-semibold opacity-80">
                                                {[nombre, c.aprox && c.hasta && 'acaba hacia esa hora'].filter(Boolean).join(' · ')}
                                            </span>
                                        )}
                                    </>
                                );
                                return c.set !== undefined
                                    ? <button key={i} onClick={() => onAbrirSet(c.set!)} className="w-full text-left flex items-center gap-2 active:opacity-70">
                                        <span className="flex-1 min-w-0">{contenido}</span><ChevronRight className="h-6 w-6 shrink-0 opacity-60" />
                                    </button>
                                    : <div key={i}>{contenido}</div>;
                            })}
                        </div>
                    </section>
                )}

                {/* De un vistazo */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {primerSet && !conciertos.length && <Dato icono={<Clock className="h-4 w-4" />}>Empieza {primerSet.hora}</Dato>}
                    {datos.s.length > 0 && <Dato icono={<Timer className="h-4 w-4" />}>{aprox ? '≈ ' : ''}{textoDuracion(musica)} de música</Dato>}
                    {datos.s.length > 1 && <Dato icono={<ListMusic className="h-4 w-4" />}>{datos.s.length} sets</Dato>}
                    {!fecha && !primerSet && <Dato icono={<CalendarDays className="h-4 w-4" />}>Sin fecha</Dato>}
                </div>

                {/* Dónde */}
                {mapas && (
                    <section className="mt-5 rounded-2xl bg-fill p-4" aria-label="Ubicación">
                        <div className="flex items-start gap-3">
                            <span className="h-10 w-10 shrink-0 rounded-full bg-pastel-rosa text-pastel-rosa-ink flex items-center justify-center"><MapPin className="h-5 w-5" /></span>
                            <span className="min-w-0">
                                {datos.lu && <span className="block text-[16px] font-semibold leading-snug">{datos.lu}</span>}
                                {datos.di && <span className="block text-[14.5px] text-muted-foreground">{datos.di}</span>}
                            </span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            {([['Google Maps', mapas.google], ['Apple Maps', mapas.apple], ['Waze', mapas.waze]] as const).map(([n, url]) => (
                                <a key={n} href={url} target="_blank" rel="noopener noreferrer"
                                    className="pulsable h-10 rounded-full bg-fill-strong text-[13.5px] font-semibold flex items-center justify-center">{n}</a>
                            ))}
                        </div>
                    </section>
                )}

                {/* El horario, con los sets dentro */}
                {momentos.length > 0 && (
                    <section className="mt-6" aria-label="Horario">
                        <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Horario</h2>
                        <ol className="mt-2">
                            {momentos.map((m, i) => {
                                const ultima = i === momentos.length - 1;
                                const esSet = m.set !== undefined;
                                const contenido = (
                                    <>
                                        <span className="w-14 shrink-0 py-2.5 text-right text-[15px] font-bold tabular-nums">{m.hora || '—'}</span>
                                        {/* La línea del tiempo, con un punto por momento (amarillo en los sets) */}
                                        <span className="relative w-3 shrink-0 self-stretch" aria-hidden>
                                            {momentos.length > 1 && (
                                                <span className={cn('absolute left-1/2 -translate-x-1/2 w-0.5 bg-hairline-strong', i === 0 ? 'top-[21px] bottom-0' : ultima ? 'top-0 h-[21px]' : 'top-0 bottom-0')} />
                                            )}
                                            <span className={cn('absolute left-0 top-[15px] h-3 w-3 rounded-full ring-4 ring-background', esSet ? 'bg-primary' : 'bg-muted-foreground')} />
                                        </span>
                                        <span className="flex-1 min-w-0 py-2.5">
                                            <span className="block text-[16px] font-semibold leading-snug">{m.que}</span>
                                            {m.hasta && <span className="block text-[13.5px] text-muted-foreground">Hasta las {m.hasta}{m.aprox ? ' aprox.' : ''}</span>}
                                        </span>
                                        {esSet && <ChevronRight className="mt-3 h-5 w-5 shrink-0 text-muted-foreground" />}
                                    </>
                                );
                                return (
                                    <li key={i}>
                                        {esSet
                                            ? <button onClick={() => onAbrirSet(m.set!)} className="w-full flex items-stretch gap-3 text-left active:opacity-60">{contenido}</button>
                                            : <div className="flex items-stretch gap-3">{contenido}</div>}
                                    </li>
                                );
                            })}
                        </ol>
                    </section>
                )}

                {/* Los repertorios */}
                {datos.s.length > 0 && (
                    <section className="mt-6" aria-label="Repertorio">
                        <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{datos.s.length > 1 ? 'Los sets' : 'El repertorio'}</h2>
                        <div className="mt-2 space-y-2">
                            {datos.s.map((s, i) => {
                                const d = duraciones[i];
                                const sobra = s.hu ? s.hu * 60 - d.segundos : null;
                                return (
                                    <button key={i} onClick={() => onAbrirSet(i)} className="pulsable w-full rounded-2xl bg-fill p-3 flex items-center gap-3 text-left">
                                        <span className={cn('h-14 w-14 shrink-0 rounded-[14px] flex items-center justify-center', pastelDe(s.n).fondo)}>
                                            <img src={iconoRepertorio(s.n)} alt="" aria-hidden className="h-11 w-11 object-contain" />
                                        </span>
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-[16.5px] font-semibold leading-snug">{nombreEnBolo(s.n, datos.n)}</span>
                                            <span className="block text-[14px] text-muted-foreground">
                                                {[s.hi, `${s.c.length} ${s.c.length === 1 ? 'tema' : 'temas'}`, `${d.aprox ? '≈ ' : ''}${textoDuracion(d.segundos)}`].filter(Boolean).join(' · ')}
                                            </span>
                                            {sobra !== null && Math.abs(sobra) >= 60 && (
                                                <span className={cn('mt-1 inline-flex h-6 px-2 rounded-full text-[12px] font-semibold items-center', sobra < 0 ? 'bg-pastel-melocoton text-pastel-melocoton-ink' : 'bg-pastel-menta text-pastel-menta-ink')}>
                                                    Hueco de {s.hu} min · {sobra < 0 ? `se pasa ${Math.round(-sobra / 60)} min` : `sobran ${Math.round(sobra / 60)} min`}
                                                </span>
                                            )}
                                        </span>
                                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* A quién llamar */}
                {(datos.co || datos.te) && (
                    <section className="mt-6 rounded-2xl bg-fill p-4" aria-label="Contacto">
                        <div className="flex items-center gap-3">
                            <span className="h-10 w-10 shrink-0 rounded-full bg-pastel-cielo text-pastel-cielo-ink flex items-center justify-center"><User className="h-5 w-5" /></span>
                            <span className="min-w-0">
                                <span className="block text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Contacto</span>
                                <span className="block text-[16px] font-semibold leading-snug">{datos.co || datos.te}</span>
                                {datos.co && datos.te && <span className="block text-[14.5px] text-muted-foreground">{datos.te}</span>}
                            </span>
                        </div>
                        {tel && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <a href={`tel:${tel.tel}`} className="pulsable h-10 rounded-full bg-fill-strong text-[14px] font-semibold flex items-center justify-center gap-1.5"><Phone className="h-4 w-4" /> Llamar</a>
                                <a href={tel.whatsapp} target="_blank" rel="noopener noreferrer" className="pulsable h-10 rounded-full bg-fill-strong text-[14px] font-semibold flex items-center justify-center gap-1.5"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                            </div>
                        )}
                    </section>
                )}

                {/* Las notas */}
                {datos.no && (
                    <section className="mt-6 rounded-2xl bg-fill p-4" aria-label="Notas">
                        <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground"><StickyNote className="h-4 w-4" /> Notas</p>
                        <p className="mt-1.5 whitespace-pre-wrap break-words text-[16px] leading-relaxed"><ConEnlaces texto={datos.no} /></p>
                    </section>
                )}

                <p className="mt-8 text-center text-[13px] text-muted-foreground">
                    Hecho con <a href="/cancionero" className="font-semibold text-foreground">el Cancionero de Musikeeo</a>. No hace falta cuenta.
                </p>
            </div>
        </main>
    );
}

function Dato({ icono, children }: { icono: ReactNode; children: ReactNode }) {
    return <span className="h-9 px-3 rounded-full bg-fill text-[14px] font-semibold flex items-center gap-1.5">{icono}{children}</span>;
}

// Las direcciones web de las notas, tocables (sin HTML: el texto va tal cual)
function ConEnlaces({ texto }: { texto: string }) {
    const trozos = texto.split(/(https?:\/\/[^\s]+)/g);
    return <>{trozos.map((t, i) => (/^https?:\/\//.test(t)
        ? <a key={i} href={t} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-primary-ink break-all">{t}</a>
        : <span key={i}>{t}</span>))}</>;
}

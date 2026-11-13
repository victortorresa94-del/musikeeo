import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, Check, ChevronDown, ChevronRight, GripVertical, Music2, Plus, Search, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import {
    agruparPorMadre, agruparPorPrioridad, boloDe, cancionDe, cancionDelTexto, nombreContexto, normalizar,
    PRIORIDADES, repertorioDe, tareaEnContexto, TIPOS_TAREA, type GrupoTareas,
} from '../../lib/tareas';
import { BotonHoja, Hoja } from './Hoja';
import { ICONO, iconoDeRepertorio } from './estilo';
import type { Bolo, Cancion, PrioridadTarea, Repertorio, Tarea } from '../../types/cancionero';

// Las tareas del Cancionero (13-nov, Víctor: «un apartado de tareas, tipo ensayar x canción,
// aprender letra tal… con prioridades», «relacionar tareas con canciones o bolos», «que la madre
// sea "repertorio Pallejà Lady"»). Se apunta escribiendo; «Ensayar Bamboléo» se une sola a la
// canción. Cada tarea cuelga de su madre (un repertorio o un bolo) y la lista sale agrupada por
// ella. Tachar no borra: pasa a «Hechas».

const COLOR: Record<PrioridadTarea, { aro: string; punto: string; pildora: string }> = {
    alta: { aro: 'border-pastel-melocoton-ink', punto: 'bg-pastel-melocoton-ink', pildora: 'bg-pastel-melocoton text-pastel-melocoton-ink' },
    media: { aro: 'border-pastel-mantequilla-ink', punto: 'bg-pastel-mantequilla-ink', pildora: 'bg-pastel-mantequilla text-pastel-mantequilla-ink' },
    baja: { aro: 'border-hairline-strong', punto: 'bg-muted-foreground', pildora: 'bg-fill-strong text-muted-foreground' },
};

const hoyISO = () => new Date().toLocaleDateString('sv-SE');
const fechaCorta = (f?: string) => {
    if (!f) return '';
    const [a, m, d] = f.split('-').map(Number);
    if (!a) return '';
    const hoy = hoyISO();
    if (f === hoy) return 'hoy';
    const manana = new Date(); manana.setDate(manana.getDate() + 1);
    if (manana.toLocaleDateString('sv-SE') === f) return 'mañana';
    return new Date(a, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
};

type Madre = { tipo: 'repertorio'; r: Repertorio } | { tipo: 'bolo'; b: Bolo } | null;
const madreDeTarea = (t: Tarea, repertorios: Repertorio[], bolos: Bolo[]): Madre => {
    const b = boloDe(t, bolos);
    if (b) return { tipo: 'bolo', b };
    const r = repertorioDe(t, repertorios);
    return r ? { tipo: 'repertorio', r } : null;
};
const camposDeMadre = (m: Madre): Partial<Tarea> => m?.tipo === 'bolo'
    ? { boloId: m.b.id, boloTitulo: m.b.titulo, repertorioId: undefined, repertorioNombre: undefined }
    : m?.tipo === 'repertorio'
        ? { repertorioId: m.r.id, repertorioNombre: m.r.nombre, boloId: undefined, boloTitulo: undefined }
        : { repertorioId: undefined, repertorioNombre: undefined, boloId: undefined, boloTitulo: undefined };
const nombreMadre = (m: Madre) => (m?.tipo === 'bolo' ? m.b.titulo || 'Bolo' : m?.tipo === 'repertorio' ? m.r.nombre : '');
// Firestore no admite undefined: lo vacío no se guarda
const sinVacios = (t: Tarea): Tarea => Object.fromEntries(Object.entries(t).filter(([, v]) => v !== undefined && v !== '')) as unknown as Tarea;

export function VistaTareas({ de }: { de?: string }) {
    const navigate = useNavigate();
    const { tareas, canciones, repertorios, bolos, crearTarea, guardarTarea, borrarTarea } = useCancionero();
    const datos = useMemo(() => ({ canciones, repertorios, bolos }), [canciones, repertorios, bolos]);
    const hoy = hoyISO();

    // Lo que viene de una canción, un repertorio o un bolo: solo sus tareas, y lo nuevo se une a él
    const contexto = de && /^[cbr]:.+/.test(de) ? de : undefined;
    const delContexto = useMemo(() => (contexto ? tareas.filter(t => tareaEnContexto(t, contexto, datos)) : tareas), [tareas, contexto, datos]);
    const pendientes = delContexto.filter(t => !t.hecha);
    const hechas = delContexto.filter(t => t.hecha).sort((a, b) => (b.hecha ?? '').localeCompare(a.hecha ?? ''));

    const [agrupar, setAgrupar] = useState<'madre' | 'prioridad'>(() => { try { return localStorage.getItem('musikeeo-tareas-agrupar') === 'prioridad' ? 'prioridad' : 'madre'; } catch { return 'madre'; } });
    const cambiarAgrupar = (a: 'madre' | 'prioridad') => { setAgrupar(a); try { localStorage.setItem('musikeeo-tareas-agrupar', a); } catch { /* */ } };
    const grupos = agrupar === 'prioridad' ? agruparPorPrioridad(pendientes) : agruparPorMadre(pendientes, datos, hoy);
    const [verHechas, setVerHechas] = useState(false);
    const [editando, setEditando] = useState<string | null>(null);
    const tareaEditando = tareas.find(t => t.id === editando) ?? null;

    // Arrastrar una tarea a otro grupo (13-nov, Víctor: «las tareas quiero poderlas arrastrar entre
    // repertorios, bolos o prioridades»): por el asa; el grupo de debajo se ilumina y, abajo, una
    // bandeja con los repertorios y bolos que aún no tienen tareas
    const [arrastre, setArrastre] = useState<{ tarea: Tarea; desde: string; x: number; y: number; sobre: string | null } | null>(null);
    const autoRef = useRef(0);
    const grupoEn = (x: number, y: number) => document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-grupo-tareas]')?.dataset.grupoTareas ?? null;
    const empezar = (e: React.PointerEvent, tarea: Tarea, desde: string) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        setArrastre({ tarea, desde, x: e.clientX, y: e.clientY, sobre: desde });
    };
    const moverArrastre = (e: React.PointerEvent) => {
        if (!arrastre) return;
        const sobre = grupoEn(e.clientX, e.clientY);
        setArrastre(a => (a ? { ...a, x: e.clientX, y: e.clientY, sobre } : a));
        // Cerca de arriba o de abajo, la página se desliza sola
        cancelAnimationFrame(autoRef.current);
        const d = e.clientY < 110 ? -10 : e.clientY > window.innerHeight - 190 ? 10 : 0;
        if (d) { const paso = () => { window.scrollBy(0, d); autoRef.current = requestAnimationFrame(paso); }; autoRef.current = requestAnimationFrame(paso); }
    };
    const soltar = () => {
        cancelAnimationFrame(autoRef.current);
        const a = arrastre;
        setArrastre(null);
        if (!a || !a.sobre || a.sobre === a.desde) return;
        const t = a.tarea;
        let cambio: Partial<Tarea> | null = null, nombre = '';
        if (a.sobre.startsWith('p:')) {
            const p = PRIORIDADES.find(x => x.id === a.sobre!.slice(2));
            if (p) { cambio = { prioridad: p.id }; nombre = `${p.corto} · ${p.nombre}`; }
        } else if (a.sobre.startsWith('r:')) {
            const r = repertorios.find(x => x.id === a.sobre!.slice(2));
            if (r) { cambio = camposDeMadre({ tipo: 'repertorio', r }); nombre = r.nombre; }
        } else if (a.sobre.startsWith('b:')) {
            const b = bolos.find(x => x.id === a.sobre!.slice(2));
            if (b) { cambio = camposDeMadre({ tipo: 'bolo', b }); nombre = b.titulo || 'Bolo'; }
        } else if (a.sobre === 'sueltas') { cambio = camposDeMadre(null); nombre = 'sin repertorio ni bolo'; }
        if (!cambio) return;
        guardarTarea(sinVacios({ ...t, ...cambio }));
        toast(`«${t.texto}» → ${nombre}`, { action: { label: 'Deshacer', onClick: () => guardarTarea(t) } });
    };
    // Dónde más se puede soltar: lo que no sale ya como grupo (los bolos y repertorios que vienen primero)
    const destinosExtra = (() => {
        if (!arrastre) return [];
        const ya = new Set(grupos.map(g => g.clave));
        if (agrupar === 'prioridad') return PRIORIDADES.filter(p => !ya.has(`p:${p.id}`)).map(p => ({ clave: `p:${p.id}`, nombre: `${p.corto} · ${p.nombre}`, icono: null as string | null }));
        const porFecha = <T extends { fecha: string }>(xs: T[]) => [...xs].sort((a, b) => ((a.fecha >= hoy ? 0 : 1) - (b.fecha >= hoy ? 0 : 1)) || (a.fecha >= hoy ? a.fecha.localeCompare(b.fecha) : b.fecha.localeCompare(a.fecha)));
        return [
            ...porFecha(bolos).map(b => ({ clave: `b:${b.id}`, nombre: b.titulo || 'Bolo', icono: ICONO.bolos as string | null })),
            ...porFecha(repertorios).map(r => ({ clave: `r:${r.id}`, nombre: r.nombre, icono: iconoDeRepertorio(r) as string | null })),
            { clave: 'sueltas', nombre: 'Sin repertorio ni bolo', icono: ICONO.tareas as string | null },
        ].filter(d => !ya.has(d.clave)).slice(0, 8);
    })();

    const tachar = (t: Tarea) => {
        if (t.hecha) {
            const { hecha: _h, ...resto } = t;
            void _h;
            guardarTarea(sinVacios(resto as Tarea));
            return;
        }
        guardarTarea({ ...t, hecha: new Date().toISOString() });
        toast(`Hecha: «${t.texto}»`, { action: { label: 'Deshacer', onClick: () => guardarTarea(t) } });
    };

    return (
        <div onPointerMove={moverArrastre} onPointerUp={soltar} onPointerCancel={soltar}>
            {contexto && (
                <div className="mb-3 flex items-center gap-2 flex-wrap">
                    <span className="h-8 pl-3 pr-1 rounded-full bg-fill-strong text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                        De «{nombreContexto(contexto, datos)}»
                        <button onClick={() => navigate('/cancionero?ver=tareas')} aria-label="Ver todas las tareas" className="h-6 w-6 rounded-full flex items-center justify-center active:bg-fill"><X className="h-3.5 w-3.5" /></button>
                    </span>
                </div>
            )}

            <Apuntar contexto={contexto} onCrear={datosNueva => crearTarea(datosNueva)} />

            {/* Agrupar por madre o por prioridad */}
            {pendientes.length > 0 && (
                <div className="mt-5 flex items-center justify-between gap-2">
                    <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Por hacer · {pendientes.length}</p>
                    <div className="flex p-0.5 rounded-full bg-fill" role="tablist" aria-label="Agrupar">
                        {([['madre', 'Por repertorio'], ['prioridad', 'Por prioridad']] as const).map(([id, t]) => (
                            <button key={id} role="tab" aria-selected={agrupar === id} onClick={() => cambiarAgrupar(id)}
                                className={cn('h-8 px-3 rounded-full text-[13px] font-semibold', agrupar === id ? 'bg-foreground text-background' : 'text-muted-foreground')}>{t}</button>
                        ))}
                    </div>
                </div>
            )}

            {pendientes.length === 0 && hechas.length === 0 && (
                <div className="mt-6 rounded-[22px] bg-pastel-menta p-5">
                    <img src={ICONO.tareas} alt="" aria-hidden className="h-16 w-16 object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.16)]" />
                    <p className="mt-3 font-heading text-[20px] font-bold leading-snug text-foreground">Lo que tienes que preparar</p>
                    <p className="mt-2 text-[15px] text-foreground/75">
                        «Ensayar Bamboléo», «Aprender la letra de Volare»… Escribe la tarea y elige su prioridad. Si nombras una canción, se une sola; y la puedes colgar de un repertorio o de un bolo.
                    </p>
                </div>
            )}
            {pendientes.length === 0 && hechas.length > 0 && (
                <p className="mt-6 rounded-2xl bg-fill px-4 py-5 text-center text-[15px] text-muted-foreground">Nada pendiente{contexto ? ' aquí' : ''}.</p>
            )}

            <div className="mt-2 space-y-5">
                {grupos.map(g => <Grupo key={g.clave} grupo={g} datos={datos} contexto={contexto} onTachar={tachar} onEditar={setEditando}
                    onArrastrar={(e, t) => empezar(e, t, g.clave)} sobre={arrastre?.sobre === g.clave && arrastre.desde !== g.clave} arrastrando={arrastre?.tarea.id} />)}
            </div>

            {/* Mientras se arrastra: la tarea va con el dedo y, abajo, los otros sitios donde soltarla.
                En un portal: dentro de la página (que entra con una animación) «fixed» no se queda fijo */}
            {arrastre && createPortal(
                <>
                    <div aria-hidden className="pointer-events-none fixed z-[90] max-w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-sheet border border-hairline shadow-e3 px-3 py-2 text-[15px] font-semibold text-foreground truncate"
                        style={{ left: arrastre.x, top: arrastre.y }}>{arrastre.tarea.texto}</div>
                    {destinosExtra.length > 0 && (
                        <div className="fixed left-3 right-3 bottom-[calc(env(safe-area-inset-bottom)+76px)] md:bottom-6 z-[85] mx-auto max-w-2xl rounded-2xl bg-sheet border border-hairline shadow-e3 p-2">
                            <p className="px-1 pb-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Suéltala en…</p>
                            <div className="flex flex-wrap gap-1.5">
                                {destinosExtra.map(d => (
                                    <span key={d.clave} data-grupo-tareas={d.clave}
                                        className={cn('h-9 max-w-full pl-1.5 pr-3 rounded-full text-[13px] font-semibold flex items-center gap-1.5 transition-colors',
                                            arrastre.sobre === d.clave ? 'bg-foreground text-background' : 'bg-fill text-foreground')}>
                                        {d.icono ? <img src={d.icono} alt="" className="h-6 w-6 object-contain" /> : <span className={cn('ml-1.5 h-2.5 w-2.5 rounded-full', COLOR[d.clave.slice(2) as PrioridadTarea].punto)} />}
                                        <span className="truncate">{d.nombre}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </>,
                document.body,
            )}

            {hechas.length > 0 && (
                <section className="mt-7" aria-label="Hechas">
                    <button onClick={() => setVerHechas(v => !v)} aria-expanded={verHechas}
                        className="h-9 flex items-center gap-1 text-[13px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                        Hechas · {hechas.length} <ChevronDown className={cn('h-4 w-4 transition-transform', verHechas && 'rotate-180')} />
                    </button>
                    {verHechas && (
                        <div className="rounded-2xl bg-fill overflow-hidden divide-y divide-hairline">
                            {hechas.map(t => <FilaTarea key={t.id} tarea={t} datos={datos} onTachar={() => tachar(t)} onEditar={() => setEditando(t.id)} mostrarMadre />)}
                        </div>
                    )}
                </section>
            )}

            <HojaTarea tarea={tareaEditando} onCerrar={() => setEditando(null)}
                onGuardar={t => guardarTarea(sinVacios(t))}
                onBorrar={t => { void borrarTarea(t.id); setEditando(null); toast(`Tarea borrada`, { action: { label: 'Deshacer', onClick: () => guardarTarea(t) } }); }} />
        </div>
    );
}

function Grupo({ grupo, datos, contexto, onTachar, onEditar, onArrastrar, sobre, arrastrando }: {
    grupo: GrupoTareas; datos: { canciones: Cancion[]; repertorios: Repertorio[]; bolos: Bolo[] }; contexto?: string;
    onTachar: (t: Tarea) => void; onEditar: (id: string) => void;
    onArrastrar: (e: React.PointerEvent, t: Tarea) => void; sobre?: boolean; arrastrando?: string;
}) {
    // Una madre que ya no existe (borrada) no recibe tareas: se ve, pero no se suelta ahí
    const recibe = !grupo.clave.startsWith('n:');
    const fondo = grupo.tipo === 'bolo' ? 'bg-pastel-rosa' : grupo.tipo === 'repertorio' ? 'bg-pastel-lavanda' : 'bg-fill-strong';
    const repDelGrupo = grupo.tipo === 'repertorio' ? datos.repertorios.find(r => `r:${r.id}` === grupo.clave) : undefined;
    const icono = grupo.tipo === 'bolo' ? ICONO.bolos : grupo.tipo === 'repertorio' ? iconoDeRepertorio(repDelGrupo ?? { nombre: grupo.nombre }) : ICONO.tareas;
    const porPrioridad = grupo.clave.startsWith('p:');
    const cabecera = (
        <span className="flex items-center gap-2.5 min-w-0">
            <span className={cn('h-10 w-10 shrink-0 rounded-xl flex items-center justify-center', porPrioridad ? 'bg-fill-strong' : fondo)}>
                {porPrioridad
                    ? <span className={cn('h-3 w-3 rounded-full', COLOR[grupo.clave.slice(2) as PrioridadTarea].punto)} />
                    : <img src={icono} alt="" aria-hidden className="h-8 w-8 object-contain" />}
            </span>
            <span className="min-w-0">
                <span className="block text-[16px] font-bold leading-tight text-foreground truncate">{grupo.nombre}</span>
                <span className="block text-[13px] text-muted-foreground">
                    {[grupo.fecha && fechaCorta(grupo.fecha), `${grupo.tareas.length} ${grupo.tareas.length === 1 ? 'tarea' : 'tareas'}`].filter(Boolean).join(' · ')}
                </span>
            </span>
        </span>
    );
    return (
        <section aria-label={grupo.nombre} data-grupo-tareas={recibe ? grupo.clave : undefined}
            className={cn('rounded-[20px] transition-shadow', sobre && 'ring-2 ring-foreground ring-offset-4 ring-offset-background')}>
            {grupo.enlace && !contexto
                ? <Link to={grupo.enlace} className="flex items-center justify-between gap-2 py-1 active:opacity-60">{cabecera}<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /></Link>
                : <div className="py-1">{cabecera}</div>}
            <div className="mt-1.5 rounded-2xl bg-fill overflow-hidden divide-y divide-hairline">
                {grupo.tareas.map(t => <FilaTarea key={t.id} tarea={t} datos={datos} onTachar={() => onTachar(t)} onEditar={() => onEditar(t.id)} mostrarMadre={porPrioridad}
                    onArrastrar={e => onArrastrar(e, t)} arrastrada={arrastrando === t.id} />)}
            </div>
        </section>
    );
}

function FilaTarea({ tarea, datos, onTachar, onEditar, mostrarMadre, onArrastrar, arrastrada }: {
    tarea: Tarea; datos: { canciones: Cancion[]; repertorios: Repertorio[]; bolos: Bolo[] };
    onTachar: () => void; onEditar: () => void; mostrarMadre?: boolean;
    onArrastrar?: (e: React.PointerEvent) => void; arrastrada?: boolean;
}) {
    const cancion = cancionDe(tarea, datos.canciones);
    const madre = mostrarMadre ? nombreMadre(madreDeTarea(tarea, datos.repertorios, datos.bolos)) || tarea.boloTitulo || tarea.repertorioNombre : '';
    const c = COLOR[tarea.prioridad];
    const hecha = !!tarea.hecha;
    const tarde = !hecha && tarea.para && tarea.para < hoyISO();
    return (
        <div className={cn('flex items-start gap-3 pr-2 py-2.5', onArrastrar ? 'pl-0' : 'pl-3', arrastrada && 'opacity-40')}>
            {onArrastrar && (
                <button onPointerDown={onArrastrar} aria-label={`Arrastra «${tarea.texto}» a otro grupo`}
                    className="-mr-2 h-8 w-8 shrink-0 flex items-center justify-center text-muted-foreground touch-none cursor-grab">
                    <GripVertical className="h-4 w-4" />
                </button>
            )}
            <button onClick={onTachar} aria-label={hecha ? `Volver a abrir: ${tarea.texto}` : `Hecha: ${tarea.texto}`} aria-pressed={hecha}
                className={cn('mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center active:scale-95 transition-transform',
                    hecha ? 'bg-foreground border-foreground text-background' : c.aro)}>
                {hecha && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </button>
            <button onClick={onEditar} className="flex-1 min-w-0 text-left active:opacity-60">
                <span className={cn('block text-[16px] leading-snug', hecha ? 'text-muted-foreground line-through' : 'text-foreground')}>{tarea.texto}</span>
                {(cancion || tarea.cancionTitulo || tarea.para || madre || tarea.prioridad === 'alta') && (
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        {tarea.prioridad === 'alta' && !hecha && <span className={cn('h-5 px-2 rounded-full text-[11.5px] font-bold flex items-center', c.pildora)}>P1</span>}
                        {(cancion || tarea.cancionTitulo) && (
                            <span className="h-5 px-2 rounded-full bg-pastel-cielo text-pastel-cielo-ink text-[11.5px] font-semibold flex items-center gap-1 max-w-[220px]">
                                <Music2 className="h-3 w-3 shrink-0" /><span className="truncate">{cancion?.titulo ?? tarea.cancionTitulo}</span>
                            </span>
                        )}
                        {madre && <span className="h-5 px-2 rounded-full bg-fill-strong text-muted-foreground text-[11.5px] font-semibold flex items-center max-w-[200px]"><span className="truncate">{madre}</span></span>}
                        {tarea.para && <span className={cn('h-5 px-2 rounded-full text-[11.5px] font-semibold flex items-center gap-1', tarde ? 'bg-pastel-melocoton text-pastel-melocoton-ink' : 'bg-fill-strong text-muted-foreground')}>
                            <Calendar className="h-3 w-3" />{fechaCorta(tarea.para)}</span>}
                    </span>
                )}
            </button>
            {cancion && (
                <Link to={`/cancionero/${cancion.id}`} aria-label={`Abrir ${cancion.titulo}`} className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-muted-foreground active:bg-fill-strong">
                    <ChevronRight className="h-4 w-4" />
                </Link>
            )}
        </div>
    );
}

// Apuntar: se escribe y ya. Debajo, la prioridad, la madre y la canción (que sale sola si se nombra)
function Apuntar({ contexto, onCrear }: { contexto?: string; onCrear: (t: Partial<Tarea> & { texto: string }) => Tarea }) {
    const { canciones, repertorios, bolos } = useCancionero();
    const [texto, setTexto] = useState('');
    const [prioridad, setPrioridad] = useState<PrioridadTarea>('media');
    // La madre y la canción de partida: las del contexto
    const madreInicial = (): Madre => {
        if (contexto?.startsWith('r:')) { const r = repertorios.find(x => x.id === contexto.slice(2)); return r ? { tipo: 'repertorio', r } : null; }
        if (contexto?.startsWith('b:')) { const b = bolos.find(x => x.id === contexto.slice(2)); return b ? { tipo: 'bolo', b } : null; }
        return null;
    };
    const [madre, setMadre] = useState<Madre | undefined>(undefined);
    const madreAhora = madre === undefined ? madreInicial() : madre;
    const cancionFija = contexto?.startsWith('c:') ? canciones.find(c => c.id === contexto.slice(2)) ?? null : null;
    const [cancionElegida, setCancionElegida] = useState<Cancion | null | undefined>(undefined);
    const detectada = useMemo(() => (texto.trim().length > 3 ? cancionDelTexto(texto, canciones) : null), [texto, canciones]);
    const cancion = cancionElegida === undefined ? cancionFija ?? detectada : cancionElegida;
    const [eligiendo, setEligiendo] = useState<'madre' | 'cancion' | null>(null);

    const crear = () => {
        const t = texto.trim();
        if (!t) return;
        onCrear({
            texto: t, prioridad,
            ...(cancion ? { cancionId: cancion.id, cancionTitulo: cancion.titulo } : {}),
            ...Object.fromEntries(Object.entries(camposDeMadre(madreAhora)).filter(([, v]) => v !== undefined)),
        });
        setTexto('');
        setCancionElegida(undefined);
    };
    const empezarCon = (tipo: string) => setTexto(t => (t.trim() ? t : `${tipo} `));

    return (
        <div className="rounded-[20px] bg-fill p-3">
            <div className="flex items-center gap-2">
                <input value={texto} onChange={e => { setTexto(e.target.value.slice(0, 300)); if (cancionElegida === null) setCancionElegida(undefined); }}
                    onKeyDown={e => { if (e.key === 'Enter') crear(); }} enterKeyHint="done"
                    placeholder="Ensayar Bamboléo, aprender la letra de…" aria-label="Nueva tarea"
                    className="flex-1 min-w-0 h-11 rounded-xl bg-background px-3 text-[16px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-foreground/10" />
                <button onClick={crear} disabled={!texto.trim()} aria-label="Añadir la tarea"
                    className="pulsable h-11 pl-3 pr-4 rounded-xl bg-primary text-primary-foreground text-[15px] font-semibold flex items-center gap-1 disabled:opacity-40">
                    <Plus className="h-4 w-4" /> Añadir
                </button>
            </div>
            {/* Dos líneas como mucho (13-nov, Víctor: «ocupa un poquito… podría estar en la misma línea
                todo… máximo 2 líneas»): la caja y UNA fila que se desliza con la prioridad, la madre, la
                canción y, con la caja vacía, los arranques de siempre */}
            <div className="mt-2 -mx-3 px-3 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                {/* Prioridad: un toque pasa P1 → P2 → P3 */}
                <button onClick={() => setPrioridad(p => (p === 'alta' ? 'media' : p === 'media' ? 'baja' : 'alta'))}
                    aria-label={`Prioridad ${PRIORIDADES.find(p => p.id === prioridad)!.nombre.toLowerCase()}: toca para cambiarla`}
                    className={cn('shrink-0 h-8 px-2.5 rounded-full text-[13px] font-bold flex items-center gap-1.5', COLOR[prioridad].pildora)}>
                    <span className={cn('h-2 w-2 rounded-full', COLOR[prioridad].punto)} />{PRIORIDADES.find(p => p.id === prioridad)!.corto}
                </button>
                {/* Madre */}
                <button onClick={() => setEligiendo('madre')} className="shrink-0 h-8 max-w-[190px] pl-1.5 pr-3 rounded-full bg-background text-[13px] font-semibold text-foreground flex items-center gap-1.5 active:opacity-60">
                    <img src={madreAhora?.tipo === 'bolo' ? ICONO.bolos : madreAhora?.tipo === 'repertorio' ? iconoDeRepertorio(madreAhora.r) : ICONO.repertorios} alt="" aria-hidden className="h-5 w-5 object-contain" />
                    <span className="truncate">{madreAhora ? nombreMadre(madreAhora) : 'Repertorio o bolo'}</span>
                </button>
                {/* Canción */}
                {cancion ? (
                    <span className="shrink-0 h-8 max-w-[180px] pl-2.5 pr-0.5 rounded-full bg-pastel-cielo text-pastel-cielo-ink text-[13px] font-semibold flex items-center gap-1">
                        <Music2 className="h-3.5 w-3.5 shrink-0" />
                        <button onClick={() => setEligiendo('cancion')} className="truncate">{cancion.titulo}</button>
                        {!cancionFija && <button onClick={() => setCancionElegida(null)} aria-label="Quitar la canción" className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center"><X className="h-3.5 w-3.5" /></button>}
                    </span>
                ) : (
                    <button onClick={() => setEligiendo('cancion')} className="shrink-0 h-8 px-3 rounded-full bg-background text-[13px] font-semibold text-muted-foreground flex items-center gap-1.5 active:opacity-60">
                        <Music2 className="h-3.5 w-3.5" /> Canción
                    </button>
                )}
                {!texto.trim() && TIPOS_TAREA.map(t => (
                    <button key={t} onClick={() => empezarCon(t)} className="shrink-0 h-8 px-3 rounded-full border border-dashed border-hairline-strong text-[13px] font-semibold text-muted-foreground active:opacity-60">{t}…</button>
                ))}
            </div>
            <ElegirMadre abierta={eligiendo === 'madre'} onCerrar={() => setEligiendo(null)} actual={madreAhora}
                onElegir={m => { setMadre(m); setEligiendo(null); }} />
            <ElegirCancion abierta={eligiendo === 'cancion'} onCerrar={() => setEligiendo(null)}
                onElegir={c => { setCancionElegida(c); setEligiendo(null); }} />
        </div>
    );
}

// Editar una tarea: texto, prioridad, madre, canción y para cuándo
function HojaTarea({ tarea, onCerrar, onGuardar, onBorrar }: { tarea: Tarea | null; onCerrar: () => void; onGuardar: (t: Tarea) => void; onBorrar: (t: Tarea) => void }) {
    const { canciones, repertorios, bolos } = useCancionero();
    const [eligiendo, setEligiendo] = useState<'madre' | 'cancion' | null>(null);
    if (!tarea) return <Hoja abierta={false} onCerrar={onCerrar} titulo="Tarea"><div /></Hoja>;
    const cambiar = (c: Partial<Tarea>) => onGuardar({ ...tarea, ...c });
    const madre = madreDeTarea(tarea, repertorios, bolos);
    const cancion = cancionDe(tarea, canciones);
    return (
        <Hoja abierta={!!tarea} onCerrar={onCerrar} titulo="Tarea"
            izquierda={<button onClick={() => onBorrar(tarea)} aria-label="Borrar la tarea" className="h-9 w-9 -ml-1 rounded-full flex items-center justify-center text-destructive active:bg-fill"><Trash2 className="h-[18px] w-[18px]" /></button>}
            derecha={<BotonHoja fuerte onClick={onCerrar}>Listo</BotonHoja>}>
            <div className="px-4 pb-5 space-y-4">
                <textarea value={tarea.texto} onChange={e => cambiar({ texto: e.target.value.slice(0, 300) })} rows={2} aria-label="Texto de la tarea"
                    className="w-full rounded-xl bg-fill px-3 py-2.5 text-[16px] text-foreground outline-none resize-none" />
                <div>
                    <p className="mb-1.5 text-[13px] font-semibold text-muted-foreground">Prioridad</p>
                    <div className="flex p-0.5 rounded-full bg-fill w-fit" role="radiogroup" aria-label="Prioridad">
                        {PRIORIDADES.map(p => (
                            <button key={p.id} role="radio" aria-checked={tarea.prioridad === p.id} onClick={() => cambiar({ prioridad: p.id })}
                                className={cn('h-9 px-3.5 rounded-full text-[14px] font-semibold flex items-center gap-1.5', tarea.prioridad === p.id ? 'bg-foreground text-background' : 'text-muted-foreground')}>
                                <span className={cn('h-2 w-2 rounded-full', COLOR[p.id].punto)} />{p.corto} · {p.nombre}
                            </button>
                        ))}
                    </div>
                </div>
                <FilaCampo etiqueta="De qué repertorio o bolo" valor={madre ? nombreMadre(madre) : (tarea.boloTitulo || tarea.repertorioNombre || 'Ninguno')} onClick={() => setEligiendo('madre')} />
                <FilaCampo etiqueta="Canción" valor={cancion?.titulo ?? tarea.cancionTitulo ?? 'Ninguna'} onClick={() => setEligiendo('cancion')}
                    extra={cancion && <Link to={`/cancionero/${cancion.id}`} onClick={onCerrar} className="h-9 px-3 rounded-full bg-fill-strong text-[13px] font-semibold text-foreground flex items-center">Abrir</Link>} />
                <label className="block">
                    <span className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Para cuándo</span>
                    <span className="flex items-center gap-2">
                        <input type="date" value={tarea.para ?? ''} onChange={e => cambiar({ para: e.target.value || undefined })}
                            className="h-11 rounded-xl bg-fill px-3 text-[16px] text-foreground outline-none" />
                        {tarea.para && <button onClick={() => cambiar({ para: undefined })} className="h-9 px-3 rounded-full text-[14px] text-muted-foreground active:bg-fill">Quitar</button>}
                    </span>
                </label>
            </div>
            <ElegirMadre abierta={eligiendo === 'madre'} onCerrar={() => setEligiendo(null)} actual={madre}
                onElegir={m => { cambiar(camposDeMadre(m)); setEligiendo(null); }} />
            <ElegirCancion abierta={eligiendo === 'cancion'} onCerrar={() => setEligiendo(null)}
                onElegir={c => { cambiar(c ? { cancionId: c.id, cancionTitulo: c.titulo } : { cancionId: undefined, cancionTitulo: undefined }); setEligiendo(null); }} quitar />
        </Hoja>
    );
}

function FilaCampo({ etiqueta, valor, onClick, extra }: { etiqueta: string; valor: string; onClick: () => void; extra?: React.ReactNode }) {
    return (
        <div>
            <p className="mb-1.5 text-[13px] font-semibold text-muted-foreground">{etiqueta}</p>
            <div className="flex items-center gap-2">
                <button onClick={onClick} className="flex-1 min-w-0 h-11 px-3 rounded-xl bg-fill text-left text-[16px] text-foreground flex items-center justify-between gap-2 active:opacity-70">
                    <span className="truncate">{valor}</span><ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
                {extra}
            </div>
        </div>
    );
}

// Elegir la madre: los repertorios y bolos que vienen primero
function ElegirMadre({ abierta, onCerrar, actual, onElegir }: { abierta: boolean; onCerrar: () => void; actual: Madre; onElegir: (m: Madre) => void }) {
    const { repertorios, bolos } = useCancionero();
    const hoy = hoyISO();
    const porFecha = <T extends { fecha: string }>(xs: T[]) => [...xs].sort((a, b) => {
        const fa = a.fecha >= hoy ? 0 : 1, fb = b.fecha >= hoy ? 0 : 1;
        return fa - fb || (fa === 0 ? a.fecha.localeCompare(b.fecha) : b.fecha.localeCompare(a.fecha));
    });
    const fila = (activa: boolean, icono: string, nombre: string, fecha: string | undefined, onClick: () => void, key: string) => (
        <button key={key} onClick={onClick} className={cn('w-full flex items-center gap-3 px-4 min-h-[56px] text-left active:bg-fill', activa && 'bg-fill')}>
            <img src={icono} alt="" aria-hidden className="h-8 w-8 object-contain" />
            <span className="flex-1 min-w-0">
                <span className="block truncate text-[16px] font-semibold text-foreground">{nombre}</span>
                {fecha && <span className="block text-[13px] text-muted-foreground">{fechaCorta(fecha)}</span>}
            </span>
            {activa && <Check className="h-5 w-5 text-foreground" />}
        </button>
    );
    return (
        <Hoja abierta={abierta} onCerrar={onCerrar} titulo="De qué repertorio o bolo" alta encima>
            {fila(!actual, ICONO.tareas, 'Ninguno', undefined, () => onElegir(null), 'nada')}
            {bolos.length > 0 && <p className="px-4 pt-4 pb-1 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Bolos</p>}
            {porFecha(bolos).map(b => fila(actual?.tipo === 'bolo' && actual.b.id === b.id, ICONO.bolos, b.titulo || 'Bolo', b.fecha, () => onElegir({ tipo: 'bolo', b }), b.id))}
            {repertorios.length > 0 && <p className="px-4 pt-4 pb-1 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Repertorios</p>}
            {porFecha(repertorios).map(r => fila(actual?.tipo === 'repertorio' && actual.r.id === r.id, iconoDeRepertorio(r), r.nombre, r.fecha, () => onElegir({ tipo: 'repertorio', r }), r.id))}
        </Hoja>
    );
}

function ElegirCancion({ abierta, onCerrar, onElegir, quitar }: { abierta: boolean; onCerrar: () => void; onElegir: (c: Cancion | null) => void; quitar?: boolean }) {
    const { canciones } = useCancionero();
    const [q, setQ] = useState('');
    const lista = useMemo(() => {
        const n = normalizar(q);
        const todas = [...canciones].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
        return (n ? todas.filter(c => normalizar(`${c.titulo} ${c.artista}`).includes(n)) : todas).slice(0, 80);
    }, [q, canciones]);
    return (
        <Hoja abierta={abierta} onCerrar={onCerrar} titulo="Canción" alta encima>
            <div className="px-4 pb-2 sticky top-0 bg-sheet z-10">
                <span className="flex items-center gap-2 h-11 px-3 rounded-xl bg-fill">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar" aria-label="Buscar canción"
                        className="flex-1 min-w-0 bg-transparent text-[16px] text-foreground outline-none" />
                </span>
            </div>
            {quitar && <button onClick={() => onElegir(null)} className="w-full px-4 min-h-[48px] text-left text-[15px] text-muted-foreground active:bg-fill">Sin canción</button>}
            {lista.map(c => (
                <button key={c.id} onClick={() => onElegir(c)} className="w-full flex items-center gap-3 px-4 min-h-[52px] text-left active:bg-fill">
                    <span className="flex-1 min-w-0">
                        <span className="block truncate text-[16px] font-semibold text-foreground">{c.titulo}{c.version ? ` · ${c.version}` : ''}</span>
                        {c.artista && <span className="block truncate text-[13px] text-muted-foreground">{c.artista}</span>}
                    </span>
                </button>
            ))}
        </Hoja>
    );
}

// El acceso desde una canción, un repertorio o un bolo: «Tareas · 3» (o «Tarea» si no hay)
export function BotonTareas({ de, className }: { de: string; className?: string }) {
    const { tareas, canciones, repertorios, bolos } = useCancionero();
    const n = useMemo(() => tareas.filter(t => !t.hecha && tareaEnContexto(t, de, { canciones, repertorios, bolos })).length, [tareas, de, canciones, repertorios, bolos]);
    return (
        <Link to={`/cancionero?ver=tareas&de=${encodeURIComponent(de)}`}
            className={cn('pulsable h-9 pl-1.5 pr-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5 shrink-0', className)}>
            <img src={ICONO.tareas} alt="" aria-hidden className="h-7 w-7 object-contain" />
            {n ? <>Tareas <span className="text-muted-foreground">{n}</span></> : 'Tarea'}
        </Link>
    );
}


// En el repertorio y en el bolo: una fila con lo que queda por hacer de él (y de sus canciones)
export function FilaTareas({ de, className }: { de: string; className?: string }) {
    const { tareas, canciones, repertorios, bolos } = useCancionero();
    const datos = { canciones, repertorios, bolos };
    const pendientes = tareas.filter(t => !t.hecha && tareaEnContexto(t, de, datos)).sort((a, b) => ({ alta: 0, media: 1, baja: 2 }[a.prioridad] - { alta: 0, media: 1, baja: 2 }[b.prioridad]));
    return (
        <Link to={`/cancionero?ver=tareas&de=${encodeURIComponent(de)}`} className={cn('w-full rounded-2xl bg-fill px-3 py-2.5 flex items-center gap-3 active:bg-fill-strong', className)}>
            <span className="h-10 w-10 shrink-0 rounded-xl bg-pastel-menta flex items-center justify-center">
                <img src={ICONO.tareas} alt="" aria-hidden className="h-8 w-8 object-contain" />
            </span>
            <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-semibold text-foreground">Tareas{pendientes.length ? ` · ${pendientes.length} por hacer` : ''}</span>
                <span className="block truncate text-[13px] text-muted-foreground">
                    {pendientes.length ? pendientes.slice(0, 3).map(t => t.texto).join(' · ') : 'Ensayar, aprender letras… lo que hay que preparar'}
                </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
    );
}

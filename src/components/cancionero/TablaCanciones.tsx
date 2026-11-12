import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Columns3, ExternalLink, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ENERGIAS, ESTADOS, opcionesDe, textoDuracion, DURACION_MEDIA, type CampoFiltro } from '../../lib/biblioteca';
import { leerDuracion, minutos } from '../../lib/cantar';
import type { Cancion, EstadoCancion, FichaCancion } from '../../types/cancionero';
import { BotonHoja, Hoja } from './Hoja';
import { estiloBloque, pastelCanta, pastelDe } from './estilo';

// La vista Tabla, como en Notion o ClickUp: todos los datos de cada canción en columnas,
// cada celda se cambia en su sitio, se ordena por cualquier columna, se agrupa por cualquiera
// (con cuántas y lo que duran) y se eligen las columnas que se ven. El título queda fijo al
// deslizar de lado en el móvil.

type Col = 'version' | 'tono' | 'tonoAlt' | 'capo' | 'canta' | 'proyectos' | 'estilo' | 'energia' | 'estado' | 'etiquetas' | 'duracion' | 'bpm' | 'enlace';
const COLUMNAS: { id: Col; nombre: string; ancho: string }[] = [
    { id: 'version', nombre: 'Versión', ancho: 'w-[110px]' },
    { id: 'tono', nombre: 'Tono', ancho: 'w-[76px]' },
    { id: 'tonoAlt', nombre: 'También en', ancho: 'w-[90px]' },
    { id: 'capo', nombre: 'Capo / formas', ancho: 'w-[150px]' },
    { id: 'canta', nombre: 'Canta', ancho: 'w-[110px]' },
    { id: 'proyectos', nombre: 'Grupo', ancho: 'w-[150px]' },
    { id: 'estilo', nombre: 'Estilo', ancho: 'w-[120px]' },
    { id: 'energia', nombre: 'Energía', ancho: 'w-[110px]' },
    { id: 'estado', nombre: 'Estado', ancho: 'w-[130px]' },
    { id: 'etiquetas', nombre: 'Etiquetas', ancho: 'w-[180px]' },
    { id: 'duracion', nombre: 'Duración', ancho: 'w-[86px]' },
    { id: 'bpm', nombre: 'BPM', ancho: 'w-[70px]' },
    { id: 'enlace', nombre: 'Enlace', ancho: 'w-[90px]' },
];
const VISIBLES_INICIO: Col[] = ['tono', 'capo', 'canta', 'estilo', 'estado', 'etiquetas', 'duracion', 'bpm'];
type Orden = { col: Col | 'titulo' | 'set'; sube: boolean };
type Agrupar = 'nada' | 'canta' | 'proyectos' | 'estilo' | 'energia' | 'estado' | 'etiquetas' | 'tono';
const NOMBRE_AGRUPAR: Record<Agrupar, string> = { nada: 'Sin agrupar', canta: 'Canta', proyectos: 'Grupo', estilo: 'Estilo', energia: 'Energía', estado: 'Estado', etiquetas: 'Etiquetas', tono: 'Tono' };
const CAMPO: Record<Exclude<Agrupar, 'nada'>, CampoFiltro> = { canta: 'canta', proyectos: 'proyectos', estilo: 'estilos', energia: 'energias', estado: 'estados', etiquetas: 'etiquetas', tono: 'tonos' };

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function leerPrefs(clave: string, enSet: boolean): { visibles: Col[]; orden: Orden; agrupar: Agrupar } {
    const base = { visibles: VISIBLES_INICIO, orden: { col: enSet ? 'set' : 'titulo', sube: true } as Orden, agrupar: 'nada' as Agrupar };
    try { return { ...base, ...JSON.parse(localStorage.getItem(clave) || '{}') }; } catch { return base; }
}

function valorOrden(c: Cancion, col: Orden['col'], tono: string | null, i: number): string | number {
    const f = c.ficha ?? {};
    switch (col) {
        case 'set': return i;
        case 'titulo': return norm(c.titulo);
        case 'version': return norm(c.version ?? '');
        case 'tono': return tono ?? '';
        case 'tonoAlt': return f.tonoAlt ?? '';
        case 'capo': return norm(f.capo ?? '');
        case 'canta': return norm(f.canta ?? '');
        case 'proyectos': return norm((f.proyectos ?? []).join(' '));
        case 'estilo': return norm(f.estilo ?? '');
        case 'energia': return f.energia ?? 0;
        case 'estado': return f.estado ? Object.keys(ESTADOS).indexOf(f.estado) : 9;
        case 'etiquetas': return norm((f.etiquetas ?? []).join(' '));
        case 'duracion': return c.duracion ?? 0;
        case 'bpm': return c.bpm ?? 0;
        case 'enlace': return f.enlace ? 0 : 1;
    }
}

export function TablaCanciones({ canciones, tonoDe, guardar, onAbrir, clave, enSet, encabezado, todas }: {
    canciones: Cancion[];
    tonoDe: (c: Cancion) => string | null;
    guardar: (c: Cancion) => void;
    onAbrir: (c: Cancion) => void;
    clave: string;               // dónde se recuerdan columnas, orden y grupos
    enSet?: boolean;             // en un repertorio: el orden del set es el de inicio
    encabezado?: ReactNode;
    todas: Cancion[];            // todo el cancionero (para ofrecer los valores que ya usas)
}) {
    const [prefs, setPrefs] = useState(() => leerPrefs(clave, !!enSet));
    const [eligiendoColumnas, setEligiendoColumnas] = useState(false);
    const [editando, setEditando] = useState<{ cancion: Cancion; col: Col } | null>(null);
    const cambiar = (c: Partial<typeof prefs>) => setPrefs(p => {
        const n = { ...p, ...c };
        try { localStorage.setItem(clave, JSON.stringify(n)); } catch { /* */ }
        return n;
    });

    const ordenadas = useMemo(() => {
        const conIndice = canciones.map((c, i) => ({ c, i, v: valorOrden(c, prefs.orden.col, tonoDe(c), i) }));
        conIndice.sort((a, b) => (a.v < b.v ? -1 : a.v > b.v ? 1 : a.i - b.i) * (prefs.orden.sube ? 1 : -1));
        return conIndice.map(x => x.c);
    }, [canciones, prefs.orden, tonoDe]);

    const grupos = useMemo(() => {
        if (prefs.agrupar === 'nada') return [{ titulo: '', canciones: ordenadas }];
        const campo = CAMPO[prefs.agrupar];
        const ops = opcionesDe(ordenadas, campo, tonoDe);
        const lista = ops.map(o => ({
            titulo: campo === 'energias' ? ENERGIAS[+o.valor as 1] : campo === 'estados' ? ESTADOS[o.valor as EstadoCancion] : o.valor,
            canciones: ordenadas.filter(c => valores(c, prefs.agrupar as Exclude<Agrupar, 'nada'>, tonoDe(c)).some(v => norm(v) === norm(o.valor))),
        }));
        const sin = ordenadas.filter(c => !valores(c, prefs.agrupar as Exclude<Agrupar, 'nada'>, tonoDe(c)).length);
        if (sin.length) lista.push({ titulo: `Sin ${NOMBRE_AGRUPAR[prefs.agrupar].toLowerCase()}`, canciones: sin });
        return lista;
    }, [ordenadas, prefs.agrupar, tonoDe]);

    const visibles = COLUMNAS.filter(c => prefs.visibles.includes(c.id));
    const ordenarPor = (col: Orden['col']) => cambiar({ orden: { col, sube: prefs.orden.col === col ? !prefs.orden.sube : true } });
    const flecha = (col: Orden['col']) => (prefs.orden.col === col ? (prefs.orden.sube ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : null);

    // Celdas que se escriben (texto o número): se guardan al salir
    const escribir = (c: Cancion, col: Col, texto: string) => {
        const t = texto.trim();
        const f: FichaCancion = { ...(c.ficha ?? {}) };
        let nueva: Cancion = c;
        if (col === 'version') nueva = { ...c, version: t.slice(0, 40) || undefined };
        else if (col === 'tono') { f.tono = t.replace(/\s+/g, '').slice(0, 12) || undefined; nueva = { ...c, ficha: f }; }
        else if (col === 'tonoAlt') { f.tonoAlt = t.replace(/\s+/g, '').slice(0, 12) || undefined; nueva = { ...c, ficha: f }; }
        else if (col === 'capo') { f.capo = t.slice(0, 60) || undefined; nueva = { ...c, ficha: f }; }
        else if (col === 'enlace') { f.enlace = /^https?:\/\//i.test(t) ? t.slice(0, 500) : undefined; nueva = { ...c, ficha: f }; }
        else if (col === 'duracion') nueva = { ...c, duracion: leerDuracion(t) ?? undefined };
        else if (col === 'bpm') { const n = parseInt(t, 10); nueva = { ...c, bpm: n >= 30 && n <= 260 ? n : undefined }; }
        if (JSON.stringify(nueva) !== JSON.stringify(c)) guardar(limpiar(nueva));
    };

    return (
        <div>
            <div className="-mx-4 px-4 md:mx-0 md:px-0 mb-2 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                {encabezado}
                <label className="h-8 pl-3 pr-1 shrink-0 rounded-full bg-fill flex items-center gap-1 text-[13px] font-semibold text-muted-foreground">
                    Agrupar
                    <select value={prefs.agrupar} onChange={e => cambiar({ agrupar: e.target.value as Agrupar })} aria-label="Agrupar por"
                        className="h-7 bg-transparent text-foreground font-semibold focus:outline-none">
                        {(Object.keys(NOMBRE_AGRUPAR) as Agrupar[]).map(a => <option key={a} value={a}>{NOMBRE_AGRUPAR[a]}</option>)}
                    </select>
                </label>
                {enSet && prefs.orden.col !== 'set' && (
                    <button onClick={() => cambiar({ orden: { col: 'set', sube: true } })} className="h-8 px-3 shrink-0 rounded-full bg-fill text-[13px] font-semibold text-foreground">Orden del set</button>
                )}
                <button onClick={() => setEligiendoColumnas(true)} className="h-8 px-3 shrink-0 rounded-full bg-fill text-[13px] font-semibold text-foreground flex items-center gap-1.5">
                    <Columns3 className="h-4 w-4" /> Columnas
                </button>
            </div>

            <div className="-mx-4 md:mx-0 overflow-x-auto overscroll-x-contain rounded-none md:rounded-2xl border-y md:border border-hairline">
                <table className="min-w-full border-separate border-spacing-0 text-[14px]">
                    <thead>
                        <tr>
                            <th scope="col" className="sticky left-0 z-10 bg-sheet min-w-[150px] max-w-[190px] px-3 h-10 text-left font-semibold text-muted-foreground border-b border-r border-hairline">
                                <button onClick={() => ordenarPor('titulo')} className="flex items-center gap-1">Título {flecha('titulo')}</button>
                            </th>
                            {visibles.map(c => (
                                <th key={c.id} scope="col" className={cn('px-2.5 h-10 text-left font-semibold text-muted-foreground border-b border-hairline whitespace-nowrap bg-sheet', c.ancho)}>
                                    <button onClick={() => ordenarPor(c.id)} className="flex items-center gap-1">{c.nombre} {flecha(c.id)}</button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    {grupos.map(g => (
                        <tbody key={g.titulo || '_'}>
                            {g.titulo && (
                                <tr>
                                    <th colSpan={visibles.length + 1} scope="colgroup" className="text-left bg-fill border-b border-hairline">
                                        <span className="sticky left-0 inline-flex items-center gap-2 px-3 h-9 text-[14px] font-bold text-foreground">
                                            {g.titulo}
                                            <span className="text-[12.5px] font-semibold text-muted-foreground">{g.canciones.length} · {textoDuracion(g.canciones.reduce((s, c) => s + (c.duracion ?? DURACION_MEDIA), 0))}</span>
                                        </span>
                                    </th>
                                </tr>
                            )}
                            {g.canciones.map(c => (
                                <tr key={c.id} className="group">
                                    <th scope="row" className="sticky left-0 z-10 bg-background min-w-[150px] max-w-[190px] px-3 py-1.5 text-left border-b border-r border-hairline">
                                        <button onClick={() => onAbrir(c)} className="block w-full text-left">
                                            <span className="block truncate font-semibold text-foreground">{c.titulo}</span>
                                            {c.artista && <span className="block truncate text-[12px] font-medium text-muted-foreground">{c.artista}</span>}
                                        </button>
                                    </th>
                                    {visibles.map(col => (
                                        <td key={col.id} className={cn('px-1.5 py-1 border-b border-hairline align-middle', col.ancho)}>
                                            <Celda cancion={c} col={col.id} tono={tonoDe(c)} onEscribir={t => escribir(c, col.id, t)} onElegir={() => setEditando({ cancion: c, col: col.id })} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    ))}
                </table>
            </div>
            {!canciones.length && <p className="py-8 text-center text-[15px] text-muted-foreground">No hay canciones.</p>}

            <Hoja abierta={eligiendoColumnas} onCerrar={() => setEligiendoColumnas(false)} titulo="Columnas" derecha={<BotonHoja fuerte onClick={() => setEligiendoColumnas(false)}>Listo</BotonHoja>}>
                <div className="px-4 pb-5 flex flex-wrap gap-2">
                    {COLUMNAS.map(c => {
                        const si = prefs.visibles.includes(c.id);
                        return (
                            <button key={c.id} aria-pressed={si} onClick={() => cambiar({ visibles: si ? prefs.visibles.filter(x => x !== c.id) : COLUMNAS.map(x => x.id).filter(x => x === c.id || prefs.visibles.includes(x)) })}
                                className={cn('h-9 px-3.5 rounded-full text-[14px] font-semibold', si ? 'bg-foreground text-background' : 'bg-fill text-foreground')}>{c.nombre}</button>
                        );
                    })}
                </div>
            </Hoja>
            {editando && (
                <EditorOpciones key={`${editando.cancion.id}-${editando.col}`} cancion={canciones.find(c => c.id === editando.cancion.id) ?? editando.cancion} col={editando.col} todas={todas}
                    onCerrar={() => setEditando(null)} guardar={guardar} tonoDe={tonoDe} />
            )}
        </div>
    );
}

function valores(c: Cancion, a: Exclude<Agrupar, 'nada'>, tono: string | null): string[] {
    const f = c.ficha ?? {};
    switch (a) {
        case 'canta': return f.canta ? [f.canta] : [];
        case 'proyectos': return f.proyectos ?? [];
        case 'estilo': return f.estilo ? [f.estilo] : [];
        case 'energia': return f.energia ? [String(f.energia)] : [];
        case 'estado': return f.estado ? [f.estado] : [];
        case 'etiquetas': return f.etiquetas ?? [];
        case 'tono': return tono ? [tono] : [];
    }
}

function limpiar(c: Cancion): Cancion {
    const f = Object.fromEntries(Object.entries(c.ficha ?? {}).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length))) as FichaCancion;
    return { ...c, ficha: Object.keys(f).length ? f : undefined };
}

const chip = (texto: string, clase: string) => <span key={texto} className={cn('h-6 px-2 rounded-full text-[12px] font-semibold inline-flex items-center whitespace-nowrap', clase)}>{texto}</span>;
const pastel = (p: { fondo: string; tinta: string }) => cn(p.fondo, p.tinta);

function Celda({ cancion: c, col, tono, onEscribir, onElegir }: { cancion: Cancion; col: Col; tono: string | null; onEscribir: (t: string) => void; onElegir: () => void }) {
    const f = c.ficha ?? {};
    const texto = (valor: string, placeholder: string, extra?: string) => (
        <input defaultValue={valor} key={valor} onBlur={e => onEscribir(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            placeholder={placeholder} aria-label={`${col} de ${c.titulo}`}
            className={cn('w-full h-8 rounded-lg bg-transparent px-1.5 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:bg-fill focus:outline-none', extra)} />
    );
    const boton = (dentro: ReactNode) => (
        <button onClick={onElegir} className="w-full min-h-8 rounded-lg px-1 py-0.5 flex flex-wrap items-center gap-1 text-left hover:bg-fill active:bg-fill" aria-label={`Cambiar ${col} de ${c.titulo}`}>
            {dentro || <span className="text-muted-foreground/50 text-[13px] px-0.5">—</span>}
        </button>
    );
    switch (col) {
        case 'version': return texto(c.version ?? '', 'Original', c.favorita ? 'font-semibold' : undefined);
        case 'tono': return texto(f.tono ?? '', tono ?? '—', 'font-bold');
        case 'tonoAlt': return texto(f.tonoAlt ?? '', '—');
        case 'capo': return texto(f.capo ?? '', '—');
        case 'duracion': return texto(c.duracion ? minutos(c.duracion) : '', '3:30', 'tabular-nums');
        case 'bpm': return texto(c.bpm ? String(c.bpm) : '', '—', 'tabular-nums');
        case 'enlace': return f.enlace
            ? <span className="flex items-center gap-1"><a href={f.enlace} target="_blank" rel="noopener noreferrer" className="h-7 px-2 rounded-full bg-fill text-[12px] font-semibold flex items-center gap-1">Abrir <ExternalLink className="h-3 w-3" /></a>{texto(f.enlace, '', 'w-6 opacity-0 focus:opacity-100 focus:w-40')}</span>
            : texto('', 'https://…');
        case 'canta': return boton(f.canta && chip(f.canta, pastel(pastelCanta(f.canta))));
        case 'proyectos': return boton(f.proyectos?.length ? f.proyectos.map(p => chip(p, 'bg-fill-strong text-foreground')) : null);
        case 'estilo': return boton(f.estilo && chip(f.estilo, pastel(estiloBloque(f.estilo).pastel)));
        case 'energia': return boton(f.energia && chip(ENERGIAS[f.energia], 'bg-fill-strong text-foreground'));
        case 'estado': return boton(f.estado && chip(ESTADOS[f.estado], f.estado === 'lista' ? 'bg-pastel-menta text-pastel-menta-ink' : 'bg-pastel-mantequilla text-pastel-mantequilla-ink'));
        case 'etiquetas': return boton(f.etiquetas?.length ? f.etiquetas.map(e => chip(e, pastel(pastelDe(`etiqueta:${e.toLowerCase()}`)))) : null);
    }
}

// Elegir el valor de una celda de opciones: los que ya usas, o uno nuevo
function EditorOpciones({ cancion, col, todas, onCerrar, guardar, tonoDe }: {
    cancion: Cancion; col: Col; todas: Cancion[]; onCerrar: () => void; guardar: (c: Cancion) => void; tonoDe: (c: Cancion) => string | null;
}) {
    const [nuevo, setNuevo] = useState('');
    const f = cancion.ficha ?? {};
    const multiple = col === 'proyectos' || col === 'etiquetas';
    const campo: CampoFiltro = col === 'canta' ? 'canta' : col === 'proyectos' ? 'proyectos' : col === 'estilo' ? 'estilos' : col === 'etiquetas' ? 'etiquetas' : col === 'energia' ? 'energias' : 'estados';
    const fijos = col === 'energia' ? Object.keys(ENERGIAS) : col === 'estado' ? Object.keys(ESTADOS) : null;
    const opciones = fijos ?? opcionesDe(todas, campo, tonoDe).map(o => o.valor);
    const actuales: string[] = col === 'canta' ? (f.canta ? [f.canta] : []) : col === 'proyectos' ? f.proyectos ?? [] : col === 'estilo' ? (f.estilo ? [f.estilo] : [])
        : col === 'etiquetas' ? f.etiquetas ?? [] : col === 'energia' ? (f.energia ? [String(f.energia)] : []) : (f.estado ? [f.estado] : []);
    const nombre = (v: string) => (col === 'energia' ? ENERGIAS[+v as 1] : col === 'estado' ? ESTADOS[v as EstadoCancion] : v);

    const poner = (lista: string[]) => {
        const g: FichaCancion = { ...f };
        const uno = lista[0];
        if (col === 'canta') g.canta = uno;
        else if (col === 'estilo') g.estilo = uno;
        else if (col === 'energia') g.energia = uno ? (Number(uno) as FichaCancion['energia']) : undefined;
        else if (col === 'estado') g.estado = uno as EstadoCancion | undefined;
        else if (col === 'proyectos') g.proyectos = lista;
        else if (col === 'etiquetas') g.etiquetas = lista;
        guardar(limpiar({ ...cancion, ficha: g }));
    };
    const alternar = (v: string) => {
        const esta = actuales.some(x => norm(x) === norm(v));
        if (multiple) poner(esta ? actuales.filter(x => norm(x) !== norm(v)) : [...actuales, v].slice(0, 30));
        else { poner(esta ? [] : [v]); onCerrar(); }
    };
    const meterNuevo = () => {
        const v = nuevo.trim().slice(0, 40);
        if (v) alternar(v);
        setNuevo('');
    };
    const titulo = COLUMNAS.find(c => c.id === col)?.nombre ?? '';
    return (
        <Hoja abierta onCerrar={onCerrar} titulo={`${titulo} · ${cancion.titulo}`} derecha={<BotonHoja fuerte onClick={onCerrar}>Listo</BotonHoja>}>
            <div className="px-4 pb-5">
                <div className="flex flex-wrap gap-2">
                    {[...new Set([...opciones, ...actuales])].map(v => {
                        const si = actuales.some(x => norm(x) === norm(v));
                        return (
                            <button key={v} onClick={() => alternar(v)} aria-pressed={si}
                                className={cn('h-9 px-3.5 rounded-full text-[14px] font-semibold flex items-center gap-1', si ? 'bg-foreground text-background' : 'bg-fill text-foreground')}>
                                {nombre(v)}
                            </button>
                        );
                    })}
                </div>
                {!fijos && (
                    <div className="mt-3 flex gap-2">
                        <input value={nuevo} onChange={e => setNuevo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') meterNuevo(); }}
                            placeholder={multiple ? 'Nueva…' : 'Otro…'} aria-label="Valor nuevo"
                            className="flex-1 h-10 rounded-full bg-fill px-4 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none" />
                        <button onClick={meterNuevo} aria-label="Añadir" className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center"><Plus className="h-5 w-5" /></button>
                    </div>
                )}
                {actuales.length > 0 && !multiple && (
                    <button onClick={() => { poner([]); onCerrar(); }} className="mt-3 text-[14px] font-semibold text-muted-foreground">Quitar</button>
                )}
            </div>
        </Hoja>
    );
}


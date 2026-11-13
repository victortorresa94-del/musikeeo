import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Check, Columns3, ExternalLink, Palette, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ENERGIAS, ESTADOS, opcionesDe, textoDuracion, DURACION_MEDIA, type CampoFiltro } from '../../lib/biblioteca';
import { leerDuracion, minutos } from '../../lib/cantar';
import type { Cancion, EstadoCancion, FichaCancion } from '../../types/cancionero';
import { BotonHoja, Hoja } from './Hoja';
import { pastelDe } from './estilo';
import { PildoraValor } from './Aspecto';
import { FormNuevaColumna, GestionarCatalogo } from './Catalogo';
import { ICONO_TIPO, valoresDeTipo, type PestanaCatalogo } from './catalogoVista';
import { useCatalogo } from '../../hooks/useCatalogo';
import { conExtra, esColExtra, etiquetasExtra, gruposExtra, idDeCol, leerExtra, opcionesExtra, ordenExtra, valorExtra } from '../../lib/camposPropios';
import type { CampoPropio, TipoCampo, TipoValor } from '../../services/catalogoService';

// La vista Tabla, como en Notion o ClickUp: todos los datos de cada canción en columnas,
// cada celda se cambia en su sitio, se ordena por cualquier columna, se agrupa por cualquiera
// (con cuántas y lo que duran) y se eligen las columnas que se ven. El título queda fijo al
// deslizar de lado en el móvil.

type ColBase = 'version' | 'tono' | 'tonoAlt' | 'capo' | 'canta' | 'proyectos' | 'estilo' | 'energia' | 'estado' | 'etiquetas' | 'duracion' | 'bpm' | 'enlace';
// Las columnas propias (catálogo) van como «x:<id>»
type Col = ColBase | `x:${string}`;
type Columna = { id: Col; nombre: string; ancho: string; campo?: CampoPropio };
const ANCHO_TIPO: Record<TipoCampo, string> = { casilla: 'w-[96px]', etiqueta: 'w-[170px]', numero: 'w-[90px]', texto: 'w-[180px]' };
// El tipo del catálogo de cada columna de valores (para su color, su icono y la hoja de colores)
const TIPO_COL: Partial<Record<ColBase, TipoValor>> = { canta: 'canta', proyectos: 'grupo', estilo: 'estilo', etiquetas: 'etiqueta' };
const COLUMNAS: Columna[] = [
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
type AgruparBase = 'nada' | 'canta' | 'proyectos' | 'estilo' | 'energia' | 'estado' | 'etiquetas' | 'tono';
type Agrupar = AgruparBase | `x:${string}`;
const NOMBRE_AGRUPAR: Record<AgruparBase, string> = { nada: 'Sin agrupar', canta: 'Canta', proyectos: 'Grupo', estilo: 'Estilo', energia: 'Energía', estado: 'Estado', etiquetas: 'Etiquetas', tono: 'Tono' };
const TIPO_AGRUPAR: Partial<Record<AgruparBase, TipoValor>> = { canta: 'canta', proyectos: 'grupo', estilo: 'estilo', etiquetas: 'etiqueta' };
const CAMPO: Record<Exclude<AgruparBase, 'nada'>, CampoFiltro> = { canta: 'canta', proyectos: 'proyectos', estilo: 'estilos', energia: 'energias', estado: 'estados', etiquetas: 'etiquetas', tono: 'tonos' };

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// visibles: las columnas fijas que se ven · ocultas: las propias que se han escondido (una nueva sale)
function leerPrefs(clave: string, enSet: boolean): { visibles: Col[]; ocultas: string[]; orden: Orden; agrupar: Agrupar } {
    const base = { visibles: VISIBLES_INICIO as Col[], ocultas: [] as string[], orden: { col: enSet ? 'set' : 'titulo', sube: true } as Orden, agrupar: 'nada' as Agrupar };
    try { return { ...base, ...JSON.parse(localStorage.getItem(clave) || '{}') }; } catch { return base; }
}

function valorOrden(c: Cancion, col: Orden['col'], tono: string | null, i: number, campos: CampoPropio[]): string | number {
    const f = c.ficha ?? {};
    if (esColExtra(col)) {
        const campo = campos.find(x => x.id === idDeCol(col));
        return campo ? ordenExtra(c, campo) : '';
    }
    switch (col as ColBase | 'set' | 'titulo') {
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
    const [nuevaColumna, setNuevaColumna] = useState(false);
    const [catalogoAbierto, setCatalogoAbierto] = useState<PestanaCatalogo | null>(null);
    const { campos } = useCatalogo();
    const todasCols: Columna[] = useMemo(() => [...COLUMNAS, ...campos.map(c => ({ id: `x:${c.id}` as Col, nombre: c.nombre, ancho: ANCHO_TIPO[c.tipo], campo: c }))], [campos]);
    const [editando, setEditando] = useState<{ cancion: Cancion; col: Col } | null>(null);
    const cambiar = (c: Partial<typeof prefs>) => setPrefs(p => {
        const n = { ...p, ...c };
        try { localStorage.setItem(clave, JSON.stringify(n)); } catch { /* */ }
        return n;
    });

    const ordenadas = useMemo(() => {
        const conIndice = canciones.map((c, i) => ({ c, i, v: valorOrden(c, prefs.orden.col, tonoDe(c), i, campos) }));
        conIndice.sort((a, b) => (a.v < b.v ? -1 : a.v > b.v ? 1 : a.i - b.i) * (prefs.orden.sube ? 1 : -1));
        return conIndice.map(x => x.c);
    }, [canciones, prefs.orden, tonoDe, campos]);

    const grupos = useMemo((): { titulo: string; canciones: Cancion[]; tipo?: TipoValor }[] => {
        if (prefs.agrupar === 'nada') return [{ titulo: '', canciones: ordenadas }];
        // Por una columna propia (etiquetas o casilla)
        if (esColExtra(prefs.agrupar)) {
            const cp = campos.find(x => x.id === idDeCol(prefs.agrupar));
            if (!cp) return [{ titulo: '', canciones: ordenadas }];
            const titulos: string[] = [];
            for (const c of ordenadas) for (const v of gruposExtra(c, cp)) if (!titulos.some(t => norm(t) === norm(v))) titulos.push(v);
            const lista = titulos.map(t => ({ titulo: t, canciones: ordenadas.filter(c => gruposExtra(c, cp).some(v => norm(v) === norm(t))) }));
            const sin = ordenadas.filter(c => !gruposExtra(c, cp).length);
            if (sin.length) lista.push({ titulo: cp.tipo === 'casilla' ? `Sin «${cp.nombre}»` : `Sin ${cp.nombre.toLowerCase()}`, canciones: sin });
            return lista;
        }
        const ag = prefs.agrupar as Exclude<AgruparBase, 'nada'>;
        const campo = CAMPO[ag];
        const ops = opcionesDe(ordenadas, campo, tonoDe);
        const lista = ops.map(o => ({
            titulo: campo === 'energias' ? ENERGIAS[+o.valor as 1] : campo === 'estados' ? ESTADOS[o.valor as EstadoCancion] : o.valor,
            canciones: ordenadas.filter(c => valores(c, ag, tonoDe(c)).some(v => norm(v) === norm(o.valor))),
            tipo: TIPO_AGRUPAR[ag],
        }));
        const sin = ordenadas.filter(c => !valores(c, ag, tonoDe(c)).length);
        if (sin.length) lista.push({ titulo: `Sin ${NOMBRE_AGRUPAR[ag].toLowerCase()}`, canciones: sin, tipo: undefined });
        return lista;
    }, [ordenadas, prefs.agrupar, tonoDe, campos]);

    const seVe = (c: Columna) => (c.campo ? !prefs.ocultas.includes(c.id) : prefs.visibles.includes(c.id));
    const visibles = todasCols.filter(seVe);
    const alternarCol = (c: Columna) => {
        if (c.campo) cambiar({ ocultas: seVe(c) ? [...prefs.ocultas, c.id] : prefs.ocultas.filter(x => x !== c.id) });
        else cambiar({ visibles: seVe(c) ? prefs.visibles.filter(x => x !== c.id) : COLUMNAS.map(x => x.id).filter(x => x === c.id || prefs.visibles.includes(x)) });
    };
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
        else if (esColExtra(col)) {
            const cp = campos.find(x => x.id === idDeCol(col));
            if (cp) nueva = conExtra(c, cp.id, leerExtra(t, cp.tipo));
        }
        if (JSON.stringify(nueva) !== JSON.stringify(c)) guardar(limpiar(nueva));
    };
    const marcar = (c: Cancion, cp: CampoPropio) => guardar(limpiar(conExtra(c, cp.id, valorExtra(c, cp) === true ? undefined : true)));

    return (
        <div>
            <div className="-mx-4 px-4 md:mx-0 md:px-0 mb-2 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                {encabezado}
                <label className="h-8 pl-3 pr-1 shrink-0 rounded-full bg-fill flex items-center gap-1 text-[13px] font-semibold text-muted-foreground">
                    Agrupar
                    <select value={prefs.agrupar} onChange={e => cambiar({ agrupar: e.target.value as Agrupar })} aria-label="Agrupar por"
                        className="h-7 bg-transparent text-foreground font-semibold focus:outline-none">
                        {(Object.keys(NOMBRE_AGRUPAR) as AgruparBase[]).map(a => <option key={a} value={a}>{NOMBRE_AGRUPAR[a]}</option>)}
                        {campos.filter(c => c.tipo === 'etiqueta' || c.tipo === 'casilla').map(c => <option key={c.id} value={`x:${c.id}`}>{c.nombre}</option>)}
                    </select>
                </label>
                {enSet && prefs.orden.col !== 'set' && (
                    <button onClick={() => cambiar({ orden: { col: 'set', sube: true } })} className="h-8 px-3 shrink-0 rounded-full bg-fill text-[13px] font-semibold text-foreground">Orden del set</button>
                )}
                <button onClick={() => setEligiendoColumnas(true)} className="h-8 px-3 shrink-0 rounded-full bg-fill text-[13px] font-semibold text-foreground flex items-center gap-1.5">
                    <Columns3 className="h-4 w-4" /> Columnas
                </button>
                <button onClick={() => setCatalogoAbierto('grupo')} className="h-8 px-3 shrink-0 rounded-full bg-fill text-[13px] font-semibold text-foreground flex items-center gap-1.5">
                    <Palette className="h-4 w-4" /> Grupos y colores
                </button>
            </div>

            <div className="-mx-4 md:mx-0 overflow-x-auto overscroll-x-contain rounded-none md:rounded-2xl border-y md:border border-hairline">
                <table className="min-w-full border-separate border-spacing-0 text-[14px]">
                    <thead>
                        <tr>
                            <th scope="col" className="sticky left-0 z-10 bg-sheet min-w-[150px] max-w-[190px] px-3 h-10 text-left font-semibold text-muted-foreground border-b border-r border-hairline">
                                <button onClick={() => ordenarPor('titulo')} className="flex items-center gap-1">Título {flecha('titulo')}</button>
                            </th>
                            {visibles.map(c => {
                                const Icono = c.campo ? ICONO_TIPO[c.campo.tipo] : null;
                                return (
                                    <th key={c.id} scope="col" className={cn('px-2.5 h-10 text-left font-semibold text-muted-foreground border-b border-hairline whitespace-nowrap bg-sheet', c.ancho)}>
                                        <button onClick={() => ordenarPor(c.id)} className="flex items-center gap-1">{Icono && <Icono className="h-3.5 w-3.5" aria-hidden />}{c.nombre} {flecha(c.id)}</button>
                                    </th>
                                );
                            })}
                            <th scope="col" className="px-1.5 h-10 border-b border-hairline bg-sheet w-[44px]">
                                <button onClick={() => setNuevaColumna(true)} aria-label="Nueva columna" title="Nueva columna"
                                    className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-fill active:bg-fill"><Plus className="h-4 w-4" /></button>
                            </th>
                        </tr>
                    </thead>
                    {grupos.map(g => (
                        <tbody key={g.titulo || '_'}>
                            {g.titulo && (
                                <tr>
                                    <th colSpan={visibles.length + 2} scope="colgroup" className="text-left bg-fill border-b border-hairline">
                                        <span className="sticky left-0 inline-flex items-center gap-2 px-3 h-9 text-[14px] font-bold text-foreground">
                                            {g.tipo ? <PildoraValor tipo={g.tipo} valor={g.titulo} className="h-7 px-2.5 text-[13.5px]" /> : g.titulo}
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
                                            <Celda cancion={c} col={col.id} campo={col.campo} tono={tonoDe(c)} onEscribir={t => escribir(c, col.id, t)}
                                                onElegir={() => setEditando({ cancion: c, col: col.id })} onMarcar={() => col.campo && marcar(c, col.campo)} />
                                        </td>
                                    ))}
                                    <td className="border-b border-hairline" />
                                </tr>
                            ))}
                        </tbody>
                    ))}
                </table>
            </div>
            {!canciones.length && <p className="py-8 text-center text-[15px] text-muted-foreground">No hay canciones.</p>}

            <Hoja abierta={eligiendoColumnas} onCerrar={() => setEligiendoColumnas(false)} titulo="Columnas" derecha={<BotonHoja fuerte onClick={() => setEligiendoColumnas(false)}>Listo</BotonHoja>}>
                <div className="px-4 pb-5">
                    <div className="flex flex-wrap gap-2">
                        {todasCols.map(c => {
                            const si = seVe(c);
                            const Icono = c.campo ? ICONO_TIPO[c.campo.tipo] : null;
                            return (
                                <button key={c.id} aria-pressed={si} onClick={() => alternarCol(c)}
                                    className={cn('h-9 px-3.5 rounded-full text-[14px] font-semibold flex items-center gap-1', si ? 'bg-foreground text-background' : 'bg-fill text-foreground')}>
                                    {Icono && <Icono className="h-3.5 w-3.5" aria-hidden />}{c.nombre}
                                </button>
                            );
                        })}
                    </div>
                    <button onClick={() => { setEligiendoColumnas(false); setNuevaColumna(true); }} className="mt-4 w-full h-11 rounded-full border border-dashed border-hairline-strong text-[15px] font-semibold text-foreground flex items-center justify-center gap-1.5">
                        <Plus className="h-4 w-4" /> Nueva columna
                    </button>
                    <button onClick={() => { setEligiendoColumnas(false); setCatalogoAbierto('columnas'); }} className="mt-2 w-full h-11 rounded-full text-[14.5px] font-semibold text-muted-foreground flex items-center justify-center gap-1.5">
                        <Palette className="h-4 w-4" /> Renombrar o borrar columnas, grupos y colores
                    </button>
                </div>
            </Hoja>
            <Hoja abierta={nuevaColumna} onCerrar={() => setNuevaColumna(false)} titulo="Nueva columna" izquierda={<BotonHoja onClick={() => setNuevaColumna(false)}>Cancelar</BotonHoja>}>
                <div className="px-4 pb-5">
                    <FormNuevaColumna onCreada={c => { setNuevaColumna(false); cambiar({ ocultas: prefs.ocultas.filter(x => x !== `x:${c.id}`) }); }} />
                </div>
            </Hoja>
            {catalogoAbierto && <GestionarCatalogo abierta inicio={catalogoAbierto} encima onCerrar={() => setCatalogoAbierto(null)} />}
            {editando && (
                <EditorOpciones key={`${editando.cancion.id}-${editando.col}`} cancion={canciones.find(c => c.id === editando.cancion.id) ?? editando.cancion} col={editando.col} todas={todas}
                    campo={campos.find(x => x.id === idDeCol(editando.col))} titulo={todasCols.find(x => x.id === editando.col)?.nombre ?? ''}
                    onColores={t => setCatalogoAbierto(t)} onCerrar={() => setEditando(null)} guardar={guardar} tonoDe={tonoDe} />
            )}
        </div>
    );
}

function valores(c: Cancion, a: Exclude<AgruparBase, 'nada'>, tono: string | null): string[] {
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
// El color de una etiqueta de una columna propia: siempre el mismo para el mismo valor
const pastelExtra = (id: string, v: string) => pastelDe(`x:${id}:${v.trim().toLowerCase()}`);

function Celda({ cancion: c, col, campo, tono, onEscribir, onElegir, onMarcar }: {
    cancion: Cancion; col: Col; campo?: CampoPropio; tono: string | null; onEscribir: (t: string) => void; onElegir: () => void; onMarcar: () => void;
}) {
    const f = c.ficha ?? {};
    const texto = (valor: string, placeholder: string, extra?: string) => (
        <input defaultValue={valor} key={valor} onBlur={e => onEscribir(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            placeholder={placeholder} aria-label={`${campo?.nombre ?? col} de ${c.titulo}`}
            className={cn('w-full h-8 rounded-lg bg-transparent px-1.5 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:bg-fill focus:outline-none', extra)} />
    );
    const boton = (dentro: ReactNode) => (
        <button onClick={onElegir} className="w-full min-h-8 rounded-lg px-1 py-0.5 flex flex-wrap items-center gap-1 text-left hover:bg-fill active:bg-fill" aria-label={`Cambiar ${campo?.nombre ?? col} de ${c.titulo}`}>
            {dentro || <span className="text-muted-foreground/50 text-[13px] px-0.5">—</span>}
        </button>
    );
    if (campo) {
        const v = valorExtra(c, campo);
        if (campo.tipo === 'casilla') return (
            <button role="checkbox" aria-checked={v === true} onClick={onMarcar} aria-label={`${campo.nombre} de ${c.titulo}`} className="h-8 w-full rounded-lg flex items-center px-1.5 hover:bg-fill">
                <span className={cn('h-5 w-5 rounded-md border flex items-center justify-center', v === true ? 'bg-foreground border-foreground text-background' : 'border-hairline-strong')}>
                    {v === true && <Check className="h-3.5 w-3.5" />}
                </span>
            </button>
        );
        if (campo.tipo === 'etiqueta') return boton(etiquetasExtra(c, campo).length ? etiquetasExtra(c, campo).map(e => chip(e, pastel(pastelExtra(campo.id, e)))) : null);
        const t = typeof v === 'number' ? String(v).replace('.', ',') : typeof v === 'string' ? v : '';
        return texto(t, '—', campo.tipo === 'numero' ? 'tabular-nums' : undefined);
    }
    const valorPildora = (tipo: TipoValor, v: string) => <PildoraValor key={v} tipo={tipo} valor={v} />;
    switch (col as ColBase) {
        case 'version': return texto(c.version ?? '', 'Original', c.favorita ? 'font-semibold' : undefined);
        case 'tono': return texto(f.tono ?? '', tono ?? '—', 'font-bold');
        case 'tonoAlt': return texto(f.tonoAlt ?? '', '—');
        case 'capo': return texto(f.capo ?? '', '—');
        case 'duracion': return texto(c.duracion ? minutos(c.duracion) : '', '3:30', 'tabular-nums');
        case 'bpm': return texto(c.bpm ? String(c.bpm) : '', '—', 'tabular-nums');
        case 'enlace': return f.enlace
            ? <span className="flex items-center gap-1"><a href={f.enlace} target="_blank" rel="noopener noreferrer" className="h-7 px-2 rounded-full bg-fill text-[12px] font-semibold flex items-center gap-1">Abrir <ExternalLink className="h-3 w-3" /></a>{texto(f.enlace, '', 'w-6 opacity-0 focus:opacity-100 focus:w-40')}</span>
            : texto('', 'https://…');
        case 'canta': return boton(f.canta && valorPildora('canta', f.canta));
        case 'proyectos': return boton(f.proyectos?.length ? f.proyectos.map(p => valorPildora('grupo', p)) : null);
        case 'estilo': return boton(f.estilo && valorPildora('estilo', f.estilo));
        case 'energia': return boton(f.energia && chip(ENERGIAS[f.energia], 'bg-fill-strong text-foreground'));
        case 'estado': return boton(f.estado && chip(ESTADOS[f.estado], f.estado === 'lista' ? 'bg-pastel-menta text-pastel-menta-ink' : 'bg-pastel-mantequilla text-pastel-mantequilla-ink'));
        case 'etiquetas': return boton(f.etiquetas?.length ? f.etiquetas.map(e => valorPildora('etiqueta', e)) : null);
    }
}

// Elegir el valor de una celda de opciones: los que ya usas, o uno nuevo
function EditorOpciones({ cancion, col, campo: cp, titulo, todas, onCerrar, onColores, guardar, tonoDe }: {
    cancion: Cancion; col: Col; campo?: CampoPropio; titulo: string; todas: Cancion[]; onCerrar: () => void; onColores: (t: PestanaCatalogo) => void;
    guardar: (c: Cancion) => void; tonoDe: (c: Cancion) => string | null;
}) {
    const [nuevo, setNuevo] = useState('');
    useCatalogo();
    if (cp) return <EditorEtiquetasExtra cancion={cancion} campo={cp} todas={todas} onCerrar={onCerrar} guardar={guardar} onColores={() => onColores('columnas')} />;
    const f = cancion.ficha ?? {};
    const tipo = TIPO_COL[col as ColBase];
    const multiple = col === 'proyectos' || col === 'etiquetas';
    const campo: CampoFiltro = col === 'canta' ? 'canta' : col === 'proyectos' ? 'proyectos' : col === 'estilo' ? 'estilos' : col === 'etiquetas' ? 'etiquetas' : col === 'energia' ? 'energias' : 'estados';
    const fijos = col === 'energia' ? Object.keys(ENERGIAS) : col === 'estado' ? Object.keys(ESTADOS) : null;
    // Los que ya usas y los creados en «Grupos y colores» (aunque aún no los lleve ninguna)
    const opciones = fijos ?? (tipo ? valoresDeTipo(todas, tipo).map(o => o.valor) : opcionesDe(todas, campo, tonoDe).map(o => o.valor));
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
    return (
        <Hoja abierta onCerrar={onCerrar} titulo={`${titulo} · ${cancion.titulo}`} derecha={<BotonHoja fuerte onClick={onCerrar}>Listo</BotonHoja>}>
            <div className="px-4 pb-5">
                <div className="flex flex-wrap gap-2">
                    {[...new Set([...opciones, ...actuales])].map(v => {
                        const si = actuales.some(x => norm(x) === norm(v));
                        // Con su color y su icono: elegido = en su color con ✓; sin elegir = gris con su icono
                        if (tipo) return (
                            <button key={v} onClick={() => alternar(v)} aria-pressed={si} className={cn('rounded-full', si ? 'ring-2 ring-foreground ring-offset-1 ring-offset-sheet' : 'opacity-70')}>
                                <PildoraValor tipo={tipo} valor={v} className="h-9 px-3.5 text-[14px]" />
                            </button>
                        );
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
                {tipo && (
                    <button onClick={() => onColores(tipo)} className="mt-4 h-9 flex items-center gap-1.5 text-[14px] font-semibold text-muted-foreground">
                        <Palette className="h-4 w-4" /> Colores{tipo === 'grupo' ? ', iconos y logos' : ''}, renombrar o quitar
                    </button>
                )}
            </div>
        </Hoja>
    );
}

// Las etiquetas de una columna propia: las que ya hay y una nueva
function EditorEtiquetasExtra({ cancion, campo, todas, onCerrar, guardar, onColores }: {
    cancion: Cancion; campo: CampoPropio; todas: Cancion[]; onCerrar: () => void; guardar: (c: Cancion) => void; onColores: () => void;
}) {
    const [nuevo, setNuevo] = useState('');
    const actuales = etiquetasExtra(cancion, campo);
    const opciones = [...new Set([...opcionesExtra(todas, campo), ...actuales])];
    const poner = (lista: string[]) => guardar(limpiar(conExtra(cancion, campo.id, lista.slice(0, 30))));
    const alternar = (v: string) => poner(actuales.some(x => norm(x) === norm(v)) ? actuales.filter(x => norm(x) !== norm(v)) : [...actuales, v]);
    const meter = () => { const v = nuevo.trim().slice(0, 40); if (v && !actuales.some(x => norm(x) === norm(v))) poner([...actuales, v]); setNuevo(''); };
    return (
        <Hoja abierta onCerrar={onCerrar} titulo={`${campo.nombre} · ${cancion.titulo}`} derecha={<BotonHoja fuerte onClick={onCerrar}>Listo</BotonHoja>}>
            <div className="px-4 pb-5">
                <div className="flex flex-wrap gap-2">
                    {opciones.map(v => {
                        const si = actuales.some(x => norm(x) === norm(v));
                        const p = pastelExtra(campo.id, v);
                        return (
                            <button key={v} onClick={() => alternar(v)} aria-pressed={si}
                                className={cn('h-9 px-3.5 rounded-full text-[14px] font-semibold', p.fondo, p.tinta, si ? 'ring-2 ring-foreground ring-offset-1 ring-offset-sheet' : 'opacity-70')}>{v}</button>
                        );
                    })}
                </div>
                <div className="mt-3 flex gap-2">
                    <input value={nuevo} onChange={e => setNuevo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') meter(); }}
                        placeholder="Nueva…" aria-label="Etiqueta nueva"
                        className="flex-1 h-10 rounded-full bg-fill px-4 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none" />
                    <button onClick={meter} aria-label="Añadir" className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center"><Plus className="h-5 w-5" /></button>
                </div>
                <button onClick={onColores} className="mt-4 h-9 flex items-center gap-1.5 text-[14px] font-semibold text-muted-foreground">
                    <Columns3 className="h-4 w-4" /> Renombrar o borrar la columna
                </button>
            </div>
        </Hoja>
    );
}


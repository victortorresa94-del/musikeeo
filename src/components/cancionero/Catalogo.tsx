import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Check, List, Palette, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BotonHoja, Hoja } from './Hoja';
import { EditarAspecto, PildoraValor } from './Aspecto';
import { ICONO_TIPO, valoresDeTipo, type PestanaCatalogo } from './catalogoVista';
import { useCancionero } from '../../hooks/useCancionero';
import { NOMBRE_TIPO, conExtra } from '../../lib/camposPropios';
import { catalogoService, claveAspecto, type CampoPropio, type TipoCampo, type TipoValor } from '../../services/catalogoService';
import type { Cancion, FichaCancion } from '../../types/cancionero';

// Grupos, estilos, etiquetas, quien canta y las columnas propias, en una hoja (13-nov):
// crear uno nuevo (aunque aún no lo lleve ninguna canción), su color y su icono o logo,
// cambiarle el nombre en todas las canciones o quitarlo. Todo con Deshacer.

const PESTANAS: { id: PestanaCatalogo; nombre: string }[] = [
    { id: 'grupo', nombre: 'Grupos' }, { id: 'estilo', nombre: 'Estilos' }, { id: 'etiqueta', nombre: 'Etiquetas' },
    { id: 'canta', nombre: 'Canta' }, { id: 'columnas', nombre: 'Columnas' },
];
const NUEVO: Record<TipoValor, string> = { grupo: 'Nuevo grupo', estilo: 'Nuevo estilo', etiqueta: 'Nueva etiqueta', canta: 'Otra persona' };

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();


// ¿Lleva esa canción ese valor? Y la canción con el valor cambiado (o quitado, con «nuevo» vacío)
const lleva = (c: Cancion, tipo: TipoValor, v: string) => {
    const f = c.ficha ?? {};
    const k = norm(v);
    if (tipo === 'grupo') return (f.proyectos ?? []).some(x => norm(x) === k);
    if (tipo === 'etiqueta') return (f.etiquetas ?? []).some(x => norm(x) === k);
    return norm((tipo === 'estilo' ? f.estilo : f.canta) ?? '') === k;
};
function cambiarValor(c: Cancion, tipo: TipoValor, viejo: string, nuevo: string): Cancion {
    const f: FichaCancion = { ...(c.ficha ?? {}) };
    const k = norm(viejo);
    const lista = (xs: string[] = []) => {
        const salida: string[] = [];
        for (const x of xs) {
            const y = norm(x) === k ? nuevo : x;
            if (y && !salida.some(z => norm(z) === norm(y))) salida.push(y);
        }
        return salida.length ? salida : undefined;
    };
    if (tipo === 'grupo') f.proyectos = lista(f.proyectos);
    else if (tipo === 'etiqueta') f.etiquetas = lista(f.etiquetas);
    else if (tipo === 'estilo') f.estilo = nuevo || undefined;
    else f.canta = nuevo || undefined;
    for (const key of Object.keys(f) as (keyof FichaCancion)[]) if (f[key] === undefined) delete f[key];
    return { ...c, ficha: Object.keys(f).length ? f : undefined };
}

export function GestionarCatalogo({ abierta, onCerrar, inicio = 'grupo', encima }: { abierta: boolean; onCerrar: () => void; inicio?: PestanaCatalogo; encima?: boolean }) {
    const [pestana, setPestana] = useState<PestanaCatalogo>(inicio);
    return (
        <Hoja abierta={abierta} onCerrar={onCerrar} alta encima={encima} titulo="Grupos y colores" derecha={<BotonHoja fuerte onClick={onCerrar}>Listo</BotonHoja>}>
            <div className="px-4 pb-2 sticky top-0 z-10 bg-sheet">
                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar" role="tablist">
                    {PESTANAS.map(p => (
                        <button key={p.id} role="tab" aria-selected={pestana === p.id} onClick={() => setPestana(p.id)}
                            className={cn('h-8 px-3 shrink-0 rounded-full text-[13.5px] font-semibold', pestana === p.id ? 'bg-foreground text-background' : 'bg-fill text-foreground')}>
                            {p.nombre}
                        </button>
                    ))}
                </div>
            </div>
            {pestana === 'columnas' ? <Columnas /> : <Valores key={pestana} tipo={pestana} />}
        </Hoja>
    );
}

function Valores({ tipo }: { tipo: TipoValor }) {
    const { canciones, guardarVarias, catalogo } = useCancionero();
    const valores = useMemo(() => valoresDeTipo(canciones, tipo), [canciones, tipo, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
    const [aspecto, setAspecto] = useState<string | null>(null);
    const [renombrando, setRenombrando] = useState<{ viejo: string; texto: string } | null>(null);
    const [borrando, setBorrando] = useState<string | null>(null);
    const [nuevo, setNuevo] = useState('');

    // Cambia (o quita) el valor en todas las canciones y lleva su color e icono al nombre nuevo
    const aplicar = (viejo: string, nuevoNombre: string) => {
        const afectadas = canciones.filter(c => lleva(c, tipo, viejo));
        const antesAsp = catalogoService.aspecto(claveAspecto(tipo, viejo));
        if (afectadas.length) guardarVarias(afectadas.map(c => cambiarValor(c, tipo, viejo, nuevoNombre)));
        if (claveAspecto(tipo, viejo) !== claveAspecto(tipo, nuevoNombre || '\u0000')) {
            if (nuevoNombre && antesAsp) catalogoService.ponerAspecto(claveAspecto(tipo, nuevoNombre), { ...antesAsp, nombre: nuevoNombre });
            catalogoService.ponerAspecto(claveAspecto(tipo, viejo), null);
        } else if (nuevoNombre && antesAsp) catalogoService.ponerAspecto(claveAspecto(tipo, viejo), { ...antesAsp, nombre: nuevoNombre });
        const aviso = nuevoNombre ? `«${viejo}» ahora es «${nuevoNombre}»` : `«${viejo}» quitado`;
        toast.success(aviso, {
            description: afectadas.length ? `${afectadas.length} ${afectadas.length === 1 ? 'canción' : 'canciones'}` : undefined,
            action: {
                label: 'Deshacer', onClick: () => {
                    if (afectadas.length) guardarVarias(afectadas);
                    if (nuevoNombre && claveAspecto(tipo, viejo) !== claveAspecto(tipo, nuevoNombre)) catalogoService.ponerAspecto(claveAspecto(tipo, nuevoNombre), null);
                    catalogoService.ponerAspecto(claveAspecto(tipo, viejo), antesAsp ?? null);
                },
            },
        });
    };
    const crear = () => {
        const v = nuevo.trim().slice(0, 40);
        setNuevo('');
        if (!v) return;
        if (valores.some(x => norm(x.valor) === norm(v))) { toast(`«${v}» ya existe`); return; }
        catalogoService.ponerAspecto(claveAspecto(tipo, v), { ...catalogoService.aspecto(claveAspecto(tipo, v)), nombre: v });
        toast.success(`«${v}» creado`, { description: 'Ya sale para elegirlo en la ficha y en la Tabla' });
    };

    return (
        <div className="px-4 pb-6">
            {!valores.length && <p className="py-6 text-center text-[15px] text-muted-foreground">Todavía no hay ninguno.</p>}
            <ul className="divide-y divide-hairline">
                {valores.map(({ valor, n }) => (
                    <li key={valor} className="py-1.5">
                        {renombrando?.viejo === valor ? (
                            <form className="flex gap-2 items-center" onSubmit={e => { e.preventDefault(); const t = renombrando.texto.trim().slice(0, 40); setRenombrando(null); if (t && t !== valor) aplicar(valor, t); }}>
                                <input autoFocus value={renombrando.texto} onChange={e => setRenombrando({ viejo: valor, texto: e.target.value })} aria-label={`Nombre nuevo de ${valor}`}
                                    className="flex-1 min-w-0 h-10 px-3.5 rounded-full bg-fill text-[16px] text-foreground outline-none" />
                                <button type="submit" aria-label="Guardar el nombre" className="pulsable h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center"><Check className="h-4 w-4" /></button>
                                <button type="button" onClick={() => setRenombrando(null)} className="h-10 px-2 text-[14px] text-muted-foreground">Cancelar</button>
                            </form>
                        ) : borrando === valor ? (
                            <div className="flex items-center gap-2">
                                <p className="flex-1 min-w-0 text-[14px] text-foreground">{n ? `¿Quitar «${valor}» de ${n} ${n === 1 ? 'canción' : 'canciones'}?` : `¿Borrar «${valor}»?`}</p>
                                <button onClick={() => { setBorrando(null); aplicar(valor, ''); }} className="h-9 px-3 rounded-full bg-[#E05C5C] text-white text-[14px] font-semibold">{n ? 'Quitar' : 'Borrar'}</button>
                                <button onClick={() => setBorrando(null)} className="h-9 px-2 text-[14px] text-muted-foreground">No</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <button onClick={() => setAspecto(valor)} className="flex-1 min-w-0 flex items-center gap-2 py-1 text-left" aria-label={`Color${tipo === 'grupo' ? ' e icono' : ''} de ${valor}`}>
                                    <PildoraValor tipo={tipo} valor={valor} className="h-8 px-3 text-[14px] max-w-[70%] overflow-hidden" />
                                    <span className="text-[13px] text-muted-foreground tabular-nums shrink-0">{n ? `${n} ${n === 1 ? 'canción' : 'canciones'}` : 'Sin canciones'}</span>
                                </button>
                                <button onClick={() => setAspecto(valor)} aria-label={`Cambiar el color de ${valor}`} className="pulsable h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-fill"><Palette className="h-4 w-4" /></button>
                                <button onClick={() => setRenombrando({ viejo: valor, texto: valor })} aria-label={`Renombrar ${valor}`} className="pulsable h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-fill"><Pencil className="h-4 w-4" /></button>
                                <button onClick={() => setBorrando(valor)} aria-label={`Quitar ${valor}`} className="pulsable h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-fill"><Trash2 className="h-4 w-4" /></button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); crear(); }}>
                <input value={nuevo} onChange={e => setNuevo(e.target.value)} placeholder={NUEVO[tipo]} aria-label={NUEVO[tipo]}
                    className="flex-1 min-w-0 h-11 px-4 rounded-full bg-fill text-[16px] text-foreground placeholder:text-muted-foreground outline-none" />
                <button type="submit" aria-label="Crear" className="pulsable h-11 w-11 rounded-full bg-foreground text-background flex items-center justify-center"><Plus className="h-5 w-5" /></button>
            </form>
            {tipo === 'grupo' && <p className="mt-2 text-[12.5px] text-muted-foreground">Toca un grupo para ponerle color y su icono o tu logo.</p>}
            {aspecto && <EditarAspecto tipo={tipo} valor={aspecto} encima onCerrar={() => setAspecto(null)} />}
        </div>
    );
}

const TIPOS: TipoCampo[] = ['casilla', 'etiqueta', 'numero', 'texto'];

// Elegir el tipo de una columna nueva
export function ElegirTipo({ tipo, onTipo }: { tipo: TipoCampo; onTipo: (t: TipoCampo) => void }) {
    return (
        <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Tipo de columna">
            {TIPOS.map(t => {
                const Icono = ICONO_TIPO[t];
                return (
                    <button key={t} type="button" role="radio" aria-checked={tipo === t} onClick={() => onTipo(t)}
                        className={cn('h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[12.5px] font-semibold', tipo === t ? 'bg-foreground text-background' : 'bg-fill text-foreground')}>
                        <Icono className="h-4 w-4" />{NOMBRE_TIPO[t]}
                    </button>
                );
            })}
        </div>
    );
}

// Crear una columna: nombre y tipo (lo usan la Tabla y esta hoja)
export function FormNuevaColumna({ onCreada }: { onCreada?: (c: CampoPropio) => void }) {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState<TipoCampo>('casilla');
    const crear = () => {
        const n = nombre.trim();
        if (!n) return;
        if (catalogoService.estado().campos.some(c => norm(c.nombre) === norm(n))) { toast(`Ya hay una columna «${n}»`); return; }
        const c = catalogoService.crearCampo(n, tipo);
        setNombre('');
        toast.success(`Columna «${c.nombre}» creada`, { description: NOMBRE_TIPO[c.tipo] });
        onCreada?.(c);
    };
    return (
        <form className="space-y-2.5" onSubmit={e => { e.preventDefault(); crear(); }}>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre (Ensayada, Coros, Nota…)" aria-label="Nombre de la columna"
                className="w-full h-11 px-4 rounded-full bg-fill text-[16px] text-foreground placeholder:text-muted-foreground outline-none" />
            <ElegirTipo tipo={tipo} onTipo={setTipo} />
            <button type="submit" disabled={!nombre.trim()} className="w-full h-11 rounded-full bg-foreground text-background text-[15px] font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5">
                <Plus className="h-4 w-4" /> Crear columna
            </button>
        </form>
    );
}

function Columnas() {
    const { canciones, guardarVarias, catalogo } = useCancionero();
    const [borrando, setBorrando] = useState<string | null>(null);
    const cuantas = (id: string) => canciones.filter(c => c.ficha?.extra?.[id] !== undefined).length;
    const borrar = (campo: CampoPropio) => {
        const afectadas = canciones.filter(c => c.ficha?.extra?.[campo.id] !== undefined);
        const antes = catalogo.campos;
        if (afectadas.length) guardarVarias(afectadas.map(c => conExtra(c, campo.id, undefined)));
        catalogoService.borrarCampo(campo.id);
        toast.success(`Columna «${campo.nombre}» borrada`, {
            action: { label: 'Deshacer', onClick: () => { if (afectadas.length) guardarVarias(afectadas); catalogoService.guardar({ campos: antes }); } },
        });
    };
    return (
        <div className="px-4 pb-6">
            {!catalogo.campos.length && <p className="pt-2 pb-4 text-[14.5px] text-muted-foreground">Tus columnas propias: una casilla («Ensayada»), etiquetas («Coros»), un número («Puntuación») o un texto («Quién la propuso»). Salen en la Tabla y en la ficha de cada canción.</p>}
            <ul className="divide-y divide-hairline">
                {catalogo.campos.map(c => {
                    const Icono = ICONO_TIPO[c.tipo] ?? List;
                    const n = cuantas(c.id);
                    return (
                        <li key={c.id} className="py-2 flex items-center gap-2">
                            {borrando === c.id ? (
                                <>
                                    <p className="flex-1 min-w-0 text-[14px] text-foreground">¿Borrar «{c.nombre}»{n ? ` y lo que tiene en ${n} ${n === 1 ? 'canción' : 'canciones'}` : ''}?</p>
                                    <button onClick={() => { setBorrando(null); borrar(c); }} className="h-9 px-3 rounded-full bg-[#E05C5C] text-white text-[14px] font-semibold">Borrar</button>
                                    <button onClick={() => setBorrando(null)} className="h-9 px-2 text-[14px] text-muted-foreground">No</button>
                                </>
                            ) : (
                                <>
                                    <span className="h-9 w-9 shrink-0 rounded-xl bg-fill flex items-center justify-center text-foreground"><Icono className="h-4 w-4" /></span>
                                    <input defaultValue={c.nombre} key={c.nombre} aria-label={`Nombre de la columna ${c.nombre}`}
                                        onBlur={e => { const t = e.target.value.trim(); if (t && t !== c.nombre) catalogoService.cambiarCampo(c.id, { nombre: t }); else e.target.value = c.nombre; }}
                                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                        className="flex-1 min-w-0 h-9 px-2 rounded-lg bg-transparent text-[15.5px] font-semibold text-foreground focus:bg-fill outline-none" />
                                    <span className="text-[12.5px] text-muted-foreground shrink-0">{NOMBRE_TIPO[c.tipo]}{n ? ` · ${n}` : ''}</span>
                                    <button onClick={() => setBorrando(c.id)} aria-label={`Borrar la columna ${c.nombre}`} className="pulsable h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-fill"><Trash2 className="h-4 w-4" /></button>
                                </>
                            )}
                        </li>
                    );
                })}
            </ul>
            <p className="mt-4 mb-2 text-[13px] font-semibold text-muted-foreground">Nueva columna</p>
            <FormNuevaColumna />
        </div>
    );
}

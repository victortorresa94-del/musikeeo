import { useState } from 'react';
import { toast } from 'sonner';
import { Check, ChevronDown, GraduationCap, ListMusic, MoreHorizontal, Plus, Repeat, Sparkles, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BotonHoja, Hoja } from './Hoja';
import { ICONO, PASTEL, pastelDe, type Pastel } from './estilo';
import { COLORES_LISTA, entradasPropias, gruposDe, LISTAS_FIJAS, resumenRegla, type EntradaLista } from '../../lib/listas';
import { cancioneroService } from '../../services/cancioneroService';
import type { Cancion, Lista, ReglaLista } from '../../types/cancionero';

const pastelDeColor = (color?: string): Pastel | null => (color && color in PASTEL ? PASTEL[color as keyof typeof PASTEL] : null);
const nuevoId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `l${Date.now()}${Math.random().toString(36).slice(2, 8)}`);

// El dibujo de cada lista: icono en su círculo de color
function IconoLista({ e, className }: { e: EntradaLista; className?: string }) {
    const caja = 'h-8 w-8 shrink-0 rounded-[10px] flex items-center justify-center';
    if (e.clase === 'grupo' && e.id !== 'sin-grupo') {
        return <span className={cn(caja, pastelDe(`grupo:${e.nombre}`).fondo, className)}><img src={ICONO.rumba} alt="" className="h-7 w-7 object-contain" /></span>;
    }
    const p = pastelDeColor(e.color);
    const Icono = e.id === 'todas' ? ListMusic : e.id === 'aprender' ? GraduationCap : e.id === 'ensayar' ? Repeat : e.id === 'favoritas' ? Star
        : e.lista?.regla ? Sparkles : ListMusic;
    return <span className={cn(caja, p ? cn(p.fondo, p.tinta) : 'bg-fill-strong text-foreground', className)}><Icono className="h-4 w-4" /></span>;
}

// Todas las listas, por secciones. Sirve en la hoja del móvil y en el menú de la izquierda del ordenador
export function MenuListas({ actual, onElegir, canciones, listas, cuantas, onNueva, onOpciones, compacto }: {
    actual: string; onElegir: (id: string) => void; canciones: Cancion[]; listas: Lista[];
    cuantas: (id: string) => number; onNueva: () => void; onOpciones: (l: Lista) => void; compacto?: boolean;
}) {
    const grupos = gruposDe(canciones);
    const propias = entradasPropias(listas);
    const fila = (e: EntradaLista) => (
        <div key={e.id} className={cn('group flex items-center rounded-xl', actual === e.id ? 'bg-fill-strong' : 'hover:bg-fill')}>
            <button onClick={() => onElegir(e.id)} aria-current={actual === e.id ? 'true' : undefined}
                className={cn('flex-1 min-w-0 flex items-center gap-2.5 px-2 text-left', compacto ? 'h-10' : 'h-12')}>
                <IconoLista e={e} />
                <span className="flex-1 min-w-0 truncate text-[15px] font-semibold text-foreground">{e.nombre}</span>
                <span className="text-[13px] text-muted-foreground tabular-nums">{cuantas(e.id)}</span>
            </button>
            {e.lista && (
                <button onClick={() => onOpciones(e.lista!)} aria-label={`Opciones de ${e.nombre}`}
                    className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-muted-foreground active:bg-fill">
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            )}
        </div>
    );
    const titulo = (t: string) => <p className="mt-4 first:mt-0 mb-1 px-2 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{t}</p>;
    return (
        <div>
            {LISTAS_FIJAS.map(fila)}
            {grupos.length > 0 && <>{titulo('Grupos')}{grupos.map(fila)}</>}
            {titulo('Mis listas')}
            {propias.map(fila)}
            <button onClick={onNueva} className={cn('w-full flex items-center gap-2.5 px-2 rounded-xl text-left text-[15px] font-semibold text-foreground hover:bg-fill active:bg-fill', compacto ? 'h-10' : 'h-12')}>
                <span className="h-8 w-8 shrink-0 rounded-[10px] bg-fill flex items-center justify-center"><Plus className="h-4 w-4" /></span>
                Nueva lista
            </button>
        </div>
    );
}

// En el móvil: un botón con la lista de ahora que abre la hoja con todas
export function BotonListas({ nombre, n, onClick }: { nombre: string; n: number; onClick: () => void }) {
    return (
        <button onClick={onClick} aria-label={`Lista: ${nombre}. Cambiar de lista`}
            className="pulsable h-9 max-w-full pl-3 pr-2.5 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5">
            <ListMusic className="h-4 w-4 shrink-0" />
            <span className="truncate">{nombre}</span>
            <span className="text-muted-foreground tabular-nums">{n}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
    );
}

// Crear o editar una lista. Al crear, si hay filtros o búsqueda, se puede guardar como lista inteligente
export function EditorLista({ abierta, onCerrar, lista, reglaDeAhora, onCreada }: {
    abierta: boolean; onCerrar: () => void; lista?: Lista | null; reglaDeAhora?: ReglaLista | null; onCreada?: (l: Lista) => void;
}) {
    const [nombre, setNombre] = useState('');
    const [color, setColor] = useState<string>('cielo');
    const [inteligente, setInteligente] = useState(false);
    const [antes, setAntes] = useState(false);
    if (abierta !== antes) {
        setAntes(abierta);
        if (abierta) {
            setNombre(lista?.nombre ?? '');
            setColor(lista?.color ?? 'cielo');
            setInteligente(!lista && !!reglaDeAhora);
        }
    }
    const guardar = () => {
        const n = nombre.trim().slice(0, 80);
        if (!n) return;
        if (lista) {
            cancioneroService.guardarLista({ ...lista, nombre: n, color });
        } else {
            const ahora = new Date().toISOString();
            const nueva = cancioneroService.guardarLista({
                id: nuevoId(), nombre: n, color, canciones: [], creadaEn: ahora, actualizadaEn: ahora, orden: Date.now(),
                ...(inteligente && reglaDeAhora ? { regla: reglaDeAhora } : {}),
            });
            onCreada?.(nueva);
            toast.success(inteligente ? `Lista «${n}» creada: se llena sola` : `Lista «${n}» creada. Usa «Elegir» para meter canciones`);
        }
        onCerrar();
    };
    return (
        <Hoja abierta={abierta} onCerrar={onCerrar} titulo={lista ? 'Editar lista' : 'Nueva lista'} encima
            izquierda={<BotonHoja onClick={onCerrar}>Cancelar</BotonHoja>}
            derecha={<BotonHoja fuerte onClick={guardar} disabled={!nombre.trim()}>{lista ? 'Guardar' : 'Crear'}</BotonHoja>}>
            <div className="px-4 pb-5 space-y-4">
                <input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') guardar(); }}
                    placeholder="Para aprender, Estopa, Bodas…" aria-label="Nombre de la lista"
                    className="w-full h-12 px-4 rounded-2xl bg-fill text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none" />
                <div className="flex items-center gap-2.5" role="radiogroup" aria-label="Color">
                    {COLORES_LISTA.map(c => (
                        <button key={c} role="radio" aria-checked={color === c} aria-label={c} onClick={() => setColor(c)}
                            className={cn('h-9 w-9 rounded-full flex items-center justify-center', PASTEL[c].fondo, color === c && 'ring-2 ring-foreground ring-offset-2 ring-offset-background')}>
                            {color === c && <Check className={cn('h-4 w-4', PASTEL[c].tinta)} />}
                        </button>
                    ))}
                </div>
                {!lista && reglaDeAhora && (
                    <div className="rounded-2xl bg-fill p-1 grid grid-cols-2 gap-1" role="radiogroup" aria-label="Tipo de lista">
                        {([[false, 'Elijo yo las canciones'], [true, 'Con los filtros de ahora']] as const).map(([v, t]) => (
                            <button key={String(v)} role="radio" aria-checked={inteligente === v} onClick={() => setInteligente(v)}
                                className={cn('min-h-10 px-2 py-1.5 rounded-xl text-[14px] font-semibold', inteligente === v ? 'bg-background text-foreground shadow-e1' : 'text-muted-foreground')}>{t}</button>
                        ))}
                    </div>
                )}
                {!lista && reglaDeAhora && inteligente && (
                    <p className="text-[13px] text-muted-foreground">Se llena sola con las que cumplan: {resumenRegla(reglaDeAhora)}.</p>
                )}
                {lista?.regla && <p className="text-[13px] text-muted-foreground">Lista inteligente: {resumenRegla(lista.regla)}.</p>}
            </div>
        </Hoja>
    );
}

// Meter las elegidas en una lista manual (o en una nueva)
export function AnadirALista({ abierta, onCerrar, ids, listas, onHecho, onNueva }: {
    abierta: boolean; onCerrar: () => void; ids: string[]; listas: Lista[]; onHecho: () => void; onNueva: () => void;
}) {
    const manuales = entradasPropias(listas.filter(l => !l.regla));
    const meter = (l: Lista) => {
        const nuevas = ids.filter(id => !l.canciones.includes(id));
        cancioneroService.guardarLista({ ...l, canciones: [...l.canciones, ...nuevas] });
        toast.success(nuevas.length ? `${nuevas.length} ${nuevas.length === 1 ? 'canción' : 'canciones'} a «${l.nombre}»` : `Ya estaban en «${l.nombre}»`,
            { action: { label: 'Deshacer', onClick: () => cancioneroService.guardarLista(l) } });
        onHecho();
        onCerrar();
    };
    return (
        <Hoja abierta={abierta} onCerrar={onCerrar} titulo="Añadir a una lista" izquierda={<BotonHoja onClick={onCerrar}>Cancelar</BotonHoja>}>
            <div className="px-4 pb-5">
                {manuales.map(e => (
                    <button key={e.id} onClick={() => meter(e.lista!)} className="w-full h-12 flex items-center gap-2.5 px-2 rounded-xl text-left hover:bg-fill active:bg-fill">
                        <IconoLista e={e} />
                        <span className="flex-1 truncate text-[15px] font-semibold text-foreground">{e.nombre}</span>
                        <span className="text-[13px] text-muted-foreground tabular-nums">{e.lista!.canciones.length}</span>
                    </button>
                ))}
                <button onClick={onNueva} className="w-full h-12 flex items-center gap-2.5 px-2 rounded-xl text-left text-[15px] font-semibold text-foreground hover:bg-fill active:bg-fill">
                    <span className="h-8 w-8 shrink-0 rounded-[10px] bg-fill flex items-center justify-center"><Plus className="h-4 w-4" /></span>
                    Nueva lista
                </button>
            </div>
        </Hoja>
    );
}

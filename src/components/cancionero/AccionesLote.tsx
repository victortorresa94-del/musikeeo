import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { BotonHoja, Hoja } from './Hoja';
import { cancioneroService } from '../../services/cancioneroService';
import { cambiarGrupo, gruposDe } from '../../lib/grupos';
import { useCancionero } from '../../hooks/useCancionero';

const contar = (n: number) => `${n} ${n === 1 ? 'canción' : 'canciones'}`;

// Con las canciones elegidas: ponerlas en un grupo, quitarlas de uno o borrarlas. Borrar pide
// confirmar con el número y, si alguna está en un repertorio, deja elegir qué hacer
export function AccionesLote({ abierta, onCerrar, elegidas, onHecho }: {
    abierta: boolean; onCerrar: () => void; elegidas: string[]; onHecho: () => void;
}) {
    const { canciones, repertorios } = useCancionero();
    const [paso, setPaso] = useState<'menu' | 'poner' | 'quitar' | 'borrar'>('menu');
    const [nuevo, setNuevo] = useState('');
    const [antes, setAntes] = useState(false);
    if (abierta !== antes) { setAntes(abierta); if (abierta) { setPaso('menu'); setNuevo(''); } }

    const sel = useMemo(() => { const s = new Set(elegidas); return canciones.filter(c => s.has(c.id)); }, [canciones, elegidas]);
    const todosGrupos = useMemo(() => [...new Set(canciones.flatMap(gruposDe))].sort((a, b) => a.localeCompare(b, 'es')), [canciones]);
    const gruposSel = useMemo(() => [...new Set(sel.flatMap(gruposDe))].sort((a, b) => a.localeCompare(b, 'es')), [sel]);
    // Las elegidas que están en algún repertorio, y en cuáles
    const enRepertorios = useMemo(() => {
        const ids = new Set(elegidas);
        return repertorios.map(r => ({ r, n: r.canciones.filter(c => ids.has(c)).length })).filter(x => x.n > 0);
    }, [repertorios, elegidas]);
    const nEnRep = useMemo(() => { const en = new Set(repertorios.flatMap(r => r.canciones)); return elegidas.filter(id => en.has(id)).length; }, [repertorios, elegidas]);

    const hecho = () => { onHecho(); onCerrar(); };
    const borrar = (quitarDeRepertorios: boolean) => {
        const { borradas, deshacer } = cancioneroService.borrarCanciones(elegidas, quitarDeRepertorios);
        toast.success(`${contar(borradas)} borradas`, { action: { label: 'Deshacer', onClick: deshacer }, duration: 8000 });
        hecho();
    };
    const fila = 'w-full min-h-12 px-4 py-2 flex items-center gap-2.5 text-left text-[15px] text-foreground active:bg-fill-strong';

    return (
        <Hoja abierta={abierta} onCerrar={onCerrar} titulo={`${contar(elegidas.length)} elegidas`}
            izquierda={paso !== 'menu' ? <BotonHoja onClick={() => setPaso('menu')}>Atrás</BotonHoja> : undefined}
            derecha={<BotonHoja fuerte onClick={onCerrar}>Cerrar</BotonHoja>}>
            <div className="px-4 pb-5">
                {paso === 'menu' && (
                    <div className="rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                        <button onClick={() => setPaso('poner')} className={fila}><Plus className="h-[18px] w-[18px]" /> Poner en un grupo…</button>
                        <button onClick={() => setPaso('quitar')} disabled={!gruposSel.length} className={`${fila} disabled:opacity-40`}><Minus className="h-[18px] w-[18px]" /> Quitar de un grupo…</button>
                        <button onClick={() => setPaso('borrar')} className={`${fila} text-destructive`}><Trash2 className="h-[18px] w-[18px]" /> Borrar {contar(elegidas.length)}</button>
                    </div>
                )}
                {paso === 'poner' && (
                    <div className="space-y-2">
                        <div className="rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                            {todosGrupos.map(g => <button key={g} onClick={() => { cambiarGrupo(sel, g, true); hecho(); }} className={fila}>{g}</button>)}
                        </div>
                        <form onSubmit={e => { e.preventDefault(); if (nuevo.trim()) { cambiarGrupo(sel, nuevo.trim(), true); hecho(); } }} className="flex gap-2">
                            <input value={nuevo} onChange={e => setNuevo(e.target.value)} placeholder="Grupo nuevo" aria-label="Grupo nuevo"
                                className="flex-1 min-w-0 h-11 px-4 rounded-full bg-fill text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none" />
                            <button type="submit" disabled={!nuevo.trim()} className="pulsable h-11 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold disabled:opacity-40">Poner</button>
                        </form>
                    </div>
                )}
                {paso === 'quitar' && (
                    <div className="rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                        {gruposSel.map(g => (
                            <button key={g} onClick={() => { cambiarGrupo(sel, g, false); hecho(); }} className={fila}>
                                Quitar de {g} <span className="ml-auto text-[13px] text-muted-foreground">{sel.filter(c => gruposDe(c).includes(g)).length}</span>
                            </button>
                        ))}
                    </div>
                )}
                {paso === 'borrar' && (
                    <div className="space-y-3">
                        <p className="text-[15px] text-foreground">¿Borrar {contar(elegidas.length)}? Se pueden recuperar con «Deshacer» justo después.</p>
                        {nEnRep > 0 && (
                            <p className="rounded-2xl bg-pastel-melocoton px-4 py-3 text-[14px] text-pastel-melocoton-ink">
                                {nEnRep} {nEnRep === 1 ? 'está' : 'están'} en {enRepertorios.map(x => `${x.r.nombre} (${x.n})`).join(', ')}.
                            </p>
                        )}
                        {nEnRep > 0 ? (
                            <>
                                <button onClick={() => borrar(false)} className="pulsable w-full h-[52px] rounded-[14px] bg-fill text-foreground font-semibold text-[15px]">
                                    Borrar solo las que no están en un repertorio ({elegidas.length - nEnRep})
                                </button>
                                <button onClick={() => borrar(true)} className="pulsable w-full h-[52px] rounded-[14px] bg-destructive text-destructive-foreground font-semibold text-[15px]">
                                    Borrar las {elegidas.length} y quitarlas de los repertorios
                                </button>
                            </>
                        ) : (
                            <button onClick={() => borrar(false)} className="pulsable w-full h-[52px] rounded-[14px] bg-destructive text-destructive-foreground font-semibold text-[15px]">
                                Borrar {contar(elegidas.length)}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </Hoja>
    );
}

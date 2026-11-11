import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronRight, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { iconoRepertorio, pastelDe } from './estilo';
import { BotonHoja, Hoja } from './Hoja';

const fechaCorta = (f: string) => {
    const [a, m, d] = f.split('-').map(Number);
    return a ? new Date(a, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
};

// Las canciones elegidas en la biblioteca, a un repertorio que ya existe (al final, sin
// repetir) o a uno nuevo con su nombre y su fecha
export function AnadirARepertorio({ abierta, onCerrar, ids, onHecho }: {
    abierta: boolean; onCerrar: () => void; ids: string[]; onHecho: () => void;
}) {
    const navigate = useNavigate();
    const { repertorios, guardarRepertorio, crearRepertorio } = useCancionero();
    const [nuevo, setNuevo] = useState('');
    const [fecha, setFecha] = useState(() => new Date().toLocaleDateString('sv-SE'));
    const hoy = new Date().toLocaleDateString('sv-SE');
    // Primero los bolos que vienen (el más cercano arriba) y luego los pasados
    const lista = useMemo(() => {
        const futuros = repertorios.filter(r => r.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
        const pasados = repertorios.filter(r => r.fecha < hoy).sort((a, b) => b.fecha.localeCompare(a.fecha));
        return [...futuros, ...pasados];
    }, [repertorios, hoy]);

    const terminar = (id: string, nombre: string, anadidas: number) => {
        onHecho();
        onCerrar();
        toast.success(anadidas ? `${anadidas} ${anadidas === 1 ? 'canción' : 'canciones'} en «${nombre}»` : `Ya estaban en «${nombre}»`, {
            action: { label: 'Abrir', onClick: () => navigate(`/cancionero/repertorio/${id}`) },
        });
    };

    const aExistente = (id: string) => {
        const r = repertorios.find(x => x.id === id);
        if (!r) return;
        const faltan = ids.filter(x => !r.canciones.includes(x));
        if (faltan.length) guardarRepertorio({ ...r, canciones: [...r.canciones, ...faltan] });
        terminar(r.id, r.nombre, faltan.length);
    };

    const aNuevo = () => {
        const r = crearRepertorio(nuevo.trim() || `Bolo ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`, ids);
        if (fecha && fecha !== r.fecha) guardarRepertorio({ ...r, fecha });
        setNuevo('');
        terminar(r.id, r.nombre, ids.length);
    };

    return (
        <Hoja abierta={abierta} onCerrar={onCerrar} titulo={`Añadir ${ids.length} ${ids.length === 1 ? 'canción' : 'canciones'}`}
            izquierda={<BotonHoja onClick={onCerrar}>Cancelar</BotonHoja>}>
            <div className="px-4 pb-4">
                <div className="rounded-2xl bg-fill p-3">
                    <p className="px-1 text-[13px] font-semibold text-muted-foreground">Repertorio nuevo</p>
                    <input value={nuevo} onChange={e => setNuevo(e.target.value.slice(0, 120))} placeholder="Nombre (p. ej. RTF Pallejà · Lady Jarana)"
                        aria-label="Nombre del repertorio nuevo" onKeyDown={e => { if (e.key === 'Enter') aNuevo(); }}
                        className="mt-2 w-full h-11 rounded-xl bg-sheet px-3 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none" />
                    <div className="mt-2 flex items-center gap-2">
                        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} aria-label="Fecha del bolo"
                            className="h-11 flex-1 rounded-xl bg-sheet px-3 text-[16px] text-foreground focus:outline-none" />
                        <button onClick={aNuevo} className="pulsable h-11 px-4 rounded-xl bg-primary text-primary-foreground text-[15px] font-semibold flex items-center gap-1">
                            <Plus className="h-4 w-4" /> Crear
                        </button>
                    </div>
                </div>

                {lista.length > 0 && (
                    <>
                        <p className="mt-5 mb-1.5 px-1 text-[13px] font-semibold text-muted-foreground">O al final de uno que ya tienes</p>
                        <div className="rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                            {lista.map(r => {
                                const ya = ids.every(x => r.canciones.includes(x));
                                return (
                                    <button key={r.id} onClick={() => aExistente(r.id)} className="w-full flex items-center gap-3 px-3 min-h-[60px] py-2 text-left active:bg-fill-strong">
                                        <span className={cn('h-10 w-10 shrink-0 rounded-[11px] flex items-center justify-center', pastelDe(r.id).fondo)}>
                                            <img src={iconoRepertorio(r.nombre)} alt="" loading="lazy" className="h-8 w-8 object-contain" />
                                        </span>
                                        <span className="flex-1 min-w-0">
                                            <span className="block truncate text-[15.5px] font-semibold text-foreground">{r.nombre}</span>
                                            <span className="block truncate text-[13px] text-muted-foreground">
                                                {fechaCorta(r.fecha)} · {r.canciones.length} {r.canciones.length === 1 ? 'tema' : 'temas'}{ya ? ' · ya están' : ''}
                                            </span>
                                        </span>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </Hoja>
    );
}

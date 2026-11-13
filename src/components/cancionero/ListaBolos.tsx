import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronRight, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';

// Los bolos, encima de los repertorios (13-nov): los que vienen primero, los pasados plegados
export function ListaBolos() {
    const { bolos, crearBolo } = useCancionero();
    const navigate = useNavigate();
    const [verPasados, setVerPasados] = useState(false);
    const hoy = new Date().toLocaleDateString('sv-SE');
    const proximos = bolos.filter(b => !b.fecha || b.fecha >= hoy).sort((a, b) => (a.fecha || '9').localeCompare(b.fecha || '9'));
    const pasados = bolos.filter(b => b.fecha && b.fecha < hoy).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const nuevo = () => navigate(`/cancionero/bolo/${crearBolo({ titulo: 'Bolo nuevo' }).id}`);
    const fecha = (f: string) => {
        const [a, m, d] = f.split('-').map(Number);
        return a ? new Date(a, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Sin fecha';
    };
    const fila = (b: (typeof bolos)[number]) => (
        <Link key={b.id} to={`/cancionero/bolo/${b.id}`} className="flex items-center gap-3 px-4 min-h-[64px] py-2 active:bg-fill-strong">
            <span className="h-11 w-11 shrink-0 rounded-[12px] bg-pastel-rosa text-pastel-rosa-ink flex flex-col items-center justify-center leading-none">
                {b.fecha ? <>
                    <span className="text-[17px] font-bold">{Number(b.fecha.slice(8, 10))}</span>
                    <span className="mt-0.5 text-[10.5px] font-bold uppercase">{new Date(`${b.fecha}T12:00:00`).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}</span>
                </> : <CalendarDays className="h-5 w-5" />}
            </span>
            <span className="flex-1 min-w-0">
                <span className="block truncate text-[16px] font-semibold text-foreground">{b.titulo}</span>
                <span className="block truncate text-[14px] text-muted-foreground first-letter:uppercase">
                    {[fecha(b.fecha), b.lugar, b.sets.length ? `${b.sets.length} ${b.sets.length === 1 ? 'set' : 'sets'}` : ''].filter(Boolean).join(' · ')}
                </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
    );
    return (
        <section className="mb-5" aria-labelledby="titulo-bolos">
            <div className="mb-2 flex items-center justify-between gap-2">
                <h3 id="titulo-bolos" className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Bolos</h3>
                <button onClick={nuevo} className="pulsable h-9 pl-2.5 pr-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1">
                    <Plus className="h-4 w-4" /> Nuevo bolo
                </button>
            </div>
            {bolos.length === 0 ? (
                <p className="rounded-2xl bg-fill px-4 py-3 text-[14.5px] text-muted-foreground">
                    Un bolo junta el repertorio, el horario, el lugar y a quién llamar, en un enlace para tus músicos.
                </p>
            ) : (
                <div className="rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                    {proximos.map(fila)}
                    {pasados.length > 0 && (
                        <button onClick={() => setVerPasados(v => !v)} aria-expanded={verPasados} className="w-full flex items-center gap-3 px-4 min-h-[52px] text-left active:bg-fill-strong">
                            <span className="flex-1 text-[15px] font-semibold text-foreground">Pasados <span className="text-muted-foreground">· {pasados.length}</span></span>
                            <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', verPasados && 'rotate-90')} />
                        </button>
                    )}
                    {verPasados && pasados.map(fila)}
                </div>
            )}
        </section>
    );
}

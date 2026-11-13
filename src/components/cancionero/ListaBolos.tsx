import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronRight, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ICONO } from './estilo';
import { useCancionero } from '../../hooks/useCancionero';

// Los bolos, su propia vista del Cancionero (13-nov): los que vienen primero, los pasados plegados
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
        <section aria-label="Bolos">
            {bolos.length === 0 ? (
                <div className="rounded-[22px] bg-pastel-rosa p-5 md:p-7">
                    <img src={ICONO.bolos} alt="" className="h-16 w-16 object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.16)]" />
                    <p className="mt-3 font-heading text-[20px] font-bold leading-snug text-foreground">Todo el bolo, en un enlace</p>
                    <p className="mt-1 text-[15px] text-muted-foreground">Junta los sets, el horario, el lugar y a quién llamar. Tus músicos lo abren sin cuenta.</p>
                    <button onClick={nuevo} className="pulsable mt-4 h-[52px] px-5 rounded-[14px] bg-primary text-primary-foreground text-[16px] font-semibold flex items-center gap-1.5">
                        <Plus className="h-5 w-5" /> Crear un bolo
                    </button>
                </div>
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

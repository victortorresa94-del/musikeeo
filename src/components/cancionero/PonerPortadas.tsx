import { useMemo, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { ImagePlus, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { admitePortada, esCancelada, motivoDe, portadaDe, type CancionCatalogo, type MotivoFallo } from '../../lib/buscarCanciones';
import { useCancionero } from '../../hooks/useCancionero';
import { almacenCanciones, cancioneroService } from '../../services/cancioneroService';
import type { Cancion } from '../../types/cancionero';

// Las que ya se buscaron y no tenían una clara: no se vuelven a buscar (salvo que cambies el
// título o el artista). Solo en este dispositivo
const CLAVE_PROBADAS = 'musikeeo-portadas-probadas-v1';
const huella = (c: Cancion) => `${c.titulo}|${c.artista}`;
function leerProbadas(): Record<string, string> {
    try { return JSON.parse(localStorage.getItem(CLAVE_PROBADAS) || '{}') ?? {}; } catch { return {}; }
}
function guardarProbadas(p: Record<string, string>) {
    try { localStorage.setItem(CLAVE_PROBADAS, JSON.stringify(p)); } catch { /* sin almacenamiento */ }
}

// Una sola búsqueda a la vez en toda la app: sigue aunque abras una canción mientras tanto, y
// al volver el botón sabe que está en marcha (no se lanza otra)
let corriendo = false;
let probadasAqui: Record<string, string> | null = null;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach(f => f());
const suscribir = (f: () => void) => { oyentes.add(f); return () => { oyentes.delete(f); }; };
const estaCorriendo = () => corriendo;
const probadas = () => (probadasAqui ??= leerProbadas());

const esperar = (ms: number, signal: AbortSignal) => new Promise<void>(fin => {
    if (ms <= 0 || signal.aborted) { fin(); return; }
    const t = setTimeout(fin, ms);
    signal.addEventListener('abort', () => { clearTimeout(t); fin(); }, { once: true });
});

const RITMO = 340;                          // unas 3 búsquedas por segundo
const RITMO_LENTO = 3000;                   // si Apple pide una pausa (deja unas 20 por minuto)
const PAUSAS = [5000, 15000, 30000];        // lo que se espera tras cada «pausa» seguida; luego se deja

// Busca la portada, la duración y la muestra de esas canciones, de una en una, y lo guarda
// todo de una vez al final. Solo se queda con las que coinciden de verdad (título y artista)
async function ponerPortadas(lista: Cancion[]) {
    if (corriendo || !lista.length) return;
    const total = lista.length;
    const parar = new AbortController();
    corriendo = true;
    avisar();
    // El aviso no se quita deslizando: al acabar dice cuántas se pusieron. «Parar» lo deja
    // abierto (preventDefault) para contarlo
    const id = toast.loading(`Buscando portadas… 0 de ${total}`, {
        dismissible: false,
        action: { label: 'Parar', onClick: e => { e.preventDefault(); parar.abort(); } },
    });

    const encontradas = new Map<string, CancionCatalogo>();
    const nuevasProbadas = { ...probadas() };
    let pausa = RITMO, ocupado = 0, fallos = 0, i = 0, sinClara = 0;
    let corte: MotivoFallo | null = null;
    while (i < total && !parar.signal.aborted) {
        const c = lista[i];
        const inicio = Date.now();
        try {
            const r = await portadaDe(c.titulo, c.artista, { signal: parar.signal });
            if (r) encontradas.set(c.id, r);
            else { nuevasProbadas[c.id] = huella(c); sinClara++; }
            i++;
            ocupado = 0;
            fallos = 0;
            toast.loading(`Buscando portadas… ${i} de ${total}`, { id });
        } catch (e) {
            if (parar.signal.aborted || esCancelada(e)) break;
            const motivo = motivoDe(e);
            if (motivo === 'sin-conexion') { corte = motivo; break; }
            if (motivo === 'ocupado') {
                // Apple pide una pausa: se espera y se sigue más despacio; si insiste, se deja
                if (ocupado >= PAUSAS.length) { corte = motivo; break; }
                pausa = RITMO_LENTO;
                toast.loading(`Buscando portadas… ${i} de ${total}`, { id, description: 'Apple pide ir más despacio: esperando un momento.' });
                await esperar(PAUSAS[ocupado++], parar.signal);
                toast.loading(`Buscando portadas… ${i} de ${total}`, { id, description: undefined });
                continue;
            }
            // Un fallo raro con esta: se salta. Si fallan varias seguidas, el catálogo no va
            if (++fallos >= 3) { corte = motivo; break; }
            i++;
        }
        await esperar(pausa - (Date.now() - inicio), parar.signal);
    }

    // Una sola escritura, encima de la versión más reciente de cada una (sin pisar lo que se
    // haya cambiado mientras tanto, ni una portada que se haya puesto por otro lado)
    const cambios = almacenCanciones.estado().items.flatMap(c => {
        const r = encontradas.get(c.id);
        if (!r || c.portada) return [];
        return [{ ...c, portada: r.portada, duracion: c.duracion ?? r.duracion, muestra: c.muestra ?? r.muestra }];
    });
    cancioneroService.guardarVarias(cambios);
    guardarProbadas(nuevasProbadas);
    probadasAqui = nuevasProbadas;
    corriendo = false;
    avisar();

    const n = cambios.length;
    const hechas = n ? `${n} ${n === 1 ? 'portada puesta' : 'portadas puestas'}` : 'Ninguna portada nueva';
    const porQue = corte === 'ocupado' ? 'Apple pide una pausa: vuelve a pulsar en un par de minutos para las que faltan.'
        : corte === 'sin-conexion' ? 'Sin cobertura: las que faltan, cuando vuelva la conexión.'
            : corte ? 'El catálogo no responde: las que faltan, más tarde.'
                : parar.signal.aborted ? 'Parado. Las que faltan, cuando quieras.'
                    : !n ? 'Ninguna coincide de verdad (título y artista) con el catálogo.' : null;
    if (!porQue) {
        toast.success(hechas, {
            id, action: undefined, dismissible: true, duration: 6000,
            description: sinClara > 0 ? `${sinClara} sin una coincidencia clara: se quedan con sus iniciales.` : undefined,
        });
    } else {
        // Un aviso «cargando» no se puede pasar a uno normal (seguiría dando vueltas): se cambia
        toast.dismiss(id);
        toast(hechas, { description: porQue, duration: 7000 });
    }
}

// Un toque: portadas para las canciones que no tienen. Solo se ve si a alguna le falta y se
// puede buscar (con artista y sin ser una mezcla del setlist)
export function PonerPortadas({ className }: { className?: string }) {
    const { canciones } = useCancionero();
    const enMarcha = useSyncExternalStore(suscribir, estaCorriendo);
    const yaProbadas = useSyncExternalStore(suscribir, probadas);

    const pendientes = useMemo(
        () => canciones.filter(c => !c.portada && admitePortada(c) && yaProbadas[c.id] !== huella(c)),
        [canciones, yaProbadas],
    );
    if (!pendientes.length && !enMarcha) return null;

    return (
        <button type="button" onClick={() => void ponerPortadas(pendientes)} disabled={enMarcha}
            className={cn('pulsable h-9 pl-3 pr-3.5 shrink-0 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5 disabled:opacity-60', className)}>
            {enMarcha ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {enMarcha ? 'Poniendo portadas…' : `Poner portadas · ${pendientes.length}`}
        </button>
    );
}

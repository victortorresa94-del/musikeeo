import { useMemo, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { Loader2, Timer } from 'lucide-react';
import { cn } from '../../lib/utils';
import { admitePortada, esCancelada, motivoDe, portadaDe, type MotivoFallo } from '../../lib/buscarCanciones';
import { descodificar } from '../../lib/sacarAcordes';
import type { TempoEscuchado } from '../../lib/tempo';
import { useCancionero } from '../../hooks/useCancionero';
import { almacenCanciones, cancioneroService } from '../../services/cancioneroService';
import type { Cancion } from '../../types/cancionero';

// El tempo (bpm) y la duración de cada canción sin teclearlos: la duración la da el catálogo de
// Apple y el tempo lo saca el móvil escuchando la muestra de 30 s con el motor de «Sacar
// acordes». Solo se guarda un tempo si las dos mitades de la muestra dicen lo mismo; si no, se
// deja vacío (se puede marcar a toques en la ficha). Nunca pisa lo que ya tenga la canción.

// Las que ya se probaron sin sacar nada: no se vuelven a probar (salvo que cambie el título o el
// artista). Solo en este dispositivo
const CLAVE_PROBADAS = 'musikeeo-tempo-probadas-v1';
const huella = (c: Cancion) => `${c.titulo}|${c.artista}`;
function leerProbadas(): Record<string, string> {
    try { return JSON.parse(localStorage.getItem(CLAVE_PROBADAS) || '{}') ?? {}; } catch { return {}; }
}
function guardarProbadas(p: Record<string, string>) {
    try { localStorage.setItem(CLAVE_PROBADAS, JSON.stringify(p)); } catch { /* sin almacenamiento */ }
}

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

const RITMO = 1200;                         // con escucha: una canción cada ~1-2 s
const RITMO_LENTO = 3000;
const PAUSAS = [5000, 15000, 30000];

// Le falta algo que se puede sacar del catálogo
const faltaTempo = (c: Cancion) => (!c.bpm || !c.duracion) && admitePortada(c);

let worker: Worker | null = null;
function tempoAparte(muestras: Float32Array, sr: number): Promise<TempoEscuchado> {
    worker ??= new Worker(new URL('../../workers/tempo.worker.ts', import.meta.url), { type: 'module' });
    const w = worker;
    return new Promise((ok, mal) => {
        w.onmessage = (e: MessageEvent<{ tipo: 'listo'; tempo: TempoEscuchado } | { tipo: 'error'; mensaje: string }>) =>
            e.data.tipo === 'listo' ? ok(e.data.tempo) : mal(new Error(e.data.mensaje));
        w.onerror = e => mal(new Error(e.message || 'No se ha podido escuchar la muestra.'));
        w.postMessage({ muestras, sr }, [muestras.buffer]);
    });
}

// El tempo de la muestra, o null si no se puede (sin muestra, el navegador no la lee…)
async function tempoDeMuestra(url: string, signal: AbortSignal): Promise<number | null> {
    try {
        const r = await fetch(url, { signal });
        if (!r.ok) return null;
        const { muestras, sr } = await descodificar(await r.arrayBuffer());
        const t = await tempoAparte(muestras, sr);
        return t.fiable ? t.bpm : null;
    } catch (e) {
        if (signal.aborted || esCancelada(e)) throw e;
        return null;
    }
}

interface Hallazgo { bpm?: number; duracion?: number; muestra?: string; portada?: string }

async function ponerTempo(lista: Cancion[]) {
    if (corriendo || !lista.length) return;
    const total = lista.length;
    const parar = new AbortController();
    corriendo = true;
    avisar();
    const id = toast.loading(`Sacando tempo y duración… 0 de ${total}`, {
        dismissible: false,
        action: { label: 'Parar', onClick: e => { e.preventDefault(); parar.abort(); } },
    });

    const hallazgos = new Map<string, Hallazgo>();
    const nuevasProbadas = { ...probadas() };
    let pausa = RITMO, ocupado = 0, fallos = 0, i = 0, sinTempo = 0;
    let corte: MotivoFallo | null = null;
    while (i < total && !parar.signal.aborted) {
        const c = lista[i];
        const inicio = Date.now();
        try {
            const h: Hallazgo = {};
            let muestra = c.muestra;
            // Sin muestra o sin duración: se busca en el catálogo (título y artista de verdad)
            if (!muestra || !c.duracion) {
                const r = await portadaDe(c.titulo, c.artista, { signal: parar.signal });
                if (r) { h.duracion = r.duracion; h.muestra = r.muestra; h.portada = r.portada; muestra ??= r.muestra; }
            }
            if (!c.bpm && muestra) {
                const bpm = await tempoDeMuestra(muestra, parar.signal);
                if (bpm) h.bpm = bpm;
            }
            if (!c.bpm && !h.bpm) sinTempo++;
            if (h.bpm || h.duracion) hallazgos.set(c.id, h);
            else nuevasProbadas[c.id] = huella(c);
            i++;
            ocupado = 0;
            fallos = 0;
            toast.loading(`Sacando tempo y duración… ${i} de ${total}`, { id });
        } catch (e) {
            if (parar.signal.aborted || esCancelada(e)) break;
            const motivo = motivoDe(e);
            if (motivo === 'sin-conexion') { corte = motivo; break; }
            if (motivo === 'ocupado') {
                if (ocupado >= PAUSAS.length) { corte = motivo; break; }
                pausa = RITMO_LENTO;
                toast.loading(`Sacando tempo y duración… ${i} de ${total}`, { id, description: 'Apple pide ir más despacio: esperando un momento.' });
                await esperar(PAUSAS[ocupado++], parar.signal);
                toast.loading(`Sacando tempo y duración… ${i} de ${total}`, { id, description: undefined });
                continue;
            }
            if (++fallos >= 3) { corte = motivo; break; }
            i++;
        }
        await esperar(pausa - (Date.now() - inicio), parar.signal);
    }

    // Una sola escritura, sobre la versión más reciente y sin pisar nada que ya tenga
    let conTempo = 0, conDuracion = 0;
    const cambios = almacenCanciones.estado().items.flatMap(c => {
        const h = hallazgos.get(c.id);
        if (!h) return [];
        const bpm = c.bpm ?? h.bpm, duracion = c.duracion ?? h.duracion;
        if (bpm === c.bpm && duracion === c.duracion) return [];
        if (!c.bpm && bpm) conTempo++;
        if (!c.duracion && duracion) conDuracion++;
        return [{ ...c, bpm, duracion, muestra: c.muestra ?? h.muestra, portada: c.portada ?? h.portada }];
    });
    cancioneroService.guardarVarias(cambios);
    guardarProbadas(nuevasProbadas);
    probadasAqui = nuevasProbadas;
    corriendo = false;
    avisar();

    const hechas = conTempo || conDuracion
        ? [conTempo && `${conTempo} con tempo`, conDuracion && `${conDuracion} con duración`].filter(Boolean).join(' y ')
        : 'Nada nuevo';
    const porQue = corte === 'ocupado' ? 'Apple pide una pausa: vuelve a pulsar en un par de minutos para las que faltan.'
        : corte === 'sin-conexion' ? 'Sin cobertura: las que faltan, cuando vuelva la conexión.'
            : corte ? 'El catálogo no responde: las que faltan, más tarde.'
                : parar.signal.aborted ? 'Parado. Las que faltan, cuando quieras.' : null;
    const nota = sinTempo ? `${sinTempo} sin un tempo claro: márcalo a toques en su ficha si lo quieres.` : undefined;
    if (!porQue) toast.success(hechas, { id, action: undefined, dismissible: true, duration: 7000, description: nota });
    else { toast.dismiss(id); toast(hechas, { description: porQue, duration: 7000 }); }
}

// Un toque: tempo y duración para las que no los tienen (con artista, sin ser mezclas)
export function PonerTempo({ className }: { className?: string }) {
    const { canciones } = useCancionero();
    const enMarcha = useSyncExternalStore(suscribir, estaCorriendo);
    const yaProbadas = useSyncExternalStore(suscribir, probadas);
    const pendientes = useMemo(() => canciones.filter(c => faltaTempo(c) && yaProbadas[c.id] !== huella(c)), [canciones, yaProbadas]);
    if (!pendientes.length && !enMarcha) return null;
    return (
        <button type="button" onClick={() => void ponerTempo(pendientes)} disabled={enMarcha}
            className={cn('pulsable h-9 pl-3 pr-3.5 shrink-0 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5 disabled:opacity-60', className)}>
            {enMarcha ? <Loader2 className="h-4 w-4 animate-spin" /> : <Timer className="h-4 w-4" />}
            {enMarcha ? 'Sacando tempo…' : `Poner tempo y duración · ${pendientes.length}`}
        </button>
    );
}

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ENERGIAS, ESTADOS, opcionesDe } from '../../lib/biblioteca';
import type { Cancion, EstadoCancion, FichaCancion } from '../../types/cancionero';
import { ICONO } from './estilo';

const chip = (activo: boolean) => cn('pulsable h-9 shrink-0 rounded-full px-3.5 text-[14px] font-semibold flex items-center gap-1 whitespace-nowrap',
    activo ? 'bg-foreground text-background' : 'bg-sheet text-foreground');

// Elegir entre lo que ya usas (quién canta, grupos, estilos) o escribir uno nuevo
function Elegir({ valores, elegidos, onAlternar, nuevo, multiple }: {
    valores: string[]; elegidos: string[]; onAlternar: (v: string) => void; nuevo: string; multiple?: boolean;
}) {
    const [escribiendo, setEscribiendo] = useState(false);
    const [texto, setTexto] = useState('');
    const todos = [...new Set([...valores, ...elegidos])];
    const meter = () => {
        const v = texto.trim().slice(0, 40);
        if (v && !elegidos.includes(v)) onAlternar(v);
        setTexto('');
        setEscribiendo(false);
    };
    return (
        <div className="flex flex-wrap gap-2">
            {todos.map(v => (
                <button key={v} type="button" onClick={() => onAlternar(v)} aria-pressed={elegidos.includes(v)} className={chip(elegidos.includes(v))}>{v}</button>
            ))}
            {escribiendo ? (
                <input autoFocus value={texto} onChange={e => setTexto(e.target.value)} onBlur={meter} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); meter(); } }}
                    placeholder={nuevo} aria-label={nuevo} className="h-9 w-40 rounded-full bg-sheet px-3.5 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            ) : (
                <button type="button" onClick={() => setEscribiendo(true)} aria-label={nuevo} className={cn(chip(false), 'text-muted-foreground')}>
                    <Plus className="h-4 w-4" /> {multiple || !todos.length ? nuevo : 'Otro'}
                </button>
            )}
        </div>
    );
}

function Campo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="mb-1.5 text-[13px] font-semibold text-muted-foreground">{titulo}</p>
            {children}
        </div>
    );
}

// La ficha del tema: lo que hace falta para elegirlo para un repertorio (tono, quién canta,
// grupo, estilo, energía, estado) y la claqueta. Lo que ya usas en otras canciones sale para tocar
export function EditorFicha({ ficha, onCambio, canciones, tonoDetectado, bpm, onBpm }: {
    ficha: FichaCancion;
    onCambio: (f: FichaCancion) => void;
    canciones: Cancion[];
    tonoDetectado?: string | null;
    bpm?: number;
    onBpm: (n: number | undefined) => void;
}) {
    const valores = useMemo(() => ({
        canta: opcionesDe(canciones, 'canta', () => null).map(o => o.valor),
        proyectos: opcionesDe(canciones, 'proyectos', () => null).map(o => o.valor),
        estilos: opcionesDe(canciones, 'estilos', () => null).map(o => o.valor),
    }), [canciones]);
    const poner = (cambio: Partial<FichaCancion>) => onCambio({ ...ficha, ...cambio });
    // El tempo se escribe a gusto y se da por bueno al salir (si no, «1» de «120» lo borraba)
    const [tempo, setTempo] = useState(bpm ? String(bpm) : '');
    const fijarTempo = () => { const n = parseInt(tempo, 10); onBpm(n >= 30 && n <= 260 ? n : undefined); if (!(n >= 30 && n <= 260)) setTempo(''); };
    const unico = (actual: string | undefined, v: string) => (actual === v ? undefined : v);

    return (
        <div id="ficha" className="rounded-[22px] bg-fill p-4 space-y-4">
            <div className="flex items-center gap-2">
                <img src={ICONO.repertorios} alt="" aria-hidden className="h-10 w-10 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.14)]" />
                <div>
                    <p className="text-[17px] font-bold leading-tight text-foreground">Ficha del tema</p>
                    <p className="text-[13px] text-muted-foreground">Para buscarla y elegirla para un repertorio</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Campo titulo="Tono en que suena">
                    <input value={ficha.tono ?? ''} onChange={e => poner({ tono: e.target.value.replace(/\s+/g, '').slice(0, 12) || undefined })}
                        placeholder={tonoDetectado ?? 'Bm'} aria-label="Tono en que suena" autoCapitalize="characters"
                        className="w-full h-11 rounded-xl bg-sheet px-3 text-[16px] font-bold text-foreground placeholder:text-muted-foreground placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-foreground/10" />
                </Campo>
                <Campo titulo="Capo / formas">
                    <input value={ficha.capo ?? ''} onChange={e => poner({ capo: e.target.value.slice(0, 60) || undefined })}
                        placeholder="Capo 2 · formas de Am" aria-label="Capo y formas"
                        className="w-full h-11 rounded-xl bg-sheet px-3 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
                </Campo>
            </div>
            {tonoDetectado && !ficha.tono && (
                <button type="button" onClick={() => poner({ tono: tonoDetectado })} className="-mt-2 text-[13px] font-semibold text-foreground underline underline-offset-2">
                    Por los acordes suena en {tonoDetectado}: usarlo
                </button>
            )}

            <Campo titulo="Canta">
                <Elegir valores={valores.canta} elegidos={ficha.canta ? [ficha.canta] : []} nuevo="Quién canta"
                    onAlternar={v => poner({ canta: unico(ficha.canta, v) })} />
            </Campo>
            <Campo titulo="Grupo">
                <Elegir valores={valores.proyectos} elegidos={ficha.proyectos ?? []} nuevo="Grupo o formación" multiple
                    onAlternar={v => {
                        const l = ficha.proyectos ?? [];
                        poner({ proyectos: l.includes(v) ? l.filter(x => x !== v) : [...l, v] });
                    }} />
            </Campo>
            <Campo titulo="Estilo">
                <Elegir valores={valores.estilos} elegidos={ficha.estilo ? [ficha.estilo] : []} nuevo="Estilo"
                    onAlternar={v => poner({ estilo: unico(ficha.estilo, v) })} />
            </Campo>
            <Campo titulo="Energía">
                <div className="grid grid-cols-4 gap-1.5">
                    {([1, 2, 3, 4] as const).map(n => (
                        <button key={n} type="button" onClick={() => poner({ energia: ficha.energia === n ? undefined : n })} aria-pressed={ficha.energia === n}
                            className={cn(chip(ficha.energia === n), 'justify-center px-2 text-[13px]')}>{ENERGIAS[n]}</button>
                    ))}
                </div>
            </Campo>
            <Campo titulo="Estado">
                <div className="grid grid-cols-3 gap-1.5">
                    {(Object.keys(ESTADOS) as EstadoCancion[]).map(e => (
                        <button key={e} type="button" onClick={() => poner({ estado: ficha.estado === e ? undefined : e })} aria-pressed={ficha.estado === e}
                            className={cn(chip(ficha.estado === e), 'justify-center px-2 text-[13px]')}>{ESTADOS[e]}</button>
                    ))}
                </div>
            </Campo>
            <Campo titulo="Tempo (BPM)">
                <input value={tempo} inputMode="numeric" onChange={e => setTempo(e.target.value.replace(/\D/g, '').slice(0, 3))} onBlur={fijarTempo}
                    placeholder="Para la claqueta y el modo al ritmo" aria-label="Tempo en BPM"
                    className="w-full h-11 rounded-xl bg-sheet px-3 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            </Campo>
        </div>
    );
}

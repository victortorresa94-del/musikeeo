import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { anadirParte, leerProgresion, PARTES } from '../../lib/progresion';

// Escribir los acordes por partes sin pegar la canción: eliges la parte, escribes
// «G - F - Am - C» y se añade al final con su título. Cambia de tono como el resto
export function AcordesRapidos({ texto, onCambio }: { texto: string; onCambio: (t: string) => void }) {
    const [parte, setParte] = useState<string>('Estrofa');
    const [entrada, setEntrada] = useState('');
    const { linea, malos } = leerProgresion(entrada);
    const anadir = () => {
        if (!linea || malos.length) return;
        onCambio(anadirParte(texto, parte, linea));
        setEntrada('');
        // La siguiente parte que suele venir
        const i = PARTES.indexOf(parte as (typeof PARTES)[number]);
        if (i >= 0 && i < PARTES.length - 1) setParte(PARTES[i + 1]);
    };
    const chip = (activo: boolean) => cn('pulsable h-9 px-3.5 shrink-0 rounded-full text-[14px] font-semibold',
        activo ? 'bg-foreground text-background' : 'bg-sheet text-foreground');
    return (
        <div className="mt-3 rounded-2xl bg-fill p-3">
            <p className="px-1 text-[13px] font-semibold text-muted-foreground">Acordes rápidos, por partes</p>
            <div className="mt-2 -mx-3 px-3 flex gap-1.5 overflow-x-auto hide-scrollbar" role="group" aria-label="Parte de la canción">
                {PARTES.map(p => <button key={p} type="button" onClick={() => setParte(p)} aria-pressed={parte === p} className={chip(parte === p)}>{p}</button>)}
            </div>
            <div className="mt-2 flex items-center gap-2">
                <input value={entrada} onChange={e => setEntrada(e.target.value.slice(0, 160))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); anadir(); } }}
                    placeholder="G - F - Am - C" aria-label={`Acordes de ${parte}`} autoCapitalize="characters" autoCorrect="off" spellCheck={false} enterKeyHint="done"
                    className="flex-1 min-w-0 h-11 rounded-xl bg-sheet px-3 font-mono text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
                <button type="button" onClick={anadir} disabled={!linea || malos.length > 0}
                    className="pulsable h-11 px-4 shrink-0 rounded-xl bg-foreground text-background text-[15px] font-semibold flex items-center gap-1 disabled:opacity-30">
                    <Plus className="h-4 w-4" /> Añadir
                </button>
            </div>
            <p className={cn('mt-1.5 px-1 text-[12.5px]', malos.length ? 'text-destructive' : 'text-muted-foreground')}>
                {malos.length ? `No es un acorde: ${malos.join(', ')}` : linea ? `Se añade: [${parte}] ${linea}` : 'Separa con espacios o guiones. «x2» al final si se repite.'}
            </p>
        </div>
    );
}

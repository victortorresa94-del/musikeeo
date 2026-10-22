// «Pídeselo a Rodrigo»: escribes lo que buscas y se convierte en filtros. Debajo, una línea
// suya con lo que ha entendido y los filtros como pastillas que se pueden quitar.
import { useState } from 'react';
import { ArrowUp, Loader2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Pastilla } from './filtros';

const AVATAR = '/rodrigo-persona.png';

export function CampoRodrigo({ ejemplo, ocupado, onPedir, className }: {
    ejemplo: string; ocupado: boolean; onPedir: (texto: string) => void; className?: string;
}) {
    const [texto, setTexto] = useState('');
    const enviar = (e: React.FormEvent) => {
        e.preventDefault();
        const t = texto.trim();
        if (!t || ocupado) return;
        onPedir(t);
    };
    return (
        <form onSubmit={enviar} className={cn('flex items-center gap-2.5 pl-2 pr-1.5 py-1.5 rounded-[18px] bg-card border border-hairline shadow-e1', className)}>
            <img src={AVATAR} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover bg-fill" />
            <label className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-foreground leading-tight">Pídeselo a Rodrigo</span>
                <input value={texto} onChange={e => setTexto(e.target.value)} maxLength={300} enterKeyHint="search"
                    placeholder={ejemplo} aria-label="Pídeselo a Rodrigo"
                    className="w-full bg-transparent text-[15px] leading-snug text-foreground placeholder:text-muted-foreground focus:outline-none truncate" />
            </label>
            <button type="submit" disabled={!texto.trim() || ocupado} aria-label="Pedírselo a Rodrigo"
                className="pulsable h-9 w-9 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-30">
                {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.5} />}
            </button>
        </form>
    );
}

/** La respuesta: si la ha entendido Rodrigo, su frase; si no (respaldo), «He buscado:» */
export function LineaRodrigo({ fuente, explicacion, pastillas, onQuitar, onCerrar }: {
    fuente: 'rodrigo' | 'respaldo'; explicacion: string; pastillas: Pastilla[];
    onQuitar: (p: Pastilla) => void; onCerrar: () => void;
}) {
    const deRodrigo = fuente === 'rodrigo' && !!explicacion;
    return (
        <div className="mt-2 flex gap-2.5 px-1" aria-live="polite">
            {deRodrigo && <img src={AVATAR} alt="" className="mt-0.5 h-6 w-6 shrink-0 rounded-full object-cover bg-fill" />}
            <div className="min-w-0 flex-1">
                <p className="text-[14px] leading-snug text-foreground">
                    {deRodrigo ? <><b className="font-bold">Rodrigo:</b> {explicacion}</> : <b className="font-bold">He buscado:</b>}
                </p>
                {pastillas.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {pastillas.map(p => (
                            <button key={p.clave} type="button" onClick={() => onQuitar(p)} aria-label={`Quitar ${p.texto}`}
                                className="pulsable h-8 pl-3 pr-2 rounded-full bg-foreground text-background text-[13px] font-semibold flex items-center gap-1">
                                {p.texto}<X className="h-3.5 w-3.5 opacity-70" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <button type="button" onClick={onCerrar} aria-label="Quitar lo que ha buscado Rodrigo"
                className="pulsable h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-muted-foreground">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

import { toast } from 'sonner';
import { ClipboardPaste, ExternalLink } from 'lucide-react';
import { leerAcorde, leerCancion, limpiarTexto, recortarCancion, semitonosHacia } from '../../lib/acordes';
import type { AjustesCancion, Cancion } from '../../types/cancionero';

// Lo pegado entra en lugar de la chuleta: se queda la cabecera de la ficha (bloque, avisos,
// cejilla) y la canción se mueve al tono del setlist con el cambio de tono, sin reescribirla
function unirLetra(actual: string, pegado: string, ajustes: AjustesCancion): { texto: string; semitonos: number } | null {
    const lineas = actual.split('\n');
    const corte = lineas.findIndex(l => !l.trim());
    const cabecera = corte === -1 ? lineas : lineas.slice(0, corte);
    const lineaTono = cabecera.find(l => l.startsWith('Tono: '));
    const destino = lineaTono ? leerAcorde(lineaTono.slice(6).trim().split(/\s+/)[0]) : null;
    const cancion = recortarCancion(pegado);
    if (!cancion) return null;
    const acordes = leerCancion(cancion).acordes;
    if (!acordes.length) {
        // Solo letra: va debajo de los acordes que ya había
        return { texto: `${actual.trimEnd()}\n\n[Letra]\n${limpiarTexto(pegado).trim()}`, semitonos: ajustes.semitonos };
    }
    const s = destino ? semitonosHacia(acordes, destino) : 0;
    return {
        texto: [...cabecera.filter(l => !l.startsWith('Tono: ')), '', cancion].join('\n'),
        semitonos: ajustes.semitonos + s,
    };
}

const buscar = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(`${q} acordes site:lacuerda.net`)}`;

// En una ficha o una chuleta sin letra: buscarla, copiarla y pegarla aquí
export function AnadirLetra({ cancion, ajustes, onPegar }: {
    cancion: Cancion; ajustes: AjustesCancion; onPegar: (texto: string, cambio: Partial<AjustesCancion>) => void;
}) {
    const meter = (pegado: string) => {
        const r = unirLetra(cancion.texto, pegado, ajustes);
        if (!r) { toast('Lo copiado está vacío.'); return; }
        onPegar(r.texto, { semitonos: Math.abs(r.semitonos) >= 12 ? r.semitonos % 12 : r.semitonos, ajustar: false });
    };
    const pegar = async () => {
        try {
            const t = await navigator.clipboard.readText();
            if (t.trim()) meter(t); else toast('No hay nada copiado. Copia la canción en la web y vuelve.');
        } catch {
            toast('Mantén pulsado el recuadro de abajo y elige «Pegar».');
        }
    };
    const q = `${cancion.titulo.replace(/^Mix[^:]*:\s*/i, '').split('→')[0]} ${cancion.artista}`.trim();
    return (
        <div className="mb-4 rounded-2xl bg-fill px-4 py-3">
            <p className="text-[15px] font-semibold text-foreground">Falta la letra</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
                Ábrela en LaCuerda, copia la canción (vale «Seleccionar todo») y pégala aquí: se queda en tu tono.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
                <a href={buscar(q)} target="_blank" rel="noopener noreferrer"
                    className="pulsable h-9 px-3.5 rounded-full bg-sheet text-[14px] font-semibold text-foreground flex items-center gap-1.5 shadow-e1">
                    Buscar en LaCuerda <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
                <button onClick={pegar} className="pulsable h-9 px-3.5 rounded-full bg-foreground text-background text-[14px] font-semibold flex items-center gap-1.5">
                    <ClipboardPaste className="h-4 w-4" /> Pegar aquí
                </button>
            </div>
            <textarea
                rows={1}
                placeholder="O mantén pulsado aquí y pega"
                aria-label="Pegar la canción"
                onPaste={e => { e.preventDefault(); meter(e.clipboardData.getData('text/plain')); }}
                onChange={e => { if (e.target.value.length > 40) { meter(e.target.value); e.target.value = ''; } }}
                className="mt-2 w-full resize-none rounded-xl bg-sheet px-3 py-2 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
        </div>
    );
}

import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { AudioLines, ClipboardPaste, ExternalLink } from 'lucide-react';
import { unirConFicha } from '../../lib/acordes';
import { enlaceLetra, enlacesAcordes } from '../../lib/buscarCanciones';
import { leerPortapapeles, textoPegado } from '../../lib/pegado';
import type { AjustesCancion, Cancion } from '../../types/cancionero';

// En una ficha o una chuleta sin letra: buscarla, copiarla y pegarla aquí
export function AnadirLetra({ cancion, ajustes, onPegar }: {
    cancion: Cancion; ajustes: AjustesCancion; onPegar: (texto: string, cambio: Partial<AjustesCancion>) => void;
}) {
    const meter = (pegado: string) => {
        const r = unirConFicha(cancion.texto, pegado, ajustes.semitonos);
        if (!r) { toast('Lo copiado está vacío.'); return; }
        onPegar(r.texto, { semitonos: Math.abs(r.semitonos) >= 12 ? r.semitonos % 12 : r.semitonos, ajustar: false });
    };
    const pegar = async () => {
        try {
            const t = await leerPortapapeles();
            if (t.trim()) meter(t); else toast('No hay nada copiado. Copia la canción en la web y vuelve.');
        } catch {
            toast('Mantén pulsado el recuadro de abajo y elige «Pegar».');
        }
    };
    // En una mezcla del setlist se busca el primer tema. Si la ficha guarda su página, va primero
    const titulo = cancion.titulo.replace(/^Mix[^:]*:\s*/i, '').split('→')[0].split('+')[0].trim();
    const suya = cancion.ficha?.enlace?.trim();
    const enlaces = [
        ...(suya ? [{ nombre: 'Su página', url: suya, logo: /lacuerda\./i.test(suya) ? '/images/marcas/lacuerda.png' : undefined }] : []),
        ...enlacesAcordes(titulo, cancion.artista), enlaceLetra(titulo, cancion.artista),
    ];
    // LaCuerda no deja seleccionar la canción en el móvil; el modo lector de Safari sí
    const aviso = (url: string) => {
        if (/lacuerda/i.test(url)) toast('En LaCuerda, para copiar en el iPhone', { description: 'En Safari toca «Aa» → «Mostrar lector». Ahí ya deja «Seleccionar todo» y «Copiar».', duration: 9000 });
    };
    return (
        <div className="mb-4 rounded-2xl bg-fill px-4 py-3">
            <p className="text-[15px] font-semibold text-foreground">Falta la letra</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
                Búscala en una web de acordes, copia la canción (vale «Seleccionar todo») y pégala aquí: se queda en tu tono.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
                {enlaces.map(e => (
                    <a key={e.nombre} href={e.url} target="_blank" rel="noopener noreferrer" onClick={() => aviso(e.url + e.nombre)}
                        className={`pulsable h-9 ${e.logo ? 'pl-1 pr-3' : 'px-3.5'} rounded-full bg-sheet text-[14px] font-semibold text-foreground flex items-center gap-1.5 shadow-e1`}>
                        {e.logo && <img src={e.logo} alt="" aria-hidden className="h-7 w-7 rounded-full object-cover bg-fill" />}
                        {e.nombre} <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                ))}
                <Link to={`/cancionero/escuchar?cancion=${cancion.id}`}
                    className="pulsable h-9 px-3.5 rounded-full bg-sheet text-[14px] font-semibold text-foreground flex items-center gap-1.5 shadow-e1">
                    <AudioLines className="h-4 w-4" /> Sacar de un audio
                </Link>
                <button onClick={pegar} className="pulsable h-9 px-3.5 rounded-full bg-foreground text-background text-[14px] font-semibold flex items-center gap-1.5">
                    <ClipboardPaste className="h-4 w-4" /> Pegar aquí
                </button>
            </div>
            <textarea
                rows={1}
                placeholder="O mantén pulsado aquí y pega"
                aria-label="Pegar la canción"
                onPaste={e => { e.preventDefault(); meter(textoPegado(e.clipboardData)); }}
                onChange={e => { if (e.target.value.length > 40) { meter(e.target.value); e.target.value = ''; } }}
                className="mt-2 w-full resize-none rounded-xl bg-sheet px-3 py-2 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
        </div>
    );
}

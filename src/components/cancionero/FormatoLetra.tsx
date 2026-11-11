import type { RefObject } from 'react';
import { Bold, Heading, Highlighter, Megaphone } from 'lucide-react';

// Formato ligero para la letra, que el motor de acordes respeta: **negrita**, ==resaltado==,
// «# Título» y «> Aviso» (entra la batería, enganche con…). Escribe las marcas en el texto:
// así sigue siendo texto plano y el tono, la cejilla, «que quepa» y Tocar funcionan igual
export function FormatoLetra({ areaRef, texto, onCambio }: {
    areaRef: RefObject<HTMLTextAreaElement | null>;
    texto: string;
    onCambio: (texto: string) => void;
}) {
    const aplicar = (nuevo: string, desde: number, hasta: number) => {
        onCambio(nuevo);
        requestAnimationFrame(() => {
            const a = areaRef.current;
            if (!a) return;
            a.focus();
            a.setSelectionRange(desde, hasta);
        });
    };

    // Alrededor de lo elegido (o de la palabra donde está el cursor)
    const envolver = (marca: string) => {
        const a = areaRef.current;
        if (!a) return;
        let ini = a.selectionStart, fin = a.selectionEnd;
        if (ini === fin) {
            while (ini > 0 && /\S/.test(texto[ini - 1])) ini--;
            while (fin < texto.length && /\S/.test(texto[fin])) fin++;
        }
        const dentro = texto.slice(ini, fin);
        // Ya lo lleva: se quita
        if (dentro.startsWith(marca) && dentro.endsWith(marca) && dentro.length >= marca.length * 2) {
            const limpio = dentro.slice(marca.length, -marca.length);
            aplicar(texto.slice(0, ini) + limpio + texto.slice(fin), ini, ini + limpio.length);
            return;
        }
        aplicar(texto.slice(0, ini) + marca + dentro + marca + texto.slice(fin), ini + marca.length, fin + marca.length);
    };

    // Al principio de la línea del cursor (o lo quita si ya está)
    const prefijo = (marca: string, ejemplo: string) => {
        const a = areaRef.current;
        if (!a) return;
        const ini = texto.lastIndexOf('\n', a.selectionStart - 1) + 1;
        const finLinea = texto.indexOf('\n', ini);
        const fin = finLinea === -1 ? texto.length : finLinea;
        const linea = texto.slice(ini, fin);
        if (linea.startsWith(marca)) {
            aplicar(texto.slice(0, ini) + linea.slice(marca.length) + texto.slice(fin), ini, fin - marca.length);
        } else if (!linea.trim()) {
            const nueva = marca + ejemplo;
            aplicar(texto.slice(0, ini) + nueva + texto.slice(fin), ini + marca.length, ini + nueva.length);
        } else {
            aplicar(texto.slice(0, ini) + marca + linea.replace(/^[#>]+\s*/, '') + texto.slice(fin), ini + marca.length, fin + marca.length);
        }
    };

    const boton = 'pulsable h-9 px-3 shrink-0 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5';
    // onMouseDown: el textarea no pierde lo elegido al pulsar en el ordenador
    const sinPerderFoco = (e: React.MouseEvent) => e.preventDefault();
    return (
        <div className="mb-2 -mx-4 px-4 md:mx-0 md:px-0 flex items-center gap-1.5 overflow-x-auto hide-scrollbar" role="toolbar" aria-label="Formato de la letra">
            <button type="button" onMouseDown={sinPerderFoco} onClick={() => envolver('**')} className={boton} aria-label="Negrita"><Bold className="h-4 w-4" /> Negrita</button>
            <button type="button" onMouseDown={sinPerderFoco} onClick={() => envolver('==')} className={boton} aria-label="Resaltar"><Highlighter className="h-4 w-4" /> Resaltar</button>
            <button type="button" onMouseDown={sinPerderFoco} onClick={() => prefijo('# ', 'Título')} className={boton} aria-label="Título"><Heading className="h-4 w-4" /> Título</button>
            <button type="button" onMouseDown={sinPerderFoco} onClick={() => prefijo('> ', 'Entra la batería')} className={boton} aria-label="Aviso"><Megaphone className="h-4 w-4" /> Aviso</button>
        </div>
    );
}

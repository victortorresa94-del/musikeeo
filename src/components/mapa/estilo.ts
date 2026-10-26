import { iniciales, type Papel, type PuntoMapa } from '../../lib/mapa';

// Colores del mapa por papel, solo con tokens pastel (claro y oscuro en src/index.css): el
// borde con la tinta (se ve sobre el mapa claro y sobre el oscuro) y el relleno pastel para las
// iniciales. El amarillo no sale: es solo para «Escribir» y «Aparecer en el mapa».

export const ESTILO_PAPEL: Record<Papel, { borde: string; fondo: string; tinta: string; punto: string }> = {
    musico: { borde: 'border-pastel-lavanda-ink', fondo: 'bg-pastel-lavanda', tinta: 'text-pastel-lavanda-ink', punto: 'bg-pastel-lavanda-ink' },
    tecnico: { borde: 'border-pastel-cielo-ink', fondo: 'bg-pastel-cielo', tinta: 'text-pastel-cielo-ink', punto: 'bg-pastel-cielo-ink' },
    sala: { borde: 'border-pastel-melocoton-ink', fondo: 'bg-pastel-melocoton', tinta: 'text-pastel-melocoton-ink', punto: 'bg-pastel-melocoton-ink' },
    tienda: { borde: 'border-pastel-menta-ink', fondo: 'bg-pastel-menta', tinta: 'text-pastel-menta-ink', punto: 'bg-pastel-menta-ink' },
    otro: { borde: 'border-pastel-rosa-ink', fondo: 'bg-pastel-rosa', tinta: 'text-pastel-rosa-ink', punto: 'bg-pastel-rosa-ink' },
};

/** El punto de «Ahora mismo» (disponible en este momento) */
export const PUNTO_AHORA = 'bg-pastel-menta-ink';

// ─── Marcadores para Leaflet (DOM a mano: nada de HTML con datos de otros) ──

const el = (tag: string, clase: string) => {
    const e = document.createElement(tag);
    e.className = clase;
    return e;
};

/** La burbuja de una persona: su foto (o iniciales) con el borde de su papel */
export function burbujaDOM(p: Pick<PuntoMapa, 'nombre' | 'foto' | 'papel' | 'ahora'>, opciones: { yo?: boolean; elegida?: boolean } = {}): HTMLElement {
    const e = ESTILO_PAPEL[p.papel];
    const caja = el('div', 'relative h-11 w-11');
    const bola = el('div', `mk-burbuja h-11 w-11 rounded-full border-[3px] ${e.borde} ${e.fondo} ${e.tinta} shadow-e2 overflow-hidden flex items-center justify-center text-[14px] font-bold select-none transition-transform duration-150 ${opciones.elegida ? 'scale-125' : ''}`);
    const ponIniciales = () => { bola.textContent = iniciales(p.nombre); };
    if (p.foto) {
        const img = el('img', 'h-full w-full object-cover') as HTMLImageElement;
        img.alt = '';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.onerror = () => { img.remove(); ponIniciales(); };
        img.src = p.foto;
        bola.appendChild(img);
    } else ponIniciales();
    caja.appendChild(bola);
    if (p.ahora) caja.appendChild(el('span', `absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ${PUNTO_AHORA} border-2 border-background`));
    if (opciones.yo) {
        const tu = el('span', 'absolute left-1/2 -translate-x-1/2 -bottom-3 px-1.5 rounded-full bg-foreground text-background text-[10px] font-bold leading-4');
        tu.textContent = 'Tú';
        caja.appendChild(tu);
    }
    caja.setAttribute('aria-label', p.nombre);
    return caja;
}

/** Varios juntos: un círculo con el número */
export function grupoDOM(n: number): HTMLElement {
    const lado = n < 10 ? 'h-11 w-11 text-[15px]' : n < 100 ? 'h-12 w-12 text-[15px]' : 'h-14 w-14 text-[14px]';
    const e = el('div', `${lado} rounded-full bg-foreground text-background border-[3px] border-background shadow-e2 flex items-center justify-center font-bold select-none`);
    e.textContent = n.toLocaleString('es-ES');
    e.setAttribute('aria-label', `${n} musikeers juntos`);
    return e;
}

/** Dónde estoy yo, solo en mi pantalla */
export function yoDOM(): HTMLElement {
    return el('div', 'h-4 w-4 rounded-full bg-pastel-cielo-ink border-[3px] border-background shadow-e2');
}

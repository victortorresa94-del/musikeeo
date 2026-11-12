// Teleprompter de Tocar («Línea a línea»): la línea que toca cantar sale en negrita y las demás,
// apagadas. Va por tiempo, como Auto: la hoja baja y la línea que cruza la guía (un poco por
// encima del medio de la pantalla) es la de ahora. Se corrige tocando una línea o con el pedal,
// que mueve la hoja para que esa línea quede en la guía. Sin red, sin micro y sin React.

export const GUIA = 0.38;                    // la guía, en proporción del alto visible

const lineasDe = (hoja: HTMLElement) => Array.from(hoja.querySelectorAll<HTMLElement>('[data-hoja] [data-linea]'));

// Todo en coordenadas del contenido de la hoja (lo que vale scrollTop)
const yDe = (hoja: HTMLElement, el: HTMLElement) => el.getBoundingClientRect().top - hoja.getBoundingClientRect().top + hoja.scrollTop;

// La guía, en el contenido. Arriba del todo está en la primera línea y baja el doble de rápido que
// la hoja hasta llegar a su sitio: así se empieza por la primera y no se salta ninguna
function guia(hoja: HTMLElement, primera: number, s = hoja.scrollTop) {
    return Math.min(hoja.clientHeight * GUIA + s, primera + 2 * s);
}

// La línea de ahora: la última que ya ha llegado a la guía
export function lineaDeAhora(hoja: HTMLElement): HTMLElement | null {
    const lineas = lineasDe(hoja);
    if (!lineas.length) return null;
    const g = guia(hoja, yDe(hoja, lineas[0])) + 1;
    let ahora = lineas[0];
    for (const l of lineas) {
        if (yDe(hoja, l) <= g) ahora = l;
        else break;
    }
    return ahora;
}

// Marca la de ahora (data-ahora) y desmarca la anterior. Devuelve la marcada
export function marcar(hoja: HTMLElement, antes: HTMLElement | null): HTMLElement | null {
    const ahora = lineaDeAhora(hoja);
    if (ahora === antes) return ahora;
    antes?.removeAttribute('data-ahora');
    ahora?.setAttribute('data-ahora', '');
    return ahora;
}

// Lleva una línea a la guía: el desplazamiento con el que la guía cae justo en ella
export function aLaGuia(hoja: HTMLElement, linea: HTMLElement, suave = true) {
    const lineas = lineasDe(hoja);
    if (!lineas.length) return;
    const y = yDe(hoja, linea), primera = yDe(hoja, lineas[0]);
    const top = Math.max(0, y - hoja.clientHeight * GUIA, (y - primera) / 2);
    hoja.scrollTo({ top, behavior: suave ? 'smooth' : 'auto' });
}

// La siguiente (+1) o la anterior (−1) a la de ahora; null si no hay más
export function vecina(hoja: HTMLElement, paso: 1 | -1): HTMLElement | null {
    const lineas = lineasDe(hoja);
    const ahora = lineaDeAhora(hoja);
    const i = ahora ? lineas.indexOf(ahora) : -1;
    return lineas[i + paso] ?? null;
}

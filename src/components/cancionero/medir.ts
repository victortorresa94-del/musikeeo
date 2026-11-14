// «Que quepa entera»: busca la letra más grande con la que la canción entra en una caja
// (la pantalla, o una hoja A4 al imprimir), probando también a repartirla en columnas.
// Mide sobre una copia invisible de la hoja: con alto fijo y columnas, lo que no cabe
// se sale por la derecha, así que «cabe» = no hay desbordamiento.

export interface Encaje { tamano: number; columnas: number; cabe: boolean }

// La copia puede llegar escondida (display: none, clase «hidden»): así no se coloca entera a
// ancho cero cuando alguien mide la página antes que ella. Se enseña ya con su caja puesta
export function buscarEncaje(hoja: HTMLElement, ancho: number, alto: number, maxColumnas: number, maxTamano = 44, minTamano = 9): Encaje {
    const s = hoja.style;
    s.width = `${ancho}px`;
    s.height = `${alto}px`;
    s.columnFill = 'auto';
    s.overflow = 'hidden';
    s.display = 'block';
    const cabe = (tamano: number) => {
        s.fontSize = `${tamano}px`;
        return hoja.scrollWidth <= hoja.clientWidth + 1 && hoja.scrollHeight <= hoja.clientHeight + 1;
    };
    let mejor: Encaje = { tamano: minTamano, columnas: Math.max(1, maxColumnas), cabe: false };
    for (let columnas = 1; columnas <= maxColumnas; columnas++) {
        s.columnCount = String(columnas);
        let bajo = minTamano, alto_ = maxTamano;
        if (!cabe(bajo)) continue;
        if (cabe(alto_)) bajo = alto_;
        while (alto_ - bajo > 0.25) {
            const medio = (bajo + alto_) / 2;
            if (cabe(medio)) bajo = medio; else alto_ = medio;
        }
        const tamano = Math.floor(bajo * 4) / 4;
        // Más columnas solo si se gana letra de verdad: leer a saltos cuesta
        if (!mejor.cabe || tamano > mejor.tamano * 1.12) mejor = { tamano, columnas, cabe: true };
    }
    return mejor;
}

// Columnas que tiene sentido probar según el ancho (una columna de menos de ~260 px no se lee)
// En un teléfono, como mucho 2 columnas aunque la canción se guardara con más en el PC (14-nov,
// Víctor, en el bolo: «en móvil no deberían ponerse todas así… máximo 2 columnas»). Por la pantalla
// del aparato, no por la ventana: tumbado sigue siendo un teléfono
export const esTelefono = () => typeof window !== 'undefined' && Math.min(window.screen?.width || window.innerWidth, window.screen?.height || window.innerHeight) < 600;
export const topeColumnas = () => (esTelefono() ? 2 : 4);
export const columnasPosibles = (ancho: number) => Math.max(1, Math.min(topeColumnas(), Math.floor(ancho / 260)));

// Tope de «que quepa» en pantalla: «que quepa» encoge lo que no cabe, pero no agranda una chuleta
// corta hasta llenar la pantalla. Víctor (13-nov): «en móvil sale gigante… no tiene que salir tan
// grande de primeras»; y de nuevo el 13-nov por la noche: «está como muy grande el texto de las
// canciones en todas»). En el móvil, 18 px; en tablet y ordenador, 21.
// Va en el cálculo, no en lo guardado: A± y el zoom con dos dedos pueden pasar de aquí
const esMovil = () => typeof window !== 'undefined' && window.innerWidth < 768;
export const topeQueQuepa = () => (esMovil() ? 18 : 21);
// Y el suelo: si para caber hay que bajar de aquí, no se encoge (se lee a su tamaño y se desplaza).
// En el móvil, una canción larga entraba a 9-11 px y no se podía leer
export const sueloQueQuepa = () => (esMovil() ? 14 : 12);

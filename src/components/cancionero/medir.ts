// «Que quepa entera»: busca la letra más grande con la que la canción entra en una caja
// (la pantalla, o una hoja A4 al imprimir), probando también a repartirla en columnas.
// Mide sobre una copia invisible de la hoja: con alto fijo y columnas, lo que no cabe
// se sale por la derecha, así que «cabe» = no hay desbordamiento.

export interface Encaje { tamano: number; columnas: number; cabe: boolean }

// La copia puede llegar escondida (display: none, clase «hidden»): así no se coloca entera a
// ancho cero cuando alguien mide la página antes que ella. Se enseña ya con su caja puesta
export function buscarEncaje(hoja: HTMLElement, ancho: number, alto: number, maxColumnas: number, maxTamano = 44): Encaje {
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
    let mejor: Encaje = { tamano: 9, columnas: Math.max(1, maxColumnas), cabe: false };
    for (let columnas = 1; columnas <= maxColumnas; columnas++) {
        s.columnCount = String(columnas);
        let bajo = 9, alto_ = maxTamano;
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
export const columnasPosibles = (ancho: number) => Math.max(1, Math.min(4, Math.floor(ancho / 260)));

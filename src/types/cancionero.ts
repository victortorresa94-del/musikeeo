import type { Alteraciones, Notacion } from '../lib/acordes';

// Cómo la deja cada persona: se guarda con la canción y se abre igual la próxima vez
export interface AjustesCancion {
    semitonos: number;          // -11 … 11 sobre el tono en que suena lo pegado
    cejilla: number;            // 0 … 11: la que pone quien la toca
    notacion: Notacion;
    alteraciones: Alteraciones;
    tamano: number;             // px de la letra
    columnas: 1 | 2 | 3;
    ajustar: boolean;           // que quepa entera en la pantalla
    vista: 'completa' | 'letra' | 'acordes';
    velocidad: number;          // desplazamiento automático, px por segundo
    alRitmo?: boolean;          // con la duración de la canción: la hoja baja entera en lo que dura
    intro?: number;             // segundos de intro que no cuentan para bajar (10 si no se dice)
}

// Privada: solo la ve su dueño (en su móvil, y en su cuenta si tiene)
export interface Cancion {
    id: string;
    titulo: string;
    artista: string;
    texto: string;              // lo pegado, ya limpio
    ajustes: AjustesCancion;
    creadaEn: string;           // ISO
    actualizadaEn: string;      // ISO
    sincronizada?: boolean;     // solo en el móvil: ya estuvo en la cuenta
    // Lo que sabemos de la canción grabada (buscador de canciones, catálogo de Apple)
    portada?: string;           // URL de la carátula
    duracion?: number;          // segundos (para que el desplazamiento dure lo que la canción)
    muestra?: string;           // URL de 30 s para escucharla y coger el tono
    bpm?: number;               // tempo, para la claqueta
}

// Un repertorio (setlist) para un bolo: canciones del cancionero en el orden en que se tocan
export interface Repertorio {
    id: string;
    nombre: string;
    fecha: string;              // AAAA-MM-DD
    canciones: string[];        // ids de Cancion, en orden
    creadaEn: string;
    actualizadaEn: string;
    sincronizada?: boolean;
}

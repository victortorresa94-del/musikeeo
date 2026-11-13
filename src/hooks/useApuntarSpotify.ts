import { useCallback } from 'react';
import { almacenCanciones, almacenRepertorios, cancioneroService } from '../services/cancioneroService';
import type { Resultado } from '../lib/spotify';

// Guarda en cada canción su pista de Spotify y en el repertorio su playlist (sin pisar lo que ya había).
// Lee el cancionero en el momento de guardar (no la copia de cuando se pidió la playlist, que tarda
// decenas de segundos) y espera a saber de quién es: en la vuelta de Spotify la página se acaba de
// abrir y lo primero que hay es la copia del móvil, sin confirmar
export function useApuntarSpotify() {
    return useCallback((resultado: Resultado, repertorioId?: string) => {
        const apuntar = (intento: number) => {
            const ec = almacenCanciones.estado(), er = almacenRepertorios.estado();
            if ((ec.provisional || !ec.duenio || er.provisional || ec.nube === 'sincronizando') && intento < 20) {
                setTimeout(() => apuntar(intento + 1), 1000);
                return;
            }
            const cambiadas = ec.items.filter(c => resultado.enlaces[c.id] && !c.spotify).map(c => ({ ...c, spotify: resultado.enlaces[c.id] }));
            if (cambiadas.length) cancioneroService.guardarVarias(cambiadas);
            const r = repertorioId ? er.items.find(x => x.id === repertorioId) : undefined;
            if (r && r.spotify !== resultado.url) cancioneroService.guardarRepertorio({ ...r, spotify: resultado.url });
        };
        apuntar(0);
    }, []);
}

// Los grupos de cada canción (ficha.proyectos) y cambiarlos en lote. Sin React.
import { toast } from 'sonner';
import { cancioneroService } from '../services/cancioneroService';
import type { Cancion } from '../types/cancionero';

export const gruposDe = (c: Cancion) => (c.ficha?.proyectos ?? []).map(g => g.trim()).filter(Boolean);
const contar = (n: number) => `${n} ${n === 1 ? 'canción' : 'canciones'}`;

// Poner o quitar un grupo a varias canciones de una vez (una sola escritura, con Deshacer)
export function cambiarGrupo(canciones: Cancion[], grupo: string, poner: boolean) {
    const cambiadas = canciones.filter(c => gruposDe(c).includes(grupo) !== poner);
    if (!cambiadas.length) { toast(poner ? `Ya estaban en ${grupo}` : `Ninguna era de ${grupo}`); return; }
    cancioneroService.guardarVarias(cambiadas.map(c => {
        const resto = gruposDe(c).filter(g => g !== grupo);
        return { ...c, ficha: { ...c.ficha, proyectos: poner ? [...resto, grupo] : resto } };
    }));
    toast.success(`${contar(cambiadas.length)} ${poner ? 'a' : 'fuera de'} ${grupo}`,
        { action: { label: 'Deshacer', onClick: () => cancioneroService.guardarVarias(cambiadas) } });
}


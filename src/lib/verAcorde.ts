// Abrir el diagrama de un acorde desde cualquier hoja (la canción, Tocar, el cifrado, el enlace
// del grupo) sin pasar nada por props: la hoja avisa y el visor, que está una sola vez, lo abre
export type PeticionAcorde = { nombres: string[]; elegido?: number } | null;
type Oyente = (p: PeticionAcorde) => void;
const oyentes = new Set<Oyente>();

export const verAcorde = (nombre: string) => oyentes.forEach(f => f({ nombres: [nombre] }));
export const verAcordes = (nombres: string[]) => oyentes.forEach(f => f({ nombres }));
export const cerrarAcordes = () => oyentes.forEach(f => f(null));
export function escucharAcordes(f: Oyente) {
    oyentes.add(f);
    return () => { oyentes.delete(f); };
}

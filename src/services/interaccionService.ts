import { db } from '../lib/firebase';
import { crearInteracciones } from './interaccionesNucleo';

// Me gusta y comentarios del Feed contra Firestore de producción.
// La lógica (y el porqué de cada regla) está en interaccionesNucleo.ts.
export { claveDe, MAX_COMENTARIO } from './interaccionesNucleo';
export type { Comentario, Contador, Objetivo, TipoInteraccion } from './interaccionesNucleo';

export const interaccionService = crearInteracciones(db);

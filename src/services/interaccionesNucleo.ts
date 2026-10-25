import {
    collection, collectionGroup, doc, documentId, getDoc, getDocs, increment, limit,
    onSnapshot, orderBy, query, runTransaction, where, type Firestore,
} from 'firebase/firestore';

// Me gusta y comentarios de lo que sale en el Feed (publicaciones y vídeos de artista).
// Todo vive en interacciones/{clave}, aparte del contenido, para no tocar las fichas:
//   interacciones/{clave}                → { tipo, refId, duenioId, likeCount, commentCount, creadoEn }
//   interacciones/{clave}/meGusta/{uid}  → uno por persona
//   interacciones/{clave}/comentarios/…  → { autorId, autorNombre, autorFoto?, texto, creadoEn }
// La clave es «post_<id>» o «artista_<id>». Las reglas obligan a que los contadores
// se muevan de uno en uno y a la vez que el me gusta o el comentario.

export type TipoInteraccion = 'post' | 'artista';

export interface Objetivo {
    tipo: TipoInteraccion;
    refId: string;
    /** uid del dueño del contenido (puede borrar comentarios en lo suyo) */
    duenioId: string;
}

export interface Contador { likes: number; comentarios: number }

export interface Comentario {
    id: string;
    autorId: string;
    autorNombre: string;
    autorFoto?: string;
    texto: string;
    creadoEn: string;
}

export const MAX_COMENTARIO = 500;

export const claveDe = (o: Pick<Objetivo, 'tipo' | 'refId'>) => `${o.tipo}_${o.refId}`;

/**
 * Las operaciones sobre una base de datos concreta. La app usa la de producción
 * (services/interaccionService.ts); los agentes de prueba, la del emulador.
 * Sin imports de la app: se puede cargar desde Node.
 */
export function crearInteracciones(db: Firestore) {
    const raiz = (clave: string) => doc(db, 'interacciones', clave);

    return {
        /** Contadores de muchas cosas a la vez (de 30 en 30, el máximo de «in») */
        async contadores(claves: string[]): Promise<Map<string, Contador>> {
            const unicas = [...new Set(claves)];
            const out = new Map<string, Contador>();
            const tandas: string[][] = [];
            for (let i = 0; i < unicas.length; i += 30) tandas.push(unicas.slice(i, i + 30));
            await Promise.all(tandas.map(async t => {
                const s = await getDocs(query(collection(db, 'interacciones'), where(documentId(), 'in', t)));
                s.docs.forEach(d => {
                    const x = d.data();
                    out.set(d.id, { likes: Math.max(0, Number(x.likeCount) || 0), comentarios: Math.max(0, Number(x.commentCount) || 0) });
                });
            }));
            return out;
        },

        /** Lo que esta persona ya ha marcado. Una consulta; si falta el índice, una lectura por clave */
        async misMeGusta(uid: string, claves: string[]): Promise<Set<string>> {
            try {
                const s = await getDocs(query(collectionGroup(db, 'meGusta'), where('uid', '==', uid), limit(500)));
                return new Set(s.docs.map(d => d.ref.parent.parent?.id).filter((x): x is string => !!x));
            } catch {
                const checks = await Promise.all(claves.slice(0, 60).map(c =>
                    getDoc(doc(db, 'interacciones', c, 'meGusta', uid)).then(s => (s.exists() ? c : null)).catch(() => null)));
                return new Set(checks.filter((x): x is string => !!x));
            }
        },

        /** Da o quita el me gusta. Si ya estaba así, no hace nada (no cuenta dos veces) */
        async setMeGusta(o: Objetivo, uid: string, on: boolean): Promise<void> {
            const clave = claveDe(o);
            const padre = raiz(clave);
            const mio = doc(db, 'interacciones', clave, 'meGusta', uid);
            await runTransaction(db, async tx => {
                const [p, m] = await Promise.all([tx.get(padre), tx.get(mio)]);
                if (on === m.exists()) return;
                if (!p.exists()) {
                    // Solo se llega aquí al dar el primer me gusta (quitar uno exige que exista)
                    tx.set(padre, { ...o, likeCount: 1, commentCount: 0, creadoEn: new Date().toISOString() });
                } else {
                    tx.update(padre, { likeCount: increment(on ? 1 : -1) });
                }
                if (on) tx.set(mio, { uid, clave, creadoEn: new Date().toISOString() });
                else tx.delete(mio);
            });
        },

        /** Los últimos comentarios, en directo mientras la hoja está abierta. Devuelve cómo dejar de escuchar */
        escucharComentarios(clave: string, onCambio: (c: Comentario[]) => void, onError: (e: unknown) => void, max = 60) {
            // desc + limit + al revés: los últimos 60, del más antiguo al más nuevo
            const q = query(collection(db, 'interacciones', clave, 'comentarios'), orderBy('creadoEn', 'desc'), limit(max));
            return onSnapshot(q,
                s => onCambio(s.docs.map(d => ({ id: d.id, ...d.data() }) as Comentario).reverse()),
                onError);
        },

        async comentar(o: Objetivo, autor: { uid: string; nombre: string; foto?: string }, texto: string): Promise<Comentario> {
            const limpio = texto.trim().slice(0, MAX_COMENTARIO);
            if (!limpio) throw new Error('vacío');
            const clave = claveDe(o);
            const padre = raiz(clave);
            const nuevo = doc(collection(db, 'interacciones', clave, 'comentarios'));
            const datos = {
                autorId: autor.uid,
                autorNombre: (autor.nombre || 'Usuario de Musikeeo').slice(0, 80),
                ...(autor.foto ? { autorFoto: autor.foto } : {}),
                texto: limpio,
                creadoEn: new Date().toISOString(),
            };
            await runTransaction(db, async tx => {
                const p = await tx.get(padre);
                if (!p.exists()) tx.set(padre, { ...o, likeCount: 0, commentCount: 1, creadoEn: datos.creadoEn });
                else tx.update(padre, { commentCount: increment(1) });
                tx.set(nuevo, datos);
            });
            return { id: nuevo.id, ...datos };
        },

        /** Borra un comentario (el suyo, o cualquiera en lo que es suyo) */
        async borrarComentario(clave: string, id: string): Promise<void> {
            const padre = raiz(clave);
            const c = doc(db, 'interacciones', clave, 'comentarios', id);
            await runTransaction(db, async tx => {
                const [p, x] = await Promise.all([tx.get(padre), tx.get(c)]);
                if (!x.exists()) return;
                if (p.exists()) tx.update(padre, { commentCount: increment(-1) });
                tx.delete(c);
            });
        },
    };
}

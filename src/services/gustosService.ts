import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
    aprender, gustosValidos, gustosVacios, juntar, type Gustos, type Rasgos, type Senal,
} from '../lib/recomendador';

// Los gustos que aprende el Feed. Primero en el móvil (también sin cuenta) y, con cuenta,
// copiados a users/{uid}/gustos/perfil para que el PC y el móvil enseñen lo mismo.
// Lo aprendido sin cuenta pasa a la cuenta al entrar. Si las reglas no están desplegadas,
// se queda en el móvil sin avisar de errores.

const CLAVE = 'musikeeo-gustos-v1';
const INVITADO = 'invitado';
const ESPERA_SUBIDA = 4000;

let duenio = INVITADO;
let gustos: Gustos = leer(INVITADO);
let temporizador: ReturnType<typeof setTimeout> | null = null;
let sinPermiso = false;

function leer(quien: string): Gustos {
    try {
        const crudo = localStorage.getItem(`${CLAVE}:${quien}`);
        return (crudo && gustosValidos(JSON.parse(crudo))) || gustosVacios();
    } catch { return gustosVacios(); }
}

function escribir(quien: string, g: Gustos) {
    try { localStorage.setItem(`${CLAVE}:${quien}`, JSON.stringify(g)); } catch { /* sin almacenamiento */ }
}

const remoto = (uid: string) => doc(db, 'users', uid, 'gustos', 'perfil');

async function subir() {
    temporizador = null;
    if (duenio === INVITADO || sinPermiso) return;
    try { await setDoc(remoto(duenio), gustos); }
    catch (e) { if ((e as { code?: string })?.code === 'permission-denied') sinPermiso = true; }
}

function programarSubida() {
    if (duenio === INVITADO || sinPermiso) return;
    if (temporizador) clearTimeout(temporizador);
    temporizador = setTimeout(subir, ESPERA_SUBIDA);
}

// Al cerrar o cambiar de app, se sube lo pendiente
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && temporizador) { clearTimeout(temporizador); void subir(); }
    });
}

export const gustosService = {
    actuales: (): Gustos => gustos,

    /** Cambia de persona (al entrar o salir) y junta lo del móvil con lo de la cuenta */
    async usar(uid: string | null): Promise<Gustos> {
        const quien = uid || INVITADO;
        if (quien === duenio && (quien === INVITADO || gustos.t)) return gustos;
        duenio = quien;
        sinPermiso = false;
        gustos = leer(quien);
        if (quien === INVITADO) return gustos;

        // Lo aprendido sin cuenta en este móvil pasa a la cuenta
        const invitado = leer(INVITADO);
        if (invitado.t) {
            gustos = juntar(gustos, invitado);
            try { localStorage.removeItem(`${CLAVE}:${INVITADO}`); } catch { /* nada */ }
        }
        try {
            const s = await getDoc(remoto(quien));
            const enNube = s.exists() ? gustosValidos(s.data()) : null;
            if (duenio !== quien) return gustos;
            if (enNube) gustos = juntar(gustos, enNube);
        } catch (e) {
            if ((e as { code?: string })?.code === 'permission-denied') sinPermiso = true;
        }
        escribir(quien, gustos);
        programarSubida();
        return gustos;
    },

    /** Apunta un gesto. Las impresiones solo cuentan como «visto» */
    registrar(r: Rasgos, senal: Senal) {
        gustos = aprender(gustos, r, senal, Date.now());
        escribir(duenio, gustos);
        if (senal !== 'impresion') programarSubida();
    },
};

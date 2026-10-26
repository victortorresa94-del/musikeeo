// Cliente de /api/leer-perfil («Rellénalo con tu web o tu Instagram»). La página la lee el
// servidor (el navegador no puede: CORS) y la IA va allí, con la clave fuera del bundle.
// Si la API no contesta y lo que se ha pegado es texto, las mismas reglas sin IA corren aquí:
// así nunca se queda en nada.

import {
    MENSAJES, datosDeTexto, hayAlgo, limpiarPropuesta, reglas,
    type CodigoError, type ErrorLeerPerfil, type RespuestaLeerPerfil,
} from '../lib/leerPerfil';

export type EntradaLeerPerfil = { url: string } | { texto: string };

const TIEMPO_MS = 30_000;

const sinRed = (): ErrorLeerPerfil => ({
    ok: false, error: 'red', pedirTexto: true,
    mensaje: 'No hemos podido leer tu web ahora mismo. Copia tu bio y pégala aquí.',
});

/** Las reglas sin IA, aquí mismo (solo para texto pegado) */
function respaldoTexto(texto: string): RespuestaLeerPerfil | ErrorLeerPerfil {
    if (texto.trim().length < 20) return { ok: false, error: 'texto_corto', mensaje: MENSAJES.texto_corto, pedirTexto: true };
    const propuesta = reglas(datosDeTexto(texto.trim()), 'texto');
    return hayAlgo(propuesta)
        ? { ok: true, fuente: 'texto', modo: 'reglas', propuesta }
        : { ok: false, error: 'sin_datos', mensaje: MENSAJES.sin_datos, pedirTexto: true };
}

export async function leerPerfilRemoto(entrada: EntradaLeerPerfil): Promise<RespuestaLeerPerfil | ErrorLeerPerfil> {
    const ctrl = new AbortController();
    const reloj = setTimeout(() => ctrl.abort(), TIEMPO_MS);
    try {
        const r = await fetch('/api/leer-perfil', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entrada),
            signal: ctrl.signal,
        });
        // Lo que llega se comprueba entero: tipos, listas y largos
        const data = await r.json().catch(() => null) as Record<string, unknown> | null;
        if (data && data.ok === true && data.propuesta && typeof data.propuesta === 'object') {
            const instagram = data.instagram === 'ok' || data.instagram === 'sin_bio' || data.instagram === 'login' ? data.instagram : undefined;
            return {
                ok: true,
                fuente: data.fuente === 'instagram' || data.fuente === 'texto' ? data.fuente : 'web',
                modo: data.modo === 'ia' ? 'ia' : 'reglas',
                propuesta: limpiarPropuesta(data.propuesta),
                ...(instagram ? { instagram } : {}),
                ...(data.pedirTexto === true ? { pedirTexto: true } : {}),
                ...(typeof data.aviso === 'string' ? { aviso: data.aviso.slice(0, 200) } : {}),
            };
        }
        if (data && data.ok === false && typeof data.error === 'string' && data.error in MENSAJES) {
            const error = data.error as CodigoError;
            // Si la API cae del todo (500) con texto pegado, mejor las reglas de aquí
            if (r.status >= 500 && 'texto' in entrada) return respaldoTexto(entrada.texto);
            return { ok: false, error, mensaje: MENSAJES[error], pedirTexto: data.pedirTexto !== false };
        }
        return 'texto' in entrada ? respaldoTexto(entrada.texto) : sinRed();
    } catch {
        return 'texto' in entrada ? respaldoTexto(entrada.texto) : sinRed();
    } finally {
        clearTimeout(reloj);
    }
}

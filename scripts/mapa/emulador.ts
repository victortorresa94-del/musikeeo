// Ayudas para probar el mapa contra los EMULADORES de Firebase por su API REST (nunca producción:
// solo 127.0.0.1 y un proyecto «demo-», que firebase-tools no deja conectar con nada real).
//   EMU_AUTH=127.0.0.1:9199 EMU_FIRESTORE=127.0.0.1:8180 EMU_PROYECTO=demo-musikeeo

export const AUTH = `http://${process.env.EMU_AUTH || '127.0.0.1:9199'}`;
export const FS = `http://${process.env.EMU_FIRESTORE || '127.0.0.1:8180'}`;
export const PROYECTO = process.env.EMU_PROYECTO || 'demo-musikeeo';

if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(AUTH) || !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(FS)) {
    throw new Error('Estas pruebas solo van contra los emuladores en 127.0.0.1');
}
if (PROYECTO === 'musikeeo-8e766' && !process.env.EMU_PERMITIR_DEFECTO) {
    throw new Error('Usa un proyecto demo- (EMU_PROYECTO=demo-musikeeo): así es imposible tocar producción');
}

export const RAIZ = `projects/${PROYECTO}/databases/(default)/documents`;

type Valor = string | number | boolean | null | Date | Valor[] | { [k: string]: Valor };

export function aFirestore(v: Valor): Record<string, unknown> {
    if (v === null) return { nullValue: null };
    if (v instanceof Date) return { timestampValue: v.toISOString() };
    if (typeof v === 'string') return { stringValue: v };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(aFirestore) } };
    return { mapValue: { fields: campos(v) } };
}
export const campos = (o: Record<string, Valor>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, aFirestore(v)]));

export function deFirestore(v: Record<string, unknown>): unknown {
    if ('stringValue' in v) return v.stringValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('nullValue' in v) return null;
    if ('timestampValue' in v) return new Date(v.timestampValue as string);
    if ('arrayValue' in v) return ((v.arrayValue as { values?: Record<string, unknown>[] }).values || []).map(deFirestore);
    if ('mapValue' in v) return Object.fromEntries(Object.entries((v.mapValue as { fields?: Record<string, Record<string, unknown>> }).fields || {}).map(([k, x]) => [k, deFirestore(x)]));
    return undefined;
}

export interface Cuenta { uid: string; token: string; email: string }

export async function crearCuenta(email: string, password: string, nombre: string): Promise<Cuenta> {
    const r = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName: nombre, returnSecureToken: true }),
    });
    const j = await r.json() as { localId?: string; idToken?: string; error?: unknown };
    if (!r.ok || !j.localId || !j.idToken) throw new Error(`signUp ${email}: ${JSON.stringify(j.error)}`);
    return { uid: j.localId, token: j.idToken, email };
}

export async function entrar(email: string, password: string): Promise<Cuenta> {
    const r = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const j = await r.json() as { localId: string; idToken: string };
    if (!r.ok) throw new Error(`signIn ${email}: ${JSON.stringify(j)}`);
    return { uid: j.localId, token: j.idToken, email };
}

/** Escribe un documento. token 'owner' se salta las reglas (solo para preparar datos) */
export async function escribir(ruta: string, datos: Record<string, Valor>, token: string | null, horaServidor: string[] = []) {
    const r = await fetch(`${FS}/v1/${RAIZ}:commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
            writes: [{
                update: { name: `${RAIZ}/${ruta}`, fields: campos(datos) },
                ...(horaServidor.length ? { updateTransforms: horaServidor.map(fieldPath => ({ fieldPath, setToServerValue: 'REQUEST_TIME' })) } : {}),
            }],
        }),
    });
    return { ok: r.ok, status: r.status, texto: r.ok ? '' : await r.text() };
}

export async function borrar(ruta: string, token: string | null) {
    const r = await fetch(`${FS}/v1/${RAIZ}/${ruta}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return { ok: r.ok, status: r.status };
}

export async function leer(ruta: string, token: string | null): Promise<{ ok: boolean; status: number; datos: Record<string, unknown> | null }> {
    const r = await fetch(`${FS}/v1/${RAIZ}/${ruta}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!r.ok) return { ok: false, status: r.status, datos: null };
    const j = await r.json() as { fields?: Record<string, Record<string, unknown>> };
    return { ok: true, status: r.status, datos: Object.fromEntries(Object.entries(j.fields || {}).map(([k, v]) => [k, deFirestore(v)])) };
}

/** Lo mismo que pide la app: orderBy geohash, rango del prefijo y límite */
export async function consultar(prefijo: string, token: string | null, limite: number | null = 300) {
    const consulta: Record<string, unknown> = {
        from: [{ collectionId: 'mapa' }],
        orderBy: [{ field: { fieldPath: 'geohash' }, direction: 'ASCENDING' }],
        ...(prefijo ? {
            startAt: { values: [{ stringValue: prefijo }], before: true },
            endAt: { values: [{ stringValue: `${prefijo}~` }], before: false },
        } : {}),
        ...(limite != null ? { limit: limite } : {}),
    };
    const r = await fetch(`${FS}/v1/${RAIZ}:runQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ structuredQuery: consulta }),
    });
    const j = await r.json() as { document?: { name: string } }[] | { error: unknown };
    return { ok: r.ok, status: r.status, docs: Array.isArray(j) ? j.filter(x => x.document).map(x => x.document!.name.split('/').pop()!) : [] };
}

export async function vaciar() {
    await fetch(`${FS}/emulator/v1/projects/${PROYECTO}/databases/(default)/documents`, { method: 'DELETE' });
    await fetch(`${AUTH}/emulator/v1/projects/${PROYECTO}/accounts`, { method: 'DELETE' });
}

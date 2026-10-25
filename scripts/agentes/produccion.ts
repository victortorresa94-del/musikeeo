// Lectura del catálogo PÚBLICO de producción por la API REST de Firestore (lo mismo que ve
// cualquiera sin cuenta). Solo lectura: nada de aquí escribe en producción.

export type Valor = {
    stringValue?: string; integerValue?: string; doubleValue?: number; booleanValue?: boolean;
    arrayValue?: { values?: Valor[] }; mapValue?: { fields?: Record<string, Valor> }; nullValue?: null; timestampValue?: string;
};
export interface DocCrudo { id: string; fields: Record<string, Valor> }

const BASE = 'https://firestore.googleapis.com/v1/projects/musikeeo-8e766/databases/(default)/documents';

export const plano = (v: Valor): unknown =>
    v.stringValue ?? v.timestampValue ?? (v.integerValue !== undefined ? Number(v.integerValue) : undefined) ?? v.doubleValue ?? v.booleanValue
    ?? (v.arrayValue ? (v.arrayValue.values || []).map(plano) : undefined)
    ?? (v.mapValue ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, plano(x)])) : null);

export async function leerCrudo(coleccion: string): Promise<DocCrudo[]> {
    const out: DocCrudo[] = [];
    let token = '';
    do {
        const res = await fetch(`${BASE}/${coleccion}?pageSize=300${token ? `&pageToken=${token}` : ''}`);
        if (!res.ok) return out;   // sin permiso (p. ej. posts sin reglas desplegadas): nada
        const j = await res.json() as { documents?: { name: string; fields: Record<string, Valor> }[]; nextPageToken?: string };
        for (const d of j.documents || []) out.push({ id: d.name.split('/').pop() || '', fields: d.fields || {} });
        token = j.nextPageToken || '';
    } while (token);
    return out;
}

export async function leerColeccion<T>(coleccion: string): Promise<T[]> {
    return (await leerCrudo(coleccion)).map(d => ({ id: d.id, ...(plano({ mapValue: { fields: d.fields } }) as object) }) as T);
}

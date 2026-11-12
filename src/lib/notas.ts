// Las notas con formato de una canción o de un bolo (el editor de Tiptap las escribe).
// Se guardan como el JSON del documento, en texto. Este archivo no importa React ni Tiptap:
// lo usan el lector, Tocar y el enlace para los músicos sin cargar el editor.

export const LIMITE_NOTAS = 30000;

export interface Marca { type: string; attrs?: Record<string, unknown> }
export interface Nodo {
    type: string;
    attrs?: Record<string, unknown>;
    content?: Nodo[];
    text?: string;
    marks?: Marca[];
}

export function leerNotas(json?: string | null): Nodo | null {
    if (!json) return null;
    try {
        const doc = JSON.parse(json) as Nodo;
        return doc && doc.type === 'doc' && Array.isArray(doc.content) ? doc : null;
    } catch {
        return null;
    }
}

export function textoDeNodo(n: Nodo): string {
    if (n.type === 'text') return n.text ?? '';
    if (n.type === 'hardBreak') return '\n';
    const dentro = (n.content ?? []).map(textoDeNodo);
    const bloque = !['paragraph', 'heading', 'text'].includes(n.type) || n.type === 'doc';
    return bloque ? dentro.join('\n') : dentro.join('');
}

export const textoDeNotas = (json?: string | null) => {
    const doc = leerNotas(json);
    return doc ? textoDeNodo(doc).replace(/\n{3,}/g, '\n\n').trim() : '';
};

// Vacío = sin texto y sin casillas ni separadores
export function notasVacias(json?: string | null): boolean {
    const doc = leerNotas(json);
    if (!doc) return true;
    const algo = (n: Nodo): boolean => !!n.text?.trim() || n.type === 'horizontalRule' || n.type === 'taskItem' || (n.content ?? []).some(algo);
    return !algo(doc);
}

// Los colores que se ofrecen (tokens pastel con su pareja clara y oscura)
export const COLORES_NOTA = ['mantequilla', 'cielo', 'menta', 'lavanda', 'melocoton', 'rosa'] as const;
export type ColorNota = typeof COLORES_NOTA[number];
export const NOMBRE_COLOR: Record<ColorNota, string> = {
    mantequilla: 'Amarillo', cielo: 'Azul', menta: 'Verde', lavanda: 'Lila', melocoton: 'Naranja', rosa: 'Rosa',
};
export const esColorNota = (c: unknown): c is ColorNota => typeof c === 'string' && (COLORES_NOTA as readonly string[]).includes(c);

// Notas que llegan como texto (de una copia, de Notion…): cada línea, un párrafo
export function notasDeTexto(texto: string): string | undefined {
    const lineas = texto.split('\n').map(l => l.trimEnd()).filter((l, i, a) => l || (i > 0 && a[i - 1]));
    if (!lineas.some(l => l.trim())) return undefined;
    return JSON.stringify({ type: 'doc', content: lineas.map(l => (l ? { type: 'paragraph', content: [{ type: 'text', text: l }] } : { type: 'paragraph' })) });
}

// Lo que llega (JSON del editor o texto) a JSON del editor
export const aNotas = (x?: string | null) => (!x ? undefined : leerNotas(x) ? x : notasDeTexto(x));

// Se suman: a las notas que ya hay se añaden los bloques nuevos cuyo texto no estaba
export function unirNotas(antes?: string | null, nuevas?: string | null): string | undefined {
    const a = leerNotas(aNotas(antes)), n = leerNotas(aNotas(nuevas));
    if (!n) return a ? JSON.stringify(a) : undefined;
    if (!a) return JSON.stringify(n);
    const ya = new Set((a.content ?? []).map(b => textoDeNodo(b).trim()).filter(Boolean));
    const nuevos = (n.content ?? []).filter(b => { const t = textoDeNodo(b).trim(); return t && !ya.has(t); });
    if (!nuevos.length) return JSON.stringify(a);
    return JSON.stringify({ ...a, content: [...(a.content ?? []), ...nuevos] });
}

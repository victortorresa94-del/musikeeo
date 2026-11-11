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

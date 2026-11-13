type EditorLetraComp = typeof import('./EditorLetra').default;

// El editor de la letra (Tiptap) va en su trozo, pero se precarga al abrir una canción: así, al
// tocar la letra, se pinta en el mismo toque y el iPhone abre el teclado (si se carga después del
// toque, Safari no deja enfocar y hay que tocar dos veces)
let cargado: EditorLetraComp | null = null;
let promesa: Promise<EditorLetraComp> | null = null;

export function cargarEditorLetra() {
    promesa ??= import('./EditorLetra').then(m => (cargado = m.default));
    return promesa;
}
export const editorLetraCargado = () => cargado;

// Cuando el móvil está libre, para no quitarle tiempo a pintar la canción
export function precargarEditorLetra() {
    if (cargado || promesa) return;
    const ric = (window as unknown as { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback;
    if (ric) ric(() => { void cargarEditorLetra(); }); else setTimeout(() => { void cargarEditorLetra(); }, 1200);
}

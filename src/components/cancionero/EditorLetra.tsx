import { forwardRef, useImperativeHandle, useLayoutEffect } from 'react';
import { EditorContent, Extension, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extensions';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Fragment, Slice, type Node as NodoPM, type Schema } from '@tiptap/pm/model';
import { RE_AVISO, esApunte, esSeccion, esTab, formatear, leerAcorde, leerLineaAcordes, limpiarTexto } from '../../lib/acordes';
import { textoPegado } from '../../lib/pegado';
import { cn } from '../../lib/utils';
import { estiloSeccion } from './estilo';

// La letra se edita encima de la hoja, con su aspecto (13-nov, Víctor: «he pedido por activa y
// por pasiva poder editar el texto aquí mismo sin que cambie el formato y se convierta en un
// editor de texto rudimentario… como en Notion»). Debajo sigue siendo TEXTO PLANO: una línea del
// texto = un párrafo; **negrita** y ==resaltado== son marcas de verdad (se ven al escribir) y al
// guardar vuelven a ser «**» y «==». Cada línea se pinta según lo que es (acordes, parte, apunte,
// aviso, título…) con decoraciones: no cambia el texto, solo cómo se ve.

export interface EditorLetraApi {
    editor: Editor | null;
    texto: () => string;
    alternarPrefijo: (prefijo: '# ' | '> ') => void;
}

// ---- Texto ⇄ documento ----
function aDocumento(texto: string) {
    const lineas = texto.replace(/\r\n?/g, '\n').split('\n');
    return {
        type: 'doc',
        content: lineas.map(l => {
            // Las marcas no cruzan de una línea a otra (como al leer la canción)
            const pedazos = l.includes('**') || l.includes('==') ? formatear(l, { negrita: false, resaltado: false }) : [{ texto: l, negrita: false, resaltado: false }];
            const content = pedazos.filter(p => p.texto).map(p => ({
                type: 'text', text: p.texto,
                ...(p.negrita || p.resaltado ? { marks: [...(p.negrita ? [{ type: 'bold' }] : []), ...(p.resaltado ? [{ type: 'highlight' }] : [])] } : {}),
            }));
            return content.length ? { type: 'paragraph', content } : { type: 'paragraph' };
        }),
    };
}

function lineaATexto(p: NodoPM): string {
    let salida = '';
    let negrita = false, resaltado = false;
    p.forEach(n => {
        const b = n.marks.some(m => m.type.name === 'bold');
        const h = n.marks.some(m => m.type.name === 'highlight');
        // Se cierra antes de abrir, en orden: «**==así==**»
        if (resaltado && !h) { salida += '=='; resaltado = false; }
        if (negrita && !b) { salida += '**'; negrita = false; }
        if (b && !negrita) { salida += '**'; negrita = true; }
        if (h && !resaltado) { salida += '=='; resaltado = true; }
        salida += n.text ?? '';
    });
    if (resaltado) salida += '==';
    if (negrita) salida += '**';
    return salida;
}

const aTexto = (doc: NodoPM) => {
    const lineas: string[] = [];
    doc.forEach(p => { lineas.push(lineaATexto(p)); });
    return lineas.join('\n');
};

// ---- Cómo se ve cada línea ----
function claseDeLinea(t: string): { clase: string; etiqueta?: number } | null {
    const s = t.trim();
    if (!s) return null;
    if (/^#{1,3}\s+\S/.test(s)) return { clase: 'ev-titulo' };
    if (RE_AVISO.test(s)) return { clase: 'ev-aviso' };
    if (esTab(t)) return { clase: 'ev-tab' };
    const acordes = leerLineaAcordes(t);
    if (acordes) {
        // «Estrofa: Cm – Gm»: la parte en gris y los acordes en negrita
        const fin = acordes.etiqueta ? t.indexOf(':') + 1 || 0 : 0;
        return { clase: 'ev-acordes', etiqueta: fin || undefined };
    }
    if (esApunte(t)) return { clase: 'ev-apunte' };
    const seccion = esSeccion(t);
    if (seccion) return { clase: cn('ev-seccion', estiloSeccion(seccion)?.etiqueta ?? 'ev-seccion-gris') };
    return null;
}

const decorar = (doc: NodoPM) => {
    const decos: Decoration[] = [];
    doc.forEach((p, pos) => {
        const t = p.textContent;
        const c = claseDeLinea(t);
        if (c) {
            decos.push(Decoration.node(pos, pos + p.nodeSize, { class: c.clase }));
            if (c.etiqueta) decos.push(Decoration.inline(pos + 1, pos + 1 + c.etiqueta, { class: 'ev-parte' }));
        } else if (t.includes('[')) {
            // Acordes dentro de la letra, a lo ChordPro: [Am]
            for (const m of t.matchAll(/\[([^\]\s]{1,12})\]/g)) {
                if (m.index !== undefined && leerAcorde(m[1])) decos.push(Decoration.inline(pos + 1 + m.index, pos + 1 + m.index + m[0].length, { class: 'ev-chordpro' }));
            }
        }
    });
    return DecorationSet.create(doc, decos);
};

const clavePinta = new PluginKey('musikeeo-pinta-letra');
const PintaLetra = Extension.create({
    name: 'pintaLetra',
    addProseMirrorPlugins() {
        return [new Plugin({
            key: clavePinta,
            state: {
                init: (_, { doc }) => decorar(doc),
                apply: (tr, viejo) => (tr.docChanged ? decorar(tr.doc) : viejo),
            },
            props: { decorations: state => clavePinta.getState(state) },
        })];
    },
});

// Pegar texto: cada línea, un párrafo, también las vacías (ProseMirror las juntaba), y con su
// **negrita** y ==resaltado== si los trae
function pegarTexto(texto: string, schema: Schema): Slice {
    const doc = aDocumento(texto);
    const nodos = doc.content.map(p => schema.nodeFromJSON(p));
    return new Slice(Fragment.from(nodos), 1, 1);
}

// Lo que se pega de FUERA (Cifra Club, LaCuerda, una nota, WhatsApp) entra como TEXTO, línea a
// línea y con sus espacios: el HTML de esas webs metía la fila de acordes y la de la letra en la
// misma línea («D No, no te puedo olvidar») y se comía los espacios que colocan cada acorde
// (13-nov, Víctor: «acabo de copiar la letra directa de Cifra Club y mira cómo se me ha pegado»).
// Lo copiado dentro del propio editor (lleva data-pm-slice) sigue el camino normal: guarda sus marcas
function textoDeFuera(datos: DataTransfer | null): string | null {
    if (!datos) return null;
    if (datos.getData('text/html').includes('data-pm-slice')) return null;
    const crudo = textoPegado(datos);
    if (!crudo) return null;
    // Varias líneas: tabuladores a espacios, fuera lo que no es la canción y como mucho un blanco seguido
    return crudo.includes('\n') ? limpiarTexto(crudo) : crudo.replace(/[\r\n]+/g, '');
}

export interface EditorLetraProps {
    texto: string;
    lineaInicial?: number;
    yInicial?: number | null;   // dónde estaba el dedo: la línea tocada se queda ahí
    tamano?: number;
    alinear?: boolean;          // letra de máquina, para colocar un acorde justo encima de su sílaba
    onCambio?: (texto: string) => void;
    onTeclaListo?: () => void;  // Escape o Ctrl/Cmd+Intro
}

export const EditorLetra = forwardRef<EditorLetraApi, EditorLetraProps>(({ texto, lineaInicial, yInicial, tamano = 18, alinear, onCambio, onTeclaListo }, ref) => {
    const editor = useEditor({
        extensions: [
            // De StarterKit solo lo de una letra: párrafos (líneas), negrita y deshacer. Nada de
            // listas, títulos ni cursiva: «* » o «# » al empezar una línea son texto de la canción
            StarterKit.configure({
                heading: false, bulletList: false, orderedList: false, listItem: false, listKeymap: false, blockquote: false,
                codeBlock: false, code: false, horizontalRule: false, italic: false, strike: false, underline: false,
                link: false, hardBreak: false, dropcursor: false, gapcursor: false, trailingNode: false,
            }),
            Highlight, PintaLetra,
            Placeholder.configure({ placeholder: 'Escribe o pega la letra con sus acordes encima', showOnlyWhenEditable: true }),
        ],
        content: aDocumento(texto),
        immediatelyRender: true,
        editorProps: {
            attributes: { 'aria-label': 'Letra y acordes de la canción', spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off' },
            clipboardTextParser: (t, _ctx, _plain, view) => pegarTexto(t, view.state.schema),
            handlePaste: (view, event) => {
                const t = textoDeFuera(event.clipboardData);
                if (t === null) return false;
                event.preventDefault();
                view.dispatch(view.state.tr.replaceSelection(pegarTexto(t, view.state.schema)).scrollIntoView());
                return true;
            },
            // Arrastrar texto de otra app: igual que pegar
            handleDrop: (view, event, _slice, moved) => {
                if (moved) return false;
                const t = textoDeFuera(event.dataTransfer);
                if (t === null) return false;
                const donde = view.posAtCoords({ left: event.clientX, top: event.clientY });
                if (!donde) return false;
                event.preventDefault();
                view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, donde.pos)).replaceSelection(pegarTexto(t, view.state.schema)));
                return true;
            },
            clipboardTextSerializer: slice => {
                const lineas: string[] = [];
                slice.content.forEach(p => { lineas.push(p.isTextblock ? p.textContent : p.textBetween(0, p.content.size, '\n')); });
                return lineas.join('\n');
            },
            handleKeyDown: (_v, e) => {
                if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); onTeclaListo?.(); return true; }
                return false;
            },
        },
        onUpdate: ({ editor: e }) => onCambio?.(aTexto(e.state.doc)),
    });

    // Al abrir, el cursor en la línea tocada (sin que la página salte)
    // En el mismo toque (antes de pintar): el iPhone solo abre el teclado si se enfoca dentro del
    // gesto. En desarrollo React lo crea dos veces y el primero ya no vale
    useLayoutEffect(() => {
        if (!editor || editor.isDestroyed) return;
        try {
            let pos = 1, n = 0;
            const objetivo = Math.max(0, lineaInicial ?? 0);
            editor.state.doc.forEach((p, offset) => { if (n++ === objetivo) pos = offset + 1 + p.content.size; });
            editor.commands.setTextSelection(Math.min(pos, editor.state.doc.content.size));
            // La línea tocada, a la altura del dedo; luego el cursor, sin que la página salte
            const p = editor.view.dom.children[objetivo] as HTMLElement | undefined;
            if (p && yInicial != null) window.scrollBy({ top: p.getBoundingClientRect().top - yInicial + 4 });
            editor.view.dom.focus({ preventScroll: true });
        } catch { /* aún sin montar: se queda sin el cursor puesto */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor]);

    useImperativeHandle(ref, () => ({
        editor,
        texto: () => (editor ? aTexto(editor.state.doc) : texto),
        // «# Título» / «> Aviso» en la línea del cursor: lo pone o lo quita
        alternarPrefijo: (prefijo) => {
            if (!editor) return;
            const { $from } = editor.state.selection;
            const inicio = $from.start();
            const actual = $from.parent.textContent;
            editor.chain().focus().command(({ tr }) => {
                const otro = prefijo === '# ' ? /^>\s*/ : /^#{1,3}\s+/;
                const mio = prefijo === '# ' ? /^#{1,3}\s+/ : /^>\s*/;
                const m = mio.exec(actual);
                if (m) { tr.delete(inicio, inicio + m[0].length); return true; }
                const o = otro.exec(actual);
                if (o) tr.delete(inicio, inicio + o[0].length);
                tr.insertText(prefijo, inicio);
                return true;
            }).run();
        },
    }), [editor, texto]);

    return (
        <EditorContent editor={editor}
            className={cn('editor-letra text-foreground', alinear && 'editor-letra-alinear')}
            style={{ fontSize: tamano }} />
    );
});
EditorLetra.displayName = 'EditorLetra';
export default EditorLetra;

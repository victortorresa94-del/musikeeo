import { Mark, Node, mergeAttributes } from '@tiptap/react';
import { esColorNota } from '../../lib/notas';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        aviso: { ponerAviso: (color?: string) => ReturnType; quitarAviso: () => ReturnType };
        tinta: { ponerTinta: (color: string) => ReturnType; quitarTinta: () => ReturnType };
    }
}

// Un bloque de aviso en su baldosa de color: «Entra la batería», «Enganche con…»
export const Aviso = Node.create({
    name: 'aviso',
    group: 'block',
    content: 'inline*',
    defining: true,
    addAttributes() {
        return {
            color: {
                default: 'melocoton',
                parseHTML: el => (esColorNota(el.getAttribute('data-color')) ? el.getAttribute('data-color') : 'melocoton'),
                renderHTML: a => ({ 'data-color': a.color }),
            },
        };
    },
    parseHTML() { return [{ tag: 'div[data-aviso]' }]; },
    renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-aviso': '' }), 0]; },
    addCommands() {
        return {
            ponerAviso: (color = 'melocoton') => ({ commands, editor }) => (editor.isActive('aviso')
                ? commands.updateAttributes('aviso', { color })
                : commands.setNode('aviso', { color })),
            quitarAviso: () => ({ commands }) => commands.setNode('paragraph'),
        };
    },
    addKeyboardShortcuts() {
        return {
            // Intro al final de un aviso sale a un párrafo normal
            Enter: ({ editor }) => {
                const { $from, empty } = editor.state.selection;
                if (!empty || $from.parent.type.name !== 'aviso' || $from.parentOffset !== $from.parent.content.size) return false;
                return editor.chain().insertContentAt($from.after(), { type: 'paragraph' }).focus($from.after() + 1).run();
            },
        };
    },
});

// Color del texto, con los mismos colores pastel de la app (con su pareja clara y oscura)
export const Tinta = Mark.create({
    name: 'tinta',
    addAttributes() {
        return {
            color: {
                default: null,
                parseHTML: el => el.getAttribute('data-tinta'),
                renderHTML: a => (a.color ? { 'data-tinta': a.color } : {}),
            },
        };
    },
    parseHTML() { return [{ tag: 'span[data-tinta]' }]; },
    renderHTML({ HTMLAttributes }) { return ['span', mergeAttributes(HTMLAttributes), 0]; },
    addCommands() {
        return {
            ponerTinta: color => ({ commands }) => commands.setMark(this.name, { color }),
            quitarTinta: () => ({ commands }) => commands.unsetMark(this.name),
        };
    },
});

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extensions';
import {
    Bold, CheckSquare, Heading1, Heading2, Heading3, Highlighter, Italic, Link2, List, ListOrdered, Megaphone, Minus,
    Palette, Pilcrow, Plus, Quote, Redo2, Strikethrough, Underline, Undo2, X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { COLORES_NOTA, LIMITE_NOTAS, NOMBRE_COLOR, leerNotas, notasVacias, type ColorNota } from '../../lib/notas';
import { Aviso, Tinta } from './extensiones';
import { FONDO, TINTA } from './colores';

// El editor de notas con formato (Tiptap), con la potencia de las notas de Aura: títulos,
// negrita, colores, listas, casillas, avisos en su baldosa y «/» para meter bloques.
// En el móvil, la barra de formato va pegada encima del teclado.

const Resaltado = Highlight.extend({
    addAttributes() {
        return {
            color: {
                default: 'mantequilla',
                parseHTML: el => el.getAttribute('data-color'),
                renderHTML: a => ({ 'data-color': a.color }),
            },
        };
    },
}).configure({ multicolor: true });

interface Bloque { id: string; titulo: string; sub: string; icono: ReactNode; claves: string; hacer: (e: Editor) => void }

const BLOQUES: Bloque[] = [
    { id: 'texto', titulo: 'Texto', sub: 'Un párrafo normal', icono: <Pilcrow className="h-4 w-4" />, claves: 'texto parrafo normal', hacer: e => e.chain().focus().setParagraph().run() },
    { id: 'h1', titulo: 'Título', sub: 'Grande', icono: <Heading1 className="h-4 w-4" />, claves: 'titulo h1 grande', hacer: e => e.chain().focus().setHeading({ level: 1 }).run() },
    { id: 'h2', titulo: 'Subtítulo', sub: 'Mediano', icono: <Heading2 className="h-4 w-4" />, claves: 'subtitulo h2', hacer: e => e.chain().focus().setHeading({ level: 2 }).run() },
    { id: 'h3', titulo: 'Etiqueta', sub: 'En mayúsculas, como una parte', icono: <Heading3 className="h-4 w-4" />, claves: 'etiqueta parte seccion h3', hacer: e => e.chain().focus().setHeading({ level: 3 }).run() },
    { id: 'aviso', titulo: 'Aviso', sub: '«Entra la batería», «enganche con…»', icono: <Megaphone className="h-4 w-4" />, claves: 'aviso callout nota importante', hacer: e => e.chain().focus().ponerAviso('melocoton').run() },
    { id: 'lista', titulo: 'Lista', sub: 'Con puntos', icono: <List className="h-4 w-4" />, claves: 'lista puntos vinetas', hacer: e => e.chain().focus().toggleBulletList().run() },
    { id: 'numerada', titulo: 'Lista numerada', sub: '1, 2, 3…', icono: <ListOrdered className="h-4 w-4" />, claves: 'numerada numeros orden', hacer: e => e.chain().focus().toggleOrderedList().run() },
    { id: 'casillas', titulo: 'Casillas', sub: 'Para marcar: llevar cables, afinar…', icono: <CheckSquare className="h-4 w-4" />, claves: 'casillas tareas checklist marcar', hacer: e => e.chain().focus().toggleTaskList().run() },
    { id: 'cita', titulo: 'Cita', sub: 'Texto apartado', icono: <Quote className="h-4 w-4" />, claves: 'cita quote', hacer: e => e.chain().focus().toggleBlockquote().run() },
    { id: 'separador', titulo: 'Separador', sub: 'Una raya', icono: <Minus className="h-4 w-4" />, claves: 'separador linea raya', hacer: e => e.chain().focus().setHorizontalRule().run() },
];

const sinTildes = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export default function EditorNotas({ valor, onCambio, placeholder, className, autoFocus }: {
    valor?: string;
    onCambio: (json: string | undefined) => void;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
}) {
    const [barra, setBarra] = useState(false);
    const [barraAbajo, setBarraAbajo] = useState(0);
    const [barraMenu, setBarraMenu] = useState<null | 'bloques' | 'resaltar' | 'tinta'>(null);
    const [barra2, setBarra2] = useState<{ desde: number; consulta: string; x: number; y: number } | null>(null);
    const [elegido, setElegido] = useState(0);
    const [largo, setLargo] = useState(false);
    const onCambioRef = useRef(onCambio);
    const cajaRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                link: { openOnClick: false, autolink: true, protocols: ['http', 'https', 'mailto', 'tel'], HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } },
                code: false,
                codeBlock: false,
            }),
            Resaltado,
            TaskList,
            TaskItem.configure({ nested: true }),
            Placeholder.configure({ placeholder: placeholder ?? 'Escribe… o pulsa «/» para meter un título, un aviso, casillas…' }),
            Aviso,
            Tinta,
        ],
        content: leerNotas(valor) ?? '',
        autofocus: autoFocus ? 'end' : false,
        editorProps: {
            attributes: { class: 'text-[16px] text-foreground', 'aria-label': 'Notas' },
            handleKeyDown: (_v, e) => {
                if (!barra2Ref.current) return false;
                const lista = filtradosRef.current;
                if (e.key === 'ArrowDown') { setElegido(i => (i + 1) % Math.max(1, lista.length)); return true; }
                if (e.key === 'ArrowUp') { setElegido(i => (i - 1 + lista.length) % Math.max(1, lista.length)); return true; }
                if (e.key === 'Enter' && lista.length) { elegirRef.current(lista[elegidoRef.current] ?? lista[0]); return true; }
                if (e.key === 'Escape') { setBarra2(null); return true; }
                return false;
            },
        },
        onUpdate: ({ editor: e }) => {
            const json = JSON.stringify(e.getJSON());
            onCambioRef.current(notasVacias(json) ? undefined : json);
            setLargo(json.length > LIMITE_NOTAS);
            mirarBarra(e);
        },
        onSelectionUpdate: ({ editor: e }) => mirarBarra(e),
        onFocus: () => setBarra(true),
        onBlur: () => setTimeout(() => {
            // Al pulsar la barra el foco vuelve al editor; si se fue de verdad, se esconde
            if (!cajaRef.current?.contains(document.activeElement) && !document.activeElement?.closest('[data-barra-notas]')) { setBarra(false); setBarraMenu(null); }
        }, 150),
    });

    // «/» al empezar una línea o tras un espacio abre el menú de bloques
    const barra2Ref = useRef(barra2);
    function mirarBarra(e: Editor) {
        const { $from, empty } = e.state.selection;
        if (!empty) { setBarra2(null); return; }
        const antes = $from.parent.textBetween(0, $from.parentOffset, undefined, '￼');
        const m = /(?:^|\s)\/([\p{L}\d]{0,20})$/u.exec(antes);
        if (!m) { setBarra2(null); return; }
        const desde = $from.pos - m[1].length - 1;
        const c = e.view.coordsAtPos($from.pos);
        const caja = cajaRef.current?.getBoundingClientRect();
        setBarra2({ desde, consulta: m[1], x: Math.max(0, Math.min(c.left - (caja?.left ?? 0), (caja?.width ?? 300) - 280)), y: c.bottom - (caja?.top ?? 0) });
        if (!barra2Ref.current || barra2Ref.current.desde !== desde) setElegido(0);
    }

    const filtrados = barra2
        ? BLOQUES.filter(b => !barra2.consulta || sinTildes(`${b.titulo} ${b.claves}`).includes(sinTildes(barra2.consulta)))
        : [];
    const filtradosRef = useRef(filtrados);
    const elegidoRef = useRef(elegido);
    const elegir = (b: Bloque) => {
        if (!editor) return;
        const actual = barra2Ref.current;
        if (actual) editor.chain().focus().deleteRange({ from: actual.desde, to: editor.state.selection.from }).run();
        b.hacer(editor);
        setBarra2(null);
        setBarraMenu(null);
    };
    const elegirRef = useRef(elegir);
    // Lo último de cada cosa para los atajos de teclado del editor (se crean una vez)
    useLayoutEffect(() => {
        onCambioRef.current = onCambio;
        barra2Ref.current = barra2;
        filtradosRef.current = filtrados;
        elegidoRef.current = elegido;
        elegirRef.current = elegir;
    });

    // Si llega otro valor desde fuera (Deshacer, otra canción), el editor lo coge
    useEffect(() => {
        if (!editor || editor.isFocused) return;
        const actual = JSON.stringify(editor.getJSON());
        if (valor && valor !== actual) editor.commands.setContent(leerNotas(valor) ?? '', { emitUpdate: false });
        if (!valor && !notasVacias(actual)) editor.commands.clearContent(false);
    }, [valor, editor]);

    // En el móvil, la barra sube con el teclado (visualViewport dice cuánto ocupa)
    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv || !barra) return;
        const f = () => setBarraAbajo(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
        f();
        vv.addEventListener('resize', f);
        vv.addEventListener('scroll', f);
        return () => { vv.removeEventListener('resize', f); vv.removeEventListener('scroll', f); };
    }, [barra]);

    return (
        <div ref={cajaRef} className={cn('editor-notas relative', className)}>
            {editor && <BarraEscritorio editor={editor} menu={barraMenu} setMenu={setBarraMenu} elegir={elegir} />}
            <EditorContent editor={editor} />
            {largo && <p className="mt-1 text-[13px] text-destructive">Son demasiadas notas: no se guardará todo en tu cuenta. Quita algo.</p>}

            {/* Menú de «/» junto al cursor */}
            {barra2 && filtrados.length > 0 && (
                <div role="listbox" aria-label="Meter un bloque"
                    className="absolute z-30 w-[min(280px,calc(100vw-32px))] max-h-[260px] overflow-y-auto rounded-2xl bg-sheet border border-hairline shadow-e3 p-1"
                    style={{ left: barra2.x, top: barra2.y + 6 }}>
                    {filtrados.map((b, i) => (
                        <button key={b.id} type="button" role="option" aria-selected={i === elegido}
                            onMouseDown={e => e.preventDefault()} onClick={() => elegir(b)} onMouseEnter={() => setElegido(i)}
                            className={cn('w-full flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left', i === elegido && 'bg-fill')}>
                            <span className="h-8 w-8 shrink-0 rounded-lg bg-fill flex items-center justify-center text-foreground">{b.icono}</span>
                            <span className="min-w-0">
                                <span className="block text-[14px] font-semibold text-foreground leading-tight">{b.titulo}</span>
                                <span className="block text-[12px] text-muted-foreground truncate">{b.sub}</span>
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Móvil: barra de formato encima del teclado */}
            {editor && barra && createPortal(
                <div data-barra-notas className="md:hidden fixed inset-x-0 z-[96] bg-sheet border-t border-hairline" style={{ bottom: barraAbajo }}
                    onMouseDown={e => e.preventDefault()}>
                    {barraMenu && <Submenu editor={editor} menu={barraMenu} elegir={elegir} cerrar={() => setBarraMenu(null)} />}
                    <Botones editor={editor} menu={barraMenu} setMenu={setBarraMenu} />
                </div>,
                document.body,
            )}
        </div>
    );
}

// Ordenador: la barra va encima del texto, siempre a la vista
function BarraEscritorio({ editor, menu, setMenu, elegir }: { editor: Editor; menu: null | 'bloques' | 'resaltar' | 'tinta'; setMenu: (m: null | 'bloques' | 'resaltar' | 'tinta') => void; elegir: (b: Bloque) => void }) {
    return (
        <div className="hidden md:block sticky top-14 z-20 mb-2 rounded-2xl bg-fill" onMouseDown={e => { if ((e.target as HTMLElement).closest('button')) e.preventDefault(); }}>
            <Botones editor={editor} menu={menu} setMenu={setMenu} />
            {menu && <Submenu editor={editor} menu={menu} elegir={elegir} cerrar={() => setMenu(null)} />}
        </div>
    );
}

function Botones({ editor, menu, setMenu }: { editor: Editor; menu: null | 'bloques' | 'resaltar' | 'tinta'; setMenu: (m: null | 'bloques' | 'resaltar' | 'tinta') => void }) {
    const s = useEditorState({
        editor,
        selector: ({ editor: e }) => ({
            negrita: e.isActive('bold'), cursiva: e.isActive('italic'), subrayado: e.isActive('underline'), tachado: e.isActive('strike'),
            h1: e.isActive('heading', { level: 1 }), h2: e.isActive('heading', { level: 2 }),
            lista: e.isActive('bulletList'), numerada: e.isActive('orderedList'), casillas: e.isActive('taskList'),
            aviso: e.isActive('aviso'), resaltado: e.isActive('highlight'), tinta: e.isActive('tinta'), enlace: e.isActive('link'),
            deshacer: e.can().undo(), rehacer: e.can().redo(),
        }),
    });
    const enlace = () => {
        if (s.enlace) { editor.chain().focus().unsetLink().run(); return; }
        const url = window.prompt('Enlace (https://…)', 'https://');
        if (url && /^(https?:\/\/|mailto:|tel:)/i.test(url.trim())) editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    };
    const b = (activo: boolean, etiqueta: string, onClick: () => void, icono: ReactNode, desactivado?: boolean) => (
        <button type="button" aria-label={etiqueta} title={etiqueta} aria-pressed={activo} disabled={desactivado}
            onClick={onClick}
            className={cn('h-10 min-w-10 px-2 shrink-0 rounded-xl flex items-center justify-center disabled:opacity-30',
                activo ? 'bg-foreground text-background' : 'text-foreground active:bg-fill-strong')}>
            {icono}
        </button>
    );
    return (
        <div role="toolbar" aria-label="Formato" className="h-[52px] px-1.5 flex items-center gap-0.5 overflow-x-auto hide-scrollbar">
            {b(menu === 'bloques', 'Meter un bloque', () => setMenu(menu === 'bloques' ? null : 'bloques'), <Plus className="h-5 w-5" />)}
            {b(s.negrita, 'Negrita', () => editor.chain().focus().toggleBold().run(), <Bold className="h-[18px] w-[18px]" />)}
            {b(s.cursiva, 'Cursiva', () => editor.chain().focus().toggleItalic().run(), <Italic className="h-[18px] w-[18px]" />)}
            {b(s.subrayado, 'Subrayado', () => editor.chain().focus().toggleUnderline().run(), <Underline className="h-[18px] w-[18px]" />)}
            {b(s.tachado, 'Tachado', () => editor.chain().focus().toggleStrike().run(), <Strikethrough className="h-[18px] w-[18px]" />)}
            {b(s.resaltado || menu === 'resaltar', 'Resaltar', () => setMenu(menu === 'resaltar' ? null : 'resaltar'), <Highlighter className="h-[18px] w-[18px]" />)}
            {b(s.tinta || menu === 'tinta', 'Color del texto', () => setMenu(menu === 'tinta' ? null : 'tinta'), <Palette className="h-[18px] w-[18px]" />)}
            <span className="mx-1 h-6 w-px shrink-0 bg-hairline-strong" aria-hidden />
            {b(s.h1, 'Título', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), <Heading1 className="h-5 w-5" />)}
            {b(s.h2, 'Subtítulo', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 className="h-5 w-5" />)}
            {b(s.aviso, 'Aviso', () => (s.aviso ? editor.chain().focus().quitarAviso().run() : editor.chain().focus().ponerAviso('melocoton').run()), <Megaphone className="h-[18px] w-[18px]" />)}
            {b(s.lista, 'Lista', () => editor.chain().focus().toggleBulletList().run(), <List className="h-5 w-5" />)}
            {b(s.numerada, 'Lista numerada', () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="h-5 w-5" />)}
            {b(s.casillas, 'Casillas', () => editor.chain().focus().toggleTaskList().run(), <CheckSquare className="h-[18px] w-[18px]" />)}
            {b(s.enlace, 'Enlace', enlace, <Link2 className="h-[18px] w-[18px]" />)}
            <span className="mx-1 h-6 w-px shrink-0 bg-hairline-strong" aria-hidden />
            {b(false, 'Deshacer', () => editor.chain().focus().undo().run(), <Undo2 className="h-[18px] w-[18px]" />, !s.deshacer)}
            {b(false, 'Rehacer', () => editor.chain().focus().redo().run(), <Redo2 className="h-[18px] w-[18px]" />, !s.rehacer)}
        </div>
    );
}

function Submenu({ editor, menu, elegir, cerrar }: { editor: Editor; menu: 'bloques' | 'resaltar' | 'tinta'; elegir: (b: Bloque) => void; cerrar: () => void }) {
    if (menu === 'bloques') {
        return (
            <div className="px-2 pt-2 flex gap-1.5 overflow-x-auto hide-scrollbar">
                {BLOQUES.map(b => (
                    <button key={b.id} type="button" onClick={() => elegir(b)}
                        className="pulsable h-10 shrink-0 px-3 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                        {b.icono}{b.titulo}
                    </button>
                ))}
            </div>
        );
    }
    const enAviso = menu === 'resaltar' && editor.isActive('aviso');
    const poner = (c: ColorNota) => {
        if (menu === 'tinta') editor.chain().focus().ponerTinta(c).run();
        else if (enAviso) editor.chain().focus().ponerAviso(c).run();
        else editor.chain().focus().setHighlight({ color: c }).run();
        cerrar();
    };
    const quitar = () => {
        if (menu === 'tinta') editor.chain().focus().quitarTinta().run();
        else editor.chain().focus().unsetHighlight().run();
        cerrar();
    };
    return (
        <div className="px-2 pt-2 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            <span className="shrink-0 text-[12px] font-semibold text-muted-foreground pr-1">{menu === 'tinta' ? 'Texto' : enAviso ? 'Aviso' : 'Fondo'}</span>
            {COLORES_NOTA.map(c => (
                <button key={c} type="button" onClick={() => poner(c)} aria-label={NOMBRE_COLOR[c]} title={NOMBRE_COLOR[c]}
                    className={cn('pulsable h-10 shrink-0 px-3 rounded-full text-[14px] font-bold', menu === 'tinta' ? cn('bg-fill', TINTA[c]) : FONDO[c])}>
                    {NOMBRE_COLOR[c]}
                </button>
            ))}
            {!enAviso && (
                <button type="button" onClick={quitar} aria-label="Quitar color" className="pulsable h-10 w-10 shrink-0 rounded-full bg-fill flex items-center justify-center text-foreground">
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}

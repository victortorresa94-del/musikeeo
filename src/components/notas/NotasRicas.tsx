import { memo, useMemo, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { esColorNota, leerNotas, type ColorNota, type Nodo } from '../../lib/notas';
import { FONDO, TINTA } from './colores';

// Las notas con formato pintadas con React, sin el editor (pesa) y sin innerHTML: lo que llega
// en un enlace compartido no puede meter nada raro en la página
const enlaceSeguro = (href: unknown) => (typeof href === 'string' && /^(https?:|mailto:|tel:)/i.test(href) ? href : null);

function texto(n: Nodo, key: number): ReactNode {
    let el: ReactNode = n.text ?? '';
    for (const m of n.marks ?? []) {
        switch (m.type) {
            case 'bold': el = <strong className="font-bold">{el}</strong>; break;
            case 'italic': el = <em>{el}</em>; break;
            case 'underline': el = <u className="underline-offset-2">{el}</u>; break;
            case 'strike': el = <s>{el}</s>; break;
            case 'code': el = <code className="rounded bg-fill px-1 font-mono text-[0.9em]">{el}</code>; break;
            case 'highlight': {
                const c = esColorNota(m.attrs?.color) ? m.attrs!.color as ColorNota : 'mantequilla';
                el = <mark className={cn('rounded-[0.2em] px-[0.1em]', FONDO[c])}>{el}</mark>;
                break;
            }
            case 'tinta':
                if (esColorNota(m.attrs?.color)) el = <span className={cn('font-semibold', TINTA[m.attrs!.color as ColorNota])}>{el}</span>;
                break;
            case 'link': {
                const href = enlaceSeguro(m.attrs?.href);
                if (href) el = <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{el}</a>;
                break;
            }
        }
    }
    return <span key={key}>{el}</span>;
}

function bloque(n: Nodo, key: number): ReactNode {
    const hijos = (n.content ?? []).map((h, i) => (h.type === 'text' ? texto(h, i) : bloque(h, i)));
    switch (n.type) {
        case 'paragraph':
            return <p key={key} className="min-h-[1.45em]">{hijos}</p>;
        case 'heading': {
            const nivel = Number(n.attrs?.level) || 1;
            if (nivel === 1) return <h2 key={key} className="mt-[0.6em] text-[1.45em] font-bold leading-tight">{hijos}</h2>;
            if (nivel === 2) return <h3 key={key} className="mt-[0.5em] text-[1.2em] font-bold leading-tight">{hijos}</h3>;
            return <h4 key={key} className="mt-[0.4em] text-[0.8em] font-bold uppercase tracking-[0.08em] text-muted-foreground">{hijos}</h4>;
        }
        case 'bulletList':
            return <ul key={key} className="list-disc pl-[1.3em] space-y-[0.15em]">{hijos}</ul>;
        case 'orderedList':
            return <ol key={key} className="list-decimal pl-[1.4em] space-y-[0.15em]">{hijos}</ol>;
        case 'listItem':
            return <li key={key}>{hijos}</li>;
        case 'taskList':
            return <ul key={key} className="space-y-[0.2em]">{hijos}</ul>;
        case 'taskItem': {
            const hecho = !!n.attrs?.checked;
            return (
                <li key={key} className="flex items-start gap-[0.5em]">
                    <span aria-hidden className={cn('mt-[0.25em] h-[1em] w-[1em] shrink-0 rounded-[0.25em] border-2 flex items-center justify-center text-[0.75em] font-bold',
                        hecho ? 'bg-foreground border-foreground text-background' : 'border-hairline-strong')}>{hecho ? '✓' : ''}</span>
                    <div className={cn('min-w-0 flex-1', hecho && 'line-through text-muted-foreground')}>{hijos}</div>
                </li>
            );
        }
        case 'blockquote':
            return <blockquote key={key} className="border-l-[3px] border-hairline-strong pl-[0.8em] text-muted-foreground">{hijos}</blockquote>;
        case 'aviso': {
            const c = esColorNota(n.attrs?.color) ? n.attrs!.color as ColorNota : 'melocoton';
            return <div key={key} className={cn('rounded-[0.7em] px-[0.8em] py-[0.5em] font-semibold', FONDO[c])}>{hijos}</div>;
        }
        case 'horizontalRule':
            return <hr key={key} className="my-[0.6em] border-hairline-strong" />;
        case 'hardBreak':
            return <br key={key} />;
        case 'codeBlock':
            return <pre key={key} className="rounded-[0.6em] bg-fill p-[0.6em] font-mono text-[0.85em] whitespace-pre-wrap">{hijos}</pre>;
        default:
            return hijos.length ? <div key={key}>{hijos}</div> : null;
    }
}

// json: el documento guardado (texto). tamano: px de la letra base
export const NotasRicas = memo(function NotasRicas({ json, className, tamano }: { json?: string | null; className?: string; tamano?: number }) {
    const contenido = useMemo(() => {
        const doc = leerNotas(json);
        if (!doc) return null;
        // Los párrafos vacíos del final (el último Intro) no dejan hueco
        const nodos = [...(doc.content ?? [])];
        while (nodos.length && nodos[nodos.length - 1].type === 'paragraph' && !nodos[nodos.length - 1].content?.length) nodos.pop();
        return nodos.map((n, i) => bloque(n, i));
    }, [json]);
    if (!contenido) return null;
    return (
        <div className={cn('notas-ricas text-foreground leading-[1.45] space-y-[0.35em] break-words', className)} style={tamano ? { fontSize: tamano } : undefined}>
            {contenido}
        </div>
    );
});

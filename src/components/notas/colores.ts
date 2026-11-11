import type { ColorNota } from '../../lib/notas';

// Las clases de cada color (tokens pastel con su pareja clara y oscura)
export const FONDO: Record<ColorNota, string> = {
    mantequilla: 'bg-pastel-mantequilla text-pastel-mantequilla-ink',
    cielo: 'bg-pastel-cielo text-pastel-cielo-ink',
    menta: 'bg-pastel-menta text-pastel-menta-ink',
    lavanda: 'bg-pastel-lavanda text-pastel-lavanda-ink',
    melocoton: 'bg-pastel-melocoton text-pastel-melocoton-ink',
    rosa: 'bg-pastel-rosa text-pastel-rosa-ink',
};
export const TINTA: Record<ColorNota, string> = {
    mantequilla: 'text-pastel-mantequilla-ink',
    cielo: 'text-pastel-cielo-ink',
    menta: 'text-pastel-menta-ink',
    lavanda: 'text-pastel-lavanda-ink',
    melocoton: 'text-pastel-melocoton-ink',
    rosa: 'text-pastel-rosa-ink',
};

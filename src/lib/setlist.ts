// Un setlist escrito a mano (en Aura, Notion, notas del móvil): una línea por tema con su
// tono — «Hace calor — G», «Bamboléo — Em (capo 3) [R]» — repartidos en bloques. Se
// convierte en una ficha por tema (título, bloque, tono que se puede transportar,
// cejilla, quién canta…) para tocarlas en orden. La letra y los acordes se pegan luego.
import { leerAcorde } from './acordes';

export interface CancionImportada { titulo: string; artista: string; texto: string; ficha?: boolean }

interface Tema { titulo: string; seccion?: string; tono?: string; cejilla?: number; notas: string[] }

const SEP = /\s+[—–-]\s+/;                         // entre el título y el tono
const ETIQUETA = /^([^:—–]{1,40}):\s+(.+)$/;       // «Más pop: …», «Hace calor: …»
const ADORNO = /^(→|->|\/|\||o|y)$/;               // «C → Em», «G / A»

const limpiar = (l: string) => l
    .replace(/^\s*(?:#{1,6}\s+|\d{1,3}[.)]\s+|[-*•]\s+(?:\[[ xX]\]\s+)?|\[[ xX]\]\s+)/, '')
    .replace(/\*\*/g, '')
    .trim();
const numerada = (l: string) => /^\s*\d{1,3}[.)]\s+/.test(l);
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// «Em (capo 3) [R]» → tono Em, cejilla 3 y la nota de la leyenda para R
function leerTono(parte: string, leyenda: Map<string, string>): Pick<Tema, 'tono' | 'cejilla' | 'notas'> {
    const notas: string[] = [];
    let cejilla: number | undefined;
    let resto = parte.replace(/\[([^\]]{1,8})\]/g, (_, t: string) => {
        notas.push(mayuscula(leyenda.get(t) ?? `[${t}]`));
        return ' ';
    });
    const capo = /(?:capo|cejilla)\s*(\d{1,2})/i.exec(resto);
    if (capo) {
        cejilla = Math.min(11, +capo[1]);
        resto = resto.replace(capo[0], ' ');
    }
    // Paréntesis que solo llevaban la cejilla: «(capo 2, Fm)» → «Fm»
    resto = resto.replace(/\(([^)]*)\)/g, (m, dentro: string) => (/^[\s,]*$/.test(dentro.replace(/[A-G][#b]?m?\d?/g, '')) ? ` ${dentro.replace(/,/g, ' ')} ` : m));
    resto = resto.replace(/\s+/g, ' ').trim();

    // El tono: los acordes del principio (con → o / entre medias)
    const tokens = resto.split(' ').filter(Boolean);
    let n = 0;
    while (n < tokens.length && (leerAcorde(tokens[n]) || (n > 0 && ADORNO.test(tokens[n]) && leerAcorde(tokens[n + 1] ?? '')))) n++;
    const tono = n ? tokens.slice(0, n).join(' ') : undefined;
    const sobra = tokens.slice(n).join(' ').replace(/^\(|\)$/g, '').replace(/^[,.\s]+/, '').trim();
    if (sobra) notas.unshift(mayuscula(sobra));
    return { tono, cejilla, notas };
}

function esTituloDeBloque(crudo: string, l: string) {
    if (/^\s*#{1,6}\s/.test(crudo)) return true;
    return l.length <= 40 && !SEP.test(l) && !l.includes(':') && !/[.,;]$/.test(l) && !/^\s*([-*•]|\d{1,3}[.)])\s/.test(crudo);
}

export function leerSetlist(texto: string): CancionImportada[] | null {
    const lineas = texto.replace(/\r\n?/g, '\n').split('\n');
    // Si viene separado por --- o {new_song} son canciones enteras, no un setlist
    if (lineas.some(l => /^\s*(?:-{3,}|={3,}|\{\s*(?:new_song|ns)\s*\})\s*$/.test(l))) return null;
    const llenas = lineas.filter(l => l.trim());
    const conTono = llenas.filter(l => SEP.test(limpiar(l))).length;
    if (conTono < 3 || conTono < llenas.length * 0.3) return null;

    const leyenda = new Map<string, string>();
    const temas: Tema[] = [];
    const generales: string[] = [];
    const confirmar: string[] = [];
    const llevar: string[] = [];
    let seccion: string | undefined;
    let modo: 'temas' | 'ignorar' | 'confirmar' | 'llevar' = 'temas';

    for (const crudo of lineas) {
        const l = limpiar(crudo);
        if (!l) continue;

        // «Leyenda: [M] canta Mafe · [CAT] català»
        const claves = [...l.matchAll(/\[([^\]]{1,8})\]\s*([^[·]+)/g)];
        if (/^leyenda\b/i.test(l) || (/^\[[^\]]{1,8}\]\s+\p{L}/u.test(l) && claves.length >= 2)) {
            for (const [, k, v] of claves) leyenda.set(k, v.replace(/\s*\(.*$/, '').trim());
            continue;
        }

        if ((modo !== 'llevar' || /^\s*#/.test(crudo)) && esTituloDeBloque(crudo, l)) {
            const t = l.replace(/:$/, '');
            modo = /^confirmar/i.test(t) ? 'confirmar'
                : /^(checklist|llevar|material)/i.test(t) ? 'llevar'
                    : /^(an[aá]lisis|notas?)\b/i.test(t) ? 'ignorar' : 'temas';
            if (modo === 'temas') seccion = t;
            continue;
        }
        if (modo === 'ignorar') continue;
        if (modo === 'llevar') { llevar.push(l); continue; }
        if (modo === 'confirmar') { confirmar.push(l); continue; }

        const etiqueta = ETIQUETA.exec(l);
        // Banquillo: «Más pop: La camisa negra (Fm) · Corazón partío (E capo 3) · Mucho mejor»
        if (etiqueta && etiqueta[2].includes(' · ')) {
            for (const item of etiqueta[2].split(/\s+·\s+/)) {
                const m = /^(.*?)\s*(\([^)]*\))?\s*((?:\[[^\]]+\]\s*)*)$/.exec(item.trim());
                if (!m || !m[1]) continue;
                temas.push({ titulo: m[1], seccion: [seccion, etiqueta[1]].filter(Boolean).join(' · '), ...leerTono(`${m[2] ?? ''} ${m[3] ?? ''}`, leyenda) });
            }
            continue;
        }

        const sep = SEP.exec(l);
        // «Mix Latino (capo 2, Fm): El Perdón → Bailando → Quédate»
        const mix = etiqueta && (/→/.test(etiqueta[2]) || /\(/.test(etiqueta[1]));
        if (numerada(crudo) || (sep && !etiqueta) || mix) {
            let titulo = l, parteTono = '';
            if (sep) {
                titulo = l.slice(0, sep.index);
                parteTono = l.slice(sep.index + sep[0].length);
            } else if (etiqueta) {
                const p = /^(.*?)\s*(\([^)]*\))\s*$/.exec(etiqueta[1]);
                titulo = `${p ? p[1] : etiqueta[1]}: ${etiqueta[2]}`;
                parteTono = p ? p[2] : '';
            }
            temas.push({ titulo: titulo.trim(), seccion, ...leerTono(parteTono, leyenda) });
            continue;
        }

        // «Alternativa en dúo: Mi persona favorita — E…» va con el tema de antes; lo demás, al bolo
        if (etiqueta && sep && temas.length) temas[temas.length - 1].notas.push(l);
        else generales.push(l);
    }
    if (temas.length < 3) return null;

    // «Confirmar antes de salir»: cada aviso, en su tema
    for (const c of confirmar) {
        const e = ETIQUETA.exec(c);
        const tema = e && temas.find(t => norm(t.titulo).startsWith(norm(e[1])) || norm(e[1]).startsWith(norm(t.titulo)));
        if (tema && e) tema.notas.push(`Confirmar: ${e[2]}`);
    }

    const canciones: CancionImportada[] = temas.map(t => ({
        titulo: t.titulo.slice(0, 120),
        artista: '',
        ficha: true,
        texto: [
            t.seccion && `[${t.seccion}]`,
            t.tono && `Tono: ${t.tono}`,
            t.cejilla !== undefined && `Cejilla ${t.cejilla}`,
            ...t.notas,
        ].filter(Boolean).join('\n'),
    }));

    // Lo que no es un tema va en una última ficha: notas del bolo, qué confirmar, qué llevar
    const notas = [
        generales.length && ['[El bolo]', ...generales].join('\n'),
        confirmar.length && ['[Confirmar]', ...confirmar].join('\n'),
        llevar.length && ['[Llevar]', llevar.join(' · ')].join('\n'),
    ].filter(Boolean).join('\n\n');
    if (notas) canciones.push({ titulo: 'Notas del bolo', artista: '', ficha: true, texto: notas });
    return canciones;
}

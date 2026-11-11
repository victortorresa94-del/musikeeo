// Lo que se pega desde una web de acordes (LaCuerda, Cifra Club, Ultimate Guitar…). Esas webs
// ponen la canción en un bloque de ancho fijo (<pre>) con los acordes marcados (<a>, <b>, <span>);
// al copiar con «Seleccionar todo» viene además todo lo de alrededor (menús, anuncios, comentarios)
// y, en algunas, el texto plano pierde los espacios que ponen cada acorde encima de su sílaba.
// Del HTML copiado nos quedamos con el bloque de la canción tal cual, espacios incluidos.

// El texto de la canción dentro del HTML copiado, o null si no hay un bloque claro
export function cancionDeHtml(html: string, Parser: { new(): DOMParser } = DOMParser): string | null {
    if (!/<pre[\s>]/i.test(html)) return null;
    const doc = new Parser().parseFromString(html, 'text/html');
    // El bloque más largo que tenga acordes: hay webs con varios <pre> (la canción y una tablatura)
    const bloques = [...doc.querySelectorAll('pre')]
        .map(p => (p.textContent ?? '').replace(/\u00a0/g, ' ').replace(/\r\n?/g, '\n'))
        .filter(t => t.trim().length > 20);
    if (!bloques.length) return null;
    // Varios bloques seguidos (estrofas en <pre> separados) van juntos, en orden
    const texto = bloques.length > 1 && bloques.every(b => b.length < 4000) ? bloques.join('\n\n') : bloques.sort((a, b) => b.length - a.length)[0];
    return texto.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}

// Lo que hay que usar de un evento de pegar: el bloque de la canción si viene en HTML; si no, el texto
export function textoPegado(datos: DataTransfer | null): string {
    if (!datos) return '';
    const html = datos.getData('text/html');
    const delHtml = html ? cancionDeHtml(html) : null;
    return delHtml ?? datos.getData('text/plain');
}

// El botón «Pegar»: el portapapeles con su HTML si el navegador lo deja (Safari y Chrome lo dan
// con read()), y si no, el texto. Lanza si no hay permiso (entonces se pega a mano)
export async function leerPortapapeles(): Promise<string> {
    const cp = navigator.clipboard as Clipboard & { read?: () => Promise<ClipboardItem[]> };
    if (cp.read) {
        try {
            for (const item of await cp.read()) {
                if (item.types.includes('text/html')) {
                    const html = await (await item.getType('text/html')).text();
                    const t = cancionDeHtml(html);
                    if (t) return t;
                }
                if (item.types.includes('text/plain')) return await (await item.getType('text/plain')).text();
            }
        } catch { /* sigue con readText */ }
    }
    return navigator.clipboard.readText();
}

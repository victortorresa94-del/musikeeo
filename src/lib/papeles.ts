// Los papeles de cada uno (Word, PDF de su Drive) con su canción del cancionero: «12 - COMO
// CAMARÓN» es «Como Camarón»; «1 - MUCHO MEJOR» es «Hace Calor (Mucho mejor)»; «Orgulli.pdf» es
// «Orgullo»; «10 - TU CALORRO + LA RAJA» son dos canciones juntas (un mix). Sin React.
import { claveTitulo } from './buscarCanciones';
import { detectarTono, leerAcorde, leerCancion, nombreTono, semitonosHacia } from './acordes';

// «12 - », «16/17 - », «01. », «3) », «04_» delante del título: el orden de la carpeta, no el nombre.
// Sin separador no se quita («19 días y 500 noches» es el título)
export function sinNumero(titulo: string): string {
    const t = titulo.replace(/^\s*\d{1,3}(?:\s*[/&y,]\s*\d{1,3})*\s*[-–—.)_:]\s*/i, '').trim();
    return t || titulo.trim();
}

// «COMO CAMARÓN» → «Como camarón» (un título entero en mayúsculas se lee mejor en frase)
export function enFrase(titulo: string): string {
    const letras = titulo.replace(/[^\p{L}]/gu, '');
    if (letras.length < 3 || letras !== letras.toUpperCase()) return titulo;
    const t = titulo.toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
}

// El título de un papel, listo para guardarlo: sin número y en frase
export const tituloDePapel = (titulo: string) => enFrase(sinNumero(titulo));

// Las canciones de un mix: «TU CALORRO + LA RAJA», «EL PERDON Y BAILANDO», «Dile / Bandolero».
// Solo se parte por « Y » si los dos lados son canciones que ya tienes (hay títulos con «y»)
export function partesDeMix(titulo: string): string[] {
    const t = sinNumero(titulo).replace(/^\s*mix\s*[:-]?\s*/i, '');
    const fuerte = t.split(/\s+(?:\+|&|\/)\s+|\s*\+\s*/).map(s => s.trim()).filter(Boolean);
    if (fuerte.length > 1) return fuerte;
    const conY = t.split(/\s+[yY]\s+/).map(s => s.trim()).filter(Boolean);
    return conY.length > 1 ? conY : [t];
}

// Distancia de edición pequeña («orgulli» / «orgullo»)
function casiIgual(a: string, b: string): boolean {
    if (Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < 6) return false;
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    const ra = a.slice(i), rb = b.slice(i);
    return ra.slice(1) === rb.slice(1) || ra.slice(1) === rb || ra === rb.slice(1);
}

// Las claves con las que se reconoce un título: el título sin paréntesis y lo de dentro del
// paréntesis («Hace Calor (Mucho mejor)» → «hace calor», «mucho mejor»)
function claves(titulo: string): string[] {
    const fuera = claveTitulo(titulo);
    const dentro = [...titulo.matchAll(/\(([^)]{3,})\)/g)].map(m => claveTitulo(m[1])).filter(Boolean);
    return [fuera, ...dentro].filter(Boolean);
}

export interface ConTitulo { id: string; titulo: string; version?: string }

// La canción que es ese papel, o null si no hay una sola clara. Por orden: mismo título o su
// alias entre paréntesis; casi igual (una letra); y el título del papel contenido en el de la
// canción («LA MADRE» → «La madre de José»), solo si es una y no son palabras sueltas cortas
export function cancionDelPapel<T extends ConTitulo>(papel: string, canciones: T[]): T | null {
    const k = claveTitulo(sinNumero(papel));
    if (!k) return null;
    const originales = canciones.filter(c => !c.version);
    const unica = (l: T[]) => (l.length === 1 ? l[0] : null);
    const exactas = originales.filter(c => claves(c.titulo).includes(k));
    if (exactas.length) return unica(exactas);
    const casi = originales.filter(c => claves(c.titulo).some(x => casiIgual(x, k)));
    if (casi.length) return unica(casi);
    if (k.length < 5) return null;
    const re = new RegExp(`(^| )${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`);
    return unica(originales.filter(c => claves(c.titulo).some(x => re.test(x))));
}

// ---------- El papel, en el tono de su ficha ----------

export interface TonoDelPapel {
    semitonos: number;                 // lo que hay que mover el papel (el texto no se reescribe)
    revisar: boolean;                  // dudoso: no se mueve y se marca «Revisar tono»
    de?: string; a?: string;           // «C» → «G», para el resumen
}

// Cuánto mover un papel para que suene en el tono de su ficha. El tono del papel se saca de sus
// acordes (las etiquetas escritas a mano fallan: «La Flaca — G» y es Am). Si la ficha lleva capo
// («Capo 2 · formas de Am») y el papel está en esas formas, no se mueve. Dudoso (sin acordes, otro
// modo, medio tono —suele ser una cejilla que falta en la ficha—): no se mueve y se avisa
export function tonoDelPapel(texto: string, tonoFicha?: string, capoFicha?: string): TonoDelPapel {
    const destino = tonoFicha ? leerAcorde(tonoFicha.trim().split(/\s+/)[0]) : null;
    const acordes = leerCancion(texto).acordes;
    if (!destino) return { semitonos: 0, revisar: false };
    const papel = acordes.length >= 3 ? detectarTono(acordes) : null;
    if (!papel) return { semitonos: 0, revisar: true };
    const menorDestino = /^m(?!aj)/.test(destino.calidad);
    const mod = (n: number) => ((n % 12) + 12) % 12;
    const de = nombreTono(papel, 0, 'americana', false);
    const capo = Number(/\d+/.exec(capoFicha ?? '')?.[0] ?? 0);
    if (capo && mod(papel.raiz + capo) === destino.raiz && papel.menor === menorDestino) return { semitonos: 0, revisar: false, de, a: de };
    if (papel.menor !== menorDestino) return { semitonos: 0, revisar: true, de };
    const s = semitonosHacia(acordes, destino);
    const diferencia = ((mod(destino.raiz - papel.raiz) + 5) % 12) - 5;
    if (s !== diferencia || Math.abs(s) === 1) return { semitonos: 0, revisar: true, de };
    return { semitonos: s, revisar: false, de, a: nombreTono(papel, s, 'americana', false) };
}

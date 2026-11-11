// Pruebas de src/lib/papeles.ts con títulos reales de los papeles de Víctor (11-nov-2026).
// node_modules/.bin/esbuild scripts/importar/papeles.test.ts --bundle --platform=node | node
import { cancionDelPapel, partesDeMix, sinNumero, tituloDePapel } from '../../src/lib/papeles';

const fichas = ['Hace Calor (Mucho mejor)', 'La madre de José', 'Sin documentos', 'Como Camarón', 'Tu Calorro',
    'Por la raja de tu falda', 'No puedo vivir sin ti', 'Vivir mi vida', 'La vida es un carnaval', 'Orgullo',
    'Yo romperé tus fotos (Para no verte más)', 'El perdón', 'Bailando', 'Petardos', 'Nada de esto fue un error', 'Dile']
    .map((titulo, i) => ({ id: String(i), titulo }));
fichas.push({ id: 'v', titulo: 'Tu Calorro', version: 'Mafe' } as never);

let mal = 0;
const igual = (a: unknown, b: unknown, que: string) => {
    if (JSON.stringify(a) !== JSON.stringify(b)) { mal++; console.log('✗', que, '→', JSON.stringify(a), 'esperaba', JSON.stringify(b)); }
    else console.log('✓', que);
};
const t = (p: string) => cancionDelPapel(p, fichas)?.titulo ?? null;

igual(sinNumero('12 - COMO CAMARÓN'), 'COMO CAMARÓN', 'número');
igual(sinNumero('16/17 - EL PERDON Y BAILANDO'), 'EL PERDON Y BAILANDO', 'número doble');
igual(sinNumero('19 - PETARDOS'), 'PETARDOS', 'número 19');
igual(sinNumero('19 días y 500 noches'), '19 días y 500 noches', 'no quita números del título');
igual(tituloDePapel('4 - LA MADRE DE JOSE'), 'La madre de jose', 'en frase');
igual(t('1 - MUCHO MEJOR'), 'Hace Calor (Mucho mejor)', 'alias entre paréntesis');
igual(t('PARA NO VERTE MAS'), 'Yo romperé tus fotos (Para no verte más)', 'alias 2');
igual(t('12 - COMO CAMARÓN'), 'Como Camarón', 'mayúsculas y acento');
igual(t('Orgulli'), 'Orgullo', 'una letra');
igual(t('4 - LA MADRE DE JOSE'), 'La madre de José', 'sin tilde');
igual(t('LA MADRE'), 'La madre de José', 'contenido');
igual(t('VIVIR SIN TI'), 'No puedo vivir sin ti', 'contenido al final');
igual(t('LA RAJA'), 'Por la raja de tu falda', 'contenido en medio');
igual(t('CARNAVAL'), 'La vida es un carnaval', 'una palabra larga');
igual(t('Nada de esto '), 'Nada de esto fue un error', 'nombre de archivo cortado');
igual(t('TU CALORRO'), 'Tu Calorro', 'no se va a la versión');
igual(t('BAD BUNNY'), null, 'un artista no es una canción');
igual(t('VIVIR'), null, 'palabra corta y ambigua');
igual(partesDeMix('10 - TU CALORRO + LA RAJA'), ['TU CALORRO', 'LA RAJA'], 'mix con +');
igual(partesDeMix('16/17 - EL PERDON Y BAILANDO'), ['EL PERDON', 'BAILANDO'], 'mix con Y');
igual(partesDeMix('18 - VIVIR MI VIDA + CARNAVAL').map(t), ['Vivir mi vida', 'La vida es un carnaval'], 'mix casado');
igual(partesDeMix('19 - PETARDOS'), ['PETARDOS'], 'no es mix');
console.log(mal ? `${mal} fallos` : 'todo bien');
process.exit(mal ? 1 : 0);

// Pruebas del catálogo (13-nov-2026): columnas propias, unir fichas y la copia .json con colores y columnas.
// node_modules/.bin/esbuild scripts/importar/catalogo.test.ts --bundle --platform=node | node
import { crearCopia, leerCopia, unirFichas } from '../../src/lib/biblioteca';
import { conExtra, etiquetasExtra, leerExtra, opcionesExtra, ordenExtra, textoExtra, valorExtra } from '../../src/lib/camposPropios';
import type { CampoPropio } from '../../src/services/catalogoService';
import type { Cancion } from '../../src/types/cancionero';

let fallos = 0;
const igual = (nombre: string, a: unknown, b: unknown) => {
    const ok = JSON.stringify(a) === JSON.stringify(b);
    if (!ok) fallos++;
    console.log(`${ok ? '✓' : '✗'} ${nombre}${ok ? '' : `\n   esperaba ${JSON.stringify(b)}\n   salió    ${JSON.stringify(a)}`}`);
};

const base = (id: string, extra?: Cancion['ficha']): Cancion => ({
    id, titulo: `Tema ${id}`, artista: '', texto: 'C G\nLetra', ajustes: { semitonos: 0, cejilla: 0, tamano: 18, columnas: 1 } as Cancion['ajustes'],
    creadaEn: '2026-11-13T10:00:00Z', actualizadaEn: '2026-11-13T10:00:00Z', ficha: extra,
});
const ensayada: CampoPropio = { id: 'c1', nombre: 'Ensayada', tipo: 'casilla' };
const coros: CampoPropio = { id: 'c2', nombre: 'Coros', tipo: 'etiqueta', opciones: ['Mafe'] };
const nota: CampoPropio = { id: 'c3', nombre: 'Nota', tipo: 'texto' };
const puntos: CampoPropio = { id: 'c4', nombre: 'Puntos', tipo: 'numero' };

// Poner y quitar valores
let c = base('1');
c = conExtra(c, 'c1', true);
c = conExtra(c, 'c2', ['Víctor', 'Mafe']);
c = conExtra(c, 'c3', leerExtra('  Entra la batería  ', 'texto'));
c = conExtra(c, 'c4', leerExtra('7,5', 'numero'));
igual('valores puestos', c.ficha?.extra, { c1: true, c2: ['Víctor', 'Mafe'], c3: 'Entra la batería', c4: 7.5 });
igual('casilla leída', valorExtra(c, ensayada), true);
igual('etiquetas leídas', etiquetasExtra(c, coros), ['Víctor', 'Mafe']);
igual('número como texto (coma)', textoExtra(c, puntos), '7,5');
igual('un número que no es número no se guarda', leerExtra('mucho', 'numero'), undefined);
igual('orden de la casilla (marcada primero)', [ordenExtra(c, ensayada), ordenExtra(base('2'), ensayada)], [0, 1]);
igual('opciones: las guardadas y las usadas, sin repetir', opcionesExtra([c, base('2')], coros), ['Mafe', 'Víctor']);
let sin = conExtra(c, 'c1', false);
sin = conExtra(sin, 'c2', []);
sin = conExtra(sin, 'c3', undefined);
sin = conExtra(sin, 'c4', undefined);
igual('quitar todo deja la ficha sin extra', sin.ficha, undefined);
igual('un valor de otro tipo no cuenta (texto en una casilla)', valorExtra(base('3', { extra: { c1: 'sí' } }), ensayada), undefined);

// Unir fichas: las columnas se suman, no se pisan
igual('unir fichas suma columnas', unirFichas({ tono: 'G', extra: { c1: true } }, { estilo: 'Rumba', extra: { c3: 'Ojo al final' } }),
    { tono: 'G', extra: { c1: true, c3: 'Ojo al final' }, estilo: 'Rumba' });

// La copia lleva el catálogo y vuelve igual
const catalogo = { aspecto: { 'grupo:lady jarana': { nombre: 'Lady Jarana', color: 'menta', imagen: 'data:image/webp;base64,AAAA' } }, campos: [ensayada, coros] };
const copia = crearCopia([c], [], catalogo);
const leida = leerCopia(JSON.stringify(copia));
igual('la copia trae el catálogo', leida?.catalogo, catalogo);
igual('la canción conserva sus columnas', leida?.canciones[0].ficha?.extra, c.ficha?.extra);
igual('sin catálogo, la copia no lo lleva', 'catalogo' in crearCopia([c], [], { aspecto: {}, campos: [] }), false);
// Dos copias seguidas: se juntan los catálogos
const otra = crearCopia([base('9')], [], { aspecto: { 'estilo:rumba': { color: 'rosa' } }, campos: [nota] });
const juntas = leerCopia(`${JSON.stringify(copia)}\n---\n${JSON.stringify(otra)}`);
igual('dos copias: aspecto junto', Object.keys(juntas?.catalogo?.aspecto ?? {}), ['grupo:lady jarana', 'estilo:rumba']);
igual('dos copias: columnas juntas', (juntas?.catalogo?.campos as CampoPropio[] | undefined)?.map(x => x.nombre), ['Ensayada', 'Coros', 'Nota']);

console.log(fallos ? `\n${fallos} fallos` : '\nTodo bien');
process.exit(fallos ? 1 : 0);

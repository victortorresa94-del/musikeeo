// Pruebas del bolo (13-nov-2026): título y hora del repertorio, horario con los sets, teléfono,
// el paquete del enlace (ida y vuelta) y la copia .json con bolos.
// node_modules/.bin/esbuild scripts/importar/bolo.test.ts --bundle --platform=node '--define:import.meta.env={"MODE":"test"}' | node
import { codificar } from '../../src/lib/compartir';
import { descodificarBolo, duracionSet, horarioCompleto, nombreEnBolo, paqueteBolo, sanearBolo, telefonoLimpio, tituloYHoraDe } from '../../src/lib/compartirBolo';
import { crearCopia, leerCopia } from '../../src/lib/biblioteca';
import type { Bolo, Cancion, Repertorio } from '../../src/types/cancionero';

let fallos = 0;
const igual = (nombre: string, a: unknown, b: unknown) => {
    const ok = JSON.stringify(a) === JSON.stringify(b);
    if (!ok) fallos++;
    console.log(`${ok ? '✓' : '✗'} ${nombre}${ok ? '' : `\n   esperaba ${JSON.stringify(b)}\n   salió    ${JSON.stringify(a)}`}`);
};

igual('título y hora del nombre', tituloYHoraDe('Lady Jarana · RTF Pallejà 12:30'), { titulo: 'Lady Jarana · RTF Pallejà', hora: '12:30' });
igual('hora con «h»', tituloYHoraDe('Cataleya · Pallejà 19h00'), { titulo: 'Cataleya · Pallejà', hora: '19:00' });
igual('sin hora', tituloYHoraDe('Boda Castillo de Lloret'), { titulo: 'Boda Castillo de Lloret' });
igual('teléfono español', telefonoLimpio('600 12 34 56'), { tel: '+34600123456', whatsapp: 'https://wa.me/34600123456' });
igual('teléfono con prefijo', telefonoLimpio('+33 6 12 34 56 78'), { tel: '+33612345678', whatsapp: 'https://wa.me/33612345678' });
igual('teléfono que no lo es', telefonoLimpio('llamar a Pepe'), null);

const ajustes = { semitonos: 0, cejilla: 0, notacion: 'original', alteraciones: 'auto', tamano: 17, columnas: 1, ajustar: false, vista: 'completa', velocidad: 18 } as Cancion['ajustes'];
const cancion = (id: string, titulo: string, duracion?: number): Cancion => ({ id, titulo, artista: '', texto: 'G C\nLetra de prueba', ajustes, creadaEn: '', actualizadaEn: '', ...(duracion ? { duracion } : {}) });
const canciones = [cancion('c1', 'Hace calor', 240), cancion('c2', 'Bamboléo'), cancion('c3', 'Sin documentos', 300)];
const repertorios: Repertorio[] = [
    { id: 'r1', nombre: 'Lady Jarana · RTF Pallejà 12:30', fecha: '2026-11-14', canciones: ['c1', 'c2'], hueco: 60, creadaEn: '', actualizadaEn: '' },
    { id: 'r2', nombre: 'Cataleya · RTF Pallejà 19:00', fecha: '2026-11-14', canciones: ['c3'], creadaEn: '', actualizadaEn: '' },
];
const bolo: Bolo = {
    id: 'b1', titulo: 'RTF Pallejà', fecha: '2026-11-14', lugar: 'Plaza de la Vila', direccion: 'Plaça de la Vila, Pallejà',
    horario: [{ hora: '11:00', que: 'Llegada y montaje' }, { hora: '', que: 'Fotos' }, { hora: '18:00', que: 'Prueba de sonido' }],
    sets: [{ repertorioId: 'r2', hora: '19:00' }, { repertorioId: 'r1', hora: '12:30' }, { repertorioId: 'borrado' }],
    contacto: 'Marta', telefono: '600123456', notas: 'Aparcar detrás', creadaEn: '', actualizadaEn: '',
};

const p = paqueteBolo(bolo, repertorios, canciones, false);
igual('sets en el orden del bolo, sin el que no existe', p.s.map(s => [s.n, s.hi ?? null, s.hu ?? null]), [['Cataleya · RTF Pallejà 19:00', '19:00', null], ['Lady Jarana · RTF Pallejà 12:30', '12:30', 60]]);
igual('duración del set (una sin duración = 3:30)', duracionSet(p.s[1]), { segundos: 240 + 210, aprox: true });
igual('horario con los sets dentro, por hora', horarioCompleto(p).map(m => `${m.hora || '—'} ${m.que}${m.hasta ? ` → ${m.hasta}` : ''}`),
    ['11:00 Llegada y montaje', '12:30 Lady Jarana → 12:38', '18:00 Prueba de sonido', '19:00 Cataleya → 19:05', '— Fotos']);
igual('el set sin la hora ni el bolo', [nombreEnBolo('Lady Jarana · RTF Pallejà 12:30', 'RTF Pallejà'), nombreEnBolo('Boda 18:00', 'Boda'), nombreEnBolo('Set acústico', 'RTF Pallejà')],
    ['Lady Jarana', 'Boda', 'Set acústico']);
const vuelta = descodificarBolo(codificar({ ...p, u: '2026-11-13T20:00:00Z' }));
igual('ida y vuelta del enlace', vuelta && { n: vuelta.n, lu: vuelta.lu, di: vuelta.di, co: vuelta.co, te: vuelta.te, no: vuelta.no, sets: vuelta.s.length, temas: vuelta.s[1].c.map(t => t.t), u: vuelta.u },
    { n: 'RTF Pallejà', lu: 'Plaza de la Vila', di: 'Plaça de la Vila, Pallejà', co: 'Marta', te: '600123456', no: 'Aparcar detrás', sets: 2, temas: ['Hace calor', 'Bamboléo'], u: '2026-11-13T20:00:00Z' });
igual('un set no se lee como bolo', sanearBolo({ v: 1, n: 'Set', c: [] }), null);
igual('lo que no es texto se queda fuera', sanearBolo({ ...p, co: 42, ho: [{ hora: 9, que: 'Llegada' }, 'basura'] })?.ho, [{ hora: '', que: 'Llegada' }]);

// La copia .json lleva los bolos y vuelve igual
const copia = crearCopia(canciones, repertorios, undefined, [bolo]);
igual('la copia apunta a los repertorios por posición', copia.bolos?.[0].sets, [{ repertorio: 1, hora: '19:00' }, { repertorio: 0, hora: '12:30' }]);
const leida = leerCopia(JSON.stringify(copia));
igual('la copia trae el bolo', leida?.bolos?.[0] && { t: leida.bolos[0].titulo, l: leida.bolos[0].lugar, h: leida.bolos[0].horario?.length, s: leida.bolos[0].sets.length }, { t: 'RTF Pallejà', l: 'Plaza de la Vila', h: 3, s: 2 });
igual('un set que apunta fuera de la copia se descarta', leerCopia(JSON.stringify({ ...copia, bolos: [{ titulo: 'X', sets: [{ repertorio: 9 }] }] }))?.bolos?.[0].sets, []);
const otra = crearCopia([cancion('c9', 'Otra')], [{ id: 'r9', nombre: 'Otro set', fecha: '', canciones: ['c9'], creadaEn: '', actualizadaEn: '' }], undefined,
    [{ ...bolo, id: 'b2', titulo: 'Otro bolo', sets: [{ repertorioId: 'r9' }] }]);
const juntas = leerCopia(`${JSON.stringify(copia)}\n---\n${JSON.stringify(otra)}`);
igual('dos copias: los sets del segundo bolo apuntan a su repertorio', juntas?.bolos?.map(b => b.sets.map(s => juntas.repertorios[s.repertorio].nombre)),
    [['Cataleya · RTF Pallejà 19:00', 'Lady Jarana · RTF Pallejà 12:30'], ['Otro set']]);

console.log(fallos ? `\n${fallos} fallos` : '\nTodo bien');
process.exit(fallos ? 1 : 0);

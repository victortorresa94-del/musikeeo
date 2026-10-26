// 25 musikeers repartidos por Barcelona en el EMULADOR (nunca producción), para ver el mapa:
//   npx --yes tsx scripts/mapa/sembrar-emulador.ts
// Cada uno con su cuenta y escribiendo su mapa/{uid} con su propia sesión (pasa por las reglas).
// Como en la app, la posición «exacta» (al azar dentro del barrio) solo sirve para sacar la celda.
// Entra en la app con yo@mapa.musikeeo.test / mapa-musikeeo (músico de Gràcia, aún sin aparecer).
import { writeFileSync } from 'node:fs';
import { codificar } from '../../src/lib/geohash';
import { finDeAhora, zonaDe } from '../../src/lib/mapa';
import { crearCuenta, escribir, vaciar } from './emulador';

const CLAVE = 'mapa-musikeeo';
const BARRIOS = {
    gracia: [41.4036, 2.1567], raval: [41.3800, 2.1690], poblesec: [41.3730, 2.1600], sants: [41.3755, 2.1370],
    born: [41.3860, 2.1820], eixample: [41.3880, 2.1600], poblenou: [41.4030, 2.2010], santantoni: [41.3790, 2.1620],
    sagrada: [41.4040, 2.1750], lescorts: [41.3850, 2.1310], horta: [41.4310, 2.1600], gotic: [41.3830, 2.1770],
} as const;

type Papel = 'musico' | 'tecnico' | 'sala' | 'tienda' | 'otro';
interface Persona { slug: string; nombre: string; papel: Papel; barrio: keyof typeof BARRIOS; etiquetas: string[]; foto?: string; ahora?: 'si' | 'caducado' }

const P: Persona[] = [
    { slug: 'rumba-sur', nombre: 'Rumba Sur', papel: 'musico', barrio: 'gracia', etiquetas: ['Rumba', 'Guitarra', 'Cajón'], foto: 'rumba-sur', ahora: 'si' },
    { slug: 'lucia-ferrer', nombre: 'Lucía Ferrer', papel: 'musico', barrio: 'gracia', etiquetas: ['Voz', 'Pop', 'Bodas'], foto: 'lucia-ferrer' },
    { slug: 'marta-vidal', nombre: 'Marta Vidal', papel: 'musico', barrio: 'gracia', etiquetas: ['Violín', 'Clásica'], foto: 'marta-vidal' },
    { slug: 'velvet-jam', nombre: 'Velvet Jam', papel: 'musico', barrio: 'raval', etiquetas: ['Soul', 'Funk'], foto: 'velvet-jam', ahora: 'si' },
    { slug: 'toni-cortes', nombre: 'Toni Cortés', papel: 'musico', barrio: 'poblesec', etiquetas: ['Flamenco', 'Guitarra'], foto: 'toni-cortes' },
    { slug: 'quartet-nocturn', nombre: 'Quartet Nocturn', papel: 'musico', barrio: 'eixample', etiquetas: ['Jazz', 'Contrabajo'], foto: 'quartet-nocturn' },
    { slug: 'sara-llop', nombre: 'Sara Llop', papel: 'musico', barrio: 'born', etiquetas: ['DJ', 'House'], foto: 'sara-llop' },
    { slug: 'los-tremendos', nombre: 'Los Tremendos', papel: 'musico', barrio: 'sants', etiquetas: ['Orquesta', 'Versiones'], foto: 'los-tremendos' },
    { slug: 'pau-bateria', nombre: 'Pau Batería', papel: 'musico', barrio: 'santantoni', etiquetas: ['Batería', 'Rock'], ahora: 'si' },
    { slug: 'nuria-teclas', nombre: 'Núria Teclas', papel: 'musico', barrio: 'poblenou', etiquetas: ['Teclados', 'Pop'] },
    { slug: 'kike-bajo', nombre: 'Kike Bajo', papel: 'musico', barrio: 'gotic', etiquetas: ['Bajo', 'Reggae'] },
    { slug: 'irene-saxo', nombre: 'Irene Saxo', papel: 'musico', barrio: 'sagrada', etiquetas: ['Saxo', 'Jazz'], ahora: 'caducado' },
    { slug: 'ruido-blanco', nombre: 'Ruido Blanco', papel: 'tecnico', barrio: 'poblesec', etiquetas: ['PA 2 kW', 'Monitores'], foto: 'ruido-blanco', ahora: 'si' },
    { slug: 'marc-soler', nombre: 'Marc Soler', papel: 'tecnico', barrio: 'gracia', etiquetas: ['Sonido', 'Luces'], foto: 'marc-soler' },
    { slug: 'luz-y-sonido-raval', nombre: 'Luz y Sonido Raval', papel: 'tecnico', barrio: 'raval', etiquetas: ['Iluminación', 'Backline'] },
    { slug: 'jordi-backline', nombre: 'Jordi Backline', papel: 'tecnico', barrio: 'sants', etiquetas: ['Backline', 'Cables'], ahora: 'si' },
    { slug: 'eva-microfonia', nombre: 'Eva Microfonía', papel: 'tecnico', barrio: 'lescorts', etiquetas: ['Micros', 'Grabación'] },
    { slug: 'sergi-mesas', nombre: 'Sergi Mesas', papel: 'tecnico', barrio: 'horta', etiquetas: ['Mesa digital', 'Sonido'] },
    { slug: 'la-fragua', nombre: 'La Fragua', papel: 'sala', barrio: 'poblenou', etiquetas: ['Sala de conciertos'], foto: 'la-fragua' },
    { slug: 'el-tranvia', nombre: 'El Tranvía', papel: 'sala', barrio: 'gracia', etiquetas: ['Bar con música'], foto: 'el-tranvia' },
    { slug: 'bodas-mediterraneo', nombre: 'Bodas Mediterráneo', papel: 'sala', barrio: 'eixample', etiquetas: ['Bodas y eventos'], foto: 'bodas-mediterraneo' },
    { slug: 'guitarras-gracia', nombre: 'Guitarras Gràcia', papel: 'tienda', barrio: 'gracia', etiquetas: ['Guitarras', 'Cuerdas'], foto: 'guitarras-gracia' },
    { slug: 'cables-y-pedales', nombre: 'Cables y Pedales', papel: 'tienda', barrio: 'santantoni', etiquetas: ['Cables', 'Pedales', 'Alquiler'] },
    { slug: 'baterias-born', nombre: 'Baterías Born', papel: 'tienda', barrio: 'born', etiquetas: ['Batería', 'Platos'] },
    { slug: 'aina-boda', nombre: 'Aina Puig', papel: 'otro', barrio: 'sagrada', etiquetas: [] },
];

// Al azar pero repetible
let semilla = 7;
const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const MODO = { musico: 'musician', tecnico: 'provider', tienda: 'provider', sala: 'organizer', otro: 'organizer' } as const;

await vaciar();
const ahora = Date.now();
const salida: Record<string, unknown>[] = [];

for (const p of P) {
    const c = await crearCuenta(`${p.slug}@mapa.musikeeo.test`, CLAVE, p.nombre);
    const foto = p.foto ? `/seed/${p.foto}-avatar.webp` : '';
    const perfil = {
        uid: c.uid, displayName: p.nombre, photoURL: foto, primaryMode: MODO[p.papel],
        activeModes: { musician: p.papel === 'musico', organizer: MODO[p.papel] === 'organizer', provider: MODO[p.papel] === 'provider' },
        location: 'Barcelona', skills: p.etiquetas, createdAt: new Date(ahora).toISOString(),
    };
    await escribir(`users/${c.uid}`, { ...perfil, email: c.email, onboardingCompleted: true }, 'owner');
    await escribir(`publicProfiles/${c.uid}`, perfil, 'owner');

    // La «posición exacta» se queda aquí: solo sale la celda
    const [la, ln] = BARRIOS[p.barrio];
    const geohash = codificar(la + (azar() - 0.5) * 0.006, ln + (azar() - 0.5) * 0.008);
    const mapa = {
        uid: c.uid, nombre: p.nombre, foto, papel: p.papel, etiquetas: p.etiquetas, zona: zonaDe(geohash, 'Barcelona'), geohash,
        ahora: p.ahora === 'si', caduca: p.ahora === 'si' ? new Date(finDeAhora(ahora) - Math.floor(azar() * 3) * 3600_000) : null,
    };
    if (p.ahora === 'caducado') {
        // Lo que queda en Firestore cuando pasan las 4 h (las reglas no dejan escribirlo así: se prepara saltándolas)
        const r = await escribir(`mapa/${c.uid}`, { ...mapa, ahora: true, caduca: new Date(ahora - 10 * 60_000), actualizado: new Date(ahora - 4 * 3600_000) }, 'owner');
        if (!r.ok) throw new Error(r.texto);
    } else {
        const r = await escribir(`mapa/${c.uid}`, mapa, c.token, ['actualizado']);
        if (!r.ok) throw new Error(`${p.slug}: ${r.texto}`);
    }
    salida.push({ uid: c.uid, slug: p.slug, nombre: p.nombre, papel: p.papel, geohash, zona: mapa.zona, ahora: p.ahora || 'no' });
}

// Quien entra en la app: músico de Gràcia, todavía fuera del mapa
const yo = await crearCuenta('yo@mapa.musikeeo.test', CLAVE, 'Víctor Prueba');
const perfilYo = {
    uid: yo.uid, displayName: 'Víctor Prueba', photoURL: '', primaryMode: 'musician',
    activeModes: { musician: true, organizer: false, provider: false }, location: 'Barcelona', skills: ['Guitarra'], createdAt: new Date(ahora).toISOString(),
};
await escribir(`users/${yo.uid}`, { ...perfilYo, email: yo.email, onboardingCompleted: true }, 'owner');
await escribir(`publicProfiles/${yo.uid}`, perfilYo, 'owner');
await escribir(`artists/artist_${yo.uid}`, {
    id: `artist_${yo.uid}`, slug: 'victor-prueba', userId: yo.uid, artistName: 'Víctor y la Rumba', profilePhoto: '/seed/rumba-sur-avatar.webp',
    isVerified: false, city: 'Barcelona', country: 'España', bio: '', genres: ['Rumba', 'Pop'], tags: ['guitarra'], rating: 0, reviewCount: 0,
    gigsCompleted: 0, packages: [], multimedia: { videos: [], photos: [] }, availability: [], isPublic: true, profileCompleteness: 60,
    createdAt: new Date(ahora).toISOString(), updatedAt: new Date(ahora).toISOString(),
}, 'owner');

const fichero = process.env.SEMILLA_SALIDA;
if (fichero) writeFileSync(fichero, JSON.stringify({ yo: { uid: yo.uid, email: yo.email, clave: CLAVE }, personas: salida }, null, 2));
const cuenta = (f: (x: Record<string, unknown>) => boolean) => salida.filter(f).length;
console.log(`${salida.length} musikeers sembrados: ${cuenta(x => x.papel === 'musico')} músicos, ${cuenta(x => x.papel === 'tecnico')} técnicos, ${cuenta(x => x.papel === 'sala')} salas, ${cuenta(x => x.papel === 'tienda')} tiendas, ${cuenta(x => x.papel === 'otro')} otro`);
console.log(`«Estoy aquí ahora»: ${cuenta(x => x.ahora === 'si')} (y ${cuenta(x => x.ahora === 'caducado')} caducado, que no debe salir)`);
console.log(`Entra con ${yo.email} / ${CLAVE}`);

// Reglas de mapa/{uid} en el emulador de Firestore (firestore.rules):
//   npx --yes firebase-tools emulators:start --only auth,firestore --project demo-musikeeo
//   npx --yes tsx scripts/mapa/probar-reglas.ts
import assert from 'node:assert/strict';
import { codificar } from '../../src/lib/geohash';
import { borrar, consultar, crearCuenta, escribir, leer, vaciar } from './emulador';

let pasadas = 0;
const prueba = async (nombre: string, fn: () => Promise<void>) => {
    try { await fn(); pasadas++; console.log(`  ✓ ${nombre}`); } catch (e) { console.error(`  ✗ ${nombre}`); throw e; }
};

await vaciar();
const ana = await crearCuenta('ana@reglas.musikeeo.test', 'reglas-musikeeo', 'Ana');
const bea = await crearCuenta('bea@reglas.musikeeo.test', 'reglas-musikeeo', 'Bea');

const ficha = (uid: string, extra: Record<string, unknown> = {}) => ({
    uid, nombre: 'Ana Rumba', foto: '', papel: 'musico', etiquetas: ['Guitarra', 'Rumba'], zona: 'Gràcia, Barcelona',
    geohash: codificar(41.4036, 2.1567), ahora: false, caduca: null, ...extra,
}) as Record<string, never>;
const pon = (uid: string, token: string | null, extra: Record<string, unknown> = {}) => escribir(`mapa/${uid}`, ficha(uid, extra), token, ['actualizado']);
const en = (min: number) => new Date(Date.now() + min * 60_000);

console.log('Escribir');
await prueba('cada uno escribe el suyo (zona fija)', async () => {
    const r = await pon(ana.uid, ana.token);
    assert.ok(r.ok, r.texto);
});
await prueba('sin sesión no se escribe', async () => { assert.equal((await pon(ana.uid, null)).status, 403); });
await prueba('nadie escribe el de otro', async () => { assert.equal((await pon(bea.uid, ana.token)).status, 403); });
await prueba('geohash de más de 6 letras: no (más precisión de la cuenta)', async () => {
    assert.equal((await pon(ana.uid, ana.token, { geohash: codificar(41.4036, 2.1567, 7) })).status, 403);
    assert.equal((await pon(ana.uid, ana.token, { geohash: codificar(41.4036, 2.1567, 12) })).status, 403);
});
await prueba('geohash con letras que no existen (a, i, l, o): no', async () => {
    assert.equal((await pon(ana.uid, ana.token, { geohash: 'sp3eia' })).status, 403);
});
await prueba('ni latitud ni longitud ni ningún campo de más', async () => {
    assert.equal((await pon(ana.uid, ana.token, { lat: 41.4036 })).status, 403);
    assert.equal((await pon(ana.uid, ana.token, { direccion: 'Carrer de Verdi 12' })).status, 403);
});
await prueba('como mucho 3 etiquetas, cortas', async () => {
    assert.equal((await pon(ana.uid, ana.token, { etiquetas: ['a', 'b', 'c', 'd'] })).status, 403);
    assert.equal((await pon(ana.uid, ana.token, { etiquetas: ['x'.repeat(25)] })).status, 403);
    assert.ok((await pon(ana.uid, ana.token, { etiquetas: ['a', 'b', 'c'] })).ok);
});
await prueba('textos cortos: nombre ≤ 60, zona ≤ 60; papel de la lista', async () => {
    assert.equal((await pon(ana.uid, ana.token, { nombre: 'x'.repeat(61) })).status, 403);
    assert.equal((await pon(ana.uid, ana.token, { nombre: '' })).status, 403);
    assert.equal((await pon(ana.uid, ana.token, { zona: 'x'.repeat(61) })).status, 403);
    assert.equal((await pon(ana.uid, ana.token, { papel: 'admin' })).status, 403);
});
await prueba('«Estoy aquí ahora»: con hora de fin, futura y como mucho a 4 h', async () => {
    assert.ok((await pon(ana.uid, ana.token, { ahora: true, caduca: en(240) })).ok);
    assert.equal((await pon(ana.uid, ana.token, { ahora: true, caduca: en(300) })).status, 403, '5 h');
    assert.equal((await pon(ana.uid, ana.token, { ahora: true, caduca: en(-1) })).status, 403, 'ya pasada');
    assert.equal((await pon(ana.uid, ana.token, { ahora: true, caduca: null })).status, 403, 'sin fin');
    assert.equal((await pon(ana.uid, ana.token, { ahora: false, caduca: en(60) })).status, 403, 'zona fija con fin');
});
await prueba('«actualizado» lo pone el servidor, no el móvil', async () => {
    const r = await escribir(`mapa/${ana.uid}`, { ...ficha(ana.uid), actualizado: new Date() }, ana.token);
    assert.equal(r.status, 403);
});

console.log('Leer');
await pon(bea.uid, bea.token, { nombre: 'Bea Técnica', papel: 'tecnico', geohash: codificar(41.3797, 2.1682) });
await prueba('sin sesión no se lee (ni uno ni la lista)', async () => {
    assert.equal((await leer(`mapa/${ana.uid}`, null)).status, 403);
    assert.equal((await consultar('sp3e', null)).status, 403);
});
await prueba('con sesión se lee el de otro y la zona', async () => {
    const r = await leer(`mapa/${bea.uid}`, ana.token);
    assert.ok(r.ok);
    assert.equal(r.datos?.nombre, 'Bea Técnica');
    const q = await consultar('sp3e', ana.token);
    assert.ok(q.ok);
    assert.deepEqual(q.docs.sort(), [ana.uid, bea.uid].sort());
});
await prueba('la lista pide límite (≤ 300): no se puede bajar todo de golpe', async () => {
    assert.equal((await consultar('', ana.token, null)).status, 403);
    assert.equal((await consultar('', ana.token, 1000)).status, 403);
    assert.ok((await consultar('', ana.token, 300)).ok);
});

console.log('Borrar');
await prueba('nadie borra el de otro', async () => { assert.equal((await borrar(`mapa/${bea.uid}`, ana.token)).status, 403); });
await prueba('sin sesión no se borra', async () => { assert.equal((await borrar(`mapa/${ana.uid}`, null)).status, 403); });
await prueba('cada uno borra el suyo', async () => {
    assert.ok((await borrar(`mapa/${ana.uid}`, ana.token)).ok);
    assert.equal((await leer(`mapa/${ana.uid}`, bea.token)).status, 404);
});

await vaciar();
console.log(`\n${pasadas} pruebas de reglas, todas bien.`);

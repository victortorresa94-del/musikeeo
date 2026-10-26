// Pruebas del mapa de musikeers sin React ni Firebase: geohash, redondeo a la celda,
// desplazamiento estable, caducidad, recuento, filtros, agrupar y zonas con nombre.
//   npx --yes tsx scripts/mapa/probar-mapa.ts
import assert from 'node:assert/strict';
import {
    caja, celdasQueCubren, centro, codificar, esGeohash, finDeRango, prefijosParaVista, tamanoCelda, type Caja,
} from '../../src/lib/geohash';
import {
    DESPLAZAMIENTO_MAX, DURACION_AHORA_MS, agrupar, caducado, centroDeCiudad, contar, desplazamiento, etiquetasDe,
    filtrar, finDeAhora, fotoSegura, leerPunto, limpiarEtiquetas, papelDe, posicionEnMapa, textoRecuento, visible, zonaDe,
    type DatosPerfil, type PuntoMapa,
} from '../../src/lib/mapa';

let pasadas = 0;
const prueba = (nombre: string, fn: () => void) => {
    try { fn(); pasadas++; console.log(`  ✓ ${nombre}`); } catch (e) { console.error(`  ✗ ${nombre}`); throw e; }
};
const dentroDe = (c: Caja, p: { lat: number; lng: number }) => p.lat >= c.sur && p.lat <= c.norte && p.lng >= c.oeste && p.lng <= c.este;
// Números al azar pero repetibles
let semilla = 42;
const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);

console.log('Geohash');
prueba('el ejemplo clásico (Wikipedia): 57.64911, 10.40744 → u4pruydqqvj', () => {
    assert.equal(codificar(57.64911, 10.40744, 11), 'u4pruydqqvj');
    assert.equal(codificar(57.64911, 10.40744), 'u4pruy'); // 6 letras por defecto
});
prueba('ezs42 se descodifica en ~42,605, −5,603', () => {
    const c = centro('ezs42');
    assert.ok(Math.abs(c.lat - 42.605) < 0.03 && Math.abs(c.lng + 5.603) < 0.03, JSON.stringify(c));
});
prueba('celda de 6 letras: 0,0055° × 0,011° (~610 m × ~0,9 km en Barcelona)', () => {
    const t = tamanoCelda(6);
    assert.equal(t.lat, 180 / 2 ** 15);
    assert.equal(t.lng, 360 / 2 ** 15);
    const c = caja(codificar(41.4036, 2.1567));
    assert.ok(Math.abs((c.norte - c.sur) - t.lat) < 1e-12 && Math.abs((c.este - c.oeste) - t.lng) < 1e-12);
});
prueba('el punto cae siempre dentro de su celda (2.000 puntos)', () => {
    for (let i = 0; i < 2000; i++) {
        const lat = 36 + azar() * 8, lng = -9 + azar() * 13;
        const h = codificar(lat, lng);
        assert.equal(h.length, 6);
        assert.ok(esGeohash(h));
        assert.ok(dentroDe(caja(h), { lat, lng }), `${lat},${lng} → ${h}`);
        // Volver a codificar el centro da la misma celda (redondeo estable)
        const c = centro(h);
        assert.equal(codificar(c.lat, c.lng), h);
    }
});
prueba('las celdas que cubren una caja la tapan entera y no sobran', () => {
    const c: Caja = { sur: 41.37, oeste: 2.13, norte: 41.41, este: 2.20 };
    const celdas = celdasQueCubren(c, 6, 500);
    assert.ok(celdas.length > 50);
    for (let i = 0; i < 500; i++) {
        const p = { lat: c.sur + azar() * (c.norte - c.sur), lng: c.oeste + azar() * (c.este - c.oeste) };
        assert.ok(celdas.includes(codificar(p.lat, p.lng)), `falta la celda de ${p.lat},${p.lng}`);
    }
    for (const h of celdas) {
        const k = caja(h);
        assert.ok(k.norte >= c.sur && k.sur <= c.norte && k.este >= c.oeste && k.oeste <= c.este, `${h} no toca la caja`);
    }
    assert.deepEqual(celdasQueCubren(c, 6, 10), [], 'por encima del máximo devuelve []');
});
prueba('prefijos para la vista: ≤ 8 consultas y cubren todo lo que se ve', () => {
    const vistas: Caja[] = [
        { sur: 41.36, oeste: 2.10, norte: 41.42, este: 2.22 },    // Barcelona en el móvil (z13)
        { sur: 41.399, oeste: 2.152, norte: 41.408, este: 2.161 }, // Gràcia de cerca (z16, 390 × 550 px)
        { sur: 36, oeste: -9.5, norte: 43.8, este: 3.4 },         // toda España (z5)
    ];
    for (const v of vistas) {
        const ps = prefijosParaVista(v, 8);
        assert.ok(ps.length >= 1 && ps.length <= 8, JSON.stringify(ps));
        for (let i = 0; i < 300; i++) {
            const h = codificar(v.sur + azar() * (v.norte - v.sur), v.oeste + azar() * (v.este - v.oeste));
            // Lo que pide Firestore: geohash >= p && geohash <= p + '~'
            assert.ok(ps.some(p => h >= p && h <= finDeRango(p)), `${h} sin consulta`);
        }
    }
    assert.ok(prefijosParaVista(vistas[1], 8).every(p => p.length === 6), 'de cerca, celdas de 6');
});

console.log('Privacidad: celda y desplazamiento');
prueba('el desplazamiento sale solo del uid: mismo uid, mismo desplazamiento', () => {
    assert.deepEqual(desplazamiento('abc'), desplazamiento('abc'));
    assert.notDeepEqual(desplazamiento('abc'), desplazamiento('abd'));
});
prueba('el desplazamiento no se sale del ±30 % de la celda y se reparte (5.000 uids)', () => {
    let sLat = 0, sLng = 0;
    const vistos = new Set<string>();
    for (let i = 0; i < 5000; i++) {
        const d = desplazamiento(`uid-${i}-${Math.floor(azar() * 1e9)}`);
        assert.ok(Math.abs(d.lat) <= DESPLAZAMIENTO_MAX && Math.abs(d.lng) <= DESPLAZAMIENTO_MAX);
        sLat += d.lat; sLng += d.lng;
        vistos.add(`${d.lat.toFixed(3)}:${d.lng.toFixed(3)}`);
    }
    assert.ok(Math.abs(sLat / 5000) < 0.02 && Math.abs(sLng / 5000) < 0.02, 'centrado en la celda');
    assert.ok(vistos.size > 4900, 'casi nadie se amontona');
});
prueba('en pantalla siempre dentro de su celda', () => {
    for (let i = 0; i < 2000; i++) {
        const h = codificar(41.3 + azar() * 0.2, 2.0 + azar() * 0.3);
        const p = posicionEnMapa({ uid: `u${i}`, geohash: h });
        assert.ok(dentroDe(caja(h), p));
        assert.equal(codificar(p.lat, p.lng), h, 'lo pintado no cambia de celda');
    }
});
prueba('dos posiciones exactas en la misma celda se pintan EN EL MISMO SITIO (no se deduce más que la celda)', () => {
    const h = codificar(41.4036, 2.1567);
    const k = caja(h);
    const esquinaA = codificar(k.sur + 1e-6, k.oeste + 1e-6), esquinaB = codificar(k.norte - 1e-6, k.este - 1e-6);
    assert.equal(esquinaA, h); assert.equal(esquinaB, h);
    assert.deepEqual(posicionEnMapa({ uid: 'víctor', geohash: esquinaA }), posicionEnMapa({ uid: 'víctor', geohash: esquinaB }));
});

console.log('Caducidad de «Estoy aquí ahora»');
const T = Date.UTC(2026, 9, 26, 20, 0, 0);
prueba('dura 4 horas justas', () => { assert.equal(finDeAhora(T) - T, 4 * 3600 * 1000); assert.equal(DURACION_AHORA_MS, 14_400_000); });
prueba('zona fija no caduca nunca', () => { assert.equal(caducado({ ahora: false, caduca: null }, T), false); });
prueba('«ahora» vale hasta su hora y luego no sale', () => {
    const p = { ahora: true, caduca: finDeAhora(T) };
    assert.equal(visible(p, T + 1000), true);
    assert.equal(visible(p, T + DURACION_AHORA_MS - 1), true);
    assert.equal(visible(p, T + DURACION_AHORA_MS), false);
    assert.equal(visible(p, T + DURACION_AHORA_MS + 60_000), false);
});
prueba('«ahora» sin hora de fin se trata como caducado', () => { assert.equal(caducado({ ahora: true, caduca: null }, T), true); });

console.log('Recuento, filtros y grupos');
const punto = (uid: string, papel: PuntoMapa['papel'], extra: Partial<PuntoMapa> = {}): PuntoMapa => ({
    uid, nombre: uid, foto: '', papel, etiquetas: [], zona: 'Gràcia, Barcelona', geohash: 'sp3e9b', ahora: false, caduca: null, actualizado: null, ...extra,
});
prueba('el texto del encargo: «23 musikeers cerca · 12 músicos · 6 técnicos · 3 salas · 2 tiendas»', () => {
    const ps = [
        ...Array.from({ length: 12 }, (_, i) => punto(`m${i}`, 'musico')),
        ...Array.from({ length: 6 }, (_, i) => punto(`t${i}`, 'tecnico')),
        ...Array.from({ length: 3 }, (_, i) => punto(`s${i}`, 'sala')),
        ...Array.from({ length: 2 }, (_, i) => punto(`d${i}`, 'tienda')),
    ];
    assert.equal(textoRecuento(contar(ps)), '23 musikeers cerca · 12 músicos · 6 técnicos · 3 salas · 2 tiendas');
});
prueba('singular, sin ceros y con «ahora mismo»', () => {
    assert.equal(textoRecuento(contar([punto('a', 'musico')])), '1 musikeer cerca · 1 músico');
    assert.equal(textoRecuento(contar([punto('a', 'tecnico'), punto('b', 'otro')]), true), '2 musikeers ahora mismo · 1 técnico');
    assert.equal(textoRecuento(contar([])), 'Aún no hay musikeers por aquí');
});
prueba('filtros: papel, «Ahora mismo» y nunca los caducados', () => {
    const ps = [
        punto('a', 'musico'),
        punto('b', 'musico', { ahora: true, caduca: T + 3600_000 }),
        punto('c', 'tecnico', { ahora: true, caduca: T - 1 }),   // caducado
        punto('d', 'tienda'),
    ];
    assert.deepEqual(filtrar(ps, 'todos', false, T).map(p => p.uid), ['a', 'b', 'd']);
    assert.deepEqual(filtrar(ps, 'musico', false, T).map(p => p.uid), ['a', 'b']);
    assert.deepEqual(filtrar(ps, 'todos', true, T).map(p => p.uid), ['b']);
    assert.deepEqual(filtrar(ps, 'tecnico', false, T).map(p => p.uid), []);
});
prueba('agrupar: los que se tocan, juntos; los lejanos, solos; mismo resultado en cualquier orden', () => {
    const pts = [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 20, y: 10 }, { id: 'c', x: 30, y: -20 }, { id: 'd', x: 300, y: 300 }];
    const g = agrupar(pts, 44);
    assert.equal(g.length, 2);
    assert.deepEqual(g.map(x => x.ids.length).sort(), [1, 3]);
    assert.deepEqual(agrupar([...pts].reverse(), 44), g);
    const tres = g.find(x => x.ids.length === 3)!;
    assert.ok(Math.abs(tres.x - 50 / 3) < 1e-9 && Math.abs(tres.y - (-10 / 3)) < 1e-9, 'en la media');
});

console.log('Zonas con nombre (nunca la calle)');
prueba('Gràcia, Raval, Poble-sec y Sants por su celda', () => {
    assert.equal(zonaDe(codificar(41.4030, 2.1570)), 'Gràcia, Barcelona');
    assert.equal(zonaDe(codificar(41.3795, 2.1685)), 'Raval, Barcelona');
    assert.equal(zonaDe(codificar(41.3725, 2.1605)), 'Poble-sec, Barcelona');
    assert.equal(zonaDe(codificar(41.3760, 2.1360)), 'Sants, Barcelona');
});
prueba('fuera de los barrios, la ciudad; lejos de todo, la del perfil', () => {
    assert.equal(zonaDe(codificar(41.4520, 2.2460)), 'Badalona');
    assert.equal(zonaDe(codificar(40.3456, -1.1065), 'Teruel, España'), 'Teruel');
    assert.equal(zonaDe(codificar(40.3456, -1.1065)), '');
});
prueba('abrir el mapa en la ciudad del perfil', () => {
    assert.equal(centroDeCiudad('Barcelona, España')?.nombre, 'Barcelona');
    assert.equal(centroDeCiudad('madrid')?.nombre, 'Madrid');
    assert.equal(centroDeCiudad('Gràcia (BCN)')?.nombre, 'Gràcia');
    assert.equal(centroDeCiudad(''), null);
    assert.equal(centroDeCiudad('Narnia'), null);
    assert.equal(centroDeCiudad('Salamanca')?.nombre, 'Salamanca', 'la ciudad, no el barrio de Madrid');
    assert.equal(centroDeCiudad('Barrio de Salamanca, Madrid')?.ciudad, 'Madrid');
    assert.equal(centroDeCiudad('Solsona'), null, '«Sol» no es «Solsona»');
    assert.equal(centroDeCiudad('Sant Cugat del Vallès')?.nombre, 'Sant Cugat');
});

console.log('Del perfil al mapa');
const base: DatosPerfil = { tieneArtista: false, tieneOrganizador: false, servicios: [], equipo: [], skills: [], generos: [], tags: [] };
prueba('papel: músico, técnico, tienda, sala y otro', () => {
    assert.equal(papelDe({ ...base, primaryMode: 'musician' }), 'musico');
    assert.equal(papelDe({ ...base, primaryMode: 'provider', servicios: ['Sonido'] }), 'tecnico');
    assert.equal(papelDe({ ...base, primaryMode: 'provider', servicios: ['Tienda', 'Guitarras'] }), 'tienda');
    assert.equal(papelDe({ ...base, primaryMode: 'organizer', tieneOrganizador: true }), 'sala');
    assert.equal(papelDe({ ...base, primaryMode: 'organizer', skills: ['Bar con música'] }), 'sala');
    assert.equal(papelDe({ ...base, primaryMode: 'organizer', skills: ['Boda'] }), 'otro');
    assert.equal(papelDe({ ...base, tieneArtista: true }), 'musico');
});
prueba('etiquetas: como mucho 3, sin repetir, sin «Tienda», con mayúscula', () => {
    assert.deepEqual(etiquetasDe('musico', { ...base, skills: ['Guitarra'], tags: ['guitarra', 'flamenco'], generos: ['Rumba', 'Pop'] }), ['Guitarra', 'Flamenco', 'Rumba']);
    assert.deepEqual(etiquetasDe('tecnico', { ...base, equipo: ['PA 2 kW'], servicios: ['Sonido', 'Luces'] }), ['PA 2 kW', 'Sonido', 'Luces']);
    assert.deepEqual(etiquetasDe('tienda', { ...base, servicios: ['Tienda', 'Guitarras', 'Alquiler'] }), ['Guitarras', 'Alquiler']);
    assert.deepEqual(limpiarEtiquetas(['', '  ', 'x'.repeat(40), 'ok']), ['Ok']);
});
prueba('leer de Firestore: se rechaza lo que no se puede pintar', () => {
    const ok = { nombre: 'Rumba Sur', foto: 'https://x/y.jpg', papel: 'musico', etiquetas: ['Rumba'], zona: 'Gràcia', geohash: 'sp3e9b', ahora: false, caduca: null };
    assert.ok(leerPunto('u', ok));
    assert.equal(leerPunto('u', { ...ok, geohash: 'sp3e9bq' }), null, 'más de 6 letras');
    assert.equal(leerPunto('u', { ...ok, geohash: 'sp3eia' }), null, 'letras que no son de geohash');
    assert.equal(leerPunto('u', { ...ok, nombre: '' }), null);
    assert.equal(leerPunto('u', { ...ok, papel: 'hacker' })?.papel, 'otro');
    assert.equal(leerPunto('u', { ...ok, caduca: { toMillis: () => 123 } })?.caduca, 123);
    assert.equal(fotoSegura('javascript:alert(1)'), '');
    assert.equal(fotoSegura('http://x/y.jpg'), '');
    assert.equal(fotoSegura('//x/y.jpg'), '');
    assert.equal(fotoSegura('/seed/x.webp'), '/seed/x.webp');
});

console.log(`\n${pasadas} pruebas, todas bien.`);

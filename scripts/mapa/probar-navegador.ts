// El mapa de musikeers en un navegador de verdad (Chromium con Playwright) contra los emuladores:
//   1) emuladores: npx --yes firebase-tools emulators:start --only auth,firestore --project demo-musikeeo
//   2) SEMILLA_SALIDA=/tmp/semilla.json npx --yes tsx scripts/mapa/sembrar-emulador.ts
//   3) la app:  VITE_EMULADORES=1 VITE_FIREBASE_PROJECT_ID=demo-musikeeo (+ el resto de VITE_FIREBASE_*) npx vite --port 5174
//   4) SEMILLA=/tmp/semilla.json CAPTURAS=/tmp/capturas npx --yes tsx scripts/mapa/probar-navegador.ts
// Comprueba recuento, filtros, grupos, la hoja del micro perfil, «Escribir», aparecer y quitarse
// (mapa/{uid} se escribe y se borra), «Estoy aquí ahora» y su caducidad, y hace capturas.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { codificar } from '../../src/lib/geohash';
import { entrar, escribir, leer } from './emulador';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright') as typeof import('playwright');
type Page = import('playwright').Page;
type BrowserContext = import('playwright').BrowserContext;

const APP = process.env.APP || 'http://127.0.0.1:5174';
const CAPTURAS = process.env.CAPTURAS || 'capturas-mapa';
const semilla = JSON.parse(readFileSync(process.env.SEMILLA || 'semilla.json', 'utf8')) as {
    yo: { uid: string; email: string; clave: string };
    personas: { uid: string; nombre: string; papel: string; ahora: string; zona: string }[];
};
mkdirSync(CAPTURAS, { recursive: true });

const GRACIA = { latitude: 41.4036, longitude: 2.1567 };
const RAVAL = { latitude: 41.3800, longitude: 2.1690 };
const yo = semilla.yo;
const token = async () => (await entrar(yo.email, yo.clave)).token;

let pasadas = 0;
const prueba = async (nombre: string, fn: () => Promise<void>) => {
    try { await fn(); pasadas++; console.log(`  ✓ ${nombre}`); } catch (e) { console.error(`  ✗ ${nombre}`); throw e; }
};
const espera = (ms: number) => new Promise(r => setTimeout(r, ms));

const navegador = await chromium.launch();
const avisos: string[] = [];

async function contexto(opciones: { oscuro?: boolean; escritorio?: boolean } = {}): Promise<BrowserContext> {
    const ctx = await navegador.newContext({
        viewport: opciones.escritorio ? { width: 1440, height: 900 } : { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: !opciones.escritorio,
        hasTouch: !opciones.escritorio,
        locale: 'es-ES',
        timezoneId: 'Europe/Madrid',
        geolocation: GRACIA,
        permissions: ['geolocation'],
        colorScheme: opciones.oscuro ? 'dark' : 'light',
    });
    // Las teselas de CARTO no pasan por el proxy de este entorno: que fallen enseguida
    await ctx.route(/basemaps\.cartocdn\.com/, r => r.abort());
    await ctx.addInitScript((oscuro: boolean) => {
        try {
            localStorage.setItem('musikeeo-theme-v3', oscuro ? 'dark' : 'light');
            localStorage.setItem('musikeeo-cookie-consent', JSON.stringify({ version: 1, analytics: 'denied', decidedAt: new Date().toISOString() }));
        } catch { /* */ }
    }, !!opciones.oscuro);
    return ctx;
}

async function entrarEnLaApp(page: Page) {
    page.on('pageerror', e => avisos.push(`pageerror: ${e.message}`));
    await page.goto(`${APP}/login`);
    await page.fill('#email', yo.email);
    await page.fill('#password', yo.clave);
    await page.click('button[type=submit]');
    await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 20000 });
}

const quitarAvisoCookies = async (page: Page) => {
    const b = page.getByRole('button', { name: /Rechazar|Solo necesarias|Aceptar/ }).first();
    if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
};

async function abrirMapa(page: Page) {
    await page.goto(`${APP}/mapa`);
    await page.waitForSelector('.mapa-musikeeo.leaflet-container');
    await page.waitForFunction(() => {
        const t = document.querySelector('[data-testid=recuento]')?.getAttribute('data-texto') || '';
        return /musikeer/.test(t) && document.querySelectorAll('.leaflet-marker-icon').length > 0;
    }, null, { timeout: 20000 });
    await quitarAvisoCookies(page);
    await espera(400);
}

const recuento = (page: Page) => page.getAttribute('[data-testid=recuento]', 'data-texto');

/** Suma lo pintado: burbujas sueltas + el número de cada grupo */
const pintados = (page: Page) => page.evaluate(() => {
    const r = { total: 0, grupos: 0, solos: [] as string[] };
    for (const el of document.querySelectorAll('.leaflet-marker-icon.mk-icono')) {
        const l = el.firstElementChild?.getAttribute('aria-label') || '';
        const m = l.match(/^(\d+) musikeers juntos$/);
        if (m) { r.grupos++; r.total += Number(m[1]); } else if (l) { r.solos.push(l); r.total++; }
    }
    return r;
});

/** Burbujas sueltas que se pueden tocar: dentro del mapa y no debajo del botón de abajo */
const solosALaVista = (page: Page) => page.evaluate(() => {
    const m = document.querySelector('.mapa-musikeeo')!.getBoundingClientRect();
    return [...document.querySelectorAll('.leaflet-marker-icon.mk-icono')].flatMap(el => {
        const l = el.firstElementChild?.getAttribute('aria-label') || '';
        const r = el.getBoundingClientRect();
        const dentro = r.top > m.top + 8 && r.bottom < m.bottom - 120 && r.left > m.left + 8 && r.right < m.right - 56;
        return l && !/juntos$/.test(l) && l !== 'Víctor y la Rumba' && dentro ? [l] : [];
    });
});

async function alejar(page: Page, veces: number) {
    await page.locator('.mapa-musikeeo').focus();
    for (let i = 0; i < veces; i++) { await page.keyboard.press('Minus'); await espera(450); }
    await espera(800);
}

async function esperarRecuento(page: Page, texto: string) {
    await page.waitForFunction(t => document.querySelector('[data-testid=recuento]')?.getAttribute('data-texto') === t, texto, { timeout: 15000 })
        .catch(async () => { throw new Error(`Recuento: «${await recuento(page)}», se esperaba «${texto}»`); });
}

const chip = (page: Page, nombre: string) => page.getByRole('toolbar', { name: 'Filtros del mapa' }).getByRole('button', { name: nombre, exact: true });
const n = (papel: string) => semilla.personas.filter(p => p.papel === papel && p.ahora !== 'caducado').length;
const caducado = semilla.personas.find(p => p.ahora === 'caducado')!;
const ahoraSi = semilla.personas.filter(p => p.ahora === 'si');

// ════════════════════════════════════════════════════════════════════════════
console.log('Claro, 390 × 844');
const ctx = await contexto();
const page = await ctx.newPage();
await entrarEnLaApp(page);

await prueba('/mapa abre en tu posición con el recuento', async () => {
    await abrirMapa(page);
    const t = await recuento(page);
    assert.match(t || '', /^\d+ musikeers? cerca/);
    await page.screenshot({ path: join(CAPTURAS, '01-mapa-claro-390.png') });
});

await prueba('sin scroll de página: el mapa ocupa el hueco entre la cabecera y la barra', async () => {
    const m = await page.evaluate(() => ({ alto: document.documentElement.scrollHeight, ventana: innerHeight }));
    assert.ok(m.alto <= m.ventana + 1, JSON.stringify(m));
});

const total = semilla.personas.length - 1; // menos el caducado
const esperado = `${total} musikeers cerca · ${n('musico')} músicos · ${n('tecnico')} técnicos · ${n('sala')} salas · ${n('tienda')} tiendas`;
await prueba(`recuento con toda Barcelona a la vista: «${esperado}» (el «ahora» caducado no cuenta)`, async () => {
    await alejar(page, 2);
    await esperarRecuento(page, esperado);
    const p = await pintados(page);
    assert.equal(p.total, total, JSON.stringify(p));
    assert.ok(!p.solos.includes(caducado.nombre), 'el caducado no se pinta');
});

await prueba('agrupados: a esta distancia hay grupos con número', async () => {
    const p = await pintados(page);
    assert.ok(p.grupos >= 1, JSON.stringify(p));
    await page.screenshot({ path: join(CAPTURAS, '02-grupos-claro-390.png') });
});

await prueba('filtros: Músicos, Técnicos, Salas, Tiendas y Todos', async () => {
    for (const [nombre, papel] of [['Músicos', 'musico'], ['Técnicos', 'tecnico'], ['Salas', 'sala'], ['Tiendas', 'tienda']] as const) {
        await chip(page, nombre).click();
        await espera(300);
        assert.equal((await pintados(page)).total, n(papel), nombre);
        assert.equal(await chip(page, nombre).getAttribute('aria-pressed'), 'true');
    }
    await chip(page, 'Todos').click();
    await espera(300);
    assert.equal((await pintados(page)).total, total);
});

await prueba(`«Ahora mismo»: solo los ${ahoraSi.length} disponibles ahora (no el caducado)`, async () => {
    await page.getByRole('button', { name: 'Ahora mismo' }).click();
    const mus = ahoraSi.filter(p => p.papel === 'musico').length, tec = ahoraSi.filter(p => p.papel === 'tecnico').length;
    await esperarRecuento(page, `${ahoraSi.length} musikeers ahora mismo · ${mus} músicos · ${tec} técnicos`);
    const p = await pintados(page);
    assert.equal(p.total, ahoraSi.length);
    await page.screenshot({ path: join(CAPTURAS, '03-ahora-mismo-claro-390.png') });
    await page.getByRole('button', { name: 'Ahora mismo' }).click();
    await esperarRecuento(page, esperado);
});

await prueba('tocar un grupo acerca el mapa y los separa', async () => {
    const antes = await pintados(page);
    const grupo = page.locator('.leaflet-marker-icon.mk-icono', { has: page.locator('[aria-label$="musikeers juntos"]') }).first();
    await grupo.click();
    await espera(1500);
    const despues = await pintados(page);
    assert.ok(despues.solos.length > antes.solos.length || despues.grupos !== antes.grupos, `${JSON.stringify(antes)} → ${JSON.stringify(despues)}`);
});

let elegido = '';
await prueba('la hoja del micro perfil: foto, nombre, papel, datos, zona y «Escribir» en amarillo', async () => {
    let solos = await solosALaVista(page);
    for (let i = 0; i < 3 && !solos.length; i++) {
        await page.locator('.leaflet-marker-icon.mk-icono', { has: page.locator('[aria-label$="musikeers juntos"]') }).first().click();
        await espera(1200);
        solos = await solosALaVista(page);
    }
    elegido = solos[0] || '';
    assert.ok(elegido, 'hay alguien suelto');
    await page.locator('.leaflet-marker-icon.mk-icono', { has: page.locator(`[aria-label="${elegido}"]`) }).first().click();
    const hoja = page.getByTestId('micro-perfil');
    await hoja.waitFor();
    const persona = semilla.personas.find(x => x.nombre === elegido)!;
    await assert.doesNotReject(hoja.getByText(elegido, { exact: true }).waitFor());
    const texto = await hoja.innerText();
    assert.match(texto, /zona aproximada/);
    assert.ok(texto.includes(persona.zona), `zona ${persona.zona} en «${texto}»`);
    const escribir = hoja.getByRole('link', { name: 'Escribir' });
    assert.equal(await escribir.getAttribute('href'), `/messages?userId=${persona.uid}`);
    assert.match(await escribir.getAttribute('class') || '', /bg-primary/);
    assert.equal(await hoja.getByRole('link', { name: 'Ver perfil' }).getAttribute('href'), `/profile/${persona.uid}`);
    await espera(400);
    await page.screenshot({ path: join(CAPTURAS, '04-micro-perfil-claro-390.png') });
});

await prueba('«Escribir» lleva a mensajes y abre el chat con esa persona', async () => {
    const persona = semilla.personas.find(x => x.nombre === elegido)!;
    await page.getByTestId('micro-perfil').getByRole('link', { name: 'Escribir' }).click();
    await page.waitForURL(u => u.pathname === '/messages' && (u.searchParams.has('chat') || u.searchParams.get('userId') === persona.uid), { timeout: 15000 });
    await page.waitForURL(u => u.searchParams.get('chat') === [yo.uid, persona.uid].sort().join('_'), { timeout: 15000 });
});

await prueba('apagado por defecto: mapa/{uid} no existe hasta activarlo', async () => {
    assert.equal((await leer(`mapa/${yo.uid}`, await token())).status, 404);
});

await prueba('«Aparecer en el mapa» → «Mi zona» con la ubicación una vez: se escribe solo la celda', async () => {
    await abrirMapa(page);
    await page.getByTestId('aparecer').click();
    const hoja = page.getByRole('dialog', { name: 'Aparecer en el mapa' });
    await hoja.waitFor();
    await hoja.getByText('Saldrás en una zona aproximada (unos 500 m), nunca en tu calle. Lo puedes quitar cuando quieras.').waitFor();
    const boton = hoja.getByRole('button', { name: 'Aparecer en el mapa' });
    assert.equal(await boton.isDisabled(), true, 'sin la casilla de los 18 no se puede');
    await espera(500);
    await page.screenshot({ path: join(CAPTURAS, '05-aparecer-claro-390.png') });
    await hoja.getByRole('checkbox').check();
    await boton.click();
    await page.getByTestId('mi-estado').waitFor({ timeout: 15000 });
    const r = await leer(`mapa/${yo.uid}`, await token());
    assert.ok(r.ok);
    const d = r.datos!;
    assert.deepEqual(Object.keys(d).sort(), ['actualizado', 'ahora', 'caduca', 'etiquetas', 'foto', 'geohash', 'nombre', 'papel', 'uid', 'zona']);
    assert.equal(d.geohash, codificar(GRACIA.latitude, GRACIA.longitude));
    assert.equal((d.geohash as string).length, 6);
    assert.equal(d.ahora, false);
    assert.equal(d.caduca, null);
    assert.equal(d.nombre, 'Víctor y la Rumba');
    assert.equal(d.papel, 'musico');
    assert.deepEqual(d.etiquetas, ['Guitarra', 'Rumba', 'Pop']);
    assert.equal(d.zona, 'Gràcia, Barcelona');
    assert.ok(!JSON.stringify(d).includes('41.4036') && !JSON.stringify(d).includes('2.1567'), 'ni rastro de la posición exacta');
    await page.locator('[aria-label="Víctor y la Rumba"]').first().waitFor();
    await espera(600);
    await page.screenshot({ path: join(CAPTURAS, '06-ya-sales-claro-390.png') });
});

await prueba('«Estoy aquí ahora» en el Raval: la celda del momento y caduca a las 4 h', async () => {
    await ctx.setGeolocation(RAVAL);
    await page.getByTestId('mi-estado').getByRole('button', { name: 'Cambiar' }).click();
    const hoja = page.getByRole('dialog', { name: 'Aparecer en el mapa' });
    await hoja.getByRole('radio', { name: 'Estoy aquí ahora' }).click();
    await hoja.getByRole('button', { name: 'Estoy aquí ahora', exact: true }).click();
    await page.getByTestId('mi-estado').getByText('Estás aquí ahora').waitFor({ timeout: 15000 });
    const d = (await leer(`mapa/${yo.uid}`, await token())).datos!;
    assert.equal(d.ahora, true);
    assert.equal(d.geohash, codificar(RAVAL.latitude, RAVAL.longitude));
    assert.equal(d.zona, 'Raval, Barcelona');
    const fin = (d.caduca as Date).getTime() - Date.now();
    assert.ok(fin > 4 * 3600_000 - 120_000 && fin <= 4 * 3600_000 + 5_000, `caduca en ${fin / 60000} min`);
    await espera(500);
    await page.screenshot({ path: join(CAPTURAS, '07-estoy-aqui-ahora-claro-390.png') });
});

await prueba('«Ya me voy» vuelve a la zona fija', async () => {
    await page.getByTestId('mi-estado').getByRole('button', { name: 'Ya me voy' }).click();
    await page.getByTestId('mi-estado').getByText('Sales en Gràcia, Barcelona').waitFor({ timeout: 15000 });
    const d = (await leer(`mapa/${yo.uid}`, await token())).datos!;
    assert.equal(d.ahora, false);
    assert.equal(d.caduca, null);
    assert.equal(d.geohash, codificar(GRACIA.latitude, GRACIA.longitude));
});

await prueba('«Quitarme del mapa» borra mapa/{uid}', async () => {
    await page.getByTestId('mi-estado').getByRole('button', { name: 'Cambiar' }).click();
    await page.getByRole('dialog', { name: 'Aparecer en el mapa' }).getByRole('button', { name: 'Quitarme del mapa' }).click();
    await page.getByTestId('aparecer').waitFor({ timeout: 15000 });
    assert.equal((await leer(`mapa/${yo.uid}`, await token())).status, 404);
});

await prueba('un «Estoy aquí ahora» propio caducado se quita solo al volver (sin zona fija)', async () => {
    await escribir(`mapa/${yo.uid}`, {
        uid: yo.uid, nombre: 'Víctor y la Rumba', foto: '', papel: 'musico', etiquetas: [], zona: 'Raval, Barcelona',
        geohash: codificar(RAVAL.latitude, RAVAL.longitude), ahora: true, caduca: new Date(Date.now() - 60_000), actualizado: new Date(Date.now() - 4 * 3600_000),
    }, 'owner');
    await abrirMapa(page);
    await page.getByTestId('aparecer').waitFor({ timeout: 15000 });
    for (let i = 0; i < 20 && (await leer(`mapa/${yo.uid}`, await token())).ok; i++) await espera(300);
    assert.equal((await leer(`mapa/${yo.uid}`, await token())).status, 404);
});

await prueba('… y con zona fija guardada, vuelve a ella', async () => {
    await page.evaluate(([uid, h]) => localStorage.setItem(`musikeeo-mapa-zona-v1:${uid}`, JSON.stringify({ geohash: h, zona: 'Gràcia, Barcelona' })), [yo.uid, codificar(GRACIA.latitude, GRACIA.longitude)]);
    await escribir(`mapa/${yo.uid}`, {
        uid: yo.uid, nombre: 'Víctor y la Rumba', foto: '', papel: 'musico', etiquetas: [], zona: 'Raval, Barcelona',
        geohash: codificar(RAVAL.latitude, RAVAL.longitude), ahora: true, caduca: new Date(Date.now() - 60_000), actualizado: new Date(Date.now() - 4 * 3600_000),
    }, 'owner');
    await abrirMapa(page);
    await page.getByTestId('mi-estado').getByText('Sales en Gràcia, Barcelona').waitFor({ timeout: 15000 });
    const d = (await leer(`mapa/${yo.uid}`, await token())).datos!;
    assert.equal(d.ahora, false);
    assert.equal(d.geohash, codificar(GRACIA.latitude, GRACIA.longitude));
});

await prueba('ajustes del perfil: el interruptor quita y vuelve a poner', async () => {
    await ctx.setGeolocation(GRACIA);
    await page.goto(`${APP}/panel/ajustes`);
    const sw = page.getByRole('switch', { name: 'Aparecer en el mapa' });
    await page.waitForFunction(() => document.querySelector('[role=switch][aria-label="Aparecer en el mapa"]')?.getAttribute('aria-checked') === 'true', null, { timeout: 15000 });
    await sw.click();
    await page.waitForFunction(() => document.querySelector('[role=switch][aria-label="Aparecer en el mapa"]')?.getAttribute('aria-checked') === 'false', null, { timeout: 15000 });
    assert.equal((await leer(`mapa/${yo.uid}`, await token())).status, 404);
    await sw.click();
    const hoja = page.getByRole('dialog', { name: 'Aparecer en el mapa' });
    await hoja.waitFor();
    assert.equal(await hoja.getByRole('checkbox').isChecked(), true, 'los 18 ya confirmados en este móvil');
    await hoja.getByRole('button', { name: 'Aparecer en el mapa' }).click();
    await page.waitForFunction(() => document.querySelector('[role=switch][aria-label="Aparecer en el mapa"]')?.getAttribute('aria-checked') === 'true', null, { timeout: 15000 });
    assert.ok((await leer(`mapa/${yo.uid}`, await token())).ok);
    await page.getByTestId('estado-ajuste-mapa').scrollIntoViewIfNeeded();
    await espera(400);
    await page.screenshot({ path: join(CAPTURAS, '08-ajustes-claro-390.png') });
});

await prueba('«Elegir en el mapa»: la celda del centro del mapa', async () => {
    await page.getByRole('button', { name: 'Cambiar', exact: true }).click();
    const hoja = page.getByRole('dialog', { name: 'Aparecer en el mapa' });
    await hoja.getByRole('radio', { name: /Elegir en el mapa/ }).click();
    await hoja.getByRole('button', { name: 'Elegir en el mapa', exact: true }).click();
    await page.waitForURL(u => u.pathname === '/mapa');
    await page.getByTestId('elegir-zona').waitFor({ timeout: 15000 });
    await page.waitForSelector('.mapa-musikeeo.leaflet-container');
    await espera(1500);
    await page.screenshot({ path: join(CAPTURAS, '09-elegir-zona-claro-390.png') });
    const zonaPrevista = await page.getByTestId('elegir-zona').locator('b').first().innerText();
    await page.getByTestId('elegir-zona').getByRole('button', { name: /zona/ }).click();
    await page.getByTestId('mi-estado').waitFor({ timeout: 15000 });
    const d = (await leer(`mapa/${yo.uid}`, await token())).datos!;
    assert.equal((d.geohash as string).length, 6);
    assert.equal(d.zona, zonaPrevista);
});

await ctx.close();

// ════════════════════════════════════════════════════════════════════════════
console.log('Oscuro, 390 × 844');
const ctxO = await contexto({ oscuro: true });
const po = await ctxO.newPage();
await entrarEnLaApp(po);
await prueba('mapa, micro perfil y hoja en oscuro', async () => {
    await abrirMapa(po);
    assert.equal(await po.evaluate(() => document.documentElement.classList.contains('dark')), true);
    await espera(500);
    await po.screenshot({ path: join(CAPTURAS, '10-mapa-oscuro-390.png') });
    let solos = await solosALaVista(po);
    for (let i = 0; i < 3 && !solos.length; i++) {
        await po.locator('.leaflet-marker-icon.mk-icono', { has: po.locator('[aria-label$="musikeers juntos"]') }).first().click();
        await espera(1200);
        solos = await solosALaVista(po);
    }
    const alguien = solos[0];
    assert.ok(alguien, 'hay alguien suelto');
    await po.locator('.leaflet-marker-icon.mk-icono', { has: po.locator(`[aria-label="${alguien}"]`) }).first().click();
    await po.getByTestId('micro-perfil').waitFor();
    await espera(500);
    await po.screenshot({ path: join(CAPTURAS, '11-micro-perfil-oscuro-390.png') });
    await po.keyboard.press('Escape');
    await espera(400);
    await po.getByTestId('mi-estado').getByRole('button', { name: 'Cambiar' }).click();
    await po.getByRole('dialog', { name: 'Aparecer en el mapa' }).waitFor();
    await espera(500);
    await po.screenshot({ path: join(CAPTURAS, '12-hoja-oscuro-390.png') });
});
await ctxO.close();

// ════════════════════════════════════════════════════════════════════════════
console.log('Escritorio, 1440 × 900');
const ctxE = await contexto({ escritorio: true });
const pe = await ctxE.newPage();
await entrarEnLaApp(pe);
await prueba('mapa en el ordenador, con la barra lateral', async () => {
    await abrirMapa(pe);
    await pe.getByRole('link', { name: 'Mapa' }).first().waitFor();
    await espera(500);
    await pe.screenshot({ path: join(CAPTURAS, '13-mapa-escritorio-1440.png') });
    const m = await pe.evaluate(() => ({ alto: document.documentElement.scrollHeight, ventana: innerHeight }));
    assert.ok(m.alto <= m.ventana + 1, JSON.stringify(m));
});
await prueba('Explorar tiene el botón «Mapa» en la cabecera', async () => {
    await pe.goto(`${APP}/explorar`);
    await pe.locator('main').getByRole('link', { name: 'Mapa', exact: true }).click();
    await pe.waitForURL(u => u.pathname === '/mapa');
});
await ctxE.close();

await navegador.close();
const errores = avisos.filter(a => !/cartocdn|ERR_FAILED/.test(a));
if (errores.length) console.log('Avisos de la página:', errores);
console.log(`\n${pasadas} pruebas en el navegador, todas bien. Capturas en ${CAPTURAS}`);

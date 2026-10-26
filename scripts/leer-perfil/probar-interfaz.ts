// Prueba de la interfaz de «Rellénalo con tu web o tu Instagram» en un navegador de verdad.
// Necesita, en otras dos terminales (solo en local, nunca producción):
//   npx --yes firebase-tools emulators:start --only auth,firestore
//   VITE_EMULADORES=1 npx vite --port 5179 --strictPort --host 127.0.0.1
// y luego:  npx tsx scripts/leer-perfil/probar-interfaz.ts [carpeta-de-capturas]
//
// /api no corre en Vite: aquí se contesta /api/leer-perfil con la MISMA lógica del servidor
// (leerPerfil de api/leer-perfil.ts) sobre las páginas de fixtures/, sin red y sin IA. El texto
// pegado en el panel se deja sin contestar a propósito: así se prueba el respaldo de la app.

import { readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerPerfil } from '../../api/leer-perfil.ts';

const AQUI = dirname(fileURLToPath(import.meta.url));
const fixture = (n: string) => readFileSync(join(AQUI, 'fixtures', n), 'utf8');
const CAPTURAS = process.argv[2] || join(tmpdir(), 'musikeeo-leer-perfil');
mkdirSync(CAPTURAS, { recursive: true });
const APP = 'http://127.0.0.1:5179';
const AUTH = 'http://127.0.0.1:9099';
const FS = 'http://127.0.0.1:8080/v1/projects/musikeeo-8e766/databases/(default)/documents';

// playwright está instalado fuera del proyecto (no es una dependencia de la app)
const { chromium } = createRequire(import.meta.url)('playwright') as typeof import('playwright');

let fallos = 0;
const ok = (c: unknown, que: string, detalle?: unknown) => {
    console.log(`${c ? '✓' : '✗'} ${que}${!c && detalle !== undefined ? ` → ${JSON.stringify(detalle)}` : ''}`);
    if (!c) fallos++;
};

// Cuenta nueva en el emulador de Auth
const email = `prueba-leer-${Date.now()}@musikeeo.test`;
const clave = 'clave-de-prueba-123';
const alta = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: clave, returnSecureToken: true }),
}).then(r => r.json()) as { localId: string };
const uid = alta.localId;

// /api/leer-perfil con la lógica del servidor: la «web» es la de la banda; Instagram, la de login
const deps = {
    descargar: async (url: string) => ({
        url, html: url.includes('instagram.com') ? fixture('instagram-login.html') : fixture('banda-jsonld.html'),
        estado: 200, tipo: 'text/html', bytes: 1, truncada: false, redirecciones: [],
    }),
    pedirIA: null, permitirLocal: false,
};
const pedidas: unknown[] = [];

const navegador = await chromium.launch();
type Pagina = Awaited<ReturnType<Awaited<ReturnType<typeof navegador.newContext>>['newPage']>>;
// Capturas sin la píldora «Entorno de pruebas» (solo sale con los emuladores)
const OCULTAR = '[role="status"].pointer-events-none.fixed { display: none !important; }';
async function foto(page: Pagina, nombre: string, alto?: number) {
    const antes = page.viewportSize();
    if (alto && antes) await page.setViewportSize({ width: antes.width, height: alto });
    await page.screenshot({ path: join(CAPTURAS, nombre), style: OCULTAR, fullPage: !alto });
    if (alto && antes) await page.setViewportSize(antes);
}
async function pagina(tema: 'light' | 'dark') {
    const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'es-ES', colorScheme: tema });
    await ctx.addInitScript(([t]) => { try { localStorage.setItem('musikeeo-theme-v3', t); localStorage.setItem('musikeeo-cookie-consent', JSON.stringify({ version: 1, analytics: 'denied', decidedAt: new Date().toISOString() })); } catch { /* */ } }, [tema]);
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('  [error de la página]', e.message));
    await page.route('**/api/leer-perfil', async route => {
        const cuerpo = route.request().postDataJSON() as { url?: string; texto?: string };
        pedidas.push(cuerpo);
        if (cuerpo.texto) return route.fulfill({ status: 404, contentType: 'text/html', body: '<!doctype html><title>404</title>' }); // como Vite: sin /api
        await new Promise(r => setTimeout(r, 1200)); // para ver «Leyendo tu web…»
        const r = await leerPerfil(cuerpo, deps);
        return route.fulfill({ status: r.estado, contentType: 'application/json', body: JSON.stringify(r.cuerpo) });
    });
    return { ctx, page };
}

try {
    // ─── Onboarding del músico ──────────────────────────────────────────────
    const { ctx, page } = await pagina('light');
    await page.goto(`${APP}/login`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', clave);
    await page.click('button[type="submit"]');
    await page.waitForURL(/onboarding/, { timeout: 20000 });
    await page.getByText('Músico o banda').click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByText('¿Tienes web o Instagram?').waitFor();
    ok(await page.getByRole('button', { name: 'Leer', exact: true }).isDisabled(), 'onboarding: «Leer» desactivado sin enlace');
    await page.getByLabel('Enlace de tu web o de tu Instagram').fill('rumbasur.es');
    await page.getByRole('button', { name: 'Leer', exact: true }).click();
    await page.getByText('Leyendo tu web…').waitFor();
    await page.evaluate(() => window.scrollTo(0, 0));
    await foto(page, '1-onboarding-leyendo.png');
    await page.getByText('Esto hemos encontrado').waitFor();
    ok(true, 'onboarding: «Leyendo tu web…» y luego la propuesta');
    const filas = await page.getByRole('region', { name: '¿Tienes web o Instagram?' }).locator('li').count();
    ok(filas >= 8, 'onboarding: una fila por campo encontrado', filas);
    await page.getByRole('region', { name: '¿Tienes web o Instagram?' }).scrollIntoViewIfNeeded();
    await foto(page, '2-onboarding-propuesta.png');
    // Facebook no: se desmarca
    await page.getByLabel('Usar facebook').uncheck({ force: true });
    await page.getByRole('button', { name: 'Poner en mi perfil' }).click();
    await page.getByText('Listo: lo hemos puesto en el formulario').waitFor();
    ok(await page.locator('input[placeholder="Ej. Rumba Sur"]').inputValue() === 'Rumba Sur', 'onboarding: el nombre va al formulario');
    ok(await page.locator('input[placeholder="Barcelona"]').inputValue() === 'Barcelona', 'onboarding: la ciudad va al formulario');
    ok(await page.getByText('Al entrar se guarda también tu bio', { exact: false }).isVisible(), 'onboarding: dice qué más se guardará (y se puede quitar)');
    await page.waitForTimeout(500); // que acabe la animación de salida de la propuesta
    await foto(page, '3-onboarding-aplicado.png');
    // Hasta aquí no se ha guardado nada
    const antes = await fetch(`${FS}/artists/artist_${uid}`).then(r => r.status);
    ok(antes === 404, 'onboarding: nada guardado antes de «Entrar»', antes);
    await page.getByRole('button', { name: 'Entrar en Musikeeo' }).click();
    await page.waitForURL(/eventos/, { timeout: 20000 });
    const doc = await fetch(`${FS}/artists/artist_${uid}`).then(r => r.json()) as { fields?: Record<string, { stringValue?: string; arrayValue?: { values?: { stringValue: string }[] }; mapValue?: { fields: Record<string, unknown> } }> };
    const f = doc.fields || {};
    ok(f.artistName?.stringValue === 'Rumba Sur' && f.city?.stringValue === 'Barcelona', 'guardado: nombre y ciudad', f.artistName);
    ok(f.bio?.stringValue?.startsWith('Somos cuatro músicos'), 'guardado: la bio aceptada', f.bio);
    ok((f.genres?.arrayValue?.values || []).map(v => v.stringValue).join() === 'Rumba,Flamenco,Versiones', 'guardado: estilos', f.genres);
    const redes = f.redes?.mapValue?.fields || {};
    ok('instagram' in redes && !('facebook' in redes), 'guardado: enlaces marcados (Instagram sí, Facebook no)', Object.keys(redes));
    ok(Object.keys(f.ficha?.mapValue?.fields || {}).includes('musicos'), 'guardado: la ficha', f.ficha);
    await ctx.close();

    // ─── Panel del perfil (/panel/perfil), en oscuro: Instagram que no se deja leer ───
    const p2 = await pagina('dark');
    const pg = p2.page;
    await pg.goto(`${APP}/login`);
    await pg.fill('input[type="email"]', email);
    await pg.fill('input[type="password"]', clave);
    await pg.click('button[type="submit"]');
    await pg.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 20000 });
    await pg.goto(`${APP}/panel/perfil`);
    await pg.getByText('¿Tienes web o Instagram?').waitFor({ timeout: 20000 });
    await pg.getByLabel('Enlace de tu web o de tu Instagram').fill('@rumbasur');
    await pg.getByRole('button', { name: 'Leer', exact: true }).click();
    await pg.getByText('Leyendo tu Instagram…').waitFor();
    await pg.getByText('No hemos podido leer tu Instagram: copia tu bio y pégala aquí').waitFor();
    ok(await pg.getByLabel('Pega aquí tu bio o el texto de tu web').isVisible(), 'panel: Instagram con login → cuadro para pegar la bio');
    await pg.getByRole('region', { name: '¿Tienes web o Instagram?' }).scrollIntoViewIfNeeded();
    await foto(pg, '4-panel-instagram-login-oscuro.png', 1100);
    await pg.getByLabel('Pega aquí tu bio o el texto de tu web').fill('Banda de rumba catalana de Barcelona 🎶 Somos cuatro músicos. Tocamos en bodas, fiestas y festivales. Cantamos en castellano y catalán. Contrataciones: 600 123 456');
    await pg.getByRole('button', { name: 'Leer el texto' }).click();
    await pg.getByText('Esto hemos encontrado').waitFor();
    ok(await pg.getByText('@rumbasur').isVisible(), 'panel: al pegar la bio se queda el enlace de Instagram');
    ok(!(await pg.getByRole('region', { name: '¿Tienes web o Instagram?' }).innerText()).includes('600 123 456'), 'panel: la bio propuesta sin teléfono');
    await pg.getByRole('region', { name: '¿Tienes web o Instagram?' }).scrollIntoViewIfNeeded();
    await foto(pg, '5-panel-propuesta-oscuro.png', 2300);
    await pg.getByRole('button', { name: 'Poner en mi perfil' }).click();
    await pg.getByRole('button', { name: 'Guardar Cambios' }).waitFor();
    ok((await pg.locator('textarea').last().inputValue()).startsWith('Banda de rumba catalana de Barcelona'), 'panel: la bio va al formulario');
    ok(await pg.locator('input[placeholder="https://www.instagram.com/tuusuario/"]').inputValue() === 'https://www.instagram.com/rumbasur/', 'panel: el Instagram va a «Tus enlaces»');
    ok(await pg.locator('input[placeholder="Castellano y catalán"]').inputValue() === 'Castellano, catalán', 'panel: los idiomas van a «La ficha»');
    await pg.getByText('La ficha', { exact: true }).scrollIntoViewIfNeeded();
    await foto(pg, '6-panel-formulario-relleno-oscuro.png', 1400);
    // Antes de guardar, en Firestore sigue lo del onboarding
    type Doc = { fields?: Record<string, { stringValue?: string; mapValue?: { fields: Record<string, { stringValue?: string }> } }> };
    const leerDoc = () => fetch(`${FS}/artists/artist_${uid}`).then(r => r.json()) as Promise<Doc>;
    ok((await leerDoc()).fields?.bio?.stringValue?.startsWith('Somos cuatro músicos'), 'panel: «Poner en mi perfil» no guarda nada');
    await pg.getByRole('button', { name: 'Guardar Cambios' }).click();
    // Al guardar, la barra de cambios se va
    await pg.getByRole('button', { name: 'Guardar Cambios' }).waitFor({ state: 'hidden', timeout: 15000 });
    let doc2: Doc = {};
    for (let i = 0; i < 40; i++) {
        doc2 = await leerDoc();
        if (doc2.fields?.bio?.stringValue?.startsWith('Banda de rumba catalana')) break;
        await new Promise(r => setTimeout(r, 250));
    }
    ok(doc2.fields?.redes?.mapValue?.fields?.instagram?.stringValue === 'https://www.instagram.com/rumbasur/', 'panel: guardado el enlace de Instagram', doc2.fields?.redes);
    ok(doc2.fields?.bio?.stringValue?.startsWith('Banda de rumba catalana'), 'panel: guardada la bio', doc2.fields?.bio);
    ok(pedidas.length === 3, 'peticiones a /api/leer-perfil: web, Instagram y texto', pedidas);
    await p2.ctx.close();
} catch (e) {
    fallos++;
    console.log('✗ la prueba se ha parado:', e instanceof Error ? e.message : e);
} finally {
    await navegador.close();
}
console.log(`\nCapturas en ${CAPTURAS}`);
process.exit(fallos ? 1 : 0);

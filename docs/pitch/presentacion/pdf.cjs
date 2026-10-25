// Saca la presentación en PDF (1920×1080 por lámina):
//   node docs/pitch/presentacion/pdf.cjs docs/pitch/presentacion/Musikeeo-presentacion.pdf
// Necesita Playwright con Chromium. Las fuentes salen de public/fonts.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.join(__dirname, 'presentacion.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.pdf({ path: path.resolve(process.argv[2] || 'Musikeeo-presentacion.pdf'), width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });

import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto('http://127.0.0.1:5441/?silent=1', { waitUntil: 'load' });
for (let i = 0; i < 90; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(800);
console.log(await page.evaluate(async () => {
  const h = window.__hw, D = h.destruction, w = D.walls[0];
  const out = { mode: D.mode, spec: { x: w.x, z: w.z, len: w.len, cols: w.cols, courses: w.courses, dir: w.dir, standing: w.standing }, bodies: w.bodies?.length, p0: w.bodies?.[0]?.position, pLast: w.bodies?.[w.bodies.length - 1]?.position };
  const { blast } = await import('/src/destruction.js');
  const T = h.THREE; const p = new T.Vector3(w.x + 0.8, 0.6, w.z);
  blast(p, 3.4, 9); out.afterStanding = w.standing; out.touched = w.touched;
  await new Promise((r) => setTimeout(r, 1500));
  out.p0after = w.bodies?.[0]?.position; out.standingWalls = D.walls.filter((x) => x.standing).length;
  return JSON.stringify(out);
}));
await page.screenshot({ path: 'qa/blast-debug.png' });
await browser.close();

import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto('http://127.0.0.1:5441/?silent=1&' + (process.argv[2] || ''), { waitUntil: 'load' });
for (let i = 0; i < 120; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(2500);
console.log(await page.evaluate(() => {
  const D = window.__hw.destruction; const out = [];
  for (const spec of D.walls.filter((s) => s.kind === 'house').slice(0, 3)) {
    let moved = 0, maxd = 0, nan = 0, maxy = 0, miny = 99; const byFace = [0, 0, 0, 0]; let gable = 0;
    spec.items.forEach((it, i) => { const p = spec.bodies[i].position; if (!isFinite(p[0] + p[1] + p[2])) { nan++; return; } const d = Math.hypot(p[0] - it.p.x, p[1] - it.p.y, p[2] - it.p.z); maxd = Math.max(maxd, d); if (d > 0.1) { moved++; byFace[it.face]++; if (it.p.y > spec.house.top) gable++; } maxy = Math.max(maxy, p[1]); miny = Math.min(miny, p[1]); });
    const slabs = spec.slabs.map((s) => { const p = s.body.position; return +Math.hypot(p[0] - s.p.x, p[1] - s.p.y, p[2] - s.p.z).toFixed(2); });
    out.push({ n: spec.items.length, moved, byFace, gable, maxd: +maxd.toFixed(2), nan, maxy: +maxy.toFixed(2), miny: +miny.toFixed(2), slabs, standing: spec.standing, ridgeX: spec.house.ridgeX, brick: spec.house.brick });
  }
  return JSON.stringify(out);
}));
await browser.close();

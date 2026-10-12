import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto('http://127.0.0.1:5441/?silent=1&nhouses=2&phys=0', { waitUntil: 'load' });
for (let i = 0; i < 120; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
console.log(await page.evaluate(() => {
  const T = window.__hw.THREE, D = window.__hw.destruction; const out = [];
  for (const spec of D.walls.filter((s) => s.kind === 'house')) {
    // corners of every item vs each slab's local box (and slab vs slab)
    const res = { items: spec.items.length, slabs: [] };
    for (const s of spec.slabs) {
      const inv = s.q.clone().invert(); let inside = 0, minGap = 9, worst = null;
      for (const it of spec.items) {
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
          const c = new T.Vector3(sx * it.size.x / 2, sy * it.size.y / 2, sz * it.size.z / 2).applyQuaternion(it.q).add(it.p).sub(s.p).applyQuaternion(inv);
          const dx = Math.abs(c.x) - s.size.x / 2, dy = Math.abs(c.y) - s.size.y / 2, dz = Math.abs(c.z) - s.size.z / 2; const gap = Math.max(dx, dy, dz);
          if (gap < 0) inside++; if (gap < minGap) { minGap = gap; worst = { face: it.face, y: +it.p.y.toFixed(2), gable: it.p.y > spec.house.top, dy: +dy.toFixed(3) }; }
        }
      }
      res.slabs.push({ inside, minGap: +minGap.toFixed(3), worst });
    }
    if (spec.slabs.length === 2) { const [a, b] = spec.slabs; const inv = b.q.clone().invert(); let ins = 0; for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) { const c = new T.Vector3(sx * a.size.x / 2, sy * a.size.y / 2, sz * a.size.z / 2).applyQuaternion(a.q).add(a.p).sub(b.p).applyQuaternion(inv); if (Math.abs(c.x) < b.size.x / 2 && Math.abs(c.y) < b.size.y / 2 && Math.abs(c.z) < b.size.z / 2) ins++; } res.slabSlab = ins; }
    out.push(res);
  }
  return JSON.stringify(out);
}));
await browser.close();

// HEADLESS: new bullet streaks + explosion — frames at fixed moments after a rocket hits a house, plus an AK burst.
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const out = 'C:/Users/User/Desktop/Claude code projects/hood-warfare/qa/';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/X4122/.test(m.text())) errs.push(m.text().slice(0, 200)); });
await page.goto('http://127.0.0.1:5441/?silent=1&nosubmit=1&nohud=1', { waitUntil: 'load' });
for (let i = 0; i < 120; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(1200);
await page.evaluate(() => { const h = window.__hw; for (const b of h.bots) { b.pos.set(40, 0, -44); b.perceiveT = 1e9; b.speed = 0; b.wanderT = 1e9; b.wander = b.pos.clone(); b.path = null; b.target = null; } h.player.pos.set(-1, 0, -28); h.player.yaw = Math.PI / 2 + 0.12; h.player.pitch = 0.02; });
await page.waitForTimeout(3000);
// AK burst down the street
await page.evaluate(() => { const h = window.__hw; h.player.yaw = 0.05; h.input.fire = true; }); await page.waitForTimeout(140); await page.screenshot({ path: out + 'fx-ak-1.png' });
await page.waitForTimeout(110); await page.screenshot({ path: out + 'fx-ak-2.png' }); await page.evaluate(() => { window.__hw.input.fire = false; });
await page.evaluate(() => { const h = window.__hw; h.input.swap = 'rpg'; h.player.yaw = Math.PI / 2 + 0.12; }); await page.waitForTimeout(900);
const t0 = Date.now();
await page.evaluate(() => { window.__hw.input.fire = true; }); await page.waitForTimeout(60); await page.evaluate(() => { window.__hw.input.fire = false; });
await page.waitForFunction(() => window.__hw.launcher.rockets.length === 0, null, { timeout: 5000 });
const marks = [0, 0.12, 0.4, 1.4, 3.0];
let last = 0; for (const m of marks) { await page.waitForTimeout(Math.max(0, m * 1000 - last)); last = m * 1000; await page.screenshot({ path: out + `fx-boom-${m}.png` }); if (m === 0.12) console.log('dbg', JSON.stringify(await page.evaluate(() => { const f = window.__hw.fx; const vis = f.billows.filter((b) => b.s.visible); const by = {}; for (const b of vis) { const k = b.kind; by[k] = by[k] || { n: 0, ex: null }; by[k].n++; if (!by[k].ex) by[k].ex = { mapw: b.s.material.map?.repeat?.x, col: b.s.material.color.toArray().map((v) => +v.toFixed(2)), op: +b.s.material.opacity.toFixed(2), tm: b.s.material.toneMapped, bl: b.s.material.blending, img: !!(b.s.material.map && b.s.material.map.image), w: b.s.material.map?.image?.width, sc: +b.s.scale.x.toFixed(2) }; } return { by, parts: f.parts.filter((q) => q.s.visible).map((q) => q.s.material === f.sparkMat ? 'spark' : q.s.material === f.boomMat ? 'boom' : q.s.material === f.smokeMat ? 'smoke' : q.s.material === f.dustMat ? 'dust' : 'other').reduce((a, k) => (a[k] = (a[k] || 0) + 1, a), {}) }; }))); }
console.log(JSON.stringify({ fps: await page.evaluate(() => document.getElementById('fps').textContent), last: await page.evaluate(() => window.__hw.destruction.last), errs }));
await browser.close();

// HEADLESS: measure the worst frame time around the first RPG shot.
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://127.0.0.1:5441/?silent=1', { waitUntil: 'load' });
for (let i = 0; i < 120; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(2500);
await page.evaluate(() => { const h = window.__hw; h.player.pos.set(-4, 0, -28); h.player.yaw = Math.PI / 2; h.player.pitch = 0; for (const b of h.bots) { b.pos.set(40, 0, -44); b.perceiveT = 1e9; b.speed = 0; } h.input.swap = 'rpg'; });
await page.waitForTimeout(1500);
const r = await page.evaluate(() => new Promise((res) => {
  const d = []; let last = performance.now(); let n = 0;
  const tick = (t) => { d.push(t - last); last = t; if (++n === 20) { window.__hw.input.fire = true; setTimeout(() => { window.__hw.input.fire = false; }, 80); } if (n < 110) requestAnimationFrame(tick); else res(d); };
  requestAnimationFrame(tick);
})).then((d) => { const fire = d.slice(20, 110); return { before: Math.max(...d.slice(2, 20)).toFixed(1), worstAfterFire: Math.max(...fire).toFixed(1), top3: [...fire].sort((a, b) => b - a).slice(0, 3).map((x) => x.toFixed(1)) }; });
console.log(JSON.stringify(r));
await browser.close();

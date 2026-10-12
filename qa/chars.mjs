// HEADLESS close-up QA of the Tripo characters (no visible window).
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const out = 'C:/Users/User/Desktop/Claude code projects/hood-warfare/qa/';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-swiftshader', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/X4122/.test(m.text())) errs.push(m.text().slice(0, 300)); });
page.on('response', (r) => { if (r.status() >= 400) errs.push('http ' + r.status() + ' ' + r.url()); });
await page.goto('http://127.0.0.1:5441/?silent=1', { waitUntil: 'load' });
for (let i = 0; i < 90; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
console.log('msg', await page.evaluate(() => document.getElementById('pmsg').textContent));
await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(800);
// line up 4 bots (one per model) in a row in front of the player, frozen, on the street
const setup = await page.evaluate(() => {
  const h = window.__hw, T = h.THREE; const P = h.player; P.pos.set(0, 0, 10); P.yaw = Math.PI; P.pitch = -0.05;
  const seen = new Set(); const pick = [];
  for (const b of h.bots) if (!seen.has(b.ch.name)) { seen.add(b.ch.name); pick.push(b); }
  pick.forEach((b, i) => { b.speed = 0; b.frozen = true; b.pos.set(-3 + i * 2, 0, 15); b.yaw = Math.PI; b.target = null; b.perceiveT = 1e9; b.path = null; b.wander = b.pos.clone(); b.wanderT = 1e9; });
  for (const b of h.bots) if (!pick.includes(b)) { b.pos.set(30, 0, -40); b.perceiveT = 1e9; b.speed = 0; }
  window.__pick = pick; return pick.map((b) => b.ch.name + ':' + b.team);
});
console.log('lineup', setup);
await page.waitForTimeout(1500);
await page.screenshot({ path: out + 'chars-lineup-idle.png' });
// aiming pose: give each a target = the player
await page.evaluate(() => { const T = window.__hw.THREE; const dummy = { pos: new T.Vector3(0, 0, 40), dead: false, team: 'x' }; for (const b of window.__pick) { b.target = dummy; b.seeT = 1e9; b.lastSeen = dummy.pos.clone(); b.reactT = 1e9; b.burst = 0; b.burstGap = 1e9; } });
await page.waitForTimeout(1200);
await page.screenshot({ path: out + 'chars-lineup-aim.png' });
// side view of the aim pose
await page.evaluate(() => { const P = window.__hw.player; P.pos.set(3.2, 0, 15.6); P.yaw = Math.PI / 2; P.pitch = -0.12; });
await page.waitForTimeout(800);
await page.screenshot({ path: out + 'chars-side-aim.png' });
await page.evaluate(() => { const P = window.__hw.player; P.pos.set(1.8, 0, 18.2); P.yaw = Math.PI * 0.8; P.pitch = -0.15; });
await page.waitForTimeout(600);
await page.screenshot({ path: out + 'chars-back-aim.png' });
// running: let the AI loose and watch from the sidewalk
await page.evaluate(() => { for (const b of window.__hw.bots) { b.speed = 4.2; b.perceiveT = 0; b.reactT = 0; b.target = null; b.seeT = -1e9; b.wanderT = 0; } const P = window.__hw.player; P.pos.set(-6, 0, 2); P.yaw = Math.PI - 0.3; P.pitch = 0; });
await page.waitForTimeout(4000);
await page.screenshot({ path: out + 'chars-running.png' });
console.log(await page.evaluate(() => { const h = window.__hw; return JSON.stringify({ fps: document.getElementById('fps').textContent, tris: h.renderer.info.render.triangles, calls: h.renderer.info.render.calls, alive: h.bots.filter((b) => !b.dead).length, anims: h.bots[0].ch.cur }); }));
console.log('errors', errs.length, JSON.stringify(errs.slice(0, 10)));
await browser.close();

// HEADLESS: one character aiming at a dummy target, shot from the side and 3/4 front. Usage: node qa/grip.mjs [model]
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const out = 'C:/Users/User/Desktop/Claude code projects/hood-warfare/qa/';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-swiftshader', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:5441/?silent=1', { waitUntil: 'load' });
for (let i = 0; i < 90; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(600);
const freeze = (aim) => page.evaluate((aim) => {
  const h = window.__hw, T = h.THREE; const b = h.bots.find((x) => x.ch.name === 'red_hoodie') || h.bots[0];
  for (const o of h.bots) if (o !== b) { o.pos.set(30, 0, -40); o.perceiveT = 1e9; o.speed = 0; }
  b.speed = 0; b.pos.set(0, 0, 15); b.yaw = 0; b.path = null; b.perceiveT = 1e9; b.wanderT = 1e9; b.wander = b.pos.clone();
  const dummy = { pos: new T.Vector3(0, 0, 40), dead: false, team: 'x' };
  if (aim) { b.target = dummy; b.seeT = 1e9; b.lastSeen = dummy.pos.clone(); b.reactT = 1e9; b.burstGap = 1e9; b.burst = 0; } else { b.target = null; b.seeT = -1e9; }
  window.__b = b; return b.ch.name;
}, aim);
const cam = (x, z, yaw, pitch) => page.evaluate(([x, z, yaw, pitch]) => { const P = window.__hw.player; P.pos.set(x, 0, z); P.yaw = yaw; P.pitch = pitch; }, [x, z, yaw, pitch]);
console.log('model', await freeze(true)); await page.waitForTimeout(1200);
await cam(-2.6, 15.2, -Math.PI / 2, -0.12); await page.waitForTimeout(500);
await page.screenshot({ path: out + 'grip-side.png', clip: { x: 340, y: 150, width: 600, height: 500 } });
await cam(1.6, 18.0, 2.6, -0.1); await page.waitForTimeout(500);
await page.screenshot({ path: out + 'grip-front.png', clip: { x: 340, y: 150, width: 600, height: 500 } });
await freeze(false); await page.waitForTimeout(1200);
await cam(-2.6, 15.2, -Math.PI / 2, -0.12); await page.waitForTimeout(500);
await page.screenshot({ path: out + 'grip-lowready.png', clip: { x: 340, y: 150, width: 600, height: 500 } });
console.log('errors', JSON.stringify(errs));
await browser.close();

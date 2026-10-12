import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-swiftshader', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto('http://127.0.0.1:5441/?silent=1', { waitUntil: 'load' });
for (let i = 0; i < 90; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(600);
for (const aim of [false, true]) {
  await page.evaluate((aim) => {
    const h = window.__hw, T = h.THREE; const b = h.bots.find((x) => x.ch.name === 'red_hoodie');
    b.speed = 0; b.pos.set(0, 0, 15); b.yaw = 0; b.path = null; b.perceiveT = 1e9; b.wanderT = 1e9; b.wander = b.pos.clone();
    const dummy = { pos: new T.Vector3(0, 0, 40), dead: false, team: 'x' };
    if (aim) { b.target = dummy; b.seeT = 1e9; b.lastSeen = dummy.pos.clone(); b.reactT = 1e9; b.burstGap = 1e9; } else { b.target = null; b.seeT = -1e9; }
    window.__b = b;
  }, aim);
  await page.waitForTimeout(1500);
  console.log(aim ? 'AIM' : 'LOW', await page.evaluate(() => {
    const T = window.__hw.THREE, b = window.__b, c = b.ch; const f = (v) => v.toArray().map((x) => +x.toFixed(2));
    const wp = (o) => f(o.getWorldPosition(new T.Vector3()));
    const bb = new T.Box3().setFromObject(c.gun);
    let meshes = 0, vis = 0; c.gun.traverse((o) => { if (o.isMesh) { meshes++; if (o.visible) vis++; } });
    return JSON.stringify({ ready: +c.ready.toFixed(2), pitch: +c.aimPitch.toFixed(2), gunVisible: c.gun.visible, gunPos: f(c.gun.position), gunBox: [f(bb.min), f(bb.max)], meshes, vis,
      spine: wp(c.b.spine), rArm: wp(c.b.rArm), rHand: wp(c.b.rHand), lArm: wp(c.b.lArm), lHand: wp(c.b.lHand), muzzle: f(c.muzzleWorld()), cur: c.cur });
  }));
}
await browser.close();

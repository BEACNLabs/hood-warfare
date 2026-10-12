// HEADLESS: every gun — viewmodel at hip and aimed, a burst into a target bot, kills, errors, fps. Desktop + phone.
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const out = 'C:/Users/User/Desktop/Claude code projects/hood-warfare/qa/';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
for (const [tag, vp, mobile] of [['desk', { width: 1280, height: 720 }, false], ['phone', { width: 430, height: 932 }, true]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/X4122/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await page.goto(`http://127.0.0.1:5441/?silent=1&nosubmit=1${mobile ? '&mobile=1' : ''}`, { waitUntil: 'load' });
  for (let i = 0; i < 120; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
  await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(1000);
  const res = {};
  for (const id of ['ak', 'mac10', 'mp5', 'm700']) {
    // one opp standing 14 m ahead in the street, everyone else away
    await page.evaluate((id) => { const h = window.__hw; let first = true; for (const b of h.bots) { b.perceiveT = 1e9; b.speed = 0; b.wanderT = 1e9; b.path = null; b.target = null; b.reactT = 1e9; if (b.team === 'red' && first) { first = false; window.__t = b; b.dead = false; b.hp = 100; b.respawn?.(new h.THREE.Vector3(0.5, 0, -14)); b.pos.set(0.5, 0, -14); } else b.pos.set(40, 0, -44); b.wander = b.pos.clone(); } h.player.pos.set(0.5, 0, 0); h.player.yaw = 0; h.player.pitch = Math.atan2(1.2 - 1.62, 14); h.input.swap = id; }, id);
    await page.waitForTimeout(700);
    await page.screenshot({ path: out + `guns-${tag}-${id}-hip.png` });
    await page.evaluate(() => { window.__hw.input.ads = true; }); await page.waitForTimeout(500);
    await page.screenshot({ path: out + `guns-${tag}-${id}-ads.png` });
    const k0 = await page.evaluate(() => window.__hw.player.kills);
    // fire: auto guns hold 0.6 s, the bolt-action taps once
    if (id === 'm700') { await page.evaluate(() => { window.__hw.input.fire = true; }); await page.waitForTimeout(60); await page.evaluate(() => { window.__hw.input.fire = false; }); }
    else { await page.evaluate(() => { window.__hw.input.fire = true; }); await page.waitForTimeout(600); await page.evaluate(() => { window.__hw.input.fire = false; }); }
    await page.waitForTimeout(300);
    res[id] = await page.evaluate((k0) => { const h = window.__hw, g = h.guns[h.arsenal.cur]; return { cur: h.arsenal.cur, name: document.getElementById('wname').textContent, mag: g.mag, kills: h.player.kills - k0, tHp: Math.round(window.__t.hp), fov: +h.camera.fov.toFixed(1), scope: document.getElementById('scope').classList.contains('on') }; }, k0);
    await page.evaluate(() => { window.__hw.input.ads = false; }); await page.waitForTimeout(300);
  }
  console.log(tag, JSON.stringify({ res, fps: await page.evaluate(() => document.getElementById('fps').textContent), errs }));
  await ctx.close();
}
await browser.close();

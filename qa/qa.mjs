// Headed-but-offscreen Chrome QA (WebGL needs a real GPU path here). node qa/qa.mjs [desktop|phone|both] [extra]
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const out = 'C:/Users/User/Desktop/Claude code projects/hood-warfare/qa/';
const which = process.argv[2] || 'both', extra = process.argv[3] || '';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--use-angle=default'] });
const runs = [['desktop', { width: 1280, height: 800 }, false], ['phone', { width: 430, height: 932 }, true]].filter(([n]) => which === 'both' || which === n);
for (const [name, vp, mobile] of runs) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage(); const errs = [], logs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { const t = m.text(); if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + t.slice(0, 300)); else logs.push(t.slice(0, 200)); });
  page.on('requestfailed', (r) => errs.push('reqfail: ' + r.url()));
  page.on('response', (r) => { if (r.status() >= 400) errs.push('http ' + r.status() + ' ' + r.url()); });
  const t0 = Date.now();
  await page.goto(`http://127.0.0.1:5441/?silent=1${mobile ? '&mobile=1' : ''}${extra}`, { waitUntil: 'load' });
  for (let i = 0; i < 60; i++) { await page.waitForTimeout(1000); const on = await page.evaluate(() => document.getElementById('go').classList.contains('on')); if (on) break; }
  const msg = await page.evaluate(() => document.getElementById('pmsg').textContent);
  console.log(name, 'ready after', Math.round((Date.now() - t0) / 1000) + 's', msg);
  await page.screenshot({ path: out + name + '-title.png' });
  if (/Could not start/.test(msg)) { console.log(name, 'errors', JSON.stringify(errs.slice(0, 12))); await ctx.close(); continue; }
  await page.evaluate(() => window.__hw.startMatch());
  await page.waitForTimeout(1500);
  // look around a bit and walk forward
  await page.evaluate(() => { const p = window.__hw.player; p.yaw = Math.PI; p.pitch = 0.02; });
  await page.waitForTimeout(400);
  await page.screenshot({ path: out + name + '-game1.png' });
  await page.evaluate(() => { const p = window.__hw.player; p.pos.set(-9.5, 0, 20); p.yaw = -0.9; p.pitch = 0.05; });
  await page.waitForTimeout(600);
  await page.screenshot({ path: out + name + '-game2.png' });
  await page.evaluate(() => { const p = window.__hw.player; p.pos.set(33.5, 0, 10); p.yaw = 0.1; p.pitch = 0.05; });
  await page.waitForTimeout(600);
  await page.screenshot({ path: out + name + '-game3.png' });
  // fire a burst
  await page.evaluate(() => { const p = window.__hw.player; p.pos.set(0, 0, 30); p.yaw = Math.PI; });
  await page.evaluate(() => { window.__hw.input.fire = true; }); await page.waitForTimeout(260); await page.evaluate(() => { window.__hw.input.fire = false; });
  await page.waitForTimeout(30);
  await page.screenshot({ path: out + name + '-fire.png' });
  const st = await page.evaluate(() => { const h = window.__hw; return { fps: document.getElementById('fps').textContent, mag: h.weapon.mag, bots: h.bots.length, score: h.score, draws: h.renderer.info.render.calls, tris: h.renderer.info.render.triangles, pos: h.player.pos.toArray().map((v) => +v.toFixed(1)), dpr: h.renderer.getPixelRatio(), mem: h.renderer.info.memory }; });
  console.log(name, JSON.stringify(st));
  // let the bots play for a while, then sample again
  await page.waitForTimeout(8000);
  const st2 = await page.evaluate(() => { const h = window.__hw; return { fps: document.getElementById('fps').textContent, score: h.score, feed: document.getElementById('feed').innerText.replace(/\n/g, ' | '), alive: h.bots.filter((b) => !b.dead).length, hp: Math.round(h.player.hp) }; });
  console.log(name, JSON.stringify(st2));
  await page.screenshot({ path: out + name + '-later.png' });
  console.log(name, 'errors', errs.length, JSON.stringify(errs.slice(0, 12)));
  console.log(name, 'logs', JSON.stringify(logs.slice(0, 8)));
  await ctx.close();
}
await browser.close();

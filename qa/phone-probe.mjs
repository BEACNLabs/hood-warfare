import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-swiftshader', '--mute-audio'] });
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage(); const errs = [];
page.on('crash', () => console.log('PAGE CRASHED'));
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
try {
  await page.goto('http://127.0.0.1:5441/?silent=1&mobile=1', { waitUntil: 'load' });
  for (let i = 0; i < 60; i++) { await page.waitForTimeout(1000); const st = await page.evaluate(() => ({ go: document.getElementById('go').classList.contains('on'), msg: document.getElementById('pmsg').textContent })); if (i % 5 === 0) console.log(i, JSON.stringify(st)); if (st.go) break; }
  console.log(await page.evaluate(() => JSON.stringify({ dpr: window.__hw.renderer.getPixelRatio(), mem: window.__hw.renderer.info.memory, w: innerWidth, h: innerHeight })));
  await page.screenshot({ path: 'qa/phone-title.png' });
  await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(1500);
  await page.evaluate(() => { const p = window.__hw.player; p.pos.set(-9.5, 0, 20); p.yaw = -0.9; p.pitch = 0.05; }); await page.waitForTimeout(1200);
  await page.screenshot({ path: 'qa/phone-game2.png' });
  console.log(await page.evaluate(() => document.getElementById('fps').textContent));
} catch (e) { console.log('ERR', e.message.slice(0, 200)); }
console.log('errors', JSON.stringify(errs.filter((e) => !/X4122/.test(e)).slice(0, 8)));
await browser.close();

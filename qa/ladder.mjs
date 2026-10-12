// HEADLESS: title hint + RPG callout + end-of-match ladder panel (against local wrangler on :8787) + leaderboard page.
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const out = 'C:/Users/User/Desktop/Claude code projects/hood-warfare/qa/';
const API = 'http://127.0.0.1:8787';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
for (const [tag, vp, mobile] of [['desktop', { width: 1280, height: 800 }, false], ['phone', { width: 430, height: 932 }, true]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/X4122/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  await page.addInitScript(() => { try { localStorage.setItem('hw.id', JSON.stringify({ name: 'Rico', wallet: '' })); } catch {} });
  await page.goto(`http://127.0.0.1:5441/?silent=1&api=${API}${mobile ? '&mobile=1' : ''}`, { waitUntil: 'load' });
  for (let i = 0; i < 90; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
  const title = await page.evaluate(() => ({ hint: document.getElementById('hint').textContent.slice(0, 60), pmsg: document.getElementById('pmsg').textContent, name: document.getElementById('gname').value, ladder: document.getElementById('ladder').getAttribute('href') }));
  await page.screenshot({ path: out + `ladder-${tag}-title.png` });
  await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(2300);
  const callout = await page.evaluate(() => document.querySelector('#callout .t').textContent + ' / ' + document.querySelector('#callout small').textContent);
  await page.screenshot({ path: out + `ladder-${tag}-callout.png` });
  await page.evaluate(() => { window.__hw.MATCH.left = 0.5; }); await page.waitForTimeout(4500);
  const end = await page.evaluate(() => ({ end: document.getElementById('end').textContent, lmsg: document.getElementById('lmsg').textContent, panel: document.getElementById('lboard').classList.contains('on'), tiers: [...document.querySelectorAll('#lboard .tier b')].map((b) => b.textContent), rows: [...document.querySelectorAll('#lboard tr')].slice(1).map((r) => r.textContent.replace(/\s+/g, ' ').trim()) }));
  await page.screenshot({ path: out + `ladder-${tag}-end.png` });
  console.log(tag, JSON.stringify({ title, callout, end, errs }, null, 1));
  await ctx.close();
}
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`http://127.0.0.1:5441/site/leaderboard.html?api=${API}`, { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
console.log('leaderboard', JSON.stringify(await page.evaluate(() => ({ week: document.getElementById('weekLabel').textContent, players: document.getElementById('players').textContent, rows: [...document.querySelectorAll('tbody tr')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()) }))));
await page.screenshot({ path: out + 'ladder-page.png' });
await page.setViewportSize({ width: 430, height: 932 }); await page.waitForTimeout(400); await page.screenshot({ path: out + 'ladder-page-phone.png' });
await browser.close();

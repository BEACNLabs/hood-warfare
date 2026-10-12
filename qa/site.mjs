// HEADLESS: landing page QA at 430x932 and 1280x800 (scroll-step shots, console errors, page weight).
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const out = 'C:/Users/User/Desktop/Claude code projects/hood-warfare/qa/';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
for (const [name, vp, mobile] of [['site-phone', { width: 430, height: 932 }, true], ['site-desktop', { width: 1280, height: 800 }, false]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errs = []; let bytes = 0; const reqs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('response', async r => { try { const b = (await r.body()).length; bytes += b; reqs.push([r.url().split('/').pop().slice(0, 40), b]); } catch {} });
  await page.goto('http://127.0.0.1:5441/site/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await page.screenshot({ path: out + name + '-1.png' });
  const steps = Math.min(7, Math.ceil(h / vp.height));
  for (let i = 1; i < steps; i++) { await page.evaluate(y => scrollTo(0, y), i * vp.height); await page.waitForTimeout(700); await page.screenshot({ path: out + name + '-' + (i + 1) + '.png' }); }
  console.log(name, 'height', h, 'hOverflow', overflow, 'bytes', (bytes / 1024).toFixed(0) + 'KB', 'errors', errs.length, errs.slice(0, 5));
  console.log(reqs.sort((a, b) => b[1] - a[1]).slice(0, 6).map(r => r[0] + ':' + (r[1] / 1024).toFixed(0) + 'K').join('  '));
  await ctx.close();
}
await browser.close();

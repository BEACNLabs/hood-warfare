// HEADLESS: boot the extracted Netlify bundle on :5442 — landing at /, game at /play/ — report 404s and errors.
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const out = 'C:/Users/User/Desktop/Claude code projects/hood-warfare/qa/';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const bad = [], errs = [];
page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().replace('http://127.0.0.1:5442', '')); });
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/X4122/.test(m.text())) errs.push(m.text().slice(0, 200)); });
await page.goto('http://127.0.0.1:5442/', { waitUntil: 'networkidle' });
const playHref = await page.evaluate(() => [...document.querySelectorAll('a')].filter(a => /play now/i.test(a.textContent)).map(a => a.getAttribute('href')));
await page.screenshot({ path: out + 'bundle-landing.png' });
await page.goto('http://127.0.0.1:5442/play/?silent=1', { waitUntil: 'load' });
let ready = false;
for (let i = 0; i < 60; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) { ready = true; break; } }
const msg = await page.evaluate(() => document.getElementById('pmsg')?.textContent);
let stat = null; if (ready) { await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(2500);
stat = await page.evaluate(() => { const D = window.__hw.destruction; return { fps: document.getElementById('fps')?.textContent, mode: D.mode, blocks: D.blocks, bots: window.__hw.bots.length }; }); }
await page.screenshot({ path: out + 'bundle-game.png' });
console.log(JSON.stringify({ playHref, ready, msg, stat, bad, errs }, null, 1));
await browser.close();

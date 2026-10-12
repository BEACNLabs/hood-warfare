import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|X4122/.test(m.text())) { const l = m.location(); console.log('console.error:', m.text().slice(0, 600), '@', l.url?.split('/').pop(), l.lineNumber); } });
page.on('pageerror', (e) => console.log('pageerror:', e.message, '\n', (e.stack || '').split('\n').slice(0, 6).join('\n')));
await page.goto('http://127.0.0.1:5441/?silent=1', { waitUntil: 'load' });
for (let i = 0; i < 60; i++) { await page.waitForTimeout(1000); const t = await page.evaluate(() => document.getElementById('pmsg').textContent); if (/DEPLOY|Could not/.test(t)) { console.log('msg:', t); break; } }
await browser.close();

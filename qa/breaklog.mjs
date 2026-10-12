import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto('http://127.0.0.1:5441/?silent=1&breaklog=1&' + (process.argv[2] || ''), { waitUntil: 'load' });
for (let i = 0; i < 120; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(9000);
console.log('standing', await page.evaluate(() => { const D = window.__hw.destruction; return JSON.stringify({ broken: D.broken, standing: D.walls.filter((x) => x.standing).length, of: D.walls.length }); }));
console.log(await page.evaluate(() => { const L = window.__hw.destruction.log; const h = {}; for (const e of L) { const k = `${e.k}|slab=${e.slab}|pane=${e.pane}|corner=${e.corner}|gable=${e.gable}|y=${e.y}`; h[k] = (h[k] || 0) + 1; } return JSON.stringify(Object.entries(h).sort((a, b) => b[1] - a[1]).slice(0, 14)); }));
await browser.close();

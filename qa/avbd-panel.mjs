import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const q = process.argv[2] || '';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
const page = await browser.newPage(); const logs = [];
page.on('console', (m) => logs.push(m.text().slice(0, 300))); page.on('pageerror', (e) => logs.push('pageerror ' + e.message));
await page.goto('http://127.0.0.1:5441/qa/avbd-panel.html?' + q);
for (let i = 0; i < 60; i++) { await page.waitForTimeout(500); if (logs.some((l) => /^DONE|^ERR/.test(l))) break; }
console.log(logs.join('\n'));
await browser.close();

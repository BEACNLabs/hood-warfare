// HEADLESS sky comparison: node qa/sky.mjs "<query string>" <label>   e.g. node qa/sky.mjs "sky=rooftop_night&skyi=1" rooftop
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const [q = '', label = 'sky'] = process.argv.slice(2);
const out = 'C:/Users/User/Desktop/Claude code projects/hood-warfare/qa/sky/';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-swiftshader', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('response', (r) => { if (r.status() >= 400) errs.push('http ' + r.status() + ' ' + r.url()); });
await page.goto('http://127.0.0.1:5441/?silent=1&' + q, { waitUntil: 'load' });
for (let i = 0; i < 90; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(600);
const shot = async (n, x, z, yaw, pitch) => { await page.evaluate(([x, z, yaw, pitch]) => { const P = window.__hw.player; P.pos.set(x, 0, z); P.yaw = yaw; P.pitch = pitch; for (const b of window.__hw.bots) b.pos.set(40, 0, -44); }, [x, z, yaw, pitch]); await page.waitForTimeout(700); await page.screenshot({ path: `${out}${label}-${n}.png` }); };
await shot('street', 0, 30, Math.PI, 0.18);      // looking north down the street, sky above the far houses
await shot('south', 0, -20, 0, 0.22);            // opposite way
await shot('yard', -30, 10, -0.6, 0.3);          // from a backyard over the roofs
console.log(label, 'errors', JSON.stringify(errs.slice(0, 5)));
await browser.close();

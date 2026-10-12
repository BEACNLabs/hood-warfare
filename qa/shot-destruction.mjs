// HEADLESS: one clean 1920x1080 aftermath shot of a rocketed house front (no HUD) for the landing page.
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const out = 'C:/Users/User/Desktop/Claude code projects/hood-warfare/site/img/';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://127.0.0.1:5441/?silent=1&nohud=1', { waitUntil: 'load' });
for (let i = 0; i < 120; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(800);
await page.evaluate(() => { const h = window.__hw; for (const b of h.bots) { b.pos.set(40, 0, -44); b.perceiveT = 1e9; b.speed = 0; b.wanderT = 1e9; b.wander = b.pos.clone(); b.path = null; b.target = null; } h.input.swap = 'rpg'; });
await page.waitForTimeout(4000);
const cam = (x, z, yaw, pitch) => page.evaluate(([x, z, yaw, pitch]) => { const h = window.__hw; h.player.pos.set(x, 0, z); h.player.yaw = yaw; h.player.pitch = pitch; }, [x, z, yaw, pitch]);
await cam(-4, -28, Math.PI / 2, 0.0); await page.waitForTimeout(300);
await page.evaluate(() => { window.__hw.input.fire = true; }); await page.waitForTimeout(90); await page.evaluate(() => { window.__hw.input.fire = false; });
await page.waitForTimeout(5500);
console.log('last', await page.evaluate(() => JSON.stringify(window.__hw.destruction.last)));
// aftermath from the lawn, wall opening in frame, launcher in hand
const views = [[-7.5, -27, Math.PI / 2 + 0.05, 0.08], [-8, -25, Math.PI / 2 + 0.32, 0.1], [-6, -30, Math.PI / 2 - 0.2, 0.1]];
for (let i = 0; i < views.length; i++) { await cam(...views[i]); await page.waitForTimeout(700); await page.screenshot({ path: out + 'destruction-v' + i + '.jpg', type: 'jpeg', quality: 88 }); }
await browser.close();

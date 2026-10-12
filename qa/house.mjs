// HEADLESS: boot with destructible houses, report counts/fps, fire a rocket into a house front, screenshot.
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const out = 'C:/Users/User/Desktop/Claude code projects/hood-warfare/qa/';
const q = process.argv[2] || '';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [], logs = []; page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { const t = m.text(); if (m.type() === 'error' && !/X4122|404/.test(t)) errs.push(t.slice(0, 300)); else if (/destruction|avbd/i.test(t)) logs.push(t.slice(0, 200)); });
const t0 = Date.now();
await page.goto('http://127.0.0.1:5441/?silent=1&' + q, { waitUntil: 'load' });
for (let i = 0; i < 120; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
console.log('ready', Math.round((Date.now() - t0) / 1000) + 's', await page.evaluate(() => document.getElementById('pmsg').textContent), JSON.stringify(logs));
await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(800);
const stat = () => page.evaluate(() => { const h = window.__hw, D = h.destruction; return JSON.stringify({ fps: document.getElementById('fps').textContent, mode: D.mode, blocks: D.blocks, joints: D.joints, broken: D.broken, standing: D.walls.filter((x) => x.standing).length, structures: D.walls.length, last: D.last, calls: h.renderer.info.render.calls, tris: h.renderer.info.render.triangles }); });
// look at the west house of lot 1 from the street
await page.evaluate(() => { const h = window.__hw; h.player.pos.set(-3, 0, -24); h.player.yaw = Math.PI / 2 + 0.35; h.player.pitch = 0.08; for (const b of h.bots) { b.pos.set(40, 0, -44); b.perceiveT = 1e9; b.speed = 0; } });
await page.waitForTimeout(4000); console.log('rest', await stat());
await page.screenshot({ path: out + 'house-1-intact.png' });
await page.evaluate(() => { window.__hw.input.swap = 'rpg'; }); await page.waitForTimeout(600);
await page.evaluate(() => { const h = window.__hw; h.player.pos.set(-4, 0, -28); h.player.yaw = Math.PI / 2; h.player.pitch = 0.0; });
await page.waitForTimeout(300);
await page.evaluate(() => { window.__hw.input.fire = true; }); await page.waitForTimeout(90); await page.evaluate(() => { window.__hw.input.fire = false; });
await page.waitForTimeout(700); await page.screenshot({ path: out + 'house-2-blast.png' });
await page.waitForTimeout(2500); await page.screenshot({ path: out + 'house-3-after.png' });
console.log('after', await stat());
await page.evaluate(() => { const h = window.__hw; h.player.pos.set(-9.5, 0, -22.5); h.player.yaw = Math.PI / 2 + 0.6; h.player.pitch = 0.1; }); await page.waitForTimeout(600);
await page.screenshot({ path: out + 'house-4-close.png' });
console.log('errors', errs.length, JSON.stringify(errs.slice(0, 8)));
await browser.close();

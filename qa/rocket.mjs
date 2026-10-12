// HEADLESS: boot with WebGPU, swap to the RPG, fire at a brick wall, screenshot the blast and the rubble.
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const out = 'C:/Users/User/Desktop/Claude code projects/hood-warfare/qa/';
const q = process.argv[2] || '';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [], logs = []; page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { const t = m.text(); if (m.type() === 'error' && !/X4122/.test(t)) errs.push(t.slice(0, 300)); else if (/destruction|avbd/i.test(t)) logs.push(t.slice(0, 200)); });
page.on('response', (r) => { if (r.status() >= 400) errs.push('http ' + r.status() + ' ' + r.url()); });
await page.goto('http://127.0.0.1:5441/?silent=1&' + q, { waitUntil: 'load' });
for (let i = 0; i < 90; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
console.log('msg', await page.evaluate(() => document.getElementById('pmsg').textContent), JSON.stringify(logs));
await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(800);
// stand on the street in front of the first brick-wall lot (west side, lot 1: z -32..-24, wall x = -7.9), look west at it
await page.evaluate(() => { const h = window.__hw; h.player.pos.set(-1.0, 0, -29.5); h.player.yaw = Math.PI / 2; h.player.pitch = -0.1; for (const b of h.bots) { b.pos.set(40, 0, -44); b.perceiveT = 1e9; b.speed = 0; } });
await page.waitForTimeout(800); await page.screenshot({ path: out + 'rocket-1-wall.png' });
await page.waitForTimeout(4000); console.log('before', await page.evaluate(() => { const D = window.__hw.destruction; return JSON.stringify({ weld: D.weld, joints: D.joints, broken: D.broken, standing: D.walls.filter((x) => x.standing).length }); }));
await page.evaluate(() => { window.__hw.input.swap = 'rpg'; }); await page.waitForTimeout(700);
await page.screenshot({ path: out + 'rocket-2-rpg.png' });
await page.evaluate(() => { window.__hw.input.fire = true; }); await page.waitForTimeout(90); await page.evaluate(() => { window.__hw.input.fire = false; });
await page.waitForTimeout(80); await page.screenshot({ path: out + 'rocket-3-flight.png' });
await page.waitForTimeout(260); await page.screenshot({ path: out + 'rocket-4-blast.png' });
await page.waitForTimeout(900); await page.screenshot({ path: out + 'rocket-5-rubble.png' });
await page.waitForTimeout(2500); await page.screenshot({ path: out + 'rocket-6-settled.png' });
await page.evaluate(() => { const P = window.__hw.player; P.pos.set(-4.2, 0, -33.5); P.yaw = Math.PI * 0.72; P.pitch = -0.25; }); await page.waitForTimeout(700); await page.screenshot({ path: out + 'rocket-7-close.png' });
await page.evaluate(() => { const P = window.__hw.player; P.pos.set(-7.9, 0, -24.5); P.yaw = 0; P.pitch = -0.35; }); await page.waitForTimeout(700); await page.screenshot({ path: out + 'rocket-8-along.png' });
console.log(await page.evaluate(() => { const h = window.__hw; const w = h.destruction.walls; return JSON.stringify({ fps: document.getElementById('fps').textContent, mode: h.destruction.mode, blocks: h.destruction.blocks, walls: w.length, standing: w.filter((x) => x.standing).length, rockets: h.launcher.loaded + '/' + h.launcher.reserve, cur: h.arsenal.cur, broken: h.destruction.broken, tris: h.renderer.info.render.triangles, calls: h.renderer.info.render.calls }); }));
console.log('errors', errs.length, JSON.stringify(errs.slice(0, 8)));
await browser.close();

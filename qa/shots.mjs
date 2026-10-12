// HEADLESS: clean 1920x1080 marketing shots (no HUD) for the landing page.
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const out = 'C:/Users/User/Desktop/Claude code projects/hood-warfare/site/img/';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://127.0.0.1:5441/?silent=1&nohud=1', { waitUntil: 'load' });
for (let i = 0; i < 120; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(1500);
const cam = (x, z, yaw, pitch, w = 'ak') => page.evaluate(([x, z, yaw, pitch, w]) => { const h = window.__hw; h.player.pos.set(x, 0, z); h.player.yaw = yaw; h.player.pitch = pitch; h.input.swap = w; }, [x, z, yaw, pitch, w]);
const freeze = (positions) => page.evaluate((pos) => { const h = window.__hw; const T = h.THREE; h.bots.forEach((b, i) => { const p = pos[i]; if (p) { b.pos.set(p[0], 0, p[1]); b.yaw = p[2]; b.speed = 0; b.perceiveT = 1e9; b.wander = b.pos.clone(); b.wanderT = 1e9; b.path = null; if (p[3]) { b.target = { pos: new T.Vector3(p[3][0], 0, p[3][1]), dead: false, team: 'x' }; b.seeT = 1e9; b.lastSeen = b.target.pos.clone(); b.reactT = 1e9; b.burstGap = 1e9; } else { b.target = null; b.seeT = -1e9; } } else { b.pos.set(40, 0, -44); b.speed = 0; b.perceiveT = 1e9; } }); }, positions);
// 1 hero: down the street at dusk with homies ahead
await freeze([[-1.5, 22, Math.PI, [0, -20]], [1.8, 19, Math.PI - 0.3, [0, -20]], [-3.5, 15, Math.PI + 0.2, null], [3, 12, Math.PI, [0, -20]], [-2, 9, Math.PI, [0, -20]]]);
await cam(0, 30, Math.PI, 0.04); await page.waitForTimeout(1500); await page.screenshot({ path: out + 'hero.jpg', type: 'jpeg', quality: 88 });
// 2 rocket into a house, then the aftermath
await cam(-4, -28, Math.PI / 2, 0, 'rpg'); await page.waitForTimeout(600);
await page.evaluate(() => { window.__hw.input.fire = true; }); await page.waitForTimeout(90); await page.evaluate(() => { window.__hw.input.fire = false; });
await page.waitForTimeout(3200); await cam(-8.5, -23, Math.PI / 2 + 0.55, 0.06, 'rpg'); await page.waitForTimeout(700); await page.screenshot({ path: out + 'destruction.jpg', type: 'jpeg', quality: 88 });
// 3 characters: two opps and a homie close, aiming
await freeze([[-7.5, -26.5, Math.PI / 2, [20, -26.5]], [-5.5, -24, Math.PI / 2 + 0.3, [20, -26.5]], [-9, -29, Math.PI / 2 - 0.2, [20, -26.5]]]);
await cam(-2.5, -26.5, Math.PI / 2, 0.02, 'ak'); await page.waitForTimeout(1200); await page.screenshot({ path: out + 'characters.jpg', type: 'jpeg', quality: 88 });
// 4 alley
await freeze([]); await cam(33.5, 10, 0.1, 0.05, 'ak'); await page.waitForTimeout(900); await page.screenshot({ path: out + 'alley.jpg', type: 'jpeg', quality: 88 });
await browser.close();
// phone shot
const b2 = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
const ctx = await b2.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const pg = await ctx.newPage(); await pg.goto('http://127.0.0.1:5441/?silent=1&mobile=1', { waitUntil: 'load' });
for (let i = 0; i < 120; i++) { await pg.waitForTimeout(1000); if (await pg.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
await pg.evaluate(() => window.__hw.startMatch()); await pg.waitForTimeout(1500);
await pg.evaluate(() => { const h = window.__hw; h.player.pos.set(-1, 0, 24); h.player.yaw = Math.PI; h.player.pitch = 0.02; h.bots.forEach((b, i) => { const spots = [[-1.5, 16, Math.PI], [2, 13, Math.PI - 0.3]]; const p = spots[i]; if (p) { b.pos.set(p[0], 0, p[1]); b.yaw = p[2]; } else b.pos.set(40, 0, -44); b.speed = 0; b.perceiveT = 1e9; b.target = null; b.wanderT = 1e9; b.wander = b.pos.clone(); b.path = null; }); });
await pg.waitForTimeout(1500); await pg.screenshot({ path: out + 'phone.jpg', type: 'jpeg', quality: 88 });
await b2.close(); console.log('shots done');

// HEADLESS audio check: every ElevenLabs sample decodes, every sfx call runs without throwing.
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-swiftshader', '--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/X4122/.test(m.text())) errs.push(m.text().slice(0, 200)); });
page.on('response', (r) => { if (r.status() >= 400) errs.push('http ' + r.status() + ' ' + r.url()); });
await page.goto('http://127.0.0.1:5441/?silent=1', { waitUntil: 'load' });
for (let i = 0; i < 90; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
await page.click('#go').catch(() => {});
await page.evaluate(() => window.__hw.MATCH.started || window.__hw.startMatch());
await page.waitForTimeout(3000);
const st = await page.evaluate(async () => { const a = await import('/src/audio.js'); return a.audioStatus(); });
console.log('status', JSON.stringify(st));
const calls = await page.evaluate(async () => {
  const { sfx } = await import('/src/audio.js'); const T = window.__hw.THREE; const out = {};
  const p = new T.Vector3(10, 1, 10), far = new T.Vector3(60, 1, -40);
  const list = { shot: () => sfx.shot(), shotAt: () => sfx.shotAt(p), shotAtFar: () => sfx.shotAt(far), hit: () => sfx.hit(), kill: () => sfx.kill(), impactAt: () => sfx.impactAt(p),
    hurt: () => sfx.hurt(), death: () => sfx.death(), deathAt: () => sfx.deathAt(p), reload: () => sfx.reload(), ability: () => sfx.ability(), snitch: () => sfx.snitch(), homies: () => sfx.homies(),
    explode: () => sfx.explode(p), step: () => sfx.step(), victory: () => sfx.victory(), defeat: () => sfx.defeat(), distant: () => sfx.distantGunfire(), dry: () => sfx.dry() };
  for (const [k, f] of Object.entries(list)) { try { f(); out[k] = 'ok'; } catch (e) { out[k] = 'ERR ' + e.message; } }
  return out;
});
console.log('calls', JSON.stringify(calls));
// play a few seconds of real match so bot gunfire/impacts/deaths go through the positional path
await page.waitForTimeout(8000);
console.log('match', await page.evaluate(() => JSON.stringify({ fps: document.getElementById('fps').textContent, score: window.__hw.score, feed: document.getElementById('feed').innerText.replace(/\n/g, ' | ') })));
// mute toggle
await page.keyboard.press('KeyM'); await page.waitForTimeout(200);
console.log('muted', await page.evaluate(async () => (await import('/src/audio.js')).isMuted()));
await page.keyboard.press('KeyM');
console.log('errors', errs.length, JSON.stringify(errs.slice(0, 10)));
await browser.close();

import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-swiftshader', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto('http://127.0.0.1:5441/?silent=1', { waitUntil: 'load' });
for (let i = 0; i < 60; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go').classList.contains('on'))) break; }
await page.evaluate(() => window.__hw.startMatch());
await page.waitForTimeout(500);
await page.evaluate(() => { const h = window.__hw; h.player.pos.set(-9.5, 0, 20); h.player.yaw = -0.9; h.player.pitch = 0.05; });
const fps = async () => { await page.waitForTimeout(1600); return page.evaluate(() => document.getElementById('fps').textContent); };
const probe = async (label, on, off) => { await page.evaluate(on); const f = await fps(); console.log(label, f); await page.evaluate(off); };
console.log('base', await fps());
await probe('no shadows', () => { window.__hw.renderer.shadowMap.enabled = false; window.__hw.scene.traverse((o) => { if (o.material && !Array.isArray(o.material)) o.material.needsUpdate = true; }); }, () => { window.__hw.renderer.shadowMap.enabled = true; window.__hw.scene.traverse((o) => { if (o.material && !Array.isArray(o.material)) o.material.needsUpdate = true; }); });
await probe('no grass', () => { window.__hw.scene.traverse((o) => { if (o.isInstancedMesh) o.visible = false; }); }, () => { window.__hw.scene.traverse((o) => { if (o.isInstancedMesh) o.visible = true; }); });
await probe('no bots', () => { for (const b of window.__hw.bots) { b.obj.visible = false; } }, () => { for (const b of window.__hw.bots) { b.obj.visible = true; } });
await probe('dpr 0.7', () => { window.__hw.renderer.setPixelRatio(0.7); }, () => { window.__hw.renderer.setPixelRatio(1); });
await probe('no trees', () => { window.__hw.scene.traverse((o) => { if (o.isMesh && o.geometry.attributes.position.count > 100000) o.visible = false; }); }, () => { window.__hw.scene.traverse((o) => { if (o.isMesh) o.visible = true; }); });
console.log(await page.evaluate(() => { const h = window.__hw; const r = h.renderer; r.info.autoReset = false; r.info.reset(); return new Promise((res) => setTimeout(() => res(JSON.stringify({ calls: r.info.render.calls, tris: r.info.render.triangles, frames: r.info.render.frame })), 1100)); }));
// fire test
console.log(await page.evaluate(async () => { const h = window.__hw; h.input.fire = true; await new Promise((r) => setTimeout(r, 400)); h.input.fire = false; return 'mag after burst ' + h.weapon.mag + ' cool ' + h.weapon.cool.toFixed(2) + ' dead ' + h.player.dead + ' reloading ' + h.weapon.reloading; }));
await page.screenshot({ path: 'qa/desktop-fire.png' });
await browser.close();

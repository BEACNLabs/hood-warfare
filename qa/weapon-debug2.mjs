import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-swiftshader', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://127.0.0.1:5441/?silent=1', { waitUntil: 'load' });
for (let i = 0; i < 60; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go').classList.contains('on'))) break; }
await page.evaluate(() => window.__hw.startMatch());
await page.waitForTimeout(800);
await page.evaluate(() => { const h = window.__hw; h.player.pos.set(0, 0, 20); h.player.yaw = Math.PI; h.player.pitch = -0.2; });
await page.waitForTimeout(300);
await page.screenshot({ path: 'qa/dbg-a.png' });
await page.evaluate(() => { const h = window.__hw; h.weapon.rig.traverse((o) => { if (o.isMesh || o.isSkinnedMesh) o.material = new h.THREE.MeshNormalMaterial({ side: 2 }); }); });
await page.waitForTimeout(300);
await page.screenshot({ path: 'qa/dbg-b.png' });
console.log(await page.evaluate(() => { const h = window.__hw; const out = []; h.weapon.rig.traverse((o) => { if (o.isSkinnedMesh) out.push({ bones: o.skeleton.bones.length, bindMode: o.bindMode, bone0: o.skeleton.bones[0].getWorldPosition(new h.THREE.Vector3()).toArray().map(v => +v.toFixed(2)), bone0scale: o.skeleton.bones[0].getWorldScale(new h.THREE.Vector3()).toArray().map(v => +v.toFixed(3)), parent: o.parent.name, parentScale: o.parent.scale.toArray(), pscale2: o.parent.parent?.scale.toArray() }); }); return JSON.stringify(out); }));
await browser.close();

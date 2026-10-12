// HEADLESS: show each gun model side-on in the world (clone of its viewmodel inner group) to check orientation.
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://127.0.0.1:5441/?silent=1&nosubmit=1&nohud=1', { waitUntil: 'load' });
for (let i = 0; i < 120; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
await page.evaluate(() => window.__hw.startMatch()); await page.waitForTimeout(800);
await page.evaluate(() => { window.__hw.input.swap = 'rpg'; }); await page.waitForTimeout(400);
const info = await page.evaluate(() => {
  const h = window.__hw, T = h.THREE; for (const b of h.bots) b.pos.set(40, 0, -44);
  h.player.pos.set(0.5, 0, 0); h.player.yaw = 0; h.player.pitch = 0; h.launcher.rig.visible = false; window.__keep = () => { for (const id of ['ak','mac10','mp5','m700']) { h.guns[id].holstered = false; } requestAnimationFrame(window.__keep); }; window.__keep();
  const out = {};
  ['ak', 'mac10', 'mp5', 'm700'].forEach((id, i) => {
    const g = h.guns[id];
    // move the gun's own rig out of the camera into the world (skinned meshes can't be cloned with clone())
    const holder = new T.Group(); holder.rotation.y = Math.PI / 2; holder.position.set(-1.65 + i * 1.1, 1.75, -2.6); holder.scale.setScalar(1.5); h.scene.add(holder);
    holder.add(g.rig); g.holstered = false; g.holster = 0;
    const bb = new T.Box3().setFromObject(g.vmInner); out[id] = bb.getSize(new T.Vector3()).toArray().map((v) => +v.toFixed(2));
  });
  return out;
});
await page.waitForTimeout(800);
await page.screenshot({ path: 'C:/Users/User/Desktop/Claude code projects/hood-warfare/qa/_gunside.png' });
console.log(JSON.stringify(info));
await browser.close();

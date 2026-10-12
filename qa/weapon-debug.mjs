import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-swiftshader', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto('http://127.0.0.1:5441/?silent=1', { waitUntil: 'load' });
for (let i = 0; i < 60; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go').classList.contains('on'))) break; }
await page.evaluate(() => window.__hw.startMatch());
await page.waitForTimeout(800);
console.log(await page.evaluate(() => {
  const h = window.__hw, w = h.weapon, THREE = h.THREE;
  const info = { loaded: w.loaded, rigChildren: w.rig.children.length, rigPos: w.rig.position.toArray(), camChildren: h.camera.children.length, camParent: !!h.camera.parent };
  const meshes = []; w.rig.traverse((o) => { if (o.isMesh || o.isSkinnedMesh) { o.updateWorldMatrix(true, false); const bb = new THREE.Box3().setFromObject(o); meshes.push({ name: o.name, skinned: !!o.isSkinnedMesh, vis: o.visible, verts: o.geometry.attributes.position.count, bbMin: bb.min.toArray().map(v => +v.toFixed(2)), bbMax: bb.max.toArray().map(v => +v.toFixed(2)), mat: o.material.name, hasMap: !!o.material.map }); } });
  info.meshes = meshes; info.cam = h.camera.position.toArray().map(v => +v.toFixed(2)); info.muzzle = w.muzzleLocal.toArray(); info.innerRot = w.vmInner.rotation.toArray(); info.innerScale = w.vmInner.scale.x;
  return JSON.stringify(info);
}));
await browser.close();

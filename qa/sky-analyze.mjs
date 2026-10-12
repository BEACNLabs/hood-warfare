// HEADLESS: load each HDRI in the page and report sun direction + horizon colour (for fog/light rig).
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
const skies = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-swiftshader', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto('http://127.0.0.1:5441/?silent=1', { waitUntil: 'load' });
for (let i = 0; i < 90; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
for (const s of skies) {
  const r = await page.evaluate(async (s) => {
    const { HDRLoader } = await import('/vendor/three/jsm/loaders/HDRLoader.js');
    const t = await new HDRLoader().loadAsync(`assets/ph/hdri/${s}_2k.hdr`);
    const { width: W, height: H, data } = t.image; const half = (h) => { const e = (h >> 10) & 31, m = h & 1023, sg = h >> 15 ? -1 : 1; return e === 0 ? sg * m * 2 ** -24 : sg * (1 + m / 1024) * 2 ** (e - 15); };
    const px = (x, y) => { const i = (y * W + x) * 4; return [half(data[i]), half(data[i + 1]), half(data[i + 2])]; };
    // brightest 8x8 block in the upper half = the sun
    let best = { l: -1 }; for (let y = 0; y < H / 2; y += 8) for (let x = 0; x < W; x += 8) { let l = 0; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const c = px(x + i, y + j); l += c[0] + c[1] + c[2]; } if (l > best.l) best = { l, x: x + 4, y: y + 4 }; }
    const u = best.x / W, v = best.y / H; // u: 0..1 longitude, v: 0 top
    // horizon band average colour (rows just above the horizon) and zenith colour
    const band = (y0, y1, x0 = 0, x1 = W) => { let c = [0, 0, 0], n = 0; for (let y = Math.floor(y0); y < y1; y += 2) for (let x = Math.floor(x0); x < x1; x += 4) { const p = px(x, y); c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; n++; } return c.map((k) => +(k / n).toFixed(3)); };
    const bins = []; for (let b = 0; b < 16; b++) bins.push(band(H * 0.42, H * 0.5, (b / 16) * W, ((b + 1) / 16) * W));
    return { W, H, sunU: +u.toFixed(3), sunElevDeg: +((0.5 - v) * 180).toFixed(1), sunLum: +(best.l / 64).toFixed(1), horizon: band(H * 0.44, H * 0.5), sky: band(H * 0.15, H * 0.3), ground: band(H * 0.55, H * 0.7), horizonBins: bins };
  }, s);
  console.log(s, JSON.stringify(r));
}
await browser.close();

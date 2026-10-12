// HEADLESS: 20 s live-gameplay demo — run the street with the AK against moving opps, then the RPG-7 into a house.
// CDP screencast frames + real timestamps → ffmpeg. Output: social/hood-warfare-demo-20s.mp4 (game audio tapped from WebAudio).
import { chromium } from 'file:///C:/Users/User/Desktop/Claude%20code%20projects/world-of-hoodcraft/node_modules/playwright/index.mjs';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const ROOT = 'C:/Users/User/Desktop/Claude code projects/hood-warfare/';
const FR = process.env.FRAMES_DIR; rmSync(FR, { recursive: true, force: true }); mkdirSync(FR, { recursive: true });
mkdirSync(ROOT + 'social', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=default', '--enable-unsafe-webgpu', '--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.2 });
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
// tap the game's real WebAudio mix: anything connected to the speakers is also fed to a MediaRecorder
await page.addInitScript(() => {
  const orig = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dst, ...rest) {
    const r = orig.call(this, dst, ...rest);
    if (dst && dst === this.context.destination) {
      const c = this.context;
      if (!c.__tap) { c.__tap = c.createMediaStreamDestination(); window.__tapCtx = c; }
      orig.call(this, c.__tap);
    }
    return r;
  };
  window.__recStart = () => { const c = window.__tapCtx; if (!c) return 'no-audio'; c.resume(); window.__chunks = []; const mr = new MediaRecorder(c.__tap.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 }); mr.ondataavailable = (e) => e.data.size && window.__chunks.push(e.data); mr.start(250); window.__mr = mr; return 'rec'; };
  window.__recStop = () => new Promise((res) => { const mr = window.__mr; if (!mr) return res(null); mr.onstop = async () => { const b = new Blob(window.__chunks, { type: 'audio/webm' }); const buf = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); res(btoa(s)); }; mr.stop(); });
});
await page.goto('http://127.0.0.1:5441/?silent=1&nosubmit=1', { waitUntil: 'load' });
for (let i = 0; i < 120; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => document.getElementById('go')?.classList.contains('on'))) break; }
await page.evaluate(() => { window.__hw.startMatch(); document.getElementById('fps').style.display = 'none'; });
await page.waitForTimeout(2500);
// stage: a live match. Red bots start up the street with their AI ON (they move, take cover, shoot back);
// the player spawns with the homies at the blue end and runs south down the street. Only the player can't die.
await page.evaluate(() => {
  const h = window.__hw;
  const spots = [[2.8, 12], [-2.8, 4], [5.5, -4], [-5.5, -10], [0, -16], [2.8, -24]];
  let k = 0;
  h.bots.forEach((b) => { if (b.team === 'red') { const p = spots[k++ % spots.length]; b.pos.set(p[0], 0, p[1]); b.path = null; b.target = null; } });
  h.player.pos.set(0.6, 0, 34); h.player.yaw = 0; h.player.pitch = 0;
});
await page.waitForTimeout(600);
// in-page director (rAF): a human-ish player — run, pick up the nearest visible opp, aim with lag, burst, keep moving
await page.evaluate(() => {
  const h = window.__hw, inp = h.input, P = h.player, T = h.THREE;
  const ang = (dx, dz) => Math.atan2(-dx, -dz);
  const wrap = (d) => ((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  const ray = new T.Raycaster();
  const visible = (b) => { const eye = new T.Vector3(P.pos.x, P.pos.y + 1.62, P.pos.z), tgt = new T.Vector3(b.pos.x, b.pos.y + 1.2, b.pos.z); const dir = tgt.clone().sub(eye); const d = dir.length(); ray.set(eye, dir.normalize()); ray.far = d - 0.6; const hit = ray.intersectObjects(h.scene.children.filter((o) => o.isMesh && !o.isSkinnedMesh && o.visible), false); return hit.length === 0; };
  let t0 = null, last = null, tgt = null, retarget = 0, burst = 0, gap = 0, strafe = 0, strafeT = 0, fired = {}, lastVis = 0;
  window.__demoLog = [];
  // movement goes through real key events (poll() rebuilds moveX/moveY/sprint from the key map every frame)
  const held = {};
  const key = (code, on) => { if (!!held[code] === on) return; held[code] = on; dispatchEvent(new KeyboardEvent(on ? 'keydown' : 'keyup', { code })); };
  const drive = (mx, my, sp) => { key('KeyW', my > 0.3); key('KeyS', my < -0.3); key('KeyD', mx > 0.3); key('KeyA', mx < -0.3); key('ShiftLeft', !!sp); };
  function step(now) {
    if (t0 === null) { t0 = now; last = now; }
    const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
    P.hp = 100;
    inp.fire = false; inp.moveX = 0; inp.moveY = 0; inp.sprint = false; inp.ads = false;
    let aimYaw = 0, aimPitch = 0.02;
    if (t < 13.4) {
      // pick a target every 0.25 s: nearest live opp ahead within 38 m that we can see
      if (t > retarget) {
        retarget = t + 0.25; let best = null, bd = 38;
        for (const b of h.bots) { if (b.team !== 'red' || b.dead) continue; const dx = b.pos.x - P.pos.x, dz = b.pos.z - P.pos.z, d = Math.hypot(dx, dz); if (d < bd && Math.abs(wrap(ang(dx, dz))) < 1.2 && visible(b)) { best = b; bd = d; } }
        tgt = best;
      }
      if (tgt && tgt.dead) { tgt = null; window.__demoLog.push(['kill', t.toFixed(1)]); }
      const goZ = P.pos.z > -20;
      if (tgt) {
        const dx = tgt.pos.x - P.pos.x, dz = tgt.pos.z - P.pos.z, d = Math.hypot(dx, dz);
        aimYaw = ang(dx, dz); aimPitch = Math.atan2(tgt.pos.y + 1.15 - (P.pos.y + 1.62), d);
        inp.moveY = goZ ? 0.55 : 0; if (t > strafeT) { strafe = (Math.random() - 0.5) * 1.4; strafeT = t + 0.8; } inp.moveX = strafe;
        const err = Math.abs(wrap(aimYaw - P.yaw)) + Math.abs(aimPitch - P.pitch);
        if (err < 0.05) { if (burst > 0) { inp.fire = true; burst -= dt; } else if (gap > 0) gap -= dt; else { burst = 0.35 + Math.random() * 0.3; gap = 0.18 + Math.random() * 0.2; } }
      } else {
        // run the street: sprint south, drift between lanes, glance around
        aimYaw = Math.sin(t * 0.9) * 0.18; aimPitch = 0.01;
        if (goZ) { inp.moveY = 1; inp.sprint = true; inp.moveX = Math.sin(t * 0.6) * 0.25; }
      }
    } else {
      // RPG on the west house at lot 1
      if (!fired.swap) {
        inp.swap = 'rpg'; fired.swap = t;
        // nearest intact house 9-24 m away, preferring the one most in front of us
        let best = null, bs = 1e9;
        for (const w of h.destruction.walls) { if (w.kind !== 'house' || w.touched) continue; let cx = 0, cz = 0; for (const it of w.items) { cx += it.p.x; cz += it.p.z; } cx /= w.items.length; cz /= w.items.length; const dx = cx - P.pos.x, dz = cz - P.pos.z, d = Math.hypot(dx, dz); if (d < 14 || d > 24) continue; const sc = d + Math.abs(wrap(ang(dx, dz) - P.yaw)) * 8; if (sc < bs) { bs = sc; best = [cx, cz]; } }
        window.__house = best || [-14, -28];
        window.__demoLog.push(['swap', t.toFixed(1), P.pos.x.toFixed(1), P.pos.z.toFixed(1), 'house', window.__house.map((v) => v.toFixed(1)).join(',')]);
      }
      const hx = window.__house[0], hz = window.__house[1], dx = hx - P.pos.x, dz = hz - P.pos.z;
      if (t < 14.6 && Math.hypot(dx, dz) > 16) inp.moveY = 1;
      aimYaw = ang(dx, dz); aimPitch = Math.atan2(1.9 - (P.pos.y + 1.62), Math.hypot(dx, dz));
      if (t > 15.0 && !fired.r1) { inp.fire = true; fired.r1 = t; window.__demoLog.push(['rocket', t.toFixed(1)]); }
      
    }
    const k = Math.min(1, dt * (tgt ? 9 : 4));
    P.yaw += wrap(aimYaw - P.yaw) * k; P.pitch += (aimPitch - P.pitch) * k;
    drive(inp.moveX, inp.moveY, inp.sprint);
    if (t < 20.5) requestAnimationFrame(step); else { inp.fire = false; drive(0, 0, false); window.__demoDone = true; }
  }
  requestAnimationFrame(step);
});
// record
const cdp = await page.context().newCDPSession(page);
const frames = []; let n = 0;
cdp.on('Page.screencastFrame', async (f) => { const name = `f${String(n++).padStart(5, '0')}.jpg`; writeFileSync(FR + '/' + name, Buffer.from(f.data, 'base64')); frames.push([name, f.metadata.timestamp]); try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {} });
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
const recState = await page.evaluate(() => window.__recStart());
await page.waitForFunction(() => window.__demoDone === true, null, { timeout: 60000 });
await cdp.send('Page.stopScreencast');
const audioB64 = await page.evaluate(() => window.__recStop());
if (audioB64) writeFileSync(FR + '/audio.webm', Buffer.from(audioB64, 'base64'));
const info = await page.evaluate(() => ({ log: window.__demoLog, kills: window.__hw.player.kills, pos: window.__hw.player.pos.toArray().map((v) => +v.toFixed(1)), last: window.__hw.destruction.last }));
await browser.close();
// concat list with real durations
let list = '';
for (let i = 0; i < frames.length; i++) { const d = i + 1 < frames.length ? frames[i + 1][1] - frames[i][1] : 1 / 30; list += `file '${frames[i][0]}'\nduration ${Math.max(0.001, d).toFixed(4)}\n`; }
list += `file '${frames[frames.length - 1][0]}'\n`;
writeFileSync(FR + '/list.txt', list);
const span = frames[frames.length - 1][1] - frames[0][1];
const out = ROOT + 'social/hood-warfare-demo-20s.mp4';
const vid = FR + '/video.mp4';
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', FR + '/list.txt', '-vf', 'fps=30,scale=1920:1080:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-crf', '22', '-maxrate', '9M', '-bufsize', '18M', '-preset', 'slow', vid]);
if (audioB64) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', vid, '-i', FR + '/audio.webm', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]);
else execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', vid, '-c', 'copy', '-movflags', '+faststart', out]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', out, '-vf', 'fps=1/2,scale=480:-1,tile=5x2', '-frames:v', '1', ROOT + 'qa/demo-sheet.jpg']);
console.log(JSON.stringify({ recState, audioKB: audioB64 ? Math.round(audioB64.length * 0.75 / 1024) : 0, frames: frames.length, span: +span.toFixed(2), fps: +(frames.length / span).toFixed(1), info, errs }));

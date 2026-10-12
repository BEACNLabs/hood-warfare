# 2026-10-12 (night) — GPU destruction (three-avbd) inside a WebGL game, and a Tripo RPG-7

## 1. The problem
Add rocket-launcher destruction of brick walls using sbobyn's three-avbd, which needs WebGPU and
`three/webgpu`, inside a game that renders with WebGL and EffectComposer.

## 2. The approach
1. Studied the repo before coding: README, `docs/API.md`, `docs/FINDINGS.md`, `src/lib/world.ts`
   (`World.create({ device })` headless mode, `readbackEvery`, `track`, `applyImpulse`, `onBreak`),
   `bench-scenes.ts` (`breakableWall`: welds with `breakForce`). Checked with Playwright that headless
   Chrome has WebGPU here and that a `GPUDevice` can live next to a WebGL2 context in one page.
2. `npm install three-avbd` into a scratch dir, vendored `build/` (425 KB), shimmed `three/webgpu` with a
   module that re-exports `three` and stubs `StorageInstancedBufferAttribute`.
3. Vertical slice first: `qa/avbd-smoke.html` builds a welded wall headless, steps it, blasts it and
   prints moved / far / max velocity / NaN counts. Every physics decision was made there in 5-second
   runs, not in the game.
4. In the game: bricks are one InstancedMesh per wall updated from the readback; collision stays on the
   game's AABB list; one collider per standing wall, removed at the first broken weld.
5. RPG-7 via Tripo: image gen (16:9 side view, white background) → Generate 3D (8K off) → Retopo 10k →
   Export GLB 1k; the launcher module auto-orients the GLB by its longest axis like the AK.
6. Three ElevenLabs sounds (launch, reload, rubble) through the history-search download flow.

## 3. The judgment calls
- Did not switch the renderer to WebGPU: the post stack, the shadow setup and iPhone support were not
  worth re-doing for 844 bricks. Headless solver + readback costs nothing visible at 60 fps.
- Did not weld the houses: the walls prove the tech; facades are the next step (a compute blast pass).
- Rejected the paper's angular `breakForce` after measuring it (never breaks under a blast, the wall
  topples as a sheet) in favour of `breakOnPull`, swept 8/5 → 35/18 N to find 16/9.
- Three bugs were found by numbers, not screenshots: welds at block centres (a spring that never
  relaxes), the rotated block frame (+90° put anchors on the wrong side), and N·s impulses on 0.13 kg
  blocks (195 m/s).
- Also: a sed that appends a `// comment` to a line commented out the rest of that declaration
  (`p is not defined` at boot). Put comments on their own line when patching by replace.

## 4. The reusable rule
When a physics library wants a renderer you don't use, run it headless on its own device, read poses
back, and draw them yourself; prove every material constant in a 5-second headless lab before touching
the game, and treat "the whole wall fell as one piece" as the signature of welds that cannot break.

---

# Addendum — welding the houses (v0.5.0)

Five separate causes made every house collapse at rest; each was found with a tiny headless probe,
never by staring at screenshots: `drift.mjs` (how far each panel moved, per face), `breaklog.mjs`
(broken welds by type/height), `overlap.mjs` (box intersections), `avbd-panel.html` (one wall, no game).
1. Foundation only in the visuals (walls floating 0.8 m up). 2. Window openings leave panels hanging on
side welds: fill openings with thin welded panes. 3. A fixed joint locks rotations EQUAL: pass
`rest:'current'` on every weld (tilted roof, 90° corners). 4. A roof welded to settling walls snaps the
top welds; keep it a fixed body resting on the eaves, `setFixed(false)` on the first hit. 5. Count breaks
in the first seconds as settling, not hits.
Rule: when a welded structure fails at rest, bisect it with query flags (noroof, nocorner, nogable, stack)
and log which welds break before changing any constant.

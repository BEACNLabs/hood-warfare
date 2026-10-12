# Tech study: three-avbd (GPU rigid bodies for Three.js) and how Hood Warfare uses it

Studied 2026-10-12 from the owner's video (`sbobyn — Preview of a real-time threejs destruction library`,
49 s: an RPG fired at brick apartment blocks, whole facades and fire escapes shearing off, dust and
rubble) and the source at https://github.com/sbobyn/three-avbd (MIT, v0.3.0 on npm).

## What it is

- An implementation of **Augmented Vertex Block Descent** (Giles, Diaz, Yuksel, SIGGRAPH 2025) in
  TypeScript + WGSL compute. Rigid bodies (boxes, spheres, convex hulls), contacts with friction, joints
  (fixed welds, ball joints, springs) that can break, yield plastically or tear at a bend limit, all
  stepped on the GPU. The author's numbers: 110k welded bricks at 9–10 ms a step, 506k bricks at 25 ms.
- **AVBD in one paragraph:** every body is advanced by a few Gauss–Seidel-style "block descent" sweeps
  that minimise an energy made of inertia plus penalty terms for every contact and joint; the penalties'
  stiffness and a dual variable (an augmented-Lagrangian multiplier) are updated each iteration so hard
  contacts converge in 4–10 iterations instead of hundreds. Bodies that touch are coloured so each
  colour solves in parallel on the GPU. There are no speculative contacts: a body moving faster than its
  size per step can tunnel.
- **Destruction is not a fracture system.** Walls are bricks welded by fixed joints with a `breakForce`.
  The paper's criterion is the joint's *angular* force; the library adds `breakOnPull` (tear at a pull in
  newtons), `yieldForce` (plastic hinge) and `breakBend`. The Voxel City demo is the same idea at 94k
  voxels with a custom blast compute pass.
- **Hard requirement: WebGPU** (Chrome/Edge anywhere, Safari 26, Firefox where shipped). `BodyMesh`
  draws straight from the solver's buffer, which needs `WebGPURenderer`.

## How we integrate it into a WebGL game

Hood Warfare renders with `WebGLRenderer` + `EffectComposer`. Rewriting the post stack for WebGPU was
not worth it, so:

1. `World.create({ device })` runs the solver **headless** on its own `GPUDevice`, in the same page as
   the WebGL context (verified in headless Chrome: both contexts coexist).
2. The built package imports `three/webgpu` only for `StorageInstancedBufferAttribute`, used in renderer
   mode. `vendor/three-avbd/webgpu-shim.js` re-exports `three` and stubs that class, so the import map
   entry `"three/webgpu"` costs nothing (no 2.3 MB WebGPU build is loaded).
3. `world.readbackEvery = 1; world.track(bricks)` keeps a snapshot of every brick's pose one step old.
   `src/destruction.js` copies those poses into one `InstancedMesh` per wall (844 blocks, 14 walls)
   each frame — only for walls that have been touched; untouched walls keep their build-time matrices.
4. Gameplay collision stays on the game's own AABB list: a standing wall is one box collider (bullets
   and rockets hit it, players can't walk through); the first broken weld removes it, and rubble is
   walkable.
5. A rocket blast calls `body.applyImpulse` on every block within 3.6 m with an impulse scaled by block
   mass (so the solver's small masses don't launch bricks into orbit), plus dust where blocks fly.
6. No WebGPU → `lite` mode: the same walls as static instances, and a blast knocks blocks out with a
   canned tumble. The game never needs the library to run.

## What we measured (RTX 5070, headless Chrome; walls of 0.4×0.2×0.2 m blocks, density 8)

| Test | Result |
|---|---|
| 105-block welded wall, 180 steps + readback each step | 11 ms/step in a tight loop (GPU queue + copy); in-game at one step a frame: 60 fps with 844 blocks, desktop and phone emulation |
| Angular-only `breakForce` (the paper's) 1, 3, 20, 120, 400 vs a 6 m/s blast | **0 welds break** at any value; the wall topples as one rigid sheet 2–5 s later |
| `breakOnPull` welds at 5 N | 107 of 188 welds tear, a hole, the rest of the wall stands |
| `breakOnPull` 10 N | 43 tear, most of the wall topples |
| Game walls (running bond, 2 welds down + 1 sideways per block), at rest 4 s | 8/5 N: 400 welds fail under the wall's own weight; **14/8 N and up: 0** |
| Same, one rocket (Δv up to 7.5 m/s, 3.6 m radius) | 14/8: 207 welds, 2 walls open · 22/12: 147 · 35/18: 75 |
| Shipped | 16 N down / 9 N sideways, blast 7.5 m/s quadratic falloff |

Other findings that matter for games built on it:

- **Anchor welds at the real overlap point.** A running-bond weld with anchors at both block centres
  (0.2 m apart) is a spring that never relaxes: the solver tears every weld in the first second.
- **A rotated box's local frame is the one the anchors live in.** Walls along z use a −90° turn so the
  block's local +x points at its neighbour; +90° put every weld on the wrong side (all walls fell).
- **Impulse is in N·s**: scale by `size³ × density`. A 25 N·s push on a 0.13 kg block is 195 m/s.
- `b.position` / `b.rotation` are plain arrays as of the last readback; one `read()` runs at a time, so
  `readbackEvery = 1` simply skips steps where the previous copy has not landed.
- The author's own findings (`docs/FINDINGS.md`): tall unbroken walls creep and fall at 4 iterations
  (fixed by `startAtRest` in 8m); 6 iterations is a safe floor for short walls; steps are deterministic
  on one device.

## Houses (v0.5.0): what it took to weld 20 two-storey houses

12,852 bodies, 35k welds, 60 fps desktop and phone emulation. Each house is four faces of 0.8×0.4×0.2 m
panels in running bond, gable rows, two roof slabs; window and door openings are thin structural panes
hidden behind the kit glass. Five things each collapsed every house until fixed, found with
`qa/drift.mjs` (how far panels moved), `qa/breaklog.mjs` (which welds broke, by type and height) and
`qa/overlap.mjs` (geometric intersections):

1. **The foundation existed only in the visuals.** Walls start 0.8 m up; without a fixed foundation box
   the solver dropped every house 0.8 m and the landing snapped all welds.
2. **Window openings.** Panels above a window hang on side welds alone and unzip the wall. A plain
   15-row wall stands in the lab (`qa/avbd-panel.html`); the same wall with openings does not. Fix: fill
   openings with thin panes that are welded like panels (strength from the full panel mass).
3. **A fixed joint locks the two rotations equal.** Panels welded to the tilted roof slab, and the
   corner welds between faces turned 90° apart, twisted their bodies toward each other until everything
   tore. Every weld now passes `rest: 'current'`.
4. **A free roof on light panels is unstable**, and a fixed roof *welded* to settling walls keeps
   snapping the top-row welds (a fixed body cannot follow the millimetres the stack compresses). The
   roof is now a fixed body that simply rests on the eave rows, released (`setFixed(false)`) on the
   first hit so it falls where the walls are gone.
5. **Settling breaks are not hits.** Breaks in the first 4 s are ignored, and a structure only counts as
   hit after four welds go (or a blast touched it); before this, every house blew its windows out at rest.

Load-bearing welds (strength grows 8% per row carried) and a 1.5× bonus on corner welds keep the walls
up; the blast tunes are unchanged, so a rocket opens a face about 3 m across and the panels it frees
tumble into the yard.

## What the video does that we do not (yet)

- A GPU blast pass over the body buffer (`three-avbd/advanced` exposes the layout); ours is a CPU loop
  over the structures near the blast, fine at 13k bodies.
- Interiors: our houses are shells (no floors or rooms behind the wall), so a blown wall opens onto the
  foundation slab.
- Dust volumes and debris lingering: we spawn sprites at the blast and let the solver pile the rubble.
- Bricks hurting characters: contact events (`reportContacts`) could drive that; off for now.

## Files

`src/destruction.js` (walls, bridge, blast, lite mode), `src/rocket.js` (launcher, rockets, damage),
`vendor/three-avbd/` (built package + shim), `qa/avbd-smoke.html` + `qa/avbd-smoke.mjs` (the weld/blast
lab: `?dens=&dv=&strength=&pull=1&it=`), `qa/rocket.mjs` (in-game rocket test, `weld=down,side`).

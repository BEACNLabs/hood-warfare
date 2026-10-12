# 2026-10-12 — Hood Warfare vertical slice: from a gameplay video to a playable browser FPS in one session

## 1. The problem
Clone the look and loop of a UE5 shooter (FearBuck "Hood Warfare", Chicago block at dusk) as a no-build
Three.js game with "the best graphics possible", using only real assets, with Blender MCP down and no
asset-site logins.

## 2. The approach
1. **Read the video as frames, not as a video.** `ffmpeg -vf fps=1/3,scale=960:-1` → 34 JPGs → looked at
   ~15 of them. That gave the full HUD inventory (minimap, WINNING/LOSING score, kill feed, ability icons
   with key hints, marker-font callouts, "+100", teammate distance labels), the palette (blue hour + warm
   lamp pools), and the set (clapboard two-storeys, chain-link, overgrown lots, poles and cables).
2. **Found what "stilwater" meant on disk** before searching the web: `stillwater/` is a Vite bundle mirror.
   Grepped its 1.3 MB `assets/index-*.js` with node for `toneMapping=`, `setPixelRatio(`, `shadow.`,
   `Fog(`, `HemisphereLight`, `onBeforeCompile` strings and printed ±800 chars of context around each hit.
   Result: a complete renderer/light/shadow/fog recipe in 10 minutes (saved as the
   `stillwater-render-recipe` memory). Note `toneMapping=4` is ACESFilmic and `shadowMap.type=1` is PCF
   (Three constants are minified to numbers).
3. **Assets without the MCP bridge.** Blender MCP reported "Could not connect", so:
   - Poly Haven: `https://api.polyhaven.com/assets?t=models|textures|hdris` for catalogues (filter by
     tags like `night`, `dusk`), then `https://api.polyhaven.com/files/<slug>` for URLs; a 6-thread Python
     downloader (`$TEMP/ph_dl.py`) pulled 40 models, 15 texture sets and 2 HDRIs in ~4 minutes.
     Needs a browser-like User-Agent.
   - itch.io name-your-own-price CC0 pack (the AK-47): `POST /<game>/download_url` with the page's
     `csrf_token` returns `{url}` to the download page; `data-upload_id` there; then
     `POST /<game>/file/<id>?key=<key>` with the csrf token returns a short-lived S3 URL. The
     `/purchase` form path returns "Please select a valid payment method" and is a dead end.
   - Quaternius characters: poly.pizza pages embed `static.poly.pizza/<uuid>.glb` inside a model-viewer
     URL; the public search API needs a key. Reused the already-downloaded SWAT trooper instead.
   - Kenney kits on disk were rejected on sight of the preview: cartoon style, wrong for "best graphics".
4. **Headless Blender optimise pass** (`tools/optimize.py`, Blender 5.1 `-b --python … -- slugs`):
   import glTF → drop non-meshes → Decimate to a per-asset triangle budget → join (or keep kit pieces as
   named nodes) → shrink images (512 props / 1024 big) → export GLB with WebP → EEVEE preview render.
   Poly Haven scans are enormous (a pine tree gltf was 958 MB, trees 1.6–3.9 M triangles); the previews
   showed which decimations survived (island_tree_01, tree_small_02) and which turned to shards (jacaranda).
   A mesh with shape keys refuses Decimate ("Modifier cannot be applied to a mesh with shape keys") — skip it.
   An image that Blender cannot pack ("Could not write image … opacity") exports a texture with no `source`,
   which crashes `GLTFLoader.loadTexture` with "Cannot read properties of undefined (reading 'uri')" — drop
   that asset.
5. **Build order = vertical slice**: shell + HUD → world kit → player → weapon → bots → main loop, then
   QA screenshots at 1280×800 and 430×932, then fix what the screenshots show. Every fix came from a
   screenshot, not from guessing.
6. **The invisible viewmodel.** The AK rendered nothing with its PBR material but rendered fine with
   `MeshNormalMaterial`, so the mesh/skeleton/placement were right and the material was discarding
   fragments. Cause: the GLB material came in with blend mode on, and the `prep()` helper converts
   `transparent + opacity 1` into `alphaTest 0.5`; the WebP diffuse had alpha → everything discarded.
   Fix: force `transparent=false, alphaTest=0, opacity=1, depthWrite=true` on viewmodel materials.
7. **Windows looked like white squares** because the glass box sat inside the protruding frame box.
   Rebuilt each window as four frame strips + a recessed glass slab + a thin mullion cross.
8. **33 → 60 fps.** `renderer.info` said 6.8 M triangles/frame. Counted per piece with a node GLB
   parser: grass clumps averaged ~1150 tris × 1300 instances (1.5 M), weeds 8 k × 180 (1.5 M), trees
   70–90 k × 10, 287 textures at 1k (~1.4 GB VRAM). Fixes: weighted the instance mix toward the 104-tri
   clump, cut weeds to 16 per type and re-decimated them to 2.5 k, trees to 34 k and 8 placements,
   props to 512 px textures, grass/weeds never cast shadows. The in-page "toggle a system and read FPS"
   probe was useless because `material.needsUpdate` recompiles stalled the loop for seconds — count
   triangles offline instead.

## 3. The judgment calls
- Did **not** draw any art in code: houses are box kits wearing Poly Haven photo textures with the
  Stillwater grime shader; every prop, fence, pole, tree and the gun are downloaded scans/models. Sprites
  for flashes/particles are gradient VFX textures, not illustrations.
- Did **not** wait for Blender MCP, Sketchfab or Mixamo logins; shipped with CC0 sources and a stand-in
  character, and flagged hoodie characters + first-person arms as the next art pass.
- Did **not** build real multiplayer; bots give the 6v6 feel, and the match/ability code is written so a
  server can replace bot state later.
- Did **not** use the first port in the plan (5440) once `curl` showed another project's HTML there —
  always fetch the served `<title>` before trusting a port.
- Kept the pixel-budget DPR, texel-snapped shadows and single bloom+grade post from Stillwater rather
  than stacking SSAO/SSR; the look came from lights + materials, exactly as the graphics-quality memory says.

## 4. The reusable rule
When cloning a game from a video: extract frames and study a reference bundle with grep before writing
code, source CC0 assets through APIs (Poly Haven files endpoint, itch `download_url`), run a headless
Blender decimate/shrink pass with preview renders, build the thin end-to-end slice, then let screenshots
and `renderer.info` triangle/texture counts drive every fix — and never launch a visible browser window
on the owner's machine to do it.

---

# 2026-10-12 (later) — Tripo hoodie characters with a rifle hold

## 1. The problem
Replace the SWAT stand-ins with realistic hoodie characters made in Tripo, holding the AK convincingly.

## 2. The approach
1. Reference images inside Tripo's image tab (GPT Image 2, free): "realistic 3D game character reference,
   full body, front view, relaxed A-pose with arms angled away from the body, hands open… plain pure white
   background, no shadow, no floor, no weapon". All four came out clean on the first try.
2. Each image row has a hover **Generate 3D** button; in JS it is the n-th `button` whose text is
   "Generate 3D" (newest row first) — no download/upload round-trip. Turn **8K Texture off** (65 → 55 credits).
3. Retopo panel → Quad, Smart Mesh, 10,000 → 40 credits, ~60 s → ~19k triangles with the texture intact.
4. Rig panel → Humanoid + **Mixamo** preset → Auto Rig 20 credits, ~70 s. Test one first, then batch.
5. Animate presets are free to apply: idle, walk, run, hit_to_body_01, fall. There is no rifle preset; the
   AI text-motion ("holding an assault rifle…", 20 cr) gave a binoculars pose — not usable.
6. Export one model with "Number of Animations → Select All" + "Animation stay in Place"; export the rest
   skeleton-only. Same Mixamo bone names → `mixer.clipAction(sharedClip)` works on every model.
7. In three.js: rifle placed relative to `Spine2` in the character's yaw frame, two-bone IK (law of
   cosines + pole hint, rotate bones with world-space `setFromUnitVectors`) for both arms after the mixer.

## 3. The judgment calls
- Did not bake the gun into Tripo/Mixamo clips: IK onto a placed rifle works for every clip and model.
- Did not apply presets to all four models: one carrier file of clips keeps exports small and fast.
- Bugs found only by numbers, not screenshots: a plain `clone()` of a skinned gun stays bound to the
  original skeleton (invisible) → use `SkeletonUtils.clone`; and `cross(forward, up)` is the character's
  RIGHT for a +Z-facing model — negating it put every rifle on the left, hidden behind the torso.

## 4. The reusable rule
For armed characters from Tripo: rig to Mixamo, take free locomotion presets, and hold props with
runtime two-bone IK; when a mesh "isn't there", print its world box and the hand positions before
moving cameras around.

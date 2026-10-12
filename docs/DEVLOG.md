# Hood Warfare (browser)

A browser first-person team-deathmatch set on a Chicago block at dusk, built as a clone of the look and
loop of the "FearBuck: Hood Warfare" video. Three.js, no build step, runs on desktop (mouse + keyboard)
and iPhone (twin-stick touch). Rendering recipe studied from the Stillwater mirror (`../stillwater/`):
ACES tone mapping, a pixel-budget device pixel ratio, an HDR environment, a warm/cool three-light rig,
texel-snapped shadows that follow the player, linear fog, and a light post stack (bloom, grade, grain,
vignette, chromatic fringe).

## Run

Claude preview `hood-warfare`, or:

```bash
python serve.py 5441
```

then open http://127.0.0.1:5441/ . Query flags: `?auto=1` skips the title, `?silent=1` mutes audio,
`?mobile=1` forces the phone quality tier and touch UI.

## What is in the slice (v0.1.0)

- The block: two rows of ten kit-built houses (clapboard or brick, porches, lit windows), garages on
  the alleys, chain-link fences, electricity poles with cables, street lamps with real point lights,
  cars, hydrants, trash cans, tyres, lawn chairs, mattresses, weeds, grass and trees.
- Player: walk/sprint/crouch/jump, step-up onto porches, AK-47 hitscan with recoil, spread, reload,
  ADS, tracers, impacts, decals, blood.
- Bots: 5 allies + 6 enemies on a grid A* nav, line-of-sight perception, bursts, strafing, respawns.
- Match: first team to 100 points (2 per kill) or 10 minutes. Kill feed, hit markers, +100 pop,
  double/triple kill, kill assist.
- Abilities charged by kills: Snitch [4] marks every enemy for 12 s (minimap + x-ray silhouettes),
  Homies [5] drops two allied bots that follow you for 40 s, Suicide bomber [6] sends a runner who
  explodes at the nearest enemy.
- HUD as in the video: circular minimap, team score with WINNING/LOSING/TIED, timer, ammo, ability
  icons with keys, marker-font callouts, teammate distance labels.

## v0.2.0 — Tripo hoodie characters

- Four original characters made in Tripo: opps in a red hoodie and a red jersey, homies in a navy hoodie
  and a royal-blue zip hoodie. Each is ~19k triangles, 1k textures, a 65-bone Mixamo skeleton.
- One file (`blue_zip.glb`) carries the clips; the others reuse them by bone name (`src/characters.js`).
- The rifle is not baked into any clip: a third-person AK is placed off the chest and both arms are
  solved onto it with two-bone IK every frame, so the grip holds in idle, walk and run. Shouldered when a
  bot is engaging, low ready otherwise. Bot tracers now leave the muzzle.
- Check the grip headless with `node qa/grip.mjs` and the line-up with `node qa/chars.mjs`.

## v0.3.0 — ElevenLabs sound

- 17 sounds made with ElevenLabs Sound Effects, trimmed and loudness-normalised with ffmpeg
  (`assets/sfx/`, raw downloads in `assets/sfx/raw/`). The reload foley was squeezed from 8 s to the
  game's 2.25 s reload by removing the gaps between its clicks.
- `src/audio.js`: sfx and ambience buses with a compressor; other players' shots, impacts and deaths are
  positional (distance falloff, stereo pan, distant = darker), and gunfire past 35 m switches to the
  distant-burst sample. A random far-off burst plays every 18–48 s; the ambience ducks under the
  victory/defeat stinger. **M** mutes (remembered per browser).
- Check with `node qa/audio.mjs` (headless): all samples decode, every call runs, mute toggles.

## v0.4.0 — real sky, RPG-7 and destructible brick walls

- **Sky:** a photographed twilight HDRI (Poly Haven `rooftop_night`) drawn unblurred as the backdrop and
  used as the PBR environment; its baked floodlights are clamped so they never flare; fog and the light
  rig take the sky's own horizon colour. `?sky=the_sky_is_on_fire` is the sunset alternative.
- **RPG-7:** press 2 (Q toggles, SWAP on phones). One rocket in the tube, three spare, 3 s reload.
  Rockets fly at 38 m/s with a smoke trail and a light, explode on houses, props, walls or anyone they
  hit, 130 damage falling off over 6.5 m (60 to yourself), and shake the camera.
- **Brick walls:** 14 destructible walls (844 welded blocks) on three-avbd, a GPU physics solver running
  on WebGPU next to the WebGL renderer. A rocket blows a hole through one and the rubble piles up for
  real. Without WebGPU the walls still exist and blasts knock blocks out with a canned tumble.
  The write-up with the measurements: `STUDY-three-avbd.md`.
- QA: `node qa/rocket.mjs [weld=down,side]` fires a rocket at a wall headless; `qa/avbd-smoke.mjs` is
  the physics lab.

## v0.5.0 — destructible houses

- All 20 houses are now physics structures: 12,852 welded panels and roof slabs on three-avbd, still
  60 fps. A rocket blows a face open, the panels tumble into the yard, that house's windows blow out and
  its roof is released to fall where the walls are gone. The porch, foundation and chimney stay.
- Window and door openings are thin structural panes behind the glass; roofs are fixed frames resting
  on the walls until the first hit. Why each of those exists is in `STUDY-three-avbd.md` (Houses).
- QA: `node qa/house.mjs` (rocket into a house), `qa/drift.mjs` (panels at rest), `qa/breaklog.mjs`
  (which welds break), `qa/overlap.mjs` (geometry intersections), `qa/avbd-panel.html` (the wall lab).

## Files

- `index.html` shell + HUD, `src/main.js` boot/loop/match, `src/world.js` block builder and collision,
  `src/player.js`, `src/weapon.js` (viewmodel + FX pools), `src/bots.js` (nav + AI), `src/hud.js`,
  `src/input.js`, `src/audio.js` (WebAudio synth).
- `assets/models/*.glb` game-ready models (see CREDITS.md), `assets/ph/` raw Poly Haven downloads
  (textures used directly, models are the pre-optimisation sources), `tools/optimize.py` the
  headless-Blender optimiser that made the GLBs, `qa/` Playwright QA scripts and screenshots.

## Version

Bump `version.txt` with every change.

## v0.5.3 — landing page

`site/index.html` (clean-web system, accent sampled from the street lamps). USDC rewards plan: four weekly tiers (Diamond/Gold/Silver/Bronze) + two match bounties, one pool funded by the treasury and creator fees, payouts never exceed the pool, Season 1 opens when the pool is funded. Shots in `site/img/` from `qa/shots.mjs` + `qa/shot-destruction.mjs`; QA with `node qa/site.mjs`.

## v0.5.4 — landing page restyled GTA V

Pause-menu look: black panels, white condensed tabs, yellow-gradient wordmark with black stroke (two-layer trick: stroke copy in `::before` under a gradient-clipped inner span), wanted-level stars for tiers, cash-green amounts, WASTED stamp on the destruction shot. Fonts Anton + Roboto Condensed (Pricedown is a paid font now).

## Deploy

`python tools/build-netlify.py` → `deploy/hood-warfare-netlify-latest.zip` (landing at `/`, game at `/play/`, only the assets the game loads; ~116 MB). Drag the zip onto Netlify. Check it first with `node qa/bundle.mjs` after extracting to a folder served on :5442.

## v0.6.0 — weekly ladder (leaderboard) + RPG instructions

- `worker/` — Cloudflare Worker + D1 ladder API, LIVE at https://hood-warfare-api.eugenelau9696.workers.dev
  (`POST /api/match`, `GET /api/ladder?week=current|all`, `GET /api/health`). Rules in `worker/src/ladder.js`
  (points = 10 per kill + 50 per win; weeks Mon 00:00 → Sun 23:59 UTC; tiers Diamond 1-10 / Gold 11-50 / Silver 51-250 /
  Bronze 251-1000). Tests: `node worker/test.mjs` (node:sqlite stand-in). Deploy: `npx wrangler deploy` in `worker/`.
  D1 `hood-warfare` id 18f58e4a-dc18-467b-b048-1fa303e2c981. Anti-cheat is plausibility checks + 20 s rate limit only.
- Game: gamertag + optional Solana wallet on the title screen (localStorage `hw.id`); match end posts the result and
  shows the Season 1 tier cards + top 10 + your row (`src/ladder.js`). `?api=` overrides the API, `?nosubmit=1` skips.
- "PRESS 2 TO ARM THE RPG-7" leads the title hint and fires as a callout 1.8 s into every match (SWAP on phone).
- `site/leaderboard.html` — public ladder page (this week / all time). Landing amounts x3: 300/75/15/3, bounties 1.50/0.75.
- QA: `node qa/ladder.mjs` (needs `npx wrangler dev --local --port 8787` in `worker/` + the schema applied locally).

## v0.7.0 — realistic bullets and explosions

- Bullets: travelling streaks (540 m/s, 1.4 m faint / 2.4 m bright tracer every third round) instead of a full-length laser line; smaller one-frame muzzle flash from photographic frames; less muzzle light on the viewmodel.
- Explosions (`FX.explosion` in `src/weapon.js`): flash core, 12 fireball billows that burn yellow to red, 20 black smoke billows lit orange for the first moments, ground dust ring, 26 brick/plaster debris chunks with bounce, embers, scorch decal, distance-scaled camera shake, flickering light. Rocket fireball is placed 1 m in front of the surface so walls don't hide it.
- Rocket trail and backblast, wall-break brick dust and bullet impacts use the same photographic puffs (Kenney Smoke Particles, CC0, `assets/fx/`).
- Trap: sprite colours are linear, so a 0.3 grey renders light grey at night; smoke and dust tints sit at 0.03–0.09. Flipping `toneMapped` on a live material needs `needsUpdate = true`.
- Demo recorder `qa/demo.mjs` now plays a live match (bots on), drives movement through real key events and taps the WebAudio mix into the video.

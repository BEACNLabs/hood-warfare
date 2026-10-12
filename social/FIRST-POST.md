# Hood Warfare — first post

Checked 2026-10-13: Steam store search lists **Hood Warfare 2**, released 8 Oct 2026 (the original Hood Warfare
released 26 Jan 2023). The X search link is the owner's. Tier amounts and points are from `worker/src/ladder.js`
(live API). Engine figures are from the build (v0.6.0).

Attach: `social/hood-warfare-demo-20s.mp4` (AK triple kill → RPG-7 into two houses).

---

## Medium (owner asked "longer" after the short one, 2026-10-13)

Hood Warfare 2 is trending on Steam, so I made a free version you play in the browser. No download, works on phone or desktop.

Same idea: a Chicago block at night, opps in red, homies in blue, 6v6. You get an AK and an RPG. Kills charge three abilities: Snitch shows every opp on the map, Homies spawns two of your crew, Bomber sends a runner at the nearest enemy.

Every house and wall on the block can be blown apart. They're built from 12,852 bricks and panels that run as real physics on your GPU, so a rocket opens the wall exactly where it lands and the rubble stays there.

Built with Three.js and a real night-sky HDRI for the lighting. The characters were made and rigged in Tripo, and the sounds were made with ElevenLabs. It runs at 60 fps on an iPhone.

There's a weekly ladder that pays USDC. 10 points per kill, 50 per win, and it resets every Sunday. Top 10 get 300, top 50 get 75, top 250 get 15, top 1,000 get 3. MVP of a match gets 1.50 and a Rampage gets 0.75.

All of it is paid from one pool, funded by the treasury and by the creator fees from every trade. The more the coin trades, the bigger next season's prizes get.

[link]

## Shorter (owner asked "shorter post, less ai slop", 2026-10-13)

Hood Warfare 2 is trending on Steam, so I made a free version you play in the browser, phone or desktop.

AK and RPG, 6v6 on a Chicago block, and every house breaks brick by brick. 12,852 physics bricks run on your GPU.

Weekly ladder pays USDC. Top 10 get 300, top 50 get 75, top 250 get 15, top 1,000 get 3. The pool is funded by the treasury and creator fees.

[link]

## Long version (needs X Premium, over 280 characters)

Enter Hood Warfare, where the Chicago block everyone is fighting over on Steam runs free in a browser tab, and the weekly ladder pays in USDC.

The Block Test: how much of a Steam shooter fits behind a link.

Hood Warfare 2 landed on Steam on October 8 and the block has been all over the timeline since. It costs a download and a price tag. I built something that runs the same fight from a link, on a phone or a desktop, for nothing.

A residential block on Chicago's south side at blue hour. Opps in red, homies in blue, six a side. An AK-47 and an RPG-7. Kills charge three calls: Snitch marks every opp on the block, Homies drops two of your crew at your back, Bomber sends a runner at the nearest enemy. First team to 100, or the most when ten minutes are up.

Why i chose the browser? Because a link is the only lobby everyone already has.

Findings :
1. Destruction. Every house and garden wall is welded brick: 12,852 panels simulated on the GPU with Augmented Vertex Block Descent (three-avbd, WebGPU), running beside the WebGL renderer. A rocket breaks the welds where it lands, the roof drops where nothing holds it, and the rubble stays for the match.
2. Light. Three.js with ACES tone mapping, a real night-sky HDRI from Poly Haven lighting the whole street, Victorian lamps as real point lights, bloom and a film grade.
3. Characters. Four hoodie characters generated, retopologised and rigged with Tripo, one shared Mixamo animation set, rifles held by two-bone IK.
4. Sound. Twenty effects generated with ElevenLabs and placed in 3D around you, from the AK's slap-back off the houses to the bricks coming down.
5. Reach. 60 fps on desktop and on an iPhone 15 Pro Max. Twin-stick touch on a phone, mouse and keyboard on a desktop, same block, same ladder.

What I built :
A weekly ladder. Every ranked match posts your kills and wins: 10 points a kill, 50 a win, Monday to Sunday night UTC. Where you stand on Sunday sets your tier.
Diamond, top 10: 300 USDC each
Gold, 11 to 50: 75 USDC each
Silver, 51 to 250: 15 USDC each
Bronze, 251 to 1,000: 3 USDC each
Match bounties: MVP 1.50 USDC, Rampage 0.75 USDC.

How the money moves.
One rewards pool, filled from two places: the treasury, which seeds every season, and the creator fees the token earns on every trade. Payouts never exceed the pool. Tiers are sized from the pool on day one of a season, grow between seasons, and never shrink mid-season. Paid in USDC on Solana, to the wallet you played with.

Why this way.
Every trade on the coin becomes prize money on the block. The more the block trades, the more the next season pays.

Play it free in your browser: [your Netlify link]

---

## Short version (≤280)

Hood Warfare 2 is all over Steam. I made the block free in your browser: 12,852 destructible bricks on the GPU, AK and RPG, 6v6, phone or desktop. Weekly ladder pays USDC: 300 / 75 / 15 / 3 by tier, funded by the treasury and creator fees. [link]

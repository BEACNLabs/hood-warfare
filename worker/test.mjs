// Plain-node tests with a node:sqlite stand-in for D1 (same prepare().bind().all()/first()/run() shape).  node test.mjs
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { weekOf, validateMatch, tierFor } from './src/ladder.js';
import worker from './src/index.js';

const db = new DatabaseSync(':memory:'); db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
const DB = { prepare: (sql) => ({ bind: (...a) => ({ all: async () => ({ results: db.prepare(sql).all(...a) }), first: async () => db.prepare(sql).get(...a), run: async () => db.prepare(sql).run(...a) }) }) };
const env = { DB, ALLOWED_ORIGIN: '*' };
let pass = 0, failN = 0;
const ok = (c, msg) => { if (c) pass++; else { failN++; console.log('FAIL', msg); } };
const call = async (path, init = {}, ip = '1.1.1.1') => { const r = await worker.fetch(new Request('http://x' + path, { ...init, headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip, ...(init.headers || {}) } }), env); return [r.status, await r.json()]; };
const post = (b, ip) => call('/api/match', { method: 'POST', body: JSON.stringify(b) }, ip);

// weeks
ok(weekOf(Date.UTC(2026, 0, 1)).id === '2026-W01', 'jan 1 2026 (Thu) is W01');
ok(weekOf(Date.UTC(2026, 9, 12, 12)).id === '2026-W42', 'oct 12 2026 is W42');
ok(weekOf(Date.UTC(2026, 9, 11, 23, 59)).id === '2026-W41' && weekOf(Date.UTC(2026, 9, 12, 0)).id === '2026-W42', 'week flips Sunday→Monday midnight UTC');
ok(new Date(weekOf(Date.UTC(2026, 9, 14)).closes).toISOString() === '2026-10-19T00:00:00.000Z', 'closes at next Monday 00:00 UTC');
// validation
ok(!validateMatch({ name: 'x', kills: 1, deaths: 1, blue: 100, red: 50, duration: 300 }).ok, 'short name rejected');
ok(!validateMatch({ name: 'Rico', wallet: 'nope', kills: 1, deaths: 1, blue: 100, red: 50, duration: 300 }).ok, 'bad wallet rejected');
ok(!validateMatch({ name: 'Rico', kills: 90, deaths: 1, blue: 100, red: 50, duration: 60 }).ok, 'implausible kill rate rejected');
const v = validateMatch({ name: 'Rico', wallet: '3S9kpsr36bkLYAJdy65cXjTDUe9NkkL3kz7ypZpg9k63', kills: 12, deaths: 4, blue: 100, red: 72, duration: 420 });
ok(v.ok && v.match.points === 170 && v.match.won === 1 && v.match.pkey.startsWith('w:'), 'points = 12*10 + 50 win, keyed by wallet');
ok(tierFor(1).name === 'Diamond' && tierFor(50).name === 'Gold' && tierFor(251).name === 'Bronze' && tierFor(1001) === null, 'tier bands');
// http flow
let [s, b] = await call('/api/health'); ok(s === 200 && b.ok && b.week.id, 'health');
[s, b] = await call('/api/ladder'); ok(s === 200 && b.rows.length === 0 && b.week === weekOf().id, 'empty ladder');
[s, b] = await post({ name: 'Rico', kills: 12, deaths: 4, blue: 100, red: 72, duration: 420 }); ok(s === 200 && b.rank === 1 && b.points === 170 && b.total === 1, 'first submit rank 1 ' + JSON.stringify(b));
[s, b] = await post({ name: 'Rico', kills: 1, deaths: 4, blue: 50, red: 100, duration: 420 }); ok(s === 429, 'same player throttled 20 s');
[s, b] = await post({ name: 'Dre', kills: 20, deaths: 4, blue: 100, red: 72, duration: 420 }, '2.2.2.2'); ok(s === 200 && b.rank === 1 && b.total === 2, 'Dre takes rank 1 with 250');
[s, b] = await post({ name: 'Lil T', kills: 3, deaths: 9, blue: 40, red: 100, duration: 300 }, '3.3.3.3'); ok(s === 200 && b.rank === 3 && b.earned === 30, 'loss earns kills only');
[s, b] = await post({ name: 'bad!', kills: 3, deaths: 9, blue: 40, red: 100, duration: 300 }, '4.4.4.4'); ok(s === 400, 'bad name 400');
[s, b] = await call('/api/ladder?week=current'); ok(b.rows.length === 3 && b.rows[0].name === 'Dre' && b.rows[0].tier === 'Diamond' && b.rows[2].points === 30, 'ladder ordered ' + JSON.stringify(b.rows.map((r) => [r.rank, r.name, r.points])));
ok(b.rows[0].wallet === null && b.tiers[0].usdc === 300 && b.points.kill === 10, 'public row shape + tiers 300/75/15/3');
[s, b] = await call('/api/ladder?week=all'); ok(b.rows.length === 3 && b.week === 'all', 'all-time view');
[s, b] = await call('/api/ladder?week=2020-W01'); ok(b.rows.length === 0, 'old week empty');
console.log(`${pass} passed, ${failN} failed`); process.exit(failN ? 1 : 0);

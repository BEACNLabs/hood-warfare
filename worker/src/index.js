/* HOOD WARFARE ladder API — Cloudflare Worker + D1 (binding DB). Plain JS, no build step.
 * POST /api/match   {name, wallet?, kills, deaths, blue, red, duration}  → {ok, week, points, rank, total}
 * GET  /api/ladder?week=current|all|2026-W42&limit=100                  → {week, opens, closes, rows, tiers, points}
 * GET  /api/health
 * Reads are cached per isolate for 15 s and at the edge for 15 s (D1 free tier counts rows per request). */
import { VERSION, POINTS, TIERS, weekOf, validateMatch, decorate } from './ladder.js';

const AGG = `SELECT pkey, name, wallet, SUM(points) AS points, SUM(kills) AS kills, SUM(deaths) AS deaths, SUM(won) AS wins, COUNT(*) AS matches
  FROM matches {WHERE} GROUP BY pkey ORDER BY points DESC, kills DESC, deaths ASC, MIN(ts) ASC LIMIT ?`;
const cache = new Map();          // key -> { t, body }
const lastSubmit = new Map();     // ip / pkey -> ts
let gen = 0;

const cors = (env) => ({ 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
const json = (env, body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(env), ...extra } });
const fail = (env, status, error) => json(env, { ok: false, error }, status);
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].slice(0, 8).map((x) => x.toString(16).padStart(2, '0')).join(''); }

async function ladder(env, weekParam, limit, now) {
  const cur = weekOf(now);
  const all = weekParam === 'all';
  const id = all ? 'all' : (weekParam && weekParam !== 'current' ? String(weekParam).slice(0, 8) : cur.id);
  const key = `${id}:${limit}:${gen}`;
  const hit = cache.get(key); if (hit && now - hit.t < 15000) return hit.body;
  const sql = AGG.replace('{WHERE}', all ? '' : 'WHERE week = ?');
  const q = all ? env.DB.prepare(sql).bind(limit) : env.DB.prepare(sql).bind(id, limit);
  const { results } = await q.all();
  const body = { ok: true, version: VERSION, week: id, current: cur.id, opens: all ? null : (id === cur.id ? cur.opens : null), closes: id === cur.id ? cur.closes : null, now, rows: decorate(results || []), tiers: TIERS, points: POINTS };
  cache.set(key, { t: now, body }); if (cache.size > 50) cache.clear();
  return body;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url); const now = Date.now();
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env) });
    if (url.pathname === '/' || url.pathname === '/api/health') return json(env, { ok: true, service: 'hood-warfare-api', version: VERSION, week: weekOf(now) });
    if (url.pathname === '/api/ladder' && req.method === 'GET') {
      const limit = Math.min(1000, Math.max(1, parseInt(url.searchParams.get('limit') || '100', 10) || 100));
      try { return json(env, await ladder(env, url.searchParams.get('week') || 'current', limit, now), 200, { 'Cache-Control': 'public, max-age=15' }); }
      catch (e) { return fail(env, 503, 'ladder unavailable: ' + e.message); }
    }
    if (url.pathname === '/api/match' && req.method === 'POST') {
      let body; try { body = await req.json(); } catch { return fail(env, 400, 'json body required'); }
      const v = validateMatch(body); if (!v.ok) return fail(env, 400, v.error);
      const m = v.match; const ip = req.headers.get('CF-Connecting-IP') || 'local';
      for (const k of [ip, m.pkey]) { const t = lastSubmit.get(k) || 0; if (now - t < 20000) return fail(env, 429, 'one match every 20 s'); }
      lastSubmit.set(ip, now); lastSubmit.set(m.pkey, now); if (lastSubmit.size > 5000) lastSubmit.clear();
      const wk = weekOf(now);
      try {
        await env.DB.prepare('INSERT INTO matches (week,pkey,name,wallet,kills,deaths,blue,red,won,duration,points,ts,ip_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
          .bind(wk.id, m.pkey, m.name, m.wallet, m.kills, m.deaths, m.blue, m.red, m.won, m.duration, m.points, now, await sha(ip)).run();
        gen++;
        const mine = await env.DB.prepare('SELECT SUM(points) AS points, COUNT(*) AS matches FROM matches WHERE week = ? AND pkey = ?').bind(wk.id, m.pkey).first();
        const above = await env.DB.prepare('SELECT COUNT(*) AS n FROM (SELECT pkey, SUM(points) AS p FROM matches WHERE week = ? GROUP BY pkey HAVING p > ?)').bind(wk.id, mine.points).first();
        const total = await env.DB.prepare('SELECT COUNT(DISTINCT pkey) AS n FROM matches WHERE week = ?').bind(wk.id).first();
        return json(env, { ok: true, week: wk.id, closes: wk.closes, earned: m.points, points: mine.points, matches: mine.matches, rank: (above.n || 0) + 1, total: total.n || 0 });
      } catch (e) { return fail(env, 503, 'could not record match: ' + e.message); }
    }
    return fail(env, 404, 'not found');
  },
};

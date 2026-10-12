// Pure ladder rules: week keys, match validation, points, tiers. No I/O here so it can be tested in plain node.
export const VERSION = '0.6.0';
export const POINTS = { kill: 10, win: 50 };
// Season 1 plan (USDC per player per week). Paid only once the pool is funded — the ladder itself runs now.
export const TIERS = [
  { name: 'Diamond', from: 1, to: 10, usdc: 300, stars: 5 },
  { name: 'Gold', from: 11, to: 50, usdc: 75, stars: 4 },
  { name: 'Silver', from: 51, to: 250, usdc: 15, stars: 3 },
  { name: 'Bronze', from: 251, to: 1000, usdc: 3, stars: 2 },
];
const DAY = 86400e3;
// Ladder weeks run Monday 00:00 UTC → Sunday 23:59:59 UTC ("claim on Sunday"). Id is the ISO week, e.g. 2026-W42.
export function weekOf(ms = Date.now()) {
  const d = new Date(ms);
  const dow = (d.getUTCDay() + 6) % 7;
  const opens = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow);
  const thu = opens + 3 * DAY; const year = new Date(thu).getUTCFullYear();
  const week = Math.floor((thu - Date.UTC(year, 0, 1)) / DAY / 7) + 1;
  return { id: `${year}-W${String(week).padStart(2, '0')}`, opens, closes: opens + 7 * DAY };
}
export const tierFor = (rank) => TIERS.find((t) => rank >= t.from && rank <= t.to) || null;
export const isSolanaAddress = (s) => typeof s === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
export const NAME_RE = /^[A-Za-z0-9 _.\-]{2,16}$/;
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
// Returns { ok, error } or { ok, match } with the cleaned row (without week/ts).
export function validateMatch(b) {
  if (!b || typeof b !== 'object') return { ok: false, error: 'bad body' };
  const name = String(b.name || '').trim();
  if (!NAME_RE.test(name)) return { ok: false, error: 'gamertag: 2-16 letters, digits, space, _ . -' };
  const wallet = b.wallet ? String(b.wallet).trim() : '';
  if (wallet && !isSolanaAddress(wallet)) return { ok: false, error: 'wallet is not a Solana address' };
  const { kills, deaths, blue, red, duration } = b;
  if (!int(kills, 0, 120) || !int(deaths, 0, 120)) return { ok: false, error: 'kills/deaths out of range' };
  if (!int(blue, 0, 100) || !int(red, 0, 100)) return { ok: false, error: 'score out of range' };
  if (!int(duration, 30, 700)) return { ok: false, error: 'match too short or too long' };
  if (kills > duration / 4 + 3) return { ok: false, error: 'implausible kill rate' };
  const won = blue > red ? 1 : 0;
  const points = kills * POINTS.kill + won * POINTS.win;
  const pkey = wallet ? 'w:' + wallet : 'n:' + name.toLowerCase();
  return { ok: true, match: { pkey, name, wallet: wallet || null, kills, deaths, blue, red, won, duration, points } };
}
export const shortWallet = (w) => (w ? w.slice(0, 4) + '…' + w.slice(-4) : null);
// Rows from the aggregate query → public ladder rows with rank + tier.
export function decorate(rows) {
  return rows.map((r, i) => {
    const rank = i + 1; const t = tierFor(rank);
    return { rank, tier: t ? t.name : null, name: r.name, wallet: shortWallet(r.wallet), points: r.points, kills: r.kills, deaths: r.deaths, wins: r.wins, matches: r.matches };
  });
}

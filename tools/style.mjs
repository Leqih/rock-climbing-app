// How often each technique shows up, worked out from Spotter's moves and from the coach's marked landings, per video.
//   node tools/style.mjs
// The rules match styleOf and feetFirst in app.js. Each is applied to both lists of landings, so a gap is Spotter missing or
// mistiming moves. The labels hold landing times only: they can't tell whether a knee dropped or a foot was high, only where.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url)), L = JSON.parse(readFileSync(`${root}/labels/wayup-coach.json`, 'utf8'));
const rows = [];
for (const x of L) {
  const T = JSON.parse(readFileSync(`${root}/video/${x.vid}.track.json`, 'utf8')), W = T.W, H = T.H;
  const pt = (s, i) => ({ x: s.p[i][0] * W, y: s.p[i][1] * H, v: s.p[i][2] });
  const tor = s => { const a = pt(s, 1), b = pt(s, 2), c = pt(s, 7), d = pt(s, 8); return Math.hypot((a.x + b.x - c.x - d.x) / 2, (a.y + b.y - c.y - d.y) / 2) || 1; };
  const S = T.S.filter(s => s.p), at = t => S.reduce((b, s) => Math.abs(s.t - t) < Math.abs(b.t - t) ? s : b);
  // the style rules, on a list of landings {k, t} (t0 = start of the move, where known)
  function rates(mv) {
    mv = [...mv].sort((a, b) => a.t - b.t);
    const feet = mv.filter(m => m.k[1] === 'a'), hands = mv.filter(m => m.k[1] === 'w'), r = {};
    const add = (id, y) => { r[id] ||= { e: 0, c: 0 }; r[id].c++; if (y) r[id].e++; };
    hands.forEach((m, i) => {
      const prev = i ? hands[i - 1].t : -Infinity;
      // feet first, as feetFirst in app.js: a foot landed after the hand before this one landed, 0.4 s slack either side
      add('foot', feet.some(f => f.t > prev - .4 && f.t < m.t + .4));
      const s = at(m.t), l = pt(s, 5), q = pt(s, 6), u = tor(s);
      if (l.v >= .5 && q.v >= .5) { const d = Math.hypot(l.x - q.x, l.y - q.y); add('match', d < .25 * u); add('cross', d >= .25 * u && l.x > q.x + .1 * u); }
    });
    feet.forEach(m => { const s = at(m.t), i = m.k === 'la' ? 11 : 12, an = pt(s, i), kn = pt(s, i - 2), hy = (pt(s, 7).y + pt(s, 8).y) / 2, u = tor(s);
      if (an.v < .5) return; add('high', an.y <= hy + .3 * u); if (kn.v >= .5) add('drop', kn.y > an.y + .05 * u); });
    return r;
  }
  const c = rates(x.marks), o = rates(T.moves);
  rows.push({ vid: x.vid, c, o });
}
const pc = r => r && r.c ? r.e / r.c : null, f = v => v == null ? '  —' : String(Math.round(v * 100)).padStart(3) + '%';
const keys = ['foot', 'match', 'cross', 'high', 'drop'];
console.log('coach / Spotter'.padEnd(20), keys.map(k => k.padStart(16)).join(''));
for (const r of rows) console.log(r.vid.padEnd(20), keys.map(k => `${f(pc(r.c[k]))} / ${f(pc(r.o[k]))}`.padStart(16)).join(''));
// how well our per-video rate follows the coach's: mean abs error, and rank correlation across climbers
const sp = (a, b) => { const rk = v => v.map(x => v.filter(y => y < x).length + (v.filter(y => y === x).length - 1) / 2), A = rk(a), B = rk(b), n = a.length, ma = (n - 1) / 2;
  let num = 0, da = 0, db = 0; for (let i = 0; i < n; i++) { num += (A[i] - ma) * (B[i] - ma); da += (A[i] - ma) ** 2; db += (B[i] - ma) ** 2; } return num / Math.sqrt(da * db); };
console.log('\nrule            coach   ours   mean gap   rank agreement (Spearman)');
for (const [k, ck] of keys.map(k => [k, k])) {
  const ok = rows.filter(r => pc(r.c[ck]) != null && pc(r.o[k]) != null), a = ok.map(r => pc(r.c[ck])), b = ok.map(r => pc(r.o[k]));
  const m = v => v.reduce((s, x) => s + x, 0) / v.length;
  console.log(`${k.padEnd(14)} ${f(m(a))}  ${f(m(b))}   ${f(m(a.map((x, i) => Math.abs(x - b[i]))))}     ${sp(a, b).toFixed(2)}`);
}

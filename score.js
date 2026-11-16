/* Spotter · how well the app's moves match moves a person marked by hand.
   A mark is { k: 'lw' | 'rw' | 'la' | 'ra', t }: that hand or foot lands on a hold at t seconds. The app's moves are pose.js's
   T.moves, whose landing time is m.t. Used by label.html in the browser and tools/score.mjs in Node. */
(function (root) {
  const LIMBS = ['lw', 'rw', 'la', 'ra'];
  const NAME = { lw: 'Left hand', rw: 'Right hand', la: 'Left foot', ra: 'Right foot' };
  const median = xs => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const pct = (a, b) => b ? a / b : null;

  // pair each mark with one of the app's moves of the same limb, closest first, at most tol seconds apart
  function match(marks, moves, tol) {
    const pairs = [];
    for (const k of LIMBS) {
      const L = marks.filter(m => m.k === k), A = moves.filter(m => m.k === k), cand = [];
      L.forEach((l, i) => A.forEach((a, j) => { const d = Math.abs(a.t - l.t); if (d <= tol) cand.push({ i, j, d }); }));
      cand.sort((p, q) => p.d - q.d);
      const ul = new Set(), ua = new Set();
      for (const c of cand) if (!ul.has(c.i) && !ua.has(c.j)) { ul.add(c.i); ua.add(c.j); pairs.push({ k, l: L[c.i], a: A[c.j], d: A[c.j].t - L[c.i].t }); }
    }
    return pairs;
  }

  // marks and moves outside [from, to] don't count: the part of the video someone actually marked
  function score(marks, moves, { tol = 1, from = -Infinity, to = Infinity } = {}) {
    const inW = m => m.t >= from && m.t <= to;
    marks = marks.filter(inW); moves = moves.filter(inW).map(m => ({ k: m.k, t: m.t }));
    const pairs = match(marks, moves, tol);
    const by = {};
    for (const k of [...LIMBS, 'hands', 'feet', 'all']) {
      const ks = k === 'all' ? LIMBS : k === 'hands' ? ['lw', 'rw'] : k === 'feet' ? ['la', 'ra'] : [k];
      const tp = pairs.filter(p => ks.includes(p.k)).length, nl = marks.filter(m => ks.includes(m.k)).length, na = moves.filter(m => ks.includes(m.k)).length;
      const recall = pct(tp, nl), precision = pct(tp, na);
      by[k] = { marked: nl, reported: na, matched: tp, missed: nl - tp, extra: na - tp, recall, precision,
        f1: recall != null && precision != null && recall + precision ? 2 * recall * precision / (recall + precision) : null,
        timing: median(pairs.filter(p => ks.includes(p.k)).map(p => Math.abs(p.d))) };
    }
    // order and pauses: neighbouring marks that both have a match. Order is right when the app has them the same way round;
    // the pause is the time between them, by hand against by the app
    const lab = [...marks].sort((p, q) => p.t - q.t), of = new Map(pairs.map(p => [p.l, p.a]));
    let inOrder = 0, pairsSeen = 0; const pauseErr = [];
    for (let i = 1; i < lab.length; i++) {
      const a0 = of.get(lab[i - 1]), a1 = of.get(lab[i]); if (!a0 || !a1) continue;
      pairsSeen++; if (a1.t >= a0.t) inOrder++;
      pauseErr.push(Math.abs((a1.t - a0.t) - (lab[i].t - lab[i - 1].t)));
    }
    // a baseline to beat: the same number of moves at random times, each limb as often as the app reports it
    const rng = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7), lo = Math.max(from, Math.min(...marks.map(m => m.t), ...moves.map(m => m.t))), hi = Math.min(to, Math.max(...marks.map(m => m.t), ...moves.map(m => m.t)));
    let chance = 0; const RUNS = 50;
    if (isFinite(lo) && isFinite(hi) && hi > lo) for (let r = 0; r < RUNS; r++) chance += match(marks, moves.map(m => ({ k: m.k, t: lo + rng() * (hi - lo) })), tol).length / (marks.length || 1) / RUNS;
    return { tol, by, order: pct(inOrder, pairsSeen), orderPairs: pairsSeen, pause: median(pauseErr), pauseWithin05: pct(pauseErr.filter(e => e <= .5).length, pauseErr.length), chanceRecall: chance, pairs };
  }

  // several videos at once: add up the counts, then the shares
  function total(list) {
    const sum = { marked: 0, reported: 0, matched: 0 }, ord = { a: 0, n: 0 }, pe = [];
    const rows = {}; for (const k of ['hands', 'feet', 'all']) rows[k] = { marked: 0, reported: 0, matched: 0 };
    list.forEach(s => { for (const k in rows) { rows[k].marked += s.by[k].marked; rows[k].reported += s.by[k].reported; rows[k].matched += s.by[k].matched; }
      if (s.order != null) { ord.a += s.order * s.orderPairs; ord.n += s.orderPairs; }
      if (s.pause != null) pe.push(s.pause); });
    for (const k in rows) { const r = rows[k]; r.recall = pct(r.matched, r.marked); r.precision = pct(r.matched, r.reported); }
    return { rows, order: pct(ord.a, ord.n), pause: median(pe), videos: list.length };
  }

  const api = { LIMBS, NAME, match, score, total };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Score = api;
})(typeof window !== 'undefined' ? window : globalThis);

/* chalk. · movement analysis of a video of a climb.
   MediaPipe Pose Landmarker (full) finds 33 body points, in the browser. poseScan goes through the whole video once and keeps a
   track: which hand or foot moves when, every rest, the arm angles and where the hips are. posePlay then shows that track on the
   video and under it, at whatever moment the video is at. Nothing is uploaded. Needs a connection the first time, to load the model. */
(() => {
  const VIS = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';
  let lm = null, loading = null;
  const load = () => loading || (loading = (async () => {
    const { FilesetResolver, PoseLandmarker } = await import(`${VIS}/vision_bundle.mjs`);
    const files = await FilesetResolver.forVisionTasks(`${VIS}/wasm`);
    const opts = delegate => ({ baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'VIDEO', numPoses: 2, minPoseDetectionConfidence: .4, minPosePresenceConfidence: .4, minTrackingConfidence: .4 });
    try { lm = await PoseLandmarker.createFromOptions(files, opts('GPU')); } catch { lm = await PoseLandmarker.createFromOptions(files, opts('CPU')); }
    return lm;
  })());

  // body points (MediaPipe numbering) and the lines between them
  const P = { ls: 11, rs: 12, le: 13, re: 14, lw: 15, rw: 16, lh: 23, rh: 24, lk: 25, rk: 26, la: 27, ra: 28 };
  const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
  const LIMBS = [['lw', 'Left hand'], ['rw', 'Right hand'], ['la', 'Left foot'], ['ra', 'Right foot']];
  const MOVING = 1.1, SETTLE = .25, REACH = .35;   // speed in torso lengths per second; still this long ends a move; a move travels at least this far

  const HZ = 5, IDX = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28], R3 = n => Math.round(n * 1000) / 1000;   // how often a video is sampled, and which points we keep
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const angle = (a, b, c) => { const v1 = { x: a.x - b.x, y: a.y - b.y }, v2 = { x: c.x - b.x, y: c.y - b.y };
    return Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1)))) * 180 / Math.PI; };
  const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const set = (id, t) => { const el = document.getElementById(id); if (el && el.textContent !== t) el.textContent = t; };

  function fresh() {
    return { t: null, pts: null, limb: Object.fromEntries(LIMBS.map(([k]) => [k, { moving: false, still: 0, from: null }])),
      moves: [] };
  }

  // one frame: which body is the climber? Drop faint or impossibly big ones; keep following the one we had; else the one highest
  // on the wall (feet furthest off the floor), so someone walking past on the mats isn't picked
  const KEY = [P.ls, P.rs, P.le, P.re, P.lw, P.rw, P.lh, P.rh, P.lk, P.rk, P.la, P.ra];
  const torso = b => dist(mid(b[P.ls], b[P.rs]), mid(b[P.lh], b[P.rh]));
  function pick(bodies, st, W, H, t) {
    const ok = bodies.filter(b => KEY.reduce((a, i) => a + b[i].v, 0) / KEY.length > .35 && torso(b) < H * .35);
    if (!ok.length) return null;
    if (st.pts) { const h0 = mid(st.pts[P.lh], st.pts[P.rh]), T0 = st.T || torso(st.pts) || 1;
      // same person: hips close to where they were, and about the same size (someone nearer the phone looks much bigger)
      const near = ok.map(b => [b, dist(mid(b[P.lh], b[P.rh]), h0) / T0, torso(b) / T0]).filter(x => x[2] > .5 && x[2] < 2).sort((a, c) => a[1] - c[1])[0];
      if (near && near[1] < 1.5) return near[0];
      if (t - st.t < 1) return null; } // lost them for a moment: wait rather than jump to someone else
    // the climber tagged themselves: start on the body nearest those taps
    if (st.seed && Math.abs(t - st.seed.t) < .6) { const s = st.seed, off = b => [[0, 'head'], [P.lw, 'lh'], [P.rw, 'rh'], [P.la, 'lf'], [P.ra, 'rf']].reduce((a, [i, k]) => a + dist(b[i], { x: s[k].x * W, y: s[k].y * H }), 0); return ok.sort((a, c) => off(a) - off(c))[0]; }
    return ok.sort((a, c) => Math.max(a[P.la].y, a[P.ra].y) - Math.max(c[P.la].y, c[P.ra].y))[0];
  }
  function step(st, res, t, W, H) {
    const bodies = (res.landmarks || []).map(l => l.map(p => ({ x: p.x * W, y: p.y * H, v: p.visibility ?? 1 })));
    let b = pick(bodies, st, W, H, t);
    // the model can swap left and right on someone facing the wall: a fix by the climber settles it, once, on the frame they fixed
    if (b && st.seed) { const s = st.seed, d = (i, k) => dist(b[i], { x: s[k].x * W, y: s[k].y * H });
      if (st.flipU === undefined && Math.abs(t - s.t) < .6) { st.flipU = d(P.rw, 'lh') + d(P.lw, 'rh') < d(P.lw, 'lh') + d(P.rw, 'rh'); st.flipL = d(P.ra, 'lf') + d(P.la, 'rf') < d(P.la, 'lf') + d(P.ra, 'rf'); }
      const c = [...b], swap = pairs => pairs.forEach(([x, y]) => { c[x] = b[y]; c[y] = b[x]; });
      if (st.flipU) swap([[P.ls, P.rs], [P.le, P.re], [P.lw, P.rw]]);
      if (st.flipL) swap([[P.lh, P.rh], [P.lk, P.rk], [P.la, P.ra]]);
      b = c; }
    if (!b) { if (st.t !== null && t - st.t > 1) { st.pts = null; st.T = null; } return null; }
    // body size, smoothed: one bad frame shouldn't make every limb look fast or slow
    st.T = st.T ? st.T * .85 + (torso(b) || st.T) * .15 : torso(b) || 1; const T = st.T;
    const seen = [P.ls, P.rs, P.lh, P.rh].filter(i => b[i].v > .3).length >= 3;
    const dt = st.t === null ? 0 : Math.max(0, t - st.t);
    // smooth the points a little so a shaky hand isn't counted as a move
    const pts = st.pts && dt < .5 ? b.map((p, i) => ({ x: st.pts[i].x * .45 + p.x * .55, y: st.pts[i].y * .45 + p.y * .55, v: p.v })) : b;
    let now = null, top = 0;
    // measured against the hips, so a phone that pans or tilts isn't counted as the climber moving
    if (st.pts && dt > 0 && dt < .5) { const h = mid(pts[P.lh], pts[P.rh]), h0 = mid(st.pts[P.lh], st.pts[P.rh]);
      for (const [k, name] of LIMBS) {
        const p = { x: pts[P[k]].x - h.x, y: pts[P[k]].y - h.y }, q = { x: st.pts[P[k]].x - h0.x, y: st.pts[P[k]].y - h0.y }, s = dist(p, q) / dt / T, L = st.limb[k];
        if (pts[P[k]].v < .4) continue;
        if (s > MOVING) { if (!L.moving) { L.moving = true; L.from = q; L.t0 = st.t; } L.still = 0; if (s > top) { top = s; now = name; } }
        else if (L.moving && (L.still += dt) > SETTLE) { L.moving = false; if (dist(p, L.from) / T > REACH) st.moves.push({ k, name, t0: L.t0, t }); }
      } }
    const el = angle(pts[P.ls], pts[P.le], pts[P.lw]), er = angle(pts[P.rs], pts[P.re], pts[P.rw]), bent = Math.min(el, er);
    const straight = bent > 145;
    const off = (mid(pts[P.lh], pts[P.rh]).x - mid(pts[P.la], pts[P.ra]).x) / T;
    st.t = t; st.pts = pts;
    return { pts, T, seen, now, straight, bent, el, er, off };
  }

  function draw(ctx, f, W, H) {
    ctx.clearRect(0, 0, W, H);
    if (!f) return;
    const u = W / 420, p = f.pts;
    // hand paths over the last moment
    for (const k of ['lw', 'rw']) { const tr = f.trail?.[k] || []; if (tr.length < 2) continue;
      ctx.strokeStyle = 'rgba(221,242,106,.55)'; ctx.lineWidth = 3 * u; ctx.lineCap = 'round'; ctx.beginPath(); tr.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke(); }
    ctx.lineWidth = 3 * u; ctx.strokeStyle = 'rgba(255,255,255,.9)';
    BONES.forEach(([a, b]) => { if (p[a].v < .3 || p[b].v < .3) return; ctx.beginPath(); ctx.moveTo(p[a].x, p[a].y); ctx.lineTo(p[b].x, p[b].y); ctx.stroke(); });
    // elbows: lime when straight, white ring when bent
    [[P.le, f.el], [P.re, f.er]].forEach(([i, a]) => { ctx.beginPath(); ctx.arc(p[i].x, p[i].y, 5 * u, 0, 7); ctx.fillStyle = a > 145 ? '#DDF26A' : '#FF8A65'; ctx.fill();
      // the angle, right where it's measured
      const x = p[i].x + 9 * u, y = p[i].y - 7 * u, s = `${Math.round(a)}°`; ctx.font = `600 ${15 * u}px sans-serif`; const w = ctx.measureText(s).width;
      ctx.fillStyle = 'rgba(17,17,17,.75)'; ctx.fillRect(x - 3 * u, y - 14 * u, w + 6 * u, 18 * u); ctx.fillStyle = '#FFFFFF'; ctx.fillText(s, x, y); });
    [P.ls, P.rs, P.lh, P.rh, P.lk, P.rk].forEach(i => { if (p[i].v < .3) return; ctx.beginPath(); ctx.arc(p[i].x, p[i].y, 3.5 * u, 0, 7); ctx.fillStyle = '#FFFFFF'; ctx.fill(); });
    // the hand or foot that is moving now
    LIMBS.forEach(([k, name]) => { const q = p[P[k]]; if (q.v < .3) return; const on = name === f.now;
      ctx.beginPath(); ctx.arc(q.x, q.y, (on ? 10 : 5) * u, 0, 7); ctx.fillStyle = on ? '#DDF26A' : 'rgba(255,255,255,.85)'; ctx.fill();
      if (on) { ctx.lineWidth = 2 * u; ctx.strokeStyle = '#111111'; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3 * u; } });
    // hip over feet: a plumb line from the hips
    const hm = mid(p[P.lh], p[P.rh]), am = mid(p[P.la], p[P.ra]);
    ctx.setLineDash([4 * u, 5 * u]); ctx.lineWidth = 1.5 * u; ctx.strokeStyle = Math.abs(f.off) < .35 ? 'rgba(221,242,106,.9)' : 'rgba(255,138,101,.9)';
    ctx.beginPath(); ctx.moveTo(hm.x, hm.y); ctx.lineTo(hm.x, am.y); ctx.stroke(); ctx.setLineDash([]);
  }

  // what we keep from one frame, as fractions of the picture
  const pack = (g, t, W, H) => g && g.seen ? { t, now: g.now, el: Math.round(g.el), er: Math.round(g.er), off: R3(g.off), p: IDX.map(i => [R3(g.pts[i].x / W), R3(g.pts[i].y / H), R3(g.pts[i].v)]) } : { t, now: null };
  const unpack = (s, W, H) => { const a = []; IDX.forEach((i, j) => { a[i] = { x: s.p[j][0] * W, y: s.p[j][1] * H, v: s.p[j][2] }; }); return a; };

  // one straight arm is enough to hang from, and a hidden elbow can read as 0°, so the straighter arm is the one that counts
  const arm = s => Math.max(s.el, s.er);
  // the moves and rests of the whole video, and the numbers we show from them
  // A hand or foot on a hold stays put, so a move is a limb stopping somewhere new. Checked against a coach's labels
  // (The Way Up, 22 videos, tuned on 12 and scored on the other 10). A hand that stops below the hips isn't on a hold.
  const STOP = { hand: { hold: .3, rad: .3, reach: .35, up: .3 }, foot: { hold: .2, rad: .15, reach: .5 } };
  const midOf = l => { const a = [...l].sort((x, y) => x - y), n = a.length; return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2; };
  function placements(S, W, H) {
    const seen = S.filter(s => s.p); if (!seen.length) return [];
    const at = (s, i) => { const j = IDX.indexOf(i); return { x: s.p[j][0] * W, y: s.p[j][1] * H }; };
    const hipY = s => (at(s, P.lh).y + at(s, P.rh).y) / 2;
    const torso = midOf(seen.map(s => Math.abs((at(s, P.ls).y + at(s, P.rs).y) / 2 - hipY(s)))) || 1;
    // most limbs are on holds at any moment, so the middle change between samples is the phone moving
    const path = Object.fromEntries(LIMBS.map(([k]) => [k, []]));
    let ox = 0, oy = 0, prev = null;
    seen.forEach(s => {
      const cur = LIMBS.map(([k]) => at(s, P[k]));
      if (prev) { ox += midOf(cur.map((c, i) => c.x - prev[i].x)); oy += midOf(cur.map((c, i) => c.y - prev[i].y)); }
      prev = cur;
      LIMBS.forEach(([k], i) => path[k].push({ t: s.t, x: (cur[i].x - ox) / torso, y: (cur[i].y - oy) / torso, hip: (hipY(s) - oy) / torso }));
    });
    const moves = [];
    LIMBS.forEach(([k, name]) => {
      const c = k[1] === 'w' ? STOP.hand : STOP.foot, q = path[k]; let i = 0, last = null, left = null;
      while (i < q.length) {
        let j = i; while (j + 1 < q.length && Math.hypot(q[j + 1].x - q[i].x, q[j + 1].y - q[i].y) <= c.rad) j++;
        if (q[j].t - q[i].t < c.hold) { i++; continue; }
        const part = q.slice(i, j + 1), x = midOf(part.map(a => a.x)), y = midOf(part.map(a => a.y));
        if (!(c.up !== undefined && y > midOf(part.map(a => a.hip)) - c.up)) {
          if (last && Math.hypot(x - last.x, y - last.y) >= c.reach) moves.push({ k, name, t0: Math.max(left, q[i].t - 1.5), t: q[i].t });
          last = { x, y }; left = q[j].t;
        }
        i = j + 1;
      }
    });
    return moves.sort((a, b) => a.t - b.t);
  }

  // A small network reads the tracked body over time and marks when each hand or foot lands on a hold. Trained on a coach's
  // labels (The Way Up, CC BY 4.0, 22 videos). The rule above is the fallback if model/moves.json can't be read.
  let net = null;
  const floats = b => { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return new Float32Array(u.buffer); };
  async function loadNet() {
    if (net !== null) return net;
    try { const r = await fetch('model/moves.json'); if (!r.ok) throw 0; const j = await r.json();
      j.nets = j.nets.map(m => ({ a: m.a.map(floats), o: m.o.map(floats), b: m.b.map(l => l.map(floats)) })); net = j;
    } catch { net = false; }
    return net;
  }
  function features(S, W, H) {
    const n = S.length, xy = new Float32Array(n * 26), vis = new Float32Array(n * 13), seen = new Float32Array(n);
    S.forEach((s, i) => {
      if (s.p) { seen[i] = 1; s.p.forEach((q, j) => { xy[i * 26 + j * 2] = q[0] * W; xy[i * 26 + j * 2 + 1] = q[1] * H; vis[i * 13 + j] = q[2]; }); }
      else if (i) for (let j = 0; j < 26; j++) xy[i * 26 + j] = xy[(i - 1) * 26 + j];
    });
    const gaps = []; for (let i = 0; i < n; i++) if (seen[i]) gaps.push(Math.abs((xy[i * 26 + 3] + xy[i * 26 + 5]) / 2 - (xy[i * 26 + 15] + xy[i * 26 + 17]) / 2));
    const torso = midOf(gaps) || 1, LIMB = [5, 6, 11, 12], C = 56, x = new Float32Array(C * n), sp = new Float32Array(n * 4);
    const put = (c, i, v) => { x[c * n + i] = Math.max(-5, Math.min(5, v)); };
    for (let i = 0; i < n; i++) {
      const cx = (xy[i * 26 + 14] + xy[i * 26 + 16]) / 2, cy = (xy[i * 26 + 15] + xy[i * 26 + 17]) / 2;
      for (let j = 0; j < 13; j++) { put(j * 2, i, (xy[i * 26 + j * 2] - cx) / torso); put(j * 2 + 1, i, (xy[i * 26 + j * 2 + 1] - cy) / torso); put(26 + j, i, vis[i * 13 + j]); }
      const dv = a => LIMB.map(l => i ? xy[i * 26 + l * 2 + a] - xy[(i - 1) * 26 + l * 2 + a] : 0), dx = dv(0), dy = dv(1), mx = midOf(dx), my = midOf(dy);
      LIMB.forEach((_, j) => { const vx = (dx[j] - mx) / torso, vy = (dy[j] - my) / torso; put(39 + j * 2, i, vx); put(40 + j * 2, i, vy); sp[i * 4 + j] = Math.hypot(vx, vy); });
      put(55, i, seen[i]);
    }
    for (let j = 0; j < 4; j++) for (let i = 0; i < n; i++) {
      let back = 0, ahead = 0;
      for (let d = 0; d < 5; d++) { if (i - d >= 0) back += sp[(i - d) * 4 + j]; if (i + d < n) ahead += sp[(i + d) * 4 + j]; }
      put(47 + j, i, back); put(51 + j, i, ahead);
    }
    return x;
  }
  function conv(x, inC, outC, T, W, B, k, d) {
    const y = new Float32Array(outC * T), mid = (k - 1) / 2;
    for (let o = 0; o < outC; o++) { const oo = o * T;
      for (let c = 0; c < inC; c++) { const cc = c * T;
        for (let j = 0; j < k; j++) { const w = W[(o * inC + c) * k + j], sh = (j - mid) * d, a = Math.max(0, -sh), b = Math.min(T, T - sh);
          for (let t = a; t < b; t++) y[oo + t] += w * x[cc + t + sh]; } }
      for (let t = 0; t < T; t++) y[oo + t] += B[o]; }
    return y;
  }
  function forward(m, N, x, T) {
    let h = conv(x, N.c, N.w, T, m.a[0], m.a[1], 1, 1);
    m.b.forEach(([W, B, sc, sh, mean, vr], l) => {
      const y = conv(h, N.w, N.w, T, W, B, N.k, N.dil[l]), r = new Float32Array(N.w * T);
      for (let c = 0; c < N.w; c++) { const g = sc[c] / Math.sqrt(vr[c] + 1e-5); for (let t = 0; t < T; t++) { const i = c * T + t; r[i] = h[i] + Math.max(0, (y[i] - mean[c]) * g + sh[c]); } }
      h = r;
    });
    return conv(h, N.w, 4, T, m.o[0], m.o[1], 1, 1);
  }
  function netChance(N, S, W, H) {
    const T = S.length, x = features(S, W, H), q = new Float32Array(4 * T);
    N.nets.forEach(m => { const y = forward(m, N, x, T); for (let i = 0; i < y.length; i++) q[i] += (1 / (1 + Math.exp(-y[i]))) / N.nets.length; });
    return q;
  }
  function netMoves(N, S, W, H) {
    const T = S.length, q = netChance(N, S, W, H), hz = HZ, g = Math.round(.6 * hz), moves = [];
    LIMBS.forEach(([k, name], j) => { let prev = -9;
      for (let i = 1; i < T - 1; i++) { const v = q[j * T + i]; if (v < N.thr) continue;
        let top = 0; for (let a = Math.max(0, i - g); a <= Math.min(T - 1, i + g); a++) top = Math.max(top, q[j * T + a]);
        if (v === top) { const t = i / hz; moves.push({ k, name, t0: Math.max(0, prev, t - 1), t }); prev = t; } } });
    return moves.sort((a, b) => a.t - b.t);
  }
  const findMoves = async (S, W, H) => { const N = await loadNet(); return N ? netMoves(N, S, W, H) : placements(S, W, H); };

  function results(S, moves, D, W, H) {
    const seen = S.filter(s => s.p), a = moves[0]?.t0 ?? 0, b = moves[moves.length - 1]?.t ?? D, on = seen.filter(s => s.t >= a && s.t <= b), rests = [];
    let from = null;
    const close = t => { if (from !== null && t - from >= 1.2) { const m = on.filter(s => s.t >= from && s.t < t);
      if (m.length) rests.push({ t0: from, t1: t, bent: Math.round(m.reduce((n, s) => n + arm(s), 0) / m.length), straight: m.filter(s => arm(s) > 145).length / m.length }); } from = null; };
    on.forEach(s => { const moving = s.now || moves.some(m => s.t >= m.t0 && s.t <= m.t); if (moving) close(s.t); else if (from === null) from = s.t; });
    close(b);
    const inRest = on.filter(s => rests.some(r => s.t >= r.t0 && s.t < r.t1)), sum = rests.reduce((n, r) => n + r.t1 - r.t0, 0) || 1;
    const longest = [...rests].sort((x, y) => y.t1 - y.t0 - x.t1 + x.t0)[0], low = [...(inRest.length ? inRest : on)].sort((x, y) => arm(x) - arm(y))[0], far = [...on].sort((x, y) => Math.abs(y.off) - Math.abs(x.off))[0];
    const stats = { moves: moves.length, hands: moves.filter(m => m.k === 'lw' || m.k === 'rw').length, feet: moves.filter(m => m.k === 'la' || m.k === 'ra').length, first: a,
      longest: longest ? { t: longest.t0, s: longest.t1 - longest.t0 } : null, low: low ? { t: low.t, a: arm(low) } : null, far: far ? { t: far.t, left: far.off < 0 } : null,
      restStraight: Math.round(rests.reduce((n, r) => n + (r.t1 - r.t0) * r.straight, 0) / sum * 100),
      armsStraight: Math.round(on.filter(s => arm(s) > 145).length / (on.length || 1) * 100), hipsOver: Math.round(on.filter(s => Math.abs(s.off) < .35).length / (on.length || 1) * 100),
      moving: Math.round((1 - rests.reduce((n, r) => n + r.t1 - r.t0, 0) / ((b - a) || 1)) * 100), seen: Math.round(seen.length / (S.length || 1) * 100) };
    const s0 = seen[0], at = i => s0 && { x: s0.p[IDX.indexOf(i)][0], y: s0.p[IDX.indexOf(i)][1] };
    return { hz: HZ, D, W, H, S, moves, rests, stats, first: s0 ? { head: at(0), lh: at(P.lw), rh: at(P.rw), lf: at(P.la), rf: at(P.ra), t: s0.t } : null };
  }

  const seekTo = (v, t) => new Promise(r => { if (Math.abs(v.currentTime - t) < .001 && v.readyState >= 2) return r(); const to = setTimeout(r, 3000); v.addEventListener('seeked', () => { clearTimeout(to); r(); }, { once: true }); v.currentTime = t; });
  async function scan(src, seed, onP) {
    await load();
    const v = document.createElement('video');
    Object.assign(v, { muted: true, playsInline: true, preload: 'auto', src });
    v.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none';   // on the page, or phones won't decode it
    document.body.appendChild(v);
    try {
      await new Promise((ok, no) => { v.addEventListener('loadeddata', ok, { once: true }); v.addEventListener('error', no, { once: true }); });
      const W = v.videoWidth, H = v.videoHeight, D = v.duration, n = Math.floor(D * HZ), st = { ...fresh(), seed: seed || undefined }, S = [];
      for (let i = 0; i < n; i++) {
        const t = i / HZ; await seekTo(v, t);
        let g = null; try { g = step(st, lm.detectForVideo(v, performance.now()), t, W, H); } catch { g = null; }
        S.push(pack(g, t, W, H));
        const cv = onP?.((i + 1) / n);
        if (cv && i % 3 === 0) { if (cv.width !== W) { cv.width = W; cv.height = H; } const ctx = cv.getContext('2d'); ctx.clearRect(0, 0, W, H); ctx.drawImage(v, 0, 0, W, H); draw(ctx, g && g.seen ? g : null, W, H); ctx.globalCompositeOperation = 'source-over'; }
      }
      return results(S, await findMoves(S, W, H), D, W, H);
    } finally { v.remove(); }
  }
  // one video at a time, and a video once: going back to it doesn't scan it again
  const KEEP = 'chalk.track.v3.', seenBefore = {};
  const kept = async src => { if (seenBefore[src]) return seenBefore[src];
    try { const k = JSON.parse(localStorage.getItem(KEEP + src)); if (k) return k; } catch {}
    // the sample videos ship with their scan (the same scan, run once ahead), so nobody waits a minute in a demo
    try { const r = await fetch(src.replace('.mp4', '.track.json')); if (r.ok) return seenBefore[src] = await r.json(); } catch {}
    return null; };
  window.__scan = src => scan(src); window.__results = T => results(T.S, T.moves, T.D, T.W, T.H); window.__moves = T => findMoves(T.S, T.W, T.H); window.__chance = async T => Array.from(netChance(await loadNet(), T.S, T.W, T.H));   // to bake the sample videos again
  let queue = Promise.resolve();
  window.poseScan = async (src, seed, onP) => {
    if (!seed) { const k = await kept(src); if (k) return k; }
    const run = queue.then(() => scan(src, seed, onP));
    queue = run.catch(() => {});
    return run.then(r => { if (!seed) { seenBefore[src] = r; try { localStorage.setItem(KEEP + src, JSON.stringify(r)); } catch {} } return r; });
  };

  // what the track says about the moment the video is at, on the video and under it. Stops by itself when the page changes
  // one moment as a picture: the frame, cropped to the climber, with what the conclusion is about drawn on it
  const stills = {}; let still = null, line = Promise.resolve();
  const onEvent = (el, name, ms) => new Promise((ok, no) => { const t = setTimeout(() => no(new Error(name)), ms); el.addEventListener(name, () => { clearTimeout(t); ok(); }, { once: true }); });
  async function grab(src, T, s, mark, tone) {
    if (!still) { still = document.createElement('video'); still.muted = true; still.playsInline = true; still.preload = 'auto'; }
    if (still.getAttribute('src') !== src) { still.setAttribute('src', src); await onEvent(still, 'loadeddata', 8000); }
    const seek = onEvent(still, 'seeked', 5000); still.currentTime = s.t + .001; await seek;
    const q = unpack(s, T.W, T.H), pts = q.filter(Boolean), xs = pts.map(a => a.x), ys = pts.map(a => a.y), RATIO = 170 / 207;
    let h = (Math.max(...ys) - Math.min(...ys)) * 1.3, w = h * RATIO;
    if (w < (Math.max(...xs) - Math.min(...xs)) * 1.25) { w = (Math.max(...xs) - Math.min(...xs)) * 1.25; h = w / RATIO; }
    if (h > T.H) { h = T.H; w = h * RATIO; } if (w > T.W) { w = T.W; h = w / RATIO; }
    const clamp = (a, lo, hi) => Math.max(lo, Math.min(hi, a));
    const x0 = clamp((Math.min(...xs) + Math.max(...xs) - w) / 2, 0, T.W - w), y0 = clamp((Math.min(...ys) + Math.max(...ys) - h) / 2, 0, T.H - h);
    const cv = document.createElement('canvas'); cv.width = 340; cv.height = 414;
    const ctx = cv.getContext('2d'), sc = cv.width / w, px = a => a / sc, col = tone === 'good' ? '#DDF26A' : '#FF8A65';
    ctx.setTransform(sc, 0, 0, sc, -x0 * sc, -y0 * sc); ctx.drawImage(still, 0, 0, T.W, T.H); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = px(3);
    BONES.forEach(([a, b]) => { if (q[a].v < .3 || q[b].v < .3) return; ctx.beginPath(); ctx.moveTo(q[a].x, q[a].y); ctx.lineTo(q[b].x, q[b].y); ctx.stroke(); });
    const dot = (o, r, c) => { ctx.beginPath(); ctx.arc(o.x, o.y, px(r), 0, 7); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = px(2.5); ctx.strokeStyle = '#111111'; ctx.stroke(); };
    if (mark === 'hip') { const hm = mid(q[P.lh], q[P.rh]), am = mid(q[P.la], q[P.ra]);
      ctx.strokeStyle = col; ctx.lineWidth = px(5); ctx.beginPath(); ctx.moveTo(hm.x, hm.y); ctx.lineTo(hm.x, am.y); ctx.lineTo(am.x, am.y); ctx.stroke(); dot(hm, 11, col); dot(am, 8, '#FFFFFF'); }
    else if (mark === 'arm') { const o = s.el >= s.er ? q[P.le] : q[P.re], a = `${Math.max(s.el, s.er)}°`; dot(o, 11, col);
      ctx.font = `600 ${px(26)}px sans-serif`; const tw = ctx.measureText(a).width, lx = clamp(o.x + px(16), x0 + px(6), x0 + w - tw - px(16)), ly = clamp(o.y - px(10), y0 + px(34), y0 + h - px(10));
      ctx.fillStyle = 'rgba(17,17,17,.8)'; ctx.fillRect(lx - px(6), ly - px(26), tw + px(12), px(34)); ctx.fillStyle = '#FFFFFF'; ctx.fillText(a, lx, ly); }
    else if (P[mark]) dot(q[P[mark]], 13, col);
    return cv.toDataURL('image/jpeg', .85);
  }
  window.poseStill = (src, T, s, mark, tone) => {
    const key = [src, s.t, mark, tone].join('|');
    if (stills[key]) return Promise.resolve(stills[key]);
    return line = line.then(() => grab(src, T, s, mark, tone)).then(u => stills[key] = u).catch(() => null);
  };
  window.posePlay = (v, cv, T) => {
    const ctx = cv.getContext('2d'); cv.width = T.W; cv.height = T.H;
    let last = -1;
    const paint = t => {
      const i = Math.min(T.S.length - 1, Math.floor(t * T.hz)), a = T.S[i], b = T.S[i + 1] || a, u = t * T.hz - i;
      let f = null;
      if (a.p) { const q = unpack(a, T.W, T.H), w = b.p ? unpack(b, T.W, T.H) : q, pts = [];
        q.forEach((p, k) => { if (p) pts[k] = { x: p.x + (w[k].x - p.x) * u, y: p.y + (w[k].y - p.y) * u, v: p.v }; });
        const trail = { lw: [], rw: [] };
        for (let k = Math.max(0, i - 4); k <= i; k++) if (T.S[k].p) { const o = unpack(T.S[k], T.W, T.H); trail.lw.push(o[P.lw]); trail.rw.push(o[P.rw]); }
        f = { pts, now: a.now || T.moves.find(m => t >= m.t0 && t <= m.t)?.name || null, el: a.el, er: a.er, off: a.off, trail }; }
      draw(ctx, f, T.W, T.H);
      const rest = T.rests.find(r => t >= r.t0 && t < r.t1), bent = f ? arm(f) : 0, straight = bent > 145;
      set('tl-time', `${clock(t)} / ${clock(T.D)}`);
      set('tl-now', !f ? 'Can’t see you here' : f.now ? `${f.now} moving` : rest ? `Resting · ${(t - rest.t0).toFixed(1)} s` : 'Between moves');
      set('tl-moves', `${T.moves.filter(m => m.t <= t).length} of ${T.moves.length}`);
      set('tl-arms', !f ? '—' : straight ? `Straight · ${bent}°` : `Bent · ${bent}°`);
      set('tl-hips', !f ? '—' : Math.abs(f.off) < .35 ? 'Over your feet' : f.off < 0 ? 'Out to the left' : 'Out to the right');
      set('tl-tip', !f ? 'Film from further back, phone on the floor, so your whole body stays in frame.' : f.now ? (f.now.includes('foot') ? 'Feet first: good. Stand up on it before the next reach.' : 'Reaching. Push with your legs as the hand goes.')
        : !straight ? 'Resting on bent arms tires you fast. Let your arms go straight and hang.'
        : Math.abs(f.off) >= .35 ? 'Bring your hips over your feet so your legs hold your weight.' : 'Good rest: arms straight, hips over your feet.');
      const ph = document.getElementById('tlp'); if (ph) ph.style.left = `${Math.min(100, t / T.D * 100)}%`;
    };
    const tick = () => { if (!v.isConnected) return; if (v.currentTime !== last) { last = v.currentTime; paint(last); } requestAnimationFrame(tick); };
    paint(v.currentTime); requestAnimationFrame(tick);
  };
})();

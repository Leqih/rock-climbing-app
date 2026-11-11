/* Spotter · movement analysis of a video of a climb.
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

  const HZ = 5, IDX = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 17, 18, 19, 20, 21, 22, 29, 30, 31, 32], R3 = n => Math.round(n * 1000) / 1000;   // how often a video is sampled, and which points we keep
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

  function draw(ctx, f, W, H, mark) {
    ctx.clearRect(0, 0, W, H);
    if (!f) return;
    const u = W / 420, p = f.pts;
    // hand paths over the last moment
    for (const k of ['lw', 'rw']) { const tr = f.trail?.[k] || []; if (tr.length < 2) continue;
      ctx.strokeStyle = 'rgba(221,242,106,.55)'; ctx.lineWidth = 3 * u; ctx.lineCap = 'round'; ctx.beginPath(); tr.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke(); }
    ctx.lineWidth = 3 * u; ctx.strokeStyle = 'rgba(255,255,255,.9)';
    BONES.forEach(([a, b]) => { if (p[a].v < .3 || p[b].v < .3) return; ctx.beginPath(); ctx.moveTo(p[a].x, p[a].y); ctx.lineTo(p[b].x, p[b].y); ctx.stroke(); });
    // elbows: lime when straight, white ring when bent
    [[P.le, f.el], [P.re, f.er]].forEach(([i, a]) => { if (a == null) return; ctx.beginPath(); ctx.arc(p[i].x, p[i].y, 5 * u, 0, 7); ctx.fillStyle = a > 145 ? '#DDF26A' : '#FF8A65'; ctx.fill();
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
    if (mark === 'hip') {   // watching a stretch about the hips: how far they are from the middle of the feet
      const c = Math.abs(f.off) < .35 ? '#DDF26A' : '#FF8A65', dot = (o, r, fill) => { ctx.beginPath(); ctx.arc(o.x, o.y, r * u, 0, 7); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2 * u; ctx.strokeStyle = '#111111'; ctx.stroke(); };
      ctx.lineWidth = 4 * u; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(hm.x, hm.y); ctx.lineTo(hm.x, am.y); ctx.lineTo(am.x, am.y); ctx.stroke(); dot(hm, 9, c); dot(am, 7, '#FFFFFF'); }
  }

  // what we keep from one frame, as fractions of the picture
  const pack = (g, t, W, H) => g && g.seen ? { t, now: g.now, el: Math.round(g.el), er: Math.round(g.er), off: R3(g.off), p: IDX.map(i => [R3(g.pts[i].x / W), R3(g.pts[i].y / H), R3(g.pts[i].v)]) } : { t, now: null };
  const unpack = (s, W, H) => { const a = []; IDX.forEach((i, j) => { a[i] = { x: s.p[j][0] * W, y: s.p[j][1] * H, v: s.p[j][2] }; }); return a; };

  // one straight arm is enough to hang from, and a hidden elbow can read as 0°, so the straighter arm is the one that counts
  const arm = s => { const r = [s.el, s.er].filter(a => a != null); return r.length ? Math.max(...r) : null; };
  // an angle only means something if shoulder, elbow and wrist are really seen and both parts of the arm are long enough on screen.
  // On a far-off climber the wrist is a guess and the arm a few pixels, which reads as 9°. Those samples have no angle at all
  const ARM_V = .3, ARM_LEN = .3;
  const readArms = (s, W, H) => { const q = s.p.map(([x, y, v]) => ({ x: x * W, y: y * H, v })), body = (dist(q[1], q[7]) + dist(q[2], q[8])) / 2 || 1;
    const ok = (a, b, c) => Math.min(q[a].v, q[b].v, q[c].v) >= ARM_V && dist(q[a], q[b]) / body >= ARM_LEN && dist(q[b], q[c]) / body >= ARM_LEN;
    if (!ok(1, 3, 5)) s.el = null; if (!ok(2, 4, 6)) s.er = null; };
  // the moves and rests of the whole video, and the numbers we show from them
  const midOf = l => { const a = [...l].sort((x, y) => x - y), n = a.length; return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2; };

  // The wall doesn't move, so anything that moves all of it is the phone. Between two samples we follow patches of wall (never the
  // climber) and keep how this picture sits on the first one, so limbs can be read in wall positions, whatever the phone did.
  const WALLW = 200; let wc = null;
  function grey(v, W, H) {
    const w = WALLW, h = Math.round(H * w / W);
    if (!wc) wc = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (wc.canvas.width !== w || wc.canvas.height !== h) { wc.canvas.width = w; wc.canvas.height = h; }
    wc.drawImage(v, 0, 0, w, h); const d = wc.getImageData(0, 0, w, h).data, g = new Uint8Array(w * h);
    for (let i = 0; i < g.length; i++) g[i] = (d[i * 4] * 77 + d[i * 4 + 1] * 150 + d[i * 4 + 2] * 29) >> 8;
    return { g, w, h };
  }
  const quarter = ({ g, w, h }) => { const W4 = w >> 2, H4 = h >> 2, q = new Uint8Array(W4 * H4); for (let y = 0; y < H4; y++) for (let x = 0; x < W4; x++) { let s = 0; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) s += g[(y * 4 + j) * w + x * 4 + i]; q[y * W4 + x] = s >> 4; } return { g: q, w: W4, h: H4 }; };
  const outOfBox = (x, y, B) => B.every(b => x < b[0] || x > b[2] || y < b[1] || y > b[3]);
  function wallStep(A, C, boxes) {   // how picture C sits on picture A: [cos·scale, sin·scale, x, y]
    const { w, h } = A, r = 4, qa = quarter(A), qc = quarter(C), S = 12, bx = boxes.map(b => b.map(v => v / 4));
    let gx = 0, gy = 0, best = Infinity;
    for (let dy = -S; dy <= S; dy++) for (let dx = -S; dx <= S; dx++) { let sad = 0, n = 0;
      for (let y = Math.max(0, -dy); y < Math.min(qa.h, qa.h - dy); y += 2) for (let x = Math.max(0, -dx); x < Math.min(qa.w, qa.w - dx); x += 2) { if (!outOfBox(x, y, bx)) continue; sad += Math.abs(qa.g[y * qa.w + x] - qc.g[(y + dy) * qa.w + x + dx]); n++; }
      if (n > 60 && sad / n + (Math.abs(dx) + Math.abs(dy)) * .001 < best) { best = sad / n + (Math.abs(dx) + Math.abs(dy)) * .001; gx = dx * 4; gy = dy * 4; } }
    const cand = [];
    for (let y = r + 8; y < h - r - 8; y += 8) for (let x = r + 8; x < w - r - 8; x += 8) { if (!outOfBox(x, y, boxes)) continue;
      let xx = 0, yy = 0, xy = 0;
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const o = (y + j) * w + x + i, ix = A.g[o + 1] - A.g[o - 1], iy = A.g[o + w] - A.g[o - w]; xx += ix * ix; yy += iy * iy; xy += ix * iy; }
      const e = (xx + yy) / 2 - Math.sqrt(((xx - yy) / 2) ** 2 + xy * xy); if (e > 2000) cand.push([e, x, y]); }
    cand.sort((a, b) => b[0] - a[0]);
    const pts = [], R_ = 5;
    for (const [, x, y] of cand.slice(0, 120)) { const sad = {}; let b = Infinity, bu = 0, bv = 0;
      for (let v = -R_; v <= R_; v++) for (let u = -R_; u <= R_; u++) { const cx = x + gx + u, cy = y + gy + v; if (cx < r || cy < r || cx >= w - r || cy >= h - r) continue; let s = 0;
        for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) s += Math.abs(A.g[(y + j) * w + x + i] - C.g[(cy + j) * w + cx + i]);
        sad[`${u},${v}`] = s; if (s < b) { b = s; bu = u; bv = v; } }
      if (b === Infinity || Math.abs(bu) === R_ || Math.abs(bv) === R_) continue;
      const sub = (l, m, n) => (l === undefined || n === undefined) ? 0 : (l + n - 2 * m > 0 ? (l - n) / (2 * (l + n - 2 * m)) : 0);
      pts.push([x + gx + bu + sub(sad[`${bu - 1},${bv}`], b, sad[`${bu + 1},${bv}`]), y + gy + bv + sub(sad[`${bu},${bv - 1}`], b, sad[`${bu},${bv + 1}`]), x, y]); }
    if (pts.length < 12) return [1, 0, -gx, -gy];
    let seed = 7, bestIn = []; const rnd = n => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n;
    const fit = l => { let mx = 0, my = 0, nx = 0, ny = 0; l.forEach(q => { mx += q[0]; my += q[1]; nx += q[2]; ny += q[3]; }); const c = l.length; mx /= c; my /= c; nx /= c; ny /= c;
      let d = 0, a = 0, b = 0; l.forEach(q => { const x = q[0] - mx, y = q[1] - my, u = q[2] - nx, v = q[3] - ny; d += x * x + y * y; a += x * u + y * v; b += x * v - y * u; });
      if (d < 1e-6) return [1, 0, nx - mx, ny - my]; a /= d; b /= d; return [a, b, nx - a * mx + b * my, ny - b * mx - a * my]; };
    for (let it = 0; it < 80; it++) { const i = rnd(pts.length), j = rnd(pts.length); if (i === j) continue;
      const M = fit([pts[i], pts[j]]); if (Math.abs(Math.hypot(M[0], M[1]) - 1) > .1) continue;
      const inl = pts.filter(q => Math.hypot(M[0] * q[0] - M[1] * q[1] + M[2] - q[2], M[1] * q[0] + M[0] * q[1] + M[3] - q[3]) < 1.5); if (inl.length > bestIn.length) bestIn = inl; }
    return bestIn.length >= 10 ? fit(bestIn) : [1, 0, -gx, -gy];
  }
  const chain = (m, s) => [m[0] * s[0] - m[1] * s[1], m[1] * s[0] + m[0] * s[1], m[0] * s[2] - m[1] * s[3] + m[2], m[1] * s[2] + m[0] * s[3] + m[3]];
  const poseBox = (s, w, h) => { if (!s?.p) return null; const xs = s.p.map(q => q[0] * w), ys = s.p.map(q => q[1] * h), pad = .08 * h; return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad]; };

  // A hand or foot on a hold stays put, so a landing is a fingertip or toe stopping somewhere new on the wall. Settled on The Way Up.
  const STOP = { w: { hold: .3, rad: .3, reach: .35 }, a: { hold: .2, rad: .15, reach: .5 } }, TIP = { lw: 15, rw: 16, la: 21, ra: 22 };   // places in s.p
  function stops(S, W, H) {
    const seen = S.filter(s => s.p); if (!seen.length) return [];
    const torso = midOf(seen.map(s => Math.abs((s.p[1][1] + s.p[2][1]) / 2 - (s.p[7][1] + s.p[8][1]) / 2) * H)) || 1, out = [];
    LIMBS.forEach(([k], l) => { const c = STOP[k[1]], q = seen.map(s => { const x = s.p[TIP[k]][0] * W, y = s.p[TIP[k]][1] * H, m = s.w || [1, 0, 0, 0]; return { t: s.t, x: m[0] * x - m[1] * y + m[2], y: m[1] * x + m[0] * y + m[3] }; });
      let i = 0, last = null;
      while (i < q.length) { let e = i; while (e + 1 < q.length && Math.hypot(q[e + 1].x - q[i].x, q[e + 1].y - q[i].y) <= c.rad * torso) e++;
        if (q[e].t - q[i].t >= c.hold) { const part = q.slice(i, e + 1), x = midOf(part.map(a => a.x)), y = midOf(part.map(a => a.y));
          if (!last || Math.hypot(x - last.x, y - last.y) >= c.reach * torso) { if (last) out.push([l, q[i].t]); last = { x, y }; }
          i = e + 1; } else i++; } });
    return out;
  }
  const asMoves = ev => { const last = {}; return [...ev].sort((a, b) => a[1] - b[1]).map(([l, t]) => { const [k, name] = LIMBS[l], m = { k, name, t0: Math.max(0, last[l] ?? 0, t - 1), t }; last[l] = t; return m; }); };

  // A small network reads the tracked body over time and marks when each hand or foot lands on a hold. Trained on a coach's
  // labels (The Way Up, CC BY 4.0, 22 videos). The stops above propose, the network decides. If model/moves.json can't be read, the stops stand alone.
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
    const NP = 23, Q = NP * 2, n = S.length, xy = new Float32Array(n * Q), vis = new Float32Array(n * NP), seen = new Float32Array(n);
    S.forEach((s, i) => {
      if (s.p) { seen[i] = 1; s.p.forEach((q, j) => { xy[i * Q + j * 2] = q[0] * W; xy[i * Q + j * 2 + 1] = q[1] * H; vis[i * NP + j] = q[2]; }); }
      else if (i) for (let j = 0; j < Q; j++) xy[i * Q + j] = xy[(i - 1) * Q + j];
    });
    const gaps = []; for (let i = 0; i < n; i++) if (seen[i]) gaps.push(Math.abs((xy[i * Q + 3] + xy[i * Q + 5]) / 2 - (xy[i * Q + 15] + xy[i * Q + 17]) / 2));
    const torso = midOf(gaps) || 1, LIMB = [5, 6, 11, 12, 15, 16, 21, 22], L = LIMB.length, C = 102, x = new Float32Array(C * n), sp = new Float32Array(n * L);
    const put = (c, i, v) => { x[c * n + i] = Math.max(-5, Math.min(5, v)); };
    for (let i = 0; i < n; i++) {
      const cx = (xy[i * Q + 14] + xy[i * Q + 16]) / 2, cy = (xy[i * Q + 15] + xy[i * Q + 17]) / 2;
      for (let j = 0; j < NP; j++) { put(j * 2, i, (xy[i * Q + j * 2] - cx) / torso); put(j * 2 + 1, i, (xy[i * Q + j * 2 + 1] - cy) / torso); put(Q + j, i, vis[i * NP + j]); }
      const dv = a => LIMB.map(l => i ? xy[i * Q + l * 2 + a] - xy[(i - 1) * Q + l * 2 + a] : 0), dx = dv(0), dy = dv(1), mx = midOf(dx), my = midOf(dy);
      LIMB.forEach((_, j) => { const vx = (dx[j] - mx) / torso, vy = (dy[j] - my) / torso; put(Q + NP + j * 2, i, vx); put(Q + NP + 1 + j * 2, i, vy); sp[i * L + j] = Math.hypot(vx, vy); });
      put(C - 1, i, seen[i]);
    }
    for (let j = 0; j < L; j++) for (let i = 0; i < n; i++) {
      let back = 0, ahead = 0;
      for (let d = 0; d < 5; d++) { if (i - d >= 0) back += sp[(i - d) * L + j]; if (i + d < n) ahead += sp[(i + d) * L + j]; }
      put(Q + NP + L * 2 + j, i, back); put(Q + NP + L * 3 + j, i, ahead);
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
    const T = S.length, q = netChance(N, S, W, H), g = Math.round(.6 * HZ), at = (l, i) => q[l * T + i], ev = [];
    stops(S, W, H).forEach(([l, t]) => { let top = 0; for (let i = Math.max(0, Math.floor((t - .6) * HZ)); i < Math.min(T, Math.floor((t + .6) * HZ) + 1); i++) top = Math.max(top, at(l, i)); if (top >= N.lo) ev.push([l, t]); });
    for (let l = 0; l < 4; l++) for (let i = 1; i < T - 1; i++) { const v = at(l, i); if (v < N.hi) continue;
      let top = 0; for (let a = Math.max(0, i - g); a <= Math.min(T - 1, i + g); a++) top = Math.max(top, at(l, a));
      if (v === top && !ev.some(e => e[0] === l && Math.abs(e[1] - i / HZ) <= 1)) ev.push([l, i / HZ]); }
    const kept = []; ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]).forEach(e => { const p = kept[kept.length - 1]; if (!p || p[0] !== e[0] || e[1] - p[1] > .8) kept.push(e); });
    return asMoves(kept);
  }
  const findMoves = async (S, W, H) => { const N = await loadNet(); return N ? netMoves(N, S, W, H) : asMoves(stops(S, W, H)); };

  function results(S, moves, D, W, H) {
    S.forEach(s => { if (s.p) readArms(s, W, H); });
    const seen = S.filter(s => s.p), a = moves[0]?.t0 ?? 0, b = moves[moves.length - 1]?.t ?? D, on = seen.filter(s => s.t >= a && s.t <= b), rests = [];
    let from = null;
    const close = t => { if (from !== null && t - from >= 1.2) { const m = on.filter(s => s.t >= from && s.t < t);
      const k = m.filter(s => arm(s) != null); if (m.length) rests.push({ t0: from, t1: t, bent: k.length ? Math.round(k.reduce((n, s) => n + arm(s), 0) / k.length) : null, straight: k.length ? k.filter(s => arm(s) > 145).length / k.length : null, read: k.length / m.length }); } from = null; };
    on.forEach(s => { const moving = s.now || moves.some(m => s.t >= m.t0 && s.t <= m.t); if (moving) close(s.t); else if (from === null) from = s.t; });
    close(b);
    const inRest = on.filter(s => rests.some(r => s.t >= r.t0 && s.t < r.t1)), sum = rests.reduce((n, r) => n + r.t1 - r.t0, 0) || 1;
    const armed = on.filter(s => arm(s) != null), known = rests.reduce((n, r) => n + (r.straight == null ? 0 : r.t1 - r.t0), 0);
    const longest = [...rests].sort((x, y) => y.t1 - y.t0 - x.t1 + x.t0)[0], low = (inRest.length ? inRest : on).filter(s => arm(s) != null).sort((x, y) => arm(x) - arm(y))[0], far = [...on].sort((x, y) => Math.abs(y.off) - Math.abs(x.off))[0];
    const stats = { moves: moves.length, hands: moves.filter(m => m.k === 'lw' || m.k === 'rw').length, feet: moves.filter(m => m.k === 'la' || m.k === 'ra').length, first: a,
      longest: longest ? { t: longest.t0, s: longest.t1 - longest.t0 } : null, low: low ? { t: low.t, a: arm(low) } : null, far: far ? { t: far.t, left: far.off < 0 } : null,
      restStraight: known ? Math.round(rests.reduce((n, r) => n + (r.t1 - r.t0) * (r.straight ?? 0), 0) / known * 100) : null,
      restRead: Math.round(rests.reduce((n, r) => n + (r.t1 - r.t0) * r.read, 0) / sum * 100), armRead: Math.round(armed.length / (on.length || 1) * 100),
      armsStraight: armed.length ? Math.round(armed.filter(s => arm(s) > 145).length / armed.length * 100) : null, hipsOver: Math.round(on.filter(s => Math.abs(s.off) < .35).length / (on.length || 1) * 100),
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
      let was = null, here = [1, 0, 0, 0];
      for (let i = 0; i < n; i++) {
        const t = i / HZ; await seekTo(v, t);
        let g = null; try { g = step(st, lm.detectForVideo(v, performance.now()), t, W, H); } catch { g = null; }
        const s = pack(g, t, W, H), now = grey(v, W, H), k = W / now.w;
        if (was) { const boxes = [poseBox(S[i - 1], now.w, now.h), poseBox(s, now.w, now.h)].filter(Boolean), st = wallStep(was, now, boxes); here = chain(here, [st[0], st[1], st[2] * k, st[3] * k]); }
        was = now; s.w = here.map((a, j) => j < 2 ? Math.round(a * 1e4) / 1e4 : Math.round(a * 10) / 10);
        S.push(s);
        const cv = onP?.((i + 1) / n);
        if (cv && i % 3 === 0) { if (cv.width !== W) { cv.width = W; cv.height = H; } const ctx = cv.getContext('2d'); ctx.clearRect(0, 0, W, H); ctx.drawImage(v, 0, 0, W, H); draw(ctx, g && g.seen ? g : null, W, H); ctx.globalCompositeOperation = 'source-over'; }
      }
      return results(S, await findMoves(S, W, H), D, W, H);
    } finally { v.remove(); }
  }
  // one video at a time, and a video once: going back to it doesn't scan it again
  const KEEP = 'chalk.track.v5.', seenBefore = {};
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
  async function frameAt(src, t) {
    if (!still) { still = document.createElement('video'); still.muted = true; still.playsInline = true; still.preload = 'auto'; }
    if (still.getAttribute('src') !== src) { still.setAttribute('src', src); await onEvent(still, 'loadeddata', 8000); }
    const seek = onEvent(still, 'seeked', 5000); still.currentTime = t + .001; await seek;
  }
  async function grab(src, T, s, mark, tone) {
    await frameAt(src, s.t);
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
    else if (mark === 'arm') { const o = s.er == null || s.el >= s.er ? q[P.le] : q[P.re], a = `${arm(s)}°`; dot(o, 11, col);
      ctx.font = `600 ${px(26)}px sans-serif`; const tw = ctx.measureText(a).width, lx = clamp(o.x + px(16), x0 + px(6), x0 + w - tw - px(16)), ly = clamp(o.y - px(10), y0 + px(34), y0 + h - px(10));
      ctx.fillStyle = 'rgba(17,17,17,.8)'; ctx.fillRect(lx - px(6), ly - px(26), tw + px(12), px(34)); ctx.fillStyle = '#FFFFFF'; ctx.fillText(a, lx, ly); }
    else if (P[mark]) dot(q[P[mark]], 13, col);
    return cv.toDataURL('image/jpeg', .85);
  }
  // the same body, placed better. Limbs keep their length, and hands and feet stay where they are unless the plan moves them, so it is a pose this body could reach
  const SIDES = [[11, 13, 15, [17, 19, 21]], [12, 14, 16, [18, 20, 22]], [23, 25, 27, [29, 31]], [24, 26, 28, [30, 32]]], NEED = [0, 11, 12, 15, 16, 23, 24, 27, 28];
  const hypot = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const onWall = (s, q) => { const m = s.w || [1, 0, 0, 0]; return { x: m[0] * q.x - m[1] * q.y + m[2], y: m[1] * q.x + m[0] * q.y + m[3] }; };
  const onFrame = (s, q) => { const [c, n, x, y] = s.w || [1, 0, 0, 0], X = q.x - x, Y = q.y - y, d = c * c + n * n; return { x: (c * X + n * Y) / d, y: (c * Y - n * X) / d }; };
  const across = (from, to, q) => onFrame(to, onWall(from, q));   // where a point in one picture is in another, by the wall
  function limbLengths(T) {
    const seen = T.S.filter(s => s.p).map(s => unpack(s, T.W, T.H)), long = (a, b) => { const l = seen.filter(q => q[a].v > .5 && q[b].v > .5).map(q => hypot(q[a], q[b])).sort((x, y) => x - y); return l[Math.floor(l.length * .85)] || 1; };
    return SIDES.map(([a, b, c]) => [long(a, b), long(b, c)]);
  }
  function posed(B, L, d, k, ends = {}, soft = {}) {
    const p = B.map(q => q && { ...q }); let ok = true;
    [23, 24].forEach(i => { p[i].x += d.x; p[i].y += d.y; }); [0, 11, 12].forEach(i => { p[i].x += d.x * k; p[i].y += d.y * k; });
    SIDES.forEach(([a, b, c, tips], n) => {
      const f = Math.max(1, hypot(B[a], B[c]) / (L[n][0] + L[n][1])), l1 = L[n][0] * f, l2 = L[n][1] * f, reach = (l1 + l2) * .995, e = { ...(ends[c] || B[c]) };
      let D = Math.hypot(e.x - p[a].x, e.y - p[a].y) || 1; const ux = (e.x - p[a].x) / D, uy = (e.y - p[a].y) / D;
      if (D > reach) { if (soft[c]) { e.x = p[a].x + ux * reach; e.y = p[a].y + uy * reach; } else if (D > reach * 1.02) ok = false; D = reach; }
      const along = (l1 * l1 - l2 * l2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, l1 * l1 - along * along));
      const side = (B[c].x - B[a].x) * (B[b].y - B[a].y) - (B[c].y - B[a].y) * (B[b].x - B[a].x) >= 0 ? 1 : -1;
      p[b].x = p[a].x + ux * along - uy * h * side; p[b].y = p[a].y + uy * along + ux * h * side;
      const dx = e.x - p[c].x, dy = e.y - p[c].y; p[c].x = e.x; p[c].y = e.y; tips.forEach(i => { p[i].x += dx; p[i].y += dy; });
    });
    return { p, ok };
  }
  const furthest = make => { if (make(1).ok) return 1; if (!make(0).ok) return 0; let lo = 0, hi = 1; for (let i = 0; i < 10; i++) { const m = (lo + hi) / 2; if (make(m).ok) lo = m; else hi = m; } return lo; };
  const angleAt = (a, b, c) => { const u = Math.atan2(a.y - b.y, a.x - b.x), v = Math.atan2(c.y - b.y, c.x - b.x), g = Math.abs(u - v) * 180 / Math.PI; return g > 180 ? 360 - g : g; };
  window.posePlan = (T, kind, s, o = {}) => {
    if (!s?.p) return null;
    const B = unpack(s, T.W, T.H); if (NEED.some(i => B[i].v < .3)) return null;
    const L = limbLengths(T), hip = { x: (B[23].x + B[24].x) / 2, y: (B[23].y + B[24].y) / 2 }, torso = midOf(T.S.filter(q => q.p).map(q => Math.abs((q.p[1][1] + q.p[2][1]) / 2 - (q.p[7][1] + q.p[8][1]) / 2) * T.H)) || 1;
    const inside = q => q.x > 0 && q.y > 0 && q.x < T.W && q.y < T.H;
    if (kind === 'hip') {
      const off = (x, a, b) => Math.abs(x - (a.x + b.x) / 2) / torso, before = off(hip.x, B[27], B[28]);
      if (o.back) { const Q = unpack(o.back, T.W, T.H), opts = [[27, 28], [28, 27]].map(([i, j]) => ({ i, to: across(o.back, s, Q[i]), other: B[j] })).filter(c => hypot(c.to, B[c.i]) > .35 * torso && inside(c.to)).map(c => ({ ...c, after: off(hip.x, c.to, c.other) })).filter(c => c.after < .35 && c.after < before).sort((a, b) => a.after - b.after);
        for (const c of opts) { const mid = (c.to.x + c.other.x) / 2, d = { x: (mid - hip.x) * .5, y: 0 }, ends = { [c.i]: c.to }, make = f => posed(B, L, { x: d.x * f, y: 0 }, .5, ends), f = furthest(make);
          if (make(f).ok) return { s, keys: [B, posed(B, L, { x: d.x * f * .4, y: 0 }, .5, ends).p, make(f).p], marks: [{ from: B[c.i], to: c.to }], foot: c.i === 27 ? 'Left' : 'Right' }; } }
      const mid = (B[27].x + B[28].x) / 2, side = hip.x > mid ? 1 : -1, d = { x: mid + side * .2 * torso - hip.x, y: 0 }, spine = q => hypot({ x: (q[11].x + q[12].x) / 2, y: (q[11].y + q[12].y) / 2 }, { x: (q[23].x + q[24].x) / 2, y: (q[23].y + q[24].y) / 2 });
      for (const k of [.55, .8, 1]) { const make = f => posed(B, L, { x: d.x * f, y: 0 }, k), f = furthest(make), end = make(f).p;
        if (off(hip.x + d.x * f, B[27], B[28]) >= .35 || Math.abs(d.x * f) > .7 * torso || Math.abs(spine(end) / spine(B) - 1) > .12 || SIDES.some(([a, b, c]) => angleAt(end[a], end[b], end[c]) < Math.min(60, angleAt(B[a], B[b], B[c])))) continue;
        return { s, keys: [B, end], marks: [{ from: hip, to: { x: hip.x + d.x * f, y: hip.y } }] }; }
      return null;   // a shift this big isn't one body settling: better no picture than a wrong one
    }
    if (kind === 'rest') {
      const [a, b, c] = B[15].y <= B[16].y ? [11, 13, 15] : [12, 14, 16], o2 = c === 15 ? 16 : 15, n = a === 11 ? 0 : 1, long = (L[n][0] + L[n][1]) * .985, ax = B[a].x - B[c].x, ay = B[a].y - B[c].y, r = Math.hypot(ax, ay) || 1;
      let ux = ax / r * .4, uy = ay / r * .4 + .6; const u = Math.hypot(ux, uy) || 1; ux /= u; uy /= u;
      const d = { x: B[c].x + ux * long - B[a].x, y: B[c].y + uy * long - B[a].y }, legs = q => Math.min(hypot(q[23], q[27]) / (L[2][0] + L[2][1]), hypot(q[24], q[28]) / (L[3][0] + L[3][1])), far = Math.hypot(d.x, d.y),
        make = f => { const r = posed(B, L, { x: d.x * f, y: d.y * f }, 1, {}, { [o2]: true }); if (far * f > .6 * torso || (f && legs(r.p) < Math.min(.5, legs(B)))) r.ok = false; return r; }, f = furthest(make), end = make(f).p, was = angleAt(B[a], B[b], B[c]), now = angleAt(end[a], end[b], end[c]);
      if (now - was < 15) return null;
      return { s, keys: [B, end], marks: [{ from: B[a], to: end[a] }], was: Math.round(was), now: Math.round(now) };
    }
    if (kind === 'feet') {
      const h = P[o.move.k], low = B[27].y >= B[28].y ? 27 : 28, name = low === 27 ? 'la' : 'ra', next = T.moves.find(m => m.k === name && m.t > s.t && m.t < s.t + 5), at = next && T.S.find(q => q.p && q.t >= next.t), real = at && across(at, s, unpack(at, T.W, T.H)[low]);
      const good = real && inside(real) && B[low].y - real.y > .2 * torso, foot = good ? real : { x: B[low].x + (hip.x - B[low].x) * .3, y: B[low].y - .5 * torso };
      const later = T.S.find(q => q.p && q.t >= o.move.t), reach = later ? across(later, s, unpack(later, T.W, T.H)[h]) : null, hand = reach && inside(reach) && hypot(reach, B[h]) > .2 * torso ? reach : { x: B[h].x, y: B[h].y - .6 * torso };
      const rise = B[low].y - foot.y, d = { x: (foot.x - hip.x) * .25, y: -rise * .65 }, ends = { [low]: foot, [h]: hand }, make = f => posed(B, L, { x: d.x * f, y: d.y * f }, 1, ends, { [h]: true }), f = furthest(make);
      if (f < .3 || rise < .15 * torso) return null;
      return { s, keys: [B, posed(B, L, { x: d.x * f * .15, y: d.y * f * .15 }, 1, { [low]: foot }).p, make(f).p], marks: [{ from: B[low], to: foot }, { from: B[h], to: hand }], foot: low === 27 ? 'Left' : 'Right', guess: !good, when: good ? next.t : null };
    }
    return null;
  };
  // your climb played again on its own wall: the wall from the video with you taken off it, every place a hand or foot stopped (in
  // wall positions, so a phone that pans doesn't move them), and your body as the video tracked it, at your own pace. A hand or
  // foot stays on its hold until the video sees it move; elbows and knees bend the way yours did. False when the video has too little
  window.poseRoute = (cv, src, T, onMove) => {
    const Q = s => s._q || (s._q = unpack(s, T.W, T.H)), med = (l, f) => midOf(l.map(f)) || 0, ID = [0, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27, 28, 31, 32];
    // frames the model misread (a body far shorter or longer than yours) are left out
    const tr = s => hypot(mid(Q(s)[11], Q(s)[12]), mid(Q(s)[23], Q(s)[24])), all_ = T.S.filter(s => s.p), tm = med(all_, tr) || 1, seen = all_.filter(s => tr(s) > tm * .7 && tr(s) < tm * 1.4).map(s => ({ ...s }));
    if (seen.length < 3 || !T.moves?.length) return false;
    // the wall can't jump: when it seems to move a long way between two frames while you barely move in the picture, the match to
    // the wall slipped, so later frames are put back in line with the earlier ones
    let ox = 0, oy = 0; seen.forEach((s, j) => { const w = s.w || [1, 0, 0, 0]; s.w = [w[0], w[1], w[2] + ox, w[3] + oy]; if (!j) return;
      const a = seen[j - 1], hp = q => mid(Q(q)[23], Q(q)[24]), fa = hp(a), fb = hp(s), A = onWall(a, fa), B = onWall(s, fb), fd = hypot(fa, fb), wd = hypot(A, B);
      if (wd > tm * .6 && fd < wd * .5) { const c = s.w[0], n = s.w[1], dx = fb.x - fa.x, dy = fb.y - fa.y, ex = A.x + c * dx - n * dy - B.x, ey = A.y + n * dx + c * dy - B.y; ox += ex; oy += ey; s.w = [s.w[0], s.w[1], s.w[2] + ex, s.w[3] + ey]; } });
    // every tracked point on the wall, smoothed a little over its neighbours (more weight where the model was sure)
    const WP = seen.map(s => { const q = Q(s), o = {}; ID.forEach(i => { o[i] = { ...onWall(s, q[i]), v: q[i].v }; }); return o; });
    const SM = WP.map((_, j) => { const o = {}; ID.forEach(i => { let x = 0, y = 0, g = 0, v = 0, n = 0; for (let d = -1; d <= 1; d++) { const k = j + d; if (k < 0 || k >= WP.length || Math.abs(seen[k].t - seen[j].t) > .45) continue; const w = (d ? 1 : 2) * Math.max(.05, WP[k][i].v); x += WP[k][i].x * w; y += WP[k][i].y * w; g += w; v += WP[k][i].v; n++; } o[i] = { x: x / g, y: y / g, v: v / n }; }); return o; });
    const TS = seen.map(s => s.t), cr = (a, b, c, d, u) => .5 * (2 * b + (c - a) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (3 * b - a - 3 * c + d) * u * u * u);
    const pose = t => { let j = TS.findIndex(x => x > t); if (j < 0) j = TS.length - 1; const i = Math.max(0, j - 1), u = TS[j] > TS[i] ? Math.max(0, Math.min(1, (t - TS[i]) / (TS[j] - TS[i]))) : 0, A = SM[Math.max(0, i - 1)], B = SM[i], C = SM[j], D = SM[Math.min(SM.length - 1, j + 1)], o = {};
      ID.forEach(k => { o[k] = { x: cr(A[k].x, B[k].x, C[k].x, D[k].x, u), y: cr(A[k].y, B[k].y, C[k].y, D[k].y, u), v: B[k].v + (C[k].v - B[k].v) * u }; }); return o; };
    const long = (a, b) => { const l = WP.filter(q => q[a].v > .5 && q[b].v > .5).map(q => hypot(q[a], q[b])).sort((x, y) => x - y); return l[Math.floor(l.length * .85)] || 1; };
    const LEN = { 13: [long(11, 13), long(13, 15)], 14: [long(12, 14), long(14, 16)], 25: [long(23, 25), long(25, 27)], 26: [long(24, 26), long(26, 28)] };
    const torsoL = med(WP, q => hypot(mid(q[11], q[12]), mid(q[23], q[24]))) || 1;
    // where a point was just after time t: the middle of the next 0.6 s, on the wall
    const near = t => { const part = seen.filter(s => s.t >= t - .01 && s.t <= t + .6); return part.length ? part : [seen.reduce((b, s) => Math.abs(s.t - t) < Math.abs(b.t - t) ? s : b)]; };
    const spot = (part, f) => { const ps = part.map(s => onWall(s, f(Q(s)))); return { x: midOf(ps.map(p => p.x)), y: midOf(ps.map(p => p.y)) }; };
    const LIM = { lw: 15, rw: 16, la: 27, ra: 28 }, moves = [...T.moves].sort((a, b) => a.t - b.t), n = moves.length;
    const t0_ = Math.max(seen[0].t, moves[0].t0 - .6), t1_ = Math.min(seen[seen.length - 1].t, moves[n - 1].t + .8), holds = [], plan = {};
    // the hold is where you grip or stand, not at the wrist or ankle: a little past the knuckles, or just behind the toes
    const TIP = { lw: [15, 17, 19], rw: [16, 18, 20], la: [27, 31], ra: [28, 32] }, grip = (q, k) => { const [w, a, b] = TIP[k];
      if (b) { const m = mid(q[a], q[b]); return Math.min(q[a].v, q[b].v) < .3 ? q[w] : { x: q[w].x + (m.x - q[w].x) * 1.2, y: q[w].y + (m.y - q[w].y) * 1.2 }; }
      return q[a].v < .3 ? q[w] : { x: q[w].x + (q[a].x - q[w].x) * .9, y: q[w].y + (q[a].y - q[w].y) * .9 }; };
    const stop = (part, k) => { const to = spot(part, q => q[LIM[k]]), g = spot(part, q => grip(q, k)); return { to, g }; };
    Object.keys(LIM).forEach(k => { const e = { k, t0: -1e9, t1: -1e9, ...stop(near(t0_), k) }; plan[k] = [e]; holds.push({ k, p: e.g, i: 0, t: t0_, e }); });
    moves.forEach((m, i) => { const part = near(m.t), e = { k: m.k, t0: m.t0, t1: m.t, ...stop(part, m.k) }; plan[m.k].push(e); if (med(part, s => Q(s)[LIM[m.k]].v) >= .5) holds.push({ k: m.k, p: e.g, i: i + 1, t: m.t, e }); });
    // moves the analysis missed: a hand or foot the video clearly sees settled somewhere else, away from its hold, for 0.8 s has
    // moved there, so it isn't kept on a hold it already left
    Object.keys(LIM).forEach(k => { const i = LIM[k], l = plan[k]; let run = null;
      seen.forEach((s, j) => { if (s.t < t0_ || s.t > t1_) return; let a = 0; while (a + 1 < l.length && l[a + 1].t0 <= s.t) a++; const c = l[a], p = SM[j][i];
        if ((a && s.t < c.t1 + .4) || p.v < .5 || hypot(p, c.to) < torsoL * .5) { run = null; return; }
        if (!run || hypot(p, SM[run.j][i]) > torsoL * .25) { run = { t: s.t, j }; return; }
        if (s.t - run.t < .8) return;
        const e = { k, t0: Math.max(c.t1, run.t - .5), t1: run.t + .2, ...stop(near(run.t), k) }; l.splice(a + 1, 0, e); holds.push({ k, p: e.g, i: -1, t: e.t1, e }); run = null; }); });
    // one ring per hold: stops close together are the same hold. Hands are numbered in the order they first took a hold; the holds
    // both hands started on are the start
    const rings = []; [...holds].sort((a, b) => a.t - b.t).forEach(q => { const hand = q.k[1] === 'w', r = rings.find(o => o.hand === hand && hypot(o.p, q.p) < torsoL * (hand ? .16 : .12));
      if (r) q.r = r; else rings.push(q.r = { hand, p: q.p, t: q.t, start: !q.i && hand }); });
    let num = 0; rings.forEach(r => { if (r.hand && !r.start) r.n = ++num; });
    // every stop, even one the model saw less well, belongs to the hold it was nearest to
    holds.forEach(q => { q.e.r = q.r; });
    Object.values(plan).flat().forEach(e => { if (e.r) return; const hand = e.k[1] === 'w', l = rings.filter(o => o.hand === hand && hypot(o.p, e.g) < torsoL * (hand ? .2 : .15)).sort((a, b) => hypot(a.p, e.g) - hypot(b.p, e.g)); e.r = l[0]; });
    // how far the hand or foot reaches past the wrist or ankle right now: on a hold, to the hold; on the way, as the video saw it
    const reachOf = (k, t, now) => { const l = plan[k]; let j = 0; while (j + 1 < l.length && l[j + 1].t0 <= t) j++; const c = l[j], g = grip(now, k), w = now[LIM[k]];
      return !j || t >= c.t1 ? { x: c.g.x - c.to.x, y: c.g.y - c.to.y } : { x: g.x - w.x, y: g.y - w.y }; };
    // a hand or foot: on its hold, or on its way to the next one along the path the video saw, bent so it leaves one hold and lands on the next
    const end = (k, t, now) => { const l = plan[k]; let j = 0; while (j + 1 < l.length && l[j + 1].t0 <= t) j++; const c = l[j]; if (!j || t >= c.t1) return c.to;
      const prev = l[j - 1].to, A = pose(c.t0)[LIM[k]], Z = pose(c.t1)[LIM[k]], e = (t - c.t0) / (c.t1 - c.t0), s = e * e * (3 - 2 * e), tr = now[LIM[k]];
      return tr.v < .3 ? { x: prev.x + (c.to.x - prev.x) * s, y: prev.y + (c.to.y - prev.y) * s } : { x: tr.x + (prev.x - A.x) * (1 - s) + (c.to.x - Z.x) * s, y: tr.y + (prev.y - A.y) * (1 - s) + (c.to.y - Z.y) * s }; };
    // elbow or knee at its measured length, on the side the video saw it bend; straight if the hold is out of reach
    const joint = (r, seenAt, e, [l1, l2]) => { const D = hypot(r, e) || 1, dx = (e.x - r.x) / D, dy = (e.y - r.y) / D;
      if (D >= (l1 + l2) * .995) { const f = l1 / (l1 + l2); return { x: r.x + (e.x - r.x) * f, y: r.y + (e.y - r.y) * f }; }
      const side = (e.x - r.x) * (seenAt.y - r.y) - (e.y - r.y) * (seenAt.x - r.x) >= 0 ? 1 : -1, a = (l1 * l1 - l2 * l2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
      return { x: r.x + dx * a - dy * h * side, y: r.y + dy * a + dx * h * side }; };
    // hands and feet stay on their holds: the body is moved as little as it takes for each to reach at your measured arm and leg
    // length. Only a hold still far out of reach after that (a stop the model misplaced) is let go, as near to it as the limb goes
    const ROOT = { lw: 11, rw: 12, la: 23, ra: 24 }, LL = { lw: LEN[13], rw: LEN[14], la: LEN[25], ra: LEN[26] };
    const fit = (k, r, e) => { const max = (LL[k][0] + LL[k][1]) * 1.25, D = hypot(r, e); if (D <= max) return e; const f = max / D; return { x: r.x + (e.x - r.x) * f, y: r.y + (e.y - r.y) * f }; };
    const frame = t => { const q0 = pose(t), E = {}; Object.keys(ROOT).forEach(k => { E[k] = end(k, t, q0); }); let dx = 0, dy = 0;
      for (let it = 0; it < 10; it++) { let sx = 0, sy = 0, c = 0; for (const k in E) { const r = q0[ROOT[k]], rx = r.x + dx, ry = r.y + dy, D = Math.hypot(E[k].x - rx, E[k].y - ry) || 1, reach = (LL[k][0] + LL[k][1]) * .98;
          if (D > reach) { sx += (E[k].x - rx) / D * (D - reach); sy += (E[k].y - ry) / D * (D - reach); c++; } } if (!c) break; dx += sx / c * .8; dy += sy / c * .8; }
      const q = {}; for (const i in q0) q[i] = { ...q0[i], x: q0[i].x + dx, y: q0[i].y + dy };
      const sl = q[11], sr = q[12], hl = q[23], hr = q[24], hL = fit('lw', sl, E.lw), hR = fit('rw', sr, E.rw), fL = fit('la', hl, E.la), fR = fit('ra', hr, E.ra), sm = mid(sl, sr);
      const tip = (k, e) => { const o = reachOf(k, t, q); return { x: e.x + o.x, y: e.y + o.y }; };
      return { sl, sr, hl, hr, hL, hR, fL, fR, tL: tip('lw', hL), tR: tip('rw', hR), gL: tip('la', fL), gR: tip('ra', fR), el: joint(sl, q[13], hL, LEN[13]), er: joint(sr, q[14], hR, LEN[14]), kl: joint(hl, q[25], fL, LEN[25]), kr: joint(hr, q[26], fR, LEN[26]), sm, head: { x: sm.x + (q[0].x - sm.x) * .9, y: sm.y + (q[0].y - sm.y) * .9 } }; };
    // the picture: the frame where most of the holds are in view, closed in on the climb at 3 : 4
    const inside = q => q.x >= 0 && q.y >= 0 && q.x <= T.W && q.y <= T.H, mid_ = seen[Math.floor(seen.length / 2)].t;
    const ref = seen.map(s => [s, holds.filter(h => inside(onFrame(s, h.p))).length]).sort((a, b) => b[1] - a[1] || Math.abs(a[0].t - mid_) - Math.abs(b[0].t - mid_))[0][0];
    const F = q => onFrame(ref, q), pts = [...holds.map(h => F(h.p)), ...TS.filter(t => t >= t0_ && t <= t1_).flatMap(t => Object.values(frame(t)).map(F))], xs = pts.map(q => q.x), ys = pts.map(q => q.y), RATIO = cv.width / cv.height, pad = torsoL * .5;
    let h = Math.max(...ys) - Math.min(...ys) + pad * 2, w = h * RATIO;
    if (w < Math.max(...xs) - Math.min(...xs) + pad * 2) { w = Math.max(...xs) - Math.min(...xs) + pad * 2; h = w / RATIO; }
    let x0 = (Math.min(...xs) + Math.max(...xs) - w) / 2, y0 = (Math.min(...ys) + Math.max(...ys) - h) / 2;
    const sc = cv.width / w, X = q => (F(q).x - x0) * sc, Y = q => (F(q).y - y0) * sc, ctx = cv.getContext('2d'), bg = document.createElement('canvas'), LIME = '#DDF26A', LILAC = '#D9B8F5', u = cv.width / 300;
    bg.width = cv.width; bg.height = cv.height;
    const hands = holds.filter(q => q.k[1] === 'w').sort((a, b) => a.t - b.t);
    const BON = [['sl', 'sr'], ['hl', 'hr'], ['sl', 'hl'], ['sr', 'hr'], ['sl', 'el'], ['el', 'hL'], ['sr', 'er'], ['er', 'hR'], ['hl', 'kl'], ['kl', 'fL'], ['hr', 'kr'], ['kr', 'fR']];
    let said = -1; const RR = Math.max(6 * u, torsoL * .11 * sc);
    const paint = t => {
      const p = frame(t), move = moves.filter(m => m.t <= t + .01).length, R = torsoL * .2 * sc;
      ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(bg, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      // the holds themselves carry the route (in colour on the grey wall); a small tag beside each hand hold gives the order, S for the start
      rings.forEach(r => { if (!r.n && !r.start) return; const on = r.t <= t + .01, bx = X(r.p) + RR * 1.25, by = Y(r.p) - RR * 1.25, br = 5.2 * u;
        ctx.globalAlpha = on ? 1 : .55; ctx.beginPath(); ctx.arc(bx, by, br, 0, 7); ctx.fillStyle = on ? LIME : '#FFFFFF'; ctx.fill(); ctx.lineWidth = 1 * u; ctx.strokeStyle = '#111111'; ctx.stroke();
        ctx.fillStyle = '#111111'; ctx.font = `700 ${(r.n > 9 ? 6 : 7) * u}px Urbanist, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(r.n || 'S', bx, by + .3 * u); ctx.globalAlpha = 1; });
      const hx = X(p.head), hy = Y(p.head), nx = X(p.sm), ny = Y(p.sm), hd = Math.hypot(hx - nx, hy - ny) || 1, neck = { x: hx + (nx - hx) / hd * R, y: hy + (ny - hy) / hd * R };
      [['rgba(17,17,17,.75)', 5.5 * u], [LILAC, 3 * u]].forEach(([c, l]) => { ctx.strokeStyle = c; ctx.lineWidth = l; BON.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(X(p[a]), Y(p[a])); ctx.lineTo(X(p[b]), Y(p[b])); ctx.stroke(); });
        if (hd > R) { ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(neck.x, neck.y); ctx.stroke(); } ctx.beginPath(); ctx.arc(hx, hy, R, 0, 7); ctx.stroke(); });
      // hands and feet reach on to the hold, so the body visibly holds or stands on it
      const ends = [['hL', 'tL'], ['hR', 'tR'], ['fL', 'gL'], ['fR', 'gR']];
      [['rgba(17,17,17,.75)', 5 * u], [LILAC, 2.6 * u]].forEach(([c, l]) => { ctx.strokeStyle = c; ctx.lineWidth = l; ends.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(X(p[a]), Y(p[a])); ctx.lineTo(X(p[b]), Y(p[b])); ctx.stroke(); }); });
      ends.forEach(([, k]) => { ctx.beginPath(); ctx.arc(X(p[k]), Y(p[k]), 2.4 * u, 0, 7); ctx.fillStyle = LILAC; ctx.fill(); ctx.lineWidth = 1.2 * u; ctx.strokeStyle = '#111111'; ctx.stroke(); });
      if (move !== said) { said = move; onMove?.(move, n); } };
    // the wall without you on it: twelve frames from across the climb, each laid on the wall where it belongs, and for every pixel
    // the middle value of the ones that saw it. The climber is in a different place in each, so the wall is what stays
    const C = q => ({ x: (q.x - x0) * sc, y: (q.y - y0) * sc }), PIX = bg.width * bg.height, NF = 12, stack = new Uint8Array(PIX * NF), rgb = new Uint8Array(PIX * NF * 3), cnt = new Uint8Array(PIX);
    const tmp = document.createElement('canvas'); tmp.width = bg.width; tmp.height = bg.height; const tc = tmp.getContext('2d', { willReadFrequently: true });
    const mask = document.createElement('canvas'); mask.width = bg.width; mask.height = bg.height; const mc = mask.getContext('2d', { willReadFrequently: true });
    const layer = s => { const o = C(across(s, ref, { x: 0, y: 0 })), ex = C(across(s, ref, { x: 1, y: 0 })), ey = C(across(s, ref, { x: 0, y: 1 }));
      tc.setTransform(1, 0, 0, 1, 0, 0); tc.clearRect(0, 0, tmp.width, tmp.height); tc.setTransform(ex.x - o.x, ex.y - o.y, ey.x - o.x, ey.y - o.y, o.x, o.y); tc.drawImage(still, 0, 0, T.W, T.H);
      const d = tc.getImageData(0, 0, tmp.width, tmp.height).data;
      // you, blanked out of this frame (your outline from the tracking, drawn wide), so where you stayed a long time doesn't leave a ghost
      const q = Q(s), at = i => C(across(s, ref, q[i])), bw = torsoL * sc * .62; mc.clearRect(0, 0, mask.width, mask.height); mc.strokeStyle = mc.fillStyle = '#000'; mc.lineCap = 'round'; mc.lineWidth = bw;
      [[11, 12], [23, 24], [11, 23], [12, 24], [11, 24], [12, 23], [11, 13], [13, 15], [15, 19], [12, 14], [14, 16], [16, 20], [23, 25], [25, 27], [27, 31], [24, 26], [26, 28], [28, 32], [0, 11], [0, 12]].forEach(([a, b]) => { mc.beginPath(); mc.moveTo(at(a).x, at(a).y); mc.lineTo(at(b).x, at(b).y); mc.stroke(); });
      mc.beginPath(); mc.arc(at(0).x, at(0).y, torsoL * sc * .42, 0, 7); mc.fill(); const mk = mc.getImageData(0, 0, mask.width, mask.height).data;
      for (let i = 0; i < PIX; i++) if (d[i * 4 + 3] > 200 && !mk[i * 4 + 3] && cnt[i] < NF) { const j = i * NF + cnt[i]++; stack[j] = (d[i * 4] * 77 + d[i * 4 + 1] * 150 + d[i * 4 + 2] * 29) >> 8; rgb[j * 3] = d[i * 4]; rgb[j * 3 + 1] = d[i * 4 + 1]; rgb[j * 3 + 2] = d[i * 4 + 2]; } };
    // the wall in grey, and only the holds you used in their own colour, so the colour is your route. Each pixel takes the colour of
    // the frame whose brightness there is the middle one
    const wall = () => { const b = bg.getContext('2d'), img = b.createImageData(bg.width, bg.height), o = img.data, v = new Uint8Array(NF), ix = new Uint8Array(NF);
      const col = new Uint8Array(PIX * 3), lum = new Uint8Array(PIX), hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)]; let seenPx = 0;
      for (let i = 0; i < PIX; i++) { const c = cnt[i]; if (!c) continue;
        for (let j = 0; j < c; j++) { const x = stack[i * NF + j]; let k = j; while (k && v[k - 1] > x) { v[k] = v[k - 1]; ix[k] = ix[k - 1]; k--; } v[k] = x; ix[k] = j; }
        const j = (i * NF + ix[c >> 1]) * 3; lum[i] = v[c >> 1]; for (let ch = 0; ch < 3; ch++) { col[i * 3 + ch] = rgb[j + ch]; hist[ch][rgb[j + ch]]++; } seenPx++; }
      // the bare wall's colour (most of the picture is wall), so a hold is whatever stands out from it
      const base = hist.map(h => { let a = 0, k = 0; while (k < 255 && (a += h[k]) < seenPx / 2) k++; return k; }), bl = (base[0] * 77 + base[1] * 150 + base[2] * 29) >> 8 || 1;
      const keep = new Float32Array(PIX), out = i => { const l = lum[i], f = l / bl; return Math.hypot(Math.hypot(col[i * 3] - base[0] * f, col[i * 3 + 1] - base[1] * f, col[i * 3 + 2] - base[2] * f), Math.abs(l - bl) * .6); };
      // the hold itself: the middle of what stands out from the wall right there. Every hand or foot that used it is put on that
      // middle, so the body is on the coloured hold and not beside it
      rings.forEach(r => { const cx = X(r.p), cy = Y(r.p), R = (r.hand ? RR * 1.7 : RR * 1.4) * 1.1; let sw = 0, sx = 0, sy = 0;
        for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(bg.height - 1, Math.ceil(cy + R)); y++) for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(bg.width - 1, Math.ceil(cx + R)); x++) {
          const i = y * bg.width + x, dd = Math.hypot(x - cx, y - cy); if (dd > R || !cnt[i]) continue; const m = Math.min(1, Math.max(0, (out(i) - 20) / 26)), w = m * m * (1 - dd / R * .5); sw += w; sx += x * w; sy += y * w; }
        if (sw > RR * RR * .25) r.p = onWall(ref, { x: sx / sw / sc + x0, y: sy / sw / sc + y0 }); });
      Object.values(plan).flat().forEach(e => { if (!e.r) return; const dx = e.r.p.x - e.g.x, dy = e.r.p.y - e.g.y; e.g = { x: e.g.x + dx, y: e.g.y + dy }; e.to = { x: e.to.x + dx, y: e.to.y + dy }; });
      rings.forEach(r => { const cx = X(r.p), cy = Y(r.p), R = r.hand ? RR * 1.7 : RR * 1.4;
        for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(bg.height - 1, Math.ceil(cy + R)); y++) for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(bg.width - 1, Math.ceil(cx + R)); x++) {
          const i = y * bg.width + x, dd = Math.hypot(x - cx, y - cy); if (dd > R || !cnt[i]) continue;
          const l = lum[i], f = l / bl, dc = Math.hypot(col[i * 3] - base[0] * f, col[i * 3 + 1] - base[1] * f, col[i * 3 + 2] - base[2] * f), d = Math.hypot(dc, Math.abs(l - bl) * .6);
          // whatever stands out from the wall keeps its colour out to the edge; right where a hand held, it always does, so a hold the
          // colour of the wall still shows. A foot can stand on bare wall, so there only what stands out keeps its colour
          const m = Math.max(Math.min(1, Math.max(0, (d - 20) / 26)) * Math.min(1, Math.max(0, (R - dd) / (R * .35))), r.hand ? Math.min(1, Math.max(0, (R * .55 - dd) / (R * .2))) : 0); if (m > keep[i]) keep[i] = m; } });
      for (let i = 0; i < PIX; i++) { if (!cnt[i]) { o[i * 4] = o[i * 4 + 1] = o[i * 4 + 2] = 27; o[i * 4 + 3] = 255; continue; }
        const g = lum[i] * .62, m = keep[i]; for (let ch = 0; ch < 3; ch++) o[i * 4 + ch] = Math.round(g * (1 - m) + Math.min(255, col[i * 3 + ch] * 1.08) * m); o[i * 4 + 3] = 255; }
      b.putImageData(img, 0, 0); };
    const go = () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { paint(t1_); return; }
      // your own pace while a hand or foot moves; the waits between moves go by four times faster
      const act = t => moves.some(m => t >= m.t0 - .3 && t <= m.t + .3), sp = t => act(t) ? 1.25 : 4, grid = [], cum = []; let c = 0;
      for (let t = t0_; t <= t1_; t += .05) { grid.push(t); cum.push(c); c += .05 / sp(t); }
      const PLAY = c, all = PLAY + 1.6, real = q => { if (q >= PLAY) return t1_; let lo = 0, hi = cum.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= q) lo = m; else hi = m; } return Math.min(t1_, grid[lo] + (q - cum[lo]) * sp(grid[lo])); };
      const st = performance.now(), tick = now => { if (!cv.isConnected) return; const R = cv.getBoundingClientRect(); if (R.bottom > 0 && R.top < innerHeight) paint(real(Math.max(0, (now - st) / 1000) % all)); requestAnimationFrame(tick); };
      paint(t0_); requestAnimationFrame(tick); };
    const picks = [...new Set(Array.from({ length: NF }, (_, i) => seen[Math.round(i * (seen.length - 1) / (NF - 1))]))];
    line = line.then(async () => { for (const s of picks) { if (!cv.isConnected) return; await frameAt(src, s.t); layer(s); } wall(); go(); }).catch(() => {});
    return true;
  };
  // the frame stays still, you stay on it in white, and the simulated body moves over you in lime. Stops by itself when the page changes
  window.poseSim = (cv, src, T, plan, onStep) => {
    const ids = [...new Set(BONES.flat()), 0, ...SIDES.flatMap(x => x[3])], xs = plan.keys.flatMap(k => ids.map(i => k[i].x)), ys = plan.keys.flatMap(k => ids.map(i => k[i].y)), RATIO = cv.width / cv.height;
    let h = (Math.max(...ys) - Math.min(...ys)) * 1.25, w = h * RATIO;
    if (w < (Math.max(...xs) - Math.min(...xs)) * 1.2) { w = (Math.max(...xs) - Math.min(...xs)) * 1.2; h = w / RATIO; }
    if (h > T.H) { h = T.H; w = h * RATIO; } if (w > T.W) { w = T.W; h = w / RATIO; }
    const clamp = (a, lo, hi) => Math.max(lo, Math.min(hi, a)), x0 = clamp((Math.min(...xs) + Math.max(...xs) - w) / 2, 0, T.W - w), y0 = clamp((Math.min(...ys) + Math.max(...ys) - h) / 2, 0, T.H - h), sc = cv.width / w;
    const X = q => (q.x - x0) * sc, Y = q => (q.y - y0) * sc, ctx = cv.getContext('2d'), bg = document.createElement('canvas'), LIME = '#DDF26A';
    bg.width = cv.width; bg.height = cv.height;
    const head = plan.keys[0], rad = hypot(head[11], head[12]) * .32 * sc;
    const body = (q, col, lw, edge) => { ctx.lineCap = 'round'; const line = (c, l) => { ctx.strokeStyle = c; ctx.lineWidth = l; BONES.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(X(q[a]), Y(q[a])); ctx.lineTo(X(q[b]), Y(q[b])); ctx.stroke(); });
        const nx = (q[11].x + q[12].x) / 2, ny = (q[11].y + q[12].y) / 2; ctx.beginPath(); ctx.moveTo(X({ x: nx }), Y({ y: ny })); ctx.lineTo(X(q[0]), Y(q[0])); ctx.stroke(); ctx.beginPath(); ctx.arc(X(q[0]), Y(q[0]), Math.max(8, rad), 0, 7); ctx.stroke(); };
      if (edge) line('rgba(17,17,17,.75)', lw + 4); line(col, lw); };
    const segs = []; plan.keys.slice(1).forEach((_, i) => segs.push([i === 0 ? .9 : .35], [1.1, i, i + 1])); segs.push([1.9], [.6, plan.keys.length - 1, 0]);
    const all = segs.reduce((a, q) => a + q[0], 0), still_ = matchMedia('(prefers-reduced-motion: reduce)').matches, last = plan.keys[plan.keys.length - 1];
    const paint = t => {
      let g = plan.keys[0], step = 0;
      if (still_) { g = last; step = -1; } else { let u = t % all, hold = 0; for (const q of segs) { if (u > q[0]) { u -= q[0]; if (q[1] !== undefined) hold = q[2]; continue; }
          if (q[1] === undefined) g = plan.keys[hold]; else { const e = u / q[0], k = e < .5 ? 2 * e * e : 1 - (-2 * e + 2) ** 2 / 2, A = plan.keys[q[1]], Z = plan.keys[q[2]]; g = A.map((a, i) => a && { x: a.x + (Z[i].x - a.x) * k, y: a.y + (Z[i].y - a.y) * k }); step = q[2] ? q[1] : plan.keys.length - 2; } if (q[1] === undefined) step = Math.max(0, hold - 1); break; } }
      ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(bg, 0, 0); ctx.fillStyle = 'rgba(17,17,17,.3)'; ctx.fillRect(0, 0, cv.width, cv.height);
      body(plan.keys[0], 'rgba(255,255,255,.8)', 4);
      plan.marks.forEach(({ from, to }) => { ctx.setLineDash([9, 10]); ctx.strokeStyle = LIME; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(from), Y(from)); ctx.lineTo(X(to), Y(to)); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.arc(X(to), Y(to), 16, 0, 7); ctx.lineWidth = 4; ctx.stroke(); });
      body(g, LIME, 7, true);
      [15, 16, 27, 28, 23, 24].forEach(i => { ctx.beginPath(); ctx.arc(X(g[i]), Y(g[i]), 7, 0, 7); ctx.fillStyle = LIME; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#111111'; ctx.stroke(); });
      onStep?.(step);
    };
    const go = () => { bg.getContext('2d').drawImage(still, x0, y0, w, h, 0, 0, bg.width, bg.height); const t0 = performance.now(); paint(0); if (still_) return;
      const tick = now => { if (!cv.isConnected) return; const r = cv.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) paint((now - t0) / 1000); requestAnimationFrame(tick); }; requestAnimationFrame(tick); };
    line = line.then(() => frameAt(src, plan.s.t)).then(go).catch(() => {});
  };
  window.poseStill = (src, T, s, mark, tone) => {
    const key = [src, s.t, mark, tone].join('|');
    if (stills[key]) return Promise.resolve(stills[key]);
    return line = line.then(() => grab(src, T, s, mark, tone)).then(u => stills[key] = u).catch(() => null);
  };
  window.posePlay = (v, cv, T, mark) => {   // with a mark: only the picture, for a stretch played on its own
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
      draw(ctx, f, T.W, T.H, mark);
      if (mark) return;
      const rest = T.rests.find(r => t >= r.t0 && t < r.t1), bent = f ? arm(f) : null, straight = bent > 145;
      set('tl-time', `${clock(t)} / ${clock(T.D)}`);
      set('tl-now', !f ? 'Can’t see you here' : f.now ? `${f.now} moving` : rest ? `Resting · ${(t - rest.t0).toFixed(1)} s` : 'Between moves');
      set('tl-moves', `${T.moves.filter(m => m.t <= t).length} of ${T.moves.length}`);
      set('tl-arms', bent == null ? '—' : straight ? `Straight · ${bent}°` : `Bent · ${bent}°`);
      set('tl-hips', !f ? '—' : Math.abs(f.off) < .35 ? 'Over your feet' : f.off < 0 ? 'Out to the left' : 'Out to the right');
      set('tl-tip', !f ? 'Film from further back, phone on the floor, so your whole body stays in frame.' : f.now ? (f.now.includes('foot') ? 'Feet first: good. Stand up on it before the next reach.' : 'Reaching. Push with your legs as the hand goes.')
        : bent != null && !straight ? 'Resting on bent arms tires you fast. Let your arms go straight and hang.'
        : Math.abs(f.off) >= .35 ? 'Hips away from your feet here. Planned, or stuck?' : bent == null ? 'Too far from the camera to read your arms here.' : 'Good rest: arms straight, hips over your feet.');
      const ph = document.getElementById('tlp'); if (ph) ph.style.left = `${Math.min(100, t / T.D * 100)}%`;
    };
    const tick = () => { if (!v.isConnected) return; if (v.currentTime !== last) { last = v.currentTime; paint(last); } requestAnimationFrame(tick); };
    paint(v.currentTime); requestAnimationFrame(tick);
  };
})();

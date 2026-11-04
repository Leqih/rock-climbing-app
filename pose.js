/* chalk. · live movement analysis on a video of a climb.
   MediaPipe Pose Landmarker (full) finds 33 body points on every frame, in the browser, while the video plays.
   From those points, frame by frame: which hand or foot is moving, how many moves so far, whether the arms are straight,
   and whether the hips are over the feet. Nothing is uploaded. Needs a connection the first time, to load the model. */
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

  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const angle = (a, b, c) => { const v1 = { x: a.x - b.x, y: a.y - b.y }, v2 = { x: c.x - b.x, y: c.y - b.y };
    return Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1)))) * 180 / Math.PI; };
  const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const set = (id, t) => { const el = document.getElementById(id); if (el && el.textContent !== t) el.textContent = t; };

  function fresh() {
    return { t: null, pts: null, limb: Object.fromEntries(LIMBS.map(([k]) => [k, { moving: false, still: 0, from: null }])),
      moves: [], still: 0, straight: 0, rest: 0, longest: 0, trail: { lw: [], rw: [] }, done: false };
  }

  // one frame: which body is the climber? Drop faint or impossibly big ones; keep following the one we had; else the one highest
  // on the wall (feet furthest off the floor), so someone walking past on the mats isn't picked
  const KEY = [P.ls, P.rs, P.le, P.re, P.lw, P.rw, P.lh, P.rh, P.lk, P.rk, P.la, P.ra];
  const torso = b => dist(mid(b[P.ls], b[P.rs]), mid(b[P.lh], b[P.rh]));
  function pick(bodies, st, H, t) {
    const ok = bodies.filter(b => KEY.reduce((a, i) => a + b[i].v, 0) / KEY.length > .35 && torso(b) < H * .35);
    if (!ok.length) return null;
    if (st.pts) { const h0 = mid(st.pts[P.lh], st.pts[P.rh]), T0 = st.T || torso(st.pts) || 1;
      // same person: hips close to where they were, and about the same size (someone nearer the phone looks much bigger)
      const near = ok.map(b => [b, dist(mid(b[P.lh], b[P.rh]), h0) / T0, torso(b) / T0]).filter(x => x[2] > .5 && x[2] < 2).sort((a, c) => a[1] - c[1])[0];
      if (near && near[1] < 1.5) return near[0];
      if (t - st.t < 1) return null; } // lost them for a moment: wait rather than jump to someone else
    return ok.sort((a, c) => Math.max(a[P.la].y, a[P.ra].y) - Math.max(c[P.la].y, c[P.ra].y))[0];
  }
  function step(st, res, t, W, H) {
    const bodies = (res.landmarks || []).map(l => l.map(p => ({ x: p.x * W, y: p.y * H, v: p.visibility ?? 1 })));
    const b = pick(bodies, st, H, t);
    if (!b) { if (st.t !== null && t - st.t > 1) { st.pts = null; st.T = null; } return null; }
    // body size, smoothed: one bad frame shouldn't make every limb look fast or slow
    st.T = st.T ? st.T * .85 + (torso(b) || st.T) * .15 : torso(b) || 1; const T = st.T;
    const seen = [P.ls, P.rs, P.lh, P.rh].filter(i => b[i].v > .3).length >= 3;
    const dt = st.t === null ? 0 : Math.max(0, t - st.t);
    // smooth the points a little so a shaky hand isn't counted as a move
    const pts = st.pts && dt < .5 ? b.map((p, i) => ({ x: st.pts[i].x * .45 + p.x * .55, y: st.pts[i].y * .45 + p.y * .55, v: p.v })) : b;
    let now = null, top = 0;
    if (st.pts && dt > 0 && dt < .5) for (const [k, name] of LIMBS) {
      const p = pts[P[k]], q = st.pts[P[k]], s = dist(p, q) / dt / T, L = st.limb[k];
      if (p.v < .4) continue;
      if (s > MOVING) { if (!L.moving) { L.moving = true; L.from = q; } L.still = 0; if (s > top) { top = s; now = name; } }
      else if (L.moving && (L.still += dt) > SETTLE) { L.moving = false; if (dist(p, L.from) / T > REACH) st.moves.push({ name, t }); }
    }
    for (const k of ['lw', 'rw']) { st.trail[k].push({ ...pts[P[k]], t }); st.trail[k] = st.trail[k].filter(p => t - p.t < .8); }
    const el = angle(pts[P.ls], pts[P.le], pts[P.lw]), er = angle(pts[P.rs], pts[P.re], pts[P.rw]), bent = Math.min(el, er);
    const straight = bent > 145;
    if (!now && dt) { st.still += dt; st.rest += dt; st.longest = Math.max(st.longest, st.rest); if (straight) st.straight += dt; } else st.rest = 0;
    const off = (mid(pts[P.lh], pts[P.rh]).x - mid(pts[P.la], pts[P.ra]).x) / T;
    st.t = t; st.pts = pts;
    return { pts, T, seen, now, straight, bent, el, er, off };
  }

  function draw(ctx, f, st, W, H) {
    ctx.clearRect(0, 0, W, H);
    if (!f) return;
    const u = W / 420, p = f.pts;
    // hand paths over the last moment
    for (const k of ['lw', 'rw']) { const tr = st.trail[k]; if (tr.length < 2) continue;
      ctx.strokeStyle = 'rgba(221,242,106,.55)'; ctx.lineWidth = 3 * u; ctx.lineCap = 'round'; ctx.beginPath(); tr.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke(); }
    ctx.lineWidth = 3 * u; ctx.strokeStyle = 'rgba(255,255,255,.9)';
    BONES.forEach(([a, b]) => { if (p[a].v < .3 || p[b].v < .3) return; ctx.beginPath(); ctx.moveTo(p[a].x, p[a].y); ctx.lineTo(p[b].x, p[b].y); ctx.stroke(); });
    // elbows: lime when straight, white ring when bent
    [[P.le, f.el], [P.re, f.er]].forEach(([i, a]) => { ctx.beginPath(); ctx.arc(p[i].x, p[i].y, 5 * u, 0, 7); ctx.fillStyle = a > 145 ? '#DDF26A' : '#FF8A65'; ctx.fill(); });
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

  // the readout under the video: what's happening now, then a summary when the try ends
  function show(f, st, v) {
    if (!f || !f.seen) { set('la-move', '—'); set('la-arms', '—'); set('la-hips', '—'); set('la-tip', 'Can’t see the whole climber. Film from further back, phone on the floor.'); return; }
    set('la-move', f.now || 'Still');
    set('la-arms', f.straight ? 'Straight' : `Bent · ${Math.round(f.bent)}°`);
    set('la-hips', Math.abs(f.off) < .35 ? 'Over your feet' : f.off < 0 ? 'Out to the left' : 'Out to the right');
    set('la-n', String(st.moves.length));
    set('la-rest', st.still > .5 ? `${Math.round(st.straight / st.still * 100)}%` : '—');
    set('la-long', st.longest > .3 ? `${st.longest.toFixed(1)} s` : '—');
    set('la-tip', f.now ? (f.now.includes('foot') ? 'Feet first: good. Stand up on it before the next reach.' : 'Reaching. Push with your legs as the hand goes.')
      : !f.straight ? 'Resting on bent arms tires you fast. Let your arms go straight and hang.'
      : Math.abs(f.off) >= .35 ? 'Bring your hips over your feet so your legs hold your weight.' : 'Good rest: arms straight, hips over your feet.');
    const log = document.getElementById('la-log');
    if (log && log.childElementCount !== Math.min(st.moves.length, 4)) log.innerHTML = st.moves.slice(-4).reverse().map(m => `<li><b>${m.name}</b><span>${clock(m.t)}</span></li>`).join('');
  }
  function summary(st) {
    set('la-st', 'Try finished');
    set('la-tip', `${st.moves.length} ${st.moves.length === 1 ? 'move' : 'moves'} · arms straight in ${st.still > .5 ? Math.round(st.straight / st.still * 100) : 0}% of your rests · longest rest ${st.longest.toFixed(1)} s`);
  }

  // start on a video + canvas pair; stops by itself when the page changes
  window.livePose = (v, cv) => {
    let st = fresh(), last = -1, f = null, lost = 0;
    const ctx = cv.getContext('2d');
    const size = () => { cv.width = v.videoWidth; cv.height = v.videoHeight; };
    if (v.readyState >= 1) size(); else v.addEventListener('loadedmetadata', size, { once: true });
    v.addEventListener('seeking', () => { if (v.currentTime < (+v.dataset.t0 || 0) + .2) { st = fresh(); set('la-n', '0'); const log = document.getElementById('la-log'); if (log) log.innerHTML = ''; } });
    const end = () => { st.done = true; summary(st); };
    v.addEventListener('ended', end);
    v.addEventListener('clipend', end); // the app trims a clip to the climb
    v.addEventListener('play', () => { if (st.done) { st = fresh(); } set('la-st', lm ? 'Analysing live' : 'Loading the pose model…'); });
    v.addEventListener('pause', () => { if (!v.ended && !st.done) set('la-st', 'Paused'); });
    load().then(() => { if (!v.paused) set('la-st', 'Analysing live'); }).catch(() => set('la-st', 'The pose model needs a connection'));
    const tick = () => {
      if (!v.isConnected) return;
      if (lm && !v.paused && v.readyState >= 2 && v.currentTime !== last && cv.width) {
        last = v.currentTime;
        let g = null;
        try { g = step(st, lm.detectForVideo(v, performance.now()), v.currentTime, cv.width, cv.height); } catch { g = null; }
        if (g && g.seen) { f = g; lost = 0; } else if ((lost += 1) > 12) f = g;
        draw(ctx, f, st, cv.width, cv.height);
        if (!v.paused) show(f, st, v);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
})();

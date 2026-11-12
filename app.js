// Spotter v9: one loop. Film or import a try → see what your body did on the wall → watch it next to someone else on the same route.
// One sample world: the ARC Climbing Wall at UIUC (its real address and hours), its top-rope wall, and two routes on it.
// The climbing videos are The Way Up (Maschek & Schedl, CC BY 4.0): ten climbers on the same two routes, filmed from the floor.
// You are one of them; five others with full scans are the community. Their names, likes and comments are sample data.
// Every number about a climb is measured from its video (video/<vid>.track.json, or a live scan in the browser).
// Routes: #/videos (tab) · #/clip/<id> · #/vs/<id>-<v> · #/route/<i> · #/walls (Gyms tab) · #/gyms (map) · #/gym/<i> · #/friends (tab) · #/friends/plan
// · #/scan (photo a route, its beta drawn on) · #/person/<name> · #/profile (tab) · #/session (log by hand, the session clock) · #/summary · #/watch · #/cam · #/setup
// Back from v8 (2026-11-12): other gyms and the map, logging by hand, the session clock, the watch, the highlight reel, the share poster,
// CSV export, friends with plans and a who's-free week, following, and portraits for the sample people

const params = new URLSearchParams(location.search);
// "regular" = you've already filmed three tries here. "new" = first open: your three videos are still in your camera roll
const user = params.get('view') === 'regular' ? 'regular' : 'new';
let page = 'videos', arg = '';
const $ = id => document.getElementById(id);
const n = (k, w, pl) => `${k} ${k === 1 ? w : pl}`;
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/* ---------- The world ---------- */
// the gym, from campusrec.illinois.edu (checked Nov 11, 2026). hours: [open, close] in 24 h for Sun..Sat
const gym = { name: 'ARC Climbing Wall', addr: '201 E Peabody Dr, Champaign (UIUC)', dist: '0.6 mi from the Quad', img: 'gym-arc-1', pics: ['gym-arc-2', 'gym-arc-3'],
  hours: [[9, 22], [6, 23], [6, 23], [6, 23], [6, 23], [6, 22], [9, 22]], has: ['35.5 ft rope wall', 'Top rope', 'Bouldering Cave with a Kilter Board', 'Hangboards', 'Shoe rental'],
  src: 'campusrec.illinois.edu', note: 'Closed Nov 21–29 for Fall Break.' };
// the two routes on the rope wall, named by hold colour. Grades are sample
const ROUTES = [
  { color: 'Green', hex: '#2E9E62', grade: '5.8', wall: 'Rope wall', img: 'wayup-p3-green', ok: true },
  { color: 'Orange', hex: '#F08A24', grade: '5.9', wall: 'Rope wall', img: 'wayup-p3-orange', ok: true }];
// every video in the world: [vid, who, route, topped, days ago, length in s]. "You" = the climber filmed as p2.
// Topped is what the video's last frame shows: at the top, or lower on the wall when it ends
const V = [
  ['wayup-p2a-orange', 'You', 1, false, 7, 47.4], ['wayup-p2-green', 'You', 0, true, 2, 66.3], ['wayup-p2b-orange', 'You', 1, true, 2, 43.9],
  ['wayup-p8-green', 'Noor', 0, true, 0, 77.4], ['wayup-p8-orange', 'Noor', 1, false, 0, 39.4],
  ['wayup-p1-green', 'Sam', 0, true, 1, 187.4], ['wayup-p1-orange', 'Sam', 1, false, 1, 88.5],
  ['wayup-p3-green', 'Leo', 0, true, 3, 51.2], ['wayup-p3-orange', 'Leo', 1, true, 3, 36.3],
  ['wayup-p10-green', 'Kai', 0, true, 4, 72.6],
  ['wayup-p5-green', 'Mia', 0, false, 5, 93.0], ['wayup-p5-orange', 'Mia', 1, false, 5, 59.1]
].map(([vid, who, ri, top, ago, s], i) => ({ i, vid, img: vid, who, ri, top, ago, D: s, ar: 9 / 16, len: mmss(s), t: [0, s], credit: 'The Way Up · Maschek & Schedl · CC BY 4.0' }));
const PEOPLE = ['Noor', 'Sam', 'Leo', 'Kai', 'Mia'];
const rname = r => `${r.color} ${r.grade}`;
const sw = r => `<span class="sw" style="background:${r.hex}"></span>`;
const dateOf = ago => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ago); return d; };
const dayLabel = ago => ago === 0 ? 'Today' : ago === 1 ? 'Yesterday' : ago < 7 ? dateOf(ago).toLocaleDateString('en-US', { weekday: 'long' }) : dateOf(ago).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// the scans of other climbers' videos, fetched when a page needs them
const TRK = {};
function needTracks(vs) {
  const miss = vs.filter(v => !(v.vid in TRK));
  if (!miss.length) return;
  const at = [page, arg];
  miss.forEach(v => { TRK[v.vid] = null; });
  Promise.all(miss.map(v => fetch(`video/${v.vid}.track.json`).then(x => x.ok ? x.json() : null).then(T => { TRK[v.vid] = T; }).catch(() => {})))
    .then(() => { if (page === at[0] && arg === at[1]) render(); });
}

/* ---------- Your videos ---------- */
// one clip = one try of yours. v = its video in V; ri = its route (you can change it); hidden = only you see it
const clips = [];
let cid = 0, newPublic = true;
const vidOf = c => V[c.v];
// a try filmed today is from today, whatever the sample video's own day
const agoOf = c => c.ago ?? V[c.v].ago;
const byId = id => clips.find(x => x.id === +id);
// try number: your tries on that route, oldest first
const tryOf = c => clips.filter(x => x.ri === c.ri && (agoOf(x) > agoOf(c) || agoOf(x) === agoOf(c) && x.id <= c.id)).length;
const topOf = c => V[c.v].top;
function addClip(v, o = {}) {
  const x = V[v], c = { id: cid++, v, ri: x.ri, img: x.img, len: x.len, hidden: !newPublic, cm: [], likes: 0, ...o };
  clips.push(c); x.added = true; return c;
}
// the camera roll: your three videos, with the day each was filmed
const roll = V.filter(x => x.who === 'You');
if (user === 'regular') {
  addClip(0, { likes: 3, cm: [['Sam', 'Nearly there, the top is the crux for me too']] });
  addClip(1, { likes: 7, cm: [['Leo', 'Clean!', 41]] });
  addClip(2, { likes: 9, cm: [['Noor', 'So much smoother than last week'], ['Mia', 'What did you change at the top?', 30]] });
}
const mineOn = ri => clips.filter(c => c.ri === ri).sort((a, b) => tryOf(a) - tryOf(b));
const lastOn = ri => mineOn(ri).pop();
// the community on a route: everyone else's videos of it
const peersOn = ri => V.filter(x => x.who !== 'You' && x.ri === ri);
const span = T => { const a = T.moves[0]?.t0 ?? 0, b = T.moves[T.moves.length - 1]?.t ?? T.D; return [a, b]; };
const climbS = T => { const [a, b] = span(T); return b - a; };

const ic = {
  pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B2D2E" stroke-width="1.8"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  bell: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.7" stroke-linecap="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/></svg>',
  expand: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  arr: c => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg>`,
  scan: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.7" stroke-linecap="round"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/></svg>',
  check: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17 19 7"/></svg>',
  plus: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="#111111"><path d="M7 4.5v15l13-7.5z"/></svg>',
  add: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  rec: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/></svg>',
  back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 8 12l7 7"/></svg>',
  eye: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.8 8.3 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/></svg>',
  down: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  up: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>',
  pen: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>',
  watch: c => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 6l.6-3h4.8L15 6M9 18l.6 3h4.8l.6-3M12 9.5V12l1.5 1"/></svg>`
};
// sample people get a real portrait from Unsplash (img/av-name.jpg: stock models, not these names); you are img/woman2.jpg; anyone else a flat drawn face
const AV = new Set(['noor', 'sam', 'leo', 'kai', 'mia']);
function avatar(w) {
  if (w === 'You') return '<img src="img/woman2.jpg" alt="">';
  if (AV.has(w.toLowerCase())) return `<img src="img/av-${w.toLowerCase()}.jpg" alt="">`;
  const h = [...w].reduce((t, ch) => (t * 31 + ch.charCodeAt(0)) >>> 0, 7), pick = (xs, k) => xs[Math.floor(h / k) % xs.length];
  const bg = pick(['#C9D8F2', '#F2D6C9', '#D2EBC8', '#E6D3F2', '#F2E7B8', '#CDEBE6', '#F2CDD8'], 1);
  const skin = pick(['#F3D3B5', '#E2B48F', '#C68C63', '#8D5A3B', '#F6DCC6'], 7);
  const hair = pick(['#2B2321', '#5A3A28', '#A8692F', '#D9B160', '#1F1F1F', '#7A4B3A'], 49);
  const top = pick(['#111111', '#3D7BEA', '#2E9E62', '#E5484D', '#8E5BD8', '#F2C230', '#FFFFFF'], 343);
  const style = Math.floor(h / 2401) % 3;   // short, long, bun
  const back = style === 1 ? `<path d="M11 21c0-8 4-13 9-13s9 5 9 13v9H11z" fill="${hair}"/>` : '';
  const front = style === 2 ? `<circle cx="20" cy="7.5" r="3.6" fill="${hair}"/><path d="M13.6 17c0-4.6 2.8-7.4 6.4-7.4s6.4 2.8 6.4 7.4c-2-2.2-4-3-6.4-3s-4.4.8-6.4 3z" fill="${hair}"/>`
    : `<path d="M13.4 18c0-5.2 3-8.4 6.6-8.4s6.6 3.2 6.6 8.4c-1.6-2.6-3.8-3.8-6.6-3.8s-5 1.2-6.6 3.8z" fill="${hair}"/>`;
  return `<svg class="avd" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" fill="${bg}"/>${back}
    <path d="M6 40c1.5-7.5 7-11 14-11s12.5 3.5 14 11z" fill="${top}"/><rect x="17" y="24" width="6" height="6" rx="2" fill="${skin}"/>
    <ellipse cx="20" cy="19" rx="6.4" ry="7.2" fill="${skin}"/>${front}</svg>`;
}
const tabHead = t => `<div class="tabh"><h1 class="hl tab">${t}</h1>${t === 'Profile' ? '' : `<button class="av sm" type="button" data-act="to" data-to="profile" aria-label="Your profile">${avatar('You')}</button>`}</div>`;
const bar = (title = '') => `<div class="bar"><button class="bk" type="button" data-act="back" aria-label="Back">${ic.back}</button><span>${title}</span></div>`;
const clock = h => `${h % 12 || 12} ${h < 12 || h === 24 ? 'AM' : 'PM'}`;
// open now? From the gym's hours: "Open till 11 PM" or "Closed · opens 6 AM"
function gymOpen(g) {
  const d = new Date(), h = d.getHours() + d.getMinutes() / 60, today = g.hours[d.getDay()];
  if (today && h >= today[0] && h < today[1]) return { open: true, line: `Open till ${clock(today[1])}` };
  for (let k = 0; k < 7; k++) {
    const day = (d.getDay() + k) % 7, hrs = g.hours[day];
    if (hrs && (k > 0 || h < hrs[0])) return { open: false, line: `Closed · opens ${k === 0 ? '' : k === 1 ? 'tomorrow ' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day] + ' '}${clock(hrs[0])}` };
  }
  return { open: false, line: 'Closed' };
}
function weekHours(g) {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], order = [1, 2, 3, 4, 5, 6, 0], out = [];
  order.forEach(d => { const h = g.hours[d], k = h ? h.join('-') : 'x', last = out[out.length - 1];
    if (last && last.k === k) last.to = d; else out.push({ k, from: d, to: d, h }); });
  return out.map(o => `<div class="gy-l"><span>${o.from === o.to ? names[o.from] : `${names[o.from]}–${names[o.to]}`}</span><b class="num">${o.h ? `${clock(o.h[0])} – ${clock(o.h[1])}` : 'Closed'}</b></div>`).join('');
}

/* ---------- First open: what Spotter does, then straight in ---------- */
function viewSetup() {
  return { photo: 'wayup-p3-green', html: `
    <div class="bar"><span class="brand">Spotter</span></div>
    <h1 class="hl">See what your body did on the wall</h1>
    <p class="sub-w">Film a try with your phone on the floor. Spotter follows your hands, feet and hips, then shows you the same route climbed by others at ${gym.name}.</p>
    <div class="fold"></div>
    <div class="ob-ex"><img id="obex" src="img/wayup-p3-green.jpg" alt="A climber on the rope wall, with the body Spotter found drawn on">
      <div class="ob-t"><span class="ob-k">Example</span><strong>40 hand and foot moves</strong><span>found in Leo’s climb of Green 5.8, with how long each rest was and where the hips were</span></div></div>
    <p class="cap">Your videos are public at first: climbers at ${gym.name} can watch them and comment. Hide any video, anytime.</p>
    <button class="link dk" type="button" data-act="to" data-to="videos">Look around first</button>`,
    cta: `<button class="b-ghost" type="button" data-act="film">Film a try</button><button class="b-lime" type="button" data-act="upload">Import videos</button>`,
    after: () => fetch('video/wayup-p3-green.track.json').then(x => x.json()).then(T => { const s = T.S.find(q => q.p && q.t >= 20); return s && window.poseStill?.('video/wayup-p3-green.mp4', T, s, 'none', 'good'); })
      .then(u => { const im = $('obex'); if (u && im) im.src = u; }).catch(() => {}) };
}

/* ---------- Videos: your tries, by route ---------- */
const vtile = c => {
  const st = c.an === 'ask' ? 'Check this' : c.an !== 'done' ? 'Analysing' : topOf(c) ? 'Topped' : 'Not topped';
  return `<button class="vt${c.hidden ? ' hid' : ''}" type="button" data-act="to" data-to="clip/${c.id}" aria-label="${rname(ROUTES[c.ri])}, try ${tryOf(c)}, ${dayLabel(agoOf(c))}">
    <img src="img/${c.img}.jpg" alt=""><span class="shade"></span>
    <span class="vt-t">Try ${tryOf(c)}</span>
    <span class="vt-b${c.an === 'ask' ? ' ask' : ''}">${c.hidden ? ic.eyeOff : ''}${st} · ${dayLabel(agoOf(c))}</span></button>`;
};
// a day's tries logged by hand on one route: a tile with no picture. Today's opens Log by hand, an older one the route
const htile = l => `<button class="vt vt-h" type="button" data-act="to" data-to="${l.ago === 0 ? 'session' : `route/${l.ri}`}" aria-label="${rname(ROUTES[l.ri])}, logged by hand, ${dayLabel(l.ago)}">
    ${ic.pen}<span class="vt-t">By hand</span>
    <span class="vt-b">${l.sent ? `${ic.check}${l.style || 'Topped'}` : n(l.tries, 'attempt', 'attempts')} · ${dayLabel(l.ago)}</span></button>`;
const handOn = ri => logs.filter(l => l.ri === ri && (l.tries || l.sent));
// a plan for today that you're going to: on top of Videos until the session starts. At ARC it starts the session;
// at another gym it opens that gym, since your climbs here are logged at ARC
const planToday = () => { const p = plans.find(q => q.d === 0 && q.who.includes('You')); if (!p || session === 'live') return '';
  const g = gyms[p.g], oth = p.who.filter(w => w !== 'You'), arc = p.g === 0;
  return `<div class="pt-day"><img src="img/${g.img}.jpg" alt=""><span class="row-t"><strong>Today · ${clock(p.h)} · ${g.name}</strong><span>${oth.length ? `With ${names(oth)}` : 'You planned it'}</span></span>
    ${arc ? '<button class="b-lime" type="button" data-act="plstart">Start</button>' : `<button class="pj" type="button" data-act="to" data-to="gym/${p.g}">Open</button>`}</div>`; };
// days logged by grade: no route and no video, one tile a day. Today's opens Log by hand
const gdays = () => { const ds = [...new Set(glogs.map(x => x.ago))].sort((p, q) => p - q); if (!ds.length) return '';
  const rg = (xs, S) => { const ix = xs.filter(x => S.includes(x.g)).map(x => S.indexOf(x.g)); if (!ix.length) return ''; const lo = S[Math.min(...ix)], hi = S[Math.max(...ix)]; return lo === hi ? lo : `${lo}–${hi}`; };
  const t = (ago, xs) => {
    return `<button class="vt vt-h vt-gr" type="button" data-act="to" data-to="${ago === 0 ? 'session' : 'profile'}" aria-label="Logged by grade, ${dayLabel(ago)}">
      <b class="vt-rg">${[rg(xs, VG), rg(xs, GR)].filter(Boolean).join('<br>')}</b><span class="vt-t">By grade</span><span class="vt-b">${n(xs.length, 'climb', 'climbs')} · ${dayLabel(ago)}</span></button>`; };
  return `<div class="hl2 dk2 vr-h"><h2>By grade</h2></div><p class="vr-s">Logged by hand, without a route · ${n(glogs.filter(gsent).length, 'send', 'sends')}</p>
    <div class="vg">${ds.map(d => t(d, gday(d))).join('')}</div>`; };
function viewVideos() {
  const head = !clips.length ? `<section class="glass scan-c"><span class="t2">No videos yet</span>
      <span class="sub">Film a try at ${gym.name} or import one from your camera roll. Spotter finds every move and shows you others on the same route.</span>
      <div class="two"><button class="b-glass" type="button" data-act="upload">Import videos</button><button class="b-lime" type="button" data-act="film">${ic.rec}Film a try</button></div></section>` : '';
  const tops = ROUTES.filter((r, i) => mineOn(i).some(topOf) || handOn(i).some(l => l.sent)).length, hn = logs.filter(l => l.tries || l.sent).length;
  // per route, newest first: videos and hand logs together. On the same day the hand log goes after the videos
  const groups = ROUTES.map((r, i) => [r, i, mineOn(i), handOn(i)]).filter(([, , cs, hs]) => cs.length || hs.length).map(([r, i, cs, hs]) => {
    const att = cs.length + hs.reduce((a, l) => a + l.tries, 0), items = [...cs.map(c => [agoOf(c), 0, vtile(c)]), ...hs.map(l => [l.ago, 1, htile(l)])].sort((a, b) => a[0] - b[0] || b[1] - a[1]);
    const top = cs.find(topOf), hsent = hs.filter(l => l.sent).sort((a, b) => b.ago - a.ago)[0];
    return `
    <div class="hl2 dk2 vr-h"><h2>${sw(r)}${rname(r)}</h2><button type="button" data-act="to" data-to="route/${i}">${n(peersOn(i).length, 'climber', 'climbers')} on it</button></div>
    <p class="vr-s">${top ? (hs.length ? `Topped · ${n(att, 'try', 'tries')} in all` : `Topped on try ${tryOf(top)}`) : hsent ? `Topped · by hand · ${dayLabel(hsent.ago)}` : `Not topped yet · ${n(att, 'try', 'tries')}`}${hs.length ? ` · ${n(cs.length, 'video', 'videos')}` : ''}</p>
    <div class="vg">${items.map(x => x[2]).join('')}</div>`; }).join('');
  return { photo: clips.length ? clips[clips.length - 1].img : 'wayup-p3-green', html: `
    ${tabHead('Videos')}
    <p class="sub-w">${clips.length || hn ? `${n(clips.length, 'try', 'tries')} on video${hn ? ` · ${n(hn, 'day', 'days')} by hand` : ''} · ${tops} of ${ROUTES.length} routes topped · ${gym.name}` : `Your tries at ${gym.name}, each one analysed`}</p>
    ${planToday()}
    ${head}
    <div class="fold"></div>
    ${reelTile()}
    ${groups}
    ${gdays()}` };
}

/* ---------- Import from the camera roll ---------- */
const upSel = new Set();
function openUpload() { upSel.clear(); drawRoll(); }
function drawRoll() {
  const left = roll.filter(v => !v.added), k = upSel.size;
  pane(`<h2>Import videos</h2><span class="sub">Camera roll · climbing videos</span>
    ${left.length ? `<div class="roll">${left.map(v => `<button type="button" class="${upSel.has(v.i) ? 'on' : ''}" data-act="upick" data-i="${v.i}" aria-pressed="${upSel.has(v.i)}" aria-label="Video from ${dayLabel(v.ago)}, ${v.len}"><img src="img/${v.img}.jpg" alt=""><span>${dayLabel(v.ago)} · ${v.len}</span>${upSel.has(v.i) ? `<em>${[...upSel].indexOf(v.i) + 1}</em>` : ''}</button>`).join('')}</div>
      <p class="hint">Spotter reads the day, the gym and the route from each video. Only the videos you pick leave your phone.</p>
      <button class="btn-l" type="button" data-act="upnext"${k ? '' : ' disabled'}>${k ? `Import ${n(k, 'video', 'videos')}` : 'Pick a video'}</button>`
    : `<p class="hint">Every climbing video in your camera roll is in Spotter already.</p><button class="btn-l" type="button" data-act="close">Done</button>`}`);
}
function importPicks(vs) {
  const cs = vs.map(i => addClip(i));
  closeAll(); cTab = 'why';
  if (cs.length === 1) go(`clip/${cs[0].id}`);
  else { go('videos'); toast(`${n(cs.length, 'video', 'videos')} imported · analysing`); }
}

/* ---------- Film a try: the phone camera, full screen ---------- */
// the camera reads the route from the holds in frame. In this prototype it films the next of your sample tries
let filming = false, recS = 0, recT = null;
const nextRoll = () => roll.find(v => !v.added);
function viewCam() {
  const v = nextRoll(), r = v && ROUTES[v.ri], k = v ? mineOn(v.ri).length + 1 : 0, last = clips[clips.length - 1];
  return { bare: true, dark: true, html: '', overlay: `
    <img src="img/${v ? `${v.img}0` : 'gym-arc-1'}.jpg" alt="Camera view of the wall">
    <div class="cam-top">
      <button class="bk" type="button" data-act="back" aria-label="Back">${ic.back}</button>
      ${r ? `<span class="pk-tag">${sw(r)}${rname(r)} · try ${k}</span>` : ''}
      ${filming ? `<span class="rec-on"><i></i>REC <span id="recT" class="num">${mmss(recS)}</span></span>` : ''}
    </div>
    ${r && !filming ? '<p class="cam-rd">Read from the holds in frame</p>' : ''}
    <span class="cam-fr" aria-hidden="true"></span>
    <p class="cam-hint">${!v ? 'This prototype has three sample tries of yours, and all three are in Videos already.' : filming ? 'Recording. Tap stop when you’re back on the ground.' : 'Prop the phone up on the floor so the whole route fits, then tap once.'}</p>
    <div class="cam-bot">
      ${last ? `<button class="cam-last" type="button" data-act="to" data-to="clip/${last.id}" aria-label="Your last video"><img src="img/${last.img}.jpg" alt=""></button>` : '<span></span>'}
      <button class="shut${filming ? ' on' : ''}" type="button" data-act="shoot" aria-label="${filming ? 'Stop recording' : 'Start recording'}"${v ? '' : ' disabled'}><i></i></button>
      ${watch ? `<span class="cam-s">${ic.watch('#FFFFFF')}Watch ready</span>` : '<span></span>'}
    </div>` };
}

/* ---------- Analysis: what we saw in a video (from v8) ---------- */
const TAGS = [['head', 'Head', 'Tap your head'], ['lh', 'Left hand', 'Tap your left hand'], ['rh', 'Right hand', 'Tap your right hand'], ['lf', 'Left foot', 'Tap your left foot'], ['rf', 'Right foot', 'Tap your right foot']];
const SAMPLE_BODY = { head: { x: .5, y: .3 }, lh: { x: .38, y: .2 }, rh: { x: .62, y: .24 }, lf: { x: .42, y: .72 }, rf: { x: .58, y: .78 }, t: 0 };   // photo clips have no video to read
let tagS = { id: null, i: 0, pts: {} }, cTab = 'why', speed = 1;
const wait = ms => new Promise(r => setTimeout(r, ms));
async function analyse(c, seed) {
  c.an = 'run'; c.pct = 0;
  const began = Date.now(), lv = vidOf(c), here = () => page === 'clip' && +arg === c.id;
  const track = lv && window.poseScan ? await window.poseScan(`video/${lv.vid}.mp4`, seed, p => {
    c.pct = p; if (!here()) return null;
    const n = $('anp'), b = $('anb'); if (n) n.textContent = `${Math.round(p * 100)}%`; if (b) b.style.width = `${p * 100}%`;
    return $('lvc'); }).catch(() => null) : null;
  c.pct = 1; if ($('anp') && here()) { $('anp').textContent = '100%'; $('anb').style.width = '100%'; }
  await wait(Math.max(0, 1200 - (Date.now() - began)));
  // a trimmed video is analysed on what's left of it
  c.track = track && c.trim ? window.__results({ ...track, S: track.S.filter(s => s.t >= c.trim[0] && s.t <= c.trim[1]), moves: track.moves.filter(m => m.t0 >= c.trim[0] && m.t <= c.trim[1]) }) : track;
  // found you: done. Not found (or nothing scanned): you tap yourself once, never made-up points on a real video
  if (seed) { c.tags = seed; c.an = 'done'; } else {
    c.auto = track?.first || null;
    if (c.auto && c.track) { c.tags = c.auto; c.an = 'done'; } else c.an = 'ask';
  }
  if (here() || ['videos', 'profile', 'route', 'vs', 'session'].includes(page)) render();
}
const anState = cs => cs.some(x => x.hold) ? 'hold' : cs.some(x => x.an === 'ask') ? 'ask' : cs.some(x => (x.r || vidOf(x)) && x.an !== 'done') ? 'run' : 'done';
// the track of this video, under it: each hand and foot over time, and every rest. Tap anywhere to go to that moment
function timeline(T) {
  const lane = (l, items) => `<div class="tl-r"><span>${l}</span><div>${items}</div></div>`, at = (t0, t1, cls) => `<i class="${cls}" style="left:${t0 / T.D * 100}%;width:${Math.max(.8, (t1 - t0) / T.D * 100)}%"></i>`;
  const limb = k => T.moves.filter(m => m.k === k).map(m => at(m.t0, m.t, k === 'lw' || k === 'rw' ? 'h' : 'f')).join('');
  return `<section class="glass tl">
    <div class="tl-h"><b id="tl-now">Tap play</b><span class="tl-r2"><span class="num" id="tl-time">0:00 / ${mmss(T.D)}</span><button class="tl-sp num" type="button" data-act="spd" aria-label="Playback speed">${speed}×</button></span></div>
    <div class="tl-g">${lane('Left hand', limb('lw'))}${lane('Right hand', limb('rw'))}${lane('Left foot', limb('la'))}${lane('Right foot', limb('ra'))}
      ${lane('Rests', T.rests.map(r => at(r.t0, r.t1, r.straight > .5 ? 'rs' : 'rb')).join(''))}
      <div class="tl-o" id="tlo" role="slider" aria-label="Go to a moment in the video"><i id="tlp"></i></div></div>
    <p class="an-k tl-k"><span><i class="rs"></i>Rest, arms straight</span><span><i class="rb"></i>Rest, arms bent</span></p>
</section>`;
}
function tlWire() {
  const o = $('tlo'), v = $('lvv'); if (!o || !v) return;
  const go = e => { const b = o.getBoundingClientRect(); v.currentTime = Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)) * (v.duration || 0); };
  o.addEventListener('pointerdown', e => { o.setPointerCapture(e.pointerId); go(e); tlDrag = true; });
  o.addEventListener('pointermove', e => { if (e.buttons) go(e); });
  ['pointerup', 'pointercancel'].forEach(n => o.addEventListener(n, () => { tlDrag = false; }));
}
// analysis: with the sheet down the video shows the whole picture. Pulling the sheet up zooms in on the climber, in step
// with your finger, and the small video then follows them; dragging along the timeline zooms in too. Where we can't
// see you, it stays on where you were last seen
let tlDrag = false;
function followWire(box) {
  const v = $('lvv'), layers = [v, $('lvc')].filter(Boolean);
  let cx = .5, cy = .5, z = 1, held = null; window.poseNow = null;
  const clampC = (c, z) => Math.min(1 - .5 / z, Math.max(.5 / z, c));
  const step = () => {
    if (!box.isConnected) return;
    // where we can't see you (high on the wall, out of frame), it stays on where you were last seen
    const p = window.poseNow || held; if (window.poseNow) held = window.poseNow;
    let zt = 1, xt = .5, yt = .5;
    if (p && v.readyState >= 1) {
      const h = Math.max(.05, p.y1 - p.y0, (p.x1 - p.x0) * box.offsetWidth / box.offsetHeight);
      const k = tlDrag ? 1 : anSheet?.k ?? 0;
      zt = 1 + (Math.min(3, Math.max(1, .75 / h)) - 1) * k; xt = (p.x0 + p.x1) / 2; yt = (p.y0 + p.y1) / 2; }
    z += (zt - z) * .18; cx += (clampC(xt, z) - cx) * .15; cy += (clampC(yt, z) - cy) * .15;
    const tf = `translate(${(50 - z * cx * 100).toFixed(2)}%, ${(50 - z * cy * 100).toFixed(2)}%) scale(${z.toFixed(3)})`;
    layers.forEach(el => { el.style.transform = tf; });
    requestAnimationFrame(step);
  };
  box.classList.add('zoom'); requestAnimationFrame(step);
}
// analysis: the tabs and everything under them are a sheet pulled up over the page, with a handle. It has two places:
// down (the video at full size) and up (the sheet's top under a smaller video). Pulling it up shrinks the video in step
// with your finger; let go between the two and it goes on to the nearer one. Tap the handle to switch. Once it's up, the
// sheet's content scrolls on under the video, which stays the same size
let anSheet = null;
function stickWire(box, full) {
  const scr = document.querySelector('.screen'), w = box.parentElement, m = w.parentElement, tabs = m.querySelector('.ctabs');
  const ar = box.offsetWidth / box.offsetHeight, phone = scr.closest('.phone');
  scr.classList.add('snap'); w.style.height = `${full + 8}px`;
  // pulled up, the video is half its full height: the sheet gets most of the screen
  const MIN = Math.round(Math.max(220, full * .5));
  // how far the page scrolls before the sheet's top meets the video: there the video has shrunk all the way. Measured in
  // the page's own pixels (the phone frame is scaled on screen). The video starts shrinking once it reaches the top
  const start = w.offsetTop, D = Math.max(start + 1, Math.round(tabs.offsetTop - MIN - 8));
  tabs.style.top = `${MIN + 8}px`;
  const pad = () => {   // enough page under the open tab for the sheet to go all the way up
    const free = m.offsetHeight - (parseFloat(m.style.paddingBottom) || 0) + 54 + 120 - scr.clientHeight;
    const want = `${Math.max(0, Math.ceil(D - free))}px`;
    if (m.style.paddingBottom !== want) m.style.paddingBottom = want; };
  let last = 0, dir = 0, t = null, anim = null;
  const fit = () => {
    if (!box.isConnected) { scr.removeEventListener('scroll', fit); m.removeEventListener('tabchange', onTab); return; }
    const y = scr.scrollTop, k = Math.min(1, Math.max(0, (y - start) / (D - start))), h = full - (full - MIN) * k;
    box.style.width = `min(100%, ${Math.round(h * ar)}px)`; w.style.setProperty('--bh', `${h + 8}px`);
    w.classList.toggle('stuck', y > 4); tabs.classList.toggle('stuck', k >= 1);
    // the header's background fades in as the sheet comes up, in step with the video, instead of switching on
    phone?.style.setProperty('--sk', k.toFixed(3)); if (anSheet) anSheet.k = k;
    if (y !== last) dir = y > last ? 1 : -1; last = y;
    clearTimeout(t); if (!anim) t = setTimeout(settle, 120);
  };
  // the page moves itself, so it ends exactly where it was sent (smooth scrolling can stop a pixel short)
  const go = to => { cancelAnimationFrame(anim); const from = scr.scrollTop, t0 = performance.now(), ms = 260;
    const step = now => { const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      scr.scrollTop = from + (to - from) * e; if (p < 1) anim = requestAnimationFrame(step); else anim = null; };
    anim = requestAnimationFrame(step); };
  // let go between the two places: carry on the way you were going once past a fifth, else go back
  const settle = () => { const y = scr.scrollTop; if (y <= 0 || y >= D) return;
    go(dir > 0 ? (y > D * .2 ? D : 0) : (y < D * .8 ? 0 : D)); };
  const onTab = () => { pad(); if (scr.scrollTop > D) scr.scrollTop = D; };
  anSheet = { go, k: 0 };
  tabs.addEventListener('click', e => { if (e.target.closest('button')) return; go(scr.scrollTop >= D / 2 ? 0 : D); });
  scr.addEventListener('scroll', fit, { passive: true }); m.addEventListener('tabchange', onTab); pad(); fit();
}
// a stretch played in the video at the top: slowed down, stopped at its end, with a label saying which stretch it is
let segStop = null;
function segMain(btn) {
  const v = $('lvv'), a = +btn.dataset.a, b = +btn.dataset.b, t = +(btn.dataset.t ?? a), box = v.parentElement;
  segStop?.(true);
  const rate = v.playbackRate, scr = document.querySelector('.screen'), back = scr.scrollTop;
  if (anSheet && back > 0) anSheet.go(0);
  btn.classList.add('on');
  const l = document.createElement('button'); l.id = 'segl'; l.type = 'button'; l.className = 'seg-l num'; l.setAttribute('aria-label', 'Stop playing this moment');
  // the label repeats the time written on what you tapped, so the two always match
  const said = btn.textContent.match(/\d+:\d\d(?:\s*–\s*\d+:\d\d)?/)?.[0] || mmss(t);
  l.innerHTML = `${said} · 0.5× <span aria-hidden="true">✕</span>`; box.append(l);
  const stop = next => { segStop = null; v.removeEventListener('timeupdate', tick); v.playbackRate = rate; l.remove(); btn.classList.remove('on');
    if (!next && anSheet && back > 0 && scr.scrollTop < 2) setTimeout(() => anSheet?.go(back), 500); };
  segStop = stop;
  const tick = () => { if (v.currentTime >= b) { v.pause(); stop(); } };
  l.addEventListener('click', e => { e.stopPropagation(); v.pause(); stop(); });
  v.pause(); v.currentTime = a; v.playbackRate = .5; v.addEventListener('timeupdate', tick); v.play().catch(() => {});
}
// one stretch of the video, played right where it was asked for: slowed down, with its start, end and current time, stopped at its end
let seg = null, segT = null;
const clipAt = (a, b, mark = 'none', t = a) => `data-act="segplay" data-a="${a}" data-b="${b}" data-mark="${mark}" data-t="${t}"`;
const clipNear = (t, D, mark) => clipAt(Math.max(0, t - 1), Math.min(D, t + 2), mark, t);
function segClose() {
  $('cp')?.remove(); seg = null;
  document.querySelectorAll('.an-see[hidden]').forEach(x => { x.hidden = false; });
}
function segAgain() { const v = $('cpv'); if (!v || !seg) return; seg.over = false; $('cpg').hidden = true; v.currentTime = seg.a; v.play().catch(() => {}); }
function segOpen(btn) {
  const main = $('lvv'), T = segT; if (!main || !T) return;
  const a = +btn.dataset.a, b = +btn.dataset.b, ar = T.W / T.H;
  segClose(); main.pause();
  seg = { a, b, over: false, rate: .5 };
  const box = document.createElement('div'); box.id = 'cp'; box.className = 'cp';
  box.innerHTML = `<div class="clip vp lv cp-v" style="aspect-ratio:${ar.toFixed(4)};width:min(100%, ${Math.round(380 * ar)}px)"><video id="cpv" src="${main.currentSrc || main.src}" muted playsinline preload="auto"></video><canvas id="cpc"></canvas><button class="play-b" type="button" data-act="segtoggle" aria-label="Play this stretch">${ic.play}</button></div>
    <div class="cp-bar" id="cpb" role="slider" aria-label="Go to a moment in this stretch"><i id="cpi"></i></div>
    <div class="cp-t num"><span>${mmss(a)}</span><b id="cpn">${mmss(a)}</b><span>${mmss(b)}</span></div>
    <div class="cp-a"><button class="pj" type="button" id="cps" data-act="segspeed">0.5×</button><button class="pj" type="button" id="cpg" data-act="segagain" hidden>Watch again</button><button class="pj" type="button" data-act="segclose">Close</button></div>`;
  // a time in a sentence opens the stretch right under that sentence
  const see = btn.classList.contains('t-at') ? null : btn.closest('.lt')?.querySelector('.an-see');
  if (see) { see.hidden = true; see.after(box); } else (btn.classList.contains('t-at') ? btn.closest('p') : btn).after(box);
  box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  const v = $('cpv'), wrap = v.parentElement, now = seg, bar = $('cpb');
  const end = () => { if (seg === now && !now.over) { now.over = true; v.pause(); $('cpg').hidden = false; } };
  const tick = () => { if (!v.isConnected) return; const t = Math.min(b, Math.max(a, v.currentTime));
    $('cpi').style.width = `${(t - a) / (b - a) * 100}%`; const l = mmss(t); if ($('cpn').textContent !== l) $('cpn').textContent = l;
    if (v.currentTime >= b - .03) end(); requestAnimationFrame(tick); };
  const go = e => { const r = bar.getBoundingClientRect(), t = a + Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (b - a); now.over = false; $('cpg').hidden = true; v.currentTime = Math.min(t, b - .1); };
  bar.addEventListener('pointerdown', e => { bar.setPointerCapture(e.pointerId); go(e); });
  bar.addEventListener('pointermove', e => { if (e.buttons) go(e); });
  v.addEventListener('loadedmetadata', () => { v.playbackRate = now.rate; v.currentTime = a; v.play().catch(() => {}); }, { once: true });
  v.addEventListener('ended', end);
  v.addEventListener('click', () => actions.segtoggle());
  v.addEventListener('play', () => wrap.classList.add('playing'));
  v.addEventListener('pause', () => wrap.classList.remove('playing'));
  window.posePlay(v, $('cpc'), T, btn.dataset.mark);
  tick();
}
// the picture for a conclusion: moments from the video, and the whole climb as a strip
const climbed = T => { const a = T.moves[0]?.t0 ?? 0, b = T.moves[T.moves.length - 1]?.t ?? T.D; return T.S.filter(s => s.p && s.t >= a && s.t <= b); };
const bigArm = s => { const r = [s.el, s.er].filter(a => a != null); return r.length ? Math.max(...r) : null; }, footsSeen = s => Math.min(s.p[11][2], s.p[12][2]) > .7;
const mostBy = (l, f) => l.reduce((b, s) => f(s) > f(b) ? s : b);
function stretch(on, bad) {   // the longest run of samples that are all bad
  let best = null, cur = null;
  on.forEach(s => { if (bad(s)) { cur = cur ? [cur[0], s.t] : [s.t, s.t]; if (!best || cur[1] - cur[0] > best[1] - best[0]) best = cur; } else cur = null; });
  return best;
}
function band(T, tone) {   // tone(s): g, b or m. Neighbours of one tone become one block
  const on = new Set(climbed(T)), runs = [];
  T.S.forEach(s => { const k = on.has(s) ? tone(s) : ''; if (runs[0]?.k === k) runs[0].n++; else runs.unshift({ k, n: 1 }); });
  return `<div class="vz-b">${runs.reverse().map(r => `<i class="${r.k}" style="flex-grow:${r.n}"></i>`).join('')}</div>`;
}
const ticks = (T, label, keys) => `<div class="vz-r"><span>${label}</span><div>${T.moves.filter(m => keys.includes(m.k)).map(m => `<i style="left:${(m.t0 / T.D * 100).toFixed(1)}%"></i>`).join('')}</div></div>`;
const swatch = (c, l) => `<span><u class="${c}"></u>${l}</span>`;
// a simulated pose for the conclusion. Null when the body can't reach it or we can't see enough, and then the card shows no picture
function hipSim(T, part, on, isOff) {
  const l = part.filter(footsSeen); if (!l.length) return null;
  const s = mostBy(l, x => Math.abs(x.off)), back = on.find(x => x.t > s.t && x.t < s.t + 8 && !isOff(x) && footsSeen(x)), P = window.posePlan?.(T, 'hip', s, { back }); if (!P) return null;
  return { ...P, steps: P.foot ? [`${P.foot} foot to the spot you reached at ${mmss(back.t)}`, 'Your hips settle over your feet'] : ['Shift your hips over your feet'] };
}
function restSim(T, s) { const P = window.posePlan?.(T, 'rest', s); return P && { ...P, steps: [`Sink under the hold: this arm goes from ${P.was}° to ${P.now}°`] }; }
function feetSim(T, s, move) {
  const P = window.posePlan?.(T, 'feet', s, { move }); if (!P) return null;
  return { ...P, steps: [P.guess ? `${P.foot} foot up first` : `${P.foot} foot up first, to where it landed at ${mmss(P.when)}`, 'Stand up on it, then reach'], guess: P.guess };
}
const simBlock = m => `<div class="sim"><div class="sim-h"><b>How it could look</b><span><u></u>You<u class="l"></u>Simulated</span></div><canvas id="simc" width="640" height="640"></canvas>
  ${m.steps.length > 1 ? `<ol class="sim-s">${m.steps.map(x => `<li>${x}</li>`).join('')}</ol>` : `<p class="sim-o">${m.steps[0]}</p>`}
  <p class="sim-n">${m.guess ? 'Worked out from your body in this frame. We can’t see the holds, so the foot position is a guess.' : 'Worked out from your body in this frame. It’s a guide: we can’t see every hold.'}</p></div>`;
// one plain conclusion from what we measured: what stood out, a picture of it, what to do next, and where to see it
function takeaway(T) {
  const s = T.stats, on = climbed(T), say = (title, why, next, t, see, vis, span) => ({ title, why, next, t, see, vis, span });
  const isOff = x => Math.abs(x.off) >= .35, hips = x => isOff(x) ? 'b' : 'g', side = x => x.off < 0 ? 'Out to the left' : 'Out to the right';
  const rested = x => T.rests.some(r => x.t >= r.t0 && x.t < r.t1), moving = x => x.now || T.moves.some(m => x.t >= m.t0 && x.t <= m.t);
  if (s.moves < 3) { const clear = on.length ? mostBy(on, x => x.p.reduce((v, q) => v + q[2], 0)) : null;
    return say('Too little to judge', `We only saw ${n(s.moves, 'hand or foot move', 'hand and foot moves')} in this video.`, 'Film a whole try, from the first hold to where you stop.', s.first ?? clear?.t ?? 0, 'See it in the video', clear && { frames: [{ s: clear, tone: 'good', mark: 'none', title: 'We saw you here', sub: `In ${s.seen}% of this video` }] }); }
  if (s.longest && s.restStraight != null && s.restRead >= 50 && s.restStraight < 60) { const r = on.filter(x => rested(x) && bigArm(x) != null), lo = -bigArm(mostBy(r, x => -bigArm(x))), bad = mostBy(r, x => -bigArm(x)), good = mostBy(r, bigArm);
    return { sim: restSim(T, bad), ...say('Rest on straighter arms', '', 'At each rest, let one arm go straight and hang from it.', bad.t, 'See this rest', { frames: [{ s: good, tone: 'good', mark: 'arm', title: 'Your straightest rest', sub: 'You’ve done this' }, { s: bad, tone: 'bad', mark: 'arm', title: 'Your most bent rest', sub: `Arms at ${-lo}°` }],
      head: 'Your rests', share: `${s.restStraight}% on straight arms`, bar: band(T, x => !rested(x) || bigArm(x) == null ? 'm' : bigArm(x) > 145 ? 'g' : 'b'), keys: swatch('g', 'Straight') + swatch('b', 'Bent') + swatch('m', 'Moving') }, (rr => rr ? { a: rr.t0, b: rr.t1, mark: 'none', tone: 'bad' } : null)(T.rests.find(q => bad.t >= q.t0 && bad.t < q.t1))) }; }
  if (s.hipsOver < 60) { const hipX = x => (x.p[7][0] + x.p[8][0]) / 2, past = x => { const h = hipX(x), l = x.p[11][0], r = x.p[12][0]; return h < Math.min(l, r) || h > Math.max(l, r); };
    const outer = stretch(on, x => isOff(x) && past(x)), run = outer || stretch(on, isOff) || [s.far.t, s.far.t], part = on.filter(x => x.t >= run[0] && x.t <= run[1]), bad = mostBy(part, x => Math.abs(x.off)), sure = on.filter(footsSeen), good = mostBy(sure.length ? sure : on, x => -Math.abs(x.off));
    const right = part.reduce((v, x) => v + x.off, 0) > 0, last = part[part.length - 1], back = on.find(x => x.t > run[1] && !isOff(x));
    let then = 'They stayed out until the end of the climb.';
    if (back) { const dx = i => back.p[i][0] - last.p[i][0], ref = [5, 6, 11, 12].map(dx).sort((p, q) => Math.abs(p) - Math.abs(q))[0];   // the limb that moved least: the phone may have moved too
      const lf = dx(11) - ref, rf = dx(12) - ref, hip = hipX(back) - hipX(last) - ref, foot = Math.max(Math.abs(lf), Math.abs(rf));
      then = foot > 2 * Math.abs(hip) ? `At ${mmss(back.t)} your ${Math.abs(rf) > Math.abs(lf) ? 'right' : 'left'} foot moved across and your hips were back over your feet.` : `At ${mmss(back.t)} your hips came back over your feet.`; }
    return { sim: hipSim(T, part, on, isOff), ...say('Keep your hips over your feet', `${outer ? `Your hips stayed ${right ? 'right' : 'left'} of your feet` : `Your hips stayed out to the ${right ? 'right' : 'left'}`} from <button class="t-at num" type="button" ${clipAt(run[0], Math.max(run[1], run[0] + 2), 'hip')}>${mmss(run[0])}–${mmss(run[1])}</button>.<small class="tip-n">Not always a mistake: you may be hanging off a hold or setting up the next move.</small>`, `<span>${then}</span> <span>Did that feel planned, or were you stuck?</span>`, run[0], 'See this stretch', { frames: [{ s: good, tone: 'good', mark: 'hip', title: 'Hips centred', sub: 'For comparison' }, { s: bad, tone: 'bad', mark: 'hip', title: side(bad), sub: 'Furthest here' }],
      head: 'Whole climb', share: `${s.hipsOver}% centred`, bar: band(T, hips), keys: swatch('g', 'Centred') + swatch('b', 'Off to one side') + `<span>Longest off ${mmss(run[0])}–${mmss(run[1])}</span>` }, { a: run[0], b: Math.max(run[1], run[0] + 2), mark: 'hip', tone: 'bad' }), nextLabel: 'What happened next' }; }
  if (s.hands >= 5 && s.feet < s.hands * .6) { const hands = T.moves.filter(m => m.k[1] === 'w'), feet = T.moves.filter(m => m.k[1] === 'a'), led = h => feet.some(f => f.t0 <= h.t0 && h.t0 - f.t0 < 1.2), at = t => mostBy(on, x => -Math.abs(x.t - t));
    const yes = hands.find(led), no = hands.find(h => !led(h)), fr = [];
    if (yes) fr.push({ s: at(yes.t0), tone: 'good', mark: yes.k, title: 'Foot moved first', sub: 'Do this more' });
    if (no) fr.push({ s: at(no.t0), tone: 'bad', mark: no.k, title: 'Hand moved alone', sub: 'Try a foot first' });
    return { sim: no ? feetSim(T, at(no.t0), no) : null, ...say('Use your feet more', '', 'Move a foot up before each reach.', no?.t0 ?? s.first, 'See this move', { frames: fr, head: 'Hands and feet', share: `${s.hands} hand, ${s.feet} foot`, bar: ticks(T, 'Hands', ['lw', 'rw']) + ticks(T, 'Feet', ['la', 'ra']) }, no ? { a: Math.max(0, no.t0 - 1), b: no.t + 1, mark: 'none', tone: 'bad' } : null) }; }
  if (!s.longest) { const run = stretch(on, x => !moving(x)) || [s.first, s.first], still = mostBy(on, x => -Math.abs(x.t - (run[0] + run[1]) / 2)), secs = (run[1] - run[0]).toFixed(1);
    return say('Take a rest on the way', '', 'Pick one good hold and shake out each arm.', run[0], 'See this pause', { frames: [{ s: still, tone: 'good', mark: 'none', title: 'Your longest pause', sub: `${secs} s` }],
      head: 'Moving and pausing', share: `Longest pause ${secs} s`, bar: band(T, x => moving(x) ? 'm' : 'g'), keys: swatch('g', 'Pause') + swatch('m', 'Moving') }, { a: run[0], b: Math.max(run[1], run[0] + 2), mark: 'none', tone: 'good' }); }
  const rest = on.filter(x => x.t >= s.longest.t && x.t < s.longest.t + s.longest.s), calm = rest.filter(x => !isOff(x)), best = (calm.length || rest.length) ? mostBy(calm.length ? calm : rest, bigArm) : on[0], far = mostBy(on, x => Math.abs(x.off));
  const arms = s.restStraight != null && s.restRead >= 50;
  return { sim: isOff(far) ? hipSim(T, on.filter(isOff), on, isOff) : null, ...say('Good control', arms ? `Arms straight in ${s.restStraight}% of your rests, and hips over your feet for ${s.hipsOver}% of the climb.` : `Hips over your feet for ${s.hipsOver}% of the climb.`, 'Keep this up on the next route.', s.longest.t, 'See your best rest', { frames: [{ s: best, tone: 'good', mark: bigArm(best) == null ? 'hip' : 'arm', title: 'Your best rest', sub: `${s.longest.s.toFixed(1)} s` }, { s: far, tone: isOff(far) ? 'bad' : 'good', mark: 'hip', title: side(far), sub: isOff(far) ? 'Worth a look' : 'Still centred' }],
    head: 'Whole climb', share: `${s.hipsOver}% centred`, bar: band(T, hips), keys: swatch('g', 'Centred') + swatch('b', 'Off to one side') }, { a: s.longest.t, b: s.longest.t + s.longest.s, mark: 'none', tone: 'good' }) };
}
const seeBlock = v => `${v.frames.length ? `<div class="kf-g n${v.frames.length}">${v.frames.map((f, i) => `<button class="kf" type="button" ${clipNear(f.s.t, v.T, f.mark)}><span class="kf-i"><img alt="" data-kf="${i}"></span><b><span class="num">${mmss(f.s.t)}</span> <span>${f.title}</span></b><em>${f.sub}</em></button>`).join('')}</div>` : ''}
    ${v.bar ? `<div class="vz"><div class="vz-h"><b>${v.head}</b><span>${v.share}</span></div>${v.bar}<div class="vz-a num"><span>0:00</span><span>${mmss(v.T)}</span></div>${v.keys ? `<div class="vz-l">${v.keys}</div>` : ''}</div>` : ''}`;
// the frames come out of the video itself, one at a time, once the card is on the page
function kfWire(T, src) {
  const m = takeaway(T), v = m.vis, cv = $('simc');
  if (m.sim && cv) { const li = [...document.querySelectorAll('.sim-s li')]; window.poseSim(cv, src, T, m.sim, i => li.forEach((x, j) => x.classList.toggle('on', i < 0 || i === j))); }
  if (!v) return;
  document.querySelectorAll('img[data-kf]').forEach(im => { const f = v.frames[+im.dataset.kf]; window.poseStill(src, T, f.s, f.mark, f.tone).then(u => { if (u) im.src = u; }); });
}
// what we measured, each one with the moment it comes from
function measured(T) {
  const s = T.stats, row = (big, small, t, clip = clipNear(t, T.D)) => `<button class="row" type="button" ${clip}><span class="row-t"><strong>${big}</strong><span>${small}</span></span><span class="tl-go num">${mmss(t)} ›</span></button>`;
  const m = takeaway(T);
  if (m.vis) m.vis.T = T.D;
  const shown = (t0, t1 = t0) => (m.vis?.frames || []).some(f => f.s.t >= t0 - .5 && f.s.t <= t1 + .5);   // already a picture on the card
  const sp = m.span || { a: Math.max(0, m.t - 1), b: m.t + 2, mark: 'none' }, spa = sp.a, spb = Math.min(T.D, Math.max(sp.b, spa + 2));
  return `<div class="stack"><div class="lt"><span class="an-k1">The main thing</span><span class="lt-h">${m.title}</span>${m.why ? `<p class="tip-d">${m.why}</p>` : ''}${m.vis ? seeBlock(m.vis) : ''}${m.sim ? simBlock(m.sim) : ''}<p class="an-nx">${m.next}</p>
      ${m.vis?.frames.length ? '' : `<button class="b-ghost an-see" type="button" ${clipAt(spa, spb, sp.mark, m.t ?? spa)}>${m.see} · ${mmss(m.t ?? spa)}</button>`}</div></div>
    <div class="hl2 dk2"><h2>Also measured</h2></div>
    <div class="rows">${row(n(s.moves, 'hand or foot move', 'hand and foot moves'), `${s.hands} with a hand, ${s.feet} with a foot. Only the ones we’re sure of`, s.first)}
      ${s.longest && !shown(s.longest.t, s.longest.t + s.longest.s) ? row(`${s.longest.s.toFixed(1)} s`, 'Your longest rest', s.longest.t, clipAt(s.longest.t, Math.min(T.D, s.longest.t + Math.max(s.longest.s, 2)))) : ''}
      ${s.longest && s.low && s.restRead >= 50 ? row(`${s.low.a < 90 ? 'Very bent' : s.low.a < 145 ? 'Bent' : 'Straight'} · ${s.low.a}°`, 'Your arms at their most bent, resting. 180° is straight', s.low.t) : ''}
      ${s.far && !shown(s.far.t) ? row(s.far.left ? 'Out to the left' : 'Out to the right', 'Your hips, furthest from your feet', s.far.t, clipNear(s.far.t, T.D, 'hip')) : ''}</div>
    <p class="trs-l">We could see you in ${s.seen}% of this video. Tap a row to watch that moment.</p>`;
}
// arms: over the whole climb when we can read them; otherwise only at rests, the moments you hold still (the Summary uses the same)
const bodyStats = T => { const s = T.stats, all = s.armRead >= 30, rest = !all && s.restStraight != null && s.restRead >= 50;
  return `<div class="hl2 dk2"><h2>Your whole climb</h2></div><div class="stack"><div class="lt"><div class="an-g"><div><span>${rest ? 'Arms straight, resting' : 'Arms straight'}</span><b>${all ? `${s.armsStraight}%` : rest ? `${s.restStraight}%` : '—'}</b></div><div><span>Hips over feet</span><b>${s.hipsOver}%</b></div><div><span>Moving</span><b>${s.moving}%</b></div></div>
      <p class="an-n">Share of the time from your first move to your last, in this video.${all ? '' : rest ? ' Your arms only read clearly when you stop, so that one counts your rests.' : ' Too far from the camera to read your arms.'}</p>
      <dl class="an-def"><dt>Arms straight</dt><dd>Hanging on straight arms uses your skeleton, not your muscles, so you tire later.</dd>
        <dt>Hips over feet</dt><dd>Your weight is on your legs, which are stronger than your arms.</dd>
        <dt>Moving</dt><dd>The rest of the time you were still: reading the route, resting or stuck.</dd></dl></div></div>`; };
function drawTag(c) {
  const tg = $('tg'); if (!tg) return;
  const fix = tagS.id === c.id, pts = fix ? tagS.pts : c.auto, next = TAGS[tagS.i];
  tg.hidden = !fix && c.an !== 'ask';
  tg.classList.toggle('pick', fix);
  tg.innerHTML = (fix && next ? `<span class="tg-p">${next[2]}</span>` : '') + TAGS.filter(([k]) => pts?.[k]).map(([k]) => `<i class="tg-d" style="left:${pts[k].x * 100}%;top:${pts[k].y * 100}%"></i>`).join('');
  const s = $('tgs'); if (!s) return;
  s.hidden = !fix;
  s.innerHTML = TAGS.map(([k, l], j) => `<span class="${j < tagS.i ? 'on' : ''}">${l}</span>`).join('');
  $('tgt').textContent = fix ? 'Tap yourself' : 'Is this right?';
  $('tgx').textContent = fix ? (c.auto ? 'Tap your head, hands and feet on the video.' : 'We couldn’t find you here. Tap your head, hands and feet on the video.') : `Is this you on ${rname(ROUTES[c.ri])}?`;
  const go = $('tgb'), back = $('tgu');
  go.textContent = fix ? 'Done' : 'Looks right'; go.dataset.act = fix ? 'tagdone' : 'anok'; go.disabled = fix && tagS.i < TAGS.length;
  back.textContent = !fix ? 'Fix it' : tagS.i ? 'Undo' : 'Cancel'; back.hidden = fix && !tagS.i && !c.auto; back.dataset.act = fix ? 'tagundo' : 'tagstart';
}
function tagWire(c) {
  const tg = $('tg'); if (!tg) return;
  if (c.an === 'ask' && !c.auto && tagS.id !== c.id) tagS = { id: c.id, i: 0, pts: {} };
  tg.addEventListener('click', e => {
    if (tagS.id !== c.id || tagS.i >= TAGS.length) return;
    const b = tg.getBoundingClientRect();
    tagS.pts[TAGS[tagS.i][0]] = { x: (e.clientX - b.left) / b.width, y: (e.clientY - b.top) / b.height }; tagS.i += 1; drawTag(c);
    if (tagS.i === TAGS.length) $('tgb').scrollIntoView({ block: 'center' });
  });
  drawTag(c);
}
function confirmed(c, tags, again) { c.check = false; c.tags = tags; c.auto = tags; c.an = c.track ? 'done' : 'run'; tagS = { id: null, i: 0, pts: {} }; cTab = 'why'; if (again) analyse(c, tags); render(); document.querySelector('.screen').scrollTo(0, 0); }
// a link to a video that isn't here any more (imports don't survive a reload)
function lostClip() { page = 'videos'; arg = ''; history.replaceState(null, '', '#/videos'); return viewVideos(); }
// the others on this route, for the Compare tab and the route page: what Spotter counted in each video
const peerLine = x => { const T = TRK[x.vid]; return `${x.top ? 'Topped' : 'Didn’t top'} · ${T ? `${mmss(climbS(T))} climbing · ${n(T.stats.moves, 'move', 'moves')}` : x.len} · ${dayLabel(x.ago)}`; };
function viewClip(id) {
  const c = byId(id);
  if (!c) return lostClip();
  const r = ROUTES[c.ri], lv = vidOf(c), T = c.track, peers = peersOn(c.ri);
  needTracks(peers);
  const state = c.an === 'done' && T ? 'done' : c.an === 'ask' ? 'ask' : 'run', two = state === 'done';
  const pct = Math.round((c.pct || 0) * 100);
  const runCard = `<div class="stack"><div class="lt"><span class="lt-h">Analysing your climb <span class="num" id="anp">${pct}%</span></span>
      <p class="an-n">Going through the whole video, following your hands, feet, elbows and hips. You can leave this page.</p><i class="an-run"><em id="anb" style="width:${pct}%"></em></i></div></div>`;
  const askCard = `<div class="stack"><div class="lt tgc"><span class="lt-h" id="tgt"></span><p class="an-n" id="tgx"></p>
      <div class="tg-s" id="tgs" hidden></div>
      <div class="tg-a"><button class="b-ghost" type="button" id="tgu" data-i="${c.id}"></button><button class="b-lime" type="button" id="tgb" data-i="${c.id}"></button></div></div></div>`;
  const room = (document.querySelector('.screen')?.clientHeight || 874) - (two ? 300 : state === 'ask' ? 348 : 280);
  const vh = Math.max(280, Math.min(two ? 520 : 560, room));
  // what the video shows right now, as it plays: in Body, above the timeline
  const live = two ? `<div class="lv-s${T.stats.armRead >= 30 ? '' : ' n2'}"><div><span>Hand and foot moves</span><b id="tl-moves">—</b></div>${T.stats.armRead >= 30 ? '<div><span>Arms now</span><b id="tl-arms">—</b></div>' : ''}<div><span>Hips now</span><b id="tl-hips">—</b></div></div>${T.stats.armRead >= 30 ? '<p class="lv-k">Arms: 180° is straight. Under 145° counts as bent.</p>' : ''}` : '';
  // Compare: everyone else filmed on this route, each one a tap from side by side
  const cmp = `<div class="hl2 dk2"><h2>Same route, other climbers</h2><span class="hint2">${n(peers.length, 'video', 'videos')}</span></div>
    <div class="rows">${peers.map(x => `<button class="row fr-p" type="button" data-act="to" data-to="vs/${c.id}-${x.i}"><span class="fr-f">${avatar(x.who)}</span><span class="row-t"><strong>${x.who}</strong><span>${peerLine(x)}</span></span>${ic.arr('#111111')}</button>`).join('')}</div>
    <p class="trs-l">Side by side, both from the first move, with what Spotter counted in each video.</p>`;
  // Info: the route, the gym, who sees it, the video itself
  const mine = mineOn(c.ri);
  const info = `
    <div class="hl2 dk2"><h2>Your tries on ${rname(r)}</h2></div>
    <div class="trs">${mine.map(x => `<button class="${x === c ? 'on' : ''}" type="button" data-act="to" data-to="clip/${x.id}"${x === c ? ' aria-current="true"' : ''} aria-label="Try ${tryOf(x)}, ${dayLabel(agoOf(x))}">
      <img src="img/${x.img}.jpg" alt=""><span class="shade"></span><b>Try ${tryOf(x)}</b><small>${topOf(x) ? 'Topped' : 'Not topped'} · ${dayLabel(agoOf(x))}</small></button>`).join('')}</div>
    <div class="hl2 dk2"><h2>Details</h2></div>
    <div class="rows">
      <div class="row"><span class="row-t"><strong>${sw(r)}${rname(r)}</strong><span>Route · read from the holds in frame</span></span><button class="pj" type="button" data-act="croute" data-i="${c.id}">Change</button></div>
      <div class="row"><span class="row-t"><strong>${gym.name} · ${dayLabel(agoOf(c))}</strong><span>${r.wall} · from where it was filmed</span></span></div>
      <div class="row"><span class="row-t"><strong>${c.hidden ? 'Only you' : 'Public'}</strong><span>${c.hidden ? 'Not in Community. Only you can see it' : 'In Community: climbers here can watch it and comment'}</span></span>
        <button class="vis${c.hidden ? ' off' : ''}" type="button" data-act="vhide" data-i="${c.id}" aria-pressed="${c.hidden}">${c.hidden ? `${ic.eyeOff}Hidden` : `${ic.eye}Public`}</button></div>
      ${c.hidden ? '' : `<button class="row" type="button" data-act="seepost" data-i="${c.id}"><span class="row-t"><strong>In Community</strong><span>${n(c.likes, 'like', 'likes')} · ${n(c.cm.length, 'comment', 'comments')}</span></span>${ic.arr('#111111')}</button>`}
      <button class="row" type="button" data-act="share" data-i="${c.id}"><span class="row-t"><strong>Share</strong><span>As a poster, with the route and gym on it</span></span>${ic.arr('#111111')}</button>
      ${c.track ? `<button class="row" type="button" data-act="retag" data-i="${c.id}"><span class="row-t"><strong>Tracking</strong><span>Wrong person followed? Show Spotter where you are</span></span></button>` : ''}
      <button class="row" type="button" data-act="vdel" data-i="${c.id}"><span class="row-t"><strong>Delete video</strong><span>It stays in your camera roll</span></span></button>
    </div>
    <div class="rows tg-r"><div class="row"><span class="row-t"><strong>Sample video</strong><span>${lv.credit}</span></span></div></div>`;
  const tabs = [['why', 'Summary'], ['body', 'Body'], ['cmp', 'Compare'], ['info', 'Info']];
  const tab = tabs.some(([k]) => k === cTab) ? cTab : 'why';
  const nextUp = `<div class="hl2 dk2"><h2>Next</h2></div><div class="rows">
      ${betaRow(c.ri, T)}
      <button class="row" type="button" data-act="ctab" data-v="cmp"><span class="row-t"><strong>Watch it next to someone else</strong><span>${n(peers.length, 'other climber', 'other climbers')} on ${rname(r)}</span></span>${ic.arr('#111111')}</button></div>`;
  const panels = two ? { why: `${measured(T)}${nextUp}`, body: `<div class="hl2 dk2"><h2>As it plays</h2></div>${live}${timeline(T)}${bodyStats(T)}`, cmp, info } : {};
  return { photo: c.img, fit: state === 'ask', after: () => {
      tagWire(c);
      const v = $('lvv'), box = v.parentElement;
      segClose(); anSheet = null; segStop = null; segT = T; v.addEventListener('play', () => $('cpv')?.pause());
      v.playbackRate = speed;
      if (two) { window.posePlay(v, $('lvc'), T); tlWire(); kfWire(T, v.currentSrc || v.src); stickWire(box, vh); followWire(box); }
      if (state === 'ask' && c.auto) v.currentTime = c.auto.t;
      v.addEventListener('play', () => box.classList.add('playing'));
      ['pause', 'ended'].forEach(e => v.addEventListener(e, () => box.classList.remove('playing')));
      v.addEventListener('click', () => v.paused ? v.play() : v.pause());
      // an analysed video plays as soon as the page opens (muted) and starts over at the end, so the readouts are always moving
      if (two && !seg) { const go = () => v.play().catch(() => {}); if (v.readyState >= 2) go(); else v.addEventListener('canplay', go, { once: true }); }
      if (two) v.addEventListener('ended', () => { if (segStop) return; v.currentTime = 0; v.play().catch(() => {}); });
    }, html: `
    ${bar(`${rname(r)} · try ${tryOf(c)}`)}
    <div class="lv-w${two ? ' two' : ''}"><div class="clip vp lv${state === 'run' ? ' busy' : ''}" style="aspect-ratio:${lv.ar.toFixed(4)};width:min(100%, ${Math.round(vh * lv.ar)}px)">
      <video id="lvv" src="video/${lv.vid}.mp4" poster="img/${lv.img}0.jpg" muted playsinline preload="auto"></video><canvas id="lvc"></canvas>
      <button class="play-b" type="button" data-act="lvplay" aria-label="Play the video">${ic.play}</button>
      <div class="tg" id="tg" hidden></div>
      <span class="clip-l"><span class="pk-tag">${sw(r)}${rname(r)} · try ${tryOf(c)}</span>
        <span>${dayLabel(agoOf(c))} · ${gym.name} · ${c.len} · ${topOf(c) ? 'topped' : 'not topped'}</span></span></div></div>
    <div class="fold"></div>
    ${state === 'run' ? runCard : state === 'ask' ? askCard : `
      <div class="fchips ctabs">${tabs.map(([k, l]) => `<button type="button" data-act="ctab" data-v="${k}" aria-pressed="${k === tab}">${l}</button>`).join('')}</div>
      ${tabs.map(([k]) => `<div class="pn" data-pn="${k}"${k === tab ? '' : ' hidden'}>${panels[k]}</div>`).join('')}`}` };
}

/* ---------- Side by side: your try and someone else's on the same route ---------- */
// both start a moment before their first move and play together. Each video follows its climber, zoomed in, since the wall is tall.
// The numbers are counted from the two scans: from the first move to the last
const vsRow = (label, a, b) => `<div class="pv-nr vs-r"><span>${label}</span><b class="num">${a}</b><b class="num">${b}</b></div>`;
function vsNums(T) { const s = T.stats, t = climbS(T); return { t, hands: s.hands, feet: s.feet, fph: s.hands ? s.feet / s.hands : 0, hips: s.hipsOver, moving: s.moving }; }
// the one thing to try next time, from the gap between the two scans that matters most
function vsTip(a, b, who, top) {
  if (b.fph - a.fph >= .15) return `${who} moved a foot ${b.fph.toFixed(1)} times for every hand move, you ${a.fph.toFixed(1)}. Step your feet up before you reach: legs push, arms only hold.`;
  if (b.hips - a.hips >= 8) return `${who} kept their hips over their feet for ${b.hips}% of the climb, you for ${a.hips}%. When your hips drift to one side, your arms take the weight.`;
  if (top && a.moving - b.moving >= 10) return `You were moving ${a.moving}% of the time, ${who} ${b.moving}%. ${who} stopped more to look up and pick the next hold.`;
  if (top && a.t - b.t >= 10) return `${who} climbed it in ${mmss(b.t)}, you in ${mmss(a.t)}. Watch where they go straight on and where you go back.`;
  return `Your numbers are close to ${who}’s. Watch the two side by side, slowed down, and look at where each foot goes.`;
}
let pv = null;
function viewVs(a) {
  const [id, k] = String(a).split('-').map(Number), c = byId(id), x = V[k];
  if (!c || !x || x.ri !== c.ri || x.who === 'You') return lostClip();
  const r = ROUTES[c.ri], peers = peersOn(c.ri), T = c.track, P = TRK[x.vid];
  needTracks(peers);
  const ready = T && P, A = ready && vsNums(T), B = ready && vsNums(P);
  const cmpTop = topOf(c) && x.top;
  const notes = [!x.top && `${x.who}’s video ends before the top, so their time is for less of the route.`, !topOf(c) && 'Your video ends before the top, so your time is for less of the route.'].filter(Boolean);
  return { after: () => { if (ready) vsWire(c, x); else if (!T) setTimeout(() => { if (page === 'vs' && arg === a) render(); }, 800); }, html: `
    ${bar(`You and ${x.who}`)}
    <div class="vsp"><div class="stack"><div class="lt">
      <span class="an-c">${sw(r)}${rname(r)} · ${gym.name}</span>
      <div class="pv"><figure><span class="pv-b" style="aspect-ratio:${vidOf(c).ar}"><video id="pv0" src="video/${vidOf(c).vid}.mp4" poster="img/${c.img}0.jpg" muted playsinline preload="auto"></video><canvas id="pc0"></canvas></span><figcaption><i class="you"></i>You · try ${tryOf(c)}${topOf(c) ? ' · topped' : ''}</figcaption></figure>
        <figure><span class="pv-b" style="aspect-ratio:${x.ar}"><video id="pv1" src="video/${x.vid}.mp4" poster="img/${x.img}0.jpg" muted playsinline preload="auto"></video><canvas id="pc1"></canvas></span><figcaption><i class="them"></i>${x.who}${x.top ? ' · topped' : ''}</figcaption></figure></div>
      <div class="pv-ctl"><button class="b-lime pv-go" type="button" id="pvg" data-act="pvplay"${ready ? '' : ' disabled'}>${ic.play}${ready ? 'Play side by side' : T ? 'Loading…' : 'Waiting for your analysis…'}</button>
        <button class="pv-x" type="button" id="pvs" data-act="pvslow" aria-pressed="false">0.5×</button></div>
      ${ready ? `<div class="pv-t"><b>Try next time</b><span>${vsTip(A, B, x.who, cmpTop)}</span></div>
      <div class="pv-n"><div class="pv-nr vs-r vs-h"><span></span><b><i class="you"></i>You</b><b><i class="them"></i>${x.who}</b></div>
        ${vsRow('Climbing time', mmss(A.t), mmss(B.t))}
        ${vsRow('Hand moves', A.hands, B.hands)}
        ${vsRow('Foot moves', A.feet, B.feet)}
        ${vsRow('Feet per hand move', A.fph.toFixed(1), B.fph.toFixed(1))}
        ${vsRow('Hips over feet', `${A.hips}%`, `${B.hips}%`)}
        ${vsRow('Moving', `${A.moving}%`, `${B.moving}%`)}</div>
      <p class="an-n"><span>Counted by Spotter from both videos, from the first move to the last.</span>${notes.map(s => ` <span>${s}</span>`).join('')}</p>` : ''}
    </div></div>
    ${peers.length > 1 ? `<div class="hl2 dk2"><h2>Compare with someone else</h2></div>
      <div class="fchips">${peers.map(p => `<button type="button" data-act="to" data-to="vs/${c.id}-${p.i}" aria-pressed="${p === x}">${p.who}</button>`).join('')}</div>` : ''}
    </div>` };
}
function vsWire(c, x) {
  const a = $('pv0'), b = $('pv1'); if (!a || !b) return;
  const TA = c.track, TB = TRK[x.vid], a0 = Math.max(0, span(TA)[0] - .5), b0 = Math.max(0, span(TB)[0] - .5);
  pv = { a, b, a0, b0, la: climbS(TA) + 1, lb: climbS(TB) + 1, on: false };
  window.posePlay(a, $('pc0'), TA, 'none'); window.posePlay(b, $('pc1'), TB, 'none');
  const home = (v, t) => { if (v.readyState) v.currentTime = t; else v.addEventListener('loadedmetadata', () => { v.currentTime = t; }, { once: true }); }; home(a, a0); home(b, b0);
  // each video follows its own climber, zoomed in; where the scan can't see them, it stays where they were last seen
  [[a, $('pc0'), TA], [b, $('pc1'), TB]].forEach(([v, cv, Tr]) => {
    let cx = .5, cy = .6; const Z = 1.9, cl = q => Math.min(1 - .5 / Z, Math.max(.5 / Z, q));
    const step = () => { if (!v.isConnected) return; const p = window.poseBox?.(Tr, v.currentTime);
      if (p) { cx += (cl((p.x0 + p.x1) / 2) - cx) * .12; cy += (cl((p.y0 + p.y1) / 2) - cy) * .12; }
      const tf = `translate(${(50 - Z * cx * 100).toFixed(2)}%, ${(50 - Z * cy * 100).toFixed(2)}%) scale(${Z})`;
      v.style.transformOrigin = cv.style.transformOrigin = '0 0'; v.style.transform = cv.style.transform = tf; requestAnimationFrame(step); };
    requestAnimationFrame(step); });
}
function pvPlay() {
  if (!pv) return; const { a, b, a0, b0, la, lb } = pv, label = t => { const g = $('pvg'); if (g) g.innerHTML = `${ic.play}${t}`; };
  const done = (v, end) => v.ended || v.currentTime >= end - .1, over = () => done(a, a0 + la) && done(b, b0 + lb);
  if (pv.on) { a.pause(); b.pause(); pv.on = false; label('Play side by side'); return; }
  if (over()) { a.currentTime = a0; b.currentTime = b0; }
  pv.on = true; label('Pause both'); if (!done(a, a0 + la)) a.play().catch(() => {}); if (!done(b, b0 + lb)) b.play().catch(() => {});
  const tick = () => { if (!pv?.on || !a.isConnected) return; if (done(a, a0 + la)) a.pause(); if (done(b, b0 + lb)) b.pause(); if (over()) { pv.on = false; label('Watch again'); return; } requestAnimationFrame(tick); }; tick();
}

/* ---------- A route: your tries and everyone else's ---------- */
const betaRow = (ri, T) => { const B = betaOf(ri), me = T && stepsOf(T).steps.length - 1, k = B && B.steps.length - 1;
  return `<button class="row fr-p" type="button" data-act="rbeta" data-r="${ri}"><span class="fr-f">${avatar('Leo')}</span><span class="row-t"><strong>${T ? 'Your moves and the beta' : 'See the beta'}</strong>
    <span>${!B ? 'From how Leo topped it' : T ? `You: ${n(me, 'hand move', 'hand moves')} · Leo’s beta: ${k}` : `${n(k, 'hand move', 'hand moves')}, hold by hold · from how Leo topped it`}</span></span>${ic.arr('#111111')}</button>`; };
function viewRoute(a) {
  const i = +a, r = ROUTES[i];
  if (!r) return lostClip();
  const peers = peersOn(i), mine = mineOn(i), last = lastOn(i), tops = peers.filter(x => x.top).length;
  needTracks(peers);
  return { photo: r.img, html: `
    ${bar(rname(r))}
    <div class="clip"><img src="img/${r.img}.jpg" alt=""><span class="shade"></span>
      <span class="clip-l"><span class="pk-tag">${sw(r)}${rname(r)}</span><span>Top rope · ${r.wall} · ${gym.name}</span></span></div>
    <div class="fold"></div>
    <div class="hl2 dk2"><h2>Beta</h2></div>
    <div class="rows">${betaRow(i)}</div>
    <div class="hl2 dk2"><h2>Your tries</h2>${mine.length ? `<span class="hint2">${mine.some(topOf) ? 'topped' : 'not topped yet'}</span>` : ''}</div>
    ${mine.length ? `<div class="vg">${mine.slice().reverse().map(vtile).join('')}</div>`
      : '<div class="rows"><button class="row" type="button" data-act="film"><span class="row-t"><strong>Film a try</strong><span>Then watch it next to anyone below</span></span>' + ic.arr('#111111') + '</button></div>'}
    <div class="hl2 dk2"><h2>Climbers on it</h2><span class="hint2">${tops} of ${peers.length} topped</span></div>
    <div class="rows">${peers.map(x => `<div class="row fr-p"><button class="fr-f" type="button" data-act="to" data-to="person/${x.who}" aria-label="${x.who}’s page">${avatar(x.who)}</button>
      <span class="row-t"><strong>${x.who}</strong><span>${peerLine(x)}</span></span>
      ${last ? `<button class="pj" type="button" data-act="to" data-to="vs/${last.id}-${x.i}" aria-label="Compare your try with ${x.who}">VS</button>` : `<button class="pj" type="button" data-act="fwatch" data-v="${x.i}">Watch</button>`}</div>`).join('')}</div>
    <p class="cap"><span>${last ? `VS puts your latest try, try ${tryOf(last)}, next to theirs.` : 'Film or import a try on this route to compare it with theirs.'}</span> <span>Routes get reset: this one is on the wall as long as the gym keeps it.</span></p>` };
}

/* ---------- The gym ---------- */
function viewGym(a) {
  if (+a > 0 && gyms[+a]) return viewOtherGym(+a);
  const op = gymOpen(gym), today = gym.hours[new Date().getDay()];
  const pics = [gym.img, ...gym.pics];
  return { photo: 'gym-arc-3', html: `
    ${bar(gym.name)}
    <p class="sub-w"><span>${op.line}</span> · <span>${gym.dist}</span></p>
    <div class="fold"></div>
    <div class="gy-car" id="gycar">${pics.map(p => `<img src="img/${p}.jpg" alt="">`).join('')}</div>
    <div class="gy-dots" id="gydots">${pics.map((_, k) => `<i${k ? '' : ' class="on"'}></i>`).join('')}</div>
    <div class="hl2 dk2"><h2>Routes with videos</h2><span class="hint2">rope wall</span></div>
    <div class="rows">${ROUTES.map((r, i) => `<button class="row" type="button" data-act="to" data-to="route/${i}"><span class="row-t"><strong>${sw(r)}${rname(r)}</strong><span>${n(peersOn(i).length, 'climber', 'climbers')} filmed it${mineOn(i).length ? ` · ${n(mineOn(i).length, 'try', 'tries')} of yours` : ''}</span></span>${ic.arr('#111111')}</button>`).join('')}</div>
    <p class="cap">Only routes someone has filmed with Spotter. Routes get reset, so the wall may look different today.</p>
    <div class="rows"><button class="row" type="button" data-act="to" data-to="session">${ic.pen}<span class="row-t"><strong>Climb here now</strong><span>Film a try or log one, with the session clock</span></span>${ic.arr('#111111')}</button>
      <button class="row" type="button" data-act="plan" data-g="0"><span class="row-t"><strong>Plan a session here</strong><span>Your friends see it and can join</span></span>${ic.arr('#111111')}</button></div>
    <div class="gy-ab gy-wh">
      <div class="gy-ad">${ic.pin}<span><b>${gym.addr}</b><span>${gym.dist}</span></span><button class="gy-cp" type="button" data-act="gycopy" aria-label="Copy the address">Copy</button></div>
      <a class="gy-ad gy-web" href="https://${gym.src}" target="_blank" rel="noopener"><span><b>${gym.src}</b><span>Membership, belay class and hours</span></span><span aria-hidden="true">↗</span></a></div>
    <div class="gy-ab">
      <div class="gy-sh">Hours</div>
      ${weekHours(gym)}
      <div class="gy-sh">Here</div><div class="gy-has">${gym.has.map(h => `<span>${h}</span>`).join('')}</div>
      <p class="cap"><span>${gym.note}</span> <span>From ${gym.src}, Nov 2026.</span></p></div>`, after: carWire };
}

/* ---------- Community: every public video from this gym, one at a time ---------- */
// other people's posts: the videos are real, the words around them are sample
const SAY = {
  'wayup-p8-green': ['Second lap today, kept it slow', 24, [['Kai', 'Smooth top out'], ['Leo', 'That rest at the bulge though', 38]]],
  'wayup-p8-orange': ['Came off near the top again. Next time', 11, [['Sam', 'Same spot as me!']]],
  'wayup-p1-green': ['Took every rest I could find', 18, [['Noor', 'Patience pays', 120]]],
  'wayup-p1-orange': ['Pumped out up high', 9, [['Mia', 'The top is so sustained']]],
  'wayup-p3-green': ['Warm-up', 31, [['Noor', 'Warm-up?!']]],
  'wayup-p3-orange': ['Finally clipped the anchor on this one', 42, [['Kai', 'Huge!'], ['Sam', 'How did you do the last move?', 30]]],
  'wayup-p10-green': ['Trying to keep my feet quiet', 15, []],
  'wayup-p5-green': ['Lowered off before the top. Working on it', 13, [['Leo', 'Trust your feet in the middle, there are good holds low', 55]]],
  'wayup-p5-orange': ['Any tips for the middle section?', 7, [['Noor', 'Hips close to the wall, it’s less steep than it looks']]] };
const others = V.filter(x => x.who !== 'You').map(x => { const [note, likes, comments] = SAY[x.vid]; return { who: x.who, v: x.i, ago: x.ago, note, likes, comments }; });
const feedAll = () => [...clips.filter(c => !c.hidden).map(c => ({ who: 'You', v: c.v, c, ago: agoOf(c), note: '', likes: c.likes, comments: c.cm })), ...others].sort((p, q) => p.ago - q.ago);
const liked = new Set(), likeKey = p => `${p.who}/${V[p.v].vid}`;
const tokIc = {
  heart: '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.5S3.5 15.6 3.5 9.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.4c0 6.2-8.5 11.1-8.5 11.1Z"/></svg>',
  talk: '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4.5h16a1 1 0 0 1 1 1V17a1 1 0 0 1-1 1H9.5L4.6 21.6a.4.4 0 0 1-.6-.3V18a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z"/></svg>',
  save: '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3.5h12a1 1 0 0 1 1 1v16.2a.5.5 0 0 1-.8.4L12 16.6l-6.2 4.5a.5.5 0 0 1-.8-.4V4.5a1 1 0 0 1 1-1Z"/></svg>',
  share: '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 4.2 22 11.4l-8.5 7.2V14c-4.6 0-7.8 1.6-10.5 5.4.7-5.6 3.9-10.6 10.5-11.4Z"/></svg>' };
function feedPost(p, i) {
  const x = V[p.v], r = ROUTES[p.c ? p.c.ri : x.ri], on = liked.has(likeKey(p)), me = p.who === 'You', top = x.top, mine = lastOn(r === ROUTES[0] ? 0 : 1);
  const vs = !me && mine ? `<button class="ts-vs" type="button" data-act="to" data-to="vs/${mine.id}-${x.i}" aria-label="Compare with your try">VS</button>` : '';
  return `<article class="ts" data-i="${i}">
    <div class="ts-v fv" data-act="fvtap"><video src="video/${x.vid}.mp4" poster="img/${x.img}.jpg" muted playsinline loop preload="none" data-a="0" data-b="${x.D}" data-r="1"></video><span class="ed-p fv-p">${ic.play.replace('#111111', '#FFFFFF')}</span><span class="ts-big">${tokIc.heart}</span></div>
    <span class="ts-sh"></span>
    <div class="ts-rail"><span class="ts-av"><button class="ts-face" type="button" data-act="to" data-to="${me ? 'profile' : `person/${p.who}`}" aria-label="${me ? 'Your profile' : `${p.who}’s page`}">${avatar(p.who)}</button></span>
      <button type="button" data-act="flike" data-i="${i}" aria-pressed="${on}" aria-label="Like">${tokIc.heart}<span class="num">${p.likes + (on ? 1 : 0)}</span></button>
      <button type="button" data-act="fcm" data-i="${i}" aria-label="Comment">${tokIc.talk}<span class="num">${p.comments.length}</span></button></div>
    <div class="ts-c"><span class="ts-gym">${ic.pin.replace(/#2B2D2E|#111111/g, '#FFFFFF')}${gym.name}</span>
      <span class="ts-rt"><span class="ts-hold" style="background:${r.hex}" aria-label="${r.color} holds"></span><b class="ts-gr">${r.grade}</b>${top ? `<span class="ts-st on">${ic.check}Topped</span>` : ''}${vs}</span>
      <button class="ts-n" type="button" data-act="to" data-to="${me ? `clip/${p.c.id}` : `person/${p.who}`}"><strong>${p.who} ${top ? 'topped' : 'climbed'} ${rname(r)}</strong></button><span class="ts-w"><span>${r.wall} · ${dayLabel(p.ago)}</span> · <span class="num">${x.len}</span></span>
      ${p.note ? `<p>${p.note}</p>` : ''}<small>${x.credit}</small></div>
    <i class="ts-p"><b></b></i>
  </article>`;
}
// where the post's video is now (null if it hasn't played): a comment can point at that moment
const cmNow = i => { const v = document.querySelector(`.ts[data-i="${i}"] video`); if (!v) return null; const s = v.currentTime - (+v.dataset.a || 0); return s > .5 ? s : null; };
const CM_QUICK = ['Nice send!', 'What was the beta at the top?', 'Trust your feet', 'Same route tomorrow?'];
let cmAt = true;
function feedComments(i, draft = '') {
  const p = feedAll()[i], now = cmNow(i);
  pane(`<h2>${n(p.comments.length, 'comment', 'comments')}</h2>
    <div class="tcm">${p.comments.length ? p.comments.map(([w, t, s]) => `<div class="cm"><p><b>${w}</b> ${s != null ? `<button class="cm-t num" type="button" data-act="cmt" data-i="${i}" data-t="${s}">${mmss(s)}</button> ` : ''}${t}</p>${w === 'You' ? '' : `<button class="cm-r" type="button" data-act="cmreply" data-i="${i}" data-w="${w}">Reply</button>`}</div>`).join('') : '<p class="hint">Be the first to comment.</p>'}</div>
    <div class="cm-q">${CM_QUICK.map(q => `<button type="button" data-act="cmq" data-i="${i}">${q}</button>`).join('')}</div>
    ${now != null ? `<button class="cm-at" type="button" data-act="cmat" data-i="${i}" aria-pressed="${cmAt}">${cmAt ? ic.check : ''}At ${mmss(now)} in the video</button>` : ''}
    <div class="cm-row"><input type="text" placeholder="Add a comment" aria-label="Comment on ${p.who}’s climb" data-cm="${i}" value="${esc(draft)}"><button type="button" data-act="cm" data-i="${i}">Send</button></div>`);
  if (draft) { const inp = ask.querySelector('[data-cm]'); inp.focus(); inp.setSelectionRange(draft.length, draft.length); }
}
function feedLike(post, on) { const b = post.querySelector('[data-act=flike]'), p = feedAll()[+b.dataset.i], k = likeKey(p); on ? liked.add(k) : liked.delete(k);
  b.setAttribute('aria-pressed', on); b.querySelector('span').textContent = p.likes + (on ? 1 : 0); pop(b, on); }
function pop(b, on) { b.classList.remove('pop'); if (!on) return; void b.offsetWidth; b.classList.add('pop'); }
let feedAt = 0, tapT = null;
const TOK_FAR = .16, TOK_FLICK = .35, TOK_EDGE = .3;   // a drag of 16% of the screen, or a flick of .35 px/ms, turns the page; past the first and last post the drag gives 30%
function feedStop() { document.querySelectorAll('.fv video').forEach(v => v.pause()); }
function feedWire() {
  const tok = $('tok'), track = $('tokin'), ts = [...track.children], last = ts.length - 1, calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const H = () => tok.clientHeight, zoom = () => tok.getBoundingClientRect().height / H() || 1;   // the phone can be drawn smaller than its real size
  ts.forEach(t => { const v = t.querySelector('video'); if (!v) return;
    const a = +v.dataset.a, b = +v.dataset.b, box = v.parentElement, bar = t.querySelector('.ts-p b');
    v.defaultPlaybackRate = v.playbackRate = +v.dataset.r;
    v.dataset.src = v.getAttribute('src');
    v.addEventListener('loadedmetadata', () => { v.currentTime = a; v.playbackRate = +v.dataset.r; });
    v.ontimeupdate = () => { if (v.currentTime >= b || v.currentTime < a - .3) v.currentTime = a; bar.style.transform = `scaleX(${(v.currentTime - a) / (b - a)})`; };
    v.onplay = () => box.classList.add('on'); v.onpause = () => box.classList.remove('on'); });
  const put = (y, ms) => { track.style.transition = ms ? `transform ${ms}ms cubic-bezier(.2, .85, .25, 1)` : 'none'; track.style.transform = `translate3d(0, ${-y}px, 0)`; };
  // only this post and its neighbours keep a video loaded. The others are emptied, because every loaded video holds a
  // connection open and the browser allows only about six to one server: past that, new posts never load and show only their picture
  const keep = v => { if (!v.getAttribute('src')) { v.src = v.dataset.src; v.preload = 'auto'; v.load(); } };
  const drop = v => { if (v.getAttribute('src') && (v.readyState || v.networkState === 2)) { v.pause(); v.removeAttribute('src'); v.preload = 'none'; v.load(); } };
  const show = i => { feedAt = i; ts.forEach((t, k) => { const v = t.querySelector('video'); if (!v) return;
    if (Math.abs(k - i) > 1) return drop(v);
    keep(v);
    if (k === i) { if (!calm) v.play().catch(() => {}); return; }
    v.pause(); delete v.dataset.stop; if (v.readyState) v.currentTime = +v.dataset.a;
    if (v.preload !== 'auto') { v.preload = 'auto'; if (!v.readyState) v.load(); } }); };   // the next post is ready before you get there
  const goTo = (i, ms = 300) => { i = Math.max(0, Math.min(last, i)); put(i * H(), ms); if (i !== feedAt) show(i); };
  feedAt = Math.min(feedAt, last); put(feedAt * H(), 0); show(feedAt); tok.focus({ preventScroll: true });
  tok.onscroll = () => { tok.scrollTop = 0; };
  // drag, by finger or mouse. A click right after a drag is not a tap
  let d = null, dragged = false;
  tok.onpointerdown = e => { if (!e.button) d = { id: e.pointerId, x: e.clientX, y: e.clientY, dy: 0, on: false, pts: [] }; };
  tok.onpointermove = e => { if (e.pointerId !== d?.id) return;
    const dx = e.clientX - d.x, dy = (e.clientY - d.y) / zoom();
    if (!d.on) { if (Math.hypot(dx, dy) < 6) return; if (Math.abs(dx) > Math.abs(dy)) { d = null; return; } d.on = true; tok.setPointerCapture(e.pointerId); tok.classList.add('drag'); }
    d.dy = dy; d.pts.push([e.timeStamp, dy]); while (d.pts.length > 2 && e.timeStamp - d.pts[0][0] > 100) d.pts.shift();
    const off = feedAt === 0 && dy > 0 || feedAt === last && dy < 0;
    put(feedAt * H() - (off ? dy * TOK_EDGE : dy), 0); };
  const end = keep => e => { if (e.pointerId !== d?.id) return; const x = d; d = null; if (!x.on) return;
    tok.classList.remove('drag'); dragged = true; setTimeout(() => { dragged = false; }, 60);
    const p = x.pts, dt = p.length > 1 ? p[p.length - 1][0] - p[0][0] : 0, v = dt ? (p[p.length - 1][1] - p[0][1]) / dt : 0;
    const fast = Math.abs(v) > TOK_FLICK && v * x.dy > 0 && Math.abs(x.dy) > 20;
    goTo(feedAt + (keep && (fast || Math.abs(x.dy) > H() * TOK_FAR) ? (x.dy < 0 ? 1 : -1) : 0), fast ? 240 : 320); };
  tok.onpointerup = end(true); tok.onpointercancel = end(false);
  tok.addEventListener('click', e => { if (dragged) { e.stopPropagation(); e.preventDefault(); } }, true);
  tok.ondragstart = e => e.preventDefault();
  // wheel and arrows: one post each. A trackpad keeps sending wheel events after the fingers lift, so the next page waits until they stop
  let turning = false, quiet = null;
  const turn = d => { if (!turning) goTo(feedAt + d); };
  tok.addEventListener('wheel', e => { e.preventDefault(); clearTimeout(quiet);
    if (!turning && Math.abs(e.deltaY) > 4) { turn(Math.sign(e.deltaY)); turning = true; }
    quiet = setTimeout(() => { turning = false; }, 140); }, { passive: false });
  tok.onkeydown = e => { const k = { ArrowDown: 1, ArrowUp: -1 }[e.key]; if (k) { e.preventDefault(); goTo(feedAt + k); } };
}
function viewFriends(a) {
  if (a === 'plan') return viewFriendsPlan();
  const top = `<div class="tok-top"><span class="tok-add-sp" aria-hidden="true"></span>${comTabs(false)}
    <button class="av sm" type="button" data-act="to" data-to="profile" aria-label="Your profile">${avatar('You')}</button></div>`;
  return { dark: true, tok: true, after: feedWire, html: `${top}<div class="tok" id="tok" tabindex="0"><div class="tok-in" id="tokin">${feedAll().map(feedPost).join('')}</div></div>` };
}

/* ---------- Someone else's page ---------- */
function viewPerson(who) {
  if (!PEOPLE.includes(who)) { page = 'friends'; arg = ''; history.replaceState(null, '', '#/friends'); return viewFriends(); }
  const vs = V.filter(x => x.who === who), all = feedAll();
  needTracks(vs);
  const tile = x => `<button class="vt" type="button" data-act="pvid" data-v="${x.i}" aria-label="Watch ${who} on ${rname(ROUTES[x.ri])}">
      <img src="img/${x.img}.jpg" alt=""><span class="shade"></span><span class="vt-t">${sw(ROUTES[x.ri])}${rname(ROUTES[x.ri])}</span><span class="vt-b">${x.top ? 'Topped' : 'Not topped'} · ${dayLabel(x.ago)}</span></button>`;
  const both = vs.filter(x => lastOn(x.ri));
  return { photo: vs[0].img, html: `
    ${bar('')}
    <div class="pp-h"><span class="pp-av">${avatar(who)}</span><div><h1 class="hl">${who}</h1><p class="sub-w"><span>Climbs at ${gym.name}</span> · <span>climbing for ${YRS[who]}</span></p></div></div>
    <div class="pp-a"><button class="${follows.has(who) ? 'b-glass' : 'b-lime'}" type="button" data-act="pfollow" data-w="${who}" aria-pressed="${follows.has(who)}">${follows.has(who) ? 'Following' : 'Follow'}</button></div>
    <div class="fold"></div>
    ${both.length ? `<div class="hl2 dk2"><h2>Routes you both climbed</h2><span class="hint2">side by side</span></div>
    <div class="rows">${both.map(x => `<button class="row" type="button" data-act="to" data-to="vs/${lastOn(x.ri).id}-${x.i}"><span class="row-t"><strong>${sw(ROUTES[x.ri])}${rname(ROUTES[x.ri])}</strong><span>Your try ${tryOf(lastOn(x.ri))} and ${who}’s</span></span>${ic.arr('#111111')}</button>`).join('')}</div>` : ''}
    <div class="hl2 dk2"><h2>Videos</h2><span class="hint2">${n(vs.length, 'video', 'videos')}</span></div>
    <div class="vg">${vs.map(tile).join('')}</div>
    <p class="hint">Sample person: the name and words are made up. The videos are real.</p>` };
}

/* ---------- Profile: how you're getting on, from your own videos ---------- */
function viewProfile() {
  const done = clips.filter(c => c.an === 'done' && c.track), tops = ROUTES.filter((r, i) => mineOn(i).some(topOf)).length;
  const prog = ROUTES.map((r, i) => [r, i, mineOn(i)]).filter(([, , cs]) => cs.length).map(([r, i, cs]) => `
    <button class="row" type="button" data-act="to" data-to="route/${i}"><span class="row-t"><strong>${sw(r)}${rname(r)}</strong>
      <span>${cs.map(c => `<span>Try ${tryOf(c)} ${topOf(c) ? 'topped' : 'not topped'}</span>`).join(' → ')}</span></span>${ic.arr('#111111')}</button>`).join('');
  // the body over your tries, oldest first: the same three numbers the analysis shows
  const trend = done.slice().sort((a, b) => agoOf(b) - agoOf(a) || a.id - b.id);
  const bars = (label, f) => `<div class="pf-t"><span>${label}</span>${trend.map(c => `<span class="pf-b"><i style="--h:${f(c.track.stats)}%"></i><b class="num">${f(c.track.stats)}%</b><small>${ROUTES[c.ri].color[0]}${tryOf(c)}</small></span>`).join('')}</div>`;
  const hid = clips.filter(c => c.hidden).length;
  return { photo: clips[0]?.img || 'gym-arc-1', html: `
    ${tabHead('Profile')}
    <div class="me"><span class="av">${avatar('You')}</span>
      <span class="row-t"><strong>You</strong><span>${gym.name} · top rope · ${n(follows.size, 'friend', 'friends')}</span></span></div>
    ${session === 'live' ? `<section class="recap solid"><span class="sub">Climbing now · ${gym.name}</span><b class="num" id="prclk">${clk(sesSecs())}</b><span class="sub">${n(dayLog(0).reduce((s, e) => s + e.tries, 0), 'try', 'tries')} · ${n(dayLog(0).filter(e => e.sent).length, 'send', 'sends')} today</span><button class="pr-end" type="button" data-act="lgend">End session</button></section>` : ''}
    <div class="fold"></div>
    <div class="lb">
      <div class="lt short"><span class="lt-h">On video</span><span class="mv"><b>${clips.length}</b><span class="mv-l">${clips.length === 1 ? 'try' : 'tries'}</span>${done.length < clips.length ? `<span class="mv-l">${done.length} analysed so far</span>` : ''}</span></div>
      <div class="lt short"><span class="lt-h">Topped</span><span class="mv"><b>${tops}<small>/${ROUTES.length}</small></b><span class="mv-l">routes with videos here</span></span></div>
    </div>
    ${prog ? `<div class="hl2 dk2"><h2>Your routes</h2></div><div class="rows">${prog}</div>` : '<p class="cap">Film or import a try and your progress shows up here.</p>'}
    ${trend.length > 1 ? `<div class="hl2 dk2"><h2>Your body, try by try</h2><span class="hint2">oldest first</span></div>
      <div class="stack"><div class="lt pf">${bars('Hips over feet', s => s.hipsOver)}${bars('Moving', s => s.moving)}
        <p class="an-n">From each analysed video, first move to last. G = Green, O = Orange, then the try.</p></div></div>` : ''}
    <div class="hl2 dk2"><h2>Logbook</h2><button class="gy-mapb" type="button" data-act="to" data-to="session">${session === 'live' ? 'Open the session' : 'Start a session'}</button></div>
    ${logbook()}
    <div class="stack">
      <button class="row" type="button" data-act="export"><span class="row-t"><strong>Export your log</strong><span>CSV with every attempt, send and video</span></span>${ic.down}</button>
    </div>
    <div class="hl2 dk2"><h2>You</h2></div>
    <div class="rows">
      <button class="row" type="button" data-act="to" data-to="watch"><span class="row-t"><strong>Watch</strong><span>${watch ? 'Connected · starts and stops each try' : 'Not connected'}</span></span>${ic.arr('#111111')}</button>
    </div>
    <div class="hl2 dk2"><h2>Who sees your videos</h2></div>
    <div class="rows">
      <div class="row"><span class="row-t"><strong>New videos</strong><span>${newPublic ? 'Public: in Community at ' + gym.name : 'Only you, until you make one public'}</span></span>
        <button class="vis${newPublic ? '' : ' off'}" type="button" data-act="newpub" aria-pressed="${!newPublic}">${newPublic ? `${ic.eye}Public` : `${ic.eyeOff}Hidden`}</button></div>
      ${hid ? `<div class="row"><span class="row-t"><strong>${n(hid, 'video', 'videos')} hidden</strong><span>Only you can see ${hid === 1 ? 'it' : 'them'}. Change it on each video</span></span></div>` : ''}
    </div>` };
}

/* ---------- Back from v8, in the v9 world: gyms and map, logging and the session clock, watch, reel, poster, export, friends ---------- */
// other gyms near the UIUC Main Quad, from their own websites (checked Nov 11, 2026). mi = straight-line distance from the Quad, deg = which way.
// Only ARC has routes in Spotter: no one has filmed at the others yet, so their pages are the gym's own info and nothing more
Object.assign(gym, { mi: 0.6, deg: 229, pass: null });
const gyms = [gym,
  { name: 'Boneyard Boulders', dist: '1.0 mi', mi: 1.0, deg: 310, addr: '119 E University Ave, Champaign', img: 'gym-boneyard-1', pics: ['gym-boneyard-2'],
    hours: Array(7).fill([12, 22]), pass: '$20 · $18 if 20 or under', has: ['Bouldering', 'Shoe rental $4', 'Free fitness classes', 'Same pass works at Urbana Boulders'], src: 'urbanaboulders.com' },
  { name: 'Urbana Boulders', dist: '2.0 mi', mi: 2.0, deg: 48, addr: '1502 N Cunningham Ave, Urbana', img: 'gym-urbana-1', pics: ['gym-urbana-2'],
    hours: [[10, 21], [15, 22], [15, 22], [15, 22], [15, 22], [12, 22], [10, 21]], pass: '$20 · $18 if 20 or under', has: ['Bouldering', 'Shoe rental $4', '200+ problems across both gyms', 'Same pass works at Boneyard Boulders'], src: 'urbanaboulders.com' },
  { name: 'Horizon Climbing', dist: '2.8 mi', mi: 2.8, deg: 278, addr: '1914 Round Barn Rd, Champaign', img: 'gym-horizon-1', pics: ['gym-horizon-2', 'gym-horizon-3', 'gym-horizon-4'],
    hours: [[10, 20], [10, 22], [10, 22], [10, 22], [10, 22], [10, 22], [10, 22]], pass: '$22 · $16 college students', has: ['Bouldering', 'Shoe rental $4', 'New climbs every week', 'Tension Board 2', 'Showers and sauna', 'Study space'], src: 'climbhorizon.com' },
  { name: 'Upper Limits Bloomington', dist: '49 mi', mi: 49, deg: 302, addr: '1304 W Washington St, Bloomington', img: 'gym-upperlimits-1', pics: ['gym-upperlimits-2', 'gym-upperlimits-3'],
    hours: [[10, 18], [12, 22], [16, 22], [16, 22], [16, 22], [12, 22], [10, 18]], pass: '$21 · $17 kids 10 and under', has: ['Bouldering', 'Top rope and auto belays', 'Outdoor silo wall', 'Fitness area'], src: 'upperlimits.com' }];

/* ---------- Gyms tab: where you climb, then the others near you. Map, and one page per gym ---------- */
const atGym = i => i === 0 ? { videos: clips.length, last: clips.length ? Math.min(...clips.map(agoOf)) : null } : { videos: 0, last: null };
function gymCard(g, i) {
  const a = atGym(i), what = a.videos ? `${n(a.videos, 'try', 'tries')} on video · ${n(ROUTES.length, 'route', 'routes')} with videos` : `${g.dist} · ${g.addr}`;
  const when = a.videos ? `${g.dist}${a.last !== null ? ` · last climbed ${dayLabel(a.last)}` : ''}` : gymOpen(g).line;
  return `<div class="gy">
      <button class="gy-main" type="button" data-act="to" data-to="gym/${i}">
        <img src="img/${g.img}.jpg" alt="">
        <span class="row-t"><strong>${g.name}</strong><span>${what}</span><span>${when}</span></span>
      </button>
      <button class="gy-go" type="button" data-act="gymaps" data-i="${i}" aria-label="Directions to ${g.name}">${ic.pin}Directions</button>
    </div>`;
}
function viewGymsTab() {
  const open = gyms.filter(g => gymOpen(g).open).length;
  return { photo: 'gym-arc-3', html: `
    ${tabHead('Gyms')}
    <p class="sub-w">Champaign · ${open ? `${open} open now` : 'all closed now'}</p>
    <div class="fold"></div>
    <div class="hl2 dk2"><h2>Where you climb</h2><span class="hint2">${clips.length ? 'your videos' : 'rope wall with videos'}</span></div>
    <div class="gy-list">${gymCard(gym, 0)}</div>
    <div class="hl2 dk2 gy-h"><h2>More near you</h2><button class="gy-mapb" type="button" data-act="to" data-to="gyms">${ic.pin}Map</button></div>
    <div class="gy-list">${gyms.slice(1).map((g, k) => gymCard(g, k + 1)).join('')}</div>
    <p class="cap">No one has filmed at these yet, so Spotter shows only what the gym publishes.</p>` };
}
// the map: Leaflet with OpenStreetMap tiles. You are on the UIUC Main Quad; each gym sits at its distance and bearing from there
let gymR = 10, gymPin = null, gmap = null;
const HERE = [40.1075, -88.2272], radii = [1, 5, 10, 50];
const gymLL = g => { const a = g.deg * Math.PI / 180; return [HERE[0] + g.mi * Math.cos(a) / 69, HERE[1] + g.mi * Math.sin(a) / (69 * Math.cos(HERE[0] * Math.PI / 180))]; };
const gymPinCard = (count = $('gmcard')?.dataset.count) => gymPin !== null ? `<div class="gy-list gm-card">${gymCard(gyms[gymPin], gymPin)}</div>`
  : `<p class="gm-hint"><span>${count}</span><span>Tap a gym on the map to see it.</span></p>`;
const gymPad = () => { const el = $('gmap'), c = $('gmcard'); if (el && c) el.style.setProperty('--gmb', `${c.offsetHeight + 34 + 8}px`); };
function drawGymMap(near) {
  if (gmap) { gmap.remove(); gmap = null; }
  const el = $('gmap');
  if (!el || !window.L) return;
  gmap = L.map(el, { zoomControl: false, zoomSnap: .25, scrollWheelZoom: false, attributionControl: true });
  L.control.zoom({ position: 'bottomright' }).addTo(gmap);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(gmap);
  L.circle(HERE, { radius: gymR * 1609.34, color: '#111111', weight: 1, dashArray: '4 4', fillColor: '#111111', fillOpacity: .04, interactive: false }).addTo(gmap);
  L.marker(HERE, { icon: L.divIcon({ className: 'gm-you', html: '<i></i>', iconSize: [18, 18] }), interactive: false, keyboard: false }).addTo(gmap);
  near.forEach(([g, i]) => {
    const pin = L.marker(gymLL(g), { title: `${g.name}, ${g.dist}`, icon: L.divIcon({ className: `gpin${i === 0 ? ' on' : ''}${i === gymPin ? ' sel' : ''}`, html: `<i></i><b>${g.name}</b>`, iconSize: null }) }).addTo(gmap);
    pin.on('click', () => {
      gymPin = gymPin === i ? null : i;
      el.querySelectorAll('.gpin').forEach(p => p.classList.remove('sel'));
      if (gymPin !== null) pin.getElement().classList.add('sel');
      $('gmcard').innerHTML = gymPinCard(); gymPad();
    });
  });
  gymPad();
  const top = $('gmtop').offsetHeight + 54, bot = $('gmcard').offsetHeight + 34;
  gmap.fitBounds(L.latLng(HERE).toBounds(gymR * 1609.34 * 2), { paddingTopLeft: [16, top], paddingBottomRight: [16, bot] });
}
function viewGyms() {
  const near = gyms.map((g, i) => [g, i]).filter(([g]) => g.mi <= gymR), count = near.length ? `${n(near.length, 'gym', 'gyms')} within ${gymR} mi` : `none within ${gymR} mi`;
  const top = `<div class="gm-row"><button class="bk" type="button" data-act="back" aria-label="Back">${ic.back}</button><div class="fchips">${radii.map(r => `<button type="button" data-act="gyr" data-v="${r}" aria-pressed="${r === gymR}">${r} mi</button>`).join('')}</div></div>`;
  return { bare: true, map: true, html: '', overlay: `<div class="gmap" id="gmap">${window.L ? '' : '<p class="gm-off">The map needs an internet connection. The list works without one.</p>'}</div>
    <div class="gm-top" id="gmtop">${top}</div><div class="gm-bot" id="gmcard" data-count="${count}">${gymPinCard(count)}</div>`, after: () => drawGymMap(near) };
}
// one gym that isn't ARC: only what the gym itself publishes
function viewOtherGym(i) {
  const g = gyms[i], op = gymOpen(g), today = g.hours[new Date().getDay()], pics = [g.img, ...g.pics];
  return { html: `
    ${bar(g.name)}
    <div class="gy-car" id="gycar">${pics.map(p => `<img src="img/${p}.jpg" alt="">`).join('')}</div>
    ${pics.length > 1 ? `<div class="gy-dots" id="gydots">${pics.map((_, k) => `<i${k ? '' : ' class="on"'}></i>`).join('')}</div>` : ''}
    <div class="gy-2"><div class="gy-t"><span class="${op.open ? 'on' : 'off'}">${op.open ? 'Open now' : 'Closed now'}</span><b class="num">${today ? `${clock(today[0])} – ${clock(today[1])}` : 'Closed today'}</b></div>
      <div class="gy-t"><span>Day pass</span><b>${g.pass.split(' · ')[0]}</b></div></div>
    <div class="gy-ab gy-wh">
      <div class="gy-ad">${ic.pin}<span><b>${g.addr}</b><button class="gy-lk" type="button" data-act="gymaps" data-i="${i}">Directions · ${g.dist} ↗</button></span>
        <button class="gy-cp" type="button" data-act="gycopy" data-i="${i}" aria-label="Copy the address">Copy</button></div>
      <a class="gy-ad gy-web" href="https://${g.src}" target="_blank" rel="noopener"><span><b>${g.src}</b><span>Waiver, passes and classes</span></span><span aria-hidden="true">↗</span></a></div>
    <div class="gy-ab">
      <div class="gy-sh">Hours</div>${weekHours(g)}
      <div class="gy-sh">Day pass</div><div class="gy-l gy-l1"><b>${g.pass}</b></div>
      <div class="gy-sh">Here</div><div class="gy-has">${g.has.map(h => `<span>${h}</span>`).join('')}</div>
      <p class="cap">From ${g.src}, Nov 2026.</p></div>
    <div class="rows"><div class="row"><span class="row-t"><strong>No videos from here yet</strong><span>Spotter’s routes and side by sides are at ${gym.name} for now.</span></span></div></div>
    <button class="b-lime gy-cta" type="button" data-act="plan" data-g="${i}">Plan a session here</button>`, after: carWire };
}
function carWire() {
  const car = $('gycar'), dots = $('gydots'); if (!car || !dots) return;
  car.addEventListener('scroll', () => { const k = Math.round(car.scrollLeft / (car.firstElementChild.offsetWidth + 8));
    [...dots.children].forEach((d, j) => d.classList.toggle('on', j === k)); }, { passive: true });
}

/* ---------- Scan a wall: photo a route, get its beta drawn on the photo ---------- */
// The beta is real: it is how Leo climbed that route, hold by hold, read from the scan of their video (they topped both routes,
// and the wall photos are frames of those videos, so every hold sits where the scan found a hand). Nothing is invented
// 5, 6, 11, 12 = where pose.js keeps the wrists and ankles in a saved scan
let scanRi = 0, scanShot = false, bstep = 0;
const stepsOf = T => {
  const at = (k, t) => { const q = T.S.filter(z => z.p).reduce((a, b) => Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a), i = { lw: 5, rw: 6, la: 11, ra: 12 }[k]; return [q.p[i][0] * 540, q.p[i][1] * 960]; };
  let steps = [];
  let feet = [];
  T.moves.forEach(m => { if (m.k === 'la' || m.k === 'ra') { feet.push({ k: m.k, pos: at(m.k, m.t) }); return; }
    steps.push({ hand: m.k, pos: at(m.k, m.t), feet, t: m.t }); feet = []; });
  // the climber walks in from the side before starting: hand positions far off the route's line, before the first one on it, are not holds
  const xs = steps.map(q => q.pos[0]).sort((p, q) => p - q), mid = xs[xs.length >> 1];
  while (steps.length > 2 && Math.abs(steps[0].pos[0] - mid) > 65) steps.shift();
  steps[0] = { ...steps[0], hand: 'B', feet: [] };
  return { steps, feet: T.moves.filter(m => (m.k === 'la' || m.k === 'ra') && m.t >= steps[0].t).length }; };
const betaOf = ri => { const x = V.find(q => q.who === 'Leo' && q.ri === ri), T = TRK[x.vid]; return T ? { x, T, ...stepsOf(T) } : null; };
// the beta opened from a route or from your analysis: no camera, so no Retake
let betaOnly = false;
function viewScan() {
  const r = ROUTES[scanRi], B = betaOf(scanRi), corners = '<path d="M24 80V24h56M460 24h56v56M516 880v56h-56M80 936H24v-56" fill="none" stroke="#FFFFFF" stroke-width="3"/>';
  needTracks(V.filter(q => q.who === 'Leo'));
  if (!scanShot) return { html: `
    ${bar('Scan a wall')}
    <div class="cam sc9">
      <img src="img/${r.img}.jpg" alt="The rope wall through the camera"><svg viewBox="0 0 540 960" aria-hidden="true">${corners}</svg>
      <p class="scan-aim">Fit one route in the frame, from the first hold to the top.</p>
      <button class="shut scan-shut" type="button" data-act="snap" aria-label="Take the photo"><i></i></button>
    </div>
    <div class="fchips sc-pick">${ROUTES.map((q, i) => `<button type="button" data-act="scanri" data-i="${i}" aria-pressed="${i === scanRi}">${sw(q)}${q.color} holds</button>`).join('')}</div>
    <p class="cap"><span>Spotter reads the hold colour, finds the route, and draws its beta on your photo.</span> <span>In this prototype, pick which route the camera is pointing at.</span></p>` };
  if (!B) return { html: `${bar('Scan a wall')}<div class="stack"><div class="lt"><span class="lt-h">Reading the wall</span><p class="an-n">Finding the holds and the route.</p></div></div>` };
  const N = B.steps.length - 1, st = B.steps[bstep], prev = B.steps[Math.max(0, bstep - 1)], pt = q => `${q[0].toFixed(0)} ${q[1].toFixed(0)}`;
  const hn = { lw: 'Left hand', rw: 'Right hand', B: 'Both hands' }, fn = { la: 'left foot', ra: 'right foot' };
  const svg = `<svg viewBox="0 0 540 960" aria-hidden="true">
      <path d="M${B.steps.map(q => pt(q.pos)).join(' L')}" fill="none" stroke="rgba(221,242,106,.5)" stroke-width="3" stroke-dasharray="8 10"/>
      ${bstep ? `<path d="M${pt(prev.pos)} L${pt(st.pos)}" stroke="#DDF26A" stroke-width="6" stroke-linecap="round"/>` : ''}
      ${st.feet.map(q => `<rect x="${q.pos[0] - 11}" y="${q.pos[1] - 11}" width="22" height="22" rx="4" fill="#FFFFFF" stroke="#111111" stroke-width="2"/>`).join('')}
      ${B.steps.map((q, i) => { const on = i === bstep, done = i < bstep; return on ? '' : `<circle cx="${q.pos[0].toFixed(0)}" cy="${q.pos[1].toFixed(0)}" r="14" fill="${done ? 'rgba(221,242,106,.45)' : 'rgba(17,17,17,.55)'}" stroke="#DDF26A" stroke-width="3"/>`; }).join('')}
      <circle cx="${st.pos[0].toFixed(0)}" cy="${st.pos[1].toFixed(0)}" r="24" fill="#DDF26A" stroke="#111111" stroke-width="3"/>
      <text x="${st.pos[0].toFixed(0)}" y="${(st.pos[1] + 8).toFixed(0)}" text-anchor="middle" font-size="22" font-weight="700" fill="#111111">${bstep || 'S'}</text>
    </svg>`;
  const feet = st.feet.map(q => fn[q.k]);
  const title = bstep ? `${hn[st.hand]} to hold ${bstep}` : 'Start: both hands on';
  const how = !bstep ? 'Hands on the first holds, feet low. The numbers go up the wall in the order Leo used them.'
    : feet.length ? `First move your ${feet.join(', then your ')} (the white ${feet.length > 1 ? 'squares' : 'square'}). Then reach.` : 'Feet stay where they are. Just reach.';
  const hands = N, foots = B.feet;
  return { html: `
    ${bar(betaOnly ? `Beta · ${rname(r)}` : 'Scan a wall')}
    <div class="cam sc9">
      <img src="img/${r.img}.jpg" alt="${rname(r)} with its beta drawn on">${svg}
      <span class="pk-tag scan-tag">${sw(r)}${rname(r)} · ${n(hands, 'hand move', 'hand moves')}</span>
    </div>
    <section class="glass bst">
      <div class="bst-h"><span class="lt-h">${bstep ? `Move ${bstep} of ${N}` : 'Before you start'}</span>
        <span class="fr-ctl"><button type="button" data-act="bstep" data-d="-1" aria-label="Previous move"${bstep ? '' : ' disabled'}>‹</button><button type="button" data-act="bstep" data-d="1" aria-label="Next move"${bstep < N ? '' : ' disabled'}>›</button></span></div>
      <p class="bst-t">${title}</p><p class="bst-d">${how}</p>
    </section>
    <div class="lb">
      <div class="lt short"><span class="lt-h">Route</span><span class="mv"><b>${rname(r)}</b><span class="mv-l">read from the ${r.color.toLowerCase()} holds</span></span></div>
      <div class="lt short"><span class="lt-h">Beta</span><span class="mv"><b>${hands}<small> + ${foots}</small></b><span class="mv-l">hand and foot moves</span></span></div>
    </div>
    <div class="rows">
      <button class="row fr-p" type="button" data-act="fwatch" data-v="${B.x.i}"><span class="fr-f">${avatar('Leo')}</span><span class="row-t"><strong>This is how Leo climbed it</strong><span>Topped in ${mmss(climbS(B.T))} · read from their video. Watch it</span></span>${ic.arr('#111111')}</button>
      <button class="row" type="button" data-act="to" data-to="route/${scanRi}"><span class="row-t"><strong>Other climbers on ${rname(r)}</strong><span>${n(peersOn(scanRi).length, 'video', 'videos')} · your own way may differ</span></span>${ic.arr('#111111')}</button>
    </div><div class="sc-end"></div>`,
    cta: betaOnly ? `<button class="b-lime" type="button" data-act="film">${ic.rec}Film a try on it</button>` : `<button class="b-ghost" type="button" data-act="rescan">Retake</button><button class="b-lime" type="button" data-act="film">${ic.rec}Film a try on it</button>` };
}

/* ---------- Logging by hand and the session clock ---------- */
// a climb with no video: logged here. Your videos count too: every try on video is an attempt on its day, and a topped one is a send
const logs = user === 'regular' ? [{ ago: 9, ri: 0, tries: 2, sent: false }, { ago: 7, ri: 0, tries: 1, sent: false }, { ago: 5, ri: 1, tries: 2, sent: false }] : [];
const logOf = (ago, ri) => logs.find(l => l.ago === ago && l.ri === ri) || (logs.push({ ago, ri, tries: 0, sent: false }), logs[logs.length - 1]);
// one day: per route, attempts (by hand + on video), sent and how
function dayLog(ago) {
  return ROUTES.map((r, ri) => { const l = logs.find(x => x.ago === ago && x.ri === ri), cs = clips.filter(c => agoOf(c) === ago && c.ri === ri);
    const tries = (l?.tries || 0) + cs.length, sent = !!l?.sent || cs.some(topOf);
    return { r, ri, tries, sent, style: l?.style || (sent ? (tries <= 1 ? 'Flash' : 'Redpoint') : ''), hand: !!l && !cs.length, cs, l }; }).filter(e => e.tries || e.sent);
}
const logDays = () => [...new Set([...logs.filter(l => l.tries || l.sent).map(l => l.ago), ...clips.map(agoOf), ...glogs.map(x => x.ago)])].sort((a, b) => b - a);
let session = 'none', lgStart = null, sesDur = 0, bookAt = 0;
const sesSecs = () => session === 'live' && lgStart ? Math.floor((Date.now() - lgStart) / 1000) : sesDur;
const clk = s => s < 3600 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')} h`;
let clockNote = false;
const lgClock = () => { if (session !== 'live') { session = 'live'; lgStart = Date.now(); sesDur = 0; island(); clockNote = true; setTimeout(() => { if (clockNote) toast(''); }, 0); } };
function island() {
  const el = document.querySelector('.island'), live = session === 'live', now = clk(sesSecs());
  el.classList.toggle('live', live);
  el.innerHTML = live ? `<i></i><b class="num">${now}</b>` : '';
  live ? el.setAttribute('data-act', 'island') : el.removeAttribute('data-act');
  el.setAttribute('aria-label', live ? `Climbing at ${gym.name}, ${now}. Open the session` : '');
}
setInterval(() => { if (session !== 'live') return; island(); ['lgclk', 'prclk', 'pnclk'].forEach(id => { const l = $(id); if (l) l.textContent = clk(sesSecs()); }); }, 1000);
const gbook = (gd, ago) => gd.length ? `<button class="lgb-r" type="button" data-act="to" data-to="${ago === 0 ? 'session' : 'videos'}"><span class="row-t"><strong>By grade</strong><span>${gwhere(gd)} · ${gline(gd)}</span></span>
      <span class="lgb-v${gd.some(gsent) ? ' on' : ''}">${gd.some(gsent) ? `${ic.check}${n(gd.filter(gsent).length, 'send', 'sends')}` : n(gd.length, 'attempt', 'attempts')}</span></button>` : '';
function logbook() {
  const days = logDays(); if (page === 'session') bookAt = 0; else if (!days.includes(bookAt)) bookAt = days.includes(0) || !days.length ? 0 : days[0];
  const es = dayLog(bookAt), gd = gday(bookAt), sends = es.filter(e => e.sent).length + gd.filter(gsent).length, att = es.reduce((s, e) => s + e.tries, 0) + gd.length;
  const prev = days.find(k => k > bookAt), next = days.filter(k => k < bookAt).pop() ?? (bookAt > 0 ? 0 : undefined);
  return `<section class="lgb">
    <div class="lgb-d"><button type="button" data-act="bkd" data-k="${prev ?? ''}"${prev == null ? ' disabled' : ''} aria-label="Day before">${ic.back}</button>
      <span><b>${dateOf(bookAt).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}</b><span>${bookAt === 0 ? 'Today' : bookAt === 1 ? 'Yesterday' : `${bookAt} days ago`}</span></span>
      <button type="button" data-act="bkd" data-k="${next ?? ''}"${next == null ? ' disabled' : ''} aria-label="Day after">${ic.back}</button></div>
    <div class="lgb-s"><span><b class="num">${sends}</b>Sends</span><span><b class="num">${att}</b>Attempts</span><span><b class="num">${att ? Math.round(sends / att * 100) + '%' : '–'}</b>Tops rate</span></div>
    ${es.length ? es.map(e => `<button class="lgb-r" type="button" data-act="to" data-to="${e.cs.length ? `clip/${e.cs[e.cs.length - 1].id}` : `route/${e.ri}`}">${sw(e.r)}<span class="row-t"><strong>${rname(e.r)}</strong><span>${gym.name} · ${e.cs.length ? n(e.cs.length, 'video', 'videos') : 'logged by hand'}</span></span>
      <span class="lgb-v${e.sent ? ' on' : ''}">${e.sent ? `${ic.check}${e.style}` : n(e.tries, 'attempt', 'attempts')}</span></button>`).join('') + gbook(gd, bookAt)
      : gd.length ? gbook(gd, bookAt) : `<div class="lgb-e"><p class="cap">Nothing logged ${bookAt === 0 ? 'today' : 'this day'}.</p>${page === 'session' ? '' : '<button class="pj" type="button" data-act="to" data-to="session">Start a session</button>'}</div>`}
  </section>`;
}
// tapping the clock in the Dynamic Island: how long, what you've done today, and End. You stay on the page you were on
function openClock() {
  const es = dayLog(0), gd = gday(0), sends = es.filter(e => e.sent).length + gd.filter(gsent).length, att = es.reduce((s, e) => s + e.tries, 0) + gd.length;
  pane(`<h2>Climbing now</h2><span class="sub">${gym.name} · rope wall</span>
    <div class="pn-clk"><span class="lg-dot"></span><b class="num" id="pnclk">${clk(sesSecs())}</b></div>
    <div class="lgb-s pn-s"><span><b class="num">${sends}</b>Sends</span><span><b class="num">${att}</b>Attempts</span><span><b class="num">${att ? Math.round(sends / att * 100) + '%' : '–'}</b>Tops rate</span></div>
    ${es.length ? `<section class="lgb pn-l">${es.map(e => `<div class="lgb-r">${sw(e.r)}<span class="row-t"><strong>${rname(e.r)}</strong><span>${e.cs.length ? n(e.cs.length, 'video', 'videos') : 'logged by hand'}</span></span>
      <span class="lgb-v${e.sent ? ' on' : ''}">${e.sent ? `${ic.check}${e.style}` : n(e.tries, 'attempt', 'attempts')}</span></div>`).join('')}</section>` : ''}
    ${gd.length ? `<section class="lgb pn-l"><div class="lgb-r"><span class="row-t"><strong>By grade</strong><span>${gwhere(gd)} · ${gline(gd)}</span></span><span class="lgb-v${gd.some(gsent) ? ' on' : ''}">${n(gd.filter(gsent).length, 'send', 'sends')}</span></div></section>` : ''}
    <div class="two"><button class="b-ghost" type="button" data-act="close">Keep climbing</button><button class="b-lime" type="button" data-act="lgend">End session</button></div>`);
}
// "+" opens a sheet with four equal tiles: Film, Import, Log by hand, Scan a wall
function openAdd() {
  const v = nextRoll();
  pane(`<h2>Add a try</h2><span class="sub">${gym.name} · ${session === 'live' ? `climbing for ${clk(sesSecs())}` : 'rope wall'}</span>
    <div class="add-g ss-g">
      <button class="main" type="button" data-act="film"${v ? '' : ' disabled'}>${ic.rec}<b>Film</b><span>${v ? 'With the Spotter camera' : 'All three sample tries are filmed'}</span></button>
      <button type="button" data-act="upload">${ic.up}<b>Import</b><span>A video from your camera roll</span></button>
      <button type="button" data-act="to" data-to="session">${ic.pen}<b>Log by hand</b><span>No video or photo needed</span></button>
      <button type="button" data-act="scan">${ic.scan}<b>Scan a wall</b><span>Photo a route, see its beta</span></button>
    </div>`);
}
/* ---------- Log by hand, by grade ---------- */
// routes get reset, so a climb you log by hand is logged by its grade, not by a route. One rock per grade:
// tap = Send, swipe up = Flash, swipe down = Project (not topped yet). The first one starts the session clock.
// Pick the gym (any of the five) and what you climbed there: only what that gym lists (ARC: Bouldering Cave and top rope)
const GR = ['5.6', '5.7', '5.8', '5.9', '5.10', '5.11', '5.12+'], VG = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8+'];
const glogs = []; // { ago, gy: index in gyms, ty: 'Boulder' | 'Top rope', g, k: 'Flash' | 'Send' | 'Project' }
const gday = ago => glogs.filter(x => x.ago === ago), gsent = x => x.k !== 'Project';
const gord = g => VG.includes(g) ? VG.indexOf(g) : 100 + GR.indexOf(g);
const gline = xs => [...VG, ...GR].map(g => [g, xs.filter(x => x.g === g).length]).filter(([, k]) => k).map(([g, k]) => k > 1 ? `${g} ×${k}` : g).join(', ');
const gwhere = xs => [...new Set(xs.map(x => gyms[x.gy].name))].join(', ');
const kinds = g => [...(g.has.some(h => /boulder/i.test(h)) ? ['Boulder'] : []), ...(g.has.some(h => /top rope/i.test(h)) ? ['Top rope'] : [])];
// shown labels: "Send" here is a climb (完攀), not the Send button under comments (发送), so it carries an invisible word joiner
const KL = { Flash: 'Flash', Send: 'Send⁠', Project: 'Project' };
let glGym = 0, glTy = 'Top rope', glOpen = false, glHit = null;
// where each grade's rock sits, in a 340 × 460 box: x, y, width and height radius
const GB = { '5.12+': [128, 62, 88, 46], '5.11': [252, 150, 64, 60], '5.10': [90, 172, 64, 68], '5.9': [222, 266, 74, 58], '5.8': [88, 306, 64, 58], '5.7': [240, 374, 64, 50], '5.6': [112, 406, 58, 44],
  'V8+': [130, 58, 86, 42], V7: [252, 128, 62, 52], V6: [82, 148, 60, 54], V5: [190, 216, 64, 50], V4: [68, 264, 56, 52], V3: [262, 284, 58, 52], V2: [150, 334, 60, 46], V1: [62, 396, 52, 44], V0: [232, 398, 64, 46] };
// small rocks between them, only to look at
const PEB = [[300, 52, 22, 18], [30, 70, 14, 30], [318, 210, 14, 26], [160, 140, 12, 10], [20, 340, 10, 22], [312, 350, 16, 12], [170, 440, 14, 9]];
const rock = (cx, cy, rx, ry, sd) => { const P = [...Array(7)].map((_, k) => { const a = k / 7 * Math.PI * 2 + sd, f = .74 + .26 * Math.abs(Math.sin(sd * 5.3 + k * 1.9)); return [cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f]; });
  const m = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], L = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t], f = q => q.map(v => v.toFixed(1)).join(' ');
  // straight sides with rounded corners, like a hold
  return `M${f(m(P[6], P[0]))}` + P.map((q, k) => { const pr = P[(k + 6) % 7], nx = P[(k + 1) % 7]; return ` L${f(L(q, pr, .22))} Q${f(q)} ${f(L(q, nx, .22))}`; }).join('') + 'Z'; };
// grade breakdown: one bar per grade, the topped part lime
const gbars = xs => { const bd = [...VG, ...GR].map(g => [g, xs.filter(x => x.g === g)]).filter(([, q]) => q.length), mx = Math.max(1, ...bd.map(([, q]) => q.length));
  return bd.map(([g, q]) => { const t = q.filter(gsent).length; return `<div class="gl-b"><b>${g}</b><span class="gl-bar"><i class="s" style="width:${t / mx * 100}%"></i><i style="width:${(q.length - t) / mx * 100}%"></i></span><b class="num">${q.length}</b></div>`; }).join(''); };
function glAdd(g, k) {
  lgClock(); glogs.push({ ago: 0, gy: glGym, ty: glTy, g, k }); glHit = g; render(); toast(`${g} · ${KL[k]}`);
  setTimeout(() => { glHit = null; document.querySelector('.gb.hit')?.classList.remove('hit'); }, 450);
}
function openGymPick() {
  pane(`<h2>Where are you climbing?</h2><span class="sub">Climbs you log go under this gym</span>
    <div class="rows">${gyms.map((g, i) => `<button class="row" type="button" data-act="glgy" data-i="${i}" aria-pressed="${i === glGym}"><img class="ss-th gl-gth" src="img/${g.img}.jpg" alt=""><span class="row-t"><strong>${g.name}</strong><span>${kinds(g).join(' · ')} · ${g.dist}</span></span>${i === glGym ? ic.check : ''}</button>`).join('')}</div>`);
}
function viewSession() {
  const live = session === 'live', es = gday(0), G = gyms[glGym], tys = kinds(G);
  if (!tys.includes(glTy)) glTy = tys[tys.length - 1];
  const set = glTy === 'Boulder' ? VG : GR;
  const map = `<div class="gl-map"><svg viewBox="0 0 340 460">
      <defs><pattern id="gldot" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="17" cy="17" r="1.6" fill="rgba(17,17,17,.12)"/></pattern></defs>
      <rect width="340" height="460" fill="url(#gldot)"/>
      ${PEB.map(([x, y, rx, ry], i) => `<path class="peb" d="${rock(x, y, rx, ry, i * 2.1 + 1)}"/>`).join('')}
      ${set.slice().reverse().map((g, i) => { const [x, y, rx, ry] = GB[g], c = es.filter(q => q.g === g).length;
      return `<g class="gb${glHit === g ? ' hit' : ''}" data-g="${g}" role="button" tabindex="0" aria-label="${g}${c ? `, ${c} today` : ''}. Tap: Send. Swipe up: Flash. Swipe down: Project">
        <path d="${rock(x, y, rx, ry, i * 1.7 + .4)}"/><text x="${x}" y="${y + 11}">${g}</text>
        ${c ? `<g class="bd"><circle cx="${x + rx * .6}" cy="${y - ry * .6}" r="12"/><text x="${x + rx * .6}" y="${y - ry * .6 + 4.5}">${c}</text></g>` : ''}</g>`; }).join('')}</svg></div>
    <p class="gl-how"><span>Swipe up <b>Flash</b></span> · <span>tap <b>${KL.Send}</b></span> · <span>swipe down <b>Project</b></span></p>`;
  const undo = '<button type="button" data-act="glundo"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>Undo</button>';
  const list = glogs.map((x, i) => [x, i]).filter(([x]) => x.ago === 0).reverse().map(([x, i]) => `<div class="gl-r"><b>${x.g}</b><span>${gyms[x.gy].name}</span>
      <span class="gl-seg">${['Flash', 'Send', 'Project'].map(k => `<button type="button" data-act="glk" data-i="${i}" data-k="${k}" aria-pressed="${x.k === k}">${KL[k]}</button>`).join('')}</span>
      <button class="gl-x" type="button" data-act="gldel" data-i="${i}" aria-label="Remove ${x.g}">×</button></div>`).join('');
  const sheet = `<section class="gl-sh${glOpen ? ' open' : ''}">
      <button class="gl-grab" type="button" data-act="glopen" aria-expanded="${glOpen}" aria-label="${glOpen ? 'Back to the grades' : 'Every climb, one by one'}"><i></i></button>
      ${!es.length ? '<p class="gl-e">Tap a grade above to log a climb</p>'
        : glOpen ? `<div class="gl-h"><span>Today · ${n(es.length, 'climb', 'climbs')}</span>${undo}</div><div class="gl-list">${list}</div>`
        : `<div class="gl-h"><span>Grade breakdown</span>${undo}</div>${gbars(es)}`}</section>`;
  return { html: `
    ${bar('Log by hand')}
    <div class="gl-top"><span><b>${live ? `<span class="lg-dot"></span><span class="num" id="lgclk">${clk(sesSecs())}</span>` : dateOf(0).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</b>
        <button class="gl-gym" type="button" data-act="glgym">${G.name}<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button></span>
      <div class="gl-rope">${tys.map(r => `<button type="button" data-act="glrope" data-v="${r}" aria-pressed="${glTy === r}">${r}</button>`).join('')}</div></div>
    ${glOpen && es.length ? '' : map}
    ${sheet}`,
    cta: `<button class="b-lime" type="button" data-act="glsave"${es.length || live ? '' : ' disabled'}>Save session</button>`,
    after: () => document.querySelectorAll('.gb').forEach(el => { let y0 = null;
      el.addEventListener('pointerdown', e => { y0 = e.clientY; el.setPointerCapture?.(e.pointerId); el.classList.add('down'); });
      el.addEventListener('pointerup', e => { if (y0 == null) return; const dy = e.clientY - y0; y0 = null; el.classList.remove('down'); glAdd(el.dataset.g, dy < -24 ? 'Flash' : dy > 24 ? 'Project' : 'Send'); });
      el.addEventListener('pointercancel', () => { y0 = null; el.classList.remove('down'); });
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); glAdd(el.dataset.g, 'Send'); } }); }) };
}
// Log send uses the sheet: how it felt for the grade, stars, a note, and who filmed you
let sendRi = 0;
function openSheet(ri) {
  sendRi = ri; const r = ROUTES[ri], before = dayLog(0).find(e => e.ri === ri)?.tries || 0;
  $('sheetSub').textContent = `${rname(r)} · ${r.wall} · ${gym.name} · ${before ? `after ${n(before, 'attempt', 'attempts')}` : 'first go today'}`;
  $('feltLbl').textContent = `How did it feel for a ${r.grade}?`;
  const film = [...follows].slice(0, 2).concat(['No one']);
  $('filmOpts').style.gridTemplateColumns = `repeat(${film.length}, 1fr)`;
  $('filmOpts').innerHTML = film.map(f => `<button type="button" aria-pressed="${f === 'No one'}">${f}</button>`).join('');
  $('filmHint').textContent = film.length > 1 ? 'They get a link to send you the video. Spotter reads your moves from it.' : 'Follow climbers in Community and they show up here.';
  ask.classList.remove('show'); sheet.classList.add('show'); scrim.classList.add('show');
}
function saveSend() {
  const r = ROUTES[sendRi], l = logOf(0, sendRi), had = dayLog(0).find(e => e.ri === sendRi)?.tries || 0;
  const felt = $('feltOpts').querySelector('[aria-pressed="true"]'), star = $('starOpts').querySelector('[aria-checked="true"]');
  const pick = $('filmOpts').querySelector('[aria-pressed="true"]'), film = window.enText ? enText(pick) : pick.textContent;
  lgClock(); l.tries += 1; l.sent = true; l.style = had ? 'Redpoint' : 'Flash';
  if (felt) l.feel = window.enText ? enText(felt) : felt.textContent;
  if (star) l.stars = +star.dataset.n;
  if ($('noteIn').value.trim()) l.note = esc($('noteIn').value.trim());
  closeAll(); render(); toast(`${rname(r)} · ${l.style}${film === 'No one' ? '' : ` · asked ${film} for the video`}`);
  $('feltOpts').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false'));
  $('starOpts').querySelectorAll('button').forEach(x => { x.setAttribute('aria-checked', 'false'); x.classList.remove('on'); });
  $('noteIn').value = '';
}
// End: the session's summary. Every climb today, public or hidden
function viewSummary() {
  const es = dayLog(0), gd = gday(0), allT = es.reduce((s, e) => s + e.tries, 0) + gd.length, allS = es.filter(e => e.sent).length + gd.filter(gsent).length;
  // the hardest send, by grade: a route or a climb logged by grade
  const sn = [...es.filter(e => e.sent).map(e => [gord(e.r.grade), rname(e.r)]), ...gd.filter(gsent).map(x => [gord(x.g), x.g])].sort((p, q) => q[0] - p[0]);
  const hb = [sn.find(q => q[0] >= 100), sn.find(q => q[0] < 100)].filter(Boolean), best = hb.length ? [0, hb.map(q => q[1]).join(' · ')] : null;
  const row = e => { const c = e.cs[e.cs.length - 1], hid = c ? c.hidden : !!e.l?.hidden;
    return `<div class="row">${c ? `<button class="ss-open" type="button" data-act="to" data-to="clip/${c.id}" aria-label="Open the analysis of ${rname(e.r)}"><img src="img/${c.img}.jpg" alt=""></button>` : ''}<span class="row-t"><strong>${sw(e.r)}${rname(e.r)}</strong><span>${e.sent ? e.style : n(e.tries, 'attempt', 'attempts')} · ${e.cs.length ? `${n(e.cs.length, 'video', 'videos')} · tap the picture for the analysis` : 'logged by hand'}</span></span>
      <button class="vis${hid ? ' off' : ''}" type="button" data-act="shide" data-i="${e.ri}" aria-pressed="${hid}">${hid ? `${ic.eyeOff}Hidden` : `${ic.eye}Public`}</button></div>`; };
  // what today's videos lead to. Climbs logged by hand have no video, so nothing to analyse or put on a poster
  const vids = clips.filter(c => agoOf(c) === 0), done = vids.filter(c => c.an === 'done' && c.track), sent = vids.filter(topOf);
  const look = done.find(topOf) || done[done.length - 1], pc = sent[sent.length - 1] || vids[vids.length - 1];
  const thumb = c => `<img class="ss-th" src="img/${c.img}.jpg" alt="">`;
  const next = vids.length ? `<div class="hl2 dk2"><h2>From today’s videos</h2></div>
    <div class="rows">
      ${look ? `<button class="row ss-just" type="button" data-act="to" data-to="clip/${look.id}">${thumb(look)}<span class="row-t"><strong>Look at your analysis</strong><span>${rname(ROUTES[look.ri])} · try ${tryOf(look)} · ${n(look.track.stats.moves, 'move', 'moves')}</span></span>${ic.arr('#111111')}</button>` : ''}
      <button class="row ss-just" type="button" data-act="share" data-i="${pc.id}">${thumb(pc)}<span class="row-t"><strong>${topOf(pc) ? 'Share your send' : 'Share your progress'}</strong><span>As a poster · ${rname(ROUTES[pc.ri])}</span></span>${ic.arr('#111111')}</button>
      ${sent.length ? `<button class="row ss-just" type="button" data-act="reel" data-day="0">${thumb(sent[0])}<span class="row-t"><strong>Today’s highlight reel</strong><span>${n(sent.length, 'send', 'sends')} · ${sent.length * 8} seconds</span></span>${ic.arr('#111111')}</button>` : ''}
    </div>` : es.length || gd.length ? '<p class="cap">Everything today was logged by hand. Film a try next time and it gets an analysis and a poster.</p>' : '';
  return { photo: 'gym-arc-3', html: `
    <h1 class="hl tab">Session saved</h1>
    <p class="sub-w">${es.length || !gd.length ? gym.name : gwhere(gd)} · ${dateOf(0).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
    <section class="glass trio"><div><b class="num">${clk(sesDur)}</b><span>time</span></div><div><b class="num">${allT}</b><span>${allT === 1 ? 'try' : 'tries'}</span></div><div><b class="num">${allS}</b><span>${allS === 1 ? 'send' : 'sends'}</span></div></section>
    ${best ? `<div class="sm-best">${ic.check}<span>Hardest send today: <b>${best[1]}</b></span></div>` : ''}
    <div class="fold"></div>
    ${next}
    ${gd.length ? `<div class="hl2 dk2"><h2>By grade</h2><span class="hint2">${n(gd.length, 'climb', 'climbs')} · only you see these</span></div><section class="gl-sum">${gbars(gd)}</section>` : ''}
    ${es.length || !gd.length ? `<div class="hl2 dk2"><h2>Hide any climb?</h2></div>
    <p class="cap">Public climbs are in Community at ${gym.name}, where climbers can comment. Hidden ones stay with you.</p>
    <div class="rows">${es.map(row).join('') || '<div class="row"><span class="row-t"><strong>No tries recorded</strong><span>Next time, film a try or log one, and it shows up here.</span></span></div>'}</div>` : ''}`,
    cta: `<button class="b-lime" type="button" data-act="sumdone">Done</button>` };
}

/* ---------- Watch: start and stop each try from your wrist while the phone films ---------- */
let watch = user === 'regular', wst = 0;
function watchDemo() {
  const r = ROUTES[1], tm = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/, '');
  const tb = t => `<span class="aw-tb"><b>${t}</b><span class="num">${tm}</span></span>`, ab = t => `<span class="aw-ab"><i></i>${t}</span>`;
  const S = [
    `${tb('Spotter')}<span class="aw-b"><span class="aw-pv"><img src="img/wayup-p2b-orange.jpg" alt=""><span><i></i>Phone · filming when you start</span></span>${ab('Press to start climb 1')}</span>`,
    `${tb('Climb 1')}<span class="aw-b"><span class="aw-s"><i class="aw-rec"></i>Filming on your phone</span><span class="aw-big lime num">0:23</span>${ab('Press when you’re down')}</span>`,
    `${tb('Climb 1')}<span class="aw-b"><svg class="aw-ring" viewBox="0 0 150 150"><circle cx="75" cy="75" r="62" stroke="rgba(221,242,106,.22)"/><circle cx="75" cy="75" r="62" stroke="#DDF26A" stroke-linecap="round" stroke-dasharray="389.6" stroke-dashoffset="130" transform="rotate(-90 75 75)"/></svg><span class="aw-n">Saved · 0:44<br>Reading it on your phone</span></span>`,
    `${tb('Rest')}<span class="aw-b"><span class="aw-big num">1:42</span><span class="aw-cell"><span><b style="color:${r.hex}">●</b> <b style="color:#fff">${rname(r)}</b><em>Climb 1 · on video</em></span><b>Topped</b></span>${ab('Press to start climb 2')}</span>`];
  const cap = ['Step in and check you’re in frame on your wrist. Then press the orange Action button.',
    'Press the orange button again when you’re down, or double tap.',
    'Nothing to answer. Your phone reads the route and analyses the video.',
    'Once it’s read, the route shows here. Rest counts up: press when you’re ready.'];
  return `<div class="wd" id="wdemo">
      <button class="aw" type="button" data-act="wtap" aria-label="Tap the watch: next screen"><span class="aw-dev"><span class="aw-ws">${S[wst]}</span><img class="aw-bz" src="img/watch-ultra.png" alt=""><span class="aw-act"></span></span></button>
      <span class="wd-dots">${S.map((_, i) => `<button type="button" data-act="wgo" data-i="${i}" aria-label="Screen ${i + 1}" aria-current="${i === wst}"></button>`).join('')}</span>
      <p class="wd-c"><b>${['Check the frame', 'Climbing', 'Saved', 'Resting'][wst]}</b>${cap[wst]}</p></div>`;
}
function viewWatch() {
  return { photo: 'gym-arc-2', html: `
    ${bar('Watch')}
    <h1 class="hl">Climb with your watch</h1>
    <p class="sub-w">Your phone films from the floor. Your wrist starts and stops each try, so every video is one try.</p>
    <section class="glass scan-c">
      <span class="t2">${watch ? 'Your Apple Watch' : 'Apple Watch or Wear OS'}</span>
      <span class="sub">${watch ? 'Connected · starts and stops each try' : 'Not connected yet'}</span>
      ${watch ? '<button class="b-glass" type="button" data-act="watch">Disconnect</button>' : `<button class="b-lime" type="button" data-act="watch">${ic.watch('#111111')}Connect a watch</button>`}
    </section>
    <div class="fold"></div>
    <div class="hl2 dk2"><h2>On your wrist</h2><span class="hint2">tap the watch</span></div>
    ${watchDemo()}
    <div class="rows">
      <a class="row" href="watch.html" target="_blank" rel="noopener"><span class="row-t"><strong>Open the watch prototype</strong><span>The watch app on its own page, full size</span></span>${ic.arr('#111111')}</a>
      <div class="row"><span class="row-t"><strong>Wrong route?</strong><span>Change it on the video later. The watch never asks while you climb.</span></span></div>
      <div class="row"><span class="row-t"><strong>Session time</strong><span>From your first climb to End, rest included.</span></span></div>
    </div>` };
}

/* ---------- Share: one try as a poster, every send as a highlight reel ---------- */
const shareBtns = () => `<div class="two"><button class="b-ghost" type="button" data-act="shsave">Save to Photos</button><button class="b-lime" type="button" data-act="shsend">${follows.size ? `Send to ${[...follows].slice(0, 2).join(' and ')}` : 'Copy link'}</button></div>`;
function openShare(c) {
  const r = ROUTES[c.ri], T = c.track;
  pane(`<h2>${topOf(c) ? 'Share your send' : 'Share your progress'}</h2><span class="sub">Route, grade and gym added from the video</span>
    <div class="poster"><img src="img/${c.img}.jpg" alt=""><span class="shade"></span><span class="po-brand">Spotter</span>
      <span class="po-b"><span class="pk-tag">${sw(r)}${rname(r)}</span><b>${topOf(c) ? 'Topped' : T ? `${T.stats.moves} moves` : 'On the wall'}</b><span>try ${tryOf(c)} · ${gym.name} · ${dayLabel(agoOf(c))}</span></span></div>
    ${shareBtns()}`);
}
function openReel(day) {
  const s = clips.filter(c => topOf(c) && (day == null || agoOf(c) === day));
  pane(`<h2>${day === 0 ? 'Today’s highlight reel' : 'Your highlight reel'}</h2><span class="sub">${n(s.length, 'send', 'sends')} · ${s.length * 8} seconds · labels added for you</span>
    <div class="reel">${s.map(c => `<span class="rl"><img src="img/${c.img}.jpg" alt=""><span class="pk-tag">${sw(ROUTES[c.ri])}${rname(ROUTES[c.ri])}</span><em>${gym.name} · ${dayLabel(agoOf(c))}</em></span>`).join('')}</div>
    <p class="hint">Each send plays for 8 seconds, from its last move to the top.</p>
    ${shareBtns()}`);
}
const reelTile = () => { const s = clips.filter(topOf); return s.length ? `<div class="lb"><button class="lt w2 short pt reel-t" type="button" data-act="reel"><img src="img/${s[s.length - 1].img}.jpg" alt=""><span class="shade"></span>
    <span class="lt-h">Highlight reel</span><span class="sqb">${ic.play.replace('#111111', '#FFFFFF')}</span>
    <span class="mv"><b>${n(s.length, 'send', 'sends')}</b><span class="mv-l">${s.length * 8} seconds, labels added</span></span></button></div>` : ''; };

/* ---------- Export: your log as a CSV file ---------- */
function exportLog() {
  const rows = [['date', 'gym', 'route', 'grade', 'attempts', 'sent', 'style', 'videos']];
  logDays().slice().reverse().forEach(d => gday(d).forEach(x => rows.push([dateOf(d).toISOString().slice(0, 10), gyms[x.gy].name, '', x.g, 1, gsent(x) ? 'yes' : 'no', `${x.k} · ${x.ty}`, ''])) || dayLog(d).forEach(e => rows.push([dateOf(d).toISOString().slice(0, 10), gym.name, e.r.color, e.r.grade, e.tries, e.sent ? 'yes' : 'no', e.style, e.cs.map(c => `video/${V[c.v].vid}.mp4`).join(' ')])));
  const csv = rows.map(r => r.map(x => /[",\s]/.test(String(x)) ? `"${String(x).replace(/"/g, '""')}"` : x).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'spotter-log.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`spotter-log.csv · ${n(rows.length - 1, 'row', 'rows')}`);
}

/* ---------- Friends: who you follow, sessions you plan together, who's free ---------- */
const follows = new Set(user === 'regular' ? ['Noor', 'Leo'] : []);
// sample: the days each person is free, counted from today, and how long they've climbed
const FREE = { Noor: [1, 3], Leo: [1, 4], Sam: [2, 5], Kai: [0, 6], Mia: [3] };
const YRS = { Noor: '5–10 years', Sam: 'over 10 years', Leo: '1–2 years', Kai: 'over 10 years', Mia: '2–5 years' };
// sessions planned at real gyms: g = gym, d = days from today, h = hour, who = who's going (you join by tapping)
const plans = user === 'regular' ? [{ by: 'Noor', g: 0, d: 1, h: 18, who: ['Noor', 'Leo'] }] : [];
const dayName = d => d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(new Date().getDay() + d) % 7];
const names = ws => ws.length < 3 ? ws.join(' and ') : `${ws.slice(0, -1).join(', ')} and ${ws[ws.length - 1]}`;
const comTabs = plan => `<nav class="tok-tabs"><button type="button" data-act="to" data-to="friends"${plan ? '' : ' aria-current="page"'}>For you</button><button type="button" data-act="to" data-to="friends/plan"${plan ? ' aria-current="page"' : ''}>Friends</button></nav>`;
function viewFriendsPlan() {
  const fr = [...follows];
  const row = `<div class="fr-row">${fr.map(w => `<button type="button" data-act="to" data-to="person/${w}"><span class="fr-f">${avatar(w)}</span><span>${w}</span></button>`).join('')}
      <button type="button" data-act="fadd"><span class="fr-f fr-add">${ic.plus}</span><span>Add</span></button></div>`;
  const ps = plans.filter(p => p.by === 'You' || fr.includes(p.by));
  const card = p => { const k = plans.indexOf(p), g = gyms[p.g], me = p.who.includes('You'), oth = p.who.filter(w => w !== 'You');
    return `<div class="pl"><img src="img/${g.img}.jpg" alt="">
      <span class="row-t"><strong>${dayName(p.d)} · ${clock(p.h)}</strong><span>${g.name}</span>
        <span class="pl-who"><span class="pl-avs">${p.who.map(w => `<i>${avatar(w)}</i>`).join('')}</span>${p.by === 'You' ? (oth.length ? `You planned · ${names(oth)} invited` : 'You planned it') : `${names(oth)} ${oth.length > 1 ? 'are' : 'is'} going`}</span></span>
      ${p.by === 'You' ? `<button class="pj" type="button" data-act="plx" data-i="${k}">Cancel</button>` : `<button class="pj${me ? ' on' : ''}" type="button" data-act="pljoin" data-i="${k}" aria-pressed="${me}">${me ? 'Going' : 'Join'}</button>`}</div>`; };
  const cal = fr.length ? `<div class="lt w2 fr-cal"><span class="cal-h"><span class="lt-h">Who’s free</span><span class="hint2">this week</span></span>
      <span class="week">${[0, 1, 2, 3, 4, 5, 6].map(i => { const d = new Date(Date.now() + i * 864e5); return `<span class="wd${i === 0 ? ' today' : ''}"><span>${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]}</span><b class="num">${d.getDate()}</b>
        <span class="wav">${fr.filter(w => FREE[w]?.includes(i)).map(w => `<i>${avatar(w)}</i>`).join('')}</span></span>`; }).join('')}</span></div>` : '';
  const theirs = V.filter(x => fr.includes(x.who)).sort((a, b) => a.ago - b.ago);
  const vids = theirs.length ? `<div class="vg">${theirs.map(x => `<button class="vt" type="button" data-act="pvid" data-v="${x.i}" aria-label="Watch ${x.who} on ${rname(ROUTES[x.ri])}">
      <img src="img/${x.img}.jpg" alt="" loading="lazy"><span class="shade"></span><span class="vt-t">${sw(ROUTES[x.ri])}${rname(ROUTES[x.ri])}</span><span class="vt-b">${x.who} · ${dayLabel(x.ago)}</span></button>`).join('')}</div>`
    : `<p class="cap">${fr.length ? 'Your friends haven’t posted a climb yet.' : 'Climbs your friends post show up here.'}</p>`;
  return { photo: 'gym-arc-1', html: `
    <div class="tok-top lt-top"><span class="tok-add-sp" aria-hidden="true"></span>${comTabs(true)}<button class="av sm" type="button" data-act="to" data-to="profile" aria-label="Your profile">${avatar('You')}</button></div>
    <div class="fold"></div>
    <div class="hl2 dk2"><h2>Friends</h2><span class="hint2">${fr.length ? n(fr.length, 'friend', 'friends') : 'none yet'}</span></div>
    ${fr.length ? '' : '<p class="cap">See each other’s climbs and plan sessions together.</p>'}
    ${row}
    <div class="hl2 dk2"><h2>Climbing soon</h2><button class="gy-mapb" type="button" data-act="plan">Plan one</button></div>
    <div class="pls">${ps.length ? ps.map(card).join('') : `<p class="cap">${fr.length ? 'Nothing planned. Plan a session and your friends can join.' : 'Add a friend, then plan a session together.'}</p>`}</div>
    ${cal}
    <div class="hl2 dk2"><h2>Friends’ climbs</h2>${theirs.length ? `<span class="hint2">${n(theirs.length, 'video', 'videos')}</span>` : ''}</div>
    ${vids}
    <p class="hint">Sample people: names and free days are made up. The videos are real.</p>` };
}
function openFriendAdd() {
  const one = w => `<div class="fr-p"><span class="fr-f">${avatar(w)}</span><span class="row-t"><strong>${w}</strong><span>${n(V.filter(x => x.who === w).length, 'video', 'videos')} at ${gym.name} · climbing ${YRS[w]}</span></span>
      <button class="pj${follows.has(w) ? ' on' : ''}" type="button" data-act="fadd1" data-w="${w}" aria-pressed="${follows.has(w)}">${follows.has(w) ? 'Added' : 'Add'}</button></div>`;
  pane(`<h2>Add friends</h2><span class="sub">Friends see your climbs and can join your sessions.</span>
    <p class="fr-h">Climbing at ${gym.name}</p>${PEOPLE.map(one).join('')}
    <div class="two one"><button class="b-ghost" type="button" data-act="invite">Copy an invite link</button></div>`);
}
// plan a session: a gym near you, a day, a time it's open, and who to ask. Posting it closes the sheet and the plan is on the page
let pd = null;
function openPlan(g = 0) { pd = pd && pd.g === g ? pd : { g, d: 1, h: null, who: new Set() }; drawPlan(); }
function drawPlan() {
  const g = gyms[pd.g], hrs = g.hours[(new Date().getDay() + pd.d) % 7];
  const times = hrs ? [10, 12, 15, 17, 18, 19, 20].filter(h => h >= hrs[0] && h <= hrs[1] - 2) : [];
  if (!times.includes(pd.h)) pd.h = times.includes(18) ? 18 : times[0] ?? null;
  const chip = (act, v, label, on) => `<button type="button" data-act="${act}" data-v="${v}" aria-pressed="${on}">${label}</button>`;
  pane(`<h2>Plan a session</h2><span class="sub">Your friends see it and can join.</span>
    <p class="fr-h">Where</p><div class="fchips">${gyms.map((x, i) => [x, i]).filter(([x]) => x.mi <= 10).map(([x, i]) => chip('plg', i, x.name, i === pd.g)).join('')}</div>
    <p class="fr-h">When</p><div class="fchips">${[0, 1, 2, 3, 4, 5, 6].map(d => chip('pld', d, dayName(d), d === pd.d)).join('')}</div>
    <div class="fchips pl-t">${times.length ? times.map(h => chip('plh', h, clock(h), h === pd.h)).join('') : `<span class="cap">${g.name} is closed that day.</span>`}</div>
    ${follows.size ? `<p class="fr-h">Ask</p><div class="fr-row sm">${[...follows].map(w => `<button type="button" data-act="plw" data-w="${w}" aria-pressed="${pd.who.has(w)}"><span class="fr-f">${avatar(w)}</span><span>${w}</span></button>`).join('')}</div>` : ''}
    <div class="two one"><button class="b-lime" type="button" data-act="plgo"${pd.h === null ? ' disabled' : ''}>Post plan</button></div>`);
}
const moreActions = {
  gymaps: b => { const g = gyms[+b.dataset.i]; toast(`Opening ${g.name} in Maps · ${g.addr}, ${g.dist}`); },
  gyr: b => { gymR = +b.dataset.v; gymPin = null; render(); },
  // logging and the session
  rtry: b => { const ri = +b.dataset.r; lgClock(); logOf(0, ri).tries++; render(); toast(`${rname(ROUTES[ri])} · attempt ${dayLog(0).find(e => e.ri === ri).tries} today`); },
  rsend: b => openSheet(+b.dataset.r),
  scan: () => { closeAll(); betaOnly = false; scanShot = false; bstep = 0; scanRi = ROUTES.findIndex((r, i) => !mineOn(i).some(topOf)); if (scanRi < 0) scanRi = 0; go('scan'); },
  scanri: b => { scanRi = +b.dataset.i; render(); },
  rbeta: b => { betaOnly = true; scanRi = +b.dataset.r; scanShot = true; bstep = 0; go('scan'); },
  snap: () => { scanShot = true; bstep = 0; render(); },
  rescan: () => { scanShot = false; render(); },
  bstep: b => { const B = betaOf(scanRi); if (!B) return; bstep = Math.max(0, Math.min(B.steps.length - 1, bstep + +b.dataset.d)); const y = document.querySelector('.screen').scrollTop; render(); document.querySelector('.screen').scrollTop = y; },
  glopen: () => { glOpen = !glOpen; render(); },
  glrope: b => { glTy = b.dataset.v; render(); },
  glgym: () => openGymPick(),
  glgy: b => { glGym = +b.dataset.i; closeAll(); render(); },
  glk: b => { glogs[+b.dataset.i].k = b.dataset.k; render(); },
  gldel: b => { const [x] = glogs.splice(+b.dataset.i, 1); if (!gday(0).length) glOpen = false; render(); toast(`Removed · ${x.g} · ${KL[x.k]}`); },
  glundo: () => { const i = glogs.map(x => x.ago).lastIndexOf(0); if (i < 0) return; const [x] = glogs.splice(i, 1); if (!gday(0).length) glOpen = false; render(); toast(`Removed · ${x.g} · ${KL[x.k]}`); },
  glsave: () => { glOpen = false; actions.lgend(); },
  lgend: () => { sesDur = sesSecs(); session = 'none'; lgStart = null; closeAll(); island(); go('summary'); },
  island: () => openClock(),
  bkd: b => { if (b.dataset.k === '') return; bookAt = +b.dataset.k; render(); },
  shide: b => { const e = dayLog(0).find(x => x.ri === +b.dataset.i); if (!e) return;
    if (e.cs.length) { const on = !e.cs[0].hidden; e.cs.forEach(c => { c.hidden = on; }); } else e.l.hidden = !e.l.hidden; render(); },
  sumdone: () => go('profile'),
  export: () => exportLog(),
  // watch
  wtap: () => { wst = (wst + 1) % 4; $('wdemo').outerHTML = watchDemo(); },
  wgo: b => { wst = +b.dataset.i; $('wdemo').outerHTML = watchDemo(); },
  watch: () => { watch = !watch; render(); toast(watch ? 'Watch connected · start each try from your wrist' : 'Watch disconnected'); },
  // share
  share: b => openShare(byId(b.dataset.i)),
  reel: b => openReel(b.dataset.day ? +b.dataset.day : null),
  shsave: () => { closeAll(); toast('Saved to Photos'); },
  shsend: () => { closeAll(); toast(follows.size ? `Sent to ${[...follows].slice(0, 2).join(' and ')}` : 'Link copied · paste it anywhere'); },
  // friends
  fadd: () => openFriendAdd(),
  fadd1: b => { const w = b.dataset.w; follows.has(w) ? follows.delete(w) : follows.add(w); openFriendAdd(); if (page !== 'friends' || arg) render(); },
  invite: () => toast('Invite link copied'),
  pfollow: b => { const w = b.dataset.w; follows.has(w) ? follows.delete(w) : follows.add(w); render(); toast(follows.has(w) ? `Following ${w}` : `Unfollowed ${w}`); },
  plan: b => openPlan(+(b.dataset.g || 0)),
  plg: b => { pd.g = +b.dataset.v; drawPlan(); },
  pld: b => { pd.d = +b.dataset.v; drawPlan(); },
  plh: b => { pd.h = +b.dataset.v; drawPlan(); },
  plw: b => { const w = b.dataset.w; pd.who.has(w) ? pd.who.delete(w) : pd.who.add(w); drawPlan(); },
  plgo: () => { const p = { by: 'You', g: pd.g, d: pd.d, h: pd.h, who: ['You', ...pd.who] }; plans.unshift(p); pd = null; closeAll();
    if (page === 'friends' && arg === 'plan') render(); else go('friends/plan'); toast(`Plan posted · ${dayName(p.d)} ${clock(p.h)} at ${gyms[p.g].name}`); },
  pljoin: b => { const p = plans[+b.dataset.i], on = p.who.includes('You'); p.who = on ? p.who.filter(w => w !== 'You') : [...p.who, 'You']; render(); toast(on ? 'You left the plan' : `You’re going · ${dayName(p.d)} ${clock(p.h)}`); },
  plstart: () => { lgClock(); render(); openAdd(); },
  plx: b => { plans.splice(+b.dataset.i, 1); render(); toast('Plan cancelled'); }
};

/* ---------- shell: routing, render, sheets ---------- */
const views = { setup: viewSetup, videos: viewVideos, clip: viewClip, vs: viewVs, route: viewRoute, walls: viewGymsTab, gyms: viewGyms, gym: viewGym, friends: viewFriends, person: viewPerson, profile: viewProfile, cam: viewCam, session: viewSession, logc: viewSession, scan: viewScan, summary: viewSummary, watch: viewWatch };
const tabOf = { videos: 'videos', clip: 'videos', vs: 'videos', cam: 'videos', route: 'walls', walls: 'walls', gyms: 'walls', gym: 'walls', session: 'videos', logc: 'videos', scan: 'walls', summary: 'profile', watch: 'profile', friends: 'friends', person: 'friends', profile: 'profile' };
const tabs = ['videos', 'walls', 'friends', 'profile'];
const dock = document.querySelector('.dock');
function readHash() { const [p = '', a = ''] = location.hash.replace(/^#\/?/, '').split('/'); page = views[p] ? p : 'videos'; arg = a; }
function go(p) { if (location.hash === '#/' + p) render(); else location.hash = '#/' + p; }
function render() {
  feedStop();
  const v = views[page](arg);
  $('main').innerHTML = v.html;
  const bd = document.querySelector('.backdrop'), fold = $('main').querySelector('.fold');
  bd.style.display = fold ? '' : 'none';
  if (v.photo) bd.querySelector('img').src = `img/${v.photo}.jpg`;
  if (fold) bd.style.height = `${54 + fold.offsetTop + 40}px`;
  $('cta').innerHTML = v.cta || '';
  $('camx').hidden = !v.overlay;
  $('camx').innerHTML = v.overlay || '';
  $('camx').classList.toggle('mapx', !!v.map);
  document.querySelector('.phone').classList.toggle('dark', !!v.dark);
  const scr = document.querySelector('.screen');
  scr.classList.toggle('tok-on', !!v.tok); scr.classList.toggle('fit', !!v.fit);
  scr.classList.remove('snap'); scr.style.scrollPaddingTop = ''; $('main').style.paddingBottom = '';   // the analysis page turns it on once its video sticks
  // the dock belongs to the four tabs; every page opened from a tab has a back button instead
  dock.hidden = !!v.cta || !!v.bare || !tabs.includes(page);
  dock.querySelectorAll('.dk:not(.plus)').forEach(b => b.toggleAttribute('aria-current', b.dataset.dock === tabOf[page]));
  dock.querySelector('[aria-current]')?.setAttribute('aria-current', 'page');
  $('plus').innerHTML = `${ic.plus}<span>Add</span>`;
  island();
  if (gmap && !v.map) { gmap.remove(); gmap = null; }
  v.after?.();
  // every video is analysed as soon as it's here, whichever page you're on
  clips.forEach(c => { if (!c.an) analyse(c); });
}
const toastEl = $('toast');
let tt;
function toast(msg) { if (clockNote) { clockNote = false; msg = msg ? `${msg} · Clock started, tap it up top to end` : 'Clock started, tap it up top to end'; } toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('show'), 2200); }
const sheet = $('sheet'), ask = $('ask'), scrim = $('scrim');
function closeAll() { [sheet, ask, scrim].forEach(x => x.classList.remove('show')); clearTimeout(closeAll.t); closeAll.t = setTimeout(() => { if (!ask.classList.contains('show')) ask.innerHTML = ''; }, 400); }
function pane(html) { ask.innerHTML = '<div class="grab"></div>' + html; sheet.classList.remove('show'); ask.classList.add('show'); scrim.classList.add('show'); }
// someone else's video on its own, from the route page
function watchPane(x) {
  const r = ROUTES[x.ri];
  pane(`<h2>${x.who} ${x.top ? 'topped' : 'climbed'} ${rname(r)}</h2><span class="sub">${gym.name} · ${dayLabel(x.ago)} · ${x.len}</span>
    <div class="fr-v"><video src="video/${x.vid}.mp4" poster="img/${x.img}.jpg" autoplay muted playsinline controls loop></video></div>
    <p class="hint">${x.credit}</p>`);
}

const actions = {
  to: b => go(b.dataset.to),
  back: () => history.length > 1 ? history.back() : go('videos'),
  close: () => closeAll(),
  // add
  film: () => { closeAll(); filming = false; go('cam'); },
  upload: () => { if (page === 'setup') { history.replaceState(null, '', '#/videos'); readHash(); render(); } openUpload(); },
  upick: b => { const i = +b.dataset.i; upSel.has(i) ? upSel.delete(i) : upSel.add(i); drawRoll(); },
  upnext: () => { const s = [...upSel]; if (s.length) importPicks(s); },
  shoot: () => {
    clearInterval(recT);
    if (!filming) { filming = true; recS = 0; lgClock(); render();
      recT = setInterval(() => { recS++; const t = $('recT'); if (t) t.textContent = mmss(recS); }, 1000); return; }
    filming = false; const v = nextRoll(); if (!v) { render(); return; }
    const c = addClip(v.i, { ago: 0 }); cTab = 'why'; go(`clip/${c.id}`);
  },
  // a video's page
  ctab: b => { cTab = b.dataset.v; setTimeout(() => $('main').dispatchEvent(new Event('tabchange'))); document.querySelectorAll('.ctabs button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === cTab)); document.querySelectorAll('.pn').forEach(p => { p.hidden = p.dataset.pn !== cTab; }); },
  spd: b => { speed = { 1: .5, .5: .25, .25: 1 }[speed] || 1; const v = $('lvv'); if (v) v.playbackRate = speed; b.textContent = `${speed}×`; },   // 1× → 0.5× → 0.25×
  segplay: b => $('lvv') && document.querySelector('.lv-w.two') ? segMain(b) : segOpen(b),
  segtoggle: () => { const v = $('cpv'); if (!v || !seg) return; if (seg.over) segAgain(); else if (v.paused) v.play().catch(() => {}); else v.pause(); },
  segagain: segAgain,
  segspeed: () => { const v = $('cpv'); if (!v || !seg) return; seg.rate = seg.rate === .5 ? 1 : .5; v.playbackRate = seg.rate; $('cps').textContent = `${seg.rate}×`; },
  segclose: segClose,
  lvplay: () => { const v = $('lvv'); if (v) v.paused ? v.play().catch(() => {}) : v.pause(); },
  anok: b => { const c = byId(b.dataset.i); confirmed(c, c.auto); },
  tagstart: b => { $('lvv')?.pause(); tagS = { id: +b.dataset.i, i: 0, pts: {} }; drawTag(byId(b.dataset.i)); document.querySelector('.screen').scrollTo(0, 0); },
  tagundo: b => { if (tagS.i) { tagS.i -= 1; delete tagS.pts[TAGS[tagS.i][0]]; } else if (byId(b.dataset.i).auto) tagS = { id: null, i: 0, pts: {} }; drawTag(byId(b.dataset.i)); },
  tagdone: b => { const c = byId(b.dataset.i); confirmed(c, { ...tagS.pts, t: c.auto?.t ?? 0 }, true); },
  retag: b => { const c = byId(b.dataset.i); c.tags = null; c.an = 'ask'; tagS = { id: null, i: 0, pts: {} }; render(); document.querySelector('.screen').scrollTo(0, 0); },
  croute: b => { const c = byId(b.dataset.i);
    pane(`<h2>Which route is this?</h2><span class="sub">${gym.name} · rope wall</span>
      <div class="rows">${ROUTES.map((r, i) => `<button class="row" type="button" data-act="cset" data-c="${c.id}" data-i="${i}"><span class="row-t"><strong>${sw(r)}${rname(r)}</strong><span>${n(mineOn(i).filter(x => x !== c).length, 'other try', 'other tries')} of yours</span></span>${i === c.ri ? ic.check : ''}</button>`).join('')}</div>`); },
  cset: b => { const c = byId(b.dataset.c); c.ri = +b.dataset.i; closeAll(); render(); toast(`Moved to ${rname(ROUTES[c.ri])} · try ${tryOf(c)}`); },
  vhide: b => { const c = byId(b.dataset.i); c.hidden = !c.hidden; render(); toast(c.hidden ? 'Hidden · only you can see it' : 'Public · in Community'); },
  seepost: b => { const c = byId(b.dataset.i); feedAt = Math.max(0, feedAll().findIndex(p => p.c === c)); go('friends'); },
  vdel: b => { const c = byId(b.dataset.i);
    pane(`<h2>Delete this video?</h2><span class="sub">${rname(ROUTES[c.ri])} · try ${tryOf(c)}. Its analysis and comments go too. The video stays in your camera roll.</span>
      <div class="two"><button class="b-ghost" type="button" data-act="close">Keep</button><button class="b-lime" type="button" data-act="vdelyes" data-i="${c.id}">Delete</button></div>`); },
  vdelyes: b => { const c = byId(b.dataset.i); clips.splice(clips.indexOf(c), 1); V[c.v].added = false; closeAll(); go('videos'); toast('Video deleted'); },
  // side by side
  pvplay: () => pvPlay(),
  pvslow: b => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); ['pv0', 'pv1'].forEach(id => { const v = $(id); if (v) v.playbackRate = on ? .5 : 1; }); },
  fwatch: b => watchPane(V[+b.dataset.v]),
  // gym
  gycopy: () => { navigator.clipboard?.writeText(gym.addr).then(() => toast('Address copied'), () => toast(gym.addr)); },
  // community
  fvtap: b => { const post = b.closest('.ts'), v = b.querySelector('video');
    if (tapT) { clearTimeout(tapT); tapT = null; feedLike(post, true); const h = b.querySelector('.ts-big'); h.classList.remove('go'); void h.offsetWidth; h.classList.add('go'); return; }
    tapT = setTimeout(() => { tapT = null; if (v.paused) { delete v.dataset.stop; v.play().catch(() => {}); } else { v.dataset.stop = 1; v.pause(); } }, 240); },
  flike: b => feedLike(b.closest('.ts'), b.getAttribute('aria-pressed') !== 'true'),
  fcm: b => feedComments(+b.dataset.i),
  cm: b => {
    const i = +b.dataset.i, inp = ask.querySelector(`[data-cm="${i}"]`), t = inp.value.trim();
    if (!t) return;
    const p = feedAll()[i], s = cmAt ? cmNow(i) : null; p.comments.push(['You', esc(t), s ?? undefined]);
    const k = document.querySelector(`.ts[data-i="${i}"] [data-act=fcm] span`); if (k) k.textContent = p.comments.length; feedComments(i);
  },
  cmreply: b => feedComments(+b.dataset.i, `@${b.dataset.w} `),
  cmq: b => { const inp = ask.querySelector('[data-cm]'); inp.value = b.textContent; inp.focus(); },
  cmat: b => { cmAt = !cmAt; feedComments(+b.dataset.i, ask.querySelector('[data-cm]').value); },
  // a time in a comment: close the comments and play the video from there
  cmt: b => { const v = document.querySelector(`.ts[data-i="${b.dataset.i}"] video`); closeAll(); if (!v) return; v.currentTime = (+v.dataset.a || 0) + +b.dataset.t; delete v.dataset.stop; v.play().catch(() => {}); },
  pvid: b => { const k = +b.dataset.v; feedAt = Math.max(0, feedAll().findIndex(p => p.v === k && !p.c)); go('friends'); },
  // profile
  newpub: () => { newPublic = !newPublic; render(); toast(newPublic ? 'New videos will be public' : 'New videos will be only for you'); }
};
Object.assign(actions, moreActions);
// the Log send sheet: one pick per row, then Save
[['feltOpts', 'aria-pressed'], ['filmOpts', 'aria-pressed']].forEach(([id, at]) => $(id).addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; $(id).querySelectorAll('button').forEach(x => x.setAttribute(at, x === b)); }));
$('starOpts').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; const k = +b.dataset.n;
  $('starOpts').querySelectorAll('button').forEach(x => { x.setAttribute('aria-checked', +x.dataset.n === k); x.classList.toggle('on', +x.dataset.n <= k); });
});
$('saveTop').addEventListener('click', saveSend);
document.querySelector('.phone').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  actions[b.dataset.act]?.(b);
});
ask.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset.cm) ask.querySelector(`[data-act="cm"][data-i="${e.target.dataset.cm}"]`)?.click(); });
dock.addEventListener('click', e => {
  const b = e.target.closest('[data-dock]'); if (!b) return;
  if (b.dataset.dock === 'plus') { openAdd(); return; }
  go(b.dataset.dock);
});
scrim.addEventListener('click', closeAll);
window.addEventListener('hashchange', () => { readHash(); if (page !== 'cam') { filming = false; clearInterval(recT); } closeAll(); render(); document.querySelector('.screen').scrollTop = 0; });
// frost the status bar once content scrolls under it
const scr = document.querySelector('.screen');
scr.addEventListener('scroll', () => document.querySelector('.phone').classList.toggle('scrolled', scr.scrollTop > 8), { passive: true });
// first open: a new climber starts on the intro; ?view=regular opens Videos
if (!location.hash) history.replaceState(null, '', '#/' + (user === 'regular' ? 'videos' : 'setup'));
readHash();
render();
// iPhone 16 Pro frame (894 px with its border): on a short window scale the whole phone down to fit, never squash it
const fitPhone = () => document.querySelector('.device').style.setProperty('--fit', Math.min(1, (innerHeight - 96) / 894).toFixed(3));
addEventListener('resize', fitPhone);
fitPhone();

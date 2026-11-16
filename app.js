// Spotter v9: one loop. Film or import a try → see what your body did on the wall → watch it next to someone else on the same route.
// One sample world: the ARC Climbing Wall at UIUC (its real address and hours), its top-rope wall, and two routes on it.
// The climbing videos are The Way Up (Maschek & Schedl, CC BY 4.0): ten climbers on the same two routes, filmed from the floor.
// You are one of them; five others with full scans are the community. Their names, likes and comments are sample data.
// Every number about a climb is measured from its video (video/<vid>.track.json, or a live scan in the browser).
// Routes: #/videos (tab) · #/shelf/all|gym (a binder) · #/clip/<id> · #/vs/<id>-<v> · #/route/<i> · #/walls (Gyms tab) · #/gyms (map) · #/gym/<i> · #/friends (tab: For you) · #/friends/following · #/friends/friends (friends and plans; #/friends/plan opens it too)
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
  { color: 'Green', hex: '#2E9E62', grade: '5.8', wall: 'Rope wall', img: 'wayup-p3-green', ok: true, votes: [6, 11, 4] },
  { color: 'Orange', hex: '#F08A24', grade: '5.9', wall: 'Rope wall', img: 'wayup-p3-orange', ok: true, votes: [3, 9, 14] }];
// every video in the world: [vid, who, route, topped, days ago, length in s]. "You" = the climber filmed as p2.
// Topped is what the video's last frame shows: at the top, or lower on the wall when it ends
const V = [
  ['wayup-p2a-orange', 'You', 1, false, 7, 47.4], ['wayup-p2-green', 'You', 0, true, 2, 66.3], ['wayup-p2b-orange', 'You', 1, true, 2, 43.9],
  ['wayup-p8-green', 'Noor', 0, true, 0, 77.4], ['wayup-p8-orange', 'Noor', 1, false, 0, 39.4],
  ['wayup-p1-green', 'Sam', 0, true, 1, 187.4], ['wayup-p1-orange', 'Sam', 1, false, 1, 88.5],
  ['wayup-p3-green', 'Leo', 0, true, 3, 51.2], ['wayup-p3-orange', 'Leo', 1, true, 3, 36.3],
  ['wayup-p10-green', 'Kai', 0, true, 4, 72.6],
  ['wayup-p5-green', 'Mia', 0, false, 5, 93.0], ['wayup-p5-orange', 'Mia', 1, false, 5, 59.1],
  // the rest of The Way Up: every climber in it, on both routes; the coach's labels for all of them are in labels/
  ['wayup-p10-orange', 'Kai', 1, true, 4, 59.7],
  ['wayup-p4-green', 'Ava', 0, true, 6, 92.7], ['wayup-p4-orange', 'Ava', 1, true, 6, 50.0],
  ['wayup-p6-green', 'Ben', 0, true, 1, 93.9], ['wayup-p6-orange', 'Ben', 1, true, 1, 74.1],
  ['wayup-p7-green', 'Jun', 0, true, 3, 80.3], ['wayup-p7-orange', 'Jun', 1, true, 3, 57.3],
  ['wayup-p9-green', 'Rosa', 0, true, 2, 59.3], ['wayup-p9-orange', 'Rosa', 1, true, 2, 53.3]
].map(([vid, who, ri, top, ago, s], i) => ({ i, vid, img: vid, who, ri, top, ago, D: s, ar: 9 / 16, len: mmss(s), t: [0, s], credit: 'The Way Up · Maschek & Schedl · CC BY 4.0' }));
const PEOPLE = ['Noor', 'Sam', 'Leo', 'Kai', 'Mia', 'Ava', 'Ben', 'Jun', 'Rosa'];
const rname = r => `${r.color} ${r.grade}`;
/* ---------- Grades: what climbers who topped a route felt, and how hard each gym grades ----------
   A gym's grade only means something at that gym. Two fixes, both sample data for now:
   1. after a send you say how it felt (soft, about right, hard); the route shows what everyone who topped it said
   2. every gym gets a lean, in half grades, worked out from climbers who climb at more than one gym, so a grade
      converts to what it would be at the average gym */
const FEELS = [['soft', 'Soft'], ['ok', 'About right'], ['hard', 'Hard']];
let myFeel = {}; try { myFeel = JSON.parse(localStorage.getItem('spotter-feel')) || {}; } catch {}
const feelSave = () => { try { localStorage.setItem('spotter-feel', JSON.stringify(myFeel)); } catch {} };
// a grade moved by half grades: +1 is "5.9+", +2 the next grade
function shiftG(g, h) {
  const L = GR.includes(g) ? GR : VG.includes(g) ? VG : null; if (!L || !h) return g;
  const i = Math.max(0, Math.min(L.length - 1, L.indexOf(g) + Math.trunc(h / 2))), r = h % 2;
  return `${L[i]}${r > 0 ? '+' : r < 0 ? '-' : ''}`;
}
// everyone's votes on a route, yours included, and the half grade they add up to
function votesOf(ri) {
  const v = [...(ROUTES[ri]?.votes || [0, 0, 0])], k = FEELS.findIndex(([x]) => x === myFeel[ri]); if (k >= 0) v[k]++;
  const n = v[0] + v[1] + v[2], lean = n ? (v[2] - v[0]) / n : 0;
  return { v, n, h: n >= 3 ? (lean > .2 ? 1 : lean < -.2 ? -1 : 0) : 0 };
}
const gymLean = g => g?.lean && g.lean.n >= ENOUGH ? g.lean.h : 0;
const leanWords = h => h >= 2 ? 'About a grade hard' : h === 1 ? 'About half a grade hard' : h <= -2 ? 'About a grade soft' : h === -1 ? 'About half a grade soft' : 'Graded about average';
// the gym page's block: where it sits from soft to hard, how many climbers that comes from, an example
function gymGrading(g) {
  if (!g?.lean) return '';
  const { b, n: cn, se } = g.lean, h = gymLean(g), ex = g.has.some(x => /rope/i.test(x)) ? '5.10' : 'V4', to = shiftG(ex, h);
  if (cn < ENOUGH) return `<div class="gy-ab gy-gr"><div class="gy-sh">Grading here</div><p class="gr-w"><b>Not enough climbers yet</b></p>
      <p class="cap">${cn ? `Only ${n(cn, 'climber', 'climbers')} here also climbs at other gyms. ` : ''}We show how this gym grades once ${ENOUGH} do.</p></div>`;
  return `<div class="gy-ab gy-gr"><div class="gy-sh">Grading here</div>
      <div class="gr-sc" role="img" aria-label="${leanWords(h)}"><span>Soft</span><i><b style="left:${Math.max(6, Math.min(94, 50 + b * 20))}%"></b><em style="left:${Math.max(0, 50 + (b - 2 * se) * 20)}%;right:${Math.max(0, 50 - (b + 2 * se) * 20)}%"></em></i><span>Hard</span></div>
      <p class="gr-w"><b>${leanWords(h)}</b> compared with other gyms</p>
      <p class="cap">${h ? `A ${ex} here is about a ${to} at the average gym. ` : `A ${ex} here is about a ${ex} anywhere. `}From ${cn} climbers who also climb at other gyms.</p></div>`;
}
// the route page's block: the gym's grade, what the climbers who topped it say, your vote, and the grade at the average gym
function gradeBlock(i, topped) {
  const r = ROUTES[i], q = votesOf(i), said = shiftG(r.grade, q.h), avg = shiftG(r.grade, q.h + gymLean(gym)), max = Math.max(1, ...q.v);
  return `<div class="hl2 dk2"><h2>Grade</h2><span class="hint2">${n(q.n, 'vote', 'votes')}</span></div>
    <div class="stack"><div class="lt gv">
      <div class="gv-top"><span><i>The gym</i><b class="num">${r.grade}</b></span><span><i>Climbers who topped it</i><b class="num">${q.n >= 3 ? said : '—'}</b></span><span><i>Average gym</i><b class="num">${avg}</b></span></div>
      <div class="gv-bars">${FEELS.map(([k, l], j) => `<div class="gv-r${myFeel[i] === k ? ' mine' : ''}"><span>${l}</span><i><b style="width:${q.v[j] / max * 100}%"></b></i><em class="num">${q.v[j]}</em></div>`).join('')}</div>
      ${topped ? `<p class="gv-q">How did it feel to you?</p><div class="gv-seg" role="group" aria-label="How it felt">${FEELS.map(([k, l]) => `<button type="button" data-act="feel" data-ri="${i}" data-k="${k}" aria-pressed="${myFeel[i] === k}">${l}</button>`).join('')}</div>`
        : '<p class="gv-q gv-no">Top it to vote. Only climbers who topped it are counted.</p>'}
      <p class="la-how">${gym.name} grades ${leanWords(gymLean(gym)).toLowerCase().replace('graded ', '')}, from climbers who also climb elsewhere. That puts ${rname(r)} at about ${avg} at the average gym.</p></div></div>`;
}
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
  Promise.all(miss.filter(v => !v.mine).map(v => fetch(`video/${v.vid}.track.json`).then(x => x.ok ? x.json() : null).then(T => { TRK[v.vid] = T; }).catch(() => {})))
    .then(() => { if (page === at[0] && arg === at[1]) render(); });
}

/* ---------- Your videos ---------- */
// videos you bring in from your phone: kept on it (the analysis server reads a copy and deletes it). The file plays from a blob URL and its first frame is the picture
const MINE = {};
const pic = (name, f) => MINE[name]?.pic || `img/${name}${f === 0 ? '0' : ''}.jpg`;
const vsrc = vid => MINE[vid]?.src || `video/${vid}.mp4`;
// one clip = one try of yours. v = its video in V; ri = its route (you can change it); hidden = only you see it
const clips = [];
let cid = 0, newPublic = true;
const vidOf = c => V[c.v];
// a try filmed today is from today, whatever the sample video's own day
const agoOf = c => c.ago ?? V[c.v].ago;
const byId = id => clips.find(x => x.id === +id);
// try number: your tries on that route, oldest first
const tryOf = c => clips.filter(x => x.ri === c.ri && (agoOf(x) > agoOf(c) || agoOf(x) === agoOf(c) && x.id <= c.id)).length;
const topOf = c => c.res ? c.res !== 'Project' : V[c.v].top;
// gy = the gym (index in gyms), read from where the video was filmed. null = location was off, so you pick it: the video gets a tag until you do
const NOLOC = new Set(['wayup-p2a-orange']);
const gymName = c => c.gy == null ? 'No gym yet' : gyms[c.gy].name;
const gymTag = c => c.gy == null ? '<span class="vc-gy">+ Gym</span>' : '';
function addClip(v, o = {}) {
  const x = V[v], c = { id: cid++, v, ri: x.ri, img: x.img, len: x.len, gy: NOLOC.has(x.vid) ? null : 0, hidden: !newPublic, cm: [], likes: 0, an: 'idle', ...o };
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
  search: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>',
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
const MASC = '<svg class="masc" viewBox="0 0 56 52" aria-hidden="true"><path d="M9 22 18 12l17-2 13 9 3 15-9 12-18 2-13-8z" fill="#B7D8F5" stroke="#111" stroke-width="2.6" stroke-linejoin="round"/><path d="M12 19c2-9 12-14 23-12 6 1 9 5 9 9-9-3-21-2-32 3z" fill="#C4F52A" stroke="#111" stroke-width="2.6" stroke-linejoin="round"/><path d="M41 15c4 0 8 1 11 4" fill="none" stroke="#111" stroke-width="2.6" stroke-linecap="round"/><rect x="20" y="24" width="4" height="7" rx="1" fill="#111"/><rect x="32" y="23" width="4" height="7" rx="1" fill="#111"/><path d="M19 35c4 5 13 5 18-1" fill="none" stroke="#111" stroke-width="2.6" stroke-linecap="round"/></svg>';
const SPK = '<svg class="spk" viewBox="0 0 20 20" aria-hidden="true"><path d="M8 0h4v6h2v2h6v4h-6v2h-2v6H8v-6H6v-2H0V8h6V6h2z" fill="currentColor"/></svg>';
const tabHead = t => `<div class="tabh"><h1 class="hl tab">${t}${MASC}</h1>${t === 'Profile' ? '' : `<button class="av sm" type="button" data-act="to" data-to="profile" aria-label="Your profile">${avatar('You')}</button>`}</div>`;
const bar = (title = '', right = '') => `<div class="bar"><button class="bk" type="button" data-act="back" aria-label="Back">${ic.back}</button><span>${title}</span>${right}</div>`;
const DOTS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';
const LOCK = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
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
    <button class="link dk" type="button" data-act="to" data-to="pick/new">Look around first</button>`,
    cta: `<button class="b-ghost" type="button" data-act="film">Film a try</button><button class="b-lime" type="button" data-act="upload">Import videos</button>`,
    after: () => fetch('video/wayup-p3-green.track.json').then(x => x.json()).then(T => { const s = T.S.find(q => q.p && q.t >= 20); return s && window.poseStill?.('video/wayup-p3-green.mp4', T, s, 'none', 'good'); })
      .then(u => { const im = $('obex'); if (u && im) im.src = u; }).catch(() => {}) };
}

/* ---------- Pick your climbing style: a page of shapes you tap, after the "Pick" pages in the team's references ----------
   Twelve shapes scattered and tilted (pixel heart, starburst, diamonds, triangle, circle, square). Grey until picked,
   orange once picked. Reached after the first screen ("Look around first") and from Profile. What you pick shows on Profile. */
const STYLES = [
  // two to a row, each one clear of its neighbours even after its tilt
  ['rope', 'Top rope', 'dia', 8, 14, 200, 66, -6],
  ['crimp', 'Crimps', 'circ', 236, 4, 118, 118, 0],
  ['boulder', 'Bouldering', 'heart', 10, 110, 180, 160, -6],
  ['slab', 'Slab', 'tri', 214, 140, 146, 132, 8],
  ['lead', 'Lead', 'burst', 8, 300, 140, 140, 0],
  ['over', 'Overhang', 'dia', 162, 320, 200, 64, -8],
  ['tech', 'Technical', 'dia', 4, 470, 196, 64, 8],
  ['dyno', 'Dynos', 'burst', 214, 410, 140, 140, 0],
  ['endure', 'Endurance', 'sq', 14, 572, 150, 104, -6],
  ['out', 'Outdoor', 'tri', 196, 570, 150, 136, -8],
  ['train', 'Training', 'sq', 30, 710, 140, 104, 6],
  ['all', 'All of it', 'circ', 220, 736, 124, 124, 0]];
const STAGE_H = 880;
let savedStyles;
try { savedStyles = JSON.parse(localStorage.getItem('spotter-styles') || '[]'); } catch (_) { savedStyles = []; }
const picks = new Set(Array.isArray(savedStyles) ? savedStyles.filter(k => STYLES.some(style => style[0] === k)) : []);
// what you're up to, shown next to your home gym; you pick it from a short list
const STATUS = [['climbing', 'Climbing now'], ['training', 'In training'], ['resting', 'Resting'], ['recover', 'Recovering'], ['partner', 'Looking for a partner'], ['', 'No status']];
let myStatus; try { myStatus = localStorage.getItem('spotter-status') ?? 'climbing'; } catch (_) { myStatus = 'climbing'; }
if (!STATUS.some(s => s[0] === myStatus)) myStatus = 'climbing';
const styleLine = () => picks.has('all') || !picks.size ? '' : STYLES.filter(x => picks.has(x[0])).slice(0, 3).map(x => x[1].toLowerCase()).join(' · ');
function viewPick(a) {
  return { bare: true, fit: true, after: fitStylePicker, cta: `<button class="b-glass pk-done" type="button" data-act="pkdone" data-from="${a || ''}">${picks.size ? 'Done' : 'Skip for now'}</button>`, html: `
    <div class="pk-top"><button class="pk-bk" type="button" data-act="back" aria-label="Back">${ic.back}</button>
      <h1 class="pk-h"><span>Pick ✦</span>your climbing style</h1><span class="pk-st" aria-hidden="true">${MASC}</span><i class="pk-px" aria-hidden="true"></i></div>
    <section class="pk-panel"><div class="pk-q"><span>🤔 What do you like to climb? (pick any)</span><b class="num">Picked ${picks.size}</b></div>
      <div class="pk-stage">${STYLES.map(([k, t, sh, x, y, w, h, r]) => `<button class="pk pk-${sh}${picks.has(k) ? ' on' : ''}" type="button" data-act="pk" data-k="${k}" aria-pressed="${picks.has(k)}"
        style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;--r:${r}deg"><span>${t}</span></button>`).join('')}</div></section>` };
}

let stylePickerResize = null;
function fitStylePicker() {
  const screen = document.querySelector('.screen'), stage = document.querySelector('.pk-stage'), question = document.querySelector('.pk-q');
  if (!screen || !stage || !question) return;
  const resize = () => {
    if (!stage.isConnected) { window.removeEventListener('resize', resize); return; }
    // twelve styles don't fit one screen at a size you can tap, so the stage scales to the width only and the page scrolls
    const scale = Math.max(.3, Math.min(1, stage.parentElement.clientWidth / 370));
    stage.style.setProperty('--stage-scale', scale);
    stage.parentElement.style.setProperty('--stage-height', `${STAGE_H * scale}px`);
  };
  resize(); stylePickerResize = resize; window.addEventListener('resize', resize);
}
function animateProfileShapes() {
  const box = $('profile-shapes');
  if (!box) return;
  const elements = [...box.querySelectorAll('.ph-shape')];
  if (!elements.length) return;
  // your styles drop into the whole card and pile up on its floor; only the corner under your photo is kept clear.
  // Bodies collide as boxes (what you see), labels stay level, and you can pick one up and throw it
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = box.clientWidth, H = box.clientHeight;
  const size = Math.round(Math.min(100, Math.max(58, Math.sqrt(W * H * .38 / elements.length))));
  const R = size / 2, AV = { x0: 0, x1: 118, y0: H - 54, y1: H };
  const tilt = [-6, 5, -3, 7, -8, 4, -5, 6, -2, 8, -7, 3];
  const bodies = elements.map((el, i) => ({ el, x: R + 4 + (elements.length > 1 ? (i % 2 ? elements.length - 1 - (i >> 1) : i >> 1) / (elements.length - 1) : .5) * (W - size - 8), y: -R - i * size * .55, vx: 0, vy: 0, a: tilt[i % tilt.length], base: tilt[i % tilt.length] }));
  elements.forEach(el => { el.style.width = el.style.height = `${size}px`; });
  let drag = null, raf = 0, still = 0;
  const step = dt => {
    bodies.forEach(b => {
      if (b === drag?.b) return;
      b.vy += .32 * dt; b.vx *= .995; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx) * .5; } if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx) * .5; }
      if (b.y > H - R) { b.y = H - R; b.vy = Math.abs(b.vy) > 1.2 ? -b.vy * .3 : 0; b.vx *= .86; }
      // the photo's corner is a block like the others
      const ox = Math.min(b.x + R - AV.x0, AV.x1 - (b.x - R)), oy = Math.min(b.y + R - AV.y0, AV.y1 - (b.y - R));
      if (ox > 0 && oy > 0) { if (oy < ox) { b.y = AV.y0 - R; if (b.vy > 0) b.vy = b.vy > 1.2 ? -b.vy * .3 : 0; b.vx *= .86; } else { b.x = AV.x1 + R; b.vx = Math.abs(b.vx) * .5; } }
      b.a += (b.base + Math.max(-14, Math.min(14, b.vx * 2)) - b.a) * .2;
    });
    for (let k = 0; k < 3; k++) for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const p = bodies[i], q = bodies[j], dx = q.x - p.x, dy = q.y - p.y, ox = size - Math.abs(dx), oy = size - Math.abs(dy);
      if (ox <= 0 || oy <= 0) continue;
      const wp = p === drag?.b ? 0 : q === drag?.b ? 1 : .5, wq = 1 - wp;
      if (oy < ox) { const s = Math.sign(dy) || 1; p.y -= s * oy * wp; q.y += s * oy * wq; const top = s > 0 ? p : q, bot = s > 0 ? q : p; if (top.vy > bot.vy) { const v = (top.vy + bot.vy) / 2; top.vy = v * .3; top.vx *= .9; } }
      else { const s = Math.sign(dx) || 1; p.x -= s * ox * wp; q.x += s * ox * wq; const v = (p.vx + q.vx) / 2; p.vx = q.vx = v; }
    }
  };
  const draw = () => bodies.forEach(b => { b.el.style.transform = `translate(${b.x - R}px, ${b.y - R}px) rotate(${b.a}deg)`; b.el.style.setProperty('--a', `${-b.a}deg`); });
  const frame = now => {
    if (!box.isConnected) return;
    const dt = Math.min((now - (frame.t || now)) / 16.67, 2) || 1; frame.t = now;
    step(dt); draw();
    const moving = drag || bodies.some(b => Math.abs(b.vx) > .05 || Math.abs(b.vy) > .05 || b.y < -R + 1);
    still = moving ? 0 : still + 1;
    raf = still > 20 ? 0 : requestAnimationFrame(frame);
  };
  const wake = () => { still = 0; if (!raf) { frame.t = 0; raf = requestAnimationFrame(frame); } };
  if (reduced) { for (let t = 0; t < 600; t++) step(1); bodies.forEach(b => { b.a = b.base; }); draw(); }
  else { draw(); wake(); }
  const at = e => { const r = box.getBoundingClientRect(), k = r.width / W || 1; return [(e.clientX - r.left) / k, (e.clientY - r.top) / k]; };
  elements.forEach((el, i) => el.addEventListener('pointerdown', e => {
    const b = bodies[i], [x, y] = at(e); el.setPointerCapture(e.pointerId);
    drag = { b, dx: b.x - x, dy: b.y - y, lx: x, ly: y }; b.vx = b.vy = 0; el.classList.add('held'); wake();
  }));
  box.addEventListener('pointermove', e => {
    if (!drag) return; const [x, y] = at(e), b = drag.b;
    b.x = Math.max(R, Math.min(W - R, x + drag.dx)); b.y = Math.max(R, Math.min(H - R, y + drag.dy));
    b.vx = (x - drag.lx) * .8; b.vy = (y - drag.ly) * .8; drag.lx = x; drag.ly = y;
  });
  const drop = () => { if (!drag) return; drag.b.el.classList.remove('held'); drag.b.vx = Math.max(-18, Math.min(18, drag.b.vx)); drag.b.vy = Math.max(-18, Math.min(18, drag.b.vy)); drag = null; wake(); };
  box.addEventListener('pointerup', drop); box.addEventListener('pointercancel', drop); box.addEventListener('lostpointercapture', drop);
}
/* ---------- Videos: your tries, by route ---------- */
const vtile = c => {
  const st = c.an === 'idle' || !c.an ? 'Not analysed' : c.an === 'ask' ? 'Check this' : c.an !== 'done' ? 'Analysing' : topOf(c) ? 'Topped' : 'Not topped';
  return `<button class="vt${c.hidden ? ' hid' : ''}" type="button" data-act="to" data-to="clip/${c.id}" aria-label="${rname(ROUTES[c.ri])}, try ${tryOf(c)}, ${dayLabel(agoOf(c))}">
    <img src="${pic(c.img)}" alt=""><span class="shade"></span>
    <span class="vt-t">Try ${tryOf(c)}</span>${gymTag(c)}
    <span class="vt-b${c.an === 'ask' ? ' ask' : ''}">${c.hidden ? ic.eyeOff : ''}${st} · ${dayLabel(agoOf(c))}</span></button>`;
};
// a day's tries logged by hand on one route: a tile with no picture. Today's opens Log by hand, an older one the route
const htile = l => `<button class="vt vt-h" type="button" data-act="to" data-to="${l.ago === 0 ? 'session' : `route/${l.ri}`}" aria-label="${rname(ROUTES[l.ri])}, logged by hand, ${dayLabel(l.ago)}">
    ${ic.pen}<span class="vt-t">By hand</span>
    <span class="vt-b">${l.sent ? `${ic.check}${l.style || 'Topped'}` : n(l.tries, 'attempt', 'attempts')} · ${dayLabel(l.ago)}</span></button>`;
const handOn = ri => logs.filter(l => l.ri === ri && (l.tries || l.sent));
// days logged by grade: no route and no video, one tile a day. Today's opens Log by hand
const gdays = () => { const ds = [...new Set(glogs.map(x => x.ago))].sort((p, q) => p - q); if (!ds.length) return '';
  const rg = (xs, S) => { const ix = xs.filter(x => S.includes(x.g)).map(x => S.indexOf(x.g)); if (!ix.length) return ''; const lo = S[Math.min(...ix)], hi = S[Math.max(...ix)]; return lo === hi ? lo : `${lo}–${hi}`; };
  const t = (ago, xs) => {
    return `<button class="vt vt-h vt-gr" type="button" data-act="to" data-to="${ago === 0 ? 'session' : 'profile'}" aria-label="Logged by grade, ${dayLabel(ago)}">
      <b class="vt-rg">${[rg(xs, VG), rg(xs, GR)].filter(Boolean).join('<br>')}</b><span class="vt-t">By grade</span><span class="vt-b">${n(xs.length, 'climb', 'climbs')} · ${dayLabel(ago)}</span></button>`; };
  return `<div class="sec"><h2 class="lbl">By grade</h2><span class="stg on">${n(glogs.filter(gsent).length, 'send', 'sends')}</span></div>
    <div class="vg">${ds.map(d => t(d, gday(d))).join('')}</div>`; };
// one card per try: picture on top, route and result under it. A hand log has no picture, a grade day shows its grades
let vTab = 'all';
const vcard = c => { const st = c.an === 'idle' || !c.an ? 'Not analysed' : c.an === 'ask' ? 'Check this' : c.an !== 'done' ? 'Analysing' : topOf(c) ? 'Topped' : 'Not topped', r = ROUTES[c.ri];
  return `<button class="vc${c.hidden ? ' hid' : ''}" type="button" data-act="to" data-to="clip/${c.id}" aria-label="${rname(r)}, try ${tryOf(c)}, ${dayLabel(agoOf(c))}">
    <span class="vc-i"><img src="${pic(c.img)}" alt=""><span class="vc-t">Try ${tryOf(c)}</span>${gymTag(c)}${c.hidden ? `<span class="vc-h">${ic.eyeOff}</span>` : ''}</span>
    <span class="vc-b"><span class="vc-r">${c.need ? 'New climb' : `${sw(r)}${rname(r)}`}</span><b class="${st === 'Topped' ? 'on' : c.an === 'ask' ? 'ask' : ''}">${st}${st === 'Analysing' ? ` <span class="num" data-pg="${c.id}"><b>${pgOf(c) ?? 0}%</b></span>` : ''}</b><span class="vc-d">${dayLabel(agoOf(c))}</span></span></button>`; };
const vhand = l => { const r = ROUTES[l.ri];
  return `<button class="vc vc-p" type="button" data-act="to" data-to="${l.ago === 0 ? 'session' : `route/${l.ri}`}" aria-label="${rname(r)}, logged by hand, ${dayLabel(l.ago)}">
    <span class="vc-i">${ic.pen}<span class="vc-t g">By hand</span></span>
    <span class="vc-b"><span class="vc-r">${sw(r)}${rname(r)}</span><b class="${l.sent ? 'on' : ''}">${l.sent ? l.style || 'Topped' : n(l.tries, 'attempt', 'attempts')}</b><span class="vc-d">${dayLabel(l.ago)}</span></span></button>`; };
const vgrade = (ago, xs) => { const rg = S => { const ix = xs.filter(x => S.includes(x.g)).map(x => S.indexOf(x.g)); if (!ix.length) return ''; const lo = S[Math.min(...ix)], hi = S[Math.max(...ix)]; return lo === hi ? lo : `${lo}–${hi}`; };
  return `<button class="vc vc-p" type="button" data-act="to" data-to="${ago === 0 ? 'session' : 'profile'}" aria-label="Logged by grade, ${dayLabel(ago)}">
    <span class="vc-i"><em class="vc-g">${[rg(VG), rg(GR)].filter(Boolean).join('<br>')}</em><span class="vc-t g">By grade</span></span>
    <span class="vc-b"><span class="vc-r">${gwhere(xs)}</span><b>${n(xs.length, 'climb', 'climbs')}</b><span class="vc-d">${dayLabel(ago)}</span></span></button>`; };
// on a route's tab: the others who climbed it, as a green card in the grid
const vpeers = i => { const ps = peersOn(i); return ps.length ? `<button class="vc vc-peer" type="button" data-act="to" data-to="route/${i}">
    <span class="pl-avs">${[...new Set(ps.map(w => w.who))].slice(0, 3).map(w => `<i>${avatar(w)}</i>`).join('')}</span><b>${n(ps.length, 'climber', 'climbers')} on it</b><span class="vc-go">Compare with them</span></button>` : ''; };
const rcard = i => { const r = ROUTES[i], cs = mineOn(i), top = cs.some(topOf) || handOn(i).some(l => l.sent), ps = peersOn(i);
  return `<button class="vc" type="button" data-act="to" data-to="route/${i}" aria-label="${rname(r)}">
    <span class="vc-i rc"><img src="${pic(r.img)}" alt=""></span>
    <span class="vc-b"><span class="vc-r">${sw(r)}${rname(r)}</span><b class="${top ? 'on' : ''}">${cs.length ? (top ? 'Topped' : 'Not topped yet') : n(ps.length, 'climber', 'climbers')}</b>
    <span class="vc-d">${cs.length ? cs.map(x => `Try ${tryOf(x)}`).join(' · ') : 'filmed it'}</span></span></button>`; };
// someone else on a route: a card with their face, how it went, and VS against your latest try
const pcard = (x, last) => `<div class="vc pc"><button class="fr-f" type="button" data-act="to" data-to="person/${x.who}" aria-label="${x.who}’s page">${avatar(x.who)}</button>
    <span class="vc-b"><b>${x.who}</b><span class="vc-d">${peerLine(x)}</span></span>
    ${last ? `<button class="pc-go" type="button" data-act="to" data-to="vs/${last.id}-${x.i}" aria-label="Compare your try with ${x.who}">VS</button>` : `<button class="pc-go w" type="button" data-act="fwatch" data-v="${x.i}">Watch</button>`}</div>`;
// Home (the Videos tab) changes with where you are. One hero card on top, picked by sceneOf():
//   live: climbing now → the clock, film a try, log by hand · done: just ended → how it went
//   plan: a climb planned today → when, where, who · new: nothing yet → your album, empty, with film / import
//   back: everything else → no card, the album is the top of the page
// Under the hero: your album, only the videos you uploaded (other climbers live on Community).
// ?scene=live|done|plan previews a scene without clicking through the flow.
const vtops = () => ROUTES.filter((r, i) => mineOn(i).some(topOf) || handOn(i).some(l => l.sent)).length;
const vlogged = () => logs.filter(l => l.tries || l.sent).length + glogs.length;
const planOfToday = () => plans.find(q => q.d === 0 && q.who.includes('You'));
const sceneOf = () => session === 'live' ? 'live' : sesDur > 0 ? 'done' : planOfToday() ? 'plan' : !clips.length && !vlogged() ? 'new' : 'back';
const todayCount = () => { const d = dayLog(0), g = gday(0);
  return `${n(d.reduce((s, e) => s + e.tries, 0) + g.length, 'try', 'tries')} · ${n(d.filter(e => e.sent).length + g.filter(gsent).length, 'send', 'sends')} today`; };
const newestClips = () => [...clips].sort((p, q) => agoOf(p) - agoOf(q) || q.id - p.id);
const heroes = {
  live: () => `<section class="hs hs-live"><span class="hs-k"><i class="dot"></i>Climbing now · ${gym.name}</span>
      <b class="hs-clk num" id="hmclk">${clk(sesSecs())}</b><span class="hs-s">${todayCount()}</span>
      <div class="hs-go"><button class="b-lime" type="button" data-act="film">${ic.rec}Film a try</button><button class="b-ghost" type="button" data-act="to" data-to="session">${ic.pen}Log by hand</button></div>
      <button class="hs-end" type="button" data-act="lgend">End session</button></section>`,
  done: () => `<section class="hs"><span class="hs-k">${ic.check}Session done · ${gym.name}</span>
      <b class="hs-clk num">${clk(sesDur)}</b><span class="hs-s">${todayCount()}</span>
      <div class="hs-go"><button class="b-lime" type="button" data-act="to" data-to="summary">See how it went</button></div></section>`,
  plan: () => { const p = planOfToday(), g = gyms[p.g], oth = p.who.filter(w => w !== 'You');
    return `<section class="hs hs-plan">${g.img ? `<img src="${pic(g.img)}" alt="">` : `<span class="gt-placeholder" aria-hidden="true">${ic.pin}</span>`}<span class="hs-k">Today · ${clock(p.h)}</span><b class="hs-t">${g.name}</b>
      <span class="hs-s">${oth.length ? `With ${names(oth)}` : 'You planned it'}</span>
      ${oth.length ? `<span class="hs-avs">${oth.slice(0, 3).map(w => `<i>${avatar(w)}</i>`).join('')}</span>` : ''}
      <div class="hs-go">${p.g === 0 ? '<button class="b-lime" type="button" data-act="plstart">Start the session</button>' : `<button class="b-lime" type="button" data-act="to" data-to="gym/${p.g}">Open the gym</button>`}</div></section>`; },
  new: () => `<div class="sec"><h2>Your album</h2></div>
      <div class="ae" role="group" aria-label="Your album is empty">
        <span class="ae-g" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
        <span class="ae-t"><b>No climbs yet</b><span>Videos and climbs you log by hand will show up here.</span></span></div>
      <div class="hs-go"><button class="b-lime" type="button" data-act="film">${ic.rec}Film a try</button><button class="b-ghost" type="button" data-act="upload">Import videos</button></div>`,
  back: () => '' };
// your album: the box with everything (photos fanned out), two pinned moments, then one binder per gym
let albumFilter = 'all', alSel = null;
const alCta = () => { const k = alSel ? alSel.size : 0, d = k ? '' : ' disabled';
  return alSel ? `<button class="b-ghost" type="button" data-act="alvis" data-v="me"${d}>Only you</button><button class="b-ghost" type="button" data-act="alvis" data-v="pub"${d}>Public</button><button class="b-lime" type="button" data-act="aldel"${d}>Delete${k ? ` ${k}` : ''}</button>` : ''; };
function album() {
  const hn = vlogged(), tops = vtops(), newest = newestClips(), nogym = clips.filter(c => c.gy == null).length, here = newest.filter(c => c.gy === 0);
  if (!clips.length && !hn) return '';
  // the album is just your videos: a grid by day, newest first. Each tile says the route and whether you topped it.
  const showVideos = albumFilter !== 'manual', showManual = albumFilter !== 'videos';
  const days = [...new Set([...(showVideos ? newest.map(agoOf) : []), ...(showManual ? glogs.map(x => x.ago) : []), ...(showManual ? logs.filter(l => l.tries || l.sent).map(l => l.ago) : [])])].sort((a, b) => a - b);
  // which gyms a day's records are from: one gym goes in the day's header, several go on each video tile
  const dayGyms = d => [...new Set([...(showVideos ? newest.filter(c => agoOf(c) === d && c.gy != null).map(c => c.gy) : []),
    ...(showManual ? glogs.filter(x => x.ago === d).map(x => x.gy) : []), ...(showManual && logs.some(l => l.ago === d && (l.tries || l.sent)) ? [0] : [])])];
  const tile = (c, many) => `<button class="al-t" type="button" ${alSel ? `data-act="alpick" data-i="${c.id}" aria-pressed="${alSel.has(c.id)}"` : `data-act="to" data-to="clip/${c.id}"`} aria-label="${rname(ROUTES[c.ri])}, try ${tryOf(c)}${topOf(c) ? ', topped' : ''}${c.hidden ? ', only you' : ''}">${alSel ? '<span class="al-ck" aria-hidden="true"></span>' : c.hidden ? `<span class="al-lock" title="Only you">${LOCK}</span>` : ''}
      <img src="${pic(c.img)}" alt="" loading="lazy"><span class="al-kind">Video · Try ${tryOf(c)}</span>${c.gy == null ? '<span class="al-ng">No gym</span>' : ''}${pgTag(c) || (topOf(c) ? `<span class="al-ok" aria-hidden="true">${ic.check}</span>` : '')}
      <span class="al-r">${c.need ? '<b>New climb</b>' : `${sw(ROUTES[c.ri])}<b>${ROUTES[c.ri].grade}</b>`}${many && c.gy != null ? `<small class="al-gy">${gyms[c.gy].name}</small>` : ''}</span></button>`;
  // a climb logged by hand has no video and no photo, so it gets one drawn hold: big, in the route's colour, cropped by the
  // corner of the tile with its bolt in the middle. The type leads; the hold only says which colour you climbed. Same record, same hold
  const holdArt = seed => {
    let s = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    const R = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296, f = v => v.toFixed(1), k = 8;
    const p = Array.from({ length: k }, (_, q) => { const t = q / k * Math.PI * 2 + R() * .35, d = 40 * (.82 + R() * .22); return [50 + Math.cos(t) * d, 50 + Math.sin(t) * d * .88]; });
    const m = q => [(p[q % k][0] + p[(q + 1) % k][0]) / 2, (p[q % k][1] + p[(q + 1) % k][1]) / 2];
    const d = `M${f(m(0)[0])} ${f(m(0)[1])}` + p.map((_, q) => ` Q${f(p[(q + 1) % k][0])} ${f(p[(q + 1) % k][1])} ${f(m(q + 1)[0])} ${f(m(q + 1)[1])}`).join('') + 'Z';
    return `<svg class="alh-art" viewBox="0 0 100 100" aria-hidden="true"><path d="${d}" fill="var(--hold)"/><circle cx="50" cy="48" r="3.2" fill="#E7E7E5"/></svg>`; };
  const handCard = ({ act, hex, grade, name, where, tries, res, sent, label, seed }) => {
    const k = Math.min(tries, 8), bars = Array.from({ length: k }, (_, b) => `<i${sent && b === k - 1 ? ' class="ok"' : ''}></i>`).join('') + (tries > 8 ? `<small>+${tries - 8}</small>` : '') + `<small>${n(tries, 'try', 'tries')}</small>`;
    return `<button class="al-t al-hand" type="button" ${act} style="--hold:${hex}" aria-label="${label}">
      <span class="alh-top"><span class="alh-pill">By hand</span><span class="alh-pill${sent ? ' on' : ''}">${res}</span></span>
      <span class="alh-b"><span class="alh-row"><strong class="alh-g">${grade}</strong>${holdArt(seed)}</span><span class="alh-tally" aria-hidden="true">${bars}</span><b>${name}</b><em>${where}</em></span></button>`; };
  const handTile = (x, i) => handCard({ act: `data-act="glrecord" data-i="${i}"`, seed: `g${i}${x.g}${x.ago}`, hex: HOLD_COLORS[x.color] || '#8A8F98',
    grade: x.g, name: `${x.color ? x.color + ' · ' : ''}${x.ty}`, where: gyms[x.gy].name, tries: x.attempts || 1, res: KL[x.k], sent: x.k !== 'Project',
    label: `${x.g}, ${x.k}, ${gyms[x.gy].name}, logged by hand` });
  const routeTile = l => { const r = ROUTES[l.ri];
    return handCard({ act: `data-act="to" data-to="route/${l.ri}"`, seed: `r${l.ri}${l.ago}${l.tries}`, hex: r.hex, grade: r.grade, name: `${r.color} · ${r.wall}`, where: gym.name,
      tries: l.tries || 1, res: l.sent ? (l.style || 'Topped') : 'Not yet', sent: l.sent, label: `${rname(r)}, logged by hand` }); };
  const box = `<div class="al${alSel ? ' sel' : ''}">${days.map(d => { const dg = dayGyms(d), many = dg.length > 1; return `<div class="al-d"><h3><button type="button" class="day-open" data-act="to" data-to="day/${d}"><em class="al-dl">${dayLabel(d)}${dg.length ? `<small class="al-dg">${many ? n(dg.length, 'gym', 'gyms') : gyms[dg[0]].name}</small>` : ''}</em> <span>View day →</span></button></h3><div class="al-g">${showManual ? glogs.map((x,i) => [x,i]).filter(([x]) => x.ago === d).reverse().map(([x,i]) => handTile(x,i)).join('') : ''}${showManual ? logs.filter(l => l.ago === d && (l.tries || l.sent)).map(routeTile).join('') : ''}${showVideos ? newest.filter(c => agoOf(c) === d).map(c => tile(c, many)).join('') : ''}</div></div>`; }).join('')}</div>`;
  const filteredCount = (showVideos ? clips.length : 0) + (showManual ? hn : 0);
  const visibleBox = days.length ? box : `<div class="album-empty"><strong>No ${albumFilter === 'videos' ? 'video' : 'manual'} records yet</strong><span>Try another filter to see your climbs.</span><button type="button" data-act="albumfilterset" data-value="all">Show all records</button></div>`;
  const sent = clips.filter(topOf), best = [...sent].sort((p, q) => GR.indexOf(ROUTES[q.ri].grade) - GR.indexOf(ROUTES[p.ri].grade) || agoOf(p) - agoOf(q))[0];
  const pins = best ? `<div class="sec"><h2>Pinned</h2></div><div class="rgrid pin">
      <button class="vc" type="button" data-act="to" data-to="clip/${best.id}" aria-label="Hardest send: ${rname(ROUTES[best.ri])}, try ${tryOf(best)}"><span class="vc-i rc"><img src="${pic(best.img)}" alt=""><span class="vc-t g">Hardest send</span>${gymTag(best)}</span>
        <span class="vc-b"><span class="vc-r">${sw(ROUTES[best.ri])}${rname(ROUTES[best.ri])}</span><b>Try ${tryOf(best)}</b><span class="vc-d">${dayLabel(agoOf(best))}</span></span></button>
      <button class="vc" type="button" data-act="reel" aria-label="Play your highlight reel"><span class="vc-i rc"><img src="${pic(newest.find(topOf).img)}" alt=""><span class="vc-pl">${ic.play}</span></span>
        <span class="vc-b"><span class="vc-r">Highlight reel</span><b>${n(sent.length, 'send', 'sends')}</b><span class="vc-d">${sent.length * 8} seconds</span></span></button></div>` : '';
  const binder = `<div class="sec"><h2>Gyms</h2></div><div class="rgrid album-gyms">
      <button class="vc bnd" type="button" data-act="to" data-to="shelf/gym" aria-label="${gym.name}">
        <span class="bnd-s">${[0, 1, 2, 3].map(k => here[k] ? `<img src="${pic(here[k].img)}" alt="">` : '<i></i>').join('')}</span>
        <span class="vc-b"><span class="vc-r">${gym.name}</span><b>${n(here.length, 'video', 'videos')}</b>
        <span class="vc-d">${tops ? `<span class="stg on">${tops} of ${ROUTES.length} routes topped</span>` : `${ROUTES.length} routes`}</span></span></button></div>`;
  const selB = showVideos && clips.length ? `<button class="al-filter${alSel ? ' active' : ''}" type="button" data-act="alsel">${alSel ? 'Done' : 'Select'}</button>` : '';
  if (alSel) return `<div class="sec al-h"><h2 id="alcount">${alSel.size ? `${alSel.size} selected` : 'Select videos'}</h2>${selB}</div>${visibleBox}`;
  return `<div class="sec al-h"><h2>${albumFilter === 'videos' ? 'Videos' : albumFilter === 'manual' ? 'By hand' : 'All records'} <span class="num">${filteredCount}</span></h2><span class="al-hb">${selB}<button class="al-filter${albumFilter !== 'all' ? ' active' : ''}" type="button" data-act="albumfilter" aria-label="Filter records"><svg aria-hidden="true" viewBox="0 0 20 20"><path d="M3 5h14M6 10h8M8 15h4"/></svg>${albumFilter === 'all' ? 'Filter' : 'Filtered'}</button></span></div>${visibleBox}${binder}`;
}
function viewVideos() {
  const sc = sceneOf();
  return { photo: clips.length ? clips[clips.length - 1].img : 'wayup-p3-green', cta: alCta(), html: `
    ${tabHead('Your climbs')}
    ${sc === 'live' || sc === 'done' ? '' : heroes[sc]()}
    <div class="fold"></div>
    ${album()}` };
}
function viewDay(a) {
  const d = Math.max(0, Number(a) || 0), cs = newestClips().filter(c => agoOf(c) === d), gs = glogs.map((x,i) => [x,i]).filter(([x]) => x.ago === d), ls = logs.filter(l => l.ago === d && (l.tries || l.sent));
  const tries = cs.length + gs.reduce((n,[x]) => n + (x.attempts || 1),0) + ls.reduce((n,x) => n + x.tries,0);
  const known = new Set([...cs.map(x => `${x.gy}:${x.ri}`), ...ls.map(x => `0:${x.ri}`)]).size;
  const best = (grades, scale) => { const found = grades.filter(g => scale.includes(g)); return found.length ? scale[Math.max(...found.map(g => scale.indexOf(g)))] : '—'; };
  const topped = [...cs.filter(topOf).map(x => ROUTES[x.ri].grade), ...gs.filter(([x]) => gsent(x)).map(([x]) => x.g), ...ls.filter(x => x.sent).map(x => ROUTES[x.ri].grade)];
  return { html: `${bar('Climbing day')}<div class="day-page"><div class="day-title"><span>${dateOf(d).toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}</span><h1>${dayLabel(d)}’s climbs<span>✦</span></h1></div><div class="day-best"><span>HARDEST COMPLETED</span><div><strong>${best(topped,GR)}</strong><small>Rope</small><strong>${best(topped,VG)}</strong><small>Boulder</small></div></div><div class="day-stats"><div><b>${tries}</b><span>Attempts</span></div><div><b>${known}</b><span>Known routes</span></div><div><b>${cs.length + gs.length + ls.length}</b><span>Records</span></div></div>${gs.length ? '<p class="day-note">Grade-only entries have no route identity, so they are not counted as known routes.</p>' : ''}<div class="day-section"><h2>Climbs & videos</h2><div class="vfeed">${gs.map(([x,i]) => `<button class="vc vc-p" type="button" data-act="glrecord" data-i="${i}"><span class="vc-i"><em class="vc-g">${x.g}</em><span class="vc-t g">By hand</span></span><span class="vc-b"><span class="vc-r">${x.ty} · ${gyms[x.gy].name}</span><b>${x.k} · ${n(x.attempts || 1,'attempt','attempts')}</b></span></button>`).join('')}${ls.map(vhand).join('')}${cs.map(vcard).join('')}</div></div></div>` };
}
// a binder: every try (all) or one gym's, with a tab per route and one for grade days. Newest first; on one day the hand log goes after the videos
function viewShelf(a) {
  const rs = ROUTES.map((r, i) => i).filter(i => mineOn(i).length || handOn(i).length), gd = [...new Set(glogs.map(x => x.ago))].sort((p, q) => p - q);
  if (vTab !== 'all' && vTab !== 'grade' && !rs.includes(+vTab)) vTab = 'all';
  if (vTab === 'grade' && !gd.length) vTab = 'all';
  const items = [];
  rs.filter(i => vTab === 'all' || +vTab === i).forEach(i => { mineOn(i).forEach(c => items.push([agoOf(c), 0, vcard(c)])); handOn(i).forEach(l => items.push([l.ago, 1, vhand(l)])); });
  if (vTab === 'all' || vTab === 'grade') gd.forEach(d => items.push([d, 2, vgrade(d, gday(d))]));
  items.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const peer = vTab !== 'all' && vTab !== 'grade' ? vpeers(+vTab) : '';
  const tabs = rs.length + (gd.length ? 1 : 0) > 1 ? `<div class="vtabs" role="tablist">
      <button type="button" role="tab" data-act="vtab" data-t="all" aria-selected="${vTab === 'all'}">All</button>
      ${rs.map(i => `<button type="button" role="tab" data-act="vtab" data-t="${i}" aria-selected="${vTab === String(i)}">${rname(ROUTES[i])}</button>`).join('')}
      ${gd.length ? `<button type="button" role="tab" data-act="vtab" data-t="grade" aria-selected="${vTab === 'grade'}">By grade</button>` : ''}</div>` : '';
  return { html: `${bar()}
    <h1 class="hl">${a === 'gym' ? gym.name : 'All videos'}</h1>
    ${items.length ? `${tabs}<div class="vfeed">${peer}${items.map(x => x[2]).join('')}</div>` : ''}` };
}

/* ---------- Import from the camera roll ---------- */
const upSel = new Set();
function openUpload() { upSel.clear(); drawRoll(); }
function drawRoll() {
  const left = V.filter(v => !v.added), k = upSel.size;
  pane(`<h2>Import videos</h2><span class="sub">${window.poseServer ? 'Uploaded to our server for analysis, then deleted' : 'Analysed on your phone. Nothing is uploaded'}</span>
    <label class="up-own">${ic.rec}<span><b>Choose from your phone</b><em>One climb, filmed from the ground, with your whole body and the whole route in frame</em></span><input type="file" accept="video/*" data-upfile hidden></label>
    ${left.length ? '<h3 class="up-h">Or try a sample video</h3>' : ''}
    ${left.length ? `<div class="roll">${left.map(v => `<button type="button" class="${upSel.has(v.i) ? 'on' : ''}" data-act="upick" data-i="${v.i}" aria-pressed="${upSel.has(v.i)}" aria-label="Video, ${rname(ROUTES[v.ri])}, ${v.len}"><img src="${pic(v.img)}" alt=""><span>${dayLabel(v.ago)} · ${v.len}</span>${upSel.has(v.i) ? `<em>${[...upSel].indexOf(v.i) + 1}</em>` : ''}</button>`).join('')}</div>
      <button class="btn-l" type="button" data-act="upnext"${k ? '' : ' disabled'}>${k ? `Import ${n(k, 'video', 'videos')}` : 'Pick a video'}</button>`
    : `<p class="hint">All videos are already in your album.</p><button class="btn-l" type="button" data-act="close">Done</button>`}`);
}
// a video from your phone: read its length, shape and first frame, then it's a try like any other, waiting to be analysed
// some phones and Windows give a video no type, so the name decides too
const isVideo = f => !!f && (f.type.startsWith('video/') || (!f.type && /\.(mp4|m4v|mov|webm|3gp|mkv|avi)$/i.test(f.name)));
// a video on the page that isn't playing: phones (iPhone above all) don't load it until it is played once, so play it muted and
// pause at once. Then its length: some recordings only know it after a seek to the end
async function openVideo(v, ms = 15000) {
  await new Promise((ok, no) => { const t = setTimeout(() => no(new Error('slow')), ms);
    v.addEventListener('loadeddata', () => { clearTimeout(t); ok(); }, { once: true });
    v.addEventListener('error', () => { clearTimeout(t); no(new Error(v.error?.code === 4 ? 'codec' : 'read')); }, { once: true });
    v.load(); v.play?.().then(() => v.pause()).catch(() => {}); });
  if (!isFinite(v.duration)) await new Promise(ok => { const t = setTimeout(ok, 3000); v.addEventListener('durationchange', () => { if (isFinite(v.duration)) { clearTimeout(t); ok(); } }); v.currentTime = 1e7; });
  v.pause();
}
window.openVideo = openVideo;
async function importFile(f) {
  if (!isVideo(f)) { toast('That isn’t a video'); return; }
  // you say where and which route, then post it or analyse it
  const c = await addMine(f, { need: true, hidden: true }, 'Opening your video…'); if (!c) return;
  closeAll(); cTab = 'why'; go(`clip/${c.id}`);
  if (V[c.v].D > 240) toast('A long video takes a while to analyse. Trim it to the climb first if you can');
}
// a video file on this phone (imported, or just filmed) becomes one of your tries: its picture, its length, kept in IndexedDB
async function addMine(f, o = {}, msg) {
  const src = URL.createObjectURL(f), v = document.createElement('video');
  Object.assign(v, { muted: true, playsInline: true, preload: 'auto', src });
  v.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none'; document.body.appendChild(v);
  if (msg) toast(msg);
  try {
    await openVideo(v);
    const D = v.duration;
    if (!isFinite(D) || D < 2) throw new Error('short');
    await new Promise(ok => { v.addEventListener('seeked', ok, { once: true }); v.currentTime = Math.min(.5, D / 2); });
    const W = v.videoWidth, H = v.videoHeight, cv = document.createElement('canvas'), k = Math.min(1, 720 / Math.max(W, H));
    cv.width = Math.round(W * k); cv.height = Math.round(H * k); cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
    const vid = `mine-${Date.now()}`; MINE[vid] = { src, pic: cv.toDataURL('image/jpeg', .82), name: f.name, at: Date.now() };
    try { await DB.put('files', vid, f); } catch (_) { toast('Your phone is out of space for videos here. It will be gone when you leave'); }
    V.push({ i: V.length, vid, img: vid, who: 'You', ri: o.ri ?? lastRoute(), top: false, ago: 0, D, ar: W / H, len: mmss(D), t: [0, D], credit: `Your video · ${esc(f.name)}`, mine: true });
    const c = addClip(V.length - 1, { gy: null, id: mineN++, ...o });
    saveSoon(); return c;
  } catch (e) { URL.revokeObjectURL(src); toast(e.message === 'short' ? 'That video is too short' : e.message === 'codec' ? 'This browser can’t play that video format. Save it as an H.264 MP4 and try again' : 'Couldn’t open that video. Try an MP4'); return null; }
  finally { v.remove(); }
}
// your imported videos stay on this phone between visits: the file itself, its picture, and the try with its analysis, in
// IndexedDB. Nothing leaves the browser
const DB = (() => {
  let p;
  const open = () => p || (p = new Promise((ok, no) => { const r = indexedDB.open('spotter', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('files'); r.result.createObjectStore('mine'); };
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }));
  const run = async (store, mode, f) => { const db = await open(); return new Promise((ok, no) => {
    const t = db.transaction(store, mode), r = f(t.objectStore(store)); t.oncomplete = () => ok(r?.result); t.onerror = t.onabort = () => no(t.error); }); };
  return { put: (s, k, v) => run(s, 'readwrite', o => o.put(v, k)), get: (s, k) => run(s, 'readonly', o => o.get(k)),
    del: (s, k) => run(s, 'readwrite', o => o.delete(k)), all: s => run(s, 'readonly', o => o.getAll()), keys: s => run(s, 'readonly', o => o.getAllKeys()) };
})();
let mineN = 1000;
const KEEPC = ['id', 'ri', 'gy', 'need', 'pick', 'hidden', 'an', 'track', 'tags', 'auto', 'likes', 'cm', 'res', 'style', 'trim', 'ago'];
// after every change on screen, write down your imported tries as they are now; forget the ones you deleted
let saveT = null;
const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(saveMine, 400); };
async function saveMine() {
  try {
    const live = clips.filter(c => V[c.v]?.mine), keep = new Set(live.map(c => V[c.v].vid));
    for (const c of live) { const x = V[c.v], m = MINE[x.vid], o = {};
      KEEPC.forEach(k => { if (c[k] !== undefined) o[k] = c[k]; }); if (o.an === 'run') o.an = 'idle';
      await DB.put('mine', x.vid, { vid: x.vid, pic: m.pic, name: m.name, D: x.D, ar: x.ar, at: m.at, c: o }); }
    for (const k of await DB.keys('mine')) if (!keep.has(k)) { await DB.del('mine', k); await DB.del('files', k); }
  } catch (_) {}
}
async function restoreMine() {
  if (!window.indexedDB) return;
  const recs = (await DB.all('mine')).sort((p, q) => (p.at || 0) - (q.at || 0));
  for (const r of recs) {
    const f = await DB.get('files', r.vid); if (!f) continue;
    MINE[r.vid] = { src: URL.createObjectURL(f), pic: r.pic, name: r.name, at: r.at };
    // a day has passed since it was imported? then it's from that many days ago
    const ago = Math.max(0, Math.floor((Date.now() - (r.at || Date.now())) / 864e5));
    V.push({ i: V.length, vid: r.vid, img: r.vid, who: 'You', ri: r.c.ri ?? 0, top: false, ago, D: r.D, ar: r.ar, len: mmss(r.D), t: [0, r.D], credit: `Your video · ${esc(r.name || 'from your phone')}`, mine: true });
    const c = addClip(V.length - 1, { ...r.c, ago: r.c.ago ?? ago });
    // analysed before the skeleton was read 15 times a second: analyse it again, so it gets the closer-following body
    if (c.track && !c.track.F) { delete c.track; delete c.auto; c.an = 'idle'; }
    if (c.track) TRK[r.vid] = c.track;
    mineN = Math.max(mineN, c.id + 1);
  }
}
const lastRoute = () => clips.length ? clips[clips.length - 1].ri : 0;
document.addEventListener('change', e => { const f = e.target.closest?.('[data-upfile]'); if (f) { importFile(f.files[0]); f.value = ''; } });
function importPicks(vs) {
  const cs = vs.map(i => addClip(i));
  closeAll(); cTab = 'why';
  if (cs.length === 1) go(`clip/${cs[0].id}`);
  else { go('videos'); toast(`${n(cs.length, 'video', 'videos')} imported`); }
}

/* ---------- Film a try: the phone camera, full screen ---------- */
// the camera reads the route from the holds in frame. In this prototype it films the next of your sample tries
let filming = false, recS = 0, recT = null, camStep = 'frame', camRoute = null, camGym = null, camColor = '', camGrade = '', camRes = null, camFeel = null;
// the phone's back camera, filming for real: a live picture while you set up, a recording while you climb, then you watch it
// back and save it as one of your videos. No sound (the analysis doesn't use it, and the file is smaller to send)
let camStream = null, camAsk = false, camErr = '', camRec = null, camChunks = [], camBlob = null, camURL = null;
const camMime = () => ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(t => window.MediaRecorder?.isTypeSupported?.(t)) || '';
async function camStart() {
  if (camStream || camAsk) return;
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { camErr = 'none'; render(); return; }
  camAsk = true;
  try { camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }); camErr = ''; }
  catch (e) { camErr = e.name === 'NotAllowedError' || e.name === 'SecurityError' ? 'denied' : 'none'; }
  camAsk = false;
  if (page !== 'cam' || camStep !== 'frame') camStop(); else render();
}
function camStop() { camStream?.getTracks().forEach(t => t.stop()); camStream = null; clearInterval(camLook); camLook = null; camSeen = { k: 'wait', n: 0, shown: 'wait' }; }
function camDrop() { if (camRec && camRec.state !== 'inactive') { camRec.onstop = null; camRec.stop(); } camRec = null; filming = false; clearInterval(recT); if (camURL) URL.revokeObjectURL(camURL); camURL = null; camBlob = null; }
// after each draw of the camera page: the live picture goes back on, or the camera is asked for
const camAttach = () => { if (camStep !== 'frame') return; const v = $('camv'); if (!camStream) { if (!camErr) camStart(); return; }
  if (v && v.srcObject !== camStream) { v.srcObject = camStream; v.play().catch(() => {}); }
  camWatch(); camSay(); };
// framing, live: a few times a second the picture is read for a body. The note above the shutter says the one thing to fix
// (or that it's right), and the body we see is drawn over the picture. It has to hold for two reads before the note changes
let camLook = null, camSeen = { k: 'wait', n: 0, shown: 'wait', since: 0 }, camLast = null;
const CAM_SAY = {
  wait: ['', 'Checking the framing…'],
  none: ['', 'No one in frame yet: stand at the route’s start'],
  lost: ['bad', 'Can’t see you: keep your whole body in frame'],
  head: ['bad', 'Head cut off: step back or tilt the phone up'],
  feet: ['bad', 'Feet cut off: step back or tilt the phone down'],
  side: ['bad', 'At the edge: move the phone so you’re centred'],
  big: ['warn', 'Step back: the route above you must fit too'],
  small: ['warn', 'Too small: move the phone a little closer'],
  ok: ['ok', 'Whole body in. Check the route’s top fits too'],
  okRec: ['ok', 'Whole body in frame'],
};
function camJudge(f) {
  if (!f) return 'wait';
  if (!f.seen) return filming ? 'lost' : 'none';
  if (!f.head) return 'head'; if (!f.feet) return 'feet'; if (!f.sides) return 'side';
  if (!filming && f.h > .5) return 'big';
  if (f.h < .1) return 'small';
  return filming ? 'okRec' : 'ok';
}
function camSay() {
  const el = $('camfb'); if (!el) return; const [tone, txt] = CAM_SAY[camSeen.shown];
  el.className = `cam-fb ${tone}`; el.querySelector('span').textContent = txt;
}
function camDraw(f) {
  const cv = $('camov'), v = $('camv'); if (!cv || !v) return;
  const r = v.getBoundingClientRect(), d = devicePixelRatio || 1;
  if (cv.width !== Math.round(r.width * d)) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
  const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); if (!f?.seen) return;
  // the video fills the screen (object-fit: cover): the same scale and crop here
  const sc = Math.max(r.width / f.W, r.height / f.H), ox = (r.width - f.W * sc) / 2, oy = (r.height - f.H * sc) / 2;
  const at = q => [(ox + q.x * f.W * sc) * d, (oy + q.y * f.H * sc) * d];
  const good = camSeen.shown === 'ok' || camSeen.shown === 'okRec';
  g.strokeStyle = good ? 'rgba(196,245,42,.9)' : 'rgba(255,190,60,.9)'; g.fillStyle = g.strokeStyle; g.lineWidth = 3 * d; g.lineCap = 'round';
  [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]].forEach(([a, b]) => {
    g.beginPath(); g.moveTo(...at(f.pts[a])); g.lineTo(...at(f.pts[b])); g.stroke(); });
  const [hx, hy] = at(f.pts[0]); g.beginPath(); g.arc(hx, hy, 9 * d, 0, 7); g.stroke();
}
function camWatch() {
  if (camLook || !window.poseFrame) return;
  let busy = false;
  camLook = setInterval(async () => {
    if (page !== 'cam' || camStep !== 'frame' || !camStream) { clearInterval(camLook); camLook = null; camDraw(null); return; }
    if (busy || document.hidden) return; busy = true;
    try {
      const f = await window.poseFrame($('camv')), k = camJudge(f);
      camSeen.n = k === camSeen.k ? camSeen.n + 1 : 1; camSeen.k = k;
      // a climber can be hidden for a moment (a volume, a turn): only after a second and a half does "can't see you" show
      const need = k === 'lost' ? 6 : 2;
      if (camSeen.n >= need && camSeen.shown !== k) { camSeen.shown = k; camSay(); }
      camLast = f; camDraw(f);
    } finally { busy = false; }
  }, 250);
}
const nextRoll = () => V.find(v => !v.added);
const HOLD_COLORS = { Green:'#2E9E62', Orange:'#F08A24', Blue:'#3F82CA', Red:'#D74D48', Yellow:'#E3C43A', Purple:'#8F69B8', Pink:'#DE7DA5', White:'#EEEEEE', Black:'#303030' };
// a video's gym, grade and colour, as you've set them on its page. A video you imported starts with none of them
const clipOf = context => String(context).startsWith('clip:') ? byId(+String(context).slice(5)) : null;
const clipPick = c => c.pick || (c.need ? { gy: null, color: '', grade: '' } : { gy: c.gy, color: ROUTES[c.ri]?.color || '', grade: ROUTES[c.ri]?.grade || '' });
const pickDone = c => { const p = clipPick(c); return p.gy != null && !!p.color && !!p.grade; };
// the route a gym, colour and grade make: the one already known, or a new one
function routeFor(gy, color, grade, img) {
  let ri = ROUTES.findIndex(r => (r.gymId ?? 0) === gy && r.color === color && r.grade === grade);
  if (ri < 0) ri = ROUTES.push({ gymId: gy, color, hex: HOLD_COLORS[color], grade, wall: grade.startsWith('V') ? 'Boulder' : 'Rope wall', img, ok: true }) - 1;
  return ri;
}
function setPick(c, k, val) {
  const p = { ...clipPick(c), [k]: val }; c.pick = p;
  if (pickDone(c)) { c.ri = routeFor(p.gy, p.color, p.grade, c.img); c.gy = p.gy; delete c.need; }
  saveSoon(); closeAll(); render();
}
function openClipGrade(c) {
  const sel = clipPick(c).grade;
  pane(`<div class="choice-panel"><h2>Choose a grade</h2><p>The grade of the route you climbed.</p>${[['Rope', GR], ['Boulder', VG]].map(([title, grades]) => `<h3>${title}</h3><div class="grade-choices">${grades.map(g => `<button type="button" data-act="clpgrade" data-c="${c.id}" data-grade="${g}" aria-pressed="${sel === g}">${g}</button>`).join('')}</div>`).join('')}</div>`);
}
function openHoldColors(context) {
  const selected = context === 'cam' ? camColor : clipOf(context) ? clipPick(clipOf(context)).color : glColor;
  pane(`<div class="choice-panel"><h2>Hold colour</h2><p>Choose the colour of your route.</p><div class="hold-choices">${Object.entries(HOLD_COLORS).map(([name,hex]) => `<button type="button" data-act="holdpick" data-context="${context}" data-color="${name}" aria-pressed="${selected === name}"><i style="--hold:${hex}"></i><span>${name}</span>${selected === name ? '<b>✓</b>' : ''}</button>`).join('')}</div></div>`);
}
function openCameraPicker(kind) {
  if (kind === 'color') { openHoldColors('cam'); return; }
  if (kind === 'gym') { openGymPick('cam'); return; }
  pane(`<div class="choice-panel"><h2>Choose a grade</h2><p>Choose the grade for your climb.</p>${[['Rope',GR],['Boulder',VG]].map(([title,grades]) => `<h3>${title}</h3><div class="grade-choices">${grades.map(g => `<button type="button" data-act="campickgrade" data-grade="${g}" aria-pressed="${camGrade === g}">${g}</button>`).join('')}</div>`).join('')}</div>`);
}

function viewCam() {
  if (camStep === 'review' && camURL) return { bare: true, dark: true, html: '', overlay: `<div class="cam-review"><header><button class="bk" type="button" data-act="camretake" aria-label="Back">${ic.back}</button><strong>Preview your climb</strong></header><div class="cam-preview"><video src="${camURL}" controls playsinline preload="metadata"></video></div><div class="cam-res"><strong>How did it go?</strong><div>${[['Flash', '✦'], ['Send', '✓'], ['Project', '↗']].map(([k, icon]) => `<button type="button" data-act="camres" data-k="${k}" aria-pressed="${camRes === k}"><span aria-hidden="true">${icon}</span>${KL[k]}</button>`).join('')}</div><small>${camRes === 'Flash' ? 'Finished on your first try' : camRes === 'Send' ? 'Finished after more than one try' : camRes === 'Project' ? 'Still working on it' : 'Pick one to save'}</small>${camRes === 'Flash' || camRes === 'Send' ? `<strong class="cam-fq">How did the grade feel? <i>Optional</i></strong><div>${FEELS.map(([k, l]) => `<button type="button" data-act="camfeel" data-k="${k}" aria-pressed="${camFeel === k}">${l}</button>`).join('')}</div>` : ''}</div><div class="cam-review-actions"><button type="button" data-act="camretake">Retake</button><button type="button" data-act="camsave"${camRes ? '' : ' disabled'}>Save climb</button></div></div>` };
  const ready = !!camStream, ask = camGym === null || !camColor || !camGrade;
  const why = camErr === 'denied' ? ['Camera access is off', 'Allow the camera for this site in your browser settings, then try again.'] : camErr ? ['No camera here', 'This browser or device can’t film. Import a video you filmed instead.'] : null;
  return { bare: true, dark: true, html: '', after: camAttach, overlay: `
    <video id="camv" class="cam-live" muted playsinline autoplay aria-label="What your camera sees"></video><canvas id="camov" class="cam-ov" aria-hidden="true"></canvas>
    ${why ? `<div class="cam-err"><strong>${why[0]}</strong><span>${why[1]}</span><div><button type="button" data-act="camtry">Try again</button><button type="button" data-act="upload">Import a video</button></div></div>` : ''}
    <div class="cam-top${filming ? ' rec' : ''}"><button class="bk" type="button" data-act="back" aria-label="Back"${filming ? ' hidden' : ''}>${ic.back}</button><div class="cam-tags" aria-label="Climb details"${filming ? ' hidden' : ''}><button class="cam-chip cam-chip-gym${camGym === null ? ' todo' : ''}" type="button" data-act="campicker" data-kind="gym">${camGym === null ? 'Gym' : gyms[camGym].name}<svg aria-hidden="true" class="cam-chevron" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4"/></svg></button><button class="cam-chip${camGrade ? '' : ' todo'}" type="button" data-act="campicker" data-kind="grade">${camGrade || 'Grade'}<svg aria-hidden="true" class="cam-chevron" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4"/></svg></button><button class="cam-chip${camColor ? '' : ' todo'}" type="button" data-act="campicker" data-kind="color">${camColor ? `<i style="--hold:${HOLD_COLORS[camColor]}"></i>${camColor}` : 'Colour'}<svg aria-hidden="true" class="cam-chevron" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4"/></svg></button></div>${filming ? `<span class="rec-on cam-recording"><i></i><span id="recT" class="num">${mmss(recS)}</span></span>` : ''}</div>
    <span class="cam-fr" aria-hidden="true"><i></i><i></i><i></i><i></i></span>${why || filming ? '' : !ready ? '<p class="cam-guide">Starting the camera…</p>' : ''}${why || !ready ? '' : `<p class="cam-fb" id="camfb" role="status" aria-live="polite"><i></i><span></span></p>`}
    <div class="cam-bot">${filming ? '<span></span>' : `<button class="cam-imp" type="button" data-act="upload"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.6"/></svg><span>Import</span></button>`}<button class="shut${filming ? ' on' : ''}${ask && !filming ? ' ask' : ''}" type="button" data-act="shoot" aria-label="${filming ? 'Stop recording' : ask ? 'Set the route first' : 'Start recording'}"${!ready ? ' disabled' : ''}><i></i></button><span></span></div><div class="cam-shutter-label">${filming ? 'Stop' : ask ? 'Set route' : 'Record'}</div>` };
}

/* ---------- Analysis: what we saw in a video (from v8) ---------- */
const TAGS = [['head', 'Head', 'Tap your head'], ['lh', 'Left hand', 'Tap your left hand'], ['rh', 'Right hand', 'Tap your right hand'], ['lf', 'Left foot', 'Tap your left foot'], ['rf', 'Right foot', 'Tap your right foot']];
const SAMPLE_BODY = { head: { x: .5, y: .3 }, lh: { x: .38, y: .2 }, rh: { x: .62, y: .24 }, lf: { x: .42, y: .72 }, rf: { x: .58, y: .78 }, t: 0 };   // photo clips have no video to read
let tagS = { id: null, i: 0, pts: {} }, cTab = 'why', speed = 1;
const wait = ms => new Promise(r => setTimeout(r, ms));
// how far an analysis is, on a video's tile and card: drawn with the list, then kept current here without drawing the page again
const pgOf = c => c.an === 'run' ? Math.round((c.pct || 0) * 100) : null;
const pgTag = c => { const p = pgOf(c); return p == null ? (c.an === 'ask' ? '<span class="al-an ask">Check this</span>' : '') : `<span class="al-an" data-pg="${c.id}" style="--p:${p}%"><em>Analysing</em> <b class="num">${p}%</b></span>`; };
const pgShow = c => { const p = Math.round((c.pct || 0) * 100);
  document.querySelectorAll(`[data-pg="${c.id}"]`).forEach(e => { e.style.setProperty('--p', `${p}%`); const b = e.querySelector('b'); if (b) b.textContent = `${p}%`; }); };
async function analyse(c, seed) {
  c.an = 'run'; c.pct = 0;
  const began = Date.now(), lv = vidOf(c), here = () => page === 'clip' && +arg === c.id;
  const track = lv && window.poseScan ? await window.poseScan(`${vsrc(lv.vid)}`, seed, p => {
    c.pct = p; pgShow(c);   // on the video in any list, so you can leave the page and watch it from there
    if (!here()) return null;
    const n = $('anp'), b = $('anb'); if (n) n.textContent = `${Math.round(p * 100)}%`; if (b) b.style.width = `${p * 100}%`;
    return $('lvc'); }).catch(() => null) : null;
  if (track && lv.mine) { TRK[lv.vid] = track; saveSoon(); }
  c.pct = 1; if ($('anp') && here()) { $('anp').textContent = '100%'; $('anb').style.width = '100%'; }
  await wait(Math.max(0, 1200 - (Date.now() - began)));
  // a trimmed video is analysed on what's left of it
  c.track = track && c.trim ? window.__results({ ...track, S: track.S.filter(s => s.t >= c.trim[0] && s.t <= c.trim[1]), moves: track.moves.filter(m => m.t0 >= c.trim[0] && m.t <= c.trim[1]) }) : track;
  // found you: done. Not found (or nothing scanned): you tap yourself once, never made-up points on a real video
  if (seed) { c.tags = seed; c.an = 'done'; } else {
    c.auto = track?.first || null;
    if (c.auto && c.track) { c.tags = c.auto; c.an = 'done'; } else c.an = 'ask';
  }
  if (here() || ['videos', 'shelf', 'day', 'profile', 'route', 'vs', 'session'].includes(page)) render();
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
/* ---------- The video as the analysis: layers on it, a strip of frames ---------- */
// Which layers are drawn on an analysed video. Kept on the phone, so the ones you like stay on
const LAYERS = [
  ['pose', 'Body', '<circle cx="12" cy="4.5" r="2"/><path d="M12 7v7M7 9.5h10M12 14l-4 6M12 14l4 6"/>'],
  ['lock', 'Arm lock', '<path d="M5 5l4 10h10"/><circle cx="9" cy="15" r="2"/>'],
  ['cog', 'Centre', '<circle cx="12" cy="7" r="3"/><path d="M12 10v10M8.5 16.5 12 20l3.5-3.5"/>'],
  ['trail', 'Path', '<path d="M4 19c4-1 5-6 8-8s6-2 8-6"/><circle cx="20" cy="5" r="1.6"/>'],
  ['balance', 'Balance', '<path d="M12 4 20 19H4z" stroke-dasharray="3 2.5"/>'],
  ['angles', 'Angles', '<path d="M5 19h14M5 19 15 6"/><path d="M10.5 19a5.5 5.5 0 0 0-2-4.3"/>'],
  ['zoom', 'Zoom in', '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5M8 10.5h5M10.5 8v5"/>']];   // the video follows you, close up
let LAY = { pose: true, cog: true };
try { const k = JSON.parse(localStorage.getItem('spotter-layers')); if (k && typeof k === 'object') LAY = k; } catch {}
window.poseLayers = LAY;
const lyrIcon = d => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const lyrBar = (ok = {}) => `<div class="lyr" role="toolbar" aria-label="What to show on the video">
    ${LAYERS.map(([k, l, d]) => { const off = OFFWHY[k] && ok[OFFWHY[k]] === false;
      return `<button type="button" data-act="lyr" data-k="${k}"${off ? ' class="off" aria-disabled="true"' : ''} aria-pressed="${!off && !!LAY[k]}">${lyrIcon(d)}<span>${l}</span></button>`; }).join('')}
    <button type="button" data-act="spd" class="lyr-sp num" aria-label="Playback speed">${speed}×</button></div>`;
const lyrOver = () => `<div class="lvtags" id="lvtags"><span class="lvst" id="lvst" hidden></span><span class="lvtag" id="lvtag" hidden></span><span class="lvla" id="lvla" hidden></span></div>`;
// under the video, as wide as it: where you are, something to drag along, and how long the video is. While the video fills
// the screen that's a strip of its frames; pulled up, with the video small, a slim bar with a node at every move
const lyrStrip = (D, w) => `<div class="lvbar" id="lvbar" style="width:${w}"><span class="num" id="lvsa">0:00</span>
    <div class="lvstrip" id="lvstrip" role="slider" aria-label="Position in the video" tabindex="0"><div class="lvs-f" id="lvsf"></div><i class="lvs-t"><i class="lvs-p" id="lvsp"></i></i><span class="lvs-ns" id="lvsn"></span><i class="lvs-h" id="lvsh"></i></div><span class="num">${mmss(D)}</span></div>`;
function lyrSave() { window.poseLayers = LAY; try { localStorage.setItem('spotter-layers', JSON.stringify(LAY)); } catch {} }

// under the video: drag along it to find a moment. Frames from the video while it's big, nodes at each move once it's small
function stripWire(v, T) {
  const box = $('lvstrip'), row = $('lvsf'), fill = $('lvsp'), head = $('lvsh'), nodes = $('lvsn'); if (!box || !T) return;
  const N = 10, D = T.D || v.duration || 1;
  row.innerHTML = Array.from({ length: N }, () => '<canvas width="48" height="64"></canvas>').join('');
  const cvs = [...row.querySelectorAll('canvas')];
  // frames come from a second, hidden copy of the video, one seek at a time
  const s = document.createElement('video'); s.muted = true; s.playsInline = true; s.preload = 'auto'; s.src = v.currentSrc || v.src;
  s.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none'; document.body.appendChild(s);
  let i = 0; const next = () => { if (i >= N || !box.isConnected) { s.remove(); return; } s.currentTime = Math.min(D - .05, (i + .5) / N * D); };
  s.addEventListener('seeked', () => { const cv = cvs[i], g = cv.getContext('2d'), ar = s.videoWidth / s.videoHeight, w = cv.width, h = cv.height;
    const sw = ar > w / h ? s.videoHeight * w / h : s.videoWidth, sh = ar > w / h ? s.videoHeight : s.videoWidth * h / w;
    g.drawImage(s, (s.videoWidth - sw) / 2, (s.videoHeight - sh) / 2, sw, sh, 0, 0, w, h); i++; next(); });
  openVideo(s, 10000).then(next, () => s.remove());
  // a node at each move, hands larger than feet; let go near one and the video lands on it
  const moves = (T.moves || []).map(m => ({ t: m.t, hand: m.k === 'lw' || m.k === 'rw' })).sort((a, b) => a.t - b.t);
  nodes.innerHTML = moves.map(m => `<i class="${m.hand ? 'h' : 'f'}" style="left:${(m.t / D * 100).toFixed(2)}%"></i>`).join('');
  const nodeEls = [...nodes.children];
  const snap = () => { if (document.querySelector('.phone.onvid') || !moves.length) return; const r = box.getBoundingClientRect(), x = v.currentTime / D * r.width;
    const near = moves.reduce((b, m) => Math.abs(m.t / D * r.width - x) < Math.abs(b.t / D * r.width - x) ? m : b);
    if (Math.abs(near.t / D * r.width - x) < 10) v.currentTime = near.t; };
  const seek = e => { const r = box.getBoundingClientRect(); v.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (v.duration || D); };
  let drag = false;
  box.addEventListener('pointerdown', e => { e.stopPropagation(); drag = true; v.pause(); box.setPointerCapture(e.pointerId); seek(e); });
  box.addEventListener('pointermove', e => { if (drag) seek(e); });
  box.addEventListener('pointerup', () => { if (drag) snap(); drag = false; });
  box.addEventListener('pointercancel', () => { drag = false; });
  box.addEventListener('keydown', e => { const d = { ArrowLeft: -1, ArrowRight: 1 }[e.key]; if (!d) return; e.preventDefault(); v.currentTime = Math.max(0, Math.min(v.duration || D, v.currentTime + d)); });
  const at = $('lvsa'); let shown = -1;
  const tick = () => { if (!box.isConnected) return; const f = Math.min(1, v.currentTime / (v.duration || D)), pc = `${f * 100}%`; head.style.left = pc; fill.style.width = pc;
    nodeEls.forEach((n, k) => n.classList.toggle('on', moves[k].t <= v.currentTime + .05));
    const sec = Math.floor(v.currentTime); if (at && sec !== shown) { shown = sec; at.textContent = mmss(sec); box.setAttribute('aria-valuetext', `${mmss(sec)} of ${mmss(D)}`); } requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}

// with your finger, and the small video then follows them; dragging along the timeline zooms in too. Where we can't
// see you, it stays on where you were last seen
let tlDrag = false;
function followWire(box) {
  const v = $('lvv'), layers = [v].filter(Boolean);
  let cx = .5, cy = .5, z = 1, held = null; window.poseNow = null;
  const clampC = (c, z) => Math.min(1 - .5 / z, Math.max(.5 / z, c));
  const step = () => {
    if (!box.isConnected) return;
    // where we can't see you (high on the wall, out of frame), it stays on where you were last seen
    const p = window.poseNow || held; if (window.poseNow) held = window.poseNow;
    let zt = 1, xt = .5, yt = .5;
    if (p && v.readyState >= 1) {
      const h = Math.max(.05, p.y1 - p.y0, (p.x1 - p.x0) * box.offsetWidth / box.offsetHeight);
      const k = tlDrag || LAY.zoom ? 1 : anSheet?.k ?? 0;
      zt = 1 + (Math.min(2.4, Math.max(1, .75 / h)) - 1) * k; xt = (p.x0 + p.x1) / 2; yt = (p.y0 + p.y1) / 2; }
    z += (zt - z) * .18; cx += (clampC(xt, z) - cx) * .15; cy += (clampC(yt, z) - cy) * .15;
    const tf = `translate(${(50 - z * cx * 100).toFixed(2)}%, ${(50 - z * cy * 100).toFixed(2)}%) scale(${z.toFixed(3)})`;
    layers.forEach(el => { el.style.transform = tf; });
    const view = { z: +z.toFixed(3), ax: +((50 - z * cx * 100) / 100).toFixed(4), ay: +((50 - z * cy * 100) / 100).toFixed(4) };
    if (JSON.stringify(view) !== JSON.stringify(window.poseView)) { window.poseView = view; }
    requestAnimationFrame(step);
  };
  box.classList.add('zoom'); requestAnimationFrame(step);
}
// analysis: the tabs and everything under them are a sheet pulled up over the page, with a handle. It has two places:
// down (the video at full size) and up (the sheet's top under a smaller video). Pulling it up shrinks the video in step
// with your finger; let go between the two and it goes on to the nearer one. Tap the handle to switch. Once it's up, the
// sheet's content scrolls on under the video, which stays the same size
let anSheet = null;
// the status bar's height: 54 in the drawn phone, the phone's own on a real one (styles.css --sb)
const sbH = () => parseFloat(getComputedStyle(document.querySelector('.screen')).paddingTop) || 0;
// the phone's own home bar, under the sheet's handle (0 in the drawn phone)
const homeH = () => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;visibility:hidden;height:env(safe-area-inset-bottom, 0px)'; document.body.appendChild(d); const h = d.offsetHeight; d.remove(); return h; };
function stickWire(box, full) {
  const scr = document.querySelector('.screen'), w = box.parentElement, m = w.parentElement, tabs = m.querySelector('.ctabs'), strip = $('lvbar');
  const ar = box.offsetWidth / box.offsetHeight, phone = scr.closest('.phone');
  // sheet down, only its handle shows at the bottom; the video and the strip under it are centred in the rest, on black
  const PEEK = 30 + homeH(), STRIP = strip ? strip.offsetHeight + 8 : 0, room = scr.clientHeight - PEEK, gap = Math.max(0, room - 8 - full - STRIP);
  // pulled up, the video is a third of its full height: the sheet gets most of the screen
  const MIN = Math.round(Math.max(180, full * .34));
  // the band holds only its pulled-up height; the room the full video needs under that is a spacer after it, so the band
  // stays stuck at the top however far the sheet's content scrolls (a stuck box can't be taller than what's left of the page)
  scr.classList.add('snap'); w.style.height = `${MIN + STRIP + 8}px`;
  const sp = w.nextElementSibling?.classList.contains('lv-sp') ? w.nextElementSibling : w.insertAdjacentElement('afterend', Object.assign(document.createElement('i'), { className: 'lv-sp' }));
  sp.style.height = `${Math.max(0, room - 8 - (MIN + STRIP + 8))}px`;
  // how far the page scrolls before the sheet's top meets the video: there the video has shrunk all the way. Measured in
  // the page's own pixels (the phone frame is scaled on screen). The video starts shrinking once it reaches the top
  // pulled up, the band moves down under the status bar (--sb), so the sheet's top stops that much lower too
  const SB = (() => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;visibility:hidden;height:var(--sb)'; scr.appendChild(d); const v = d.offsetHeight; d.remove(); return v; })();
  const start = w.offsetTop, D = Math.max(start + 1, Math.round(tabs.offsetTop - MIN - STRIP - 8 - SB));
  tabs.style.top = `calc(${MIN + STRIP + 8}px + var(--sk, 0) * var(--sb))`;   // pulled up, the video sits under the status bar, not behind it
  const pad = () => {   // enough page under the open tab for the sheet to go all the way up
    const free = m.offsetHeight - (parseFloat(m.style.paddingBottom) || 0) + sbH() + 120 - scr.clientHeight;
    const want = `${Math.max(0, Math.ceil(D - free))}px`;
    if (m.style.paddingBottom !== want) m.style.paddingBottom = want; };
  let last = 0, dir = 0, t = null, anim = null;
  const fit = () => {
    if (!box.isConnected) { scr.removeEventListener('scroll', fit); m.removeEventListener('tabchange', onTab); return; }
    const y = scr.scrollTop, k = Math.min(1, Math.max(0, (y - start) / (D - start))), h = full - (full - MIN) * k;
    const vw = Math.min(w.clientWidth, Math.round(h * ar)), top = Math.round(gap / 2 * (1 - k));
    box.style.width = `${vw}px`; w.style.paddingTop = `${top}px`;
    w.style.setProperty('--bh', `${top * 2 + h + STRIP + 8}px`);
    // the layer buttons: on the video's right edge while it fills the screen. Pulled up, the video and the buttons are one
    // group, side by side and centred together, the buttons as tall as the video; the strip under them is as wide as both
    const lyr = w.querySelector(':scope > .lyr'), up = k >= .5, lw = lyr ? lyr.offsetWidth : 0, shift = up && lyr ? (lw + 8) / 2 : 0;
    box.style.left = `${-shift}px`;
    if (lyr) { const right = (w.clientWidth + vw) / 2 - shift;
      // full size, its right edge lines up with the ⋯ button above it (and never past the video's edge); measured from the
      // right, so the panel's own width, which changes with the labels, can't push it off the screen
      const mb = document.querySelector('.bar-more'), wr = w.getBoundingClientRect(), s = wr.width / (w.offsetWidth || 1);
      // the tags on the video: a column whose left edge is the back button's, under the header, while the video fills the
      // screen (the layer panel does the same on the right with ⋯); in the video's corner once it's pulled up and small
      const tags = $('lvtags'), bk = document.querySelector('.bar .bk');
      if (tags) { const br = box.getBoundingClientRect(), kr = bk?.getBoundingClientRect();
        const L = !up && kr ? Math.max(8, (kr.left - br.left) / s) : 8, Tp = !up && kr ? Math.max(8, (kr.bottom - br.top) / s + 12) : 8;
        tags.style.left = `${Math.round(L)}px`; tags.style.top = `${Math.round(Tp)}px`; }
      const ins = mb ? (wr.right - mb.getBoundingClientRect().right) / s : 16;
      if (up) { lyr.style.right = 'auto'; lyr.style.left = `${right + 8}px`; }
      else { lyr.style.left = 'auto'; lyr.style.right = `${Math.max(w.clientWidth - right + 6, ins)}px`; } lyr.style.top = `${top + h / 2}px`; lyr.style.maxHeight = `${up ? h : h - 16}px`; }
    if (strip) strip.style.width = `${Math.min(w.clientWidth, Math.max(up ? vw + 8 + lw : vw, 260))}px`;
    w.classList.toggle('stuck', y > 4); tabs.classList.toggle('stuck', k >= 1);
    // the header's background fades in as the sheet comes up, in step with the video, instead of switching on
    phone?.style.setProperty('--sk', k.toFixed(3)); phone?.classList.toggle('onvid', k < .5); if (anSheet) anSheet.k = k;
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
  const s = T.stats, on = climbed(T), say = (title, why, next, t, see, vis, span) => ({ title, why, next, t, see, vis, span }), bal = quality(T).ok.balance;
  const isOff = x => Math.abs(x.off) >= .35, hips = x => isOff(x) ? 'b' : 'g', side = x => x.off < 0 ? 'Out to the left' : 'Out to the right';
  const rested = x => T.rests.some(r => x.t >= r.t0 && x.t < r.t1), moving = x => x.now || T.moves.some(m => x.t >= m.t0 && x.t <= m.t);
  if (s.moves < 3) { const clear = on.length ? mostBy(on, x => x.p.reduce((v, q) => v + q[2], 0)) : null;
    return say('Too little to judge', `We only saw ${n(s.moves, 'hand or foot move', 'hand and foot moves')} in this video.`, 'Film a whole try, from the first hold to where you stop.', s.first ?? clear?.t ?? 0, 'See it in the video', clear && { frames: [{ s: clear, tone: 'good', mark: 'none', title: 'We saw you here', sub: `In ${s.seen}% of this video` }] }); }
  if (s.longest && s.restStraight != null && s.restRead >= 50 && s.restStraight < 60) { const r = on.filter(x => rested(x) && bigArm(x) != null), lo = -bigArm(mostBy(r, x => -bigArm(x))), bad = mostBy(r, x => -bigArm(x)), good = mostBy(r, bigArm);
    return { sim: restSim(T, bad), ...say('Rest on straighter arms', '', 'At each rest, let one arm go straight and hang from it.', bad.t, 'See this rest', { frames: [{ s: good, tone: 'good', mark: 'arm', title: 'Your straightest rest', sub: 'You’ve done this' }, { s: bad, tone: 'bad', mark: 'arm', title: 'Your most bent rest', sub: `Arms at ${-lo}°` }],
      head: 'Your rests', share: `${s.restStraight}% on straight arms`, bar: band(T, x => !rested(x) || bigArm(x) == null ? 'm' : bigArm(x) > 145 ? 'g' : 'b'), keys: swatch('g', 'Straight') + swatch('b', 'Bent') + swatch('m', 'Moving') }, (rr => rr ? { a: rr.t0, b: rr.t1, mark: 'none', tone: 'bad' } : null)(T.rests.find(q => bad.t >= q.t0 && bad.t < q.t1))) }; }
  if (s.hipsOver < 60 && bal) { const hipX = x => (x.p[7][0] + x.p[8][0]) / 2, past = x => { const h = hipX(x), l = x.p[11][0], r = x.p[12][0]; return h < Math.min(l, r) || h > Math.max(l, r); };
    const outer = stretch(on, x => isOff(x) && past(x)), run = outer || stretch(on, isOff) || [s.far.t, s.far.t], part = on.filter(x => x.t >= run[0] && x.t <= run[1]), bad = mostBy(part, x => Math.abs(x.off)), sure = on.filter(footsSeen), good = mostBy(sure.length ? sure : on, x => -Math.abs(x.off));
    const right = part.reduce((v, x) => v + x.off, 0) > 0, last = part[part.length - 1], back = on.find(x => x.t > run[1] && !isOff(x));
    let then = 'They stayed out until the end of the climb.';
    if (back) { const dx = i => back.p[i][0] - last.p[i][0], ref = [5, 6, 11, 12].map(dx).sort((p, q) => Math.abs(p) - Math.abs(q))[0];   // the limb that moved least: the phone may have moved too
      const lf = dx(11) - ref, rf = dx(12) - ref, hip = hipX(back) - hipX(last) - ref, foot = Math.max(Math.abs(lf), Math.abs(rf));
      then = foot > 2 * Math.abs(hip) ? `At ${mmss(back.t)} your ${Math.abs(rf) > Math.abs(lf) ? 'right' : 'left'} foot moved across and your hips were back over your feet.` : `At ${mmss(back.t)} your hips came back over your feet.`; }
    return { sim: hipSim(T, part, on, isOff), ...say('Keep your hips over your feet', `${outer ? `Your hips stayed ${right ? 'right' : 'left'} of your feet` : `Your hips stayed out to the ${right ? 'right' : 'left'}`} from <button class="t-at num" type="button" ${clipAt(run[0], Math.max(run[1], run[0] + 2), 'hip')}>${mmss(run[0])}–${mmss(run[1])}</button>.<small class="tip-n">Not always a mistake: you may be hanging off a hold or setting up the next move.</small>`, `<span>${then}</span> <span>Next try: before you reach, step your ${right ? 'right' : 'left'} foot out under your hips, or turn your ${right ? 'right' : 'left'} hip in to the wall.</span>`, run[0], 'See this stretch', { frames: [{ s: good, tone: 'good', mark: 'hip', title: 'Hips centred', sub: 'For comparison' }, { s: bad, tone: 'bad', mark: 'hip', title: side(bad), sub: 'Furthest here' }],
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
  if (!bal) return say('Good control', arms ? `Arms straight in ${s.restStraight}% of your rests, and a ${s.longest.s.toFixed(1)} s rest on the way.` : `A ${s.longest.s.toFixed(1)} s rest on the way.`, 'Nothing stands out across the whole climb. Start with where you stopped, above, and compare that part with someone who topped it.', s.longest.t, 'See your best rest',
    { frames: [{ s: best, tone: 'good', mark: bigArm(best) == null ? 'none' : 'arm', title: 'Your best rest', sub: `${s.longest.s.toFixed(1)} s` }] }, { a: s.longest.t, b: s.longest.t + s.longest.s, mark: 'none', tone: 'good' });
  return { sim: isOff(far) ? hipSim(T, on.filter(isOff), on, isOff) : null, ...say('Good control', arms ? `Arms straight in ${s.restStraight}% of your rests, and hips over your feet for ${s.hipsOver}% of the climb.` : `Hips over your feet for ${s.hipsOver}% of the climb.`, 'Nothing stands out across the whole climb. Start with where you stopped, above, and compare that part with someone who topped it.', s.longest.t, 'See your best rest', { frames: [{ s: best, tone: 'good', mark: bigArm(best) == null ? 'hip' : 'arm', title: 'Your best rest', sub: `${s.longest.s.toFixed(1)} s` }, { s: far, tone: isOff(far) ? 'bad' : 'good', mark: 'hip', title: side(far), sub: isOff(far) ? 'Worth a look' : 'Still centred' }],
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
/* ---------- Legs or arms ---------- */
function legArm(T) {
  const W = T.W || 540, H = T.H || 960, a0 = T.moves[0]?.t0 ?? 0, b0 = T.moves[T.moves.length - 1]?.t ?? T.D;
  const S = T.S.filter(s => s.p && s.t >= a0 && s.t <= b0 && s.p[7][2] > .5 && s.p[8][2] > .5);
  if (S.length < 8) return null;
  const pt = (s, i) => ({ x: s.p[i][0] * W, y: s.p[i][1] * H, v: s.p[i][2] });
  const ang = (a, b, c) => { const ux = a.x - b.x, uy = a.y - b.y, vx = c.x - b.x, vy = c.y - b.y;
    return Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1)))) * 180 / Math.PI; };
  const joint = (s, a, b, c) => [a, b, c].every(i => s.p[i][2] > .5) ? ang(pt(s, a), pt(s, b), pt(s, c)) : null;
  const F = S.map(s => {
    const hip = (s.p[7][1] + s.p[8][1]) / 2 * H, sh = (s.p[1][1] + s.p[2][1]) / 2 * H;
    return { t: s.t, hip, tl: Math.abs(hip - sh) || 1,
      k: [joint(s, 7, 9, 11), joint(s, 8, 10, 12)],          // left and right knee: hip, knee, ankle
      e: [s.el ?? joint(s, 1, 3, 5), s.er ?? joint(s, 2, 4, 6)] };   // left and right elbow
  });
  // the hips, smoothed over three samples, and the body's size
  const y = F.map((f, i) => { const w = F.slice(Math.max(0, i - 1), i + 2); return w.reduce((n, g) => n + g.hip, 0) / w.length; });
  const tl = [...F.map(f => f.tl)].sort((p, q) => p - q)[F.length >> 1];
  // rises: from a low point of the hips to the next high point (y goes down on screen when you go up)
  const rises = []; let lo = 0;
  for (let i = 1; i < y.length; i++) {
    const up = y[i] < y[i - 1] - tl * .01;
    if (!up) { if (y[lo] - y[i - 1] >= tl * .3 && i - 1 > lo) rises.push([lo, i - 1]); lo = i; }
  }
  if (y[lo] - y[y.length - 1] >= tl * .3 && y.length - 1 > lo) rises.push([lo, y.length - 1]);
  // a joint's change over the rise: the angle near the start against the angle near the end, each the median of what was read
  const near = (i, j, get) => { const r = []; for (let x = i; x <= j; x++) { const v = get(F[x]); if (v != null) r.push(v); } r.sort((p, q) => p - q); return r.length ? r[r.length >> 1] : null; };
  const change = (a, b, get, sign) => { const s = near(a, Math.min(b, a + 1), get), e = near(Math.max(a, b - 1), b, get); return s == null || e == null ? null : (e - s) * sign; };
  const steps = rises.map(([a, b]) => {
    const kn = [0, 1].map(j => change(a, b, f => f.k[j], 1)).filter(v => v != null), el = [0, 1].map(j => change(a, b, f => f.e[j], -1)).filter(v => v != null);
    const knee = kn.length ? Math.min(90, Math.max(0, ...kn)) : null, elbow = el.length ? Math.min(90, Math.max(0, ...el)) : null, rise = (y[a] - y[b]) / tl;
    let kind = 'unseen';
    if (knee != null && elbow != null) kind = knee < 15 && elbow < 15 ? 'mixed' : knee >= elbow * 1.3 ? 'leg' : elbow >= knee * 1.3 ? 'arm' : 'mixed';
    return { t0: F[a].t, t1: F[b].t, rise, knee, elbow, kind };
  });
  const known = steps.filter(s => s.kind !== 'unseen'); if (known.length < 2 || known.length * 2 < steps.length) return { steps, share: null };
  const w = s => s.kind === 'leg' ? 1 : s.kind === 'arm' ? 0 : (s.knee + 1) / (s.knee + s.elbow + 2);
  const share = Math.round(known.reduce((n, s) => n + s.rise * w(s), 0) / known.reduce((n, s) => n + s.rise, 0) * 100);
  return { steps, share };
}
// the card: how much of the climbing up was legs, every step in order (tap one to watch it), and what to try
// on the video, while you go up: a tag saying whether that step up is your legs pushing or your arms pulling.
// It sits under the other tags
function laWire(T, v) {
  const tg = $('lvla'), r = legArm(T); if (!tg || !r) return;
  const L = { leg: 'Leg push', arm: 'Arm pull', mixed: 'Legs and arms' };
  const at = t => r.steps.find(z => z.kind !== 'unseen' && t >= z.t0 - .15 && t <= z.t1 + .35);
  window.poseRising = t => tg.isConnected && !!at(t);
  const tick = () => { if (!tg.isConnected) return;
    const x = at(v.currentTime), k = x ? x.kind : '';
    if (tg.dataset.k !== k) { tg.dataset.k = k; tg.textContent = k ? `${L[k]} ↑` : ''; }
    // the state above it reads Moving while you go up (pose.js asks poseRising); the tags stack in one column
    tg.hidden = !k;
    requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
function legCard(T) {
  const r = legArm(T); if (!r || !r.steps.length) return '';
  const head = `<div class="hl2 dk2"><h2>Legs or arms</h2><span class="hint2">${n(r.steps.length, 'step up', 'steps up')}</span></div>`;
  if (r.share == null) return `${head}<div class="stack"><div class="lt la"><span class="lt-h">Can’t tell from this video</span>
    <p class="tip-d">${(h => h ? `To tell a leg push from an arm pull we need to see your knees and your elbows while you move up. They were hidden on ${h} of ${n(r.steps.length, 'step', 'steps')}. Film from a little further back, side-on if you can.`
      : `There ${r.steps.length === 1 ? 'is only one step' : `are only ${r.steps.length} steps`} up in this video. We need at least two to say whether your legs or your arms did the work.`)(r.steps.filter(x => x.kind === 'unseen').length)}</p></div></div>`;
  const W = { leg: 'Legs', arm: 'Arms', mixed: 'Both', unseen: '?' }, sh = r.share;
  // the step to work on: the one where the arms did the most, beyond the legs
  const arm1 = r.steps.filter(x => x.kind === 'arm' || x.kind === 'mixed' && x.elbow > x.knee).sort((p, q) => (q.elbow - q.knee) - (p.elbow - p.knee))[0], ai = arm1 ? r.steps.indexOf(arm1) + 1 : 0;
  const say = sh >= 65 ? ['Mostly legs', 'Your legs did most of the lifting. That keeps your arms fresh for the top.']
    : sh >= 40 ? ['About half and half', 'Legs and arms shared the work.']
    : ['Mostly arms', 'Your arms did most of the lifting. They tire much sooner than your legs.'];
  const next = arm1 && (sh < 65 || arm1.kind === 'arm') ? `On step ${ai}, at ${mmss(arm1.t0)}, your arms did the most. Next try: put a foot on a higher hold first, stand up on it until the leg is straight, and only then reach. The arm just holds on.`
    : sh < 65 ? 'Next try: before each reach, put a foot on a higher hold and stand up on it until the leg is straight. The arm just holds on.' : 'Keep it up: stand up on your feet first, then reach.';
  return `${head}<div class="stack"><div class="lt la"><div class="la-top"><b class="num">${sh}%</b><span><strong>${say[0]}</strong>of the climbing up came from your legs</span></div>
    <div class="la-bar" role="img" aria-label="Legs ${sh}%, arms ${100 - sh}%"><i style="width:${sh}%"></i></div>
    <p class="la-n"><span>Legs ${sh}%</span><span>Arms ${100 - sh}%</span></p>
    <p class="tip-d">${say[1]}</p>
    <div class="mvq-l la-l">${r.steps.map((x, i) => `<button type="button" class="mvq-m la-${x.kind}" data-act="lvseek" data-t="${Math.max(0, x.t0 - .3).toFixed(2)}" aria-label="Step ${i + 1} at ${mmss(x.t0)}: ${x.kind === 'unseen' ? 'not seen' : W[x.kind]}"><b>${i + 1}</b>${W[x.kind]}</button>`).join('')}</div>
    <p class="an-nx">${next}</p>
    <p class="la-how">Each time your hips went up, we compared how much your knees straightened with how much your elbows bent. Steps where we couldn’t see both are marked ?.</p></div></div>`;
}
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
      ${s.longest && s.low && s.low.a < 145 && s.restRead >= 50 ? row(`${s.low.a < 90 ? 'Very bent' : s.low.a < 145 ? 'Bent' : 'Straight'} · ${s.low.a}°`, 'Your arms at their most bent, resting. 180° is straight', s.low.t) : ''}
      ${s.far && !shown(s.far.t) ? row(s.far.left ? 'Out to the left' : 'Out to the right', 'Your hips, furthest from your feet', s.far.t, clipNear(s.far.t, T.D, 'hip')) : ''}</div>
    <p class="trs-l">We could see you in ${s.seen}% of this video. Tap a row to watch that moment.</p>`;
}
// the climb in order: every hand and foot move, numbered, with how long you paused before the next one. The longest pauses are
// marked; tap a move to watch it
const LIMB = { lw: 'LH', rw: 'RH', la: 'LF', ra: 'RF' };
function pauses(T) {
  const ms = [...T.moves].sort((p, q) => p.t0 - q.t0); let end = ms[0]?.t ?? 0;
  return ms.map((m, i) => { const g = i ? Math.max(0, m.t0 - end) : 0; end = Math.max(end, m.t); return { ...m, i: i + 1, gap: g }; });
}
function moveSeq(T) {
  const ms = pauses(T); if (!ms.length) return '';
  const gaps = ms.slice(1).map(m => m.gap).sort((p, q) => p - q), med = gaps[Math.floor(gaps.length / 2)] || 0;
  const long = new Set(ms.filter(m => m.gap >= 1.5).sort((p, q) => q.gap - p.gap).slice(0, 3).map(m => m.i)), top = ms.find(m => long.has(m.i) && m.gap === Math.max(...gaps));
  return `<div class="hl2 dk2"><h2>Move by move</h2><span class="hint2">${n(ms.length, 'move', 'moves')}</span></div>
    <div class="stack"><div class="lt mvq"><p class="mvq-s"><span><b>${med.toFixed(1)} s</b>usual pause</span>${top ? `<span><b>${top.gap.toFixed(1)} s</b>longest, before move ${top.i}</span>` : ''}</p>
      <div class="mvq-l">${ms.map(m => `${m.gap >= 1 ? `<span class="mvq-p${long.has(m.i) ? ' long' : ''}">${m.gap.toFixed(1)}s</span>` : ''}<button type="button" class="mvq-m ${m.k === 'lw' || m.k === 'rw' ? 'h' : 'f'}" data-act="lvseek" data-t="${Math.max(0, m.t0 - .3).toFixed(2)}" aria-label="Move ${m.i}, ${m.name}, at ${mmss(m.t0)}"><b>${m.i}</b>${LIMB[m.k]}</button>`).join('')}</div>
      <p class="an-k mvq-k"><span><i class="h"></i>Hand</span><span><i class="f"></i>Foot</span><span><i class="long"></i>Long pause</span></p></div></div>`;
}
// How clear a video is, and so which conclusions we can stand behind. Better to say nothing than to say something wrong:
// each analysis is shown only when what it needs was seen well enough, and the video page says what was left out and why.
//   seen   share of the video where we found a body
//   size   how big you are: shoulders to hips, as a share of the picture's height (0.05 is a climber filmed from far off)
//   feet   share of those frames where both ankles are clearly seen
//   arms   share of the climb where an elbow angle could be read (pose.js drops angles from a hidden or tiny arm)
//   jumps  how often the body we follow leaps more than its own torso between two samples: likely someone else
// The numbers were set on The Way Up's 21 videos, all filmed from the far side of the gym: there, arm angles read in 8–34% of
// the climb, so arm conclusions are off for most of them.
const QCACHE = new WeakMap();
function quality(T) {
  if (QCACHE.has(T)) return QCACHE.get(T);
  const S = T.S || [], seen = S.filter(s => s.p), med = a => { const b = [...a].sort((x, y) => x - y); return b.length ? b[b.length >> 1] : 0; };
  const tor = s => { const p = s.p, sx = (p[1][0] + p[2][0]) / 2 * T.W, sy = (p[1][1] + p[2][1]) / 2 * T.H, hx = (p[7][0] + p[8][0]) / 2 * T.W, hy = (p[7][1] + p[8][1]) / 2 * T.H; return { l: Math.hypot(sx - hx, sy - hy), hx, hy }; };
  let jumps = 0, pairs = 0;
  for (let i = 1; i < S.length; i++) { if (!S[i].p || !S[i - 1].p) continue; pairs++; const a = tor(S[i - 1]), b = tor(S[i]); if (Math.hypot(a.hx - b.hx, a.hy - b.hy) > Math.max(a.l, b.l)) jumps++; }
  const m = { seen: seen.length / (S.length || 1), size: med(seen.map(s => tor(s).l / T.H)), feet: seen.filter(s => s.p[11][2] > .5 && s.p[12][2] > .5).length / (seen.length || 1),
    arms: (T.stats?.armRead ?? 0) / 100, jumps: jumps / (pairs || 1),
    armSecs: S.filter(s => s.p && (s.el != null || s.er != null)).length / (T.hz || 10) };
  // arm lock is drawn frame by frame, only where an arm is really read, so a few clear seconds are enough to turn it on.
  // On The Way Up's far-off videos that's 3-20 s, while the share stays under 30%. Percentages and arm angles keep the 30%
  const ok = { arms: m.arms >= .3, lock: m.armSecs >= 3, balance: m.feet >= .7 && m.seen >= .5, angles: m.arms >= .3 && m.size >= .06, tags: m.size >= .05 && m.seen >= .5 };
  const level = m.seen < .5 || m.size < .04 || m.jumps > .03 ? 'poor' : !ok.arms || !ok.balance || m.size < .06 || m.seen < .7 ? 'fair' : 'good';
  // what's off, why, and how to film it next time
  const issues = [];
  if (m.jumps > .03) issues.push(['Who we followed jumps around', 'Someone else may have been followed. Check Tracking in Info.']);
  if (m.seen < .5) issues.push([`We saw you in ${Math.round(m.seen * 100)}% of the video`, 'Keep your whole body in the picture, from start to top.']);
  else if (m.seen < .7) issues.push([`We saw you in ${Math.round(m.seen * 100)}% of the video`, 'Parts of the climb were out of the picture.']);
  if (m.size < .06) issues.push(['You’re small in the picture', 'Film a little closer, or zoom in once, so you fill more of the screen.']);
  if (!ok.arms) issues.push(['Your arms were hard to read', ok.lock ? 'So arm angles are off. Arm lock shows only where your arms can be seen.' : 'So arm lock and arm angles are off for this video.']);
  if (m.feet < .7) issues.push(['Your feet were often hidden', 'So balance and centre of mass are off for this video.']);
  const q = { ...m, ok, level, issues };
  QCACHE.set(T, q); return q;
}
const OFFWHY = { lock: 'lock', angles: 'angles', balance: 'balance' };
const offWhy = k => k === 'angles' ? 'Your arms were too small or hidden to read their angles in this video' : k === 'lock' ? 'Your arms were hard to read in this video, so arm lock is off' : 'Your feet were often hidden in this video, so balance is off';
// at the top of Summary: how clear the video is. One line when it's clear; what's off and how to film it when it isn't
function qualityCard(q) {
  if (q.level === 'good') return `<div class="qc good"><i></i><span><b>Clear video</b><em>Every analysis is on.</em></span></div>`;
  return `<div class="qc ${q.level}"><i></i><span><b>${q.level === 'poor' ? 'Hard to see you in this video' : 'Some analysis is off'}</b>
      <em>${q.level === 'poor' ? 'We won’t draw conclusions from it. Here is what got in the way:' : 'We only show what we could see clearly.'}</em></span>
    <ul>${q.issues.map(([a, b]) => `<li><b>${a}</b><em>${b}</em></li>`).join('')}</ul>
    <p class="qc-t">Best results: phone on the floor 3–4 m from the wall, whole route in the picture, one climber at a time.</p></div>`;
}

// Where you got stuck: one frame, with why it was hard to move from there. Not topped: the last stop before you came off (or the
// end itself when you hung there). Topped: the longest stop. Then the frame just before your next move, so it shows the position
// you were stuck in, with your centre of mass, the hands and feet holding you and the arm working hardest
const LNAME = { lw: 'left hand', rw: 'right hand', la: 'left foot', ra: 'right foot' };
function stuckAt(T, topped) {
  const ms = pauses(T); if (ms.length < 2) return null;
  const end = Math.max(...ms.map(m => m.t)), pz = ms.filter(m => m.gap >= 1);
  // the nearest frame to a moment where hips and feet are seen
  // a clear frame: shoulders, hips and a foot seen, and most of the body
  const ok = x => x.p && [1, 2, 7, 8].every(i => x.p[i][2] > .5) && (x.p[11][2] > .3 || x.p[12][2] > .3) && x.p.slice(0, 13).filter(q => q[2] > .5).length >= 10;
  const near = at => { const s = T.S.filter(ok).reduce((a, x) => !a || Math.abs(x.t - at) < Math.abs(a.t - at) ? x : a, null); return s && Math.abs(s.t - at) <= 1.2 ? s : null; };
  const onAt = s => ['lw', 'rw', 'la', 'ra'].filter(k => !T.moves.some(m => m.k === k && s.t >= m.t0 - .05 && s.t <= m.t + .05));
  if (!topped && T.D - end >= 1.5) { const s = near(end + Math.min(1, (T.D - end) / 2)); if (s) return { s, kind: 'end', gap: T.D - end, next: null, on: onAt(s), end }; }
  // not topped: the last stops first; topped: the longest first, leaving out the top itself (clipping in, the last reach)
  const order = topped ? pz.filter(m => m.t0 < T.D * .92).sort((p, q) => q.gap - p.gap) : [...pz.filter(m => m.t0 >= T.D * .6).reverse(), ...pz.filter(m => m.t0 < T.D * .6).sort((p, q) => q.gap - p.gap)];
  for (const m of order) { const s = near(m.t0 - Math.min(.4, m.gap / 2)); if (s) return { s, kind: topped ? 'long' : 'late', gap: m.gap, next: m, on: onAt(s), end }; }
  return null;
}
function stuckCard(T, c) {
  const k = stuckAt(T, topOf(c)), d = k && window.poseDiag?.(T, k.s, k.on.join(','));
  if (!d) return '';
  const q = quality(T), armsOk = q.ok.arms || T.stats.restRead >= 50;
  const head = k.kind === 'end' ? 'Where you came off' : k.kind === 'late' ? 'Where you got stuck' : 'Where you stopped longest';
  const what = k.kind === 'end' ? `Your last move was at ${mmss(k.end)}. You hung on ${k.gap.toFixed(1)} s more, then came off.`
    : `You stopped ${k.gap.toFixed(1)} s here before moving your ${LNAME[k.next.k]}.`;
  const side = d.side < 0 ? 'left' : 'right';
  let bal = d.base === 'in' ? ['ok', 'Weight over your feet', 'The line from your centre falls between your feet.']
    : d.base === 'out' ? ['bad', `Weight out to the ${side}`, `Your centre is past your ${side} foot, so your hands hold you on.`]
    : d.base === 'over1' ? ['ok', 'Weight over one foot', 'Only one foot was on, and your centre was above it.']
    : d.base === 'beside1' ? ['bad', `Weight beside your only foot`, `Only one foot was on, and your centre was out to the ${side} of it.`]
    : d.base === 'none' ? ['bad', 'Feet moving', 'Both feet were moving at this moment, so your arms held you.'] : null;
  if (!q.ok.balance) bal = null;
  const arm = armsOk && d.bent ? (d.bent.a < 120 ? ['bad', `${d.bent.k === 'lw' ? 'Left' : 'Right'} arm bent · ${d.bent.a}°`, 'Holding on with a bent arm tires you out fast.']
    : d.bent.a >= 145 ? ['ok', `Arms straight · ${d.bent.a}°`, 'Hanging on straight arms saves strength.'] : ['mid', `Arms half bent · ${d.bent.a}°`, 'Straighter arms would save strength here.']) : null;
  const tip = !bal && !arm ? 'Watch this moment, then see how someone else got past it.' : bal && d.base === 'none' ? 'Next try: find a foothold before you reach.'
    : bal?.[0] === 'bad' ? `Next try: before you reach, move your hips over your feet, or put a foot further ${side}.`
    : arm?.[0] === 'bad' ? 'Next try: drop your hips and straighten that arm, then move.'
    : 'Your body was in a good position, so the hard part was the next move itself. Work it out from the ground before your next try, or watch how someone who topped it did it.';
  const row = ([tone, big, small]) => `<div class="stk-r sk-${tone}"><i></i><span><b>${big}</b><em>${small}</em></span></div>`;
  return `<div class="stack"><div class="lt stuck"><span class="an-k1">${head}</span>
      <button class="stk-p" type="button" ${clipNear(k.s.t, T.D, 'none')} aria-label="Watch this moment"><img alt="" id="stkimg"><span class="stk-t num">${mmss(k.s.t)}</span></button>
      <p class="tip-d">${what}</p>
      ${bal || arm ? `<div class="stk-rs">${bal ? row(bal) : ''}${arm ? row(arm) : ''}</div>` : ''}
      <p class="an-nx">${tip}</p>
      <p class="an-k stk-k"><span><i class="sk-c"></i>Your centre</span><span><i class="sk-s"></i>Holding you</span><span><i class="sk-m"></i>Moving</span></p>
      <p class="trs-l">Worked out from your body in the video, so it’s an estimate.</p></div></div>`;
}
function stuckWire(T, c, src) {
  const im = $('stkimg'), k = im && stuckAt(T, topOf(c)); if (!k) return;
  window.poseStill(src, T, k.s, `stuck:${k.on.join(',')}`, 'bad').then(u => { if (u) im.src = u; });
}
// where you went: your hips over the whole climb, drawn on the first frame, with the hands faint behind; the stops are
// circles, bigger for longer
function climbPath(T, img) {
  const on = climbed(T).filter(s => s.p[7][2] > .5 && s.p[8][2] > .5); if (on.length < 4) return '';
  const W = T.W || 540, H = T.H || 960, hip = s => [(s.p[7][0] + s.p[8][0]) / 2 * W, (s.p[7][1] + s.p[8][1]) / 2 * H];
  const line = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
  // pose points jitter frame to frame: a moving average shows the line you actually took
  const sm = (pts, w = 4) => pts.map((_, i) => { const r = pts.slice(Math.max(0, i - w), i + w + 1); return [r.reduce((s, p) => s + p[0], 0) / r.length, r.reduce((s, p) => s + p[1], 0) / r.length]; });
  const hp = sm(on.map(hip)), hand = k => sm(on.filter(s => s.p[k][2] > .5).map(s => [s.p[k][0] * W, s.p[k][1] * H]));
  const all = [...hp, ...hand(5), ...hand(6)], xs = all.map(p => p[0]), ys = all.map(p => p[1]);
  let x0 = Math.min(...xs) - 60, x1 = Math.max(...xs) + 60, y0 = Math.min(...ys) - 60, y1 = Math.max(...ys) + 60;
  let vw = x1 - x0, vh = y1 - y0; const ar = Math.min(1, W / H); if (vw / vh < ar) { vw = vh * ar; x0 = (x0 + x1) / 2 - vw / 2; } else { vh = vw / ar; y0 = (y0 + y1) / 2 - vh / 2; }
  vw = Math.min(vw, W); vh = Math.min(vh, H); x0 = Math.max(0, Math.min(W - vw, x0)); y0 = Math.max(0, Math.min(H - vh, y0));
  const zk = vw / 540, at = t => { const s = on.reduce((b, x) => Math.abs(x.t - t) < Math.abs(b.t - t) ? x : b); return hip(s); };
  const stops = T.rests.filter(r => r.t1 - r.t0 >= 1).map(r => ({ p: at((r.t0 + r.t1) / 2), s: r.t1 - r.t0 }));
  const side = (Math.max(...hp.map(p => p[0])) - Math.min(...hp.map(p => p[0]))) / W;
  return `<div class="hl2 dk2"><h2>Your path</h2><span class="hint2">${n(stops.length, 'stop', 'stops')}</span></div>
    <div class="stack"><div class="lt cpath"><svg viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${vw.toFixed(0)} ${vh.toFixed(0)}" role="img" aria-label="Your hips over the whole climb, with ${n(stops.length, 'stop', 'stops')}">
      <image href="${pic(img, 0)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" style="filter:brightness(.8) saturate(.8)"/>
      ${[5, 6].map(k => `<path d="${line(hand(k))}" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="${2 * zk}" stroke-linejoin="round"/>`).join('')}
      <path d="${line(hp)}" fill="none" stroke="#111" stroke-width="${9 * zk}" stroke-linecap="round" stroke-linejoin="round" opacity=".45"/>
      <path d="${line(hp)}" fill="none" stroke="#C4F52A" stroke-width="${5 * zk}" stroke-linecap="round" stroke-linejoin="round"/>
      ${stops.map(s => `<circle cx="${s.p[0].toFixed(1)}" cy="${s.p[1].toFixed(1)}" r="${(6 + Math.min(14, s.s * 3)) * zk}" fill="rgba(255,255,255,.25)" stroke="#fff" stroke-width="${2 * zk}"/>`).join('')}
      <circle cx="${hp[0][0].toFixed(1)}" cy="${hp[0][1].toFixed(1)}" r="${8 * zk}" fill="#fff" stroke="#111" stroke-width="${2.5 * zk}"/>
      <circle cx="${hp.at(-1)[0].toFixed(1)}" cy="${hp.at(-1)[1].toFixed(1)}" r="${8 * zk}" fill="#C4F52A" stroke="#111" stroke-width="${2.5 * zk}"/></svg>
      <p class="an-n">Lime: your hips, from the white dot to the lime one. White lines: your hands. Circles: where you stopped, bigger for longer. ${side > .18 ? 'You moved a lot side to side.' : 'A fairly straight line up.'}</p></div></div>`;
}
// how you held up: the climb in three parts, start, middle and top, by how fast you moved and how long you paused
function paceState(T) {
  const ms = pauses(T); if (ms.length < 6) return '';
  const a = ms[0].t0, b = ms.at(-1).t, L = (b - a) / 3 || 1;
  const parts = [0, 1, 2].map(k => { const mm = ms.filter(m => m.t0 >= a + k * L && (k === 2 ? m.t0 <= b : m.t0 < a + (k + 1) * L)); const gs = mm.filter(m => m.i > 1).map(m => m.gap);
    return { rate: mm.length / (L / 60), gap: gs.length ? gs.reduce((p, q) => p + q, 0) / gs.length : 0 }; });
  const [s, , e] = parts, slow = e.rate < s.rate * .7 || (e.gap > s.gap * 1.6 && e.gap - s.gap > .25), fast = e.rate > s.rate * 1.3 && e.gap <= s.gap;
  const title = slow ? 'You slowed down near the top' : fast ? 'You picked up speed' : 'A steady pace all the way';
  const why = slow ? `${e.rate < s.rate * .7 ? `You made ${Math.round((1 - e.rate / s.rate) * 100)}% fewer moves a minute at the top than at the start` : `Your pauses got ${(e.gap / Math.max(.1, s.gap)).toFixed(1)}× longer in the last third`}. That usually means tiring forearms, or working out the top on the wall. Shake out on a big hold before the top section.`
    : fast ? 'You moved faster in the last third without pausing longer. You had energy left: the start is where to save time.'
    : 'Your moves and pauses stayed about the same from bottom to top: you had enough left for the whole route.';
  return `<div class="hl2 dk2"><h2>How you held up</h2></div><div class="stack"><div class="lt"><span class="an-k1">${slow ? 'Getting tired' : fast ? 'Strong finish' : 'Steady'}</span><span class="lt-h">${title}</span><p class="tip-d">${why}</p>
    <div class="an-g pace">${['Start', 'Middle', 'Top'].map((l, k) => `<div><span>${l}</span><b>${Math.round(parts[k].rate)}<small>/min</small></b><em>${parts[k].gap.toFixed(1)} s pauses</em></div>`).join('')}</div></div></div>`;
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
// the loop the app is for: see what to change, then go and try it. Every analysis and route page ends in the next try:
// film it (or import it, once the sample camera roll is used up), or log it by hand if you're not filming.
function nextTryCta(ri) {
  return `<button class="b-ghost" type="button" data-act="to" data-to="session">Log by hand</button><button class="b-lime" type="button" data-act="film">${ic.rec}Film your next try</button>`;
}
function viewClip(id) {
  const c = byId(id);
  if (!c) return lostClip();
  const r = ROUTES[c.ri], lv = vidOf(c), T = c.track, peers = peersOn(c.ri).filter(v => v.i !== c.v);
  needTracks(peers);
  const state = c.an === 'idle' || !c.an ? 'idle' : c.an === 'done' && T ? 'done' : c.an === 'ask' ? 'ask' : 'run', two = state === 'done';
  const pct = Math.round((c.pct || 0) * 100);
  const runCard = `<div class="stack"><div class="lt"><span class="lt-h">Analysing your climb <span class="num" id="anp">${pct}%</span></span>
      <p class="an-n">Going through the whole video, following your hands, feet, elbows and hips. You can leave this page.</p><i class="an-run"><em id="anb" style="width:${pct}%"></em></i></div></div>`;
  const askCard = `<div class="stack"><div class="lt tgc"><span class="lt-h" id="tgt"></span><p class="an-n" id="tgx"></p>
      <div class="tg-s" id="tgs" hidden></div>
      <div class="tg-a"><button class="b-ghost" type="button" id="tgu" data-i="${c.id}"></button><button class="b-lime" type="button" id="tgb" data-i="${c.id}"></button></div></div></div>`;
  const scrEl = document.querySelector('.screen'), room = (scrEl?.clientHeight || 874) - (two ? 92 : state === 'ask' ? 348 : state === 'idle' ? 420 : 280);
  // not analysed yet: say where it was and which route, then post it to Community, analyse it, or both
  const pk = clipPick(c), ready = pickDone(c);
  const field = (k, label, val, dot = '') => `<button class="ce-row" type="button" data-act="clpick" data-c="${c.id}" data-k="${k}"><span>${label}</span><b class="${val ? '' : 'empty'}">${dot}${val || 'Choose'}</b><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3.5 4.5 4.5L6 12.5"/></svg></button>`;
  const editCard = `<div class="clip-edit"><h2>About this climb</h2>
      <div class="ce-rows">${field('gy', 'Gym', pk.gy != null ? gyms[pk.gy]?.name : '')}${field('grade', 'Grade', pk.grade)}${field('color', 'Colour', pk.color, pk.color ? `<i style="--hold:${HOLD_COLORS[pk.color]}"></i>` : '')}
        <div class="ce-row ce-res"><span>How did it go?</span><span class="ce-seg" role="group" aria-label="How did it go?">${['Flash', 'Send', 'Project'].map(k => `<button type="button" data-act="clres" data-c="${c.id}" data-k="${k}" aria-pressed="${c.res === k}">${KL[k]}</button>`).join('')}</span></div>
        ${ready && (c.res === 'Flash' || c.res === 'Send') ? `<div class="ce-row ce-res"><span>Grade felt <i>Optional</i></span><span class="ce-seg" role="group" aria-label="How the grade felt">${FEELS.map(([k, l]) => `<button type="button" data-act="feel" data-ri="${c.ri}" data-k="${k}" aria-pressed="${myFeel[c.ri] === k}">${l}</button>`).join('')}</span></div>` : ''}</div>
      <div class="ce-act"><button class="b-ghost" type="button" data-act="clpost" data-i="${c.id}"${ready || !c.hidden ? '' : ' disabled'}>${c.hidden ? 'Post to Community' : 'In Community ✓'}</button><button class="b-lime" type="button" data-act="startanalysis" data-i="${c.id}"${ready ? '' : ' disabled'}>Analyse</button></div>
      <p class="ce-n">${ready ? 'The analysis is only for you. Posting shares the video, now or after you analyse it.' : 'Choose the gym, grade and colour first.'}</p></div>`;
  // analysed and not posted yet: post it from here. The analysis stays yours
  const postCard = c.hidden ? `<div class="ce-post"><span class="row-t"><strong>Share this climb</strong><span>Posts the video to Community. Your analysis stays private.</span></span><button class="b-ghost" type="button" data-act="clpost" data-i="${c.id}">Post</button></div>` : '';
  // analysed: the video fills the screen, edge to edge, with the top of the analysis sheet showing under it to pull up
  const vh = two ? Math.round(Math.max(280, Math.min(room, (scrEl?.clientWidth || 402) / lv.ar))) : Math.max(280, Math.min(560, room));
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
      <img src="${pic(x.img)}" alt=""><span class="shade"></span><b>Try ${tryOf(x)}</b><small>${topOf(x) ? 'Topped' : 'Not topped'} · ${dayLabel(agoOf(x))}</small></button>`).join('')}</div>
    <div class="hl2 dk2"><h2>Details</h2></div>
    <div class="rows">
      <div class="row"><span class="row-t"><strong>${sw(r)}${rname(r)}</strong><span>Route · selected by you</span></span><button class="pj" type="button" data-act="croute" data-i="${c.id}">Change</button></div>
      ${c.gy == null ? `<div class="row"><span class="row-t"><strong>No gym yet · ${dayLabel(agoOf(c))}</strong><span>Location was off when this was filmed</span></span><button class="pj on" type="button" data-act="cgym" data-i="${c.id}">Add gym</button></div>`
        : `<div class="row"><span class="row-t"><strong>${gyms[c.gy].name} · ${dayLabel(agoOf(c))}</strong><span>${r.wall} · from where it was filmed</span></span><button class="pj" type="button" data-act="cgym" data-i="${c.id}">Change</button></div>`}
      <div class="row"><span class="row-t"><strong>${c.hidden ? 'Only you' : 'Public'}</strong><span>${c.hidden ? 'Not in Community. Only you can see it' : 'In Community: climbers here can watch it and comment'}</span></span>
        <button class="vis${c.hidden ? ' off' : ''}" type="button" data-act="vhide" data-i="${c.id}" aria-pressed="${c.hidden}">${c.hidden ? `${ic.eyeOff}Hidden` : `${ic.eye}Public`}</button></div>
      ${c.hidden ? '' : `<button class="row" type="button" data-act="seepost" data-i="${c.id}"><span class="row-t"><strong>In Community</strong><span>${n(c.likes, 'like', 'likes')} · ${n(c.cm.length, 'comment', 'comments')}</span></span>${ic.arr('#111111')}</button>`}
      <button class="row" type="button" data-act="share" data-i="${c.id}"><span class="row-t"><strong>Share</strong><span>As a poster, with the route and gym on it</span></span>${ic.arr('#111111')}</button>
      ${c.track ? `<button class="row" type="button" data-act="retag" data-i="${c.id}"><span class="row-t"><strong>Tracking</strong><span>Wrong person followed? Show Spotter where you are</span></span></button>` : ''}
      <button class="row" type="button" data-act="vdel" data-i="${c.id}"><span class="row-t"><strong>Delete video</strong><span>It stays in your camera roll</span></span></button>
    </div>
    <div class="rows tg-r"><div class="row"><span class="row-t"><strong>Video credits</strong><span>${lv.credit}</span></span></div></div>`;
  const tabs = [['why', 'Summary'], ['body', 'Body'], ['cmp', 'Compare'], ['info', 'Info']];
  const tab = tabs.some(([k]) => k === cTab) ? cTab : 'why';
  const nextUp = `<div class="hl2 dk2"><h2>Next</h2></div><div class="rows">
      ${betaRow(c.ri, T)}
      <button class="row" type="button" data-act="ctab" data-v="cmp"><span class="row-t"><strong>Watch it next to someone else</strong><span>${n(peers.length, 'other climber', 'other climbers')} on ${rname(r)}</span></span>${ic.arr('#111111')}</button></div>`;
  const panels = two ? { why: (q => `${postCard}${qualityCard(q)}${q.level === 'poor' ? '' : `${stuckCard(T, c)}${measured(T)}${legCard(T)}${paceState(T)}`}${nextUp}`)(quality(T)), body: `<div class="hl2 dk2"><h2>As it plays</h2></div>${live}${timeline(T)}${moveSeq(T)}${bodyStats(T)}`, cmp, info } : {};
  return { photo: c.img, fit: state === 'ask' || state === 'idle', cta: '', after: () => {
      tagWire(c);
      const v = $('lvv'), box = v.parentElement;
      // not analysed yet: the video, what you say about it and the two buttons are one screen, no scrolling. The video gives up the room
      if (state === 'idle') { const scr = document.querySelector('.screen'), over = scr.scrollHeight - scr.clientHeight;
        if (over > 0) box.style.width = `${Math.round(Math.max(180, box.offsetHeight - over - 6) * lv.ar)}px`; }
      segClose(); anSheet = null; segStop = null; segT = T; v.addEventListener('play', () => $('cpv')?.pause());
      v.playbackRate = speed;
      if (two) { window.poseGate = quality(T).ok; window.posePlay(v, $('lvc'), T); tlWire(); kfWire(T, v.currentSrc || v.src); stuckWire(T, c, v.currentSrc || v.src); laWire(T, v); stripWire(v, T); stickWire(box, vh); followWire(box); }
      if (state === 'ask' && c.auto) v.currentTime = c.auto.t;
      v.addEventListener('play', () => box.classList.add('playing'));
      ['pause', 'ended'].forEach(e => v.addEventListener(e, () => box.classList.remove('playing')));
      v.addEventListener('click', () => v.paused ? v.play() : v.pause());
      // an analysed video plays as soon as the page opens (muted) and starts over at the end, so the readouts are always moving
      if (two && !seg) { const go = () => v.play().catch(() => {}); if (v.readyState >= 2) go(); else v.addEventListener('canplay', go, { once: true }); }
      if (two) v.addEventListener('ended', () => { if (segStop) return; v.currentTime = 0; v.play().catch(() => {}); });
    }, html: `
    ${bar(c.need ? 'New climb' : `${rname(r)} · try ${tryOf(c)}`, `<button class="bar-more" type="button" data-act="cmore" data-i="${c.id}" aria-label="Video options">${DOTS}</button>`)}
    <div class="lv-w${two ? ' two' : ''}"><div class="clip vp lv${state === 'run' ? ' busy' : ''}" style="aspect-ratio:${lv.ar.toFixed(4)};width:min(100%, ${Math.round(vh * lv.ar)}px)">
      <video id="lvv" src="${vsrc(lv.vid)}" poster="${pic(lv.img, 0)}" muted playsinline preload="auto"></video><canvas id="lvc"></canvas>${two ? lyrOver() : ''}
      <button class="play-b" type="button" data-act="lvplay" aria-label="Play the video">${ic.play}</button>
      <div class="tg" id="tg" hidden></div>
      ${state === 'idle' ? '' : `<span class="clip-l">${c.need ? '' : `<span class="pk-tag">${sw(r)}${rname(r)} · try ${tryOf(c)}</span>`}
        <span>${c.need ? `${dayLabel(agoOf(c))} · ${c.len}` : `${dayLabel(agoOf(c))} · ${gymName(c)} · ${c.len} · ${topOf(c) ? 'topped' : 'not topped'}`}</span></span>`}</div>${two ? lyrStrip(T.D, `min(100%, ${Math.round(vh * lv.ar)}px)`) + lyrBar(T ? quality(T).ok : {}) : ''}</div>
    <div class="fold"></div>
    ${state === 'idle' ? editCard : state === 'run' ? runCard : state === 'ask' ? askCard : `
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
let pv = null, pvRate = 1, vsLay = 'lr', vsZ = 1.6;
const RATES = [.25, .5, 1, 1.5, 2], ZOOMS = [1, 1.3, 1.6, 2, 2.5];
function viewVs(a) {
  const [id, k] = String(a).split('-').map(Number), c = byId(id), x = V[k];
  if (!c || !x || x.ri !== c.ri || x.who === 'You') return lostClip();
  const r = ROUTES[c.ri], peers = peersOn(c.ri), T = c.track, P = TRK[x.vid];
  needTracks(peers);
  const ready = T && P, A = ready && vsNums(T), B = ready && vsNums(P);
  const cmpTop = topOf(c) && x.top;
  const notes = [!x.top && `${x.who}’s video ends before the top, so their time is for less of the route.`, !topOf(c) && 'Your video ends before the top, so your time is for less of the route.'].filter(Boolean);
  return { after: () => { vsFit(); if (ready) vsWire(c, x); else if (!T) setTimeout(() => { if (page === 'vs' && arg === a) render(); }, 800); }, html: `
    <div class="vs-hero${vsLay === 'tb' ? ' tb' : ''}" id="vshero">
      <div class="vs-top"><button class="bk" type="button" data-act="back" aria-label="Back">${ic.back}</button>
        <div class="vs-tt"><b>You and ${x.who}</b><span>${sw(r)}${rname(r)} · ${gymName(c)}</span></div>
        <button class="vs-ic" type="button" data-act="pvlay" aria-label="${vsLay === 'lr' ? 'Stack the videos' : 'Put the videos side by side'}">${layIc()}</button></div>
      <div class="pv"><figure><span class="pv-b"><video id="pv0" src="${vsrc(vidOf(c).vid)}" poster="${pic(c.img, 0)}" muted playsinline preload="auto"></video><canvas id="pc0"></canvas></span><figcaption><i class="you"></i>You · try ${tryOf(c)}${topOf(c) ? ' · topped' : ''}</figcaption><label class="pv-off"><span>Start</span><input type="range" data-k="a" min="0" max="1" step="1" aria-label="Where your video starts"></label></figure>
        <figure><span class="pv-b"><video id="pv1" src="${vsrc(x.vid)}" poster="${pic(x.img, 0)}" muted playsinline preload="auto"></video><canvas id="pc1"></canvas></span><figcaption><i class="them"></i>${x.who}${x.top ? ' · topped' : ''}</figcaption><label class="pv-off"><span>Start</span><input type="range" data-k="b" min="0" max="1" step="1" aria-label="Where ${x.who}’s video starts"></label></figure></div>
      <p class="pv-sy">Drag each Start bar to the moment that climber leaves the ground.</p>
      <div class="vs-dock">
        <div class="pv-tl"><button class="pv-pp" type="button" id="pvg" data-act="pvplay" aria-label="Play both"${ready ? '' : ' disabled'}>${PLAY}</button>
          <input type="range" id="pvr" min="0" max="1000" value="0" aria-label="Both videos, from the start"${ready ? '' : ' disabled'}><span class="num" id="pvtt">${ready ? '0:00' : T ? 'Loading' : 'Analysing'}</span></div>
        <div class="vs-opts"><button class="pv-x pv-lu" type="button" data-act="pvsync" aria-pressed="false"${ready ? '' : ' disabled'}>Line up</button>
          <span class="vs-step" role="group" aria-label="Speed"><button type="button" data-act="vsrate" data-d="-1" aria-label="Slower">−</button><b id="pvs">${pvRate}×</b><button type="button" data-act="vsrate" data-d="1" aria-label="Faster">+</button></span>
          <span class="vs-step" role="group" aria-label="Zoom"><button type="button" data-act="vszoom" data-d="-1" aria-label="Zoom out">−</button><b id="pvz">${ic.search}${vsZ}×</b><button type="button" data-act="vszoom" data-d="1" aria-label="Zoom in">+</button></span>
          ${ready ? '<button class="vs-down" type="button" data-act="vsdown" aria-label="See the numbers"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg></button>' : ''}</div></div></div>
    <div class="vsp"><div class="stack"><div class="lt">
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
    ${(() => { const mine = newestClips().filter(m => m.ri === c.ri); return mine.length > 1 ? `<div class="hl2 dk2"><h2>Your try</h2></div>
      <div class="fchips">${mine.map(m => `<button type="button" data-act="to" data-to="vs/${m.id}-${x.i}" aria-pressed="${m === c}">Try ${tryOf(m)}${topOf(m) ? ' · topped' : ''}</button>`).join('')}</div>` : ''; })()}
    ${peers.length > 1 ? `<div class="hl2 dk2"><h2>Compare with someone else</h2></div>
      <div class="fchips">${peers.map(p => `<button type="button" data-act="to" data-to="vs/${c.id}-${p.i}" aria-pressed="${p === x}">${p.who}</button>`).join('')}</div>` : ''}
    </div>` };
}
// the first screen is the two videos: as tall as the phone, under the header
// the switch shows the layout it changes to
const PLAY = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
  PAUSE = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>';
const layIc = () => vsLay === 'lr' ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="8" rx="2"/><rect x="4" y="13" width="16" height="8" rx="2"/></svg>'
  : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="8" height="16" rx="2"/><rect x="13" y="4" width="8" height="16" rx="2"/></svg>';
function vsFit() {
  const h = $('vshero'), sc = document.querySelector('.screen'); if (!h || !sc) return;
  h.style.height = `${Math.max(480, sc.clientHeight - (h.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop))}px`;
}
function vsWire(c, x) {
  const a = $('pv0'), b = $('pv1'); if (!a || !b) return;
  const TA = c.track, TB = TRK[x.vid], a0 = Math.max(0, span(TA)[0] - .5), b0 = Math.max(0, span(TB)[0] - .5);
  pv = { a, b, a0, b0, la: climbS(TA) + 1, lb: climbS(TB) + 1, on: false };
  window.poseView = { z: 1, ax: 0, ay: 0 };
  window.posePlay(a, $('pc0'), TA, 'none'); window.posePlay(b, $('pc1'), TB, 'none');
  const L = () => Math.max(pv.la, pv.lb), rg = $('pvr'), tt = $('pvtt');
  pv.sync = () => { if (!rg) return; const t = Math.max(0, a.currentTime - pv.a0, b.currentTime - pv.b0); rg.value = Math.round(Math.min(1, t / L()) * 1000); tt.textContent = mmss(t); };
  if (rg) rg.oninput = () => { if (pv.on) pvPlay(); const t = rg.value / 1000 * L(); a.currentTime = Math.min(pv.a0 + t, a.duration || 1e9); b.currentTime = Math.min(pv.b0 + t, b.duration || 1e9); tt.textContent = mmss(t); };
  document.querySelectorAll('.pv-off input').forEach(r => { const v = r.dataset.k === 'a' ? a : b, k = `${r.dataset.k}0`;
    const setMax = () => { r.max = Math.max(1, Math.round((v.duration || 0) * 10)); r.value = Math.round(pv[k] * 10); };
    if (v.readyState) setMax(); else v.addEventListener('loadedmetadata', setMax, { once: true });
    r.oninput = () => { if (pv.on) pvPlay(); pv[k] = r.value / 10; v.currentTime = pv[k]; }; });
  const home = (v, t) => { if (v.readyState) v.currentTime = t; else v.addEventListener('loadedmetadata', () => { v.currentTime = t; }, { once: true }); }; home(a, a0); home(b, b0);
  // each video follows its own climber, zoomed in; where the scan can't see them, it stays where they were last seen
  [[a, $('pc0'), TA], [b, $('pc1'), TB]].forEach(([v, cv, Tr]) => {
    // the box is taller than the video is wide: the video covers it, and the camera keeps the climber in the middle
    let cx = .5, cy = .6; const box = v.parentElement;
    const step = () => { if (!v.isConnected) return; const p = window.poseBox?.(Tr, v.currentTime);
      if (p) { cx += ((p.x0 + p.x1) / 2 - cx) * .12; cy += ((p.y0 + p.y1) / 2 - cy) * .12; }
      const Z = vsZ, w = box.clientWidth, h = box.clientHeight, ar = v.videoWidth ? v.videoWidth / v.videoHeight : (Tr.W && Tr.H ? Tr.W / Tr.H : .5625);
      const vw = Math.max(w, h * ar), vh = vw / ar;
      const tx = Math.min(0, Math.max(w - Z * vw, w / 2 - Z * cx * vw)), ty = Math.min(0, Math.max(h - Z * vh, h / 2 - Z * cy * vh));
      [v, cv].forEach(el => { el.style.width = `${vw.toFixed(1)}px`; el.style.height = `${vh.toFixed(1)}px`; el.style.transformOrigin = '0 0'; el.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${Z})`; });
      requestAnimationFrame(step); };
    requestAnimationFrame(step); });
}
function pvPlay() {
  if (!pv) return; const { a, b, a0, b0, la, lb } = pv, label = t => { const g = $('pvg'); if (g) { g.innerHTML = t === 'Pause both' ? PAUSE : PLAY; g.setAttribute('aria-label', t); } };
  const done = (v, end) => v.currentTime >= Math.min(end, v.duration || end) - .15, over = () => done(a, a0 + la) && done(b, b0 + lb);
  if (pv.on) { a.pause(); b.pause(); pv.on = false; label('Play side by side'); return; }
  if (over()) { a.currentTime = a0; b.currentTime = b0; }
  a.playbackRate = b.playbackRate = pvRate; pv.on = true; label('Pause both'); if (!done(a, a0 + la)) a.play().catch(() => {}); if (!done(b, b0 + lb)) b.play().catch(() => {});
  const tick = () => { if (!pv?.on || !a.isConnected) return; pv.sync?.(); if (done(a, a0 + la)) a.pause(); if (done(b, b0 + lb)) b.pause(); if (over()) { pv.on = false; label('Watch again'); return; } requestAnimationFrame(tick); }; tick();
}

/* ---------- A route: your tries and everyone else's ---------- */
const betaRow = (ri, T) => { const B = betaOf(ri), me = T && stepsOf(T).steps.length - 1, k = B && B.steps.length - 1;
  return `<button class="row fr-p" type="button" data-act="rbeta" data-r="${ri}"><span class="fr-f">${avatar(B ? B.x.who : 'Leo')}</span><span class="row-t"><strong>${T ? 'Your moves and the beta' : 'See the beta'}</strong>
    <span>${!B ? 'From a climber who topped it' : T && me >= 2 ? `You: ${n(me, 'hand move', 'hand moves')} · ${B.x.who}, to the top: ${k}` : T ? `${B.x.who} topped it in ${n(k, 'hand move', 'hand moves')}. See every hold` : `${n(k, 'hand move', 'hand moves')}, hold by hold · from how ${B.x.who} topped it`}</span></span>${ic.arr('#111111')}</button>`; };
function viewRoute(a) {
  const i = +a, r = ROUTES[i];
  if (!r) return lostClip();
  const peers = peersOn(i), mine = mineOn(i), last = lastOn(i), tops = peers.filter(x => x.top).length;
  needTracks(peers);
  return { photo: r.img, cta: nextTryCta(i), html: `
    ${bar(rname(r))}
    <div class="clip"><img src="${pic(r.img)}" alt=""><span class="shade"></span>
      <span class="clip-l"><span class="pk-tag">${sw(r)}${rname(r)}</span><span>Top rope · ${r.wall} · ${gym.name}</span></span></div>
    <div class="fold"></div>
    <div class="hl2 dk2"><h2>Beta</h2></div>
    <div class="rows">${betaRow(i)}</div>
    ${gradeBlock(i, mine.some(topOf) || logs.some(l => l.ri === i && l.sent))}
    <div class="sec"><h2>Your tries</h2>${mine.length ? `<span class="stg${mine.some(topOf) ? ' on' : ''}">${mine.some(topOf) ? 'Topped' : 'Not topped yet'}</span>` : ''}</div>
    ${mine.length ? `<div class="rgrid">${mine.slice().reverse().map(vcard).join('')}</div>`
      : '<div class="rows"><button class="row" type="button" data-act="film"><span class="row-t"><strong>Film a try</strong><span>Then watch it next to anyone below</span></span>' + ic.arr('#111111') + '</button></div>'}
    <div class="sec"><h2>Climbers on it</h2><span class="sec-more">${tops} of ${peers.length} topped</span></div>
    <div class="rgrid">${peers.map(x => pcard(x, last)).join('')}</div>
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
    <div class="gy-car" id="gycar">${pics.map(p => `<img src="${pic(p)}" alt="">`).join('')}</div>
    <div class="gy-dots" id="gydots">${pics.map((_, k) => `<i${k ? '' : ' class="on"'}></i>`).join('')}</div>
    <div class="sec"><h2>Routes with videos</h2><span class="sec-more">rope wall</span></div>
    <div class="rgrid">${ROUTES.map((r, i) => rcard(i)).join('')}</div>
    <p class="cap">Only routes someone has filmed with Spotter. Routes get reset, so the wall may look different today.</p>
    <div class="rows"><button class="row hero" type="button" data-act="to" data-to="session"><span class="row-t"><strong>Climb here now</strong><span>Film a try or log one, with the session clock</span></span><span class="hero-go">Start</span></button>
      <button class="row" type="button" data-act="plan" data-g="0"><span class="row-t"><strong>Plan a session here</strong><span>Your friends see it and can join</span></span>${ic.arr('#111111')}</button></div>
    <div class="gy-ab gy-wh">
      <div class="gy-ad">${ic.pin}<span><b>${gym.addr}</b><span>${gym.dist}</span></span><button class="gy-cp" type="button" data-act="gycopy" aria-label="Copy the address">Copy</button></div>
      <a class="gy-ad gy-web" href="https://${gym.src}" target="_blank" rel="noopener"><span><b>${gym.src}</b><span>Membership, belay class and hours</span></span><span aria-hidden="true">↗</span></a></div>
    <div class="gy-ab">
      <div class="gy-sh">Hours</div>
      ${weekHours(gym)}
      <div class="gy-sh">Here</div><div class="gy-has">${gym.has.map(h => `<span>${h}</span>`).join('')}</div>
      <p class="cap"><span>${gym.note}</span> <span>From ${gym.src}, Nov 2026.</span></p></div>
    ${gymGrading(gym)}`, after: carWire };
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
  'wayup-p5-orange': ['Any tips for the middle section?', 7, [['Noor', 'Hips close to the wall, it’s less steep than it looks']]],
  'wayup-p10-orange': ['Second go on orange, cleaner feet this time', 11, [['Mia', 'So much smoother']]],
  'wayup-p4-green': ['Slow and steady', 8, []],
  'wayup-p4-orange': ['Fell at the crux twice, then sent', 24, [['Ben', 'Persistence!'], ['Noor', 'That last reach though', 40]]],
  'wayup-p6-green': ['Warming up before orange', 6, []],
  'wayup-p6-orange': ['Rushed the top, need to breathe more', 14, [['Ava', 'Shake out on the big jug before the top']]],
  'wayup-p7-green': ['Trying to keep my hips in', 9, [['Rosa', 'Looks good from here']]],
  'wayup-p7-orange': ['New high point!', 19, [['Kai', 'Nice one'], ['Jun', 'Thanks!', 20]]],
  'wayup-p9-green': ['First climb back after a break', 16, [['Sam', 'Welcome back']]],
  'wayup-p9-orange': ['Quick and a bit messy', 5, []] };
const others = V.filter(x => x.who !== 'You').map(x => { const [note, likes, comments] = SAY[x.vid] || ['', 0, []]; return { who: x.who, v: x.i, ago: x.ago, note, likes, comments }; });
const feedAll = () => {
  const remaining = [...clips.filter(c => !c.hidden).map(c => ({ who: 'You', v: c.v, c, ago: agoOf(c), note: '', likes: c.likes, comments: c.cm })), ...others].sort((p, q) => p.ago - q.ago);
  const ordered = []; let last = null;
  while (remaining.length) { let i = remaining.findIndex(p => p.who !== last); if (i < 0) i = 0; const [post] = remaining.splice(i,1); ordered.push(post); last = post.who; }
  return ordered;
};
const liked = new Set(), likeKey = p => `${p.who}/${V[p.v].vid}`;
const tokIc = {
  heart: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M5 19 15 6 29 5 42 15 43 29 34 41 19 43 6 34 3 26Z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="m11 21 7-8 11 1 7 7M10 30l8 5 13-2" stroke="#454545" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/></svg>',
  talk: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M4 22C4 11 13 5 25 5s20 7 19 17c0 10-8 16-20 16h-4L9 44l1-10C6 31 4 27 4 22Z" fill="currentColor"/><circle cx="15" cy="22" r="2.7" fill="#666"/><circle cx="24" cy="22" r="2.7" fill="#666"/><circle cx="33" cy="22" r="2.7" fill="#666"/></svg>',
  save: '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3.5h12a1 1 0 0 1 1 1v16.2a.5.5 0 0 1-.8.4L12 16.6l-6.2 4.5a.5.5 0 0 1-.8-.4V4.5a1 1 0 0 1 1-1Z"/></svg>',
  share: '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 4.2 22 11.4l-8.5 7.2V14c-4.6 0-7.8 1.6-10.5 5.4.7-5.6 3.9-10.6 10.5-11.4Z"/></svg>' };
function feedPost(p, i) {
  const x = V[p.v], r = ROUTES[p.c ? p.c.ri : x.ri], on = liked.has(likeKey(p)), me = p.who === 'You';
  const vs = `<button type="button" data-act="fchoose" data-i="${i}" aria-label="Compare with your try"><span class="ts-action-icon" aria-hidden="true">VS</span></button>`;
  return `<article class="ts" data-i="${i}">
    <div class="ts-v fv" data-act="fvtap"><video src="${vsrc(x.vid)}" poster="${pic(x.img)}" muted playsinline loop preload="none" data-a="0" data-b="${x.D}" data-r="1"></video><span class="ed-p fv-p">${ic.play.replace('#111111', '#FFFFFF')}</span><span class="ts-big">${tokIc.heart}</span></div>
    <span class="ts-sh"></span>
    <div class="ts-rail"><span class="ts-av"><button class="ts-face" type="button" data-act="to" data-to="${me ? 'profile' : `person/${p.who}`}" aria-label="${me ? 'Your profile' : `${p.who}’s page`}">${avatar(p.who)}</button><span class="ts-author">${esc(p.who)}</span></span>
      <button class="ts-nice" type="button" data-act="flike" data-i="${i}" aria-pressed="${on}" aria-label="Like">${tokIc.heart}<span class="ts-like-label">${on ? 'NICE!' : 'NICE'}</span></button>
      <button type="button" data-act="fcm" data-i="${i}" aria-label="Comment">${tokIc.talk}<span class="ts-action-label">Chat</span></button><button type="button" data-act="fmore" data-i="${i}" aria-label="Video options"><span class="ts-more-icon" aria-hidden="true">•••</span><span>More</span></button></div>
    <div class="ts-c"><div class="ts-info"><span class="ts-gym">${ic.pin.replace(/#2B2D2E|#111111/g, '#FFFFFF')}${esc(p.c ? gymName(p.c) : gym.name)}</span></div>${p.note ? `<p>${esc(p.note)}</p>` : ''}<div class="ts-tools"><span class="ts-route"><i class="ts-route-color" style="background:${r.hex}" aria-hidden="true"></i>${esc(r.color)} · ${esc(r.grade)}</span>${vs}<button type="button" data-act="fbeta" data-r="${p.c ? p.c.ri : x.ri}" data-v="${x.i}" aria-label="See route beta"><span class="ts-action-icon ts-beta-icon" aria-hidden="true">B</span></button></div></div>
    <span class="ts-time"><span class="ts-elapsed">0:00</span> / ${x.len}</span><i class="ts-p"><b></b></i>
  </article>`;
}
// where the post's video is now (null if it hasn't played): a comment can point at that moment
const cmNow = i => { const v = document.querySelector(`.ts[data-i="${i}"] video`); if (!v) return null; const s = v.currentTime - (+v.dataset.a || 0); return s > .5 ? s : null; };
const CM_QUICK = ['Nice send!', 'What was the beta at the top?', 'Trust your feet', 'Same route tomorrow?'];
let cmAt = true, cmSort = 'default', cmReply = null, cmImage = null, cmRecognition = null;
const commentVotes = new WeakMap();
function feedComments(i, draft = '') {
  const p = feedAll()[i], now = cmNow(i);
  const list = p.comments.map((comment, index) => ({ comment, index }));
  if (cmSort === 'latest') list.reverse();
  if (cmSort === 'liked') list.sort((a, b) => (commentVotes.get(b.comment) === 'like' ? 1 : 0) - (commentVotes.get(a.comment) === 'like' ? 1 : 0) || a.index - b.index);
  pane(`<div class="comments-sheet"><div class="comments-head"><h2>Comments</h2><button class="comments-close" type="button" data-act="close" aria-label="Close comments">×</button></div>
    <nav class="comments-sort" aria-label="Sort comments">${[['default','Default'], ['latest','Latest'], ['liked','Most liked']].map(([key, label]) => `<button type="button" data-act="cmsort" data-i="${i}" data-sort="${key}" aria-pressed="${cmSort === key}">${label}</button>`).join('')}</nav>
    <div class="tcm">${list.length ? list.map(({comment, index}) => { const [w, t, time, extra] = comment, vote = commentVotes.get(comment); return `<div class="cm"><span class="cm-avatar">${avatar(w)}</span><div class="cm-body"><strong>${esc(w)}</strong>${extra?.reply ? `<span class="cm-reply-to"> · replying to ${esc(extra.reply)}</span>` : ''}${t ? `<p>${esc(t)}</p>` : ''}${extra?.image ? `<img class="cm-image" src="${esc(extra.image)}" alt="Attached image">` : ''}<div class="cm-meta">${time != null ? `<button class="cm-t num" type="button" data-act="cmt" data-i="${i}" data-t="${time}">${mmss(time)}</button>` : ''}<button class="cm-r" type="button" data-act="cmreply" data-i="${i}" data-w="${esc(w)}">Reply</button></div></div><div class="cm-votes"><button type="button" data-act="cmvote" data-i="${i}" data-index="${index}" data-vote="like" aria-label="Like comment" aria-pressed="${vote === 'like'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11v9H4v-9h3Zm3 9h6a3 3 0 0 0 3-2l2-6a2 2 0 0 0-2-3h-4l1-4c.2-1-1-2-2-1l-4 6v10Z"/></svg></button><button type="button" data-act="cmvote" data-i="${i}" data-index="${index}" data-vote="dislike" aria-label="Dislike comment" aria-pressed="${vote === 'dislike'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 13V4H4v9h3Zm3-9h6a3 3 0 0 1 3 2l2 6a2 2 0 0 1-2 3h-4l1 4c.2 1-1 2-2 1l-4-6V4Z"/></svg></button></div></div>`; }).join('') : '<p class="hint">Be the first to comment.</p>'}</div>
    <div class="comments-compose">${cmReply ? `<div class="cm-reply-banner">Replying to ${esc(cmReply)} <button type="button" data-act="cmcancelreply" data-i="${i}" aria-label="Cancel reply">×</button></div>` : ''}${cmImage ? `<div class="cm-preview"><img src="${esc(cmImage)}" alt="Selected image"><button type="button" data-act="cmremoveimage" data-i="${i}" aria-label="Remove image">×</button></div>` : ''}
    ${now != null ? `<button class="cm-at" type="button" data-act="cmat" data-i="${i}" aria-pressed="${cmAt}">${cmAt ? ic.check : ''}At ${mmss(now)} in the video</button>` : ''}
    <div class="cm-row"><div class="cm-input-wrap"><input type="text" placeholder="Add a comment" aria-label="Comment on ${esc(p.who)}’s climb" data-cm="${i}" value="${esc(draft)}"><button class="cm-tool" type="button" data-act="cmvoice" data-i="${i}" aria-label="Voice input"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg></button><label class="cm-tool" aria-label="Add image"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 18 5-5 3 3 3-3 5 5"/></svg><input type="file" accept="image/*" data-cm-image="${i}"></label></div><button class="cm-send" type="button" data-act="cm" data-i="${i}">Send</button></div></div></div>`);
  ask.querySelector('[data-cm-image]').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    if (cmImage) URL.revokeObjectURL(cmImage);
    cmImage = URL.createObjectURL(file); feedComments(i, ask.querySelector('[data-cm]').value);
  });
  if (draft) { const inp = ask.querySelector('[data-cm]'); inp.focus(); inp.setSelectionRange(draft.length, draft.length); }
}
function chooseComparison(i) {
  const post = feedAll()[i];
  if (!post) return;
  const video = V[post.v], route = post.c ? post.c.ri : video.ri;
  // your own post: compare it with someone else's video on the same route. Theirs: with one of your tries on it.
  // With only one to choose, the two videos open side by side straight away
  if (video.who === 'You') {
    const mine = post.c || newestClips().find(c => c.v === video.i);
    const theirs = V.filter(x => x.who !== 'You' && x.ri === route && x.vid && !x.mine);
    if (mine && theirs.length === 1) { closeAll(); go(`vs/${mine.id}-${theirs[0].i}`); return; }
    const it = x => `<button class="compare-choice" type="button" data-act="fvsother" data-c="${mine?.id}" data-v="${x.i}"><img src="${pic(esc(x.img))}" alt=""><span><strong>${esc(x.who)}</strong><small>${esc(dayLabel(x.ago))}${x.top ? ' · Topped' : ''}</small></span>${ic.arr('#111111')}</button>`;
    pane(`<h2>Compare with a climber</h2><span class="sub">Your try on ${esc(rname(ROUTES[route]))}</span>
      ${mine && theirs.length ? `<div class="compare-list">${theirs.map(it).join('')}</div>` : '<p class="cap">Nobody else has posted a video of this route yet. Once someone does, you can play theirs next to yours.</p>'}`);
    return;
  }
  // their video against yours, straight away: your best try on the route (the newest one you topped, else the newest).
  // The other tries are one tap away on the compare page
  const candidates = newestClips().filter(c => c.ri === route && c.v !== video.i);
  if (candidates.length) { const best = candidates.find(c => topOf(c)) || candidates[0]; closeAll(); go(`vs/${best.id}-${video.i}`); return; }
  const others = newestClips().filter(c => c.ri !== route);
  const item = (c, disabled = false) => `<button class="compare-choice" type="button" ${disabled ? 'disabled' : `data-act="fchoosepick" data-c="${c.id}" data-v="${video.i}"`}><img src="${pic(esc(c.img))}" alt=""><span><strong>${esc(rname(ROUTES[c.ri]))} · Try ${tryOf(c)}</strong><small>${esc(dayLabel(agoOf(c)))} · ${esc(gymName(c))}</small><small>${disabled ? 'Different route' : topOf(c) ? 'Topped' : 'Not topped'}</small></span>${disabled ? '' : ic.arr('#111111')}</button>`;
  pane(`<h2>Compare with ${esc(post.who)}</h2><span class="sub">On ${esc(rname(ROUTES[route]))}</span>
    ${video.who === 'You' ? '<p class="cap">Open another climber’s video to compare it with one of your tries.</p>' : candidates.length ? `<div class="compare-list">${candidates.map(c => item(c)).join('')}</div>` : '<p class="cap">You haven’t climbed this route on video yet. Film or import a try, and it opens next to theirs.</p><button class="b-lime compare-import" type="button" data-act="upload">Import a video</button>'}
    ${video.who !== 'You' && others.length ? `<h3 class="compare-heading">Other routes</h3><p class="cap">Choose a video on the same route to compare.</p><div class="compare-list">${others.map(c => item(c, true)).join('')}</div>` : ''}`);
}
function feedOptions(i) {
  const post = feedAll()[i], video = V[post.v], route = post.c ? post.c.ri : video.ri;
  const url = new URL(`${vsrc(video.vid)}`, location.href).href;
  const own = post.c && clips.includes(post.c) ? `<button class="row" type="button" data-act="fpull" data-i="${post.c.id}"><span class="row-t"><strong>Remove from Community</strong><span>Only you will see it. The video and its analysis stay</span></span>${ic.eyeOff}</button>
    <button class="row del" type="button" data-act="vdel" data-i="${post.c.id}"><span class="row-t"><strong>Delete video</strong><span>Its analysis and comments go too</span></span></button>` : '';
  pane(`<h2>Video options</h2><span class="sub">${esc(post.who)} · ${esc(rname(ROUTES[route]))}</span>
    <div class="feed-options">${own}<button class="row" type="button" data-act="fshare" data-i="${i}"><span class="row-t"><strong>Share video</strong><span>Share with another app</span></span>${ic.arr('#111111')}</button>
    <button class="row" type="button" data-act="fcopy" data-i="${i}"><span class="row-t"><strong>Copy video link</strong><span>Copy a direct link to this video</span></span>${ic.arr('#111111')}</button>
    <button class="row" type="button" data-act="freport" data-i="${i}"><span class="row-t"><strong>Report a problem</strong><span>Describe an issue with this video</span></span>${ic.arr('#111111')}</button></div>
    <input class="feed-share-url" value="${esc(url)}" aria-label="Video link" readonly><p class="feed-credit">${esc(video.credit)}</p>`);
}
function reportVideo(i) {
  const post = feedAll()[i];
  pane(`<h2>Report a problem</h2><span class="sub">${esc(post.who)} · ${esc(rname(ROUTES[post.c ? post.c.ri : V[post.v].ri]))}</span><form id="feed-report"><label for="feed-report-text">What happened?</label><textarea id="feed-report-text" required maxlength="500" placeholder="Describe the problem"></textarea><p class="hint">This prototype saves the report on this device.</p><button class="b-lime" type="submit">Save report</button></form>`);
  $('feed-report').addEventListener('submit', e => {
    e.preventDefault(); const message = $('feed-report-text').value.trim(); if (!message) return;
    let reports; try { reports = JSON.parse(localStorage.getItem('spotter-reports') || '[]'); if (!Array.isArray(reports)) reports = []; } catch (_) { reports = []; }
    reports.push({ video: V[post.v].vid, message, date: new Date().toISOString() });
    try { localStorage.setItem('spotter-reports', JSON.stringify(reports)); closeAll(); toast('Report saved on this device'); } catch (_) { toast('Could not save the report'); }
  });
}
function feedLike(post, on) { const b = post.querySelector('[data-act=flike]'), p = feedAll()[+b.dataset.i], k = likeKey(p); on ? liked.add(k) : liked.delete(k);
  b.setAttribute('aria-pressed', on); b.querySelector('.ts-like-label').textContent = on ? 'NICE!' : 'NICE'; pop(b, on); }
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
    v.ontimeupdate = () => { if (v.currentTime >= b || v.currentTime < a - .3) v.currentTime = a; bar.style.transform = `scaleX(${(v.currentTime - a) / (b - a)})`; t.querySelector('.ts-elapsed').textContent = mmss(Math.max(0, v.currentTime - a)); };
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
  if (a === 'plan' || a === 'friends') return viewFriendsPlan();
  const mode = a === 'following' ? a : 'all';
  const entries = feedAll().map((post,i) => ({post,i})).filter(({post}) => mode === 'all' || (mode === 'following' ? follows.has(post.who) : invitedFriends.includes(post.who)));
  const top = `<div class="tok-top"><span class="tok-add-sp" aria-hidden="true"></span>${feedTabs(mode)}<button class="av sm" type="button" data-act="to" data-to="profile" aria-label="Your profile">${avatar('You')}</button></div>`;
  const empty = `<div class="feed-empty"><strong>No videos from people you follow</strong><p>Follow climbers to see their videos here.</p><button type="button" data-act="to" data-to="friends">Explore videos</button></div>`;
  return { dark: true, tok: true, after: entries.length ? feedWire : undefined, html: `${top}${entries.length ? `<div class="tok" id="tok" tabindex="0"><div class="tok-in" id="tokin">${entries.map(({post,i}) => feedPost(post,i)).join('')}</div></div>` : empty}` };
}

/* ---------- Someone else's page ---------- */
function viewPerson(who) {
  if (!PEOPLE.includes(who)) { page = 'friends'; arg = ''; history.replaceState(null, '', '#/friends'); return viewFriends(); }
  const vs = V.filter(x => x.who === who), all = feedAll();
  needTracks(vs);
  const tile = x => `<button class="vt" type="button" data-act="pvid" data-v="${x.i}" aria-label="Watch ${who} on ${rname(ROUTES[x.ri])}">
      <img src="${pic(x.img)}" alt=""><span class="shade"></span><span class="vt-t">${sw(ROUTES[x.ri])}${rname(ROUTES[x.ri])}</span><span class="vt-b">${x.top ? 'Topped' : 'Not topped'} · ${dayLabel(x.ago)}</span></button>`;
  const both = vs.filter(x => lastOn(x.ri));
  return { photo: vs[0]?.img || 'gym-arc-1', html: `
    ${bar('')}
    <div class="pp-h"><span class="pp-av">${avatar(who)}</span><div><h1 class="hl">${who}</h1><p class="sub-w"><span>Climbs at ${gym.name}</span> · ${YRS[who] ? `<span>climbing for ${YRS[who]}</span>` : ''}</p></div></div>
    <div class="pp-a"><button class="${follows.has(who) ? 'b-glass' : 'b-lime'}" type="button" data-act="pfollow" data-w="${who}" aria-pressed="${follows.has(who)}">${follows.has(who) ? 'Following' : 'Follow'}</button></div>
    <div class="fold"></div>
    ${both.length ? `<div class="hl2 dk2"><h2>Routes you both climbed</h2><span class="hint2">side by side</span></div>
    <div class="rows">${both.map(x => `<button class="row" type="button" data-act="to" data-to="vs/${lastOn(x.ri).id}-${x.i}"><span class="row-t"><strong>${sw(ROUTES[x.ri])}${rname(ROUTES[x.ri])}</strong><span>Your try ${tryOf(lastOn(x.ri))} and ${who}’s</span></span>${ic.arr('#111111')}</button>`).join('')}</div>` : ''}
    <div class="hl2 dk2"><h2>Videos</h2><span class="hint2">${n(vs.length, 'video', 'videos')}</span></div>
    <div class="vg">${vs.map(tile).join('')}</div>
    ` };
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
  return { photo: clips[0]?.img || 'gym-arc-1', after: animateProfileShapes, html: `
    ${tabHead('Profile')}
    ${(() => {
      // your Climber ID, after the lanyard ID card in the team's references: a lime card on an ink strap, the mascot as a
      // charm on the clip, big faint words behind it. Your photo, name, home gym, hardest send and style on the card.
      const sentC = clips.filter(topOf), top = [...sentC].sort((p, q) => GR.indexOf(ROUTES[q.ri].grade) - GR.indexOf(ROUTES[p.ri].grade))[0];
      return `<section class="ph" aria-label="Your profile">
      <div class="ph-cv ph-shape-container" id="profile-shapes" role="img" aria-label="${picks.size ? `Your climbing styles: ${STYLES.filter(style => picks.has(style[0])).map(style => style[1]).join(', ')}` : 'Choose your climbing style to fill this space'}">${picks.size ? STYLES.filter(style => picks.has(style[0])).map(([k, label, shape]) => `<span class="ph-shape pk-${shape}" aria-hidden="true"><span>${label}</span></span>`).join('') : ''}</div>
      <div class="ph-me"><span class="ph-av">${avatar('You')}</span>
        <button class="ph-st ph-ed" type="button" data-act="to" data-to="pick/edit">${picks.size ? `${ic.pen}Edit styles` : 'Pick your style'}</button></div>
      <h2 class="ph-n">You</h2>
      <div class="ph-g"><button class="ph-hg" type="button" data-act="to" data-to="gym/0">${ic.pin}<span>${gym.name}</span></button>
        <button class="ph-stt${myStatus ? ` is-${myStatus}` : ''}" type="button" data-act="status" aria-label="Your status: ${STATUS.find(s => s[0] === myStatus)[1]}. Change it"><i></i>${myStatus ? STATUS.find(s => s[0] === myStatus)[1] : 'Set a status'}</button></div>
      <div class="ph-s${clips.length ? '' : ' ph-s-e'}">
        <span><b class="num">${top ? ROUTES[top.ri].grade : '—'}</b><i>hardest send</i></span>
        <span><b class="num">${clips.length || '—'}</b><i>on video</i></span>
        <span><b class="num">${tops ? `${tops}<small>/${ROUTES.length}</small>` : '—'}</b><i>topped</i></span></div>
      ${follows.size ? '' : `<button class="ph-fr" type="button" data-act="to" data-to="friends">Find friends</button>`}
      <button class="ph-plans" type="button" data-act="to" data-to="friends/friends">My climbing plans ${ic.arr('#111111')}</button>
      </section>${top ? (() => { const g0 = gyms[top.gy ?? 0] || gym, vh = votesOf(top.ri).h, said = shiftG(ROUTES[top.ri].grade, vh), avg = shiftG(ROUTES[top.ri].grade, vh + gymLean(g0));
        return `<div class="rows pf-lv"><button class="row" type="button" data-act="to" data-to="route/${top.ri}"><span class="row-t"><strong>Your level ≈ ${avg} at the average gym</strong>
          <span>Your hardest send, ${rname(ROUTES[top.ri])}, is a ${said} by climbers’ votes. ${g0.name} grades ${leanWords(gymLean(g0)).toLowerCase().replace('graded ', '')}.</span></span>${ic.arr('#111111')}</button></div>`; })() : ''}`; })()}
    ${session === 'live' ? `<section class="recap solid"><span class="sub">Climbing now · ${gym.name}</span><b class="num" id="prclk">${clk(sesSecs())}</b><span class="sub">${n(dayLog(0).reduce((s, e) => s + e.tries, 0) + gday(0).length, 'try', 'tries')} · ${n(dayLog(0).filter(e => e.sent).length + gday(0).filter(gsent).length, 'send', 'sends')} today</span><button class="pr-end" type="button" data-act="lgend">End session</button></section>` : ''}
    <div class="fold"></div>
    ${prog ? `<div class="sec"><h2>Your routes</h2></div><div class="rgrid">${ROUTES.map((r, i) => i).filter(i => mineOn(i).length).map(rcard).join('')}</div>` : ''}
    ${trend.length > 1 ? `<div class="hl2 dk2"><h2>Your body, try by try</h2><span class="hint2">oldest first</span></div>
      <div class="stack"><div class="lt pf">${bars('Hips over feet', s => s.hipsOver)}${bars('Moving', s => s.moving)}
        <p class="an-n">From each analysed video, first move to last. G = Green, O = Orange, then the try.</p></div></div>` : ''}
    <div class="sec"><h2>Logbook</h2><button class="sec-more" type="button" data-act="to" data-to="session">${session === 'live' ? 'Open the session' : 'Start a session'}</button></div>
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


/* ---------- How hard each gym grades, worked out from climbers who climb at more than one ----------
   Every climber has a level at each gym they climb at: the hardest grade they topped there at least 3 times in the last
   3 months, counted only after 5 sessions there (a gym you barely know reads harder than it is). In half grades
   (V4 = 8, V4+ = 9). That level is the climber's ability, less how hard the gym grades:
       level(climber, gym) = ability(climber) - hard(gym)
   Someone who climbs at one gym can't tell those two apart; someone at two can (V5 at A, V4 at B: B is a grade
   harder than A). Solved by taking turns: abilities from the gyms, the gyms from the abilities, until it settles.
   The average gym is 0. A board (Kilter, Tension) grades the same everywhere, so a climber's board grade counts as one
   more place: it ties in climbers who only ever climb at one gym. Bouldering only; rope grades use the same lean.
   The sends below are a sample world: 180 climbers, each gym's real grading hidden in TRUE, which the calculation never reads. */
function sampleSends() {
  let x = 20261116; const rnd = () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; };
  const gauss = () => { let u = 0; for (let k = 0; k < 6; k++) u += rnd(); return u - 3; };
  const TRUE = [1, -1, -.5, 1.5, 0, 0], HOME = [.3, .2, .2, .2, .1], BOARD = 5;   // places 0-4 are the gyms, 5 is a board
  const pickGym = (not = []) => { for (;;) { let r = rnd(), g = 0; while (r > HOME[g]) { r -= HOME[g]; g++; } if (!not.includes(g)) return g; } };
  const out = [];
  for (let c = 0; c < 180; c++) {
    const ability = 4 + Math.floor(rnd() * 11), at = [pickGym()];
    if (rnd() < .4) at.push(at[0] === 1 && rnd() < .6 ? 2 : at[0] === 2 && rnd() < .6 ? 1 : pickGym(at));   // the two Urbana Boulders gyms share a pass
    if (rnd() < .1) at.push(pickGym(at));
    if (rnd() < .25) at.push(BOARD);
    at.forEach((g, k) => { if (k && g !== BOARD && rnd() < .2) return;   // under 5 sessions there: not counted
      out.push({ c, g, level: Math.round(ability - TRUE[g] + gauss() * .7) }); });
  }
  return out;
}
function gymLeans(sends, places = 6, gymsN = 5) {
  const by = new Map(); sends.forEach(x => by.set(x.c, [...(by.get(x.c) || []), x]));
  const cross = [...by.values()].filter(xs => xs.length > 1).flat();   // only climbers seen in two places say anything
  const hard = Array(places).fill(0), ab = new Map();
  for (let it = 0; it < 60; it++) {
    by.forEach((xs, c) => ab.set(c, xs.reduce((n, x) => n + x.level + hard[x.g], 0) / xs.length));
    for (let g = 0; g < places; g++) { const xs = cross.filter(x => x.g === g); if (xs.length) hard[g] = xs.reduce((n, x) => n + ab.get(x.c) - x.level, 0) / xs.length; }
    const m = hard.slice(0, gymsN).reduce((n, v) => n + v, 0) / gymsN; for (let g = 0; g < places; g++) hard[g] -= m;
  }
  return hard.slice(0, gymsN).map((b, g) => { const xs = cross.filter(x => x.g === g), r = xs.map(x => ab.get(x.c) - x.level - b);
    const sd = Math.sqrt(r.reduce((n, v) => n + v * v, 0) / Math.max(1, r.length - 1));
    return { b, h: Math.round(b), n: new Set(xs.map(x => x.c)).size, se: sd / Math.sqrt(Math.max(1, xs.length)) }; });
}
gymLeans(sampleSends()).forEach((l, g) => { gyms[g].lean = l; });
const ENOUGH = 15;   // fewer climbers who also climb elsewhere than this, and a gym's lean isn't shown as a number

/* ---------- Gyms tab: where you climb, then the others near you. Map, and one page per gym ---------- */
const atGym = i => i === 0 ? { videos: clips.length, last: clips.length ? Math.min(...clips.map(agoOf)) : null } : { videos: 0, last: null };
// a gym in a list: photo, name, distance and town, whether it's open; a round button for directions
const NAV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 21 3l-8 18-2-8z"/></svg>';
const openDot = o => `<span class="g3-o${o.open ? ' on' : ''}"><i></i>${o.line}</span>`;
function gymCard(g, i) {
  const a = atGym(i), o = gymOpen(g), what = a.videos ? `${n(a.videos, 'try', 'tries')} on video` : g.addr.split(',').pop().trim();
  return `<div class="g3r">
      <button class="g3r-m" type="button" data-act="to" data-to="gym/${i}">${g.img ? `<img src="${pic(g.img)}" alt="">` : `<span class="gt-placeholder" aria-hidden="true">${ic.pin}</span>`}
        <span class="g3r-t"><strong>${g.name}</strong><span>${g.dist} · ${what}</span>${openDot(o)}</span></button>
      <button class="g3-nav" type="button" data-act="gymaps" data-i="${i}" aria-label="Directions to ${g.name}">${NAV}</button>
    </div>`;
}
// where you climb: the photo is the card, the name and what you did there sit on it
function gymBig(g) {
  const a = atGym(0), o = gymOpen(g);
  const meta = [g.dist, a.videos ? n(a.videos, 'try', 'tries') + ' on video' : '', a.last !== null ? 'last climbed ' + dayLabel(a.last) : ''].filter(Boolean).join(' · ');
  return `<div class="g3"><button class="g3-i" type="button" data-act="to" data-to="gym/0" aria-label="${g.name}">${g.img ? `<img src="${pic(g.img)}" alt="">` : `<span class="gt-placeholder" aria-hidden="true">${ic.pin}</span>`}${openDot(o)}
      <span class="g3-t"><strong>${g.name}</strong><span>${meta}</span></span></button>
    <button class="g3-nav g3-nav-l" type="button" data-act="gymaps" data-i="0" aria-label="Directions to ${g.name}">${NAV}</button></div>`;
}
// Addresses, regular hours and facilities from the linked official location pages.
gyms.push(
  { name: 'Movement Wrigleyville', city: 'Chicago', addr: '1115 W Addison St, Chicago, IL 60613',
    dist: 'About 132 mi', mi: 132, deg: 12, img: '', pics: [],
    hours: [[8,18],[6,23],[6,23],[6,23],[6,23],[6,23],[8,20]],
    pass: 'See website', has: ['Bouldering', 'Yoga', 'Fitness'], src: 'movementgyms.com/wrigleyville/' },
  { name: 'First Ascent Peoria', city: 'Peoria', addr: '927 SW Washington St, Peoria, IL 61602',
    dist: 'About 81 mi', mi: 81, deg: 299, img: '', pics: [],
    hours: [[10,18],[12,21],[12,21],[12,21],[12,21],[12,21],[10,18]],
    pass: 'See website', has: ['Bouldering', 'Top rope', 'Lead climbing', 'Auto belay', 'Yoga', 'Fitness'], src: 'faclimbing.com/peoria/location/' }
);
// the location bar: where you're looking (tap to change it) and the map, side by side.
// "Near you" lists every gym by distance from you; a town lists only the gyms in it
let gArea = 'near';
const AREAS = ['Champaign', 'Urbana', 'Bloomington', 'Chicago', 'Peoria'];
const inArea = g => gArea === 'near' || g.addr.includes(gArea);
// Gyms tab, map first, the way map apps work: the map holds still and fills the screen; the gyms sit in a sheet over it that you
// drag between three heights (peek, half, full) and that scrolls on its own. A pin and a row select the same gym: tap a pin and the
// sheet rises to that gym; tap a row and the map moves to its pin. A selected row opens to "Open gym" and "Directions".
var tmap = null, gtSnap = 'peek', gtSel = null;
function viewGymsTab() {
  const list = gyms.map((g, i) => [g, i]).filter(([g]) => inArea(g));
  const open = list.filter(([g]) => gymOpen(g).open).length;
  const row = ([g, i]) => { const o = gymOpen(g), a = atGym(i);
    return `<div class="gt-r${gtSel === i ? ' sel' : ''}" id="gtr${i}"><button class="gt-m" type="button" data-act="gtsel" data-i="${i}" aria-expanded="${gtSel === i}">${g.img ? `<img src="${pic(g.img)}" alt="">` : `<span class="gt-placeholder" aria-hidden="true">${ic.pin}</span>`}
      <span class="gt-t"><strong>${g.name}${i === 0 ? '<em>Your gym</em>' : ''}</strong><span>${g.dist.replace(' from the Quad', '')}${a.videos ? ` · ${n(a.videos, 'try', 'tries')} on video` : ''}</span>${openDot(o)}</span></button>
      <div class="gt-x" ${gtSel === i ? "" : "inert"}><button class="gt-b1" type="button" data-act="to" data-to="gym/${i}">Open gym</button><button class="gt-b2" type="button" data-act="gymaps" data-i="${i}">${NAV}Directions</button></div></div>`; };
  return { map: true, html: '', overlay: `<div class="gt-map" id="gtmap">${window.L ? '' : '<p class="gm-off">The map needs an internet connection. The list works without one.</p>'}</div>
    <div class="gt-head"><div class="gt-ht"><h1 class="hl tab">Gyms${MASC}</h1><button class="av sm" type="button" data-act="to" data-to="profile" aria-label="Your profile">${avatar('You')}</button></div>
      <label class="gt-search">${ic.search}<input id="gtsearch" type="search" placeholder="Search gyms" aria-label="Search gyms" autocomplete="off"></label><div class="gt-top"><button class="gloc-a" type="button" data-act="garea">${ic.pin}<b>${gArea === 'near' ? 'All cities' : gArea}</b><svg class="gloc-v" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
        <span class="gt-n">${open ? `${open} open now` : 'all closed now'}</span></div></div>
    <section class="gt-sheet" id="gtsheet" aria-label="Gyms list"><div class="gt-sh" id="gtsh"><button class="gt-grab" type="button" aria-label="Expand or collapse gyms list" aria-controls="gtlw"></button>
      <div class="gt-h"><h2>${gArea === 'near' ? 'All cities' : gArea}</h2><span>${n(list.length, 'gym', 'gyms')}</span></div></div>
      <div class="gt-lw" id="gtlw"><p class="cap gt-empty" id="gtempty" hidden>No gyms found.</p>${list.length ? `<div class="gt-l">${list.map(row).join('')}</div>` : `<p class="cap">No gyms in ${gArea} yet.</p>`}
      <p class="cap">Gyms no one has filmed at show only what the gym publishes.</p></div></section>`, after: () => gtWire(list) };
}
const gtSnaps = () => { const H = $('camx').clientHeight; return { full: 112, half: Math.round(H * .5), peek: H - 274 }; };
const gtTop = () => parseFloat($('gtsheet')?.style.top) || gtSnaps()[gtSnap];
function gtSet(s, anim = true) {
  const sh = $('gtsheet'); if (!sh) return;
  gtSnap = s; sh.classList.toggle('cards', s === 'peek'); sh.classList.toggle('anim', anim); sh.style.top = gtSnaps()[s] + 'px'; sh.dataset.snap = s;
}
// keep a gym's pin in the open part of the map: under the header, above the sheet
function gtFocus(i, anim = true) {
  if (!tmap) return;
  const ll = gymLL(gyms[i]), p = tmap.latLngToContainerPoint(ll), W = $('gtmap').clientWidth, top = 150, bot = gtSnaps()[gtSnap];
  tmap.panBy([p.x - W / 2, p.y - (top + bot) / 2], { animate: anim });
}
function gtSelect(i, from) {
  gtSel = gtSel === i && from === 'row' ? null : i;
  document.querySelectorAll('.tp').forEach(el => el.classList.toggle('sel', +el.dataset.i === gtSel));
  document.querySelectorAll('.gt-r').forEach(r => { const on = r.id === 'gtr' + gtSel; r.classList.toggle('sel', on); r.querySelector('.gt-m').setAttribute('aria-expanded', on); r.querySelector('.gt-x').inert = !on; });
  if (gtSel === null) return;
  if ($('gtsheet').classList.contains('cards')) gtSet('half');
  if (from === 'pin' && (gtSnap === 'peek' || $('gtsheet').classList.contains('cards'))) gtSet('half');
  const r = $('gtr' + i), lw = $('gtlw');
  if (r && lw) setTimeout(() => lw.scrollTo({ top: lw.scrollTop + r.getBoundingClientRect().top - lw.getBoundingClientRect().top - 4, behavior: 'smooth' }), from === 'pin' ? 60 : 0);
  setTimeout(() => gtFocus(i), from === 'pin' && gtSnap === 'half' ? 260 : 0);
}
function gtWire(list) {
  if (tmap) { tmap.remove(); tmap = null; }
  gtSet(gtSnap, false);
  // dragging the sheet by its top: follows the finger, then settles on the nearest height (a flick goes one further)
  const sh = $('gtsheet'), hd = $('gtsh');
  let y0 = 0, top0 = 0, last = 0, lt = 0, v = 0, moved = false, drag = false;
  const move = e => { if (!drag) return;
    const dy = e.clientY - y0; if (Math.abs(dy) > 4) moved = true;
    const s = gtSnaps(), now = performance.now(); v = (e.clientY - last) / Math.max(1, now - lt); last = e.clientY; lt = now;
    let t = top0 + dy; if (t < s.full) t = s.full - (s.full - t) * .25; if (t > s.peek) t = s.peek + (t - s.peek) * .25;
    sh.style.top = t + 'px'; e.preventDefault(); };
  const end = () => { if (!drag) return; drag = false;
    window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end);
    if (!moved) { gtSet(gtSnap === 'peek' ? 'half' : gtSnap === 'half' ? 'full' : 'half'); return; }
    const s = gtSnaps(), t = gtTop() + v * 180;
    gtSet(['full', 'half', 'peek'].reduce((b, k) => Math.abs(s[k] - t) < Math.abs(s[b] - t) ? k : b, 'half')); };
  hd.querySelector('.gt-grab').addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault(); gtSet(gtSnap === 'peek' ? 'half' : gtSnap === 'half' ? 'full' : 'half');
  });
  hd.addEventListener('pointerdown', e => { drag = true; y0 = last = e.clientY; top0 = gtTop(); lt = performance.now(); v = 0; moved = false; sh.classList.remove('anim');
    window.addEventListener('pointermove', move, { passive: false }); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end); });
  const search = $('gtsearch');
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    let count = 0;
    list.forEach(([g, i]) => {
      const match = (g.name + ' ' + g.addr).toLowerCase().includes(query);
      $('gtr' + i).hidden = !match;
      const pin = document.querySelector('.tp[data-i="' + i + '"]');
      if (pin) pin.style.display = match ? '' : 'none';
      if (match) count++;
    });
    $('gtempty').hidden = count > 0;
    document.querySelector('.gt-h span').textContent = n(count, 'gym', 'gyms');
  });
  const el = $('gtmap');
  if (!el || !window.L || !list.length) return;
  tmap = L.map(el, { zoomControl: false, attributionControl: false, scrollWheelZoom: true, zoomSnap: .25 });
  if (L.maplibreGL && window.maplibregl) {
    L.maplibreGL({ style: 'https://tiles.openfreemap.org/styles/positron',
      attribution: '<a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a> | <a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
    }).addTo(tmap);
  } else {
    el.insertAdjacentHTML('beforeend', '<p class="gm-off">The map could not load. Please reload to try again.</p>');
  }

  const creditControl = L.control({ position: 'bottomright' });
  creditControl.onAdd = () => {
    const container = L.DomUtil.create('div', 'leaflet-control-attribution');
    container.innerHTML = '<details class="gt-credits"><summary aria-label="Map credits"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/></svg></summary><div><a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a> | <a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></div></details>';
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);
    return container;
  };
  creditControl.addTo(tmap);
  L.marker(HERE, { icon: L.divIcon({ className: 'tp-you', html: '<i></i>', iconSize: [16, 16] }), interactive: false, keyboard: false }).addTo(tmap);
  const close = list.filter(([g]) => g.mi <= 5), fit = gArea === 'near' && close.length ? close : list;
  const pts = [...(gArea === 'near' ? [HERE] : []), ...fit.map(([g]) => gymLL(g))];
  tmap.fitBounds(L.latLngBounds(pts), { paddingTopLeft: [40, 170], paddingBottomRight: [40, $('camx').clientHeight - gtSnaps()[gtSnap] + 30], maxZoom: 14 });
  list.forEach(([g, i]) => {
    const pin = L.marker(gymLL(g), { title: g.name, riseOnHover: true, zIndexOffset: i === 0 ? 500 : 0,
      icon: L.divIcon({ className: `tp${i === 0 ? ' me' : ''}${gtSel === i ? ' sel' : ''}`, html: `<span class="tp-ph">${g.img ? `<img src="${pic(g.img)}" alt="">` : `<span class="gt-placeholder" aria-hidden="true">${ic.pin}</span>`}</span><b>${g.name}</b>`, iconSize: [0, 0] }) }).addTo(tmap);
    pin.getElement().dataset.i = i;
    pin.on('click', ev => { L.DomEvent.stopPropagation(ev); gtSelect(i, 'pin'); });
  });
  tmap.on('click', () => {
    gtSel = null;
    document.querySelectorAll('.tp.sel, .gt-r.sel').forEach(x => x.classList.remove('sel'));
    document.querySelectorAll('.gt-m').forEach(x => x.setAttribute('aria-expanded', 'false'));
    document.querySelectorAll('.gt-x').forEach(x => x.inert = true);
    gtSet('peek');
    $('gtsheet').classList.add('cards');
    $('gtlw').scrollTo({ left: 0, top: 0 });
  });
  if (gtSel !== null) gtFocus(gtSel, false);
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
  const g = gyms[i], op = gymOpen(g), today = g.hours[new Date().getDay()], pics = [g.img, ...g.pics].filter(Boolean);
  return { html: `
    ${bar(g.name)}
    <div class="gy-car" id="gycar">${pics.map(p => `<img src="${pic(p)}" alt="">`).join('')}</div>
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
    ${gymGrading(g)}
    <div class="rows"><div class="row"><span class="row-t"><strong>No videos from here yet</strong><span>Spotter’s routes and side by sides are at ${gym.name} for now.</span></span></div></div>
    <a class="b-lime gy-cta" href="https://${g.src}" target="_blank" rel="noopener">Buy a day pass · ${g.pass.split(' · ')[0]} <span aria-hidden="true">↗</span></a>
    <p class="gy-cta-n">On ${g.src.replace(/\/.*$/, '')}, the gym’s own site</p>`, after: carWire };
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
  // the climb ends at the top: the highest hand position. Anything after it is climbing down or walking off
  const top = steps.reduce((a, q, i) => q.pos[1] < steps[a].pos[1] ? i : a, 0);
  steps = steps.slice(0, top + 1);
  // the start holds: where each hand first lands on the wall. Where the climber stood before that is not a hold
  const iL = steps.findIndex((q, i) => i && q.hand === 'lw'), iR = steps.findIndex((q, i) => i && q.hand === 'rw');
  const l0 = iL > 0 ? steps[iL].pos : steps[0].pos, r0 = iR > 0 ? steps[iR].pos : steps[0].pos, i0 = Math.max(iL, iR, 0);
  const tS = steps[i0].t;
  const S = { hand: 'B', pos: [(l0[0] + r0[0]) / 2, (l0[1] + r0[1]) / 2], holds: [l0, r0], feet: [], t: tS };
  // a hand that only shifts on the hold it already holds is not a move: it is folded into that hand's last hold.
  // So is a short drop back down: a re-grip, not progress
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]), near = (p, q) => dist(p, q) < 40;
  const held = { lw: l0, rw: r0 }, out = [S];
  let carry = [];
  steps.slice(i0 + 1).forEach(q => {
    if (q.pos[1] > held[q.hand][1] && dist(held[q.hand], q.pos) < 80) { carry = carry.concat(q.feet); return; }
    if (near(held[q.hand], q.pos)) { carry = carry.concat(q.feet); held[q.hand] = q.pos; const last = [...out].reverse().find(o => o.hand === q.hand); if (last) last.pos = q.pos; return; }
    const match = near(held[q.hand === 'lw' ? 'rw' : 'lw'], q.pos);
    // hands swapping back and forth on one hold is one match, not several
    if (match && out[out.length - 1].match) { carry = carry.concat(q.feet); held[q.hand] = q.pos; return; }
    out.push({ ...q, from: held[q.hand], feet: carry.concat(q.feet), match });
    carry = []; held[q.hand] = q.pos; });
  // how far and which way each hand goes, in words: size against this climb's typical move, direction in eighths
  const lens = out.slice(1).map(q => Math.hypot(q.pos[0] - q.from[0], q.pos[1] - q.from[1])).sort((p, q) => p - q), med = lens[lens.length >> 1] || 1;
  out.slice(1).forEach(q => { const dx = q.pos[0] - q.from[0], dy = q.from[1] - q.pos[1], d = Math.hypot(dx, dy);
    q.dir = BDIR[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8];
    q.size = d > med * 1.4 ? 'long' : d < med * .6 ? 'short' : ''; });
  const end = out[out.length - 1].t;
  return { steps: out, feet: T.moves.filter(m => (m.k === 'la' || m.k === 'ra') && m.t >= tS && m.t <= end).length }; };
const BDIR = ['right', 'up and right', 'up', 'up and left', 'left', 'down and left', 'down', 'down and right'];
// the beta for a route: the video it was opened from when that climber topped it; otherwise a send by someone else (Leo first)
const betaOf = (ri, vi = null) => {
  const ask = vi != null ? V[vi] : null, ok = x => x && x.ri === ri && x.top && TRK[x.vid];
  const x = ok(ask) ? ask : [V.find(q => q.who === 'Leo' && q.ri === ri), ...V.filter(q => q.who !== 'You' && q.ri === ri)].find(ok);
  return x ? { x, ask, T: TRK[x.vid], ...stepsOf(TRK[x.vid]) } : null; };
const handWord = { lw: 'Left hand', rw: 'Right hand' };
const moveSay = q => q.match ? `${handWord[q.hand]} matches the other hand` : `${handWord[q.hand]}: ${q.size ? q.size + ' ' : ''}reach ${q.dir}`;
// a route's own holds, found in the photo by their colour: the video's first frame (the wall before the climber covers it),
// pixels of the route's hue that are saturated enough, joined into blobs. Positions are in the 540x960 frame the moves use
// hue range, then the saturation and brightness a hold's pixels clear. Measured on these walls' footage: their orange holds read coral
const HOLDS = {}, WALL = {}, HUE = { Green: [85, 160, .28, .15], Orange: [348, 375, .5, .45], Blue: [190, 232, .35, .2], Yellow: [44, 66, .45, .4], Purple: [262, 300, .3, .2], Pink: [305, 345, .35, .35], Red: [345, 372, .5, .3] };
function findHolds(im, [h0, h1, s0, v0]) {
  const W = 270, H = 480, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(im, 0, 0, W, H);
  const d = cx.getImageData(0, 0, W, H).data, m = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) { const r = d[i * 4] / 255, g = d[i * 4 + 1] / 255, b = d[i * 4 + 2] / 255, mx = Math.max(r, g, b), c = mx - Math.min(r, g, b);
    if (!c || c / mx < s0 || mx < v0) continue;
    let h = (mx === r ? ((g - b) / c + 6) % 6 : mx === g ? (b - r) / c + 2 : (r - g) / c + 4) * 60;
    if (h < h0 && h + 360 <= h1) h += 360;
    if (h >= h0 && h <= h1) m[i] = 1; }
  const seen = new Uint8Array(W * H), out = [];
  for (let i = 0; i < W * H; i++) { if (!m[i] || seen[i]) continue; const st = [i]; seen[i] = 1; let n = 0, sx = 0, sy = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
    while (st.length) { const p = st.pop(), x = p % W, y = (p / W) | 0; n++; sx += x; sy += y; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) if (q >= 0 && q < W * H && m[q] && !seen[q]) { seen[q] = 1; st.push(q); } }
    if (n >= 8) out.push({ x: sx / n * 2, y: sy / n * 2, r: Math.max(x1 - x0, y1 - y0) + 2 }); }
  return out; }
function needHolds(img, color) {
  const key = `${img}|${color}`;
  if (key in HOLDS) return HOLDS[key] || [];
  // the photo the holds were found in is the one to draw on: the empty wall when the video has one
  HOLDS[key] = null; const at = [page, arg];
  const load = src => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });
  load(`${pic(img, 0)}`).catch(() => load(`${pic(img)}`)).then(im => { WALL[img] = im.getAttribute('src'); HOLDS[key] = HUE[color] ? findHolds(im, HUE[color]) : []; })
    .catch(() => { HOLDS[key] = []; }).then(() => { if (page === at[0] && arg === at[1]) render(); });
  return []; }
// the beta opened from a route or from your analysis: no camera, so no Retake
let betaOnly = false, betaV = null;
// Find beta, with the real camera: photograph the wall, tap a hold of your route. Its colour says which route it is, and every
// hold of that colour lights up on your photo. Then the route's beta, as the climber who topped it climbed it
let scanStream = null, scanAsk = false, scanErr = '', scanCv = null, scanURL = '', scanPick = null, scanFound = [];
async function scanStart() {
  if (scanStream || scanAsk) return;
  if (!navigator.mediaDevices?.getUserMedia) { scanErr = 'none'; render(); return; }
  scanAsk = true;
  try { scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }); scanErr = ''; }
  catch (e) { scanErr = e.name === 'NotAllowedError' || e.name === 'SecurityError' ? 'denied' : 'none'; }
  scanAsk = false;
  if (page !== 'scan' || scanShot || scanURL) scanStop(); else render();
}
function scanStop() { scanStream?.getTracks().forEach(t => t.stop()); scanStream = null; }
// the photo, cropped to the 9:16 the beta is drawn in (540 × 960), so the holds, your taps and the beta share one frame
function scanTake(src, w, h) {
  const cv = document.createElement('canvas'); cv.width = 540; cv.height = 960; const g = cv.getContext('2d', { willReadFrequently: true });
  const k = Math.max(540 / w, 960 / h); g.drawImage(src, (540 - w * k) / 2, (960 - h * k) / 2, w * k, h * k);
  scanCv = cv; scanURL = cv.toDataURL('image/jpeg', .85); scanPick = null; scanStop();
  scanFound = Object.keys(HUE).filter(k => k !== 'Red').map(k => ({ k, holds: findHolds(cv, HUE[k]) })).filter(q => q.holds.length >= 3).sort((a, b) => b.holds.length - a.holds.length);
  render();
}
const betaRis = () => ROUTES.map((r, i) => i).filter(i => V.some(x => x.who === 'Leo' && x.ri === i));
// the colour of the hold you tapped: the most colourful quarter of the pixels around the tap (a hold's middle, not its edge
// or shadow), averaged round the colour wheel. Grey, white or the wall itself is no colour
function scanColorAt(x, y) {
  const R = 14, d = scanCv.getContext('2d', { willReadFrequently: true }).getImageData(Math.max(0, x - R), Math.max(0, y - R), R * 2, R * 2).data, px = [];
  for (let i = 0; i < d.length; i += 4) { const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, g, b), c = mx - Math.min(r, g, b); if (!c) continue;
    px.push({ h: (mx === r ? ((g - b) / c + 6) % 6 : mx === g ? (b - r) / c + 2 : (r - g) / c + 4) * 60, s: c / mx, v: mx }); }
  px.sort((a, b) => b.s - a.s); const top = px.slice(0, Math.max(1, px.length >> 2));
  if (!top.length || top[0].s < .25) return null;
  const rad = Math.PI / 180, h = (Math.atan2(top.reduce((a, q) => a + Math.sin(q.h * rad), 0), top.reduce((a, q) => a + Math.cos(q.h * rad), 0)) / rad + 360) % 360;
  const sat = top.reduce((a, q) => a + q.s, 0) / top.length, val = top.reduce((a, q) => a + q.v, 0) / top.length;
  const fits = k => { const [h0, h1, s0, v0] = HUE[k], hh = h < h0 && h + 360 <= h1 ? h + 360 : h; return hh >= h0 && hh <= h1 && sat >= s0 * .8 && val >= v0 * .8; };
  // the colours of routes with a beta are tried first: orange and red overlap, and the one we can help with wins
  return [...new Set([...betaRis().map(i => ROUTES[i].color), ...Object.keys(HUE)])].find(fits) || null;
}
function scanTap(e) {
  const svg = e.currentTarget, pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const q = pt.matrixTransform(svg.getScreenCTM().inverse()), x = Math.round(q.x), y = Math.round(q.y);
  let near = null, bd = 1e9; scanFound.forEach(({ k, holds }) => holds.forEach(h => { const d = Math.hypot(h.x - x, h.y - y) - h.r * .6; if (d < bd) { bd = d; near = k; } }));
  const color = bd < 26 ? near : scanColorAt(x, y);
  if (!color) { toast('No coloured hold there. Tap closer to one, or pick a colour below'); return; }
  scanPick = { x, y, color, holds: findHolds(scanCv, HUE[color]), ri: betaRis().find(i => ROUTES[i].color === color) ?? -1 }; render();
}
function scanColor(k) { const q = scanFound.find(z => z.k === k); if (!q) return; scanPick = { x: null, y: null, color: k, holds: q.holds, ri: betaRis().find(i => ROUTES[i].color === k) ?? -1 }; render(); }
function scanFile(f) {
  if (!f) return; if (f.type && !f.type.startsWith('image/')) { toast('That isn’t a photo'); return; }
  toast('Opening your photo…'); const u = URL.createObjectURL(f), im = new Image();
  im.onload = () => { scanTake(im, im.naturalWidth, im.naturalHeight); URL.revokeObjectURL(u); }; im.onerror = () => { URL.revokeObjectURL(u); toast('Couldn’t open that photo. Try a JPEG or take one with the camera'); }; im.src = u;
}
let scanInp = null;
function scanPhotos() {
  if (!scanInp) { scanInp = document.createElement('input'); scanInp.type = 'file'; scanInp.accept = 'image/*'; scanInp.hidden = true; document.body.appendChild(scanInp);
    const got = () => { const f = scanInp.files[0]; scanInp.value = ''; if (f) scanFile(f); };
    scanInp.addEventListener('change', got); }
  scanInp.click();
}
const scanAfter = () => {
  const svg = $('scsvg'); if (svg) svg.onclick = scanTap;
  if (scanURL) return; if (!scanStream) { if (!scanErr) scanStart(); return; }
  const v = $('scv'); if (v && v.srcObject !== scanStream) { v.srcObject = scanStream; v.play().catch(() => {}); } };
function viewScanCam() {
  const photos = `<button class="cam-imp" type="button" data-act="scanphotos"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.6"/></svg><span>Photos</span></button>`;
  const top = `<div class="cam-top"><button class="bk" type="button" data-act="${scanURL ? 'scanretake' : 'back'}" aria-label="${scanURL ? 'Retake' : 'Back'}">${ic.back}</button><strong class="scan-ttl">Find beta</strong></div>`;
  if (!scanURL) {
    const why = scanErr === 'denied' ? ['Camera access is off', 'Allow the camera for this site in your browser settings, or choose a photo of the wall.'] : scanErr ? ['No camera here', 'Choose a photo of the wall instead.'] : null;
    return { bare: true, dark: true, html: '', after: scanAfter, overlay: `
      <video id="scv" class="cam-live" muted playsinline autoplay aria-label="What your camera sees"></video>
      ${why ? `<div class="cam-err"><strong>${why[0]}</strong><span>${why[1]}</span><div><button type="button" data-act="scantry">Try again</button><button type="button" data-act="scanphotos">Choose a photo</button></div></div>` : ''}
      ${top}<span class="cam-fr" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      ${why ? '' : `<p class="cam-guide">${scanStream ? 'Get your route in the picture, from the start holds to the top' : 'Starting the camera…'}</p>`}
      <div class="cam-bot">${photos}<button class="shut" type="button" data-act="scansnap" aria-label="Take a photo"${scanStream ? '' : ' disabled'}><i></i></button><span></span></div><div class="cam-shutter-label">Photo</div>` };
  }
  const k = scanPick, r = k && k.ri >= 0 ? ROUTES[k.ri] : null, f = v => v.toFixed(0);
  const marks = k ? `${k.holds.map(h => `<circle cx="${f(h.x)}" cy="${f(h.y)}" r="${f(Math.max(h.r * .6 + 5, 10))}" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-dasharray="5 4"/>`).join('')}
      ${k.x == null ? '' : `<circle cx="${k.x}" cy="${k.y}" r="17" fill="none" stroke="#111111" stroke-width="7" opacity=".4"/><circle cx="${k.x}" cy="${k.y}" r="17" fill="none" stroke="#C2FF01" stroke-width="4"/>`}` : '';
  const withBeta = betaRis().map(i => rname(ROUTES[i])).join(' and ');
  const say = !k ? (scanFound.length ? ['Which route is yours?', 'Tap one of its holds on the photo, or its colour below.'] : ['No coloured holds found', 'Get closer, with the holds lit and in focus. White and black holds can’t be told from the wall yet.'])
    : r ? [`${sw(r)}${rname(r)}`, `${n(k.holds.length, 'hold', 'holds')} found in ${k.color.toLowerCase()}. Wrong one? Tap another colour.`]
    : [`${n(k.holds.length, `${k.color.toLowerCase()} hold`, `${k.color.toLowerCase()} holds`)} found`, `There’s no beta for a ${k.color.toLowerCase()} route yet. A beta comes from someone’s video of the route; so far only ${withBeta} at ARC have one.`];
  const chips = scanFound.length ? `<div class="scan-chips">${scanFound.map(q => `<button type="button" data-act="scancolor" data-k="${q.k}" aria-pressed="${k?.color === q.k}"><i style="background:${HOLD_COLORS[q.k] || '#999'}"></i>${q.k}<small>${q.holds.length}</small></button>`).join('')}</div>` : '';
  return { bare: true, dark: true, html: '', after: scanAfter, overlay: `
    <svg id="scsvg" class="scan-photo" viewBox="0 0 540 960" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Your photo of the wall. Tap a hold"><image href="${scanURL}" width="540" height="960"/>${marks}</svg>
    ${top}
    <div class="scan-res" role="status"><strong>${say[0]}</strong><span>${say[1]}</span>${chips}
      <div class="scan-acts"><button class="b-ghost" type="button" data-act="scanretake">Retake</button>${r ? `<button class="b-lime" type="button" data-act="scango">See the beta</button>` : ''}</div></div>` };
}
function viewScan() {
  needTracks(V.filter(q => q.ri === scanRi));
  const r = ROUTES[scanRi], B = betaOf(scanRi, betaV), corners = '<path d="M24 80V24h56M460 24h56v56M516 880v56h-56M80 936H24v-56" fill="none" stroke="#FFFFFF" stroke-width="3"/>';
  needTracks(V.filter(q => q.who === 'Leo'));
  if (!scanShot) return viewScanCam();
  if (!B) return { html: `${bar('Find beta')}<div class="scan-unavailable"><h1>Beta isn’t available yet</h1><p>We couldn’t load a recorded climb for this route.</p><button class="b-lime" type="button" data-act="rescan">Choose another route</button></div>` };
  const N = B.steps.length - 1, st = B.steps[bstep], prev = B.steps[Math.max(0, bstep - 1)], pt = q => `${q[0].toFixed(0)} ${q[1].toFixed(0)}`;
  const hn = { lw: 'Left hand', rw: 'Right hand', B: 'Both hands' }, fn = { la: 'left foot', ra: 'right foot' };
  // the photo zooms to the climb: the box around every hand position, padded, kept at the frame's 9:16. Marks are sized for the
  // screen (zk), drawn as thin rings so the holds under them stay visible; the line is drawn only as far as the move you are on
  const hs = needHolds(B.x.img, r.color);
  const snap = p => { let o = null, bd = 55; hs.forEach(h => { const dd = Math.hypot(h.x - p[0], h.y - (p[1] - 12)); if (dd < bd) { bd = dd; o = h; } }); return o ? [o.x, o.y] : Object.assign([...p], { est: true }); };
  const P = B.steps.map(q => snap(q.pos)), S0 = B.steps[0].holds.map(snap), at = i => P[i];
  const ps = [...P.slice(1), ...S0], pad = 70;
  let x0 = Math.min(...ps.map(q => q[0])) - pad, x1 = Math.max(...ps.map(q => q[0])) + pad, y0 = Math.min(...ps.map(q => q[1])) - pad, y1 = Math.max(...ps.map(q => q[1])) + pad;
  let vw = x1 - x0, vh = y1 - y0; if (vw / vh < 9 / 16) vw = vh * 9 / 16; else vh = vw * 16 / 9;
  if (vw > 540) { vw = 540; vh = 960; }
  const vx = Math.max(0, Math.min(540 - vw, (x0 + x1 - vw) / 2)), vy = Math.max(0, Math.min(960 - vh, (y0 + y1 - vh) / 2)), zk = vw / 540, f = v => v.toFixed(1);
  const ring = (q, r, c, w, o = 1) => `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(r * zk)}" fill="none" stroke="${c}" stroke-width="${f(w * zk)}" opacity="${o}"${q.est ? ` stroke-dasharray="${f(4 * zk)} ${f(4 * zk)}"` : ''}/>`;
  const badge = (q, l) => `<circle cx="${f(q[0] + 20 * zk)}" cy="${f(q[1] - 20 * zk)}" r="${f(13 * zk)}" fill="#C2FF01" stroke="#111111" stroke-width="${f(2 * zk)}"/>
      <text x="${f(q[0] + 20 * zk)}" y="${f(q[1] - 20 * zk + 6 * zk)}" text-anchor="middle" font-size="${f(16 * zk)}" font-weight="800" fill="#111111">${l}</text>`;
  const svg = `<svg viewBox="${f(vx)} ${f(vy)} ${f(vw)} ${f(vh)}" aria-hidden="true">
      <image href="${WALL[B.x.img] || `${pic(B.x.img)}`}" x="0" y="0" width="540" height="960" style="filter:brightness(.9)"/>
      ${hs.map(h => `<circle cx="${f(h.x)}" cy="${f(h.y)}" r="${f(Math.max(h.r * .6 + 4, 9))}" fill="none" stroke="#FFFFFF" stroke-width="${f(1.6 * zk)}" stroke-dasharray="${f(3 * zk)} ${f(2.5 * zk)}" opacity=".85"/>`).join('')}
      ${bstep ? `<path d="M${P.slice(1, bstep + 1).map(q => `${f(q[0])} ${f(q[1])}`).join(' L')}" fill="none" stroke="#C2FF01" stroke-width="${f(2.5 * zk)}" stroke-dasharray="${f(6 * zk)} ${f(6 * zk)}" opacity=".8"/>` : ''}
      ${B.steps.map((q, i) => i && i !== bstep ? ring(at(i), 11, i < bstep ? '#C2FF01' : '#FFFFFF', 2, i < bstep ? .7 : .75) : '').join('')}
      ${st.feet.map(q => `<rect x="${f(q.pos[0] - 8 * zk)}" y="${f(q.pos[1] - 8 * zk)}" width="${f(16 * zk)}" height="${f(16 * zk)}" rx="${f(3 * zk)}" fill="none" stroke="#FFFFFF" stroke-width="${f(2.5 * zk)}"/>`).join('')}
      ${(bstep ? [[at(bstep), bstep]] : S0.map((h, m) => [h, m ? 'R' : 'L'])).map(([q, l]) => ring(q, 22, '#111111', 6, .35) + ring(q, 22, '#C2FF01', 3.5) + badge(q, l)).join('')}
    </svg>`;
  const feet = st.feet.map(q => fn[q.k]).filter((f, i, l) => f !== l[i - 1]), who = B.x.who === 'You' ? 'you' : B.x.who, whose = B.x.who === 'You' ? 'your' : `${B.x.who}’s`;
  const title = bstep ? moveSay(st) : 'Start: both hands on';
  const how = !bstep ? `Left hand on L, right hand on R: the first holds ${who} grabbed. The dashed circles are this route’s ${r.color.toLowerCase()} holds.`
    : `${feet.length > 2 ? `Walk your feet up first: ${n(st.feet.length, 'step', 'steps')}, the white squares. ` : feet.length ? `${feet.join(', then ').replace(/^./, c => c.toUpperCase())} first (the white ${feet.length > 1 ? 'squares' : 'square'}). ` : 'Feet stay where they are. '}${st.match ? 'Then bring this hand onto the hold the other one is on.' : st.size === 'long' ? 'Then reach: one of the longest moves on this climb.' : st.size === 'short' ? 'Then a short move to the next hold.' : 'Then reach for the next hold.'}`;
  const hands = N, foots = B.feet;
  // the beta came from somewhere else than the video you opened it from: say why
  const swap = B.ask && B.ask !== B.x ? `<p class="beta-caveat">${B.ask.who === 'You' ? 'You' : B.ask.who} didn’t top it on that video, so this is ${whose} send.</p>` : '';
  // your own try on this route, read the same way: how many moves, and the first one that went another way
  const myT = B.x.who === 'You' ? null : V.filter(q => q.who === 'You' && q.ri === scanRi).map(q => TRK[q.vid]).filter(Boolean).pop();
  // matches are compared out: the reaches between holds are what makes a line, so the first reach that differs is where you split
  const mine = myT && stepsOf(myT).steps, reach = s => s.map((q, i) => [q, i]).filter(([q, i]) => i && !q.match);
  const mR = mine && reach(mine), bR = reach(B.steps), k = mR ? mR.findIndex(([q], j) => bR[j] && (q.hand !== bR[j][0].hand || q.dir !== bR[j][0].dir)) : -1;
  const diff = k >= 0 && k < bR.length ? bR[k][1] : -1, myDiff = k >= 0 ? mR[k][0] : null;
  // your try as a row like the others: how many moves against this beta, and a tap goes straight to where you split
  const vsYou = mine ? `<button class="row" type="button" data-act="bgo" data-s="${diff > 0 ? diff : 0}"><span class="row-t"><strong>Your try: ${n(mine.length - 1, 'move', 'moves')}, ${who === 'you' ? 'this one' : who} ${N}</strong><span>${diff > 0 ? `You split at move ${diff}. Show it` : mine.length - 1 > N ? 'Same line, with extra moves' : 'Same line'}</span></span>${ic.arr('#111111')}</button>` : '';
  const vsLine = myDiff && diff > 0 ? `<p class="bsx-you">Here you split: your ${moveSay(myDiff).toLowerCase().replace(':', ' went').replace('reach ', '')}; ${who === 'you' ? 'you' : who}’s ${moveSay(B.steps[diff]).toLowerCase().replace(':', ' went').replace('reach ', '')}.</p>` : '';
  return { html: `
    ${bar(`Movement reference · ${rname(r)}`)}${swap}
    <div class="cam sc9">
      ${svg}
      <span class="pk-tag scan-tag">${sw(r)}${rname(r)} · ${hands} hand, ${foots} foot moves</span>
    </div>
    <section class="bsx">
      <div class="bsx-h"><span>${bstep ? `Move ${bstep} <em>/ ${N}</em>` : 'Before you start'}</span>
        <span class="bsx-ctl"><button type="button" data-act="bstep" data-d="-1" aria-label="Previous move"${bstep ? '' : ' disabled'}>‹</button><button type="button" data-act="bstep" data-d="1" aria-label="Next move"${bstep < N ? '' : ' disabled'}>›</button></span></div>
      <div class="bsx-prog">${B.steps.map((_, i) => `<button type="button" data-act="bgo" data-s="${i}" aria-label="${i ? `Move ${i}` : 'Start'}"${i === bstep ? ' class="on"' : i < bstep ? ' class="done"' : ''}></button>`).join('')}</div>
      <p class="bsx-t">${title}</p><p class="bsx-d">${how}</p>${bstep === diff ? vsLine : ''}
    </section>
    <div class="rows bsx-rows">
      <button class="row fr-p" type="button" data-act="fwatch" data-v="${B.x.i}"><span class="fr-f">${avatar(B.x.who)}</span><span class="row-t"><strong>${B.x.who === 'You' ? 'This is how you climbed it' : `This is how ${B.x.who} climbed it`}</strong><span>Topped in ${mmss(climbS(B.T))} · read from the video. Watch it</span></span>${ic.arr('#111111')}</button>${vsYou}
      <button class="row" type="button" data-act="to" data-to="route/${scanRi}"><span class="row-t"><strong>Other climbers on ${rname(r)}</strong><span>${n(peersOn(scanRi).length, 'video', 'videos')} · your own way may differ</span></span>${ic.arr('#111111')}</button>
    </div><div class="sc-end"></div>`,
    cta: betaOnly ? `<button class="b-lime" type="button" data-act="film">${ic.rec}Film a try on it</button>` : `<button class="b-ghost" type="button" data-act="rescan">Choose another</button><button class="b-lime" type="button" data-act="film">${ic.rec}Film a try on it</button>` };
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
setInterval(() => { if (session !== 'live') return; island(); ['lgclk', 'prclk', 'pnclk', 'hmclk'].forEach(id => { const l = $(id); if (l) l.textContent = clk(sesSecs()); }); }, 1000);
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
// "+" opens a bottom sheet styled after the sign-in popup in the team's references: a lime starburst badge with the
// mascot over its top edge, a lime wash behind the title, one row per way to add a try (sticker icon, what it is,
// a round go button), and a round × in the corner
function openAdd() {
  const v = nextRoll(), go = '<b class="add-go" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></b>';
  // one big tile for the way you'd most likely add a try (Film; Import once the sample tries are all filmed),
  // then three small tiles under it. A way you can't use right now sits in the small row, greyed, saying why.
  const opts = [
    { act: 'data-act="film"', k: 'k-lime', icon: ic.rec, t: 'Film', d: 'With your phone’s camera', tag: 'Best' },
    { act: 'data-act="upload"', k: 'k-orange', icon: ic.up, t: 'Import', d: 'A video from your camera roll' },
    { act: 'data-act="to" data-to="session"', k: 'k-white', icon: ic.pen, t: 'Log by hand', d: 'No video needed' },
    { act: 'data-act="scan"', k: 'k-ink', icon: ic.scan, t: 'Scan a wall', d: 'See a route\'s beta', tag: 'New' }];
  // a plain action sheet: title, then one row per way in. The first available one is lime; one that is off stays, greyed.
  const chev = '<svg class="ax-c" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
  const first = opts.find(o => !o.off);
  pane(`<div class="ax"><h2 class="ax-h">Add a try</h2>
    <div class="ax-l">${[...opts.filter(o => !o.off), ...opts.filter(o => o.off)].map(o => `<button class="ax-r${o === first ? ' ax-1' : ''}" type="button" ${o.off ? 'disabled' : o.act}>
      <i class="ax-i ${o.k}">${o.icon}</i><span class="ax-t"><strong>${o.t}${o.tag && !o.off ? `<em>${o.tag}</em>` : ''}</strong><span>${o.d}</span></span>${o.off ? '' : chev}</button>`).join('')}</div>
    </div>`);
}
/* ---------- Log by hand, by grade ---------- */
// routes get reset, so a climb you log by hand is logged by its grade, not by a route. One rock per grade:
// tap = Send, swipe up = Flash, swipe down = Project (not topped yet). The first one starts the session clock.
// Pick the gym (any of the five) and what you climbed there: only what that gym lists (ARC: Bouldering Cave and top rope)
const GR = ['5.6', '5.7', '5.8', '5.9', '5.10', '5.11', '5.12+'], VG = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8+'];
const glogs = []; // { ago, gy, ty, g, k }
const logDateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function loadGradeLogs() {
  try {
    const saved = JSON.parse(localStorage.getItem('spotter-grade-logs') || '[]');
    if (!Array.isArray(saved)) return;
    const now = new Date(), today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    saved.forEach(x => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(x.date || ''); if (!m || !gyms[x.gy] || !['Flash','Send','Project'].includes(x.k) || ![...GR,...VG].includes(x.g)) return; const ago = Math.floor((today - Date.UTC(+m[1], +m[2]-1, +m[3])) / 86400000); if (ago >= 0) glogs.push({ago,gy:x.gy,ty:x.ty,g:x.g,k:x.k,color:typeof x.color === 'string' && Object.hasOwn(HOLD_COLORS,x.color) ? x.color : '',attempts:Math.max(1, Math.min(99, +x.attempts || 1))}); });
  } catch (_) { /* Keep the log usable if browser storage is unavailable. */ }
}
function saveGradeLogs() { try { localStorage.setItem('spotter-grade-logs', JSON.stringify(glogs.map(x => ({...x, date: logDateKey(dateOf(x.ago))})))); return true; } catch (_) { return false; } }
loadGradeLogs();
const gday = ago => glogs.filter(x => x.ago === ago), gsent = x => x.k !== 'Project';
const gord = g => VG.includes(g) ? VG.indexOf(g) : 100 + GR.indexOf(g);
const gline = xs => [...VG, ...GR].map(g => [g, xs.filter(x => x.g === g).length]).filter(([, k]) => k).map(([g, k]) => k > 1 ? `${g} ×${k}` : g).join(', ');
const gwhere = xs => [...new Set(xs.map(x => gyms[x.gy].name))].join(', ');
const kinds = g => [...(g.has.some(h => /boulder/i.test(h)) ? ['Boulder'] : []), ...(g.has.some(h => /top rope/i.test(h)) ? ['Top rope'] : [])];
// shown labels: "Send" here is a climb (完攀), not the Send button under comments (发送), so it carries an invisible word joiner
const KL = { Flash: 'Flash', Send: 'Send⁠', Project: 'Project' };
// the gym you're at today: chosen once in either flow (film or log by hand), offered in both until midnight
const TODAY_GYM_KEY = 'spotter-today-gym';
function todayGym() {
  try { const t = JSON.parse(localStorage.getItem(TODAY_GYM_KEY) || 'null');
    return t && t.d === new Date().toDateString() && gyms[t.i] ? t.i : null; } catch { return null; }
}
function setTodayGym(i) { try { localStorage.setItem(TODAY_GYM_KEY, JSON.stringify({ i, d: new Date().toDateString() })); } catch {} }
let glGym = null, glTy = 'Top rope', glOpen = false, glHit = null, glGrade = null, glResult = null, glStep = 0, glAttempts = 1, glColor = '';
let glLocation = 'idle', glPosition = null, glGymChosen = false;
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
  glogs.push({ ago: 0, gy: glGym, ty: glTy, g, k, color: glColor, attempts: glAttempts }); glHit = g; render(); toast(`${g} · ${KL[k]}`);
  setTimeout(() => { glHit = null; document.querySelector('.gb.hit')?.classList.remove('hit'); }, 450);
}
function glDistance(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180, dLat = (lat2-lat1)*rad, dLon = (lon2-lon1)*rad;
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(dLon/2)**2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(Math.min(1,h)));
}
function glNearby() {
  return gyms.map((g,i) => { const [lat,lon] = gymLL(g); return {g,i,dist:glPosition ? glDistance(glPosition.lat,glPosition.lon,lat,lon) : null}; }).sort((a,b) => glPosition ? a.dist-b.dist : a.i-b.i);
}
function glLocate() {
  if (!navigator.geolocation) { glLocation = 'unavailable'; if (page === 'session' || page === 'logc') render(); return; }
  glLocation = 'loading';
  navigator.geolocation.getCurrentPosition(pos => {
    glPosition = {lat:pos.coords.latitude,lon:pos.coords.longitude,accuracy:pos.coords.accuracy}; glLocation = 'ready';
    const nearest = glNearby()[0];
    if (!glGymChosen && nearest && nearest.dist <= .1 && pos.coords.accuracy <= 160) { glGym = nearest.i; }
    if (page === 'session' || page === 'logc') { render(); if (($('ask').classList.contains('show') && $('gl-gym-search')) || (glGym === null && !$('ask').classList.contains('show'))) openGymPick(); }
  }, () => { glLocation = 'unavailable'; if (page === 'session' || page === 'logc') { render(); if (($('ask').classList.contains('show') && $('gl-gym-search')) || (glGym === null && !$('ask').classList.contains('show'))) openGymPick(); } }, {enableHighAccuracy:true,timeout:8000,maximumAge:60000});
}
function openGymPick(context = 'gl') {
  const sel = context === 'cam' ? camGym : clipOf(context) ? clipPick(clipOf(context)).gy : glGym;
  const entries = glNearby();
  const help = glLocation === 'loading' ? 'Finding your location…' : glPosition ? 'Distances use approximate map locations. Please confirm your gym.' : 'Location unavailable. Search or choose a gym below.';
  pane(`<div class="gl-picker"><h2>Choose a gym</h2><p>${help}</p><label class="gl-picker-search">${ic.search || ''}<input id="gl-gym-search" type="search" placeholder="Search gyms or cities" aria-label="Search gyms or cities"></label><button class="gl-locate" type="button" data-act="gllocate">${ic.pin} ${glLocation === 'loading' ? 'Locating…' : 'Use my location'}</button><h3>${glPosition ? 'Nearby gyms' : 'Available gyms'}</h3><div class="rows gl-picker-rows">${entries.map(({g,i,dist}) => `<button class="row" type="button" data-act="glgy" data-context="${context}" data-i="${i}" data-search="${(g.name+' '+g.addr).toLowerCase()}" aria-pressed="${i === sel}">${g.img ? `<img class="ss-th gl-gth" src="${pic(g.img)}" alt="">` : ''}<span class="row-t"><strong>${g.name}</strong><span>${g.addr}${dist === null ? '' : ` · ~${dist < 1 ? dist.toFixed(1) : Math.round(dist)} mi`}</span></span>${i === sel ? ic.check : ''}</button>`).join('')}</div><p id="gl-gym-empty" hidden>No matching gyms.</p></div>`);
  const input = $('gl-gym-search'); input.addEventListener('input', () => { const q = input.value.trim().toLowerCase(); let found = 0; document.querySelectorAll('.gl-picker-rows .row').forEach(row => { const match = row.dataset.search.includes(q); row.hidden = !match; if (match) found++; }); $('gl-gym-empty').hidden = found > 0; });
}
function viewSession() {
  if (glGym === null && todayGym() !== null) { glGym = todayGym(); glGymChosen = true; }
  const es = gday(0), G = gyms[glGym], tys = G ? kinds(G) : ['Boulder', 'Top rope'];
  if (!tys.includes(glTy)) { glTy = tys[tys.length - 1]; glGrade = null; }
  const grades = glTy === 'Boulder' ? VG : GR;
  const header = `<div class="bar"><button class="bk" type="button" data-act="glback" aria-label="Back">${ic.back}</button><span>Log by hand</span></div>`;
  const wall = `<div class="gl-map"><svg viewBox="0 0 340 460" aria-label="Choose a climbing grade"><defs><pattern id="gldot" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="17" cy="17" r="1.6" fill="rgba(17,17,17,.12)"/></pattern></defs><rect width="340" height="460" fill="url(#gldot)"/>${PEB.map(([x,y,rx,ry],i) => `<path class="peb" d="${rock(x,y,rx,ry,i*2.1+1)}"/>`).join('')}${grades.slice().reverse().map((g,i) => { const [x,y,rx,ry] = GB[g]; return `<g class="gb${glGrade === g ? ' selected' : ''}" data-g="${g}" role="button" tabindex="0" aria-label="${g}" aria-pressed="${glGrade === g}"><path d="${rock(x,y,rx,ry,i*1.7+.4)}"/><text x="${x}" y="${y+11}">${g}</text></g>`; }).join('')}</svg></div>`;
  const list = glogs.map((x,i) => [x,i]).filter(([x]) => x.ago === 0).reverse().map(([x,i]) => `<div class="log-entry"><div class="log-entry-main"><span class="log-entry-grade">${x.g}</span><span><strong>${x.ty}</strong><small>${gyms[x.gy].name}</small></span><button type="button" data-act="gldel" data-i="${i}" aria-label="Remove ${x.g}">×</button></div><div class="log-entry-results" aria-label="Change result">${['Flash','Send','Project'].map(k => `<button type="button" data-act="glk" data-i="${i}" data-k="${k}" aria-pressed="${x.k === k}">${KL[k]}</button>`).join('')}</div></div>`).join('');
  const first = `<div class="log-step-title"><h1>Pick your climb<span>✦</span></h1></div><button class="rock-gym" type="button" data-act="glgym">${ic.pin}<span>${G ? G.name + (!glGymChosen && glPosition ? ' · estimated' : '') : glLocation === 'loading' ? 'Finding your gym…' : 'Choose a gym'}</span><b>⌄</b></button><div class="rock-types">${tys.map(r => `<button type="button" data-act="glrope" data-v="${r}" aria-pressed="${glTy === r}">${r}</button>`).join('')}</div><div class="rock-wall">${wall}<p>${glGrade ? `<b>${glGrade}</b> selected` : 'Tap a hold to select your grade'}</p></div>`;
  const second = `<div class="log-step-title"><h1>How did it go?<span>✦</span></h1></div><div class="log-climb-summary"><span class="log-entry-grade">${glGrade || ''}</span><div><strong>${glTy}</strong><small>${G?.name || ''}</small></div><button type="button" data-act="glback">Edit</button></div><button class="manual-color" type="button" data-act="glcolor"><span>${glColor ? `<i style="--hold:${HOLD_COLORS[glColor]}"></i>${glColor}` : 'Choose hold colour'}</span><b>⌄</b></button><div class="log-outcomes">${[['Flash','Finished on your first try','✦'],['Send','Finished after more than one try','✓'],['Project','Still working on it','↗']].map(([k,desc,icon]) => `<button type="button" data-act="glresult" data-k="${k}" aria-pressed="${glResult === k}"><span class="log-outcome-icon">${icon}</span><span><strong>${KL[k]}</strong><small>${desc}</small></span><i aria-hidden="true">${glResult === k ? '✓' : ''}</i></button>`).join('')}</div><div class="log-attempts"><span><strong>Attempts</strong><small>How many tries for this climb?</small></span><button type="button" data-act="glattempt" data-d="-1" aria-label="Fewer attempts">−</button><b>${glAttempts}</b><button type="button" data-act="glattempt" data-d="1" aria-label="More attempts">＋</button></div>`;
  const third = `<div class="log-step-title"><h1>Your session<span>✦</span></h1></div><div class="log-today-head"><h2>Today’s climbs</h2><span>${n(es.length,'climb','climbs')}</span></div>${es.length ? list : '<p class="log-empty">No climbs added yet.</p>'}<button class="log-another" type="button" data-act="glanother"><span>＋</span> Add another climb</button>`;
  const cta = glStep === 0 ? `<button class="b-lime" type="button" data-act="glnext"${glGrade && G ? '' : ' disabled'}>Continue${glGrade ? ` · ${glGrade}` : ''}</button>` : glStep === 1 ? `<button class="b-lime" type="button" data-act="glconfirm"${glResult && glColor ? '' : ' disabled'}>Add climb</button>` : `<button class="b-lime" type="button" data-act="glsave"${es.length ? '' : ' disabled'}>Save session${es.length ? ` · ${n(es.length,'climb','climbs')}` : ''}</button>`;
  return { html: header + `<div class="rock-log log-wizard">${glStep === 0 ? first : glStep === 1 ? second : third}</div>`, cta, after: () => { if (glLocation === 'idle') glLocate(); document.querySelectorAll('.gb').forEach(el => { const select = () => { glGrade = el.dataset.g; render(); }; el.addEventListener('click', select); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } }); }); } };
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
    return `<div class="row">${c ? `<button class="ss-open" type="button" data-act="to" data-to="clip/${c.id}" aria-label="Open the analysis of ${rname(e.r)}"><img src="${pic(c.img)}" alt=""></button>` : ''}<span class="row-t"><strong>${sw(e.r)}${rname(e.r)}</strong><span>${e.sent ? e.style : n(e.tries, 'attempt', 'attempts')} · ${e.cs.length ? `${n(e.cs.length, 'video', 'videos')} · tap the picture for the analysis` : 'logged by hand'}</span></span>
      <button class="vis${hid ? ' off' : ''}" type="button" data-act="shide" data-i="${e.ri}" aria-pressed="${hid}">${hid ? `${ic.eyeOff}Hidden` : `${ic.eye}Public`}</button></div>`; };
  // what today's videos lead to. Climbs logged by hand have no video, so nothing to analyse or put on a poster
  const vids = clips.filter(c => agoOf(c) === 0), done = vids.filter(c => c.an === 'done' && c.track), sent = vids.filter(topOf);
  const look = done.find(topOf) || done[done.length - 1], pc = sent[sent.length - 1] || vids[vids.length - 1];
  const thumb = c => `<img class="ss-th" src="${pic(c.img)}" alt="">`;
  const next = vids.length ? `<div class="hl2 dk2"><h2>From today’s videos</h2></div>
    <div class="rows">
      ${look ? `<button class="row ss-just" type="button" data-act="to" data-to="clip/${look.id}">${thumb(look)}<span class="row-t"><strong>Look at your analysis</strong><span>${rname(ROUTES[look.ri])} · try ${tryOf(look)} · ${n(look.track.stats.moves, 'move', 'moves')}</span></span>${ic.arr('#111111')}</button>` : ''}
      <button class="row ss-just" type="button" data-act="share" data-i="${pc.id}">${thumb(pc)}<span class="row-t"><strong>${topOf(pc) ? 'Share your send' : 'Share your progress'}</strong><span>As a poster · ${rname(ROUTES[pc.ri])}</span></span>${ic.arr('#111111')}</button>
      ${sent.length ? `<button class="row ss-just" type="button" data-act="reel" data-day="0">${thumb(sent[0])}<span class="row-t"><strong>Today’s highlight reel</strong><span>${n(sent.length, 'send', 'sends')} · ${sent.length * 8} seconds</span></span>${ic.arr('#111111')}</button>` : ''}
    </div>` : es.length || gd.length ? '<p class="cap">Everything today was logged by hand. Film a try next time and it gets an analysis and a poster.</p>' : '';
  return { photo: 'gym-arc-3', html: `
    <div class="sm-hd">${MASC}<span class="stk o sm-stk">${SPK}${allS ? `${n(allS, 'send', 'sends')}!` : 'Saved!'}</span></div>
    <h1 class="hl tab">Session saved</h1>
    <p class="sub-w">${es.length || !gd.length ? gym.name : gwhere(gd)} · ${dateOf(0).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
    <section class="glass trio sm-card"><div><b class="num">${clk(sesDur)}</b><span>time</span></div><div><b class="num">${allT}</b><span>${allT === 1 ? 'try' : 'tries'}</span></div><div><b class="num">${allS}</b><span>${allS === 1 ? 'send' : 'sends'}</span></div></section>
    ${best ? `<div class="sm-best"><span>Hardest send</span><b>${best[1]}</b></div>` : ''}
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
    `${tb('Climb 1')}<span class="aw-b"><svg class="aw-ring" viewBox="0 0 150 150"><circle cx="75" cy="75" r="62" stroke="rgba(194,255,1,.22)"/><circle cx="75" cy="75" r="62" stroke="#C2FF01" stroke-linecap="round" stroke-dasharray="389.6" stroke-dashoffset="130" transform="rotate(-90 75 75)"/></svg><span class="aw-n">Saved · 0:44<br>Reading it on your phone</span></span>`,
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
    <div class="poster"><img src="${pic(c.img)}" alt=""><span class="shade"></span><span class="po-brand">Spotter</span>
      <span class="po-b"><span class="pk-tag">${sw(r)}${rname(r)}</span><b>${topOf(c) ? 'Topped' : T ? `${T.stats.moves} moves` : 'On the wall'}</b><span>try ${tryOf(c)} · ${gymName(c)} · ${dayLabel(agoOf(c))}</span></span></div>
    ${shareBtns()}`);
}
function openReel(day) {
  const s = clips.filter(c => topOf(c) && (day == null || agoOf(c) === day));
  pane(`<h2>${day === 0 ? 'Today’s highlight reel' : 'Your highlight reel'}</h2><span class="sub">${n(s.length, 'send', 'sends')} · ${s.length * 8} seconds · labels added for you</span>
    <div class="reel">${s.map(c => `<span class="rl"><img src="${pic(c.img)}" alt=""><span class="pk-tag">${sw(ROUTES[c.ri])}${rname(ROUTES[c.ri])}</span><em>${gymName(c)} · ${dayLabel(agoOf(c))}</em></span>`).join('')}</div>
    <p class="hint">Each send plays for 8 seconds, from its last move to the top.</p>
    ${shareBtns()}`);
}

/* ---------- Export: your log as a CSV file ---------- */
function exportLog() {
  const rows = [['date', 'gym', 'route', 'grade', 'attempts', 'sent', 'style', 'videos']];
  logDays().slice().reverse().forEach(d => gday(d).forEach(x => rows.push([dateOf(d).toISOString().slice(0, 10), gyms[x.gy].name, '', x.g, 1, gsent(x) ? 'yes' : 'no', `${x.k} · ${x.ty}`, ''])) || dayLog(d).forEach(e => rows.push([dateOf(d).toISOString().slice(0, 10), gym.name, e.r.color, e.r.grade, e.tries, e.sent ? 'yes' : 'no', e.style, e.cs.map(c => `${vsrc(V[c.v].vid)}`).join(' ')])));
  const csv = rows.map(r => r.map(x => /[",\s]/.test(String(x)) ? `"${String(x).replace(/"/g, '""')}"` : x).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'spotter-log.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`spotter-log.csv · ${n(rows.length - 1, 'row', 'rows')}`);
}

/* ---------- Friends: who you follow, sessions you plan together, who's free ---------- */
const invitedFriends = JSON.parse(localStorage.getItem('spotter-invited-friends') || '[]');
invitedFriends.forEach(name => { if (!PEOPLE.includes(name)) PEOPLE.push(name); });
let savedFollows = null; try { const f = JSON.parse(localStorage.getItem('spotter-following')); if (Array.isArray(f)) savedFollows = f; } catch (_) {}
const follows = new Set(savedFollows || [...(user === 'regular' ? ['Noor', 'Leo'] : []), ...invitedFriends]);
// sample: the days each person is free, counted from today, and how long they've climbed
const FREE = { Noor: [1, 3], Leo: [1, 4], Sam: [2, 5], Kai: [0, 6], Mia: [3] };
const YRS = { Noor: '5–10 years', Sam: 'over 10 years', Leo: '1–2 years', Kai: 'over 10 years', Mia: '2–5 years' };
// sessions planned at real gyms: g = gym, d = days from today, h = hour, who = who's going (you join by tapping)
const plans = user === 'regular' ? [{ by: 'Noor', g: 0, d: 1, h: 18, who: ['Noor', 'Leo'] }] : [];
// ?scene=live|done|plan: open Home in that scene (for demos and reviews)
{ const sc = params.get('scene'), h = new Date().getHours();
  if (sc === 'live') { session = 'live'; lgStart = Date.now() - 38 * 60000; }
  if (sc === 'done') sesDur = 62 * 60;
  if (sc === 'plan') plans.unshift({ by: 'You', g: 0, d: 0, h: Math.min(h + 2, 21), who: ['You', 'Noor', 'Leo'] }); }
const dayName = d => d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(new Date().getDay() + d) % 7];
const names = ws => ws.length < 3 ? ws.join(' and ') : `${ws.slice(0, -1).join(', ')} and ${ws[ws.length - 1]}`;
const feedTabs = mode => `<nav class="tok-tabs feed-tabs" aria-label="Community">${[['all','For you','friends'],['following','Following','friends/following'],['friends','Friends','friends/friends']].map(([key,label,to]) => `<button type="button" data-act="feedmode" data-to="${to}"${mode === key ? ' aria-current="page"' : ''}>${label}</button>`).join('')}</nav>`;
function viewFriendsPlan() {
  const fr = [...invitedFriends];
  const row = `<div class="fr-row">${fr.map(w => `<button type="button" data-act="to" data-to="person/${w}"><span class="fr-f">${avatar(w)}</span><span>${w}</span></button>`).join('')}
      <button type="button" data-act="fadd"><span class="fr-f fr-add">${ic.plus}</span><span>Add</span></button></div>`;
  const ps = plans.filter(p => p.by === 'You' || fr.includes(p.by));
  const card = p => { const k = plans.indexOf(p), g = gyms[p.g], me = p.who.includes('You'), oth = p.who.filter(w => w !== 'You');
    return `<div class="pl">${g.img ? `<img src="${pic(g.img)}" alt="">` : `<span class="gt-placeholder" aria-hidden="true">${ic.pin}</span>`}
      <span class="row-t"><strong>${dayName(p.d)} · ${clock(p.h)}</strong><span>${g.name}</span>
        <span class="pl-who"><span class="pl-avs">${p.who.map(w => `<i>${avatar(w)}</i>`).join('')}</span>${p.by === 'You' ? (oth.length ? `You planned · ${names(oth)} invited` : 'You planned it') : `${names(oth)} ${oth.length > 1 ? 'are' : 'is'} going`}</span></span>
      <button class="pj pl-detail" type="button" data-act="pldetail" data-i="${k}">Details</button>${p.by === 'You' ? `<button class="pj" type="button" data-act="plx" data-i="${k}">Cancel</button>` : `<button class="pj${me ? ' on' : ''}" type="button" data-act="pljoin" data-i="${k}" aria-pressed="${me}">${me ? 'Going' : 'Join'}</button>`}</div>`; };
  const theirs = V.filter(x => fr.includes(x.who)).sort((a, b) => a.ago - b.ago);
  const vids = theirs.length ? `<div class="vg">${theirs.map(x => `<button class="vt" type="button" data-act="pvid" data-v="${x.i}" aria-label="Watch ${x.who} on ${rname(ROUTES[x.ri])}">
      <img src="${pic(x.img)}" alt="" loading="lazy"><span class="shade"></span><span class="vt-t">${sw(ROUTES[x.ri])}${rname(ROUTES[x.ri])}</span><span class="vt-b">${x.who} · ${dayLabel(x.ago)}</span></button>`).join('')}</div>`
    : `<p class="cap">${fr.length ? 'Your friends haven’t posted a climb yet.' : 'Climbs your friends post show up here.'}</p>`;
  return { photo: 'gym-arc-1', html: `
    <div class="tok-top lt-top"><span class="tok-add-sp" aria-hidden="true"></span>${feedTabs('friends')}<button class="av sm" type="button" data-act="to" data-to="profile" aria-label="Your profile">${avatar('You')}</button></div>
    <div class="fold"></div>
    <div class="hl2 dk2"><h2>Friends</h2>${fr.length ? `<span class="hint2">${n(fr.length, 'friend', 'friends')}</span>` : ''}</div>
    ${fr.length ? '' : '<div class="fr-first"><strong>Climb with friends</strong><p>Add a friend to plan sessions together, join theirs and see their climbs.</p><button class="b-lime" type="button" data-act="fadd">Add a friend</button></div>'}
    ${fr.length ? row : ''}
    <div class="hl2 dk2"><h2>Upcoming plans</h2><button class="gy-mapb" type="button" data-act="plan">Create plan</button></div>
    <div class="pls">${ps.length ? ps.slice().sort((a, b) => a.d - b.d || a.h - b.h).map(card).join('') : `<p class="cap">No plans yet. Create a plan so friends can join.</p>`}</div>
    <div class="hl2 dk2"><h2>Friends’ climbs</h2>${theirs.length ? `<span class="hint2">${n(theirs.length, 'video', 'videos')}</span>` : ''}</div>
    ${vids}
` };
}
let inviteStream = null;
function stopInviteCamera() {
  if (inviteStream) inviteStream.getTracks().forEach(track => track.stop());
  inviteStream = null;
}
function openFriendAdd() {
  stopInviteCamera();
  pane(`<h2>Add friends</h2><span class="sub">Connect with an invitation</span>
    <div class="friend-invite-actions"><button class="b-lime" type="button" data-act="invitescan">Scan a QR code</button><button class="b-ghost" type="button" data-act="inviteshare">Show my invite</button></div>
    <form id="invite-paste"><label for="invite-url">Have an invite link?</label><div class="plan-message-row"><input id="invite-url" type="url" required placeholder="Paste invite link"><button class="pj" type="submit">Open</button></div></form>
    <p class="hint">Invitations are stored on this device in this prototype.</p>`);
  $('invite-paste').addEventListener('submit', e => { e.preventDefault(); openInviteUrl($('invite-url').value); });
}
function inviteUrl() {
  let id = localStorage.getItem('spotter-invite-id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('spotter-invite-id', id); }
  const url = new URL(location.href);
  url.searchParams.set('invite', id);
  url.searchParams.set('name', 'Climber');
  url.hash = '/friends/friends';
  return url.href;
}
function showInvite() {
  const url = inviteUrl();
  pane(`<h2>Your invitation</h2><span class="sub">Share this code or link with a friend.</span><div id="invite-qr" aria-label="Your invitation QR code"></div><label for="invite-share-link">Invitation link</label><input id="invite-share-link" readonly value="${esc(url)}"><button class="b-lime invite-copy" type="button" data-act="invitecopy">Copy invite link</button><p class="hint">A localhost link works only on this device. A shared hosted address is needed to invite another device.</p>`);
  if (window.QRCode) new QRCode($('invite-qr'), { text: url, width: 180, height: 180, correctLevel: QRCode.CorrectLevel.M });
  else $('invite-qr').textContent = 'QR code unavailable. You can copy the link below.';
}
function openInviteUrl(value) {
  try {
    const url = new URL(value, location.href);
    if (url.origin !== location.origin || !url.searchParams.get('invite')) throw new Error('invalid');
    stopInviteCamera();
    location.href = url.href;
  } catch (_) { toast('Enter a valid Spotter invitation link'); }
}
async function scanInvite() {
  if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
    toast('QR scanning is unavailable here. Paste the invitation link instead.'); return;
  }
  pane(`<h2>Scan a QR code</h2><span class="sub">Point your camera at your friend’s invitation.</span><video id="invite-camera" autoplay playsinline muted></video><button class="b-ghost invite-copy" type="button" data-act="fadd">Back</button>`);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    if (!$('invite-camera')) { stream.getTracks().forEach(track => track.stop()); return; }
    inviteStream = stream; const video = $('invite-camera'); video.srcObject = stream;
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    const scan = async () => {
      if (!inviteStream || !video.isConnected || !$('ask').classList.contains('show')) { stopInviteCamera(); return; }
      try { const codes = await detector.detect(video); if (codes.length) { openInviteUrl(codes[0].rawValue); return; } } catch (_) {}
      setTimeout(scan, 350);
    };
    video.addEventListener('playing', scan, { once: true });
  } catch (_) { stopInviteCamera(); openFriendAdd(); toast('Camera unavailable. Paste the invitation link instead.'); }
}
function showIncomingInvite() {
  const id = params.get('invite');
  if (!id || !/^[a-f0-9-]{36}$/i.test(id)) return;
  if (id === localStorage.getItem('spotter-invite-id')) { toast('This is your own invitation'); return; }
  pane(`<h2>Friend invitation</h2><span class="sub">A climber invited you to connect.</span><button class="b-lime invite-copy" type="button" data-act="inviteaccept">Add friend</button><button class="b-ghost invite-copy" type="button" data-act="invitereject">Not now</button>`);
}
function clearInviteUrl() {
  const url = new URL(location.href); url.searchParams.delete('invite'); url.searchParams.delete('name'); history.replaceState(null, '', url.href);
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
    <p class="fr-h">Where</p><div class="fchips">${gyms.map((x, i) => [x, i]).map(([x, i]) => chip('plg', i, x.name, i === pd.g)).join('')}</div>
    <p class="fr-h">When</p><div class="fchips">${[0, 1, 2, 3, 4, 5, 6].map(d => chip('pld', d, dayName(d), d === pd.d)).join('')}</div>
    <div class="fchips pl-t">${times.length ? times.map(h => chip('plh', h, clock(h), h === pd.h)).join('') : `<span class="cap">${g.name} is closed that day.</span>`}</div>
    ${follows.size ? `<p class="fr-h">Ask</p><div class="fr-row sm">${[...follows].map(w => `<button type="button" data-act="plw" data-w="${w}" aria-pressed="${pd.who.has(w)}"><span class="fr-f">${avatar(w)}</span><span>${w}</span></button>`).join('')}</div>` : ''}
    <div class="two one"><button class="b-lime" type="button" data-act="plgo"${pd.h === null ? ' disabled' : ''}>Post plan</button></div>`);
}
function planDetails(i) {
  const p = plans[i];
  if (!p) return;
  const g = gyms[p.g];
  const notes = p.notes || [];
  pane(`<h2>${esc(g.name)}</h2><span class="sub">${dayName(p.d)} · ${clock(p.h)}</span>
    <p class="fr-h">Going</p><p>${esc(names(p.who))}</p>
    <p class="fr-h">Messages</p><div class="plan-messages">${notes.length ? notes.map(note => `<p><strong>${esc(note.by)}</strong> ${esc(note.text)}</p>`).join('') : '<p class="cap">No messages yet.</p>'}</div>
    <form id="plan-message-form"><label for="plan-message">Message</label><div class="plan-message-row"><input id="plan-message" maxlength="240" required placeholder="Add a message"><button class="pj" type="submit">Send</button></div></form>
    <div class="two one">${p.by === 'You' ? `<button class="b-ghost" type="button" data-act="plcanceldetail" data-i="${i}">Cancel plan</button>` : `<button class="b-lime" type="button" data-act="pljoindetail" data-i="${i}">${p.who.includes('You') ? 'Leave plan' : 'Join plan'}</button>`}</div>`);
  $('plan-message-form').addEventListener('submit', e => {
    e.preventDefault();
    const text = $('plan-message').value.trim();
    if (!text) return;
    (p.notes ||= []).push({ by: 'You', text });
    planDetails(i);
  });
}
const moreActions = {
  gymaps: b => {
    const g = gyms[+b.dataset.i];
    if (!g) return;
    const destination = encodeURIComponent(`${g.name}, ${g.addr}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank', 'noopener,noreferrer');
  },
  gyr: b => { gymR = +b.dataset.v; gymPin = null; render(); },
  // logging and the session
  rtry: b => { const ri = +b.dataset.r; lgClock(); logOf(0, ri).tries++; render(); toast(`${rname(ROUTES[ri])} · attempt ${dayLog(0).find(e => e.ri === ri).tries} today`); },
  rsend: b => openSheet(+b.dataset.r),
  scan: () => { closeAll(); betaOnly = false; betaV = null; scanShot = false; bstep = 0; scanURL = ''; scanCv = null; scanPick = null; scanErr = ''; scanRi = ROUTES.findIndex((r, i) => V.some(x => x.who === 'Leo' && x.ri === i) && !mineOn(i).some(topOf)); if (scanRi < 0) scanRi = 0; go('scan'); },
  scanri: b => { scanRi = +b.dataset.i; render(); },
  rbeta: b => { betaOnly = true; betaV = b.dataset.v != null ? +b.dataset.v : null; scanRi = +b.dataset.r; scanShot = true; bstep = 0; go('scan'); },
  snap: () => { scanShot = true; bstep = 0; render(); },
  rescan: () => { scanShot = false; render(); },
  scansnap: () => { const v = $('scv'); if (!v || !v.videoWidth) return; scanTake(v, v.videoWidth, v.videoHeight); },
  scanphotos: () => scanPhotos(),
  scancolor: b => scanColor(b.dataset.k),
  scanretake: () => { scanURL = ''; scanCv = null; scanPick = null; scanFound = []; render(); },
  scantry: () => { scanErr = ''; scanStop(); render(); },
  scango: () => { if (!scanPick || scanPick.ri < 0) return; scanRi = scanPick.ri; scanShot = true; bstep = 0; render(); },
  bgo: b => { const y = document.querySelector('.screen').scrollTop; bstep = +b.dataset.s; render(); document.querySelector('.screen').scrollTop = y; },
  bstep: b => { const B = betaOf(scanRi, betaV); if (!B) return; bstep = Math.max(0, Math.min(B.steps.length - 1, bstep + +b.dataset.d)); const y = document.querySelector('.screen').scrollTop; render(); document.querySelector('.screen').scrollTop = y; },
  glopen: () => { glOpen = !glOpen; render(); },
  glrope: b => { glTy = b.dataset.v; glGrade = null; render(); },
  glgrade: b => { glGrade = b.dataset.g; render(); },
  glcolor: () => openHoldColors('manual'),
  glresult: b => { glResult = b.dataset.k; if (glResult === 'Flash') glAttempts = 1; render(); },
  glattempt: b => { glAttempts = Math.max(1, Math.min(99, glAttempts + +b.dataset.d)); if (glAttempts > 1 && glResult === 'Flash') glResult = null; render(); },
  glnext: () => { if (glGrade && glGym !== null) { glStep = 1; document.querySelector('.screen').scrollTop = 0; render(); } },
  glconfirm: () => { if (glGrade && glResult && glColor) { glStep = 2; document.querySelector('.screen').scrollTop = 0; glAdd(glGrade, glResult); } },
  glanother: () => { glStep = 0; glGrade = null; glResult = null; glAttempts = 1; glColor = ''; document.querySelector('.screen').scrollTop = 0; render(); },
  glback: () => { if (glStep) { glStep--; document.querySelector('.screen').scrollTop = 0; render(); } else { actions.back(); } },
  gladd: () => { if (glGrade) glAdd(glGrade, glResult); },
  glgym: () => openGymPick(),
  gllocate: () => { const cam = page === 'cam'; glLocate(); openGymPick(cam ? 'cam' : 'gl'); },
  glgy: b => { const i = +b.dataset.i; setTodayGym(i); const cc = clipOf(b.dataset.context); if (cc) { setPick(cc, 'gy', i); return; } if (b.dataset.context === 'cam') camGym = i; else { glGym = i; glGymChosen = true; } closeAll(); render(); },
  glk: b => { const x = glogs[+b.dataset.i]; x.k = b.dataset.k; if (x.k === 'Flash') x.attempts = 1; render(); },
  gldel: b => { const [x] = glogs.splice(+b.dataset.i, 1); if (!gday(0).length) glOpen = false; render(); toast(`Removed · ${x.g} · ${KL[x.k]}`); },
  glundo: () => { const i = glogs.map(x => x.ago).lastIndexOf(0); if (i < 0) return; const [x] = glogs.splice(i, 1); if (!gday(0).length) glOpen = false; render(); toast(`Removed · ${x.g} · ${KL[x.k]}`); },
  glsave: () => { glOpen = false; glStep = 0; glGrade = null; glResult = null; const saved = saveGradeLogs(); closeAll(); go('videos'); toast(saved ? 'Climbs saved' : 'Climbs kept for this session only'); },
  glrecord: b => { const x = glogs[+b.dataset.i]; if (!x) return; pane(`<div class="manual-detail manual-detail-v2"><div class="manual-detail-head"><span class="manual-detail-grade">${x.g}</span><div><small>CLIMB DETAILS</small><h2>${x.ty}</h2><p>${x.k} · ${n(x.attempts || 1, 'attempt', 'attempts')}</p></div></div><div class="manual-detail-rows"><div><span>Grade</span><strong>${x.g}</strong></div><div><span>Route colour</span><strong>${x.color ? `<i style="--hold:${HOLD_COLORS[x.color]}"></i>${x.color}` : 'Not recorded'}</strong></div><div><span>Gym</span><strong>${gyms[x.gy].name}</strong></div><div><span>Date</span><strong>${dayLabel(x.ago)}</strong></div></div><small>Logged by hand</small></div>`); },
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
  gtsel: b => gtSelect(+b.dataset.i, 'row'),
  shsave: () => { closeAll(); toast('Saved to Photos'); },
  shsend: () => { closeAll(); toast(follows.size ? `Sent to ${[...follows].slice(0, 2).join(' and ')}` : 'Link copied · paste it anywhere'); },
  // friends
  fadd: () => openFriendAdd(),
  inviteshare: () => showInvite(),
  invitescan: () => scanInvite(),
  invitecopy: async () => { const input = $('invite-share-link'); try { await navigator.clipboard.writeText(input.value); toast('Invite link copied'); } catch (_) { input.focus(); input.select(); toast('Select and copy the link'); } },
  inviteaccept: () => { const id = params.get('invite'); let name = 'Climber ' + id.slice(0, 4).toUpperCase(); const saved = JSON.parse(localStorage.getItem('spotter-invited-friends') || '[]'); if (!saved.includes(name)) saved.push(name); localStorage.setItem('spotter-invited-friends', JSON.stringify(saved)); if (!PEOPLE.includes(name)) PEOPLE.push(name); follows.add(name); if (!invitedFriends.includes(name)) invitedFriends.push(name); try { localStorage.setItem('spotter-following', JSON.stringify([...follows])); } catch (_) {} clearInviteUrl(); closeAll(); go('friends/plan'); toast('Friend added'); },
  invitereject: () => { clearInviteUrl(); closeAll(); },
  pldetail: b => planDetails(+b.dataset.i),
  pljoindetail: b => { moreActions.pljoin(b); planDetails(+b.dataset.i); },
  plcanceldetail: b => { moreActions.plx(b); closeAll(); },
  pfollow: b => { const w = b.dataset.w; follows.has(w) ? follows.delete(w) : follows.add(w); try { localStorage.setItem('spotter-following', JSON.stringify([...follows])); } catch (_) {} render(); toast(follows.has(w) ? `Following ${w}` : `Unfollowed ${w}`); },
  plan: b => openPlan(+(b.dataset.g || 0)),
  plg: b => { pd.g = +b.dataset.v; drawPlan(); },
  pld: b => { pd.d = +b.dataset.v; drawPlan(); },
  plh: b => { pd.h = +b.dataset.v; drawPlan(); },
  plw: b => { const w = b.dataset.w; pd.who.has(w) ? pd.who.delete(w) : pd.who.add(w); drawPlan(); },
  plgo: () => { const p = { by: 'You', g: pd.g, d: pd.d, h: pd.h, who: ['You', ...pd.who] }; plans.unshift(p); pd = null; closeAll();
    if (page === 'friends' && (arg === 'friends' || arg === 'plan')) render(); else go('friends/friends'); toast(`Plan posted · ${dayName(p.d)} ${clock(p.h)} at ${gyms[p.g].name}`); },
  pljoin: b => { const p = plans[+b.dataset.i], on = p.who.includes('You'); p.who = on ? p.who.filter(w => w !== 'You') : [...p.who, 'You']; render(); toast(on ? 'You left the plan' : `You’re going · ${dayName(p.d)} ${clock(p.h)}`); },
  plstart: () => { lgClock(); render(); openAdd(); },
  plx: b => { plans.splice(+b.dataset.i, 1); render(); toast('Plan cancelled'); }
};

/* ---------- shell: routing, render, sheets ---------- */
const views = { pick: viewPick, setup: viewSetup, videos: viewVideos, day: viewDay, shelf: viewShelf, clip: viewClip, vs: viewVs, route: viewRoute, walls: viewGymsTab, gyms: viewGyms, gym: viewGym, friends: viewFriends, person: viewPerson, profile: viewProfile, cam: viewCam, session: viewSession, logc: viewSession, scan: viewScan, summary: viewSummary, watch: viewWatch };
const tabOf = { videos: 'videos', shelf: 'videos', clip: 'videos', vs: 'videos', cam: 'videos', route: 'walls', walls: 'walls', gyms: 'walls', gym: 'walls', session: 'videos', logc: 'videos', scan: 'walls', summary: 'profile', watch: 'profile', friends: 'friends', person: 'friends', profile: 'profile' };
const tabs = ['videos', 'walls', 'friends', 'profile'];
const dock = document.querySelector('.dock');
function readHash() { const [p = '', a = ''] = location.hash.replace(/^#\/?/, '').split('/'); page = views[p] ? p : 'videos'; try { arg = decodeURIComponent(a); } catch (_) { arg = a; } }
function go(p) { if (location.hash === '#/' + p) render(); else location.hash = '#/' + p; }
let lastMotionPage = null;
function render() {
  saveSoon();
  const pageChanged = lastMotionPage !== page;
  lastMotionPage = page;
  if (stylePickerResize) { window.removeEventListener('resize', stylePickerResize); stylePickerResize = null; }
  feedStop();
  const v = views[page](arg);
  $('main').innerHTML = v.html;
  const bd = document.querySelector('.backdrop'), fold = $('main').querySelector('.fold');
  bd.style.display = fold ? '' : 'none';
  if (v.photo) bd.querySelector('img').src = `${pic(v.photo)}`;
  if (fold) bd.style.height = `${sbH() + fold.offsetTop + 40}px`;
  $('cta').innerHTML = v.cta || '';
  $('camx').hidden = !v.overlay;
  $('camx').innerHTML = v.overlay || '';
  $('camx').classList.toggle('mapx', !!v.map);
  document.querySelector('.phone').classList.toggle('dark', !!v.dark);
  const scr = document.querySelector('.screen');
  scr.classList.toggle('tok-on', !!v.tok); scr.classList.toggle('fit', !!v.fit);
  scr.classList.remove('snap'); scr.closest('.phone')?.classList.remove('onvid'); scr.style.scrollPaddingTop = ''; $('main').style.paddingBottom = '';   // the analysis page turns it on once its video sticks
  // the dock belongs to the four tabs; every page opened from a tab has a back button instead
  dock.hidden = !!v.cta || !!v.bare || !tabs.includes(page);
  dock.querySelectorAll('.dk:not(.plus)').forEach(b => b.toggleAttribute('aria-current', b.dataset.dock === tabOf[page]));
  dock.querySelector('[aria-current]')?.setAttribute('aria-current', 'page');
  // one lime marker that slides to the tab you're on (instead of one popping in under each tab)
  const cur = dock.querySelector('[aria-current]'), ind = dock.querySelector('.dk-ind') || dock.appendChild(Object.assign(document.createElement('i'), { className: 'dk-ind' }));
  ind.style.opacity = cur ? 1 : 0;
  if (cur) requestAnimationFrame(() => { ind.style.transform = `translateX(${cur.offsetLeft + cur.offsetWidth / 2 - 9}px)`; });
  $('plus').innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M13.5 5h5v8.5H27v5h-8.5V27h-5v-8.5H5v-5h8.5z"/></svg><span>Add</span>';
  island();
  if (gmap && !v.map) { gmap.remove(); gmap = null; }
  if (tmap && page !== 'walls') { tmap.remove(); tmap = null; }
  v.after?.();
  // Keep route changes responsive; videos and maps stay stationary while loading.
  if (pageChanged && !v.tok && !v.map && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $('main').animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, easing: 'cubic-bezier(.2,.7,.2,1)' });
  }
  // every video is analysed as soon as it's here, whichever page you're on
  // Analysis begins only when the climber requests it.
}
const toastEl = $('toast');
let tt;
function toast(msg) { if (clockNote) { clockNote = false; msg = msg ? `${msg} · Clock started, tap it up top to end` : 'Clock started, tap it up top to end'; } toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('show'), 2200); }
const sheet = $('sheet'), ask = $('ask'), scrim = $('scrim');
function closeAll() { stopInviteCamera(); if (cmRecognition) { cmRecognition.stop(); cmRecognition = null; } if (cmImage) { URL.revokeObjectURL(cmImage); cmImage = null; } cmReply = null; [sheet, ask, scrim].forEach(x => x.classList.remove('show')); clearTimeout(closeAll.t); closeAll.t = setTimeout(() => { if (!ask.classList.contains('show')) ask.innerHTML = ''; }, 400); }
function pane(html) { ask.innerHTML = '<div class="grab"></div>' + html; sheet.classList.remove('show'); ask.classList.add('show'); scrim.classList.add('show'); }
// someone else's video on its own, from the route page
function watchPane(x) {
  const r = ROUTES[x.ri];
  pane(`<h2>${x.who} ${x.top ? 'topped' : 'climbed'} ${rname(r)}</h2><span class="sub">${gym.name} · ${dayLabel(x.ago)} · ${x.len}</span>
    <div class="fr-v"><video src="${vsrc(x.vid)}" poster="${pic(x.img)}" autoplay muted playsinline controls loop></video></div>
    <p class="hint">${x.credit}</p>`);
}

const actions = {
  lvseek: b => { const v = $('lvv'); if (!v) return; v.currentTime = +b.dataset.t; v.play().catch(() => {});
    document.querySelectorAll('.mvq-m.on').forEach(x => x.classList.remove('on')); b.classList.add('on'); },
  status: () => pane(`<h2>Your status</h2><span class="sub">Friends see it on your profile, next to your home gym.</span>
    <div class="stt-l">${STATUS.map(([k, l]) => `<button type="button" class="stt-o${k ? ` is-${k}` : ''}" data-act="setstatus" data-s="${k}" aria-pressed="${k === myStatus}"><i></i>${l}${k === myStatus ? ic.check : ''}</button>`).join('')}</div>`),
  setstatus: b => { myStatus = b.dataset.s; try { localStorage.setItem('spotter-status', myStatus); } catch (_) {} closeAll(); render(); },
  to: b => go(b.dataset.to),
  albumfilter: () => pane(`<div class="album-filter-sheet"><h2>Filter records</h2><p>Choose what you want to see.</p>${[['all','All records'],['videos','Videos'],['manual','By hand']].map(([value,label]) => `<button type="button" data-act="albumfilterset" data-value="${value}" aria-pressed="${albumFilter === value}"><span>${label}</span>${albumFilter === value ? '<b>✓</b>' : ''}</button>`).join('')}</div>`),
  albumfilterset: b => { albumFilter = b.dataset.value; closeAll(); render(); },
  vtab: b => { vTab = b.dataset.t; render(); },
  back: () => history.length > 1 ? history.back() : go('videos'),
  close: () => closeAll(),
  feedmode: b => { feedAt = 0; go(b.dataset.to); },
  // add
  film: () => { closeAll(); filming = false; camStep = 'frame'; camRoute = null; camGym = todayGym(); camColor = ''; camGrade = ''; camRes = null; camFeel = null; go('cam'); },
  upload: () => { if (page === 'setup') { history.replaceState(null, '', '#/videos'); readHash(); render(); } openUpload(); },
  upick: b => { const i = +b.dataset.i; upSel.has(i) ? upSel.delete(i) : upSel.add(i); drawRoll(); },
  upnext: () => { const s = [...upSel]; if (s.length) importPicks(s); },
  campicker: b => openCameraPicker(b.dataset.kind),
  campickgym: b => { camGym = +b.dataset.i; setTodayGym(camGym); closeAll(); render(); },
  campickgrade: b => { camGrade = b.dataset.grade; closeAll(); render(); },
  holdpick: b => { const cc = clipOf(b.dataset.context); if (cc) { setPick(cc, 'color', b.dataset.color); return; } if (b.dataset.context === 'cam') camColor = b.dataset.color; else glColor = b.dataset.color; closeAll(); render(); },
  shoot: () => {
    clearInterval(recT);
    if (!filming) {
      if (!camStream) return;
      if (camGym === null || !camColor || !camGrade) { openCameraPicker(camGym === null ? 'gym' : !camGrade ? 'grade' : 'color'); return; }
      const type = camMime(); camChunks = [];
      try { camRec = new MediaRecorder(camStream, { ...(type ? { mimeType: type } : {}), videoBitsPerSecond: 4e6 }); } catch (_) { toast('This browser can’t record video. Import a video instead'); return; }
      camRec.ondataavailable = e => { if (e.data.size) camChunks.push(e.data); };
      camRec.onstop = () => { camBlob = new Blob(camChunks, { type: camRec?.mimeType || type || 'video/mp4' }); camChunks = [];
        if (camURL) URL.revokeObjectURL(camURL); camURL = URL.createObjectURL(camBlob); camStop(); camStep = 'review'; render(); };
      camRec.start(1000); filming = true; recS = 0; render();
      recT = setInterval(() => { recS++; const t = $('recT'); if (t) t.textContent = mmss(recS); }, 1000);
      return;
    }
    filming = false; camRec?.stop();   // the review opens once the recording is complete
  },
  camres: b => { camRes = b.dataset.k; if (camRes === 'Project') camFeel = null; render(); },
  camfeel: b => { camFeel = camFeel === b.dataset.k ? null : b.dataset.k; render(); },
  feel: b => { const ri = +b.dataset.ri; myFeel[ri] = myFeel[ri] === b.dataset.k ? undefined : b.dataset.k; if (!myFeel[ri]) delete myFeel[ri]; feelSave(); render(); },
  camretake: () => { camDrop(); camStep = 'frame'; render(); },
  camtry: () => { camErr = ''; camStop(); render(); },
  camreview: () => { camStep = 'review'; render(); },
  camroute: () => { camStep = 'route'; render(); },
  camselect: b => { camRoute = +b.dataset.i; render(); },
  camsave: async () => {
    if (!camBlob || camGym === null || !camColor || !camGrade || !camRes) return;
    const ext = camBlob.type.includes('webm') ? 'webm' : 'mp4', d = new Date();
    const f = new File([camBlob], `climb-${d.toISOString().slice(0, 16).replace(/[:T]/g, '-')}.${ext}`, { type: camBlob.type });
    // what you set before filming is the route; you post it or analyse it from its page
    const ri = routeFor(camGym, camColor, camGrade, 'gym-arc-1');
    const c = await addMine(f, { ri, gy: camGym, res: camRes, hidden: true }, 'Saving your climb…'); if (!c) return;
    if (camFeel && camRes !== 'Project') { myFeel[ri] = camFeel; feelSave(); }
    camDrop(); camStep = 'frame'; camRoute = null; camGym = null; camColor = ''; camGrade = ''; camRes = null; camFeel = null; cTab = 'why'; go(`clip/${c.id}`); toast('Climb saved');
  },
  clpick: b => { const c = byId(b.dataset.c), k = b.dataset.k; if (!c) return; if (k === 'gy') openGymPick(`clip:${c.id}`); else if (k === 'color') openHoldColors(`clip:${c.id}`); else openClipGrade(c); },
  clpgrade: b => { const c = byId(b.dataset.c); if (c) setPick(c, 'grade', b.dataset.grade); },
  // posting shares the video in Community; the analysis stays yours
  clpost: b => { const c = byId(b.dataset.i); if (!c) return; if (!c.hidden) { feedAt = Math.max(0, feedAll().findIndex(p => p.c === c)); go('friends'); return; }
    if (!pickDone(c)) { toast('Choose the gym, grade and colour first'); return; }
    c.hidden = false; saveSoon(); render(); toast('Posted to Community'); },
  clres: b => { const c = byId(b.dataset.c); if (!c) return; c.res = c.res === b.dataset.k ? undefined : b.dataset.k; if (!c.res) delete c.res; saveSoon(); render(); },
  startanalysis: b => { const c = byId(b.dataset.i); if (c && c.an === 'idle') { analyse(c); render(); } },
  // a video's page
  ctab: b => { cTab = b.dataset.v; setTimeout(() => $('main').dispatchEvent(new Event('tabchange'))); document.querySelectorAll('.ctabs button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === cTab)); document.querySelectorAll('.pn').forEach(p => { p.hidden = p.dataset.pn !== cTab; }); },
  spd: b => { speed = { 1: .5, .5: .25, .25: 1 }[speed] || 1; const v = $('lvv'); if (v) v.playbackRate = speed; b.textContent = `${speed}×`; },   // 1× → 0.5× → 0.25×
  segplay: b => $('lvv') && document.querySelector('.lv-w.two') ? segMain(b) : segOpen(b),
  segtoggle: () => { const v = $('cpv'); if (!v || !seg) return; if (seg.over) segAgain(); else if (v.paused) v.play().catch(() => {}); else v.pause(); },
  segagain: segAgain,
  segspeed: () => { const v = $('cpv'); if (!v || !seg) return; seg.rate = seg.rate === .5 ? 1 : .5; v.playbackRate = seg.rate; $('cps').textContent = `${seg.rate}×`; },
  segclose: segClose,
  lyr: b => { const k = b.dataset.k; if (b.classList.contains('off')) { toast(offWhy(k)); return; } LAY[k] = !LAY[k]; lyrSave(); b.setAttribute('aria-pressed', String(!!LAY[k])); },
  lvplay: () => { const v = $('lvv'); if (v) v.paused ? v.play().catch(() => {}) : v.pause(); },
  anok: b => { const c = byId(b.dataset.i); confirmed(c, c.auto); },
  tagstart: b => { $('lvv')?.pause(); tagS = { id: +b.dataset.i, i: 0, pts: {} }; drawTag(byId(b.dataset.i)); document.querySelector('.screen').scrollTo(0, 0); },
  tagundo: b => { if (tagS.i) { tagS.i -= 1; delete tagS.pts[TAGS[tagS.i][0]]; } else if (byId(b.dataset.i).auto) tagS = { id: null, i: 0, pts: {} }; drawTag(byId(b.dataset.i)); },
  tagdone: b => { const c = byId(b.dataset.i); confirmed(c, { ...tagS.pts, t: c.auto?.t ?? 0 }, true); },
  retag: b => { const c = byId(b.dataset.i); c.tags = null; c.an = 'ask'; tagS = { id: null, i: 0, pts: {} }; render(); document.querySelector('.screen').scrollTo(0, 0); },
  croute: b => { const c = byId(b.dataset.i);
    pane(`<h2>Which route is this?</h2><span class="sub">${gym.name} · rope wall</span>
      <div class="rows">${ROUTES.map((r, i) => `<button class="row" type="button" data-act="cset" data-c="${c.id}" data-i="${i}"><span class="row-t"><strong>${sw(r)}${rname(r)}</strong><span>${n(mineOn(i).filter(x => x !== c).length, 'other try', 'other tries')} of yours</span></span>${i === c.ri ? ic.check : ''}</button>`).join('')}</div>`); },
  garea: () => pane(`<h2>Choose a city</h2><label class="gt-city-search">${ic.search}<input id="citysearch" type="search" placeholder="Search cities" aria-label="Search cities" autocomplete="off"></label>
      <div class="rows"><button class="row" type="button" data-act="gaset" data-a="near">${ic.pin}<span class="row-t"><strong>Near you</strong><span>From where you are now · every gym by distance</span></span>${gArea === 'near' ? ic.check : ''}</button>
      ${AREAS.map(a => `<button class="row" type="button" data-act="gaset" data-a="${a}"><span class="row-t"><strong>${a}</strong><span>${n(gyms.filter(g => g.addr.includes(a)).length, 'gym', 'gyms')}</span></span>${gArea === a ? ic.check : ''}</button>`).join('')}</div>`),
  gaset: b => { gArea = b.dataset.a; gtSel = null; closeAll(); render(); },
  pk: b => { const k = b.dataset.k;
    if (k === 'all') { const on = !picks.has('all'); picks.clear(); if (on) picks.add('all'); }
    else { picks.delete('all'); picks.has(k) ? picks.delete(k) : picks.add(k); }
    localStorage.setItem('spotter-styles', JSON.stringify([...picks]));
    render(); },
  pkdone: b => go(b.dataset.from === 'new' ? 'videos' : 'profile'),
  cgym: b => { const c = byId(b.dataset.i);
    pane(`<h2>Which gym was this?</h2><span class="sub">${rname(ROUTES[c.ri])} · try ${tryOf(c)} · ${dayLabel(agoOf(c))}</span>
      <div class="rows">${gyms.map((g, i) => `<button class="row" type="button" data-act="cgset" data-c="${c.id}" data-i="${i}"><span class="row-t"><strong>${g.name}</strong><span>${g.dist}</span></span>${c.gy === i ? ic.check : ''}</button>`).join('')}</div>`); },
  cgset: b => { const c = byId(b.dataset.c); c.gy = +b.dataset.i; closeAll(); render(); toast(`At ${gyms[c.gy].name}`); },
  cset: b => { const c = byId(b.dataset.c); c.ri = +b.dataset.i; closeAll(); render(); toast(`Moved to ${rname(ROUTES[c.ri])} · try ${tryOf(c)}`); },
  vhide: b => { const c = byId(b.dataset.i); c.hidden = !c.hidden; render(); toast(c.hidden ? 'Hidden · only you can see it' : 'Public · in Community'); },
  seepost: b => { const c = byId(b.dataset.i); feedAt = Math.max(0, feedAll().findIndex(p => p.c === c)); go('friends'); },
  vdel: b => { const c = byId(b.dataset.i);
    pane(`<h2>Delete this video?</h2><span class="sub">${rname(ROUTES[c.ri])} · try ${tryOf(c)}. Its analysis and comments go too. The video stays in your camera roll.</span>
      <div class="two"><button class="b-ghost" type="button" data-act="close">Keep</button><button class="b-lime" type="button" data-act="vdelyes" data-i="${c.id}">Delete</button></div>`); },
  vdelyes: b => { const c = byId(b.dataset.i); clips.splice(clips.indexOf(c), 1); V[c.v].added = false; closeAll(); if (page === 'clip') go('videos'); else render(); toast('Video deleted'); },
  cmore: b => { const c = byId(b.dataset.i), r = ROUTES[c.ri];
    pane(`<h2>Video options</h2><span class="sub">${c.need ? 'New climb' : rname(r)} · try ${tryOf(c)} · ${dayLabel(agoOf(c))}</span>
      <div class="vis-seg" role="radiogroup" aria-label="Who can see it">
        <button type="button" role="radio" data-act="cvis" data-i="${c.id}" data-v="pub" aria-checked="${!c.hidden}">${ic.eye}<span><strong>Public</strong><small>In Community, for climbers here</small></span></button>
        <button type="button" role="radio" data-act="cvis" data-i="${c.id}" data-v="me" aria-checked="${!!c.hidden}">${LOCK}<span><strong>Only you</strong><small>Out of Community, analysis kept</small></span></button></div>
      <div class="rows feed-options">
        <button class="row" type="button" data-act="croute" data-i="${c.id}"><span class="row-t"><strong>Change route</strong><span>${c.need ? 'Not set yet' : rname(r)}</span></span>${ic.arr('#111111')}</button>
        <button class="row" type="button" data-act="cgym" data-i="${c.id}"><span class="row-t"><strong>${c.gy == null ? 'Add gym' : 'Change gym'}</strong><span>${c.gy == null ? 'Location was off' : gyms[c.gy].name}</span></span>${ic.arr('#111111')}</button>
        <button class="row" type="button" data-act="share" data-i="${c.id}"><span class="row-t"><strong>Share</strong><span>As a poster, with the route and gym on it</span></span>${ic.arr('#111111')}</button>
        <button class="row del" type="button" data-act="vdel" data-i="${c.id}"><span class="row-t"><strong>Delete video</strong><span>It stays in your camera roll</span></span></button></div>`); },
  cvis: b => { const c = byId(b.dataset.i), me = b.dataset.v === 'me'; closeAll(); if (!!c.hidden === me) return; c.hidden = me; render(); toast(me ? 'Only you · removed from Community' : 'Public · in Community'); },
  fpull: b => { const c = byId(b.dataset.i); c.hidden = true; closeAll(); render(); toast('Removed from Community · still in your videos'); },
  alsel: () => { alSel = alSel ? null : new Set(); render(); },
  alpick: b => { const id = b.dataset.i; alSel.has(id) ? alSel.delete(id) : alSel.add(id); b.setAttribute('aria-pressed', alSel.has(id));
    $('cta').innerHTML = alCta(); const h = $('alcount'); if (h) h.textContent = alSel.size ? `${alSel.size} selected` : 'Select videos'; },
  alvis: b => { const me = b.dataset.v === 'me', k = alSel.size; alSel.forEach(id => { const c = byId(id); if (c) c.hidden = me; }); alSel = null; render();
    toast(`${n(k, 'video', 'videos')} · ${me ? 'only you' : 'public'}`); },
  aldel: () => { const k = alSel.size; if (!k) return;
    pane(`<h2>Delete ${n(k, 'video', 'videos')}?</h2><span class="sub">Their analysis and comments go too. The videos stay in your camera roll.</span>
      <div class="two"><button class="b-ghost" type="button" data-act="close">Keep</button><button class="b-lime" type="button" data-act="aldelyes">Delete ${k}</button></div>`); },
  aldelyes: () => { const k = alSel.size; alSel.forEach(id => { const c = byId(id); if (!c) return; clips.splice(clips.indexOf(c), 1); V[c.v].added = false; }); alSel = null; closeAll(); render(); toast(`${n(k, 'video', 'videos')} deleted`); },
  // side by side
  pvplay: () => pvPlay(),
  vsrate: b => { const i = Math.max(0, Math.min(RATES.length - 1, RATES.indexOf(pvRate) + +b.dataset.d)); pvRate = RATES[i];
    ['pv0', 'pv1'].forEach(id => { const v = $(id); if (v) v.playbackRate = pvRate; }); const t = $('pvs'); if (t) t.textContent = `${pvRate}×`; },
  vszoom: b => { const i = Math.max(0, Math.min(ZOOMS.length - 1, ZOOMS.indexOf(vsZ) + +b.dataset.d)); vsZ = ZOOMS[i]; const t = $('pvz'); if (t) t.innerHTML = `${ic.search}${vsZ}×`; },
  pvslow: b => { pvRate = pvRate === 1 ? .5 : 1; b.setAttribute('aria-pressed', pvRate < 1); 
    ['pv0', 'pv1'].forEach(id => { const v = $(id); if (v) v.playbackRate = pvRate; }); if (pv && !pv.on) pvPlay(); },
  pvsync: b => { const h = $('vshero'), on = !h.classList.contains('sync'); h.classList.toggle('sync', on); b.setAttribute('aria-pressed', on); b.textContent = on ? 'Done' : 'Line up';
    if (on && pv?.on) pvPlay(); if (!on && pv) { pv.a.currentTime = pv.a0; pv.b.currentTime = pv.b0; pv.sync?.(); } },
  vsdown: () => { const sc = document.querySelector('.screen'), h = $('vshero'); sc.scrollTo({ top: h.offsetTop + h.offsetHeight - 8, behavior: 'smooth' }); },
  pvlay: b => { vsLay = vsLay === 'lr' ? 'tb' : 'lr'; $('vshero')?.classList.toggle('tb', vsLay === 'tb'); b.innerHTML = layIc(); b.setAttribute('aria-label', vsLay === 'lr' ? 'Stack the videos' : 'Put the videos side by side'); },
  fwatch: b => watchPane(V[+b.dataset.v]),
  // gym
  gycopy: () => { navigator.clipboard?.writeText(gym.addr).then(() => toast('Address copied'), () => toast(gym.addr)); },
  // community
  fvtap: b => { const post = b.closest('.ts'), v = b.querySelector('video');
    if (tapT) { clearTimeout(tapT); tapT = null; feedLike(post, true); const h = b.querySelector('.ts-big'); h.classList.remove('go'); void h.offsetWidth; h.classList.add('go'); return; }
    tapT = setTimeout(() => { tapT = null; if (v.paused) { delete v.dataset.stop; v.play().catch(() => {}); } else { v.dataset.stop = 1; v.pause(); } }, 240); },
  flike: b => feedLike(b.closest('.ts'), b.getAttribute('aria-pressed') !== 'true'),
  fmore: b => feedOptions(+b.dataset.i),
  fshare: async b => { const post = feedAll()[+b.dataset.i], url = new URL(`${vsrc(V[post.v].vid)}`, location.href).href; if (navigator.share) { try { await navigator.share({ title: 'Climbing video', url }); } catch (e) { if (e.name !== 'AbortError') toast('Could not share. Copy the link instead.'); } } else { toast('Sharing is unavailable. Copy the link instead.'); } },
  fcopy: async b => { const input = ask.querySelector('.feed-share-url'); try { await navigator.clipboard.writeText(input.value); toast('Video link copied'); } catch (_) { input.focus(); input.select(); toast('Select and copy the link'); } },
  fchoose: b => chooseComparison(+b.dataset.i),
  fvsother: b => { const c = byId(b.dataset.c), x = V[+b.dataset.v]; if (!c || !x) return; closeAll(); go(`vs/${c.id}-${x.i}`); },
  fchoosepick: b => { const c = byId(b.dataset.c), video = V[+b.dataset.v]; if (!c || !video || c.ri !== video.ri || c.v === video.i || video.who === 'You') return; closeAll(); go(`vs/${c.id}-${video.i}`); },
  fbeta: b => { closeAll(); moreActions.rbeta(b); },
  freport: b => reportVideo(+b.dataset.i),
  fcm: b => { cmSort = 'default'; cmReply = null; if (cmImage) URL.revokeObjectURL(cmImage); cmImage = null; feedComments(+b.dataset.i); },
  cm: b => {
    const i = +b.dataset.i, inp = ask.querySelector(`[data-cm="${i}"]`), text = inp.value.trim();
    if (!text && !cmImage) return;
    const p = feedAll()[i], time = cmAt ? cmNow(i) : null;
    p.comments.push(['You', text, time ?? undefined, { reply: cmReply, image: cmImage }]);
    cmReply = null; cmImage = null;
    feedComments(i);
  },
  cmreply: b => { cmReply = b.dataset.w; feedComments(+b.dataset.i, ask.querySelector('[data-cm]').value); ask.querySelector('[data-cm]').focus(); },
  cmcancelreply: b => { cmReply = null; feedComments(+b.dataset.i, ask.querySelector('[data-cm]').value); },
  cmsort: b => { cmSort = b.dataset.sort; feedComments(+b.dataset.i, ask.querySelector('[data-cm]').value); },
  cmvote: b => { const comment = feedAll()[+b.dataset.i].comments[+b.dataset.index], vote = b.dataset.vote; if (commentVotes.get(comment) === vote) commentVotes.delete(comment); else commentVotes.set(comment, vote); feedComments(+b.dataset.i, ask.querySelector('[data-cm]').value); },
  cmremoveimage: b => { if (cmImage) URL.revokeObjectURL(cmImage); cmImage = null; feedComments(+b.dataset.i, ask.querySelector('[data-cm]').value); },
  cmvoice: b => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) { toast('Voice input is not available in this browser'); return; }
    if (cmRecognition) { cmRecognition.stop(); return; }
    const input = ask.querySelector('[data-cm]'), recognition = new Speech(); cmRecognition = recognition;
    recognition.lang = document.documentElement.lang || 'en-US';
    recognition.onresult = e => { if (input.isConnected) input.value = [input.value.trim(), e.results[0][0].transcript].filter(Boolean).join(' '); };
    recognition.onerror = () => toast('Voice input unavailable. Check microphone access.');
    recognition.onend = () => { cmRecognition = null; if (b.isConnected) b.setAttribute('aria-pressed', 'false'); };
    b.setAttribute('aria-pressed', 'true');
    try { recognition.start(); } catch (_) { cmRecognition = null; b.setAttribute('aria-pressed', 'false'); toast('Voice input unavailable'); }
  },
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
ask.addEventListener('input', e => {
  if (e.target.id !== 'citysearch') return;
  const query = e.target.value.trim().toLowerCase();
  ask.querySelectorAll('[data-act=gaset]').forEach(row => { row.hidden = !row.dataset.a.toLowerCase().includes(query) && !(row.dataset.a === 'near' && 'all cities'.includes(query)); });
});
ask.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset.cm) ask.querySelector(`[data-act="cm"][data-i="${e.target.dataset.cm}"]`)?.click(); });
dock.addEventListener('click', e => {
  const b = e.target.closest('[data-dock]'); if (!b) return;
  if (b.dataset.dock === 'plus') { openAdd(); return; }
  go(b.dataset.dock);
});
scrim.addEventListener('click', closeAll);
// the Add sheet has no × any more: tap outside or press Escape to close
document.addEventListener('keydown', e => { if (e.key === 'Escape' && scrim.classList.contains('show')) closeAll(); });
// swipe a sheet down to close it: it follows the finger 1:1, resists being pulled up, and closes past 90px or on a quick
// flick; otherwise it springs back. A drag only takes over after 6px down, so taps on the buttons inside still work.
[sheet, ask].forEach(el => {
  let y0 = 0, dy = 0, t0 = 0, on = false, live = false;
  el.addEventListener('pointerdown', e => { if (!el.classList.contains('show') || el.scrollTop > 0) return; on = true; live = false; y0 = e.clientY; dy = 0; t0 = e.timeStamp; });
  el.addEventListener('pointermove', e => { if (!on) return; const d = e.clientY - y0;
    if (!live) { if (d < 6) { if (d < -6) on = false; return; } live = true; el.setPointerCapture(e.pointerId); el.style.transition = 'none'; }
    dy = d > 0 ? d : d / 4; el.style.transform = `translateY(${dy}px)`; });
  const end = e => { if (!on) return; on = false; if (!live) return;
    const v = dy / Math.max(1, e.timeStamp - t0); el.style.transition = '';
    if (dy > 90 || v > .6) { el.style.transform = ''; closeAll(); } else el.style.transform = '';
    const eat = x => { x.stopPropagation(); x.preventDefault(); }; el.addEventListener('click', eat, true); setTimeout(() => el.removeEventListener('click', eat, true), 60); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
});
window.addEventListener('hashchange', () => { readHash(); if (page !== 'cam') { camDrop(); camStop(); camStep = 'frame'; } if (page !== 'scan') scanStop(); if (page !== 'videos') alSel = null; closeAll(); render(); document.querySelector('.screen').scrollTop = 0; });
// frost the status bar once content scrolls under it
const scr = document.querySelector('.screen');
scr.addEventListener('scroll', () => document.querySelector('.phone').classList.toggle('scrolled', scr.scrollTop > 8), { passive: true });
// first open: a new climber starts on the intro; ?view=regular opens Videos
if (!location.hash) history.replaceState(null, '', '#/' + (user === 'regular' ? 'videos' : 'setup'));
readHash();
// your imported videos first, so a reload on one of them opens it again
restoreMine().catch(() => {}).finally(() => { readHash(); render(); });
if (params.has('invite')) showIncomingInvite();
// iPhone 16 Pro frame (894 px with its border): on a short window scale the whole phone down to fit, never squash it
const fitPhone = () => document.querySelector('.device').style.setProperty('--fit', Math.min(1, (innerHeight - 96) / 894).toFixed(3));
addEventListener('resize', fitPhone);
fitPhone();

// Spotter prototype v2: one screen per step of the user flow (FigJam "Flow chart v2"), one hash route per screen.
// Set up (#/setup/…) → Videos (#/videos), the first tab, as in KEKE → "+" adds a climb: film a try (#/cam), upload a video, scan, log by hand
// → "Sent it?" → compare (#/compare) or log the send → "Keep climbing?" → Walls (#/walls) or end-session summary (#/summary)
// → Profile with your progress (#/profile, a tab) → Community (#/friends). v6 has no Today page: Videos is where you land.
// Videos (#/videos) keeps every clip you film, upload or get tagged in; each one opens as its analysis (#/clip/<id>).
// A watch (#/watch) logs tries from the wrist while the phone films.
// v2 drops v1's assumption that every gym publishes its routes: walls reset every few weeks, so every way of adding works
// from what the climber sees on site (tape colour, grade, gym). The gym's list, when there is one, only fills things in.

// "regular" = Maria a few months in, with routes she is working on. "new" = first week, nothing logged yet.
// highs = the highest move reached on each try, moves = moves to the top, proj = saved to her projects.
const data = {
  regular: [
    { color: 'Yellow', hex: '#F2C230', grade: 'V3', g: 3, wall: 'Wall B', img: 'woman1', tries: 6, moves: 6, highs: [2, 3, 3, 4, 4, 4], daysLeft: 3, videos: 4,
      you: 6.2, senders: 2.1, proj: true, short: 'Move 4 is a long reach to a sloper. Turn your hip in before you go.' },
    { color: 'Blue', hex: '#3D7BEA', grade: 'V3', g: 3, wall: 'Wall C', img: 'wall2', tries: 3, moves: 5, highs: [1, 2, 2], daysLeft: 18, videos: 2,
      you: 4.8, senders: 1.9, proj: true, short: 'Small feet on the slab. Stand up slowly on move 3.' },
    { color: 'Red', hex: '#E5484D', grade: 'V3', g: 3, wall: 'Wall A', img: 'wall1', tries: 2, moves: 5, highs: [2, 3], daysLeft: 10, videos: 3,
      you: 3.4, senders: 1.6, proj: true, short: 'Steep start. Keep your feet on through moves 2 and 3.' }
  ],
  new: [
    { color: 'Orange', hex: '#F08A24', grade: 'V2', g: 2, wall: 'Wall A', img: 'wall1', tries: 0, moves: 6, highs: [], by: 14, videos: 6, easiest: true, daysLeft: 10,
      short: 'Big holds all the way. Keep your arms straight.' },
    { color: 'Blue', hex: '#3D7BEA', grade: 'V2', g: 2, wall: 'Wall D', img: 'man1', tries: 0, moves: 5, highs: [], by: 11, videos: 9, daysLeft: 24,
      short: 'Trust your feet. Keep your hips close to the wall.' },
    { color: 'Green', hex: '#2E9E62', grade: 'V2', g: 2, wall: 'Wall C', img: 'woman1', tries: 0, moves: 5, highs: [], by: 8, videos: 3, daysLeft: 18,
      short: 'Short and steep. Push with your legs, not your arms.' }
  ]
};
const hardest = { regular: 2, new: null };
const params = new URLSearchParams(location.search);
let user = params.get('view') === 'regular' ? 'regular' : 'new';
let session = 'none', secs = 0, tries = 0, tops = 0, located = false, tagPending = true, posted = false;
let page = 'videos', arg = '', frame = 132, lastRoute = null, demoHidden = false, joined = false;
// watch = a paired watch (Maria a few months in has one), filming = the camera is recording a try
let watch = user === 'regular', filming = false;
// crowd = how full the gym usually is, one value per hour from 7 AM to 10 PM (from check-ins)
// mi, deg = how far and which way from you (the map places them); addr = the street; the crowd comes from check-ins
// a colour circuit: the tape colour is the grade, so there is no tag to read. Placeholder colours; each gym sets its own.
const circuit = [['Yellow', '#F2C230', 'V0–V1'], ['Green', '#2E9E62', 'V1–V2'], ['Blue', '#3D7BEA', 'V2–V3'], ['Red', '#E5484D', 'V3–V4'], ['Black', '#111111', 'V5+']];
// real gyms near the UIUC Main Quad, from their own websites (checked Nov 11, 2026). mi = straight-line distance from the Quad.
// hours: [open, close] in 24 h for Sun..Sat (null = closed). grading: 'tag' = a V grade on a tag at each climb; null = we don't know.
// crowd is the app's own: how full it usually is by hour, 7 AM to 10 PM, from check-ins (sample numbers)
const gyms = [
  { name: 'Boneyard Boulders', grading: null, dist: '1.0 mi', mi: 1.0, deg: 310, addr: '119 E University Ave, Champaign', img: 'gym-boneyard-1', pics: ['gym-boneyard-2'],
    hours: Array(7).fill([12, 22]), pass: '$20 · $18 if 20 or under', has: ['Shoe rental $4', 'Free fitness classes', 'Same pass works at Urbana Boulders'],
    src: 'urbanaboulders.com', crowd: [.3, .25, .2, .2, .3, .35, .4, .35, .4, .55, .75, .95, 1, .8, .5, .3] },
  { name: 'Urbana Boulders', grading: null, dist: '2.0 mi', mi: 2.0, deg: 48, addr: '1502 N Cunningham Ave, Urbana', img: 'gym-urbana-1', pics: ['gym-urbana-2'],
    hours: [[10, 21], [15, 22], [15, 22], [15, 22], [15, 22], [12, 22], [10, 21]], pass: '$20 · $18 if 20 or under', has: ['Shoe rental $4', '200+ problems across both gyms', 'Same pass works at Boneyard Boulders'],
    src: 'urbanaboulders.com', crowd: [.2, .15, .15, .2, .25, .3, .35, .4, .6, .8, .9, .85, .7, .5, .3, .2] },
  { name: 'Horizon Climbing', grading: 'tag', dist: '2.8 mi', mi: 2.8, deg: 278, addr: '1914 Round Barn Rd, Champaign', img: 'gym-horizon-1', pics: ['gym-horizon-2', 'gym-horizon-3', 'gym-horizon-4'],
    hours: [[10, 20], [10, 22], [10, 22], [10, 22], [10, 22], [10, 22], [10, 22]], pass: '$22 · $16 college students', has: ['Shoe rental $4', 'New climbs every week', 'Tension Board 2', 'Showers and sauna', 'Free yoga for members', 'Kids’ climbing room', 'Study space'],
    src: 'climbhorizon.com', crowd: [.5, .7, .8, .6, .4, .3, .3, .35, .45, .6, .8, .9, .85, .6, .4, .2] },
  { name: 'ARC Climbing Wall', grading: null, dist: '0.6 mi', mi: 0.6, deg: 229, addr: '201 E Peabody Dr, Champaign (UIUC)', img: 'gym-arc-1', pics: ['gym-arc-2', 'gym-arc-3'],
    hours: [[9, 22], [6, 23], [6, 23], [6, 23], [6, 23], [6, 22], [9, 22]], pass: null, has: ['35.5 ft rope wall', 'Bouldering Cave with a Kilter Board', 'Hangboards', 'Shoe rental'],
    src: 'campusrec.illinois.edu', note: 'The bouldering cave is open whenever the ARC is. Closed Nov 21–29 for Fall Break.',
    crowd: [.2, .2, .25, .3, .3, .35, .4, .5, .6, .7, .8, .8, .7, .5, .3, .2] },
  { name: 'Upper Limits Bloomington', grading: null, dist: '49 mi', mi: 49, deg: 302, addr: '1304 W Washington St, Bloomington', img: 'gym-upperlimits-1', pics: ['gym-upperlimits-2', 'gym-upperlimits-3'],
    hours: [[10, 18], [12, 22], [16, 22], [16, 22], [16, 22], [12, 22], [10, 18]], pass: '$21 · $17 kids 10 and under', has: ['Bouldering', 'Top rope and auto belays', 'Outdoor silo wall', 'Fitness area'],
    src: 'upperlimits.com', crowd: [.4, .5, .6, .6, .5, .5, .5, .6, .7, .8, .9, 1, .9, .7, .5, .3] }
];
// open now? From the gym's hours: "Open till 10 PM" or "Closed · opens 3 PM"; how busy comes from the crowd at this hour
const clock = h => `${h % 12 || 12} ${h < 12 || h === 24 ? 'AM' : 'PM'}`;
function gymOpen(g) {
  const d = new Date(), h = d.getHours() + d.getMinutes() / 60, today = g.hours?.[d.getDay()];
  if (!g.hours) return { open: null, line: g.now ? `${g.now} ${g.next}` : 'Hours not listed' };
  if (today && h >= today[0] && h < today[1]) {
    const c = g.crowd[Math.min(15, Math.max(0, d.getHours() - 7))];
    return { open: true, busy: c > .65 ? 'Busy' : c > .4 ? 'Not too busy' : 'Quiet', line: `Open till ${clock(today[1])}` };
  }
  for (let k = 0; k < 7; k++) {
    const day = (d.getDay() + k) % 7, hrs = g.hours[day];
    if (hrs && (k > 0 || h < hrs[0])) return { open: false, line: `Closed · opens ${k === 0 ? '' : k === 1 ? 'tomorrow ' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day] + ' '}${clock(hrs[0])}` };
  }
  return { open: false, line: 'Closed' };
}
const hoursToday = g => { const t = g.hours?.[new Date().getDay()]; return t ? `${clock(t[0])} – ${clock(t[1])}` : 'Closed today'; };
// sample people: a real portrait from Unsplash (img/av-name.jpg, stock models, not these names); anyone else gets a flat drawn one
const AV = new Set(['noor', 'mia', 'lena', 'chloe', 'ines', 'mei', 'rosa', 'yuki', 'priya', 'sam', 'leo', 'dan', 'kai', 'omar', 'ben', 'ravi', 'tom', 'felix']);
function avatar(w) {
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
const walls = [{ name: 'Wall A', routes: 11, reset: 10 }, { name: 'Wall B', routes: 9, reset: 3 }, { name: 'Wall C', routes: 10, reset: 18 }, { name: 'Wall D', routes: 8, reset: 24 }];
// people who topped the route, for "beta from climbers your height"
// r.videos = public videos of people topping a route; nearOf(r) = the ones by climbers within 5 cm of your height
const nearOf = r => beta.filter(b => Math.abs(b.h - myH()) <= 5).slice(0, r.videos);
const beta = [{ who: 'Sam', h: 164, img: 'woman1', tries: 3, len: '0:38' }, { who: 'Priya', h: 167, img: 'woman3', tries: 5, len: '0:41' }, { who: 'Dan', h: 170, img: 'man1', tries: 2, len: '0:29' }];
const levels = [{ t: 'Just starting', g: 'V0–V1', hi: 1, s: 'First few times on the wall' },
  { t: 'Topping some', g: 'V1–V2', hi: 2, s: 'You’ve topped a few easy routes' },
  { t: 'Getting there', g: 'V2–V3', hi: 3, s: 'You top V2 most sessions' }];
const setup = { imported: false, level: 1, height: '', span: '', unit: 'cm' };
// this session's climbs: route -> { tries, sent, hidden }. Public by default.
const today = new Map();
const logOf = r => { if (!today.has(r)) today.set(r, { tries: 0, sent: false, hidden: false }); return today.get(r); };
// gi = the gym you're at. It starts as the nearest one to your location; tap Change gym to pick another
const nearest = () => gyms.reduce((b, g, i) => g.mi < gyms[b].mi ? i : b, 0);
let gi = 0;   // your gym (Boneyard Boulders, the bouldering gym nearest the Quad). Not proof you're there now:
// the app only says "You're here" once you tap I'm here, or while you're filming a session
let hereOk = false;
const isHere = i => i === gi && (hereOk || session === 'live');
const $ = id => document.getElementById(id);
const list = () => data[user];
// the route picked in the 3-up picker; falls back to the first one not topped yet
const sel = { new: 0, regular: 0 };
// the app only shows routes it has seen for itself: ones you climbed, filmed, scanned or saved. Walls reset, so a gym's list can't be promised.
// list() stays as what the camera can recognise from the tape in frame.
const known = r => r.tries > 0 || !!r.proj || !!r.seen;
const gymAt = r => r.gym ?? 0;
const mine = () => list().filter(known).sort((a, b) => !!b.proj - !!a.proj);
const current = () => { const r = list()[sel[user]]; return r && known(r) && !r.topped ? r : mine().find(x => !x.topped); };
// the route the camera reads from the tape in frame: the one you're on, else whatever is in front of it
const camRoute = () => current() || list().find(x => !x.topped);
const toCm = x => Math.round(+x * (setup.unit === 'in' ? 2.54 : 1)), myH = () => toCm(setup.height) || 165, mySpan = () => toCm(setup.span) || myH();
const fmt = s => `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}`;
const n = (k, w, pl) => `${k} ${k === 1 ? w : pl}`;
const ic = {
  pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B2D2E" stroke-width="1.8"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  bell: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.7" stroke-linecap="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/></svg>',
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
// tab title with your photo: the way into your profile from every tab
// a tab's title, with your photo to open Profile (not on Profile itself)
const tabHead = t => `<div class="tabh"><h1 class="hl tab">${t}</h1>${t === 'Profile' ? '' : '<button class="av sm" type="button" data-act="me" aria-label="Your profile"><img src="img/woman2.jpg" alt=""></button>'}</div>`;
const sw = r => `<span class="sw" style="background:${r.hex}"></span>`;
const bar = (title = '') => `<div class="bar"><button class="bk" type="button" data-act="back" aria-label="Back">${ic.back}</button><span>${title}</span></div>`;

// a recorded try: how high you got this time (prototype: one move higher every other try)
function tried(r) {
  const last = r.highs.length ? r.highs[r.highs.length - 1] : 1;
  r.highs.push(Math.min(r.moves - 1, last + (r.highs.length % 2)));
  r.you ??= 5.4; r.senders ??= 2.1;
}

/* ---------- Set up: three short screens, no account, no long forms ---------- */
// where you climb, what you climb, then your videos: what the app does, shown on a real analysed frame, and the way straight
// in (import, film a try, or look around first). "Your sends are public" sits with the videos
const setupSteps = ['Gym', 'Level', 'Videos'];
const ruler = k => `<div class="ruler" aria-label="Step ${k} of ${setupSteps.length}">${setupSteps.map((s, i) => i < k - 1 ? `<button type="button" class="on" data-act="to" data-to="setup/${['gym', 'level', 'clips'][i]}" aria-label="Back to ${s}"><em></em>${s}</button>` : `<span class="${i < k ? 'on' : ''}"><em></em>${s}</span>`).join('')}</div>`;
const brand = '<div class="bar"><span class="brand">Spotter</span></div>';
const readSize = () => { if ($('hIn')) { setup.height = $('hIn').value; setup.span = $('sIn').value; } };
const setupViews = {
  // opened from a buddy's tag: accept or decline the clip they filmed
  tag: () => ({ photo: 'woman1', html: `
    ${brand}
    <h1 class="hl">Alex filmed you climbing</h1>
    <p class="sub-w">Alex tagged you in 2 clips. Accept and they go into your log. Decline and your name comes off Alex’s post.</p>
    <div class="clip"><img src="img/woman2.jpg" alt=""><span class="shade"></span><span class="play-b">${ic.play}</span>
      <span class="clip-l"><span class="pk-tag"><span class="sw" style="background:#F08A24"></span>Orange V2</span><span>Wall A · Boneyard Boulders · Saturday · 2 tries</span></span></div>
    <div class="fold"></div>`,
    cta: `<button class="b-ghost" type="button" data-act="tag" data-v="0">Decline</button><button class="b-lime" type="button" data-act="tag" data-v="1">Accept clips</button>` }),

  gym: () => ({ photo: 'wall1', html: `
    ${brand}${ruler(1)}
    <h1 class="hl">Where do you climb?</h1>
    <p class="sub-w">So we know where your climbs are. No account needed.</p>
    <div class="fold"></div>
    <div class="rows">
      ${gyms.map((g, i) => [g, i]).sort((x, y) => x[0].mi - y[0].mi).map(([g, i]) => `<button class="row opt" type="button" data-act="sgym" data-i="${i}" aria-pressed="${i === gi}">
        <span class="row-t"><strong>${g.name}</strong><span>${g.dist}</span></span><span class="radio"></span></button>`).join('')}
      <button class="row" type="button" data-act="to" data-to="setup/addgym"><span class="row-t"><strong>My gym isn’t listed</strong><span>Add it in 30 seconds</span></span>${ic.arr('#111111')}</button>
    </div>`,
    cta: `<button class="b-lime" type="button" data-act="to" data-to="setup/level">Continue</button>` }),

  addgym: () => ({ photo: 'wall1', html: `
    ${bar()}
    <h1 class="hl">Add your gym</h1>
    <p class="sub-w">Two fields, about 30 seconds. Climbers there can add routes later.</p>
    <div class="fold"></div>
    <div class="form">
      <label class="in"><span class="lbl">Gym name</span><input id="gName" type="text" placeholder="e.g. Granite Room" autocomplete="off"></label>
      <label class="in"><span class="lbl">Location</span><input id="gLoc" type="text" placeholder="Street or town" autocomplete="off"></label>
      <button class="link" type="button" data-act="useloc">Use my current location</button>
    </div>`,
    cta: `<button class="b-lime" type="button" data-act="savegym">Add gym</button>` }),

  // what you climb and your size (optional)
  level: () => ({ photo: 'woman2', html: `
    ${brand}${ruler(2)}
    <h1 class="hl">What do you climb now?</h1>
    <p class="sub-w">Tips are pitched at this. Change it anytime.</p>
    <div class="fold"></div>
    <div class="rows">
      ${levels.map((l, i) => `<button class="row opt" type="button" data-act="lvl" data-i="${i}" aria-pressed="${i === setup.level}">
        <span class="row-t"><strong>${l.t}</strong><span>${l.s}</span></span><b class="rg">${l.g}</b></button>`).join('')}
    </div>
    <div class="hl2 dk2"><h2>Your size</h2><span class="hint2">Optional</span><span class="su-u">${['cm', 'in'].map(u => `<button type="button" data-act="sunit" data-u="${u}" aria-pressed="${setup.unit === u}">${u}</button>`).join('')}</span></div>
    <div class="two-in">
      <label class="in"><span class="lbl">Height</span><span class="unit"><input id="hIn" type="number" inputmode="numeric" placeholder="${setup.unit === 'in' ? 65 : 165}" value="${setup.height}">${setup.unit}</span></label>
      <label class="in"><span class="lbl">Arm span</span><span class="unit"><input id="sIn" type="number" inputmode="numeric" placeholder="${setup.unit === 'in' ? 66 : 168}" value="${setup.span}">${setup.unit}</span></label>
    </div>
    <p class="cap">Used to plan your moves on a scanned route and to show you climbers built like you.</p>`,
    cta: `<button class="b-lime" type="button" data-act="lvlnext">Continue</button>` }),

  // what the app is for, shown on a real analysed frame, then straight into it: import, film, or look around first.
  // The public default sits here, next to the videos it is about
  clips: () => ({ photo: 'vrock', html: `
    ${brand}${ruler(3)}
    <h1 class="hl">Film a try. We find every move.</h1>
    <p class="sub-w">Phone on the floor, your whole body in frame. We find your hands and feet, each move, and where you came off.</p>
    <div class="fold"></div>
    <div class="ob-ex"><img id="obex" src="img/vrock.jpg" alt="A climber on the wall, with the body the analysis found drawn on">
      <div class="ob-t"><span class="ob-k">Example</span><strong>22 hand and foot moves</strong><span>found in this video, with where the climber came off and how long each rest was</span></div></div>
    <div class="row post-demo">
      <span class="pav"><img src="img/woman2.jpg" alt=""></span>
      <span class="row-t"><strong>You topped Orange V2</strong><span>Wall A · ${gyms[gi].name} · just now</span></span>
      <button class="vis${demoHidden ? ' off' : ''}" type="button" data-act="demo" aria-pressed="${demoHidden}">${demoHidden ? `${ic.eyeOff}Hidden` : `${ic.eye}Public`}</button>
    </div>
    <p class="cap">Your sends are public: friends see what you top and can comment. Any climb can be hidden, anytime.</p>
    <button class="link dk" type="button" data-act="done">Not now, look around first</button>`,
    cta: `<button class="b-ghost" type="button" data-act="sfilm">Film a try</button><button class="b-lime" type="button" data-act="simport">Import from Photos</button>`,
    after: () => fetch('video/rockspot-v3.track.json').then(x => x.json()).then(T => { const s = T.S.find(q => q.p && q.t >= 20); return s && window.poseStill?.('video/rockspot-v3.mp4', T, s, 'none', 'good'); })
      .then(u => { const im = $('obex'); if (u && im) im.src = u; }).catch(() => {}) })
};

const heroOf = r => r.tries ? `<b>${Math.max(0, ...r.highs)}<small>/${r.moves}</small></b><span>you got to move ${Math.max(0, ...r.highs)} of ${r.moves}</span>`
  : `<b>${r.moves}</b><span>moves, read from your photo</span>`;

// sends per grade: Maria's history plus anything topped today
function sendsBy() {
  const s = user === 'regular' ? { 0: 6, 1: 9, 2: 7 } : {};
  today.forEach((e, r) => { if (e.sent) s[r.g] = (s[r.g] || 0) + 1; });
  return s;
}
// Bento sizes for k tiles in the 2-column grid: first one tall, the rest short, last one widened so there is no hole
function sizes(k) {
  if (k === 0) return [];
  if (k === 1) return ['w2 tall'];
  if (k === 2) return ['tall', 'tall'];
  const s = ['tall', ...Array(k - 1).fill('')];
  if (k % 2 === 0) s[k - 1] = 'w2';
  return s;
}

// one number per route: how high you got, or for a scanned route its moves; the big tile also names the wall
const routeNum = (r, big) => (r.topped ? `<b>Topped</b><span>on try ${r.tries}`
  : r.tries ? `<b>${Math.max(0, ...r.highs)}<small>/${r.moves}</small></b><span>moves climbed`
  : `<b>${r.moves}</b><span>moves, from your photo`) + (big ? ` · ${r.wall}` : '') + '</span>';

/* ---------- Gyms: every gym near you by distance, as a list or on a map ---------- */
// gymR = how far you'll go, in miles (the map zooms to it); gymView = 'list' or 'map'; gymPin = the gym opened on the map
let gymR = 10, gymPin = null;
const radii = [1, 5, 10, 50];
// what you have at a gym: routes you've climbed, filmed or scanned there, your videos there, and the last day you climbed there
const atGym = i => { const v = clips.filter(c => (c.gym ?? gi) === i), r = mine().filter(x => gymAt(x) === i);
  return { routes: r.length, videos: v.length, last: v.length ? Math.max(...v.map(c => c.k)) : null }; };
// one gym: tap it to open it (your routes there); Directions opens it in Maps
function gymCard(g, i) {
  const on = isHere(i), a = atGym(i), been = a.routes || a.videos;
  const what = been ? [a.routes && n(a.routes, 'route', 'routes'), a.videos && n(a.videos, 'video', 'videos')].filter(Boolean).join(' · ') : `${g.dist} · ${g.addr}`;
  const when = been ? `${g.dist}${a.last !== null ? ` · last climbed ${dayOf(a.last)}` : ''}` : gymOpen(g).line;
  return `<div class="gy${on ? ' on' : ''}">
      <button class="gy-main" type="button" data-act="to" data-to="gym/${i}">
        <img src="img/${g.img}.jpg" alt="">
        <span class="row-t"><strong>${g.name}${on ? '<span class="gy-tag">You’re here</span>' : ''}</strong><span>${what}</span><span>${when}</span></span>
      </button>
      <button class="gy-go" type="button" data-act="gymaps" data-i="${i}" aria-label="Directions to ${g.name}">${ic.pin}Directions</button>
    </div>`;
}
// the map: a real map (Leaflet with OpenStreetMap tiles, shown in grey to match the app). You are on the UIUC Main Quad; the gyms are
// placeholders put at their distance and bearing from you. The ring is the distance you picked, and the map fits it.
const HERE = [40.1075, -88.2272];
const gymLL = g => { const a = g.deg * Math.PI / 180; return [HERE[0] + g.mi * Math.cos(a) / 69, HERE[1] + g.mi * Math.sin(a) / (69 * Math.cos(HERE[0] * Math.PI / 180))]; };
let gmap = null;
function gymMap(top, count) {
  return `<div class="gmap" id="gmap">${window.L ? '' : '<p class="gm-off">The map needs an internet connection. The list works without one.</p>'}</div>
    <div class="gm-top" id="gmtop">${top}</div>
    <div class="gm-bot" id="gmcard" data-count="${count}">${gymPinCard(count)}</div>`;
}
const gymPinCard = (count = $('gmcard')?.dataset.count) => gymPin !== null ? `<div class="gy-list gm-card">${gymCard(gyms[gymPin], gymPin)}</div>`
  : `<p class="gm-hint"><span>${count}</span><span>Tap a gym on the map to see it.</span></p>`;
// keep Leaflet's zoom buttons and credit clear of the card at the bottom
const gymPad = () => { const el = $('gmap'), c = $('gmcard'); if (el && c) el.style.setProperty('--gmb', `${c.offsetHeight + 34 + 8}px`); };
// after the page is drawn: build the map in its box. Tapping a pin only redraws the card, so the map stays where you left it.
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
    const pin = L.marker(gymLL(g), { title: `${g.name}, ${g.dist}`, icon: L.divIcon({ className: `gpin${isHere(i) ? ' on' : ''}${i === gymPin ? ' sel' : ''}`, html: `<i></i><b>${g.name}</b>`, iconSize: null }) }).addTo(gmap);
    pin.on('click', () => {
      gymPin = gymPin === i ? null : i;
      el.querySelectorAll('.gpin').forEach(p => p.classList.remove('sel'));
      if (gymPin !== null) pin.getElement().classList.add('sel');
      $('gmcard').innerHTML = gymPinCard();
      gymPad();
    });
  });
  gymPad();
  const top = $('gmtop').offsetHeight + 54, bot = $('gmcard').offsetHeight + 34;
  gmap.fitBounds(L.latLng(HERE).toBounds(gymR * 1609.34 * 2), { paddingTopLeft: [16, top], paddingBottomRight: [16, bot] });
}
const gymsNear = () => gyms.map((g, i) => [g, i]).sort((a, b) => a[0].mi - b[0].mi).filter(([g]) => g.mi <= gymR);
const gymCount = near => near.length ? `${n(near.length, 'gym', 'gyms')} within ${gymR} mi` : `none within ${gymR} mi`;
const gymChips = () => `<div class="fchips">${radii.map(r => `<button type="button" data-act="gyr" data-v="${r}" aria-pressed="${r === gymR}">${r} mi</button>`).join('')}</div>`;
function viewGyms() {
  const near = gymsNear();
  const top = `<div class="gm-row"><button class="bk" type="button" data-act="back" aria-label="Back">${ic.back}</button>${gymChips()}</div>`;
  return { bare: true, map: true, html: '', overlay: gymMap(top, gymCount(near)), after: () => drawGymMap(near) };
}

/* ---------- Gyms tab: the gyms you climb at first, then the others near you. Tap one for your routes there ---------- */
function viewGymsTab() {
  // five gyms in all, nearest first: no distance filter needed. The line on top is what the hours say right now
  const all = gyms.map((g, i) => [g, i]).sort((a, b) => a[0].mi - b[0].mi);
  const been = all.filter(([, i]) => { const a = atGym(i); return a.routes || a.videos; });
  const others = all.filter(([, i]) => !been.some(([, j]) => j === i)), open = gyms.filter(g => gymOpen(g).open).length;
  return { photo: 'wall1', html: `
    ${tabHead('Gyms')}
    <p class="sub-w">Champaign · ${open ? `${open} open now` : 'all closed now'}</p>
    <div class="fold"></div>
    ${been.length ? `<div class="hl2 dk2"><h2>Where you climb</h2><span class="hint2">your routes and videos</span></div>
    <div class="gy-list">${been.map(([g, i]) => gymCard(g, i)).join('')}</div>` : ''}
    <div class="hl2 dk2 gy-h"><h2>${been.length ? 'More near you' : 'Near you'}</h2>
      <button class="gy-mapb" type="button" data-act="to" data-to="gyms">${ic.pin}Map</button></div>
    <div class="gy-list">${others.map(([g, i]) => gymCard(g, i)).join('')}</div>
    <button class="link dk" type="button" data-act="to" data-to="setup/addgym">Can’t find it? Add your gym</button>` };
}

/* ---------- One gym: the gym first (where, how busy, how it grades), then what you've done here ---------- */
// only what we know: the address, the usual crowd from check-ins, the gym's grading, and your own climbs and videos here.
// no gym route list, no reset dates. Scan and Log are how routes get here.
const crowdHour = () => Math.min(22, Math.max(7, new Date().getHours()));
const hr = h => `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`;
function crowdBars(g) {
  const now = crowdHour();
  return `<div class="gc-bars" aria-label="How busy ${g.name} usually is, by hour">${g.crowd.map((v, k) =>
    `<i class="${k + 7 === now ? 'on' : ''}" style="height:${Math.round(8 + v * 92)}%"></i>`).join('')}</div>
    <div class="gc-ax"><span>7a</span><span>12p</span><span>5p</span><span>10p</span></div>`;
}
const fvOpen = new Set();
const fvDone = (() => { try { return JSON.parse(localStorage.getItem('chalk.track.v5.firstvisit') || '{}'); } catch { return {}; } })();
function firstVisit(g, at) {
  const shoes = g.has?.find(h => /shoe/i.test(h)), quiet = (() => { const h0 = crowdHour(), rest = g.crowd.map((v, k) => [v, k + 7]).filter(([, h]) => h >= h0 && g.hours?.[new Date().getDay()] && h < g.hours[new Date().getDay()][1]);
    return rest.length ? rest.reduce((p, q) => (q[0] < p[0] ? q : p))[1] : null; })();
  const steps = [
    ['waiver', 'Sign the waiver', `Gyms ask for one before your first climb. ${g.src ? 'It’s usually on their website.' : 'Ask at the desk.'}`],
    ['pass', 'Get a day pass', g.pass ? `${g.pass}, at the desk` : 'Ask at the desk'],
    ['shoes', 'Climbing shoes', shoes ? `${shoes}. Ask for your street size` : 'Ask at the desk if they rent shoes'],
    ['intro', 'Ask for a quick intro', 'Staff can show you how to fall and get down safely. Ask at the desk.'],
    ...(quiet != null ? [['when', 'Go when it’s quiet', `Today it’s usually quietest around ${hr(quiet)}m, from check-ins`]] : [])];
  const done = fvDone[at] || [], left = steps.filter(([k]) => !done.includes(k)).length;
  // all ticked: one line, which opens the list again
  if (!left && !fvOpen.has(at)) return `<section class="fvc" id="fv"><button class="fv-h fv-all" type="button" data-act="fvopen" data-g="${at}"><b>Your first visit</b><span>All set · Show</span></button></section>`;
  return `<section class="fvc" id="fv">
    <div class="fv-h"><b>Your first visit</b><span>${left ? `${left} of ${steps.length} left` : 'All set'}</span></div>
    ${steps.map(([k, h, s]) => `<button class="fv-r${done.includes(k) ? ' on' : ''}" type="button" data-act="fvtick" data-g="${at}" data-k="${k}" aria-pressed="${done.includes(k)}"><i aria-hidden="true"></i><span class="row-t"><strong>${h}</strong><span>${s}</span></span></button>`).join('')}
    ${g.src ? `<a class="b-ghost fv-site" href="https://${g.src}" target="_blank" rel="noopener">Waiver, passes and classes on ${g.src} ${ic.arr('#111111')}</a>` : ''}
    <p class="cap">Prices and rentals from ${g.src || 'the gym'}, Nov 2026.</p></section>`;
}
const gyAll = new Set();
// the gym page, KEKE's way: a small title, then two tabs. Videos: what people filmed here, newest first, by how long ago,
// then your own climbs here. Info: the gym's photos, open or closed, how it grades, the first-visit list, where it is,
// its week of hours and what a day costs, all from its website. Flat, no photo behind the page
let gyTab = null, gyFor = null, gyWhen = 'Past month';
// Routes tab: rtWall = the wall picked on the plan; the filters are chips that turn on and off (grade and colour cycle)
let rtWall = null, rtNew = false, rtTop = false, rtG = 0, rtC = 0;
const RT_G = [['All grades', () => true], ['V0–V2', g => g <= 2], ['V3–V4', g => g >= 3 && g <= 4], ['V5+', g => g >= 5]];
function planSvg(at, on, small) {
  const ws = PLAN[at] || [], rs = list().filter(r => gymAt(r) === at);
  return `<svg class="pl-svg${small ? ' sm' : ''}" viewBox="0 0 320 200" aria-label="${gyms[at].name} floor plan">
    <path class="pl-out" d="M16 14h288v120l-30 52H16z"/><path class="pl-in" d="M120 70h90l14 20-14 20h-90z"/>
    ${ws.map(([w, x, y]) => { const k = rs.filter(r => r.wall === w).length, sel = on === w;
      return `<g class="pl-pin${sel ? ' on' : ''}${on && !sel ? ' dim' : ''}"${small ? '' : ` data-act="rtwall" data-w="${w}" role="button" aria-label="${w}, ${k} routes"`}>
        <circle cx="${x}" cy="${y}" r="${small ? 11 : 15}"/>${small ? '' : `<text x="${x}" y="${y + 5}" text-anchor="middle">${k}</text><text class="pl-l" x="${x}" y="${y + 30}" text-anchor="middle">${w}</text>`}</g>`; }).join('')}</svg>`;
}
function routesTab(at, inline) {
  const all = list().map((r, i) => [r, i]).filter(([r]) => gymAt(r) === at);
  const colours = [...new Set(all.map(([r]) => r.color))];
  const pick = all.filter(([r]) => (!rtWall || r.wall === rtWall) && (!rtNew || (r.set ?? 99) <= 7) && (!rtTop || ascOf(r).stars >= 4.2)
    && RT_G[rtG][1](r.g) && (!rtC || r.color === colours[rtC - 1]))
    // yours first. On the log page the order is fixed when you open it, so a row you just logged doesn't jump from under your finger
    .sort((p, q) => { const w = r => inline ? (lgPin?.has(r) ? 0 : 1) : book[TODAY]?.get(r) ? 0 : known(r) ? 1 : 2; return w(p[0]) - w(q[0]) || p[0].g - q[0].g; });
  const yours = pick.filter(([r]) => inline ? lgPin?.has(r) : book[TODAY]?.get(r) || known(r)).length;
  const chip = (act, on, label) => `<button type="button" data-act="${act}" aria-pressed="${on}">${label}</button>`;
  const row = ([r, i]) => { const a = ascOf(r), open = inline && lgOpen === i, e = book[TODAY]?.get(r);
    if (inline) return `<div class="rt-w${open ? ' on' : ''}" data-i="${i}"><span class="sw-l" aria-hidden="true">${ic.check}Send</span><span class="sw-r" aria-hidden="true">Attempt +1</span><button class="rt" type="button" data-act="lgopen" data-i="${i}" aria-expanded="${open}"><img src="img/${r.img}.jpg" alt="" loading="lazy">
      <span class="row-t"><strong>${sw(r)}${rname(r)}${(r.set ?? 99) <= 7 ? '<em class="rt-new">New</em>' : ''}</strong><span>${r.wall}</span>
        <span class="rt-m"><span class="num">★ ${a.stars.toFixed(1)}</span> · ${n(a.n, 'ascent', 'ascents')}${e?.sent ? ` · <b>${e.style} today</b>` : e?.tries ? ` · <b>${n(e.tries, 'attempt', 'attempts')} today</b>` : r.topped ? ' · <b>You topped it</b>' : r.tries ? ` · <b>You: ${n(r.tries, 'try', 'tries')}</b>` : ''}</span></span>
        ${e?.sent ? `<span class="lgb-v on">${ic.check}</span>` : ''}</button>
      ${open ? `<div class="rt-act"><button class="b-lime" type="button" data-act="rsend" data-r="${i}">Log send</button><button class="b-ghost" type="button" data-act="rtry" data-r="${i}">Attempt${e?.tries ? ` · ${e.tries}` : ''}</button>
        <button class="rt-more" type="button" data-act="to" data-to="route/${i}" aria-label="Open ${rname(r)}">${ic.arr('#111111')}</button></div>` : ''}
      ${e?.sent && !e.novid && !clips.some(c => c.r === r) ? `<div class="rt-vid"><span>Got a video of the send? Spotter reads your moves from it.</span>
        <span class="rt-vb"><button type="button" data-act="film" data-r="${i}">${ic.rec}Film</button><button type="button" data-act="upload">From Photos</button><button class="rt-x" type="button" data-act="lgnovid" data-i="${i}" aria-label="No video">✕</button></span></div>` : ''}</div>`;
    return `<button class="rt" type="button" data-act="to" data-to="route/${i}"><img src="img/${r.img}.jpg" alt="" loading="lazy">
      <span class="row-t"><strong>${sw(r)}${rname(r)}${(r.set ?? 99) <= 7 ? '<em class="rt-new">New</em>' : ''}</strong><span>${r.wall}</span>
        <span class="rt-m"><span class="num">★ ${a.stars.toFixed(1)}</span> · ${n(a.n, 'ascent', 'ascents')}${r.topped ? ' · <b>You topped it</b>' : r.tries ? ` · <b>You: ${n(r.tries, 'try', 'tries')}</b>` : ''}</span></span>${ic.arr('#111111')}</button>`; };
  const lv = levels[setup.level] || levels[1], fit = r => r.g >= Math.max(0, lv.hi - 1) && r.g <= lv.hi;
  const mineP = inline ? pick.filter(([r]) => lgPin?.has(r)) : [], forYou = inline && user === 'new' ? pick.filter(([r]) => !lgPin?.has(r) && fit(r)).slice(0, 4) : [];
  const restP = inline ? pick.filter(p => !mineP.includes(p) && !forYou.includes(p)) : [];
  const sec = (k, label, ps, fold) => ps.length ? `<button class="rt-sec" type="button" data-act="lgfold" data-k="${k}" aria-expanded="${!lgFold.has(k)}">${label}<span>${ps.length}</span><i aria-hidden="true">${lgFold.has(k) ? '▸' : '▾'}</i></button>${lgFold.has(k) ? '' : ps.map(row).join('')}` : '';
  const grouped = inline ? `<div class="rts">${sec('you', `For you · ${lv.g}`, forYou)}${sec('mine', 'Yours', mineP)}
      ${[['V0–V1', g => g <= 1], ['V2–V3', g => g >= 2 && g <= 3], ['V4–V5', g => g >= 4 && g <= 5], ['V6+', g => g >= 6]].map(([k, f]) => sec(k, k, restP.filter(([r]) => f(r.g)))).join('')}</div>` : '';
  const tip = inline && user === 'new' && !lgTipOff ? `<div class="lg-tip"><b>New to logging?</b>
      <p><b>Attempt</b>: a go that didn’t reach the top. <b>Send</b>: you topped it. A send is a <b>Flash</b> on your first go, a <b>Redpoint</b> after trying before.</p>
      <p>Routes around your level (${lv.g}) are first.</p><button class="rt-x" type="button" data-act="lgtip" aria-label="Got it">✕</button></div>` : '';
  const list2 = inline ? (pick.length ? grouped : '<p class="cap">No routes match. Turn a filter off.</p>') : pick.length ? `<div class="rts">${pick.map((p, k) => (inline && yours && (k === 0 || k === yours) ? `<p class="rt-sec">${k === 0 ? 'Yours' : 'All routes'}</p>` : '') + row(p)).join('')}</div>` : '<p class="cap">No routes match. Turn a filter off.</p>';
  if (inline) return `
    <div class="pl-box sm2">${planSvg(at, rtWall)}</div>
    <div class="rt-stick">
      <div class="rt-h">${rtWall ? `<b>${rtWall}</b><button class="rt-x" type="button" data-act="rtwall" data-w="" aria-label="Show every wall">✕</button>` : `<b>Every wall</b>`}<span class="hint2">${n(pick.length, 'route', 'routes')}</span>
        <button class="lg-snap" type="button" data-act="lgsnap">${ic.scan}Snap a tag</button></div>
      <div class="rt-f">${chip('rtnew', rtNew, 'New')}${chip('rttop', rtTop, 'Classics')}${chip('rtg', rtG > 0, `${RT_G[rtG][0]} ▾`)}${chip('rtc', rtC > 0, rtC ? `${colours[rtC - 1]} ▾` : 'Colour ▾')}</div>
    </div>
    ${tip}
    <p class="rt-tip">Swipe right on a route to log a send, left for an attempt. Tap it for more.</p>
    ${list2}
    <p class="cap">Sample routes. In the real app the gym’s setters keep this list current, so a wall that’s reset shows its new routes.</p>`;
  return `
    <div class="pl-box">${planSvg(at, rtWall)}</div>
    <div class="rt-h">${rtWall ? `<b>${rtWall}</b><button class="rt-x" type="button" data-act="rtwall" data-w="" aria-label="Show every wall">✕</button>` : `<b>Every wall</b>`}<span class="hint2">${n(pick.length, 'route', 'routes')}</span></div>
    <div class="rt-f">${chip('rtnew', rtNew, 'New')}${chip('rttop', rtTop, 'Classics')}${chip('rtg', rtG > 0, `${RT_G[rtG][0]} ▾`)}${chip('rtc', rtC > 0, rtC ? `${colours[rtC - 1]} ▾` : 'Colour ▾')}</div>
    ${pick.length ? `<div class="rts">${pick.map(row).join('')}</div>` : '<p class="cap">No routes match. Turn a filter off.</p>'}
    <p class="cap">Sample routes. In the real app the gym’s setters keep this list current, so a wall that’s reset shows its new routes.</p>`;
}
const GY_WHEN = ['Today', 'Past week', 'Past month', 'All time'], GY_DAYS = { Today: 1, 'Past week': 7, 'Past month': 31, 'All time': 1e9 };
const daysAgo = w => /just now|min ago|h ago/i.test(w) ? 0 : /yesterday/i.test(w) ? 1 : +(w.match(/(\d+) day/)?.[1] ?? (w.match(/(\d+) w/) ? w.match(/(\d+) w/)[1] * 7 : 30));
// the week of hours, Monday first, days with the same hours in one line: "Mon–Fri  3 PM – 10 PM"
function weekHours(g) {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], order = [1, 2, 3, 4, 5, 6, 0], out = [];
  order.forEach(d => { const h = g.hours[d], k = h ? h.join('-') : 'x', last = out[out.length - 1];
    if (last && last.k === k) last.to = d; else out.push({ k, from: d, to: d, h }); });
  return out.map(o => `<div class="gy-l"><span>${o.from === o.to ? names[o.from] : `${names[o.from]}–${names[o.to]}`}</span><b class="num">${o.h ? `${clock(o.h[0])} – ${clock(o.h[1])}` : 'Closed'}</b></div>`).join('');
}
function viewGym(a) {
  const at = a !== '' && gyms[+a] ? +a : gi, g = gyms[at], l = list(), m = mine().filter(r => gymAt(r) === at), sz = sizes(m.length);
  const vids = clips.filter(c => (c.gym ?? gi) === at).sort((x, y) => y.k - x.k), here = isHere(at);
  const mineHere = m.length || vids.length;
  if (gyFor !== at) { gyFor = at; gyTab = mineHere ? 'videos' : 'info'; rtWall = null; rtNew = rtTop = false; rtG = rtC = 0; }
  const tiles = m.map(r => [r, l.indexOf(r)]).map(([r, i], k) => `<div class="lt pt ${sz[k]}">
      <img src="img/${r.img}.jpg" alt=""><span class="shade"></span>
      <button class="pt-open" type="button" data-act="route" data-i="${i}" aria-label="${r.color} ${r.grade}: how to climb it and your tries"></button>
      <span class="pk-tag">${sw(r)}${r.color} ${r.grade}</span>
      <span class="pt-b">${routeNum(r, sz[k].includes('tall'))}</span>
      <button class="pj${r.proj ? ' on' : ''}" type="button" data-act="proj" data-i="${i}" aria-pressed="${!!r.proj}">${r.proj ? 'Trying again' : '+ Try again'}</button>
    </div>`).join('');
  const live = session === 'live' && here, op = gymOpen(g);
  // the community at this gym: every public post filmed here, newest first as the feed has them
  const posts = feedAll().map((p, i) => [p, i]).filter(([p]) => !p.gym && (p.g ?? gi) === at && p.who !== 'You');
  const tday = posts.filter(([p]) => daysAgo(p.when) === 0), people = [...new Set(tday.map(([p]) => p.who))];
  const face = w => PEOPLE[w]?.img ? `<img src="img/${PEOPLE[w].img}.jpg" alt="">` : avatar(w);
  const who = people.length ? `<div class="gy-who gy-who2">
      <span class="gy-avs">${people.slice(0, 6).map(w => `<button type="button" data-act="to" data-to="person/${w}" aria-label="${w}’s page">${face(w)}</button>`).join('')}</span>
      <span><b>Here today</b>${people.filter(w => follows[user].has(w)).length ? ` · ${people.filter(w => follows[user].has(w)).join(' and ')} you follow` : ''}</span></div>` : '';
  const act = here ? `<button class="b-lime gy-cta" type="button" data-act="gyfilm" data-g="${at}">${ic.rec}Film a try</button>`
    : `<button class="b-lime gy-cta" type="button" data-act="gyset" data-i="${at}">I’m here</button>`;

  // Videos
  const shown = posts.filter(([p]) => daysAgo(p.when) < GY_DAYS[gyWhen]);
  const tile = ([p, i]) => `<button class="vt" type="button" data-act="to" data-to="beta/${at}-${i}" aria-label="Watch ${p.who}: ${p.what}">
      <img src="img/${p.still || p.img}.jpg" alt="" loading="lazy"><span class="shade"></span><span class="vt-t">${p.what.split(' ').slice(1).join(' ')}</span><span class="vt-g"><span>${p.who}</span><span>${p.when}</span></span></button>`;
  const days = new Set(vids.map(c => c.k)).size, tops = new Set(vids.filter(c => c.sent && c.r).map(c => c.r)).size;
  const stats = vids.length ? `<div class="gy-st gy-st2"><span><b>${days}</b>${days === 1 ? 'visit' : 'visits'}</span><span><b>${tops}</b>${tops === 1 ? 'route topped' : 'routes topped'}</span><span><b>${dayOf(vids[0].k)}</b>last climbed</span></div>` : '';
  const videosTab = `
    ${who}
    <div class="gy-tools"><button class="gy-when" type="button" data-act="gywhen">${gyWhen} <span aria-hidden="true">▾</span></button><span class="hint2">${n(shown.length, 'video', 'videos')} · public</span></div>
    ${shown.length ? `<div class="vg">${shown.map(tile).join('')}</div>`
      : `<div class="gy-empty"><b>No videos from here ${gyWhen === 'All time' ? 'yet' : gyWhen === 'Today' ? 'today' : `in the ${gyWhen.toLowerCase()}`}</b>
        <span>Post one of your sends. It might help someone stuck on the same route.</span>${gyWhen !== 'All time' && posts.length ? `<button class="b-ghost" type="button" data-act="gywhenall">See all ${n(posts.length, 'video', 'videos')}</button>` : act}</div>`}
    <div class="hl2 dk2"><h2>Your climbs here</h2><span class="hint2">${mineHere ? [m.length && n(m.length, 'route', 'routes'), vids.length && n(vids.length, 'video', 'videos')].filter(Boolean).join(' · ') : 'nothing yet'}</span></div>
    ${stats}
    ${m.length ? `<div class="lb">${tiles}</div>` : ''}
    ${vids.length ? `<div class="vg gy-vg">${byRoute(vids).slice(0, 6).map(vtile).join('')}</div>` : ''}
    ${mineHere ? '' : '<p class="cap">Routes you film, scan or log here show up here.</p>'}
    <div class="stack old">
      <button class="row" type="button" data-act="scan" data-g="${at}">${ic.scan}<span class="row-t"><strong>Scan a wall</strong><span>Photo a route. We read its tape and grade and draw the moves for your height.</span></span>${ic.arr('#111111')}</button>
      <button class="row" type="button" data-act="log" data-g="${at}">${ic.add}<span class="row-t"><strong>Log a climb</strong><span>Climbed one without a video? Pick it from this gym’s routes and log an attempt or a send.rade.</span></span>${ic.arr('#111111')}</button>
    </div>`;

  // Info
  const pics = [g.img || 'wall2', ...(g.pics || [])];
  const carousel = `<div class="gy-car" id="gycar">${pics.map(p => `<img src="img/${p}.jpg" alt="">`).join('')}</div>
    ${pics.length > 1 ? `<div class="gy-dots" id="gydots">${pics.map((_, k) => `<i${k ? '' : ' class="on"'}></i>`).join('')}</div>` : ''}`;
  const today = g.hours?.[new Date().getDay()];
  const tiles2 = `<div class="gy-2">
      <div class="gy-t"><span class="${op.open ? 'on' : 'off'}">${op.open ? 'Open now' : 'Closed now'}</span><b class="num">${today ? `${clock(today[0])} – ${clock(today[1])}` : g.hours ? 'Closed today' : '—'}</b></div>
      <div class="gy-t"><span>Grades</span><b>${Array.isArray(g.grading) ? 'Colours' : g.grading === 'tag' ? 'V grade tags' : '—'}</b></div></div>
    ${Array.isArray(g.grading) ? `<div class="gr-c">${g.grading.map(([c, hex, v]) => `<span><i style="background:${hex}"></i><b>${c}</b>${v}</span>`).join('')}</div>` : ''}`;
  const h0 = crowdHour(), rest = g.crowd.map((v, k) => [v, k + 7]).filter(([, h]) => h > h0);
  const calm = rest.length ? rest.reduce((p, q) => (q[0] < p[0] ? q : p)) : null;
  const tip = calm && calm[0] < g.crowd[h0 - 7] - .1 ? ` · quietest later: ${hr(calm[1])}m` : '';
  const busy = !op.open ? '' : `<section class="gc"><span class="gc-h"><b>${op.busy}</b> now${tip}</span>${crowdBars(g)}
      <span class="sub">Usually, from check-ins over the last 4 weeks</span></section>`;
  const fv = !mineHere ? firstVisit(g, at) : '';
  const where = `<div class="gy-ab gy-wh">
      ${g.addr ? `<div class="gy-ad">${ic.pin}<span><b>${g.addr}</b><button class="gy-lk" type="button" data-act="gymaps" data-i="${at}">Directions · ${g.dist} ↗</button></span>
        <button class="gy-cp" type="button" data-act="gycopy" data-i="${at}" aria-label="Copy the address">Copy</button></div>` : ''}
      ${g.src ? `<a class="gy-ad gy-web" href="https://${g.src}" target="_blank" rel="noopener"><span><b>${g.src}</b><span>Waiver, passes and classes</span></span><span aria-hidden="true">↗</span></a>` : ''}</div>`;
  const has = g.has || [], more = has.length - 3, all = gyAll.has(at);
  const first = !mineHere, passHere = g.pass && (!first || (fvDone[at] || []).includes('pass'));
  const week = `<div class="gy-ab">
      <div class="gy-sh">Hours</div>
      ${g.hours ? weekHours(g) : '<p class="cap">This gym hasn’t added its hours yet.</p>'}
      ${passHere ? `<div class="gy-sh">Day pass</div><div class="gy-l gy-l1"><b>${g.pass}</b></div>` : ''}
      ${has.length ? `<div class="gy-sh">Here</div><div class="gy-has">${(all ? has : has.slice(0, 3)).map(h => `<span>${h}</span>`).join('')}${more > 0 && !all ? `<button type="button" data-act="gyhas" data-g="${at}">+${more}</button>` : ''}</div>` : ''}
      <p class="cap">${g.note ? `${g.note} ` : ''}${g.src ? `From ${g.src}, Nov 2026.` : ''}</p></div>`;
  const infoTab = `${carousel}${tiles2}${busy}${fv}${where}${week}`;

  return { html: `
    ${bar(g.name)}
    ${here || live ? `<p class="gy-op on gy-op2"><i></i>${live ? 'You’re climbing here' : 'You’re here'}</p>` : ''}
    <div class="gy-tabs" role="tablist">${[['videos', 'Videos'], ['routes', 'Routes'], ['info', 'Info']].map(([k, w]) => `<button type="button" role="tab" data-act="gytab" data-v="${k}" aria-selected="${gyTab === k}"><span>${w}</span></button>`).join('')}</div>
    ${gyTab === 'videos' ? videosTab : gyTab === 'routes' ? routesTab(at) : infoTab}
    ${act}`, after: () => {
      const car = $('gycar'), dots = $('gydots'); if (!car || !dots) return;
      car.addEventListener('scroll', () => { const k = Math.round(car.scrollLeft / (car.firstElementChild.offsetWidth + 8));
        [...dots.children].forEach((d, j) => d.classList.toggle('on', j === k)); }, { passive: true });
    } };
}

// AI 1 · photo of a wall: we read the tape colour and the grade on the gym's tag, then draw the moves on the photo, planned for your height and arm span
const scanned = { color: 'Purple', hex: '#8E5BD8', grade: 'V2', g: 2, wall: 'Wall C', img: 'wall2', tries: 0, moves: 5, highs: [], by: 4, videos: 2, daysLeft: 18,
  short: 'Big pinches low, small crimps near the top. Turn your left hip in on move 4 and save your arms for the last reach.' };
// the route's holds (photo coordinates, 300 × 400), its foot chips, and the beta: which hand or foot goes where, in order
const sHolds = [[150, 352], [118, 300], [168, 248], [128, 190], [176, 132], [150, 70]];
const sFeet = [[128, 392], [172, 384], [120, 336], [176, 300], [140, 240]];
const sBeta = [
  { h: 0, f: [0, 1], t: 'Start', d: 'Both hands on the big pinch, feet on the two low chips. Sit back, arms straight.' },
  { h: 1, hand: 'L', f: [2], t: 'Left hand to the pinch', d: 'Step your left foot up first, then reach. Stand up through your legs.' },
  { h: 2, hand: 'R', f: [3], t: 'Right hand to the jug', d: 'Right foot onto the chip by your knee, then the jug is a short reach.' },
  { h: 3, hand: 'L', f: [4], t: 'Left hand to the crimp', d: 'Turn your left hip into the wall. The crimp comes to you; don’t pull with bent arms.' },
  { h: 4, hand: 'R', f: [4], t: 'Right hand to the sloper', d: '' },
  { h: 5, hand: 'B', f: [], t: 'Top: both hands', d: 'Match the top hold and hold it for 3 seconds. Climb down, or drop with bent knees.' }
];
let shot = false, bstep = 0;
// a scanned route joins the gym's list the first time you do something with it; returns its place in the list
const onList = r => { if (!list().includes(r)) { r.gym = gi; list().push(r); } return list().indexOf(r); };
function viewScan() {
  const dim = [[60, 330], [250, 310], [40, 240], [230, 220], [80, 150], [250, 120], [210, 40], [50, 70], [270, 360], [96, 380]];
  const corners = '<path d="M14 44V14h30M256 14h30v30M286 356v30h-30M44 386H14v-30" fill="none" stroke="#FFFFFF" stroke-width="2"/>';
  // before the photo: frame the whole route, start hold to top
  if (!shot) return { photo: 'wall2', html: `
    ${bar('Scan a wall')}
    <div class="cam">
      <img src="img/wall2.jpg" alt="Wall C through the camera"><svg viewBox="0 0 300 400" aria-hidden="true">${corners}</svg>
      <p class="scan-aim">Fit one route in the frame, from the start hold to the top. Include its tag if you can see it.</p>
      <button class="shut scan-shut" type="button" data-act="snap" aria-label="Take the photo"><i></i></button>
    </div>
    <div class="fold"></div>
    <p class="cap">We read the tape colour and the grade on the gym’s tag, then draw the moves on your photo, planned for ${myH()} cm.</p>` };
  // the reach on move 5 sets the beta: short climbers get a foot first, tall ones go straight
  const span = mySpan(), reach = 172, long = span < reach + 4;
  sBeta[4].d = long ? `The longest reach, ${reach} cm. At ${span} cm arm span, high-step your right foot onto the chip first, then go.` : `The longest reach, ${reach} cm. Your ${span} cm arm span gets there from the jug: keep your arm straight.`;
  const s = sBeta[bstep], prev = sBeta[Math.max(0, bstep - 1)];
  const pt = ([x, y]) => `${x} ${y}`;
  // numbered hand holds (number = the move that reaches it), foot chips as small squares; the current move is filled
  const svg = `<svg viewBox="0 0 300 400" aria-hidden="true">
      ${dim.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.25)"/>`).join('')}
      <path d="M${sHolds.map(pt).join(' L')}" fill="none" stroke="rgba(221,242,106,.5)" stroke-width="1.5" stroke-dasharray="4 5"/>
      ${bstep ? `<path d="M${pt(sHolds[prev.h])} L${pt(sHolds[s.h])}" stroke="#DDF26A" stroke-width="3" stroke-linecap="round"/>` : ''}
      ${sFeet.map(([x, y], i) => `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" rx="2" fill="${s.f.includes(i) ? '#FFFFFF' : 'rgba(255,255,255,.12)'}" stroke="#FFFFFF" stroke-width="1.5"/>`).join('')}
      ${sHolds.map(([x, y], i) => { const on = i === s.h, done = i < s.h;
        return `<circle cx="${x}" cy="${y}" r="${on ? 14 : 11}" fill="${on ? '#DDF26A' : done ? 'rgba(221,242,106,.45)' : 'rgba(17,17,17,.55)'}" stroke="#DDF26A" stroke-width="2.5"/>
        <text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="12" font-weight="700" fill="${on ? '#111111' : '#FFFFFF'}">${i ? i : 'S'}</text>`; }).join('')}
      ${s.hand ? `<text x="${sHolds[s.h][0] + 20}" y="${sHolds[s.h][1] + 4}" font-size="12" font-weight="700" fill="#DDF26A">${{ L: 'Left hand', R: 'Right hand', B: 'Both hands' }[s.hand]}</text>` : ''}
    </svg>`;
  return { photo: 'wall2', html: `
    ${bar('Scan a wall')}
    <div class="cam">
      <img src="img/wall2.jpg" alt="Wall C, the purple route with its moves drawn on">${svg}
      <span class="pk-tag scan-tag">${sw(scanned)}Purple ${scanned.grade} · ${scanned.moves} moves</span>
    </div>
    <section class="glass bst">
      <div class="bst-h"><span class="lt-h">${bstep ? `Move ${bstep} of ${sBeta.length - 1}` : 'Before you start'}</span>
        <span class="fr-ctl"><button type="button" data-act="bstep" data-d="-1" aria-label="Previous move"${bstep ? '' : ' disabled'}>‹</button><button type="button" data-act="bstep" data-d="1" aria-label="Next move"${bstep < sBeta.length - 1 ? '' : ' disabled'}>›</button></span></div>
      <p class="bst-t">${s.t}</p><p class="bst-d">${s.d}</p>
      <div class="bst-dots">${sBeta.map((_, i) => `<button type="button" data-act="bgo" data-i="${i}" aria-label="${i ? `Move ${i}` : 'Start'}" aria-current="${i === bstep}">${i || 'S'}</button>`).join('')}</div>
    </section>
    <div class="fold"></div>
    <div class="lb">
      <div class="lt short"><span class="lt-h">Tape colour</span><span class="mv"><b>Purple</b><span class="mv-l">read from the tape on the holds</span></span></div>
      <div class="lt short"><span class="lt-h">Grade</span><span class="mv"><b>${scanned.grade}</b><span class="mv-l">read from the gym’s tag · ${scanned.wall}</span></span></div>
    </div>
    <div class="stack">
      <div class="lt"><span class="lt-h">Planned for you</span><p class="tip-d">${myH()} cm tall, ${span} cm arm span. ${long ? 'Move 5 is a stretch for you, so we add a high foot before it.' : 'Every move is in reach without extra feet.'}</p></div>
      <button class="row" type="button" data-act="scanbeta"><span class="row-t"><strong>Watch climbers your height on it</strong><span>${n(nearOf(scanned).length, 'climber', 'climbers')} your height topped it</span></span>${ic.arr('#111111')}</button>
      <button class="row" type="button" data-act="scanlog"><span class="row-t"><strong>Log it</strong><span>Purple ${scanned.grade} is filled in. Add how it went.</span></span>${ic.pen}</button>
    </div>`,
    // Retake if the photo missed the route; otherwise open it (beta, tries, Film try 1 all live on the route page)
    cta: `<button class="b-ghost" type="button" data-act="rescan">Retake</button><button class="b-lime" type="button" data-act="scanbeta">Open this route</button>` };
}

/* ---------- Route: pick a project, see beta from climbers your height ---------- */
// how a route's grade feels, from climbers who logged a send of it on Spotter (sample numbers, fixed per route), plus yours
function feelOf(r) {
  let s = 0; for (const ch of `${r.color}${r.grade}${r.wall}`) s = (s * 31 + ch.charCodeAt(0)) % 9973;
  const soft = 2 + s % 7, right = 3 + (s >> 3) % 8, hard = 1 + (s >> 6) % 5, sum = 3.4 + (s % 13) / 10;
  const c = { Soft: soft, 'Spot on': right, Hard: hard }; let st = sum * (soft + right + hard), k = soft + right + hard;
  if (r.feel) c[r.feel]++; if (r.stars) { st += r.stars; k++; }
  return { c, n: c.Soft + c['Spot on'] + c.Hard, stars: st / k };
}
function feelTile(r) {
  const f = feelOf(r), top = Object.entries(f.c).sort((a, b) => b[1] - a[1])[0][0];
  const say = top === 'Soft' ? `Most say it’s soft for a ${r.grade}` : top === 'Hard' ? `Most say it’s hard for a ${r.grade}` : `Most say it’s a fair ${r.grade}`;
  return `<div class="lt fl"><span class="lt-h">${say}</span>
    <span class="fl-b">${['Soft', 'Spot on', 'Hard'].map(k => `<i class="fl-${k === 'Spot on' ? 'ok' : k.toLowerCase()}" style="flex:${f.c[k]}"></i>`).join('')}</span>
    <span class="fl-k">${['Soft', 'Spot on', 'Hard'].map(k => `<span><b class="num">${f.c[k]}</b> ${k.toLowerCase()}</span>`).join('')}<span class="num">★ ${f.stars.toFixed(1)}</span></span>
    ${r.feel ? `<span class="cap">You said ${r.feel.toLowerCase()}${r.stars ? ` · ${'★'.repeat(r.stars)}` : ''}</span>` : ''}
    <span class="cap">From ${n(f.n, 'climber', 'climbers')} who logged a send on Spotter</span></div>`;
}
function viewRoute(i) {
  const l = list(), idx = l[+i] ? +i : l.indexOf(current()), r = l[idx];
  const hero = heroOf(r);
  const near = nearOf(r);
  const triesTile = r.tries ? `<div class="lt"><span class="lt-h">Your tries</span>
      <span class="trybars" aria-label="Highest move on each try">${r.highs.map((h, k) => `<span class="tb${k === r.highs.length - 1 ? ' last' : ''}" style="height:${(h / r.moves * 100).toFixed(0)}%"></span>`).join('')}</span>
      <span class="cap tb-l">Highest move on each of your ${r.tries} tries · the top is move ${r.moves}</span></div>
    <button class="row" type="button" data-act="compare"><span class="row-t"><strong>Compare your last try</strong><span>Side by side with someone your height who topped it</span></span>${ic.arr('#111111')}</button>` : '';
  return { photo: r.img, html: `
    ${bar(`${r.wall} · ${gyms[gymAt(r)].name}`)}
    <div class="pk solo">
      <img src="img/${r.img}.jpg" alt=""><span class="shade"></span>
      <span class="pk-tag">${sw(r)}${r.color} ${r.grade}</span>${r.proj ? '<span class="pk-on lilac">Saved to try again</span>' : ''}
      <span class="pk-b"><span class="pk-hero">${hero}</span><span class="pk-sub">${r.wall} · ${r.moves} moves${r.topped ? ' · topped' : r.tries ? ` · ${n(r.tries, 'try', 'tries')}` : ''}</span></span>
      ${r.topped ? '' : `<button class="pk-go" type="button" data-act="film" data-r="${idx}">${ic.rec}Film try ${r.tries + 1}</button>`}
    </div>
    <div class="fold"></div>
    <div class="rh">
      <div class="lt rh-h"><span class="lt-h">Your history</span>
        <span class="rh-r"><span>Attempts</span><b class="num">${r.tries || '–'}</b></span><span class="rh-r"><span>Sends</span><b class="num">${r.sendN || (r.topped ? 1 : '–')}</b></span></div>
      <button class="lt rh-m" type="button" data-act="rtmap" data-g="${gymAt(r)}" data-w="${r.wall}" aria-label="${r.wall} on the floor plan"><span class="lt-h">${r.wall}</span>${planSvg(gymAt(r), r.wall, true)}</button>
    </div>
    <div class="rh-a"><button class="b-lime" type="button" data-act="rsend" data-r="${idx}">Log send</button><button class="b-ghost" type="button" data-act="rtry" data-r="${idx}">Attempt</button></div>
    ${near.length ? `<div class="hl2 dk2"><h2>How climbers your height did it</h2><span class="hint2">${myH() - 5}–${myH() + 5} cm</span></div>
    <p class="cap">${n(near.length, 'climber', 'climbers')} your height topped it. Tap to watch.</p>` : `<div class="nb"><span class="nb-i" aria-hidden="true">i</span><span class="row-t"><strong>No beta yet</strong><span>${r.topped ? 'No one has posted a video of this route. Post your send and yours is the first.' : 'No one has posted a video of this route. Film a try and yours is the first.'}</span></span></div>`}
    <div class="betas">${near.map(b => `<button class="tile photo" type="button" data-act="play" data-who="${b.who}" data-len="${b.len}"><img src="img/${b.img}.jpg" alt=""><span class="shade"></span><span class="ic play">${ic.play}</span><b>${b.h}<small> cm</small></b><span class="sub">${b.who} · topped on try ${b.tries}</span></button>`).join('')}</div>
    <div class="stack">
      ${triesTile}
      ${feelTile(r)}
      <div class="lt"><span class="lt-h">How to climb it</span><p class="tip-d">${r.short}</p></div>
      ${r.proj ? '' : `<button class="row" type="button" data-act="proj" data-i="${idx}"><span class="row-t"><strong>Save to try again</strong><span>It stays first in Gym until you top it</span></span>${ic.plus}</button>`}
    </div>` };
}

/* ---------- Learn from the fall: compare, one tip and one drill, try again? ---------- */
function viewCompare() {
  const r = lastRoute || current() || list()[0];
  if (!r.highs.length) tried(r);
  const hi = Math.max(1, ...r.highs), s = beta.slice().sort((a, b) => Math.abs(a.h - myH()) - Math.abs(b.h - myH()))[0];
  const ticks = Array.from({ length: r.moves }, (_, k) => `<span class="${k + 1 === hi ? 'on' : k + 1 < hi ? 'done' : ''}">${k + 1}</span>`).join('');
  return { photo: 'woman1', html: `
    ${bar(`${r.color} ${r.grade} · try ${r.tries || 1}`)}
    <h1 class="hl">You and ${s.who}, move by move</h1>
    <div class="vs">
      <figure class="fr"><img src="img/woman2.jpg" alt="Your try"><figcaption>You · try ${r.tries || 1}</figcaption></figure>
      <figure class="fr"><img src="img/${s.img}.jpg" alt="${s.who}’s send"><figcaption>${s.who} · ${s.h} cm · topped</figcaption></figure>
    </div>
    <section class="glass scrub">
      <div class="mv-t" aria-label="Moves; you reached move ${hi}">${ticks}</div>
      <div class="fr-ctl"><button type="button" data-act="fr" data-d="-1" aria-label="Previous frame">‹</button><span class="num">Move ${hi} · frame ${frame} of 210</span><button type="button" data-act="fr" data-d="1" aria-label="Next frame">›</button></div>
    </section>
    <div class="fold"></div>
    <div class="hl2 dk2"><h2>What ${s.who} does on move ${hi}</h2></div>
    <div class="lb">
      <div class="lt short"><span class="lt-h">Time on it</span><span class="mv"><b>${r.senders} s</b><span class="mv-l">${s.who} · you took ${r.you} s</span></span></div>
      <div class="lt short"><span class="lt-h">Hips</span><span class="mv"><b>18 cm</b><span class="mv-l">closer to the wall than yours</span></span></div>
    </div>
    <div class="stack">
      <div class="lt"><span class="lt-h">One tip</span><p class="tip-d">Turn your hip into the wall before you reach for move ${hi}. ${s.who} does it, then the hold comes to them.</p></div>
    </div>
    <section class="ask-c">
      <h3>Try again now?</h3>
      <p>Your clip and the tip stay on ${r.color} ${r.grade}.</p>
      <div class="two"><button class="b-ghost" type="button" data-act="notnow">Not now</button><button class="b-lime" type="button" data-act="again">${ic.rec}Try again</button></div>
    </section>` };
}

/* ---------- End session: one summary, hide any climb ---------- */
function viewSummary() {
  const rows = [...today.entries()];
  const any = rows.some(([, e]) => !e.hidden && e.sent);
  // one photo tile per climb with its Public / Hidden toggle, then one tile saying who sees the sends
  const pub = rows.filter(([, e]) => e.sent && !e.hidden).length, hid = rows.filter(([, e]) => e.hidden).length;
  const sz = sizes(rows.length + 1);
  // a climb with a video from today opens that video (the latest try)
  const vid = r => clips.find(c => c.r === r && c.k === TODAY);
  const climbs = rows.map(([r, e], i) => `<div class="lt pt ${sz[i]}${e.hidden ? ' hid' : ''}">
      <img src="img/${r.img}.jpg" alt=""><span class="shade"></span>
      ${vid(r) ? `<button class="pt-open" type="button" data-act="to" data-to="clip/${vid(r).id}" aria-label="${r.color} ${r.grade}: open the video"></button><span class="pt-play">${ic.play}</span>` : ''}
      <span class="pk-tag">${sw(r)}${r.color} ${r.grade}</span>
      <span class="pt-b">${e.sent ? `<b>Topped</b><span>on try ${r.tries}</span>` : r.mine ? `<b>${e.tries}</b><span>${e.tries === 1 ? 'try' : 'tries'} by hand</span>`
        : `<b>${Math.max(0, ...r.highs)}<small>/${r.moves}</small></b><span>highest move</span>`}</span>
      <button class="vis${e.hidden ? ' off' : ''}" type="button" data-act="hide" data-i="${i}" aria-pressed="${e.hidden}">${e.hidden ? `${ic.eyeOff}Hidden` : `${ic.eye}Public`}</button>
    </div>`).join('');
  const who = `<div class="lt short ${sz[rows.length]}"><span class="lt-h">Who sees it</span>
      ${user === 'regular' ? '<span class="avs"><img src="img/man1.jpg" alt="Alex"><img src="img/woman1.jpg" alt="Jo"></span>' : ''}
      <span class="mv"><b>${n(pub, 'send', 'sends')}</b><span class="mv-l">${user === 'regular' ? 'to Alex and Jo’s feed' : `to the ${gyms[gi].name} feed`}${hid ? ` · ${hid} hidden` : ''}</span></span></div>`;
  return { photo: 'woman2', html: `
    <h1 class="hl tab">${posted ? 'Session posted' : 'Session saved'}</h1>
    <p class="sub-w">${gyms[gi].name} · ${dateOf(TODAY).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
    <section class="glass trio"><div><b class="num">${fmt(secs)}</b><span>time</span></div><div><b class="num">${tries}</b><span>${tries === 1 ? 'try' : 'tries'}</span></div><div><b class="num">${tops}</b><span>${tops === 1 ? 'send' : 'sends'}</span></div></section>
    <div class="fold"></div>
    <div class="hl2 dk2"><h2>Hide any climb?</h2></div>
    <p class="cap">Sends post to your profile and friends’ feed, where friends can comment. Hidden climbs and their videos stay private. Tap a climb to watch it.</p>
    ${rows.length ? `<div class="lb">${climbs}${who}</div>`
      : '<div class="row"><span class="row-t"><strong>No tries recorded</strong><span>Next time, tap Film on the route card before each try and they show up here.</span></span></div>'}`,
    cta: `<button class="b-lime" type="button" data-act="post">${any && !posted ? 'Post and finish' : 'Done'}</button>` };
}

/* ---------- Over time: Profile, with your progress (a tab, and your photo on every tab) ---------- */
// 12 weeks: the 11 before this one, then this week. Day 0 is the Monday 11 weeks ago; TODAY is today
const TODAY = 77 + (new Date().getDay() + 6) % 7;
const DAY0 = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() - TODAY); })();
const dateOf = k => new Date(DAY0.getFullYear(), DAY0.getMonth(), DAY0.getDate() + k);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function visitDays() {
  const v = new Set();
  if (user === 'regular') for (let w = 0; w < 11; w++) { if (w % 2 === 0) v.add(w * 7 + 3); if (w % 3 !== 2) v.add(w * 7 + 5); if (w % 4 === 1) v.add(w * 7 + 1); }
  else roll.filter(x => x.added).forEach(x => v.add(x.k));
  if (session === 'saved') v.add(TODAY);
  return v;
}
// the logbook: per day, per route, how many attempts and whether you sent it (and how). Attempt and Log send write here
const book = {};   // day (TODAY-relative) -> Map(route -> { tries, sent, style })
const bookOf = (k, r) => { const m = book[k] = book[k] || new Map(); if (!m.has(r)) m.set(r, { tries: 0, sent: false, style: '' }); return m.get(r); };
if (user === 'regular') { const [y, b, rd] = data.regular; Object.assign(bookOf(TODAY - 2, y), { tries: 3 }); Object.assign(bookOf(TODAY - 2, b), { tries: 2 });
  Object.assign(bookOf(TODAY - 5, y), { tries: 3 }); Object.assign(bookOf(TODAY - 5, rd), { tries: 2 }); Object.assign(bookOf(TODAY - 5, b), { tries: 1 }); }
let bookAt = TODAY;
function logbook() {
  const m = book[bookAt] || new Map(), es = [...m.entries()].filter(([, e]) => e.tries || e.sent);
  const sends = es.filter(([, e]) => e.sent).length, att = es.reduce((s, [, e]) => s + e.tries, 0), d = dateOf(bookAt);
  const days = Object.keys(book).map(Number).filter(k => [...book[k].values()].some(e => e.tries || e.sent)).sort((p, q) => p - q);
  const prev = days.filter(k => k < bookAt).pop(), next = days.find(k => k > bookAt) ?? (bookAt < TODAY ? TODAY : undefined);
  return `<section class="lgb">
    <div class="lgb-d"><button type="button" data-act="bkd" data-k="${prev ?? ''}"${prev == null ? ' disabled' : ''} aria-label="Day before">${ic.back}</button>
      <span><b>${d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}</b><span>${bookAt === TODAY ? 'Today' : TODAY - bookAt === 1 ? 'Yesterday' : `${TODAY - bookAt} days ago`}</span></span>
      <button type="button" data-act="bkd" data-k="${next ?? ''}"${next == null ? ' disabled' : ''} aria-label="Day after">${ic.back}</button></div>
    <div class="lgb-s"><span><b class="num">${sends}</b>Sends</span><span><b class="num">${att}</b>Attempts</span><span><b class="num">${att ? Math.round(sends / att * 100) + '%' : '–'}</b>Tops rate</span></div>
    ${es.length ? es.map(([r, e]) => `<button class="lgb-r" type="button" data-act="to" data-to="route/${list().indexOf(r)}">${sw(r)}<span class="row-t"><strong>${rname(r)}</strong><span>${gyms[gymAt(r)].name} · ${r.wall}</span></span>
      <span class="lgb-v${e.sent ? ' on' : ''}">${e.sent ? `${ic.check}${e.style || 'Sent'}` : n(e.tries, 'attempt', 'attempts')}</span></button>`).join('')
      : `<p class="cap">${bookAt === TODAY ? 'Nothing logged today. On a route, tap Attempt or Log send.' : 'Nothing logged this day.'}</p>`}
  </section>`;
}
function viewProfile() {
  const reg = user === 'regular', v = visitDays();
  const sends = Object.fromEntries(Object.entries(sendsBy()).map(([g, k]) => ['V' + g, k]));
  const total = Object.values(sends).reduce((a, b) => a + b, 0);
  const grades = ['V0', 'V1', 'V2', 'V3', 'V4'], max = Math.max(1, ...Object.values(sends));
  const top = grades.filter(g => sends[g]).pop();
  // a month's name over the week it starts in
  const months = Array.from({ length: 12 }, (_, w) => { const d = [0, 1, 2, 3, 4, 5, 6].map(x => dateOf(w * 7 + x)), first = k => [0, 1, 2, 3, 4, 5, 6].some(x => dateOf(k * 7 + x).getDate() === 1), at = d.find(x => x.getDate() === 1) || (w === 0 && !first(1) ? d[0] : null);   // the first column only when the next week doesn't start a month
    return `<span>${at ? at.toLocaleDateString('en-US', { month: 'short' }) : ''}</span>`; }).join('');
  const cells = Array.from({ length: 84 }, (_, k) => `<i class="${k > TODAY ? 'f' : v.has(k) ? 'v' : ''}${k === TODAY ? ' t' : ''}" title="${dateOf(k).toDateString()}"></i>`).join('');
  const mo = dateOf(TODAY).getMonth(), thisMo = [...v].filter(k => k <= TODAY && dateOf(k).getMonth() === mo).length;
  const recap = reg
    ? `<span class="sub">${MONTHS[mo]} so far</span><b class="num">${n(thisMo, 'session', 'sessions')}</b><span class="sub">hardest V2, ${n(list().filter(r => r.g === 3).reduce((k, r) => k + r.tries, 0), 'try', 'tries')} at V3 so far</span>`
    : session === 'saved'
      ? `<span class="sub">${MONTHS[mo]} so far</span><b class="num">${n(tops, 'send', 'sends')}</b><span class="sub">1 session · ${n(tries, 'try', 'tries')} · ${fmt(secs)} on the wall</span>`
      : `<span class="sub">${MONTHS[mo]} so far</span><b class="num">No sessions yet</b><span class="sub">Film or log a climb with Add. It shows up here when you end the session.</span>`;
  // no reset dates: we can't know them. Routes you stop seeing just move down; their videos stay.
  const reset = '';
  const untagged = clips.filter(c => !c.r).length;
  const been = [...new Set(clips.filter(c => !c.place).map(c => gymOf(c)).filter(Boolean).map(g => g.name))];
  return { photo: 'woman2', html: `
    ${tabHead('Profile')}
    <div class="me"><span class="av"><img src="img/woman2.jpg" alt=""></span>
      <span class="row-t"><strong>${reg ? 'Maria' : 'You'}</strong><span>${gyms[gi].name}${reg ? '' : ` · climbs ${levels[setup.level].g}`} · sends public</span></span></div>
    <section class="recap solid">${recap}</section>
    <div class="fold"></div>
    <div class="lb">
      <div class="lt w2 tall"><span class="lt-h">Days you climbed</span>
        <span class="mv"><b>${v.size}</b><span class="mv-l">${v.size === 1 ? 'session' : 'sessions'} since ${shortDay(0)}</span></span>
        <span class="hm-m" aria-hidden="true">${months}</span><span class="hm-d" aria-hidden="true"><span>Mon</span><i></i><span>Wed</span><i></i><span>Fri</span><i></i><i></i></span>
        <span class="hm" aria-label="${v.size} sessions in 12 weeks">${cells}</span></div>
      <div class="lt w2 tall"><span class="lt-h">Sends per grade</span>
        <span class="mv"><b>${total}</b><span class="mv-l">${total ? 'sends' : 'sends yet · your first one shows here'}</span></span>
        <span class="gb">${grades.map(g => `<span class="gb-r"><span>${g}</span><span class="gb-t"><span class="gb-f${g === top ? ' lime' : ''}" style="width:${((sends[g] || 0) / max * 100).toFixed(0)}%"></span></span><span class="num">${sends[g] || 0}</span></span>`).join('')}</span></div>
    </div>
    <div class="hl2 dk2"><h2>Logbook</h2></div>
    ${logbook()}
    <div class="stack">
      ${reset}
      <button class="row" type="button" data-act="export"><span class="row-t"><strong>Export your log</strong><span>CSV with every try, send and video link</span></span>${ic.down}</button>
    </div>
    <div class="hl2 dk2"><h2>You</h2></div>
    <div class="rows">
      <button class="row" type="button" data-act="to" data-to="watch"><span class="row-t"><strong>Watch</strong><span>${watch ? 'Connected · starts and stops each try' : 'Not connected'}</span></span>${ic.arr('#111111')}</button>
      <button class="row" type="button" data-act="size"><span class="row-t"><strong>Level and size</strong><span>${reg ? 'V2–V3' : levels[setup.level].g} · ${myH()} cm · used to show you climbers built like you</span></span></button>
      <div class="row"><span class="row-t"><strong>Who sees your climbs</strong><span>Public by default. Hide any climb from its video or the session summary.</span></span></div>
    </div>` };
}

/* ---------- Videos: every clip you film, upload or get tagged in, each one analysed ---------- */
// one clip = one try. r = its route (null until you tag the tape colour), high = highest move reached, k = day (0 = Aug 17), by = who filmed it
// len = trimmed to the climb, raw = length before trimming, orig = the original is still in Photos
const clips = [];
let cid = 0, vf = 'all';
// picking = Select mode in Videos
let picking = false;
const picked = new Set();
// real climbing videos, filmed from the floor like a climber's own phone (one from Wikimedia Commons, one from The Way Up), with a frame from each as the thumbnail. ar = width / height
const mmssOf = x => { const s = Math.round(x); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const VIDS = [   // eye level, whole body in frame. Every video plays start to end; at is the moment the analysis points to
  { vid: 'rockspot-v3', img: 'vrock', ar: 272 / 480, len: '0:41', t: [0, 40.9], credit: 'Cryptic C62 · CC BY-SA 3.0' },
  { vid: 'wayup-p8-green', img: 'wayup-p8-green', ar: 9 / 16, len: '1:17', t: [0, 77.8], credit: 'The Way Up · Maschek & Schedl · CC BY 4.0' }];
// rope-free pairs: two climbers on one boulder, IFSC World Cup Munich 2019. Not cycled into filmed tries like VIDS
const PRO = [['pro-wa4-rakovec', 40, 'Lucka Rakovec'], ['pro-wa4-garnbret', 41, 'Janja Garnbret'], ['pro-wb1-raboutou', 23, 'Brooke Raboutou'], ['pro-wb1-pilz', 38, 'Jessica Pilz']]
  .map(([vid, s, who]) => ({ vid, img: vid, ar: 9 / 16, len: mmssOf(s), t: [0, s], who, credit: `${who} · World Cup Munich 2019 · Boulder Rundfunk · CC BY 3.0` }));
// more tries from The Way Up, each with someone else on the same route to compare with. who: nothing on the page may be sample data
const WAY = [['wayup-p1-green', 188], ['wayup-p1-orange', 89], ['wayup-p5-orange', 60], ['wayup-p5-green', 93.4], ['wayup-p8-orange', 39.9]]
  .map(([vid, s]) => ({ vid, img: vid, ar: 9 / 16, len: mmssOf(s), t: [0, s], who: 'You', credit: 'The Way Up · Maschek & Schedl · CC BY 4.0' }));
const CROWD = [['wayup-p3-green', 51.7], ['wayup-p4-green', 93.2], ['wayup-p6-green', 93.9], ['wayup-p7-green', 80.8], ['wayup-p9-green', 59.7],
  ['wayup-p4-orange', 50.5], ['wayup-p6-orange', 74.6], ['wayup-p7-orange', 57.8], ['wayup-p9-orange', 53.7], ['wayup-p10-orange', 60.1], ['wayup-p2a-orange', 47.4]]
  .map(([vid, s]) => ({ vid, img: vid, ar: 9 / 16, len: mmssOf(s), t: [0, s], credit: 'The Way Up · Maschek & Schedl · CC BY 4.0' }))
  .concat([86, 72, 29, 65, 60, 52].map((s, i) => ({ vid: `pratteln-${i + 1}`, img: `pratteln-${i + 1}`, ar: 9 / 16, len: mmssOf(s), t: [0, s], credit: 'Amada44 · Wikimedia Commons · CC BY 4.0' })))
  .concat([['7591545', 24.4, 'Pavel Danilyuk'],
  ['7591479', 48.5, 'Pavel Danilyuk'],
  ['7591538', 25.8, 'Pavel Danilyuk'],
  ['7591475', 38, 'Pavel Danilyuk'],
  ['7591808', 39.8, 'Pavel Danilyuk'],
  ['7591477', 15.4, 'Pavel Danilyuk'],
  ['7591603', 33.5, 'Pavel Danilyuk'],
  ['7591535', 25.9, 'Pavel Danilyuk'],
  ['5382887', 18.4, 'Allan Mas'],
  ['6690707', 15, 'cottonbro studio']]
    .map(([id, s, who]) => ({ vid: `px-${id}`, img: `px-${id}`, ar: 9 / 16, len: mmssOf(s), t: [0, s], credit: `${who} · Pexels` })))
  .concat([[2, 19.1, 'tiffneedsavacay', 704], [3, 21.2, 'reelclimbs'], [4, 10.1, 'boulderaddicts'], [5, 45.6, 'sophia_halley'], [6, 5.4, 'boulderaddicts'], [7, 10.5, 'bigmanclimbs'], [8, 9.3, 'henry_lovegrove']]
    .map(([n, s, who, h = 766]) => ({ vid: `tt-${n}`, img: `tt-${n}`, ar: 576 / h, len: mmssOf(s), t: [0, s], credit: `TikTok @${who}` })))   // watermark-free part only: the start is skipped and the bottom strip cropped off
  .concat({ vid: '6687076-sd_506_960_25fps', img: 'v6687076', ar: 506 / 960, len: '0:42', t: [0, 42.7], credit: 'Pexels' });
const vidOf = c => [...VIDS, ...PRO, ...WAY, ...CROWD, ...roll].find(v => v.vid === c.vid);
function addClip(r, o) { const c = { id: cid++, gym: gi, r, try: 1, high: 0, sent: false, by: '', hidden: false, raw: '', orig: false, ...o }; clips.unshift(c); return c; }
const dayOf = k => k === TODAY ? 'Today' : dateOf(k).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const shortDay = k => dateOf(k).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const rname = r => r.grade ? `${r.color} ${r.grade}` : r.color;
const clipRoutes = () => [...new Set(clips.map(c => c.r).filter(Boolean))];
const myRoutes = () => [...new Set(clips.filter(c => !c.place).map(c => c.r).filter(Boolean))];
const byId = id => clips.find(x => x.id === +id);
// where a video was filmed, from its location; gym -1 = no location in it ("Unknown gym" until you pick one)
const gymOf = c => c.place ? { name: c.place } : c.gym === -1 ? null : gyms[c.gym ?? gi];
// the colour and grade being picked on a video's own page
const ctag = { id: null, color: null, grade: null };
if (user === 'regular') {  // Maria imported these before. A new user starts empty: the two analysis videos wait in their camera roll
  const [Y, B, R] = data.regular;
  B.ok = R.ok = true;   // confirmed before; Yellow is the one still waiting
  addClip(B, { try: 3, high: 2, k: 73, by: user === 'regular' ? 'Jo' : '', ...VIDS[1] });
  addClip(Y, { try: 6, high: 4, orig: true, k: 75, raw: '1:36', ...VIDS[0] });
  const G = { color: 'Green', hex: '#2E9E62', grade: '', wall: 'Wall E', img: WAY[0].img, moves: 21, ok: true, mine: true }, O = { color: 'Orange', hex: '#F08A24', grade: '', wall: 'Wall E', img: WAY[1].img, moves: 30, ok: true, mine: true };
  addClip(G, { try: 1, high: 21, k: 71, ...WAY[0] });
  addClip(O, { try: 2, high: 30, k: 69, ...WAY[1] });
  addClip(O, { try: 1, high: 30, k: 66, ...WAY[2] });
  addClip(G, { try: 2, high: 21, k: 73, ...WAY[3] });
  addClip(O, { try: 3, high: 30, k: 74, ...WAY[4] });
  // imported like any other video. Each climber gets a route of her own so her tile stays separate; the tries are the film's own count
  const MUNICH = Math.round((new Date(2019, 4, 18) - dateOf(0)) / 864e5);   // the day of the qualification
  [['WA4', '#F2C230', 5, 4, 2], ['WA4', '#F2C230', 5, 4, 2], ['WB1', '#E5484D', 5, 3, 3], ['WB1', '#E5484D', 5, 3, 1]].forEach(([color, hex, moves, high, t], i) =>
    addClip({ color, hex, grade: PRO[i].who.split(' ')[1], wall: 'Competition wall', img: PRO[i].img, moves, ok: true, mine: true }, { try: t, high, k: MUNICH, place: 'World Cup Munich 2019', ...PRO[i] }));
}
// like a KEKE record: one card per route per day, every try on it inside. It opens on the latest try; the others are a tap away there.
const vtile = cs => {
  const c = cs[0], ids = cs.map(x => x.id).join(','), on = cs.every(x => picked.has(x.id)), many = cs.length > 1;
  const top = cs.some(x => x.sent), hi = Math.max(...cs.map(x => x.high)), first = cs[cs.length - 1].try, an = anState(cs);
  return `<button class="vt${c.r ? '' : ' none'}${cs.every(x => x.hidden) ? ' hid' : ''}${on ? ' on' : ''}${many ? ' many' : ''}" type="button" ${picking ? `data-act="vpick" data-i="${ids}" aria-pressed="${on}"` : `data-act="to" data-to="${c.hold ? 'edit' : 'clip'}/${c.id}"`} aria-label="${c.r ? `${rname(c.r)}, ${many ? `tries ${first} to ${c.try}` : `try ${c.try}`}` : 'Video without a route'}, ${dayOf(c.k)}">
    <img src="img/${c.img}.jpg" alt=""><span class="shade"></span>
    <span class="vt-t">${c.r ? `${sw(c.r)}${c.r.grade || c.r.color}${many ? '' : ` · try ${c.try}`}` : 'No route'}</span>
    ${picking ? '<span class="vt-c"></span>' : ''}
    ${(() => { const st = an === 'hold' ? 'Not analysed' : an === 'ask' ? 'Check this' : an === 'run' ? 'Analysing' : top ? 'Topped' : !c.r ? 'Tag it' : c.gym === -1 ? 'No gym' : '';
      return `<span class="vt-b${an === 'ask' ? ' ask' : ''}">${cs.every(x => x.hidden) ? ic.eyeOff : ''}${st || `${tileDay(c.k)}${many ? ` · ${cs.length} tries` : ''}`}</span>`; })()}
  </button>`;
};
// the day on a tile: weekday this week and last, the date before that, the year if it isn't this one
const tileDay = k => k === TODAY ? 'Today' : k >= TODAY - 13 && k >= 70 ? dateOf(k).toLocaleDateString('en-US', { weekday: 'short' }) : dateOf(k).getFullYear() === dateOf(TODAY).getFullYear() ? shortDay(k) : String(dateOf(k).getFullYear());
// a day's videos, grouped by route (newest try first); videos without a route stay one card each
const byRoute = cs => {
  const g = [];
  cs.forEach(c => { const at = c.r && g.find(x => x[0].r === c.r); at ? at.push(c) : g.push([c]); });
  return g.map(x => x.sort((a, b) => b.try - a.try));
};
function viewVideos() {
  // your own tries, and videos of other climbers you imported (a competition film): those get one chip, not one per climber
  const mine = clips.filter(c => !c.place), other = clips.filter(c => c.place), place = other[0]?.place;
  const routes = myRoutes(), none = mine.filter(c => !c.r), sends = mine.filter(c => c.sent);
  if (vf !== 'all' && (vf === 'none' ? !none.length : vf === 'other' ? !other.length : !routes.includes(vf))) vf = 'all';
  const shown = clips.filter(c => vf === 'all' ? !c.place : (vf === 'none' ? !c.r && !c.place : vf === 'other' ? c.place : c.r === vf)).sort((a, b) => b.k - a.k);
  // a card up top only when there's something to do: no videos yet, or a video that needs a route
  const head = !clips.length
    ? `<section class="glass scan-c"><span class="t2">No videos yet</span>
        <span class="sub">Film a try at the gym or upload one from your camera roll. Each video shows how high you got and where you stall.</span>
        <div class="two"><button class="b-glass" type="button" data-act="upload">Import videos</button><button class="b-lime" type="button" data-act="film">${ic.rec}Film a try</button></div></section>`
    : none.length
      ? `<section class="glass scan-c"><span class="t2">${n(none.length, 'video needs', 'videos need')} a route</span>
        <span class="sub">No tape colour in frame. Tag the colour and grade and we analyse the moves.</span>
        <button class="pk-go static" type="button" data-act="place" data-i="${none[0].id}">${ic.pen}Tag ${none.length > 1 ? 'the first one' : 'it'}</button></section>`
      : '';
  const byF = clips.filter(c => c.by), who = [...new Set(byF.map(c => c.by))];
  const chip = (i, label, on) => `<button type="button" data-act="vf" data-i="${i}" aria-pressed="${on}">${label}</button>`;
  const chips = `<div class="fchips">${chip(-1, `All ${mine.length}`, vf === 'all')}${routes.map((r, i) => chip(i, `${sw(r)}${rname(r)}`, vf === r)).join('')}${none.length ? chip(-2, `No route ${none.length}`, vf === 'none') : ''}${other.length ? chip(-3, `${place} ${other.length}`, vf === 'other') : ''}</div>`;
  // KEKE's Records: a day, where, and what you got done, then the routes
  // one block per day and gym; videos with no location in them get their own "Unknown gym" block
  const gk = c => c.gym ?? gi, mon = TODAY - (TODAY % 7);
  const period = k => k >= mon ? 'This week' : k >= mon - 7 ? 'Last week' : dateOf(k).getFullYear() === dateOf(TODAY).getFullYear() ? 'Earlier' : String(dateOf(k).getFullYear());   // the date is on each tile
  const grid = [...new Set(shown.map(c => period(c.k)))].map(p => {
    const part = shown.filter(c => period(c.k) === p), tops = part.filter(c => c.sent).length;
    const tiles = [...new Set(part.map(c => `${c.k}|${gk(c)}`))].flatMap(key => byRoute(part.filter(c => `${c.k}|${gk(c)}` === key)));
    return `<div class="vd"><b>${p}</b><span>${n(part.length, 'try', 'tries')}${tops ? ` · ${n(tops, 'top', 'tops')}` : ''}</span></div><div class="vg">${tiles.map(vtile).join('')}</div>`;
  }).join('');
  // the highlight reel: every send as one video, labels added
  const reel = sends.length ? `<button class="lt w2 short pt reel-t" type="button" data-act="reel"><img src="img/${sends[0].img}.jpg" alt=""><span class="shade"></span>
      <span class="lt-h">Highlight reel</span><span class="sqb">${ic.play.replace('#111111', '#FFFFFF')}</span>
      <span class="mv"><b>${n(sends.length, 'send', 'sends')}</b><span class="mv-l">in one video, labelled with grade and gym</span></span></button>` : '';
  const orig = clips.filter(c => c.orig).length;
  const tail = `<div class="stack old">
      ${orig ? `<button class="row" type="button" data-act="origdel"><span class="row-t"><strong>Free up space on your phone</strong><span>${n(orig, 'original', 'originals')} still in Photos · ${(orig * .15).toFixed(1)} GB. Spotter keeps the trimmed copies.</span></span>${ic.arr('#111111')}</button>` : ''}
      ${user === 'regular' ? `<button class="row" type="button" data-act="oldset"><span class="row-t"><strong>Older routes</strong><span>Purple V2 · last climbed ${shortDay(TODAY - 23)} · 3 videos kept</span></span>${ic.arr('#111111')}</button>` : ''}
    </div>`;
  const k = picked.size;
  return { photo: 'woman1', html: `
    ${tabHead('Videos')}
    ${session === 'live' ? `<section class="glass live-bar">
      <span class="dot"></span><b class="num">${fmt(secs)}</b>
      <span><button class="lb-gym" type="button" data-act="to" data-to="gym/${gi}">${gyms[gi].name}</button> · <span>${tries ? `${n(tries, 'try', 'tries')} · ${n(tops, 'top', 'tops')}` : watch ? 'Tap Start on your watch before each try' : 'Tap Film before each try'}</span></span>
      <button class="end" type="button" data-act="end">End</button>
    </section>` : ''}
    <p class="sub-w">${clips.length ? `${n(mine.length, 'try', 'tries')} on video · ${clips.some(x => x.an === 'ask') ? `${clips.filter(x => x.an === 'ask').length} to check` : 'newest first'}` : 'Your tries on video, each one analysed'}</p>
    ${head}
    <div class="fold"></div>
    ${clips.length ? `<div class="hl2 dk2"><h2>${picking ? (k ? `${k} selected` : 'Tap to select') : 'Your tries'}</h2><button type="button" data-act="vsel">${picking ? 'Done' : 'Select'}</button></div>
    ${chips}${grid}
    ${picking ? '' : `<div class="lb">
      <div class="lt short"><span class="lt-h">Analysed</span><span class="mv"><b>${clips.length - none.length}<small>/${clips.length}</small></b><span class="mv-l">highest move and time on each move</span></span></div>
      <div class="lt short"><span class="lt-h">Filmed by friends</span><span class="mv"><b>${byF.length}</b><span class="mv-l">${who.length ? `by ${who.join(' and ')}` : 'Pick who filmed you when you log a send'}</span></span></div>
      ${reel}
    </div>
    ${tail}`}` : ''}`,
    // Select mode: the actions for the picked videos take the dock's place
    cta: picking ? `<button class="b-ghost" type="button" data-act="bhide">Hide</button><button class="b-ghost" type="button" data-act="btag">Change route</button><button class="b-ghost warn" type="button" data-act="bdel">Delete</button>` : '' };
}

/* ---------- One video: what we saw in it, and managing it ---------- */
// why a try ended: sample analysis for the prototype. Real data would come from the hold map plus the pose track (the contact log isn't built yet)
const FALLS = { reach: 4, slip: 1, hold: 1 };   // the last six falls across routes
const FALL = {
  reach: { title: 'Not enough reach', conf: 'Likely', ev: h => [`Your hand stopped 12 cm short of hold ${h + 1}`, 'Your arm was fully straight at the top of the move', 'Both feet stayed on the low holds'],
    drill: 'Flag your free leg to reach further: 3 sets of 5 on an easy route.' },
  slip: { title: 'Foot slipped', conf: 'Likely', ev: h => [`Your right foot dropped 9 cm just before you came off move ${h}`, 'Your hands came off after the foot moved', 'Your hips were far from the wall'],
    drill: 'Silent feet: place each foot without a sound for one easy route.' },
  hold: { title: 'Different hold choice', conf: 'Possible', ev: h => [`You took a different hold on move ${Math.max(1, h - 1)}`, 'All 3 climbers your height who topped it went left', 'After that the next hold was out of reach'],
    drill: 'Read the route from the ground and point out each move before you start.' } };
const fallOf = r => ({ Yellow: 'reach', Blue: 'slip', Red: 'hold' })[r.color] || 'reach';
// someone from the community on the same route: a real video, side by side with yours. Routes with no such video get a simulated climb
// Blue V3 pairs two climbers on one route in The Way Up. Times are from the coach's labels: both clips start as the left hand takes the same hold
const PEERS = { 'wayup-p8-green': { vid: 'wayup-p2-green', ar: 9 / 16, img: 'wayup-p2-green', who: 'Sam', h: 171, yrs: 'over 10 years', a: 40, b: 39, len: 20, you: 18, them: 6 } };
// three more pairs, read the same way: first time each took the same hold, then the next hold both of them used. Names are made up, the people are anonymous
Object.assign(PEERS, {
  'wayup-p1-green': { vid: 'wayup-p10-green', ar: 9 / 16, img: 'wayup-p10-green', who: 'Noor', h: 172, yrs: '5–10 years', a: 67, b: 42.8, len: 36, lb: 30, you: 32, them: 4, youN: 6, themN: 1 },
  // this pair starts on the floor, and you stood there 10 s before climbing: both clips start as the first foot leaves the
  // ground, and the numbers are what the app counted in the 15 s after that (from the two tracks)
  'wayup-p1-orange': { vid: 'wayup-p2b-orange', ar: 9 / 16, img: 'wayup-p2b-orange', who: 'Sam', h: 171, yrs: 'over 10 years', a: 9.6, b: 0, len: 15, off: 15, youN: 6, themN: 12, youF: 6, themF: 9 },
  'wayup-p5-orange': { vid: 'wayup-p3-orange', ar: 9 / 16, img: 'wayup-p3-orange', who: 'Leo', h: 180, yrs: '1–2 years', a: 0, b: 2.2, len: 25, you: 21, them: 5, youN: 9, themN: 4 } });
// the Munich pairs, both ways round. What the note says comes from watching the film, not from the app
const SAY = { WA4: 'Watch the two big yellow holds. Both climbers hang from them with their feet high on the right one. Garnbret goes on to the top yellow hold. The film leaves this try by Rakovec at the big holds.',
  WB1: 'Watch the dark block low on the wall. Both climbers stand on it to reach up the edge of the wall.' };
[[0, 1, 'WA4'], [2, 3, 'WB1']].forEach(([i, j, b]) => [[i, j], [j, i]].forEach(([x, y]) => { PEERS[PRO[x].vid] = { vid: PRO[y].vid, ar: 9 / 16, img: PRO[y].img, who: PRO[y].who, a: 0, b: 0, la: PRO[x].t[1], lb: PRO[y].t[1], me: PRO[x].who, say: SAY[b] }; }));
let pathNow = null, pv = null;
function pathWire() {
  const P = pathNow; pv = null; if (!P) return;
  // no one else on this route: your own climb, drawn again on this video's wall from the moves we found in it
  if (P.climb) { const cv = $('climbc'), say = s => { const l = $('climbn'); if (l && l.dataset.s !== s) { l.dataset.s = s; l.textContent = s; } };
    if (!cv || !P.c.track) return;
    const ok = window.poseRoute(cv, `video/${P.c.vid}.mp4`, P.c.track, (i, n) => say(i === 0 ? 'Your start' : i === n && !P.c.sent ? `Move ${i} of ${n} · where you came off` : `Move ${i} of ${n}`));
    if (!ok) { cv.closest('.an-p')?.remove(); say('Too few moves seen in this video to draw the climb.'); }
    return; }
  const a = $('pv0'), b = $('pv1'); if (!a || !b || !P.c.track) return;
  fetch(`video/${P.peer.vid}.track.json`).then(x => x.json()).then(T => { if (!a.isConnected) return;
    const a0 = P.peer.a, b0 = P.peer.b, len = P.peer.len;
    pv = { a, b, a0, b0, la: P.peer.la || len, lb: P.peer.lb || len, on: false };
    const near = (Tr, t) => { const s = Tr.S.find(x => x.p && x.t >= t + len / 2); if (!s) return; [s.p[7], s.p[8]].reduce((m, q) => [m[0] + q[0] / 2, m[1] + q[1] / 2], [0, 0]).forEach((v, i) => { (i ? near.y = v : near.x = v); }); return `${near.x * 100}% ${near.y * 100}%`; };
    if (!P.peer.me) [[a, $('pc0'), P.c.track, a0], [b, $('pc1'), T, b0]].forEach(([v, cv, Tr, t]) => { const o = near(Tr, t); if (o) [v, cv].forEach(e => { e.style.transformOrigin = o; e.style.transform = 'scale(1.8)'; }); });   // a tall wall: close in on the climber
    window.posePlay(a, $('pc0'), P.c.track, 'none'); window.posePlay(b, $('pc1'), T, 'none');
    const home = (v, t) => { if (v.readyState) v.currentTime = t; else v.addEventListener('loadedmetadata', () => { v.currentTime = t; }, { once: true }); }; home(a, a0); home(b, b0);
  }).catch(() => {});
}
function pvPlay() {
  if (!pv) return; const { a, b, a0, b0, la, lb } = pv, label = t => { const g = $('pvg'); if (g) g.innerHTML = `${ic.play}${t}`; };
  const done = (v, end) => v.ended || v.currentTime >= end - .1, over = () => done(a, a0 + la) && done(b, b0 + lb);
  if (pv.on) { a.pause(); b.pause(); pv.on = false; label('Play side by side'); return; }
  $('lvv')?.pause(); $('cpv')?.pause();
  if (over()) { a.currentTime = a0; b.currentTime = b0; }
  pv.on = true; label('Pause both'); if (!done(a, a0 + la)) a.play().catch(() => {}); if (!done(b, b0 + lb)) b.play().catch(() => {});
  const tick = () => { if (!pv?.on || !a.isConnected) return; if (done(a, a0 + la)) a.pause(); if (done(b, b0 + lb)) b.pause(); if (over()) { pv.on = false; label('Watch again'); return; } requestAnimationFrame(tick); }; tick();
}
function fallView(c, r, hi) {
  const next = Math.min(hi + 1, r.moves), span = mySpan();
  const line = pts => pts.map(p => p.join(',')).join(' ');
  const peer = PEERS[c.vid];
  pathNow = peer ? { c, peer } : { c, climb: true };
  return {
    path: `<div class="stack">${peer ? `<div class="lt"><span class="an-c">${peer.me ? 'Same boulder' : 'Same route'}</span><span class="lt-h">${peer.me ? `${peer.me} and ${peer.who}` : `You and ${peer.who}`}</span>
      ${peer.me ? '' : `<p class="an-n">${peer.h} cm · climbing for ${peer.yrs}</p>`}
      <div class="pv"><figure><span class="pv-b" style="aspect-ratio:${vidOf(c).ar}"><video id="pv0" src="video/${c.vid}.mp4" poster="img/${vidOf(c).img}0.jpg" muted playsinline preload="auto"></video><canvas id="pc0"></canvas></span><figcaption><i class="you"></i>${peer.me || 'You'}</figcaption></figure>
        <figure><span class="pv-b" style="aspect-ratio:${peer.ar}"><video id="pv1" src="video/${peer.vid}.mp4" poster="img/${peer.img}0.jpg" muted playsinline preload="auto"></video><canvas id="pc1"></canvas></span><figcaption><i class="them"></i>${peer.who}</figcaption></figure></div>
      <button class="b-lime pv-go" type="button" id="pvg" data-act="pvplay">${ic.play}Play side by side</button>
      <p class="tip-d">${peer.off ? 'Both start as your first foot leaves the ground.' : peer.youN ? 'Both start on the same hold. Watch how each of you gets to the next hold you both used.' : peer.say || `Same left-hand hold, then two different choices. ${peer.who} went straight on and reached the next high hold in ${peer.them} s. Your left hand went back to a lower hold first, and you took ${peer.you} s.`}</p>
      ${peer.off ? `<div class="pv-n"><span class="pv-nh">In the first ${peer.off} s off the ground</span>
        <div class="pv-nr"><span><i class="you"></i>You</span><b class="num">${n(peer.youN, 'hand move', 'hand moves')}</b><b class="num">${n(peer.youF, 'foot move', 'foot moves')}</b></div>
        <div class="pv-nr"><span><i class="them"></i>${peer.who}</span><b class="num">${n(peer.themN, 'hand move', 'hand moves')}</b><b class="num">${n(peer.themF, 'foot move', 'foot moves')}</b></div></div>
      <p class="an-n">Counted by Spotter from both videos.</p>`
      : peer.youN ? `<div class="pv-n"><span class="pv-nh">From that hold to the next one you both used</span>
        <div class="pv-nr"><span><i class="you"></i>You</span><b class="num">${peer.you} s</b><b class="num">${n(peer.youN, 'hand move', 'hand moves')}</b></div>
        <div class="pv-nr"><span><i class="them"></i>${peer.who}</span><b class="num">${peer.them} s</b><b class="num">${n(peer.themN, 'hand move', 'hand moves')}</b></div></div>
      <p class="an-n">Timed from a coach’s labels on these two videos.</p>`
      : `<p class="an-n">${peer.me ? 'Picked by hand from the film. It’s edited, so don’t compare the time they take.' : 'Timed from a coach’s labels on these two videos.'}</p>`}</div>`
    : `<div class="lt"><span class="an-c">From this video</span><span class="lt-h">Simulated climb</span>
      ${c.track && vidOf(c) ? `<div class="an-p"><canvas id="climbc" width="600" height="800"></canvas></div>
      <p class="an-k"><span><i class="hc"></i>Holds you used, in colour</span><span><i class="hd">S</i>Start</span><span><i class="hd">1</i>Hand order</span><span><i class="them"></i>You, from the video</span></p>
      <p class="an-n" id="climbn">Your start</p>
      <p class="an-n">No one in the community has filmed this route yet, so here is your own climb, played again from this video. The wall is made from its frames with you taken off it, in grey; only the holds you used keep their colour, so the colour is your route. S is where you started and the numbers are the order your hands took the rest. The body moves the way the video saw you move, faster while you rest. Holds you didn’t touch stay grey: we can’t yet tell which holds belong to the route.</p>`
      : `<p class="an-n">Shows once this video is analysed: your moves, drawn on its wall.</p>`}</div>`}
</div>`
  };
}
// every video is analysed in the background: the climber only confirms what we found, once per route, and fixes it if it's wrong
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
  if (seed) { c.tags = seed; c.an = 'done'; } else {
    c.auto = track?.first || (lv ? null : SAMPLE_BODY);   // never show made-up points on a real video: ask them to tap instead
    if (!c.r) { c.tags = c.auto; c.an = 'done'; }   // no route to confirm yet
    else if (c.r.ok && c.auto && !c.check) { c.tags = c.auto; c.an = 'done'; } else c.an = 'ask';
  }
  if (here() || page === 'videos') render();
}
const anState = cs => cs.some(x => x.hold) ? 'hold' : cs.some(x => x.an === 'ask') ? 'ask' : cs.some(x => (x.r || vidOf(x)) && x.an !== 'done') ? 'run' : 'done';
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
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
// a try saved as a follow-cam video, like the analysis page's: zoomed in on the climber and following them. The video is
// played once, off screen, and drawn into a frame that follows the climber; it's recorded as it plays, so making it takes
// as long as the climb. It keeps going if you leave the page, while Spotter is open. Only the climb is kept: from just
// before the first move to just after the last
const fcJobs = {};
const fcSpan = c => { const T = c.track, ms = T.moves; return c.trim || [Math.max(0, (ms[0]?.t0 ?? 0) - 1.5), Math.min(T.D, (ms[ms.length - 1]?.t ?? T.D) + 1.5)]; };
function fcRow(c) {
  const j = fcJobs[c.id], [a, b] = fcSpan(c);
  if (j?.state === 'run') return `<span class="row-t"><strong>Making your follow-cam video · <span class="num">${Math.round(j.p * 100)}%</span></strong><span>Keeps going if you leave this page</span><i class="an-run"><em style="width:${Math.round(j.p * 100)}%"></em></i></span>`;
  if (j?.state === 'done') return `<span class="row-t"><strong>Follow-cam video ready</strong><span>${mmss(b - a)} · zoomed in on you</span></span>
    <span class="fc-a">${j.canShare ? `<button class="pj" type="button" data-act="fcshare" data-i="${c.id}">Share</button>` : ''}<a class="pj" href="${j.url}" download="${j.name}">Save</a></span>`;
  if (j?.state === 'fail') return `<span class="row-t"><strong>Couldn’t make the video</strong><span>This browser can’t record video. Try Chrome or Safari</span></span>`;
  return `<span class="row-t"><strong>Follow-cam video</strong><span>The camera follows you, zoomed in. ${mmss(b - a)} of climbing</span></span><button class="pj" type="button" data-act="fcmake" data-i="${c.id}">Make</button>`;
}
const fcShow = c => { const r = $('fcr'); if (r && r.dataset.i === String(c.id)) r.innerHTML = fcRow(c); };
function fcMake(c) {
  const lv = vidOf(c), T = c.track; if (!lv || !T || fcJobs[c.id]?.state === 'run') return;
  const job = fcJobs[c.id] = { state: 'run', p: 0 }, [t0, t1] = fcSpan(c);
  const type = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(x => window.MediaRecorder?.isTypeSupported?.(x));
  if (!type) { job.state = 'fail'; fcShow(c); return; }
  fcShow(c);
  const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = `video/${lv.vid}.mp4`;
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d'), parts = [];
  let cx = .5, cy = .5, z = 1;
  const clampC = (q, z) => Math.min(1 - .5 / z, Math.max(.5 / z, q));
  const aim = (snap) => { const p = window.poseBox(T, v.currentTime); if (!p) return;   // can't see you: stay where you were last seen
    const h = Math.max(.05, p.y1 - p.y0, (p.x1 - p.x0) * lv.ar), zt = Math.min(2.6, Math.max(1, .72 / h)), k = snap ? 1 : .12;
    z += (zt - z) * (snap ? 1 : .06); cx += (clampC((p.x0 + p.x1) / 2, z) - cx) * k; cy += (clampC((p.y0 + p.y1) / 2, z) - cy) * k; };
  const draw = () => { const W = v.videoWidth, H = v.videoHeight, sw = W / z, sh = H / z;
    ctx.drawImage(v, Math.max(0, Math.min(W - sw, cx * W - sw / 2)), Math.max(0, Math.min(H - sh, cy * H - sh / 2)), sw, sh, 0, 0, cv.width, cv.height); };
  const fail = () => { job.state = 'fail'; fcShow(c); };
  v.addEventListener('error', fail, { once: true });
  v.addEventListener('loadedmetadata', () => {
    cv.width = 720; cv.height = Math.round(720 * v.videoHeight / v.videoWidth / 2) * 2;
    v.addEventListener('seeked', () => {
      aim(true); draw();
      const rec = new MediaRecorder(cv.captureStream(30), { mimeType: type, videoBitsPerSecond: 6e6 });
      rec.ondataavailable = e => { if (e.data.size) parts.push(e.data); };
      rec.onstop = () => { const kind = type.split(";")[0], ext = kind === "video/mp4" ? "mp4" : "webm", r = c.r;
        job.name = `spotter-${(r ? rname(r) : 'climb').replace(/\W+/g, '-').toLowerCase()}-try-${c.try || 1}.${ext}`;
        job.file = new File([new Blob(parts, { type: kind })], job.name, { type: kind });
        job.url = URL.createObjectURL(job.file); job.canShare = !!navigator.canShare?.({ files: [job.file] });
        job.state = 'done'; fcShow(c); };
      const tick = () => { if (job.state !== 'run') return;
        aim(false); draw(); const p = Math.min(1, (v.currentTime - t0) / (t1 - t0));
        if (Math.round(p * 100) !== Math.round(job.p * 100)) { job.p = p; fcShow(c); } else job.p = p;
        if (v.currentTime >= t1 || v.ended) { v.pause(); rec.stop(); return; }
        requestAnimationFrame(tick); };
      rec.start(1000); v.play().then(() => requestAnimationFrame(tick)).catch(fail);
    }, { once: true });
    v.currentTime = t0;
  }, { once: true });
}
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
  v.addEventListener('click', () => acts.segtoggle());
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
      <p class="an-n">Share of the time from your first move to your last, in this video.${all ? '' : rest ? ' Your arms only read clearly when you stop, so that one counts your rests.' : ' Too far from the camera to read your arms.'}</p></div></div>`; };
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
  $('tgx').textContent = fix ? (c.auto ? 'Tap your head, hands and feet on the video.' : 'We couldn’t find you here. Tap your head, hands and feet on the video.') : `We found you on ${rname(c.r)}. Confirm once and we’ll remember this route for your next tries.`;
  $('tgc').hidden = fix;
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
function confirmed(c, tags, again) { c.check = false; c.tags = tags; c.auto = tags; c.r.ok = true; c.an = 'done'; clips.filter(x => x.r === c.r && x.an === 'ask' && x.auto && !x.check).forEach(x => { x.tags = x.auto; x.an = 'done'; }); tagS = { id: null, i: 0, pts: {} }; cTab = 'why'; if (again) analyse(c, tags); render(); document.querySelector('.screen').scrollTo(0, 0); }
// a link to a video that isn't here any more: imports don't survive a reload. The address has to change too, or the page keeps its own rules, like no dock
function lostClip() { page = 'videos'; arg = ''; history.replaceState(null, '', '#/videos'); return viewVideos(); }
function viewClip(id) {
  const c = byId(id);
  if (!c) return lostClip();
  if (c.hold) return viewEdit(id);
  const r = c.r, mv = r ? r.moves : 0, hi = c.sent ? mv : c.high;
  const you = (r && r.you) || 5.4, them = (r && r.senders) || 2.1;
  const ticks = Array.from({ length: mv }, (_, k) => `<span class="${k + 1 === hi ? 'on' : k + 1 < hi ? 'done' : ''}">${k + 1}</span>`).join('');
  const seen = r ? `
    <div class="hl2 dk2"><h2>What we saw</h2></div>
    <div class="lb">
      <div class="lt short"><span class="lt-h">${c.sent ? 'Topped' : 'Highest move'}</span><span class="mv"><b>${hi}<small>/${mv}</small></b><span class="mv-l">${c.sent ? 'every move in this try' : `you came off reaching for ${hi + 1}`}</span></span></div>
      ${c.sent ? `<div class="lt short"><span class="lt-h">Whole climb</span><span class="mv"><b>${c.len}</b><span class="mv-l">start to top</span></span></div>`
        : `<div class="lt short"><span class="lt-h">Move ${hi}</span><span class="mv"><b>${you} s</b><span class="mv-l">people who topped it: ${them} s</span></span></div>`}
    </div>
    <div class="stack">
      <div class="lt"><span class="lt-h">One tip</span><p class="tip-d">${r.short || 'Turn your hip into the wall before the long reach, so your arms stay straight.'}</p></div>
      ${r.old || r.mine ? '' : `<button class="row" type="button" data-act="vcmp" data-i="${c.id}"><span class="row-t"><strong>Compare with someone your height</strong><span>Side by side, move by move</span></span>${ic.arr('#111111')}</button>`}
    </div>` : '';
  const fv = r && !c.sent ? fallView(c, r, hi) : null;
  // like KEKE's drawer under the video: where and when it was read from, the route, and every try on that route
  const mine = r ? clips.filter(x => x.r === r).sort((a, b) => a.k - b.k || a.try - b.try) : [];
  const filmable = r && list().includes(r) && !r.topped;
  const gain = mine.length > 1 ? mine[mine.length - 1].high - mine[0].high : 0;
  const triesStrip = mine.length > 1 || filmable ? `
    <div class="hl2 dk2"><h2>Your tries on ${rname(r)}</h2></div>
    <div class="trs">${mine.map(x => `<button class="${x === c ? 'on' : ''}" type="button" data-act="to" data-to="clip/${x.id}"${x === c ? ' aria-current="true"' : ''} aria-label="Try ${x.try}, ${dayOf(x.k)}">
      <img src="img/${x.img}.jpg" alt=""><span class="shade"></span><b>Try ${x.try}</b><small>${x.sent ? 'Topped' : `Reached hold ${x.high}`} · ${shortDay(x.k)}</small></button>`).join('')}
      ${filmable ? `<button class="tr-add" type="button" data-act="film" data-r="${list().indexOf(r)}">${ic.rec}<b>Film try ${r.tries + 1}</b></button>` : ''}</div>
    <p class="trs-l">${mine.length > 1 ? (mine.some(x => x.sent) ? `Topped in ${n(mine.length, 'try', 'tries')} on video.` : gain > 0 ? `From move ${mine[0].high} to move ${mine[mine.length - 1].high} in ${n(mine.length, 'try', 'tries')}.` : `${n(mine.length, 'try', 'tries')} on the same holds, matched for you.`) : 'Film your next try and it lands here, next to this one.'}</p>` : '';
  // the gym: read from where it was filmed; no location in the video → Unknown gym until you pick one (KEKE's "Select Gym")
  const g = gymOf(c);
  const gymRow = `<div class="row"><span class="row-t"><strong>${g ? g.name : 'Unknown gym'} · ${dayOf(c.k)}</strong><span>${!g ? 'No location in the video · pick the gym' : c.gymBy ? 'Gym · picked by you' : 'Gym · from where it was filmed'}</span></span>
    <button class="pj" type="button" data-act="cgym" data-i="${c.id}">${g ? 'Change' : 'Pick'}</button></div>`;
  // no tape colour in frame: pick its colour and grade (KEKE's rows). No photos of "what's on the wall": we can't promise they're still up.
  if (ctag.id !== c.id) Object.assign(ctag, { id: c.id, color: null, grade: null });
  const opt = (k, v, label) => `<button type="button" data-act="cset" data-k="${k}" data-v="${v}" aria-pressed="${ctag[k] === v}">${label}</button>`;
  const details = r ? `
    <div class="hl2 dk2"><h2>Details</h2></div>
    <div class="rows">
      <div class="row"><span class="row-t"><strong>${sw(r)}${rname(r)}</strong><span>Route · ${c.imp || c.orig ? 'read from the tape colour in frame' : 'the route you were on'}</span></span>
        <button class="pj" type="button" data-act="place" data-i="${c.id}">Change</button></div>
      ${gymRow}
    </div>` : `
    <div class="hl2 dk2"><h2>Which route is this?</h2></div>
    <div class="rows">${gymRow}</div>
    <p class="trs-l">No tape colour in frame. Pick its colour and the grade on its tag.</p>
    <div class="field ctag"><span class="lbl">Tape colour and grade</span>
      <div class="opts tapes">${tapes.map(([t, h]) => opt('color', t, `<span class="sw" style="background:${h}"></span>${t}`)).join('')}</div>
      <div class="opts grades">${[0, 1, 2, 3, 4, 5, 6, 7].map(v => opt('grade', v, 'V' + v)).join('')}</div>
      <button class="btn-l" type="button" data-act="ctagsave" data-c="${c.id}"${ctag.color && ctag.grade !== null ? '' : ' disabled'}>${ctag.color && ctag.grade !== null ? (c.track ? `Tag ${ctag.color} V${ctag.grade}` : `Tag ${ctag.color} V${ctag.grade} and analyse`) : 'Pick a colour and a grade'}</button></div>`;
  const lv = vidOf(c);
  const thisVideo = `
    <div class="hl2 dk2"><h2>This video</h2></div>
    <div class="rows">
      ${c.r ? (c.posted && !c.hidden ? `<button class="row" type="button" data-act="seepost" data-i="${c.id}"><span class="row-t"><strong>In Community</strong><span>${c.note ? `“${esc(c.note)}”` : 'Posted · see likes and comments'}</span></span>${ic.arr('#111111')}</button>`
        : `<div class="row pst"><input id="pstn" type="text" maxlength="120" placeholder="Say something (optional)" aria-label="Caption" value="${esc(c.note || '')}"><button class="pj" type="button" data-act="cpost" data-i="${c.id}">Post</button></div>`) : ''}
      ${c.r ? `<button class="row" type="button" data-act="share" data-i="${c.id}"><span class="row-t"><strong>${c.sent ? 'Share this send' : 'Share this try'}</strong><span>A poster with the grade, tape colour and gym on it</span></span>${ic.arr('#111111')}</button>` : ''}
      <div class="row"><span class="row-t"><strong>${c.hidden ? 'Only you' : 'Public'}</strong><span>${c.hidden ? 'Hidden from your profile and friends’ feed' : 'On your profile · friends can comment'}</span></span>
        <button class="vis${c.hidden ? ' off' : ''}" type="button" data-act="vhide" data-i="${c.id}" aria-pressed="${c.hidden}">${c.hidden ? `${ic.eyeOff}Hidden` : `${ic.eye}Public`}</button></div>
      ${lv ? `<button class="row" type="button" data-act="to" data-to="edit/${c.id}"><span class="row-t"><strong>Edit video</strong><span>Length, speed and details</span></span>${ic.arr('#111111')}</button>` : ''}
      ${lv && c.track ? `<div class="row fc" id="fcr" data-i="${c.id}">${fcRow(c)}</div>` : ''}
      <button class="row" type="button" data-act="vdel" data-i="${c.id}"><span class="row-t"><strong>Delete video</strong><span>The try stays in your log</span></span></button>
    </div>
    ${r ? `<div class="rows tg-r"><div class="row"><span class="row-t"><strong>Tracking</strong><span>You and this route, confirmed</span></span><button class="pj" type="button" data-act="retag" data-i="${c.id}">Fix it</button></div></div>` : ''}
    ${lv?.credit ? `<div class="rows tg-r"><div class="row"><span class="row-t"><strong>Sample video</strong><span>${lv.credit}</span></span></div></div>` : ''}`;
  const state = !r ? (c.track ? 'done' : lv && c.an !== 'done' ? 'run' : 'none') : c.an === 'done' ? 'done' : c.an === 'ask' ? 'ask' : 'run';
  const pct = Math.round((c.pct || 0) * 100);
  const runCard = `<div class="stack"><div class="lt"><span class="lt-h">Analysing your climb <span class="num" id="anp">${pct}%</span></span>
      <p class="an-n">Going through the whole video, following your hands, feet, elbows and hips. You can leave this page.</p><i class="an-run"><em id="anb" style="width:${pct}%"></em></i></div></div>`;
  const two = state === 'done' && c.track && lv;
  const room = (document.querySelector('.screen')?.clientHeight || 874) - (two ? 300 : state === 'ask' ? 348 : state === 'run' ? 280 : 0);
  const vh = !room || state === 'none' ? 560 : Math.max(280, Math.min(two ? 520 : 560, room));
  // what the video shows right now, as it plays: in Body, above the timeline. Hand and foot moves, not holds: a hold can take several
  const live = two ? `<div class="lv-s${c.track.stats.armRead >= 30 ? '' : ' n2'}"><div><span>Hand and foot moves</span><b id="tl-moves">—</b></div>${c.track.stats.armRead >= 30 ? '<div><span>Arms now</span><b id="tl-arms">—</b></div>' : ''}<div><span>Hips now</span><b id="tl-hips">—</b></div></div>${c.track.stats.armRead >= 30 ? '<p class="lv-k">Arms: 180° is straight. Under 145° counts as bent.</p>' : ''}` : '';
  const askCard = `<div class="stack"><div class="lt tgc"><span class="lt-h" id="tgt"></span><p class="an-n" id="tgx"></p>
      <div class="tg-s" id="tgs" hidden></div>
      <div class="tg-a"><button class="b-ghost" type="button" id="tgu" data-i="${c.id}"></button><button class="b-lime" type="button" id="tgb" data-i="${c.id}"></button></div>
      <button class="tg-c" type="button" id="tgc" data-act="place" data-i="${c.id}">Wrong route? Change it</button></div></div>`;
  const tabs = [['why', 'Summary'], ...(c.track ? [['body', 'Body']] : []), ...(fv ? [['path', 'Path']] : []), ['info', r ? 'Info' : 'Add route']];
  const tab = tabs.some(([k]) => k === cTab) ? cTab : 'why';
  const panels = { why: c.track ? `${measured(c.track)}${r ? '' : `<div class="rows"><button class="row" type="button" data-act="ctab" data-v="info"><span class="row-t"><strong>Which route is this?</strong><span>Add it to see this try next to your others</span></span>${ic.arr('#111111')}</button></div>`}` : seen, body: c.track ? `<div class="hl2 dk2"><h2>As it plays</h2></div>${live}${two ? timeline(c.track) : ''}${bodyStats(c.track)}` : '', path: fv ? fv.path : '', info: `${r && !c.who ? triesStrip : ''}${details}${thisVideo}` };
  return { photo: c.img, fit: state === 'ask' && !!lv, after: () => {
      tagWire(c);
      if (!lv) return;
      const v = $('lvv'), box = v.parentElement;
      segClose(); anSheet = null; segStop = null; segT = c.track; v.addEventListener('play', () => $('cpv')?.pause());
      v.playbackRate = c.rate || speed;
      if (two) { window.posePlay(v, $('lvc'), c.track); tlWire(); kfWire(c.track, v.currentSrc || v.src); pathWire(); stickWire(box, vh); followWire(box); }
      if (state === 'ask' && c.auto) v.currentTime = c.auto.t;
      if (lv.t) { // only the climb
        const [t0, t1] = c.trim || lv.t, home = () => { if (v.currentTime < t0 - .1 || v.currentTime >= t1) v.currentTime = t0; };
        if (v.readyState >= 1) home(); else v.addEventListener('loadedmetadata', home, { once: true });
        v.addEventListener('play', home);
        v.addEventListener('timeupdate', () => { if (v.currentTime >= t1 && !v.paused) { v.pause(); v.dispatchEvent(new Event('clipend')); } });
      }
      v.addEventListener('play', () => box.classList.add('playing'));
      ['pause', 'ended'].forEach(e => v.addEventListener(e, () => box.classList.remove('playing')));
      v.addEventListener('click', () => v.paused ? v.play() : v.pause());
      // an analysed video plays as soon as the page opens (muted), so the skeleton and the readouts are moving from the start
      if (state === 'done' && !seg) { const go = () => v.play().catch(() => {}); if (v.readyState >= 2) go(); else v.addEventListener('canplay', go, { once: true }); }
      // and keeps playing: at the end of the climb it starts over, so it never sits still on the last frame
      if (state === 'done') ['ended', 'clipend'].forEach(n => v.addEventListener(n, () => { if (segStop) return; v.currentTime = +(c.trim || lv.t || [0])[0] || 0; v.play().catch(() => {}); }));
    }, html: `
    ${bar(r ? `${rname(r)} · try ${c.try}` : 'Not tagged yet')}
    <div class="lv-w${two ? ' two' : ''}"><div class="clip vp${lv ? ' lv' : ''}${state === 'run' ? ' busy' : ''}"${lv ? ` style="aspect-ratio:${lv.ar.toFixed(4)};width:min(100%, ${Math.round(vh * lv.ar)}px)"` : ''}>
      ${lv ? `<video id="lvv" data-t0="${lv.t?.[0] ?? 0}" src="video/${lv.vid}.mp4" poster="img/${lv.img}0.jpg" muted playsinline preload="auto"></video><canvas id="lvc"></canvas>`
        : `<img src="img/${c.img}.jpg" alt=""><span class="shade"></span>`}
      <button class="play-b" type="button" data-act="${lv ? 'lvplay' : 'vplay'}" data-len="${c.len}" aria-label="Play the video">${ic.play}</button>
      <div class="tg" id="tg" hidden></div>
      ${lv && (state === 'none' || state === 'done' && !two) ? `<button class="sp-o" type="button" data-act="spd" aria-label="Playback speed">${speed}×</button>` : ''}
      <span class="clip-l">${r ? `<span class="pk-tag">${sw(r)}${rname(r)} · try ${c.try}</span>` : '<span class="pk-tag">No route yet</span>'}
        <span>${dayOf(c.k)} · ${g ? g.name : 'Unknown gym'} · ${c.len}${c.raw ? `, trimmed from ${c.raw}` : ''}${c.by ? ` · filmed by ${c.by}` : ''}</span></span></div></div>
    ${state === 'done' && !c.track ? `<section class="glass scrub"><div class="mv-t" aria-label="Moves; you reached move ${hi}">${ticks}</div>
      <p class="scrub-l">${c.sent ? `Topped · all ${mv} moves` : `You reached move ${hi} of ${mv}`}</p></section>` : ''}
    <div class="fold"></div>
    ${state === 'none' ? `${details}${thisVideo}` : state === 'run' ? runCard : state === 'ask' ? askCard : `
      <div class="fchips ctabs">${tabs.map(([k, l]) => `<button type="button" data-act="ctab" data-v="${k}" aria-pressed="${k === tab}">${l}</button>`).join('')}</div>
      ${tabs.map(([k]) => `<div class="pn" data-pn="${k}"${k === tab ? '' : ' hidden'}>${panels[k]}</div>`).join('')}`}` };
}

// share one send as a poster, or every send as a highlight reel; labels come from the analysis
const shareBtns = `<div class="two"><button class="b-ghost" type="button" data-act="shsave">Save to Photos</button><button class="b-lime" type="button" data-act="shsend">${user === 'regular' ? 'Send to Alex and Jo' : 'Copy link'}</button></div>`;
const where = c => `${c.r.wall}${c.r.old ? '' : ` · ${gyms[gi].name}`}`;
function openShare(c) {
  pane(`<h2>${c.sent ? 'Share your send' : 'Share your progress'}</h2><span class="sub">Grade, tape colour and gym added from the video</span>
    <div class="poster"><img src="img/${c.img}.jpg" alt=""><span class="shade"></span><span class="po-brand">Spotter</span>
      <span class="po-b"><span class="pk-tag">${sw(c.r)}${rname(c.r)}</span><b>${c.sent ? 'Topped' : `Move ${c.high} of ${c.r.moves}`}</b><span>on try ${c.try} · ${where(c)} · ${shortDay(c.k)}</span></span></div>
    ${shareBtns}`);
}
function openReel() {
  const s = clips.filter(c => c.sent);
  pane(`<h2>Your highlight reel</h2><span class="sub">${n(s.length, 'send', 'sends')} · ${s.length * 8} seconds · labels added for you</span>
    <div class="reel">${s.map(c => `<span class="rl"><img src="img/${c.img}.jpg" alt=""><span class="pk-tag">${sw(c.r)}${rname(c.r)}</span><em>${where(c)} · ${shortDay(c.k)}</em></span>`).join('')}</div>
    <p class="hint">Each send plays for 8 seconds, from its last move to the top.</p>
    ${shareBtns}`);
}

/* ---------- Over time: Community (the video feed, likes, comments, group climbs, partner calendar) ---------- */
// other people's posts. Names, notes, likes and comments are sample data; the videos are real, and their credits come from the video list
const wp = (who, what, vid, when, likes, note = '', comments = []) => ({ who, what, g: 0, where: 'Wall E', when, vid, img: vid, likes, note, comments });
const othersPosts = [
  wp('Mia', 'topped Green', 'wayup-p4-green', '2 h ago', 41, 'Finally! Fourth session on this one.', [['Kai', 'Huge!'], ['Noor', 'That top move 👏']]),
  wp('Noor', 'climbed Green', 'wayup-p10-green', '3 h ago', 23, 'Took my time on the low section.'),
  wp('Kai', 'topped Orange', 'wayup-p6-orange', '4 h ago', 57, 'Warm-up lap.', [['Lena', 'Warm-up?!']]),
  wp('Sam', 'topped Orange', 'wayup-p2b-orange', '5 h ago', 8, 'Second go felt much smoother.', [['Noor', 'Clean!']]),
  wp('Omar', 'climbed Green', 'wayup-p9-green', '5 h ago', 12, 'Any tips for the middle section?', [['Mia', 'Trust your feet, there are good holds low.']]),
  wp('Lena', 'topped Orange', 'wayup-p7-orange', 'Yesterday', 33, 'Slow and steady.'),
  wp('Leo', 'climbed Orange', 'wayup-p3-orange', 'Yesterday', 5, 'Still working the top.'),
  { who: 'Yuki', what: 'climbed Green', g: 4, where: 'Wall D', when: 'Yesterday', vid: '6687076-sd_506_960_25fps', img: 'v6687076', likes: 64, note: 'First time on the lead wall.', comments: [['Lena', 'Looking strong']] },
  wp('Mia', 'climbed Orange', 'wayup-p4-orange', '2 days ago', 19),
  wp('Kai', 'topped Green', 'wayup-p6-green', '2 days ago', 48, 'Filmed the whole thing for Omar.', [['Omar', 'Thanks, watching it now']]),
  wp('Noor', 'topped Orange', 'wayup-p10-orange', '3 days ago', 29),
  wp('Omar', 'climbed Orange', 'wayup-p9-orange', '3 days ago', 7, 'Fell at the last hold again.'),
  wp('Lena', 'topped Green', 'wayup-p7-green', '4 days ago', 26),
  wp('Leo', 'climbed Green', 'wayup-p3-green', '4 days ago', 4),
  wp('Sam', 'climbed Orange', 'wayup-p2a-orange', '4 days ago', 11, 'Different beta this time.')];
// gym clips from Pexels, posted by sample people (stock footage: the people in it are models, not these names)
const px = (who, what, id, g, where, when, likes, note = '', comments = []) => ({ who, what, g, where, when, vid: `px-${id}`, img: `px-${id}`, likes, note, comments });
const pxPosts = [
  px('Chloe', 'climbed V5', 6690707, 2, 'Wall B', '1 h ago', 73, 'Steep one today.', [['Kai', 'Strong!']]),
  px('Ben', 'topped V4', 7591808, 2, 'Wall A', '5 h ago', 61, 'Big move at the top 💪', [['Ines', 'Clean']]),
  px('Ravi', 'topped V3', 5382887, 1, 'Wall C', '2 h ago', 44, 'Second session this week.'),
  px('Ines', 'climbed V2', 7591545, 2, 'Wall A', '6 h ago', 37, 'Trying to keep my hips close to the wall.'),
  px('Tom', 'topped V3', 7591479, 2, 'Wall B', 'Yesterday', 52, 'The whole thing, start to top.', [['Ines', 'Smooth!']]),
  px('Felix', 'climbed V5', 7591477, 2, 'Wall D', 'Yesterday', 22, 'Overhang day.'),
  px('Ines', 'topped V3', 7591538, 2, 'Wall B', '2 days ago', 29),
  px('Tom', 'climbed V4', 7591475, 2, 'Wall C', '3 days ago', 18, 'Fell twice before this one.'),
  px('Felix', 'topped V3', 7591603, 2, 'Wall A', '3 days ago', 30),
  px('Felix', 'climbed V4', 7591535, 2, 'Wall C', '4 days ago', 14, 'Slab practice: feet, feet, feet.')];
// shared clips: the gym, wall and route are made up (sample data, like the people), so they read like every other post
const shareTT = (n, who, when, likes, note = '', comments = [], [g, rc, rv, top, where] = [0, 'Green', 'V3', true, 'Wall B']) => ({ who: 'Mei', what: 'shared Bouldering', g, rc, rv, top, where, when, vid: `tt-${n}`, img: `tt-${n}`, likes, note, comments });
const ttPosts = [
  shareTT(5, 'sophia_halley', '30 min ago', 96, 'Look how she keeps her hips in on the overhang.', [['Chloe', 'Goals'], ['Ines', 'Saving this']], [2, 'Yellow', 'V4', true, 'Cave']),
  shareTT(3, 'reelclimbs', '3 h ago', 58, 'Heel hooks on the big volumes.', [], [0, 'Purple', 'V3', false, 'Wall D']),
  shareTT(8, 'henry_lovegrove', '5 h ago', 41, 'Big reach at the end.', [['Ben', 'That last move!']], [1, 'Blue', 'V5', true, 'Wall A']),
  shareTT(4, 'boulderaddicts', 'Yesterday', 33, 'Steep and fun.', [], [0, 'Red', 'V4', false, 'Wall E']),
  shareTT(7, 'bigmanclimbs', 'Yesterday', 77, 'Proof that anyone can boulder 🙌', [['Ravi', 'Love this']], [3, 'Green', 'V2', true, 'Wall B']),
  shareTT(2, 'tiffneedsavacay', '2 days ago', 25, 'A few climbs from one session.', [], [1, 'Orange', 'V3', true, 'Wall C']),
  shareTT(6, 'boulderaddicts', '3 days ago', 19, 'Short one.', [], [2, 'Pink', 'V1', true, 'Slab'])];
const cup = (n, likes, note, comments = []) => ({ who: 'Rosa', what: 'filmed Red', gym: 'Boulder Cup Pratteln', where: 'Boulder 2', when: '5 days ago', vid: `pratteln-${n}`, img: `pratteln-${n}`, likes, note, comments });
const cupPosts = [
  cup(1, 88, 'Women’s comp, boulder 2. Watch how she uses the big red volume for her feet.', [['Lena', 'So much body tension']]),
  cup(2, 52, 'Same boulder, different climber: she goes straight up the arête.'),
  cup(4, 71, 'Low start on the red volume, then a big step up.', [['Omar', 'Saving this for the footwork']]),
  cup(3, 34, 'Short and calm.'),
  cup(5, 45, 'First go on boulder 2.'),
  cup(6, 60, 'Same climber, second go. Smoother on the top holds.', [['Mia', 'Way better second try']])];
// spread the competition clips through the feed, every third post
const mixIn = (xs, ys) => xs.flatMap((x, i) => i % 3 === 2 && ys[(i - 2) / 3] ? [x, ys[(i - 2) / 3]] : [x]).concat(ys.slice(Math.ceil((xs.length - 2) / 3)));

const feeds = {
  regular: [
    ...ttPosts,   // the TikTok clips you saved come first
    { who: 'Jo', img: 'woman1', pic: true, what: 'topped Blue V3', g: 0, where: 'Wall C', when: '2 h ago', vid: 'pexels-7591864-crop', still: 'v864', likes: 14, note: 'Third try. Heel hook on move 3 did it.', comments: [['Alex', 'That heel hook!']] },
    ...mixIn(mixIn(othersPosts, pxPosts), cupPosts),
    { who: 'Alex', img: 'man1', pic: true, what: 'topped Red V4', g: 3, where: 'Wall A', when: 'Yesterday', vid: 'pexels-7591810-crop', still: 'v810', likes: 19, note: '', comments: [] }
  ],
  new: [
    ...ttPosts,   // the TikTok clips you saved come first
    { who: 'Priya', img: 'av-priya', pic: true, what: 'topped Orange V2', g: 0, where: 'Wall A', when: '1 h ago', vid: 'pexels-7591864-crop', still: 'v864', likes: 12, note: 'Big holds all the way. Good first one if you’re new.', comments: [['Dan', 'Agreed, start here.']] },
    ...mixIn(mixIn(othersPosts, pxPosts), cupPosts),
    { who: 'Dan', what: 'climbed Yellow V1', g: 1, where: 'Wall B', when: 'Yesterday', vid: 'pexels-7591810-crop', still: 'v810', likes: 6, note: 'Any tips for the last move?', comments: [['Priya', 'Keep your hips close.']] }
  ]
};
// Alex and Jo: free days, counted from today
const free = { Alex: [1, 3], Jo: [1, 4] };
// sessions friends planned, and yours: g = gym, d = days from today, h = hour, who = who's going (you join by tapping)
const plans = { regular: [{ by: 'Alex', g: 2, d: 1, h: 18, who: ['Alex', 'Jo'] }], new: [] };
const pface = w => PEOPLE[w]?.img ? `<img src="img/${PEOPLE[w].img}.jpg" alt="">` : avatar(w);
const dayName = d => d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(new Date().getDay() + d) % 7];
const names = ws => ws.length < 3 ? ws.join(' and ') : `${ws.slice(0, -1).join(', ')} and ${ws[ws.length - 1]}`;
// what you've put in the feed: sends from a posted session, and videos posted from the editor
// what you type, safe to put in the page
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const myPosts = () => [...clips.filter(c => c.posted && !c.hidden).map(c => ({ who: 'You', img: 'woman2', what: `${c.sent ? 'topped' : 'posted'} ${rname(c.r)}`, ...(gymOf(c) && gyms.includes(gymOf(c)) ? { g: gyms.indexOf(gymOf(c)) } : { gym: gymOf(c)?.name || 'Unknown gym' }), ...(HOLD[c.r?.color] ? { rc: c.r.color, rv: /^V\d/.test(c.r.grade) ? c.r.grade : undefined } : {}), top: c.sent, where: c.r?.wall || '', when: 'Just now', pic: true, vid: c.vid, still: c.img, from: c.trim, rate: c.rate, len: c.len, photo: c.img, likes: 0, note: esc(c.note || ''), comments: c.cm || (c.cm = []) })),
  ...(posted ? [...today.entries()].filter(([, e]) => e.sent && !e.hidden).map(([r]) => ({ who: 'You', img: 'woman2', what: `topped ${r.color} ${r.grade}`, gym: gyms[gi].name, where: r.wall, when: 'Just now', pic: true, photo: r.img, likes: 0, note: '', comments: r.cm || (r.cm = []) })) : [])];
function viewFriends(tab) {
  const reg = user === 'regular', all = [...myPosts(), ...feeds[user]], plan = tab === 'plan', fr = [...follows[user]];
  const head = reg && tagPending
    ? `<section class="glass tagc"><span class="avs2"><img src="img/man1.jpg" alt="Alex"></span><span class="t2">Alex filmed 2 of your tries</span>
        <span class="sub">Yellow V3 · Wall B · Saturday. Accept and the clips land in your log.</span>
        <div class="two"><button class="b-glass" type="button" data-act="ftag" data-v="0">Decline</button><button class="b-lime" type="button" data-act="ftag" data-v="1">Accept</button></div></section>`
    : '';
  // two tabs along the top, For you and Friends. The first is the feed, the second is everything to do with the people you climb with
  const top = `<div class="tok-top"><button class="tok-add" type="button" data-act="upload" aria-label="Post a video">${ic.plus}</button>
    <nav class="tok-tabs"><button type="button" data-act="to" data-to="friends"${plan ? '' : ' aria-current="page"'}>For you</button><button type="button" data-act="to" data-to="friends/plan"${plan ? ' aria-current="page"' : ''}>Friends${reg && tagPending ? '<i></i>' : ''}</button></nav>
    <button class="av sm" type="button" data-act="me" aria-label="Your profile"><img src="img/woman2.jpg" alt=""></button></div>`;
  if (betaBack) { feedAt = 0; betaBack = 0; }   // back from a gym's videos: the feed starts from the top again
  if (!plan) return { dark: true, tok: true, after: feedWire, html: `${top}<div class="tok" id="tok" tabindex="0"><div class="tok-in" id="tokin">${all.map(feedPost).join('')}</div></div>` };
  // 1 · your friends: tap a face for their page; + adds friends right here
  const row = `<div class="fr-row">${fr.map(w => `<button type="button" data-act="to" data-to="person/${w}"><span class="fr-f">${pface(w)}</span><span>${w}</span></button>`).join('')}
      <button type="button" data-act="fadd"><span class="fr-f fr-add">${ic.plus}</span><span>Add</span></button></div>`;
  // 2 · climbing soon: plans by you and your friends, on real gyms. Join or leave in place; Plan one opens a sheet and lands back here
  const ps = plans[user].filter(p => p.by === 'You' || fr.includes(p.by));
  const card = (p, k) => { const g = gyms[p.g], me = p.who.includes('You'), others = p.who.filter(w => w !== 'You');
    return `<div class="pl">
      <img src="img/${g.img}.jpg" alt="">
      <span class="row-t"><strong>${dayName(p.d)} · ${clock(p.h)}</strong><span>${g.name}</span>
        <span class="pl-who"><span class="pl-avs">${p.who.map(w => `<i>${w === 'You' ? '<img src="img/woman2.jpg" alt="">' : pface(w)}</i>`).join('')}</span>${p.by === 'You' ? (others.length ? `You planned · ${names(others)} invited` : 'You planned it') : `${names(others)} ${others.length > 1 ? 'are' : 'is'} going`}</span></span>
      ${p.by === 'You' ? `<button class="pj" type="button" data-act="plx" data-i="${k}">Cancel</button>`
        : `<button class="pj${me ? ' on' : ''}" type="button" data-act="pljoin" data-i="${k}" aria-pressed="${me}">${me ? 'Going' : 'Join'}</button>`}
    </div>`; };
  const soon = ps.length ? ps.map(p => card(p, plans[user].indexOf(p))).join('') : `<p class="cap">${fr.length ? 'Nothing planned. Plan a session and your friends can join.' : 'Add a friend, then plan a session together.'}</p>`;
  const cal = fr.some(w => free[w]) ? `<div class="lt w2 fr-cal"><span class="cal-h"><span class="lt-h">Who’s free</span><span class="hint2">this week</span></span>
      <span class="week">${[0, 1, 2, 3, 4, 5, 6].map(i => { const d = new Date(Date.now() + i * 864e5); return `<span class="wd${i === 0 ? ' today' : ''}"><span>${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]}</span><b class="num">${d.getDate()}</b>
        <span class="wav">${fr.filter(w => free[w]?.includes(i)).map(w => `<i>${pface(w)}</i>`).join('')}</span></span>`; }).join('')}</span></div>` : '';
  // 3 · what your friends climbed: only their own posts; a tap plays it here
  const theirs = all.map((p, i) => [p, i]).filter(([p]) => fr.includes(p.who));
  const vids = theirs.length ? `<div class="vg">${theirs.slice(0, 9).map(([p, i]) => `<button class="vt" type="button" data-act="fplay" data-i="${i}" aria-label="Watch ${p.who}: ${p.what}">
      <img src="img/${p.still || p.img}.jpg" alt="" loading="lazy"><span class="shade"></span><span class="vt-t">${p.what.split(' ').slice(1).join(' ')}</span><span class="vt-g"><span>${p.who}</span><span>${p.when}</span></span></button>`).join('')}</div>`
    : `<p class="cap">${fr.length ? 'Your friends haven’t posted a climb yet.' : 'Climbs your friends post show up here.'}</p>`;
  return { photo: 'wall1', html: `
    ${top}
    ${head}
    <div class="fold"></div>
    <div class="hl2 dk2"><h2>Friends</h2><span class="hint2">${fr.length ? n(fr.length, 'friend', 'friends') : 'none yet'}</span></div>
    ${fr.length ? '' : '<p class="cap">See each other’s climbs and plan sessions together.</p>'}
    ${row}
    <div class="hl2 dk2"><h2>Climbing soon</h2>${fr.length ? '<button class="gy-mapb" type="button" data-act="pl">Plan one</button>' : ''}</div>
    <div class="pls">${soon}</div>
    ${cal}
    <div class="hl2 dk2"><h2>Friends’ climbs</h2>${theirs.length ? `<span class="hint2">${n(theirs.length, 'video', 'videos')}</span>` : ''}</div>
    ${vids}` };
}
// add friends without leaving the page: people from your contacts on Spotter, and people who post from your gym
function openFriendAdd() {
  const f = follows[user], at = gyms[gi].name;
  const local = [...new Set(feedAll().filter(p => !p.gym && (p.g ?? gi) === gi && p.who !== 'You' && PEOPLE[p.who]).map(p => p.who))].filter(w => !['Mia', 'Leo', 'Noor'].includes(w)).slice(0, 5);
  const one = (w, why) => `<div class="fr-p"><span class="fr-f">${pface(w)}</span><span class="row-t"><strong>${w}</strong><span>${why}</span></span>
      <button class="pj${f.has(w) ? ' on' : ''}" type="button" data-act="fadd1" data-w="${w}" aria-pressed="${f.has(w)}">${f.has(w) ? 'Added' : 'Add'}</button></div>`;
  pane(`<h2>Add friends</h2><span class="sub">Friends see your climbs and can join your sessions.</span>
    <p class="fr-h">From your contacts</p>${['Mia', 'Leo', 'Noor'].map(w => one(w, `${PEOPLE[w].h} cm · climbing ${PEOPLE[w].yrs}`)).join('')}
    <p class="fr-h">Posted from ${at} lately</p>${local.map(w => one(w, `${PEOPLE[w].sends} sends · hardest ${PEOPLE[w].top}`)).join('') || '<p class="cap">No one yet.</p>'}
    <div class="two one"><button class="b-ghost" type="button" data-act="invite">Copy an invite link</button></div>`);
}
// plan a session: a real gym, a day, a time it's open, and who to ask. Posting it closes the sheet and the plan is on the page.
let pd = null;
function openPlan() { pd = pd || { g: gi, d: 1, h: null, who: new Set() }; drawPlan(); }
function drawPlan() {
  const g = gyms[pd.g], hrs = g.hours?.[(new Date().getDay() + pd.d) % 7];
  const times = hrs ? [10, 12, 15, 17, 18, 19, 20].filter(h => h >= hrs[0] && h <= hrs[1] - 2) : [];
  if (!times.includes(pd.h)) pd.h = times.includes(18) ? 18 : times[0] ?? null;
  const chip = (act, v, label, on) => `<button type="button" data-act="${act}" data-v="${v}" aria-pressed="${on}">${label}</button>`;
  pane(`<h2>Plan a session</h2><span class="sub">Your friends see it and can join.</span>
    <p class="fr-h">Where</p><div class="fchips">${gyms.map((x, i) => [x, i]).filter(([x]) => x.mi <= 10).map(([x, i]) => chip('plg', i, x.name, i === pd.g)).join('')}</div>
    <p class="fr-h">When</p><div class="fchips">${[0, 1, 2, 3, 4, 5, 6].map(d => chip('pld', d, dayName(d), d === pd.d)).join('')}</div>
    <div class="fchips pl-t">${times.length ? times.map(h => chip('plh', h, clock(h), h === pd.h)).join('') : `<span class="cap">${g.name} is closed that day.</span>`}</div>
    <p class="fr-h">Ask</p><div class="fr-row sm">${[...follows[user]].map(w => `<button type="button" data-act="plw" data-w="${w}" aria-pressed="${pd.who.has(w)}"><span class="fr-f">${pface(w)}</span><span>${w}</span></button>`).join('')}</div>
    <div class="two one"><button class="b-lime" type="button" data-act="plgo"${pd.h === null ? ' disabled' : ''}>Post plan</button></div>`);
}
/* ---------- Someone else's page, opened from their avatar or name in the feed ---------- */
// sample people: everything here is made up except the videos. Noor, Sam and Leo match their side-by-side comparisons (PEERS)
const PEOPLE = {
  Priya: { img: 'av-priya', h: 165, yrs: '1–2 years', sends: 46, top: 'V3', week: 3 },
  Noor: { h: 172, yrs: '5–10 years', sends: 312, top: 'V6', week: 4 },
  Sam: { h: 171, yrs: 'over 10 years', sends: 540, top: 'V7', week: 2 },
  Leo: { h: 180, yrs: '1–2 years', sends: 58, top: 'V3', week: 3 },
  Dan: { h: 176, yrs: 'under a year', sends: 12, top: 'V1', week: 1 },
  Mia: { h: 160, yrs: '2–5 years', sends: 98, top: 'V4', week: 2 },
  Kai: { h: 185, yrs: 'over 10 years', sends: 410, top: 'V7', week: 3 },
  Lena: { h: 168, yrs: '5–10 years', sends: 205, top: 'V5', week: 4 },
  Omar: { h: 177, yrs: '1–2 years', sends: 40, top: 'V3', week: 2 },
  Chloe: { h: 163, yrs: '5–10 years', sends: 290, top: 'V6', week: 4 },
  Ben: { h: 182, yrs: '2–5 years', sends: 140, top: 'V5', week: 3 },
  Ravi: { h: 174, yrs: '1–2 years', sends: 52, top: 'V3', week: 2 },
  Ines: { h: 161, yrs: '1–2 years', sends: 38, top: 'V3', week: 3 },
  Tom: { h: 179, yrs: '2–5 years', sends: 110, top: 'V4', week: 2 },
  Felix: { h: 176, yrs: '5–10 years', sends: 230, top: 'V5', week: 4 },
  Mei: { h: 160, yrs: '2–5 years', sends: 85, top: 'V4', week: 3 },
  Rosa: { h: 166, yrs: '5–10 years', sends: 260, top: 'V6', week: 2 },
  Yuki: { h: 158, yrs: '2–5 years', sends: 130, top: 'V5', week: 3 },
  Jo: { img: 'woman1', h: 168, yrs: '2–5 years', sends: 120, top: 'V4', week: 3 },
  Alex: { img: 'man1', h: 183, yrs: '2–5 years', sends: 150, top: 'V5', week: 2 } };
// the videos from one gym, full screen: swipe for the next. arg = gym-post (the post's place in feedAll)
let betaBack = 0;
function viewBeta(a) {
  const [g, i] = String(a).split('-').map(Number), all = feedAll();
  const ps = all.map((p, k) => [p, k]).filter(([p]) => !p.gym && (p.g ?? gi) === g && p.who !== 'You');
  if (!ps.length) { page = 'gym'; arg = String(g); history.replaceState(null, '', `#/gym/${g}`); return viewGym(g); }
  const at = Math.max(0, ps.findIndex(([, k]) => k === i));
  if (betaBack !== a) { feedAt = at; betaBack = a; }
  const top = `<div class="tok-top"><button class="tok-bk" type="button" data-act="back" aria-label="Back">${ic.back.replace('#111111', '#FFFFFF')}</button>
    <span class="tok-g">${gyms[g].name}</span><span class="tok-sp"></span></div>`;
  return { dark: true, tok: true, after: feedWire, html: `${top}<div class="tok" id="tok" tabindex="0"><div class="tok-in" id="tokin">${ps.map(([p, k]) => feedPost(p, k)).join('')}</div></div>` };
}
const lgFold = new Set(); let lgTipOff = false;
let lgAt = 0, lgOpen = null, lgPin = null, lgStart = null, lgTick = null;
const lgClock = () => { if (!lgStart) lgStart = Date.now(); };
const mmssT = ms => { const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return `${h ? h + ':' + String(m).padStart(2, '0') : m}:${String(s % 60).padStart(2, '0')}`; };
function lgAfter() { lgSwipe(); clearInterval(lgTick);
  lgTick = setInterval(() => { const c = $('lgclk'); if (page !== 'logc' || !c) { clearInterval(lgTick); return; } if (lgStart) c.textContent = mmssT(Date.now() - lgStart); }, 1000); }
function lgEnd() {
  undoFn = null; toastEl.classList.remove('show', 'un');   // the summary takes over: the last Undo goes
  const es = [...(book[TODAY] || new Map()).entries()].filter(([, e]) => e.tries || e.sent), sent = es.filter(([, e]) => e.sent);
  const att = es.reduce((s, [, e]) => s + e.tries, 0), top = sent.map(([r]) => r).sort((p, q) => q.g - p.g)[0];
  pane(`<h2>Session done</h2><span class="sub">${gyms[lgAt].name} · ${mmssT(Date.now() - lgStart)} on the clock</span>
    <div class="lgb-s ss"><span><b class="num">${sent.length}</b>Sends</span><span><b class="num">${att}</b>Attempts</span><span><b class="num">${top ? top.grade : '–'}</b>Hardest send</span></div>
    ${es.map(([r, e]) => `<div class="lgb-r">${sw(r)}<span class="row-t"><strong>${rname(r)}</strong><span>${r.wall}</span></span><span class="lgb-v${e.sent ? ' on' : ''}">${e.sent ? `${ic.check}${e.style}` : n(e.tries, 'attempt', 'attempts')}</span></div>`).join('') || '<p class="cap">Nothing logged.</p>'}
    <p class="hint">It’s in your Logbook on Profile.</p>
    <div class="two one"><button class="b-lime" type="button" data-act="lgdone">Done</button></div>`);
}
const pinYours = () => { lgPin = new Set(list().filter(r => book[TODAY]?.get(r) || known(r))); };
function viewLogc() {
  const at = lgAt, d = dateOf(TODAY);
  if (!lgPin) pinYours();
  bookAt = TODAY;
  const es = [...(book[TODAY] || new Map()).values()], sends = es.filter(e => e.sent).length, att = es.reduce((s, e) => s + e.tries, 0);
  return { after: lgAfter, html: `
    ${bar('Log a climb')}
    <div class="lg-sum">${lgStart ? `<span class="lg-clk"><span class="lg-dot"></span><b class="num" id="lgclk">${mmssT(Date.now() - lgStart)}</b><button type="button" data-act="lgend">End</button></span>`
      : `<span class="lg-day"><b>${d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</b> · Today</span>`}
      <span class="lg-n"><span><b class="num">${sends}</b>sends</span><span><b class="num">${att}</b>attempts</span><span><b class="num">${att ? Math.round(sends / att * 100) + '%' : '–'}</b>tops</span></span></div>
    <div class="lg-gym">${ic.pin}<span><b>${gyms[at].name}</b> · ${at === gi ? 'your gym' : 'picked by you'}</span><button type="button" data-act="lggym">Change</button></div>
    ${routesTab(at, true)}
    <div class="hl2 dk2"><h2>Today</h2></div>
    ${logbook()}` };
}
function lgSwipe() {
  document.querySelectorAll('.rt-w').forEach(w => {
    const row = w.querySelector('.rt'); let d = null, moved = false;
    row.addEventListener('pointerdown', e => { if (e.button) return; d = { x: e.clientX, y: e.clientY, id: e.pointerId, on: false }; });
    row.addEventListener('pointermove', e => { if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.on) { if (Math.abs(dx) < 8) return; if (Math.abs(dy) > Math.abs(dx)) { d = null; return; } d.on = true; row.setPointerCapture(e.pointerId); w.classList.add('drag'); }
      const z = document.querySelector('.phone').getBoundingClientRect().width / document.querySelector('.phone').offsetWidth || 1, x = dx / z;
      d.dx = x; row.style.transform = `translateX(${x}px)`; w.classList.toggle('go-l', x > 70); w.classList.toggle('go-r', x < -70); });
    const end = e => { if (!d || e.pointerId !== d.id) return; const x = d.dx || 0, on = d.on; d = null;
      w.classList.remove('drag', 'go-l', 'go-r'); row.style.transform = '';
      if (!on) return; moved = true; setTimeout(() => { moved = false; }, 50);
      const i = +w.dataset.i;
      if (x > 70) { sendNow({ i, stars: 0, style: list()[i].tries ? 'Redpoint' : 'Flash', k: list()[i].tries + 1, feel: null }); }
      else if (x < -70) actions.rtry({ dataset: { r: i } }); };
    row.addEventListener('pointerup', end); row.addEventListener('pointercancel', end);
    row.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); } }, true);
  });
}
// what a log changes, so Undo can put it back
function snap(r) { const e = bookOf(TODAY, r), l = logOf(r);
  const s = { tries: r.tries, highs: [...r.highs], topped: r.topped, sendN: r.sendN, style: r.style, stars: r.stars, feel: r.feel, seen: r.seen, e: { ...e }, l: { ...l }, tops, lgStart };
  return () => { Object.assign(r, { tries: s.tries, highs: s.highs, topped: s.topped, sendN: s.sendN, style: s.style, stars: s.stars, feel: s.feel, seen: s.seen });
    Object.assign(e, s.e); Object.assign(l, s.l); tops = s.tops; lgStart = s.lgStart; render(); toast('Undone'); }; }
function sendNow(o) { ls = o; const r = list()[ls.i], undo = snap(r), e = bookOf(TODAY, r); lgClock();
  while (r.tries < ls.k) { r.tries++; tried(r); }
  markSent(r); r.sendN = (r.sendN || 0) + 1; r.seen = true; r.style = ls.style;
  if (ls.stars) r.stars = ls.stars; if (ls.feel) r.feel = ls.feel;
  e.sent = true; e.style = ls.style; e.tries = Math.max(e.tries, ls.k);
  closeAll(); render(); toastUndo(`${rname(r)} · ${ls.style}`, undo); }
let ls = null;
function drawSend() {
  const r = list()[ls.i], opt = (k, v, label) => `<button type="button" data-act="lsset" data-k="${k}" data-v="${v}" aria-pressed="${ls[k] === v}">${label}</button>`;
  pane(`<h2>Log send</h2><span class="sub">${rname(r)} · ${r.wall} · ${gyms[gymAt(r)].name}</span>
    <p class="fr-h">Rate the climb</p><div class="stars ls-st">${[1, 2, 3, 4, 5].map(k => `<button type="button" data-act="lsset" data-k="stars" data-v="${k}" class="${k <= ls.stars ? 'on' : ''}" aria-label="${n(k, 'star', 'stars')}">★</button>`).join('')}</div>
    <p class="fr-h">How</p><div class="fchips">${opt('style', 'Flash', 'Flash')}${opt('style', 'Redpoint', 'Redpoint')}</div>
    <p class="hint">${ls.style === 'Flash' ? 'Flash: sent on your first go.' : 'Redpoint: sent after trying it before.'}</p>
    <div class="ls-l"><span>Attempts</span><span class="step"><button type="button" data-act="lsk" data-d="-1" aria-label="One less">−</button><b class="num">${ls.k}</b><button type="button" data-act="lsk" data-d="1" aria-label="One more">+</button></span></div>
    <p class="fr-h">The grade felt</p><div class="fchips">${opt('feel', 'Soft', 'Soft')}${opt('feel', 'Spot on', `Spot on for ${r.grade}`)}${opt('feel', 'Hard', 'Hard')}</div>
    <div class="two one"><button class="b-lime" type="button" data-act="lsdone">Done</button></div>`);
}
function viewPerson(who) {
  const me = PEOPLE[who];
  if (!me) { page = 'friends'; arg = ''; history.replaceState(null, '', '#/friends'); return viewFriends(); }
  const all = feedAll(), mine = all.map((p, i) => [p, i]).filter(([p]) => p.who === who), on = follows[user].has(who), home = mine[0] ? gymName(mine[0][0]) : gyms[gi].name;
  const face = me.img ? `<img src="img/${me.img}.jpg" alt="">` : avatar(who);
  // your tries on a route they climbed too: open that try on its side-by-side
  const both = clips.filter(c => PEERS[c.vid]?.who === who && c.r && !c.hold);
  const tile = ([p, i]) => { const lv = vidOf({ vid: p.vid }); return `<button class="vt" type="button" data-act="pvid" data-i="${i}" aria-label="Watch ${p.who} on ${p.what.split(' ').slice(1).join(' ')}">
      <img src="img/${p.still || p.img}.jpg" alt=""><span class="shade"></span><span class="vt-t">${p.what.split(' ').slice(1).join(' ')}</span><span class="vt-g"><span>${gymName(p)}</span><span>${p.where}</span></span><span class="vt-l num">${p.len || lv?.len || ''}</span></button>`; };
  return { photo: mine[0]?.[0].still || mine[0]?.[0].img || 'wall1', html: `
    ${bar('')}
    <div class="pp-h"><span class="pp-av">${face}</span><div><h1 class="hl">${who}</h1><p class="sub-w"><span>${home}</span> · <span>${me.h} cm · climbing for ${me.yrs}</span></p></div></div>
    <div class="pp-a"><button class="${on ? 'b-glass' : 'b-lime'}" type="button" data-act="pfollow" data-w="${who}" aria-pressed="${on}">${on ? 'Following' : 'Follow'}</button></div>
    <div class="fold"></div>
    <div class="pp-st"><span><b class="num">${me.sends}</b>sends</span><span><b class="num">${me.top}</b>hardest</span><span><b class="num">${me.week}</b>climbs this week</span></div>
    ${both.length ? `<div class="hl2 dk2"><h2>Routes you both climbed</h2><span class="hint2">side by side</span></div>
    <div class="rows">${both.map(c => `<button class="row" type="button" data-act="pcmp" data-i="${c.id}"><span class="row-t"><strong>${sw(c.r)}${rname(c.r)}</strong><span><span>${gymOf(c)?.name || 'Unknown gym'}</span> · <span>${c.r.wall}</span></span></span>${ic.arr('#111111')}</button>`).join('')}</div>` : ''}
    <div class="hl2 dk2"><h2>Videos</h2><span class="hint2">${n(mine.length, 'video', 'videos')}</span></div>
    <div class="vg">${mine.map(tile).join('')}</div>
    <p class="hint">Sample person: name, numbers and posts are made up. The videos are real.</p>` };
}

// one post fills the screen. Swipe up for the next; the actions run down the right, who and what along the bottom
const liked = new Set(), saved = new Set(), follows = { regular: new Set(['Jo', 'Alex']), new: new Set() }, likeKey = p => `${p.who}/${p.vid || p.photo}`;
const gymName = p => p.gym || gyms[p.g ?? gi].name;
const feedAll = () => [...myPosts(), ...feeds[user]];
const tokIc = {
  heart: '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.5S3.5 15.6 3.5 9.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.4c0 6.2-8.5 11.1-8.5 11.1Z"/></svg>',
  talk: '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4.5h16a1 1 0 0 1 1 1V17a1 1 0 0 1-1 1H9.5L4.6 21.6a.4.4 0 0 1-.6-.3V18a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z"/></svg>',
  save: '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3.5h12a1 1 0 0 1 1 1v16.2a.5.5 0 0 1-.8.4L12 16.6l-6.2 4.5a.5.5 0 0 1-.8-.4V4.5a1 1 0 0 1 1-1Z"/></svg>',
  share: '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 4.2 22 11.4l-8.5 7.2V14c-4.6 0-7.8 1.6-10.5 5.4.7-5.6 3.9-10.6 10.5-11.4Z"/></svg>' };
const HOLD = { Blue: '#2F6FE0', Red: '#E0453A', Yellow: '#F2CC2E', Green: '#3DAA5C', Orange: '#F2832E', Pink: '#EE6FA8', Purple: '#8C5BD6', Black: '#222222', White: '#F4F4F2' };
const postRoute = p => { if (p.rc) return { c: p.rc, hex: HOLD[p.rc], v: p.rv };
  const c = /\b(Blue|Red|Yellow|Green|Orange|Pink|Purple|Black|White)\b/.exec(p.what || '')?.[1], v = /\b(V\d+)\b/.exec(p.what || '')?.[1];
  return c || v ? { c, hex: c && HOLD[c], v } : null; };
// VS: only on a video you really can compare with, one your own try is paired with (PEERS). It opens that try's side by side
const vsOf = p => p.vid && clips.find(c => PEERS[c.vid]?.vid === p.vid);
function feedPost(p, i) {
  const lv = p.vid && vidOf({ vid: p.vid }), [a, b] = p.from || lv?.t || [0, 0], on = liked.has(likeKey(p)), me = p.who === 'You';
  const face = p.pic ? `<img src="img/${p.img}.jpg" alt="">` : avatar(p.who);
  return `<article class="ts" data-i="${i}">
    <div class="ts-v${lv ? ' fv' : ''}"${lv ? ` data-act="fvtap"` : ''}>${lv ? `<video src="video/${p.vid}.mp4" poster="img/${p.still || p.img}.jpg" muted playsinline loop preload="none" data-a="${a}" data-b="${b}" data-r="${p.rate || 1}"></video><span class="ed-p fv-p">${ic.play.replace('#111111', '#FFFFFF')}</span>` : `<img src="img/${p.photo}.jpg" alt="">`}<span class="ts-big">${tokIc.heart}</span></div>
    <span class="ts-sh"></span>
    <div class="ts-rail"><span class="ts-av"><button class="ts-face" type="button" data-act="to" data-to="${me ? 'profile' : `person/${p.who}`}" aria-label="${me ? 'Your profile' : `${p.who}’s page`}">${face}</button>${me || follows[user].has(p.who) ? '' : `<button type="button" class="ts-f" data-act="ffollow" data-w="${p.who}" aria-label="Follow ${p.who}"></button>`}</span>
      <button type="button" data-act="flike" data-i="${i}" aria-pressed="${on}" aria-label="Like">${tokIc.heart}<span class="num">${p.likes + (on ? 1 : 0)}</span></button>
      <button type="button" data-act="fcm" data-i="${i}" aria-label="Comment">${tokIc.talk}<span class="num">${p.comments.length}</span></button>
      <button type="button" data-act="fsave" data-i="${i}" aria-pressed="${saved.has(likeKey(p))}" aria-label="Save">${tokIc.save}<span class="num">${Math.round(p.likes / 3) + (saved.has(likeKey(p)) ? 1 : 0)}</span></button>
      <button type="button" data-act="fshare" aria-label="Share">${tokIc.share}<span>Share</span></button></div>
    <div class="ts-c">${(() => { const rt = postRoute(p), vs = vsOf(p), top = p.top || /^topped(\s|$)/.test(p.what || ''), gy = page !== 'beta' && !/^Shared from/.test(p.gym || '');   // a clip shared from another app has no gym
      // KEKE's way: the gym on the video, then the route along the bottom: hold colour, grade, whether they topped it; VS on the right
      return `${gy ? (p.gym ? `<span class="ts-gym">${ic.pin.replace(/#2B2D2E|#111111/g, '#FFFFFF')}${p.gym}</span>` : `<button class="ts-gym" type="button" data-act="to" data-to="gym/${p.g ?? gi}">${ic.pin.replace(/#2B2D2E|#111111/g, '#FFFFFF')}${gymName(p)}</button>`) : ''}
      <span class="ts-rt">${rt?.c ? `<span class="ts-hold" style="background:${rt.hex}" aria-label="${rt.c} holds"></span>` : ''}${rt ? `<b class="ts-gr${rt.v ? '' : ' un'}"${rt.v ? '' : ' aria-label="Grade not given"'}>${rt.v || 'V?'}</b>
        ${top ? `<span class="ts-st on">${ic.check}Topped</span>` : ''}` : ''}${vs ? `<button class="ts-vs" type="button" data-act="pcmp" data-i="${vs.id}" aria-label="Compare with your try">VS</button>` : ''}</span>`; })()}
      <button class="ts-n" type="button" data-act="to" data-to="${me ? 'profile' : `person/${p.who}`}"><strong>${p.who} ${p.what}</strong></button><span class="ts-w"><span>${p.where ? `${p.where} · ${p.when}` : p.when}</span>${p.len || lv ? ` · <span class="num">${p.len || lv.len}</span>` : ''}</span>
      ${p.note ? `<p>${p.note}</p>` : ''}${lv && !/^TikTok/.test(lv.credit) ? `<small>${lv.credit}</small>` : ''}</div>
    ${lv ? '<i class="ts-p"><b></b></i>' : ''}
  </article>`;
}
function feedComments(i) {
  const p = feedAll()[i];
  pane(`<h2>${n(p.comments.length, 'comment', 'comments')}</h2>
    <div class="tcm">${p.comments.length ? p.comments.map(([w, t]) => `<p class="cm"><b>${w}</b> ${t}</p>`).join('') : '<p class="hint">Be the first to comment.</p>'}</div>
    <div class="cm-row"><input type="text" placeholder="Add a comment" aria-label="Comment on ${p.who}’s climb" data-cm="${i}"><button type="button" data-act="cm" data-i="${i}">Send</button></div>`);
}
const feedAt_post = b => feedAll()[+b.dataset.i];
function feedLike(post, on) { const b = post.querySelector('[data-act=flike]'), p = feedAll()[+b.dataset.i], k = likeKey(p); on ? liked.add(k) : liked.delete(k);
  b.setAttribute('aria-pressed', on); b.querySelector('span').textContent = p.likes + (on ? 1 : 0); pop(b, on); }
// a pressed icon springs once, the way it does in short-video apps
function pop(b, on) { b.classList.remove('pop'); if (!on) return; void b.offsetWidth; b.classList.add('pop'); }
// the feed is a pager, not a scrolling page. The post stays under your finger or mouse while you drag; let go and it carries on to the next one or falls back.
// Only the post on screen plays, and it starts again each time you arrive. feedAt: where you were, for when you come back
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

/* ---------- Film your tries: the phone camera, full screen; the watch can mark each try ---------- */
// One recording for as many tries as you like (as in KEKE): each try is cut out from when you leave the ground to when you land.
// Stopping files every try to the route, then asks "Sent it?" about the last one. cut = tries cut so far in this recording.
// camFree = you said it's none of your routes: the tries are saved without a route and tagged later in Videos
// camReading = opened from "+" with no route picked: the tag says so until the tape in frame is read
// camDone = what the last recording saved, shown in the camera so the next try is one tap away
// wcl = this session's climbs when the watch drives the camera: { n, c (the clip), r, read }. recS = seconds on the REC timer
let wcl = [], recS = 0;
let cut = 0, cutT = null, camPick = false, camFree = false, camReading = false, camRead = false, camT = null, camDone = null;
const filmRoute = () => camFree ? null : camRoute();
// the camera opens at once. A route picked on a card is used as it is; otherwise the tape in frame is read first.
function openCam(read) {
  closeAll(); camDone = null; camPick = false; camFree = false; camReading = read; camRead = read;
  clearTimeout(camT);
  if (read) camT = setTimeout(() => { camReading = false; if (page === 'cam') render(); }, 1400);
  go('cam');
}
// after Stop: the tries just saved, each with the highest move read from the video. Topping is the climber's call.
function camResult() {
  const d = camDone, r = d.r, tr = d.tries, a = tr[0].try, b = tr[tr.length - 1].try;
  const rows = tr.map(c => `<button type="button" data-act="to" data-to="clip/${c.id}"><b>Try ${c.try}</b>${c.sent ? 'Topped' : `move ${c.high}/${r.moves}`}</button>`).join('');
  return `<div class="cam-done" aria-live="polite">
      <b>${d.sent ? `Sent on try ${b}` : a === b ? `Try ${a} saved` : `Tries ${a}–${b} saved`}</b>
      <span>${d.sent ? `${rname(r)} · public, hide it in Videos` : `${rname(r)} · tap a try to watch it`}</span>
      <div class="cd-t">${rows}</div>
      <div class="two">${d.sent
        ? `<button class="b-glass" type="button" data-act="camdone">Done</button><button class="b-lime" type="button" data-act="to" data-to="clip/${(tr.find(c => c.sent) || tr[tr.length - 1]).id}">${ic.play.replace('#111111', '#111111')}Watch the send</button>`
        : `<button class="b-glass" type="button" data-act="camsee">What to change</button><button class="b-lime" type="button" data-act="sent">${ic.check}I topped try ${b}</button>`}</div>
      ${d.sent ? '<button class="cd-note" type="button" data-act="sentnote">Add a note to this send</button>' : ''}
    </div>`;
}
// with a watch, the watch drives the camera: the orange button starts and stops each climb. The phone never asks anything:
// it counts climbs like the watch, reads the route and how high you got from each video, and keeps the screen on, dimmed
function viewWatchCam() {
  const N = wcl.length + 1, last = clips.find(c => c.k === TODAY);
  const tm = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const strip = wcl.slice().reverse().map(w => `<span class="${w.read ? '' : 'rd'}"><b>Climb ${w.n}</b>${!w.read ? 'Reading…' : w.r ? `${sw(w.r)}${w.r.color} ${w.r.grade} · ${w.c.sent ? 'topped' : `hold ${w.c.high}`}` : 'No route · tag it later'}</span>`).join('');
  return { bare: true, dark: true, html: '', overlay: `
    <img src="img/${(filmRoute() || {}).img || 'wall2'}.jpg" alt="Camera view of the wall">
    ${filming ? '<span class="cam-live" aria-hidden="true"></span>' : '<span class="cam-dim" aria-hidden="true"></span>'}
    <div class="cam-top">
      <button class="bk" type="button" data-act="back" aria-label="Back">${ic.back}</button>
      <span class="pk-tag">${filming ? `Climb ${N}` : `Climb ${N} next`}</span>
      ${filming ? `<span class="rec-on"><i></i>REC <span id="recT" class="num">${tm(recS)}</span></span>` : `<span class="cam-w">${ic.watch('#FFFFFF')}Watch</span>`}
    </div>
    <p class="cam-rd">${filming ? 'Press the orange button on your watch when you’re down' : 'Your watch starts recording · screen stays on, dimmed'}</p>
    <span class="cam-fr" aria-hidden="true"></span>
    ${!filming && !wcl.length ? '<p class="cam-hint">Prop the phone up so the whole route fits. Then press the orange button on your watch to start climb 1.</p>' : ''}
    ${!filming && wcl.length ? `<div class="cam-wl" aria-live="polite">${strip}</div>` : ''}
    <div class="cam-bot">
      ${last ? `<button class="cam-last" type="button" data-act="to" data-to="clip/${last.id}" aria-label="Your last video"><img src="img/${last.img}.jpg" alt=""></button>` : '<span></span>'}
      <button class="shut${filming ? ' on' : ''}" type="button" data-act="shoot" aria-label="${filming ? `Stop climb ${N}` : `Start climb ${N}`}"><i></i></button>
      ${wcl.length && !filming ? '<button class="cam-s cam-end" type="button" data-act="wend">End session</button>' : '<span class="cam-s">or tap here</span>'}
    </div>` };
}
function viewCam() {
  if (watch) return viewWatchCam();
  const r = filmRoute(), next = r ? r.tries + 1 : 1;
  const chips = Array.from({ length: cut }, (_, i) => `<span>Try ${next + i} · 0:${34 + i * 5}</span>`).join('');
  const busy = filming || camReading;
  const tag = camFree ? 'No route · tag it later' : camReading ? 'Reading the tape…' : `${sw(r)}${r.color} ${r.grade} · try ${next + cut}`;
  const rd = camPick ? 'Which route are you on?' : camFree ? 'Tag it later in Videos' : camReading ? 'Point the camera at the route' : camDone?.sent && r !== camDone.r ? 'Your next route · tap it to change' : camRead ? 'Read from the tape in frame' : 'The route you picked';
  const last = clips.find(c => c.k === TODAY);
  return { bare: true, dark: true, html: '', overlay: `
    <img src="img/${r ? r.img : 'wall2'}.jpg" alt="Camera view of the wall">
    <div class="cam-top">
      <button class="bk" type="button" data-act="back" aria-label="Back">${ic.back}</button>
      <button class="pk-tag cam-rt" type="button" data-act="campick" aria-expanded="${camPick}"${busy ? ' disabled' : ''}>${tag}${busy ? '' : '<small>Change</small>'}</button>
      ${filming ? `<span class="rec-on"><i></i>REC <span id="recT" class="num">${Math.floor(recS / 60)}:${String(recS % 60).padStart(2, '0')}</span></span>` : ''}
    </div>
    ${!filming ? `<p class="cam-rd">${rd}</p>` : ''}
    ${camPick ? `<div class="cam-pick">${mine().filter(x => !x.topped).map(x => `<button type="button" data-act="camrt" data-i="${list().indexOf(x)}" aria-pressed="${x === r}">${sw(x)}${x.color} ${x.grade}</button>`).join('')}
      <button type="button" data-act="camrt" data-i="-1" aria-pressed="${!r}">None of these · tag it later</button></div>` : ''}
    <span class="cam-fr" aria-hidden="true"></span>
    ${cut ? `<div class="cam-cuts" aria-live="polite">${chips}</div>` : ''}
    ${camDone && !filming ? camResult() : `<p class="cam-hint">${!filming ? 'Prop the phone up so the whole route fits, then tap once. Climb as many tries as you like.'
      : cut ? `${n(cut, 'try', 'tries')} cut so far. Keep going, or tap stop when you’re done.` : 'Recording. We cut out each try when you leave the ground and land.'}</p>`}
    <div class="cam-bot">
      ${last ? `<button class="cam-last" type="button" data-act="to" data-to="clip/${last.id}" aria-label="Your last video"><img src="img/${last.img}.jpg" alt=""></button>` : '<span></span>'}
      <button class="shut${filming ? ' on' : ''}" type="button" data-act="shoot" aria-label="${filming ? 'Stop recording' : 'Start recording'}"><i></i></button>
      ${watch ? `<span class="cam-s">${ic.watch('#FFFFFF')}Watch ready</span>` : `<button class="cam-s" type="button" data-act="to" data-to="watch">${ic.watch('#FFFFFF')}Use a watch</button>`}
    </div>` };
}

/* ---------- Watch: log tries from the wrist while the phone films ---------- */
// the watch only starts and stops a try. It never asks anything: the phone reads the route and how high you got from the video.
// Rest counts up, no timer telling you when to go. The page has a watch you can tap through, the same four screens
let wst = 0;
function watchDemo() {
  const r = current() || list()[0], hi = r.highs?.[r.highs.length - 1] || Math.min(3, r.moves);
  const tm = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/, '');
  const tb = t => `<span class="aw-tb"><b>${t}</b><span class="num">${tm}</span></span>`, ab = t => `<span class="aw-ab"><i></i>${t}</span>`;
  // the same screens as watch.html: check the frame, climb, saved, rest. The orange Action button starts and stops a climb
  const S = [
    `${tb('Spotter')}<span class="aw-b"><span class="aw-pv"><img src="img/v864.jpg" alt=""><span><i></i>Phone · filming when you start</span></span>${ab('Press to start climb 1')}</span>`,
    `${tb('Climb 1')}<span class="aw-b"><span class="aw-s"><i class="aw-rec"></i>Filming on your phone</span><span class="aw-big lime num">0:23</span>${ab('Press when you’re down')}</span>`,
    `${tb('Climb 1')}<span class="aw-b"><svg class="aw-ring" viewBox="0 0 150 150"><circle cx="75" cy="75" r="62" stroke="rgba(221,242,106,.22)"/><circle cx="75" cy="75" r="62" stroke="#DDF26A" stroke-linecap="round" stroke-dasharray="389.6" stroke-dashoffset="130" transform="rotate(-90 75 75)"/></svg><span class="aw-n">Saved · 0:48<br>Reading it on your phone</span></span>`,
    `${tb('Rest')}<span class="aw-b"><span class="aw-big num">1:42</span><span class="aw-cell"><span><b style="color:${r.hex}">●</b> <b style="color:#fff">${rname(r)}</b><em>Climb 1 · try ${r.tries} on it</em></span><b>Hold ${hi} of ${r.moves}</b></span>${ab('Press to start climb 2')}</span>`];
  const cap = ['Your phone’s camera, on your wrist: step in and check you’re in frame. Then press the orange Action button.',
    'Press the orange button again when you’re down, or double tap.',
    'Nothing to answer. Your phone reads the route and how high you got.',
    'Once it’s read, the route and your try on it show here. Rest counts up: press when you’re ready.'];
  return `<div class="wd" id="wdemo">
      <button class="aw" type="button" data-act="wtap" aria-label="Tap the watch: next screen"><span class="aw-dev"><span class="aw-ws">${S[wst]}</span><img class="aw-bz" src="img/watch-ultra.png" alt=""><span class="aw-act"></span></span></button>
      <span class="wd-dots">${S.map((_, i) => `<button type="button" data-act="wgo" data-i="${i}" aria-label="Screen ${i + 1}" aria-current="${i === wst}"></button>`).join('')}</span>
      <p class="wd-c"><b>${['Check the frame', 'Climbing', 'Saved', 'Resting'][wst]}</b>${cap[wst]}</p></div>`;
}
function viewWatch() {
  const mineW = user === 'regular' ? 'Maria’s Apple Watch' : 'Your Apple Watch';
  return { photo: 'woman3', html: `
    ${bar('Watch')}
    <h1 class="hl">Climb with your watch</h1>
    <p class="sub-w">Your phone films from the floor. Your wrist starts and stops each try, so every video is one try.</p>
    <section class="glass scan-c">
      <span class="t2">${watch ? mineW : 'Apple Watch or Wear OS'}</span>
      <span class="sub">${watch ? 'Connected · starts and stops each try' : 'Not connected yet'}</span>
      ${watch ? '<button class="b-glass" type="button" data-act="watch">Disconnect</button>' : `<button class="pk-go static" type="button" data-act="watch">${ic.watch('#111111')}Connect a watch</button>`}
    </section>
    <div class="fold"></div>
    <div class="hl2 dk2"><h2>On your wrist</h2><span class="hint2">tap the watch</span></div>
    ${watchDemo()}
    <div class="rows">
      <a class="row" href="watch.html" target="_blank" rel="noopener"><span class="row-t"><strong>Open the watch prototype</strong><span>The watch app on its own page, full size</span></span>${ic.arr('#111111')}</a>
      <div class="row"><span class="row-t"><strong>Wrong route or try?</strong><span>Fix it on the video later. The watch never asks while you climb.</span></span></div>
      <div class="row"><span class="row-t"><strong>No signal?</strong><span>Tries save on the watch and sync when your phone is back.</span></span></div>
      <div class="row"><span class="row-t"><strong>Apple Health</strong><span>Each session saves as a Climbing workout: time, heart rate and calories, each climb a segment. Asks once.</span></span></div>
      <div class="row"><span class="row-t"><strong>Session time</strong><span>From your first climb to End, rest included.</span></span></div>
    </div>` };
}

/* ---------- shell: routing, render, sheets ---------- */
const views = { logc: viewLogc, beta: viewBeta, gyms: viewGyms, walls: viewGymsTab, gym: viewGym, scan: viewScan, route: viewRoute, compare: viewCompare, summary: viewSummary, profile: viewProfile, videos: viewVideos, clip: viewClip, friends: viewFriends, person: viewPerson, cam: viewCam, watch: viewWatch, edit: viewEdit };
const tabOf = { logc: 'profile', beta: 'walls', compare: 'videos', cam: 'videos', watch: 'profile', walls: 'walls', gym: 'walls', gyms: 'walls', scan: 'walls', route: 'walls', videos: 'videos', clip: 'videos', friends: 'friends', person: 'friends', profile: 'profile' };
const dock = document.querySelector('.dock');
function readHash() { const [p = '', a = ''] = location.hash.replace(/^#\/?/, '').split('/'); page = p === 'setup' || views[p] ? p : 'videos'; arg = a; }
function go(p) { if (location.hash === '#/' + p) render(); else location.hash = '#/' + p; }

// the dock belongs to the four tabs only; every page you open from a tab (route, clip, compare, gyms, set-up…) has a back button instead
const tabs = ['videos', 'walls', 'friends', 'profile'];
function render() {
  feedStop();
  const v = page === 'setup' ? (setupViews[arg] || setupViews.gym)() : views[page](arg);
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
  document.querySelector('.screen').classList.toggle('tok-on', !!v.tok);
  document.querySelector('.screen').classList.toggle('fit', !!v.fit);
  document.querySelector('.screen').classList.remove('snap'); document.querySelector('.screen').style.scrollPaddingTop = ''; $('main').style.paddingBottom = '';   // the analysis page turns it on once its video sticks   // a page sized to the screen: nothing below it to scroll to
  dock.hidden = !!v.cta || !!v.bare || !tabs.includes(page);
  dock.querySelectorAll('.dk:not(.plus)').forEach(b => b.toggleAttribute('aria-current', b.dataset.dock === tabOf[page]));
  dock.querySelector('[aria-current]')?.setAttribute('aria-current', 'page');
  $('plus').innerHTML = `${ic.plus}<span>Add</span>`;
  island();
  $('friendsPip').style.display = user === 'regular' && tagPending ? '' : 'none';
  if (gmap && !v.after) { gmap.remove(); gmap = null; }
  v.after?.();
  clips.forEach(c => { if ((c.r || vidOf(c)) && !c.an && !c.hold) analyse(c); });   // every video is analysed as soon as it's here, whichever page you're on, with or without a route
}

// the Dynamic Island shows a live session on every page, like a Live Activity; tap it for the session in Videos
function island() {
  const el = document.querySelector('.island'), live = session === 'live';
  el.classList.toggle('live', live);
  const now = secs + (filming ? recS : 0);
  const clk = now < 3600 ? `${Math.floor(now / 60)}:${String(now % 60).padStart(2, '0')}` : fmt(now);
  el.innerHTML = live ? `<i></i><b class="num">${clk}</b>` : '';
  live ? el.setAttribute('data-act', 'island') : el.removeAttribute('data-act');
  el.setAttribute('aria-label', live ? `Climbing at ${gyms[gi].name}, ${clk}. Open the session` : '');
}

const toastEl = $('toast');
let tt;
// a toast with Undo: shown longer, and tappable
let undoFn = null;
function toastUndo(msg, fn) { undoFn = fn; toastEl.innerHTML = `<span>${msg}</span><button type="button" data-act="undo">Undo</button>`; toastEl.classList.add('show', 'un');
  clearTimeout(tt); tt = setTimeout(() => { toastEl.classList.remove('show', 'un'); undoFn = null; }, 4500); }
function toast(msg) { toastEl.classList.remove('un'); undoFn = null; toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('show'), 2200); }

const sheet = $('sheet'), ask = $('ask'), scrim = $('scrim');
function closeAll() { [sheet, ask, scrim].forEach(x => x.classList.remove('show')); clearTimeout(closeAll.t); closeAll.t = setTimeout(() => { if (!ask.classList.contains('show')) ask.innerHTML = ''; }, 400); }
// any one-off bottom sheet goes in the #ask slot
function pane(html) {
  ask.innerHTML = '<div class="grab"></div>' + html;
  sheet.classList.remove('show');
  ask.classList.add('show'); scrim.classList.add('show');
}
// "Keep climbing?" after a log or a compare. A recording's tries are shown in the camera itself (camResult).
let lastCut = 1;
function openAsk(kind, title = '') {
  pane(`<h2>${title}</h2><span class="sub">${fmt(secs)} so far · ${n(tries, 'try', 'tries')} · ${n(tops, 'top', 'tops')}</span>
      <p class="ask-q">Keep climbing?</p>
      <div class="two"><button class="b-ghost" type="button" data-act="endnow">End session</button><button class="b-lime" type="button" data-act="keep">Pick a route</button></div>`);
}

// "+": KEKE's add menu. Four ways in, each one tap, no questions first: the camera reads which route you're on,
// and anything wrong is fixed later.
function openAdd() {
  pane(`<h2>Add a climb</h2><span class="sub">${gyms[gi].name} · ${session === 'live' ? `climbing for ${fmt(secs)}` : 'today'}</span>
    <div class="add-g">
      <button class="main" type="button" data-act="film">${ic.rec}<b>Film</b><span>${watch ? 'Your watch marks each try' : 'We cut out each try'}</span></button>
      <button type="button" data-act="upload">${ic.up}<b>Upload</b><span>Videos from Photos</span></button>
      <button type="button" data-act="scan">${ic.scan}<b>Scan a wall</b><span>Its moves, for your height</span></button>
      <button type="button" data-act="log">${ic.pen}<b>Log by hand</b><span>No video needed</span></button>
    </div>`);
}
// Log by hand: gym, tape colour, grade, how it went. Matches the gym's list when the route is on it.
const tapes = [['Yellow', '#F2C230'], ['Blue', '#3D7BEA'], ['Red', '#E5484D'], ['Green', '#2E9E62'], ['Orange', '#F08A24'], ['Purple', '#8E5BD8'], ['Black', '#1B1B1B'], ['White', '#F4F4F0']];
// SAMPLE: the routes up at each gym now and where its walls are, as the gym's setters would add them (Kaya gets these from
// gyms). Made up here; in the real app a gym without a setter feed shows no list. x, y = the wall's pin on a 320 x 200 plan
const PLAN = [
  [['Wall A', 46, 52], ['Wall B', 130, 30], ['Wall C', 214, 30], ['Wall D', 282, 78], ['Wall E', 170, 120], ['Kids', 52, 150]],
  [['Wall A', 60, 36], ['Wall B', 160, 30], ['Wall C', 262, 52], ['Wall D', 230, 150], ['Cave', 92, 132]],
  [['Cave', 70, 40], ['Wall A', 160, 30], ['Wall B', 266, 52], ['Slab', 250, 150], ['Board', 60, 150], ['Island', 160, 112]],
  [['Cave', 80, 60], ['Kilter', 220, 44], ['Rope wall', 160, 150]],
  [['Wall A', 70, 40], ['Wall B', 190, 30], ['Silo', 270, 120], ['Wall C', 110, 140]]];
(() => {
  for (const u of ['regular', 'new']) PLAN.forEach((ws, g) => {
    let s = 17 + g * 101;
    const rnd = k => { s = (s * 9301 + 49297) % 233280; return Math.floor(s / 233280 * k); };
    ws.forEach(([w], wi) => { const k = 3 + rnd(4);
      for (let j = 0; j < k; j++) {
        const [color, hex] = tapes[rnd(tapes.length)], v = Math.min(7, rnd(4) + rnd(4));
        if (data[u].some(r => gymAt(r) === g && r.wall === w && r.color === color && r.g === v)) continue;
        const pics = [gyms[g].img, ...(gyms[g].pics || [])];
        data[u].push({ color, hex, grade: 'V' + v, g: v, wall: w, gym: g || undefined, img: pics[(wi + j) % pics.length], tries: 0, moves: 4 + (v + j) % 4,
          highs: [], videos: rnd(3), set: rnd(30), daysLeft: 30, setRoute: true,
          short: ['No tips yet. Film a try and the app reads your moves.', 'Start matched, then trust your feet.', 'Keep your hips close on the last two moves.', 'Big moves, good holds. Commit to the top.'][rnd(4)] });
      } });
  });
})();
// a route as people see it on the list: its stars and how many logged a send (from feelOf, the same numbers the route page shows)
const ascOf = r => { const f = feelOf(r); return { stars: f.stars, n: f.n }; };
let draft = null;
// place = a video without a route (or on the wrong one): same sheet, without "How it went"
function openLog(pre, place = null) {
  // a video starts at the gym it was filmed at (-1 = no location in it); from = where you are now
  const at = place && !Array.isArray(place) ? place.gym ?? gi : gi;
  draft = { gym: at, from: gi, color: pre ? pre.color : null, grade: pre && pre.g != null ? pre.g : null, sent: 0, k: 1, place };
  drawLog();
}
// the colour picker is a bit of wall: one hold per tape colour, each a different shape, with its bolt hole
const HOLDS = ['M6 20c0-8 7-14 16-14s14 5 14 12-6 12-15 12S6 28 6 20z', 'M3 19c2-6 10-10 19-9 8 1 13 5 13 10 0 6-8 9-17 9C9 29 1 26 3 19z',
  'M9 27c-4-6-1-16 8-19 6-2 13 0 15 6 2 8-3 14-11 15-6 1-10 0-12-2z', 'M5 23c0-5 5-9 11-11l15-4c3-1 5 2 4 5l-3 8c-2 6-9 9-17 9-6 0-10-3-10-7z'];
const holdSvg = (hex, i) => `<svg viewBox="0 0 40 34" aria-hidden="true"><g transform="rotate(${[0, 24, -18, 10, -30, 16, -8, 32][i]} 20 18)"><path d="${HOLDS[i % 4]}" fill="${hex}" stroke="rgba(17,17,17,.22)" stroke-width="1.2"/><circle cx="21" cy="19" r="2.2" fill="rgba(17,17,17,.38)"/></g></svg>`;
function drawLog() {
  const d = draft, tc = d.color ? [tapes.find(t => t[0] === d.color)[1], ['Yellow', 'White'].includes(d.color) ? '#111111' : '#FFFFFF'] : ['#111111', '#FFFFFF'], opt = (k, v, label) => `<button type="button" data-act="dset" data-k="${k}" data-v="${v}" aria-pressed="${d[k] === v}">${label}</button>`;
  // the route is what you see: snap its tag, or pick its tape colour and grade. No list of "what's on the wall now": walls reset, so we can't promise it.
  pane(`<h2>${d.place ? 'Which route is this?' : 'Log a climb'}</h2><span class="sub">${d.place ? (Array.isArray(d.place) ? `${n(d.place.length, 'video', 'videos')} you picked` : `Video from ${dayOf(d.place.k)} · ${d.place.len}`) : 'Pick the route, then how it went'}</span>
    <div class="lg-gym">${ic.pin}<span>${d.gym < 0 ? '<b>Unknown gym</b> · no location in the video' : `<b>${gyms[d.gym].name}</b> · ${d.gym === d.from ? 'from your location' : 'picked by you'}`}</span><button type="button" data-act="lgym">${d.gym < 0 ? 'Pick' : 'Change'}</button></div>
    <button class="lsnap" type="button" data-act="lsnap">${ic.scan}<span class="row-t"><strong>Snap the route’s tag</strong><span>We read the tape colour and grade from a photo</span></span></button>
    <div class="field"><span class="lbl">Or pick tape colour and grade</span>
      <div class="wallpick">${tapes.map(([c, h], i) => `<button class="hold" type="button" data-act="dset" data-k="color" data-v="${c}" aria-pressed="${d.color === c}">${holdSvg(h, i)}<span>${c}</span></button>`).join('')}</div>
      <div class="opts grades tags" style="--tc:${tc[0]};--tt:${tc[1]}">${[0, 1, 2, 3, 4, 5, 6, 7].map(g => opt('grade', g, 'V' + g)).join('')}</div>
      <p class="hint">The grade on the gym’s tag. No tag? Pick what it felt like.</p></div>
    ${d.place ? '' : `<div class="field"><span class="lbl">How it went</span>
      <div class="res"><div class="opts">${opt('sent', 1, 'Topped')}${opt('sent', 0, 'Not yet')}</div>
        <span class="step"><button type="button" data-act="dk" data-d="-1" aria-label="One try less">−</button><b>${n(d.k, 'try', 'tries')}</b><button type="button" data-act="dk" data-d="1" aria-label="One try more">+</button></span></div></div>`}
    <button class="btn-l" type="button" data-act="logsave">${d.place ? 'Tag and analyse' : 'Save'}</button>`);
}
// the route a colour and grade point to: the gym's list when you're there, else one you already logged, else a new one only you have
function routeFor(color, g, here) {
  return (here && list().find(x => gymAt(x) === gi && x.color === color && x.g === g)) || clipRoutes().find(x => x.mine && x.color === color && x.g === g)
    || { color, hex: tapes.find(t => t[0] === color)[1], grade: 'V' + g, g, wall: 'Logged by hand', img: 'wall2', tries: 0, moves: 6, highs: [], mine: true };
}

// Which gym? Nearest first from your location; search, or add one that isn't listed (KEKE: "Can't find it? Add a gym")
// gymFor = 'log' (the log sheet) or a video's id
let gymFor = null;
function openGyms(forWhat) {
  gymFor = forWhat;
  const cur = forWhat === 'log' ? draft.gym : (byId(forWhat).gym ?? gi);
  pane(`<h2>Which gym?</h2><span class="sub">Nearest first · from your location</span>
    <input class="gq" id="gq" type="search" placeholder="Search gyms" autocomplete="off" aria-label="Search gyms">
    <div class="rows up-rows">${gyms.map((g, i) => `<button class="row" type="button" data-act="gpick" data-i="${i}" data-n="${g.name.toLowerCase()}" aria-pressed="${i === cur}">
      <span class="row-t"><strong>${g.name}</strong><span>${g.dist}</span></span>${i === cur ? ic.check : ''}</button>`).join('')}</div>
    <button class="link" id="gadd" type="button" data-act="gadd">Can’t find it? Add your gym</button>`);
}
function filterGyms(q) {
  const v = q.trim().toLowerCase();
  let hits = 0;
  ask.querySelectorAll('[data-act="gpick"]').forEach(b => { const on = b.dataset.n.includes(v); b.hidden = !on; hits += on; });
  $('gadd').textContent = v && !hits ? `Add “${q.trim()}” as a new gym` : 'Can’t find it? Add your gym';
}
function pickGym(i) {
  if (gymFor === 'log') { draft.gym = i; drawLog(); return; }
  const c = byId(gymFor);
  c.gym = i; c.gymBy = true;
  closeAll(); render(); toast(`Filmed at ${gyms[i].name}`);
}

function saveLog() {
  const d = draft;
  if (!d.color || d.grade === null) { toast(d.color ? 'Pick the grade' : 'Pick the tape colour'); return; }
  if (d.place) {
    // tag a video: the route on the gym's list, or one only you have logged; then it gets analysed. A gym you picked here goes on the video too.
    const r = routeFor(d.color, d.grade, d.gym === gi);
    const cs = [].concat(d.place);
    cs.forEach(c => {
      if (c.r !== r) { r.tries++; c.try = r.tries; }
      c.r = r; c.high = c.high || Math.min(r.moves - 1, 3);
      if (d.gym !== (c.gym ?? gi)) { c.gym = d.gym; c.gymBy = true; }
    });
    picking = false; picked.clear();
    closeAll(); render(); toast(`${cs.length > 1 ? `${cs.length} videos tagged` : 'Tagged'} ${rname(r)} · analysis ready`);
    return;
  }
  gi = d.gym;
  if (session !== 'live') start();
  // on the gym's list: log against that route. Otherwise it's a route only you have logged.
  let r = d.gym === d.from && list().find(x => gymAt(x) === d.gym && x.color === d.color && x.g === d.grade);
  if (!r) r = { color: d.color, hex: tapes.find(t => t[0] === d.color)[1], grade: 'V' + d.grade, g: d.grade, wall: 'Logged by hand', img: 'wall2', tries: 0, moves: 0, highs: [], mine: true };
  const e = logOf(r);
  r.tries += d.k; e.tries += d.k; tries += d.k; secs += 240 * d.k; bookOf(TODAY, r).tries += d.k;
  if (!r.mine) for (let i = 0; i < d.k; i++) tried(r);
  if (d.sent) {
    tops++; e.sent = true;
    if (!r.mine) { r.topped = true; r.highs[r.highs.length - 1] = r.moves; }
    if (user === 'regular') hardest.regular = Math.max(hardest.regular, r.g);
  }
  lastRoute = r; render();
  openAsk('keep', `${r.color} ${r.grade} logged at ${gyms[gi].name}`);
}

// Upload a video from the camera roll (a demo: these ship with the app). The app reads gym, date and tape colour; you check them in the editor
const WAYC = 'The Way Up · Maschek & Schedl · CC BY 4.0', PEXC = 'Pavel Danilyuk · Pexels';
// k = the day the video was filmed, from the video; gym = where, from its location (0 = Boneyard Boulders). A new user's roll also has the two videos the analysis is shown on
const roll = [['pexels-7591864-crop', 'v864', 26, '6:12 PM', 0, PEXC], ['pexels-7591810-crop', 'v810', 14, '5:58 PM', 0, PEXC],
  ...(user === 'new' ? [['rockspot-v3', 'vrock', 40.9, '', 1, VIDS[0].credit, { ar: VIDS[0].ar }], ['wayup-p8-green', 'wayup-p8-green', 77.8, '', 1, WAYC]] : []),
  ['wayup-p2-green', 'wayup-p2-green', 66, '', 2, WAYC], ['wayup-p10-green', 'wayup-p10-green', 73, '', 2, WAYC, { nocol: true }], ['wayup-p2b-orange', 'wayup-p2b-orange', 44, '', 9, WAYC, { noloc: true }], ['wayup-p3-orange', 'wayup-p3-orange', 36, '', 22, WAYC]]
  .map(([vid, img, s, time, ago, credit, more]) => ({ vid, img, ar: 9 / 16, len: mmssOf(s), t: [0, s], k: TODAY - ago, when: ago ? dayOf(TODAY - ago) : `Today, ${time}`, gym: 0, credit, ...more }));
// pick, and the video opens in the editor. With several, the others wait in Videos and the editor steps through them
const upSel = new Set();
let hideAdded = true;
function openUpload() { upSel.clear(); drawRoll(); }
function drawRoll() {
  const k = upSel.size, order = [...upSel], added = roll.filter(v => v.added).length;
  const shown = roll.map((v, i) => [v, i]).filter(([v]) => !(hideAdded && v.added));
  pane(`<h2>Upload videos</h2><span class="sub">Camera roll · climbing videos first · pick one or many</span>
    ${added ? `<button class="link" type="button" data-act="uphide">${hideAdded ? `Show ${n(added, 'video', 'videos')} already added` : 'Hide videos already added'}</button>` : ''}
    <div class="roll">${shown.map(([v, i], k) => `${k === 0 || shown[k - 1][0].k !== v.k ? `<p class="roll-d">${v.k === TODAY ? 'Today' : dayOf(v.k)}</p>` : ''}<button type="button" class="${upSel.has(i) ? 'on' : ''}${v.added ? ' added' : ''}" data-act="upick" data-i="${i}" aria-pressed="${upSel.has(i)}" aria-label="Video from ${v.when}, ${v.len}${v.added ? ', already added' : ''}"><img src="img/${v.img}.jpg" alt=""><span>${v.added ? 'Added' : v.len}</span>${upSel.has(i) ? `<em>${order.indexOf(i) + 1}</em>` : ''}</button>`).join('')}</div>
    <p class="hint">Only the videos you pick leave your phone.</p>
    <button class="btn-l" type="button" data-act="upnext"${k ? '' : ' disabled'}>${k ? `Add ${n(k, 'video', 'videos')}` : 'Pick a video'}</button>`);
}
// the videos you picked, matched to the route where we can. Nothing is analysed until you ask for it in the editor
let edQ = [], edFrom = '';
// the next video in this batch you haven't finished, after c (then from the start)
const held = id => { const k = edQ.indexOf(id); return k < 0 ? null : [...edQ.slice(k + 1), ...edQ.slice(0, k)].find(q => byId(q)?.hold) ?? null; };   // edFrom: the page you started from. Posting from Community takes you back to see your post
function importPicks(picks) {
  edQ = picks.map((p, i) => {
    // the route is read only for videos from your gym: its routes are the ones we know
    const v = roll[p], r = v.nocol || v.noloc || v.gym !== gi ? null : list()[i % list().length];
    v.added = true;
    if (r) { r.tries++; tried(r); bookOf(v.k, r).tries++; }
    return addClip(r, { try: r ? r.tries : 1, high: r ? r.highs[r.highs.length - 1] : 0, k: v.k, hold: true, orig: true, vid: v.vid, img: v.img, ar: v.ar, len: v.len, t: v.t, gym: v.noloc ? -1 : v.gym }).id;
  });
  closeAll(); ed = null; go(`edit/${edQ[0]}`);
}

/* ---------- The editor: where an imported video opens. Trim it, set its speed and details, post it, or ask for the analysis ---------- */
let ed = null;
const edSpan = () => (ed.b - ed.a) / ed.rate, edMsg = c => ed.color && ed.grade != null || c.r ? '' : 'Pick the tape colour and grade first';
function edApply(c) {
  if (ed.color && ed.grade != null && (ed.color !== c.r?.color || ed.grade !== c.r?.g)) { const r = routeFor(ed.color, ed.grade, (c.gym ?? gi) === gi); c.r = r; c.high = r.highs[r.highs.length - 1] || Math.min(r.moves - 1, 3); }
  const D = vidOf(c).t[1], trim = ed.a > 0 || ed.b < D ? [ed.a, ed.b] : null, cut = String(trim) !== String(c.trim || null);
  if (c.r && ed.sent && !c.sent) { const e = bookOf(c.k ?? TODAY, c.r); e.tries ||= 1; e.sent = true; e.style ||= ed.try <= 1 ? 'Flash' : 'Redpoint'; }
  c.try = ed.try; c.sent = ed.sent; c.rate = ed.rate; c.trim = trim; c.len = mmssOf(Math.round(edSpan()));
  return cut;
}
function viewEdit(id) {
  const c = byId(id), lv = c && vidOf(c);
  if (!lv) return lostClip();
  if (ed?.id !== c.id) ed = { id: c.id, color: c.r?.color ?? null, grade: c.r?.g ?? null, try: c.try, sent: c.sent, rate: c.rate || 1, a: c.trim?.[0] ?? 0, b: c.trim?.[1] ?? lv.t[1] };
  const at = edQ.indexOf(c.id), next = at >= 0 ? edQ[at + 1] : null, g = gymOf(c);
  const opt = (k, v, label, on) => `<button type="button" data-act="edset" data-k="${k}" data-v="${v}" aria-pressed="${on}">${label}</button>`;
  return { photo: c.img, after: edWire, html: `
    ${bar(at >= 0 && edQ.length > 1 ? `Edit video · ${at + 1} of ${edQ.length}` : 'Edit video')}
    ${at >= 0 && edQ.length > 1 ? `<div class="ed-q">${edQ.map((id, k) => { const q = byId(id); return q ? `<button type="button" class="${id === c.id ? 'on' : ''}" ${id === c.id ? 'aria-current="true"' : `data-act="ednext" data-i="${id}"`} aria-label="Video ${k + 1}${q.hold ? '' : ', done'}"><img src="img/${q.img}.jpg" alt=""><span class="num">${k + 1}</span>${q.hold ? '' : `<em>${ic.check}</em>`}</button>` : ''; }).join('')}</div>` : ''}
    <div class="ed-v" data-act="edplay"><video id="edv" src="video/${lv.vid}.mp4" poster="img/${lv.img}.jpg" muted playsinline preload="auto" style="aspect-ratio:${lv.ar}"></video><span class="ed-p" id="edp">${ic.play.replace('#111111', '#FFFFFF')}</span></div>
    <div class="hl2 dk2"><h2>Length</h2><span class="ed-n num" id="edn"></span></div>
    <div class="ed-ts"><span><b>Start</b><i class="num" id="eds"></i></span><span class="now"><b>Now</b><i class="num" id="edw"></i></span><span class="lst"><b>End</b><i class="num" id="ede"></i></span></div>
    <div class="ed-tl" id="edtl" data-d="${lv.t[1]}">
      <div class="ed-fs" id="edfs"><canvas id="edf"></canvas><i class="ed-dim" id="edl"></i><i class="ed-dim" id="edr"></i><i class="ed-box" id="edbox"></i>
        <i class="ed-ph" id="edhd"></i>
        <span class="ed-h l" id="edha" role="slider" tabindex="0" aria-label="Start" aria-valuemin="0"></span><span class="ed-h r" id="edhb" role="slider" tabindex="0" aria-label="End" aria-valuemin="0"></span></div>
      <div class="ed-ru" id="edru">${edRuler(lv.t[1])}</div></div>
    <div class="hl2 dk2"><h2>Speed</h2></div>
    <div class="fchips">${[.5, 1, 1.5, 2].map(r => opt('rate', r, `${r}×`, ed.rate === r)).join('')}</div>
    <div class="hl2 dk2"><h2>Details</h2></div>
    ${c.r && !ed.chg ? `<div class="rows"><div class="row"><span class="row-t"><strong>${sw(c.r)}${rname(c.r)}</strong><span>${g ? g.name : 'Unknown gym'} · try ${ed.try} · read from the video</span></span><button class="pj" type="button" data-act="edchg">Change</button></div></div>` : `
    <div class="rows"><div class="row"><span class="row-t"><strong><span>Try</span> <span class="num" id="edtn">${ed.try}</span></strong><span>Which try on this route</span></span>
        <span class="ed-st"><button type="button" data-act="edtry" data-d="-1" aria-label="One less">−</button><button type="button" data-act="edtry" data-d="1" aria-label="One more">+</button></span></div>
      <div class="row"><span class="row-t"><strong>${g ? g.name : 'Unknown gym'}</strong><span>${g ? 'Gym' : 'No location in the video · pick the gym'}</span></span><button class="pj" type="button" data-act="cgym" data-i="${c.id}">${g ? 'Change' : 'Pick'}</button></div></div>
    <div class="field ctag"><span class="lbl">Tape colour and grade</span>
      <div class="opts tapes">${tapes.map(([t, h]) => opt('color', t, `<span class="sw" style="background:${h}"></span>${t}`, ed.color === t)).join('')}</div>
      <div class="opts grades">${[0, 1, 2, 3, 4, 5, 6, 7].map(v => opt('grade', v, 'V' + v, ed.grade === v)).join('')}</div></div>`}
    <div class="field ctag"><span class="lbl">How it ended</span><div class="opts">${opt('sent', 0, 'Still working on it', !ed.sent)}${opt('sent', 1, 'Topped', ed.sent)}</div></div>
    <div class="ed-end"></div>`,
    cta: `<button class="b-ghost" type="button" id="edpost" data-act="edpost" data-i="${c.id}">${c.posted ? 'Posted' : 'Post to community'}</button><button class="b-lime" type="button" data-act="edan" data-i="${c.id}">${held(c.id) ? `Analyse · next video` : 'Analyse'}</button>` };
}
// a ruler with about five labels, whatever the length of the video, and five small steps between labels
function edRuler(D) {
  const big = [1, 2, 5, 10, 15, 30, 60, 120].find(x => D / x <= 6) || 300, small = big / 5, out = [];
  for (let i = 0; i * small <= D + .001; i++) { const t = i * small, on = i % 5 === 0; out.push(`<i class="${on ? 'b' : ''}" style="left:${t / D * 100}%"></i>${on ? `<span class="num" style="left:${t / D * 100}%">${clockOf(t)}</span>` : ''}`); }
  return out.join('');
}
// the strip of frames: read once per video from a second, unseen player, and kept so going back to the video doesn't read them again
const edStrips = {};
async function edStrip(c, src, D) {
  const cv = $('edf'), box = cv.getBoundingClientRect(), r = devicePixelRatio || 1, W = Math.round(box.width * r), H = Math.round(box.height * r);
  cv.width = W; cv.height = H;
  const x = cv.getContext('2d'), kept = edStrips[src];
  if (kept) { x.drawImage(kept, 0, 0, W, H); return; }
  const N = Math.max(4, Math.ceil(box.width / (box.height * c))), w = W / N, keep = document.createElement('canvas'), k = keep.getContext('2d');
  keep.width = W; keep.height = H;
  const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = src;
  await new Promise((ok, no) => { v.onloadeddata = ok; v.onerror = no; }).catch(() => {});
  if (!v.videoWidth) return;
  for (let i = 0; i < N; i++) {
    if ($('edf') !== cv) return;   // left the page: stop reading, nothing is kept
    await new Promise(ok => { v.onseeked = ok; v.currentTime = (i + .5) / N * D; });
    const s = Math.max(w / v.videoWidth, H / v.videoHeight), sw = w / s, sh = H / s;
    k.drawImage(v, (v.videoWidth - sw) / 2, (v.videoHeight - sh) / 2, sw, sh, i * w, 0, w + 1, H);
    x.drawImage(keep, 0, 0);
  }
  edStrips[src] = keep; v.src = '';
}
let edRun = 0;
function edWire() {
  const v = $('edv'), T = $('edtl'), F = $('edfs'), HA = $('edha'), HB = $('edhb'), D = +T.dataset.d, pc = t => `${t / D * 100}%`, me = ++edRun, GAP = 1;
  const lv = vidOf(byId(ed.id));
  const draw = () => {
    if (!$('edbox')) return;
    $('edl').style.width = pc(ed.a); $('edr').style.width = `${100 - ed.b / D * 100}%`;
    const box = $('edbox').style; box.left = pc(ed.a); box.right = `${100 - ed.b / D * 100}%`;
    HA.style.left = pc(ed.a); HB.style.left = pc(ed.b);
    HA.setAttribute('aria-valuemax', D); HA.setAttribute('aria-valuenow', ed.a); HB.setAttribute('aria-valuemax', D); HB.setAttribute('aria-valuenow', ed.b);
    const span = ed.b - ed.a, kept = Number.isInteger(+span.toFixed(1)) ? span.toFixed(0) : span.toFixed(1);
    $('edn').textContent = ed.rate === 1 ? `${kept} s selected` : `${kept} s selected · plays in ${Math.round(edSpan())} s`;
    $('eds').textContent = stampOf(ed.a); $('ede').textContent = stampOf(ed.b);
    drawNow();
  };
  const drawNow = () => { const h = $('edhd'); if (!h) return; h.style.left = pc(ed.at); $('edw').textContent = stampOf(ed.at); };
  const seek = t => { ed.at = t; v.currentTime = t; drawNow(); };
  const put = (k, t) => { t = Math.round(t * 10) / 10;
    if (k === 'a') ed.a = Math.max(0, Math.min(t, ed.b - GAP)); else ed.b = Math.min(D, Math.max(t, ed.a + GAP));
    seek(ed[k]); draw(); };
  // a touch near a handle moves that handle; anywhere else, and anywhere on the ruler, moves the playhead. Up and down still scrolls the page
  let hold = null;
  const timeAt = e => { const b = F.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)) * D; };
  const move = e => { const t = timeAt(e); if (hold === 'at') seek(Math.max(ed.a, Math.min(ed.b, t))); else put(hold, t); };
  T.onpointerdown = e => { const b = F.getBoundingClientRect(), x = e.clientX - b.left, xa = ed.a / D * b.width, xb = ed.b / D * b.width, near = e.clientY <= b.bottom;
    const inA = near && x >= xa - 26 && x <= xa + 12, inB = near && x >= xb - 12 && x <= xb + 26;
    hold = inA && inB ? (x < (xa + xb) / 2 ? 'a' : 'b') : inA ? 'a' : inB ? 'b' : 'at';
    v.pause(); T.setPointerCapture(e.pointerId); T.classList.add('on'); if (hold !== 'at') $(hold === 'a' ? 'edha' : 'edhb').classList.add('on'); move(e); };
  T.onpointermove = e => { if (hold) move(e); };
  T.onpointerup = T.onpointercancel = () => { hold = null; T.classList.remove('on'); HA.classList.remove('on'); HB.classList.remove('on'); };
  [[HA, 'a'], [HB, 'b']].forEach(([h, k]) => { h.onkeydown = e => { const d = { ArrowLeft: -1, ArrowRight: 1 }[e.key]; if (d) { e.preventDefault(); v.pause(); put(k, ed[k] + d * (e.shiftKey ? 1 : .1)); } }; });
  // the playhead follows the video every frame, and only the chosen stretch plays, round and round
  const tick = () => { if (me !== edRun || !$('edv')) return;
    if (!v.paused && !hold) { if (v.currentTime >= ed.b || v.currentTime < ed.a - .3) v.currentTime = ed.a; ed.at = v.currentTime; drawNow(); }
    requestAnimationFrame(tick); };
  v.playbackRate = ed.rate; edDraw = draw; ed.at = Math.max(ed.a, Math.min(ed.b, ed.at ?? ed.a)); draw(); tick();
  v.addEventListener('loadedmetadata', () => { v.currentTime = ed.at; }, { once: true });
  v.onended = () => { v.currentTime = ed.a; v.play().catch(() => {}); };
  v.onplay = () => $('edp').classList.add('off'); v.onpause = () => $('edp').classList.remove('off');
  edStrip(lv.ar, `video/${lv.vid}.mp4`, D);
}
let edDraw = () => {};
const clockOf = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const stampOf = s => { const t = Math.round(s * 10) / 10; return `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`; };
// log the send: how hard it felt, a note, who filmed you
function openSheet() {
  const r = lastRoute;
  $('sheetSub').textContent = `${r.color} ${r.grade} · ${r.wall} · try ${r.tries}`;
  $('feltLbl').textContent = `How did it feel for a ${r.grade}?`;
  const film = user === 'regular' ? ['Alex', 'Jo', 'No one'] : ['Send a link', 'No one'];
  $('filmOpts').style.gridTemplateColumns = `repeat(${film.length}, 1fr)`;
  $('filmOpts').innerHTML = film.map(f => `<button type="button" aria-pressed="${f === 'No one'}">${f}</button>`).join('');
  $('filmHint').textContent = user === 'regular' ? 'The clip lands in their log too.' : 'We make a link for them. The clip lands in their log when they join.';
  ask.classList.remove('show');
  sheet.classList.add('show'); scrim.classList.add('show');
}

function start() { session = 'live'; secs = 0; tries = 0; tops = 0; posted = false; wcl = []; today.clear(); }
// AI 4 · one recording (shutter or watch): every try in it is cut out and filed to the route, then "Sent it?" about the last one
function record(k = 1) {
  const r = filmRoute();
  // a route the camera read becomes one of yours; point the app at it
  if (r) sel[user] = list().indexOf(r);
  tries += k; secs += 240 * k; // prototype clock: a try plus rest is about 4 minutes
  if (!r) { for (let i = 0; i < k; i++) addClip(null, { k: TODAY, ...VIDS[i % VIDS.length] }); render(); toast(`${n(k, 'try', 'tries')} saved · tag the route in Videos`); return; }
  const saved = [];
  for (let i = 0; i < k; i++) {
    r.tries++; tried(r); logOf(r).tries++; bookOf(TODAY, r).tries++; lgClock();
    saved.push(addClip(r, { try: r.tries, high: r.highs[r.highs.length - 1], k: TODAY, raw: `1:${String(5 + r.tries * 4).padStart(2, '0')}`, ...VIDS[r.tries % VIDS.length] }));
  }
  lastRoute = r; lastCut = k; camDone = { r, tries: saved, sent: false };
  render();
}
// a climb filmed with the watch: saved at once, read from the video a moment later. Never asks if you topped it
function watchClimb() {
  const r = filmRoute(), n = wcl.length + 1;
  tries++; secs += 240;
  let c;
  if (r) { sel[user] = list().indexOf(r); r.tries++; tried(r); logOf(r).tries++; bookOf(TODAY, r).tries++; lgClock(); lastRoute = r; lastCut = 1;
    c = addClip(r, { try: r.tries, high: r.highs[r.highs.length - 1], k: TODAY, raw: `1:${String(5 + r.tries * 4).padStart(2, '0')}`, ...VIDS[r.tries % VIDS.length] }); }
  else c = addClip(null, { k: TODAY, ...VIDS[n % VIDS.length] });
  const w = { n, c, r, read: false }; wcl.push(w); render();
  setTimeout(() => { w.read = true; if (page === 'cam') render(); }, 1800);
}
function setupEnd() {
  const lv = levels[setup.level];
  data.new.forEach(r => { r.g = lv.hi; r.grade = 'V' + lv.hi; });
  go('videos');
}
function endSession() { session = 'saved'; located = false; go('summary'); }

const actions = {
  // set up
  tag: b => {
    if (b.dataset.v === '1') {
      const r = data.new[0]; r.tries = 2; r.highs = [3, 4]; r.you = 5.1; r.senders = 2.2;
      r.highs.forEach((h, t) => addClip(r, { try: t + 1, high: h, k: 75, len: `0:3${t + 4}`, img: 'woman2', by: 'Alex' }));
      toast('2 clips added to Orange V2');
    } else toast('Declined · your name is off Alex’s post'); go('setup/gym'); },
  sgym: b => { gi = +b.dataset.i; render(); },
  // Gyms page
  gyfilm: b => { gi = +b.dataset.g; hereOk = true; openCam(true); },
  gyset: b => { gi = +b.dataset.i; hereOk = true; render(); toast(`You’re at ${gyms[gi].name}${session === 'live' ? ' · this session moves here' : ''}`); },
  gymaps: b => { const g = gyms[+b.dataset.i]; toast(`Opening ${g.name} in Maps · ${g.addr}, ${g.dist}`); },
  gyr: b => { gymR = +b.dataset.v; gymPin = null; render(); },
  to: b => go(b.dataset.to),
  useloc: () => { $('gLoc').value = 'Current location'; },
  savegym: () => {
    const name = $('gName').value.trim(), loc = $('gLoc').value.trim();
    if (!name || !loc) { toast(name ? 'Add where it is too' : 'Add the gym’s name first'); return; }
    gyms.push({ name, dist: loc, routes: 0, set: '', now: 'New', next: '· no check-ins yet', crowd: Array(16).fill(.06) });
    gi = gyms.length - 1; go('setup/level'); toast(`${name} added`);
  },
  lvl: b => { setup.level = +b.dataset.i; readSize(); render(); },
  demo: () => { readSize(); demoHidden = !demoHidden; render(); },
  lvlnext: () => { readSize(); go('setup/clips'); },
  // switching units converts what you typed
  sunit: b => { readSize(); const u = b.dataset.u; if (u === setup.unit) return;
    const f = u === 'in' ? 1 / 2.54 : 2.54, cv = x => x === '' ? '' : String(Math.round(+x * f));
    setup.height = cv(setup.height); setup.span = cv(setup.span); setup.unit = u; render(); },
  done: () => { setupEnd(); toast(`${gyms[gi].name} · ready when you are`); },
  // the last set-up screen goes straight into what it offers: the camera roll over Videos, or the camera
  simport: () => { addEventListener('hashchange', () => { edFrom = 'videos'; openUpload(); }, { once: true }); setupEnd(); },
  sfilm: () => { setupEnd(); openCam(true); },
  // today
  grade: () => toast('V0 is the easiest, V10 the hardest. Most people start at V0–V2.'),
  guide: () => toast('Guide · grades, tape colours, gym etiquette'),
  pick: b => { const i = +b.dataset.i; if (list()[i].topped) return; sel[user] = i; located = false; render(); },
  friends: () => go('friends/plan'),
  crowd: () => toast(`${gyms[gi].name} · usual crowd by hour, from check-ins over 4 weeks`),
  end: () => endSession(),
  videos: () => go(`route/${list().indexOf(current())}`),
  detail: () => go(`route/${list().indexOf(current())}`),
  compare: () => { lastRoute = page === 'route' ? list()[+arg] || current() : current(); go('compare'); },
  more: () => go(`gym/${gi}`),
  me: () => go('profile'),
  bell: () => user === 'regular' && tagPending ? go('friends/plan') : toast('No new notifications'),
  gym: () => { gi = (gi + 1) % gyms.length; render(); },
  // walls, scan, route
  route: b => go(`route/${b.dataset.i}`),
  proj: b => { const r = list()[+b.dataset.i]; r.proj = !r.proj; render(); toast(r.proj ? `${r.color} ${r.grade} saved to try again` : `${r.color} ${r.grade} no longer saved`); },
  // scan a wall: frame it, snap, then the beta drawn on the photo one move at a time
  scan: b => { if (b?.dataset?.g) gi = +b.dataset.g; shot = false; bstep = 0; closeAll(); go('scan'); },
  snap: () => { shot = true; bstep = 0; scanned.seen = true; onList(scanned); render(); toast(`Purple ${scanned.grade} read from the tag · ${scanned.moves} moves`); },
  rescan: () => { shot = false; render(); },
  bstep: b => { bstep = Math.max(0, Math.min(sBeta.length - 1, bstep + +b.dataset.d)); render(); },
  bgo: b => { bstep = +b.dataset.i; render(); },
  scanbeta: () => go(`route/${onList(scanned)}`),
  scanlog: () => { onList(scanned); openLog(scanned); },
  play: b => toast(`Playing ${b.dataset.who}’s send · ${b.dataset.len}`),
  // session
  sent: () => {
    if (page !== 'cam' || !camDone) { openSheet(); return; }
    const first = markSent(camDone.r); camDone.sent = true; render();
    toast(first ? `Your first send! ${rname(camDone.r)}` : `${rname(camDone.r)} sent`);
  },
  sentnote: () => openSheet(),
  // End on the phone ends the watch too, and the other way round
  wend: () => { endSession(); toast('Session ended on your watch too'); },
  camsee: () => { lastRoute = camDone.r; go('compare'); },
  camdone: () => go('videos'),
  keep: () => { closeAll(); go(`gym/${gi}`); },
  endnow: () => { closeAll(); endSession(); },
  fr: b => { frame = Math.min(210, Math.max(1, frame + +b.dataset.d)); render(); },
  again: () => { openCam(false); toast(watch ? 'Tap Start on your watch when you’re ready' : 'Start filming when you’re ready'); },
  // v2 · add a climb: film, upload, log by hand; the watch
  // Film opens the camera and nothing else; the session starts with the first recording
  film: b => { if (b.dataset.r) { sel[user] = +b.dataset.r; located = false; } openCam(!b.dataset.r); },
  shoot: () => {
    clearInterval(cutT);
    if (!filming) {
      // prototype: a try is cut every few seconds while recording
      if (session !== 'live') start();
      filming = true; cut = 0; recS = 0; camDone = null; camPick = false; render();
      // the REC timer and the island both count real seconds; without a watch a try is cut every 3 s (prototype)
      cutT = setInterval(() => { recS++; const t = $('recT'); if (t) t.textContent = `${Math.floor(recS / 60)}:${String(recS % 60).padStart(2, '0')}`;
        if (!watch && filming && page === 'cam' && cut < 4 && recS % 3 === 0) { cut++; render(); } else island(); }, 1000);
      if (watch) return;
      return;
    }
    if (watch) { filming = false; watchClimb(); return; }
    const k = Math.max(1, cut); filming = false; cut = 0; record(k);
  },
  upload: () => { edFrom = page; openUpload(); },
  upick: b => { const i = +b.dataset.i; upSel.has(i) ? upSel.delete(i) : upSel.add(i); drawRoll(); },
  upnext: () => { const s = [...upSel]; if (s.length) importPicks(s); },
  edplay: () => { const v = $('edv'); if (v.paused) { if (v.currentTime >= ed.b - .1) v.currentTime = ed.a; v.play().catch(() => {}); } else v.pause(); },
  edset: b => { const { k, v } = b.dataset; ed[k] = k === 'color' ? v : k === 'sent' ? v === '1' : +v;
    b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    if (k === 'rate') { $('edv').playbackRate = ed.rate; edDraw(); } },
  edchg: () => { ed.chg = true; render(); },
  edtry: b => { ed.try = Math.max(1, ed.try + +b.dataset.d); $('edtn').textContent = ed.try; },
  ednext: b => { edApply(byId(ed.id)); go(`edit/${b.dataset.i}`); },
  edpost: b => { const c = byId(b.dataset.i), m = edMsg(c); if (m) { toast(m); return; } edApply(c); c.posted = true; c.hidden = false; $('edpost').textContent = 'Posted'; toast('Posted to the community');
    if (edFrom === 'friends' && !edQ[edQ.indexOf(c.id) + 1]) { ed = null; feedAt = 0; go('friends'); } },
  // the analysis page still opens on the body check, once for every video that comes through here
  edan: b => { const c = byId(b.dataset.i), m = edMsg(c); if (m) { toast(m); return; }
    const cut = edApply(c), first = c.hold; c.hold = false;
    if (first || cut) { c.an = null; c.track = null; c.tags = null; c.check = true; }
    const nx = held(c.id);
    if (nx != null) { ed = null; toast(`${c.r ? rname(c.r) : 'Video'} is being analysed · it’s in Videos`); go(`edit/${nx}`); return; }
    cTab = 'why'; ed = null; go(`clip/${c.id}`); },
  uphide: () => { hideAdded = !hideAdded; drawRoll(); },
  // in the camera: the route read from the tape in frame; tap it to switch if it's wrong
  campick: () => { if (!filming) { camPick = !camPick; render(); } },
  camrt: b => {
    const i = +b.dataset.i;
    camPick = false; camFree = i < 0;
    if (i >= 0) { sel[user] = i; located = false; }
    render(); toast(camFree ? 'Filming without a route · tag it later in Videos' : `Filming ${rname(list()[i])}`);
  },
  log: b => { if (page === 'cam') { openLog(filmRoute()); return; }
    lgAt = b?.dataset?.g ? +b.dataset.g : gi; lgOpen = null; pinYours(); rtWall = null; rtNew = rtTop = false; rtG = rtC = 0; closeAll(); go('logc'); },
  lgend: () => lgEnd(),
  lgfold: b => { const k = b.dataset.k; lgFold.has(k) ? lgFold.delete(k) : lgFold.add(k); render(); },
  lgtip: () => { lgTipOff = true; render(); },
  lgnovid: b => { const r = list()[+b.dataset.i]; bookOf(TODAY, r).novid = true; render(); },
  lgdone: () => { lgStart = null; closeAll(); render(); toast('Session saved to your Logbook'); },
  // snap a route's tag: we read its colour and grade (prototype: one of this gym's routes you haven't logged today), then the list opens it
  lgsnap: () => { pane(`<h2>Snap the tag</h2><span class="sub">Point at the tape on the start hold</span><div class="lg-cam"><span class="lg-scan"></span><span>Reading…</span></div>`);
    setTimeout(() => { const at = lgAt, all = list().map((r, i) => [r, i]).filter(([r]) => gymAt(r) === at && !book[TODAY]?.get(r)?.sent);
      const [r, i] = all[Math.floor(Date.now() / 1000) % all.length] || [];
      closeAll(); if (r == null) return;
      rtWall = null; rtNew = rtTop = false; rtG = rtC = 0; lgOpen = i; render();
      const w = document.querySelector(`.rt-w[data-i="${i}"]`); w?.scrollIntoView({ block: 'center' }); w?.classList.add('flash');
      toast(`Read from the tag · ${rname(r)}, ${r.wall}`); }, 1300); },
  lgopen: b => { const i = +b.dataset.i; lgOpen = lgOpen === i ? null : i; render(); },
  // pick the gym in a short list; picking closes it and the page shows that gym's routes
  lggym: () => pane(`<h2>Where are you climbing?</h2><span class="sub">Nearest first</span>
    <div class="rows">${gyms.map((g, i) => [g, i]).sort((p, q) => p[0].mi - q[0].mi).map(([g, i]) => `<button class="row" type="button" data-act="lggo" data-g="${i}"><span class="row-t"><strong>${g.name}</strong><span>${g.dist} · ${n(list().filter(r => gymAt(r) === i).length, 'route', 'routes')}</span></span>${i === lgAt ? ic.check : ''}</button>`).join('')}</div>`),
  lggo: b => { lgAt = +b.dataset.g; lgOpen = null; pinYours(); rtWall = null; rtC = 0; closeAll(); render(); },
  lgym: () => openGyms('log'),
  cgym: b => openGyms(+b.dataset.i),
  gpick: b => pickGym(+b.dataset.i),
  gadd: () => {
    const name = $('gq').value.trim();
    if (!name) { $('gq').focus(); toast('Type the gym’s name first'); return; }
    gyms.push({ name, dist: 'Added by you', routes: 0, set: '', now: 'New', next: '· no check-ins yet', crowd: Array(16).fill(.06) });
    pickGym(gyms.length - 1);
  },
  // on a video's page: tape colour and grade, then Tag and analyse
  cset: b => { const k = b.dataset.k; ctag[k] = k === 'color' ? b.dataset.v : +b.dataset.v; render(); },
  ctagsave: b => {
    const c = byId(b.dataset.c), r = routeFor(ctag.color, ctag.grade, (c.gym ?? gi) === gi);
    r.tries++; c.r = r; c.try = r.tries; c.high = r.highs[r.highs.length - 1] || Math.min(r.moves - 1, 3);
    c.an = c.track && c.auto ? (r.ok ? 'done' : 'ask') : null;
    render(); toast(`Tagged ${rname(r)} · try ${c.try} · analysis ready`);
  },
  lsnap: () => { draft.color = 'Purple'; draft.grade = 2; drawLog(); toast('Read from the photo · Purple tape, V2'); },
  dset: b => { draft[b.dataset.k] = b.dataset.k === 'color' ? b.dataset.v : +b.dataset.v; drawLog(); },
  dk: b => { draft.k = Math.max(1, Math.min(20, draft.k + +b.dataset.d)); drawLog(); },
  logsave: () => saveLog(),
  wtap: () => { wst = (wst + 1) % 4; $('wdemo').outerHTML = watchDemo(); },
  wgo: b => { wst = +b.dataset.i; $('wdemo').outerHTML = watchDemo(); },
  watch: () => { watch = !watch; render(); toast(watch ? 'Watch connected · tap Start before each try' : 'Watch disconnected'); },
  notnow: () => { const r = lastRoute || current(); openAsk('keep', `${r.color} ${r.grade} saved for next time`); },
  hide: b => {
    const [r, e] = [...today.entries()][+b.dataset.i];
    e.hidden = !e.hidden; clips.forEach(c => { if (c.r === r && c.k === TODAY) c.hidden = e.hidden; }); render();
  },
  post: () => {
    const k = [...today.values()].filter(e => e.sent && !e.hidden).length, h = [...today.values()].filter(e => e.hidden).length;
    if (k && !posted) toast(`${n(k, 'send', 'sends')} posted${h ? ` · ${h} hidden` : ''}`);
    posted = true; go('videos');
  },
  // videos: filter, open, tag a route, hide, delete
  vf: b => { const i = +b.dataset.i; vf = i === -1 ? 'all' : i === -2 ? 'none' : i === -3 ? 'other' : myRoutes()[i]; render(); },
  place: b => { const c = byId(b.dataset.i); openLog(c.r, c); },
  anok: b => { const c = byId(b.dataset.i); confirmed(c, c.auto); },
  tagstart: b => { $('lvv')?.pause(); tagS = { id: +b.dataset.i, i: 0, pts: {} }; drawTag(byId(b.dataset.i)); document.querySelector('.screen').scrollTo(0, 0); },
  tagundo: b => { if (tagS.i) { tagS.i -= 1; delete tagS.pts[TAGS[tagS.i][0]]; } else if (byId(b.dataset.i).auto) tagS = { id: null, i: 0, pts: {} }; drawTag(byId(b.dataset.i)); },
  tagdone: b => { const c = byId(b.dataset.i); confirmed(c, { ...tagS.pts, t: c.auto?.t ?? 0 }, true); },
  retag: b => { const c = byId(b.dataset.i); c.tags = null; c.an = 'ask'; tagS = { id: null, i: 0, pts: {} }; render(); document.querySelector('.screen').scrollTo(0, 0); },
  pvplay: pvPlay,
  ctab: b => { cTab = b.dataset.v; setTimeout(() => $('main').dispatchEvent(new Event('tabchange'))); document.querySelectorAll('.ctabs button').forEach(x => x.setAttribute('aria-pressed', x === b)); document.querySelectorAll('.pn').forEach(p => { p.hidden = p.dataset.pn !== cTab; }); },
  spd: b => { speed = { 1: .5, .5: .25, .25: 1 }[speed] || 1; const v = $('lvv'); if (v) v.playbackRate = speed; b.textContent = `${speed}×`; },   // 1× → 0.5× → 0.25×
  vplay: b => toast(`Playing · ${b.dataset.len}`),
  segplay: b => $('lvv') && document.querySelector('.lv-w.two') ? segMain(b) : segOpen(b),
  segtoggle: () => { const v = $('cpv'); if (!v || !seg) return; if (seg.over) segAgain(); else if (v.paused) v.play().catch(() => {}); else v.pause(); },
  segagain: segAgain,
  segspeed: () => { const v = $('cpv'); if (!v || !seg) return; seg.rate = seg.rate === .5 ? 1 : .5; v.playbackRate = seg.rate; $('cps').textContent = `${seg.rate}×`; },
  segclose: segClose,
  lvplay: () => { const v = $('lvv'); if (v) v.paused ? v.play().catch(() => {}) : v.pause(); },
  vcmp: b => { lastRoute = byId(b.dataset.i).r; go('compare'); },
  vhide: b => { const c = byId(b.dataset.i); c.hidden = !c.hidden; render(); },
  cpost: b => { const c = byId(b.dataset.i); c.note = ($('pstn')?.value || '').trim(); c.posted = true; c.hidden = false; render(); toast('Posted to the community'); },
  seepost: b => { const c = byId(b.dataset.i); feedAt = Math.max(0, clips.filter(x => x.posted && !x.hidden).indexOf(c)); go('friends'); },
  vdel: b => { clips.splice(clips.indexOf(byId(b.dataset.i)), 1); go('videos'); toast('Video deleted · the try stays in your log'); },
  // Select mode: pick videos, then hide, change route or delete them together
  vsel: () => { picking = !picking; picked.clear(); render(); },
  vpick: b => { const ids = b.dataset.i.split(',').map(Number), on = ids.every(id => picked.has(id)); ids.forEach(id => on ? picked.delete(id) : picked.add(id)); render(); },
  bhide: () => {
    if (!picked.size) { toast('Tap videos to select them'); return; }
    const cs = clips.filter(c => picked.has(c.id)), hide = cs.some(c => !c.hidden);
    cs.forEach(c => { c.hidden = hide; }); picking = false; picked.clear(); render();
    toast(`${n(cs.length, 'video', 'videos')} ${hide ? 'hidden · only you see them' : 'public again'}`);
  },
  btag: () => { if (!picked.size) { toast('Tap videos to select them'); return; } openLog(null, clips.filter(c => picked.has(c.id))); },
  bdel: () => {
    if (!picked.size) { toast('Tap videos to select them'); return; }
    pane(`<h2>Delete ${n(picked.size, 'video', 'videos')}?</h2><span class="sub">The tries stay in your log, with how high you got.</span>
      <div class="two"><button class="b-ghost" type="button" data-act="close">Keep</button><button class="b-lime" type="button" data-act="bdelyes">Delete</button></div>`);
  },
  bdelyes: () => {
    const k = picked.size;
    for (let i = clips.length - 1; i >= 0; i--) if (picked.has(clips[i].id)) clips.splice(i, 1);
    picking = false; picked.clear(); closeAll(); render(); toast(`${n(k, 'video', 'videos')} deleted · the tries stay in your log`);
  },
  close: () => closeAll(),
  // originals in Photos: Spotter keeps the trimmed copy
  oldset: () => toast(`Purple V2 · 3 videos, last climbed ${shortDay(TODAY - 23)}`),
  origdel: () => {
    const k = clips.filter(c => c.orig).length;
    pane(`<h2>Delete ${n(k, 'original', 'originals')} from Photos?</h2><span class="sub">Spotter keeps a trimmed copy of each, with its analysis. Frees ${(k * .15).toFixed(1)} GB.</span>
      <div class="two"><button class="b-ghost" type="button" data-act="close">Keep them</button><button class="b-lime" type="button" data-act="origyes">Delete originals</button></div>`);
  },
  origyes: () => { const k = clips.filter(c => c.orig).length; clips.forEach(c => { c.orig = false; }); closeAll(); render(); toast(`${(k * .15).toFixed(1)} GB freed on your phone`); },
  // share a send, or every send as a reel
  share: b => openShare(byId(b.dataset.i)),
  // ticking a first-visit step: it stays ticked for this gym, and only the list changes
  gyhas: b => { gyAll.add(+b.dataset.g); render(); },
  rtwall: b => { rtWall = b.dataset.w && b.dataset.w !== rtWall ? b.dataset.w : null; render(); },
  rtnew: () => { rtNew = !rtNew; render(); },
  rttop: () => { rtTop = !rtTop; render(); },
  rtg: () => { rtG = (rtG + 1) % RT_G.length; render(); },
  rtc: () => { const k = new Set(list().filter(r => gymAt(r) === (page === 'logc' ? lgAt : gyFor)).map(r => r.color)).size; rtC = (rtC + 1) % (k + 1); render(); },
  rtmap: b => { gyFor = +b.dataset.g; gyTab = 'routes'; rtWall = b.dataset.w; rtNew = rtTop = false; rtG = rtC = 0; go(`gym/${b.dataset.g}`); },
  // an attempt: counted on the route and in today's logbook; the page shows the new count
  rtry: b => { const r = list()[+b.dataset.r], undo = snap(r); lgClock(); r.tries++; tried(r); logOf(r).tries++; bookOf(TODAY, r).tries++; r.seen = true; render(); toastUndo(`${rname(r)} · attempt ${r.tries}`, undo); },
  undo: () => { const f = undoFn; undoFn = null; toastEl.classList.remove('show', 'un'); f?.(); },
  rsend: b => { const r = list()[+b.dataset.r]; ls = { i: +b.dataset.r, stars: 0, style: r.tries ? 'Redpoint' : 'Flash', k: r.tries + 1, feel: null }; drawSend(); },
  lsset: b => { const k = b.dataset.k; ls[k] = k === 'stars' ? +b.dataset.v : b.dataset.v; if (k === 'style' && ls.style === 'Flash') ls.k = 1; if (k === 'style' && ls.style === 'Redpoint' && ls.k < 2) ls.k = 2; drawSend(); },
  lsk: b => { ls.k = Math.max(1, ls.k + +b.dataset.d); ls.style = ls.k === 1 ? 'Flash' : 'Redpoint'; drawSend(); },
  lsdone: () => sendNow(ls),
  bkd: b => { if (b.dataset.k === '') return; bookAt = +b.dataset.k; render(); },
  gytab: b => { gyTab = b.dataset.v; render(); document.querySelector('.screen').scrollTop = 0; },
  gywhen: () => { gyWhen = GY_WHEN[(GY_WHEN.indexOf(gyWhen) + 1) % GY_WHEN.length]; render(); },
  gywhenall: () => { gyWhen = 'All time'; render(); },
  gycopy: b => { const g = gyms[+b.dataset.i]; navigator.clipboard?.writeText(g.addr).then(() => toast('Address copied'), () => toast(g.addr)); },
  fvopen: b => { const g = +b.dataset.g; fvOpen.add(g); const fv = $('fv'); if (fv) fv.outerHTML = firstVisit(gyms[g], g); },
  fvtick: b => { const g = +b.dataset.g, k = b.dataset.k, d = fvDone[g] = fvDone[g] || [];
    d.includes(k) ? d.splice(d.indexOf(k), 1) : d.push(k); fvOpen.delete(g);
    try { localStorage.setItem('chalk.track.v5.firstvisit', JSON.stringify(fvDone)); } catch {}
    const fv = $('fv'); if (fv) fv.outerHTML = firstVisit(gyms[g], g); },
  fcmake: b => fcMake(byId(b.dataset.i)),
  fcshare: b => { const j = fcJobs[b.dataset.i]; if (j?.file) navigator.share({ files: [j.file] }).catch(() => {}); },
  reel: () => openReel(),
  shsave: () => { closeAll(); toast('Saved to Photos'); },
  shsend: () => { closeAll(); toast(user === 'regular' ? 'Sent to Alex and Jo' : 'Link copied · paste it anywhere'); },
  // profile, friends
  size: () => toast('Change your level, height and arm span here'),
  export: () => toast(user === 'regular' ? 'spotter-log.csv · 142 tries, 24 sends, every video link' : `spotter-log.csv · ${n(tries, 'try', 'tries')} so far`),
  ftag: b => {
    tagPending = false;
    if (b.dataset.v === '1') [4, 5].forEach(t => addClip(data.regular[0], { try: t, high: 4, k: 75, len: `0:4${t}`, img: 'woman2', by: 'Alex' }));
    render(); toast(b.dataset.v === '1' ? '2 clips added to Yellow V3 · in Videos' : 'Declined · your name is off Alex’s post');
  },
  invite: () => toast('Invite link copied'),
  fadd: () => openFriendAdd(),
  fadd1: b => { const w = b.dataset.w, f = follows[user]; f.has(w) ? f.delete(w) : f.add(w); openFriendAdd(); render(); },
  pl: () => openPlan(),
  plg: b => { pd.g = +b.dataset.v; drawPlan(); },
  pld: b => { pd.d = +b.dataset.v; drawPlan(); },
  plh: b => { pd.h = +b.dataset.v; drawPlan(); },
  plw: b => { const w = b.dataset.w; pd.who.has(w) ? pd.who.delete(w) : pd.who.add(w); drawPlan(); },
  plgo: () => { const p = { by: 'You', g: pd.g, d: pd.d, h: pd.h, who: ['You', ...pd.who] }; plans[user].unshift(p); pd = null; closeAll(); render();
    toast(`${dayName(p.d)} · ${clock(p.h)} at ${gyms[p.g].name}${p.who.length > 1 ? ` · ${names(p.who.slice(1))} invited` : ''}`); },
  pljoin: b => { const p = plans[user][+b.dataset.i], on = p.who.includes('You'); p.who = on ? p.who.filter(w => w !== 'You') : [...p.who, 'You']; render(); toast(on ? 'You left the plan' : `You’re going · ${dayName(p.d)} ${clock(p.h)}`); },
  plx: b => { plans[user].splice(+b.dataset.i, 1); render(); toast('Plan cancelled'); },
  fplay: b => { const p = feedAll()[+b.dataset.i];
    pane(`<h2>${p.who} ${p.what}</h2><span class="sub">${gymName(p)}${p.where ? ` · ${p.where}` : ''} · ${p.when}</span>
      <div class="fr-v">${p.vid ? `<video src="video/${p.vid}.mp4" poster="img/${p.still || p.img}.jpg" autoplay muted playsinline controls loop></video>` : `<img src="img/${p.photo || p.img}.jpg" alt="">`}</div>
      ${p.note ? `<p class="fr-n">${p.note}</p>` : ''}`); },
  cm: b => {
    const i = +b.dataset.i, inp = ask.querySelector(`[data-cm="${i}"]`), t = inp.value.trim();
    if (!t) return;
    const p = feedAll()[i]; p.comments.push(['You', t.replace(/</g, '&lt;')]);
    document.querySelector(`.ts[data-i="${i}"] [data-act=fcm] span`).textContent = p.comments.length; feedComments(i);
  },
  // one tap pauses or plays, two tap likes
  fvtap: b => { const post = b.closest('.ts'), v = b.querySelector('video');
    if (tapT) { clearTimeout(tapT); tapT = null; feedLike(post, true); const h = b.querySelector('.ts-big'); h.classList.remove('go'); void h.offsetWidth; h.classList.add('go'); return; }
    tapT = setTimeout(() => { tapT = null; if (v.paused) { delete v.dataset.stop; v.play().catch(() => {}); } else { v.dataset.stop = 1; v.pause(); } }, 240); },
  flike: b => feedLike(b.closest('.ts'), b.getAttribute('aria-pressed') !== 'true'),
  fcm: b => feedComments(+b.dataset.i),
  fshare: () => toast('Link copied'),
  // following turns the + into a tick, which then fades: once you follow someone there's nothing left to press, as on Douyin
  pfollow: b => { const w = b.dataset.w; follows[user].has(w) ? follows[user].delete(w) : follows[user].add(w); render(); toast(follows[user].has(w) ? `Following ${w}` : `Unfollowed ${w}`); },
  pvid: b => { feedAt = +b.dataset.i; go('friends'); },
  pcmp: b => { cTab = 'path'; go(`clip/${b.dataset.i}`); },
  ffollow: b => { const w = b.dataset.w; follows[user].add(w); toast(`Following ${w}`);
    document.querySelectorAll(`[data-act=ffollow][data-w="${w}"]`).forEach(x => { x.classList.add('done'); x.disabled = true; setTimeout(() => x.remove(), 700); }); },
  fsave: b => { const p = feedAt_post(b), k = likeKey(p), on = !saved.has(k); on ? saved.add(k) : saved.delete(k);
    b.setAttribute('aria-pressed', on); b.querySelector('span').textContent = Math.round(p.likes / 3) + (on ? 1 : 0); pop(b, on); if (on) toast('Saved to your profile'); },
  island: () => go('videos'),
  back: () => history.length > 1 ? history.back() : go('videos')
};

document.querySelector('.phone').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  actions[b.dataset.act](b);
});
$('main').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset.cm) $('main').querySelector(`[data-act="cm"][data-i="${e.target.dataset.cm}"]`).click(); });
dock.addEventListener('click', e => {
  const b = e.target.closest('[data-dock]'); if (!b) return;
  const k = b.dataset.dock;
  // "+" is always Add: the same three ways to add a climb, in or out of a session
  if (k === 'plus') { openAdd(); return; }
  go(k);
});
setInterval(() => { if (session === 'live') { secs += 60; if (page === 'videos') render(); else island(); } }, 60000);

scrim.addEventListener('click', closeAll);
ask.addEventListener('input', e => { if (e.target.id === 'gq') filterGyms(e.target.value); });
$('feltOpts').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $('feltOpts').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
});
$('starOpts').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; const k = +b.dataset.n;
  $('starOpts').querySelectorAll('button').forEach(x => { x.setAttribute('aria-checked', +x.dataset.n === k); x.classList.toggle('on', +x.dataset.n <= k); });
});
$('filmOpts').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $('filmOpts').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
});
// a send: the route is topped and its last video marked. True for a climber's first send ever.
function markSent(r) {
  const firstEver = user === 'new' && !list().some(x => x.topped);
  tops++;
  r.topped = true; r.highs[r.highs.length - 1] = r.moves; logOf(r).sent = true;
  { const e = bookOf(TODAY, r); e.sent = true; e.style ||= r.tries <= 1 ? 'Flash' : 'Redpoint'; }
  const c = clips.find(x => x.r === r && x.try === r.tries); if (c) { c.sent = true; c.high = r.moves; }
  if (user === 'regular') hardest.regular = Math.max(hardest.regular, r.g);
  located = false;
  return firstEver;
}
$('saveTop').addEventListener('click', () => {
  const r = lastRoute;
  // how the grade felt and the stars go on the route, for you and for everyone looking at it
  const felt = $('feltOpts').querySelector('[aria-pressed="true"]'), star = $('starOpts').querySelector('[aria-checked="true"]');
  if (felt) r.feel = window.enText ? enText(felt) : felt.textContent;
  if (star) r.stars = +star.dataset.n;
  const pick = $('filmOpts').querySelector('[aria-pressed="true"]'), film = window.enText ? enText(pick) : pick.textContent;
  const sentTo = film === 'No one' ? '' : film === 'Send a link' ? ' · link ready to send' : ` · clip sent to ${film}`;
  // from the camera the send is already marked: save the note and stay ready for the next route
  if (page === 'cam') { closeAll(); render(); toast(`Note saved${sentTo}`); }
  else { const firstEver = markSent(r); render(); openAsk('keep', `${firstEver ? 'Your first send! ' : ''}${r.color} ${r.grade} logged${sentTo}`); }
  $('feltOpts').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false'));
  $('starOpts').querySelectorAll('button').forEach(x => { x.setAttribute('aria-checked', 'false'); x.classList.remove('on'); });
  $('noteIn').value = '';
});

window.addEventListener('hashchange', () => { readHash(); filming = false; cut = 0; camPick = false; if (page !== "cam") camFree = false; clearInterval(cutT); picking = false; picked.clear(); closeAll(); render(); document.querySelector('.screen').scrollTop = 0; });
// frost the status bar once content scrolls under it
const scr = document.querySelector('.screen');
scr.addEventListener('scroll', () => document.querySelector('.phone').classList.toggle('scrolled', scr.scrollTop > 8), { passive: true });
// First open: a new climber starts at set up (?from=tag = opened from a buddy's tag); ?view=regular opens Videos.
if (!location.hash) history.replaceState(null, '', '#/' + (user === 'regular' ? 'videos' : params.get('from') === 'tag' ? 'setup/tag' : 'setup/gym'));
readHash();
render();
// iPhone 16 Pro frame (894 px with its border): on a short window scale the whole phone down to fit, never squash it
const fitPhone = () => document.querySelector('.device').style.setProperty('--fit', Math.min(1, (innerHeight - 96) / 894).toFixed(3));
addEventListener('resize', fitPhone);
fitPhone();

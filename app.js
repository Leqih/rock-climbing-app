// chalk. prototype v2: one screen per step of the user flow (FigJam "Flow chart v2"), one hash route per screen.
// Set up (#/setup/…) → Videos (#/videos), the first tab, as in KEKE → "+" adds a climb: film a try (#/cam), upload a video, scan, log by hand
// → "Sent it?" → compare (#/compare) or log the send → "Keep climbing?" → Walls (#/walls) or end-session summary (#/summary)
// → Profile with your progress (#/profile, a tab) → Friends (#/friends). v6 has no Today page: Videos is where you land.
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
const gyms = [
  { name: 'Crag House', grading: 'tag', dist: '0.8 mi', mi: 0.8, deg: 40, addr: 'Main St', img: 'wall1', routes: 38, set: 'Thursdays', now: 'Quiet', next: 'till 6 PM', crowd: [.3, .25, .2, .2, .3, .35, .4, .35, .4, .55, .75, .95, 1, .8, .5, .3] },
  { name: 'Boulder Barn', grading: circuit, dist: '2.4 mi', mi: 2.4, deg: 160, addr: 'Mill Rd', img: 'wall2', routes: 52, set: 'Mondays', now: 'Quiet', next: 'till 4 PM', crowd: [.2, .15, .15, .2, .25, .3, .35, .4, .6, .8, .9, .85, .7, .5, .3, .2] },
  { name: 'Up Wall', grading: 'tag', dist: '5.1 mi', mi: 5.1, deg: 250, addr: 'Oak Ave', img: 'woman1', routes: 27, set: 'every other Friday', now: 'Busy', next: 'till noon', crowd: [.5, .7, .8, .6, .4, .3, .3, .35, .45, .6, .8, .9, .85, .6, .4, .2] },
  { name: 'Granite Room', grading: circuit, dist: '7.6 mi', mi: 7.6, deg: 320, addr: 'Station St', img: 'man1', routes: 44, set: 'Tuesdays', now: 'Quiet', next: 'till 5 PM', crowd: [.2, .2, .25, .3, .3, .35, .4, .5, .6, .7, .8, .8, .7, .5, .3, .2] },
  { name: 'Stone Mill', grading: 'tag', dist: '12.3 mi', mi: 12.3, deg: 100, addr: 'River Rd', img: 'woman3', routes: 60, set: 'Wednesdays', now: 'Busy', next: 'till 7 PM', crowd: [.4, .5, .6, .6, .5, .5, .5, .6, .7, .8, .9, 1, .9, .7, .5, .3] },
  { name: 'The Cave', grading: circuit, dist: '18.9 mi', mi: 18.9, deg: 200, addr: 'Quarry Ln', img: 'woman2', routes: 31, set: 'Fridays', now: 'Quiet', next: 'till 8 PM', crowd: [.1, .1, .15, .2, .2, .25, .3, .3, .4, .5, .6, .7, .6, .4, .3, .2] }
];
const walls = [{ name: 'Wall A', routes: 11, reset: 10 }, { name: 'Wall B', routes: 9, reset: 3 }, { name: 'Wall C', routes: 10, reset: 18 }, { name: 'Wall D', routes: 8, reset: 24 }];
// people who topped the route, for "beta from climbers your height"
// r.videos = public videos of people topping a route; nearOf(r) = the ones by climbers within 5 cm of your height
const nearOf = r => beta.filter(b => Math.abs(b.h - myH()) <= 5).slice(0, r.videos);
const beta = [{ who: 'Sam', h: 164, img: 'woman1', tries: 3, len: '0:38' }, { who: 'Priya', h: 167, img: 'woman3', tries: 5, len: '0:41' }, { who: 'Dan', h: 170, img: 'man1', tries: 2, len: '0:29' }];
const levels = [{ t: 'Just starting', g: 'V0–V1', hi: 1, s: 'First few times on the wall' },
  { t: 'Topping some', g: 'V1–V2', hi: 2, s: 'You’ve topped a few easy routes' },
  { t: 'Getting there', g: 'V2–V3', hi: 3, s: 'You top V2 most sessions' }];
const setup = { imported: false, level: 1, height: '', span: '' };
// this session's climbs: route -> { tries, sent, hidden }. Public by default.
const today = new Map();
const logOf = r => { if (!today.has(r)) today.set(r, { tries: 0, sent: false, hidden: false }); return today.get(r); };
// gi = the gym you're at. It starts as the nearest one to your location; tap Change gym to pick another
const nearest = () => gyms.reduce((b, g, i) => g.mi < gyms[b].mi ? i : b, 0);
let gi = nearest();
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
const myH = () => +setup.height || 165;
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

/* ---------- Set up: two screens, no account, no long forms ---------- */
// v2: importing clips left set up (Videos finds them in Photos later), and "your sends are public" sits on the level screen
const setupSteps = ['Gym', 'Level'];
const ruler = k => `<div class="ruler" aria-label="Step ${k} of ${setupSteps.length}">${setupSteps.map((s, i) => `<span class="${i < k ? 'on' : ''}"><em></em>${s}</span>`).join('')}</div>`;
const brand = '<div class="bar"><span class="brand">chalk.</span></div>';
// climbing videos already in a new climber's Photos, as Videos sorts them
const sorted = [
  { where: 'Crag House', when: 'Sun, Nov 1', tags: [['Orange', '#F08A24', 4], ['Blue', '#3D7BEA', 2]] },
  { where: 'Crag House', when: 'Sun, Oct 25', tags: [['Green', '#2E9E62', 5], ['Orange', '#F08A24', 1]] },
  { where: 'Boulder Barn', when: 'Mon, Oct 12', tags: [['Green', '#2E9E62', 3]] }
];
const readSize = () => { if ($('hIn')) { setup.height = $('hIn').value; setup.span = $('sIn').value; } };
const setupViews = {
  // opened from a buddy's tag: accept or decline the clip they filmed
  tag: () => ({ photo: 'woman1', html: `
    ${brand}
    <h1 class="hl">Alex filmed you climbing</h1>
    <p class="sub-w">Alex tagged you in 2 clips. Accept and they go into your log. Decline and your name comes off Alex’s post.</p>
    <div class="clip"><img src="img/woman2.jpg" alt=""><span class="shade"></span><span class="play-b">${ic.play}</span>
      <span class="clip-l"><span class="pk-tag"><span class="sw" style="background:#F08A24"></span>Orange V2</span><span>Wall A · Crag House · Saturday · 2 tries</span></span></div>
    <div class="fold"></div>`,
    cta: `<button class="b-ghost" type="button" data-act="tag" data-v="0">Decline</button><button class="b-lime" type="button" data-act="tag" data-v="1">Accept clips</button>` }),

  gym: () => ({ photo: 'wall1', html: `
    ${brand}${ruler(1)}
    <h1 class="hl">Where do you climb?</h1>
    <p class="sub-w">So we know where your climbs are. No account needed.</p>
    <div class="fold"></div>
    <div class="rows">
      ${gyms.map((g, i) => `<button class="row opt" type="button" data-act="sgym" data-i="${i}" aria-pressed="${i === gi}">
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

  // level, size (optional) and the public default on one screen, then straight to Videos
  level: () => ({ photo: 'woman2', html: `
    ${brand}${ruler(2)}
    <h1 class="hl">What do you climb now?</h1>
    <p class="sub-w">Tips are pitched at this. Change it anytime.</p>
    <div class="fold"></div>
    <div class="rows">
      ${levels.map((l, i) => `<button class="row opt" type="button" data-act="lvl" data-i="${i}" aria-pressed="${i === setup.level}">
        <span class="row-t"><strong>${l.t}</strong><span>${l.s}</span></span><b class="rg">${l.g}</b></button>`).join('')}
    </div>
    <div class="hl2 dk2"><h2>Your size</h2><span class="hint2">Optional</span></div>
    <div class="two-in">
      <label class="in"><span class="lbl">Height</span><span class="unit"><input id="hIn" type="number" inputmode="numeric" placeholder="165" value="${setup.height}">cm</span></label>
      <label class="in"><span class="lbl">Arm span</span><span class="unit"><input id="sIn" type="number" inputmode="numeric" placeholder="168" value="${setup.span}">cm</span></label>
    </div>
    <p class="cap">Used to plan your moves on a scanned route and to show you climbers built like you.</p>
    <div class="hl2 dk2"><h2>Your sends are public</h2></div>
    <div class="row post-demo">
      <span class="pav"><img src="img/woman2.jpg" alt=""></span>
      <span class="row-t"><strong>You topped Orange V2</strong><span>Wall A · ${gyms[gi].name} · just now</span></span>
      <button class="vis${demoHidden ? ' off' : ''}" type="button" data-act="demo" aria-pressed="${demoHidden}">${demoHidden ? `${ic.eyeOff}Hidden` : `${ic.eye}Public`}</button>
    </div>
    <p class="cap">Friends see what you top and can comment. Tap the button: any climb can be hidden, anytime.</p>`,
    cta: `<button class="b-lime" type="button" data-act="done">Start</button>` })
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
const radii = [1, 5, 10, 25];
// what you have at a gym: routes you've climbed, filmed or scanned there, your videos there, and the last day you climbed there
const atGym = i => { const v = clips.filter(c => (c.gym ?? gi) === i), r = mine().filter(x => gymAt(x) === i);
  return { routes: r.length, videos: v.length, last: v.length ? Math.max(...v.map(c => c.k)) : null }; };
// one gym: tap it to open it (your routes there); Directions opens it in Maps
function gymCard(g, i) {
  const on = i === gi, a = atGym(i), been = a.routes || a.videos;
  const what = been ? [a.routes && n(a.routes, 'route', 'routes'), a.videos && n(a.videos, 'video', 'videos')].filter(Boolean).join(' · ') : `${g.dist} · ${g.addr}`;
  const when = been ? `${g.dist}${a.last !== null ? ` · last climbed ${dayOf(a.last)}` : ''}` : `${g.now} ${g.next}`;
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
    const pin = L.marker(gymLL(g), { title: `${g.name}, ${g.dist}`, icon: L.divIcon({ className: `gpin${i === gi ? ' on' : ''}${i === gymPin ? ' sel' : ''}`, html: `<i></i><b>${g.name}</b>`, iconSize: null }) }).addTo(gmap);
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
  const near = gymsNear(), all = gyms.map((g, i) => [g, i]).sort((a, b) => a[0].mi - b[0].mi);
  const been = all.filter(([, i]) => { const a = atGym(i); return a.routes || a.videos; });
  const others = near.filter(([, i]) => !been.some(([, j]) => j === i)), far = all.length - near.length;
  const more = far ? `<button class="link dk" type="button" data-act="gyr" data-v="${radii.find(r => r > gymR) || 25}">${n(far, 'gym', 'gyms')} farther than ${gymR} mi · show more</button>` : '';
  return { photo: 'wall1', html: `
    ${tabHead('Gyms')}
    <p class="sub-w">${been.length ? `You’ve climbed at ${n(been.length, 'gym', 'gyms')}` : 'Pick the gym you’re at'} · ${gymCount(near)}</p>
    <div class="fold"></div>
    ${been.length ? `<div class="hl2 dk2"><h2>Where you climb</h2><span class="hint2">your routes and videos</span></div>
    <div class="gy-list">${been.map(([g, i]) => gymCard(g, i)).join('')}</div>` : ''}
    <div class="hl2 dk2 gy-h"><h2>${been.length ? 'More near you' : 'Near you'}</h2>
      <button class="gy-mapb" type="button" data-act="to" data-to="gyms">${ic.pin}Map</button></div>
    <div class="gy-tools">${gymChips()}</div>
    <div class="gy-list">${others.length ? others.map(([g, i]) => gymCard(g, i)).join('') : '<p class="cap">No other gyms in this distance.</p>'}</div>
    ${more}
    <button class="link dk" type="button" data-act="to" data-to="setup/addgym">Can’t find it? Add your gym</button>` };
}

/* ---------- One gym: know what to climb? Pick a tile = yes, Scan = no ---------- */
// only routes you've climbed, filmed or scanned here: no gym route list, no reset dates. Scan is how you find new ones.
function viewGym(a) {
  // one gym's routes only. Scanning or logging here means you're at this gym, so it becomes the gym you're at
  const at = a !== '' && gyms[+a] ? +a : gi, g = gyms[at], l = list(), m = mine().filter(r => gymAt(r) === at), sz = sizes(m.length), lv = user === 'regular' ? { g: 'V2–V3' } : levels[setup.level];
  const tiles = m.map(r => [r, l.indexOf(r)]).map(([r, i], k) => `<div class="lt pt ${sz[k]}">
      <img src="img/${r.img}.jpg" alt=""><span class="shade"></span>
      <button class="pt-open" type="button" data-act="route" data-i="${i}" aria-label="${r.color} ${r.grade}: how to climb it and your tries"></button>
      <span class="pk-tag">${sw(r)}${r.color} ${r.grade}</span>
      <span class="pt-b">${routeNum(r, sz[k].includes('tall'))}</span>
      <button class="pj${r.proj ? ' on' : ''}" type="button" data-act="proj" data-i="${i}" aria-pressed="${!!r.proj}">${r.proj ? 'Trying again' : '+ Try again'}</button>
    </div>`).join('');
  // under the gym's name: how far and how busy now; while you climb here, that instead
  const about = session === 'live' && at === gi ? `<span class="gh-live"><i></i>You’re climbing here</span>` : `${g.dist} away · ${g.now} ${g.next}`;
  const head = `${bar('')}<h1 class="hl">${g.name}</h1><p class="sub-w">${about}</p>`;
  const logTile = `<button class="lt w2 short" type="button" data-act="log" data-g="${at}"><span class="lt-h">Climbed one without a video?</span><span class="sqb">${ic.add}</span>
        <span class="mv"><span class="mv-l">Log it by its tape colour and grade.</span></span></button>`;
  if (!m.length) return { photo: 'wall2', html: `
    ${head}
    <div class="fold"></div>
    ${wallGuide(g, lv.g, user !== 'regular' && !mine().length, at)}
    <div class="lb">${logTile}</div>` };
  return { photo: 'wall2', html: `
    ${head}
    <section class="glass scan-c">
      <span class="t2">${m.length ? 'Found a new route?' : 'Find a route'}</span>
      <span class="sub">Take a photo of it. We read its tape colour and grade, and draw the moves on it for your height.</span>
      <button class="pk-go static" type="button" data-act="scan" data-g="${at}">${ic.scan}Scan a wall</button>
    </section>
    <div class="fold"></div>
    <div class="hl2 dk2"><h2>Your routes here</h2><span class="hint2">${n(m.length, 'route', 'routes')} · your level ${lv.g}</span></div>
    <p class="cap">Tap one to see how climbers your height did it.</p>
    <div class="lb">${tiles}${logTile}</div>` };
}

// a first-timer's question at the wall is "where do I even start?". One real wall answers it by drawing on it: which holds are one route,
// where you start, which grade is yours and where it ends. It goes once you've scanned or climbed a route here.
function wallGuide(g, lv, first, gx) {
  const cc = g.grading === 'tag' ? null : (g.grading.find(c => c[2] === lv) || g.grading[0]);
  const [x0, y0] = sHolds[0], [xt, yt] = sHolds[sHolds.length - 1];
  const at = (x, y) => `left:${(x / 3).toFixed(1)}%;top:${(y / 4).toFixed(1)}%`;
  const svg = `<svg viewBox="0 0 300 400" aria-hidden="true">
      <path d="M${sHolds.map(([x, y]) => `${x} ${y}`).join(' L')}" fill="none" stroke="rgba(221,242,106,.55)" stroke-width="1.5" stroke-dasharray="4 5"/>
      ${sHolds.slice(1, -1).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="none" stroke="#DDF26A" stroke-width="2.5"/>`).join('')}
      <circle cx="${x0}" cy="${y0}" r="14" fill="#DDF26A"/><rect x="${x0 - 9}" y="${y0 + 15}" width="18" height="5" rx="1" fill="#DDF26A"/>
      <circle cx="${xt}" cy="${yt}" r="14" fill="#DDF26A"/>
      ${cc ? g.grading.map(([, hex], k) => `<rect x="${22 + k * 20}" y="${g.grading[k] === cc ? 360 : 364}" width="14" height="${g.grading[k] === cc ? 22 : 14}" rx="2" fill="${hex}" stroke="#FFFFFF" stroke-width="${g.grading[k] === cc ? 2 : 1}"/>`).join('')
        : `<rect x="22" y="362" width="44" height="24" rx="3" fill="#FFFFFF"/><text x="44" y="379" text-anchor="middle" font-size="13" font-weight="700" fill="#111111">${lv.split('–')[0]}</text>`}
    </svg>`;
  return `<section class="wg">
    <h2 class="wg-h">${first ? 'Your first route' : `New to ${g.name}`}</h2>
    <p class="cap">Every route at ${g.name} works like this one.</p>
    <div class="wg-pic">
      <img src="img/wall2.jpg" alt="A wall in the gym with one route marked: its holds, its start, its grade tag and its top">${svg}
      <span class="wg-n r" style="${at(xt + 20, yt)}"><b>Top</b>Touch it with both hands. Then climb down, or drop onto the mat with bent knees.</span>
      <span class="wg-n l" style="right:${(100 - (sHolds[3][0] - 18) / 3).toFixed(1)}%;top:${(sHolds[3][1] / 4).toFixed(1)}%"><b>One colour, one route</b>Use only the holds in its colour.</span>
      <span class="wg-n r" style="${at(x0 + 22, y0)}"><b>Start hold</b>Both hands on the hold with the tape under it.</span>
      ${cc ? `<span class="wg-n l up" style="left:3%;top:${(356 / 4).toFixed(1)}%"><b>Colour is the grade</b><span>${cc[0]} is ${lv}, your level.</span></span>`
        : `<span class="wg-n l up" style="left:3%;top:${(358 / 4).toFixed(1)}%"><b>Grade tag</b>${lv} is your level.</span>`}
    </div>
    <button class="b-lime wg-go" type="button" data-act="scan" data-g="${gx}">${ic.scan}Scan the wall in front of you</button>
    <p class="cap wg-c">We mark the same four things on your route, plus each move for your height.</p>
  </section>`;
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
  const span = +setup.span || myH(), reach = 172, long = span < reach + 4;
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
    <div class="hl2 dk2"><h2>How climbers your height did it</h2><span class="hint2">${myH() - 5}–${myH() + 5} cm</span></div>
    <p class="cap">${n(near.length, 'climber', 'climbers')} your height topped it. Tap to watch.</p>
    <div class="betas">${near.map(b => `<button class="tile photo" type="button" data-act="play" data-who="${b.who}" data-len="${b.len}"><img src="img/${b.img}.jpg" alt=""><span class="shade"></span><span class="ic play">${ic.play}</span><b>${b.h}<small> cm</small></b><span class="sub">${b.who} · topped on try ${b.tries}</span></button>`).join('')}</div>
    <div class="stack">
      ${triesTile}
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
      <div class="lt"><span class="lt-h">One drill for next time</span><p class="tip-d">Hip-turn reaches: 3 sets of 5 on any V0, before your first try.</p></div>
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
    <p class="sub-w">${gyms[gi].name} · Tuesday, Nov 3</p>
    <section class="glass trio"><div><b class="num">${fmt(secs)}</b><span>time</span></div><div><b class="num">${tries}</b><span>${tries === 1 ? 'try' : 'tries'}</span></div><div><b class="num">${tops}</b><span>${tops === 1 ? 'send' : 'sends'}</span></div></section>
    <div class="fold"></div>
    <div class="hl2 dk2"><h2>Hide any climb?</h2></div>
    <p class="cap">Sends post to your profile and friends’ feed, where friends can comment. Hidden climbs and their videos stay private. Tap a climb to watch it.</p>
    ${rows.length ? `<div class="lb">${climbs}${who}</div>`
      : '<div class="row"><span class="row-t"><strong>No tries recorded</strong><span>Next time, tap Film on the route card before each try and they show up here.</span></span></div>'}`,
    cta: `<button class="b-lime" type="button" data-act="post">${any && !posted ? 'Post and see your progress' : 'See your progress'}</button>` };
}

/* ---------- Over time: Profile, with your progress (a tab, and your photo on every tab) ---------- */
// 12 weeks, Mon Aug 17 – Sun Nov 8, 2026. Today is Tue Nov 3 = week 11, day 1.
const TODAY = 11 * 7 + 1;
const dateOf = k => new Date(2026, 7, 17 + k);
function visitDays() {
  const v = new Set();
  if (user === 'regular') for (let w = 0; w < 11; w++) { if (w % 2 === 0) v.add(w * 7 + 3); if (w % 3 !== 2) v.add(w * 7 + 5); if (w % 4 === 1) v.add(w * 7 + 1); }
  else if (setup.imported) [56, 69, 76].forEach(k => v.add(k));
  if (session === 'saved') v.add(TODAY);
  return v;
}
function viewProfile() {
  const reg = user === 'regular', v = visitDays();
  const sends = Object.fromEntries(Object.entries(sendsBy()).map(([g, k]) => ['V' + g, k]));
  const total = Object.values(sends).reduce((a, b) => a + b, 0);
  const grades = ['V0', 'V1', 'V2', 'V3', 'V4'], max = Math.max(1, ...Object.values(sends));
  const top = grades.filter(g => sends[g]).pop();
  const cells = Array.from({ length: 84 }, (_, k) => `<i class="${k > TODAY ? 'f' : v.has(k) ? 'v' : ''}${k === TODAY ? ' t' : ''}" title="${dateOf(k).toDateString()}"></i>`).join('');
  const octo = [...v].filter(k => dateOf(k).getMonth() === 9).length;
  const recap = reg
    ? `<span class="sub">October recap</span><b class="num">9 sends</b><span class="sub">${n(octo, 'session', 'sessions')} · hardest V2, ${n(list().filter(r => r.g === 3).reduce((k, r) => k + r.tries, 0), 'try', 'tries')} at V3 so far</span>`
    : session === 'saved'
      ? `<span class="sub">November so far</span><b class="num">${n(tops, 'send', 'sends')}</b><span class="sub">1 session · ${n(tries, 'try', 'tries')} · ${fmt(secs)} on the wall</span>`
      : `<span class="sub">November so far</span><b class="num">No sessions yet</b><span class="sub">Film or log a climb with Add. It shows up here when you end the session.</span>`;
  // no reset dates: we can't know them. Routes you stop seeing just move down; their videos stay.
  const reset = '';
  const untagged = clips.filter(c => !c.r).length;
  const been = [...new Set(clips.map(c => gymOf(c)).filter(Boolean).map(g => g.name))];
  return { photo: 'woman2', html: `
    ${tabHead('Profile')}
    <div class="me"><span class="av"><img src="img/woman2.jpg" alt=""></span>
      <span class="row-t"><strong>Maria</strong><span>${gyms[gi].name} · ${reg ? `hardest V${hardest.regular}` : `climbs ${levels[setup.level].g}`} · sends public</span></span></div>
    <h1 class="hl">Your progress</h1>
    <section class="glass recap">${recap}</section>
    <div class="fold"></div>
    <div class="lb">
      <div class="lt w2 tall"><span class="lt-h">Days you climbed</span>
        <span class="mv"><b>${v.size}</b><span class="mv-l">${v.size === 1 ? 'session' : 'sessions'} since Aug 17</span></span>
        <span class="hm" aria-label="${v.size} sessions in 12 weeks">${cells}</span></div>
      <div class="lt w2 tall"><span class="lt-h">Sends per grade</span>
        <span class="mv"><b>${total}</b><span class="mv-l">${total ? `sends · hardest ${top}` : 'sends yet · your first one shows here'}</span></span>
        <span class="gb">${grades.map(g => `<span class="gb-r"><span>${g}</span><span class="gb-t"><span class="gb-f${g === top ? ' lime' : ''}" style="width:${((sends[g] || 0) / max * 100).toFixed(0)}%"></span></span><span class="num">${sends[g] || 0}</span></span>`).join('')}</span></div>
    </div>
    <div class="stack">
      ${reset}
      <button class="row" type="button" data-act="export"><span class="row-t"><strong>Export your log</strong><span>CSV with every try, send and video link</span></span>${ic.down}</button>
    </div>
    <div class="hl2 dk2"><h2>You</h2></div>
    <div class="rows">
      <button class="row" type="button" data-act="to" data-to="videos"><span class="row-t"><strong>Your videos</strong><span>${clips.length ? `${n(clips.length, 'video', 'videos')}${untagged ? ` · ${untagged} without a route` : ' · all analysed'}` : 'None yet · film or upload a try'}</span></span>${ic.arr('#111111')}</button>
      <button class="row" type="button" data-act="to" data-to="walls"><span class="row-t"><strong>Gyms</strong><span>${been.length ? `Climbed at ${been.join(', ')}` : 'None yet'} · find gyms near you</span></span>${ic.arr('#111111')}</button>
      <button class="row" type="button" data-act="to" data-to="watch"><span class="row-t"><strong>Watch</strong><span>${watch ? 'Connected · counts tries and session time' : 'Not connected'}</span></span>${ic.arr('#111111')}</button>
      <button class="row" type="button" data-act="size"><span class="row-t"><strong>Level and size</strong><span>${reg ? 'V2–V3' : levels[setup.level].g} · ${myH()} cm · used to show you climbers built like you</span></span></button>
      <div class="row"><span class="row-t"><strong>Who sees your climbs</strong><span>Public by default. Hide any climb from its video or the session summary.</span></span></div>
    </div>
    <section class="ask-c">
      <h3>Plan the next session</h3>
      <p>${reg ? 'Alex and Jo are both free Thursday evening.' : `Beginner night is Wednesday at 7 PM at ${gyms[gi].name}.`}</p>
      <div class="two one"><button class="b-lime" type="button" data-act="to" data-to="friends">${reg ? 'Plan with friends' : 'See group climbs'}</button></div>
    </section>` };
}

/* ---------- Videos: every clip you film, upload or get tagged in, each one analysed ---------- */
// one clip = one try. r = its route (null until you tag the tape colour), high = highest move reached, k = day (0 = Aug 17), by = who filmed it
// len = trimmed to the climb, raw = length before trimming, orig = the original is still in Photos
const clips = [];
let cid = 0, vf = 'all';
// picking = Select mode in Videos; found = climbing videos spotted in Photos since you last looked
let picking = false, found = user === 'regular' ? 3 : 18, foundOff = false;
const picked = new Set();
// real climbing videos, filmed from the floor like a climber's own phone (one from Wikimedia Commons, two from Pexels), with a frame from each as the thumbnail. ar = width / height
const VIDS = [   // eye level, whole body in frame. Every video plays start to end; at is the moment the analysis points to
  { vid: 'rockspot-v3', img: 'vrock', ar: 272 / 480, len: '0:41', t: [0, 40.9], credit: 'Cryptic C62 · CC BY-SA 3.0' },
  { vid: 'pexels-7591864-crop', img: 'v864', ar: 9 / 16, len: '0:25', t: [0, 25.4], credit: 'Pavel Danilyuk · Pexels' },
  { vid: 'pexels-7591810-crop', img: 'v810', ar: 9 / 16, len: '0:14', t: [0, 13.9], credit: 'Pavel Danilyuk · Pexels' }];
const vidOf = c => VIDS.find(v => v.vid === c.vid);
function addClip(r, o) { const c = { id: cid++, gym: gi, r, try: 1, high: 0, sent: false, by: '', hidden: false, raw: '', orig: false, ...o }; clips.unshift(c); return c; }
const dayOf = k => k === TODAY ? 'Today' : dateOf(k).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const shortDay = k => dateOf(k).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const rname = r => r.grade ? `${r.color} ${r.grade}` : r.color;
const clipRoutes = () => [...new Set(clips.map(c => c.r).filter(Boolean))];
const byId = id => clips.find(x => x.id === +id);
// where a video was filmed, from its location; gym -1 = no location in it ("Unknown gym" until you pick one)
const gymOf = c => c.gym === -1 ? null : gyms[c.gym ?? gi];
// the colour and grade being picked on a video's own page
const ctag = { id: null, color: null, grade: null };
if (user === 'regular') {
  const [Y, B, R] = data.regular;
  B.ok = R.ok = true;   // she's confirmed these before; Yellow is the one still waiting
  // her first V3, on a set that has since been reset
  addClip({ color: 'Green', hex: '#2E9E62', grade: 'V3', wall: 'Wall A', moves: 6, highs: [], old: true, tries: 4, ok: true }, { try: 4, high: 6, sent: true, k: 68, len: '0:52', raw: '2:40', img: 'woman2', ...VIDS[0] });
  addClip(Y, { try: 3, high: 3, k: 68, ...VIDS[0] });
  addClip(R, { try: 1, high: 2, k: 73, ...VIDS[2] });
  addClip(B, { try: 3, high: 2, k: 73, by: 'Jo', ...VIDS[1] });
  addClip(null, { k: 73, raw: '1:36', orig: true, ...VIDS[2] });
  addClip(Y, { try: 6, high: 4, k: 75, ...VIDS[0] });
}
// a new climber's first import: every climbing video already in Photos, sorted by gym, date and tape colour (grades unknown: the old sets are gone)
function importClips() {
  if (clips.some(c => c.imp)) return;
  setup.imported = true;
  const seen = {};
  [...sorted].reverse().forEach(s => s.tags.forEach(([color, hex, k]) => {
    // one route per tape colour and gym; tries count on across days, oldest first
    const r = seen[color + s.where] ??= { color, hex, grade: '', wall: s.where, moves: 6, highs: [], old: true, tries: 0 }, day = { 'Sun, Nov 1': 76, 'Sun, Oct 25': 69, 'Mon, Oct 12': 56 }[s.when];
    const gym = gyms.findIndex(g => g.name === s.where);
    for (let t = 1; t <= k; t++) { r.tries++; addClip(r, { try: r.tries, high: Math.min(5, r.tries + 1), sent: t === 5, k: day, len: `0:${28 + t * 4}`, raw: `${1 + t % 3}:${10 + t * 7}`, imp: true, orig: true, gym, ...VIDS[r.tries % VIDS.length] }); }
  }));
  // no tape colour in frame; the last one has no location either
  [0, 1, 2].forEach(i => addClip(null, { k: 69, raw: `1:${20 + i * 9}`, imp: true, orig: true, gym: i === 2 ? -1 : 0, ...VIDS[i % VIDS.length] }));
  found = 0;
}
// keeps looking in Photos after set up: new climbing videos get trimmed, matched to their route and logged as tries
const inPhotos = [{ img: 'woman3', len: '0:38', raw: '2:41' }, { img: 'wall1', len: '0:27', raw: '1:55' }, { img: 'man1', len: '0:46', raw: '3:12' }];
function importFound() {
  inPhotos.forEach((v, i) => {
    const r = list()[i % list().length];
    r.tries++; tried(r);
    addClip(r, { try: r.tries, high: r.highs[r.highs.length - 1], k: 76, raw: v.raw, orig: true, ...VIDS[i % VIDS.length] });
  });
  found = 0; render(); toast(`${inPhotos.length} videos imported · each trimmed to the climb`);
}

// like a KEKE record: one card per route per day, every try on it inside. It opens on the latest try; the others are a tap away there.
const vtile = cs => {
  const c = cs[0], ids = cs.map(x => x.id).join(','), on = cs.every(x => picked.has(x.id)), many = cs.length > 1;
  const top = cs.some(x => x.sent), hi = Math.max(...cs.map(x => x.high)), first = cs[cs.length - 1].try, an = anState(cs);
  return `<button class="vt${c.r ? '' : ' none'}${cs.every(x => x.hidden) ? ' hid' : ''}${on ? ' on' : ''}${many ? ' many' : ''}" type="button" ${picking ? `data-act="vpick" data-i="${ids}" aria-pressed="${on}"` : `data-act="to" data-to="clip/${c.id}"`} aria-label="${c.r ? `${rname(c.r)}, ${many ? `tries ${first} to ${c.try}` : `try ${c.try}`}` : 'Video without a route'}, ${dayOf(c.k)}">
    <img src="img/${c.img}.jpg" alt=""><span class="shade"></span>
    <span class="vt-t">${c.r ? `${sw(c.r)}${c.r.grade || c.r.color}${many ? '' : ` · try ${c.try}`}` : 'No route'}</span>
    ${picking ? '<span class="vt-c"></span>' : ''}
    <span class="vt-b${an === 'ask' ? ' ask' : ''}">${an === 'ask' ? 'Check this' : an === 'run' ? 'Analysing' : top ? 'Topped' : c.r ? `Move ${hi}/${c.r.moves}` : 'Tag it'}</span><span class="vt-l">${cs.every(x => x.hidden) ? ic.eyeOff : ''}${many ? `tries ${first}–${c.try}` : c.len}</span>
  </button>`;
};
// a day's videos, grouped by route (newest try first); videos without a route stay one card each
const byRoute = cs => {
  const g = [];
  cs.forEach(c => { const at = c.r && g.find(x => x[0].r === c.r); at ? at.push(c) : g.push([c]); });
  return g.map(x => x.sort((a, b) => b.try - a.try));
};
function viewVideos() {
  const routes = clipRoutes(), none = clips.filter(c => !c.r), sends = clips.filter(c => c.sent);
  if (vf !== 'all' && (vf === 'none' ? !none.length : !routes.includes(vf))) vf = 'all';
  const shown = clips.filter(c => vf === 'all' || (vf === 'none' ? !c.r : c.r === vf)).sort((a, b) => b.k - a.k);
  const latest = clips.filter(c => c.r).sort((a, b) => b.k - a.k)[0];
  // one card up top: videos being read, new videos found in Photos, start, tag what we couldn't place, or open the newest analysis
  const head = reading
    ? `<section class="glass scan-c rd"><span class="t2">Reading ${n(reading.total, 'video', 'videos')}</span>
        <span class="sub">Trimming each one to the climb and matching it to the route on the same holds. You can keep climbing.</span>
        <span class="rd-b"><i style="width:${reading.done / reading.total * 100}%"></i></span><span class="rd-n num">${reading.done} of ${reading.total}</span></section>`
    : found && !foundOff
    ? `<section class="glass scan-c"><span class="t2">${found} ${user === 'regular' ? 'new ' : ''}climbing videos in Photos</span>
        <span class="sub">${user === 'regular' ? 'Filmed Sun, Nov 1. We read the gym, date and tape colour, match each one to its route and trim it to the climb.'
          : 'Filmed Oct 12 – Nov 1. We sort them by gym, date and tape colour, trim each one to the climb and log it as a try.'}</span>
        <div class="two"><button class="b-glass" type="button" data-act="foundno">Not now</button><button class="b-lime" type="button" data-act="foundyes">Import ${found}</button></div></section>`
    : !clips.length
    ? `<section class="glass scan-c"><span class="t2">No videos yet</span>
        <span class="sub">Film a try at the gym or upload one from your camera roll. Each video shows how high you got and where you stall.</span>
        <div class="two"><button class="b-glass" type="button" data-act="upload">Upload</button><button class="b-lime" type="button" data-act="film">${ic.rec}Film a try</button></div></section>`
    : none.length
      ? `<section class="glass scan-c"><span class="t2">${n(none.length, 'video needs', 'videos need')} a route</span>
        <span class="sub">No tape colour in frame. Tag the colour and grade and we analyse the moves.</span>
        <button class="pk-go static" type="button" data-act="place" data-i="${none[0].id}">${ic.pen}Tag ${none.length > 1 ? 'the first one' : 'it'}</button></section>`
      : `<section class="glass scan-c"><span class="t2">Latest · ${rname(latest.r)}, try ${latest.try}</span>
        <span class="sub">${latest.sent ? 'Topped' : `Highest move ${latest.high} of ${latest.r.moves}`} · ${dayOf(latest.k)}</span>
        <button class="pk-go static" type="button" data-act="to" data-to="clip/${latest.id}">${ic.play}Open the analysis</button></section>`;
  const byF = clips.filter(c => c.by), who = [...new Set(byF.map(c => c.by))];
  const chip = (i, label, on) => `<button type="button" data-act="vf" data-i="${i}" aria-pressed="${on}">${label}</button>`;
  const chips = `<div class="fchips">${chip(-1, `All ${clips.length}`, vf === 'all')}${routes.map((r, i) => chip(i, `${sw(r)}${rname(r)}${r.old ? ` · ${r.wall}` : ''}`, vf === r)).join('')}${none.length ? chip(-2, `No route ${none.length}`, vf === 'none') : ''}</div>`;
  // KEKE's Records: a day, where, and what you got done, then the routes
  // one block per day and gym; videos with no location in them get their own "Unknown gym" block
  const gk = c => c.gym ?? gi;
  const grid = [...new Set(shown.map(c => `${c.k}|${gk(c)}`))].map(key => {
    const day = shown.filter(c => `${c.k}|${gk(c)}` === key), g = gymOf(day[0]), tops = day.filter(c => c.sent).length;
    return `<div class="vd"><b>${dayOf(day[0].k)}</b> · ${g ? g.name : 'Unknown gym'}<span>${n(day.length, 'try', 'tries')}${tops ? ` · ${n(tops, 'top', 'tops')}` : ''}</span></div><div class="vg">${byRoute(day).map(vtile).join('')}</div>`;
  }).join('');
  // the highlight reel: every send as one video, labels added
  const reel = sends.length ? `<button class="lt w2 short pt reel-t" type="button" data-act="reel"><img src="img/${sends[0].img}.jpg" alt=""><span class="shade"></span>
      <span class="lt-h">Highlight reel</span><span class="sqb">${ic.play.replace('#111111', '#FFFFFF')}</span>
      <span class="mv"><b>${n(sends.length, 'send', 'sends')}</b><span class="mv-l">in one video, labelled with grade and gym</span></span></button>` : '';
  const orig = clips.filter(c => c.orig).length;
  const tail = `<div class="stack old">
      ${orig ? `<button class="row" type="button" data-act="origdel"><span class="row-t"><strong>Free up space on your phone</strong><span>${n(orig, 'original', 'originals')} still in Photos · ${(orig * .15).toFixed(1)} GB. chalk. keeps the trimmed copies.</span></span>${ic.arr('#111111')}</button>` : ''}
      ${user === 'regular' ? `<button class="row" type="button" data-act="oldset"><span class="row-t"><strong>Older routes</strong><span>Purple V2 · last climbed Oct 12 · 3 videos kept</span></span>${ic.arr('#111111')}</button>` : ''}
    </div>`;
  const k = picked.size;
  return { photo: 'woman1', html: `
    ${tabHead('Videos')}
    ${session === 'live' ? `<section class="glass live-bar">
      <span class="dot"></span><b class="num">${fmt(secs)}</b>
      <span><button class="lb-gym" type="button" data-act="to" data-to="gym/${gi}">${gyms[gi].name}</button> · <span>${tries ? `${n(tries, 'try', 'tries')} · ${n(tops, 'top', 'tops')}` : watch ? 'Tap your watch before each try' : 'Tap Film before each try'}</span></span>
      <button class="end" type="button" data-act="end">End</button>
    </section>` : ''}
    <p class="sub-w">${clips.length ? `${n(clips.length, 'video', 'videos')} of your tries · ${clips.some(x => x.an === 'ask') ? `${clips.filter(x => x.an === 'ask').length} to check` : 'newest first'}` : 'Your tries on video, each one analysed'}</p>
    ${head}
    <div class="fold"></div>
    ${clips.length ? `<div class="lb">
      <div class="lt short"><span class="lt-h">Analysed</span><span class="mv"><b>${clips.length - none.length}<small>/${clips.length}</small></b><span class="mv-l">highest move and time on each move</span></span></div>
      <div class="lt short"><span class="lt-h">Filmed by friends</span><span class="mv"><b>${byF.length}</b><span class="mv-l">${who.length ? `by ${who.join(' and ')}` : 'Pick who filmed you when you log a send'}</span></span></div>
      ${reel}
    </div>
    <div class="hl2 dk2"><h2>${picking ? (k ? `${k} selected` : 'Tap to select') : 'Your tries'}</h2><button type="button" data-act="vsel">${picking ? 'Done' : 'Select'}</button></div>
    ${chips}${grid}${picking ? '' : tail}` : ''}`,
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
const PATH = [[150, 362], [118, 302], [172, 246], [128, 190], [182, 136], [138, 86], [166, 36]];
function fallView(c, r, hi) {
  const key = fallOf(r), f = FALL[key], next = Math.min(hi + 1, r.moves), split = Math.max(1, hi - 1), span = +setup.span || myH();
  const line = pts => pts.map(p => p.join(',')).join(' ');
  const yours = PATH.slice(0, hi + 1), theirs = PATH.slice(0, r.moves + 1).map((p, i) => i > split ? [p[0] + (i % 2 ? 36 : -30), p[1]] : p);
  const total = Object.values(FALLS).reduce((a, b) => a + b, 0), rows = [['reach', 'Long reaches'], ['slip', 'Foot slips'], ['hold', 'Hold choice']];
  return {
    why: `<div class="hl2 dk2"><h2>Why you came off</h2></div>
    <div class="stack"><div class="lt"><span class="an-c">Example</span><span class="lt-h">${f.title}</span>
      <p class="an-n">Reached move ${hi} of ${r.moves} on this route.</p>
      <ul class="an-ev">${f.ev(hi).map(e => `<li>${e}</li>`).join('')}</ul>
      <p class="an-n">Not read from this video: a reason needs the hold map, which isn’t built yet.</p></div></div>`,
    path: `<div class="stack"><div class="lt"><span class="an-c">Example</span><span class="lt-h">Your path and theirs</span>
      <div class="an-p"><img src="img/wall2.jpg" alt=""><svg viewBox="0 0 300 400" aria-hidden="true">
        <polyline points="${line(theirs)}" fill="none" stroke="#D9B8F5" stroke-width="3" stroke-dasharray="7 6"/>
        <polyline points="${line(yours)}" fill="none" stroke="#DDF26A" stroke-width="4"/>
        ${theirs.slice(split + 1).map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="#D9B8F5"/>`).join('')}
        ${yours.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="#DDF26A" stroke="#111111" stroke-width="2"/>`).join('')}</svg></div>
      <p class="an-k"><span><i class="you"></i>You</span><span><i class="them"></i>Climbers your height who topped it</span></p>
      <p class="an-n">Your paths split after move ${split}.</p></div>
      <div class="lt"><span class="lt-h">Can you reach it?</span>
      <p class="tip-d">At ${myH()} cm with a ${span} cm arm span, move ${next} is in reach from the higher foot.</p>
      <p class="an-n">A reach check for your size, not a full simulation. It can’t tell how hard the move feels.</p></div></div>`,
    across: `<div class="hl2 dk2"><h2>Across your routes</h2></div>
    <div class="stack"><div class="lt"><div class="an-b">${rows.map(([k, l]) => `<div><span>${l}</span><i><em style="width:${FALLS[k] / total * 100}%"></em></i><b>${FALLS[k]}</b></div>`).join('')}</div>
      <p class="an-n">Your last ${total} falls.</p></div></div>`,
    drill: `<div class="stack"><div class="lt"><span class="lt-h">One drill</span><p class="tip-d">${f.drill}</p></div></div>` };
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
  c.track = track;
  if (seed) { c.tags = seed; c.an = 'done'; } else {
    c.auto = track?.first || (lv ? null : SAMPLE_BODY);   // never show made-up points on a real video: ask them to tap instead
    if (!c.r) { c.tags = c.auto; c.an = 'done'; }   // no route to confirm yet
    else if (c.r.ok && c.auto) { c.tags = c.auto; c.an = 'done'; } else c.an = 'ask';
  }
  if (here() || page === 'videos') render();
}
const anState = cs => cs.some(x => x.an === 'ask') ? 'ask' : cs.some(x => (x.r || vidOf(x)) && x.an !== 'done') ? 'run' : 'done';
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
// the track of this video, under it: each hand and foot over time, and every rest. Tap anywhere to go to that moment
function timeline(T) {
  const lane = (l, items) => `<div class="tl-r"><span>${l}</span><div>${items}</div></div>`, at = (t0, t1, cls) => `<i class="${cls}" style="left:${t0 / T.D * 100}%;width:${Math.max(.8, (t1 - t0) / T.D * 100)}%"></i>`;
  const limb = k => T.moves.filter(m => m.k === k).map(m => at(m.t0, m.t, k === 'lw' || k === 'rw' ? 'h' : 'f')).join('');
  return `<section class="glass tl">
    <div class="tl-h"><b id="tl-now">Tap play</b><span class="num" id="tl-time">0:00 / ${mmss(T.D)}</span></div>
    <div class="tl-g">${lane('Left hand', limb('lw'))}${lane('Right hand', limb('rw'))}${lane('Left foot', limb('la'))}${lane('Right foot', limb('ra'))}
      ${lane('Rests', T.rests.map(r => at(r.t0, r.t1, r.straight > .5 ? 'rs' : 'rb')).join(''))}
      <div class="tl-o" id="tlo" role="slider" aria-label="Go to a moment in the video"><i id="tlp"></i></div></div>
    <p class="an-k tl-k"><span><i class="rs"></i>Rest, arms straight</span><span><i class="rb"></i>Rest, arms bent</span></p>
    <p class="tl-tip" id="tl-tip"></p></section>`;
}
function tlWire() {
  const o = $('tlo'), v = $('lvv'); if (!o || !v) return;
  const go = e => { const b = o.getBoundingClientRect(); v.currentTime = Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)) * (v.duration || 0); };
  o.addEventListener('pointerdown', e => { o.setPointerCapture(e.pointerId); go(e); });
  o.addEventListener('pointermove', e => { if (e.buttons) go(e); });
}
// the picture for a conclusion: moments from the video, and the whole climb as a strip
const climbed = T => { const a = T.moves[0]?.t0 ?? 0, b = T.moves[T.moves.length - 1]?.t ?? T.D; return T.S.filter(s => s.p && s.t >= a && s.t <= b); };
const bigArm = s => Math.max(s.el, s.er), footsSeen = s => Math.min(s.p[11][2], s.p[12][2]) > .7;
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
// one plain conclusion from what we measured: what stood out, a picture of it, what to do next, and where to see it
function takeaway(T) {
  const s = T.stats, on = climbed(T), say = (title, why, next, t, see, vis) => ({ title, why, next, t, see, vis });
  const isOff = x => Math.abs(x.off) >= .35, hips = x => isOff(x) ? 'b' : 'g', side = x => x.off < 0 ? 'Out to the left' : 'Out to the right';
  const rested = x => T.rests.some(r => x.t >= r.t0 && x.t < r.t1), moving = x => x.now || T.moves.some(m => x.t >= m.t0 && x.t <= m.t);
  if (s.moves < 3) { const clear = on.length ? mostBy(on, x => x.p.reduce((v, q) => v + q[2], 0)) : null;
    return say('Too little to judge', `We only saw ${n(s.moves, 'hand or foot move', 'hand and foot moves')} in this video.`, 'Film a whole try, from the first hold to where you stop.', s.first ?? clear?.t ?? 0, 'See it in the video', clear && { frames: [{ s: clear, tone: 'good', mark: 'none', title: 'We saw you here', sub: `In ${s.seen}% of this video` }] }); }
  if (s.longest && s.restStraight < 60) { const r = on.filter(rested), lo = -bigArm(mostBy(r, x => -bigArm(x))), bad = mostBy(r, x => -bigArm(x)), good = mostBy(r, bigArm);
    return say('Rest on straighter arms', '', 'At each rest, let one arm go straight and hang from it.', bad.t, 'See this rest', { frames: [{ s: good, tone: 'good', mark: 'arm', title: 'Your straightest rest', sub: 'You’ve done this' }, { s: bad, tone: 'bad', mark: 'arm', title: 'Your most bent rest', sub: `Arms at ${-lo}°` }],
      head: 'Your rests', share: `${s.restStraight}% on straight arms`, bar: band(T, x => !rested(x) ? 'm' : bigArm(x) > 145 ? 'g' : 'b'), keys: swatch('g', 'Straight') + swatch('b', 'Bent') + swatch('m', 'Moving') }); }
  if (s.hipsOver < 60) { const run = stretch(on, isOff) || [s.far.t, s.far.t], bad = mostBy(on.filter(x => x.t >= run[0] && x.t <= run[1]), x => Math.abs(x.off)), sure = on.filter(footsSeen), good = mostBy(sure.length ? sure : on, x => -Math.abs(x.off));
    return say('Keep your hips centred over your feet', '', 'Before you reach, shift your hips back over the middle of your feet.', run[0], 'See this stretch', { frames: [{ s: good, tone: 'good', mark: 'hip', title: 'Hips centred', sub: 'You’ve done this' }, { s: bad, tone: 'bad', mark: 'hip', title: side(bad), sub: 'Clearest here' }],
      head: 'Whole climb', share: `${s.hipsOver}% centred`, bar: band(T, hips), keys: swatch('g', 'Centred') + swatch('b', 'Off to one side') + `<span>Longest off ${mmss(run[0])}–${mmss(run[1])}</span>` }); }
  if (s.feet < s.hands * .6) { const hands = T.moves.filter(m => m.k[1] === 'w'), feet = T.moves.filter(m => m.k[1] === 'a'), led = h => feet.some(f => f.t0 <= h.t0 && h.t0 - f.t0 < 1.2), at = t => mostBy(on, x => -Math.abs(x.t - t));
    const yes = hands.find(led), no = hands.find(h => !led(h)), fr = [];
    if (yes) fr.push({ s: at(yes.t0), tone: 'good', mark: yes.k, title: 'Foot moved first', sub: 'Do this more' });
    if (no) fr.push({ s: at(no.t0), tone: 'bad', mark: no.k, title: 'Hand moved alone', sub: 'Try a foot first' });
    return say('Use your feet more', '', 'Move a foot up before each reach.', no?.t0 ?? s.first, 'See this move', { frames: fr, head: 'Hands and feet', share: `${s.hands} hand, ${s.feet} foot`, bar: ticks(T, 'Hands', ['lw', 'rw']) + ticks(T, 'Feet', ['la', 'ra']) }); }
  if (!s.longest) { const run = stretch(on, x => !moving(x)) || [s.first, s.first], still = mostBy(on, x => -Math.abs(x.t - (run[0] + run[1]) / 2)), secs = (run[1] - run[0]).toFixed(1);
    return say('Take a rest on the way', '', 'Pick one good hold and shake out each arm.', run[0], 'See this pause', { frames: [{ s: still, tone: 'good', mark: 'none', title: 'Your longest pause', sub: `${secs} s` }],
      head: 'Moving and pausing', share: `Longest pause ${secs} s`, bar: band(T, x => moving(x) ? 'm' : 'g'), keys: swatch('g', 'Pause') + swatch('m', 'Moving') }); }
  const rest = on.filter(x => x.t >= s.longest.t && x.t < s.longest.t + s.longest.s), calm = rest.filter(x => !isOff(x)), best = (calm.length || rest.length) ? mostBy(calm.length ? calm : rest, bigArm) : on[0], far = mostBy(on, x => Math.abs(x.off));
  return say('Good control', `Arms straight in ${s.restStraight}% of your rests, and hips over your feet for ${s.hipsOver}% of the climb.`, 'Keep this up on the next route.', s.longest.t, 'See your best rest', { frames: [{ s: best, tone: 'good', mark: 'arm', title: 'Your best rest', sub: `${s.longest.s.toFixed(1)} s` }, { s: far, tone: isOff(far) ? 'bad' : 'good', mark: 'hip', title: side(far), sub: isOff(far) ? 'Worth a look' : 'Still centred' }],
    head: 'Whole climb', share: `${s.hipsOver}% centred`, bar: band(T, hips), keys: swatch('g', 'Centred') + swatch('b', 'Off to one side') });
}
const seeBlock = v => `${v.frames.length ? `<div class="kf-g n${v.frames.length}">${v.frames.map((f, i) => `<button class="kf" type="button" data-act="seekt" data-t="${f.s.t}"><span class="kf-i"><img alt="" data-kf="${i}"></span><b><span class="num">${mmss(f.s.t)}</span> <span>${f.title}</span></b><em>${f.sub}</em></button>`).join('')}</div>` : ''}
    ${v.bar ? `<div class="vz"><div class="vz-h"><b>${v.head}</b><span>${v.share}</span></div>${v.bar}<div class="vz-a num"><span>0:00</span><span>${mmss(v.T)}</span></div>${v.keys ? `<div class="vz-l">${v.keys}</div>` : ''}</div>` : ''}`;
// the frames come out of the video itself, one at a time, once the card is on the page
function kfWire(T, src) {
  const v = takeaway(T).vis; if (!v) return;
  document.querySelectorAll('img[data-kf]').forEach(im => { const f = v.frames[+im.dataset.kf]; window.poseStill(src, T, f.s, f.mark, f.tone).then(u => { if (u) im.src = u; }); });
}
// what we measured, each one with the moment it comes from
function measured(T) {
  const s = T.stats, row = (big, small, t) => `<button class="row" type="button" data-act="seekt" data-t="${t}"><span class="row-t"><strong>${big}</strong><span>${small}</span></span><span class="tl-go num">${mmss(t)} ›</span></button>`;
  const m = takeaway(T);
  if (m.vis) m.vis.T = T.D;
  return `<div class="hl2 dk2"><h2>The main thing</h2></div>
    <div class="stack"><div class="lt"><span class="lt-h">${m.title}</span>${m.why ? `<p class="tip-d">${m.why}</p>` : ''}${m.vis ? seeBlock(m.vis) : ''}<p class="an-nx"><b>Next try</b>${m.next}</p>
      <button class="b-ghost an-see" type="button" data-act="seekt" data-t="${m.t}">${m.see} · ${mmss(m.t)}</button></div></div>
    <div class="hl2 dk2"><h2>What we measured</h2></div>
    <div class="rows">${row(n(s.moves, 'hand or foot move', 'hand and foot moves'), `${s.hands} with a hand, ${s.feet} with a foot. Only the ones we’re sure of`, s.first)}
      ${s.longest ? row(`${s.longest.s.toFixed(1)} s`, 'Your longest rest', s.longest.t) : ''}
      ${s.longest && s.low ? row(`${s.low.a < 90 ? 'Very bent' : s.low.a < 145 ? 'Bent' : 'Straight'} · ${s.low.a}°`, 'Your arms at their most bent, resting. 180° is straight', s.low.t) : ''}
      ${s.far ? row(s.far.left ? 'Out to the left' : 'Out to the right', 'Your hips, furthest from your feet', s.far.t) : ''}</div>
    <p class="trs-l">We could see you in ${s.seen}% of this video. Tap a row to watch that moment.</p>`;
}
const bodyStats = T => `<div class="hl2 dk2"><h2>Your whole climb</h2></div><div class="stack"><div class="lt"><div class="an-g"><div><span>Arms straight</span><b>${T.stats.armsStraight}%</b></div><div><span>Hips over feet</span><b>${T.stats.hipsOver}%</b></div><div><span>Moving</span><b>${T.stats.moving}%</b></div></div>
      <p class="an-n">Share of the time from your first move to your last, in this video.</p></div></div>`;
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
function confirmed(c, tags, again) { c.tags = tags; c.auto = tags; c.r.ok = true; c.an = 'done'; clips.filter(x => x.r === c.r && x.an === 'ask' && x.auto).forEach(x => { x.tags = x.auto; x.an = 'done'; }); tagS = { id: null, i: 0, pts: {} }; cTab = 'why'; if (again) analyse(c, tags); render(); document.querySelector('.screen').scrollTo(0, 0); }
function viewClip(id) {
  const c = byId(id);
  if (!c) return viewVideos();
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
      <img src="img/${x.img}.jpg" alt=""><span class="shade"></span><b>Try ${x.try}</b><small>${x.sent ? 'Topped' : `Move ${x.high}`} · ${shortDay(x.k)}</small></button>`).join('')}
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
      <div class="row"><span class="row-t"><strong>${sw(r)}${rname(r)}${c.imp ? '' : ` · ${r.wall}`}</strong><span>Route · ${c.imp || c.orig ? 'read from the tape colour in frame' : 'the route you were on'}</span></span>
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
      ${c.sent ? `<button class="row" type="button" data-act="share" data-i="${c.id}"><span class="row-t"><strong>Share this send</strong><span>A poster with the grade, tape colour and gym on it</span></span>${ic.arr('#111111')}</button>` : ''}
      <div class="row"><span class="row-t"><strong>${c.hidden ? 'Only you' : 'Public'}</strong><span>${c.hidden ? 'Hidden from your profile and friends’ feed' : 'On your profile · friends can comment'}</span></span>
        <button class="vis${c.hidden ? ' off' : ''}" type="button" data-act="vhide" data-i="${c.id}" aria-pressed="${c.hidden}">${c.hidden ? `${ic.eyeOff}Hidden` : `${ic.eye}Public`}</button></div>
      <button class="row" type="button" data-act="vdel" data-i="${c.id}"><span class="row-t"><strong>Delete video</strong><span>The try stays in your log</span></span></button>
    </div>
    ${r ? `<div class="rows tg-r"><div class="row"><span class="row-t"><strong>Tracking</strong><span>You and this route, confirmed</span></span><button class="pj" type="button" data-act="retag" data-i="${c.id}">Fix it</button></div></div>` : ''}
    ${lv?.credit ? `<div class="rows tg-r"><div class="row"><span class="row-t"><strong>Sample video</strong><span>${lv.credit}</span></span></div></div>` : ''}`;
  const state = !r ? (c.track ? 'done' : lv && c.an !== 'done' ? 'run' : 'none') : c.an === 'done' ? 'done' : c.an === 'ask' ? 'ask' : 'run';
  const pct = Math.round((c.pct || 0) * 100);
  const runCard = `<div class="stack"><div class="lt"><span class="lt-h">Analysing your climb <span class="num" id="anp">${pct}%</span></span>
      <p class="an-n">Going through the whole video, following your hands, feet, elbows and hips. You can leave this page.</p><i class="an-run"><em id="anb" style="width:${pct}%"></em></i></div></div>`;
  const two = state === 'done' && c.track && lv;
  const room = (document.querySelector('.screen')?.clientHeight || 874) - (two ? 366 : state === 'ask' ? 348 : state === 'run' ? 280 : 0);
  const vh = !room || state === 'none' ? 560 : Math.max(two ? 300 : 280, Math.min(two ? 430 : 560, room));
  const side = two ? `<div class="lv-s"><div><span>Hand &amp; foot moves</span><b id="tl-moves">—</b></div><div><span>Arms</span><b id="tl-arms">—</b></div><div><span>Hips</span><b id="tl-hips">—</b></div></div>` : '';
  const askCard = `<div class="stack"><div class="lt tgc"><span class="lt-h" id="tgt"></span><p class="an-n" id="tgx"></p>
      <div class="tg-s" id="tgs" hidden></div>
      <div class="tg-a"><button class="b-ghost" type="button" id="tgu" data-i="${c.id}"></button><button class="b-lime" type="button" id="tgb" data-i="${c.id}"></button></div>
      <button class="tg-c" type="button" id="tgc" data-act="place" data-i="${c.id}">Wrong route? Change it</button></div></div>`;
  const tabs = [['why', 'Summary'], ...(c.track ? [['body', 'Body']] : []), ...(fv ? [['path', 'Path']] : []), ...(r ? [['tries', 'Tries']] : []), ['info', r ? 'Info' : 'Add route']];
  const tab = tabs.some(([k]) => k === cTab) ? cTab : 'why';
  const panels = { why: c.track ? `${measured(c.track)}${r ? '' : `<div class="rows"><button class="row" type="button" data-act="ctab" data-v="info"><span class="row-t"><strong>Which route is this?</strong><span>Add it to see this try next to your others</span></span>${ic.arr('#111111')}</button></div>`}${fv ? fv.why + fv.drill : ''}` : `${fv ? fv.why : ''}${seen}${fv ? fv.drill : ''}`, body: c.track ? bodyStats(c.track) : '', path: fv ? fv.path : '', tries: `${triesStrip}${fv ? fv.across : ''}`, info: `${details}${thisVideo}` };
  return { photo: c.img, after: () => {
      tagWire(c);
      if (!lv) return;
      const v = $('lvv'), box = v.parentElement;
      v.playbackRate = speed;
      if (two) { window.posePlay(v, $('lvc'), c.track); tlWire(); kfWire(c.track, v.currentSrc || v.src); }
      if (state === 'ask' && c.auto) v.currentTime = c.auto.t;
      if (lv.t) { // only the climb
        const [t0, t1] = lv.t, home = () => { if (v.currentTime < t0 - .1 || v.currentTime >= t1) v.currentTime = t0; };
        if (v.readyState >= 1) home(); else v.addEventListener('loadedmetadata', home, { once: true });
        v.addEventListener('play', home);
        v.addEventListener('timeupdate', () => { if (v.currentTime >= t1 && !v.paused) { v.pause(); v.dispatchEvent(new Event('clipend')); } });
      }
      v.addEventListener('play', () => box.classList.add('playing'));
      ['pause', 'ended'].forEach(e => v.addEventListener(e, () => box.classList.remove('playing')));
      v.addEventListener('click', () => v.paused ? v.play() : v.pause());
    }, html: `
    ${bar(r ? `${rname(r)} · try ${c.try}` : 'Not tagged yet')}
    <div class="lv-w${two ? ' two' : ''}"><div class="clip vp${lv ? ' lv' : ''}${state === 'run' ? ' busy' : ''}"${lv ? ` style="aspect-ratio:${lv.ar.toFixed(4)};width:min(100%, ${Math.round(vh * lv.ar)}px)"` : ''}>
      ${lv ? `<video id="lvv" data-t0="${lv.t?.[0] ?? 0}" src="video/${lv.vid}.mp4" poster="img/${lv.img}0.jpg" muted playsinline preload="auto"></video><canvas id="lvc"></canvas>`
        : `<img src="img/${c.img}.jpg" alt=""><span class="shade"></span>`}
      <button class="play-b" type="button" data-act="${lv ? 'lvplay' : 'vplay'}" data-len="${c.len}" aria-label="Play the video">${ic.play}</button>
      <div class="tg" id="tg" hidden></div>
      <span class="clip-l">${r ? `<span class="pk-tag">${sw(r)}${rname(r)} · try ${c.try}</span>` : '<span class="pk-tag">No route yet</span>'}
        <span>${dayOf(c.k)} · ${r && !c.imp ? r.wall : g ? g.name : 'Unknown gym'} · ${c.len}${c.raw ? `, trimmed from ${c.raw}` : ''}${c.by ? ` · filmed by ${c.by}` : ''}</span></span></div>${side}</div>
    ${two ? timeline(c.track) : ''}
    ${state === 'done' && !c.track ? `<section class="glass scrub"><div class="mv-t" aria-label="Moves; you reached move ${hi}">${ticks}</div>
      <p class="scrub-l">${c.sent ? `Topped · all ${mv} moves` : `You reached move ${hi} of ${mv}`}</p></section>` : ''}
    ${lv && (state === 'done' || state === 'none') ? `<div class="sp"><span>Speed</span><div class="sp-b">${[.25, .5, 1].map(s => `<button type="button" data-act="spd" data-v="${s}" aria-pressed="${s === speed}">${s}×</button>`).join('')}</div></div>` : ''}
    <div class="fold"></div>
    ${state === 'none' ? `${details}${thisVideo}` : state === 'run' ? runCard : state === 'ask' ? askCard : `
      <div class="fchips ctabs">${tabs.map(([k, l]) => `<button type="button" data-act="ctab" data-v="${k}" aria-pressed="${k === tab}">${l}</button>`).join('')}</div>
      ${tabs.map(([k]) => `<div class="pn" data-pn="${k}"${k === tab ? '' : ' hidden'}>${panels[k]}</div>`).join('')}`}` };
}

// share one send as a poster, or every send as a highlight reel; labels come from the analysis
const shareBtns = `<div class="two"><button class="b-ghost" type="button" data-act="shsave">Save to Photos</button><button class="b-lime" type="button" data-act="shsend">${user === 'regular' ? 'Send to Alex and Jo' : 'Copy link'}</button></div>`;
const where = c => `${c.r.wall}${c.r.old ? '' : ` · ${gyms[gi].name}`}`;
function openShare(c) {
  pane(`<h2>Share your send</h2><span class="sub">Grade, tape colour and gym added from the video</span>
    <div class="poster"><img src="img/${c.img}.jpg" alt=""><span class="shade"></span><span class="po-brand">chalk.</span>
      <span class="po-b"><span class="pk-tag">${sw(c.r)}${rname(c.r)}</span><b>Topped</b><span>on try ${c.try} · ${where(c)} · ${shortDay(c.k)}</span></span></div>
    ${shareBtns}`);
}
function openReel() {
  const s = clips.filter(c => c.sent);
  pane(`<h2>Your highlight reel</h2><span class="sub">${n(s.length, 'send', 'sends')} · ${s.length * 8} seconds · labels added for you</span>
    <div class="reel">${s.map(c => `<span class="rl"><img src="img/${c.img}.jpg" alt=""><span class="pk-tag">${sw(c.r)}${rname(c.r)}</span><em>${where(c)} · ${shortDay(c.k)}</em></span>`).join('')}</div>
    <p class="hint">Each send plays for 8 seconds, from its last move to the top.</p>
    ${shareBtns}`);
}

/* ---------- Over time: Friends (feed, comments, group climbs, partner calendar) ---------- */
const feeds = {
  regular: [
    { who: 'Jo', img: 'woman1', what: 'topped Blue V3', where: 'Wall C', when: '2 h ago', photo: 'wall2', note: 'Third try. Heel hook on move 3 did it.', comments: [['Alex', 'That heel hook!']] },
    { who: 'Alex', img: 'man1', what: 'topped Red V4', where: 'Wall A', when: 'Yesterday', photo: 'wall1', note: '', comments: [] }
  ],
  new: [
    { who: 'Priya', img: 'woman3', what: 'topped Orange V2', where: 'Wall A', when: '1 h ago', photo: 'wall1', note: 'Big holds all the way. Good first one if you’re new.', comments: [['Dan', 'Agreed, start here.']] }
  ]
};
// Alex and Jo: free days this week, 0 = today (Tue)
const free = { Alex: [2, 4], Jo: [2, 5] };
function viewFriends() {
  const reg = user === 'regular', feed = feeds[user];
  const mine = posted ? [...today.entries()].filter(([, e]) => e.sent && !e.hidden).map(([r]) => ({ who: 'You', img: 'woman2', what: `topped ${r.color} ${r.grade}`, where: r.wall, when: 'Just now', photo: r.img, note: '', comments: r.cm || (r.cm = []) })) : [];
  const all = [...mine, ...feed];
  const days = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'];
  const head = reg && tagPending
    ? `<section class="glass tagc"><span class="avs2"><img src="img/man1.jpg" alt="Alex"></span><span class="t2">Alex filmed 2 of your tries</span>
        <span class="sub">Yellow V3 · Wall B · Saturday. Accept and the clips land in your log.</span>
        <div class="two"><button class="b-glass" type="button" data-act="ftag" data-v="0">Decline</button><button class="b-lime" type="button" data-act="ftag" data-v="1">Accept</button></div></section>`
    : reg ? `<p class="sub-w">Alex and Jo · climbs you post show up here for them</p>`
      : `<section class="glass tagc"><span class="t2">Invite the people you climb with</span><span class="sub">You’ll see each other’s climbs and when you’re free.</span>
        <div class="two one"><button class="b-lime" type="button" data-act="invite">Copy invite link</button></div></section>`;
  const group = reg
    ? { t: 'Thursday · 6 PM', s: `${gyms[gi].name} · Alex and Jo are going`, k: joined ? 3 : 2, av: ['man1', 'woman1'] }
    : { t: 'Beginner night · Wed 7 PM', s: `${gyms[gi].name} · open to everyone, a coach shows the basics`, k: joined ? 10 : 9, av: ['woman3', 'man1'] };
  const cal = reg ? `<div class="lt w2"><span class="cal-h"><span class="lt-h">Who’s free</span><span class="hint2">Thursday works for both</span></span>
      <span class="week">${days.map((d, i) => `<span class="wd${i === 0 ? ' today' : ''}"><span>${d}</span><b class="num">${3 + i > 30 ? 3 + i - 30 : 3 + i}</b>
        <span class="wav">${Object.entries(free).filter(([, f]) => f.includes(i)).map(([w]) => `<img src="img/${w === 'Alex' ? 'man1' : 'woman1'}.jpg" alt="${w}">`).join('')}</span></span>`).join('')}</span></div>` : '';
  // what each friend climbed this week (placeholder numbers)
  const week = reg ? [['Jo', 'woman1', 3, 'V3'], ['Alex', 'man1', 2, 'V4']].map(([w, img, k, g]) => `<div class="lt short"><span class="lt-h">${w}</span>
      <span class="avs"><img src="img/${img}.jpg" alt=""></span>
      <span class="mv"><b>${n(k, 'send', 'sends')}</b><span class="mv-l">this week · hardest ${g}</span></span></div>`).join('') : '';
  return { photo: 'man1', html: `
    ${tabHead('Friends')}
    ${head}
    <div class="fold"></div>
    <div class="hl2 dk2"><h2>Plan the next session</h2></div>
    <div class="lb">
      <div class="lt w2 tall pt gc"><img src="img/wall1.jpg" alt=""><span class="shade"></span>
        <span class="lt-h">${group.t}</span>
        <span class="avs">${group.av.map(a => `<img src="img/${a}.jpg" alt="">`).join('')}</span>
        <span class="mv"><b>${group.k} going</b><span class="mv-l">${group.s}</span></span>
        <button class="b-lime sm" type="button" data-act="join">${joined ? 'You’re going · undo' : 'Join'}</button></div>
      ${cal}${week}
    </div>
    <div class="hl2 dk2"><h2>${reg ? 'Feed' : `At ${gyms[gi].name}`}</h2>${reg ? '' : '<span class="hint2">public climbs</span>'}</div>
    <div class="stack">${all.map((p, i) => `<article class="post">
        <div class="ph"><img src="img/${p.photo}.jpg" alt=""><span class="shade"></span>
          <div class="post-h"><span class="pav"><img src="img/${p.img}.jpg" alt=""></span><span class="row-t"><strong>${p.who} ${p.what}</strong><span>${p.where} · ${p.when}</span></span></div></div>
        <div class="post-b">
        ${p.note ? `<p class="post-n">${p.note}</p>` : ''}
        ${p.comments.map(([w, t]) => `<p class="cm"><b>${w}</b> ${t}</p>`).join('')}
        <div class="cm-row"><input type="text" placeholder="Add a comment" aria-label="Comment on ${p.who}’s climb" data-cm="${i}"><button type="button" data-act="cm" data-i="${i}">Send</button></div></div>
      </article>`).join('')}</div>` };
}

/* ---------- Film your tries: the phone camera, full screen; the watch can mark each try ---------- */
// One recording for as many tries as you like (as in KEKE): each try is cut out from when you leave the ground to when you land.
// Stopping files every try to the route, then asks "Sent it?" about the last one. cut = tries cut so far in this recording.
// camFree = you said it's none of your routes: the tries are saved without a route and tagged later in Videos
// camReading = opened from "+" with no route picked: the tag says so until the tape in frame is read
// camDone = what the last recording saved, shown in the camera so the next try is one tap away
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
        ? `<button class="b-glass" type="button" data-act="sentnote">Add a note</button><button class="b-lime" type="button" data-act="camdone">Done</button>`
        : `<button class="b-glass" type="button" data-act="camsee">What to change</button><button class="b-lime" type="button" data-act="sent">${ic.check}I topped it</button>`}</div>
    </div>`;
}
function viewCam() {
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
      ${filming ? `<span class="rec-on"><i></i>REC ${Math.floor((cut * 150 + 40) / 60)}:${String((cut * 150 + 40) % 60).padStart(2, '0')}</span>` : ''}
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
const face = (top, mid, ui) => `<span class="wf"><span class="wf-s"><span class="wf-t">${top}</span><b>${mid}</b>${ui}</span></span>`;
function viewWatch() {
  const r = current() || list()[0], k = r.tries + 1;
  const faces = [
    [`${r.color} ${r.grade}`, `Try ${k}`, '<span class="wf-b">Tap</span>', 'Tap as you start. The phone starts filming.'],
    [`Try ${k}`, 'Sent it?', '<span class="wf-2"><i>✓</i><i>✕</i></span>', 'Tap when you’re down, then answer.'],
    ['Rest', '1:42', '<span class="wf-ring"></span>', 'Buzzes when it’s time to go again.']
  ];
  return { photo: 'woman3', html: `
    ${bar('Watch')}
    <h1 class="hl">Climb with your watch</h1>
    <p class="sub-w">Chalky hands, phone on the floor: log each try from your wrist while the phone films.</p>
    <section class="glass scan-c">
      <span class="t2">${watch ? 'Maria’s Apple Watch' : 'Apple Watch or Wear OS'}</span>
      <span class="sub">${watch ? 'Connected · counts tries and session time' : 'Not connected yet'}</span>
      ${watch ? '<button class="b-glass" type="button" data-act="watch">Disconnect</button>' : `<button class="pk-go static" type="button" data-act="watch">${ic.watch('#111111')}Connect a watch</button>`}
    </section>
    <div class="fold"></div>
    <div class="hl2 dk2"><h2>On your wrist</h2></div>
    <div class="lb">
      <div class="lt w2 tall faces">${faces.map(([t, m, u, c]) => `<span class="wfc">${face(t, m, u)}<span class="cap">${c}</span></span>`).join('')}</div>
      <div class="lt short"><span class="lt-h">No signal?</span><span class="mv"><span class="mv-l">Tries save on the watch and sync when your phone is back.</span></span></div>
      <div class="lt short"><span class="lt-h">Session time</span><span class="mv"><span class="mv-l">From your first tap to End, rest included.</span></span></div>
    </div>` };
}

/* ---------- shell: routing, render, sheets ---------- */
const views = { gyms: viewGyms, walls: viewGymsTab, gym: viewGym, scan: viewScan, route: viewRoute, compare: viewCompare, summary: viewSummary, profile: viewProfile, videos: viewVideos, clip: viewClip, friends: viewFriends, cam: viewCam, watch: viewWatch };
const tabOf = { compare: 'videos', cam: 'videos', watch: 'profile', walls: 'walls', gym: 'walls', gyms: 'walls', scan: 'walls', route: 'walls', videos: 'videos', clip: 'videos', friends: 'friends', profile: 'profile' };
const dock = document.querySelector('.dock');
function readHash() { const [p = '', a = ''] = location.hash.replace(/^#\/?/, '').split('/'); page = p === 'setup' || views[p] ? p : 'videos'; arg = a; }
function go(p) { if (location.hash === '#/' + p) render(); else location.hash = '#/' + p; }

// the dock belongs to the four tabs only; every page you open from a tab (route, clip, compare, gyms, set-up…) has a back button instead
const tabs = ['videos', 'walls', 'friends', 'profile'];
function render() {
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
  dock.hidden = !!v.cta || !!v.bare || !tabs.includes(page);
  dock.querySelectorAll('.dk:not(.plus)').forEach(b => b.toggleAttribute('aria-current', b.dataset.dock === tabOf[page]));
  dock.querySelector('[aria-current]')?.setAttribute('aria-current', 'page');
  $('plus').innerHTML = `${ic.plus}<span>Add</span>`;
  island();
  $('videosPip').style.display = found && !foundOff ? '' : 'none';
  $('friendsPip').style.display = user === 'regular' && tagPending ? '' : 'none';
  if (gmap && !v.after) { gmap.remove(); gmap = null; }
  v.after?.();
  clips.forEach(c => { if ((c.r || vidOf(c)) && !c.an) analyse(c); });   // every video is analysed as soon as it's here, whichever page you're on, with or without a route
}

// the Dynamic Island shows a live session on every page, like a Live Activity; tap it for the session in Videos
function island() {
  const el = document.querySelector('.island'), live = session === 'live';
  el.classList.toggle('live', live);
  el.innerHTML = live ? `<i></i><b class="num">${fmt(secs)}</b>` : '';
  live ? el.setAttribute('data-act', 'island') : el.removeAttribute('data-act');
  el.setAttribute('aria-label', live ? `Climbing at ${gyms[gi].name}, ${fmt(secs)}. Open the session` : '');
}

const toastEl = $('toast');
let tt;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('show'), 2200); }

const sheet = $('sheet'), ask = $('ask'), scrim = $('scrim');
function closeAll() { [sheet, ask, scrim].forEach(x => x.classList.remove('show')); }
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
// and anything wrong is fixed later. Videos already in Photos come first: one tap adds them.
function openAdd() {
  const fresh = found && !foundOff;
  pane(`<h2>Add a climb</h2><span class="sub">${gyms[gi].name} · ${session === 'live' ? `climbing for ${fmt(secs)}` : 'today'}</span>
    ${fresh ? `<button class="add-f" type="button" data-act="addfound"><span class="row-t"><strong>${found} climbing videos found in Photos</strong><span>Sorted, trimmed and matched to their routes</span></span><span class="add-n">Add</span></button>` : ''}
    <div class="add-g">
      <button class="main" type="button" data-act="film">${ic.rec}<b>Film</b><span>${watch ? 'Your watch marks each try' : 'We cut out each try'}</span></button>
      <button type="button" data-act="upload">${ic.up}<b>Upload</b><span>Videos from Photos</span></button>
      <button type="button" data-act="scan">${ic.scan}<b>Scan a wall</b><span>Its moves, for your height</span></button>
      <button type="button" data-act="log">${ic.pen}<b>Log by hand</b><span>No video needed</span></button>
    </div>`);
}
// videos found in Photos: Maria gets the 3 new ones, a new climber everything already there
// read in the background like an upload, so you're never stuck waiting on a sheet
function takeFound() {
  const k = found;
  found = 0;
  readIn(k, () => { if (user === 'regular') importFound(); else { importClips(); toast('18 videos sorted · 3 need a route'); } });
}

// Log by hand: gym, tape colour, grade, how it went. Matches the gym's list when the route is on it.
const tapes = [['Yellow', '#F2C230'], ['Blue', '#3D7BEA'], ['Red', '#E5484D'], ['Green', '#2E9E62'], ['Orange', '#F08A24'], ['Purple', '#8E5BD8'], ['Black', '#1B1B1B'], ['White', '#F4F4F0']];
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
  r.tries += d.k; e.tries += d.k; tries += d.k; secs += 240 * d.k;
  if (!r.mine) for (let i = 0; i < d.k; i++) tried(r);
  if (d.sent) {
    tops++; e.sent = true;
    if (!r.mine) { r.topped = true; r.highs[r.highs.length - 1] = r.moves; }
    if (user === 'regular') hardest.regular = Math.max(hardest.regular, r.g);
  }
  lastRoute = r; render();
  openAsk('keep', `${r.color} ${r.grade} logged at ${gyms[gi].name}`);
}

// Upload a video from the camera roll (prototype thumbnails); the app reads gym, date and tape colour, you confirm.
// len = trimmed to the climb (start to top), raw = the original in Photos
const roll = [{ img: 'woman1', len: '0:42', raw: '2:18', when: 'Today, 6:12 PM', k: 78 }, { img: 'man1', len: '0:35', raw: '1:47', when: 'Today, 5:58 PM', k: 78 }, { img: 'woman3', len: '1:04', raw: '3:30', when: 'Sun, Nov 1', k: 76 },
  { img: 'wall1', len: '0:21', raw: '1:12', when: 'Sun, Nov 1', k: 76, nocol: true }, { img: 'woman2', len: '0:48', raw: '2:55', when: 'Sun, Oct 25', k: 69, noloc: true }, { img: 'wall2', len: '0:16', raw: '0:58', when: 'Mon, Oct 12', k: 56 }];
// like KEKE: pick, and you're back in Videos at once. Each video is read in the background; anything we got wrong is fixed on the video itself.
const upSel = new Set();
let hideAdded = true;
function openUpload() { upSel.clear(); drawRoll(); }
function drawRoll() {
  const k = upSel.size, order = [...upSel], added = roll.filter(v => v.added).length;
  const shown = roll.map((v, i) => [v, i]).filter(([v]) => !(hideAdded && v.added));
  pane(`<h2>Upload videos</h2><span class="sub">Camera roll · climbing videos first · pick one or many</span>
    ${added ? `<button class="link" type="button" data-act="uphide">${hideAdded ? `Show ${n(added, 'video', 'videos')} already added` : 'Hide videos already added'}</button>` : ''}
    <div class="roll">${shown.map(([v, i]) => `<button type="button" class="${upSel.has(i) ? 'on' : ''}${v.added ? ' added' : ''}" data-act="upick" data-i="${i}" aria-pressed="${upSel.has(i)}" aria-label="Video from ${v.when}, ${v.len}${v.added ? ', already added' : ''}"><img src="img/${v.img}.jpg" alt=""><span>${v.added ? 'Added' : v.len}</span>${upSel.has(i) ? `<em>${order.indexOf(i) + 1}</em>` : ''}</button>`).join('')}</div>
    <p class="hint">Only the videos you pick leave your phone. You can keep climbing while we read them.</p>
    <button class="btn-l" type="button" data-act="upnext"${k ? '' : ' disabled'}>${k ? `Add ${n(k, 'video', 'videos')}` : 'Pick a video'}</button>`);
}
// reading = videos being trimmed and matched in the background; Videos shows how far along it is
let reading = null;
function readIn(total, finish) {
  reading = { total, done: 0 };
  closeAll(); go('videos'); document.querySelector('.screen').scrollTop = 0;
  const step = Math.ceil(total / 4), t = setInterval(() => {
    reading.done = Math.min(total, reading.done + step);
    const bar = document.querySelector('.rd');
    if (bar) { bar.querySelector('.rd-n').textContent = `${reading.done} of ${total}`; bar.querySelector('i').style.width = `${reading.done / total * 100}%`; }
    if (reading.done < total) return;
    clearInterval(t); reading = null; finish();
    if (page === 'videos') render();
  }, 650);
}
// the videos you picked: matched to the route on the same holds; no tape colour in frame → "No route", tagged on the video
function saveMany(picks) {
  let miss = 0;
  picks.forEach(i => {
    // noloc = no location in the video: Unknown gym, so no route list to match against either
    const v = roll[i], r = v.nocol || v.noloc ? null : list()[i % list().length], o = { k: v.k, len: v.len, raw: v.raw, img: v.img, orig: true, ...(v.noloc && { gym: -1 }) };
    v.added = true;
    if (!r) { miss++; addClip(null, o); return; }
    r.tries++; tried(r);
    addClip(r, { ...o, try: r.tries, high: r.highs[r.highs.length - 1] });
    if (v.k === TODAY) { if (session !== 'live') start(); logOf(r).tries++; tries++; secs += 240; }
  });
  toast(`${n(picks.length, 'video', 'videos')} added${miss ? ` · ${miss} need${miss === 1 ? 's' : ''} a route` : ' · each one matched to its route'}`);
}
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

function start() { session = 'live'; secs = 0; tries = 0; tops = 0; posted = false; today.clear(); }
// AI 4 · one recording (shutter or watch): every try in it is cut out and filed to the route, then "Sent it?" about the last one
function record(k = 1) {
  const r = filmRoute();
  // a route the camera read becomes one of yours; point the app at it
  if (r) sel[user] = list().indexOf(r);
  tries += k; secs += 240 * k; // prototype clock: a try plus rest is about 4 minutes
  if (!r) { for (let i = 0; i < k; i++) addClip(null, { k: TODAY, ...VIDS[i % VIDS.length] }); render(); toast(`${n(k, 'try', 'tries')} saved · tag the route in Videos`); return; }
  const saved = [];
  for (let i = 0; i < k; i++) {
    r.tries++; tried(r); logOf(r).tries++;
    saved.push(addClip(r, { try: r.tries, high: r.highs[r.highs.length - 1], k: TODAY, raw: `1:${String(5 + r.tries * 4).padStart(2, '0')}`, ...VIDS[r.tries % VIDS.length] }));
  }
  lastRoute = r; lastCut = k; camDone = { r, tries: saved, sent: false };
  render();
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
  gyset: b => { gi = +b.dataset.i; render(); toast(`You’re at ${gyms[gi].name}${session === 'live' ? ' · this session moves here' : ''}`); },
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
  done: () => {
    readSize();
    const lv = levels[setup.level];
    data.new.forEach(r => { r.g = lv.hi; r.grade = 'V' + lv.hi; });
    go('videos'); toast(`${gyms[gi].name} · ready when you are`);
  },
  // today
  grade: () => toast('V0 is the easiest, V10 the hardest. Most people start at V0–V2.'),
  guide: () => toast('Guide · grades, tape colours, gym etiquette'),
  pick: b => { const i = +b.dataset.i; if (list()[i].topped) return; sel[user] = i; located = false; render(); },
  friends: () => go('friends'),
  crowd: () => toast(`${gyms[gi].name} · usual crowd by hour, from check-ins over 4 weeks`),
  end: () => endSession(),
  videos: () => go(`route/${list().indexOf(current())}`),
  detail: () => go(`route/${list().indexOf(current())}`),
  compare: () => { lastRoute = page === 'route' ? list()[+arg] || current() : current(); go('compare'); },
  more: () => go(`gym/${gi}`),
  me: () => go('profile'),
  bell: () => user === 'regular' && tagPending ? go('friends') : toast('No new notifications'),
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
  camsee: () => { lastRoute = camDone.r; go('compare'); },
  camdone: () => go('videos'),
  keep: () => { closeAll(); go(`gym/${gi}`); },
  endnow: () => { closeAll(); endSession(); },
  fr: b => { frame = Math.min(210, Math.max(1, frame + +b.dataset.d)); render(); },
  again: () => { openCam(false); toast(watch ? 'Rest a minute, then tap your watch as you start' : 'Rest a minute, then start filming'); },
  // v2 · add a climb: film, upload, log by hand; the watch
  // Film opens the camera and nothing else; the session starts with the first recording
  film: b => { if (b.dataset.r) { sel[user] = +b.dataset.r; located = false; } openCam(!b.dataset.r); },
  shoot: () => {
    clearInterval(cutT);
    if (!filming) {
      // prototype: a try is cut every few seconds while recording
      if (session !== 'live') start();
      filming = true; cut = 0; camDone = null; camPick = false; render();
      cutT = setInterval(() => { if (filming && page === 'cam' && cut < 4) { cut++; render(); } }, 2500);
      return;
    }
    const k = Math.max(1, cut); filming = false; cut = 0; record(k);
  },
  upload: () => openUpload(),
  upick: b => { const i = +b.dataset.i; upSel.has(i) ? upSel.delete(i) : upSel.add(i); drawRoll(); },
  upnext: () => { const s = [...upSel]; if (s.length) readIn(s.length, () => saveMany(s)); },
  uphide: () => { hideAdded = !hideAdded; drawRoll(); },
  // in the camera: the route read from the tape in frame; tap it to switch if it's wrong
  campick: () => { if (!filming) { camPick = !camPick; render(); } },
  camrt: b => {
    const i = +b.dataset.i;
    camPick = false; camFree = i < 0;
    if (i >= 0) { sel[user] = i; located = false; }
    render(); toast(camFree ? 'Filming without a route · tag it later in Videos' : `Filming ${rname(list()[i])}`);
  },
  addfound: () => takeFound(),
  log: b => { if (b?.dataset?.g) gi = +b.dataset.g; openLog(page === 'cam' ? filmRoute() : null); },
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
  watch: () => { watch = !watch; render(); toast(watch ? 'Watch connected · tap it before each try' : 'Watch disconnected'); },
  notnow: () => { const r = lastRoute || current(); openAsk('keep', `${r.color} ${r.grade} saved for next time`); },
  hide: b => {
    const [r, e] = [...today.entries()][+b.dataset.i];
    e.hidden = !e.hidden; clips.forEach(c => { if (c.r === r && c.k === TODAY) c.hidden = e.hidden; }); render();
  },
  post: () => {
    const k = [...today.values()].filter(e => e.sent && !e.hidden).length, h = [...today.values()].filter(e => e.hidden).length;
    if (k && !posted) toast(`${n(k, 'send', 'sends')} posted${h ? ` · ${h} hidden` : ''}`);
    posted = true; go('profile');
  },
  // videos: filter, open, tag a route, hide, delete
  vf: b => { const i = +b.dataset.i; vf = i === -1 ? 'all' : i === -2 ? 'none' : clipRoutes()[i]; render(); },
  place: b => { const c = byId(b.dataset.i); openLog(c.r, c); },
  anok: b => { const c = byId(b.dataset.i); confirmed(c, c.auto); },
  tagstart: b => { $('lvv')?.pause(); tagS = { id: +b.dataset.i, i: 0, pts: {} }; drawTag(byId(b.dataset.i)); document.querySelector('.screen').scrollTo(0, 0); },
  tagundo: b => { if (tagS.i) { tagS.i -= 1; delete tagS.pts[TAGS[tagS.i][0]]; } else if (byId(b.dataset.i).auto) tagS = { id: null, i: 0, pts: {} }; drawTag(byId(b.dataset.i)); },
  tagdone: b => { const c = byId(b.dataset.i); confirmed(c, { ...tagS.pts, t: c.auto?.t ?? 0 }, true); },
  retag: b => { const c = byId(b.dataset.i); c.tags = null; c.an = 'ask'; tagS = { id: null, i: 0, pts: {} }; render(); document.querySelector('.screen').scrollTo(0, 0); },
  ctab: b => { cTab = b.dataset.v; document.querySelectorAll('.ctabs button').forEach(x => x.setAttribute('aria-pressed', x === b)); document.querySelectorAll('.pn').forEach(p => { p.hidden = p.dataset.pn !== cTab; }); },
  spd: b => { speed = +b.dataset.v; const v = $('lvv'); if (v) v.playbackRate = speed; document.querySelectorAll('.sp-b button').forEach(x => x.setAttribute('aria-pressed', x === b)); },
  vplay: b => toast(`Playing · ${b.dataset.len}`),
  seekt: b => { const v = $('lvv'); if (v) { v.currentTime = +b.dataset.t; document.querySelector('.screen').scrollTo({ top: 0, behavior: 'smooth' }); v.play().catch(() => {}); } },
  lvplay: () => { const v = $('lvv'); if (v) v.paused ? v.play().catch(() => {}) : v.pause(); },
  vcmp: b => { lastRoute = byId(b.dataset.i).r; go('compare'); },
  vhide: b => { const c = byId(b.dataset.i); c.hidden = !c.hidden; render(); },
  vdel: b => { clips.splice(clips.indexOf(byId(b.dataset.i)), 1); go('videos'); toast('Video deleted · the try stays in your log'); },
  oldset: () => toast('Purple V2 · 3 videos, last climbed Oct 12'),
  // found in Photos since you last looked
  foundyes: () => takeFound(),
  foundno: () => { foundOff = true; render(); toast('We’ll ask again after your next session'); },
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
  // originals in Photos: chalk. keeps the trimmed copy
  origdel: () => {
    const k = clips.filter(c => c.orig).length;
    pane(`<h2>Delete ${n(k, 'original', 'originals')} from Photos?</h2><span class="sub">chalk. keeps a trimmed copy of each, with its analysis. Frees ${(k * .15).toFixed(1)} GB.</span>
      <div class="two"><button class="b-ghost" type="button" data-act="close">Keep them</button><button class="b-lime" type="button" data-act="origyes">Delete originals</button></div>`);
  },
  origyes: () => { const k = clips.filter(c => c.orig).length; clips.forEach(c => { c.orig = false; }); closeAll(); render(); toast(`${(k * .15).toFixed(1)} GB freed on your phone`); },
  // share a send, or every send as a reel
  share: b => openShare(byId(b.dataset.i)),
  reel: () => openReel(),
  shsave: () => { closeAll(); toast('Saved to Photos'); },
  shsend: () => { closeAll(); toast(user === 'regular' ? 'Sent to Alex and Jo' : 'Link copied · paste it anywhere'); },
  // profile, friends
  size: () => toast('Change your level, height and arm span here'),
  export: () => toast(user === 'regular' ? 'chalk-log.csv · 142 tries, 24 sends, every video link' : `chalk-log.csv · ${n(tries, 'try', 'tries')} so far`),
  ftag: b => {
    tagPending = false;
    if (b.dataset.v === '1') [4, 5].forEach(t => addClip(data.regular[0], { try: t, high: 4, k: 75, len: `0:4${t}`, img: 'woman2', by: 'Alex' }));
    render(); toast(b.dataset.v === '1' ? '2 clips added to Yellow V3 · in Videos' : 'Declined · your name is off Alex’s post');
  },
  invite: () => toast('Invite link copied'),
  join: () => { joined = !joined; render(); toast(joined ? 'You’re going · friends can see it' : 'Removed'); },
  cm: b => {
    const i = +b.dataset.i, inp = $('main').querySelector(`[data-cm="${i}"]`), t = inp.value.trim();
    if (!t) return;
    const mineN = posted ? [...today.values()].filter(e => e.sent && !e.hidden).length : 0;
    const p = i < mineN ? [...today.entries()].filter(([, e]) => e.sent && !e.hidden)[i][0].cm : feeds[user][i - mineN].comments;
    p.push(['You', t.replace(/</g, '&lt;')]); render();
  },
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
$('filmOpts').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $('filmOpts').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
});
// a send: the route is topped and its last video marked. True for a climber's first send ever.
function markSent(r) {
  const firstEver = user === 'new' && !list().some(x => x.topped);
  tops++;
  r.topped = true; r.highs[r.highs.length - 1] = r.moves; logOf(r).sent = true;
  const c = clips.find(x => x.r === r && x.try === r.tries); if (c) { c.sent = true; c.high = r.moves; }
  if (user === 'regular') hardest.regular = Math.max(hardest.regular, r.g);
  located = false;
  return firstEver;
}
$('saveTop').addEventListener('click', () => {
  const r = lastRoute;
  const pick = $('filmOpts').querySelector('[aria-pressed="true"]'), film = window.enText ? enText(pick) : pick.textContent;
  const sentTo = film === 'No one' ? '' : film === 'Send a link' ? ' · link ready to send' : ` · clip sent to ${film}`;
  // from the camera the send is already marked: save the note and stay ready for the next route
  if (page === 'cam') { closeAll(); render(); toast(`Note saved${sentTo}`); }
  else { const firstEver = markSent(r); render(); openAsk('keep', `${firstEver ? 'Your first send! ' : ''}${r.color} ${r.grade} logged${sentTo}`); }
  $('feltOpts').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false'));
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

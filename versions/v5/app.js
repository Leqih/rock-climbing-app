// chalk. prototype v2: one screen per step of the user flow (FigJam "Flow chart v2"), one hash route per screen.
// Set up (#/setup/…) → Today (#/home) → "+" adds a climb three ways: film a try (#/cam), upload a video, log by hand
// → "Sent it?" → compare (#/compare) or log the send → "Keep climbing?" → Walls (#/walls) or end-session summary (#/summary)
// → Profile with your progress (#/profile, from your photo on Today) → Friends (#/friends).
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
let page = 'home', arg = '', frame = 132, lastRoute = null, demoHidden = false, joined = false;
// watch = a paired watch (Maria a few months in has one), filming = the camera is recording a try
let watch = user === 'regular', filming = false;
// crowd = how full the gym usually is, one value per hour from 7 AM to 10 PM (from check-ins)
const gyms = [
  { name: 'Crag House', dist: '0.8 mi', routes: 38, set: 'Thursdays', now: 'Quiet', next: 'till 6 PM', crowd: [.3, .25, .2, .2, .3, .35, .4, .35, .4, .55, .75, .95, 1, .8, .5, .3] },
  { name: 'Boulder Barn', dist: '2.4 mi', routes: 52, set: 'Mondays', now: 'Quiet', next: 'till 4 PM', crowd: [.2, .15, .15, .2, .25, .3, .35, .4, .6, .8, .9, .85, .7, .5, .3, .2] },
  { name: 'Up Wall', dist: '5.1 mi', routes: 27, set: 'every other Friday', now: 'Busy', next: 'till noon', crowd: [.5, .7, .8, .6, .4, .3, .3, .35, .45, .6, .8, .9, .85, .6, .4, .2] }
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
let gi = 0;
const $ = id => document.getElementById(id);
const list = () => data[user];
// the route picked in the 3-up picker; falls back to the first one not topped yet
const sel = { new: 0, regular: 0 };
// the app only shows routes it has seen for itself: ones you climbed, filmed, scanned or saved. Walls reset, so a gym's list can't be promised.
// list() stays as what the camera can recognise from the tape in frame.
const known = r => r.tries > 0 || !!r.proj || !!r.seen;
const mine = () => list().filter(known);
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
const tabHead = t => `<div class="tabh"><h1 class="hl tab">${t}</h1><button class="av sm" type="button" data-act="me" aria-label="Your profile"><img src="img/woman2.jpg" alt=""></button></div>`;
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

  // level, size (optional) and the public default on one screen, then straight to Today
  level: () => ({ photo: 'woman2', html: `
    ${brand}${ruler(2)}
    <h1 class="hl">What do you climb now?</h1>
    <p class="sub-w">Tips and beta are pitched at this. Change it anytime.</p>
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
    <p class="cap">Used to plan your moves on a scanned route and to find beta from climbers built like you.</p>
    <div class="hl2 dk2"><h2>Your sends are public</h2></div>
    <div class="row post-demo">
      <span class="pav"><img src="img/woman2.jpg" alt=""></span>
      <span class="row-t"><strong>You topped Orange V2</strong><span>Wall A · ${gyms[gi].name} · just now</span></span>
      <button class="vis${demoHidden ? ' off' : ''}" type="button" data-act="demo" aria-pressed="${demoHidden}">${demoHidden ? `${ic.eyeOff}Hidden` : `${ic.eye}Public`}</button>
    </div>
    <p class="cap">Friends see what you top and can comment. Tap the button: any climb can be hidden, anytime.</p>`,
    cta: `<button class="b-lime" type="button" data-act="done">Start</button>` })
};

/* ---------- Today ---------- */
// "Your gym today": flat light tiles under the photo. One big light value per tile, lime = you / now.
// friends at the gym right now (climbs are public by default); new climbers get an invite instead
function friendsTile() {
  if (user === 'regular') return `<button class="lt short" type="button" data-act="friends">
    <span class="lt-h">Friends</span>
    <span class="avs"><img src="img/man1.jpg" alt="Alex"><img src="img/woman1.jpg" alt="Jo"></span>
    <span class="mv"><b>2 here</b><span class="mv-l">Alex is on Wall B</span></span>
  </button>`;
  return `<button class="lt short" type="button" data-act="friends">
    <span class="lt-h">Friends</span>
    <span class="sqb">${ic.add}</span>
    <span class="mv"><span class="mv-l">Invite the people you climb with. You’ll see each other’s climbs.</span></span>
  </button>`;
}

// crowd by hour, 7 AM–10 PM, as a barcode: grey = earlier today, black = later, lime = now (9:41 AM)
function crowdTile() {
  const g = gyms[gi], bars = [];
  g.crowd.forEach((v, i) => bars.push(v, (v + (g.crowd[i + 1] ?? v)) / 2));
  const now = 5, H = 40;
  const svg = bars.map((v, i) => {
    const x = i * 10 + 3, h = Math.max(3, v * H);
    return `<rect x="${x}" y="${H - h}" width="4" height="${h}" fill="${i === now ? '#B5CF2A' : i < now ? '#C4C4BF' : '#1B1B1B'}"/>`;
  }).join('') + `<line x1="${now * 10 + 5}" y1="0" x2="${now * 10 + 5}" y2="${H}" stroke="#B5CF2A" stroke-width="1.5"/>`;
  return `<button class="lt short crowd" type="button" data-act="crowd">
    <span class="lt-h">Crowd</span>
    <span class="cv"><b>${g.now}</b> ${g.next}</span>
    <svg viewBox="0 0 320 ${H}" preserveAspectRatio="none" aria-label="${g.now}, ${g.next}">${svg}</svg>
  </button>`;
}

// under the photo, one grid and no section titles: sends by grade across the top, friends and crowd side by side.
// The gym's name in the header changes the gym; the watch lives in the camera and Profile.
// in a session the grade counts wait for the summary, so Today still fits one screen
const belowFold = () => session === 'live' ? `<div class="lb tday live-lb">${friendsTile()}${crowdTile()}</div>`
  : `<div class="lb tday">${gradesTile()}${friendsTile()}${crowdTile()}</div>`;

const heroOf = r => r.tries ? `<b>${Math.max(0, ...r.highs)}<small>/${r.moves}</small></b><span>your highest move</span>`
  : `<b>${r.moves}</b><span>moves, read from your photo</span>`;

/* ---------- Today's plan and progress by grade: nothing here depends on which routes are on the wall ---------- */
// Walls reset every week, so goals are by grade and by skill: "your first V3" and "turn your hip in" outlive any one route.
const goalG = () => user === 'regular' ? hardest.regular + 1 : levels[setup.level].hi;
// tries this session at grade g, filmed, uploaded or logged by hand
const doneAt = g => [...today].reduce((k, [r, e]) => k + (r.g === g ? e.tries : 0), 0);
// one skill to work on: from your own videos once there are some, else what most climbers at your level work on first
function focus() {
  const t = list().filter(r => r.tries && (user !== 'regular' || r.g === goalG())).reduce((k, r) => k + r.tries, 0);
  if (user === 'regular') return { t: 'Turn your hip in on long reaches', name: 'Drop knee',
    why: `From ${t} tries at V${goalG()}: you stop on long reaches, hips square to the wall.`,
    how: 'Before each long reach, turn that hip to the wall and drop the knee.', check: 'we check your hip on the long reach' };
  return { t: 'Straight arms, push with your legs', name: 'Straight arms',
    why: t ? `From your ${n(t, 'video', 'videos')}: your arms bend between moves.` : `Where most climbers at ${levels[setup.level].g} start. Film a try to make it yours.`,
    how: 'Hang on straight arms, move your feet first, stand up with your legs.', check: 'we check your arms on each move' };
}
// Today's plan, set the way a coach sets a session: warm up, a drill for your focus, tries at the next grade, cool down.
// Each step says what to do, how many and how long to rest. Tick a rep by hand; tries you film at that grade tick themselves.
// planOpen = the step you opened (null = the first one not done); planTicks = reps ticked by hand, per step
let planOpen = null;
const planTicks = {};
function plan() {
  const g = goalG(), f = focus(), lo = Math.max(0, g - 2), dg = Math.max(0, g - 1), k = user === 'regular' ? 4 : 3, left = {};
  return [
    { t: 'Warm up', min: 10, name: 'Easy and quiet', how: 'Loosen wrists, shoulders and hips, then two easy routes with silent feet.',
      reps: ['Mobility · 2 min', `Easy V${lo}`, `Easy V${lo}`], rest: '', demo: 'Warm-up' },
    { t: 'Drill', min: 15, g: dg, name: f.name, how: f.how,
      reps: [1, 2, 3].map(i => `Route ${i}`), rest: 'Any colour. Rest 2 min between.', demo: f.name, film: true },
    { t: 'Project', min: 20, g, name: `One V${g}, ${k} tries`, how: `Film each one: ${f.check}.`,
      reps: Array.from({ length: k }, (_, i) => `Try ${i + 1}`), rest: 'Rest 3 min between. Stop if your fingers open.', film: true },
    { t: 'Cool down', min: 5, name: 'Stretch and push', how: 'Stretch your forearms, then push-ups to balance the pulling.',
      reps: ['Forearms · 30 s a side', '10 push-ups'], rest: '', demo: 'Cool-down' }
  ].map((st, i) => {
    st.k = st.reps.length; st.filmed = 0;
    if (st.g !== undefined) { const have = left[st.g] ?? doneAt(st.g); st.filmed = Math.min(st.k, have); left[st.g] = have - st.filmed; }
    st.done = Math.min(st.k, st.filmed + (planTicks[i] || 0));
    return st;
  });
}
// one card: the focus and the session as a strip of four steps (width = minutes); then the step you're on, opened
function planCard() {
  const f = focus(), steps = plan(), cur = steps.findIndex(st => st.done < st.k);
  const open = planOpen ?? (cur < 0 ? steps.length - 1 : cur), st = steps[open];
  const total = steps.reduce((a, x) => a + x.min, 0);
  const map = steps.map((x, i) => `<button class="pm${i === open ? ' open' : ''}${x.done >= x.k ? ' done' : ''}" style="flex:${x.min} 1 0" type="button" data-act="plopen" data-i="${i}" aria-pressed="${i === open}" aria-label="${x.t}, ${x.min} min, ${x.done} of ${x.k} done">
      <i><b style="width:${(x.done / x.k * 100).toFixed(0)}%"></b></i><span>${x.t}</span></button>`).join('');
  const reps = st.reps.map((r, j) => `<button class="rep${j < st.done ? ' on' : ''}" type="button" data-act="rep" data-i="${open}" data-j="${j}" aria-pressed="${j < st.done}">${j < st.done ? ic.check : ''}${r}</button>`).join('');
  const play = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';
  return `<section class="glass pl" aria-label="Today’s plan, ${total} min${cur < 0 ? ', all done' : ''}">
      <p class="pl-f"><span class="k">Focus</span>${f.t}</p>
      <div class="pl-map">${map}</div>
      <div class="pn-h"><b class="pn-t">${st.name}<small>${st.min} min${st.g !== undefined && st.t === 'Drill' ? ` · V${st.g}` : ''}</small></b>
        ${st.demo ? `<button class="pn-demo" type="button" data-act="demo" data-n="${st.demo}">${play}0:20</button>` : ''}</div>
      <p class="pn-how"><span>${st.how}</span>${st.rest ? ` <span>${st.rest}</span>` : ''}</p>
      <div class="pn-reps">${reps}</div>
      ${st.film ? `<button class="b-lime pn-film" type="button" data-act="planfilm" data-g="${st.g}">${ic.rec}Film ${st.t === 'Project' ? `try ${Math.min(st.done + 1, st.k)}` : 'a route'}</button>` : ''}
    </section>`;
}
// sends per grade: Maria's history plus anything topped today
function sendsBy() {
  const s = user === 'regular' ? { 0: 6, 1: 9, 2: 7 } : {};
  today.forEach((e, r) => { if (e.sent) s[r.g] = (s[r.g] || 0) + 1; });
  return s;
}
// the next grade: how many tries you've had at it and the best one, as [highest move, moves]
function nextGrade() {
  const g = goalG(), on = list().filter(r => r.g === g && r.tries);
  return { g, t: on.reduce((k, r) => k + r.tries, 0), best: on.map(r => [Math.max(0, ...r.highs), r.moves]).sort((a, b) => b[0] / b[1] - a[0] / a[1])[0] };
}
// under the headline: your closest try at the next grade, as a staircase of its moves
function goalLine() {
  const { g, t, best } = nextGrade();
  if (!best) return `<p class="goal"><span>No tries at V${g} yet. The plan below gets you there.</span></p>`;
  const ladder = Array.from({ length: best[1] }, (_, i) => `<i class="${i < best[0] ? 'on' : i === best[0] ? 'nx' : ''}" style="height:${((i + 1) / best[1] * 100).toFixed(0)}%"></i>`).join('');
  return `<p class="goal"><span class="mvl" aria-hidden="true">${ladder}</span><span><b>Move ${best[0]} of ${best[1]}</b> is your closest, in ${n(t, 'try', 'tries')}</span></p>`;
}
// one tile: total sends, then one column per grade; the next grade in lilac. Opens Profile.
function gradesTile() {
  const s = sendsBy(), g = goalG(), total = Object.values(s).reduce((a, b) => a + b, 0);
  const top = Math.max(4, g), max = Math.max(1, ...Object.values(s));
  const cols = Array.from({ length: top + 1 }, (_, k) => `<span class="${k === g ? 'nx' : ''}"><small>${s[k] || 0}</small><i style="height:${Math.max(4, (s[k] || 0) / max * 100).toFixed(0)}%"></i><em>V${k}</em></span>`).join('');
  return `<button class="lt w2 short grc2" type="button" data-act="me" aria-label="Sends per grade, ${total} in all. Opens your progress">
      <span class="grc-h"><span class="lt-h">Sends by grade</span><span class="grc-n"><b>${total}</b>${user === 'regular' ? 'since Aug 17' : 'so far'}</span></span>
      <span class="grc">${cols}</span>
    </button>`;
}

// in a session: the route you just filmed, as one row. Film is on the plan, so this only opens what to change.
function lastCard(r) {
  const hi = Math.max(...r.highs);
  const line = r.topped ? 'Topped · see how others climbed it' : r.you ? `${(r.you / r.senders).toFixed(0)}× longer on move ${hi} than people who topped it` : 'We compare each move with people who topped it';
  return `<button class="glass lastr" type="button" data-act="compare">
      <img src="img/${r.img}.jpg" alt="">
      <span><b>${sw(r)}${rname(r)} · ${r.topped ? 'topped' : `move ${hi} of ${r.moves}`}</b><small>${line}</small></span>
      ${ic.arr('#FFFFFF')}
    </button>`;
}

function viewHome() {
  const r = current(), next = plan().find(st => st.done < st.k);
  let headline;
  if (session === 'live') headline = next ? `Next: ${next.t.toLowerCase()}${next.g !== undefined ? ` at V${next.g}` : ''}` : 'Plan done · climb anything';
  else if (session === 'saved') headline = `Saved · ${fmt(secs)} today`;
  else headline = `Next goal: your first V${goalG()}`;
  let top;
  // live: one slim session bar, the plan with what's done, then the route you just filmed and what to change on it
  if (session === 'live') top = `
    <section class="glass live-bar">
      <span class="dot"></span><b class="num">${fmt(secs)}</b>
      <span>${tries ? `${n(tries, 'try', 'tries')} · ${n(tops, 'top', 'tops')} this session` : watch ? 'Tap your watch before each try' : 'Tap Film before each try'}</span>
      <button class="end" type="button" data-act="end">End</button>
    </section>
    ${planCard()}
    ${r && today.has(r) ? lastCard(r) : ''}`;
  else top = planCard();
  return { photo: 'woman2', html: `
    <header class="top">
      <button class="av" type="button" data-act="me" aria-label="Your profile"><img src="img/woman2.jpg" alt="Maria"></button>
      <div class="who"><strong>Maria</strong><button type="button" data-act="gym">${ic.pin}${gyms[gi].name}</button></div>
      <button class="sq" type="button" data-act="bell" aria-label="Notifications">${ic.bell}${user === 'regular' && tagPending ? '<span class="pip"></span>' : ''}</button>
    </header>
    <h1 class="hl hl-home">${headline}</h1>
    ${session === 'none' ? goalLine() : ''}
    ${top}
    <div class="fold"></div>
    ${belowFold()}` };
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

// one number per route, same as the Today card: how high you got, or for a scanned route its moves; the big tile also names the wall
const routeNum = (r, big) => (r.topped ? `<b>Sent</b><span>on try ${r.tries}`
  : r.tries ? `<b>${Math.max(0, ...r.highs)}<small>/${r.moves}</small></b><span>highest move`
  : `<b>${r.moves}</b><span>moves, from your photo`) + (big ? ` · ${r.wall}` : '') + '</span>';

/* ---------- Walls: know what to climb? Pick a tile = yes, Scan = no ---------- */
// only routes you've climbed, filmed or scanned here: no gym route list, no reset dates. Scan is how you find new ones.
function viewWalls() {
  const g = gyms[gi], l = list(), m = mine(), sz = sizes(m.length);
  const tiles = m.map(r => [r, l.indexOf(r)]).map(([r, i], k) => `<div class="lt pt ${sz[k]}">
      <img src="img/${r.img}.jpg" alt=""><span class="shade"></span>
      <button class="pt-open" type="button" data-act="route" data-i="${i}" aria-label="${r.color} ${r.grade}: beta and tries"></button>
      <span class="pk-tag">${sw(r)}${r.color} ${r.grade}</span>
      <span class="pt-b">${routeNum(r, sz[k].includes('tall'))}</span>
      <button class="pj${r.proj ? ' on' : ''}" type="button" data-act="proj" data-i="${i}" aria-pressed="${!!r.proj}">${r.proj ? 'Project' : '+ Project'}</button>
    </div>`).join('');
  return { photo: 'wall2', html: `
    ${tabHead('Walls')}
    <p class="sub-w">${g.name} · ${m.length ? `${n(m.length, 'route', 'routes')} you’ve climbed or scanned` : 'routes show up here once you scan or climb them'}</p>
    <section class="glass scan-c">
      <span class="t2">${m.length ? 'Found a new route?' : 'Find a route'}</span>
      <span class="sub">Take a photo of it. We read its tape colour and grade, and draw the moves on it for your height.</span>
      <button class="pk-go static" type="button" data-act="scan">${ic.scan}Scan a wall</button>
    </section>
    <div class="fold"></div>
    ${m.length ? `<div class="hl2 dk2"><h2>Your routes</h2><span class="hint2">${user === 'regular' ? 'V2–V3' : levels[setup.level].g}</span></div>
    <p class="cap">Tap one for beta from climbers your height.</p>
    <div class="lb">${tiles}` : '<div class="lb">'}
      <button class="lt w2 short" type="button" data-act="log"><span class="lt-h">Climbed one without a video?</span><span class="sqb">${ic.add}</span>
        <span class="mv"><span class="mv-l">Log it by its tape colour and grade.</span></span></button></div>` };
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
const onList = r => { if (!list().includes(r)) list().push(r); return list().indexOf(r); };
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
      <div class="lt"><span class="lt-h">Planned for you</span><p class="tip-d">${myH()} cm tall, ${span} cm arm span. ${long ? 'Move 5 is a stretch for you, so the beta adds a high foot before it.' : 'Every move is in reach without extra feet.'}</p></div>
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
    ${bar(`${r.wall} · ${gyms[gi].name}`)}
    <div class="pk solo">
      <img src="img/${r.img}.jpg" alt=""><span class="shade"></span>
      <span class="pk-tag">${sw(r)}${r.color} ${r.grade}</span>${r.proj ? '<span class="pk-on lilac">In your projects</span>' : ''}
      <span class="pk-b"><span class="pk-hero">${hero}</span><span class="pk-sub">${r.wall} · ${r.moves} moves${r.topped ? ' · topped' : r.tries ? ` · ${n(r.tries, 'try', 'tries')}` : ''}</span></span>
      ${r.topped ? '' : `<button class="pk-go" type="button" data-act="film" data-r="${idx}">${ic.rec}Film try ${r.tries + 1}</button>`}
    </div>
    <div class="fold"></div>
    <div class="hl2 dk2"><h2>Beta from your height</h2><span class="hint2">${myH() - 5}–${myH() + 5} cm</span></div>
    <p class="cap">${n(near.length, 'climber', 'climbers')} your height topped it. Tap to watch.</p>
    <div class="betas">${near.map(b => `<button class="tile photo" type="button" data-act="play" data-who="${b.who}" data-len="${b.len}"><img src="img/${b.img}.jpg" alt=""><span class="shade"></span><span class="ic play">${ic.play}</span><b>${b.h}<small> cm</small></b><span class="sub">${b.who} · topped on try ${b.tries}</span></button>`).join('')}</div>
    <div class="stack">
      ${triesTile}
      <div class="lt"><span class="lt-h">How to climb it</span><p class="tip-d">${r.short}</p></div>
      ${r.proj ? '' : `<button class="row" type="button" data-act="proj" data-i="${idx}"><span class="row-t"><strong>Add to projects</strong><span>It shows up first on Today until you top it</span></span>${ic.plus}</button>`}
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
      <span class="pt-b">${e.sent ? `<b>Sent</b><span>on try ${r.tries}</span>` : r.mine ? `<b>${e.tries}</b><span>${e.tries === 1 ? 'try' : 'tries'} by hand</span>`
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

/* ---------- Over time: Profile, with your progress (opened from your photo on Today) ---------- */
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
      : `<span class="sub">November so far</span><b class="num">No sessions yet</b><span class="sub">Start one from Today. It shows up here when you end it.</span>`;
  // no reset dates: we can't know them. Routes you stop seeing just move down; their videos stay.
  const reset = '';
  const untagged = clips.filter(c => !c.r).length;
  return { photo: 'woman2', html: `
    ${bar('Profile')}
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
      <button class="row" type="button" data-act="to" data-to="watch"><span class="row-t"><strong>Watch</strong><span>${watch ? 'Connected · counts tries and session time' : 'Not connected'}</span></span>${ic.arr('#111111')}</button>
      <button class="row" type="button" data-act="size"><span class="row-t"><strong>Level and size</strong><span>${reg ? 'V2–V3' : levels[setup.level].g} · ${myH()} cm · used to find beta from climbers built like you</span></span></button>
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
function addClip(r, o) { const c = { id: cid++, r, try: 1, high: 0, sent: false, by: '', hidden: false, raw: '', orig: false, ...o }; clips.unshift(c); return c; }
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
  // her first V3, on a set that has since been reset
  addClip({ color: 'Green', hex: '#2E9E62', grade: 'V3', wall: 'Wall A', moves: 6, highs: [], old: true, tries: 4 }, { try: 4, high: 6, sent: true, k: 68, len: '0:52', raw: '2:40', img: 'woman2' });
  addClip(Y, { try: 3, high: 3, k: 68, len: '0:40', img: 'woman3' });
  addClip(R, { try: 1, high: 2, k: 73, len: '0:29', img: 'wall1' });
  addClip(B, { try: 3, high: 2, k: 73, len: '0:51', img: 'wall2', by: 'Jo' });
  addClip(null, { k: 73, len: '0:22', raw: '1:36', img: 'man1', orig: true });
  addClip(Y, { try: 6, high: 4, k: 75, len: '0:44', img: 'woman1' });
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
    for (let t = 1; t <= k; t++) { r.tries++; addClip(r, { try: r.tries, high: Math.min(5, r.tries + 1), sent: t === 5, k: day, len: `0:${28 + t * 4}`, raw: `${1 + t % 3}:${10 + t * 7}`, img: ['woman1', 'woman3', 'man1', 'wall1'][t % 4], imp: true, orig: true, gym }); }
  }));
  // no tape colour in frame; the last one has no location either
  ['wall2', 'woman2', 'wall1'].forEach((img, i) => addClip(null, { k: 69, len: `0:${18 + i * 7}`, raw: `1:${20 + i * 9}`, img, imp: true, orig: true, gym: i === 2 ? -1 : 0 }));
  found = 0;
}
// keeps looking in Photos after set up: new climbing videos get trimmed, matched to their route and logged as tries
const inPhotos = [{ img: 'woman3', len: '0:38', raw: '2:41' }, { img: 'wall1', len: '0:27', raw: '1:55' }, { img: 'man1', len: '0:46', raw: '3:12' }];
function importFound() {
  inPhotos.forEach((v, i) => {
    const r = list()[i % list().length];
    r.tries++; tried(r);
    addClip(r, { try: r.tries, high: r.highs[r.highs.length - 1], k: 76, len: v.len, raw: v.raw, img: v.img, orig: true });
  });
  found = 0; render(); toast(`${inPhotos.length} videos imported · each trimmed to the climb`);
}

// like a KEKE record: one card per route per day, every try on it inside. It opens on the latest try; the others are a tap away there.
const vtile = cs => {
  const c = cs[0], ids = cs.map(x => x.id).join(','), on = cs.every(x => picked.has(x.id)), many = cs.length > 1;
  const top = cs.some(x => x.sent), hi = Math.max(...cs.map(x => x.high)), first = cs[cs.length - 1].try;
  return `<button class="vt${c.r ? '' : ' none'}${cs.every(x => x.hidden) ? ' hid' : ''}${on ? ' on' : ''}${many ? ' many' : ''}" type="button" ${picking ? `data-act="vpick" data-i="${ids}" aria-pressed="${on}"` : `data-act="to" data-to="clip/${c.id}"`} aria-label="${c.r ? `${rname(c.r)}, ${many ? `tries ${first} to ${c.try}` : `try ${c.try}`}` : 'Video without a route'}, ${dayOf(c.k)}">
    <img src="img/${c.img}.jpg" alt=""><span class="shade"></span>
    <span class="vt-t">${c.r ? `${sw(c.r)}${c.r.grade || c.r.color}${many ? '' : ` · try ${c.try}`}` : 'No route'}</span>
    ${picking ? '<span class="vt-c"></span>' : ''}
    <span class="vt-b">${top ? 'Topped' : c.r ? `Move ${hi}/${c.r.moves}` : 'Tag it'}</span><span class="vt-l">${cs.every(x => x.hidden) ? ic.eyeOff : ''}${many ? `tries ${first}–${c.try}` : c.len}</span>
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
    <p class="sub-w">${clips.length ? `${n(clips.length, 'video', 'videos')} of your tries · newest first` : 'Your tries on video, each one analysed'}</p>
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
      <button class="btn-l" type="button" data-act="ctagsave" data-c="${c.id}"${ctag.color && ctag.grade !== null ? '' : ' disabled'}>${ctag.color && ctag.grade !== null ? `Tag ${ctag.color} V${ctag.grade} and analyse` : 'Pick a colour and a grade'}</button></div>`;
  return { photo: c.img, html: `
    ${bar(r ? `${rname(r)} · try ${c.try}` : 'Not tagged yet')}
    <div class="clip vp"><img src="img/${c.img}.jpg" alt=""><span class="shade"></span>
      <button class="play-b" type="button" data-act="vplay" data-len="${c.len}" aria-label="Play the video">${ic.play}</button>
      <span class="clip-l">${r ? `<span class="pk-tag">${sw(r)}${rname(r)} · try ${c.try}</span>` : '<span class="pk-tag">No route yet</span>'}
        <span>${dayOf(c.k)} · ${r && !c.imp ? r.wall : g ? g.name : 'Unknown gym'} · ${c.len}${c.raw ? `, trimmed from ${c.raw}` : ''}${c.by ? ` · filmed by ${c.by}` : ''}</span></span></div>
    ${r ? `<section class="glass scrub"><div class="mv-t" aria-label="Moves; you reached move ${hi}">${ticks}</div>
      <p class="scrub-l">${c.sent ? `Topped · all ${mv} moves` : `You reached move ${hi} of ${mv}`}</p></section>` : ''}
    <div class="fold"></div>
    ${r ? '' : details}
    ${seen}
    ${triesStrip}
    ${r ? details : ''}
    <div class="hl2 dk2"><h2>This video</h2></div>
    <div class="rows">
      ${c.sent ? `<button class="row" type="button" data-act="share" data-i="${c.id}"><span class="row-t"><strong>Share this send</strong><span>A poster with the grade, tape colour and gym on it</span></span>${ic.arr('#111111')}</button>` : ''}
      <div class="row"><span class="row-t"><strong>${c.hidden ? 'Only you' : 'Public'}</strong><span>${c.hidden ? 'Hidden from your profile and friends’ feed' : 'On your profile · friends can comment'}</span></span>
        <button class="vis${c.hidden ? ' off' : ''}" type="button" data-act="vhide" data-i="${c.id}" aria-pressed="${c.hidden}">${c.hidden ? `${ic.eyeOff}Hidden` : `${ic.eye}Public`}</button></div>
      <button class="row" type="button" data-act="vdel" data-i="${c.id}"><span class="row-t"><strong>Delete video</strong><span>The try stays in your log</span></span></button>
    </div>` };
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
// a route at grade g in front of the camera (prototype): one you know, else a new one read from its tape
function wallRoute(g) {
  const r = list().find(x => x.g === g && !x.topped);
  if (r) return r;
  const used = list().map(x => x.color), t = tapes.find(c => !used.includes(c[0])) || tapes[0];
  const nr = { color: t[0], hex: t[1], grade: 'V' + g, g, wall: ['Wall A', 'Wall B', 'Wall C', 'Wall D'][g % 4], img: ['wall1', 'wall2', 'woman1', 'man1'][g % 4],
    tries: 0, moves: 5, highs: [], videos: 2, short: 'Read it from the ground first: find the start holds and the last one.' };
  list().push(nr);
  return nr;
}
// the camera opens at once. A route picked on a card is used as it is; otherwise the tape in frame is read first.
function openCam(read, g = null) {
  closeAll(); camDone = null; camPick = false; camFree = false; camReading = read; camRead = read;
  clearTimeout(camT);
  if (read) camT = setTimeout(() => {
    camReading = false;
    if (g !== null) { const r = wallRoute(g); r.seen = true; sel[user] = list().indexOf(r); }
    if (page === 'cam') render();
  }, 1400);
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
const views = { home: viewHome, walls: viewWalls, scan: viewScan, route: viewRoute, compare: viewCompare, summary: viewSummary, profile: viewProfile, videos: viewVideos, clip: viewClip, friends: viewFriends, cam: viewCam, watch: viewWatch };
const tabOf = { home: 'home', compare: 'home', cam: 'home', watch: 'home', walls: 'walls', scan: 'walls', route: 'walls', videos: 'videos', clip: 'videos', friends: 'friends' };
const dock = document.querySelector('.dock');
function readHash() { const [p = '', a = ''] = location.hash.replace(/^#\/?/, '').split('/'); page = p === 'setup' || views[p] ? p : 'home'; arg = a; }
function go(p) { if (location.hash === '#/' + p) render(); else location.hash = '#/' + p; }

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
  document.querySelector('.phone').classList.toggle('dark', !!v.dark);
  dock.hidden = !!v.cta || !!v.bare;
  dock.querySelectorAll('.dk:not(.plus)').forEach(b => b.toggleAttribute('aria-current', b.dataset.dock === tabOf[page]));
  dock.querySelector('[aria-current]')?.setAttribute('aria-current', 'page');
  $('plus').innerHTML = `${ic.plus}<span>Add</span>`;
  island();
  $('videosPip').style.display = found && !foundOff ? '' : 'none';
  $('friendsPip').style.display = user === 'regular' && tagPending ? '' : 'none';
}

// the Dynamic Island shows a live session on every page, like a Live Activity; tap it to go back to Today
function island() {
  const el = document.querySelector('.island'), live = session === 'live';
  el.classList.toggle('live', live);
  el.innerHTML = live ? `<i></i><b class="num">${fmt(secs)}</b>` : '';
  live ? el.setAttribute('data-act', 'island') : el.removeAttribute('data-act');
  el.setAttribute('aria-label', live ? `Climbing at ${gyms[gi].name}, ${fmt(secs)}. Back to Today` : '');
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
function drawLog() {
  const d = draft, opt = (k, v, label) => `<button type="button" data-act="dset" data-k="${k}" data-v="${v}" aria-pressed="${d[k] === v}">${label}</button>`;
  // the route is what you see: snap its tag, or pick its tape colour and grade. No list of "what's on the wall now": walls reset, so we can't promise it.
  pane(`<h2>${d.place ? 'Which route is this?' : 'Log a climb'}</h2><span class="sub">${d.place ? (Array.isArray(d.place) ? `${n(d.place.length, 'video', 'videos')} you picked` : `Video from ${dayOf(d.place.k)} · ${d.place.len}`) : 'Pick the route, then how it went'}</span>
    <div class="lg-gym">${ic.pin}<span>${d.gym < 0 ? '<b>Unknown gym</b> · no location in the video' : `<b>${gyms[d.gym].name}</b> · ${d.gym === d.from ? 'from your location' : 'picked by you'}`}</span><button type="button" data-act="lgym">${d.gym < 0 ? 'Pick' : 'Change'}</button></div>
    <button class="lsnap" type="button" data-act="lsnap">${ic.scan}<span class="row-t"><strong>Snap the route’s tag</strong><span>We read the tape colour and grade from a photo</span></span></button>
    <div class="field"><span class="lbl">Or pick tape colour and grade</span><div class="opts tapes">${tapes.map(([c, h]) => opt('color', c, `<span class="sw" style="background:${h}"></span>${c}`)).join('')}</div>
      <div class="opts grades">${[0, 1, 2, 3, 4, 5, 6, 7].map(g => opt('grade', g, 'V' + g)).join('')}</div>
      <p class="hint">The grade on the gym’s tag. No tag? Pick what it felt like.</p></div>
    ${d.place ? '' : `<div class="field"><span class="lbl">How it went</span>
      <div class="res"><div class="opts">${opt('sent', 1, 'Topped')}${opt('sent', 0, 'Not yet')}</div>
        <span class="step"><button type="button" data-act="dk" data-d="-1" aria-label="One try less">−</button><b>${n(d.k, 'try', 'tries')}</b><button type="button" data-act="dk" data-d="1" aria-label="One try more">+</button></span></div></div>`}
    <button class="btn-l" type="button" data-act="logsave">${d.place ? 'Tag and analyse' : 'Save'}</button>`);
}
// the route a colour and grade point to: the gym's list when you're there, else one you already logged, else a new one only you have
function routeFor(color, g, here) {
  return (here && list().find(x => x.color === color && x.g === g)) || clipRoutes().find(x => x.mine && x.color === color && x.g === g)
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
  let r = d.gym === d.from && list().find(x => x.color === d.color && x.g === d.grade);
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
  if (!r) { for (let i = 0; i < k; i++) addClip(null, { k: TODAY, len: '0:34', img: 'wall2' }); render(); toast(`${n(k, 'try', 'tries')} saved · tag the route in Videos`); return; }
  const saved = [];
  for (let i = 0; i < k; i++) {
    r.tries++; tried(r); logOf(r).tries++;
    saved.push(addClip(r, { try: r.tries, high: r.highs[r.highs.length - 1], k: TODAY, len: `0:${30 + r.tries * 3}`, raw: `1:${String(5 + r.tries * 4).padStart(2, '0')}`, img: r.img }));
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
    go('home'); toast(`${gyms[gi].name} · ready when you are`);
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
  more: () => go('walls'),
  me: () => go('profile'),
  bell: () => user === 'regular' && tagPending ? go('friends') : toast('No new notifications'),
  gym: () => { gi = (gi + 1) % gyms.length; render(); },
  // walls, scan, route
  route: b => go(`route/${b.dataset.i}`),
  proj: b => { const r = list()[+b.dataset.i]; r.proj = !r.proj; render(); toast(r.proj ? `${r.color} ${r.grade} added to projects` : `${r.color} ${r.grade} removed from projects`); },
  // scan a wall: frame it, snap, then the beta drawn on the photo one move at a time
  scan: () => { shot = false; bstep = 0; closeAll(); go('scan'); },
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
  camdone: () => go('home'),
  keep: () => { closeAll(); go('walls'); },
  endnow: () => { closeAll(); endSession(); },
  fr: b => { frame = Math.min(210, Math.max(1, frame + +b.dataset.d)); render(); },
  again: () => { openCam(false); toast(watch ? 'Rest a minute, then tap your watch as you start' : 'Rest a minute, then start filming'); },
  // v2 · add a climb: film, upload, log by hand; the watch
  // Film opens the camera and nothing else; the session starts with the first recording
  film: b => { if (b.dataset.r) { sel[user] = +b.dataset.r; located = false; } openCam(!b.dataset.r); },
  planfilm: b => openCam(true, +b.dataset.g),
  plopen: b => { planOpen = +b.dataset.i; render(); },
  // tick a rep by hand (tap a ticked one to untick back to it); a finished step hands over to the next one
  rep: b => {
    const i = +b.dataset.i, j = +b.dataset.j, st = plan()[i];
    planTicks[i] = Math.max(0, (j < st.done ? j : j + 1) - st.filmed);
    if (plan()[i].done >= st.k) planOpen = null;
    render();
  },
  demo: b => toast(`Playing the ${b.dataset.n.toLowerCase()} demo · 0:20`),
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
  log: () => openLog(page === 'cam' ? filmRoute() : null),
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
  vplay: b => toast(`Playing · ${b.dataset.len}`),
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
  island: () => go('home'),
  back: () => history.length > 1 ? history.back() : go('home')
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
setInterval(() => { if (session === 'live') { secs += 60; if (page === 'home') render(); else island(); } }, 60000);

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
// First open: a new climber starts at set up (?from=tag = opened from a buddy's tag); ?view=regular opens Today.
if (!location.hash) history.replaceState(null, '', '#/' + (user === 'regular' ? 'home' : params.get('from') === 'tag' ? 'setup/tag' : 'setup/gym'));
readHash();
render();
// iPhone 16 Pro frame (894 px with its border): on a short window scale the whole phone down to fit, never squash it
const fitPhone = () => document.querySelector('.device').style.setProperty('--fit', Math.min(1, (innerHeight - 96) / 894).toFixed(3));
addEventListener('resize', fitPhone);
fitPhone();

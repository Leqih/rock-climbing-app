// chalk. prototype: one screen per step of the user flow (FigJam "Flow chart v2"), one hash route per screen.
// Set up (#/setup/…) → Today (#/home) → record a try → "Sent it?" → compare (#/compare) or log the send
// → "Keep climbing?" → Walls (#/walls) or end-session summary (#/summary) → Progress (#/progress) → Friends (#/friends).

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
// crowd = how full the gym usually is, one value per hour from 7 AM to 10 PM (from check-ins)
const gyms = [
  { name: 'Crag House', dist: '0.8 mi', routes: 38, set: 'Thursdays', now: 'Quiet', next: 'till 6 PM', crowd: [.3, .25, .2, .2, .3, .35, .4, .35, .4, .55, .75, .95, 1, .8, .5, .3] },
  { name: 'Boulder Barn', dist: '2.4 mi', routes: 52, set: 'Mondays', now: 'Quiet', next: 'till 4 PM', crowd: [.2, .15, .15, .2, .25, .3, .35, .4, .6, .8, .9, .85, .7, .5, .3, .2] },
  { name: 'Up Wall', dist: '5.1 mi', routes: 27, set: 'every other Friday', now: 'Busy', next: 'till noon', crowd: [.5, .7, .8, .6, .4, .3, .3, .35, .45, .6, .8, .9, .85, .6, .4, .2] }
];
const walls = [{ name: 'Wall A', routes: 11, reset: 10 }, { name: 'Wall B', routes: 9, reset: 3 }, { name: 'Wall C', routes: 10, reset: 18 }, { name: 'Wall D', routes: 8, reset: 24 }];
// people who topped the route, for "beta from climbers your height"
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
const current = () => { const r = list()[sel[user]]; return r && !r.topped ? r : list().find(x => !x.topped); };
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
  down: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>'
};
const sw = r => `<span class="sw" style="background:${r.hex}"></span>`;
const bar = (title = '') => `<div class="bar"><button class="bk" type="button" data-act="back" aria-label="Back">${ic.back}</button><span>${title}</span></div>`;

// a recorded try: how high you got this time (prototype: one move higher every other try)
function tried(r) {
  const last = r.highs.length ? r.highs[r.highs.length - 1] : 1;
  r.highs.push(Math.min(r.moves - 1, last + (r.highs.length % 2)));
  r.you ??= 5.4; r.senders ??= 2.1;
}

/* ---------- Set up: no account, no long forms ---------- */
const steps4 = ['Gym', 'Clips', 'Level', 'Sharing'];
const ruler = k => `<div class="ruler" aria-label="Step ${k} of 4">${steps4.map((s, i) => `<span class="${i < k ? 'on' : ''}"><em></em>${s}</span>`).join('')}</div>`;
const brand = '<div class="bar"><span class="brand">chalk.</span></div>';
const sorted = [
  { where: 'Crag House', when: 'Sun, Nov 1', tags: [['Orange', '#F08A24', 4], ['Blue', '#3D7BEA', 2]] },
  { where: 'Crag House', when: 'Sun, Oct 25', tags: [['Green', '#2E9E62', 5], ['Orange', '#F08A24', 1]] },
  { where: 'Boulder Barn', when: 'Mon, Oct 12', tags: [['Green', '#2E9E62', 3]] }
];
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
    <p class="sub-w">We’ll show the routes on its walls. No account needed.</p>
    <div class="fold"></div>
    <div class="rows">
      ${gyms.map((g, i) => `<button class="row opt" type="button" data-act="sgym" data-i="${i}" aria-pressed="${i === gi}">
        <span class="row-t"><strong>${g.name}</strong><span>${g.dist} · ${g.routes ? `${g.routes} routes · new set ${g.set}` : 'routes not added yet'}</span></span><span class="radio"></span></button>`).join('')}
      <button class="row" type="button" data-act="to" data-to="setup/addgym"><span class="row-t"><strong>My gym isn’t listed</strong><span>Add it in 30 seconds</span></span>${ic.arr('#111111')}</button>
    </div>`,
    cta: `<button class="b-lime" type="button" data-act="to" data-to="setup/import">Continue</button>` }),

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

  import: () => ({ photo: 'woman3', html: `
    ${brand}${ruler(2)}
    <h1 class="hl">Import your climbing clips?</h1>
    <p class="sub-w">Already filmed yourself climbing? We find those videos in Photos and log them for you.</p>
    <div class="fold"></div>
    <div class="stack"><div class="lt">
      <span class="lt-h">What happens</span>
      <ol class="how"><li><b>Sorted</b> by gym, date and tape colour</li><li><b>Logged</b> as tries on the right routes</li><li><b>Private</b> until you post them</li></ol>
    </div></div>`,
    cta: `<button class="b-ghost" type="button" data-act="to" data-to="setup/level">Skip</button><button class="b-lime" type="button" data-act="imp">Import clips</button>` }),

  sorted: () => ({ photo: 'woman3', html: `
    ${brand}${ruler(2)}
    <h1 class="hl">18 clips sorted</h1>
    <p class="sub-w">Each one is logged as a try. Fix any of them later in Progress.</p>
    <div class="fold"></div>
    <div class="rows">
      ${sorted.map(s => `<div class="row"><span class="row-t"><strong>${s.where}</strong><span>${s.when}</span>
        <span class="chips">${s.tags.map(([c, h, k]) => `<span class="chip"><span class="sw" style="background:${h}"></span>${c} × ${k}</span>`).join('')}</span></span></div>`).join('')}
      <div class="row"><span class="row-t"><strong>3 clips we couldn’t place</strong><span>No tape colour in frame · sort them in Progress</span></span></div>
    </div>`,
    cta: `<button class="b-lime" type="button" data-act="to" data-to="setup/level">Continue</button>` }),

  level: () => ({ photo: 'woman2', html: `
    ${brand}${ruler(3)}
    <h1 class="hl">What do you climb now?</h1>
    <p class="sub-w">We pick your first routes from this. Change it anytime.</p>
    <div class="fold"></div>
    <div class="rows">
      ${levels.map((l, i) => `<button class="row opt" type="button" data-act="lvl" data-i="${i}" aria-pressed="${i === setup.level}">
        <span class="row-t"><strong>${l.t}</strong><span>${l.s}${setup.imported && i === 1 ? ' · matches your clips' : ''}</span></span><b class="rg">${l.g}</b></button>`).join('')}
    </div>
    <div class="hl2 dk2"><h2>Your size</h2><span class="hint2">Optional</span></div>
    <div class="two-in">
      <label class="in"><span class="lbl">Height</span><span class="unit"><input id="hIn" type="number" inputmode="numeric" placeholder="165" value="${setup.height}">cm</span></label>
      <label class="in"><span class="lbl">Arm span</span><span class="unit"><input id="sIn" type="number" inputmode="numeric" placeholder="168" value="${setup.span}">cm</span></label>
    </div>
    <p class="cap">Only used to find beta from climbers built like you.</p>`,
    cta: `<button class="b-lime" type="button" data-act="lvlnext">Continue</button>` }),

  public: () => ({ photo: 'woman1', html: `
    ${brand}${ruler(4)}
    <h1 class="hl">Your sends are public</h1>
    <p class="sub-w">Friends see what you top and can comment. Hide any climb, anytime.</p>
    <div class="fold"></div>
    <div class="row post-demo">
      <span class="pav"><img src="img/woman2.jpg" alt=""></span>
      <span class="row-t"><strong>You topped Orange V2</strong><span>Wall A · ${gyms[gi].name} · just now</span></span>
      <button class="vis${demoHidden ? ' off' : ''}" type="button" data-act="demo" aria-pressed="${demoHidden}">${demoHidden ? `${ic.eyeOff}Hidden` : `${ic.eye}Public`}</button>
    </div>
    <p class="cap">Try it: tap the button. Every climb has one in your session summary and in Progress.</p>`,
    cta: `<button class="b-lime" type="button" data-act="done">Got it</button>` })
};

/* ---------- Today ---------- */
// "Your gym today": flat light tiles under the photo. One big light value per tile, a measuring mark, lime = you / now.
const G = 6; // the staircase shows V0–V5
function levelTile() {
  const reg = user === 'regular', lv = reg ? hardest.regular : levels[setup.level].hi;
  let steps = '';
  for (let g = 0; g < G; g++) {
    const cls = g <= lv ? `on${reg && g === lv ? ' cur' : ''}` : reg && g === lv + 1 ? 'next' : '';
    steps += `<span class="st ${cls}" style="height:${((g + 1) / G * 100).toFixed(0)}%"><i>V${g}</i></span>`;
  }
  const value = reg
    ? `<b>V${lv}</b><span class="mv-l">your hardest top</span><span class="mv-n">Next V${lv + 1}</span>`
    : `<b>${levels[setup.level].g}</b><span class="mv-l">the level you picked</span>`;
  return `<button class="lt tall lvl" type="button" data-act="guide">
    <span class="lt-h">Your level</span>
    <span class="mv">${value}</span>
    <span class="steps" aria-hidden="true">${steps}</span>
  </button>`;
}

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

function gymSection() {
  return `<section class="gymsec">
    <div class="hl2"><h2>Your gym today</h2><button type="button" data-act="gym">Change gym</button></div>
    <div class="lb">${levelTile()}${friendsTile()}${crowdTile()}</div>
  </section>`;
}

// the route as a line up the wall, one dot per move; lime dot = your high point
function routeSvg(r) {
  const pts = [[16, 152], [40, 130], [24, 106], [58, 88], [40, 64], [74, 44], [62, 14]].slice(0, r.moves + 1);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p.join(' ')).join(' ');
  const high = r.highs.length ? r.highs[r.highs.length - 1] : 0;
  const label = (x, y, t, anchor = 'start', w = 600) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="11" font-weight="${w}" fill="#FFFFFF" font-family="Urbanist">${t}</text>`;
  let marks = label(pts[0][0] + 8, pts[0][1] + 4, 'Start', 'start', 400);
  pts.forEach((p, i) => {
    if (i === 0) return;
    const top = i === pts.length - 1, isHigh = i === high && !top;
    marks += `<circle cx="${p[0]}" cy="${p[1]}" r="${isHigh ? 6 : top ? 4.5 : 3.5}" fill="${isHigh ? '#DDF26A' : top ? '#FFFFFF' : 'rgba(255,255,255,.2)'}" stroke="#FFFFFF" stroke-width="1.4"/>`;
    if (top) marks += label(p[0] - 9, p[1] + 4, 'Top', 'end');
    if (isHigh) marks += label(p[0] + 10, p[1] + 4, 'You slip');
  });
  return `<svg viewBox="0 0 112 160" aria-label="Route with ${r.moves} moves${high ? `, you reach move ${high}` : ''}"><path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>${marks}</svg>`;
}

// The picked route as one big photo card; the next two routes stack as small photos on the right, then "See all".
// Tap a small photo to swap it in. Hero number: new = how many people topped it this week, regular = how high you got.
function picker() {
  const l = list(), cur = current(), fresh = !cur.tries;
  const hero = fresh ? `<b>${cur.by}</b><span>people topped it this week</span>`
    : `<b>${Math.max(...cur.highs)}<small>/${cur.moves}</small></b><span>your highest move</span>`;
  const main = `<div class="pk">
      <img src="img/${cur.img}.jpg" alt=""><span class="shade"></span>
      <span class="pk-tag">${sw(cur)}${cur.color} ${cur.grade}</span>
      <span class="pk-on">${fresh ? 'Start here' : 'Up next'}</span>
      <span class="pk-b"><span class="pk-hero">${hero}</span><span class="pk-sub">${cur.wall} · ${cur.moves} moves${cur.easiest ? ' · easiest here' : ''}</span></span>
      ${located
        ? `<button class="pk-go" type="button" data-act="start">${ic.plus}Start climbing</button>`
        : `<button class="pk-go" type="button" data-act="locate">${ic.scan}Show me on the wall</button>`}
    </div>`;
  const rail = l.map((r, i) => [r, i]).filter(([r]) => r !== cur).slice(0, 2).map(([r, i]) => `<button class="pk-s${r.topped ? ' done' : ''}" type="button" data-act="pick" data-i="${i}" aria-label="Pick ${r.color} ${r.grade}">
      <img src="img/${r.img}.jpg" alt=""><span class="shade"></span>
      <span class="pk-s-l">${sw(r)}${r.topped ? 'Topped' : `${r.color} ${r.grade}`}</span>
    </button>`).join('');
  const more = `<button class="pk-s more" type="button" data-act="more">${ic.arr('#FFFFFF')}<span>See all</span></button>`;
  const foot = cur.tries ? `<p class="pk-foot"><span class="k">${n(cur.tries, 'try', 'tries')}</span>${cur.wall} resets in ${n(cur.daysLeft, 'day', 'days')}</p>` : '';
  return `<div class="pk-h">${l.length} routes for your level · tap a photo to switch</div>
    <div class="pks">${main}${rail}${more}</div>
    ${foot}`;
}

// The route you are on, as the same photo card Today shows before a session: the route's photo, its line drawn on it
// with your high point, one hero number and one tip. New = how many people topped it, otherwise = how high you got.
function projectCard(r) {
  const hero = !r.tries
    ? `<b>${r.by}</b><span>people topped it this week</span>`
    : `<b>${Math.max(0, ...r.highs)}<small>/${r.moves}</small></b><span>your highest move</span>`;
  return `
  <section class="pk live">
    <img src="img/${r.img}.jpg" alt=""><span class="shade"></span>
    ${routeSvg(r)}
    <span class="pk-tag">${sw(r)}${r.wall} · ${r.moves} moves</span>
    <button class="end sw-r" type="button" data-act="more">Switch</button>
    <span class="pk-b"><span class="pk-hero">${hero}</span><span class="pk-sub"><span class="k">Tip</span>${r.short}</span></span>
  </section>`;
}

// time spent on the move where you slip: you vs people who topped it
function compareTile(r) {
  const hi = Math.max(...r.highs), max = Math.max(r.you, r.senders);
  const bar = (label, v, cls) => `<span class="cb"><span>${label}</span><span class="cb-t"><span class="cb-f ${cls}" style="width:${(v / max * 100).toFixed(0)}%"></span></span><span class="num">${v} s</span></span>`;
  return `<button class="tile cmp" type="button" data-act="compare">
    <span class="t-h">Move ${hi}</span><span class="arr">${ic.arr('#FFFFFF')}</span>
    <b>${(r.you / r.senders).toFixed(0)}× longer</b>
    <span class="bars">${bar('You', r.you, '')}${bar('Topped', r.senders, 'lime')}</span>
  </button>`;
}
const videoTile = (r, sub) => `<button class="tile photo" type="button" data-act="videos"><img src="img/woman3.jpg" alt=""><span class="shade"></span><span class="ic play">${ic.play}</span><b>${r.videos}</b><span class="sub">${sub}</span></button>`;

// Small tiles only inform; every action sits on the card it acts on (route card, live card) or in the dock.
const tipTile = r => `<div class="tile tip-t"><span class="t-h">How to climb it</span><span class="tip-x">${r.short}</span></div>`;
function tiles(r) {
  const vids = videoTile(r, r.tries ? 'videos from climbers your height' : 'videos of people topping it');
  if (session === 'live') {
    const first = r.tries ? compareTile(r)
      : `<div class="tile"><span class="t-h">After this try</span><span class="tip-x">We compare each move with people who topped it.</span></div>`;
    return `<div class="duo">${first}${vids}</div>`;
  }
  return `<div class="duo">${r.tries ? compareTile(r) : tipTile(r)}${vids}</div>`;
}

function viewHome() {
  const r = current();
  let headline;
  if (session === 'live') headline = r ? `${r.tries ? `Try ${r.tries + 1}` : 'First try'} on ${r.color} ${r.grade}` : `Climbing at ${gyms[gi].name}`;
  else if (session === 'saved') headline = `Saved · ${fmt(secs)} today`;
  else if (!r) headline = 'Everything here is topped';
  else headline = user === 'regular' ? `Next goal: ${r.color} ${r.grade}` : 'Your first climb';
  let top;
  // live: one slim session bar, then the route you are on, then what to change on the next try
  if (session === 'live') top = `
    <section class="glass live-bar">
      <span class="dot"></span><b class="num">${fmt(secs)}</b>
      <span>${!r ? 'Tries save to your phone' : tries ? `${n(tries, 'try', 'tries')} · ${n(tops, 'top', 'tops')} this session` : 'Tap Record before each try'}</span>
      <button class="end" type="button" data-act="end">End</button>
    </section>
    ${r ? projectCard(r) + tiles(r) : ''}`;
  else top = r ? picker() + tiles(r) : `<button class="tile go" type="button" data-act="more"><span class="t2">Find a route for your level</span><span class="sub">New routes go up every Thursday</span></button>`;
  return { photo: 'woman2', html: `
    <header class="top">
      <button class="av" type="button" data-act="me" aria-label="Your profile"><img src="img/woman2.jpg" alt="Maria"></button>
      <div class="who"><strong>Maria</strong><button type="button" data-act="gym">${ic.pin}${gyms[gi].name}</button></div>
      <button class="sq" type="button" data-act="bell" aria-label="Notifications">${ic.bell}${user === 'regular' && tagPending ? '<span class="pip"></span>' : ''}</button>
    </header>
    <h1 class="hl">${headline}</h1>
    ${top}
    <div class="fold"></div>
    ${gymSection()}` };
}

// Bento sizes for k tiles in the 2-column grid: first one tall, the rest short, last one widened so there is no hole
function sizes(k) {
  if (k === 1) return ['w2 tall'];
  if (k === 2) return ['tall', 'tall'];
  const s = ['tall', ...Array(k - 1).fill('')];
  if (k % 2 === 0) s[k - 1] = 'w2';
  return s;
}

// one number per route, same as the Today card: how high you got, or how many people topped it; the big tile also names the wall
const routeNum = (r, big) => (r.topped ? `<b>Sent</b><span>on try ${r.tries}`
  : r.tries ? `<b>${Math.max(0, ...r.highs)}<small>/${r.moves}</small></b><span>highest move`
  : `<b>${r.by}</b><span>topped it this week`) + (big ? ` · ${r.wall}` : '') + '</span>';

/* ---------- Walls: know what to climb? Pick a tile = yes, Scan = no ---------- */
function viewWalls() {
  const g = gyms[gi], l = list(), sz = sizes(l.length);
  const tiles = l.map((r, i) => `<div class="lt pt ${sz[i]}">
      <img src="img/${r.img}.jpg" alt=""><span class="shade"></span>
      <button class="pt-open" type="button" data-act="route" data-i="${i}" aria-label="${r.color} ${r.grade}: beta and tries"></button>
      <span class="pk-tag">${sw(r)}${r.color} ${r.grade}</span>
      <span class="pt-b">${routeNum(r, sz[i].includes('tall'))}</span>
      <button class="pj${r.proj ? ' on' : ''}" type="button" data-act="proj" data-i="${i}" aria-pressed="${!!r.proj}">${r.proj ? 'Project' : '+ Project'}</button>
    </div>`).join('');
  return { photo: 'wall2', html: `
    <h1 class="hl tab">Walls</h1>
    <p class="sub-w">${g.name} · ${g.routes} routes on ${walls.length} walls · new set ${g.set}</p>
    <section class="glass scan-c">
      <span class="t2">Not sure what to climb?</span>
      <span class="sub">Point your camera at a wall. We light up one route for your level and dim the rest.</span>
      <button class="pk-go static" type="button" data-act="to" data-to="scan">${ic.scan}Scan a wall</button>
    </section>
    <div class="fold"></div>
    <div class="hl2 dk2"><h2>Pick a project</h2><span class="hint2">${user === 'regular' ? 'V2–V3' : levels[setup.level].g}</span></div>
    <p class="cap">Tap a route for beta from climbers your height.</p>
    <div class="lb">${tiles}</div>
    <div class="hl2 dk2"><h2>By wall</h2></div>
    <div class="lb">${walls.map(w => `<div class="lt short"><span class="lt-h">${w.name}</span><span class="mv"><b>${w.routes}</b><span class="mv-l">routes · reset in ${n(w.reset, 'day', 'days')}</span></span></div>`).join('')}</div>` };
}

// AI 1 · read the wall: one route lit, the rest dimmed, an estimated grade
const scanned = { color: 'Purple', hex: '#8E5BD8', grade: 'V2–V3', g: 2, wall: 'Wall C', img: 'wall2', tries: 0, moves: 5, highs: [], by: 4, videos: 2, daysLeft: 18,
  short: 'Read by the camera: big pinches low, small crimps near the top. Save your arms for the last two moves.' };
function viewScan() {
  const lit = [[150, 352], [118, 300], [168, 248], [128, 190], [176, 132], [150, 70]];
  const dim = [[60, 330], [250, 310], [40, 240], [230, 220], [80, 150], [250, 120], [210, 40], [50, 70], [270, 360], [96, 380]];
  const svg = `<svg viewBox="0 0 300 400" aria-hidden="true">
      ${dim.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.3)"/>`).join('')}
      <path d="${lit.map((p, i) => (i ? 'L' : 'M') + p.join(' ')).join(' ')}" fill="none" stroke="#DDF26A" stroke-width="1.5" stroke-dasharray="4 5"/>
      ${lit.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === lit.length - 1 ? 12 : 10}" fill="rgba(221,242,106,.3)" stroke="#DDF26A" stroke-width="2.5"/>`).join('')}
      <path d="M14 44V14h30M256 14h30v30M286 356v30h-30M44 386H14v-30" fill="none" stroke="#FFFFFF" stroke-width="2"/>
    </svg>`;
  const added = list().includes(scanned);
  return { photo: 'wall2', html: `
    ${bar('Scan a wall')}
    <div class="cam">
      <img src="img/wall2.jpg" alt="Wall C through the camera">${svg}
      <span class="pk-tag">${sw(scanned)}Purple · Est. ${scanned.grade}</span>
      <button class="cam-r" type="button" data-act="rescan">Scan again</button>
      <button class="pk-go" type="button" data-act="addscan">${added ? `${ic.arr('#111111')}Open this route` : `${ic.plus}Add to projects`}</button>
    </div>
    <div class="fold"></div>
    <div class="lb">
      <div class="lt short"><span class="lt-h">Estimate</span><span class="mv"><b>${scanned.grade}</b><span class="mv-l">from hold size and spacing</span></span></div>
      <div class="lt short"><span class="lt-h">Route</span><span class="mv"><b>${scanned.moves} moves</b><span class="mv-l">${scanned.wall} · not graded by the gym yet</span></span></div>
    </div>` };
}

/* ---------- Route: pick a project, see beta from climbers your height ---------- */
function viewRoute(i) {
  const l = list(), idx = l[+i] ? +i : l.indexOf(current()), r = l[idx];
  const hero = r.tries ? `<b>${Math.max(0, ...r.highs)}<small>/${r.moves}</small></b><span>your highest move</span>`
    : `<b>${r.by}</b><span>people topped it this week</span>`;
  const near = beta.filter(b => Math.abs(b.h - myH()) <= 5);
  const triesTile = r.tries ? `<div class="lt"><span class="lt-h">Your tries</span>
      <span class="trybars" aria-label="Highest move on each try">${r.highs.map((h, k) => `<span class="tb${k === r.highs.length - 1 ? ' last' : ''}" style="height:${(h / r.moves * 100).toFixed(0)}%"></span>`).join('')}</span>
      <span class="cap tb-l">Highest move on each of your ${r.tries} tries · the top is move ${r.moves}</span></div>
    <button class="row" type="button" data-act="compare"><span class="row-t"><strong>Compare your last try</strong><span>Side by side with someone your height who topped it</span></span>${ic.arr('#111111')}</button>` : '';
  return { photo: r.img, html: `
    ${bar(`${r.wall} · ${gyms[gi].name}`)}
    <div class="pk solo">
      <img src="img/${r.img}.jpg" alt=""><span class="shade"></span>
      <span class="pk-tag">${sw(r)}${r.color} ${r.grade}</span>${r.proj ? '<span class="pk-on lilac">In your projects</span>' : ''}
      <span class="pk-b"><span class="pk-hero">${hero}</span><span class="pk-sub">${r.wall} · ${r.moves} moves · ${r.topped ? 'topped' : `resets in ${n(r.daysLeft, 'day', 'days')}`}</span></span>
      ${r.topped ? '' : `<button class="pk-go" type="button" data-act="climb" data-i="${idx}">${ic.plus}${session === 'live' ? 'Climb this one now' : 'Start climbing'}</button>`}
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
  const climbs = rows.map(([r, e], i) => `<div class="lt pt ${sz[i]}${e.hidden ? ' hid' : ''}">
      <img src="img/${r.img}.jpg" alt=""><span class="shade"></span>
      <span class="pk-tag">${sw(r)}${r.color} ${r.grade}</span>
      <span class="pt-b">${e.sent ? `<b>Sent</b><span>on try ${r.tries}</span>` : `<b>${Math.max(0, ...r.highs)}<small>/${r.moves}</small></b><span>highest move</span>`}</span>
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
    <p class="cap">Sends post to your profile and friends’ feed, where friends can comment. Hidden climbs stay private.</p>
    ${rows.length ? `<div class="lb">${climbs}${who}</div>`
      : '<div class="row"><span class="row-t"><strong>No tries recorded</strong><span>Tap Record before each try next time and they show up here.</span></span></div>'}`,
    cta: `<button class="b-lime" type="button" data-act="post">${any && !posted ? 'Post and see progress' : 'See progress'}</button>` };
}

/* ---------- Over time: Progress ---------- */
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
function viewProgress() {
  const reg = user === 'regular', v = visitDays();
  const sends = reg ? { V0: 6, V1: 9, V2: 7, V3: 2 } : {};
  today.forEach((e, r) => { if (e.sent) sends['V' + r.g] = (sends['V' + r.g] || 0) + 1; });
  const total = Object.values(sends).reduce((a, b) => a + b, 0);
  const grades = ['V0', 'V1', 'V2', 'V3', 'V4'], max = Math.max(1, ...Object.values(sends));
  const top = grades.filter(g => sends[g]).pop();
  const cells = Array.from({ length: 84 }, (_, k) => `<i class="${k > TODAY ? 'f' : v.has(k) ? 'v' : ''}${k === TODAY ? ' t' : ''}" title="${dateOf(k).toDateString()}"></i>`).join('');
  const octo = [...v].filter(k => dateOf(k).getMonth() === 9).length;
  const recap = reg
    ? `<span class="sub">October recap</span><b class="num">9 sends</b><span class="sub">${n(octo, 'session', 'sessions')} · hardest V3, first one on Oct 24</span>`
    : session === 'saved'
      ? `<span class="sub">November so far</span><b class="num">${n(tops, 'send', 'sends')}</b><span class="sub">1 session · ${n(tries, 'try', 'tries')} · ${fmt(secs)} on the wall</span>`
      : `<span class="sub">November so far</span><b class="num">No sessions yet</b><span class="sub">Start one from Today. It shows up here when you end it.</span>`;
  const reset = reg
    ? `<div class="lt"><span class="lt-h">Wall D was reset · Oct 30</span><p class="tip-d">Purple V2 project closed after 5 tries. Its beta and 3 clips are archived with the old set.</p></div>`
    : `<div class="lt"><span class="lt-h">Wall B resets in 3 days</span><p class="tip-d">When a wall resets, projects on it close and their beta and clips are archived with the old set.</p></div>`;
  return { photo: 'woman3', html: `
    <h1 class="hl tab">Your progress</h1>
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
      <button class="row" type="button" data-act="export"><span class="row-t"><strong>Export your log</strong><span>CSV with every try, send and clip link</span></span>${ic.down}</button>
    </div>
    <section class="ask-c">
      <h3>Plan the next session</h3>
      <p>${reg ? 'Alex and Jo are both free Thursday evening.' : `Beginner night is Wednesday at 7 PM at ${gyms[gi].name}.`}</p>
      <div class="two one"><button class="b-lime" type="button" data-act="to" data-to="friends">${reg ? 'Plan with friends' : 'See group climbs'}</button></div>
    </section>` };
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
    <h1 class="hl tab">Friends</h1>
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

/* ---------- shell: routing, render, sheets ---------- */
const views = { home: viewHome, walls: viewWalls, scan: viewScan, route: viewRoute, compare: viewCompare, summary: viewSummary, progress: viewProgress, friends: viewFriends };
const tabOf = { home: 'home', compare: 'home', walls: 'walls', scan: 'walls', route: 'walls', progress: 'progress', summary: 'progress', friends: 'friends' };
const dock = document.querySelector('.dock');
function readHash() { const [p = '', a = ''] = location.hash.replace(/^#\/?/, '').split('/'); page = p === 'setup' || views[p] ? p : 'home'; arg = a; }
function go(p) { if (location.hash === '#/' + p) render(); else location.hash = '#/' + p; }

function render() {
  const v = page === 'setup' ? (setupViews[arg] || setupViews.gym)() : views[page](arg);
  $('main').innerHTML = v.html;
  const bd = document.querySelector('.backdrop'), fold = $('main').querySelector('.fold');
  bd.style.display = fold ? '' : 'none';
  bd.querySelector('img').src = `img/${v.photo}.jpg`;
  if (fold) bd.style.height = `${48 + fold.offsetTop + 40}px`;
  $('cta').innerHTML = v.cta || '';
  dock.hidden = !!v.cta;
  dock.querySelectorAll('.dk:not(.plus)').forEach(b => b.toggleAttribute('aria-current', b.dataset.dock === tabOf[page]));
  dock.querySelector('[aria-current]')?.setAttribute('aria-current', 'page');
  $('plus').innerHTML = session === 'live' ? `${ic.rec}<span>Record</span>` : `${ic.plus}<span>Climb</span>`;
  $('plus').setAttribute('aria-label', session === 'live' ? 'Record a try' : 'Start climbing');
  $('friendsPip').style.display = user === 'regular' && tagPending ? '' : 'none';
}

const toastEl = $('toast');
let tt;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('show'), 2200); }

const sheet = $('sheet'), ask = $('ask'), scrim = $('scrim');
function closeAll() { [sheet, ask, scrim].forEach(x => x.classList.remove('show')); }
// "Sent it?" right after a try is recorded; "Keep climbing?" after a log or a compare
function openAsk(kind, title = '') {
  const r = lastRoute;
  ask.innerHTML = '<div class="grab"></div>' + (kind === 'sent'
    ? `<h2>Try ${r.tries} saved</h2><span class="sub">Clip filed to ${r.color} ${r.grade} · ${r.wall}</span>
      <p class="ask-q">Sent it?</p>
      <div class="two"><button class="b-ghost" type="button" data-act="notyet">Not yet</button><button class="b-lime" type="button" data-act="sent">${ic.check}I topped it</button></div>`
    : `<h2>${title}</h2><span class="sub">${fmt(secs)} so far · ${n(tries, 'try', 'tries')} · ${n(tops, 'top', 'tops')}</span>
      <p class="ask-q">Keep climbing?</p>
      <div class="two"><button class="b-ghost" type="button" data-act="endnow">End session</button><button class="b-lime" type="button" data-act="keep">Pick a route</button></div>`);
  sheet.classList.remove('show');
  ask.classList.add('show'); scrim.classList.add('show');
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
// AI 4 · one tap: the clip is filed to the route and the try number, then "Sent it?"
function record() {
  const r = current();
  tries++; secs += 240; // prototype clock: a try plus rest is about 4 minutes
  if (!r) { render(); toast('Try saved on your phone'); return; }
  r.tries++; tried(r); logOf(r).tries++; lastRoute = r;
  render(); openAsk('sent');
}
function endSession() { session = 'saved'; located = false; go('summary'); }

const actions = {
  // set up
  tag: b => { if (b.dataset.v === '1') { const r = data.new[0]; r.tries = 2; r.highs = [3, 4]; r.you = 5.1; r.senders = 2.2; toast('2 clips added to Orange V2'); } else toast('Declined · your name is off Alex’s post'); go('setup/gym'); },
  sgym: b => { gi = +b.dataset.i; render(); },
  to: b => go(b.dataset.to),
  useloc: () => { $('gLoc').value = 'Current location'; },
  savegym: () => {
    const name = $('gName').value.trim(), loc = $('gLoc').value.trim();
    if (!name || !loc) { toast(name ? 'Add where it is too' : 'Add the gym’s name first'); return; }
    gyms.push({ name, dist: loc, routes: 0, set: '', now: 'New', next: '· no check-ins yet', crowd: Array(16).fill(.06) });
    gi = gyms.length - 1; go('setup/import'); toast(`${name} added`);
  },
  imp: () => { setup.imported = true; go('setup/sorted'); },
  lvl: b => { setup.level = +b.dataset.i; setup.height = $('hIn').value; setup.span = $('sIn').value; render(); },
  lvlnext: () => { setup.height = $('hIn').value; setup.span = $('sIn').value; go('setup/public'); },
  demo: () => { demoHidden = !demoHidden; render(); },
  done: () => {
    const lv = levels[setup.level];
    data.new.forEach(r => { r.g = lv.hi; r.grade = 'V' + lv.hi; });
    go('home'); toast(`${gyms[gi].name} · ${list().length} routes picked for ${lv.g}`);
  },
  // today
  grade: () => toast('V0 is the easiest, V10 the hardest. Most people start at V0–V2.'),
  guide: () => toast('Guide · grades, tape colours, gym etiquette'),
  locate: () => { located = true; const r = current(); toast(`Camera on · ${r.color} ${r.grade} lit up, other routes dimmed`); render(); },
  start: () => { start(); render(); toast('Climbing at ' + gyms[gi].name); },
  pick: b => { const i = +b.dataset.i; if (list()[i].topped) return; sel[user] = i; located = false; render(); },
  friends: () => go('friends'),
  crowd: () => toast(`${gyms[gi].name} · usual crowd by hour, from check-ins over 4 weeks`),
  end: () => endSession(),
  videos: () => go(`route/${list().indexOf(current())}`),
  detail: () => go(`route/${list().indexOf(current())}`),
  compare: () => { lastRoute = page === 'route' ? list()[+arg] || current() : current(); go('compare'); },
  more: () => go('walls'),
  me: () => toast(user === 'new' ? 'Your public profile · no climbs yet' : 'Your public profile · 24 sends'),
  bell: () => user === 'regular' && tagPending ? go('friends') : toast('No new notifications'),
  gym: () => { gi = (gi + 1) % gyms.length; render(); },
  // walls, scan, route
  route: b => go(`route/${b.dataset.i}`),
  proj: b => { const r = list()[+b.dataset.i]; r.proj = !r.proj; render(); toast(r.proj ? `${r.color} ${r.grade} added to projects` : `${r.color} ${r.grade} removed from projects`); },
  rescan: () => toast('Hold still · reading the wall again'),
  addscan: () => {
    if (!list().includes(scanned)) { scanned.proj = true; list().push(scanned); toast('Purple added to projects'); }
    go(`route/${list().indexOf(scanned)}`);
  },
  climb: b => { sel[user] = +b.dataset.i; located = true; if (session !== 'live') { start(); toast('Climbing at ' + gyms[gi].name); } go('home'); },
  play: b => toast(`Playing ${b.dataset.who}’s send · ${b.dataset.len}`),
  // session
  notyet: () => { closeAll(); go('compare'); },
  sent: () => openSheet(),
  keep: () => { closeAll(); go('walls'); },
  endnow: () => { closeAll(); endSession(); },
  fr: b => { frame = Math.min(210, Math.max(1, frame + +b.dataset.d)); render(); },
  again: () => { go('home'); toast('Rest a minute, then tap Record as you start'); },
  notnow: () => { const r = lastRoute || current(); openAsk('keep', `${r.color} ${r.grade} saved for next time`); },
  hide: b => { const e = [...today.values()][+b.dataset.i]; e.hidden = !e.hidden; render(); },
  post: () => {
    const k = [...today.values()].filter(e => e.sent && !e.hidden).length, h = [...today.values()].filter(e => e.hidden).length;
    if (k && !posted) toast(`${n(k, 'send', 'sends')} posted${h ? ` · ${h} hidden` : ''}`);
    posted = true; go('progress');
  },
  // progress, friends
  export: () => toast(user === 'regular' ? 'chalk-log.csv · 142 tries, 24 sends, every clip link' : `chalk-log.csv · ${n(tries, 'try', 'tries')} so far`),
  ftag: b => { tagPending = false; render(); toast(b.dataset.v === '1' ? '2 clips added to Yellow V3' : 'Declined · your name is off Alex’s post'); },
  invite: () => toast('Invite link copied'),
  join: () => { joined = !joined; render(); toast(joined ? 'You’re going · friends can see it' : 'Removed'); },
  cm: b => {
    const i = +b.dataset.i, inp = $('main').querySelector(`[data-cm="${i}"]`), t = inp.value.trim();
    if (!t) return;
    const mineN = posted ? [...today.values()].filter(e => e.sent && !e.hidden).length : 0;
    const p = i < mineN ? [...today.entries()].filter(([, e]) => e.sent && !e.hidden)[i][0].cm : feeds[user][i - mineN].comments;
    p.push(['You', t.replace(/</g, '&lt;')]); render();
  },
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
  if (k === 'plus') { if (session === 'live') record(); else { start(); go('home'); toast('Climbing at ' + gyms[gi].name); } return; }
  go(k);
});
setInterval(() => { if (session === 'live') { secs += 60; if (page === 'home') render(); } }, 60000);

scrim.addEventListener('click', closeAll);
$('feltOpts').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $('feltOpts').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
});
$('filmOpts').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $('filmOpts').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
});
$('saveTop').addEventListener('click', () => {
  const r = lastRoute;
  const film = $('filmOpts').querySelector('[aria-pressed="true"]').textContent;
  const firstEver = user === 'new' && !list().some(x => x.topped);
  tops++;
  r.topped = true; r.highs[r.highs.length - 1] = r.moves; logOf(r).sent = true;
  if (user === 'regular') hardest.regular = Math.max(hardest.regular, r.g);
  located = false;
  render();
  openAsk('keep', `${firstEver ? 'Your first send! ' : ''}${r.color} ${r.grade} logged${film === 'No one' ? '' : film === 'Send a link' ? ' · link ready to send' : ` · clip sent to ${film}`}`);
  $('feltOpts').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false'));
  $('noteIn').value = '';
});

window.addEventListener('hashchange', () => { readHash(); closeAll(); render(); document.querySelector('.screen').scrollTop = 0; });
// frost the status bar once content scrolls under it
const scr = document.querySelector('.screen');
scr.addEventListener('scroll', () => document.querySelector('.phone').classList.toggle('scrolled', scr.scrollTop > 8), { passive: true });
// First open: a new climber starts at set up (?from=tag = opened from a buddy's tag); ?view=regular opens Today.
if (!location.hash) history.replaceState(null, '', '#/' + (user === 'regular' ? 'home' : params.get('from') === 'tag' ? 'setup/tag' : 'setup/gym'));
readHash();
render();

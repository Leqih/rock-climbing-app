// HD recorder for the Spotter prototype: the app in the white iPhone 16 frame, sharp, on a transparent background.
//
// Why it works the way it does: Chrome can only capture a visible window at the screen's own density (1.5x on a
// 2560 x 1600 laptop), and capturing while you use it makes the app stutter. So:
//   1. you use the app in a normal Chrome window; nothing is captured, only your taps, drags, scrolls and keys are noted
//   2. when you close it, a hidden Chrome replays them at the same times, rendered at 3x, and that is what's recorded
//   3. the frames become a transparent WebM (VP9 with alpha), cut to the phone's exact outline
// The replay starts from a copy of the app's saved data taken before you began, so it sees what you saw.
//   node tools/hd-record/record.js [#/page] [--scale 3] [--mov] [--out file.webm] [--secs N --demo]
//   --plain: just the phone screen, 402 x 874 (the "Record at phone size" page), no frame, as an .mp4. Nothing from your
//   computer is in it: no mouse arrow (a Mac's own screen recording always draws one), only the grey tap circle
const { chromium } = require('playwright-core');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');

const argv = process.argv.slice(2), opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : null; };
const flag = k => { const i = argv.indexOf(k); return i >= 0 ? !!argv.splice(i, 1) : false; };
const secs = Number(opt('--secs')) || 0;            // stop on its own after N seconds (testing)
const DPR = Number(opt('--scale')) || 3;
const mov = flag('--mov'), demo = flag('--demo'), plain = flag('--plain');
// --again: film your last take again (kept in tools/hd-record/last-take) without using the app again
const again = flag('--again');
// the replay runs this many times slower than you did it: the page's clock, its animations, its videos and your taps all
// slowed alike, so a hidden Chrome that can only send 12 to 20 pictures a second at 3x still gets 60 of each second of
// the app (it sent ~12 at full speed: everything that moved stuttered). 4 keeps the slowest video speed (0.25x) at
// Chrome's slowest it plays, 0.0625x
const SLOW = Math.max(1, Number(opt('--slow')) || 4);   // --mov: also a ProRes 4444 .mov (big). --demo: moves and scrolls by itself (testing)
const stamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
const out = path.resolve(opt('--out') || path.join(os.homedir(), 'Downloads', `spotter-${stamp}.${plain ? 'mp4' : 'webm'}`));
const page0 = argv[0] && argv[0].startsWith('#') ? argv[0] : '#/videos';
const URL = plain ? `http://localhost:8000/?rec=1&bg=0&dot=1${page0}` : `http://localhost:8000/?cap=1&bg=none&rec=0&dot=1${page0}`;
const W = plain ? 402 : 442, H = plain ? 874 : 908, FPS = 60;                   // the framed phone is 436 x 902 CSS px; a few px spare round it, and 442 keeps the page out of its <=440px phone layout
const PROFILE = path.join(__dirname, 'profile');
// Windows or a Mac (tools/record-phone.command): the Mac's own screen recording can't be sharper than the screen it films, a
// laptop screen gives the phone ~900 of its 2622 rows; this renders all of them, whatever the screen
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome')].find(f => fs.existsSync(f));
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const sleep = ms => new Promise(r => setTimeout(r, Math.max(0, ms)));
const ff = (args, label) => new Promise((ok, no) => { const p = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
  p.on('close', c => c ? no(new Error(`${label}: ffmpeg stopped with code ${c}`)) : ok()); });
const skip = src => /^(Cache|Code Cache|GPUCache|ShaderCache|GrShaderCache|GraphiteDawnCache|DawnCache|DawnGraphiteCache|Crashpad|Singleton.*|.*\.lock|lockfile)$/i.test(path.basename(src));

// in the replay's page, before the app's own code: its clock runs K times slower. Timers wait K times longer, the time read
// by animation frames, Date and events goes K times slower, and videos play K times slower while saying the speed the app
// set. (CSS animations are slowed from outside, through DevTools' Animation speed)
const slowWorld = K => {
  const pn = performance.now.bind(performance), T0 = pn(), D0 = Date.now(), now = () => T0 + (pn() - T0) / K;
  performance.now = now;
  const RD = Date, dnow = () => D0 + (pn() - T0) / K;
  class SD extends RD { constructor(...a) { if (a.length) super(...a); else super(dnow()); } static now() { return dnow(); } }
  window.Date = SD;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => raf(() => cb(now()));
  const st = window.setTimeout.bind(window), si = window.setInterval.bind(window);
  window.setTimeout = (f, d, ...a) => st(f, (+d || 0) * K, ...a);
  window.setInterval = (f, d, ...a) => si(f, (+d || 0) * K, ...a);
  const ts = Object.getOwnPropertyDescriptor(Event.prototype, 'timeStamp').get;
  Object.defineProperty(Event.prototype, 'timeStamp', { configurable: true, get() { return T0 + (ts.call(this) - T0) / K; } });
  const M = HTMLMediaElement.prototype, pr = Object.getOwnPropertyDescriptor(M, 'playbackRate'), dr = Object.getOwnPropertyDescriptor(M, 'defaultPlaybackRate');
  const real = v => Math.max(.0625, Math.min(16, v / K));
  Object.defineProperty(M, 'playbackRate', { configurable: true, get() { return pr.get.call(this) * K; }, set(v) { pr.set.call(this, real(v)); } });
  Object.defineProperty(M, 'defaultPlaybackRate', { configurable: true, get() { return dr.get.call(this) * K; }, set(v) { dr.set.call(this, real(v)); } });
  const fix = e => { const m = e.target; if (m instanceof HTMLMediaElement && !m.__slow) { m.__slow = 1; dr.set.call(m, 1 / K); pr.set.call(m, 1 / K); } };
  ['loadstart', 'play', 'playing'].forEach(n => addEventListener(n, fix, true));
};

(async () => {
  if (!CHROME) throw new Error('Google Chrome not found. Install it, or set CHROME to its path.');
  try { execFileSync(FFMPEG, ['-version'], { stdio: 'ignore' }); } catch { throw new Error(`ffmpeg not found. Install it (${process.platform === 'darwin' ? 'brew install ffmpeg' : 'winget install Gyan.FFmpeg'}) or set FFMPEG to its path.`); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spotter-rec-')), snap = path.join(tmp, 'profile'), TAKE = path.join(__dirname, 'last-take');
  let events = [], t0 = 0, took = 0, url = URL;
  if (again) {
    if (!fs.existsSync(path.join(TAKE, 'take.json'))) throw new Error('No take kept yet: record one first.');
    ({ events, t0, took, url } = JSON.parse(fs.readFileSync(path.join(TAKE, 'take.json'), 'utf8')));
    console.log(`Filming your last take again: ${took.toFixed(1)} s, ${events.length} inputs.`);
  } else {
  // the app's saved data as it was before you began, kept with the take: the replay starts from it, every time
  fs.mkdirSync(PROFILE, { recursive: true });
  fs.rmSync(TAKE, { recursive: true, force: true });
  fs.cpSync(PROFILE, path.join(TAKE, 'profile'), { recursive: true, filter: src => !skip(src) });

  // 1. you, in a normal window: note every input with the wall clock
  const live = await chromium.launchPersistentContext(PROFILE, { executablePath: CHROME, headless: false, viewport: { width: W, height: H },
    args: [`--window-size=${W + 16},${H + 88}`, '--hide-crash-restore-bubble'] });
  await live.exposeBinding('__spotterRec', (_, e) => { events.push(e); });
  await live.addInitScript(() => {
    const send = e => { try { window.__spotterRec(e); } catch {} }, T = () => Date.now(), o = { capture: true, passive: true };
    addEventListener('pointerdown', e => e.button === 0 && send({ t: T(), k: 'd', x: e.clientX, y: e.clientY }), o);
    addEventListener('pointermove', e => send({ t: T(), k: 'm', x: e.clientX, y: e.clientY }), o);
    addEventListener('pointerup', e => e.button === 0 && send({ t: T(), k: 'u', x: e.clientX, y: e.clientY }), o);
    addEventListener('wheel', e => send({ t: T(), k: 'w', x: e.clientX, y: e.clientY, dx: e.deltaX, dy: e.deltaY }), o);
    addEventListener('keydown', e => send({ t: T(), k: 'kd', key: e.key }), o);
    addEventListener('keyup', e => send({ t: T(), k: 'ku', key: e.key }), o);
  });
  const page = live.pages()[0] || await live.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(2500);
  t0 = Date.now();
  console.log(`\n● Ready. Use the app in the Chrome window; it runs at full speed, nothing is filmed yet.\n  Close the window (or press Ctrl+C here) when you're done.\n`);
  const shown = setInterval(() => process.stdout.write(`\r  ${((Date.now() - t0) / 1000).toFixed(0)} s `), 1000);
  if (demo) (async () => { const s = Date.now(); let wheeled = false; while (Date.now() - s < (secs - 1) * 1000) { const k = (Date.now() - s) / 1000; await page.mouse.move(218 + 150 * Math.sin(k * 2), 450 + 300 * Math.cos(k * 1.3)).catch(() => {}); if (k > 2 && !wheeled) { wheeled = true; await page.mouse.wheel(0, 300).catch(() => {}); } await sleep(16); } })();
  // what ended the take, said out loud: a take that ended before you meant it to should say why
  let why = '';
  await new Promise(done => { let over = false; const end = w => () => { if (!over) { over = true; why = w; done(); } };
    page.on('close', end('the Chrome window was closed')); page.on('crash', end('Chrome stopped working (crashed)'));
    live.on('close', end('Chrome was closed')); process.once('SIGINT', end('Ctrl+C was pressed here')); if (secs) setTimeout(end(`the ${secs} s were up`), secs * 1000); });
  const t1 = Date.now(); clearInterval(shown);
  await live.close().catch(() => {});
  took = (t1 - t0) / 1000;
  fs.writeFileSync(path.join(TAKE, 'take.json'), JSON.stringify({ events, t0, took, url }));
  console.log(`\n\nGot it: ${took.toFixed(1)} s, ${events.length} inputs. It ended because ${why}. (There's no time limit: a take runs until you close the window.)`);
  }
  fs.cpSync(path.join(TAKE, 'profile'), snap, { recursive: true });
  const mins = took * SLOW / 60;
  console.log(`Filming it again at ${DPR}x, ${SLOW} times slower so every move is smooth: about ${mins < 1.5 ? `${Math.ceil(took * SLOW)} s` : `${Math.ceil(mins)} minutes`}. Leave this window open.`);

  // 2. the same, replayed in a hidden Chrome whose screen really is 3x
  const hd = await chromium.launchPersistentContext(snap, { executablePath: CHROME, headless: true, viewport: { width: W, height: H }, deviceScaleFactor: DPR,
    args: [`--force-device-scale-factor=${DPR}`, '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--autoplay-policy=no-user-gesture-required'] });
  await hd.addInitScript(slowWorld, SLOW);
  const hp = hd.pages()[0] || await hd.newPage();
  const cdp = await hd.newCDPSession(hp), slowCss = () => cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / SLOW }).catch(() => {});
  await cdp.send('Animation.enable').catch(() => {}); await slowCss();
  await hp.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await slowCss();
  await sleep(2500 * SLOW);
  const box = plain ? { x: 0, y: 0, width: W, height: H } : await hp.evaluate(() => { const r = document.querySelector('.device').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  if (!plain) await hp.screenshot({ path: path.join(tmp, 'outline.png'), omitBackground: true, clip: box });   // its alpha is the phone's outline
  const frames = [];
  cdp.on('Page.screencastFrame', f => {
    const file = path.join(tmp, `f${String(frames.length).padStart(6, '0')}.jpg`);
    fs.writeFile(file, Buffer.from(f.data, 'base64'), () => {});
    frames.push({ file, t: f.metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: Math.round(W * DPR), maxHeight: Math.round(H * DPR), everyNthFrame: 1 });
  const r0 = Date.now(), m = hp.mouse, kb = hp.keyboard;
  // the pointer between two of your moves (a mouse reports every 8 to 30 ms): filled in every 1/60 s, so the circle glides
  let last = null;
  const at = e => r0 + Math.max(0, e.t - t0) * SLOW;
  for (const e of events) {
    if (last && 'x' in e && e.t - last.t > 1000 / FPS && e.t - last.t < 250) {
      for (let s = last.t + 1000 / FPS; s < e.t; s += 1000 / FPS) { const k = (s - last.t) / (e.t - last.t);
        await sleep(at({ t: s }) - Date.now()); await m.move(last.x + (e.x - last.x) * k, last.y + (e.y - last.y) * k).catch(() => {}); }
    }
    if ('x' in e) last = e;
    await sleep(at(e) - Date.now());
    try {
      if (e.k === 'm') await m.move(e.x, e.y);
      else if (e.k === 'd') { await m.move(e.x, e.y); await m.down(); }
      else if (e.k === 'u') { await m.move(e.x, e.y); await m.up(); }
      else if (e.k === 'w') { await m.move(e.x, e.y); await m.wheel(e.dx, e.dy); }
      else if (e.k === 'kd') await kb.down(e.key);
      else if (e.k === 'ku') await kb.up(e.key);
    } catch {}
  }
  await sleep(r0 + took * 1000 * SLOW - Date.now());
  await cdp.send('Page.stopScreencast').catch(() => {});
  await hd.close().catch(() => {});
  await sleep(300);                                 // let the last frame files land
  if (!frames.length) { console.error('No frames came out of the replay.'); process.exit(1); }
  console.log(`${frames.length} pictures: ${(frames.length / took).toFixed(0)} for each second of yours.`);

  // 3. frames to video: each frame stays until the next (Chrome sends one only when something changed), cut to the outline
  // the replay's times, sped back up to yours
  const start = frames[0].t, endT = r0 / 1000 + took * SLOW;
  const list = frames.map((f, i) => `file '${f.file.replace(/\\/g, '/')}'\nduration ${(Math.max(.001, (i < frames.length - 1 ? frames[i + 1].t : endT) - f.t) / SLOW).toFixed(5)}`).join('\n') + `\nfile '${frames[frames.length - 1].file.replace(/\\/g, '/')}'\n`;
  fs.writeFileSync(path.join(tmp, 'list.txt'), list);
  const dur = Math.max(1 / FPS, (endT - start) / SLOW);
  const cw = Math.round(box.width * DPR) & ~1, ch = Math.round(box.height * DPR) & ~1, cx = Math.round(box.x * DPR), cy = Math.round(box.y * DPR);
  const graph = `[0:v]fps=${FPS},crop=${cw}:${ch}:${cx}:${cy},format=rgba[v];[1:v]alphaextract,scale=${cw}:${ch}[a];[v][a]alphamerge`;
  const inputs = ['-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-loop', '1', '-i', path.join(tmp, 'outline.png'), '-filter_complex', graph, '-t', dur.toFixed(3)];
  console.log(`Making the video (${dur.toFixed(1)} s, ${cw} x ${ch})…`);
  try {
    if (plain) await ff(['-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-vf', `fps=${FPS},crop=${cw}:${ch}:${cx}:${cy}`, '-t', dur.toFixed(3),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out], 'MP4');
    else {
    await ff([...inputs, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '20', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '3', '-auto-alt-ref', '0', '-an', out], 'WebM');
    if (mov) await ff([...inputs, '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-alpha_bits', '16', '-an', out.replace(/\.webm$/i, '') + '.mov'], 'MOV');
    }
  } catch (e) { console.error('\n' + e.message + `\nThe frames are kept in ${tmp}`); process.exit(1); }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Saved ${out}  (${(fs.statSync(out).size / 1048576).toFixed(1)} MB, ${plain ? 'the phone screen only, no mouse arrow' : 'transparent background'})${mov ? '\n  and the .mov next to it' : ''}`);
  if (!secs) try { spawn('explorer.exe', [`/select,${out}`], { detached: true, stdio: 'ignore' }).unref(); } catch {}
  process.exit(0);
})().catch(e => { console.error('\n' + e.message); process.exit(1); });

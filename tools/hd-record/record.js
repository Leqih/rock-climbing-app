// HD recorder for the Spotter prototype: the app in the white iPhone 16 frame, sharp, on a transparent background.
//
// Why it works the way it does: Chrome can only capture a visible window at the screen's own density (1.5x on a
// 2560 x 1600 laptop), and capturing while you use it makes the app stutter. So:
//   1. you use the app in a normal Chrome window; nothing is captured, only your taps, drags, scrolls and keys are noted
//   2. when you close it, a hidden Chrome replays them at the same times, rendered at 3x, and that is what's recorded
//   3. the frames become a transparent WebM (VP9 with alpha), cut to the phone's exact outline
// The replay starts from a copy of the app's saved data taken before you began, so it sees what you saw.
//   node tools/hd-record/record.js [#/page] [--scale 3] [--mov] [--out file.webm] [--secs N --demo]
const { chromium } = require('playwright-core');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');

const argv = process.argv.slice(2), opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : null; };
const flag = k => { const i = argv.indexOf(k); return i >= 0 ? !!argv.splice(i, 1) : false; };
const secs = Number(opt('--secs')) || 0;            // stop on its own after N seconds (testing)
const DPR = Number(opt('--scale')) || 3;
const mov = flag('--mov'), demo = flag('--demo');   // --mov: also a ProRes 4444 .mov (big). --demo: moves and scrolls by itself (testing)
const stamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
const out = path.resolve(opt('--out') || path.join(os.homedir(), 'Downloads', `spotter-${stamp}.webm`));
const page0 = argv[0] && argv[0].startsWith('#') ? argv[0] : '#/videos';
const URL = `http://localhost:8000/?cap=1&bg=none&rec=0${page0}`;
const W = 442, H = 908, FPS = 30;                   // the framed phone is 436 x 902 CSS px; a few px spare round it, and 442 keeps the page out of its <=440px phone layout
const PROFILE = path.join(__dirname, 'profile');
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(f => fs.existsSync(f));
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const sleep = ms => new Promise(r => setTimeout(r, Math.max(0, ms)));
const ff = (args, label) => new Promise((ok, no) => { const p = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
  p.on('close', c => c ? no(new Error(`${label}: ffmpeg stopped with code ${c}`)) : ok()); });
const skip = src => /^(Cache|Code Cache|GPUCache|ShaderCache|GrShaderCache|GraphiteDawnCache|DawnCache|DawnGraphiteCache|Crashpad|Singleton.*|.*\.lock|lockfile)$/i.test(path.basename(src));

(async () => {
  try { execFileSync(FFMPEG, ['-version'], { stdio: 'ignore' }); } catch { throw new Error('ffmpeg not found. Install it (winget install Gyan.FFmpeg) or set FFMPEG to its path.'); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spotter-rec-')), snap = path.join(tmp, 'profile');
  fs.mkdirSync(PROFILE, { recursive: true });
  fs.cpSync(PROFILE, snap, { recursive: true, filter: src => !skip(src) });

  // 1. you, in a normal window: note every input with the wall clock
  const events = [];
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
  const t0 = Date.now();
  console.log(`\n● Ready. Use the app in the Chrome window; it runs at full speed, nothing is filmed yet.\n  Close the window (or press Ctrl+C here) when you're done.\n`);
  const shown = setInterval(() => process.stdout.write(`\r  ${((Date.now() - t0) / 1000).toFixed(0)} s `), 1000);
  if (demo) (async () => { const s = Date.now(); let wheeled = false; while (Date.now() - s < (secs - 1) * 1000) { const k = (Date.now() - s) / 1000; await page.mouse.move(218 + 150 * Math.sin(k * 2), 450 + 300 * Math.cos(k * 1.3)).catch(() => {}); if (k > 2 && !wheeled) { wheeled = true; await page.mouse.wheel(0, 300).catch(() => {}); } await sleep(16); } })();
  await new Promise(done => { let over = false; const end = () => { if (!over) { over = true; done(); } };
    page.on('close', end); live.on('close', end); process.once('SIGINT', end); if (secs) setTimeout(end, secs * 1000); });
  const t1 = Date.now(); clearInterval(shown);
  await live.close().catch(() => {});
  const took = (t1 - t0) / 1000;
  console.log(`\n\nGot it: ${took.toFixed(1)} s, ${events.length} inputs. Filming it again at ${DPR}x in the background (takes about as long)…`);

  // 2. the same, replayed in a hidden Chrome whose screen really is 3x
  const hd = await chromium.launchPersistentContext(snap, { executablePath: CHROME, headless: true, viewport: { width: W, height: H }, deviceScaleFactor: DPR,
    args: [`--force-device-scale-factor=${DPR}`, '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--autoplay-policy=no-user-gesture-required'] });
  const hp = hd.pages()[0] || await hd.newPage();
  await hp.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(2500);
  const box = await hp.evaluate(() => { const r = document.querySelector('.device').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  await hp.screenshot({ path: path.join(tmp, 'outline.png'), omitBackground: true, clip: box });   // its alpha is the phone's outline
  const cdp = await hd.newCDPSession(hp), frames = [];
  cdp.on('Page.screencastFrame', f => {
    const file = path.join(tmp, `f${String(frames.length).padStart(6, '0')}.jpg`);
    fs.writeFile(file, Buffer.from(f.data, 'base64'), () => {});
    frames.push({ file, t: f.metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: Math.round(W * DPR), maxHeight: Math.round(H * DPR), everyNthFrame: 1 });
  const r0 = Date.now(), m = hp.mouse, kb = hp.keyboard;
  for (const e of events) {
    await sleep(r0 + Math.max(0, e.t - t0) - Date.now());
    try {
      if (e.k === 'm') await m.move(e.x, e.y);
      else if (e.k === 'd') { await m.move(e.x, e.y); await m.down(); }
      else if (e.k === 'u') { await m.move(e.x, e.y); await m.up(); }
      else if (e.k === 'w') { await m.move(e.x, e.y); await m.wheel(e.dx, e.dy); }
      else if (e.k === 'kd') await kb.down(e.key);
      else if (e.k === 'ku') await kb.up(e.key);
    } catch {}
  }
  await sleep(r0 + took * 1000 - Date.now());
  await cdp.send('Page.stopScreencast').catch(() => {});
  await hd.close().catch(() => {});
  await sleep(300);                                 // let the last frame files land
  if (!frames.length) { console.error('No frames came out of the replay.'); process.exit(1); }

  // 3. frames to video: each frame stays until the next (Chrome sends one only when something changed), cut to the outline
  const start = frames[0].t, endT = r0 / 1000 + took;
  const list = frames.map((f, i) => `file '${f.file.replace(/\\/g, '/')}'\nduration ${Math.max(.001, (i < frames.length - 1 ? frames[i + 1].t : endT) - f.t).toFixed(4)}`).join('\n') + `\nfile '${frames[frames.length - 1].file.replace(/\\/g, '/')}'\n`;
  fs.writeFileSync(path.join(tmp, 'list.txt'), list);
  const dur = Math.max(1 / FPS, endT - start);
  const cw = Math.round(box.width * DPR) & ~1, ch = Math.round(box.height * DPR) & ~1, cx = Math.round(box.x * DPR), cy = Math.round(box.y * DPR);
  const graph = `[0:v]fps=${FPS},crop=${cw}:${ch}:${cx}:${cy},format=rgba[v];[1:v]alphaextract,scale=${cw}:${ch}[a];[v][a]alphamerge`;
  const inputs = ['-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-loop', '1', '-i', path.join(tmp, 'outline.png'), '-filter_complex', graph, '-t', dur.toFixed(3)];
  console.log(`Making the video (${dur.toFixed(1)} s, ${cw} x ${ch})…`);
  try {
    await ff([...inputs, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '20', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '3', '-auto-alt-ref', '0', '-an', out], 'WebM');
    if (mov) await ff([...inputs, '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-alpha_bits', '16', '-an', out.replace(/\.webm$/i, '') + '.mov'], 'MOV');
  } catch (e) { console.error('\n' + e.message + `\nThe frames are kept in ${tmp}`); process.exit(1); }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Saved ${out}  (${(fs.statSync(out).size / 1048576).toFixed(1)} MB, transparent background)${mov ? '\n  and the .mov next to it' : ''}`);
  if (!secs) try { spawn('explorer.exe', [`/select,${out}`], { detached: true, stdio: 'ignore' }).unref(); } catch {}
  process.exit(0);
})().catch(e => { console.error('\n' + e.message); process.exit(1); });

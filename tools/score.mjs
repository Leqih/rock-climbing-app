// Score Spotter's moves against marks made by hand in label.html.
//   node tools/score.mjs            every file in labels/, against the scans in video/
//   node tools/score.mjs --tol 0.5  count a match only within 0.5 s (default 1)
// A labels file is what label.html exports: one object, or a list, of { vid, by, from, to, marks: [{ k, t }] }.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const Score = createRequire(import.meta.url)('../score.js');
const root = fileURLToPath(new URL('..', import.meta.url));
const tolArg = process.argv.indexOf('--tol'), tol = tolArg > 0 ? +process.argv[tolArg + 1] : 1;
const files = existsSync(`${root}labels`) ? readdirSync(`${root}labels`).filter(f => f.endsWith('.json')) : [];
if (!files.length) { console.log('No marks yet: export them from label.html into labels/.'); process.exit(0); }
const p = x => x == null ? '   —' : `${String(Math.round(x * 100)).padStart(3)}%`, s = x => x == null ? '    —' : `${x.toFixed(2)}s`;
const res = [];
for (const f of files) for (const x of [].concat(JSON.parse(readFileSync(`${root}labels/${f}`, 'utf8')))) {
  const tf = `${root}video/${x.vid}.track.json`;
  if (!existsSync(tf)) { console.log(`skip ${x.vid}: no scan in video/`); continue; }
  const T = JSON.parse(readFileSync(tf, 'utf8'));
  const r = Score.score(x.marks, T.moves, { tol, from: x.from ?? -Infinity, to: x.to ?? Infinity });
  res.push(r);
  console.log(`${x.vid.padEnd(22)} ${String(r.by.all.marked).padStart(3)} marks  found ${p(r.by.all.recall)}  right ${p(r.by.all.precision)}  order ${p(r.order)}  pause err ${s(r.pause)}  chance ${p(r.chanceRecall)}  by ${x.by || '?'}`);
}
const t = Score.total(res);
console.log(`\nAll ${t.videos} videos, within ${tol} s`);
for (const k of ['hands', 'feet', 'all']) { const r = t.rows[k]; console.log(`  ${k.padEnd(6)} ${String(r.marked).padStart(4)} marked  found ${p(r.recall)}  right ${p(r.precision)}`); }
console.log(`  order ${p(t.order)}  usual pause error ${s(t.pause)}`);

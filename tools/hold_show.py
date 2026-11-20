"""Show a climber where they were, on a frame of their own video: the holds their hands were on during their
longest pause, the hold they went to next, and the route's hand holds, numbered in climbing order. A person
reads "8th hold of 13" and a circle, never a hold id.

The route comes from The Way Up's own annotation (data/wayup/<participant>/<route>_routeAnnotation.json): a box for
every hold of the route, in pixels of our 720x1280 clips, which the fixed, stabilised camera keeps in place. That is
the app's real case too: a gym, or the first climber, marks a route's holds once. The hands come from our pose scan
(video/<clip>.track.json), snapped to the nearest of the route's hand holds.

    python tools/hold_show.py --video wayup-p1-green        # writes tools/out/hold_demo.jpg
    python tools/hold_show.py --check                       # how often a snapped hand is on the right hold
    python tools/hold_show.py --export                      # video/routes.json, the route holds the app draws

The annotation is in the dataset's dataset.zip on Zenodo (https://doi.org/10.5281/zenodo.15196866, CC BY 4.0). Only
the small files are needed: <p>/<route>_routeAnnotation.json and <p>/<route>_holdUsage.csv, unpacked into
data/wayup/ (git ignores data/). Our p2 clips are the dataset's p2a.
"""
import argparse, csv, glob, json, os, sys

import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VID, OUT, GT = (os.path.join(ROOT, d) for d in ('video', os.path.join('tools', 'out'), os.path.join('data', 'wayup')))
TIP, WRIST = {'lw': 15, 'rw': 16}, {'lw': 5, 'rw': 6}     # positions in a scan's p[] (pose.js IDX)
CLIP = 720, 1280                # our clips and the annotation's pixels (a scan's W and H are the size it ran at)
GAP = 20                                                    # px: how far a fingertip may be from a hold's box
FONT = 'C:/Windows/Fonts/msyhbd.ttc'
LIME, INK, WHITE, ROUTE = (196, 245, 42), (20, 20, 20), (255, 255, 255), (120, 200, 255)
ZH = {'green': '绿线', 'orange': '橙线'}
HAND = {'lw': '左手', 'rw': '右手'}


def folder(vid):
    p, r = vid.split('-')[1:]
    return os.path.join(GT, 'p2a' if p == 'p2' else p), r


def route(vid):
    """The route's hand holds as pixel boxes, bottom of the wall first, with the dataset's hold ids."""
    d, r = folder(vid)
    H = json.load(open(os.path.join(d, f'{r}_routeAnnotation.json')))['holds']
    hands = [(i, (h['topLeftCorner']['x'], h['topLeftCorner']['y'], h['bottomRightCorner']['x'],
                  h['bottomRightCorner']['y'])) for i, h in enumerate(H) if not h['isFoothold']]
    return sorted(hands, key=lambda ib: -(ib[1][1] + ib[1][3]))


def usage(vid, off):
    """The annotated hand holds in use: [(limb, hold id, start s, end s)] on our clip's clock."""
    d, r = folder(vid)
    out = []
    for row in list(csv.reader(open(os.path.join(d, f'{r}_holdUsage.csv'))))[1:]:
        lab = row[0].replace(' ', '')
        if lab[1] != 'h' or not lab[2:].isdigit(): continue
        out.append(({'l': 'lw', 'r': 'rw'}[lab[0]], int(lab[2:]), int(row[1]) / 25 - off, int(row[2]) / 25 - off))
    return out


def offset(vid):
    """Our clips are trimmed: the shift that lines the coach labels up with the annotation's frames."""
    marks = next(c['marks'] for c in json.load(open(os.path.join(ROOT, 'labels', 'wayup-coach.json'))) if c['vid'] == vid)
    U = usage(vid, 0)
    d = [min((u[2] - m['t'] for u in U if u[0] == m['k']), key=abs, default=0) for m in marks if m['k'] in HAND]
    return float(np.median(d)) if d else 0.0


def hand_px(s, k, W, H):
    p = s['p'][TIP[k]] if s['p'][TIP[k]][2] >= 0.3 else s['p'][WRIST[k]]
    return (p[0] * W, p[1] * H) if p[2] >= 0.3 else None


def snap(xy, holds):
    """The route hold under a hand (its index in `holds`), or None."""
    if xy is None: return None
    x, y = xy
    def far(b):
        x0, y0, x1, y1 = b
        return np.hypot(max(x0 - x, 0, x - x1), max(y0 - y, 0, y - y1)), np.hypot((x0 + x1) / 2 - x, (y0 + y1) / 2 - y)
    i = min(range(len(holds)), key=lambda i: far(holds[i][1]))
    return i if far(holds[i][1])[0] <= GAP else None


def landing_sample(T, m):
    """The sample just after a landing where the video sees that hand best (the hand stays on the hold)."""
    near = [s for s in T['S'] if s.get('p') and -0.2 <= s['t'] - m['t'] <= 0.6]
    return max(near, key=lambda s: max(s['p'][TIP[m['k']]][2], s['p'][WRIST[m['k']]][2]), default=None)


def check():
    """For every hand landing in every clip: is the snapped hold the one the annotation says that hand was on?"""
    right = wrong = off = none = 0
    for f in sorted(glob.glob(os.path.join(VID, 'wayup-*.track.json'))):
        vid = os.path.basename(f)[:-11]
        if not os.path.exists(os.path.join(*folder(vid)) + '_routeAnnotation.json'): continue
        T, R, o = json.load(open(f)), route(vid), offset(vid)
        U = usage(vid, o)
        for m in T['moves']:
            if m['k'] not in HAND: continue
            s = landing_sample(T, m)
            i = snap(hand_px(s, m['k'], *CLIP), R) if s else None
            truth = {h for k, h, a, b in U if k == m['k'] and a - 0.3 <= s['t'] <= b + 0.3} if s else set()
            if i is None: none += 1
            elif not truth: off += 1                         # the annotation has that hand on no hand hold then
            elif R[i][0] in truth: right += 1
            else: wrong += 1
    n = right + wrong
    print(f'hand landings snapped to the route: {right} of {n} on the annotated hold ({right / n:.0%}), {wrong} on a '
          f'neighbour; {off} more when the annotation has that hand on no hand hold, {none} too far from any hold')


def export():
    """video/routes.json for the app: every clip's route hand holds, bottom of the wall first, in clip pixels."""
    out = {}
    for f in sorted(glob.glob(os.path.join(VID, 'wayup-*.track.json'))):
        vid = os.path.basename(f)[:-11]
        if os.path.exists(os.path.join(*folder(vid)) + '_routeAnnotation.json'):
            out[vid] = [list(b) for _, b in route(vid)]
    json.dump({'by': 'The Way Up route annotation (Maschek & Schedl, CC BY 4.0): hand holds, bottom first',
               'W': CLIP[0], 'H': CLIP[1], 'routes': out}, open(os.path.join(VID, 'routes.json'), 'w'), separators=(',', ':'))
    print(f'wrote video/routes.json: {len(out)} clips')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--video', default='wayup-p1-green')
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--export', action='store_true', help='write video/routes.json for the app')
    a = ap.parse_args()
    if a.check: return check()
    if a.export: return export()

    T, R = json.load(open(os.path.join(VID, a.video + '.track.json'))), route(a.video)
    W, H = CLIP
    o = offset(a.video)
    U = usage(a.video, o)
    # the longest pause with a hand on the route and not on its last two holds (that is the finish)
    for rest in sorted(T.get('rests') or [], key=lambda r: r['t0'] - r['t1']):
        t = (rest['t0'] + rest['t1']) / 2
        s = min((s for s in T['S'] if s.get('p')), key=lambda s: abs(s['t'] - t))
        on = {k: i for k in HAND if (i := snap(hand_px(s, k, W, H), R)) is not None}
        if on and max(on.values()) < len(R) - 2: break
    else:
        raise SystemExit('no pause with a hand on the route')
    nxt = None
    for m in T['moves']:
        if m['k'] in HAND and rest['t1'] - 0.5 <= m['t'] <= rest['t1'] + 6:
            sm = landing_sample(T, m)
            i = snap(hand_px(sm, m['k'], W, H), R) if sm else None
            if i is not None and i not in on.values(): nxt = (m['k'], i, m['t']); break
    truth = {k: sorted(h for kk, h, a0, b0 in U if kk == k and a0 <= t <= b0) for k in HAND}
    print(f'pause {rest["t0"]}-{rest["t1"]}s; ours: ' + ', '.join(f'{k} on route hold {i + 1} (id {R[i][0]})'
          for k, i in on.items()) + f'; annotation: {truth}; next: {nxt and (nxt[0], nxt[1] + 1, "id", R[nxt[1]][0])}')

    cap = cv2.VideoCapture(os.path.join(VID, a.video + '.mp4'))
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); full = cap.read()[1]; cap.release()
    pic = Image.alpha_composite(Image.fromarray(cv2.cvtColor(full, cv2.COLOR_BGR2RGB)).convert('RGBA'),
                                Image.new('RGBA', (W, H), (0, 0, 0, 70)))
    d = ImageDraw.Draw(pic)
    f_s, f_m, f_l = (ImageFont.truetype(FONT, int(H * k)) for k in (.016, .021, .03))
    taken, rings = [], []
    for i, (_, b) in enumerate(R):                             # the route, faint: rings first, numbers last
        if i in on.values() or (nxt and i == nxt[1]): continue
        rings.append((i, ring(d, b, ROUTE, 3, pad=6)))
    same = len(set(on.values())) == 1 and len(on) == 2
    for k, i in on.items():
        cx, cy, r = ring(d, R[i][1], LIME, 7)
        if not (same and k == 'rw'):
            pill(d, (cx + r + 12, cy), f'{"双手" if same else HAND[k]} · 第 {i + 1} 个点', f_m, anchor='lm', taken=taken)
    if nxt:
        cx, cy, r = ring(d, R[nxt[1]][1], WHITE, 5)
        tag = f'下一步：{HAND[nxt[0]]}抓这里'
        pill(d, (cx + r + 12, cy), tag, f_m, fg=INK, bg=WHITE, anchor='lm', taken=taken) or \
            pill(d, (cx - r - 12, cy), tag, f_m, fg=INK, bg=WHITE, anchor='rm', taken=taken)
    for i, (cx, cy, r) in rings:
        pill(d, (cx, cy - r - 14), str(i + 1), f_s, fg=INK, bg=ROUTE, taken=taken) or \
            pill(d, (cx, cy + r + 14), str(i + 1), f_s, fg=INK, bg=ROUTE, taken=taken)

    rname = ZH.get(a.video.split('-')[-1], a.video.split('-')[-1])
    lines = [(f'你在这里停了 {rest["t1"] - rest["t0"]:.0f} 秒', f_l, LIME),
             (f'{rname}一共 {len(R)} 个手点，你停在第 {max(on.values()) + 1} 个', f_m, WHITE),
             ('蓝圈是这条线的其他手点，数字是顺序', f_s, (190, 190, 190))]
    bar = int(H * .15)
    out = Image.new('RGBA', (W, H + bar), (20, 20, 20, 255)); out.paste(pic, (0, 0))
    d = ImageDraw.Draw(out)
    for (text, font, fill), y in zip(lines, (.28, .58, .82)):
        d.text((int(W * .05), H + int(bar * y)), text, font=font, fill=fill, anchor='lm')
    os.makedirs(OUT, exist_ok=True)
    out.convert('RGB').save(os.path.join(OUT, 'hold_demo.jpg'), quality=90)
    print('wrote tools/out/hold_demo.jpg')


def ring(d, b, colour, width, pad=10):
    x0, y0, x1, y1 = b
    r = max(x1 - x0, y1 - y0) / 2 + pad
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    d.ellipse([cx - r - 2, cy - r - 2, cx + r + 2, cy + r + 2], outline=INK, width=width + 4)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=colour, width=width)
    return cx, cy, r


def pill(d, xy, text, font, fg=WHITE, bg=INK, anchor='mm', taken=None):
    """A label on a rounded tag. With `taken` (the tags drawn so far), a tag that would cover one is left out."""
    l, t, r, b = d.textbbox(xy, text, font=font, anchor=anchor)
    box = (l - 10, t - 6, r + 10, b + 6)
    if taken is not None:
        if any(box[0] < q[2] and q[0] < box[2] and box[1] < q[3] and q[1] < box[3] for q in taken): return False
        taken.append(box)
    d.rounded_rectangle(box, radius=(b - t) / 2 + 6, fill=bg)
    d.text(xy, text, font=font, fill=fg, anchor=anchor)
    return True


if __name__ == '__main__':
    sys.exit(main())

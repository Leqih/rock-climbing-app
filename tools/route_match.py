"""Which route is this video on? Puts every hand landing of a climb on one photo of the wall, then compares climbs by
where their hands went. No hold detector and no colours: the wall itself is the map.

    python -I tools/route_match.py                       # every video/wayup-* clip against each other
    python -I tools/route_match.py --videos a b c        # just these (names under video/, without .mp4)
    python -I tools/route_match.py --ref wayup-p1-green@13.6 --r 0.02

1. The reference is one frame of the wall (or a photo the gym publishes). Its features are read once (SIFT), with
   the climber blanked out so a body is never matched.
2. For each hand landing in a clip's scan (video/<vid>.track.json, `moves` with k = lw / rw), the frame at that
   moment is matched to the reference, a homography is fitted with RANSAC (the wall is flat, so one homography
   is exact up to lens distortion), and the index fingertip is carried onto the reference.
3. Two climbs are on the same route when most of one's landings fall within r of the other's. r is a fraction of
   the reference's height.

Writes tools/out/landings.json (every landing on the reference) and tools/out/route_match.jpg (the landings drawn
on the reference, one colour per labelled route) and prints how well nearest-neighbour guesses the route.
"""
import argparse, glob, json, os, sys
from concurrent.futures import ProcessPoolExecutor

import cv2, numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VID, OUT = os.path.join(ROOT, 'video'), os.path.join(ROOT, 'tools', 'out')
TIP, WRIST = {'lw': 15, 'rw': 16}, {'lw': 5, 'rw': 6}     # positions in a scan's p[] (pose.js IDX)
SCALE = 0.75                                                # frames are read at this size: holds stay sharp, SIFT stays fast
MIN_INLIERS = 25
MIN_CONF, HOLD_S = 0.3, 0.6                                 # a fingertip or wrist the pose model is this sure of, this soon after landing


def frame_at(cap, t):
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ok, img = cap.read()
    return cv2.resize(img, None, fx=SCALE, fy=SCALE, interpolation=cv2.INTER_AREA) if ok else None


def sample_at(T, t):
    S = [s for s in T['S'] if s.get('p')]
    return min(S, key=lambda s: abs(s['t'] - t)) if S else None


def body_mask(shape, s, pad=0.06):
    """Everything but a box round the climber (and the black edges a stabilised video has)."""
    H, W = shape[:2]
    m = np.full((H, W), 255, np.uint8)
    if s:
        pts = np.array([[p[0] * W, p[1] * H] for p in s['p'] if p[2] > 0.2])
        if len(pts):
            (x0, y0), (x1, y1) = pts.min(0), pts.max(0)
            px, py = pad * W, pad * H
            m[max(0, int(y0 - py)):int(y1 + py), max(0, int(x0 - px)):int(x1 + px)] = 0
    return m


def features(img, mask):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mask = mask & (g > 12).astype(np.uint8) * 255
    return cv2.SIFT_create(nfeatures=6000).detectAndCompute(g, mask)


def ref_features(spec):
    vid, t = spec.split('@')
    T = json.load(open(os.path.join(VID, vid + '.track.json')))
    cap = cv2.VideoCapture(os.path.join(VID, vid + '.mp4'))
    img = frame_at(cap, float(t))
    cap.release()
    kp, des = features(img, body_mask(img.shape, sample_at(T, float(t))))
    return img, np.float32([k.pt for k in kp]), des


_REF = None
def _init(spec, conf):
    global _REF, MIN_CONF
    _REF, MIN_CONF = ref_features(spec), conf


def landings(vid):
    """Every hand landing of one clip, carried onto the reference: [{k, t, x, y, inl}], x and y as fractions."""
    img_r, pts_r, des_r = _REF
    Hr, Wr = img_r.shape[:2]
    T = json.load(open(os.path.join(VID, vid + '.track.json')))
    cap = cv2.VideoCapture(os.path.join(VID, vid + '.mp4'))
    flann = cv2.FlannBasedMatcher({'algorithm': 1, 'trees': 5}, {'checks': 64})
    out, missed = [], 0
    for m in T['moves']:
        if m['k'] not in TIP: continue
        # the hand stays on the hold for a while after it lands: take the moment nearby where the video sees it best
        near = [s for s in T['S'] if s.get('p') and -0.2 <= s['t'] - m['t'] <= HOLD_S]
        if not near: missed += 1; continue
        s = max(near, key=lambda s: max(s['p'][TIP[m['k']]][2], s['p'][WRIST[m['k']]][2]))
        tip, wr = s['p'][TIP[m['k']]], s['p'][WRIST[m['k']]]
        p = tip if tip[2] >= MIN_CONF else wr
        if p[2] < MIN_CONF: missed += 1; continue
        img = frame_at(cap, s['t'])
        if img is None: missed += 1; continue
        H, W = img.shape[:2]
        kp, des = features(img, body_mask(img.shape, s))
        if des is None or len(kp) < MIN_INLIERS: missed += 1; continue
        good = [a for a, b in flann.knnMatch(des, des_r, k=2) if a.distance < 0.75 * b.distance]
        if len(good) < MIN_INLIERS: missed += 1; continue
        src = np.float32([kp[a.queryIdx].pt for a in good])
        dst = pts_r[[a.trainIdx for a in good]]
        Hm, inl = cv2.findHomography(src, dst, cv2.RANSAC, 4.0)
        n = int(inl.sum()) if inl is not None else 0
        if Hm is None or n < MIN_INLIERS: missed += 1; continue
        x, y = cv2.perspectiveTransform(np.float32([[[p[0] * W, p[1] * H]]]), Hm)[0, 0]
        if not (0 <= x < Wr and 0 <= y < Hr): missed += 1; continue
        out.append({'k': m['k'], 't': m['t'], 'x': round(float(x / Wr), 4), 'y': round(float(y / Hr), 4), 'inl': n})
    cap.release()
    return vid, out, missed


def overlap(a, b, r, aspect):
    """Share of a's landings that have one of b's within r (distance in reference heights)."""
    if not a or not b: return 0.0
    A = np.array([[p['x'] * aspect, p['y']] for p in a]); B = np.array([[p['x'] * aspect, p['y']] for p in b])
    d = np.sqrt(((A[:, None] - B[None]) ** 2).sum(-1)).min(1)
    return float((d <= r).mean())


def route_of(vid):
    return vid.rsplit('-', 1)[-1] if vid.startswith('wayup-') else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--videos', nargs='*')
    ap.add_argument('--ref', default='wayup-p1-green@13.6', help='<video>@<seconds>: the frame used as the map of the wall')
    ap.add_argument('--r', type=float, default=0.02, help='match radius, as a fraction of the reference height')
    ap.add_argument('--conf', type=float, default=MIN_CONF, help='least pose confidence for the fingertip or wrist')
    ap.add_argument('--jobs', type=int, default=max(1, (os.cpu_count() or 2) - 2))
    a = ap.parse_args()
    vids = a.videos or sorted(os.path.basename(f)[:-11] for f in glob.glob(os.path.join(VID, 'wayup-*.track.json')))
    os.makedirs(OUT, exist_ok=True)

    with ProcessPoolExecutor(a.jobs, initializer=_init, initargs=(a.ref, a.conf)) as ex:
        res = {v: (pts, miss) for v, pts, miss in ex.map(landings, vids)}
    img_r = ref_features(a.ref)[0]
    Hr, Wr = img_r.shape[:2]
    aspect = Wr / Hr

    json.dump({'ref': a.ref, 'W': Wr, 'H': Hr, 'videos': {v: p for v, (p, _) in res.items()}},
              open(os.path.join(OUT, 'landings.json'), 'w'), separators=(',', ':'))
    print(f'reference {a.ref}  ({Wr}x{Hr}), r = {a.r} of its height\n')
    print(f'{"video":22} {"placed":>7} {"missed":>7}')
    for v, (p, miss) in res.items(): print(f'{v:22} {len(p):7d} {miss:7d}')

    # nearest neighbour, leaving the clip itself out: the route of the most-overlapping other clip
    sim = {(x, y): (overlap(res[x][0], res[y][0], a.r, aspect) + overlap(res[y][0], res[x][0], a.r, aspect)) / 2
           for x in vids for y in vids if x != y}
    right = total = 0
    print(f'\n{"video":22} {"nearest":22} {"overlap":>7}  same route   best same / best other')
    for x in vids:
        if not res[x][0]: continue
        y = max((y for y in vids if y != x), key=lambda y: sim[x, y])
        same = [sim[x, z] for z in vids if z != x and route_of(z) == route_of(x)]
        other = [sim[x, z] for z in vids if z != x and route_of(z) != route_of(x)]
        ok = route_of(y) == route_of(x)
        right += ok; total += 1
        print(f'{x:22} {y:22} {sim[x, y]:7.2f}  {"yes" if ok else "NO ":10}   {max(same, default=0):.2f} / {max(other, default=0):.2f}')
    if total: print(f'\nnearest clip on the same route: {right}/{total}')
    gs = [sim[x, y] for x in vids for y in vids if x < y and route_of(x) == route_of(y)]
    gd = [sim[x, y] for x in vids for y in vids if x < y and route_of(x) != route_of(y)]
    if gs and gd: print(f'mean overlap, same route {np.mean(gs):.2f}, different routes {np.mean(gd):.2f}')

    col = {'green': (60, 200, 60), 'orange': (0, 140, 255)}
    pic = img_r.copy()
    for v, (p, _) in res.items():
        for q in p: cv2.circle(pic, (int(q['x'] * Wr), int(q['y'] * Hr)), 4, col.get(route_of(v), (255, 0, 255)), -1)
    cv2.imwrite(os.path.join(OUT, 'route_match.jpg'), pic)
    print(f'\nwrote {os.path.relpath(os.path.join(OUT, "route_match.jpg"), ROOT)} and landings.json')


if __name__ == '__main__':
    sys.exit(main())

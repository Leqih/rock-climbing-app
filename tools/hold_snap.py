"""Snap every hand landing to a hold, so a climb becomes a list of hold numbers. Runs after route_match.py.

    python tools/route_match.py                                   # first: puts the landings on the reference frame
    python tools/hold_snap.py --model runs/detect/holds/weights/best.pt

1. A map of the holds. The detector (holds_train.py) runs on frames spread through the reference clip, and each
   frame's boxes are carried onto the reference with the same SIFT + homography as route_match.py. The climber is
   in the way of some holds in any one frame, so boxes from all frames are merged, and a hold is kept when at least
   --votes frames found it. That also drops people walking past, who never stay in one place.
2. Each landing (the index fingertip, from tools/out/landings.json) goes to the hold whose box it is in, or the
   nearest box within --gap (a fraction of the reference height). A landing with no hold that close stays unsnapped.
3. Two climbs are compared by the holds they used: the share of one's holds that the other also used, both ways.
   This is stricter than route_match.py's radius: a fingertip placed one hold over counts as a different hold.
4. Each hold gets a colour name (the median hue of its saturated pixels, in the reference frame), and a climb's
   route is guessed from the colour most of its landings were on. This needs no other climb of the same route.

Writes tools/out/holds_map.json (the holds, numbered top to bottom, and each climb as a list of hold numbers) and
tools/out/holds_map.jpg (the numbered holds, and the ones each route used), and prints how well nearest-neighbour
guesses the route next to the old radius score.
"""
import argparse, json, os, sys

import cv2, numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from route_match import (OUT, VID, MIN_INLIERS, frame_at, sample_at, body_mask, features, ref_features, overlap,
                         route_of)


def boxes_on_ref(model, ref, vid, step, conf):
    """Detector boxes from frames of `vid`, as [x0, y0, x1, y1, conf] fractions of the reference frame."""
    img_r, pts_r, des_r = ref
    Hr, Wr = img_r.shape[:2]
    T = json.load(open(os.path.join(VID, vid + '.track.json')))
    cap = cv2.VideoCapture(os.path.join(VID, vid + '.mp4'))
    dur = cap.get(cv2.CAP_PROP_FRAME_COUNT) / (cap.get(cv2.CAP_PROP_FPS) or 30)
    flann = cv2.FlannBasedMatcher({'algorithm': 1, 'trees': 5}, {'checks': 64})
    frames = []
    for t in np.arange(0.5, dur, step):
        img = frame_at(cap, float(t))
        if img is None: continue
        H, W = img.shape[:2]
        s = sample_at(T, float(t))
        kp, des = features(img, body_mask(img.shape, s))
        if des is None or len(kp) < MIN_INLIERS: continue
        good = [a for a, b in flann.knnMatch(des, des_r, k=2) if a.distance < 0.75 * b.distance]
        if len(good) < MIN_INLIERS: continue
        Hm, inl = cv2.findHomography(np.float32([kp[a.queryIdx].pt for a in good]),
                                     pts_r[[a.trainIdx for a in good]], cv2.RANSAC, 4.0)
        if Hm is None or int(inl.sum()) < MIN_INLIERS: continue
        body = body_mask(img.shape, s, pad=0.02) == 0          # boxes on the climber are hands, shoes, chalk bags
        out, r = [], model(img, imgsz=1024, conf=conf, verbose=False)[0]
        for (x0, y0, x1, y1), c in zip(r.boxes.xyxy.tolist(), r.boxes.conf.tolist()):
            if body[int((y0 + y1) / 2), int((x0 + x1) / 2)]: continue
            q = cv2.perspectiveTransform(np.float32([[[x0, y0], [x1, y0], [x1, y1], [x0, y1]]]), Hm)[0]
            out.append([q[:, 0].min() / Wr, q[:, 1].min() / Hr, q[:, 0].max() / Wr, q[:, 1].max() / Hr, c])
        frames.append(out)
    cap.release()
    return frames


def iou(R, b):
    """Overlap of box b with each row of R (boxes as x0, y0, x1, y1)."""
    w = np.clip(np.minimum(R[:, 2], b[2]) - np.maximum(R[:, 0], b[0]), 0, None)
    h = np.clip(np.minimum(R[:, 3], b[3]) - np.maximum(R[:, 1], b[1]), 0, None)
    i = w * h
    return i / ((R[:, 2] - R[:, 0]) * (R[:, 3] - R[:, 1]) + (b[2] - b[0]) * (b[3] - b[1]) - i)


def merge(frames, votes):
    """One box per hold: boxes from different frames that overlap are the same hold; keep those seen `votes` times."""
    groups, rep = [], np.zeros((0, 4))                        # the boxes of each hold, and its running mean box
    for f in frames:
        for b in sorted(f, key=lambda b: -b[4]):
            o = iou(rep, b) if len(rep) else np.zeros(0)
            j = int(o.argmax()) if len(o) else -1
            if j >= 0 and o[j] > 0.3:
                groups[j].append(b); rep[j] = np.mean(groups[j], 0)[:4]
            else:
                groups.append([b]); rep = np.vstack([rep, b[:4]])
    holds = [np.median(g, 0).tolist()[:4] + [len(g)] for g in groups if len(g) >= votes]
    holds.sort(key=lambda h: (round((h[1] + h[3]) / 2 * 40), (h[0] + h[2]) / 2))   # rows top to bottom, then left to right
    return holds


def snap(p, holds, gap, aspect):
    """The number of the hold a landing is on (1-based), or None. Distances in reference heights."""
    def far(h):                       # distance to the box (0 inside it), then to its centre for boxes that overlap
        x0, y0, x1, y1, _ = h
        edge = np.hypot(max(x0 - p['x'], 0, p['x'] - x1) * aspect, max(y0 - p['y'], 0, p['y'] - y1))
        return edge, np.hypot(((x0 + x1) / 2 - p['x']) * aspect, (y0 + y1) / 2 - p['y'])
    if not holds: return None
    i = min(range(len(holds)), key=lambda i: far(holds[i]))
    return i + 1 if far(holds[i])[0] <= gap else None


HUES = [('red', 0, 7), ('orange', 8, 20), ('yellow', 21, 34), ('green', 35, 85), ('blue', 86, 130),
        ('purple', 131, 169), ('red', 170, 180)]                # OpenCV hue, 0-180


def colour(hsv, box):
    """The colour name of a hold: the median hue of its coloured pixels. 'grey' for black, white and grey holds."""
    H, W = hsv.shape[:2]
    x0, y0, x1, y1 = box
    c = hsv[int(y0 * H):int(y1 * H) + 1, int(x0 * W):int(x1 * W) + 1].reshape(-1, 3)
    c = c[(c[:, 1] > 90) & (c[:, 2] > 60)]                    # the beige wall and shadows are pale or dark
    if len(c) < 12: return 'grey'
    h = np.median(c[:, 0])
    return next(n for n, a, b in HUES if a <= h <= b)


def colour_share(hsv, box, name):
    """The share of a hold's box in one colour. Dark holds count: this wall's green holds are barely more saturated
    than the wall itself, but the wall is orange-beige (hue ~17), so a green or blue hue is enough with little
    saturation. Warm colours are near the wall's hue and need more."""
    H, W = hsv.shape[:2]
    x0, y0, x1, y1 = box
    c = hsv[max(0, int(y0 * H)):max(0, int(y1 * H)) + 1, max(0, int(x0 * W)):max(0, int(x1 * W)) + 1].reshape(-1, 3)
    if not len(c): return 0.0
    h, s, v = c[:, 0].astype(int), c[:, 1].astype(int), c[:, 2].astype(int)
    hue = np.zeros(len(c), bool)
    for n, a, b in HUES:
        if n == name: hue |= (h >= a) & (h <= b)
    sat = 45 if name in ('green', 'blue', 'purple') else 90
    return float((hue & (s > sat) & (v > 35)).mean())


def route_holds_by_colour(hsv, holds, climbs, colour, aspect, near=0.04, min_climbs=2, min_share=0.25):
    """A route's holds: holds of its colour within `near` (reference heights) of the hands of `min_climbs` climbs.
    The colour says which holds belong to the route; the hands only say which part of the wall it is on."""
    out = []
    for i, h in enumerate(holds):
        if colour_share(hsv, h[:4], colour) < min_share: continue
        cx, cy = (h[0] + h[2]) / 2, (h[1] + h[3]) / 2
        n = sum(any(np.hypot((p['x'] - cx) * aspect, p['y'] - cy) <= near for p in c) for c in climbs)
        if n >= min_climbs: out.append(i + 1)
    return out


def share(a, b):
    """Share of the holds in a that b also used."""
    return len(a & b) / len(a) if a else 0.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', default=os.path.join('runs', 'detect', 'holds', 'weights', 'best.pt'))
    ap.add_argument('--clips', nargs='*', help='clips whose frames make the hold map (default: the reference clip)')
    ap.add_argument('--step', type=float, default=4.0, help='seconds between the frames used for the map')
    ap.add_argument('--conf', type=float, default=0.3)
    ap.add_argument('--votes', type=int, default=3, help='frames that must find a hold for it to go on the map')
    ap.add_argument('--gap', type=float, default=0.012, help='how far a fingertip may be from a box and still snap')
    ap.add_argument('--r', type=float, default=0.02, help='the radius route_match.py uses, for the comparison')
    a = ap.parse_args()

    from ultralytics import YOLO
    L = json.load(open(os.path.join(OUT, 'landings.json')))
    ref = ref_features(L['ref'])
    img_r = ref[0]; Hr, Wr = img_r.shape[:2]; aspect = Wr / Hr

    model = YOLO(a.model)
    frames = []
    for c in a.clips or [L['ref'].split('@')[0]]:
        f = boxes_on_ref(model, ref, c, a.step, a.conf)
        print(f'{c}: {len(f)} frames on the map'); frames += f
    holds = merge(frames, a.votes)
    print(f'{len(holds)} holds seen in at least {a.votes} frames\n')

    vids = list(L['videos'])
    seq, used, lost = {}, {}, {}
    for v in vids:
        n = [snap(p, holds, a.gap, aspect) for p in L['videos'][v]]
        seq[v] = [{'k': p['k'], 't': p['t'], 'x': p['x'], 'y': p['y'], 'hold': h} for p, h in zip(L['videos'][v], n)]
        used[v] = {h for h in n if h}; lost[v] = sum(h is None for h in n)
    allp = sum(len(L['videos'][v]) for v in vids)
    print(f'{allp - sum(lost.values())} of {allp} landings snapped to a hold\n')

    sim_h = {(x, y): (share(used[x], used[y]) + share(used[y], used[x])) / 2 for x in vids for y in vids if x != y}
    P = {v: L['videos'][v] for v in vids}
    sim_r = {(x, y): (overlap(P[x], P[y], a.r, aspect) + overlap(P[y], P[x], a.r, aspect)) / 2
             for x in vids for y in vids if x != y}
    print(f'{"video":22} {"holds":>5} {"lost":>4}  by holds: nearest {"":12} same  | by radius: same')
    score = {'h': 0, 'r': 0}; total = 0
    for x in vids:
        if not used[x]: continue
        yh = max((y for y in vids if y != x), key=lambda y: sim_h[x, y])
        yr = max((y for y in vids if y != x), key=lambda y: sim_r[x, y])
        oh, orr = route_of(yh) == route_of(x), route_of(yr) == route_of(x)
        score['h'] += oh; score['r'] += orr; total += 1
        print(f'{x:22} {len(used[x]):5d} {lost[x]:4d}  {yh:22} {"yes" if oh else "NO ":4}  | {"yes" if orr else "NO"}')
    print(f'\nnearest clip on the same route: by holds {score["h"]}/{total}, by radius {score["r"]}/{total}')
    for name, sim in (('holds', sim_h), ('radius', sim_r)):
        gs = [sim[x, y] for x in vids for y in vids if x < y and route_of(x) == route_of(y)]
        gd = [sim[x, y] for x in vids for y in vids if x < y and route_of(x) != route_of(y)]
        print(f'mean overlap by {name:6}: same route {np.mean(gs):.2f}, different routes {np.mean(gd):.2f}, '
              f'gap {np.mean(gs) - np.mean(gd):.2f}')

    # the colour of the holds a climb landed on names its route, with no other climb of that route to compare to
    vid, t = L['ref'].split('@')
    cap = cv2.VideoCapture(os.path.join(VID, vid + '.mp4')); cap.set(cv2.CAP_PROP_POS_MSEC, float(t) * 1000)
    hsv = cv2.cvtColor(cap.read()[1], cv2.COLOR_BGR2HSV); cap.release()
    hue = [colour(hsv, h[:4]) for h in holds]
    routes = sorted({route_of(v) for v in vids if route_of(v)})
    two = open_ = 0
    print(f'\n{"video":22} {"route":7} {"guess":7} {"any colour":10}  colours of the holds it landed on')
    for v in vids:
        cnt = {}
        for x in seq[v]:
            if x['hold']: cnt[hue[x['hold'] - 1]] = cnt.get(hue[x['hold'] - 1], 0) + 1
        g = max(routes, key=lambda c: cnt.get(c, 0))           # choosing between the routes this wall has
        o = max((c for c in cnt if c != 'grey'), key=lambda c: cnt[c], default='-')   # choosing from every colour
        two += g == route_of(v); open_ += o == route_of(v)
        print(f'{v:22} {route_of(v):7} {g:7} {o:10}  ' + ' '.join(f'{c} {n}' for c, n in sorted(cnt.items(), key=lambda kv: -kv[1])))
    print(f'\nroute from hold colour: {two}/{len(vids)} choosing between {" and ".join(routes)}, '
          f'{open_}/{len(vids)} choosing from every colour')

    # which holds make up each route: the route's colour, along its climbers' hands. (Counting the holds hands
    # snapped to gave neighbouring holds of other colours whenever a fingertip landed a little off.)
    route_holds = {}
    for rt in routes:
        cl = [L['videos'][v] for v in vids if route_of(v) == rt]
        route_holds[rt] = route_holds_by_colour(hsv, holds, cl, rt, aspect)
        print(f'{rt}: {len(route_holds[rt])} {rt} holds along the hands of its {len(cl)} climbs: {route_holds[rt]}')

    json.dump({'ref': L['ref'], 'W': Wr, 'H': Hr,
               'holds': [{'n': i + 1, 'box': [round(c, 4) for c in h[:4]], 'seen': h[4], 'colour': hue[i]}
                         for i, h in enumerate(holds)],
               'routes': route_holds, 'climbs': seq},
              open(os.path.join(OUT, 'holds_map.json'), 'w'), separators=(',', ':'))

    col = {'green': (60, 200, 60), 'orange': (0, 140, 255)}
    pic = img_r.copy()
    for i, (x0, y0, x1, y1, _) in enumerate(holds):
        on = [rt for rt in routes if i + 1 in route_holds[rt]]
        c = col.get(on[0], (255, 0, 255)) if on else (170, 170, 170)
        p0, p1 = (int(x0 * Wr), int(y0 * Hr)), (int(x1 * Wr), int(y1 * Hr))
        cv2.rectangle(pic, p0, p1, c, 2 if on else 1)
        if on: cv2.putText(pic, str(i + 1), (p0[0], p0[1] - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.35, c, 1, cv2.LINE_AA)
    cv2.imwrite(os.path.join(OUT, 'holds_map.jpg'), pic)
    print('\nwrote tools/out/holds_map.jpg and holds_map.json')


if __name__ == '__main__':
    sys.exit(main())

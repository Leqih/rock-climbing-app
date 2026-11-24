"""Read the climber's body with YOLO pose two ways, to see whether looking closer helps:

  full   the whole frame at once, as the server does now (server/spotter_server.py)
  crop   the area around where the body was a moment ago, cut out and enlarged, then read; the whole frame again when
         the climber is lost

Writes a scan per clip in the app's format (S at 5 a second, F at 15, 23 points as fractions of the frame), so
tools/skel_check.py and tools/skel_sheet can score and draw it.

    python tools/pose_crop.py --mode crop --out runs/pose/crop video/wayup-*.mp4
"""
import argparse, glob, json, os, time

import cv2, numpy as np
from ultralytics import YOLO

FHZ, HZ = 15, 5
# COCO 17 -> the app's 23 points (IDX in pose.js): fingers take the wrist, heel and toe the ankle
C2I = {0: 0, 5: 1, 6: 2, 7: 3, 8: 4, 9: 5, 10: 6, 11: 7, 12: 8, 13: 9, 14: 10, 15: 11, 16: 12}
FILL = {13: 5, 15: 5, 17: 5, 14: 6, 16: 6, 18: 6, 19: 11, 21: 11, 20: 12, 22: 12}


def pick(xy, cf, prev):
    hips = (xy[:, 11] + xy[:, 12]) / 2
    if prev is not None: return int(np.argmin(np.linalg.norm(hips - prev, axis=1)))
    # first: the biggest body. "Whoever's feet are highest", as the server picks, can be someone far off on another wall
    # while the climber still stands on the ground (The Way Up p3 orange)
    def size(i):
        ok = cf[i] > .2
        return 0 if ok.sum() < 5 else float(np.prod(xy[i][ok].max(0) - xy[i][ok].min(0)))
    return max(range(len(xy)), key=size)


def box_of(xy, cf, W, H, pad):
    ok = cf > .2
    if ok.sum() < 5: return None
    x0, y0 = xy[ok].min(0); x1, y1 = xy[ok].max(0)
    side = max(x1 - x0, y1 - y0) * (1 + 2 * pad)        # square, the body plus room for a limb to move
    side = max(side, .18 * max(W, H))
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    a, b = int(max(0, cx - side / 2)), int(max(0, cy - side / 2))
    return a, b, int(min(W, cx + side / 2)), int(min(H, cy + side / 2))


def read(model, path, mode, imgsz, crop_sz, pad, step=1):
    cap = cv2.VideoCapture(path)
    W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    D = cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS)
    n = int(D * HZ) * (FHZ // HZ)
    frames, prev, box, lost = [], None, None, 0
    ok, img = cap.read(); at = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000
    for f in range(n):
        while ok and at + 1e-3 < f / FHZ:
            ok, img = cap.read(); at = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000
        if not ok or f % step: frames.append(None); continue
        got = None
        if mode == 'crop' and box is not None:
            a, b, c, d = box
            r = model(img[b:d, a:c], imgsz=crop_sz, verbose=False)[0]
            if r.keypoints is not None and len(r.keypoints):
                xy, cf = r.keypoints.xy.cpu().numpy() + [a, b], r.keypoints.conf.cpu().numpy()
                got = xy, cf
        if got is None:   # the whole frame: always for "full", and to find the climber again for "crop"
            r = model(img, imgsz=imgsz, verbose=False)[0]
            if r.keypoints is not None and len(r.keypoints):
                got = r.keypoints.xy.cpu().numpy(), r.keypoints.conf.cpu().numpy()
        if got is None:
            frames.append(None); lost += 1
            if lost > 3: box = None
            continue
        xy, cf = got
        j = pick(xy, cf, prev)
        prev = (xy[j, 11] + xy[j, 12]) / 2
        box = box_of(xy[j], cf[j], W, H, pad); lost = 0
        p = [[0.0, 0.0, 0.0] for _ in range(23)]
        for c, i in C2I.items(): p[i] = [round(float(xy[j, c, 0]) / W, 4), round(float(xy[j, c, 1]) / H, 4), round(float(cf[j, c]), 3)]
        for i, s in FILL.items(): p[i] = list(p[s])
        frames.append(p)
    cap.release()
    S = [{'t': round(f / FHZ, 3), 'p': frames[f]} for f in range(0, len(frames), FHZ // HZ)]
    return {'W': W, 'H': H, 'D': D, 'fhz': FHZ, 'hz': HZ, 'S': S, 'F': frames, 'mode': mode}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('clips', nargs='+')
    ap.add_argument('--mode', choices=['full', 'crop'], required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--model', default='yolo11x-pose.pt')
    ap.add_argument('--imgsz', type=int, default=1280)
    ap.add_argument('--crop-sz', type=int, default=640)
    ap.add_argument('--pad', type=float, default=.35)
    ap.add_argument('--samples-only', action='store_true', help='read only the 5-a-second samples (enough to score)')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    model = YOLO(a.model)
    clips = [p for g in a.clips for p in glob.glob(g)]
    for p in clips:
        t0 = time.time()
        T = read(model, p, a.mode, a.imgsz, a.crop_sz, a.pad, FHZ // HZ if a.samples_only else 1)
        name = os.path.basename(p)[:-4]
        json.dump(T, open(os.path.join(a.out, f'{name}.track.json'), 'w'), separators=(',', ':'))
        seen = sum(1 for f in T['F'] if f)
        print(f'{name:22} {time.time() - t0:5.1f}s  body in {seen}/{len(T["F"])} frames', flush=True)


if __name__ == '__main__':
    main()

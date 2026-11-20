"""How often the skeleton's hands and feet are on the hold The Way Up's annotation says they are on.

The annotation gives, for every hold contact, the limb (lh/rh/lf/rf), the hold's box and the frames it lasts (minus the
frames the limb is hidden). While a limb holds still on a hold, its point in our scan should be on that hold. For each
scan sample inside a contact, a hand counts as on it when its wrist or index fingertip is within GAP px of the hold's box,
a foot when its ankle or toe is. That is a check on the skeleton's ends, the part every move and number is read from.

    python tools/skel_check.py [--tracks video] [--gap 25]
    python tools/skel_check.py --tracks <dir with wayup-*.track.json>    (another scan of the same clips)
"""
import argparse, csv, glob, json, os, re

import numpy as np

from hold_show import ROOT, CLIP, folder, offset

# positions in a scan's 23 points: wrists 5/6, index tips 15/16, ankles 11/12, toes 21/22
PTS = {'lh': (5, 15), 'rh': (6, 16), 'lf': (11, 21), 'rf': (12, 22)}


def contacts(vid, off):
    d, r = folder(vid)
    holds = json.load(open(os.path.join(d, f'{r}_routeAnnotation.json')))['holds']
    out = []
    for row in list(csv.reader(open(os.path.join(d, f'{r}_holdUsage.csv'))))[1:]:
        m = re.fullmatch(r'([lr][hf])\s*(\d+)', row[0].strip())
        if not m or int(m[2]) >= len(holds): continue
        h = holds[int(m[2])]
        box = (h['topLeftCorner']['x'], h['topLeftCorner']['y'], h['bottomRightCorner']['x'], h['bottomRightCorner']['y'])
        hid = [tuple(map(int, x.split('-'))) if '-' in x else (int(x), int(x)) for x in row[3].replace(' ', '').split(',') if x]
        out.append((m[1], box, int(row[1]), int(row[2]), hid))
    return out


def far(x, y, b):
    x0, y0, x1, y1 = b
    return float(np.hypot(max(x0 - x, 0, x - x1), max(y0 - y, 0, y - y1)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--tracks', default=os.path.join(ROOT, 'video'))
    ap.add_argument('--gap', type=float, default=25)
    a = ap.parse_args()
    tot = {k: [0, 0, 0] for k in PTS}   # on the hold, seen but elsewhere, not seen
    errs = {k: [] for k in PTS}
    for f in sorted(glob.glob(os.path.join(a.tracks, 'wayup-*.track.json'))):
        vid = os.path.basename(f)[:-11]
        try: off = offset(vid)
        except StopIteration: continue
        T = json.load(open(f))
        W, H = CLIP
        row = {k: [0, 0, 0] for k in PTS}
        for limb, box, f0, f1, hid in contacts(vid, off):
            for s in T['S']:
                fr = (s['t'] + off) * 25
                if not (f0 + 5 <= fr <= f1 - 5) or any(a0 <= fr <= a1 for a0, a1 in hid): continue   # settled, and in view
                p = s.get('p')
                pts = [p[i] for i in PTS[limb] if p and p[i][2] >= .3] if p else []
                if not pts: row[limb][2] += 1; continue
                d = min(far(q[0] * W, q[1] * H, box) for q in pts)
                errs[limb].append(d)
                row[limb][0 if d <= a.gap else 1] += 1
        for k in PTS: tot[k] = [x + y for x, y in zip(tot[k], row[k])]
        print(f'{vid:20}', '  '.join(f'{k} {100 * r[0] / max(1, sum(r)):3.0f}%' for k, r in row.items()))
    print(f'\nWithin {a.gap:.0f} px of the annotated hold (720x1280 clip pixels), over every settled, visible contact:')
    for k, (on, off_, miss) in tot.items():
        n = on + off_ + miss
        print(f'  {k}: on {100 * on / n:4.1f}%   elsewhere {100 * off_ / n:4.1f}%   not found {100 * miss / n:4.1f}%   '
              f'median miss {np.median(errs[k]):5.1f} px   n={n}')


if __name__ == '__main__':
    main()

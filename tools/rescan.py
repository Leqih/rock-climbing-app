"""Read clips' bodies here with the server's own reading (server/spotter_server.py read_body), so a sample video's
shipped scan is what the server would give for it. Writes the server's result per clip: runs/pose/frames/<name>.json.
The app then turns it into a scan with its own analysis (window.__trackFromFrames), as it does for a server result.

    python tools/rescan.py video/wayup-*.mp4
"""
import glob, json, os, sys, time

from ultralytics import YOLO

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'server'))
from spotter_server import read_body   # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'runs', 'pose', 'frames')


def main():
    os.makedirs(OUT, exist_ok=True)
    model = YOLO(os.path.join(ROOT, 'yolo11x-pose.pt'))
    for p in [p for g in sys.argv[1:] for p in sorted(glob.glob(g))]:
        t0 = time.time()
        r = read_body(model, p, 1280)
        r['model'] = 'yolo11x-pose.pt'
        name = os.path.basename(p)[:-4]
        json.dump(r, open(os.path.join(OUT, f'{name}.json'), 'w'), separators=(',', ':'))
        print(f'{name:22} {time.time() - t0:5.1f}s  body in {sum(1 for f in r["frames"] if f)}/{len(r["frames"])}', flush=True)


if __name__ == '__main__':
    main()

"""Spotter analysis server: reads the climber's body in an uploaded video with a YOLO pose model on a GPU, and gives the
app back the body frame by frame. The app runs its own analysis (moves, rests, arm lock, scores) on those frames, the same
way it does on the phone, so nothing else changes. When this server can't be reached the app reads the video on the phone.

    python server/spotter_server.py [--port 8765] [--model yolo11x-pose.pt] [--imgsz 1280]

POST /jobs          the video as the request body (any format OpenCV reads; ?seed=<json> is where you tapped yourself)
                    -> {"id": "..."}
GET  /jobs/<id>     -> {"pct": 0..1, "state": "queued|run|done|error", "error"?, "result"?}
GET  /health        -> {"ok": true, "model": ..., "gpu": ...}

result: {W, H, D, fhz, model, imgsz, secs, frames}. frames[f] is the climber at f / fhz s, MediaPipe's 33 points in its
order, each [x, y, confidence] as fractions of the picture, or null where nobody is found."""
import argparse, json, os, queue, tempfile, threading, time, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

import cv2, numpy as np

FHZ, HZ = 15, 5
MAX_BYTES = 400 * 1024 * 1024          # a few minutes of phone video
KEEP_S = 30 * 60                       # a finished job is forgotten after half an hour
# COCO 17 -> MediaPipe 33 (the fingers take the wrist, the heel and toe the ankle, the face only the nose)
COCO2MP = {0: 0, 5: 11, 6: 12, 7: 13, 8: 14, 9: 15, 10: 16, 11: 23, 12: 24, 13: 25, 14: 26, 15: 27, 16: 28}
FILL = {17: 15, 19: 15, 21: 15, 18: 16, 20: 16, 22: 16, 29: 27, 31: 27, 30: 28, 32: 28}
SEED = {'head': 0, 'lh': 9, 'rh': 10, 'lf': 15, 'rf': 16}   # the points you tap, as COCO points


def read_body(model, path, imgsz, seed=None, on_pct=None):
    cap = cv2.VideoCapture(path)
    if not cap.isOpened(): raise ValueError("can't read that video")
    W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    D = cap.get(cv2.CAP_PROP_FRAME_COUNT) / fps
    if not W or not D or D <= 0: raise ValueError("can't read that video")
    n = int(D * HZ) * (FHZ // HZ)       # the same frames the phone reads
    frames, prev, idx, t0 = [], None, 0, time.time()
    ok, img = cap.read()
    for f in range(n):
        want = f / FHZ
        while ok and idx / fps + 1e-6 < want:
            ok, img = cap.read(); idx += 1
        if on_pct and f % 5 == 0: on_pct(f / n)
        if not ok: frames.append(None); continue
        r = model(img, imgsz=imgsz, verbose=False)[0]
        if r.keypoints is None or len(r.keypoints) == 0: frames.append(None); continue
        xy, cf = r.keypoints.xy.cpu().numpy(), r.keypoints.conf.cpu().numpy()
        hips = (xy[:, 11] + xy[:, 12]) / 2
        if prev is not None:      # the same climber: hips nearest where they were
            j = int(np.argmin(np.linalg.norm(hips - prev, axis=1)))
        elif seed:                # first, where you tapped yourself
            pts = [(c, seed[k]) for k, c in SEED.items() if isinstance(seed.get(k), dict)]
            j = int(np.argmin([sum(np.hypot(xy[i, c, 0] / W - s['x'], xy[i, c, 1] / H - s['y']) for c, s in pts) for i in range(len(xy))]))
        else:                     # first, whoever's feet are highest on the wall
            j = int(np.argmin(np.maximum(xy[:, 15, 1], xy[:, 16, 1])))
        prev = hips[j]
        p = [[0.0, 0.0, 0.0] for _ in range(33)]
        for c, m in COCO2MP.items():
            p[m] = [round(float(xy[j, c, 0]) / W, 4), round(float(xy[j, c, 1]) / H, 4), round(float(cf[j, c]), 3)]
        for m, s in FILL.items(): p[m] = list(p[s])
        for e in range(1, 11): p[e] = [p[0][0], p[0][1], 0.0]   # eyes, ears, mouth: near the nose, unseen
        frames.append(p)
    cap.release()
    return {'W': W, 'H': H, 'D': D, 'fhz': FHZ, 'imgsz': imgsz, 'secs': round(time.time() - t0, 1), 'frames': frames}


class Jobs:
    """One GPU, so one video at a time, in the order they came."""
    def __init__(self, model, name, imgsz):
        self.model, self.name, self.imgsz, self.q, self.all, self.lock = model, name, imgsz, queue.Queue(), {}, threading.Lock()
        threading.Thread(target=self.work, daemon=True).start()

    def add(self, path, seed):
        jid = uuid.uuid4().hex[:12]
        with self.lock:
            self.forget()
            self.all[jid] = {'state': 'queued', 'pct': 0.0, 'at': time.time()}
        self.q.put((jid, path, seed))
        return jid

    def get(self, jid):
        with self.lock: return dict(self.all[jid]) if jid in self.all else None

    def forget(self):
        old = [k for k, j in self.all.items() if j['state'] in ('done', 'error') and time.time() - j['at'] > KEEP_S]
        for k in old: del self.all[k]

    def work(self):
        while True:
            jid, path, seed = self.q.get()
            job = self.all[jid]
            job.update(state='run', at=time.time())
            try:
                res = read_body(self.model, path, self.imgsz, seed, lambda p: job.update(pct=round(p, 3)))
                res['model'] = os.path.basename(self.name)
                job.update(state='done', pct=1.0, result=res, at=time.time())
                print(f'{jid}: {len(res["frames"])} frames in {res["secs"]} s', flush=True)
            except Exception as e:
                job.update(state='error', error=str(e), at=time.time())
                print(f'{jid}: {e}', flush=True)
            finally:
                try: os.remove(path)
                except OSError: pass


def handler(jobs, info):
    class H(BaseHTTPRequestHandler):
        def cors(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Access-Control-Allow-Private-Network', 'true')

        def send(self, code, obj):
            body = json.dumps(obj, separators=(',', ':')).encode()
            self.send_response(code); self.cors()
            self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(body)))
            self.end_headers(); self.wfile.write(body)

        def do_OPTIONS(self):
            self.send_response(204); self.cors(); self.end_headers()

        def do_GET(self):
            u = urlparse(self.path)
            if u.path == '/health': return self.send(200, {'ok': True, **info})
            if u.path.startswith('/jobs/'):
                j = jobs.get(u.path[6:])
                return self.send(200, j) if j else self.send(404, {'error': 'no such job'})
            self.send(404, {'error': 'not found'})

        def do_POST(self):
            u = urlparse(self.path)
            if u.path != '/jobs': return self.send(404, {'error': 'not found'})
            n = int(self.headers.get('Content-Length') or 0)
            if not n: return self.send(400, {'error': 'send the video as the body'})
            if n > MAX_BYTES: return self.send(413, {'error': 'video too large'})
            try: seed = json.loads(parse_qs(u.query).get('seed', ['null'])[0])
            except ValueError: seed = None
            fd, path = tempfile.mkstemp(suffix='.video')
            with os.fdopen(fd, 'wb') as out:
                left = n
                while left:
                    b = self.rfile.read(min(1 << 20, left))
                    if not b: break
                    out.write(b); left -= len(b)
            if left: os.remove(path); return self.send(400, {'error': 'upload cut short'})
            self.send(200, {'id': jobs.add(path, seed if isinstance(seed, dict) else None)})

        def log_message(self, fmt, *a):
            if not self.path.startswith('/jobs/'): super().log_message(fmt, *a)   # not every progress poll
    return H


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--port', type=int, default=8765)
    ap.add_argument('--host', default='0.0.0.0')
    ap.add_argument('--model', default='yolo11x-pose.pt')
    ap.add_argument('--imgsz', type=int, default=1280)
    a = ap.parse_args()
    from ultralytics import YOLO
    import torch
    model = YOLO(a.model)
    model(np.zeros((640, 640, 3), np.uint8), imgsz=a.imgsz, verbose=False)   # load it onto the GPU now, not on the first video
    info = {'model': os.path.basename(a.model), 'imgsz': a.imgsz, 'gpu': torch.cuda.get_device_name(0) if torch.cuda.is_available() else None}
    print(f'Spotter server on :{a.port}  {info}', flush=True)
    ThreadingHTTPServer((a.host, a.port), handler(Jobs(model, a.model, a.imgsz), info)).serve_forever()

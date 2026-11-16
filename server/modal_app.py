"""The Spotter analysis server on Modal: a GPU that's only paid for while it reads a video, at an https address the app
can call from the gym. The same API as spotter_server.py (POST /jobs, GET /jobs/<id>, GET /health), the same reading.

    modal deploy server/modal_app.py      # prints the address: open the app with ?server=<that address>
"""
import os, tempfile, time
import modal

MODEL, IMGSZ, GPU = 'yolo11x-pose.pt', 1280, 'L4'
here = os.path.dirname(os.path.abspath(__file__))

image = (modal.Image.debian_slim(python_version='3.11')
         .apt_install('libgl1', 'libglib2.0-0')
         .pip_install('ultralytics==8.4.215', 'fastapi[standard]')
         .run_commands(f"cd /root && python -c \"from ultralytics import YOLO; YOLO('{MODEL}')\"")   # the weights, in the image
         .add_local_file(os.path.join(here, 'spotter_server.py'), '/root/spotter_server.py'))
app = modal.App('spotter', image=image)
progress = modal.Dict.from_name('spotter-progress', create_if_missing=True)


@app.cls(gpu=GPU, timeout=15 * 60, scaledown_window=60)
class Reader:
    @modal.enter()
    def load(self):
        from ultralytics import YOLO
        import numpy as np
        self.model = YOLO(f'/root/{MODEL}')
        self.model(np.zeros((640, 640, 3), np.uint8), imgsz=IMGSZ, verbose=False)

    @modal.method()
    def read(self, video: bytes, seed=None):
        from spotter_server import read_body
        jid = modal.current_function_call_id()
        fd, path = tempfile.mkstemp(suffix='.video')
        with os.fdopen(fd, 'wb') as f: f.write(video)
        try:
            last = [0.0]
            def on_pct(p):   # not every frame: each write is a network call
                if p - last[0] >= .03: last[0] = p; progress[jid] = round(p, 3)
            res = read_body(self.model, path, IMGSZ, seed, on_pct)
            res['model'] = MODEL
            return res
        finally:
            os.remove(path)
            try: progress.pop(jid)
            except KeyError: pass


@app.function(timeout=10 * 60)
@modal.concurrent(max_inputs=50)
@modal.asgi_app()
def web():
    import json
    from fastapi import FastAPI, Request
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    api = FastAPI()
    api.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['GET', 'POST', 'OPTIONS'], allow_headers=['*'])

    @api.get('/health')
    def health(): return {'ok': True, 'model': MODEL, 'imgsz': IMGSZ, 'gpu': GPU}

    @api.post('/jobs')
    async def add(request: Request, seed: str = None):
        video = await request.body()
        if not video: return JSONResponse({'error': 'send the video as the body'}, 400)
        if len(video) > 400 * 1024 * 1024: return JSONResponse({'error': 'video too large'}, 413)
        try: s = json.loads(seed) if seed else None
        except ValueError: s = None
        call = await Reader().read.spawn.aio(video, s if isinstance(s, dict) else None)
        return {'id': call.object_id}

    @api.get('/jobs/{jid}')
    async def get(jid: str):
        try: call = modal.FunctionCall.from_id(jid)
        except Exception: return JSONResponse({'error': 'no such job'}, 404)
        try:
            res = await call.get.aio(timeout=0)
            return {'state': 'done', 'pct': 1.0, 'result': res}
        except TimeoutError:
            pct = await progress.get.aio(jid, 0.0)
            return {'state': 'run' if pct else 'queued', 'pct': pct}
        except Exception as e:
            return {'state': 'error', 'error': str(e) or type(e).__name__}

    return api

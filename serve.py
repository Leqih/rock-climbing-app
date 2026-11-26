# Static server for chalk-site with HTTP Range support, so videos can seek
# (python -m http.server can't, which breaks clip start times).
# usage: python -I serve.py 8000 .  (from inside chalk-site)
import os, re, sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class RangeHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        rng = self.headers.get('Range')
        path = self.translate_path(self.path)
        m = re.match(r'bytes=(\d*)-(\d*)$', rng or '')
        if not m or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        a, b = m.groups()
        start = int(a) if a else max(0, size - int(b or 0))
        end = min(int(b), size - 1) if a and b else size - 1
        if start >= size or start > end:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.end_headers()
            return None
        f = open(path, 'rb')
        f.seek(start)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        self._left = end - start + 1
        return f

    def copyfile(self, src, dst):
        left, self._left = getattr(self, '_left', None), None
        try:
            if left is None:
                return super().copyfile(src, dst)
            while left > 0:
                chunk = src.read(min(64 * 1024, left))
                if not chunk:
                    break
                dst.write(chunk)
                left -= len(chunk)
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass  # the browser dropped a video request mid-way; normal when it seeks

    # text files say they're UTF-8: without it a browser can read the stylesheet in its own default encoding, and every
    # character past plain English in it (the ✦ by each tab's title, the · between words) comes out as âœ¦ and Â·
    def guess_type(self, path):
        t = super().guess_type(path)
        return t + '; charset=utf-8' if t.startswith('text/') or t in ('application/javascript', 'application/json') else t

    # where a phone on the same Wi-Fi opens the app: the invite QR code reads it when the page is open as localhost
    # (which, on a phone, is the phone). The Wi-Fi server is the one on SPOTTER_LAN_PORT (8080 by default)
    def do_GET(self):
        if self.path.split('?')[0] == '/lan.json':
            import json, socket
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('10.255.255.255', 1)); ip = s.getsockname()[0]; s.close()
            except OSError:
                ip = ''
            body = json.dumps({'url': f"http://{ip}:{os.environ.get('SPOTTER_LAN_PORT', '8080')}/" if ip and not ip.startswith('127.') else ''}).encode()
            self.send_response(200); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(body))); self.end_headers()
            self.wfile.write(body); return
        return super().do_GET()

    def end_headers(self):
        if not self.headers.get('Range'):
            self.send_header('Accept-Ranges', 'bytes')
        # the page and its code always come fresh: back, forward and reload otherwise show an old version from the
        # browser's cache (no-store, since back/forward ignore no-cache). Videos and pictures stay cacheable
        p = self.path.split('?')[0].split('#')[0]
        if p.endswith('/') or p.endswith('.html'):
            self.send_header('Cache-Control', 'no-store')
        elif p.endswith(('.js', '.css', '.json')):
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8773
    root = sys.argv[2] if len(sys.argv) > 2 else '.'
    ThreadingHTTPServer(('127.0.0.1', port), partial(RangeHandler, directory=root)).serve_forever()

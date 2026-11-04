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

    def end_headers(self):
        if not self.headers.get('Range'):
            self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8773
    root = sys.argv[2] if len(sys.argv) > 2 else '.'
    ThreadingHTTPServer(('127.0.0.1', port), partial(RangeHandler, directory=root)).serve_forever()

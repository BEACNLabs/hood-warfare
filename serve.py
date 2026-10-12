"""Local static server for the Hood Warfare.
The game requests ~150 files at once; the stock http.server backlog (5) refuses
some of them and the loader stalls. This one threads and queues 512."""
import sys, mimetypes
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
os.chdir(Path(__file__).parent)
mimetypes.add_type('model/gltf-binary', '.glb'); mimetypes.add_type('image/vnd.radiance', '.hdr')
mimetypes.add_type('audio/ogg', '.ogg'); mimetypes.add_type('image/webp', '.webp'); mimetypes.add_type('application/wasm', '.wasm')
class H(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache'); super().end_headers()
    def log_message(self, *a): pass
class S(ThreadingHTTPServer):
    request_queue_size = 512; daemon_threads = True
port = int(sys.argv[1]) if len(sys.argv) > 1 else 5441
print(f'Hood Warfare on http://127.0.0.1:{port}/', flush=True)
S(('127.0.0.1', port), H).serve_forever()

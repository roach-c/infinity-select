"""Pretend to be the plugin: serves the stub page and the four /api routes on :8080.
The stub loads app.css/images.js/app.js from BASE (default: this machine's site/ folder)."""
import http.server, json, os, sys, urllib.parse
ROOT = os.path.dirname(os.path.abspath(__file__))
LIB = json.load(open(os.path.join(ROOT, "lib.sample.json")))
STUB = open(os.path.join(ROOT, "..", "stub.html")).read()
BASE = sys.argv[1] if len(sys.argv) > 1 else "/docs/"
S = {"s": [-1] * 9, "c": 1}
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=os.path.join(ROOT, ".."), **k)
    def js(s, o):
        b = json.dumps(o).encode(); s.send_response(200); s.send_header("Content-Type", "application/json"); s.end_headers(); s.wfile.write(b)
    def do_GET(s):
        u = urllib.parse.urlparse(s.path); qs = dict(urllib.parse.parse_qsl(u.query))
        if u.path in ("/", "/index.html"):
            b = STUB.replace("https://roach-c.github.io/infinity-select/", BASE).encode()
            s.send_response(200); s.send_header("Content-Type", "text/html"); s.end_headers(); return s.wfile.write(b)
        if u.path == "/api/lib": return s.js(LIB)
        if u.path == "/api/state": return s.js(S)
        if u.path == "/api/place": S["s"][int(qs["slot"])] = int(qs["id"]); return s.js(S)
        if u.path == "/api/remove": S["s"][int(qs["slot"])] = -1; return s.js(S)
        return super().do_GET()
    def log_message(s, *a): pass
http.server.ThreadingHTTPServer(("127.0.0.1", 8080), H).serve_forever()

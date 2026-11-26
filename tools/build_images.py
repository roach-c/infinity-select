"""Merge image sources into docs/images.js.
INF_IMG[name]  = url, or [url, fx, fy, fw, fh] when the picture is one frame of a turntable sheet (fractions)
INF_FACE[name] = [cx, cy, size, w, h]  head crop relative to the (frame) picture; w,h = picture pixels
usage: build_images.py matches.json better.json sprites.json lib.json [contact_sheet.png]"""
import json, sys, io, re, time, urllib.request
from PIL import Image, ImageFilter, ImageDraw
import numpy as np
M, B, S, lib = [json.load(open(p)) for p in sys.argv[1:5]]
sheet_out = sys.argv[5] if len(sys.argv) > 5 else None
over = json.load(open("tools/face_overrides.json"))
cat = {e[0].strip(): e[1] for e in lib}
ADOPT_BETTER = {"Inside Out - Sadness",
                "Peter Pan - Peter Pan", "Star Wars - Luke Skywalker", "Star Wars The Clone Wars - Obi-Wan Kenobi",
                "Star Wars The Clone Wars - Yoda"}
SKIP_SPRITE = {"Guardians of the Galaxy - Rocket Raccoon", "Guardians of the Galaxy - Ronan the Accuser", "Lilo & Stitch - Stitch", "Ultimate Spider-Man - Spider-Man"}
IMG_OVERRIDE = json.load(open("tools/image_overrides.json"))
def get(u):
    for _ in range(5):
        try: return urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "infinity-select/1.0"}), timeout=60).read()
        except Exception: time.sleep(3)
    raise SystemExit("fetch failed " + u)
img, face, src = {}, {}, {}
for r in M:
    name = r["name"].strip()
    if not r["img"]: continue
    img[name] = r["img"]; src[name] = r["img"]
    if cat[name] != 0: continue
    base_file = r["img"].split("/images/")[1].split("/revision")[0]
    s = S.get(name)
    if name in ADOPT_BETTER: img[name] = B[name]["url"]
    elif s and "render" in s["file"].lower() and "sprite" not in s["file"].lower(): img[name] = s["url"]
    elif s and "cols" in s and "Character-" not in base_file and name not in SKIP_SPRITE: img[name] = [s["full"], 0, 0, 1 / s["cols"], 1 / s["rows"]]
    if name in IMG_OVERRIDE: img[name] = IMG_OVERRIDE[name]
    src[name] = img[name]

def head(im):
    W, H = im.size; a = np.asarray(im).astype(int)
    if (a[..., 3] < 250).mean() > 0.05: mask = a[..., 3] > 40
    else:
        corners = np.concatenate([a[:6, :6, :3].reshape(-1, 3), a[:6, -6:, :3].reshape(-1, 3)])
        mask = np.abs(a[..., :3] - np.median(corners, 0)).sum(-1) > 60
    k = max(5, int(19 * W / 400)) | 1
    mk = np.asarray(Image.fromarray((mask * 255).astype("uint8")).filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k))) > 0
    rows = np.where(mk.any(1))[0]
    if len(rows) < 10: return None
    top, bot = rows[0], rows[-1]; fh = bot - top
    ys, xs = np.nonzero(mk[top: top + max(4, int(fh * 0.14))])
    return [round(float(np.median(xs)) / W, 4), round((top + fh * 0.13) / H, 4), round(fh * 0.33 / H, 4)]

thumbs = []
for name, v in img.items():
    if cat[name] != 0 or "(Crystal)" in name or "(Light FX)" in name: continue
    url = v if isinstance(v, str) else v[0]
    im = Image.open(io.BytesIO(get(url))).convert("RGBA")
    if not isinstance(v, str):
        _, fx, fy, fw, fh = v; W, H = im.size
        im = im.crop((round(fx * W), round(fy * H), round((fx + fw) * W), round((fy + fh) * H)))
    w, h = im.size
    o = over.get(name, "auto")
    if isinstance(o, dict):                      # override tied to a specific source
        o = o["crop"] if o.get("src") == (url if isinstance(v, str) else url + "#frame0") else "auto"
    if o is None: continue
    c = o if isinstance(o, list) else head(im)
    if not c: continue
    face[name] = c + [w, h]
    if sheet_out:
        cx, cy, s = c[0] * w, c[1] * h, c[2] * h / 2
        bg = Image.new("RGBA", im.size, (235, 235, 235, 255)); bg.alpha_composite(im)
        thumbs.append((name, bg.convert("RGB").crop((int(cx - s), int(cy - s), int(cx + s), int(cy + s))).resize((96, 96))))
open("docs/images.js", "w").write("window.INF_IMG=" + json.dumps(img, separators=(",", ":"), ensure_ascii=False) +
                                  ";\nwindow.INF_FACE=" + json.dumps(face, separators=(",", ":"), ensure_ascii=False) +
                                  ";\nwindow.INF_POS=" + open("tools/set_focus.json").read().replace("\n", "") + ";\n")
print("images", len(img), "faces", len(face))
if sheet_out:
    c = 12; sh = Image.new("RGB", (c * 100, ((len(thumbs) + c - 1) // c) * 110), "white"); d = ImageDraw.Draw(sh)
    for i, (n, t) in enumerate(thumbs):
        x, y = (i % c) * 100, (i // c) * 110; sh.paste(t, (x + 2, y + 2)); d.text((x + 2, y + 98), f"{i} {n.split(' - ')[-1][:13]}", fill="red")
    sh.save(sheet_out); json.dump([n for n, _ in thumbs], open(sheet_out + ".names.json", "w"))

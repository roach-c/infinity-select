"""For each character image, find a square crop around the head (like the in-game HUD bubble).
Writes {name: [cx, cy, size]} as fractions of image width/height."""
import json, sys, io, urllib.request
from PIL import Image, ImageFilter
import numpy as np
lib = json.load(open(sys.argv[1])); IMG = json.loads(open(sys.argv[2]).read().split("=", 1)[1].rstrip(";\n"))
out = {}; dbg = sys.argv[4] if len(sys.argv) > 4 else None
for name, cat, ver in lib:
    name = name.strip()
    if cat != 0 or name not in IMG: continue
    try:
        raw = urllib.request.urlopen(urllib.request.Request(IMG[name], headers={"User-Agent": "x/1"}), timeout=30).read()
        im = Image.open(io.BytesIO(raw)).convert("RGBA")
    except Exception as e:
        print("fail", name, e); continue
    W, H = im.size; a = np.asarray(im).astype(int)
    if (a[..., 3] < 250).mean() > 0.05:          # real transparency
        mask = a[..., 3] > 40
    else:                                         # flat background: compare to corner colour
        corners = np.concatenate([a[:6, :6, :3].reshape(-1, 3), a[:6, -6:, :3].reshape(-1, 3)])
        bg = np.median(corners, 0)
        mask = np.abs(a[..., :3] - bg).sum(-1) > 60
    m = Image.fromarray((mask * 255).astype("uint8")).filter(ImageFilter.MinFilter(19)).filter(ImageFilter.MaxFilter(19))
    mk = np.asarray(m) > 0
    rows = np.where(mk.any(1))[0]
    if len(rows) < 10: print("empty", name); continue
    top, bot = rows[0], rows[-1]; fh = bot - top
    band = mk[top: top + max(4, int(fh * 0.14))]
    ys, xs = np.nonzero(band)
    cx = float(np.median(xs)); cy = top + fh * 0.13
    size = fh * 0.33
    out[name] = [round(cx / W, 4), round(cy / H, 4), round(size / H, 4), W, H]
    if dbg:
        s = size / 2; im.crop((int(cx - s), int(cy - s), int(cx + s), int(cy + s))).resize((96, 96)).save(f"{dbg}/{len(out):03d}.png")
json.dump(out, open(sys.argv[3], "w"), indent=0)
print("heads", len(out))

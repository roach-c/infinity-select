"""Pick the best (largest, clean render) wiki image for each character page."""
import json, sys, re, urllib.request, urllib.parse
API = "https://disneyinfinity.fandom.com/api.php"
def call(**p):
    p.update(format="json"); r = urllib.request.Request(API + "?" + urllib.parse.urlencode(p), headers={"User-Agent": "infinity-select/1.0"})
    return json.load(urllib.request.urlopen(r, timeout=40))
M = json.load(open(sys.argv[1]))           # matches.json from match_images.py
lib = json.load(open(sys.argv[2]))
BAD = re.compile(r"crystal|light_?fx|gameplay|preview|video|in_?game|figures|trailer|icon|hexicon|gallery|screenshot|screen_shot|wallpaper|concept|portrait|costume|pack|package|logo|banner|edition|quote|\.jpeg$|\.gif$|\.svg$|\.webm|\.ogv|playset|play_set|_set|toy_box|toybox|group|characters", re.I)
GOOD = re.compile(r"character-|figure|figurine|render|_fig|fig\.|infinity", re.I)
out = {}
chars = [r for r in M if lib[r["i"]][1] == 0 and "(Crystal)" not in r["name"] and "(Light FX)" not in r["name"]]
for r in chars:
    t = r["title"]
    d = call(action="query", titles=t, prop="images", imlimit="max", redirects="1")
    files = [i["title"] for p in d["query"]["pages"].values() for i in p.get("images", [])]
    files = [f for f in files if not BAD.search(f.replace(" ", "_")) and re.search(r"\.(png|jpe?g)$", f, re.I)]
    if not files: continue
    info = {}
    for k in range(0, len(files), 40):
        d = call(action="query", titles="|".join(files[k:k + 40]), prop="imageinfo", iiprop="size|mime|url", iiurlwidth="800")
        for p in d["query"]["pages"].values():
            ii = (p.get("imageinfo") or [None])[0]
            if ii: info[p["title"]] = ii
    words = [w for w in re.findall(r"[a-z]+", r["name"].split(" - ", 1)[-1].lower()) if len(w) > 2]
    def score(f):
        ii = info[f]; w, h = ii["width"], ii["height"]
        if w < 200 or h < 200: return -1
        s = min(w, 1200) * min(h, 1600) / 1e5
        if GOOD.search(f): s += 20
        if f.lower().startswith("file:character-"): s += 30
        if ii["mime"] == "image/png": s += 10
        if not any(x in f.lower() for x in words): s -= 25
        if w > h * 1.3: s -= 20          # landscape shots are usually scenes
        return s
    best = max(info, key=score, default=None)
    if best and score(best) > 0:
        ii = info[best]; out[r["name"].strip()] = dict(file=best, w=ii["width"], h=ii["height"], url=ii.get("thumburl") or ii["url"], old=r["img"].split("/images/")[1].split("/revision")[0][5:])
json.dump(out, open(sys.argv[3], "w"), indent=1)
print(len(chars), "chars;", len(out), "picked")

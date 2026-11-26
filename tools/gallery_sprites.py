"""Look in each character's /Gallery page for an official render (sprite/render png)."""
import json, sys, re, urllib.request, urllib.parse
API = "https://disneyinfinity.fandom.com/api.php"
def call(**p):
    p.update(format="json"); r = urllib.request.Request(API + "?" + urllib.parse.urlencode(p), headers={"User-Agent": "infinity-select/1.0"})
    return json.load(urllib.request.urlopen(r, timeout=40))
M = json.load(open(sys.argv[1])); lib = json.load(open(sys.argv[2])); out = {}
for r in M:
    if lib[r["i"]][1] != 0 or "(Crystal)" in r["name"] or "(Light FX)" in r["name"]: continue
    d = call(action="query", titles=r["title"] + "/Gallery", generator="images", gimlimit="max", prop="imageinfo", iiprop="size|mime|url", iiurlwidth="800")
    words = [w for w in re.findall(r"[a-z]+", r["title"].lower()) if len(w) > 2]
    best = None
    for p in d.get("query", {}).get("pages", {}).values():
        ii = (p.get("imageinfo") or [None])[0]; f = p["title"].lower()
        if not ii or "sprite" not in f and "render" not in f: continue
        if not any(w in f.replace("-", " ").replace("_", " ") for w in words): continue
        if ii["width"] < 500 or re.search(r"crystal|light ?fx", f): continue
        if best is None or ii["width"] * ii["height"] > best[1]["width"] * best[1]["height"]: best = (p["title"], ii)
    if best: out[r["name"].strip()] = dict(file=best[0], w=best[1]["width"], h=best[1]["height"], url=best[1].get("thumburl") or best[1]["url"])
json.dump(out, open(sys.argv[3], "w"), indent=1); print(len(out), "sprites")

"""Match each plugin figure name to a Disney Infinity wiki page image."""
import json, sys, time, re, urllib.request, urllib.parse, difflib
API = "https://disneyinfinity.fandom.com/api.php"
lib = json.load(open(sys.argv[1])); out = sys.argv[2]

def q(term):
    p = dict(action="query", format="json", generator="search", gsrsearch=term, gsrlimit="6",
             prop="pageimages", piprop="thumbnail|name", pithumbsize="400")
    req = urllib.request.Request(API + "?" + urllib.parse.urlencode(p), headers={"User-Agent": "infinity-select/1.0"})
    for _ in range(3):
        try: return json.load(urllib.request.urlopen(req, timeout=20)).get("query", {}).get("pages", {})
        except Exception: time.sleep(2)
    return {}

def term_of(name, cat):
    parts = [s.strip() for s in name.split(" - ")]
    if cat == 1 or cat == 3:   # playsets / toy boxes: whole name
        t = re.sub(r"\(.*?\)", "", name).replace("Marvel's ", "").strip()
        return t
    t = parts[1] if len(parts) > 1 else parts[0]
    return t

def norm(s): return re.sub(r"[^a-z0-9]", "", s.lower())

res = []
for i, (name, cat, ver) in enumerate(lib):
    t = term_of(name, cat)
    cands = []
    for term in dict.fromkeys([t, re.sub(r"\(.*?\)", "", t).strip()]):
        pages = q(term)
        for p in sorted(pages.values(), key=lambda p: p.get("index", 99)):
            if "/" in p["title"] or "thumbnail" not in p: continue
            score = difflib.SequenceMatcher(None, norm(term), norm(p["title"])).ratio()
            cands.append((score, p["title"], p["thumbnail"]["source"]))
        if cands and max(cands)[0] > 0.8: break
    best = max(cands) if cands else (0, "", "")
    res.append(dict(i=i, name=name, term=t, title=best[1], score=round(best[0], 2), img=best[2]))
    time.sleep(0.15)
json.dump(res, open(out, "w"), indent=1)
print("done", len(res), "matched>=0.8:", sum(r["score"] >= .8 for r in res), "none:", sum(not r["img"] for r in res))

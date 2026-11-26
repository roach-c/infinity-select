import asyncio, sys
from playwright.async_api import async_playwright
OUT = sys.argv[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
        await pg.goto("http://localhost:8080/"); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=OUT + "/1-base-empty.png")
        await pg.click(".pl.p1"); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=OUT + "/2-pick-chars.png")
        await pg.click("#unis .tab:nth-child(5)"); await pg.wait_for_timeout(2000)
        await pg.screenshot(path=OUT + "/3-pick-starwars.png")
        await pg.click(".card:nth-child(3)"); await pg.wait_for_timeout(600)
        await pg.click(".pl.p2"); await pg.click("#unis .tab:nth-child(4)"); await pg.wait_for_timeout(1500); await pg.click(".card:nth-child(2)")
        await pg.click(".disc.p1"); await pg.wait_for_timeout(1500); await pg.click(".card:nth-child(1)")
        await pg.click(".hx"); await pg.wait_for_timeout(1500); await pg.screenshot(path=OUT + "/4-pick-playsets.png"); await pg.click(".card:nth-last-child(1)")
        await pg.wait_for_timeout(2500); await pg.screenshot(path=OUT + "/5-base-filled.png", full_page=True)
        print("errors:", errs)
        await b.close()
asyncio.run(main())

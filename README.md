# Infinity Select

A Disney Infinity style character select for the
[infinity-base-ps4](https://github.com/Kwarz-git/infinity-base-ps4) GoldHEN plugin.

`stub.html` replaces the page built into `infinity_base_en.prx`. It loads
`docs/app.css`, `docs/images.js` and `docs/app.js` from GitHub Pages, so the
code runs on the PS4's own address and calls the plugin's `/api/lib`,
`/api/state`, `/api/place` and `/api/remove` directly. With no internet it falls
back to a plain list built into the stub.

Character art is linked from the Disney Infinity fan wiki (not copied here).
Images need `referrerpolicy="no-referrer"` or the wiki returns 404.

- `tools/match_images.py` maps plugin figure names to wiki images.
- `tools/mock_ps4.py` fakes the plugin on localhost:8080 for testing.
- `tools/shoot.py` drives the page in headless Chromium at phone size.

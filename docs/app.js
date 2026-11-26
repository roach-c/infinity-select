/* Disney Infinity character select for the infinity-base-ps4 GoldHEN plugin.
   Loaded by a small stub page served from the PS4 (port 8080), so every /api call
   below is same-origin with the plugin. */
(function () {
  const IMG = window.INF_IMG || {}, FACE = window.INF_FACE || {}, POS = window.INF_POS || {};
  const VER = ['1.0', '2.0', '3.0'];
  // plugin slot ids
  const SLOT = { P1: 0, P2: 1, HEX: [2, 7, 8], D1: [3, 4], D2: [5, 6] };
  const TITLE = { 0: 'Player 1', 1: 'Player 2', 2: 'Hexagon 1', 7: 'Hexagon 2', 8: 'Hexagon 3',
    3: 'Player 1 · Disc 1', 4: 'Player 1 · Disc 2', 5: 'Player 2 · Disc 1', 6: 'Player 2 · Disc 2' };
  const UNI = [
    ['all', 'All', ''], ['disney', 'Disney', 'var(--disney)'], ['pixar', 'Pixar', 'var(--pixar)'],
    ['marvel', 'Marvel', 'var(--marvel)'], ['starwars', 'Star Wars', 'var(--starwars)']];
  // Play sets that actually load on this copy (v1.00, no update). Others just flash.
  // Add names here if the 1.06 update gets installed.
  const PLAYABLE_SETS = [/Twilight of the Republic/i, /Rise Against the Empire/i, /Inside Out Play Set/i, /Marvel Battlegrounds/i];   // all four tested working 2026-11-25; Finding Dory says "invalid toy", Force Awakens is locked
  // v1.00 still has the 2015 pre-release lock: Force Awakens pieces ask for an activation code
  // from a Disney site that no longer exists, so they can't be used on this copy.
  const LOCKED = /Force Awakens/i;
  // 1.0 and 2.0 play sets tested 2026-11-25: these load on 3.0 (Cars, Lone Ranger and the 1.0 starter set do not)
  const TEST_SETS = /Toy Story in Space|Guardians of the Galaxy Play Set|Spider-Man Play Set|The Avengers Play Set/i;
  // Toy Box games tested 2026-11-25: all work except Stitch's Tropical Rescue
  const BROKEN_TOYBOX = /Stitch's Tropical Rescue/i;
  // characters added in later updates that v1.00 doesn't know (tested 2026-11-25)
  const BROKEN_CHARS = /^Alice Through the Looking Glass - |^Peter Pan - Peter Pan$|^The Jungle Book - Baloo$/i;
  const PIXAR = /cars|monsters|incredibles|toy story|finding (nemo|dory)|inside out|good dinosaur|brave|up\b|wall-?e|ratatouille|a bug|pixar/i;
  const MARVEL = /marvel|avengers|guardians|spider|captain america|ant-man|hulk|iron man|thor\b/i;
  const SW = /star wars/i;

  let LIB = [], ST = { s: [-1, -1, -1, -1, -1, -1, -1, -1, -1], c: 0 };
  let cur = 0, kind = 'char', uni = 'all', ver = -1, q = '';

  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const J = u => fetch(u, { cache: 'no-store' }).then(r => r.json());

  function info(i) {
    const e = LIB[i]; if (!e) return null;
    const raw = e[0].trim(), parts = raw.split(' - ').map(s => s.trim());
    let name, franchise, kindOf = '', variant = '';
    if (e[1] === 0) { franchise = parts[0]; name = parts.slice(1).join(' - ') || parts[0]; }
    else if (e[1] === 2) { franchise = parts[0]; name = parts[1] || raw; kindOf = parts[2] || ''; }
    else { franchise = parts.length > 1 ? parts[0] : ''; name = parts[parts.length - 1].replace(/\s*\(.*?\)\s*/g, ' ').trim(); }
    const m = name.match(/\((Crystal|Light FX)\)/i);
    if (m) { variant = m[1]; name = name.replace(m[0], '').trim(); }
    const all = raw;
    // Crystal / Light FX figures borrow the regular figure's picture and face crop
    const base = raw.replace(/\s*\((Crystal|Light FX)\)/i, '').trim();
    const key = (variant && (FACE[base] || IMG[base])) ? base : raw;
    const u = SW.test(all) ? 'starwars' : MARVEL.test(all) ? 'marvel' : PIXAR.test(all) ? 'pixar' : 'disney';
    // round discs = abilities; hex discs = toys and customization
    const disc = e[1] === 2 ? (/^Ability/i.test(kindOf) ? 'round' : 'hexa') : '';
    return { i, raw, name, franchise, kindOf, variant, cat: e[1], ver: e[2], uni: u, disc, img: (Array.isArray(IMG[key]) ? IMG[key][0] : IMG[key]) || '', frame: Array.isArray(IMG[key]) ? IMG[key].slice(1) : null, face: FACE[key] || null, pos: POS[raw] || '' };
  }
  const colorOf = u => (UNI.find(x => x[0] === u) || [])[2] || 'var(--other)';

  function img(src, alt) {
    const im = h('img'); im.alt = alt || ''; im.loading = 'lazy'; im.referrerPolicy = 'no-referrer'; im.decoding = 'async';
    if (src) im.src = src; im.onerror = () => im.remove(); return im;
  }

  // round head crop, like the in-game HUD portrait. f.face = [cx, cy, size, w, h] (fractions)
  function face(f, cls) {
    const d = h('div', 'face' + (cls ? ' ' + cls : ''));
    if (!f.img) return d;
    if (!f.face) { d.classList.add('whole'); d.append(img(f.img, f.name)); return d; }
    const [cx, cy, sz, w, hh] = f.face, kx = w / (sz * hh), ky = 1 / sz;
    const [fx, fy, fw, fh] = f.frame || [0, 0, 1, 1];
    const im = img(f.img, f.name); im.className = 'fi';
    // picture (frame) box in circle units, then the whole sheet relative to it
    const pl = 0.5 - cx * kx, pt = 0.5 - cy * ky, sw = kx / fw, shh = ky / fh;
    im.style.width = (sw * 100) + '%'; im.style.height = (shh * 100) + '%';
    im.style.left = ((pl - fx * sw) * 100) + '%'; im.style.top = ((pt - fy * shh) * 100) + '%';
    d.append(im);
    return d;
  }

  // full picture; sheets show only their frame
  function pic(f) {
    if (!f.frame) return img(f.img, f.name);
    const [fx, fy, fw, fh] = f.frame, [, , , w, hh] = f.face || [0, 0, 0, 1, 1];
    const wrap = h('div', 'pic'), fr = h('div', 'fr'); fr.style.aspectRatio = w + ' / ' + hh;
    const im = img(f.img, f.name);
    Object.assign(im.style, { position: 'absolute', padding: '0', objectFit: 'fill', maxWidth: 'none', right: 'auto', bottom: 'auto',
      width: (100 / fw) + '%', height: (100 / fh) + '%', left: (-fx / fw * 100) + '%', top: (-fy / fh * 100) + '%' });
    fr.append(im); wrap.append(fr); return wrap;
  }

  /* ---------- base screen ---------- */
  // Layout of the real Infinity Base seen from above, in a 400 x 330 box:
  // hexagon pad top center, Player 1 pad lower left, Player 2 pad lower right.
  // hexes use circumradius r (pointy top): width 1.732r, height 2r
  const PADS = { 2: [200, 98, 70], 0: [102, 236, 68], 1: [298, 236, 68] };
  const MINIHEX = { 7: [84, 82, 26], 8: [316, 82, 26] };
  const DISCS = { 3: [66, 344, 21], 4: [138, 344, 21], 5: [262, 344, 21], 6: [334, 344, 21] };
  const VW = 400, VH = 372;
  function pos(el, [cx, cy, r], hex) {
    const w = hex ? r * Math.sqrt(3) : 2 * r;
    Object.assign(el.style, { left: ((cx - w / 2) / VW * 100) + '%', top: ((cy - r) / VH * 100) + '%', width: (w / VW * 100) + '%' });
    return el;
  }
  function hexPath(cx, cy, r) {
    const pts = []; for (let k = 0; k < 6; k++) { const a = Math.PI / 180 * (60 * k - 90); pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); }
    return 'M' + pts.join('L') + 'Z';
  }
  function plateSVG() {
    // union of the pads, drawn twice: a fat outline underneath, then the fill
    const shapes = (grow) => {
      const [hx, hy, hr] = PADS[2], j = `stroke-linejoin="round" stroke-width="${44 + grow * 2}"`;
      let g = `<path d="${hexPath(hx, hy, hr + 4)}" ${j}/>`;
      for (const k of [0, 1]) { const [x, y, r] = PADS[k]; g += `<circle cx="${x}" cy="${y}" r="${r + 22 + grow}"/>`; }
      g += `<ellipse cx="200" cy="${PADS[0][1] + 6}" rx="${110 + grow}" ry="${70 + grow}"/>`;
      return g;
    };
    return `<svg class="plate" viewBox="0 0 ${VW} ${VH}" aria-hidden="true">
      <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe6f5"/></linearGradient>
      <radialGradient id="pglow" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#9fd3ff" stop-opacity=".55"/><stop offset="1" stop-color="#9fd3ff" stop-opacity="0"/></radialGradient></defs>
      <g fill="#c9d3ea" stroke="#c9d3ea">${shapes(5)}</g>
      <g fill="url(#pg)" stroke="url(#pg)">${shapes(0)}</g>
      <ellipse cx="200" cy="200" rx="170" ry="140" fill="url(#pglow)"/>
      <path class="well" d="${hexPath(PADS[2][0], PADS[2][1], PADS[2][2] + 8)}"/>
      ${[7, 8].map(k => `<path class="well" d="${hexPath(MINIHEX[k][0], MINIHEX[k][1], MINIHEX[k][2] + 5)}"/>`).join('')}
      <circle class="well p1" cx="${PADS[0][0]}" cy="${PADS[0][1]}" r="${PADS[0][2] + 8}"/>
      <circle class="well p2" cx="${PADS[1][0]}" cy="${PADS[1][1]}" r="${PADS[1][2] + 8}"/>
    </svg>`;
  }
  function build() {
    document.body.innerHTML = '';
    const top = h('div', 'top');
    const brand = h('div', 'brand'); brand.innerHTML = 'Disney <b>Infinity</b> Base';
    const conn = h('div', 'conn'); conn.id = 'conn'; conn.append(h('i'), h('span', '', 'Waiting for the game'));
    top.append(brand, conn);

    const portal = h('div', 'portal'); portal.innerHTML = plateSVG();
    for (const s of [0, 1]) { const b = pos(h('button', 'pad round ' + (s ? 'p2' : 'p1')), PADS[s]); b.dataset.s = s; b.onclick = () => openPick(s); portal.append(b); }
    { const b = pos(h('button', 'pad hex'), PADS[2], true); b.dataset.s = 2; b.onclick = () => openPick(2); portal.append(b); }
    for (const s of [7, 8]) { const b = pos(h('button', 'pad hex mini'), MINIHEX[s], true); b.dataset.s = s; b.onclick = () => openPick(s); portal.append(b); }
    for (const s of [3, 4, 5, 6]) { const b = pos(h('button', 'pad chip ' + (s < 5 ? 'p1' : 'p2')), DISCS[s]); b.dataset.s = s; b.onclick = () => openPick(s); portal.append(b); }

    const names = h('div', 'names');
    names.append(h('div', 'pname p1'), h('div', 'pname hexname'), h('div', 'pname p2'));
    const base = h('div', 'base');
    base.append(portal, names, h('div', 'hint', 'Tap a pad to choose. Small hexes stack extra hex discs; small circles are power discs. Changes apply instantly.'));
    document.body.append(top, base, picker(), h('div', 'toast'));
  }
  function xBtn(s) {
    const x = h('button', 'x', '✕');
    x.onclick = async ev => { ev.stopPropagation(); try { ST = await J('/api/remove?slot=' + s); paint(); toast('Removed'); } catch (e) { toast('Could not reach the PS4'); } };
    return x;
  }
  const LABEL = { 0: 'P1', 1: 'P2', 2: 'PLAY SET', 7: '+', 8: '+', 3: 'DISC', 4: 'DISC', 5: 'DISC', 6: 'DISC' };
  function paint() {
    const conn = $('#conn'); conn.classList.toggle('on', !!ST.c); $('span', conn).textContent = ST.c ? 'Game connected' : 'Waiting for the game';
    document.querySelectorAll('.pad').forEach(b => {
      const s = +b.dataset.s, f = info(ST.s[s]);
      b.innerHTML = ''; b.classList.toggle('empty', !f); b.title = f ? f.name : TITLE[s];
      if (!f) { b.append(h('span', 'lb', LABEL[s])); return; }
      if (s <= 1) b.append(face(f, 'padface'));
      else { const w = h('div', 'art'), im = img(f.img, f.name); if (f.pos) im.style.objectPosition = f.pos; w.append(im); b.append(w); }
      if (s <= 2) b.append(xBtn(s));
    });
    const nm = (s, el) => { const f = info(ST.s[s]); el.innerHTML = ''; el.classList.toggle('empty', !f);
      el.append(h('small', '', s === 2 ? 'Play Set' : 'Player ' + (s + 1)), h('b', '', f ? f.name : 'Empty')); };
    nm(0, $('.pname.p1')); nm(2, $('.pname.hexname')); nm(1, $('.pname.p2'));
  }

  /* ---------- picker ---------- */
  function picker() {
    const p = h('div', 'pick'); p.id = 'pick';
    const ph = h('div', 'ph');
    const row = h('div', 'row'); const back = h('button', 'back', '‹'); back.onclick = closePick;
    const t = h('h2'); t.id = 'pt';
    row.append(back, t);
    const qi = h('input', 'q'); qi.type = 'search'; qi.placeholder = 'Search characters, discs, play sets'; qi.id = 'qi';
    qi.oninput = () => { q = qi.value.trim().toLowerCase(); grid(); };
    const kinds = h('div', 'tabs'); kinds.id = 'kinds';
    const unis = h('div', 'tabs'); unis.id = 'unis';
    const vers = h('div', 'tabs small'); vers.id = 'vers';
    ph.append(row, qi, kinds, unis, vers);
    const g = h('div', 'grid'); g.id = 'grid';
    p.append(ph, g); return p;
  }
  const KINDS = [['char', 'Characters'], ['round', 'Power Discs'], ['hexa', 'Hex Discs'], ['play', 'Play Sets'], ['toy', 'Toy Boxes']];
  function defaultKind(s) { return s <= 1 ? 'char' : (s >= 3 && s <= 6) ? 'round' : 'play'; }
  function tabs() {
    const k = $('#kinds'); k.innerHTML = '';
    KINDS.forEach(([id, n]) => { const b = h('button', 'tab' + (id === kind ? ' on' : ''), n); b.onclick = () => { kind = id; tabs(); grid(); }; k.append(b); });
    const u = $('#unis'); u.innerHTML = '';
    UNI.forEach(([id, n, c]) => { const b = h('button', 'tab' + (id === uni ? ' on' : ''), n); if (c) b.style.setProperty('--c', c); b.onclick = () => { uni = id; tabs(); grid(); }; u.append(b); });
    const v = $('#vers'); v.innerHTML = '';
    [['All versions', -1], ['1.0', 0], ['2.0', 1], ['3.0', 2]].forEach(([n, id]) => { const b = h('button', 'tab' + (id === ver ? ' on' : ''), n); b.onclick = () => { ver = id; tabs(); grid(); }; v.append(b); });
  }
  function matches(f) {
    const k = f.cat === 0 ? 'char' : f.cat === 1 ? 'play' : f.cat === 3 ? 'toy' : f.disc;
    if (f.variant) return false;               // hide Crystal and Light FX duplicates
    if (f.cat === 1 && !PLAYABLE_SETS.some(r => r.test(f.raw)) && !TEST_SETS.test(f.raw)) return false;
    if (LOCKED.test(f.raw)) return false;
    if (f.cat === 3 && BROKEN_TOYBOX.test(f.raw)) return false;
    if (f.cat === 0 && BROKEN_CHARS.test(f.raw)) return false;      // tested 2026-11-25: still asks for the dead activation code
    if (!q && k !== kind) return false;
    if (uni !== 'all' && f.uni !== uni) return false;
    if (ver >= 0 && f.ver !== ver) return false;
    if (q && f.raw.toLowerCase().indexOf(q) < 0) return false;
    return true;
  }
  function grid() {
    const g = $('#grid'); g.innerHTML = ''; let n = 0;
    const on = ST.s[cur];
    LIB.map((_, i) => info(i)).filter(matches)
      .sort((a, b) => a.uni.localeCompare(b.uni) || a.franchise.localeCompare(b.franchise) || a.name.localeCompare(b.name))
      .forEach(f => {
        const c = h('button', 'card' + (f.disc ? ' ' + f.disc : '') + (f.i === on ? ' cur' : ''));
        c.style.setProperty('--c', colorOf(f.uni));
        if (f.cat === 0) { c.classList.add('char'); c.append(face(f)); }
        else if (f.cat === 1 || f.cat === 3) {          // play sets and toy boxes: wide poster cards
          c.classList.add('poster'); const im = img(f.img, f.name); if (f.pos) im.style.objectPosition = f.pos; c.append(im);
        } else c.append(img(f.img, f.name));
        c.append(h('span', 'v', VER[f.ver]));
        if (f.variant) c.append(h('span', 'vr', f.variant));
        const cn = h('div', 'cn', f.name.replace(/ Play Set$/, '')); cn.append(h('small', '', f.kindOf || (f.cat === 3 ? 'Toy Box Game' : f.cat === 1 ? (TEST_SETS.test(f.raw) ? VER[f.ver] + ' Play Set' : 'Play Set') : f.franchise))); c.append(cn);
        c.onclick = () => place(f);
        g.append(c); n++;
      });
    if (!n) g.append(h('div', 'none', 'Nothing matches'));
    g.scrollTop = 0;
  }
  async function place(f) {
    try { ST = await J('/api/place?slot=' + cur + '&id=' + f.i); paint(); closePick(); toast(f.name + ' → ' + TITLE[cur]); }
    catch (e) { toast('Could not reach the PS4'); }
  }
  function openPick(s) {
    cur = s; kind = defaultKind(s); uni = 'all'; ver = -1; q = '';
    $('#qi').value = '';
    const t = $('#pt'); t.textContent = 'Choose'; t.prepend(h('small', '', TITLE[s]));
    tabs(); grid(); $('#pick').classList.add('on');
    history.pushState({ pick: 1 }, '');
  }
  function closePick() { const p = $('#pick'); if (p.classList.contains('on')) { p.classList.remove('on'); if (history.state && history.state.pick) history.back(); } }
  window.addEventListener('popstate', () => $('#pick').classList.remove('on'));

  let tt; function toast(m) { const t = $('.toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 1800); }

  async function poll() { try { ST = await J('/api/state'); paint(); } catch (e) { const c = $('#conn'); c.classList.remove('on'); $('span', c).textContent = 'PS4 not reachable'; } setTimeout(poll, 2500); }
  async function start() {
    build();
    for (let k = 0; k < 20 && !LIB.length; k++) { try { LIB = await J('/api/lib'); } catch (e) { await new Promise(r => setTimeout(r, 1500)); } }
    paint(); poll();
  }
  window.INF_SELECT_LOADED = true;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

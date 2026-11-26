/* Disney Infinity character select for the infinity-base-ps4 GoldHEN plugin.
   Loaded by a small stub page served from the PS4 (port 8080), so every /api call
   below is same-origin with the plugin. */
(function () {
  const IMG = window.INF_IMG || {};
  const VER = ['1.0', '2.0', '3.0'];
  // plugin slot ids
  const SLOT = { P1: 0, P2: 1, HEX: [2, 7, 8], D1: [3, 4], D2: [5, 6] };
  const TITLE = { 0: 'Player 1', 1: 'Player 2', 2: 'Hexagon 1', 7: 'Hexagon 2', 8: 'Hexagon 3',
    3: 'Player 1 · Disc 1', 4: 'Player 1 · Disc 2', 5: 'Player 2 · Disc 1', 6: 'Player 2 · Disc 2' };
  const UNI = [
    ['all', 'All', ''], ['disney', 'Disney', 'var(--disney)'], ['pixar', 'Pixar', 'var(--pixar)'],
    ['marvel', 'Marvel', 'var(--marvel)'], ['starwars', 'Star Wars', 'var(--starwars)']];
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
    else { franchise = ''; name = raw.replace(/\s*\(.*?\)\s*/g, ' ').trim(); }
    const m = name.match(/\((Crystal|Light FX)\)/i);
    if (m) { variant = m[1]; name = name.replace(m[0], '').trim(); }
    const all = raw;
    const u = SW.test(all) ? 'starwars' : MARVEL.test(all) ? 'marvel' : PIXAR.test(all) ? 'pixar' : 'disney';
    // round discs = abilities; hex discs = toys and customization
    const disc = e[1] === 2 ? (/^Ability/i.test(kindOf) ? 'round' : 'hexa') : '';
    return { i, raw, name, franchise, kindOf, variant, cat: e[1], ver: e[2], uni: u, disc, img: IMG[raw] || '' };
  }
  const colorOf = u => (UNI.find(x => x[0] === u) || [])[2] || 'var(--other)';

  function img(src, alt) {
    const im = h('img'); im.alt = alt || ''; im.loading = 'lazy'; im.referrerPolicy = 'no-referrer'; im.decoding = 'async';
    if (src) im.src = src; im.onerror = () => im.remove(); return im;
  }

  /* ---------- base screen ---------- */
  function build() {
    document.body.innerHTML = '';
    const top = h('div', 'top');
    const brand = h('div', 'brand'); brand.innerHTML = 'Disney <b>Infinity</b> Base';
    const conn = h('div', 'conn'); conn.id = 'conn'; conn.append(h('i'), h('span', '', 'Waiting for the game'));
    top.append(brand, conn);

    const base = h('div', 'base');
    const players = h('div', 'players');
    players.append(plCard(0, 'p1', 'P1'), plCard(1, 'p2', 'P2'));
    const discs = h('div', 'discs');
    [[3, 'p1'], [4, 'p1'], [5, 'p2'], [6, 'p2']].forEach(([s, c]) => discs.append(discCard(s, c)));
    const hs = h('div', 'sec', 'Hexagon · Play Sets, Toy Boxes, Toys');
    const hexs = h('div', 'hexs');
    SLOT.HEX.forEach((s, n) => hexs.append(hexCard(s, n + 1)));
    const ds = h('div', 'sec', 'Power Discs');
    base.append(players, ds, discs, hs, hexs, h('div', 'hint', 'Tap any slot to choose. Changes apply instantly, even mid game.'));

    document.body.append(top, base, picker(), h('div', 'toast'));
  }
  function plCard(s, c, tag) {
    const b = h('button', 'pl ' + c); b.dataset.s = s; b.onclick = () => openPick(s);
    return b;
  }
  function discCard(s, c) { const b = h('button', 'disc ' + c); b.dataset.s = s; b.onclick = () => openPick(s); return b; }
  function hexCard(s, n) {
    const w = h('div'); const b = h('button', 'hx'); b.dataset.s = s; b.onclick = () => openPick(s);
    b.append(h('div', 'in')); w.append(b, h('div', 'slotname')); w.dataset.n = n; return w;
  }
  function xBtn(s) {
    const x = h('button', 'x', '✕');
    x.onclick = async ev => { ev.stopPropagation(); try { ST = await J('/api/remove?slot=' + s); paint(); toast('Removed'); } catch (e) { toast('Could not reach the PS4'); } };
    return x;
  }
  function paint() {
    const conn = $('#conn'); conn.classList.toggle('on', !!ST.c); $('span', conn).textContent = ST.c ? 'Game connected' : 'Waiting for the game';
    document.querySelectorAll('.pl').forEach(b => {
      const s = +b.dataset.s, f = info(ST.s[s]); b.innerHTML = '';
      b.classList.toggle('empty', !f);
      b.append(h('span', 'tag', s === 0 ? 'P1' : 'P2'));
      if (f) { b.append(img(f.img, f.name)); const n = h('div', 'nm', f.name); n.prepend(h('small', '', f.franchise)); b.append(n, xBtn(s)); }
      else { b.append(h('div', 'plus', '+'), h('div', 'nm', 'Choose a character')); }
    });
    document.querySelectorAll('.disc').forEach(b => {
      const s = +b.dataset.s, f = info(ST.s[s]); b.innerHTML = '';
      if (f) { b.append(img(f.img, f.name), xBtn(s)); b.title = f.name; }
      else b.append(h('div', 'lb', (s < 5 ? 'P1' : 'P2') + '\nDISC'));
    });
    document.querySelectorAll('.hexs > div').forEach(w => {
      const b = $('.hx', w), s = +b.dataset.s, f = info(ST.s[s]), inn = $('.in', b);
      inn.innerHTML = ''; b.querySelector('.x')?.remove();
      b.classList.toggle('empty', !f);
      if (f) { inn.append(img(f.img, f.name)); b.append(xBtn(s)); }
      else inn.append(h('div', 'lb', 'HEX ' + w.dataset.n));
      $('.slotname', w).textContent = f ? f.name : 'Empty';
    });
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
        c.append(img(f.img, f.name));
        c.append(h('span', 'v', VER[f.ver]));
        if (f.variant) c.append(h('span', 'vr', f.variant));
        const cn = h('div', 'cn', f.name); cn.append(h('small', '', f.kindOf || f.franchise || 'Play Set')); c.append(cn);
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

'use strict';
/* =========================================================
   THE LIST — UI, input & main loop
   ========================================================= */
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const money = n => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-GB');
const rgb = c => `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;

const UI = {
  marker: null, markerT: 0, mm: null, mmFloors: null, prevCam: null,

  init() {
    for (const e of document.querySelectorAll('button, .tap, small, b')) if (e.innerHTML.indexOf('{i:') >= 0) e.innerHTML = e.innerHTML;
    this.hud = $('#hud'); this.sheet = $('#sheet'); this.toasts = $('#toasts');
    $('#btnPause').onclick = () => this.pause();
    $('#btnRun').onclick = () => { Game.P.run = !Game.P.run; $('#btnRun').classList.toggle('on', Game.P.run); };
    $('#btnDrop').onclick = () => Game.dropBody();
    $('#btnDet').onclick = () => Game.detonate();
    $('#btnOpp').onclick = () => this.showOpps();
    $('#btnInst').onclick = () => Game.toggleInstinct();
    $('#btnMed').onclick = () => { if (Game.hasItem('medkit')) { Game.useItem('medkit'); Game.P.hp = Game.P.maxHp; this.toast('Health restored'); this.refreshButtons(); } };
    document.querySelectorAll('[data-st]').forEach(b => b.onclick = () => this.openStation(b.dataset.st));
    document.addEventListener('pointerdown', e => { Sfx.unlock(); if (!e.target.closest('#ctx')) this.closeCtx(); if (e.target.closest('button, .card, .city, .opt, .day')) Sfx.play('click'); }, true);
    document.addEventListener('contextmenu', e => e.preventDefault());
    $('#bDaily').onclick = () => this.daily();
    $('#bChal').onclick = () => this.challenges();
    $('#bAch').onclick = () => this.achievements();
    $('#bSet').onclick = () => this.settings();
    $('#agentCard').onclick = () => this.career();
  },

  /* ---------- title ---------- */
  showTitle() {
    this.hideAll(); $('#title').classList.remove('hidden');
    const tb = $('.tbtns'); tb.classList.add('hidden'); $('#tapStart').classList.remove('hidden');
    $('#title').onclick = () => {
      if (!$('#tapStart').classList.contains('hidden')) {
        $('#tapStart').classList.add('hidden'); tb.classList.remove('hidden'); Sfx.unlock(); Sfx.play('whoosh');
        try { const d = document.documentElement; if (matchMedia('(pointer:coarse)').matches && d.requestFullscreen && !document.fullscreenElement) d.requestFullscreen({ navigationUI: 'hide' }).catch(() => { }); } catch (e) { }
      }
    };
    $('#btnContinue').style.display = Game.S.created ? '' : 'none';
    $('#btnContinue').onclick = e => { e.stopPropagation(); $('#title').classList.add('hidden'); this.showHideout(); this.autoDaily(); };
    $('#btnNew').onclick = () => {
      const go = () => { Game.S = Game.newSave(); Progress.ensure(); Game.save(); Game.enterHideout(); $('#title').classList.add('hidden'); this.openStation('wardrobe', true); };
      if (Game.S.created) this.confirm('Start a new career? Your current progress will be erased.', go); else go();
    };
    $('#btnSettings').onclick = () => this.settings();
  },
  clearFx() { for (const p of this.popups || []) p.e.remove(); this.popups = []; $('#bubbles').innerHTML = ''; },
  hideAll() { this.clearFx && this.clearFx(); ['#title', '#hhud', '#mhud', '#result', '#killflash', '#letterbox', '#instfx'].forEach(s => $(s).classList.add('hidden')); this.closeSheet(); },

  /* ---------- hideout ---------- */
  showHideout() {
    this.hideAll();
    if (!Game.S.created) { $('#title').classList.remove('hidden'); }
    $('#hhud').classList.remove('hidden');
    this.refreshMoney();
  },
  refreshMoney() {
    this.tweenMoney(Game.S.money);
    $('#hName').textContent = HIDE_NAMES[Game.S.lv.hide];
    const P = Game.S.prog;
    $('#hTok').textContent = P.tokens; $('#hTokP').style.display = P.tokens ? '' : 'none';
    $('#aLvl').textContent = P.level; $('#aXp').style.width = Math.min(100, P.xp / xpForLevel(P.level) * 100) + '%';
    drawPortrait($('#aPortrait'), Game.S.look, 'suit');
    const pd = Progress.pending();
    $('#bDaily').classList.toggle('dot', pd.daily); $('#bChal').dataset.n = pd.ch || ''; $('#bAch').dataset.n = pd.ach || '';
  },

  openStation(st, creator) {
    if (Game.mode !== 'hideout') return;
    this.creator = !!creator;
    this.prevCam = Object.assign({}, Engine.cam);
    if (st === 'wardrobe') { Game.P.face = Math.PI; Game.P.path = null; Engine.cam.yaw = Math.PI; Engine.cam.pitch = 0.18; Engine.cam.dist = 4.2; this.camOffset = true; }
    const fn = { wardrobe: () => this.wardrobe(), armory: () => this.armory(), gear: () => this.gear(), contracts: () => this.contracts(), upgrades: () => this.upgrades() }[st];
    fn && fn();
  },
  openSheet(title, body, opts) {
    opts = opts || {};
    const s = this.sheet;
    const ob = s.querySelector('.sh-body');
    const same = !s.classList.contains('hidden') && s.dataset.title === title;
    const keep = same && ob ? ob.scrollTop : 0;
    s.innerHTML = ''; s.dataset.title = title;
    s.className = 'sheet' + (opts.side ? ' side' : '') + (opts.wide ? ' wide' : '');
    const h = el('div', 'sh-head'); h.appendChild(el('div', 'sh-title', title));
    const right = el('div', 'sh-right');
    if (opts.money !== false) right.appendChild(el('div', 'pill money', money(Game.S.money)));
    if (!opts.noClose) { const x = el('button', 'x', '{i:x}'); x.onclick = () => this.closeSheet(); right.appendChild(x); }
    h.appendChild(right); s.appendChild(h);
    const b = el('div', 'sh-body'); if (typeof body === 'string') b.innerHTML = body; else b.appendChild(body); s.appendChild(b);
    if (opts.foot) { const f = el('div', 'sh-foot'); f.appendChild(opts.foot); s.appendChild(f); }
    s.classList.remove('hidden');
    if (same) { b.scrollTop = keep; requestAnimationFrame(() => { b.scrollTop = keep; }); }
    else { s.classList.remove('anim'); void s.offsetWidth; s.classList.add('anim'); if (!opts.quiet) Sfx.play('open'); }
    return b;
  },
  closeSheet() {
    this.sheet.classList.add('hidden'); this.sheet.innerHTML = '';
    if (this.prevCam && Game.mode === 'hideout') { Object.assign(Engine.cam, { yaw: this.prevCam.yaw, pitch: this.prevCam.pitch, dist: this.prevCam.dist }); }
    this.prevCam = null; this.camOffset = false;
    if (Game.mode === 'hideout') this.refreshMoney();
  },
  buy(price, fn) {
    if (Game.S.money < price) { this.toast('Not enough money', 'bad'); return; }
    Game.S.money -= price; fn(); Game.save(); this.refreshMoney();
  },

  wardrobe(tab) {
    tab = tab || 'look';
    const S = Game.S, L = S.look;
    const wrap = el('div');
    const tabs = el('div', 'tabs');
    for (const [k, n] of [['look', 'Look'], ['suits', 'Outfits'], ['acc', 'Accessories']]) { const t = el('button', 'tab' + (k === tab ? ' on' : ''), n); t.onclick = () => this.wardrobe(k); tabs.appendChild(t); }
    wrap.appendChild(tabs);
    const row = (label, items, cur, render, onPick) => {
      const r = el('div', 'row'); r.appendChild(el('div', 'row-l', label));
      const c = el('div', 'chips');
      items.forEach((it, i) => { const b = render(it, i); if ((typeof cur === 'function' ? cur(it, i) : cur === it)) b.classList.add('on'); b.onclick = () => { onPick(it, i); Game.save(); this.wardrobe(tab); }; c.appendChild(b); });
      r.appendChild(c); wrap.appendChild(r);
    };
    const sw = col => { const b = el('button', 'sw'); b.style.background = rgb(col); return b; };
    const chip = txt => el('button', 'chip', txt);
    if (tab === 'look') {
      row('Skin', SKINS, (it, i) => i === L.skin, sw, (it, i) => L.skin = i);
      row('Hair', HAIR_STYLES, L.hair, h => chip(HAIR_NAMES[h]), h => L.hair = h);
      row('Hair colour', HAIR_COLS, (it, i) => i === L.hairCol, sw, (it, i) => L.hairCol = i);
      row('Facial hair', BEARDS, L.beard, b => chip(BEARD_NAMES[b]), b => L.beard = b);
      row('Scars', SCARS, L.scar || 'none', b => chip(SCAR_NAMES[b]), b => L.scar = b);
      row('Eyewear', EYEWEAR, L.eye, e => chip({ none: 'None', shades: 'Shades', glasses: 'Glasses' }[e]), e => L.eye = e);
      row('Tie', TIES, (it, i) => i === L.tie, sw, (it, i) => L.tie = i);
      row('Gloves', [false, true], L.gloves, g => chip(g ? 'Leather gloves' : 'Bare hands'), g => L.gloves = g);
    } else if (tab === 'acc') {
      const stars = Progress.statVal('stars');
      wrap.appendChild(el('p', 'hint', `Mastery stars earned: <b>${stars}</b>. Some accessories need stars to unlock. Gloves show when "Leather gloves" is on in the Look tab.`));
      for (const slot of Object.keys(ACCESSORIES)) {
        const A = ACCESSORIES[slot], r = el('div', 'row'); r.appendChild(el('div', 'row-l', A.name));
        const c = el('div', 'chips');
        for (const it of A.items) {
          const key = slot + ':' + it.id, own = !it.price || S.unlocked.acc.includes(key), lock = it.stars && stars < it.stars, on = L.acc[slot] === it.id;
          const b = el('button', 'chip' + (on ? ' on' : ''), `${it.col ? `<i class="dotc" style="background:${rgb(it.col)}"></i>` : ''}${it.name}${own ? '' : lock ? ` · {i:lock}${it.stars}{i:star}` : ` · ${money(it.price)}`}`);
          b.onclick = () => { if (own) { L.acc[slot] = it.id; Game.save(); this.wardrobe('acc'); } else if (lock) this.toast(`Needs ${it.stars} mastery stars`, 'bad'); else this.buy(it.price, () => { S.unlocked.acc.push(key); L.acc[slot] = it.id; this.wardrobe('acc'); }); };
          c.appendChild(b);
        }
        r.appendChild(c); wrap.appendChild(r);
      }
    } else {
      const grid = el('div', 'cards');
      for (const s of SUITS) {
        const own = S.unlocked.suits.includes(s.id);
        if (s.exclusive && !own) { const c = el('div', 'card locked'); c.innerHTML = `<div class="suit-sw"><span style="background:${rgb(s.jacket)}"></span><span style="background:${rgb(s.shirt)}"></span><span style="background:${rgb(s.pants)}"></span></div><div class="c-name">${s.name}</div><div class="c-sub">{i:gift} Day 7 daily reward</div>`; grid.appendChild(c); continue; }
        const c = el('div', 'card' + (L.suit === s.id ? ' on' : ''));
        c.innerHTML = `<div class="suit-sw"><span style="background:${rgb(s.jacket)}"></span><span style="background:${rgb(s.shirt)}"></span><span style="background:${rgb(s.pants)}"></span></div><div class="c-name">${s.name}</div><div class="c-sub">${own ? (L.suit === s.id ? 'Wearing' : 'Owned') : money(s.price)}</div>`;
        c.onclick = () => { if (own) { L.suit = s.id; Game.save(); this.wardrobe(tab); } else this.buy(s.price, () => { S.unlocked.suits.push(s.id); L.suit = s.id; this.wardrobe(tab); }); };
        grid.appendChild(c);
      }
      wrap.appendChild(grid);
    }
    let foot = null;
    if (this.creator) { foot = el('button', 'btn primary', 'This Is Me'); foot.onclick = () => { S.created = true; Game.save(); this.creator = false; this.closeSheet(); this.showHideout(); this.toast('Welcome to your safehouse, Agent.', 'big');
        setTimeout(() => this.confirm('Play the training mission? It teaches movement, disguises and kills in about 3 minutes.', () => this.loading(() => Tutorial.start())), 700); }; }
    this.openSheet(this.creator ? 'Who You Are' : 'Wardrobe', wrap, { side: true, foot, noClose: this.creator, money: !this.creator });
  },

  armory() {
    const S = Game.S, wrap = el('div', 'list');
    wrap.appendChild(el('p', 'hint', 'One weapon slot. Whatever you buy from the fence comes with you on every job.'));
    for (const w of SHOP_WEAPONS) {
      const it = ITEMS[w.id], own = S.unlocked.weapons.includes(w.id), eq = S.loadout.weapon === w.id;
      const r = el('div', 'li' + (eq ? ' on' : ''));
      r.innerHTML = `<div class="li-ic">${it.icon}</div><div class="li-t"><b>${it.name}</b><span>${it.desc}</span></div>`;
      const b = el('button', 'btn sm ' + (own ? '' : 'primary'), own ? (eq ? 'Equipped' : 'Equip') : money(w.price));
      b.onclick = () => { if (own) { S.loadout.weapon = eq ? null : w.id; Game.save(); this.armory(); } else this.buy(w.price, () => { S.unlocked.weapons.push(w.id); S.loadout.weapon = w.id; this.armory(); }); };
      r.appendChild(b); wrap.appendChild(r);
    }
    this.openSheet('The Fence', wrap, { side: true });
  },
  gear() {
    const S = Game.S, wrap = el('div', 'list');
    const slots = Game.gearSlots();
    wrap.appendChild(el('p', 'hint', `Loadout: ${S.loadout.gear.length}/${slots} gear slots. Buy gear once, then pick what you carry in.`));
    for (const g of SHOP_GEAR) {
      const it = ITEMS[g.id], own = S.unlocked.gear.includes(g.id), on = S.loadout.gear.includes(g.id);
      const r = el('div', 'li' + (on ? ' on' : ''));
      r.innerHTML = `<div class="li-ic">${it.icon}</div><div class="li-t"><b>${it.name}</b><span>${it.desc}</span></div>`;
      const b = el('button', 'btn sm ' + (own ? '' : 'primary'), own ? (on ? 'Packed' : 'Pack') : money(g.price));
      b.onclick = () => {
        if (!own) return this.buy(g.price, () => { S.unlocked.gear.push(g.id); if (S.loadout.gear.length < slots) S.loadout.gear.push(g.id); this.gear(); });
        if (on) S.loadout.gear = S.loadout.gear.filter(x => x !== g.id);
        else if (S.loadout.gear.length < slots) S.loadout.gear.push(g.id); else this.toast('No free gear slots — upgrade at the terminal', 'bad');
        Game.save(); this.gear();
      };
      r.appendChild(b); wrap.appendChild(r);
    }
    this.openSheet('Kit Bag', wrap, { side: true });
  },
  upgrades() {
    const S = Game.S, wrap = el('div', 'list');
    for (const k of ['hide', 'slots', 'armor', 'intel']) {
      const U = UPGRADES[k], lv = S.lv[k], next = U.levels[lv];
      const r = el('div', 'li');
      const cur = k === 'hide' ? HIDE_NAMES[lv] : lv ? U.levels[lv - 1].label : 'Base';
      r.innerHTML = `<div class="li-ic">${{ hide: '{i:home}', slots: '{i:bag}', armor: '{i:vest}', intel: '{i:antenna}' }[k]}</div><div class="li-t"><b>${U.name}</b><span>Current: ${cur}${next ? ' → Next: ' + next.label : ''}</span></div>`;
      const b = el('button', 'btn sm ' + (next ? 'primary' : ''), next ? money(next.price) : 'MAX');
      b.disabled = !next;
      b.onclick = () => next && this.buy(next.price, () => { S.lv[k]++; this.toast(`${U.name} upgraded`, 'good'); if (k === 'hide') { this.closeSheet(); Game.enterHideout(); this.toast(`Welcome to the ${HIDE_NAMES[S.lv.hide]}`, 'big'); } else this.upgrades(); });
      r.appendChild(b); wrap.appendChild(r);
    }
    const st = S.stats;
    wrap.appendChild(el('p', 'hint', `Career: ${st.contracts} contracts · ${st.s} S-ranks · ${money(st.earned)} earned`));
    this.openSheet('Rebuild', wrap, { side: true });
  },
  contracts() {
    const S = Game.S, grid = el('div', 'cities');
    CITIES.forEach((c, i) => {
      const un = Game.cityUnlocked(i), best = S.best[c.id];
      const d = el('div', 'city' + (un ? '' : ' locked') + ' t-' + c.time);
      const mc = Progress.masteryCount(i);
      d.innerHTML = `<div class="city-n">${String(i + 1).padStart(2, '0')} · ${resolveLayout(c).name}</div><div class="city-name">${c.name}</div><div class="city-v">${un ? c.venue : 'Locked — complete ' + CITIES[i - 1].name}</div>${un ? `<div class="stars">${'{i:star}'.repeat(mc)}<i>${'{i:star}'.repeat(MASTERY.length - mc)}</i></div>` : ''}${best ? `<div class="rank r-${best}">${best}</div>` : ''}`;
      if (un) d.onclick = () => this.briefing(i);
      grid.appendChild(d);
    });
    this.openSheet('Contracts', grid, { wide: true });
  },
  briefing(ci, intel) {
    intel = intel || 0;
    const C = Game.contractFor(ci), city = CITIES[ci], S = Game.S;
    const wrap = el('div', 'brief');
    const top = el('div', 'b-top');
    const cv = el('canvas', 'portrait'); cv.width = 96; cv.height = 96; drawPortrait(cv, C.looks, C.outfit);
    top.appendChild(cv);
    const info = el('div', 'b-info');
    const LYb = resolveLayout(city);
    info.innerHTML = `<div class="b-city">${city.name}, ${city.country} · ${city.time} · ${LYb.name}, ${LYb.floors.length} floors</div><div class="b-name">${C.name}</div><div class="b-title">${C.title}</div><div class="b-venue">${city.venue}</div>`;
    top.appendChild(info); wrap.appendChild(top);
    wrap.appendChild(el('p', 'b-blurb', city.blurb + ` The target is wearing ${describeLooks(C.looks, C.outfit)}.${C.bodyguard ? ' Travels with a bodyguard.' : ''}`));
    const m = METHODS.find(x => x.id === C.method);
    { const m = Progress.mastery(ci); wrap.appendChild(el('div', 'mast', MASTERY.map(x => `<span class="${m[x.id] ? 'ok' : ''}">${m[x.id] ? '{i:check}' : '○'} ${x.name}</span>`).join(''))); }
    wrap.appendChild(el('div', 'b-grid', `
      <div><span>Fee</span><b>${money(C.fee)}</b></div>
      <div><span>Preferred kill</span><b>${m.name}${C.method !== 'any' ? ' (+30%)' : ''}</b></div>
      <div><span>Ghost</span><b>+40%</b></div>
      <div><span>Own Clothes Only</span><b>+15%</b></div>`));
    // intel
    const it = el('div', 'intel');
    it.appendChild(el('div', 'sec', 'Iris\'s Intel'));
    const opts = [[0, 'Go in blind', 'Target only marked when you see them.'], [1, 'Target Intel', 'Target tracked at all times + their schedule.'], [2, 'Full Guidance', 'Everything above + step-by-step kill opportunities and item markers.']];
    for (const [t, n, d] of opts) {
      const tok = t && S.prog.tokens > 0;
      const price = t && !tok ? Game.intelPrice(t) : 0;
      const b = el('div', 'opt' + (intel === t ? ' on' : ''));
      b.innerHTML = `<b>${n}</b><span>${d}</span><em>${tok ? '{i:ticket} Token' : price ? money(price) : 'Free'}</em>`;
      b.onclick = () => { if (price > S.money) { this.toast('Not enough money', 'bad'); return; } this.briefing(ci, t); };
      it.appendChild(b);
    }
    wrap.appendChild(it);
    // loadout
    const lo = el('div', 'lo');
    lo.appendChild(el('div', 'sec', 'Loadout'));
    const items = [S.loadout.weapon].concat(S.loadout.gear.slice(0, Game.gearSlots())).filter(Boolean);
    lo.appendChild(el('div', 'lo-items', items.map(i => `<span>${ITEMS[i].icon} ${ITEMS[i].name}</span>`).join('') || '<span>Nothing</span>'));
    const lb = el('div', 'lo-btns');
    const b1 = el('button', 'btn sm', 'Change weapon'); b1.onclick = () => { this.armory(); this.backTo = () => this.briefing(ci, intel); this.addBack(); };
    const b2 = el('button', 'btn sm', 'Change gear'); b2.onclick = () => { this.gear(); this.backTo = () => this.briefing(ci, intel); this.addBack(); };
    const b3 = el('button', 'btn sm', '{i:dice} New contract'); b3.onclick = () => { Game.rerollContract(ci); this.briefing(ci, intel); };
    lb.append(b1, b2, b3); lo.appendChild(lb); wrap.appendChild(lo);
    const foot = el('div', 'foot2');
    const back = el('button', 'btn', 'Back'); back.onclick = () => this.contracts();
    const go = el('button', 'btn primary', `Start Mission${intel ? ' · ' + (S.prog.tokens > 0 ? '{i:ticket}' : money(Game.intelPrice(intel))) : ''}`);
    go.onclick = () => { this.closeSheet(); this.loading(() => Game.startMission(ci, intel)); };
    foot.append(back, go);
    this.openSheet('Briefing', wrap, { wide: true, foot });
  },
  addBack() {
    const h = this.sheet.querySelector('.sh-right');
    const b = el('button', 'btn sm', '← Briefing'); b.onclick = () => { const f = this.backTo; this.backTo = null; f && f(); };
    h.prepend(b);
  },
  loading(fn) {
    const l = $('#loading'); l.classList.remove('hidden');
    setTimeout(() => { try { fn(); } catch (e) { console.error(e); this.toast('Error: ' + e.message, 'bad'); } l.classList.add('hidden'); }, 60);
  },

  /* ---------- mission HUD ---------- */
  showMission() {
    this.hideAll();
    $('#mhud').classList.remove('hidden');
    const C = Game.C;
    drawPortrait($('#tPortrait'), C.looks, C.outfit);
    $('#tName').textContent = C.name;
    $('#btnOpp').style.display = C.intel >= 2 ? '' : 'none';
    $('#btnRun').classList.remove('on');
    this.refreshInv(); this.refreshButtons(); this.buildMinimap();
  },
  refreshInv() {
    const bar = $('#inv'); if (!bar || !Game.P) return;
    bar.innerHTML = '';
    Game.P.inv.forEach((it, i) => {
      const d = el('button', 'slot' + (Game.P.held === i ? ' held' : '') + (ITEMS[it.id].illegal ? ' ill' : ''));
      d.innerHTML = `<span class="ic">${ITEMS[it.id].icon}</span>${it.n > 1 ? `<span class="n">${it.n}</span>` : ''}<span class="nm">${ITEMS[it.id].name}</span>`;
      d.onclick = () => {
        if (it.id === 'medkit') { $('#btnMed').click(); return; }
        Game.P.held = Game.P.held === i ? -1 : i; this.refreshInv();
        const h = Game.heldItem();
        if (h) this.toast(h.id === 'coin' ? 'Coin ready — tap the ground to throw' : h.id === 'charge' ? 'Tap the ground to place the charge' : `Holding ${ITEMS[h.id].name}${ITEMS[h.id].illegal ? ' (visible — suspicious!)' : ''}`);
      };
      bar.appendChild(d);
    });
    if (!Game.P.inv.length) bar.appendChild(el('div', 'empty', 'No items'));
    $('#disg') && ($('#disg').textContent = OUTFIT_NAMES[Game.P.outfit]);
    this.refreshButtons();
  },
  refreshButtons() {
    if (Game.mode !== 'mission') return;
    $('#btnDrop').style.display = Game.P.carrying ? '' : 'none';
    $('#btnDet').style.display = Game.props.some(p => p.type === 'charge' && !p.gone) ? '' : 'none';
    $('#btnMed').style.display = Game.hasItem('medkit') ? '' : 'none';
  },
  updateHUD(dt) {
    if (this.marker) { this.markerT -= dt; if (this.markerT <= 0) this.marker = null; }
    if (Game.mode !== 'mission') return;
    const P = Game.P, S = Game.stats, t = Game.target, C = Game.C;
    // target status
    const floorName = y => { const f = Game.M.floors; let i = 0; for (let k = 0; k < f.length; k++) if (y >= f[k] - 0.5) i = k; if (y < f[0] + 0.5 && Game.M.building && !(t.x >= Game.M.building.x0 && t.x <= Game.M.building.x1 && t.z >= Game.M.building.z0 && t.z <= Game.M.building.z1)) return 'Outside'; return i === 0 ? 'Ground floor' : i === f.length - 1 ? 'Rooftop' : ['', '1st floor', '2nd floor', '3rd floor', '4th floor', '5th floor'][i]; };
    let st;
    const tl = (Game.targets || []).filter(x => x.state !== 'dead').length;
    if (S.targetDead) st = `<b class="good">ELIMINATED</b> — reach an exit`;
    else if (Game.targets && Game.targets.length > 1 && tl < Game.targets.length) st = `<b class="good">1 down</b>, ${tl} to go · ` + (C.intel >= 1 ? (t.atStop ? Game.M.stops[t.atStop].label : 'Moving') : 'find them');
    else if (t.state === 'escape') st = '<b class="bad">FLEEING</b> to an exit — stop them!';
    else if (t.state === 'ko') st = '<b class="warn">Subdued</b> — finish them';
    else if (C.intel >= 1) { const act = t.atStop ? Game.M.stops[t.atStop].label : t.state === 'sick' ? 'Rushing to the bathroom' : t.state === 'flee' ? 'Panicking!' : 'Moving'; st = `${act} · ${floorName(t.y)}`; }
    else st = Game.targetVisible ? `<b class="warn">In sight</b> · ${floorName(t.y)}` : 'Location unknown';
    if (this._st !== st) { $('#tStatus').innerHTML = st; this._st = st; }
    // zone
    const zone = Game.W.zoneAt(P.x, P.y + 0.1, P.z);
    const ok = ACCESS[P.outfit].includes(zone);
    const zt = (ok ? '' : 'TRESPASSING · ') + ZONE_NAMES[zone];
    if (this._zt !== zt) { const z = $('#zone'); z.textContent = zt; z.className = ok ? '' : 'bad'; this._zt = zt; }
    // awareness
    let mx = 0, hostile = false;
    for (const n of Game.npcs) { if (n.state === 'alert') hostile = true; if (n.seesP && n.state !== 'dead' && n.state !== 'ko') mx = Math.max(mx, n.susp); }
    const aw = $('#aware');
    if (hostile) { aw.className = 'aware hostile'; aw.innerHTML = '<span>HOSTILE</span>'; }
    else if (P.blend) { aw.className = 'aware blend'; aw.innerHTML = '<span>{i:mask} BLENDING IN</span>'; }
    else if (mx > 0.02) { aw.className = 'aware watch'; aw.innerHTML = `<span>{i:eye}</span><i style="width:${Math.round(mx * 100)}%"></i>`; }
    else if (P.illegalT > 0 || (Game.heldItem() && ITEMS[Game.heldItem().id].illegal) || P.carrying) { aw.className = 'aware ill'; aw.innerHTML = '<span>Suspicious action</span>'; }
    else aw.className = 'aware hidden';
    // health
    $('#hpbar i').style.width = (P.hp / P.maxHp * 100) + '%';
    if (Game.inst) $('#instM').style.width = Game.inst.m + '%';
    // action progress
    const ap = $('#actProg');
    if (P.action) { ap.classList.remove('hidden'); ap.style.setProperty('--p', (P.action.t / P.action.dur * 100) + '%'); } else ap.classList.add('hidden');
    // speech bubbles (nearest few)
    this.bubbles();
    // minimap
    this.mmT = (this.mmT || 0) - dt; if (this.mmT <= 0) { this.mmT = 0.15; this.drawMinimap(); }
    // objective
    const obj = S.targetDead ? 'Escape: reach an exit (green beacons)' : `Eliminate ${C.name}${C.method !== 'any' ? ' · Preferred: ' + METHODS.find(m => m.id === C.method).name : ''}`;
    if (this._obj !== obj) { $('#obj').textContent = obj; this._obj = obj; }
  },
  bubbles() {
    const box = $('#bubbles'); const P = Game.P;
    const list = Game.npcs.filter(n => n.say && !n.hidden && n.state !== 'dead' && n.state !== 'ko' && Math.hypot(n.x - P.x, n.z - P.z) < 16 && n.y < Game.cutY + 0.5).slice(0, 6);
    while (box.children.length < list.length) box.appendChild(el('div', 'bub'));
    [...box.children].forEach((b, i) => {
      const n = list[i]; if (!n) { b.style.display = 'none'; return; }
      const s = Engine.project([n.x, n.y + 2.55, n.z]); if (!s) { b.style.display = 'none'; return; }
      b.style.display = ''; b.textContent = n.say; b.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-100%)`;
    });
  },
  tapMarker(p) { this.marker = p; this.markerT = 0.8; },
  flashHit() { const f = $('#hit'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); },

  /* ---------- context menu ---------- */
  contextMenu(sx, sy, ent, opts) {
    const m = $('#ctx'); m.innerHTML = '';
    const cat = propCategory(ent);
    m.style.boxShadow = cat ? `inset 4px 0 0 ${ACT_CSS[cat]}, 0 14px 40px rgba(0,0,0,.6)` : (ent && ent.kind ? `inset 4px 0 0 ${ent.isTarget ? '#ff2a4a' : '#ddd'}, 0 14px 40px rgba(0,0,0,.6)` : '');
    for (const o of opts) {
      if (o.header) { m.appendChild(el('div', 'ctx-h' + (o.dim ? ' dim' : ''), o.label)); continue; }
      const b = el('button', 'ctx-b' + (o.hl ? ' hl' : '') + (o.acc ? ' acc' : ''), `<span>${o.icon || ''}</span>${o.label}`);
      b.onclick = e => { e.stopPropagation(); this.closeCtx(); o.fn(); };
      m.appendChild(b);
    }
    if (!m.querySelector('button')) { const b = el('button', 'ctx-b', '<span>{i:steps}</span>Walk here'); b.onclick = () => { this.closeCtx(); const c = ent.kind ? [ent.x, ent.y, ent.z] : ent.p; Game.walkThen([Math.floor(c[0]), Math.round(c[1]), Math.floor(c[2])], () => { }); }; m.appendChild(b); }
    m.classList.remove('hidden');
    const r = m.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    m.style.left = Math.max(8, Math.min(W - r.width - 8, sx - r.width / 2)) + 'px';
    m.style.top = Math.max(8, Math.min(H - r.height - 90, sy - r.height - 16)) + 'px';
  },
  closeCtx() { $('#ctx').classList.add('hidden'); },

  /* ---------- toasts ---------- */
  toast(msg, cls) {
    const t = el('div', 'toast ' + (cls || ''), msg);
    this.toasts.appendChild(t);
    while (this.toasts.children.length > 4) this.toasts.firstChild.remove();
    setTimeout(() => t.classList.add('out'), cls && cls.includes('big') ? 2600 : 2000);
    setTimeout(() => t.remove(), cls && cls.includes('big') ? 3100 : 2500);
  },
  confirm(msg, yes) {
    const d = $('#modal'); d.innerHTML = ''; const b = el('div', 'mbox');
    b.appendChild(el('p', '', msg));
    const r = el('div', 'mrow'); const n = el('button', 'btn', 'Cancel'); const y = el('button', 'btn primary', 'Confirm');
    n.onclick = () => d.classList.add('hidden'); y.onclick = () => { d.classList.add('hidden'); yes(); };
    r.append(n, y); b.appendChild(r); d.appendChild(b); d.classList.remove('hidden');
  },

  /* ---------- opportunities ---------- */
  showOpps() {
    const C = Game.C; const wrap = el('div', 'opps');
    Game.paused = true;
    for (const s of C.stops) {
      const st = Game.M.stops[s]; let info = STOP_INFO[s];
      if (s === 'signature' && st.sig) { const S = st.sig; info = { kind: S.type === 'poison' ? 'poison' : 'accident', steps: [`Find the ${S.name} (signature kill, red outline)`, S.type === 'rig' ? 'Rig it with a wrench' : S.type === 'poison' ? 'Coat it with lethal poison' : 'Wait until the target stands right under it', S.type === 'drop' ? `Tap it to ${S.verb.toLowerCase()}` : 'Wait for the target to use it'] }; }
      const pr = Game.props.find(p => p.stop === s);
      const ready = pr && (pr.poison || pr.sabotaged);
      const d = el('div', 'opp-c');
      const fy = st.p[1], fl = Game.M.floors; let fi = 0; for (let k = 0; k < fl.length; k++) if (fy >= fl[k] - 0.5) fi = k;
      const fname = fi === fl.length - 1 ? 'Rooftop' : fi === 0 ? (fy < fl[0] + 0.5 && st.p[2] < BZ ? 'Outside' : 'Ground floor') : ['', '1st floor', '2nd floor', '3rd floor', '4th floor', '5th floor'][fi];
      d.innerHTML = `<div class="opp-h"><b>${st.label}</b><em class="${info.kind}">${info.kind}</em></div><div class="hint" style="margin:4px 0 0">{i:pin} ${fname}</div><ol>${info.steps.map(x => `<li>${x}</li>`).join('')}</ol>${ready ? '<div class="good">{i:check} Set up — wait for the target</div>' : ''}`;
      wrap.appendChild(d);
    }
    wrap.appendChild(el('p', 'hint', `Target schedule loops through: ${C.stops.map(s => Game.M.stops[s].label.toLowerCase()).join(' → ')}. Gold beacons mark useful items.`));
    const b = this.openSheet('Opportunities', wrap, { side: true, money: false });
    const x = this.sheet.querySelector('.x'); x.onclick = () => { Game.paused = false; this.closeSheet(); };
  },
  pause() {
    Game.paused = true;
    const wrap = el('div', 'pmenu');
    const mk = (t, fn, cls) => { const b = el('button', 'btn ' + (cls || ''), t); b.onclick = fn; wrap.appendChild(b); };
    const C = Game.C;
    wrap.appendChild(el('div', 'p-info', `<b>${CITIES[C.ci].venue}</b> · ${DIFFS[Game.diff].name}<br>Target${Game.targets.length > 1 ? 's' : ''}: ${Game.targets.map(t => t.name + (t.state === 'dead' ? ' {i:check}' : '')).join(', ')}<br>Time: ${fmtTime(Game.stats.t)} · Spotted: ${Game.stats.spotted ? 'Yes' : 'No'} · Bodies found: ${Game.stats.bodiesFound}`));
    if (C.mode === 'weekly' && C.rules) wrap.appendChild(el('div', 'rules', C.rules.map(id => { const r = WEEKLY_RULES.find(x => x.id === id); const bad = C.broken && C.broken[id]; return `<div class="${bad ? 'bad' : ''}">${bad ? '{i:x}' : '•'} ${r.text}</div>`; }).join('')));
    mk('Resume', () => { Game.paused = false; this.closeSheet(); }, 'primary');
    if (C.mode !== 'elusive') mk('Restart Contract', () => this.confirm('Restart this contract? (Iris\'s intel is not included on restart)', () => { this.closeSheet(); const L = Game.lastLaunch; this.loading(() => Game.startMission(L.ci, 0, L.opts)); }));
    mk('Abort to Hideout', () => this.confirm(C.mode === 'elusive' ? 'Abort? The Elusive Target will be gone until tomorrow.' : 'Abort the contract?', () => { this.closeSheet(); Game.mode = 'mission'; Game.endMission(false, 'Contract aborted'); }));
    mk(`Graphics: ${Game.S.settings.quality === 'high' ? 'High' : Game.S.settings.quality === 'lite' ? 'Lite' : 'Low'}`, () => { this.toggleQuality(); this.closeSheet(); this.pause(); });
    { const BR = [['Normal', 1.2], ['Bright', 1.45], ['Extra Bright', 1.75]]; const st = Game.S.settings; const bi = Math.max(0, BR.findIndex(x => x[1] === (st.bright || 1.2))); mk(`Brightness: ${BR[bi][0]}`, () => { st.bright = BR[(bi + 1) % 3][1]; Engine.exposure = st.bright; Game.save(); this.closeSheet(); this.pause(); }); }
    mk('Controls', () => this.help());
    const b = this.openSheet('Paused', wrap, { money: false });
    this.sheet.querySelector('.x').onclick = () => { Game.paused = false; this.closeSheet(); };
  },
  help() {
    this.openSheet('How to Play', `<div class="help">
      <p><b>Move:</b> tap the ground. <b>Interact:</b> tap a person or object, then pick an action.</p>
      <p><b>Camera:</b> drag to rotate, pinch or scroll to zoom.</p>
      <p><b>Items:</b> tap an item in your bar to hold it. Options that use the held item glow gold. Hold coins and tap the ground to throw them as a distraction.</p>
      <p><b>Instinct ({i:eye} button):</b> see people through walls for a few seconds: target red, guards blue, staff yellow. It recharges over time.</p>
      <p><b>Blending in:</b> white-outlined spots (bar, kitchen, monitors, buffet) let you blend in with the right disguise. Guards won't question you while you blend.</p>
      <p><b>Doors:</b> security doors are locked (orange outline). Use a keycard (staff room, or take one from a guard) or a lockpick (gear shop).</p>
      <p><b>Distractions:</b> yellow-outlined radios, fuse boxes and car alarms lure people away. A fuse box blacks out the floor, so guards see much less.</p>
      <p><b>Object colours:</b> <b style="color:#4cd9ff">Blue</b> = pick up &nbsp; <b style="color:#5cff73">Green</b> = disguise &nbsp; <b style="color:#ff4757">Red</b> = kill opportunity (poison, sabotage, accidents) &nbsp; <b style="color:#c780ff">Purple</b> = hide a body &nbsp; <b style="color:#ffe14d">Yellow</b> = distraction &nbsp; <b style="color:#ececff">White</b> = blend in &nbsp; <b style="color:#ff8a1a">Orange</b> = locked door &nbsp; <b style="color:#f2c14e">Gold beacon</b> = handler guidance &nbsp; <b style="color:#4ade80">Green pillar</b> = exit</p>
      <p><b>Disguises:</b> each outfit opens certain zones. Trespassing makes guards suspicious, and guards in the same uniform can see through your disguise up close.</p>
      <p><b>Ranks:</b> S needs a Ghost run (never spotted, no bodies found, no extra kills, no combat) plus the preferred kill method. Going loud is ranked separately as Wrath: fast, brutal and no innocents.</p>
      <p><b>Escape:</b> once the target is dead, reach a green exit beacon.</p></div>`, { money: false });
    const x = this.sheet.querySelector('.x'); x.onclick = () => { this.closeSheet(); if (Game.mode === 'mission') this.pause(); };
  },
  settings() {
    const wrap = el('div', 'pmenu'), st = Game.S.settings;
    const b = el('button', 'btn', `Graphics: ${st.quality === 'high' ? 'High (shadows)' : st.quality === 'lite' ? 'Lite (old phones)' : 'Low (fast)'}`);
    b.onclick = () => { this.toggleQuality(); this.settings(); };
    const mu = el('button', 'btn', `Music: ${st.music === false ? 'Off' : 'On'}`); mu.onclick = () => { st.music = st.music === false; Sfx.on.music = st.music; Sfx.apply(); Game.save(); this.settings(); };
    const sf = el('button', 'btn', `Sound effects: ${st.sfx === false ? 'Off' : 'On'}`); sf.onclick = () => { st.sfx = st.sfx === false; Sfx.on.sfx = st.sfx; Sfx.apply(); Game.save(); this.settings(); };
    const BR = [['Normal', 1.2], ['Bright', 1.45], ['Extra Bright', 1.75]];
    const bi = Math.max(0, BR.findIndex(x => x[1] === (st.bright || 1.2)));
    const br = el('button', 'btn', `Brightness: ${BR[bi][0]}`); br.onclick = () => { st.bright = BR[(bi + 1) % 3][1]; Engine.exposure = st.bright; Game.save(); this.settings(); };
    const h = el('button', 'btn', 'How to Play'); h.onclick = () => this.help();
    wrap.append(b, br, mu, sf, h);
    if (Game.S.created) { const tu = el('button', 'btn', '{i:cap} Play Training Mission'); tu.onclick = () => { if (Game.mode !== 'hideout') { this.toast('Finish or abort your mission first'); return; } this.closeSheet(); this.loading(() => Tutorial.start()); }; wrap.appendChild(tu); }
    const fc = el('button', 'btn', `Frame rate: ${st.fps === 30 ? '30 FPS (battery saver)' : '60 FPS'}`); fc.onclick = () => { st.fps = st.fps === 30 ? 60 : 30; Game.save(); this.settings(); }; wrap.appendChild(fc);
    if (Game.S.created) { const c = el('button', 'btn', 'Your Record'); c.onclick = () => this.career(); wrap.appendChild(c); }
    if (Game.S.created) { const sv = el('button', 'btn', '{i:save} Save Transfer (backup / restore)'); sv.onclick = () => this.saveTransfer(); wrap.appendChild(sv); }
    this.openSheet('Settings', wrap, { money: false });
  },
  toggleQuality() { const s = Game.S.settings; s.quality = s.quality === 'high' ? 'low' : s.quality === 'low' ? 'lite' : 'high'; Engine.quality = s.quality; Engine.resize(); Game.save(); },

  /* ---------- result ---------- */
  showResult(res) {
    this.hideAll();
    const r = $('#result'); r.classList.remove('hidden');
    const lines = res.lines.map(([n, v]) => `<div class="rl"><span>${n}</span><b class="${v < 0 ? 'bad' : ''}">${v ? money(v) : ''}</b></div>`).join('');
    const st = res.stats ? `<div class="rstats"><span>{i:clock} ${fmtTime(res.stats.time)}</span><span>{i:target} ${METHODS.find(m => m.id === res.stats.method) ? METHODS.find(m => m.id === res.stats.method).name : res.stats.method}</span><span>{i:eye} ${res.stats.spotted ? 'Spotted' : 'Unseen'}</span><span>{i:coffin} ${res.stats.bodies} found</span><span>{i:shirt} ${res.stats.disguises} disguises</span></div>` : '';
    r.innerHTML = `<div class="rbox">
      <div class="r-city">${res.city.name} · ${res.city.venue}</div>
      <div class="r-head ${res.success ? 'good' : 'bad'}">${res.success ? 'CONTRACT COMPLETE' : 'CONTRACT FAILED'}</div>
      <div class="r-rank r-${res.rank}">${res.rank}</div>
      ${st}<div class="rlines">${lines}</div>
      <div class="r-pay"><span>Payout</span><b>${money(res.payout)}</b></div>
      <div class="r-btns"><button class="btn" id="rRetry">${res.success ? 'New Contract Here' : 'Retry'}</button><button class="btn primary" id="rHome">Return to Hideout</button></div></div>`;
    $('#rHome').onclick = () => { r.classList.add('hidden'); Game.enterHideout(); };
    $('#rRetry').onclick = () => { r.classList.add('hidden'); Game.enterHideout(); this.openStation('contracts'); this.briefing(res.C.ci); };
  },

  /* ---------- minimap ---------- */
  buildMinimap() {
    if (!Game.M || Game.M.hideout) { this.mmFloors = null; return; }
    const W = Game.W, fl = Game.M.floors;
    this.mmFloors = fl.map(y => {
      const c = document.createElement('canvas'); c.width = W.W; c.height = W.D;
      const ctx = c.getContext('2d'); const img = ctx.createImageData(W.W, W.D);
      for (let z = 0; z < W.D; z++) for (let x = 0; x < W.W; x++) {
        const i = (z * W.W + x) * 4; let col = null;
        let wy = -1; for (const yy of [y, y - 1, y + 1]) if (W.walkable(x, yy, z)) { wy = yy; break; }
        if (wy >= 0) {
          const zn = W.zoneAt(x, wy, z);
          col = zn === Z_STAFF ? [150, 130, 70] : zn === Z_SECURITY ? [150, 60, 60] : zn === Z_VIP ? [120, 80, 150] : zn === Z_BLOCK ? null : [95, 98, 105];
          if (y > fl[0] && !(x >= BX - 1 && x <= BX + BW && z >= BZ - 5 && z <= BZ + BD)) col = null;
        } else if (W.solid(x, y, z) && W.solid(x, y + 1, z)) col = y > fl[0] && !(x >= BX - 1 && x <= BX + BW && z >= BZ - 5 && z <= BZ + BD) ? null : [30, 30, 34];
        else { const t = W.get(x, y - 1, z); if (t === B.WATER || W.get(x, y, z) === B.WATER) col = [40, 80, 120]; }
        if (col) { img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 230; }
      }
      ctx.putImageData(img, 0, 0); return c;
    });
  },
  drawMinimap() {
    const cv = $('#mm'); if (!cv || !this.mmFloors) return;
    const ctx = cv.getContext('2d'), P = Game.P, fl = Game.M.floors;
    let fi = 0; for (let k = 0; k < fl.length; k++) if (P.y >= fl[k] - 0.5) fi = k;
    const S = cv.width, view = 60, sc = S / view;
    ctx.clearRect(0, 0, S, S);
    ctx.save();
    ctx.translate(S / 2, S / 2);
    const yaw = Engine.cam.yaw;
    ctx.rotate(Math.PI - yaw);
    ctx.scale(sc, sc);
    ctx.translate(-P.x, -P.z);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.mmFloors[fi], 0, 0);
    const dot = (x, z, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, z, r, 0, 7); ctx.fill(); };
    for (const pr of Game.props) if (pr.type === 'exit') { ctx.fillStyle = Game.stats.targetDead ? '#3f6' : '#295'; ctx.fillRect(pr.p[0] - 1.5, pr.p[2] - 1.5, 3, 3); }
    if (Game.C.intel >= 2) for (const pr of Game.guideProps()) if (Math.abs(pr.p[1] - P.y) < 3) dot(pr.p[0], pr.p[2], 1.1, '#fc3');
    for (const n of Game.npcs) {
      if (n.hidden || Math.abs(n.y - P.y) > 2) continue;
      const dead = n.state === 'dead' || n.state === 'ko';
      if (n.isTarget) continue;
      dot(n.x, n.z, 0.8, dead ? '#555' : n.state === 'alert' ? '#f33' : GUARDLIKE(n.kind) ? '#6af' : '#ddd');
    }
    for (const t2 of Game.targets || []) if (t2 !== Game.target && t2.state !== 'dead' && (Game.C.intel >= 1 || Game.targetVisible)) dot(t2.x, t2.z, 1.4, '#f55');
    const t = Game.target;
    if (t && (Game.C.intel >= 1 || Game.targetVisible)) { dot(t.x, t.z, 1.5, t.state === 'dead' ? '#654' : '#ff8a3d'); if (Math.abs(t.y - P.y) > 2) { ctx.strokeStyle = '#ff8a3d'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.arc(t.x, t.z, 2.4, 0, 7); ctx.stroke(); } }
    ctx.restore();
    // player arrow
    ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate(Math.PI - yaw - P.face + Math.PI);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4, 4); ctx.lineTo(0, 2); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fill(); ctx.restore();
    const names = ['GROUND', '1ST', '2ND', '3RD', '4TH', '5TH', '6TH'];
    $('#mmFloor').textContent = fi === fl.length - 1 ? 'ROOF' : names[fi];
  }
};

function fmtTime(s) { s = Math.floor(s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
function describeLooks(L, outfit) {
  const hair = L.hair === 'bald' ? 'a shaved head' : `${['black', 'dark brown', 'brown', 'blonde', 'red', 'grey', 'white', 'purple'][L.hairCol] || 'dark'} ${HAIR_NAMES[L.hair].toLowerCase()} hair`;
  const beard = L.beard && L.beard !== 'none' ? `, a ${BEARD_NAMES[L.beard].toLowerCase()}` : '';
  const o = outfit === 'vip' ? 'black-tie VIP attire' : L.female ? 'an evening dress' : 'a party suit';
  return `${o}, with ${hair}${beard}${L.eye === 'glasses' ? ' and glasses' : ''}`;
}
function drawPortrait(cv, L, outfit) {
  const ctx = cv.getContext('2d'), s = cv.width / 16;
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x * s, y * s, w * s, h * s); };
  const oc = outfitColors(L, outfit, L.suit);
  px(0, 0, 16, 16, '#1d1f24');
  px(0, 0, 16, 1, '#c8102e');
  const sk = rgb(SKINS[L.skin] || SKINS[0]), hc = rgb(HAIR_COLS[L.hairCol] || HAIR_COLS[0]);
  px(2, 12, 12, 4, rgb(oc.jacket)); px(6, 12, 4, 4, rgb(oc.shirt)); if (!oc.noTie) px(7, 12, 2, 4, rgb(oc.tie));
  px(6, 11, 4, 2, sk);
  px(4, 3, 8, 9, sk);
  if (L.hair === 'long' || L.hair === 'ponytail') { px(3, 2, 10, 3, hc); px(3, 4, 1, 8, hc); px(12, 4, 1, 8, hc); }
  else if (L.hair === 'afro') { px(2, 1, 12, 4, hc); px(2, 4, 2, 4, hc); px(12, 4, 2, 4, hc); }
  else if (L.hair === 'mohawk') px(7, 1, 2, 3, hc);
  else if (L.hair === 'buzz') px(4, 3, 8, 1, hc);
  else if (L.hair === 'spiky') { px(4, 2, 8, 2, hc); px(5, 1, 1, 1, hc); px(7, 1, 1, 1, hc); px(9, 1, 1, 1, hc); }
  else if (L.hair !== 'bald') { px(4, 2, 8, 2, hc); if (L.hair === 'sidepart') px(8, 4, 3, 1, hc); }
  px(5, 6, 2, 1, '#151518'); px(9, 6, 2, 1, '#151518');
  if (L.eye === 'shades') px(4, 6, 8, 1, '#0b0b0d'); if (L.eye === 'glasses') { px(5, 6, 2, 1, '#555'); px(9, 6, 2, 1, '#555'); }
  if (L.beard === 'full') { px(4, 8, 8, 4, hc); px(6, 9, 4, 1, sk); }
  else if (L.beard === 'goatee') { px(6, 10, 4, 2, hc); px(6, 9, 4, 1, hc); }
  else if (L.beard === 'moustache') px(6, 9, 4, 1, hc);
  else if (L.beard === 'stubble') { ctx.globalAlpha = 0.4; px(4, 8, 8, 4, hc); ctx.globalAlpha = 1; }
  else if (L.beard === 'chinstrap') { px(4, 8, 1, 4, hc); px(11, 8, 1, 4, hc); px(5, 11, 6, 1, hc); }
  px(7, 10, 2, 1, '#7a3d3d');
}

/* =========================================================
   Input
   ========================================================= */
const Input = {
  ptrs: new Map(), drag: false, start: null, pinch: null,
  init(cv) {
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (this.ptrs.size === 1) { this.start = { x: e.clientX, y: e.clientY, t: performance.now() }; this.drag = false; } else { this.drag = true; this.pinch = null; } });
    cv.addEventListener('pointermove', e => {
      const p = this.ptrs.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (this.ptrs.size === 1) {
        if (this.start && Math.hypot(e.clientX - this.start.x, e.clientY - this.start.y) > 9) this.drag = true;
        if (this.drag && Sniper.active()) Sniper.drag(dx, dy); else if (this.drag) { Engine.cam.yaw -= dx * 0.008; Engine.cam.pitch = Math.max(0.12, Math.min(1.4, Engine.cam.pitch + dy * 0.005)); }
      } else if (this.ptrs.size === 2) {
        const [a, b] = [...this.ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.pinch && Sniper.active()) Sniper.zoomBy(d / this.pinch); else if (this.pinch) Engine.cam.dist = Math.max(3.5, Math.min(42, Engine.cam.dist * this.pinch / d));
        this.pinch = d;
      }
    });
    const up = e => {
      if (!this.ptrs.has(e.pointerId)) return;
      this.ptrs.delete(e.pointerId);
      if (this.ptrs.size === 0) { if (!this.drag && this.start && performance.now() - this.start.t < 600) Game.onTap(e.clientX, e.clientY); this.start = null; this.pinch = null; }
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', e => { this.ptrs.delete(e.pointerId); this.start = null; });
    cv.addEventListener('wheel', e => { e.preventDefault(); if (Sniper.active()) { Sniper.zoomBy(e.deltaY > 0 ? 0.9 : 1.1); return; } Engine.cam.dist = Math.max(3.5, Math.min(42, Engine.cam.dist * (1 + Math.sign(e.deltaY) * 0.1))); }, { passive: false });
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && Game.mode === 'mission') { if (Game.paused) { Game.paused = false; UI.closeSheet(); } else UI.pause(); }
      if (e.key === 'r' && Game.mode === 'mission') $('#btnRun').click();
      if (e.key === ' ' && Sniper.active()) { e.preventDefault(); Sniper.fire(); }
    });
  }
};


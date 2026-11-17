'use strict';
/* =========================================================
   THE LIST — Game logic
   ========================================================= */
const SAVE_KEY = 'thelist_save_v1';
const GUARDLIKE = k => k === 'guard' || k === 'bodyguard';

const Game = {
  S: null, mode: 'title', M: null, W: null, npcs: [], props: [], fx: [], P: null, C: null, stats: null,
  time: 0, percT: 0, pathBudget: 0, nid: 1, paused: false, cutY: 999, lastTargetSeen: 0, msgQ: [],

  /* ---------- save ---------- */
  newSave() {
    return {
      v: 1, money: 8000, completed: {}, best: {}, contracts: {}, unlocked: { weapons: ['pistol9'], gear: ['wire', 'coin'], suits: ['leather', 'burnt', 'classic'] },
      lv: { hide: 0, slots: 0, armor: 0, intel: 0 },
      look: { skin: 1, hair: 'sidepart', hairCol: 1, beard: 'stubble', eye: 'none', tie: 0, suit: 'leather', gloves: false, scar: 'brow' },
      loadout: { weapon: 'pistol9', gear: ['wire', 'coin'] }, settings: { quality: 'high' }, stats: { contracts: 0, s: 0, earned: 0 }, created: false
    };
  },
  load() {
    try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 1) { this.S = Object.assign(this.newSave(), s); return true; } } catch (e) { }
    this.S = this.newSave(); return false;
  },
  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.S)); } catch (e) { } },
  gearSlots() { return 2 + this.S.lv.slots; },
  maxHp() { return 100 + this.S.lv.armor * 25; },
  cityUnlocked(i) { return i === 0 || !!this.S.completed[CITIES[i - 1].id]; },

  /* ---------- hideout ---------- */
  enterHideout() {
    this.mode = 'hideout'; this.paused = false; this.intro = null; this.slowmo = 0; this.killcam = null;
    Sfx.setMode('hideout'); Sfx.intensity = 0;
    const M = buildHideout(this.S.lv.hide);
    this.loadMap(M);
    this.P = this.makePlayer(M.spawn, 'suit');
    this.P.face = Math.PI;
    Engine.cam.yaw = Math.PI + 0.45; Engine.cam.pitch = 0.92; Engine.cam.dist = innerWidth < innerHeight ? 27 : 15.5;
    this.snapCam();
    UI.showHideout();
  },
  /* ---------- map loading ---------- */
  loadMap(M) {
    this.M = M; this.W = M.world; this.npcs = []; this.fx = []; this.nid = 1;
    this.props = M.props.map(p => Object.assign({}, p, { p: p.p.slice(), id: this.nid++ }));
    Engine.setEnv(M.env);
    Engine.buildWorld(this.W);
    UI.buildMinimap && UI.buildMinimap();
  },
  makePlayer(sp, outfit) {
    return { x: sp[0] + 0.5, y: sp[1], z: sp[2] + 0.5, face: 0, path: null, pi: 0, outfit: outfit || 'suit', hp: this.maxHp(), maxHp: this.maxHp(), inv: [], held: -1,
      action: null, pending: null, carrying: null, illegalT: 0, phase: 0, moving: false, run: false, lastHit: -99, dead: false, aimT: 0 };
  },
  snapCam() { const c = Engine.cam, P = this.P; c.tx = P.x; c.ty = P.y + 1; c.tz = P.z; },

  /* ---------- contracts ---------- */
  contractFor(ci) {
    const id = CITIES[ci].id;
    if (!this.S.contracts[id]) { this.S.contracts[id] = (Math.random() * 1e9) | 0; this.save(); }
    return this.genContract(ci, this.S.contracts[id]);
  },
  rerollContract(ci) { this.S.contracts[CITIES[ci].id] = (Math.random() * 1e9) | 0; this.save(); },
  genContract(ci, seed) {
    const rng = RNG(seed);
    const c = CITIES[ci];
    const looks = randomLooks(rng, 'target');
    const name = rng.pick(FIRST) + ' ' + rng.pick(LAST);
    const title = rng.pick(TITLES);
    const LY = resolveLayout(c), names = new Set(), all = [].concat(...LY.floors);
    for (const r of all) if (!r.extra) names.add(r.n);
    const allStops = ['pool'];
    if (names.has('bar')) allStops.push('bar');
    if (names.has('ballroom')) allStops.push('buffet', 'speech');
    if (names.has('office')) allStops.push('office');
    if (names.has('kitchen')) allStops.push('kitchen');
    if (names.has('spa')) allStops.push('sauna');
    if (names.has('privatebar')) allStops.push('privatebar');
    if (all.some(r => r.balcony && r.r[1] === 0)) allStops.push('balcony');
    const poisonS = rng.shuffle(allStops.filter(s => STOP_INFO[s].kind === 'poison'));
    const accS = rng.shuffle(allStops.filter(s => STOP_INFO[s].kind === 'accident'));
    const pick = [poisonS[0], accS[0], accS[1]];
    const rest = rng.shuffle(allStops.filter(s => !pick.includes(s)));
    pick.push(rest[0], 'signature');
    rng.shuffle(pick);
    const methodPool = ['any', 'accident', 'accident', 'poison', 'wire', 'pistol', 'melee'];
    const method = rng.pick(methodPool);
    const fee = 25000 + ci * 7500;
    return { ci, seed, name, title, looks, outfit: rng() < 0.5 ? 'vip' : 'guest', stops: pick, method, fee, bodyguard: ci >= 2 || rng() < 0.4, mapSeed: seed % 1000 };
  },
  // contract for a given play mode
  getContract(ci, mode, chapter) {
    if (mode === 'campaign') {
      const ch = CAMPAIGN[chapter];
      const C = this.genContract(ch.ci, 900001 + chapter * 7919);
      C.name = ch.name; C.title = ch.title; C.story = ch; C.mode = 'campaign'; C.chapter = chapter;
      C.bodyguard = chapter >= 4; C.fee = Math.round(C.fee * 1.2); C.method = chapter < 5 ? 'any' : C.method;
      if (ch.iris) {
        if ((this.S.prog || {}).irisChoice === 'spare') { C.name = 'Kessler'; C.title = 'Marlow\'s cleaner, sent for Iris'; C.looks.eye = 'shades'; C.looks.female = false; C.looks.hair = 'buzz'; C.looks.beard = 'stubble'; C.outfit = 'guest'; }
        else { C.looks = JSON.parse(JSON.stringify(IRIS_LOOKS)); C.outfit = 'guest'; C.bodyguard = false; }
        C.method = 'any';
      }
      if (chapter === 14) { C.outfit = 'vip'; C.looks.female = false; C.looks.hair = 'slick'; C.looks.hairCol = 5; C.looks.beard = 'full'; C.method = 'any'; }
      return C;
    }
    if (mode === 'tutorial') {
      const C = this.genContract(TUT_CI, 4242);
      Object.assign(C, { name: 'Victor Lang', title: 'Training Target', stops: ['balcony', 'bar'], bodyguard: false, method: 'poison', fee: 0, mode: 'tutorial' });
      return C;
    }
    if (mode === 'elusive') {
      const e = Elusive.state();
      const C = this.genContract(e.ci, e.seed);
      C.mode = 'elusive'; C.method = 'any'; C.bodyguard = true; C.fee = Math.round(C.fee * 2.5); C.title = 'Elusive Target · ' + C.title;
      return C;
    }
    if (mode === 'weekly') {
      const wk = Weekly.state();
      const C = this.genContract(wk.ci, wk.seed); C.mode = 'weekly'; C.rules = wk.rules; C.fee = Math.round(C.fee * 1.5); C.title = 'Weekly Contract · ' + C.title; C.method = 'any';
      return C;
    }
    const C = this.contractFor(ci); C.mode = 'free';
    { const r2 = RNG(C.seed + 555); if (ci >= 3 && r2() < 0.3) { const lk = randomLooks(r2, 'target'); C.second = { name: r2.pick(FIRST) + ' ' + r2.pick(LAST), title: r2.pick(TITLES), looks: lk, outfit: r2() < 0.5 ? 'vip' : 'guest', stops: r2.shuffle(['bar', 'buffet', 'office', 'speech', 'balcony', 'kitchen', 'sauna', 'pool', 'privatebar'].filter(x => !C.stops.includes(x))).slice(0, 3).concat(C.stops.slice(0, 2)) }; C.fee = Math.round(C.fee * 1.6); } }
    return C;
  },
  intelPrice(tier) { const base = tier === 1 ? 2500 : 6000; return Math.round(base * (1 - this.S.lv.intel * 0.25)); },

  /* ---------- mission ---------- */
  startMission(ci, intel, opts) {
    opts = opts || {};
    const C = this.getContract(ci, opts.mode || 'free', opts.chapter);
    ci = C.ci;
    C.intel = intel || 0; C.start = opts.start || 'street';
    this.lastLaunch = { ci, intel: 0, opts };
    if (C.intel) { if (this.S.prog.tokens > 0) this.S.prog.tokens--; else this.S.money -= this.intelPrice(C.intel); }
    this.save();
    this.C = C; this.mode = 'mission'; this.paused = false;
    const M = buildMap(ci, C.mapSeed);
    this.loadMap(M);
    const rng = RNG(C.seed + 99);
    const ST = STARTS.find(s => s.id === C.start) || STARTS[0];
    let sp = ST.id === 'alley' ? M.spawns[2] : M.spawns[rng.int(0, 1)];
    const roomOf = { staff: 'staff', kitchen: 'kitchen', security: 'security' }[ST.id];
    if (roomOf && M.rooms[roomOf]) { const r = M.rooms[roomOf]; const c = this.freeCellIn(r); if (c) sp = c; }
    this.P = this.makePlayer(sp, ST.outfit || 'suit');
    // loadout
    const lo = this.S.loadout;
    if (lo.weapon) this.addItem(lo.weapon, 1);
    for (const g of lo.gear.slice(0, this.gearSlots())) this.addItem(g, g === 'coin' ? 3 : 1);
    // exits
    for (const e of M.exits) this.props.push({ id: this.nid++, type: 'exit', p: e.p.slice(), name: e.label });
    this.stats = { t: 0, spotted: false, spottedBy: 0, bodiesFound: 0, kills: 0, nonTarget: 0, combat: false, suitOnly: !ST.outfit, targetDead: false, method: null, disguises: 0, coins: 0, kos: 0, usedGun: false };
    this.diff = C.mode === 'tutorial' ? 'casual' : (opts.diff || this.S.settings.difficulty || 'pro'); this.D = DIFFS[this.diff];
    this.chatT = 3;
    this.spawnNPCs(rng);
    Engine.cam.yaw = Math.PI + 0.55; Engine.cam.pitch = 0.95; Engine.cam.dist = 20;
    this.snapCam();
    this.time = 0; this.slowmo = 0; this.killcam = null; UI.clearFx(); UI.setInstinct(false);
    this.intro = { t: 0, dur: 4.2, yaw0: Engine.cam.yaw };
    Sfx.setMode('mission'); Sfx.play('whoosh');
    UI.showMission();
    if (C.mode === 'tutorial') Tutorial.begin(); else { Tutorial.active = false; $('#tut').classList.add('hidden'); }
    this.toast(`${CITIES[ci].name} — ${CITIES[ci].venue}`, 'big');
    this.toast(`Target: ${C.name}`);
  },
  freeCellIn(r) {
    const W = this.W, cx = Math.floor((r.a.x0 + r.a.x1) / 2), cz = Math.floor((r.a.z0 + r.a.z1) / 2);
    for (let d = 0; d < 6; d++) for (let dz = -d; dz <= d; dz++) for (let dx = -d; dx <= d; dx++) if (W.walkable(cx + dx, r.y, cz + dz)) return [cx + dx, r.y, cz + dz];
    return null;
  },
  /* ambient chatter near the player */
  chatter(dt) {
    this.chatT -= dt; if (this.chatT > 0) return;
    this.chatT = 3 + Math.random() * 4;
    const P = this.P, C = this.C;
    const cand = this.npcs.filter(n => !n.say && !n.hidden && ['routine'].includes(n.state) && n.state !== 'dead' && Math.hypot(n.x - P.x, n.z - P.z) < 9 && Math.abs(n.y - P.y) < 2);
    if (!cand.length) return;
    const n = cand[Math.floor(Math.random() * cand.length)];
    let line;
    if (n.isTarget) line = n.atStop ? ({ bar: 'Bartender! Make it a double.', speech: 'A toast! To money, and those who have it!', balcony: 'Finally, some peace and quiet.', sauna: 'Ahh. Nobody bother me for a while.', pool: 'Last one in buys the yacht!', kitchen: 'Is this what I pay you for?!', office: 'Now where did I hide that bottle...', buffet: 'Mm, these are excellent.', privatebar: 'Only the rarest cognac for me.' })[n.atStop] || LINES.target[0] : LINES.target[Math.floor(Math.random() * LINES.target.length)];
    else if (n.kind === 'guest' && Math.random() < 0.35) {
      const st = C.stops[Math.floor(Math.random() * C.stops.length)]; const hi = LINES.hintStop[st];
      line = hi !== undefined ? LINES.hint[hi](C.name.split(' ')[0] === 'The' ? C.name : C.name.split(' ')[0]) : LINES.guest[0];
    } else line = (n.kind === 'guest' ? LINES.guest : GUARDLIKE(n.kind) ? LINES.guard : LINES.staff)[Math.floor(Math.random() * (n.kind === 'guest' ? LINES.guest.length : GUARDLIKE(n.kind) ? LINES.guard.length : LINES.staff.length))];
    n.say = line; n.sayT = 3.8;
  },
  spawnNPCs(rng) {
    const M = this.M, C = this.C;
    const mk = (kind, outfit, pos, extra) => {
      const n = Object.assign({ id: this.nid++, kind, outfit, looks: randomLooks(rng, kind), x: pos[0] + 0.5, y: pos[1], z: pos[2] + 0.5, face: rng() * 6.28,
        path: null, pi: 0, state: 'routine', waitT: rng() * 4, susp: 0, triggered: false, hp: 100, speed: 1.9 + rng() * 0.4, phase: rng() * 6, percO: rng() * 0.2, routeI: 0 }, extra || {});
      if (kind === 'guard' || kind === 'bodyguard') { n.looks.female = false; n.looks.hair = rng.pick(['buzz', 'bald', 'slick']); }
      this.npcs.push(n); return n;
    };
    for (const g of M.guards) { const r = g.route; mk('guard', 'guard', r[0], { route: r, post: g.post, postFace: g.face }); }
    for (const s of M.staff) { mk('staff', s.outfit, s.route[0], { route: s.route, post: s.post, postFace: s.face }); }
    for (const g of M.guests) {
      const sp = M.spots[g.group]; if (!sp || !sp.length) continue;
      const p = sp[rng.int(0, sp.length - 1)];
      mk('guest', g.vip ? 'vip' : 'guest', p, { group: g.group, home: p });
    }
    // target — keep only stops this venue actually has
    C.stops = C.stops.filter(s => M.stops[s]);
    for (const s of Object.keys(M.stops)) if (C.stops.length < 5 && !C.stops.includes(s) && !M.stops[s].hidden) C.stops.push(s);
    const st0 = M.stops[C.stops[0]];
    const t = mk('target', C.outfit, st0.p, { looks: C.looks, name: C.name, isTarget: true, stops: C.stops, stopI: 0, speed: 1.7, waitT: 2 });
    t.looks.gloves = false;
    if (C.bodyguard) { const b = mk('bodyguard', 'guard', [st0.p[0] + 1, st0.p[1], st0.p[2] + 1], { follow: t.id, speed: 2.2 }); b.looks.eye = 'shades'; }
    this.target = t; this.targets = [t];
    for (const X of [C.second, C.third].filter(Boolean)) {
      const sst = X.stops.filter(x => M.stops[x]); if (!sst.length) sst.push(Object.keys(M.stops).find(k => !M.stops[k].hidden));
      const s0 = M.stops[sst[0]];
      const t2 = mk('target', X.outfit, s0.p, { looks: X.looks, name: X.name, isTarget: true, stops: sst, stopI: 0, speed: 1.7, waitT: 4 + this.targets.length * 3 });
      this.targets.push(t2);
    }
    // master difficulty: extra interior guards
    if (this.diff === 'master') {
      const inner = M.guards.filter(g => g.route.some(r => r[0] >= BX && r[0] < BX + BW && r[2] >= BZ && r[2] < BZ + BD));
      for (let i = 0; i < 5 && inner.length; i++) { const g = inner[Math.floor(rng() * inner.length)]; mk('guard', 'guard', g.route[0], { route: g.route.slice().reverse(), post: false }); }
    }
    // decoys: lookalikes of the target
    if (this.diff === 'master' || C.mode === 'elusive') {
      const grp = ['ballroom', 'lobby', 'bar', 'lounge'].find(g => M.spots[g] && M.spots[g].length);
      if (grp) { const sp = M.spots[grp][0]; mk('guest', C.outfit, sp, { group: grp, home: sp, looks: JSON.parse(JSON.stringify(C.looks)), decoy: true }); }
    }
    for (const n of this.npcs) if (GUARDLIKE(n.kind) && rng() < 0.5) n.keycard = true;
    // doors & locks
    this.doors = (M.doors || []).map(d => d); this.lockedKeys = new Set();
    for (const d of this.doors) if (d.locked) for (const [x, z] of d.cells) this.lockedKeys.add((d.y * this.W.D + z) * this.W.W + x);
    this.inst = { on: false, m: 100 }; this.blackout = null; 
  },

  addItem(id, n) {
    const P = this.P; const ex = P.inv.find(i => i.id === id);
    if (ex) { if (ITEMS[id].stack) ex.n += n; return; }
    P.inv.push({ id, n: n || 1 });
    UI.refreshInv && UI.refreshInv();
  },
  hasItem(id) { return this.P.inv.find(i => i.id === id && i.n > 0); },
  hasKind(kind) { return this.P.inv.find(i => ITEMS[i.id].kind === kind && i.n > 0); },
  heldItem() { const P = this.P; return P.held >= 0 && P.inv[P.held] ? P.inv[P.held] : null; },
  holdItem(id) { const P = this.P; const i = P.inv.findIndex(x => x.id === id); P.held = i; UI.refreshInv(); },
  useItem(id) { const P = this.P; const i = P.inv.findIndex(x => x.id === id); if (i < 0) return; P.inv[i].n--; if (P.inv[i].n <= 0) { P.inv.splice(i, 1); if (P.held === i) P.held = -1; else if (P.held > i) P.held--; } UI.refreshInv(); },

  /* ---------- messages ---------- */
  toast(msg, cls) { UI.toast(msg, cls); },

  /* ---------- update ---------- */
  update(dt) {
    if (this.mode === 'cutscene' || this.mode === 'replay') { Extras.update(dt); return; }
    if (this.mode !== 'mission' && this.mode !== 'hideout') return;
    if (this.paused) return;
    const realDt = dt;
    if (this.slowmo > 0) { this.slowmo -= realDt; dt *= 0.22; if (this.slowmo <= 0) { this.killcam = null; UI.killFlash(false); } }
    this.time += dt; this.pathBudget = 4;
    if (this.mode === 'mission') this.stats.t += dt;
    this.updatePlayer(dt);
    Controls.move(dt);
    if (this.mode === 'hideout') Pets.update(dt);
    if (this.mode === 'mission') {
      Records.tick(dt);
      this.percT += dt;
      const L = this.npcs.length, off = this._rot = ((this._rot || 0) + 7) % Math.max(1, L);
      for (let i = 0; i < L; i++) this.updateNPC(this.npcs[(i + off) % L], dt);
      this.separate(dt);
      this.updateFX(dt);
      if (!this.intro) this.chatter(dt);
      this.tickSystems(dt, realDt);
      Tutorial.update(realDt);
      if (this.target && this.target.state !== 'dead') {
        // target visibility for non-intel
        if (this.time - (this._tvis || 0) > 0.4) {
          this._tvis = this.time; const t = this.target, P = this.P;
          this.targetVisible = Math.hypot(t.x - P.x, t.z - P.z) < 32 && Math.abs(t.y - P.y) < 3 && this.W.los([P.x, P.y + 1.6, P.z], [t.x, t.y + 1.5, t.z]);
        }
      }
    }
    // camera follow
    const c = Engine.cam, P = this.P, k = Math.min(1, dt * 6);
    let gx = P.x, gy = P.y + 1, gz = P.z;
    if (UI.camOffset) {
      const land = innerWidth > innerHeight;
      if (land) { gx += Math.cos(c.yaw) * 1.1; gz -= Math.sin(c.yaw) * 1.1; } else { gy -= 0.75; }
    }
    if (this.mode === 'hideout' && this.M && this.M.hideout && !this.M.flashback) { gx = 19.5 + (gx - 19.5) * 0.35; gz = 17.4 + (gz - 17.4) * 0.35; }
    c.tx += (gx - c.tx) * k; c.ty += (gy - c.ty) * k; c.tz += (gz - c.tz) * k;
    if (this.intro) {
      const I = this.intro; I.t += realDt;
      const u = Math.min(1, I.t / I.dur), e = u * u * (3 - 2 * u);
      const b = this.M.building, bx = (b.x0 + b.x1) / 2, bz = (b.z0 + b.z1) / 2;
      c.tx = bx + (P.x - bx) * e; c.tz = bz + (P.z - bz) * e; c.ty = 16 + (P.y + 1 - 16) * e;
      c.dist = 75 + (20 - 75) * e; c.pitch = 0.55 + (0.95 - 0.55) * e; c.yaw = I.yaw0 + 1.4 * (1 - e);
      if (u >= 1) { this.intro = null; UI.letterbox(false); }
    } else if (this.killcam) {
      const n = this.killcam, kk = Math.min(1, realDt * 4);
      c.tx += (n.x - c.tx) * kk; c.ty += (n.y + 0.8 - c.ty) * kk; c.tz += (n.z - c.tz) * kk;
      c.dist += (9 - c.dist) * kk; c.yaw += realDt * 0.35;
    }
    if (this.mode === 'mission') {
      let inten = 0; for (const n of this.npcs) { if (n.state === 'alert') { inten = 1; break; } if (n.state === 'search' || n.state === 'confront') inten = Math.max(inten, 0.5); }
      Sfx.intensity = inten;
    }
    // cutaway + see-through walls around the agent
    this.updateCut();
    Engine.fadeTarget = this.intro || (P && P.dead) ? null : [P.x, P.y, P.z];
    if (this.mode === 'mission' && this.C.mode === 'sniper') Sniper.camera(realDt);
    else if (Controls.active()) Controls.camera(realDt);
    // lights: nearest 10
    const bo = this.mode === 'mission' && this.blackout;
    const L = bo ? this.M.lights.filter(l => !(Math.abs(l.y - bo.y - 2) < 2.2 && l.x >= BX && l.x < BX + BW && l.z >= BZ && l.z < BZ + BD)) : this.M.lights;
    const maxL = Engine.quality === 'lite' ? 4 : 10;
    if (L.length <= maxL) Engine.lights = L; else {
      if (!this._lt || this.time - this._lt > 0.5 || bo !== this._lbo) { this._lt = this.time; this._lbo = bo; Engine.lights = L.slice().sort((a, b) => ((a.x - c.tx) ** 2 + (a.y - c.ty) ** 2 * 4 + (a.z - c.tz) ** 2) - ((b.x - c.tx) ** 2 + (b.y - c.ty) ** 2 * 4 + (b.z - c.tz) ** 2)).slice(0, maxL); }
    }
    Engine.expoMul = bo && Math.abs(P.y - bo.y) < 2 && P.x >= BX && P.x < BX + BW && P.z >= BZ && P.z < BZ + BD ? 0.55 : 1;
    UI.updateHUD && UI.updateHUD(dt);
  },
  updateCut() {
    if (Controls.active()) { this.cutY = 999; Engine.cut = 999; return; }
    const P = this.P, W = this.W;
    if (this.M.hideout) { Engine.cut = 6.5; return; }
    if (this.mode === 'mission' && this.C && this.C.mode === 'sniper') return;
    const b = this.M.building;
    const mg = this._inside ? 2 : 1;
    const inside = P.x >= b.x0 - mg && P.x <= b.x1 + mg && P.z >= b.z0 - mg && P.z <= b.z1 + mg;
    this._inside = inside;
    let cut = 999;
    if (inside) {
      // floor level, with hysteresis on stairs so the view doesn't flicker
      const fl = this.M.floors; let lv = fl[0];
      for (const f of fl) if (P.y >= f - 0.5) lv = f;
      if (this._lv !== undefined && lv < this._lv && P.y > this._lv - 1.6) lv = this._lv;
      this._lv = lv;
      cut = lv + 2.9;
      // check there is something above (otherwise roof → keep)
    } else {
      // outdoor: cut tall stuff under shed etc
      for (let yy = Math.floor(P.y) + 2; yy < Math.floor(P.y) + 6; yy++) if (W.cutF[W.idx(Math.floor(P.x), Math.min(W.H - 1, yy), Math.floor(P.z))] && W.solid(Math.floor(P.x), yy, Math.floor(P.z))) { cut = Math.floor(P.y) + 2.9; break; }
    }
    this.cutY = cut;
    // ease the visible cut so floors slide in and out instead of popping
    const vis = cut > 500 ? (b.top + 3) : cut;
    if (this._cv === undefined || Math.abs(this._cv - vis) > 30 || this._cvM !== this.M) { this._cv = vis; this._cvM = this.M; }
    this._cv += (vis - this._cv) * 0.16;
    if (Math.abs(this._cv - vis) < 0.05) this._cv = vis;
    Engine.cut = cut > 500 && this._cv === vis ? 999 : this._cv;
  },
  // tap ray: passes through walls and wall tops until it finds somewhere you can stand
  tapRay(r) {
    const W = this.W, o = r.o, d = r.d; let acc = 0, first = null;
    for (let k = 0; k < 24; k++) {
      const oo = [o[0] + d[0] * acc, o[1] + d[1] * acc, o[2] + d[2] * acc];
      const h = W.raycast(oo, d, 200 - acc, this.cutY); if (!h) return first;
      h.t += acc; if (!first) first = h;
      let cx = h.x + h.face[0], cy = h.y + h.face[1], cz = h.z + h.face[2];
      if (h.face[1] !== 1) { const gy = W.groundAt(cx, cz, cy); if (gy >= 0) cy = gy; }
      if (h.face[1] === 1 && W.walkable(cx, cy, cz)) return h;
      if (h.face[1] !== 1 && W.walkable(cx, cy, cz) && !W.cutF[W.idx(h.x, h.y, h.z)]) return h;
      acc = h.t + 0.05; if (acc > 200) break;
    }
    return first;
  },

  /* ---------- movement ---------- */
  stepPath(e, dt, speed) {
    if (!e.path || e.pi >= e.path.length) { e.moving = false; return true; }
    const c = e.path[e.pi]; const tx = c[0] + 0.5, tz = c[2] + 0.5;
    const dx = tx - e.x, dz = tz - e.z, d = Math.hypot(dx, dz), st = speed * dt;
    if (d > 0.01) e.face = lerpAng(e.face, Math.atan2(dx, dz), Math.min(1, dt * 12));
    if (d <= st) { e.x = tx; e.z = tz; e.pi++; } else { e.x += dx / d * st; e.z += dz / d * st; }
    e.y += (c[1] - e.y) * Math.min(1, dt * 12); if (Math.abs(c[1] - e.y) < 0.02) e.y = c[1];
    e.moving = true; e.phase += dt * speed * 3.2;
    if (e.pi >= e.path.length) { e.moving = false; return true; }
    return false;
  },
  cellOf(e) { return [Math.floor(e.x), Math.round(e.y), Math.floor(e.z)]; },
  findPath(e, g, force) {
    if (!force && this.pathBudget <= 0) return false;
    this.pathBudget--;
    const s = this.cellOf(e);
    const p = this.W.path(s[0], s[1], s[2], Math.floor(g[0]), Math.round(g[1]), Math.floor(g[2]), e === this.P ? 40000 : 12000, e === this.P ? this.lockedKeys : null);
    e.path = p; e.pi = 0;
    return !!p;
  },

  // soft crowd avoidance so people don't walk through each other
  separate(dt) {
    const g = new Map(), W = this.W, P = this.P;
    const key = (x, z, y) => ((Math.floor(x) >> 1) * 4096 + (Math.floor(z) >> 1)) * 64 + Math.round(y);
    const live = this.npcs.filter(n => !n.hidden && !n.carriedBy && n.state !== 'dead' && n.state !== 'ko' && n.state !== 'held' && n.state !== 'falling');
    for (const n of live) { const k = key(n.x, n.z, n.y); (g.get(k) || g.set(k, []).get(k)).push(n); }
    for (const n of live) {
      if (n.idle === 'sit' && !n.moving) continue;
      let px = 0, pz = 0;
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const arr = g.get(key(n.x + dx * 2, n.z + dz * 2, n.y)); if (!arr) continue;
        for (const m of arr) { if (m === n) continue; const ox = n.x - m.x, oz = n.z - m.z, d2 = ox * ox + oz * oz; if (d2 < 0.36 && d2 > 1e-6) { const d = Math.sqrt(d2), f = (0.6 - d) / 0.6; px += ox / d * f; pz += oz / d * f; } }
      }
      if (P && !P.dead && Math.abs(P.y - n.y) < 1) { const ox = n.x - P.x, oz = n.z - P.z, d2 = ox * ox + oz * oz; if (d2 < 0.45 && d2 > 1e-6) { const d = Math.sqrt(d2), f = (0.67 - d) / 0.67; px += ox / d * f * 1.5; pz += oz / d * f * 1.5; } }
      if (!px && !pz) continue;
      const k = Math.min(0.08, dt * 2.2), nx = n.x + px * k, nz = n.z + pz * k;
      if (W.walkable(Math.floor(nx), Math.round(n.y), Math.floor(nz))) { n.x = nx; n.z = nz; }
    }
  },
  /* ---------- player ---------- */
  updatePlayer(dt) {
    const P = this.P;
    if (P.dead) return;
    P.illegalT = Math.max(0, P.illegalT - dt);
    P.aimT = Math.max(0, P.aimT - dt);
    if (P.action) {
      P.action.t += dt; P.moving = false;
      if (P.action.illegal) P.illegalT = Math.max(P.illegalT, 0.3);
      if (P.action.face !== undefined) P.face = lerpAng(P.face, P.action.face, Math.min(1, dt * 10));
      if (P.action.t >= P.action.dur) { const a = P.action; P.action = null; a.done(); }
      return;
    }
    if (P.pending) {
      const pd = P.pending;
      const tp = pd.ent.kind ? [pd.ent.x, pd.ent.y, pd.ent.z] : pd.ent.p;
      const d = Math.hypot(tp[0] - P.x, tp[2] - P.z), dy = Math.abs(tp[1] - P.y);
      const reach = pd.reach || 1.6;
      if (d <= reach && dy < (pd.ent.kind ? 1.2 : 2.2)) {
        P.path = null; P.pending = null; P.face = Math.atan2(tp[0] - P.x, tp[2] - P.z);
        this.doOption(pd.opt, pd.ent);
        return;
      }
      pd.rt = (pd.rt || 0) - dt;
      if (pd.ent.kind && pd.rt <= 0) { pd.rt = 0.6; const ok = this.findPath(P, [pd.ent.x, pd.ent.y, pd.ent.z], true); if (!ok) { P.pending = null; this.toast("Can't reach them from here"); } }
      if (!pd.ent.kind && !P.path) { this.pathToProp(pd.ent); if (!P.path) { P.pending = null; this.toast("Can't reach that"); } }
    }
    const spd = (P.run ? 4.6 : 3.0) * (P.carrying ? 0.6 : 1);
    this.stepPath(P, dt, spd);
    if (!P.moving && P.hp < P.maxHp && this.time - P.lastHit > 8) P.hp = Math.min(P.maxHp, P.hp + dt * 4);
    // carried body follows
    if (P.carrying) { const b = P.carrying; b.x = P.x; b.y = P.y; b.z = P.z; b.face = P.face; }
  },
  pathToProp(pr) {
    const P = this.P, W = this.W;
    const px = Math.floor(pr.p[0]), pz = Math.floor(pr.p[2]), py = Math.floor(pr.p[1]);
    let best = null, bd = 1e9;
    for (let dy = -2; dy <= 1; dy++) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const x = px + dx, y = py + dy, z = pz + dz;
      if (!W.walkable(x, y, z)) continue;
      const dd = Math.hypot(x + 0.5 - pr.p[0], z + 0.5 - pr.p[2]);
      if (dd > 1.7) continue;
      const score = dd + Math.hypot(x - P.x, z - P.z) * 0.02 + Math.abs(y - P.y) * 0.1;
      if (score < bd) { bd = score; best = [x, y, z]; }
    }
    if (!best) { P.path = null; return; }
    this.findPath(P, best, true);
    if (P.path && P.path.length === 0) P.path = null;
    if (!P.path) { const c = this.cellOf(P); if (c[0] === best[0] && c[2] === best[2]) P.path = [best]; }
  },
  moveTo(cell) {
    const P = this.P;
    P.pending = null; P.blend = false;
    if (P.action) return;
    const ok = this.findPath(P, cell, true);
    if (!ok) { UI.tapMarker(null); return false; }
    return true;
  },

  /* ---------- tap handling ---------- */
  onTap(sx, sy) {
    if (this.mode === 'cutscene' || this.mode === 'replay') { Extras.tap(sx, sy); return; }
    if (this.paused) return;
    if (this.mode === 'mission' && this.C && this.C.mode === 'sniper') { Sniper.tap(sx, sy); return; }
    if (this.intro) { this.intro.t = this.intro.dur; return; }
    if (this.slowmo > 0) return;
    const P = this.P; if (!P || P.dead) return;
    const r = Engine.ray(sx, sy);
    if (this.mode === 'hideout' && Pets.hit(r)) return;
    // entities
    let best = null, bt = 1e9;
    if (this.mode === 'mission') for (const n of this.npcs) {
      if (n.hidden || n.carriedBy || n.y > this.cutY + 0.5) continue;
      const dead = n.state === 'dead' || n.state === 'ko';
      const mn = dead ? [n.x - 0.9, n.y, n.z - 0.9] : [n.x - 0.45, n.y, n.z - 0.45], mx = dead ? [n.x + 0.9, n.y + 0.5, n.z + 0.9] : [n.x + 0.45, n.y + 1.95, n.z + 0.45];
      const t = rayAABB(r.o, r.d, mn, mx); if (t >= 0 && t < bt) { bt = t; best = n; }
    }
    for (const pr of this.props) {
      if (pr.gone || pr.p[1] > this.cutY + 0.5 || pr.type === 'coinFly') continue;
      const s = pr.type === 'station' ? 1.4 : pr.type === 'container' ? 0.9 : pr.type === 'exit' ? 1.2 : 0.55;
      const h = pr.type === 'container' || pr.type === 'station' ? 2 : pr.type === 'exit' ? 2.5 : pr.type === 'chandelier' ? 1 : 0.8;
      const y0 = pr.type === 'sauna' ? pr.p[1] - 0.4 : pr.p[1];
      const t = rayAABB(r.o, r.d, [pr.p[0] - s, y0 - 0.1, pr.p[2] - s], [pr.p[0] + s, y0 + h, pr.p[2] + s]);
      if (t >= 0 && t < bt) { bt = t; best = pr; }
    }
    const hit = this.tapRay(r);
    const ht = hit ? hit.t : 1e9;
    const held = this.heldItem();
    if (best && bt < ht + 0.6) {
      if (best.type === 'station') { this.goStation(best); return; }
      const opts = this.optionsFor(best);
      if (opts.length) UI.contextMenu(sx, sy, best, opts);
      return;
    }
    if (!hit) return;
    // ground cell
    let cx = hit.x + hit.face[0], cy = hit.y + hit.face[1], cz = hit.z + hit.face[2];
    if (hit.face[1] !== 1) { const gy = this.W.groundAt(cx, cz, cy); if (gy >= 0) cy = gy; }
    if (!this.W.walkable(cx, cy, cz)) {
      let found = null;
      for (let rr = 1; rr <= 2 && !found; rr++) for (let dz = -rr; dz <= rr && !found; dz++) for (let dx = -rr; dx <= rr && !found; dx++) {
        const gy = this.W.groundAt(cx + dx, cz + dz, cy); if (gy >= 0 && Math.abs(gy - cy) <= 1) found = [cx + dx, gy, cz + dz];
      }
      if (!found) return; [cx, cy, cz] = found;
    }
    if (this.mode === 'mission' && held && held.id === 'coin') { this.throwCoin([cx, cy, cz]); return; }
    if (this.mode === 'mission' && held && held.id === 'charge') { UI.contextMenu(sx, sy, { ground: [cx, cy, cz] }, [{ label: 'Place Remote Charge here', icon: '{i:bomb}', hl: true, fn: () => this.walkThen([cx, cy, cz], () => this.placeCharge()) }, { label: 'Walk here', icon: '{i:steps}', fn: () => this.moveTo([cx, cy, cz]) }]); return; }
    if (this.moveTo([cx, cy, cz])) UI.tapMarker([cx + 0.5, cy + 0.05, cz + 0.5]);
  },
  walkThen(cell, fn) {
    const P = this.P; this.moveTo(cell);
    P.pending = { ent: { p: [cell[0] + 0.5, cell[1], cell[2] + 0.5] }, opt: { fn }, reach: 0.6 };
  },

  /* ---------- context options ---------- */
  optionsFor(e) {
    const P = this.P, opts = [];
    const held = this.heldItem(); const hid = held ? held.id : null;
    const add = (label, icon, fn, o) => opts.push(Object.assign({ label, icon, fn }, o || {}));
    if (e.type === 'station') { add(e.name, '{i:arrow}', () => this.goStation(e)); return opts; }
    if (e.kind) { // npc
      const n = e, dead = n.state === 'dead' || n.state === 'ko';
      if (n.isTarget && !dead) opts.push({ label: `${n.name} — TARGET`, header: true });
      if (dead) {
        if (n.state === 'ko' && !P.carrying) add(this.hasItem('wire') ? 'Finish off (Fiber Wire)' : 'Finish off', '{i:skull}', () => this.queue(n, 'finish'), { hl: n.isTarget });
        if (!P.carrying) add('Drag body', '{i:hand}', () => this.queue(n, 'drag'));
        if (n.keycard) add('Take keycard', '{i:card}', () => this.queue(n, 'keycard'));
        if (!n.stripped && n.outfit !== P.outfit && n.outfit !== 'underwear') add(`Take disguise: ${OUTFIT_NAMES[n.outfit]}`, '{i:shirt}', () => this.queue(n, 'disguise'));
        if (n.isTarget) opts.push({ label: 'Target eliminated', header: true });
        return opts;
      }
      if (P.carrying) { opts.push({ label: 'Drop the body first', header: true }); return opts; }
      add('Subdue (non-lethal)', '{i:fist}', () => this.queue(n, 'subdue'));
      const wire = this.hasItem('wire'); if (wire) add('Strangle with Fiber Wire', '{i:wire}', () => { this.holdItem('wire'); this.queue(n, 'wire'); }, { hl: hid === 'wire' });
      const knife = this.hasItem('knife'); if (knife) add('Stab with Kitchen Knife', '{i:knife}', () => { this.holdItem('knife'); this.queue(n, 'knife'); }, { hl: hid === 'knife' });
      for (const it of P.inv) if (ITEMS[it.id].kind === 'gun') add(`Shoot (${ITEMS[it.id].name})`, ITEMS[it.id].icon, () => { this.holdItem(it.id); this.shoot(n, it.id); }, { hl: hid === it.id });
      if (this.atPushSpot(n)) add('Push over the railing', '{i:push}', () => this.queue(n, 'push'), { hl: true, acc: true });
      return opts;
    }
    switch (e.type) {
      case 'item': add(`Pick up ${e.name}`, ITEMS[e.item].icon, () => this.queue(e, 'pickup')); break;
      case 'disguise': if (P.outfit !== e.outfit) add(`Change into ${e.name}`, '{i:shirt}', () => this.queue(e, 'disguiseProp')); break;
      case 'consumable': {
        opts.push({ label: e.name + (e.poison ? ' (poisoned)' : ''), header: true });
        if (!e.poison && !e.consumed) {
          for (const it of P.inv) if (ITEMS[it.id].kind === 'poison') add(`Poison with ${ITEMS[it.id].name}`, ITEMS[it.id].icon, () => { this.holdItem(it.id); this.queue(e, 'poison', { item: it.id }); }, { hl: hid === it.id });
          if (!opts.some(o => o.fn)) opts.push({ label: 'You need poison', header: true, dim: true });
        }
        break;
      }
      case 'stove': if (!e.sabotaged) { if (this.hasItem('wrench')) add('Loosen gas valve', '{i:wrench}', () => { this.holdItem('wrench'); this.queue(e, 'gas'); }, { hl: hid === 'wrench' }); else opts.push({ label: 'Gas stove — needs a wrench', header: true, dim: true }); } else opts.push({ label: 'Gas is leaking...', header: true }); break;
      case 'winch': if (!e.used) add('Release the chandelier', '{i:chain}', () => this.queue(e, 'winch'), { hl: this.targetUnderChandelier() }); break;
      case 'chandelier': opts.push({ label: 'Crystal chandelier — controlled from the winch in the control room', header: true, dim: true }); break;
      case 'sauna': if (!e.sabotaged) add('Overheat & lock the sauna', '{i:fire}', () => this.queue(e, 'sauna')); else opts.push({ label: 'Sauna sabotaged', header: true }); break;
      case 'speaker': if (!e.used) add('Knock speaker into the pool', '{i:speaker}', () => this.queue(e, 'speaker'), { hl: this.targetInPool() }); break;
      case 'sig': {
        const S = e.sig; opts.push({ label: `${e.name} — signature kill`, header: true });
        if (S.type === 'rig') { if (e.sabotaged) opts.push({ label: 'Rigged — wait for the target', header: true }); else if (this.hasItem('wrench')) add(S.verb, '{i:wrench}', () => { this.holdItem('wrench'); this.queue(e, 'sigrig'); }, { hl: hid === 'wrench' }); else opts.push({ label: 'Needs a wrench', header: true, dim: true }); }
        if (S.type === 'poison') { if (e.poison) opts.push({ label: 'Poisoned — wait for the target', header: true }); else if (this.hasItem('poison')) add(S.verb, '{i:poison}', () => { this.holdItem('poison'); this.queue(e, 'sigpoison'); }, { hl: hid === 'poison' }); else opts.push({ label: 'Needs lethal poison', header: true, dim: true }); }
        if (S.type === 'drop' && !e.dropped) add(S.verb, '{i:chain}', () => this.queue(e, 'sigdrop'), { hl: this.targetAtStop('signature', 1.3) });
        break;
      }
      case 'door': {
        const d = e.door;
        if (!d.locked) break;
        opts.push({ label: 'Locked door', header: true });
        if (this.hasItem('keycard')) add('Use keycard', '{i:card}', () => { this.holdItem('keycard'); this.queue(e, 'unlock', { dur: 0.8 }); }, { hl: hid === 'keycard' });
        if (this.hasItem('lockpick')) add('Pick the lock', '{i:key}', () => { this.holdItem('lockpick'); this.queue(e, 'unlock', { dur: 3.2 }); }, { hl: hid === 'lockpick' });
        if (!this.hasItem('keycard') && !this.hasItem('lockpick')) opts.push({ label: 'Needs a keycard (guards, staff room) or a lockpick (gear shop)', header: true, dim: true });
        break;
      }
      case 'radio': if (!e.on) add('Turn the radio on (distraction)', '{i:music}', () => this.queue(e, 'radio')); else opts.push({ label: 'Radio is playing', header: true }); break;
      case 'fusebox': if (!e.on) add('Cut the power to this floor', '{i:bolt}', () => this.queue(e, 'fuse')); else opts.push({ label: 'Power is out', header: true }); break;
      case 'caralarm': if (!e.on) add('Set off the car alarm', '{i:alarm}', () => this.queue(e, 'alarm')); break;
      case 'blend': {
        const ok = e.outfits.includes(P.outfit);
        if (ok) add(`${e.act} (blend in)`, '{i:mask}', () => this.queue(e, 'blend'), { hl: true });
        else opts.push({ label: `${e.name}: needs ${e.outfits.map(o => OUTFIT_NAMES[o]).join(' / ')} disguise`, header: true, dim: true });
        break;
      }
      case 'container': {
        opts.push({ label: `${e.name} (${e.count || 0}/${e.cap})`, header: true });
        if (P.carrying) { if ((e.count || 0) < e.cap) add('Hide body here', '{i:box}', () => this.queue(e, 'hide'), { hl: true }); else opts.push({ label: 'Full', header: true, dim: true }); }
        break;
      }
      case 'exit':
        if (this.stats.targetDead) add(`Escape via ${e.name}`, '{i:door}', () => this.queue(e, 'exit'), { hl: true });
        else { opts.push({ label: e.name, header: true }); add('Abort contract (fail)', '{i:x}', () => UI.confirm('Abort the contract? You will fail.', () => this.endMission(false, 'Contract aborted'))); }
        break;
    }
    return opts;
  },
  targetAtStop(stop, r) { const s = this.M.stops[stop]; return s && this.targets && this.targets.some(t => t.state !== 'dead' && Math.hypot(t.x - (s.p[0] + 0.5), t.z - (s.p[2] + 0.5)) < r && Math.abs(t.y - s.p[1]) < 0.6); },
  // send nearby NPCs to investigate a distraction
  lure(pr, r, max, kind) {
    const p = pr.p, list = this.npcs.filter(n => !n.isTarget && n.kind !== 'bodyguard' && ['routine', 'investigate'].includes(n.state) && !n.hidden && Math.hypot(n.x - p[0], n.z - p[2]) < r && Math.abs(n.y - p[1]) < (kind === 'alarm' ? 8 : 2.5))
      .sort((a, b) => (GUARDLIKE(b.kind) - GUARDLIKE(a.kind)) * (kind === 'alarm' ? 10 : 0) + (kind === 'fuse' ? ((b.outfit === 'tech') - (a.outfit === 'tech')) * 10 : 0) + Math.hypot(a.x - p[0], a.z - p[2]) - Math.hypot(b.x - p[0], b.z - p[2]));
    for (const n of list.slice(0, max)) { n.state = 'investigate'; n.invP = [Math.floor(p[0]), Math.round(p[1]) - (kind === 'alarm' ? 1 : 0), Math.floor(p[2])]; n.path = null; n.invT = kind === 'fuse' ? 5 : 4; n.fixProp = pr; n.say = kind === 'radio' ? 'Who turned that on?' : kind === 'fuse' ? 'Power\'s out! I\'ll check the fuses.' : 'Whose car is that?'; }
  },
  goStation(e) { this.P.pending = { ent: e, opt: { fn: () => UI.openStation(e.st) }, reach: 2.4 }; this.pathToProp(e); },
  queue(ent, act, extra) {
    const P = this.P; P.blend = false;
    const reach = act === 'blend' ? 0.7 : act === 'unlock' ? 1.5 : act === 'sigdrop' ? 4 : act === 'pickup' || act === 'poison' || act === 'disguiseProp' || act === 'radio' || act === 'fuse' || act === 'sigrig' || act === 'sigpoison' ? 1.7 : act === 'alarm' ? 2.2 : (act === 'winch' || act === 'sauna' || act === 'speaker' || act === 'gas') ? 1.8 : act === 'hide' ? 1.9 : act === 'exit' ? 1.8 : 1.3;
    P.pending = { ent, opt: Object.assign({ act }, extra || {}), reach };
    if (ent.kind) this.findPath(P, [ent.x, ent.y, ent.z], true); else this.pathToProp(ent);
  },
  atPushSpot(n) {
    const s = this.M.stops.balcony; if (!s) return false;
    return Math.hypot(n.x - (s.p[0] + 0.5), n.z - (s.p[2] + 0.5)) < 1.8 && Math.abs(n.y - s.p[1]) < 0.5;
  },
  targetUnderChandelier() { const t = this.target, s = this.M.stops.speech; return t && s && t.state !== 'dead' && Math.hypot(t.x - (s.p[0] + 0.5), t.z - (s.p[2] + 0.5)) < 1.2 && Math.abs(t.y - s.p[1]) < 0.5; },
  targetInPool() { const t = this.target, s = this.M.stops.pool; return t && s && t.state !== 'dead' && Math.hypot(t.x - (s.p[0] + 0.5), t.z - (s.p[2] + 0.5)) < 4 && Math.abs(t.y - s.p[1]) < 0.6; },

  /* ---------- performing actions ---------- */
  startAction(dur, illegal, done, face) { this.P.action = { t: 0, dur, illegal, done, face }; if (dur > 0.7) Sfx.play('action'); },
  doOption(opt, e) {
    const P = this.P;
    if (opt.fn) { opt.fn(); return; }
    const S = this.stats;
    switch (opt.act) {
      case 'pickup':
        this.startAction(0.5, false, () => { e.gone = true; this.addItem(e.item, e.item === 'coin' ? 3 : 1); this.toast(`Picked up ${e.name}`); Sfx.play('pickup'); });
        break;
      case 'disguiseProp':
        this.startAction(1.6, true, () => { e.gone = true; this.changeOutfit(e.outfit); });
        break;
      case 'disguise':
        if (e.state !== 'dead' && e.state !== 'ko') return;
        this.startAction(1.8, true, () => { const o = e.outfit; e.outfit = 'underwear'; e.stripped = true; this.changeOutfit(o); });
        break;
      case 'drag':
        this.startAction(0.6, true, () => { P.carrying = e; e.carriedBy = true; UI.refreshButtons(); });
        break;
      case 'hide':
        this.startAction(1.2, true, () => { const b = P.carrying; if (!b) return; b.hidden = true; b.carriedBy = false; P.carrying = null; e.count = (e.count || 0) + 1; this.toast('Body hidden'); Sfx.play('close'); Progress.track('hide'); UI.refreshButtons(); });
        break;
      case 'subdue': case 'wire': case 'knife': {
        if (e.state === 'dead' || e.state === 'ko') return;
        const prevState = e.state; e.state = 'held'; e.path = null;
        { const bx = e.x - Math.sin(e.face) * 0.6, bz = e.z - Math.cos(e.face) * 0.6; if (this.W.walkable(Math.floor(bx), Math.round(e.y), Math.floor(bz))) { P.x = bx; P.z = bz; P.face = e.face; } }
        const dur = opt.act === 'subdue' ? 1.4 : opt.act === 'wire' ? 2.0 : 0.9;
        this.startAction(dur, true, () => {
          if (opt.act === 'subdue') { this.knockout(e); this.toast(`${e.isTarget ? 'Target' : 'NPC'} subdued`); if (e.isTarget) this.toast('Subdued, not dead — finish the job'); }
          else this.kill(e, opt.act === 'wire' ? 'wire' : 'melee', true);
        });
        e.face = Math.atan2(e.x - P.x, e.z - P.z);
        break;
      }
      case 'finish':
        if (e.state !== 'ko') return;
        this.startAction(1.2, true, () => this.kill(e, this.hasItem('wire') ? 'wire' : 'melee', true));
        break;
      case 'push': {
        if (!this.atPushSpot(e)) { this.toast('They moved away'); return; }
        e.state = 'held';
        this.startAction(0.9, true, () => {
          e.state = 'falling'; e.fallT = 0; e.fallFrom = [e.x, e.y, e.z]; e.fallTo = [e.x, G, e.z - 4.2]; Sfx.play('scream');
          this.noise([e.x, e.y, e.z], 10, 'scream');
        });
        break;
      }
      case 'poison':
        this.startAction(1.6, true, () => { const pt = ITEMS[opt.item].ptype; e.poison = pt; this.useItem(opt.item); this.toast(`${e.name} poisoned (${pt})`); Sfx.play('poison'); });
        break;
      case 'gas':
        this.startAction(2.0, true, () => { e.sabotaged = true; this.toast('Gas valve loosened. One spark...'); Sfx.play('action'); });
        break;
      case 'winch':
        this.startAction(1.0, true, () => { e.used = true; this.dropChandelier(); });
        break;
      case 'sauna':
        this.startAction(1.4, true, () => { e.sabotaged = true; this.toast('Sauna overheating and locked'); Sfx.play('action'); this.checkSauna(); });
        break;
      case 'speaker':
        this.startAction(0.8, true, () => { e.used = true; e.fallT = 0; this.electrocutePool(); });
        break;
      case 'keycard':
        this.startAction(0.7, true, () => { e.keycard = false; this.addItem('keycard', 1); this.toast('Took a keycard'); Sfx.play('pickup'); });
        break;
      case 'unlock':
        this.startAction(opt.dur || 2, true, () => { const d = e.door; d.locked = false; e.gone = true; for (const [x, z] of d.cells) this.lockedKeys.delete((d.y * this.W.D + z) * this.W.W + x); this.toast('Door unlocked'); Sfx.play('open'); });
        break;
      case 'sigrig':
        this.startAction(2.2, true, () => { e.sabotaged = true; this.toast(`${e.name} rigged. Wait for the target.`); Sfx.play('action'); });
        break;
      case 'sigpoison':
        this.startAction(1.6, true, () => { e.poison = 'lethal'; this.useItem('poison'); this.toast(`${e.name} poisoned`); Sfx.play('poison'); });
        break;
      case 'sigdrop':
        this.startAction(0.8, true, () => { e.dropping = true; e.dropY = 0; e.vy = 0; this.fx.push({ type: 'sigdrop', pr: e, t: 0, dur: 0.8 }); });
        break;
      case 'radio':
        this.startAction(0.6, true, () => { e.on = true; e.radioT = 0; this.toast('Radio on'); this.lure(e, 14, 1, 'radio'); });
        break;
      case 'fuse':
        this.startAction(1.2, true, () => { e.on = true; this.blackout = { y: Math.round(e.p[1] - 0.0), t: 35, pr: e }; Sfx.play('zap'); this.toast('Power cut! Lights out on this floor.'); this.lure(e, 30, 1, 'fuse'); });
        break;
      case 'alarm':
        this.startAction(0.5, true, () => { e.on = true; e.alarmT = 9; Sfx.play('alarm'); this.toast('Car alarm!'); this.lure(e, 26, 3, 'alarm'); });
        break;
      case 'blend':
        this.startAction(0.5, false, () => { P.blend = true; P.x = e.p[0]; P.z = e.p[2]; this.toast(`Blending in: ${e.act}`); });
        break;
      case 'exit':
        this.startAction(0.6, false, () => this.endMission(true));
        break;
    }
  },
  changeOutfit(o) {
    const P = this.P; P.outfit = o; this.stats.disguises++;
    if (o !== 'suit') this.stats.suitOnly = false;
    for (const n of this.npcs) { if (n.triggered && GUARDLIKE(n.kind) && n.state !== 'alert') { n.triggered = false; n.susp = 0; } }
    this.toast(`Disguise: ${OUTFIT_NAMES[o]}`);
    Sfx.play('disguise'); Progress.track('disguise', { outfit: o });
    UI.refreshInv();
  },
  dropBody() { const P = this.P; if (!P.carrying) return; const b = P.carrying; b.carriedBy = false; P.carrying = null; b.x = P.x + Math.sin(P.face) * 0.6; b.z = P.z + Math.cos(P.face) * 0.6; b.found = b.found || false; UI.refreshButtons(); },

  shoot(n, gunId) {
    const P = this.P, it = ITEMS[gunId];
    const d = Math.hypot(n.x - P.x, n.z - P.z);
    if (d > 22) { this.toast('Too far away'); return; }
    if (!this.W.los([P.x, P.y + 1.5, P.z], [n.x, n.y + 1.4, n.z])) { this.toast('No clear shot'); return; }
    P.path = null; P.pending = null;
    P.face = Math.atan2(n.x - P.x, n.z - P.z); P.aimT = 0.6; P.illegalT = Math.max(P.illegalT, 1.5);
    this.fx.push({ type: 'tracer', a: [P.x + Math.sin(P.face) * 0.4, P.y + 1.35, P.z + Math.cos(P.face) * 0.4], b: [n.x, n.y + 1.4, n.z], t: 0, dur: 0.1, col: [1, 0.9, 0.5] });
    Sfx.play(it.loud ? 'gun' : 'silenced'); this.stats.usedGun = true; Engine.shakeAmt = Math.max(Engine.shakeAmt, it.loud ? 0.35 : 0.1);
    if (it.tranq) this.knockout(n); else this.kill(n, 'pistol', true);
    this.noise([P.x, P.y, P.z], it.loud ? 34 : 3.5, it.loud ? 'gunshot' : 'thud');
  },
  throwCoin(cell) {
    const P = this.P;
    const d = Math.hypot(cell[0] + 0.5 - P.x, cell[2] + 0.5 - P.z);
    if (d > 14) { this.toast('Too far to throw'); return; }
    this.useItem('coin'); this.stats.coins++; Progress.track('coin'); Sfx.play('tap');
    P.face = Math.atan2(cell[0] + 0.5 - P.x, cell[2] + 0.5 - P.z);
    const pr = { id: this.nid++, type: 'coinFly', p: [P.x, P.y + 1.4, P.z], from: [P.x, P.y + 1.4, P.z], to: [cell[0] + 0.5, cell[1] + 0.05, cell[2] + 0.5], t: 0 };
    this.props.push(pr);
    this.fx.push({ type: 'coin', pr, t: 0, dur: 0.55 });
  },
  placeCharge() {
    const P = this.P;
    this.useItem('charge');
    this.props.push({ id: this.nid++, type: 'charge', p: [P.x, P.y, P.z] });
    this.toast('Charge placed — tap DETONATE when ready');
    UI.refreshButtons();
  },
  detonate() {
    const ch = this.props.filter(p => p.type === 'charge' && !p.gone);
    for (const c of ch) { c.gone = true; this.explode(c.p, 3.2, 'explosive'); }
    UI.refreshButtons();
  },

  /* ---------- deaths ---------- */
  kill(n, method, byPlayer, via) {
    if (n.state === 'dead') return;
    n.state = 'dead'; n.path = null; n.deathT = this.time; n.method = method;
    n.accident = method === 'accident' || method === 'poison';
    if (byPlayer !== false) { this.stats.kills++; Progress.track('kill', { method, via, target: !!n.isTarget }); }
    const left = n.isTarget && this.targets ? this.targets.filter(t => t !== n && t.state !== 'dead').length : 0;
    if (n.isTarget && left > 0) {
      this.stats.method = method; this.stats.via = via || null;
      Sfx.play('target'); UI.popup([n.x, n.y + 2.2, n.z], 'TARGET DOWN', 'red'); this.toast(`Target eliminated — ${left} remaining`, 'big good');
      this.slowmo = 0.9; this.killcam = n;
    } else if (n.isTarget) {
      this.stats.targetDead = true; this.stats.method = method; this.stats.via = via || null;
      this.toast(this.C.mode === 'sniper' ? 'All targets eliminated' : 'Get to an exit');
      Sfx.play('target'); UI.killFlash(true, method, via); UI.popup([n.x, n.y + 2.2, n.z], 'TARGET DOWN', 'red');
      this.slowmo = 1.6; this.killcam = n;
      try { navigator.vibrate && navigator.vibrate([60, 40, 120]); } catch (e) { }
      UI.refreshButtons();
    } else {
      if (byPlayer !== false) this.stats.nonTarget++;
      Sfx.play('kill');
      if (byPlayer !== false) UI.popup([n.x, n.y + 2, n.z], 'NON-TARGET', 'grey');
    }
  },
  knockout(n) { if (n.state === 'dead') return; n.state = 'ko'; n.path = null; n.koT = this.time; if (this.stats) this.stats.kos++; Sfx.play('ko'); Progress.track('ko'); UI.popup([n.x, n.y + 2, n.z], 'SUBDUED', 'grey'); },
  explode(p, r, method) {
    this.fx.push({ type: 'boom', p: p.slice(), t: 0, dur: 0.8 }); Sfx.play('boom'); Engine.shakeAmt = Math.max(Engine.shakeAmt, 0.9);
    try { navigator.vibrate && navigator.vibrate(200); } catch (e) { }
    for (const n of this.npcs) {
      if (n.state === 'dead') continue;
      const d = Math.hypot(n.x - p[0], n.z - p[2]); if (d < r && Math.abs(n.y - p[1]) < 2.5) this.kill(n, method === 'accident' ? 'accident' : 'explosive', true, method === 'accident' ? 'gas' : 'charge');
    }
    const P = this.P; const dp = Math.hypot(P.x - p[0], P.z - p[2]);
    if (dp < r && Math.abs(P.y - p[1]) < 2.5) this.damagePlayer(70);
    this.noise(p, 40, method === 'accident' ? 'accident' : 'gunshot');
  },
  dropChandelier() {
    const ch = this.props.find(p => p.type === 'chandelier'); if (!ch) return;
    ch.dropping = true; ch.dropY = 0; ch.vy = 0;
    this.fx.push({ type: 'chand', pr: ch, t: 0, dur: 0.7 });
  },
  electrocutePool() {
    const s = this.M.stops.pool; if (!s) return;
    this.fx.push({ type: 'zap', p: [s.p[0] + 0.5, s.p[1] + 0.5, s.p[2] + 0.5], t: 0, dur: 1.2 }); Sfx.play('zap'); Engine.shakeAmt = Math.max(Engine.shakeAmt, 0.15);
    let any = false;
    for (const n of this.npcs) {
      if (n.state === 'dead') continue;
      const pr = this.M.poolRect;
      if (Math.abs(n.y - pr.y) < 0.4 && n.x > pr.x0 && n.x < pr.x1 && n.z > pr.z0 && n.z < pr.z1) { this.kill(n, 'accident', true, 'pool'); any = true; }
    }
    if (!any) this.toast('Nobody was in the pool...');
    this.noise([s.p[0], s.p[1], s.p[2]], 14, 'accident');
  },
  checkSauna() {
    const s = this.M.stops.sauna, t = this.target; if (!s || !t || t.state === 'dead') return;
    if (Math.hypot(t.x - (s.p[0] + 0.5), t.z - (s.p[2] + 0.5)) < 2.5 && Math.abs(t.y - s.p[1]) < 0.5) { t.saunaT = 5; }
  },
  damagePlayer(d) {
    const P = this.P; if (P.dead) return;
    P.hp -= d; P.lastHit = this.time; UI.flashHit(); Sfx.play('hit'); Engine.shakeAmt = Math.max(Engine.shakeAmt, 0.25);
    try { navigator.vibrate && navigator.vibrate(40); } catch (e) { }
    if (P.hp <= 0) { P.hp = 0; P.dead = true; P.deathT = this.time; Sfx.play('fail'); if (P.carrying) this.dropBody(); setTimeout(() => this.endMission(false, 'You were killed'), 1500); }
  },

  /* ---------- noise ---------- */
  noise(p, r, kind) {
    if (this.C && this.C.mode === 'sniper' && kind === 'gunshot') kind = 'accident';
    let lured = 0;
    const cand = this.npcs.filter(n => n.state !== 'dead' && n.state !== 'ko' && n.state !== 'held' && n.state !== 'falling' && n.poisonT === undefined && n.saunaT === undefined && Math.hypot(n.x - p[0], n.z - p[2]) < r && Math.abs(n.y - p[1]) < (kind === 'coin' ? 2 : 8))
      .sort((a, b) => Math.hypot(a.x - p[0], a.z - p[2]) - Math.hypot(b.x - p[0], b.z - p[2]));
    for (const n of cand) {
      if (kind === 'coin') {
        if (n.isTarget || n.kind === 'bodyguard' || n.state === 'alert' || n.state === 'flee') continue;
        if (lured >= 2) break; lured++;
        n.state = 'investigate'; n.invP = p.slice(); n.path = null; n.invT = 4; n.say = '?';
      } else if (kind === 'gunshot') {
        if (GUARDLIKE(n.kind)) { this.alertGuard(n, [this.P.x, this.P.y, this.P.z]); }
        else if (!n.isTarget || true) { this.flee(n, p); }
      } else if (kind === 'scream' || kind === 'accident') {
        if (GUARDLIKE(n.kind) && n.state !== 'alert') { n.state = 'search'; n.invP = p.slice(); n.path = null; n.invT = 8; n.say = '!'; }
        else if (n.kind !== 'guard' && Math.hypot(n.x - p[0], n.z - p[2]) < 9) this.flee(n, p);
      }
    }
  },
  flee(n, from) {
    if (n.state === 'dead' || n.state === 'ko' || n.state === 'falling' || n.state === 'held') return;
    if (n.isTarget && this.C.mode !== 'tutorial') { this.startEscape(n); return; }
    n.state = 'flee'; n.path = null; n.fleeFrom = from; n.fleeT = 14; n.say = '!!';
  },
  // targets in danger run for an exit: if they reach it, the contract fails
  startEscape(t) {
    if (t.state === 'escape' || t.state === 'dead' || t.state === 'ko' || t.state === 'held' || t.state === 'falling' || t.escaped) return;
    let best = null, bd = 1e9;
    for (const e of this.M.exits) { const d = Math.hypot(e.p[0] - t.x, e.p[2] - t.z); if (d < bd) { bd = d; best = e; } }
    if (!best) return;
    t.state = 'escape'; t.path = null; t.escTo = best; t.atStop = null; t.say = 'Get me out of here!';
    this.toast(`${t.name} is fleeing to the ${best.label}!`, 'bad'); Sfx.play('spotted');
  },
  alertGuard(n, at) {
    if (n.state === 'dead' || n.state === 'ko') return;
    if (n.state !== 'alert') { n.say = '!!'; }
    n.state = 'alert'; n.lastSeen = at.slice(); n.lostT = 0; n.path = null; n.repath = 0;
    if (!this.npcs.some(o => o !== n && o.state === 'alert') && (!this._alarmT || this.time - this._alarmT > 8)) { this._alarmT = this.time; Sfx.play('alarm'); }
    this.stats.combat = true; this.stats.spotted = true;
    if (this.targets && this.C.mode !== 'tutorial') for (const t of this.targets) if (Math.hypot(t.x - n.x, t.z - n.z) < 30 || this.C.mode === 'elusive') this.startEscape(t);
  },

  /* ---------- NPC AI ---------- */
  updateNPC(n, dt) {
    if (n.hidden) return;
    if (n.state === 'dead' || n.state === 'ko') return;
    if (n.state === 'falling') {
      n.fallT += dt * 1.2; const t = Math.min(1, n.fallT);
      n.x = n.fallFrom[0] + (n.fallTo[0] - n.fallFrom[0]) * t; n.z = n.fallFrom[2] + (n.fallTo[2] - n.fallFrom[2]) * t;
      n.y = n.fallFrom[1] + (n.fallTo[1] - n.fallFrom[1]) * t * t + Math.sin(t * Math.PI) * 0.8;
      if (t >= 1) { n.y = n.fallTo[1]; this.kill(n, 'accident', true, 'push'); this.noise([n.x, n.y, n.z], 12, 'accident'); Engine.shakeAmt = Math.max(Engine.shakeAmt, 0.2); }
      return;
    }
    if (n.state === 'held') return;
    // poison effects
    if (n.poisonT !== undefined) {
      n.poisonT -= dt; n.say = 'Urgh...';
      if (n.poisonT <= 0) { n.poisonT = undefined; this.kill(n, 'poison', true, n.sigPoison ? 'signature' : undefined); this.noise([n.x, n.y, n.z], 8, 'accident'); return; }
      return;
    }
    if (n.saunaT !== undefined) {
      n.saunaT -= dt; n.say = 'So... hot...';
      if (n.saunaT <= 0) { n.saunaT = undefined; this.kill(n, 'accident', true, 'sauna'); return; }
      return;
    }
    // perception
    n.percO += dt;
    if (n.percO >= 0.2) { this.perceive(n, n.percO); n.percO = 0; }
    if (n.sayT !== undefined) { n.sayT -= dt; if (n.sayT <= 0) { n.say = null; n.sayT = undefined; } } else if (n.say) n.sayT = 2.2;
    const spd = n.speed * (n.state === 'alert' || n.state === 'flee' ? 2.1 : 1);
    switch (n.state) {
      case 'routine': this.npcRoutine(n, dt, spd); break;
      case 'investigate': case 'search': {
        if (!n.path) { if (!this.findPath(n, n.invP)) break; if (!n.path) { n.state = 'routine'; break; } }
        if (this.stepPath(n, dt, spd * (n.state === 'search' ? 1.3 : 1))) { n.invT -= dt; if (n.invT <= 0) { if (n.fixProp) { const fp = n.fixProp; fp.on = false; if (fp.type === 'fusebox' && this.blackout) { this.blackout = null; this.toast('Power restored'); } n.fixProp = null; } n.state = 'routine'; n.path = null; n.waitT = 0; } }
        break;
      }
      case 'confront': {
        const P = this.P;
        n.confT -= dt;
        const d = Math.hypot(P.x - n.x, P.z - n.z);
        if (d > 2.2) { n.repath = (n.repath || 0) - dt; if (n.repath <= 0) { n.repath = 0.8; this.findPath(n, [P.x, P.y, P.z]); } this.stepPath(n, dt, spd); }
        else n.face = lerpAng(n.face, Math.atan2(P.x - n.x, P.z - n.z), dt * 8);
        const tres = !ACCESS[P.outfit].includes(this.W.zoneAt(P.x, P.y, P.z));
        if (!tres) { n.state = 'routine'; n.path = null; n.triggered = false; n.susp = 0.3; n.say = 'Stay out.'; }
        else if (n.confT <= 0) { this.alertGuard(n, [P.x, P.y, P.z]); this.toast('Hostile! They are shooting!', 'bad'); }
        break;
      }
      case 'alert': this.npcCombat(n, dt, spd); break;
      case 'flee': {
        n.fleeT -= dt;
        if (!n.path) {
          const sp = this.M.spots.street || [[30, G, 24]];
          let best = sp[0], bd = -1;
          for (const s of sp) { const d = Math.hypot(s[0] - n.fleeFrom[0], s[2] - n.fleeFrom[2]); if (d > bd) { bd = d; best = s; } }
          if (!this.findPath(n, best)) break;
          if (!n.path) n.path = [];
        }
        this.stepPath(n, dt, spd);
        if (n.fleeT <= 0) { n.state = 'routine'; n.path = null; n.waitT = 3; n.panic = false; }
        break;
      }
      case 'escape': {
        const e = n.escTo;
        if (!n.path) { if (!this.findPath(n, [Math.floor(e.p[0]), e.p[1], Math.floor(e.p[2])], true)) break; if (!n.path) n.path = []; }
        this.stepPath(n, dt, n.speed * 2.2);
        if (Math.hypot(n.x - e.p[0], n.z - e.p[2]) < 1.8) {
          n.hidden = true; n.escaped = true; n.state = 'dead';
          if (!this.stats.targetDead) { this.toast(`${n.name} escaped!`, 'bad'); setTimeout(() => this.endMission(false, `${n.name} escaped`), 900); }
        }
        break;
      }
      case 'sick': {
        const s = this.M.stops.bathroom;
        if (!n.path) { if (!this.findPath(n, s.p)) break; if (!n.path) n.path = []; }
        if (this.stepPath(n, dt, spd * 1.3)) { n.sickT -= dt; n.say = '*retching*'; n.face = s.face; if (n.sickT <= 0) { n.state = 'routine'; n.path = null; n.waitT = 0; } }
        break;
      }
    }
  },
  npcRoutine(n, dt, spd) {
    if (n.isTarget) return this.targetRoutine(n, dt, spd);
    if (n.kind === 'bodyguard') {
      const t = this.npcs.find(x => x.id === n.follow);
      if (!t || t.state === 'dead') { n.kind = 'guard'; n.route = [[Math.floor(n.x), Math.round(n.y), Math.floor(n.z), 6]]; return; }
      const priv = t.atStop && ['balcony', 'sauna', 'pool', 'office', 'bathroom'].includes(t.atStop);
      const keep = priv ? 6 : 2.6;
      const d = Math.hypot(t.x - n.x, t.z - n.z) + Math.abs(t.y - n.y) * 2;
      if (d > keep) { n.repath = (n.repath || 0) - dt; if (n.repath <= 0 || !n.path) { n.repath = 1.0; this.findPath(n, [t.x, t.y, t.z], true); } if (n.path && n.pi < n.path.length - (priv ? 3 : 1)) this.stepPath(n, dt, spd * 1.1); }
      else { n.moving = false; n.face = lerpAng(n.face, Math.atan2(t.x - n.x, t.z - n.z), dt * 3); }
      return;
    }
    if (n.waitT > 0) {
      n.waitT -= dt; n.moving = false;
      if (n.talkTo && n.talkTo.state === 'routine') n.faceTo = Math.atan2(n.talkTo.x - n.x, n.talkTo.z - n.z);
      if (n.idle === 'look') n.faceTo = (n.faceTo0 || n.face) + Math.sin(this.time * 0.8 + n.id) * 0.9;
      if (n.faceTo !== undefined && n.faceTo !== null) n.face = lerpAng(n.face, n.faceTo, dt * 4);
      if (n.waitT <= 0) { n.idle = null; n.talkTo = null; }
      return;
    }
    n.idle = n.outfit === 'waiter' && !n.post ? 'tray' : null;
    if (!n.path) {
      let goal;
      if (n.route) {
        if (n.post && n.route.length === 1) {
          const r = n.route[0]; const d = Math.hypot(r[0] + 0.5 - n.x, r[2] + 0.5 - n.z);
          if (d < 0.6) { n.waitT = 3; n.faceTo = n.postFace; return; }
          goal = r;
        } else { n.routeI = (n.routeI + 1) % n.route.length; goal = n.route[n.routeI]; }
        n.nextWait = goal[3] || 3; n.faceTo = null;
      } else if (n.group) {
        const sp = this.M.spots[n.group];
        const s = sp[Math.floor(Math.random() * sp.length)];
        goal = [s[0], s[1], s[2]]; n.sitNext = s[4] === 'sit'; n.nextWait = n.sitNext ? 14 + Math.random() * 20 : 6 + Math.random() * 14; n.faceTo = s[3];
      } else { n.waitT = 5; return; }
      if (!this.findPath(n, goal)) { n.waitT = 0.3; return; }
      if (!n.path) { n.waitT = 4; return; }
    }
    if (this.stepPath(n, dt, spd)) { n.path = null; n.waitT = n.nextWait || 4; if (n.faceTo === null) n.faceTo = n.face + (Math.random() - 0.5) * 2; this.pickIdle(n); }
  },
  pickIdle(n) {
    const r = Math.random(); n.talkTo = null;
    if (n.kind === 'guest') {
      if (n.sitNext) { n.idle = 'sit'; n.sitNext = false; if (r < 0.4) { const o = this.npcs.find(m => m !== n && m.kind === 'guest' && m.state === 'routine' && !m.moving && Math.hypot(m.x - n.x, m.z - n.z) < 2.5); if (o) n.talkTo = null; } return; }
      if (n.group === 'ballroom' && r < 0.45) { n.idle = 'dance'; return; }
      if (r < 0.6) { const o = this.npcs.find(m => m !== n && m.kind === 'guest' && m.state === 'routine' && !m.moving && Math.hypot(m.x - n.x, m.z - n.z) < 3.2); n.idle = 'talk'; if (o) { n.talkTo = o; if (!o.talkTo) { o.talkTo = n; o.idle = 'talk'; } } return; }
      n.idle = r < 0.8 ? 'drink' : r < 0.92 ? 'phone' : null; return;
    }
    if (GUARDLIKE(n.kind)) { n.idle = r < 0.3 ? 'radio' : 'look'; n.faceTo0 = n.faceTo !== null && n.faceTo !== undefined ? n.faceTo : n.face; return; }
    if (n.outfit === 'chef') { n.idle = 'chop'; return; }
    if (n.outfit === 'waiter') { n.idle = n.post ? 'wipe' : 'tray'; return; }
    if (n.outfit === 'cleaner') { n.idle = 'wipe'; return; }
    n.idle = null;
  },
  targetRoutine(n, dt, spd) {
    if (n.tutHold) { n.moving = false; n.idle = 'smoke'; return; }
    const stName = n.stops[n.stopI % n.stops.length];
    const st = this.M.stops[stName];
    if (!n.path && !n.atStop) {
      if (!this.findPath(n, st.p, true)) { n.atStop = stName; n.stopT = 0; n.dwell = 3; n.acted = true; return; }
      if (!n.path) { n.path = []; }
    }
    if (!n.atStop) {
      n.idle = null;
      if (this.stepPath(n, dt, spd)) { n.atStop = stName; n.stopT = 0; n.path = null; n.dwell = 20 + Math.random() * 8; n.acted = false; }
      return;
    }
    // at stop
    n.moving = false; n.face = lerpAng(n.face, st.face, dt * 4);
    n.idle = { bar: 'drink', office: 'drink', privatebar: 'drink', balcony: 'smoke', speech: 'toast', buffet: 'drink', pool: null, sauna: null, kitchen: 'talk' }[stName] || null;
    n.stopT += dt;
    if (!n.acted && n.stopT > 3) {
      n.acted = true;
      const pr = this.props.find(p => p.stop === stName && !p.gone);
      if (pr && pr.type === 'consumable') {
        if (pr.poison === 'lethal') { n.poisonT = 4; pr.consumed = true; this.toast(this.C.intel ? 'Target drank the poison' : 'Someone is choking...'); }
        else if (pr.poison === 'emetic') { pr.poison = null; n.state = 'sick'; n.sickT = 12; n.path = null; n.atStop = null; n.stopI++; this.toast(this.C.intel ? 'Target feels sick — heading to the bathroom' : 'Someone is feeling sick'); return; }
      }
      if (pr && pr.type === 'stove' && pr.sabotaged) { pr.sabotaged = false; pr.gone = false; this.explode([pr.p[0], pr.p[1], pr.p[2]], 2.8, 'accident'); return; }
      if (pr && pr.type === 'sauna' && pr.sabotaged) { n.saunaT = 5; }
      if (pr && pr.type === 'sig') {
        if (pr.sig.type === 'rig' && pr.sabotaged) { pr.sabotaged = false; pr.used = true; Sfx.play(pr.sig.name.includes('Fireworks') ? 'boom' : 'zap'); this.fx.push({ type: 'zap', p: [pr.p[0], pr.p[1] + 0.8, pr.p[2]], t: 0, dur: 0.8 }); this.kill(n, 'accident', true, 'signature'); this.noise([n.x, n.y, n.z], 12, 'accident'); return; }
        if (pr.sig.type === 'poison' && pr.poison === 'lethal') { pr.consumed = true; n.poisonT = 4; n.sigPoison = true; }
      }
    }
    if (n.stopT > 3.5 && stName === 'sauna') { const pr = this.props.find(p => p.type === 'sauna'); if (pr && pr.sabotaged && n.saunaT === undefined && n.state !== 'dead') n.saunaT = 5; }
    if (n.stopT >= n.dwell) { n.atStop = null; n.stopI++; n.path = null; }
  },
  npcCombat(n, dt, spd) {
    const P = this.P;
    if (P.dead) { n.state = 'search'; n.invT = 5; n.invP = [P.x, P.y, P.z]; return; }
    const d = Math.hypot(P.x - n.x, P.z - n.z), dy = Math.abs(P.y - n.y);
    const sees = d < 20 && dy < 2.5 && this.W.los([n.x, n.y + 1.6, n.z], [P.x, P.y + 1.3, P.z]);
    if (sees) { n.lastSeen = [P.x, P.y, P.z]; n.lostT = 0; } else n.lostT += dt;
    n.shootT = (n.shootT || 0.6) - dt;
    if (sees && d < 15) {
      n.moving = false; n.face = lerpAng(n.face, Math.atan2(P.x - n.x, P.z - n.z), dt * 10); n.aim = true;
      if (n.shootT <= 0) {
        n.shootT = 1.1 + Math.random() * 0.5;
        this.fx.push({ type: 'tracer', a: [n.x + Math.sin(n.face) * 0.4, n.y + 1.35, n.z + Math.cos(n.face) * 0.4], b: [P.x + (Math.random() - 0.5), P.y + 1.2, P.z + (Math.random() - 0.5)], t: 0, dur: 0.08, col: [1, 0.85, 0.4] });
        Sfx.play('enemyGun');
        const hit = Math.random() < Math.max(0.18, 0.62 - d * 0.03);
        if (hit) this.damagePlayer(13 * this.D.dmg);
        // alert nearby guards
        if (Math.random() < 0.3) for (const g of this.npcs) if (GUARDLIKE(g.kind) && g.state !== 'alert' && g.state !== 'dead' && g.state !== 'ko' && Math.hypot(g.x - n.x, g.z - n.z) < 18) this.alertGuard(g, n.lastSeen);
      }
    } else {
      n.aim = false;
      n.repath = (n.repath || 0) - dt;
      if (n.repath <= 0 || !n.path) { n.repath = 1.4 + Math.random() * 0.4; this.findPath(n, n.lastSeen); }
      this.stepPath(n, dt, spd);
    }
    if (n.lostT > 22) { n.state = 'search'; n.invP = n.lastSeen.slice(); n.invT = 6; n.path = null; n.aim = false; n.triggered = false; n.susp = 0.5; }
  },
  perceive(n, dt) {
    const P = this.P, W = this.W;
    if (P.dead || n.state === 'alert') return;
    const g = GUARDLIKE(n.kind);
    const dx = P.x - n.x, dz = P.z - n.z, dy = P.y - n.y, dist = Math.hypot(dx, dz);
    let range = g ? 13 : 9.5;
    if (this.blackout && Math.abs(n.y - this.blackout.y) < 2 && n.x >= BX && n.x < BX + BW && n.z >= BZ && n.z < BZ + BD) range *= 0.5;
    if (n.isTarget) range = 9;
    let seen = false;
    if (dist < range && Math.abs(dy) < 2.6) {
      const ang = Math.abs(angDiff(n.face, Math.atan2(dx, dz)));
      if (ang < 1.15 || dist < 1.6) seen = W.los([n.x, n.y + 1.65, n.z], [P.x, P.y + 1.2, P.z]);
    }
    n.seesP = seen;
    let rate = 0;
    if (seen && !P.dead) {
      const zone = W.zoneAt(P.x, P.y + 0.1, P.z);
      const tres = !ACCESS[P.outfit].includes(zone);
      const held = this.heldItem();
      const illegal = P.illegalT > 0 || (held && ITEMS[held.id].illegal) || !!P.carrying;
      const enforcer = P.outfit !== 'suit' && P.outfit !== 'guest' && n.outfit === P.outfit && dist < 4.5 && n.kind !== 'target';
      const k = Math.max(0.25, 1.35 - dist / range);
      if (illegal) rate = 2.6 * k;
      else if (g && tres) rate = 0.75 * k;
      else if (enforcer) rate = 0.33;
      if (this.C.mode === 'tutorial') rate *= 0.15;
      if (P.blend && n.reason !== 'illegal' && !(P.illegalT > 0)) rate = 0;
      rate *= this.D.susp;
      if (rate > 0) { n.susp += rate * dt; n.lastSeen = [P.x, P.y, P.z]; n.reason = illegal ? 'illegal' : tres ? 'trespass' : 'enforcer'; }
    }
    if (rate === 0) n.susp = Math.max(0, n.susp - 0.14 * dt);
    if (n.susp >= 1 && !n.triggered) {
      n.triggered = true; n.susp = 1;
      if (!this.stats.spotted) { this.toast('You have been spotted!', 'bad'); }
      Sfx.play('spotted');
      this.stats.spotted = true; this.stats.spottedBy++;
      if (g) {
        if (n.reason === 'trespass') { n.state = 'confront'; n.confT = 5; n.path = null; n.say = 'Hey! You can\'t be here!'; }
        else { this.alertGuard(n, [P.x, P.y, P.z]); for (const o of this.npcs) if (GUARDLIKE(o.kind) && o !== n && o.state !== 'dead' && o.state !== 'ko' && Math.hypot(o.x - n.x, o.z - n.z) < 16 && Math.abs(o.y - n.y) < 4) this.alertGuard(o, [P.x, P.y, P.z]); if (n.reason === 'enforcer') this.toast('Disguise blown!', 'bad'); }
      } else {
        this.flee(n, [P.x, P.y, P.z]);
        // report
        let ng = null, nd = 1e9;
        for (const o of this.npcs) if (o.kind === 'guard' && o.state !== 'dead' && o.state !== 'ko' && o.state !== 'alert') { const d = Math.hypot(o.x - n.x, o.z - n.z) + Math.abs(o.y - n.y) * 4; if (d < nd) { nd = d; ng = o; } }
        if (ng && nd < 30) { if (n.reason === 'illegal') this.alertGuard(ng, [P.x, P.y, P.z]); else { ng.state = 'search'; ng.invP = [P.x, P.y, P.z]; ng.invT = 6; ng.path = null; } }
      }
    }
    // bodies
    for (const b of this.npcs) {
      if ((b.state !== 'dead' && b.state !== 'ko') || b.hidden || b.carriedBy || b.found) continue;
      const bx = b.x - n.x, bz = b.z - n.z, bd = Math.hypot(bx, bz);
      if (bd > 10 || Math.abs(b.y - n.y) > 2.6) continue;
      const ang = Math.abs(angDiff(n.face, Math.atan2(bx, bz)));
      if (ang > 1.2 && bd > 1.6) continue;
      if (!W.los([n.x, n.y + 1.65, n.z], [b.x, b.y + 0.3, b.z])) continue;
      b.found = true;
      if (this.C.mode === 'sniper') Sniper.panic(b);
      if (!b.accident && b.state === 'dead' || b.state === 'ko') { this.stats.bodiesFound++; this.toast('A body was found!', 'bad'); }
      if (g) { n.state = 'search'; n.invP = [b.x, b.y, b.z]; n.invT = 10; n.path = null; n.say = '!'; }
      else { this.flee(n, [b.x, b.y, b.z]); }
      if (b.isTarget && b.state === 'ko') { }
      break;
    }
  },

  /* ---------- effects ---------- */
  updateFX(dt) {
    for (const f of this.fx) {
      f.t += dt;
      if (f.type === 'coin') {
        const k = Math.min(1, f.t / f.dur), pr = f.pr;
        pr.p[0] = pr.from[0] + (pr.to[0] - pr.from[0]) * k; pr.p[2] = pr.from[2] + (pr.to[2] - pr.from[2]) * k;
        pr.p[1] = pr.from[1] + (pr.to[1] - pr.from[1]) * k + Math.sin(k * Math.PI) * 1.4;
        if (k >= 1 && !f.done) { f.done = true; pr.gone = true; this.noise(pr.to, 7.5, 'coin'); Sfx.play('coin'); }
      }
      if (f.type === 'chand') {
        const pr = f.pr; pr.vy += dt * 22; pr.dropY -= pr.vy * dt;
        if (pr.dropY <= -1.95) {
          pr.dropY = -1.95;
          if (!f.done) {
            f.done = true; pr.dropped = true; pr.dropping = false;
            let hitAny = false;
            for (const n of this.npcs) { if (n.state === 'dead') continue; if (Math.hypot(n.x - pr.p[0], n.z - pr.p[2]) < 1.45 && Math.abs(n.y - (pr.p[1] - 2)) < 0.6) { this.kill(n, 'accident', true, 'chandelier'); hitAny = true; } }
            Sfx.play('crash'); Engine.shakeAmt = Math.max(Engine.shakeAmt, 0.4);
            this.noise([pr.p[0], pr.p[1] - 2, pr.p[2]], 18, 'accident');
            this.fx.push({ type: 'dust', p: [pr.p[0], pr.p[1] - 2, pr.p[2]], t: 0, dur: 0.8 });
            if (!hitAny) this.toast('The chandelier crashed... and missed');
          }
        }
      }
      if (f.type === 'sigdrop') {
        const pr = f.pr; pr.vy += dt * 22; pr.dropY -= pr.vy * dt;
        if (pr.dropY <= -2.0 && !f.done) {
          pr.dropY = -2.0; f.done = true; pr.dropped = true;
          for (const n of this.npcs) { if (n.state === 'dead') continue; if (Math.hypot(n.x - pr.p[0], n.z - pr.p[2]) < 1.3 && Math.abs(n.y - (pr.p[1] - 2.2)) < 0.8) this.kill(n, 'accident', true, 'signature'); }
          Sfx.play('crash'); Engine.shakeAmt = Math.max(Engine.shakeAmt, 0.4); this.noise([pr.p[0], pr.p[1] - 2, pr.p[2]], 16, 'accident');
        }
      }
      if (f.type === 'zap') { const sp = this.props.find(p => p.type === 'speaker'); if (sp) sp.fallT = Math.min(1, (sp.fallT || 0) + dt * 2); }
    }
    this.fx = this.fx.filter(f => f.t < f.dur || ((f.type === 'chand' || f.type === 'sigdrop') && !f.done));
    for (const pr of this.props) if (pr.type === 'speaker' && pr.used && pr.fallT !== undefined) pr.fallT = Math.min(1, pr.fallT + dt * 2);
    if (this.target && this.target.atStop === 'sauna') this.checkSaunaTick();
  },
  checkSaunaTick() { },

  /* ---------- end ---------- */
  endMission(success, reason) {
    if (this.mode !== 'mission') return;
    const S = this.stats, C = this.C, sv = this.S;
    this.mode = 'result';
    if (C.mode === 'sniper') return Sniper.end(success, reason);
    if (C.mode === 'tutorial') {
      Tutorial.active = false; $('#tut').classList.add('hidden');
      let r;
      if (success) r = Tutorial.result();
      else { r = { success: false, city: CITIES[TUT_CI], C, lines: [[reason || 'Training failed', 0]], payout: 0, rank: 'F', xp: 0, mastery: [], challenges: 0, mode: 'tutorial', xpFrom: { level: sv.prog.level, xp: sv.prog.xp }, ups: [] }; }
      this.save(); Sfx.setMode('hideout'); Sfx.intensity = 0; UI.showResult(r); return;
    }
    const res = { success, reason, city: CITIES[C.ci], C, lines: [], payout: 0, rank: 'F' };
    if (success) {
      const sa = !S.spotted && S.bodiesFound === 0 && S.nonTarget === 0 && !S.combat;
      const methodMet = C.method === 'any' || S.method === C.method || S.method === 'spared';
      const gk = S.guardKills || 0, civ = Math.max(0, S.nonTarget - gk), loud = !sa && (S.combat || gk >= 3);
      let pts = 100;
      if (S.spotted && !loud) pts -= 20;
      pts -= S.bodiesFound * (loud ? 0 : 10); pts -= (loud ? civ * 20 : S.nonTarget * 15); if (S.combat && !loud) pts -= 25;
      if (!methodMet) pts -= 5;
      let rank = 'F';
      if (loud) {
        if (S.t > 600) pts -= 15; else if (S.t > 360) pts -= 6;
        if (this.P.hp < this.P.maxHp * 0.25) pts -= 8;
        rank = civ === 0 && S.t < 360 && gk >= 3 ? 'S' : pts >= 85 ? 'A' : pts >= 70 ? 'B' : pts >= 55 ? 'C' : pts >= 35 ? 'D' : 'F';
        res.wrath = true;
      } else if (sa && methodMet) rank = 'S'; else if (sa || pts >= 80) rank = 'A'; else if (pts >= 65) rank = 'B'; else if (pts >= 50) rank = 'C'; else if (pts >= 30) rank = 'D'; else rank = 'F';
      res.rank = rank;
      let pay = C.fee;
      res.lines.push(['Contract fee', C.fee]);
      if (methodMet && C.method !== 'any') { const b = Math.round(C.fee * 0.3); pay += b; res.lines.push([`Preferred method: ${METHODS.find(m => m.id === C.method).name}`, b]); }
      if (sa) { const b = Math.round(C.fee * 0.4); pay += b; res.lines.push(['Ghost', b]); }
      if (S.suitOnly) { const b = Math.round(C.fee * 0.15); pay += b; res.lines.push(['Own Clothes Only', b]); }
      if (!S.spotted && !sa) { const b = Math.round(C.fee * 0.1); pay += b; res.lines.push(['Never Spotted', b]); }
      if (S.method === 'accident') { const b = Math.round(C.fee * 0.1); pay += b; res.lines.push(['Made it look like an accident', b]); }
      if (loud) { const b = Math.round(C.fee * Math.min(0.3, 0.03 * gk)); if (b) { pay += b; res.lines.push([`Wrath: ${gk} guards down`, b]); } }
      if (S.spared) { const b = Math.round(C.fee * 0.2); pay += b; res.lines.push(['Mercy', b]); }
      if (S.confessions) { const b = Math.round(C.fee * 0.1); pay += b; res.lines.push(['Confession', b]); }
      const ntc = loud ? civ : S.nonTarget;
      if (ntc) { const p = -ntc * 3000; pay += p; res.lines.push([`${loud ? 'Innocents' : 'Non-target casualties'} ×${ntc}`, p]); }
      if (S.bodiesFound && !loud) { const p = -S.bodiesFound * 1500; pay += p; res.lines.push([`Bodies found ×${S.bodiesFound}`, p]); }
      if (this.D && this.D.pay !== 1) { const b = Math.round(pay * (this.D.pay - 1)); pay += b; res.lines.push([`${this.D.name} difficulty`, b]); }
      if (C.mode === 'weekly' && C.rules) {
        const failed = C.rules.filter(id => !WEEKLY_RULES.find(x => x.id === id).check(S));
        res.weekly = { failed };
        if (!failed.length) { const P = this.S.prog; if (!P.weekly || P.weekly.week !== Weekly.week() || !P.weekly.done) { pay += 60000; res.lines.push(['Weekly contract: all rules met', 60000]); P.weekly = { week: Weekly.week(), done: true }; P.weeklies = (P.weeklies || 0) + 1; } }
        else res.lines.push([`Weekly rules broken: ${failed.length}`, 0]);
      }
      const rm = { S: 1.25, A: 1.1, B: 1, C: 0.95, D: 0.9, F: 0.8 }[rank];
      const rb = Math.round(pay * rm) - pay; if (rb) res.lines.push([`Rank ${rank} modifier`, rb]);
      pay += rb;
      pay = Math.max(Math.round(C.fee * 0.25), pay);
      res.payout = pay;
      sv.money += pay; sv.stats.contracts++; sv.stats.earned += pay; if (rank === 'S') sv.stats.s++;
      sv.completed[C.ci === undefined ? '' : CITIES[C.ci].id] = true;
      const order = 'SABCDF'; const prev = sv.best[CITIES[C.ci].id];
      if (!prev || order.indexOf(rank) < order.indexOf(prev)) sv.best[CITIES[C.ci].id] = rank;
      if (C.mode === 'free') this.rerollContract(C.ci);
      res.stats = { time: S.t, kills: S.kills, method: S.method, spotted: S.spotted, bodies: S.bodiesFound, disguises: S.disguises };
      res.sa = sa;
      if (rank === 'S' && this.diff === 'master') this.S.prog.masterS = (this.S.prog.masterS || 0) + 1;
    } else {
      res.rank = 'F'; res.payout = 0;
      res.lines.push([reason || 'Mission failed', 0]);
    }
    res.mode = C.mode;
    if (C.mode === 'campaign' && success) {
      const P = this.S.prog; P.campaign = Math.max(P.campaign || 0, C.chapter + 1); res.story = C.story;
      if (C.chapter === CAMPAIGN.length - 1 && !P.campaignDone) { P.campaignDone = true; this.S.money += 250000; res.lines.push(['The list is finished', 250000]); res.payout += 250000; }
    }
    if (C.mode === 'elusive') { Elusive.state(); this.S.prog.elusive.status = success ? 'done' : 'failed'; if (success) { this.S.prog.elusiveWins = (this.S.prog.elusiveWins || 0) + 1; } }
    const ev = { success, ci: C.ci, rank: res.rank, sa: !!res.sa, suitOnly: S.suitOnly, method: S.method, via: S.via, nonTarget: S.nonTarget };
    res.mastery = success ? Progress.missionMastery(ev) : [];
    const chBefore = this.S.prog.ch.list.filter(c => c.done).length;
    Progress.track('mission', ev);
    res.challenges = this.S.prog.ch.list.filter(c => c.done).length - chBefore;
    res.xp = success ? RANK_XP[res.rank] + res.mastery.length * 250 + (C.mode === 'elusive' ? 1500 : C.mode === 'campaign' ? 400 : 0) : 100;
    res.xpFrom = { level: this.S.prog.level, xp: this.S.prog.xp };
    res.ups = Progress.addXP(res.xp);
    Progress.checkAch();
    this.save();
    Sfx.setMode('hideout'); Sfx.intensity = 0;
    UI.showResult(res);
  },

  /* ---------- rendering ---------- */
  render(dt) {
    if (!this.M) { Engine.render(dt); return; }
    const t = this.time, P = this.P, cut = this.cutY;
    const cam = Engine.cam;
    const near = (x, z, r) => (x - cam.tx) ** 2 + (z - cam.tz) ** 2 < r * r;
    Extras.drawActors(t);
    // player
    if (P && !P.hidden && !Controls.fp()) {
      if (P.carrying) { const b = P.carrying; drawCharacter(P.x - Math.sin(P.face) * 1.15, P.y, P.z - Math.cos(P.face) * 1.15, P.face + Math.PI, b.looks, b.outfit, null, { dead: true, deadK: 1 }); }
      drawCharacter(P.x, P.y, P.z, P.face, this.S.look, P.outfit, this.S.look.suit, { caseOn: this.mode === 'hideout' && !P.moving, walk: P.moving, phase: P.phase, act: !!P.action, aim: P.aimT > 0, dead: P.dead, deadK: P.dead ? Math.min(1, (this.time - (P.deathT || 0)) / 0.5) : 1, drag: !!P.carrying && !P.action, idle: P.blend ? 'blend' : P.blend === false ? null : null, t });
    }
    if (this.mode === 'mission' || this.mode === 'result') {
      for (const n of this.npcs) {
        if (n.hidden || n.carriedBy) continue;
        if (n.y > cut + 0.5) continue;
        if (!near(n.x, n.z, Engine.quality === 'lite' ? 32 : 60)) continue;
        const dead = n.state === 'dead' || n.state === 'ko';
        const em = n.isTarget && (this.C.intel >= 1 || this.targetVisible) && !dead ? [1, 0.42, 0.08, 0.14 + 0.08 * Math.sin(t * 4)] : null;
        const dK = dead ? Math.min(1, (this.time - (n.deathT || n.koT || 0)) / 0.5) : 1;
        drawCharacter(n.x, n.y, n.z, n.face, n.looks, n.outfit, null, { walk: n.moving, phase: n.phase, dead, deadK: dK, aim: n.aim, act: false, idle: n.state === 'held' ? 'struggle' : !n.moving && !dead && n.state !== 'alert' ? n.idle : (n.moving && n.idle === 'tray' ? 'tray' : null), t: t + n.id * 0.7 }, { emit: em });
        // marker above target
        if (n.isTarget && !dead && (this.C.intel >= 1 || this.targetVisible)) {
          const hy = n.y + 2.4 + Math.sin(t * 3) * 0.1;
          Engine.box(M4.mul(M4.T(n.x, hy, n.z), M4.mul(M4.RY(t * 2), M4.mul(M4.RZ(Math.PI / 4), M4.S(0.22, 0.22, 0.22)))), [1, 0.5, 0.12], [1, 0.45, 0.08, 0.95]);
        }
        // suspicion indicator
        if (!dead && n.susp > 0.05 && n.state !== 'alert') {
          const s = Math.min(1, n.susp);
          Engine.box(M4.mul(M4.T(n.x, n.y + 2.25, n.z), M4.S(0.08, 0.05 + 0.3 * s, 0.08)), [1, 0.8 - s * 0.6, 0.1], [1, 0.7 - 0.5 * s, 0.1, 0.9]);
        }
        if (n.state === 'alert' && !dead) Engine.box(M4.mul(M4.T(n.x, n.y + 2.3, n.z), M4.S(0.1, 0.4, 0.1)), [1, 0.1, 0.1], [1, 0.1, 0.1, 1]);
      }
    }
    // props
    for (const pr of this.props) {
      if (pr.gone) continue;
      if (pr.p[1] > cut + 0.5 && pr.type !== 'exit') continue;
      if (!near(pr.p[0], pr.p[2], 60)) continue;
      const dP = P ? Math.hypot(pr.p[0] - P.x, pr.p[2] - P.z) : 99, sameFl = P && Math.abs(pr.p[1] - P.y) < 3;
      const cat = propCategory(pr), spent = propSpent(pr);
      const hl = cat && sameFl && dP < (cat === 'hide' ? (P.carrying ? 14 : 6) : 12) && !spent ? ACT_COLORS[cat] : null;
      pr.olz = Math.max(1, Math.min(2, cam.dist / 14));
      if (pr.type === 'exit') {
        const a = this.stats && this.stats.targetDead ? 0.45 : 0.18;
        Engine.box(M4.mul(M4.T(pr.p[0], pr.p[1] + 1.5, pr.p[2]), M4.S(1.2, 3, 1.2)), [0.2, 1, 0.4], [0.2, 1, 0.4, 0.6], a);
        continue;
      }
      drawProp(pr, t, hl);
    }
    // guidance beacons
    if (this.mode === 'mission') {
      for (const pr of (this.C.intel >= 2 ? this.guideProps() : []).concat(Tutorial.beacons())) {
        if (pr.p[1] > cut + 0.5) continue;
        Engine.box(M4.mul(M4.T(pr.p[0], pr.p[1] + 1.6, pr.p[2]), M4.S(0.3, 3.2, 0.3)), [1, 0.85, 0.2], [1, 0.8, 0.2, 0.7], 0.35);
      }
    }
    // fx
    for (const f of this.fx) {
      if (f.type === 'tracer') {
        const a = f.a, b = f.b, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, mz = (a[2] + b[2]) / 2;
        const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        const yaw = Math.atan2(b[0] - a[0], b[2] - a[2]), pitch = -Math.asin((b[1] - a[1]) / (L || 1));
        Engine.box(M4.mul(M4.T(mx, my, mz), M4.mul(M4.RY(yaw), M4.mul(M4.RX(pitch), M4.S(0.04, 0.04, L)))), f.col, [f.col[0], f.col[1], f.col[2], 1], 0.8);
      }
      if (f.type === 'boom' || f.type === 'dust' || f.type === 'zap') {
        const k = f.t / f.dur, s = (f.type === 'boom' ? 6 : 2.5) * (0.3 + k);
        const col = f.type === 'boom' ? [1, 0.55, 0.15] : f.type === 'zap' ? [0.5, 0.8, 1] : [0.8, 0.75, 0.65];
        Engine.box(M4.mul(M4.T(f.p[0], f.p[1] + s * 0.3, f.p[2]), M4.S(s, s * 0.7, s)), col, [col[0], col[1], col[2], 1 - k], Math.max(0.05, 0.7 * (1 - k)));
      }
    }
    if (this.mode === 'mission') { this.renderDoors(cut); this.renderInstinct(); }
    // explosion light
    const boom = this.fx.find(f => f.type === 'boom');
    if (boom) Engine.lights = [{ x: boom.p[0], y: boom.p[1] + 1, z: boom.p[2], r: 18, c: [3 * (1 - boom.t / boom.dur), 1.6 * (1 - boom.t / boom.dur), 0.4] }].concat(Engine.lights.slice(0, 9));
    // tap marker
    if (UI.marker) { const m = UI.marker; Engine.box(M4.mul(M4.T(m[0], m[1], m[2]), M4.S(0.5, 0.04, 0.5)), [1, 1, 1], [1, 1, 1, 0.6], 0.5); }
    Engine.render(dt);
  },
  /* instinct, blackout, distraction timers, weekly rules, primary target */
  tickSystems(dt, realDt) {
    const I = this.inst;
    if (I) { if (I.on) { I.m -= realDt * 16; if (I.m <= 0) { I.m = 0; I.on = false; UI.setInstinct(false); } } else I.m = Math.min(100, I.m + realDt * 7); }
    if (this.blackout) { this.blackout.t -= dt; if (this.blackout.t <= 0) { this.blackout.pr.on = false; this.blackout = null; this.toast('Power restored'); } }
    for (const pr of this.props) {
      if (pr.type === 'radio' && pr.on) { pr.radioT = (pr.radioT || 0) - dt; if (pr.radioT <= 0) { pr.radioT = 0.5; if (Math.hypot(pr.p[0] - this.P.x, pr.p[2] - this.P.z) < 14) Sfx.play('radio'); } }
      if (pr.type === 'caralarm' && pr.on) { pr.alarmT -= dt; if (pr.alarmT <= 0) pr.on = false; }
    }
    const alive = this.targets.filter(t => t.state !== 'dead'); if (alive.length) this.target = alive[0];
    if (this.C.mode === 'weekly' && this.C.rules) {
      this._wkT = (this._wkT || 0) - dt;
      if (this._wkT <= 0) { this._wkT = 1; this.C.broken = this.C.broken || {}; for (const id of this.C.rules) { const r = WEEKLY_RULES.find(x => x.id === id); if (r.live && !r.live(this.stats) && !this.C.broken[id]) { this.C.broken[id] = true; this.toast(`Weekly rule broken: ${r.text}`, 'bad'); Sfx.play('fail'); } } }
    }
    // doors swing open when someone is near
    for (const d of this.doors) {
      if (d.cx === undefined) { d.cx = d.cells.reduce((s, c) => s + c[0], 0) / d.cells.length + 0.5; d.cz = d.cells.reduce((s, c) => s + c[1], 0) / d.cells.length + 0.5; }
      let open = 0;
      if (!d.locked) {
        const P = this.P; if (Math.abs(P.y - d.y) < 1.2 && Math.hypot(P.x - d.cx, P.z - d.cz) < 1.9) open = 1;
        if (!open) for (const n of this.npcs) { if (n.hidden || n.state === 'dead' || n.state === 'ko') continue; if (Math.abs(n.y - d.y) < 1.2 && Math.abs(n.x - d.cx) < 1.9 && Math.abs(n.z - d.cz) < 1.9) { open = 1; break; } }
      }
      d.ang += (open - d.ang) * Math.min(1, dt * 7);
    }
  },
  toggleInstinct() {
    if (!this.inst || this.mode !== 'mission') return;
    if (this.inst.on) { this.inst.on = false; UI.setInstinct(false); return; }
    if (this.inst.m < 15) { this.toast('Instinct is recharging'); return; }
    this.inst.on = true; UI.setInstinct(true); Sfx.play('whoosh');
  },
  renderDoors(cut) {
    const cam = Engine.cam;
    for (const d of this.doors) {
      if (d.y > cut + 0.5 || d.cx === undefined) continue;
      if ((d.cx - cam.tx) ** 2 + (d.cz - cam.tz) ** 2 > 2500) continue;
      const n = d.cells.length, col = d.locked ? [0.32, 0.34, 0.38] : d.ext ? [0.25, 0.16, 0.09] : [0.42, 0.27, 0.15];
      const xs = d.cells.map(c => c[0]), zs = d.cells.map(c => c[1]);
      const leaves = n >= 2 ? 2 : 1, lw = n / leaves;
      for (let i = 0; i < leaves; i++) {
        let hx, hz, base;
        if (d.axis === 'x') { hx = i === 0 ? Math.min(...xs) : Math.max(...xs) + 1; hz = zs[0] + 0.5; base = i === 0 ? 0 : Math.PI; }
        else { hz = i === 0 ? Math.min(...zs) : Math.max(...zs) + 1; hx = xs[0] + 0.5; base = i === 0 ? -Math.PI / 2 : Math.PI / 2; }
        const a = base + (i === 0 ? -1 : 1) * d.ang * 1.45;
        const m = M4.mul(M4.T(hx, d.y, hz), M4.mul(M4.RY(a), M4.mul(M4.T(lw / 2, 1.0, 0), M4.S(lw - 0.04, 1.96, 0.1))));
        Engine.box(m, col);
        Engine.box(M4.mul(M4.T(hx, d.y, hz), M4.mul(M4.RY(a), M4.mul(M4.T(lw - 0.18, 1.0, 0.07), M4.S(0.06, 0.06, 0.06)))), d.locked ? [1, 0.15, 0.1] : [0.9, 0.75, 0.3], d.locked ? [1, 0.2, 0.1, 0.8] : null);
        if (d.locked && Math.hypot(this.P.x - d.cx, this.P.z - d.cz) < 12 && Math.abs(this.P.y - d.y) < 2) { const k = ACT_COLORS.door, ow = 0.07; Engine.outline(M4.mul(M4.T(hx, d.y, hz), M4.mul(M4.RY(a), M4.mul(M4.T(lw / 2, 1.0, 0), M4.S(lw - 0.04 + ow * 2, 1.96 + ow * 2, 0.1 + ow * 2)))), k, 1.2); }
      }
    }
  },
  renderInstinct() {
    if (!this.inst || !this.inst.on) return;
    const P = this.C && this.C.mode === 'sniper' ? { x: Engine.cam.tx, z: Engine.cam.tz } : this.P;
    for (const n of this.npcs) {
      if (n.hidden || n.carriedBy || Math.hypot(n.x - P.x, n.z - P.z) > 40) continue;
      const dead = n.state === 'dead' || n.state === 'ko';
      const col = n.isTarget ? [1, 0.1, 0.12] : dead ? [0.55, 0.55, 0.55] : GUARDLIKE(n.kind) ? [0.25, 0.55, 1] : n.kind === 'staff' ? [1, 0.85, 0.2] : [0.9, 0.9, 0.95];
      const a = n.isTarget ? 0.75 : 0.42;
      if (dead) { Engine.xray(M4.mul(M4.T(n.x, n.y + 0.2, n.z), M4.mul(M4.RY(n.face), M4.S(0.55, 0.3, 1.8))), col, a); continue; }
      Engine.xray(M4.mul(M4.T(n.x, n.y + 0.72, n.z), M4.mul(M4.RY(n.face), M4.S(0.52, 1.44, 0.3))), col, a);
      Engine.xray(M4.mul(M4.T(n.x, n.y + 1.66, n.z), M4.mul(M4.RY(n.face), M4.S(0.38, 0.38, 0.38))), col, a);
    }
  },
  guideProps() {
    if (!this.C || this.stats.targetDead) return [];
    if (this._gpT && this.time - this._gpT < 0.5) return this._gp;
    const out = [];
    const P = this.P;
    for (const s of this.C.stops) {
      const info = STOP_INFO[s];
      const opp = this.props.find(p => p.stop === s && !p.gone && !p.used && !p.sabotaged && !p.poison);
      if (!opp) continue;
      out.push(opp);
      if (info.kind === 'poison' && !this.hasKind('poison')) { for (const p of this.props) if (p.type === 'item' && (p.item === 'poison' || p.item === 'emetic') && !p.gone) out.push(p); }
      if (s === 'kitchen' && !this.hasItem('wrench')) for (const p of this.props) if (p.type === 'item' && p.item === 'wrench' && !p.gone) out.push(p);
      if (s === 'speech' && P.outfit === 'suit') for (const p of this.props) if (p.type === 'disguise' && p.outfit === 'waiter' && !p.gone) out.push(p);
      if (['office', 'sauna', 'pool', 'privatebar'].includes(s) && !ACCESS[P.outfit].includes(Z_VIP)) for (const p of this.props) if (p.type === 'disguise' && (p.outfit === 'cleaner' || p.outfit === 'guard') && !p.gone) out.push(p);
    }
    this._gpT = this.time; this._gp = [...new Set(out)];
    return this._gp;
  }
};

function lerpAng(a, b, t) { return a + angDiff(a, b) * t; }
function angDiff(a, b) { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }

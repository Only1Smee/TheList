'use strict';
/* =========================================================
   THE LIST — Story cutscenes, records & replays,
   Sniper Assassin mode, trophy wall and pets
   ========================================================= */

/* ---------- save defaults ---------- */
const EXTRA_DEFAULTS = () => ({
  records: {}, trophies: {},
  pets: { owned: {}, active: null, col: {}, name: 'Shadow' },
  sniper: { rifle: 'r0', owned: ['r0'], seeds: {}, best: {} }
});
(function () {
  const ns = Game.newSave;
  Game.newSave = function () { return Object.assign(ns.call(this), EXTRA_DEFAULTS()); };
})();
function ensureExtras() {
  const S = Game.S, D = EXTRA_DEFAULTS();
  for (const k in D) if (!S[k] || typeof S[k] !== 'object') S[k] = D[k];
  for (const k in D.pets) if (S.pets[k] === undefined) S.pets[k] = D.pets[k];
  for (const k in D.sniper) if (S.sniper[k] === undefined) S.sniper[k] = D.sniper[k];
  const P = S.prog; if (P) { P.cuts = P.cuts || {}; P.career = P.career || {}; }
  if (S.unlocked && S.unlocked.suits) for (const id of ['leather', 'burnt']) if (!S.unlocked.suits.includes(id)) S.unlocked.suits.push(id);
  if (P && typeof PETS !== 'undefined') {
    let any = false;
    for (const p of PETS) if (!S.pets.owned[p.id] && p.unlock(S)) { S.pets.owned[p.id] = true; any = p; }
    if (any && !S.pets.active) { S.pets.active = any.id; S.pets.name = any.id === 'dog' ? 'Lucky' : S.pets.name || 'Scrap'; }
    if (any && Game.mode === 'hideout' && UI.toast) setTimeout(() => UI.toast(any.id === 'dog' ? 'A stray dog followed you home. It won\'t leave.' : `A stray ${any.name.toLowerCase()} has moved into the safehouse`, 'good'), 600);
    P.career.pets = Object.keys(S.pets.owned).length;
    if ((P.campaign || 0) >= 1 && S.unlocked.acc) { if (!S.unlocked.acc.includes('watch:dad')) S.unlocked.acc.push('watch:dad'); if (!ACCESSORIES.watch.items.find(i => i.id === 'dad')) ACCESSORIES.watch.items.splice(1, 0, { id: 'dad', name: 'Dad\'s Watch', price: 1, col: [0.72, 0.6, 0.38] }); }
  }
}

(function () {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), hits = [];
  while (w.nextNode()) if (w.currentNode.nodeValue.indexOf('{i:') >= 0) hits.push(w.currentNode);
  for (const t of hits) { const sp = document.createElement('span'); sp.innerHTML = t.nodeValue; t.parentNode.replaceChild(sp, t); }
})();

/* reset per-scene camera tweaks whenever a map loads */
(function () {
  const lm = Game.loadMap;
  Game.loadMap = function (M) {
    Engine.cam.fov = 0.75; Engine.fadeLift = 1.0; Engine.fadeR = M && M.hideout ? 0.11 : 0.15;
    $('#shud') && $('#shud').classList.add('hidden');
    return lm.call(this, M);
  };
  const hide = UI.hideAll;
  UI.hideAll = function () { hide.call(this); ['#shud', '#rphud', '#cine'].forEach(s => { const e = $(s); if (e) e.classList.add('hidden'); }); };
})();

function sceneLights(force) {
  const c = Engine.cam, L = Game.M.lights, max = Engine.quality === 'lite' ? 4 : 10;
  if (L.length <= max) { Engine.lights = L; return; }
  const now = performance.now();
  if (!force && sceneLights.t && now - sceneLights.t < 500) return;
  sceneLights.t = now;
  Engine.lights = L.slice().sort((a, b) => ((a.x - c.tx) ** 2 + (a.y - c.ty) ** 2 * 4 + (a.z - c.tz) ** 2) - ((b.x - c.tx) ** 2 + (b.y - c.ty) ** 2 * 4 + (b.z - c.tz) ** 2)).slice(0, max);
}
function camTo(c, g, k) {
  c.tx += (g.tx - c.tx) * k; c.ty += (g.ty - c.ty) * k; c.tz += (g.tz - c.tz) * k;
  c.dist += (g.dist - c.dist) * k; c.pitch += (g.pitch - c.pitch) * k; c.yaw += angDiff(c.yaw, g.yaw) * k;
}
function sentences(txt) { return (txt.match(/[^.!?]+[.!?]+["']?/g) || [txt]).map(s => s.trim()).filter(Boolean); }
function chunk(arr, n) { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n).join(' ')); return o; }

/* =========================================================
   Dispatcher used by Game.update / render / onTap
   ========================================================= */
const Extras = {
  update(dt) {
    if (Game.mode === 'cutscene') Cutscene.update(dt);
    else if (Game.mode === 'replay') Replay.update(dt);
  },
  tap() {
    if (Game.mode === 'cutscene') Cutscene.next();
  },
  drawActors(t) {
    if (Game.mode === 'hideout') Pets.draw(t);
    else if (Game.mode === 'cutscene' || (Game.mode === 'result' && Cutscene.actors && Game.M === Cutscene.M)) Cutscene.draw(t);
    else if (Game.mode === 'replay') Replay.draw(t);
  }
};

/* =========================================================
   1) STORY CUTSCENES WITH IRIS
   ========================================================= */
const IRIS_LOOKS = { skin: 2, hairCol: 0, hair: 'ponytail', beard: 'none', eye: 'glasses', female: true, jacket: [0.2, 0.18, 0.17], pants: [0.08, 0.08, 0.1], tie: 0, shirt: [0.6, 0.58, 0.55], gloves: false };
const MARLOW_LOOKS = { skin: 0, hairCol: 5, hair: 'slick', beard: 'full', eye: 'none', female: false, jacket: [0.1, 0.1, 0.11], pants: [0.1, 0.1, 0.11], tie: 0, shirt: [0.85, 0.85, 0.85], gloves: false };
const FAMILY = {
  clare: { name: 'CLARE', looks: { skin: 1, hairCol: 3, hair: 'long', beard: 'none', eye: 'none', female: true, jacket: [0.55, 0.62, 0.72], pants: [0.2, 0.22, 0.3], tie: 0, shirt: [0.95, 0.95, 0.95] }, outfit: 'guest' },
  ellie: { name: 'ELLIE', looks: { skin: 1, hairCol: 3, hair: 'ponytail', beard: 'none', eye: 'none', female: true, jacket: [0.85, 0.4, 0.45], pants: [0.85, 0.4, 0.45], tie: 0, shirt: [0.95, 0.95, 0.95] }, outfit: 'guest', scale: 0.62 },
  noah: { name: 'NOAH', looks: { skin: 1, hairCol: 2, hair: 'spiky', beard: 'none', eye: 'none', female: false, jacket: [0.25, 0.5, 0.8], pants: [0.3, 0.3, 0.32], tie: 0, shirt: [0.25, 0.5, 0.8] }, outfit: 'cleaner', scale: 0.5 },
  frank: { name: 'DAD', looks: { skin: 1, hairCol: 6, hair: 'sidepart', beard: 'moustache', eye: 'glasses', female: false, jacket: [0.35, 0.3, 0.22], pants: [0.25, 0.25, 0.27], tie: 2, shirt: [0.9, 0.88, 0.8] }, outfit: 'guest' },
  margaret: { name: 'MUM', looks: { skin: 1, hairCol: 5, hair: 'long', beard: 'none', eye: 'glasses', female: true, jacket: [0.45, 0.25, 0.4], pants: [0.45, 0.25, 0.4], tie: 0, shirt: [0.95, 0.95, 0.95] }, outfit: 'guest' },
  michael: { name: 'MICHAEL', looks: { skin: 1, hairCol: 1, hair: 'buzz', beard: 'stubble', eye: 'none', female: false, jacket: [0.15, 0.3, 0.2], pants: [0.15, 0.17, 0.25], tie: 0, shirt: [0.15, 0.3, 0.2] }, outfit: 'guest' }
};
function speaker(who) {
  if (who === 'iris') return { name: 'IRIS', looks: IRIS_LOOKS, outfit: 'guest', cls: '' };
  if (who === 'marlow') return { name: 'MARLOW', looks: MARLOW_LOOKS, outfit: 'vip', cls: 'marlow' };
  if (who === 'agent') return { name: Game.S.prog.campaignDone ? 'DANIEL' : 'YOU', looks: Game.S.look, outfit: 'suit', cls: 'agent' };
  if (FAMILY[who]) return Object.assign({ cls: 'memory' }, FAMILY[who]);
  return { name: '', looks: null, outfit: null, cls: 'narr' };
}
function drawScaled(s, x, y, z, fn) {
  if (s === 1 || !s) { fn(); return; }
  const ob = Engine.box, oo = Engine.outline, K = M4.mul(M4.T(x, y, z), M4.mul(M4.S(s, s, s), M4.T(-x, -y, -z)));
  Engine.box = function (m, ...a) { return ob.call(Engine, M4.mul(K, m), ...a); };
  try { fn(); } finally { Engine.box = ob; Engine.outline = oo; }
}
const ACT_TITLES = { 0: 'ACT I · THE HANDS', 5: 'ACT II · THE COVER-UP', 10: 'ACT III · THE ONES WHO RAN' };
const AGENT_REPLIES = [
  'Who did he drive?',
  'Then Soho.',
  'Michael never hurt anyone in his life.',
  'Then it\'s Pryce.',
  'Then I start with the clipboard.',
  'A coroner. Fine.',
  'Then Manchester.',
  'How long did he plan it?',
  'Then I find the lawyer.',
  'They can run as far as they like.',
  'Monaco, then.',
  'Then she knows what\'s coming.',
  'Iris.',
  'One left.',
  'It\'s done.'
];
const IRIS_CLOSERS = ['Get some sleep. You won\'t, but try.', 'Burn the clothes. Wash your hands. Go again.', 'I\'ll find the next one. Eat something.', 'You\'re getting quieter. I don\'t know if that\'s good.', 'Next name\'s on the wall. Same as always.'];
const FLASHBACKS = {
  parents: { title: 'BEFORE', sub: 'SUNDAY DINNER', actors: ['frank', 'margaret'], lines: [
    { who: 'margaret', text: 'Sunday dinner. Every week. No excuses, I don\'t care what you do for a living.' },
    { who: 'frank', text: 'You look tired, son. Whatever it is you do, stop doing it.' },
    { who: 'agent', text: 'I have, Dad. I\'m out. For good.' },
    { who: 'narr', text: 'He did stop. It didn\'t matter.' }] },
  brother: { title: 'BEFORE', sub: 'THE OLD PUB GARDEN', actors: ['michael'], lines: [
    { who: 'michael', text: 'One day you\'ll tell me what you really did all those years.' },
    { who: 'agent', text: 'One day.' },
    { who: 'michael', text: 'Same time next week? Your round.' },
    { who: 'narr', text: 'There wasn\'t a next week.' }] },
  home: { title: 'BEFORE', sub: 'HOME', actors: ['clare', 'ellie', 'noah'], lines: [
    { who: 'ellie', text: 'Dad! Dad, watch me! Are you watching?' },
    { who: 'noah', text: 'Me too! Watch me too!' },
    { who: 'clare', text: 'You\'re home. You\'re actually home.' },
    { who: 'agent', text: 'I\'m home. No more trips. I promise.' },
    { who: 'narr', text: 'He kept that promise for eleven months.' }] }
};

const Cutscene = {
  lines: [], i: 0, t: 0, shown: 0, done: null, actors: null, shots: [], M: null, kind: '',
  intro(ch, done) {
    const P = Game.S.prog, story = CAMPAIGN[ch];
    if (story.iris && !P.irisChoice) { this._needChoice = true; }
    const C = Game.getContract(story.ci, 'campaign', ch), city = CITIES[C.ci];
    UI.loading(() => {
      const M = buildMap(C.ci, C.mapSeed); Game.loadMap(M); Game.npcs = [];
      const rng = RNG(C.seed + 5);
      const stop = C.stops.map(s => M.stops[s]).find(Boolean) || Object.values(M.stops)[0];
      const tp = stop.p, actors = [];
      const tl = story.iris ? IRIS_LOOKS : C.looks;
      actors.push({ x: tp[0] + 0.5, y: tp[1], z: tp[2] + 0.5, face: rng() * 6.28, looks: tl, outfit: C.outfit, idle: story.iris ? 'phone' : 'drink', target: true });
      if (C.bodyguard) actors.push({ x: tp[0] + 1.6, y: tp[1], z: tp[2] + 1.1, face: 0, looks: Object.assign(randomLooks(rng, 'guard'), { eye: 'shades', female: false, hair: 'buzz' }), outfit: 'guard', idle: null });
      for (const g of M.guests.slice(0, 26)) { const sp = M.spots[g.group]; if (!sp || !sp.length) continue; const p = sp[rng.int(0, sp.length - 1)]; actors.push({ x: p[0] + 0.5, y: p[1], z: p[2] + 0.5, face: rng() * 6.28, looks: randomLooks(rng, 'guest'), outfit: g.vip ? 'vip' : 'guest', idle: rng.pick(['talk', 'drink', 'talk', 'phone', null]) }); }
      for (const gd of M.guards.slice(0, 10)) { const r = gd.route[0]; actors.push({ x: r[0] + 0.5, y: r[1], z: r[2] + 0.5, face: gd.face || 0, looks: randomLooks(rng, 'guard'), outfit: 'guard', idle: null }); }
      const b = M.building, bx = (b.x0 + b.x1) / 2, bz = (b.z0 + b.z1) / 2, sp0 = M.spawns[0];
      const yaw0 = Math.atan2(sp0[0] - bx, sp0[2] - bz);
      let floorY = M.floors[0]; for (const f of M.floors) if (tp[1] >= f - 0.5) floorY = f;
      const T = actors[0];
      const shots = [
        t => ({ tx: bx, ty: M.floors[0] + 8, tz: bz, dist: 88, pitch: 0.55, yaw: yaw0 + 0.5 + t * 0.05, cut: 999 }),
        t => ({ tx: bx, ty: M.floors[0] + 6, tz: bz, dist: 52, pitch: 0.72, yaw: yaw0 - 0.2 + t * 0.06, cut: floorY + 2.9 }),
        t => ({ tx: T.x, ty: T.y + 1.3, tz: T.z, dist: 7.5, pitch: 0.42, yaw: T.face + 0.6 + t * 0.07, cut: floorY + 2.9, fade: [T.x, T.y, T.z] })
      ];
      const who = ch === 14 && P.irisChoice === 'kill' ? 'marlow' : 'iris';
      const brief = ch === 14 && P.irisChoice === 'kill' ? story.marlowBrief : story.brief;
      const L = [{ title: `${String(ch + 1).padStart(2, '0')} · ${story.role.toUpperCase()}`, sub: (ACT_TITLES[ch] ? ACT_TITLES[ch] + '  /  ' : '') + `${city.name.toUpperCase()} · ${city.venue}`, shot: 0 }];
      if (ch === 0) L.push({ who: 'narr', text: 'Three fires. One night. Your parents. Your brother. Your wife and your children.', shot: 0 }, { who: 'iris', text: 'I told you not to call me again. Then I heard. I\'m sorry. Tell me what you need.', shot: 1 }, { who: 'agent', text: 'Names.', shot: 1 });
      chunk(sentences(brief), 2).forEach((tx, i, a) => L.push({ who, text: tx, shot: i === 0 && ch !== 0 ? 0 : i < a.length - 1 ? 1 : 2 }));
      if (story.iris) {
        L.push({ choice: true, shot: 2 });
      } else L.push({ who: 'narr', text: `${C.name}. ${story.title}.`, shot: 2 });
      Engine.cam.tx = bx; Engine.cam.ty = 30; Engine.cam.tz = bz; Engine.cam.dist = 120; Engine.cam.pitch = 0.6; Engine.cam.yaw = yaw0;
      this.story = story;
      this.start('intro', M, actors, shots, L, done);
    });
  },
  outro(ch, done, opts) {
    opts = opts || {};
    UI.loading(() => {
      const story = CAMPAIGN[ch], P = Game.S.prog;
      const M = buildHideout(Game.S.lv.hide); Game.loadMap(M); Game.npcs = [];
      const y = 3, A = { x: 17.5, y, z: 13.5 }, I = { x: 19.8, y, z: 14.9 };
      A.face = Math.atan2(I.x - A.x, I.z - A.z); I.face = Math.atan2(A.x - I.x, A.z - I.z);
      const irisGone = P.irisChoice === 'kill' && ch >= 13;
      const actors = [Object.assign(A, { looks: Game.S.look, outfit: 'suit', suit: Game.S.look.suit, idle: null, who: 'agent' })];
      if (!irisGone) actors.push(Object.assign(I, { looks: IRIS_LOOKS, outfit: 'guest', idle: null, who: 'iris' }));
      if (Game.S.pets.active) actors.push({ pet: true, type: Game.S.pets.active, x: 16.6, y, z: 14.8, face: A.face + 0.6, state: 'sit', phase: 0, t: 0, hop: 0 });
      const mx = (A.x + I.x) / 2, mz = (A.z + I.z) / 2;
      const yI = Math.atan2(A.x - I.x, A.z - I.z), yA = Math.atan2(I.x - A.x, I.z - A.z);
      const shots = [
        t => ({ tx: mx, ty: y + 1.2, tz: mz, dist: 11, pitch: 0.42, yaw: yI + 1.4 + t * 0.04, cut: 6.5 }),
        t => ({ tx: I.x, ty: y + 1.5, tz: I.z, dist: 4.4, pitch: 0.16, yaw: yI + 0.32, cut: 6.5 }),
        t => ({ tx: A.x, ty: y + 1.5, tz: A.z, dist: 4.4, pitch: 0.16, yaw: yA - 0.32, cut: 6.5 }),
        t => ({ tx: 19, ty: y + 2, tz: 22, dist: 6, pitch: 0.12, yaw: Math.PI + t * 0.02, cut: 6.5 })
      ];
      let L;
      if (ch === CAMPAIGN.length - 1) {
        L = [{ title: 'THE LIST', sub: 'FIFTEEN NAMES · FIFTEEN CROSSES', shot: 3 }];
        if (irisGone) L.push({ who: 'narr', text: 'He comes back to the safehouse alone. Nobody calls. Nobody is left to call.', shot: 0 }, { who: 'narr', text: 'He takes the last photo off the wall and holds it for a long time.', shot: 3 }, { who: 'agent', text: 'It\'s done.', shot: 2 });
        else L.push({ who: 'iris', text: 'It\'s over, Daniel. All of it.', shot: 1 }, { who: 'agent', text: 'It doesn\'t feel over.', shot: 2 }, { who: 'iris', text: 'It never does. There\'s a ticket on the table. Somewhere warm. Nobody knows your face there.', shot: 1 }, { who: 'narr', text: 'He doesn\'t take it. Not yet.', shot: 0 });
        L.push({ title: 'HIS NAME WAS', sub: `${HERO.first.toUpperCase()} ${HERO.last.toUpperCase()}`, shot: 3 }, { title: 'THE LIST', sub: 'IN MEMORY OF CLARE, ELLIE, NOAH, FRANK, MARGARET AND MICHAEL', shot: 3 });
      } else {
        L = [{ title: 'CROSSED OFF', sub: `${String(ch + 1).padStart(2, '0')} · ${story.name.toUpperCase()}`, shot: 3 }];
        const deb = opts.spared && story.spareLine ? story.spareLine : story.iris && P.irisChoice === 'spare' ? story.spareDebrief : story.debrief;
        const dwho = irisGone ? 'narr' : 'iris';
        chunk(sentences(deb), 1).forEach(tx => L.push({ who: dwho, text: tx, shot: dwho === 'iris' ? 1 : 0 }));
        L.push({ who: 'agent', text: AGENT_REPLIES[ch], shot: 2 });
        if (!irisGone && !story.iris) L.push({ who: 'iris', text: IRIS_CLOSERS[ch % IRIS_CLOSERS.length], shot: 0 });
      }
      Engine.cam.tx = mx; Engine.cam.ty = y + 1; Engine.cam.tz = mz; Engine.cam.dist = 16; Engine.cam.pitch = 0.6; Engine.cam.yaw = yI + 1.8;
      this.start('outro', M, actors, shots, L, done);
    });
  },
  flashback(kind, done) {
    const F = FLASHBACKS[kind]; if (!F) { done && done(); return; }
    UI.loading(() => {
      const w = new World(40, 16, 40), y = 3;
      box(w, 0, 0, 0, 39, y - 2, 39, B.STONE); box(w, 0, y - 1, 0, 39, y - 1, 39, B.GRASS);
      box(w, 14, y - 1, 10, 26, y - 1, 30, B.PAVE);
      w.cutMode = 0;
      if (kind === 'brother') { hollow(w, 6, y, 26, 34, y + 5, 34, B.BRICK); box(w, 10, y + 1, 26, 30, y + 3, 26, B.GLASS); box(w, 14, y, 17, 17, y, 18, B.WOOD); box(w, 22, y, 20, 25, y, 21, B.WOOD); }
      else { hollow(w, 8, y, 26, 32, y + 6, 34, B.BRICK_Y); for (let x = 11; x < 31; x += 5) box(w, x, y + 1, 26, x + 2, y + 3, 26, B.GLASS); box(w, 19, y, 26, 20, y + 2, 26, 0); }
      for (let x = 2; x < 38; x++) { w.set(x, y, 2, B.HEDGE); w.set(x, y, 37, B.HEDGE); } for (let z = 2; z < 38; z++) { w.set(2, y, z, B.HEDGE); w.set(37, y, z, B.HEDGE); }
      const rng = RNG(kind.length * 77); tree(w, 7, y, 9, 'oak', rng); tree(w, 32, y, 12, 'oak', rng); tree(w, 30, y, 6, 'oak', rng);
      if (kind === 'parents') { box(w, 18, y, 17, 22, y, 19, B.WOOD); }
      const env = Object.assign({}, TIMES.sunset, { amb: 0.9, sunCol: [1.4, 0.95, 0.55], fog: [1.0, 0.75, 0.5], fogN: 30, fogF: 90 });
      const M = { world: w, props: [], lights: [{ x: 20, y: y + 3, z: 20, r: 14, c: [1.3, 0.9, 0.5] }], spots: {}, hideout: true, env, building: { x0: 8, x1: 32, z0: 26, z1: 34, top: y + 6 }, floors: [y], flashback: true };
      Game.loadMap(M); Game.npcs = [];
      const A = { x: 20.5, y, z: 15.5, face: 0, looks: Game.S.look, outfit: 'suit', suit: 'leather', idle: null, who: 'agent' };
      const actors = [A];
      if (kind === 'parents') {
        actors.push({ x: 19.2, y, z: 20.3, face: Math.PI, looks: FAMILY.frank.looks, outfit: 'guest', idle: 'sit', who: 'frank' }, { x: 21.8, y, z: 20.3, face: Math.PI, looks: FAMILY.margaret.looks, outfit: 'guest', idle: 'sit', who: 'margaret' });
        A.z = 16.2; A.face = 0;
      } else if (kind === 'brother') {
        actors.push({ x: 22.5, y, z: 17.6, face: -1.9, looks: FAMILY.michael.looks, outfit: 'guest', idle: 'drink', who: 'michael' }); A.x = 19.4; A.z = 16.6; A.face = 1.2; A.idle = 'drink';
      } else {
        actors.push({ x: 22, y, z: 18.5, face: Math.PI + 0.4, looks: FAMILY.clare.looks, outfit: 'guest', idle: null, who: 'clare' },
          { x: 18.6, y, z: 19.5, face: 2.6, looks: FAMILY.ellie.looks, outfit: 'guest', idle: 'dance', who: 'ellie', scale: 0.62 },
          { x: 20.2, y, z: 20.8, face: 3.4, looks: FAMILY.noah.looks, outfit: 'cleaner', idle: 'dance', who: 'noah', scale: 0.5 });
        A.face = 0.1;
      }
      const shots = [
        t => ({ tx: 20.5, ty: y + 1.2, tz: 18.5, dist: 10, pitch: 0.36, yaw: Math.PI + 0.9 - t * 0.03, cut: 999 }),
        t => ({ tx: 20.5, ty: y + 1.1, tz: 18.8, dist: 6.2, pitch: 0.22, yaw: Math.PI + 0.5 - t * 0.02, cut: 999 })
      ];
      const L = [{ title: F.title, sub: F.sub, shot: 0 }].concat(F.lines.map((l, i) => Object.assign({ shot: i % 2 ? 1 : 0 }, l)));
      Engine.cam.tx = 20; Engine.cam.ty = y + 1; Engine.cam.tz = 18; Engine.cam.dist = 14; Engine.cam.pitch = 0.4; Engine.cam.yaw = Math.PI + 1.2;
      $('#cine').classList.add('flash');
      this.start('flash', M, actors, shots, L, () => { $('#cine').classList.remove('flash'); done && done(); });
    });
  },
  start(kind, M, actors, shots, lines, done) {
    UI.hideAll();
    this.kind = kind; this.M = M; this.actors = actors; this.shots = shots; this.lines = lines; this.done = done;
    this.i = -1; this.time = 0;
    Game.mode = 'cutscene'; Game.paused = false; Game.intro = null; Game.killcam = null; Game.slowmo = 0;
    Game.P = { x: Engine.cam.tx, y: 0, z: Engine.cam.tz, face: 0, hidden: true, outfit: 'suit', inv: [], held: -1 };
    Sfx.setMode('hideout'); Sfx.intensity = 0; Sfx.play('whoosh');
    clearTimeout(this._hideT);
    const el0 = $('#cine'); el0.classList.remove('hidden', 'out');
    if (kind === 'flash') el0.classList.add('flash');
    $('#cnSkip').onclick = e => { e.stopPropagation(); this.skip(); };
    this.next();
  },
  skip() {
    const cur = this.lines[this.i];
    if (cur && cur.choice) return;
    const ci = this.lines.findIndex((l, k) => k > this.i && l.choice);
    if (ci >= 0) { this.i = ci - 1; this.shown = 1e9; this.next(); return; }
    this.finish();
  },
  next() {
    const cur = this.lines[this.i];
    if (cur && cur.choice) return;
    if (cur && cur.text && this.shown < cur.text.length) { this.shown = cur.text.length; return; }
    this.i++;
    if (this.i >= this.lines.length) { this.finish(); return; }
    const L = this.lines[this.i];
    this.t = 0; this.shown = 0;
    const tEl = $('#cine .cn-title'), cap = $('#cine .cn-cap'), chEl = $('#cine .cn-choice');
    chEl.classList.add('hidden');
    if (L.title) {
      $('#cnT').textContent = L.title; $('#cnS').textContent = L.sub || '';
      tEl.classList.remove('go'); void tEl.offsetWidth; tEl.classList.add('go'); cap.classList.add('hidden');
    } else if (L.choice) {
      tEl.classList.remove('go'); cap.classList.add('hidden'); chEl.classList.remove('hidden');
      const P = Game.S.prog;
      if (P.irisChoice) { chEl.querySelector('.cc-q').textContent = P.irisChoice === 'kill' ? 'You chose to cross her off.' : 'You chose to let her live.'; }
      else chEl.querySelector('.cc-q').textContent = 'She knew. She said nothing. What happens to Iris?';
      chEl.querySelectorAll('button').forEach(b => b.onclick = e => {
        e.stopPropagation();
        if (!P.irisChoice) { P.irisChoice = b.dataset.c; Game.save(); }
        Sfx.play(P.irisChoice === 'kill' ? 'kill' : 'open');
        const story = CAMPAIGN[13];
        const add = P.irisChoice === 'kill' ? [{ who: 'iris', text: 'I understand. I\'ll leave the door unlocked.', shot: 2 }, { who: 'narr', text: 'Iris. Your handler. She knew.', shot: 2 }]
          : [{ who: 'iris', text: story.spareBrief, shot: 2 }, { who: 'narr', text: 'Kessler. Marlow\'s cleaner. Sent for Iris.', shot: 2 }];
        this.lines.splice(this.i + 1, 0, ...add);
        this.lines[this.i] = { who: 'narr', text: P.irisChoice === 'kill' ? 'Her name goes back on the wall.' : 'You let her live.', shot: 2 };
        this.shown = 0; this.t = 0; chEl.classList.add('hidden'); cap.classList.remove('hidden');
        this.showCaption(this.lines[this.i]);
      });
      chEl.querySelectorAll('button').forEach(b => b.classList.toggle('dim', !!P.irisChoice && b.dataset.c !== P.irisChoice));
    } else {
      tEl.classList.remove('go'); cap.classList.remove('hidden');
      this.showCaption(L);
    }
    for (const a of this.actors) if (!a.pet && a.who && a.idle !== 'sit' && a.idle !== 'dance' && a.idle !== 'drink') a.idle = a.who === L.who ? 'talk' : null;
  },
  showCaption(L) {
    const sp = speaker(L.who), cap = $('#cine .cn-cap');
    $('#cnW').textContent = sp.name;
    cap.className = 'cn-cap ' + sp.cls;
    if (sp.looks) drawPortrait($('#cnP'), sp.looks, sp.outfit); 
    $('#cnL').textContent = '';
    Sfx.play('tick');
  },
  update(dt) {
    this.time += dt; this.t += dt;
    const L = this.lines[this.i]; if (!L) return;
    if (L.text) {
      const before = Math.floor(this.shown);
      this.shown = Math.min(L.text.length, this.shown + dt * 40);
      if (Math.floor(this.shown) !== before) { $('#cnL').textContent = L.text.slice(0, Math.floor(this.shown)); if (Math.floor(this.shown) % 3 === 0) Sfx.play('tick'); }
      if (this.shown >= L.text.length && this.t > L.text.length / 40 + 3.4) this.next();
    } else if (L.title && this.t > 2.8) this.next();
    const L2 = this.lines[this.i]; if (!L2) return;
    const g = this.shots[Math.min(L2.shot || 0, this.shots.length - 1)](this.time);
    camTo(Engine.cam, g, Math.min(1, dt * 1.6));
    Engine.cut = Game.cutY = g.cut; Engine.fadeTarget = g.fade || null;
    sceneLights();
  },
  draw(t) {
    for (const a of this.actors) {
      if (a.y > Game.cutY + 0.5) continue;
      if (a.pet) { drawPet(a, t); continue; }
      drawScaled(a.scale, a.x, a.y, a.z, () => drawCharacter(a.x, a.y, a.z, a.face, a.looks, a.outfit, a.suit || null, { idle: a.idle, t: t + a.x }, a.target ? { emit: [1, 0.42, 0.08, 0.12 + 0.08 * Math.sin(t * 4)] } : undefined));
    }
  },
  finish() {
    if (Game.mode !== 'cutscene') return;
    const c = $('#cine'); c.classList.add('out'); clearTimeout(this._hideT); this._hideT = setTimeout(() => { if (Game.mode !== 'cutscene') c.classList.add('hidden'); }, 400);
    Game.mode = 'result';
    const d = this.done; this.done = null; this.lines = [];
    if (this.kind !== 'outro') this.actors = null;
    d && d();
  }
};

/* campaign hooks: intro before the first briefing of a chapter, outro after a win */
(function () {
  const ob = UI.briefing;
  const back = (ci, intel, mode, chapter, start) => () => { Game.enterHideout(); UI._ctab = 'campaign'; UI.openStation('contracts'); ob.call(UI, ci, intel, mode, chapter, start); };
  UI.briefing = function (ci, intel, mode, chapter, start) {
    ensureExtras();
    const P = Game.S.prog;
    if (mode === 'campaign' && Game.mode === 'hideout' && (!P.cuts['i' + chapter] || (CAMPAIGN[chapter].iris && !P.irisChoice))) {
      P.cuts['i' + chapter] = 1; Game.save(); this.closeSheet();
      Cutscene.intro(chapter, back(ci, intel, mode, chapter, start));
      return;
    }
    ob.call(this, ci, intel, mode, chapter, start);
    if (mode === 'campaign') {
      const body = this.sheet.querySelector('.brief'); if (!body) return;
      const row = el('div', 'cut-row');
      const b1 = el('button', 'btn sm', '{i:film} Watch Briefing');
      b1.onclick = () => { this.closeSheet(); Cutscene.intro(chapter, back(ci, intel, mode, chapter, start)); };
      row.appendChild(b1);
      if ((P.campaign || 0) > chapter) {
        const b2 = el('button', 'btn sm', '{i:chat} Watch Debrief');
        b2.onclick = () => { this.closeSheet(); Cutscene.outro(chapter, () => { const f = CAMPAIGN[chapter].flash; if (f) Cutscene.flashback(f, back(ci, intel, mode, chapter, start)); else back(ci, intel, mode, chapter, start)(); }); };
        row.appendChild(b2);
      }
      body.insertBefore(row, body.firstChild);
    }
  };
})();

/* =========================================================
   2) RECORDS, LEADERBOARDS AND REPLAYS
   ========================================================= */
const REPLAY_KEY = 'thelist_replays_v1';
const Records = {
  cur: null, last: null,
  begin() {
    const C = Game.C;
    if (!C || C.mode === 'tutorial' || C.mode === 'sniper') { this.cur = null; return; }
    this.cur = { v: 1, ci: C.ci, seed: C.mapSeed, mode: C.mode, look: JSON.parse(JSON.stringify(Game.S.look)),
      targets: Game.targets.map(t => ({ name: t.name, looks: t.looks, outfit: t.outfit })), dt: 0.5, of: [], p: [], tg: [], ev: [], acc: 0, n: 0, dur: 0 };
    this.lastSp = false; this.lastBodies = 0; this.lastOutfit = Game.P.outfit;
    this.sample();
  },
  oi(o) { const R = this.cur; let i = R.of.indexOf(o); if (i < 0) { R.of.push(o); i = R.of.length - 1; } return i; },
  tick(dt) {
    const R = this.cur; if (!R || Game.mode !== 'mission') return;
    R.acc += dt;
    if (R.acc >= R.dt) { R.acc -= R.dt; this.sample(); }
    const S = Game.stats, P = Game.P;
    if (S.spotted && !this.lastSp) { this.lastSp = true; this.event('spot', 'Spotted'); }
    if (S.bodiesFound > this.lastBodies) { this.lastBodies = S.bodiesFound; this.event('body', 'A body was found'); }
    if (P.outfit !== this.lastOutfit) { this.lastOutfit = P.outfit; this.event('disg', 'Disguise: ' + (OUTFIT_NAMES[P.outfit] || P.outfit)); }
  },
  sample() {
    const R = this.cur, P = Game.P;
    R.p.push(Math.round(P.x * 10), Math.round(P.y * 10), Math.round(P.z * 10), Math.round(P.face * 100), this.oi(P.outfit), (P.moving ? 1 : 0) | (P.carrying ? 2 : 0) | (P.action ? 4 : 0) | (P.aimT > 0 ? 8 : 0) | (P.dead ? 16 : 0));
    for (const t of Game.targets) R.tg.push(Math.round(t.x * 10), Math.round(t.y * 10), Math.round(t.z * 10), Math.round(t.face * 100), t.state === 'dead' ? (t.escaped ? 3 : 2) : t.moving ? 1 : 0);
    R.n++; R.dur = Game.stats.t;
    if (R.n >= 1200) this.compact();
  },
  compact() {
    const R = this.cur, T = R.targets.length, np = [], nt = [];
    for (let i = 0; i < R.n; i += 2) { for (let k = 0; k < 6; k++) np.push(R.p[i * 6 + k]); for (let k = 0; k < T * 5; k++) nt.push(R.tg[i * T * 5 + k]); }
    R.p = np; R.tg = nt; R.n = np.length / 6; R.dt *= 2;
  },
  event(k, txt, at, extra) {
    if (!this.cur) return;
    const P = at || Game.P;
    this.cur.ev.push(Object.assign({ t: Math.round(Game.stats.t * 10) / 10, k, txt, x: +P.x.toFixed(1), y: +P.y.toFixed(1), z: +P.z.toFixed(1) }, extra || {}));
  },
  finish() { const R = this.cur; if (!R) return null; this.sample(); delete R.acc; this.cur = null; this.last = R; return R; },
  score(res) {
    const base = { S: 10000, A: 8000, B: 6500, C: 5000, D: 3500, F: 2000 }[res.rank] || 2000;
    const st = res.stats || {};
    let s = base + Math.max(0, Math.round(4000 - (st.time || 0) * 6));
    if (res.sa) s += 2500; else if (st.spotted === false) s += 1000;
    if (res.mode === 'sniper') s += Math.round((st.acc || 0) * 3000) + (st.accidents || 0) * 1000;
    s -= (Game.stats && Game.stats.nonTarget || 0) * 600;
    s *= { casual: 0.75, pro: 1, master: 1.5 }[Game.diff] || 1;
    if (res.mode === 'elusive') s *= 1.2;
    return Math.max(0, Math.round(s));
  },
  key(res) { return (res.mode === 'sniper' ? 'sn:' : '') + CITIES[res.C.ci].id; },
  submit(res) {
    ensureExtras();
    const rec = res.mode === 'sniper' ? null : this.finish();
    if (rec) res.replay = rec;
    if (!res.success || res.mode === 'tutorial') return;
    const id = this.key(res), S = Game.S;
    const list = S.records[id] = S.records[id] || [];
    const prev = list.length ? list[0].score : 0;
    const e = { score: this.score(res), rank: res.rank, time: Math.round((res.stats && res.stats.time) || 0), date: Progress.dayStr(), diff: Game.diff, mode: res.mode };
    list.push(e); list.sort((a, b) => b.score - a.score); list.splice(5);
    const pos = list.indexOf(e) + 1;
    res.record = { score: e.score, best: pos === 1, prev, pos };
    if (pos === 1 && rec) { rec.score = e.score; rec.rank = e.rank; rec.date = e.date; this.store(id, rec); }
    Game.save();
  },
  all() { try { return JSON.parse(localStorage.getItem(REPLAY_KEY)) || {}; } catch (e) { return {}; } },
  store(id, rec) {
    const A = this.all(); A[id] = rec;
    for (let tries = 0; tries < 16; tries++) {
      try { localStorage.setItem(REPLAY_KEY, JSON.stringify(A)); return true; } catch (e) {
        const ks = Object.keys(A).filter(k => k !== id); if (!ks.length) return false; delete A[ks[0]];
      }
    }
    return false;
  },
  load(id) { return this.all()[id] || null; },
  totals(prefix) { let s = 0; for (const c of CITIES) { const L = Game.S.records[(prefix || '') + c.id]; if (L && L.length) s += L[0].score; } return s; }
};

/* record kills and wrap mission start */
(function () {
  const k = Game.kill;
  Game.kill = function (n, method, byPlayer, via) {
    const was = n.state;
    k.call(this, n, method, byPlayer, via);
    if (was !== 'dead' && n.state === 'dead') {
      const ti = this.targets ? this.targets.indexOf(n) : -1;
      if (Records.cur) Records.event('kill', ti >= 0 ? 'Target eliminated: ' + n.name : 'Non-target killed', n, { f: +n.face.toFixed(2), o: n.outfit, ti });
      if (this.C && this.C.mode === 'sniper') { if (n.isTarget && n.accident) this.stats.accidents = (this.stats.accidents || 0) + 1; this.killcam = null; }
    }
  };
  const sm = Game.startMission;
  Game.startMission = function (ci, intel, opts) {
    ensureExtras();
    if (opts && opts.mode === 'sniper') return Sniper.start(ci);
    sm.call(this, ci, intel, opts);
    Records.begin();
  };
})();

const Replay = {
  rec: null, t: 0, speed: 1, playing: true, crowd: [], onExit: null,
  play(rec, onExit) {
    if (!rec) { UI.toast('No replay saved yet', 'bad'); return; }
    UI.loading(() => {
      const M = buildMap(rec.ci, rec.seed); Game.loadMap(M); Game.npcs = [];
      this.rec = rec; this.t = 0; this.speed = 1; this.playing = true; this.onExit = onExit; this.evI = 0;
      const rng = RNG(rec.seed * 31 + 7), cr = [];
      for (const g of M.guards) { const r = g.route[0]; cr.push({ x: r[0] + 0.5, y: r[1], z: r[2] + 0.5, face: g.face || rng() * 6.28, looks: Object.assign(randomLooks(rng, 'guard'), { female: false }), outfit: 'guard', idle: null }); }
      for (const s of M.staff) { const r = s.route[0]; cr.push({ x: r[0] + 0.5, y: r[1], z: r[2] + 0.5, face: s.face || rng() * 6.28, looks: randomLooks(rng, 'staff'), outfit: s.outfit, idle: rng.pick(['wipe', 'tray', null]) }); }
      for (const g of M.guests) { const sp = M.spots[g.group]; if (!sp || !sp.length) continue; const p = sp[rng.int(0, sp.length - 1)]; cr.push({ x: p[0] + 0.5, y: p[1], z: p[2] + 0.5, face: rng() * 6.28, looks: randomLooks(rng, 'guest'), outfit: g.vip ? 'vip' : 'guest', idle: rng.pick(['talk', 'drink', 'phone', 'talk', null]) }); }
      this.crowd = cr.slice(0, 70);
      this.bodyLooks = rec.ev.map((e, i) => randomLooks(RNG(rec.seed + i * 13), 'guest'));
      Game.mode = 'replay'; Game.paused = false;
      Game.P = { x: rec.p[0] / 10, y: rec.p[1] / 10, z: rec.p[2] / 10, face: 0, hidden: true, outfit: 'suit', inv: [], held: -1, moving: false, dead: false };
      Game.snapCam(); Engine.cam.yaw = Math.PI + 0.55; Engine.cam.pitch = 0.95; Engine.cam.dist = 20;
      UI.hideAll(); $('#rphud').classList.remove('hidden');
      $('#rpInfo').textContent = `${CITIES[rec.ci].name} · ${rec.score ? 'Score ' + rec.score.toLocaleString() + ' · ' : ''}${rec.rank ? 'Rank ' + rec.rank : ''}`;
      const ticks = $('#rpTicks'); ticks.innerHTML = '';
      for (const e of rec.ev) { const d = el('i', 'tk ' + e.k); d.style.left = (e.t / Math.max(1, rec.dur) * 100) + '%'; ticks.appendChild(d); }
      $('#rpPlay').onclick = () => { if (this.t >= this.rec.dur) this.t = 0; this.playing = !this.playing; this.btn(); };
      $('#rpSpd').onclick = () => { this.speed = this.speed >= 8 ? 1 : this.speed * 2; $('#rpSpd').textContent = this.speed + 'x'; };
      $('#rpSpd').textContent = '1x';
      $('#rpExit').onclick = () => this.exit();
      const tr = $('#rpTrack');
      const seek = e => { const r = tr.getBoundingClientRect(); this.t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * this.rec.dur; this.evI = this.rec.ev.findIndex(x => x.t > this.t); if (this.evI < 0) this.evI = this.rec.ev.length; };
      tr.onpointerdown = e => { tr.setPointerCapture(e.pointerId); seek(e); tr.onpointermove = seek; };
      tr.onpointerup = () => { tr.onpointermove = null; };
      this.btn();
      Sfx.setMode('mission'); Sfx.intensity = 0;
      const C = Game.S.prog.career; C.replays = (C.replays || 0) + 1; Progress.checkAch(); Game.save();
    });
  },
  btn() { $('#rpPlay').innerHTML = this.playing ? '{i:pause}' : '{i:play}'; },
  exit() { Game.mode = 'result'; const f = this.onExit; this.rec = null; Game.enterHideout(); f && f(); },
  stateAt(t) {
    const R = this.rec, f = Math.max(0, Math.min(R.n - 1.0001, t / R.dt)), i0 = Math.floor(f), i1 = Math.min(R.n - 1, i0 + 1), k = f - i0;
    const a = i0 * 6, b = i1 * 6, p = R.p;
    const P = { x: (p[a] + (p[b] - p[a]) * k) / 10, y: (p[a + 1] + (p[b + 1] - p[a + 1]) * k) / 10, z: (p[a + 2] + (p[b + 2] - p[a + 2]) * k) / 10,
      face: lerpAng(p[a + 3] / 100, p[b + 3] / 100, k), outfit: R.of[p[a + 4]] || 'suit', fl: p[a + 5] };
    const T = R.targets.length, tg = [];
    for (let j = 0; j < T; j++) {
      const A = (i0 * T + j) * 5, Bq = (i1 * T + j) * 5, q = R.tg;
      tg.push({ x: (q[A] + (q[Bq] - q[A]) * k) / 10, y: (q[A + 1] + (q[Bq + 1] - q[A + 1]) * k) / 10, z: (q[A + 2] + (q[Bq + 2] - q[A + 2]) * k) / 10, face: lerpAng(q[A + 3] / 100, q[Bq + 3] / 100, k), st: q[A + 4] });
    }
    return { P, tg };
  },
  update(dt) {
    const R = this.rec; if (!R) return;
    if (this.playing) { this.t += dt * this.speed; if (this.t >= R.dur) { this.t = R.dur; this.playing = false; this.btn(); } }
    const s = this.stateAt(this.t); this.cur = s;
    const P = Game.P; Object.assign(P, { x: s.P.x, y: s.P.y, z: s.P.z, face: s.P.face, outfit: s.P.outfit, moving: !!(s.P.fl & 1) });
    P.phase = (P.phase || 0) + (P.moving ? dt * this.speed * 9 : 0);
    // events
    while (this.evI < R.ev.length && R.ev[this.evI].t <= this.t) {
      const e = R.ev[this.evI++];
      if (this.playing) { const d = $('#rpEv'); d.textContent = e.txt; d.className = 'show ' + e.k; clearTimeout(this._evT); this._evT = setTimeout(() => d.className = '', 2200); Sfx.play(e.k === 'kill' ? 'kill' : 'tick'); }
    }
    const c = Engine.cam, k = Math.min(1, dt * 6);
    c.tx += (P.x - c.tx) * k; c.ty += (P.y + 1 - c.ty) * k; c.tz += (P.z - c.tz) * k;
    Game.updateCut(); Engine.fadeTarget = [P.x, P.y, P.z];
    sceneLights();
    $('#rpFill').style.width = (this.t / Math.max(0.01, R.dur) * 100) + '%';
    $('#rpTime').textContent = `${fmtTime(this.t)} / ${fmtTime(R.dur)}`;
  },
  draw(t) {
    const R = this.rec, s = this.cur; if (!R || !s) return;
    const cut = Game.cutY, c = Engine.cam, near = (x, z) => (x - c.tx) ** 2 + (z - c.tz) ** 2 < 2500;
    for (const a of this.crowd) { if (a.y > cut + 0.5 || !near(a.x, a.z)) continue; drawCharacter(a.x, a.y, a.z, a.face, a.looks, a.outfit, null, { idle: a.idle, t: t + a.x }); }
    const P = Game.P;
    drawCharacter(P.x, P.y, P.z, P.face, R.look, P.outfit, R.look.suit, { walk: P.moving, phase: P.phase, act: !!(s.P.fl & 4), aim: !!(s.P.fl & 8), drag: !!(s.P.fl & 2), dead: !!(s.P.fl & 16), deadK: 1, t }, { emit: [0.2, 0.6, 1, 0.06] });
    s.tg.forEach((q, j) => {
      if (q.st === 3 || q.y > cut + 0.5) return;
      const T = R.targets[j], dead = q.st === 2;
      drawCharacter(q.x, q.y, q.z, q.face, T.looks, T.outfit, null, { walk: q.st === 1, phase: t * 9, dead, deadK: 1, t }, dead ? undefined : { emit: [1, 0.42, 0.08, 0.14 + 0.08 * Math.sin(t * 4)] });
      if (!dead) Engine.box(M4.mul(M4.T(q.x, q.y + 2.4 + Math.sin(t * 3) * 0.1, q.z), M4.mul(M4.RY(t * 2), M4.mul(M4.RZ(Math.PI / 4), M4.S(0.22, 0.22, 0.22)))), [1, 0.5, 0.12], [1, 0.45, 0.08, 0.95]);
    });
    R.ev.forEach((e, i) => {
      if (e.k !== 'kill' || e.ti >= 0 || e.t > this.t || e.y > cut + 0.5 || !near(e.x, e.z)) return;
      drawCharacter(e.x, e.y, e.z, e.f || 0, this.bodyLooks[i], e.o || 'guest', null, { dead: true, deadK: 1, t });
    });
  }
};

/* =========================================================
   3) SNIPER ASSASSIN MODE
   ========================================================= */
const SNIPER_RIFLES = [
  { id: 'r0', name: 'Kestrel Bolt-Action', price: 0, zoom: 4, mag: 5, ammo: 20, silenced: false, bolt: 1.25, reload: 2.4, desc: 'Reliable, loud. Every shot can be heard.' },
  { id: 'r1', name: 'Whisper Suppressed', price: 60000, zoom: 5, mag: 5, ammo: 20, silenced: true, bolt: 1.0, reload: 2.2, desc: 'Integrated suppressor. Only people near the impact notice.' },
  { id: 'r2', name: 'Sovereign Elite', price: 160000, zoom: 8, mag: 8, ammo: 30, silenced: true, bolt: 0.55, reload: 1.8, desc: 'Suppressed semi-auto with an 8x scope.' }
];
const SNIPER_SHOOTABLE = ['chandelier', 'sig', 'stove', 'speaker', 'caralarm', 'fusebox', 'radio'];

const Sniper = {
  E: [0, 0, 0], yaw: 0, pitch: 0.3, fov: 0.75, zoom: 1, D: 60, floorI: 0, rifle: SNIPER_RIFLES[0],
  active() { return Game.mode === 'mission' && Game.C && Game.C.mode === 'sniper' && !Game.paused; },
  rifleOf() { return SNIPER_RIFLES.find(r => r.id === Game.S.sniper.rifle) || SNIPER_RIFLES[0]; },
  extraTarget(rng, used) {
    const looks = randomLooks(rng, 'target');
    const stops = rng.shuffle(['bar', 'buffet', 'office', 'speech', 'balcony', 'kitchen', 'sauna', 'pool', 'privatebar'].filter(x => !used.includes(x))).slice(0, 4);
    return { name: rng.pick(FIRST) + ' ' + rng.pick(LAST), title: rng.pick(TITLES), looks, outfit: rng() < 0.5 ? 'vip' : 'guest', stops };
  },
  contract(ci) {
    ensureExtras();
    const id = CITIES[ci].id, SS = Game.S.sniper;
    if (!SS.seeds[id]) { SS.seeds[id] = (Math.random() * 1e9) | 0; Game.save(); }
    const C = Game.genContract(ci, SS.seeds[id]);
    const rng = RNG(C.seed + 31337);
    C.mode = 'sniper'; C.intel = 1; C.method = 'any'; C.bodyguard = true; C.start = 'perch';
    C.second = this.extraTarget(rng, C.stops); C.third = this.extraTarget(rng, C.stops.concat(C.second.stops));
    C.fee = 20000 + ci * 6000; C.title = C.title;
    return C;
  },
  start(ci) {
    const G = Game, C = this.contract(ci);
    G.C = C; G.mode = 'mission'; G.paused = false;
    const M = buildMap(ci, C.mapSeed); G.loadMap(M);
    Engine.env = Object.assign({}, Engine.env, { fogN: (Engine.env.fogN || 50) + 40, fogF: (Engine.env.fogF || 130) + 90 });
    const rng = RNG(C.seed + 99);
    // the perch: across the street, high above the venue's front
    const b = M.building, bx = (b.x0 + b.x1) / 2, bz = (b.z0 + b.z1) / 2, sp = M.spawns[0];
    let dx = sp[0] - bx, dz = sp[2] - bz; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
    const rot = 0.38, rx = dx * Math.cos(rot) - dz * Math.sin(rot), rz = dx * Math.sin(rot) + dz * Math.cos(rot);
    const R = Math.hypot(b.x1 - b.x0, b.z1 - b.z0) / 2 + 20;
    this.E = [bx + rx * R, b.top + 16, bz + rz * R];
    G.P = G.makePlayer([Math.floor(this.E[0]), Math.floor(this.E[1]), Math.floor(this.E[2])], 'suit');
    Object.assign(G.P, { x: this.E[0], y: this.E[1], z: this.E[2], hidden: true });
    G.stats = { t: 0, spotted: false, spottedBy: 0, bodiesFound: 0, kills: 0, nonTarget: 0, combat: false, suitOnly: true, targetDead: false, method: null, disguises: 0, coins: 0, kos: 0, usedGun: true, shots: 0, hits: 0, accidents: 0, alerted: false };
    G.diff = G.S.settings.difficulty || 'pro'; G.D = DIFFS[G.diff];
    G.chatT = 3;
    G.spawnNPCs(rng);
    G.time = 0; G.slowmo = 0; G.killcam = null; G.intro = null; UI.clearFx(); UI.setInstinct(false);
    Tutorial.active = false; $('#tut').classList.add('hidden');
    G.lastLaunch = { ci, intel: 0, opts: { mode: 'sniper' } };
    this.rifle = this.rifleOf(); this.mag = this.rifle.mag; this.ammo = this.rifle.ammo - this.rifle.mag;
    this.cool = 0; this.reloadT = 0; this.endT = 0; this.zoom = 1; this.fov = 0.75; this.failT = 0;
    // aim at the main target to start
    const t = G.targets[0];
    this.floorI = this.floorOf(t.y);
    this.lookAt([t.x, t.y + 1, t.z]); this.D = Math.hypot(t.x - this.E[0], t.y - this.E[1], t.z - this.E[2]);
    Engine.fadeLift = 0; Engine.fadeR = 0.14;
    UI.hideAll(); $('#shud').classList.remove('hidden'); this.wireHud(); this.hud(true);
    Sfx.setMode('mission'); Sfx.play('whoosh');
    UI.toast(`${CITIES[ci].name} — ${CITIES[ci].venue}`, 'big');
    UI.toast('Eliminate all three targets. Drag to aim, pinch to zoom.');
    G.save();
  },
  floorOf(y) { const F = Game.M.floors; let k = 0; for (let i = 0; i < F.length - 1; i++) if (y >= F[i] - 0.5) k = i; return k; },
  cut() { const F = Game.M.floors; return this.floorI >= F.length - 1 ? 999 : F[this.floorI] + 2.9; },
  lookAt(p) {
    const ux = this.E[0] - p[0], uy = this.E[1] - p[1], uz = this.E[2] - p[2], L = Math.hypot(ux, uy, uz) || 1;
    this.pitch = Math.asin(uy / L); this.yaw = Math.atan2(ux, uz);
  },
  dir() { const cp = Math.cos(this.pitch); return [-Math.sin(this.yaw) * cp, -Math.sin(this.pitch), -Math.cos(this.yaw) * cp]; },
  // ray that passes through walls and stops on walkable surfaces below the cut
  floorRay(o, d, maxD) {
    const W = Game.W, cut = this.cut(); let acc = 0;
    for (let k = 0; k < 40; k++) {
      const oo = [o[0] + d[0] * acc, o[1] + d[1] * acc, o[2] + d[2] * acc];
      const h = W.raycast(oo, d, maxD - acc, cut); if (!h) return null;
      const T = acc + h.t;
      if (h.face[1] === 1) return { t: T, p: [o[0] + d[0] * T, o[1] + d[1] * T, o[2] + d[2] * T] };
      acc = T + 0.04; if (acc > maxD) return null;
    }
    return null;
  },
  camera(dt) {
    const c = Engine.cam, d = this.dir();
    this.fov += (0.75 / this.zoom - this.fov) * Math.min(1, dt * 10);
    const h = this.floorRay(this.E, d, 260), D = Math.max(6, Math.min(230, h ? h.t : 90));
    this.D += (D - this.D) * Math.min(1, dt * 10);
    c.fov = this.fov; c.yaw = this.yaw; c.pitch = this.pitch; c.dist = this.D;
    c.tx = this.E[0] + d[0] * this.D; c.ty = this.E[1] + d[1] * this.D; c.tz = this.E[2] + d[2] * this.D;
    Engine.cut = Game.cutY = this.cut();
    Engine.fadeTarget = h ? h.p : null;
    Game.targetVisible = true;
    this.tick(dt);
    this.hud();
  },
  drag(dx, dy) { const s = this.fov / Math.max(320, innerHeight); this.yaw += dx * s; this.pitch = Math.max(-0.15, Math.min(1.35, this.pitch - dy * s)); },
  zoomBy(f) { const z = this.rifle.zoom; this.zoom = Math.max(1, Math.min(z, this.zoom * f)); },
  setZoom(z) { this.zoom = Math.max(1, Math.min(this.rifle.zoom, z)); Sfx.play('tick'); },
  tick(dt) {
    const G = Game, S = G.stats;
    this.cool = Math.max(0, this.cool - dt);
    if (this.reloadT > 0) { this.reloadT -= dt; if (this.reloadT <= 0) { const n = Math.min(this.rifle.mag - this.mag, this.ammo); this.mag += n; this.ammo -= n; Sfx.play('pickup'); } }
    if (G.targets.some(t => t.state === 'escape')) S.alerted = true;
    if (S.targetDead && !this.endT) this.endT = G.time + 2.4;
    if (this.endT && G.time >= this.endT && G.mode === 'mission') { this.endT = 0; G.endMission(true); return; }
    if (!S.targetDead && this.mag <= 0 && this.ammo <= 0 && this.reloadT <= 0) {
      this.failT += dt; if (this.failT > 2.5 && G.mode === 'mission') G.endMission(false, 'Out of ammunition');
    }
  },
  wireHud() {
    const b = (id, fn) => { const e = $(id); e.onclick = ev => { ev.stopPropagation(); fn(); }; };
    b('#sFire', () => this.fire());
    b('#sZoomIn', () => this.setZoom(this.zoom < 1.5 ? 2 : this.zoom * 2));
    b('#sZoomOut', () => this.setZoom(this.zoom > 2.5 ? this.zoom / 2 : 1));
    b('#sFloorUp', () => { this.floorI = Math.min(Game.M.floors.length - 1, this.floorI + 1); Sfx.play('tick'); this.hud(true); });
    b('#sFloorDn', () => { this.floorI = Math.max(0, this.floorI - 1); Sfx.play('tick'); this.hud(true); });
    b('#sNext', () => this.nextTarget());
    b('#sReload', () => this.reload());
    b('#sInst', () => Game.toggleInstinct());
    b('#sPause', () => UI.pause());
  },
  nextTarget() {
    const alive = Game.targets.filter(t => t.state !== 'dead');
    if (!alive.length) return;
    this._ti = ((this._ti || 0) + 1) % alive.length;
    const t = alive[this._ti];
    this.floorI = this.floorOf(t.y); this.lookAt([t.x, t.y + 1, t.z]);
    if (this.zoom < 2) this.zoom = Math.min(this.rifle.zoom, 2.5);
    UI.toast(`${t.name}${t.state === 'escape' ? ' — fleeing!' : ''}`); Sfx.play('tick'); this.hud(true);
  },
  reload() {
    if (this.reloadT > 0 || this.mag >= this.rifle.mag || this.ammo <= 0) return;
    this.reloadT = this.rifle.reload; Sfx.play('action');
  },
  hit(o, d) {
    const G = Game, cut = this.cut();
    const fl = this.floorRay(o, d, 260), ft = fl ? fl.t : 1e9;
    let best = null, bt = ft, kind = null;
    for (const n of G.npcs) {
      if (n.hidden || n.carriedBy || n.state === 'dead' || n.y > cut + 0.5) continue;
      const t = rayAABB(o, d, [n.x - 0.38, n.y, n.z - 0.38], [n.x + 0.38, n.y + 1.95, n.z + 0.38]);
      if (t >= 0 && t < bt) { bt = t; best = n; kind = 'npc'; }
    }
    for (const pr of G.props) {
      if (pr.gone || !SNIPER_SHOOTABLE.includes(pr.type) || pr.p[1] > cut + 0.5) continue;
      if (pr.type === 'sig' && !(pr.sig && pr.sig.type === 'drop' && !pr.dropped)) continue;
      if (pr.type === 'chandelier' && (pr.dropped || pr.dropping)) continue;
      const s = pr.type === 'chandelier' ? 0.9 : 0.55, y0 = pr.type === 'chandelier' ? pr.p[1] - 0.6 : pr.p[1];
      const t = rayAABB(o, d, [pr.p[0] - s, y0, pr.p[2] - s], [pr.p[0] + s, y0 + (pr.type === 'chandelier' ? 1.2 : 1.0), pr.p[2] + s]);
      if (t >= 0 && t < bt) { bt = t; best = pr; kind = 'prop'; }
    }
    return { kind, best, t: bt === 1e9 ? 120 : bt, floor: fl };
  },
  fire() {
    const G = Game, S = G.stats;
    if (!this.active() || G.slowmo > 0) return;
    if (this.reloadT > 0 || this.cool > 0) return;
    if (this.mag <= 0) { if (this.ammo > 0) this.reload(); else Sfx.play('tick'); return; }
    this.mag--; S.shots++; this.cool = this.rifle.bolt;
    const o = this.E, d = this.dir(), h = this.hit(o, d);
    const pt = [o[0] + d[0] * h.t, o[1] + d[1] * h.t, o[2] + d[2] * h.t];
    Sfx.play(this.rifle.silenced ? 'silenced' : 'gun'); Engine.shakeAmt = Math.max(Engine.shakeAmt, 0.18 / this.zoom);
    this.pitch = Math.min(1.35, this.pitch - 0.012 / this.zoom);
    G.fx.push({ type: 'tracer', a: [o[0] + d[0] * 3, o[1] + d[1] * 3 - 0.4, o[2] + d[2] * 3], b: pt, t: 0, dur: 0.12, col: [1, 0.9, 0.55] });
    try { navigator.vibrate && navigator.vibrate(30); } catch (e) { }
    const flash = $('#sMuzzle'); flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
    if (h.kind === 'npc') {
      const n = h.best; S.hits++;
      G.kill(n, 'sniper', true);
      G.noise(pt, this.rifle.silenced ? 6 : 24, this.rifle.silenced ? 'scream' : 'gunshot');
    } else if (h.kind === 'prop') {
      const pr = h.best; this.shootProp(pr, pt);
    } else {
      G.fx.push({ type: 'dust', p: pt, t: 0, dur: 0.5 });
      G.noise(pt, this.rifle.silenced ? 3.5 : 16, this.rifle.silenced ? 'scream' : 'gunshot');
    }
    if (this.mag <= 0 && this.ammo > 0) setTimeout(() => this.reload(), 350);
    this.hud(true);
  },
  shootProp(pr, pt) {
    const G = Game;
    switch (pr.type) {
      case 'chandelier': pr.used = true; G.dropChandelier(); G.toast('The chandelier gives way...'); break;
      case 'sig': pr.dropping = true; pr.dropY = 0; pr.vy = 0; G.fx.push({ type: 'sigdrop', pr, t: 0, dur: 0.8 }); break;
      case 'stove': pr.gone = true; G.explode(pr.p, 3.4, 'accident'); break;
      case 'speaker': if (G.M.stops.pool) { pr.used = true; pr.fallT = 0; G.electrocutePool(); } break;
      case 'caralarm': pr.on = true; pr.alarmT = 9; Sfx.play('alarm'); G.lure(pr, 26, 3, 'alarm'); G.toast('Car alarm!'); break;
      case 'fusebox': pr.on = true; G.blackout = { y: Math.round(pr.p[1]), t: 35, pr }; Sfx.play('zap'); G.lure(pr, 30, 1, 'fuse'); G.toast('Power cut on that floor'); break;
      case 'radio': pr.on = true; pr.radioT = 0; G.lure(pr, 14, 1, 'radio'); G.toast('Radio on'); break;
    }
    G.fx.push({ type: 'dust', p: pt, t: 0, dur: 0.4 });
  },
  tap(sx, sy) {
    const r = Engine.ray(sx, sy), cut = this.cut();
    let best = null, bt = 1e9;
    for (const n of Game.npcs) {
      if (n.hidden || n.y > cut + 0.5) continue;
      const t = rayAABB(r.o, r.d, [n.x - 0.5, n.y, n.z - 0.5], [n.x + 0.5, n.y + 2, n.z + 0.5]);
      if (t >= 0 && t < bt) { bt = t; best = n; }
    }
    if (!best) return;
    const what = best.isTarget ? 'Target: ' + best.name : best.state === 'dead' ? 'Body' : GUARDLIKE(best.kind) ? 'Guard' : best.kind === 'staff' ? 'Staff' : 'Guest';
    UI.popup([best.x, best.y + 2.2, best.z], what.toUpperCase(), best.isTarget ? 'red' : 'grey');
  },
  panic(b) {
    const G = Game; G.stats.alerted = true;
    for (const t of G.targets) if (t.state !== 'dead' && Math.hypot(t.x - b.x, t.z - b.z) < 30) G.startEscape(t);
  },
  hud(force) {
    const now = performance.now(); if (!force && this._h && now - this._h < 120) return; this._h = now;
    const F = Game.M.floors;
    $('#sFloor').textContent = this.floorI >= F.length - 1 ? 'ROOF' : this.floorI === 0 ? 'GROUND' : 'FLOOR ' + this.floorI;
    $('#sAmmo').textContent = this.reloadT > 0 ? 'RELOADING' : `${this.mag} / ${this.ammo}`;
    $('#sFire').classList.toggle('wait', this.reloadT > 0 || this.cool > 0 || this.mag <= 0);
    $('#scZoom').textContent = this.zoom.toFixed(1) + 'x';
    $('#shud').classList.toggle('zoomed', this.zoom > 1.4);
    $('#sTime').textContent = fmtTime(Game.stats.t);
    $('#sTargets').innerHTML = Game.targets.map(t => `<div class="st${t.state === 'dead' ? ' dead' : t.state === 'escape' ? ' run' : ''}">${t.state === 'dead' ? '{i:check}' : t.state === 'escape' ? '{i:run}' : '{i:target}'} ${t.name}</div>`).join('');
    const im = $('#sInstM'); if (im && Game.inst) im.style.width = Game.inst.m + '%';
    $('#sInst').classList.toggle('on', !!(Game.inst && Game.inst.on));
  },
  end(success, reason) {
    const G = Game, S = G.stats, C = G.C, sv = G.S;
    $('#shud').classList.add('hidden');
    const res = { success, reason, city: CITIES[C.ci], C, lines: [], payout: 0, rank: 'F', mode: 'sniper' };
    const acc = S.shots ? S.hits / S.shots : 0;
    if (success) {
      const silent = !S.alerted && S.bodiesFound === 0 && S.nonTarget === 0;
      let pts = 100 - S.bodiesFound * 10 - S.nonTarget * 15 - (S.alerted ? 20 : 0) - (acc < 0.5 ? 10 : 0);
      const rank = silent && acc >= 0.6 ? 'S' : silent || pts >= 80 ? 'A' : pts >= 65 ? 'B' : pts >= 50 ? 'C' : pts >= 30 ? 'D' : 'F';
      res.rank = rank;
      let pay = C.fee; res.lines.push(['Sniper contract fee', C.fee]);
      if (silent) { const b = Math.round(C.fee * 0.4); pay += b; res.lines.push(['Silent Sniper', b]); }
      if (S.accidents) { const b = Math.round(C.fee * 0.1 * S.accidents); pay += b; res.lines.push([`Accident kills ×${S.accidents}`, b]); }
      if (S.shots === G.targets.length) { const b = Math.round(C.fee * 0.2); pay += b; res.lines.push(['Perfect accuracy', b]); }
      if (S.nonTarget) { const p = -S.nonTarget * 3000; pay += p; res.lines.push([`Non-target casualties ×${S.nonTarget}`, p]); }
      if (S.bodiesFound) { const p = -S.bodiesFound * 1500; pay += p; res.lines.push([`Bodies found ×${S.bodiesFound}`, p]); }
      if (G.D && G.D.pay !== 1) { const b = Math.round(pay * (G.D.pay - 1)); pay += b; res.lines.push([`${G.D.name} difficulty`, b]); }
      const rm = { S: 1.25, A: 1.1, B: 1, C: 0.95, D: 0.9, F: 0.8 }[rank], rb = Math.round(pay * rm) - pay;
      if (rb) res.lines.push([`Rank ${rank} modifier`, rb]);
      pay = Math.max(Math.round(C.fee * 0.25), pay + rb);
      res.payout = pay; sv.money += pay; sv.stats.contracts++; sv.stats.earned += pay; if (rank === 'S') sv.stats.s++;
      const id = CITIES[C.ci].id, order = 'SABCDF', prev = sv.sniper.best[id];
      if (!prev || order.indexOf(rank) < order.indexOf(prev)) sv.sniper.best[id] = rank;
      sv.sniper.seeds[id] = (Math.random() * 1e9) | 0;
      res.stats = { time: S.t, kills: S.kills, method: 'Sniper Rifle', spotted: false, bodies: S.bodiesFound, disguises: 0, shots: S.shots, hits: S.hits, acc, accidents: S.accidents };
      const Cr = sv.prog.career; Cr.snipers = (Cr.snipers || 0) + 1; if (rank === 'S') Cr.sniperS = (Cr.sniperS || 0) + 1;
    } else res.lines.push([reason || 'Contract failed', 0]);
    res.mastery = []; res.challenges = 0;
    res.xp = success ? RANK_XP[res.rank] + 300 : 100;
    res.xpFrom = { level: sv.prog.level, xp: sv.prog.xp };
    res.ups = Progress.addXP(res.xp);
    Progress.checkAch(); G.save();
    Sfx.setMode('hideout'); Sfx.intensity = 0;
    UI.showResult(res);
  }
};

/* =========================================================
   4) HIDEOUT: TROPHY WALL AND PETS
   ========================================================= */
const EVIDENCE_NAMES = { london: 'Groom\'s Cufflink', paris: 'Auction Paddle', dubai: 'Board Seal', tokyo: 'Vaultline VIP Pass', newyork: 'Ignition Key', rome: 'Villa Keycard', monaco: 'Marked Chip', marrakech: 'Estate Key', mumbai: 'Award Plaque', rio: 'Race Card', hongkong: 'Warrant Card', berlin: 'Fight Ticket', sydney: 'Death Certificate', istanbul: 'Sealed Brief', venice: 'Safehouse Key' };
const TROPHY_NAMES = { london: 'Clocktower Miniature', paris: 'Iron Tower Figurine', dubai: 'Golden Spire', tokyo: 'Torii Gate', newyork: 'Torch Statuette', rome: 'Marble Column', monaco: 'Casino Chip Stack', marrakech: 'Brass Lantern', mumbai: 'Premiere Film Reel', rio: 'Carnival Mask', hongkong: 'Jade Dragon', berlin: 'Gold Record', sydney: 'Harbour Sails', istanbul: 'Palace Dome', venice: 'Gilded Bauta Mask' };
const RANK_COL = { S: [0.95, 0.76, 0.28], A: [0.8, 0.82, 0.86], B: [0.72, 0.45, 0.24], C: [0.72, 0.45, 0.24], D: [0.32, 0.32, 0.34], F: [0.32, 0.32, 0.34] };

function drawTrophy(id, x, y, z, t, rank) {
  const b = (ox, oy, oz, sx, sy, sz, col, em, rx, rz) => {
    let m = M4.T(x + ox, y + oy, z + oz); if (rx) m = M4.mul(m, M4.RX(rx)); if (rz) m = M4.mul(m, M4.RZ(rz));
    Engine.box(M4.mul(m, M4.S(sx, sy, sz)), col, em || null);
  };
  b(0, 0.03, 0, 0.36, 0.06, 0.3, RANK_COL[rank] || RANK_COL.B, rank === 'S' ? [0.95, 0.76, 0.28, 0.25] : null);
  const gold = [0.95, 0.78, 0.3], stone = [0.78, 0.74, 0.64], y0 = 0.06;
  switch (id) {
    case 'london': b(0, y0 + 0.25, 0, 0.14, 0.5, 0.14, stone); b(0, y0 + 0.4, 0.072, 0.1, 0.1, 0.01, [0.95, 0.95, 0.85], [1, 0.95, 0.7, 0.4]); b(0, y0 + 0.56, 0, 0.1, 0.12, 0.1, gold); b(0, y0 + 0.65, 0, 0.03, 0.08, 0.03, gold); break;
    case 'paris': { const ir = [0.36, 0.3, 0.24]; b(0, y0 + 0.05, 0, 0.3, 0.1, 0.3, ir); b(0, y0 + 0.2, 0, 0.18, 0.2, 0.18, ir); b(0, y0 + 0.42, 0, 0.09, 0.26, 0.09, ir); b(0, y0 + 0.6, 0, 0.025, 0.12, 0.025, ir); break; }
    case 'dubai': { const s = [0.82, 0.85, 0.9]; b(0, y0 + 0.15, 0, 0.16, 0.3, 0.16, s); b(0, y0 + 0.4, 0, 0.1, 0.22, 0.1, s); b(0, y0 + 0.58, 0, 0.05, 0.16, 0.05, gold); b(0, y0 + 0.7, 0, 0.015, 0.1, 0.015, gold); break; }
    case 'tokyo': { const r = [0.82, 0.12, 0.1]; b(-0.13, y0 + 0.2, 0, 0.045, 0.4, 0.045, r); b(0.13, y0 + 0.2, 0, 0.045, 0.4, 0.045, r); b(0, y0 + 0.33, 0, 0.32, 0.035, 0.04, r); b(0, y0 + 0.42, 0, 0.42, 0.05, 0.06, r); b(0, y0 + 0.46, 0, 0.46, 0.03, 0.07, [0.08, 0.08, 0.08]); break; }
    case 'newyork': { const g = [0.36, 0.62, 0.52]; b(0, y0 + 0.2, 0, 0.12, 0.4, 0.1, g); b(0, y0 + 0.45, 0, 0.08, 0.1, 0.08, g); b(0.08, y0 + 0.5, 0, 0.04, 0.18, 0.04, g); b(0.08, y0 + 0.62, 0, 0.06, 0.06, 0.06, gold, [1, 0.7, 0.2, 0.7 + 0.2 * Math.sin(t * 6)]); break; }
    case 'rome': { const w = [0.93, 0.91, 0.86]; b(0, y0 + 0.03, 0, 0.22, 0.06, 0.22, w); b(0, y0 + 0.28, 0, 0.12, 0.45, 0.12, w); b(0, y0 + 0.53, 0, 0.22, 0.06, 0.22, w); break; }
    case 'monaco': [[0.75, 0.1, 0.12], [0.08, 0.08, 0.1], [0.75, 0.1, 0.12], [0.1, 0.35, 0.2]].forEach((c, i) => b(0, y0 + 0.025 + i * 0.05, 0, 0.26, 0.045, 0.26, c)); b(0, y0 + 0.21, 0, 0.1, 0.02, 0.1, gold); break;
    case 'marrakech': { const br = [0.78, 0.58, 0.24]; b(0, y0 + 0.2, 0, 0.17, 0.26, 0.17, br); b(0, y0 + 0.2, 0, 0.12, 0.2, 0.18, [1, 0.6, 0.2], [1, 0.6, 0.2, 0.8]); b(0, y0 + 0.37, 0, 0.1, 0.08, 0.1, br); b(0, y0 + 0.44, 0, 0.04, 0.06, 0.04, br); break; }
    case 'mumbai': b(0, y0 + 0.03, 0, 0.12, 0.06, 0.12, [0.2, 0.2, 0.22]); b(0, y0 + 0.24, 0, 0.32, 0.32, 0.05, [0.14, 0.14, 0.16]); b(0, y0 + 0.24, 0.03, 0.08, 0.08, 0.02, [0.8, 0.8, 0.84]); for (const [a, c] of [[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]]) b(a, y0 + 0.24 + c, 0.03, 0.05, 0.05, 0.01, [0.3, 0.3, 0.32]); break;
    case 'rio': b(0, y0 + 0.13, 0, 0.025, 0.26, 0.025, [0.4, 0.25, 0.12]); b(0, y0 + 0.3, 0, 0.3, 0.13, 0.04, [0.15, 0.7, 0.45]); b(-0.07, y0 + 0.31, 0.022, 0.06, 0.04, 0.01, [0.05, 0.05, 0.05]); b(0.07, y0 + 0.31, 0.022, 0.06, 0.04, 0.01, [0.05, 0.05, 0.05]); [[-0.09, [0.95, 0.85, 0.2]], [0, [0.9, 0.2, 0.6]], [0.09, [0.95, 0.85, 0.2]]].forEach(([a, c]) => b(a, y0 + 0.45, -0.01, 0.04, 0.18, 0.02, c, null, 0, -a * 3)); break;
    case 'hongkong': { const j = [0.24, 0.66, 0.46]; for (let i = 0; i < 4; i++) b(-0.13 + i * 0.08, y0 + 0.1 + 0.08 * Math.abs(Math.sin(i * 1.3)), 0, 0.09, 0.08, 0.08, j); b(0.2, y0 + 0.24, 0, 0.11, 0.1, 0.1, j); b(0.24, y0 + 0.27, 0.05, 0.02, 0.02, 0.01, [1, 0.1, 0.1], [1, 0.1, 0.1, 1]); break; }
    case 'berlin': b(0, y0 + 0.03, 0, 0.14, 0.06, 0.12, [0.15, 0.15, 0.17]); b(0, y0 + 0.24, 0, 0.34, 0.34, 0.02, gold, [0.95, 0.78, 0.3, 0.15]); b(0, y0 + 0.24, 0.012, 0.12, 0.12, 0.01, [0.08, 0.08, 0.1]); break;
    case 'sydney': { const w = [0.96, 0.95, 0.9]; b(0, y0 + 0.03, 0, 0.36, 0.06, 0.2, [0.7, 0.6, 0.5]); b(-0.1, y0 + 0.17, 0, 0.13, 0.24, 0.02, w, null, 0, 0.5); b(0.02, y0 + 0.2, 0, 0.14, 0.3, 0.02, w, null, 0, 0.45); b(0.13, y0 + 0.15, 0, 0.11, 0.2, 0.02, w, null, 0, 0.55); break; }
    case 'istanbul': { const c = [0.9, 0.85, 0.72], tl = [0.3, 0.62, 0.62]; b(0, y0 + 0.07, 0, 0.26, 0.14, 0.26, c); b(0, y0 + 0.19, 0, 0.2, 0.1, 0.2, tl); b(0, y0 + 0.27, 0, 0.12, 0.06, 0.12, tl); b(0, y0 + 0.33, 0, 0.02, 0.06, 0.02, gold); for (const [a, e] of [[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.12], [0.15, 0.12]]) b(a, y0 + 0.2, e, 0.03, 0.4, 0.03, c); break; }
    case 'venice': b(0, y0 + 0.13, 0, 0.025, 0.26, 0.025, [0.5, 0.1, 0.12]); b(0, y0 + 0.34, 0, 0.22, 0.2, 0.04, gold, [0.95, 0.78, 0.3, 0.15]); b(0, y0 + 0.25, 0.02, 0.12, 0.06, 0.03, gold); b(-0.05, y0 + 0.38, 0.022, 0.05, 0.03, 0.01, [0.05, 0.05, 0.05]); b(0.05, y0 + 0.38, 0.022, 0.05, 0.03, 0.01, [0.05, 0.05, 0.05]); b(0, y0 + 0.47, 0, 0.18, 0.04, 0.05, [0.6, 0.08, 0.12]); break;
  }
}

const Trophies = {
  award(res) {
    if (!res.success || !['free', 'campaign', 'elusive', 'weekly'].includes(res.mode)) return;
    ensureExtras();
    const id = CITIES[res.C.ci].id, cur = Game.S.trophies[id], order = 'SABCDF';
    const e = { name: res.C.name, title: res.C.title, method: res.stats ? res.stats.method : null, rank: res.rank, date: Progress.dayStr() };
    if (!cur) { Game.S.trophies[id] = e; res.newTrophy = true; }
    else if (order.indexOf(res.rank) < order.indexOf(cur.rank)) { Game.S.trophies[id] = e; res.newTrophy = 'up'; }
    Game.S.prog.career.trophies = Object.keys(Game.S.trophies).length;
    Progress.checkAch(); Game.save();
  }
};

/* hideout: the burnt safehouse, the List wall, the stray's bed */
(function () {
  const bh = buildHideout;
  buildHideout = function (tier) {
    const M = bh(tier), w = M.world, y = 3, rng = RNG(901 + tier);
    w.cutMode = 1;
    const soot = [B.ASPHALT, B.METAL_D || B.ASPHALT];
    if (tier <= 1) {
      const n = tier === 0 ? 70 : 26;
      for (let i = 0; i < n; i++) {
        const side = rng.int(0, 3), h = rng.int(0, 3);
        if (side === 0) w.set(rng.int(13, 26), y + h, 10, rng.pick(soot));
        else if (side === 1) w.set(rng.int(13, 26), y + h, 23, rng.pick(soot));
        else if (side === 2) w.set(12, y + h, rng.int(11, 22), rng.pick(soot));
        else w.set(27, y + h, rng.int(11, 22), rng.pick(soot));
      }
      w.cutMode = 0;
      const fl = tier === 0 ? 40 : 14;
      for (let i = 0; i < fl; i++) w.set(rng.int(13, 26), y - 1, rng.int(11, 22), B.ASPHALT);
      if (tier === 0) {
        for (const [x, z] of [[13, 13], [13, 14], [14, 13], [26, 15], [25, 15], [17, 12], [21, 20]]) w.set(x, y, z, rng.pick([B.CONCRETE, B.ASPHALT, B.WOOD_D]));
        for (const x of [14, 15, 23, 24]) w.set(x, y + 2, 23, B.WOOD);
        M.lights.length = 0; M.lights.push({ x: 19.5, y: y + 2.4, z: 16.5, r: 11, c: [1.1, 0.6, 0.3] }, { x: 19, y: y + 2.5, z: 21.5, r: 6, c: [1.0, 0.55, 0.25] });
      }
    }
    w.cutMode = 0;
    M.props.push({ type: 'station', st: 'trophies', p: [19.0, y, 21.6], name: 'The List' });
    M.props.push({ type: 'station', st: 'pet', p: [14.4, y, 19.4], name: 'The Stray\'s Bed' });
    M.lights.push({ x: 19, y: y + 3.2, z: 21.4, r: 5, c: [1.0, 0.7, 0.45] });
    M.env = Object.assign({}, M.env, { fog: [0.12, 0.08, 0.06] });
    return M;
  };
  const ds0 = drawStation;
  const ds = function (pr, t, hl) {
    if (!pr.rot) return ds0(pr, t, hl);
    const [x, y, z] = pr.p, K = M4.mul(M4.T(x, y, z), M4.mul(M4.RY(pr.rot), M4.T(-x, -y, -z)));
    const ob = Engine.box, oo = Engine.outline;
    Engine.box = function (m, ...a) { return ob.call(Engine, M4.mul(K, m), ...a); };
    Engine.outline = function (m, ...a) { return oo.call(Engine, M4.mul(K, m), ...a); };
    try { return ds0(pr, t, hl); } finally { Engine.box = ob; Engine.outline = oo; }
  };
  drawStation = function (pr, t, hl) {
    if (pr.st !== 'trophies' && pr.st !== 'pet') return ds(pr, t, hl);
    const [x, y, z] = pr.p, hc = [1, 0.6, 0.3], ow = 0.04 + 0.012 * Math.sin(t * 4);
    const bx = (ox, oy, oz, sx, sy, sz, col, e, rz) => { let m = M4.T(x + ox, y + oy, z + oz); if (rz) m = M4.mul(m, M4.RZ(rz)); Engine.box(M4.mul(m, M4.S(sx, sy, sz)), col, e || null); if (hl && !e && !rz) Engine.outline(M4.mul(M4.T(x + ox, y + oy, z + oz), M4.S(sx + ow * 2, sy + ow * 2, sz + ow * 2)), hc, 0.9); };
    if (pr.st === 'pet') {
      bx(0, 0.06, 0, 1.1, 0.12, 0.8, [0.36, 0.3, 0.24]); bx(0, 0.14, 0, 0.9, 0.06, 0.6, [0.5, 0.42, 0.33]);
      bx(0.42, 0.06, 0.48, 0.24, 0.1, 0.18, [0.6, 0.6, 0.62]); return;
    }
    // cork board with the fifteen names
    const zb = 1.3, P = Game.S.prog || {}, done = P.campaign || 0;
    bx(0, 2.15, zb, 4.6, 2.5, 0.06, [0.5, 0.36, 0.22]);
    bx(0, 2.15, zb + 0.02, 4.75, 2.65, 0.04, [0.2, 0.13, 0.08]);
    const pos = i => { const row = Math.floor(i / 5), col = i % 5; return [x - 1.8 + col * 0.9 + (row % 2 ? 0.18 : 0), y + 3.05 - row * 0.85, z + zb - 0.05]; };
    for (let i = 0; i < 14; i++) {
      if (i + 1 > done + 1) break;
      const a = pos(i), b = pos(i + 1), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      Engine.box(M4.mul(M4.T((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[2] - 0.01), M4.mul(M4.RZ(Math.atan2(dy, dx)), M4.S(L, 0.02, 0.01))), [0.75, 0.1, 0.08]);
    }
    CAMPAIGN.forEach((ch, i) => {
      const p = pos(i), known = i <= done, crossed = i < done;
      Engine.box(M4.mul(M4.T(p[0], p[1], p[2]), M4.S(0.5, 0.6, 0.01)), known ? [0.92, 0.9, 0.85] : [0.3, 0.27, 0.24]);
      if (known) {
        const sk = SKINS[(i * 3) % SKINS.length];
        Engine.box(M4.mul(M4.T(p[0], p[1] + 0.06, p[2] - 0.006), M4.S(0.26, 0.28, 0.01)), sk);
        Engine.box(M4.mul(M4.T(p[0], p[1] + 0.2, p[2] - 0.008), M4.S(0.28, 0.08, 0.01)), HAIR_COLS[i % 6]);
        Engine.box(M4.mul(M4.T(p[0], p[1] - 0.2, p[2] - 0.008), M4.S(0.42, 0.12, 0.01)), [0.25, 0.23, 0.22]);
      }
      Engine.box(M4.mul(M4.T(p[0], p[1] + 0.3, p[2] - 0.012), M4.S(0.06, 0.06, 0.02)), [0.85, 0.15, 0.1]);
      if (crossed) for (const r of [0.86, -0.86]) Engine.box(M4.mul(M4.T(p[0], p[1], p[2] - 0.02), M4.mul(M4.RZ(r), M4.S(0.72, 0.06, 0.01))), [1, 0.4, 0.08], [1, 0.4, 0.08, 0.55 + 0.15 * Math.sin(t * 3 + i)]);
    });
    // a child's drawing pinned in the corner
    bx(2.0, 1.25, zb - 0.04, 0.42, 0.32, 0.01, [0.97, 0.97, 0.95], [0.97, 0.97, 0.95, 0.05], 0.08);
    Engine.box(M4.mul(M4.T(x + 2.08, y + 1.32, z + zb - 0.05), M4.S(0.08, 0.08, 0.01)), [1, 0.85, 0.1]);
    Engine.box(M4.mul(M4.T(x + 1.95, y + 1.18, z + zb - 0.05), M4.S(0.16, 0.12, 0.01)), [0.85, 0.2, 0.15]);
    for (const [ox, h] of [[-0.12, 0.12], [-0.06, 0.09], [0.0, 0.07]]) Engine.box(M4.mul(M4.T(x + 1.88 + ox * 1.5, y + 1.14 + h / 2, z + zb - 0.05), M4.S(0.025, h, 0.01)), [0.15, 0.3, 0.75]);
  };
})();

/* strays: they find you, you don't buy them */
const PETS = [
  { id: 'dog', name: 'Stray Mutt', cols: [[0.42, 0.3, 0.2], [0.12, 0.09, 0.07], [0.75, 0.68, 0.55]], cn: ['Brown', 'Black', 'Sandy'], snd: 'bark', say: 'WOOF', unlock: S => (S.prog.campaign || 0) >= 1, how: 'Waits by the burnt house after the first name is crossed off' },
  { id: 'cat', name: 'Alley Cat', cols: [[0.13, 0.13, 0.15], [0.86, 0.52, 0.22], [0.5, 0.5, 0.54]], cn: ['Black', 'Ginger', 'Grey'], snd: 'meow', say: 'MRRP', unlock: S => S.lv.hide >= 1, how: 'Moves in once the safehouse is patched up' },
  { id: 'raven', name: 'Raven', cols: [[0.08, 0.08, 0.11], [0.9, 0.9, 0.92]], cn: ['Black', 'Pale'], snd: 'caw', say: 'CAW', unlock: S => (S.prog.campaign || 0) >= 10, how: 'Starts watching from the window at the end of Act II' },
  { id: 'fox', name: 'Fox', cols: [[0.86, 0.4, 0.12], [0.85, 0.86, 0.9]], cn: ['Red', 'Pale'], snd: 'yip', say: 'YIP', unlock: S => S.lv.hide >= 3, how: 'Comes in from the cold once the safehouse is fortified' }
];
const PET_NAMES = ['Lucky', 'Scrap', 'Smoke', 'Ash', 'Ember', 'Cinder', 'Bones', 'Ghost', 'Soot', 'Rook', 'Patch', 'Biscuit'];

function drawPet(e, t) {
  const def = PETS.find(p => p.id === e.type) || PETS[0];
  const ci = (Game.S.pets.col && Game.S.pets.col[e.type]) || 0, col = def.cols[ci] || def.cols[0];
  const dark = [col[0] * 0.6, col[1] * 0.6, col[2] * 0.6], lite = [Math.min(1, col[0] + 0.35), Math.min(1, col[1] + 0.35), Math.min(1, col[2] + 0.35)];
  const hop = e.hop > 0 ? Math.sin((e.hop / 0.5) * Math.PI) * 0.35 : 0;
  const fly = e.type === 'raven' && e.moving ? 0.55 + Math.sin(t * 3) * 0.08 : 0;
  const base = M4.mul(M4.T(e.x, e.y + hop + fly, e.z), M4.RY(e.face));
  const b = (ox, oy, oz, sx, sy, sz, c, em, rx, rz) => { let m = M4.mul(base, M4.T(ox, oy, oz)); if (rx) m = M4.mul(m, M4.RX(rx)); if (rz) m = M4.mul(m, M4.RZ(rz)); Engine.box(M4.mul(m, M4.S(sx, sy, sz)), c, em || null); };
  const ph = e.phase || 0, walk = e.moving, sw = walk ? Math.sin(ph) * 0.05 : 0, st = e.state;
  const sleep = st === 'sleep' && !walk, sit = st === 'sit' && !walk;
  if (e.type === 'raven') {
    const flap = walk ? Math.sin(t * 22) * 0.9 : 0.1;
    b(0, 0.17, 0, 0.16, 0.14, 0.28, col); b(0, 0.27, 0.14, 0.12, 0.12, 0.12, col); b(0, 0.26, 0.23, 0.04, 0.03, 0.08, [0.25, 0.25, 0.27]);
    b(-0.035, 0.29, 0.2, 0.025, 0.025, 0.01, [0.9, 0.7, 0.2], [0.9, 0.7, 0.2, 0.6]); b(0.035, 0.29, 0.2, 0.025, 0.025, 0.01, [0.9, 0.7, 0.2], [0.9, 0.7, 0.2, 0.6]);
    b(-0.1, 0.2, 0, 0.03, 0.1, 0.24, dark, null, 0, flap); b(0.1, 0.2, 0, 0.03, 0.1, 0.24, dark, null, 0, -flap);
    b(0, 0.15, -0.2, 0.1, 0.02, 0.14, dark);
    if (!walk) { b(-0.04, 0.05, 0.02, 0.02, 0.1, 0.02, [0.2, 0.2, 0.2]); b(0.04, 0.05, 0.02, 0.02, 0.1, 0.02, [0.2, 0.2, 0.2]); }
    return;
  }
  const big = e.type === 'dog' ? 1.35 : e.type === 'fox' ? 1.1 : 1;
  const L = 0.18 * big, by = sleep ? 0.1 * big : L + 0.08 * big;
  if (!sleep) {
    for (const [lx, lz, p] of [[-0.07, 0.15, 0], [0.07, 0.15, Math.PI], [-0.07, -0.15, Math.PI], [0.07, -0.15, 0]]) {
      if (sit && lz < 0) continue;
      const s2 = walk ? Math.sin(ph + p) * 0.05 : 0;
      b(lx * big, L / 2 + Math.max(0, s2) * 0.4, lz * big + s2, 0.06 * big, L, 0.06 * big, e.type === 'fox' ? dark : col);
    }
  }
  const tilt = sit ? -0.5 : 0;
  b(0, sit ? by - 0.02 : by, sit ? -0.04 : 0, 0.2 * big, 0.17 * big, (e.type === 'dog' ? 0.5 : 0.42) * big, col, null, tilt);
  if (e.type === 'dog' || e.type === 'cat') b(0, by - 0.06 * big, 0.04, 0.14 * big, 0.06, 0.25 * big, e.type === 'dog' && ci === 0 ? [0.55, 0.32, 0.16] : lite);
  const hy = sleep ? 0.13 * big : by + (sit ? 0.2 : 0.13) * big, hz = (sleep ? 0.22 : 0.25) * big;
  b(0, hy, hz, 0.2 * big, 0.18 * big, 0.18 * big, col);
  if (e.type !== 'cat') b(0, hy - 0.04 * big, hz + 0.13 * big, 0.1 * big, 0.08 * big, 0.12 * big, e.type === 'fox' ? lite : col);
  b(0, hy - 0.02 * big, hz + (e.type === 'cat' ? 0.095 : 0.19) * big, 0.04, 0.03, 0.02, [0.08, 0.06, 0.06]);
  const ear = e.type === 'fox' ? 0.11 : 0.07;
  b(-0.06 * big, hy + 0.12 * big, hz - 0.02, 0.05 * big, ear * big, 0.04 * big, e.type === 'fox' ? dark : col);
  b(0.06 * big, hy + 0.12 * big, hz - 0.02, 0.05 * big, ear * big, 0.04 * big, e.type === 'fox' ? dark : col);
  if (!sleep) { const ec = e.type === 'cat' ? [0.4, 0.9, 0.3] : [0.15, 0.1, 0.05]; b(-0.05 * big, hy + 0.03, hz + 0.092 * big, 0.035, 0.03, 0.01, ec, e.type === 'cat' ? [0.4, 0.9, 0.3, 0.5] : null); b(0.05 * big, hy + 0.03, hz + 0.092 * big, 0.035, 0.03, 0.01, ec, e.type === 'cat' ? [0.4, 0.9, 0.3, 0.5] : null); }
  const wag = (e.type === 'dog' ? Math.sin(t * (walk || e.hop > 0 ? 18 : 6)) * 0.4 : Math.sin(t * 2) * 0.25);
  const tl = e.type === 'fox' ? 0.36 : e.type === 'dog' ? 0.16 : 0.28, tw = e.type === 'fox' ? 0.12 : 0.05;
  let m = M4.mul(base, M4.T(0, by + 0.04, -0.22 * big)); m = M4.mul(m, M4.RY(wag)); m = M4.mul(m, M4.RX(sleep ? 0.0 : -0.75));
  Engine.box(M4.mul(m, M4.mul(M4.T(0, 0, -tl / 2 * big), M4.S(tw * big, tw * big, tl * big))), col);
  if (e.type === 'fox') Engine.box(M4.mul(m, M4.mul(M4.T(0, 0, -tl * big - 0.04), M4.S(tw * big * 0.9, tw * big * 0.9, 0.1))), [0.95, 0.95, 0.95]);
  void sw;
}

const Pets = {
  update(dt) {
    ensureExtras();
    const SP = Game.S.pets, G = Game;
    if (!SP.active || !G.M || !G.M.hideout) { G.pet = null; return; }
    let e = G.pet;
    if (!e || e.type !== SP.active) e = G.pet = { type: SP.active, x: 15.5, y: 3, z: 19.6, face: Math.PI, path: null, pi: 0, moving: false, phase: 0, state: 'idle', idleT: 0, hop: 0, rt: 0 };
    const P = G.P; if (!P) return;
    e.hop = Math.max(0, e.hop - dt); e.rt -= dt;
    const d = Math.hypot(P.x - e.x, P.z - e.z);
    const busy = !!document.querySelector('#sheet:not(.hidden)');
    if ((P.moving && d > 2.4) || d > 4.8) {
      e.idleT = 0;
      if (e.rt <= 0) {
        e.rt = 0.7;
        const gx = Math.floor(P.x - Math.sin(P.face) * 1.3), gz = Math.floor(P.z - Math.cos(P.face) * 1.3);
        const goal = G.W.walkable(gx, 3, gz) ? [gx, 3, gz] : G.cellOf(P);
        G.findPath(e, goal, true);
      }
    } else if (!e.path || e.pi >= e.path.length) {
      e.idleT += dt;
      if (!busy && e.idleT > 8 && e.idleT - dt <= 8 && Math.random() < 0.6) {
        for (let k = 0; k < 8; k++) { const x = Math.floor(e.x + (Math.random() - 0.5) * 6), z = Math.floor(e.z + (Math.random() - 0.5) * 6); if (G.W.walkable(x, 3, z)) { G.findPath(e, [x, 3, z], true); break; } }
      }
      if (e.idleT > 30 && e.idleT - dt <= 30) G.findPath(e, [14, 3, 20], true);
    }
    const sp = e.type === 'dog' ? 3.4 : e.type === 'raven' ? 3.6 : 3.0;
    G.stepPath(e, dt, d > 6 ? sp * 1.6 : sp);
    if (e.moving) { e.phase += dt * 13; e.state = 'walk'; }
    else e.state = e.idleT > 28 ? 'sleep' : e.idleT > 5 ? 'sit' : 'idle';
    if (!e.moving && e.state !== 'sleep' && d < 4) e.face = lerpAng(e.face, Math.atan2(P.x - e.x, P.z - e.z), Math.min(1, dt * 3));
  },
  draw(t) { if (Game.pet) drawPet(Game.pet, t); },
  hit(r) {
    const e = Game.pet; if (!e) return false;
    const tt = rayAABB(r.o, r.d, [e.x - 0.45, e.y, e.z - 0.45], [e.x + 0.45, e.y + 0.9, e.z + 0.45]);
    if (tt < 0) return false;
    this.pet();
    return true;
  },
  pet() {
    const e = Game.pet; if (!e) return;
    const def = PETS.find(p => p.id === e.type);
    e.hop = 0.5; e.idleT = 0; Sfx.play(def.snd);
    UI.popup([e.x, e.y + 1.0, e.z], def.say, 'grey');
    UI.toast(`${Game.S.pets.name} leans against your leg`);
  }
};

/* pet and rifle sounds */
(function () {
  const pl = Sfx.play.bind(Sfx);
  Sfx.play = function (name) {
    if (!this.ctx || !this.on.sfx) return pl(name);
    const t = this.ctx.currentTime;
    switch (name) {
      case 'meow': this.tone(620, 0.35, 'sawtooth', 0.04, t, 900); this.tone(900, 0.25, 'sine', 0.05, t + 0.15, 500); return;
      case 'bark': this.noise(0.09, 0.25, 700, 2, t, 'bandpass'); this.tone(260, 0.1, 'sawtooth', 0.12, t, 160); this.noise(0.09, 0.22, 700, 2, t + 0.18, 'bandpass'); this.tone(240, 0.1, 'sawtooth', 0.1, t + 0.18, 150); return;
      case 'yip': this.tone(1100, 0.12, 'sawtooth', 0.05, t, 1500); this.tone(1200, 0.12, 'sawtooth', 0.05, t + 0.15, 1700); return;
      case 'caw': this.noise(0.3, 0.2, 1400, 3, t, 'bandpass'); this.tone(500, 0.3, 'sawtooth', 0.07, t, 380); return;
    }
    return pl(name);
  };
})();

/* =========================================================
   UI: records, trophy wall, pets, sniper tab & briefing
   ========================================================= */
Object.assign(UI, {
  records(tab) {
    ensureExtras();
    tab = tab || this._rtab || 'contracts'; this._rtab = tab;
    const wrap = el('div'), S = Game.S;
    const tabs = el('div', 'tabs');
    for (const [k, n] of [['contracts', 'Contracts'], ['sniper', 'Sniper']]) { const b = el('button', 'tab' + (k === tab ? ' on' : ''), n); b.onclick = () => this.records(k); tabs.appendChild(b); }
    wrap.appendChild(tabs);
    const pre = tab === 'sniper' ? 'sn:' : '';
    const reps = Records.all();
    wrap.appendChild(el('div', 'rec-tot', `<span>{i:podium} CAREER SCORE</span><b>${Records.totals(pre).toLocaleString()}</b><small>Sum of your best score in every city. Beat your own records to climb.</small>`));
    const list = el('div', 'rec-list');
    CITIES.forEach((c, i) => {
      const L = S.records[pre + c.id] || [], best = L[0];
      const d = el('div', 'rec-row' + (best ? '' : ' empty'));
      d.innerHTML = `<div class="rr-n">${String(i + 1).padStart(2, '0')}</div><div class="rr-c"><b>${c.name}</b><span>${best ? `${fmtTime(best.time)} · ${DIFFS[best.diff] ? DIFFS[best.diff].name : ''} · ${best.date}` : 'No record yet'}</span></div>${best ? `<div class="rank sm r-${best.rank}">${best.rank}</div><div class="rr-s">${best.score.toLocaleString()}</div>` : '<div class="rr-s dim">—</div>'}${reps[pre + c.id] ? '<div class="rr-r">{i:film}</div>' : ''}`;
      if (best) d.onclick = () => this.recordDetail(pre, i);
      list.appendChild(d);
    });
    wrap.appendChild(list);
    this.openSheet('Records', wrap, { wide: true });
  },
  recordDetail(pre, ci) {
    const c = CITIES[ci], L = Game.S.records[pre + c.id] || [], wrap = el('div');
    const back = el('button', 'btn sm', '{i:arrow} Back'); back.onclick = () => this.records(); wrap.appendChild(back);
    wrap.appendChild(el('div', 'sec', `${c.name} · ${pre ? 'Sniper' : 'Contracts'} · Top ${L.length}`));
    const tb = el('div', 'rec-list');
    L.forEach((e, i) => tb.appendChild(el('div', 'rec-row', `<div class="rr-n">#${i + 1}</div><div class="rr-c"><b>${e.score.toLocaleString()}</b><span>${fmtTime(e.time)} · ${DIFFS[e.diff] ? DIFFS[e.diff].name : ''} · ${e.mode || ''} · ${e.date}</span></div><div class="rank sm r-${e.rank}">${e.rank}</div>`)));
    wrap.appendChild(tb);
    const rec = !pre && Records.load(c.id);
    if (rec) { const b = el('button', 'btn primary big', '{i:film} Watch Best Run'); b.style.width = '100%'; b.onclick = () => { this.closeSheet(); Replay.play(rec, () => this.records()); }; wrap.appendChild(b); }
    else if (!pre) wrap.appendChild(el('p', 'hint', 'Set a new personal best here to save a replay of the run.'));
    this.openSheet('Records', wrap, { wide: true });
  },
  trophies(tab) {
    ensureExtras();
    tab = tab || 'list';
    const P = Game.S.prog, done = P.campaign || 0, wrap = el('div');
    const tabs = el('div', 'tabs');
    for (const [k, n] of [['list', 'The List'], ['evidence', 'Evidence'], ['keep', 'Keepsakes']]) { const b = el('button', 'tab' + (k === tab ? ' on' : ''), n); b.onclick = () => this.trophies(k); tabs.appendChild(b); }
    wrap.appendChild(tabs);
    if (tab === 'list') {
      wrap.appendChild(el('p', 'hint', `${done} of 15 crossed off. Each name only appears once the one before it gives it up.`));
      const g = el('div', 'troph');
      CAMPAIGN.forEach((ch, i) => {
        const known = i <= done, crossed = i < done;
        const nm = ch.iris && P.irisChoice === 'spare' ? 'Kessler' : ch.name;
        g.appendChild(el('div', 'tro' + (crossed ? ' crossed' : known ? ' cur' : ' locked'), known ? `<b>${nm}</b><span>${ch.role}</span><small>${ch.title}</small><small>${CITIES[ch.ci].name} · ${CITIES[ch.ci].venue}</small>${crossed ? '<i class="xmark">{i:x}</i>' : ''}` : `<b>???</b><span>Name ${String(i + 1).padStart(2, '0')}</span><small>Not found yet</small>`));
      });
      wrap.appendChild(g);
    } else if (tab === 'evidence') {
      const T = Game.S.trophies;
      wrap.appendChild(el('p', 'hint', 'Something taken from every job you finish: proof for the wall. Its border shows your best rank there.'));
      const g = el('div', 'troph');
      CITIES.forEach(c => {
        const e = T[c.id];
        g.appendChild(el('div', 'tro' + (e ? ' r-' + e.rank : ' locked'), e ? `<b>${EVIDENCE_NAMES[c.id]}</b><span>${c.venue}</span><small>${e.name || ''}${e.title ? ' · ' + e.title : ''}</small><small>${e.date || ''}</small><i class="rank sm r-${e.rank}">${e.rank}</i>` : `<b>???</b><span>${c.venue}</span><small>Finish a job here</small>`));
      });
      wrap.appendChild(g);
    } else {
      wrap.appendChild(el('p', 'hint', 'What the fire didn\'t take.'));
      const vm = el('div', 'keep');
      vm.innerHTML = `<div class="kp-i">{i:speaker}</div><div><b>Saved voicemail</b><span>Clare · the day before</span></div>`;
      const pb = el('button', 'btn sm', '{i:play} Play'); pb.onclick = () => this.voicemail(); vm.appendChild(pb);
      wrap.appendChild(vm);
      const kp = (icon, name, sub, ok, how) => wrap.appendChild(el('div', 'keep' + (ok ? '' : ' locked'), `<div class="kp-i">{i:${icon}}</div><div><b>${ok ? name : '???'}</b><span>${ok ? sub : how}</span></div>`));
      kp('clock', 'Dad\'s Watch', 'Wear it from the Wardrobe, Accessories tab', done >= 1, 'Cross off the first name');
      kp('book', 'Ellie\'s Drawing', 'Pinned to the corner of the List', true, '');
      kp('key', 'Michael\'s Keys', 'He never got to give you the spare', done >= 3, 'Cross off three names');
      kp('heart', 'Wedding Ring', 'You still wear it', done >= 5, 'Finish Act I');
    }
    this.openSheet('The List', wrap, { wide: true });
  },
  voicemail() {
    Sfx.play('tick'); setTimeout(() => Sfx.play('tick'), 160);
    const lines = ['Hi love, it\'s me.', 'Ellie wants to know if you\'re back in time for her school play on Saturday. She\'s a tree. She\'s very serious about it.', 'Noah\'s drawn you again. You\'ve got a cape this time.', 'Call me when you land. We love you. Bye. Bye.'];
    const wrap = el('div', 'vm');
    wrap.appendChild(el('div', 'vm-h', '{i:speaker} 1 SAVED MESSAGE'));
    const tx = el('div', 'vm-t'); wrap.appendChild(tx);
    let i = 0; const step = () => { if (i >= lines.length || !document.body.contains(tx)) return; tx.insertAdjacentHTML('beforeend', `<p>${lines[i++]}</p>`); Sfx.play('tick'); setTimeout(step, 1700); };
    setTimeout(step, 500);
    const back = el('button', 'btn sm', '{i:arrow} Back'); back.onclick = () => this.trophies('keep');
    this.openSheet('Voicemail', wrap, { foot: back, money: false });
  },
  petShop() {
    ensureExtras();
    const SP = Game.S.pets, wrap = el('div');
    if (SP.active) {
      const card = el('div', 'pet-card');
      card.innerHTML = `<div class="pc-i">{i:paw}</div><div><b>${SP.name}</b><span>${PETS.find(p => p.id === SP.active).name}</span></div>`;
      const petB = el('button', 'btn sm', '{i:heart} Pet'); petB.onclick = () => Pets.pet(); card.appendChild(petB);
      wrap.appendChild(card);
      const nm = el('div', 'row'); nm.appendChild(el('div', 'row-l', 'Name'));
      const ch = el('div', 'chips');
      PET_NAMES.forEach(n => { const b = el('button', 'chip' + (SP.name === n ? ' on' : ''), n); b.onclick = () => { SP.name = n; Game.save(); this.petShop(); }; ch.appendChild(b); });
      nm.appendChild(ch); wrap.appendChild(nm);
      const def = PETS.find(p => p.id === SP.active);
      const cr = el('div', 'row'); cr.appendChild(el('div', 'row-l', 'Coat'));
      const cc = el('div', 'chips');
      def.cols.forEach((c, i) => { const b = el('button', 'sw' + (((SP.col || {})[def.id] || 0) === i ? ' on' : '')); b.style.background = rgb(c); b.title = def.cn[i]; b.onclick = () => { SP.col = SP.col || {}; SP.col[def.id] = i; Game.save(); this.petShop(); }; cc.appendChild(b); });
      cr.appendChild(cc); wrap.appendChild(cr);
    } else wrap.appendChild(el('p', 'hint', 'Nothing here yet but an old blanket and a water bowl. Something will turn up.'));
    wrap.appendChild(el('div', 'sec', 'Strays'));
    const grid = el('div', 'grid');
    PETS.forEach(p => {
      const own = SP.owned[p.id], on = SP.active === p.id;
      const d = el('div', 'item' + (on ? ' on' : '') + (own ? '' : ' locked'), `<div class="it-i">{i:paw}</div><div class="it-n">${own ? p.name : '???'}</div><div class="it-d">${own ? p.cn.join(' · ') : p.how}</div>`);
      if (own) { const b = el('button', 'btn sm', on ? 'With you' : 'Keep close'); b.onclick = () => { if (on) return; SP.active = p.id; Game.pet = null; Game.save(); this.petShop(); }; d.appendChild(b); }
      grid.appendChild(d);
    });
    wrap.appendChild(grid);
    this.openSheet('Strays', wrap);
  },
  sniperTab(body) {
    ensureExtras();
    const SS = Game.S.sniper;
    body.appendChild(el('p', 'hint', 'Sniper Assassin: take a rooftop position across from the venue and eliminate three targets with a rifle. If a target reaches an exit, the contract fails. Bodies that are found send the other targets running.'));
    body.appendChild(el('div', 'sec', 'Rifle'));
    const rg = el('div', 'grid');
    SNIPER_RIFLES.forEach(r => {
      const own = SS.owned.includes(r.id), on = SS.rifle === r.id;
      const d = el('div', 'item' + (on ? ' on' : ''), `<div class="it-i">{i:scope}</div><div class="it-n">${r.name}</div><div class="it-d">${r.zoom}x zoom · ${r.mag} round mag · ${r.silenced ? 'suppressed' : 'loud'}<br>${r.desc}</div>`);
      const b = el('button', 'btn sm' + (own ? '' : ' primary'), on ? 'Equipped' : own ? 'Equip' : money(r.price));
      b.onclick = () => { if (on) return; if (own) { SS.rifle = r.id; Game.save(); this.contracts('sniper'); return; } this.buy(r.price, () => { SS.owned.push(r.id); SS.rifle = r.id; this.toast(r.name + ' unlocked', 'good'); }); this.contracts('sniper'); };
      d.appendChild(b); rg.appendChild(d);
    });
    body.appendChild(rg);
    body.appendChild(el('div', 'sec', 'Locations'));
    const grid = el('div', 'cities');
    CITIES.forEach((c, i) => {
      const un = Game.cityUnlocked(i), best = SS.best[c.id];
      const d = el('div', 'city' + (un ? '' : ' locked') + ' t-' + c.time);
      d.innerHTML = `<div class="city-n">${String(i + 1).padStart(2, '0')} · SNIPER</div><div class="city-name">${c.name}</div><div class="city-v">${un ? c.venue : 'Locked'}</div>${best ? `<div class="rank r-${best}">${best}</div>` : ''}`;
      if (un) d.onclick = () => this.sniperBrief(i);
      grid.appendChild(d);
    });
    body.appendChild(grid);
  },
  sniperBrief(ci) {
    const C = Sniper.contract(ci), city = CITIES[ci], wrap = el('div', 'brief');
    const back = el('button', 'btn sm', '{i:arrow} Back'); back.onclick = () => this.contracts('sniper'); wrap.appendChild(back);
    wrap.appendChild(el('div', 'chap-tag el', 'SNIPER ASSASSIN · 3 TARGETS'));
    wrap.appendChild(el('div', 'b-city', `${city.name}, ${city.country} · ${city.venue}`));
    const tg = el('div', 'sn-tg');
    [{ name: C.name, title: C.title, looks: C.looks, outfit: C.outfit }, C.second, C.third].forEach(t => {
      const d = el('div', 'sn-t'); const cv = el('canvas', 'portrait'); cv.width = 72; cv.height = 72; drawPortrait(cv, t.looks, t.outfit); d.appendChild(cv);
      d.appendChild(el('div', '', `<b>${t.name}</b><span>${t.title}</span>`)); tg.appendChild(d);
    });
    wrap.appendChild(tg);
    const r = Sniper.rifleOf();
    wrap.appendChild(el('div', 'rules', `<div>• Rifle: ${r.name} (${r.zoom}x, ${r.mag} rounds, ${r.ammo} total)</div><div>• Drag to aim, pinch or use the zoom buttons. FLOOR changes which level of the building you can see into.</div><div>• Walls near your crosshair turn see-through and the round goes straight through them.</div><div>• Shoot chandeliers, gas stoves, the pool speaker or signature props for accident kills.</div><div>• ${r.silenced ? 'Suppressed: only people near the impact will notice.' : 'Loud: anyone near the impact will panic. Upgrade to a suppressed rifle.'}</div>`));
    wrap.appendChild(el('p', 'hint', `Fee ${money(C.fee)} · Bonuses for Silent Sniper, accident kills and perfect accuracy.`));
    const go = el('button', 'btn primary big', '{i:scope} Take Position'); go.style.width = '100%';
    go.onclick = () => { this.closeSheet(); this.loading(() => Sniper.start(ci)); };
    wrap.appendChild(go);
    this.openSheet('Sniper Contract', wrap, { wide: true });
  }
});

/* contracts: add the Sniper tab */
(function () {
  const oc = UI.contracts;
  UI.contracts = function (tab) {
    tab = tab || this._ctab || 'campaign';
    const sn = tab === 'sniper';
    oc.call(this, sn ? 'free' : tab);
    this._ctab = tab;
    const body = this.sheet.querySelector('.sh-body'), tabs = body && body.querySelector('.tabs'); if (!tabs) return;
    const b = el('button', 'tab' + (sn ? ' on' : ''), '{i:scope} Sniper'); b.onclick = () => this.contracts('sniper'); tabs.appendChild(b);
    if (sn) {
      tabs.querySelectorAll('.tab').forEach(x => { if (x !== b) x.classList.remove('on'); });
      let n = tabs.nextSibling; while (n) { const nx = n.nextSibling; n.remove(); n = nx; }
      this.sniperTab(tabs.parentNode);
    }
  };
  const os = UI.openStation;
  UI.openStation = function (st, creator) {
    if (st === 'trophies' || st === 'pet') { if (Game.mode !== 'hideout') return; this.prevCam = Object.assign({}, Engine.cam); return st === 'pet' ? this.petShop() : this.trophies(); }
    return os.call(this, st, creator);
  };
  // result screen: outro cutscene, records, replays, trophies
  const sr = UI.showResult;
  UI.showResult = async function (res) {
    if (res.mode === 'campaign' && res.success && !res._cut && res.C && res.C.chapter !== undefined) {
      res._cut = true;
      const ch = res.C.chapter, story = CAMPAIGN[ch], spared = !!(Game.stats && Game.stats.spared);
      if (spared && story.spareLine) res.story = Object.assign({}, res.story, { debrief: story.spareLine });
      const go = () => { Game.mode = 'result'; UI.showResult(res); };
      Cutscene.outro(ch, () => { if (story.flash) Cutscene.flashback(story.flash, go); else go(); }, { spared });
      return;
    }
    if (!res._sub) { res._sub = true; try { Records.submit(res); Trophies.award(res); } catch (e) { console.error(e); } }
    await sr.call(this, res);
    if (res.mode === 'sniper' && res.stats) $('#rStats').innerHTML = `<div class="rstats"><span>{i:clock} ${fmtTime(res.stats.time)}</span><span>{i:bullet} ${res.stats.hits}/${res.stats.shots} hits</span><span>{i:scope} ${Math.round(res.stats.acc * 100)}% accuracy</span><span>{i:coffin} ${res.stats.bodies} found</span><span>{i:burst} ${res.stats.accidents} accidents</span></div>`;
    const ex = $('#rExtra');
    if (res.record) ex.insertAdjacentHTML('beforeend', `<div class="r-rec${res.record.best ? ' best' : ''}"><span>{i:podium} Score <b>${res.record.score.toLocaleString()}</b></span><em>${res.record.best ? (res.record.prev ? 'NEW PERSONAL BEST' : 'FIRST RECORD SET') : `#${res.record.pos} · best ${res.record.prev.toLocaleString()}`}</em></div>`);
    if (res.newTrophy) ex.insertAdjacentHTML('beforeend', `<div class="r-mast">{i:trophy} ${res.newTrophy === 'up' ? 'Evidence upgraded' : 'New evidence'}: ${EVIDENCE_NAMES[CITIES[res.C.ci].id]} — added to the List</div>`);
    if (res.replay && res.replay.n > 2) {
      const b = el('button', 'btn', '{i:film} Watch Replay');
      b.onclick = e => { e.stopPropagation(); $('#result').classList.add('hidden'); Replay.play(res.replay); };
      $('#rBtns').insertBefore(b, $('#rBtns').firstChild);
    }
    if (res.mode === 'sniper') {
      const rt = $('#rRetry'); rt.textContent = res.success ? 'Next Sniper Contract' : 'Retry';
      rt.onclick = e => { e.stopPropagation(); $('#result').classList.add('hidden'); Game.enterHideout(); this._ctab = 'sniper'; this.openStation('contracts'); this.sniperBrief(res.C.ci); };
    }
  };
})();

/* hideout HUD: Records button */
(function () {
  const init = UI.init;
  UI.init = function () {
    init.call(this);
    ensureExtras();
    const sb = $('#bRec'); if (sb) sb.onclick = () => { Sfx.play('click'); this.records(); };
  };
})();

/* achievements for the new systems */
ACHIEVEMENTS.push(
  { id: 'wrath1', icon: '{i:fire}', name: 'Wrath', desc: 'Earn an S rank going loud', stat: 'wrathS', goal: 1, cash: 15000 },
  { id: 'mercy', icon: '{i:hand}', name: 'Mercy', desc: 'Let someone on the list live', stat: 'spared', goal: 1, cash: 10000 },
  { id: 'talk5', icon: '{i:chat}', name: 'Everybody Talks', desc: 'Interrogate 5 people', stat: 'talks', goal: 5, cash: 8000 },
  { id: 'snip1', icon: '{i:scope}', name: 'Long Range', desc: 'Complete a Sniper contract', stat: 'snipers', goal: 1, cash: 10000 },
  { id: 'snip5', icon: '{i:scope}', name: 'Overwatch', desc: 'Complete 5 Sniper contracts', stat: 'snipers', goal: 5, cash: 40000 },
  { id: 'snipS', icon: '{i:bullet}', name: 'One Shot, One Kill', desc: 'Earn an S rank on a Sniper contract', stat: 'sniperS', goal: 1, cash: 25000 },
  { id: 'pet1', icon: '{i:paw}', name: 'Not Alone', desc: 'Take in a stray', stat: 'pets', goal: 1, cash: 5000 },
  { id: 'pet4', icon: '{i:paw}', name: 'Strays Like Us', desc: 'Take in all four strays', stat: 'pets', goal: 4, cash: 30000 },
  { id: 'tro10', icon: '{i:trophy}', name: 'Evidence Locker', desc: 'Collect evidence from 10 different jobs', stat: 'trophies', goal: 10, cash: 30000 },
  { id: 'tro15', icon: '{i:trophy}', name: 'Every Last Thread', desc: 'Collect evidence from all 15 locations', stat: 'trophies', goal: 15, cash: 75000 },
  { id: 'tape', icon: '{i:film}', name: 'Game Tape', desc: 'Watch a replay of one of your runs', stat: 'replays', goal: 1, cash: 3000 }
);

/* =========================================================
   5) STORY-AWARE CONTRACTS, INTERROGATION, KEEPSAKES, WEATHER
   ========================================================= */
(function () {
  const gc = Game.getContract;
  Game.getContract = function (ci, mode, chapter) {
    const C = gc.call(this, ci, mode, chapter);
    if (mode === 'campaign' && C.story) {
      const st = Object.assign({}, C.story), P = this.S.prog || {};
      if (st.iris && P.irisChoice === 'spare') { st.brief = st.spareBrief; st.debrief = st.spareDebrief; }
      if (st.marlowBrief && P.irisChoice === 'kill') { st.brief = st.marlowBrief; st.speaker = 'Arthur Marlow'; st.dspeaker = 'The safehouse'; }
      if (P.irisChoice === 'kill' && CAMPAIGN.indexOf(C.story) >= 13) st.dspeaker = st.dspeaker || 'The safehouse';
      if (st.spare) C.method = 'any';
      C.story = st;
    }
    return C;
  };
  // guards killed (for Wrath), confessions and mercy
  const k = Game.kill;
  Game.kill = function (n, method, byPlayer, via) {
    const was = n.state;
    k.call(this, n, method, byPlayer, via);
    if (was !== 'dead' && n.state === 'dead' && byPlayer !== false && !n.isTarget && GUARDLIKE(n.kind) && this.stats) this.stats.guardKills = (this.stats.guardKills || 0) + 1;
  };
  const of = Game.optionsFor;
  Game.optionsFor = function (e) {
    const opts = of.call(this, e);
    if (e && e.kind && this.mode === 'mission' && this.C.mode !== 'tutorial' && this.C.mode !== 'sniper') {
      const n = e, alive = n.state !== 'dead' && n.state !== 'ko';
      if (alive && !this.P.carrying && !n.questioned) {
        const i = opts.findIndex(o => o.label && o.label.startsWith('Subdue'));
        opts.splice(i >= 0 ? i + 1 : opts.length, 0, { label: n.isTarget ? 'Grab and make them talk' : 'Grab and interrogate', icon: '{i:chat}', fn: () => this.queue(n, 'interrogate') });
      }
      if (n.isTarget && n.state === 'ko' && n.questioned && this.C.story && this.C.story.spare && !this.stats.targetDead) {
        opts.splice(1, 0, { label: 'Let him go', icon: '{i:hand}', hl: true, fn: () => this.queue(n, 'spare') });
      }
    }
    return opts;
  };
  const CONFESS = [
    'It was just a job. Somebody higher up wanted you gone.',
    'They paid double because of who you were. Everybody knew.',
    'I didn\'t know there would be kids. I swear I didn\'t know.',
    'You think I\'m the worst of them? I\'m not even close.',
    'The money came through lawyers. It always does.',
    'Marlow. That\'s the name they whisper. That\'s all I know.'
  ];
  const da = Game.doOption;
  Game.doOption = function (opt, e) {
    if (opt.act === 'interrogate') {
      if (e.state === 'dead' || e.state === 'ko') return;
      const P = this.P; e.state = 'held'; e.path = null;
      { const bx = e.x - Math.sin(e.face) * 0.6, bz = e.z - Math.cos(e.face) * 0.6; if (this.W.walkable(Math.floor(bx), Math.round(e.y), Math.floor(bz))) { P.x = bx; P.z = bz; P.face = e.face; } }
      e.face = Math.atan2(e.x - P.x, e.z - P.z);
      this.startAction(2.6, true, () => {
        e.questioned = true; this.stats.interrogations = (this.stats.interrogations || 0) + 1;
        if (e.isTarget) {
          const line = CONFESS[Math.floor(Math.random() * CONFESS.length)];
          e.say = line; e.sayT = 5; this.stats.confessions = (this.stats.confessions || 0) + 1;
          this.toast('Confession heard', 'good');
          this.knockout(e);
          if (this.C.story && this.C.story.spare) this.toast('Your call: finish it, or let him go');
        } else {
          const t = this.targets.find(x => x.state !== 'dead');
          const stop = t && t.stops ? t.stops[(t.stopI || 0) % t.stops.length] : null;
          e.say = t ? `${t.name.split(' ')[0]}? ${stop && STOP_INFO[stop] ? 'Heading for the ' + (STOP_INFO[stop].name || stop).toLowerCase() : 'Somewhere upstairs'}. Please...` : 'I don\'t know anything!';
          e.sayT = 4;
          this.C.intel = Math.max(this.C.intel || 0, 1);
          if (e.keycard) { e.keycard = false; this.addItem('keycard', 1); this.toast('He hands over his keycard'); }
          this.toast('Target location revealed', 'good');
          this.knockout(e);
        }
        Sfx.play('ko');
      });
      return;
    }
    if (opt.act === 'spare') {
      if (e.state !== 'ko') return;
      this.startAction(1.0, false, () => {
        e.isTarget = false; e.state = 'flee'; e.koT = undefined; e.fleeFrom = [this.P.x, this.P.y, this.P.z]; e.fleeT = 30; e.say = 'Thank you... thank you...';
        this.stats.spared = true; this.stats.targetDead = true; this.stats.method = 'spared';
        UI.killFlash(true, 'spared'); setTimeout(() => UI.killFlash(false), 1800);
        this.toast('You let him live. Get to an exit.', 'big good'); UI.refreshButtons();
      });
      return;
    }
    return da.call(this, opt, e);
  };
})();

/* rain and storms */
const Weather = {
  flash: 0, next: 8,
  draw(t) {
    const M = Game.M; if (!M || !M.env || !M.env.rain) { this.flash = 0; return; }
    const c = Engine.cam, n = Engine.quality === 'lite' ? 70 : Engine.quality === 'low' ? 150 : 300, R = 12, b = M.building;
    const k = M.env.rain;
    for (let i = 0; i < n; i++) {
      const h1 = (Math.sin(i * 12.9898) * 43758.5453) % 1, h2 = (Math.sin(i * 78.233) * 12345.678) % 1, h3 = (Math.sin(i * 39.425) * 24634.6345) % 1;
      const x = c.tx - R + (((Math.abs(h1) * 2 * R - c.tx) % (2 * R)) + 2 * R) % (2 * R) + (c.tx - c.tx % 1) * 0;
      const z = c.tz - R + (((Math.abs(h2) * 2 * R - c.tz) % (2 * R)) + 2 * R) % (2 * R);
      const span = 15, y = c.ty - 3 + (((Math.abs(h3) * span - t * 16 * k) % span) + span) % span;
      if (b && x > b.x0 && x < b.x1 + 1 && z > b.z0 && z < b.z1 + 1 && y < b.top + 1) continue;
      const E = Engine.eye; if (E && (x - E[0]) ** 2 + (y - E[1]) ** 2 + (z - E[2]) ** 2 < 49) continue;
      Engine.box(M4.mul(M4.T(x, y, z), M4.mul(M4.RX(0.12), M4.S(0.06, 0.95, 0.06))), [0.85, 0.9, 1], [0.8, 0.86, 1, 0.7], 0.6);
    }
    if (M.env.lightning) {
      this.next -= 1 / 60;
      if (this.next <= 0) { this.next = 7 + Math.random() * 10; this.flash = 1; setTimeout(() => { if (Sfx.ctx && Sfx.on.sfx) { const tt = Sfx.ctx.currentTime; Sfx.noise(2.2, 0.35, 160, 0.7, tt); Sfx.tone(45, 1.6, 'sine', 0.25, tt, 30); } }, 400 + Math.random() * 900); }
      this.flash = Math.max(0, this.flash - 1 / 60 * 3);
      const f = this.flash > 0.6 ? 1 : this.flash > 0.4 ? 0.2 : this.flash > 0.25 ? 0.7 : 0;
      if (Game.mode !== 'mission') Engine.expoMul = 1;
      Engine.expoMul *= 1 + f * 1.4;
    }
  }
};
(function () {
  const da = Extras.drawActors;
  Extras.drawActors = function (t) { da.call(this, t); try { Weather.draw(t); } catch (e) { } };
  const mf = UI.killFlash;
  UI.killFlash = function (on, method, via) {
    if (on && method === 'spared') { const k = $('#killflash'); k.innerHTML = '<div class="kf-t">SPARED</div><div class="kf-s">MERCY</div>'; k.classList.remove('hidden', 'go'); void k.offsetWidth; k.classList.add('go'); return; }
    return mf.call(this, on, method, via);
  };
})();
/* career counters for the new feats */
(function () {
  const em = Game.endMission;
  Game.endMission = function (success, reason) {
    const S = this.stats, C = this.S.prog && this.S.prog.career;
    if (C && S && this.mode === 'mission') {
      C.talks = (C.talks || 0) + (S.interrogations || 0);
      if (success && S.spared) C.spared = (C.spared || 0) + 1;
    }
    const r = em.call(this, success, reason);
    return r;
  };
  const sr = UI.showResult;
  UI.showResult = async function (res) {
    if (res.wrath && res.rank === 'S' && !res._wr) { res._wr = true; const C = Game.S.prog.career; C.wrathS = (C.wrathS || 0) + 1; Progress.checkAch(); Game.save(); }
    return sr.call(this, res);
  };
})();

/* =========================================================
   FULL MISSION MAP
   ========================================================= */
const BigMap = {
  fi: 0, open() {
    const G = Game; if (G.mode !== 'mission' || !UI.mmFloors) return;
    if (G.C.mode === 'sniper') return;
    const fl = G.M.floors; let fi = 0; for (let k = 0; k < fl.length; k++) if (G.P.y >= fl[k] - 0.5) fi = k;
    this.fi = fi; this.youFi = fi; this.wasPaused = G.paused; G.paused = true;
    $('#bmCity').textContent = `${CITIES[G.C.ci].name.toUpperCase()} · ${CITIES[G.C.ci].venue}`;
    const names = ['GROUND', '1ST', '2ND', '3RD', '4TH', '5TH', '6TH'], fb = $('#bmFloors'); fb.innerHTML = '';
    fl.forEach((y, k) => { const b = el('button', (k === fi ? 'on ' : '') + (k === this.youFi ? 'you' : ''), k === fl.length - 1 ? 'ROOF' : names[k]); b.onclick = e => { e.stopPropagation(); this.fi = k; fb.querySelectorAll('button').forEach((x, j) => x.classList.toggle('on', j === k)); this.draw(); Sfx.play('tick'); }; fb.appendChild(b); });
    $('#bigmap').classList.remove('hidden'); Sfx.play('open');
    const cv = $('#bmCv');
    cv.onpointerup = e => this.tap(e);
    $('#bmClose').onclick = e => { e.stopPropagation(); this.close(); };
    requestAnimationFrame(() => this.draw());
  },
  close() { $('#bigmap').classList.add('hidden'); Game.paused = !!this.wasPaused; Sfx.play('click'); },
  layout() {
    const cv = $('#bmCv'), dpr = Math.min(2, window.devicePixelRatio || 1), r = cv.getBoundingClientRect();
    cv.width = Math.max(10, r.width * dpr); cv.height = Math.max(10, r.height * dpr);
    const W = Game.W, rot = (Math.round((Math.PI - Engine.cam.yaw) / (Math.PI / 2)) % 4 + 4) % 4;
    const bb = this.bounds();
    const bw = bb[2] - bb[0], bh = bb[3] - bb[1], mw = rot % 2 ? bh : bw, mh = rot % 2 ? bw : bh;
    const sc = Math.min(cv.width / mw, cv.height / mh) * 0.96;
    return { cv, dpr, rot, sc, W, ox: cv.width / 2, oy: cv.height / 2, cx: (bb[0] + bb[2]) / 2, cz: (bb[1] + bb[3]) / 2 };
  },
  bounds() {
    if (this._bbM === Game.M) return this._bb;
    const c = UI.mmFloors[0], d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, z0 = c.height, x1 = 0, z1 = 0;
    for (let z = 0; z < c.height; z++) for (let x = 0; x < c.width; x++) if (d[(z * c.width + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    this._bbM = Game.M; this._bb = x1 > x0 ? [x0 - 2, z0 - 2, x1 + 3, z1 + 3] : [0, 0, c.width, c.height];
    return this._bb;
  },
  xf(L, ctx) { ctx.translate(L.ox, L.oy); ctx.rotate(L.rot * Math.PI / 2); ctx.scale(L.sc, L.sc); ctx.translate(-L.cx, -L.cz); },
  draw() {
    const G = Game, L = this.layout(), ctx = L.cv.getContext('2d'), fl = G.M.floors, fy = fl[this.fi];
    this.L = L;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, L.cv.width, L.cv.height);
    ctx.save(); this.xf(L, ctx); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(UI.mmFloors[this.fi], 0, 0);
    const onF = y => Math.abs(y - fy) < 2;
    const dot = (x, z, r, c, ring) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, z, r, 0, 7); ctx.fill(); if (ring) { ctx.strokeStyle = ring; ctx.lineWidth = 0.35; ctx.stroke(); } };
    // locked doors
    for (const d of G.doors || []) if (onF(d.y)) for (const [x, z] of d.cells) { ctx.fillStyle = d.locked ? '#f66' : '#8a8f96'; ctx.fillRect(x, z, 1, 1); }
    // props of interest
    for (const pr of G.props) {
      if (pr.gone || !onF(pr.p[1])) continue;
      if (pr.type === 'exit') { ctx.fillStyle = G.stats.targetDead ? '#3f6' : '#2a7a4a'; ctx.fillRect(pr.p[0] - 1.6, pr.p[2] - 1.6, 3.2, 3.2); continue; }
      const cat = typeof propCategory === 'function' ? propCategory(pr) : null;
      if (cat === 'item') dot(pr.p[0] + 0.5, pr.p[2] + 0.5, 0.75, '#f5d142');
      else if (cat === 'disguise') dot(pr.p[0] + 0.5, pr.p[2] + 0.5, 0.75, '#c77dff');
    }
    if (G.C.intel >= 2) for (const pr of G.guideProps()) if (onF(pr.p[1])) dot(pr.p[0] + 0.5, pr.p[2] + 0.5, 1.2, 'rgba(255,200,60,.35)', '#fc3');
    for (const n of G.npcs) {
      if (n.hidden || n.isTarget || !onF(n.y)) continue;
      const dead = n.state === 'dead' || n.state === 'ko';
      dot(n.x, n.z, 0.7, dead ? '#555' : n.state === 'alert' ? '#f33' : GUARDLIKE(n.kind) ? '#6af' : '#ddd');
    }
    const showT = G.C.intel >= 1 || G.targetVisible;
    for (const t of G.targets || []) {
      if (t.state === 'dead') { if (onF(t.y)) dot(t.x, t.z, 1.1, '#654'); continue; }
      if (!showT) continue;
      if (onF(t.y)) dot(t.x, t.z, 1.4, '#ff8a3d', '#000');
      else { ctx.strokeStyle = '#ff8a3d'; ctx.setLineDash([0.6, 0.6]); ctx.lineWidth = 0.35; ctx.beginPath(); ctx.arc(t.x, t.z, 1.6, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    }
    // player
    const P = G.P;
    if (onF(P.y)) {
      ctx.save(); ctx.translate(P.x, P.z); ctx.rotate(-P.face + Math.PI);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 0.3;
      ctx.beginPath(); ctx.moveTo(0, -2.2); ctx.lineTo(1.5, 1.6); ctx.lineTo(0, 0.8); ctx.lineTo(-1.5, 1.6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    if (P.path && P.path.length) {
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 0.3; ctx.setLineDash([0.8, 0.6]); ctx.beginPath(); ctx.moveTo(P.x, P.z);
      for (let k = P.pi || 0; k < P.path.length; k++) { const c = P.path[k]; if (onF(c[1])) ctx.lineTo(c[0] + 0.5, c[2] + 0.5); }
      ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  },
  tap(e) {
    const L = this.L; if (!L) return;
    const r = L.cv.getBoundingClientRect();
    let px = (e.clientX - r.left) * L.dpr - L.ox, py = (e.clientY - r.top) * L.dpr - L.oy;
    const a = -L.rot * Math.PI / 2, rx = px * Math.cos(a) - py * Math.sin(a), ry = px * Math.sin(a) + py * Math.cos(a);
    const wx = rx / L.sc + L.cx, wz = ry / L.sc + L.cz;
    const G = Game, fy = G.M.floors[this.fi];
    let best = null, bd = 9;
    for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
      const x = Math.floor(wx) + dx, z = Math.floor(wz) + dz;
      for (const yy of [fy, fy - 1, fy + 1]) if (G.W.walkable(x, yy, z)) { const d = Math.hypot(x + 0.5 - wx, z + 0.5 - wz); if (d < bd) { bd = d; best = [x, yy, z]; } break; }
    }
    if (!best) { Sfx.play('tick'); return; }
    this.close();
    G.P.run = false;
    if (G.moveTo(best) === false) UI.toast('Can\'t get there from here', 'bad'); else { UI.tapMarker && UI.tapMarker([best[0] + 0.5, best[1], best[2] + 0.5]); Sfx.play('click'); }
  }
};
(function () {
  const init = UI.init;
  UI.init = function () {
    init.call(this);
    const mm = document.querySelector('.mmw');
    if (mm) { mm.style.pointerEvents = 'auto'; mm.addEventListener('click', e => { e.stopPropagation(); BigMap.open(); }); }
    addEventListener('keydown', e => { if ((e.key === 'm' || e.key === 'M') && Game.mode === 'mission') { $('#bigmap').classList.contains('hidden') ? BigMap.open() : BigMap.close(); } });
  };
  const hide = UI.hideAll;
  UI.hideAll = function () { hide.call(this); const b = $('#bigmap'); if (b && !b.classList.contains('hidden')) { b.classList.add('hidden'); Game.paused = false; } };
  addEventListener('resize', () => { if (!$('#bigmap').classList.contains('hidden')) BigMap.draw(); });
})();

'use strict';
/* =========================================================
   THE LIST — Interactive training mission
   ========================================================= */
const Tutorial = {
  active: false, step: 0, t: 0,
  steps: [
    { text: 'You have been out of the game for years. Your body remembers. <b>Tap the ground</b> to walk. Head towards the building.', check: T => Math.hypot(Game.P.x - T.sx, Game.P.z - T.sz) > 6 },
    { text: '<b>Drag with one finger</b> to rotate the camera. <b>Pinch</b> (or scroll) to zoom in and out.', check: T => Math.abs(Engine.cam.yaw - T.yaw0) > 0.8 || Math.abs(Engine.cam.dist - T.dist0) > 5, auto: 14 },
    { text: 'Your target is <b>Victor Lang</b>, marked in red. His card is top-left, the minimap top-right. The plan: <b>poison his drink</b>.', next: true },
    { text: 'Interactive objects get a coloured outline: <b style="color:#4cd9ff">blue</b> = pick up, <b style="color:#5cff73">green</b> = disguise, <b style="color:#ff4757">red</b> = kill opportunity, <b style="color:#c780ff">purple</b> = hide a body. <b>Gold beacons</b> show where to go next.', next: true },
    { text: 'Your own clothes only get you into <b>public</b> areas. Grab the <b>Waiter Uniform</b> from the staff room. Follow the <b>gold beacon</b>. The meter over a guard\'s head shows suspicion.', check: () => Game.P.outfit === 'waiter', beacon: () => Game.props.filter(p => p.type === 'disguise' && p.outfit === 'waiter' && !p.gone) },
    { text: 'Waiters can enter the <b>kitchen</b>. Pick up the <b>Rat Poison</b> (gold beacon). Tap it, then choose <b>Pick up</b>.', check: () => Game.hasItem('poison'), beacon: () => Game.props.filter(p => p.type === 'item' && p.item === 'poison' && !p.gone) },
    { text: 'Tap the <b>poison</b> in your item bar at the bottom to <b>hold</b> it. Actions that use a held item glow gold.', check: () => { const h = Game.heldItem(); return h && h.id === 'poison'; } },
    { text: 'Now tap the <b>cocktail on the bar counter</b> and choose <b>Poison</b>. Don\'t let anyone see you do it.', check: () => { const d = Game.props.find(p => p.stop === 'bar'); return d && d.poison; }, beacon: () => Game.props.filter(p => p.stop === 'bar' && !p.poison) },
    { text: 'Perfect. Lang is coming down for a drink. <b>Stay back and watch.</b>', check: () => Game.stats.targetDead, onStart: () => { const t = Game.target; t.tutHold = false; t.stops = ['bar', 'balcony']; t.stopI = 0; t.atStop = null; t.path = null; } },
    { text: 'Target down! Now <b>escape</b>: walk to a <b>green exit beacon</b>. The Getaway Car is on the street out front.', check: () => false }
  ],
  start() { Game.startMission(TUT_CI, 1, { mode: 'tutorial', start: 'street' }); },
  begin() {
    this.active = true; this.step = 0; this.t = 0; this.pendT = undefined;
    const P = Game.P; this.sx = P.x; this.sz = P.z;
    const t = Game.target; t.tutHold = true;
    for (const n of Game.npcs) if (n.kind === 'bodyguard') { n.hidden = true; n.state = 'dead'; n.found = true; }
    this.enter();
  },
  enter() {
    const s = this.steps[this.step]; this.t = 0;
    this.yaw0 = Engine.cam.yaw; this.dist0 = Engine.cam.dist;
    if (s.onStart) s.onStart();
    this.render();
    Sfx.play('pickup');
  },
  render() {
    const s = this.steps[this.step], e = $('#tut');
    e.innerHTML = `<div class="tu-h"><span>TRAINING ${this.step + 1}/${this.steps.length}</span><button class="tu-skip">Skip</button></div><div class="tu-x">${s.text}</div>${s.next ? '<button class="btn sm primary tu-next">Got it</button>' : ''}`;
    e.classList.remove('hidden'); e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop');
    e.querySelector('.tu-skip').onclick = ev => { ev.stopPropagation(); UI.confirm('Skip the training mission?', () => this.finish(false)); };
    const nx = e.querySelector('.tu-next'); if (nx) nx.onclick = ev => { ev.stopPropagation(); this.advance(); };
  },
  advance() { if (this.step < this.steps.length - 1) { this.step++; this.enter(); } },
  update(dt) {
    if (!this.active || Game.intro) return;
    this.t += dt;
    const s = this.steps[this.step];
    const last = this.steps.length - 1;
    if (Game.stats.targetDead && this.step < last) { this.step = last; this.enter(); return; }
    if (this.pendT !== undefined) { this.pendT -= dt; if (this.pendT <= 0) { this.pendT = undefined; this.advance(); } return; }
    if (s.check && s.check(this)) this.pendT = 0.4;
    else if (s.auto && this.t > s.auto) this.advance();
  },
  beacons() { if (!this.active) return []; const s = this.steps[this.step]; return s && s.beacon ? s.beacon() : []; },
  finish(done) {
    this.active = false; $('#tut').classList.add('hidden');
    Game.S.tutorialDone = true;
    if (!done) { Game.mode = 'hideout'; Game.enterHideout(); Game.save(); return; }
  },
  result() {
    // called from endMission in tutorial mode
    this.active = false; $('#tut').classList.add('hidden');
    const sv = Game.S, first = !sv.tutorialDone;
    sv.tutorialDone = true;
    const pay = first ? 10000 : 0;
    sv.money += pay;
    const res = { success: true, city: CITIES[TUT_CI], C: Game.C, lines: [['Training complete', 0]].concat(first ? [['Graduation bonus', pay]] : []), payout: pay, rank: 'S', xp: first ? 600 : 0, mastery: [], challenges: 0, mode: 'tutorial', sa: false };
    res.xpFrom = { level: sv.prog.level, xp: sv.prog.xp };
    res.ups = Progress.addXP(res.xp);
    Game.save();
    return res;
  }
};

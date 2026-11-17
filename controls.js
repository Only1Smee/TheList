'use strict';
/* =========================================================
   Camera modes (top-down / third person / first person)
   and analogue movement (on-screen stick, WASD)
   ========================================================= */
const VIEW_NAMES = { top: 'Top-down', third: 'Third person', first: 'First person' };
const Controls = {
  view: 'top', yaw: 0, pitch: 0.25, dist: 4.6, cd: 4.6, stk: { id: null, ox: 0, oy: 0, x: 0, y: 0 }, lk: { id: null }, keys: {}, useT: 0, useEnt: null, bob: 0,
  init() {
    const gl = document.getElementById('gl');
    const pad = document.createElement('div'); pad.id = 'lookpad'; pad.className = 'hidden';
    const zone = document.createElement('div'); zone.id = 'stickzone'; zone.className = 'hidden';
    zone.innerHTML = '<div id="stickBase"><div id="stickKnob"></div></div><div class="stk-hint">MOVE</div>';
    gl.after(pad); pad.after(zone);
    const ch = document.createElement('div'); ch.id = 'xhair'; ch.className = 'hidden'; document.body.appendChild(ch);
    const use = document.createElement('button'); use.id = 'useBtn'; use.className = 'hidden'; use.innerHTML = '{i:hand}<b>USE</b><small id="useLbl"></small>'; document.body.appendChild(use);
    use.onclick = e => { e.stopPropagation(); this.use(); };
    // view button in the mission HUD and the hideout
    const rb = document.querySelector('.rbtns');
    if (rb) { const b = document.createElement('button'); b.className = 'rb'; b.id = 'btnView'; b.innerHTML = '{i:eye}<small>VIEW</small>'; b.onclick = e => { e.stopPropagation(); this.cycle(); }; rb.insertBefore(b, rb.firstChild); }
    const sb = document.querySelector('.side-btns');
    if (sb) { const b = document.createElement('button'); b.className = 'sb'; b.id = 'bView'; b.innerHTML = '<b>{i:eye}</b><small>VIEW</small>'; b.onclick = e => { e.stopPropagation(); Sfx.play('click'); this.cycle(); }; sb.appendChild(b); }
    // stick
    zone.addEventListener('pointerdown', e => {
      if (this.stk.id !== null) return;
      e.preventDefault(); zone.setPointerCapture(e.pointerId);
      const S = this.stk; S.id = e.pointerId; S.ox = e.clientX; S.oy = e.clientY; S.x = 0; S.y = 0;
      const b = $('#stickBase'); b.style.left = e.clientX + 'px'; b.style.top = e.clientY + 'px'; b.classList.add('on');
      $('#stickKnob').style.transform = 'translate(-50%,-50%)';
    });
    zone.addEventListener('pointermove', e => {
      const S = this.stk; if (e.pointerId !== S.id) return;
      const R = 52; let dx = e.clientX - S.ox, dy = e.clientY - S.oy; const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      S.x = dx / R; S.y = dy / R;
      $('#stickKnob').style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
    });
    const end = e => { const S = this.stk; if (e.pointerId !== S.id) return; S.id = null; S.x = 0; S.y = 0; $('#stickBase').classList.remove('on'); };
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
    // look pad: drag to look, quick tap to interact, pinch to zoom (third person)
    const pts = new Map();
    pad.addEventListener('pointerdown', e => { pad.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: 0 }); });
    pad.addEventListener('pointermove', e => {
      const p = pts.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; p.moved += Math.abs(dx) + Math.abs(dy);
      if (pts.size === 2) {
        const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this._pd) this.dist = Math.max(2.2, Math.min(9, this.dist * this._pd / d)); this._pd = d; return;
      }
      this.yaw -= dx * 0.0058; this.pitch = Math.max(this.view === 'first' ? -1.1 : 0.02, Math.min(this.view === 'first' ? 1.15 : 1.1, this.pitch + dy * 0.0045));
    });
    const pend = e => {
      const p = pts.get(e.pointerId); if (!p) return; pts.delete(e.pointerId); this._pd = 0;
      if (p.moved < 12 && performance.now() - p.t < 350) Game.onTap(e.clientX, e.clientY);
    };
    pad.addEventListener('pointerup', pend); pad.addEventListener('pointercancel', e => { pts.delete(e.pointerId); this._pd = 0; });
    pad.addEventListener('wheel', e => { e.preventDefault(); this.dist = Math.max(2.2, Math.min(9, this.dist * (e.deltaY > 0 ? 1.1 : 0.9))); }, { passive: false });
    // keyboard
    addEventListener('keydown', e => {
      if (e.target && e.target.tagName === 'INPUT') return;
      const k = e.key.toLowerCase(); this.keys[k] = true;
      if (k === 'v' && (Game.mode === 'mission' || Game.mode === 'hideout')) this.cycle();
      if (k === 'e' && this.useEnt) this.use();
      if (k === 'shift') this.keys.shift = true;
    });
    addEventListener('keyup', e => { this.keys[e.key.toLowerCase()] = false; if (e.key === 'Shift') this.keys.shift = false; });
    addEventListener('blur', () => { this.keys = {}; });
    const st = Game.S && Game.S.settings; if (st && st.view) this.view = st.view;
  },
  stickOn() {
    const st = Game.S.settings;
    return (Game.mode === 'mission' || Game.mode === 'hideout') && !Game.paused && !(Game.mode === 'mission' && Game.C && Game.C.mode === 'sniper') && (this.view !== 'top' || st.stickTop);
  },
  active() {
    const G = Game;
    return (G.mode === 'mission' || G.mode === 'hideout') && this.view !== 'top' && G.P && !G.P.hidden && !G.P.dead && !G.intro && !G.killcam && !(G.mode === 'mission' && G.C && G.C.mode === 'sniper');
  },
  fp() { return this.active() && this.view === 'first'; },
  cycle() { const order = ['top', 'third', 'first']; this.setView(order[(order.indexOf(this.view) + 1) % 3]); UI.toast('Camera: ' + VIEW_NAMES[this.view]); },
  setView(v) {
    const prev = this.view; this.view = v; Game.S.settings.view = v; Game.save();
    const c = Engine.cam;
    if (v !== 'top') { this.yaw = c.yaw; if (prev === 'top') this.pitch = v === 'first' ? 0.12 : 0.3; if (v === 'first') this.pitch = Math.max(-1.1, Math.min(1.15, this.pitch)); else this.pitch = Math.max(0.05, this.pitch); this.cd = 0.5; }
    else { c.fov = 0.75; c.pitch = 0.95; c.dist = 16; Engine.fadeR = Game.M && Game.M.hideout ? 0.11 : 0.15; Game._cv = undefined; }
    this.hud(true);
  },
  hud(force) {
    const on = this.stickOn(), act = this.active();
    $('#stickzone').classList.toggle('hidden', !on);
    $('#lookpad').classList.toggle('hidden', !act);
    $('#xhair').classList.toggle('hidden', !(act && this.view === 'first'));
    if (!act) $('#useBtn').classList.add('hidden');
    const vb = $('#btnView'); if (vb) vb.classList.toggle('on', this.view !== 'top');
  },
  // collision-aware analogue movement
  standY(x, z, yb, fromX, fromZ) {
    const W = Game.W, cx = Math.floor(x), cz = Math.floor(z);
    for (const dy of [0, 1, -1]) {
      const y = yb + dy;
      if (!W.walkable(cx, y, cz)) continue;
      if (dy === 1 && W.solid(Math.floor(fromX), yb + 2, Math.floor(fromZ))) continue;
      if (dy === -1 && W.solid(cx, yb + 1, cz)) continue;
      if (Game.mode === 'mission' && Game.lockedKeys && Game.lockedKeys.has((y * W.D + cz) * W.W + cx)) continue;
      return y;
    }
    return null;
  },
  canGo(x, z, mx, mz, yb) {
    const P = Game.P, r = 0.26;
    const y = this.standY(x, z, yb, P.x, P.z); if (y === null) return null;
    if (mx && this.standY(x + Math.sign(mx) * r, z, yb, P.x, P.z) === null) return null;
    if (mz && this.standY(x, z + Math.sign(mz) * r, yb, P.x, P.z) === null) return null;
    return y;
  },
  move(dt) {
    if (!this.stickOn() && !this.active()) { this.hud(); return; }
    this.hud();
    const P = Game.P; if (!P || P.dead || P.action || P.hidden) return;
    let sx = this.stk.x, sy = this.stk.y;
    const K = this.keys;
    if (K.w || K.arrowup) sy -= 1; if (K.s || K.arrowdown) sy += 1; if (K.a || K.arrowleft) sx -= 1; if (K.d || K.arrowright) sx += 1;
    let m = Math.hypot(sx, sy); if (m < 0.12) { this.wasMoving = false; return; }
    if (m > 1) { sx /= m; sy /= m; m = 1; }
    const yaw = Engine.cam.yaw, mx = Math.cos(yaw) * sx + Math.sin(yaw) * sy, mz = -Math.sin(yaw) * sx + Math.cos(yaw) * sy;
    const running = m > 0.9 || K.shift || P.run;
    const spd = (running ? 4.6 : 3.0) * Math.max(0.45, m) * (P.carrying ? 0.6 : 1), st = spd * dt;
    P.path = null; P.pending = null; P.run = running && (m > 0.9 || K.shift) ? true : P.run;
    const yb = Math.round(P.y);
    let nx = P.x + mx * st, nz = P.z + mz * st, y = this.canGo(nx, nz, mx, mz, yb);
    if (y === null) { y = this.canGo(nx, P.z, mx, 0, yb); if (y !== null) nz = P.z; else { y = this.canGo(P.x, nz, 0, mz, yb); if (y !== null) nx = P.x; } }
    if (y !== null) { P.x = nx; P.z = nz; P.y += (y - P.y) * Math.min(1, dt * 14); if (Math.abs(y - P.y) < 0.02) P.y = y; }
    P.moving = y !== null; if (P.moving) { P.phase += dt * spd * 3.2; this.bob += dt * spd * 2.4; }
    const want = this.view === 'first' ? yaw + Math.PI : Math.atan2(mx, mz);
    P.face = lerpAng(P.face, want, Math.min(1, dt * 12));
    if (P.carrying) { const b = P.carrying; b.x = P.x; b.y = P.y; b.z = P.z; b.face = P.face; }
    this.wasMoving = true;
  },
  camera(dt) {
    const c = Engine.cam, P = Game.P, W = Game.W;
    if (this.view === 'first') {
      const bob = P.moving ? Math.sin(this.bob * 2) * 0.035 : 0;
      const eye = [P.x - Math.sin(P.face) * -0.05, P.y + 1.64 + bob, P.z - Math.cos(P.face) * -0.05];
      const cp = Math.cos(this.pitch), D = 5;
      const f = [-Math.sin(this.yaw) * cp, -Math.sin(this.pitch), -Math.cos(this.yaw) * cp];
      c.fov += (0.98 - c.fov) * Math.min(1, dt * 6);
      c.yaw = this.yaw; c.pitch = this.pitch; c.dist = D;
      c.tx = eye[0] + f[0] * D; c.ty = eye[1] + f[1] * D; c.tz = eye[2] + f[2] * D;
      Engine.fadeTarget = null;
      if (!P.action) P.face = lerpAng(P.face, this.yaw + Math.PI, Math.min(1, dt * 14));
    } else {
      const right = [Math.cos(this.yaw), -Math.sin(this.yaw)];
      const t = [P.x + right[0] * 0.55, P.y + 1.5, P.z + right[1] * 0.55];
      const cp = Math.cos(this.pitch), u = [Math.sin(this.yaw) * cp, Math.sin(this.pitch), Math.cos(this.yaw) * cp];
      let want = this.dist;
      const h = W.raycast(t, u, want + 0.4, 999);
      if (h) want = Math.max(1.0, h.t - 0.35);
      this.cd += (want - this.cd) * Math.min(1, dt * (want < this.cd ? 20 : 5));
      c.fov += (0.8 - c.fov) * Math.min(1, dt * 6);
      const k = Math.min(1, dt * 16);
      c.tx += (t[0] - c.tx) * k; c.ty += (t[1] - c.ty) * k; c.tz += (t[2] - c.tz) * k;
      c.yaw = this.yaw; c.pitch = this.pitch; c.dist = this.cd;
      Engine.fadeTarget = [P.x, P.y, P.z]; Engine.fadeR = 0.1;
    }
    Engine.cut = Game.cutY = 999;
    this.useT -= dt; if (this.useT <= 0) { this.useT = 0.15; this.scanUse(); }
  },
  scanUse() {
    const G = Game, P = G.P, cv = document.getElementById('gl').getBoundingClientRect();
    const r = Engine.ray(cv.left + cv.width / 2, cv.top + cv.height / (this.view === 'first' ? 2 : 2.2));
    let best = null, bt = 1e9, reach = this.view === 'first' ? 3.2 : 4.2;
    const near = (x, y, z) => Math.hypot(x - P.x, z - P.z) < reach && Math.abs(y - P.y) < 2.2;
    for (const n of G.npcs || []) {
      if (n.hidden || n.carriedBy || !near(n.x, n.y, n.z)) continue;
      const t = rayAABB(r.o, r.d, [n.x - 0.45, n.y, n.z - 0.45], [n.x + 0.45, n.y + 1.95, n.z + 0.45]);
      if (t >= 0 && t < bt) { bt = t; best = n; }
    }
    for (const pr of G.props || []) {
      if (pr.gone || pr.type === 'exit' || !near(pr.p[0], pr.p[1], pr.p[2])) continue;
      const s = pr.type === 'station' ? 1.2 : 0.6;
      const t = rayAABB(r.o, r.d, [pr.p[0] - s, pr.p[1], pr.p[2] - s], [pr.p[0] + s, pr.p[1] + 1.6, pr.p[2] + s]);
      if (t >= 0 && t < bt) { bt = t; best = pr; }
    }
    if (!best) {
      // fall back to anything right in front of you
      for (const pr of G.props || []) { if (pr.gone || pr.type === 'exit') continue; const d = Math.hypot(pr.p[0] - P.x, pr.p[2] - P.z); if (d < 1.4 && Math.abs(pr.p[1] - P.y) < 1.5 && d < bt) { bt = d; best = pr; } }
    }
    this.useEnt = best;
    const b = $('#useBtn');
    if (!best || !this.active()) { b.classList.add('hidden'); return; }
    const lbl = best.kind ? (best.isTarget ? best.name : best.state === 'dead' ? 'Body' : best.state === 'ko' ? 'Unconscious' : GUARDLIKE(best.kind) ? 'Guard' : best.kind === 'staff' ? (OUTFIT_NAMES[best.outfit] || 'Staff') : 'Guest')
      : (best.name || (ITEMS[best.item] && ITEMS[best.item].name) || (STOP_INFO[best.type] && STOP_INFO[best.type].name) || best.type || 'Use');
    $('#useLbl').textContent = String(lbl).replace(/\{i:[a-z]+\}/gi, '').trim().slice(0, 22);
    b.classList.remove('hidden');
  },
  use() {
    const e = this.useEnt; if (!e) return;
    const p = e.kind ? [e.x, e.y + 1, e.z] : [e.p[0], e.p[1] + 0.6, e.p[2]];
    const s = Engine.project(p); if (!s) return;
    Game.onTap(s.x, s.y);
  }
};

/* hooks into the game loop, rendering and settings */
(function () {
  const init = UI.init;
  UI.init = function () { init.call(this); Controls.init(); };
  const st = UI.settings;
  UI.settings = function () {
    st.call(this);
    const wrap = this.sheet.querySelector('.pmenu'); if (!wrap) return;
    const s = Game.S.settings;
    const v = el('button', 'btn', `{i:eye} Camera: ${VIEW_NAMES[Controls.view]}`);
    v.onclick = () => { Controls.cycle(); this.settings(); };
    const j = el('button', 'btn', `Joystick in top-down view: ${s.stickTop ? 'On' : 'Off'}`);
    j.onclick = () => { s.stickTop = !s.stickTop; Game.save(); Controls.hud(); this.settings(); };
    wrap.insertBefore(j, wrap.firstChild); wrap.insertBefore(v, wrap.firstChild);
  };
  const hide = UI.hideAll;
  UI.hideAll = function () { hide.call(this); ['#stickzone', '#lookpad', '#xhair', '#useBtn'].forEach(x => { const e = $(x); if (e) e.classList.add('hidden'); }); };
  const lm = Game.loadMap;
  Game.loadMap = function (M) { const r = lm.call(this, M); if (Controls.view !== 'top') { Controls.yaw = Engine.cam.yaw; Controls.cd = 1; } return r; };
})();

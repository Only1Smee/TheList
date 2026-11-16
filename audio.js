'use strict';
/* =========================================================
   THE LIST — Synthesised audio (no files needed)
   ========================================================= */
const Sfx = {
  ctx: null, master: null, sfxBus: null, musBus: null, noiseBuf: null, on: { sfx: true, music: true },
  musicMode: 'hideout', intensity: 0, step: 0, nextT: 0, timer: null,
  files: {}, cur: null, curName: null, combatT: 0,
  loadMusic() {
    fetch('music.json').then(r => r.json()).then(meta => {
      for (const name of ['hideout', 'mission', 'combat']) {
        fetch(`${name}.mp3`).then(r => r.arrayBuffer()).then(ab => this.ctx.decodeAudioData(ab)).then(buf => { this.files[name] = { buf, ls: meta[name].loopStart, le: meta[name].loopEnd }; }).catch(() => { });
      }
    }).catch(() => { });
  },
  switchTrack(name) {
    const c = this.ctx, F = this.files[name]; if (!F) return;
    const t = c.currentTime;
    if (this.cur) { const old = this.cur; old.g.gain.cancelScheduledValues(t); old.g.gain.setValueAtTime(old.g.gain.value, t); old.g.gain.linearRampToValueAtTime(0, t + 1.4); old.s.stop(t + 1.5); }
    const s = c.createBufferSource(); s.buffer = F.buf; s.loop = true; s.loopStart = F.ls; s.loopEnd = F.le;
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 1.4);
    s.connect(g); g.connect(this.musBus); s.start(t, F.ls);
    this.cur = { s, g }; this.curName = name;
  },
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = 0.8; this.master.connect(c.destination);
    const comp = c.createDynamicsCompressor(); comp.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.connect(comp);
    this.musBus = c.createGain(); this.musBus.gain.value = 0.32; this.musBus.connect(comp);
    const n = c.sampleRate * 1.5, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = b;
    this.apply();
    this.nextT = c.currentTime + 0.1;
    this.loadMusic();
    this.timer = setInterval(() => this.sched(), 60);
  },
  apply() {
    if (!this.ctx) return;
    this.sfxBus.gain.value = this.on.sfx ? 1 : 0;
    this.musBus.gain.setTargetAtTime(this.on.music ? 0.32 : 0, this.ctx.currentTime, 0.2);
  },
  // ---- primitives ----
  tone(f, dur, type, vol, t0, slide, bus) {
    const c = this.ctx; if (!c) return; t0 = t0 || c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus || this.sfxBus); o.start(t0); o.stop(t0 + dur + 0.05);
  },
  noise(dur, vol, freq, q, t0, type, bus) {
    const c = this.ctx; if (!c) return; t0 = t0 || c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq || 2000; f.Q.value = q || 0.7;
    const g = c.createGain(); g.gain.setValueAtTime(vol || 0.3, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(bus || this.sfxBus); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  },
  play(name) {
    if (!this.ctx || !this.on.sfx) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'click': this.tone(1400, 0.05, 'square', 0.05); this.tone(2100, 0.04, 'sine', 0.04, t + 0.02); break;
      case 'tap': this.tone(660, 0.07, 'sine', 0.05); break;
      case 'open': this.tone(300, 0.12, 'triangle', 0.08, t, 600); this.noise(0.12, 0.04, 3000, 1, t, 'highpass'); break;
      case 'close': this.tone(500, 0.1, 'triangle', 0.06, t, 260); break;
      case 'pickup': this.tone(880, 0.08, 'triangle', 0.12); this.tone(1320, 0.12, 'triangle', 0.12, t + 0.07); break;
      case 'coin': this.tone(2400, 0.25, 'sine', 0.1); this.tone(3600, 0.2, 'sine', 0.06, t + 0.04); break;
      case 'poison': for (let i = 0; i < 4; i++) this.tone(300 + Math.random() * 300, 0.08, 'sine', 0.08, t + i * 0.06, 900); break;
      case 'action': this.noise(0.25, 0.08, 900, 1, t, 'bandpass'); break;
      case 'disguise': this.noise(0.35, 0.1, 1800, 0.6, t, 'bandpass'); this.tone(500, 0.2, 'triangle', 0.06, t + 0.25, 800); break;
      case 'ko': this.noise(0.12, 0.25, 400); this.tone(120, 0.18, 'sine', 0.3, t, 60); break;
      case 'kill': this.noise(0.15, 0.3, 500); this.tone(90, 0.35, 'sine', 0.35, t, 40); break;
      case 'target': this.tone(110, 1.6, 'sawtooth', 0.12, t); this.tone(164.8, 1.6, 'sawtooth', 0.09, t); this.tone(220, 1.6, 'triangle', 0.1, t); this.noise(1.2, 0.15, 300, 0.7, t); this.tone(55, 1.2, 'sine', 0.4, t, 35); break;
      case 'gun': this.noise(0.35, 0.9, 2500); this.noise(0.08, 0.6, 6000, 0.5, t, 'highpass'); this.tone(150, 0.2, 'square', 0.25, t, 50); break;
      case 'silenced': this.noise(0.08, 0.35, 1500, 1, t, 'bandpass'); this.tone(400, 0.05, 'square', 0.06, t, 100); break;
      case 'enemyGun': this.noise(0.25, 0.45, 2000); this.tone(130, 0.12, 'square', 0.12, t, 50); break;
      case 'boom': this.noise(1.6, 1.0, 600); this.noise(0.4, 0.6, 3000, 0.5, t); this.tone(60, 1.2, 'sine', 0.7, t, 25); break;
      case 'crash': this.noise(0.9, 0.7, 4000, 0.5, t, 'highpass'); for (let i = 0; i < 6; i++) this.tone(2000 + Math.random() * 3000, 0.4, 'sine', 0.05, t + i * 0.05); this.tone(80, 0.5, 'sine', 0.4, t, 40); break;
      case 'zap': for (let i = 0; i < 10; i++) this.noise(0.05, 0.3, 4000, 4, t + i * 0.07, 'bandpass'); this.tone(60, 0.8, 'sawtooth', 0.15, t); break;
      case 'scream': this.tone(900, 0.6, 'sawtooth', 0.06, t, 500); break;
      case 'spotted': this.tone(440, 0.12, 'square', 0.08); this.tone(660, 0.18, 'square', 0.08, t + 0.1); break;
      case 'alarm': for (let i = 0; i < 3; i++) { this.tone(880, 0.15, 'square', 0.09, t + i * 0.3); this.tone(660, 0.15, 'square', 0.09, t + i * 0.3 + 0.15); } break;
      case 'hit': this.noise(0.1, 0.4, 1200); this.tone(200, 0.15, 'sawtooth', 0.15, t, 80); break;
      case 'cash': this.tone(1568, 0.1, 'square', 0.06); this.tone(2093, 0.25, 'square', 0.06, t + 0.08); this.noise(0.1, 0.06, 6000, 1, t, 'highpass'); break;
      case 'radio': [523, 659, 784][Math.floor(Math.random() * 3)] && this.tone([392, 494, 587, 659][Math.floor(Math.random() * 4)], 0.18, 'square', 0.035); break;
      case 'tick': this.tone(1800, 0.03, 'square', 0.03); break;
      case 'rank': this.noise(0.8, 0.6, 400); this.tone(70, 0.9, 'sine', 0.6, t, 35); this.tone(523, 0.7, 'triangle', 0.1, t + 0.05); this.tone(784, 0.7, 'triangle', 0.08, t + 0.05); break;
      case 'achieve': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.1, t + i * 0.07)); break;
      case 'levelup': [392, 523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.35, 'square', 0.06, t + i * 0.08)); this.tone(1047, 0.8, 'triangle', 0.08, t + 0.5); break;
      case 'daily': [659, 784, 988, 1319].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.1, t + i * 0.09)); this.play('cash'); break;
      case 'whoosh': this.noise(0.6, 0.15, 800, 0.8, t, 'bandpass'); break;
      case 'fail': [392, 330, 262].forEach((f, i) => this.tone(f, 0.4, 'sawtooth', 0.07, t + i * 0.18)); break;
    }
  },
  // ---- adaptive music: minor spy groove ----
  setMode(m) { this.musicMode = m; },
  sched() {
    const c = this.ctx; if (!c) return;
    // recorded soundtrack takes over once loaded
    if (this.intensity > 0.6) this.combatT = c.currentTime;
    const want = this.musicMode === 'hideout' ? 'hideout' : (c.currentTime - this.combatT < 6 && this.combatT > 0) ? 'combat' : 'mission';
    if (this.files[want]) { if (this.curName !== want) this.switchTrack(want); this.nextT = c.currentTime + 0.1; return; }
    const bpm = this.musicMode === 'hideout' ? 84 : this.intensity > 0.6 ? 132 : 100;
    const st = 60 / bpm / 4;
    while (this.nextT < c.currentTime + 0.25) { this.beat(this.step, this.nextT, st); this.step++; this.nextT += st; }
  },
  beat(s, t, st) {
    if (!this.on.music) return;
    const bar = Math.floor(s / 16) % 4, i = s % 16, B = this.musBus;
    const roots = this.musicMode === 'hideout' ? [55, 55, 49, 51.9] : [55, 51.9, 49, 46.25];
    const r = roots[bar];
    const bassPat = this.musicMode === 'hideout' ? [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0] : [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0];
    if (bassPat[i]) this.tone(r * (i === 6 || i === 14 ? 1.5 : 1), st * 2.2, 'triangle', 0.22, t, null, B);
    if (this.musicMode !== 'hideout' || i % 4 === 0) { if (i % 2 === 0) this.noise(0.04, this.intensity > 0.6 ? 0.06 : 0.035, 8000, 1, t, 'highpass', B); }
    if (this.musicMode === 'mission' && i === 8) this.noise(0.12, 0.08 + this.intensity * 0.1, 1800, 1, t, 'bandpass', B);
    if (this.intensity > 0.6 && (i === 0 || i === 8)) this.tone(60, 0.18, 'sine', 0.35, t, 40, B);
    if (i === 0) { // pad chord
      const m = this.musicMode === 'hideout' ? 4 : 4;
      [r * m, r * m * 1.189, r * m * 1.498].forEach(f => this.tone(f, st * 15, 'sine', this.musicMode === 'hideout' ? 0.045 : 0.03, t, null, B));
    }
    if (this.musicMode === 'mission' && (i === 3 || i === 11) && bar % 2 === 1) this.tone(r * 8 * (i === 3 ? 1.335 : 1.189), st * 3, 'sine', 0.03, t, null, B);
  }
};

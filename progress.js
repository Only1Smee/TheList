'use strict';
/* =========================================================
   THE LIST — Progression: XP, daily rewards,
   daily challenges, city mastery, achievements
   ========================================================= */
const xpForLevel = lv => 1000 + (lv - 1) * 650;
const RANK_XP = { S: 1400, A: 1000, B: 750, C: 550, D: 400, F: 250 };

const DAILY_REWARDS = [
  { cash: 2000, label: '$2,000' }, { cash: 3500, label: '$3,500' }, { token: 1, label: 'Intel Token' }, { cash: 6000, label: '$6,000' },
  { xp: 900, label: '900 XP' }, { cash: 10000, token: 1, label: '$10k + Token' }, { cash: 25000, suit: 'midnight', label: 'Mourning Overcoat' }
];

const CHALLENGE_POOL = [
  { id: 'city', text: c => `Complete a contract in ${CITIES[c.city].name}`, goal: 1, ev: 'mission', test: (d, c) => d.success && d.ci === c.city, cash: 5000, xp: 500 },
  { id: 'accident', text: () => 'Eliminate a target with an accident', goal: 1, ev: 'targetKill', test: d => d.method === 'accident', cash: 6000, xp: 500 },
  { id: 'poison', text: () => 'Poison a target', goal: 1, ev: 'targetKill', test: d => d.method === 'poison', cash: 5000, xp: 450 },
  { id: 'wire', text: () => 'Eliminate a target with the Fiber Wire', goal: 1, ev: 'targetKill', test: d => d.method === 'wire', cash: 5000, xp: 450 },
  { id: 'pistol', text: () => 'Shoot a target', goal: 1, ev: 'targetKill', test: d => d.method === 'pistol', cash: 4000, xp: 400 },
  { id: 'srank', text: () => 'Earn an S rank', goal: 1, ev: 'mission', test: d => d.success && d.rank === 'S', cash: 9000, xp: 800 },
  { id: 'sa', text: () => 'Complete a contract as a Ghost (unseen, no bodies, no extra kills)', goal: 1, ev: 'mission', test: d => d.success && d.sa, cash: 7000, xp: 650 },
  { id: 'suit', text: () => 'Complete a contract in your own clothes only', goal: 1, ev: 'mission', test: d => d.success && d.suitOnly, cash: 6000, xp: 550 },
  { id: 'two', text: () => 'Complete 2 contracts', goal: 2, ev: 'mission', test: d => d.success, cash: 8000, xp: 700 },
  { id: 'coins', text: () => 'Distract people with 5 coins', goal: 5, ev: 'coin', test: () => true, cash: 3000, xp: 300 },
  { id: 'ko', text: () => 'Subdue 3 people', goal: 3, ev: 'ko', test: () => true, cash: 3500, xp: 350 },
  { id: 'hide', text: () => 'Hide 2 bodies', goal: 2, ev: 'hide', test: () => true, cash: 3500, xp: 350 },
  { id: 'disg', text: () => 'Change disguise 3 times', goal: 3, ev: 'disguise', test: () => true, cash: 3000, xp: 300 },
  { id: 'clean', text: () => 'Complete a contract with no non-target kills', goal: 1, ev: 'mission', test: d => d.success && d.nonTarget === 0, cash: 5000, xp: 450 },
  { id: 'chand', text: () => 'Drop a chandelier on a target', goal: 1, ev: 'targetKill', test: d => d.via === 'chandelier', cash: 7000, xp: 600 },
  { id: 'push', text: () => 'Push a target off a balcony', goal: 1, ev: 'targetKill', test: d => d.via === 'push', cash: 7000, xp: 600 }
];

const MASTERY = [
  { id: 'done', name: 'Contract Complete', test: d => d.success },
  { id: 'sa', name: 'Ghost', test: d => d.success && d.sa },
  { id: 'suit', name: 'Own Clothes Only', test: d => d.success && d.suitOnly },
  { id: 'acc', name: 'Accidental Death', test: d => d.success && d.method === 'accident' },
  { id: 'poi', name: 'Bad Taste (poison)', test: d => d.success && d.method === 'poison' },
  { id: 's', name: 'S Rank', test: d => d.success && d.rank === 'S' },
  { id: 'sig', name: 'Signature Kill', test: d => d.success && d.via === 'signature' }
];

const ACHIEVEMENTS = [
  { id: 'first', icon: '{i:target}', name: 'First Blood', desc: 'Complete your first contract', stat: 'contracts', goal: 1, cash: 5000 },
  { id: 'sa1', icon: '{i:ghost}', name: 'Ghost', desc: 'Finish a contract as a Ghost', stat: 'sa', goal: 1, cash: 8000 },
  { id: 's1', icon: '{i:star}', name: 'Professional', desc: 'Earn an S rank', stat: 's', goal: 1, cash: 10000 },
  { id: 's10', icon: '{i:star}', name: 'Legend', desc: 'Earn 10 S ranks', stat: 's', goal: 10, cash: 50000 },
  { id: 'c5', icon: '{i:plane}', name: 'Globetrotter', desc: 'Complete contracts in 5 cities', stat: 'cities', goal: 5, cash: 15000 },
  { id: 'c15', icon: '{i:globe}', name: 'World Tour', desc: 'Complete a contract in all 15 cities', stat: 'cities', goal: 15, cash: 100000 },
  { id: 'acc10', icon: '{i:slip}', name: 'Unlucky Coincidences', desc: 'Kill 10 people by accident', stat: 'accident', goal: 10, cash: 20000 },
  { id: 'poi10', icon: '{i:flask}', name: 'Sommelier', desc: 'Poison 10 people', stat: 'poison', goal: 10, cash: 20000 },
  { id: 'wire10', icon: '{i:wire}', name: 'Piano Man', desc: '10 Fiber Wire kills', stat: 'wire', goal: 10, cash: 20000 },
  { id: 'gun10', icon: '{i:gun}', name: 'Marksman', desc: '10 pistol kills', stat: 'pistol', goal: 10, cash: 15000 },
  { id: 'chand', icon: '{i:bulb}', name: 'Lights Out', desc: 'Drop a chandelier on a target', stat: 'v_chandelier', goal: 1, cash: 10000 },
  { id: 'push', icon: '{i:push}', name: 'Gravity Wins', desc: 'Push a target off a balcony', stat: 'v_push', goal: 1, cash: 10000 },
  { id: 'sauna', icon: '{i:fire}', name: 'Steam Cleaned', desc: 'Cook a target in the sauna', stat: 'v_sauna', goal: 1, cash: 10000 },
  { id: 'pool', icon: '{i:bolt}', name: 'Shocking', desc: 'Electrocute a target in the pool', stat: 'v_pool', goal: 1, cash: 10000 },
  { id: 'gas', icon: '{i:burst}', name: 'Gas Leak', desc: 'Blow up a target at the stove', stat: 'v_gas', goal: 1, cash: 10000 },
  { id: 'disg', icon: '{i:mask}', name: 'Master of Disguise', desc: 'Wear all 5 staff disguises', stat: 'disguises', goal: 5, cash: 20000 },
  { id: 'hide25', icon: '{i:box}', name: 'Out of Sight', desc: 'Hide 25 bodies', stat: 'hidden', goal: 25, cash: 20000 },
  { id: 'ko50', icon: '{i:fist}', name: 'Lights Out, Pal', desc: 'Subdue 50 people', stat: 'ko', goal: 50, cash: 20000 },
  { id: 'coin50', icon: '{i:coin}', name: 'Heads or Tails', desc: 'Throw 50 coins', stat: 'coins', goal: 50, cash: 10000 },
  { id: 'mil', icon: '{i:money}', name: 'Millionaire', desc: 'Earn $1,000,000 in total', stat: 'earned', goal: 1000000, cash: 50000 },
  { id: 'suits', icon: '{i:shirt}', name: 'Sharp Dressed', desc: 'Own every suit', stat: 'suits', goal: 10, cash: 25000 },
  { id: 'vault', icon: '{i:castle}', name: 'Kingpin', desc: 'Fully upgrade your hideout', stat: 'hide', goal: 3, cash: 50000 },
  { id: 'streak', icon: '{i:calendar}', name: 'Creature of Habit', desc: 'Reach a 7-day login streak', stat: 'streak', goal: 7, cash: 25000 },
  { id: 'daily10', icon: '{i:check}', name: 'Overachiever', desc: 'Complete 10 daily challenges', stat: 'dailies', goal: 10, cash: 30000 },
  { id: 'master', icon: '{i:medal}', name: 'Mastered', desc: 'Complete every mastery challenge in one city', stat: 'mastered', goal: 1, cash: 30000 },
  { id: 'lv10', icon: '{i:medal}', name: 'Veteran', desc: 'Reach Level 10', stat: 'level', goal: 10, cash: 50000 },
  { id: 'ch3', icon: '{i:book}', name: 'Following the Money', desc: 'Complete 3 campaign chapters', stat: 'campaign', goal: 3, cash: 15000 },
  { id: 'ch15', icon: '{i:key}', name: 'The List Is Empty', desc: 'Cross off every name on the list', stat: 'campaign', goal: 15, cash: 150000 },
  { id: 'el1', icon: '{i:paw}', name: 'Elusive', desc: 'Eliminate an Elusive Target', stat: 'elusive', goal: 1, cash: 20000 },
  { id: 'el5', icon: '{i:paw}', name: 'Apex Predator', desc: 'Eliminate 5 Elusive Targets', stat: 'elusive', goal: 5, cash: 75000 },
  { id: 'sig5', icon: '{i:map}', name: 'Local Flavour', desc: 'Pull off 5 signature kills', stat: 'v_signature', goal: 5, cash: 40000 },
  { id: 'weekly', icon: '{i:calendar}', name: 'Rule Follower', desc: 'Complete a Weekly Contract with every rule met', stat: 'weeklies', goal: 1, cash: 25000 },
  { id: 'master', icon: '{i:skull}', name: 'Master Assassin', desc: 'Earn an S rank on Master difficulty', stat: 'masterS', goal: 1, cash: 60000 }
];

const Progress = {
  get S() { return Game.S; },
  ensure() {
    const S = Game.S;
    S.prog = Object.assign({ xp: 0, level: 1, tokens: 0, daily: { last: null, streak: 0 }, ch: { date: '', list: [] }, ach: {}, mastery: {}, dailies: 0,
      career: { kills: 0, accident: 0, poison: 0, wire: 0, pistol: 0, melee: 0, explosive: 0, ko: 0, hidden: 0, coins: 0, disguises: {}, cities: {}, via: {}, sa: 0 } }, S.prog || {});
    S.look.acc = Object.assign({ watch: 'none', square: 'none', pin: 'none', glove: 'black', case: 'none' }, S.look.acc || {});
    S.unlocked.acc = S.unlocked.acc || [];
    S.settings.difficulty = S.settings.difficulty || 'pro';
    if (!SUITS.find(s => s.id === 'midnight')) SUITS.push({ id: 'midnight', name: 'Mourning Overcoat', price: -1, style: 'coat', jacket: [0.05, 0.05, 0.06], pants: [0.05, 0.05, 0.06], shirt: [0.06, 0.06, 0.07], noTie: 1, exclusive: 1 });
    this.refreshChallenges();
    return S.prog;
  },
  dayStr(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  yesterday() { const d = new Date(); d.setDate(d.getDate() - 1); return this.dayStr(d); },

  /* ---- XP ---- */
  addXP(n) {
    const P = this.S.prog; P.xp += n; const ups = [];
    while (P.xp >= xpForLevel(P.level)) { P.xp -= xpForLevel(P.level); P.level++; const cash = 2500 * P.level; this.S.money += cash; ups.push({ level: P.level, cash }); }
    if (ups.length) this.checkAch();
    return ups;
  },

  /* ---- Daily reward ---- */
  dailyState() {
    const D = this.S.prog.daily, today = this.dayStr();
    const can = D.last !== today;
    const streakAlive = D.last === this.yesterday() || D.last === today;
    const nextIdx = can ? (streakAlive ? D.streak % 7 : 0) : (D.streak - 1) % 7;
    return { can, idx: nextIdx, streak: streakAlive ? D.streak : 0 };
  },
  claimDaily() {
    const st = this.dailyState(); if (!st.can) return null;
    const D = this.S.prog.daily; const r = DAILY_REWARDS[st.idx];
    D.streak = st.streak + 1; D.last = this.dayStr();
    if (r.cash) this.S.money += r.cash;
    if (r.token) this.S.prog.tokens += r.token;
    if (r.suit && !this.S.unlocked.suits.includes(r.suit)) this.S.unlocked.suits.push(r.suit);
    const ups = r.xp ? this.addXP(r.xp) : [];
    this.checkAch(); Game.save();
    return { r, ups };
  },

  /* ---- Daily challenges ---- */
  refreshChallenges() {
    const P = this.S.prog, today = this.dayStr();
    if (P.ch.date === today && P.ch.list.length) return;
    const seed = parseInt(today.replace(/-/g, ''), 10);
    const rng = RNG(seed);
    const pool = rng.shuffle(CHALLENGE_POOL.slice());
    const unlocked = CITIES.map((c, i) => i).filter(i => Game.cityUnlocked(i));
    P.ch = { date: today, list: pool.slice(0, 3).map(t => ({ id: t.id, city: rng.pick(unlocked), prog: 0, done: false, claimed: false })) };
  },
  chDef(c) { return CHALLENGE_POOL.find(t => t.id === c.id); },
  chText(c) { return this.chDef(c).text(c); },

  /* ---- events ---- */
  track(ev, d) {
    d = d || {};
    const P = this.S.prog, C = P.career, out = [];
    switch (ev) {
      case 'kill': C.kills++; if (C[d.method] !== undefined) C[d.method]++; if (d.via) C.via[d.via] = (C.via[d.via] || 0) + 1; if (d.target) this.track('targetKill', d); break;
      case 'ko': C.ko++; break;
      case 'hide': C.hidden++; break;
      case 'coin': C.coins++; break;
      case 'disguise': if (['waiter', 'chef', 'cleaner', 'guard', 'tech'].includes(d.outfit)) C.disguises[d.outfit] = 1; break;
      case 'mission': if (d.success) { C.cities[CITIES[d.ci].id] = 1; if (d.sa) C.sa++; } break;
    }
    // daily challenges
    for (const c of P.ch.list) {
      if (c.done) continue; const t = this.chDef(c);
      if (t.ev === ev && t.test(d, c)) { c.prog++; if (c.prog >= t.goal) { c.done = true; out.push({ type: 'challenge', text: this.chText(c) }); UI.banner('CHALLENGE COMPLETE', this.chText(c), '{i:check}'); Sfx.play('achieve'); } }
    }
    this.checkAch();
    return out;
  },
  claimChallenge(i) {
    const P = this.S.prog, c = P.ch.list[i]; if (!c || !c.done || c.claimed) return null;
    const t = this.chDef(c); c.claimed = true; P.dailies++;
    this.S.money += t.cash; const ups = this.addXP(t.xp);
    this.checkAch(); Game.save();
    return { cash: t.cash, xp: t.xp, ups };
  },

  /* ---- mastery ---- */
  mastery(ci) { const id = CITIES[ci].id; return this.S.prog.mastery[id] || (this.S.prog.mastery[id] = {}); },
  masteryCount(ci) { const m = this.S.prog.mastery[CITIES[ci].id] || {}; return MASTERY.filter(x => m[x.id]).length; },
  missionMastery(d) {
    const m = this.mastery(d.ci), got = [];
    for (const x of MASTERY) if (!m[x.id] && x.test(d)) { m[x.id] = 1; got.push(x); }
    return got;
  },

  /* ---- achievements ---- */
  statVal(stat) {
    const S = this.S, P = S.prog, C = P.career;
    switch (stat) {
      case 'contracts': return S.stats.contracts;
      case 's': return S.stats.s;
      case 'sa': return C.sa;
      case 'cities': return Object.keys(C.cities).length;
      case 'disguises': return Object.keys(C.disguises).length;
      case 'earned': return S.stats.earned;
      case 'suits': return S.unlocked.suits.filter(id => id !== 'midnight').length + (S.unlocked.suits.includes('midnight') ? 1 : 0);
      case 'hide': return S.lv.hide;
      case 'streak': return P.daily.streak;
      case 'dailies': return P.dailies;
      case 'level': return P.level;
      case 'campaign': return P.campaign || 0;
      case 'weeklies': return P.weeklies || 0;
      case 'masterS': return P.masterS || 0;
      case 'stars': return CITIES.reduce((a, c, i) => a + this.masteryCount(i), 0);
      case 'elusive': return P.elusiveWins || 0;
      case 'mastered': return CITIES.filter((c, i) => this.masteryCount(i) >= MASTERY.length).length;
      default: if (stat.startsWith('v_')) return C.via[stat.slice(2)] || 0; return C[stat] || 0;
    }
  },
  checkAch() {
    const P = this.S.prog;
    for (const a of ACHIEVEMENTS) {
      if (P.ach[a.id]) continue;
      if (this.statVal(a.stat) >= a.goal) {
        P.ach[a.id] = { t: Date.now(), claimed: false };
        UI.banner('ACHIEVEMENT UNLOCKED', a.icon + ' ' + a.name, '{i:trophy}'); Sfx.play('achieve');
      }
    }
  },
  claimAch(id) {
    const P = this.S.prog, a = ACHIEVEMENTS.find(x => x.id === id), st = P.ach[id];
    if (!a || !st || st.claimed) return null;
    st.claimed = true; this.S.money += a.cash; const ups = this.addXP(500); Game.save();
    return { cash: a.cash, ups };
  },
  pending() {
    const P = this.S.prog;
    return {
      daily: this.dailyState().can,
      ch: P.ch.list.filter(c => c.done && !c.claimed).length,
      ach: Object.values(P.ach).filter(a => !a.claimed).length
    };
  }
};

'use strict';
/* ---------------- Catalogs ---------------- */
const ITEMS = {
  wire: { name: 'Fiber Wire', icon: '{i:wire}', desc: 'Silent, lethal, concealable.', kind: 'wire' },
  coin: { name: 'Coins', icon: '{i:coin}', desc: 'Throw to lure people away. Tap ground while held.', kind: 'coin', stack: true },
  poison: { name: 'Lethal Poison', icon: '{i:poison}', desc: 'Add to food or drink. Kills.', kind: 'poison', ptype: 'lethal' },
  emetic: { name: 'Emetic Poison', icon: '{i:sick}', desc: 'Makes the drinker sick and sends them to the bathroom.', kind: 'poison', ptype: 'emetic' },
  wrench: { name: 'Wrench', icon: '{i:wrench}', desc: 'Sabotage gas valves and machinery.', kind: 'tool' },
  knife: { name: 'Kitchen Knife', icon: '{i:knife}', desc: 'Messy but effective. Illegal when held.', kind: 'melee', illegal: true },
  pistol: { name: 'Guard Pistol', icon: '{i:gun}', desc: 'Loud. Everybody will hear it.', kind: 'gun', illegal: true, loud: true },
  pistol9: { name: 'Classic 9mm', icon: '{i:gun}', desc: 'Reliable but loud.', kind: 'gun', illegal: true, loud: true },
  tranq: { name: 'Tranq Pistol', icon: '{i:syringe}', desc: 'Silent. Knocks targets out instead of killing.', kind: 'gun', illegal: true, tranq: true },
  whisper: { name: 'Whisper SD', icon: '{i:mute}', desc: 'Silenced pistol. The professional choice.', kind: 'gun', illegal: true },
  revolver: { name: 'Heavy Revolver', icon: '{i:burst}', desc: 'Huge stopping power. Very loud.', kind: 'gun', illegal: true, loud: true },
  charge: { name: 'Remote Charge', icon: '{i:bomb}', desc: 'Place it, walk away, detonate.', kind: 'charge', illegal: true },
  medkit: { name: 'Medkit', icon: '{i:cross}', desc: 'Restores health once.', kind: 'medkit' },
  lockpick: { name: 'Lockpick', icon: '{i:key}', desc: 'Opens locked doors (slowly).', kind: 'tool' },
  keycard: { name: 'Keycard', icon: '{i:card}', desc: 'Opens locked security doors instantly.', kind: 'tool' }
};
const SHOP_WEAPONS = [
  { id: 'pistol9', price: 0 }, { id: 'tranq', price: 12000 }, { id: 'whisper', price: 18000 }, { id: 'revolver', price: 26000 }
];
const SHOP_GEAR = [
  { id: 'wire', price: 0 }, { id: 'coin', price: 0 }, { id: 'emetic', price: 3000 }, { id: 'wrench', price: 2500 },
  { id: 'poison', price: 6000 }, { id: 'lockpick', price: 4000 }, { id: 'medkit', price: 4000 }, { id: 'charge', price: 20000 }
];
const SUITS = [
  { id: 'leather', name: 'Battered Leather Jacket', price: 0, style: 'jacket', jacket: [0.17, 0.1, 0.07], pants: [0.13, 0.15, 0.22], shirt: [0.19, 0.19, 0.21], noTie: 1 },
  { id: 'burnt', name: 'The Night Of', price: 0, style: 'burnt', jacket: [0.62, 0.58, 0.52], pants: [0.12, 0.12, 0.14], shirt: [0.62, 0.58, 0.52], noTie: 1 },
  { id: 'hoodie', name: 'Hoodie and Gilet', price: 6000, style: 'hoodie', jacket: [0.11, 0.11, 0.12], pants: [0.1, 0.1, 0.11], shirt: [0.3, 0.31, 0.33], noTie: 1 },
  { id: 'donkey', name: 'Donkey Jacket', price: 8000, style: 'jacket', jacket: [0.11, 0.12, 0.16], pants: [0.28, 0.24, 0.17], shirt: [0.48, 0.13, 0.08], noTie: 1 },
  { id: 'coat', name: 'Long Rain Coat', price: 12000, style: 'coat', jacket: [0.22, 0.18, 0.14], pants: [0.1, 0.1, 0.11], shirt: [0.82, 0.82, 0.8], noTie: 1 },
  { id: 'classic', name: 'Funeral Suit', price: 0, style: 'suit', jacket: [0.07, 0.07, 0.08], pants: [0.07, 0.07, 0.08], shirt: [0.92, 0.92, 0.92] },
  { id: 'charcoal', name: 'Charcoal Suit', price: 9000, style: 'suit', jacket: [0.26, 0.26, 0.28], pants: [0.24, 0.24, 0.26], shirt: [0.9, 0.92, 0.96] },
  { id: 'tactical', name: 'Tactical Kit', price: 20000, style: 'tactical', jacket: [0.13, 0.15, 0.12], pants: [0.12, 0.13, 0.11], shirt: [0.1, 0.1, 0.1], noTie: 1 },
  { id: 'ember', name: 'Ember Leather', price: 35000, style: 'jacket', jacket: [0.42, 0.16, 0.06], pants: [0.08, 0.08, 0.09], shirt: [0.07, 0.07, 0.08], noTie: 1 }
];
const SCARS = ['none', 'cheek', 'brow', 'lip', 'burn'];
const SCAR_NAMES = { none: 'None', cheek: 'Cheek', brow: 'Brow', lip: 'Lip', burn: 'Burn' };
const SKINS = [[0.98, 0.84, 0.72], [0.93, 0.74, 0.6], [0.82, 0.6, 0.45], [0.66, 0.46, 0.32], [0.48, 0.32, 0.22], [0.32, 0.21, 0.15]];
const HAIR_STYLES = ['bald', 'buzz', 'slick', 'sidepart', 'spiky', 'long', 'ponytail', 'mohawk', 'afro'];
const HAIR_NAMES = { bald: 'Bald', buzz: 'Buzz Cut', slick: 'Slicked Back', sidepart: 'Side Part', spiky: 'Spiky', long: 'Long', ponytail: 'Ponytail', mohawk: 'Mohawk', afro: 'Afro' };
const HAIR_COLS = [[0.06, 0.05, 0.05], [0.25, 0.16, 0.1], [0.45, 0.3, 0.16], [0.78, 0.6, 0.32], [0.62, 0.22, 0.1], [0.62, 0.62, 0.64], [0.92, 0.92, 0.9], [0.55, 0.1, 0.6]];
const BEARDS = ['none', 'stubble', 'moustache', 'goatee', 'full', 'chinstrap'];
const BEARD_NAMES = { none: 'Clean Shaven', stubble: 'Stubble', moustache: 'Moustache', goatee: 'Goatee', full: 'Full Beard', chinstrap: 'Chinstrap' };
const EYEWEAR = ['none', 'shades', 'glasses'];
const TIES = [[0.75, 0.05, 0.08], [0.06, 0.06, 0.07], [0.1, 0.2, 0.6], [0.85, 0.7, 0.2], [0.2, 0.5, 0.3], [0.9, 0.9, 0.9]];
const UPGRADES = {
  hide: { name: 'Safehouse', levels: [{ price: 30000, label: 'Patch It Up' }, { price: 90000, label: 'Make It Liveable' }, { price: 200000, label: 'Fortify It' }] },
  slots: { name: 'Loadout Slots', levels: [{ price: 15000, label: '3 Gear Slots' }, { price: 35000, label: '4 Gear Slots' }, { price: 70000, label: '5 Gear Slots' }] },
  armor: { name: 'Body Armour', levels: [{ price: 20000, label: '+25 Health' }, { price: 45000, label: '+50 Health' }] },
  intel: { name: 'Iris\'s Contacts', levels: [{ price: 15000, label: 'Intel 25% Off' }, { price: 40000, label: 'Intel 50% Off' }] }
};
const HIDE_NAMES = ['Burnt-Out Safehouse', 'Patched-Up Safehouse', 'Lived-In Safehouse', 'The Fortress'];
const FIRST = ['Viktor', 'Marcus', 'Elena', 'Dmitri', 'Sofia', 'Rafael', 'Isabella', 'Konrad', 'Yuki', 'Hassan', 'Lucia', 'Anton', 'Margot', 'Silas', 'Ingrid', 'Omar', 'Celeste', 'Ronan', 'Mei', 'Arjun', 'Natalia', 'Bastien', 'Valentina', 'Cyrus'];
const LAST = ['Kovac', 'Blackwood', 'Moreau', 'Vasquez', 'Takahashi', 'Al-Rashid', 'Romano', 'Steiner', 'Delacroix', 'Okafor', 'Varga', 'Sterling', 'Castellano', 'Novak', 'Lindqvist', 'Mendes', 'Chen', 'Rao', 'Petrov', 'Hale', 'Ferreira', 'Dubois', 'Grimaldi', 'Sato'];
const TITLES = ['Arms Dealer', 'Corrupt Banker', 'Cartel Accountant', 'Rogue Spymaster', 'Tech Smuggler', 'Crime Boss', 'Blackmailer', 'War Profiteer', 'Fixer', 'Art Forger', 'Money Launderer', 'Defector'];
const METHODS = [
  { id: 'any', name: 'Any Method' }, { id: 'accident', name: 'Accident' }, { id: 'poison', name: 'Poison' },
  { id: 'wire', name: 'Fiber Wire' }, { id: 'pistol', name: 'Pistol' }, { id: 'melee', name: 'Melee Weapon' }
];
const OUTFIT_NAMES = { suit: 'Your Clothes', guest: 'Party Guest', vip: 'VIP Guest', waiter: 'Waiter', chef: 'Chef', cleaner: 'Cleaner', guard: 'Security Guard', tech: 'Technician', underwear: 'Underwear' };
const STOP_INFO = {
  bar: { kind: 'poison', item: 'drink', steps: ['Get poison (emetic pills in the bathroom, rat poison in the kitchen)', 'Poison the cocktail on the bar counter', 'Wait for the target to order a drink'] },
  buffet: { kind: 'poison', steps: ['Get poison (rat poison in the kitchen pantry)', 'Poison the canapé platter in the ballroom', 'Wait for the target to snack'] },
  office: { kind: 'poison', steps: ['Get poison and a VIP-access disguise (security or cleaner)', 'Poison the whisky on the office desk', 'Wait for the target to pour a drink'] },
  privatebar: { kind: 'poison', steps: ['Get poison and a disguise with VIP access', 'Poison the rare cognac in the private bar', 'Wait for the target'] },
  speech: { kind: 'accident', steps: ['Get a staff disguise (waiter uniform in the staff room)', 'Reach the chandelier winch in the control room', 'Release the chandelier when the target stands under it'] },
  balcony: { kind: 'accident', steps: ['Get onto the balcony at the front of the building', 'Wait for the target to step out for a smoke', 'Push them over the railing while nobody is looking'] },
  kitchen: { kind: 'accident', steps: ['Find a wrench (control room or the shed in the back alley)', 'Get into the kitchen (chef or waiter disguise)', 'Loosen the gas valve on the stove before the target inspects it'] },
  sauna: { kind: 'accident', steps: ['Get a disguise with VIP access (security or cleaner)', 'Reach the spa', 'Overheat the sauna controls when the target is inside'] },
  pool: { kind: 'accident', steps: ['Reach the rooftop (VIP access needed)', 'Wait for the target to go for a swim', 'Knock the party speaker into the pool'] }
};

/* ---------------- Looks ---------------- */
function randomLooks(rng, kind) {
  const female = rng() < 0.42 && kind !== 'guard';
  const L = {
    skin: rng.int(0, SKINS.length - 1), hairCol: rng.int(0, 6),
    hair: female ? rng.pick(['long', 'ponytail', 'afro', 'long']) : rng.pick(['bald', 'buzz', 'slick', 'sidepart', 'spiky', 'buzz']),
    beard: female ? 'none' : rng.pick(['none', 'none', 'stubble', 'moustache', 'goatee', 'full']),
    eye: rng() < 0.12 ? 'glasses' : 'none', female,
    jacket: [rng() * 0.6 + 0.05, rng() * 0.5 + 0.05, rng() * 0.6 + 0.05], pants: null, tie: rng.int(0, TIES.length - 1), shirt: [0.95, 0.95, 0.95]
  };
  const pal = [[0.08, 0.08, 0.09], [0.2, 0.2, 0.24], [0.12, 0.15, 0.32], [0.55, 0.08, 0.12], [0.85, 0.82, 0.75], [0.25, 0.12, 0.35], [0.1, 0.35, 0.3], [0.7, 0.55, 0.2]];
  L.jacket = rng.pick(pal); L.pants = female ? L.jacket : rng.pick([[0.08, 0.08, 0.09], [0.2, 0.2, 0.22], L.jacket]);
  return L;
}

// resolve outfit colors for a character
function outfitColors(looks, outfit, suitId) {
  const o = { jacket: looks.jacket, pants: looks.pants || looks.jacket, shirt: looks.shirt || [0.95, 0.95, 0.95], tie: TIES[looks.tie || 0], hat: null, dress: false, noTie: false, shoe: [0.06, 0.05, 0.05] };
  switch (outfit) {
    case 'suit': { const s = SUITS.find(s => s.id === suitId) || SUITS[0]; o.jacket = s.jacket; o.pants = s.pants; o.shirt = s.shirt; o.noTie = !!s.noTie; o.style = s.style || 'suit'; break; }
    case 'guest': o.dress = !!looks.female; break;
    case 'vip': o.jacket = [0.06, 0.06, 0.07]; o.pants = o.jacket; o.tie = [0.85, 0.68, 0.2]; o.dress = !!looks.female; if (looks.female) o.jacket = [0.7, 0.1, 0.2]; break;
    case 'waiter': o.jacket = [0.96, 0.96, 0.94]; o.pants = [0.06, 0.06, 0.07]; o.tie = [0.06, 0.06, 0.07]; o.bow = true; o.dress = false; break;
    case 'chef': o.jacket = [0.97, 0.97, 0.96]; o.pants = [0.32, 0.32, 0.34]; o.noTie = true; o.hat = 'chef'; o.shirt = o.jacket; break;
    case 'guard': o.jacket = [0.07, 0.08, 0.11]; o.pants = [0.07, 0.08, 0.11]; o.shirt = [0.1, 0.1, 0.12]; o.tie = [0.06, 0.06, 0.07]; o.hat = 'cap'; break;
    case 'cleaner': o.jacket = [0.18, 0.35, 0.62]; o.pants = [0.18, 0.35, 0.62]; o.shirt = [0.9, 0.9, 0.9]; o.noTie = true; o.hat = 'capb'; break;
    case 'tech': o.jacket = [0.42, 0.44, 0.46]; o.pants = [0.16, 0.16, 0.18]; o.shirt = [0.95, 0.5, 0.1]; o.noTie = true; o.hat = 'hard'; break;
    case 'underwear': o.jacket = [0.95, 0.95, 0.95]; o.pants = null; o.shirt = [0.95, 0.95, 0.95]; o.noTie = true; o.under = true; o.dress = false; break;
  }
  return o;
}

/* ---------------- Character renderer ---------------- */
const _tmp = {};
function drawCharacter(x, y, z, face, looks, outfit, suitId, anim, extra) {
  anim = anim || {};
  const skin = SKINS[looks.skin] || SKINS[0];
  const hc = HAIR_COLS[looks.hairCol] || HAIR_COLS[0];
  const oc = outfitColors(looks, outfit, suitId);
  let root = M4.mul(M4.T(x, y, z), M4.RY(face));
  if (anim.dead) { const k0 = anim.deadK === undefined ? 1 : anim.deadK, k = k0 * k0; root = M4.mul(root, M4.mul(M4.T(0, 0.14 * k, 0.9 * k), M4.RX(-Math.PI / 2 * k))); }
  if (anim.idle === 'sit' && !anim.dead) root = M4.mul(root, M4.T(0, 0.2, -0.42));
  if (anim.drag) root = M4.mul(root, M4.RX(0.18));
  if (anim.carried) root = M4.mul(M4.mul(M4.T(x, y + 1.62, z), M4.RY(face)), M4.mul(M4.RZ(Math.PI / 2), M4.T(0, -0.95, 0)));
  if (anim.fall) root = M4.mul(root, M4.RX(-anim.fall));
  const idle = anim.idle, at = anim.t || 0;
  if (idle === 'dance') root = M4.mul(root, M4.mul(M4.T(0, Math.abs(Math.sin(at * 5)) * 0.09, 0), M4.RY(Math.sin(at * 2.5) * 0.35)));
  const em = extra && extra.emit ? extra.emit : null;
  const P = (piv, rx, off, size, col) => {
    let m = root;
    if (piv) m = M4.mul(m, M4.T(piv[0], piv[1], piv[2]));
    if (rx) m = M4.mul(m, M4.RX(rx));
    m = M4.mul(m, M4.mul(M4.T(off[0], off[1], off[2]), M4.S(size[0], size[1], size[2])));
    Engine.box(m, col, em);
  };
  const sw = anim.walk ? Math.sin(anim.phase) * 0.62 : 0;
  const sitL = anim.idle === 'sit' && !anim.dead ? -1.3 : 0;
  // legs
  const legCol = oc.under ? skin : oc.pants;
  if (oc.dress) {
    P(null, 0, [0, 0.52, 0], [0.5, 0.62, 0.34], oc.jacket);
    P([0.1, 0.25, 0], sw * 0.5, [0, -0.12, 0], [0.16, 0.26, 0.18], skin);
    P([-0.1, 0.25, 0], -sw * 0.5, [0, -0.12, 0], [0.16, 0.26, 0.18], skin);
  } else {
    P([0.11, 0.8, 0], sw + sitL, [0, -0.4, 0], [0.2, 0.8, 0.24], legCol);
    P([-0.11, 0.8, 0], -sw + sitL, [0, -0.4, 0], [0.2, 0.8, 0.24], legCol);
    if (oc.under) { P(null, 0, [0, 0.7, 0], [0.46, 0.22, 0.26], [0.85, 0.85, 0.95]); }
  }
  P([0.11, 0.8, 0], oc.dress ? sitL : sw + sitL, [0, -0.76, 0.03], [0.22, 0.1, 0.3], oc.shoe);
  P([-0.11, 0.8, 0], oc.dress ? sitL : -sw + sitL, [0, -0.76, 0.03], [0.22, 0.1, 0.3], oc.shoe);
  // torso
  const st = oc.style;
  P(null, 0, [0, 1.12, 0], [0.5, 0.66, 0.28], st === 'hoodie' || st === 'burnt' ? oc.shirt : oc.jacket);
  if (st === 'jacket') { P(null, 0, [0, 1.16, 0.142], [0.2, 0.56, 0.02], oc.shirt); P(null, 0, [0.15, 1.42, 0.12], [0.12, 0.08, 0.06], oc.jacket); P(null, 0, [-0.15, 1.42, 0.12], [0.12, 0.08, 0.06], oc.jacket); }
  else if (st === 'hoodie') { P(null, 0, [0.15, 1.12, 0.002], [0.2, 0.62, 0.3], oc.jacket); P(null, 0, [-0.15, 1.12, 0.002], [0.2, 0.62, 0.3], oc.jacket); P(null, 0, [0, 1.5, -0.2], [0.36, 0.22, 0.14], oc.shirt); P(null, 0, [0.06, 1.3, 0.147], [0.02, 0.16, 0.02], [0.8, 0.8, 0.8]); P(null, 0, [-0.06, 1.3, 0.147], [0.02, 0.16, 0.02], [0.8, 0.8, 0.8]); }
  else if (st === 'coat' && !anim.dead) { P(null, 0, [0, 0.66, -0.01], [0.54, 0.42, 0.32], oc.jacket); P(null, 0, [0, 1.47, -0.02], [0.54, 0.12, 0.3], oc.jacket); P(null, 0, [0, 1.16, 0.142], [0.14, 0.5, 0.02], oc.shirt); }
  else if (st === 'tactical') { P(null, 0, [0, 1.17, 0], [0.54, 0.5, 0.33], [0.22, 0.24, 0.17]); for (const px of [-0.14, 0, 0.14]) P(null, 0, [px, 1.05, 0.17], [0.1, 0.12, 0.04], [0.17, 0.19, 0.13]); }
  else if (st === 'burnt') { const so = [0.12, 0.11, 0.1]; P(null, 0, [0.12, 1.0, 0.142], [0.16, 0.14, 0.02], so); P(null, 0, [-0.08, 1.28, 0.142], [0.1, 0.1, 0.02], so); P(null, 0, [-0.14, 0.95, -0.142], [0.14, 0.18, 0.02], so); P(null, 0, [0, 1.3, 0.143], [0.02, 0.26, 0.02], [0.4, 0.37, 0.33]); }
  if (!oc.under && (!st || st === 'suit')) {
    P(null, 0, [0, 1.3, 0.142], [0.14, 0.27, 0.02], oc.shirt);
    if (!oc.noTie) { if (oc.bow) P(null, 0, [0, 1.42, 0.155], [0.14, 0.05, 0.02], oc.tie); else P(null, 0, [0, 1.25, 0.154], [0.055, 0.3, 0.02], oc.tie); }
  }
  if (outfit === 'guard') P(null, 0, [0.12, 1.3, 0.145], [0.08, 0.05, 0.02], [0.8, 0.7, 0.2]);
  // arms
  let armL = anim.aim ? -1.5 : anim.act ? -1.25 : anim.drag ? 0.55 : -sw * 0.8;
  let armR = anim.act ? -1.25 : anim.drag ? 0.55 : sw * 0.8;
  let held = null;
  if (idle && !anim.aim && !anim.act && !anim.dead) {
    const cyc = (at % 5);
    switch (idle) {
      case 'talk': armL = -0.55 - 0.4 * Math.max(0, Math.sin(at * 3)); armR = -0.2 - 0.25 * Math.max(0, Math.sin(at * 2.3 + 1)); break;
      case 'toast': armL = -2.7 + Math.sin(at * 1.5) * 0.15; held = 'glass'; break;
      case 'drink': armL = cyc < 1.1 ? -2.35 : -0.95; held = 'glass'; break;
      case 'smoke': armL = cyc < 1.4 ? -2.4 : -0.7; held = 'cig'; break;
      case 'phone': armL = -2.75; held = 'phone'; break;
      case 'radio': armL = cyc < 1.6 ? -2.7 : 0; break;
      case 'dance': armL = -2.3 + Math.sin(at * 5) * 0.7; armR = -2.3 - Math.sin(at * 5) * 0.7; break;
      case 'tray': armL = -1.45; held = 'tray'; break;
      case 'chop': armL = -1.15 + Math.sin(at * 12) * 0.3; armR = -1.0; held = 'knife'; break;
      case 'wipe': armL = -1.0 + Math.sin(at * 4) * 0.25; break;
      case 'sit': armL = -0.45; armR = -0.45; break;
      case 'struggle': armL = -2.2 + Math.sin(at * 14) * 0.6; armR = -2.0 - Math.sin(at * 13) * 0.6; break;
      case 'blend': armL = -0.9 + Math.sin(at * 3) * 0.2; armR = -0.7; break;
    }
  }
  const sleeve = oc.under ? skin : st === 'hoodie' || st === 'burnt' ? oc.shirt : oc.jacket;
  const acc = looks.acc || null;
  const handC = looks.gloves ? (acc ? accItem('glove', acc.glove).col || [0.05, 0.05, 0.05] : [0.05, 0.05, 0.05]) : skin;
  P([0.33, 1.42, 0], armL, [0, -0.3, 0], [0.16, 0.62, 0.2], sleeve);
  P([0.33, 1.42, 0], armL, [0, -0.64, 0], [0.15, 0.1, 0.17], handC);
  P([-0.33, 1.42, 0], armR, [0, -0.3, 0], [0.16, 0.62, 0.2], st === 'burnt' ? skin : sleeve);
  if (st === 'burnt') P([-0.33, 1.42, 0], armR, [0, -0.08, 0], [0.17, 0.18, 0.21], oc.shirt);
  P([-0.33, 1.42, 0], armR, [0, -0.64, 0], [0.15, 0.1, 0.17], handC);
  if (anim.aim) P([0.33, 1.42, 0], armL, [0, -0.72, 0.08], [0.06, 0.12, 0.22], [0.08, 0.08, 0.09]);
  if (acc && !anim.dead) {
    const wt = accItem('watch', acc.watch); if (wt.col) P([0.33, 1.42, 0], armL, [0, -0.55, 0], [0.18, 0.05, 0.22], wt.col);
    if (!oc.under && outfit === 'suit') {
      const sq = accItem('square', acc.square); if (sq.col) P(null, 0, [-0.15, 1.33, 0.145], [0.09, 0.05, 0.02], sq.col);
      const pn = accItem('pin', acc.pin); if (pn.col) P(null, 0, [-0.15, 1.41, 0.148], [0.05, 0.05, 0.02], pn.col);
    }
    const cs = accItem('case', acc.case); if (cs.col && anim.caseOn) { P([-0.33, 1.42, 0], armR, [0, -0.86, 0], [0.12, 0.36, 0.5], cs.col); P([-0.33, 1.42, 0], armR, [0, -0.66, 0], [0.04, 0.06, 0.16], [0.1, 0.1, 0.1]); }
  }
  if (held === 'glass') { P([0.33, 1.42, 0], armL, [0, -0.72, 0.06], [0.07, 0.14, 0.07], [0.95, 0.75, 0.3]); }
  if (held === 'cig') { P([0.33, 1.42, 0], armL, [0, -0.7, 0.1], [0.02, 0.02, 0.12], [0.95, 0.95, 0.95]); }
  if (held === 'phone') { P([0.33, 1.42, 0], armL, [-0.04, -0.68, 0.04], [0.04, 0.16, 0.09], [0.08, 0.08, 0.1]); }
  if (held === 'tray') { P([0.33, 1.42, 0], armL, [-0.05, -0.7, 0.05], [0.42, 0.03, 0.42], [0.8, 0.8, 0.82]); P([0.33, 1.42, 0], armL, [-0.1, -0.75, 0.05], [0.06, 0.12, 0.06], [0.95, 0.85, 0.4]); }
  if (held === 'knife') { P([0.33, 1.42, 0], armL, [0, -0.72, 0.15], [0.03, 0.02, 0.25], [0.85, 0.87, 0.9]); }
  // head
  P(null, 0, [0, 1.66, 0], [0.38, 0.38, 0.38], skin);
  if (looks.scar && looks.scar !== 'none') {
    const sc = [Math.min(1, skin[0] * 1.08), skin[1] * 0.72, skin[2] * 0.7];
    if (looks.scar === 'cheek') P(null, 0, [0.1, 1.6, 0.192], [0.025, 0.12, 0.02], sc);
    else if (looks.scar === 'brow') P(null, 0, [-0.085, 1.735, 0.192], [0.03, 0.1, 0.02], sc);
    else if (looks.scar === 'lip') P(null, 0, [0.04, 1.56, 0.192], [0.02, 0.08, 0.02], sc);
    else if (looks.scar === 'burn') { P(null, 0, [-0.1, 1.6, 0.191], [0.14, 0.16, 0.02], [skin[0] * 0.85, skin[1] * 0.55, skin[2] * 0.5]); P(null, 0, [-0.192, 1.62, 0.02], [0.02, 0.2, 0.24], [skin[0] * 0.85, skin[1] * 0.55, skin[2] * 0.5]); }
  }
  if (!anim.dead) {
    P(null, 0, [0.085, 1.69, 0.191], [0.065, 0.05, 0.02], [0.08, 0.08, 0.1]);
    P(null, 0, [-0.085, 1.69, 0.191], [0.065, 0.05, 0.02], [0.08, 0.08, 0.1]);
  } else {
    P(null, 0, [0.085, 1.69, 0.191], [0.07, 0.015, 0.02], [0.08, 0.08, 0.1]);
    P(null, 0, [-0.085, 1.69, 0.191], [0.07, 0.015, 0.02], [0.08, 0.08, 0.1]);
  }
  P(null, 0, [0, 1.58, 0.191], [0.12, 0.02, 0.02], [skin[0] * 0.6, skin[1] * 0.45, skin[2] * 0.45]);
  // eyewear
  if (looks.eye === 'shades') { P(null, 0, [0, 1.69, 0.2], [0.34, 0.07, 0.02], [0.05, 0.05, 0.06]); }
  if (looks.eye === 'glasses') { P(null, 0, [0.085, 1.69, 0.2], [0.1, 0.08, 0.01], [0.15, 0.15, 0.15]); P(null, 0, [-0.085, 1.69, 0.2], [0.1, 0.08, 0.01], [0.15, 0.15, 0.15]); }
  // beard
  const bc = [hc[0] * 0.95, hc[1] * 0.95, hc[2] * 0.95];
  switch (looks.beard) {
    case 'stubble': P(null, 0, [0, 1.53, 0.172], [0.36, 0.12, 0.04], [skin[0] * 0.55 + bc[0] * 0.45, skin[1] * 0.55 + bc[1] * 0.45, skin[2] * 0.55 + bc[2] * 0.45]); break;
    case 'moustache': P(null, 0, [0, 1.6, 0.198], [0.2, 0.045, 0.03], bc); break;
    case 'goatee': P(null, 0, [0, 1.6, 0.198], [0.18, 0.04, 0.03], bc); P(null, 0, [0, 1.51, 0.192], [0.12, 0.1, 0.04], bc); break;
    case 'full': P(null, 0, [0, 1.53, 0.17], [0.4, 0.16, 0.08], bc); P(null, 0, [0, 1.6, 0.198], [0.2, 0.045, 0.03], bc); P(null, 0, [0.18, 1.62, 0.06], [0.05, 0.2, 0.25], bc); P(null, 0, [-0.18, 1.62, 0.06], [0.05, 0.2, 0.25], bc); break;
    case 'chinstrap': P(null, 0, [0, 1.49, 0.17], [0.38, 0.05, 0.06], bc); P(null, 0, [0.18, 1.58, 0.06], [0.05, 0.2, 0.25], bc); P(null, 0, [-0.18, 1.58, 0.06], [0.05, 0.2, 0.25], bc); break;
  }
  // hats or hair
  if (oc.hat === 'cap' || oc.hat === 'capb') {
    const hcCol = oc.hat === 'cap' ? [0.05, 0.05, 0.07] : [0.18, 0.35, 0.62];
    P(null, 0, [0, 1.87, 0], [0.41, 0.08, 0.41], hcCol); P(null, 0, [0, 1.84, 0.24], [0.36, 0.03, 0.14], hcCol);
  } else if (oc.hat === 'chef') {
    P(null, 0, [0, 1.95, 0], [0.4, 0.28, 0.4], [0.98, 0.98, 0.98]); P(null, 0, [0, 2.12, 0], [0.46, 0.12, 0.46], [0.98, 0.98, 0.98]);
  } else if (oc.hat === 'hard') {
    P(null, 0, [0, 1.89, 0], [0.43, 0.12, 0.43], [0.98, 0.75, 0.1]); P(null, 0, [0, 1.84, 0.02], [0.48, 0.03, 0.48], [0.98, 0.75, 0.1]);
  } else {
    switch (looks.hair) {
      case 'buzz': P(null, 0, [0, 1.858, 0], [0.392, 0.03, 0.392], hc); P(null, 0, [0, 1.74, -0.193], [0.39, 0.22, 0.02], hc); break;
      case 'slick': P(null, 0, [0, 1.87, -0.01], [0.41, 0.07, 0.41], hc); P(null, 0, [0, 1.72, -0.195], [0.41, 0.3, 0.04], hc); P(null, 0, [0.197, 1.76, -0.05], [0.02, 0.16, 0.28], hc); P(null, 0, [-0.197, 1.76, -0.05], [0.02, 0.16, 0.28], hc); break;
      case 'sidepart': P(null, 0, [0, 1.87, -0.01], [0.41, 0.07, 0.41], hc); P(null, 0, [0.06, 1.82, 0.19], [0.28, 0.07, 0.05], hc); P(null, 0, [0, 1.72, -0.195], [0.41, 0.3, 0.04], hc); P(null, 0, [0.197, 1.76, -0.02], [0.02, 0.16, 0.34], hc); P(null, 0, [-0.197, 1.76, -0.02], [0.02, 0.16, 0.34], hc); break;
      case 'spiky': P(null, 0, [0, 1.87, 0], [0.41, 0.06, 0.41], hc); for (let i = 0; i < 5; i++) P(null, 0, [-0.14 + i * 0.07, 1.93, -0.02 + (i % 2) * 0.08], [0.08, 0.1, 0.08], hc); P(null, 0, [0, 1.74, -0.193], [0.39, 0.22, 0.03], hc); break;
      case 'long': P(null, 0, [0, 1.87, 0], [0.42, 0.07, 0.42], hc); P(null, 0, [0, 1.56, -0.2], [0.42, 0.62, 0.06], hc); P(null, 0, [0.205, 1.66, -0.02], [0.04, 0.42, 0.36], hc); P(null, 0, [-0.205, 1.66, -0.02], [0.04, 0.42, 0.36], hc); break;
      case 'ponytail': P(null, 0, [0, 1.87, 0], [0.41, 0.07, 0.41], hc); P(null, 0, [0, 1.72, -0.195], [0.41, 0.3, 0.04], hc); P(null, 0, [0, 1.6, -0.25], [0.11, 0.36, 0.11], hc); break;
      case 'mohawk': P(null, 0, [0, 1.93, -0.02], [0.1, 0.14, 0.42], hc); break;
      case 'afro': P(null, 0, [0, 1.88, -0.03], [0.52, 0.26, 0.52], hc); P(null, 0, [0, 1.7, -0.22], [0.5, 0.3, 0.08], hc); break;
    }
  }
  // earpiece for guards & bodyguards
  if (outfit === 'guard') P(null, 0, [0.2, 1.66, 0.02], [0.03, 0.06, 0.04], [0.1, 0.1, 0.1]);
}

/* ---------------- Prop renderer ---------------- */
// colour-coded interaction categories
const ACT_COLORS = { item: [0.0, 0.72, 1.0], disguise: [0.1, 0.95, 0.25], opp: [1.0, 0.1, 0.16], hide: [0.68, 0.28, 1.0], station: [0.4, 0.8, 1.0], door: [1.0, 0.5, 0.05], distract: [1.0, 0.88, 0.1], blend: [0.92, 0.92, 1.0] };
const ACT_CSS = { item: '#4cd9ff', disguise: '#5cff73', opp: '#ff4757', hide: '#c780ff', station: '#66ccff', door: '#ff8a1a', distract: '#ffe14d', blend: '#ececff' };
function propCategory(pr) {
  if (!pr || !pr.type) return null;
  if (pr.type === 'item') return 'item';
  if (pr.type === 'disguise') return 'disguise';
  if (pr.type === 'container') return 'hide';
  if (pr.type === 'station') return 'station';
  if (['consumable', 'stove', 'winch', 'sauna', 'speaker', 'chandelier', 'sig'].includes(pr.type)) return 'opp';
  if (pr.type === 'door') return 'door';
  if (['radio', 'fusebox', 'caralarm'].includes(pr.type)) return 'distract';
  if (pr.type === 'blend') return 'blend';
  return null;
}
function propSpent(pr) { return pr.used || pr.sabotaged || pr.poison || pr.consumed || pr.dropped || pr.on || (pr.type === 'door' && !pr.door.locked); }
function drawProp(pr, t, hl) {
  if (pr.gone) return;
  const [x, y, z] = pr.p;
  const hc = Array.isArray(hl) ? hl : [1, 0.85, 0.3];
  const em = null;
  const ow = hl ? (0.065 + 0.015 * Math.sin(t * 5)) * (pr.olz || 1) : 0, ok = 1.2 + 0.25 * Math.sin(t * 5);
  const bx = (ox, oy, oz, sx, sy, sz, col, e, a) => {
    Engine.box(M4.mul(M4.T(x + ox, y + oy, z + oz), M4.S(sx, sy, sz)), col, e || em, a);
    if (hl && (a === undefined || a >= 1)) Engine.outline(M4.mul(M4.T(x + ox, y + oy, z + oz), M4.S(sx + ow * 2, sy + ow * 2, sz + ow * 2)), hc, ok);
  };
  switch (pr.type) {
    case 'consumable':
      if (pr.model === 'cocktail') { bx(0, 0.02, 0, 0.12, 0.04, 0.12, [0.9, 0.9, 0.95]); bx(0, 0.12, 0, 0.04, 0.16, 0.04, [0.9, 0.9, 0.95]); bx(0, 0.25, 0, 0.16, 0.1, 0.16, pr.poison ? [0.4, 0.9, 0.3] : [0.95, 0.35, 0.5]); }
      else if (pr.model === 'plate') { bx(0, 0.02, 0, 0.6, 0.04, 0.6, [0.96, 0.96, 0.96]); for (let i = 0; i < 5; i++) bx(-0.2 + i * 0.1, 0.07, (i % 2) * 0.12 - 0.06, 0.08, 0.06, 0.08, pr.poison ? [0.5, 0.8, 0.3] : [0.9, 0.6, 0.3]); }
      else { bx(0, 0.18, 0, 0.12, 0.36, 0.12, [0.65, 0.35, 0.1]); bx(0, 0.4, 0, 0.05, 0.1, 0.05, [0.2, 0.12, 0.06]); bx(0.2, 0.06, 0, 0.1, 0.12, 0.1, [0.85, 0.9, 0.95]); }
      break;
    case 'item': {
      const it = pr.item;
      if (it === 'poison') { bx(0, 0.15, 0, 0.16, 0.3, 0.16, [0.2, 0.7, 0.25]); bx(0, 0.16, 0.081, 0.12, 0.1, 0.01, [0.95, 0.95, 0.95]); }
      else if (it === 'emetic') { bx(0, 0.06, 0, 0.22, 0.12, 0.14, [0.95, 0.85, 0.3]); bx(0, 0.06, 0.071, 0.1, 0.04, 0.01, [0.8, 0.2, 0.2]); }
      else if (it === 'wrench') { bx(0, 0.03, 0, 0.5, 0.05, 0.08, [0.6, 0.62, 0.66]); bx(0.25, 0.03, 0, 0.12, 0.05, 0.16, [0.6, 0.62, 0.66]); }
      else if (it === 'knife') { bx(0, 0.02, 0, 0.32, 0.03, 0.06, [0.85, 0.87, 0.9]); bx(-0.2, 0.03, 0, 0.14, 0.05, 0.07, [0.15, 0.1, 0.08]); }
      else if (it === 'pistol') { bx(0, 0.04, 0, 0.32, 0.08, 0.08, [0.1, 0.1, 0.11]); bx(-0.1, 0.04, 0.08, 0.08, 0.06, 0.16, [0.1, 0.1, 0.11]); }
      else if (it === 'coin') { for (let i = 0; i < 3; i++) bx(-0.1 + i * 0.1, 0.02, 0, 0.08, 0.02, 0.08, [0.95, 0.78, 0.25]); }
      else bx(0, 0.1, 0, 0.2, 0.2, 0.2, [0.8, 0.8, 0.8]);
      break;
    }
    case 'disguise': {
      const oc = outfitColors({ jacket: [0.5, 0.5, 0.5], tie: 0 }, pr.outfit);
      bx(0, 0.08, 0, 0.55, 0.16, 0.42, oc.jacket); bx(0, 0.19, 0, 0.5, 0.06, 0.38, oc.pants || oc.jacket);
      if (oc.hat === 'chef') bx(0.15, 0.3, 0, 0.18, 0.18, 0.18, [0.98, 0.98, 0.98]);
      if (oc.hat === 'cap' || oc.hat === 'capb') bx(0.15, 0.25, 0, 0.2, 0.06, 0.2, oc.hat === 'cap' ? [0.05, 0.05, 0.07] : [0.18, 0.35, 0.62]);
      break;
    }
    case 'container': {
      const full = (pr.count || 0) >= pr.cap;
      if (pr.model === 'dumpster') { bx(0, 0.55, 0, 1.6, 1.1, 1.0, [0.15, 0.4, 0.22]); bx(0, 1.12, 0, 1.64, 0.06, 1.04, [0.08, 0.2, 0.1]); }
      else if (pr.model === 'freezer') { bx(0, 0.95, 0, 0.95, 1.9, 0.8, [0.85, 0.88, 0.92]); bx(0.4, 1.0, 0.41, 0.05, 0.5, 0.05, [0.4, 0.4, 0.42]); }
      else if (pr.model === 'cart') { bx(0, 0.45, 0, 0.9, 0.7, 0.6, [0.25, 0.35, 0.6]); bx(0, 0.82, 0, 0.8, 0.1, 0.5, [0.95, 0.95, 0.95]); }
      else if (pr.model === 'crate') { bx(0, 0.45, 0, 0.9, 0.9, 0.9, [0.6, 0.45, 0.25]); }
      else { bx(0, 0.95, 0, 0.9, 1.9, 0.6, [0.45, 0.3, 0.18]); bx(0, 0.95, 0.305, 0.02, 1.7, 0.01, [0.2, 0.12, 0.06]); }
      if (full) bx(0, 2.0, 0, 0.12, 0.12, 0.12, [0.9, 0.2, 0.2], [1, 0.2, 0.2, 0.5]);
      break;
    }
    case 'stove': { bx(-0.2, 0.03, 0.3, 0.1, 0.06, 0.1, [0.15, 0.15, 0.15]); bx(0.2, 0.03, 0.3, 0.1, 0.06, 0.1, pr.sabotaged ? [0.9, 0.2, 0.1] : [0.15, 0.15, 0.15]); if (pr.sabotaged) bx(0, 0.4 + 0.1 * Math.sin(t * 6), 0, 0.3, 0.3, 0.3, [0.7, 0.85, 0.7], [0.4, 0.6, 0.4, 0.2], 0.25); break; }
    case 'chandelier': {
      const yy = pr.dropY !== undefined ? pr.dropY : 0;
      const e2 = [1, 0.9, 0.5, pr.dropped ? 0.1 : 0.7];
      if (!pr.dropped) bx(0, 0.75 + yy, 0, 0.05, 0.5, 0.05, [0.6, 0.5, 0.2]);
      bx(0, 0.4 + yy, 0, 1.6, 0.1, 1.6, [0.9, 0.72, 0.25], em);
      bx(0, 0.25 + yy, 0, 1.2, 0.22, 1.2, [1, 0.95, 0.75], e2);
      bx(0, 0.05 + yy, 0, 0.5, 0.25, 0.5, [1, 0.95, 0.8], e2);
      break;
    }
    case 'winch': { bx(0, 0.6, 0, 0.5, 1.2, 0.35, [0.25, 0.25, 0.28]); bx(0, 1.0, 0.2, 0.08, 0.35, 0.08, pr.used ? [0.3, 0.3, 0.3] : [0.9, 0.15, 0.1]); break; }
    case 'sauna': { bx(0, 0.0, 0, 0.12, 0.5, 0.4, [0.3, 0.3, 0.32]); bx(0.07, 0.05, 0, 0.02, 0.2, 0.2, pr.sabotaged ? [1, 0.2, 0.1] : [0.2, 0.9, 0.3], [1, 0.4, 0.1, pr.sabotaged ? 0.6 : 0]); break; }
    case 'speaker': {
      const off = pr.fallT !== undefined ? Math.min(1, pr.fallT) : 0;
      Engine.box(M4.mul(M4.T(x, y + 0.4 - off * 1.2, z + off * 1.3), M4.mul(M4.RX(off * 1.4), M4.S(0.55, 0.8, 0.5))), [0.08, 0.08, 0.09], em);
      if (hl) Engine.outline(M4.mul(M4.T(x, y + 0.4 - off * 1.2, z + off * 1.3), M4.mul(M4.RX(off * 1.4), M4.S(0.55 + ow * 2, 0.8 + ow * 2, 0.5 + ow * 2))), hc, ok);
      Engine.box(M4.mul(M4.T(x, y + 0.45 - off * 1.2, z + 0.26 + off * 1.3), M4.S(0.3, 0.3, 0.02)), [0.3, 0.3, 0.32], em);
      break;
    }
    case 'station': drawStation(pr, t, hl); break;
    case 'sig': {
      const S = pr.sig, c = S.col;
      if (S.type === 'drop') {
        const yy = pr.dropY || 0;
        if (!pr.dropped) bx(0, 0.75, 0, 0.05, 1.0, 0.05, [0.3, 0.3, 0.3]);
        bx(0, 0.15 + yy, 0, 1.0, 0.5, 1.0, c); bx(0, 0.45 + yy, 0, 0.7, 0.15, 0.7, [c[0] * 0.7, c[1] * 0.7, c[2] * 0.7]);
      } else {
        bx(0, S.h / 2, 0, 0.75, S.h, 0.6, c); bx(0, S.h + 0.04, 0, 0.82, 0.08, 0.66, [c[0] * 0.6, c[1] * 0.6, c[2] * 0.6]);
        if (pr.sabotaged) bx(0, S.h * 0.6, 0.31, 0.12, 0.12, 0.02, [1, 0.2, 0.1], [1, 0.3, 0.1, 0.8]);
      }
      break;
    }
    case 'radio': bx(0, 0.15, 0, 0.45, 0.3, 0.2, [0.25, 0.2, 0.16]); bx(0.1, 0.16, 0.101, 0.14, 0.14, 0.01, [0.6, 0.6, 0.6]); if (pr.on) bx(-0.12, 0.2, 0.101, 0.06, 0.06, 0.01, [0.2, 1, 0.3], [0.2, 1, 0.3, 0.9]); break;
    case 'fusebox': bx(0, 1.1, 0, 0.5, 0.7, 0.18, [0.4, 0.42, 0.45]); bx(0, 1.1, 0.091, 0.3, 0.06, 0.01, pr.on ? [1, 0.2, 0.1] : [0.2, 0.9, 0.3], [0.5, 0.5, 0.5, 0.4]); break;
    case 'caralarm': if (pr.on) bx(0, 0.6, 0, 0.3, 0.1, 0.3, [1, 0.6, 0.1], [1, 0.6, 0.1, (Math.sin(t * 12) > 0) ? 1 : 0.1]); else bx(0, 0.55, 0, 0.12, 0.06, 0.12, [0.9, 0.1, 0.1]); break;
    case 'blend': bx(0, 0.02, 0, 0.7, 0.04, 0.7, [0.9, 0.9, 1], null, 0.35); break;
    case 'charge': bx(0, 0.06, 0, 0.25, 0.12, 0.18, [0.2, 0.25, 0.2], [1, 0.1, 0.1, 0.4 + 0.4 * Math.sin(t * 8)]); break;
    case 'coinFly': bx(0, 0, 0, 0.1, 0.03, 0.1, [0.95, 0.78, 0.25]); break;
  }
}
function drawStation(pr, t, hl) {
  const [x, y, z] = pr.p;
  const em = null, hc = [0.4, 0.8, 1], ow = 0.04 + 0.012 * Math.sin(t * 4);
  const bx = (ox, oy, oz, sx, sy, sz, col, e) => { Engine.box(M4.mul(M4.T(x + ox, y + oy, z + oz), M4.S(sx, sy, sz)), col, e || em); if (hl && !e) Engine.outline(M4.mul(M4.T(x + ox, y + oy, z + oz), M4.S(sx + ow * 2, sy + ow * 2, sz + ow * 2)), hc, 0.9); };
  switch (pr.st) {
    case 'wardrobe': bx(0, 1.0, -0.3, 2.2, 2.0, 0.5, [0.35, 0.22, 0.14]); bx(0, 1.0, -0.04, 0.8, 1.6, 0.02, [0.75, 0.85, 0.95], [0.6, 0.7, 0.8, 0.25]);
      for (let i = 0; i < 3; i++) bx(-0.8 + i * 0.8 + (i > 0 ? 0.4 : 0) - (i > 0 ? 0.4 : 0), 1.2, 0.05, 0.12, 0.8, 0.3, [0.1 + i * 0.3, 0.1, 0.12]); break;
    case 'armory': bx(0, 1.2, -0.2, 3.0, 2.2, 0.2, [0.18, 0.18, 0.2]);
      for (let i = 0; i < 4; i++) { bx(-1.1 + i * 0.73, 1.5, -0.05, 0.45, 0.12, 0.1, [0.08, 0.08, 0.09]); bx(-1.25 + i * 0.73, 1.38, -0.05, 0.1, 0.22, 0.1, [0.08, 0.08, 0.09]); }
      bx(0, 0.45, 0.2, 2.6, 0.9, 0.5, [0.3, 0.3, 0.32]); break;
    case 'gear': bx(0, 1.0, 0, 1.4, 2.0, 0.7, [0.32, 0.36, 0.3]); bx(0, 1.0, 0.36, 0.02, 1.8, 0.01, [0.1, 0.1, 0.1]); break;
    case 'contracts': bx(0, 0.45, 0, 2.6, 0.9, 1.6, [0.25, 0.18, 0.12]); bx(0, 0.92, 0, 2.3, 0.04, 1.3, [0.15, 0.4, 0.55], [0.2, 0.6, 0.9, 0.35 + 0.15 * Math.sin(t * 2)]);
      for (let i = 0; i < 6; i++) bx(-0.9 + i * 0.36, 0.96, -0.3 + (i % 3) * 0.3, 0.06, 0.06, 0.06, [1, 0.2, 0.2], [1, 0.2, 0.2, 0.8]); break;
    case 'upgrades': bx(0, 0.45, 0, 1.6, 0.9, 0.8, [0.2, 0.2, 0.22]); bx(0, 1.15, -0.2, 0.7, 0.45, 0.04, [0.1, 0.6, 0.4], [0.2, 1, 0.6, 0.5]); bx(0, 0.93, 0.05, 0.6, 0.03, 0.3, [0.15, 0.15, 0.16]); break;
  }
}

/* ---------- signature kills: one unique opportunity per city ---------- */
const SIGNATURES = {
  london: { name: 'Grandfather Clock', label: 'Admiring the antique grandfather clock', type: 'rig', col: [0.42, 0.26, 0.12], h: 2.3, verb: 'Loosen the clock\'s bolts', rooms: ['lobby', 'gallery', 'lounge'] },
  paris: { name: 'Antique Snuff Box', label: 'Sampling the antique snuff', type: 'poison', col: [0.9, 0.6, 0.85], h: 1.1, verb: 'Poison the snuff box', rooms: ['ballroom', 'lounge', 'lobby'] },
  dubai: { name: 'Gold Massage Chair', label: 'Relaxing in the gold massage chair', type: 'rig', col: [0.95, 0.75, 0.25], h: 1.2, verb: 'Overload the massage chair', rooms: ['lounge', 'skylounge', 'lobby'] },
  tokyo: { name: 'VIP Bottle Service', label: 'Tasting the VIP bottle service', type: 'poison', col: [0.95, 0.95, 0.9], h: 1.0, verb: 'Spike the champagne', rooms: ['bar', 'lounge', 'ballroom'] },
  newyork: { name: 'Engine Hoist', label: 'Admiring the car on the engine hoist', type: 'drop', col: [0.95, 0.85, 0.5], h: 0.6, verb: 'Release the engine hoist', rooms: ['ballroom', 'lobby'] },
  rome: { name: 'Patio Heater Stack', label: 'Warming up by the patio heaters', type: 'drop', col: [0.45, 0.28, 0.14], h: 0.6, verb: 'Release the heater stack', rooms: ['bar', 'court', 'lobby'] },
  monaco: { name: 'Roulette Wheel', label: 'Spinning the roulette wheel', type: 'rig', col: [0.1, 0.4, 0.2], h: 1.0, verb: 'Wire the roulette wheel', rooms: ['ballroom', 'lounge'] },
  marrakech: { name: 'Whisky Decanter', label: 'Pouring a forty-year-old whisky', type: 'poison', col: [0.3, 0.6, 0.65], h: 1.2, verb: 'Poison the decanter', rooms: ['court', 'lounge', 'lobby'] },
  mumbai: { name: 'Award Projector', label: 'Checking his award slideshow', type: 'rig', col: [0.2, 0.2, 0.22], h: 1.4, verb: 'Short-circuit the projector', rooms: ['ballroom', 'lobby'] },
  rio: { name: 'Winner\'s Fireworks', label: 'Lighting the winner\'s fireworks', type: 'rig', col: [0.85, 0.25, 0.15], h: 0.9, verb: 'Rig the fireworks fuse', rooms: ['ballroom', 'lobby'] },
  hongkong: { name: 'Evidence Shredder', label: 'Feeding files to the shredder', type: 'rig', col: [0.2, 0.55, 0.85], h: 1.8, verb: 'Wire the shredder', rooms: ['lobby', 'lounge', 'privatebar'] },
  berlin: { name: 'Ring Floodlights', label: 'Checking the ring floodlights', type: 'rig', col: [0.15, 0.15, 0.2], h: 1.1, verb: 'Wire the floodlight rig', rooms: ['ballroom', 'lounge'] },
  sydney: { name: 'Ceiling Hoist', label: 'Standing under the patient hoist', type: 'drop', col: [0.35, 0.35, 0.4], h: 0.6, verb: 'Cut the hoist cable', rooms: ['lobby', 'ballroom', 'gallery'] },
  istanbul: { name: 'Rooftop Boiler', label: 'Warming up by the rooftop boiler', type: 'rig', col: [0.7, 0.45, 0.3], h: 1.6, verb: 'Jam the boiler valve', rooms: ['court', 'lounge', 'lobby'] },
  venice: { name: 'Iris\'s Tea', label: 'Making tea in the kitchen', type: 'poison', col: [0.95, 0.78, 0.25], h: 1.2, verb: 'Poison the tea', rooms: ['ballroom', 'lounge', 'gallery'] }
};
/* ---------- cosmetics ---------- */
const ACCESSORIES = {
  watch: { name: 'Watch', items: [{ id: 'none', name: 'None', price: 0 }, { id: 'silver', name: 'Silver', price: 3000, col: [0.8, 0.82, 0.86] }, { id: 'gold', name: 'Gold', price: 8000, col: [0.95, 0.75, 0.25] }, { id: 'diamond', name: 'Diamond', price: 25000, stars: 20, col: [0.75, 0.95, 1.0] }] },
  square: { name: 'Pocket Square', items: [{ id: 'none', name: 'None', price: 0 }, { id: 'white', name: 'White', price: 1500, col: [0.96, 0.96, 0.96] }, { id: 'red', name: 'Red', price: 1500, col: [0.8, 0.08, 0.12] }, { id: 'gold', name: 'Gold', price: 3000, col: [0.95, 0.75, 0.25] }] },
  pin: { name: 'Lapel Pin', items: [{ id: 'none', name: 'None', price: 0 }, { id: 'rose', name: 'Red Rose', price: 2500, stars: 6, col: [0.85, 0.08, 0.15] }, { id: 'gold', name: 'Gold Pin', price: 5000, col: [0.95, 0.75, 0.25] }, { id: 'skull', name: 'Silver Skull', price: 10000, stars: 30, col: [0.88, 0.88, 0.9] }] },
  glove: { name: 'Gloves', items: [{ id: 'black', name: 'Black Leather', price: 0, col: [0.05, 0.05, 0.05] }, { id: 'brown', name: 'Brown', price: 2000, col: [0.35, 0.2, 0.1] }, { id: 'white', name: 'White', price: 2000, col: [0.92, 0.92, 0.9] }, { id: 'red', name: 'Crimson', price: 6000, stars: 15, col: [0.6, 0.05, 0.1] }] },
  case: { name: 'Briefcase (hideout)', items: [{ id: 'none', name: 'None', price: 0 }, { id: 'leather', name: 'Leather', price: 4000, col: [0.32, 0.18, 0.08] }, { id: 'chrome', name: 'Chrome', price: 12000, stars: 12, col: [0.78, 0.8, 0.84] }] }
};
const accItem = (slot, id) => ACCESSORIES[slot].items.find(i => i.id === id) || ACCESSORIES[slot].items[0];
const DIFFS = {
  casual: { name: 'Casual', susp: 0.6, dmg: 0.5, pay: 0.8, desc: 'Guards are slower to notice you and hit softer.' },
  pro: { name: 'Professional', susp: 1, dmg: 1, pay: 1, desc: 'The intended experience.' },
  master: { name: 'Master', susp: 1.45, dmg: 1.6, pay: 1.5, desc: 'More guards, sharper eyes, decoys, no full guidance. +50% pay.' }
};
const WEEKLY_RULES = [
  { id: 'suit', text: 'Own clothes only: no disguises', check: S => S.suitOnly, live: S => S.suitOnly },
  { id: 'unseen', text: 'Never be spotted', check: S => !S.spotted, live: S => !S.spotted },
  { id: 'accident', text: 'Kill the target with an accident', check: S => S.method === 'accident' },
  { id: 'poison', text: 'Kill the target with poison', check: S => S.method === 'poison' },
  { id: 'nogun', text: 'No pistol shots', check: S => !S.usedGun, live: S => !S.usedGun },
  { id: 'noko', text: 'Do not subdue anyone', check: S => !S.kos, live: S => !S.kos },
  { id: 'clean', text: 'No non-target kills', check: S => !S.nonTarget, live: S => !S.nonTarget },
  { id: 'fast', text: 'Finish within 7 minutes', check: S => S.t <= 420, live: S => S.t <= 420 }
];

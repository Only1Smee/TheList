'use strict';
/* =========================================================
   THE LIST — Map generation: 15 venues + safehouse
   ========================================================= */
const MAP_W = 120, MAP_H = 58, MAP_D = 120, G = 3, FH = 4;
let BX = 40, BZ = 42, BW = 40, BD = 30; // current venue frame (set per map)

const TIMES = {
  day: { sun: [0.5, 0.85, 0.3], sunCol: [1.05, 1.0, 0.92], sky: [0.7, 0.78, 0.92], ground: [0.5, 0.45, 0.38], amb: 0.78, fog: [0.76, 0.84, 0.94], fogN: 50, fogF: 140, skyTop: [0.28, 0.52, 0.9], skyBot: [0.8, 0.88, 0.97], night: 0, lamp: 0.5 },
  sunset: { sun: [0.75, 0.32, 0.35], sunCol: [1.25, 0.78, 0.48], sky: [0.72, 0.62, 0.68], ground: [0.5, 0.4, 0.34], amb: 0.74, fog: [0.92, 0.66, 0.52], fogN: 45, fogF: 130, skyTop: [0.28, 0.3, 0.62], skyBot: [1.0, 0.62, 0.42], night: 0, lamp: 0.8 },
  dusk: { sun: [-0.4, 0.42, 0.6], sunCol: [1.0, 0.78, 0.72], sky: [0.6, 0.6, 0.76], ground: [0.38, 0.33, 0.36], amb: 0.74, fog: [0.5, 0.47, 0.62], fogN: 40, fogF: 120, skyTop: [0.12, 0.15, 0.38], skyBot: [0.72, 0.48, 0.52], night: 0, lamp: 1.0 },
  night: { sun: [0.3, 0.8, -0.45], sunCol: [0.6, 0.68, 0.92], sky: [0.46, 0.5, 0.7], ground: [0.26, 0.22, 0.26], amb: 0.72, fog: [0.1, 0.11, 0.2], fogN: 35, fogF: 115, skyTop: [0.02, 0.03, 0.09], skyBot: [0.1, 0.12, 0.26], night: 1, lamp: 1.3 },
  rain: { sun: [0.3, 0.85, 0.2], sunCol: [0.55, 0.6, 0.72], sky: [0.45, 0.5, 0.58], ground: [0.25, 0.25, 0.28], amb: 0.68, fog: [0.22, 0.25, 0.3], fogN: 28, fogF: 100, skyTop: [0.1, 0.12, 0.16], skyBot: [0.24, 0.27, 0.32], night: 0, lamp: 1.2, rain: 1 },
  storm: { sun: [0.25, 0.85, 0.3], sunCol: [0.36, 0.4, 0.55], sky: [0.38, 0.42, 0.52], ground: [0.22, 0.22, 0.25], amb: 0.6, fog: [0.12, 0.14, 0.18], fogN: 25, fogF: 95, skyTop: [0.03, 0.04, 0.06], skyBot: [0.13, 0.15, 0.19], night: 0, lamp: 1.3, rain: 1.6, lightning: 1 }
};

const CITIES = [
  { id: 'berlin', name: 'London', country: 'England', venue: 'Royal Docks Fight Night', blurb: 'An illegal fight night in a derelict dockside warehouse. Cash on the floor, blood on the canvas.', time: 'night', floors: 3,
    wall: 'BRICK', trim: 'METAL_D', inner: 'CONCRETE', floor: 'CONCRETE', carpet: 'CARPET_K', roof: 'ROOF_B', ground: 'CONCRETE', plaza: 'CONCRETE', fence: 'RAIL', envL: 'parking', envR: 'neon', landmark: 'skyline', filler: 'CONCRETE' },
  { id: 'newyork', name: 'London', country: 'England', venue: 'Hackney Midnight Car Meet', blurb: 'A street-racing meet under the railway arches. Loud engines, louder money.', time: 'rain', floors: 4,
    wall: 'BRICK', trim: 'STONE', inner: 'CONCRETE', floor: 'CONCRETE', carpet: 'CARPET_B', roof: 'ROOF_B', ground: 'CONCRETE', plaza: 'PAVE', fence: 'RAIL', envL: 'parking', envR: 'parking', landmark: 'tvtower', filler: 'BRICK_Y' },
  { id: 'tokyo', name: 'London', country: 'England', venue: 'Club Vaultline, Soho', blurb: 'Five floors of noise owned by the man who led the crew to your brother\'s flat.', time: 'night', floors: 4,
    wall: 'TOWER_D', trim: 'RED', inner: 'CONCRETE', floor: 'WOOD_D', carpet: 'CARPET_K', roof: 'ROOF_B', ground: 'CONCRETE', plaza: 'STONE', fence: 'RAIL', envL: 'neon', envR: 'neon', landmark: 'neonskyline', filler: 'TOWER_D' },
  { id: 'paris', name: 'London', country: 'England', venue: 'Harcourt\'s Auction House, Mayfair', blurb: 'Old masters on the walls upstairs. Rifles in the crates downstairs.', time: 'dusk', floors: 3,
    wall: 'SANDSTONE', trim: 'WHITE', inner: 'PLASTER', floor: 'WOOD_D', carpet: 'CARPET_R', roof: 'ROOF_S', ground: 'GRASS', plaza: 'PAVE', fence: 'RAIL', envL: 'park', envR: 'formal', landmark: 'clocktower', filler: 'SANDSTONE' },
  { id: 'london', name: 'Surrey', country: 'England', venue: 'Ashcombe Manor Wedding', blurb: 'Two hundred guests, a string quartet, and the groom who burned your home.', time: 'sunset', floors: 3,
    wall: 'BRICK', trim: 'WHITE', inner: 'PLASTER', floor: 'WOOD_D', carpet: 'CARPET_R', roof: 'ROOF_S', ground: 'GRASS', plaza: 'PAVE', fence: 'HEDGE', envL: 'formal', envR: 'parking', landmark: 'none', filler: 'BRICK_Y' },
  { id: 'mumbai', name: 'Birmingham', country: 'England', venue: 'Fire Service Gala, Council House', blurb: 'The fire service honours its finest. One of them signed three lies.', time: 'sunset', floors: 3,
    wall: 'SANDSTONE', trim: 'WHITE', inner: 'PLASTER', floor: 'MARBLE', carpet: 'CARPET_R', roof: 'ROOF_S', ground: 'GRASS', plaza: 'PAVE', fence: 'RAIL', envL: 'canal', envR: 'parking', landmark: 'skyline', filler: 'BRICK' },
  { id: 'sydney', name: 'Leeds', country: 'England', venue: 'St Bride\'s Hospital, Night Shift', blurb: 'Long corridors, flickering lights and a coroner who signs without looking.', time: 'rain', floors: 3,
    wall: 'WHITE', trim: 'BLUE', inner: 'PLASTER', floor: 'TILE_B', carpet: 'CARPET_B', roof: 'ROOF_S', ground: 'CONCRETE', plaza: 'PAVE', fence: 'RAIL', envL: 'parking', envR: 'park', landmark: 'skyline', filler: 'BRICK' },
  { id: 'hongkong', name: 'Manchester', country: 'England', venue: 'Police HQ Retirement Party', blurb: 'Every guest is police. The guest of honour buried three murders.', time: 'night', floors: 4,
    wall: 'TOWER_D', trim: 'METAL_D', inner: 'PLASTER', floor: 'MARBLE_B', carpet: 'CARPET_B', roof: 'ROOF_B', ground: 'CONCRETE', plaza: 'STONE', fence: 'RAIL', envL: 'parking', envR: 'neon', landmark: 'neonskyline', filler: 'BRICK' },
  { id: 'rio', name: 'Liverpool', country: 'England', venue: 'Kingsmere Racecourse, Race Day', blurb: 'Champagne in the private boxes, mud on the track, a planner with a stopwatch.', time: 'day', floors: 3,
    wall: 'PLASTER', trim: 'WHITE', inner: 'PLASTER', floor: 'WOOD_L', carpet: 'CARPET_G', roof: 'ROOF_G', ground: 'GRASS', plaza: 'PAVE', fence: 'RAIL_W', envL: 'formal', envR: 'parking', landmark: 'none', filler: 'BRICK' },
  { id: 'istanbul', name: 'Edinburgh', country: 'Scotland', venue: 'Halloran Chambers Rooftop Party', blurb: 'A law firm celebrates on the roof of its old stone chambers.', time: 'dusk', floors: 3,
    wall: 'STONE', trim: 'SANDSTONE', inner: 'PLASTER', floor: 'WOOD_D', carpet: 'CARPET_R', roof: 'ROOF_S', ground: 'GRASS', plaza: 'STONE', fence: 'RAIL', envL: 'formal', envR: 'plaza', landmark: 'campanile', filler: 'STONE' },
  { id: 'rome', name: 'Marbella', country: 'Spain', venue: 'Villa Solana Pool Party', blurb: 'White walls, palm trees and a broker hiding behind new teeth.', time: 'sunset', floors: 3,
    wall: 'WHITE', trim: 'TERRA', inner: 'PLASTER', floor: 'TILE_T', carpet: 'CARPET_R', roof: 'ROOF_R', ground: 'GRASS', plaza: 'SANDSTONE', fence: 'HEDGE', envL: 'palms', envR: 'plaza', landmark: 'sugarloaf', filler: 'TERRA' },
  { id: 'monaco', name: 'Monaco', country: 'Monaco', venue: 'Thorne\'s Private Casino Night', blurb: 'High stakes, superyachts and the banker who paid for three fires.', time: 'night', floors: 3,
    wall: 'PLASTER', trim: 'GOLD', inner: 'PLASTER', floor: 'MARBLE', carpet: 'CARPET_R', roof: 'COPPER', ground: 'GRASS', plaza: 'MARBLE', fence: 'RAIL_W', envL: 'palms', envR: 'parking', landmark: 'casino', filler: 'PLASTER' },
  { id: 'dubai', name: 'Dubai', country: 'UAE', venue: 'The Board\'s Summit', blurb: 'Glass, gold and the people who decided your family was a loose end.', time: 'day', floors: 4,
    wall: 'TOWER_W', trim: 'GOLD', inner: 'MARBLE', floor: 'MARBLE', carpet: 'CARPET_K', roof: 'MARBLE', ground: 'SAND', plaza: 'MARBLE', fence: 'RAIL_G', envL: 'palms', envR: 'parking', landmark: 'burj', filler: 'TOWER' },
  { id: 'venice', name: 'London', country: 'England', venue: 'Little Venice Safehouse', blurb: 'A canal-side warehouse in the rain. Iris said she wouldn\'t run.', time: 'rain', floors: 3,
    wall: 'BRICK', trim: 'STONE', inner: 'PLASTER', floor: 'WOOD_D', carpet: 'CARPET_B', roof: 'ROOF_S', ground: 'STONE', plaza: 'STONE', fence: 'RAIL', envL: 'canal', envR: 'canal', landmark: 'none', filler: 'BRICK_Y' },
  { id: 'marrakech', name: 'Highlands', country: 'Scotland', venue: 'Glencairn Estate', blurb: 'A stone estate above a black loch. The man who made you is waiting.', time: 'storm', floors: 3,
    wall: 'STONE', trim: 'SANDSTONE', inner: 'PLASTER', floor: 'WOOD_D', carpet: 'CARPET_R', roof: 'ROOF_S', ground: 'GRASS', plaza: 'STONE', fence: 'HEDGE', envL: 'formal', envR: 'park', landmark: 'clocktower', filler: 'STONE' }
];
const TUT_CI = CITIES.findIndex(c => c.id === 'london');

/* ---------------- builder helpers ---------------- */
function box(w, x0, y0, z0, x1, y1, z1, t) { w.fill(x0, y0, z0, x1, y1, z1, t); }
function hollow(w, x0, y0, z0, x1, y1, z1, t) {
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++)
    if (x === x0 || x === x1 || z === z0 || z === z1) w.set(x, y, z, t);
}
function sphere(w, cx, cy, cz, r, t, half) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let z = Math.floor(cz - r); z <= cz + r; z++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    if (half && y < cy) continue;
    if ((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2 <= r * r) w.set(x, y, z, t);
  }
}
function cyl(w, cx, cz, y0, y1, r, t, shell) {
  for (let y = y0; y <= y1; y++) for (let z = Math.floor(cz - r - 1); z <= cz + r + 1; z++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
    const d = Math.hypot(x - cx, z - cz); if (d <= r && (!shell || d > r - 1.2)) w.set(x, y, z, t);
  }
}
function tree(w, x, y, z, kind, rng) {
  if (kind === 'palm') {
    const h = rng.int(5, 7); for (let i = 0; i < h; i++) w.set(x + (i > 3 ? 1 : 0), y + i, z, B.LOG);
    const tx = x + 1, ty = y + h, tz = z;
    w.set(tx, ty, tz, B.PALM);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { for (let k = 1; k <= 3; k++) w.set(tx + dx * k, ty - (k === 3 ? 1 : 0), tz + dz * k, B.PALM); }
    return;
  }
  if (kind === 'cypress') { const h = rng.int(6, 8); w.set(x, y, z, B.LOG); for (let i = 1; i < h; i++) { w.set(x, y + i, z, B.LEAVES_D); if (i > 1 && i < h - 1) { w.set(x + 1, y + i, z, B.LEAVES_D); w.set(x, y + i, z + 1, B.LEAVES_D); w.set(x + 1, y + i, z + 1, B.LEAVES_D); } } return; }
  const leaf = kind === 'sakura' ? B.LEAVES_P : B.LEAVES;
  const h = rng.int(3, 5);
  for (let i = 0; i < h; i++) w.set(x, y + i, z, B.LOG);
  const r = kind === 'sakura' ? 2.6 : 2.3;
  for (let dy = -1; dy <= 2; dy++) for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
    const d = Math.hypot(dx, dy * 1.3, dz); if (d < r + rng() * 0.6 && !w.get(x + dx, y + h + dy, z + dz)) w.set(x + dx, y + h + dy, z + dz, leaf);
  }
}
function car(w, x, y, z, col, along) {
  const L = 4, Wd = 2;
  for (let i = 0; i < L; i++) for (let j = 0; j < Wd; j++) {
    const [cx, cz] = along === 'x' ? [x + i, z + j] : [x + j, z + i];
    w.set(cx, y, cz, col);
    if (i > 0 && i < L - 1) w.set(cx, y + 1, cz, B.GLASS);
  }
}
function lampPost(w, x, y, z, M) {
  w.set(x, y, z, B.METAL_D); w.set(x, y + 1, z, B.METAL_D); w.set(x, y + 2, z, B.METAL_D); w.set(x, y + 3, z, B.LAMP);
  M.lights.push({ x: x + 0.5, y: y + 3.5, z: z + 0.5, r: 9, c: [1.0, 0.8, 0.5] });
}
function bench(w, x, y, z, along) { if (along === 'x') { w.set(x, y, z, B.WOOD_D); w.set(x + 1, y, z, B.WOOD_D); } else { w.set(x, y, z, B.WOOD_D); w.set(x, y, z + 1, B.WOOD_D); } }

/* ---------------- Venue (main building) ---------------- */
/* ---------------- Venue layouts ---------------- */
// Room helper: name, rect [x0,z0,x1,z1] (inclusive walls, local coords), parent room(s) for doors, options
const R_ = (n, x0, z0, x1, z1, p, o) => Object.assign({ n, r: [x0, z0, x1, z1], p: p ? [].concat(p) : [] }, o || {});
const TS = { L: [0, 0, 11, 27], Lf: [0, 0, 11, 13], Lb: [0, 13, 11, 27], R: [22, 0, 31, 27], Rf: [22, 0, 31, 13], Rb: [22, 13, 31, 27] };
const T_ = (n, s, o) => R_(n, ...TS[s], 'hall', o);
const TOWER_F0 = [R_('lobby', 11, 0, 22, 27, null, { ext: 'z0' }), R_('bar', 0, 0, 11, 13, 'lobby'), R_('kitchen', 0, 13, 11, 27, ['bar', 'lobby'], { ext: 'z1' }), R_('bath', 22, 0, 31, 9, 'lobby'), R_('staff', 22, 9, 31, 18, 'lobby'), R_('security', 22, 18, 31, 27, 'staff', { ext: 'z1' })];
const TH = () => R_('hall', 11, 0, 22, 27);
const GRAND_F0 = [R_('lobby', 20, 0, 31, 25, null, { ext: 'z0' }), R_('bar', 0, 0, 20, 11, 'lobby'), R_('kitchen', 0, 11, 20, 25, ['bar', 'lobby'], { ext: 'z1' }), R_('bath', 31, 0, 41, 10, 'lobby'), R_('staff', 31, 10, 41, 25, 'lobby', { ext: 'z1' }), R_('security', 41, 0, 51, 25, 'staff', { ext: 'x1' })];
const GH = () => R_('hall', 20, 0, 31, 25);
const SPINE_F0 = [R_('lobby', 15, 0, 26, 29, null, { ext: 'z0' }), R_('bar', 0, 0, 15, 13, 'lobby'), R_('kitchen', 0, 13, 15, 29, ['bar', 'lobby'], { ext: 'z1' }), R_('bath', 26, 0, 39, 9, 'lobby'), R_('staff', 26, 9, 39, 19, 'lobby'), R_('security', 26, 19, 39, 29, 'staff', { ext: 'z1' })];
const SH = n => R_(n || 'hall', 15, 0, 26, 29);
const COURT_F0 = [R_('lobby', 12, 0, 27, 9, null, { ext: 'z0' }), R_('court', 12, 9, 27, 23, 'lobby'), R_('stairhall', 0, 9, 12, 23, 'court'), R_('bar', 0, 0, 12, 9, 'lobby'), R_('bath', 27, 0, 39, 9, 'lobby'), R_('security', 27, 9, 39, 23, 'court', { ext: 'x1' }), R_('kitchen', 0, 23, 20, 35, ['stairhall', 'court'], { ext: 'z1' }), R_('staff', 20, 23, 39, 35, ['kitchen', 'court'])];
const COURT_FA = [R_('stairhall', 0, 9, 12, 23), R_('gallery', 0, 0, 12, 9, 'stairhall'), R_('lounge', 12, 0, 27, 9, 'gallery', { balcony: 1 }), R_('suite', 27, 0, 39, 9, 'lounge'), R_('ballroom', 0, 23, 27, 35, 'stairhall'), R_('control', 27, 23, 39, 35, 'ballroom'), R_('office', 27, 9, 39, 23, 'suite')];
const COURT_FB = [R_('stairhall', 0, 9, 12, 23), R_('gallery', 0, 0, 12, 9, 'stairhall'), R_('vipgallery', 12, 0, 39, 9, 'gallery', { deco: 'lounge', extra: 1, zone: Z_VIP }), R_('guardpost', 27, 9, 39, 23, 'vipgallery'), R_('spa', 0, 23, 16, 35, 'stairhall'), R_('privatebar', 16, 23, 39, 35, 'spa')];
const PAV_F0 = [R_('lobby', 22, 0, 33, 23, null, { ext: 'z0' }), R_('ballroom', 0, 0, 22, 23, 'lobby'), R_('bar', 33, 0, 45, 11, 'lobby'), R_('bath', 45, 0, 55, 11, 'bar'), R_('kitchen', 33, 11, 45, 23, ['bar', 'lobby'], { ext: 'z1' }), R_('staff', 45, 11, 55, 23, 'kitchen', { ext: 'x1' })];
const PAV_F1 = [R_('hall', 22, 0, 33, 23), R_('lounge', 0, 0, 22, 11, 'hall', { balcony: 1 }), R_('spa', 0, 11, 22, 23, 'hall'), R_('office', 33, 0, 45, 11, 'hall'), R_('suite', 45, 0, 55, 11, 'office'), R_('control', 33, 11, 45, 23, 'hall'), R_('security', 45, 11, 55, 23, 'control')];
const LOFT_F0 = [R_('lobby', 0, 0, 11, 18, null, { ext: 'z0' }), R_('bath', 0, 18, 11, 29, 'lobby'), R_('ballroom', 11, 0, 45, 17, 'lobby'), R_('bar', 11, 17, 22, 29, 'ballroom'), R_('kitchen', 22, 17, 33, 29, ['bar', 'ballroom'], { ext: 'z1' }), R_('staff', 33, 17, 45, 29, ['kitchen', 'ballroom'])];
const LOFT_F1 = [R_('hall', 0, 0, 11, 20), R_('security', 0, 20, 11, 29, 'hall'), R_('lounge', 11, 0, 28, 15, 'hall', { balcony: 1 }), R_('control', 11, 15, 28, 29, 'hall'), R_('privatebar', 28, 0, 45, 29, 'lounge')];
const LOFT_F2 = [R_('hall', 0, 0, 11, 20), R_('guardpost', 0, 20, 11, 29, 'hall'), R_('office', 11, 0, 28, 15, 'hall'), R_('spa', 11, 15, 28, 29, 'hall'), R_('suite', 28, 0, 45, 29, 'office')];

const LAYOUTS = {
  spine: { BW: 40, BD: 30, stair: [15, 19], name: 'Townhouse', plans: {
    A: [SPINE_F0,
      [SH('gallery'), R_('ballroom', 0, 0, 15, 29, 'gallery', { balcony: 1 }), R_('lounge', 26, 0, 39, 14, 'gallery'), R_('control', 26, 14, 39, 29, 'gallery')],
      [SH(), R_('office', 0, 0, 15, 15, 'hall'), R_('suite', 0, 15, 15, 29, 'hall'), R_('spa', 26, 0, 39, 14, 'hall'), R_('guardpost', 26, 14, 39, 29, 'hall')]],
    B: [SPINE_F0,
      [SH('gallery'), R_('lounge', 0, 0, 15, 29, 'gallery', { balcony: 1 }), R_('control', 26, 0, 39, 14, 'gallery'), R_('guardpost', 26, 14, 39, 29, 'gallery')],
      [SH(), R_('ballroom', 0, 0, 15, 29, 'hall'), R_('office', 26, 0, 39, 14, 'hall'), R_('suite', 26, 14, 39, 29, 'hall')],
      [SH(), R_('spa', 0, 0, 15, 14, 'hall'), R_('privatebar', 0, 14, 15, 29, 'hall'), R_('server', 26, 0, 39, 29, 'hall')]]
  } },
  grand: { BW: 52, BD: 26, stair: [20, 15], name: 'Grand Hôtel', plans: {
    A: [GRAND_F0,
      [GH(), R_('ballroom', 0, 0, 20, 25, 'hall', { balcony: 1 }), R_('lounge', 31, 0, 51, 12, 'hall'), R_('control', 31, 12, 51, 25, 'hall')],
      [GH(), R_('spa', 0, 0, 20, 12, 'hall'), R_('suite', 0, 12, 20, 25, 'hall'), R_('office', 31, 0, 51, 12, 'hall'), R_('guardpost', 31, 12, 51, 25, 'hall')]],
    B: [GRAND_F0,
      [GH(), R_('lounge', 0, 0, 20, 12, 'hall', { balcony: 1 }), R_('spa', 0, 12, 20, 25, 'hall'), R_('control', 31, 0, 51, 12, 'hall'), R_('guardpost', 31, 12, 51, 25, 'hall')],
      [GH(), R_('ballroom', 0, 0, 20, 25, 'hall'), R_('office', 31, 0, 51, 12, 'hall'), R_('suite', 31, 12, 51, 25, 'hall')],
      [GH(), R_('privatebar', 0, 0, 20, 25, 'hall'), R_('server', 31, 0, 51, 25, 'hall')]]
  } },
  tower: { BW: 32, BD: 28, stair: [11, 17], name: 'Tower', plans: {
    A: [TOWER_F0,
      [TH(), T_('ballroom', 'L', { balcony: 1 }), T_('lounge', 'Rf'), T_('control', 'Rb')],
      [TH(), T_('spa', 'Lf'), T_('suite', 'Lb'), T_('office', 'Rf'), T_('guardpost', 'Rb')],
      [TH(), T_('privatebar', 'L'), T_('server', 'R')],
      [TH(), T_('skylounge', 'L', { deco: 'lounge', extra: 1, zone: Z_VIP }), T_('guardpost2', 'R', { deco: 'guardpost', extra: 1, zone: Z_SECURITY })],
      [TH(), T_('penthouse', 'L', { deco: 'suite', extra: 1, zone: Z_VIP }), T_('study', 'R', { deco: 'lounge', extra: 1, zone: Z_VIP })]],
    B: [TOWER_F0,
      [TH(), T_('spa', 'Lf'), T_('suite', 'Lb'), T_('office', 'Rf'), T_('guardpost', 'Rb')],
      [TH(), T_('privatebar', 'L'), T_('server', 'R')],
      [TH(), T_('ballroom', 'L', { balcony: 1 }), T_('lounge', 'Rf'), T_('control', 'Rb')],
      [TH(), T_('skylounge', 'L', { deco: 'lounge', extra: 1, zone: Z_VIP }), T_('guardpost2', 'R', { deco: 'guardpost', extra: 1, zone: Z_SECURITY })]],
    C: [TOWER_F0,
      [TH(), T_('privatebar', 'L'), T_('server', 'R')],
      [TH(), T_('ballroom', 'L', { balcony: 1 }), T_('lounge', 'Rf'), T_('control', 'Rb')],
      [TH(), T_('office', 'Lf'), T_('suite', 'Lb'), T_('spa', 'L', { skip: 1 }), T_('guardpost', 'Rb'), T_('vipbar', 'Rf', { deco: 'lounge', extra: 1, zone: Z_VIP })],
      [TH(), T_('spa', 'Lf'), T_('penthouse', 'Lb', { deco: 'suite', extra: 1, zone: Z_VIP }), T_('guardpost2', 'R', { deco: 'guardpost', extra: 1, zone: Z_SECURITY })]]
  } },
  courtyard: { BW: 40, BD: 36, stair: [1, 11], void: [12, 9, 27, 23], name: 'Courtyard Palace', plans: {
    A: [COURT_F0, COURT_FA, COURT_FB],
    C: [COURT_F0, COURT_FB.map(r => r.n === 'vipgallery' ? R_('vipgallery', 12, 0, 39, 9, 'gallery', { deco: 'lounge', extra: 1, zone: Z_PUBLIC }) : r), COURT_FA]
  } },
  pavilion: { BW: 56, BD: 24, stair: [22, 13], name: 'Pavilion', plans: {
    A: [PAV_F0, PAV_F1],
    C: [PAV_F0, PAV_F1, [R_('hall', 22, 0, 33, 23), R_('privatebar', 0, 0, 22, 23, 'hall'), R_('server', 33, 0, 55, 23, 'hall'), R_('guardpost', 33, 0, 55, 23, 'hall', { skip: 1 })]]
  } },
  loft: { BW: 46, BD: 30, stair: [0, 7], name: 'Warehouse Loft', plans: { A: [LOFT_F0, LOFT_F1, LOFT_F2] } }
};
// city → [layout, plan, mirror, x offset]
const CITY_LAYOUT = {
  london: ['spine', 'A', 0, 0], paris: ['grand', 'A', 0, 0], dubai: ['tower', 'A', 0, -4], tokyo: ['tower', 'B', 1, 5], newyork: ['loft', 'A', 0, -3],
  rome: ['courtyard', 'A', 0, 4], monaco: ['grand', 'B', 1, 2], marrakech: ['courtyard', 'A', 1, -5], mumbai: ['pavilion', 'A', 0, 0], rio: ['pavilion', 'A', 1, 0],
  hongkong: ['tower', 'C', 1, -6], berlin: ['loft', 'A', 1, 4], sydney: ['pavilion', 'C', 0, 0], istanbul: ['courtyard', 'C', 0, -2], venice: ['spine', 'B', 1, 6]
};
function resolveLayout(c) {
  const [lk, plan, mir, off] = CITY_LAYOUT[c.id];
  const L = LAYOUTS[lk];
  const mx = x => L.BW - 1 - x;
  const floors = L.plans[plan].map(fl => fl.filter(r => !r.skip).map(r => {
    const o = Object.assign({}, r, { r: r.r.slice(), p: r.p.slice() });
    if (mir) { o.r = [mx(r.r[2]), r.r[1], mx(r.r[0]), r.r[3]]; if (o.ext === 'x0') o.ext = 'x1'; else if (o.ext === 'x1') o.ext = 'x0'; }
    return o;
  }));
  const stair = mir ? [mx(L.stair[0] + 10), L.stair[1]] : L.stair.slice();
  const vd = L.void ? (mir ? [mx(L.void[2]), L.void[1], mx(L.void[0]), L.void[3]] : L.void.slice()) : null;
  return { key: lk, name: L.name, BW: L.BW, BD: L.BD, stair, void: vd, floors, off, mirror: !!mir, plan };
}
function defaultZone(n, k) {
  if (['lobby', 'court', 'bar', 'bath', 'ballroom', 'gallery'].includes(n)) return Z_PUBLIC;
  if (n === 'hall' || n === 'stairhall') return k >= 2 ? Z_VIP : Z_PUBLIC;
  if (['kitchen', 'staff', 'control'].includes(n)) return Z_STAFF;
  if (['security', 'guardpost', 'server'].includes(n)) return Z_SECURITY;
  return Z_VIP;
}

function buildMap(cityIdx, seed) {
  const c = CITIES[cityIdx];
  const rng = RNG(seed * 7919 + cityIdx * 104729 + 13);
  const LY = resolveLayout(c);
  BW = LY.BW; BD = LY.BD;
  BX = Math.max(32, Math.min(98 - BW - 9, Math.round(60 - BW / 2) + LY.off));
  BZ = 42;
  const w = new World(MAP_W, MAP_H, MAP_D);
  const F = LY.floors.length;
  const M = { world: w, city: c, cityIdx, layout: LY, props: [], guards: [], guests: [], staff: [], spots: {}, stops: {}, pts: {}, rooms: {}, roomList: [], lights: [], exits: [], floors: [], env: TIMES[c.time] };
  const T = k => B[k];
  const yk = k => G + k * FH;
  for (let k = 0; k <= F; k++) M.floors.push(yk(k));
  M.building = { x0: BX, z0: BZ - 4, x1: BX + BW - 1, z1: BZ + BD - 1, top: yk(F) };
  const spot = (grp, p, face) => { (M.spots[grp] = M.spots[grp] || []).push([p[0], p[1], p[2], face === undefined ? null : face]); };
  const prop = (type, p, extra) => { const o = Object.assign({ type, p: [p[0] + 0.5, p[1], p[2] + 0.5] }, extra || {}); M.props.push(o); return o; };
  // lobby entrance x
  const lob = LY.floors[0].find(r => r.n === 'lobby');
  const EX = BX + Math.floor((lob.r[0] + lob.r[2]) / 2);
  M.entranceX = EX;

  /* ---- base terrain ---- */
  box(w, 0, 0, 0, MAP_W - 1, G - 2, MAP_D - 1, B.DIRT);
  box(w, 0, G - 1, 0, MAP_W - 1, G - 1, MAP_D - 1, T(c.ground));
  w.setZone(0, 0, 0, MAP_W - 1, MAP_H - 1, 6, Z_BLOCK);
  w.setZone(0, 0, 98, MAP_W - 1, MAP_H - 1, MAP_D - 1, Z_BLOCK);
  w.setZone(0, 0, 0, 4, MAP_H - 1, MAP_D - 1, Z_BLOCK);
  w.setZone(115, 0, 0, MAP_W - 1, MAP_H - 1, MAP_D - 1, Z_BLOCK);
  const fenceT = T(c.fence);
  const fh = (fenceT === B.HEDGE || fenceT === B.CLAY) ? 3 : 2;
  for (let x = 5; x <= 114; x++) { box(w, x, G, 7, x, G + fh - 1, 7, fenceT); box(w, x, G, 97, x, G + fh - 1, 97, fenceT); }
  for (let z = 7; z <= 97; z++) { box(w, 5, G, z, 5, G + fh - 1, z, fenceT); box(w, 114, G, z, 114, G + fh - 1, z, fenceT); }

  /* ---- street ---- */
  box(w, 6, G - 1, 14, 113, G - 1, 21, B.ASPHALT);
  box(w, 6, G - 1, 10, 113, G - 1, 13, B.PAVE);
  box(w, 6, G - 1, 22, 113, G - 1, 25, B.PAVE);
  box(w, 6, G - 1, 8, 113, G - 1, 9, T(c.ground));
  const carCols = [B.RED, B.BLUE, B.BLACK, B.WHITE, B.YELLOW, B.GREEN, B.METAL];
  for (let x = 20; x < 108; x += rng.int(9, 16)) car(w, x, G, rng() < 0.5 ? 15 : 19, rng.pick(carCols), 'x');
  for (let x = 12; x < 112; x += 12) { lampPost(w, x, G, 23, M); }
  for (let x = 18; x < 112; x += 16) { tree(w, x, G, 11, c.ground === 'SAND' ? 'palm' : 'oak', rng); }
  car(w, 8, G, 18, B.BLACK, 'x');
  M.exits.push({ p: [12.5, G, 17.5], label: 'Getaway Car' });
  spot('street', [30, G, 24]); spot('street', [70, G, 24]); spot('street', [95, G, 11]); spot('street', [45, G, 12]);

  /* ---- compound + plaza ---- */
  const CX0 = BX - 10, CX1 = BX + BW + 9, CZ0 = 27, CZ1 = Math.min(83, BZ + BD + 10);
  const BKX = BX + Math.floor(BW / 3);
  box(w, CX0, G - 1, CZ0, CX1, G - 1, BZ - 1, T(c.plaza));
  const cwall = (fenceT === B.HEDGE) ? B.HEDGE : T(c.trim) === B.GOLD ? B.MARBLE : B.STONE;
  for (let x = CX0; x <= CX1; x++) { if (x < EX - 3 || x > EX + 3) box(w, x, G, CZ0, x, G, CZ0, cwall); }
  for (let z = CZ0; z <= CZ1; z++) { box(w, CX0, G, z, CX0, G + 1, z, cwall); box(w, CX1, G, z, CX1, G + 1, z, cwall); }
  for (let x = CX0; x <= CX1; x++) { if (x < BKX - 2 || x > BKX + 1) box(w, x, G, CZ1, x, G + 1, CZ1, cwall); }
  box(w, CX0, G, BZ + 8, CX0, G + 1, BZ + 10, 0); box(w, CX1, G, BZ + 8, CX1, G + 1, BZ + 10, 0);
  const FZ = 32;
  cyl(w, EX, FZ, G, G, 4, B.MARBLE); cyl(w, EX, FZ, G, G, 3.2, B.WATER); w.set(EX, G, FZ, B.MARBLE); w.set(EX, G + 1, FZ, B.MARBLE); w.set(EX, G + 2, FZ, B.WATER);
  box(w, EX - 1, G - 1, CZ0, EX + 1, G - 1, BZ - 4, T(c.carpet));
  for (let z = 29; z < 38; z += 4) { w.set(EX - 4, G, z, B.HEDGE); w.set(EX + 4, G, z, B.HEDGE); }
  lampPost(w, EX - 8, G, 29, M); lampPost(w, EX + 8, G, 29, M); lampPost(w, EX - 8, G, 37, M); lampPost(w, EX + 8, G, 37, M);
  const treeKind = c.envL === 'sakura' ? 'sakura' : c.ground === 'SAND' ? 'palm' : c.fence === 'HEDGE' ? 'cypress' : 'oak';
  for (const [x, z] of [[CX0 + 4, 31], [CX0 + 9, 36], [CX1 - 4, 31], [CX1 - 9, 36]]) tree(w, x, G, z, treeKind, rng);
  for (const dx of [-10, 10, -5, 6, -13, 13, -7, 8]) spot('plaza', [EX + dx, G, 29 + ((dx * 7) & 7)]);
  box(w, CX0 + 1, G - 1, BZ, BX - 2, G - 1, CZ1 - 1, T(c.ground));
  box(w, BX + BW + 1, G - 1, BZ, CX1 - 1, G - 1, CZ1 - 1, T(c.ground));
  for (let z = BZ + 2; z < CZ1 - 2; z += 7) { tree(w, CX0 + 4, G, z, c.ground === 'SAND' ? 'palm' : 'oak', rng); }
  for (let z = BZ + 3; z < CZ1 - 3; z += 6) { bench(w, CX1 - 4, G, z, 'z'); spot('garden', [CX1 - 5, G, z]); }
  // back yard (staff)
  box(w, BX, G - 1, BZ + BD, BX + BW - 1, G - 1, CZ1 - 1, B.CONCRETE);
  w.setZone(BX - 1, G, BZ + BD, BX + BW, G + 2, CZ1 - 1, Z_STAFF);
  prop('container', [BX + 3, G, BZ + BD + 4], { name: 'Dumpster', cap: 2, model: 'dumpster' });
  prop('container', [BX + BW - 6, G, BZ + BD + 4], { name: 'Dumpster', cap: 2, model: 'dumpster' });
  if (CZ1 - (BZ + BD) > 6) { car(w, BX + Math.floor(BW / 2), G, BZ + BD + 3, B.WHITE, 'x'); prop('caralarm', [BX + Math.floor(BW / 2) + 1, G + 1, BZ + BD + 3], { name: 'Catering Van' }); }
  prop('caralarm', [8 + 1, G + 1, 18], { name: 'Parked Car' });
  lampPost(w, BX + Math.floor(BW / 2) - 3, G, BZ + BD + 5, M);
  spot('yard', [BX + 8, G, BZ + BD + 3]); spot('yard', [BX + BW - 8, G, BZ + BD + 5]);

  /* ---- back alley & exits ---- */
  box(w, 6, G - 1, 84, 113, G - 1, 96, B.ASPHALT);
  for (let x = 10; x < 112; x += 14) lampPost(w, x, G, 85, M);
  car(w, 100, G, 90, B.WHITE, 'x');
  M.exits.push({ p: [99.5, G, 92.5], label: 'Service Van' });
  prop('container', [70, G, 87], { name: 'Dumpster', cap: 2, model: 'dumpster' });
  spot('alley', [40, G, 90]); spot('alley', [80, G, 88]);

  /* ---- left & right areas ---- */
  buildSideArea(w, M, c, rng, c.envL, 6, CX0 - 2, 26, 83);
  buildSideArea(w, M, c, rng, c.envR, CX1 + 2, 113, 26, 83);
  // utility shed in the alley (public)
  const SX = 20, SZ = 88;
  w.cutMode = 1;
  hollow(w, SX, G, SZ, SX + 7, G + 2, SZ + 6, T(c.filler) || B.BRICK);
  box(w, SX, G + 3, SZ, SX + 7, G + 3, SZ + 6, B.ROOF_S);
  box(w, SX, G - 1, SZ, SX + 7, G - 1, SZ + 6, B.CONCRETE);
  box(w, SX + 3, G, SZ, SX + 4, G + 1, SZ, 0);
  w.cutMode = 0;
  prop('disguise', [SX + 2, G, SZ + 4], { outfit: 'cleaner', name: 'Cleaner Overalls' });
  prop('item', [SX + 5, G, SZ + 4], { item: 'wrench', name: 'Wrench' });
  prop('container', [SX + 6, G, SZ + 1], { name: 'Tool Locker', cap: 1, model: 'closet' });
  M.lights.push({ x: SX + 4, y: G + 2.5, z: SZ + 3, r: 6, c: [1, 0.9, 0.7] });
  M.exits.push({ p: [9.5, G, 90.5], label: 'Sewer Hatch' });
  box(w, 8, G - 1, 89, 10, G - 1, 91, B.METAL_D);

  /* ---- background ---- */
  box(w, 0, G - 2, 99, MAP_W - 1, G - 1, 108, B.WATER);
  box(w, 0, G - 1, 98, MAP_W - 1, G - 1, 98, B.STONE);
  box(w, 0, G - 1, 109, MAP_W - 1, G - 1, 109, B.STONE);
  buildLandmark(w, M, c, rng);
  for (let x = 2; x < MAP_W - 4; x += rng.int(6, 10)) {
    if (x > 32 && x < 88) continue;
    const h = rng.int(8, c.landmark === 'skyline' || c.landmark === 'neonskyline' ? 40 : 18);
    const t = (c.landmark === 'skyline' || c.landmark === 'neonskyline' || c.landmark === 'burj') ? rng.pick([B.TOWER, B.TOWER_D, B.TOWER_W]) : T(c.filler);
    box(w, x, G, 111 + rng.int(0, 3), x + rng.int(3, 5), G + h, 118, t);
  }
  for (let z = 10; z < 96; z += rng.int(7, 11)) {
    const h = rng.int(6, 14); const t = T(c.filler);
    box(w, 0, G, z, 3, G + h, z + rng.int(3, 5), t);
    box(w, 116, G, z, 119, G + rng.int(6, 14), z + rng.int(3, 5), t);
  }

  /* ---- the venue ---- */
  buildVenue(w, M, c, rng, LY, yk, spot, prop);

  /* ---- signature kill ---- */
  placeSignature(w, M, c, rng);
  /* ---- locked doors: security areas ---- */
  for (const d of M.doors || []) if ((d.room === 'server' || d.room === 'guardpost' || (d.room === 'security' && d.ext))) d.locked = true;
  if (!(M.doors || []).some(d => d.locked)) { const d = (M.doors || []).find(d => d.room === 'security'); if (d) d.locked = true; }
  for (const d of M.doors || []) if (d.locked) M.props.push({ type: 'door', p: [d.cells.reduce((s, c) => s + c[0], 0) / d.cells.length + 0.5, d.y, d.cells.reduce((s, c) => s + c[1], 0) / d.cells.length + 0.5], name: 'Locked Door', door: d });
  /* ---- NPC rosters ---- */
  populate(M, LY, yk, { CX0, CX1, CZ0, CZ1, EX, BKX }, rng);
  for (const k in M.spots) M.spots[k] = M.spots[k].filter(s => w.walkable(s[0], s[1], s[2]));
  M.spawns = [[EX - 26 > 8 ? EX - 26 : 10, G, 23], [Math.min(110, EX + 26), G, 23], [40, G, 92]];
  return M;
}

function buildVenue(w, M, c, rng, LY, yk, spot, prop) {
  const T = k => B[k];
  const wall = T(c.wall), trim = T(c.trim), inner = T(c.inner), floor = T(c.floor), carpet = T(c.carpet);
  const F = LY.floors.length;
  const [sx, sz] = LY.stair;
  const VD = LY.void;
  const inVoid = (lx, lz) => VD && lx > VD[0] && lx < VD[2] && lz > VD[1] && lz < VD[3];
  const inStair = (lx, lz) => lx >= sx && lx <= sx + 10 && lz >= sz && lz <= sz + 10;
  const stairCell = (lx, lz) => {
    const x = lx - sx, z = lz - sz;
    if ((x === 2 || x === 3) && z >= 1 && z <= 6) return true;
    if ((x === 7 || x === 8) && z >= 3 && z <= 9) return true;
    if ((x === 1 || x === 4) && z >= 1 && z <= 4) return true; if (z === 1 && x >= 1 && x <= 4) return true;
    if ((x === 6 || x === 9) && z >= 6 && z <= 9) return true; if (z === 9 && x >= 6 && x <= 9) return true;
    return false;
  };
  w.cutMode = 1;
  box(w, BX, G - 1, BZ, BX + BW - 1, G - 1, BZ + BD - 1, floor);
  const doorCells = [];
  for (let k = 0; k < F; k++) {
    const y = yk(k);
    const rooms = LY.floors[k];
    if (k > 0) {
      for (let lz = 0; lz < BD; lz++) for (let lx = 0; lx < BW; lx++) if (!inVoid(lx, lz)) w.set(BX + lx, y - 1, BZ + lz, floor);
      hollow(w, BX, y - 1, BZ, BX + BW - 1, y - 1, BZ + BD - 1, trim);
    }
    // exterior walls with windows
    for (let yy = y; yy <= y + 2; yy++) {
      for (let x = BX; x < BX + BW; x++) for (const z of [BZ, BZ + BD - 1]) {
        const lx = x - BX; const win = yy > y && (lx % 4 === 1 || lx % 4 === 2) && lx > 1 && lx < BW - 2;
        w.set(x, yy, z, win ? B.GLASS : (lx % 8 === 0 ? trim : wall));
      }
      for (let z = BZ; z < BZ + BD; z++) for (const x of [BX, BX + BW - 1]) {
        const lz = z - BZ; const win = yy > y && (lz % 4 === 1 || lz % 4 === 2) && lz > 1 && lz < BD - 2;
        w.set(x, yy, z, win ? B.GLASS : (lz % 8 === 0 ? trim : wall));
      }
    }
    const fmat = { bar: B.WOOD_D, kitchen: B.TILE_W, bath: B.TILE_W, staff: B.CONCRETE, security: B.CONCRETE, lounge: carpet, control: B.CONCRETE, office: carpet, suite: carpet, spa: B.TILE_B, guardpost: B.CONCRETE, server: B.METAL_D, privatebar: carpet, hall: carpet, stairhall: floor, court: T(c.plaza) };
    for (const R of rooms) {
      const [x0, z0, x1, z1] = R.r;
      R.k = k; R.y = y; R.zone = R.zone !== undefined ? R.zone : defaultZone(R.n, k);
      R.a = { x0: BX + x0 + 1, z0: BZ + z0 + 1, x1: BX + x1 - 1, z1: BZ + z1 - 1 };
      const fm = fmat[R.deco || R.n] || floor;
      if (R.n !== 'court' || k === 0) box(w, R.a.x0, y - 1, R.a.z0, R.a.x1, y - 1, R.a.z1, fm);
      if (R.n === 'court') { w.cutMode = 0; box(w, R.a.x0, y - 1, R.a.z0, R.a.x1, y - 1, R.a.z1, fm); w.cutMode = 1; }
      for (let yy = y; yy <= y + 2; yy++) {
        for (let x = x0; x <= x1; x++) for (const z of [z0, z1]) if (z > 0 && z < BD - 1 && x > 0 && x < BW - 1) w.set(BX + x, yy, BZ + z, inner);
        for (let z = z0; z <= z1; z++) for (const x of [x0, x1]) if (x > 0 && x < BW - 1 && z > 0 && z < BD - 1) w.set(BX + x, yy, BZ + z, inner);
      }
      w.setZone(R.a.x0, y, R.a.z0, R.a.x1, y + 2, R.a.z1, R.zone);
      M.roomList.push(R);
      if (!R.extra && !M.rooms[R.n]) M.rooms[R.n] = R;
    }
    // court walls toward void get glass on upper floors
    if (VD && k > 0) for (let yy = y + 1; yy <= y + 2; yy++) {
      for (let lx = VD[0] + 1; lx < VD[2]; lx += 2) { w.set(BX + lx, yy, BZ + VD[1], B.GLASS); w.set(BX + lx, yy, BZ + VD[3], B.GLASS); }
      for (let lz = VD[1] + 1; lz < VD[3]; lz += 2) { w.set(BX + VD[0], yy, BZ + lz, B.GLASS); w.set(BX + VD[2], yy, BZ + lz, B.GLASS); }
    }
    if (VD && k > 0) for (let yy = y; yy <= y + 2; yy++) for (let lz = VD[1] + 1; lz < VD[3]; lz++) for (let lx = VD[0] + 1; lx < VD[2]; lx++) w.set(BX + lx, yy, BZ + lz, 0);
    // doors
    const carve = (R, cells, zone, ext, other) => {
      for (const [x, z] of cells) { for (let yy = y; yy <= y + 1; yy++) w.set(x, yy, z, 0); w.setZone(x, y, z, x, y + 1, z, zone); doorCells.push([x, y, z]); }
      (M.doors = M.doors || []).push({ cells: cells.map(c => [c[0], c[1]]), y, room: R.n, other: other || null, zone, ext: !!ext, axis: cells.length > 1 && cells[0][0] !== cells[1][0] ? 'x' : 'z', ang: 0, locked: false });
    };
    for (const R of rooms) {
      const [x0, z0, x1, z1] = R.r;
      for (const pn of R.p) {
        const P = rooms.find(q => q.n === pn); if (!P) continue;
        const [a0, b0, a1, b1] = P.r;
        let cells = null;
        const wide = (R.n === 'court' || P.n === 'court' || R.n === 'ballroom' || P.n === 'ballroom') ? 3 : 2;
        const seg = (lo, hi, okAt) => {
          const s = Math.max(lo[0], hi[0]) + 1, e = Math.min(lo[1], hi[1]) - 1; if (e - s + 1 < wide) return null;
          const m = Math.floor((s + e - wide + 1) / 2);
          for (let d = 0; d <= e - s; d++) for (const st of [m - d, m + d]) {
            if (st < s || st + wide - 1 > e) continue;
            let ok = true; for (let i = 0; i < wide; i++) if (!okAt(st + i)) ok = false;
            if (ok) { const out = []; for (let i = 0; i < wide; i++) out.push(st + i); return out; }
          }
          return null;
        };
        if (x1 === a0 || x0 === a1) { const xw = x1 === a0 ? x1 : x0; const zz = seg([z0, z1], [b0, b1], z => !stairCell(xw - 1, z) && !stairCell(xw + 1, z) && !stairCell(xw, z)); if (zz) cells = zz.map(z => [BX + xw, BZ + z]); }
        else if (z1 === b0 || z0 === b1) { const zw = z1 === b0 ? z1 : z0; const xx = seg([x0, x1], [a0, a1], x => !stairCell(x, zw - 1) && !stairCell(x, zw + 1) && !stairCell(x, zw)); if (xx) cells = xx.map(x => [BX + x, BZ + zw]); }
        if (!cells) console.warn('no door', R.n, '->', P.n, 'floor', k);
        if (cells) carve(R, cells, R.zone, false, P.n);
      }
      if (R.ext && k === 0) {
        const wd = R.n === 'lobby' ? 3 : 2; const cells = [];
        if (R.ext === 'z0' || R.ext === 'z1') { const m = Math.floor((x0 + x1) / 2) - (wd >> 1); for (let i = 0; i < wd; i++) cells.push([BX + m + i, BZ + (R.ext === 'z0' ? z0 : z1)]); }
        else { const m = Math.floor((z0 + z1) / 2) - 1; for (let i = 0; i < wd; i++) cells.push([BX + (R.ext === 'x0' ? x0 : x1), BZ + m + i]); }
        carve(R, cells, R.zone, true);
      }
    }
    // ceiling lights
    for (const R of rooms) {
      if (R.n === 'court') continue;
      const cx = (R.a.x0 + R.a.x1 + 1) / 2, cz = (R.a.z0 + R.a.z1 + 1) / 2;
      M.lights.push({ x: cx, y: y + 2.4, z: cz, r: Math.max(11, Math.max(R.a.x1 - R.a.x0, R.a.z1 - R.a.z0) * 0.8), c: R.n === 'ballroom' ? [1.4, 1.1, 0.75] : R.n === 'server' ? [0.5, 0.8, 1.3] : [1.25, 1.1, 0.9] });
    }
  }
  // stairs
  for (let k = 0; k < F; k++) {
    const y = yk(k), A = k % 2 === 0;
    const xs = A ? [sx + 2, sx + 3] : [sx + 7, sx + 8];
    const zs = A ? [sz + 2, sz + 3, sz + 4, sz + 5] : [sz + 8, sz + 7, sz + 6, sz + 5];
    const hole = A ? [sz + 2, sz + 3, sz + 4] : [sz + 6, sz + 7, sz + 8];
    for (const lx of xs) {
      zs.forEach((lz, i) => { box(w, BX + lx, y, BZ + lz, BX + lx, y + i, BZ + lz, B.WOOD_D); for (let yy = y + i + 1; yy <= y + i + 2; yy++) if (w.get(BX + lx, yy, BZ + lz) !== B.WOOD_D) w.set(BX + lx, yy, BZ + lz, 0); });
      for (const lz of hole) w.set(BX + lx, y + 3, BZ + lz, 0);
    }
    const yu = y + FH;
    const rx = A ? [sx + 1, sx + 4] : [sx + 6, sx + 9], endZ = A ? sz + 1 : sz + 9;
    for (const lz of hole) { w.set(BX + rx[0], yu, BZ + lz, B.RAIL); w.set(BX + rx[1], yu, BZ + lz, B.RAIL); }
    for (let lx = rx[0]; lx <= rx[1]; lx++) w.set(BX + lx, yu, BZ + endZ, B.RAIL);
    const upRoom = k + 1 < F ? LY.floors[k + 1].find(R => R.r[0] <= sx + 1 && R.r[2] >= sx + 9 && R.r[1] <= sz + 1 && R.r[3] >= sz + 9) : null;
    const upZone = upRoom ? upRoom.zone : Z_VIP;
    for (const lx of xs) zs.forEach((lz, i) => { w.setZone(BX + lx, y + i + 1, BZ + lz, BX + lx, y + i + 2, BZ + lz, i >= 2 ? upZone : w.zoneAt(BX + lx, y, BZ + lz)); });
    M.pts['arrive' + (k + 1)] = A ? [BX + sx + 2, yu, BZ + sz + 6] : [BX + sx + 7, yu, BZ + sz + 4];
  }
  // decorate (after stairs) with protected cells
  const prot = new Set(doorCells.map(([x, y, z]) => x + ',' + z + ',' + y));
  for (const [x, y, z] of doorCells) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) prot.add((x + dx) + ',' + (z + dz) + ',' + y);
  for (const R of M.roomList) {
    const free = (x, z) => !prot.has(x + ',' + z + ',' + R.y) && !inStair(x - BX, z - BZ) && !w.solid(x, R.y, z) && x >= R.a.x0 && x <= R.a.x1 && z >= R.a.z0 && z <= R.a.z1;
    free.prot = (x, z) => prot.has(x + ',' + z + ',' + R.y);
    decorateRoom(w, M, c, rng, R, free, spot, prop);
  }
  // re-open doors
  for (const [x, y, z] of doorCells) { w.set(x, y, z, 0); w.set(x, y + 1, z, 0); }
  M.doorCells = doorCells;
  addSeats(w, M);
  // roof
  const yr = yk(F);
  for (let lz = 0; lz < BD; lz++) for (let lx = 0; lx < BW; lx++) if (!inVoid(lx, lz)) w.set(BX + lx, yr - 1, BZ + lz, T(c.roof) === B.CLAY ? B.CLAY : B.CONCRETE);
  { const A = (F - 1) % 2 === 0; const xs = A ? [sx + 2, sx + 3] : [sx + 7, sx + 8]; const hole = A ? [sz + 2, sz + 3, sz + 4] : [sz + 6, sz + 7, sz + 8]; for (const lx of xs) for (const lz of hole) w.set(BX + lx, yr - 1, BZ + lz, 0); }
  hollow(w, BX, yr - 1, BZ, BX + BW - 1, yr - 1, BZ + BD - 1, trim);
  for (let x = BX; x < BX + BW; x++) { w.set(x, yr, BZ, B.RAIL); w.set(x, yr, BZ + BD - 1, B.RAIL); }
  for (let z = BZ; z < BZ + BD; z++) { w.set(BX, yr, z, B.RAIL); w.set(BX + BW - 1, yr, z, B.RAIL); }
  if (VD) { for (let lx = VD[0]; lx <= VD[2]; lx++) { w.set(BX + lx, yr, BZ + VD[1], B.RAIL); w.set(BX + lx, yr, BZ + VD[3], B.RAIL); } for (let lz = VD[1]; lz <= VD[3]; lz++) { w.set(BX + VD[0], yr, BZ + lz, B.RAIL); w.set(BX + VD[2], yr, BZ + lz, B.RAIL); } }
  w.setZone(BX + 1, yr, BZ + 1, BX + BW - 2, yr + 2, BZ + BD - 2, Z_VIP);
  { const A = (F - 1) % 2 === 0; const hole = A ? [sz + 2, sz + 3, sz + 4] : [sz + 6, sz + 7, sz + 8]; const rx = A ? [sx + 1, sx + 4] : [sx + 6, sx + 9], endZ = A ? sz + 1 : sz + 9;
    for (const lz of hole) { w.set(BX + rx[0], yr, BZ + lz, B.RAIL); w.set(BX + rx[1], yr, BZ + lz, B.RAIL); } for (let lx = rx[0]; lx <= rx[1]; lx++) w.set(BX + lx, yr, BZ + endZ, B.RAIL); }
  // pool + helipad placement in free roof corners
  const roofFree = (x0, z0, x1, z1) => { for (let lz = z0 - 1; lz <= z1 + 1; lz++) for (let lx = x0 - 1; lx <= x1 + 1; lx++) { if (lx < 1 || lz < 1 || lx > BW - 2 || lz > BD - 2) return false; if (inStair(lx, lz) || (VD && lx >= VD[0] && lx <= VD[2] && lz >= VD[1] && lz <= VD[3])) return false; } return true; };
  let PWd = Math.min(12, BW - 6), PDd = Math.min(10, BD - 6), pc = null;
  for (const [pw, pd] of [[PWd, PDd], [10, 8], [8, 7], [7, 6]]) {
    for (let z = 2; !pc && z <= BD - pd - 2; z += 1) for (let x = 2; !pc && x <= BW - pw - 2; x += 1) if (roofFree(x, z, x + pw - 1, z + pd + 1)) { pc = [x, z]; PWd = pw; PDd = pd; }
    if (pc) break;
  }
  pc = pc || [2, 2];
  const [px0, pz0] = pc, px1 = px0 + PWd - 1, pz1 = pz0 + PDd - 1;
  box(w, BX + px0 - 1, yr - 1, BZ + pz0 - 1, BX + px1 + 1, yr - 1, BZ + pz1 + 2, B.WOOD_L);
  box(w, BX + px0, yr, BZ + pz0, BX + px1, yr, BZ + pz1, B.MARBLE);
  box(w, BX + px0 + 1, yr, BZ + pz0 + 1, BX + px1 - 1, yr, BZ + pz1 - 1, B.POOLW);
  w.setZone(BX + px0 + 1, yr, BZ + pz0 + 1, BX + px1 - 1, yr + 1, BZ + pz1 - 1, Z_VIP);
  M.poolRect = { x0: BX + px0 + 1, z0: BZ + pz0 + 1, x1: BX + px1, z1: BZ + pz1, y: yr };
  const pcx = BX + Math.floor((px0 + px1) / 2), pcz = BZ + Math.floor((pz0 + pz1) / 2);
  M.stops.pool = { p: [pcx, yr, pcz], face: 0, label: 'Swimming in the rooftop pool', opp: 'speaker' };
  M.props.push({ type: 'speaker', p: [pcx + 0.5, yr + 1, BZ + pz0 + 0.5], name: 'Party Speaker', stop: 'pool' });
  M.lights.push({ x: pcx, y: yr + 1, z: pcz, r: 10, c: [0.4, 0.8, 1.0] });
  for (let x = BX + px0 + 1; x <= BX + px1 - 1; x += 4) if (w.get(x, yr - 1, BZ + pz1 + 2) === B.WOOD_L) { w.set(x, yr, BZ + pz1 + 2, B.WHITE); }
  const HW = 10;
  const hc = [[BW - 2 - HW, BD - 2 - HW], [2, BD - 2 - HW], [BW - 2 - HW, 2], [2, 2]].find(([x, z]) => roofFree(x, z, x + HW, z + HW) && !(x <= px1 + 1 && x + HW >= px0 - 1 && z <= pz1 + 2 && z + HW >= pz0 - 1));
  if (hc) { const [hx, hz] = hc; box(w, BX + hx, yr - 1, BZ + hz, BX + hx + HW, yr - 1, BZ + hz + HW, B.ASPHALT); box(w, BX + hx + 3, yr - 1, BZ + hz + 2, BX + hx + 3, yr - 1, BZ + hz + 8, B.YELLOW); box(w, BX + hx + 7, yr - 1, BZ + hz + 2, BX + hx + 7, yr - 1, BZ + hz + 8, B.YELLOW); box(w, BX + hx + 3, yr - 1, BZ + hz + 5, BX + hx + 7, yr - 1, BZ + hz + 5, B.YELLOW); }
  for (let i = 0; i < 6; i++) { const x = BX + rng.int(2, BW - 3), z = BZ + rng.int(2, BD - 3); if (w.walkable(x, yr, z) && !(x >= M.poolRect.x0 - 2 && x <= M.poolRect.x1 + 1 && z >= M.poolRect.z0 - 2 && z <= M.poolRect.z1 + 2)) spot('roof', [x, yr, z]); }
  prop('item', [BX + BW - 3, yr, BZ + 2], { item: 'coin', name: 'Coins' });
  // balcony
  const bal = M.roomList.find(R => R.balcony);
  if (bal && bal.r[1] === 0) {
    const y1 = bal.y; const bx0 = bal.r[0] + 1, bx1 = bal.r[2] - 1;
    box(w, BX + bx0, y1 - 1, BZ - 3, BX + bx1, y1 - 1, BZ - 1, floor === B.CONCRETE ? B.CONCRETE : B.MARBLE);
    for (let x = BX + bx0; x <= BX + bx1; x++) w.set(x, y1, BZ - 4, B.RAIL);
    for (let z = BZ - 4; z <= BZ - 1; z++) { w.set(BX + bx0 - 1, y1, z, B.RAIL); w.set(BX + bx1 + 1, y1, z, B.RAIL); }
    w.setZone(BX + bx0, y1, BZ - 3, BX + bx1, y1 + 1, BZ - 1, bal.zone === Z_VIP ? Z_VIP : Z_PUBLIC);
    const n = bx1 - bx0 + 1;
    for (const dx of n > 10 ? [Math.floor(n * 0.25), Math.floor(n * 0.7)] : [Math.floor(n / 2) - 1]) for (let i = 0; i < 2; i++) for (let yy = y1; yy <= y1 + 1; yy++) w.set(BX + bx0 + dx + i, yy, BZ, 0);
    const mx = BX + Math.floor((bx0 + bx1) / 2);
    M.stops.balcony = { p: [mx, y1, BZ - 3], face: Math.PI, label: 'Smoking on the balcony', opp: 'push' };
    M.building.z0 = BZ - 4;
  }
  // entrance canopy
  const EX = M.entranceX, y1c = yk(1);
  box(w, EX - 3, y1c - 1, BZ - 3, EX + 3, y1c - 1, BZ - 1, trim);
  for (const ex of [EX - 3, EX + 3]) for (let yy = G; yy < y1c - 1; yy++) w.set(ex, yy, BZ - 3, trim);
  box(w, EX - 2, G - 1, BZ - 4, EX + 2, G - 1, BZ - 1, carpet);
  w.cutMode = 0;
  if (c.time === 'night' && F > 2) box(w, EX - 4, yk(2) - 1, BZ - 1, EX + 4, yk(2) - 1, BZ - 1, B.NEON_P);
}

function decorateRoom(w, M, c, rng, R, free, spot, prop) {
  const a = R.a, y = R.y, T = kk => B[kk];
  const Wd = a.x1 - a.x0 + 1, Dd = a.z1 - a.z0 + 1, cx = a.x0 + (Wd >> 1), cz = a.z0 + (Dd >> 1);
  const put = (x, z, t, h) => { if (!free(x, z)) return false; for (let i = 0; i < (h || 1); i++) w.set(x, y + i, z, t); return true; };
  const row = (x0, z0, x1, z1, t, h) => { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) put(x, z, t, h); };
  const fl = (x0, z0, x1, z1, t) => { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (x >= a.x0 && x <= a.x1 && z >= a.z0 && z <= a.z1) w.set(x, y - 1, z, t); };
  const sp = (g, x, z, face) => { if (free(x, z)) spot(g, [x, y, z], face); };
  const randFree = () => { for (let i = 0; i < 30; i++) { const x = rng.int(a.x0, a.x1), z = rng.int(a.z0, a.z1); if (free(x, z)) return [x, z]; } return null; };
  const P = (x, z) => [x, y, z];
  const main = !R.extra;
  const wallArt = () => { const cols = [B.RED, B.BLUE, B.YELLOW, B.GREEN, B.ORANGE, B.PINK]; for (let i = 0; i < 3; i++) { const z = a.z0 + 2 + i * Math.max(3, Math.floor(Dd / 3)); if (z <= a.z1 && w.get(a.x0 - 1, y + 1, z) === T(c.inner)) w.set(a.x0 - 1, y + 1, z, rng.pick(cols)); if (z <= a.z1 && w.get(a.x1 + 1, y + 1, z) === T(c.inner)) w.set(a.x1 + 1, y + 1, z, rng.pick(cols)); } };
  switch (R.deco || R.n) {
    case 'lobby': {
      const ex = M.entranceX;
      fl(Math.max(a.x0, ex - 1), a.z0, Math.min(a.x1, ex + 1), Math.min(a.z1, a.z0 + 10), T(c.carpet));
      if (Wd >= 7) { row(a.x0, cz - 2, a.x0, cz + 1, B.WOOD_D); if (free(a.x0, cz)) w.set(a.x0, y + 1, cz, B.SCREEN); }
      for (const [x, z] of [[a.x0, a.z0], [a.x1, a.z0]]) put(x, z, B.LEAVES);
      if (Wd >= 8) row(a.x1, cz - 1, a.x1, cz + 1, B.LEATHER);
      for (let i = 0; i < 6; i++) { const f = randFree(); if (f) sp('lobby', f[0], f[1]); }
      const f = randFree(); if (f) prop('item', P(f[0], f[1]), { item: 'coin', name: 'Coins' });
      wallArt();
      break;
    }
    case 'court': {
      cyl(w, cx, cz, y, y, 2.6, B.MARBLE); cyl(w, cx, cz, y, y, 1.8, B.WATER); w.set(cx, y, cz, B.MARBLE); w.set(cx, y + 1, cz, B.MARBLE); w.set(cx, y + 2, cz, B.WATER);
      for (const [x, z] of [[a.x0 + 1, a.z0 + 1], [a.x1 - 1, a.z0 + 1], [a.x0 + 1, a.z1 - 1], [a.x1 - 1, a.z1 - 1]]) tree(w, x, y, z, c.ground === 'SAND' ? 'palm' : 'cypress', rng);
      for (let i = 0; i < 8; i++) { const f = randFree(); if (f && Math.hypot(f[0] - cx, f[1] - cz) > 3) sp('court', f[0], f[1]); }
      M.lights.push({ x: cx, y: y + 3, z: cz, r: 10, c: [1, 0.85, 0.6] });
      break;
    }
    case 'bar': {
      const cz0 = a.z0 + 2, cxa = a.x0 + 1, cxb = a.x1 - 2;
      row(a.x0, a.z0, a.x1, a.z0, B.BOOKS, 2);
      row(cxa, cz0, cxb, cz0, B.WOOD_D);
      const bx = Math.max(cxa + 1, Math.min(cxb - 1, cx - 1));
      if (main) {
        M.stops.bar = { p: P(bx, cz0 + 1), face: Math.PI, label: 'Ordering a drink at the bar', opp: 'drink' };
        prop('consumable', [bx, y + 1, cz0], { name: 'Cocktail', stop: 'bar', model: 'cocktail' });
        M.pts.bartender = [bx + 1, y, a.z0 + 1];
        prop('blend', P(bx + 2, a.z0 + 1), { name: 'Bar Service', act: 'Serve drinks', outfits: ['waiter'] });
      }
      for (let z = cz0 + 4; z <= a.z1 - 1; z += 3) for (let x = a.x0 + 1; x <= a.x1 - 1; x += 4) { put(x, z, B.WOOD_D); sp('bar', x + 1, z); }
      for (let x = cxa; x <= cxb; x += 3) if (x !== bx) sp('bar', x, cz0 + 1, Math.PI);
      M.lights.push({ x: cx, y: y + 2, z: a.z0 + 1, r: 7, c: [1.0, 0.6, 0.3] });
      if (main) { const f = randFree(); if (f) prop('item', P(f[0], f[1]), { item: 'coin', name: 'Coins' }); }
      break;
    }
    case 'kitchen': {
      row(a.x0, a.z0, a.x0, a.z1, B.METAL);
      const sz0 = a.z0 + 3;
      if (main) {
        w.set(a.x0, y, sz0, B.STOVE); w.set(a.x0, y, sz0 + 1, B.STOVE);
        M.stops.kitchen = { p: P(a.x0 + 1, sz0), face: -Math.PI / 2, label: 'Inspecting the kitchen', opp: 'stove' };
        prop('stove', [a.x0, y + 1, sz0], { name: 'Gas Stove', stop: 'kitchen' });
      }
      put(a.x1, a.z0, B.FRIDGE, 2); put(a.x1, a.z0 + 1, B.FRIDGE, 2);
      if (Wd >= 8) row(cx - 1, cz, cx + 2, cz + 1, B.METAL);
      if (main) {
        prop('item', [cx, y + 1, cz], { item: 'knife', name: 'Kitchen Knife' });
        prop('item', P(a.x1 - 1, a.z1), { item: 'poison', name: 'Rat Poison (Lethal)' });
        prop('disguise', P(a.x1 - 3, a.z1), { outfit: 'chef', name: 'Chef Whites' });
        prop('container', P(a.x1, a.z1 - 2), { name: 'Walk-in Freezer', cap: 2, model: 'freezer' });
        M.pts.chef1 = [a.x0 + 2, y, sz0 + 2];
        prop('blend', P(a.x0 + 1, sz0 + 2), { name: 'Prep Station', act: 'Cook', outfits: ['chef'] });
        { const f = randFree(); if (f) prop('radio', P(f[0], f[1]), { name: 'Kitchen Radio' }); } M.pts.chef2 = [cx, y, Math.min(a.z1, cz + 3)]; M.pts.kpass = [cx + 3 <= a.x1 ? cx + 3 : cx, y, a.z0 + 1];
      }
      break;
    }
    case 'bath': {
      row(a.x0 + 1, a.z0, a.x0 + 4, a.z0, B.MARBLE);
      for (let z = a.z0 + 1; z <= a.z1; z += 3) row(a.x1 - 3, z, a.x1, z, B.TILE_W, 2);
      if (main) {
        prop('item', [a.x0 + 2, y + 1, a.z0], { item: 'emetic', name: 'Emetic Pills' });
        prop('container', P(a.x1 - 1, a.z0 + 2), { name: 'Toilet Stall', cap: 1, model: 'closet' });
        M.stops.bathroom = { p: P(a.x0 + 2, a.z1 - 1), face: Math.PI, label: 'Feeling sick in the bathroom', hidden: true };
        M.pts.bath = [a.x0 + 3, y, a.z0 + 2];
      }
      break;
    }
    case 'staff': {
      row(a.x1, a.z0, a.x1, a.z1, B.METAL, 2);
      if (Wd >= 6) row(cx - 2, a.z1 - 1, cx + 1, a.z1 - 1, B.WOOD_D);
      if (main) {
        prop('disguise', P(a.x1 - 1, a.z0 + 1), { outfit: 'waiter', name: 'Waiter Uniform' });
        prop('container', P(a.x1 - 1, a.z0 + 3), { name: 'Laundry Cart', cap: 2, model: 'cart' });
        prop('container', P(a.x1 - 1, a.z1 - 1), { name: 'Staff Locker', cap: 1, model: 'closet' });
        prop('item', P(a.x0, a.z1), { item: 'coin', name: 'Coins' });
        M.pts.staff = [cx, y, cz];
        { const f = randFree(); if (f) prop('radio', P(f[0], f[1]), { name: 'Staff Radio' }); }
        { const f = randFree(); if (f) prop('item', P(f[0], f[1]), { item: 'keycard', name: 'Keycard' }); }
      }
      break;
    }
    case 'security': {
      row(a.x0 + 2, a.z0 + 2, a.x1 - 2, a.z0 + 2, B.METAL_D);
      for (let x = a.x0; x <= a.x1; x++) if (w.get(x, y + 1, a.z0 - 1) === T(c.inner)) w.set(x, y + 1, a.z0 - 1, B.SCREEN);
      row(a.x1, a.z0 + 4, a.x1, a.z1, B.METAL, 2);
      if (main) {
        prop('item', [a.x0 + 3, y + 1, a.z0 + 2], { item: 'pistol', name: 'Guard Pistol' });
        prop('disguise', P(a.x1 - 1, a.z1), { outfit: 'guard', name: 'Security Uniform' });
        prop('container', P(a.x1 - 1, a.z1 - 3), { name: 'Gun Locker', cap: 1, model: 'closet' });
        M.pts.sec1 = [cx, y, a.z0 + 3];
        prop('blend', P(cx + 1, a.z0 + 3), { name: 'Security Monitors', act: 'Watch the monitors', outfits: ['guard'] }); M.pts.sec2 = [a.x0 + 1, y, a.z1 - 1]; M.pts.sec3 = [a.x1 - 2, y, cz + 1];
      }
      M.lights.push({ x: cx, y: y + 1.5, z: a.z0 + 1, r: 6, c: [0.3, 0.6, 1.0] });
      break;
    }
    case 'gallery': case 'hall': case 'stairhall': {
      for (let i = 0; i < 4; i++) { const f = randFree(); if (f) put(f[0], f[1], B.LEAVES); }
      wallArt();
      if (R.zone === Z_PUBLIC) for (let i = 0; i < 3; i++) { const f = randFree(); if (f) sp('ballroom', f[0], f[1]); }
      else for (let i = 0; i < 2; i++) { const f = randFree(); if (f) sp('lounge', f[0], f[1]); }
      M.pts['hall' + R.k] = M.pts['hall' + R.k] || (() => { const f = randFree(); return f ? P(f[0], f[1]) : null; })();
      M.pts['hallb' + R.k] = M.pts['hallb' + R.k] || (() => { const f = randFree(); return f ? P(f[0], f[1]) : null; })();
      break;
    }
    case 'ballroom': {
      fl(a.x0 + 2, a.z0 + 2, a.x1 - 2, a.z1 - 4, T(c.carpet));
      const stD = Dd >= 14 ? 3 : 2;
      row(a.x0, a.z1 - stD + 1, a.x1, a.z1, B.WOOD_D);
      put(a.x0, a.z1, B.METAL_D, 3); put(a.x1, a.z1, B.METAL_D, 3);
      const bz = Math.max(a.z0 + 2, cz - 3);
      row(a.x0, bz - 3, a.x0, bz + 3, B.WHITE);
      const ccx = Math.min(a.x1 - 2, cx + 1), ccz = Math.max(a.z0 + 3, cz - 1);
      if (main) {
        M.stops.speech = { p: P(ccx, ccz), face: Math.PI, label: 'Giving a toast under the chandelier', opp: 'chandelier' };
        M.stops.buffet = { p: P(a.x0 + 1, bz), face: -Math.PI / 2, label: 'Snacking at the buffet', opp: 'food' };
        prop('blend', P(a.x0 + 1, bz + 2), { name: 'Buffet Table', act: 'Mingle at the buffet', outfits: ['suit', 'guest', 'vip', 'waiter'] });
        prop('chandelier', [ccx, y + 2, ccz], { name: 'Crystal Chandelier', stop: 'speech' });
        prop('consumable', [a.x0, y + 1, bz], { name: 'Canapé Platter', stop: 'buffet', model: 'plate' });
      }
      for (let z = a.z0 + 1; z < a.z1 - stD; z += 3) for (let x = a.x0 + 3; x <= a.x1 - 1; x += 3) if (Math.hypot(x - ccx, z - ccz) > 1.5) sp('ballroom', x, z);
      break;
    }
    case 'lounge': {
      row(a.x0, a.z0 + 1, a.x0, a.z0 + 3, B.LEATHER);
      if (Dd >= 9) row(a.x0, a.z1 - 3, a.x0, a.z1 - 1, B.LEATHER);
      put(cx, cz, B.MARBLE_B);
      row(a.x1, a.z0, a.x1, a.z1, B.BOOKS, 2);
      for (let i = 0; i < 4; i++) { const f = randFree(); if (f) sp('lounge', f[0], f[1]); }
      if (main) { const f = randFree(); if (f) prop('radio', P(f[0], f[1]), { name: 'Hi-Fi Stereo' }); }
      M.lights.push({ x: cx, y: y + 2, z: cz, r: 8, c: [1.0, 0.5, 0.8] });
      break;
    }
    case 'control': {
      row(a.x1, a.z0, a.x1, a.z1, B.METAL_D, 2);
      for (let z = a.z0 + 1; z <= a.z1; z += 2) if (free(a.x1, z) || w.get(a.x1, y + 1, z) === B.METAL_D) w.set(a.x1, y + 1, z, B.SCREEN);
      row(a.x0 + 2, a.z1, a.x1 - 2, a.z1, B.METAL_D);
      if (main) {
        prop('winch', P(a.x0 + 1, a.z0 + 1), { name: 'Chandelier Winch', stop: 'speech' });
        prop('item', [a.x0 + 3, y + 1, a.z1], { item: 'wrench', name: 'Wrench' });
        prop('container', P(a.x1 - 1, a.z1 - 2), { name: 'Equipment Crate', cap: 1, model: 'crate' });
        M.pts.tech1 = [cx, y, cz]; M.pts.tech2 = [a.x1 - 1, y, a.z0 + 1];
        prop('fusebox', P(a.x0 + 1, a.z1 - 1), { name: 'Fuse Box' });
      }
      break;
    }
    case 'office': {
      const dz = Math.min(a.z1 - 1, a.z0 + 5);
      row(cx - 2, dz, cx + 2, dz, B.WOOD_D);
      if (free(cx - 1, dz) || w.get(cx - 1, y, dz) === B.WOOD_D) w.set(cx - 1, y + 1, dz, B.SCREEN);
      row(a.x0, a.z0 + 1, a.x0, a.z1, B.BOOKS, 2);
      fl(a.x0 + 2, a.z0 + 2, a.x1 - 1, a.z1 - 1, B.VELVET);
      put(a.x1, a.z1, B.LEAVES); put(a.x1, a.z0, B.LEAVES);
      if (main) {
        M.stops.office = { p: P(cx + 1, dz - 1), face: 0, label: 'Pouring a whisky in the office', opp: 'whisky' };
        prop('consumable', [cx + 1, y + 1, dz], { name: 'Vintage Whisky', stop: 'office', model: 'whisky' });
      }
      break;
    }
    case 'suite': {
      row(a.x0 + 1, a.z1 - 4, a.x0 + 3, a.z1, B.WHITE); row(a.x0 + 1, a.z1, a.x0 + 3, a.z1, B.WOOD_D, 2);
      if (main) {
        prop('container', P(a.x1, a.z1), { name: 'Wardrobe', cap: 2, model: 'closet' });
        const f = randFree(); if (f) prop('item', P(f[0], f[1]), { item: 'coin', name: 'Coins' });
        M.pts.suite = [cx, y, a.z0 + 1];
      }
      break;
    }
    case 'spa': {
      // place the 7x7 sauna in a corner that doesn't block any doorway
      const cands = [[a.x1 - 6, a.z0], [a.x0, a.z0], [a.x1 - 6, a.z1 - 6], [a.x0, a.z1 - 6]];
      let pick = null;
      for (const [s0, t0] of cands) {
        let ok = s0 >= a.x0 && t0 >= a.z0 && s0 + 6 <= a.x1 && t0 + 6 <= a.z1;
        for (let z = t0 - 1; ok && z <= t0 + 7; z++) for (let x = s0 - 1; ok && x <= s0 + 7; x++) if (free.prot(x, z)) ok = false;
        if (ok) { pick = [s0, t0]; break; }
      }
      if (!pick) break;
      const [s0, t0] = pick, s1 = s0 + 6, t1 = t0 + 6;
      const doorX = (s0 > a.x0) ? s0 : s1, inX = doorX === s0 ? s0 + 1 : s1 - 1, outX = doorX === s0 ? s0 - 1 : s1 + 1, benchX = doorX === s0 ? s1 - 1 : s0 + 1;
      box(w, s0, y, t0, s1, y + 2, t1, B.WOOD_L);
      box(w, s0 + 1, y, t0 + 1, s1 - 1, y + 2, t1 - 1, 0);
      box(w, benchX, y, t0 + 1, benchX, y, t1 - 1, B.WOOD_D);
      w.set(doorX, y, t0 + 3, 0); w.set(doorX, y + 1, t0 + 3, 0); w.set(doorX, y + 2, t0 + 3, B.GLASS);
      w.setZone(s0, y, t0, s1, y + 2, t1, R.zone);
      if (main) {
        M.stops.sauna = { p: P(s0 + 3, t0 + 3), face: doorX === s0 ? Math.PI / 2 : -Math.PI / 2, label: 'Relaxing in the sauna', opp: 'sauna' };
        prop('sauna', [outX, y + 1, t0 + 2], { name: 'Sauna Controls', stop: 'sauna' });
      }
      M.lights.push({ x: s0 + 3.5, y: y + 2, z: t0 + 3.5, r: 5, c: [1.2, 0.5, 0.2] });
      { const f = randFree(); if (f) M.pts.spa = P(f[0], f[1]); }
      break;
    }
    case 'guardpost': {
      row(a.x1, a.z0, a.x1, a.z1, B.METAL, 2);
      row(cx - 2, a.z1 - 1, cx + 1, a.z1 - 1, B.METAL_D);
      if (main) {
        prop('disguise', P(a.x1 - 1, a.z1), { outfit: 'guard', name: 'Security Uniform' });
        prop('container', P(a.x1 - 1, a.z0 + 1), { name: 'Gun Locker', cap: 1, model: 'closet' });
      }
      M.pts['gp' + R.k] = [cx, y, a.z0 + 1];
      break;
    }
    case 'privatebar': {
      row(a.x0, a.z0, a.x0, a.z1, B.BOOKS, 2);
      row(a.x0 + 1, cz - 4, a.x0 + 1, cz + 4, B.MARBLE_B);
      for (let i = 0; i < 3; i++) { const f = randFree(); if (f && f[0] > a.x0 + 3) put(f[0], f[1], B.MARBLE_B); }
      if (main) {
        M.stops.privatebar = { p: P(a.x0 + 2, cz), face: -Math.PI / 2, label: 'Sampling rare cognac', opp: 'cognac' };
        prop('consumable', [a.x0 + 1, y + 1, cz], { name: 'Rare Cognac', stop: 'privatebar', model: 'whisky' });
      }
      for (let i = 0; i < 4; i++) { const f = randFree(); if (f && f[0] > a.x0 + 2) sp('privatebar', f[0], f[1]); }
      M.lights.push({ x: a.x0 + 2, y: y + 2, z: cz, r: 8, c: [1.0, 0.7, 0.3] });
      break;
    }
    case 'server': {
      for (let x = a.x0 + 1; x <= a.x1 - 1; x += 3) { for (let z = a.z0 + 1; z <= a.z1 - 1; z++) if (z !== cz && z !== cz + 1) { put(x, z, B.METAL_D, 3); if ((z - a.z0) % 3 === 0 && w.get(x, y + 1, z) === B.METAL_D) w.set(x, y + 1, z, B.NEON_C); } }
      const f = randFree(); if (f) prop('item', P(f[0], f[1]), { item: 'coin', name: 'Coins' });
      M.pts.server = [a.x0, y, cz];
      break;
    }
  }
}

/* ---------------- signature kill placement ---------------- */
function placeSignature(w, M, c, rng) {
  const S = SIGNATURES[c.id]; if (!S) return;
  const pref = S.rooms.concat(['lobby', 'ballroom', 'lounge', 'bar', 'court', 'gallery', 'hall']);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const rn of pref) {
    const R = M.roomList.find(r => (r.deco || r.n) === rn || r.n === rn); if (!R) continue;
    const cand = [];
    for (let z = R.a.z0 + 1; z <= R.a.z1 - 1; z++) for (let x = R.a.x0 + 1; x <= R.a.x1 - 1; x++) {
      if (!w.walkable(x, R.y, z)) continue;
      const busy = M.props.some(p => Math.abs(p.p[0] - x - 0.5) < 2 && Math.abs(p.p[2] - z - 0.5) < 2 && Math.abs(p.p[1] - R.y) < 2) || Object.values(M.stops).some(s => Math.abs(s.p[0] - x) < 3 && Math.abs(s.p[2] - z) < 3 && s.p[1] === R.y);
      if (busy) continue;
      for (const [dx, dz] of dirs) if (w.walkable(x + dx, R.y, z + dz) && w.walkable(x - dx, R.y, z - dz)) { cand.push([x, z, dx, dz]); break; }
    }
    if (!cand.length) continue;
    const [x, z, dx, dz] = cand[Math.floor(rng() * cand.length)];
    const y = R.y;
    if (S.type === 'drop') {
      M.stops.signature = { p: [x, y, z], face: Math.atan2(dx, dz), label: S.label, opp: 'sig', sig: S };
      M.props.push({ type: 'sig', p: [x + 0.5, y + 2.2, z + 0.5], name: S.name, stop: 'signature', sig: S });
    } else {
      M.stops.signature = { p: [x, y, z], face: Math.atan2(dx, dz), label: S.label, opp: 'sig', sig: S };
      M.props.push({ type: 'sig', p: [x + dx + 0.5, y, z + dz + 0.5], name: S.name, stop: 'signature', sig: S });
    }
    return;
  }
}

/* ---------------- seats: sofas, stools, benches ---------------- */
function addSeats(w, M) {
  const SEAT = new Set([B.LEATHER, B.FABRIC, B.WOOD_D, B.FABRIC_D]);
  const groupOf = { lobby: 'lobby', bar: 'bar', lounge: 'lounge', privatebar: 'privatebar', ballroom: 'ballroom', court: 'court', vipgallery: 'lounge', skylounge: 'lounge' };
  const push = (g, x, y, z, f) => { (M.spots[g] = M.spots[g] || []).push([x, y, z, f, 'sit']); };
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const R of M.roomList) {
    const g = groupOf[R.deco || R.n]; if (!g) continue;
    let n = 0;
    for (let z = R.a.z0; z <= R.a.z1 && n < 6; z++) for (let x = R.a.x0; x <= R.a.x1 && n < 6; x++) {
      if (!SEAT.has(w.get(x, R.y, z)) || w.get(x, R.y + 1, z)) continue;
      for (const [dx, dz] of dirs) { if (w.walkable(x + dx, R.y, z + dz)) { push(g, x + dx, R.y, z + dz, Math.atan2(dx, dz)); n++; break; } }
    }
  }
  // outdoor benches
  let ng = 0, ns = 0;
  for (let z = 26; z < 96; z++) for (let x = 6; x < 114; x++) {
    if (w.get(x, G, z) !== B.WOOD_D || w.get(x, G + 1, z)) continue;
    if (x >= BX && x < BX + BW && z >= BZ && z < BZ + BD) continue;
    const inC = x >= BX - 10 && x <= BX + BW + 9 && z <= BZ + BD + 10;
    if (inC ? ng > 6 : ns > 8) continue;
    for (const [dx, dz] of dirs) if (w.walkable(x + dx, G, z + dz) && w.zoneAt(x + dx, G, z + dz) === Z_PUBLIC) { push(inC ? 'garden' : 'side', x + dx, G, z + dz, Math.atan2(dx, dz)); inC ? ng++ : ns++; break; }
  }
}

/* ---------------- NPC population from rooms ---------------- */
function populate(M, LY, yk, C, rng) {
  const W = M.world, F = LY.floors.length, R = M.rooms;
  const near = p => { if (!p) return null; for (let r = 0; r <= 3; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (W.walkable(p[0] + dx, p[1], p[2] + dz)) return [p[0] + dx, p[1], p[2] + dz]; return null; };
  const rp = (room, fx, fz) => { const r = R[room]; if (!r) return null; return near([Math.round(r.a.x0 + (r.a.x1 - r.a.x0) * fx), r.y, Math.round(r.a.z0 + (r.a.z1 - r.a.z0) * fz)]); };
  const route = (pts, waits) => { const out = []; pts.forEach((p, i) => { const q = near(p); if (q) out.push(q.concat(waits ? waits[i] || waits[0] : 4)); }); return out; };
  const guard = (pts, o) => { const r = route(pts, [o && o.wait || 5]); if (r.length) M.guards.push(Object.assign({ route: r }, o || {}, { post: r.length === 1 })); };
  const g0 = G, EX = C.EX;
  // exterior
  guard([[EX - 3, g0, C.CZ0 - 1]], { face: Math.PI }); guard([[EX + 3, g0, C.CZ0 - 1]], { face: Math.PI });
  guard([[EX - 2, g0, BZ - 2]], { face: Math.PI }); guard([[EX + 2, g0, BZ - 2]], { face: Math.PI });
  const ring = [[BX - 3, g0, BZ - 6], [BX - 3, g0, BZ + BD + 2], [BX + BW + 2, g0, BZ + BD + 2], [BX + BW + 2, g0, BZ - 6]];
  M.guards.push({ route: route(ring, [4]) }); M.guards.push({ route: route(ring.slice().reverse(), [3]) });
  guard([[BX + 5, g0, BZ + BD + 2], [BX + BW - 6, g0, Math.min(C.CZ1 - 2, BZ + BD + 6)]], { wait: 6 });
  guard([[C.BKX, g0, C.CZ1 + 2]], { face: 0 });
  // interior
  guard([R.security && M.pts.sec1], { face: Math.PI });
  guard([M.pts.sec2, M.pts.sec3], { wait: 5 });
  guard([rp('lobby', 0.9, 0.15)], { face: -Math.PI / 2 });
  for (let k = 1; k < F; k++) {
    const hall = LY.floors[k].find(r => r.r[0] <= LY.stair[0] + 1 && r.r[2] >= LY.stair[0] + 9 && r.r[1] <= LY.stair[1] + 1 && r.r[3] >= LY.stair[1] + 9);
    if (M.pts['hall' + k] && M.pts['hallb' + k]) guard([M.pts['hall' + k], M.pts['hallb' + k]], { wait: 6 });
    if (hall && hall.zone >= Z_VIP || k >= 2) guard([M.pts['arrive' + k]], { face: Math.PI });
    if (M.pts['gp' + k]) guard([M.pts['gp' + k]], { face: 0 });
  }
  if (M.pts.server) guard([M.pts.server, rp('server', 0.9, 0.5)], { wait: 5 });
  const yr = yk(F);
  guard([[BX + 3, yr, BZ + BD - 4], [BX + BW - 4, yr, BZ + BD - 4], [BX + BW - 4, yr, BZ + 3]], { wait: 5, roof: true });
  // staff
  const S = (outfit, pts, waits, o) => { const r = route(pts.filter(Boolean), waits); if (r.length) M.staff.push(Object.assign({ outfit, route: r, post: r.length === 1 }, o || {})); };
  S('waiter', [M.pts.bartender], [6], { face: 0 });
  S('chef', [M.pts.chef1, M.pts.chef2], [8]);
  S('chef', [M.pts.chef2, M.pts.kpass], [10]);
  const bs = M.spots.ballroom || [];
  S('waiter', [M.pts.kpass, bs[0] && bs[0].slice(0, 3), bs[3] && bs[3].slice(0, 3), M.stops.bar && M.stops.bar.p], [4, 5, 5, 3]);
  S('waiter', [M.pts.kpass, bs[6] && bs[6].slice(0, 3), bs[9] && bs[9].slice(0, 3), rp('lobby', 0.5, 0.5)], [3, 5, 4, 4]);
  S('waiter', [M.pts.chef2, rp('bar', 0.7, 0.8), rp('lobby', 0.3, 0.3)], [5, 4, 4]);
  S('cleaner', [M.pts.bath, rp('lobby', 0.4, 0.6), M.pts.staff], [6, 5, 5]);
  S('tech', [M.pts.tech1, M.pts.tech2], [10, 8]);
  S('cleaner', [M.pts.suite, M.pts.spa, rp('office', 0.3, 0.8)], [6, 6, 5]);
  // guests
  const gc = { plaza: 6, lobby: 4, bar: 4, ballroom: 10, garden: 3, street: 4, lounge: 3, roof: 3, alley: 1, court: 5, privatebar: 3 };
  for (const g in gc) if (M.spots[g] && M.spots[g].length) for (let i = 0; i < gc[g]; i++) M.guests.push({ group: g, vip: ['lounge', 'roof', 'privatebar'].includes(g) });
  for (const g of ['market', 'side']) if (M.spots[g]) for (let i = 0; i < Math.min(5, M.spots[g].length); i++) M.guests.push({ group: g });
}

/* ---------------- side areas ---------------- */
function buildSideArea(w, M, c, rng, kind, x0, x1, z0, z1) {
  const T = k => B[k];
  const spot = (p) => { (M.spots.side = M.spots.side || []).push([p[0], p[1], p[2], null]); };
  const cx = Math.floor((x0 + x1) / 2), cz = Math.floor((z0 + z1) / 2);
  switch (kind) {
    case 'park': {
      box(w, x0, G - 1, z0, x1, G - 1, z1, B.GRASS);
      box(w, cx - 1, G - 1, z0, cx + 1, G - 1, z1, B.PAVE);
      box(w, x0, G - 1, cz - 1, x1, G - 1, cz + 1, B.PAVE);
      // pond
      cyl(w, cx - 6, cz + 14, G - 1, G - 1, 4, B.WATER); cyl(w, cx - 6, cz + 14, G - 2, G - 2, 4, B.WATER);
      for (let i = 0; i < 14; i++) { const x = rng.int(x0 + 2, x1 - 2), z = rng.int(z0 + 2, z1 - 2); if (Math.abs(x - cx) > 2 && Math.abs(z - cz) > 2 && Math.hypot(x - cx + 6, z - cz - 14) > 6) tree(w, x, G, z, 'oak', rng); }
      for (let z = z0 + 4; z < z1; z += 10) { bench(w, cx + 2, G, z, 'z'); spot([cx + 3, G, z]); lampPost(w, cx - 2, G, z + 3, M); }
      break;
    }
    case 'formal': {
      box(w, x0, G - 1, z0, x1, G - 1, z1, B.GRASS);
      box(w, cx - 1, G - 1, z0, cx + 1, G - 1, z1, B.PAVE);
      for (let z = z0 + 3; z < z1 - 2; z += 6) for (const dx of [-6, 4]) { box(w, cx + dx, G, z, cx + dx + 2, G, z + 3, B.HEDGE); w.set(cx + dx + 1, G + 1, z + 1, B.FLOWER); }
      cyl(w, cx, cz, G, G, 3, B.MARBLE); cyl(w, cx, cz, G, G, 2.2, B.WATER); w.set(cx, G, cz, B.MARBLE); w.set(cx, G + 1, cz, B.MARBLE); w.set(cx, G + 2, cz, B.WHITE);
      for (let z = z0 + 6; z < z1; z += 12) { tree(w, x0 + 3, G, z, 'cypress', rng); tree(w, x1 - 3, G, z, 'cypress', rng); spot([cx, G, z]); }
      lampPost(w, cx + 2, G, cz - 6, M); lampPost(w, cx - 2, G, cz + 6, M);
      break;
    }
    case 'palms': {
      box(w, x0, G - 1, z0, x1, G - 1, z1, B.SAND);
      box(w, x0 + 4, G - 1, cz - 6, x1 - 4, G - 1, cz + 6, B.TILE_W);
      box(w, x0 + 6, G - 1, cz - 4, x1 - 6, G - 1, cz + 4, B.POOLW); box(w, x0 + 6, G - 2, cz - 4, x1 - 6, G - 2, cz + 4, B.POOLW);
      for (let i = 0; i < 12; i++) { const x = rng.int(x0 + 2, x1 - 2), z = rng.int(z0 + 2, z1 - 2); if (Math.abs(z - cz) > 8) tree(w, x, G, z, 'palm', rng); }
      for (let x = x0 + 5; x < x1 - 4; x += 4) { w.set(x, G, cz - 7, B.WHITE); w.set(x, G, cz + 7, B.WHITE); spot([x, G, cz - 8]); }
      lampPost(w, x0 + 3, G, cz, M); lampPost(w, x1 - 3, G, cz, M);
      break;
    }
    case 'sakura': {
      box(w, x0, G - 1, z0, x1, G - 1, z1, B.GRASS);
      box(w, cx - 1, G - 1, z0, cx + 1, G - 1, z1, B.STONE);
      for (let i = 0; i < 14; i++) { const x = rng.int(x0 + 2, x1 - 2), z = rng.int(z0 + 2, z1 - 2); if (Math.abs(x - cx) > 3) tree(w, x, G, z, 'sakura', rng); }
      // torii gate
      box(w, cx - 3, G, cz, cx - 3, G + 4, cz, B.RED); box(w, cx + 3, G, cz, cx + 3, G + 4, cz, B.RED);
      box(w, cx - 4, G + 5, cz, cx + 4, G + 5, cz, B.BLACK); box(w, cx - 3, G + 4, cz, cx + 3, G + 4, cz, B.RED);
      for (let z = z0 + 4; z < z1; z += 8) { w.set(cx - 2, G, z, B.STONE); w.set(cx - 2, G + 1, z, B.LAMP); M.lights.push({ x: cx - 1.5, y: G + 1.5, z: z + 0.5, r: 6, c: [1.0, 0.75, 0.5] }); spot([cx + 2, G, z]); }
      break;
    }
    case 'market': {
      box(w, x0, G - 1, z0, x1, G - 1, z1, c.ground === 'SAND' ? B.SAND : B.PAVE);
      const aw = [B.AWNING, B.AWNING_G, B.AWNING_B];
      for (let z = z0 + 3; z < z1 - 3; z += 7) for (const sx of [x0 + 2, x1 - 7]) {
        box(w, sx, G, z, sx + 4, G, z + 1, B.WOOD);
        for (let i = 0; i < 5; i++) w.set(sx + i, G + 1, z, rng.pick([B.ORANGE, B.RED, B.YELLOW, B.GREEN, B.FABRIC]));
        w.set(sx, G + 1, z + 1, B.WOOD_D); w.set(sx, G + 2, z + 1, B.WOOD_D); w.set(sx + 4, G + 1, z + 1, B.WOOD_D); w.set(sx + 4, G + 2, z + 1, B.WOOD_D);
        box(w, sx, G + 3, z - 1, sx + 4, G + 3, z + 2, rng.pick(aw));
        (M.spots.market = M.spots.market || []).push([sx + 2, G, z + 3, Math.PI]);
      }
      for (let z = z0 + 6; z < z1; z += 14) lampPost(w, cx, G, z, M);
      break;
    }
    case 'plaza': {
      box(w, x0, G - 1, z0, x1, G - 1, z1, B.PAVE);
      for (let i = 0; i < 6; i++) { const x = rng.int(x0 + 3, x1 - 3), z = rng.int(z0 + 3, z1 - 3); w.set(x, G, z, B.METAL_D); w.set(x, G + 1, z, B.METAL_D); box(w, x - 1, G + 2, z - 1, x + 1, G + 2, z + 1, rng.pick([B.AWNING, B.AWNING_G, B.AWNING_B])); w.set(x + 1, G, z, B.WOOD_D); spot([x - 1, G, z]); }
      for (let z = z0 + 2; z < z1; z += 9) { tree(w, x0 + 2, G, z, c.ground === 'SAND' ? 'palm' : 'oak', rng); tree(w, x1 - 2, G, z, c.ground === 'SAND' ? 'palm' : 'oak', rng); }
      lampPost(w, cx, G, cz, M);
      break;
    }
    case 'parking': {
      box(w, x0, G - 1, z0, x1, G - 1, z1, B.ASPHALT);
      const cols = [B.RED, B.BLUE, B.BLACK, B.WHITE, B.METAL, B.YELLOW];
      for (let z = z0 + 2; z < z1 - 14; z += 4) for (let x = x0 + 2; x < x1 - 4; x += 7) if (rng() < 0.7) car(w, x, G, z, rng.pick(cols), 'x');
      for (let z = z0 + 4; z < z1; z += 12) lampPost(w, x0 + 1, G, z, M);
      spot([x0 + 6, G, z0 + 8]); spot([x1 - 6, G, z0 + 20]);
      break;
    }
    case 'neon': {
      box(w, x0, G - 1, z0, x1, G - 1, z1, B.CONCRETE);
      const nc = [B.NEON_P, B.NEON_C, B.NEON_Y, B.NEON_R];
      for (let z = z0 + 2; z < z1 - 14; z += 10) for (const sx of [x0 + 1, x1 - 7]) {
        const h = rng.int(4, 8);
        w.cutMode = 1; box(w, sx, G, z, sx + 6, G + h, z + 6, rng.pick([B.TOWER_D, B.CONCRETE, B.BRICK])); w.cutMode = 0;
        const face = sx < cx ? sx + 7 : sx - 1;
        box(w, face, G + 2, z + 1, face, G + 3, z + 5, rng.pick(nc));
        M.lights.push({ x: face + 0.5, y: G + 2.5, z: z + 3, r: 8, c: rng.pick([[1, 0.3, 0.8], [0.3, 0.9, 1], [1, 0.85, 0.3]]) });
        spot([sx < cx ? sx + 9 : sx - 3, G, z + 3]);
      }
      break;
    }
    case 'canal': {
      box(w, x0, G - 1, z0, x1, G - 1, z1, B.STONE);
      box(w, cx - 3, G - 3, z0, cx + 3, G - 1, z1, B.WATER);
      box(w, cx - 3, G - 4, z0, cx + 3, G - 4, z1, B.STONE);
      for (let z = z0 + 8; z < z1; z += 18) { box(w, cx - 4, G - 1, z, cx + 4, G - 1, z + 2, B.BRICK_W); box(w, cx - 4, G, z, cx + 4, G, z, B.RAIL_W); box(w, cx - 4, G, z + 2, cx + 4, G, z + 2, B.RAIL_W); }
      // gondolas
      for (let z = z0 + 4; z < z1; z += 15) { box(w, cx - 1, G - 1, z, cx - 1, G - 1, z + 4, B.BLACK); w.set(cx - 1, G, z + 4, B.BLACK); }
      for (let z = z0 + 5; z < z1; z += 9) { lampPost(w, cx - 5, G, z, M); spot([cx + 5, G, z]); }
      break;
    }
  }
}

/* ---------------- landmarks ---------------- */
function buildLandmark(w, M, c, rng) {
  const T = k => B[k];
  const cx = 60, cz = 113;
  switch (c.landmark) {
    case 'clocktower': {
      box(w, cx - 4, G, cz - 4, cx + 4, G + 30, cz + 4, B.SANDSTONE);
      for (let y = G + 2; y < G + 28; y += 3) { box(w, cx - 4, y, cz - 2, cx - 4, y + 1, cz + 2, B.GLASS); box(w, cx + 4, y, cz - 2, cx + 4, y + 1, cz + 2, B.GLASS); box(w, cx - 2, y, cz - 4, cx + 2, y + 1, cz - 4, B.GLASS); }
      box(w, cx - 5, G + 31, cz - 5, cx + 5, G + 36, cz + 5, B.SANDSTONE);
      box(w, cx - 3, G + 32, cz - 5, cx + 3, G + 35, cz - 5, B.WHITE); w.set(cx, G + 34, cz - 6, B.BLACK); w.set(cx, G + 33, cz - 6, B.BLACK); w.set(cx + 1, G + 33, cz - 6, B.BLACK);
      box(w, cx - 3, G + 32, cz + 5, cx + 3, G + 35, cz + 5, B.WHITE);
      for (let i = 0; i < 7; i++) box(w, cx - 4 + i, G + 37 + i * 1.5 | 0, cz - 4 + i, cx + 4 - i, (G + 38 + i * 1.5) | 0, cz + 4 - i, i > 4 ? B.GOLD : B.ROOF_G);
      M.lights.push({ x: cx, y: G + 34, z: cz - 7, r: 12, c: [1, 0.9, 0.6] });
      // parliament wing
      box(w, cx - 30, G, cz - 3, cx - 6, G + 10, cz + 4, B.SANDSTONE); box(w, cx + 6, G, cz - 3, cx + 26, G + 10, cz + 4, B.SANDSTONE);
      for (let x = cx - 30; x <= cx + 26; x += 3) if (Math.abs(x - cx) > 5) box(w, x, G + 11, cz - 3, x, G + 13, cz - 3, B.SANDSTONE);
      break;
    }
    case 'eiffel': {
      const base = 10, top = 46;
      for (let y = G; y <= G + top; y++) {
        const t = (y - G) / top; const hw = Math.max(1, Math.round(base * Math.pow(1 - t, 1.7) + 1));
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { box(w, cx + sx * hw - (sx > 0 ? 1 : 0), y, cz + sz * hw - (sz > 0 ? 1 : 0), cx + sx * hw - (sx > 0 ? 1 : 0) + 1, y, cz + sz * hw - (sz > 0 ? 1 : 0) + 1, B.STEEL_B); }
        if ([G + 10, G + 22, G + 36].includes(y)) { hollow(w, cx - hw - 1, y, cz - hw - 1, cx + hw + 1, y, cz + hw + 1, B.STEEL_B); hollow(w, cx - hw - 1, y + 1, cz - hw - 1, cx + hw + 1, y + 1, cz + hw + 1, B.RAIL); }
        if (y < G + 9) { const ar = Math.round((G + 9 - y) * 0.9); if (ar < hw - 1) { w.set(cx - ar, y, cz - hw, B.STEEL_B); w.set(cx + ar, y, cz - hw, B.STEEL_B); } }
      }
      box(w, cx, G + top, cz, cx, G + top + 5, cz, B.METAL);
      M.lights.push({ x: cx, y: G + 36, z: cz, r: 14, c: [1, 0.85, 0.5] });
      break;
    }
    case 'burj': {
      let hw = 7;
      for (let y = G; y < MAP_H - 6; y++) {
        if ((y - G) % 9 === 8 && hw > 1) hw--;
        box(w, cx - hw, y, cz - hw + 1, cx + hw, y, cz + hw - 1, B.TOWER); box(w, cx - hw + 1, y, cz - hw, cx + hw - 1, y, cz + hw, B.TOWER);
      }
      box(w, cx, MAP_H - 6, cz, cx, MAP_H - 1, cz, B.METAL);
      for (const dx of [-24, 22]) { const h = rng.int(18, 30); box(w, cx + dx - 3, G, cz - 3, cx + dx + 3, G + h, cz + 3, B.TOWER_W); box(w, cx + dx - 1, G + h + 1, cz - 1, cx + dx + 1, G + h + 3, cz + 1, B.GOLD); }
      break;
    }
    case 'pagoda': {
      for (let t = 0; t < 5; t++) {
        const y = G + t * 6, hw = 6 - t;
        box(w, cx - hw, y, cz - hw, cx + hw, y + 3, cz + hw, B.RED);
        box(w, cx - hw - 2, y + 4, cz - hw - 2, cx + hw + 2, y + 4, cz + hw + 2, B.ROOF_B);
        box(w, cx - hw - 1, y + 5, cz - hw - 1, cx + hw + 1, y + 5, cz + hw + 1, B.ROOF_B);
        box(w, cx - hw, y + 1, cz - hw - 0, cx + hw, y + 2, cz - hw, B.NEON_Y);
        M.lights.push({ x: cx, y: y + 2, z: cz - hw - 1, r: 9, c: [1, 0.7, 0.3] });
      }
      box(w, cx, G + 30, cz, cx, G + 36, cz, B.GOLD);
      break;
    }
    case 'skyline': case 'neonskyline': {
      const neon = c.landmark === 'neonskyline';
      for (let x = 30; x < 92; x += rng.int(6, 9)) {
        const h = rng.int(20, 46); const t = rng.pick([B.TOWER, B.TOWER_D, B.TOWER_W]);
        box(w, x, G, cz - 3, x + 4, G + h, cz + 4, t);
        if (neon) { box(w, x, G + rng.int(6, h - 4), cz - 4, x + 4, G + rng.int(6, h - 4), cz - 4, rng.pick([B.NEON_P, B.NEON_C, B.NEON_R, B.NEON_Y])); }
      }
      // signature stepped tower
      box(w, cx - 5, G, cz - 5, cx + 5, G + 30, cz + 5, B.TOWER_W); box(w, cx - 3, G + 31, cz - 3, cx + 3, G + 42, cz + 3, B.TOWER_W);
      box(w, cx - 1, G + 43, cz - 1, cx + 1, G + 48, cz + 1, B.TOWER_W); box(w, cx, G + 49, cz, cx, MAP_H - 2, cz, B.METAL);
      if (neon) { box(w, cx - 5, G + 20, cz - 6, cx + 5, G + 21, cz - 6, B.NEON_R); }
      break;
    }
    case 'colosseum': {
      for (let y = G; y < G + 16; y++) {
        for (let a = 0; a < 360; a += 1.2) {
          const r = a * Math.PI / 180; const x = Math.round(cx + Math.cos(r) * 16), z = Math.round(cz + Math.sin(r) * 6);
          const lvl = (y - G) % 5; const arch = lvl >= 1 && lvl <= 3 && Math.floor(a / 6) % 2 === 0;
          const ruin = y > G + 10 && Math.sin(r * 3) > 0.3;
          if (!arch && !ruin) w.set(x, y, z, B.SANDSTONE);
        }
      }
      break;
    }
    case 'casino': {
      box(w, cx - 14, G, cz - 4, cx + 14, G + 9, cz + 5, B.PLASTER);
      for (let x = cx - 13; x <= cx + 13; x += 3) box(w, x, G, cz - 5, x, G + 8, cz - 5, B.WHITE);
      sphere(w, cx, G + 10, cz, 6, B.COPPER, true); sphere(w, cx - 11, G + 10, cz, 3, B.COPPER, true); sphere(w, cx + 11, G + 10, cz, 3, B.COPPER, true);
      box(w, cx - 12, G + 4, cz - 5, cx + 12, G + 4, cz - 5, B.NEON_Y);
      // yachts on river
      for (const x of [20, 44, 78, 98]) { box(w, x, G - 1, 101, x + 9, G - 1, 104, B.WHITE); box(w, x + 2, G, 102, x + 6, G + 1, 103, B.WHITE); box(w, x + 3, G + 1, 102, x + 5, G + 1, 103, B.GLASS); }
      M.lights.push({ x: cx, y: G + 6, z: cz - 6, r: 14, c: [1, 0.85, 0.4] });
      break;
    }
    case 'minaret': {
      box(w, cx - 3, G, cz - 3, cx + 3, G + 30, cz + 3, B.SANDSTONE);
      for (let y = G + 4; y < G + 28; y += 6) { box(w, cx - 1, y, cz - 4, cx + 1, y + 2, cz - 4, B.TILE_B); }
      box(w, cx - 4, G + 31, cz - 4, cx + 4, G + 31, cz + 4, B.TERRA); box(w, cx - 2, G + 32, cz - 2, cx + 2, G + 36, cz + 2, B.SANDSTONE);
      box(w, cx, G + 37, cz, cx, G + 40, cz, B.GOLD);
      for (let x = 20; x < 100; x += 8) if (Math.abs(x - cx) > 6) box(w, x, G, cz - 3 + rng.int(0, 2), x + 6, G + rng.int(5, 10), cz + 4, B.CLAY);
      break;
    }
    case 'gateway': {
      box(w, cx - 10, G, cz - 3, cx + 10, G + 20, cz + 3, B.SANDSTONE);
      box(w, cx - 4, G, cz - 3, cx + 4, G + 12, cz + 3, 0);
      sphere(w, cx - 4, G + 13, cz, 4.5, 0, false); box(w, cx - 10, G, cz - 3, cx + 10, G + 10, cz + 3, 0); box(w, cx - 10, G, cz - 3, cx - 5, G + 20, cz + 3, B.SANDSTONE); box(w, cx + 5, G, cz - 3, cx + 10, G + 20, cz + 3, B.SANDSTONE);
      box(w, cx - 4, G + 13, cz - 3, cx + 4, G + 20, cz + 3, B.SANDSTONE);
      for (const dx of [-8, -3, 3, 8]) sphere(w, cx + dx, G + 21, cz, 2, B.SANDSTONE, true);
      for (const dx of [-9, 9]) box(w, cx + dx, G + 21, cz - 2, cx + dx, G + 25, cz - 2, B.SANDSTONE);
      M.lights.push({ x: cx, y: G + 10, z: cz - 5, r: 14, c: [1, 0.7, 0.4] });
      break;
    }
    case 'sugarloaf': {
      for (const [px, pz, r, h] of [[cx - 10, cz + 1, 10, 34], [cx + 18, cz + 2, 8, 22]]) {
        for (let y = G; y < G + h; y++) { const t = (y - G) / h; const rr = r * Math.sqrt(1 - t * t * t) + 0.5; cyl(w, px, pz, y, y, rr, y > G + h - 3 ? B.LEAVES : t > 0.7 ? B.GRASS : B.STONE); }
      }
      for (let i = 0; i <= 28; i++) w.set(cx - 10 + i, G + 33 - Math.round(i * 0.45), cz + 1, B.METAL_D);
      box(w, 0, G - 1, 99, MAP_W - 1, G - 1, 99, B.SAND);
      break;
    }
    case 'tvtower': {
      cyl(w, cx, cz, G, G + 34, 2, B.CONCRETE);
      sphere(w, cx, G + 37, cz, 5.5, B.METAL);
      box(w, cx - 6, G + 37, cz - 6, cx + 6, G + 37, cz + 6, 0); cyl(w, cx, cz, G + 37, G + 37, 5.6, B.TOWER_D);
      cyl(w, cx, cz, G + 42, G + 50, 1, B.CONCRETE); box(w, cx, G + 51, cz, cx, MAP_H - 2, cz, B.RED);
      M.lights.push({ x: cx, y: G + 37, z: cz - 6, r: 12, c: [1, 0.3, 0.3] });
      break;
    }
    case 'opera': {
      box(w, cx - 16, G, cz - 4, cx + 16, G + 1, cz + 5, B.SANDSTONE);
      for (const [ox, s] of [[-10, 14], [-2, 16], [7, 12], [13, 9]]) {
        for (let y = 0; y < s; y++) { const hw = Math.round((s - y) * 0.35); box(w, cx + ox - hw, G + 2 + y, cz - 3 + Math.round(y * 0.4), cx + ox + hw, G + 2 + y, cz - 2 + Math.round(y * 0.4), B.TILE_W); }
      }
      // harbour bridge arch to the left
      for (let x = 0; x <= 28; x++) { const t = (x - 14) / 14; const y = G + Math.round(16 * (1 - t * t)); w.set(x, y, 104, B.STEEL_B); w.set(x, y + 1, 104, B.STEEL_B); w.set(x, G + 4, 104, B.METAL_D); }
      break;
    }
    case 'mosque': {
      box(w, cx - 9, G, cz - 6, cx + 9, G + 8, cz + 6, B.PLASTER);
      sphere(w, cx, G + 9, cz, 7, B.ROOF_S, true); box(w, cx, G + 16, cz, cx, G + 19, cz, B.GOLD);
      for (const dx of [-7, 7]) sphere(w, cx + dx, G + 9, cz - 3, 3, B.ROOF_S, true);
      for (const [dx, dz] of [[-12, -8], [12, -8], [-12, 8], [12, 8]]) { box(w, cx + dx, G, cz + dz, cx + dx, G + 26, cz + dz, B.PLASTER); box(w, cx + dx - 1, G + 18, cz + dz - 1, cx + dx + 1, G + 18, cz + dz + 1, B.PLASTER); box(w, cx + dx, G + 27, cz + dz, cx + dx, G + 30, cz + dz, B.ROOF_S); }
      break;
    }
    case 'campanile': {
      box(w, cx - 3, G, cz - 3, cx + 3, G + 28, cz + 3, B.BRICK);
      box(w, cx - 3, G + 29, cz - 3, cx + 3, G + 32, cz + 3, B.WHITE); box(w, cx - 2, G + 29, cz - 3, cx + 2, G + 31, cz + 3, 0); box(w, cx - 3, G + 29, cz - 2, cx + 3, G + 31, cz + 2, 0);
      w.set(cx, G + 29, cz, B.GOLD);
      for (let i = 0; i < 4; i++) box(w, cx - 3 + i, G + 33 + i * 2, cz - 3 + i, cx + 3 - i, G + 34 + i * 2, cz + 3 - i, B.ROOF_G);
      box(w, cx + 8, G, cz - 4, cx + 24, G + 12, cz + 4, B.PLASTER_P); for (let x = cx + 9; x < cx + 24; x += 2) box(w, x, G + 1, cz - 5, x, G + 9, cz - 5, B.WHITE);
      M.lights.push({ x: cx, y: G + 30, z: cz - 4, r: 10, c: [1, 0.8, 0.5] });
      break;
    }
  }
}

/* ---------------- Hideout ---------------- */
const HIDE_W = 40, HIDE_H = 22, HIDE_D = 36;
function buildHideout(tier) {
  const w = new World(HIDE_W, HIDE_H, HIDE_D);
  const M = { world: w, props: [], lights: [], spots: {}, hideout: true };
  const y = 3, X0 = 12, X1 = 27, Z0 = 10, Z1 = 23;
  const floorT = [B.CONCRETE, B.WOOD, B.WOOD_D, B.MARBLE_B][tier];
  const wallT = [B.CONCRETE, B.BRICK, B.PLASTER, B.TOWER_D][tier];
  box(w, 0, 0, 0, HIDE_W - 1, y - 2, HIDE_D - 1, B.STONE);
  box(w, 0, y - 1, 0, HIDE_W - 1, y - 1, HIDE_D - 1, B.ASPHALT);
  box(w, X0, y - 1, Z0, X1, y - 1, Z1, floorT);
  w.cutMode = 1;
  hollow(w, X0, y, Z0, X1, y + 4, Z1, wallT);
  // windows on the back wall, either side of the List / trophy wall
  for (const x of [14, 15, 23, 24]) box(w, x, y + 1, Z1, x, y + 3, Z1, B.GLASS);
  if (tier >= 3) { box(w, 13, y + 1, Z1, 16, y + 3, Z1, B.GLASS); box(w, 22, y + 1, Z1, 25, y + 3, Z1, B.GLASS); }
  const rng = RNG(77 + tier);
  w.cutMode = 0;
  for (let x = 0; x < HIDE_W; x += rng.int(3, 5)) { const h = rng.int(6, 18); box(w, x, y - 1, Z1 + 4 + rng.int(0, 2), x + 2, y + h, Z1 + 7, rng.pick([B.TOWER, B.TOWER_D, B.TOWER_W])); }
  w.cutMode = 1;
  if (tier >= 2) for (let x = X0; x <= X1; x++) { w.set(x, y + 4, Z0, B.GOLD); w.set(x, y + 4, Z1, B.GOLD); }
  // framed pictures and a city map on the walls
  box(w, X0, y + 1, 18, X0, y + 2, 21, B.BLUE); w.set(X0, y + 2, 19, B.GRASS); w.set(X0, y + 1, 20, B.YELLOW); w.set(X0, y + 2, 21, B.RED);
  w.set(X1, y + 2, 13, tier >= 2 ? B.GOLD : B.WOOD_D); w.set(X1, y + 2, 15, rng.pick([B.RED, B.BLUE, B.YELLOW]));
  w.cutMode = 0;
  // ceiling lamp over the table, wall lamps
  M.lights.push({ x: 19.5, y: y + 3.4, z: 16.5, r: 11, c: [1.0, 0.86, 0.64] });
  // left side: bookshelf, plants, (aquarium)
  box(w, X0 + 1, y, 16, X0 + 1, y + 2, 17, tier >= 1 ? B.BOOKS : B.WOOD);
  if (tier >= 2) { box(w, X0 + 1, y, 13, X0 + 1, y + 2, 15, B.GLASS); box(w, X0 + 1, y, 14, X0 + 1, y + 1, 14, B.WATER); M.lights.push({ x: 13.5, y: y + 1.5, z: 14, r: 5, c: [0.3, 0.7, 1.0] }); }
  else { w.set(X0 + 1, y, 14, B.WOOD); w.set(X0 + 1, y + 1, 14, B.LEAVES); }
  for (const [x, z] of [[X0 + 1, Z0 + 1], [X1 - 1, 16]]) { w.set(x, y, z, B.TERRA); w.set(x, y + 1, z, B.LEAVES); }
  // centre rug under the contracts table
  if (tier >= 1) box(w, 16, y - 1, 14, 23, y - 1, 19, [0, B.CARPET_R, B.CARPET_B, B.CARPET_K][tier]);
  // back right: sleeping corner or lounge
  if (tier === 0) {
    box(w, 21, y, 11, 24, y, 12, B.FABRIC_D);
    for (const [x, z] of [[25, 11], [25, 12], [24, 13]]) w.set(x, y, z, B.WOOD);
    w.set(25, y + 1, 11, B.WOOD);
    M.lights.push({ x: 23, y: y + 2.5, z: 12, r: 7, c: [1.0, 0.75, 0.45] });
  } else {
    box(w, 21, y, 11, 24, y, 11, tier >= 2 ? B.LEATHER : B.FABRIC);
    box(w, 22, y, 13, 23, y, 13, B.WOOD_D);
    M.lights.push({ x: 22.5, y: y + 2.8, z: 12, r: 7, c: [1.0, 0.82, 0.58] });
  }
  // front left: bar
  if (tier >= 2) {
    box(w, 14, y, 11, 16, y, 11, B.MARBLE_B); w.set(14, y + 1, 11, B.BOOKS); w.set(16, y + 1, 11, B.BOOKS);
    M.lights.push({ x: 15, y: y + 2, z: 12, r: 5, c: [1.0, 0.6, 0.3] });
  }
  if (tier >= 3) {
    box(w, X0, y + 4, Z1, X1, y + 4, Z1, B.NEON_C);
    box(w, 19, y - 1, Z0 + 1, 20, y - 1, Z1 - 1, B.GOLD);
    for (const z of [12, 20]) { w.set(X1 - 1, y, z, B.GOLD); w.set(X1 - 1, y + 1, z, B.LAMP); }
    M.lights.push({ x: 19.5, y: y + 3.5, z: 22, r: 9, c: [0.4, 0.9, 1.0] });
  }
  w.cutMode = 0;
  M.props.push({ type: 'station', st: 'wardrobe', p: [14.8, y, 22.2], rot: Math.PI, name: 'Wardrobe' });
  M.props.push({ type: 'station', st: 'armory', p: [24.3, y, 22.4], rot: Math.PI, name: 'The Fence' });
  M.props.push({ type: 'station', st: 'gear', p: [26.3, y, 18.6], rot: -Math.PI / 2, name: 'Kit Bag' });
  M.props.push({ type: 'station', st: 'contracts', p: [19.5, y, 16.5], name: 'The Hunt' });
  M.props.push({ type: 'station', st: 'upgrades', p: [26.1, y, 13.6], rot: -Math.PI / 2, name: 'Rebuild' });
  M.spawn = [19, y, 14];
  M.env = TIMES.night;
  return M;
}

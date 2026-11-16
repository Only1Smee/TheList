'use strict';
/* ---------------- Blocks ---------------- */
const BLOCKS = [null];
const B = {};
function defB(key, col, pat, o) { const id = BLOCKS.length; BLOCKS.push(Object.assign({ key, col, pat }, o || {})); B[key] = id; return id; }
// pat: 0 plain,1 brick,2 planks,3 tile,4 marble,5 grass,6 glass,7 carpet,8 roof,9 metal,10 water,11 leaves,12 asphalt,13 neon,14 windows,15 stripes,16 railing,17 lamp,18 sand
defB('GRASS', [0.36, 0.6, 0.24], 5);
defB('DIRT', [0.45, 0.32, 0.2], 0);
defB('STONE', [0.52, 0.52, 0.54], 0, { jit: 0.14 });
defB('CONCRETE', [0.64, 0.64, 0.62], 0);
defB('ASPHALT', [0.2, 0.2, 0.22], 12);
defB('PAVE', [0.7, 0.68, 0.64], 3);
defB('BRICK', [0.6, 0.27, 0.19], 1);
defB('BRICK_Y', [0.74, 0.62, 0.44], 1);
defB('BRICK_W', [0.86, 0.84, 0.8], 1);
defB('PLASTER', [0.9, 0.87, 0.8], 0);
defB('PLASTER_P', [0.93, 0.74, 0.68], 0);
defB('PLASTER_B', [0.55, 0.7, 0.85], 0);
defB('CLAY', [0.78, 0.42, 0.28], 0);
defB('SANDSTONE', [0.86, 0.74, 0.52], 1);
defB('SAND', [0.93, 0.85, 0.63], 18);
defB('MARBLE', [0.93, 0.92, 0.9], 4);
defB('MARBLE_B', [0.15, 0.15, 0.17], 4);
defB('MARBLE_G', [0.25, 0.42, 0.36], 4);
defB('WOOD', [0.6, 0.42, 0.24], 2);
defB('WOOD_D', [0.33, 0.2, 0.12], 2);
defB('WOOD_L', [0.82, 0.68, 0.48], 2);
defB('LOG', [0.38, 0.27, 0.16], 0);
defB('LEAVES', [0.25, 0.52, 0.2], 11, { cutout: 1 });
defB('LEAVES_P', [0.96, 0.66, 0.8], 11, { cutout: 1 });
defB('LEAVES_D', [0.14, 0.33, 0.16], 11, { cutout: 1 });
defB('PALM', [0.3, 0.6, 0.2], 11, { cutout: 1 });
defB('HEDGE', [0.18, 0.42, 0.17], 0, { jit: 0.2 });
defB('CARPET_R', [0.58, 0.1, 0.12], 7);
defB('CARPET_B', [0.12, 0.18, 0.45], 7);
defB('CARPET_G', [0.12, 0.36, 0.22], 7);
defB('CARPET_P', [0.35, 0.12, 0.42], 7);
defB('CARPET_K', [0.12, 0.12, 0.14], 7);
defB('TILE_W', [0.92, 0.92, 0.9], 3);
defB('TILE_B', [0.4, 0.55, 0.7], 3);
defB('TILE_T', [0.7, 0.4, 0.28], 3);
defB('ROOF_R', [0.62, 0.24, 0.18], 8);
defB('ROOF_S', [0.3, 0.32, 0.36], 8);
defB('ROOF_G', [0.36, 0.6, 0.52], 8);
defB('ROOF_B', [0.12, 0.12, 0.14], 8);
defB('GLASS', [0.62, 0.82, 0.95], 6, { trans: 1, seeThrough: 1 });
defB('WATER', [0.12, 0.4, 0.62], 10, { trans: 1, seeThrough: 1 });
defB('POOLW', [0.15, 0.62, 0.8], 10, { trans: 1, seeThrough: 1 });
defB('METAL', [0.62, 0.64, 0.68], 9);
defB('METAL_D', [0.2, 0.21, 0.24], 9);
defB('GOLD', [0.95, 0.74, 0.25], 9);
defB('STEEL_B', [0.4, 0.31, 0.24], 9);
defB('RAIL', [0.15, 0.15, 0.17], 16, { cutout: 1, seeThrough: 1 });
defB('RAIL_G', [0.85, 0.68, 0.25], 16, { cutout: 1, seeThrough: 1 });
defB('RAIL_W', [0.92, 0.92, 0.9], 16, { cutout: 1, seeThrough: 1 });
defB('NEON_P', [1.0, 0.25, 0.7], 13, { jit: 0 });
defB('NEON_C', [0.2, 0.9, 1.0], 13, { jit: 0 });
defB('NEON_Y', [1.0, 0.85, 0.25], 13, { jit: 0 });
defB('NEON_R', [1.0, 0.15, 0.15], 13, { jit: 0 });
defB('LAMP', [1.0, 0.92, 0.72], 17, { jit: 0 });
defB('TOWER', [0.6, 0.68, 0.78], 14);
defB('TOWER_D', [0.3, 0.33, 0.4], 14);
defB('TOWER_W', [0.86, 0.84, 0.78], 14);
defB('WHITE', [0.95, 0.95, 0.94], 0);
defB('BLACK', [0.08, 0.08, 0.09], 0);
defB('RED', [0.78, 0.1, 0.1], 0);
defB('BLUE', [0.13, 0.26, 0.72], 0);
defB('YELLOW', [0.96, 0.8, 0.12], 0);
defB('GREEN', [0.15, 0.55, 0.26], 0);
defB('ORANGE', [0.95, 0.5, 0.12], 0);
defB('PINK', [0.95, 0.5, 0.65], 0);
defB('FABRIC', [0.82, 0.74, 0.6], 7);
defB('FABRIC_D', [0.25, 0.22, 0.28], 7);
defB('LEATHER', [0.36, 0.18, 0.1], 7);
defB('VELVET', [0.5, 0.06, 0.1], 7);
defB('TERRA', [0.76, 0.45, 0.3], 0);
defB('COPPER', [0.38, 0.62, 0.55], 9);
defB('AWNING', [0.8, 0.15, 0.15], 15);
defB('AWNING_G', [0.15, 0.5, 0.25], 15);
defB('AWNING_B', [0.15, 0.3, 0.7], 15);
defB('BOOKS', [0.5, 0.25, 0.2], 2, { jit: 0.4 });
defB('STOVE', [0.25, 0.25, 0.27], 9);
defB('FRIDGE', [0.88, 0.9, 0.92], 9);
defB('SCREEN', [0.1, 0.3, 0.5], 13, { jit: 0 });
defB('FLOWER', [0.9, 0.3, 0.4], 11, { cutout: 1 });
defB('FLOWER_Y', [0.95, 0.85, 0.3], 11, { cutout: 1 });
defB('BEDROCK', [0.3, 0.3, 0.3], 0);

// zones
const Z_PUBLIC = 0, Z_STAFF = 1, Z_SECURITY = 2, Z_VIP = 3, Z_BLOCK = 9;
const ZONE_NAMES = ['Public', 'Staff Only', 'Security', 'VIP'];
const ACCESS = {
  suit: [0], guest: [0], vip: [0, 3], waiter: [0, 1], chef: [0, 1], cleaner: [0, 1, 3], guard: [0, 1, 2, 3], tech: [0, 1, 2], target: [0, 1, 2, 3]
};

/* ---------------- World ---------------- */
class World {
  constructor(W, H, D) {
    this.W = W; this.H = H; this.D = D;
    this.b = new Uint8Array(W * H * D);
    this.cutF = new Uint8Array(W * H * D);
    this.zone = new Uint8Array(W * H * D);
    this.cutMode = 0;
  }
  idx(x, y, z) { return (y * this.D + z) * this.W + x; }
  in(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.W && y < this.H && z < this.D; }
  get(x, y, z) { if (y < 0) return B.BEDROCK; if (!this.in(x, y, z)) return 0; return this.b[this.idx(x, y, z)]; }
  set(x, y, z, t) { if (!this.in(x, y, z)) return; const i = this.idx(x, y, z); this.b[i] = t; this.cutF[i] = this.cutMode; }
  fill(x0, y0, z0, x1, y1, z1, t) {
    const ax = Math.min(x0, x1), bx = Math.max(x0, x1), ay = Math.min(y0, y1), by = Math.max(y0, y1), az = Math.min(z0, z1), bz = Math.max(z0, z1);
    for (let y = ay; y <= by; y++) for (let z = az; z <= bz; z++) for (let x = ax; x <= bx; x++) this.set(x, y, z, t);
  }
  setZone(x0, y0, z0, x1, y1, z1, zn) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
      if (this.in(x, y, z)) this.zone[this.idx(x, y, z)] = zn;
  }
  zoneAt(x, y, z) { x = Math.floor(x); y = Math.floor(y); z = Math.floor(z); if (!this.in(x, y, z)) return 0; return this.zone[this.idx(x, y, z)]; }
  solid(x, y, z) { const t = this.get(x, y, z); return t !== 0 && t !== B.WATER && t !== B.POOLW; }
  opaqueSight(x, y, z) { const t = this.get(x, y, z); return t !== 0 && !BLOCKS[t].seeThrough && !BLOCKS[t].cutout; }
  walkable(x, y, z) {
    if (!this.in(x, y, z)) return false;
    if (this.solid(x, y, z) || this.solid(x, y + 1, z) || !this.solid(x, y - 1, z)) return false;
    const up = this.get(x, y + 1, z); if (up === B.WATER || up === B.POOLW) return false;
    const below = this.get(x, y - 1, z);
    if (BLOCKS[below] && (BLOCKS[below].cutout)) return false; // can't stand on rails / leaves
    return this.zoneAt(x, y, z) !== Z_BLOCK;
  }
  // find standable y at column near y
  groundAt(x, z, yHint) {
    for (let d = 0; d < 6; d++) { for (const y of [yHint - d, yHint + d]) if (this.walkable(x, y, z)) return y; }
    return -1;
  }
  // A* over voxel cells (x,y,z). returns array of [x,y,z]
  path(sx, sy, sz, gx, gy, gz, maxN, blocked) {
    maxN = maxN || 24000;
    const W = this.W, D = this.D;
    const key = (x, y, z) => (y * D + z) * W + x;
    if (!this.walkable(gx, gy, gz)) { const ny = this.groundAt(gx, gz, gy); if (ny < 0) return null; gy = ny; }
    if (!this.walkable(sx, sy, sz)) { const ny = this.groundAt(sx, sz, sy); if (ny >= 0) sy = ny; }
    const sk = key(sx, sy, sz), gk = key(gx, gy, gz);
    if (sk === gk) return [[gx, gy, gz]];
    const N = W * this.H * D;
    if (!this._g) { this._g = new Float32Array(N); this._came = new Int32Array(N); this._st = new Uint32Array(N); this._cl = new Uint32Array(N); this._stamp = 0; }
    const gA = this._g, came = this._came, st = this._st, cl = this._cl; const stamp = ++this._stamp;
    const open = new BinHeap();
    const h = (x, y, z) => { const dx = Math.abs(x - gx), dz = Math.abs(z - gz); return Math.max(dx, dz) + 0.41 * Math.min(dx, dz) + Math.abs(y - gy) * 1.5; };
    gA[sk] = 0; st[sk] = stamp; came[sk] = -1; open.push(sk, h(sx, sy, sz));
    let n = 0, found = false;
    const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    while (open.size) {
      const cur = open.pop(); if (cur === gk) { found = true; break; }
      if (cl[cur] === stamp) continue; cl[cur] = stamp;
      if (++n > maxN) return null;
      const x = cur % W, z = Math.floor(cur / W) % D, y = Math.floor(cur / (W * D));
      const gc = gA[cur];
      for (let i = 0; i < 8; i++) {
        const dx = N8[i][0], dz = N8[i][1], nx = x + dx, nz = z + dz;
        const diag = dx && dz;
        for (let j = 0; j < 3; j++) {
          const dy = j === 0 ? 0 : j === 1 ? 1 : -1;
          const ny = y + dy;
          if (!this.walkable(nx, ny, nz)) continue;
          if (diag && (dy !== 0 || !this.walkable(x + dx, y, z) || !this.walkable(x, y, z + dz))) continue;
          if (dy === 1 && this.solid(x, y + 2, z)) continue;
          if (dy === -1 && this.solid(nx, y + 1, nz)) continue;
          const nk = key(nx, ny, nz); if (cl[nk] === stamp) break;
          if (blocked && blocked.has(nk)) break;
          const cost = gc + (diag ? 1.414 : 1) + (dy ? 0.6 : 0);
          if (st[nk] !== stamp || cost < gA[nk]) { st[nk] = stamp; gA[nk] = cost; came[nk] = cur; open.push(nk, cost + h(nx, ny, nz)); }
          break;
        }
      }
    }
    if (!found) return null;
    const out = []; let c = gk;
    while (c !== sk && c >= 0) { out.push([c % W, Math.floor(c / (W * D)), Math.floor(c / W) % D]); c = came[c]; }
    out.reverse();
    return out;
  }
  // line of sight between points (float)
  los(a, b) {
    const d = V3.sub(b, a), L = V3.len(d); if (L < 0.01) return true;
    const steps = Math.ceil(L * 3);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = Math.floor(a[0] + d[0] * t), y = Math.floor(a[1] + d[1] * t), z = Math.floor(a[2] + d[2] * t);
      if (this.opaqueSight(x, y, z)) return false;
    }
    return true;
  }
  // DDA voxel raycast for picking; skip cut blocks above cutY
  raycast(o, d, maxD, cutY) {
    let x = Math.floor(o[0]), y = Math.floor(o[1]), z = Math.floor(o[2]);
    const sx = Math.sign(d[0]), sy = Math.sign(d[1]), sz = Math.sign(d[2]);
    const tdx = Math.abs(1 / (d[0] || 1e-9)), tdy = Math.abs(1 / (d[1] || 1e-9)), tdz = Math.abs(1 / (d[2] || 1e-9));
    let tx = ((sx > 0 ? x + 1 - o[0] : o[0] - x)) * tdx, ty = ((sy > 0 ? y + 1 - o[1] : o[1] - y)) * tdy, tz = ((sz > 0 ? z + 1 - o[2] : o[2] - z)) * tdz;
    let face = [0, 0, 0], t = 0;
    for (let i = 0; i < 600 && t < maxD; i++) {
      if (tx < ty && tx < tz) { x += sx; t = tx; tx += tdx; face = [-sx, 0, 0]; }
      else if (ty < tz) { y += sy; t = ty; ty += tdy; face = [0, -sy, 0]; }
      else { z += sz; t = tz; tz += tdz; face = [0, 0, -sz]; }
      if (!this.in(x, y, z)) { if (y < 0) return null; continue; }
      const bt = this.b[this.idx(x, y, z)];
      if (!bt) continue;
      if (this.cutF[this.idx(x, y, z)] && y + (face[1] > 0 ? 1 : 0) > cutY + 0.02 && y > cutY - 0.5) continue;
      if (BLOCKS[bt].trans && bt !== B.WATER && bt !== B.POOLW) continue;
      return { x, y, z, face, t, type: bt };
    }
    return null;
  }
}

class BinHeap {
  constructor() { this.k = []; this.p = []; }
  get size() { return this.k.length; }
  push(k, p) {
    const K = this.k, P = this.p; K.push(k); P.push(p); let i = K.length - 1;
    while (i > 0) { const pa = (i - 1) >> 1; if (P[pa] <= P[i]) break;[K[pa], K[i]] = [K[i], K[pa]];[P[pa], P[i]] = [P[i], P[pa]]; i = pa; }
  }
  pop() {
    const K = this.k, P = this.p; const top = K[0]; const lk = K.pop(), lp = P.pop();
    if (K.length) {
      K[0] = lk; P[0] = lp; let i = 0;
      for (; ;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < K.length && P[l] < P[m]) m = l; if (r < K.length && P[r] < P[m]) m = r; if (m === i) break;[K[m], K[i]] = [K[i], K[m]];[P[m], P[i]] = [P[i], P[m]]; i = m; }
    }
    return top;
  }
}

// seeded RNG
function RNG(seed) {
  let s = seed >>> 0 || 1;
  const f = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  f.int = (a, b) => a + Math.floor(f() * (b - a + 1));
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  f.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  return f;
}

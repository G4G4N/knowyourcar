import * as THREE from 'three';
import type { Design } from '../../data/design';
import type { Generation } from '../../data/types';
import type { Layout } from '../layout';

/**
 * The car body as an analytic surface.
 *
 * Lower body: per-x cross-sections whose sides are a superellipse below the shoulder line and a
 * flatter, tucked-in superellipse above it (giving vertical flanks and a rounded hood edge).
 * Greenhouse: a second loft with its own tumblehome. Because both are analytic, we can answer
 * "where is the surface?" from any view, which lets us project lights, glass, grilles and shut lines
 * onto the body like decals.
 */

type Key = [number, number];

function piecewise(keys: Key[]): (x: number) => number {
  const k = [...keys].sort((a, b) => a[0] - b[0]);
  return (x) => {
    if (x <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++)
      if (x <= k[i][0]) {
        const [x0, y0] = k[i - 1];
        const [x1, y1] = k[i];
        return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
      }
    return k[k.length - 1][1];
  };
}

function blur(a: Float64Array, r: number): Float64Array {
  if (r <= 0) return a;
  const out = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) {
    let s = 0;
    let n = 0;
    for (let j = -r; j <= r; j++) {
      const k = Math.min(a.length - 1, Math.max(0, i + j));
      s += a[k];
      n++;
    }
    out[i] = s / n;
  }
  return out;
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export interface Section {
  b: number;
  t: number;
  ys: number;
  W: number;
}
export interface CabinSec {
  cb: number;
  ct: number;
  w0: number;
  w1: number;
}

export class BodySurface {
  readonly N = 260;
  readonly xs: Float64Array;
  readonly b: Float64Array;
  readonly t: Float64Array;
  readonly ys: Float64Array;
  readonly W: Float64Array;
  readonly cx0: number;
  readonly cx1: number;
  readonly cN = 140;
  readonly cxs: Float64Array;
  readonly cb: Float64Array;
  readonly ct: Float64Array;
  readonly cw0: Float64Array;
  readonly cw1: Float64Array;
  readonly halfW: number;
  readonly hasCabin: boolean;
  readonly arches: { x: number; r: number }[];

  constructor(
    readonly l: Layout,
    readonly d: Design,
    readonly g: Generation,
  ) {
    const N = this.N;
    const { xFront, xRear, xFA, xRA } = l;
    this.halfW = l.W / 2;
    this.xs = new Float64Array(N);
    for (let i = 0; i < N; i++) this.xs[i] = xRear + ((xFront - xRear) * i) / (N - 1);
    const xs = this.xs;
    const hatch = g.body === 'wagon' || g.body === 'suv' || g.body === 'hatch' || g.body === 'offroad';
    const roadster = g.body === 'roadster';
    const xWs = l.xWs;
    const xC = l.xC;
    const beltAt = (x: number) => d.beltF + (d.beltR - d.beltF) * Math.min(1, Math.max(0, (xWs - x) / Math.max(0.3, xWs - xC)));

    // ---------- top of the lower body (hood, beltline, deck) ----------
    const top: Key[] = [];
    const noseSet = d.nU > 6 ? 0.04 : 0.13;
    top.push([xFront, d.noseY - (d.nU > 6 ? 0.03 : 0.085)], [xFront - noseSet * 0.4, d.noseY - 0.02], [xFront - noseSet, d.noseY]);
    const hoodMid = (xFront - noseSet + xWs) / 2;
    top.push([hoodMid, (d.noseY + d.hoodY) / 2 + 0.012], [xWs, d.hoodY]);
    top.push([xWs - 0.06, beltAt(xWs - 0.06)]);
    if (roadster) {
      top.push([xWs - 0.3, d.beltF - 0.16], [l.frontSeatX - 0.5, d.beltR - 0.16], [l.frontSeatX - 0.72, d.beltR]);
      top.push([xRear + 0.3, d.deckY], [xRear + 0.04, d.tailY], [xRear, d.tailY - 0.06]);
    } else if (hatch) {
      top.push([xRear + 0.06, d.beltR], [xRear, d.beltR - (g.body === 'offroad' ? 0.02 : 0.07)]);
    } else {
      top.push([xC + 0.04, beltAt(xC + 0.04)], [xC - 0.12, d.deckY], [xRear + 0.12, d.deckY - 0.005], [xRear + 0.035, d.tailY], [xRear, d.tailY - 0.07]);
    }
    const tRaw = new Float64Array(N);
    const fTop = piecewise(top);
    for (let i = 0; i < N; i++) tRaw[i] = fTop(xs[i]);
    this.t = blur(tRaw, d.nU > 6 ? 1 : 3);

    // ---------- underside + wheel arches ----------
    const bot = piecewise([
      [xFront, d.bumperY],
      [xFront - 0.22, d.gc + 0.05],
      [xFA, d.gc + 0.03],
      [xRA, d.gc + 0.03],
      [xRear + 0.26, d.gc + 0.05],
      [xRear, d.rearBumperY],
    ]);
    const bRaw = new Float64Array(N);
    for (let i = 0; i < N; i++) bRaw[i] = bot(xs[i]);
    this.b = blur(bRaw, 3);
    const archR = l.wheelR + d.archGap;
    this.arches = [
      { x: xFA, r: archR },
      { x: xRA, r: archR },
    ];
    for (let i = 0; i < N; i++) {
      for (const a of this.arches) {
        const dx = xs[i] - a.x;
        if (Math.abs(dx) < a.r) this.b[i] = Math.max(this.b[i], l.wheelR + Math.sqrt(a.r * a.r - dx * dx) * (d.details.boxFlares ? 1.05 : 1));
      }
      this.b[i] = Math.min(this.b[i], this.t[i] - 0.05);
    }

    // ---------- plan view ----------
    this.W = new Float64Array(N);
    this.ys = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const x = xs[i];
      let w = this.halfW;
      const nf = x - (xFront - d.noseR);
      if (nf > 0) w = this.halfW - d.noseR + Math.sqrt(Math.max(0, d.noseR * d.noseR - nf * nf));
      const nr = xRear + d.tailR - x;
      if (nr > 0) w = Math.min(w, this.halfW - d.tailR + Math.sqrt(Math.max(0, d.tailR * d.tailR - nr * nr)));
      const flare = (ax: number, amt: number, len: number) => {
        const k = (x - ax) / len;
        return amt * (d.details.boxFlares ? (Math.abs(k) < 1 ? 1 : Math.exp(-(Math.abs(k) - 1) * 8)) : Math.exp(-k * k));
      };
      w = w - Math.max(d.flareF, d.flareR) + flare(xFA, d.flareF, 0.6) + flare(xRA, d.flareR, 0.65) + Math.max(d.flareF, d.flareR) * 0.35;
      this.W[i] = Math.min(w, this.halfW);
      const ys = Math.min(this.t[i] - Math.max(0.035, d.shoulder * (x > xWs ? 0.9 : 1)), beltAt(x) - d.shoulder);
      this.ys[i] = Math.max(this.b[i] + 0.02, Math.min(ys, this.t[i] - 0.03));
    }

    // ---------- greenhouse ----------
    this.hasCabin = !roadster;
    this.cx0 = xC;
    this.cx1 = xWs;
    const cN = this.cN;
    this.cxs = new Float64Array(cN);
    this.cb = new Float64Array(cN);
    this.ct = new Float64Array(cN);
    this.cw0 = new Float64Array(cN);
    this.cw1 = new Float64Array(cN);
    const H = l.H;
    const xR1 = l.xR1;
    const xR2 = l.xR2;
    const roofKeys: Key[] = [
      [xWs, d.beltF - 0.01],
      [(xWs + xR1) / 2, (d.beltF + H - d.roofCrown) / 2 + d.windscreenBow],
      [xR1, H - d.roofCrown * 0.7],
      [xR1 - (xR1 - xR2) * 0.42, H],
      [xR2, H - d.roofCrown],
      [xC, beltAt(xC)],
    ];
    if (d.fastback > 0) {
      const f = d.fastback;
      roofKeys.push([xR2 - (xR2 - xC) * 0.35, H - d.roofCrown - (H - beltAt(xC)) * (0.35 - 0.2 * f)]);
      roofKeys.push([xR2 - (xR2 - xC) * 0.7, beltAt(xC) + (H - beltAt(xC)) * (0.3 + 0.18 * f)]);
    }
    const fRoof = piecewise(roofKeys);
    const raw = new Float64Array(cN);
    for (let i = 0; i < cN; i++) {
      const x = xC + ((xWs - xC) * i) / (cN - 1);
      this.cxs[i] = x;
      raw[i] = fRoof(x);
    }
    const roof = blur(raw, d.nC > 7 ? 1 : 3);
    for (let i = 0; i < cN; i++) {
      const x = this.cxs[i];
      const s = this.sec(x);
      this.cb[i] = beltAt(x) - 0.035;
      this.ct[i] = Math.max(this.cb[i] + 0.01, roof[i]);
      this.cw0[i] = s.W * d.cabinW;
      this.cw1[i] = s.W * d.tumble;
    }
  }

  // ---------- sampling ----------
  private idx(x: number) {
    const t = ((x - this.l.xRear) / (this.l.xFront - this.l.xRear)) * (this.N - 1);
    const i = Math.min(this.N - 2, Math.max(0, Math.floor(t)));
    return { i, f: Math.min(1, Math.max(0, t - i)) };
  }
  sec(x: number): Section {
    const { i, f } = this.idx(x);
    const L = (a: Float64Array) => a[i] + (a[i + 1] - a[i]) * f;
    return { b: L(this.b), t: L(this.t), ys: L(this.ys), W: L(this.W) };
  }
  cab(x: number): CabinSec | null {
    if (!this.hasCabin || x < this.cx0 || x > this.cx1) return null;
    const t = ((x - this.cx0) / (this.cx1 - this.cx0)) * (this.cN - 1);
    const i = Math.min(this.cN - 2, Math.floor(t));
    const f = t - i;
    const L = (a: Float64Array) => a[i] + (a[i + 1] - a[i]) * f;
    return { cb: L(this.cb), ct: L(this.ct), w0: L(this.cw0), w1: L(this.cw1) };
  }

  // ---------- half widths ----------
  lowerW(x: number, y: number): number {
    if (x < this.l.xRear || x > this.l.xFront) return -1;
    const s = this.sec(x);
    if (y < s.b || y > s.t) return -1;
    const { nL, nU, topW } = this.d;
    if (y <= s.ys) {
      const k = (s.ys - y) / Math.max(1e-4, s.ys - s.b);
      return s.W * Math.pow(Math.max(0, 1 - Math.pow(k, nL)), 1 / nL);
    }
    const k = (y - s.ys) / Math.max(1e-4, s.t - s.ys);
    return s.W * Math.pow(Math.max(0, 1 - Math.pow(k, nU)), 1 / nU) * (1 - (1 - topW) * k);
  }
  cabinW(x: number, y: number): number {
    const c = this.cab(x);
    if (!c || y > c.ct || y < c.cb - 0.06) return -1;
    const nC = this.d.nC;
    const k = Math.max(0, (y - c.cb) / Math.max(1e-4, c.ct - c.cb));
    return Math.pow(Math.max(0, 1 - Math.pow(k, nC)), 1 / nC) * (c.w0 + (c.w1 - c.w0) * k);
  }
  width(x: number, y: number) {
    return Math.max(this.lowerW(x, y), this.cabinW(x, y));
  }

  // ---------- plan-view sweep (rounded nose/tail in plan) ----------
  sweep(x: number, z: number): number {
    const zz = (z / this.halfW) ** 2;
    const f = this.d.sweepF * smooth(this.l.xFront - 0.75, this.l.xFront, x);
    const r = this.d.sweepR * smooth(this.l.xRear + 0.65, this.l.xRear, x);
    return -f * zz + r * zz;
  }
  deform(x: number, z: number) {
    return x + this.sweep(x, z);
  }
  /** invert the sweep for a known z */
  undeform(xd: number, z: number) {
    let x = xd;
    for (let k = 0; k < 4; k++) x = xd - this.sweep(x, z);
    return x;
  }

  // ---------- surface queries ----------
  /** Outer surface z (>0) at a deformed (x, y), or null. */
  sideZ(xd: number, y: number): number | null {
    let x = xd;
    let z = 0;
    for (let k = 0; k < 4; k++) {
      z = this.width(x, y);
      if (z < 0) return null;
      x = xd - this.sweep(x, z);
    }
    return z;
  }
  topY(xd: number, z: number): number | null {
    const x = this.undeform(xd, z);
    const az = Math.abs(z);
    let best: number | null = null;
    // lower body: solve w(y) = |z| above the shoulder
    const s = this.sec(x);
    if (x >= this.l.xRear && x <= this.l.xFront && az <= s.W) {
      let lo = s.ys;
      let hi = s.t;
      if (this.lowerW(x, lo) >= az) {
        for (let k = 0; k < 30; k++) {
          const m = (lo + hi) / 2;
          if (this.lowerW(x, m) >= az) lo = m;
          else hi = m;
        }
        best = lo;
      }
    }
    const c = this.cab(x);
    if (c && az <= c.w0) {
      let lo = c.cb;
      let hi = c.ct;
      for (let k = 0; k < 30; k++) {
        const m = (lo + hi) / 2;
        if (this.cabinW(x, m) >= az) lo = m;
        else hi = m;
      }
      if (best === null || lo > best) best = lo;
    }
    return best;
  }
  /** Front-most (dir=1) or rear-most (dir=-1) surface x at (y, z), deformed. */
  endX(y: number, z: number, dir: 1 | -1): number | null {
    const az = Math.abs(z);
    const start = dir === 1 ? this.l.xFront + 0.001 : this.l.xRear - 0.001;
    let prev = start;
    for (let s = 0; s < 400; s++) {
      const x = start - dir * s * 0.005;
      if (this.width(x, y) >= az) {
        let lo = prev;
        let hi = x;
        for (let k = 0; k < 20; k++) {
          const m = (lo + hi) / 2;
          if (this.width(m, y) >= az) hi = m;
          else lo = m;
        }
        return this.deform(hi, z);
      }
      prev = x;
    }
    return null;
  }

  // ---------- meshes ----------
  private lowerPoint(i: number, phi: number, out: THREE.Vector3) {
    const x = this.xs[i];
    const b = this.b[i];
    const t = this.t[i];
    const ys = this.ys[i];
    const W = this.W[i];
    const { nL, nU, topW } = this.d;
    let p = phi;
    let side = 1;
    if (p > Math.PI / 2) {
      p = Math.PI - p;
      side = -1;
    }
    const c = Math.abs(Math.cos(p));
    const s = Math.sin(p);
    let y: number;
    let z: number;
    if (s < 0) {
      y = ys - (ys - b) * Math.pow(-s, 2 / nL);
      z = W * Math.pow(c, 2 / nL);
    } else {
      const k = Math.pow(s, 2 / nU);
      y = ys + (t - ys) * k;
      z = W * Math.pow(c, 2 / nU) * (1 - (1 - topW) * k);
    }
    z *= side;
    out.set(this.deform(x, z), y, z);
  }

  private cabinPoint(i: number, phi: number, out: THREE.Vector3) {
    const x = this.cxs[i];
    const nC = this.d.nC;
    const cb = this.cb[i];
    const ct = this.ct[i];
    let p = phi;
    let side = 1;
    if (p > Math.PI / 2) {
      p = Math.PI - p;
      side = -1;
    }
    let y: number;
    let z: number;
    if (p < 0) {
      // short skirt that tucks into the body
      y = cb + p * 0.12;
      z = this.cw0[i] * 0.985;
    } else {
      const k = Math.pow(Math.sin(p), 2 / nC);
      y = cb + (ct - cb) * k;
      z = Math.pow(Math.cos(p), 2 / nC) * (this.cw0[i] + (this.cw1[i] - this.cw0[i]) * k);
    }
    z *= side;
    out.set(this.deform(x, z), y, z);
  }

  buildLower(): THREE.BufferGeometry {
    const M = 72;
    return grid(this.N, M, (i, j, v) => this.lowerPoint(i, -Math.PI / 2 + (j / M) * Math.PI * 2, v), true, true);
  }

  buildCabin(): THREE.BufferGeometry | null {
    if (!this.hasCabin) return null;
    const M = 64;
    const p0 = -0.5;
    const p1 = Math.PI + 0.5;
    return grid(this.cN, M + 1, (i, j, v) => this.cabinPoint(i, p0 + ((p1 - p0) * j) / M, v), false, false);
  }
}

export function grid(rows: number, cols: number, fn: (i: number, j: number, out: THREE.Vector3) => void, closeRing: boolean, caps: boolean) {
  const pos = new Float32Array(rows * cols * 3 + (caps ? 6 : 0));
  const v = new THREE.Vector3();
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) {
      fn(i, j, v);
      pos.set([v.x, v.y, v.z], (i * cols + j) * 3);
    }
  const idx: number[] = [];
  const jMax = closeRing ? cols : cols - 1;
  for (let i = 0; i < rows - 1; i++)
    for (let j = 0; j < jMax; j++) {
      const j1 = (j + 1) % cols;
      const a = i * cols + j;
      const b = (i + 1) * cols + j;
      const c = i * cols + j1;
      const d = (i + 1) * cols + j1;
      idx.push(a, b, c, b, d, c);
    }
  if (caps) {
    for (const [row, front, slot] of [
      [0, false, 0],
      [rows - 1, true, 1],
    ] as const) {
      const cen = new THREE.Vector3();
      for (let j = 0; j < cols; j++) cen.add(new THREE.Vector3().fromArray(pos, (row * cols + j) * 3));
      cen.divideScalar(cols);
      const ci = rows * cols + slot;
      pos.set([cen.x, cen.y, cen.z], ci * 3);
      for (let j = 0; j < cols; j++) {
        const a = row * cols + j;
        const b = row * cols + ((j + 1) % cols);
        if (front) idx.push(ci, b, a);
        else idx.push(ci, a, b);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

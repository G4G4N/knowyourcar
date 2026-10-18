import * as THREE from 'three';
import type { P } from '../../data/design';
import type { BodySurface } from './surface';

/**
 * Decals: 2D shapes drawn in one of four orthographic views and wrapped onto the body surface.
 *  - front / rear: (z, y)    - side: (x, y) on the +z side    - top: (x, z)
 */
export type View = 'front' | 'rear' | 'side' | 'top';

const OUT: Record<View, THREE.Vector3> = {
  front: new THREE.Vector3(1, 0, 0),
  rear: new THREE.Vector3(-1, 0, 0),
  side: new THREE.Vector3(0, 0, 1),
  top: new THREE.Vector3(0, 1, 0),
};

export function project(S: BodySurface, view: View, u: number, v: number): THREE.Vector3 | null {
  switch (view) {
    case 'front': {
      const x = S.endX(v, u, 1);
      return x === null ? null : new THREE.Vector3(x, v, u);
    }
    case 'rear': {
      const x = S.endX(v, u, -1);
      return x === null ? null : new THREE.Vector3(x, v, u);
    }
    case 'side': {
      const z = S.sideZ(u, v);
      return z === null ? null : new THREE.Vector3(u, v, z);
    }
    case 'top': {
      const y = S.topY(u, v);
      return y === null ? null : new THREE.Vector3(u, y, v);
    }
  }
}

interface Opts {
  lift?: number | ((u: number, v: number) => number);
  res?: number;
}

function finish(pos: (THREE.Vector3 | null)[], uv: number[], rows: number, cols: number, view: View, opts: Opts, lifts: number[]): THREE.BufferGeometry | null {
  const idx: number[] = [];
  const ok = (k: number) => pos[k] !== null;
  for (let i = 0; i < rows - 1; i++)
    for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      if (ok(a) && ok(b) && ok(c)) idx.push(a, b, c);
      if (ok(b) && ok(d) && ok(c)) idx.push(b, d, c);
    }
  if (!idx.length) return null;
  const arr = new Float32Array(pos.length * 3);
  pos.forEach((p, k) => p && arr.set([p.x, p.y, p.z], k * 3));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  // make sure normals face outward for this view
  const nrm = geo.getAttribute('normal') as THREE.BufferAttribute;
  let dot = 0;
  for (let k = 0; k < nrm.count; k++) if (pos[k]) dot += nrm.getX(k) * OUT[view].x + nrm.getY(k) * OUT[view].y + nrm.getZ(k) * OUT[view].z;
  if (dot < 0) {
    for (let k = 0; k < idx.length; k += 3) [idx[k + 1], idx[k + 2]] = [idx[k + 2], idx[k + 1]];
    geo.setIndex(idx);
    geo.computeVertexNormals();
  }
  // lift off the surface along the normal
  const p = geo.getAttribute('position') as THREE.BufferAttribute;
  const n = geo.getAttribute('normal') as THREE.BufferAttribute;
  for (let k = 0; k < p.count; k++) {
    if (!pos[k]) continue;
    const h = lifts[k];
    p.setXYZ(k, p.getX(k) + n.getX(k) * h, p.getY(k) + n.getY(k) * h, p.getZ(k) + n.getZ(k) * h);
  }
  geo.computeVertexNormals();
  void opts;
  return geo;
}

/** Fill a polygon (monotone in v) and wrap it onto the body. */
export function polyDecal(S: BodySurface, poly: P[], view: View, opts: Opts = {}): THREE.BufferGeometry | null {
  if (poly.length < 3) return null;
  const res = opts.res ?? 0.012;
  let vmin = Infinity;
  let vmax = -Infinity;
  let umin = Infinity;
  let umax = -Infinity;
  for (const [u, v] of poly) {
    vmin = Math.min(vmin, v);
    vmax = Math.max(vmax, v);
    umin = Math.min(umin, u);
    umax = Math.max(umax, u);
  }
  const rows = Math.max(4, Math.min(90, Math.ceil((vmax - vmin) / res) + 1));
  const cols = Math.max(4, Math.min(140, Math.ceil((umax - umin) / res) + 1));
  const eps = (vmax - vmin) * 1e-4;
  const pos: (THREE.Vector3 | null)[] = [];
  const uv: number[] = [];
  const lifts: number[] = [];
  for (let i = 0; i < rows; i++) {
    const v = vmin + eps + ((vmax - vmin - 2 * eps) * i) / (rows - 1);
    let a = Infinity;
    let b = -Infinity;
    for (let k = 0; k < poly.length; k++) {
      const [u0, v0] = poly[k];
      const [u1, v1] = poly[(k + 1) % poly.length];
      if ((v0 <= v && v1 >= v) || (v1 <= v && v0 >= v)) {
        const t = v1 === v0 ? 0.5 : (v - v0) / (v1 - v0);
        const u = u0 + (u1 - u0) * t;
        a = Math.min(a, u);
        b = Math.max(b, u);
      }
    }
    for (let j = 0; j < cols; j++) {
      if (a > b) {
        pos.push(null);
        uv.push(0, 0);
        lifts.push(0);
        continue;
      }
      const u = a + ((b - a) * j) / (cols - 1);
      pos.push(project(S, view, u, v));
      uv.push(u, v);
      lifts.push(typeof opts.lift === 'function' ? opts.lift(u, v) : opts.lift ?? 0.003);
    }
  }
  return finish(pos, uv, rows, cols, view, opts, lifts);
}

/** A thin strip following a polyline (shut lines, LED strips, rings). */
export function ribbon(S: BodySurface, pts: P[], width: number, view: View, opts: Opts & { closed?: boolean } = {}): THREE.BufferGeometry | null {
  if (pts.length < 2) return null;
  const path = opts.closed ? [...pts, pts[0]] : pts;
  // resample evenly
  const step = opts.res ?? 0.008;
  const samples: P[] = [];
  for (let k = 0; k < path.length - 1; k++) {
    const [u0, v0] = path[k];
    const [u1, v1] = path[k + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(u1 - u0, v1 - v0) / step));
    for (let s = 0; s < n; s++) samples.push([u0 + ((u1 - u0) * s) / n, v0 + ((v1 - v0) * s) / n]);
  }
  samples.push(path[path.length - 1]);
  const pos: (THREE.Vector3 | null)[] = [];
  const uv: number[] = [];
  const lifts: number[] = [];
  const lift = typeof opts.lift === 'number' ? opts.lift : 0.004;
  samples.forEach((p, k) => {
    const a = samples[Math.max(0, k - 1)];
    const b = samples[Math.min(samples.length - 1, k + 1)];
    let tu = b[0] - a[0];
    let tv = b[1] - a[1];
    const len = Math.hypot(tu, tv) || 1;
    tu /= len;
    tv /= len;
    const nu = -tv * (width / 2);
    const nv = tu * (width / 2);
    for (const s of [1, -1]) {
      pos.push(project(S, view, p[0] + nu * s, p[1] + nv * s));
      uv.push(k / samples.length, s > 0 ? 1 : 0);
      lifts.push(lift);
    }
  });
  // rows = samples, cols = 2
  return finish(pos, uv, samples.length, 2, view, opts, lifts);
}

/** Mirror a right-side decal to the left side. */
export function mirrorZ(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = geo.clone();
  g.scale(1, 1, -1);
  const idx = g.getIndex()!;
  const a = idx.array as unknown as number[];
  const flipped = Array.from(a);
  for (let k = 0; k < flipped.length; k += 3) [flipped[k + 1], flipped[k + 2]] = [flipped[k + 2], flipped[k + 1]];
  g.setIndex(flipped);
  g.computeVertexNormals();
  return g;
}

export function merge(geos: (THREE.BufferGeometry | null)[]): THREE.BufferGeometry | null {
  const list = geos.filter((g): g is THREE.BufferGeometry => !!g);
  if (!list.length) return null;
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let off = 0;
  for (const g of list) {
    const p = g.getAttribute('position');
    const n = g.getAttribute('normal');
    const t = g.getAttribute('uv');
    for (let k = 0; k < p.count; k++) {
      pos.push(p.getX(k), p.getY(k), p.getZ(k));
      nor.push(n.getX(k), n.getY(k), n.getZ(k));
      uv.push(t ? t.getX(k) : 0, t ? t.getY(k) : 0);
    }
    const ix = g.getIndex()!;
    for (let k = 0; k < ix.count; k++) idx.push(ix.getX(k) + off);
    off += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}

/** Both sides of a right-side decal. */
export function pair(geo: THREE.BufferGeometry | null): THREE.BufferGeometry | null {
  return geo ? merge([geo, mirrorZ(geo)]) : null;
}

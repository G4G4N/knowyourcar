import type { Generation } from './types';

/**
 * Per-generation exterior design description.
 *
 * Coordinates used by the shape fields:
 *  - front shapes: [u, dy]  u = z / halfWidth (0 = centreline, 1 = body side), dy = metres relative to the hood's leading edge (noseY)
 *  - rear shapes:  [u, dy]  same, dy relative to the top of the rear face (tailY)
 * Right-hand side only; the renderer mirrors to the left.
 */
export type P = [number, number];

export interface LightSpec {
  shape: P[];
  /** inner LED / DRL polylines (same coordinate space) */
  strips?: P[][];
  /** rings: [u, dy, radius m] (angel eyes, round lamps) */
  rings?: [number, number, number][];
  /** projector lenses / round lamps: [u, dy, radius m] */
  dots?: [number, number, number][];
  stripW?: number;
}

export type GrilleTexture = 'vbars' | 'hbars' | 'honeycomb' | 'mesh' | 'panamericana' | 'stars' | 'diamond' | 'blank' | 'slats';

export interface GrilleSpec {
  /** full outline(s) of the grille opening; u may be negative */
  shapes: P[][];
  /** mirror each shape to the other side (BMW kidneys) */
  mirror?: boolean;
  texture: GrilleTexture;
  frame?: 'chrome' | 'black' | 'none' | 'blue';
  /** brand badge position [u, dy] on the front; null = none */
  logo?: P | null;
  logoScale?: number;
  /** horizontal chrome bars across the grille (Mercedes / Audi) at these dy values */
  bars?: number[];
}

export interface Design {
  // ---- side silhouette (metres) ----
  fOH: number; // front overhang
  cowl: number; // windscreen base behind the front axle
  rake: number; // windscreen angle from horizontal, degrees
  roofEnd: number; // end of the roof, metres from the rear axle (+ = forward)
  cBase: number; // base of the rear glass, metres from the rear axle
  gc: number;
  bumperY: number; // underside of the front bumper at the very front
  rearBumperY: number;
  noseY: number; // hood leading edge
  hoodY: number; // hood at the windscreen
  beltF: number; // beltline at the A-pillar
  beltR: number; // beltline at the C-pillar
  deckY: number; // boot lid
  tailY: number; // top of the rear face
  roofCrown: number;
  fastback: number; // 0..1 convexity of the rear glass line
  windscreenBow: number;
  // ---- sections ----
  shoulder: number; // shoulder line below the belt
  nL: number; // lower body boxiness
  nU: number; // upper body / hood edge boxiness
  nC: number; // cabin boxiness
  topW: number; // hood top width ratio
  cabinW: number; // greenhouse base width ratio
  tumble: number; // roof width ratio
  noseR: number; // plan-view corner radius front
  tailR: number;
  sweepF: number; // plan-view convexity of the nose
  sweepR: number;
  flareF: number; // extra half width over the wheels
  flareR: number;
  archGap: number;
  // ---- greenhouse graphics (metres from the rear axle, + forward) ----
  dlo: {
    b: number | null; // B-pillar centre, null = two-door
    bW: number;
    cBelt: number; // rear end of the side glass at the beltline
    cTop: number; // rear end of the side glass at the top
    kink: number; // Hofmeister kink depth
    quarter: [number, number] | null; // extra quarter window (from, to)
    frame: number;
    aGap: number;
    chrome: boolean;
  };
  // ---- face ----
  grille: GrilleSpec;
  headlight: LightSpec;
  intakes: { shape: P[]; texture: GrilleTexture; mirror?: boolean }[];
  fogs?: [number, number, number] | null;
  taillight: LightSpec;
  rearBar?: boolean; // full width light bar across the tail
  frontBar?: boolean;
  exhaust: { layout: 'split' | 'center' | 'left' | 'side' | 'none'; n: number; shape: 'round' | 'oval' | 'trap'; r: number; spread: number };
  rims: { style: 'five' | 'double' | 'multi' | 'y' | 'mesh' | 'aero' | 'turbine' | 'classic'; n: number; finish: 'silver' | 'dark' | 'black' | 'gold' | 'bicolor' };
  details: {
    powerDome?: number; // height of the hood bulge
    hoodVents?: boolean;
    gills?: 'fender' | 'none';
    sideblade?: string | null;
    roof?: 'paint' | 'carbon' | 'black' | 'glass';
    roofRails?: boolean;
    spoiler?: 'none' | 'lip' | 'ducktail' | 'wing' | 'gtwing' | 'roof';
    skirt?: 'paint' | 'black' | 'chrome';
    diffuser?: boolean;
    handles?: 'pull' | 'flush';
    hoodStar?: boolean;
    spareWheel?: boolean;
    fenderLamps?: boolean;
    boxFlares?: boolean;
    badge?: string;
    plate?: string;
    hoodLines?: boolean;
    chargePort?: boolean;
  };
}

type Partial2<T> = { [K in keyof T]?: T[K] extends object ? (T[K] extends unknown[] ? T[K] : Partial<T[K]>) : T[K] };
export type DesignInput = Partial2<Design>;

/** Body-style defaults, scaled from the real height so overrides stay small. */
export function baseDesign(g: Generation): Design {
  const H = g.dims.height / 1000;
  const L = g.dims.length / 1000;
  const WB = g.dims.wheelbase / 1000;
  const oh = L - WB;
  const b = g.body;
  const tall = b === 'suv' || b === 'offroad';
  const belt = H * (b === 'offroad' ? 0.6 : b === 'suv' ? 0.63 : b === 'roadster' ? 0.7 : 0.645);
  const d: Design = {
    fOH: oh * 0.46,
    cowl: 0.7,
    rake: tall ? 31 : 28,
    roofEnd: 0.15,
    cBase: -0.4,
    gc: tall ? 0.2 : 0.13,
    bumperY: tall ? 0.36 : 0.22,
    rearBumperY: tall ? 0.42 : 0.3,
    noseY: belt - (tall ? 0.12 : 0.19),
    hoodY: belt - 0.025,
    beltF: belt,
    beltR: belt + 0.05,
    deckY: belt + 0.07,
    tailY: belt + 0.05,
    roofCrown: 0.03,
    fastback: 0,
    windscreenBow: 0.015,
    shoulder: 0.075,
    nL: 5,
    nU: 3.6,
    nC: 4.6,
    topW: 0.86,
    cabinW: 0.9,
    tumble: tall ? 0.84 : 0.76,
    noseR: 0.3,
    tailR: 0.18,
    sweepF: 0.09,
    sweepR: 0.05,
    flareF: 0.008,
    flareR: 0.012,
    archGap: 0.035,
    dlo: { b: 0.95, bW: 0.08, cBelt: 0.1, cTop: 0.4, kink: 0, quarter: null, frame: 0.028, aGap: 0.075, chrome: false },
    grille: { shapes: [], texture: 'blank', frame: 'chrome', logo: [0, -0.06] },
    headlight: { shape: [] },
    intakes: [],
    fogs: null,
    taillight: { shape: [] },
    exhaust: { layout: 'split', n: 2, shape: 'round', r: 0.04, spread: 0.6 },
    rims: { style: 'five', n: 5, finish: 'silver' },
    details: { roof: 'paint', spoiler: 'none', skirt: 'paint', handles: 'pull', plate: 'KY 100' },
  };
  if (b === 'hatch' || b === 'wagon' || b === 'suv' || b === 'offroad') {
    d.roofEnd = -(oh - d.fOH) + (b === 'hatch' ? 0.42 : 0.2);
    d.cBase = -(oh - d.fOH) + 0.05;
    d.dlo.cBelt = -0.25;
    d.dlo.cTop = -0.2;
  }
  if (b === 'coupe') {
    d.roofEnd = 0.35;
    d.cBase = -0.35;
    d.dlo.b = null;
    d.dlo.cBelt = 0.3;
    d.dlo.cTop = 0.55;
  }
  if (b === 'fastback') {
    d.roofEnd = 0.6;
    d.cBase = -(oh - d.fOH) + 0.3;
    d.fastback = 0.5;
    d.dlo.cBelt = 0.05;
    d.dlo.cTop = 0.5;
  }
  if (b === 'roadster') {
    d.dlo.b = null;
  }
  return d;
}

export function mergeDesign(base: Design, o: DesignInput | undefined): Design {
  if (!o) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined) continue;
    const bv = (base as unknown as Record<string, unknown>)[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && bv && typeof bv === 'object' && !Array.isArray(bv)) out[k] = { ...bv, ...v };
    else out[k] = v;
  }
  return out as unknown as Design;
}

// ---------- shape helpers ----------

/** Rounded polygon: replaces each corner with a quadratic curve. */
export function round(pts: P[], r: number, seg = 5): P[] {
  if (r <= 0) return pts;
  const out: P[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const d0 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const d1 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const k0 = Math.min(r, d0 / 2) / (d0 || 1);
    const k1 = Math.min(r, d1 / 2) / (d1 || 1);
    const a: P = [p1[0] + (p0[0] - p1[0]) * k0, p1[1] + (p0[1] - p1[1]) * k0];
    const c: P = [p1[0] + (p2[0] - p1[0]) * k1, p1[1] + (p2[1] - p1[1]) * k1];
    for (let s = 0; s <= seg; s++) {
      const t = s / seg;
      out.push([
        (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * p1[0] + t * t * c[0],
        (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * p1[1] + t * t * c[1],
      ]);
    }
  }
  return out;
}

export const rect = (u0: number, y0: number, u1: number, y1: number, r = 0): P[] =>
  round(
    [
      [u0, y0],
      [u1, y0],
      [u1, y1],
      [u0, y1],
    ],
    r,
  );

/** Symmetric trapezoid / octagon centred on the car (Audi singleframe etc.). */
export function octagon(wTop: number, wMid: number, wBot: number, yTop: number, yMid: number, yBot: number, r = 0.01): P[] {
  return round(
    [
      [-wTop, yTop],
      [wTop, yTop],
      [wMid, yMid],
      [wBot, yBot],
      [-wBot, yBot],
      [-wMid, yMid],
    ],
    r,
  );
}

export function ellipse(cu: number, cy: number, ru: number, ry: number, n = 28): P[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cu + Math.cos(a) * ru, cy + Math.sin(a) * ry] as P;
  });
}

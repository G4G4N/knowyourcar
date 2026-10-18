import * as THREE from 'three';
import type { Design, GrilleTexture, LightSpec, P } from '../../data/design';
import type { Brand, Generation } from '../../data/types';
import type { Layout } from '../layout';
import { merge, mirrorZ, pair, polyDecal, ribbon } from './decal';
import { BodySurface } from './surface';

type G = THREE.BufferGeometry | null;

export interface BuiltBody {
  S: BodySurface;
  lower: THREE.BufferGeometry;
  cabin: G;
  glass: G;
  glassBlack: G;
  trimChrome: G;
  trimBlack: G;
  shutLines: G;
  handles: G;
  paintBits: G; // power dome, spoiler lips, ducktail
  carbon: G;
  plastic: G; // skirts, splitter, diffuser
  gills: G;
  sideblade: G;
  grilles: { geo: THREE.BufferGeometry; texture: GrilleTexture }[];
  frames: { geo: G; color: 'chrome' | 'black' | 'blue' };
  headHousing: G;
  headLed: G;
  headLens: G;
  tailHousing: G;
  tailLed: G;
  plateF: G;
  plateR: G;
  badge: G;
  logoFront: { pos: THREE.Vector3; tilt: number; scale: number } | null;
  logoRear: { pos: THREE.Vector3; scale: number } | null;
  mirror: { pos: THREE.Vector3; base: number } | null;
  hoodStar: THREE.Vector3 | null;
  windscreen: { pos: THREE.Vector3; angle: number; w: number; len: number } | null;
  roofRails: { x0: number; x1: number; y: number; z: number } | null;
  wing: { x: number; y: number; span: number; chord: number; gt: boolean; deckY: number } | null;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function circle(cu: number, cy: number, r: number, n = 28): P[] {
  return Array.from({ length: n }, (_, i) => [cu + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * r] as P);
}

/** Set UVs so the texture fills the given rectangle once (for plates and badges). */
function fitUV(geo: G, u0: number, u1: number, v0: number, v1: number, flipU: boolean) {
  if (!geo) return geo;
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  for (let k = 0; k < uv.count; k++) {
    let u = (uv.getX(k) - u0) / (u1 - u0);
    if (flipU) u = 1 - u;
    uv.setXY(k, u, (uv.getY(k) - v0) / (v1 - v0));
  }
  uv.needsUpdate = true;
  return geo;
}

export function buildBody(l: Layout, d: Design, g: Generation, brand: Brand): BuiltBody {
  const S = new BodySurface(l, d, g);
  const hw = l.W / 2;
  const b = g.body;
  const hatch = b === 'wagon' || b === 'suv' || b === 'hatch' || b === 'offroad';
  const liftback = b === 'fastback' || g.id === 'c190';
  const archR = l.wheelR + d.archGap;

  // front / rear coordinates -> metres
  const F = (pts: P[]): P[] => pts.map(([u, dy]) => [u * hw, d.noseY + dy]);
  const R = (pts: P[]): P[] => pts.map(([u, dy]) => [u * hw, d.tailY + dy]);

  const beltAt = (x: number) => d.beltF + (d.beltR - d.beltF) * clamp((l.xWs - x) / Math.max(0.3, l.xWs - l.xC), 0, 1);

  // ---------------- greenhouse graphics ----------------
  const glass: G[] = [];
  const glassBlack: G[] = [];
  const trimChrome: G[] = [];
  const trimBlack: G[] = [];
  let windscreen: BuiltBody['windscreen'] = null;

  if (S.hasCabin) {
    const dl = d.dlo;
    const roofAt = (x: number) => S.cab(clamp(x, S.cx0, S.cx1))!.ct;
    const yB = (x: number) => beltAt(x) + 0.014;
    const yT = (x: number) => roofAt(Math.min(x + dl.aGap, S.cx1 - 0.001)) - dl.frame;
    let xTip = l.xWs - 0.02;
    while (xTip > S.cx0 && yT(xTip) - yB(xTip) < 0.03) xTip -= 0.005;
    const xTopRear = Math.min(l.xRA + dl.cTop, xTip - 0.2);
    const xBeltRear = Math.min(l.xRA + dl.cBelt, xTip - 0.2);

    const rearEdge = (): P[] => {
      const top: P = [xTopRear, yT(xTopRear)];
      const h = top[1] - yB(xBeltRear);
      const pts: P[] = [top, [xTopRear + (xBeltRear - xTopRear) * 0.55, top[1] - h * 0.55]];
      if (dl.kink > 0) {
        pts.push([xBeltRear - dl.kink, yB(xBeltRear) + h * 0.22], [xBeltRear - dl.kink * 0.3, yB(xBeltRear) + h * 0.07], [xBeltRear + dl.kink * 0.45, yB(xBeltRear)]);
      } else pts.push([xBeltRear, yB(xBeltRear)]);
      return pts;
    };
    /** window polygon between two x positions; 'tip' / 'c' use the A / C pillar shapes */
    const windowPoly = (front: number | 'tip', rear: number | 'c'): P[] => {
      const xf = front === 'tip' ? xTip : front;
      const xr = rear === 'c' ? xTopRear : rear;
      const pts: P[] = [];
      // top chain, front -> rear
      const n = Math.max(2, Math.ceil((xf - xr) / 0.03));
      for (let i = 0; i <= n; i++) {
        const x = xf - ((xf - xr) * i) / n;
        pts.push([x, Math.max(yT(x), yB(x) + 0.005)]);
      }
      if (rear === 'c') pts.push(...rearEdge().slice(1));
      else pts.push([xr, yB(xr)]);
      // bottom chain, rear -> front
      const xr2 = rear === 'c' ? xBeltRear : xr;
      for (let i = 1; i <= n; i++) {
        const x = xr2 + ((xf - xr2) * i) / n;
        pts.push([x, yB(x)]);
      }
      return pts;
    };
    const quads: [number | 'tip', number | 'c'][] = [];
    if (dl.b !== null && b !== 'roadster') {
      const xB = l.xRA + dl.b;
      quads.push(['tip', xB + dl.bW / 2], [xB - dl.bW / 2, 'c']);
      glassBlack.push(pair(polyDecal(S, [[xB - dl.bW / 2, yB(xB)], [xB + dl.bW / 2, yB(xB)], [xB + dl.bW / 2, yT(xB + dl.bW / 2)], [xB - dl.bW / 2, yT(xB - dl.bW / 2)]], 'side', { lift: 0.0045 })));
    } else quads.push(['tip', 'c']);
    for (const [f, r] of quads) glass.push(pair(polyDecal(S, windowPoly(f, r), 'side', { lift: 0.004, res: 0.02 })));
    if (dl.quarter) {
      const [q0, q1] = dl.quarter;
      const xa = l.xRA + q0;
      const xb = Math.min(l.xRA + q1, xBeltRear - 0.06);
      if (xb - xa > 0.08) glass.push(pair(polyDecal(S, windowPoly(xb, xa), 'side', { lift: 0.004, res: 0.02 })));
    }
    // window surround: belt trim + roof trim
    const surround: P[] = [];
    const xEnd = dl.quarter ? Math.min(l.xRA + dl.quarter[0], xBeltRear) : xBeltRear;
    for (let x = xTip; x >= xEnd; x -= 0.03) surround.push([x, yB(x) - 0.004]);
    const top: P[] = [];
    const xEndTop = dl.quarter ? Math.min(l.xRA + dl.quarter[0], xTopRear) : xTopRear;
    for (let x = xTip - 0.02; x >= xEndTop; x -= 0.03) top.push([x, yT(x) + 0.006]);
    (dl.chrome ? trimChrome : trimBlack).push(pair(ribbon(S, surround, 0.012, 'side', { lift: 0.006 })));
    if (dl.chrome) trimChrome.push(pair(ribbon(S, top, 0.008, 'side', { lift: 0.006 })));

    // windscreen
    const zAt = (x: number, k: number) => {
      const c = S.cab(x);
      if (!c) return 0;
      const y = c.cb + (c.ct - c.cb) * k;
      return Math.max(0, S.cabinW(x, y));
    };
    if (d.rake < 55) {
      const pts: P[] = [];
      const xa = l.xR1 + 0.01;
      const xb = l.xWs - 0.01;
      const n = 16;
      for (let i = 0; i <= n; i++) {
        const x = xa + ((xb - xa) * i) / n;
        pts.push([x, zAt(x, 0.82) - 0.035]);
      }
      for (let i = n; i >= 0; i--) {
        const x = xa + ((xb - xa) * i) / n;
        pts.push([x, -(zAt(x, 0.82) - 0.035)]);
      }
      glass.push(polyDecal(S, pts, 'top', { lift: 0.004, res: 0.025 }));
    } else {
      const xm = (l.xWs + l.xR1) / 2;
      const z = zAt(xm, 0.5) - 0.07;
      glass.push(polyDecal(S, [[-z, d.beltF + 0.05], [z, d.beltF + 0.05], [z, l.H - 0.06], [-z, l.H - 0.06]], 'front', { lift: 0.004, res: 0.025 }));
    }
    // rear glass
    const rearAngle = (Math.atan2(l.H - d.beltR, Math.max(0.01, l.xR2 - l.xC)) * 180) / Math.PI;
    if (rearAngle < 55) {
      const pts: P[] = [];
      const xa = l.xC + 0.025;
      const xb = l.xR2 - 0.02;
      const n = 14;
      for (let i = 0; i <= n; i++) {
        const x = xa + ((xb - xa) * i) / n;
        pts.push([x, zAt(x, 0.8) - 0.05]);
      }
      for (let i = n; i >= 0; i--) {
        const x = xa + ((xb - xa) * i) / n;
        pts.push([x, -(zAt(x, 0.8) - 0.05)]);
      }
      glass.push(polyDecal(S, pts, 'top', { lift: 0.004, res: 0.025 }));
    } else {
      const xm = (l.xR2 + l.xC) / 2;
      const z = zAt(xm, 0.5) - 0.09;
      glass.push(polyDecal(S, [[-z, d.beltR + 0.05], [z, d.beltR + 0.05], [z, l.H - 0.07], [-z, l.H - 0.07]], 'rear', { lift: 0.004, res: 0.025 }));
    }
  } else {
    // roadster: a framed windscreen as a separate panel
    const len = (l.H - d.beltF) / Math.sin((d.rake * Math.PI) / 180) * 0.62;
    const a = (d.rake * Math.PI) / 180;
    windscreen = {
      pos: new THREE.Vector3(l.xWs - (Math.cos(a) * len) / 2, d.beltF + (Math.sin(a) * len) / 2 - 0.01, 0),
      angle: a,
      w: S.sec(l.xWs).W * 1.62,
      len,
    };
  }

  // ---------------- shut lines ----------------
  const lines: G[] = [];
  const sill = d.gc + 0.14;
  const xDF = Math.min(l.xWs - 0.07, l.xFA - archR - 0.04);
  lines.push(ribbon(S, [[xDF + 0.03, beltAt(xDF) - 0.02], [xDF + 0.01, (beltAt(xDF) + sill) / 2], [xDF, sill]], 0.004, 'side'));
  let xDoorEnd: number;
  const R2 = archR + 0.05;
  if (d.dlo.b !== null && b !== 'roadster') {
    const xB = l.xRA + d.dlo.b;
    lines.push(ribbon(S, [[xB + 0.015, beltAt(xB) - 0.02], [xB - 0.01, sill]], 0.004, 'side'));
    const xr = l.xRA + Math.max(d.dlo.cBelt, -0.2) + 0.02;
    const arch: P[] = [[xr, beltAt(xr) - 0.02]];
    for (let k = 0; k <= 6; k++) {
      const t = (Math.PI / 2) * (1 - k / 6) * 0.85;
      const x = l.xRA + Math.cos(t) * R2;
      if (x > xr - 0.01) arch.push([x, l.wheelR + Math.sin(t) * R2]);
    }
    arch.push([l.xRA + R2, sill]);
    lines.push(ribbon(S, arch, 0.004, 'side'));
    xDoorEnd = l.xRA + R2;
  } else {
    xDoorEnd = g.position === 'mid' || g.id === 'c190' ? l.xRA + d.dlo.cBelt - 0.04 : l.xRA + R2 + 0.26;
    lines.push(ribbon(S, [[xDoorEnd + 0.02, beltAt(xDoorEnd) - 0.02], [xDoorEnd, sill]], 0.004, 'side'));
  }
  lines.push(ribbon(S, [[xDF, sill], [xDoorEnd, sill]], 0.004, 'side'));
  // hood
  const zh = hw * (b === 'offroad' ? 0.82 : 0.66);
  lines.push(
    ribbon(
      S,
      [
        [l.xWs + 0.04, zh],
        [l.xFront - 0.24, zh * 0.97],
        [l.xFront - (b === 'offroad' ? 0.06 : 0.17), zh * 0.78],
        [l.xFront - (b === 'offroad' ? 0.06 : 0.17), 0],
      ],
      0.004,
      'top',
    ),
  );
  // boot / tailgate
  if (!hatch && !liftback && b !== 'roadster') {
    const zt = hw * 0.6;
    lines.push(ribbon(S, [[l.xC - 0.05, 0], [l.xC - 0.05, zt], [l.xRear + 0.03, zt]], 0.004, 'top'));
    lines.push(ribbon(S, [[zt, d.tailY - 0.01], [zt * 0.98, d.tailY - 0.14], [0, d.tailY - 0.14]], 0.004, 'rear'));
  } else if (hatch || liftback) {
    const zt = hw * 0.62;
    const yb = d.tailY - (hatch ? 0.24 : 0.16);
    lines.push(ribbon(S, [[zt, d.tailY + (hatch ? 0.05 : 0)], [zt * 0.98, yb], [0, yb]], 0.004, 'rear'));
  }
  const shutLines = merge(lines.map((x) => pair(x)));

  // handles
  const hand: G[] = [];
  const handle = (x: number) => {
    const y = beltAt(x) - 0.08;
    return polyDecal(S, rect4(x - 0.16, y - 0.016, x, y + 0.016), 'side', { lift: d.details.handles === 'flush' ? 0.002 : 0.009, res: 0.008 });
  };
  if (d.dlo.b !== null && b !== 'roadster') {
    hand.push(handle(l.xRA + d.dlo.b + 0.3), handle(l.xRA + Math.max(d.dlo.cBelt, 0.05) + 0.3));
  } else hand.push(handle(xDoorEnd + 0.24));
  const handles = merge(hand.map(pair));

  // ---------------- body extras ----------------
  const paintBits: G[] = [];
  const carbon: G[] = [];
  const plastic: G[] = [];
  if (d.details.powerDome) {
    const x0 = l.xWs + 0.06;
    const x1 = l.xFront - 0.42;
    const h = d.details.powerDome;
    const w = 0.26;
    paintBits.push(
      polyDecal(S, rect4(x0, -w, x1, w), 'top', {
        lift: (u, v) => 0.002 + h * Math.pow(Math.sin(Math.PI * clamp((u - x0) / (x1 - x0), 0, 1)), 0.6) * Math.max(0, 1 - (v / w) ** 2),
        res: 0.02,
      }),
    );
  }
  const spoiler = d.details.spoiler;
  if ((spoiler === 'lip' || spoiler === 'ducktail') && !hatch) {
    const x0 = l.xRear + 0.012;
    const x1 = l.xRear + (spoiler === 'ducktail' ? 0.22 : 0.12);
    const h = spoiler === 'ducktail' ? 0.045 : 0.02;
    (g.engine.hp > 420 && spoiler === 'lip' ? carbon : paintBits).push(
      polyDecal(S, rect4(x0, -hw * 0.62, x1, hw * 0.62), 'top', { lift: (u) => 0.003 + h * ((x1 - u) / (x1 - x0)) ** 2, res: 0.015 }),
    );
  }
  if (spoiler === 'roof' && S.hasCabin) {
    const x0 = l.xR2 - 0.14;
    const x1 = l.xR2 + 0.02;
    const zw = Math.max(0.2, S.cabinW(l.xR2 - 0.05, l.H - 0.06) - 0.04);
    paintBits.push(polyDecal(S, rect4(x0, -zw, x1, zw), 'top', { lift: (u) => 0.004 + 0.03 * ((x1 - u) / (x1 - x0)) ** 2, res: 0.015 }));
  }
  if (d.details.roof && d.details.roof !== 'paint' && S.hasCabin) {
    const x0 = l.xR2 + 0.03;
    const x1 = l.xR1 - 0.04;
    const zw = Math.max(0.2, S.cabinW((x0 + x1) / 2, l.H - 0.035) - 0.02);
    const geo = polyDecal(S, rect4(x0, -zw, x1, zw, 0.06), 'top', { lift: 0.003, res: 0.025 });
    (d.details.roof === 'carbon' ? carbon : glassBlack).push(geo);
  }
  if (d.details.skirt === 'black' || b === 'offroad' || b === 'suv') {
    const y0 = d.gc + 0.02;
    const y1 = d.gc + (b === 'suv' || b === 'offroad' ? 0.16 : 0.11);
    plastic.push(pair(polyDecal(S, rect4(l.xRA + archR + 0.02, y0, l.xFA - archR - 0.02, y1), 'side', { lift: 0.004 })));
  }
  // lower front lip and rear diffuser
  plastic.push(polyDecal(S, rect4(-hw * 0.82, d.bumperY - 0.01, hw * 0.82, d.bumperY + 0.04), 'front', { lift: 0.003, res: 0.02 }));
  if (d.details.diffuser || d.exhaust.layout !== 'none') {
    const top = d.rearBumperY + (d.details.diffuser ? 0.12 : 0.06);
    plastic.push(polyDecal(S, rect4(-hw * 0.72, d.rearBumperY - 0.01, hw * 0.72, top), 'rear', { lift: 0.003, res: 0.02 }));
  }
  let gills: G = null;
  if (d.details.gills === 'fender') {
    const x1 = l.xFA - archR - 0.06;
    const x0 = x1 - 0.22;
    const y0 = beltAt(x1) - 0.22;
    gills = pair(polyDecal(S, [[x0, y0 + 0.01], [x1, y0], [x1 - 0.02, y0 + 0.065], [x0 + 0.02, y0 + 0.07]], 'side', { lift: 0.004, res: 0.01 }));
    trimChrome.push(pair(ribbon(S, [[x0 + 0.01, y0 + 0.035], [x1 - 0.01, y0 + 0.03]], 0.008, 'side', { lift: 0.007 })));
  }
  let sideblade: G = null;
  if (d.details.sideblade) {
    const x0 = l.xRA + archR + 0.08;
    const x1 = l.xRA + d.dlo.cBelt - 0.08;
    sideblade = pair(polyDecal(S, [[x1, d.gc + 0.16], [x0 + 0.1, d.gc + 0.16], [x0, d.beltR - 0.12], [x1 - 0.05, d.beltR - 0.05]], 'side', { lift: 0.005 }));
  }
  if (d.details.hoodVents) {
    for (const z0 of [0.12, 0.3]) {
      const geo = polyDecal(S, rect4(l.xFront - 0.78, z0, l.xFront - 0.5, z0 + 0.12, 0.02), 'top', { lift: 0.004, res: 0.012 });
      plastic.push(pair(geo));
    }
  }

  // ---------------- grille, intakes, frames ----------------
  const grilles: BuiltBody['grilles'] = [];
  const frameGeos: G[] = [];
  const pushGrille = (shape: P[], texture: GrilleTexture, mirror: boolean, frame: boolean) => {
    const pts = F(shape);
    const geo = polyDecal(S, pts, 'front', { lift: 0.006, res: 0.01 });
    if (geo) grilles.push({ geo: mirror ? merge([geo, mirrorZ(geo)])! : geo, texture });
    if (frame) {
      const fr = ribbon(S, pts, 0.014, 'front', { closed: true, lift: 0.009 });
      frameGeos.push(mirror ? pair(fr) : fr);
    }
  };
  for (const sh of d.grille.shapes) pushGrille(sh, d.grille.texture, !!d.grille.mirror, d.grille.frame !== 'none');
  for (const by of d.grille.bars ?? []) {
    for (const sh of d.grille.shapes) {
      const xs: number[] = [];
      for (let k = 0; k < sh.length; k++) {
        const [u0, v0] = sh[k];
        const [u1, v1] = sh[(k + 1) % sh.length];
        if ((v0 - by) * (v1 - by) <= 0 && v0 !== v1) xs.push(u0 + ((u1 - u0) * (by - v0)) / (v1 - v0));
      }
      if (xs.length >= 2) trimChrome.push(ribbon(S, F([[Math.min(...xs) + 0.01, by], [Math.max(...xs) - 0.01, by]]), 0.016, 'front', { lift: 0.011 }));
    }
  }
  for (const it of d.intakes) {
    const pts = F(it.shape);
    const geo = polyDecal(S, pts, 'front', { lift: 0.004, res: 0.012 });
    if (geo) grilles.push({ geo: it.mirror ? merge([geo, mirrorZ(geo)])! : geo, texture: it.texture });
  }

  // ---------------- lights ----------------
  const lightParts = (spec: LightSpec, conv: (p: P[]) => P[], view: 'front' | 'rear') => {
    const housing = pair(polyDecal(S, conv(spec.shape), view, { lift: 0.006, res: 0.008 }));
    const led: G[] = [];
    const lens: G[] = [];
    for (const s of spec.strips ?? []) led.push(pair(ribbon(S, conv(s), spec.stripW ?? 0.009, view, { lift: 0.009 })));
    for (const [u, dy, r] of spec.rings ?? []) led.push(pair(ribbon(S, conv([[u, dy]]).map(([z, y]) => [z, y] as P).flatMap(([z, y]) => circle(z, y, r)), 0.008, view, { closed: true, lift: 0.009 })));
    for (const [u, dy, r] of spec.dots ?? []) {
      const [[z, y]] = conv([[u, dy]]);
      lens.push(pair(polyDecal(S, circle(z, y, r), view, { lift: 0.008, res: 0.006 })));
    }
    return { housing, led: merge(led), lens: merge(lens) };
  };
  const head = lightParts(d.headlight, F, 'front');
  const tail = lightParts(d.taillight, R, 'rear');
  const headLed: G[] = [head.led];
  const tailLed: G[] = [tail.led];
  const headLens: G[] = [head.lens];
  if (d.fogs) {
    const [u, dy, r] = d.fogs;
    const [[z, y]] = F([[u, dy]]);
    headLens.push(pair(polyDecal(S, circle(z, y, r), 'front', { lift: 0.006, res: 0.006 })));
  }
  if (d.frontBar) {
    const top = Math.max(...d.headlight.shape.map((p) => p[1])) - 0.015;
    headLed.push(ribbon(S, F([[-0.42, top], [0.42, top]]), 0.008, 'front', { lift: 0.01 }));
  }
  if (d.rearBar) {
    const ys = d.taillight.shape.map((p) => p[1]);
    const mid = (Math.max(...ys) + Math.min(...ys)) / 2 + 0.008;
    tailLed.push(ribbon(S, R([[-0.5, mid], [0.5, mid]]), 0.01, 'rear', { lift: 0.008 }));
    tailLed.push(pair(ribbon(S, R([[0.5, mid], [0.6, mid]]), 0.01, 'rear', { lift: 0.008 })));
  }

  // ---------------- plates, badge, logos ----------------
  const pw = 0.52;
  const ph = 0.112;
  const fy = Math.max(d.bumperY + 0.08, d.noseY - (brand.id === 'audi' ? 0.43 : 0.47));
  const plateF = fitUV(polyDecal(S, rect4(-pw / 2, fy, pw / 2, fy + ph), 'front', { lift: 0.012, res: 0.02 }), -pw / 2, pw / 2, fy, fy + ph, true);
  const ry = Math.max(d.rearBumperY + 0.1, d.tailY - (hatch ? 0.36 : 0.27));
  const plateR = fitUV(polyDecal(S, rect4(-pw / 2, ry, pw / 2, ry + ph), 'rear', { lift: 0.012, res: 0.02 }), -pw / 2, pw / 2, ry, ry + ph, false);
  let badge: G = null;
  if (d.details.badge) {
    const by = ry + ph + 0.035;
    const u0 = hw * 0.38;
    const u1 = hw * 0.78;
    badge = fitUV(polyDecal(S, rect4(u0, by, u1, by + 0.055), 'rear', { lift: 0.01, res: 0.012 }), u0, u1, by, by + 0.055, false);
  }
  let logoFront: BuiltBody['logoFront'] = null;
  if (d.grille.logo) {
    const y = d.noseY + d.grille.logo[1];
    const x0 = S.endX(y, 0, 1);
    const x1 = S.endX(y + 0.02, 0, 1);
    if (x0 !== null && x1 !== null) logoFront = { pos: new THREE.Vector3(x0 + 0.012, y, 0), tilt: Math.atan2(x0 - x1, 0.02), scale: d.grille.logoScale ?? 1 };
  }
  const ly = d.tailY - (hatch ? 0.12 : 0.07);
  const lx = S.endX(ly, 0, -1);
  const logoRear = lx !== null ? { pos: new THREE.Vector3(lx - 0.01, ly, 0), scale: brand.id === 'mercedes' ? 1.3 : 1 } : null;

  // ---------------- mirrors, rails, wing ----------------
  const mx = l.xWs - (d.rake > 55 ? 0.08 : 0.16);
  const my = beltAt(mx) + 0.05;
  const mz = S.width(mx, beltAt(mx) - 0.03);
  const mirror = mz > 0 && b !== 'roadster' ? { pos: new THREE.Vector3(mx, my, mz + 0.085), base: mz - 0.01 } : b === 'roadster' ? { pos: new THREE.Vector3(mx, my, S.width(mx, beltAt(mx) - 0.05) + 0.1), base: S.width(mx, beltAt(mx) - 0.05) } : null;
  let roofRails: BuiltBody['roofRails'] = null;
  if (d.details.roofRails && S.hasCabin) {
    const xm = (l.xR1 + l.xR2) / 2;
    roofRails = { x0: l.xR2 + 0.02, x1: l.xR1 - 0.12, y: l.H + 0.012, z: S.cabinW(xm, l.H - 0.05) * 0.92 };
  }
  let wing: BuiltBody['wing'] = null;
  if (spoiler === 'wing' || spoiler === 'gtwing') {
    const gt = spoiler === 'gtwing';
    wing = { x: l.xRear + (gt ? 0.3 : 0.17), y: d.deckY + (gt ? 0.28 : 0.07), span: hw * (gt ? 1.65 : 1.3), chord: gt ? 0.28 : 0.2, gt, deckY: d.deckY };
  }
  const hoodStar = d.details.hoodStar ? (() => {
    const x = l.xFront - 0.12;
    const y = S.topY(x, 0);
    return y === null ? null : new THREE.Vector3(x, y + 0.035, 0);
  })() : null;

  return {
    S,
    lower: S.buildLower(),
    cabin: S.buildCabin(),
    glass: merge(glass),
    glassBlack: merge(glassBlack),
    trimChrome: merge(trimChrome),
    trimBlack: merge(trimBlack),
    shutLines,
    handles,
    paintBits: merge(paintBits),
    carbon: merge(carbon),
    plastic: merge(plastic),
    gills,
    sideblade,
    grilles,
    frames: { geo: merge(frameGeos), color: d.grille.frame === 'blue' ? 'blue' : d.grille.frame === 'black' ? 'black' : 'chrome' },
    headHousing: head.housing,
    headLed: merge(headLed),
    headLens: merge(headLens),
    tailHousing: tail.housing,
    tailLed: merge(tailLed),
    plateF,
    plateR,
    badge,
    logoFront,
    logoRear,
    mirror,
    hoodStar,
    windscreen,
    roofRails,
    wing,
  };
}

function rect4(x0: number, y0: number, x1: number, y1: number, r = 0): P[] {
  const pts: P[] = [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];
  if (!r) return pts;
  // simple corner rounding
  const out: P[] = [];
  const n = 4;
  for (let i = 0; i < 4; i++) {
    const p0 = pts[(i + 3) % 4];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % 4];
    const a: P = [p1[0] + Math.sign(p0[0] - p1[0]) * r, p1[1] + Math.sign(p0[1] - p1[1]) * r];
    const c: P = [p1[0] + Math.sign(p2[0] - p1[0]) * r, p1[1] + Math.sign(p2[1] - p1[1]) * r];
    for (let s = 0; s <= n; s++) {
      const t = s / n;
      out.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * p1[0] + t * t * c[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * p1[1] + t * t * c[1]]);
    }
  }
  return out;
}

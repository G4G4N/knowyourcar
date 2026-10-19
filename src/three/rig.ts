import * as THREE from 'three';
import type { Brand, Generation } from '../data/types';
import type { Layout } from './layout';
import { designFor } from '../data/designs';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** World-space anchor points shared by the component meshes and the X-ray flow particles. */
export interface Rig {
  engineToWorld: (p: THREE.Vector3) => THREE.Vector3;
  engineRotY: number;
  /** slant about the crank axis (radians), applied before engineRotY */
  engineSlant: number;
  ice: boolean;
  ev: boolean;
  hybrid: boolean;
  turbos: { local: THREE.Vector3; world: THREE.Vector3; side: number }[];
  supercharger: THREE.Vector3 | null;
  plenums: { local: THREE.Vector3; side: number }[];
  airFilter: THREE.Vector3;
  grille: THREE.Vector3;
  /** exhaust routes, one per bank/side: from engine to tail */
  exhaust: { route: THREE.Vector3[]; catAt: number; mufflerAt: number }[];
  muffler: THREE.Vector3;
  tailpipes: { pos: THREE.Vector3; dir: 'x' | 'z'; shape: 'round' | 'oval' | 'trap'; r: number }[];
  radiator: { x: number; y: number; w: number; h: number };
  intercooler: boolean;
  /** water-cooled charge-air cooler on the engine (world position), when the engine has one */
  chargeCooler: THREE.Vector3 | null;
  gearbox: { from: THREE.Vector3; to: THREE.Vector3; r0: number; r1: number } | null;
  propShaft: { from: THREE.Vector3; to: THREE.Vector3 } | null;
  frontProp: { from: THREE.Vector3; to: THREE.Vector3 } | null;
  transferCase: THREE.Vector3 | null;
  frontDiff: THREE.Vector3 | null;
  rearDiff: THREE.Vector3 | null;
  drivenFront: boolean;
  drivenRear: boolean;
  fuelTank: { x: number; y: number; w: number; l: number; h: number } | null;
  battery12: THREE.Vector3;
  hvBattery: { x0: number; x1: number; y: number; h: number; w: number } | null;
  motorFront: THREE.Vector3 | null;
  motorRear: THREE.Vector3 | null;
  chargePort: THREE.Vector3 | null;
  steeringRackX: number;
}

export function computeRig(l: Layout, g: Generation, brand: Brand, rearX?: (y: number, z: number) => number | null): Rig {
  const e = l.engine;
  const ev = g.engine.layout === 'EV';
  const ice = !ev;
  const hybrid = !!g.engine.hybrid;
  const rotY = e?.transverse ? -Math.PI / 2 : 0;
  const origin = e ? v(e.x, e.y, e.z) : v(0, 0, 0);
  const slant = ((g.engine.slant ?? 0) * Math.PI) / 180;
  const engineToWorld = (p: THREE.Vector3) =>
    p.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), slant).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY).add(origin);

  const turbos: Rig['turbos'] = [];
  const plenums: Rig['plenums'] = [];
  let supercharger: THREE.Vector3 | null = null;
  if (e) {
    const halfW = e.banks === 1 ? e.bore * 0.9 : 0;
    const ind = g.engine.induction;
    const twin = ind === 'twin-turbo';
    const turbo = ind === 'turbo' || twin;
    if (e.banks === 1) {
      plenums.push({ local: v(0, e.deckH * 0.8, -(halfW + 0.13)), side: -1 });
      if (turbo) {
        const xs = twin ? [e.length * 0.22, -e.length * 0.22] : [0];
        for (const x of xs) turbos.push({ local: v(x, e.deckH * 0.45, halfW + 0.2), world: v(0, 0, 0), side: 1 });
      }
    } else {
      const half = e.bankAngle / 2;
      const deckLocal = (side: number, out: number, up: number) => {
        const th = side * half;
        return v(0, up * Math.cos(th) - out * side * Math.sin(th), up * Math.sin(th) + out * side * Math.cos(th));
      };
      if (g.engine.hotV && turbo) {
        const xs = twin ? [e.length * 0.18, -e.length * 0.18] : [0];
        xs.forEach((x, i) => turbos.push({ local: v(x, e.deckH * 1.05, twin ? (i === 0 ? 0.06 : -0.06) : 0), world: v(0, 0, 0), side: 0 }));
        for (const s of [1, -1]) plenums.push({ local: deckLocal(s, e.bore * 1.1, e.deckH + 0.05), side: s });
      } else {
        // Mid-engined V10 (R8): the intake plenum sits high in the V on long runners, right under
        // the rear glass, which is why the engine is on show from outside.
        plenums.push({ local: v(0, e.deckH * 1.15 + (g.position === 'mid' ? 0.24 : 0), 0), side: 0 });
        if (ind === 'supercharged') supercharger = v(0, e.deckH * 1.25, 0);
        if (turbo) for (const s of [1, -1]) turbos.push({ local: deckLocal(s, e.bore * 1.9, e.deckH * 0.25), world: v(0, 0, 0), side: s });
      }
    }
    for (const t of turbos) t.world = engineToWorld(t.local);
  }

  const grille = v(l.xFront - 0.05, l.gc + 0.32, 0);
  const airFilter = ice
    ? g.position === 'mid'
      ? v(l.xRear + 0.35, l.belt - 0.12, -0.35)
      : v(Math.min(l.xFront - 0.42, (e?.x ?? 0) + (e?.transverse ? 0.2 : e!.length / 2 + 0.1)), l.belt - 0.22, -0.33)
    : v(0, 0, 0);

  // ---------- exhaust (tip layout comes from the design) ----------
  const exhaust: Rig['exhaust'] = [];
  const tailpipes: Rig['tailpipes'] = [];
  const ds = designFor(g);
  const ex = ds.exhaust;
  const hw = l.W / 2;
  const yUnder = l.gc + 0.06;
  const tipY = ds.rearBumperY + 0.07;
  const muffler = v(l.xRear + 0.38, Math.max(l.gc + 0.12, tipY - 0.02), 0);
  // tip group centres (z) the routes head for
  const groups: number[] =
    ex.layout === 'split' ? [ex.spread * hw, -ex.spread * hw] : ex.layout === 'left' ? [-ex.spread * hw] : ex.layout === 'center' ? [0] : ex.layout === 'side' ? [hw, -hw] : [];
  if (e && groups.length) {
    const sides = e.banks === 2 && !g.engine.hotV ? [1, -1] : groups.length > 1 ? [1, -1] : [1];
    for (const s of sides) {
      const gz = groups.length > 1 ? groups[s > 0 ? 0 : 1] : groups[0];
      const route: THREE.Vector3[] = [];
      let start: THREE.Vector3;
      if (turbos.length) start = (turbos.find((t) => t.side === s) ?? turbos[0]).world.clone();
      else if (e.banks === 2) start = engineToWorld(v(0, e.deckH * 0.3, s * e.bore * 1.9));
      else start = engineToWorld(v(0, e.deckH * 0.45, e.bore * 0.9 + 0.12));
      route.push(start);
      if (g.position === 'mid') {
        route.push(v(start.x - 0.15, start.y - 0.1, start.z * 0.9));
        route.push(v(l.xRear + 0.45, tipY + 0.06, gz * 0.7));
        route.push(v(l.xRear + 0.12, tipY, gz));
        route.push(v(l.xRear - 0.03, tipY, gz));
      } else {
        const down = e.transverse ? v(e.x - 0.25, l.gc + 0.18, e.z + 0.05) : v(start.x - 0.1, l.gc + 0.16, s * 0.18);
        route.push(down);
        const exitX = e.transverse ? e.x - 0.5 : e.x - e.length / 2 - 0.2;
        route.push(v(exitX, yUnder, s * 0.12));
        if (ex.layout === 'side') {
          const xs = l.xRA + l.wheelR + 0.25;
          route.push(v(xs + 0.35, yUnder, s * 0.25));
          route.push(v(xs + 0.05, l.gc + 0.1, s * (hw - 0.25)));
          route.push(v(xs, l.gc + 0.11, s * (hw - 0.02)));
        } else {
          route.push(v(l.xRA + 0.35, yUnder, s * 0.14));
          route.push(v(l.xRA - 0.05, l.wheelR + 0.08, s * 0.16));
          route.push(v(muffler.x + 0.05, muffler.y, gz * 0.5 + s * 0.08));
          route.push(v(l.xRear + 0.18, tipY, gz));
          route.push(v(l.xRear - 0.03, tipY, gz));
        }
      }
      exhaust.push({ route, catAt: 0.18, mufflerAt: g.position === 'mid' ? 0.7 : 0.82 });
    }
    // tips sit just proud of the real rear surface
    const tipX = (y: number, z: number) => (rearX?.(y, z) ?? l.xRear) + 0.015;
    for (const r of exhaust) {
      const end = r.route[r.route.length - 1];
      if (ex.layout !== 'side') {
        end.x = tipX(end.y, end.z) + 0.02;
        r.route[r.route.length - 2].x = Math.max(r.route[r.route.length - 2].x, end.x + 0.12);
      }
    }
    const perGroup = Math.max(1, Math.round(ex.n / groups.length));
    for (const gz of groups) {
      for (let k = 0; k < perGroup; k++) {
        const off = (k - (perGroup - 1) / 2) * (ex.r * 2 + 0.02);
        if (ex.layout === 'side') tailpipes.push({ pos: v(l.xRA + l.wheelR + 0.25 + off, l.gc + 0.11, Math.sign(gz) * (hw - 0.01)), dir: 'z', shape: ex.shape, r: ex.r });
        else if (ex.layout === 'center') {
          const z = (k - (perGroup - 1) / 2) * ex.spread * hw * 2;
          tailpipes.push({ pos: v(tipX(tipY + 0.03, z), tipY + 0.03, z), dir: 'x', shape: ex.shape, r: ex.r });
        } else tailpipes.push({ pos: v(tipX(tipY, gz + off), tipY, gz + off), dir: 'x', shape: ex.shape, r: ex.r });
      }
    }
  }

  // ---------- drivetrain ----------
  const drivenFront = g.drivetrain !== 'RWD';
  const drivenRear = g.drivetrain !== 'FWD';
  let gearbox: Rig['gearbox'] = null;
  let propShaft: Rig['propShaft'] = null;
  let frontProp: Rig['frontProp'] = null;
  let transferCase: THREE.Vector3 | null = null;
  let frontDiff: THREE.Vector3 | null = null;
  let rearDiff: THREE.Vector3 | null = null;
  const axleY = l.wheelR;
  if (e) {
    const ey = e.y + 0.02;
    if (e.transverse) {
      const gz = e.z + e.length / 2 + 0.05;
      gearbox = { from: v(e.x - 0.02, ey, gz), to: v(e.x - 0.02, ey - 0.04, gz + 0.38), r0: 0.17, r1: 0.13 };
      frontDiff = v(l.xFA, axleY, gz + 0.12);
      if (drivenRear) {
        // PTU beside the gearbox turns a prop shaft rearwards; the coupling (Haldex) or the
        // torque splitter's twin clutches sit at the rear axle, not at the front.
        const ptu = v(l.xFA - 0.18, axleY, 0.05);
        const splitter = g.awd?.kind === 'torque-splitter';
        transferCase = v(l.xRA + (splitter ? 0 : 0.2), axleY, 0);
        rearDiff = splitter ? null : v(l.xRA, axleY, 0);
        propShaft = { from: ptu, to: transferCase };
      }
    } else if (g.position === 'mid') {
      const gx0 = e.x - e.length / 2 - 0.04;
      gearbox = { from: v(gx0, ey, 0), to: v(l.xRA - 0.3, ey + 0.02, 0), r0: 0.18, r1: 0.14 };
      rearDiff = v(l.xRA, axleY, 0);
      if (drivenFront) {
        // R8: the viscous coupling (Type 42) / multi-plate clutch (Type 4S) sits at the front axle
        frontDiff = v(l.xFA, axleY, 0);
        transferCase = v(l.xFA - 0.2, axleY, 0.1);
        frontProp = { from: v(e.x + e.length / 2 + 0.05, ey - 0.05, 0.1), to: transferCase };
      }
    } else if (g.id === 'c190') {
      // AMG GT: rear transaxle linked by a torque tube
      gearbox = { from: v(l.xRA + 0.25, axleY + 0.05, 0), to: v(l.xRA - 0.35, axleY + 0.05, 0), r0: 0.16, r1: 0.16 };
      propShaft = { from: v(e.x - e.length / 2 - 0.05, ey, 0), to: v(l.xRA + 0.25, axleY + 0.05, 0) };
      rearDiff = v(l.xRA, axleY, 0);
    } else {
      const gx0 = e.x - e.length / 2 - 0.03;
      const gLen = g.transmission === 'manual' ? 0.62 : 0.72;
      gearbox = { from: v(gx0, ey, 0), to: v(gx0 - gLen, ey - 0.03, 0), r0: e.banks === 2 ? 0.22 : 0.19, r1: 0.1 };
      rearDiff = drivenRear ? v(l.xRA, axleY, 0) : null;
      if (drivenRear) propShaft = { from: gearbox.to, to: v(l.xRA + 0.12, axleY, 0) };
      if (drivenFront) {
        if (brand.id === 'audi') {
          frontDiff = v(l.xFA, axleY, 0);
          transferCase = v(gx0 - gLen + 0.12, ey - 0.03, 0);
        } else {
          transferCase = v(gx0 - gLen + 0.08, ey - 0.03, 0.1);
          frontDiff = v(l.xFA, axleY, 0.16);
          frontProp = { from: transferCase, to: v(l.xFA - 0.1, axleY, 0.16) };
        }
      }
    }
  }

  let motorFront: THREE.Vector3 | null = null;
  let motorRear: THREE.Vector3 | null = null;
  let hvBattery: Rig['hvBattery'] = null;
  let chargePort: THREE.Vector3 | null = null;
  if (ev) {
    hvBattery = { x0: l.xRA + 0.42, x1: l.xFA - 0.38, y: l.gc + 0.015, h: 0.12, w: l.W * 0.8 };
    if (g.engine.motors?.rear) motorRear = v(l.xRA - 0.02, axleY + 0.02, 0);
    if (g.engine.motors?.front) motorFront = v(l.xFA + 0.03, axleY + 0.02, 0);
    frontDiff = motorFront;
    rearDiff = motorRear;
    chargePort = v(l.xRA - l.wheelR - 0.28, l.belt - 0.1, l.W / 2 - 0.02);
  } else if (hybrid) {
    motorRear = v(l.xRA - 0.02, axleY + 0.02, -0.14);
    hvBattery = { x0: l.xRA - 0.45, x1: l.xRA - 0.12, y: l.wheelR + 0.12, h: 0.22, w: l.W * 0.42 };
    chargePort = v(l.xRA - l.wheelR - 0.28, l.belt - 0.1, l.W / 2 - 0.02);
  }

  const fuelTank = ice
    ? g.position === 'mid'
      ? { x: l.xFA - 0.42, y: l.gc + 0.12, w: 0.7, l: 0.32, h: 0.3 }
      : { x: (l.rearSeatX ?? l.xRA + 0.5) + 0.05, y: l.gc + 0.04, w: l.W * 0.55, l: 0.45, h: 0.24 }
    : null;
  const battery12 =
    g.battery12 === 'trunk' || (g.battery12 !== 'front' && brand.id !== 'audi' && !ev)
      ? v(l.xRear + 0.45, l.gc + 0.25, 0.42)
      : ev
        ? v(l.xFront - 0.5, l.belt - 0.3, 0.35)
        : v(l.xFront - 0.45, l.belt - 0.3, 0.42);

  return {
    engineToWorld,
    engineRotY: rotY,
    engineSlant: slant,
    ice,
    ev,
    hybrid,
    turbos,
    supercharger,
    plenums,
    airFilter,
    grille,
    exhaust,
    muffler,
    tailpipes,
    radiator: { x: l.xFront - 0.2, y: l.gc + 0.14, w: l.W * 0.62, h: Math.min(0.45, l.noseTop - l.gc - 0.2) },
    intercooler: (g.engine.induction === 'turbo' || g.engine.induction === 'twin-turbo') && g.engine.chargeCooling !== 'engine',
    chargeCooler: e && g.engine.chargeCooling === 'engine' && plenums.length ? engineToWorld(plenums[0].local.clone().add(v(0, -0.05, 0))) : null,
    gearbox,
    propShaft,
    frontProp,
    transferCase,
    frontDiff: drivenFront ? frontDiff : null,
    rearDiff: drivenRear ? rearDiff : null,
    drivenFront,
    drivenRear,
    fuelTank,
    battery12,
    hvBattery,
    motorFront,
    motorRear,
    chargePort,
    steeringRackX: l.xFA + (brand.id === 'audi' ? -0.12 : 0.14),
  };
}

import type { Brand, Generation } from '../data/types';
import { cylinderCount } from '../data/parts';
import { designFor } from '../data/designs';

/**
 * Derives every dimension the 3D model needs from a generation's spec sheet.
 * Coordinate system: +X forward, +Y up, +Z to the car's right. Origin = ground, mid-wheelbase.
 */
export interface Layout {
  L: number;
  W: number;
  H: number;
  WB: number;
  xFront: number;
  xRear: number;
  xFA: number; // front axle
  xRA: number; // rear axle
  wheelR: number;
  rimR: number;
  tireW: number;
  trackZ: number; // wheel centre |z|
  gc: number; // ground clearance
  belt: number; // beltline height
  hoodFront: number;
  noseTop: number;
  tailTop: number;
  deckH: number;
  xWs: number; // windscreen base
  xR1: number; // windscreen top
  xR2: number; // roof end
  xC: number; // rear glass base
  roofTaper: number; // cabin width at roof vs belt
  floor: number;
  frontSeatX: number;
  rearSeatX: number | null;
  driverZ: number;
  engine: EngineLayout | null;
  cyl: number;
}

export interface EngineLayout {
  x: number; // centre of block
  y: number; // crank height
  z: number;
  transverse: boolean;
  banks: 1 | 2;
  bankAngle: number; // radians between banks
  cylPerBank: number;
  pitch: number; // bore spacing
  bore: number;
  stroke: number;
  length: number;
  deckH: number; // crank to top of block
}

export function computeLayout(g: Generation, brand: Brand): Layout {
  const d = designFor(g);
  const L = g.dims.length / 1000;
  const W = g.dims.width / 1000;
  const H = g.dims.height / 1000;
  const WB = g.dims.wheelbase / 1000;
  const b = g.body;

  const fOH = d.fOH;
  const rOH = L - WB - fOH;
  const xFA = WB / 2;
  const xRA = -WB / 2;
  const xFront = xFA + fOH;
  const xRear = xRA - rOH;

  const rimR = (g.rimInches * 0.0254) / 2;
  const sidewall = b === 'offroad' ? 0.13 : b === 'suv' ? 0.1 : g.rimInches >= 20 ? 0.065 : g.rimInches <= 15 ? 0.1 : 0.08;
  const wheelR = rimR + sidewall;
  const tireW = b === 'offroad' ? 0.28 : g.engine.hp > 450 ? 0.28 : g.rimInches <= 15 ? 0.21 : 0.24;
  const trackZ = W / 2 - tireW / 2 - 0.035 + Math.max(d.flareF, d.flareR) * 0.4;

  const gc = d.gc;
  const belt = d.beltF;
  const xWs = xFA - d.cowl;
  const xR1 = xWs - (H - d.roofCrown - d.beltF) / Math.tan((d.rake * Math.PI) / 180);
  let xR2 = xRA + d.roofEnd;
  let xC = xRA + d.cBase;
  if (b === 'roadster') {
    xR2 = xR1;
    xC = xR1 - 0.05;
  }
  xC = Math.max(xC, xRear + 0.03);
  xR2 = Math.min(Math.max(xR2, xC + 0.08), xR1 - 0.15);

  const floor = gc + (b === 'suv' || b === 'offroad' ? 0.18 : 0.12) + (g.position === 'ev' ? 0.06 : 0);
  const seatBack = b === 'offroad' ? 0.6 : g.position === 'mid' ? 0.95 : g.id === 'c190' || b === 'roadster' ? 0.78 : 0.85;
  const frontSeatX = xWs - seatBack;
  const rearSeatX =
    b === 'roadster' || g.position === 'mid' || g.id === 'c190'
      ? null
      : frontSeatX - (b === 'coupe' ? 0.78 : 0.92);

  // Engine
  const cyl = cylinderCount(g.engine.layout);
  let engine: EngineLayout | null = null;
  if (g.engine.layout !== 'EV') {
    const banks: 1 | 2 = g.engine.layout.startsWith('V') ? 2 : 1;
    const cylPerBank = banks === 2 ? cyl / 2 : cyl;
    const borePerCyl = Math.cbrt((g.engine.displacement / cyl) * 0.001); // ~ bore ≈ stroke
    const bore = g.engine.bore ? g.engine.bore / 1000 : borePerCyl * 1.05;
    const stroke = g.engine.stroke ? g.engine.stroke / 1000 : borePerCyl * 0.95;
    const pitch = bore * 1.18;
    const length = cylPerBank * pitch + (banks === 2 ? pitch * 0.5 : 0) + 0.1;
    const bankAngle =
      g.engine.layout === 'V6' ? (g.engine.code?.startsWith('M27') ? Math.PI / 3 : Math.PI / 2) : g.engine.layout === 'V12' ? Math.PI / 3 : Math.PI / 2;
    const transverse = g.position === 'front-transverse';
    const y = gc + 0.2 + (b === 'offroad' || b === 'suv' ? 0.12 : 0);
    let x: number;
    let z = 0;
    if (g.position === 'mid') x = xRA + 0.5 + length / 2 - 0.1;
    else if (transverse) {
      x = xFA + 0.08;
      z = -0.12;
    } else if (brand.id === 'audi') x = xFA + length / 2 - 0.12; // Audi: engine ahead of the axle
    else x = xFA - length / 2 + 0.1; // BMW / Mercedes: behind the axle
    engine = { x, y, z, transverse, banks, bankAngle, cylPerBank, pitch, bore, stroke, length, deckH: stroke * 2.05 + bore * 0.35 + 0.012 };
  }

  return {
    L, W, H, WB, xFront, xRear, xFA, xRA, wheelR, rimR, tireW, trackZ, gc, belt,
    hoodFront: d.noseY, noseTop: d.noseY, tailTop: d.tailY, deckH: d.deckY,
    xWs, xR1, xR2, xC, roofTaper: d.tumble, floor, frontSeatX, rearSeatX, driverZ: -0.36 * (W / 1.85), engine, cyl,
  };
}

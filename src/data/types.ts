export type BodyStyle =
  | 'sedan'
  | 'wagon'
  | 'hatch'
  | 'coupe'
  | 'fastback'
  | 'suv'
  | 'roadster'
  | 'offroad';

export type EngineLayout = 'I4' | 'I5' | 'I6' | 'V6' | 'V8' | 'V10' | 'V12' | 'EV';

export type Induction = 'NA' | 'turbo' | 'twin-turbo' | 'supercharged' | 'electric';

export type Drivetrain = 'FWD' | 'RWD' | 'AWD';

/** Where the engine (or main motor) sits and which way the crank points. */
export type EnginePosition =
  | 'front-longitudinal' // crank along the car
  | 'front-transverse' // crank across the car
  | 'mid' // behind the cabin
  | 'ev';

export type Transmission = 'manual' | 'automatic' | 'dct' | 'single-speed';

/**
 * How an all-wheel-drive car splits torque between the axles. Decides both the explanation and
 * where the hardware sits in the 3D rig.
 */
export type AwdKind =
  | 'torsen' // Audi longitudinal: Torsen worm-gear self-locking centre diff behind the gearbox
  | 'crown-gear' // Audi longitudinal: crown-gear self-locking centre diff behind the gearbox
  | 'ultra' // Audi quattro ultra: clutch at gearbox output + dog clutch in rear diff, FWD-biased, no centre diff
  | 'haldex' // transverse: front PTU + electro-hydraulic multi-plate coupling at the rear axle
  | 'torque-splitter' // transverse: two rear clutches, one per wheel, instead of a rear diff
  | 'xdrive' // BMW: multi-plate clutch transfer case behind the gearbox, rear-biased, variable
  | 'planetary' // open planetary centre diff with a fixed split (non-AMG 4MATIC, BMW E53)
  | 'clutch-variable' // AMG 4MATIC+: multi-plate clutch, 0–50 % to the front
  | 'viscous-front' // Audi R8 (Type 42): viscous coupling in the front-axle drive
  | 'clutch-front' // Audi R8 (Type 4S): electro-hydraulic multi-plate clutch at the front axle
  | 'g-locks' // Mercedes G-Class: centre diff + low range transfer case + three locking diffs
  | 'dual-motor'; // EV: one motor per axle, no mechanical link

export interface Awd {
  kind: AwdKind;
  /** nominal front:rear torque split, e.g. "40:60"; omit when fully variable */
  split?: string;
}

export interface Generation {
  id: string;
  /** Chassis / internal code, e.g. "G80", "B9", "W206" */
  code: string;
  /** Marketing variant this page is modelled on, e.g. "M3 Competition" */
  variant: string;
  years: string;
  body: BodyStyle;
  /** Exterior dimensions in millimetres */
  dims: { length: number; width: number; height: number; wheelbase: number };
  engine: {
    layout: EngineLayout;
    /** litres, 0 for EV */
    displacement: number;
    code?: string;
    induction: Induction;
    /** Turbos inside the V of the engine ("hot-V") */
    hotV?: boolean;
    hp: number;
    torque: number; // Nm
    redline: number; // rpm (EV: max motor rpm)
    /** EV / hybrid details */
    motors?: { front: boolean; rear: boolean };
    batteryKWh?: number;
    hybrid?: boolean; // ICE + traction e-motor
  };
  position: EnginePosition;
  drivetrain: Drivetrain;
  /** Brand name for AWD system etc. */
  drivetrainName?: string;
  awd?: Awd;
  transmission: Transmission;
  gears: number;
  zeroTo100: number; // seconds
  topSpeed: number; // km/h
  weight: number; // kg
  rimInches: number;
  paint: string; // hex
  paintName: string;
  facts: string[];
}

export interface Model {
  id: string;
  name: string;
  segment: string;
  generations: Generation[];
}

export interface Brand {
  id: 'audi' | 'bmw' | 'mercedes';
  name: string;
  hq: string;
  founded: number;
  tagline: string;
  accent: string;
  models: Model[];
}

export type SystemId =
  | 'body'
  | 'engine'
  | 'drivetrain'
  | 'cooling'
  | 'exhaust'
  | 'fuel'
  | 'electric'
  | 'chassis'
  | 'interior';

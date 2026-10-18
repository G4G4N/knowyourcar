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

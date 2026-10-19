import type { Brand, Generation, SystemId } from './types';

export interface PartInfo {
  name: string;
  system: SystemId;
  summary: string;
  how: string;
  fact?: string;
}

export const SYSTEMS: Record<SystemId, { label: string; color: string }> = {
  body: { label: 'Body', color: '#9fb3c8' },
  engine: { label: 'Engine', color: '#ff8a3d' },
  drivetrain: { label: 'Drivetrain', color: '#ffd23f' },
  cooling: { label: 'Cooling', color: '#3dd6ff' },
  exhaust: { label: 'Exhaust', color: '#ff4d6d' },
  fuel: { label: 'Fuel', color: '#c08bff' },
  electric: { label: 'Electrical', color: '#4dffa6' },
  chassis: { label: 'Chassis', color: '#7c8cff' },
  interior: { label: 'Interior', color: '#f0c9a0' },
};

export type PartId = keyof typeof PARTS;

export const PARTS = {
  body: {
    name: 'Body shell',
    system: 'body',
    summary: 'The painted outer skin and the structure underneath that holds everything together.',
    how: 'Modern cars use a monocoque ("unibody"): the outer panels, floor, pillars and roof are welded and bonded into one stiff shell that carries the loads, instead of bolting a body onto a separate frame. Crumple zones front and rear absorb crash energy while the passenger cell stays rigid.',
    fact: 'Toggle X-ray mode to see through the body and explore what is inside.',
  },
  glass: {
    name: 'Glasshouse',
    system: 'body',
    summary: 'Windscreen, side windows and rear window.',
    how: 'The windscreen is laminated — two sheets of glass with a plastic (PVB) layer between them — so it cracks but does not shatter. It is bonded to the body and contributes to roof stiffness. Side windows are usually tempered glass that crumbles into small cubes when broken.',
  },
  headlights: {
    name: 'Headlights',
    system: 'electric',
    summary: 'Front lighting units, including daytime running lights.',
    how: 'Modern units are LED or matrix-LED: dozens of individually controlled LEDs that a camera-driven controller switches off segment by segment, so you can run high beam without dazzling oncoming drivers.',
    fact: 'Audi pioneered matrix LED and even laser high beams in production cars.',
  },
  taillights: {
    name: 'Tail lights',
    system: 'electric',
    summary: 'Rear position, brake and indicator lights.',
    how: 'LED tail lights light up roughly 0.2 seconds faster than incandescent bulbs — at highway speed that gives the driver behind about 6 m of extra stopping distance.',
  },
  grille: {
    name: 'Grille & badge',
    system: 'body',
    summary: 'The face of the car — and the main intake for cooling air.',
    how: 'Air entering the grille passes through the intercooler, A/C condenser and radiator. Many modern cars have active shutters behind the grille that close at speed to cut drag when the engine does not need the airflow.',
  },
  mirrors: {
    name: 'Door mirrors',
    system: 'body',
    summary: 'Side mirrors with integrated indicators and blind-spot warning.',
    how: 'Mirrors are shaped in the wind tunnel because they are one of the noisiest parts of a car at speed. Most fold electrically and heat up to clear frost.',
  },

  engineBlock: {
    name: 'Engine block',
    system: 'engine',
    summary: 'The heavy core of the engine that houses the cylinders.',
    how: 'The block contains the cylinder bores in which the pistons slide, water jackets for coolant and oil galleries for lubrication. Each cylinder runs the four-stroke cycle: intake (piston pulls in air + fuel), compression, power (spark ignites the mixture and pushes the piston down) and exhaust. Watch the cylinders flash orange in X-ray mode — that is the power stroke.',
  },
  cylinderHead: {
    name: 'Cylinder head & camshafts',
    system: 'engine',
    summary: 'Sits on top of the block and controls how the engine breathes.',
    how: 'The head holds the intake and exhaust valves, spark plugs and fuel injectors. Camshafts — driven by a chain from the crankshaft at half crank speed — push the valves open at exactly the right moment. Variable valve timing (VANOS at BMW, Camtronic at Mercedes, AVS at Audi) shifts that timing for more power or better economy.',
  },
  pistons: {
    name: 'Pistons & connecting rods',
    system: 'engine',
    summary: 'Turn the force of combustion into motion.',
    how: 'Burning fuel creates pressure above the piston of up to ~200 bar, forcing it down the bore. The connecting rod transfers that push to an offset journal on the crankshaft, turning straight-line motion into rotation — just like your legs pushing bicycle pedals.',
    fact: 'At 7,000 rpm a piston stops and reverses direction 233 times every second.',
  },
  crankshaft: {
    name: 'Crankshaft',
    system: 'engine',
    summary: 'The spinning backbone of the engine.',
    how: 'The crankshaft collects the pushes from every piston and turns them into continuous torque at the flywheel. Its throws are arranged so cylinders fire evenly spaced — the firing order — which is what gives each engine type its character and sound.',
  },
  intake: {
    name: 'Intake manifold & throttle',
    system: 'engine',
    summary: 'Distributes fresh air to each cylinder.',
    how: 'Air flows from the air filter through the throttle body (which you control with the accelerator) and into a plenum that branches to each intake port. Runner length is tuned so pressure waves help stuff extra air into the cylinders at certain rpm.',
  },
  airFilter: {
    name: 'Air filter box',
    system: 'engine',
    summary: 'Cleans the air before it reaches the engine.',
    how: 'An engine at full throttle swallows roughly 10,000 litres of air per minute. The paper or cotton filter element traps dust and grit that would otherwise score the cylinder walls.',
  },
  turbo: {
    name: 'Turbocharger',
    system: 'engine',
    summary: 'Uses exhaust energy to force more air into the engine.',
    how: 'Hot exhaust spins a turbine wheel at up to 250,000 rpm. A shaft connects it to a compressor wheel that pressurises the intake air. More air means more fuel can be burned per stroke, so a small engine makes big-engine power. The intercooler then cools that compressed air so it is denser.',
    fact: 'A "hot-V" layout puts the turbos inside the V of the engine for a short, quick-responding exhaust path.',
  },
  supercharger: {
    name: 'Supercharger',
    system: 'engine',
    summary: 'A belt- or engine-driven air pump for instant boost.',
    how: 'Unlike a turbo, a supercharger is driven mechanically by the crankshaft, so boost arrives instantly with no lag. The trade-off is that it consumes some engine power to drive it. Roots and twin-screw types sit on top of the engine, usually in the V.',
  },
  ignition: {
    name: 'Combustion chambers',
    system: 'engine',
    summary: 'Where fuel and air actually burn.',
    how: 'Direct injectors spray fuel at up to 350 bar right into the chamber, then the spark plug fires a few degrees before the piston reaches the top. The flame front spreads through the chamber in a couple of milliseconds.',
  },

  gearbox: {
    name: 'Transmission',
    system: 'drivetrain',
    summary: 'Multiplies engine torque and keeps the engine in its sweet spot.',
    how: 'An engine only makes useful power within a band of rpm, so the gearbox swaps between ratios. Low gears multiply torque for acceleration; high gears let the engine turn slowly at cruising speed. Automatics use planetary gearsets and a torque converter; dual-clutch boxes pre-select the next gear on a second clutch for near-instant shifts.',
  },
  driveshaft: {
    name: 'Prop shaft',
    system: 'drivetrain',
    summary: 'Carries torque along the car to the rear axle.',
    how: 'A long tube with universal or constant-velocity joints at each end, so it can keep spinning smoothly while the suspension moves. It spins faster than the wheels — the final drive in the differential reduces speed and multiplies torque by another ~3×.',
  },
  frontDiff: {
    name: 'Front differential',
    system: 'drivetrain',
    summary: 'Splits power between the two front wheels.',
    how: 'In a corner the outer wheel travels further than the inner one. Spider gears inside the differential let the two wheels turn at different speeds while still both being driven.',
  },
  rearDiff: {
    name: 'Rear differential',
    system: 'drivetrain',
    summary: 'Turns the drive 90° and splits it between the rear wheels.',
    how: 'A small pinion gear from the prop shaft drives a large crown (ring) gear, turning the drive sideways and reducing speed. An open diff lets wheels spin at different speeds; performance cars use limited-slip or electronically locked diffs so power is not wasted on a spinning wheel.',
  },
  transferCase: {
    name: 'Centre diff / transfer case',
    system: 'drivetrain',
    summary: 'Divides power between the front and rear axles.',
    how: 'All-wheel-drive cars need a way for front and rear axles to rotate at slightly different speeds. Audi\'s longitudinal quattro uses a mechanical self-locking centre differential; BMW xDrive and modern 4MATIC+ use an electronically controlled multi-plate clutch that varies the split in milliseconds.',
  },
  halfShafts: {
    name: 'Drive shafts (half shafts)',
    system: 'drivetrain',
    summary: 'Link the differential to each wheel hub.',
    how: 'Constant-velocity (CV) joints at each end let the shaft deliver smooth torque while the wheel moves up and down and — at the front — steers through large angles.',
  },
  hybridMotor: {
    name: 'Rear-axle e-motor',
    system: 'electric',
    summary: 'An electric motor that adds instant torque to the rear wheels.',
    how: 'In this plug-in performance hybrid the motor sits on the rear axle with its own two-speed gearbox and electronic limited-slip differential. It boosts acceleration, recovers energy under braking and can drive the car silently on electric power alone.',
  },

  radiator: {
    name: 'Radiator',
    system: 'cooling',
    summary: 'Dumps engine heat into the air.',
    how: 'Only about a third of the fuel\'s energy becomes motion; much of the rest is heat. Coolant pumped through the engine absorbs it and flows through the radiator\'s thin aluminium fins, where the passing air carries the heat away. A thermostat keeps the engine at ~90 °C.',
  },
  fan: {
    name: 'Cooling fan',
    system: 'cooling',
    summary: 'Pulls air through the radiator when the car is slow or stopped.',
    how: 'At speed, ram air does the work; in traffic an electric fan (up to ~850 W in big engines) switches on based on coolant temperature.',
  },
  intercooler: {
    name: 'Intercooler',
    system: 'cooling',
    summary: 'Cools the compressed air coming from the turbo.',
    how: 'Compressing air heats it — to over 150 °C. Cooler air is denser and less prone to knocking, so the intercooler (air-to-air or water-to-air) can add significant power simply by dropping intake temperature.',
  },
  batteryCooling: {
    name: 'Thermal management',
    system: 'cooling',
    summary: 'Keeps the battery and motors at their ideal temperature.',
    how: 'EV batteries are happiest at 20–40 °C. A coolant loop with a heat pump warms the pack in winter (so it can fast-charge) and chills it during hard driving or charging.',
  },

  exhaustManifold: {
    name: 'Exhaust manifold',
    system: 'exhaust',
    summary: 'Collects hot exhaust gas from each cylinder.',
    how: 'Gas leaving the cylinder can be 900 °C. The manifold merges each cylinder\'s exhaust pulse; in turbocharged engines it feeds directly into the turbine housing.',
  },
  catalyst: {
    name: 'Catalytic converter & particulate filter',
    system: 'exhaust',
    summary: 'Cleans the exhaust gas chemically.',
    how: 'A ceramic honeycomb coated with platinum, palladium and rhodium converts carbon monoxide, unburned fuel and nitrogen oxides into CO₂, water and nitrogen. Modern petrol cars also have a particulate filter that traps soot.',
  },
  muffler: {
    name: 'Silencer (muffler)',
    system: 'exhaust',
    summary: 'Quietens the exhaust note.',
    how: 'Chambers, perforated tubes and sound-absorbing packing cancel and soak up pressure waves. Many performance cars have electronic flaps that open a straight-through path in Sport mode for a louder sound.',
  },
  tailpipes: {
    name: 'Tailpipes',
    system: 'exhaust',
    summary: 'Where the exhaust gas exits the car.',
    how: 'Watch the X-ray view: the faster the engine spins, the faster the exhaust flow. Tailpipe layout is often a brand signature — think the quad pipes of a BMW M car or AMG.',
  },

  fuelTank: {
    name: 'Fuel tank',
    system: 'fuel',
    summary: 'Stores the petrol, usually under the rear seats.',
    how: 'Placing the tank ahead of the rear axle protects it in crashes and keeps weight central. An in-tank pump sends fuel to a high-pressure pump on the engine, which feeds the direct injectors.',
  },

  battery12v: {
    name: '12 V battery',
    system: 'electric',
    summary: 'Powers the starter and electronics.',
    how: 'BMW and Mercedes often put the 12 V battery in the boot to improve weight distribution. Many recent cars also have a 48 V mild-hybrid system that runs a starter-generator.',
  },
  hvBattery: {
    name: 'High-voltage battery',
    system: 'electric',
    summary: 'The EV\'s "fuel tank" — thousands of lithium-ion cells in the floor.',
    how: 'Cells are grouped into modules and wired in series to reach 400 or 800 volts. The pack sits flat between the axles, giving a very low centre of gravity, and doubles as a stiff structural floor. A battery management system watches every cell\'s voltage and temperature.',
  },
  motorFront: {
    name: 'Front electric motor',
    system: 'electric',
    summary: 'Drives the front wheels in dual-motor EVs.',
    how: 'Three-phase alternating current from the inverter creates a rotating magnetic field in the stator; the rotor chases that field and spins. Full torque is available from 0 rpm, which is why EVs launch so hard. Under braking the motor works as a generator and recharges the battery.',
  },
  motorRear: {
    name: 'Rear electric motor',
    system: 'electric',
    summary: 'The primary drive motor at the rear axle.',
    how: 'Motor, single-speed reduction gear and differential are packaged as one "e-axle". Motors spin up to ~16,000–20,000 rpm and the gear reduces this ~9:1 for the wheels.',
  },
  inverter: {
    name: 'Inverter / power electronics',
    system: 'electric',
    summary: 'Converts battery DC into three-phase AC for the motor.',
    how: 'Silicon-carbide transistors switch thousands of times per second to synthesise the alternating current that drives the motor. Changing frequency changes motor speed; changing current changes torque.',
  },
  chargePort: {
    name: 'Charge port & on-board charger',
    system: 'electric',
    summary: 'Where you plug in.',
    how: 'AC charging passes through the on-board charger that converts it to DC. DC fast charging bypasses it and feeds the battery directly — at 800 V that can add hundreds of kilometres of range in about 20 minutes.',
  },

  wheels: {
    name: 'Wheels & tyres',
    system: 'chassis',
    summary: 'The only part of the car that touches the road.',
    how: 'Each tyre\'s contact patch is roughly the size of your hand. Everything — accelerating, braking, cornering — happens through those four patches, so tyre compound and size have a huge effect on performance.',
  },
  brakes: {
    name: 'Brakes',
    system: 'chassis',
    summary: 'Discs and calipers that turn speed into heat.',
    how: 'Pressing the pedal pushes hydraulic fluid to the calipers, whose pistons squeeze pads onto the spinning disc. Friction converts the car\'s kinetic energy into heat — discs can glow at over 700 °C on a track. Performance cars use multi-piston calipers and optional carbon-ceramic discs.',
  },
  springs: {
    name: 'Springs',
    system: 'chassis',
    summary: 'Hold the car up and absorb bumps.',
    how: 'Coil springs (or air springs) carry the car\'s weight and compress when the wheel hits a bump, so the body does not have to move as much. Stiffer springs reduce body roll; softer ones improve comfort.',
  },
  dampers: {
    name: 'Dampers (shock absorbers)',
    system: 'chassis',
    summary: 'Stop the springs from bouncing.',
    how: 'A piston moves through oil inside the damper, forcing it through small valves. That resistance soaks up the spring\'s energy. Adaptive dampers change their valving electronically in milliseconds.',
  },
  controlArms: {
    name: 'Control arms & subframe',
    system: 'chassis',
    summary: 'Locate each wheel and let it move up and down.',
    how: 'Arms pivot on rubber bushes mounted to the subframe, guiding the wheel through a controlled arc. Their geometry sets camber, toe and how the car behaves under braking and cornering.',
  },
  steeringRack: {
    name: 'Steering rack',
    system: 'chassis',
    summary: 'Turns your steering into wheel movement.',
    how: 'A pinion gear on the end of the steering column moves a toothed rack sideways, which pushes and pulls the tie rods attached to the wheels. Electric power steering adds assistance with a motor on the rack.',
  },

  seats: {
    name: 'Seats',
    system: 'interior',
    summary: 'Where you sit — and part of the safety system.',
    how: 'Seat frames are crash-tested structures; the seatbelt pretensioners and side airbags are mounted to them. Their position defines the "H-point", around which the whole interior and visibility are designed.',
  },
  steeringWheel: {
    name: 'Steering wheel & column',
    system: 'interior',
    summary: 'Your main control input, plus the driver airbag.',
    how: 'The column is designed to collapse in a frontal crash. The wheel holds the airbag, paddle shifters and controls for driver assistance systems.',
  },
  dashboard: {
    name: 'Dashboard & cross-car beam',
    system: 'interior',
    summary: 'Screens, vents, airbags — and a hidden structural beam.',
    how: 'Behind the trim, a steel or magnesium cross-car beam runs between the A-pillars. It holds the steering column, HVAC unit and airbags and stiffens the body.',
  },
} satisfies Record<string, PartInfo>;

const fmt = (n: number) => n.toLocaleString('en-US');

/** Context-specific spec rows for a part on a given car. */
export function partSpecs(id: PartId, g: Generation, brand: Brand): [string, string][] {
  const e = g.engine;
  const cyl = cylinderCount(e.layout);
  switch (id) {
    case 'body':
      return [
        ['Body style', g.body],
        ['Length × width', `${fmt(g.dims.length)} × ${fmt(g.dims.width)} mm`],
        ['Height', `${fmt(g.dims.height)} mm`],
        ['Wheelbase', `${fmt(g.dims.wheelbase)} mm`],
        ['Kerb weight', `${fmt(g.weight)} kg`],
      ];
    case 'engineBlock':
      return [
        ['Code', e.code ?? '—'],
        ['Layout', layoutName(e.layout)],
        ['Displacement', `${fmt(Math.round(e.displacement * 1000))} cc`],
        ['Power', `${e.hp} PS (${Math.round(e.hp * 0.7355)} kW)`],
        ['Torque', `${e.torque} Nm`],
        ['Redline', `${fmt(e.redline)} rpm`],
      ];
    case 'pistons':
      return [
        ['Cylinders', `${cyl}`],
        ['Per-cylinder', `${Math.round((e.displacement * 1000) / cyl)} cc`],
        ['Power per litre', `${Math.round(e.hp / e.displacement)} PS/L`],
      ];
    case 'crankshaft':
      return [
        ['Firing order', firingOrderLabel(e.layout, brand.id)],
        ['Power strokes / rev', `${cyl / 2}`],
      ];
    case 'turbo':
      return [
        ['Induction', e.induction],
        ['Placement', e.induction === 'supercharged' ? 'In the V, belt-driven from the crank' : e.hotV ? 'Hot-V (inside the V)' : 'Exhaust side'],
      ];
    case 'gearbox':
      return [
        ['Type', transmissionName(g)],
        ['Gears', `${g.gears}`],
      ];
    case 'hvBattery':
      return [
        ['Capacity', `${e.batteryKWh ?? '—'} kWh`],
        ['Voltage', g.id === 'f8' ? '800 V' : '400 V'],
      ];
    case 'motorFront':
    case 'motorRear':
      return [
        ['Combined power', `${e.hp} PS (${Math.round(e.hp * 0.7355)} kW)`],
        ['Combined torque', `${e.torque} Nm`],
        ['Max motor speed', `${fmt(e.redline)} rpm`],
      ];
    case 'wheels':
      return [['Rim size', `${g.rimInches}"`]];
    case 'fuelTank':
      return [['Typical capacity', `${g.body === 'suv' || g.body === 'offroad' ? '80–100' : g.body === 'hatch' ? '50–55' : '60–80'} L`]];
    case 'transferCase': {
      const a = awdCopy(g);
      return [
        ['System', g.drivetrainName ?? 'AWD'],
        ['Hardware', a.hardware],
        ['Where', a.where],
        ['Front : rear', g.awd?.split ?? a.split],
      ];
    }
    default:
      return [];
  }
}

export function cylinderCount(layout: string): number {
  return { I4: 4, I5: 5, I6: 6, V6: 6, V8: 8, V10: 10, V12: 12, EV: 0 }[layout] ?? 4;
}

export function layoutName(layout: string): string {
  return (
    {
      I4: 'Inline-4',
      I5: 'Inline-5',
      I6: 'Inline-6 (straight-six)',
      V6: 'V6',
      V8: 'V8',
      V10: 'V10',
      V12: 'V12',
      EV: 'Electric',
    }[layout] ?? layout
  );
}

export function transmissionName(g: Generation): string {
  return {
    manual: `${g.gears}-speed manual`,
    automatic: `${g.gears}-speed automatic`,
    dct: `${g.gears}-speed dual-clutch`,
    'single-speed': g.gears > 1 ? `${g.gears}-speed (rear) reduction gear` : 'Single-speed reduction gear',
  }[g.transmission];
}

export function firingOrderLabel(layout: string, brandId?: string): string {
  // Mercedes numbers cylinders bank by bank (1–4 right, 5–8 left), so the same V8 sequence reads differently
  if (brandId === 'mercedes' && layout === 'V8') return '1-5-4-2-6-3-7-8';
  if (brandId === 'mercedes' && layout === 'V12') return '—';
  return (
    {
      I4: '1-3-4-2',
      I5: '1-2-4-5-3',
      I6: '1-5-3-6-2-4',
      V6: '1-4-3-6-2-5',
      V8: '1-5-4-8-6-3-7-2',
      V10: '1-6-5-10-2-7-3-8-4-9',
      V12: '1-12-5-8-3-10-6-7-2-11-4-9',
    }[layout] ?? '—'
  );
}

/** A guided walkthrough of how the car makes and delivers power. */
export function tourSteps(g: Generation, brandId?: string): { part: PartId; title: string; text: string }[] {
  if (g.engine.layout === 'EV') {
    const steps: { part: PartId; title: string; text: string }[] = [
      { part: 'chargePort', title: 'Plug in', text: 'Energy enters through the charge port and is stored in the battery.' },
      { part: 'hvBattery', title: 'Store', text: `A ${g.engine.batteryKWh} kWh pack of lithium-ion cells lives flat in the floor, giving a very low centre of gravity.` },
      { part: 'inverter', title: 'Convert', text: 'The inverter turns the battery\'s DC into three-phase AC at whatever frequency the motor needs.' },
      { part: 'motorRear', title: 'Spin', text: 'The rotating magnetic field turns the motor — full torque from 0 rpm. Watch the green energy flow in X-ray.' },
    ];
    if (g.engine.motors?.front)
      steps.push({ part: 'motorFront', title: 'Second motor', text: 'A front motor adds all-wheel drive and can decouple at cruise to save energy.' });
    steps.push(
      { part: 'halfShafts', title: 'Deliver', text: 'A single reduction gear and differential send torque through the drive shafts to the wheels.' },
      { part: 'brakes', title: 'Recover', text: 'Lift off and the motors become generators, recharging the battery. The friction brakes handle the rest.' },
    );
    return steps;
  }
  const steps: { part: PartId; title: string; text: string }[] = [
    { part: 'airFilter', title: 'Breathe in', text: 'Air enters through the grille and is cleaned by the air filter.' },
  ];
  if (g.engine.induction === 'turbo' || g.engine.induction === 'twin-turbo')
    steps.push({ part: 'turbo', title: 'Boost', text: 'Exhaust-driven turbos compress the air so more of it fits in each cylinder.' });
  if (g.engine.induction === 'supercharged')
    steps.push({ part: 'supercharger', title: 'Boost', text: 'A crank-driven supercharger pumps extra air into the engine with instant response.' });
  steps.push(
    { part: 'intake', title: 'Distribute', text: 'The intake manifold feeds air to each cylinder\'s intake valves.' },
    { part: 'pistons', title: 'Bang', text: 'Fuel is injected, the spark fires and the expanding gas forces each piston down. Watch the orange flashes — that\'s the power stroke.' },
    { part: 'crankshaft', title: 'Rotate', text: `The crankshaft turns the up-and-down motion into rotation.${firingOrderLabel(g.engine.layout, brandId) !== '—' ? ` Firing order: ${firingOrderLabel(g.engine.layout, brandId)}.` : ''}` },
    { part: 'gearbox', title: 'Multiply', text: `The ${transmissionName(g)} picks the right ratio for the speed you want.` },
  );
  if (g.drivetrain === 'AWD') steps.push({ part: 'transferCase', title: 'Split', text: `${g.drivetrainName ?? 'AWD'} divides torque between the front and rear axles.` });
  if (g.position !== 'front-transverse' && g.position !== 'mid')
    steps.push({ part: 'driveshaft', title: 'Transfer', text: 'The prop shaft carries torque down the centre tunnel to the rear axle.' });
  steps.push(
    { part: g.drivetrain === 'FWD' ? 'frontDiff' : 'rearDiff', title: 'Turn the corner', text: 'The differential lets the left and right wheels turn at different speeds in a bend.' },
    { part: 'wheels', title: 'Grip', text: 'Torque reaches the tyres, and the car moves.' },
    { part: 'exhaustManifold', title: 'Breathe out', text: 'Spent gases leave through the exhaust manifold…' },
    { part: 'catalyst', title: 'Clean', text: '…are cleaned in the catalytic converter…' },
    { part: 'tailpipes', title: 'Exit', text: '…and exit through the silencers and tailpipes.' },
  );
  return steps;
}

/**
 * What the AWD hardware on this exact car is, where it sits and how it splits torque.
 * Sources: Audi technology portal (quattro, quattro ultra, R8), BMW and Mercedes press material.
 */
export function awdCopy(g: Generation): { name: string; summary: string; how: string; hardware: string; where: string; split: string } {
  switch (g.awd?.kind) {
    case 'torsen':
      return {
        name: 'Torsen centre differential',
        summary: 'A purely mechanical, self-locking diff that splits torque between the axles.',
        how: `Worm gears inside the Torsen diff let the front and rear axles turn at different speeds through bends, but resist slip: when one axle loses grip, internal friction pushes more torque to the axle that still has it — no sensors, no electronics. At rest it splits ${g.awd.split ?? '50:50'} front to rear.`,
        hardware: 'Torsen worm-gear differential',
        where: 'Rear of the gearbox',
        split: '50:50',
      };
    case 'crown-gear':
      return {
        name: 'Crown-gear centre differential',
        summary: 'Audi’s self-locking centre diff: mechanical, and lighter than the Torsen it replaced.',
        how: `Two crown gears are driven by four spinning pinions; clutch packs behind them lock the diff progressively when one axle slips. Normally ${g.awd.split ?? '40:60'} front to rear, it can send up to 70 % to the front or 85 % to the rear, entirely mechanically.`,
        hardware: 'Crown-gear self-locking differential',
        where: 'Rear of the gearbox',
        split: '40:60',
      };
    case 'ultra':
      return {
        name: 'quattro ultra clutch',
        summary: 'All-wheel drive that switches itself off: front-wheel drive until the rear is needed.',
        how: 'There is no centre differential. A multi-plate clutch at the gearbox output, driven by an electric motor, connects the prop shaft to the rear axle; a dog clutch in the rear diff disconnects the rear half-shafts too, so the whole rear drivetrain stops turning when cruising. Sensors predict slip (steering angle, throttle, lateral acceleration) and re-engage the rear axle in a fraction of a second, before the wheels spin.',
        hardware: 'Multi-plate clutch + rear dog clutch',
        where: 'Gearbox output / rear differential',
        split: 'Front-biased, up to 100 % front',
      };
    case 'haldex':
      return {
        name: 'Haldex coupling',
        summary: 'An electro-hydraulic clutch at the rear axle that brings in rear drive on demand.',
        how: 'With a transverse engine, the gearbox drives the front wheels directly; a power take-off unit (PTU) beside it turns a prop shaft to the back. Just ahead of the rear diff, a multi-plate Haldex coupling clamps its plates with oil pressure to send torque rearwards — almost nothing when cruising, up to about half when the fronts slip or you accelerate hard.',
        hardware: 'Multi-plate coupling (electro-hydraulic)',
        where: 'In front of the rear differential',
        split: 'Front-biased, variable',
      };
    case 'torque-splitter':
      return {
        name: 'RS torque splitter',
        summary: 'Two clutches instead of a rear differential, one per rear wheel.',
        how: 'Each rear half-shaft has its own electronically controlled multi-plate clutch. Sending more torque to the outside rear wheel in a bend actively turns the car (torque vectoring); with all torque to one side it can even drift. Up to 50 % goes rearwards, and all of that can go to a single wheel.',
        hardware: 'Two multi-plate clutches',
        where: 'Rear axle (replaces the rear diff)',
        split: 'Up to 50 % rear, per-wheel',
      };
    case 'xdrive':
      return {
        name: 'xDrive transfer case',
        summary: 'A multi-plate clutch that decides how much torque goes to the front axle.',
        how: 'The rear axle is always driven. Behind the gearbox, an electronically controlled multi-plate clutch feeds a chain or gear drive to a front prop shaft, which runs beside the engine sump to the front diff. The DSC computer varies the clamp force continuously, rear-biased by default and shifting forward when the rears slip.' + (g.id === 'g80' || g.id === 'f90' ? ' M xDrive adds 4WD Sport and a 2WD mode that opens the clutch completely for pure rear drive.' : ''),
        hardware: 'Electronically controlled multi-plate clutch',
        where: 'Behind the gearbox, front shaft offset to one side',
        split: 'Variable, rear-biased',
      };
    case 'planetary':
      return {
        name: 'Planetary centre differential',
        summary: `An open planetary-gear diff with a fixed ${g.awd.split} front-to-rear split.`,
        how: `A planetary gearset sizes the torque split: the planet carrier drives the sun gear (front) and ring gear (rear) in a fixed ${g.awd.split} ratio, while still letting the axles turn at different speeds. Because it is open, traction control brakes a slipping wheel to push torque to the others.`,
        hardware: 'Open planetary differential',
        where: 'Transfer case behind the gearbox',
        split: g.awd.split ?? '—',
      };
    case 'clutch-variable':
      return {
        name: '4MATIC+ clutch',
        summary: 'A fully variable multi-plate clutch that sends between 0 and 50 % to the front.',
        how: 'The rear axle is driven permanently; an electromechanically controlled multi-plate clutch varies front-axle torque continuously from zero to half, based on slip, steering and throttle. Drift mode opens it completely for rear-wheel drive.',
        hardware: 'Electromechanical multi-plate clutch',
        where: 'Transfer case behind the gearbox',
        split: 'Variable, 0–50 % front',
      };
    case 'viscous-front':
      return {
        name: 'Viscous coupling',
        summary: 'A silicone-filled coupling that sends torque to the front wheels when the rears slip.',
        how: 'Mid-engined, so the rear axle is driven directly. A prop shaft runs forward from the engine to the front axle, where a viscous coupling sits: thin plates in thick silicone fluid. When the rear wheels spin faster than the fronts, the fluid shears, heats and stiffens, dragging the front axle along. Normal driving stays strongly rear-biased.',
        hardware: 'Viscous coupling',
        where: 'Front-axle drive, ahead of the cabin',
        split: 'Rear-biased, front on demand',
      };
    case 'clutch-front':
      return {
        name: 'Front-axle clutch',
        summary: 'An electro-hydraulic multi-plate clutch at the front axle, with no fixed base split.',
        how: 'A prop shaft runs forward from the mid-mounted engine to the front axle. There, a water-cooled multi-plate clutch controlled by the quattro computer decides how much torque reaches the front wheels — anything from none to, in theory, all of it — based on grip, steering and driving mode.',
        hardware: 'Electro-hydraulic multi-plate clutch',
        where: 'Front axle, with the front diff',
        split: 'Fully variable',
      };
    case 'g-locks':
      return {
        name: 'Transfer case & locking diffs',
        summary: `Permanent all-wheel drive with a ${g.awd.split} centre diff, low range and three diff locks.`,
        how: `The transfer case behind the gearbox splits torque ${g.awd.split} front to rear and has a low-range reduction for crawling. For serious terrain the centre, rear and front differentials can each be locked solid in that order, so every wheel turns at the same speed no matter how little grip it has.`,
        hardware: 'Centre diff + low range, 3 locking diffs',
        where: 'Transfer case behind the gearbox',
        split: g.awd.split ?? '—',
      };
    case 'dual-motor':
      return {
        name: 'Dual-motor drive',
        summary: 'One electric motor per axle — no prop shaft or centre differential at all.',
        how: 'Each axle has its own motor and reduction gear. The computer decides front/rear torque by simply commanding each motor, hundreds of times a second, and can run on the rear motor alone for efficiency.',
        hardware: 'Motor on each axle',
        where: 'Front and rear axles',
        split: 'Fully variable',
      };
    default:
      return {
        name: PARTS.transferCase.name,
        summary: PARTS.transferCase.summary,
        how: PARTS.transferCase.how,
        hardware: '—',
        where: 'Behind the gearbox',
        split: 'Variable',
      };
  }
}

/** Part name/summary/explanation, specialised to this car where the generic text would be wrong. */
export function partCopy(id: PartId, g: Generation): { name: string; summary: string; how: string } {
  if (id === 'transferCase' && g.awd) {
    const a = awdCopy(g);
    return { name: a.name, summary: a.summary, how: a.how };
  }
  if (id === 'rearDiff' && g.awd?.kind === 'ultra')
    return { ...PARTS.rearDiff, how: PARTS.rearDiff.how + ' On quattro ultra a dog clutch inside it disconnects the half-shafts when the rear axle isn’t needed.' };
  if (id === 'frontDiff' && g.position === 'front-longitudinal' && g.awd && ['torsen', 'crown-gear', 'ultra'].includes(g.awd.kind))
    return { ...PARTS.frontDiff, how: PARTS.frontDiff.how + ' On Audi’s longitudinal quattro the front diff is built into the gearbox casing, with the engine hanging ahead of the front axle.' };
  const p = PARTS[id];
  return { name: p.name, summary: p.summary, how: p.how };
}

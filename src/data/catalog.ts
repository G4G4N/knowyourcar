import type { Brand, Generation } from './types';

// Figures are representative for the listed variant (EU/US spec varies by market and model year).

type G = Omit<Generation, 'id'> & { id?: string };
const gen = (g: G): Generation => ({ id: g.id ?? g.code.toLowerCase(), ...g });

export const BRANDS: Brand[] = [
  {
    id: 'audi',
    name: 'Audi',
    hq: 'Ingolstadt',
    founded: 1909,
    tagline: 'Vorsprung durch Technik',
    accent: '#e4002b',
    models: [
      {
        id: 'a3',
        name: 'A3',
        segment: 'Premium compact',
        generations: [
          gen({
            code: '8P', variant: 'A3 2.0 TFSI', years: '2003–2012', body: 'hatch',
            dims: { length: 4214, width: 1765, height: 1421, wheelbase: 2578 },
            engine: { layout: 'I4', displacement: 2.0, code: 'EA113', induction: 'turbo', hp: 200, torque: 280, redline: 6500 },
            position: 'front-transverse', drivetrain: 'FWD', transmission: 'dct', gears: 6,
            zeroTo100: 7.3, topSpeed: 237, weight: 1340, rimInches: 17, paint: '#b9bcc0', paintName: 'Ice Silver',
            facts: [
              'Shared the VW Group PQ35 platform with the Mk5 Golf GTI.',
              'One of the first cars offered with the 6-speed S tronic (DSG) dual-clutch gearbox.',
            ],
          }),
          gen({
            code: '8V', variant: 'A3 Sedan 40 TFSI', years: '2012–2020', body: 'sedan',
            dims: { length: 4458, width: 1796, height: 1416, wheelbase: 2637 },
            engine: { layout: 'I4', displacement: 2.0, code: 'EA888 Gen3', induction: 'turbo', hp: 190, torque: 320, redline: 6500 },
            position: 'front-transverse', drivetrain: 'AWD', drivetrainName: 'quattro (Haldex coupling)', awd: { kind: 'haldex' }, transmission: 'dct', gears: 7,
            zeroTo100: 6.2, topSpeed: 246, weight: 1450, rimInches: 18, paint: '#1d2a44', paintName: 'Navarra Blue',
            facts: [
              'Moved to the modular MQB platform, which made it ~80 kg lighter than its predecessor.',
              'Transverse quattro uses an electro-hydraulic multi-plate clutch at the rear axle, not a centre differential.',
            ],
          }),
          gen({
            code: '8Y', variant: 'RS 3 Sedan', years: '2021–present', body: 'sedan',
            dims: { length: 4542, width: 1851, height: 1412, wheelbase: 2631 },
            engine: { layout: 'I5', displacement: 2.5, code: 'DNWA 2.5 TFSI', induction: 'turbo', hp: 400, torque: 500, redline: 7000 },
            position: 'front-transverse', drivetrain: 'AWD', drivetrainName: 'quattro with RS torque splitter', awd: { kind: 'torque-splitter' }, transmission: 'dct', gears: 7,
            zeroTo100: 3.8, topSpeed: 290, weight: 1575, rimInches: 19, paint: '#5b8f3a', paintName: 'Kyalami Green',
            facts: [
              'The 2.5 TFSI five-cylinder fires 1-2-4-5-3, giving the warbling sound Audi made famous in rally.',
              'The RS torque splitter uses two clutches on the rear axle to send up to 100% of rear torque to one wheel.',
              'Won "International Engine of the Year" in its class nine years in a row.',
            ],
          }),
        ],
      },
      {
        id: 'a4',
        name: 'A4',
        segment: 'Executive',
        generations: [
          gen({
            code: 'B7', variant: 'A4 2.0T quattro', years: '2004–2008', body: 'sedan',
            dims: { length: 4586, width: 1772, height: 1427, wheelbase: 2648 },
            engine: { layout: 'I4', displacement: 2.0, code: 'EA113 TFSI', induction: 'turbo', hp: 200, torque: 280, redline: 6500 },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: 'quattro (Torsen T-2 centre diff)', awd: { kind: 'torsen', split: '50:50' }, transmission: 'manual', gears: 6,
            zeroTo100: 7.2, topSpeed: 236, weight: 1530, rimInches: 17, paint: '#2a2c30', paintName: 'Brilliant Black',
            facts: [
              'Introduced Audi\'s big "singleframe" grille to the A4 range.',
              'The Torsen centre differential splits torque 50:50 and shuffles it mechanically when a wheel slips.',
            ],
          }),
          gen({
            code: 'B8', variant: 'A4 2.0 TFSI quattro', years: '2008–2015', body: 'sedan',
            dims: { length: 4703, width: 1826, height: 1427, wheelbase: 2808 },
            engine: { layout: 'I4', displacement: 2.0, code: 'EA888 Gen2', induction: 'turbo', hp: 211, torque: 350, redline: 6500 },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: 'quattro (self-locking centre diff)', awd: { kind: 'torsen', split: '40:60' }, transmission: 'automatic', gears: 8,
            zeroTo100: 6.6, topSpeed: 240, weight: 1580, rimInches: 18, paint: '#7a7f86', paintName: 'Monsoon Grey',
            facts: [
              'Audi moved the front differential ahead of the clutch on MLB, letting the front axle sit 154 mm further forward.',
              'Base torque split of the asymmetric quattro centre diff is 40:60 front-to-rear.',
            ],
          }),
          gen({
            code: 'B9', id: 'b9-rs4', variant: 'RS 4 Avant', years: '2017–present', body: 'wagon',
            dims: { length: 4781, width: 1866, height: 1404, wheelbase: 2826 },
            engine: { layout: 'V6', displacement: 2.9, code: 'EA839 2.9 TFSI', induction: 'twin-turbo', hotV: true, hp: 450, torque: 600, redline: 6800 },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: 'quattro (crown-gear centre diff) + sport differential', awd: { kind: 'crown-gear', split: '40:60' }, transmission: 'automatic', gears: 8,
            zeroTo100: 4.1, topSpeed: 280, weight: 1790, rimInches: 20, paint: '#8a8d8f', paintName: 'Nardo Grey',
            facts: [
              'RS 4 has always been an Avant (wagon) — a tradition that started with the 1999 B5 RS 4.',
              'Its twin turbos live inside the 90° V of the engine ("hot-V") for short exhaust paths and quick spool.',
              'Co-developed with Porsche; the same 2.9 V6 sits in the Panamera 4S.',
            ],
          }),
        ],
      },
      {
        id: 'a6',
        name: 'A6',
        segment: 'Executive',
        generations: [
          gen({
            code: 'C7', variant: 'A6 3.0 TFSI quattro', years: '2011–2018', body: 'sedan',
            dims: { length: 4915, width: 1874, height: 1455, wheelbase: 2912 },
            engine: { layout: 'V6', displacement: 3.0, code: 'CREC 3.0 TFSI', induction: 'supercharged', hp: 333, torque: 440, redline: 6800 },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: 'quattro (crown-gear centre diff)', awd: { kind: 'crown-gear', split: '40:60' }, transmission: 'dct', gears: 7,
            zeroTo100: 5.1, topSpeed: 250, weight: 1770, rimInches: 19, paint: '#2f3236', paintName: 'Daytona Grey',
            facts: [
              'Despite the "TFSI" badge, this 3.0 V6 uses a Roots-type supercharger sitting in the V of the engine.',
              'About 20% of the body was aluminium, cutting weight by ~15 kg vs a steel shell.',
            ],
          }),
          gen({
            code: 'C8', variant: 'A6 55 TFSI quattro', years: '2018–present', body: 'sedan',
            dims: { length: 4939, width: 1886, height: 1457, wheelbase: 2924 },
            engine: { layout: 'V6', displacement: 3.0, code: 'EA839 3.0 TFSI', induction: 'turbo', hotV: true, hp: 340, torque: 500, redline: 6500 },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: 'quattro ultra', awd: { kind: 'ultra' }, transmission: 'dct', gears: 7,
            zeroTo100: 5.1, topSpeed: 250, weight: 1825, rimInches: 20, paint: '#e8e8e6', paintName: 'Glacier White',
            facts: [
              'Standard 48-volt mild-hybrid system lets the engine coast with the engine off between 55 and 160 km/h.',
              'Single twin-scroll turbo is mounted in the V of the engine.',
            ],
          }),
        ],
      },
      {
        id: 'q5',
        name: 'Q5',
        segment: 'Mid-size SUV',
        generations: [
          gen({
            code: '8R', variant: 'Q5 2.0 TFSI quattro', years: '2008–2017', body: 'suv',
            dims: { length: 4629, width: 1880, height: 1653, wheelbase: 2807 },
            engine: { layout: 'I4', displacement: 2.0, code: 'EA888', induction: 'turbo', hp: 225, torque: 350, redline: 6500 },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: 'quattro (Torsen centre diff)', awd: { kind: 'torsen', split: '40:60' }, transmission: 'automatic', gears: 8,
            zeroTo100: 7.1, topSpeed: 222, weight: 1810, rimInches: 19, paint: '#3a4a3c', paintName: 'Lava Grey',
            facts: [
              'Built on the MLB platform shared with the B8 A4.',
              'One of Audi\'s best-selling models ever, with over 1.6 million built in the first generation.',
            ],
          }),
          gen({
            code: 'FY', variant: 'SQ5 3.0 TFSI', years: '2017–2024', body: 'suv',
            dims: { length: 4671, width: 1893, height: 1635, wheelbase: 2824 },
            engine: { layout: 'V6', displacement: 3.0, code: 'EA839', induction: 'turbo', hotV: true, hp: 354, torque: 500, redline: 6500 },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: 'quattro (self-locking centre diff)', awd: { kind: 'crown-gear', split: '40:60' }, transmission: 'automatic', gears: 8,
            zeroTo100: 5.4, topSpeed: 250, weight: 1945, rimInches: 21, paint: '#a3262a', paintName: 'Tango Red',
            facts: [
              'Uses a single twin-scroll turbo inside the V; the twin-scroll design keeps exhaust pulses separated for faster response.',
              'Optional adaptive air suspension can raise the body by up to 45 mm.',
            ],
          }),
        ],
      },
      {
        id: 'r8',
        name: 'R8',
        segment: 'Supercar',
        generations: [
          gen({
            code: 'Type 42', id: 'type42', variant: 'R8 V10', years: '2006–2015', body: 'coupe',
            dims: { length: 4431, width: 1904, height: 1252, wheelbase: 2650 },
            engine: { layout: 'V10', displacement: 5.2, code: 'BUJ 5.2 FSI', induction: 'NA', hp: 525, torque: 530, redline: 8700 },
            position: 'mid', drivetrain: 'AWD', drivetrainName: 'quattro (viscous coupling at the front axle)', awd: { kind: 'viscous-front' }, transmission: 'manual', gears: 6,
            zeroTo100: 3.9, topSpeed: 316, weight: 1620, rimInches: 19, paint: '#d6d8da', paintName: 'Suzuka Grey',
            facts: [
              'Shares its aluminium space frame and V10 with the Lamborghini Gallardo.',
              'The open-gate gated manual is now a collector favourite.',
              'Engine is dry-sumped so it can sit lower for a lower centre of gravity.',
            ],
          }),
          gen({
            code: 'Type 4S', id: 'type4s', variant: 'R8 V10 performance', years: '2015–2024', body: 'coupe',
            dims: { length: 4429, width: 1940, height: 1240, wheelbase: 2650 },
            engine: { layout: 'V10', displacement: 5.2, code: 'DKAA 5.2 FSI', induction: 'NA', hp: 620, torque: 580, redline: 8700 },
            position: 'mid', drivetrain: 'AWD', drivetrainName: 'quattro (front-axle multi-plate clutch)', awd: { kind: 'clutch-front' }, transmission: 'dct', gears: 7,
            zeroTo100: 3.1, topSpeed: 331, weight: 1595, rimInches: 20, paint: '#e0b200', paintName: 'Vegas Yellow',
            facts: [
              'One of the last naturally aspirated V10s on sale — it revs to 8,700 rpm.',
              'Cylinder-on-demand can shut down one bank of five cylinders under light load.',
              'About 50% of the parts are shared with the Lamborghini Huracán.',
            ],
          }),
        ],
      },
      {
        id: 'etrongt',
        name: 'e-tron GT',
        segment: 'Electric Gran Turismo',
        generations: [
          gen({
            code: 'F8', variant: 'RS e-tron GT', years: '2021–present', body: 'fastback',
            dims: { length: 4989, width: 1964, height: 1396, wheelbase: 2900 },
            engine: { layout: 'EV', displacement: 0, code: 'PSM ×2', induction: 'electric', hp: 646, torque: 830, redline: 16000, motors: { front: true, rear: true }, batteryKWh: 93.4 },
            position: 'ev', drivetrain: 'AWD', drivetrainName: 'electric quattro (motor per axle)', awd: { kind: 'dual-motor' }, transmission: 'single-speed', gears: 2,
            zeroTo100: 3.3, topSpeed: 250, weight: 2347, rimInches: 21, paint: '#5d6a73', paintName: 'Kemora Grey',
            facts: [
              'Runs an 800-volt architecture, allowing DC fast charging at up to 270 kW.',
              'The rear motor uses a two-speed gearbox: 1st for launch, 2nd for efficiency at speed.',
              'Shares the J1 platform with the Porsche Taycan.',
            ],
          }),
        ],
      },
    ],
  },
  {
    id: 'bmw',
    name: 'BMW',
    hq: 'Munich',
    founded: 1916,
    tagline: 'Freude am Fahren',
    accent: '#1c69d4',
    models: [
      {
        id: '3series',
        name: '3 Series',
        segment: 'Compact executive',
        generations: [
          gen({
            code: 'E46', variant: '330i', years: '1998–2006', body: 'sedan',
            dims: { length: 4471, width: 1739, height: 1415, wheelbase: 2725 },
            engine: { layout: 'I6', displacement: 3.0, code: 'M54B30', induction: 'NA', hp: 231, torque: 300, redline: 6500 },
            position: 'front-longitudinal', drivetrain: 'RWD', transmission: 'manual', gears: 5,
            zeroTo100: 6.5, topSpeed: 250, weight: 1430, rimInches: 17, paint: '#2b3a55', paintName: 'Topaz Blue',
            facts: [
              'Near-perfect 50:50 weight distribution, achieved by mounting the inline-6 behind the front axle line.',
              'The M54 uses double-VANOS variable cam timing on both intake and exhaust cams.',
            ],
          }),
          gen({
            code: 'E90', variant: '335i', years: '2005–2012', body: 'sedan',
            dims: { length: 4520, width: 1817, height: 1421, wheelbase: 2760 },
            engine: { layout: 'I6', displacement: 3.0, code: 'N54B30', induction: 'twin-turbo', hp: 306, torque: 400, redline: 7000 },
            position: 'front-longitudinal', drivetrain: 'RWD', transmission: 'automatic', gears: 6,
            zeroTo100: 5.6, topSpeed: 250, weight: 1600, rimInches: 18, paint: '#1a1a1c', paintName: 'Black Sapphire',
            facts: [
              'The N54 was BMW\'s first turbocharged petrol production engine — two small turbos, each feeding three cylinders.',
              'Famous for being massively underrated from the factory; tuners routinely add 100 hp with software.',
            ],
          }),
          gen({
            code: 'F30', variant: '340i', years: '2011–2019', body: 'sedan',
            dims: { length: 4633, width: 1811, height: 1429, wheelbase: 2810 },
            engine: { layout: 'I6', displacement: 3.0, code: 'B58B30', induction: 'turbo', hp: 326, torque: 450, redline: 7000 },
            position: 'front-longitudinal', drivetrain: 'RWD', transmission: 'automatic', gears: 8,
            zeroTo100: 5.1, topSpeed: 250, weight: 1615, rimInches: 18, paint: '#ffffff', paintName: 'Alpine White',
            facts: [
              'The B58 uses a single twin-scroll turbo and a closed-deck aluminium block.',
              'The ZF 8HP gearbox became the industry benchmark automatic for a decade.',
            ],
          }),
          gen({
            code: 'G20', variant: 'M340i xDrive', years: '2019–present', body: 'sedan',
            dims: { length: 4709, width: 1827, height: 1435, wheelbase: 2851 },
            engine: { layout: 'I6', displacement: 3.0, code: 'B58B30O1', induction: 'turbo', hp: 374, torque: 500, redline: 7000 },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: 'xDrive', awd: { kind: 'xdrive' }, transmission: 'automatic', gears: 8,
            zeroTo100: 4.4, topSpeed: 250, weight: 1745, rimInches: 19, paint: '#1f3b73', paintName: 'Portimao Blue',
            facts: [
              'xDrive uses an electronically controlled multi-plate clutch in the transfer case, rear-biased by default.',
              'Torsional stiffness up 25% over the F30; the body is also 55 kg lighter.',
            ],
          }),
        ],
      },
      {
        id: 'm3',
        name: 'M3',
        segment: 'High-performance',
        generations: [
          gen({
            code: 'E30', variant: 'M3', years: '1986–1991', body: 'coupe',
            dims: { length: 4345, width: 1680, height: 1370, wheelbase: 2562 },
            engine: { layout: 'I4', displacement: 2.3, code: 'S14B23', induction: 'NA', hp: 195, torque: 230, redline: 7250 },
            position: 'front-longitudinal', drivetrain: 'RWD', transmission: 'manual', gears: 5,
            zeroTo100: 6.7, topSpeed: 235, weight: 1200, rimInches: 15, paint: '#c8102e', paintName: 'Henna Red',
            facts: [
              'Created as a homologation special for Group A touring car racing — the most successful touring car ever.',
              'The S14 four-cylinder borrowed its head design from the M1\'s M88 straight-six.',
            ],
          }),
          gen({
            code: 'E46', id: 'e46m3', variant: 'M3', years: '2000–2006', body: 'coupe',
            dims: { length: 4492, width: 1780, height: 1372, wheelbase: 2731 },
            engine: { layout: 'I6', displacement: 3.2, code: 'S54B32', induction: 'NA', hp: 343, torque: 365, redline: 8000 },
            position: 'front-longitudinal', drivetrain: 'RWD', transmission: 'manual', gears: 6,
            zeroTo100: 5.2, topSpeed: 250, weight: 1570, rimInches: 18, paint: '#3a6fa4', paintName: 'Laguna Seca Blue',
            facts: [
              'The S54 makes over 100 hp per litre without turbos, using six individual throttle bodies.',
              'Many fans consider it the purest M3 ever made.',
            ],
          }),
          gen({
            code: 'E92', variant: 'M3', years: '2007–2013', body: 'coupe',
            dims: { length: 4615, width: 1804, height: 1424, wheelbase: 2761 },
            engine: { layout: 'V8', displacement: 4.0, code: 'S65B40', induction: 'NA', hp: 420, torque: 400, redline: 8400 },
            position: 'front-longitudinal', drivetrain: 'RWD', transmission: 'dct', gears: 7,
            zeroTo100: 4.6, topSpeed: 250, weight: 1655, rimInches: 19, paint: '#d9d9d6', paintName: 'Mineral White',
            facts: [
              'The only M3 with a V8 — derived from the E60 M5\'s V10 with two cylinders removed.',
              'The V8 weighs 15 kg less than the E46 M3\'s inline-six.',
              'Carbon-fibre roof lowers the centre of gravity.',
            ],
          }),
          gen({
            code: 'F80', variant: 'M3 Competition', years: '2014–2018', body: 'sedan',
            dims: { length: 4671, width: 1877, height: 1424, wheelbase: 2812 },
            engine: { layout: 'I6', displacement: 3.0, code: 'S55B30', induction: 'twin-turbo', hp: 450, torque: 550, redline: 7600 },
            position: 'front-longitudinal', drivetrain: 'RWD', transmission: 'dct', gears: 7,
            zeroTo100: 4.0, topSpeed: 280, weight: 1585, rimInches: 19, paint: '#e7b10a', paintName: 'Austin Yellow',
            facts: [
              'Back to six cylinders — now with two mono-scroll turbos.',
              'Carbon-fibre prop shaft saves 40% weight over steel.',
            ],
          }),
          gen({
            code: 'G80', variant: 'M3 Competition xDrive', years: '2021–present', body: 'sedan',
            dims: { length: 4794, width: 1903, height: 1433, wheelbase: 2857 },
            engine: { layout: 'I6', displacement: 3.0, code: 'S58B30', induction: 'twin-turbo', hp: 510, torque: 650, redline: 7200 },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: 'M xDrive', awd: { kind: 'xdrive' }, transmission: 'automatic', gears: 8,
            zeroTo100: 3.5, topSpeed: 290, weight: 1780, rimInches: 19, paint: '#3c6e47', paintName: 'Isle of Man Green',
            facts: [
              'M xDrive has a 2WD mode that disconnects the front axle entirely for rear-drive only.',
              'Launched with 510 PS; the 2024 facelift raised the Competition xDrive to 530 PS.',
              'The S58 uses a 3D-printed cylinder head core to route coolant passages impossible to cast traditionally.',
              'Those tall vertical kidney grilles are a nod to the 1930s BMW 328.',
            ],
          }),
        ],
      },
      {
        id: '5series',
        name: '5 Series / M5',
        segment: 'Executive',
        generations: [
          gen({
            code: 'E39', variant: 'M5', years: '1998–2003', body: 'sedan',
            dims: { length: 4784, width: 1800, height: 1437, wheelbase: 2830 },
            engine: { layout: 'V8', displacement: 4.9, code: 'S62B50', induction: 'NA', hp: 400, torque: 500, redline: 7000 },
            position: 'front-longitudinal', drivetrain: 'RWD', transmission: 'manual', gears: 6,
            zeroTo100: 5.3, topSpeed: 250, weight: 1795, rimInches: 18, paint: '#1b2a24', paintName: 'Oxford Green',
            facts: [
              'The first M5 with a V8 — and a hand-built engine with individual throttle bodies.',
              'Often called the best sports sedan of its era.',
            ],
          }),
          gen({
            code: 'G30', variant: '540i', years: '2017–2023', body: 'sedan',
            dims: { length: 4936, width: 1868, height: 1479, wheelbase: 2975 },
            engine: { layout: 'I6', displacement: 3.0, code: 'B58B30', induction: 'turbo', hp: 340, torque: 450, redline: 7000 },
            position: 'front-longitudinal', drivetrain: 'RWD', transmission: 'automatic', gears: 8,
            zeroTo100: 5.1, topSpeed: 250, weight: 1670, rimInches: 19, paint: '#4b4f54', paintName: 'Bluestone',
            facts: [
              'Up to 100 kg lighter than the F10 thanks to aluminium doors, bonnet and boot lid.',
              'Integral Active Steering can turn the rear wheels up to 3° for agility and stability.',
            ],
          }),
          gen({
            code: 'F90', variant: 'M5 Competition', years: '2018–2024', body: 'sedan',
            dims: { length: 4966, width: 1903, height: 1469, wheelbase: 2982 },
            engine: { layout: 'V8', displacement: 4.4, code: 'S63B44T4', induction: 'twin-turbo', hotV: true, hp: 625, torque: 750, redline: 7200 },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: 'M xDrive', awd: { kind: 'xdrive' }, transmission: 'automatic', gears: 8,
            zeroTo100: 3.3, topSpeed: 305, weight: 1940, rimInches: 20, paint: '#4e5d3d', paintName: 'Frozen Dark Green',
            facts: [
              'First M5 with all-wheel drive — but with a 2WD mode for full rear-drive.',
              'The S63\'s turbos sit in the hot-V with a cross-bank exhaust manifold for even pulses.',
            ],
          }),
          gen({
            code: 'G60', variant: 'i5 M60 xDrive', years: '2023–present', body: 'sedan',
            dims: { length: 5060, width: 1900, height: 1505, wheelbase: 2995 },
            engine: { layout: 'EV', displacement: 0, code: 'eDrive Gen5', induction: 'electric', hp: 601, torque: 820, redline: 17000, motors: { front: true, rear: true }, batteryKWh: 81.2 },
            position: 'ev', drivetrain: 'AWD', drivetrainName: 'xDrive (motor per axle)', awd: { kind: 'dual-motor' }, transmission: 'single-speed', gears: 1,
            zeroTo100: 3.8, topSpeed: 230, weight: 2380, rimInches: 21, paint: '#2e3740', paintName: 'Frozen Deep Grey',
            facts: [
              'BMW\'s fifth-gen eDrive motors use electrically excited synchronous motors — no rare-earth magnets.',
              'The same body is offered with petrol, diesel, plug-in hybrid or fully electric drive.',
            ],
          }),
        ],
      },
      {
        id: 'x5',
        name: 'X5',
        segment: 'Large SUV',
        generations: [
          gen({
            code: 'E53', variant: 'X5 4.4i', years: '1999–2006', body: 'suv',
            dims: { length: 4667, width: 1872, height: 1707, wheelbase: 2820 },
            engine: { layout: 'V8', displacement: 4.4, code: 'M62B44', induction: 'NA', hp: 286, torque: 440, redline: 6000 },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: 'permanent AWD (38:62 planetary centre diff)', awd: { kind: 'planetary', split: '38:62' }, transmission: 'automatic', gears: 5,
            zeroTo100: 7.5, topSpeed: 206, weight: 2170, rimInches: 18, paint: '#2a2f38', paintName: 'Orient Blue',
            facts: [
              'BMW called it a "Sports Activity Vehicle" — it used a unibody, not a truck ladder frame.',
              'Partly developed using Land Rover know-how while BMW owned Rover.',
            ],
          }),
          gen({
            code: 'G05', variant: 'X5 xDrive40i', years: '2018–present', body: 'suv',
            dims: { length: 4922, width: 2004, height: 1745, wheelbase: 2975 },
            engine: { layout: 'I6', displacement: 3.0, code: 'B58B30', induction: 'turbo', hp: 381, torque: 540, redline: 7000 },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: 'xDrive', awd: { kind: 'xdrive' }, transmission: 'automatic', gears: 8,
            zeroTo100: 5.4, topSpeed: 250, weight: 2200, rimInches: 21, paint: '#5a6b7a', paintName: 'Phytonic Blue',
            facts: [
              'Built in Spartanburg, South Carolina — BMW\'s largest plant worldwide.',
              'Optional two-axle air suspension varies ride height over an 80 mm range, up for off-road and down at speed.',
            ],
          }),
        ],
      },
      {
        id: 'i4',
        name: 'i4',
        segment: 'Electric Gran Coupé',
        generations: [
          gen({
            code: 'G26', variant: 'i4 eDrive40', years: '2021–present', body: 'fastback',
            dims: { length: 4783, width: 1852, height: 1448, wheelbase: 2856 },
            engine: { layout: 'EV', displacement: 0, code: 'eDrive Gen5', induction: 'electric', hp: 340, torque: 430, redline: 17000, motors: { front: false, rear: true }, batteryKWh: 81.5 },
            position: 'ev', drivetrain: 'RWD', transmission: 'single-speed', gears: 1,
            zeroTo100: 5.7, topSpeed: 190, weight: 2125, rimInches: 19, paint: '#3e5d8c', paintName: 'Brooklyn Grey',
            facts: [
              'The battery is only 110 mm tall, so the car keeps the low seating position of the 4 Series.',
              'Rear-wheel drive with a motor integrated with its inverter and gearbox in one housing.',
            ],
          }),
        ],
      },
      {
        id: 'z4',
        name: 'Z4',
        segment: 'Roadster',
        generations: [
          gen({
            code: 'G29', variant: 'Z4 M40i', years: '2018–present', body: 'roadster',
            dims: { length: 4324, width: 1864, height: 1304, wheelbase: 2470 },
            engine: { layout: 'I6', displacement: 3.0, code: 'B58B30', induction: 'turbo', hp: 340, torque: 500, redline: 7000 },
            position: 'front-longitudinal', drivetrain: 'RWD', transmission: 'automatic', gears: 8,
            zeroTo100: 4.5, topSpeed: 250, weight: 1610, rimInches: 19, paint: '#a51e2f', paintName: 'San Francisco Red',
            facts: [
              'Co-developed with Toyota — it shares its platform and engine with the GR Supra.',
              'The fabric roof opens in 10 seconds at speeds up to 50 km/h.',
            ],
          }),
        ],
      },
    ],
  },
  {
    id: 'mercedes',
    name: 'Mercedes-Benz',
    hq: 'Stuttgart',
    founded: 1926,
    tagline: 'Das Beste oder nichts',
    accent: '#00adef',
    models: [
      {
        id: 'aclass',
        name: 'A-Class',
        segment: 'Premium compact',
        generations: [
          gen({
            code: 'W177', variant: 'A 250', years: '2018–present', body: 'hatch',
            dims: { length: 4419, width: 1796, height: 1440, wheelbase: 2729 },
            engine: { layout: 'I4', displacement: 2.0, code: 'M260', induction: 'turbo', hp: 224, torque: 350, redline: 6500 },
            position: 'front-transverse', drivetrain: 'FWD', transmission: 'dct', gears: 7,
            zeroTo100: 6.2, topSpeed: 250, weight: 1450, rimInches: 18, paint: '#b51f2e', paintName: 'Jupiter Red',
            facts: [
              'Debuted the MBUX infotainment system with "Hey Mercedes" voice control.',
              'Drag coefficient of 0.25 — remarkably low for a hatchback.',
            ],
          }),
        ],
      },
      {
        id: 'cclass',
        name: 'C-Class / C 63',
        segment: 'Compact executive',
        generations: [
          gen({
            code: 'W204', variant: 'C 63 AMG', years: '2007–2014', body: 'sedan',
            dims: { length: 4726, width: 1795, height: 1427, wheelbase: 2765 },
            engine: { layout: 'V8', displacement: 6.2, code: 'M156', induction: 'NA', hp: 457, torque: 600, redline: 7200 },
            position: 'front-longitudinal', drivetrain: 'RWD', transmission: 'automatic', gears: 7,
            zeroTo100: 4.5, topSpeed: 250, weight: 1730, rimInches: 18, paint: '#1c1c1e', paintName: 'Obsidian Black',
            facts: [
              'The M156 was the first engine AMG designed entirely in-house — each one hand-built by a single technician who signs it.',
              'Actually 6,208 cc, though badged "63" as a nod to the 1960s 300 SEL 6.3.',
            ],
          }),
          gen({
            code: 'W205', variant: 'C 300', years: '2014–2021', body: 'sedan',
            dims: { length: 4686, width: 1810, height: 1442, wheelbase: 2840 },
            engine: { layout: 'I4', displacement: 2.0, code: 'M274', induction: 'turbo', hp: 245, torque: 370, redline: 6300 },
            position: 'front-longitudinal', drivetrain: 'RWD', transmission: 'automatic', gears: 9,
            zeroTo100: 5.9, topSpeed: 250, weight: 1540, rimInches: 18, paint: '#9a9da1', paintName: 'Iridium Silver',
            facts: [
              'Roughly 50% aluminium body construction, saving about 100 kg.',
              'The 9G-TRONIC was the first nine-speed automatic in a rear-drive production car.',
            ],
          }),
          gen({
            code: 'W206', variant: 'C 63 S E PERFORMANCE', years: '2023–present', body: 'sedan',
            dims: { length: 4842, width: 1900, height: 1446, wheelbase: 2875 },
            engine: { layout: 'I4', displacement: 2.0, code: 'M139l', induction: 'turbo', hp: 680, torque: 1020, redline: 7200, hybrid: true, batteryKWh: 6.1, motors: { front: false, rear: true } },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: 'AMG Performance 4MATIC+', awd: { kind: 'clutch-variable' }, transmission: 'automatic', gears: 9,
            zeroTo100: 3.4, topSpeed: 280, weight: 2111, rimInches: 20, paint: '#6a6f73', paintName: 'Graphite Grey',
            facts: [
              'Swapped the V8 for a 2.0 four-cylinder with an F1-derived electric turbocharger plus a rear-axle e-motor.',
              'The 400-volt battery was developed by the Mercedes-AMG F1 team\'s high-performance powertrain division.',
              'It\'s the most powerful production four-cylinder ever made.',
            ],
          }),
        ],
      },
      {
        id: 'eclass',
        name: 'E-Class',
        segment: 'Executive',
        generations: [
          gen({
            code: 'W211', variant: 'E 500', years: '2002–2009', body: 'sedan',
            dims: { length: 4818, width: 1822, height: 1452, wheelbase: 2854 },
            engine: { layout: 'V8', displacement: 5.0, code: 'M113', induction: 'NA', hp: 306, torque: 460, redline: 6000 },
            position: 'front-longitudinal', drivetrain: 'RWD', transmission: 'automatic', gears: 7,
            zeroTo100: 6.1, topSpeed: 250, weight: 1730, rimInches: 17, paint: '#2a3446', paintName: 'Tanzanite Blue',
            facts: [
              'Introduced Sensotronic Brake Control, an electro-hydraulic brake-by-wire system.',
              'AIRMATIC air suspension was available across the range.',
            ],
          }),
          gen({
            code: 'W213', variant: 'E 450 4MATIC', years: '2016–2023', body: 'sedan',
            dims: { length: 4923, width: 1852, height: 1468, wheelbase: 2939 },
            engine: { layout: 'I6', displacement: 3.0, code: 'M256', induction: 'turbo', hp: 367, torque: 500, redline: 6500 },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: '4MATIC', awd: { kind: 'planetary', split: '31:69' }, transmission: 'automatic', gears: 9,
            zeroTo100: 5.0, topSpeed: 250, weight: 1850, rimInches: 19, paint: '#1d1f22', paintName: 'Obsidian Black',
            facts: [
              'The M256 marked Mercedes\' return to inline-six engines after 20 years of V6s.',
              'Its 48 V integrated starter-generator replaces both the starter motor and alternator, so there\'s no belt drive.',
            ],
          }),
          gen({
            code: 'W214', variant: 'E 350', years: '2023–present', body: 'sedan',
            dims: { length: 4949, width: 1880, height: 1468, wheelbase: 2961 },
            engine: { layout: 'I4', displacement: 2.0, code: 'M254', induction: 'turbo', hp: 258, torque: 400, redline: 6200 },
            position: 'front-longitudinal', drivetrain: 'RWD', transmission: 'automatic', gears: 9,
            zeroTo100: 6.2, topSpeed: 250, weight: 1795, rimInches: 19, paint: '#d7d7d4', paintName: 'Polar White',
            facts: [
              'Optional MBUX Superscreen spans the entire dashboard, including a passenger display.',
              'Mild hybrid ISG adds up to 23 hp boost under acceleration.',
            ],
          }),
        ],
      },
      {
        id: 'sclass',
        name: 'S-Class',
        segment: 'Flagship luxury',
        generations: [
          gen({
            code: 'W221', variant: 'S 600', years: '2005–2013', body: 'sedan',
            dims: { length: 5206, width: 1871, height: 1485, wheelbase: 3165 },
            engine: { layout: 'V12', displacement: 5.5, code: 'M275', induction: 'twin-turbo', hp: 517, torque: 830, redline: 6000 },
            position: 'front-longitudinal', drivetrain: 'RWD', transmission: 'automatic', gears: 5,
            zeroTo100: 4.6, topSpeed: 250, weight: 2185, rimInches: 18, paint: '#14161a', paintName: 'Obsidian Black',
            facts: [
              'The M275 twin-turbo V12 was so torque-rich that it kept an older 5-speed auto rated to handle 830 Nm.',
              'Introduced Night View Assist, using infrared cameras to see beyond the headlights.',
            ],
          }),
          gen({
            code: 'W223', variant: 'S 580 4MATIC', years: '2020–present', body: 'sedan',
            dims: { length: 5289, width: 1954, height: 1503, wheelbase: 3216 },
            engine: { layout: 'V8', displacement: 4.0, code: 'M176', induction: 'twin-turbo', hotV: true, hp: 503, torque: 700, redline: 6500 },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: '4MATIC', awd: { kind: 'planetary', split: '45:55' }, transmission: 'automatic', gears: 9,
            zeroTo100: 4.4, topSpeed: 250, weight: 2245, rimInches: 20, paint: '#253046', paintName: 'Nautical Blue',
            facts: [
              'Rear-axle steering up to 10° makes the 5.3 m sedan turn like a compact car.',
              'The first production car approved for Level 3 automated driving (DRIVE PILOT) in Germany.',
            ],
          }),
        ],
      },
      {
        id: 'gclass',
        name: 'G-Class',
        segment: 'Off-roader',
        generations: [
          gen({
            code: 'W463', variant: 'G 55 AMG', years: '1990–2018', body: 'offroad',
            dims: { length: 4662, width: 1760, height: 1931, wheelbase: 2850 },
            engine: { layout: 'V8', displacement: 5.4, code: 'M113K', induction: 'supercharged', hp: 507, torque: 700, redline: 6000 },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: 'permanent AWD + 3 locking diffs', awd: { kind: 'g-locks', split: '50:50' }, transmission: 'automatic', gears: 5,
            zeroTo100: 5.5, topSpeed: 210, weight: 2550, rimInches: 19, paint: '#2a2a2a', paintName: 'Obsidian Black',
            facts: [
              'Body-on-frame construction with solid axles front and rear — and three locking differentials.',
              'Originally developed as a military vehicle at the suggestion of the Shah of Iran.',
            ],
          }),
          gen({
            code: 'W463A', id: 'w463a', variant: 'G 63 AMG', years: '2018–present', body: 'offroad',
            dims: { length: 4873, width: 1984, height: 1966, wheelbase: 2890 },
            engine: { layout: 'V8', displacement: 4.0, code: 'M177', induction: 'twin-turbo', hotV: true, hp: 585, torque: 850, redline: 6500 },
            position: 'front-longitudinal', drivetrain: 'AWD', drivetrainName: 'AMG Performance 4MATIC + 3 locking diffs', awd: { kind: 'g-locks', split: '40:60' }, transmission: 'automatic', gears: 9,
            zeroTo100: 4.5, topSpeed: 220, weight: 2560, rimInches: 22, paint: '#4c5a3a', paintName: 'Desert Sand / Olive',
            facts: [
              'Switched to independent front suspension for the first time — but kept the solid rear axle.',
              'Still hand-assembled by Magna Steyr in Graz, Austria, as it has been since 1979.',
              'Only the door handles, headlamp washer jets, sun visor and spare wheel cover carried over from the old model.',
            ],
          }),
        ],
      },
      {
        id: 'amggt',
        name: 'AMG GT',
        segment: 'Sports car',
        generations: [
          gen({
            code: 'C190', variant: 'AMG GT R', years: '2014–2021', body: 'coupe',
            dims: { length: 4551, width: 2007, height: 1284, wheelbase: 2630 },
            engine: { layout: 'V8', displacement: 4.0, code: 'M178', induction: 'twin-turbo', hotV: true, hp: 585, torque: 700, redline: 7200 },
            position: 'front-longitudinal', drivetrain: 'RWD', transmission: 'dct', gears: 7,
            zeroTo100: 3.6, topSpeed: 318, weight: 1630, rimInches: 20, paint: '#4d8c2a', paintName: 'Green Hell Magno',
            facts: [
              'Front-mid-engine with a rear transaxle: the gearbox sits at the rear axle for 47:53 weight distribution.',
              'A carbon-fibre torque tube links engine and gearbox, rotating a light prop shaft inside it.',
              'The M178 is dry-sumped so it can sit very low in the chassis.',
            ],
          }),
        ],
      },
      {
        id: 'eqs',
        name: 'EQS',
        segment: 'Electric luxury',
        generations: [
          gen({
            code: 'V297', variant: 'EQS 580 4MATIC', years: '2021–present', body: 'fastback',
            dims: { length: 5216, width: 1926, height: 1512, wheelbase: 3210 },
            engine: { layout: 'EV', displacement: 0, code: 'eATS ×2', induction: 'electric', hp: 523, torque: 855, redline: 15000, motors: { front: true, rear: true }, batteryKWh: 107.8 },
            position: 'ev', drivetrain: 'AWD', drivetrainName: '4MATIC (motor per axle)', awd: { kind: 'dual-motor' }, transmission: 'single-speed', gears: 1,
            zeroTo100: 4.3, topSpeed: 210, weight: 2585, rimInches: 21, paint: '#3a3f47', paintName: 'Sodalite Blue',
            facts: [
              'Drag coefficient of 0.20 — the most aerodynamic production car in the world at launch.',
              'Optional MBUX Hyperscreen: a 141 cm curved glass panel housing three displays.',
              'Rear-axle steering of up to 10° is available.',
            ],
          }),
        ],
      },
    ],
  },
];

export function findSelection(brandId: string, modelId: string, genId: string) {
  const brand = BRANDS.find((b) => b.id === brandId) ?? BRANDS[0];
  const model = brand.models.find((m) => m.id === modelId) ?? brand.models[0];
  const generation = model.generations.find((g) => g.id === genId) ?? model.generations[model.generations.length - 1];
  return { brand, model, generation };
}

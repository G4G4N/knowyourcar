import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Brand, Generation } from '../data/types';
import { sim, useStore } from '../store';
import type { Layout } from './layout';
import { mat } from './materials';
import { Part } from './Part';
import { Pipe, Rod, RoundBox } from './prims';
import type { Rig } from './rig';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const UP = new THREE.Vector3(0, 1, 0);

/** A shaft between two points with visible markers so you can see it spin. */
function SpinShaft({ from, to, r, ratio, material }: { from: THREE.Vector3; to: THREE.Vector3; r: number; ratio: number; material: THREE.Material }) {
  const spin = useRef<THREE.Group>(null!);
  const { pos, quat, len } = useMemo(() => {
    const d = to.clone().sub(from);
    return { pos: from.clone().add(to).multiplyScalar(0.5), quat: new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize()), len: d.length() };
  }, [from, to]);
  useFrame(() => {
    if (spin.current) spin.current.rotation.y = sim.wheel * ratio;
  });
  return (
    <group position={pos} quaternion={quat}>
      <group ref={spin}>
        <mesh material={material}>
          <cylinderGeometry args={[r, r, len, 14]} />
        </mesh>
        {[-0.5, 0.5].map((f) => (
          <group key={f} position={[0, f * len * 0.94, 0]}>
            <mesh material={mat('dark')}>
              <cylinderGeometry args={[r * 1.8, r * 1.8, 0.04, 14]} />
            </mesh>
            <mesh position={[r * 1.6, 0, 0]} material={mat('chrome')}>
              <boxGeometry args={[r * 0.8, 0.05, r * 0.8]} />
            </mesh>
          </group>
        ))}
        {Array.from({ length: Math.max(1, Math.floor(len / 0.35)) }).map((_, k, arr) => (
          <mesh key={k} position={[r, (k / arr.length - 0.5 + 0.5 / arr.length) * len, 0]} material={mat('paint', '#ffd23f')}>
            <boxGeometry args={[0.006, 0.05, 0.012]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Diff({ at, r = 0.11 }: { at: THREE.Vector3; r?: number }) {
  return (
    <group position={at}>
      <mesh material={mat('steel', '#5d636a')}>
        <sphereGeometry args={[r, 20, 14]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mat('dark')}>
        <cylinderGeometry args={[r * 0.55, r * 0.55, r * 2.6, 16]} />
      </mesh>
    </group>
  );
}

export function Drivetrain({ l, g, rig }: { l: Layout; g: Generation; rig: Rig }) {
  const steel = mat('steel', '#8b9198');
  const hubZ = l.trackZ - l.tireW / 2 - 0.04;
  const finalDrive = 3.2;
  const half = (diff: THREE.Vector3 | null, x: number) =>
    diff
      ? [1, -1].map((s) => (
          <SpinShaft key={s} from={v(diff.x, diff.y, diff.z + s * 0.12)} to={v(x, l.wheelR, s * hubZ)} r={0.017} ratio={1} material={steel} />
        ))
      : null;
  const carbonProp = g.id === 'f80' || g.id === 'g80' || g.id === 'c190';
  return (
    <>
      {rig.gearbox && (
        <Part id="gearbox">
          <Rod from={rig.gearbox.from} to={rig.gearbox.to} r={rig.gearbox.r1} r2={rig.gearbox.r0} material={mat('alu', '#9aa1a8')} seg={24} />
          {/* bellhousing ribs */}
          {[0.2, 0.45, 0.7].map((f) => {
            const p = rig.gearbox!.from.clone().lerp(rig.gearbox!.to, f);
            const r = rig.gearbox!.r0 + (rig.gearbox!.r1 - rig.gearbox!.r0) * f;
            const dir = rig.gearbox!.to.clone().sub(rig.gearbox!.from).normalize();
            return (
              <mesh key={f} position={p} quaternion={new THREE.Quaternion().setFromUnitVectors(UP, dir)} material={mat('dark')}>
                <torusGeometry args={[r + 0.003, 0.008, 6, 28]} />
              </mesh>
            );
          })}
        </Part>
      )}
      {rig.propShaft && (
        <Part id="driveshaft">
          {g.id === 'c190' && (
            <Rod from={rig.propShaft.from} to={rig.propShaft.to} r={0.05} material={mat('carbon')} />
          )}
          <SpinShaft from={rig.propShaft.from} to={rig.propShaft.to} r={0.03} ratio={finalDrive} material={carbonProp ? mat('carbon') : steel} />
        </Part>
      )}
      {rig.transferCase && (
        <Part id="transferCase">
          <RoundBox size={[0.2, 0.2, 0.26]} radius={0.04} material={mat('alu', '#7f878f')} position={rig.transferCase} />
          {rig.frontProp && <SpinShaft from={rig.frontProp.from} to={rig.frontProp.to} r={0.022} ratio={finalDrive} material={steel} />}
        </Part>
      )}
      {!rig.transferCase && rig.frontProp && (
        <Part id="driveshaft">
          <SpinShaft from={rig.frontProp.from} to={rig.frontProp.to} r={0.022} ratio={finalDrive} material={steel} />
        </Part>
      )}
      {rig.frontDiff && !rig.ev && (
        <Part id="frontDiff">
          <Diff at={rig.frontDiff} r={0.09} />
        </Part>
      )}
      {rig.rearDiff && !rig.ev && (
        <Part id="rearDiff">
          <Diff at={rig.rearDiff} r={g.engine.torque > 600 ? 0.13 : 0.11} />
        </Part>
      )}
      <Part id="halfShafts">
        {rig.drivenFront && half(rig.frontDiff ?? v(l.xFA, l.wheelR, 0), l.xFA)}
        {rig.drivenRear && half(rig.rearDiff ?? v(l.xRA, l.wheelR, 0), l.xRA)}
      </Part>
    </>
  );
}

function useRadiatorTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#4a5560';
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#1d242b';
    ctx.lineWidth = 1;
    for (let x = 0; x < 256; x += 3) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 128);
      ctx.stroke();
    }
    ctx.fillStyle = '#7d8a96';
    for (let y = 0; y < 128; y += 12) ctx.fillRect(0, y, 256, 2);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

export function Cooling({ l, rig }: { l: Layout; rig: Rig }) {
  const tex = useRadiatorTexture();
  const radMat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, metalness: 0.6, roughness: 0.5 }), [tex]);
  const fan = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (fan.current && useStore.getState().running) fan.current.rotation.x += dt * (4 + sim.rpm / 600);
  });
  const { x, y, w, h } = rig.radiator;
  return (
    <>
      <Part id="radiator">
        <mesh position={[x, y + h / 2, 0]} material={radMat}>
          <boxGeometry args={[0.035, h, w]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[x, y + h / 2, s * (w / 2 + 0.02)]} material={mat('plastic')}>
            <boxGeometry args={[0.05, h + 0.02, 0.04]} />
          </mesh>
        ))}
      </Part>
      <Part id="fan">
        <group position={[x - 0.06, y + h / 2, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={mat('plastic')}>
            <torusGeometry args={[Math.min(h, w) * 0.42, 0.012, 8, 32]} />
          </mesh>
          <group ref={fan}>
            {Array.from({ length: 7 }).map((_, k) => (
              <mesh key={k} rotation={[(k / 7) * Math.PI * 2, 0, 0]} material={mat('plastic', '#2a2e33')}>
                <boxGeometry args={[0.006, Math.min(h, w) * 0.38, 0.06]} />
              </mesh>
            ))}
            <mesh rotation={[0, 0, Math.PI / 2]} material={mat('dark')}>
              <cylinderGeometry args={[0.04, 0.04, 0.05, 16]} />
            </mesh>
          </group>
        </group>
      </Part>
      {rig.intercooler && (
        <Part id="intercooler">
          <mesh position={[x + 0.06, y - 0.02, 0]} material={radMat}>
            <boxGeometry args={[0.05, 0.14, w * 0.9]} />
          </mesh>
        </Part>
      )}
      {rig.chargeCooler && (
        <Part id="intercooler">
          {/* water-cooled charge-air cooler on the engine, fed by a slim low-temperature radiator up front */}
          <RoundBox size={[0.34, 0.07, 0.16]} radius={0.02} material={radMat} position={rig.chargeCooler} />
          <mesh position={[x + 0.07, y + h * 0.75, 0]} material={radMat}>
            <boxGeometry args={[0.025, h * 0.35, w * 0.7]} />
          </mesh>
          <Pipe points={[v(x + 0.07, y + h * 0.75, w * 0.3), v(rig.chargeCooler.x + 0.3, rig.chargeCooler.y + 0.05, 0.22), rig.chargeCooler.clone().add(v(0.17, 0, 0.05))]} r={0.01} material={mat('paint', '#2a6fb0')} />
        </Part>
      )}
      {rig.ev && (
        <Part id="batteryCooling">
          {rig.hvBattery && (
            <Pipe
              points={[v(x - 0.05, y + 0.05, 0.2), v(rig.hvBattery.x1 + 0.1, l.gc + 0.12, 0.25), v(rig.hvBattery.x1 - 0.1, rig.hvBattery.y + rig.hvBattery.h + 0.01, 0.3)]}
              r={0.012}
              material={mat('paint', '#2a6fb0')}
            />
          )}
        </Part>
      )}
    </>
  );
}

export function AirIntake({ rig }: { rig: Rig }) {
  if (!rig.ice) return null;
  const pipes: THREE.Vector3[][] = [];
  const inlet = rig.airFilter.clone().add(v(0.12, 0.02, 0));
  const plenumW = rig.plenums.map((p) => rig.engineToWorld(p.local));
  if (rig.turbos.length) {
    for (const t of rig.turbos) {
      const comp = rig.engineToWorld(t.local.clone().add(v(0.11, 0, 0)));
      pipes.push([rig.airFilter.clone().add(v(-0.1, 0, 0)), rig.airFilter.clone().lerp(comp, 0.5).add(v(0, 0.06, 0)), comp]);
    }
  } else if (rig.supercharger) {
    pipes.push([rig.airFilter.clone().add(v(-0.1, 0, 0)), rig.engineToWorld(rig.supercharger)]);
  } else {
    for (const p of plenumW) pipes.push([rig.airFilter.clone().add(v(-0.1, 0, 0)), rig.airFilter.clone().lerp(p, 0.5).add(v(0, 0.05, 0)), p]);
  }
  return (
    <>
      <Part id="airFilter">
        <RoundBox size={[0.26, 0.14, 0.24]} radius={0.04} material={mat('plastic', '#202328')} position={rig.airFilter} />
        <mesh position={inlet} rotation={[0, 0, Math.PI / 2]} material={mat('plastic')}>
          <cylinderGeometry args={[0.04, 0.05, 0.08, 16]} />
        </mesh>
      </Part>
      <Part id="intake">
        {pipes.map((p, i) => (
          <Pipe key={i} points={p} r={0.03} material={mat('plastic', '#2b2f35')} seg={24} />
        ))}
      </Part>
    </>
  );
}

export function Exhaust({ rig }: { rig: Rig }) {
  if (!rig.ice) return null;
  const steel = mat('steel', '#9a9fa5');
  return (
    <>
      <Part id="exhaustManifold">
        {rig.exhaust.map((ex, i) => (
          <Pipe key={i} points={ex.route.slice(0, 3)} r={0.026} material={mat('hot')} seg={30} />
        ))}
      </Part>
      <Part id="catalyst">
        {rig.exhaust.map((ex, i) => {
          const c = new THREE.CatmullRomCurve3(ex.route, false, 'centripetal');
          const p0 = c.getPointAt(ex.catAt);
          const p1 = c.getPointAt(ex.catAt + 0.07);
          return <Rod key={i} from={p0} to={p1} r={0.055} material={mat('steel', '#b5a99a')} seg={20} />;
        })}
      </Part>
      <Part id="muffler">
        {rig.exhaust.map((ex, i) => (
          <Pipe key={i} points={ex.route.slice(2)} r={0.024} material={steel} seg={40} />
        ))}
        <RoundBox size={[0.3, 0.13, rig.exhaust.length > 1 ? 0.9 : 0.5]} radius={0.05} material={steel} position={rig.muffler} />
      </Part>
      <Part id="tailpipes">
        {rig.tailpipes.map((t, i) => (
          <group key={i} position={t.pos} rotation={t.dir === 'x' ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]}>
            {t.shape === 'trap' ? (
              <mesh material={mat('chrome')}>
                <boxGeometry args={[t.r * 1.3, 0.12, t.r * 2.6]} />
              </mesh>
            ) : (
              <mesh material={mat('chrome')} scale={t.shape === 'oval' ? [0.8, 1, 1.35] : [1, 1, 1]}>
                <cylinderGeometry args={[t.r, t.r, 0.12, 24, 1, true]} />
              </mesh>
            )}
            <mesh position={[0, -0.03, 0]} material={mat('dark', '#0a0a0a')} scale={t.shape === 'oval' ? [0.75, 1, 1.3] : t.shape === 'trap' ? [0.9, 1, 1.6] : [1, 1, 1]}>
              <cylinderGeometry args={[t.r * 0.85, t.r * 0.85, 0.08, 20]} />
            </mesh>
          </group>
        ))}
      </Part>
    </>
  );
}

export function Fuel({ rig }: { rig: Rig }) {
  if (!rig.fuelTank) return null;
  const t = rig.fuelTank;
  return (
    <Part id="fuelTank">
      <RoundBox size={[t.l, t.h, t.w]} radius={0.06} material={mat('plastic', '#3b3448')} position={[t.x, t.y + t.h / 2, 0]} />
      <Rod from={v(t.x - 0.1, t.y + t.h - 0.02, t.w / 2 - 0.05)} to={v(t.x - 0.5, t.y + t.h + 0.3, t.w / 2 + 0.25)} r={0.02} material={mat('plastic')} />
    </Part>
  );
}

export function Electric({ rig }: { rig: Rig }) {
  const motors = useRef<THREE.Group[]>([]);
  useFrame(() => {
    for (const m of motors.current) if (m) m.rotation.z = -sim.wheel * 9;
  });
  const b = rig.hvBattery;
  const cells = useMemo(() => {
    if (!b) return [];
    const out: [number, number, number][] = [];
    const nx = Math.max(2, Math.floor((b.x1 - b.x0) / 0.23));
    const nz = Math.max(2, Math.floor(b.w / 0.3));
    for (let i = 0; i < nx; i++)
      for (let k = 0; k < nz; k++)
        out.push([b.x0 + ((i + 0.5) * (b.x1 - b.x0)) / nx, b.y + b.h * 0.55, -b.w / 2 + ((k + 0.5) * b.w) / nz]);
    return out;
  }, [b]);
  const cellSize: [number, number, number] = b ? [((b.x1 - b.x0) / Math.max(2, Math.floor((b.x1 - b.x0) / 0.23))) * 0.86, b.h * 0.7, (b.w / Math.max(2, Math.floor(b.w / 0.3))) * 0.86] : [0, 0, 0];

  const Motor = ({ at, id, idx }: { at: THREE.Vector3; id: 'motorFront' | 'motorRear' | 'hybridMotor'; idx: number }) => (
    <Part id={id}>
      <group position={at}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mat('alu', '#a7adb4')}>
          <cylinderGeometry args={[0.13, 0.13, 0.32, 28]} />
        </mesh>
        <group ref={(gr) => gr && (motors.current[idx] = gr)}>
          {Array.from({ length: 6 }).map((_, k) => (
            <mesh key={k} rotation={[0, 0, (k / 6) * Math.PI * 2]} position={[0, 0, 0.165]} material={mat('copper')}>
              <boxGeometry args={[0.2, 0.02, 0.01]} />
            </mesh>
          ))}
        </group>
        <mesh position={[0, 0, -0.2]} material={mat('dark')}>
          <boxGeometry args={[0.26, 0.24, 0.1]} />
        </mesh>
      </group>
    </Part>
  );

  return (
    <>
      {b && rig.ev && (
        <Part id="hvBattery">
          <RoundBox size={[b.x1 - b.x0 + 0.04, b.h, b.w + 0.04]} radius={0.02} material={mat('dark', '#2a2f36')} position={[(b.x0 + b.x1) / 2, b.y + b.h / 2, 0]} />
          {cells.map((p, i) => (
            <mesh key={i} position={p} material={mat('cell')}>
              <boxGeometry args={cellSize} />
            </mesh>
          ))}
          <Rod from={v(b.x0, b.y + b.h, b.w / 2 - 0.05)} to={v(b.x1, b.y + b.h, b.w / 2 - 0.05)} r={0.012} material={mat('paint', '#ff7b00')} />
          <Rod from={v(b.x0, b.y + b.h, -b.w / 2 + 0.05)} to={v(b.x1, b.y + b.h, -b.w / 2 + 0.05)} r={0.012} material={mat('paint', '#ff7b00')} />
        </Part>
      )}
      {b && rig.hybrid && (
        <Part id="hvBattery">
          <RoundBox size={[b.x1 - b.x0, b.h, b.w]} radius={0.03} material={mat('dark', '#2a2f36')} position={[(b.x0 + b.x1) / 2, b.y + b.h / 2, 0]} />
        </Part>
      )}
      {rig.motorRear && <Motor at={rig.motorRear} id={rig.hybrid ? 'hybridMotor' : 'motorRear'} idx={0} />}
      {rig.motorFront && <Motor at={rig.motorFront} id="motorFront" idx={1} />}
      {(rig.ev || rig.hybrid) && (
        <Part id="inverter">
          {[rig.motorRear, rig.motorFront].filter(Boolean).map((m, i) => (
            <RoundBox key={i} size={[0.22, 0.08, 0.3]} radius={0.02} material={mat('alu', '#c0c6cc')} position={m!.clone().add(v(rig.hybrid ? 0 : i ? -0.05 : 0.05, 0.17, 0))} />
          ))}
          {b &&
            [rig.motorRear, rig.motorFront].filter(Boolean).map((m, i) => (
              <Pipe
                key={i}
                points={[v(m!.x, m!.y + 0.17, 0.14), v((m!.x + (m === rig.motorRear ? b.x0 : b.x1)) / 2, b.y + b.h + 0.06, 0.25), v(m === rig.motorRear ? b.x0 + 0.05 : b.x1 - 0.05, b.y + b.h, b.w / 2 - 0.05)]}
                r={0.012}
                material={mat('paint', '#ff7b00')}
              />
            ))}
        </Part>
      )}
      {rig.chargePort && (
        <Part id="chargePort">
          <mesh position={rig.chargePort} rotation={[Math.PI / 2, 0, 0]} material={mat('plastic', '#0f1114')}>
            <cylinderGeometry args={[0.05, 0.05, 0.04, 20]} />
          </mesh>
          <mesh position={rig.chargePort.clone().add(v(0, 0, 0.021))} userData={{ skipHighlight: true }}>
            <circleGeometry args={[0.03, 20]} />
            <meshBasicMaterial color="#4dffa6" toneMapped={false} />
          </mesh>
        </Part>
      )}
      <Part id="battery12v">
        <RoundBox size={[0.24, 0.18, 0.17]} radius={0.015} material={mat('plastic', '#15171a')} position={rig.battery12} />
        {[-1, 1].map((s) => (
          <mesh key={s} position={rig.battery12.clone().add(v(s * 0.07, 0.1, 0))} material={mat('paint', s > 0 ? '#c8102e' : '#222')}>
            <cylinderGeometry args={[0.012, 0.012, 0.03, 10]} />
          </mesh>
        ))}
      </Part>
    </>
  );
}

export function Interior({ l, g, brand }: { l: Layout; g: Generation; brand: Brand }) {
  const seatMat = mat('leather', g.engine.hp > 450 ? '#2a1c18' : brand.id === 'mercedes' ? '#4a3527' : '#23201f');
  const seatZ = 0.37 * (l.W / 1.85);
  const Seat = ({ x, z }: { x: number; z: number }) => (
    <group position={[x, l.floor, z]}>
      <RoundBox size={[0.5, 0.12, 0.5]} radius={0.04} material={seatMat} position={[0, 0.22, 0]} />
      <RoundBox size={[0.12, 0.62, 0.48]} radius={0.04} material={seatMat} position={[-0.27, 0.55, 0]} rotation={[0, 0, 0.2]} />
      <RoundBox size={[0.1, 0.14, 0.26]} radius={0.04} material={seatMat} position={[-0.34, 0.92, 0]} rotation={[0, 0, 0.2]} />
      <mesh position={[0, 0.1, 0]} material={mat('dark')}>
        <boxGeometry args={[0.4, 0.14, 0.36]} />
      </mesh>
    </group>
  );
  const screenColor = brand.id === 'mercedes' ? '#7fb6ff' : brand.id === 'bmw' ? '#6ad0ff' : '#e04050';
  return (
    <>
      <Part id="seats">
        <Seat x={l.frontSeatX} z={-seatZ} />
        <Seat x={l.frontSeatX} z={seatZ} />
        {l.rearSeatX !== null && (
          <group position={[l.rearSeatX, l.floor, 0]}>
            <RoundBox size={[0.5, 0.14, l.W * 0.72]} radius={0.05} material={seatMat} position={[0, 0.24, 0]} />
            <RoundBox size={[0.12, 0.6, l.W * 0.72]} radius={0.05} material={seatMat} position={[-0.27, 0.56, 0]} rotation={[0, 0, 0.22]} />
          </group>
        )}
        {/* centre console */}
        <RoundBox size={[0.7, 0.2, 0.2]} radius={0.04} material={mat('plastic')} position={[l.frontSeatX + 0.15, l.floor + 0.12, 0]} />
      </Part>
      <Part id="steeringWheel">
        <group position={[l.frontSeatX + 0.44, l.floor + 0.56, l.driverZ]} rotation={[0, Math.PI / 2, 0.38]}>
          <mesh material={mat('leather', '#141414')}>
            <torusGeometry args={[0.18, 0.018, 10, 36]} />
          </mesh>
          {[0, 2.2, 4.1].map((a) => (
            <mesh key={a} rotation={[0, 0, a]} position={[Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0]} material={mat('dark')}>
              <boxGeometry args={[0.18, 0.025, 0.02]} />
            </mesh>
          ))}
          <mesh material={mat('dark')}>
            <cylinderGeometry args={[0.055, 0.055, 0.05, 20]} />
          </mesh>
        </group>
      </Part>
      <Part id="dashboard">
        <RoundBox size={[0.38, 0.22, l.W * 0.86]} radius={0.06} material={mat('plastic', '#1a1c20')} position={[l.xWs - 0.28, l.belt - 0.13, 0]} />
        <mesh position={[l.xWs - 0.48, l.belt - 0.04, 0.02]} rotation={[0, -Math.PI / 2, 0]} userData={{ skipHighlight: true }}>
          <planeGeometry args={[g.id === 'v297' ? l.W * 0.8 : 0.32, 0.12]} />
          <meshBasicMaterial color={screenColor} toneMapped={false} transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      </Part>
    </>
  );
}

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Brand, Generation } from '../data/types';
import { sim } from '../store';
import type { Layout } from './layout';
import { mat } from './materials';
import { Part } from './Part';
import { Rod } from './prims';
import { designFor } from '../data/designs';
import type { Rig } from './rig';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function caliperColor(brand: Brand, g: Generation) {
  if (g.engine.hp < 380) return '#2a2d33';
  return brand.id === 'audi' ? '#c8102e' : brand.id === 'bmw' ? '#1c69d4' : '#c8102e';
}

export function Wheels({ l, g, brand }: { l: Layout; g: Generation; brand: Brand }) {
  const rims = designFor(g).rims;
  const tireGeo = useMemo(() => {
    const R = l.wheelR;
    const r = l.rimR + 0.005;
    const w = l.tireW / 2;
    const pts = [
      new THREE.Vector2(r, -w * 0.92),
      new THREE.Vector2(R - 0.035, -w),
      new THREE.Vector2(R - 0.008, -w * 0.9),
      new THREE.Vector2(R, -w * 0.7),
      new THREE.Vector2(R, w * 0.7),
      new THREE.Vector2(R - 0.008, w * 0.9),
      new THREE.Vector2(R - 0.035, w),
      new THREE.Vector2(r, w * 0.92),
    ];
    const geo = new THREE.LatheGeometry(pts, 56);
    geo.rotateX(Math.PI / 2);
    return geo;
  }, [l.wheelR, l.rimR, l.tireW]);

  const positions = [
    { x: l.xFA, s: 1, front: true },
    { x: l.xFA, s: -1, front: true },
    { x: l.xRA, s: 1, front: false },
    { x: l.xRA, s: -1, front: false },
  ];
  const spinners = useRef<THREE.Group[]>([]);
  useFrame(() => {
    for (const s of spinners.current) if (s) s.rotation.z = -sim.wheel * (s.userData.flip ? -1 : 1);
  });

  const calColor = caliperColor(brand, g);
  const rimMat = mat('alu', { silver: '#c9ced4', dark: '#3b3e43', black: '#18191b', gold: '#a8884a', bicolor: '#d6dade' }[rims.finish]);

  return (
    <>
      <Part id="wheels">
        {positions.map((p, i) => (
          <group key={i} position={[p.x, l.wheelR, p.s * l.trackZ]}>
            <group ref={(r) => r && (spinners.current[i] = r)} rotation={[0, p.s < 0 ? Math.PI : 0, 0]} userData={{ flip: p.s < 0 }}>
              <mesh geometry={tireGeo} material={mat('rubber')} castShadow />
              {/* rim barrel */}
              <mesh rotation={[Math.PI / 2, 0, 0]} material={mat('steel')}>
                <cylinderGeometry args={[l.rimR, l.rimR, l.tireW * 0.86, 40, 1, true]} />
              </mesh>
              {/* spokes on the outer face */}
              <group position={[0, 0, l.tireW * 0.38]}>
                <RimFace R={l.rimR} style={rims.style} n={rims.n} face={rimMat} />
                <mesh rotation={[Math.PI / 2, 0, 0]} material={rimMat}>
                  <cylinderGeometry args={[0.065, 0.072, 0.05, 24]} />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.026]} material={mat('dark')}>
                  <cylinderGeometry args={[0.028, 0.028, 0.006, 24]} />
                </mesh>
                <mesh position={[0, 0, -0.005]} material={rimMat}>
                  <torusGeometry args={[l.rimR - 0.008, 0.012, 8, 48]} />
                </mesh>
              </group>
            </group>
          </group>
        ))}
      </Part>
      <Part id="brakes">
        {positions.map((p, i) => (
          <group key={i} position={[p.x, l.wheelR, p.s * (l.trackZ - 0.02)]}>
            <group ref={(r) => r && (spinners.current[4 + i] = r)}>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={mat('steel', '#7c8288')}>
                <cylinderGeometry args={[l.rimR - 0.045, l.rimR - 0.045, 0.032, 40]} />
              </mesh>
              {Array.from({ length: 12 }).map((_, k) => (
                <mesh key={k} position={[Math.cos(k * 0.5236) * (l.rimR - 0.08), Math.sin(k * 0.5236) * (l.rimR - 0.08), p.s * 0.017]} material={mat('dark')}>
                  <cylinderGeometry args={[0.005, 0.005, 0.004, 6]} />
                </mesh>
              ))}
            </group>
            <mesh
              position={[(p.front ? -1 : 1) * (l.rimR - 0.07) * 0.7, (l.rimR - 0.07) * 0.7, 0]}
              rotation={[0, 0, (p.front ? 1 : -1) * Math.PI * 0.25]}
              material={mat('paint', calColor)}
            >
              <boxGeometry args={[0.16, 0.06, 0.075]} />
            </mesh>
          </group>
        ))}
      </Part>
    </>
  );
}

function helixGeometry(r: number, h: number, turns: number, wire: number) {
  const pts: THREE.Vector3[] = [];
  const n = turns * 24;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r, t * h - h / 2, Math.sin(a) * r));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, wire, 6, false);
}

export function Suspension({ l, g, rig }: { l: Layout; g: Generation; rig: Rig }) {
  const springH = Math.min(0.32, l.belt - l.wheelR - 0.12);
  const spring = useMemo(() => helixGeometry(0.06, springH, 6, 0.008), [springH]);
  const corners = [
    { x: l.xFA, s: 1 },
    { x: l.xFA, s: -1 },
    { x: l.xRA, s: 1 },
    { x: l.xRA, s: -1 },
  ];
  const hubZ = l.trackZ - l.tireW / 2 - 0.04;
  const strutZ = hubZ - 0.1;
  const springCentreY = l.wheelR + 0.1 + springH / 2;
  const steel = mat('steel');
  return (
    <>
      <Part id="springs">
        {corners.map((c, i) => (
          <mesh key={i} geometry={spring} position={[c.x - 0.02, springCentreY, c.s * strutZ]} material={mat('paint', g.engine.hp > 400 ? '#d4a017' : '#3a3f46')} />
        ))}
      </Part>
      <Part id="dampers">
        {corners.map((c, i) => (
          <group key={i} position={[c.x - 0.02, 0, c.s * strutZ]}>
            <mesh position={[0, l.wheelR + 0.05 + springH * 0.35, 0]} material={mat('dark')}>
              <cylinderGeometry args={[0.025, 0.025, springH * 0.8, 14]} />
            </mesh>
            <mesh position={[0, l.wheelR + 0.1 + springH * 0.85, 0]} material={mat('chrome')}>
              <cylinderGeometry args={[0.009, 0.009, springH * 0.5, 10]} />
            </mesh>
          </group>
        ))}
      </Part>
      <Part id="controlArms">
        {corners.map((c, i) => (
          <group key={i}>
            <Rod from={v(c.x + 0.12, l.wheelR - 0.1, c.s * 0.32)} to={v(c.x, l.wheelR - 0.08, c.s * hubZ)} r={0.016} material={steel} />
            <Rod from={v(c.x - 0.14, l.wheelR - 0.1, c.s * 0.32)} to={v(c.x, l.wheelR - 0.08, c.s * hubZ)} r={0.016} material={steel} />
            <Rod from={v(c.x, l.wheelR + 0.05, c.s * 0.4)} to={v(c.x, l.wheelR + 0.06, c.s * hubZ)} r={0.012} material={steel} />
            <mesh position={[c.x, l.wheelR, c.s * hubZ]} rotation={[Math.PI / 2, 0, 0]} material={mat('dark')}>
              <cylinderGeometry args={[0.06, 0.06, 0.06, 16]} />
            </mesh>
          </group>
        ))}
        {/* subframes */}
        {[l.xFA, l.xRA].map((x) => (
          <mesh key={x} position={[x, l.wheelR - 0.11, 0]} material={mat('dark')}>
            <boxGeometry args={[0.32, 0.05, 0.7]} />
          </mesh>
        ))}
      </Part>
      <Part id="steeringRack">
        <Rod from={v(rig.steeringRackX, l.wheelR + 0.02, -0.34)} to={v(rig.steeringRackX, l.wheelR + 0.02, 0.34)} r={0.022} material={mat('alu')} />
        {[1, -1].map((s) => (
          <Rod key={s} from={v(rig.steeringRackX, l.wheelR + 0.02, s * 0.34)} to={v(l.xFA + (rig.steeringRackX > l.xFA ? 0.1 : -0.1), l.wheelR, s * (hubZ - 0.02))} r={0.009} material={steel} />
        ))}
        <Rod
          from={v(rig.steeringRackX, l.wheelR + 0.04, l.driverZ * 0.7)}
          to={v(l.frontSeatX + 0.42, l.floor + 0.55, l.driverZ)}
          r={0.016}
          material={steel}
        />
      </Part>
    </>
  );
}

/** Spoke patterns for the rim face (local XY plane, facing +Z). */
function RimFace({ R, style, n, face }: { R: number; style: string; n: number; face: THREE.Material }) {
  const dark = mat('dark', '#1b1c1f');
  const spoke = (a: number, r0: number, r1: number, w: number, key: string, skew = 0) => (
    <mesh key={key} rotation={[0, 0, a + skew]} position={[Math.cos(a) * (r0 + r1) / 2, Math.sin(a) * (r0 + r1) / 2, 0]} material={face}>
      <boxGeometry args={[r1 - r0, w, 0.028]} />
    </mesh>
  );
  const out: JSX.Element[] = [];
  const r0 = 0.06;
  const r1 = R - 0.012;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    switch (style) {
      case 'five':
      case 'classic':
        out.push(spoke(a, r0, r1, R * 0.17, `s${k}`));
        break;
      case 'double':
        out.push(spoke(a - 0.07, r0, r1, R * 0.07, `a${k}`), spoke(a + 0.07, r0, r1, R * 0.07, `b${k}`));
        break;
      case 'multi':
        out.push(spoke(a, r0, r1, R * 0.06, `m${k}`));
        break;
      case 'y':
        out.push(spoke(a, r0, R * 0.55, R * 0.09, `y${k}`));
        out.push(spoke(a - 0.13, R * 0.5, r1, R * 0.055, `yl${k}`, -0.12), spoke(a + 0.13, R * 0.5, r1, R * 0.055, `yr${k}`, 0.12));
        break;
      case 'mesh':
        out.push(spoke(a, r0, r1, R * 0.035, `p${k}`, 0.45), spoke(a, r0, r1, R * 0.035, `q${k}`, -0.45));
        break;
      case 'turbine':
        out.push(spoke(a, r0, r1, R * 0.08, `t${k}`, 0.55));
        break;
      case 'aero':
        out.push(
          <mesh key={`h${k}`} rotation={[0, 0, a]} position={[Math.cos(a) * R * 0.72, Math.sin(a) * R * 0.72, 0.016]} material={dark}>
            <boxGeometry args={[R * 0.32, R * 0.16, 0.004]} />
          </mesh>,
        );
        break;
    }
  }
  if (style === 'aero')
    out.push(
      <mesh key="disc" rotation={[Math.PI / 2, 0, 0]} material={face}>
        <cylinderGeometry args={[r1, r1, 0.028, 48]} />
      </mesh>,
    );
  if (style === 'mesh') out.push(<mesh key="lip" material={face}><torusGeometry args={[R * 0.45, 0.008, 6, 40]} /></mesh>);
  return <>{out}</>;
}

import { Edges } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SYSTEMS } from '../data/parts';
import type { Brand, Generation } from '../data/types';
import { sim, useStore } from '../store';
import type { Layout } from './layout';
import { mat } from './materials';
import { Part } from './Part';
import { Pipe, RoundBox } from './prims';
import type { Rig } from './rig';

const FIRING: Record<string, number[]> = {
  I4: [1, 3, 4, 2],
  I5: [1, 2, 4, 5, 3],
  I6: [1, 5, 3, 6, 2, 4],
  V6: [1, 4, 3, 6, 2, 5],
  V8: [1, 5, 4, 8, 6, 3, 7, 2],
  V10: [1, 6, 5, 10, 2, 7, 3, 8, 4, 9],
  V12: [1, 12, 5, 8, 3, 10, 6, 7, 2, 11, 4, 9],
};

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

interface Cyl {
  i: number;
  bank: number;
  x: number;
  theta: number; // bank angle about X
  dir: THREE.Vector3; // cylinder axis
  outer: THREE.Vector3; // points away from engine centre-line
  fire: number; // crank angle at which this cylinder fires (0..4π)
}

export function Engine({ l, g, brand, rig }: { l: Layout; g: Generation; brand: Brand; rig: Rig }) {
  const e = l.engine!;
  const r = e.stroke / 2;
  const rodL = e.stroke * 1.55;
  const pistonH = e.bore * 0.55;
  const cyl = l.cyl;

  const cyls = useMemo<Cyl[]>(() => {
    const order = FIRING[g.engine.layout] ?? FIRING.I4;
    const out: Cyl[] = [];
    for (let b = 0; b < e.banks; b++) {
      const theta = e.banks === 1 ? 0 : (b === 0 ? 1 : -1) * (e.bankAngle / 2);
      const sgn = b === 0 ? 1 : -1;
      for (let k = 0; k < e.cylPerBank; k++) {
        const i = b * e.cylPerBank + k;
        const x = e.length / 2 - 0.05 - e.pitch * (k + 0.5) - (b === 1 ? e.pitch * 0.5 : 0);
        out.push({
          i,
          bank: b,
          x,
          theta,
          dir: v(0, Math.cos(theta), Math.sin(theta)),
          outer: v(0, -Math.sin(theta), Math.cos(theta)).multiplyScalar(sgn),
          fire: (order.indexOf(i + 1) * Math.PI * 4) / cyl,
        });
      }
    }
    return out;
  }, [e, g.engine.layout, cyl]);

  const pistons = useRef<THREE.Mesh[]>([]);
  const rods = useRef<THREE.Mesh[]>([]);
  const flashes = useRef<THREE.Mesh[]>([]);
  const crank = useRef<THREE.Group>(null!);
  const cams = useRef<THREE.Group[]>([]);
  const turbines = useRef<THREE.Group[]>([]);

  const tmp = useMemo(() => ({ pin: new THREE.Vector3(), top: new THREE.Vector3(), q: new THREE.Quaternion() }), []);

  useFrame(() => {
    const C = sim.crank;
    const running = useStore.getState().running;
    for (const c of cyls) {
      const th = C - c.fire;
      const a = c.theta + th;
      tmp.pin.set(c.x, r * Math.cos(a), r * Math.sin(a));
      const s = r * Math.cos(th) + Math.sqrt(rodL * rodL - r * r * Math.sin(th) * Math.sin(th));
      tmp.top.copy(c.dir).multiplyScalar(s).setX(c.x);
      const p = pistons.current[c.i];
      if (p) p.position.copy(c.dir).multiplyScalar(s + pistonH * 0.3).setX(c.x);
      const rod = rods.current[c.i];
      if (rod) {
        rod.position.copy(tmp.pin).add(tmp.top).multiplyScalar(0.5);
        const d = tmp.top.clone().sub(tmp.pin);
        rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      }
      const f = flashes.current[c.i];
      if (f) {
        const phase = ((th % (Math.PI * 4)) + Math.PI * 4) % (Math.PI * 4);
        const k = running && phase < 1.1 ? 1 - phase / 1.1 : 0;
        f.visible = k > 0.01 && sim.xray > 0.2;
        f.scale.setScalar(0.4 + k * 0.8);
        (f.material as THREE.MeshBasicMaterial).opacity = k;
      }
    }
    if (crank.current) crank.current.rotation.x = C;
    for (const cm of cams.current) if (cm) cm.rotation.x = C / 2;
    for (const t of turbines.current) if (t) t.rotation.x += running ? 0.15 + sim.rpm / 9000 : 0;
  });

  const blockMat = useMemo(() => {
    const m = mat('alu').clone();
    m.transparent = true;
    m.opacity = 0.22;
    m.depthWrite = false;
    return m;
  }, []);
  const perf = g.engine.hp >= 420;
  const coverColor = perf ? (brand.id === 'bmw' ? '#2c2f35' : brand.id === 'audi' ? '#a0141e' : '#1b1c1f') : '#2f3238';
  const coverMat = useMemo(() => {
    const m = mat('paint', coverColor).clone();
    m.transparent = true;
    m.opacity = 0.55;
    return m;
  }, [coverColor]);
  const bankLen = e.cylPerBank * e.pitch + 0.06;
  const edge = SYSTEMS.engine.color;

  const banks = Array.from({ length: e.banks }, (_, b) => cyls.find((c) => c.bank === b)!);
  const bankCentreX = (b: number) => (b === 1 ? -e.pitch * 0.25 : e.banks === 2 ? e.pitch * 0.25 : 0);
  const headY = e.deckH + 0.045;

  const exhaustOut = (c: Cyl) => (g.engine.hotV ? c.outer.clone().negate() : c.outer.clone());
  const intakeOut = (c: Cyl) => (g.engine.hotV ? c.outer.clone() : c.outer.clone().negate());
  const port = (c: Cyl, side: THREE.Vector3) => c.dir.clone().multiplyScalar(headY).add(side.clone().multiplyScalar(e.bore * 0.95)).setX(c.x);

  const nearestTurbo = (c: Cyl) => {
    if (!rig.turbos.length) return null;
    if (g.engine.hotV && rig.turbos.length === 2) return rig.turbos[c.bank];
    return rig.turbos.reduce((best, t) => (Math.abs(t.local.x - c.x) < Math.abs(best.local.x - c.x) ? t : best));
  };
  const collector = (c: Cyl) =>
    e.banks === 2 ? v(0, e.deckH * 0.3, (c.bank === 0 ? 1 : -1) * e.bore * 1.9) : v(0, e.deckH * 0.45, e.bore * 0.9 + 0.12);

  return (
    <group position={[e.x, e.y, e.z]} rotation={[0, rig.engineRotY, 0]}>
      <group rotation={[rig.engineSlant, 0, 0]}>
      <Part id="engineBlock">
        {e.banks === 1 ? (
          <mesh position={[0, (e.deckH - 0.07) / 2, 0]} material={blockMat}>
            <boxGeometry args={[e.length, e.deckH + 0.07, e.bore * 1.8]} />
            <Edges color={edge} threshold={20} />
          </mesh>
        ) : (
          <>
            <mesh position={[0, -0.01, 0]} material={blockMat}>
              <boxGeometry args={[e.length, 0.12, e.bore * 2.4]} />
              <Edges color={edge} threshold={20} />
            </mesh>
            {banks.map((c, b) => (
              <mesh
                key={b}
                position={c.dir.clone().multiplyScalar(e.deckH * 0.55).setX(bankCentreX(b))}
                rotation={[c.theta, 0, 0]}
                material={blockMat}
              >
                <boxGeometry args={[bankLen, e.deckH * 0.9, e.bore * 1.6]} />
                <Edges color={edge} threshold={20} />
              </mesh>
            ))}
          </>
        )}
        <RoundBox size={[e.length * 0.9, 0.1, e.bore * (e.banks === 2 ? 2.2 : 1.6)]} radius={0.02} material={mat('dark')} position={[0, -0.13, 0]} />
        {/* flywheel / bellhousing face */}
        <mesh position={[-e.length / 2 - 0.01, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mat('steel')}>
          <cylinderGeometry args={[0.15, 0.15, 0.025, 36]} />
        </mesh>
        {/* front timing cover */}
        <mesh position={[e.length / 2 + 0.015, e.deckH * 0.4, 0]} material={mat('dark')}>
          <boxGeometry args={[0.03, e.deckH * 1.2, e.bore * (e.banks === 2 ? 2.6 : 1.6)]} />
        </mesh>
      </Part>

      <Part id="cylinderHead">
        {banks.map((c, b) => {
          const pos = c.dir.clone().multiplyScalar(headY).setX(bankCentreX(b));
          const cover = c.dir.clone().multiplyScalar(headY + 0.075).setX(bankCentreX(b));
          return (
            <group key={b}>
              <mesh position={pos} rotation={[c.theta, 0, 0]} material={mat('alu')}>
                <boxGeometry args={[bankLen, 0.08, e.bore * 1.85]} />
              </mesh>
              <group position={cover} rotation={[c.theta, 0, 0]}>
                <RoundBox size={[bankLen - 0.02, 0.07, e.bore * 1.7]} radius={0.025} material={coverMat} />
                {[-1, 1].map((s) => (
                  <group key={s} position={[0, -0.005, s * e.bore * 0.42]} ref={(gr) => gr && (cams.current[b * 2 + (s + 1) / 2] = gr)}>
                    <mesh rotation={[0, 0, Math.PI / 2]} material={mat('steel')}>
                      <cylinderGeometry args={[0.011, 0.011, bankLen - 0.04, 10]} />
                    </mesh>
                    {cyls
                      .filter((cc) => cc.bank === b)
                      .map((cc) => (
                        <mesh key={cc.i} position={[cc.x - bankCentreX(b), 0, 0]} rotation={[cc.fire / 2 + (s > 0 ? 0 : 1.2), 0, 0]} material={mat('steel')}>
                          <boxGeometry args={[0.018, 0.04, 0.02]} />
                        </mesh>
                      ))}
                  </group>
                ))}
              </group>
            </group>
          );
        })}
      </Part>

      <Part id="pistons">
        {cyls.map((c) => (
          <group key={c.i}>
            <mesh ref={(m) => m && (pistons.current[c.i] = m)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), c.dir)} material={mat('alu', '#c9ced4')}>
              <cylinderGeometry args={[e.bore / 2 - 0.003, e.bore / 2 - 0.003, pistonH, 20]} />
            </mesh>
            <mesh ref={(m) => m && (rods.current[c.i] = m)} material={mat('steel')}>
              <boxGeometry args={[0.014, rodL, 0.022]} />
            </mesh>
            <mesh ref={(m) => m && (flashes.current[c.i] = m)} position={c.dir.clone().multiplyScalar(e.deckH - 0.02).setX(c.x)} userData={{ skipHighlight: true }} raycast={() => null}>
              <sphereGeometry args={[e.bore * 0.42, 16, 12]} />
              <meshBasicMaterial color="#ff8a2a" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </Part>

      <Part id="crankshaft">
        <group ref={crank}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={mat('steel', '#8a9097')}>
            <cylinderGeometry args={[0.022, 0.022, e.length + 0.02, 14]} />
          </mesh>
          {cyls.map((c) => {
            const a = c.theta - c.fire;
            return (
              <group key={c.i} position={[c.x, 0, 0]} rotation={[a, 0, 0]}>
                <mesh position={[0, r / 2, 0]} material={mat('steel', '#8a9097')}>
                  <boxGeometry args={[0.016, r + 0.05, 0.07]} />
                </mesh>
                <mesh position={[0, r, 0]} rotation={[0, 0, Math.PI / 2]} material={mat('chrome')}>
                  <cylinderGeometry args={[0.016, 0.016, 0.03, 12]} />
                </mesh>
                <mesh position={[0, -0.03, 0]} material={mat('steel', '#70767c')}>
                  <boxGeometry args={[0.016, 0.04, 0.09]} />
                </mesh>
              </group>
            );
          })}
        </group>
      </Part>

      <Part id="intake">
        {rig.plenums.map((p, k) => (
          <group key={k}>
            <RoundBox size={[e.length * 0.78, 0.08, 0.12]} radius={0.03} material={mat('plastic', '#25282d')} position={p.local} />
            <mesh position={[e.length * 0.39 + 0.03, p.local.y, p.local.z]} rotation={[0, 0, Math.PI / 2]} material={mat('alu')}>
              <cylinderGeometry args={[0.04, 0.04, 0.06, 18]} />
            </mesh>
            {cyls
              .filter((c) => p.side === 0 || e.banks === 1 || (c.bank === 0 ? 1 : -1) === p.side)
              .map((c) => (
                <Pipe
                  key={c.i}
                  points={[v(c.x, p.local.y, p.local.z), port(c, intakeOut(c)).add(intakeOut(c).multiplyScalar(0.06)).add(v(0, 0.03, 0)), port(c, intakeOut(c))]}
                  r={0.016}
                  material={mat('plastic', '#33363c')}
                  seg={10}
                />
              ))}
          </group>
        ))}
      </Part>

      <Part id="exhaustManifold">
        {cyls.map((c) => {
          const start = port(c, exhaustOut(c));
          const t = nearestTurbo(c);
          const end = t ? t.local.clone() : collector(c).setX(-e.length * 0.15);
          const mid = start.clone().add(exhaustOut(c).multiplyScalar(0.06)).lerp(end, 0.35);
          return <Pipe key={c.i} points={[start, mid, end]} r={0.017} material={mat('hot')} seg={14} />;
        })}
      </Part>

      {rig.turbos.length > 0 && (
        <Part id="turbo">
          {rig.turbos.map((t, k) => (
            <group key={k} position={t.local}>
              <mesh rotation={[0, Math.PI / 2, 0]} material={mat('hot', '#6b5544')}>
                <torusGeometry args={[0.045, 0.028, 10, 24]} />
              </mesh>
              <mesh position={[0.07, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mat('alu')}>
                <cylinderGeometry args={[0.058, 0.05, 0.06, 24]} />
              </mesh>
              <group position={[0.105, 0, 0]} ref={(gr) => gr && (turbines.current[k] = gr)}>
                {Array.from({ length: 9 }).map((_, b) => (
                  <mesh key={b} rotation={[(b / 9) * Math.PI * 2, 0, 0.4]} position={[0, 0, 0]} material={mat('chrome')}>
                    <boxGeometry args={[0.008, 0.08, 0.004]} />
                  </mesh>
                ))}
              </group>
            </group>
          ))}
        </Part>
      )}

      {rig.supercharger && (
        <Part id="supercharger">
          <group position={rig.supercharger}>
            <RoundBox size={[e.length * 0.7, 0.11, e.bore * 1.9]} radius={0.04} material={mat('alu', '#8f969e')} />
            <mesh position={[e.length * 0.36, 0.0, 0]} rotation={[0, 0, Math.PI / 2]} material={mat('dark')}>
              <cylinderGeometry args={[0.05, 0.05, 0.03, 24]} />
            </mesh>
          </group>
        </Part>
      )}
      </group>
    </group>
  );
}

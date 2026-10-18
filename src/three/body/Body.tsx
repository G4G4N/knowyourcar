import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { designFor } from '../../data/designs';
import type { Brand, Generation } from '../../data/types';
import { sim, useStore } from '../../store';
import type { Layout } from '../layout';
import { makeXrayMaterial, mat } from '../materials';
import { Part } from '../Part';
import { Rod, RoundBox } from '../prims';
import { buildBody, type BuiltBody } from './build';
import { badgeTexture, carbonTexture, grilleTexture, plateTexture } from './textures';

export function useBuiltBody(l: Layout, g: Generation, brand: Brand) {
  return useMemo(() => buildBody(l, designFor(g), g, brand), [l, g, brand]);
}

export function Body({ l, g, brand, paint, built }: { l: Layout; g: Generation; brand: Brand; paint: string; built: BuiltBody }) {
  const d = designFor(g);
  const B = built;

  const M = useMemo(() => {
    const physical = (p: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(p);
    const grilleMats = new Map<string, THREE.MeshStandardMaterial>();
    const grille = (t: string) => {
      if (!grilleMats.has(t)) grilleMats.set(t, new THREE.MeshStandardMaterial({ map: grilleTexture(t as never), metalness: 0.55, roughness: 0.38 }));
      return grilleMats.get(t)!;
    };
    return {
      paint: physical({ color: paint, metalness: 0.6, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.05 }),
      glass: physical({ color: '#0d141c', metalness: 0.65, roughness: 0.02, clearcoat: 1, envMapIntensity: 1.8 }),
      black: physical({ color: '#050607', metalness: 0.3, roughness: 0.12, clearcoat: 1 }),
      plastic: new THREE.MeshStandardMaterial({ color: '#121315', roughness: 0.8, metalness: 0.1 }),
      chrome: new THREE.MeshStandardMaterial({ color: '#f1f3f5', metalness: 1, roughness: 0.08 }),
      blue: new THREE.MeshStandardMaterial({ color: '#1c69d4', metalness: 0.6, roughness: 0.3, emissive: '#0b3a8a', emissiveIntensity: 0.6 }),
      carbon: new THREE.MeshPhysicalMaterial({ map: carbonTexture(), metalness: 0.5, roughness: 0.3, clearcoat: 1 }),
      shut: new THREE.MeshBasicMaterial({ color: '#040405' }),
      housing: physical({ color: '#1b1f25', metalness: 0.95, roughness: 0.12, clearcoat: 1 }),
      lens: new THREE.MeshStandardMaterial({ color: '#d9e4ee', metalness: 1, roughness: 0.05 }),
      led: new THREE.MeshBasicMaterial({ color: '#eaf6ff', toneMapped: false }),
      tail: physical({ color: '#4a0408', metalness: 0.3, roughness: 0.15, clearcoat: 1, emissive: '#5c0008', emissiveIntensity: 0.6 }),
      tailLed: new THREE.MeshBasicMaterial({ color: '#ff2638', toneMapped: false }),
      plateF: new THREE.MeshStandardMaterial({ map: plateTexture(d.details.plate ?? 'KY 1'), roughness: 0.5 }),
      plateR: new THREE.MeshStandardMaterial({ map: plateTexture(d.details.plate ?? 'KY 1'), roughness: 0.5 }),
      badge: new THREE.MeshStandardMaterial({ map: badgeTexture(d.details.badge ?? ''), transparent: true, alphaTest: 0.3, metalness: 0.9, roughness: 0.2 }),
      sideblade: physical({ color: d.details.sideblade ?? '#888', metalness: 0.8, roughness: 0.25, clearcoat: 1 }),
      dark: new THREE.MeshStandardMaterial({ color: '#1d1f23', metalness: 0.6, roughness: 0.45 }),
      rubber: new THREE.MeshStandardMaterial({ color: '#151617', roughness: 0.92 }),
      amber: new THREE.MeshBasicMaterial({ color: '#ffb547', toneMapped: false }),
      liner: new THREE.MeshStandardMaterial({ color: '#0b0c0e', roughness: 0.95, side: THREE.BackSide }),
      grille,
    };
  }, [paint, d]);

  // X-ray "scanner": a plane sweeps front-to-back; solid body on one side, ghost on the other.
  // Nothing is ever half-transparent, so there is no sorting shimmer during the transition.
  const clip = useMemo(() => ({ solid: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 99), ghost: new THREE.Plane(new THREE.Vector3(1, 0, 0), -99) }), []);
  useMemo(() => {
    for (const [k, v] of Object.entries(M)) if (k !== 'grille') (v as THREE.Material).clippingPlanes = [clip.solid];
    const orig = M.grille;
    M.grille = (t: string) => {
      const m = orig(t);
      m.clippingPlanes = [clip.solid];
      return m;
    };
  }, [M, clip]);

  const ghost = useMemo(() => {
    const m = makeXrayMaterial('#5fd4ff');
    m.clippingPlanes = [clip.ghost];
    return m;
  }, [clip]);
  const ghostGlass = useMemo(() => {
    const m = makeXrayMaterial('#9fe8ff');
    m.clippingPlanes = [clip.ghost];
    return m;
  }, [clip]);
  const solid = useRef<THREE.Group>(null!);
  const ghosts = useRef<THREE.Group>(null!);
  const scan = useRef<THREE.Mesh>(null!);

  useFrame((_, dt) => {
    const sel = useStore.getState().selected;
    ghost.uniforms.uIntensity.value = sim.xray * (sel ? 0.4 : 1);
    ghost.uniforms.uTime.value += dt;
    ghostGlass.uniforms.uIntensity.value = sim.xray * (sel ? 0.25 : 0.55);
    ghostGlass.uniforms.uTime.value = ghost.uniforms.uTime.value;
    const x = sim.xray;
    const e = x * x * (3 - 2 * x);
    const c = l.xFront + 0.08 + (l.xRear - 0.16 - l.xFront) * e;
    clip.solid.constant = c;
    clip.ghost.constant = -c;
    if (solid.current) solid.current.visible = x < 0.999;
    if (ghosts.current) ghosts.current.visible = x > 0.001;
    if (scan.current) {
      scan.current.visible = x > 0.002 && x < 0.998;
      scan.current.position.x = c;
    }
  });

  // per-car materials (shared procedural textures are cached and kept)
  useEffect(
    () => () => {
      for (const [k, v] of Object.entries(M)) if (k !== 'grille') (v as THREE.Material).dispose();
    },
    [M],
  );
  useEffect(
    () => () => {
      for (const k of Object.keys(B) as (keyof BuiltBody)[]) {
        const v = B[k] as unknown;
        if (v instanceof THREE.BufferGeometry) v.dispose();
      }
    },
    [B],
  );

  const mesh = (geo: THREE.BufferGeometry | null, material: THREE.Material, key?: string) => (geo ? <mesh key={key} geometry={geo} material={material} /> : null);
  const frameMat = B.frames.color === 'blue' ? M.blue : B.frames.color === 'black' ? M.black : M.chrome;

  return (
    <group>
      <group ref={ghosts}>
        <mesh geometry={B.lower} material={ghost} raycast={() => null} />
        {B.cabin && <mesh geometry={B.cabin} material={ghostGlass} raycast={() => null} />}
      </group>
      <mesh ref={scan} position={[0, l.H * 0.5, 0]} raycast={() => null} visible={false}>
        <boxGeometry args={[0.012, l.H * 1.15, l.W * 1.2]} />
        <meshBasicMaterial color="#7fe0ff" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={solid}>
      <Part id="body" shell>
        <mesh geometry={B.lower} material={M.paint} castShadow receiveShadow />
        {B.cabin && <mesh geometry={B.cabin} material={M.paint} castShadow />}
        {B.S.arches.map((a, i) => (
          <mesh key={i} position={[a.x, l.wheelR, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.liner}>
            <cylinderGeometry args={[a.r - 0.005, a.r - 0.005, l.W * 0.9, 36, 1, true, Math.PI / 2, Math.PI]} />
          </mesh>
        ))}
      </Part>

        <Part id="body" shell>
          {mesh(B.shutLines, M.shut)}
          {mesh(B.handles, d.details.handles === 'flush' ? M.black : brand.id === 'mercedes' ? M.chrome : M.paint)}
          {mesh(B.paintBits, M.paint)}
          {mesh(B.carbon, M.carbon)}
          {mesh(B.plastic, M.plastic)}
          {mesh(B.gills, M.black)}
          {mesh(B.sideblade, M.sideblade)}
          {mesh(B.trimBlack, M.black)}
          {mesh(B.plateF, M.plateF)}
          {mesh(B.plateR, M.plateR)}
          {mesh(B.badge, M.badge)}
          {B.logoRear && <Logo brand={brand} chrome={M.chrome} position={B.logoRear.pos} rotation={[0, -Math.PI / 2, 0]} scale={B.logoRear.scale} />}
          {B.roofRails &&
            [1, -1].map((s) => (
              <group key={s}>
                <Rod from={new THREE.Vector3(B.roofRails!.x0, B.roofRails!.y, s * B.roofRails!.z)} to={new THREE.Vector3(B.roofRails!.x1, B.roofRails!.y, s * B.roofRails!.z)} r={0.013} material={M.dark} />
                {[B.roofRails!.x0 + 0.05, B.roofRails!.x1 - 0.05].map((x) => (
                  <mesh key={x} position={[x, B.roofRails!.y - 0.02, s * B.roofRails!.z]} material={M.dark}>
                    <boxGeometry args={[0.06, 0.04, 0.03]} />
                  </mesh>
                ))}
              </group>
            ))}
          {B.wing && <Wing w={B.wing} paint={M.paint} carbon={M.carbon} dark={M.dark} />}
          {d.details.spareWheel && (
            <group position={[l.xRear - 0.1, d.beltR - 0.24, 0]} rotation={[0, Math.PI / 2, 0]}>
              <mesh material={M.rubber}>
                <torusGeometry args={[l.wheelR - 0.07, 0.085, 14, 40]} />
              </mesh>
              <mesh material={M.paint} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[l.wheelR - 0.1, l.wheelR - 0.1, 0.17, 32]} />
              </mesh>
              <Logo brand={brand} chrome={M.chrome} position={new THREE.Vector3(0, 0, -0.09)} rotation={[0, Math.PI, 0]} scale={1.6} />
            </group>
          )}
          {d.details.fenderLamps &&
            [1, -1].map((s) => (
              <group key={s} position={[l.xFront - 0.22, d.noseY + 0.035, s * (l.W / 2 - 0.09)]}>
                <RoundBox size={[0.11, 0.05, 0.07]} radius={0.015} material={M.housing} />
                <mesh position={[0.05, 0, 0]} userData={{ skipHighlight: true }} material={M.amber}>
                  <boxGeometry args={[0.012, 0.03, 0.05]} />
                </mesh>
              </group>
            ))}
        </Part>

        <Part id="glass" shell>
          {mesh(B.glass, M.glass)}
          {mesh(B.glassBlack, M.black)}
          {mesh(B.trimChrome, M.chrome)}
          {B.windscreen && (
            <group position={B.windscreen.pos} rotation={[0, 0, -B.windscreen.angle]}>
              <mesh material={M.glass}>
                <boxGeometry args={[B.windscreen.len, 0.008, B.windscreen.w]} />
              </mesh>
              <mesh position={[0, 0, 0]} material={M.black}>
                <boxGeometry args={[B.windscreen.len + 0.03, 0.006, 0.03]} />
              </mesh>
            </group>
          )}
        </Part>

        <Part id="grille" shell>
          {B.grilles.map((gr, i) => mesh(gr.geo, M.grille(gr.texture), `g${i}`))}
          {mesh(B.frames.geo, frameMat)}
          {B.logoFront && <Logo brand={brand} chrome={M.chrome} position={B.logoFront.pos} rotation={[0, Math.PI / 2, 0]} tilt={B.logoFront.tilt} scale={B.logoFront.scale} />}
          {B.hoodStar && <HoodStar position={B.hoodStar} chrome={M.chrome} />}
        </Part>

        <Part id="headlights" shell>
          {mesh(B.headHousing, M.housing)}
          {B.headLed && <mesh geometry={B.headLed} material={M.led} userData={{ skipHighlight: true }} />}
          {mesh(B.headLens, M.lens)}
        </Part>

        <Part id="taillights" shell>
          {mesh(B.tailHousing, M.tail)}
          {B.tailLed && <mesh geometry={B.tailLed} material={M.tailLed} userData={{ skipHighlight: true }} />}
        </Part>

        {B.mirror && (
          <Part id="mirrors" shell>
            {[1, -1].map((s) => (
              <group key={s} position={[B.mirror!.pos.x, B.mirror!.pos.y, s * B.mirror!.pos.z]}>
                <RoundBox size={[0.12, 0.1, 0.18]} radius={0.045} material={M.paint} />
                <mesh position={[-0.061, 0, 0]} material={M.black}>
                  <boxGeometry args={[0.005, 0.075, 0.15]} />
                </mesh>
                <RoundBox size={[0.1, 0.04, (B.mirror!.pos.z - B.mirror!.base) + 0.02]} radius={0.015} material={M.black} position={[0.0, -0.035, -s * ((B.mirror!.pos.z - B.mirror!.base) / 2)]} />
              </group>
            ))}
          </Part>
        )}
      </group>
    </group>
  );
}

function Wing({ w, paint, carbon, dark }: { w: NonNullable<BuiltBody['wing']>; paint: THREE.Material; carbon: THREE.Material; dark: THREE.Material }) {
  const blade = w.gt ? carbon : paint;
  return (
    <group position={[w.x, w.y, 0]}>
      <mesh material={blade} rotation={[0, 0, 0.12]}>
        <boxGeometry args={[w.chord, 0.02, w.span]} />
      </mesh>
      {w.gt &&
        [1, -1].map((s) => (
          <mesh key={s} position={[0, -0.02, (s * w.span) / 2]} material={carbon}>
            <boxGeometry args={[w.chord + 0.06, 0.16, 0.012]} />
          </mesh>
        ))}
      {[1, -1].map((s) => (
        <mesh key={s} position={[0.02, -(w.y - w.deckY) / 2, s * w.span * 0.3]} material={w.gt ? dark : paint}>
          <boxGeometry args={[w.gt ? 0.1 : 0.06, w.y - w.deckY + 0.02, w.gt ? 0.012 : 0.04]} />
        </mesh>
      ))}
    </group>
  );
}

function HoodStar({ position, chrome }: { position: THREE.Vector3; chrome: THREE.Material }) {
  return (
    <group position={position} rotation={[0, Math.PI / 2, 0]}>
      <mesh material={chrome}>
        <torusGeometry args={[0.03, 0.003, 8, 32]} />
      </mesh>
      {[90, 210, 330].map((deg) => (
        <mesh key={deg} material={chrome} rotation={[0, 0, (deg * Math.PI) / 180]} position={[Math.cos((deg * Math.PI) / 180) * 0.014, Math.sin((deg * Math.PI) / 180) * 0.014, 0]}>
          <boxGeometry args={[0.03, 0.004, 0.003]} />
        </mesh>
      ))}
      <mesh position={[0, -0.035, 0]} material={chrome}>
        <cylinderGeometry args={[0.004, 0.012, 0.012, 12]} />
      </mesh>
    </group>
  );
}

export function Logo({ brand, position, rotation, scale = 1, tilt = 0, chrome = mat('chrome') }: { brand: Brand; position: THREE.Vector3; rotation: [number, number, number]; scale?: number; tilt?: number; chrome?: THREE.Material }) {
  let inner: JSX.Element;
  if (brand.id === 'audi')
    inner = (
      <>
        {[-1.5, -0.5, 0.5, 1.5].map((i) => (
          <mesh key={i} position={[i * 0.05, 0, 0]} material={chrome}>
            <torusGeometry args={[0.033, 0.005, 10, 40]} />
          </mesh>
        ))}
      </>
    );
  else if (brand.id === 'bmw')
    inner = (
      <>
        <mesh material={chrome} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.008, 40]} />
        </mesh>
        <mesh material={mat('plastic', '#0a0a0a')} position={[0, 0, 0.0045]}>
          <circleGeometry args={[0.036, 40]} />
        </mesh>
        {[0, 1, 2, 3].map((q) => (
          <mesh key={q} position={[0, 0, 0.005]} material={mat('plastic', q % 2 ? '#f4f4f4' : '#2a7fd4')}>
            <circleGeometry args={[0.025, 16, (q * Math.PI) / 2, Math.PI / 2]} />
          </mesh>
        ))}
      </>
    );
  else
    inner = (
      <>
        <mesh material={chrome}>
          <torusGeometry args={[0.045, 0.005, 10, 48]} />
        </mesh>
        {[90, 210, 330].map((deg) => (
          <mesh key={deg} material={chrome} rotation={[0, 0, (deg * Math.PI) / 180]} position={[Math.cos((deg * Math.PI) / 180) * 0.021, Math.sin((deg * Math.PI) / 180) * 0.021, 0]}>
            <boxGeometry args={[0.045, 0.007, 0.005]} />
          </mesh>
        ))}
      </>
    );
  return (
    <group position={position} rotation={rotation}>
      <group rotation={[-tilt, 0, 0]} scale={scale}>
        {inner}
      </group>
    </group>
  );
}

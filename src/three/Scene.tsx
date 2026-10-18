import { ContactShadows, Environment, Grid, Lightformer, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitImpl } from 'three-stdlib';
import { sim, useCurrent, useStore } from '../store';
import { Car } from './Car';
import { partBounds } from './Part';

const GEAR_RATIOS = [4.7, 3.1, 2.1, 1.67, 1.29, 1.0, 0.84, 0.67, 0.6];

function Simulation() {
  const { generation: g } = useCurrent();
  useFrame((state, dt) => {
    dt = Math.min(dt, 0.05);
    const s = useStore.getState();
    const ev = g.engine.layout === 'EV';
    const idle = ev ? 0 : 850;
    const target = s.running ? idle + s.throttle * (g.engine.redline * (ev ? 0.85 : 0.97) - idle) : 0;
    sim.rpm += (target - sim.rpm) * Math.min(1, dt * (target > sim.rpm ? 2.5 : 1.6));
    const gear = Math.min(s.gear, g.gears);
    const wheelRpm = ev ? sim.rpm / 9 : s.throttle < 0.02 ? 0 : sim.rpm / (GEAR_RATIOS[gear - 1] * 3.2);
    const R = ((g.rimInches * 0.0254) / 2 + 0.08);
    sim.speedKmh += ((wheelRpm * 2 * Math.PI * R * 60) / 1000 - sim.speedKmh) * Math.min(1, dt * 3);
    const spd = (2 * Math.PI) / 60;
    sim.crank += sim.rpm * spd * dt * s.slowmo;
    sim.wheel += ((sim.speedKmh * 1000) / 60 / (2 * Math.PI * R)) * spd * dt * s.slowmo;
    sim.xray += ((s.xray ? 1 : 0) - sim.xray) * Math.min(1, dt * 3.2);
    if (Math.abs(sim.xray - (s.xray ? 1 : 0)) < 0.002) sim.xray = s.xray ? 1 : 0;
    sim.time = state.clock.elapsedTime;
  });
  return null;
}

/** Smoothly animates camera for view presets and part focus. */
function CameraRig() {
  const { camera, scene, gl } = useThree();
  const controls = useThree((s) => s.controls) as unknown as OrbitImpl | null;
  const { generation: g } = useCurrent();
  const view = useStore((s) => s.view);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const selected = useStore((s) => s.selected);
  const anim = useRef<{ p0: THREE.Vector3; p1: THREE.Vector3; t0: THREE.Vector3; t1: THREE.Vector3; k: number } | null>(null);

  const go = (pos: THREE.Vector3, target: THREE.Vector3) => {
    if (!controls) return;
    anim.current = { p0: camera.position.clone(), p1: pos, t0: controls.target.clone(), t1: target, k: 0 };
  };

  useEffect(() => {
    // pull back on narrow (portrait) screens so the whole car fits
    const L = (g.dims.length / 1000) * Math.max(1, 1.25 / aspect);
    const H = g.dims.height / 1000;
    const t = new THREE.Vector3(0, H * 0.42, 0);
    const p = {
      hero: new THREE.Vector3(L * 0.98, H * 1.1 + 0.7, L * 1.15),
      side: new THREE.Vector3(0.001, H * 0.55, L * 1.6),
      top: new THREE.Vector3(0.001, L * 1.65, 0.002),
      front: new THREE.Vector3(L * 1.35, H * 0.8, 0.001),
      rear: new THREE.Vector3(-L * 1.35, H * 0.8, 0.001),
    }[view.preset];
    go(p, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, controls]);

  useEffect(() => {
    if (!selected || !controls) return;
    // wait a frame so newly mounted parts are registered
    const id = requestAnimationFrame(() => {
      const box = partBounds(selected);
      if (!box) return;
      const c = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3()).length();
      const dir = camera.position.clone().sub(controls.target).normalize();
      dir.normalize();
      // keep the user's viewing direction, only lift it if we're looking from below the floor line
      if (dir.y < 0.35) {
        dir.y = 0;
        dir.normalize().multiplyScalar(0.92);
        dir.y = 0.35;
      }
      const current = camera.position.distanceTo(controls.target);
      const dist = THREE.MathUtils.clamp(Math.max(size * 2.6, current * 0.7), 2.8, 7);
      go(c.clone().add(dir.multiplyScalar(dist)), c);
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, controls]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => (anim.current = null);
    controls.addEventListener('start', stop);
    return () => controls.removeEventListener('start', stop);
  }, [controls]);

  // On phones the info sheet covers the lower screen, so render the car higher up.
  const size = useThree((s) => s.size);
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (size.width <= 900) cam.setViewOffset(size.width, size.height, 0, size.height * 0.17, size.width, size.height);
    // desktop: centre the car in the gap between the garage (left) and info (right) panels
    else cam.setViewOffset(size.width, size.height, (392 - 288) / 2, 0, size.width, size.height);
    cam.updateProjectionMatrix();
  }, [camera, size]);

  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __kyc: unknown }).__kyc = { camera, controls, scene, gl };
  }, [camera, controls, scene, gl]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (!a || !controls) return;
    a.k = Math.min(1, a.k + dt * 1.1);
    const e = a.k < 0.5 ? 4 * a.k * a.k * a.k : 1 - Math.pow(-2 * a.k + 2, 3) / 2;
    camera.position.lerpVectors(a.p0, a.p1, e);
    controls.target.lerpVectors(a.t0, a.t1, e);
    controls.update();
    if (a.k >= 1) anim.current = null;
  });
  return null;
}

function Floor() {
  const grid = useRef<THREE.Group>(null!);
  const genId = useStore((s) => s.genId);
  const real = useStore((s) => s.realModel);
  const shadowKey = `${genId}-${real ?? 'gen'}`;
  useFrame(() => {
    grid.current.visible = sim.xray > 0.05;
  });
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial color="#0d1118" roughness={0.9} metalness={0.1} />
      </mesh>
      <group ref={grid}>
        <Grid position={[0, 0.002, 0]} args={[40, 40]} cellSize={0.25} cellThickness={0.6} cellColor="#16425a" sectionSize={1} sectionThickness={1.1} sectionColor="#2aa5d6" fadeDistance={22} fadeStrength={1.5} infiniteGrid />
      </group>
      {/* baked for a burst of frames after each car / model change instead of re-rendering the scene every frame */}
      <ContactShadows key={shadowKey} frames={90} position={[0, 0.003, 0]} opacity={0.75} scale={14} blur={2.4} far={2} resolution={512} color="#000000" />
    </>
  );
}

export function Scene() {
  const { brand, generation } = useCurrent();
  const select = useStore((s) => s.select);
  // If the GPU drops the WebGL context anyway (driver reset, memory pressure), rebuild the canvas
  // instead of leaving a black view.
  const [epoch, setEpoch] = useState(0);
  return (
    <Canvas
      key={epoch}
      dpr={[1, 1.5]}
      camera={{ position: [5, 2.2, 5.5], fov: 34, near: 0.2, far: 120 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onPointerMissed={(e) => e.type === 'click' && select(null)}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.domElement.addEventListener(
          'webglcontextlost',
          (e) => {
            e.preventDefault();
            setTimeout(() => setEpoch((n) => n + 1), 300);
          },
          { once: true },
        );
      }}
    >
      <color attach="background" args={['#0a0d13']} />
      <fog attach="fog" args={['#0a0d13', 12, 34]} />
      <hemisphereLight intensity={0.35} color="#cfe6ff" groundColor="#1a1410" />
      {/* no shadow maps: re-rendering a 500k-triangle model into a shadow map every frame cost
          frame time and produced self-shadowing shimmer; the contact shadow grounds the car instead */}
      <directionalLight position={[6, 9, 4]} intensity={1.6} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[-6, 2, 3]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[6, 2, -3]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="ring" color="#5fd4ff" intensity={2} position={[0, 3, -8]} scale={4} />
        <Lightformer form="rect" color="#ffd9b0" intensity={1} position={[0, 1, 8]} scale={[8, 1.5, 1]} />
      </Environment>
      <Suspense fallback={null}>
        <Car key={`${brand.id}-${generation.id}`} g={generation} brand={brand} />
      </Suspense>
      <Floor />
      <Simulation />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={1.2}
        maxDistance={30}
        maxPolarAngle={Math.PI * 0.495}
        onStart={() => {
          sim.dragging = true;
          useStore.getState().hover(null);
        }}
        onEnd={() => (sim.dragging = false)}
      />
      <CameraRig />
      <EffectComposer multisampling={4}>
        {/* high threshold: only LEDs / X-ray glow bloom, not sparkly paint highlights that shimmer as the view moves */}
        <Bloom intensity={0.55} luminanceThreshold={0.92} luminanceSmoothing={0.12} mipmapBlur />
        <Vignette eskil={false} offset={0.2} darkness={0.65} />
      </EffectComposer>
    </Canvas>
  );
}

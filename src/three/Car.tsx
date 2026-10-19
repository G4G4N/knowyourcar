import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import type { Brand, Generation } from '../data/types';
import { modelUrls, loadAlignment } from '../data/models';
import { sim, useStore } from '../store';
import { Body, useBuiltBody } from './body/Body';
import { Suspension, Wheels } from './Chassis';
import { Engine } from './Engine';
import { Flows } from './Flows';
import { computeLayout, type Layout } from './layout';
import { partRegistry } from './Part';
import { ModelBoundary, RealModel } from './RealModel';
import { computeRig } from './rig';
import { AirIntake, Cooling, Drivetrain, Electric, Exhaust, Fuel, Interior } from './Systems';

export function Car({ g, brand }: { g: Generation; brand: Brand }) {
  const l = useMemo(() => computeLayout(g, brand), [g, brand]);
  const built = useBuiltBody(l, g, brand);
  // Mechanicals follow the real model's actual wheels when one is loaded
  const realWheels = useStore((s) => (s.realModel === g.id ? s.realWheels : null));
  const li = useMemo(() => fitToWheels(l, g, realWheels), [l, g, realWheels]);
  const rig = useMemo(() => computeRig(li, g, brand, (y, z) => built.S.endX(y, z, -1)), [li, g, brand, built]);

  // Little drop-in when a new car loads
  const root = useRef<THREE.Group>(null!);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current = Math.min(1, t.current + dt * 1.6);
    const e = 1 - Math.pow(1 - t.current, 3);
    root.current.position.y = (1 - e) * 0.6;
    root.current.rotation.y = (1 - e) * -0.5;
  });

  useEffect(() => {
    const id = requestAnimationFrame(() =>
      useStore.getState().setAvailable([...partRegistry.entries()].filter(([, set]) => set.size > 0).map(([k]) => k)),
    );
    return () => cancelAnimationFrame(id);
  }, [g, brand]);

  const custom = useStore((s) => s.customModels[g.id]);
  const storedAlign = useStore((s) => s.aligns[g.id]);
  const align = useMemo(() => storedAlign ?? loadAlignment(g.id), [storedAlign, g.id]);
  const modelUrl = custom?.url ?? modelUrls[g.id];
  const procedural = <Body l={l} g={g} brand={brand} built={built} paint={g.paint} />;

  return (
    <group ref={root}>
      {modelUrl ? (
        <ModelBoundary key={modelUrl} fallback={procedural} onError={(m) => useStore.getState().setModelError(`Couldn't load that model: ${m}`)}>
          {/* no stand-in body while it downloads: ModelLoader (ui) shows progress instead */}
          <Suspense fallback={null}>
            <RealModel url={modelUrl} l={l} align={align} genId={g.id} />
          </Suspense>
        </ModelBoundary>
      ) : (
        procedural
      )}
      <HideWithRealModel genId={g.id} hasModel={!!modelUrl}>
        <Wheels l={li} g={g} brand={brand} />
      </HideWithRealModel>
      {/* the real model has its own visible mechanicals; ours appear in X-ray */}
      <HideWithRealModel genId={g.id} hasModel={!!modelUrl}>
        <Suspension l={li} g={g} rig={rig} />
        {li.engine && <Engine l={li} g={g} brand={brand} rig={rig} />}
        <AirIntake rig={rig} />
        <Exhaust rig={rig} />
        <Drivetrain l={li} g={g} rig={rig} />
        <Cooling l={li} rig={rig} />
        <Fuel rig={rig} />
        <Electric rig={rig} />
        <Interior l={li} g={g} brand={brand} />
      </HideWithRealModel>
      <Flows l={li} rig={rig} />
    </group>
  );
}

/**
 * The real model brings its own wheels and cabin; ours only appear in X-ray. While it is still
 * loading, show nothing (not a generated car); if it fails, the generated car stands in fully.
 */
function HideWithRealModel({ children, genId, hasModel }: { children: ReactNode; genId: string; hasModel: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(() => {
    const s = useStore.getState();
    const loaded = s.realModel === genId;
    const show = !hasModel || !!s.modelError || (loaded && sim.xray > 0.5);
    if (ref.current) ref.current.visible = show;
  });
  return <group ref={ref}>{children}</group>;
}

/**
 * Shift the mechanical layout so axles, wheel size and track match the loaded model's wheels.
 * Ignored if the detection looks implausible.
 */
function fitToWheels(l: Layout, g: Generation, w: { xFA: number; xRA: number; wheelR: number; trackZ: number } | null): Layout {
  if (!w) return l;
  const dF = w.xFA - l.xFA;
  const dR = w.xRA - l.xRA;
  const k = w.wheelR / l.wheelR;
  if (Math.abs(dF) > 0.6 || Math.abs(dR) > 0.6 || k < 0.75 || k > 1.35 || Math.abs(w.trackZ - l.trackZ) > 0.3) return l;
  const dEngine = g.position === 'mid' ? dR : dF;
  const dCabin = (dF + dR) / 2;
  return {
    ...l,
    xFA: w.xFA,
    xRA: w.xRA,
    WB: w.xFA - w.xRA,
    wheelR: w.wheelR,
    rimR: l.rimR * k,
    trackZ: w.trackZ,
    xWs: l.xWs + dF,
    frontSeatX: l.frontSeatX + dCabin,
    rearSeatX: l.rearSeatX === null ? null : l.rearSeatX + dCabin,
    engine: l.engine && { ...l.engine, x: l.engine.x + dEngine },
  };
}

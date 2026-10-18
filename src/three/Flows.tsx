import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { sim, useStore } from '../store';
import type { Layout } from './layout';
import type { Rig } from './rig';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Glowing particles streaming along a path — shows what flows where in X-ray mode. */
function Flow({ points, color, count = 60, speed = 0.25, size = 0.035, rpmScale = true }: { points: THREE.Vector3[]; color: string; count?: number; speed?: number; size?: number; rpmScale?: boolean }) {
  const { geo, lut, seeds, matl } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const lut = curve.getSpacedPoints(256);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
    const seeds = Float32Array.from({ length: count }, () => Math.random());
    const matl = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uSize: { value: size }, uOpacity: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uSize;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uSize * 900.0 / max(0.05, -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = 1.0 - smoothstep(0.0, 0.5, d); // reversed smoothstep edges are undefined in GLSL
          gl_FragColor = vec4(uColor * (1.0 + a), a * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geo, lut, seeds, matl };
  }, [points, color, count, size]);

  const ref = useRef<THREE.Points>(null!);
  const t = useRef(0);
  useFrame((_, dt) => {
    const running = useStore.getState().running;
    const k = rpmScale ? 0.35 + sim.rpm / 2500 : 0.4 + sim.speedKmh / 60;
    if (running) t.current += dt * speed * k;
    matl.uniforms.uOpacity.value = Math.max(0, sim.xray * 1.2 - 0.2) * (running ? 1 : 0.25);
    ref.current.visible = sim.xray > 0.05;
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const u = (seeds[i] + t.current) % 1;
      const p = lut[Math.floor(u * (lut.length - 1))];
      pos.setXYZ(i, p.x, p.y, p.z);
    }
    pos.needsUpdate = true;
  });
  return <points ref={ref} geometry={geo} material={matl} frustumCulled={false} raycast={() => null} />;
}

export function Flows({ l, rig }: { l: Layout; rig: Rig }) {
  const flows = useMemo(() => {
    const out: { points: THREE.Vector3[]; color: string; count?: number; speed?: number; size?: number; rpmScale?: boolean }[] = [];
    if (rig.ice) {
      // fresh air: grille -> filter -> (turbo / intercooler) -> plenum
      const plenum = rig.engineToWorld(rig.plenums[0]?.local ?? v(0, 0.2, 0));
      const pts = [rig.grille.clone(), v(rig.grille.x - 0.1, rig.airFilter.y, rig.airFilter.z), rig.airFilter.clone()];
      if (rig.turbos.length) {
        pts.push(rig.engineToWorld(rig.turbos[0].local.clone().add(v(0.11, 0, 0))));
        if (rig.intercooler) pts.push(v(rig.radiator.x + 0.06, rig.radiator.y, -0.2), v(rig.radiator.x + 0.06, rig.radiator.y, 0.2));
      }
      pts.push(plenum);
      out.push({ points: pts, color: '#56c8ff', count: 70, speed: 0.22 });
      // exhaust gas
      for (const ex of rig.exhaust) {
        const end = ex.route[ex.route.length - 1];
        out.push({ points: [...ex.route, v(end.x - 0.5, end.y + 0.02, end.z)], color: '#ff6a3a', count: 80, speed: 0.2 });
      }
    }
    // electric energy: battery -> inverter -> motors
    if (rig.hvBattery) {
      const b = rig.hvBattery;
      const mid = v((b.x0 + b.x1) / 2, b.y + b.h + 0.02, 0);
      for (const m of [rig.motorRear, rig.motorFront]) {
        if (!m) continue;
        const end = m === rig.motorRear ? b.x0 : b.x1;
        out.push({ points: [mid, v(end, b.y + b.h + 0.03, 0.1), v(m.x, m.y + 0.17, 0.05), m.clone()], color: '#4dffa6', count: 50, speed: 0.25 });
      }
    }
    // torque: gearbox -> prop shaft -> diff -> wheels
    const torque = '#ffd23f';
    const hubZ = l.trackZ - 0.1;
    if (rig.propShaft) out.push({ points: [rig.propShaft.from, rig.propShaft.to], color: torque, count: 18, speed: 0.4, size: 0.03 });
    if (rig.frontProp) out.push({ points: [rig.frontProp.from, rig.frontProp.to], color: torque, count: 12, speed: 0.4, size: 0.03 });
    for (const [diff, x, on] of [
      [rig.rearDiff, l.xRA, rig.drivenRear],
      [rig.frontDiff, l.xFA, rig.drivenFront],
    ] as const) {
      if (!on) continue;
      const d = diff ?? v(x, l.wheelR, 0);
      for (const s of [1, -1]) out.push({ points: [d, v(x, l.wheelR, s * hubZ)], color: torque, count: 10, speed: 0.4, size: 0.03 });
    }
    return out;
  }, [l, rig]);

  return (
    <>
      {flows.map((f, i) => (
        <Flow key={i} {...f} />
      ))}
    </>
  );
}

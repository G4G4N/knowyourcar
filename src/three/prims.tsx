import { forwardRef, useMemo } from 'react';
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/** A cylinder spanning two points. */
export const Rod = forwardRef<THREE.Mesh, { from: THREE.Vector3; to: THREE.Vector3; r: number; r2?: number; material: THREE.Material; seg?: number }>(
  function Rod({ from, to, r, r2, material, seg = 16 }, ref) {
    const { pos, quat, len } = useMemo(() => {
      const d = to.clone().sub(from);
      return {
        len: d.length(),
        pos: from.clone().add(to).multiplyScalar(0.5),
        quat: new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize()),
      };
    }, [from, to]);
    return (
      <mesh ref={ref} position={pos} quaternion={quat} material={material}>
        <cylinderGeometry args={[r2 ?? r, r, len, seg]} />
      </mesh>
    );
  },
);

/** A smooth tube along a Catmull-Rom curve. */
export function Pipe({ points, r, material, seg = 64 }: { points: THREE.Vector3[]; r: number; material: THREE.Material; seg?: number }) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
    return new THREE.TubeGeometry(curve, seg, r, 10, false);
  }, [points, r, seg]);
  return <mesh geometry={geo} material={material} />;
}

export function curveFrom(points: THREE.Vector3[]) {
  return new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
}

/** Rounded box via ExtrudeGeometry with bevels. */
export function RoundBox({ size, radius = 0.02, material, position, rotation }: { size: [number, number, number]; radius?: number; material: THREE.Material; position?: [number, number, number] | THREE.Vector3; rotation?: [number, number, number] }) {
  const geo = useMemo(() => {
    const [w, h, d] = size;
    const r = Math.min(radius, w / 2.01, h / 2.01, d / 2.01);
    const s = new THREE.Shape();
    const x = -w / 2 + r;
    const y = -h / 2 + r;
    const ww = w - 2 * r;
    const hh = h - 2 * r;
    s.moveTo(x, y);
    s.lineTo(x + ww, y);
    s.lineTo(x + ww, y + hh);
    s.lineTo(x, y + hh);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 3, curveSegments: 4 });
    g.translate(0, 0, -(d - 2 * r) / 2);
    g.computeVertexNormals();
    return g;
  }, [size, radius]);
  return <mesh geometry={geo} material={material} position={position} rotation={rotation} />;
}

import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { PARTS, SYSTEMS, type PartId } from '../data/parts';
import { sim, useStore } from '../store';

/** Every mounted part's root object, used to frame the camera on a selection. */
export const partRegistry = new Map<PartId, Set<THREE.Object3D>>();

/** Re-publish which parts exist on the current car (after async models mount). */
export function refreshAvailable() {
  requestAnimationFrame(() =>
    useStore.getState().setAvailable([...partRegistry.entries()].filter(([, set]) => set.size > 0).map(([k]) => k)),
  );
}

export function partBounds(id: PartId): THREE.Box3 | null {
  const set = partRegistry.get(id);
  if (!set?.size) return null;
  const box = new THREE.Box3();
  set.forEach((o) => box.expandByObject(o));
  return box.isEmpty() ? null : box;
}

interface Props {
  id: PartId;
  children: ReactNode;
  /** Exterior shell: pick-through when X-ray is on, no system glow. */
  shell?: boolean;
  position?: [number, number, number] | THREE.Vector3;
  rotation?: [number, number, number];
}

type HMat = THREE.MeshStandardMaterial & { userData: { kycCloned?: boolean; baseOpacity: number; baseTransparent: boolean; baseEmissive: THREE.Color; baseColor: THREE.Color } };

export function Part({ id, children, shell = false, position, rotation }: Props) {
  const ref = useRef<THREE.Group>(null!);
  const mats = useRef<HMat[]>([]);
  const color = useRef(new THREE.Color(SYSTEMS[PARTS[id].system].color));

  useLayoutEffect(() => {
    const g = ref.current;
    if (!partRegistry.has(id)) partRegistry.set(id, new Set());
    partRegistry.get(id)!.add(g);
    return () => {
      partRegistry.get(id)?.delete(g);
    };
  }, [id]);

  // Clone materials per mesh (once) so each part can glow independently.
  useLayoutEffect(() => {
    const list: HMat[] = [];
    ref.current.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || mesh.userData.skipHighlight) return;
      let m = mesh.material as HMat;
      if (!(m as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
      if (!m.userData.kycCloned) {
        const planes = m.clippingPlanes;
        m = m.clone() as HMat;
        m.clippingPlanes = planes; // share live planes (clone() would copy them)
        m.userData = {
          kycCloned: true,
          baseOpacity: m.opacity,
          baseTransparent: m.transparent,
          baseEmissive: m.emissive.clone(),
          baseColor: m.color.clone(),
        };
        mesh.material = m;
      }
      list.push(m);
    });
    mats.current = list;
  });

  // Eased highlight state: no transparency toggles (those force shader swaps and sort popping),
  // just smoothly blended emissive glow and colour darkening.
  const anim = useRef({ glow: 0, dim: 0 });
  useFrame((_, dt) => {
    const s = useStore.getState();
    const sel = s.selected === id;
    const hov = s.hovered === id;
    const xr = sim.xray > 0.5;
    const sysDim = xr && !!s.system && s.system !== PARTS[id].system;
    const selDim = xr && !!s.selected && !sel;
    const targetDim = shell || hov ? 0 : sysDim ? 0.85 : selDim ? 0.7 : 0;
    const big = id === 'body' || id === 'glass';
    const targetGlow = big ? 0 : sel ? 0.3 : hov ? 0.2 : shell ? 0 : sim.xray * 0.1;
    const a = anim.current;
    const k = Math.min(1, dt * 9);
    a.glow += (targetGlow - a.glow) * k;
    a.dim += (targetDim - a.dim) * k;
    for (const m of mats.current) {
      const ud = m.userData;
      if (a.glow > 0.004) {
        m.emissive.copy(color.current);
        m.emissiveIntensity = a.glow * (1 - a.dim);
      } else {
        m.emissive.copy(ud.baseEmissive);
        m.emissiveIntensity = 1;
      }
      if (!shell) m.color.copy(ud.baseColor).multiplyScalar(1 - a.dim);
    }
  });

  const passThrough = () => shell && useStore.getState().xray;

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (passThrough()) return;
    e.stopPropagation();
    if (e.delta > 6) return; // was an orbit drag
    const s = useStore.getState();
    s.select(s.selected === id && s.tour === null ? null : id);
  };
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (passThrough() || sim.dragging) return;
    e.stopPropagation();
    useStore.getState().hover(id);
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    if (useStore.getState().hovered === id) useStore.getState().hover(null);
    document.body.style.cursor = '';
  };

  return (
    <group ref={ref} position={position} rotation={rotation} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      {children}
    </group>
  );
}

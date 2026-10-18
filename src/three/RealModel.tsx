import { useGLTF } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Component, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import type { Alignment } from '../data/models';
import { PARTS, SYSTEMS, type PartId } from '../data/parts';
import { sim, useStore } from '../store';
import type { Layout } from './layout';
import { makeXrayMaterial } from './materials';
import { acceleratedRaycast, computeBoundsTree } from 'three-mesh-bvh';
import { partRegistry, refreshAvailable } from './Part';

/** whole-word match where only letters count as part of a word (so `rim_FL` matches, `trim` doesn't) */
const W = (alts: string) => new RegExp(`(^|[^a-z])(${alts})([^a-z]|$)`);

/** Guess what a mesh is from its node / material names. */
function classify(names: string, xRel: number): PartId {
  const n = names.toLowerCase();
  if (/brake.?light|stop.?light|tail.?light|rear.?light|rueckleuchte/.test(n)) return 'taillights';
  if (/caliper|bremse/.test(n) || W('brakes?|rotors?|discs?|disks?').test(n)) return 'brakes';
  if (/steer|lenkrad/.test(n)) return 'steeringWheel';
  if (/wheel|felge|reifen/.test(n) || W('tires?|tyres?|rims?').test(n)) return 'wheels';
  if (/glass|window|windshield|windscreen|scheibe/.test(n)) return 'glass';
  if (/grill|kidney|niere/.test(n)) return 'grille';
  if (/mirror|spiegel/.test(n)) return 'mirrors';
  if (/seat|sitz/.test(n)) return 'seats';
  if (/dash|interior|cockpit|console/.test(n)) return 'dashboard';
  if (/exhaust|muffler|tailpipe|auspuff/.test(n)) return 'tailpipes';
  if (/headl|head_l|front.?light|drl/.test(n)) return 'headlights';
  if (/tail|rear.?light|back.?light|stop.?light/.test(n)) return 'taillights';
  if (/light|lamp|led/.test(n)) return xRel > 0 ? 'headlights' : 'taillights';
  return 'body';
}

function namesOf(o: THREE.Object3D) {
  const parts: string[] = [];
  let p: THREE.Object3D | null = o;
  for (let k = 0; p && k < 4; k++, p = p.parent) parts.push(p.name);
  const m = (o as THREE.Mesh).material;
  (Array.isArray(m) ? m : [m]).forEach((mm) => mm && parts.push(mm.name));
  return parts.join(' ');
}

type Std = THREE.MeshStandardMaterial & { userData: { baseEmissive?: THREE.Color; baseIntensity?: number } };

interface Prepared {
  root: THREE.Group;
  byPart: Map<PartId, THREE.Mesh[]>;
  pivots: THREE.Group[];
  ghosts: THREE.Mesh[];
  hasWheels: boolean;
  wheels: RealWheels | null;
}

export interface RealWheels {
  xFA: number;
  xRA: number;
  wheelR: number;
  trackZ: number;
  y: number;
}

function prepare(src: THREE.Object3D, l: Layout, align: Alignment, solidClip: THREE.Plane, ghostMat: THREE.ShaderMaterial): Prepared {
  const scene = src.clone(true);
  const meshes: THREE.Mesh[] = [];
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.material = Array.isArray(m.material) ? m.material.map((x) => x.clone()) : m.material.clone();
    meshes.push(m);
  });

  const holder = new THREE.Group();
  holder.add(scene);
  const root = new THREE.Group();
  root.add(holder);

  // drop strays: degenerate slivers and anything far bigger than / outside the main body (floors, stands)
  root.updateMatrixWorld(true);
  const boxes = new Map(meshes.map((m) => [m, new THREE.Box3().setFromObject(m, true)] as const));
  const dims = (bb: THREE.Box3) => bb.getSize(new THREE.Vector3()).toArray().sort((a, b) => b - a);
  const solid = meshes.filter((m) => {
    const d = dims(boxes.get(m)!);
    return d[0] > 0 && d[2] > d[0] * 0.02;
  });
  const coreBox = new THREE.Box3();
  solid.forEach((m) => coreBox.union(boxes.get(m)!));
  const core = solid.length ? coreBox : null;
  if (core) {
    const cb = core;
    const cs = cb.getSize(new THREE.Vector3());
    const grown = cb.clone().expandByVector(cs.clone().multiplyScalar(0.35));
    for (let i = meshes.length - 1; i >= 0; i--) {
      const bb = boxes.get(meshes[i])!;
      const s3 = bb.getSize(new THREE.Vector3());
      const d = dims(bb);
      const sliver = d[0] > cs.length() * 0.3 && d[1] < d[0] * 0.005;
      const outside = !grown.containsPoint(bb.getCenter(new THREE.Vector3())) || s3.x > cs.x * 1.6 + 1e-6 || s3.z > cs.z * 1.6 + 1e-6 || s3.y > cs.y * 1.6 + 1e-6;
      if (sliver || outside) {
        meshes[i].visible = false;
        meshes.splice(i, 1);
      }
    }
  }

  // precise = from vertices; the fast version inflates badly for meshes stored at an angle
  const box = () => {
    root.updateMatrixWorld(true);
    const bb = new THREE.Box3();
    for (const m of meshes) bb.expandByObject(m, true);
    return bb;
  };

  // 1. put the long axis along X: principal axis of the vertices in the ground plane (handles any yaw)
  root.updateMatrixWorld(true);
  const pts: THREE.Vector3[] = [];
  const tv = new THREE.Vector3();
  for (const m of meshes) {
    const pos = m.geometry.getAttribute('position');
    if (!pos) continue;
    const step = Math.max(1, Math.floor(pos.count / 1500));
    for (let i = 0; i < pos.count; i += step) pts.push(tv.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).clone());
  }
  let mx = 0;
  let mz = 0;
  for (const p of pts) {
    mx += p.x;
    mz += p.z;
  }
  mx /= Math.max(1, pts.length);
  mz /= Math.max(1, pts.length);
  let cxx = 0;
  let czz = 0;
  let cxz = 0;
  for (const p of pts) {
    const dx = p.x - mx;
    const dz = p.z - mz;
    cxx += dx * dx;
    czz += dz * dz;
    cxz += dx * dz;
  }
  // angle of the major axis measured from +X towards +Z; rotating about Y by +angle maps it onto +X
  const major = 0.5 * Math.atan2(2 * cxz, cxx - czz);
  holder.rotation.y = major + (align.yaw * Math.PI) / 180;
  let b = box();
  let s = b.getSize(new THREE.Vector3());
  if (s.z > s.x * 1.05) {
    holder.rotation.y += Math.PI / 2;
    b = box();
  }

  // 2. guess which end is the front: the roof's mass usually sits behind the middle of the car
  const centre = (b.min.x + b.max.x) / 2;
  const roofY = b.min.y + (b.max.y - b.min.y) * 0.85;
  let sumX = 0;
  let count = 0;
  const v = new THREE.Vector3();
  for (const m of meshes) {
    const pos = m.geometry.getAttribute('position');
    if (!pos) continue;
    const step = Math.max(1, Math.floor(pos.count / 2000));
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      if (v.y > roofY) {
        sumX += v.x;
        count++;
      }
    }
  }
  const roofBehind = count > 0 ? sumX / count < centre : true;
  if (!roofBehind) holder.rotation.y += Math.PI;
  if (align.flip) holder.rotation.y += Math.PI;
  b = box();

  // 3. scale to the real length, sit on the ground, nose at the real front
  s = b.getSize(new THREE.Vector3());
  holder.scale.setScalar(l.L / Math.max(1e-6, s.x));
  b = box();
  holder.position.set(l.xFront - b.max.x, -b.min.y, -(b.min.z + b.max.z) / 2);
  root.updateMatrixWorld(true);

  // sanity check: a single assembled car should match the real width/height once its length is right.
  // Game-asset "kits" with parts laid out side by side fail this.
  const sz = b.getSize(new THREE.Vector3());
  const hr = sz.y / l.H;
  const wr = sz.z / l.W;
  if (hr < 0.7 || hr > 1.45 || wr < 0.7 || wr > 1.5)
    throw new Error(`its proportions don't match a ${l.L.toFixed(2)} m car (height ×${hr.toFixed(2)}, width ×${wr.toFixed(2)}) — it may be a parts kit rather than an assembled car`);

  // 4. materials: clip for the X-ray scanner, add ghost twins, classify parts
  const byPart = new Map<PartId, THREE.Mesh[]>();
  const ghosts: THREE.Mesh[] = [];
  const wheelMeshes: THREE.Mesh[] = [];
  for (const m of meshes) {
    m.castShadow = true;
    const anyTransparent = (Array.isArray(m.material) ? m.material : [m.material]).some((mm) => mm.transparent);
    m.receiveShadow = !anyTransparent;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mm of mats) {
      mm.clippingPlanes = [solidClip];
      if (mm.transparent) mm.depthWrite = false;
      const std = mm as Std;
      if (std.emissive) std.userData = { ...std.userData, baseEmissive: std.emissive.clone(), baseIntensity: std.emissiveIntensity };
    }
    const wb = new THREE.Box3().setFromObject(m, true);
    const c = wb.getCenter(new THREE.Vector3());
    const id = classify(namesOf(m), c.x);
    m.userData.partId = id;
    if (!byPart.has(id)) byPart.set(id, []);
    byPart.get(id)!.push(m);
    // only spin pieces that are wheel-sized and sit at an axle
    const ws = wb.getSize(new THREE.Vector3());
    const nearAxle = Math.min(Math.abs(c.x - l.xFA), Math.abs(c.x - l.xRA)) < 0.9 && c.y < l.wheelR * 1.8 && Math.abs(c.z) > l.W * 0.22;
    const wheelSized = ws.x < l.wheelR * 2.8 && ws.y < l.wheelR * 2.8;
    // unnamed wheels: a round (x≈y), tyre-sized, narrow mesh centred low at a corner
    const looksRound = ws.y > l.wheelR * 1.3 && ws.y < l.wheelR * 2.6 && Math.abs(ws.x / ws.y - 1) < 0.25 && ws.z < ws.y * 0.75 && Math.abs(c.y - ws.y / 2) < l.wheelR * 0.35;
    if (nearAxle && wheelSized && (id === 'wheels' || (looksRound && id !== 'brakes'))) {
      wheelMeshes.push(m);
      if (id !== 'wheels') {
        m.userData.partId = 'wheels';
        byPart.get(id)!.splice(byPart.get(id)!.indexOf(m), 1);
        if (!byPart.has('wheels')) byPart.set('wheels', []);
        byPart.get('wheels')!.push(m);
      }
    }
    if (!(m as THREE.SkinnedMesh).isSkinnedMesh) {
      const gm = new THREE.Mesh(m.geometry, ghostMat);
      gm.raycast = () => null;
      gm.userData.ghost = true;
      m.add(gm);
      ghosts.push(gm);
    }
  }

  // 5. spinning wheels: group wheel meshes per corner and pivot them about their centre
  const pivots: THREE.Group[] = [];
  const corners = new Map<string, THREE.Mesh[]>();
  const midX = (l.xFA + l.xRA) / 2;
  for (const m of wheelMeshes) {
    const c = new THREE.Box3().setFromObject(m, true).getCenter(new THREE.Vector3());
    const key = `${c.x > midX ? 'f' : 'r'}${c.z > 0 ? 'r' : 'l'}`;
    if (!corners.has(key)) corners.set(key, []);
    corners.get(key)!.push(m);
  }
  const found: { front: boolean; c: THREE.Vector3; r: number }[] = [];
  for (const [key, list] of corners) {
    const bb = new THREE.Box3();
    list.forEach((m) => bb.expandByObject(m, true));
    const size = bb.getSize(new THREE.Vector3());
    if (size.x > l.wheelR * 3 || size.y > l.wheelR * 3) continue; // several wheels merged into one mesh: leave static
    found.push({ front: key[0] === 'f', c: bb.getCenter(new THREE.Vector3()), r: (size.x + size.y) / 4 });
    const pivot = new THREE.Group();
    pivot.position.copy(bb.getCenter(new THREE.Vector3()));
    root.add(pivot);
    pivot.updateMatrixWorld(true);
    list.forEach((m) => pivot.attach(m));
    pivots.push(pivot);
  }
  // the model's real wheel geometry, so the X-ray mechanicals can be lined up with it
  const fr = found.filter((f) => f.front);
  const rr = found.filter((f) => !f.front);
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  // a tyre touches the ground, so its centre height is its radius (detected rims are smaller than that)
  let wheels: RealWheels | null =
    fr.length && rr.length
      ? {
          xFA: avg(fr.map((f) => f.c.x)),
          xRA: avg(rr.map((f) => f.c.x)),
          wheelR: avg(found.map((f) => Math.max(f.r, f.c.y))),
          trackZ: avg(found.map((f) => Math.abs(f.c.z))),
          y: avg(found.map((f) => f.c.y)),
        }
      : null;
  if (!wheels) {
    // all four wheels merged into one mesh: read the axles off its bounding box
    for (const m of byPart.get('wheels') ?? []) {
      const bb = new THREE.Box3().setFromObject(m, true);
      const sz = bb.getSize(new THREE.Vector3());
      if (sz.x > l.WB * 0.8 && sz.x < l.L * 0.95 && sz.y > l.wheelR * 1.3 && sz.y < l.wheelR * 2.8 && sz.z > l.W * 0.6) {
        const r = sz.y / 2;
        wheels = { xFA: bb.max.x - r, xRA: bb.min.x + r, wheelR: (bb.min.y + bb.max.y) / 2, trackZ: sz.z / 2 - l.tireW / 2, y: (bb.min.y + bb.max.y) / 2 };
        break;
      }
    }
  }
  return { root, byPart, pivots, ghosts, hasWheels: found.length >= 2, wheels };
}

export function RealModel({ url, l, align, genId }: { url: string; l: Layout; align: Alignment; genId: string }) {
  const gltf = useGLTF(url, true);
  const clip = useMemo(() => ({ solid: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 99), ghost: new THREE.Plane(new THREE.Vector3(1, 0, 0), -99) }), []);
  const ghost = useMemo(() => {
    const m = makeXrayMaterial('#5fd4ff');
    m.clippingPlanes = [clip.ghost];
    return m;
  }, [clip]);
  const P = useMemo(() => prepare(gltf.scene, l, align, clip.solid, ghost), [gltf, l, align, clip, ghost]);
  const scan = useRef<THREE.Mesh>(null!);

  useLayoutEffect(() => {
    const added: [PartId, THREE.Object3D][] = [];
    P.byPart.forEach((list, id) =>
      list.forEach((m) => {
        if (!partRegistry.has(id)) partRegistry.set(id, new Set());
        partRegistry.get(id)!.add(m);
        added.push([id, m]);
      }),
    );
    useStore.getState().setRealModel(genId, P.hasWheels, P.wheels);
    refreshAvailable();
    return () => {
      added.forEach(([id, m]) => partRegistry.get(id)?.delete(m));
      if (useStore.getState().realModel === genId) useStore.getState().setRealModel(null);
    };
  }, [P, genId]);

  useEffect(() => () => ghost.dispose(), [ghost]);

  // Pointer picking against a ~500k triangle model costs ~20 ms per mouse move without an acceleration
  // structure, which made orbiting stutter. Build BVHs in idle time after the model appears.
  useEffect(() => {
    let cancelled = false;
    const meshes: THREE.Mesh[] = [];
    P.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && !m.userData.ghost) meshes.push(m);
    });
    let i = 0;
    const work = () => {
      const t0 = performance.now();
      while (!cancelled && i < meshes.length && performance.now() - t0 < 8) {
        const m = meshes[i++];
        const geo = m.geometry as THREE.BufferGeometry & { boundsTree?: unknown };
        if (!geo.boundsTree && geo.getAttribute('position')) computeBoundsTree.call(geo);
        m.raycast = acceleratedRaycast;
      }
      if (!cancelled && i < meshes.length) setTimeout(work, 0);
    };
    const id = setTimeout(work, 50);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [P]);

  const glow = useRef(new Map<PartId, number>());
  const colors = useMemo(() => new Map([...P.byPart.keys()].map((id) => [id, new THREE.Color(SYSTEMS[PARTS[id].system].color)])), [P]);
  useFrame((_, dt) => {
    const x = sim.xray;
    const e = x * x * (3 - 2 * x);
    const c = l.xFront + 0.08 + (l.xRear - 0.16 - l.xFront) * e;
    clip.solid.constant = c;
    clip.ghost.constant = -c;
    const sel = useStore.getState().selected;
    ghost.uniforms.uIntensity.value = sel ? 0.4 : 1;
    ghost.uniforms.uTime.value += dt;
    for (const g of P.ghosts) g.visible = x > 0.001;
    if (scan.current) {
      scan.current.visible = x > 0.002 && x < 0.998;
      scan.current.position.x = c;
    }
    for (const p of P.pivots) p.rotation.z = -sim.wheel;

    // highlight selected / hovered groups (only while the solid model is showing)
    const s = useStore.getState();
    P.byPart.forEach((list, id) => {
      const big = id === 'body' || id === 'glass';
      const target = x >= 0.5 ? 0 : big ? 0 : s.selected === id ? 0.2 : s.hovered === id ? 0.12 : 0;
      const cur = glow.current.get(id) ?? 0;
      const next = cur + (target - cur) * Math.min(1, dt * 7);
      glow.current.set(id, next);
      const col = colors.get(id)!;
      for (const m of list)
        for (const mm of Array.isArray(m.material) ? m.material : [m.material]) {
          const std = mm as Std;
          if (!std.emissive || !std.userData.baseEmissive) continue;
          if (next > 0.004) {
            std.emissive.copy(col);
            std.emissiveIntensity = next;
          } else {
            std.emissive.copy(std.userData.baseEmissive);
            std.emissiveIntensity = std.userData.baseIntensity ?? 1;
          }
        }
    });
  });

  const id = (e: ThreeEvent<PointerEvent | MouseEvent>) => (e.object.userData.partId as PartId | undefined) ?? 'body';
  return (
    <group
      onClick={(e) => {
        if (useStore.getState().xray) return; // let clicks reach the internals
        e.stopPropagation();
        if (e.delta > 6) return;
        const s = useStore.getState();
        const p = id(e);
        s.select(s.selected === p ? null : p);
      }}
      onPointerOver={(e) => {
        if (useStore.getState().xray || sim.dragging) return;
        e.stopPropagation();
        useStore.getState().hover(id(e));
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        useStore.getState().hover(null);
        document.body.style.cursor = '';
      }}
    >
      <primitive object={P.root} />
      <mesh ref={scan} position={[0, l.H * 0.5, 0]} raycast={() => null} visible={false}>
        <boxGeometry args={[0.012, l.H * 1.15, l.W * 1.2]} />
        <meshBasicMaterial color="#7fe0ff" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Falls back to the procedural body if a model file can't be loaded. */
export class ModelBoundary extends Component<{ fallback: ReactNode; onError: (msg: string) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: Error) {
    this.props.onError(err.message);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

import * as THREE from 'three';

/** Fresnel "X-ray" shader used for the ghosted body shell. */
export function makeXrayMaterial(color = '#5fd4ff') {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      #include <clipping_planes_pars_vertex>
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vW;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        vV = -mvPosition.xyz;
        vN = normalMatrix * normal; // normalized (with a zero guard) in the fragment shader
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <clipping_planes_pars_fragment>
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uTime;
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vW;
      void main() {
        #include <clipping_planes_fragment>
        // Guard every step: a facing-the-camera surface can give |dot| a hair above 1, and some
        // meshes carry zero-length normals. Either produced NaN, and bloom smeared NaN pixels over
        // the whole frame (black screen / black flashes from the top view or after part focus).
        float nl = length(vN);
        float vl = length(vV);
        vec3 n = nl > 1e-6 ? vN / nl : vec3(0.0, 0.0, 1.0);
        vec3 v = vl > 1e-6 ? vV / vl : vec3(0.0, 0.0, 1.0);
        float f = clamp(1.0 - abs(dot(n, v)), 0.0, 1.0);
        float rim = pow(f, 2.4);
        float d = (fract(vW.x * 0.35 - uTime * 0.18) - 0.5) * 14.0;
        float scan = exp(-d * d) * 0.35;
        float a = clamp((rim * 0.85 + 0.03 + scan * rim) * uIntensity, 0.0, 1.0);
        gl_FragColor = vec4(uColor * (0.5 + rim * 1.6 + scan), a);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    clipping: true,
  });
}

const cache = new Map<string, THREE.MeshStandardMaterial>();

/** Shared base materials for mechanical parts; Part clones them per mesh for highlighting. */
export function mat(kind: 'alu' | 'steel' | 'dark' | 'rubber' | 'chrome' | 'copper' | 'plastic' | 'leather' | 'carbon' | 'hot' | 'cell' | 'paint', tint?: string): THREE.MeshStandardMaterial {
  const key = kind + (tint ?? '');
  const hit = cache.get(key);
  if (hit) return hit;
  const presets: Record<string, THREE.MeshStandardMaterialParameters> = {
    alu: { color: '#a9b0b8', metalness: 0.85, roughness: 0.35 },
    steel: { color: '#6d737a', metalness: 0.9, roughness: 0.4 },
    dark: { color: '#2b2f35', metalness: 0.6, roughness: 0.5 },
    rubber: { color: '#151617', metalness: 0, roughness: 0.92 },
    chrome: { color: '#e6e8ea', metalness: 1, roughness: 0.12 },
    copper: { color: '#b8733c', metalness: 0.9, roughness: 0.35 },
    plastic: { color: '#1d2024', metalness: 0.1, roughness: 0.7 },
    leather: { color: '#3a2a22', metalness: 0, roughness: 0.75 },
    carbon: { color: '#1a1b1e', metalness: 0.4, roughness: 0.35 },
    hot: { color: '#5a4a40', metalness: 0.8, roughness: 0.45 },
    cell: { color: '#2d6a52', metalness: 0.4, roughness: 0.5 },
    paint: { color: '#c00', metalness: 0.5, roughness: 0.4 },
  };
  const m = new THREE.MeshStandardMaterial(presets[kind]);
  if (tint) m.color.set(tint);
  cache.set(key, m);
  return m;
}

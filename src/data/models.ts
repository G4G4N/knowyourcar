import { loadStoredAlignment, type Alignment } from './alignment';

/**
 * Real (artist-made) 3D models. Any `src/assets/models/<genId>.glb` is picked up automatically;
 * a dropped/loaded file overrides it for the current session.
 */

export interface ModelCredit {
  name?: string;
  author?: string;
  license?: string;
  url?: string;
  flip?: boolean;
  yaw?: number;
}

const files = import.meta.glob('../assets/models/*.{glb,gltf}', { eager: true, as: 'url' }) as Record<string, string>;
const creditFiles = import.meta.glob('../assets/models/credits.json', { eager: true, import: 'default' }) as Record<string, Record<string, ModelCredit>>;

export const bundledModels: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const id = path.split('/').pop()!.replace(/\.(glb|gltf)$/, '');
  bundledModels[id] = url;
}

export const credits: Record<string, ModelCredit> = Object.values(creditFiles)[0] ?? {};

export type { Alignment } from './alignment';

export function loadAlignment(genId: string): Alignment {
  return { flip: !!credits[genId]?.flip, yaw: 0, ...loadStoredAlignment(genId) };
}

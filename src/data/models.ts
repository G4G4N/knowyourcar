import { loadStoredAlignment, type Alignment } from './alignment';

/**
 * Real (artist-made) 3D models.
 *  - dev: any `src/assets/models/<genId>.glb` is picked up automatically (virtual:local-models)
 *  - deployed: models published to R2 by scripts/publish-models.mjs, listed in deployed-models.json
 * A dropped/loaded file overrides either for the current session.
 */
import localModels from 'virtual:local-models';
import deployed from './deployed-models.json';

export interface ModelCredit {
  name?: string;
  author?: string;
  license?: string;
  url?: string;
  flip?: boolean;
  yaw?: number;
}

export interface DeployedModel {
  file: string;
  bytes: number;
  sha256: string;
}

const creditFiles = import.meta.glob('../assets/models/credits.json', { eager: true, import: 'default' }) as Record<string, Record<string, ModelCredit>>;

const remoteBase = (import.meta.env.VITE_MODELS_URL || '/models').replace(/\/$/, '');
export const deployedModels = deployed as Record<string, DeployedModel>;

/** genId → URL of its real model */
export const modelUrls: Record<string, string> = {};
if (!import.meta.env.DEV) for (const [id, d] of Object.entries(deployedModels)) modelUrls[id] = `${remoteBase}/${d.file}`;
Object.assign(modelUrls, localModels);

export const credits: Record<string, ModelCredit> = Object.values(creditFiles)[0] ?? {};

export type { Alignment } from './alignment';

export function loadAlignment(genId: string): Alignment {
  return { flip: !!credits[genId]?.flip, yaw: 0, ...loadStoredAlignment(genId) };
}

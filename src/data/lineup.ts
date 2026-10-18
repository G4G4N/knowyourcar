import { BRANDS as ALL_BRANDS } from './catalog';
import { bundledModels } from './models';
import type { Brand } from './types';

/**
 * The cars the app offers: only generations with a real 3D model in src/assets/models.
 * Drop in another `<genId>.glb` and that generation appears automatically.
 */
export const BRANDS: Brand[] = ALL_BRANDS.map((b) => ({
  ...b,
  models: b.models
    .map((m) => ({ ...m, generations: m.generations.filter((g) => bundledModels[g.id]) }))
    .filter((m) => m.generations.length > 0),
})).filter((b) => b.models.length > 0);

export function findSelection(brandId: string, modelId: string, genId: string) {
  const brand = BRANDS.find((b) => b.id === brandId) ?? BRANDS[0];
  const model = brand.models.find((m) => m.id === modelId) ?? brand.models[0];
  const generation = model.generations.find((g) => g.id === genId) ?? model.generations[model.generations.length - 1];
  return { brand, model, generation };
}

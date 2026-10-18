/** Per-generation model alignment overrides, remembered in this browser. Kept free of asset imports
 * so adding model files never hot-reloads the store. */
export interface Alignment {
  flip: boolean;
  yaw: 0 | 90 | 180 | 270;
}

const KEY = 'kyc.align.';
export function loadStoredAlignment(genId: string): Partial<Alignment> {
  try {
    const raw = localStorage.getItem(KEY + genId);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
export function saveAlignment(genId: string, a: Alignment) {
  try {
    localStorage.setItem(KEY + genId, JSON.stringify(a));
  } catch {
    /* storage unavailable */
  }
}

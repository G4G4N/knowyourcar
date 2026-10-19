import { create } from 'zustand';
import { BRANDS, findSelection } from './data/lineup';
import type { PartId } from './data/parts';
import type { SystemId } from './data/types';
import { saveAlignment, type Alignment } from './data/alignment';

export type ViewPreset = 'hero' | 'side' | 'top' | 'front' | 'rear';

interface AppState {
  brandId: string;
  modelId: string;
  genId: string;
  xray: boolean;
  running: boolean;
  throttle: number; // 0..1
  slowmo: number; // visual time scale for engine internals
  gear: number;
  selected: PartId | null;
  hovered: PartId | null;
  system: SystemId | null;
  tour: number | null;
  sound: boolean;
  view: { preset: ViewPreset; n: number };
  panelOpen: boolean;
  /** phones: info sheet, system chips and dock tucked away */
  sheetHidden: boolean;
  available: PartId[];
  realModel: string | null;
  realModelWheels: boolean;
  realWheels: { xFA: number; xRA: number; wheelR: number; trackZ: number; y: number } | null;
  customModels: Record<string, { url: string; name: string }>;
  aligns: Record<string, Alignment>;
  modelError: string | null;

  selectCar: (brandId: string, modelId?: string, genId?: string) => void;
  setXray: (v: boolean) => void;
  setRunning: (v: boolean) => void;
  setThrottle: (v: number) => void;
  setSlowmo: (v: number) => void;
  setGear: (v: number) => void;
  select: (p: PartId | null) => void;
  hover: (p: PartId | null) => void;
  setSystem: (s: SystemId | null) => void;
  setTour: (i: number | null) => void;
  setSound: (v: boolean) => void;
  setView: (p: ViewPreset) => void;
  setPanelOpen: (v: boolean) => void;
  setSheetHidden: (v: boolean) => void;
  setAvailable: (v: PartId[]) => void;
  setRealModel: (genId: string | null, hasWheels?: boolean, wheels?: AppState['realWheels']) => void;
  setCustomModel: (genId: string, v: { url: string; name: string } | null) => void;
  setAlign: (genId: string, a: Alignment) => void;
  setModelError: (msg: string | null) => void;
}

const initial = (() => {
  const params = new URLSearchParams(location.hash.slice(1));
  const b = params.get('brand') ?? 'bmw';
  const m = params.get('model') ?? 'm3';
  const g = params.get('gen') ?? 'g80';
  const sel = findSelection(b, m, g);
  return { brandId: sel.brand.id, modelId: sel.model.id, genId: sel.generation.id };
})();

let hoverTimer: ReturnType<typeof setTimeout> | undefined;

export const useStore = create<AppState>((set, get) => ({
  ...initial,
  xray: false,
  running: true,
  throttle: 0.15,
  slowmo: 0.04,
  gear: 3,
  selected: null,
  hovered: null,
  system: null,
  tour: null,
  sound: false,
  view: { preset: 'hero', n: 0 },
  panelOpen: window.innerWidth > 900,
  sheetHidden: false,
  available: [],
  realModel: null,
  realModelWheels: false,
  realWheels: null,
  customModels: {},
  aligns: {},
  modelError: null,

  selectCar: (brandId, modelId, genId) => {
    const brand = BRANDS.find((b) => b.id === brandId) ?? BRANDS[0];
    const model = brand.models.find((m) => m.id === modelId) ?? brand.models[0];
    const gen = model.generations.find((g) => g.id === genId) ?? model.generations[model.generations.length - 1];
    set({
      brandId: brand.id,
      modelId: model.id,
      genId: gen.id,
      selected: null,
      tour: null,
      modelError: null,
      view: { preset: 'hero', n: get().view.n + 1 },
      ...(window.innerWidth <= 900 && { panelOpen: false }),
    });
  },
  setXray: (xray) => set({ xray }),
  setRunning: (running) => set({ running }),
  setThrottle: (throttle) => set({ throttle }),
  setSlowmo: (slowmo) => set({ slowmo }),
  setGear: (gear) => set({ gear }),
  select: (selected) => set({ selected, ...(selected && window.innerWidth <= 900 && { panelOpen: false, sheetHidden: false }) }),
  // Pointer out/over fire back-to-back when moving between neighbouring meshes; clearing the hover
  // a beat later stops the highlight and tooltip from blinking off and on.
  hover: (hovered) => {
    clearTimeout(hoverTimer);
    if (hovered) {
      if (get().hovered !== hovered) set({ hovered });
    } else hoverTimer = setTimeout(() => set({ hovered: null }), 90);
  },
  setSystem: (system) => set({ system }),
  setTour: (tour) => set({ tour }),
  setSound: (sound) => set({ sound }),
  setView: (preset) => set({ view: { preset, n: get().view.n + 1 } }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setSheetHidden: (sheetHidden) => set({ sheetHidden }),
  setAvailable: (available) => set({ available }),
  setRealModel: (realModel, hasWheels = false, wheels = null) => set({ realModel, realModelWheels: hasWheels, realWheels: realModel ? wheels : null }),
  setCustomModel: (genId, v) => {
    const next = { ...get().customModels };
    const old = next[genId];
    if (old && old.url.startsWith('blob:')) URL.revokeObjectURL(old.url);
    if (v) next[genId] = v;
    else delete next[genId];
    set({ customModels: next, modelError: null });
  },
  setAlign: (genId, a) => {
    saveAlignment(genId, a);
    set({ aligns: { ...get().aligns, [genId]: a } });
  },
  setModelError: (modelError) => set({ modelError }),
}));

useStore.subscribe((s) => {
  const hash = `brand=${s.brandId}&model=${s.modelId}&gen=${s.genId}`;
  if (location.hash.slice(1) !== hash) history.replaceState(null, '', `#${hash}`);
});

export function useCurrent() {
  const brandId = useStore((s) => s.brandId);
  const modelId = useStore((s) => s.modelId);
  const genId = useStore((s) => s.genId);
  return findSelection(brandId, modelId, genId);
}

/**
 * Per-frame simulation state, mutated in the render loop and read by animated parts.
 * Kept outside React so 60 fps updates never trigger re-renders.
 */
export const sim = {
  rpm: 900,
  crank: 0, // radians (visual, slowed)
  wheel: 0, // radians (visual)
  speedKmh: 0,
  xray: 0, // 0..1 eased
  dragging: false, // orbiting with the mouse: hover picking is paused
  time: 0,
};

if (import.meta.env.DEV) (window as unknown as { __kycStore: typeof useStore }).__kycStore = useStore;

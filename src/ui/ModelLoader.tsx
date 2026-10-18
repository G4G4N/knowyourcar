import { useProgress } from '@react-three/drei';
import { modelUrls } from '../data/models';
import { useCurrent, useStore } from '../store';

/** Shown over the canvas while the selected car's real 3D model downloads and decodes. */
export function ModelLoader() {
  const { generation } = useCurrent();
  const custom = useStore((s) => s.customModels[generation.id]);
  const loaded = useStore((s) => s.realModel === generation.id);
  const failed = useStore((s) => !!s.modelError);
  const { progress } = useProgress();
  if (!(custom?.url ?? modelUrls[generation.id]) || loaded || failed) return null;
  return (
    <div className="model-loader" role="status" aria-live="polite">
      <div className="model-loader-ring" />
      <span>Loading {generation.code} model… {Math.round(progress)}%</span>
    </div>
  );
}

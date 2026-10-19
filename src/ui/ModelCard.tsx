import { useRef } from 'react';
import { modelUrls, credits, deployedModels, loadAlignment } from '../data/models';
import { useCurrent, useStore } from '../store';

export function modelSearchUrl(brand: string, model: string, code: string) {
  const q = encodeURIComponent(`${brand.replace('-Benz', '')} ${model.split('/')[0].trim()} ${code}`);
  return `https://sketchfab.com/search?q=${q}&type=models&features=downloadable&sort_by=-likeCount`;
}

export function loadModelFile(file: File) {
  const s = useStore.getState();
  if (!/\.glb$/i.test(file.name)) {
    s.setModelError('Please use a single .glb file (Sketchfab: Download → glTF Binary).');
    return;
  }
  s.setCustomModel(s.genId, { url: URL.createObjectURL(file), name: file.name.replace(/\.glb$/i, '') });
}

export function ModelCard() {
  const { brand, model, generation: g } = useCurrent();
  const custom = useStore((s) => s.customModels[g.id]);
  const real = useStore((s) => s.realModel === g.id);
  const error = useStore((s) => s.modelError);
  const align = useStore((s) => s.aligns[g.id]) ?? loadAlignment(g.id);
  const input = useRef<HTMLInputElement>(null);
  const bundled = !!modelUrls[g.id];
  const credit = custom ? null : credits[g.id];
  const setAlign = (patch: Partial<typeof align>) => useStore.getState().setAlign(g.id, { ...align, ...patch });

  return (
    <div className="model-card">
      <div className="model-card-head">
        <div>
          <div className="model-card-title">{real ? 'Real 3D model' : error ? 'Generated model (real model rejected)' : custom || bundled ? 'Loading model…' : 'Generated model'}</div>
          <div className="model-card-sub">
            {custom
              ? `${custom.name} (this session)`
              : credit
                ? (
                    <>
                      {credit.name ?? 'Model'} by {credit.author ?? 'unknown'} · {credit.license ?? 'see source'}
                      {!import.meta.env.DEV && deployedModels[g.id] ? ' · compressed for web' : ''}
                      {credit.url && (
                        <>
                          {' · '}
                          <a href={credit.url} target="_blank" rel="noreferrer">
                            source
                          </a>
                        </>
                      )}
                    </>
                  )
                : bundled
                  ? `src/assets/models/${g.id}.glb`
                  : 'Built from this car’s dimensions and design data.'}
          </div>
        </div>
      </div>
      {error && <div className="model-error">{error}</div>}
      <div className="model-actions">
        <button className="btn" onClick={() => input.current?.click()}>
          Load .glb
        </button>
        {(real || custom || bundled) && (
          <>
            <button className="btn ghost" onClick={() => setAlign({ flip: !align.flip })} title="Turn the model around if it faces backwards">
              Flip
            </button>
            <button className="btn ghost" onClick={() => setAlign({ yaw: (((align.yaw + 90) % 360) as 0 | 90 | 180 | 270) })} title="Rotate 90°">
              Rotate
            </button>
          </>
        )}
        {custom && (
          <button className="btn ghost" onClick={() => useStore.getState().setCustomModel(g.id, null)}>
            Reset
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept=".glb,model/gltf-binary"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) loadModelFile(f);
            e.target.value = '';
          }}
        />
      </div>
      {!real && (
        <p className="model-hint">
          For showroom-quality looks, grab a downloadable model (
          <a href={modelSearchUrl(brand.name, model.name, g.code)} target="_blank" rel="noreferrer">
            search Sketchfab
          </a>
          ), then drop the <code>.glb</code> anywhere on this page. Save it as <code>src/assets/models/{g.id}.glb</code> to keep it.
        </p>
      )}
    </div>
  );
}

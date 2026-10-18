import { BRANDS } from '../data/lineup';
import { useCurrent, useStore } from '../store';
import { BrandLogo } from './BrandLogo';

export function Garage() {
  const { brand, model, generation } = useCurrent();
  const selectCar = useStore((s) => s.selectCar);
  return (
    <aside className="panel garage">
      <div className="brand-tabs" role="tablist">
        {BRANDS.map((b) => (
          <button
            key={b.id}
            role="tab"
            aria-selected={b.id === brand.id}
            className={`brand-tab ${b.id === brand.id ? 'on' : ''}`}
            style={{ ['--accent' as string]: b.accent }}
            onClick={() => selectCar(b.id)}
            title={b.name}
          >
            <BrandLogo id={b.id} size={22} />
            <span>{b.name.split('-')[0]}</span>
          </button>
        ))}
      </div>
      <div className="brand-meta">
        <em>“{brand.tagline}”</em>
        <span>
          {brand.hq} · since {brand.founded}
        </span>
      </div>
      <div className="section-label">Model</div>
      <div className="model-list">
        {brand.models.map((m) => (
          <button key={m.id} className={`model ${m.id === model.id ? 'on' : ''}`} onClick={() => selectCar(brand.id, m.id)}>
            <span className="model-name">{m.name}</span>
            <span className="model-seg">{m.segment}</span>
            <span className="model-count">{m.generations.length}</span>
          </button>
        ))}
      </div>
      <div className="section-label">Generation</div>
      <div className="gen-timeline">
        {model.generations.map((g) => (
          <button key={g.id} className={`gen ${g.id === generation.id ? 'on' : ''}`} onClick={() => selectCar(brand.id, model.id, g.id)}>
            <span className="gen-dot" style={{ background: g.paint }} />
            <span className="gen-code">{g.code}</span>
            <span className="gen-variant">{g.variant}</span>
            <span className="gen-years">{g.years}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

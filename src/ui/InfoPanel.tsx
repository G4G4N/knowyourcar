import { useMemo } from 'react';
import { PARTS, SYSTEMS, layoutName, partSpecs, tourSteps, transmissionName, type PartId } from '../data/parts';
import type { SystemId } from '../data/types';
import { useCurrent, useStore } from '../store';
import { ModelCard } from './ModelCard';

const SWATCHES = ['#1c1c1e', '#e8e8e6', '#8a8d8f', '#1f3b73', '#3c6e47', '#a51e2f', '#e0b200', '#5d6a73'];

export function InfoPanel() {
  const { brand, generation: g } = useCurrent();
  const selected = useStore((s) => s.selected);
  const tour = useStore((s) => s.tour);
  const select = useStore((s) => s.select);
  const setTour = useStore((s) => s.setTour);
  const setXray = useStore((s) => s.setXray);
  const steps = useMemo(() => tourSteps(g), [g]);

  if (selected) {
    const p = PARTS[selected];
    const sys = SYSTEMS[p.system];
    const specs = partSpecs(selected, g, brand);
    const step = tour !== null ? steps[tour] : null;
    const go = (i: number) => {
      if (i < 0 || i >= steps.length) {
        setTour(null);
        return;
      }
      setTour(i);
      select(steps[i].part);
    };
    return (
      <aside className="panel info">
        <div className="info-body" key={selected}>
        {step && (
          <div className="tour-card">
            <div className="tour-progress">
              {steps.map((_, i) => (
                <span key={i} className={i <= tour! ? 'on' : ''} />
              ))}
            </div>
            <div className="tour-step">
              Step {tour! + 1} of {steps.length} · {step.title}
            </div>
            <p>{step.text}</p>
            <div className="tour-nav">
              <button className="btn ghost" onClick={() => go(tour! - 1)} disabled={tour === 0}>
                ← Back
              </button>
              <button className="btn primary" onClick={() => go(tour! + 1)}>
                {tour === steps.length - 1 ? 'Finish' : 'Next →'}
              </button>
            </div>
          </div>
        )}
        <div className="part-head">
          <span className="sys-tag" style={{ ['--c' as string]: sys.color }}>
            {sys.label}
          </span>
          <button className="icon-btn" onClick={() => (setTour(null), select(null))} aria-label="Close">
            ✕
          </button>
        </div>
        <h2>{p.name}</h2>
        <p className="lead">{p.summary}</p>
        {specs.length > 0 && (
          <dl className="specs">
            {specs.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        )}
        <h3>How it works</h3>
        <p>{p.how}</p>
        {'fact' in p && p.fact && (
          <div className="fact">
            <span>Did you know?</span>
            {p.fact}
          </div>
        )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="panel info">
      <div className="car-eyebrow">
        {brand.name} · {g.code}
      </div>
      <h2>{g.variant}</h2>
      <div className="years">{g.years}</div>
      <div className="hero-stats">
        <Stat v={g.engine.hp} u="hp" l="Power" />
        <Stat v={g.engine.torque} u="Nm" l="Torque" />
        <Stat v={g.zeroTo100} u="s" l="0–100 km/h" />
        <Stat v={g.topSpeed} u="km/h" l="Top speed" />
      </div>
      <dl className="specs">
        <div>
          <dt>Powertrain</dt>
          <dd>
            {g.engine.layout === 'EV'
              ? `${g.engine.motors?.front && g.engine.motors.rear ? 'Dual' : 'Single'}-motor electric, ${g.engine.batteryKWh} kWh`
              : `${g.engine.displacement.toFixed(1)} L ${layoutName(g.engine.layout)} ${g.engine.induction === 'NA' ? 'naturally aspirated' : g.engine.induction}${g.engine.hybrid ? ' + e-motor' : ''}`}
          </dd>
        </div>
        {g.engine.code && (
          <div>
            <dt>Engine code</dt>
            <dd>{g.engine.code}</dd>
          </div>
        )}
        <div>
          <dt>Drive</dt>
          <dd>
            {g.drivetrain}
            {g.drivetrainName ? ` · ${g.drivetrainName}` : ''}
          </dd>
        </div>
        <div>
          <dt>Gearbox</dt>
          <dd>{transmissionName(g)}</dd>
        </div>
        <div>
          <dt>Layout</dt>
          <dd>{g.position.replace('-', ' ')}</dd>
        </div>
        <div>
          <dt>Weight</dt>
          <dd>{g.weight.toLocaleString()} kg</dd>
        </div>
      </dl>
      <h3>3D model</h3>
      <ModelCard />
      <h3>Paint</h3>
      <PaintPicker defaultPaint={g.paint} name={g.paintName} />
      <h3>Good to know</h3>
      <ul className="facts">
        {g.facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <button
        className="btn primary wide"
        onClick={() => {
          setXray(true);
          setTour(0);
          select(steps[0].part);
        }}
      >
        ▶ Take the guided tour: how it runs
      </button>
      <PartsIndex />
    </aside>
  );
}

function Stat({ v, u, l }: { v: number; u: string; l: string }) {
  return (
    <div className="stat">
      <div className="stat-v">
        {v}
        <small>{u}</small>
      </div>
      <div className="stat-l">{l}</div>
    </div>
  );
}

function PaintPicker({ defaultPaint, name }: { defaultPaint: string; name: string }) {
  const paint = useStore((s) => s.paint);
  const setPaint = useStore((s) => s.setPaint);
  return (
    <div className="paint">
      <button className={`swatch ${paint === null ? 'on' : ''}`} style={{ background: defaultPaint }} onClick={() => setPaint(null)} title={name} />
      {SWATCHES.map((c) => (
        <button key={c} className={`swatch ${paint === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setPaint(c)} aria-label={`Paint ${c}`} />
      ))}
      <span className="paint-name">{paint === null ? name : 'Custom'}</span>
    </div>
  );
}

function PartsIndex() {
  const available = useStore((s) => s.available);
  const select = useStore((s) => s.select);
  const setXray = useStore((s) => s.setXray);
  const groups = useMemo(() => {
    const m = new Map<SystemId, PartId[]>();
    for (const id of available) {
      const sys = PARTS[id].system;
      if (!m.has(sys)) m.set(sys, []);
      m.get(sys)!.push(id);
    }
    return (Object.keys(SYSTEMS) as SystemId[]).filter((s) => m.has(s)).map((s) => [s, m.get(s)!] as const);
  }, [available]);
  return (
    <>
      <h3>Every part on this car</h3>
      <div className="parts-index">
        {groups.map(([sys, ids]) => (
          <div key={sys} className="parts-group">
            <div className="parts-group-label" style={{ color: SYSTEMS[sys].color }}>
              {SYSTEMS[sys].label}
            </div>
            <div className="chips">
              {ids.map((id) => (
                <button
                  key={id}
                  className="chip"
                  onClick={() => {
                    if (sys !== 'body') setXray(true);
                    select(id);
                  }}
                >
                  {PARTS[id].name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

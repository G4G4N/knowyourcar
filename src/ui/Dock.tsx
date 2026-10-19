import { useEffect, useRef, useState } from 'react';
import { PARTS, SYSTEMS, partCopy } from '../data/parts';
import type { SystemId } from '../data/types';
import { engineSound } from '../audio';
import { sim, useCurrent, useStore, type ViewPreset } from '../store';
import { IconPlay, IconPower, IconSound, IconStop } from './icons';

const VIEWS: [ViewPreset, string][] = [
  ['hero', '3/4'],
  ['side', 'Side'],
  ['front', 'Front'],
  ['rear', 'Rear'],
  ['top', 'Top'],
];

const SLOWMO: [number, string][] = [
  [0.01, '1/100×'],
  [0.04, '1/25×'],
  [0.2, '1/5×'],
  [1, 'Real'],
];

export function XrayToggle() {
  const xray = useStore((s) => s.xray);
  const setXray = useStore((s) => s.setXray);
  return (
    <div className={`xray-toggle ${xray ? 'on' : ''}`} role="group" aria-label="View mode (press X)">
      <button className={xray ? '' : 'on'} onClick={() => setXray(false)} aria-pressed={!xray}>
        Exterior
      </button>
      <button className={xray ? 'on' : ''} onClick={() => setXray(true)} aria-pressed={xray} title="X-ray (X)">
        X-ray
      </button>
      <span className="xray-thumb" aria-hidden />
    </div>
  );
}

export function Dock() {
  const { generation: g } = useCurrent();
  const s = useStore();
  const ev = g.engine.layout === 'EV';
  return (
    <div className="dock">
      <div className="dock-group">
        <button className={`btn ${s.running ? 'running' : ''}`} onClick={() => s.setRunning(!s.running)} title="Start / stop">
          {s.running ? <IconStop /> : ev ? <IconPower /> : <IconPlay />}
          <span>{s.running ? 'Stop' : ev ? 'Power on' : 'Start engine'}</span>
        </button>
        <label className="throttle">
          <span>{ev ? 'Accelerator' : 'Throttle'}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={s.throttle}
            style={{ ['--v' as string]: `${s.throttle * 100}%` }}
            onChange={(e) => s.setThrottle(+e.target.value)}
          />
        </label>
        {!ev && (
          <div className="gears" role="radiogroup" aria-label="Gear">
            {Array.from({ length: Math.min(g.gears, 9) }).map((_, i) => (
              <button key={i} className={s.gear === i + 1 ? 'on' : ''} onClick={() => s.setGear(i + 1)}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="dock-group">
        <span className="dock-label">Time</span>
        <div className="seg">
          {SLOWMO.map(([v, l]) => (
            <button key={v} className={s.slowmo === v ? 'on' : ''} onClick={() => s.setSlowmo(v)}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="dock-group">
        <span className="dock-label">View</span>
        <div className="seg">
          {VIEWS.map(([v, l]) => (
            <button key={v} onClick={() => s.setView(v)}>
              {l}
            </button>
          ))}
        </div>
        <button
          className={`icon-btn ${s.sound ? 'on' : ''}`}
          title={s.sound ? 'Mute engine sound' : 'Play engine sound'}
          onClick={() => {
            if (s.sound) engineSound.stop();
            else engineSound.start();
            s.setSound(!s.sound);
          }}
        >
          <IconSound on={s.sound} />
        </button>
      </div>
    </div>
  );
}

export function SystemFilter() {
  const xray = useStore((s) => s.xray);
  const system = useStore((s) => s.system);
  const setSystem = useStore((s) => s.setSystem);
  const available = useStore((s) => s.available);
  if (!xray) return null;
  const present = new Set(available.map((id) => PARTS[id].system));
  return (
    <div className="system-filter">
      <button className={system === null ? 'on' : ''} onClick={() => setSystem(null)}>
        All
      </button>
      {(Object.keys(SYSTEMS) as SystemId[])
        .filter((k) => k !== 'body' && present.has(k))
        .map((k) => (
          <button key={k} className={system === k ? 'on' : ''} onClick={() => setSystem(system === k ? null : k)}>
            {SYSTEMS[k].label}
          </button>
        ))}
    </div>
  );
}

/** Live gauges. Reads the mutable sim via rAF so React doesn't re-render at 60fps. */
export function Gauges() {
  const { generation: g } = useCurrent();
  const rpmRef = useRef<HTMLSpanElement>(null);
  const spdRef = useRef<HTMLSpanElement>(null);
  const arcRef = useRef<SVGPathElement>(null);
  const ev = g.engine.layout === 'EV';
  const max = g.engine.redline;
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const f = Math.max(0, Math.min(1, sim.rpm / max));
      if (rpmRef.current) rpmRef.current.textContent = Math.round(sim.rpm / 10) * 10 + '';
      if (spdRef.current) spdRef.current.textContent = Math.round(sim.speedKmh) + '';
      if (arcRef.current) arcRef.current.style.strokeDashoffset = `${(1 - f) * 188}`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [max]);
  return (
    <div className="gauges">
      <svg viewBox="0 0 140 80" className="gauge">
        <path d="M10 75 A60 60 0 0 1 130 75" className="gauge-bg" />
        {Array.from({ length: 11 }).map((_, i) => {
          const a = Math.PI * (1 - i / 10);
          return <line key={i} x1={70 + 52 * Math.cos(a)} y1={75 - 52 * Math.sin(a)} x2={70 + 47 * Math.cos(a)} y2={75 - 47 * Math.sin(a)} className="gauge-tick" />;
        })}
        <path ref={arcRef} d="M10 75 A60 60 0 0 1 130 75" className="gauge-fg" style={{ strokeDasharray: 188 }} />
        {!ev && <path d={`M${70 + 60 * Math.cos(Math.PI * (1 - 0.9))} ${75 - 60 * Math.sin(Math.PI * (1 - 0.9))} A60 60 0 0 1 130 75`} className="gauge-red" />}
      </svg>
      <div className="gauge-read">
        <span ref={rpmRef}>0</span>
        <small>{ev ? 'motor rpm' : 'rpm'}</small>
      </div>
      <div className="gauge-speed">
        <span ref={spdRef}>0</span>
        <small>km/h</small>
      </div>
    </div>
  );
}

export function HoverTip() {
  const hovered = useStore((s) => s.hovered);
  const { generation: g } = useCurrent();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const on = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', on);
    return () => window.removeEventListener('pointermove', on);
  }, []);
  if (!hovered) return null;
  const p = PARTS[hovered];
  return (
    <div className="hover-tip" style={{ left: pos.x + 14, top: pos.y + 14 }}>
      <small>{SYSTEMS[p.system].label}</small>
      {partCopy(hovered, g).name}
    </div>
  );
}

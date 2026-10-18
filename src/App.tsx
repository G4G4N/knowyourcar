import { useEffect, useState } from 'react';
import { useCurrent, useStore } from './store';
import { Scene } from './three/Scene';
import { BrandLogo } from './ui/BrandLogo';
import { Dock, Gauges, HoverTip, SystemFilter, XrayToggle } from './ui/Dock';
import { Garage } from './ui/Garage';
import { InfoPanel } from './ui/InfoPanel';
import { loadModelFile } from './ui/ModelCard';

export default function App() {
  const { brand, generation } = useCurrent();
  const xray = useStore((s) => s.xray);
  const panelOpen = useStore((s) => s.panelOpen);
  const setPanelOpen = useStore((s) => s.setPanelOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const s = useStore.getState();
      if (e.key === 'x' || e.key === 'X') s.setXray(!s.xray);
      if (e.key === 'Escape') (s.setTour(null), s.select(null));
      if (e.key === ' ') (e.preventDefault(), s.setRunning(!s.running));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Drop a .glb anywhere to use it as this generation's model
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    let depth = 0;
    const has = (e: DragEvent) => !!e.dataTransfer && [...e.dataTransfer.types].includes('Files');
    const enter = (e: DragEvent) => has(e) && (depth++, setDragging(true));
    const leave = () => --depth <= 0 && ((depth = 0), setDragging(false));
    const over = (e: DragEvent) => has(e) && e.preventDefault();
    const drop = (e: DragEvent) => {
      e.preventDefault();
      depth = 0;
      setDragging(false);
      const f = e.dataTransfer?.files?.[0];
      if (f) loadModelFile(f);
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', drop);
    };
  }, []);

  return (
    <div className={`app ${xray ? 'is-xray' : ''} ${panelOpen ? '' : 'panels-closed'}`} style={{ ['--brand' as string]: brand.accent }}>
      <div className="stage">
        <Scene />
      </div>
      <header className="topbar">
        <div className="logo">
          <span className="logo-mark" />
          Know<b>Your</b>Car
        </div>
        <div className="title">
          <BrandLogo id={brand.id} size={18} />
          <span>
            {brand.name} <b>{generation.variant}</b> <em>{generation.code}</em>
          </span>
        </div>
        <div className="top-actions">
          <XrayToggle />
          <button className="icon-btn panels-btn" onClick={() => setPanelOpen(!panelOpen)} aria-label="Toggle panels">
            ☰
          </button>
        </div>
      </header>
      <Garage />
      <InfoPanel />
      <SystemFilter />
      <Gauges />
      <Dock />
      <HoverTip />
      {dragging && (
        <div className="drop-overlay">
          <div>
            Drop a <b>.glb</b> to use it for the {brand.name} {generation.variant}
          </div>
        </div>
      )}
      <div className="hint">{xray ? 'Click any glowing part to learn what it does' : 'Drag to orbit · scroll to zoom · press X for X-ray'}</div>
    </div>
  );
}

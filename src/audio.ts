import { sim, useStore } from './store';
import { findSelection } from './data/lineup';
import { cylinderCount } from './data/parts';

/** Tiny synthesised engine note: firing-frequency sawtooth + harmonics through a throttle-opened filter. */
class EngineSound {
  ctx: AudioContext | null = null;
  nodes: { oscs: OscillatorNode[]; gains: GainNode[]; filter: BiquadFilterNode; master: GainNode; noise: AudioBufferSourceNode } | null = null;
  raf = 0;

  start() {
    if (this.ctx) return;
    const ctx = new AudioContext();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 4;
    filter.connect(master);
    master.connect(ctx.destination);
    const types: OscillatorType[] = ['sawtooth', 'square', 'sawtooth', 'sine'];
    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    for (const t of types) {
      const o = ctx.createOscillator();
      o.type = t;
      const g = ctx.createGain();
      g.gain.value = 0;
      o.connect(g).connect(filter);
      o.start();
      oscs.push(o);
      gains.push(g);
    }
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const ng = ctx.createGain();
    ng.gain.value = 0.04;
    noise.connect(ng).connect(filter);
    noise.start();
    this.nodes = { oscs, gains, filter, master, noise };
    const loop = () => {
      this.update();
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  update() {
    if (!this.ctx || !this.nodes) return;
    const s = useStore.getState();
    const { generation: g } = findSelection(s.brandId, s.modelId, s.genId);
    const t = this.ctx.currentTime;
    const { oscs, gains, filter, master } = this.nodes;
    const ev = g.engine.layout === 'EV';
    const rpm = Math.max(0, sim.rpm);
    const on = s.running ? 1 : 0;
    if (ev) {
      const f = 120 + rpm * 0.12;
      oscs[0].frequency.setTargetAtTime(f, t, 0.05);
      oscs[1].frequency.setTargetAtTime(f * 1.5, t, 0.05);
      oscs[2].frequency.setTargetAtTime(f * 2.01, t, 0.05);
      oscs[3].frequency.setTargetAtTime(f * 0.5, t, 0.05);
      const lvl = Math.min(1, rpm / 4000);
      [0, 0.02, 0.015, 0.05].forEach((v, i) => gains[i].gain.setTargetAtTime(v * lvl, t, 0.05));
      filter.frequency.setTargetAtTime(1800 + rpm * 0.3, t, 0.05);
      master.gain.setTargetAtTime(0.25 * on * lvl, t, 0.1);
    } else {
      const cyl = cylinderCount(g.engine.layout);
      const fire = (rpm / 60) * (cyl / 2);
      oscs[0].frequency.setTargetAtTime(fire, t, 0.03);
      oscs[1].frequency.setTargetAtTime(fire / 2, t, 0.03);
      oscs[2].frequency.setTargetAtTime(fire * 2, t, 0.03);
      oscs[3].frequency.setTargetAtTime(fire / 4, t, 0.03);
      [0.5, 0.25, 0.12, 0.4].forEach((v, i) => gains[i].gain.setTargetAtTime(v, t, 0.05));
      filter.frequency.setTargetAtTime(250 + fire * 3 + s.throttle * 2500, t, 0.05);
      master.gain.setTargetAtTime(0.18 * on, t, 0.1);
    }
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.ctx?.close();
    this.ctx = null;
    this.nodes = null;
  }
}

export const engineSound = new EngineSound();

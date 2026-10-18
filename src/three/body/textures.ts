import * as THREE from 'three';
import type { GrilleTexture } from '../../data/design';

/** Procedural canvas textures. UVs on decals are in metres, so `tile` is the real pattern size. */

const cache = new Map<string, THREE.CanvasTexture>();

function make(key: string, size: number, tile: number, draw: (c: CanvasRenderingContext2D, s: number) => void) {
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  draw(ctx, size);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / tile, 1 / tile);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
}

const BG = '#08090b';

export function grilleTexture(kind: GrilleTexture): THREE.CanvasTexture {
  switch (kind) {
    case 'vbars':
      return make(kind, 64, 0.026, (c, s) => {
        c.fillStyle = BG;
        c.fillRect(0, 0, s, s);
        const g = c.createLinearGradient(s * 0.3, 0, s * 0.7, 0);
        g.addColorStop(0, '#5b6168');
        g.addColorStop(0.5, '#e9edf0');
        g.addColorStop(1, '#5b6168');
        c.fillStyle = g;
        c.fillRect(s * 0.32, 0, s * 0.36, s);
      });
    case 'slats':
      return make(kind, 64, 0.03, (c, s) => {
        c.fillStyle = BG;
        c.fillRect(0, 0, s, s);
        for (const x of [0.18, 0.56]) {
          const g = c.createLinearGradient(s * x, 0, s * (x + 0.2), 0);
          g.addColorStop(0, '#111');
          g.addColorStop(0.5, '#4a4f55');
          g.addColorStop(1, '#111');
          c.fillStyle = g;
          c.fillRect(s * x, 0, s * 0.2, s);
        }
      });
    case 'hbars':
      return make(kind, 64, 0.028, (c, s) => {
        c.fillStyle = BG;
        c.fillRect(0, 0, s, s);
        const g = c.createLinearGradient(0, s * 0.3, 0, s * 0.7);
        g.addColorStop(0, '#50565c');
        g.addColorStop(0.5, '#dfe4e8');
        g.addColorStop(1, '#3d4247');
        c.fillStyle = g;
        c.fillRect(0, s * 0.34, s, s * 0.32);
      });
    case 'panamericana':
      return make(kind, 64, 0.016, (c, s) => {
        c.fillStyle = BG;
        c.fillRect(0, 0, s, s);
        const g = c.createLinearGradient(s * 0.25, 0, s * 0.75, 0);
        g.addColorStop(0, '#6a7076');
        g.addColorStop(0.5, '#ffffff');
        g.addColorStop(1, '#6a7076');
        c.fillStyle = g;
        c.fillRect(s * 0.3, 0, s * 0.4, s);
      });
    case 'honeycomb':
      return make(kind, 128, 0.032, (c, s) => {
        c.fillStyle = '#16181b';
        c.fillRect(0, 0, s, s);
        c.fillStyle = BG;
        const r = s / 4.2;
        const hex = (cx: number, cy: number) => {
          c.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (Math.PI / 3) * k + Math.PI / 6;
            c.lineTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82);
          }
          c.closePath();
          c.fill();
        };
        const dx = r * Math.sqrt(3);
        for (let y = -1; y < 4; y++) for (let x = -1; x < 4; x++) hex(x * dx + (y % 2 ? dx / 2 : 0), y * r * 1.5);
      });
    case 'mesh':
      return make(kind, 64, 0.022, (c, s) => {
        c.fillStyle = BG;
        c.fillRect(0, 0, s, s);
        c.strokeStyle = '#3a3f45';
        c.lineWidth = s * 0.12;
        c.beginPath();
        c.moveTo(0, s / 2);
        c.lineTo(s / 2, 0);
        c.lineTo(s, s / 2);
        c.lineTo(s / 2, s);
        c.closePath();
        c.stroke();
      });
    case 'diamond':
      return make(kind, 64, 0.022, (c, s) => {
        c.fillStyle = BG;
        c.fillRect(0, 0, s, s);
        c.fillStyle = '#e7eaee';
        for (const [x, y] of [
          [0.25, 0.25],
          [0.75, 0.75],
        ]) {
          c.beginPath();
          c.arc(x * s, y * s, s * 0.09, 0, Math.PI * 2);
          c.fill();
        }
      });
    case 'stars':
      return make(kind, 128, 0.045, (c, s) => {
        c.fillStyle = '#050607';
        c.fillRect(0, 0, s, s);
        c.fillStyle = '#9aa3ad';
        for (const [x, y] of [
          [0.25, 0.25],
          [0.75, 0.75],
        ]) {
          c.save();
          c.translate(x * s, y * s);
          for (let k = 0; k < 3; k++) {
            c.rotate((Math.PI * 2) / 3);
            c.beginPath();
            c.moveTo(-s * 0.012, 0);
            c.lineTo(0, -s * 0.09);
            c.lineTo(s * 0.012, 0);
            c.fill();
          }
          c.restore();
        }
      });
    case 'blank':
    default:
      return make('blank', 8, 1, (c, s) => {
        c.fillStyle = '#0b0c0f';
        c.fillRect(0, 0, s, s);
      });
  }
}

export function carbonTexture() {
  return make('carbon', 64, 0.02, (c, s) => {
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++) {
        const g = (x + y) % 2 ? c.createLinearGradient(x * 16, 0, x * 16 + 16, 0) : c.createLinearGradient(0, y * 16, 0, y * 16 + 16);
        g.addColorStop(0, '#121315');
        g.addColorStop(0.5, '#2c2e33');
        g.addColorStop(1, '#121315');
        c.fillStyle = g;
        c.fillRect(x * 16, y * 16, 16, 16);
      }
    void s;
  });
}

/** German-style number plate. */
export function plateTexture(text: string) {
  const key = 'plate:' + text;
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = 520;
  cv.height = 112;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#f4f4f0';
  c.fillRect(0, 0, 520, 112);
  c.strokeStyle = '#111';
  c.lineWidth = 6;
  c.strokeRect(4, 4, 512, 104);
  c.fillStyle = '#123f9c';
  c.fillRect(7, 7, 46, 98);
  c.fillStyle = '#ffd200';
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    c.beginPath();
    c.arc(30 + Math.cos(a) * 14, 40 + Math.sin(a) * 14, 2.2, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = '#fff';
  c.font = 'bold 26px Arial';
  c.textAlign = 'center';
  c.fillText('D', 30, 92);
  c.fillStyle = '#111';
  c.font = 'bold 74px "DIN Alternate", "Arial Narrow", Arial, sans-serif';
  c.textBaseline = 'middle';
  c.fillText(text, 290, 60);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
}

/** Chrome model badge text on a transparent background. */
export function badgeTexture(text: string) {
  const key = 'badge:' + text;
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 96;
  const c = cv.getContext('2d')!;
  c.clearRect(0, 0, 512, 96);
  const g = c.createLinearGradient(0, 10, 0, 86);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, '#9aa1a8');
  g.addColorStop(1, '#f0f2f4');
  c.fillStyle = g;
  c.font = '600 64px "Helvetica Neue", Arial, sans-serif';
  c.textAlign = 'right';
  c.textBaseline = 'middle';
  c.fillText(text, 506, 50);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

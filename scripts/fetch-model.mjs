#!/usr/bin/env node
/**
 * Download Sketchfab models into the app.
 *
 *   node scripts/fetch-model.mjs --all                 # every pick in scripts/models.json (skips ones already downloaded)
 *   node scripts/fetch-model.mjs <genId> <url or uid>  # one model
 *   add --force to re-download
 *
 * The API token is read from the SKETCHFAB_TOKEN environment variable or from .env.local
 * (any variable whose name contains "SKETCH"). It is only ever sent to api.sketchfab.com and never printed.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modelsDir = path.join(root, 'src/assets/models');
const args = process.argv.slice(2);
const force = args.includes('--force');
const pos = args.filter((a) => !a.startsWith('--'));

function readToken() {
  if (process.env.SKETCHFAB_TOKEN) return process.env.SKETCHFAB_TOKEN.trim();
  const file = path.join(root, '.env.local');
  if (!fs.existsSync(file)) return null;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && /SKETCH/i.test(m[1])) return m[2].replace(/^['"]|['"]$/g, '').trim();
  }
  return null;
}
const token = readToken();
if (!token) {
  console.error('No Sketchfab token found. Put SKETCHFAB_TOKEN=… in .env.local (see https://sketchfab.com/settings/password).');
  process.exit(1);
}

function get(url, auth = false, redirects = 0) {
  return new Promise((resolve, reject) => {
    const headers = { 'User-Agent': 'knowyourcar' };
    if (auth) headers.Authorization = `Token ${token}`;
    https
      .get(url, { headers }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 5) {
          res.resume();
          return resolve(get(res.headers.location, false, redirects + 1));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          if (res.statusCode >= 400) {
            const body = Buffer.concat(chunks).toString().slice(0, 200);
            reject(new Error(`HTTP ${res.statusCode}${res.statusCode === 401 ? ' (token rejected)' : ''}: ${body}`));
          } else resolve(Buffer.concat(chunks));
        });
      })
      .on('error', reject);
  });
}

const creditsPath = path.join(modelsDir, 'credits.json');
const readCredits = () => (fs.existsSync(creditsPath) ? JSON.parse(fs.readFileSync(creditsPath, 'utf8')) : {});

async function fetchOne(genId, ref) {
  const uid = (String(ref).match(/([0-9a-f]{32})/) ?? [])[1];
  if (!uid) throw new Error(`no model uid in ${ref}`);
  const out = path.join(modelsDir, `${genId}.glb`);
  if (fs.existsSync(out) && !force) {
    console.log(`= ${genId}: already downloaded`);
    return;
  }
  const info = JSON.parse(await get(`https://api.sketchfab.com/v3/models/${uid}`));
  console.log(`→ ${genId}: ${info.name} by ${info.user?.displayName} (${info.license?.label ?? 'unknown licence'})`);
  const dl = JSON.parse(await get(`https://api.sketchfab.com/v3/models/${uid}/download`, true));
  fs.mkdirSync(modelsDir, { recursive: true });
  if (dl.glb?.url) {
    fs.writeFileSync(out, await get(dl.glb.url));
  } else if (dl.gltf?.url) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kyc-'));
    const zip = path.join(tmp, 'model.zip');
    fs.writeFileSync(zip, await get(dl.gltf.url));
    execFileSync('unzip', ['-q', zip, '-d', path.join(tmp, 'x')]);
    execFileSync('npx', ['--yes', 'gltf-pipeline@4.1.0', '-i', path.join(tmp, 'x', 'scene.gltf'), '-o', out], { stdio: 'inherit' });
    fs.rmSync(tmp, { recursive: true, force: true });
  } else throw new Error('no downloadable glTF/GLB for this model');
  const creds = readCredits();
  creds[genId] = { ...(creds[genId] ?? {}), name: info.name, author: info.user?.displayName, license: info.license?.label, url: info.viewerUrl };
  fs.writeFileSync(creditsPath, JSON.stringify(creds, null, 2) + '\n');
  console.log(`  ✓ ${path.relative(root, out)} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
}

const jobs = args.includes('--all')
  ? Object.entries(JSON.parse(fs.readFileSync(path.join(root, 'scripts/models.json'), 'utf8'))).filter(([k]) => !k.startsWith('_'))
  : pos.length === 2
    ? [[pos[0], pos[1]]]
    : null;
if (!jobs) {
  console.error('usage: node scripts/fetch-model.mjs --all | <genId> <sketchfab url or uid> [--force]');
  process.exit(1);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
for (const [i, [genId, ref]] of jobs.entries()) {
  for (let attempt = 0; ; attempt++) {
    try {
      await fetchOne(genId, ref);
      break;
    } catch (e) {
      if (/token rejected/.test(e.message)) {
        console.error(`  ✗ ${genId}: ${e.message}`);
        process.exit(1);
      }
      if (/HTTP 429/.test(e.message) && attempt < 6) {
        const wait = 60 * 2 ** Math.min(attempt, 3);
        console.log(`  … rate limited, retrying ${genId} in ${wait}s`);
        await sleep(wait * 1000);
        continue;
      }
      failed++;
      console.error(`  ✗ ${genId}: ${e.message}`);
      break;
    }
  }
  if (i < jobs.length - 1) await sleep(8000); // be gentle with the API
}
console.log(failed ? `done with ${failed} failure(s)` : 'done — reload the app');

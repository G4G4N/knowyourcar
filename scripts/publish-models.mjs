#!/usr/bin/env node
/**
 * Optimize the local models in src/assets/models, upload them to the R2 bucket and record them in
 * src/data/deployed-models.json (commit that file; the next deploy picks them up).
 *
 *   node scripts/publish-models.mjs                  # optimize + upload to R2 (needs `wrangler login`)
 *   node scripts/publish-models.mjs --local          # upload into the local emulator used by `npm run cf:dev`
 *   node scripts/publish-models.mjs --dry-run        # optimize only, report sizes
 *   options: --only g80,e30   --include-standard   --bucket <name>   --force (re-optimize + re-upload)
 *
 * Licences: models under Sketchfab's "Standard" licence may not be redistributed as files, and a
 * public website serves the file to every visitor, so they are skipped unless --include-standard.
 * Requires Node 22+ (wrangler 4).
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src/assets/models');
const OUT = path.join(root, '.models-out');
const MANIFEST = path.join(root, 'src/data/deployed-models.json');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : d;
};
const dryRun = flag('--dry-run');
const local = flag('--local');
const includeStandard = flag('--include-standard');
const bucket = opt('--bucket', 'knowyourcar-models');
const only = opt('--only', '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (Number(process.versions.node.split('.')[0]) < 22) {
  console.error(`Node 22+ required (you have ${process.versions.node}). Try: npx -p node@24 node scripts/publish-models.mjs ${args.join(' ')}`);
  process.exit(1);
}

const credits = JSON.parse(fs.readFileSync(path.join(SRC, 'credits.json'), 'utf8'));
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
// What this machine has already put in the real bucket. Not the manifest: that also gets written by
// --local runs, so trusting it would skip uploads to R2. A fresh clone simply re-uploads.
const UPLOADED = path.join(OUT, 'uploaded.json');
const uploaded = fs.existsSync(UPLOADED) ? JSON.parse(fs.readFileSync(UPLOADED, 'utf8')) : {};
const inBucket = new Set(uploaded[bucket] ?? []);
const run = (cmd, a) => {
  try {
    return execFileSync(cmd, a, { stdio: ['ignore', 'pipe', 'pipe'], cwd: root }).toString();
  } catch (e) {
    throw new Error(`${cmd} ${a.slice(0, 6).join(' ')} … failed:\n${e.stderr?.toString() || e.message}`);
  }
};
const mb = (n) => (n / 1e6).toFixed(1) + ' MB';

fs.mkdirSync(OUT, { recursive: true });
const files = fs
  .readdirSync(SRC)
  .filter((f) => f.endsWith('.glb'))
  .map((f) => f.slice(0, -4))
  .filter((id) => !only.length || only.includes(id));

let before = 0;
let after = 0;
for (const id of files) {
  const credit = credits[id] ?? {};
  const license = credit.license ?? 'unknown';
  if (/standard/i.test(license) && !includeStandard) {
    console.log(`- ${id}: skipped (${license} licence does not allow redistribution; --include-standard to override)`);
    continue;
  }
  const src = path.join(SRC, `${id}.glb`);
  const tmp = path.join(OUT, `${id}.glb`);
  // Keep meshes, node names and materials separate (the app identifies parts and wheels from them);
  // only compress geometry, recompress/resize textures, and drop unused data.
  const fresh = fs.existsSync(tmp) && fs.statSync(tmp).mtimeMs > fs.statSync(src).mtimeMs && !flag('--force');
  if (!fresh) run('npx', [
    '--yes',
    '-p',
    '@gltf-transform/cli@4.1.1',
    'gltf-transform',
    'optimize',
    src,
    tmp,
    '--compress',
    'draco',
    '--texture-compress',
    'webp',
    '--texture-size',
    '2048',
    '--join',
    'false',
    '--flatten',
    'false',
    '--instance',
    'false',
    '--palette',
    'false',
    '--simplify',
    'false',
  ]);
  const buf = fs.readFileSync(tmp);
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  const file = `${id}-${sha256.slice(0, 10)}.glb`;
  before += fs.statSync(src).size;
  after += buf.length;
  const tooBig = buf.length > 300e6;
  console.log(`✓ ${id}: ${mb(fs.statSync(src).size)} → ${mb(buf.length)}  ${file}${tooBig ? '  (over 300 MB, skipped)' : ''}`);
  if (dryRun || tooBig) continue;
  if (local || !inBucket.has(file) || flag('--force')) {
    run('npx', [
      '--yes',
      '-p',
      'wrangler@4.147.0',
      'wrangler',
      'r2',
      'object',
      'put',
      `${bucket}/${file}`,
      '--file',
      tmp,
      '--content-type',
      'model/gltf-binary',
      '--cache-control',
      'public, max-age=31536000, immutable',
      local ? '--local' : '--remote',
    ]);
    console.log(`  ↑ uploaded to ${local ? 'local emulator' : 'R2'} ${bucket}/${file}`);
    if (!local) {
      inBucket.add(file);
      uploaded[bucket] = [...inBucket].sort();
      fs.writeFileSync(UPLOADED, JSON.stringify(uploaded, null, 2) + '\n');
    }
  }
  manifest[id] = { file, bytes: buf.length, sha256 };
}

if (!dryRun) {
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + '\n');
  console.log(`\nWrote ${path.relative(root, MANIFEST)} (${Object.keys(sorted).length} models). Commit it to deploy them.`);
}
if (before) console.log(`Total: ${mb(before)} → ${mb(after)}`);

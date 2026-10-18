# KnowYourCar

Pick a German car — brand, model, generation — and explore it in 3D. Flip on **X-ray** to see through the body and watch the car run: pistons pumping in firing order, combustion flashes, a spinning crank and camshafts, turbos, prop shafts and diffs, plus glowing particles for intake air, exhaust gas, torque and EV battery energy. Click any part to learn what it is and how it works.

## Features

- **24 generations with real 3D models** across Audi, BMW and Mercedes-Benz (A3, A4, A6, R8, e-tron GT · 3 Series, M3, 5 Series/M5, X5, Z4 · C-Class, S-Class, G-Class, AMG GT, EQS).
  The lineup is driven by the files in `src/assets/models/`: add a `<genId>.glb` for any generation in `src/data/catalog.ts` (43 are specced) and it shows up.
- **Per-generation 3D models** generated in the browser from each car's real dimensions plus a hand-authored design sheet (`src/data/designs.ts`): overhangs, windscreen rake, roof and boot lines, beltline wedge, flares, window graphics (Hofmeister kink, quarter windows), headlight and tail-light shapes with their LED signatures, grille type (kidneys, singleframe, Panamericana, star panel…), intakes, exhaust layout, rim design, spoilers, power domes, carbon roofs and more. Lights, glass, grilles and shut lines are projected onto the body surface like decals.
- **Mechanically accurate layouts:** inline vs V engines with correct cylinder count and firing order, hot-V turbos, superchargers, Audi's engine-ahead-of-axle quattro layout, BMW/Mercedes front-mid engines, transverse engines, the R8's mid engine, the AMG GT's rear transaxle, and single- or dual-motor EVs with a floor battery.
- **X-ray mode** (press `X`): a fresnel-ghosted body, color-coded systems, and live flow particles.
- **40+ clickable parts**, each with an explanation, specs for the selected car, and trivia.
- **Guided tour** that steps through how the car makes and delivers power (ICE or EV).
- Throttle, gear selection and a time-scale control (slow-mo down to 1/100×), live RPM/speed gauges, camera presets, system filters, paint picker, and a synthesized engine sound.

## Real 3D models (showroom quality)

The generated bodies are matched to each generation, but they're still generated. For artist-made
quality, drop in a real model and everything else (X-ray scanner, part picking, animated internals, tour) keeps working:

- **Try one instantly:** drag a `.glb` onto the page, or use **Load .glb** in the info panel's *3D model* card.
  It's auto-rotated, turned nose-forward, scaled to the car's real length and put on the ground; use **Flip** / **Rotate** if a model needs help.
- **Keep it:** save it as `src/assets/models/<genId>.glb` (e.g. `g80.glb`). Credits go in `src/assets/models/credits.json` and are shown in the app.
- **From Sketchfab:** `MODEL_SOURCES.md` lists the best-liked downloadable candidates for every generation
  (regenerate with `node scripts/find-models.mjs`). Download one with your own API token:

```bash
SKETCHFAB_TOKEN=your-token node scripts/fetch-model.mjs g80 https://sketchfab.com/3d-models/...
```

Check each model's licence (CC Attribution needs credit; NonCommercial ones can't be used commercially).
Meshes named like `wheel`, `glass`, `headlight`, `seat`, `mirror`, `grille`… become clickable parts automatically, and separate wheel meshes spin.

## Deploy (Cloudflare Pages + R2, via GitHub Actions)

```
GitHub push ──► Actions: npm ci → typecheck → build ──► Cloudflare Pages (app, ~1.5 MB)
                                                             │
                              browser ──GET /models/g80-<hash>.glb──► Pages Function ──► R2 bucket (private)
```

- **App** → Cloudflare Pages. `main` deploys to production; every pull request gets its own preview URL.
- **3D models** → a private R2 bucket. They're too big for Pages (25 MiB per-file limit) and are git-ignored
  for licensing, so they're published once from your machine. `functions/models/[name].ts` streams them from
  the same domain (no public bucket, no CORS), with content-hashed names cached forever.
- `src/data/deployed-models.json` (committed) lists what's in R2; the deployed lineup is exactly those cars.

### One-time setup

Use Node 24 for the deploy tooling (`nvm install 24 && nvm use`; `.nvmrc` is included). Wrangler 4 needs Node 22+.

1. **Cloudflare**: log in and create the bucket and Pages project
   ```bash
   npx wrangler login
   npx wrangler r2 bucket create knowyourcar-models
   npx wrangler pages project create knowyourcar --production-branch main
   ```
   The R2 binding (`MODELS` → `knowyourcar-models`) is declared in `wrangler.toml` and applied on every
   deploy, for production and previews alike, so there's nothing to set in the dashboard.
2. **API token for CI**: Dashboard → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers"
   template (or custom: *Account → Cloudflare Pages → Edit*). Note your Account ID (Workers & Pages overview).
3. **GitHub secrets** (repo → Settings → Secrets and variables → Actions):
   `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
4. **Publish the models** (optimizes ~6× with Draco + WebP, uploads, updates the manifest):
   ```bash
   npm run models:publish
   git add src/data/deployed-models.json && git commit -m "Publish models"   # if it changed
   git push
   ```
   File names are content hashes, so publishing the same models always produces the same manifest.

From then on every push deploys automatically. Re-run `npm run models:publish` only when models change.

**Licences:** publishing serves each model file to every visitor. CC-BY models are credited in the app
(and marked as compressed). NonCommercial models are fine for a non-commercial site. Sketchfab
"Standard"-licence models don't allow redistribution, so the publish script skips them unless you pass
`--include-standard`.

### CI security (public repo)

- Workflows for pull requests from forks run with a read-only token and **no secrets**, and never deploy.
  External contributors' runs also wait for a maintainer's approval (repo setting).
- The build job runs the repo's code and npm packages but has no secrets; the deploy job has the Cloudflare
  token but runs no project code, only the built site and a pinned wrangler.
- Actions are pinned to commit SHAs; Dependabot proposes updates two weeks after each release.
- Scope the Cloudflare token to what the deploy needs (Account · Cloudflare Pages · Edit) and keep it only
  in GitHub secrets. Local publishing uses `wrangler login` instead.

### Test the production setup locally

```bash
npx -p node@24 node scripts/publish-models.mjs --local   # into the local R2 emulator
npm run cf:dev                                           # http://localhost:8788 (Pages + Function + R2)
```

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173. Works on Node 16+.

## Controls

| Input | Action |
| --- | --- |
| Drag / scroll | Orbit / zoom |
| `X` | Toggle X-ray |
| `Space` | Start / stop engine |
| `Esc` | Deselect part / exit tour |
| Click a part | Learn about it |

## Project layout

```
src/
  data/       catalog (brands → models → generations), part library, tour scripts
  three/      layout + rig (dimensions → part positions), body loft geometry,
              engine/drivetrain/systems components, X-ray shader, flow particles, scene
  ui/         garage picker, info panel, dock, gauges
```

Adding a car means adding one `gen({...})` entry in `src/data/catalog.ts` (specs) and, for its looks, an entry in `src/data/designs.ts` (anything left out falls back to body-style defaults).

## Notes

The models are stylised: proportions and design cues are matched per generation, but they are generated, not scans of the real cars. Specs are representative of the listed variant and vary by market and model year. Brand names and logos are used only to identify the vehicles.

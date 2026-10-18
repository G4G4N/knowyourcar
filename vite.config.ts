import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(root, 'src/assets/models');
const isModel = (f: string) => /\.(glb|gltf)$/i.test(f);

/**
 * `virtual:local-models` → { genId: url } for model files in src/assets/models.
 * Dev server only: production builds get `{}` so the (large, licence-restricted) files never end up
 * in dist/. Deployed sites load models from R2 via src/data/deployed-models.json instead.
 */
function localModels(): Plugin {
  const id = 'virtual:local-models';
  const resolved = '\0' + id;
  let serve = false;
  return {
    name: 'kyc-local-models',
    configResolved(c) {
      serve = c.command === 'serve';
    },
    resolveId: (s) => (s === id ? resolved : undefined),
    load(s) {
      if (s !== resolved) return;
      if (!serve) return 'export default {}';
      const files = fs.existsSync(MODELS_DIR) ? fs.readdirSync(MODELS_DIR).filter(isModel) : [];
      const map = Object.fromEntries(files.map((f) => [f.replace(/\.(glb|gltf)$/i, ''), `/src/assets/models/${f}`]));
      return `export default ${JSON.stringify(map)}`;
    },
    configureServer(server) {
      server.watcher.add(MODELS_DIR);
      const refresh = (f: string) => {
        if (!isModel(f)) return;
        const mod = server.moduleGraph.getModuleById(resolved);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', refresh);
      server.watcher.on('unlink', refresh);
    },
  };
}

export default defineConfig({
  plugins: [react(), localModels()],
  build: { chunkSizeWarningLimit: 1600 },
});

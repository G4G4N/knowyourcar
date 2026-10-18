/// <reference types="vite/client" />

declare module 'virtual:local-models' {
  const models: Record<string, string>;
  export default models;
}

interface ImportMetaEnv {
  /** Where deployed models are served from (default `/models`, the Pages Function backed by R2). */
  readonly VITE_MODELS_URL?: string;
}

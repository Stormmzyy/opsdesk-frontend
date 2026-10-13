/// <reference types="vite/client" />

// Tells TypeScript which VITE_ environment variables exist and their types.
// Vite's own types allow ANY name on import.meta.env, typed as `any`, so
// without this a typo like VITE_API_ULR would compile and be undefined at
// runtime. These interfaces are merged into Vite's ("declaration merging").
interface ImportMetaEnv {
  // The API's base URL, e.g. /api/v1. Optional (`?`), because a fresh clone
  // has no .env file yet, so the value really can be undefined. That makes
  // TypeScript insist on a fallback wherever it's used.
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

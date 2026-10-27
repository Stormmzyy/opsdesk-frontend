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
  // "true" starts the MSW mock API in development; anything else, or leaving
  // it out, uses the real backend at VITE_API_URL. A string, not a boolean,
  // because every environment variable reaches the app as text.
  readonly VITE_USE_MOCK_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

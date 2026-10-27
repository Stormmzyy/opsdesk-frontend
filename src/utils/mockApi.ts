// True when the in-browser mock API (MSW) is answering requests instead of the
// real backend: only under `npm run dev`, and only when .env sets
// VITE_USE_MOCK_API=true (see .env.example).
//
// One function, so main.tsx (which starts the mock) and the pages that offer
// mock-only features always agree on whether the mock is running.
export function isMockApiEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === 'true'
}

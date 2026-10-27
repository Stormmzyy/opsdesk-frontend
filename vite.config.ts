import react from '@vitejs/plugin-react'
// Importing defineConfig from "vitest/config" instead of "vite" gives it the
// extra "test" option below, so TypeScript checks our test settings too.
// It still accepts every normal Vite option, like plugins.
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Tests run in Node, which has no browser. jsdom fakes one (document,
    // window, elements), so components can render as if in a real page.
    environment: 'jsdom',
    // Makes describe, it and expect available without importing them, and lets
    // Testing Library clean up the rendered page after each test automatically.
    globals: true,
    // Runs before every test file: it adds the extra DOM matchers.
    setupFiles: './src/setupTests.ts',
    // Tests always talk to the mock API, whatever a developer's .env says.
    // Vitest reads .env like the dev server does, and .env now points at the
    // real backend (http://localhost:8080/api/v1). The tests' mock handlers
    // listen on the relative /api/v1 paths, so with the real URL every request
    // went past them to port 8080 instead, and the tests failed (or would
    // quietly depend on a running backend). Pinning the URL here keeps the
    // tests independent of .env and of whether the backend is running.
    env: {
      VITE_API_URL: '/api/v1',
    },
  },
})

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
  },
})

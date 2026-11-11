import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
// Importing defineConfig from "vitest/config" instead of "vite" gives it the
// extra "test" option below, so TypeScript checks our test settings too.
// It still accepts every normal Vite option, like plugins.
import { defineConfig } from 'vitest/config'

// A production build refuses to run without VITE_API_URL, the same rule as
// the backend's RequiredSettingsCheck: a missing setting stops the build
// instead of producing a broken artifact.
//
// Why the build and not the app: Vite writes the value into the bundle as a
// literal string when `vite build` runs. Without it, src/store/api.ts falls
// back to "/api/v1" on the page's own origin, the build succeeds, and the
// result answers 404 to every request once deployed. In Docker the value
// arrives as a build argument, so a typo in the compose file would produce
// exactly that image, silently.
//
// Accepted: an absolute http(s) URL (the backend somewhere else), or a path
// starting with "/" (same origin, behind a server that forwards /api to the
// backend). Writing a path is a decision; leaving the variable out is not.
//
// apply: 'build' means the dev server and the tests never run this, so a
// fresh clone with no .env still starts with `npm run dev`. config.env holds
// the value the bundle will get: the environment's, or else .env's.
function requireApiUrl(): Plugin {
  let value: string | undefined
  return {
    name: 'opsdesk:require-api-url',
    apply: 'build',
    configResolved(config) {
      value = config.env.VITE_API_URL
    },
    buildStart() {
      const url = value?.trim() ?? ''
      if (url === '') {
        this.error(
          'VITE_API_URL is not set. A production build writes it into the bundle, and without it ' +
            'the app would call /api/v1 on its own origin. Set it for the build, e.g. ' +
            'VITE_API_URL=https://api.example.com/api/v1 npm run build (in Docker, as a build argument).',
        )
      }
      if (!/^https?:\/\/[^/\s]+/.test(url) && !url.startsWith('/')) {
        this.error(
          `VITE_API_URL is not a URL: "${url}". Use an absolute http(s) URL such as ` +
            'https://api.example.com/api/v1, or a path such as /api/v1 when the same server forwards /api to the backend.',
        )
      }
    },
  }
}

// Keeps MSW's service worker out of production builds. Everything in public/
// is copied into the build as it is, and Vite has no way to leave one file
// out, so this deletes it from the output after the copy. The file stays in
// public/, where the dev server serves it and `msw init` keeps it current.
// The mock's own code is dropped separately, by the DEV check in main.tsx.
function dropMockServiceWorker(): Plugin {
  return {
    name: 'opsdesk:drop-mock-service-worker',
    apply: 'build',
    async writeBundle(options) {
      if (options.dir) {
        await rm(join(options.dir, 'mockServiceWorker.js'), { force: true })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), requireApiUrl(), dropMockServiceWorker()],
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

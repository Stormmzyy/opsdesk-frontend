// Runs before every test file (see "setupFiles" in vite.config.ts).
//
// Adds DOM matchers such as toBeInTheDocument() and toHaveAccessibleDescription()
// to expect(). The "/vitest" entry of @testing-library/jest-dom is the one made
// for Vitest: it registers the matchers AND tells TypeScript about them.
import '@testing-library/jest-dom/vitest'

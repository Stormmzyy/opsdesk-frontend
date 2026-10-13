// Runs before every test file (see "setupFiles" in vite.config.ts).
//
// Adds DOM matchers such as toBeInTheDocument() and toHaveAccessibleDescription()
// to expect(). The "/vitest" entry of @testing-library/jest-dom is the one made
// for Vitest: it registers the matchers AND tells TypeScript about them.
import '@testing-library/jest-dom/vitest'

// jsdom (the pretend browser the tests run in) has the <dialog> element and
// its `open` property, but not the showModal() and close() methods that
// ConfirmDialog calls. These stand-ins do the part the tests rely on:
// - showModal() adds the `open` attribute, which makes `dialog.open` true.
// - close() removes it and fires a "close" event, like a real browser, so
//   ConfirmDialog's onClose handler runs.
// They don't trap focus or make the page inert: only real browsers do that,
// which is why those were checked by hand in the browser instead.
// The `if` leaves real implementations alone, should jsdom ever add them.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) {
      return
    }
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

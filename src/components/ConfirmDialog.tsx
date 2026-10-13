import { useEffect, useId, useRef } from 'react'
import { focusMainHeading } from '../utils/focus.ts'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  // Whether the dialog is showing. The parent owns this, like a form input.
  open: boolean
  // The heading, e.g. "Delete this ticket?"
  title: string
  // What will happen if the user confirms, in plain words.
  description: string
  // The confirm button's text, e.g. "Delete ticket". Say what it does:
  // "Delete ticket" is clearer than "OK" or "Yes".
  confirmLabel: string
  // Called only when the user presses the confirm button.
  onConfirm: () => void
  // Called whenever the dialog closes: Cancel, Escape, or after confirming.
  // The parent sets `open` back to false here.
  onClose: () => void
}

// A "Are you sure?" dialog for actions that can't be undone.
//
// It's built on the browser's own <dialog> element, opened with showModal().
// That gives us, for free, things that are hard to get right by hand with a
// <div>:
// - Focus is trapped inside: Tab can't wander to the page behind.
// - The page behind is "inert": it can't be clicked, and screen readers
//   ignore it while the dialog is open.
// - Escape closes it.
// - It sits above everything else (the "top layer"), with a ::backdrop.
// - Screen readers announce it as a dialog, with our heading as its name.
function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  // The element that had focus when the dialog opened (usually the button
  // that opened it), so focus can go back there afterwards.
  const openerRef = useRef<HTMLElement | null>(null)
  // useId makes ids that are unique on the page, even with two dialogs.
  const titleId = useId()
  const descriptionId = useId()

  // Keep the real <dialog> in step with the `open` prop. showModal() and
  // close() are methods on the element, so they have to be called from an
  // effect, after React has put the element on the page.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }
    if (open && !dialog.open) {
      const activeElement = document.activeElement
      openerRef.current = activeElement instanceof HTMLElement ? activeElement : null
      dialog.showModal()
      // Start on Cancel, the safe choice: pressing Enter straight away
      // should never delete anything.
      cancelRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // The <dialog> fires "close" however it was closed (Escape, Cancel, or
  // the parent setting open to false), so this one handler covers them all.
  function handleClose() {
    // Browsers usually do this themselves, but not all of them reliably, so
    // put focus back on the opener ourselves. isConnected is false if the
    // opener has left the page (e.g. we navigated away after deleting), and
    // then the page's own focus handling takes over.
    const opener = openerRef.current
    if (opener && opener.isConnected) {
      opener.focus()
    }
    // A safety net: if the opener couldn't take focus (for example it was
    // disabled), focus would be left on a button inside the now hidden
    // dialog. Send it to the page's heading instead.
    if (dialogRef.current?.contains(document.activeElement)) {
      focusMainHeading()
    }
    openerRef.current = null
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      // The dialog's accessible name and description come from these, so a
      // screen reader says e.g. "Delete this ticket?, dialog, This will
      // permanently delete…" as soon as it opens.
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={handleClose}
    >
      <h2 id={titleId}>{title}</h2>
      <p id={descriptionId}>{description}</p>
      <div className="confirm-dialog__actions">
        {/* close() fires the "close" event, which runs handleClose. */}
        <button
          ref={cancelRef}
          type="button"
          className="button"
          onClick={() => dialogRef.current?.close()}
        >
          Cancel
        </button>
        <button type="button" className="button button--danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}

export default ConfirmDialog

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface SkeletonGroupProps {
  // What screen readers hear, e.g. "Loading tickets". Leave it out when
  // another group on the same page already announces the same thing.
  label?: string
  // The Skeleton blocks, laid out like the real content.
  children: ReactNode
}

// Wraps a set of skeletons. It does two jobs:
// - Hides the grey blocks from screen readers (aria-hidden), since they
//   mean nothing to them.
// - Announces the label instead, in a visually hidden live region.
function SkeletonGroup({ label, children }: SkeletonGroupProps) {
  const regionRef = useRef<HTMLParagraphElement>(null)

  // Screen readers only reliably announce a change INSIDE a live region that
  // was already on the page (the same reason Notifications keeps its regions
  // in place). So the region is rendered empty, and the words are written
  // into it straight after, once it exists. The effect talks to the page
  // directly (through the ref) rather than through state, because nothing
  // else on screen depends on it: it's only there for screen readers.
  // React never touches the text itself, because the <p> has no children.
  useEffect(() => {
    if (regionRef.current) {
      regionRef.current.textContent = label ?? ''
    }
  }, [label])

  return (
    <div>
      <p ref={regionRef} className="visually-hidden" role="status" />
      <div aria-hidden="true">{children}</div>
    </div>
  )
}

export default SkeletonGroup

import { useEffect, useState } from 'react'
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
  // Screen readers only reliably announce a change INSIDE a live region that
  // was already on the page (the same reason Notifications keeps its regions
  // in place). So the region is rendered empty first, and the words are
  // added straight after, once it exists.
  const [announcement, setAnnouncement] = useState('')
  useEffect(() => {
    setAnnouncement(label ?? '')
  }, [label])

  return (
    <div>
      <p className="visually-hidden" role="status">
        {announcement}
      </p>
      <div aria-hidden="true">{children}</div>
    </div>
  )
}

export default SkeletonGroup

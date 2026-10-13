import './Skeleton.css'

interface SkeletonProps {
  // Any CSS length, e.g. '60%' or '120px'. Defaults to the full width.
  width?: string
  // Any CSS length. Defaults to the height of one line of text.
  height?: string
  // 'pill' for rounded badges and buttons, 'block' for everything else.
  shape?: 'block' | 'pill'
}

// A grey placeholder block shown where content will appear once it loads.
// Skeletons are drawn in the same shape and size as the real content, so the
// page doesn't jump around when the data arrives.
//
// aria-hidden: an empty grey box means nothing to a screen reader. Whatever
// uses skeletons also announces "Loading…" in words (see SkeletonGroup).
function Skeleton({ width = '100%', height = '1em', shape = 'block' }: SkeletonProps) {
  return (
    <span
      className={shape === 'pill' ? 'skeleton skeleton--pill' : 'skeleton'}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

export default Skeleton

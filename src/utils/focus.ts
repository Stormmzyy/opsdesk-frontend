// Moves keyboard focus to the current page's main heading (its <h1>), or to
// <main> itself if the page has no heading yet (for example while a lazy page
// is still loading).
//
// Screen readers read out whatever receives focus, so this tells them which
// page they're on, and keyboard users carry on from the top of the content
// instead of from wherever they were before.
//
// We look the heading up in the page because it's rendered by whichever page
// is showing, so Layout has no direct reference to it.
export function focusMainHeading() {
  const main = document.getElementById('main-content')
  const heading = main?.querySelector('h1')
  // focus() only exists on HTML elements, so check before calling it.
  if (heading instanceof HTMLElement) {
    heading.focus()
  } else if (main) {
    main.focus()
  }
}

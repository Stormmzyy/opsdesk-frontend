import { Component, createRef } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './ErrorBoundary.css'

interface ErrorBoundaryProps {
  children: ReactNode
  // When this value changes, a boundary that is showing its fallback goes back
  // to showing its children. We pass the current URL path, so moving to
  // another page clears the error instead of leaving the app stuck on it.
  resetKey?: string
  // true for the outer boundary around the whole app. If it ever shows, the
  // Layout (and its <main>) is gone, so the fallback brings its own <main>.
  fullPage?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  // The resetKey from the last render, so a change can be noticed.
  resetKey: string | undefined
}

// Catches errors thrown while React renders the components inside it, and
// shows a friendly fallback instead of a blank white page.
//
// It has to be a class: React has no hook for catching render errors, only
// the two class methods getDerivedStateFromError and componentDidCatch.
//
// What it does NOT catch: errors in event handlers (like onClick), in async
// code (like a failed fetch or a setTimeout), or in the boundary itself.
// Those don't happen while React is rendering, so React can't step in.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, resetKey: this.props.resetKey }

  // A handle on the fallback's heading, so focus can be moved there.
  headingRef = createRef<HTMLHeadingElement>()

  // React calls this when a component below throws while rendering. The
  // object it returns is merged into state, so the next render shows the
  // fallback. It must only work out new state: no logging or other side
  // effects here, which is what componentDidCatch is for.
  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true }
  }

  // React calls this before every render. If resetKey has changed (the user
  // moved to another page), clear the error so the new page gets a fresh
  // chance to render. Returning null means "no change to state".
  // Doing this here, rather than in componentDidUpdate, avoids rendering
  // the old fallback once and then immediately rendering again.
  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null {
    if (props.resetKey !== state.resetKey) {
      return { hasError: false, resetKey: props.resetKey }
    }
    return null
  }

  // Called after the fallback is on screen. This is the place for side
  // effects: we log the error and the component stack (which component
  // threw, and the components above it) so a developer can find the cause in
  // the browser console. The user never sees these details.
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info.componentStack)
  }

  // If the very first render crashes, the fallback mounts straight away.
  componentDidMount() {
    if (this.state.hasError) {
      this.focusHeading()
    }
  }

  // The first parameter (the previous props) isn't needed, hence the _.
  componentDidUpdate(_previousProps: ErrorBoundaryProps, previousState: ErrorBoundaryState) {
    // The fallback has just appeared: whatever had focus is probably gone,
    // so move focus to the heading. Screen readers then read it out, and
    // keyboard users carry on from the fallback's buttons.
    if (this.state.hasError && !previousState.hasError) {
      this.focusHeading()
    }
  }

  focusHeading() {
    this.headingRef.current?.focus()
  }

  // An arrow function, so `this` still means this boundary when React calls
  // it from the button's onClick.
  handleTryAgain = () => {
    // Render the children again. If the problem was temporary it works;
    // if not, they throw again and the fallback comes straight back.
    this.setState({ hasError: false })
  }

  handleReload = () => {
    // A full page reload: starts the whole app again from scratch.
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    // The raw error message and stack are deliberately NOT shown: they mean
    // nothing to a user and can reveal how the app works inside.
    const fallback = (
      <div className="error-fallback">
        {/* The crashed page's own <h1> is gone, so this becomes the page's
            one <h1>. tabIndex={-1} lets code focus it without adding it to
            the Tab order. */}
        <h1 ref={this.headingRef} tabIndex={-1}>
          Something went wrong
        </h1>
        <p>
          Sorry, this part of OpsDesk stopped working. Your tickets are safe. You can try again,
          reload the page, or go back to the dashboard.
        </p>
        <div className="error-fallback__actions">
          <button type="button" className="button button--primary" onClick={this.handleTryAgain}>
            Try again
          </button>
          <button type="button" className="button" onClick={this.handleReload}>
            Reload page
          </button>
          <Link to="/dashboard" className="button">
            Go to the dashboard
          </Link>
        </div>
      </div>
    )

    return this.props.fullPage ? (
      <main className="error-fallback-page">{fallback}</main>
    ) : (
      fallback
    )
  }
}

export default ErrorBoundary

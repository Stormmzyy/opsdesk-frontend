import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { authApi, useLoginMutation } from '../store/authApi.ts'
import { readApiError } from '../store/apiError.ts'
import { selectCurrentUser, signedOut, tokenReceived } from '../store/authSlice.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import './AuthPage.css'

// What another page can pass when it sends someone here: a message to show
// above the form ("Account created…", "Your session expired…"), an email to
// fill in, and the page to return to after signing in.
//
// `from` comes from the router's state, which only our own code can set (a
// link from another site can't), so going there isn't an open redirect.
export interface LoginPageState {
  notice?: string
  email?: string
  from?: string
}

type LoginField = 'email' | 'password'

function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const location = useLocation()
  // location.state is whatever the previous page passed; it's `unknown`
  // to the router, and can be anything (or nothing) after a refresh.
  const passed = (location.state ?? {}) as LoginPageState
  const currentUser = useAppSelector(selectCurrentUser)

  const [login] = useLoginMutation()
  const [email, setEmail] = useState(passed.email ?? '')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<LoginField, string>>>({})
  // A message about the whole form rather than one field: a wrong password,
  // or the server being unreachable.
  const [formError, setFormError] = useState<string | null>(null)
  // True from the click until /auth/me has answered: two requests, so the
  // mutation's own isLoading (true for the first only) isn't enough.
  const [isSigningIn, setIsSigningIn] = useState(false)

  // Back where they were when the session ran out, or the dashboard.
  const destination = passed.from ?? '/dashboard'

  // Already signed in: nothing to do here.
  if (currentUser) {
    return <Navigate to={destination} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    // The same two checks the server makes (API_CONTRACT.md, POST /auth/login),
    // with the same messages, so an empty form doesn't need a round trip.
    // The server still checks: these are for speed, not for safety.
    const errors: Partial<Record<LoginField, string>> = {}
    if (email.trim() === '') errors.email = 'Email is required.'
    if (password === '') errors.password = 'Password is required.'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    setIsSigningIn(true)
    let gotToken = false
    try {
      // Sent exactly as typed. The server compares the email without regard
      // to case, and a password is never trimmed (the contract's rules).
      const { token } = await login({ email, password }).unwrap()

      // Store the token first: prepareHeaders reads it from the store, so
      // the request below is the first one that carries it.
      dispatch(tokenReceived(token))
      gotToken = true

      // Then ask the server who that token belongs to. authSlice stores the
      // answer as the current user; see there for why the role comes from
      // here and not from the token. forceRefetch: a cached answer could be
      // the previous person's.
      const me = dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true }))
      try {
        await me.unwrap()
      } finally {
        // This page only needed the answer once; the slice keeps the user.
        me.unsubscribe()
      }

      navigate(destination, { replace: true })
    } catch (error) {
      // A token whose /auth/me failed is no use: drop it, so the app isn't
      // left half signed in.
      if (gotToken) {
        dispatch(signedOut())
      }
      const apiError = readApiError(error)
      if (apiError?.error === 'VALIDATION_ERROR') {
        setFieldErrors(apiError.fields)
      } else if (apiError) {
        // The 401 lands here: "The email or password is incorrect." The
        // server deliberately doesn't say which, and neither do we.
        setFormError(apiError.message)
      } else {
        setFormError("Couldn't reach the server. Check your connection and try again.")
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <main id="main-content" className="auth-page" tabIndex={-1}>
      <div className="auth-page__card">
        <h1 className="auth-page__title">Sign in to OpsDesk</h1>

        {passed.notice && (
          <p className="auth-page__notice" role="status">
            {passed.notice}
          </p>
        )}
        {formError && (
          <p className="auth-page__form-error" role="alert">
            {formError}
          </p>
        )}

        {/* noValidate: our messages instead of the browser's pop-ups. */}
        <form className="auth-page__form" onSubmit={handleSubmit} noValidate>
          <div className="auth-page__field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
            />
            {fieldErrors.email && (
              <p id="login-email-error" className="auth-page__error">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="auth-page__field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
            />
            {fieldErrors.password && (
              <p id="login-password-error" className="auth-page__error">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button type="submit" className="button button--primary" disabled={isSigningIn}>
            {isSigningIn ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-page__switch">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </div>
    </main>
  )
}

export default LoginPage

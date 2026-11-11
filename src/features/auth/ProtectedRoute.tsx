import { Navigate, Outlet, useLocation } from 'react-router-dom'
import StatusMessage from '../../components/StatusMessage.tsx'
import type { LoginPageState } from '../../pages/LoginPage.tsx'
import { useGetMeQuery } from '../../store/authApi.ts'
import type { SignOutReason } from '../../store/authSlice.ts'
import { selectCurrentUser, selectSignOutReason, selectToken } from '../../store/authSlice.ts'
import { useAppSelector } from '../../store/hooks.ts'
import '../../pages/AuthPage.css'

// What the sign-in page says, depending on why the person is there.
const NOTICES: Record<SignOutReason, string> = {
  expired: 'Your session expired. Sign in again to carry on.',
  'signed-out': "You've logged out.",
}

// The ONE guard in front of the signed-in pages. It answers one question:
// is there a session to show these pages to?
// - No token: go to /login. Always, and before rendering anything here, so
//   no page below can mount and send a request without a token, not even
//   for one render. (Week 8 found exactly that in the browser: a dashboard
//   that flashed after a rejected token and sent /tickets with none.
//   ProtectedRoute.test.tsx guards it.)
// - A token but no user yet (a page load with a token from localStorage):
//   ask GET /auth/me first. A token for an account that's gone or changed is
//   caught here, once, rather than by whichever ticket request goes first,
//   and the pages need the role anyway.
// - A token and a user: show the page.
//
// What it deliberately does NOT do is decide that a session has ended. That
// is the base query's job (api.ts): it sees every 401, including the one
// /auth/me gets here, and clears the token. This component then just sees
// "no token". Two guards that each judged 401s could disagree; one that
// judges and one that reacts can't.
function ProtectedRoute() {
  const location = useLocation()
  const token = useAppSelector(selectToken)
  const user = useAppSelector(selectCurrentUser)
  const reason = useAppSelector(selectSignOutReason)

  // skip: no request when there's nothing to check (no token), or nothing
  // left to check (the user is already known, e.g. straight after login).
  const { isError, refetch } = useGetMeQuery(undefined, { skip: token === null || user !== null })

  if (token === null) {
    const state: LoginPageState = {
      notice: reason ? NOTICES[reason] : undefined,
      // Where to come back to after signing in. Not after a deliberate
      // log out: whoever signs in next may be someone else, and shouldn't
      // land on the previous person's page.
      from: reason === 'signed-out' ? undefined : location.pathname + location.search,
    }
    return <Navigate to="/login" replace state={state} />
  }
  if (user !== null) {
    return <Outlet />
  }
  // Any error that reaches here is NOT a 401 (a 401 has already cleared the
  // token, above): the server is down or restarting, or the network is gone.
  // That says nothing about the token, so it's kept, with a Retry.
  if (isError) {
    return (
      <main id="main-content" className="auth-page" tabIndex={-1}>
        <StatusMessage type="error" onRetry={refetch}>
          Couldn&apos;t check your sign-in with the server. Check your connection and try again.
        </StatusMessage>
      </main>
    )
  }
  return (
    <main id="main-content" className="auth-page" tabIndex={-1}>
      <StatusMessage type="loading">Checking your sign-in…</StatusMessage>
    </main>
  )
}

export default ProtectedRoute

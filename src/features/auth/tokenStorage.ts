// The token's copy in localStorage, so a page refresh doesn't sign people out.
// The Redux store (store/authSlice.ts) holds the token the app actually uses;
// this file only mirrors it.
//
// Why localStorage, and what that costs: opsdesk-backend NOTES.md, decision 70.
//
// Every access is wrapped in try/catch. localStorage can throw rather than
// just return nothing: some private-browsing modes refuse it, a user can
// block site data, and a full quota throws on write. Losing the copy only
// means signing in again after a refresh. Letting it throw would stop the app
// rendering at all, because the store reads it while it's being created.

const TOKEN_KEY = 'opsdesk.token'

export function readStoredToken(): string | null {
  try {
    const token = window.localStorage.getItem(TOKEN_KEY)
    // An empty string is no token, not a token that will be sent as "Bearer ".
    return token ? token : null
  } catch {
    return null
  }
}

export function storeToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // The app still works with the token in memory; a refresh will ask the
    // person to sign in again. Nothing to tell them now.
  }
}

export function clearStoredToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // If storage can't be reached, there's nothing in it to remove either.
  }
}

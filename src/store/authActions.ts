import { createAction } from '@reduxjs/toolkit'

// "The server rejected our token": dispatched by the base query in api.ts on
// a 401, and handled by authSlice.
//
// It lives in its own file, with no imports of ours, to break an import
// cycle. api.ts needs it, and authSlice.ts imports authApi.ts, which imports
// api.ts. If api.ts imported it from authSlice.ts, loading api.ts would load
// authApi.ts before `api` existed, and injectEndpoints would fail at start-up.
export const sessionExpired = createAction('auth/sessionExpired')

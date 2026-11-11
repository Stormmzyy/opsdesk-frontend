import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import type { LoginPageState } from './LoginPage.tsx'
import { useRegisterMutation } from '../store/authApi.ts'
import type { RegisterRequest } from '../store/authApi.ts'
import { readApiError } from '../store/apiError.ts'
import { selectCurrentUser } from '../store/authSlice.ts'
import { useAppSelector } from '../store/hooks.ts'
import './AuthPage.css'

type RegisterField = keyof RegisterRequest

const EMPTY: RegisterRequest = { name: '', username: '', email: '', password: '' }

// The four fields, in the contract's order (API_CONTRACT.md, POST /auth/register).
const FIELDS: { name: RegisterField; label: string; type: string; autoComplete: string }[] = [
  { name: 'name', label: 'Full name', type: 'text', autoComplete: 'name' },
  { name: 'username', label: 'Username', type: 'text', autoComplete: 'username' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
]

function RegisterPage() {
  const navigate = useNavigate()
  const currentUser = useAppSelector(selectCurrentUser)
  const [register, { isLoading }] = useRegisterMutation()
  const [values, setValues] = useState<RegisterRequest>(EMPTY)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterField, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)

  if (currentUser) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    // Only "is it filled in", with the contract's messages. The real rules
    // (the username's characters, the 72-byte password limit, a taken email)
    // are the server's, and its VALIDATION_ERROR lands under the same fields.
    // Copying them here would be a second copy that could drift.
    const errors: Partial<Record<RegisterField, string>> = {}
    if (values.name.trim() === '') errors.name = 'Name is required.'
    if (values.username === '') {
      errors.username = 'Username must be 3 to 30 letters, numbers, dots or underscores.'
    }
    if (values.email === '') errors.email = 'Enter a valid email address.'
    if (values.password === '') errors.password = 'Password must be at least 8 characters.'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    try {
      const created = await register(values).unwrap()
      // Registering returns the new user but no token (the contract), so
      // the person signs in next, with the email already filled in. The
      // server stores it lowercased; that's the one shown.
      const state: LoginPageState = {
        notice: 'Your account was created. Sign in to continue.',
        email: created.email,
      }
      navigate('/login', { replace: true, state })
    } catch (error) {
      const apiError = readApiError(error)
      if (apiError?.error === 'VALIDATION_ERROR') {
        setFieldErrors(apiError.fields)
      } else if (apiError) {
        // 409: "An account with this email already exists." (or username).
        setFormError(apiError.message)
      } else {
        setFormError("Couldn't reach the server. Check your connection and try again.")
      }
    }
  }

  return (
    <main id="main-content" className="auth-page" tabIndex={-1}>
      <div className="auth-page__card">
        <h1 className="auth-page__title">Create an account</h1>
        <p className="auth-page__hint">
          New accounts can raise tickets and follow their own. An administrator can give you more.
        </p>

        {formError && (
          <p className="auth-page__form-error" role="alert">
            {formError}
          </p>
        )}

        <form className="auth-page__form" onSubmit={handleSubmit} noValidate>
          {FIELDS.map((field) => {
            const id = `register-${field.name}`
            const error = fieldErrors[field.name]
            return (
              <div className="auth-page__field" key={field.name}>
                <label htmlFor={id}>{field.label}</label>
                <input
                  id={id}
                  name={field.name}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  value={values[field.name]}
                  onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${id}-error` : undefined}
                />
                {error && (
                  <p id={`${id}-error`} className="auth-page__error">
                    {error}
                  </p>
                )}
              </div>
            )
          })}

          <button type="submit" className="button button--primary" disabled={isLoading}>
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-page__switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  )
}

export default RegisterPage

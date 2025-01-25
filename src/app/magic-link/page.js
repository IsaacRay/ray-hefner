// app/sign-in/page.jsx
'use client' // We need client-side rendering for form submission & Supabase calls

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js';
import 'bootstrap/dist/css/bootstrap.min.css'
// Load environment variables from .env file in local development
export const dynamic = 'force-dynamic'
require('dotenv').config();


const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

 
// Initialize Supabase client
const supabase = createClient(
  "https://lzxiyzhookfqphsmrwup.supabase.co",
  supabaseKey,
  {
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, { ...options, cache: 'no-store' });
      }
    }
  }
);

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async (event) => {
    event.preventDefault()
    setStatusMessage('')
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Must match your "Additional Redirect URLs" in Supabase Auth settings
        emailRedirectTo: `https://ray-hefner.com/squares`,
      },
    })

    setIsLoading(false)

    if (error) {
      setStatusMessage(`Error: ${error.message}`)
    } else {
      setStatusMessage('Check your inbox for a magic link!')
    }
  }

  return (
    <main className="container-fluid bg-light min-vh-100 d-flex flex-column justify-content-center align-items-center">
      <div className="row w-100 px-2">
        <div className="col-12 col-md-6 offset-md-3 col-lg-4 offset-lg-4">
          <div className="card shadow">
            <div className="card-body">
              <h1 className="card-title text-center mb-4">Sign In</h1>
              <form onSubmit={handleSignIn}>
                <div className="mb-3">
                  <label htmlFor="emailInput" className="form-label fw-semibold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="emailInput"
                    className="form-control"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Sending...
                    </>
                  ) : (
                    'Send Magic Link'
                  )}
                </button>
              </form>

              {statusMessage && (
                <div
                  className={`alert mt-3 ${
                    statusMessage.startsWith('Error')
                      ? 'alert-danger'
                      : 'alert-info'
                  }`}
                  role="alert"
                >
                  {statusMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
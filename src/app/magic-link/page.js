/// app/sign-in/page.jsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation' // For client-side navigation
import 'bootstrap/dist/css/bootstrap.min.css'

export const dynamic = 'force-dynamic'

// Load environment variables from .env file in local development
require('dotenv').config()

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
const env = process.env.NEXT_PUBLIC_ENVIRONMENT || 'production'

// Initialize Supabase client
const supabase = createClient(
  'https://lzxiyzhookfqphsmrwup.supabase.co',
  supabaseKey,
  {
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, { ...options, cache: 'no-store' })
      },
    },
  }
)

export default function SignInPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  // 1. Check if session exists on mount
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        // Check if there's a redirect parameter
        const urlParams = new URLSearchParams(window.location.search)
        const redirect = urlParams.get('redirect')
        
        if (redirect === 'madison') {
          router.push('/madison')
        } else {
          // Default redirect to /squares
          router.push('/squares')
        }
      } else {
        // Otherwise, show the sign-in form
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [router])

  // 2. Handle sign-in
  const handleSignIn = async (event) => {
    event.preventDefault()
    setStatusMessage('')
    setIsLoading(true)

    // Check if there's a redirect parameter in URL
    const urlParams = new URLSearchParams(window.location.search)
    const redirect = urlParams.get('redirect')
    
    const isLocal = env === 'local'
    let redirectPath = '/squares' // default
    
    if (redirect === 'madison') {
      redirectPath = '/madison'
    }
    
    const redirectUrl = isLocal
      ? `http://localhost:3000${redirectPath}`
      : `https://ray-hefner.com${redirectPath}`
    console.log(redirectUrl)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Must match your "Additional Redirect URLs" in Supabase Auth settings
        emailRedirectTo: redirectUrl,
      },
    })

    setIsLoading(false)

    if (error) {
      setStatusMessage(`Error: ${error.message}`)
    } else {
      setStatusMessage('Check your inbox for a magic link!')
    }
  }

  // 3. While we're checking for an existing session, show a small loader (optional)
  if (checkingSession) {
    return (
      <main className="container-fluid d-flex flex-column justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </main>
    )
  }

  // 4. If no session, render the sign-in form
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

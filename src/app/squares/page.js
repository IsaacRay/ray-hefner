'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import 'bootstrap/dist/css/bootstrap.min.css'

// Force Next.js to dynamically render (re-check session on each load)
export const dynamic = 'force-dynamic'

// Load environment variables (for local dev)
require('dotenv').config()

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

// Initialize Supabase client
const supabase = createClient(
  'https://lzxiyzhookfqphsmrwup.supabase.co',
  supabaseKey,
  {
    global: {
      // Force no-store caching if needed
      fetch: (url, options = {}) => {
        return fetch(url, { ...options, cache: 'no-store' })
      },
    },
  }
)

export default function SquaresPage() {
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)

  const [squares, setSquares] = useState(Array(100).fill(null))
  const [loadingSquares, setLoadingSquares] = useState(false)

  const [userCounts, setUserCounts] = useState({})

  // New states for axis labels
  const [axisX, setAxisX] = useState([]) // e.g. [0,1,2,...,9]
  const [axisY, setAxisY] = useState([]) // e.g. [0,1,2,...,9]

  // 1) Check for a valid session on mount
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setLoadingSession(false)
    }
    checkSession()
  }, [])

  // 2) Once we have a session, fetch existing squares
  useEffect(() => {
    if (!loadingSession && session) {
      fetchSquares()
    }
  }, [loadingSession, session])

  // Function to fetch squares from /api/get-squares and update state
  const fetchSquares = async () => {
    try {
      setLoadingSquares(true)
      const response = await fetch('/api/get-squares')
      const data = await response.json()

      // data might look like:
      // {
      //   squares: [
      //     { squareId: 12, userEmail: 'someone@example.com' },
      //     ...
      //   ],
      //   axisX: [0,1,2,3,4,5,6,7,8,9],
      //   axisY: [0,1,2,3,4,5,6,7,8,9]
      // }

      const newSquares = Array(100).fill(null)
      for (const { squareId, userEmail } of data.squares || []) {
        if (squareId >= 0 && squareId < 100) {
          newSquares[squareId] = userEmail
        }
      }
      setSquares(newSquares)

      // Calculate user counts (how many squares each user has)
      const counts = {}
      for (const occupant of newSquares) {
        if (occupant) {
          counts[occupant] = (counts[occupant] || 0) + 1
        }
      }
      setUserCounts(counts)

      // Store axis labels if provided
      setAxisX(data.axisX || [])
      setAxisY(data.axisY || [])
    } catch (err) {
      console.error('Error fetching squares:', err)
    } finally {
      setLoadingSquares(false)
    }
  }

  // 3) Handle click on a square -> call /select-square -> then full refetch
  const handleSquareClick = async (squareId) => {
    try {
      const { user } = session // from Supabase session
      const response = await fetch('/api/select-square', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userUuid: user.id,
          email: user.email,
          squareId,
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        alert(result.error || 'Error toggling square')
        return
      }

      console.log('Select-square response:', result)
      // **Full re-fetch** to get the updated occupant data
      await fetchSquares()
    } catch (error) {
      console.error('Error selecting/unselecting square:', error)
    }
  }

  // RENDER LOGIC

  // If we're still checking the session
  if (loadingSession) {
    return (
      <main className="container py-5">
        <h1>Checking your session...</h1>
      </main>
    )
  }

  // If user is not signed in, show a link to sign in
  if (!session) {
    return (
      <main className="container py-5">
        <h1>No active session found</h1>
        <p>
          <a href="/magic-link" className="btn btn-primary">
            Go to Sign-In Page
          </a>
        </p>
      </main>
    )
  }

  // If we are loading squares, show a spinner
  if (loadingSquares) {
    return (
      <main className="container py-5">
        <div className="d-flex align-items-center">
          <strong>Loading squares...</strong>
          <div
            className="spinner-border text-primary ms-3"
            role="status"
            aria-hidden="true"
          ></div>
        </div>
      </main>
    )
  }

  // If user is signed in and squares are loaded
  return (
    <main className="container py-5">
      <div className="card shadow">
        <div className="card-body">
          <h1 className="card-title mb-3 text-center">Welcome!</h1>
          <p className="card-text text-center">
            You are signed in as <strong>{session?.user?.email}</strong>
          </p>
          <div className="text-center mb-4">
            <button
              className="btn btn-secondary"
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/magic-link'
              }}
            >
              Sign Out
            </button>
          </div>
          <hr />

          <h4 className="mb-3 text-center">Select a Square</h4>

          <div className="table-responsive">
            <table className="table table-bordered text-center align-middle">
              {/* If axisX is populated, render a header row */}
              {axisX.length > 0 && (
                <thead>
                  <tr>
                    {/* Empty corner if axisY is also shown */}
                    {axisY.length > 0 && <th></th>}
                    {axisX.map((val, i) => (
                      <th key={i}>{val}</th>
                    ))}
                  </tr>
                </thead>
              )}

              <tbody>
                {Array.from({ length: 10 }).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {/* If axisY is populated, show its label in the first cell */}
                    {axisY.length > 0 && <th>{axisY[rowIndex]}</th>}

                    {/* Each row has 10 columns of squares */}
                    {Array.from({ length: 10 }).map((_, colIndex) => {
                      const squareId = rowIndex * 10 + colIndex
                      const occupant = squares[squareId]
                      return (
                        <td
                          key={colIndex}
                          onClick={() => handleSquareClick(squareId)}
                          style={{
                            cursor: 'pointer',
                            width: '60px',
                            height: '60px',
                            border: occupant === session.user.email?'5px solid yellow':'1px solid #ccc',
                            backgroundColor: occupant ? occupant === session.user.email ?'#4181e0':'#eb5468' : '#41e06c',
                            color: '#fff',
                          }}
                        >
                          {occupant || 'Unclaimed!'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <hr />
          <h4 className="mt-4">User Selection Counts</h4>
          {Object.keys(userCounts).length === 0 ? (
            <p className="text-muted">No squares have been selected yet.</p>
          ) : (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">Squares Selected</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(userCounts).map(([userEmail, count]) => (
                  <tr key={userEmail}>
                    <td>{userEmail}</td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}

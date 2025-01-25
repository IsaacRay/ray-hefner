'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import 'bootstrap/dist/css/bootstrap.min.css'

export const dynamic = 'force-dynamic'

// Load environment variables
require('dotenv').config()

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
const supabaseUrl = 'https://lzxiyzhookfqphsmrwup.supabase.co'

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, { ...options, cache: 'no-store' })
    },
  },
})

export default function SquaresPage() {
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)

  const [squares, setSquares] = useState(Array(100).fill(null))
  const [loadingSquares, setLoadingSquares] = useState(false)
  const [userCounts, setUserCounts] = useState({})

  // Axis labels
  const [axisX, setAxisX] = useState([])
  const [axisY, setAxisY] = useState([])

  // 1) Check session on mount
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setLoadingSession(false)
    }
    checkSession()
  }, [])

  // 2) Once we have a session, fetch squares
  useEffect(() => {
    if (!loadingSession && session) {
      fetchSquares()
    }
  }, [loadingSession, session])

  const fetchSquares = async () => {
    try {
      setLoadingSquares(true)
      const res = await fetch('/api/get-squares')
      const data = await res.json()

      // squares: [ { squareId, userEmail }, ... ], axisX, axisY
      const newSquares = Array(100).fill(null)
      for (const { squareId, userEmail } of data.squares || []) {
        if (squareId >= 0 && squareId < 100) {
          newSquares[squareId] = userEmail
        }
      }
      setSquares(newSquares)

      // Compute how many squares each user has
      const counts = {}
      for (const occupant of newSquares) {
        if (occupant) {
          counts[occupant] = (counts[occupant] || 0) + 1
        }
      }
      setUserCounts(counts)

      // Store axis arrays
      setAxisX(data.axisX || [])
      setAxisY(data.axisY || [])
    } catch (err) {
      console.error('Error fetching squares:', err)
    } finally {
      setLoadingSquares(false)
    }
  }

  const handleSquareClick = async (squareId) => {
    try {
      const { user } = session
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

      // Re-fetch squares to update occupant data
      await fetchSquares()
    } catch (error) {
      console.error('Error selecting/unselecting square:', error)
    }
  }

  // Rendering logic
  if (loadingSession) {
    return (
      <main className="container py-5">
        <h1>Checking your session...</h1>
      </main>
    )
  }

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

  return (
    <main className="container py-5">
      <div className="card shadow">
        <div className="card-body">
          <h1 className="card-title mb-3 text-center">Welcome!</h1>
          <p className="card-text text-center">
            AFC is on the top, NFC is on the side. Squares are $5 each,
            you may select as many as you'd like.
            <br />
            Payouts are $125 for first quarter, $125 for halftime,
            and $250 for final score. Good luck!
            <br />
            <br />
            https://venmo.com/u/Isaac-Ray-2
            <br />
            <br />
            https://www.paypal.me/IsaacRay
          </p>

          <br />
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

          {/*
            Wrap table in a container that:
            - is sized to fit within the card
            - allows horizontal scrolling on overflow
            - is relatively positioned for the top/side GIFs
          */}
          <div
            style={{
              position: 'relative',
              margin: '80px auto 0 auto', // push down from header
              maxWidth: '100%', // fill card width
              overflowX: 'auto', // horizontal scroll if too wide
            }}
          >
            {/* Top GIF (centered horizontally) */}
            <img
              src="/top.gif"
              alt="Top GIF"
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                top: '-60px',
                width: '60px',
                height: 'auto',
              }}
            />

            {/* Side GIF (centered vertically on left) */}
            <img
              src="/side.gif"
              alt="Side GIF"
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                left: '-80px',
                width: '60px',
                height: 'auto',
              }}
            />

            <table className="table table-bordered text-center align-middle">
              {axisX.length > 0 && (
                <thead>
                  <tr>
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
                    {axisY.length > 0 && <th>{axisY[rowIndex]}</th>}
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
                            border:
                              occupant === session.user.email
                                ? '5px solid yellow'
                                : '1px solid #ccc',
                            backgroundColor: occupant
                              ? occupant === session.user.email
                                ? '#4181e0'
                                : '#eb5468'
                              : '#41e06c',
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

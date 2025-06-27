'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

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
      <div className="container">
        <div className="card mt-8">
          <div className="text-center">
            <div style={{ padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
              <p>Checking your session...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container">
        <div className="card mt-8" style={{ maxWidth: '500px', margin: '2rem auto' }}>
          <div className="card-header text-center">
            <h1 className="card-title">Football Squares Pool</h1>
            <p className="card-subtitle">Join the fun and win prizes!</p>
          </div>
          
          <div className="text-center" style={{ padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏈</div>
            <p className="text-secondary mb-4">Please sign in to participate in the squares pool.</p>
            <Link href="/magic-link" className="btn btn-primary">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loadingSquares) {
    return (
      <div className="container">
        <div className="card mt-8">
          <div className="text-center">
            <div style={{ padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
              <p>Loading squares...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <main className="mt-8">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">🏈 Football Squares Pool</h1>
            <p className="card-subtitle">Welcome to the game! Pick your lucky squares.</p>
          </div>
          
          <div className="mb-6">
            <Link href="/home" className="btn btn-outline btn-sm mr-3">
              ← Back to Home
            </Link>
            <button
              className="btn btn-secondary btn-sm"
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/magic-link'
              }}
            >
              Sign Out
            </button>
          </div>

          {/* Game Info */}
          <div className="d-grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div className="card">
              <h2 className="card-title text-lg mb-3">Game Rules</h2>
              <ul className="text-sm">
                <li>AFC is on the top, NFC is on the side</li>
                <li>Squares are $5 each - select as many as you'd like</li>
                <li>Numbers will be randomly assigned after all squares are filled</li>
                <li>Winners determined by last digit of each team's score</li>
              </ul>
            </div>

            <div className="card">
              <h2 className="card-title text-lg mb-3">💰 Payouts</h2>
              <div className="d-flex gap-4" style={{ flexDirection: 'column' }}>
                <div className="d-flex justify-between">
                  <span>1st Quarter:</span>
                  <span className="font-bold text-success">$125</span>
                </div>
                <div className="d-flex justify-between">
                  <span>Halftime:</span>
                  <span className="font-bold text-success">$125</span>
                </div>
                <div className="d-flex justify-between">
                  <span>Final Score:</span>
                  <span className="font-bold text-success">$250</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="card-title text-lg mb-3">💳 Payment Info</h2>
              <div className="text-sm">
                <p className="mb-2">Venmo: <a href="https://venmo.com/u/Isaac-Ray-2" className="text-primary">@Isaac-Ray-2</a></p>
                <p>PayPal: <a href="https://www.paypal.me/IsaacRay" className="text-primary">IsaacRay</a></p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="card mb-6" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="text-center">
              <p className="text-secondary mb-2">Signed in as</p>
              <p className="font-medium">{session?.user?.email}</p>
            </div>
          </div>

          {/* Squares Grid */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title text-lg text-center">Select Your Squares</h2>
              <p className="card-subtitle text-center">Click any green square to claim it!</p>
            </div>
            
            <div style={{ overflowX: 'auto', padding: 'var(--space-4)' }}>
              <div
                style={{
                  position: 'relative',
                  margin: '60px auto',
                  display: 'inline-block',
                  minWidth: '700px'
                }}
              >
                {/* Top GIF (AFC) */}
                <img
                  src="/AFC.gif"
                  alt="AFC"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    top: '-50px',
                    width: '50px',
                    height: 'auto',
                  }}
                />

                {/* Side GIF (NFC) */}
                <img
                  src="/NFC.gif"
                  alt="NFC"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: '-60px',
                    width: '50px',
                    height: 'auto',
                  }}
                />

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'auto repeat(10, 1fr)',
                  gap: '2px',
                  backgroundColor: 'var(--border-color)',
                  padding: '2px',
                  borderRadius: 'var(--border-radius)'
                }}>
                  {/* Header row */}
                  <div></div>
                  {axisX.length > 0 && axisX.map((val, i) => (
                    <div 
                      key={i} 
                      className="text-center font-bold text-sm"
                      style={{ 
                        backgroundColor: 'var(--bg-tertiary)', 
                        padding: 'var(--space-2)',
                        minHeight: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {val}
                    </div>
                  ))}

                  {/* Grid rows */}
                  {Array.from({ length: 10 }).map((_, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                      {/* Row header */}
                      {axisY.length > 0 && (
                        <div 
                          className="text-center font-bold text-sm"
                          style={{ 
                            backgroundColor: 'var(--bg-tertiary)', 
                            padding: 'var(--space-2)',
                            minWidth: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {axisY[rowIndex]}
                        </div>
                      )}
                      
                      {/* Squares */}
                      {Array.from({ length: 10 }).map((_, colIndex) => {
                        const squareId = rowIndex * 10 + colIndex
                        const occupant = squares[squareId]
                        const isOwned = occupant === session.user.email
                        const isAvailable = !occupant
                        
                        return (
                          <div
                            key={colIndex}
                            onClick={() => handleSquareClick(squareId)}
                            className="text-center text-xs font-medium"
                            style={{
                              cursor: 'pointer',
                              minHeight: '50px',
                              minWidth: '50px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: isOwned 
                                ? 'var(--color-primary)' 
                                : isAvailable 
                                  ? 'var(--color-success)'
                                  : 'var(--color-error)',
                              color: 'white',
                              border: isOwned ? '3px solid var(--color-warning)' : 'none',
                              borderRadius: 'var(--border-radius-sm)',
                              transition: 'all var(--transition-fast)',
                              padding: 'var(--space-1)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={occupant || 'Available'}
                          >
                            {occupant ? (
                              occupant.split('@')[0].substring(0, 8)
                            ) : (
                              'OPEN'
                            )}
                          </div>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="d-flex justify-center gap-4 text-sm">
              <div className="d-flex align-center gap-2">
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  backgroundColor: 'var(--color-success)', 
                  borderRadius: 'var(--border-radius-sm)' 
                }}></div>
                <span>Available</span>
              </div>
              <div className="d-flex align-center gap-2">
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  backgroundColor: 'var(--color-primary)', 
                  border: '2px solid var(--color-warning)',
                  borderRadius: 'var(--border-radius-sm)' 
                }}></div>
                <span>Your Squares</span>
              </div>
              <div className="d-flex align-center gap-2">
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  backgroundColor: 'var(--color-error)', 
                  borderRadius: 'var(--border-radius-sm)' 
                }}></div>
                <span>Taken</span>
              </div>
            </div>
          </div>

          {/* User Selection Counts */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title text-lg">User Selection Counts</h2>
            </div>
            
            {Object.keys(userCounts).length === 0 ? (
              <div className="text-center" style={{ padding: '2rem' }}>
                <p className="text-secondary">No squares have been selected yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr auto',
                  gap: 'var(--space-2)',
                  minWidth: '300px'
                }}>
                  {/* Header */}
                  <div className="font-semibold" style={{ 
                    padding: 'var(--space-3)', 
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--border-radius)'
                  }}>User</div>
                  <div className="font-semibold text-center" style={{ 
                    padding: 'var(--space-3)', 
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--border-radius)'
                  }}>Squares</div>
                  
                  {/* User counts */}
                  {Object.entries(userCounts).map(([userEmail, count]) => (
                    <React.Fragment key={userEmail}>
                      <div style={{ padding: 'var(--space-3)' }}>{userEmail.split('@')[0]}</div>
                      <div className="text-center font-medium" style={{ padding: 'var(--space-3)' }}>{count}</div>
                    </React.Fragment>
                  ))}
                  
                  {/* Total */}
                  <div className="font-bold" style={{ 
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--border-radius)'
                  }}>TOTAL</div>
                  <div className="font-bold text-center" style={{ 
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--border-radius)'
                  }}>{Object.values(userCounts).reduce((sum, count) => sum + count, 0)} / 100</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

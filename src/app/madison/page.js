'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import activities from './activities.json';

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

export default function MadisonVoting() {
  const [session, setSession] = useState(null);
  const [rankings, setRankings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    checkAuthentication();
    detectMobile();
  }, []);

  const detectMobile = () => {
    setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
  };

  const checkAuthentication = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
        await loadUserVotes(data.session.user.email);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeRankings = () => {
    const initialRankings = {};
    const groupedActivities = activities.reduce((groups, activity) => {
      if (!groups[activity.type]) {
        groups[activity.type] = [];
      }
      groups[activity.type].push(activity);
      return groups;
    }, {});

    // Initialize each type with default order
    Object.entries(groupedActivities).forEach(([type, typeActivities]) => {
      initialRankings[type] = typeActivities.map((activity, index) => ({
        ...activity,
        rank_position: index + 1
      }));
    });

    setRankings(initialRankings);
  };

  const loadUserVotes = async (email) => {
    try {
      const response = await fetch(`/api/madison-votes?email=${email}`);
      if (response.ok) {
        const votes = await response.json();
        
        if (votes.length === 0) {
          // No saved votes, initialize with default order
          initializeRankings();
          return;
        }

        const userRankings = {};
        
        // Group votes by type and organize by rank
        votes.forEach(vote => {
          if (!userRankings[vote.activity_type]) {
            userRankings[vote.activity_type] = [];
          }
          userRankings[vote.activity_type].push({
            name: vote.activity_name,
            type: vote.activity_type,
            rank_position: vote.rank_position
          });
        });

        // Sort by rank position and fill in any missing activities
        const groupedActivities = activities.reduce((groups, activity) => {
          if (!groups[activity.type]) {
            groups[activity.type] = [];
          }
          groups[activity.type].push(activity);
          return groups;
        }, {});

        Object.entries(groupedActivities).forEach(([type, typeActivities]) => {
          if (userRankings[type]) {
            // Sort saved rankings
            userRankings[type].sort((a, b) => a.rank_position - b.rank_position);
            
            // Add any missing activities to the end
            const savedNames = userRankings[type].map(item => item.name);
            const missingActivities = typeActivities.filter(activity => 
              !savedNames.includes(activity.name)
            );
            
            missingActivities.forEach((activity, index) => {
              userRankings[type].push({
                ...activity,
                rank_position: userRankings[type].length + index + 1
              });
            });
          } else {
            // No saved rankings for this type, use default order
            userRankings[type] = typeActivities.map((activity, index) => ({
              ...activity,
              rank_position: index + 1
            }));
          }
        });
        
        setRankings(userRankings);
      }
    } catch (error) {
      console.error('Error loading votes:', error);
      initializeRankings();
    }
  };

  const loadResults = async () => {
    try {
      const response = await fetch('/api/madison-votes?summary=true');
      if (response.ok) {
        const data = await response.json();
        setResults(data.results.sort((a, b) => b.score - a.score));
      }
    } catch (error) {
      console.error('Error loading results:', error);
      showAlert('Failed to load results', 'danger');
    }
  };

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  // Mobile tap-to-swap functionality
  const handleItemTap = (type, index) => {
    if (!isMobile) return;

    if (selectedItem && selectedItem.type === type) {
      // Swap the items
      const newRankings = { ...rankings };
      const typeRankings = [...newRankings[type]];
      
      // Swap items
      const temp = typeRankings[selectedItem.index];
      typeRankings[selectedItem.index] = typeRankings[index];
      typeRankings[index] = temp;
      
      // Update rank positions
      typeRankings.forEach((item, idx) => {
        item.rank_position = idx + 1;
      });
      
      newRankings[type] = typeRankings;
      setRankings(newRankings);
      setSelectedItem(null);
    } else {
      // Select this item
      setSelectedItem({ type, index });
    }
  };

  // Desktop drag and drop
  const handleDragStart = (e, type, index) => {
    if (isMobile) return;
    setDraggedIndex({ type, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, type, dropIndex) => {
    if (isMobile) return;
    e.preventDefault();
    
    if (!draggedIndex || draggedIndex.type !== type) {
      setDraggedIndex(null);
      return;
    }

    const newRankings = { ...rankings };
    const typeRankings = [...newRankings[type]];
    
    // Remove item from old position and insert at new position
    const [movedItem] = typeRankings.splice(draggedIndex.index, 1);
    typeRankings.splice(dropIndex, 0, movedItem);
    
    // Update rank positions
    typeRankings.forEach((item, idx) => {
      item.rank_position = idx + 1;
    });
    
    newRankings[type] = typeRankings;
    setRankings(newRankings);
    setDraggedIndex(null);
  };

  const saveVotes = async () => {
    if (!session) return;
    
    setSaving(true);
    try {
      // Convert rankings to votes array
      const votes = [];
      Object.entries(rankings).forEach(([type, typeRankings]) => {
        typeRankings.forEach((activity, index) => {
          votes.push({
            activity_name: activity.name,
            activity_type: activity.type,
            rank_position: index + 1
          });
        });
      });

      const response = await fetch('/api/madison-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          votes: votes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save votes');
      }

      showAlert('Rankings saved successfully!');
    } catch (error) {
      showAlert(error.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleShowResults = async () => {
    if (!showResults) {
      await loadResults();
    }
    setShowResults(!showResults);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card mt-8">
          <div className="text-center">
            <div style={{ padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
              <p>Checking authentication...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container">
        <div className="card mt-8" style={{ maxWidth: '500px', margin: '2rem auto' }}>
          <div className="card-header text-center">
            <h1 className="card-title">Madison Trip Voting</h1>
            <p className="card-subtitle">Rank your preferences for our Madison trip</p>
          </div>
          
          <div className="text-center" style={{ padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗳️</div>
            <p className="text-secondary mb-4">Please authenticate to vote on trip activities.</p>
            <Link href="/magic-link?redirect=madison" className="btn btn-primary">
              Get Magic Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activityTypes = Object.keys(rankings);

  return (
    <div className="container">
      <main className="mt-8">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">Madison Trip Voting</h1>
            <p className="card-subtitle">
              Welcome, {session.user.email}! 
              {isMobile ? ' Tap items to reorder your preferences.' : ' Drag items to reorder your preferences.'}
            </p>
          </div>
          
          <div className="mb-6">
            <Link href="/home" className="btn btn-outline btn-sm mr-3">
              ← Back to Home
            </Link>
            <button 
              className={`btn btn-sm mr-3 ${showResults ? 'btn-warning' : 'btn-outline'}`}
              onClick={handleShowResults}
            >
              {showResults ? 'Hide Results' : 'Show Results'}
            </button>
            <button 
              className="btn btn-success btn-sm" 
              onClick={saveVotes}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Rankings'}
            </button>
          </div>

          {alert && (
            <div className={`card mb-6 ${alert.type === 'danger' ? 'text-error' : 'text-success'}`} 
                 style={{ backgroundColor: alert.type === 'danger' ? 'var(--color-error-light)' : 'var(--color-success-light)' }}>
              <div className="d-flex justify-between align-center">
                <span>{alert.message}</span>
                <button 
                  className="btn btn-sm btn-outline" 
                  onClick={() => setAlert(null)}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {showResults && (
            <div className="card mb-6">
              <div className="card-header">
                <h2 className="card-title text-lg">Current Results (Ranked Choice)</h2>
              </div>
              
              {Object.keys(rankings).map(type => {
                const typeResults = results.filter(result => result.type === type);
                if (typeResults.length === 0) return null;
                
                const getBadgeColor = (type) => {
                  switch(type) {
                    case 'restaurant': return 'btn-primary';
                    case 'activity': return 'btn-success';
                    default: return 'btn-secondary';
                  }
                };
                
                return (
                  <div key={type} className="card mb-4">
                    <div className="card-header">
                      <h3 className="card-title text-base">
                        <span className={`btn btn-sm ${getBadgeColor(type)} mr-2`} style={{ pointerEvents: 'none' }}>
                          {type}s
                        </span>
                        Results
                      </h3>
                    </div>
                    
                    <div style={{ overflowX: 'auto' }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '60px 1fr 80px 80px 200px',
                        gap: 'var(--space-2)',
                        minWidth: '600px'
                      }}>
                        {/* Header */}
                        <div className="font-semibold text-sm" style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-tertiary)' }}>Rank</div>
                        <div className="font-semibold text-sm" style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-tertiary)' }}>Name</div>
                        <div className="font-semibold text-sm" style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-tertiary)' }}>Score</div>
                        <div className="font-semibold text-sm" style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-tertiary)' }}>Votes</div>
                        <div className="font-semibold text-sm" style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-tertiary)' }}>Top 3 Breakdown</div>
                        
                        {/* Results */}
                        {typeResults.map((result, index) => (
                          <React.Fragment key={result.name}>
                            <div className="d-flex align-center" style={{ padding: 'var(--space-3)' }}>
                              <span className={`btn btn-sm ${index < 3 ? 'btn-warning' : 'btn-outline'}`} style={{ pointerEvents: 'none' }}>
                                #{index + 1}
                              </span>
                            </div>
                            <div className="d-flex align-center font-medium" style={{ padding: 'var(--space-3)' }}>{result.name}</div>
                            <div className="d-flex align-center font-bold text-primary" style={{ padding: 'var(--space-3)' }}>{result.score}</div>
                            <div className="d-flex align-center" style={{ padding: 'var(--space-3)' }}>{result.total_votes}</div>
                            <div className="d-flex align-center text-sm text-secondary" style={{ padding: 'var(--space-3)' }}>
                              1st: {result.votes_by_rank[1] || 0}, 2nd: {result.votes_by_rank[2] || 0}, 3rd: {result.votes_by_rank[3] || 0}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="text-sm text-secondary">
                Scoring: 1st choice = highest points, decreasing by 1 point per rank (dynamic based on category size)
              </div>
            </div>
          )}

          {activityTypes.map(type => {
            const typeRankings = rankings[type] || [];
            
            const getTypeEmoji = (type) => {
              switch(type) {
                case 'restaurant': return '🍽️';
                case 'activity': return '🎯';
                case 'bar': return '🍻';
                default: return '📋';
              }
            };
            
            return (
              <div key={type} className="card mb-4">
                <div className="card-header">
                  <h2 className="card-title text-lg">
                    {getTypeEmoji(type)} {type.charAt(0).toUpperCase() + type.slice(1)}s - {isMobile ? 'Tap to Reorder' : 'Drag to Reorder'}
                  </h2>
                </div>
                
                <div className="d-flex gap-2" style={{ flexDirection: 'column' }}>
                  {typeRankings.map((activity, index) => (
                    <div
                      key={`${activity.name}-${index}`}
                      className={`card d-flex justify-between align-center ${
                        selectedItem && selectedItem.type === type && selectedItem.index === index 
                          ? 'text-warning' 
                          : ''
                      }`}
                      style={{ 
                        cursor: isMobile ? 'pointer' : 'grab',
                        userSelect: 'none',
                        backgroundColor: selectedItem && selectedItem.type === type && selectedItem.index === index 
                          ? 'var(--color-warning-light)' 
                          : 'var(--bg-primary)',
                        border: selectedItem && selectedItem.type === type && selectedItem.index === index 
                          ? '2px solid var(--color-warning)' 
                          : '1px solid var(--border-color)',
                        transition: 'all var(--transition-fast)',
                        padding: 'var(--space-4)'
                      }}
                      draggable={!isMobile}
                      onDragStart={(e) => handleDragStart(e, type, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, type, index)}
                      onClick={() => handleItemTap(type, index)}
                    >
                      <div className="d-flex align-center gap-3">
                        <span className="btn btn-sm btn-secondary" style={{ pointerEvents: 'none', minWidth: '35px' }}>
                          {index + 1}
                        </span>
                        <span className="font-medium">{activity.name}</span>
                      </div>
                      
                      <div className="d-flex align-center gap-2">
                        {selectedItem && selectedItem.type === type && selectedItem.index === index && (
                          <span className="btn btn-sm btn-warning" style={{ pointerEvents: 'none' }}>Selected</span>
                        )}
                        <span className="text-secondary">
                          {isMobile ? '📱' : '⋮⋮'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Instructions */}
          <div className="card" style={{ backgroundColor: 'var(--color-primary-light)' }}>
            <div className="card-header">
              <h3 className="card-title text-base">How to use:</h3>
            </div>
            <ul className="text-sm">
              {isMobile ? (
                <>
                  <li>Tap an activity to select it (it will highlight yellow)</li>
                  <li>Tap another activity to swap their positions</li>
                  <li>The numbers show the current ranking order</li>
                </>
              ) : (
                <>
                  <li>Drag and drop activities to reorder them</li>
                  <li>The numbers show the current ranking order</li>
                  <li>Your 1st choice is at the top, last choice at the bottom</li>
                </>
              )}
              <li>Click "Save Rankings" when you're satisfied with your order</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
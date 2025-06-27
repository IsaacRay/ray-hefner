'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import 'bootstrap/dist/css/bootstrap.min.css';
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
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <h2 className="card-title">Madison Trip Voting</h2>
                <p className="card-text">Please authenticate to vote on trip activities.</p>
                <a href="/magic-link?redirect=madison" className="btn btn-primary">
                  Get Magic Link
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activityTypes = Object.keys(rankings);

  return (
    <div className="container mt-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3 mb-md-0">
          <h1>Madison Trip - Ranked Choice Voting</h1>
          <p className="text-muted">
            Welcome, {session.user.email}! 
            {isMobile ? ' Tap an item to select it, then tap another to swap positions.' : ' Drag items to reorder your preferences.'}
          </p>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2">
          <button 
            className="btn btn-info" 
            onClick={handleShowResults}
          >
            {showResults ? 'Hide Results' : 'Show Results'}
          </button>
          <button 
            className="btn btn-success" 
            onClick={saveVotes}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Rankings'}
          </button>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.message}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setAlert(null)}
          ></button>
        </div>
      )}

      {showResults && (
        <div className="mb-4">
          <h4 className="mb-3">Current Results (Ranked Choice)</h4>
          {Object.keys(rankings).map(type => {
            const typeResults = results.filter(result => result.type === type);
            if (typeResults.length === 0) return null;
            
            return (
              <div key={type} className="card mb-3">
                <div className="card-header">
                  <h5 className="mb-0 text-capitalize">
                    <span className={`badge me-2 ${type === 'restaurant' ? 'bg-primary' : type === 'activity' ? 'bg-success' : 'bg-info'}`}>
                      {type}s
                    </span>
                    Results
                  </h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Name</th>
                          <th>Score</th>
                          <th>Total Votes</th>
                          <th className="d-none d-md-table-cell">Top 3 Breakdown</th>
                        </tr>
                      </thead>
                      <tbody>
                        {typeResults.map((result, index) => (
                          <tr key={result.name}>
                            <td>
                              <span className={`badge ${index < 3 ? 'bg-warning' : 'bg-secondary'}`}>
                                #{index + 1}
                              </span>
                            </td>
                            <td><strong>{result.name}</strong></td>
                            <td><strong>{result.score}</strong></td>
                            <td>{result.total_votes}</td>
                            <td className="d-none d-md-table-cell">
                              <small>
                                1st: {result.votes_by_rank[1] || 0}, 
                                2nd: {result.votes_by_rank[2] || 0}, 
                                3rd: {result.votes_by_rank[3] || 0}
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
          <small className="text-muted">
            Scoring: 1st choice = highest points, decreasing by 1 point per rank (dynamic based on category size)
          </small>
        </div>
      )}

      {activityTypes.map(type => {
        const typeRankings = rankings[type] || [];
        
        return (
          <div key={type} className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0 text-capitalize">{type}s - Drag to Reorder</h5>
            </div>
            <div className="card-body">
              <div className="list-group">
                {typeRankings.map((activity, index) => (
                  <div
                    key={`${activity.name}-${index}`}
                    className={`list-group-item d-flex justify-content-between align-items-center ${
                      selectedItem && selectedItem.type === type && selectedItem.index === index 
                        ? 'list-group-item-warning' 
                        : ''
                    }`}
                    style={{ 
                      cursor: isMobile ? 'pointer' : 'grab',
                      userSelect: 'none'
                    }}
                    draggable={!isMobile}
                    onDragStart={(e) => handleDragStart(e, type, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, type, index)}
                    onClick={() => handleItemTap(type, index)}
                  >
                    <div className="d-flex align-items-center">
                      <span className="badge bg-secondary me-3">{index + 1}</span>
                      <span>{activity.name}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      {selectedItem && selectedItem.type === type && selectedItem.index === index && (
                        <span className="badge bg-warning me-2">Selected</span>
                      )}
                      <span className="text-muted">
                        {isMobile ? '📱' : '⋮⋮'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      <div className="alert alert-info">
        <h6>How to use:</h6>
        <ul className="mb-0">
          {isMobile ? (
            <>
              <li>Tap an activity to select it (it will turn yellow)</li>
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
  );
}
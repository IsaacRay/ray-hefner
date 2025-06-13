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
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

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

  const loadUserVotes = async (email) => {
    try {
      const response = await fetch(`/api/madison-votes?email=${email}`);
      if (response.ok) {
        const votes = await response.json();
        const userRankings = {};
        
        // Group votes by type and organize by rank
        votes.forEach(vote => {
          if (!userRankings[vote.activity_type]) {
            userRankings[vote.activity_type] = {};
          }
          userRankings[vote.activity_type][vote.rank_position] = {
            activity_name: vote.activity_name,
            activity_type: vote.activity_type
          };
        });
        
        setRankings(userRankings);
      }
    } catch (error) {
      console.error('Error loading votes:', error);
    }
  };

  const loadResults = async () => {
    try {
      const response = await fetch('/api/madison-votes?summary=true');
      if (response.ok) {
        const data = await response.json();
        setResults(data.sort((a, b) => b.score - a.score));
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

  const getRankingForType = (type) => {
    return rankings[type] || {};
  };

  const getAvailableActivities = (type) => {
    const typeRankings = getRankingForType(type);
    const rankedActivityNames = Object.values(typeRankings).map(item => item.activity_name);
    return activities
      .filter(activity => activity.type === type)
      .filter(activity => !rankedActivityNames.includes(activity.name));
  };

  const handleDragStart = (e, activity, source) => {
    setDraggedItem({ activity, source });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetType, targetRank) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    const { activity, source } = draggedItem;
    
    // Can only drop activities of the same type
    if (activity.type !== targetType) {
      setDraggedItem(null);
      return;
    }

    const newRankings = { ...rankings };
    
    // Initialize type if it doesn't exist
    if (!newRankings[targetType]) {
      newRankings[targetType] = {};
    }

    // If dropping on a ranked position, swap items
    if (targetRank && newRankings[targetType][targetRank]) {
      const existingItem = newRankings[targetType][targetRank];
      
      if (source.type === 'ranked') {
        // Swap positions
        newRankings[targetType][source.rank] = existingItem;
        newRankings[targetType][targetRank] = activity;
      } else {
        // Move existing item to available, place new item in position
        delete newRankings[targetType][targetRank];
        newRankings[targetType][targetRank] = activity;
      }
    } else if (targetRank) {
      // Dropping on empty rank position
      if (source.type === 'ranked') {
        delete newRankings[targetType][source.rank];
      }
      newRankings[targetType][targetRank] = activity;
    } else {
      // Dropping back to available (remove from rankings)
      if (source.type === 'ranked') {
        delete newRankings[targetType][source.rank];
      }
    }

    setRankings(newRankings);
    setDraggedItem(null);
  };

  const saveVotes = async () => {
    if (!session) return;
    
    setSaving(true);
    try {
      // Convert rankings to votes array
      const votes = [];
      Object.entries(rankings).forEach(([type, typeRankings]) => {
        Object.entries(typeRankings).forEach(([rank, activity]) => {
          votes.push({
            activity_name: activity.activity_name,
            activity_type: activity.activity_type,
            rank_position: parseInt(rank)
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

  const groupedActivities = activities.reduce((groups, activity) => {
    if (!groups[activity.type]) {
      groups[activity.type] = [];
    }
    groups[activity.type].push(activity);
    return groups;
  }, {});

  const activityTypes = Object.keys(groupedActivities);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Madison Trip - Ranked Choice Voting</h1>
          <p className="text-muted">Welcome, {session.user.email}! Drag activities to rank your preferences (1st to 5th choice).</p>
        </div>
        <div>
          <button 
            className="btn btn-info me-2" 
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
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Current Results (Ranked Choice)</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Type</th>
                    <th>Score</th>
                    <th>1st</th>
                    <th>2nd</th>
                    <th>3rd</th>
                    <th>4th</th>
                    <th>5th</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={result.name}>
                      <td>
                        {index < 3 && <span className="badge bg-warning me-2">Top {index + 1}</span>}
                        {result.name}
                      </td>
                      <td>
                        <span className={`badge ${result.type === 'restaurant' ? 'bg-primary' : result.type === 'activity' ? 'bg-success' : 'bg-info'}`}>
                          {result.type}
                        </span>
                      </td>
                      <td><strong>{result.score}</strong></td>
                      <td>{result.votes_by_rank[1]}</td>
                      <td>{result.votes_by_rank[2]}</td>
                      <td>{result.votes_by_rank[3]}</td>
                      <td>{result.votes_by_rank[4]}</td>
                      <td>{result.votes_by_rank[5]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <small className="text-muted">
              Scoring: 1st choice = 5 points, 2nd = 4 points, 3rd = 3 points, 4th = 2 points, 5th = 1 point
            </small>
          </div>
        </div>
      )}

      {activityTypes.map(type => {
        const typeRankings = getRankingForType(type);
        const availableActivities = getAvailableActivities(type);
        
        return (
          <div key={type} className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0 text-capitalize">{type}s - Ranked Choice</h5>
            </div>
            <div className="card-body">
              <div className="row">
                {/* Ranking Slots */}
                <div className="col-md-8">
                  <h6>Your Rankings:</h6>
                  <div className="row">
                    {[1, 2, 3, 4, 5].map(rank => (
                      <div key={rank} className="col-md-12 mb-2">
                        <div 
                          className="border rounded p-3 min-height-60 d-flex align-items-center"
                          style={{ 
                            minHeight: '60px',
                            backgroundColor: typeRankings[rank] ? '#e8f5e8' : '#f8f9fa',
                            borderStyle: 'dashed',
                            borderColor: typeRankings[rank] ? '#28a745' : '#dee2e6'
                          }}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, type, rank)}
                        >
                          {typeRankings[rank] ? (
                            <div 
                              className="d-flex justify-content-between align-items-center w-100"
                              draggable
                              onDragStart={(e) => handleDragStart(e, typeRankings[rank], { type: 'ranked', rank })}
                              style={{ cursor: 'grab' }}
                            >
                              <span>
                                <strong>{rank}. {typeRankings[rank].activity_name}</strong>
                              </span>
                              <small className="text-muted">Drag to reorder</small>
                            </div>
                          ) : (
                            <span className="text-muted">
                              {rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`} Choice - Drop here
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available Activities */}
                <div className="col-md-4">
                  <h6>Available {type}s:</h6>
                  <div 
                    className="border rounded p-3"
                    style={{ minHeight: '300px', backgroundColor: '#f8f9fa' }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, type, null)}
                  >
                    {availableActivities.map(activity => (
                      <div 
                        key={activity.name}
                        className="card mb-2"
                        draggable
                        onDragStart={(e) => handleDragStart(e, activity, { type: 'available' })}
                        style={{ cursor: 'grab' }}
                      >
                        <div className="card-body py-2">
                          <small>{activity.name}</small>
                        </div>
                      </div>
                    ))}
                    {availableActivities.length === 0 && (
                      <p className="text-muted text-center mt-4">
                        All {type}s are ranked
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="alert alert-info">
        <h6>How to use:</h6>
        <ul className="mb-0">
          <li>Drag activities from the "Available" section to your ranking slots</li>
          <li>Drag between ranking slots to reorder</li>
          <li>Drag back to "Available" to remove from rankings</li>
          <li>You can rank up to 5 activities per category</li>
          <li>Click "Save Rankings" when you're satisfied with your choices</li>
        </ul>
      </div>
    </div>
  );
}
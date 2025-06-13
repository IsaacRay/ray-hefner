'use client';

import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import activities from './activities.json';

export default function MadisonVoting() {
  const [user, setUser] = useState(null);
  const [selectedVotes, setSelectedVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/check-authenticated');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        await loadUserVotes(userData.email);
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
        setSelectedVotes(votes.map(vote => ({
          activity_name: vote.activity_name,
          activity_type: vote.activity_type
        })));
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
        setResults(data.sort((a, b) => b.votes - a.votes));
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

  const isVoted = (activity) => {
    return selectedVotes.some(vote => vote.activity_name === activity.name);
  };

  const getVoteCount = (type) => {
    return selectedVotes.filter(vote => vote.activity_type === type).length;
  };

  const toggleVote = (activity) => {
    const isCurrentlyVoted = isVoted(activity);
    const currentTypeCount = getVoteCount(activity.type);

    if (isCurrentlyVoted) {
      // Remove vote
      setSelectedVotes(prev => 
        prev.filter(vote => vote.activity_name !== activity.name)
      );
    } else {
      // Add vote if under limit
      if (currentTypeCount < 5) {
        setSelectedVotes(prev => [...prev, {
          activity_name: activity.name,
          activity_type: activity.type
        }]);
      } else {
        showAlert(`You can only vote for 5 ${activity.type}s`, 'warning');
      }
    }
  };

  const saveVotes = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/madison-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          votes: selectedVotes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save votes');
      }

      showAlert('Votes saved successfully!');
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

  if (!user) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <h2 className="card-title">Madison Trip Voting</h2>
                <p className="card-text">Please authenticate to vote on trip activities.</p>
                <a href="/magic-link" className="btn btn-primary">
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
          <h1>Madison Trip Voting</h1>
          <p className="text-muted">Welcome, {user.email}! Vote for up to 5 of each activity type.</p>
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
            {saving ? 'Saving...' : 'Save Votes'}
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
            <h5 className="mb-0">Current Results</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Type</th>
                    <th>Votes</th>
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
                        <span className={`badge ${result.type === 'restaurant' ? 'bg-primary' : 'bg-success'}`}>
                          {result.type}
                        </span>
                      </td>
                      <td>
                        <strong>{result.votes}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activityTypes.map(type => (
        <div key={type} className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-capitalize">{type}s</h5>
              <span className="badge bg-secondary">
                {getVoteCount(type)} / 5 selected
              </span>
            </div>
          </div>
          <div className="card-body">
            <div className="row">
              {groupedActivities[type].map(activity => (
                <div key={activity.name} className="col-md-6 col-lg-4 mb-3">
                  <div 
                    className={`card h-100 ${isVoted(activity) ? 'border-success bg-light' : ''} ${getVoteCount(type) >= 5 && !isVoted(activity) ? 'opacity-50' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleVote(activity)}
                  >
                    <div className="card-body text-center">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="card-title flex-grow-1">{activity.name}</h6>
                        {isVoted(activity) && (
                          <span className="badge bg-success">✓</span>
                        )}
                      </div>
                      <p className="card-text text-muted small">
                        Click to {isVoted(activity) ? 'remove' : 'add'} vote
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div className="card mt-4">
        <div className="card-body">
          <h6>Your Current Votes:</h6>
          {selectedVotes.length === 0 ? (
            <p className="text-muted">No votes selected yet.</p>
          ) : (
            <div>
              {activityTypes.map(type => {
                const typeVotes = selectedVotes.filter(vote => vote.activity_type === type);
                if (typeVotes.length === 0) return null;
                
                return (
                  <div key={type} className="mb-2">
                    <strong className="text-capitalize">{type}s ({typeVotes.length}/5):</strong>
                    <ul className="mb-0">
                      {typeVotes.map(vote => (
                        <li key={vote.activity_name}>{vote.activity_name}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
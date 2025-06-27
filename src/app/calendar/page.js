'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Calendar() {
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastDataChange, setLastDataChange] = useState(null);
  const [isPolling, setIsPolling] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(() => {
      fetchCalendarData(true); // silent refresh
    }, 10000);

    return () => clearInterval(interval);
  }, [isPolling]);

  const fetchCalendarData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await fetch('/api/calendar-data');
      if (!response.ok) throw new Error('Failed to fetch calendar data');
      const data = await response.json();
      
      // Compare with existing data to see if there are changes
      const hasChanges = !calendarData || !deepEqual(calendarData, data);
      
      if (hasChanges) {
        setCalendarData(data);
        const now = new Date();
        setLastUpdated(now);
        setLastDataChange(now);
        if (error) setError(null); // Clear any previous errors
      }
      
      // For silent refreshes, still update timestamp even if no data changes
      // so users know the system is checking for updates
      if (silent && !hasChanges) {
        setLastUpdated(new Date());
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Deep equality check for objects
  const deepEqual = (obj1, obj2) => {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return false;
    
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return obj1 === obj2;
    }
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (let key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  };

  const handleRefresh = () => {
    fetchCalendarData();
  };

  const togglePolling = () => {
    setIsPolling(!isPolling);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    // Pause polling when in edit mode to avoid conflicts
    if (!isEditMode) {
      setIsPolling(false);
    }
  };

  const handleBehaviorToggle = async (child, behaviorId, behaviorName, date, currentState) => {
    if (!isEditMode) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/behavior-completion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child,
          behavior_id: behaviorId,
          behavior_name: behaviorName,
          date,
          completed: !currentState
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update behavior');
      }

      // Refresh the calendar data to show the changes
      await fetchCalendarData(true);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filter calendar data to only show last 7 days for editing
  const getEditableCalendarData = () => {
    if (!calendarData) return null;
    
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    return {
      ...calendarData,
      weekDays: calendarData.weekDays.filter(dateString => {
        const date = new Date(dateString + 'T12:00:00');
        return date >= sevenDaysAgo && date <= today;
      }),
      calendarData: calendarData.calendarData.map(childData => ({
        ...childData,
        weekData: childData.weekData.filter(dayData => {
          const date = new Date(dayData.date + 'T12:00:00');
          return date >= sevenDaysAgo && date <= today;
        })
      }))
    };
  };

  const getDayName = (dateString) => {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDateDisplay = (dateString) => {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card mt-8">
          <div className="text-center">
            <div style={{ padding: '2rem' }}>Loading calendar...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card mt-8">
          <div className="text-center text-error">
            <div style={{ padding: '2rem' }}>Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!calendarData) {
    return (
      <div className="container">
        <div className="card mt-8">
          <div className="text-center text-secondary">
            <div style={{ padding: '2rem' }}>No data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <main className="mt-8">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">Weekly Star Calendar</h1>
            <p className="card-subtitle">Track behavior progress and achievements</p>
          </div>
          
          <div className="mb-6">
            <Link href="/home" className="btn btn-outline btn-sm mr-3">
              ← Back to Home
            </Link>
            <Link href="/behavior" className="btn btn-outline btn-sm">
              📝 Daily Behaviors
            </Link>
          </div>

          {/* Controls */}
          <div className="card mb-6">
            <div className="d-flex justify-between align-center mb-4">
              <div className="d-flex gap-2">
                <button 
                  onClick={handleRefresh} 
                  className="btn btn-secondary btn-sm"
                  disabled={loading}
                >
                  {loading ? '🔄' : '↻'} Refresh
                </button>
                
                <button 
                  onClick={togglePolling} 
                  className={`btn btn-sm ${isPolling ? 'btn-success' : 'btn-outline'}`}
                  disabled={isEditMode}
                >
                  {isPolling ? '⏸️ Pause Auto-Refresh' : '▶️ Enable Auto-Refresh'}
                </button>
                
                <button 
                  onClick={toggleEditMode} 
                  className={`btn btn-sm ${isEditMode ? 'btn-warning' : 'btn-outline'}`}
                >
                  {isEditMode ? '👁️ View Mode' : '✏️ Edit Mode'}
                </button>
              </div>

              {lastUpdated && (
                <div className="text-sm text-secondary">
                  <div>Last checked: {lastUpdated.toLocaleTimeString()}</div>
                  {lastDataChange && (
                    <div>Data updated: {lastDataChange.toLocaleTimeString()}</div>
                  )}
                </div>
              )}
            </div>
            
            {isEditMode && (
              <div className="card" style={{ backgroundColor: 'var(--color-warning-light)', padding: 'var(--space-4)' }}>
                <div className="font-medium text-warning">
                  Edit Mode: Click on behaviors to toggle them. Only showing last 7 days.
                  {saving && <span className="ml-3 text-primary">Saving...</span>}
                </div>
              </div>
            )}
          </div>

          {/* Calendar Grid */}
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '150px repeat(7, 1fr)', 
                gap: 'var(--space-2)',
                minWidth: '800px'
              }}>
                {/* Header */}
                <div className="font-semibold text-center" style={{ 
                  padding: 'var(--space-3)', 
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--border-radius)'
                }}>
                  Child
                </div>
                {(isEditMode ? getEditableCalendarData()?.weekDays : calendarData.weekDays)?.map(date => (
                  <div key={date} className="text-center font-medium" style={{ 
                    padding: 'var(--space-3)', 
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--border-radius)'
                  }}>
                    <div className="text-sm">{getDayName(date)}</div>
                    <div className="text-xs text-secondary">{getDateDisplay(date)}</div>
                  </div>
                ))}

                {/* Calendar rows for each child */}
                {(isEditMode ? getEditableCalendarData()?.calendarData : calendarData.calendarData)?.map(childData => (
                  <React.Fragment key={childData.child}>
                    <div className="font-medium text-center d-flex align-center justify-center" style={{ 
                      padding: 'var(--space-4)', 
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--border-radius)'
                    }}>
                      {childData.child}
                    </div>
                    
                    {childData.weekData.map(dayData => (
                      <div key={dayData.date} className="card" style={{ padding: 'var(--space-3)', minHeight: '120px' }}>
                        {/* Star display */}
                        {dayData.total > 0 && (
                          <div className="text-center mb-2">
                            <span style={{ fontSize: 'var(--font-size-lg)' }}>
                              {'⭐'.repeat(Math.min(dayData.total, 5))}
                              {dayData.total > 5 && (
                                <span className="text-sm text-success font-medium">
                                  +{dayData.total - 5}
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        
                        {/* Behaviors list */}
                        <div className="d-flex gap-1" style={{ flexDirection: 'column' }}>
                          {dayData.behaviors.map(behavior => (
                            <div 
                              key={behavior.id} 
                              className={`text-xs ${behavior.starred ? 'text-success font-medium' : 'text-secondary'}`}
                              onClick={() => isEditMode && handleBehaviorToggle(
                                childData.child, 
                                behavior.id, 
                                behavior.name, 
                                dayData.date, 
                                behavior.starred
                              )}
                              style={{ 
                                cursor: isEditMode ? 'pointer' : 'default',
                                padding: 'var(--space-1)',
                                borderRadius: 'var(--border-radius-sm)',
                                backgroundColor: behavior.starred ? 'var(--color-success-light)' : 'transparent',
                                border: isEditMode ? '1px solid var(--border-color)' : 'none',
                                transition: 'all var(--transition-fast)'
                              }}
                            >
                              {behavior.starred && <span>⭐ </span>}
                              {behavior.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
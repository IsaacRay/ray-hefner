"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BehaviorPage() {
  const [behaviors, setBehaviors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyTotals, setDailyTotals] = useState({});
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [selectedChild, setSelectedChild] = useState('');
  const [children] = useState(['Ella', 'Colton']);

  const today = new Date().toDateString();

  // Fetch behaviors and totals
  useEffect(() => {
    if (!selectedChild) return;

    async function fetchData() {
      try {
        // Fetch behaviors for selected child
        const behaviorsResponse = await fetch(`/api/behaviors?child=${selectedChild}`);
        if (!behaviorsResponse.ok) throw new Error('Failed to fetch behaviors');
        const behaviorsData = await behaviorsResponse.json();

        // Initialize behaviors with default checked state
        const initializedBehaviors = behaviorsData.map(behavior => ({
          ...behavior,
          checked: behavior.default_checked || false
        }));

        setBehaviors(initializedBehaviors);

        // Fetch weekly totals for selected child (Monday-based week)
        const totalsResponse = await fetch(`/api/totals?child=${selectedChild}`);
        if (totalsResponse.ok) {
          const totalsData = await totalsResponse.json();
          const totalsMap = {};
          let weekTotal = 0;

          // Get current Monday-based week
          const now = new Date();
          const dayOfWeek = now.getDay();
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, so offset -6, else 1 - dayOfWeek
          const thisMonday = new Date(now);
          thisMonday.setDate(now.getDate() + mondayOffset);
          thisMonday.setHours(0, 0, 0, 0);

          totalsData.forEach(total => {
            const date = new Date(total.date).toDateString();
            const totalDate = new Date(total.date);
            totalsMap[date] = total.total;
            
            // Only count totals from this Monday-based week
            if (totalDate >= thisMonday) {
              weekTotal += total.total;
            }
          });

          setDailyTotals(totalsMap);
          setWeeklyTotal(weekTotal);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedChild]);

  // Handle behavior check/uncheck
  const handleBehaviorChange = (behaviorId, isChecked) => {
    setBehaviors(prevBehaviors =>
      prevBehaviors.map(behavior =>
        behavior.id === behaviorId
          ? { ...behavior, checked: isChecked }
          : behavior
      )
    );
  };

  // Save daily total and individual behavior completions for today
  const saveDailyTotal = async () => {
    if (!selectedChild) return;

    const checkedCount = behaviors.filter(b => b.checked).length;
    const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Prepare individual behavior completions data
    const completions = behaviors.map(behavior => ({
      behavior_id: behavior.id,
      behavior_name: behavior.name,
      completed: behavior.checked
    }));
    
    try {
      // Save both totals and individual completions
      const [totalsResponse, completionsResponse] = await Promise.all([
        // Save daily total (existing functionality)
        fetch('/api/totals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            child: selectedChild,
            date: todayDate,
            total: checkedCount
          }),
        }),
        // Save individual behavior completions (new functionality)
        fetch('/api/behavior-completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            child: selectedChild,
            date: todayDate,
            completions: completions
          }),
        })
      ]);

      if (!totalsResponse.ok) throw new Error('Failed to save daily total');
      if (!completionsResponse.ok) throw new Error('Failed to save behavior completions');

      // Update local state for today
      const todayString = new Date().toDateString();
      setDailyTotals(prev => ({
        ...prev,
        [todayString]: checkedCount
      }));

      // Recalculate weekly total from Monday-based week
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const thisMonday = new Date(now);
      thisMonday.setDate(now.getDate() + mondayOffset);
      thisMonday.setHours(0, 0, 0, 0);

      const updatedTotals = { ...dailyTotals, [todayString]: checkedCount };
      const weekTotal = Object.entries(updatedTotals)
        .filter(([dateString]) => {
          const date = new Date(dateString);
          return date >= thisMonday;
        })
        .reduce((sum, [, total]) => sum + total, 0);

      setWeeklyTotal(weekTotal);

      alert('Today\'s behaviors and total saved!');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data: ' + error.message);
    }
  };

  // Reset behaviors to default state
  const resetBehaviors = () => {
    setBehaviors(prevBehaviors =>
      prevBehaviors.map(behavior => ({
        ...behavior,
        checked: behavior.default_checked || false
      }))
    );
  };

  // Get last 7 days for display (Monday-based)
  const getLast7Days = () => {
    const days = [];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, so offset -6, else 1 - dayOfWeek
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() + mondayOffset);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(thisMonday);
      date.setDate(thisMonday.getDate() + i);
      days.push(date);
    }
    return days;
  };

  if (loading && selectedChild) {
    return (
      <div className="container">
        <div className="card mt-8">
          <div className="text-center">
            <div style={{ padding: '2rem' }}>Loading behaviors...</div>
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
            <h1 className="card-title">Behavior Tracking</h1>
            <p className="card-subtitle">Track daily behaviors and weekly progress</p>
          </div>
          
          <div className="mb-6">
            <Link href="/home" className="btn btn-outline btn-sm mr-3">
              ← Back to Home
            </Link>
            <Link href="/calendar" className="btn btn-outline btn-sm mr-3">
              📅 Weekly Calendar
            </Link>
            <Link href="/manage-behaviors" className="btn btn-outline btn-sm">
              ⚙️ Manage Behaviors
            </Link>
          </div>

          <div className="form-group">
            <label className="form-label">Select Child:</label>
            <select 
              className="form-control" 
              value={selectedChild} 
              onChange={(e) => setSelectedChild(e.target.value)}
            >
              <option value="">Choose a child...</option>
              {children.map(child => (
                <option key={child} value={child}>{child}</option>
              ))}
            </select>
          </div>

          {selectedChild && (
            <div className="d-grid gap-6 mt-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
              {/* Today's Behaviors */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title text-lg">Today's Behaviors for {selectedChild}</h2>
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-secondary btn-sm" onClick={resetBehaviors}>
                      Reset Day
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={saveDailyTotal}>
                      Save Daily Total
                    </button>
                  </div>
                </div>

                {behaviors.length === 0 ? (
                  <div className="text-center" style={{ padding: '3rem' }}>
                    <p className="text-secondary">No behaviors configured.</p>
                  </div>
                ) : (
                  <div>
                    <div className="d-flex gap-3 mb-4" style={{ flexDirection: 'column' }}>
                      {behaviors.map((behavior) => (
                        <div key={behavior.id} className="card" style={{ padding: 'var(--space-4)' }}>
                          <div className="d-flex align-center gap-3">
                            <input
                              type="checkbox"
                              id={`behavior-${behavior.id}`}
                              checked={behavior.checked}
                              onChange={(e) => handleBehaviorChange(behavior.id, e.target.checked)}
                              style={{ transform: 'scale(1.3)' }}
                            />
                            <label htmlFor={`behavior-${behavior.id}`} style={{ cursor: 'pointer', flex: 1 }}>
                              <div className="font-medium text-primary">{behavior.name}</div>
                              {behavior.description && (
                                <div className="text-secondary text-sm mt-1">{behavior.description}</div>
                              )}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="card" style={{ backgroundColor: 'var(--bg-tertiary)', padding: 'var(--space-4)' }}>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {behaviors.filter(b => b.checked).length} / {behaviors.length}
                        </div>
                        <div className="text-secondary text-sm">Today's Progress</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Weekly Progress */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title text-lg">Weekly Progress</h2>
                </div>
                
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-primary">{weeklyTotal}</div>
                  <div className="text-secondary text-sm">Total Points This Week</div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Daily Breakdown</h3>
                  <div className="d-flex gap-2" style={{ flexDirection: 'column' }}>
                    {getLast7Days().map(date => {
                      const dateString = date.toDateString();
                      const isToday = dateString === today;
                      const total = dailyTotals[dateString] || 0;
                      
                      return (
                        <div 
                          key={dateString} 
                          className={`d-flex justify-between align-center ${isToday ? 'card' : ''}`}
                          style={{ 
                            padding: isToday ? 'var(--space-3)' : 'var(--space-2)',
                            backgroundColor: isToday ? 'var(--color-primary-light)' : 'transparent',
                            borderRadius: isToday ? 'var(--border-radius)' : '0'
                          }}
                        >
                          <span className="text-sm">
                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {isToday && <span className="text-primary font-medium ml-2">(Today)</span>}
                          </span>
                          <span className={`text-sm font-medium ${total > 0 ? 'text-success' : 'text-secondary'}`}>
                            {total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
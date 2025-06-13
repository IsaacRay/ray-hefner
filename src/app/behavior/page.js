"use client";
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

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
    return <div className="container mt-4">Loading behaviors...</div>;
  }

  return (
    <div className="container mt-4">
      {/* Child Selection */}
      <div className="row mb-4">
        <div className="col-12">
          <h1>Behavior Tracking</h1>
          <div className="mb-3">
            <label className="form-label">Select Child:</label>
            <select 
              className="form-select" 
              value={selectedChild} 
              onChange={(e) => setSelectedChild(e.target.value)}
            >
              <option value="">Choose a child...</option>
              {children.map(child => (
                <option key={child} value={child}>{child}</option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <a href="/calendar" className="btn btn-outline-primary me-2">
              📅 View Weekly Calendar
            </a>
            <a href="/manage-behaviors" className="btn btn-outline-secondary">
              ⚙️ Manage Behaviors
            </a>
          </div>
        </div>
      </div>

      {selectedChild && (
        <>
          <div className="row">
            <div className="col-md-8">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Today's Behaviors for {selectedChild}</h3>
                <div>
                  <button className="btn btn-secondary me-2" onClick={resetBehaviors}>
                    Reset Day
                  </button>
                  <button className="btn btn-primary" onClick={saveDailyTotal}>
                    Save Daily Total
                  </button>
                </div>
              </div>

              {behaviors.length === 0 ? (
                <p>No behaviors configured.</p>
              ) : (
                <div className="card">
                  <div className="card-body">
                    {behaviors.map((behavior) => (
                      <div key={behavior.id} className="form-check mb-3 p-3 border rounded">
                        <input
                          className="form-check-input me-3"
                          type="checkbox"
                          id={`behavior-${behavior.id}`}
                          checked={behavior.checked}
                          onChange={(e) => handleBehaviorChange(behavior.id, e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor={`behavior-${behavior.id}`}>
                          <strong>{behavior.name}</strong>
                          {behavior.description && (
                            <div className="text-muted small mt-1">{behavior.description}</div>
                          )}
                        </label>
                      </div>
                    ))}
                    
                    <div className="mt-4 p-3 bg-light rounded">
                      <h5>Today's Count: {behaviors.filter(b => b.checked).length} / {behaviors.length}</h5>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Weekly Progress</h5>
                </div>
                <div className="card-body">
                  <div className="text-center mb-4">
                    <h2 className="text-primary">{weeklyTotal}</h2>
                    <p className="text-muted">Total Points This Week</p>
                  </div>

                  <h6>Daily Breakdown</h6>
                  <div className="list-group list-group-flush">
                    {getLast7Days().map(date => {
                      const dateString = date.toDateString();
                      const isToday = dateString === today;
                      const total = dailyTotals[dateString] || 0;
                      
                      return (
                        <div key={dateString} className={`list-group-item d-flex justify-content-between ${isToday ? 'bg-light' : ''}`}>
                          <span>
                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {isToday && <small className="text-primary ms-2">(Today)</small>}
                          </span>
                          <span className="badge bg-secondary">{total}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import styles from './calendar.module.css';

export default function Calendar() {
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastDataChange, setLastDataChange] = useState(null);
  const [isPolling, setIsPolling] = useState(true);

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

  const getDayName = (dateString) => {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDateDisplay = (dateString) => {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) return <div className={styles.loading}>Loading calendar...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!calendarData) return <div className={styles.error}>No data available</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Weekly Star Calendar</h1>
        
        <div className={styles.controls}>
          <button 
            onClick={handleRefresh} 
            className={`${styles.button} ${styles.refreshButton}`}
            disabled={loading}
          >
            {loading ? '🔄' : '↻'} Refresh
          </button>
          
          <button 
            onClick={togglePolling} 
            className={`${styles.button} ${isPolling ? styles.pollingOn : styles.pollingOff}`}
          >
            {isPolling ? '⏸️ Pause Auto-Refresh' : '▶️ Enable Auto-Refresh'}
          </button>
          
          {lastUpdated && (
            <div className={styles.statusInfo}>
              <span className={styles.lastUpdated}>
                Last checked: {lastUpdated.toLocaleTimeString()}
              </span>
              {lastDataChange && (
                <span className={styles.lastDataChange}>
                  Data updated: {lastDataChange.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.calendar}>
        {/* Header with days */}
        <div className={styles.header}>
          <div className={styles.childColumn}>Child</div>
          {calendarData.weekDays.map(date => (
            <div key={date} className={styles.dayColumn}>
              <div className={styles.dayName}>{getDayName(date)}</div>
              <div className={styles.dayDate}>{getDateDisplay(date)}</div>
            </div>
          ))}
        </div>

        {/* Calendar rows for each child */}
        {calendarData.calendarData.map(childData => (
          <div key={childData.child} className={styles.childRow}>
            <div className={styles.childName}>{childData.child}</div>
            
            {childData.weekData.map(dayData => (
              <div key={dayData.date} className={styles.dayCell}>
                <div className={styles.starCount}>
                  {dayData.total > 0 && (
                    <span className={styles.stars}>
                      {'⭐'.repeat(Math.min(dayData.total, 5))}
                      {dayData.total > 5 && ` +${dayData.total - 5}`}
                    </span>
                  )}
                </div>
                
                <div className={styles.behaviors}>
                  {dayData.behaviors.map(behavior => (
                    <div 
                      key={behavior.id} 
                      className={`${styles.behavior} ${behavior.starred ? styles.starred : ''}`}
                    >
                      {behavior.starred && <span className={styles.star}>⭐</span>}
                      {behavior.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
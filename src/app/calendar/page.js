'use client';

import { useState, useEffect } from 'react';
import styles from './calendar.module.css';

export default function Calendar() {
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      const response = await fetch('/api/calendar-data');
      if (!response.ok) throw new Error('Failed to fetch calendar data');
      const data = await response.json();
      setCalendarData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDateDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) return <div className={styles.loading}>Loading calendar...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!calendarData) return <div className={styles.error}>No data available</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Weekly Star Calendar</h1>
      
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
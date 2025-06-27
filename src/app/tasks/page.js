
"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Failed to fetch tasks');
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error(error);
        setError('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  const handleComplete = async (taskId, isChecked) => {
    try {
      const timestamp = new Date().toISOString();
      const response = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: taskId, completed: isChecked, timestamp }),
      });

      if (!response.ok) throw new Error('Failed to update task status');

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, completed: isChecked } : task
        )
      );
    } catch (error) {
      console.error(error);
      setError('Failed to update task');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card mt-8">
          <div className="text-center">
            <div style={{ padding: '2rem' }}>Loading tasks...</div>
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
            <div style={{ padding: '2rem' }}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <div className="container">
      <main className="mt-8">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">Task Management</h1>
            <p className="card-subtitle">
              {pendingTasks.length} pending • {completedTasks.length} completed
            </p>
          </div>
          
          <div className="mb-4">
            <Link href="/home" className="btn btn-outline btn-sm">
              ← Back to Home
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center" style={{ padding: '3rem' }}>
              <p className="text-secondary">No tasks available.</p>
            </div>
          ) : (
            <div className="d-grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {/* Pending Tasks */}
              <div className="card">
                <h2 className="card-title text-lg mb-4">
                  Pending Tasks ({pendingTasks.length})
                </h2>
                {pendingTasks.length === 0 ? (
                  <p className="text-secondary text-center" style={{ padding: '2rem' }}>
                    🎉 All tasks completed!
                  </p>
                ) : (
                  <div className="d-flex gap-3" style={{ flexDirection: 'column' }}>
                    {pendingTasks.map((task) => (
                      <div key={task.id} className="card" style={{ padding: 'var(--space-4)' }}>
                        <div className="d-flex align-center gap-3">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={(e) => handleComplete(task.id, e.target.checked)}
                            style={{ transform: 'scale(1.2)' }}
                          />
                          <span className="text-primary">{task.task}</span>
                          <span className="text-secondary text-sm ml-auto">#{task.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completed Tasks */}
              <div className="card">
                <h2 className="card-title text-lg mb-4">
                  Completed Tasks ({completedTasks.length})
                </h2>
                {completedTasks.length === 0 ? (
                  <p className="text-secondary text-center" style={{ padding: '2rem' }}>
                    No completed tasks yet.
                  </p>
                ) : (
                  <div className="d-flex gap-3" style={{ flexDirection: 'column' }}>
                    {completedTasks.map((task) => (
                      <div key={task.id} className="card" style={{ padding: 'var(--space-4)', opacity: '0.7' }}>
                        <div className="d-flex align-center gap-3">
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={(e) => handleComplete(task.id, e.target.checked)}
                            style={{ transform: 'scale(1.2)' }}
                          />
                          <span className="text-success" style={{ textDecoration: 'line-through' }}>
                            {task.task}
                          </span>
                          <span className="text-secondary text-sm ml-auto">#{task.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
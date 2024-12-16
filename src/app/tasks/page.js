// pages/index.js

"use client";
// pages/index.js
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch tasks from the API
  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Failed to fetch tasks');
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  // Handle task completion/uncompletion
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

      // Update the task list
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, completed: isChecked } : task
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div>Loading tasks...</div>;
  }

  return (
    <div className="container mt-4">
      <h1>Task List</h1>
      {tasks.length === 0 ? (
        <p>No tasks available.</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Task</th>
              <th>Created At</th>
              <th>Completed</th>
              <th>Recurrence</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.task}</td>
                <td>{new Date(task.created_at).toLocaleString()}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => handleComplete(task.id, e.target.checked)}
                  />
                </td>
                <td>
                  {task.recurrence.recurs
                    ? `Daily: ${task.recurrence.daily}`
                    : 'No'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
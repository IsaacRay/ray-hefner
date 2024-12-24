import { createClient } from '@supabase/supabase-js';
// Load environment variables from .env file in local development
export const dynamic = 'force-dynamic'
require('dotenv').config();


const supabaseKey = process.env.SUPABASE_KEY
// Initialize Supabase client
const supabase = createClient(
  "https://lzxiyzhookfqphsmrwup.supabase.co",
  supabaseKey,
  {
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, { ...options, cache: 'no-store' });
      }
    }
  }
);

export async function GET(req) {
  try {
    // Get the current date
    const today = new Date();
    const currentDay = today.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
    const currentDate = today.getDate(); // Day of the month
    const currentMonth = today.getMonth() + 1; // Month (1-based)
    const currentYear = today.getFullYear();

    // Fetch all tasks
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*');
  

    if (fetchError) throw fetchError;

    const updates = tasks.map((task) => {
      const recurrence = task.recurrence ? task.recurrence : {};
      let shouldBeVisible = false;

      // Determine if the task should be visible based on its recurrence
      if (recurrence.type === 'daily') {
        shouldBeVisible = true; // Daily tasks are always visible
      if (recurrence.type === 'weekday') {
        // Weekend logic
        const isWeekend = currentDay === 0 || currentDay === 6; // Sunday or Saturday
        shouldBeVisible = !isWeekend;
      }
      } else if (recurrence.type === 'weekly') {
        // Weekly logic with optional day_of_week
        const intervalDays = 7 * (recurrence.interval || 1); // Default to 1 week if interval is missing
      
        if (task.last_completed) {
          const lastCompletedDate = new Date(task.last_completed);
          const nextValidDate = new Date(lastCompletedDate);
          nextValidDate.setDate(nextValidDate.getDate() + intervalDays);
      
          if (today >= nextValidDate) {
            shouldBeVisible = true;
          }
        } else {
          // No last_completed: visible starting today
          shouldBeVisible = true;
        }
      
        // If day_of_week exists, ensure it matches
        if (recurrence.days_of_week) {
          shouldBeVisible = shouldBeVisible && recurrence.days_of_week.includes(getDayName(currentDay));
        }
      } else if (recurrence.type === 'monthly') {
        // Monthly logic with optional day_of_month
        const intervalMonths = recurrence.interval || 1; // Default to 1 month if interval is missing
      
        if (task.last_completed) {
          const lastCompletedDate = new Date(task.last_completed);
          const nextValidDate = new Date(
            lastCompletedDate.getFullYear(),
            lastCompletedDate.getMonth() + intervalMonths,
            lastCompletedDate.getDate()
          );
      
          if (today >= nextValidDate) {
            shouldBeVisible = true;
          }
        } else {
          // No last_completed: visible starting today
          shouldBeVisible = true;
        }
      
        // If day_of_month exists, ensure it matches
        if (recurrence.day_of_month) {
          shouldBeVisible = shouldBeVisible && currentDate === recurrence.day_of_month;
        }
      } 
      

      // Preserve visibility for incomplete tasks
      if (task.visible && !task.completed) {
        shouldBeVisible = true;
      }

      // Reset "completed" for tasks meant to be visible today
      const completed = shouldBeVisible ? false : task.completed;

      return {
        id: task.id,
        visible: shouldBeVisible,
        completed,
      };
    });

    // Update tasks in the database
    const { data: updatedTasks, error: updateError } = await supabase
      .from('tasks')
      .upsert(updates, { onConflict: 'id' });

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ message: 'Tasks updated successfully', data: updatedTasks }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ "This error": error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Utility function to get the day name from a day index
function getDayName(dayIndex) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
}

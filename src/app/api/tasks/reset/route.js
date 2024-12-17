import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file in local development

require('dotenv').config();


const supabaseKey = process.env.SUPABASE_KEY
// Initialize Supabase client
const supabase = createClient(
  "https://lzxiyzhookfqphsmrwup.supabase.co",
  supabaseKey
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
      } else if (recurrence.type === 'weekly' && recurrence.days_of_week) {
        shouldBeVisible = recurrence.days_of_week.includes(getDayName(currentDay));
      } else if (recurrence.type === 'monthly' && recurrence.day_of_month) {
        shouldBeVisible = recurrence.day_of_month === currentDate;
      } else if (recurrence.type === 'custom') {
        // Add custom rule logic here, if needed
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

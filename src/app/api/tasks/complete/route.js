import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file in local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const supabaseKey = process.env.NODE_ENV !== 'development' ? process.env.secrets.supabase_key || "string" : process.env.SUPABASE_KEY;
console.log(supabaseKey)

// Initialize Supabase client
const supabase = createClient(
  "https://lzxiyzhookfqphsmrwup.supabase.co",
  supabaseKey
);

// Handle POST requests
export async function POST(req) {
  try {
    const { id, completed, timestamp } = await req.json();

    if (
      typeof id !== 'number' || 
      typeof completed !== 'boolean' || 
      typeof timestamp !== 'string'
    ) {
      return new Response(
        JSON.stringify({
          error: 'Invalid input: id must be a number, completed must be a boolean, and timestamp must be a string.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updateFields = { completed };
    if (completed) {
      updateFields.last_completed = timestamp; // Add the timestamp only when completed is true
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateFields)
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: 'Task updated successfully', data }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


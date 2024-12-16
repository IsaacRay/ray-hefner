import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  "https://lzxiyzhookfqphsmrwup.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6eGl5emhvb2tmcXBoc21yd3VwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDE5MzM0MCwiZXhwIjoyMDQ5NzY5MzQwfQ.N15-srTpoJailPQvOBUGrbeshh39qhxlawrIB6St6j4" 
);

// Handle POST requests
export async function POST(req) {
  try {
    const { id, completed } = await req.json();

    if (typeof id !== 'number' || typeof completed !== 'boolean') {
      return new Response(
        JSON.stringify({
          error: 'Invalid input: id must be a number and completed must be a boolean.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ completed })
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

import { createClient } from '@supabase/supabase-js';
import { secret } from '@aws-amplify/backend';

// Load environment variables from .env file in local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const supabaseKey = process.env.NODE_ENV !== 'development' ? process.env.secrets.supabase_key: process.env.SUPABASE_KEY || "supabase_key";


// Initialize Supabase client
const supabase = createClient(
  "https://lzxiyzhookfqphsmrwup.supabase.co",
  supabaseKey
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

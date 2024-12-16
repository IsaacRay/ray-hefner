import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file in local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

throw new Error(JSON.stringify(process.env.secrets));
/*

const supabaseKey = process.env.NODE_ENV !== 'development' ? process.env.secrets.supabase_key: process.env.SUPABASE_KEY || "supabase_key";


// Initialize Supabase client
const supabase = createClient(
  "https://lzxiyzhookfqphsmrwup.supabase.co",
  supabaseKey
);
// Handle GET requests
export async function GET(req) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*');

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: JSON.stringify(process.env.secrets) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
*/

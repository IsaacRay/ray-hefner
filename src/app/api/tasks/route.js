import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file in local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const supabaseKey = process.env.NODE_ENV !== 'development' ? JSON.parse(process.env.secrets)['supabase_key'] : process.env.SUPABASE_KEY;
if (!supabaseKey) {
  throw new Error(JSON.parse(process.env.secrets)['sup']);
}

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
      .select('*')
      .eq('visible', true);

    if (error) throw error;
    console.log(data)
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message}), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

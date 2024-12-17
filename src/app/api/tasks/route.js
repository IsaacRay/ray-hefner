import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file in local development

require('dotenv').config();


const supabaseKey = process.env.SUPABASE_KEY

 
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
      .eq('visible', true)
      .neq("id", uuidv4());

    if (error) throw error;
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

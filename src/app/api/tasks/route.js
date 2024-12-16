import { createClient } from '@supabase/supabase-js';
import { defineFunction, secret } from '@aws-amplify/backend';

export const supabaseKeys = defineFunction({
  environment: {
    SUPABASE_KEY: secret('supabase_key') // this assumes you created a secret named "MY_API_KEY"
  }
});
// Load environment variables from .env file in local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const supabaseKey = process.env.NODE_ENV !== 'development' ? process.env.secrets.SUPABASE_KEY : process.env.SUPABASE_KEY;


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
    return new Response(JSON.stringify({ error: JSON.stringify(supabaseKey) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


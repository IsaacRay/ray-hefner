import { createClient } from '@supabase/supabase-js';
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

// Handle GET requests
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const child = searchParams.get('child');
    
    let query = supabase
      .from('behaviors')
      .select('*')
      .eq('visible', true);
    
    // Filter by child if specified
    if (child) {
      query = query.eq('child', child);
    }
    
    const { data, error } = await query.order('name');

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
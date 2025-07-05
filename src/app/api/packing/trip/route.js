import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic'
require('dotenv').config();

const supabaseKey = process.env.SUPABASE_KEY

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
    const { data, error } = await supabase
      .from('trip_templates')
      .select('*')
      .order('name', { ascending: true });

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

export async function POST(req) {
  try {
    const { name, items } = await req.json();
    
    const { data, error } = await supabase
      .from('trip_templates')
      .insert([{ name, items }])
      .select();

    if (error) throw error;
    return new Response(JSON.stringify(data[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message}), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
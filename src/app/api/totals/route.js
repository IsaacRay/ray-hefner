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

// Handle GET requests - fetch totals for a specific child for the last 7 days
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const child = searchParams.get('child');
    
    if (!child) {
      return new Response(JSON.stringify({ error: 'Child parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data, error } = await supabase
      .from('totals')
      .select('*')
      .eq('child', child)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

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

// Handle POST requests - save or update daily total
export async function POST(req) {
  try {
    const { child, date, total } = await req.json();
    
    if (!child || !date || total === undefined) {
      return new Response(JSON.stringify({ error: 'Child, date, and total are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert date to YYYY-MM-DD format
    const dateOnly = new Date(date).toISOString().split('T')[0];

    // Check if record already exists for this child and date
    const { data: existingData, error: selectError } = await supabase
      .from('totals')
      .select('id')
      .eq('child', child)
      .eq('date', dateOnly)
      .single();

    let result;
    if (existingData) {
      // Update existing record
      const { data, error } = await supabase
        .from('totals')
        .update({ total, updated_at: new Date().toISOString() })
        .eq('id', existingData.id)
        .select();
      
      if (error) throw error;
      result = data;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('totals')
        .insert([{ child, date: dateOnly, total }])
        .select();
      
      if (error) throw error;
      result = data;
    }

    return new Response(JSON.stringify(result[0]), {
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
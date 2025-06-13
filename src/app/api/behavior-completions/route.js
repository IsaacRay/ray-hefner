import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://lzxiyzhookfqphsmrwup.supabase.co"
const supabaseKey = process.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

// GET - Fetch behavior completions for a date range
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const child = searchParams.get('child');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase
      .from('behavior_completions')
      .select('*');

    if (child) {
      query = query.eq('child', child);
    }

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching behavior completions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST - Save behavior completions for a specific date
export async function POST(req) {
  try {
    const { child, date, completions } = await req.json();
    
    if (!child || !date || !Array.isArray(completions)) {
      return new Response(JSON.stringify({ 
        error: 'Child, date, and completions array are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const dateOnly = new Date(date).toISOString().split('T')[0];

    // Delete existing completions for this child and date
    const { error: deleteError } = await supabase
      .from('behavior_completions')
      .delete()
      .eq('child', child)
      .eq('date', dateOnly);

    if (deleteError) throw deleteError;

    // Insert new completions
    const records = completions.map(completion => ({
      child,
      behavior_id: completion.behavior_id,
      behavior_name: completion.behavior_name,
      date: dateOnly,
      completed: completion.completed,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('behavior_completions')
      .insert(records)
      .select();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error saving behavior completions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
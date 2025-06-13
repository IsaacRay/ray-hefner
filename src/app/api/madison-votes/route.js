import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://lzxiyzhookfqphsmrwup.supabase.co"
const supabaseKey = process.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

// GET - Fetch votes for a user or all votes
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const summary = searchParams.get('summary') === 'true';

    if (summary) {
      // Return vote counts by activity
      const { data, error } = await supabase
        .from('madison_votes')
        .select('activity_name, activity_type');

      if (error) throw error;

      const voteCounts = {};
      data.forEach(vote => {
        if (!voteCounts[vote.activity_name]) {
          voteCounts[vote.activity_name] = {
            name: vote.activity_name,
            type: vote.activity_type,
            votes: 0
          };
        }
        voteCounts[vote.activity_name].votes++;
      });

      return new Response(JSON.stringify(Object.values(voteCounts)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let query = supabase
      .from('madison_votes')
      .select('*');

    if (email) {
      query = query.eq('email', email);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching votes:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST - Submit votes
export async function POST(req) {
  try {
    const { email, votes } = await req.json();
    
    if (!email || !Array.isArray(votes)) {
      return new Response(JSON.stringify({ 
        error: 'Email and votes array are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete existing votes for this user
    const { error: deleteError } = await supabase
      .from('madison_votes')
      .delete()
      .eq('email', email);

    if (deleteError) throw deleteError;

    // Insert new votes
    const voteRecords = votes.map(vote => ({
      email,
      activity_name: vote.activity_name,
      activity_type: vote.activity_type
    }));

    const { data, error } = await supabase
      .from('madison_votes')
      .insert(voteRecords)
      .select();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error saving votes:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
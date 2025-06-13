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
      // Return ranked choice voting results by activity
      const { data, error } = await supabase
        .from('madison_votes')
        .select('activity_name, activity_type, rank_position');

      if (error) throw error;

      // First, determine the maximum items per category for scoring
      const maxRanksByType = {};
      data.forEach(vote => {
        if (!maxRanksByType[vote.activity_type] || vote.rank_position > maxRanksByType[vote.activity_type]) {
          maxRanksByType[vote.activity_type] = vote.rank_position;
        }
      });

      const activityScores = {};
      
      // Calculate weighted scores (1st choice = max_rank points, 2nd = max_rank-1, etc.)
      data.forEach(vote => {
        if (!activityScores[vote.activity_name]) {
          activityScores[vote.activity_name] = {
            name: vote.activity_name,
            type: vote.activity_type,
            score: 0,
            votes_by_rank: {},
            total_votes: 0
          };
        }
        
        const maxRank = maxRanksByType[vote.activity_type] || vote.rank_position;
        const points = Math.max(0, maxRank + 1 - vote.rank_position); // Dynamic scoring
        activityScores[vote.activity_name].score += points;
        
        if (!activityScores[vote.activity_name].votes_by_rank[vote.rank_position]) {
          activityScores[vote.activity_name].votes_by_rank[vote.rank_position] = 0;
        }
        activityScores[vote.activity_name].votes_by_rank[vote.rank_position]++;
        activityScores[vote.activity_name].total_votes++;
      });

      return new Response(JSON.stringify({
        results: Object.values(activityScores),
        maxRanksByType
      }), {
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

    const { data, error } = await query.order('rank_position', { ascending: true });

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

    // Insert new votes with rankings
    const voteRecords = votes.map(vote => ({
      email,
      activity_name: vote.activity_name,
      activity_type: vote.activity_type,
      rank_position: vote.rank_position
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
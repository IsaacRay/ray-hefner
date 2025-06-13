import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('totals')
      .select('child, total')
      .gte('date', monday.toISOString().split('T')[0]);

    if (error) {
      console.error('Error fetching weekly totals:', error);
      return Response.json({ error: 'Failed to fetch weekly totals' }, { status: 500 });
    }

    const weeklyTotals = {};
    data.forEach(entry => {
      if (weeklyTotals[entry.child]) {
        weeklyTotals[entry.child] += entry.total;
      } else {
        weeklyTotals[entry.child] = entry.total;
      }
    });

    return Response.json(weeklyTotals);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
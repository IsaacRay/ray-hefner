import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://lzxiyzhookfqphsmrwup.supabase.co"
const supabaseKey = process.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Calculate Monday of current week
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    // Fetch all behaviors
    const { data: behaviors, error: behaviorsError } = await supabase
      .from('behaviors')
      .select('*')
      .eq('visible', true)
      .order('child')
      .order('name');

    if (behaviorsError) throw behaviorsError;

    // Fetch totals since Monday
    const { data: totals, error: totalsError } = await supabase
      .from('totals')
      .select('*')
      .gte('date', monday.toISOString().split('T')[0])
      .order('child')
      .order('date');

    if (totalsError) throw totalsError;

    // Fetch behavior completions since Monday
    const { data: completions, error: completionsError } = await supabase
      .from('behavior_completions')
      .select('*')
      .gte('date', monday.toISOString().split('T')[0])
      .order('child')
      .order('date');

    if (completionsError) throw completionsError;

    // Get unique children
    const children = [...new Set(behaviors.map(b => b.child))];

    // Generate week days from Monday
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDays.push(day.toISOString().split('T')[0]);
    }

    // Organize data by child and date
    const calendarData = children.map(child => {
      const childBehaviors = behaviors.filter(b => b.child === child);
      const childTotals = totals.filter(t => t.child === child);
      const childCompletions = completions.filter(c => c.child === child);
      
      const weekData = weekDays.map(date => {
        const dayTotal = childTotals.find(t => t.date === date);
        const dayCompletions = childCompletions.filter(c => c.date === date);
        
        return {
          date,
          total: dayTotal ? dayTotal.total : 0,
          behaviors: childBehaviors.map(behavior => {
            const completion = dayCompletions.find(c => c.behavior_id === behavior.id);
            return {
              id: behavior.id,
              name: behavior.name,
              starred: completion ? completion.completed : false
            };
          })
        };
      });

      return {
        child,
        behaviors: childBehaviors,
        weekData
      };
    });

    return Response.json({
      children,
      weekDays,
      calendarData
    });

  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return Response.json({ error: 'Failed to fetch calendar data' }, { status: 500 });
  }
}
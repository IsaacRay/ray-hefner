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
    const { searchParams } = new URL(req.url);
    const template = searchParams.get('template');
    
    if (!template) {
      return new Response(JSON.stringify({ error: 'Template parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
      .from('packing_items')
      .select('*')
      .contains('templates', [template])
      .order('name', { ascending: true });

    if (error) throw error;
    
    const templateItems = data.map(item => ({
      ...item,
      packed: false
    }));

    return new Response(JSON.stringify(templateItems), {
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
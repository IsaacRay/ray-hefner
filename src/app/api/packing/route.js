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
      .from('packing_items')
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

export async function PUT(req) {
  try {
    const { id, packed, name, description, category, templates } = await req.json();
    
    const updateData = { updated_at: new Date().toISOString() };
    
    if (packed !== undefined) updateData.packed = packed;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (templates !== undefined) updateData.templates = templates;
    
    const { data, error } = await supabase
      .from('packing_items')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return new Response(JSON.stringify(data[0]), {
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
    const { name, description, category, templates } = await req.json();
    
    const { data, error } = await supabase
      .from('packing_items')
      .insert([{ name, description, category, templates: templates || [], packed: false }])
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

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    const { error } = await supabase
      .from('packing_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), {
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
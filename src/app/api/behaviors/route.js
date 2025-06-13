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
    const includeHidden = searchParams.get('includeHidden') === 'true';
    
    let query = supabase
      .from('behaviors')
      .select('*');
    
    // Filter by visibility unless includeHidden is true
    if (!includeHidden) {
      query = query.eq('visible', true);
    }
    
    // Filter by child if specified
    if (child) {
      query = query.eq('child', child);
    }
    
    const { data, error } = await query.order('child').order('name');

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

// Handle POST requests - Create new behavior
export async function POST(req) {
  try {
    const { name, description, child, default_checked, visible } = await req.json();
    
    if (!name || !child) {
      return new Response(JSON.stringify({ error: 'Name and child are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
      .from('behaviors')
      .insert([{ 
        name, 
        description: description || null,
        child,
        default_checked: default_checked || false,
        visible: visible !== undefined ? visible : true
      }])
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

// Handle PUT requests - Update behavior
export async function PUT(req) {
  try {
    const { id, name, description, child, default_checked, visible } = await req.json();
    
    if (!id || !name || !child) {
      return new Response(JSON.stringify({ error: 'ID, name, and child are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
      .from('behaviors')
      .update({ 
        name, 
        description: description || null,
        child,
        default_checked: default_checked || false,
        visible: visible !== undefined ? visible : true
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data.length === 0) {
      return new Response(JSON.stringify({ error: 'Behavior not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

// Handle DELETE requests - Delete behavior
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error } = await supabase
      .from('behaviors')
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
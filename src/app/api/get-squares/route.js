import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


// Initialize an admin Supabase client
export const dynamic = 'force-dynamic'

// Load environment variables (for local dev)
require('dotenv').config()

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

// Initialize Supabase client
const supabase = createClient(
  'https://lzxiyzhookfqphsmrwup.supabase.co',
  supabaseKey,
  {
    global: {
      // Force no-store caching if needed
      fetch: (url, options = {}) => {
        return fetch(url, { ...options, cache: 'no-store' })
      },
    },
  }
)
/**
 * GET /get-squares
 *
 * Returns a JSON object: 
 * {
 *   squares: [
 *     { squareId: number, userEmail: string },
 *     ...
 *   ]
 * }
 */
export async function GET() {
    try {
      // 1) Fetch all rows from "squares" table (which has columns: userid, email, square_number)
      const { data: squaresData, error } = await supabase
        .from('squares')
        .select('square_number, email')
  
      if (error) {
        throw error
      }
  
      // 2) Build the array of squares with occupant email
      //    If your `email` column might be null, handle that with a fallback
      const squares = (squaresData || []).map((row) => {
        return {
          squareId: row.square_number,
          userEmail: row.email || 'Unknown',
        }
      })
  
      return NextResponse.json({ squares })
    } catch (err) {
      console.error('Error in GET /get-squares:', err)
      return NextResponse.json(
        { error: err.message || 'Unknown error' },
        { status: 500 }
      )
    }
  }
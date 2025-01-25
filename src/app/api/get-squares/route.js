import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering in Next.js (optional)
export const dynamic = 'force-dynamic'

// Load environment variables (for local dev)
require('dotenv').config()

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

// Initialize Supabase client (anon key, or service key if needed)
const supabase = createClient(
  'https://lzxiyzhookfqphsmrwup.supabase.co',
  supabaseKey,
  {
    global: {
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
 *   ],
 *   axisX: [ value0, value1, ..., value9 ],
 *   axisY: [ value0, value1, ..., value9 ]
 * }
 *
 * If axisX or axisY can't be built (e.g., no rows), returns [] for each.
 */
export async function GET() {
  try {
    // 1) Fetch "squares" data
    const { data: squaresData, error: squaresError } = await supabase
      .from('squares')
      .select('square_number, email')

    if (squaresError) {
      throw squaresError
    }

    // Build the array of squares with occupant email
    // (If your `email` column might be null, handle that with a fallback)
    const squares = (squaresData || []).map((row) => {
      return {
        squareId: row.square_number,
        userEmail: row.email || 'Unknown',
      }
    })

    // 2) Fetch "square_sides" data to build axisX and axisY
    // We assume columns: axis (1 or 2), position (0..9), value (string/number)
    const { data: sidesData, error: sidesError } = await supabase
      .from('square_sides')
      .select('axis, position, value')
      .order('position', { ascending: true }) // ensures 0..9 order

    if (sidesError) {
      throw sidesError
    }

    // Separate data for axis=1 (X axis) vs. axis=2 (Y axis)
    const axisXRows = (sidesData || []).filter((row) => row.axis === 1)
    const axisYRows = (sidesData || []).filter((row) => row.axis === 2)

    // Map to just the "value" field, in ascending position order
    // Because of .order('position'), axisXRows and axisYRows are already sorted.
    const axisX = axisXRows.map((row) => row.value)
    const axisY = axisYRows.map((row) => row.value)

    // 3) Return JSON with squares, axisX, axisY
    return NextResponse.json({
      squares,
      axisX,
      axisY,
    })
  } catch (err) {
    console.error('Error in GET /get-squares:', err)
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

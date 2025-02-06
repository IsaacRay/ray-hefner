
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


export async function POST(request) {
    try {
      const body = await request.json()
      const { userUuid, squareId, email } = body
  
      if (!userUuid || typeof squareId !== 'number') {
        return NextResponse.json(
          { error: 'Missing userUuid or squareId in request body' },
          { status: 400 }
        )
      }

      // Check the total count of records in the squares table
      const { count, error: countError } = await supabase
        .from('squares')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        throw countError
      }

      if (count >= 100) {
        return NextResponse.json(
          { error: 'Squares are locked. No more selections allowed.' },
          { status: 403 }
        )
      }
  
      // 1) Check if there's already a row for this square
      const { data: existingRow, error: checkError } = await supabase
        .from('squares')
        .select('*')
        .eq('square_number', squareId)
        .single() // Expect at most one matching row
  
      if (checkError && checkError.code !== 'PGRST116') {
        // If error is something other than "No rows returned" (PGRST116)
        throw checkError
      }
  
      // 2) If a row exists, decide what to do
      if (existingRow) {
        if (existingRow.userid === userUuid) {
          // The same user who selected this square => unselect it (delete row)
          const { error: deleteError } = await supabase
            .from('squares')
            .delete()
            .eq('square_number', squareId)
  
          if (deleteError) {
            throw deleteError
          }
  
          return NextResponse.json({
            message: 'Square unselected (removed) successfully',
            unselected: true,
          })
        } else {
          // Another user owns this square => return an error
          return NextResponse.json(
            {
              error: `That square is owned by another user (${existingRow.email}).`,
            },
            { status: 403 }
          )
        }
      }
  
      // 3) If no row exists, create one for this user
      const { data, error } = await supabase
        .from('squares')
        .insert([
          {
            userid: userUuid,
            square_number: squareId,
            email: email, // We'll store the occupant's email for easy display
          },
        ])
        .select()
  
      if (error) {
        throw error
      }
  
      // Return success response
      return NextResponse.json({
        message: 'Square selected (added) successfully',
        data,
      })
    } catch (err) {
      console.error('Error in POST /select-square:', err)
      return NextResponse.json(
        { error: err.message || 'Unknown error' },
        { status: 500 }
      )
    }
  }
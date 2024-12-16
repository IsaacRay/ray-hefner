// API endpoint for checking if the user is authenticated:
//src/app/api/check-authenticated/route.js
//check if cookie "authenticated" is set to true
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  // Get cookies using the cookies() function
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated')?.value === 'true';

  // Return the result as JSON
  return NextResponse.json({ authenticated });
}

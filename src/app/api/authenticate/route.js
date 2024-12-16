// src/app/api/authenticate/route.js

import { NextResponse } from 'next/server';

/**
 * API route to handle pattern authentication.
 *
 * @param {NextRequest} request - Incoming request object.
 * @returns {NextResponse} - Response indicating authentication success or failure.
 */
export async function POST(request) {
  try {
    const { pattern } = await request.json();

    // Define the correct pattern
    const correctPattern = [3,6,7,8]; // Example pattern

    const isValid = arraysEqual(pattern, correctPattern);

    if (isValid) {
      const response = NextResponse.json({ success: true });
      // Set the authentication cookie (expires in 7 days)
      response.cookies.set('authenticated', 'true', {
        secure: true, // Only over HTTPS in production
        path: '/', // Accessible across all routes
        maxAge: 7*24*60 * 60, // 7 days in seconds
        sameSite: 'None', // CSRF protection
      });
      return response;
    } else {
      return NextResponse.json({ success: false }, { status: 401 });
    }
  } catch (error) {
    console.error('Error in authenticate API:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

/**
 * Utility function to compare two arrays for equality.
 *
 * @param {Array} a - First array.
 * @param {Array} b - Second array.
 * @returns {boolean} - True if arrays are equal, false otherwise.
 */
const arraysEqual = (a, b) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

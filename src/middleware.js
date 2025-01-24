// middleware.js

import { NextResponse } from 'next/server';

/**
 * Middleware to protect the /home route by checking for the 'authenticated' cookie.
 *
 * @param {NextRequest} request - Incoming request object.
 * @returns {NextResponse} - Response object with possible redirection.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  console.log(`Middleware triggered for path: ${pathname}`);

  if (pathname.startsWith('/api')|| pathname.startsWith('/squares')) {
    console.log('API route detected. Skipping middleware.');
    return NextResponse.next();
  }


  const authCookie = request.cookies.get('authenticated');

  // Access the value of the cookie
  const authValue = authCookie?.value;
  console.log(`Authenticated Cookie Value: ${authValue}`);

  if (authValue !== 'true') {
    console.log('User is not authenticated. Redirecting to /');
    // Redirect to the pattern page if not authenticated
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  } else {
    console.log('User is authenticated. Access granted');
  }
  

  // Allow the request to proceed if authenticated or not a protected route
  return NextResponse.next();
}



export const config = {
  // Explanation of the regex: 
  // '/((?!api|squares|$).*)'
  // 1. `'/` - The path starts with a slash.
  // 2. `(?!api|squares|$)` - Negative lookahead that disallows:
  //    - "api" at the start,
  //    - "squares" at the start,
  //    - an empty string (which would be the root path "/").
  // 3. `.*` - Matches everything else.
  matcher: '/((?!api|squares|$).*)',
};
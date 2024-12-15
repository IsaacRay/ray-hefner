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

  // Define the protected route
  const protectedRoute = '/home';

  // Check if the request is for the protected route
  if (pathname === protectedRoute) {
    // Get the 'authenticated' cookie
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
      console.log('User is authenticated. Access granted to /home');
    }
  }

  // Allow the request to proceed if authenticated or not a protected route
  return NextResponse.next();
}

/**
 * Configuration for the middleware.
 * The matcher specifies which routes the middleware should apply to.
 */
export const config = {
  matcher: '/home',
};

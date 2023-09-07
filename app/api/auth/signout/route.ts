import { auth } from '~/utils/auth';

import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export const GET = async (request: NextRequest) => {
  console.log('signout');

  const authRequest = auth.handleRequest({ request, cookies });
  // check if user is authenticated
  const session = await authRequest.validate();

  console.log('session', session);

  if (!session) {
    return new Response(null, {
      status: 401,
    });
  }

  // make sure to invalidate the current session!
  await auth.invalidateSession(session.sessionId);

  // delete session cookie
  authRequest.setSession(null);

  const url = request.nextUrl.clone();
  url.pathname = '/';
  return NextResponse.redirect(url);
};

export const POST = GET;

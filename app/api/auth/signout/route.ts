import { auth } from '~/utils/auth';

import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export const POST = async (request: NextRequest) => {
  const authRequest = auth.handleRequest({ request, cookies });
  // check if user is authenticated
  const session = await authRequest.validate();

  if (!session) {
    console.log('Signout: requested signout, but there was no session!');
    return new Response(null, {
      status: 401,
    });
  }

  // make sure to invalidate the current session!
  await auth.invalidateSession(session.sessionId);

  // delete session cookie
  authRequest.setSession(null);
  return NextResponse.json(
    {
      success: true,
    },
    {
      status: 200,
    },
  );
};

export const GET = POST;

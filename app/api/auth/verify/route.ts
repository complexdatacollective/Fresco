import { auth } from '~/utils/auth';

import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export const POST = async (request: NextRequest) => {
  const authRequest = auth.handleRequest({ request, cookies });
  // check if user is authenticated
  const session = await authRequest.validate();

  if (!session) {
    return NextResponse.json(
      {
        error: 'Invalid session',
      },
      {
        status: 401,
      },
    );
  }

  return NextResponse.json(
    {
      message: 'Valid session',
    },
    {
      status: 200,
    },
  );
};

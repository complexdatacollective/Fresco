import { auth } from '~/utils/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { userFormSchema } from '~/app/(onboard)/_shared';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export const POST = async (request: NextRequest) => {
  const body = await request.json();

  // Validate against zod schema so we can reject malformed requests
  const result = userFormSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid data submitted.',
      },
      {
        status: 400,
      },
    );
  }

  const { username, password } = result.data;

  try {
    const user = await auth.createUser({
      key: {
        providerId: 'username', // auth method
        providerUserId: username, // unique id when using "username" auth method
        password, // hashed by Lucia
      },
      attributes: {
        username,
      },
    });

    const session = await auth.createSession({
      userId: user.userId,
      attributes: {},
    });

    const authRequest = auth.handleRequest({
      request,
      cookies,
    });

    authRequest.setSession(session);

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/', // redirect to profile page
      },
    });
  } catch (e) {
    // this part depends on the database you're using
    // check for unique constraint error in user table
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'Username already taken',
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        error: 'An unknown error occurred',
      },
      {
        status: 500,
      },
    );
  }
};

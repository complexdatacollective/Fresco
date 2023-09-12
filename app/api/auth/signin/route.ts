import { auth } from '~/utils/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { LuciaError } from 'lucia';
import type { NextRequest } from 'next/server';
import { userFormSchema } from '~/app/(onboard)/_shared';
import { z } from 'zod';

export const signinResponse = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export type SigninResponse = z.infer<typeof signinResponse>;

export const POST = async (
  request: NextRequest,
): Promise<NextResponse<SigninResponse>> => {
  const body = await request.json();

  // Validate against zod schema so we can reject malformed requests
  const result = userFormSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid username or password',
      },
      {
        status: 400,
      },
    );
  }

  const { username, password } = result.data;

  try {
    const key = await auth.useKey('username', username, password);

    const session = await auth.createSession({
      userId: key.userId,
      attributes: {},
    });

    const authRequest = auth.handleRequest({
      request,
      cookies,
    });

    authRequest.setSession(session);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    if (
      e instanceof LuciaError &&
      (e.message === 'AUTH_INVALID_KEY_ID' ||
        e.message === 'AUTH_INVALID_PASSWORD')
    ) {
      // user does not exist or invalid password
      return NextResponse.json(
        {
          success: false,
          error: 'Incorrect username or password',
        },
        {
          status: 401,
        },
      );
    }

    console.log(e);

    return NextResponse.json(
      {
        success: false,
        error: 'An unknown error occurred',
      },
      {
        status: 500,
      },
    );
  }
};

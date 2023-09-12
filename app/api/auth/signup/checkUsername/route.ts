import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '~/utils/db';
import { safeLoader } from '~/utils/safeLoader';

const checkUsernameSchema = z.object({
  username: z.string().min(4),
});

export type CheckUsernameData = z.infer<typeof checkUsernameSchema>;

// Route Handler to check if a username is available
export const POST = async (request: NextRequest) => {
  const body = await request.json();

  // Validate against zod schema so we can reject malformed requests
  const result = checkUsernameSchema.safeParse(body);

  console.log('checkUsername', result);

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

  const { username } = result.data;

  try {
    const userExists = await safeLoader({
      outputValidation: z.object({
        username: z.string(),
      }),
      loader: () =>
        prisma.user.findFirst({
          where: {
            username,
          },
          select: {
            username: true,
          },
        }),
    });

    console.log('user', userExists);

    if (userExists) {
      return NextResponse.json(
        {
          success: false,
        },
        {
          status: 200,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
      },
    );
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Something went wrong.',
      },
      {
        status: 500,
      },
    );
  }
};

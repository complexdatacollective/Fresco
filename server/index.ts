import { safeLoader } from '~/utils/safeLoader';
import { protectedProcedure, publicProcedure, router } from './trpc';
import { z } from 'zod';
import { prisma } from '~/utils/db';
import { userFormSchema } from '~/app/(onboard)/_shared';
import { auth } from '~/utils/auth';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Session } from 'lucia';

export const appRouter = router({
  test: protectedProcedure.query(({ ctx }) => {
    console.log('ctx', ctx);
    return {
      test: 'test',
    };
  }),
  checkUsername: publicProcedure
    .input(userFormSchema.pick({ username: true }))
    .query(async ({ input }) => {
      const { username } = input;

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

      if (userExists) {
        return {
          userExists: true,
        };
      }

      return {
        userExists: false,
      };
    }),
  // userSignup: publicProcedure
  //   .input(userFormSchema)
  //   .mutation(async ({ input, ctx }) => {
  //     const { username, password } = input;
  //     console.log('sign', ctx);

  //     try {
  //       const user = await auth.createUser({
  //         key: {
  //           providerId: 'username', // auth method
  //           providerUserId: username, // unique id when using "username" auth method
  //           password, // hashed by Lucia
  //         },
  //         attributes: {
  //           username,
  //         },
  //       });

  //       const session = await auth.createSession({
  //         userId: user.userId,
  //         attributes: {},
  //       });

  //       // const authRequest = auth.handleRequest({
  //       //   request: req,
  //       //   cookies: null,
  //       // });

  //       return user;
  //     } catch (e) {
  //       if (e instanceof PrismaClientKnownRequestError) {
  //         if (e.code === 'P2002') {
  //           return {
  //             error: 'Username already exists.',
  //           };
  //         }
  //       }

  //       throw e;
  //     }
  //   }),
});

export type AppRouter = typeof appRouter;

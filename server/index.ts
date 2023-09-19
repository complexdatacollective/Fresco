import { safeLoader } from '~/utils/safeLoader';
import { protectedProcedure, publicProcedure, router } from './trpc';
import { z } from 'zod';
import { prisma } from '~/utils/db';
import { userFormSchema } from '~/app/(onboard)/_shared';
import { auth } from '~/utils/auth';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as context from 'next/headers';
import { LuciaError } from 'lucia';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';

export const appRouter = router({
  getSetupMetadata: publicProcedure.query(async () => {
    // eslint-disable-next-line local-rules/require-data-mapper
    const setupMetadata = await prisma.setupMetadata.findFirstOrThrow();

    return {
      ...setupMetadata,
      expired:
        !!setupMetadata.configured &&
        setupMetadata.initializedAt.getTime() <
          Date.now() - UNCONFIGURED_TIMEOUT,
    };
  }),
  test: protectedProcedure.query(({ ctx }) => {
    // eslint-disable-next-line no-console
    console.log('ctx', ctx);
    return {
      test: 'test',
    };
  }),
  signUp: publicProcedure.input(userFormSchema).mutation(async ({ input }) => {
    const { username, password } = input;

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

      const authRequest = auth.handleRequest('POST', context);

      authRequest.setSession(session);

      return {
        error: null,
        session,
      };
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        return {
          error: 'Username already exists.',
          session: null,
        };
      }

      throw e;
    }
  }),
  signIn: publicProcedure.input(userFormSchema).mutation(async ({ input }) => {
    const { username, password } = input;

    try {
      const key = await auth.useKey('username', username, password);

      const session = await auth.createSession({
        userId: key.userId,
        attributes: {},
      });

      const authRequest = auth.handleRequest('POST', context);

      authRequest.setSession(session);

      return {
        error: null,
        session,
      };
    } catch (e) {
      if (
        e instanceof LuciaError &&
        (e.message === 'AUTH_INVALID_KEY_ID' ||
          e.message === 'AUTH_INVALID_PASSWORD')
      ) {
        // user does not exist or invalid password
        return {
          session: null,
          error: 'Incorrect username or password',
        };
      }

      // eslint-disable-next-line no-console
      console.log('Unknown error', e);

      return {
        session: null,
        error: 'An unknown error occurred',
      };
    }
  }),
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    const { session } = ctx;

    const authRequest = auth.handleRequest('POST', context);
    await auth.invalidateSession(session.sessionId);

    authRequest.setSession(null);

    return {
      success: true,
    };
  }),
  getSession: publicProcedure.query(async () => {
    const authRequest = auth.handleRequest('GET', context);
    const session = await authRequest.validate();
    return {
      session,
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
});

export type AppRouter = typeof appRouter;

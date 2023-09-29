import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { LuciaError, type Session } from 'lucia';
import { userFormSchema } from '~/app/(onboard)/_shared';
import { auth } from '~/utils/auth';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import * as context from 'next/headers';
import { helpers } from '~/app/_trpc/proxy';

export const sessionRouter = router({
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

      await helpers.session.get.fetch();

      return {
        error: null,
        user,
      };
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        return {
          error: 'Username already exists.',
          user: null,
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

      await helpers.session.get.fetch();

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

    await helpers.session.get.fetch();

    return {
      success: true,
    };
  }),
  get: publicProcedure.query(async (): Promise<Session | null> => {
    const authRequest = auth.handleRequest('GET', context);
    const session = await authRequest.validate();
    return session;
  }),
});

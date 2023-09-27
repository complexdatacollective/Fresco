import { TRPCError, initTRPC } from '@trpc/server';
import { headers } from 'next/headers';
import { experimental_createServerActionHandler } from '@trpc/next/app-dir/server';
import type { Context } from './context';
import { ZodError } from 'zod';
import { getDefaultSession } from '~/utils/auth';

const t = initTRPC.context<Context>().create({
  errorFormatter(opts) {
    const { shape, error } = opts;
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      ...ctx,
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

export const createAction = experimental_createServerActionHandler(t, {
  async createContext() {
    return {
      session: await getDefaultSession(),
      headers: {
        // Pass the cookie header to the API
        cookies: headers().get('cookie') ?? '',
      },
    };
  },
});

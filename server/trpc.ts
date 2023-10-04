import { TRPCError, initTRPC } from '@trpc/server';
import type { createTRPCContext } from './context';
import { env } from '~/env.mjs';

const t = initTRPC.context<typeof createTRPCContext>().create();

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

const enforceDevEnvironment = t.middleware(({ ctx, next }) => {
  if (env.NODE_ENV !== 'development') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return next({
    ctx,
  });
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const devProcedure = t.procedure.use(enforceDevEnvironment);

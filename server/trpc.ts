import { TRPCError, initTRPC } from '@trpc/server';
import { type createTRPCContext } from './context';
import superjson from 'superjson';
import { env } from '~/env.mjs';
import { ZodError } from 'zod';

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
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

const enforceDevEnvironment = t.middleware(({ ctx, next }) => {
  if (env.NODE_ENV !== 'development') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return next({
    ctx,
  });
});

// /**
//  * Helper to create validated server actions from trpc procedures, or build inline actions using the
//  * reusable procedure builders.
//  */
// export const createAction = experimental_createServerActionHandler(t, {
//   createContext() {
//     const ctx = createInnerTRPCContext({
//       headers: headers(),
//     });
//     return ctx;
//   },
// });

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const devProcedure = t.procedure.use(enforceDevEnvironment);

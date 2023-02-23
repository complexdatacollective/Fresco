/**
 * Adapted from: https://www.jumr.dev/blog/t3-turbo
*/

import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";
import { prisma } from "@codaco/database";
import superjson from "superjson";

/**
 * This is the actual context you'll use in your router. It will be used to
 * process every request that goes through your tRPC endpoint
 * @link https://trpc.io/docs/context
 */
export const createTRPCContext = async () => {
  // Inject prisma into the context
  return {
    prisma,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  isServer: true,
  transformer: superjson, // Allows more types in JSON: https://github.com/blitz-js/superjson
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


/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure;

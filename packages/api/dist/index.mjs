// src/trpc.ts
import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";
import { prisma } from "@codaco/database";
import superjson from "superjson";
var createTRPCContext = async () => {
  return {
    prisma
  };
};
var t = initTRPC.context().create({
  isServer: true,
  transformer: superjson,
  // Allows more types in JSON: https://github.com/blitz-js/superjson
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null
      }
    };
  }
});
var createTRPCRouter = t.router;
var publicProcedure = t.procedure;

// src/routers/user.ts
import { z } from "zod";
var userRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findMany({ orderBy: { id: "desc" } });
  }),
  byId: publicProcedure.input(z.number()).query(({ ctx, input }) => {
    return ctx.prisma.user.findFirst({ where: { id: input } });
  }),
  create: publicProcedure.input(z.object({ name: z.string().min(1), email: z.string().min(1) })).mutation(({ ctx, input }) => {
    return ctx.prisma.user.create({ data: input });
  }),
  delete: publicProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return ctx.prisma.user.delete({ where: { id: input } });
  })
});

// src/routers/protocols.ts
import { z as z2 } from "zod";
var protocolsRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.protocol.findMany({ orderBy: { id: "desc" } });
  }),
  byId: publicProcedure.input(z2.number()).query(({ ctx, input }) => {
    return ctx.prisma.protocol.findFirst({ where: { id: input } });
  }),
  byHash: publicProcedure.input(z2.string()).query(({ ctx, input }) => {
    return ctx.prisma.protocol.findFirst({ where: { hash: input } });
  })
});

// src/root.ts
var appRouter = createTRPCRouter({
  user: userRouter,
  protocols: protocolsRouter
});
export {
  appRouter,
  createTRPCContext
};
//# sourceMappingURL=index.mjs.map
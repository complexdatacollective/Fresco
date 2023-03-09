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

// src/routers/interviews.ts
import { z as z3 } from "zod";
var interviewsRouter = createTRPCRouter({
  // Get all interviews, with optional sorting and pagination
  all: publicProcedure.input(
    z3.object({
      orderBy: z3.object({
        id: z3.enum(["asc", "desc"]),
        createdAt: z3.enum(["asc", "desc"]),
        updatedAt: z3.enum(["asc", "desc"])
      }).optional(),
      skip: z3.number().optional(),
      take: z3.number().optional()
    }).optional()
  ).query(({ ctx, input }) => {
    return ctx.prisma.interview.findMany({
      ...input,
      include: {
        protocol: {
          select: {
            name: true
          }
        }
      }
    });
  }),
  // Get a single interview by ID
  get: publicProcedure.input(z3.number()).query(
    ({ ctx, input }) => {
      return ctx.prisma.interview.findUnique({ where: { id: input } });
    }
  ),
  // Create a new interview
  create: publicProcedure.input(
    z3.object({
      caseId: z3.string(),
      protocol: z3.string()
    })
  ).mutation(
    ({ ctx, input }) => {
      return ctx.prisma.interview.create({
        data: {
          caseId: input.caseId,
          protocol: input.protocol
        }
      });
    }
  ),
  // Update the network of an existing interview. Used to sync between stages.
  updateNetwork: publicProcedure.input(
    z3.object({
      id: z3.number(),
      network: z3.string()
    })
  ).mutation(({ ctx, input }) => {
    return ctx.prisma.interview.update({
      where: { id: input.id },
      data: {
        network: input.network
      }
    });
  })
});

// src/root.ts
var appRouter = createTRPCRouter({
  user: userRouter,
  protocols: protocolsRouter,
  interviews: interviewsRouter
});
export {
  appRouter,
  createTRPCContext
};
//# sourceMappingURL=index.mjs.map
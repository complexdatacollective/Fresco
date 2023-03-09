import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";

export const interviewsRouter = createTRPCRouter({
  // Get all interviews, with optional sorting and pagination
  all: publicProcedure
    .input(
      z.object({
        orderBy: z
          .object({
            id: z.enum(["asc", "desc"]),
            createdAt: z.enum(["asc", "desc"]),
            updatedAt: z.enum(["asc", "desc"]),
          })
          .optional(),
        skip: z.number().optional(),
        take: z.number().optional(),
      }).optional(),
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.interview.findMany({
        ...input,
        include: {
          protocol: {
            select: {
              name: true,
            },
          }
        }
      });
    }),
  // Get a single interview by ID
  get: publicProcedure
    .input(z.number())
    .query(({ ctx, input }) => {
      return ctx.prisma.interview.findUnique({ where: { id: input } });
    }
    ),
  // Create a new interview
  create: publicProcedure
    .input(
      z.object({
        caseId: z.string(),
        protocol: z.string(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.interview.create({
        data: {
          caseId: input.caseId,
          protocol: input.protocol,
        },
      });
    }
    ),
  // Update the network of an existing interview. Used to sync between stages.
  updateNetwork: publicProcedure
    .input(
      z.object({
        id: z.number(),
        network: z.string(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.interview.update({
        where: { id: input.id },
        data: {
          network: input.network,
        },
      });
    }),
});
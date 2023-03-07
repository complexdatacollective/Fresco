import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";

export const protocolsRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.protocol.findMany({ orderBy: { id: "desc" } });
  }),
  byId: publicProcedure.input(z.number()).query(({ ctx, input }) => {
    return ctx.prisma.protocol.findFirst({ where: { id: input } });
  }),
  byHash: publicProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.protocol.findFirst({ where: { hash: input } });
  }),
});
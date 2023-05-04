import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      console.log('query!')
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findMany();
  }),

  createUser: publicProcedure.mutation(({ ctx, input }) => {
    if (!input || !input.name || !input.email || !input.password) {
      return
    }
    const user = ctx.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: input.password,
        roles: {
          connect: [{
            id: '2',
        }],
      },
      },
    });

    return user;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "Only authenticated users can see this message!";
  }),

  getAdminMessage: adminProcedure.query(() => {
    return "Only admin users can see this message!";
  })

});

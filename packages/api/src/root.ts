import { createTRPCRouter } from "./trpc";
import { userRouter } from "./routers/user";
import { protocolsRouter } from "./routers/protocols"

export const appRouter = createTRPCRouter({
  user: userRouter,
  protocols: protocolsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
import { createTRPCContext } from '~/server/context';
import { appRouter } from '~/server/router';

export const trpc = appRouter.createCaller({
  ...(await createTRPCContext()),
});

import { createTRPCContext } from '~/server/context';
import { appRouter } from '~/server/router';

export const caller = appRouter.createCaller({
  ...(await createTRPCContext()),
});

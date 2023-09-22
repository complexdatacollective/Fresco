import { metadataRouter } from '~/server/routers/metadata';
import { sessionRouter } from '~/server/routers/session';
import { protocolRouter } from '~/server/routers/protocol';
import { router } from '~/server/trpc';

export const appRouter = router({
  metadata: metadataRouter,
  session: sessionRouter,
  protocol: protocolRouter,
});

export type AppRouter = typeof appRouter;

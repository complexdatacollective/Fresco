import { metadataRouter } from './routers/metadata';
import { sessionRouter } from './routers/session';
import { protocolRouter } from './routers/protocol';
import { router } from './trpc';

export const appRouter = router({
  metadata: metadataRouter,
  session: sessionRouter,
  protocol: protocolRouter,
});

export type AppRouter = typeof appRouter;

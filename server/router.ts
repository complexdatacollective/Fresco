import { metadataRouter } from './routers/metadata';
import { sessionRouter } from './routers/session';
import { router } from './trpc';

export const appRouter = router({
  metadata: metadataRouter,
  session: sessionRouter,
});

export type AppRouter = typeof appRouter;

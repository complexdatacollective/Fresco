import { metadataRouter } from './routers/metadata';
import { participantsRouter } from './routers/participants';
import { sessionRouter } from './routers/session';
import { router } from './trpc';

export const appRouter = router({
  metadata: metadataRouter,
  session: sessionRouter,
  participants: participantsRouter,
});

export type AppRouter = typeof appRouter;

import { metadataRouter } from './routers/metadata';
import { participantRouter } from './routers/participants';
import { sessionRouter } from './routers/session';
import { protocolRouter } from './routers/protocol';
import { router } from '~/server/trpc';

export const appRouter = router({
  metadata: metadataRouter,
  session: sessionRouter,
  participant: participantRouter,
  protocol: protocolRouter,
});

export type AppRouter = typeof appRouter;

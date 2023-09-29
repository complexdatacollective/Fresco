import { metadataRouter } from './routers/metadata';
import { participantsRouter } from './routers/participants';
import { sessionRouter } from './routers/session';
import { interviewRouter } from './routers/interview';
import { protocolRouter } from '~/server/routers/protocol';
import { router } from './trpc';

export const appRouter = router({
  metadata: metadataRouter,
  session: sessionRouter,
  participants: participantsRouter,
  interview: interviewRouter,
  protocol: protocolRouter,
});

export type AppRouter = typeof appRouter;

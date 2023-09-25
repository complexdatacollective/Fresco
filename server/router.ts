import { metadataRouter } from './routers/metadata';
import { sessionRouter } from './routers/session';
import { interviewRouter } from './routers/interview';
import { router } from './trpc';

export const appRouter = router({
  metadata: metadataRouter,
  session: sessionRouter,
  interview: interviewRouter,
});

export type AppRouter = typeof appRouter;

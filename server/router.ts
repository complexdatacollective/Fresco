import { appSettingsRouter } from './routers/settings';
import { sessionRouter } from './routers/session';
import { interviewRouter } from './routers/interview';
import { protocolRouter } from '~/server/routers/protocol';
import { participantRouter } from './routers/participant';
import { router } from './trpc';

export const appRouter = router({
  appSettings: appSettingsRouter,
  session: sessionRouter,
  interview: interviewRouter,
  protocol: protocolRouter,
  participant: participantRouter,
});

export type AppRouter = typeof appRouter;

import { appSettingsRouter } from './routers/appSettings';
import { interviewRouter } from './routers/interview';
import { protocolRouter } from '~/server/routers/protocol';
import { participantRouter } from './routers/participant';
import { router } from './trpc';

export const appRouter = router({
  appSettings: appSettingsRouter,
  interview: interviewRouter,
  protocol: protocolRouter,
  participant: participantRouter,
});

export type AppRouter = typeof appRouter;

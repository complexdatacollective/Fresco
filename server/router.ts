import { appSettingsRouter } from './routers/appSettings';
import { sessionRouter } from './routers/session';
import { interviewRouter } from './routers/interview';
import { protocolRouter } from '~/server/routers/protocol';
import { participantRouter } from './routers/participant';
import { router } from './trpc';
import { dashboardRouter } from './routers/dashboard';
import { assetRouter } from './routers/asset';

export const appRouter = router({
  appSettings: appSettingsRouter,
  asset: assetRouter,
  dashboard: dashboardRouter,
  session: sessionRouter,
  interview: interviewRouter,
  protocol: protocolRouter,
  participant: participantRouter,
});

export type AppRouter = typeof appRouter;

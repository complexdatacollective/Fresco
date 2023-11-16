import { appSettingsRouter } from './routers/appSettings';
import { sessionRouter } from './routers/session';
import { interviewRouter } from './routers/interview';
import { protocolRouter } from '~/server/routers/protocol';
import { participantRouter } from './routers/participant';
import { errorsRouter } from './routers/errors';
import { router } from './trpc';

export const appRouter = router({
  appSettings: appSettingsRouter,
  session: sessionRouter,
  interview: interviewRouter,
  protocol: protocolRouter,
  participant: participantRouter,
  errors: errorsRouter,
});

export type AppRouter = typeof appRouter;

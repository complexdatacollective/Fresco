import {
  experimental_createActionHook,
  experimental_serverActionLink,
} from '@trpc/next/app-dir/client';

import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '~/server/router';

export const trpcReact = createTRPCReact<AppRouter>();

export const useAction = experimental_createActionHook({
  links: [experimental_serverActionLink()],
});

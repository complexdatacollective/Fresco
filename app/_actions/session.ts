'use server';

import { createAction } from '~/server/trpc';
import { trpcRscProxy } from '../_trpc/proxy';

export const signOutAction = createAction(trpcRscProxy.session.signOut);
export const signInAction = createAction(trpcRscProxy.session.signIn);

'use server';

import { redirect } from 'next/navigation';
import { trpcRscHTTP } from '../_trpc/server';

export const setConfiguredAction = async () => {
  await trpcRscHTTP.metadata.setConfigured.mutate();
  await trpcRscHTTP.metadata.get.revalidate();
  redirect('/dashboard');
};

'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { api } from '~/trpc/server';

export const resetAppSettings = async () => {
  await api.appSettings.reset.mutate();

  revalidateTag('appConfigured');
  revalidateTag('appExpired');

  redirect('/');
};

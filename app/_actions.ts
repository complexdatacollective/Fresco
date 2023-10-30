'use server';

import { redirect } from 'next/navigation';
import { api } from '~/trpc/server';

export const resetAppSettings = async () => {
  await api.appSettings.reset.mutate();
  redirect('/');
};

export const setAppConfigured = async () => {
  await api.appSettings.setConfigured.mutate();
  redirect('/');
};

'use server';

import { redirect } from 'next/navigation';
import { api } from '~/trpc/server';

export const resetAppSettings = async () => {
  try {
    await api.appSettings.reset.mutate();
    redirect('/');
  } catch (error) {
    throw new Error(error as string);
  }
};

export const setAppConfigured = async () => {
  await api.appSettings.setConfigured.mutate();
  redirect('/dashboard');
};

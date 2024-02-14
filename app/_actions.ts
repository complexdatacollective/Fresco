'use server';

import { redirect } from 'next/navigation';
import { api } from '~/trpc/server';
import { ensureError } from '~/utils/ensureError';

export const resetAppSettings = async () => {
  try {
    await api.appSettings.reset.mutate();
  } catch (error) {
    const e = ensureError(error);
    throw new Error(e.message);
  }
};

export const setAppConfigured = async () => {
  await api.appSettings.setConfigured.mutate();
  redirect('/dashboard');
};

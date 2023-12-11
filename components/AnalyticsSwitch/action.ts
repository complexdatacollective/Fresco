'use server';

import { api } from '~/trpc/server';

export async function setAnalytics(state: boolean) {
  try {
    await api.appSettings.updateAnalytics.mutate(state);
  } catch (error) {
    throw new Error(error as string, { cause: error });
  }
}

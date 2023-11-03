'use server';

import { api } from '~/trpc/server';

export async function setAnalytics(state: boolean) {
  await api.appSettings.updateAnalytics.mutate(state);
}

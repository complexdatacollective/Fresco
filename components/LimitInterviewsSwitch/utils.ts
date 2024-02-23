'use server';

import { api } from '~/trpc/server';

export async function setLimitInterviews(state: boolean) {
  const result = await api.appSettings.updateLimitInterviews.mutate(state);

  return result;
}

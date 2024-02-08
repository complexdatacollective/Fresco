'use server';

import { api } from '~/trpc/server';

export async function setAnonymousRecruitment(state: boolean) {
  const result = await api.appSettings.updateAnonymousRecruitment.mutate(state);

  return result;
}

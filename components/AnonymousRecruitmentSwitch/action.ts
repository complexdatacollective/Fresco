'use server';

import { api } from '~/trpc/server';

export async function setAnonymousRecruitment(state: boolean) {
  await api.appSettings.updateAnonymousRecruitment.mutate(state);
}

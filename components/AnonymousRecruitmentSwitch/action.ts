'use server';

import { api } from '~/trpc/server';

export async function setAnonymousRecruitment(state: boolean) {
  try {
    await api.appSettings.updateAnonymousRecruitment.mutate(state);
  } catch (error) {
    throw new Error(error as string);
  }
}

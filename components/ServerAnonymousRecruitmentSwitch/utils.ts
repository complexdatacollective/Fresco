'use server';

import { revalidatePath } from 'next/cache';
import { api } from '~/trpc/server';

export async function setAnonymousRecruitment(state: boolean) {
  const result = await api.appSettings.updateAnonymousRecruitment.mutate(state);

  revalidatePath('/dashboard');

  return result;
}

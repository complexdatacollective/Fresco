'use server';

import { revalidateTag } from 'next/cache';
import { getAppSettings } from '~/server/routers/appSettings';
import { prisma } from '~/utils/db';

export async function setAnonymousRecruitment(state: boolean) {
  const { configured, initializedAt } = await getAppSettings();

  // eslint-disable-next-line local-rules/require-data-mapper
  await prisma.appSettings.update({
    where: {
      configured_initializedAt: {
        configured,
        initializedAt,
      },
    },
    data: {
      allowAnonymousRecruitment: state,
    },
  });

  // Currently, this is not working with tRPC, for unknown reasons.
  // const result = await api.appSettings.updateAnonymousRecruitment.mutate(state);

  revalidateTag('anonymousRecruitment');
}

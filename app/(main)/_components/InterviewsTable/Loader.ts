import { prisma } from '~/utils/db';
import { safeLoader } from '~/lib/data-mapper/safeLoader';
import { InterviewValidation } from '~/lib/data-mapper/validation';

async function loadInterviews() {
  const interviews = await prisma.interview.findMany({
    include: {
      user: {
        select: {
          name: true,
        },
      },
      protocol: true,
    },
  });

  return interviews;
}

export const safeLoadInterviews = safeLoader({
  outputValidation: InterviewValidation,
  loader: loadInterviews,
});

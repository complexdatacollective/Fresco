import { Prisma } from '@prisma/client';

const participantWithInterviews =
  Prisma.validator<Prisma.ParticipantDefaultArgs>()({
    include: { interviews: true },
  });

export type ParticipantWithInterviews = Prisma.ParticipantGetPayload<
  typeof participantWithInterviews
>;

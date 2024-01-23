import { Prisma } from '@prisma/client';

const ProtocolWithInterviews = Prisma.validator<Prisma.ProtocolDefaultArgs>()({
  include: { interviews: true },
});

export type ProtocolWithInterviews = Prisma.ProtocolGetPayload<
  typeof ProtocolWithInterviews
>;

const participantWithInterviews =
  Prisma.validator<Prisma.ParticipantDefaultArgs>()({
    include: { interviews: true, _count: { select: { interviews: true } } },
  });

export type ParticipantWithInterviews = Prisma.ParticipantGetPayload<
  typeof participantWithInterviews
>;

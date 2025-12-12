import { type Prisma } from '~/lib/db/generated/prisma/client';

export type ProtocolWithInterviews = Prisma.ProtocolGetPayload<{
  include: { interviews: true };
}>;

export type ParticipantWithInterviews = Prisma.ParticipantGetPayload<{
  include: { interviews: true; _count: { select: { interviews: true } } };
}>;

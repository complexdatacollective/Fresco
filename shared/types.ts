import { Prisma } from '@prisma/client';

const ProtocolWithInterviews = Prisma.validator<Prisma.ProtocolDefaultArgs>()({
  include: { interviews: true },
});

export type ProtocolWithInterviews = Prisma.ProtocolGetPayload<
  typeof ProtocolWithInterviews
>;

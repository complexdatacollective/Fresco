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

type UploadData = {
  key: string;
  url: string;
  name: string;
  size: number;
};

export type UpdateItems = {
  statusText: string;
  progress: number;
};

export type FailResult = {
  data: null;
  error: string;
};

export type SuccessResult = {
  data: UploadData;
  error: null;
};

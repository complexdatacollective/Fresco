import { type Prisma, type Protocol } from '@prisma/client';
// import type { Protocol } from '~/lib/shared-consts';
// import type { ServerSession } from '~/app/(interview)/interview/[interviewId]/page';

// temporarily declaring this type
// Todo: check if you can import this type from anywhere
type ServerSession = {
  id: string;
  startTime: Date;
  finishTime: Date | null;
  exportTime: Date | null;
  lastUpdated: Date;
  network: Prisma.JsonValue;
  participantId: string;
  protocolId: string;
  currentStep: number;
  sessionMetadata?: Prisma.JsonValue;
};

export const SET_SERVER_SESSION = 'INIT/SET_SERVER_SESSION';

export type SetServerSessionAction = {
  type: typeof SET_SERVER_SESSION;
  payload: {
    protocol: Protocol;
    session: ServerSession;
  };
};

import { type Prisma } from '@prisma/client';

// temporarily declaring this type
// Todo: check if you can import this type from anywhere
type ServerSession = {
  id: string;
  startTime: string;
  finishTime: string | null;
  exportTime: string | null;
  lastUpdated: string;
  network: Prisma.JsonValue;
  participantId: string;
  protocolId: string;
  currentStep: number;
  sessionMetadata?: Prisma.JsonValue;
};

type SerialisableProtocol = {
  id: string;
  name: string;
  description: string | null;
  hash: string;
  schemaVersion: number;
  stages: Prisma.JsonValue;
  codebook: Prisma.JsonValue;
  importedAt: string;
  lastModified: string;
};

export const SET_SERVER_SESSION = 'INIT/SET_SERVER_SESSION';

export type SetServerSessionAction = {
  type: typeof SET_SERVER_SESSION;
  payload: {
    protocol: SerialisableProtocol;
    session: ServerSession;
  };
};

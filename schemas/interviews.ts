import { type NcNetwork } from '@codaco/shared-consts';
import { type Participant, type Protocol } from '@prisma/client';
import { z } from 'zod';

export type DeleteInterviews = {
  id: string;
}[];

export type CreateInterview = {
  participantIdentifier?: Participant['identifier'];
  protocolId: Protocol['id'];
};

const NumberStringBoolean = z.union([z.number(), z.string(), z.boolean()]);
type NumberStringBoolean = z.infer<typeof NumberStringBoolean>;

export type SyncInterview = {
  id: string;
  network: NcNetwork;
  currentStep: number;
  stageMetadata?: Record<string, NumberStringBoolean[][]>;
  lastUpdated: string;
};

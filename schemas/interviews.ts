import { type Participant, type Protocol } from '~/lib/db/generated/prisma/client';
import { z } from 'zod';
import { type ZNcNetwork } from './network-canvas';

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
  network: z.infer<typeof ZNcNetwork>;
  currentStep: number;
  stageMetadata?: Record<string, NumberStringBoolean[][]>;
};

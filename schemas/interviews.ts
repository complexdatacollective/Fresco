import { z } from 'zod';
import { ZNcNetwork } from './network-canvas';

const deleteInterviewsSchema = z.array(
  z.object({
    id: z.string(),
  }),
);

export type DeleteInterviews = z.infer<typeof deleteInterviewsSchema>;

const createInterviewSchema = z.object({
  participantIdentifier: z.string().optional(),
  protocolId: z.string(),
});

export type CreateInterview = z.infer<typeof createInterviewSchema>;

const NumberStringBoolean = z.union([z.number(), z.string(), z.boolean()]);

const syncInterviewSchema = z.object({
  id: z.string(),
  network: ZNcNetwork,
  currentStep: z.number(),
  stageMetadata: z
    .record(z.string(), z.array(z.array(NumberStringBoolean)))
    .optional(), // Sorry about this. :/
});

export type SyncInterview = z.infer<typeof syncInterviewSchema>;

import { z } from 'zod';

export const UserValidation = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
  }),
);

export const ProtocolValidation = z.array(
  z.object({
    id: z.string(),
    hash: z.string(),
    name: z.string(),
    schemaVersion: z.number(),
    description: z.string(),
    assetPath: z.string(),
    importedAt: z.date(),
    lastModified: z.date(),
    stages: z.string(),
    ownerId: z.string(),
  }),
);

export const InterviewValidation = z.array(
  z.object({
    id: z.string(),
    startTime: z.date(),
    finishTime: z.date().nullable(),
    exportTime: z.date().nullable(),
    lastUpdated: z.date(),
    userId: z.string(),
    protocolId: z.string(),
    currentStep: z.number(),
    network: z.string(),
  }),
);

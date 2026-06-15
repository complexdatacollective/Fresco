import { z } from 'zod';

export const MAX_SYNTHETIC_INTERVIEWS = 1000;

export const generateSyntheticInterviewsSchema = z.object({
  protocolId: z.string().min(1),
  count: z.number().int().min(1).max(MAX_SYNTHETIC_INTERVIEWS),
  simulateDropOut: z.boolean().default(true),
  respectSkipLogicAndFiltering: z.boolean().default(false),
});

import { z } from 'zod';

export const generateSyntheticInterviewsSchema = z.object({
  protocolId: z.string().min(1),
  count: z.number().int().min(1).max(1000),
  simulateDropOut: z.boolean().default(true),
  respectSkipLogicAndFiltering: z.boolean().default(false),
});
